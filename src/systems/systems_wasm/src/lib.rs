//#![cfg(any(target_arch = "wasm32", doc))]
#[macro_use]
pub mod aspects;
mod electrical;
mod failures;

use std::{error::Error, time::Duration};

use fxhash::FxHashMap;
use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    sim_connect::{data_definition, Period, SimConnect, SimConnectRecv, SIMCONNECT_OBJECT_ID_USER},
    MSFSEvent,
};

use systems::{
    failures::FailureType,
    simulation::{
        Aircraft, Simulation, SimulatorReaderWriter, VariableIdentifier, VariableRegistry,
    },
};

use crate::aspects::MsfsAspectBuilder;
use electrical::{MsfsAuxiliaryPowerUnit, MsfsElectricalBuses};
use failures::Failures;
use systems::simulation::InitContext;

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
    fn pre_tick(
        &mut self,
        _sim_connect: &mut SimConnect,
        _delta: Duration,
    ) -> Result<(), Box<dyn Error>> {
        Ok(())
    }

    /// Executes after a simulation tick ran.
    fn post_tick(&mut self, _sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        Ok(())
    }
}

pub trait MsfsAspectCtor {
    fn new(
        registry: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>>
    where
        Self: Sized;
}

pub struct MsfsSimulationBuilder<'a, 'b> {
    variable_registry: Option<MsfsVariableRegistry>,
    key_prefix: String,
    electrical_buses: Option<MsfsElectricalBuses>,
    sim_connect: &'a mut SimConnect<'b>,
    apu: Option<MsfsAuxiliaryPowerUnit>,
    failures: Option<Failures>,
    additional_aspects: Vec<Box<dyn SimulatorAspect>>,
}

impl<'a, 'b> MsfsSimulationBuilder<'a, 'b> {
    const MSFS_INFINITELY_POWERED_BUS_IDENTIFIER: usize = 1;

    pub fn new(key_prefix: String, sim_connect: &'a mut SimConnect<'b>) -> Self {
        Self {
            variable_registry: Some(MsfsVariableRegistry::new(key_prefix.clone())),
            key_prefix,
            electrical_buses: Some(Default::default()),
            sim_connect,
            apu: None,
            failures: None,
            additional_aspects: vec![],
        }
    }

    pub fn build<T: Aircraft, U: FnOnce(&mut InitContext) -> T>(
        mut self,
        aircraft_ctor_fn: U,
    ) -> Result<(Simulation<T>, MsfsHandler), Box<dyn Error>> {
        let mut aspects: Vec<Box<dyn SimulatorAspect>> =
            vec![Box::new(self.electrical_buses.unwrap())];
        if self.apu.is_some() {
            aspects.push(Box::new(self.apu.unwrap()));
        }

        aspects.append(&mut self.additional_aspects);

        let mut registry = self.variable_registry.unwrap();
        let simulation = Simulation::new(aircraft_ctor_fn, &mut registry);
        aspects.push(Box::new(registry));

        Ok((
            simulation,
            MsfsHandler::new(aspects, self.failures, self.sim_connect)?,
        ))
    }

    pub fn with<T: 'static + MsfsAspectCtor + SimulatorAspect>(
        mut self,
    ) -> Result<Self, Box<dyn Error>> {
        if let Some(registry) = &mut self.variable_registry {
            self.additional_aspects
                .push(Box::new(T::new(registry, self.sim_connect)?));
        }

        Ok(self)
    }

    pub fn with_aspect<T: FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>>>(
        mut self,
        builder_func: T,
    ) -> Result<Self, Box<dyn Error>> {
        let variable_registry = &mut self.variable_registry.as_mut().unwrap();
        let mut builder = MsfsAspectBuilder::new(
            self.key_prefix.to_owned(),
            &mut self.sim_connect,
            variable_registry,
        );
        (builder_func)(&mut builder)?;
        self.additional_aspects.push(Box::new(builder.build()));

        Ok(self)
    }

