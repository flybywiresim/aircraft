#![cfg(any(target_arch = "wasm32", doc))]
mod electrical;
mod failures;

use std::{collections::HashMap, error::Error, pin::Pin, time::Duration};

use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    sim_connect::{SimConnect, SimConnectRecv},
    MSFSEvent,
};

use systems::{
    failures::FailureType,
    simulation::{Aircraft, Simulation, SimulatorReaderWriter},
};

use electrical::{MsfsAuxiliaryPowerUnit, MsfsElectricalBuses};
use failures::Failures;

/// An aspect to inject into events in the simulation.
pub trait SimulatorAspect {
    /// Attempts to read data with the given name.
    /// Returns `Some` when reading was successful, `None` otherwise.
    fn read(&mut self, _name: &str) -> Option<f64> {
        None
    }

    /// Attempts to write the value with the given name.
    /// Returns true when the writing was successful and deemed sufficient,
    /// false otherwise.
    ///
    /// Note that there may be cases where multiple types write the same data.
    /// For such situations, after a successful write the function can return false.
    fn write(&mut self, _name: &str, _value: f64) -> bool {
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
    fn post_tick(&mut self, _sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        Ok(())
    }
}

pub trait MsfsAspectCtor {
    fn new(sim_connect: &mut SimConnect) -> Result<Self, Box<dyn std::error::Error>>
    where
        Self: Sized;
}

pub struct MsfsHandlerBuilder<'a, 'b> {
    key_prefix: String,
    electrical_buses: Option<MsfsElectricalBuses>,
    aircraft_variable_reader: Option<MsfsAircraftVariableReader>,
    sim_connect: Pin<&'a mut SimConnect<'b>>,
    apu: Option<MsfsAuxiliaryPowerUnit>,
    failures: Option<Failures>,
    additional_aspects: Vec<Box<dyn SimulatorAspect>>,
}

impl<'a, 'b> MsfsHandlerBuilder<'a, 'b> {
    const MSFS_INFINITELY_POWERED_BUS_IDENTIFIER: usize = 1;

    pub fn new(key_prefix: &str, sim_connect: Pin<&'a mut SimConnect<'b>>) -> Self {
        Self {
            key_prefix: key_prefix.to_owned(),
            electrical_buses: Some(Default::default()),
            aircraft_variable_reader: Some(Default::default()),
            sim_connect,
            apu: None,
            failures: None,
            additional_aspects: vec![],
        }
    }

    pub fn build(mut self) -> MsfsHandler {
        let mut aspects: Vec<Box<dyn SimulatorAspect>> =
            vec![Box::new(self.electrical_buses.unwrap())];
        if self.apu.is_some() {
            aspects.push(Box::new(self.apu.unwrap()));
        }

        aspects.append(&mut self.additional_aspects);
        aspects.push(Box::new(self.aircraft_variable_reader.unwrap()));
        aspects.push(Box::new(MsfsNamedVariableReaderWriter::new(
            &self.key_prefix,
        )));

        MsfsHandler::new(aspects, self.failures)
    }

    pub fn with<T: 'static + MsfsAspectCtor + SimulatorAspect>(
        mut self,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        self.additional_aspects
            .push(Box::new(T::new(self.sim_connect.as_mut().get_mut())?));

        Ok(self)
    }

    /// Adds the mapping between electrical buses within Rust code and the powering of a specific
    /// electrical bus defined within the systems.cfg `[ELECTRICAL]` section.
    ///
    /// This function assumes that `bus.1` is a bus which is infinitely powered, and thus can act
    /// as a power source for the other buses which will all be connected to it.
    pub fn with_electrical_buses(mut self, buses_to_add: Vec<(&'static str, usize)>) -> Self {
        if let Some(buses) = &mut self.electrical_buses {
            for bus in buses_to_add {
                buses.add(bus.0, Self::MSFS_INFINITELY_POWERED_BUS_IDENTIFIER, bus.1)
            }
        }

        self
    }

    pub fn with_auxiliary_power_unit(
        mut self,
        is_available_variable_name: &str,
        fuel_valve_number: u8,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        self.apu = Some(MsfsAuxiliaryPowerUnit::new(
            is_available_variable_name,
            fuel_valve_number,
        )?);

        Ok(self)
    }

    pub fn with_failures(mut self, failures: Vec<(u64, FailureType)>) -> Self {
        let mut f = Failures::new(
            NamedVariable::from(&format!("{}{}", &self.key_prefix, "FAILURE_ACTIVATE")),
            NamedVariable::from(&format!("{}{}", &self.key_prefix, "FAILURE_DEACTIVATE")),
        );
        for failure in failures {
            f.add(failure.0, failure.1);
        }

        self.failures = Some(f);

        self
    }

    pub fn provides_aircraft_variable(
        mut self,
        name: &str,
        units: &str,
        index: usize,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        if let Some(reader) = &mut self.aircraft_variable_reader {
            reader.add(name, units, index)?;
        }

        Ok(self)
    }

    pub fn provides_aircraft_variable_with_additional_names(
        mut self,
        name: &str,
        units: &str,
        index: usize,
        additional_names: Vec<&str>,
    ) -> Result<Self, Box<dyn std::error::Error>> {
        if let Some(reader) = &mut self.aircraft_variable_reader {
            reader.add_with_additional_names(name, units, index, Some(additional_names))?;
        }

        Ok(self)
    }
}

/// Used to orchestrate the simulation combined with Microsoft Flight Simulator.
pub struct MsfsHandler {
    aspects: Vec<Box<dyn SimulatorAspect>>,
    failures: Option<Failures>,
}
impl MsfsHandler {
    fn new(aspects: Vec<Box<dyn SimulatorAspect>>, failures: Option<Failures>) -> Self {
        Self { aspects, failures }
    }

