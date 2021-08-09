use std::time::Duration;

mod update_context;
use crate::{
    electrical::Electricity,
    shared::{
        arinc429::{from_arinc429, to_arinc429, Arinc429Word, SignStatus},
        to_bool, ConsumePower, ElectricalBuses, MachNumber, PowerConsumptionReport,
    },
};
use uom::si::{
    acceleration::foot_per_second_squared,
    angle::degree,
    electric_current::ampere,
    electric_potential::volt,
    f64::*,
    frequency::hertz,
    length::foot,
    mass::pound,
    pressure::psi,
    ratio::percent,
    thermodynamic_temperature::{degree_celsius, kelvin},
    velocity::knot,
    volume::gallon,
    volume_rate::gallon_per_second,
};
pub use update_context::*;
pub mod test;

/// Trait for a type which can read and write simulator data.
/// Using this trait implementors can abstract away the way the code
/// interacts with the simulator. This separation of concerns is very important
/// for keeping the majority of the code unit testable.
pub trait SimulatorReaderWriter {
    /// Reads a variable with the given name from the simulator.
    fn read(&mut self, name: &str) -> f64;
    /// Writes a variable with the given name to the simulator.
    fn write(&mut self, name: &str, value: f64);
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
    /// #    SimulatorReader, SimulatorWriter, Read};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         self.is_on = reader.read("MY_SIMULATOR_ELEMENT_IS_ON");
    ///     }
    /// }
    /// ```
    fn read(&mut self, _reader: &mut SimulatorReader) {}

