#[macro_use]
pub mod aspects;
mod anti_ice;
mod electrical;
mod failures;
mod msfs;

#[cfg(not(target_arch = "wasm32"))]
use crate::msfs::legacy::{AircraftVariable, NamedVariable};
#[cfg(target_arch = "wasm32")]
use ::msfs::legacy::{AircraftVariable, NamedVariable};

#[cfg(not(target_arch = "wasm32"))]
use crate::msfs::commbus::{CommBus, CommBusBroadcastFlags};
#[cfg(target_arch = "wasm32")]
use ::msfs::commbus::{CommBus, CommBusBroadcastFlags};

use crate::anti_ice::{engine_anti_ice, wing_anti_ice};
use crate::aspects::{Aspect, ExecuteOn, MsfsAspectBuilder};
use crate::electrical::{auxiliary_power_unit, electrical_buses};
use ::msfs::{
    sim_connect::{data_definition, Period, SimConnect, SimConnectRecv, SIMCONNECT_OBJECT_ID_USER},
    sys, MSFSEvent,
};
use failures::Failures;
use fxhash::FxHashMap;
use std::cell::RefCell;
use std::fmt::{Display, Formatter};
use std::rc::Rc;
use std::{error::Error, time::Duration};
use systems::shared::ElectricalBusType;
use systems::simulation::{InitContext, StartState};
use systems::{
    failures::FailureType,
    simulation::{
        Aircraft, Simulation, SimulatorReaderWriter, VariableIdentifier, VariableRegistry,
    },
};

/// Type used to configure and build a simulation and a handler which acts as a bridging layer
/// between the simulation and Microsoft Flight Simulator.
pub struct MsfsSimulationBuilder<'a, 'b> {
    variable_registry: Option<MsfsVariableRegistry>,
    start_state: StartState,
    sim_connect: &'a mut SimConnect<'b>,
    failures: Failures,
    aspects: Vec<Box<dyn Aspect>>,
}

impl<'a, 'b> MsfsSimulationBuilder<'a, 'b> {
    pub fn new(
        key_prefix: &str,
        start_state_variable: Variable,
        sim_connect: &'a mut SimConnect<'b>,
    ) -> Self {
        let start_state_variable_value: VariableValue = (&start_state_variable).into();

        Self {
            variable_registry: Some(MsfsVariableRegistry::new(key_prefix.into())),
            start_state: start_state_variable_value.read().into(),
            sim_connect,
            failures: Failures::default(),
            aspects: vec![],
        }
    }

    pub fn build<T: Aircraft, U: FnOnce(&mut InitContext) -> T>(
        self,
        aircraft_ctor_fn: U,
    ) -> Result<(Simulation<T>, MsfsHandler), Box<dyn Error>> {
        let mut registry = self.variable_registry.unwrap();
        let simulation = Simulation::new(self.start_state, aircraft_ctor_fn, &mut registry);

        Ok((
            simulation,
            MsfsHandler::new(registry, self.aspects, self.failures, self.sim_connect)?,
        ))
    }

    /// Adds an aspect. An aspect is a concern that should be handled by the bridging layer.
    /// The function passed to this method is used to configure the aspect.
    pub fn with_aspect<T: FnOnce(&mut MsfsAspectBuilder) -> Result<(), Box<dyn Error>>>(
        mut self,
        builder_func: T,
    ) -> Result<Self, Box<dyn Error>> {
        let variable_registry = &mut self.variable_registry.as_mut().unwrap();
        let mut builder = MsfsAspectBuilder::new(self.sim_connect, variable_registry);
        (builder_func)(&mut builder)?;
        self.aspects.push(Box::new(builder.build()));

        Ok(self)
    }

