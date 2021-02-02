//! Provides all the necessary types for integrating the
//! crate into a Microsoft Flight Simulator aircraft.
use std::time::Duration;
use uom::si::f64::*;

mod update_context;
#[cfg(test)]
pub use update_context::test_helpers;
pub use update_context::UpdateContext;

/// Trait for reading data from and writing data to the simulator.
pub trait SimulatorReadWriter {
    /// Reads data from the simulator into a model representing that state.
    fn read(&self) -> SimulatorReadState;
    /// Writes data from a model into the simulator.
    fn write(&self, state: &SimulatorWriteState);
}

pub trait Aircraft: SimulatorVisitable {
    fn update(&mut self, context: &UpdateContext);
}

/// Orchestrates the:
/// 1. Reading of data from the simulator into the aircraft state.
/// 2. Updating of the aircraft state for each tick.
/// 3. Writing of aircraft state data to the simulator.
pub struct Simulation<T: Aircraft, U: SimulatorReadWriter> {
    aircraft: T,
    simulator_read_writer: U,
}
impl<T: Aircraft, U: SimulatorReadWriter> Simulation<T, U> {
    pub fn new(aircraft: T, simulator_read_writer: U) -> Self {
        Simulation {
            aircraft,
            simulator_read_writer,
        }
    }

    pub fn tick(&mut self, delta: Duration) {
        let state = self.simulator_read_writer.read();
        let mut visitor = SimulatorToModelVisitor::new(&state);
        self.aircraft.accept(&mut Box::new(&mut visitor));

        self.aircraft.update(&state.to_context(delta));

        let mut visitor = ModelToSimulatorVisitor::new();
        self.aircraft.accept(&mut Box::new(&mut visitor));

        self.simulator_read_writer.write(&visitor.get_state());
    }
}

/// Visits aircraft components in order to pass data coming
/// from the simulator into the aircraft system simulation.
struct SimulatorToModelVisitor<'a> {
    state: &'a SimulatorReadState,
}
impl<'a> SimulatorToModelVisitor<'a> {
    pub fn new(state: &'a SimulatorReadState) -> Self {
        SimulatorToModelVisitor { state }
    }
}
impl SimulatorVisitor for SimulatorToModelVisitor<'_> {
    fn visit(&mut self, visited: &mut Box<&mut dyn SimulatorReadWritable>) {
        visited.read(&self.state);
    }
}

/// Visits aircraft components in order to pass data from
/// the aircraft system simulation to the simulator.
struct ModelToSimulatorVisitor {
    state: SimulatorWriteState,
}
impl ModelToSimulatorVisitor {
    pub fn new() -> Self {
        ModelToSimulatorVisitor {
            state: Default::default(),
        }
    }

    pub fn get_state(self) -> SimulatorWriteState {
        self.state
    }
}
impl SimulatorVisitor for ModelToSimulatorVisitor {
    fn visit(&mut self, visited: &mut Box<&mut dyn SimulatorReadWritable>) {
        visited.write(&mut self.state);
    }
}

/// Converts a given `f64` representing a boolean value in the simulator into an actual `bool` value.
pub fn to_bool(value: f64) -> bool {
    (value - 1.).abs() < f64::EPSILON
}

/// Converts a given `bool` value into an `f64` representing that boolean value in the simulator.
pub fn from_bool(value: bool) -> f64 {
    if value {
        1.0
    } else {
        0.0
    }
}

/// Trait for making a piece of the aircraft system simulation read from and/or write to simulator data.
pub trait SimulatorReadWritable {
    /// Reads data representing the current state of the simulator into the aircraft system simulation.
    fn read(&mut self, _state: &SimulatorReadState) {}

    /// Writes data from the aircraft system simulation to a model which can be passed to the simulator.
    fn write(&self, _state: &mut SimulatorWriteState) {}
}

/// Trait for making a piece of the aircraft system simulation visitable
/// for the purpose of reading and writing simulator data.
pub trait SimulatorVisitable {
    fn accept(&mut self, visitor: &mut Box<&mut dyn SimulatorVisitor>);
}

/// Trait for visitors that visit the aircraft's system simulation
/// for the purpose of reading and writing simulator data.
pub trait SimulatorVisitor {
    fn visit(&mut self, visited: &mut Box<&mut dyn SimulatorReadWritable>);
}

/// The data which is read from the simulator and can
/// be passed into the aircraft system simulation.
#[derive(Default)]
pub struct SimulatorReadState {
    pub ambient_temperature: ThermodynamicTemperature,
    pub apu_bleed_sw_on: bool,
    pub apu_fire_button_released: bool,
    pub apu_gen_sw_on: bool,
    pub apu_master_sw_on: bool,
    pub apu_start_sw_on: bool,
    pub external_power_available: bool,
    pub external_power_sw_on: bool,
    pub indicated_airspeed: Velocity,
    pub indicated_altitude: Length,
    pub left_inner_tank_fuel_quantity: Mass,
    pub unlimited_fuel: bool,
}
impl SimulatorReadState {
    /// Creates a context based on the data that was read from the simulator.
    pub fn to_context(&self, delta_time: Duration) -> UpdateContext {
        UpdateContext {
            ambient_temperature: self.ambient_temperature,
            indicated_airspeed: self.indicated_airspeed,
            indicated_altitude: self.indicated_altitude,
            delta: delta_time,
        }
    }
}

/// The data which is written from the aircraft system simulation
/// into the the simulator.
#[derive(Default)]
pub struct SimulatorWriteState {
    pub apu_air_intake_flap_is_ecam_open: bool,
    pub apu_air_intake_flap_opened_for: Ratio,
    pub apu_bleed_air_valve_open: bool,
    pub apu_bleed_fault: bool,
    pub apu_caution_egt: ThermodynamicTemperature,
    pub apu_egt: ThermodynamicTemperature,
    pub apu_gen_current: ElectricCurrent,
    pub apu_gen_frequency: Frequency,
    pub apu_gen_frequency_within_normal_range: bool,
    pub apu_gen_potential: ElectricPotential,
    pub apu_gen_potential_within_normal_range: bool,
    pub apu_inoperable: bool,
    pub apu_is_auto_shutdown: bool,
    pub apu_is_emergency_shutdown: bool,
    pub apu_low_fuel_pressure_fault: bool,
    pub apu_master_sw_fault: bool,
    pub apu_n: Ratio,
    pub apu_start_contactor_energized: bool,
    pub apu_start_sw_available: bool,
    pub apu_start_sw_on: bool,
    pub apu_warning_egt: ThermodynamicTemperature,
}
