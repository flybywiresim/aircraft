use systems::{
    accept_iterable,
    air_conditioning::{
        acs_controller::{Pack, PackFlowController},
        cabin_air::CabinAirSimulation,
        cabin_pressure_controller::CabinPressureController,
        pressure_valve::{PressureValve, PressureValveSignal},
        AirConditioningSystem, DuctTemperature, OutletAir, PackFlowControllers,
        PressurizationConstants, ZoneType,
    },
    overhead::{AutoManFaultPushButton, NormalOnPushButton, SpringLoadedSwitch, ValueKnob},
    pneumatic::PneumaticContainer,
    shared::{
        random_number, update_iterator::MaxStepLoop, CabinAltitude, CabinSimulation,
        ControllerSignal, ElectricalBusType, EngineBleedPushbutton, EngineCorrectedN1,
        EngineFirePushButtons, EngineStartState, GroundSpeed, LgciuWeightOnWheels,
        PackFlowValveState, PneumaticBleed, PressurizationOverheadShared,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use std::time::Duration;
use uom::si::{f64::*, pressure::hectopascal, ratio::percent, velocity::knot};

pub(super) struct A320AirConditioning {
    a320_cabin: A320Cabin,
    a320_air_conditioning_system: AirConditioningSystem<3, 2>,
    a320_pressurization_system: A320PressurizationSystem,

    pressurization_updater: MaxStepLoop,
}

impl A320AirConditioning {
    const PRESSURIZATION_SIM_MAX_TIME_STEP: Duration = Duration::from_millis(50);

    pub fn new(context: &mut InitContext) -> Self {
        let cabin_zones: [ZoneType; 3] =
            [ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)];

        Self {
            a320_cabin: A320Cabin::new(context),
            a320_air_conditioning_system: AirConditioningSystem::new(
                context,
                cabin_zones,
                vec![
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::AlternatingCurrent(1),
                ],
                vec![
                    ElectricalBusType::DirectCurrent(2),
                    ElectricalBusType::AlternatingCurrent(2),
                ],
                ElectricalBusType::AlternatingCurrent(1),
            ),
            a320_pressurization_system: A320PressurizationSystem::new(context),

            pressurization_updater: MaxStepLoop::new(Self::PRESSURIZATION_SIM_MAX_TIME_STEP),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl GroundSpeed,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton,
        pressurization_overhead: &A320PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.pressurization_updater.update(context);

        self.a320_air_conditioning_system.update(
            context,
            adirs,
            &self.a320_cabin,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pneumatic_overhead,
            &self.a320_pressurization_system,
            pressurization_overhead,
            lgciu,
        );

        for cur_time_step in self.pressurization_updater {
            self.a320_cabin.update(
                &context.with_delta(cur_time_step),
                &self.a320_air_conditioning_system,
                lgciu,
                &self.a320_pressurization_system,
            );

            self.a320_pressurization_system.update(
                &context.with_delta(cur_time_step),
                pressurization_overhead,
                engines,
                lgciu,
                &self.a320_cabin,
            );
        }
    }

    pub fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        self.a320_air_conditioning_system
            .mix_packs_air_update(pack_container);
    }
}

impl PackFlowControllers<3> for A320AirConditioning {
    fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<3> {
        self.a320_air_conditioning_system
            .pack_flow_controller(pack_id)
    }
}

impl SimulationElement for A320AirConditioning {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.a320_cabin.accept(visitor);
        self.a320_air_conditioning_system.accept(visitor);
        self.a320_pressurization_system.accept(visitor);

        visitor.visit(self);
    }
}

struct A320Cabin {
    passenger_rows_id: [Option<Vec<VariableIdentifier>>; 3],
    fwd_door_id: VariableIdentifier,
    rear_door_id: VariableIdentifier,

    fwd_door_is_open: bool,
    rear_door_is_open: bool,
    number_of_passengers: [u8; 3],
    cabin_air_simulation: CabinAirSimulation<A320PressurizationConstants, 3>,
}

impl A320Cabin {
    const FWD_DOOR: &'static str = "INTERACTIVE POINT OPEN:0";
    const REAR_DOOR: &'static str = "INTERACTIVE POINT OPEN:3";

    fn new(context: &mut InitContext) -> Self {
        let passenger_rows_id = [
            None,
            Some(vec![
                context.get_identifier(format!("PAX_TOTAL_ROWS_{}_{}", 1, 6)),
                context.get_identifier(format!("PAX_TOTAL_ROWS_{}_{}", 7, 13)),
            ]),
            Some(vec![
                context.get_identifier(format!("PAX_TOTAL_ROWS_{}_{}", 14, 21)),
                context.get_identifier(format!("PAX_TOTAL_ROWS_{}_{}", 22, 29)),
            ]),
        ];

        Self {
            passenger_rows_id,
            fwd_door_id: context.get_identifier(Self::FWD_DOOR.to_owned()),
            rear_door_id: context.get_identifier(Self::REAR_DOOR.to_owned()),

            fwd_door_is_open: false,
            rear_door_is_open: false,
            number_of_passengers: [2, 0, 0],
            cabin_air_simulation: CabinAirSimulation::new(
                context,
                A320PressurizationConstants,
                &[ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)],
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        air_conditioning_system: &(impl OutletAir + DuctTemperature),
        lgciu: [&impl LgciuWeightOnWheels; 2],
        pressurization: &A320PressurizationSystem,
    ) {
        let lgciu_gears_compressed = lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true));
        let number_of_open_doors: u8 = self.fwd_door_is_open as u8 + self.rear_door_is_open as u8;

        self.cabin_air_simulation.update(
            context,
            air_conditioning_system,
            pressurization.outflow_valve_open_amount(0),
            pressurization.safety_valve_open_amount(),
            lgciu_gears_compressed,
            self.number_of_passengers,
            number_of_open_doors,
        );
    }
}

impl CabinSimulation for A320Cabin {
    fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.cabin_air_simulation.cabin_temperature()
    }

    fn exterior_pressure(&self) -> Pressure {
        self.cabin_air_simulation.exterior_pressure()
    }

    fn cabin_pressure(&self) -> Pressure {
        self.cabin_air_simulation.cabin_pressure()
    }
}

impl SimulationElement for A320Cabin {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let rear_door_read: Ratio = reader.read(&self.rear_door_id);
        self.rear_door_is_open = rear_door_read > Ratio::new::<percent>(0.);
        let fwd_door_read: Ratio = reader.read(&self.fwd_door_id);
        self.fwd_door_is_open = fwd_door_read > Ratio::new::<percent>(0.);