    /// Adds the mapping between electrical buses within Rust code and the powering of a specific
    /// electrical bus defined within the systems.cfg `[ELECTRICAL]` section.
    ///
    /// This function assumes that `bus.1` is a bus which is infinitely powered, and thus can act
    /// as a power source for the other buses which will all be connected to it.
    pub fn with_electrical_buses<const N: usize>(
        self,
        buses: [(ElectricalBusType, u32); N],
    ) -> Result<Self, Box<dyn Error>> {
        self.with_aspect(electrical_buses(buses))
    }

    pub fn with_auxiliary_power_unit(
        self,
        is_available_variable: Variable,
        fuel_valve_number: u8,
        fuel_pump_number: u8,
    ) -> Result<Self, Box<dyn Error>> {
        self.with_aspect(auxiliary_power_unit(
            is_available_variable,
            fuel_valve_number,
            fuel_pump_number,
        ))
    }

    pub fn with_engine_anti_ice(self, engine_count: usize) -> Result<Self, Box<dyn Error>> {
        self.with_aspect(engine_anti_ice(engine_count))
    }

    pub fn with_wing_anti_ice(self) -> Result<Self, Box<dyn Error>> {
        self.with_aspect(wing_anti_ice())
    }

    pub fn with_failures(mut self, failures: impl IntoIterator<Item = (u64, FailureType)>) -> Self {
        self.failures.add_failures(failures);
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

    pub fn provides_named_variable(mut self, name: &str) -> Result<Self, Box<dyn Error>> {
        if let Some(registry) = &mut self.variable_registry {
            registry.register(&Variable::Named(name.to_owned(), false));
        }

        Ok(self)
    }
}

/// Used to bridge between the simulation and Microsoft Flight Simulator.
pub struct MsfsHandler {
    variables: Option<MsfsVariableRegistry>,
    aspects: Vec<Box<dyn Aspect>>,
    failures: Rc<RefCell<Failures>>,
    _commbus: CommBus<'static>,
    time: Time,
}
impl MsfsHandler {
    fn new(
        variables: MsfsVariableRegistry,
        aspects: Vec<Box<dyn Aspect>>,
        failures: Failures,
        sim_connect: &mut SimConnect,
    ) -> Result<Self, Box<dyn Error>> {
        let failures = Rc::new(RefCell::new(failures));
        let mut commbus = CommBus::default();
        {
            let failures = failures.clone();
            commbus.register("FBW_FAILURE_UPDATE", move |data| {
                failures.borrow_mut().handle_failure_update(data);
            });
        }
        CommBus::call("FBW_FAILURE_REQUEST", "", CommBusBroadcastFlags::JS);
        Ok(Self {
            variables: Some(variables),
            aspects,
            failures,
            _commbus: commbus,
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
                    self.read_failures_into_simulation(simulation);

                    simulation.tick(delta_time, self.time.simulation_time(), self);
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
                if aspect.handle_message(message, &mut variables) {
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

    fn read_failures_into_simulation<T: Aircraft>(&mut self, simulation: &mut Simulation<T>) {
        if let Some(active_failures) = self.failures.borrow_mut().get_updated_active_failures() {
            simulation.update_active_failures(active_failures);
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
                    .map(|registry| registry.read(identifier))
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
    Named(String, bool),

    /// A variable accessible within all aspects and the simulation.
    ///
    /// Note that even though aspect variables are accessible from all aspects, no assumptions
    /// should be made about their update order outside of a single aspect. Thus it is best not
    /// to use the same aspect variable within different aspects.
    Aspect(String),
}

impl Display for Variable {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Aircraft(name, _, index) => {
                format!("Aircraft({})", Self::indexed_name(name, *index))
            }
            Self::Named(name, _has_prefix, ..) => format!("Named({})", name),
            Self::Aspect(name, ..) => format!("Aspect({})", name),
        };

        write!(f, "{}", name)
    }
}

impl Variable {
    pub fn aircraft(name: &str, units: &str, index: usize) -> Self {
        Self::Aircraft(name.into(), units.into(), index)
    }

    pub fn named(name: &str) -> Self {
        Self::Named(name.into(), true)
    }

    pub fn aspect(name: &str) -> Self {
        Self::Aspect(name.into())
    }

    /// Provides the name that should be used for storing and looking up a [VariableIdentifier].
    fn lookup_name(&self) -> String {
        match self {
            Self::Aircraft(name, _, index, ..) => Self::indexed_name(name, *index),
            Self::Named(name, ..) | Self::Aspect(name, ..) => name.into(),
        }
    }

    fn add_prefix(&mut self, prefix: &str) {
        match self {
            Self::Aircraft(name, ..) | Self::Aspect(name, ..) => {
                *name = format!("{}{}", prefix, name);
            }
            Self::Named(name, has_prefix, ..) => {
                if *has_prefix {
                    *name = format!("{}{}", prefix, name);
                }
            }
        }
    }

    fn indexed_name(name: &str, index: usize) -> String {
        if index > 0 {
            format!("{}:{}", name, index)
        } else {
            name.into()
        }
    }
}

impl From<&Variable> for VariableValue {
    fn from(value: &Variable) -> Self {
        match value {
            Variable::Aircraft(name, units, index, ..) => {
                let index = *index;
                VariableValue::Aircraft(match AircraftVariable::from(name, units, index) {
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

impl From<VariableType> for usize {
    fn from(value: VariableType) -> Self {
        value as usize
    }
}

impl From<usize> for VariableType {
    fn from(value: usize) -> Self {
        match value {
            0 => Self::Aircraft,
            1 => Self::Named,
            2 => Self::Aspect,
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
            Self::Aircraft(underlying) => underlying.get(),
            Self::Named(underlying) => underlying.get_value(),
            Self::Aspect(underlying) => *underlying,
        }
    }

    fn write(&mut self, value: f64) {
        match self {
            Self::Aircraft(_) => panic!("Cannot write to an aircraft variable."),
            Self::Named(underlying) => underlying.set_value(value),
            Self::Aspect(underlying) => *underlying = value,
        }
    }
}

pub struct MsfsVariableRegistry {
    named_variable_prefix: String,
    name_to_identifier: FxHashMap<String, VariableIdentifier>,
    next_variable_identifier: FxHashMap<VariableType, VariableIdentifier>,
    variables: [Vec<VariableValue>; 3],
}

impl MsfsVariableRegistry {
    pub fn new(named_variable_prefix: String) -> Self {
        Self {
            named_variable_prefix,
            name_to_identifier: FxHashMap::default(),
            next_variable_identifier: FxHashMap::default(),
            variables: [vec![], vec![], vec![]],
        }
    }

    /// Registers a variable definition. Once added, the variable
    /// can be read through the `MsfsVariableRegistry.read` function.
    pub fn register(&mut self, variable: &Variable) -> VariableIdentifier {
        let identifier = self.get_identifier_or_create_variable(variable);

        let registered_type: VariableType = (&identifier).into();
        let target_type: VariableType = variable.into();
        if registered_type != target_type {
            eprintln!("Attempted to re-register a variable \"{}\" which was previously registered with type {:?}.",
                      variable, registered_type);
        }

        identifier
    }

    pub fn register_many(&mut self, variables: &[Variable]) -> Vec<VariableIdentifier> {
        variables
            .iter()
            .map(|variable| self.register(variable))
            .collect()
    }

    fn get_identifier_or_create_variable(&mut self, variable: &Variable) -> VariableIdentifier {
        match self.name_to_identifier.get(&variable.lookup_name()) {
            Some(identifier) => *identifier,
            None => {
                let identifier = *self
                    .next_variable_identifier
                    .entry(variable.into())
                    .or_insert_with(|| VariableIdentifier::new::<VariableType>(variable.into()));

                self.next_variable_identifier
                    .insert(variable.into(), identifier.next());

                self.name_to_identifier
                    .insert(variable.lookup_name(), identifier);

                let mut variable = variable.clone();
                if matches!(variable, Variable::Named(..)) {
                    variable.add_prefix(&self.named_variable_prefix);
                }

                let value: VariableValue = (&variable).into();
                self.variables[identifier.identifier_type()]
                    .insert(identifier.identifier_index(), value);

                identifier
            }
        }
    }

    fn read(&self, identifier: &VariableIdentifier) -> f64 {
        self.variables[identifier.identifier_type()][identifier.identifier_index()].read()
    }

    fn read_many(&self, identifiers: &[VariableIdentifier]) -> Vec<f64> {
        identifiers
            .iter()
            .map(|identifier| self.read(identifier))
            .collect()
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) {
        self.variables[identifier.identifier_type()][identifier.identifier_index()].write(value);
    }
}

impl VariableRegistry for MsfsVariableRegistry {
    fn get(&mut self, name: String) -> VariableIdentifier {
        match self.name_to_identifier.get(&name) {
            Some(identifier) => *identifier,
            // By the time this function is called, only named variables are to be created.
            // Other variable types have been instantiated through the MsfsSimulationBuilder.
            None => self.register(&Variable::Named(name, true)),
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
    const REQUEST_ID: sys::DWORD = 0;
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
            Period::VisualFrame,
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

    fn simulation_time(&self) -> f64 {
        self.previous_simulation_time_value
    }

    fn is_pausing(&self) -> bool {
        self.next_delta == 0.
    }

    fn take(&mut self) -> Duration {
        let delta = Duration::from_secs_f64(self.next_delta);
        self.next_delta = 0.;

        const MAX_ALLOWED_DELTA_TIME: Duration = Duration::from_millis(500);
        if delta > MAX_ALLOWED_DELTA_TIME {
            println!("SYSTEM WASM CAPPING ABNORMAL DELTA TIME OF {:?}.", delta);
            MAX_ALLOWED_DELTA_TIME
        } else {
            delta
        }
    }
}

const MIN_32KPOS_VAL_FROM_SIMCONNECT: f64 = -16384.;
const MAX_32KPOS_VAL_FROM_SIMCONNECT: f64 = 16384.;
const RANGE_32KPOS_VAL_FROM_SIMCONNECT: f64 =
    MAX_32KPOS_VAL_FROM_SIMCONNECT - MIN_32KPOS_VAL_FROM_SIMCONNECT;
const OFFSET_32KPOS_VAL_FROM_SIMCONNECT: f64 = 16384.;
// Takes a 32k position type from simconnect, returns a value from scaled from 0 to 1
pub fn sim_connect_32k_pos_to_f64(sim_connect_axis_value: sys::DWORD) -> f64 {
    let casted_value = (sim_connect_axis_value as i32) as f64;
    let scaled_value =
        (casted_value + OFFSET_32KPOS_VAL_FROM_SIMCONNECT) / RANGE_32KPOS_VAL_FROM_SIMCONNECT;
    scaled_value.min(1.).max(0.)
}
// Takes a 32k position type from simconnect, returns a value from scaled from 0 to 1 (inverted)
pub fn sim_connect_32k_pos_inv_to_f64(sim_connect_axis_value: sys::DWORD) -> f64 {
    let casted_value = -1. * (sim_connect_axis_value as i32) as f64;
    let scaled_value =
        (casted_value + OFFSET_32KPOS_VAL_FROM_SIMCONNECT) / RANGE_32KPOS_VAL_FROM_SIMCONNECT;
    scaled_value.min(1.).max(0.)
}
// Takes a [0:1] f64 and returns a simconnect 32k position type
pub fn f64_to_sim_connect_32k_pos(scaled_axis_value: f64) -> sys::DWORD {
    let back_to_position_format = ((scaled_axis_value) * RANGE_32KPOS_VAL_FROM_SIMCONNECT)
        - OFFSET_32KPOS_VAL_FROM_SIMCONNECT;
    let to_i32 = back_to_position_format as i32;

    to_i32 as sys::DWORD
}