    /// Writes data from the aircraft system simulation to a model which can be passed to the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter, Write};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        writer.write("MY_SIMULATOR_ELEMENT_IS_ON", self.is_on);
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
}
impl<T: Aircraft> Simulation<T> {
    pub fn new<U: FnOnce(&mut Electricity) -> T>(aircraft_ctor_fn: U) -> Self {
        let mut electricity = Electricity::new();
        Self {
            aircraft: (aircraft_ctor_fn)(&mut electricity),
            electricity,
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
    /// # use systems::electrical::Electricity;
    /// # use systems::simulation::{Aircraft, SimulationElement, SimulatorReaderWriter, Simulation, UpdateContext};
    /// # struct MyAircraft {}
    /// # impl MyAircraft {
    /// #     fn new(_: &mut Electricity) -> Self {
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
    /// #     fn read(&mut self, name: &str) -> f64 { 0.0 }
    /// #     fn write(&mut self, name: &str, value: f64) { }
    /// # }
    /// let mut simulation = Simulation::new(|electricity| MyAircraft::new(electricity));
    /// let mut reader_writer = MySimulatorReaderWriter::new();
    /// // For each frame, call the tick function.
    /// simulation.tick(Duration::from_millis(50), &mut reader_writer)
    /// ```
    /// [`tick`]: #method.tick
    pub fn tick(
        &mut self,
        delta: Duration,
        simulator_reader_writer: &mut impl SimulatorReaderWriter,
    ) {
        self.electricity.pre_tick();

        let mut reader = SimulatorReader::new(simulator_reader_writer);
        let context = UpdateContext::from_reader(&mut reader, delta);

        let mut visitor = SimulatorToSimulationVisitor::new(&mut reader);
        self.aircraft.accept(&mut visitor);

        self.aircraft
            .update_before_power_distribution(&context, &mut self.electricity);

        self.aircraft
            .distribute_electricity(&context, &self.electricity);

        self.aircraft.update_after_power_distribution(&context);
        self.aircraft
            .consume_electricity(&context, &mut self.electricity);
        self.aircraft
            .report_electricity_consumption(&context, &self.electricity);

        let mut writer = SimulatorWriter::new(simulator_reader_writer);
        let mut visitor = SimulationToSimulatorVisitor::new(&mut writer);
        self.aircraft.accept(&mut visitor);
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
    fn read_f64(&mut self, name: &str) -> f64;
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
    fn read_f64(&mut self, name: &str) -> f64 {
        self.simulator_read_writer.read(name)
    }
}

pub trait Writer {
    fn write_f64(&mut self, name: &str, value: f64);
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
    fn write_f64(&mut self, name: &str, value: f64) {
        self.simulator_read_writer.write(name, value);
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
    /// #    SimulatorReader, SimulatorWriter, Read};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         self.is_on = reader.read("MY_SIMULATOR_ELEMENT_IS_ON");
    ///     }
    /// }
    /// ```
    fn read(&mut self, name: &str) -> T
    where
        Self: Sized + Reader,
    {
        let value = self.read_f64(name);
        self.convert(value)
    }

    fn read_arinc429(&mut self, name: &str) -> Arinc429Word<T>
    where
        Self: Sized + Reader,
    {
        let value = from_arinc429(self.read_f64(name));
        Arinc429Word::new(self.convert(value.0), value.1)
    }

    fn convert(&mut self, value: f64) -> T;
}

pub trait Write<T> {
    /// Write a value to the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter, Write};
    /// struct MySimulationElement {
    ///     n: f64,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        writer.write("MY_SIMULATOR_ELEMENT_N", self.n);
    ///     }
    /// }
    /// ```
    fn write(&mut self, name: &str, value: T)
    where
        Self: Sized + Writer,
    {
        let value = self.convert(value);
        self.write_f64(name, value)
    }

    fn write_arinc429(&mut self, name: &str, value: T, ssm: SignStatus)
    where
        Self: Sized + Writer,
    {
        let value = self.convert(value);
        self.write_f64(name, to_arinc429(value, ssm));
    }

    fn convert(&mut self, value: T) -> f64;
}

pub trait WriteWhen<T> {
    /// Write a value to the simulator when the given condition is true,
    /// otherwise write a value which indicates the lack of a value.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter, WriteWhen};
    /// # use uom::si::f64::*;
    /// struct MySimulationElement {
    ///     is_powered: bool,
    ///     egt: ThermodynamicTemperature,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        writer.write_when(self.is_powered, "MY_SIMULATOR_ELEMENT_EGT", self.egt);
    ///     }
    /// }
    /// ```
    fn write_when(&mut self, condition: bool, name: &str, value: T);
}

impl<T: Reader> Read<Velocity> for T {
    fn convert(&mut self, value: f64) -> Velocity {
        Velocity::new::<knot>(value)
    }
}

impl<T: Writer> Write<Velocity> for T {
    fn convert(&mut self, value: Velocity) -> f64 {
        value.get::<knot>()
    }
}

impl<T: Reader> Read<Length> for T {
    fn convert(&mut self, value: f64) -> Length {
        Length::new::<foot>(value)
    }
}

impl<T: Writer> Write<Length> for T {
    fn convert(&mut self, value: Length) -> f64 {
        // Length is tricky, as we might have usage of nautical mile
        // or other units later. We'll have to work around that problem
        // when we get there.
        value.get::<foot>()
    }
}

impl<T: Reader> Read<Acceleration> for T {
    fn convert(&mut self, value: f64) -> Acceleration {
        Acceleration::new::<foot_per_second_squared>(value)
    }
}

impl<T: Reader> Read<ThermodynamicTemperature> for T {
    fn convert(&mut self, value: f64) -> ThermodynamicTemperature {
        ThermodynamicTemperature::new::<degree_celsius>(value)
    }
}

impl<T: Writer> Write<ThermodynamicTemperature> for T {
    fn convert(&mut self, value: ThermodynamicTemperature) -> f64 {
        value.get::<degree_celsius>()
    }
}

impl<T: Writer> WriteWhen<ThermodynamicTemperature> for T {
    fn write_when(&mut self, condition: bool, name: &str, value: ThermodynamicTemperature) {
        self.write_f64(
            name,
            if condition {
                value.get::<degree_celsius>()
            } else {
                ThermodynamicTemperature::new::<kelvin>(0.).get::<degree_celsius>() - 1.
            },
        );
    }
}

impl<T: Reader> Read<Ratio> for T {
    fn convert(&mut self, value: f64) -> Ratio {
        Ratio::new::<percent>(value)
    }
}

impl<T: Writer> Write<Ratio> for T {
    fn convert(&mut self, value: Ratio) -> f64 {
        value.get::<percent>()
    }
}

impl<T: Writer> WriteWhen<Ratio> for T {
    fn write_when(&mut self, condition: bool, name: &str, value: Ratio) {
        self.write_f64(
            name,
            if condition {
                value.get::<percent>()
            } else {
                -1.
            },
        );
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

impl<T: Writer> WriteWhen<bool> for T {
    fn write_when(&mut self, condition: bool, name: &str, value: bool) {
        self.write_f64(name, if condition { from_bool(value) } else { -1. });
    }
}

impl<T: Writer> Write<usize> for T {
    fn convert(&mut self, value: usize) -> f64 {
        value as f64
    }
}

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

impl<T: Reader> Read<ElectricPotential> for T {
    fn convert(&mut self, value: f64) -> ElectricPotential {
        ElectricPotential::new::<volt>(value)
    }
}

impl<T: Writer> Write<ElectricPotential> for T {
    fn convert(&mut self, value: ElectricPotential) -> f64 {
        value.get::<volt>()
    }
}

impl<T: Reader> Read<ElectricCurrent> for T {
    fn convert(&mut self, value: f64) -> ElectricCurrent {
        ElectricCurrent::new::<ampere>(value)
    }
}

impl<T: Writer> Write<ElectricCurrent> for T {
    fn convert(&mut self, value: ElectricCurrent) -> f64 {
        value.get::<ampere>()
    }
}

impl<T: Reader> Read<Frequency> for T {
    fn convert(&mut self, value: f64) -> Frequency {
        Frequency::new::<hertz>(value)
    }
}

impl<T: Writer> Write<Frequency> for T {
    fn convert(&mut self, value: Frequency) -> f64 {
        value.get::<hertz>()
    }
}

impl<T: Reader> Read<Pressure> for T {
    fn convert(&mut self, value: f64) -> Pressure {
        Pressure::new::<psi>(value)
    }
}

impl<T: Writer> Write<Pressure> for T {
    fn convert(&mut self, value: Pressure) -> f64 {
        value.get::<psi>()
    }
}

impl<T: Reader> Read<Volume> for T {
    fn convert(&mut self, value: f64) -> Volume {
        Volume::new::<gallon>(value)
    }
}

impl<T: Writer> Write<Volume> for T {
    fn convert(&mut self, value: Volume) -> f64 {
        value.get::<gallon>()
    }
}

impl<T: Writer> Write<VolumeRate> for T {
    fn convert(&mut self, value: VolumeRate) -> f64 {
        value.get::<gallon_per_second>()
    }
}

impl<T: Reader> Read<Mass> for T {
    fn convert(&mut self, value: f64) -> Mass {
        Mass::new::<pound>(value)
    }
}

impl<T: Reader> Read<Angle> for T {
    fn convert(&mut self, value: f64) -> Angle {
        Angle::new::<degree>(value)
    }
}

impl<T: Writer> Write<Angle> for T {
    fn convert(&mut self, value: Angle) -> f64 {
        value.get::<degree>()
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

impl<T: Reader> Read<MachNumber> for T {
    fn convert(&mut self, value: f64) -> MachNumber {
        MachNumber(value)
    }
}

impl<T: Writer> Write<MachNumber> for T {
    fn convert(&mut self, value: MachNumber) -> f64 {
        value.0
    }
}
