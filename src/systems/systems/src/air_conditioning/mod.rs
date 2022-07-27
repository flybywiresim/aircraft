use self::acs_controller::{AirConditioningSystemController, PackFlowValveSignal};

use crate::{
    overhead::{OnOffFaultPushButton, ValueKnob},
    pressurization::PressurizationOverheadPanel,
    shared::{
        Cabin, ControllerSignal, EngineBleedPushbutton, EngineCorrectedN1, EngineFirePushButtons,
        EngineStartState, GroundSpeed, LgciuWeightOnWheels, PneumaticBleed,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};

use std::{fmt::Display, time::Duration};

use uom::si::{
    f64::*, mass_rate::kilogram_per_second, pressure::hectopascal, ratio::percent,
    thermodynamic_temperature::degree_celsius,
};

pub mod acs_controller;
pub mod cabin_air;

pub trait DuctTemperature {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature>;
}

pub trait PackFlow {
    fn pack_flow(&self) -> MassRate;
}

pub enum ZoneType {
    Cockpit,
    Cabin(u8),
}

impl ZoneType {
    fn id(&self) -> usize {
        match self {
            ZoneType::Cockpit => 0,
            ZoneType::Cabin(number) => *number as usize,
        }
    }
}

// TODO: At the moment this lives here but it's specific to the A320.
impl Display for ZoneType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ZoneType::Cockpit => write!(f, "CKPT"),
            ZoneType::Cabin(number) => match number {
                1 => write!(f, "FWD"),
                2 => write!(f, "AFT"),
                _ => panic!("Not implemented for the A320 aircraft."),
            },
        }
    }
}

pub struct AirConditioningSystem<const ZONES: usize> {
    acs_overhead: AirConditioningSystemOverhead<ZONES>,
    acsc: AirConditioningSystemController<ZONES>,
    pack_flow_valves: [PackFlowValve; 2],
    // TODO: pack: [AirConditioningPack; 2],
    // TODO: mixer_unit: MixerUnit,
    // TODO: trim_air_system: TrimAirSystem,
}

impl<const ZONES: usize> AirConditioningSystem<ZONES> {
    pub fn new(context: &mut InitContext, cabin_zones: [ZoneType; ZONES]) -> Self {
        Self {
            acs_overhead: AirConditioningSystemOverhead::new(context, &cabin_zones),
            acsc: AirConditioningSystemController::new(context, &cabin_zones),
            pack_flow_valves: [
                PackFlowValve::new(context, 1),
                PackFlowValve::new(context, 2),
            ],
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl GroundSpeed,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl PneumaticBleed + EngineStartState),
        pneumatic_overhead: &impl EngineBleedPushbutton,
        pressurization: &impl Cabin,
        pressurization_overhead: &PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.acsc.update(
            context,
            adirs,
            &self.acs_overhead,
            &self.pack_flow_valves,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pressurization,
            pressurization_overhead,
            lgciu,
        );

        for pack_fv in self.pack_flow_valves.iter_mut() {
            pack_fv.update(context, &self.acsc, engines, pneumatic, pneumatic_overhead);
        }

        self.acs_overhead
            .set_pack_pushbutton_fault(self.acsc.pack_fault_determination(&self.pack_flow_valves));
    }
}

impl<const ZONES: usize> DuctTemperature for AirConditioningSystem<ZONES> {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.acsc.duct_demand_temperature()
    }
}

impl<const ZONES: usize> PackFlow for AirConditioningSystem<ZONES> {
    fn pack_flow(&self) -> MassRate {
        self.acsc.pack_flow()
    }
}

impl<const ZONES: usize> SimulationElement for AirConditioningSystem<ZONES> {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.acs_overhead.accept(visitor);
        self.acsc.accept(visitor);
        accept_iterable!(self.pack_flow_valves, visitor);

        visitor.visit(self);
    }
}

pub struct AirConditioningSystemOverhead<const ZONES: usize> {
    flow_selector_id: VariableIdentifier,