    /// Adds the mapping between electrical buses within Rust code and the powering of a specific
    /// electrical bus defined within the systems.cfg `[ELECTRICAL]` section.
    ///
    /// This function assumes that `bus.1` is a bus which is infinitely powered, and thus can act
    /// as a power source for the other buses which will all be connected to it.
    pub fn with_electrical_buses(mut self, buses_to_add: Vec<(&'static str, usize)>) -> Self {
        if let Some(registry) = &mut self.variable_registry {
            if let Some(buses) = &mut self.electrical_buses {
                for bus in buses_to_add {
                    buses.add(
                        registry,
                        bus.0,
                        Self::MSFS_INFINITELY_POWERED_BUS_IDENTIFIER,
                        bus.1,
                    )
                }
            }
        }

        self
    }

    pub fn with_auxiliary_power_unit(
        mut self,
        is_available_variable_name: String,
        fuel_valve_number: u8,
    ) -> Result<Self, Box<dyn Error>> {
        if let Some(registry) = &mut self.variable_registry {
            self.apu = Some(MsfsAuxiliaryPowerUnit::new(
                registry,
                is_available_variable_name,
                fuel_valve_number,
            )?);
        }

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
    ) -> Result<Self, Box<dyn Error>> {
        if let Some(registry) = &mut self.variable_registry {
            registry.add_aircraft_variable(name, units, index)?;
        }

        Ok(self)
    }

    pub fn provides_aircraft_variable_with_options(
        mut self,
        name: &str,
        units: &str,
        index: usize,
        options: AircraftVariableOptions,
    ) -> Result<Self, Box<dyn Error>> {
        if let Some(registry) = &mut self.variable_registry {
            registry.add_aircraft_variable_with_options(name, units, index, options)?;
        }

        Ok(self)
    }
}

/// Used to orchestrate the simulation combined with Microsoft Flight Simulator.
pub struct MsfsHandler {
    aspects: Vec<Box<dyn SimulatorAspect>>,
    failures: Option<Failures>,
    time: Time,
}
impl MsfsHandler {
    fn new(
        aspects: Vec<Box<dyn SimulatorAspect>>,
        failures: Option<Failures>,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            aspects,
            failures,
            time: Time::new(sim_connect)?,
        })
    }

    pub fn handle<T: Aircraft>(
        &mut self,
        event: MSFSEvent,
        simulation: &mut Simulation<T>,
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        match event {
            MSFSEvent::PreDraw(_) => {
                if !self.time.is_pausing() {
                    let delta_time = self.time.take();
                    self.pre_tick(sim_connect, delta_time)?;
                    if let Some(failures) = &self.failures {
                        Self::read_failures_into_simulation(failures, simulation);
                    }
                    simulation.tick(delta_time, self);
                    self.post_tick(sim_connect)?;
                }
            }
            MSFSEvent::SimConnect(message) => match message {
                SimConnectRecv::SimObjectData(data) if data.id() == SimulationTime::REQUEST_ID => {
                    self.time
                        .increment(data.into::<SimulationTime>(sim_connect).unwrap());
                }
                _ => {
                    self.handle_message(&message);
                }
            },
            _ => {}
        }

        Ok(())
    }

    fn handle_message(&mut self, message: &SimConnectRecv) {
        for aspect in self.aspects.iter_mut() {
            if aspect.handle_message(message) {
                break;
            }
        }
    }

    fn pre_tick(
        &mut self,
        sim_connect: &mut SimConnect,
        delta: Duration,
    ) -> Result<(), Box<dyn Error>> {
        self.aspects
            .iter_mut()
            .try_for_each(|aspect| aspect.pre_tick(sim_connect, delta))
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
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

#[derive(Default)]
pub struct AircraftVariableOptions {
    additional_names: Vec<String>,
    mapping_func: Option<fn(f64) -> f64>,
}

impl AircraftVariableOptions {
    pub fn additional_name(mut self, name: String) -> Self {
        self.additional_names.push(name);
        self
    }

    pub fn mapping(mut self, mapping_func: fn(f64) -> f64) -> Self {
        self.mapping_func = Some(mapping_func);
        self
    }
}

/// Declares a variable of a given type with a given name.
pub enum Variable {
    /// An aircraft variable accessible within the aspect, simulation and simulator.
    Aircraft(String, String, usize),

    /// A named variable accessible within the aspect, simulation and simulator.
    Named(String),

    /// A variable accessible within the aspect and simulation.
    Aspect(String),
}

impl Variable {
    fn name(&self) -> &str {
        match self {
            Variable::Aircraft(name, _, _) => name,
            Variable::Named(name) => name,
            Variable::Aspect(name) => name,
        }
    }

    fn add_named_variable_prefix(&mut self, prefix: &str) {
        if let Variable::Named(name) = self {
            *name = format!("{}{}", prefix, name);
        }
    }
}

impl From<&Variable> for VariableValue {
    fn from(value: &Variable) -> Self {
        match value {
            Variable::Aircraft(name, units, index) => {
                VariableValue::Aircraft(match AircraftVariable::from(name, units, *index) {
                    Ok(aircraft_variable) => aircraft_variable,
                    Err(error) => panic!(
                        "Error while trying to create aircraft variable named '{}': {}",
                        value.name(),
                        error
                    ),
                })
            }
            Variable::Named(name) => VariableValue::Named(NamedVariable::from(name)),
            Variable::Aspect(_) => VariableValue::Aspect(0.),
        }
    }
}

impl From<&Variable> for VariableType {
    fn from(value: &Variable) -> Self {
        match value {
            Variable::Aircraft(_, _, _) => Self::Aircraft,
            Variable::Named(_) => Self::Named,
            Variable::Aspect(_) => Self::Aspect,
        }
    }
}

#[derive(Debug, PartialEq)]
pub enum VariableType {
    Aircraft = 0,
    Named = 1,
    Aspect = 2,
}

impl From<VariableType> for u8 {
    fn from(identifier_type: VariableType) -> Self {
        identifier_type as u8
    }
}

impl From<u8> for VariableType {
    fn from(value: u8) -> Self {
        match value {
            0 => VariableType::Aircraft,
            1 => VariableType::Named,
            2 => VariableType::Aspect,
            _ => panic!("Cannot convert {} to identifier type", value),
        }
    }
}

impl From<&VariableIdentifier> for VariableType {
    fn from(value: &VariableIdentifier) -> Self {
        value.identifier_type().into()
    }
}

pub enum VariableValue {
    Aircraft(AircraftVariable),
    Named(NamedVariable),
    Aspect(f64),
}

impl VariableValue {
    fn read(&self) -> f64 {
        match self {
            VariableValue::Aircraft(underlying) => underlying.get(),
            VariableValue::Named(underlying) => underlying.get_value(),
            VariableValue::Aspect(underlying) => *underlying,
        }
    }

    fn write(&mut self, value: f64) {
        match self {
            VariableValue::Aircraft(_) => panic!("Cannot write to an aircraft variable."),
            VariableValue::Named(underlying) => underlying.set_value(value),
            VariableValue::Aspect(underlying) => *underlying = value,
        }
    }
}

pub struct MsfsVariableRegistry {
    name_to_identifier: FxHashMap<String, VariableIdentifier>,
    aircraft_variables: Vec<(AircraftVariable, Option<fn(f64) -> f64>)>,
    named_variables: Vec<NamedVariable>,
    named_variable_prefix: String,
    next_aircraft_variable_identifier: VariableIdentifier,
    next_named_variable_identifier: VariableIdentifier,
    next_aspect_variable_identifier: VariableIdentifier,
}

impl MsfsVariableRegistry {
    pub fn new(named_variable_prefix: String) -> Self {
        Self {
            name_to_identifier: FxHashMap::default(),
            aircraft_variables: Default::default(),
            named_variables: Default::default(),
            named_variable_prefix,
            next_aircraft_variable_identifier: VariableIdentifier::new(VariableType::Aircraft),
            next_named_variable_identifier: VariableIdentifier::new(VariableType::Named),
            next_aspect_variable_identifier: VariableIdentifier::new(VariableType::Aspect),
        }
    }

    /// Add an aircraft variable definition. Once added, the aircraft variable
    /// can be read through the `MsfsVariableRegistry.read` function.
    pub fn add_aircraft_variable(
        &mut self,
        name: &str,
        units: &str,
        index: usize,
    ) -> Result<VariableIdentifier, Box<dyn Error>> {
        self.add_aircraft_variable_with_options(
            name,
            units,
            index,
            AircraftVariableOptions::default(),
        )
    }

    /// Add an aircraft variable definition. Once added, the aircraft variable
    /// can be read through the `MsfsVariableRegistry.read` function.
    ///
    /// The additional names map to the same variable.
    pub fn add_aircraft_variable_with_options(
        &mut self,
        name: &str,
        units: &str,
        index: usize,
        options: AircraftVariableOptions,
    ) -> Result<VariableIdentifier, Box<dyn Error>> {
        match AircraftVariable::from(name, units, index) {
            Ok(var) => {
                let name = if index > 0 {
                    format!("{}:{}", name, index)
                } else {
                    name.to_owned()
                };

                let identifier = self.next_aircraft_variable_identifier;

                self.aircraft_variables
                    .insert(identifier.identifier_index(), (var, options.mapping_func));
                self.name_to_identifier.insert(name, identifier);

                options.additional_names.iter().for_each(|el| {
                    self.name_to_identifier.insert(el.to_owned(), identifier);
                });

                self.next_aircraft_variable_identifier = identifier.next();

                Ok(identifier)
            }
            Err(x) => Err(x),
        }
    }

    fn create_named_variable(&mut self, name: String) -> VariableIdentifier {
        match self.name_to_identifier.get(&name) {
            Some(identifier) => *identifier,
            None => {
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
    }

    fn create_aspect_variable(&mut self, name: String) -> VariableIdentifier {
        let identifier = self.next_aspect_variable_identifier;
        self.name_to_identifier.insert(name.to_owned(), identifier);
        self.next_aspect_variable_identifier = identifier.next();

        identifier
    }

    fn get_identifier_or_create_variable(&mut self, variable: &Variable) -> VariableIdentifier {
        match self.name_to_identifier.get(variable.name()) {
            Some(identifier) => *identifier,
            None => match variable {
                Variable::Aircraft(name, units, index) => {
                    match self.add_aircraft_variable(name, units, *index) {
                        Ok(identifier) => identifier,
                        Err(error) => panic!(
                            "Error while trying to register aircraft variable named '{}': {}",
                            variable.name(),
                            error
                        ),
                    }
                }
                Variable::Named(name) => self.create_named_variable(name.to_owned()),
                Variable::Aspect(name) => self.create_aspect_variable(name.to_owned()),
            },
        }
    }
}

impl VariableRegistry for MsfsVariableRegistry {
    fn get(&mut self, name: String) -> VariableIdentifier {
        match self.name_to_identifier.get(&name) {
            Some(identifier) => *identifier,
            None => self.create_named_variable(name),
        }
    }
}

impl SimulatorAspect for MsfsVariableRegistry {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        match VariableType::from(identifier) {
            VariableType::Aircraft => {
                match &self.aircraft_variables[identifier.identifier_index()] {
                    (variable, None) => Some(variable.get()),
                    (variable, Some(mapping_func)) => Some(mapping_func(variable.get())),
                }
            }
            VariableType::Named => {
                Some(self.named_variables[identifier.identifier_index()].get_value())
            }
            VariableType::Aspect => None,
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        match VariableType::from(identifier) {
            VariableType::Named => {
                self.named_variables[identifier.identifier_index()].set_value(value);
                true
            }
            VariableType::Aircraft | VariableType::Aspect => false,
        }
    }
}

#[data_definition]
struct SimulationTime {
    #[name = "SIMULATION TIME"]
    #[unit = "Number"]
    value: f64,
}

impl SimulationTime {
    const REQUEST_ID: u32 = 0;
}

struct Time {
    previous_simulation_time_value: f64,
    next_delta: f64,
}

impl Time {
    fn new(sim_connect: &mut SimConnect) -> Result<Self, Box<dyn Error>> {
        sim_connect.request_data_on_sim_object::<SimulationTime>(
            SimulationTime::REQUEST_ID,
            SIMCONNECT_OBJECT_ID_USER,
            Period::SimFrame,
        )?;

        Ok(Self {
            previous_simulation_time_value: 0.,
            next_delta: 0.,
        })
    }

    fn increment(&mut self, simulation_time: &SimulationTime) {
        self.next_delta += simulation_time.value - self.previous_simulation_time_value;
        self.previous_simulation_time_value = simulation_time.value;
    }

    fn is_pausing(&self) -> bool {
        self.next_delta == 0.
    }

    fn take(&mut self) -> Duration {
        let value = self.next_delta;
        self.next_delta = 0.;

        Duration::from_secs_f64(value)
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
