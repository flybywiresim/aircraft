use std::{cell::Ref, collections::HashMap, time::Duration};
use uom::si::{f64::*, length::foot, thermodynamic_temperature::degree_celsius, velocity::knot};

use crate::electrical::{Electricity, Potential};

use super::{
    Aircraft, Read, Reader, Simulation, SimulationElement, SimulationElementVisitor,
    SimulationToSimulatorVisitor, SimulatorReaderWriter, SimulatorWriter, UpdateContext, Write,
    Writer,
};

pub trait TestBed {
    type Aircraft: Aircraft;

    fn test_bed(&self) -> &SimulationTestBed<Self::Aircraft>;
    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<Self::Aircraft>;

    fn run(&mut self) {
        self.test_bed_mut().run();
    }

    fn run_without_delta(&mut self) {
        self.test_bed_mut().run_without_time();
    }

    fn run_with_delta(&mut self, delta: Duration) {
        self.test_bed_mut().run_with_delta(delta);
    }

    fn command<V: FnOnce(&mut Self::Aircraft)>(&mut self, func: V) {
        self.test_bed_mut().command(func);
    }

    fn query<V: FnOnce(&Self::Aircraft) -> W, W>(&self, func: V) -> W {
        self.test_bed().query(func)
    }

    fn query_elec<V: FnOnce(&Self::Aircraft, &Electricity) -> W, W>(&self, func: V) -> W {
        self.test_bed().query_elec(func)
    }

    fn query_elec_ref<'a, U: FnOnce(&Self::Aircraft, &'a Electricity) -> Ref<'a, Potential>>(
        &'a self,
        func: U,
    ) -> Ref<'a, Potential> {
        self.test_bed().query_elec_ref(func)
    }

    fn set_indicated_airspeed(&mut self, indicated_airspeed: Velocity) {
        self.test_bed_mut()
            .set_indicated_airspeed(indicated_airspeed);
    }

    fn indicated_airspeed(&mut self) -> Velocity {
        self.test_bed_mut().indicated_airspeed()
    }

    fn set_indicated_altitude(&mut self, indicated_altitude: Length) {
        self.test_bed_mut()
            .set_indicated_altitude(indicated_altitude);
    }

    fn set_ambient_temperature(&mut self, ambient_temperature: ThermodynamicTemperature) {
        self.test_bed_mut()
            .set_ambient_temperature(ambient_temperature);
    }

    fn set_on_ground(&mut self, on_ground: bool) {
        self.test_bed_mut().set_on_ground(on_ground);
    }

    fn contains_key(&self, name: &str) -> bool {
        self.test_bed().contains_key(name)
    }
}
impl<T: TestBed> Writer for T {
    fn write_f64(&mut self, name: &str, value: f64) {
        self.test_bed_mut().write_f64(name, value);
    }
}
impl<T: TestBed> Reader for T {
    fn read_f64(&mut self, name: &str) -> f64 {
        self.test_bed_mut().read_f64(name)
    }
}

/// The simulation test bed handles the testing of [`Aircraft`] and [`SimulationElement`]
/// by running a full simulation tick on them.
///
/// [`Aircraft`]: ../trait.Aircraft.html
/// [`SimulationElement`]: ../trait.SimulationElement.html
pub struct SimulationTestBed<T: Aircraft> {
    reader_writer: TestReaderWriter,
    simulation: Simulation<T>,
}
impl<T: Aircraft> SimulationTestBed<T> {
    pub fn new<U: FnOnce(&mut Electricity) -> T>(aircraft_ctor_fn: U) -> Self {
        let mut test_bed = Self {
            reader_writer: TestReaderWriter::new(),
            simulation: Simulation::new(aircraft_ctor_fn),
        };

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(250.));
        test_bed.set_indicated_altitude(Length::new::<foot>(5000.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed.set_on_ground(false);
        test_bed.seed();

        test_bed
    }

    /// Creates an instance seeded with the starting state found in the given element.
    ///
    /// By default an unseeded simulation will return 0.0 or false for any requested
    /// variables. This function sets simvars to the the initial programmed state
    /// (e.g. `OnOffFaultPushButton::new_on` would be a push button which initially
    /// is ON).
    fn seed(&mut self) {
        let mut writer = SimulatorWriter::new(&mut self.reader_writer);
        let mut visitor = SimulationToSimulatorVisitor::new(&mut writer);
        self.simulation.accept(&mut visitor);
    }

    /// Runs a single 1 second duration [Simulation] tick on the contained [Aircraft].
    fn run(&mut self) {
        self.run_with_delta(Duration::from_secs(1));
    }

    fn run_without_time(&mut self) {
        self.run_with_delta(Duration::from_secs(0));
    }

    fn run_with_delta(&mut self, delta: Duration) {
        self.simulation.tick(delta, &mut self.reader_writer);
    }

    fn aircraft(&self) -> &T {
        self.simulation.aircraft()
    }

    fn aircraft_mut(&mut self) -> &mut T {
        self.simulation.aircraft_mut()
    }

    fn command<U: FnOnce(&mut T)>(&mut self, func: U) {
        (func)(self.simulation.aircraft_mut())
    }

    fn query<U: FnOnce(&T) -> V, V>(&self, func: U) -> V {
        (func)(self.simulation.aircraft())
    }

    fn query_elec<U: FnOnce(&T, &Electricity) -> V, V>(&self, func: U) -> V {
        (func)(self.simulation.aircraft(), self.simulation.electricity())
    }

    fn query_elec_ref<'a, U: FnOnce(&T, &'a Electricity) -> Ref<'a, Potential>>(
        &'a self,
        func: U,
    ) -> Ref<'a, Potential> {
        (func)(self.simulation.aircraft(), self.simulation.electricity())
    }

    fn set_indicated_airspeed(&mut self, indicated_airspeed: Velocity) {
        self.write(UpdateContext::INDICATED_AIRSPEED_KEY, indicated_airspeed);
    }

    fn indicated_airspeed(&mut self) -> Velocity {
        self.read(UpdateContext::INDICATED_AIRSPEED_KEY)
    }

    fn set_indicated_altitude(&mut self, indicated_altitude: Length) {
        self.write(UpdateContext::INDICATED_ALTITUDE_KEY, indicated_altitude);
    }

    fn set_ambient_temperature(&mut self, ambient_temperature: ThermodynamicTemperature) {
        self.write(UpdateContext::AMBIENT_TEMPERATURE_KEY, ambient_temperature);
    }

    fn set_on_ground(&mut self, on_ground: bool) {
        self.write(UpdateContext::IS_ON_GROUND_KEY, on_ground);
    }

    fn write_f64(&mut self, name: &str, value: f64) {
        self.reader_writer.write_f64(name, value);
    }

    fn read_f64(&mut self, name: &str) -> f64 {
        self.reader_writer.read_f64(name)
    }

    fn contains_key(&self, name: &str) -> bool {
        self.reader_writer.contains_key(name)
    }
}
impl<T: Aircraft> TestBed for SimulationTestBed<T> {
    type Aircraft = T;

