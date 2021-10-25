use core::panic;
use std::{f64::consts::PI, time::Duration};

use crate::{hydraulic::A320Hydraulic, UpdateContext};

use uom::si::{
    f64::*,
    pressure::psi,
    ratio::ratio,
    thermodynamic_temperature::degree_celsius,
    volume::{cubic_meter, gallon},
    volume_rate::cubic_meter_per_second,
};

use systems::{
    overhead::{AutoOffFaultPushButton, OnOffFaultPushButton},
    pneumatic::{
        valve::*, ApuCompressionChamberController, BleedMonitoringComputerChannelOperationMode,
        BleedMonitoringComputerIsAliveSignal, CompressionChamber, ControllablePneumaticValve,
        CrossBleedValveSelectorKnob, CrossBleedValveSelectorMode,
        EngineCompressionChamberController, EngineState, FaultLightSignal, PneumaticContainer,
        PneumaticContainerWithConnector, PneumaticPipe, PneumaticValveSignal, Precooler,
        VariableVolumeContainer,
    },
    shared::{
        pid::PidController, ControllerSignal, DelayedTrueLogicGate, ElectricalBusType,
        ElectricalBuses, EngineCorrectedN1, EngineCorrectedN2, EngineFirePushButtons,
        PneumaticValve,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write,
    },
};

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

struct CrossBleedValveSignal {
    target_open_amount: Ratio,
    is_manual_vs_automatic: bool,
}
impl CrossBleedValveSignal {
    fn new(target_open_amount: Ratio, is_manual_vs_automatic: bool) -> Self {
        Self {
            target_open_amount,
            is_manual_vs_automatic,
        }
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }

    fn new_open(is_manual_vs_automatic: bool) -> Self {
        Self::new(Ratio::new::<ratio>(1.), is_manual_vs_automatic)
    }

