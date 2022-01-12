use crate::{
    f64_to_sim_connect_32k_pos, sim_connect_32k_pos_to_f64, MsfsVariableRegistry, SimulatorAspect,
    Variable,
};
use msfs::sim_connect::{SimConnect, SimConnectRecv, SIMCONNECT_OBJECT_ID_USER};
use std::error::Error;
use std::time::{Duration, Instant};
use systems::simulation::VariableIdentifier;

pub struct MsfsAspectBuilder<'a, 'b> {
    sim_connect: &'a mut SimConnect<'b>,
    variables: &'a mut MsfsVariableRegistry,
    event_to_variable: Vec<EventToVariable>,
    variable_functions: Vec<VariableFunction>,
}

impl<'a, 'b> MsfsAspectBuilder<'a, 'b> {
    pub fn new(
        sim_connect: &'a mut SimConnect<'b>,
        variables: &'a mut MsfsVariableRegistry,
    ) -> Self {
        Self {
            sim_connect,
            variables,
            event_to_variable: Default::default(),
            variable_functions: Default::default(),
        }
    }

    pub fn build(self) -> MsfsAspect {
        let aspect = MsfsAspect::new(self.event_to_variable, self.variable_functions);

        aspect
    }

    pub fn init_variable(&mut self, variable: Variable, value: f64) {
        let identifier = self.variables.register(&variable);
        self.variables.write(&identifier, value);
    }

    /// Converts events to a value which is written to a variable.
    /// Optionally writes the variable's value back to the event.
    pub fn event_to_variable(
        &mut self,
        event_name: &str,
        mapping: EventToVariableMapping,
        target: Variable,
        configure_options: fn(EventToVariableOptions) -> EventToVariableOptions,
    ) -> Result<(), Box<dyn Error>> {
        let target = self.variables.register(&target);

        self.event_to_variable.push(EventToVariable::new(
            &mut self.sim_connect,
            event_name,
            mapping,
            target,
            configure_options(EventToVariableOptions::default()),
        )?);

        Ok(())
    }

    pub fn variable_to_event(
        &mut self,
        input: Variable,
        mapping: VariableToEventMapping,
        write_on: VariableToEventWriteOn,
        event_name: &str,
    ) -> Result<(), Box<dyn Error>> {
        let input = self.variables.register(&input);

        self.variable_functions.push(VariableFunction::ToEvent(
            ToEvent::new(&mut self.sim_connect, input, mapping, write_on, event_name)?,
            UpdateOn::PostTick,
        ));

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
        let inputs = self.variables.register_many(&inputs);
        let output = self.variables.register(&output);

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
        let inputs = self.variables.register(&input);
        let output = self.variables.register(&output);

        self.variable_functions.push(VariableFunction::Map(
            Map::new(inputs, func, output),
            update_on,
        ));
    }

    pub fn copy(&mut self, input: Variable, output: Variable) {
        let input = self.variables.register(&input);
        let output = self.variables.register(&output);

        self.variable_functions.push(VariableFunction::Map(
            Map::new(input, |value| value, output),
            UpdateOn::PreTick,
        ));
    }

    pub fn map_many(
        &mut self,
        update_on: UpdateOn,
        inputs: Vec<Variable>,
        func: fn(&[f64]) -> f64,
        output: Variable,
    ) {
        let inputs = self.variables.register_many(&inputs);
        let output = self.variables.register(&output);

        self.variable_functions.push(VariableFunction::MapMany(
            MapMany::new(inputs, func, output),
            update_on,
        ));
    }

    pub fn variables_to_object(&mut self, instance: Box<dyn VariablesToObject>) {
        let variables = self.variables.register_many(&instance.variables());

        self.variable_functions.push(VariableFunction::ToObject(
            ToObject::new(instance, variables),
            UpdateOn::PostTick,
        ));
    }
}

pub struct MsfsAspect {
    event_to_variable: Vec<EventToVariable>,
    variable_functions: Vec<VariableFunction>,
}

impl MsfsAspect {
    fn new(
        event_to_variable: Vec<EventToVariable>,
        variable_functions: Vec<VariableFunction>,
    ) -> Self {
        Self {
            event_to_variable,
            variable_functions,
        }
    }

    fn apply_variable_functions(
        &mut self,
        sim_connect: &mut SimConnect,
        update_moment: UpdateOn,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        self.variable_functions
            .iter_mut()
            .try_for_each(|func| func.update(sim_connect, variables, update_moment))
    }
}

