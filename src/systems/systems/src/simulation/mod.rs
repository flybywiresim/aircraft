use std::time::Duration;

mod update_context;
use crate::electrical::{ElectricalElementIdentifier, ElectricalElementIdentifierProvider};
use crate::shared::ElectricalBusType;
use crate::{
    electrical::Electricity,
    failures::FailureType,
    shared::arinc429::{from_arinc429, to_arinc429, Arinc429Word, SignStatus},
    shared::{to_bool, ConsumePower, ElectricalBuses, MachNumber, PowerConsumptionReport},
};
use uom::si::angular_velocity::revolution_per_minute;
use uom::si::{
    acceleration::foot_per_second_squared, angle::degree, electric_current::ampere,
    electric_potential::volt, f64::*, frequency::hertz, length::foot, mass::pound, pressure::psi,
    ratio::percent, thermodynamic_temperature::degree_celsius, velocity::knot, volume::gallon,
    volume_rate::gallon_per_second,
};
pub use update_context::*;

pub mod test;

/// Trait for a type which can read and write simulator data.
/// Using this trait implementors can abstract away the way the code
/// interacts with the simulator. This separation of concerns is very important
/// for keeping the majority of the code unit testable.
pub trait SimulatorReaderWriter {
    /// Reads a variable with the given identifier from the simulator.
    fn read(&mut self, identifier: &VariableIdentifier) -> f64;
    /// Writes a variable with the given identifier to the simulator.
    fn write(&mut self, identifier: &VariableIdentifier, value: f64);
}

pub trait VariableRegistry {
    fn get(&mut self, name: String) -> VariableIdentifier;
}

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq, Hash)]
pub struct VariableIdentifier(u8, usize);

impl VariableIdentifier {
    pub fn new(identifier_type: u8) -> Self {
        Self {
            0: identifier_type,
            1: 0,
        }
    }

    pub fn identifier_type(&self) -> u8 {
        self.0
    }

    pub fn identifier_index(&self) -> usize {
        self.1
    }
}

impl VariableIdentifier {
    pub fn next(&self) -> Self {
        Self {
            0: self.0,
            1: self.1 + 1,
        }
    }
}

pub struct InitContext<'a> {
    electrical_identifier_provider: &'a mut dyn ElectricalElementIdentifierProvider,
    registry: &'a mut dyn VariableRegistry,
}

impl<'a> InitContext<'a> {
    pub fn new(
        electricity: &'a mut impl ElectricalElementIdentifierProvider,
        registry: &'a mut impl VariableRegistry,
    ) -> Self {
        Self {
            electrical_identifier_provider: electricity,
            registry,
        }
    }

    pub fn get_identifier(&mut self, name: String) -> VariableIdentifier {
        self.registry.get(name)
    }
}

impl<'a> ElectricalElementIdentifierProvider for InitContext<'a> {
    fn next_electrical_identifier(&mut self) -> ElectricalElementIdentifier {
        self.electrical_identifier_provider
            .next_electrical_identifier()
    }

    fn next_electrical_identifier_for_bus(
        &mut self,
        bus_type: ElectricalBusType,
    ) -> ElectricalElementIdentifier {
        self.electrical_identifier_provider
            .next_electrical_identifier_for_bus(bus_type)
    }
}

/// An [`Aircraft`] that can be simulated by the [`Simulation`].
///
/// [`Aircraft`]: trait.Aircraft.html
/// [`Simulation`]: struct.Simulation.html
pub trait Aircraft: SimulationElement {
    fn update_before_power_distribution(
        &mut self,
        _context: &UpdateContext,
        _electricity: &mut Electricity,
    ) {
    }

    fn update_after_power_distribution(&mut self, _context: &UpdateContext) {}

    fn distribute_electricity(&mut self, context: &UpdateContext, electricity: &Electricity)
    where
        Self: Sized,
    {
        electricity.distribute_to(self, context);
    }

    fn consume_electricity(&mut self, context: &UpdateContext, electricity: &mut Electricity)
    where
        Self: Sized,
    {
        electricity.consume_in(context, self);
    }

    fn report_electricity_consumption(&mut self, context: &UpdateContext, electricity: &Electricity)
    where
        Self: Sized,
    {
        electricity.report_consumption_to(context, self);
    }
}

