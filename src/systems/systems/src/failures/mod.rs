use crate::simulation::SimulationElement;

#[derive(Clone, Copy, PartialEq)]
pub enum FailureType {
    TransformerRectifier(usize),
    GreenReservoirLeak,
    BlueReservoirLeak,
    YellowReservoirLeak,
}

pub struct Failure {
    failure_type: FailureType,
    is_active: bool,
}
impl Failure {
    pub fn new(failure_type: FailureType) -> Self {
        Self {
            failure_type,
            is_active: false,
        }
    }

    pub fn is_active(&self) -> bool {
        self.is_active
    }
}
impl SimulationElement for Failure {
    fn receive_failure(&mut self, failure_type: FailureType, is_active: bool) {
        if failure_type == self.failure_type {
            self.is_active = is_active;
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn starts_in_a_non_failed_state() {
        let failure = Failure::new(FailureType::TransformerRectifier(1));
        assert!(!failure.is_active());
    }

    #[test]
    fn becomes_failed_when_matching_failure_indicated() {
        let mut test_bed =
            SimulationTestBed::from(Failure::new(FailureType::TransformerRectifier(1)));
        test_bed.fail(FailureType::TransformerRectifier(1));
        test_bed.run();

        assert!(test_bed.query_element(|el| el.is_active()));
    }

    #[test]
    fn does_not_become_failed_when_non_matching_failure_indicated() {
        let mut test_bed =
            SimulationTestBed::from(Failure::new(FailureType::TransformerRectifier(1)));
        test_bed.fail(FailureType::TransformerRectifier(2));
        test_bed.run();

        assert!(test_bed.query_element(|el| !el.is_active()));
    }
}
