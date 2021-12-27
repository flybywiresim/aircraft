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
    aggregate_variable: Vec<AggregateVariables>,
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
            aggregate_variable: Default::default(),
            variables: Default::default(),
        }
    }

    pub fn build(self) -> MsfsAspect {
        let aspect = MsfsAspect::new(
            self.event_to_variable,
            self.aggregate_variable,
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
        let target_identifier =
            self.variables
                .register(&self.key_prefix, self.variable_registry, &target);

        self.event_to_variable.push(EventToVariable::new(
            &mut self.sim_connect,
            event_name,
            mapping,
            target_identifier,
            options,
        )?);

        Ok(())
    }

    /// Aggregates a collection of variable values into one output value.
    ///
    /// Note that this function:
    /// 1. Cannot access aspect variables defined in other aspects.
    /// 2. Can only access input aspect variables which are declared prior to calling this function.
    pub fn aggregate_variables(
        &mut self,
        update_on: UpdateOn,
        input: Vec<Variable>,
        func: AggregateVariableFunction,
        output: Variable,
        options: AggregateVariablesOptions,
    ) {
        let input_variable_identifiers: Vec<VariableIdentifier> = input
            .iter()
            .map(|input_variable| {
                self.variables
                    .register(&self.key_prefix, self.variable_registry, &input_variable)
            })
            .collect();

        let output_variable_identifier =
            self.variables
                .register(&self.key_prefix, self.variable_registry, &output);

        self.aggregate_variable.push(AggregateVariables::new(
            update_on,
            input_variable_identifiers,
            func,
            output_variable_identifier,
            options,
        ));
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
    aggregate_variables: Vec<AggregateVariables>,
    variables: Option<MsfsAspectVariableCollection>,
}

impl MsfsAspect {
    fn new(
        event_to_variable: Vec<EventToVariable>,
        aggregate_variables: Vec<AggregateVariables>,
        variables: MsfsAspectVariableCollection,
    ) -> Self {
        Self {
            event_to_variable,
            aggregate_variables,
            variables: Some(variables),
        }
    }

    fn update_aggregate_variables(
        &mut self,
        update_moment: UpdateOn,
        variables: &mut MsfsAspectVariableCollection,
    ) {
        self.aggregate_variables.iter_mut().for_each(|av| {
            av.update_value(variables, update_moment);
        });
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

    fn pre_tick(&mut self, delta: Duration) {
        if let Some(mut variables) = self.variables.take() {
            self.event_to_variable
                .iter_mut()
                .for_each(|ev| ev.pre_tick(delta, &mut variables));

            self.update_aggregate_variables(UpdateOn::PreTick, &mut variables);

            self.variables = Some(variables);
        }
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        if let Some(mut variables) = self.variables.take() {
            self.event_to_variable
                .iter_mut()
                .try_for_each(|ev| ev.post_tick(sim_connect, &mut variables))?;

            self.update_aggregate_variables(UpdateOn::PostTick, &mut variables);

            self.variables = Some(variables);
        }

        Ok(())
    }
}

#[derive(Clone, Copy, PartialEq)]
pub enum UpdateOn {
    PreTick,
    PostTick,
}

/// Declares how to aggregate the variables.
pub enum AggregateVariableFunction {
    /// Takes the minimum value of all variables.
    Min,

    /// Takes the maximum value of all variables.
    Max,
}

#[derive(Clone, Copy, Default)]
pub struct AggregateVariablesOptions {
    map_func: Option<fn(f64) -> f64>,
}

impl AggregateVariablesOptions {
    /// Map the resulting aggregated value by applying the given function.
    pub fn map(mut self, map_func: fn(f64) -> f64) -> Self {
        self.map_func = Some(map_func);
        self
    }
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
    target_identifier: VariableIdentifier,
    last_written_value: Option<f64>,
    mapping: EventToVariableMapping,
    options: EventToVariableOptions,
}

impl EventToVariable {
    fn new(
        sim_connect: &mut SimConnect,
        event_name: &str,
        mapping: EventToVariableMapping,
        target_identifier: VariableIdentifier,
        options: EventToVariableOptions,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            event_id: sim_connect.map_client_event_to_sim_event(event_name, options.mask)?,
            event_last_handled: None,
            event_handled_before_tick: false,
            target_identifier,
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
                    variables.write(&self.target_identifier, value);
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
            let value = variables.read(&self.target_identifier).unwrap_or(0.);
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
                func(variables.read(&self.target_identifier).unwrap_or(0.))
            }
            EventToVariableMapping::EventDataAndCurrentValueToValue(func) => func(
                e.data(),
                variables.read(&self.target_identifier).unwrap_or(0.),
            ),
            EventToVariableMapping::SmoothPress(_, _) => {
                variables.read(&self.target_identifier).unwrap_or(0.)
            }
        }
    }

    fn adjust_smooth_pressed_value(
        &mut self,
        delta: Duration,
        variables: &mut MsfsAspectVariableCollection,
    ) {
        if let EventToVariableMapping::SmoothPress(press_factor, release_factor) = self.mapping {
            let mut value = variables.read(&self.target_identifier).unwrap_or(0.);
            if self.event_handled_before_tick {
                value += delta.as_secs_f64() * press_factor;
            } else {
                value -= delta.as_secs_f64() * release_factor;
            }

            variables.write(&self.target_identifier, value.min(1.).max(0.));
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
                    variables.write(&self.target_identifier, mapped_value);

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

struct AggregateVariables {
    update_on: UpdateOn,
    input_variable_identifiers: Vec<VariableIdentifier>,
    func: AggregateVariableFunction,
    output_variable_identifier: VariableIdentifier,
    options: AggregateVariablesOptions,
}

impl AggregateVariables {
    fn new(
        update_on: UpdateOn,
        input_variable_identifiers: Vec<VariableIdentifier>,
        func: AggregateVariableFunction,
        output_variable_identifier: VariableIdentifier,
        options: AggregateVariablesOptions,
    ) -> Self {
        assert!(
            input_variable_identifiers.len() >= 2,
            "Aggregation requires at least two input variables."
        );

        Self {
            update_on,
            input_variable_identifiers,
            func,
            output_variable_identifier,
            options,
        }
    }

    fn update_value(
        &mut self,
        variables: &mut MsfsAspectVariableCollection,
        update_moment: UpdateOn,
    ) {
        if self.update_on == update_moment {
            let values = self
                .input_variable_identifiers
                .iter()
                .map(
                    |variable_identifier| match variables.read(variable_identifier) {
                        Some(value) => value,
                        None => {
                            panic!("Attempted to aggregate variables which were unavailable.")
                        }
                    },
                );

            let mut value = match self.func {
                AggregateVariableFunction::Min => values.reduce(f64::min).unwrap_or(0.),
                AggregateVariableFunction::Max => values.reduce(f64::max).unwrap_or(0.),
            };

            if let Some(map_func) = self.options.map_func {
                value = map_func(value);
            }

            variables.write(&self.output_variable_identifier, value);
        }
    }
}