impl SimulatorAspect for MsfsAspect {
    fn handle_message(
        &mut self,
        variables: &mut MsfsVariableRegistry,
        message: &SimConnectRecv,
    ) -> bool {
        self.event_to_variable
            .iter_mut()
            .any(|ev| ev.handle_message(message, variables))
    }

    fn pre_tick(
        &mut self,
        variables: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
        delta: Duration,
    ) -> Result<(), Box<dyn Error>> {
        self.event_to_variable
            .iter_mut()
            .for_each(|ev| ev.pre_tick(delta, variables));

        self.apply_variable_functions(sim_connect, UpdateOn::PreTick, variables)?;

        Ok(())
    }

    fn post_tick(
        &mut self,
        variables: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        self.apply_variable_functions(sim_connect, UpdateOn::PostTick, variables)?;

        self.event_to_variable
            .iter_mut()
            .try_for_each(|ev| ev.post_tick(sim_connect, variables))?;

        Ok(())
    }
}

enum VariableFunction {
    Map(Map, UpdateOn),
    MapMany(MapMany, UpdateOn),
    Reduce(Reduce, UpdateOn),
    ToObject(ToObject, UpdateOn),
    ToEvent(ToEvent, UpdateOn),
}

impl VariableFunction {
    fn update(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
        update_moment: UpdateOn,
    ) -> Result<(), Box<dyn Error>> {
        let updatable: (&mut dyn Updatable, UpdateOn) = match self {
            VariableFunction::Map(func, update_on, ..) => (func, *update_on),
            VariableFunction::MapMany(func, update_on, ..) => (func, *update_on),
            VariableFunction::Reduce(func, update_on, ..) => (func, *update_on),
            VariableFunction::ToObject(func, update_on, ..) => (func, *update_on),
            VariableFunction::ToEvent(func, update_on, ..) => (func, *update_on),
        };

        if updatable.1 == update_moment {
            updatable.0.update(sim_connect, variables)?;
        }

        Ok(())
    }
}

