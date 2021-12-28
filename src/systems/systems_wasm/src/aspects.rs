use super::{ASPECT_VARIABLE_IDENTIFIER_TYPE, NAMED_VARIABLE_IDENTIFIER_TYPE};
use crate::{
    f64_to_sim_connect_32k_pos, sim_connect_32k_pos_to_f64, MsfsVariableRegistry, SimulatorAspect,
};
use fxhash::FxHashMap;
use msfs::{
    legacy::NamedVariable,
    sim_connect::{SimConnect, SimConnectRecv, SIMCONNECT_OBJECT_ID_USER},
};
use std::error::Error;
use std::time::{Duration, Instant};
use systems::simulation::VariableIdentifier;

pub struct MsfsAspectBuilder<'a, 'b> {
    key_prefix: String,
    sim_connect: &'a mut SimConnect<'b>,
    variable_registry: &'a mut MsfsVariableRegistry,
    event_to_variable: Vec<EventToVariable>,
    variable_functions: Vec<VariableFunction>,
    variables: MsfsAspectVariableCollection,
}

impl<'a, 'b> MsfsAspectBuilder<'a, 'b> {
    pub fn new(
        key_prefix: String,
        sim_connect: &'a mut SimConnect<'b>,
        variable_registry: &'a mut MsfsVariableRegistry,
    ) -> Self {
        Self {
            key_prefix,
            sim_connect,
            variable_registry,
            event_to_variable: Default::default(),
            variable_functions: Default::default(),
            variables: Default::default(),
        }
    }

    pub fn build(self) -> MsfsAspect {
        let aspect = MsfsAspect::new(
            self.event_to_variable,
            self.variable_functions,
            self.variables,
        );

        aspect
    }

    /// Converts events to a value which is written to a variable.
    /// Optionally writes the variable's value back to the event.
    pub fn event_to_variable(
        &mut self,
        event_name: &str,
        mapping: EventToVariableMapping,
        target: Variable,
        options: EventToVariableOptions,
    ) -> Result<(), Box<dyn Error>> {
        let target = self.register_variable(target);

        self.event_to_variable.push(EventToVariable::new(
            &mut self.sim_connect,
            event_name,
            mapping,
            target,
            options,
        )?);

        Ok(())
    }

    /// Reduces variable values into one output value.
    ///
    /// Note that this function:
    /// 1. Cannot access aspect variables defined in other aspects.
    /// 2. Can only access input aspect variables which are declared prior to calling this function.
    pub fn reduce(
        &mut self,
        update_on: UpdateOn,
        inputs: Vec<Variable>,
        func: fn(f64, f64) -> f64,
        output: Variable,
    ) {
        let inputs = self.register_variables(inputs);
        let output = self.register_variable(output);

        self.variable_functions.push(VariableFunction::Reduce(
            Reduce::new(inputs, func, output),
            update_on,
        ));
    }

    pub fn map(
        &mut self,
        update_on: UpdateOn,
        input: Variable,
        func: fn(f64) -> f64,
        output: Variable,
    ) {
        let input = self.register_variable(input);
        let output = self.register_variable(output);

        self.variable_functions.push(VariableFunction::Map(
            Map::new(input, func, output),
            update_on,
        ));
    }

    pub fn variables_to_object(&mut self, instance: Box<dyn VariablesToObject>) {
        let variables = self.register_variables(instance.variables());

        self.variable_functions.push(VariableFunction::ToObject(
            ToObject::new(instance, variables),
            UpdateOn::PostTick,
        ));
    }

    fn register_variables(&mut self, variables: Vec<Variable>) -> Vec<VariableIdentifier> {
        variables
            .into_iter()
            .map(|variable| self.register_variable(variable))
            .collect()
    }

    fn register_variable(&mut self, variable: Variable) -> VariableIdentifier {
        self.variables
            .register(&self.key_prefix, self.variable_registry, &variable)
    }
}

