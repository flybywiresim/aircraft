use fxhash::FxHashMap;
use rand::Rng;
use std::{cell::Ref, time::Duration};
use uom::si::{
    acceleration::foot_per_second_squared,
    angle::degree,
    f64::*,
    length::foot,
    pressure::inch_of_mercury,
    ratio::ratio,
    thermodynamic_temperature::degree_celsius,
    velocity::{foot_per_minute, knot},
};

use crate::{
    electrical::{Electricity, Potential},
    failures::FailureType,
    shared::InternationalStandardAtmosphere,
};

use super::{
    Aircraft, Read, Reader, Simulation, SimulationElement, SimulationElementVisitor,
    SimulationToSimulatorVisitor, SimulatorReaderWriter, SimulatorWriter, UpdateContext, Write,
    Writer,
};
use crate::landing_gear::LandingGear;
use crate::shared::arinc429::{from_arinc429, to_arinc429, Arinc429Word, SignStatus};
use crate::simulation::update_context::Delta;
use crate::simulation::{
    DeltaContext, InitContext, StartState, VariableIdentifier, VariableRegistry,
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

    fn fail(&mut self, failure_type: FailureType) {
        self.test_bed_mut().fail(failure_type);
    }

    fn unfail(&mut self, failure_type: FailureType) {
        self.test_bed_mut().unfail(failure_type);
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

    fn set_true_airspeed(&mut self, true_airspeed: Velocity) {
        self.test_bed_mut().set_true_airspeed(true_airspeed);
    }

    fn indicated_airspeed(&mut self) -> Velocity {
        self.test_bed_mut().indicated_airspeed()
    }

    fn set_long_acc(&mut self, acc: Acceleration) {
        self.test_bed_mut().set_long_acceleration(acc);
    }

    fn set_lat_acc(&mut self, acc: Acceleration) {
        self.test_bed_mut().set_lat_acceleration(acc);
    }

    fn set_latitude(&mut self, lat: Angle) {
        self.test_bed_mut().set_latitude(lat);
    }

    fn set_norm_acc(&mut self, acc: Acceleration) {
        self.test_bed_mut().set_normal_acceleration(acc);
    }

    fn set_pressure_altitude(&mut self, pressure_altitude: Length) {
        self.test_bed_mut().set_pressure_altitude(pressure_altitude);
    }

    fn set_ambient_temperature(&mut self, ambient_temperature: ThermodynamicTemperature) {
        self.test_bed_mut()
            .set_ambient_temperature(ambient_temperature);
    }

    fn set_ambient_air_density(&mut self, ambient_density: MassDensity) {
        self.test_bed_mut().set_ambient_air_density(ambient_density);
    }

    fn ambient_temperature(&mut self) -> ThermodynamicTemperature {
        self.test_bed_mut().ambient_temperature()
    }

    fn set_sim_is_ready(&mut self, is_ready: bool) {
        self.test_bed_mut().set_is_ready(is_ready);
    }

    fn set_on_ground(&mut self, on_ground: bool) {
        self.test_bed_mut().set_on_ground(on_ground);
    }

    fn set_ambient_pressure(&mut self, ambient_pressure: Pressure) {
        self.test_bed_mut().set_ambient_pressure(ambient_pressure);
    }

    #[deprecated(note = "Cannot directly set V/S. It is derived from change in static pressure.")]
    fn set_vertical_speed(&mut self, vertical_speed: Velocity) {
        self.test_bed_mut().set_vertical_speed(vertical_speed);
    }

    fn contains_variable_with_name(&self, name: &str) -> bool {
        self.test_bed().contains_variable_with_name(name)
    }

    fn get_variable_identifier(&mut self, name: &str) -> Option<&VariableIdentifier> {
        self.test_bed_mut().get_variable_identifier(name)
    }
}
impl<T: TestBed> Writer for T {
    fn write_f64(&mut self, identifier: &VariableIdentifier, value: f64) {
        self.test_bed_mut().write_f64(identifier, value);
    }
}
impl<T: TestBed> Reader for T {
    fn read_f64(&mut self, identifier: &VariableIdentifier) -> f64 {
        self.test_bed_mut().read_f64(identifier)
    }
}

impl<T: TestBed, U> WriteByName<T, U> for T
where
    T: Write<U>,
{
    fn write_by_name(&mut self, name: &str, value: U) {
        if let Some(identifier) = self.get_variable_identifier(name).copied() {
            let value = self.convert(value);
            self.write_f64(&identifier, value)
        }
    }

    fn write_arinc429_by_name(&mut self, name: &str, value: U, ssm: SignStatus) {
        if let Some(identifier) = self.get_variable_identifier(name).copied() {
            let value = self.convert(value);
            self.write_f64(&identifier, to_arinc429(value, ssm));
        }
    }
}

impl<T: TestBed, U: Copy> ReadByName<T, U> for T
where
    T: Read<U>,
{
    fn read_by_name(&mut self, name: &str) -> U {
        let value = match self.get_variable_identifier(name).copied() {
            Some(identifier) => self.read_f64(&identifier),
            None => 0.,
        };

        self.convert(value)
    }

    fn read_arinc429_by_name(&mut self, name: &str) -> Arinc429Word<U> {
        let value = from_arinc429(match self.get_variable_identifier(name).copied() {
            Some(identifier) => self.read_f64(&identifier),
            None => 0.,
        });

        Arinc429Word::new(self.convert(value.0), value.1)
    }
}

pub trait WriteByName<T, U>
where
    T: Write<U>,
{
    fn write_by_name(&mut self, name: &str, value: U)
    where
        Self: Sized + Writer;

    fn write_arinc429_by_name(&mut self, name: &str, value: U, ssm: SignStatus)
    where
        Self: Sized + Writer;
}

pub trait ReadByName<T, U: Copy>
where
    T: Read<U>,
{
    fn read_by_name(&mut self, name: &str) -> U
    where
        Self: Sized + Reader;

    fn read_arinc429_by_name(&mut self, name: &str) -> Arinc429Word<U>
    where
        Self: Sized + Reader;
}

/// The simulation test bed handles the testing of [`Aircraft`] and [`SimulationElement`]
/// by running a full simulation tick on them.
///
/// [`Aircraft`]: ../trait.Aircraft.html
/// [`SimulationElement`]: ../trait.SimulationElement.html
pub struct SimulationTestBed<T: Aircraft> {
    reader_writer: TestReaderWriter,
    simulation: Simulation<T>,
    variable_registry: TestVariableRegistry,
}
impl<T: Aircraft> SimulationTestBed<T> {
    pub fn new<U: FnOnce(&mut InitContext) -> T>(aircraft_ctor_fn: U) -> Self {
        Self::new_with_start_state(Default::default(), aircraft_ctor_fn)
    }

    pub fn new_with_start_state<U: FnOnce(&mut InitContext) -> T>(
        start_state: StartState,
        aircraft_ctor_fn: U,
    ) -> Self {
        let mut variable_registry = TestVariableRegistry::default();
        let mut test_bed = Self {
            reader_writer: TestReaderWriter::new(),
            simulation: Simulation::new(start_state, aircraft_ctor_fn, &mut variable_registry),
            variable_registry,
        };

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(250.));
        test_bed.set_pressure_altitude(Length::new::<foot>(5000.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed.set_ambient_pressure(Pressure::new::<inch_of_mercury>(29.92));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
        test_bed.set_on_ground(false);
        test_bed.set_is_ready(true);
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

    pub fn run_with_delta(&mut self, delta: Duration) {
        self.simulation.tick(delta, 100., &mut self.reader_writer);
    }

    /// Runs a multiple [Simulation] ticks by subdividing given delta on the contained [Aircraft].
    ///
    /// [`Aircraft`]: ../trait.Aircraft.html
    /// [`Simulation`]: ../struct.Simulation.html
    pub fn run_multiple_frames(&mut self, delta: Duration) {
        let mut rng = rand::thread_rng();

        let mut executed_duration = Duration::from_secs(0);
        while executed_duration < delta {
            // Randomly set delta for 12 to 200ms, giving a simulated 83 to 5 fps refresh
            let current_delta = Duration::from_millis(rng.gen_range(12..200));

            if executed_duration + current_delta > delta {
                self.simulation.tick(
                    (executed_duration + current_delta) - delta,
                    10. + executed_duration.as_secs_f64(),
                    &mut self.reader_writer,
                );
                break;
            } else {
                self.simulation.tick(
                    current_delta,
                    10. + executed_duration.as_secs_f64(),
                    &mut self.reader_writer,
                );
            }
            executed_duration += current_delta;
        }
    }

    fn fail(&mut self, failure_type: FailureType) {
        self.simulation.activate_failure(failure_type);
    }

    fn unfail(&mut self, failure_type: FailureType) {
        self.simulation.deactivate_failure(failure_type);
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

    fn set_is_ready(&mut self, is_ready: bool) {
        self.write_by_name(UpdateContext::IS_READY_KEY, is_ready);
    }

    fn set_indicated_airspeed(&mut self, indicated_airspeed: Velocity) {
        self.write_by_name(UpdateContext::INDICATED_AIRSPEED_KEY, indicated_airspeed);
    }

    fn set_true_airspeed(&mut self, true_airspeed: Velocity) {
        self.write_by_name(UpdateContext::TRUE_AIRSPEED_KEY, true_airspeed);
    }

    fn indicated_airspeed(&mut self) -> Velocity {
        self.read_by_name(UpdateContext::INDICATED_AIRSPEED_KEY)
    }

    fn set_pressure_altitude(&mut self, pressure_altitude: Length) {
        let static_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(pressure_altitude);
        self.set_ambient_pressure(static_pressure);
    }

    fn set_ambient_temperature(&mut self, ambient_temperature: ThermodynamicTemperature) {
        self.write_by_name(UpdateContext::AMBIENT_TEMPERATURE_KEY, ambient_temperature);
    }

    fn set_ambient_air_density(&mut self, ambient_density: MassDensity) {
        self.write_by_name(UpdateContext::AMBIENT_DENSITY_KEY, ambient_density);
    }

    fn ambient_temperature(&mut self) -> ThermodynamicTemperature {
        self.read_by_name(UpdateContext::AMBIENT_TEMPERATURE_KEY)
    }

    fn set_on_ground(&mut self, on_ground: bool) {
        self.write_by_name(UpdateContext::IS_ON_GROUND_KEY, on_ground);

        let mut gear_compression = Ratio::new::<ratio>(0.);
        if on_ground {
            gear_compression = Ratio::new::<ratio>(0.95);
            self.write_by_name(UpdateContext::ALT_ABOVE_GROUND_KEY, 0.);
        }

        self.write_by_name(LandingGear::GEAR_CENTER_COMPRESSION, gear_compression);
        self.write_by_name(LandingGear::GEAR_LEFT_COMPRESSION, gear_compression);
        self.write_by_name(LandingGear::GEAR_RIGHT_COMPRESSION, gear_compression);
    }

    fn set_ambient_pressure(&mut self, ambient_pressure: Pressure) {
        self.write_by_name(
            UpdateContext::AMBIENT_PRESSURE_KEY,
            ambient_pressure.get::<inch_of_mercury>(),
        );
    }

    fn set_vertical_speed(&mut self, vertical_speed: Velocity) {
        self.write_by_name(
            UpdateContext::VERTICAL_SPEED_KEY,
            vertical_speed.get::<foot_per_minute>(),
        );
    }

    pub fn set_long_acceleration(&mut self, accel: Acceleration) {
        self.write_by_name(
            UpdateContext::ACCEL_BODY_Z_KEY,
            accel.get::<foot_per_second_squared>(),
        );
    }

    pub fn set_lat_acceleration(&mut self, accel: Acceleration) {
        self.write_by_name(
            UpdateContext::ACCEL_BODY_X_KEY,
            accel.get::<foot_per_second_squared>(),
        );
    }

    pub fn set_latitude(&mut self, lat: Angle) {
        self.write_by_name(UpdateContext::LATITUDE_KEY, lat.get::<degree>());
    }

    pub fn set_normal_acceleration(&mut self, accel: Acceleration) {
        self.write_by_name(
            UpdateContext::ACCEL_BODY_Y_KEY,
            accel.get::<foot_per_second_squared>(),
        );
    }

    fn write_f64(&mut self, identifier: &VariableIdentifier, value: f64) {
        self.reader_writer.write_f64(identifier, value);
    }

    fn read_f64(&mut self, identifier: &VariableIdentifier) -> f64 {
        self.reader_writer.read_f64(identifier)
    }

    fn contains_variable_with_name(&self, name: &str) -> bool {
        match self.variable_registry.find(name) {
            Some(identifier) => self.reader_writer.contains(identifier),
            None => false,
        }
    }

    fn get_variable_identifier(&mut self, name: &str) -> Option<&VariableIdentifier> {
        self.variable_registry.find(name)
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
    pub fn command_element<V: FnOnce(&mut T) -> W, W>(&mut self, func: V) -> W {
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
pub struct ElementCtorFn<T: SimulationElement, U: FnOnce(&mut InitContext) -> T>(pub U);
impl<T: SimulationElement, U: FnOnce(&mut InitContext) -> T> From<ElementCtorFn<T, U>>
    for SimulationTestBed<TestAircraft<T>>
{
    fn from(func: ElementCtorFn<T, U>) -> Self {
        Self::new(|context| TestAircraft::new((func.0)(context)))
    }
}
impl<T: SimulationElement> From<T> for SimulationTestBed<TestAircraft<T>> {
    fn from(element: T) -> Self {
        Self::new(|_| TestAircraft::new(element))
    }
}

type UpdateBeforePowerDistributionFn<T> =
    dyn Fn(&mut T, &UpdateContext, &mut Electricity) + 'static;
type UpdateAfterPowerDistributionFn<T> = dyn Fn(&mut T, &UpdateContext) + 'static;

pub struct TestAircraft<T: SimulationElement> {
    element: T,
    update_before_power_distribution_fn: Box<UpdateBeforePowerDistributionFn<T>>,
    update_after_power_distribution_fn: Box<UpdateAfterPowerDistributionFn<T>>,
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
    variables: FxHashMap<VariableIdentifier, f64>,
}
impl TestReaderWriter {
    fn new() -> Self {
        Self {
            variables: FxHashMap::default(),
        }
    }

    fn contains(&self, identifier: &VariableIdentifier) -> bool {
        self.variables.contains_key(identifier)
    }

    fn write_f64(&mut self, identifier: &VariableIdentifier, value: f64) {
        self.write(identifier, value);
    }

    fn read_f64(&mut self, identifier: &VariableIdentifier) -> f64 {
        self.read(identifier)
    }
}
impl SimulatorReaderWriter for TestReaderWriter {
    fn read(&mut self, identifier: &VariableIdentifier) -> f64 {
        *self.variables.get(identifier).unwrap_or(&0.)
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) {
        self.variables.insert(*identifier, value);
    }
}

impl Default for TestReaderWriter {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Default)]
// TODO Make private once HYD tests are modified to use SimulationTestBed.
pub struct TestVariableRegistry {
    name_to_identifier: FxHashMap<String, VariableIdentifier>,
    next_identifier: VariableIdentifier,
}

impl TestVariableRegistry {
    fn find(&self, name: &str) -> Option<&VariableIdentifier> {
        self.name_to_identifier.get(name)
    }
}

impl VariableRegistry for TestVariableRegistry {
    fn get(&mut self, name: String) -> VariableIdentifier {
        match self.name_to_identifier.get(&name).copied() {
            Some(identifier) => identifier,
            None => {
                let identifier = self.next_identifier;
                self.name_to_identifier.insert(name, identifier);
                self.next_identifier = identifier.next();

                identifier
            }
        }
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

#[derive(Default)]
pub struct TestUpdateContext {
    delta: Delta,
}

impl TestUpdateContext {
    pub fn with_delta(mut self, delta: Duration) -> Self {
        self.delta = delta.into();
        self
    }
}

impl DeltaContext for TestUpdateContext {
    fn delta(&self) -> Duration {
        self.delta.into()
    }

    fn delta_as_secs_f64(&self) -> f64 {
        self.delta.into()
    }

    fn delta_as_time(&self) -> Time {
        self.delta.into()
    }
}
