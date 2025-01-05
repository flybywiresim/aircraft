use core::panic;
use std::{f64::consts::PI, time::Duration};

use uom::si::{
    f64::*,
    pressure::psi,
    ratio::ratio,
    thermodynamic_temperature::degree_celsius,
    volume::{cubic_meter, gallon},
};

use systems::{
    accept_iterable,
    air_conditioning::PackFlowControllers,
    overhead::{AutoOffFaultPushButton, OnOffFaultPushButton},
    pneumatic::{
        valve::*, BleedMonitoringComputerIsAliveSignal, CompressionChamber,
        ControllablePneumaticValve, CrossBleedValveSelectorKnob, CrossBleedValveSelectorMode,
        DifferentialPressureTransducer, EngineCompressionChamberController, EngineModeSelector,
        EngineState, PneumaticContainer, PneumaticPipe, PneumaticValveSignal, Precooler,
        PressureTransducer, PressurisedReservoirWithExhaustValve, PressurizeableReservoir,
        TargetPressureTemperatureSignal, VariableVolumeContainer,
    },
    shared::{
        pid::PidController, update_iterator::MaxStepLoop, ControllerSignal, ElectricalBusType,
        ElectricalBuses, EngineBleedPushbutton, EngineCorrectedN1, EngineCorrectedN2,
        EngineFirePushButtons, EngineStartState, HydraulicColor, PackFlowValveState,
        PneumaticBleed, PneumaticValve, ReservoirAirPressure,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use crate::air_conditioning::A380AirConditioning;

macro_rules! valve_signal_implementation {
    ($signal_type: ty) => {
        impl PneumaticValveSignal for $signal_type {
            fn new(target_open_amount: Ratio) -> Self {
                Self { target_open_amount }
            }

            fn target_open_amount(&self) -> Ratio {
                self.target_open_amount
            }
        }
    };
}

struct HighPressureValveSignal {
    target_open_amount: Ratio,
}

struct PressureRegulatingValveSignal {
    target_open_amount: Ratio,
}

struct EngineStarterValveSignal {
    target_open_amount: Ratio,
}

#[derive(Clone, Copy, Debug, PartialEq)]
enum CrossBleedValveSignalType {
    Manual,
    Automatic,
}

struct CrossBleedValveSignal {
    target_open_amount: Ratio,
    signal_type: CrossBleedValveSignalType,
}
impl CrossBleedValveSignal {
    fn new(target_open_amount: Ratio, signal_type: CrossBleedValveSignalType) -> Self {
        Self {
            target_open_amount,
            signal_type,
        }
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }

    fn new_open(signal_type: CrossBleedValveSignalType) -> Self {
        Self::new(Ratio::new::<ratio>(1.), signal_type)
    }

    fn new_closed(signal_type: CrossBleedValveSignalType) -> Self {
        Self::new(Ratio::new::<ratio>(0.), signal_type)
    }
}

struct FanAirValveSignal {
    target_open_amount: Ratio,
}

struct PackFlowValveSignal {
    target_open_amount: Ratio,
}

valve_signal_implementation!(HighPressureValveSignal);
valve_signal_implementation!(PressureRegulatingValveSignal);
valve_signal_implementation!(EngineStarterValveSignal);
valve_signal_implementation!(FanAirValveSignal);
valve_signal_implementation!(PackFlowValveSignal);

pub struct A380Pneumatic {
    physics_updater: MaxStepLoop,

    apu_bleed_air_valve_open_id: VariableIdentifier,
    apu_bleed_air_pressure_id: VariableIdentifier,

    core_processing_input_output_module_a: CoreProcessingInputOutputModuleA,
    engine_systems: [EngineBleedAirSystem; 4],

    cross_bleed_valves: [CrossBleedValve; 3],

    fadec: FullAuthorityDigitalEngineControl,
    engine_starter_valve_controllers: [EngineStarterValveController; 4],

    apu_compression_chamber: CompressionChamber,
    apu_bleed_air_valve: DefaultValve,

    hydraulic_reservoir_bleed_air_valves: [PurelyPneumaticValve; 2],
    hydraulic_reservoir_bleed_air_pipe: PneumaticPipe,

    green_hydraulic_reservoir_with_valve:
        PressurisedReservoirWithExhaustValve<VariableVolumeContainer>,
    yellow_hydraulic_reservoir_with_valve:
        PressurisedReservoirWithExhaustValve<VariableVolumeContainer>,

    packs: [PackComplex; 2],
}
impl A380Pneumatic {
    const PNEUMATIC_SIM_MAX_TIME_STEP: Duration = Duration::from_millis(100);

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            physics_updater: MaxStepLoop::new(Self::PNEUMATIC_SIM_MAX_TIME_STEP),
            apu_bleed_air_valve_open_id: context
                .get_identifier("APU_BLEED_AIR_VALVE_OPEN".to_owned()),
            apu_bleed_air_pressure_id: context
                .get_identifier("PNEU_APU_BLEED_CONTAINER_PRESSURE".to_owned()),
            core_processing_input_output_module_a: CoreProcessingInputOutputModuleA::new(
                ElectricalBusType::DirectCurrentEssential, // TTM 2
            ),
            engine_systems: [
                EngineBleedAirSystem::new(context, 1, ElectricalBusType::DirectCurrent(1)),
                EngineBleedAirSystem::new(context, 2, ElectricalBusType::DirectCurrent(1)),
                EngineBleedAirSystem::new(context, 3, ElectricalBusType::DirectCurrent(2)),
                EngineBleedAirSystem::new(context, 4, ElectricalBusType::DirectCurrent(2)),
            ],
            cross_bleed_valves: [
                CrossBleedValve::new(context.get_identifier("PNEU_XBLEED_VALVE_L_OPEN".to_owned())),
                CrossBleedValve::new(context.get_identifier("PNEU_XBLEED_VALVE_C_OPEN".to_owned())),
                CrossBleedValve::new(context.get_identifier("PNEU_XBLEED_VALVE_R_OPEN".to_owned())),
            ],
            fadec: FullAuthorityDigitalEngineControl::new(context),
            engine_starter_valve_controllers: [
                EngineStarterValveController::new(1),
                EngineStarterValveController::new(2),
                EngineStarterValveController::new(3),
                EngineStarterValveController::new(4),
            ],
            apu_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(5.)),
            apu_bleed_air_valve: DefaultValve::new_closed(),
            hydraulic_reservoir_bleed_air_valves: [
                PurelyPneumaticValve::new(),
                PurelyPneumaticValve::new(),
            ],
            hydraulic_reservoir_bleed_air_pipe: PneumaticPipe::new(
                Volume::new::<cubic_meter>(0.2),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            green_hydraulic_reservoir_with_valve: PressurisedReservoirWithExhaustValve::new(
                context,
                HydraulicColor::Green,
                VariableVolumeContainer::new(
                    Volume::new::<gallon>(14.),
                    Pressure::new::<psi>(65.3),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
                Pressure::new::<psi>(75.42),
                6e-2,
            ),
            yellow_hydraulic_reservoir_with_valve: PressurisedReservoirWithExhaustValve::new(
                context,
                HydraulicColor::Yellow,
                VariableVolumeContainer::new(
                    Volume::new::<gallon>(14.),
                    Pressure::new::<psi>(65.),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
                Pressure::new::<psi>(75.42),
                6e-2,
            ),
            packs: [PackComplex::new(context, 1), PackComplex::new(context, 2)],
        }
    }

    pub(crate) fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&(impl EngineCorrectedN1 + EngineCorrectedN2); 4],
        pneumatic_overhead_panel: &A380PneumaticOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        apu: &impl ControllerSignal<TargetPressureTemperatureSignal>,
        pack_flow_valve_signals: &impl PackFlowControllers,
    ) {
        self.physics_updater.update(context);

        for cur_time_step in self.physics_updater {
            self.update_physics(
                &context.with_delta(cur_time_step),
                engines,
                pneumatic_overhead_panel,
                engine_fire_push_buttons,
                apu,
                pack_flow_valve_signals,
            );
        }
    }

    pub(crate) fn update_physics(
        &mut self,
        context: &UpdateContext,
        engines: [&(impl EngineCorrectedN1 + EngineCorrectedN2); 4],
        overhead_panel: &A380PneumaticOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        apu: &impl ControllerSignal<TargetPressureTemperatureSignal>,
        pack_flow_valve_signals: &impl PackFlowControllers,
    ) {
        self.apu_compression_chamber.update(apu);

        self.core_processing_input_output_module_a.update(
            context,
            &self.engine_systems,
            &self.apu_bleed_air_valve,
            overhead_panel,
            engine_fire_push_buttons,
        );

        for cross_bleed_valve in self.cross_bleed_valves.iter_mut() {
            // TODO: See TTM 3. There is a relay system that connects the 4 CPIOM units (PADS application) to the 3 crossbleed valves and the APU isolation valve
            // TLDR: CPIOM-A1+A2 control left xbleed and APU isolation valve, CPIOM-A3+A4 control center and right xbleed valve
            cross_bleed_valve
                .update_open_amount(&self.core_processing_input_output_module_a.units[0])
        }

        for controller in self.engine_starter_valve_controllers.iter_mut() {
            controller.update(&self.fadec);
        }

        for (index, (engine_system, cpiom_unit)) in self
            .engine_systems
            .iter_mut()
            .zip(&self.core_processing_input_output_module_a.units)
            .enumerate()
        {
            engine_system.update(
                context,
                cpiom_unit,
                cpiom_unit,
                &self.engine_starter_valve_controllers[index],
                cpiom_unit,
                engines[index],
            );
        }

        let [engine_1_system, engine_2_system, engine_3_system, engine_4_system] =
            &mut self.engine_systems;
        self.apu_bleed_air_valve.update_move_fluid(
            context,
            &mut self.apu_compression_chamber,
            engine_1_system,
        );

        // Hydraulic reservoir pressurization.
        // G+Y are pressurized through a pipe that is shared between engine 1 and engine 4 systems (downstream the bleed valve)
        // G+Y are also pressurized very directly:
        // Green is pressurized from upstream engine 1 HP valve
        // Yellow is pressurized from upstream engine 4 HP valve
        self.hydraulic_reservoir_bleed_air_valves[0].update_move_fluid(
            context,
            engine_1_system,
            &mut self.hydraulic_reservoir_bleed_air_pipe,
        );
        self.hydraulic_reservoir_bleed_air_valves[1].update_move_fluid(
            context,
            engine_4_system,
            &mut self.hydraulic_reservoir_bleed_air_pipe,
        );

        self.green_hydraulic_reservoir_with_valve
            .update_flow_through_valve(context, &mut self.hydraulic_reservoir_bleed_air_pipe);
        self.yellow_hydraulic_reservoir_with_valve
            .update_flow_through_valve(context, &mut self.hydraulic_reservoir_bleed_air_pipe);

        self.green_hydraulic_reservoir_with_valve
            .update_flow_through_valve(
                context,
                &mut engine_1_system.high_pressure_compression_chamber,
            );
        self.yellow_hydraulic_reservoir_with_valve
            .update_flow_through_valve(
                context,
                &mut engine_4_system.high_pressure_compression_chamber,
            );

        let [left_cross_bleed_valve, center_cross_bleed_valve, right_cross_bleed_valve] =
            &mut self.cross_bleed_valves;

        left_cross_bleed_valve.update_move_fluid(context, engine_1_system, engine_2_system);
        center_cross_bleed_valve.update_move_fluid(context, engine_1_system, engine_4_system);
        right_cross_bleed_valve.update_move_fluid(context, engine_3_system, engine_4_system);

        // PACKS
        let [pack_1, pack_2] = &mut self.packs;
        pack_1.update(
            context,
            engine_1_system,
            engine_2_system,
            pack_flow_valve_signals,
        );
        pack_2.update(
            context,
            engine_3_system,
            engine_4_system,
            pack_flow_valve_signals,
        );
    }

    // TODO: Returning a mutable reference here is not great. I was running into an issue with the update order:
    // - The APU turbine must know about the bleed valve being open as soon as possible to update EGT properly
    // - To open the bleed valve, we need a signal from the ecb
    // - To get a signal from the ECB to open the bleed valve, we have to update the APU.
    // For now, we just pass over control of the bleed valve to the APU, so it can be updated after the ECB update but before the turbine update.
    pub fn apu_bleed_air_valve(&mut self) -> &mut impl ControllablePneumaticValve {
        &mut self.apu_bleed_air_valve
    }

    pub fn update_hydraulic_reservoir_spatial_volumes(
        &mut self,
        green_hydraulic_reservoir: &impl PressurizeableReservoir,
        yellow_hydraulic_reservoir: &impl PressurizeableReservoir,
    ) {
        self.green_hydraulic_reservoir_with_valve
            .change_spatial_volume(green_hydraulic_reservoir.available_volume());
        self.yellow_hydraulic_reservoir_with_valve
            .change_spatial_volume(yellow_hydraulic_reservoir.available_volume());
    }

    pub fn packs(&mut self) -> &mut [PackComplex; 2] {
        &mut self.packs
    }
}
impl PneumaticBleed for A380Pneumatic {
    fn apu_bleed_is_on(&self) -> bool {
        self.apu_bleed_air_valve.is_open()
    }
    fn engine_crossbleed_is_on(&self) -> bool {
        // TODO: Change this interface. The air conditioning system needs to know the crossbleed valve state. I don't know how it works in the 380.
        self.cross_bleed_valves[1].is_open()
    }
}
impl EngineStartState for A380Pneumatic {
    fn engine_state(&self, engine_number: usize) -> EngineState {
        self.fadec.engine_state(engine_number)
    }
    fn engine_mode_selector(&self) -> EngineModeSelector {
        self.fadec.engine_mode_selector()
    }
}
impl PackFlowValveState for A380Pneumatic {
    // fcv_id: 1, 2, 3 or 4
    fn pack_flow_valve_is_open(&self, fcv_id: usize) -> bool {
        let id = A380AirConditioning::fcv_to_pack_id(fcv_id);
        if fcv_id % 2 == 0 {
            self.packs[id].right_pack_flow_valve_is_open()
        } else {
            self.packs[id].left_pack_flow_valve_is_open()
        }
    }
    fn pack_flow_valve_air_flow(&self, fcv_id: usize) -> MassRate {
        let id = A380AirConditioning::fcv_to_pack_id(fcv_id);
        if fcv_id % 2 == 0 {
            self.packs[id].right_pack_flow_valve_air_flow()
        } else {
            self.packs[id].left_pack_flow_valve_air_flow()
        }
    }
    fn pack_flow_valve_inlet_pressure(&self, fcv_id: usize) -> Option<Pressure> {
        let id = A380AirConditioning::fcv_to_pack_id(fcv_id);
        if fcv_id % 2 == 0 {
            self.packs[id].right_pack_flow_valve_inlet_pressure()
        } else {
            self.packs[id].left_pack_flow_valve_inlet_pressure()
        }
    }
}
impl SimulationElement for A380Pneumatic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fadec.accept(visitor);

        accept_iterable!(self.cross_bleed_valves, visitor);
        accept_iterable!(self.engine_systems, visitor);
        accept_iterable!(self.packs, visitor);

        self.yellow_hydraulic_reservoir_with_valve.accept(visitor);
        self.green_hydraulic_reservoir_with_valve.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.apu_bleed_air_valve_open_id,
            self.apu_bleed_air_valve.is_open(),
        );
        writer.write(
            &self.apu_bleed_air_pressure_id,
            self.apu_compression_chamber.pressure(),
        );
    }
}
impl ReservoirAirPressure for A380Pneumatic {
    fn green_reservoir_pressure(&self) -> Pressure {
        self.green_hydraulic_reservoir_with_valve.pressure()
    }