#[derive(Default)]
struct MsfsAspectVariableCollection {
    aspect_variables: FxHashMap<VariableIdentifier, f64>,
    named_variables: FxHashMap<VariableIdentifier, NamedVariable>,
}

impl MsfsAspectVariableCollection {
    fn register(
        &mut self,
        key_prefix: &str,
        variable_registry: &mut MsfsVariableRegistry,
        target: &Variable,
    ) -> VariableIdentifier {
        match target {
            Variable::Aspect(name) => {
                let identifier =
                    variable_registry.get_identifier_or_create_aspect_variable(name.to_owned());
                if !self.aspect_variables.contains_key(&identifier) {
                    self.aspect_variables.insert(identifier, 0.);
                }

                identifier
            }
            Variable::Named(name) => {
                let identifier =
                    variable_registry.get_identifier_or_create_named_variable(name.to_owned());
                if !self.named_variables.contains_key(&identifier) {
                    self.named_variables.insert(
                        identifier,
                        NamedVariable::from(&format!("{}{}", key_prefix, name)),
                    );
                }

                identifier
            }
        }
    }

    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        match identifier.identifier_type() {
            ASPECT_VARIABLE_IDENTIFIER_TYPE => match self.aspect_variables.get(identifier) {
                Some(value) => Some(*value),
                None => None,
            },
            NAMED_VARIABLE_IDENTIFIER_TYPE => match self.named_variables.get(identifier) {
                Some(named_variable) => Some(named_variable.get_value()),
                None => None,
            },
            _ => None,
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        match identifier.identifier_type() {
            ASPECT_VARIABLE_IDENTIFIER_TYPE => {
                if self.aspect_variables.contains_key(identifier) {
                    self.aspect_variables.insert(*identifier, value);
                    true
                } else {
                    false
                }
            }
            NAMED_VARIABLE_IDENTIFIER_TYPE => match self.named_variables.get(identifier) {
                Some(named_variable) => {
                    named_variable.set_value(value);
                    true
                }
                None => false,
            },
            _ => false,
        }
    }
}

pub struct MsfsAspect {
    event_to_variable: Vec<EventToVariable>,
    variable_functions: Vec<VariableFunction>,
    variables: Option<MsfsAspectVariableCollection>,
}

impl MsfsAspect {
    fn new(
        event_to_variable: Vec<EventToVariable>,
        variable_functions: Vec<VariableFunction>,
        variables: MsfsAspectVariableCollection,
    ) -> Self {
        Self {
            event_to_variable,
            variable_functions,
            variables: Some(variables),
        }
    }

    fn apply_variable_functions(
        &mut self,
        sim_connect: &mut SimConnect,
        update_moment: UpdateOn,
        variables: &mut MsfsAspectVariableCollection,
    ) -> Result<(), Box<dyn Error>> {
        self.variable_functions
            .iter_mut()
            .try_for_each(|func| func.update(sim_connect, variables, update_moment))
    }
}

impl SimulatorAspect for MsfsAspect {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        self.variables.as_mut().unwrap().read(identifier)
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        self.variables.as_mut().unwrap().write(identifier, value)
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        if let Some(mut variables) = self.variables.take() {
            let result = self
                .event_to_variable
                .iter_mut()
                .any(|ev| ev.handle_message(message, &mut variables));

            self.variables = Some(variables);
            result
        } else {
            false
        }
    }

    fn pre_tick(
        &mut self,
        sim_connect: &mut SimConnect,
        delta: Duration,
    ) -> Result<(), Box<dyn Error>> {
        if let Some(mut variables) = self.variables.take() {
            self.event_to_variable
                .iter_mut()
                .for_each(|ev| ev.pre_tick(delta, &mut variables));

            self.apply_variable_functions(sim_connect, UpdateOn::PreTick, &mut variables)?;

            self.variables = Some(variables);
        }

        Ok(())
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        if let Some(mut variables) = self.variables.take() {
            self.event_to_variable
                .iter_mut()
                .try_for_each(|ev| ev.post_tick(sim_connect, &mut variables))?;

            self.apply_variable_functions(sim_connect, UpdateOn::PostTick, &mut variables)?;

            self.variables = Some(variables);
        }

        Ok(())
    }
}