    fn new_closed(is_manual_vs_automatic: bool) -> Self {
        Self::new(Ratio::new::<ratio>(0.), is_manual_vs_automatic)
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

pub struct A320Pneumatic {
    cross_bleed_valve_open_id: VariableIdentifier,
    apu_bleed_air_valve_open_id: VariableIdentifier,

    bleed_monitoring_computers: [BleedMonitoringComputer; 2],
    engine_systems: [EngineBleedAirSystem; 2],

    cross_bleed_valve: CrossBleedValve,

    fadec: FullAuthorityDigitalEngineControl,
    engine_starter_valve_controllers: [EngineStarterValveController; 2],

    apu: CompressionChamber,
    apu_bleed_air_valve: DefaultValve,
    apu_bleed_air_controller: ApuCompressionChamberController,

    green_hydraulic_reservoir_with_valve: PneumaticContainerWithConnector<VariableVolumeContainer>,
    blue_hydraulic_reservoir_with_valve: PneumaticContainerWithConnector<VariableVolumeContainer>,
    yellow_hydraulic_reservoir_with_valve: PneumaticContainerWithConnector<VariableVolumeContainer>,

    packs: [PackComplex; 2],
}
impl A320Pneumatic {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            cross_bleed_valve_open_id: context.get_identifier("PNEU_XBLEED_VALVE_OPEN".to_owned()),
            apu_bleed_air_valve_open_id: context
                .get_identifier("APU_BLEED_AIR_VALVE_OPEN".to_owned()),
            bleed_monitoring_computers: [
                BleedMonitoringComputer::new(1, 2, ElectricalBusType::DirectCurrentEssentialShed),
                BleedMonitoringComputer::new(2, 1, ElectricalBusType::DirectCurrent(2)),
            ],
            engine_systems: [
                EngineBleedAirSystem::new(
                    context,
                    1,
                    ElectricalBusType::DirectCurrentEssentialShed,
                ),
                EngineBleedAirSystem::new(context, 2, ElectricalBusType::DirectCurrent(2)),
            ],
            cross_bleed_valve: CrossBleedValve::new(1.),
            fadec: FullAuthorityDigitalEngineControl::new(context),
            engine_starter_valve_controllers: [
                EngineStarterValveController::new(1),
                EngineStarterValveController::new(2),
            ],
            apu: CompressionChamber::new(Volume::new::<cubic_meter>(5.)),
            apu_bleed_air_valve: DefaultValve::new_closed(),
            apu_bleed_air_controller: ApuCompressionChamberController::new(context),
            green_hydraulic_reservoir_with_valve: PneumaticContainerWithConnector::new(
                VariableVolumeContainer::new(
                    Volume::new::<gallon>(8.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
            ),
            blue_hydraulic_reservoir_with_valve: PneumaticContainerWithConnector::new(
                VariableVolumeContainer::new(
                    Volume::new::<gallon>(15.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
            ),
            yellow_hydraulic_reservoir_with_valve: PneumaticContainerWithConnector::new(
                VariableVolumeContainer::new(
                    Volume::new::<gallon>(10.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
            ),
            packs: [PackComplex::new(context, 1), PackComplex::new(context, 2)],
        }
    }

    pub(crate) fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        engines: [&T; 2],
        overhead_panel: &mut A320PneumaticOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        hydraulics: &A320Hydraulic,
    ) {
        self.apu.update(&self.apu_bleed_air_controller);

        for bleed_monitoring_computer in self.bleed_monitoring_computers.iter_mut() {
            bleed_monitoring_computer.update(
                context,
                &self.engine_systems,
                self.apu_bleed_air_valve.is_open(),
                overhead_panel,
                engine_fire_push_buttons,
                self.cross_bleed_valve.is_open(),
                &self.fadec,
            );

            // I am not exactly sure if both BMCs should actually control this valve all the time.
            self.cross_bleed_valve
                .update_open_amount(&bleed_monitoring_computer.main_channel);
        }

        let (bleed_monitoring_computer_one, bleed_monitoring_computer_two) =
            self.bleed_monitoring_computers.split_at_mut(1);

        bleed_monitoring_computer_one[0].check_for_failure(&mut bleed_monitoring_computer_two[0]);
        bleed_monitoring_computer_two[0].check_for_failure(&mut bleed_monitoring_computer_one[0]);

        for engine_starter_valve_controller in self.engine_starter_valve_controllers.iter_mut() {
            engine_starter_valve_controller.update(&self.fadec);
        }

        for engine_system in self.engine_systems.iter_mut() {
            for bleed_monitoring_computer in self.bleed_monitoring_computers.iter() {
                let index = engine_system.number - 1;

                // If we get an actual channel here, this means that the channel is not in slave mode
                if let Some(channel) =
                    bleed_monitoring_computer.channel_for_engine(engine_system.number)
                {
                    engine_system.update(
                        context,
                        channel,
                        channel,
                        &self.engine_starter_valve_controllers[index],
                        channel,
                        engines[index],
                    );
                }
            }
        }

        self.update_hydraulic_reservoir_spatial_volumes(
            hydraulics.green_reservoir_capacity() - hydraulics.green_reservoir_volume(),
            hydraulics.blue_reservoir_capacity() - hydraulics.blue_reservoir_volume(),
            hydraulics.yellow_reservoir_capacity() - hydraulics.yellow_reservoir_volume(),
        );

        let (left_system, right_system) = self.engine_systems.split_at_mut(1);
        self.apu_bleed_air_valve
            .update_move_fluid(context, &mut self.apu, &mut left_system[0]);

        self.cross_bleed_valve.update_move_fluid(
            context,
            &mut left_system[0],
            &mut right_system[0],
        );

        self.green_hydraulic_reservoir_with_valve
            .update_flow_through_valve(context, &mut left_system[0]);
        self.blue_hydraulic_reservoir_with_valve
            .update_flow_through_valve(context, &mut left_system[0]);
        self.yellow_hydraulic_reservoir_with_valve
            .update_flow_through_valve(context, &mut left_system[0]);

        self.packs[0].update(context, &mut left_system[0]);
        self.packs[1].update(context, &mut right_system[0]);
    }

    // TODO: Returning a mutable reference here is not great. I was running into an issue with the update order:
    // - The APU turbine must know about the bleed valve being open as soon as possible to update EGT properly
    // - To open the bleed valve, we need a signal from the ecb
    // - To get a signal from the ECB to open the bleed valve, we have to update the APU.
    // For now, we just pass over control of the bleed valve to the APU, so it can be updated after the ECB update but before the turbine update.
    pub fn apu_bleed_air_valve(&mut self) -> &mut impl ControllablePneumaticValve {
        &mut self.apu_bleed_air_valve
    }

    fn update_hydraulic_reservoir_spatial_volumes(
        &mut self,
        green_hydraulic_reservoir_volume: Volume,
        blue_hydraulic_reservoir_volume: Volume,
        yellow_hydraulic_reservoir_volume: Volume,
    ) {
        self.green_hydraulic_reservoir_with_valve
            .container()
            .change_spatial_volume(green_hydraulic_reservoir_volume);
        self.blue_hydraulic_reservoir_with_valve
            .container()
            .change_spatial_volume(blue_hydraulic_reservoir_volume);
        self.yellow_hydraulic_reservoir_with_valve
            .container()
            .change_spatial_volume(yellow_hydraulic_reservoir_volume);
    }

    pub fn green_hydraulic_reservoir_pressure(&self) -> Pressure {
        self.green_hydraulic_reservoir_with_valve.pressure()
    }

    pub fn blue_hydraulic_reservoir_pressure(&self) -> Pressure {
        self.blue_hydraulic_reservoir_with_valve.pressure()
    }

    pub fn yellow_hydraulic_reservoir_pressure(&self) -> Pressure {
        self.yellow_hydraulic_reservoir_with_valve.pressure()
    }

    pub fn pack_flow_valve_is_open(&self, number: usize) -> bool {
        self.packs[number - 1].pack_flow_valve_is_open()
    }
}
impl SimulationElement for A320Pneumatic {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_bleed_air_controller.accept(visitor);

        self.cross_bleed_valve.accept(visitor);

        for bmc in self.bleed_monitoring_computers.iter_mut() {
            bmc.accept(visitor);
        }

        for engine_system in self.engine_systems.iter_mut() {
            engine_system.accept(visitor);
        }

        self.fadec.accept(visitor);

        for pack in self.packs.iter_mut() {
            pack.accept(visitor)
        }

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.cross_bleed_valve_open_id,
            self.cross_bleed_valve.is_open(),
        );
        writer.write(
            &self.apu_bleed_air_valve_open_id,
            self.apu_bleed_air_valve.is_open(),
        );
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

struct BleedMonitoringComputer {
    main_channel_engine_number: usize,
    backup_channel_engine_number: usize,
    main_channel: BleedMonitoringComputerChannel,
    backup_channel: BleedMonitoringComputerChannel,
    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl BleedMonitoringComputer {
    fn new(
        main_channel_engine_number: usize,
        backup_channel_engine_number: usize,
        powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            main_channel_engine_number,
            backup_channel_engine_number,
            main_channel: BleedMonitoringComputerChannel::new(
                main_channel_engine_number,
                BleedMonitoringComputerChannelOperationMode::Master,
            ),
            backup_channel: BleedMonitoringComputerChannel::new(
                backup_channel_engine_number,
                BleedMonitoringComputerChannelOperationMode::Slave,
            ),
            powered_by,
            is_powered: true,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        sensors: &[EngineBleedAirSystem; 2],
        apu_bleed_valve_is_open: bool,
        overhead_panel: &mut A320PneumaticOverheadPanel,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        cross_bleed_valve_is_open: bool,
        fadec: &FullAuthorityDigitalEngineControl,
    ) {
        self.main_channel.update(
            context,
            &sensors[self.main_channel_engine_number - 1],
            engine_fire_push_buttons.is_released(self.main_channel_engine_number),
            apu_bleed_valve_is_open,
            cross_bleed_valve_is_open,
            overhead_panel,
            fadec,
        );

        self.backup_channel.update(
            context,
            &sensors[self.backup_channel_engine_number - 1],
            engine_fire_push_buttons.is_released(self.backup_channel_engine_number),
            apu_bleed_valve_is_open,
            cross_bleed_valve_is_open,
            overhead_panel,
            fadec,
        );
    }

    fn check_for_failure(&mut self, other: &mut BleedMonitoringComputer) {
        match other.signal() {
            None => {
                self.change_backup_channel_operation_mode(
                    BleedMonitoringComputerChannelOperationMode::Master,
                );
                other.change_main_channel_operation_mode(
                    BleedMonitoringComputerChannelOperationMode::Slave,
                );
            }
            Some(_) => {}
        }
    }

    pub fn change_main_channel_operation_mode(
        &mut self,
        mode: BleedMonitoringComputerChannelOperationMode,
    ) {
        self.main_channel.set_operation_mode(mode);
    }

    pub fn change_backup_channel_operation_mode(
        &mut self,
        mode: BleedMonitoringComputerChannelOperationMode,
    ) {
        self.backup_channel.set_operation_mode(mode);
    }

    pub fn channel_for_engine(
        &self,
        engine_number: usize,
    ) -> Option<&BleedMonitoringComputerChannel> {
        if engine_number == self.main_channel_engine_number {
            self.main_channel.or_none_if_slave()
        } else if engine_number == self.backup_channel_engine_number {
            self.backup_channel.or_none_if_slave()
        } else {
            None
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_powered
    }

    fn operation_mode_for_engine(
        &self,
        engine_number: usize,
    ) -> BleedMonitoringComputerChannelOperationMode {
        if engine_number == self.main_channel_engine_number {
            return self.main_channel.operation_mode();
        } else if engine_number == self.backup_channel_engine_number {
            return self.backup_channel.operation_mode();
        };

        panic!("Unknown engine number");
    }
}
impl SimulationElement for BleedMonitoringComputer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}
impl ControllerSignal<BleedMonitoringComputerIsAliveSignal> for BleedMonitoringComputer {
    fn signal(&self) -> Option<BleedMonitoringComputerIsAliveSignal> {
        if self.is_powered {
            Some(BleedMonitoringComputerIsAliveSignal)
        } else {
            None
        }
    }
}

struct BleedMonitoringComputerChannel {
    engine_number: usize,
    operation_mode: BleedMonitoringComputerChannelOperationMode,
    high_pressure_compressor_pressure: Pressure,
    transfer_pressure: Pressure,
    engine_starter_valve_is_open: bool,
    is_engine_bleed_pushbutton_auto: bool,
    is_engine_fire_pushbutton_released: bool,
    is_apu_bleed_valve_open: bool,
    is_apu_bleed_on: bool,
    high_pressure_valve_pid: PidController,
    pressure_regulating_valve_pid: PidController,
    fan_air_valve_pid: PidController,
    cross_bleed_valve_selector: CrossBleedValveSelectorMode,
    cross_bleed_valve_is_open: bool,
    engine_bleed_fault_light_monitor: EngineBleedFaultLightMonitor,
}
impl BleedMonitoringComputerChannel {
    fn new(
        engine_number: usize,
        operation_mode: BleedMonitoringComputerChannelOperationMode,
    ) -> Self {
        Self {
            engine_number,
            operation_mode,
            high_pressure_compressor_pressure: Pressure::new::<psi>(0.),
            transfer_pressure: Pressure::new::<psi>(0.),
            engine_starter_valve_is_open: false,
            is_engine_bleed_pushbutton_auto: true,
            is_engine_fire_pushbutton_released: false,
            is_apu_bleed_valve_open: false,
            is_apu_bleed_on: false,
            high_pressure_valve_pid: PidController::new(0.05, 0.003, 0., 0., 1., 65.),
            pressure_regulating_valve_pid: PidController::new(0.05, 0.01, 0., 0., 1., 46.),
            fan_air_valve_pid: PidController::new(-0.005, -0.001, 0., 0., 1., 200.),
            cross_bleed_valve_selector: CrossBleedValveSelectorMode::Auto,
            cross_bleed_valve_is_open: false,
            engine_bleed_fault_light_monitor: EngineBleedFaultLightMonitor::new(engine_number),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        sensors: &EngineBleedAirSystem,
        is_engine_fire_pushbutton_released: bool,
        apu_bleed_valve_is_open: bool,
        cross_bleed_valve_is_open: bool,
        overhead_panel: &mut A320PneumaticOverheadPanel,
        fadec: &FullAuthorityDigitalEngineControl,
    ) {
        self.high_pressure_compressor_pressure = sensors.high_pressure();
        self.transfer_pressure = sensors.transfer_pressure();

        self.pressure_regulating_valve_pid.change_setpoint(
            if fadec.is_single_vs_dual_bleed_config() {
                52.
            } else {
                46.
            },
        );

        self.high_pressure_valve_pid
            .next_control_output(self.transfer_pressure.get::<psi>(), Some(context.delta()));
        self.pressure_regulating_valve_pid.next_control_output(
            sensors.precooler_outlet_pressure().get::<psi>(),
            Some(context.delta()),
        );
        self.fan_air_valve_pid.next_control_output(
            sensors
                .precooler_outlet_temperature()
                .get::<degree_celsius>(),
            Some(context.delta()),
        );

        self.engine_starter_valve_is_open = sensors.engine_starter_valve_is_open();

        self.is_engine_bleed_pushbutton_auto =
            overhead_panel.engine_bleed_pb_is_auto(self.engine_number);
        self.is_engine_fire_pushbutton_released = is_engine_fire_pushbutton_released;

        self.is_apu_bleed_valve_open = apu_bleed_valve_is_open;
        self.is_apu_bleed_on = overhead_panel.apu_bleed_is_on();

        self.cross_bleed_valve_selector = overhead_panel.cross_bleed_mode();
        self.cross_bleed_valve_is_open = cross_bleed_valve_is_open;

        self.engine_bleed_fault_light_monitor.update(
            context,
            !sensors.pressure_regulating_valve_is_open(),
            !sensors.engine_starter_valve_is_open(),
            !apu_bleed_valve_is_open,
            overhead_panel.apu_bleed_is_on(),
            overhead_panel.cross_bleed_mode() == CrossBleedValveSelectorMode::Shut,
            !cross_bleed_valve_is_open,
            sensors.precooler_inlet_pressure(),
            sensors.precooler_outlet_temperature(),
        );

        self.update_fault_lights(overhead_panel);
    }

    fn update_fault_lights(&self, overhead_panel: &mut A320PneumaticOverheadPanel) {
        if let Some(signal) = self.engine_bleed_fault_light_monitor.signal() {
            overhead_panel
                .set_engine_bleed_has_fault(self.engine_number, signal.fault_light_should_be_on());
        }
    }

    pub fn operation_mode(&self) -> BleedMonitoringComputerChannelOperationMode {
        self.operation_mode
    }

    pub fn set_operation_mode(&mut self, mode: BleedMonitoringComputerChannelOperationMode) {
        self.operation_mode = mode;
    }

    pub fn or_none_if_slave(&self) -> Option<&BleedMonitoringComputerChannel> {
        match self.operation_mode() {
            BleedMonitoringComputerChannelOperationMode::Master => Some(self),
            BleedMonitoringComputerChannelOperationMode::Slave => None,
        }
    }
}
impl ControllerSignal<HighPressureValveSignal> for BleedMonitoringComputerChannel {
    fn signal(&self) -> Option<HighPressureValveSignal> {
        if self.high_pressure_compressor_pressure < Pressure::new::<psi>(18.) {
            return Some(HighPressureValveSignal::new_closed());
        }

        Some(HighPressureValveSignal::new(Ratio::new::<ratio>(
            self.high_pressure_valve_pid.output(),
        )))
    }
}
impl ControllerSignal<PressureRegulatingValveSignal> for BleedMonitoringComputerChannel {
    fn signal(&self) -> Option<PressureRegulatingValveSignal> {
        if self.transfer_pressure < Pressure::new::<psi>(18.) {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        if !self.is_engine_bleed_pushbutton_auto || self.is_engine_fire_pushbutton_released {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        if self.is_apu_bleed_on
            && self.is_apu_bleed_valve_open
            && (self.engine_number == 1 || self.cross_bleed_valve_is_open)
        {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        if self.engine_starter_valve_is_open {
            return Some(PressureRegulatingValveSignal::new_closed());
        }

        Some(PressureRegulatingValveSignal::new(Ratio::new::<ratio>(
            self.pressure_regulating_valve_pid.output(),
        )))
    }
}
impl ControllerSignal<FanAirValveSignal> for BleedMonitoringComputerChannel {
    fn signal(&self) -> Option<FanAirValveSignal> {
        Some(FanAirValveSignal::new(Ratio::new::<ratio>(
            self.fan_air_valve_pid.output(),
        )))
    }
}
impl ControllerSignal<CrossBleedValveSignal> for BleedMonitoringComputerChannel {
    fn signal(&self) -> Option<CrossBleedValveSignal> {
        match self.cross_bleed_valve_selector {
            CrossBleedValveSelectorMode::Shut => Some(CrossBleedValveSignal::new_closed(true)),
            CrossBleedValveSelectorMode::Open => Some(CrossBleedValveSignal::new_open(true)),
            CrossBleedValveSelectorMode::Auto => {
                if self.is_apu_bleed_valve_open {
                    Some(CrossBleedValveSignal::new_open(false))
                } else {
                    Some(CrossBleedValveSignal::new_closed(false))
                }
            }
        }
    }
}

// Such a monitor does not exist in the real aircraft, I am only putting this in for code separation concerns
struct EngineBleedFaultLightMonitor {
    engine_number: usize,
    pressure_regulating_valve_not_in_commanded_position_for_eight_seconds: DelayedTrueLogicGate,
    overtemperature_for_55_seconds: DelayedTrueLogicGate,
    overpressure_for_15_seconds: DelayedTrueLogicGate,
}
impl EngineBleedFaultLightMonitor {
    fn new(engine_number: usize) -> Self {
        Self {
            engine_number,
            pressure_regulating_valve_not_in_commanded_position_for_eight_seconds:
                DelayedTrueLogicGate::new(Duration::from_secs(8)),
            overtemperature_for_55_seconds: DelayedTrueLogicGate::new(Duration::from_secs(55)),
            overpressure_for_15_seconds: DelayedTrueLogicGate::new(Duration::from_secs(15)),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        is_pressure_regulating_valve_fully_closed: bool,
        is_engine_starter_valve_fully_closed: bool,
        is_apu_bleed_valve_fully_closed: bool,
        is_apu_bleed_pb_on: bool,
        is_cross_bleed_selector_shut: bool,
        is_cross_bleed_valve_fully_closed: bool,
        precooler_inlet_pressure: Pressure,
        precooler_outlet_temperature: ThermodynamicTemperature,
    ) {
        self.overtemperature_for_55_seconds.update(
            context,
            precooler_outlet_temperature > ThermodynamicTemperature::new::<degree_celsius>(257.),
        );

        self.overpressure_for_15_seconds.update(
            context,
            precooler_inlet_pressure > Pressure::new::<psi>(57.),
        );

        let should_prv_be_closed = self.should_prv_be_closed(
            is_engine_starter_valve_fully_closed,
            is_apu_bleed_valve_fully_closed,
            is_apu_bleed_pb_on,
            is_cross_bleed_selector_shut,
            is_cross_bleed_valve_fully_closed,
        );

        self.pressure_regulating_valve_not_in_commanded_position_for_eight_seconds
            .update(
                context,
                !is_pressure_regulating_valve_fully_closed && should_prv_be_closed,
            );
    }

    fn should_prv_be_closed(
        &self,
        is_engine_starter_valve_fully_closed: bool,
        is_apu_bleed_valve_fully_closed: bool,
        is_apu_bleed_pb_on: bool,
        is_cross_bleed_selector_shut: bool,
        is_cross_bleed_valve_fully_closed: bool,
    ) -> bool {
        let is_apu_providing_air = !is_apu_bleed_valve_fully_closed && is_apu_bleed_pb_on;
        let apu_bleed_closure_condition = !is_cross_bleed_selector_shut && is_apu_providing_air;

        let is_engine_one = self.engine_number == 1;
        let cross_bleed_closure_condition = is_apu_providing_air
            && is_engine_one
            && is_cross_bleed_selector_shut
            && is_cross_bleed_valve_fully_closed;

        !is_engine_starter_valve_fully_closed
            || apu_bleed_closure_condition
            || cross_bleed_closure_condition
    }
}
impl ControllerSignal<FaultLightSignal> for EngineBleedFaultLightMonitor {
    fn signal(&self) -> Option<FaultLightSignal> {
        Some(FaultLightSignal::new(
            self.pressure_regulating_valve_not_in_commanded_position_for_eight_seconds
                .output()
                || self.overpressure_for_15_seconds.output()
                || self.overtemperature_for_55_seconds.output(),
        ))
    }
}

struct EngineBleedAirSystem {
    intermediate_pressure_id: VariableIdentifier,
    high_pressure_id: VariableIdentifier,
    transfer_pressure_id: VariableIdentifier,
    precooler_inlet_pressure_id: VariableIdentifier,
    precooler_outlet_pressure_id: VariableIdentifier,
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

    number: usize,
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
    precooler_cooling_pipe: PneumaticPipe,
    engine_starter_exhaust: PneumaticExhaust,
    engine_starter_container: PneumaticPipe,
    engine_starter_valve: DefaultValve,
    fan_air_valve: ElectroPneumaticValve,
    precooler: Precooler,
}
impl EngineBleedAirSystem {
    fn new(context: &mut InitContext, number: usize, powered_by: ElectricalBusType) -> Self {
        Self {
            number,
            intermediate_pressure_id: context
                .get_identifier(format!("PNEU_ENG_{}_IP_PRESSURE", number)),
            high_pressure_id: context.get_identifier(format!("PNEU_ENG_{}_HP_PRESSURE", number)),
            transfer_pressure_id: context
                .get_identifier(format!("PNEU_ENG_{}_TRANSFER_PRESSURE", number)),
            precooler_inlet_pressure_id: context
                .get_identifier(format!("PNEU_ENG_{}_PRECOOLER_INLET_PRESSURE", number)),
            precooler_outlet_pressure_id: context
                .get_identifier(format!("PNEU_ENG_{}_PRECOOLER_OUTLET_PRESSURE", number)),
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
            fan_compression_chamber_controller: EngineCompressionChamberController::new(
                context, 1., 0., 2.,
            ),
            intermediate_pressure_compression_chamber_controller:
                EngineCompressionChamberController::new(context, 3., 0., 4.),
            high_pressure_compression_chamber_controller: EngineCompressionChamberController::new(
                context, 3., 2., 4.,
            ),
            fan_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(1.)),
            intermediate_pressure_compression_chamber: CompressionChamber::new(Volume::new::<
                cubic_meter,
            >(1.)),
            high_pressure_compression_chamber: CompressionChamber::new(Volume::new::<cubic_meter>(
                1.,
            )),
            intermediate_pressure_valve: PurelyPneumaticValve::new(1.),
            high_pressure_valve: ElectroPneumaticValve::new(1e-2, powered_by),
            pressure_regulating_valve: ElectroPneumaticValve::new(1., powered_by),
            fan_air_valve: ElectroPneumaticValve::new(1., powered_by),
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
                Volume::new::<cubic_meter>(0.5),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            precooler_cooling_pipe: PneumaticPipe::new(
                Volume::new::<cubic_meter>(1.),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            engine_starter_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(0.5),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            engine_starter_exhaust: PneumaticExhaust::new(1e-2),
            engine_starter_valve: DefaultValve::new_closed(),
            precooler: Precooler::new(5.),
        }
    }

    fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        high_pressure_valve_controller: &impl ControllerSignal<HighPressureValveSignal>,
        pressure_regulating_valve_controller: &impl ControllerSignal<PressureRegulatingValveSignal>,
        engine_starter_valve_controller: &impl ControllerSignal<EngineStarterValveSignal>,
        fan_air_valve_controller: &impl ControllerSignal<FanAirValveSignal>,
        engine: &T,
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

        // Update valves (open amount)
        self.high_pressure_valve
            .update_open_amount(high_pressure_valve_controller);
        self.pressure_regulating_valve
            .update_open_amount(pressure_regulating_valve_controller);
        self.engine_starter_valve
            .update_open_amount(engine_starter_valve_controller);
        self.fan_air_valve
            .update_open_amount(fan_air_valve_controller);

        // Update valves (fluid movement)
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
            &mut self.precooler_cooling_pipe,
        );
        self.pressure_regulating_valve.update_move_fluid(
            context,
            &mut self.transfer_pressure_pipe,
            &mut self.precooler_inlet_pipe,
        );
        self.precooler.update(
            context,
            &mut self.precooler_inlet_pipe,
            &mut self.precooler_cooling_pipe,
            &mut self.precooler_outlet_pipe,
        );
        self.engine_starter_valve.update_move_fluid(
            context,
            &mut self.precooler_inlet_pipe,
            &mut self.engine_starter_container,
        );
        self.engine_starter_exhaust
            .update_move_fluid(context, &mut self.engine_starter_container)
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

    fn precooler_inlet_pressure(&self) -> Pressure {
        self.precooler_inlet_pipe.pressure()
    }

    fn precooler_outlet_pressure(&self) -> Pressure {
        self.precooler_outlet_pipe.pressure()
    }

    fn precooler_supply_pressure(&self) -> Pressure {
        self.precooler_cooling_pipe.pressure()
    }

    fn engine_starter_container_pressure(&self) -> Pressure {
        self.engine_starter_container.pressure()
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

    fn precooler_supply_temperature(&self) -> ThermodynamicTemperature {
        self.precooler_cooling_pipe.temperature()
    }

    fn engine_starter_container_temperature(&self) -> ThermodynamicTemperature {
        self.engine_starter_container.temperature()
    }

    fn pressure_regulating_valve_open_amount(&self) -> Ratio {
        self.pressure_regulating_valve.open_amount()
    }

    fn high_pressure_valve_open_amount(&self) -> Ratio {
        self.high_pressure_valve.open_amount()
    }

    fn engine_starter_valve_is_open(&self) -> bool {
        self.engine_starter_valve.is_open()
    }

    fn pressure_regulating_valve_is_open(&self) -> bool {
        self.pressure_regulating_valve.is_open()
    }
}
impl SimulationElement for EngineBleedAirSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.intermediate_pressure_compression_chamber_controller
            .accept(visitor);
        self.high_pressure_compression_chamber_controller
            .accept(visitor);

        self.high_pressure_valve.accept(visitor);
        self.pressure_regulating_valve.accept(visitor);
        self.fan_air_valve.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.intermediate_pressure_id, self.intermediate_pressure());
        writer.write(&self.high_pressure_id, self.high_pressure());
        writer.write(&self.transfer_pressure_id, self.transfer_pressure());
        writer.write(
            &self.precooler_inlet_pressure_id,
            self.precooler_inlet_pressure(),
        );
        writer.write(
            &self.precooler_outlet_pressure_id,
            self.precooler_outlet_pressure(),
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

    fn change_volume(&mut self, volume: Volume) {
        self.precooler_outlet_pipe.change_volume(volume)
    }

    fn update_temperature(&mut self, temperature: TemperatureInterval) {
        self.precooler_outlet_pipe.update_temperature(temperature);
    }
}

pub struct A320PneumaticOverheadPanel {
    apu_bleed: OnOffFaultPushButton,
    cross_bleed: CrossBleedValveSelectorKnob,
    engine_1_bleed: AutoOffFaultPushButton,
    engine_2_bleed: AutoOffFaultPushButton,
}
impl A320PneumaticOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        A320PneumaticOverheadPanel {
            apu_bleed: OnOffFaultPushButton::new_on(context, "PNEU_APU_BLEED"),
            cross_bleed: CrossBleedValveSelectorKnob::new_auto(context),
            engine_1_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_1_BLEED"),
            engine_2_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_2_BLEED"),
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
            _ => panic!("Invalid engine number"),
        }
    }

    pub fn engine_bleed_pb_has_fault(&self, engine_number: usize) -> bool {
        match engine_number {
            1 => self.engine_1_bleed.has_fault(),
            2 => self.engine_2_bleed.has_fault(),
            _ => panic!("Invalid engine number"),
        }
    }

    pub fn set_engine_bleed_has_fault(&mut self, engine_number: usize, has_fault: bool) {
        match engine_number {
            1 => self.engine_1_bleed.set_fault(has_fault),
            2 => self.engine_2_bleed.set_fault(has_fault),
            _ => panic!("Invalid engine number"),
        }
    }
}
impl SimulationElement for A320PneumaticOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_bleed.accept(visitor);
        self.cross_bleed.accept(visitor);
        self.engine_1_bleed.accept(visitor);
        self.engine_2_bleed.accept(visitor);

        visitor.visit(self);
    }
}

/// We use this simply as an interface to engine parameter simvars. It should probably not be part of the pneumatic system.
struct FullAuthorityDigitalEngineControl {
    engine_1_state_id: VariableIdentifier,
    engine_2_state_id: VariableIdentifier,

    engine_1_state: EngineState,
    engine_2_state: EngineState,
}
impl FullAuthorityDigitalEngineControl {
    fn new(context: &mut InitContext) -> Self {
        Self {
            engine_1_state_id: context.get_identifier("ENGINE_STATE:1".to_owned()),
            engine_2_state_id: context.get_identifier("ENGINE_STATE:2".to_owned()),
            engine_1_state: EngineState::Off,
            engine_2_state: EngineState::Off,
        }
    }

    fn engine_state(&self, number: usize) -> EngineState {
        match number {
            1 => self.engine_1_state,
            2 => self.engine_2_state,
            _ => panic!("Invalid engine number"),
        }
    }

    pub fn is_single_vs_dual_bleed_config(&self) -> bool {
        (self.engine_1_state == EngineState::On) ^ (self.engine_2_state == EngineState::On)
    }
}
impl SimulationElement for FullAuthorityDigitalEngineControl {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.engine_1_state = reader.read(&self.engine_1_state_id);
        self.engine_2_state = reader.read(&self.engine_2_state_id);
    }
}

// Just sticking all of the pack related things into this.
struct PackComplex {
    pack_flow_valve_flow_rate_id: VariableIdentifier,
    pack_container: PneumaticPipe,
    exhaust: PneumaticExhaust,
    pack_flow_valve: DefaultValve,
    pack_flow_valve_controller: PackFlowValveController,
}
// TODO: Consumption rate should be like 0.75 m^3/s which is a about 0.4 kg/s.
impl PackComplex {
    fn new(context: &mut InitContext, engine_number: usize) -> Self {
        Self {
            pack_flow_valve_flow_rate_id: context
                .get_identifier(format!("PNEU_PACK_{}_FLOW_VALVE_FLOW_RATE", engine_number)),
            pack_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(1.),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            exhaust: PneumaticExhaust::new(0.1),
            pack_flow_valve: DefaultValve::new_closed(),
            pack_flow_valve_controller: PackFlowValveController::new(context, engine_number),
        }
    }

    fn update(&mut self, context: &UpdateContext, from: &mut impl PneumaticContainer) {
        self.pack_flow_valve_controller
            .update(context, self.pack_flow_valve.fluid_flow());

        self.pack_flow_valve
            .update_open_amount(&self.pack_flow_valve_controller);

        self.pack_flow_valve
            .update_move_fluid(context, from, &mut self.pack_container);

        self.exhaust
            .update_move_fluid(context, &mut self.pack_container);
    }

    pub fn pack_flow_valve_is_open(&self) -> bool {
        self.pack_flow_valve.is_open()
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

    fn change_volume(&mut self, volume: Volume) {
        self.pack_container.change_volume(volume);
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        self.pack_container.update_temperature(temperature_change);
    }
}
impl SimulationElement for PackComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.pack_flow_valve_controller.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.pack_flow_valve_flow_rate_id,
            self.pack_flow_valve.fluid_flow(),
        );
    }
}

// This will probably be removed in the future, but
struct PackFlowValveController {
    pack_toggle_pb_id: VariableIdentifier,
    pack_pb_is_auto: bool,
    pid: PidController,
}
impl PackFlowValveController {
    fn new(context: &mut InitContext, engine_number: usize) -> Self {
        Self {
            pack_toggle_pb_id: context
                .get_identifier(format!("AIRCOND_PACK{}_TOGGLE", engine_number)),
            pack_pb_is_auto: true,
            pid: PidController::new(0., 0.05, 0., 0., 1., 0.75),
        }
    }

    fn update(&mut self, context: &UpdateContext, pack_flow_valve_flow_rate: VolumeRate) {
        self.pid.next_control_output(
            pack_flow_valve_flow_rate.get::<cubic_meter_per_second>(),
            Some(context.delta()),
        );
    }
}
impl ControllerSignal<PackFlowValveSignal> for PackFlowValveController {
    fn signal(&self) -> Option<PackFlowValveSignal> {
        Some(match self.pack_pb_is_auto {
            true => PackFlowValveSignal::new(Ratio::new::<ratio>(self.pid.output())),
            false => PackFlowValveSignal::new_closed(),
        })
    }
}
impl SimulationElement for PackFlowValveController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.pack_pb_is_auto = reader.read(&self.pack_toggle_pb_id);
    }
}

/// This is a unique valve (and specific to the A320 probably) because it is controlled by two motors. One for manual control and one for automatic control
pub struct CrossBleedValve {
    open_amount: Ratio,
    connector: PneumaticContainerConnector,
    spring_characteristic: f64,
    is_powered_for_manual_control: bool,
    is_powered_for_automatic_control: bool,
}
impl CrossBleedValve {
    pub fn new(spring_characteristic: f64) -> Self {
        Self {
            open_amount: Ratio::new::<ratio>(0.),
            connector: PneumaticContainerConnector::new(),
            spring_characteristic,
            is_powered_for_manual_control: false,
            is_powered_for_automatic_control: false,
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        if !self.is_powered_for_manual_control && !self.is_powered_for_automatic_control {
            self.set_open_amount_from_pressure_difference(from.pressure() - to.pressure())
        }

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, from, to);
    }

