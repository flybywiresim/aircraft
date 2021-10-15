use fxhash::FxHashMap;

use msfs::legacy::NamedVariable;
use systems::failures::FailureType;

pub struct Failures {
    activate_sim_var: NamedVariable,
    deactivate_sim_var: NamedVariable,
    sim_var_value_to_failure_type: FxHashMap<u64, FailureType>,
}
impl Failures {
    pub fn new(activate_sim_var: NamedVariable, deactivate_sim_var: NamedVariable) -> Self {
        Self {
            activate_sim_var,
            deactivate_sim_var,
            sim_var_value_to_failure_type: FxHashMap::default(),
        }
    }

    pub fn add(&mut self, sim_var_value: u64, failure_type: FailureType) {
        self.sim_var_value_to_failure_type
            .insert(sim_var_value, failure_type);
    }

    pub(super) fn read_failure_activate(&self) -> Option<FailureType> {
        self.read_failure(&self.activate_sim_var)
    }

    pub(super) fn read_failure_deactivate(&self) -> Option<FailureType> {
        self.read_failure(&self.deactivate_sim_var)
    }

    fn read_failure(&self, from: &NamedVariable) -> Option<FailureType> {
        let sim_var_value: f64 = from.get_value();
        if let Some(failure_type) = self
            .sim_var_value_to_failure_type
            .get(&(sim_var_value as u64))
        {
            from.set_value(0.);
            Some(*failure_type)
        } else {
            None
        }
    }
}