/// The [`Simulation`] runs across many different [`SimulationElement`]s.
/// This trait enables the [`Simulation`] to do various things with the element,
/// including reading simulator state into it and writing state from the element to the simulator.
/// Default (mostly empty) implementations are provided for all [`SimulationElement`] functions, meaning
/// you only have to implement those which apply to the given element.
///
/// [`Simulation`]: struct.Simulation.html
/// [`SimulationElement`]: trait.SimulationElement.html
pub trait SimulationElement {
    /// Accept a visitor which should visit the element and any children of the element which are
    /// themselves a [`SimulationElement`].
    ///
    /// # Examples
    /// The default implementation only visits the element itself.
    /// If the element contains fields pointing to other elements, you need to override
    /// the default implementation:
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor};
    /// # struct InnerElement {}
    /// # impl SimulationElement for InnerElement {}
    /// struct OuterElement {
    ///     inner_element: InnerElement,
    /// }
    /// impl SimulationElement for OuterElement {
    ///     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
    ///         self.inner_element.accept(visitor);
    ///
    ///         visitor.visit(self);
    ///     }
    /// }
    /// ```
    /// [`SimulationElement`]: trait.SimulationElement.html
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        visitor.visit(self);
    }

    /// Reads data representing the current state of the simulator into the aircraft system simulation.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// # SimulatorReader, SimulatorWriter, Read, VariableIdentifier};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         // The identifier would ordinarily be retrieved from the registry.
    ///         self.is_on = reader.read(&VariableIdentifier::default());
    ///     }
    /// }
    /// ```
    fn read(&mut self, _reader: &mut SimulatorReader) {}

    /// Writes data from the aircraft system simulation to a model which can be passed to the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// # SimulatorReader, SimulatorWriter, Write, VariableIdentifier};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        // The identifier would ordinarily be retrieved from the registry.
    ///        writer.write(&VariableIdentifier::default(), self.is_on);
    ///     }
    /// }
    /// ```
    /// [`Simulation`]: struct.Simulation.html
    fn write(&self, _writer: &mut SimulatorWriter) {}

    /// Receive power from the aircraft's electrical systems.
    /// The easiest way to deal with power consumption is using the [`PowerConsumer`] type.
    ///
    /// [`PowerConsumer`]: ../electrical/struct.PowerConsumer.html
    fn receive_power(&mut self, _buses: &impl ElectricalBuses) {}

    /// Consume power previously made available by  aircraft's electrical system.
    /// The easiest way to deal with power consumption is using the [`PowerConsumer`] type.
    ///
    /// [`PowerConsumer`]: ../electrical/struct.PowerConsumer.html
    fn consume_power<T: ConsumePower>(&mut self, _context: &UpdateContext, _power: &mut T) {}

    /// Consume power within converters, such as transformer rectifiers and the static
    /// inverter. This is a separate function, as their power consumption can only be
    /// determined after the consumption of elements to which they provide power is known.
    ///
    /// [`consume_power`]: fn.consume_power.html
    fn consume_power_in_converters<T: ConsumePower>(
        &mut self,
        _context: &UpdateContext,
        _power: &mut T,
    ) {
    }

    /// Process a report containing the power consumption per potential origin.
    /// This is useful for calculating the load percentage on a given generator,
    /// amperes provided by a given transformer rectifier and so on.
    fn process_power_consumption_report<T: PowerConsumptionReport>(
        &mut self,
        _context: &UpdateContext,
        _report: &T,
    ) where
        Self: Sized,
    {
    }

    /// Receives a failure in order to activate or deactivate it.
    fn receive_failure(&mut self, _failure_type: FailureType, _is_active: bool) {}
}

/// Trait for visitors that visit the aircraft's system simulation to call
/// a function on the [`SimulationElement`].
///
/// # Examples
/// ```rust
/// # use systems::simulation::{SimulationElement, SimulationElementVisitor, SimulatorReader};
/// struct SimulatorToSimulationVisitor<'a> {
///     reader: &'a mut SimulatorReader<'a>,
/// }
/// impl<'a> SimulatorToSimulationVisitor<'a> {
///     pub fn new(reader: &'a mut SimulatorReader<'a>) -> Self {
///         SimulatorToSimulationVisitor { reader }
///     }
/// }
/// impl SimulationElementVisitor for SimulatorToSimulationVisitor<'_> {
///     fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
///         visited.read(&mut self.reader);
///     }
/// }
/// ```
/// [`SimulationElement`]: trait.SimulationElement.html
pub trait SimulationElementVisitor {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T);
}