    fn set_open_amount_from_pressure_difference(&mut self, pressure_difference: Pressure) {
        self.open_amount = Ratio::new::<ratio>(
            2. / PI
                * (pressure_difference.get::<psi>() * self.spring_characteristic)
                    .atan()
                    .max(0.),
        );
    }

    pub fn fluid_flow(&self) -> VolumeRate {
        self.connector.fluid_flow()
    }

    pub fn is_powered_for_manual_control(&self) -> bool {
        self.is_powered_for_manual_control
    }

    pub fn is_powered_for_automatic_control(&self) -> bool {
        self.is_powered_for_automatic_control
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }

    fn update_open_amount(&mut self, controller: &impl ControllerSignal<CrossBleedValveSignal>) {
        if let Some(signal) = controller.signal() {
            if signal.is_manual_vs_automatic && self.is_powered_for_manual_control
                || !signal.is_manual_vs_automatic && self.is_powered_for_automatic_control
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
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered_for_manual_control =
            buses.is_powered(ElectricalBusType::DirectCurrentEssentialShed);
        self.is_powered_for_automatic_control =
            buses.is_powered(ElectricalBusType::DirectCurrent(2));
    }
}

#[cfg(test)]
mod tests {
    use crate::hydraulic::{A320Hydraulic, A320HydraulicOverheadPanel};

