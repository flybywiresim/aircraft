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
        }
    }

    pub fn build(self) -> MsfsAspect {
        let aspect = MsfsAspect::new(self.event_to_variable, self.aggregate_variable);

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
        self.event_to_variable.push(EventToVariable::new(
            &mut self.sim_connect,
            self.variable_registry,
            &self.key_prefix,
            event_name,
            mapping,
            target,
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
        self.aggregate_variable.push(AggregateVariables::new(
            self.variable_registry,
            &self.key_prefix,
            update_on,
            input,
            func,
            output,
            options,
        ));
    }
}

pub struct MsfsAspect {
    event_to_variable: Vec<EventToVariable>,
    aggregate_variables: Vec<AggregateVariables>,
}

impl MsfsAspect {
    fn new(
        event_to_variable: Vec<EventToVariable>,
        aggregate_variables: Vec<AggregateVariables>,
    ) -> Self {
        Self {
            event_to_variable,
            aggregate_variables,
        }
    }

    fn update_aggregate_variables(&mut self, update_moment: UpdateOn) {
        let mut aspect_variables: FxHashMap<VariableIdentifier, f64> = self
            .event_to_variable
            .iter()
            .map(|ev| ev.value_tuple())
            .collect();

        self.aggregate_variables.iter_mut().for_each(|av| {
            av.update_value(&aspect_variables, update_moment);
            aspect_variables.insert(av.output_identifier(), av.value());
        });
    }
}

impl SimulatorAspect for MsfsAspect {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        self.event_to_variable
            .iter_mut()
            .find_map(|ev| ev.read(identifier))
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        self.event_to_variable
            .iter_mut()
            .any(|ev| ev.write(identifier, value))
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        self.event_to_variable
            .iter_mut()
            .any(|ev| ev.handle_message(message))
    }

    fn pre_tick(&mut self, delta: Duration) {
        self.event_to_variable
            .iter_mut()
            .for_each(|ev| ev.pre_tick(delta));

        self.update_aggregate_variables(UpdateOn::PreTick);
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.event_to_variable
            .iter_mut()
            .try_for_each(|ev| ev.post_tick(sim_connect))?;

        self.update_aggregate_variables(UpdateOn::PostTick);

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

impl Variable {
    fn to_named_variable(&self, key_prefix: &str) -> Option<NamedVariable> {
        if let Variable::Named(name) = self {
            Some(NamedVariable::from(&format!("{}{}", key_prefix, name)))
        } else {
            None
        }
    }

    fn to_identifier(&self, variable_registry: &mut MsfsVariableRegistry) -> VariableIdentifier {
        match self {
            Variable::Aspect(name) => {
                variable_registry.get_identifier_or_create_aspect_variable(name.to_owned())
            }
            Variable::Named(name) => {
                variable_registry.get_identifier_or_create_named_variable(name.to_owned())
            }
        }
    }
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
    variable_identifier: VariableIdentifier,
    named_variable: Option<NamedVariable>,
    aspect_value: f64,
    last_written_value: Option<f64>,
    mapping: EventToVariableMapping,
    target: Variable,
    options: EventToVariableOptions,
}

impl EventToVariable {
    fn new(
        sim_connect: &mut SimConnect,
        variable_registry: &mut MsfsVariableRegistry,
        key_prefix: &str,
        event_name: &str,
        mapping: EventToVariableMapping,
        target: Variable,
        options: EventToVariableOptions,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            event_id: sim_connect.map_client_event_to_sim_event(event_name, options.mask)?,
            event_last_handled: None,
            event_handled_before_tick: false,
            variable_identifier: target.to_identifier(variable_registry),
            named_variable: target.to_named_variable(key_prefix),
            aspect_value: 0.,
            last_written_value: None,
            mapping,
            target,
            options,
        })
    }

    fn value(&self) -> f64 {
        match self.target {
            Variable::Named(_) => self.named_variable.as_ref().unwrap().get_value(),
            Variable::Aspect(_) => self.aspect_value,
        }
    }

    fn value_tuple(&self) -> (VariableIdentifier, f64) {
        (self.variable_identifier, self.value())
    }

    fn set_value(&mut self, value: f64) {
        match self.target {
            Variable::Named(_) => self.named_variable.as_mut().unwrap().set_value(value),
            Variable::Aspect(_) => self.aspect_value = value,
        }
    }

    fn handles_identifier(&self, identifier: &VariableIdentifier) -> bool {
        self.variable_identifier == *identifier
    }

    fn should_handle_event(&self) -> bool {
        match self.event_last_handled {
            Some(instant) => instant.elapsed() > self.options.ignore_repeats_for,
            None => true,
        }
    }

    fn set_variable_after_tick(&mut self) {
        if self.event_handled_before_tick {
            match self.options.after_tick_set_to {
                Some(value) => self.set_value(value),
                None => (),
            }
        }
    }

    fn write_variable_to_event(
        &mut self,
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        if self.options.is_bidirectional() {
            let value = self.value();
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

    fn map_to_value(&self, e: &msfs::sys::SIMCONNECT_RECV_EVENT) -> f64 {
        match self.mapping {
            EventToVariableMapping::Value(value) => value,
            EventToVariableMapping::EventDataRaw => e.data() as f64,
            EventToVariableMapping::EventData32kPosition => sim_connect_32k_pos_to_f64(e.data()),
            EventToVariableMapping::EventDataToValue(func) => func(e.data()),
            EventToVariableMapping::CurrentValueToValue(func) => func(self.value()),
            EventToVariableMapping::EventDataAndCurrentValueToValue(func) => {
                func(e.data(), self.value())
            }
            EventToVariableMapping::SmoothPress(_, _) => self.value(),
        }
    }

    fn adjust_smooth_pressed_value(&mut self, delta: Duration) {
        if let EventToVariableMapping::SmoothPress(press_factor, release_factor) = self.mapping {
            let mut value = self.value();
            if self.event_handled_before_tick {
                value += delta.as_secs_f64() * press_factor;
            } else {
                value -= delta.as_secs_f64() * release_factor;
            }

            self.set_value(value.min(1.).max(0.));
        }
    }
}

impl SimulatorAspect for EventToVariable {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        match self.target {
            Variable::Aspect(_) if self.handles_identifier(identifier) => Some(self.value()),
            // Named variable reading is handled by the VariableRegistry.
            _ => None,
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        match self.target {
            Variable::Aspect(_) if self.handles_identifier(identifier) => {
                self.set_value(value);
                true
            }
            // Named variable writing is handled by the VariableRegistry.
            _ => false,
        }
    }

    fn handle_message(&mut self, message: &SimConnectRecv) -> bool {
        match message {
            SimConnectRecv::Event(e) if e.id() == self.event_id => {
                if self.should_handle_event() {
                    let mapped_value = self.map_to_value(e);
                    self.set_value(mapped_value);

                    self.event_last_handled = Some(Instant::now());
                    self.event_handled_before_tick = true;
                }

                true
            }
            _ => false,
        }
    }

    fn pre_tick(&mut self, delta: Duration) {
        self.adjust_smooth_pressed_value(delta);
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.write_variable_to_event(sim_connect)?;
        self.set_variable_after_tick();

        self.event_handled_before_tick = false;
        Ok(())
    }
}

struct AggregateVariables {
    update_on: UpdateOn,
    input_named_variables: Vec<Option<NamedVariable>>,
    input_variable_identifiers: Vec<VariableIdentifier>,
    func: AggregateVariableFunction,
    output_named_variable: Option<NamedVariable>,
    output_variable_identifier: VariableIdentifier,
    value: f64,
    options: AggregateVariablesOptions,
}

impl AggregateVariables {
    fn new(
        variable_registry: &mut MsfsVariableRegistry,
        key_prefix: &str,
        update_on: UpdateOn,
        input: Vec<Variable>,
        func: AggregateVariableFunction,
        output: Variable,
        options: AggregateVariablesOptions,
    ) -> Self {
        assert!(
            input.len() >= 2,
            "Aggregation requires at least two input variables."
        );

        Self {
            update_on,
            input_named_variables: input
                .iter()
                .map(|input_variable| input_variable.to_named_variable(key_prefix))
                .collect(),
            input_variable_identifiers: input
                .iter()
                .map(|input_variable| input_variable.to_identifier(variable_registry))
                .collect(),
            func,
            output_named_variable: output.to_named_variable(key_prefix),
            output_variable_identifier: output.to_identifier(variable_registry),
            value: 0.,
            options,
        }
    }

    fn value(&self) -> f64 {
        match &self.output_named_variable {
            Some(named_variable) => named_variable.get_value(),
            None => self.value,
        }
    }

    fn set_value(&mut self, value: f64) {
        match &self.output_named_variable {
            Some(named_variable) => named_variable.set_value(value),
            None => self.value = value,
        };
    }

    fn output_identifier(&self) -> VariableIdentifier {
        self.output_variable_identifier
    }

    fn update_value(
        &mut self,
        aspect_variables: &FxHashMap<VariableIdentifier, f64>,
        update_moment: UpdateOn,
    ) {
        if self.update_on == update_moment {
            let values = self.input_variable_identifiers.iter().enumerate().map(
                |(index, variable_identifier)| match aspect_variables.get(variable_identifier) {
                    Some(value) => *value,
                    None => match &self.input_named_variables[index] {
                        Some(named_variable) => named_variable.get_value(),
                        None => {
                            panic!("Attempted to aggregate variables which were unavailable.");
                        }
                    },
                },
            );

            let mut value = match self.func {
                AggregateVariableFunction::Min => values.reduce(f64::min).unwrap_or(0.),
                AggregateVariableFunction::Max => values.reduce(f64::max).unwrap_or(0.),
            };

            if let Some(map_func) = self.options.map_func {
                value = map_func(value);
            }

            self.set_value(value);
        }
    }
}

impl SimulatorAspect for AggregateVariables {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        // Named variable reading is handled by the VariableRegistry.
        if self.output_variable_identifier == *identifier && self.output_named_variable.is_none() {
            Some(self.value())
        } else {
            None
        }
    }

    fn pre_tick(&mut self, _: Duration) {}
}