    pack_pbs: [OnOffFaultPushButton; 2],
    temperature_selectors: Vec<ValueKnob>,
    flow_selector: OverheadFlowSelector,
}

impl<const ZONES: usize> AirConditioningSystemOverhead<ZONES> {
    fn new(context: &mut InitContext, cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        let mut overhead = Self {
            flow_selector_id: context
                .get_identifier("KNOB_OVHD_AIRCOND_PACKFLOW_Position".to_owned()),

            pack_pbs: [
                OnOffFaultPushButton::new_on(context, "COND_PACK_1"),
                OnOffFaultPushButton::new_on(context, "COND_PACK_2"),
            ],
            temperature_selectors: Vec::new(),
            flow_selector: OverheadFlowSelector::Norm,
        };
        for id in cabin_zone_ids {
            let knob_id = format!("COND_{}_SELECTOR", id);
            overhead
                .temperature_selectors
                .push(ValueKnob::new_with_value(context, &knob_id, 24.));
        }
        overhead
    }

    fn selected_cabin_temperature(&self, zone_id: usize) -> ThermodynamicTemperature {
        let knob = &self.temperature_selectors[zone_id];
        // Map from knob range 0-300 to 18-30 degrees C
        ThermodynamicTemperature::new::<degree_celsius>(knob.value() * 0.04 + 18.)
    }

    fn pack_pushbuttons_state(&self) -> Vec<bool> {
        self.pack_pbs.iter().map(|pack| pack.is_on()).collect()
    }

    fn set_pack_pushbutton_fault(&mut self, pb_has_fault: [bool; 2]) {
        self.pack_pbs
            .iter_mut()
            .enumerate()
            .for_each(|(index, pushbutton)| pushbutton.set_fault(pb_has_fault[index]));
    }

    fn flow_selector_position(&self) -> OverheadFlowSelector {
        self.flow_selector
    }
}

impl<const ZONES: usize> SimulationElement for AirConditioningSystemOverhead<ZONES> {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.flow_selector = reader.read(&self.flow_selector_id);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.temperature_selectors, visitor);
        accept_iterable!(self.pack_pbs, visitor);

        visitor.visit(self);
    }
}

#[derive(Clone, Copy)]
enum OverheadFlowSelector {
    Lo = 80,
    Norm = 100,
    Hi = 120,
}

read_write_enum!(OverheadFlowSelector);

impl From<f64> for OverheadFlowSelector {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => OverheadFlowSelector::Lo,
            1 => OverheadFlowSelector::Norm,
            2 => OverheadFlowSelector::Hi,
            _ => panic!("Overhead flow selector position not recognized."),
        }
    }
}

impl From<OverheadFlowSelector> for Ratio {
    fn from(value: OverheadFlowSelector) -> Self {
        Ratio::new::<percent>((value as u8) as f64)
    }
}

struct PackFlowValve {
    pack_flow_valve_id: VariableIdentifier,

    number: usize,
    is_open: bool,
    timer_open: Duration,
}

impl PackFlowValve {
    fn new(context: &mut InitContext, number: usize) -> Self {
        Self {
            pack_flow_valve_id: context.get_identifier(Self::pack_flow_valve_id(number)),
            number,
            is_open: false,
            timer_open: Duration::from_secs(0),
        }
    }

    fn pack_flow_valve_id(number: usize) -> String {
        format!("COND_PACK_FLOW_VALVE_{}_IS_OPEN", number)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        open_fcv: &impl ControllerSignal<PackFlowValveSignal>,
        engines: [&impl EngineCorrectedN1; 2],
        pneumatic: &(impl PneumaticBleed + EngineStartState),
        pneumatic_overhead: &impl EngineBleedPushbutton,
    ) {
        if self.can_move_fcv(engines, pneumatic, pneumatic_overhead) {
            if let Some(signal) = open_fcv.signal() {
                self.is_open = signal.target_open_amount(self.number) > Ratio::new::<percent>(0.)
            }
            if self.is_open {
                self.timer_open += context.delta();
            } else {
                self.timer_open = Duration::from_secs(0);
            }
        } else {
            self.is_open = false;
        }
    }