    use systems::{
        electrical::{
            test::TestElectricitySource, ElectricalBus, Electricity, ElectricitySource,
            ExternalPowerSource,
        },
        engine::leap_engine::LeapEngine,
        hydraulic::brake_circuit::AutobrakePanel,
        landing_gear::{LandingGear, LandingGearControlInterfaceUnit},
        overhead::MomentaryPushButton,
        pneumatic::{
            BleedMonitoringComputerChannelOperationMode, ControllablePneumaticValve,
            CrossBleedValveSelectorMode, EngineState, PneumaticContainer, PneumaticValveSignal,
        },
        shared::{
            arinc429::SignStatus, ApuBleedAirValveSignal, ControllerSignal, ElectricalBusType,
            ElectricalBuses, EmergencyElectricalRatPushButton, EmergencyElectricalState,
            EngineFirePushButtons, InternationalStandardAtmosphere, MachNumber, PneumaticValve,
            PotentialOrigin,
        },
        simulation::{
            test::{SimulationTestBed, TestBed, WriteByName},
            Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };

    use std::{fs::File, time::Duration};

    use uom::si::{
        f64::*, length::foot, pressure::psi, ratio::ratio,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    use super::{A320Pneumatic, A320PneumaticOverheadPanel};

    struct TestApu {
        bleed_air_valve_signal: ApuBleedAirValveSignal,
    }
    impl TestApu {
        fn new() -> Self {
            Self {
                bleed_air_valve_signal: ApuBleedAirValveSignal::new_closed(),
            }
        }

        fn update(&self, bleed_valve: &mut impl ControllablePneumaticValve) {
            bleed_valve.update_open_amount(self);
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

    struct TestEngineFirePushButtons {
        is_released: [bool; 2],
    }
    impl TestEngineFirePushButtons {
        fn new() -> Self {
            Self {
                is_released: [false, false],
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

    struct A320TestElectrical {
        airspeed: Velocity,
        all_ac_lost: bool,
    }
    impl A320TestElectrical {
        pub fn new() -> Self {
            A320TestElectrical {
                airspeed: Velocity::new::<knot>(100.),
                all_ac_lost: false,
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.airspeed = context.indicated_airspeed();
        }
    }
    impl EmergencyElectricalState for A320TestElectrical {
        fn is_in_emergency_elec(&self) -> bool {
            self.all_ac_lost && self.airspeed >= Velocity::new::<knot>(100.)
        }
    }
    impl SimulationElement for A320TestElectrical {
        fn receive_power(&mut self, buses: &impl ElectricalBuses) {
            self.all_ac_lost = !buses.is_powered(ElectricalBusType::AlternatingCurrent(1))
                && !buses.is_powered(ElectricalBusType::AlternatingCurrent(2));
        }
    }

    struct A320TestEmergencyElectricalOverheadPanel {
        rat_and_emer_gen_man_on: MomentaryPushButton,
    }

    impl A320TestEmergencyElectricalOverheadPanel {
        pub fn new(context: &mut InitContext) -> Self {
            A320TestEmergencyElectricalOverheadPanel {
                rat_and_emer_gen_man_on: MomentaryPushButton::new(
                    context,
                    "EMER_ELEC_RAT_AND_EMER_GEN",
                ),
            }
        }
    }
    impl SimulationElement for A320TestEmergencyElectricalOverheadPanel {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.rat_and_emer_gen_man_on.accept(visitor);

            visitor.visit(self);
        }
    }
    impl EmergencyElectricalRatPushButton for A320TestEmergencyElectricalOverheadPanel {
        fn is_pressed(&self) -> bool {
            self.rat_and_emer_gen_man_on.is_pressed()
        }
    }

    struct PneumaticTestAircraft {
        pneumatic: A320Pneumatic,
        apu: TestApu,
        engine_1: LeapEngine,
        engine_2: LeapEngine,
        pneumatic_overhead_panel: A320PneumaticOverheadPanel,
        fire_pushbuttons: TestEngineFirePushButtons,
        hydraulics: A320Hydraulic,
        hydraulics_overhead_panel: A320HydraulicOverheadPanel,
        autobrake_panel: AutobrakePanel,
        emergency_electrical_overhead: A320TestEmergencyElectricalOverheadPanel,
        landing_gear: LandingGear,
        lgciu1: LandingGearControlInterfaceUnit,
        lgciu2: LandingGearControlInterfaceUnit,
        electrical: A320TestElectrical,
        powered_source: TestElectricitySource,
        ext_pwr: ExternalPowerSource,
        dc_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,
        dc_ess_shed_bus: ElectricalBus,
        // Electric buses states to be able to kill them dynamically
        is_dc_1_powered: bool,
        is_dc_2_powered: bool,
        is_dc_ess_powered: bool,
        is_dc_ess_shed_powered: bool,
    }
    impl PneumaticTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                pneumatic: A320Pneumatic::new(context),
                apu: TestApu::new(),
                engine_1: LeapEngine::new(context, 1),
                engine_2: LeapEngine::new(context, 2),
                pneumatic_overhead_panel: A320PneumaticOverheadPanel::new(context),
                fire_pushbuttons: TestEngineFirePushButtons::new(),
                hydraulics_overhead_panel: A320HydraulicOverheadPanel::new(context),
                autobrake_panel: AutobrakePanel::new(context),
                emergency_electrical_overhead: A320TestEmergencyElectricalOverheadPanel::new(
                    context,
                ),
                landing_gear: LandingGear::new(context),
                lgciu1: LandingGearControlInterfaceUnit::new(
                    ElectricalBusType::DirectCurrentEssential,
                ),
                lgciu2: LandingGearControlInterfaceUnit::new(ElectricalBusType::DirectCurrent(2)),
                hydraulics: A320Hydraulic::new(context),
                electrical: A320TestElectrical::new(),
                ext_pwr: ExternalPowerSource::new(context),
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
                is_dc_1_powered: true,
                is_dc_2_powered: true,
                is_dc_ess_powered: true,
                is_dc_ess_shed_powered: true,
            }
        }

        fn set_dc_2_bus_power(&mut self, is_powered: bool) {
            self.is_dc_2_powered = is_powered;
        }

        fn set_dc_ess_shed_bus_power(&mut self, is_powered: bool) {
            self.is_dc_ess_shed_powered = is_powered;
        }

        fn update_hydraulics(&mut self, context: &UpdateContext) {
            self.lgciu1.update(
                &self.landing_gear,
                self.ext_pwr.output_potential().is_powered(),
            );
            self.lgciu2.update(
                &self.landing_gear,
                self.ext_pwr.output_potential().is_powered(),
            );

            self.hydraulics.update(
                context,
                &self.engine_1,
                &self.engine_2,
                &self.hydraulics_overhead_panel,
                &self.autobrake_panel,
                &self.fire_pushbuttons,
                &self.lgciu1,
                &self.lgciu2,
                &self.emergency_electrical_overhead,
                &self.electrical,
            );

            self.hydraulics_overhead_panel.update(&self.hydraulics);
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
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.electrical.update(context);

            self.update_hydraulics(context);

            self.apu.update(self.pneumatic.apu_bleed_air_valve());
            self.pneumatic.update(
                context,
                [&self.engine_1, &self.engine_2],
                &mut self.pneumatic_overhead_panel,
                &self.fire_pushbuttons,
                &self.hydraulics,
            );
        }
    }
    impl SimulationElement for PneumaticTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.landing_gear.accept(visitor);
            self.lgciu1.accept(visitor);
            self.lgciu2.accept(visitor);
            self.hydraulics.accept(visitor);
            self.autobrake_panel.accept(visitor);
            self.hydraulics_overhead_panel.accept(visitor);
            self.emergency_electrical_overhead.accept(visitor);
            self.electrical.accept(visitor);
            self.ext_pwr.accept(visitor);
            self.pneumatic.accept(visitor);
            self.engine_1.accept(visitor);
            self.engine_2.accept(visitor);
            self.pneumatic_overhead_panel.accept(visitor);

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
            Self {
                test_bed: SimulationTestBed::<PneumaticTestAircraft>::new(|context| {
                    PneumaticTestAircraft::new(context)
                }),
            }
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

        fn toga_eng1(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:1", true);
            self.write_by_name("TURB ENG CORRECTED N2:1", Ratio::new::<ratio>(0.65));
            self.write_by_name("TURB ENG CORRECTED N1:1", Ratio::new::<ratio>(0.99));
            self.write_by_name("ENGINE_STATE:1", EngineState::On);

            self
        }

        fn toga_eng2(mut self) -> Self {
            self.write_by_name("GENERAL ENG STARTER ACTIVE:2", true);
            self.write_by_name("TURB ENG CORRECTED N2:2", Ratio::new::<ratio>(0.65));
            self.write_by_name("TURB ENG CORRECTED N1:2", Ratio::new::<ratio>(0.99));
            self.write_by_name("ENGINE_STATE:2", EngineState::On);

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
            self.query(|a| a.pneumatic.engine_systems[number - 1].precooler_supply_pressure())
        }

        fn engine_starter_container_pressure(&self, number: usize) -> Pressure {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1].engine_starter_container_pressure()
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
            self.query(|a| a.pneumatic.engine_systems[number - 1].precooler_supply_temperature())
        }

        fn engine_starter_container_temperature(&self, number: usize) -> ThermodynamicTemperature {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1].engine_starter_container_temperature()
            })
        }