    fn blue_reservoir_pressure(&self) -> Pressure {
        Pressure::default()
    }

    fn yellow_reservoir_pressure(&self) -> Pressure {
        self.yellow_hydraulic_reservoir_with_valve.pressure()
    }
}

struct EngineStarterValveController {
    number: usize,
    engine_state: EngineState,
}
impl ControllerSignal<EngineStarterValveSignal> for EngineStarterValveController {
    fn signal(&self) -> Option<EngineStarterValveSignal> {
        match self.engine_state {
            EngineState::Starting => Some(EngineStarterValveSignal::new_open()),
            _ => Some(EngineStarterValveSignal::new_closed()),
        }
    }
}
impl EngineStarterValveController {
    fn new(number: usize) -> Self {
        Self {
            number,
            engine_state: EngineState::Off,
        }
    }

    fn update(&mut self, fadec: &FullAuthorityDigitalEngineControl) {
        self.engine_state = fadec.engine_state(self.number);
    }
}

/**
 * The CPIOM A. It consists of four individual units
 */
struct CoreProcessingInputOutputModuleA {
    units: [CoreProcessingInputOutputModuleAUnit; 4],
    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl CoreProcessingInputOutputModuleA {
    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            units: [
                CoreProcessingInputOutputModuleAUnit::new(1),
                CoreProcessingInputOutputModuleAUnit::new(2),
                CoreProcessingInputOutputModuleAUnit::new(3),
                CoreProcessingInputOutputModuleAUnit::new(4),
            ],
            powered_by,
            is_powered: true,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        sensors: &[EngineBleedAirSystem; 4],
        apu_bleed_valve: &impl PneumaticValve,
        pneumatic_overhead_panel: &A380PneumaticOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
    ) {
        for (unit, sensor) in self.units.iter_mut().zip(sensors) {
            unit.update(
                context,
                sensor,
                engine_fire_push_buttons.is_released(unit.engine_number),
                apu_bleed_valve,
                pneumatic_overhead_panel,
            );
        }
    }

    fn is_powered(&self) -> bool {
        self.is_powered
    }
}
impl SimulationElement for CoreProcessingInputOutputModuleA {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}
impl ControllerSignal<BleedMonitoringComputerIsAliveSignal> for CoreProcessingInputOutputModuleA {
    fn signal(&self) -> Option<BleedMonitoringComputerIsAliveSignal> {
        if self.is_powered() {
            Some(BleedMonitoringComputerIsAliveSignal)
        } else {
            None
        }
    }
}

struct CoreProcessingInputOutputModuleAUnit {
    engine_number: usize,
    pressure_regulating_valve_is_closed: bool,
    intermediate_pressure_compressor_pressure: Pressure,
    high_pressure_compressor_pressure: Pressure,
    transfer_pressure: Pressure,
    engine_starter_valve_is_open: bool,
    is_engine_bleed_pushbutton_auto: bool,
    is_engine_fire_pushbutton_released: bool,
    is_apu_bleed_valve_open: bool,
    is_apu_bleed_on: bool,
    is_any_bleed_pushbutton_off: bool,
    high_pressure_valve_pid: PidController,
    pressure_regulating_valve_pid: PidController,
    fan_air_valve_pid: PidController,
    cross_bleed_valve_selector: CrossBleedValveSelectorMode,
}
impl CoreProcessingInputOutputModuleAUnit {
    const PRESSURE_REGULATING_VALVE_TARGET_PSI: f64 = 40.; // FCOM

    fn new(engine_number: usize) -> Self {
        Self {
            engine_number,
            pressure_regulating_valve_is_closed: false,
            intermediate_pressure_compressor_pressure: Pressure::new::<psi>(0.),
            high_pressure_compressor_pressure: Pressure::new::<psi>(0.),
            transfer_pressure: Pressure::new::<psi>(0.),
            engine_starter_valve_is_open: false,
            is_engine_bleed_pushbutton_auto: true,
            is_engine_fire_pushbutton_released: false,
            is_apu_bleed_valve_open: false,
            is_apu_bleed_on: false,
            is_any_bleed_pushbutton_off: false,
            high_pressure_valve_pid: PidController::new(0.05, 0.05, 0., 0., 1., 50., 1.),
            pressure_regulating_valve_pid: PidController::new(
                0.1,
                0.05,
                0.,
                0.,
                1.,
                Self::PRESSURE_REGULATING_VALVE_TARGET_PSI,
                1.,
            ),
            fan_air_valve_pid: PidController::new(-0.005, -0.001, 0., 0., 1., 200., 1.),
            cross_bleed_valve_selector: CrossBleedValveSelectorMode::Auto,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        sensors: &EngineBleedAirSystem,
        is_engine_fire_pushbutton_released: bool,
        apu_bleed_valve: &impl PneumaticValve,
        pneumatic_overhead_panel: &A380PneumaticOverheadPanel,
    ) {
        self.intermediate_pressure_compressor_pressure = sensors.intermediate_pressure();
        self.high_pressure_compressor_pressure = sensors.high_pressure();
        self.transfer_pressure = sensors.transfer_pressure();

        self.pressure_regulating_valve_is_closed = !sensors.pressure_regulating_valve_is_open();

        if let Some(transfer_pressure_signal) = sensors.transfer_pressure_transducer_pressure() {
            self.high_pressure_valve_pid
                .next_control_output(transfer_pressure_signal.get::<psi>(), Some(context.delta()));
        }

        if let Some(regulated_pressure_signal) = sensors.regulated_pressure_transducer_pressure() {
            self.pressure_regulating_valve_pid.next_control_output(
                regulated_pressure_signal.get::<psi>(),
                Some(context.delta()),
            );
        }

        self.fan_air_valve_pid.next_control_output(
            sensors
                .precooler_outlet_temperature()
                .get::<degree_celsius>(),
            Some(context.delta()),
        );

        self.engine_starter_valve_is_open = sensors.engine_starter_valve_is_open();

        self.is_engine_bleed_pushbutton_auto =
            pneumatic_overhead_panel.engine_bleed_pb_is_auto(self.engine_number);
        self.is_engine_fire_pushbutton_released = is_engine_fire_pushbutton_released;

        self.is_any_bleed_pushbutton_off =
            (1..=4).any(|e| !pneumatic_overhead_panel.engine_bleed_pb_is_auto(e));

        self.is_apu_bleed_valve_open = apu_bleed_valve.is_open();
        self.is_apu_bleed_on = pneumatic_overhead_panel.apu_bleed_is_on();

        self.cross_bleed_valve_selector = pneumatic_overhead_panel.cross_bleed_mode();
    }

    fn should_close_pressure_regulating_valve_because_apu_bleed_is_on(&self) -> bool {
        self.is_apu_bleed_on && self.is_apu_bleed_valve_open
    }
}
impl ControllerSignal<HighPressureValveSignal> for CoreProcessingInputOutputModuleAUnit {
    fn signal(&self) -> Option<HighPressureValveSignal> {
        // TODO: Add overtemperature condition here
        if self.pressure_regulating_valve_is_closed
            || self.high_pressure_compressor_pressure < Pressure::new::<psi>(15.)
            || self.intermediate_pressure_compressor_pressure > Pressure::new::<psi>(33.5)
        {
            Some(HighPressureValveSignal::new_closed())
        } else {
            Some(HighPressureValveSignal::new(Ratio::new::<ratio>(
                self.high_pressure_valve_pid.output(),
            )))
        }
    }
}
impl ControllerSignal<PressureRegulatingValveSignal> for CoreProcessingInputOutputModuleAUnit {
    fn signal(&self) -> Option<PressureRegulatingValveSignal> {
        if self.transfer_pressure < Pressure::new::<psi>(15.)
            || (!self.is_engine_bleed_pushbutton_auto || self.is_engine_fire_pushbutton_released)
            || self.should_close_pressure_regulating_valve_because_apu_bleed_is_on()
            || self.engine_starter_valve_is_open
        {
            Some(PressureRegulatingValveSignal::new_closed())
        } else {
            Some(PressureRegulatingValveSignal::new(Ratio::new::<ratio>(
                self.pressure_regulating_valve_pid.output(),
            )))
        }
    }
}
impl ControllerSignal<FanAirValveSignal> for CoreProcessingInputOutputModuleAUnit {
    fn signal(&self) -> Option<FanAirValveSignal> {
        Some(FanAirValveSignal::new(Ratio::new::<ratio>(
            self.fan_air_valve_pid.output(),
        )))
    }
}
impl ControllerSignal<CrossBleedValveSignal> for CoreProcessingInputOutputModuleAUnit {
    fn signal(&self) -> Option<CrossBleedValveSignal> {
        match self.cross_bleed_valve_selector {
            CrossBleedValveSelectorMode::Shut => Some(CrossBleedValveSignal::new_closed(
                CrossBleedValveSignalType::Manual,
            )),
            CrossBleedValveSelectorMode::Open => Some(CrossBleedValveSignal::new_open(
                CrossBleedValveSignalType::Manual,
            )),
            CrossBleedValveSelectorMode::Auto => {
                if self.is_apu_bleed_valve_open || self.is_any_bleed_pushbutton_off {
                    Some(CrossBleedValveSignal::new_open(
                        CrossBleedValveSignalType::Automatic,
                    ))
                } else {
                    Some(CrossBleedValveSignal::new_closed(
                        CrossBleedValveSignalType::Automatic,
                    ))
                }
            }
        }
    }
}

struct EngineBleedAirSystem {
    high_pressure_id: VariableIdentifier,
    starter_container_pressure_id: VariableIdentifier,
    intermediate_temperature_id: VariableIdentifier,
    high_temperature_id: VariableIdentifier,
    transfer_temperature_id: VariableIdentifier,
    precooler_inlet_temperature_id: VariableIdentifier,
    precooler_outlet_temperature_id: VariableIdentifier,
    starter_container_temperature_id: VariableIdentifier,
    intermediate_pressure_valve_open_id: VariableIdentifier,
    high_pressure_valve_open_id: VariableIdentifier,
    pressure_regulating_valve_open_id: VariableIdentifier,
    starter_valve_open_id: VariableIdentifier,
    intermediate_pressure_transducer_pressure_id: VariableIdentifier,
    transfer_pressure_transducer_pressure_id: VariableIdentifier,
    regulated_pressure_transducer_pressure_id: VariableIdentifier,
    differential_pressure_transducer_pressure_id: VariableIdentifier,

    fan_compression_chamber_controller: EngineCompressionChamberController, // Controls pressure just behind the main fan
    intermediate_pressure_compression_chamber_controller: EngineCompressionChamberController,
    high_pressure_compression_chamber_controller: EngineCompressionChamberController,
    fan_compression_chamber: CompressionChamber,
    intermediate_pressure_compression_chamber: CompressionChamber,
    high_pressure_compression_chamber: CompressionChamber,
    intermediate_pressure_valve: PurelyPneumaticValve,
    high_pressure_valve: ElectroPneumaticValve,
    pressure_regulating_valve: ElectroPneumaticValve,
    transfer_pressure_pipe: PneumaticPipe,
    precooler_inlet_pipe: PneumaticPipe,
    precooler_outlet_pipe: PneumaticPipe,
    precooler_supply_pipe: PneumaticPipe,
    engine_starter_exhaust: PneumaticExhaust,
    engine_starter_container: PneumaticPipe,
    engine_starter_valve: DefaultValve,
    fan_air_valve: ElectroPneumaticValve,
    precooler: Precooler,