enum VariableFunction {
    Map(Map, UpdateOn),
    Reduce(Reduce, UpdateOn),
    ToObject(ToObject, UpdateOn),
}

impl VariableFunction {
    fn update(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsAspectVariableCollection,
        update_moment: UpdateOn,
    ) -> Result<(), Box<dyn Error>> {
        match self {
            VariableFunction::Map(map, update_on) if *update_on == update_moment => {
                map.update(variables);
            }
            VariableFunction::Reduce(reduce, update_on) if *update_on == update_moment => {
                reduce.update(variables);
            }
            VariableFunction::ToObject(to_object, update_on) if *update_on == update_moment => {
                to_object.update(sim_connect, variables)?;
            }
            _ => (),
        }

        Ok(())
    }
}

#[derive(Clone, Copy, PartialEq)]
pub enum UpdateOn {
    PreTick,
    PostTick,
}

/// Declares how to map the given event to a variable value.
pub enum EventToVariableMapping {
    /// When the event occurs, sets the variable to the given value.
    Value(f64),

    /// Maps the event data from a u32 to an f64 without any further processing.
    EventDataRaw,

    /// Maps the event data from a 32k position to an f64.
    EventData32kPosition,

    /// When the event occurs, calls the function with event data and sets
    /// the variable to the returned value.
    EventDataToValue(fn(u32) -> f64),

    /// When the event occurs, calls the function with the current variable value and
    /// sets the variable to the returned value.
    CurrentValueToValue(fn(f64) -> f64),

    /// When the event occurs, calls the function with event data and the current
    /// variable value and sets the variable to the returned value.
    EventDataAndCurrentValueToValue(fn(u32, f64) -> f64),

    /// Converts the event occurrence to a value which increases and decreases
    /// by the given factors.
    SmoothPress(f64, f64),
}

#[derive(Clone, Copy)]
pub enum VariableToEventMapping {
    /// Maps the variable from an f64 to a u32 without any further processing.
    EventDataRaw,

    /// Maps the variable from an f64 to a 32k position.
    EventData32kPosition,
}

/// Declares a variable of a given type with a given name.
pub enum Variable {
    /// A variable accessible within the aspect and simulation.
    Aspect(String),

    /// A named variable accessible within the aspect, simulation and simulator.
    Named(String),
}

#[derive(Clone, Copy, Default)]
pub struct EventToVariableOptions {
    mask: bool,
    ignore_repeats_for: Duration,
    after_tick_set_to: Option<f64>,
    bidirectional_mapping: Option<VariableToEventMapping>,
}

impl EventToVariableOptions {
    pub fn mask(mut self) -> Self {
        self.mask = true;
        self
    }

    /// The duration to ignore any repeating occurrences of the event.
    /// Useful for dealing with poor MSFS event handling, e.g. keyboard events being triggered
    /// repeatedly despite only one press occurring.
    pub fn ignore_repeats_for(mut self, duration: Duration) -> Self {
        self.ignore_repeats_for = duration;
        self
    }

    /// Sets the value to which the variable should be reset after the event occurred and
    /// a single simulation tick finished.
    pub fn after_tick_set_to(mut self, value: f64) -> Self {
        self.after_tick_set_to = Some(value);
        self
    }

    pub fn bidirectional(mut self, mapping: VariableToEventMapping) -> Self {
        self.bidirectional_mapping = Some(mapping);
        self
    }

    fn is_bidirectional(&self) -> bool {
        self.bidirectional_mapping.is_some()
    }
}

