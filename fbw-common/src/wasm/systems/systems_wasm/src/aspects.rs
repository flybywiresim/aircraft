use crate::{
    f64_to_sim_connect_32k_pos, sim_connect_32k_pos_inv_to_f64, sim_connect_32k_pos_to_f64,
    MsfsVariableRegistry, Variable,
};
use enum_dispatch::enum_dispatch;
use msfs::sim_connect::{SimConnect, SimConnectRecv, SIMCONNECT_OBJECT_ID_USER};
use msfs::sys;
use std::error::Error;
use std::time::{Duration, Instant};
use systems::simulation::VariableIdentifier;

/// A concern that should be handled by the bridging layer. Examples are
/// the handling of events which move flaps up and down, triggering of brakes, etc.
pub(super) trait Aspect {
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

    /// Attempts to handle the given message, returning true
    /// when the message was handled and false otherwise.
    fn handle_message(
        &mut self,
        _message: &SimConnectRecv,
        _variables: &mut MsfsVariableRegistry,
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

/// Type used to configure an aspect of the connectivity between MSFS and the simulation.
///
/// It should be noted that the resulting aspect executes its tasks in the order in which they
/// were declared. Declaration order is important when one action depends on another action.
/// When e.g. a variable that is mapped should then be written to an event, be sure to
/// declare the mapping before the event writing.
pub struct MsfsAspectBuilder<'a, 'b> {
    sim_connect: &'a mut SimConnect<'b>,
    variables: &'a mut MsfsVariableRegistry,
    message_handlers: Vec<MessageHandler>,
    actions: Vec<(VariableAction, ExecuteOn)>,
}

impl<'a, 'b> MsfsAspectBuilder<'a, 'b> {
    pub fn new(
        sim_connect: &'a mut SimConnect<'b>,
        variables: &'a mut MsfsVariableRegistry,
    ) -> Self {
        Self {
            sim_connect,
            variables,
            message_handlers: Default::default(),
            actions: Default::default(),
        }
    }

    pub fn build(self) -> MsfsAspect {
        MsfsAspect::new(self.message_handlers, self.actions)
    }

    /// Initialise the variable with the given value.
    pub fn init_variable(&mut self, variable: Variable, value: f64) {
        Self::precondition_not_aircraft_variable(&variable);

        let identifier = self.variables.register(&variable);
        self.variables.write(&identifier, value);
    }

    /// Copy a variable's value to another variable.
    pub fn copy(&mut self, input: Variable, output: Variable) {
        Self::precondition_not_aircraft_variable(&output);

        let input = self.variables.register(&input);
        let output = self.variables.register(&output);

        self.actions.push((
            Map::new(input, |value| value, output).into(),
            ExecuteOn::PreTick,
        ));
    }

    /// Map a variable's value to another variable, applying the given function in the process.
    pub fn map(
        &mut self,
        execute_on: ExecuteOn,
        input: Variable,
        func: fn(f64) -> f64,
        output: Variable,
    ) {
        Self::precondition_not_aircraft_variable(&output);

        let inputs = self.variables.register(&input);
        let output = self.variables.register(&output);

        self.actions
            .push((Map::new(inputs, func, output).into(), execute_on));
    }

    /// Map a set of variable values to another variable.
    pub fn map_many(
        &mut self,
        execute_on: ExecuteOn,
        inputs: Vec<Variable>,
        func: fn(&[f64]) -> f64,
        output: Variable,
    ) {
        Self::precondition_not_aircraft_variable(&output);

        let inputs = self.variables.register_many(&inputs);
        let output = self.variables.register(&output);

        self.actions
            .push((MapMany::new(inputs, func, output).into(), execute_on));
    }

    /// Reduce a set of variable values into one output value and write it to a variable.
    pub fn reduce(
        &mut self,
        execute_on: ExecuteOn,
        inputs: Vec<Variable>,
        init: f64,
        func: fn(f64, f64) -> f64,
        output: Variable,
    ) {
        Self::precondition_not_aircraft_variable(&output);

        let inputs = self.variables.register_many(&inputs);
        let output = self.variables.register(&output);

        self.actions
            .push((Reduce::new(inputs, init, func, output).into(), execute_on));
    }

    /// Write a set of variables to an object.
    pub fn variables_to_object(&mut self, instance: Box<dyn VariablesToObject>) {
        let variables = self.variables.register_many(&instance.variables());

        self.actions.push((
            ToObject::new(instance, variables).into(),
            ExecuteOn::PostTick,
        ));
    }

    /// Convert event occurrences to a variable.
    ///
    /// If you want to write a variable back to the same event, then use the
    /// event id returned by this method and pass it to [Self::variable_to_event_id].
    pub fn event_to_variable(
        &mut self,
        event_name: &str,
        mapping: EventToVariableMapping,
        target: Variable,
        configure_options: fn(EventToVariableOptions) -> EventToVariableOptions,
    ) -> Result<sys::DWORD, Box<dyn Error>> {
        Self::precondition_not_aircraft_variable(&target);

        let target = self.variables.register(&target);

        let event_to_variable = EventToVariable::new(
            self.sim_connect,
            event_name,
            mapping,
            target,
            configure_options(EventToVariableOptions::default()),
        )?;

        let event_id = event_to_variable.event_id;

        self.message_handlers.push(event_to_variable.into());

        Ok(event_id)
    }

    /// Write the variable's value to an event. If you use [Self::event_to_variable] for the same
    /// event, then you should use [Self::variable_to_event_id] instead.
    pub fn variable_to_event(
        &mut self,
        input: Variable,
        mapping: VariableToEventMapping,
        write_on: VariableToEventWriteOn,
        event_name: &str,
    ) -> Result<(), Box<dyn Error>> {
        let input = self.variables.register(&input);

        self.actions.push((
            ToEvent::new(self.sim_connect, input, mapping, write_on, event_name)?.into(),
            ExecuteOn::PostTick,
        ));

        Ok(())
    }

    /// Write the variable's value to an event with the given event id. This function should be used
    /// when you previously acquired an event id using [Self::event_to_variable].
    pub fn variable_to_event_id(
        &mut self,
        input: Variable,
        mapping: VariableToEventMapping,
        write_on: VariableToEventWriteOn,
        event_id: sys::DWORD,
    ) {
        let input = self.variables.register(&input);

        self.actions.push((
            ToEvent::new_with_event_id(input, mapping, write_on, event_id).into(),
            ExecuteOn::PostTick,
        ));
    }

    /// Execute the given function whenever any of the observed variable values changes.
    pub fn on_change(&mut self, execute_on: ExecuteOn, observed: Vec<Variable>, func: OnChangeFn) {
        let observed = self.variables.register_many(&observed);
        let starting_values = self.variables.read_many(&observed);

        self.actions.push((
            OnChange::new(observed, starting_values, func).into(),
            execute_on,
        ));
    }

    fn precondition_not_aircraft_variable(variable: &Variable) {
        if matches!(variable, Variable::Aircraft(..)) {
            eprintln!("Writing to variable '{}' is unsupported.", variable);
        }
    }
}

pub struct MsfsAspect {
    message_handlers: Vec<MessageHandler>,
    actions: Vec<(VariableAction, ExecuteOn)>,
}

impl MsfsAspect {
    fn new(
        message_handlers: Vec<MessageHandler>,
        actions: Vec<(VariableAction, ExecuteOn)>,
    ) -> Self {
        Self {
            message_handlers,
            actions,
        }
    }

    fn execute_actions(
        &mut self,
        sim_connect: &mut SimConnect,
        execute_moment: ExecuteOn,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        self.actions
            .iter_mut()
            .try_for_each(|(action, execute_on)| {
                if *execute_on == execute_moment {
                    action.execute(sim_connect, variables)?;
                }

                Ok(())
            })
    }
}

impl Aspect for MsfsAspect {
    fn handle_message(
        &mut self,
        message: &SimConnectRecv,
        variables: &mut MsfsVariableRegistry,
    ) -> bool {
        self.message_handlers
            .iter_mut()
            .any(|handler| handler.handle(message, variables))
    }

    fn pre_tick(
        &mut self,
        variables: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
        delta: Duration,
    ) -> Result<(), Box<dyn Error>> {
        self.message_handlers
            .iter_mut()
            .for_each(|ev| ev.pre_tick(variables, delta));

        self.execute_actions(sim_connect, ExecuteOn::PreTick, variables)?;

        Ok(())
    }

    fn post_tick(
        &mut self,
        variables: &mut MsfsVariableRegistry,
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        self.execute_actions(sim_connect, ExecuteOn::PostTick, variables)?;

        self.message_handlers
            .iter_mut()
            .for_each(|ev| ev.post_tick(variables));

        Ok(())
    }
}

#[derive(Clone, Copy, PartialEq, Eq)]
/// Declares when to execute the action.
pub enum ExecuteOn {
    PreTick,
    PostTick,
}

#[enum_dispatch]
enum VariableAction {
    Map,
    MapMany,
    Reduce,
    ToObject,
    ToEvent,
    OnChange,
}

#[enum_dispatch(VariableAction)]
trait ExecutableVariableAction {
    fn execute(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>>;
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

impl ExecutableVariableAction for Map {
    fn execute(
        &mut self,
        _: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let value = variables.read(&self.input_variable_identifier);
        variables.write(&self.output_variable_identifier, (self.func)(value));

        Ok(())
    }
}

fn precondition_multiple_identifiers(action_name: &str, identifiers: &[VariableIdentifier]) {
    if identifiers.len() < 2 {
        eprintln!(
            "{} requires at least 2 input variables. {} {} provided.",
            action_name,
            identifiers.len(),
            if identifiers.len() == 1 {
                "was"
            } else {
                "were"
            }
        );
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
        precondition_multiple_identifiers("MapMany", &input_variable_identifiers);

        Self {
            input_variable_identifiers,
            func,
            output_variable_identifier,
        }
    }
}

impl ExecutableVariableAction for MapMany {
    fn execute(
        &mut self,
        _: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let values: Vec<f64> = variables.read_many(&self.input_variable_identifiers);

        let result = (self.func)(&values);
        variables.write(&self.output_variable_identifier, result);

        Ok(())
    }
}

struct Reduce {
    input_variable_identifiers: Vec<VariableIdentifier>,
    init: f64,
    func: fn(f64, f64) -> f64,
    output_variable_identifier: VariableIdentifier,
}

impl Reduce {
    fn new(
        input_variable_identifiers: Vec<VariableIdentifier>,
        init: f64,
        func: fn(f64, f64) -> f64,
        output_variable_identifier: VariableIdentifier,
    ) -> Self {
        precondition_multiple_identifiers("Reduce", &input_variable_identifiers);

        Self {
            input_variable_identifiers,
            init,
            func,
            output_variable_identifier,
        }
    }
}

impl ExecutableVariableAction for Reduce {
    fn execute(
        &mut self,
        _: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let result = variables
            .read_many(&self.input_variable_identifiers)
            .into_iter()
            .fold(self.init, self.func);

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

#[derive(PartialEq, Eq)]
pub enum ObjectWrite {
    Ignore,
    ToSim,
}
impl ObjectWrite {
    pub fn on(condition: bool) -> Self {
        if condition {
            Self::ToSim
        } else {
            Self::Ignore
        }
    }
}
impl Default for ObjectWrite {
    fn default() -> Self {
        Self::ToSim
    }
}

/// Write function provides the output to know if the object will be written to sim or not
pub trait VariablesToObject {
    fn variables(&self) -> Vec<Variable>;
    fn write(&mut self, values: Vec<f64>) -> ObjectWrite;
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

impl ExecutableVariableAction for ToObject {
    fn execute(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let values: Vec<f64> = self
            .variables
            .iter()
            .map(|variable_identifier| variables.read(variable_identifier))
            .collect();

        if self.target_object.write(values) == ObjectWrite::ToSim {
            self.target_object.set_data_on_sim_object(sim_connect)?;
        }

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

#[enum_dispatch]
enum Debounce {
    None(NoDebounce),
    Leading(LeadingDebounce),
}

#[enum_dispatch(Debounce)]
trait Debouncer {
    fn should_handle(&self) -> bool;
    fn notify_handled(&mut self);
    fn post_tick(&mut self, variables: &mut MsfsVariableRegistry);
}

#[derive(Default)]
struct NoDebounce {
    event_handled_before_tick: bool,
    reset_to: Option<(VariableIdentifier, f64)>,
}

impl NoDebounce {
    fn new(reset_to: Option<(VariableIdentifier, f64)>) -> Self {
        Self {
            event_handled_before_tick: false,
            reset_to,
        }
    }
}

impl Debouncer for NoDebounce {
    fn should_handle(&self) -> bool {
        true
    }

    fn notify_handled(&mut self) {
        self.event_handled_before_tick = true;
    }

    fn post_tick(&mut self, variables: &mut MsfsVariableRegistry) {
        if let Some((variable, value)) = &self.reset_to {
            variables.write(variable, *value);
        }

        self.event_handled_before_tick = false;
    }
}

struct LeadingDebounce {
    duration: Duration,
    handled_at: Option<Instant>,
    reset_to: Option<(VariableIdentifier, f64)>,
}

impl LeadingDebounce {
    fn new(duration: Duration, reset_to: Option<(VariableIdentifier, f64)>) -> Self {
        Self {
            duration,
            handled_at: None,
            reset_to,
        }
    }

    fn exceeded_debounce_duration(&self) -> bool {
        self.handled_at
            .map(|instant| instant.elapsed() > self.duration)
            .unwrap_or(true)
    }
}

impl Debouncer for LeadingDebounce {
    fn should_handle(&self) -> bool {
        self.exceeded_debounce_duration()
    }

    fn notify_handled(&mut self) {
        self.handled_at = Some(Instant::now());
    }

    fn post_tick(&mut self, variables: &mut MsfsVariableRegistry) {
        if self.handled_at.is_some() && self.exceeded_debounce_duration() {
            if let Some((variable, value)) = &self.reset_to {
                variables.write(variable, *value);
            }

            self.handled_at = None;
        }
    }
}

#[derive(Clone, Copy, Default)]
/// Configurable options for event to variable handling.
pub struct EventToVariableOptions {
    mask: bool,
    leading_debounce_duration: Option<Duration>,
    reset_to: Option<f64>,
}

impl EventToVariableOptions {
    /// Masks the event, causing the simulator to ignore it, and only this module to receive it.
    pub fn mask(mut self) -> Self {
        self.mask = true;
        self
    }

    /// Apply a leading debounce to the event handling. Leading debounce immediately executes
    /// the action associated with the event, but ignores any subsequent event until no event
    /// triggered for the given duration.
    ///
    /// This is useful to deal with poor MSFS event handling, e.g. events being triggered
    /// repeatedly despite only one press occurring.
    pub fn leading_debounce(mut self, duration: Duration) -> Self {
        self.leading_debounce_duration = Some(duration);
        self
    }

    /// Sets the value to which the variable should be reset after the event occurred and any
    /// debounce duration has passed.
    pub fn afterwards_reset_to(mut self, value: f64) -> Self {
        self.reset_to = Some(value);
        self
    }
}

/// Declares how to map the given event to a variable value.
pub enum EventToVariableMapping {
    /// When the event occurs, sets the variable to the given value.
    Value(f64),

    /// Maps the event data from a sys::DWORD to an [f64] without any further processing.
    EventDataRaw,

    /// Maps the event data from a 32k position to an [f64].
    EventData32kPosition,

    /// Maps the event data from a 32k position to an [f64] and inverts it.
    EventData32kPositionInverted,

    /// When the event occurs, calls the function with event data and sets
    /// the variable to the returned value.
    EventDataToValue(fn(sys::DWORD) -> f64),

    /// When the event occurs, calls the function with the current variable value and
    /// sets the variable to the returned value.
    CurrentValueToValue(fn(f64) -> f64),

    /// When the event occurs, calls the function with event data and the current
    /// variable value and sets the variable to the returned value.
    EventDataAndCurrentValueToValue(fn(sys::DWORD, f64) -> f64),

    /// Converts the event occurrence to a value which increases and decreases
    /// by the given factors.
    SmoothPress(f64, f64),
}

#[enum_dispatch]
enum MessageHandler {
    EventToVariable,
}

#[enum_dispatch(MessageHandler)]
trait HandleMessages {
    fn handle(&mut self, message: &SimConnectRecv, variables: &mut MsfsVariableRegistry) -> bool;
    fn pre_tick(&mut self, variables: &mut MsfsVariableRegistry, delta: Duration);
    fn post_tick(&mut self, variables: &mut MsfsVariableRegistry);
}

struct EventToVariable {
    event_id: sys::DWORD,
    event_handled_before_tick: bool,
    target: VariableIdentifier,
    mapping: EventToVariableMapping,
    debounce: Debounce,
}

impl EventToVariable {
    fn new(
        sim_connect: &mut SimConnect,
        event_name: &str,
        mapping: EventToVariableMapping,
        target: VariableIdentifier,
        options: EventToVariableOptions,
    ) -> Result<Self, Box<dyn Error>> {
        let reset_to = options.reset_to.map(|value| (target, value));
        let debounce = if let Some(duration) = options.leading_debounce_duration {
            LeadingDebounce::new(duration, reset_to).into()
        } else {
            NoDebounce::new(reset_to).into()
        };

        Ok(Self {
            event_id: sim_connect.map_client_event_to_sim_event(event_name, options.mask)?,
            event_handled_before_tick: false,
            target,
            mapping,
            debounce,
        })
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
            EventToVariableMapping::EventData32kPositionInverted => {
                sim_connect_32k_pos_inv_to_f64(e.data())
            }
            EventToVariableMapping::EventDataToValue(func) => func(e.data()),
            EventToVariableMapping::CurrentValueToValue(func) => func(variables.read(&self.target)),
            EventToVariableMapping::EventDataAndCurrentValueToValue(func) => {
                func(e.data(), variables.read(&self.target))
            }
            EventToVariableMapping::SmoothPress(..) => variables.read(&self.target),
        }
    }

    fn adjust_smooth_pressed_value(
        &mut self,
        delta: Duration,
        variables: &mut MsfsVariableRegistry,
    ) {
        if let EventToVariableMapping::SmoothPress(press_factor, release_factor) = self.mapping {
            let mut value = variables.read(&self.target);
            if self.event_handled_before_tick {
                value += delta.as_secs_f64() * press_factor;
            } else {
                value -= delta.as_secs_f64() * release_factor;
            }

            variables.write(&self.target, value.clamp(0., 1.));
        }
    }
}

impl HandleMessages for EventToVariable {
    fn handle(&mut self, message: &SimConnectRecv, variables: &mut MsfsVariableRegistry) -> bool {
        match message {
            SimConnectRecv::Event(e) if e.id() == self.event_id => {
                if self.debounce.should_handle() {
                    let mapped_value = self.map_to_value(e, variables);
                    variables.write(&self.target, mapped_value);

                    self.debounce.notify_handled();
                    self.event_handled_before_tick = true;
                }

                true
            }
            _ => false,
        }
    }

    fn pre_tick(&mut self, variables: &mut MsfsVariableRegistry, delta: Duration) {
        self.adjust_smooth_pressed_value(delta, variables);
    }

    fn post_tick(&mut self, variables: &mut MsfsVariableRegistry) {
        self.debounce.post_tick(variables);
        self.event_handled_before_tick = false;
    }
}

#[derive(Clone, Copy)]
/// Declares how to map the given variable value to an event value.
pub enum VariableToEventMapping {
    /// Maps the variable from an [f64] to a sys::DWORD without any further processing.
    EventDataRaw,

    /// Maps the variable from an [f64] to a 32k position.
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

struct ToEvent {
    input: VariableIdentifier,
    mapping: VariableToEventMapping,
    write_on: VariableToEventWriteOn,
    event_id: sys::DWORD,
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
        event_id: sys::DWORD,
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

impl ExecutableVariableAction for ToEvent {
    fn execute(
        &mut self,
        sim_connect: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let value = variables.read(&self.input);
        let should_write = match self.write_on {
            VariableToEventWriteOn::EveryTick => true,
            VariableToEventWriteOn::Change => match self.last_written_value {
                // Allow floating point equality comparison, because we really care about the
                // value being exactly equal and assume that the code that changes this value
                // is equal for every simulation tick.
                #[allow(clippy::float_cmp)]
                Some(last_written_value) => value != last_written_value,
                None => true,
            },
        };

        if should_write {
            sim_connect.transmit_client_event(
                SIMCONNECT_OBJECT_ID_USER,
                self.event_id,
                match self.mapping {
                    VariableToEventMapping::EventDataRaw => value as sys::DWORD,
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

type OnChangeFn = Box<dyn Fn(&[f64], &[f64])>;

struct OnChange {
    observed_variables: Vec<VariableIdentifier>,
    previous_values: Vec<f64>,
    func: OnChangeFn,
}

impl OnChange {
    fn new(
        observed_variables: Vec<VariableIdentifier>,
        starting_values: Vec<f64>,
        func: OnChangeFn,
    ) -> Self {
        Self {
            observed_variables,
            previous_values: starting_values,
            func,
        }
    }
}

impl ExecutableVariableAction for OnChange {
    fn execute(
        &mut self,
        _: &mut SimConnect,
        variables: &mut MsfsVariableRegistry,
    ) -> Result<(), Box<dyn Error>> {
        let current_values: Vec<f64> = variables.read_many(&self.observed_variables);

        // Allow floating point equality comparison, because we really care about the
        // value being exactly equal and assume that the code that changes this value
        // is equal for every simulation tick.
        #[allow(clippy::float_cmp)]
        let has_changed = self
            .previous_values
            .iter()
            .zip(&current_values)
            .any(|(previous, current)| previous != current);

        if has_changed {
            (self.func)(&self.previous_values, &current_values);
        }

        self.previous_values = current_values;

        Ok(())
    }
}