    intermediate_pressure_transducer: PressureTransducer,
    transfer_pressure_transducer: PressureTransducer,
    regulated_pressure_transducer: PressureTransducer,
    differential_pressure_transducer: DifferentialPressureTransducer,
}
impl EngineBleedAirSystem {
    fn new(context: &mut InitContext, number: usize, powered_by: ElectricalBusType) -> Self {
        Self {
            high_pressure_id: context.get_identifier(format!("PNEU_ENG_{}_HP_PRESSURE", number)),
            starter_container_pressure_id: context
                .get_identifier(format!("PNEU_ENG_{}_STARTER_CONTAINER_PRESSURE", number)),
            intermediate_temperature_id: context
                .get_identifier(format!("PNEU_ENG_{}_IP_TEMPERATURE", number)),
            high_temperature_id: context
                .get_identifier(format!("PNEU_ENG_{}_HP_TEMPERATURE", number)),
            transfer_temperature_id: context
                .get_identifier(format!("PNEU_ENG_{}_TRANSFER_TEMPERATURE", number)),
            precooler_inlet_temperature_id: context
                .get_identifier(format!("PNEU_ENG_{}_PRECOOLER_INLET_TEMPERATURE", number)),
            precooler_outlet_temperature_id: context
                .get_identifier(format!("PNEU_ENG_{}_PRECOOLER_OUTLET_TEMPERATURE", number)),
            starter_container_temperature_id: context
                .get_identifier(format!("PNEU_ENG_{}_STARTER_CONTAINER_TEMPERATURE", number)),
            intermediate_pressure_valve_open_id: context
                .get_identifier(format!("PNEU_ENG_{}_IP_VALVE_OPEN", number)),
            high_pressure_valve_open_id: context
                .get_identifier(format!("PNEU_ENG_{}_HP_VALVE_OPEN", number)),
            pressure_regulating_valve_open_id: context
                .get_identifier(format!("PNEU_ENG_{}_PR_VALVE_OPEN", number)),
            starter_valve_open_id: context
                .get_identifier(format!("PNEU_ENG_{}_STARTER_VALVE_OPEN", number)),
            intermediate_pressure_transducer_pressure_id: context.get_identifier(format!(
                "PNEU_ENG_{}_INTERMEDIATE_TRANSDUCER_PRESSURE",
                number
            )),
            transfer_pressure_transducer_pressure_id: context
                .get_identifier(format!("PNEU_ENG_{}_TRANSFER_TRANSDUCER_PRESSURE", number)),
            regulated_pressure_transducer_pressure_id: context
                .get_identifier(format!("PNEU_ENG_{}_REGULATED_TRANSDUCER_PRESSURE", number)),
            differential_pressure_transducer_pressure_id: context.get_identifier(format!(
                "PNEU_ENG_{}_DIFFERENTIAL_TRANSDUCER_PRESSURE",
                number
            )),
            // TODO: These constants are copied from the A320
            fan_compression_chamber_controller: EngineCompressionChamberController::new(2., 0.),
            intermediate_pressure_compression_chamber_controller:
                EngineCompressionChamberController::new(2.77366, 0.0667803),
            high_pressure_compression_chamber_controller: EngineCompressionChamberController::new(
                2.40411, 1.61386,
            ),
            fan_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(1.)),
            intermediate_pressure_compression_chamber: CompressionChamber::new(Volume::new::<
                cubic_meter,
            >(1.)),
            high_pressure_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(
                1.,
            )),
            intermediate_pressure_valve: PurelyPneumaticValve::new(),
            high_pressure_valve: ElectroPneumaticValve::new(powered_by),
            pressure_regulating_valve: ElectroPneumaticValve::new(powered_by),
            fan_air_valve: ElectroPneumaticValve::new(powered_by),
            transfer_pressure_pipe: PneumaticPipe::new(
                Volume::new::<cubic_meter>(1.),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            precooler_inlet_pipe: PneumaticPipe::new(
                Volume::new::<cubic_meter>(0.5),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            precooler_outlet_pipe: PneumaticPipe::new(
                Volume::new::<cubic_meter>(2.5),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            precooler_supply_pipe: PneumaticPipe::new(
                Volume::new::<cubic_meter>(1.),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            engine_starter_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(0.5),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            engine_starter_exhaust: PneumaticExhaust::new(3e-2, 3e-2, Pressure::new::<psi>(0.)),
            engine_starter_valve: DefaultValve::new_closed(),
            precooler: Precooler::new(180. * 2.),
            intermediate_pressure_transducer: PressureTransducer::new(powered_by),
            transfer_pressure_transducer: PressureTransducer::new(powered_by),
            regulated_pressure_transducer: PressureTransducer::new(powered_by),
            differential_pressure_transducer: DifferentialPressureTransducer::new(powered_by),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        high_pressure_valve_controller: &impl ControllerSignal<HighPressureValveSignal>,
        pressure_regulating_valve_controller: &impl ControllerSignal<PressureRegulatingValveSignal>,
        engine_starter_valve_controller: &impl ControllerSignal<EngineStarterValveSignal>,
        fan_air_valve_controller: &impl ControllerSignal<FanAirValveSignal>,
        engine: &(impl EngineCorrectedN1 + EngineCorrectedN2),
    ) {
        // Update engines
        self.fan_compression_chamber_controller
            .update(context, engine);
        self.intermediate_pressure_compression_chamber_controller
            .update(context, engine);
        self.high_pressure_compression_chamber_controller
            .update(context, engine);

        self.fan_compression_chamber
            .update(&self.fan_compression_chamber_controller);
        self.intermediate_pressure_compression_chamber
            .update(&self.intermediate_pressure_compression_chamber_controller);
        self.high_pressure_compression_chamber
            .update(&self.high_pressure_compression_chamber_controller);

        self.high_pressure_valve
            .update_open_amount(high_pressure_valve_controller);
        self.pressure_regulating_valve
            .update_open_amount(pressure_regulating_valve_controller);
        self.engine_starter_valve
            .update_open_amount(engine_starter_valve_controller);
        self.fan_air_valve
            .update_open_amount(fan_air_valve_controller);

        self.intermediate_pressure_valve.update_move_fluid(
            context,
            &mut self.intermediate_pressure_compression_chamber,
            &mut self.transfer_pressure_pipe,
        );
        self.high_pressure_valve.update_move_fluid(
            context,
            &mut self.high_pressure_compression_chamber,
            &mut self.transfer_pressure_pipe,
        );
        self.fan_air_valve.update_move_fluid(
            context,
            &mut self.fan_compression_chamber,
            &mut self.precooler_supply_pipe,
        );
        self.pressure_regulating_valve.update_move_fluid(
            context,
            &mut self.transfer_pressure_pipe,
            &mut self.precooler_inlet_pipe,
        );
        self.precooler.update(
            context,
            &mut self.precooler_inlet_pipe,
            &mut self.precooler_supply_pipe,
            &mut self.precooler_outlet_pipe,
        );
        self.engine_starter_valve.update_move_fluid(
            context,
            &mut self.precooler_inlet_pipe,
            &mut self.engine_starter_container,
        );
        self.engine_starter_exhaust
            .update_move_fluid(context, &mut self.engine_starter_container);

        self.intermediate_pressure_transducer
            .update(context, &self.intermediate_pressure_compression_chamber);
        self.transfer_pressure_transducer
            .update(context, &self.transfer_pressure_pipe);
        self.regulated_pressure_transducer
            .update(context, &self.precooler_inlet_pipe);
        self.differential_pressure_transducer
            .update(&self.precooler_inlet_pipe, &self.precooler_outlet_pipe);
    }

    fn intermediate_pressure(&self) -> Pressure {
        self.intermediate_pressure_compression_chamber.pressure()
    }

    fn high_pressure(&self) -> Pressure {
        self.high_pressure_compression_chamber.pressure()
    }

    fn transfer_pressure(&self) -> Pressure {
        self.transfer_pressure_pipe.pressure()
    }

    #[cfg(test)]
    fn precooler_inlet_pressure(&self) -> Pressure {
        self.precooler_inlet_pipe.pressure()
    }

    #[cfg(test)]
    fn precooler_outlet_pressure(&self) -> Pressure {
        self.precooler_outlet_pipe.pressure()
    }

    fn intermediate_temperature(&self) -> ThermodynamicTemperature {
        self.intermediate_pressure_compression_chamber.temperature()
    }

    fn high_temperature(&self) -> ThermodynamicTemperature {
        self.high_pressure_compression_chamber.temperature()
    }

    fn transfer_temperature(&self) -> ThermodynamicTemperature {
        self.transfer_pressure_pipe.temperature()
    }

    fn precooler_inlet_temperature(&self) -> ThermodynamicTemperature {
        self.precooler_inlet_pipe.temperature()
    }

    fn precooler_outlet_temperature(&self) -> ThermodynamicTemperature {
        self.precooler_outlet_pipe.temperature()
    }

    fn engine_starter_valve_is_open(&self) -> bool {
        self.engine_starter_valve.is_open()
    }

    fn pressure_regulating_valve_is_open(&self) -> bool {
        self.pressure_regulating_valve.is_open()
    }

    fn intermediate_pressure_transducer_pressure(&self) -> Option<Pressure> {
        self.intermediate_pressure_transducer.signal()
    }

    fn transfer_pressure_transducer_pressure(&self) -> Option<Pressure> {
        self.transfer_pressure_transducer.signal()
    }

    fn regulated_pressure_transducer_pressure(&self) -> Option<Pressure> {
        self.regulated_pressure_transducer.signal()
    }

    fn differential_pressure_transducer_pressure(&self) -> Option<Pressure> {
        self.differential_pressure_transducer.signal()
    }
}
impl SimulationElement for EngineBleedAirSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.high_pressure_valve.accept(visitor);
        self.pressure_regulating_valve.accept(visitor);
        self.fan_air_valve.accept(visitor);

        self.intermediate_pressure_transducer.accept(visitor);
        self.transfer_pressure_transducer.accept(visitor);
        self.regulated_pressure_transducer.accept(visitor);
        self.differential_pressure_transducer.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.intermediate_pressure_transducer_pressure_id,
            self.intermediate_pressure_transducer_pressure()
                .map_or(-1., |p| p.get::<psi>()),
        );
        writer.write(&self.high_pressure_id, self.high_pressure());
        writer.write(
            &self.transfer_pressure_transducer_pressure_id,
            self.transfer_pressure_transducer_pressure()
                .map_or(-1., |p| p.get::<psi>()),
        );
        writer.write(
            &self.regulated_pressure_transducer_pressure_id,
            self.regulated_pressure_transducer_pressure()
                .map_or(-1., |p| p.get::<psi>()),
        );
        writer.write(
            &self.differential_pressure_transducer_pressure_id,
            self.differential_pressure_transducer_pressure()
                .map_or(-1., |p| p.get::<psi>()),
        );
        writer.write(
            &self.starter_container_pressure_id,
            self.engine_starter_container.pressure(),
        );
        writer.write(
            &self.intermediate_temperature_id,
            self.intermediate_temperature(),
        );
        writer.write(&self.high_temperature_id, self.high_temperature());
        writer.write(&self.transfer_temperature_id, self.transfer_temperature());
        writer.write(
            &self.precooler_inlet_temperature_id,
            self.precooler_inlet_temperature(),
        );
        writer.write(
            &self.precooler_outlet_temperature_id,
            self.precooler_outlet_temperature(),
        );
        writer.write(
            &self.starter_container_temperature_id,
            self.engine_starter_container.temperature(),
        );
        writer.write(
            &self.intermediate_pressure_valve_open_id,
            self.intermediate_pressure_valve.is_open(),
        );
        writer.write(
            &self.high_pressure_valve_open_id,
            self.high_pressure_valve.is_open(),
        );
        writer.write(
            &self.pressure_regulating_valve_open_id,
            self.pressure_regulating_valve.is_open(),
        );
        writer.write(
            &self.starter_valve_open_id,
            self.engine_starter_valve.is_open(),
        );
    }
}
impl PneumaticContainer for EngineBleedAirSystem {
    fn pressure(&self) -> Pressure {
        self.precooler_outlet_pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.precooler_outlet_pipe.volume()
    }

    fn temperature(&self) -> ThermodynamicTemperature {
        self.precooler_outlet_pipe.temperature()
    }

    fn mass(&self) -> Mass {
        self.precooler_outlet_pipe.mass()
    }

    fn change_fluid_amount(
        &mut self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    ) {
        self.precooler_outlet_pipe.change_fluid_amount(
            fluid_amount,
            fluid_temperature,
            fluid_pressure,
        )
    }

    fn update_temperature(&mut self, temperature: TemperatureInterval) {
        self.precooler_outlet_pipe.update_temperature(temperature);
    }
}

pub struct A380PneumaticOverheadPanel {
    apu_bleed: OnOffFaultPushButton,
    cross_bleed: CrossBleedValveSelectorKnob,
    engine_1_bleed: AutoOffFaultPushButton,
    engine_2_bleed: AutoOffFaultPushButton,
    engine_3_bleed: AutoOffFaultPushButton,
    engine_4_bleed: AutoOffFaultPushButton,
}
impl A380PneumaticOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        A380PneumaticOverheadPanel {
            apu_bleed: OnOffFaultPushButton::new_on(context, "PNEU_APU_BLEED"),
            cross_bleed: CrossBleedValveSelectorKnob::new_auto(context),
            engine_1_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_1_BLEED"),
            engine_2_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_2_BLEED"),
            engine_3_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_3_BLEED"),
            engine_4_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_4_BLEED"),
        }
    }

    pub fn apu_bleed_is_on(&self) -> bool {
        self.apu_bleed.is_on()
    }

    pub fn cross_bleed_mode(&self) -> CrossBleedValveSelectorMode {
        self.cross_bleed.mode()
    }

    pub fn engine_bleed_pb_is_auto(&self, engine_number: usize) -> bool {
        match engine_number {
            1 => self.engine_1_bleed.is_auto(),
            2 => self.engine_2_bleed.is_auto(),
            3 => self.engine_3_bleed.is_auto(),
            4 => self.engine_4_bleed.is_auto(),
            _ => panic!("Invalid engine number"),
        }
    }
}
impl EngineBleedPushbutton<4> for A380PneumaticOverheadPanel {
    fn engine_bleed_pushbuttons_are_auto(&self) -> [bool; 4] {
        [
            self.engine_1_bleed.is_auto(),
            self.engine_2_bleed.is_auto(),
            self.engine_3_bleed.is_auto(),
            self.engine_4_bleed.is_auto(),
        ]
    }
}
impl SimulationElement for A380PneumaticOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_bleed.accept(visitor);
        self.cross_bleed.accept(visitor);
        self.engine_1_bleed.accept(visitor);
        self.engine_2_bleed.accept(visitor);
        self.engine_3_bleed.accept(visitor);
        self.engine_4_bleed.accept(visitor);

        visitor.visit(self);
    }
}