        fn ip_valve_is_open(&self, number: usize) -> bool {
            self.query(|a| {
                a.pneumatic.engine_systems[number - 1]
                    .intermediate_pressure_valve
                    .is_open()
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
            self.write_arinc429_by_name(
                "APU_BLEED_AIR_PRESSURE",
                Pressure::new::<psi>(42.),
                SignStatus::NormalOperation,
            );
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

        fn is_fire_pushbutton_released(&self, number: usize) -> bool {
            self.query(|a| a.fire_pushbuttons.is_released(number))
        }

        fn cross_bleed_valve_is_open(&self) -> bool {
            self.query(|a| a.pneumatic.cross_bleed_valve.is_open())
        }

        fn cross_bleed_valve_selector(&self) -> CrossBleedValveSelectorMode {
            self.query(|a| a.pneumatic_overhead_panel.cross_bleed_mode())
        }

        fn engine_bleed_push_button_is_auto(&self, number: usize) -> bool {
            self.query(|a| a.pneumatic_overhead_panel.engine_bleed_pb_is_auto(number))
        }

        fn engine_bleed_push_button_has_fault(&self, number: usize) -> bool {
            self.query(|a| a.pneumatic_overhead_panel.engine_bleed_pb_has_fault(number))
        }

        fn green_hydraulic_reservoir_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.green_hydraulic_reservoir_pressure())
        }

        fn blue_hydraulic_reservoir_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.blue_hydraulic_reservoir_pressure())
        }