        for (id, variable) in self.passenger_rows_id.iter().enumerate() {
            if let Some(var) = variable {
                let mut zone_sum_passengers: u8 = 0;
                for v in var.iter() {
                    let passengers: u8 = reader.read(v);
                    zone_sum_passengers += passengers;
                }
                self.number_of_passengers[id] = zone_sum_passengers;
            }
        }
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.cabin_air_simulation.accept(visitor);

        visitor.visit(self);
    }
}

struct A320PressurizationSystem {
    active_cpc_sys_id: VariableIdentifier,

    cpc: [CabinPressureController<A320PressurizationConstants>; 2],
    outflow_valve: [PressureValve; 1], // Array to prepare for more than 1 outflow valve in A380
    safety_valve: PressureValve,
    residual_pressure_controller: ResidualPressureController,
    active_system: usize,
}

impl A320PressurizationSystem {
    pub fn new(context: &mut InitContext) -> Self {
        let random = random_number();
        let mut active: usize = 1;
        if random % 2 == 0 {
            active = 2
        }

        Self {
            active_cpc_sys_id: context.get_identifier("PRESS_ACTIVE_CPC_SYS".to_owned()),

            cpc: [
                CabinPressureController::new(context, A320PressurizationConstants),
                CabinPressureController::new(context, A320PressurizationConstants),
            ],
            outflow_valve: [PressureValve::new_outflow_valve(); 1],
            safety_valve: PressureValve::new_safety_valve(),
            residual_pressure_controller: ResidualPressureController::new(),
            active_system: active,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        press_overhead: &A320PressurizationOverheadPanel,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        cabin_simulation: &impl CabinSimulation,
    ) {
        let lgciu_gears_compressed = lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true));

        for controller in self.cpc.iter_mut() {
            controller.update(
                context,
                engines,
                lgciu_gears_compressed,
                press_overhead,
                cabin_simulation,
                &self.outflow_valve[0],
                &self.safety_valve,
            );
        }

        self.residual_pressure_controller.update(
            context,
            engines,
            self.outflow_valve[0].open_amount(),
            press_overhead.is_in_man_mode(),
            lgciu_gears_compressed,
            self.cpc[self.active_system - 1].cabin_delta_p(),
        );

        for ofv_valve in self.outflow_valve.iter_mut() {
            ofv_valve.calculate_outflow_valve_position(&self.cpc[self.active_system - 1])
        }

        if self.residual_pressure_controller.signal().is_some() {
            self.outflow_valve[0].update(context, &self.residual_pressure_controller);
        } else {
            self.outflow_valve[0].update(context, press_overhead);
        }

        self.safety_valve
            .update(context, &self.cpc[self.active_system - 1]);

        self.switch_active_system();
    }

    fn switch_active_system(&mut self) {
        if self
            .cpc
            .iter_mut()
            .any(|controller| controller.should_switch_cpc())
        {
            self.active_system = if self.active_system == 1 { 2 } else { 1 };
        }
        for controller in &mut self.cpc {
            if controller.should_switch_cpc() {
                controller.reset_cpc_switch()
            }
        }
    }

    fn outflow_valve_open_amount(&self, ofv_id: usize) -> Ratio {
        self.outflow_valve[ofv_id].open_amount()
    }

    fn safety_valve_open_amount(&self) -> Ratio {
        self.safety_valve.open_amount()
    }
}

impl CabinAltitude for A320PressurizationSystem {
    fn altitude(&self) -> Length {
        self.cpc[self.active_system - 1].cabin_altitude()
    }
}

impl SimulationElement for A320PressurizationSystem {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.active_cpc_sys_id, self.active_system);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cpc, visitor);

        visitor.visit(self);
    }
}

#[derive(Clone, Copy)]
struct A320PressurizationConstants;

impl PressurizationConstants for A320PressurizationConstants {
    // Volume data from A320 AIRCRAFT CHARACTERISTICS - AIRPORT AND MAINTENANCE PLANNING
    const CABIN_VOLUME_CUBIC_METER: f64 = 139.; // m3
    const COCKPIT_VOLUME_CUBIC_METER: f64 = 9.; // m3
    const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64 = 330.; // m3
    const CABIN_LEAKAGE_AREA: f64 = 0.0003; // m2
    const OUTFLOW_VALVE_SIZE: f64 = 0.05; // m2
    const SAFETY_VALVE_SIZE: f64 = 0.02; //m2

    const MAX_CLIMB_RATE: f64 = 750.; // fpm
    const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.; // fpm
    const MAX_DESCENT_RATE: f64 = -750.; // fpm
    const MAX_ABORT_DESCENT_RATE: f64 = -500.; //fpm
    const MAX_TAKEOFF_DELTA_P: f64 = 0.1; // PSI
    const MAX_CLIMB_DELTA_P: f64 = 8.06; // PSI
    const MAX_CLIMB_CABIN_ALTITUDE: f64 = 8050.; // feet
    const MAX_SAFETY_DELTA_P: f64 = 8.1; // PSI
    const MIN_SAFETY_DELTA_P: f64 = -0.5; // PSI
    const TAKEOFF_RATE: f64 = -400.;
    const DEPRESS_RATE: f64 = 500.;
    const EXCESSIVE_ALT_WARNING: f64 = 9550.; // feet
    const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64 = 0.03; // PSI
    const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64 = 1.45; // PSI
}

pub struct A320PressurizationOverheadPanel {
    mode_sel: AutoManFaultPushButton,
    man_vs_ctl_switch: SpringLoadedSwitch,
    ldg_elev_knob: ValueKnob,
    ditching: NormalOnPushButton,
}

impl A320PressurizationOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            mode_sel: AutoManFaultPushButton::new_auto(context, "PRESS_MODE_SEL"),
            man_vs_ctl_switch: SpringLoadedSwitch::new(context, "PRESS_MAN_VS_CTL"),
            ldg_elev_knob: ValueKnob::new_with_value(context, "PRESS_LDG_ELEV", -2000.),
            ditching: NormalOnPushButton::new_normal(context, "PRESS_DITCHING"),
        }
    }

    fn man_vs_switch_position(&self) -> usize {
        self.man_vs_ctl_switch.position()
    }
}

impl SimulationElement for A320PressurizationOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mode_sel.accept(visitor);
        self.man_vs_ctl_switch.accept(visitor);
        self.ldg_elev_knob.accept(visitor);
        self.ditching.accept(visitor);

        visitor.visit(self);
    }
}