/// We use this simply as an interface to engine parameter simvars. It should probably not be part of the pneumatic system.
pub struct FullAuthorityDigitalEngineControl {
    engine_1_state_id: VariableIdentifier,
    engine_2_state_id: VariableIdentifier,
    engine_3_state_id: VariableIdentifier,
    engine_4_state_id: VariableIdentifier,

    engine_1_state: EngineState,
    engine_2_state: EngineState,
    engine_3_state: EngineState,
    engine_4_state: EngineState,

    engine_mode_selector1_id: VariableIdentifier,
    engine_mode_selector1_position: EngineModeSelector,
}
impl FullAuthorityDigitalEngineControl {
    fn new(context: &mut InitContext) -> Self {
        Self {
            engine_1_state_id: context.get_identifier("ENGINE_STATE:1".to_owned()),
            engine_2_state_id: context.get_identifier("ENGINE_STATE:2".to_owned()),
            engine_3_state_id: context.get_identifier("ENGINE_STATE:3".to_owned()),
            engine_4_state_id: context.get_identifier("ENGINE_STATE:4".to_owned()),
            engine_1_state: EngineState::Off,
            engine_2_state: EngineState::Off,
            engine_3_state: EngineState::Off,
            engine_4_state: EngineState::Off,
            engine_mode_selector1_id: context
                .get_identifier("TURB ENG IGNITION SWITCH EX1:1".to_owned()),
            engine_mode_selector1_position: EngineModeSelector::Norm,
        }
    }

    fn engine_state(&self, number: usize) -> EngineState {
        match number {
            1 => self.engine_1_state,
            2 => self.engine_2_state,
            3 => self.engine_3_state,
            4 => self.engine_4_state,
            _ => panic!("Invalid engine number"),
        }
    }

    fn engine_mode_selector(&self) -> EngineModeSelector {
        self.engine_mode_selector1_position
    }
}
impl SimulationElement for FullAuthorityDigitalEngineControl {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.engine_1_state = reader.read(&self.engine_1_state_id);
        self.engine_2_state = reader.read(&self.engine_2_state_id);
        self.engine_3_state = reader.read(&self.engine_3_state_id);
        self.engine_4_state = reader.read(&self.engine_4_state_id);
        self.engine_mode_selector1_position = reader.read(&self.engine_mode_selector1_id);
    }
}

/// A struct to hold all the pack related components
pub struct PackComplex {
    pack_number: usize,
    left_pack_flow_valve_id: VariableIdentifier,
    right_pack_flow_valve_id: VariableIdentifier,
    left_pack_flow_valve_flow_rate_id: VariableIdentifier,
    right_pack_flow_valve_flow_rate_id: VariableIdentifier,
    pack_container: PneumaticPipe,
    exhaust: PneumaticExhaust,
    left_pack_flow_valve: ElectroPneumaticValve,
    right_pack_flow_valve: ElectroPneumaticValve,
    left_inlet_pressure_sensor: PressureTransducer,
    right_inlet_pressure_sensor: PressureTransducer,
}
impl PackComplex {
    fn new(context: &mut InitContext, pack_number: usize) -> Self {
        Self {
            pack_number,
            left_pack_flow_valve_id: context
                .get_identifier(format!("COND_PACK_{}_FLOW_VALVE_1_IS_OPEN", pack_number)),
            right_pack_flow_valve_id: context
                .get_identifier(format!("COND_PACK_{}_FLOW_VALVE_2_IS_OPEN", pack_number)),
            left_pack_flow_valve_flow_rate_id: context
                .get_identifier(format!("PNEU_PACK_{}_FLOW_VALVE_1_FLOW_RATE", pack_number)),
            right_pack_flow_valve_flow_rate_id: context
                .get_identifier(format!("PNEU_PACK_{}_FLOW_VALVE_2_FLOW_RATE", pack_number)),
            pack_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(2.),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            exhaust: PneumaticExhaust::new(0.3, 0.3, Pressure::new::<psi>(0.)),
            // These valves are pneumatically operated but will fall closed in case of reverse flow.
            // They can also be electrically closed by DC ESS BUS.
            left_pack_flow_valve: ElectroPneumaticValve::new(
                ElectricalBusType::DirectCurrentEssential,
            ),
            right_pack_flow_valve: ElectroPneumaticValve::new(
                ElectricalBusType::DirectCurrentEssential,
            ),
            left_inlet_pressure_sensor: PressureTransducer::new(
                ElectricalBusType::DirectCurrentEssential, // TODO: This is almost definitely not correct, just copied from the A320
            ),
            right_inlet_pressure_sensor: PressureTransducer::new(
                ElectricalBusType::DirectCurrentEssential, // TODO: This is almost definitely not correct, just copied from the A320
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        left_input: &mut impl PneumaticContainer,
        right_input: &mut impl PneumaticContainer,
        pack_flow_valve_signals: &impl PackFlowControllers,
    ) {
        self.left_pack_flow_valve.update_open_amount(
            pack_flow_valve_signals
                .pack_flow_controller(1 + ((self.pack_number == 2) as usize * 2)),
        );

        self.right_pack_flow_valve.update_open_amount(
            pack_flow_valve_signals
                .pack_flow_controller(2 + ((self.pack_number == 2) as usize * 2)),
        );

        self.left_pack_flow_valve
            .update_move_fluid(context, left_input, &mut self.pack_container);

        self.right_pack_flow_valve.update_move_fluid(
            context,
            right_input,
            &mut self.pack_container,
        );

        self.exhaust
            .update_move_fluid(context, &mut self.pack_container);
    }

    fn left_pack_flow_valve_is_open(&self) -> bool {
        self.left_pack_flow_valve.is_open()
    }

    fn right_pack_flow_valve_is_open(&self) -> bool {
        self.right_pack_flow_valve.is_open()
    }

    fn left_pack_flow_valve_air_flow(&self) -> MassRate {
        self.left_pack_flow_valve.fluid_flow()
    }

    fn right_pack_flow_valve_air_flow(&self) -> MassRate {
        self.right_pack_flow_valve.fluid_flow()
    }

    fn left_pack_flow_valve_inlet_pressure(&self) -> Option<Pressure> {
        self.left_inlet_pressure_sensor.signal()
    }

    fn right_pack_flow_valve_inlet_pressure(&self) -> Option<Pressure> {
        self.right_inlet_pressure_sensor.signal()
    }
}
impl PneumaticContainer for PackComplex {
    fn pressure(&self) -> Pressure {
        self.pack_container.pressure()
    }

    fn volume(&self) -> Volume {
        self.pack_container.volume()
    }

    fn temperature(&self) -> ThermodynamicTemperature {
        self.pack_container.temperature()
    }

    fn mass(&self) -> Mass {
        self.pack_container.mass()
    }

    fn change_fluid_amount(
        &mut self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    ) {
        self.pack_container
            .change_fluid_amount(fluid_amount, fluid_temperature, fluid_pressure);
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        self.pack_container.update_temperature(temperature_change);
    }
}
impl SimulationElement for PackComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        self.left_pack_flow_valve.accept(visitor);
        self.right_pack_flow_valve.accept(visitor);

        self.left_inlet_pressure_sensor.accept(visitor);
        self.right_inlet_pressure_sensor.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.left_pack_flow_valve_id,
            self.left_pack_flow_valve_is_open(),
        );
        writer.write(
            &self.right_pack_flow_valve_id,
            self.right_pack_flow_valve_is_open(),
        );
        writer.write(
            &self.left_pack_flow_valve_flow_rate_id,
            self.left_pack_flow_valve.fluid_flow(),
        );
        writer.write(
            &self.right_pack_flow_valve_flow_rate_id,
            self.right_pack_flow_valve.fluid_flow(),
        );
    }
}

/// This is a unique valve (and specific to the A320 probably) because it is controlled by two motors. One for manual control and one for automatic control
pub struct CrossBleedValve {
    valve_id: VariableIdentifier,

    open_amount: Ratio,
    connector: PneumaticContainerConnector,
    is_powered_for_manual_control: bool,
    is_powered_for_automatic_control: bool,
}
impl CrossBleedValve {
    const SPRING_CHARACTERISTIC: f64 = 1.;

    pub fn new(valve_id: VariableIdentifier) -> Self {
        Self {
            valve_id,
            open_amount: Ratio::new::<ratio>(0.),
            connector: PneumaticContainerConnector::new(),
            is_powered_for_manual_control: false,
            is_powered_for_automatic_control: false,
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
    ) {
        if !self.is_powered_for_manual_control && !self.is_powered_for_automatic_control {
            self.set_open_amount_from_pressure_difference(
                container_one.pressure() - container_two.pressure(),
            )
        }

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, container_one, container_two);
    }

    fn set_open_amount_from_pressure_difference(&mut self, pressure_difference: Pressure) {
        self.open_amount = Ratio::new::<ratio>(
            2. / PI
                * (pressure_difference.get::<psi>() * Self::SPRING_CHARACTERISTIC)
                    .atan()
                    .max(0.),
        );
    }

    fn update_open_amount(&mut self, controller: &impl ControllerSignal<CrossBleedValveSignal>) {
        if let Some(signal) = controller.signal() {
            if signal.signal_type == CrossBleedValveSignalType::Manual
                && self.is_powered_for_manual_control
                || signal.signal_type == CrossBleedValveSignalType::Automatic
                    && self.is_powered_for_automatic_control
            {
                self.open_amount = signal.target_open_amount()
            }
        }
    }
}
impl PneumaticValve for CrossBleedValve {
    fn is_open(&self) -> bool {
        self.open_amount.get::<ratio>() > 0.
    }
}
impl SimulationElement for CrossBleedValve {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered_for_manual_control =
            buses.is_powered(ElectricalBusType::DirectCurrentEssentialShed);
        self.is_powered_for_automatic_control =
            buses.is_powered(ElectricalBusType::DirectCurrent(2));
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.valve_id, self.is_open());
    }
}

