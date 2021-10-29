use fxhash::FxHashMap;
use msfs::legacy::NamedVariable;

use systems::failures::FailureType;

pub(super) struct Failures {
    activate_sim_var: NamedVariable,
    deactivate_sim_var: NamedVariable,
    identifier_to_failure_type: FxHashMap<u64, FailureType>,
}
impl Failures {
    pub(super) fn new(activate_sim_var: NamedVariable, deactivate_sim_var: NamedVariable) -> Self {
        Self {
            activate_sim_var,
            deactivate_sim_var,
            identifier_to_failure_type: FxHashMap::default(),
        }
    }

    pub(super) fn add(&mut self, identifier: u64, failure_type: FailureType) {
        self.identifier_to_failure_type
            .insert(identifier, failure_type);
    }

    pub(super) fn read_failure_activate(&self) -> Option<FailureType> {
        self.read_failure(&self.activate_sim_var)
    }

    pub(super) fn read_failure_deactivate(&self) -> Option<FailureType> {
        self.read_failure(&self.deactivate_sim_var)
    }

    fn read_failure(&self, from: &NamedVariable) -> Option<FailureType> {
        let identifier: f64 = from.get_value();
        if let Some(failure_type) = self.identifier_to_failure_type.get(&(identifier as u64)) {
            from.set_value(0.);
            Some(*failure_type)
        } else {
            None
        }
    }
}