trait Updatable {
    fn update(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>>;
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

/// Declares when to write the variable to the event.
#[derive(Clone, Copy)]
pub enum VariableToEventWriteOn {
    /// Writes the variable to the event after every tick.
    EveryTick,

    /// Writes the variable to the event when the variable's value has changed.
    Change,
}

#[derive(Clone, Copy, Default)]
pub struct EventToVariableOptions {
    mask: bool,
    ignore_repeats_for: Duration,
    after_tick_set_to: Option<f64>,
    bidirectional: Option<(VariableToEventMapping, VariableToEventWriteOn)>,
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

    pub fn bidirectional(
        mut self,
        mapping: VariableToEventMapping,
        write_on: VariableToEventWriteOn,
    ) -> Self {
        self.bidirectional = Some((mapping, write_on));
        self
    }

    fn is_bidirectional(&self) -> bool {
        self.bidirectional.is_some()
    }
}

struct EventToVariable {
    event_id: u32,
    event_last_handled: Option<Instant>,
    event_handled_before_tick: bool,
    target: VariableIdentifier,
    mapping: EventToVariableMapping,
    options: EventToVariableOptions,
    to_event: Option<ToEvent>,
}

impl EventToVariable {
    fn new(
        sim_connect: &mut SimConnect,
        event_name: &str,
        mapping: EventToVariableMapping,
        target: VariableIdentifier,
        options: EventToVariableOptions,
    ) -> Result<Self, Box<dyn Error>> {
        let event_id = sim_connect.map_client_event_to_sim_event(event_name, options.mask)?;

        Ok(Self {
            event_id,
            event_last_handled: None,
            event_handled_before_tick: false,
            target,
            mapping,
            to_event: if options.is_bidirectional() {
                let (to_event_mapping, to_event_write_on) = options.bidirectional.unwrap_or((
                    VariableToEventMapping::EventDataRaw,
                    VariableToEventWriteOn::Change,
                ));
                Some(ToEvent::new_with_event_id(
                    target,
                    to_event_mapping,
                    to_event_write_on,
                    event_id,
                ))
            } else {
                None
            },
            options,
        })
    }

    fn should_handle_event(&self) -> bool {
        match self.event_last_handled {
            Some(instant) => instant.elapsed() > self.options.ignore_repeats_for,
            None => true,
        }
    }

    fn set_variable_after_tick(&mut self, variables: &mut MsfsVariableRegistry) {
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
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        if let Some(to_event) = &mut self.to_event {
            to_event.update(sim_connect, variables)?;
        }

        Ok(())
    }

    fn map_to_value(
        &self,
        e: &msfs::sys::SIMCONNECT_RECV_EVENT,
        variables: &mut MsfsVariableRegistry,
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
            EventToVariableMapping::SmoothPress(..) => variables.read(&self.target).unwrap_or(0.),
        }
    }

    fn adjust_smooth_pressed_value(
        &mut self,
        delta: Duration,
        variables: &mut MsfsVariableRegistry,
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
        variables: &mut MsfsVariableRegistry,
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

    fn pre_tick(&mut self, delta: Duration, variables: &mut MsfsVariableRegistry) {
        self.adjust_smooth_pressed_value(delta, variables);
    }

    fn post_tick(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
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
}

impl Updatable for Reduce {
    fn update(
        &mut self,
        _: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let values = identifiers_to_values(&self.input_variable_identifiers, variables);
        let result = values.into_iter().reduce(self.func).unwrap_or(0.);
        variables.write(&self.output_variable_identifier, result);

        Ok(())
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
}

impl Updatable for Map {
    fn update(
        &mut self,
        _: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let value = match variables.read(&self.input_variable_identifier) {
            Some(value) => value,
            None => panic!("Attempted to map a variable which is unavailable."),
        };

        variables.write(&self.output_variable_identifier, (self.func)(value));

        Ok(())
    }
}

struct MapMany {
    input_variable_identifiers: Vec<VariableIdentifier>,
    func: fn(&[f64]) -> f64,
    output_variable_identifier: VariableIdentifier,
}

impl MapMany {
    fn new(
        input_variable_identifiers: Vec<VariableIdentifier>,
        func: fn(&[f64]) -> f64,
        output_variable_identifier: VariableIdentifier,
    ) -> Self {
        Self {
            input_variable_identifiers,
            func,
            output_variable_identifier,
        }
    }
}

impl Updatable for MapMany {
    fn update(
        &mut self,
        _: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let values = identifiers_to_values(&self.input_variable_identifiers, variables);
        let result = (self.func)(&values);
        variables.write(&self.output_variable_identifier, result);

        Ok(())
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
}

impl Updatable for ToObject {
    fn update(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
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

struct ToEvent {
    input: VariableIdentifier,
    mapping: VariableToEventMapping,
    write_on: VariableToEventWriteOn,
    event_id: u32,
    last_written_value: Option<f64>,
}

impl ToEvent {
    fn new(
        sim_connect: &mut SimConnect,
        input: VariableIdentifier,
        mapping: VariableToEventMapping,
        write_on: VariableToEventWriteOn,
        event_name: &str,
    ) -> Result<Self, Box<dyn Error>> {
        Ok(Self {
            input,
            mapping,
            write_on,
            event_id: sim_connect.map_client_event_to_sim_event(event_name, false)?,
            last_written_value: None,
        })
    }

    fn new_with_event_id(
        input: VariableIdentifier,
        mapping: VariableToEventMapping,
        write_on: VariableToEventWriteOn,
        event_id: u32,
    ) -> Self {
        Self {
            input,
            mapping,
            write_on,
            event_id,
            last_written_value: None,
        }
    }
}

impl Updatable for ToEvent {
    fn update(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let value = variables.read(&self.input).unwrap_or(0.);
        let should_write = match self.write_on {
            VariableToEventWriteOn::EveryTick => true,
            VariableToEventWriteOn::Change => match self.last_written_value {
                Some(last_written_value) => value != last_written_value,
                None => true,
            },
        };

        if should_write {
            sim_connect.transmit_client_event(
                SIMCONNECT_OBJECT_ID_USER,
                self.event_id,
                match self.mapping {
                    VariableToEventMapping::EventDataRaw => value as u32,
                    VariableToEventMapping::EventData32kPosition => {
                        f64_to_sim_connect_32k_pos(value)
                    }
                },
            )?;
            self.last_written_value = Some(value);
        }

        Ok(())
    }
}

fn identifiers_to_values(
    identifiers: &[VariableIdentifier],
    variables: &mut MsfsVariableRegistry,
) -> Vec<f64> {
    identifiers
        .iter()
        .map(
            |variable_identifier| match variables.read(variable_identifier) {
                Some(value) => value,
                None => {
                    panic!("Attempted to access variables which are unavailable.")
                }
            },
        )
        .collect()
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
