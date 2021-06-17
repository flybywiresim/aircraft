use std::{collections::HashMap, time::Duration};
use uom::si::{
    acceleration::foot_per_second_squared, f64::*, length::foot,
    thermodynamic_temperature::degree_celsius, velocity::knot,
};

use crate::electrical::Electricity;

use super::{
    from_bool, to_bool, Aircraft, Simulation, SimulationElement, SimulationElementVisitor,
    SimulationToSimulatorVisitor, SimulatorReaderWriter, SimulatorWriter, UpdateContext,
};

/// The simulation test bed handles the testing of [`Aircraft`] and [`SimulationElement`]
/// by running a full simulation tick on them.
///
/// [`Aircraft`]: ../trait.Aircraft.html
/// [`SimulationElement`]: ../trait.SimulationElement.html
pub struct SimulationTestBed<T: Aircraft> {
    reader_writer: TestReaderWriter,
    delta: Duration,
    simulation: Simulation<T>,
}
impl<T: Aircraft> SimulationTestBed<T> {
    pub fn new<U: FnOnce(&mut Electricity) -> T>(aircraft_ctor_fn: U) -> Self {
        let mut test_bed = Self {
            reader_writer: TestReaderWriter::new(),
            delta: Duration::from_secs(1),
            simulation: Simulation::new(aircraft_ctor_fn),
        };

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(250.));
        test_bed.set_indicated_altitude(Length::new::<foot>(5000.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed.set_on_ground(false);

        test_bed
    }

    pub fn with_delta(mut self, delta: Duration) -> Self {
        self.delta = delta;
        self
    }

    /// Creates an instance seeded with the state found in the given element.
    ///
    /// By default the unseeded simulation will return 0.0 or false for any requested
    /// variables. If this is a problem for your test, then use this function.
    pub fn seed(&mut self) {
        let mut writer = SimulatorWriter::new(&mut self.reader_writer);
        let mut visitor = SimulationToSimulatorVisitor::new(&mut writer);
        self.simulation.accept(&mut visitor);
    }

    /// Runs a single [Simulation] tick on the contained [Aircraft].
    pub fn run(&mut self) {
        self.simulation.tick(self.delta, &mut self.reader_writer)
    }

    pub fn electricity(&self) -> &Electricity {
        self.simulation.electricity()
    }

    pub fn electricity_mut(&mut self) -> &mut Electricity {
        self.simulation.electricity_mut()
    }

    pub fn aircraft(&self) -> &T {
        self.simulation.aircraft()
    }

    pub fn aircraft_mut(&mut self) -> &mut T {
        self.simulation.aircraft_mut()
    }

    pub fn set_delta(&mut self, delta: Duration) {
        self.delta = delta;
    }

    pub fn set_indicated_airspeed(&mut self, indicated_airspeed: Velocity) {
        self.reader_writer.write_f64(
            UpdateContext::INDICATED_AIRSPEED_KEY,
            indicated_airspeed.get::<knot>(),
        );
    }

    pub fn indicated_airspeed(&mut self) -> Velocity {
        Velocity::new::<knot>(
            self.reader_writer
                .read_f64(UpdateContext::INDICATED_AIRSPEED_KEY),
        )
    }

    pub fn set_indicated_altitude(&mut self, indicated_altitude: Length) {
        self.reader_writer.write_f64(
            UpdateContext::INDICATED_ALTITUDE_KEY,
            indicated_altitude.get::<foot>(),
        );
    }

    pub fn set_ambient_temperature(&mut self, ambient_temperature: ThermodynamicTemperature) {
        self.reader_writer.write_f64(
            UpdateContext::AMBIENT_TEMPERATURE_KEY,
            ambient_temperature.get::<degree_celsius>(),
        );
    }

    pub fn set_on_ground(&mut self, on_ground: bool) {
        self.reader_writer
            .write_bool(UpdateContext::IS_ON_GROUND_KEY, on_ground);
    }

    pub fn set_long_acceleration(&mut self, accel: Acceleration) {
        self.reader_writer.write_f64(
            UpdateContext::ACCEL_BODY_Z_KEY,
            accel.get::<foot_per_second_squared>(),
        );
    }

    pub fn write_bool(&mut self, name: &str, value: bool) {
        self.reader_writer.write_bool(name, value);
    }

    pub fn write_f64(&mut self, name: &str, value: f64) {
        self.reader_writer.write_f64(name, value);
    }

    pub fn read_bool(&mut self, name: &str) -> bool {
        self.reader_writer.read_bool(name)
    }

    pub fn read_f64(&mut self, name: &str) -> f64 {
        self.reader_writer.read_f64(name)
    }

    pub fn contains_key(&self, name: &str) -> bool {
        self.reader_writer.contains_key(name)
    }
}

pub struct TestAircraft<T: SimulationElement> {
    element: T,
    update_before_power_distribution_fn:
        Box<dyn Fn(&mut T, &UpdateContext, &mut Electricity) + 'static>,
    update_after_power_distribution_fn: Box<dyn Fn(&mut T, &UpdateContext) + 'static>,
}
impl<T: SimulationElement> TestAircraft<T> {
    pub fn new(element: T) -> Self {
        Self {
            element,
            update_before_power_distribution_fn: Box::new(|_, _, _| {}),
            update_after_power_distribution_fn: Box::new(|_, _| {}),
        }
    }

    pub fn with_update_before_power_distribution<
        U: Fn(&mut T, &UpdateContext, &mut Electricity) + 'static,
    >(
        mut self,
        func: U,
    ) -> Self {
        self.set_update_before_power_distribution(func);

        self
    }

