use std::time::Duration;

mod update_context;
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
    fn update(&mut self, context: &UpdateContext);
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

/// Runs the aircraft simulation every time [`tick`] is called.
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
/// # struct MyAircraft {}
/// # impl MyAircraft {
/// #     fn new() -> Self {
/// #         Self {}
/// #     }
/// # }
/// # impl Aircraft for MyAircraft {
/// #     fn update(&mut self, context: &UpdateContext) {}
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
/// // Create the Simulation only once.
/// let mut simulation = Simulation::new(MyAircraft::new(), MySimulatorReaderWriter::new());
/// // For each frame, call the tick function.
/// simulation.tick(Duration::from_millis(50));
/// ```
/// [`tick`]: #method.tick
pub struct Simulation<T: Aircraft, U: SimulatorReaderWriter> {
    aircraft: T,
    simulator_read_writer: U,
}
impl<T: Aircraft, U: SimulatorReaderWriter> Simulation<T, U> {
    pub fn new(aircraft: T, simulator_read_writer: U) -> Self {
        Simulation {
            aircraft,
            simulator_read_writer,
        }
    }

    /// Execute a single run of the simulation using the specified `delta` duration
    /// as the amount of time that has passed since the previous run.
    pub fn tick(&mut self, delta: Duration) {
        let mut reader = SimulatorReader::new(&mut self.simulator_read_writer);
        let context = UpdateContext::from_reader(&mut reader, delta);

        let mut visitor = SimulatorToSimulationVisitor::new(&mut reader);
        self.aircraft.accept(&mut visitor);

        self.aircraft.update(&context);

        let mut writer = SimulatorWriter::new(&mut self.simulator_read_writer);
        let mut visitor = SimulationToSimulatorVisitor::new(&mut writer);
        self.aircraft.accept(&mut visitor);
    }
}

/// Visits aircraft components in order to pass data coming
/// from the simulator into the aircraft system simulation.
struct SimulatorToSimulationVisitor<'a> {
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
