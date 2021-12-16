use self::acs_controller::ACSController;

use crate::{
    overhead::{OnOffFaultPushButton, ValueKnob},
    shared::{CabinAltitude, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use std::{collections::HashMap, time::Duration};

use uom::si::{
    f64::*, mass_rate::kilogram_per_second, pressure::hectopascal,
    thermodynamic_temperature::degree_celsius,
};

pub mod acs_controller;
pub mod cabin_air;

pub trait DuctTemperature {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature>;
}

pub trait FlowControlValveSignal {
    fn should_open_fcv(&self) -> [bool; 2];
}

pub trait PackFlow {
    fn pack_flow(&self) -> MassRate;
}

pub struct AirConditioningSystem {
    acs_overhead: AirConditioningSystemOverhead,
    acsc: ACSController,
    pack_flow_valves: [PackFlowValve; 2],
    // TODO: pack: [AirConditioningPack; 2],
    // TODO: mixer_unit: MixerUnit,
    // TODO: trim_air_system: TrimAirSystem,
}

impl AirConditioningSystem {
    pub fn new(context: &mut InitContext, cabin_zone_ids: Vec<&'static str>) -> Self {
        Self {
            acs_overhead: AirConditioningSystemOverhead::new(context, &cabin_zone_ids),
            acsc: ACSController::new(context, cabin_zone_ids),
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
        pressurization: &impl CabinAltitude,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.acsc.update(
            context,
            &self.acs_overhead,
            &self.pack_flow_valves,
            engines,
            pressurization,
            lgciu,
        );

        for pack_fv in self.pack_flow_valves.iter_mut() {
            pack_fv.update(context, &self.acsc);
        }
    }
}

impl SimulationElement for AirConditioningSystem {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.acs_overhead.accept(visitor);
        self.acsc.accept(visitor);
        accept_iterable!(self.pack_flow_valves, visitor);

        visitor.visit(self);
    }
}

pub struct AirConditioningSystemOverhead {
    pack_1_pb: OnOffFaultPushButton,
    pack_2_pb: OnOffFaultPushButton,
    temperature_selectors: HashMap<&'static str, ValueKnob>,
}

impl AirConditioningSystemOverhead {
    fn new(context: &mut InitContext, cabin_zone_ids: &[&'static str]) -> Self {
        let mut temperature_selectors: HashMap<&'static str, ValueKnob> = HashMap::new();
        for id in cabin_zone_ids.iter() {
            let knob_id = format!("COND_{}_SELECTOR", id);
            temperature_selectors.insert(id, ValueKnob::new_with_value(context, &knob_id, 24.));
        }
        Self {
            pack_1_pb: OnOffFaultPushButton::new_on(context, "COND_PACK_1"),
            pack_2_pb: OnOffFaultPushButton::new_on(context, "COND_PACK_2"),
            temperature_selectors,
        }
    }

    fn selected_cabin_temperatures(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        let mut temperature_selectors_values: HashMap<&'static str, ThermodynamicTemperature> =
            HashMap::new();
        for (id, knob) in &self.temperature_selectors {
            temperature_selectors_values.insert(
                id,
                // Map from knob range 0-100 to 18-30 degrees C
                ThermodynamicTemperature::new::<degree_celsius>(knob.value() * 0.12 + 18.),
            );
        }
        temperature_selectors_values
    }

    fn pack_1_pb_is_on(&self) -> bool {
        self.pack_1_pb.is_on()
    }

    fn pack_2_pb_is_on(&self) -> bool {
        self.pack_2_pb.is_on()
    }
}

impl SimulationElement for AirConditioningSystemOverhead {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for selector in self.temperature_selectors.values_mut() {
            selector.accept(visitor);
        }
        self.pack_1_pb.accept(visitor);
        self.pack_2_pb.accept(visitor);

        visitor.visit(self);
    }
}

impl DuctTemperature for AirConditioningSystem {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        self.acsc.duct_demand_temperature()
    }
}

impl PackFlow for AirConditioningSystem {
    fn pack_flow(&self) -> MassRate {
        self.acsc.pack_flow()
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
            pack_flow_valve_id: context.get_identifier(Self::pack_flow_valve_id(&number)),
            number,
            is_open: false,
            timer_open: Duration::from_secs(0),
        }
    }

    fn pack_flow_valve_id(number: &usize) -> String {
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
