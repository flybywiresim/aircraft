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
    fn handle_message(
        &mut self,
        _variables: &mut MsfsVariableRegistry,
        _message: &SimConnectRecv,
    ) -> bool {
        false
    }

    /// Executes before a simulation tick runs.
    fn pre_tick(
        &mut self,
        _variables: &mut MsfsVariableRegistry,
        _sim_connect: &mut SimConnect,
        _delta: Duration,
    ) -> Result<(), Box<dyn Error>> {
        Ok(())
    }

    /// Executes after a simulation tick ran.
    fn post_tick(
        &mut self,
        _variables: &mut MsfsVariableRegistry,
        _sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        Ok(())
    }
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

        Ok((
            simulation,
            MsfsHandler::new(registry, aspects, self.failures, self.sim_connect)?,
        ))
    }

    pub fn with_aspect<T: FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>>>(
        mut self,
        builder_func: T,
    ) -> Result<Self, Box<dyn Error>> {
        let variable_registry = &mut self.variable_registry.as_mut().unwrap();
        let mut builder = MsfsAspectBuilder::new(&mut self.sim_connect, variable_registry);
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
            registry.register(&Variable::Aircraft(
                name.to_owned(),
                units.to_owned(),
                index,
            ));
        }

        Ok(self)
    }
}

/// Used to orchestrate the simulation combined with Microsoft Flight Simulator.
pub struct MsfsHandler {
    variables: Option<MsfsVariableRegistry>,
    aspects: Vec<Box<dyn SimulatorAspect>>,
    failures: Option<Failures>,
    time: Time,
}
impl MsfsHandler {
    fn new(
        variables: MsfsVariableRegistry,
        aspects: Vec<Box<dyn SimulatorAspect>>,
        failures: Option<Failures>,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            variables: Some(variables),
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
        if let Some(mut variables) = self.variables.take() {
            for aspect in self.aspects.iter_mut() {
                if aspect.handle_message(&mut variables, message) {
                    break;
                }
            }

            self.variables = Some(variables);
        }
    }

    fn pre_tick(
        &mut self,
        sim_connect: &mut SimConnect,
        delta: Duration,
    ) -> Result<(), Box<dyn Error>> {
        if let Some(mut variables) = self.variables.take() {
            let result = self
                .aspects
                .iter_mut()
                .try_for_each(|aspect| aspect.pre_tick(&mut variables, sim_connect, delta));

            self.variables = Some(variables);

            result
        } else {
            Ok(())
        }
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        if let Some(mut variables) = self.variables.take() {
            for aspect in self.aspects.iter_mut() {
                aspect.post_tick(&mut variables, sim_connect)?;
            }

            self.variables = Some(variables);
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
            .unwrap_or_else(|| {
                self.variables
                    .as_ref()
                    .map(|registry| registry.read(identifier).unwrap_or(0.))
                    .unwrap_or(0.)
            })
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) {
        for aspect in self.aspects.iter_mut() {
            if aspect.write(identifier, value) {
                return;
            }
        }

        if let Some(variable_registry) = &mut self.variables {
            variable_registry.write(identifier, value);
        }
    }
}

/// Declares a variable of a given type with a given name.
#[derive(Clone)]
pub enum Variable {
    /// An aircraft variable accessible within the aspect, simulation and simulator.
    Aircraft(String, String, usize),

    /// A named variable accessible within the aspect, simulation and simulator.
    Named(String),

    /// A variable accessible within all aspects and the simulation.
    ///
    /// Note that even though aspect variables are accessible from all aspects, no assumptions
    /// should be made about their update order outside of a single aspect. Thus it is best not
    /// to use the same aspect variable within different aspects.
    Aspect(String),
}

impl Variable {
    fn formatted_name(&self) -> String {
        match self {
            Variable::Aircraft(name, _, index, ..) => {
                let index = *index;
                if index > 0 {
                    format!("{}:{}", name, index)
                } else {
                    name.into()
                }
            }
            Variable::Named(name, ..) | Variable::Aspect(name, ..) => name.into(),
        }
    }

