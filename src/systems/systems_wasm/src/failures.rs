use std::collections::HashMap;

use super::SimulatorAspect;
use msfs::legacy::NamedVariable;
use systems::failures::FailureType;

pub struct Failures {
    activate_sim_var: NamedVariable,
    sim_var_value_to_failure_type: HashMap<u64, FailureType>,
}
impl Failures {
    pub fn new(activate_sim_var_name: &'static str) -> Self {
        Self {
            activate_sim_var: NamedVariable::from(&activate_sim_var_name),
            sim_var_value_to_failure_type: HashMap::new(),
        }
    }

    pub fn add(&mut self, sim_var_value: u64, failure_type: FailureType) {
        self.sim_var_value_to_failure_type
            .insert(sim_var_value, failure_type);
    }
}
impl SimulatorAspect for Failures {
    fn read_failure_activate(&mut self) -> Option<systems::failures::FailureType> {
        let sim_var_value: f64 = self.activate_sim_var.get_value();
        if let Some(failure_type) = self
            .sim_var_value_to_failure_type
            .get(&(sim_var_value as u64))
        {
            self.activate_sim_var.set_value(0.);
            Some(*failure_type)
        } else {
            None
        }
    }
}