pub struct Simulation<T: Aircraft> {
    aircraft: T,
    electricity: Electricity,
    update_context: UpdateContext,
}
impl<T: Aircraft> Simulation<T> {
    pub fn new<U: FnOnce(&mut InitContext) -> T>(
        aircraft_ctor_fn: U,
        registry: &mut impl VariableRegistry,
    ) -> Self {
        let mut electricity = Electricity::new();
        let mut context = InitContext::new(&mut electricity, registry);
        let update_context = UpdateContext::new_for_simulation(&mut context);
        Self {
            aircraft: (aircraft_ctor_fn)(&mut context),
            electricity,
            update_context,
        }
    }

    /// Execute a single run of the simulation using the specified `delta` duration
    /// as the amount of time that has passed since the previous run.
    ///
    /// This orchestrates the:
    /// 1. Reading of data from the simulator into the aircraft state.
    /// 2. Updating of the aircraft state for each tick.
    /// 3. Writing of aircraft state data to the simulator.
    ///
    /// # Examples
    /// Basic usage is as follows:
    /// ```rust
    /// # use std::time::Duration;
    /// # use systems::simulation::{Aircraft, SimulationElement, SimulatorReaderWriter, Simulation,
    /// # UpdateContext, InitContext, VariableRegistry, VariableIdentifier};
    /// # struct MyAircraft {}
    /// # impl MyAircraft {
    /// #     fn new(_: &mut InitContext) -> Self {
    /// #         Self {}
    /// #     }
    /// # }
    /// # impl Aircraft for MyAircraft {}
    /// # impl SimulationElement for MyAircraft {}
    /// #
    /// # struct MySimulatorReaderWriter {}
    /// # impl MySimulatorReaderWriter {
    /// #     fn new() -> Self {
    /// #         Self {}
    /// #     }
    /// # }
    /// # impl SimulatorReaderWriter for MySimulatorReaderWriter {
    /// #     fn read(&mut self, identifier: &VariableIdentifier) -> f64 { 0.0 }
    /// #     fn write(&mut self, identifier: &VariableIdentifier, value: f64) { }
    /// # }
    /// # struct MyVariableRegistry {}
    /// # impl MyVariableRegistry {
    /// #     fn new() -> Self {
    /// #         Self {}
    /// #     }
    /// # }
    /// # impl VariableRegistry for MyVariableRegistry {
    /// #     fn get(&mut self, name: String) -> VariableIdentifier {
    /// #         Default::default()
    /// #     }
    /// # }
    /// let mut registry = MyVariableRegistry::new();
    /// let mut simulation = Simulation::new(MyAircraft::new, &mut registry);
    /// let mut reader_writer = MySimulatorReaderWriter::new();
    /// // For each frame, call the tick function.
    /// simulation.tick(Duration::from_millis(50), &mut reader_writer)
    /// ```
    /// [`tick`]: #method.tick
    pub fn tick(&mut self, delta: Duration, reader_writer: &mut impl SimulatorReaderWriter) {
        self.electricity.pre_tick();

        let mut reader = SimulatorReader::new(reader_writer);
        self.update_context.update(&mut reader, delta);

        let mut visitor = SimulatorToSimulationVisitor::new(&mut reader);
        self.aircraft.accept(&mut visitor);

        self.aircraft
            .update_before_power_distribution(&self.update_context, &mut self.electricity);

        self.aircraft
            .distribute_electricity(&self.update_context, &self.electricity);

        self.aircraft
            .update_after_power_distribution(&self.update_context);
        self.aircraft
            .consume_electricity(&self.update_context, &mut self.electricity);
        self.aircraft
            .report_electricity_consumption(&self.update_context, &self.electricity);

        let mut writer = SimulatorWriter::new(reader_writer);
        let mut visitor = SimulationToSimulatorVisitor::new(&mut writer);
        self.aircraft.accept(&mut visitor);
    }

    pub fn activate_failure(&mut self, failure_type: FailureType) {
        self.handle_failure(failure_type, true);
    }

    pub fn deactivate_failure(&mut self, failure_type: FailureType) {
        self.handle_failure(failure_type, false);
    }

    fn handle_failure(&mut self, failure_type: FailureType, is_active: bool) {
        self.aircraft
            .accept(&mut FailureSimulationElementVisitor::new(
                failure_type,
                is_active,
            ));
    }

    fn electricity(&self) -> &Electricity {
        &self.electricity
    }

    fn aircraft(&self) -> &T {
        &self.aircraft
    }

    fn aircraft_mut(&mut self) -> &mut T {
        &mut self.aircraft
    }

    fn accept<U: SimulationElementVisitor>(&mut self, visitor: &mut U)
    where
        Self: Sized,
    {
        self.aircraft.accept(visitor);
    }
}