    fn add_prefix(&mut self, prefix: &str) {
        match self {
            Variable::Aircraft(name, ..)
            | Variable::Named(name, ..)
            | Variable::Aspect(name, ..) => {
                *name = format!("{}{}", prefix, name);
            }
        }
    }
}

impl From<&Variable> for VariableValue {
    fn from(value: &Variable) -> Self {
        match value {
            Variable::Aircraft(name, units, index, ..) => {
                let index = *index;
                VariableValue::Aircraft(match AircraftVariable::from(&name, units, index) {
                    Ok(aircraft_variable) => aircraft_variable,
                    Err(error) => panic!(
                        "Error while trying to create aircraft variable named '{}': {}",
                        name, error
                    ),
                })
            }
            Variable::Named(name, ..) => VariableValue::Named(NamedVariable::from(name)),
            Variable::Aspect(..) => VariableValue::Aspect(0.),
        }
    }
}

impl From<&Variable> for VariableType {
    fn from(value: &Variable) -> Self {
        match value {
            Variable::Aircraft(..) => Self::Aircraft,
            Variable::Named(..) => Self::Named,
            Variable::Aspect(..) => Self::Aspect,
        }
    }
}

#[derive(Debug, Eq, Hash, PartialEq)]
pub enum VariableType {
    Aircraft = 0,
    Named = 1,
    Aspect = 2,
}

impl From<VariableType> for u8 {
    fn from(value: VariableType) -> Self {
        value as u8
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
    named_variable_prefix: String,
    name_to_identifier: FxHashMap<String, VariableIdentifier>,
    next_variable_identifier: FxHashMap<VariableType, VariableIdentifier>,
    variables: FxHashMap<VariableIdentifier, VariableValue>,
}

impl MsfsVariableRegistry {
    pub fn new(named_variable_prefix: String) -> Self {
        Self {
            named_variable_prefix,
            name_to_identifier: FxHashMap::default(),
            next_variable_identifier: FxHashMap::default(),
            variables: FxHashMap::default(),
        }
    }

    /// Registers a variable definition. Once added, the variable
    /// can be read through the `MsfsVariableRegistry.read` function.
    pub fn register(&mut self, variable: &Variable) -> VariableIdentifier {
        let identifier = self.get_identifier_or_create_variable(variable);

        assert_eq!(
            VariableType::from(&identifier),
            variable.into(),
            "Attempted to register a variable called {} which was already defined as another type of variable.", variable.formatted_name()
        );

        identifier
    }

    pub fn register_many(&mut self, variables: &[Variable]) -> Vec<VariableIdentifier> {
        variables
            .into_iter()
            .map(|variable| self.register(variable))
            .collect()
    }

    fn get_identifier_or_create_variable(&mut self, variable: &Variable) -> VariableIdentifier {
        match self.name_to_identifier.get(&variable.formatted_name()) {
            Some(identifier) => *identifier,
            None => {
                let identifier = *self
                    .next_variable_identifier
                    .entry(variable.into())
                    .or_insert_with(|| VariableIdentifier::new::<VariableType>(variable.into()));

                self.next_variable_identifier
                    .insert(variable.into(), identifier.next());

                self.name_to_identifier
                    .insert(variable.formatted_name(), identifier);

                let mut variable = variable.clone();
                if matches!(variable, Variable::Named(..)) {
                    variable.add_prefix(&self.named_variable_prefix);
                }

                let value: VariableValue = (&variable).into();
                self.variables.insert(identifier, value);

                identifier
            }
        }
    }

    fn read(&self, identifier: &VariableIdentifier) -> Option<f64> {
        match self.variables.get(identifier) {
            Some(variable_value) => Some(variable_value.read()),
            None => None,
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) {
        match self.variables.get_mut(identifier) {
            Some(variable_value) => variable_value.write(value),
            None => (),
        }
    }
}

impl VariableRegistry for MsfsVariableRegistry {
    fn get(&mut self, name: String) -> VariableIdentifier {
        // By the time this function is called, only named variables are to be created.
        // Other variable types have been instantiated through the MsfsSimulationBuilder.
        self.register(&Variable::Named(name))
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