    fn can_move_fcv(
        &self,
        engines: [&impl EngineCorrectedN1; 2],
        pneumatic: &(impl PneumaticBleed + EngineStartState),
        pneumatic_overhead: &impl EngineBleedPushbutton,
    ) -> bool {
        // Pneumatic overhead represents engine bleed pushbutton for left [0] and right [1] engine(s)
        ((engines[self.number - 1].corrected_n1() >= Ratio::new::<percent>(15.)
            && pneumatic_overhead.engine_bleed_pushbuttons_are_auto()[(self.number == 2) as usize])
            || (engines[(self.number == 1) as usize].corrected_n1() >= Ratio::new::<percent>(15.)
                && pneumatic_overhead.engine_bleed_pushbuttons_are_auto()
                    [(self.number == 1) as usize]
                && pneumatic.engine_crossbleed_is_on()))
            || pneumatic.apu_bleed_is_on()
    }

    fn fcv_timer(&self) -> Duration {
        self.timer_open
    }

    fn fcv_is_open(&self) -> bool {
        self.is_open
    }
}

impl SimulationElement for PackFlowValve {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pack_flow_valve_id, self.is_open);
    }
}

pub struct Air {
    temperature: ThermodynamicTemperature,
    pressure: Pressure,
    flow_rate: MassRate,
}

impl Air {
    const SPECIFIC_HEAT_CAPACITY_VOLUME: f64 = 0.718; // kJ/kg*K
    const SPECIFIC_HEAT_CAPACITY_PRESSURE: f64 = 1.005; // kJ/kg*K
    const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
    const MU: f64 = 1.6328e-5; // Viscosity kg/(m*s)
    const K: f64 = 0.022991; // Thermal conductivity - W/(m*C)
    const PRANDT_NUMBER: f64 = 0.677725;

    pub fn new() -> Self {
        Self {
            temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            pressure: Pressure::new::<hectopascal>(1013.25),
            flow_rate: MassRate::new::<kilogram_per_second>(0.),
        }
    }

    pub fn set_temperature(&mut self, temperature: ThermodynamicTemperature) {
        self.temperature = temperature;
    }

    pub fn set_pressure(&mut self, pressure: Pressure) {
        self.pressure = pressure;
    }

    pub fn set_flow_rate(&mut self, flow_rate: MassRate) {
        self.flow_rate = flow_rate;
    }

    pub fn temperature(&self) -> ThermodynamicTemperature {
        self.temperature
    }

    pub fn pressure(&self) -> Pressure {
        self.pressure
    }

    pub fn flow_rate(&self) -> MassRate {
        self.flow_rate
    }
}

impl Default for Air {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod air_conditioning_tests {
    use super::*;
    use crate::{
        overhead::AutoOffFaultPushButton,
        pneumatic::{valve::DefaultValve, EngineModeSelector, EngineState},
        shared::PneumaticValve,
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement,
        },
    };

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

        fn left_engine_bleed_pushbutton_set_auto(&mut self) {
            self.engine_1_bleed.set_auto(true);
        }