impl ControllerSignal<PressureValveSignal> for A320PressurizationOverheadPanel {
    fn signal(&self) -> Option<PressureValveSignal> {
        if !self.is_in_man_mode() {
            None
        } else {
            match self.man_vs_switch_position() {
                0 => Some(PressureValveSignal::Open),
                1 => Some(PressureValveSignal::Neutral),
                2 => Some(PressureValveSignal::Close),
                _ => panic!("Could not convert manual vertical speed switch position '{}' to pressure valve signal.", self.man_vs_switch_position()),
            }
        }
    }
}

impl PressurizationOverheadShared for A320PressurizationOverheadPanel {
    fn is_in_man_mode(&self) -> bool {
        !self.mode_sel.is_auto()
    }

    fn ditching_is_on(&self) -> bool {
        self.ditching.is_on()
    }

    fn ldg_elev_is_auto(&self) -> bool {
        let margin = 100.;
        (self.ldg_elev_knob.value() + 2000.).abs() < margin
    }

    fn ldg_elev_knob_value(&self) -> f64 {
        self.ldg_elev_knob.value()
    }
}

struct ResidualPressureController {
    timer: Duration,
}

impl ResidualPressureController {
    fn new() -> Self {
        Self {
            timer: Duration::from_secs(0),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        outflow_valve_open_amount: Ratio,
        is_in_man_mode: bool,
        lgciu_gears_compressed: bool,
        cabin_delta_p: Pressure,
    ) {
        if outflow_valve_open_amount < Ratio::new::<percent>(100.)
            && is_in_man_mode
            && lgciu_gears_compressed
            && (!(engines
                .iter()
                .any(|&x| x.corrected_n1() > Ratio::new::<percent>(15.)))
                || context.indicated_airspeed() < Velocity::new::<knot>(70.))
            && (cabin_delta_p > Pressure::new::<hectopascal>(2.5)
                || self.timer != Duration::from_secs(0))
        {
            self.timer += context.delta();
        } else {
            self.timer = Duration::from_secs(0);
        }
    }
}

impl ControllerSignal<PressureValveSignal> for ResidualPressureController {
    fn signal(&self) -> Option<PressureValveSignal> {
        if self.timer > Duration::from_secs(55) {
            Some(PressureValveSignal::Open)
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use systems::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        overhead::AutoOffFaultPushButton,
        pneumatic::{
            valve::{DefaultValve, PneumaticExhaust},
            ControllablePneumaticValve, EngineModeSelector, EngineState, PneumaticPipe, Precooler,
        },
        shared::{PneumaticValve, PotentialOrigin},
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
            UpdateContext,
        },
    };
    use uom::si::{
        length::foot,
        mass_rate::kilogram_per_second,
        pressure::{hectopascal, psi},
        thermodynamic_temperature::degree_celsius,
        velocity::foot_per_minute,
        volume::cubic_meter,
    };