    pub fn handle<'a, 'b, T: Aircraft>(
        &mut self,
        event: MSFSEvent,
        simulation: &mut Simulation<T>,
        sim_connect: Pin<&'a mut SimConnect<'b>>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        match event {
            MSFSEvent::PreDraw(d) => {
                self.pre_tick(d.delta_time());
                if let Some(failures) = &self.failures {
                    Self::read_failures_into_simulation(failures, simulation);
                }
                simulation.tick(d.delta_time(), self);
                self.post_tick(sim_connect.get_mut())?;
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
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn std::error::Error>> {
        for aspect in self.aspects.iter_mut() {
            aspect.post_tick(sim_connect)?;
        }

        Ok(())
    }

    fn read_failures_into_simulation<T: Aircraft>(
        failures: &Failures,
        simulation: &mut Simulation<T>,
    ) {
        if let Some(failure_type) = failures.read_failure_activate() {
            simulation.activate_failure(failure_type);
        }

        if let Some(failure_type) = failures.read_failure_deactivate() {
            simulation.deactivate_failure(failure_type);
        }
    }
}
impl SimulatorReaderWriter for MsfsHandler {
    fn read(&mut self, name: &str) -> f64 {
        self.aspects
            .iter_mut()
            .find_map(|aspect| aspect.read(name))
            .unwrap_or(0.)
    }

    fn write(&mut self, name: &str, value: f64) {
        for aspect in self.aspects.iter_mut() {
            if aspect.write(name, value) {
                break;
            }
        }
    }
}

/// Reads and writes named variables (LVar).
pub struct MsfsNamedVariableReaderWriter {
    name_prefix: String,
    variables: HashMap<String, NamedVariable>,
}
impl MsfsNamedVariableReaderWriter {
    pub fn new(key_prefix: &str) -> Self {
        Self {
            name_prefix: key_prefix.to_owned(),
            variables: HashMap::<String, NamedVariable>::new(),
        }
    }

    fn lookup_named_variable(&mut self, name: &str) -> &mut NamedVariable {
        let name = format!("{}{}", self.name_prefix, name);

        self.variables
            .entry(name.clone())
            .or_insert_with(|| NamedVariable::from(&name))
    }
}
impl SimulatorAspect for MsfsNamedVariableReaderWriter {
    fn read(&mut self, name: &str) -> Option<f64> {
        Some(self.lookup_named_variable(name).get_value())
    }

    fn write(&mut self, name: &str, value: f64) -> bool {
        self.lookup_named_variable(name).set_value(value);

        true
    }
}

/// Reads aircraft variables (AVar).
#[derive(Default)]
pub struct MsfsAircraftVariableReader {
    variables: HashMap<String, AircraftVariable>,
    mapping: HashMap<String, String>,
}
impl MsfsAircraftVariableReader {
    /// Add an aircraft variable definition. Once added, the aircraft variable
    /// can be read through the [`read`] function.
    ///
    /// Indexed variables are read by suffixing the index, for the example variable `"TURB ENG CORRECTED N2"`:
    /// - When index `0` is passed, the variable can be read as: `"TURB ENG CORRECTED N2"`.
    /// - When index `n` is passed, the variable can be read as: `"TURB ENG CORRECTED N2:n"`.
    ///
    /// [`read`]: trait.ReadWrite.html#method.read
    pub fn add(
        &mut self,
        name: &str,
        units: &str,
        index: usize,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.add_with_additional_names(name, units, index, None)
    }

    /// Add an aircraft variable definition. Once added, the aircraft variable
    /// can be read through the [`read`] function.
    ///
    /// Indexed variables are read by suffixing the index, for the example variable `"TURB ENG CORRECTED N2"`:
    /// - When index `0` is passed, the variable can be read as: `"TURB ENG CORRECTED N2"`.
    /// - When index `n` is passed, the variable can be read as: `"TURB ENG CORRECTED N2:n"`.
    ///
    /// When reading a variable, the additional names are mapped to the underlying variable.
    /// Thus, when `"EXTERNAL POWER AVAILABLE"` is the underlying variable and you pass
    /// `"OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"` as an additional name, the variable can be accessed
    /// via `"EXTERNAL POWER AVAILABLE"` and `"OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"`.
    ///
    /// [`read`]: trait.ReadWrite.html#method.read
    pub fn add_with_additional_names(
        &mut self,
        name: &str,
        units: &str,
        index: usize,
        additional_names: Option<Vec<&str>>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        match AircraftVariable::from(&name, units, index) {
            Ok(var) => {
                let name = if index > 0 {
                    format!("{}:{}", name, index)
                } else {
                    name.to_owned()
                };

                if let Some(additional_names) = additional_names {
                    additional_names.iter().for_each(|&el| {
                        self.mapping.insert(el.to_owned(), name.clone());
                    });
                }

                self.variables.insert(name, var);
                Ok(())
            }
            Err(x) => Err(x),
        }
    }
}
impl SimulatorAspect for MsfsAircraftVariableReader {
    fn read(&mut self, name: &str) -> Option<f64> {
        let name = match self.mapping.get(name) {
            Some(x) => x,
            None => name,
        };

        match self.variables.get(name) {
            Some(variable) => Some(variable.get()),
            None => None,
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
