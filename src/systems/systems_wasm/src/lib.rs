#![cfg(any(target_arch = "wasm32", doc))]
pub mod electrical;
pub mod failures;
use failures::Failures;
use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    sim_connect::{SimConnect, SimConnectRecv},
    MSFSEvent,
};
use std::{collections::HashMap, error::Error, pin::Pin, time::Duration};
use systems::simulation::{
    Aircraft, Simulation, SimulatorReaderWriter, VariableIdentifier, VariableRegistry,
};

/// An aspect to inject into events in the simulation.
pub trait SimulatorAspect {
    /// Attempts to read data with the given identifier.
    /// Returns `Some` when reading was successful, `None` otherwise.
    fn read(&mut self, _identifier: &VariableIdentifier) -> Option<f64> {
        None
    }

    /// Attempts to write the value with the given identifier.
    /// Returns true when the writing was successful and deemed sufficient,
    /// false otherwise.
    ///
    /// Note that there may be cases where multiple types write the same data.
    /// For such situations, after a successful write the function can return false.
    fn write(&mut self, _identifier: &VariableIdentifier, _value: f64) -> bool {
        false
    }

    /// Attempts to handle the given SimConnect message, returning true
    /// when the message was handled and false otherwise.
    fn handle_message(&mut self, _message: &SimConnectRecv) -> bool {
        false
    }

    /// Executes before a simulation tick runs.
    fn pre_tick(&mut self, _delta: Duration) {}

    /// Executes after a simulation tick ran.
    fn post_tick(&mut self, _sim_connect: &mut Pin<&mut SimConnect>) -> Result<(), Box<dyn Error>> {
        Ok(())
    }
}

/// Used to orchestrate the simulation combined with Microsoft Flight Simulator.
pub struct MsfsSimulationHandler {
    aspects: Vec<Box<dyn SimulatorAspect>>,
    failures: Failures,
}
impl MsfsSimulationHandler {
    pub fn new(aspects: Vec<Box<dyn SimulatorAspect>>, failures: Failures) -> Self {
        Self { aspects, failures }
    }

    pub fn handle<T: Aircraft>(
        &mut self,
        event: MSFSEvent,
        simulation: &mut Simulation<T>,
        sim_connect: &mut Pin<&mut SimConnect>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        match event {
            MSFSEvent::PreDraw(d) => {
                self.pre_tick(d.delta_time());
                self.read_failures_into(simulation);
                simulation.tick(d.delta_time(), self);
                self.post_tick(&mut sim_connect.as_mut())?;
            }
            MSFSEvent::SimConnect(message) => {
                self.handle_message(&message);
                ()
            }
            _ => {}
        }

        Ok(())
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        for aspect in self.aspects.iter_mut() {
            if aspect.handle_message(message) {
                return true;
            }
        }

        false
    }

    fn pre_tick(&mut self, delta: Duration) {
        self.aspects.iter_mut().for_each(|aspect| {
            aspect.pre_tick(delta);
        });
    }

    fn post_tick(
        &mut self,
        sim_connect: &mut Pin<&mut SimConnect>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        for aspect in self.aspects.iter_mut() {
            aspect.post_tick(sim_connect)?;
        }

        Ok(())
    }

    fn read_failures_into<T: Aircraft>(&mut self, simulation: &mut Simulation<T>) {
        if let Some(failure_type) = self.failures.read_failure_activate() {
            simulation.activate_failure(failure_type);
        }

        if let Some(failure_type) = self.failures.read_failure_deactivate() {
            simulation.deactivate_failure(failure_type);
        }
    }
}
impl SimulatorReaderWriter for MsfsSimulationHandler {
    fn read(&mut self, identifier: &VariableIdentifier) -> f64 {
        self.aspects
            .iter_mut()
            .find_map(|aspect| aspect.read(identifier))
            .unwrap_or(0.)
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) {
        for aspect in self.aspects.iter_mut() {
            if aspect.write(identifier, value) {
                break;
            }
        }
    }
}

pub struct MsfsVariableRegistry {
    name_to_identifier: HashMap<String, VariableIdentifier>,
    aircraft_variables: Vec<AircraftVariable>,
    named_variables: Vec<NamedVariable>,
    named_variable_prefix: String,
    next_aircraft_variable_identifier: VariableIdentifier,
    next_named_variable_identifier: VariableIdentifier,
}

impl MsfsVariableRegistry {
    const AIRCRAFT_VARIABLE_IDENTIFIER_TYPE: u8 = 0;
    const NAMED_VARIABLE_IDENTIFIER_TYPE: u8 = 1;

    pub fn new(named_variable_prefix: String) -> Self {
        Self {
            name_to_identifier: Default::default(),
            aircraft_variables: Default::default(),
            named_variables: Default::default(),
            named_variable_prefix,
            next_aircraft_variable_identifier: VariableIdentifier::new(
                Self::AIRCRAFT_VARIABLE_IDENTIFIER_TYPE,
            ),
            next_named_variable_identifier: VariableIdentifier::new(
                Self::NAMED_VARIABLE_IDENTIFIER_TYPE,
            ),
        }
    }