struct FailureSimulationElementVisitor {
    failure_type: FailureType,
    is_active: bool,
}
impl FailureSimulationElementVisitor {
    fn new(failure_type: FailureType, is_active: bool) -> Self {
        Self {
            failure_type,
            is_active,
        }
    }
}
impl SimulationElementVisitor for FailureSimulationElementVisitor {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.receive_failure(self.failure_type, self.is_active);
    }
}

/// Visits aircraft components in order to pass data coming
/// from the simulator into the aircraft system simulation.
pub(crate) struct SimulatorToSimulationVisitor<'a> {
    reader: &'a mut SimulatorReader<'a>,
}
impl<'a> SimulatorToSimulationVisitor<'a> {
    pub fn new(reader: &'a mut SimulatorReader<'a>) -> Self {
        SimulatorToSimulationVisitor { reader }
    }
}
impl SimulationElementVisitor for SimulatorToSimulationVisitor<'_> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.read(&mut self.reader);
    }
}

/// Visits aircraft components in order to pass data from
/// the aircraft system simulation to the simulator.
struct SimulationToSimulatorVisitor<'a> {
    writer: &'a mut SimulatorWriter<'a>,
}
impl<'a> SimulationToSimulatorVisitor<'a> {
    pub fn new(writer: &'a mut SimulatorWriter<'a>) -> Self {
        SimulationToSimulatorVisitor { writer }
    }
}
impl<'a> SimulationElementVisitor for SimulationToSimulatorVisitor<'a> {
    fn visit<T: SimulationElement>(&mut self, visited: &mut T) {
        visited.write(&mut self.writer);
    }
}

pub trait Reader {
    fn read_f64(&mut self, identifier: &VariableIdentifier) -> f64;
}

/// Reads data from the simulator into the aircraft system simulation.
pub struct SimulatorReader<'a> {
    simulator_read_writer: &'a mut dyn SimulatorReaderWriter,
}
impl<'a> SimulatorReader<'a> {
    pub fn new(simulator_read_writer: &'a mut dyn SimulatorReaderWriter) -> Self {
        Self {
            simulator_read_writer,
        }
    }
}
impl<'a> Reader for SimulatorReader<'a> {
    fn read_f64(&mut self, identifier: &VariableIdentifier) -> f64 {
        self.simulator_read_writer.read(identifier)
    }
}

pub trait Writer {
    fn write_f64(&mut self, identifier: &VariableIdentifier, value: f64);
}

/// Writes data from the aircraft system simulation into the the simulator.
pub struct SimulatorWriter<'a> {
    simulator_read_writer: &'a mut dyn SimulatorReaderWriter,
}
impl<'a> SimulatorWriter<'a> {
    pub fn new(simulator_read_writer: &'a mut dyn SimulatorReaderWriter) -> Self {
        Self {
            simulator_read_writer,
        }
    }
}
impl<'a> Writer for SimulatorWriter<'a> {
    fn write_f64(&mut self, identifier: &VariableIdentifier, value: f64) {
        self.simulator_read_writer.write(identifier, value);
    }
}

/// Converts a given `bool` value into an `f64` representing that boolean value in the simulator.
fn from_bool(value: bool) -> f64 {
    if value {
        1.0
    } else {
        0.0
    }
}

pub trait Read<T: Copy> {
    /// Reads a value from the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// # SimulatorReader, SimulatorWriter, Read, VariableIdentifier};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         // The identifier would ordinarily be retrieved from the registry.
    ///         self.is_on = reader.read(&VariableIdentifier::default());
    ///     }
    /// }
    /// ```
    fn read(&mut self, identifier: &VariableIdentifier) -> T
    where
        Self: Sized + Reader,
    {
        let value = self.read_f64(identifier);
        self.convert(value)
    }

    /// Reads an ARINC 429 value from the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// # SimulatorReader, SimulatorWriter, Read, VariableIdentifier};
    /// # use systems::shared::arinc429::Arinc429Word;
    /// struct MySimulationElement {
    ///     is_on: Arinc429Word<bool>,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         // The identifier would ordinarily be retrieved from the registry.
    ///         self.is_on = reader.read_arinc429(&VariableIdentifier::default());
    ///     }
    /// }
    /// ```
    fn read_arinc429(&mut self, identifier: &VariableIdentifier) -> Arinc429Word<T>
    where
        Self: Sized + Reader,
    {
        let value = from_arinc429(self.read_f64(identifier));
        Arinc429Word::new(self.convert(value.0), value.1)
    }