        fn yellow_hydraulic_reservoir_pressure(&self) -> Pressure {
            self.query(|a| a.pneumatic.yellow_hydraulic_reservoir_pressure())
        }

        fn set_pack_flow_pb_is_auto(mut self, number: usize, is_auto: bool) -> Self {
            self.write_by_name(&format!("AIRCOND_PACK{}_TOGGLE", number), is_auto);

            self
        }

        fn pack_flow_valve_is_open(&self, number: usize) -> bool {
            self.query(|a| a.pneumatic.pack_flow_valve_is_open(number))
        }

        fn both_packs_auto(self) -> Self {
            self.set_pack_flow_pb_is_auto(1, true)
                .set_pack_flow_pb_is_auto(2, true)
        }

        fn bmc_operation_mode_for_engine(
            &self,
            bmc_number: usize,
            engine_number: usize,
        ) -> BleedMonitoringComputerChannelOperationMode {
            self.query(|a| {
                a.pneumatic.bleed_monitoring_computers[bmc_number - 1]
                    .operation_mode_for_engine(engine_number)
            })
        }

        fn set_dc_2_bus_power(mut self, is_powered: bool) -> Self {
            self.command(|a| a.set_dc_2_bus_power(is_powered));

            self
        }

        fn set_dc_ess_shed_bus_power(mut self, is_powered: bool) -> Self {
            self.command(|a| a.set_dc_ess_shed_bus_power(is_powered));

            self
        }

        fn bmc_is_powered(&self, bmc_number: usize) -> bool {
            self.query(|a| a.pneumatic.bleed_monitoring_computers[bmc_number - 1].is_powered())
        }

        fn fadec_single_vs_dual_bleed_config(&self) -> bool {
            self.query(|a| a.pneumatic.fadec.is_single_vs_dual_bleed_config())
        }

        fn pack_flow_valve_flow(&self, engine_number: usize) -> VolumeRate {
            self.query(|a| {
                a.pneumatic.packs[engine_number - 1]
                    .pack_flow_valve
                    .fluid_flow()
            })
        }

        fn pack_container_pressure(&self, engine_number: usize) -> Pressure {
            self.query(|a| {
                a.pneumatic.packs[engine_number - 1]
                    .pack_container
                    .pressure()
            })
        }

        fn cross_bleed_valve_is_powered_for_automatic_control(&self) -> bool {
            self.query(|a| {
                a.pneumatic
                    .cross_bleed_valve
                    .is_powered_for_automatic_control()
            })
        }

        fn cross_bleed_valve_is_powered_for_manual_control(&self) -> bool {
            self.query(|a| {
                a.pneumatic
                    .cross_bleed_valve
                    .is_powered_for_manual_control()
            })
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

    // Just a way for me to plot some graphs
    #[test]
    fn test() {
        let alt = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .in_isa_atmosphere(alt)
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .mach_number(MachNumber(0.))
            .both_packs_auto();

        let mut ts = Vec::new();
        let mut hps = Vec::new();
        let mut ips = Vec::new();
        let mut c2s = Vec::new(); // Transfer pressure (before PRV)
        let mut c1s = Vec::new(); // Precooler inlet pressure
        let mut c0s = Vec::new(); // Precooler outlet pressure
        let mut pcss = Vec::new(); // Precooler cooling air pressure
        let mut escs = Vec::new(); // Precooler cooling air pressure
        let mut ipts = Vec::new();
        let mut hpts = Vec::new(); // Transfer temperature (before PRV)
        let mut c2ts = Vec::new(); // Precooler inlet temperature
        let mut c1ts = Vec::new(); // Precooler outlet temperature
        let mut c0ts = Vec::new(); // Precooler cooling air temperature
        let mut pcsts = Vec::new();
        let mut escts = Vec::new();
        let mut hpv_open = Vec::new();
        let mut prv_open = Vec::new();
        let mut ipv_open = Vec::new();
        let mut esv_open = Vec::new();
        let mut abv_open = Vec::new();
        let mut fav_open = Vec::new();

        for i in 1..5000 {
            if i == 5000 {
                // test_bed = test_bed.toga_eng1().toga_eng2();
            }

            // println!(
            //     "{}",
            //     test_bed
            //         .pack_flow_valve_flow(1)
            //         .get::<cubic_meter_per_second>()
            // );
            // println!("{}", test_bed.pack_container_pressure(1).get::<psi>());

            ts.push(i as f64 * 16.);

            hps.push(test_bed.hp_pressure(1).get::<psi>());
            ips.push(test_bed.ip_pressure(1).get::<psi>());
            c2s.push(test_bed.transfer_pressure(1).get::<psi>());
            c1s.push(test_bed.precooler_inlet_pressure(1).get::<psi>());
            c0s.push(test_bed.precooler_outlet_pressure(1).get::<psi>());
            pcss.push(test_bed.precooler_supply_pressure(1).get::<psi>());
            escs.push(test_bed.engine_starter_container_pressure(1).get::<psi>());

            ipts.push(test_bed.ip_temperature(1).get::<degree_celsius>());
            hpts.push(test_bed.hp_temperature(1).get::<degree_celsius>());
            c2ts.push(test_bed.transfer_temperature(1).get::<degree_celsius>());
            c1ts.push(
                test_bed
                    .precooler_inlet_temperature(1)
                    .get::<degree_celsius>(),
            );
            c0ts.push(
                test_bed
                    .precooler_outlet_temperature(1)
                    .get::<degree_celsius>(),
            );
            pcsts.push(
                test_bed
                    .precooler_supply_temperature(1)
                    .get::<degree_celsius>(),
            );
            escts.push(
                test_bed
                    .engine_starter_container_temperature(1)
                    .get::<degree_celsius>(),
            );

            hpv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .high_pressure_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            prv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .pressure_regulating_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            ipv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .intermediate_pressure_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            esv_open.push(test_bed.query(|aircraft| {
                aircraft.pneumatic.engine_systems[0]
                    .engine_starter_valve
                    .open_amount()
                    .get::<ratio>()
            }));

            abv_open.push(if test_bed.apu_bleed_valve_is_open() {
                1.
            } else {
                0.
            });

            fav_open.push(test_bed.query(|aircraft| {
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
            ts, hps, ips, c2s, c1s, c0s, pcss, escs, hpts, ipts, c2ts, c1ts, c0ts, pcsts, escts,
            hpv_open, prv_open, ipv_open, esv_open, abv_open, fav_open,
        ];
        let mut file = File::create("../a320_pneumatic_simulation_graph_data/generic_data.txt")
            .expect("Could not create file");

        use std::io::Write;

        writeln!(file, "{:?}", data).expect("Could not write file");
    }

    #[test]
    fn hydraulic_reservoir_pressurization_graphs() {
        let alt = Length::new::<foot>(0.);

        let mut test_bed = test_bed_with()
            .in_isa_atmosphere(alt)
            .stop_eng1()
            .stop_eng2()
            .set_bleed_air_running()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto);

        let mut ts = Vec::new();
        let mut green_pressures = Vec::new();
        let mut blue_pressures = Vec::new();
        let mut yellow_pressures = Vec::new();

        for i in 1..1000 {
            ts.push(i as f64 * 16.);

            green_pressures.push(test_bed.green_hydraulic_reservoir_pressure().get::<psi>());
            blue_pressures.push(test_bed.blue_hydraulic_reservoir_pressure().get::<psi>());
            yellow_pressures.push(test_bed.yellow_hydraulic_reservoir_pressure().get::<psi>());

            test_bed.run_with_delta(Duration::from_millis(16));
        }

        assert!(test_bed.green_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
        assert!(test_bed.blue_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));

        // If anyone is wondering, I am using python to plot pressure curves. This will be removed once the model is complete.
        let data = vec![ts, green_pressures, blue_pressures, yellow_pressures];
        let mut file = File::create(
            "../a320_pneumatic_simulation_graph_data/hydraulic_reservoir_pressures_data.txt",
        )
        .expect("Could not create file");

        use std::io::Write;

        writeln!(file, "{:?}", data).expect("Could not write file");
    }

    #[test]
    fn cold_and_dark_full_state() {
        let altitude = Length::new::<foot>(0.);
        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);

        let test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.))
            .set_pack_flow_pb_is_auto(1, false)
            .set_pack_flow_pb_is_auto(2, false)
            .and_stabilize();

        assert!((test_bed.ip_pressure(1) - ambient_pressure).abs() < pressure_tolerance());
        assert!((test_bed.ip_pressure(2) - ambient_pressure).abs() < pressure_tolerance());

        assert!((test_bed.hp_pressure(1) - ambient_pressure).abs() < pressure_tolerance());
        assert!((test_bed.hp_pressure(2) - ambient_pressure).abs() < pressure_tolerance());

        assert!((test_bed.transfer_pressure(1) - ambient_pressure).abs() < pressure_tolerance());
        assert!((test_bed.transfer_pressure(2) - ambient_pressure).abs() < pressure_tolerance());

        assert!(
            (test_bed.precooler_inlet_pressure(1) - ambient_pressure).abs() < pressure_tolerance()
        );
        assert!(
            (test_bed.precooler_inlet_pressure(2) - ambient_pressure).abs() < pressure_tolerance()
        );

        assert!(
            (test_bed.precooler_outlet_pressure(1) - ambient_pressure).abs() < pressure_tolerance()
        );
        assert!(
            (test_bed.precooler_outlet_pressure(2) - ambient_pressure).abs() < pressure_tolerance()
        );

        assert!(!test_bed.hp_valve_is_open(1));
        assert!(!test_bed.hp_valve_is_open(2));

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.pr_valve_is_open(2));