struct EventToVariable {
    event_id: u32,
    event_last_handled: Option<Instant>,
    event_handled_before_tick: bool,
    target: VariableIdentifier,
    last_written_value: Option<f64>,
    mapping: EventToVariableMapping,
    options: EventToVariableOptions,
}

impl EventToVariable {
    fn new(
        sim_connect: &mut SimConnect,
        event_name: &str,
        mapping: EventToVariableMapping,
        target: VariableIdentifier,
        options: EventToVariableOptions,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            event_id: sim_connect.map_client_event_to_sim_event(event_name, options.mask)?,
            event_last_handled: None,
            event_handled_before_tick: false,
            target,
            last_written_value: None,
            mapping,
            options,
        })
    }

    fn should_handle_event(&self) -> bool {
        match self.event_last_handled {
            Some(instant) => instant.elapsed() > self.options.ignore_repeats_for,
            None => true,
        }
    }

    fn set_variable_after_tick(&mut self, variables: &mut MsfsAspectVariableCollection) {
        if self.event_handled_before_tick {
            match self.options.after_tick_set_to {
                Some(value) => {
                    variables.write(&self.target, value);
                }
                None => (),
            }
        }
    }

    fn write_variable_to_event(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsAspectVariableCollection,
    ) -> Result<(), Box<dyn Error>> {
        if self.options.is_bidirectional() {
            let value = variables.read(&self.target).unwrap_or(0.);
            let should_write = match self.last_written_value {
                Some(last_written_value) => value != last_written_value,
                None => true,
            };

            if should_write {
                sim_connect.transmit_client_event(
                    SIMCONNECT_OBJECT_ID_USER,
                    self.event_id,
                    match self.options.bidirectional_mapping {
                        Some(VariableToEventMapping::EventDataRaw) | None => value as u32,
                        Some(VariableToEventMapping::EventData32kPosition) => {
                            f64_to_sim_connect_32k_pos(value)
                        }
                    },
                )?;
                self.last_written_value = Some(value);
            }
        }

        Ok(())
    }

    fn map_to_value(
        &self,
        e: &msfs::sys::SIMCONNECT_RECV_EVENT,
        variables: &mut MsfsAspectVariableCollection,
    ) -> f64 {
        match self.mapping {
            EventToVariableMapping::Value(value) => value,
            EventToVariableMapping::EventDataRaw => e.data() as f64,
            EventToVariableMapping::EventData32kPosition => sim_connect_32k_pos_to_f64(e.data()),
            EventToVariableMapping::EventDataToValue(func) => func(e.data()),
            EventToVariableMapping::CurrentValueToValue(func) => {
                func(variables.read(&self.target).unwrap_or(0.))
            }
            EventToVariableMapping::EventDataAndCurrentValueToValue(func) => {
                func(e.data(), variables.read(&self.target).unwrap_or(0.))
            }
            EventToVariableMapping::SmoothPress(_, _) => variables.read(&self.target).unwrap_or(0.),
        }
    }

    fn adjust_smooth_pressed_value(
        &mut self,
        delta: Duration,
        variables: &mut MsfsAspectVariableCollection,
    ) {
        if let EventToVariableMapping::SmoothPress(press_factor, release_factor) = self.mapping {
            let mut value = variables.read(&self.target).unwrap_or(0.);
            if self.event_handled_before_tick {
                value += delta.as_secs_f64() * press_factor;
            } else {
                value -= delta.as_secs_f64() * release_factor;
            }

            variables.write(&self.target, value.min(1.).max(0.));
        }
    }

    fn handle_message(
        &mut self,
        message: &SimConnectRecv,
        variables: &mut MsfsAspectVariableCollection,
    ) -> bool {
        match message {
            SimConnectRecv::Event(e) if e.id() == self.event_id => {
                if self.should_handle_event() {
                    let mapped_value = self.map_to_value(e, variables);
                    variables.write(&self.target, mapped_value);

                    self.event_last_handled = Some(Instant::now());
                    self.event_handled_before_tick = true;
                }

                true
            }
            _ => false,
        }
    }

    fn pre_tick(&mut self, delta: Duration, variables: &mut MsfsAspectVariableCollection) {
        self.adjust_smooth_pressed_value(delta, variables);
    }

    fn post_tick(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsAspectVariableCollection,
    ) -> Result<(), Box<dyn Error>> {
        self.write_variable_to_event(sim_connect, variables)?;
        self.set_variable_after_tick(variables);

        self.event_handled_before_tick = false;
        Ok(())
    }
}