    fn test_bed(&self) -> &SimulationTestBed<T> {
        self
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<T> {
        self
    }
}
impl<T: SimulationElement> SimulationTestBed<TestAircraft<T>> {
    pub fn command_element<V: FnOnce(&mut T)>(&mut self, func: V) {
        (func)(self.aircraft_mut().element_mut())
    }

    pub fn query_element<V: FnOnce(&T) -> W, W>(&self, func: V) -> W {
        (func)(self.aircraft().element())
    }

    pub fn query_element_elec<V: FnOnce(&T, &Electricity) -> W, W>(&self, func: V) -> W {
        (func)(self.aircraft().element(), self.simulation.electricity())
    }

    pub fn with_update_before_power_distribution<
        U: Fn(&mut T, &UpdateContext, &mut Electricity) + 'static,
    >(
        mut self,
        func: U,
    ) -> Self {
        self.aircraft_mut()
            .set_update_before_power_distribution(func);

        self
    }

    pub fn with_update_after_power_distribution<U: Fn(&mut T, &UpdateContext) + 'static>(
        mut self,
        func: U,
    ) -> Self {
        self.aircraft_mut()
            .set_update_after_power_distribution(func);

        self
    }

    pub fn set_update_before_power_distribution<
        U: Fn(&mut T, &UpdateContext, &mut Electricity) + 'static,
    >(
        &mut self,
        func: U,
    ) {
        self.aircraft_mut()
            .set_update_before_power_distribution(func);
    }

    pub fn set_update_after_power_distribution<U: Fn(&mut T, &UpdateContext) + 'static>(
        &mut self,
        func: U,
    ) {
        self.aircraft_mut()
            .set_update_after_power_distribution(func);
    }
}

/// Wrapper for converting the given constructor function to
/// a [`SimulationTestBed<TestAircraft<T>>`] instance.
pub struct ElementCtorFn<T: SimulationElement, U: Fn(&mut Electricity) -> T>(pub U);
impl<T: SimulationElement, U: Fn(&mut Electricity) -> T> From<ElementCtorFn<T, U>>
    for SimulationTestBed<TestAircraft<T>>
{
    fn from(func: ElementCtorFn<T, U>) -> Self {
        Self::new(|electricity| TestAircraft::new((func.0)(electricity)))
    }
}
impl<T: SimulationElement> From<T> for SimulationTestBed<TestAircraft<T>> {
    fn from(element: T) -> Self {
        Self::new(|_| TestAircraft::new(element))
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

    fn set_update_before_power_distribution<
        U: Fn(&mut T, &UpdateContext, &mut Electricity) + 'static,
    >(
        &mut self,
        func: U,
    ) {
        self.update_before_power_distribution_fn = Box::new(func);
    }

    fn set_update_after_power_distribution<U: Fn(&mut T, &UpdateContext) + 'static>(
        &mut self,
        func: U,
    ) {
        self.update_after_power_distribution_fn = Box::new(func);
    }

    fn element_mut(&mut self) -> &mut T {
        &mut self.element
    }

    fn element(&self) -> &T {
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

    fn write_f64(&mut self, name: &str, value: f64) {
        self.write(name, value);
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

        fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, _: &mut T) {
            self.consume_power_called = true;
        }

        fn consume_power_in_converters<T: ConsumePower>(&mut self, _: &UpdateContext, _: &mut T) {
            self.consume_power_in_converters_called = true;
        }

        fn process_power_consumption_report<T: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            _: &T,
        ) {
            self.process_power_consumption_report_called = true;
        }
    }

    #[test]
    fn test_aircraft_can_run_in_simulation() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });
        test_bed.run();

        assert!(test_bed.query_element(|e| e.all_functions_called()));
    }

    #[test]
    fn defaults_to_receiving_power_before_update() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_after_power_distribution(|el, context| {
                el.update(context);
            });
        test_bed.run();

        assert_eq!(
            test_bed.query_element(|e| e.update_called_before_or_after_receive_power()),
            Some(CallOrder::After)
        );
    }

    #[test]
    fn when_update_before_receive_power_requested_executes_update_before_receive_power() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.run();

        assert_eq!(
            test_bed.query_element(|e| e.update_called_before_or_after_receive_power()),
            Some(CallOrder::Before)
        );
    }
}