        assert!(!test_bed.cross_bleed_valve_is_open())
    }

    #[test]
    fn single_engine_idle_full_state() {
        let altitude = Length::new::<foot>(0.);
        let test_bed = test_bed_with()
            .idle_eng1()
            .stop_eng2()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.))
            .and_stabilize();

        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);

        assert!(test_bed.ip_pressure(1) - ambient_pressure > pressure_tolerance());
        assert!((test_bed.ip_pressure(2) - ambient_pressure).abs() < pressure_tolerance());

        assert!(test_bed.hp_pressure(1) - ambient_pressure > pressure_tolerance());
        assert!((test_bed.hp_pressure(2) - ambient_pressure).abs() < pressure_tolerance());

        assert!(test_bed.transfer_pressure(1) - ambient_pressure > pressure_tolerance());
        assert!((test_bed.transfer_pressure(2) - ambient_pressure).abs() < pressure_tolerance());

        assert!((test_bed.precooler_inlet_pressure(1) - ambient_pressure) > pressure_tolerance());
        assert!(!test_bed.precooler_inlet_pressure(2).is_nan());

        assert!((test_bed.precooler_outlet_pressure(1) - ambient_pressure) > pressure_tolerance());
        assert!(!test_bed.precooler_outlet_pressure(2).is_nan());

        assert!(test_bed.hp_valve_is_open(1));
        assert!(!test_bed.hp_valve_is_open(2));

        assert!(!test_bed.es_valve_is_open(1));
        assert!(!test_bed.es_valve_is_open(2));

        assert!(!test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn two_engine_idle_full_state() {
        let altitude = Length::new::<foot>(0.);
        let test_bed = test_bed_with()
            .idle_eng1()
            .idle_eng2()
            .in_isa_atmosphere(altitude)
            .mach_number(MachNumber(0.))
            .and_stabilize();

        let ambient_pressure = InternationalStandardAtmosphere::pressure_at_altitude(altitude);

        assert!(test_bed.ip_pressure(1) - ambient_pressure > pressure_tolerance());
        assert!(test_bed.ip_pressure(2) - ambient_pressure > pressure_tolerance());

        assert!(test_bed.hp_pressure(1) - ambient_pressure > pressure_tolerance());
        assert!(test_bed.hp_pressure(2) - ambient_pressure > pressure_tolerance());

        assert!(test_bed.transfer_pressure(1) - ambient_pressure > pressure_tolerance());
        assert!(test_bed.transfer_pressure(2) - ambient_pressure > pressure_tolerance());

        assert!((test_bed.precooler_inlet_pressure(1) - ambient_pressure) > pressure_tolerance());
        assert!((test_bed.precooler_inlet_pressure(2) - ambient_pressure) > pressure_tolerance());

        assert!((test_bed.precooler_outlet_pressure(1) - ambient_pressure) > pressure_tolerance());
        assert!((test_bed.precooler_outlet_pressure(2) - ambient_pressure) > pressure_tolerance());

        assert!(test_bed.hp_valve_is_open(1));
        assert!(test_bed.hp_valve_is_open(2));

        assert!(!test_bed.es_valve_is_open(1));
        assert!(!test_bed.es_valve_is_open(2));

        assert!(!test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn starter_valve_opens_on_engine_start() {
        let mut test_bed = test_bed_with().stop_eng1().stop_eng2().and_run();

        assert!(!test_bed.es_valve_is_open(1));
        assert!(!test_bed.es_valve_is_open(2));

        test_bed = test_bed.start_eng1().start_eng2().and_run();

        assert!(test_bed.es_valve_is_open(1));
        assert!(test_bed.es_valve_is_open(2));
    }

    #[test]
    fn cross_bleed_valve_opens_when_apu_bleed_valve_opens() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .and_run();

        assert!(!test_bed.cross_bleed_valve_is_open());

        test_bed = test_bed
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .and_run();

        assert!(test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn cross_bleed_valve_closes_when_apu_bleed_valve_closes() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .and_run();

        assert!(test_bed.cross_bleed_valve_is_open());

        test_bed = test_bed
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_closed())
            .and_run();

        assert!(!test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn cross_bleed_valve_manual_overrides_everything() {
        let mut test_bed = test_bed_with()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .and_run();

        assert!(!test_bed.cross_bleed_valve_is_open());

        test_bed = test_bed
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_closed())
            .and_run();

        assert!(test_bed.cross_bleed_valve_is_open());
    }

    #[test]
    fn simvars_initialized_properly() {
        let test_bed = test_bed()
            .in_isa_atmosphere(Length::new::<foot>(0.))
            .and_run();

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_IP_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_IP_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_HP_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_HP_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_TRANSFER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_TRANSFER_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PRECOOLER_INLET_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PRECOOLER_INLET_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PRECOOLER_OUTLET_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PRECOOLER_OUTLET_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_STARTER_CONTAINER_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_STARTER_CONTAINER_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_IP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_IP_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_HP_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_HP_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_TRANSFER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_TRANSFER_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PRECOOLER_INLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PRECOOLER_INLET_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PRECOOLER_OUTLET_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PRECOOLER_OUTLET_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_STARTER_CONTAINER_TEMPERATURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_STARTER_CONTAINER_TEMPERATURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_IP_PRESSURE"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_IP_PRESSURE"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_IP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_IP_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_HP_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_HP_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_PR_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_PR_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_ENG_1_STARTER_VALVE_OPEN"));
        assert!(test_bed.contains_variable_with_name("PNEU_ENG_2_STARTER_VALVE_OPEN"));

        assert!(test_bed.contains_variable_with_name("PNEU_PACK_1_FLOW_VALVE_FLOW_RATE"));
        assert!(test_bed.contains_variable_with_name("PNEU_PACK_2_FLOW_VALVE_FLOW_RATE"));

        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_1_BLEED_PB_HAS_FAULT"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_2_BLEED_PB_HAS_FAULT"));

        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO"));
        assert!(test_bed.contains_variable_with_name("OVHD_PNEU_ENG_2_BLEED_PB_IS_AUTO"));

        assert!(test_bed.contains_variable_with_name("PNEU_XBLEED_VALVE_OPEN"));
    }

    #[test]
    fn prv_closes_with_ovhd_engine_bleed_off() {
        let mut test_bed = test_bed().idle_eng1().idle_eng2().and_run();

        // We have to run two update ticks for the pressure to propagate through the system.
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.pr_valve_is_open(1));
        assert!(test_bed.pr_valve_is_open(2));

        test_bed = test_bed.set_engine_bleed_push_button_off(1).and_run();

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(test_bed.pr_valve_is_open(2));

        test_bed = test_bed.set_engine_bleed_push_button_off(2).and_run();

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.pr_valve_is_open(2));
    }

    #[test]
    fn prv_closes_with_ovhd_engine_fire_pushbutton_released() {
        let mut test_bed = test_bed().idle_eng1().idle_eng2().and_run();

        // TODO: I shouldn't have to run this twice, but it just takes two updates for the pressure to propagate through the system.
        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.pr_valve_is_open(1));
        assert!(test_bed.pr_valve_is_open(2));

        test_bed = test_bed.release_fire_pushbutton(1).and_run();

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(test_bed.pr_valve_is_open(2));

        test_bed = test_bed.release_fire_pushbutton(2).and_run();

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.pr_valve_is_open(2));
    }

    #[test]
    fn prv_1_closes_with_apu_bleed_on() {
        let mut test_bed = test_bed_with().idle_eng1().idle_eng2().and_run();

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.pr_valve_is_open(1));

        test_bed = test_bed
            .set_apu_bleed_air_pb(true)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .and_run();

        assert!(!test_bed.pr_valve_is_open(1));
    }

    #[test]
    fn prv_2_closes_with_apu_bleed_on_and_cross_bleed_open() {
        let mut test_bed = test_bed_with().idle_eng1().idle_eng2().and_run();

        test_bed.run_with_delta(Duration::from_secs(5));

        assert!(test_bed.pr_valve_is_open(2));

        test_bed = test_bed
            .set_apu_bleed_air_pb(true)
            .set_apu_bleed_valve_signal(ApuBleedAirValveSignal::new_open())
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .and_run();

        assert!(!test_bed.pr_valve_is_open(2));
    }

    #[test]
    fn fadec_represents_engine_state() {
        let mut test_bed = test_bed_with()
            .set_engine_state(1, EngineState::Off)
            .set_engine_state(2, EngineState::Off);

        assert_eq!(test_bed.engine_state(1), EngineState::Off);
        assert_eq!(test_bed.engine_state(2), EngineState::Off);

        test_bed = test_bed
            .set_engine_state(1, EngineState::Starting)
            .and_run();

        assert_eq!(test_bed.engine_state(1), EngineState::Starting);
        assert_eq!(test_bed.engine_state(2), EngineState::Off);

        test_bed = test_bed
            .set_engine_state(2, EngineState::Starting)
            .and_run();

        assert_eq!(test_bed.engine_state(1), EngineState::Starting);
        assert_eq!(test_bed.engine_state(2), EngineState::Starting);

        test_bed = test_bed.set_engine_state(1, EngineState::On).and_run();

        assert_eq!(test_bed.engine_state(1), EngineState::On);
        assert_eq!(test_bed.engine_state(2), EngineState::Starting);

        test_bed = test_bed.set_engine_state(2, EngineState::On).and_run();

        assert_eq!(test_bed.engine_state(1), EngineState::On);
        assert_eq!(test_bed.engine_state(2), EngineState::On);

        test_bed = test_bed
            .set_engine_state(1, EngineState::Shutting)
            .and_run();

        assert_eq!(test_bed.engine_state(1), EngineState::Shutting);
        assert_eq!(test_bed.engine_state(2), EngineState::On);

        test_bed = test_bed
            .set_engine_state(2, EngineState::Shutting)
            .and_run();

        assert_eq!(test_bed.engine_state(1), EngineState::Shutting);
        assert_eq!(test_bed.engine_state(2), EngineState::Shutting);
    }

    #[test]
    fn apu_bleed_provides_at_least_35_psi_with_open_cross_bleed_valve() {
        let test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_bleed_air_running()
            .and_stabilize();

        assert!(test_bed.cross_bleed_valve_is_open());

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.pr_valve_is_open(2));

        assert!(test_bed.precooler_outlet_pressure(1) > Pressure::new::<psi>(35.));
        assert!(test_bed.precooler_outlet_pressure(2) > Pressure::new::<psi>(35.));
    }

    #[test]
    fn hydraulic_reservoirs_get_pressurized() {
        let test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .set_bleed_air_running()
            .and_stabilize();

        assert!(test_bed.green_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
        assert!(test_bed.blue_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() > Pressure::new::<psi>(35.));
    }

    #[test]
    fn apu_bleed_provides_at_least_35_psi_to_left_system_with_closed_cross_bleed_valve() {
        let test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
            .set_bleed_air_running()
            // .both_packs_auto()
            .and_stabilize();

        assert!(!test_bed.pr_valve_is_open(1));
        assert!(!test_bed.cross_bleed_valve_is_open());

        assert!(test_bed.precooler_outlet_pressure(1) > Pressure::new::<psi>(35.));
        assert!(!test_bed.precooler_outlet_pressure(2).is_nan());
    }

    #[test]
    fn pack_flow_valve_closes_with_pack_pb_off() {
        let mut test_bed = test_bed_with()
            .set_pack_flow_pb_is_auto(1, true)
            .set_pack_flow_pb_is_auto(2, false)
            .and_run();

        assert!(test_bed.pack_flow_valve_is_open(1));
        assert!(!test_bed.pack_flow_valve_is_open(2));

        test_bed = test_bed.set_pack_flow_pb_is_auto(1, false).and_run();

        assert!(!test_bed.pack_flow_valve_is_open(1));
        assert!(!test_bed.pack_flow_valve_is_open(2));
    }

    #[test]
    fn bleed_monitoring_computers_powered_by_correct_buses() {
        let mut test_bed = test_bed()
            .set_dc_ess_shed_bus_power(false)
            .set_dc_2_bus_power(false)
            .and_run();

        test_bed.run();

        assert!(!test_bed.bmc_is_powered(1));
        assert!(!test_bed.bmc_is_powered(2));

        test_bed = test_bed.set_dc_ess_shed_bus_power(true).and_run();

        assert!(test_bed.bmc_is_powered(1));
        assert!(!test_bed.bmc_is_powered(2));

        test_bed = test_bed.set_dc_2_bus_power(true).and_run();

        assert!(test_bed.bmc_is_powered(1));
        assert!(test_bed.bmc_is_powered(2));
    }

    #[test]
    fn bleed_monitoring_computers_initialize_in_correct_configuration() {
        let test_bed = test_bed()
            .set_dc_2_bus_power(true)
            .set_dc_ess_shed_bus_power(true)
            .and_run();

        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(1, 1),
            BleedMonitoringComputerChannelOperationMode::Master
        );
        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(2, 2),
            BleedMonitoringComputerChannelOperationMode::Master
        );

        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(1, 2),
            BleedMonitoringComputerChannelOperationMode::Slave
        );
        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(2, 1),
            BleedMonitoringComputerChannelOperationMode::Slave
        );
    }

    #[test]
    fn bleed_monitoring_computer_one_takes_over_for_dc_2_failure() {
        let test_bed = test_bed()
            .set_dc_2_bus_power(false)
            .set_dc_ess_shed_bus_power(true)
            .and_run();

        assert!(test_bed.bmc_is_powered(1));
        assert!(!test_bed.bmc_is_powered(2));

        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(1, 1),
            BleedMonitoringComputerChannelOperationMode::Master
        );
        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(1, 2),
            BleedMonitoringComputerChannelOperationMode::Master
        );

        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(2, 1),
            BleedMonitoringComputerChannelOperationMode::Slave
        );
        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(2, 2),
            BleedMonitoringComputerChannelOperationMode::Slave
        );
    }

    #[test]
    fn bleed_monitoring_computer_two_takes_over_for_dc_ess_shed_failure() {
        let test_bed = test_bed()
            .set_dc_2_bus_power(true)
            .set_dc_ess_shed_bus_power(false)
            .and_run();

        assert!(!test_bed.bmc_is_powered(1));
        assert!(test_bed.bmc_is_powered(2));

        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(2, 1),
            BleedMonitoringComputerChannelOperationMode::Master
        );
        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(2, 2),
            BleedMonitoringComputerChannelOperationMode::Master
        );

        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(1, 1),
            BleedMonitoringComputerChannelOperationMode::Slave
        );
        assert_eq!(
            test_bed.bmc_operation_mode_for_engine(1, 2),
            BleedMonitoringComputerChannelOperationMode::Slave
        );
    }

    #[test]
    fn valves_powered_by_correct_busses() {
        let mut test_bed = test_bed()
            .set_dc_ess_shed_bus_power(true)
            .set_dc_2_bus_power(true)
            .and_run();

        assert!(test_bed.hp_valve_is_powered(1));
        assert!(test_bed.hp_valve_is_powered(2));

        assert!(test_bed.pr_valve_is_powered(1));
        assert!(test_bed.pr_valve_is_powered(2));

        test_bed = test_bed.set_dc_ess_shed_bus_power(false).and_run();

        assert!(!test_bed.hp_valve_is_powered(1));
        assert!(test_bed.hp_valve_is_powered(2));

        assert!(!test_bed.pr_valve_is_powered(1));
        assert!(test_bed.pr_valve_is_powered(2));

        test_bed = test_bed.set_dc_2_bus_power(false).and_run();

        assert!(!test_bed.hp_valve_is_powered(1));
        assert!(!test_bed.hp_valve_is_powered(2));

        assert!(!test_bed.pr_valve_is_powered(1));
        assert!(!test_bed.pr_valve_is_powered(2));
    }

    #[test]
    fn fault_light_if_bleed_valve_open_with_apu_bleed() {
        let mut test_bed = test_bed_with()
            .idle_eng1()
            .set_dc_ess_shed_bus_power(false)
            .set_bleed_air_running()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .and_run();

        assert!(!test_bed.pr_valve_is_powered(1));
        assert!(!test_bed.engine_bleed_push_button_has_fault(1));

        test_bed.run_with_delta(Duration::from_secs(8));

        assert!(test_bed.pr_valve_is_open(1));
        assert!(test_bed.engine_bleed_push_button_has_fault(1));
    }

    #[test]
    fn fadec_detects_single_vs_dual_bleed_config() {
        let mut test_bed = test_bed_with().stop_eng1().stop_eng2().and_run();

        assert!(!test_bed.fadec_single_vs_dual_bleed_config());

        test_bed = test_bed.idle_eng1().stop_eng2().and_run();
        assert!(test_bed.fadec_single_vs_dual_bleed_config());

        test_bed = test_bed.stop_eng1().idle_eng2().and_run();
        assert!(test_bed.fadec_single_vs_dual_bleed_config());

        test_bed = test_bed.idle_eng1().idle_eng2().and_run();
        assert!(!test_bed.fadec_single_vs_dual_bleed_config());
    }

    #[test]
    fn hydraulic_reservoirs_maintain_pressure_after_bleed_pressure_loss() {
        let mut test_bed = test_bed_with()
            .toga_eng1()
            .toga_eng2()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Shut)
            .mach_number(MachNumber(0.))
            .both_packs_auto()
            .and_stabilize();

        let pressure_before_green = test_bed.green_hydraulic_reservoir_pressure();
        let pressure_before_blue = test_bed.blue_hydraulic_reservoir_pressure();
        let pressure_before_yellow = test_bed.yellow_hydraulic_reservoir_pressure();

        test_bed = test_bed.idle_eng1().and_stabilize();

        assert!(test_bed.green_hydraulic_reservoir_pressure() >= pressure_before_green);
        assert!(test_bed.blue_hydraulic_reservoir_pressure() >= pressure_before_blue);
        assert!(test_bed.yellow_hydraulic_reservoir_pressure() >= pressure_before_yellow);
    }

    #[test]
    fn cross_bleed_valve_is_powered_by_two_electrical_busses() {
        let mut test_bed = test_bed_with()
            .stop_eng1()
            .stop_eng2()
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Auto)
            .mach_number(MachNumber(0.))
            .both_packs_auto()
            .set_dc_2_bus_power(true)
            .set_dc_ess_shed_bus_power(true)
            .and_run();

        assert!(test_bed.cross_bleed_valve_is_powered_for_automatic_control());
        assert!(test_bed.cross_bleed_valve_is_powered_for_manual_control());
        assert!(!test_bed.cross_bleed_valve_is_open());

        test_bed = test_bed.set_dc_2_bus_power(false).and_run();
        assert!(!test_bed.cross_bleed_valve_is_powered_for_automatic_control());

        test_bed = test_bed
            .set_dc_2_bus_power(true)
            .set_dc_ess_shed_bus_power(false)
            .and_run();
        assert!(test_bed.cross_bleed_valve_is_powered_for_automatic_control());
        assert!(!test_bed.cross_bleed_valve_is_powered_for_manual_control());
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

        assert!(test_bed.cross_bleed_valve_is_powered_for_automatic_control());
        assert!(!test_bed.cross_bleed_valve_is_powered_for_manual_control());
        assert!(!test_bed.cross_bleed_valve_is_open());

        test_bed = test_bed
            .cross_bleed_valve_selector_knob(CrossBleedValveSelectorMode::Open)
            .and_run();

        assert!(!test_bed.cross_bleed_valve_is_open());
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
}