#[cfg(test)]
mod tests {
    use ntest::assert_about_eq;
    use rstest::rstest;
    use systems::{
        air_conditioning::{AdirsToAirCondInterface, PackFlowControllers},
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        engine::trent_engine::TrentEngine,
        failures::FailureType,
        payload::NumberOfPassengers,
        pneumatic::{
            ControllablePneumaticValve, CrossBleedValveSelectorMode, EngineState,
            PneumaticContainer, PneumaticValveSignal, TargetPressureTemperatureSignal,
        },
        shared::{
            arinc429::{Arinc429Word, SignStatus},
            ApuBleedAirValveSignal, CargoDoorLocked, ControllerSignal, ElectricalBusType,
            ElectricalBuses, EmergencyElectricalState, EngineBleedPushbutton, EngineCorrectedN1,
            EngineFirePushButtons, EngineStartState, HydraulicColor,
            InternationalStandardAtmosphere, LgciuWeightOnWheels, MachNumber, PackFlowValveState,
            PneumaticBleed, PneumaticValve, PotentialOrigin,
        },
        simulation::{
            test::{SimulationTestBed, TestBed, WriteByName},
            Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };

    use std::{fs, fs::File, time::Duration};

    use uom::si::{
        f64::*, length::foot, mass_rate::kilogram_per_second, pressure::psi, ratio::ratio,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    use crate::{
        air_conditioning::{A380AirConditioning, A380PressurizationOverheadPanel},
        avionics_data_communication_network::A380AvionicsDataCommunicationNetwork,
    };

    use super::{A380Pneumatic, A380PneumaticOverheadPanel};

    struct TestAirConditioning {
        air_conditioning: A380AirConditioning,
        adcn: A380AvionicsDataCommunicationNetwork,
        adirs: TestAdirs,
        dsms: TestDsms,
        payload: TestPayload,
        pressurization_overhead: A380PressurizationOverheadPanel,
    }
    impl TestAirConditioning {
        fn new(context: &mut InitContext) -> Self {
            Self {
                air_conditioning: A380AirConditioning::new(context),
                adcn: A380AvionicsDataCommunicationNetwork::new(context),
                adirs: TestAdirs::new(),
                dsms: TestDsms {},
                payload: TestPayload {},
                pressurization_overhead: A380PressurizationOverheadPanel::new(context),
            }
        }
        fn update(
            &mut self,
            context: &UpdateContext,
            engines: [&impl EngineCorrectedN1; 4],
            engine_fire_push_buttons: &impl EngineFirePushButtons,
            pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
            pneumatic_overhead: &impl EngineBleedPushbutton<4>,
            lgciu: [&impl LgciuWeightOnWheels; 2],
        ) {
            self.air_conditioning.update(
                context,
                &self.adirs,
                &self.dsms,
                &self.adcn,
                engines,
                engine_fire_push_buttons,
                &self.payload,
                pneumatic,
                pneumatic_overhead,
                &self.pressurization_overhead,
                lgciu,
            );
        }
    }
    impl PackFlowControllers for TestAirConditioning {
        type PackFlowControllerSignal =
            <A380AirConditioning as PackFlowControllers>::PackFlowControllerSignal;

        fn pack_flow_controller(&self, fcv_id: usize) -> &Self::PackFlowControllerSignal {
            self.air_conditioning.pack_flow_controller(fcv_id)
        }
    }
    impl SimulationElement for TestAirConditioning {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.air_conditioning.accept(visitor);
            self.adcn.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestAdirs {
        ground_speed: Velocity,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                ground_speed: Velocity::default(),
            }
        }
    }
    impl AdirsToAirCondInterface for TestAdirs {
        fn ground_speed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.ground_speed, SignStatus::NormalOperation)
        }
        fn true_airspeed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(Velocity::default(), SignStatus::NoComputedData)
        }
        fn baro_correction(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(Pressure::default(), SignStatus::NoComputedData)
        }
        fn ambient_static_pressure(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(Pressure::default(), SignStatus::NoComputedData)
        }
    }

    struct TestDsms {}

    impl CargoDoorLocked for TestDsms {
        fn aft_cargo_door_locked(&self) -> bool {
            true
        }
        fn fwd_cargo_door_locked(&self) -> bool {
            true
        }
    }

    struct TestPayload;
    impl NumberOfPassengers for TestPayload {
        fn number_of_passengers(&self, _ps: usize) -> i8 {
            0
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }
    }
    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
    }

    struct TestApu {
        bleed_air_valve_signal: ApuBleedAirValveSignal,
        bleed_air_pressure: Pressure,
        bleed_air_temperature: ThermodynamicTemperature,
    }
    impl TestApu {
        fn new() -> Self {
            Self {
                bleed_air_valve_signal: ApuBleedAirValveSignal::new_closed(),
                bleed_air_pressure: Pressure::new::<psi>(14.7),
                bleed_air_temperature: ThermodynamicTemperature::new::<degree_celsius>(15.),
            }
        }

        fn update(&self, bleed_valve: &mut impl ControllablePneumaticValve) {
            bleed_valve.update_open_amount::<ApuBleedAirValveSignal, Self>(self);
        }

        fn set_bleed_air_pressure(&mut self, pressure: Pressure) {
            self.bleed_air_pressure = pressure;
        }

        fn set_bleed_air_temperature(&mut self, temperature: ThermodynamicTemperature) {
            self.bleed_air_temperature = temperature;
        }

        fn set_bleed_air_valve_signal(&mut self, signal: ApuBleedAirValveSignal) {
            self.bleed_air_valve_signal = signal;
        }
    }
    impl ControllerSignal<ApuBleedAirValveSignal> for TestApu {
        fn signal(&self) -> Option<ApuBleedAirValveSignal> {
            Some(self.bleed_air_valve_signal)
        }
    }
    impl ControllerSignal<TargetPressureTemperatureSignal> for TestApu {
        fn signal(&self) -> Option<TargetPressureTemperatureSignal> {
            Some(TargetPressureTemperatureSignal::new(
                self.bleed_air_pressure,
                self.bleed_air_temperature,
            ))
        }
    }

    struct TestEngineFirePushButtons {
        is_released: [bool; 4],
    }
    impl TestEngineFirePushButtons {
        fn new() -> Self {
            Self {
                is_released: [false; 4],
            }
        }

        fn release(&mut self, engine_number: usize) {
            self.is_released[engine_number - 1] = true;
        }
    }
    impl EngineFirePushButtons for TestEngineFirePushButtons {
        fn is_released(&self, engine_number: usize) -> bool {
            self.is_released[engine_number - 1]
        }
    }

    struct A380TestElectrical {
        airspeed: Velocity,
        all_ac_lost: bool,
    }
    impl A380TestElectrical {
        pub fn new() -> Self {
            A380TestElectrical {
                airspeed: Velocity::new::<knot>(100.),
                all_ac_lost: false,
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.airspeed = context.indicated_airspeed();
        }
    }
    impl EmergencyElectricalState for A380TestElectrical {
        fn is_in_emergency_elec(&self) -> bool {
            self.all_ac_lost && self.airspeed >= Velocity::new::<knot>(100.)
        }
    }
    impl SimulationElement for A380TestElectrical {
        fn receive_power(&mut self, buses: &impl ElectricalBuses) {
            self.all_ac_lost = !buses.is_powered(ElectricalBusType::AlternatingCurrent(1))
                && !buses.is_powered(ElectricalBusType::AlternatingCurrent(2));
        }
    }

    struct PneumaticTestAircraft {
        pneumatic: A380Pneumatic,
        air_conditioning: TestAirConditioning,
        lgciu: TestLgciu,
        apu: TestApu,
        engine_1: TrentEngine,
        engine_2: TrentEngine,
        engine_3: TrentEngine,
        engine_4: TrentEngine,
        pneumatic_overhead_panel: A380PneumaticOverheadPanel,
        fire_pushbuttons: TestEngineFirePushButtons,
        electrical: A380TestElectrical,
        powered_source: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,
        dc_ess_shed_bus: ElectricalBus,
        ac_1_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        ac_4_bus: ElectricalBus,
        // Electric buses states to be able to kill them dynamically
        is_dc_1_powered: bool,
        is_dc_2_powered: bool,
        is_dc_ess_powered: bool,
        is_dc_ess_shed_powered: bool,
        is_ac_1_powered: bool,
        is_ac_2_powered: bool,
    }
    impl PneumaticTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                pneumatic: A380Pneumatic::new(context),
                air_conditioning: TestAirConditioning::new(context),
                lgciu: TestLgciu::new(true),
                apu: TestApu::new(),
                engine_1: TrentEngine::new(context, 1),
                engine_2: TrentEngine::new(context, 2),
                engine_3: TrentEngine::new(context, 3),
                engine_4: TrentEngine::new(context, 4),
                pneumatic_overhead_panel: A380PneumaticOverheadPanel::new(context),
                fire_pushbuttons: TestEngineFirePushButtons::new(),
                electrical: A380TestElectrical::new(),
                powered_source: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_ess_shed_bus: ElectricalBus::new(
                    context,
                    ElectricalBusType::DirectCurrentEssentialShed,
                ),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
                ac_4_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(4)),
                is_dc_1_powered: true,
                is_dc_2_powered: true,
                is_dc_ess_powered: true,
                is_dc_ess_shed_powered: true,
                is_ac_1_powered: true,
                is_ac_2_powered: true,
            }
        }

        fn set_dc_ess_shed_bus_power(&mut self, is_powered: bool) {
            self.is_dc_ess_shed_powered = is_powered;
        }
    }
    impl Aircraft for PneumaticTestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_source);

            if self.is_dc_1_powered {
                electricity.flow(&self.powered_source, &self.dc_1_bus);
            }

            if self.is_dc_2_powered {
                electricity.flow(&self.powered_source, &self.dc_2_bus);
            }

            if self.is_dc_ess_powered {
                electricity.flow(&self.powered_source, &self.dc_ess_bus);
            }

            if self.is_dc_ess_shed_powered {
                electricity.flow(&self.powered_source, &self.dc_ess_shed_bus);
            }

            if self.is_ac_1_powered {
                electricity.flow(&self.powered_source, &self.ac_1_bus);
            }

            if self.is_ac_2_powered {
                electricity.flow(&self.powered_source, &self.ac_2_bus);
                electricity.flow(&self.powered_source, &self.ac_4_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.electrical.update(context);

            self.apu.update(self.pneumatic.apu_bleed_air_valve());
            self.pneumatic.update(
                context,
                [
                    &self.engine_1,
                    &self.engine_2,
                    &self.engine_3,
                    &self.engine_4,
                ],
                &self.pneumatic_overhead_panel,
                &self.fire_pushbuttons,
                &self.apu,
                &self.air_conditioning,
            );
            self.air_conditioning.update(
                context,
                [
                    &self.engine_1,
                    &self.engine_2,
                    &self.engine_3,
                    &self.engine_4,
                ],
                &self.fire_pushbuttons,
                &self.pneumatic,
                &self.pneumatic_overhead_panel,
                [&self.lgciu; 2],
            )
        }
    }
    impl SimulationElement for PneumaticTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.electrical.accept(visitor);
            self.pneumatic.accept(visitor);
            self.engine_1.accept(visitor);
            self.engine_2.accept(visitor);
            self.engine_3.accept(visitor);
            self.engine_4.accept(visitor);
            self.pneumatic_overhead_panel.accept(visitor);
            self.air_conditioning.accept(visitor);

            visitor.visit(self);
        }
    }
    struct PneumaticTestBed {
        test_bed: SimulationTestBed<PneumaticTestAircraft>,
    }
    impl TestBed for PneumaticTestBed {
        type Aircraft = PneumaticTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<PneumaticTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<PneumaticTestAircraft> {
            &mut self.test_bed
        }
    }
    impl PneumaticTestBed {
        fn new() -> Self {
            let mut test_bed = Self {
                test_bed: SimulationTestBed::<PneumaticTestAircraft>::new(|context| {
                    PneumaticTestAircraft::new(context)
                }),
            };
            test_bed.command_pack_flow_selector_position(1);

            test_bed
        }

        fn and_run(mut self) -> Self {
            self.run();

            self
        }

        fn and_stabilize(mut self) -> Self {
            self.test_bed.run_multiple_frames(Duration::from_secs(16));

            self
        }

        fn mach_number(mut self, mach: MachNumber) -> Self {
            self.write_by_name("AIRSPEED MACH", mach);

            self
        }

        fn in_isa_atmosphere(mut self, altitude: Length) -> Self {
            self.set_pressure_altitude(altitude);
            self.set_ambient_pressure(InternationalStandardAtmosphere::pressure_at_altitude(
                altitude,
            ));
            self.set_ambient_temperature(InternationalStandardAtmosphere::temperature_at_altitude(
                altitude,
            ));

            self
        }

        fn idle_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.55));
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.2));
            self.write_by_name("ENGINE_STATE:1", EngineState::On);

            self
        }

        fn idle_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.55));
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.2));
            self.write_by_name("ENGINE_STATE:2", EngineState::On);

            self
        }

        fn idle_eng3(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:3", true);
            self.write_by_name("TURB ENG CORRECTED N2:3", Ratio::new::<ratio>(0.55));
            self.write_by_name("TURB ENG CORRECTED N1:3", Ratio::new::<ratio>(0.2));
            self.write_by_name("ENGINE_STATE:3", EngineState::On);

            self
        }

        fn idle_eng4(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:4", true);
            self.write_by_name("TURB ENG CORRECTED N2:4", Ratio::new::<ratio>(0.55));
            self.write_by_name("TURB ENG CORRECTED N1:4", Ratio::new::<ratio>(0.2));
            self.write_by_name("ENGINE_STATE:4", EngineState::On);

            self
        }

        fn toga_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.65));
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.5));
            self.write_by_name("ENGINE_STATE:1", EngineState::On);

            self
        }

        fn toga_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.65));
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.5));
            self.write_by_name("ENGINE_STATE:2", EngineState::On);

            self
        }

        fn toga_eng3(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:3", true);
            self.write_by_name("TURB ENG CORRECTED N2:3", Ratio::new::<ratio>(0.65));
            self.write_by_name("TURB ENG CORRECTED N1:3", Ratio::new::<ratio>(0.5));
            self.write_by_name("ENGINE_STATE:3", EngineState::On);

            self
        }

        fn toga_eng4(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:4", true);
            self.write_by_name("TURB ENG CORRECTED N2:4", Ratio::new::<ratio>(0.65));
            self.write_by_name("TURB ENG CORRECTED N1:4", Ratio::new::<ratio>(0.5));
            self.write_by_name("ENGINE_STATE:4", EngineState::On);

            self
        }

        fn stop_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", false);
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.));
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.));
            self.write_by_name("ENGINE_STATE:1", EngineState::Off);

            self
        }

        fn stop_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", false);
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.));
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.));
            self.write_by_name("ENGINE_STATE:2", EngineState::Off);

            self
        }

        fn stop_eng3(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:3", false);
            self.write_by_name("TURB ENG CORRECTED N2:3", Ratio::new::<ratio>(0.));
            self.write_by_name("TURB ENG CORRECTED N1:3", Ratio::new::<ratio>(0.));
            self.write_by_name("ENGINE_STATE:3", EngineState::Off);

            self
        }

        fn stop_eng4(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:4", false);
            self.write_by_name("TURB ENG CORRECTED N2:4", Ratio::new::<ratio>(0.));
            self.write_by_name("TURB ENG CORRECTED N1:4", Ratio::new::<ratio>(0.));
            self.write_by_name("ENGINE_STATE:4", EngineState::Off);

            self
        }

        fn eng1_n1(mut self, n1: f64) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(n1));
            self.write_by_name("ENGINE_STATE:1", EngineState::On);

            self
        }

        fn eng2_n1(mut self, n1: f64) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(n1));
            self.write_by_name("ENGINE_STATE:2", EngineState::On);

            self
        }

        fn eng3_n1(mut self, n1: f64) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:3", true);
            self.write_by_name("TURB ENG CORRECTED N1:3", Ratio::new::<ratio>(n1));
            self.write_by_name("ENGINE_STATE:3", EngineState::On);

            self
        }

        fn eng4_n1(mut self, n1: f64) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:4", true);
            self.write_by_name("TURB ENG CORRECTED N1:4", Ratio::new::<ratio>(n1));
            self.write_by_name("ENGINE_STATE:4", EngineState::On);

            self
        }

        fn eng1_n2(mut self, n2: f64) -> Self {
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(n2));

            self
        }

        fn eng2_n2(mut self, n2: f64) -> Self {
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(n2));

            self
        }

        fn eng3_n2(mut self, n2: f64) -> Self {
            self.write_by_name("TURB ENG CORRECTED N2:3", Ratio::new::<ratio>(n2));

            self
        }

        fn eng4_n2(mut self, n2: f64) -> Self {
            self.write_by_name("TURB ENG CORRECTED N2:4", Ratio::new::<ratio>(n2));

            self
        }

        fn start_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
            self.write_by_name("ENGINE_STATE:1", EngineState::Starting);

            self
        }

        fn start_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
            self.write_by_name("ENGINE_STATE:2", EngineState::Starting);

            self
        }

        fn start_eng3(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:3", true);
            self.write_by_name("ENGINE_STATE:3", EngineState::Starting);

            self
        }

        fn start_eng4(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:4", true);
            self.write_by_name("ENGINE_STATE:4", EngineState::Starting);

            self
        }

        fn cross_bleed_valve_selector_knob(mut self, mode: CrossBleedValveSelectorMode) -> Self {
            self.write_by_name("KNOB_OVHD_AIRCOND_XBLEED_Position", mode);

            self
        }

        fn ip_pressure(&self, number: usize) -> Pressure {
            self.query(|a| a.pneumatic.engine_systems[number - 1].intermediate_pressure())
        }

        fn hp_pressure(&self, number: usize) -> Pressure {
            self.query(|a| a.pneumatic.engine_systems[number - 1].high_pressure())
        }

        fn transfer_pressure(&self, number: usize) -> Pressure {
            self.query(|a| a.pneumatic.engine_systems[number - 1].transfer_pressure())
        }

        fn precooler_inlet_pressure(&self, number: usize) -> Pressure {
            self.query(|a| a.pneumatic.engine_systems[number - 1].precooler_inlet_pressure())
        }

        fn precooler_outlet_pressure(&self, number: usize) -> Pressure {
            self.query(|a| a.pneumatic.engine_systems[number - 1].precooler_outlet_pressure())
        }

        fn precooler_supply_pressure(&self, number: usize) -> Pressure {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .precooler_supply_pipe
                    .pressure()
            })
        }

        fn engine_starter_container_pressure(&self, number: usize) -> Pressure {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .engine_starter_container
                    .pressure()
            })
        }

        fn intermediate_pressure_transducer_pressure(&self, number: usize) -> Option<Pressure> {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1].intermediate_pressure_transducer_pressure()
            })
        }

        fn transfer_pressure_transducer_pressure(&self, number: usize) -> Option<Pressure> {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1].transfer_pressure_transducer_pressure()
            })
        }

        fn regulated_pressure_transducer_pressure(&self, number: usize) -> Option<Pressure> {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1].regulated_pressure_transducer_pressure()
            })
        }

        fn differential_pressure_transducer_pressure(&self, number: usize) -> Option<Pressure> {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1].differential_pressure_transducer_pressure()
            })
        }

        fn ip_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.engine_systems[number - 1].intermediate_temperature())
        }

        fn hp_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.engine_systems[number - 1].high_temperature())
        }

        fn transfer_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.engine_systems[number - 1].transfer_temperature())
        }

        fn precooler_inlet_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.engine_systems[number - 1].precooler_inlet_temperature())
        }

        fn precooler_outlet_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| a.pneumatic.engine_systems[number - 1].precooler_outlet_temperature())
        }

        fn precooler_supply_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .precooler_supply_pipe
                    .temperature()
            })
        }

        fn engine_starter_container_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .engine_starter_container
                    .temperature()
            })
        }

        fn hp_valve_is_open(&self, number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .high_pressure_valve
                    .is_open()
            })
        }

        fn pr_valve_is_open(&self, number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .pressure_regulating_valve
                    .is_open()
            })
        }

        fn es_valve_is_open(&self, number: usize) -> bool {
            self.query(|a| a.pneumatic.engine_systems[number - 1].engine_starter_valve_is_open())
        }

        fn apu_bleed_valve_is_open(&self) -> bool {
            self.query(|a| a.pneumatic.apu_bleed_air_valve.is_open())
        }

        fn hp_valve_is_powered(&self, number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .high_pressure_valve
                    .is_powered()
            })
        }

        fn pr_valve_is_powered(&self, number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .pressure_regulating_valve
                    .is_powered()
            })
        }

        fn fan_air_valve_is_powered(&self, number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .fan_air_valve
                    .is_powered()
            })
        }

        fn set_engine_bleed_push_button_off(mut self, number: usize) -> Self {
            self.write_by_name(&format!("OVHD_PNEU_ENG_{}_BLEED_PB_IS_AUTO", number), false);

            self
        }

        fn set_apu_bleed_valve_signal(mut self, signal: ApuBleedAirValveSignal) -> Self {
            self.command(|a| a.apu.set_bleed_air_valve_signal(signal));

            self
        }

        fn set_apu_bleed_air_pb(mut self, is_on: bool) -> Self {
            self.write_by_name("OVHD_APU_BLEED_PB_IS_ON", is_on);

            self
        }

        fn set_bleed_air_running(mut self) -> Self {
            self.command(|a| a.apu.set_bleed_air_pressure(Pressure::new::<psi>(42.)));
            self.command(|a| {
                a.apu
                    .set_bleed_air_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        250.,
                    ))
            });

            self.set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
                .set_apu_bleed_air_pb(true)
        }

        fn release_fire_pushbutton(mut self, number: usize) -> Self {
            self.command(|a| a.fire_pushbuttons.release(number));

            self
        }

        fn set_engine_state(mut self, number: usize, engine_state: EngineState) -> Self {
            self.write_by_name(&format!("ENGINE_STATE:{}", number), engine_state);

            self
        }

        fn engine_state(&self, number: usize) -> EngineState {
            self.query(|a| a.pneumatic.fadec.engine_state(number))
        }

        fn cross_bleed_valves_are_open(&self) -> bool {
            self.query(|a| {
                a.pneumatic
                    .cross_bleed_valves
                    .iter()
                    .all(|cbv| cbv.is_open())
            })
        }

        fn cross_bleed_valve_selector(&self) -> CrossBleedValveSelectorMode {
            self.query(|a| a.pneumatic_overhead_panel.cross_bleed_mode())
        }

        fn engine_bleed_push_button_is_auto(&self, number: usize) -> bool {
            self.query(|a| a.pneumatic_overhead_panel.engine_bleed_pb_is_auto(number))
        }

        fn green_hydraulic_reservoir_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.green_hydraulic_reservoir_with_valve.pressure())
        }

        fn yellow_hydraulic_reservoir_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.yellow_hydraulic_reservoir_with_valve.pressure())
        }

        fn set_pack_flow_pb_is_auto(mut self, number: usize, is_auto: bool) -> Self {
            self.write_by_name(&format!("OVHD_COND_PACK_{}_PB_IS_ON", number), is_auto);

            self
        }

        fn left_pack_flow_valve_is_open(&self, pack_number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.packs[pack_number - 1]
                    .left_pack_flow_valve
                    .is_open()
            })
        }

        fn right_pack_flow_valve_is_open(&self, pack_number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.packs[pack_number - 1]
                    .right_pack_flow_valve
                    .is_open()
            })
        }

        fn both_packs_auto(self) -> Self {
            self.set_pack_flow_pb_is_auto(1, true)
                .set_pack_flow_pb_is_auto(2, true)
        }

        fn set_dc_ess_shed_bus_power(mut self, is_powered: bool) -> Self {
            self.command(|a| a.set_dc_ess_shed_bus_power(is_powered));

            self
        }

        fn left_pack_flow_valve_flow(&self, pack_number: usize) -> MassRate {
            self.query(|a| a.pneumatic.packs[pack_number - 1].left_pack_flow_valve_air_flow())
        }

        fn right_pack_flow_valve_flow(&self, pack_number: usize) -> MassRate {
            self.query(|a| a.pneumatic.packs[pack_number - 1].right_pack_flow_valve_air_flow())
        }

        fn pack_pressure(&self, pack_number: usize) -> Pressure {
            self.query(|a| a.pneumatic.packs[pack_number - 1].pack_container.pressure())
        }

        fn cross_bleed_valves_are_powered_for_automatic_control(&self) -> bool {
            self.query(|a| {
                a.pneumatic
                    .cross_bleed_valves
                    .iter()
                    .all(|cbv| cbv.is_powered_for_automatic_control)
            })
        }

        fn cross_bleed_valves_are_powered_for_manual_control(&self) -> bool {
            self.query(|a| {
                a.pneumatic
                    .cross_bleed_valves
                    .iter()
                    .all(|cbv| cbv.is_powered_for_manual_control)
            })
        }

        fn command_pack_flow_selector_position(&mut self, value: u8) {
            self.write_by_name("KNOB_OVHD_AIRCOND_PACKFLOW_Position", value);
        }
    }

    fn test_bed() -> PneumaticTestBed {
        PneumaticTestBed::new()
    }

    fn test_bed_with() -> PneumaticTestBed {
        test_bed()
    }

    fn pressure_tolerance() -> Pressure {
        Pressure::new::<psi>(0.5)
    }

    fn flow_rate_tolerance() -> MassRate {
        MassRate::new::<kilogram_per_second>(0.1)
    }

    // Just a way for me to plot some graphs
    #[test]
    #[ignore]
    fn full_graphing_test() {
        let alt = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .in_isa_atmosphere(alt)
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .mach_number(MachNumber(0.))
            .both_packs_auto();

        let mut time_points = Vec::new();
        let mut high_pressures = Vec::new();
        let mut intermediate_pressures = Vec::new();
        let mut transfer_pressures = Vec::new(); // Transfer pressure (before PRV)
        let mut precooler_inlet_pressures = Vec::new(); // Precooler inlet pressure
        let mut precooler_outlet_pressures = Vec::new(); // Precooler outlet pressure
        let mut precooler_supply_pressures = Vec::new(); // Precooler cooling air pressure
        let mut engine_starter_container_pressures = Vec::new(); // Precooler cooling air pressure
        let mut intermediate_pressure_compressor_temperatures = Vec::new();
        let mut high_pressure_compressor_temperatures = Vec::new(); // Transfer temperature (before PRV)
        let mut transfer_temperatures = Vec::new(); // Precooler inlet temperature
        let mut precooler_inlet_temperatures = Vec::new(); // Precooler outlet temperature
        let mut precooler_outlet_temperatures = Vec::new(); // Precooler cooling air temperature
        let mut precooler_supply_temperatures = Vec::new();
        let mut engine_starter_container_temperatures = Vec::new();
        let mut high_pressure_valve_open_amounts = Vec::new();
        let mut pressure_regulating_valve_open_amounts = Vec::new();
        let mut intermediate_pressure_valve_open_amounts = Vec::new();
        let mut engine_starter_valve_open_amounts = Vec::new();
        let mut apu_bleed_valve_open_amounts = Vec::new();
        let mut fan_air_valve_open_amounts = Vec::new();

        for i in 1..2000 {
            time_points.push(i as f64 * 16.);

            high_pressures.push(test_bed.hp_pressure(1).get::<psi>());
            intermediate_pressures.push(test_bed.ip_pressure(1).get::<psi>());
            transfer_pressures.push(test_bed.transfer_pressure(1).get::<psi>());
            precooler_inlet_pressures.push(test_bed.precooler_inlet_pressure(1).get::<psi>());
            precooler_outlet_pressures.push(test_bed.precooler_outlet_pressure(1).get::<psi>());
            precooler_supply_pressures.push(test_bed.precooler_supply_pressure(1).get::<psi>());
            engine_starter_container_pressures
                .push(test_bed.engine_starter_container_pressure(1).get::<psi>());

            intermediate_pressure_compressor_temperatures
                .push(test_bed.ip_temperature(1).get::<degree_celsius>());
            high_pressure_compressor_temperatures
                .push(test_bed.hp_temperature(1).get::<degree_celsius>());
            transfer_temperatures.push(test_bed.transfer_temperature(1).get::<degree_celsius>());
            precooler_inlet_temperatures.push(
                test_bed
                    .precooler_inlet_temperature(1)
                    .get::<degree_celsius>(),
            );
            precooler_outlet_temperatures.push(
                test_bed
                    .precooler_outlet_temperature(1)
                    .get::<degree_celsius>(),
            );
            precooler_supply_temperatures.push(
                test_bed
                    .precooler_supply_temperature(1)
                    .get::<degree_celsius>(),
            );
            engine_starter_container_temperatures.push(
                test_bed
                    .engine_starter_container_temperature(1)
                    .get::<degree_celsius>(),
            );

            high_pressure_valve_open_amounts.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .high_pressure_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            pressure_regulating_valve_open_amounts.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .pressure_regulating_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            intermediate_pressure_valve_open_amounts.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .intermediate_pressure_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            engine_starter_valve_open_amounts.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .engine_starter_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            apu_bleed_valve_open_amounts.push(if test_bed.apu_bleed_valve_is_open() {
                1.
            } else {
                0.
            });

            fan_air_valve_open_amounts.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .fan_air_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            test_bed.run_with_delta(Duration::from_millis(32));
        }

        assert!(test_bed.hp_valve_is_powered(1));
        assert!(test_bed.pr_valve_is_powered(1));
        assert!(test_bed.fan_air_valve_is_powered(1));

        // If anyone is wondering, I am using python to plot pressure curves. This will be removed once the model is complete.
        let data = vec![
            time_points,
            high_pressures,
            intermediate_pressures,
            transfer_pressures,
            precooler_inlet_pressures,
            precooler_outlet_pressures,
            precooler_supply_pressures,
            engine_starter_container_pressures,
            high_pressure_compressor_temperatures,
            intermediate_pressure_compressor_temperatures,
            transfer_temperatures,
            precooler_inlet_temperatures,
            precooler_outlet_temperatures,
            precooler_supply_temperatures,
            engine_starter_container_temperatures,
            high_pressure_valve_open_amounts,
            pressure_regulating_valve_open_amounts,
            intermediate_pressure_valve_open_amounts,
            engine_starter_valve_open_amounts,
            apu_bleed_valve_open_amounts,
            fan_air_valve_open_amounts,
        ];

        if fs::create_dir_all("../a320_pneumatic_simulation_graph_data").is_ok() {
            let mut file = File::create("../a320_pneumatic_simulation_graph_data/generic_data.txt")
                .expect("Could not create file");

            use std::io::Write;

            writeln!(file, "{:?}", data).expect("Could not write file");
        };
    }

    #[test]
    #[ignore]
    fn hydraulic_reservoir_pressurization_graphs() {
        let alt = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .in_isa_atmosphere(alt)
            .idle_eng1()
            .stop_eng2()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut);

        let mut ts = Vec::new();
        let mut green_pressures = Vec::new();
        let mut yellow_pressures = Vec::new();

        for i in 1..1000 {
            ts.push(i as f64 * 16.);

            green_pressures.push(test_bed.green_hydraulic_reservoir_pressure().get::<psi>());
            yellow_pressures.push(test_bed.yellow_hydraulic_reservoir_pressure().get::<psi>());

            test_bed.run_with_delta(Duration::from_millis(16));
        }

        assert!(test_bed.green_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));

        // If anyone is wondering, I am using python to plot pressure curves. This will be removed once the model is complete.
        let data = vec![ts, green_pressures, yellow_pressures];

        if fs::create_dir_all("../a320_pneumatic_simulation_graph_data").is_ok() {
            let mut file = File::create(
                "../a320_pneumatic_simulation_graph_data/hydraulic_reservoir_pressures_data.txt",
            )
            .expect("Could not create file");

            use std::io::Write;

            writeln!(file, "{:?}", data).expect("Could not write file");
        };
    }

    #[test]
    #[ignore]
    fn pack_pressurization_graphs() {
        let alt = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .in_isa_atmosphere(alt)
            .stop_eng1()
            .stop_eng2()
            .set_bleed_air_running()
            .both_packs_auto()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open);

        let mut ts = Vec::new();
        let mut left_pressures = Vec::new();
        let mut right_pressures = Vec::new();

        for i in 1..10000 {
            ts.push(i as f64 * 16.);

            left_pressures.push(test_bed.pack_pressure(1).get::<psi>());
            right_pressures.push(test_bed.pack_pressure(2).get::<psi>());

            test_bed.run_with_delta(Duration::from_millis(16));
        }

        // If anyone is wondering, I am using python to plot pressure curves. This will be removed once the model is complete.
        let data = vec![ts, left_pressures, right_pressures];

        if fs::create_dir_all("../a320_pneumatic_simulation_graph_data").is_ok() {
            let mut file =
                File::create("../a320_pneumatic_simulation_graph_data/pack_pressures_data.txt")
                    .expect("Could not create file");

            use std::io::Write;

            writeln!(file, "{:?}", data).expect("Could not write file");
        };
    }

    #[test]
    fn cold_and_dark_full_state() {
        let altitude = Length::new::<foot>(0.);
        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);

        let test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .stop_eng3()
            .stop_eng4()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.))
            .set_pack_flow_pb_is_auto(1, false)
            .set_pack_flow_pb_is_auto(2, false)
            .and_stabilize();

        for engine_number in 1..=4 {
            assert_about_eq!(
                test_bed.ip_pressure(engine_number).get::<psi>(),
                ambient_pressure.get::<psi>(),
                pressure_tolerance().get::<psi>()
            );
            assert_about_eq!(
                test_bed.hp_pressure(engine_number).get::<psi>(),
                ambient_pressure.get::<psi>(),
                pressure_tolerance().get::<psi>(),
            );
            assert_about_eq!(
                test_bed.transfer_pressure(engine_number).get::<psi>(),
                ambient_pressure.get::<psi>(),
                pressure_tolerance().get::<psi>()
            );
            assert_about_eq!(
                test_bed
                    .precooler_inlet_pressure(engine_number)
                    .get::<psi>(),
                ambient_pressure.get::<psi>(),
                pressure_tolerance().get::<psi>()
            );
            assert_about_eq!(
                test_bed
                    .precooler_outlet_pressure(engine_number)
                    .get::<psi>(),
                ambient_pressure.get::<psi>(),
                pressure_tolerance().get::<psi>()
            );
            assert_about_eq!(
                test_bed
                    .intermediate_pressure_transducer_pressure(engine_number)
                    .unwrap()
                    .get::<psi>(),
                0.,
                pressure_tolerance().get::<psi>()
            );
            assert_about_eq!(
                test_bed
                    .transfer_pressure_transducer_pressure(engine_number)
                    .unwrap()
                    .get::<psi>(),
                0.,
                pressure_tolerance().get::<psi>()
            );
            assert_about_eq!(
                test_bed
                    .regulated_pressure_transducer_pressure(engine_number)
                    .unwrap()
                    .get::<psi>(),
                0.,
                pressure_tolerance().get::<psi>()
            );
            assert_about_eq!(
                test_bed
                    .differential_pressure_transducer_pressure(engine_number)
                    .unwrap()
                    .get::<psi>(),
                0.,
                pressure_tolerance().get::<psi>()
            );

            assert!(!test_bed.hp_valve_is_open(engine_number));
            assert!(!test_bed.pr_valve_is_open(engine_number));
        }

        assert!(!test_bed.cross_bleed_valves_are_open())
    }

    #[test]
    fn single_engine_idle_full_state() {
        let altitude = Length::new::<foot>(0.);
        let test_bed = test_bed_with()
            .idle_eng1()
            .stop_eng2()
            .stop_eng3()
            .stop_eng4()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.))
            .and_stabilize();

        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);

        assert!(test_bed.ip_pressure(1) - ambient_pressure > pressure_tolerance());
        assert_about_eq!(
            test_bed.ip_pressure(3).get::<psi>(),
            ambient_pressure.get::<psi>(),
            pressure_tolerance().get::<psi>()
        );

        assert!(test_bed.hp_pressure(1) - ambient_pressure > pressure_tolerance());
        assert_about_eq!(
            test_bed.hp_pressure(3).get::<psi>(),
            ambient_pressure.get::<psi>(),
            pressure_tolerance().get::<psi>()
        );

        assert!(test_bed.transfer_pressure(1) - ambient_pressure > pressure_tolerance());
        assert_about_eq!(
            test_bed.transfer_pressure(3).get::<psi>(),
            ambient_pressure.get::<psi>(),
            pressure_tolerance().get::<psi>()
        );

        assert!((test_bed.precooler_inlet_pressure(1) - ambient_pressure) > pressure_tolerance());
        assert!(!test_bed.precooler_inlet_pressure(3).is_nan());

        assert!((test_bed.precooler_outlet_pressure(1) - ambient_pressure) > pressure_tolerance());
        assert!(!test_bed.precooler_outlet_pressure(3).is_nan());

        assert!(test_bed.hp_valve_is_open(1));
        assert!(!test_bed.hp_valve_is_open(3));

        assert!(!test_bed.es_valve_is_open(1));
        assert!(!test_bed.es_valve_is_open(3));

        assert!(!test_bed.cross_bleed_valves_are_open());
    }

    #[test]
    fn four_engine_idle_full_state() {
        let altitude = Length::new::<foot>(0.);
        let test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.))
            .both_packs_auto()
            .and_stabilize();

        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);

        for i in 1..=4 {
            assert!(test_bed.hp_valve_is_powered(i));
            assert!(test_bed.pr_valve_is_powered(i));

            assert!(test_bed.ip_pressure(i) - ambient_pressure > pressure_tolerance());
            assert!(test_bed.hp_pressure(i) - ambient_pressure > pressure_tolerance());
            assert!(test_bed.transfer_pressure(i) - ambient_pressure > pressure_tolerance());
            assert!(
                (test_bed.precooler_inlet_pressure(i) - ambient_pressure) > pressure_tolerance()
            );
            assert!(
                (test_bed.precooler_outlet_pressure(i) - ambient_pressure) > pressure_tolerance()
            );
            assert!(test_bed.hp_valve_is_open(i));
            assert!(!test_bed.es_valve_is_open(i));
        }

        assert!(!test_bed.cross_bleed_valves_are_open());
    }

    #[test]
    fn engine_shutdown() {
        let altitude = Length::new::<foot>(0.);
        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);

        let mut test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.))
            .and_stabilize();

        assert!(test_bed.precooler_outlet_pressure(1) - ambient_pressure > pressure_tolerance());
        assert!(test_bed.precooler_outlet_pressure(2) - ambient_pressure > pressure_tolerance());
        assert!(test_bed.precooler_outlet_pressure(3) - ambient_pressure > pressure_tolerance());
        assert!(test_bed.precooler_outlet_pressure(4) - ambient_pressure > pressure_tolerance());

        test_bed = test_bed.set_bleed_air_running();

        assert!(!test_bed.precooler_outlet_pressure(1).get::<psi>().is_nan());
        assert!(!test_bed.precooler_outlet_pressure(2).get::<psi>().is_nan());
        assert!(!test_bed.precooler_outlet_pressure(3).get::<psi>().is_nan());
        assert!(!test_bed.precooler_outlet_pressure(4).get::<psi>().is_nan());
    }

    #[rstest]
    fn starter_valve_opens_on_engine_start(#[values(1, 2, 3, 4)] engine_number: usize) {
        let mut test_bed = test_bed_with().stop_eng1().stop_eng2().and_run();

        assert!(!test_bed.es_valve_is_open(engine_number));

        test_bed = match engine_number {
            1 => test_bed.start_eng1(),
            2 => test_bed.start_eng2(),
            3 => test_bed.start_eng3(),
            4 => test_bed.start_eng4(),
            _ => panic!("Unexpected engine number"),
        }
        .and_run();

        assert!(test_bed.es_valve_is_open(engine_number));
    }

    #[test]
    fn cross_bleed_valve_opens_when_apu_bleed_valve_opens() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .and_run();

        assert!(!test_bed.cross_bleed_valves_are_open());

        test_bed = test_bed
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .and_run();

        assert!(test_bed.cross_bleed_valves_are_open());
    }

    #[test]
    fn cross_bleed_valve_closes_when_apu_bleed_valve_closes() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .and_run();

        assert!(test_bed.cross_bleed_valves_are_open());

        test_bed = test_bed
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_closed())
            .and_run();

        assert!(!test_bed.cross_bleed_valves_are_open());
    }

    #[test]
    fn cross_bleed_valve_manual_overrides_everything() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .and_run();

        assert!(!test_bed.cross_bleed_valves_are_open());

        test_bed = test_bed
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_closed())
            .and_run();

        assert!(test_bed.cross_bleed_valves_are_open());
    }

    #[rstest]
    fn cross_bleed_valves_open_with_any_bleed_pb_off(#[values(1, 2, 3, 4)] engine_number: usize) {
        let mut test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .and_stabilize();

        assert!(!test_bed.cross_bleed_valves_are_open());

        test_bed = test_bed
            .set_engine_bleed_push_button_off(engine_number)
            .and_run();

        assert!(test_bed.cross_bleed_valves_are_open());
    }

    #[test]
    fn vars_initialized_properly() {
        let test_bed = test_bed()
            .in_isa_atmosphere(Length::new::<foot>(0.))
            .and_run();

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_INTERMEDIATE_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_INTERMEDIATE_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_INTERMEDIATE_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_INTERMEDIATE_TRANSDUCER_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_HP_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_HP_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_HP_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_HP_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_TRANSFER_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_TRANSFER_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_TRANSFER_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_TRANSFER_TRANSDUCER_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_REGULATED_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_REGULATED_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_REGULATED_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_REGULATED_TRANSDUCER_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_DIFFERENTIAL_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_DIFFERENTIAL_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_DIFFERENTIAL_TRANSDUCER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_DIFFERENTIAL_TRANSDUCER_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_STARTER_CONTAINER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_STARTER_CONTAINER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_STARTER_CONTAINER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_STARTER_CONTAINER_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_IP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_IP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_IP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_IP_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_HP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_HP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_HP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_HP_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_TRANSFER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_TRANSFER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_TRANSFER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_TRANSFER_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PRECOOLER_INLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PRECOOLER_INLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_PRECOOLER_INLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_PRECOOLER_INLET_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PRECOOLER_OUTLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PRECOOLER_OUTLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_PRECOOLER_OUTLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_PRECOOLER_OUTLET_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_STARTER_CONTAINER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_STARTER_CONTAINER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_STARTER_CONTAINER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_STARTER_CONTAINER_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_IP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_IP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_IP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_IP_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_HP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_HP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_HP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_HP_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PR_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PR_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_PR_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_PR_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_STARTER_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_STARTER_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_3_STARTER_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_4_STARTER_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_PACK_1_FLOW_VALVE_1_FLOW_RATE"));
        assert!(test_bed.contains_variable_with_name("PNEU_PACK_1_FLOW_VALVE_2_FLOW_RATE"));
        assert!(test_bed.contains_variable_with_name("PNEU_PACK_2_FLOW_VALVE_1_FLOW_RATE"));
        assert!(test_bed.contains_variable_with_name("PNEU_PACK_2_FLOW_VALVE_2_FLOW_RATE"));

        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_1_BLEED_PB_HAS_FAULT"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_2_BLEED_PB_HAS_FAULT"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_3_BLEED_PB_HAS_FAULT"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_4_BLEED_PB_HAS_FAULT"));

        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_2_BLEED_PB_IS_AUTO"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_3_BLEED_PB_IS_AUTO"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_4_BLEED_PB_IS_AUTO"));

        assert!(test_bed.contains_variable_with_name("PNEU_XBLEED_VALVE_L_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_XBLEED_VALVE_C_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_XBLEED_VALVE_R_OPEN"));
    }

    #[rstest]
    fn pressure_regulating_valve_closes_with_ovhd_engine_bleed_off(
        #[values(1, 2, 3, 4)] engine_number: usize,
    ) {
        let mut test_bed = test_bed()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .and_run();

        // We have to run two update ticks for the pressure to propagate through the system.
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.pr_valve_is_open(engine_number));

        test_bed = test_bed
            .set_engine_bleed_push_button_off(engine_number)
            .and_run();

        for i in 1..=4 {
            assert_eq!(test_bed.pr_valve_is_open(i), i != engine_number);
        }
    }

    #[rstest]
    fn pressure_regulating_valve_closes_with_ovhd_engine_fire_pushbutton_released(
        #[values(1, 2, 3, 4)] engine_number: usize,
    ) {
        let mut test_bed = test_bed()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .and_run();

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.pr_valve_is_open(1));
        assert!(test_bed.pr_valve_is_open(2));
        assert!(test_bed.pr_valve_is_open(3));
        assert!(test_bed.pr_valve_is_open(4));

        test_bed = test_bed.release_fire_pushbutton(engine_number).and_run();

        for i in 1..=4 {
            assert_eq!(test_bed.pr_valve_is_open(i), i != engine_number);
        }
    }

    #[test]
    fn pressure_regulating_valves_close_with_apu_bleed_on() {
        let mut test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .and_run();

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.pr_valve_is_open(1));
        assert!(test_bed.pr_valve_is_open(2));
        assert!(test_bed.pr_valve_is_open(3));
        assert!(test_bed.pr_valve_is_open(4));

        test_bed = test_bed.set_bleed_air_running().and_run();

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.pr_valve_is_open(2));
        assert!(!test_bed.pr_valve_is_open(3));
        assert!(!test_bed.pr_valve_is_open(4));
    }

    #[rstest]
    fn pressure_regulating_valve_regulates_to_40_psig() {
        // Set engine parameters to values that will ensure enough upstream pressure,
        // so the desired downstream pressure of 40 psig can be reached.
        let test_bed = test_bed_with()
            .in_isa_atmosphere(Length::new::<foot>(0.))
            .mach_number(MachNumber(0.))
            .eng1_n1(0.7)
            .eng1_n2(0.875)
            .eng2_n1(0.7)
            .eng2_n2(0.875)
            .eng3_n1(0.7)
            .eng3_n2(0.875)
            .eng4_n1(0.7)
            .eng4_n2(0.875)
            .both_packs_auto()
            .and_stabilize();

        for engine_number in 1..=4 {
            assert_about_eq!(
                test_bed
                    .regulated_pressure_transducer_pressure(engine_number)
                    .unwrap()
                    .get::<psi>(),
                40.,
                pressure_tolerance().get::<psi>()
            );
        }
    }

    #[rstest]
    fn fadec_represents_engine_state(#[values(1, 2, 3, 4)] engine: usize) {
        let mut test_bed = test_bed_with().set_engine_state(engine, EngineState::Off);

        assert_eq!(test_bed.engine_state(engine), EngineState::Off);

        test_bed = test_bed
            .set_engine_state(engine, EngineState::Starting)
            .and_run();
        assert_eq!(test_bed.engine_state(engine), EngineState::Starting);

        test_bed = test_bed.set_engine_state(engine, EngineState::On).and_run();
        assert_eq!(test_bed.engine_state(engine), EngineState::On);

        test_bed = test_bed
            .set_engine_state(engine, EngineState::Shutting)
            .and_run();
        assert_eq!(test_bed.engine_state(engine), EngineState::Shutting);
    }

    #[test]
    fn apu_bleed_provides_at_least_30_psi_with_open_cross_bleed_valve() {
        let test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .stop_eng3()
            .stop_eng4()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_bleed_air_running()
            .and_stabilize();

        assert!(test_bed.cross_bleed_valves_are_open());

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.pr_valve_is_open(2));
        assert!(!test_bed.pr_valve_is_open(3));
        assert!(!test_bed.pr_valve_is_open(4));

        assert!(test_bed.precooler_outlet_pressure(1) > Pressure::new::<psi>(30.));
        assert!(test_bed.precooler_outlet_pressure(2) > Pressure::new::<psi>(30.));
        assert!(test_bed.precooler_outlet_pressure(3) > Pressure::new::<psi>(30.));
        assert!(test_bed.precooler_outlet_pressure(4) > Pressure::new::<psi>(30.));
    }

    #[test]
    fn hydraulic_reservoirs_get_pressurized_with_apu() {
        let test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .stop_eng3()
            .stop_eng4()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_bleed_air_running()
            .and_stabilize();

        assert!(test_bed.green_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
    }

    #[test]
    fn hydraulic_reservoirs_pressurized_by_outboard_engines_hp_pipe() {
        let mut test_bed = test_bed_with()
            .idle_eng1()
            .stop_eng2()
            .stop_eng3()
            .idle_eng4()
            .set_engine_bleed_push_button_off(1)
            .set_engine_bleed_push_button_off(4)
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut);

        // Depressurize reservoirs
        test_bed.fail(FailureType::ReservoirAirLeak(HydraulicColor::Green));
        test_bed.fail(FailureType::ReservoirAirLeak(HydraulicColor::Yellow));
        test_bed
            .test_bed
            .run_multiple_frames(Duration::from_secs(16));

        assert!(test_bed.green_hydraulic_reservoir_pressure() < Pressure::new::<psi>(25.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() < Pressure::new::<psi>(25.));

        // Make sure bleed valves are closed because reservoirs should be pressurized by HP pipes directly
        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.pr_valve_is_open(4));

        test_bed.unfail(FailureType::ReservoirAirLeak(HydraulicColor::Green));
        test_bed.unfail(FailureType::ReservoirAirLeak(HydraulicColor::Yellow));
        test_bed
            .test_bed
            .run_multiple_frames(Duration::from_secs(16));

        assert!(test_bed.green_hydraulic_reservoir_pressure() > Pressure::new::<psi>(40.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() > Pressure::new::<psi>(40.));
    }

    #[test]
    fn hydraulic_reservoirs_pressurized_by_inboard_engines_system() {
        let mut test_bed = test_bed_with()
            .stop_eng1()
            .toga_eng2()
            .toga_eng3()
            .stop_eng4()
            .set_engine_bleed_push_button_off(1)
            .set_engine_bleed_push_button_off(4)
            // Close pack valves to make sure air does not bypass crossbleed valves through the packs
            .set_pack_flow_pb_is_auto(1, false)
            .set_pack_flow_pb_is_auto(2, false)
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut);

        // Depressurize reservoirs
        test_bed.fail(FailureType::ReservoirAirLeak(HydraulicColor::Green));
        test_bed.fail(FailureType::ReservoirAirLeak(HydraulicColor::Yellow));
        test_bed
            .test_bed
            .run_multiple_frames(Duration::from_secs(16));

        assert!(test_bed.green_hydraulic_reservoir_pressure() < Pressure::new::<psi>(20.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() < Pressure::new::<psi>(20.));

        // Make sure HP valves are closed because reservoirs should be pressurized by inboard engines system, not the HP pipe directly
        assert!(!test_bed.hp_valve_is_open(2));
        assert!(!test_bed.hp_valve_is_open(3));

        test_bed.unfail(FailureType::ReservoirAirLeak(HydraulicColor::Green));
        test_bed.unfail(FailureType::ReservoirAirLeak(HydraulicColor::Yellow));
        test_bed
            .test_bed
            .run_multiple_frames(Duration::from_secs(16));

        // We still expect them not to be pressurized because the crossbleed valves are closed
        assert!(test_bed.green_hydraulic_reservoir_pressure() < Pressure::new::<psi>(20.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() < Pressure::new::<psi>(20.));

        test_bed = test_bed
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .and_stabilize();

        assert!(test_bed.green_hydraulic_reservoir_pressure() > Pressure::new::<psi>(30.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() > Pressure::new::<psi>(30.));
    }

    #[test]
    fn hydraulic_reservoirs_maintain_pressure_after_bleed_pressure_loss() {
        // We don't run the outboard engines, because they supply HP air immediately
        // This HP air makes the preload pop immediately (which probably should not happnen, TODO)
        // When the preload pops, the pressure is obviously not maintained and the test fails.
        let mut test_bed = test_bed_with()
            .stop_eng1()
            .idle_eng2()
            .idle_eng3()
            .stop_eng4()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
            .mach_number(MachNumber(0.))
            .both_packs_auto()
            .and_stabilize();

        let pressure_before_green = test_bed.green_hydraulic_reservoir_pressure();
        let pressure_before_yellow = test_bed.yellow_hydraulic_reservoir_pressure();

        test_bed = test_bed.stop_eng2().stop_eng3().and_stabilize();

        assert!(test_bed.green_hydraulic_reservoir_pressure() >= pressure_before_green);
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() >= pressure_before_yellow);
    }

    #[test]
    fn cross_bleed_valve_does_not_accept_manual_signal_when_bus_unpowered() {
        let mut test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
            .mach_number(MachNumber(0.))
            .both_packs_auto()
            .set_dc_ess_shed_bus_power(false)
            .and_run();

        assert!(test_bed.cross_bleed_valves_are_powered_for_automatic_control());
        assert!(!test_bed.cross_bleed_valves_are_powered_for_manual_control());
        assert!(!test_bed.cross_bleed_valves_are_open());

        test_bed = test_bed
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .and_run();

        assert!(!test_bed.cross_bleed_valves_are_open());
    }

    #[test]
    fn large_time_step_stability() {
        let mut test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .idle_eng3()
            .idle_eng4()
            .mach_number(MachNumber(0.))
            .both_packs_auto()
            .and_stabilize();

        // Introduce perturbation
        test_bed = test_bed.toga_eng1().toga_eng2().toga_eng3().toga_eng4();

        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(!test_bed.precooler_inlet_pressure(1).is_nan());
        assert!(!test_bed.precooler_inlet_pressure(2).is_nan());
        assert!(!test_bed.precooler_inlet_pressure(3).is_nan());
        assert!(!test_bed.precooler_inlet_pressure(4).is_nan());
    }

    mod overhead {
        use super::*;

        #[test]
        fn ovhd_engine_bleed_push_buttons() {
            let mut test_bed = test_bed().and_run();

            assert!(test_bed.engine_bleed_push_button_is_auto(1));
            assert!(test_bed.engine_bleed_push_button_is_auto(2));

            test_bed = test_bed
                .set_engine_bleed_push_button_off(1)
                .set_engine_bleed_push_button_off(2)
                .and_run();

            assert!(!test_bed.engine_bleed_push_button_is_auto(1));
            assert!(!test_bed.engine_bleed_push_button_is_auto(2));
        }

        #[test]
        fn ovhd_cross_bleed_valve_mode_selector() {
            let mut test_bed = test_bed().and_run();

            assert_eq!(
                test_bed.cross_bleed_valve_selector(),
                CrossBleedValveSelectorMode::Auto
            );

            test_bed = test_bed
                .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
                .and_run();

            assert_eq!(
                test_bed.cross_bleed_valve_selector(),
                CrossBleedValveSelectorMode::Open
            );

            test_bed = test_bed
                .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
                .and_run();

            assert_eq!(
                test_bed.cross_bleed_valve_selector(),
                CrossBleedValveSelectorMode::Shut
            );
        }
    }

    mod pack_flow_valve_tests {
        use super::*;

        #[test]
        fn pack_flow_valve_starts_closed() {
            let test_bed = test_bed();

            assert!(!test_bed.left_pack_flow_valve_is_open(1));
            assert!(!test_bed.right_pack_flow_valve_is_open(1));
            assert!(!test_bed.left_pack_flow_valve_is_open(2));
            assert!(!test_bed.right_pack_flow_valve_is_open(2));
        }

        #[test]
        fn pack_flow_valve_opens_when_conditions_met() {
            let test_bed = test_bed_with()
                .idle_eng1()
                .idle_eng2()
                .idle_eng3()
                .idle_eng4()
                .set_pack_flow_pb_is_auto(1, true)
                .set_pack_flow_pb_is_auto(2, true)
                .and_stabilize();

            assert!(test_bed.left_pack_flow_valve_is_open(1));
            assert!(test_bed.right_pack_flow_valve_is_open(1));
            assert!(test_bed.left_pack_flow_valve_is_open(2));
            assert!(test_bed.right_pack_flow_valve_is_open(2));
        }

        #[test]
        fn pack_flow_valve_closes_with_pack_pb_off() {
            let mut test_bed = test_bed_with()
                .idle_eng1()
                .idle_eng2()
                .idle_eng3()
                .idle_eng4()
                .set_pack_flow_pb_is_auto(1, true)
                .set_pack_flow_pb_is_auto(2, false)
                .and_stabilize();

            assert!(test_bed.left_pack_flow_valve_is_open(1));
            assert!(test_bed.right_pack_flow_valve_is_open(1));
            assert!(!test_bed.left_pack_flow_valve_is_open(2));
            assert!(!test_bed.right_pack_flow_valve_is_open(2));

            test_bed = test_bed
                .set_pack_flow_pb_is_auto(1, false)
                .and_run()
                .and_run();

            assert!(!test_bed.left_pack_flow_valve_is_open(1));
            assert!(!test_bed.right_pack_flow_valve_is_open(1));
            assert!(!test_bed.left_pack_flow_valve_is_open(2));
            assert!(!test_bed.right_pack_flow_valve_is_open(2));
        }

        #[test]
        fn pack_flow_drops_when_valve_is_closed() {
            let mut test_bed = test_bed_with()
                .idle_eng1()
                .idle_eng2()
                .idle_eng3()
                .idle_eng4()
                .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
                .mach_number(MachNumber(0.))
                .both_packs_auto()
                .and_stabilize();

            assert!(test_bed.left_pack_flow_valve_flow(1) > flow_rate_tolerance());
            assert!(test_bed.right_pack_flow_valve_flow(1) > flow_rate_tolerance());
            assert!(test_bed.left_pack_flow_valve_flow(2) > flow_rate_tolerance());
            assert!(test_bed.right_pack_flow_valve_flow(2) > flow_rate_tolerance());

            test_bed = test_bed
                .set_pack_flow_pb_is_auto(1, false)
                .set_pack_flow_pb_is_auto(2, false)
                .and_stabilize();

            assert!(test_bed.left_pack_flow_valve_flow(1) < flow_rate_tolerance());
            assert!(test_bed.right_pack_flow_valve_flow(1) < flow_rate_tolerance());
            assert!(test_bed.left_pack_flow_valve_flow(2) < flow_rate_tolerance());
            assert!(test_bed.right_pack_flow_valve_flow(2) < flow_rate_tolerance());
        }
    }
}