    struct TestAdirs {
        ground_speed: Velocity,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                ground_speed: Velocity::new::<knot>(0.),
            }
        }
    }
    impl GroundSpeed for TestAdirs {
        fn ground_speed(&self) -> Velocity {
            self.ground_speed
        }
    }

    struct TestEngine {
        corrected_n1: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n1: Ratio) -> Self {
            Self {
                corrected_n1: engine_corrected_n1,
            }
        }
        fn set_engine_n1(&mut self, n: Ratio) {
            self.corrected_n1 = n;
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
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
    }
    impl EngineFirePushButtons for TestEngineFirePushButtons {
        fn is_released(&self, engine_number: usize) -> bool {
            self.is_released[engine_number - 1]
        }
    }

    struct TestFadec {
        engine_1_state_id: VariableIdentifier,
        engine_2_state_id: VariableIdentifier,

        engine_1_state: EngineState,
        engine_2_state: EngineState,

        engine_mode_selector_id: VariableIdentifier,
        engine_mode_selector_position: EngineModeSelector,
    }
    impl TestFadec {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engine_1_state_id: context.get_identifier("ENGINE_STATE:1".to_owned()),
                engine_2_state_id: context.get_identifier("ENGINE_STATE:2".to_owned()),
                engine_1_state: EngineState::Off,
                engine_2_state: EngineState::Off,
                engine_mode_selector_id: context
                    .get_identifier("TURB ENG IGNITION SWITCH EX1:1".to_owned()),
                engine_mode_selector_position: EngineModeSelector::Norm,
            }
        }

        fn engine_state(&self, number: usize) -> EngineState {
            match number {
                1 => self.engine_1_state,
                2 => self.engine_2_state,
                _ => panic!("Invalid engine number"),
            }
        }

        fn engine_mode_selector(&self) -> EngineModeSelector {
            self.engine_mode_selector_position
        }
    }
    impl SimulationElement for TestFadec {
        fn read(&mut self, reader: &mut SimulatorReader) {
            self.engine_1_state = reader.read(&self.engine_1_state_id);
            self.engine_2_state = reader.read(&self.engine_2_state_id);
            self.engine_mode_selector_position = reader.read(&self.engine_mode_selector_id);
        }
    }

    struct TestPneumatic {
        apu_bleed_air_valve: DefaultValve,
        engine_bleed: [TestEngineBleed; 2],
        cross_bleed_valve: DefaultValve,
        fadec: TestFadec,
        pub packs: [TestPneumaticPackComplex; 2],
    }

    impl TestPneumatic {
        fn new(context: &mut InitContext) -> Self {
            Self {
                apu_bleed_air_valve: DefaultValve::new_closed(),
                engine_bleed: [TestEngineBleed::new(), TestEngineBleed::new()],
                cross_bleed_valve: DefaultValve::new_closed(),
                fadec: TestFadec::new(context),
                packs: [
                    TestPneumaticPackComplex::new(1),
                    TestPneumaticPackComplex::new(2),
                ],
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            pack_flow_valve_signals: &impl PackFlowControllers<3>,
            engine_bleed: [&impl EngineCorrectedN1; 2],
        ) {
            self.engine_bleed
                .iter_mut()
                .for_each(|b| b.update(context, engine_bleed));
            self.packs
                .iter_mut()
                .zip(self.engine_bleed.iter_mut())
                .for_each(|(pack, engine_bleed)| {
                    pack.update(context, engine_bleed, pack_flow_valve_signals)
                });
        }
    }

    impl PneumaticBleed for TestPneumatic {
        fn apu_bleed_is_on(&self) -> bool {
            self.apu_bleed_air_valve.is_open()
        }
        fn engine_crossbleed_is_on(&self) -> bool {
            self.cross_bleed_valve.is_open()
        }
    }
    impl EngineStartState for TestPneumatic {
        fn left_engine_state(&self) -> EngineState {
            self.fadec.engine_state(1)
        }
        fn right_engine_state(&self) -> EngineState {
            self.fadec.engine_state(2)
        }
        fn engine_mode_selector(&self) -> EngineModeSelector {
            self.fadec.engine_mode_selector()
        }
    }
    impl PackFlowValveState for TestPneumatic {
        fn pack_flow_valve_is_open(&self, pack_id: usize) -> bool {
            self.packs[pack_id].pfv_open_amount() > Ratio::new::<percent>(0.)
        }
        fn pack_flow_valve_air_flow(&self, pack_id: usize) -> MassRate {
            self.packs[pack_id].pack_flow_valve_air_flow()
        }
    }
    impl SimulationElement for TestPneumatic {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.fadec.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestEngineBleed {
        precooler: Precooler,
        precooler_outlet_pipe: PneumaticPipe,
    }
    impl TestEngineBleed {
        fn new() -> Self {
            Self {
                precooler: Precooler::new(180. * 2.),
                precooler_outlet_pipe: PneumaticPipe::new(
                    Volume::new::<cubic_meter>(5.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
            }
        }

        fn update(&mut self, context: &UpdateContext, engine_bleed: [&impl EngineCorrectedN1; 2]) {
            let mut precooler_inlet_pipe = if engine_bleed
                .iter()
                .any(|e| e.corrected_n1() > Ratio::new::<percent>(10.))
            {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(8.),
                    Pressure::new::<psi>(44.),
                    ThermodynamicTemperature::new::<degree_celsius>(144.),
                )
            } else {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(8.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                )
            };
            let mut precooler_supply_pipe = if engine_bleed
                .iter()
                .any(|e| e.corrected_n1() > Ratio::new::<percent>(10.))
            {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(16.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(131.),
                )
            } else {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(16.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                )
            };
            self.precooler.update(
                context,
                &mut precooler_inlet_pipe,
                &mut precooler_supply_pipe,
                &mut self.precooler_outlet_pipe,
            );
        }
    }
    impl PneumaticContainer for TestEngineBleed {
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

    struct TestPneumaticPackComplex {
        engine_number: usize,
        pack_container: PneumaticPipe,
        exhaust: PneumaticExhaust,
        pack_flow_valve: DefaultValve,
    }
    impl TestPneumaticPackComplex {
        fn new(engine_number: usize) -> Self {
            Self {
                engine_number,
                pack_container: PneumaticPipe::new(
                    Volume::new::<cubic_meter>(2.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
                exhaust: PneumaticExhaust::new(0.3, 0.3, Pressure::new::<psi>(0.)),
                pack_flow_valve: DefaultValve::new_closed(),
            }
        }
        fn update(
            &mut self,
            context: &UpdateContext,
            from: &mut impl PneumaticContainer,
            pack_flow_valve_signals: &impl PackFlowControllers<3>,
        ) {
            self.pack_flow_valve.update_open_amount(
                &pack_flow_valve_signals.pack_flow_controller(self.engine_number.into()),
            );
            self.pack_flow_valve
                .update_move_fluid(context, from, &mut self.pack_container);
            self.exhaust
                .update_move_fluid(context, &mut self.pack_container);
        }
        fn pfv_open_amount(&self) -> Ratio {
            self.pack_flow_valve.open_amount()
        }
        fn pack_flow_valve_air_flow(&self) -> MassRate {
            self.pack_flow_valve.fluid_flow()
        }
    }
    impl PneumaticContainer for TestPneumaticPackComplex {
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
                .change_fluid_amount(fluid_amount, fluid_temperature, fluid_pressure)
        }

        fn update_temperature(&mut self, temperature: TemperatureInterval) {
            self.pack_container.update_temperature(temperature);
        }
    }

    struct TestPneumaticOverhead {
        engine_1_bleed: AutoOffFaultPushButton,
        engine_2_bleed: AutoOffFaultPushButton,
    }
    impl TestPneumaticOverhead {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engine_1_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_1_BLEED"),
                engine_2_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_2_BLEED"),
            }
        }
    }
    impl EngineBleedPushbutton for TestPneumaticOverhead {
        fn engine_bleed_pushbuttons_are_auto(&self) -> [bool; 2] {
            [self.engine_1_bleed.is_auto(), self.engine_2_bleed.is_auto()]
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.compressed = on_ground;
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

    struct TestAircraft {
        a320_cabin_air: A320AirConditioning,
        adirs: TestAdirs,
        engine_1: TestEngine,
        engine_2: TestEngine,
        engine_fire_push_buttons: TestEngineFirePushButtons,
        pneumatic: TestPneumatic,
        pneumatic_overhead: TestPneumaticOverhead,
        pressurization_overhead: A320PressurizationOverheadPanel,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
        powered_dc_source_1: TestElectricitySource,
        powered_ac_source_1: TestElectricitySource,
        powered_dc_source_2: TestElectricitySource,
        powered_ac_source_2: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        ac_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            let mut test_aircraft = Self {
                a320_cabin_air: A320AirConditioning::new(context),
                adirs: TestAdirs::new(),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_fire_push_buttons: TestEngineFirePushButtons::new(),
                pneumatic: TestPneumatic::new(context),
                pneumatic_overhead: TestPneumaticOverhead::new(context),
                pressurization_overhead: A320PressurizationOverheadPanel::new(context),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                powered_dc_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(1),
                ),
                powered_ac_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                powered_dc_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                powered_ac_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(2),
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
            };
            test_aircraft
                .a320_cabin_air
                .a320_pressurization_system
                .active_system = 1;
            test_aircraft
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_dc_source_1);
            electricity.supplied_by(&self.powered_ac_source_1);
            electricity.supplied_by(&self.powered_dc_source_2);
            electricity.supplied_by(&self.powered_ac_source_2);
            electricity.flow(&self.powered_dc_source_1, &self.dc_1_bus);
            electricity.flow(&self.powered_ac_source_1, &self.ac_1_bus);
            electricity.flow(&self.powered_dc_source_2, &self.dc_2_bus);
            electricity.flow(&self.powered_ac_source_2, &self.ac_2_bus);
        }
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pneumatic.update(
                context,
                &self.a320_cabin_air,
                [&self.engine_1, &self.engine_2],
            );
            self.a320_cabin_air.update(
                context,
                &self.adirs,
                [&self.engine_1, &self.engine_2],
                &self.engine_fire_push_buttons,
                &self.pneumatic,
                &self.pneumatic_overhead,
                &self.pressurization_overhead,
                [&self.lgciu1, &self.lgciu2],
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.a320_cabin_air.accept(visitor);
            self.pneumatic.accept(visitor);
            self.pressurization_overhead.accept(visitor);

            visitor.visit(self);
        }
    }

    struct CabinAirTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
        stored_pressure: Option<Pressure>,
        stored_ofv_open_amount: Option<Ratio>,
        stored_vertical_speed: Option<Velocity>,
    }
    impl CabinAirTestBed {
        fn new() -> Self {
            let mut test_bed = CabinAirTestBed {
                test_bed: SimulationTestBed::new(TestAircraft::new),
                stored_pressure: None,
                stored_ofv_open_amount: None,
                stored_vertical_speed: None,
            };
            test_bed.set_indicated_altitude(Length::new::<foot>(0.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );
            test_bed.command_pack_flow_selector_position(1);
            test_bed.command_engine_n1(Ratio::new::<percent>(30.));

            test_bed
        }

        fn on_ground(mut self) -> Self {
            self.set_ambient_pressure(Pressure::new::<hectopascal>(1013.25));
            self.set_indicated_airspeed(Velocity::new::<knot>(0.));
            self.set_indicated_altitude(Length::new::<foot>(0.));
            self.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
            self.command_on_ground(true);
            self.command_sea_level_pressure(Pressure::new::<hectopascal>(1013.25));
            self.command_destination_qnh(Pressure::new::<hectopascal>(1013.25));
            self.run();
            self
        }

        fn and(self) -> Self {
            self
        }

        fn then(self) -> Self {
            self
        }

        fn run_and(mut self) -> Self {
            self.run();
            self
        }

        fn run_with_delta_of(mut self, delta: Duration) -> Self {
            self.run_with_delta(delta);
            self
        }

        fn and_run(mut self) -> Self {
            self.run();
            self
        }

        fn with(self) -> Self {
            self
        }

        fn iterate(mut self, iterations: usize) -> Self {
            for _ in 0..iterations {
                // println!(
                //     "{}, {}, {}, {}, {}",
                //     self.outflow_valve_open_amount().get::<percent>(),
                //     self.cabin_vs().get::<foot_per_minute>(),
                //     self.safety_valve_open_amount().get::<percent>(),
                //     self.cabin_delta_p().get::<psi>(),
                //     self.cabin_altitude().get::<foot>(),
                // );
                self.run();
            }
            self
        }

        fn iterate_with_delta(mut self, iterations: usize, delta: Duration) -> Self {
            for _ in 0..iterations {
                // println!(
                //     "{}, {}, {}, {}, {}",
                //     self.outflow_valve_open_amount().get::<percent>(),
                //     self.cabin_vs().get::<foot_per_minute>(),
                //     self.safety_valve_open_amount().get::<percent>(),
                //     self.cabin_delta_p().get::<psi>(),
                //     self.cabin_altitude().get::<foot>(),
                // );
                self.run_with_delta(delta);
            }
            self
        }

        fn memorize_cabin_pressure(mut self) -> Self {
            self.stored_pressure = Some(self.cabin_pressure());
            self
        }

        fn memorize_outflow_valve_open_amount(mut self) -> Self {
            self.stored_ofv_open_amount = Some(self.outflow_valve_open_amount());
            self
        }

        fn memorize_vertical_speed(mut self) -> Self {
            self.stored_vertical_speed = Some(self.cabin_vs());
            self
        }

        fn initial_pressure(&self) -> Pressure {
            self.stored_pressure.unwrap()
        }

        fn ambient_pressure_of(mut self, pressure: Pressure) -> Self {
            self.set_ambient_pressure(pressure);
            self
        }

        fn indicated_airspeed_of(mut self, velocity: Velocity) -> Self {
            self.set_indicated_airspeed(velocity);
            self
        }

        fn vertical_speed_of(mut self, velocity: Velocity) -> Self {
            self.set_vertical_speed(velocity);
            self
        }

        fn set_on_ground(mut self) -> Self {
            self.command_on_ground(true);
            self
        }

        fn set_takeoff_power(mut self) -> Self {
            self.command_engine_n1(Ratio::new::<percent>(95.));
            self
        }

        fn cab_fans_pb_on(mut self, value: bool) -> Self {
            self.write_by_name("OVHD_VENT_CAB_FANS_PB_IS_ON", value);
            self
        }

        fn command_measured_temperature(&mut self, temp_array: [ThermodynamicTemperature; 2]) {
            for (temp, id) in temp_array.iter().zip(["CKPT", "FWD"].iter()) {
                let zone_measured_temp_id = format!("COND_{}_TEMP", &id);
                self.write_by_name(&zone_measured_temp_id, temp.get::<degree_celsius>());
            }
        }

        fn command_pack_flow_selector_position(&mut self, value: u8) {
            self.write_by_name("KNOB_OVHD_AIRCOND_PACKFLOW_Position", value);
        }

        fn command_sea_level_pressure(&mut self, value: Pressure) {
            self.write_by_name("SEA LEVEL PRESSURE", value.get::<hectopascal>());
        }

        fn command_destination_qnh(&mut self, value: Pressure) {
            self.write_by_name("DESTINATION_QNH", value);
        }

        fn command_ditching_pb_on(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_DITCHING_PB_IS_ON", true);
            self
        }

        fn command_mode_sel_pb_auto(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MODE_SEL_PB_IS_AUTO", true);
            self
        }

        fn command_mode_sel_pb_man(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MODE_SEL_PB_IS_AUTO", false);
            self
        }

        fn command_ldg_elev_knob_value(mut self, value: f64) -> Self {
            self.write_by_name("OVHD_PRESS_LDG_ELEV_KNOB", value);
            self
        }

        fn command_packs_on_off(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_COND_PACK_1_PB_IS_ON", on_off);
            self.write_by_name("OVHD_COND_PACK_2_PB_IS_ON", on_off);
            self
        }

        fn command_man_vs_switch_position(mut self, position: usize) -> Self {
            if position == 0 {
                self.write_by_name("OVHD_PRESS_MAN_VS_CTL_SWITCH", 0);
            } else if position == 2 {
                self.write_by_name("OVHD_PRESS_MAN_VS_CTL_SWITCH", 2);
            } else {
                self.write_by_name("OVHD_PRESS_MAN_VS_CTL_SWITCH", 1);
            }
            self
        }

        fn command_on_ground(&mut self, on_ground: bool) {
            self.command(|a| a.set_on_ground(on_ground));
        }

        fn command_engine_n1(&mut self, n1: Ratio) {
            self.command(|a| a.set_engine_n1(n1));
        }

        fn command_aircraft_climb(mut self, init_altitude: Length, final_altitude: Length) -> Self {
            const KPA_FT: f64 = 0.0205; //KPa/ft ASL
            const PRESSURE_CONSTANT: f64 = 911.47;

            self.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
            self.set_ambient_pressure(Pressure::new::<hectopascal>(
                PRESSURE_CONSTANT - init_altitude.get::<foot>() * (KPA_FT),
            ));

            for i in ((init_altitude.get::<foot>() / 1000.) as u32)
                ..((final_altitude.get::<foot>() / 1000.) as u32)
            {
                self.set_ambient_pressure(Pressure::new::<hectopascal>(
                    PRESSURE_CONSTANT - (((i * 1000) as f64) * (KPA_FT)),
                ));
                for _ in 1..10 {
                    self.run();
                    self.run();
                    self.run();
                    self.run();
                    self.run();
                }
            }
            self.set_ambient_pressure(Pressure::new::<hectopascal>(
                PRESSURE_CONSTANT - final_altitude.get::<foot>() * (KPA_FT),
            ));
            self.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
            self.set_indicated_altitude(final_altitude);
            self.run();
            self
        }

        fn initial_outflow_valve_open_amount(&self) -> Ratio {
            self.stored_ofv_open_amount.unwrap()
        }

        fn initial_cabin_vs(&self) -> Velocity {
            self.stored_vertical_speed.unwrap()
        }

        fn cabin_altitude(&self) -> Length {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.cpc[0].cabin_altitude())
        }

        fn cabin_pressure(&self) -> Pressure {
            self.query(|a| {
                a.a320_cabin_air
                    .a320_cabin
                    .cabin_air_simulation
                    .cabin_pressure()
            })
        }

        fn cabin_vs(&self) -> Velocity {
            self.query(|a| {
                a.a320_cabin_air.a320_pressurization_system.cpc[0].cabin_vertical_speed()
            })
        }

        fn cabin_delta_p(&self) -> Pressure {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.cpc[0].cabin_delta_p())
        }

        fn active_system(&self) -> usize {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.active_system)
        }

        fn outflow_valve_open_amount(&self) -> Ratio {
            self.query(|a| {
                a.a320_cabin_air.a320_pressurization_system.outflow_valve[0].open_amount()
            })
        }

        fn safety_valve_open_amount(&self) -> Ratio {
            self.query(|a| {
                a.a320_cabin_air
                    .a320_pressurization_system
                    .safety_valve
                    .open_amount()
            })
        }

        fn landing_elevation(&self) -> Length {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.cpc[0].landing_elevation())
        }

        fn is_mode_sel_pb_auto(&mut self) -> bool {
            self.read_by_name("OVHD_PRESS_MODE_SEL_PB_IS_AUTO")
        }

        fn cabin_air_in(&self) -> MassRate {
            self.query(|a| {
                a.a320_cabin_air
                    .a320_air_conditioning_system
                    .outlet_air()
                    .flow_rate()
            })
        }
    }
    impl TestBed for CabinAirTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> CabinAirTestBed {
        CabinAirTestBed::new()
    }

    fn test_bed_in_cruise() -> CabinAirTestBed {
        let mut test_bed =
            test_bed().command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(20000.));
        test_bed.set_indicated_altitude(Length::new::<foot>(20000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(472.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed = test_bed.iterate(31);
        test_bed
    }

    fn test_bed_in_descent() -> CabinAirTestBed {
        let test_bed = test_bed_in_cruise()
            .vertical_speed_of(Velocity::new::<foot_per_minute>(-260.))
            .iterate(40);
        test_bed
    }

    mod a320_pressurization_tests {
        use super::*;

        #[test]
        fn conversion_from_pressure_to_altitude_works() {
            let test_bed = test_bed()
                .on_ground()
                .run_and()
                .command_packs_on_off(false)
                .ambient_pressure_of(Pressure::new::<hectopascal>(696.86)) // Equivalent to 10,000ft from tables
                .iterate(100);

            assert!(
                (test_bed.cabin_altitude() - Length::new::<foot>(10000.)).abs()
                    < Length::new::<foot>(10.)
            );
        }

        #[test]
        fn positive_cabin_vs_reduces_cabin_pressure() {
            let test_bed = test_bed()
                .run_and()
                .memorize_cabin_pressure()
                .then()
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.));

            assert!(test_bed.initial_pressure() > test_bed.cabin_pressure());
        }

        #[test]
        fn seventy_seconds_after_landing_cpc_switches() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(69);

            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.active_system(), 2);

            test_bed = test_bed.iterate(10);

            assert_eq!(test_bed.active_system(), 2);
        }

        #[test]
        fn fifty_five_seconds_after_landing_outflow_valve_opens() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(5);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(11);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(99.));
        }

        #[test]
        fn outflow_valve_closes_when_ditching_pb_is_on() {
            let mut test_bed = test_bed().iterate(50);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(1.));

            test_bed = test_bed.command_ditching_pb_on().iterate(10);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(1.));
        }

        #[test]
        fn fifty_five_seconds_after_landing_outflow_valve_doesnt_open_if_ditching_pb_is_on() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(99.));

            test_bed = test_bed.command_ditching_pb_on().iterate(5);

            assert!(!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(99.)));
            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(1.));
        }

        #[test]
        fn fifty_five_seconds_after_landing_outflow_valve_doesnt_open_if_mode_sel_man() {
            let test_bed = test_bed_in_descent()
                .memorize_outflow_valve_open_amount()
                .command_mode_sel_pb_man()
                .indicated_airspeed_of(Velocity::new::<knot>(69.))
                .then()
                .set_on_ground()
                .iterate(55);

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                test_bed.initial_outflow_valve_open_amount()
            );
        }

        #[test]
        fn rpcu_opens_ofv_if_mode_sel_man() {
            let test_bed = test_bed_in_descent()
                .command_mode_sel_pb_man()
                .indicated_airspeed_of(Velocity::new::<knot>(69.))
                .then()
                .set_on_ground()
                .iterate(200);

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                Ratio::new::<percent>(100.)
            );
        }

        #[test]
        fn cpc_man_mode_starts_in_auto() {
            let mut test_bed = test_bed();

            assert!(test_bed.is_mode_sel_pb_auto());
        }

        #[test]
        fn cpc_switches_if_man_mode_is_engaged_for_at_least_10_seconds() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(11.))
                .command_mode_sel_pb_auto()
                .iterate(2);

            assert_eq!(test_bed.active_system(), 2);
        }

        #[test]
        fn cpc_does_not_switch_if_man_mode_is_engaged_for_less_than_10_seconds() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(9.))
                .command_mode_sel_pb_auto()
                .iterate(2);

            assert_eq!(test_bed.active_system(), 1);
        }

        #[test]
        fn cpc_switching_timer_resets() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(9.))
                .command_mode_sel_pb_auto()
                .iterate(2);
            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(9.))
                .command_mode_sel_pb_auto()
                .iterate(2);
            assert_eq!(test_bed.active_system(), 1);
        }

        #[test]
        fn cpc_targets_manual_landing_elev_if_knob_not_in_initial_position() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.landing_elevation(), Length::new::<foot>(0.));

            test_bed = test_bed.command_ldg_elev_knob_value(1000.).and_run();

            assert_eq!(test_bed.landing_elevation(), Length::new::<foot>(1000.));
        }

        #[test]
        fn cpc_targets_auto_landing_elev_if_knob_returns_to_initial_position() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.landing_elevation(), Length::new::<foot>(0.));

            test_bed = test_bed.command_ldg_elev_knob_value(1000.).and_run();

            assert_eq!(test_bed.landing_elevation(), Length::new::<foot>(1000.));

            test_bed = test_bed.command_ldg_elev_knob_value(-2000.).and_run();

            assert_eq!(test_bed.landing_elevation(), Length::new::<foot>(0.));
        }

        #[test]
        fn aircraft_vs_starts_at_0() {
            let test_bed = test_bed().set_on_ground().iterate(300);

            assert!((test_bed.cabin_vs()).abs() < Velocity::new::<foot_per_minute>(1.));
        }

        #[test]
        fn outflow_valve_stays_open_on_ground() {
            let mut test_bed = test_bed().set_on_ground();

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                Ratio::new::<percent>(100.)
            );

            test_bed = test_bed.iterate(10);

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                Ratio::new::<percent>(100.)
            );
        }

        #[test]
        fn cabin_vs_changes_to_takeoff() {
            let test_bed = test_bed()
                .set_on_ground()
                .iterate(50)
                .set_takeoff_power()
                .iterate_with_delta(250, Duration::from_millis(100));

            assert!(
                (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(-400.)).abs()
                    < Velocity::new::<foot_per_minute>(50.)
            );
        }

        #[test]
        fn cabin_delta_p_does_not_exceed_0_1_during_takeoff() {
            let test_bed = test_bed()
                .on_ground()
                .iterate(20)
                .set_takeoff_power()
                .iterate_with_delta(300, Duration::from_millis(100));

            assert!(
                (test_bed.cabin_delta_p() - Pressure::new::<psi>(0.1)).abs()
                    < Pressure::new::<psi>(0.01)
            );
            assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(10.));
        }

        #[test]
        fn cabin_vs_changes_to_climb() {
            let test_bed = test_bed()
                .iterate(10)
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .ambient_pressure_of(Pressure::new::<hectopascal>(900.))
                .iterate_with_delta(200, Duration::from_millis(100));

            assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(0.));
        }

        #[test]
        fn cabin_vs_increases_with_altitude() {
            let test_bed = test_bed()
                .iterate(10)
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .then()
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.))
                .with()
                .ambient_pressure_of(Pressure::new::<hectopascal>(696.85))
                .iterate(10)
                .memorize_vertical_speed()
                .then()
                .command_aircraft_climb(Length::new::<foot>(10000.), Length::new::<foot>(30000.))
                .and()
                .ambient_pressure_of(Pressure::new::<hectopascal>(300.92))
                .iterate(10);

            assert!(test_bed.cabin_vs() > test_bed.initial_cabin_vs());
        }

        #[test]
        fn cabin_vs_changes_to_cruise() {
            let test_bed = test_bed_in_cruise().iterate_with_delta(200, Duration::from_millis(100));

            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(10.));
        }

        #[test]
        fn cabin_vs_changes_to_descent() {
            let test_bed = test_bed_in_cruise()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(-260.))
                .iterate(32);

            assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(-750.));
            assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(0.));
        }

        #[test]
        fn cabin_vs_changes_to_ground() {
            let test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(20);

            assert!(
                (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(500.)).abs()
                    < Velocity::new::<foot_per_minute>(10.)
            );
        }

        #[test]
        fn cabin_delta_p_does_not_exceed_8_06_psi_in_climb() {
            let test_bed = test_bed()
                .and_run()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .iterate(5)
                .then()
                .command_aircraft_climb(Length::new::<foot>(1000.), Length::new::<foot>(39000.))
                .with()
                .ambient_pressure_of(Pressure::new::<hectopascal>(196.41))
                .vertical_speed_of(Velocity::new::<foot_per_minute>(0.))
                .iterate(10);

            assert!(test_bed.cabin_delta_p() < Pressure::new::<psi>(8.06));
        }

        #[test]
        fn outflow_valve_closes_to_compensate_packs_off() {
            let test_bed = test_bed_in_cruise()
                .iterate(200)
                .memorize_outflow_valve_open_amount()
                .then()
                .command_packs_on_off(false)
                .iterate(100);

            assert!(
                (test_bed.initial_outflow_valve_open_amount()
                    - test_bed.outflow_valve_open_amount())
                    > Ratio::new::<percent>(5.)
            );
        }

        #[test]
        fn outflow_valve_does_not_move_when_man_mode_engaged() {
            let test_bed = test_bed()
                .iterate(10)
                .command_mode_sel_pb_man()
                .and_run()
                .memorize_outflow_valve_open_amount()
                .then()
                .command_aircraft_climb(Length::new::<foot>(7000.), Length::new::<foot>(14000.))
                .iterate(10);

            assert!(
                (test_bed.outflow_valve_open_amount()
                    - test_bed.initial_outflow_valve_open_amount())
                .abs()
                    < Ratio::new::<percent>(1.)
            );
        }

        #[test]
        fn outflow_valve_responds_to_man_inputs_when_in_man_mode() {
            let test_bed = test_bed_in_cruise()
                .command_mode_sel_pb_man()
                .and_run()
                .memorize_outflow_valve_open_amount()
                .command_man_vs_switch_position(0)
                .iterate(10);

            assert!(
                test_bed.outflow_valve_open_amount() > test_bed.initial_outflow_valve_open_amount()
            );
        }

        #[test]
        fn outflow_valve_position_affects_cabin_vs_when_in_man_mode() {
            let test_bed = test_bed()
                .with()
                .ambient_pressure_of(Pressure::new::<hectopascal>(600.))
                .iterate(10)
                .command_mode_sel_pb_man()
                .and_run()
                .memorize_vertical_speed()
                .then()
                .command_man_vs_switch_position(0)
                .iterate(10);

            assert!(test_bed.cabin_vs() > test_bed.initial_cabin_vs());
        }

        #[test]
        fn pressure_builds_up_when_ofv_closed_and_packs_on() {
            let test_bed = test_bed()
                .iterate(10)
                .memorize_cabin_pressure()
                .command_mode_sel_pb_man()
                .command_man_vs_switch_position(2)
                .iterate(100)
                .command_packs_on_off(true)
                .iterate(10);

            assert!(test_bed.cabin_pressure() > test_bed.initial_pressure());
        }

        #[test]
        fn pressure_decreases_when_ofv_closed_and_packs_off() {
            let test_bed = test_bed()
                .with()
                .ambient_pressure_of(Pressure::new::<hectopascal>(465.67))
                .iterate(40)
                .then()
                .command_ditching_pb_on()
                .command_packs_on_off(false)
                .iterate(50)
                .memorize_cabin_pressure()
                .iterate(50);

            assert!(test_bed.cabin_pressure() < test_bed.initial_pressure());
        }

        #[test]
        fn pressure_is_constant_when_ofv_closed_and_packs_off_with_no_delta_p() {
            let test_bed = test_bed()
                .with()
                .iterate(40)
                .ambient_pressure_of(test_bed().cabin_pressure())
                .command_ditching_pb_on()
                .command_packs_on_off(false)
                .iterate(40)
                .memorize_cabin_pressure()
                .iterate(100);

            assert!(
                (test_bed.cabin_pressure() - test_bed.initial_pressure())
                    < Pressure::new::<psi>(0.1)
            );
        }

        #[test]
        fn pressure_never_goes_below_ambient_when_ofv_opens() {
            let test_bed = test_bed()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(20000.))
                .then()
                .ambient_pressure_of(Pressure::new::<hectopascal>(465.63))
                .vertical_speed_of(Velocity::new::<foot_per_minute>(0.))
                .iterate(10)
                .command_mode_sel_pb_man()
                .command_packs_on_off(false)
                .and_run()
                .command_man_vs_switch_position(0)
                .iterate(500);

            assert!(
                (test_bed.cabin_pressure() - Pressure::new::<hectopascal>(465.63)).abs()
                    < Pressure::new::<hectopascal>(10.)
            );
        }

        #[test]
        fn safety_valve_stays_closed_when_delta_p_is_less_than_8_6_psi() {
            let test_bed = test_bed()
                // Equivalent to SL - 8.6 PSI
                .ambient_pressure_of(Pressure::new::<hectopascal>(421.))
                .and_run();

            assert_eq!(
                test_bed.safety_valve_open_amount(),
                Ratio::new::<percent>(0.)
            );
        }

        #[test]
        fn safety_valve_stays_closed_when_delta_p_is_less_than_minus_1_psi() {
            let test_bed = test_bed()
                // Equivalent to SL + 1 PSI
                .ambient_pressure_of(Pressure::new::<hectopascal>(1080.))
                .and_run();

            assert_eq!(
                test_bed.safety_valve_open_amount(),
                Ratio::new::<percent>(0.)
            );
        }

        #[test]
        fn safety_valve_opens_when_delta_p_above_8_6_psi() {
            let test_bed = test_bed()
                .command_mode_sel_pb_man()
                .and_run()
                .command_man_vs_switch_position(2)
                .command_packs_on_off(false)
                .iterate(100)
                // Equivalent to SL - 10 PSI
                .ambient_pressure_of(Pressure::new::<hectopascal>(323.))
                .iterate_with_delta(20, Duration::from_millis(100));

            assert!(test_bed.safety_valve_open_amount() > Ratio::new::<percent>(0.));
        }

        #[test]
        fn safety_valve_opens_when_delta_p_below_minus_1_psi() {
            let test_bed = test_bed()
                .command_mode_sel_pb_man()
                .and_run()
                .command_man_vs_switch_position(2)
                .command_packs_on_off(false)
                .iterate(100)
                // Equivalent to SL + 2 PSI
                .ambient_pressure_of(Pressure::new::<hectopascal>(1400.))
                .iterate(20);

            assert!(test_bed.safety_valve_open_amount() > Ratio::new::<percent>(0.));
        }

        #[test]
        fn safety_valve_closes_when_condition_is_not_met() {
            let mut test_bed = test_bed()
                .command_mode_sel_pb_man()
                .and_run()
                .command_man_vs_switch_position(2)
                .command_packs_on_off(false)
                .iterate(100)
                // Equivalent to SL + 2 PSI
                .ambient_pressure_of(Pressure::new::<hectopascal>(1400.))
                .iterate(20);

            assert!(test_bed.safety_valve_open_amount() > Ratio::new::<percent>(0.));

            test_bed = test_bed
                .ambient_pressure_of(Pressure::new::<hectopascal>(1013.))
                .iterate(20);

            assert_eq!(
                test_bed.safety_valve_open_amount(),
                Ratio::new::<percent>(0.)
            );
        }

        #[test]
        fn no_singularities_when_crossing_zero_alt() {
            let mut test_bed = test_bed()
                .run_and()
                .command_packs_on_off(true)
                .ambient_pressure_of(Pressure::new::<hectopascal>(1013.))
                .iterate(200) // With packs on the altitude goes below 0
                .set_takeoff_power();

            test_bed.command_on_ground(false);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .command_man_vs_switch_position(2)
                .iterate(100)
                .ambient_pressure_of(Pressure::new::<hectopascal>(800.))
                .vertical_speed_of(Velocity::new::<foot_per_minute>(10000.))
                .iterate(10)
                .command_mode_sel_pb_auto()
                .iterate_with_delta(300, Duration::from_millis(1000))
                .memorize_vertical_speed(); // This makes the altitude cross 0

            assert!(test_bed.cabin_altitude() < Length::new::<foot>(0.));

            test_bed = test_bed.iterate_with_delta(100, Duration::from_millis(1000)); // Vertical speed needs to stay constant with no jumps

            assert!(
                (test_bed.initial_cabin_vs() - test_bed.cabin_vs()).abs()
                    < Velocity::new::<foot_per_minute>(10.)
            );
        }
    }

    #[test]
    fn packs_off_and_cab_fans_off_results_in_no_air_in() {
        let test_bed = test_bed()
            .set_on_ground()
            .command_packs_on_off(false)
            .cab_fans_pb_on(false)
            .iterate(40)
            .set_takeoff_power()
            .iterate_with_delta(200, Duration::from_millis(100));

        assert!(test_bed.cabin_air_in().abs() < MassRate::new::<kilogram_per_second>(0.1));
    }
}