    pub fn with_update_after_power_distribution<U: Fn(&mut T, &UpdateContext) + 'static>(
        mut self,
        func: U,
    ) -> Self {
        self.set_update_after_power_distribution(func);

        self
    }

    pub fn set_update_before_power_distribution<
        U: Fn(&mut T, &UpdateContext, &mut Electricity) + 'static,
    >(
        &mut self,
        func: U,
    ) {
        self.update_before_power_distribution_fn = Box::new(func);
    }

    pub fn set_update_after_power_distribution<U: Fn(&mut T, &UpdateContext) + 'static>(
        &mut self,
        func: U,
    ) {
        self.update_after_power_distribution_fn = Box::new(func);
    }

    pub fn element_mut(&mut self) -> &mut T {
        &mut self.element
    }

    pub fn element(&self) -> &T {
        &self.element
    }
}
impl<T: SimulationElement> Aircraft for TestAircraft<T> {
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
    ) {
        (self.update_before_power_distribution_fn)(&mut self.element, context, electricity);
    }

    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        (self.update_after_power_distribution_fn)(&mut self.element, context);
    }
}
impl<T: SimulationElement> SimulationElement for TestAircraft<T> {
    fn accept<W: SimulationElementVisitor>(&mut self, visitor: &mut W) {
        self.element.accept(visitor);

        visitor.visit(self);
    }
}

struct TestReaderWriter {
    variables: HashMap<String, f64>,
}
impl TestReaderWriter {
    fn new() -> Self {
        Self {
            variables: HashMap::new(),
        }
    }

    fn contains_key(&self, name: &str) -> bool {
        self.variables.contains_key(name)
    }

    fn write_bool(&mut self, name: &str, value: bool) {
        self.write(name, from_bool(value));
    }

    fn write_f64(&mut self, name: &str, value: f64) {
        self.write(name, value);
    }

    fn read_bool(&mut self, name: &str) -> bool {
        to_bool(self.read(name))
    }

    fn read_f64(&mut self, name: &str) -> f64 {
        self.read(name)
    }
}
impl SimulatorReaderWriter for TestReaderWriter {
    fn read(&mut self, name: &str) -> f64 {
        *self.variables.get(name).unwrap_or(&0.)
    }

    fn write(&mut self, name: &str, value: f64) {
        self.variables.insert(name.to_owned(), value);
    }
}

impl Default for TestReaderWriter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        shared::{ConsumePower, ElectricalBuses, PowerConsumptionReport},
        simulation::{SimulatorReader, SimulatorWriter},
    };

    #[derive(Clone, Copy, Debug, PartialEq)]
    enum CallOrder {
        Before,
        After,
    }

    #[derive(Default)]
    struct ElementUnderTest {
        update_called: bool,
        read_called: bool,
        receive_power_called: bool,
        consume_power_called: bool,
        consume_power_in_converters_called: bool,
        process_power_consumption_report_called: bool,
        update_called_before_or_after_receive_power: Option<CallOrder>,
    }
    impl ElementUnderTest {
        fn update(&mut self, _: &UpdateContext) {
            self.update_called = true;
            self.update_called_before_or_after_receive_power = if self.receive_power_called {
                Some(CallOrder::After)
            } else {
                Some(CallOrder::Before)
            };
        }

        fn all_functions_called(&self) -> bool {
            self.update_called
                && self.read_called
                && self.receive_power_called
                && self.consume_power_called
                && self.consume_power_in_converters_called
                && self.process_power_consumption_report_called
        }

        fn update_called_before_or_after_receive_power(&self) -> Option<CallOrder> {
            self.update_called_before_or_after_receive_power
        }
    }
    impl SimulationElement for ElementUnderTest {
        fn read(&mut self, _: &mut SimulatorReader) {
            self.read_called = true;
        }

        fn write(&self, _: &mut SimulatorWriter) {
            // Can't check this as the fn doesn't require mutable self.
        }

        fn receive_power(&mut self, _: &impl ElectricalBuses) {
            self.receive_power_called = true;
        }

        fn consume_power<T: ConsumePower>(&mut self, _: &mut T) {
            self.consume_power_called = true;
        }

        fn consume_power_in_converters<T: ConsumePower>(&mut self, _: &mut T) {
            self.consume_power_in_converters_called = true;
        }

        fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, _: &T) {
            self.process_power_consumption_report_called = true;
        }
    }

    #[test]
    fn test_aircraft_can_run_in_simulation() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(ElementUnderTest::default()).with_update_before_power_distribution(
                |el, context, _| {
                    el.update(context);
                },
            )
        });
        test_bed.run();

        assert!(test_bed.aircraft().element().all_functions_called());
    }

    #[test]
    fn defaults_to_receiving_power_before_update() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(ElementUnderTest::default()).with_update_after_power_distribution(
                |el, context| {
                    el.update(context);
                },
            )
        });
        test_bed.run();

        assert_eq!(
            test_bed
                .aircraft()
                .element()
                .update_called_before_or_after_receive_power(),
            Some(CallOrder::After)
        );
    }

    #[test]
    fn when_update_before_receive_power_requested_executes_update_before_receive_power() {
        let mut test_bed = SimulationTestBed::new(|_| {
            TestAircraft::new(ElementUnderTest::default()).with_update_before_power_distribution(
                |el, context, _| {
                    el.update(context);
                },
            )
        });

        test_bed.run();

        assert_eq!(
            test_bed
                .aircraft()
                .element()
                .update_called_before_or_after_receive_power(),
            Some(CallOrder::Before)
        );
    }
}