    fn convert(&mut self, value: f64) -> T;
}

pub trait Write<T> {
    /// Write a value to the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// # SimulatorReader, SimulatorWriter, Write, VariableIdentifier};
    /// struct MySimulationElement {
    ///     n: f64,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        // The identifier would ordinarily be retrieved from the registry.
    ///        writer.write(&VariableIdentifier::default(), self.n);
    ///     }
    /// }
    /// ```
    fn write(&mut self, identifier: &VariableIdentifier, value: T)
    where
        Self: Sized + Writer,
    {
        let value = self.convert(value);
        self.write_f64(identifier, value)
    }

    /// Write an ARINC 429 value to the simulator.
    ///
    /// Note that the `f64` will be converted to a `f32` internally, thus reducing precision.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// # SimulatorReader, SimulatorWriter, Write, VariableIdentifier};
    /// # use systems::shared::arinc429::SignStatus;
    /// struct MySimulationElement {
    ///     n: f64,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        // The identifier would ordinarily be retrieved from the registry.
    ///        writer.write_arinc429(&VariableIdentifier::default(), self.n, SignStatus::NormalOperation);
    ///     }
    /// }
    /// ```
    fn write_arinc429(&mut self, identifier: &VariableIdentifier, value: T, ssm: SignStatus)
    where
        Self: Sized + Writer,
    {
        let value = self.convert(value);
        self.write_f64(identifier, to_arinc429(value, ssm));
    }

    fn convert(&mut self, value: T) -> f64;
}

macro_rules! read_write_uom {
    ($t: ty, $t2: ty) => {
        impl<T: Reader> Read<$t> for T {
            fn convert(&mut self, value: f64) -> $t {
                <$t>::new::<$t2>(value)
            }
        }

        impl<T: Writer> Write<$t> for T {
            fn convert(&mut self, value: $t) -> f64 {
                value.get::<$t2>()
            }
        }
    };
}

macro_rules! read_write_as {
    ($t: ty) => {
        impl<T: Reader> Read<$t> for T {
            fn convert(&mut self, value: f64) -> $t {
                value as $t
            }
        }

        impl<T: Writer> Write<$t> for T {
            fn convert(&mut self, value: $t) -> f64 {
                value as f64
            }
        }
    };
}

macro_rules! read_write_into {
    ($t: ty) => {
        impl<T: Reader> Read<$t> for T {
            fn convert(&mut self, value: f64) -> $t {
                value.into()
            }
        }

        impl<T: Writer> Write<$t> for T {
            fn convert(&mut self, value: $t) -> f64 {
                value.into()
            }
        }
    };
}

read_write_as!(i8);
read_write_as!(u8);
read_write_as!(i16);
read_write_as!(u16);
read_write_as!(i32);
read_write_as!(u32);
read_write_as!(i64);
read_write_as!(u64);
read_write_as!(i128);
read_write_as!(u128);
read_write_as!(usize);
read_write_as!(isize);
read_write_as!(f32);

read_write_uom!(Velocity, knot);
read_write_uom!(AngularVelocity, revolution_per_minute);
read_write_uom!(Length, foot);
read_write_uom!(Acceleration, foot_per_second_squared);
read_write_uom!(ThermodynamicTemperature, degree_celsius);
read_write_uom!(Ratio, percent);
read_write_uom!(ElectricPotential, volt);
read_write_uom!(ElectricCurrent, ampere);
read_write_uom!(Frequency, hertz);
read_write_uom!(Pressure, psi);
read_write_uom!(Volume, gallon);
read_write_uom!(VolumeRate, gallon_per_second);
read_write_uom!(Mass, pound);
read_write_uom!(Angle, degree);

read_write_into!(MachNumber);

impl<T: Reader> Read<f64> for T {
    fn convert(&mut self, value: f64) -> f64 {
        value
    }
}

impl<T: Writer> Write<f64> for T {
    fn convert(&mut self, value: f64) -> f64 {
        value
    }
}

impl<T: Reader> Read<bool> for T {
    fn convert(&mut self, value: f64) -> bool {
        to_bool(value)
    }
}

impl<T: Writer> Write<bool> for T {
    fn convert(&mut self, value: bool) -> f64 {
        from_bool(value)
    }
}

impl<T: Reader> Read<Duration> for T {
    fn convert(&mut self, value: f64) -> Duration {
        Duration::from_secs_f64(value)
    }
}

impl<T: Writer> Write<Duration> for T {
    fn convert(&mut self, value: Duration) -> f64 {
        value.as_secs_f64()
    }
}