struct Reduce {
    input_variable_identifiers: Vec<VariableIdentifier>,
    func: fn(f64, f64) -> f64,
    output_variable_identifier: VariableIdentifier,
}

impl Reduce {
    fn new(
        input_variable_identifiers: Vec<VariableIdentifier>,
        func: fn(f64, f64) -> f64,
        output_variable_identifier: VariableIdentifier,
    ) -> Self {
        assert!(
            input_variable_identifiers.len() >= 2,
            "Aggregation requires at least two input variables."
        );

        Self {
            input_variable_identifiers,
            func,
            output_variable_identifier,
        }
    }

    fn update(&mut self, variables: &mut MsfsAspectVariableCollection) {
        let values = self
            .input_variable_identifiers
            .iter()
            .map(
                |variable_identifier| match variables.read(variable_identifier) {
                    Some(value) => value,
                    None => {
                        panic!("Attempted to reduce variables which are unavailable.")
                    }
                },
            );

        let value = values.reduce(self.func).unwrap_or(0.);
        variables.write(&self.output_variable_identifier, value);
    }
}

pub fn max(accumulator: f64, item: f64) -> f64 {
    accumulator.max(item)
}

pub fn min(accumulator: f64, item: f64) -> f64 {
    accumulator.min(item)
}

struct Map {
    input_variable_identifier: VariableIdentifier,
    func: fn(f64) -> f64,
    output_variable_identifier: VariableIdentifier,
}

impl Map {
    fn new(
        input_variable_identifier: VariableIdentifier,
        func: fn(f64) -> f64,
        output_variable_identifier: VariableIdentifier,
    ) -> Self {
        Self {
            input_variable_identifier,
            func,
            output_variable_identifier,
        }
    }

    fn update(&mut self, variables: &mut MsfsAspectVariableCollection) {
        let value = match variables.read(&self.input_variable_identifier) {
            Some(value) => value,
            None => panic!("Attempted to map a variable which is unavailable."),
        };

        variables.write(&self.output_variable_identifier, (self.func)(value));
    }
}

pub trait VariablesToObject {
    fn variables(&self) -> Vec<Variable>;
    fn write(&mut self, values: Vec<f64>);
    fn set_data_on_sim_object(&self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>>;
}

struct ToObject {
    target_object: Box<dyn VariablesToObject>,
    variables: Vec<VariableIdentifier>,
}

impl ToObject {
    fn new(target_object: Box<dyn VariablesToObject>, variables: Vec<VariableIdentifier>) -> Self {
        Self {
            target_object,
            variables,
        }
    }

    fn update(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsAspectVariableCollection,
    ) -> Result<(), Box<dyn Error>> {
        let values: Vec<f64> = self
            .variables
            .iter()
            .map(
                |variable_identifier| match variables.read(variable_identifier) {
                    Some(value) => value,
                    None => {
                        panic!("Attempted to access variables which are unavailable.")
                    }
                },
            )
            .collect();

        self.target_object.write(values);
        self.target_object.set_data_on_sim_object(sim_connect)?;

        Ok(())
    }
}

#[macro_export]
macro_rules! set_data_on_sim_object {
    () => {
        fn set_data_on_sim_object(
            &self,
            sim_connect: &mut SimConnect,
        ) -> Result<(), Box<dyn Error>> {
            sim_connect.set_data_on_sim_object(SIMCONNECT_OBJECT_ID_USER, self)?;
            Ok(())
        }
    };
}
