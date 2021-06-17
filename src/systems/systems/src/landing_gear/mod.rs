use crate::{
    shared::LandingGearPosition,
    simulation::{Read, SimulationElement, SimulatorReader},
};
use uom::si::{f64::*, ratio::percent};

/// Represents a landing gear on Airbus aircraft.
/// Note that this type somewhat hides the gear's position.
/// The real aircraft also can only check whether or not the gear is up and
/// locked or down and locked. No in between state.
pub struct LandingGear {
    position: Ratio,
}
impl LandingGear {
    const GEAR_CENTER_POSITION: &'static str = "GEAR CENTER POSITION";

    pub fn new() -> Self {
        Self {
            position: Ratio::new::<percent>(0.),
        }
    }
}
impl LandingGearPosition for LandingGear {
    fn is_up_and_locked(&self) -> bool {
        (self.position.get::<percent>() - 0.).abs() < f64::EPSILON
    }

    fn is_down_and_locked(&self) -> bool {
        (self.position.get::<percent>() - 100.).abs() < f64::EPSILON
    }
}
impl SimulationElement for LandingGear {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.position = reader.read(LandingGear::GEAR_CENTER_POSITION);
    }
}
impl Default for LandingGear {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::test::{SimulationTestBed, TestAircraft};

    #[test]
    fn is_up_and_locked_returns_false_when_fully_down() {
        let test_bed = run_test_bed_on(100.);

        assert!(!test_bed.aircraft().element().is_up_and_locked());
    }

    #[test]
    fn is_up_and_locked_returns_false_when_somewhat_down() {
        let test_bed = run_test_bed_on(1.);

        assert!(!test_bed.aircraft().element().is_up_and_locked());
    }

    #[test]
    fn is_up_and_locked_returns_true_when_fully_up() {
        let test_bed = run_test_bed_on(0.);

        assert!(test_bed.aircraft().element().is_up_and_locked());
    }

    #[test]
    fn is_down_and_locked_returns_false_when_fully_up() {
        let test_bed = run_test_bed_on(0.);

        assert!(!test_bed.aircraft().element().is_down_and_locked());
    }

    #[test]
    fn is_down_and_locked_returns_false_when_somewhat_up() {
        let test_bed = run_test_bed_on(99.);

        assert!(!test_bed.aircraft().element().is_down_and_locked());
    }

    #[test]
    fn is_down_and_locked_returns_true_when_fully_down() {
        let test_bed = run_test_bed_on(100.);

        assert!(test_bed.aircraft().element().is_down_and_locked());
    }

    fn run_test_bed_on(position: f64) -> SimulationTestBed<TestAircraft<LandingGear>> {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new(LandingGear::new()));
        test_bed.write_f64(LandingGear::GEAR_CENTER_POSITION, position);

        test_bed.run();

        test_bed
    }
}
