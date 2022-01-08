use self::acs_controller::AirConditioningSystemController;

use crate::{
    overhead::{OnOffFaultPushButton, ValueKnob},
    pressurization::PressurizationOverheadPanel,
    shared::{
        Cabin, EngineCorrectedN1, EngineFirePushButtons, EngineStartState, LgciuWeightOnWheels,
        PneumaticBleed,
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

pub trait FlowControlValveSignal {
    fn should_open_fcv(&self) -> [bool; 2];
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
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl PneumaticBleed + EngineStartState),
        pneumatic_overhead: [bool; 2],
        pressurization: &impl Cabin,
        pressurization_overhead: &PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.acsc.update(
            context,
            &self.acs_overhead,
            &self.pack_flow_valves,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pneumatic_overhead,
            pressurization,
            pressurization_overhead,
            lgciu,
        );

        for pack_fv in self.pack_flow_valves.iter_mut() {
            pack_fv.update(context, &self.acsc);
        }
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

    pack_1_pb: OnOffFaultPushButton,
    pack_2_pb: OnOffFaultPushButton,
    temperature_selectors: Vec<ValueKnob>,
    flow_selector: OverheadFlowSelector,
}

impl<const ZONES: usize> AirConditioningSystemOverhead<ZONES> {
    fn new(context: &mut InitContext, cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        let mut overhead = Self {
            flow_selector_id: context
                .get_identifier("KNOB_OVHD_AIRCOND_PACKFLOW_Position".to_owned()),

            pack_1_pb: OnOffFaultPushButton::new_on(context, "COND_PACK_1"),
            pack_2_pb: OnOffFaultPushButton::new_on(context, "COND_PACK_2"),
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
        // Map from knob range 0-100 to 18-30 degrees C
        ThermodynamicTemperature::new::<degree_celsius>(knob.value() * 0.12 + 18.)
    }

    fn pack_pushbuttons_state(&self) -> [bool; 2] {
        [self.pack_1_pb.is_on(), self.pack_2_pb.is_on()]
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
        self.pack_1_pb.accept(visitor);
        self.pack_2_pb.accept(visitor);

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

    fn update(&mut self, context: &UpdateContext, open_fcv: &impl FlowControlValveSignal) {
        self.is_open = open_fcv.should_open_fcv()[self.number - 1];
        if self.is_open {
            self.timer_open += context.delta();
        } else {
            self.timer_open = Duration::from_secs(0);
        }
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
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};

    struct TestAircraft {
        flow_control_valve: PackFlowValve,
        actuator_signal: TestActuatorSignal,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                flow_control_valve: PackFlowValve::new(context, 1),
                actuator_signal: TestActuatorSignal::new(),
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
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.flow_control_valve
                .update(context, &self.actuator_signal);
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

    impl FlowControlValveSignal for TestActuatorSignal {
        fn should_open_fcv(&self) -> [bool; 2] {
            [self.should_open_fcv, self.should_open_fcv]
        }
    }

    #[test]
    fn fcv_starts_closed() {
        let test_bed = SimulationTestBed::new(TestAircraft::new);

        assert!(!test_bed.query(|a| a.valve_is_open()));
    }

    #[test]
    fn fcv_opens_when_signal_to_open() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_is_open()));
    }

    #[test]
    fn fcv_closes_when_signal_to_close() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();
        test_bed.command(|a| a.command_valve_close());
        test_bed.run();

        assert!(!test_bed.query(|a| a.valve_is_open()));
    }

    #[test]
    fn timer_starts_at_zero() {
        let test_bed = SimulationTestBed::new(TestAircraft::new);

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));
    }

    #[test]
    fn timer_starts_when_valve_opens() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_timer()) > Duration::from_secs(0));
    }

    #[test]
    fn timer_resets_when_valve_closes() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_timer()) > Duration::from_secs(0));

        test_bed.command(|a| a.command_valve_close());
        test_bed.run();

        assert_eq!(test_bed.query(|a| a.valve_timer()), Duration::from_secs(0));
    }
}
