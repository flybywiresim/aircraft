use crate::{
    f64_to_sim_connect_32k_pos, sim_connect_32k_pos_to_f64, MsfsVariableRegistry, SimulatorAspect,
};
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
        }
    }

    pub fn build(self) -> MsfsAspect {
        let aspect = MsfsAspect::new(self.event_to_variable);

        aspect
    }

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
}

pub struct MsfsAspect {
    event_to_variable: Vec<EventToVariable>,
}

impl MsfsAspect {
    fn new(event_to_variable: Vec<EventToVariable>) -> Self {
        Self { event_to_variable }
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
    }

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.event_to_variable.iter_mut().try_for_each(|ev| {
            ev.post_tick(sim_connect)?;

            Ok(())
        })
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
    variable_identifier: Option<VariableIdentifier>,
    named_variable: Option<NamedVariable>,
    value: f64,
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
            variable_identifier: match &target {
                Variable::Aspect(name) => {
                    Some(variable_registry.add_aspect_variable(name.to_owned()))
                }
                Variable::Named(name) => {
                    Some(variable_registry.add_named_variable(name.to_owned()))
                }
            },
            named_variable: if let Variable::Named(name) = &target {
                Some(NamedVariable::from(&format!("{}{}", key_prefix, name)))
            } else {
                None
            },
            value: 0.,
            last_written_value: None,
            mapping,
            target,
            options,
        })
    }

    fn value(&self) -> f64 {
        match self.target {
            Variable::Named(_) => self.named_variable.as_ref().unwrap().get_value(),
            Variable::Aspect(_) => self.value,
        }
    }

    fn set_value(&mut self, value: f64) {
        match self.target {
            Variable::Named(_) => self.named_variable.as_mut().unwrap().set_value(value),
            Variable::Aspect(_) => self.value = value,
        }
    }

    fn handles_identifier(&self, identifier: &VariableIdentifier) -> bool {
        self.variable_identifier.as_ref().unwrap() == identifier
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

            self.event_handled_before_tick = false;
        }
    }

    fn write_variable_to_event(
        &mut self,
        sim_connect: &mut SimConnect,
    ) -> Result<(), Box<dyn Error>> {
        if self.options.is_bidirectional() {
            let should_write = match self.last_written_value {
                Some(value) => self.value != value,
                None => true,
            };

            if should_write {
                sim_connect.transmit_client_event(
                    SIMCONNECT_OBJECT_ID_USER,
                    self.event_id,
                    match self.options.bidirectional_mapping {
                        Some(VariableToEventMapping::EventDataRaw) | None => self.value as u32,
                        Some(VariableToEventMapping::EventData32kPosition) => {
                            f64_to_sim_connect_32k_pos(self.value)
                        }
                    },
                )?;
                self.last_written_value = Some(self.value);
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
        }
    }
}

impl SimulatorAspect for EventToVariable {
    fn read(&mut self, identifier: &VariableIdentifier) -> Option<f64> {
        match self.target {
            Variable::Aspect(_) if self.handles_identifier(identifier) => Some(self.value),
            // Named variable reading is handled by the VariableRegistry.
            _ => None,
        }
    }

    fn write(&mut self, identifier: &VariableIdentifier, value: f64) -> bool {
        match self.target {
            Variable::Aspect(_) if self.handles_identifier(identifier) => {
                self.value = value;
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

    fn post_tick(&mut self, sim_connect: &mut SimConnect) -> Result<(), Box<dyn Error>> {
        self.write_variable_to_event(sim_connect)?;
        self.set_variable_after_tick();
        Ok(())
    }
}
