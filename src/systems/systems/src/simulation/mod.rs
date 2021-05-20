use std::time::Duration;

mod update_context;
pub use update_context::*;

pub mod test;

use crate::electrical::consumption::{
    ElectricPower, PowerConsumption, PowerConsumptionReport, SuppliedPower,
};

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
    fn update_before_power_distribution(&mut self, _context: &UpdateContext) {}
    fn update_after_power_distribution(&mut self, _context: &UpdateContext) {}
    fn get_supplied_power(&mut self) -> SuppliedPower {
        SuppliedPower::new()
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
    /// #    SimulatorReader, SimulatorWriter};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         self.is_on = reader.read_bool("MY_SIMULATOR_ELEMENT_IS_ON");
    ///     }
    /// }
    /// ```
    fn read(&mut self, _reader: &mut SimulatorReader) {}

    /// Writes data from the aircraft system simulation to a model which can be passed to the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        writer.write_bool("MY_SIMULATOR_ELEMENT_IS_ON", self.is_on);
    ///     }
    /// }
    /// ```
    /// [`Simulation`]: struct.Simulation.html
    fn write(&self, _writer: &mut SimulatorWriter) {}

    /// Receive power from the aircraft's electrical systems.
    /// The easiest way to deal with power consumption is using the [`PowerConsumer`] type.
    ///
    /// [`PowerConsumer`]: ../electrical/struct.PowerConsumer.html
    fn receive_power(&mut self, _supplied_power: &SuppliedPower) {}

    /// Consume power previously made available by  aircraft's electrical system.
    /// The easiest way to deal with power consumption is using the [`PowerConsumer`] type.
    ///
    /// [`PowerConsumer`]: ../electrical/struct.PowerConsumer.html
    fn consume_power(&mut self, _consumption: &mut PowerConsumption) {}

    /// Consume power within converters, such as transformer rectifiers and the static
    /// inverter. This is a separate function, as their power consumption can only be
    /// determined after the consumption of elements to which they provide power is known.
    ///
    /// [`consume_power`]: fn.consume_power.html
    fn consume_power_in_converters(&mut self, _consumption: &mut PowerConsumption) {}

    /// Process a report containing the power consumption per potential origin.
    /// This is useful for calculating the load percentage on a given generator,
    /// amperes provided by a given transformer rectifier and so on.
    fn process_power_consumption_report<T: PowerConsumptionReport>(&mut self, _report: &T)
    where
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

pub struct Simulation {}
impl Simulation {
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
    /// # use systems::simulation::{Aircraft, SimulationElement, SimulatorReaderWriter, Simulation, UpdateContext};
    /// # use systems::electrical::consumption::SuppliedPower;
    /// # struct MyAircraft {}
    /// # impl MyAircraft {
    /// #     fn new() -> Self {
    /// #         Self {}
    /// #     }
    /// # }
    /// # impl Aircraft for MyAircraft {
    /// #     fn update_before_power_distribution(&mut self, context: &UpdateContext) {}
    /// #     fn update_after_power_distribution(&mut self, context: &UpdateContext) {}
    /// #     fn get_supplied_power(&mut self) -> SuppliedPower { SuppliedPower::new() }
    /// # }
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
    /// let mut aircraft = MyAircraft::new();
    /// let mut reader_writer = MySimulatorReaderWriter::new();
    /// // For each frame, call the tick function.
    /// Simulation::tick(Duration::from_millis(50), &mut aircraft, &mut reader_writer);
    /// ```
    /// [`tick`]: #method.tick
    pub fn tick(
        delta: Duration,
        aircraft: &mut impl Aircraft,
        simulator_reader_writer: &mut impl SimulatorReaderWriter,
    ) {
        let mut reader = SimulatorReader::new(simulator_reader_writer);
        let context = UpdateContext::from_reader(&mut reader, delta);

        let mut visitor = SimulatorToSimulationVisitor::new(&mut reader);
        aircraft.accept(&mut visitor);

        aircraft.update_before_power_distribution(&context);

        let mut electric_power = ElectricPower::from(aircraft.get_supplied_power(), delta);
        electric_power.distribute_to(aircraft);

        aircraft.update_after_power_distribution(&context);

        electric_power.consume_in(aircraft);
        electric_power.report_consumption_to(aircraft);

        let mut writer = SimulatorWriter::new(simulator_reader_writer);
        let mut visitor = SimulationToSimulatorVisitor::new(&mut writer);
        aircraft.accept(&mut visitor);
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

    /// Reads an `f64` from the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter};
    /// struct MySimulationElement {
    ///     n: f64,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         self.n = reader.read_f64("MY_SIMULATOR_ELEMENT_IS_ON");
    ///     }
    /// }
    /// ```
    pub fn read_f64(&mut self, name: &str) -> f64 {
        self.simulator_read_writer.read(name)
    }

    /// Reads a `bool` from the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn read(&mut self, reader: &mut SimulatorReader) {
    ///         self.is_on = reader.read_bool("MY_SIMULATOR_ELEMENT_IS_ON");
    ///     }
    /// }
    /// ```
    pub fn read_bool(&mut self, name: &str) -> bool {
        to_bool(self.read_f64(name))
    }
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

    /// Write an `f64` to the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter};
    /// struct MySimulationElement {
    ///     n: f64,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        writer.write_f64("MY_SIMULATOR_ELEMENT_N", self.n);
    ///     }
    /// }
    /// ```
    pub fn write_f64(&mut self, name: &str, value: f64) {
        self.simulator_read_writer.write(name, value);
    }

    /// Write a `bool` to the simulator.
    /// # Examples
    /// ```rust
    /// # use systems::simulation::{SimulationElement, SimulationElementVisitor,
    /// #    SimulatorReader, SimulatorWriter};
    /// struct MySimulationElement {
    ///     is_on: bool,
    /// }
    /// impl SimulationElement for MySimulationElement {
    ///     fn write(&self, writer: &mut SimulatorWriter) {
    ///        writer.write_bool("MY_SIMULATOR_ELEMENT_IS_ON", self.is_on);
    ///     }
    /// }
    /// ```
    pub fn write_bool(&mut self, name: &str, value: bool) {
        self.simulator_read_writer.write(name, from_bool(value));
    }
}

/// Converts a given `f64` representing a boolean value in the simulator into an actual `bool` value.
fn to_bool(value: f64) -> bool {
    (value - 1.).abs() < f64::EPSILON
}

/// Converts a given `bool` value into an `f64` representing that boolean value in the simulator.
pub(crate) fn from_bool(value: bool) -> f64 {
    if value {
        1.0
    } else {
        0.0
    }
}