        fn right_engine_bleed_pushbutton_set_auto(&mut self) {
            self.engine_2_bleed.set_auto(true);
        }
    }

    impl EngineBleedPushbutton for TestPneumaticOverhead {
        fn engine_bleed_pushbuttons_are_auto(&self) -> [bool; 2] {
            [self.engine_1_bleed.is_auto(), self.engine_2_bleed.is_auto()]
        }
    }

    impl SimulationElement for TestPneumaticOverhead {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.engine_1_bleed.accept(visitor);
            self.engine_2_bleed.accept(visitor);

            visitor.visit(self);
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
        cross_bleed_valve: DefaultValve,
        fadec: TestFadec,
    }

    impl TestPneumatic {
        fn new(context: &mut InitContext) -> Self {
            Self {
                apu_bleed_air_valve: DefaultValve::new_closed(),
                cross_bleed_valve: DefaultValve::new_closed(),
                fadec: TestFadec::new(context),
            }
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
    impl SimulationElement for TestPneumatic {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.fadec.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestAircraft {
        flow_control_valve: PackFlowValve,
        actuator_signal: TestActuatorSignal,
        engine_1: TestEngine,
        engine_2: TestEngine,
        pneumatic: TestPneumatic,
        pneumatic_overhead: TestPneumaticOverhead,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                flow_control_valve: PackFlowValve::new(context, 1),
                actuator_signal: TestActuatorSignal::new(),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
                pneumatic: TestPneumatic::new(context),
                pneumatic_overhead: TestPneumaticOverhead::new(context),
            }
        }

        fn command_valve_open(&mut self) {
            self.actuator_signal.open();
        }

        fn command_valve_close(&mut self) {
            self.actuator_signal.close();
        }

        fn valve_is_open(&self) -> bool {
            self.flow_control_valve.fcv_is_open()
        }

        fn valve_timer(&self) -> Duration {
            self.flow_control_valve.fcv_timer()
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }

        fn set_bleed_pb_to_auto(&mut self) {
            self.pneumatic_overhead
                .left_engine_bleed_pushbutton_set_auto();
            self.pneumatic_overhead
                .right_engine_bleed_pushbutton_set_auto();
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.flow_control_valve.update(
                context,
                &self.actuator_signal,
                [&self.engine_1, &self.engine_2],
                &self.pneumatic,
                &self.pneumatic_overhead,
            );
        }
    }

    impl SimulationElement for TestAircraft {}

    struct TestActuatorSignal {
        should_open_fcv: bool,
    }

    impl TestActuatorSignal {
        fn new() -> Self {
            Self {
                should_open_fcv: false,
            }
        }

        fn open(&mut self) {
            self.should_open_fcv = true;
        }

        fn close(&mut self) {
            self.should_open_fcv = false;
        }
    }

    impl ControllerSignal<PackFlowValveSignal> for TestActuatorSignal {
        fn signal(&self) -> Option<PackFlowValveSignal> {
            let target_open = if self.should_open_fcv {
                Ratio::new::<percent>(100.)
            } else {
                Ratio::new::<percent>(0.)
            };
            Some(PackFlowValveSignal::new([target_open, target_open]))
        }
    }

    struct AirCondTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl AirCondTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            }
        }
    }
    impl TestBed for AirCondTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed_with_bleed() -> AirCondTestBed {
        let mut test_bed = AirCondTestBed::new();
        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(15.)));
        test_bed.command(|a| a.set_bleed_pb_to_auto());
        test_bed
    }

    #[test]
    fn fcv_starts_closed() {
        let test_bed = SimulationTestBed::new(TestAircraft::new);

        assert!(!test_bed.query(|a| a.valve_is_open()));
    }

    #[test]
    fn fcv_opens_when_signal_to_open() {
        let mut test_bed = test_bed_with_bleed();

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_is_open()));
    }

    #[test]
    fn fcv_closes_when_signal_to_close() {
        let mut test_bed = test_bed_with_bleed();

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();
        test_bed.command(|a| a.command_valve_close());
        test_bed.run();

        assert!(!test_bed.query(|a| a.valve_is_open()));
    }

    #[test]
    fn timer_starts_at_zero() {
        let test_bed = test_bed_with_bleed();

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));
    }

    #[test]
    fn timer_starts_when_valve_opens() {
        let mut test_bed = test_bed_with_bleed();

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_timer()) > Duration::from_secs(0));
    }

    #[test]
    fn timer_resets_when_valve_closes() {
        let mut test_bed = test_bed_with_bleed();

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_timer()) > Duration::from_secs(0));

        test_bed.command(|a| a.command_valve_close());
        test_bed.run();

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));
    }
}