    /// Add an aircraft variable definition. Once added, the aircraft variable
    /// can be read through the `MsfsVariableRegistry.read` function.
    pub fn add_aircraft_variable(
        &mut self,
        name: &str,
        units: &str,
        index: usize,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.add_aircraft_variable_with_additional_names(name, units, index, &vec![])
    }

    /// Add an aircraft variable definition. Once added, the aircraft variable
    /// can be read through the `MsfsVariableRegistry.read` function.
    ///
    /// The additional names map to the same variable.
    pub fn add_aircraft_variable_with_additional_names(
        &mut self,
        name: &str,
        units: &str,
        index: usize,
        additional_names: &Vec<&str>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        match AircraftVariable::from(&name, units, index) {
            Ok(var) => {
                let name = if index > 0 {
                    format!("{}:{}", name, index)
                } else {
                    name.to_owned()
                };

                let identifier = self.next_aircraft_variable_identifier;

                self.aircraft_variables
                    .insert(identifier.identifier_index(), var);
                self.name_to_identifier.insert(name, identifier);

                additional_names.iter().for_each(|&el| {
                    self.name_to_identifier.insert(el.to_owned(), identifier);
                });

                self.next_aircraft_variable_identifier = identifier.next();

                Ok(())
            }
            Err(x) => Err(x),
        }
    }

    fn add_named_variable(&mut self, name: String) -> VariableIdentifier {
        let identifier = self.next_named_variable_identifier;
        self.named_variables.insert(
            identifier.identifier_index(),
            NamedVariable::from(&format!("{}{}", self.named_variable_prefix, name)),
        );
        self.name_to_identifier.insert(name, identifier);

        self.next_named_variable_identifier = identifier.next();

        identifier
    }
}

impl VariableRegistry for MsfsVariableRegistry {
    fn get(&mut self, name: String) -> VariableIdentifier {
        match self.name_to_identifier.get(&name) {
            Some(identifier) => *identifier,
            None => self.add_named_variable(name),
        }
    }
}

impl SimulatorAspect for MsfsVariableRegistry {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        match identifier.identifier_type() {
            Self::AIRCRAFT_VARIABLE_IDENTIFIER_TYPE => {
                Some(self.aircraft_variables[identifier.identifier_index()].get())
            }
            Self::NAMED_VARIABLE_IDENTIFIER_TYPE => {
                Some(self.named_variables[identifier.identifier_index()].get_value())
            }
            _ => None,
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        match identifier.identifier_type() {
            Self::NAMED_VARIABLE_IDENTIFIER_TYPE => {
                self.named_variables[identifier.identifier_index()].set_value(value);
                true
            }
            _ => false,
        }
    }
}

const MIN_32KPOS_VAL_FROM_SIMCONNECT: f64 = -16384.;
const MAX_32KPOS_VAL_FROM_SIMCONNECT: f64 = 16384.;
const RANGE_32KPOS_VAL_FROM_SIMCONNECT: f64 =
    MAX_32KPOS_VAL_FROM_SIMCONNECT - MIN_32KPOS_VAL_FROM_SIMCONNECT;
const OFFSET_32KPOS_VAL_FROM_SIMCONNECT: f64 = 16384.;
// Takes a 32k position type from simconnect, returns a value from scaled from 0 to 1
pub fn sim_connect_32k_pos_to_f64(sim_connect_axis_value: u32) -> f64 {
    let casted_value = (sim_connect_axis_value as i32) as f64;
    let scaled_value =
        (casted_value + OFFSET_32KPOS_VAL_FROM_SIMCONNECT) / RANGE_32KPOS_VAL_FROM_SIMCONNECT;

    scaled_value.min(1.).max(0.)
}
// Takes a [0:1] f64 and returns a simconnect 32k position type
pub fn f64_to_sim_connect_32k_pos(scaled_axis_value: f64) -> u32 {
    let back_to_position_format = ((scaled_axis_value) * RANGE_32KPOS_VAL_FROM_SIMCONNECT)
        - OFFSET_32KPOS_VAL_FROM_SIMCONNECT;
    let to_i32 = back_to_position_format as i32;
    let to_u32 = to_i32 as u32;

    to_u32
}

#[cfg(test)]
mod sim_connect_type_casts {
    use super::*;
    #[test]
    fn min_simconnect_value() {
        // We expect to get first element of YS1
        assert!(sim_connect_32k_pos_to_f64(u32::MAX - 16384) <= 0.001);
    }
    #[test]
    fn middle_simconnect_value() {
        // We expect to get first element of YS1
        let val = sim_connect_32k_pos_to_f64(0);
        assert!(val <= 0.501 && val >= 0.499);
    }

    #[test]
    fn max_simconnect_value() {
        // We expect to get first element of YS1
        assert!(sim_connect_32k_pos_to_f64(16384) >= 0.999);
    }
}
