use crate::{MsfsVariableRegistry, SimulatorAspect};
use msfs::{
    legacy::NamedVariable,
    sim_connect::{SimConnect, SimConnectRecv},
};
use std::error::Error;
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
}

/// Declares how to map the given event to a variable value.
pub enum EventToVariableMapping {
    /// When the event occurs, sets the variable to the given value.
    Value(f64),

    /// When the event occurs, calls the function with event data and sets
    /// the variable to the returned value.
    EventDataToValue(fn(u32) -> f64),

    /// When the event occurs, calls the function with the current variable value and
    /// sets the variable to the returned value.
    VariableValueFn(fn(f64) -> f64),

    /// When the event occurs, calls the function with event data and the current
    /// variable value and sets the variable to the returned value.
    EventDataAndVariableValueFn(fn(u32, f64) -> f64),
}

/// Declares a variable of a given type with a given name.
pub enum Variable {
    /// A variable accessible within the aspect and simulation.
    Aspect(String),

    /// A named variable accessible within the aspect, simulation and simulator.
    Named(String),
}

#[derive(Default)]
pub struct EventToVariableOptions {
    mask: bool,
}

impl EventToVariableOptions {
    pub fn none() -> Self {
        Self::default()
    }

    pub fn mask(mut self) -> Self {
        self.mask = true;
        self
    }
}

struct EventToVariable {
    event_id: u32,
    variable_identifier: Option<VariableIdentifier>,
    named_variable: Option<NamedVariable>,
    value: f64,
    mapping: EventToVariableMapping,
    target: Variable,
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
            mapping,
            target,
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
                let mapped_value = match self.mapping {
                    EventToVariableMapping::Value(value) => value,
                    EventToVariableMapping::EventDataToValue(func) => func(e.data()),
                    EventToVariableMapping::VariableValueFn(func) => func(self.value()),
                    EventToVariableMapping::EventDataAndVariableValueFn(func) => {
                        func(e.data(), self.value())
                    }
                };
                self.set_value(mapped_value);
                true
            }
            _ => false,
        }
    }
}
