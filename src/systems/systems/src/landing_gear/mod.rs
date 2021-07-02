use crate::{
    shared::{LandingGearPosition, LandingGearWeightOnWheels},
    simulation::{Read, SimulationElement, SimulatorReader},
};
use uom::si::{
    f64::*,
    ratio::{percent, ratio},
};

/// Represents a landing gear on Airbus aircraft.
/// Note that this type somewhat hides the gear's position.
/// The real aircraft also can only check whether or not the gear is up and
/// locked or down and locked. No in between state.
/// It provides as well the state of all weight on wheel sensors
pub struct LandingGear {
    position: Ratio,

    center_weight_on_wheel_sensor_on_ground: bool,
    left_weight_on_wheel_sensor_on_ground: bool,
    right_weight_on_wheel_sensor_on_ground: bool,
}
impl LandingGear {
    const GEAR_CENTER_POSITION: &'static str = "GEAR CENTER POSITION";

    pub const GEAR_CENTER_COMPRESSION: &'static str = "GEAR ANIMATION POSITION";
    pub const GEAR_LEFT_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:1";
    pub const GEAR_RIGHT_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:2";

    // Is extended at 0.5, we set a super small margin of 0.02 from fully extended so 0.52
    const COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO: f64 = 0.52;

    pub fn new() -> Self {
        Self {
            position: Ratio::new::<percent>(0.),

            center_weight_on_wheel_sensor_on_ground: false,
            left_weight_on_wheel_sensor_on_ground: false,
            right_weight_on_wheel_sensor_on_ground: false,
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
impl LandingGearWeightOnWheels for LandingGear {
    fn center_gear_on_ground(&self) -> bool {
        self.center_weight_on_wheel_sensor_on_ground
    }

    fn any_main_gear_on_ground(&self) -> bool {
        self.left_weight_on_wheel_sensor_on_ground || self.right_weight_on_wheel_sensor_on_ground
    }

    fn all_main_gear_on_ground(&self) -> bool {
        self.left_weight_on_wheel_sensor_on_ground && self.right_weight_on_wheel_sensor_on_ground
    }
}
impl SimulationElement for LandingGear {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.position = reader.read(LandingGear::GEAR_CENTER_POSITION);

        let center_gear_compression: Ratio = reader.read(LandingGear::GEAR_CENTER_COMPRESSION);
        self.center_weight_on_wheel_sensor_on_ground = center_gear_compression
            > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO);

        let left_gear_compression: Ratio = reader.read(LandingGear::GEAR_LEFT_COMPRESSION);
        self.left_weight_on_wheel_sensor_on_ground = left_gear_compression
            > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO);

        let right_gear_compression: Ratio = reader.read(LandingGear::GEAR_RIGHT_COMPRESSION);
        self.right_weight_on_wheel_sensor_on_ground = right_gear_compression
            > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO);
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
    use crate::simulation::{
        test::{SimulationTestBed, TestAircraft, TestBed},
        Write,
    };

    #[test]
    fn is_up_and_locked_returns_false_when_fully_down() {
        let test_bed = run_test_bed_on_with_position(Ratio::new::<percent>(100.));

        assert!(!test_bed.query_element(|e| e.is_up_and_locked()));
    }

    #[test]
    fn is_up_and_locked_returns_false_when_somewhat_down() {
        let test_bed = run_test_bed_on_with_position(Ratio::new::<percent>(1.));

        assert!(!test_bed.query_element(|e| e.is_up_and_locked()));
    }

    #[test]
    fn is_up_and_locked_returns_true_when_fully_up() {
        let test_bed = run_test_bed_on_with_position(Ratio::new::<percent>(0.));

        assert!(test_bed.query_element(|e| e.is_up_and_locked()));
    }

    #[test]
    fn is_down_and_locked_returns_false_when_fully_up() {
        let test_bed = run_test_bed_on_with_position(Ratio::new::<percent>(0.));

        assert!(!test_bed.query_element(|e| e.is_down_and_locked()));
    }

    #[test]
    fn is_down_and_locked_returns_false_when_somewhat_up() {
        let test_bed = run_test_bed_on_with_position(Ratio::new::<percent>(99.));

        assert!(!test_bed.query_element(|e| e.is_down_and_locked()));
    }

    #[test]
    fn is_down_and_locked_returns_true_when_fully_down() {
        let test_bed = run_test_bed_on_with_position(Ratio::new::<percent>(100.));

        assert!(test_bed.query_element(|e| e.is_down_and_locked()));
    }

    #[test]
    fn all_weight_on_wheels_when_all_compressed() {
        let test_bed = run_test_bed_on_with_compression(
            Ratio::new::<ratio>(0.9),
            Ratio::new::<ratio>(0.9),
            Ratio::new::<ratio>(0.9),
        );

        assert!(test_bed.query_element(|e| e.center_gear_on_ground()));
        assert!(test_bed.query_element(|e| e.any_main_gear_on_ground()));
    }

    #[test]
    fn no_weight_on_wheels_when_all_extended() {
        let test_bed = run_test_bed_on_with_compression(
            Ratio::new::<ratio>(0.51),
            Ratio::new::<ratio>(0.51),
            Ratio::new::<ratio>(0.51),
        );

        assert!(!test_bed.query_element(|e| e.center_gear_on_ground()));
        assert!(!test_bed.query_element(|e| e.any_main_gear_on_ground()));
    }

    #[test]
    fn left_weight_on_wheels_only_when_only_left_compressed() {
        let test_bed = run_test_bed_on_with_compression(
            Ratio::new::<ratio>(0.8),
            Ratio::new::<ratio>(0.51),
            Ratio::new::<ratio>(0.51),
        );

        assert!(!test_bed.query_element(|e| e.center_gear_on_ground()));
        assert!(test_bed.query_element(|e| e.any_main_gear_on_ground()));
        assert!(test_bed.query_element(|e| e.left_weight_on_wheel_sensor_on_ground));
        assert!(!test_bed.query_element(|e| e.right_weight_on_wheel_sensor_on_ground));
    }

    fn run_test_bed_on_with_position(
        position: Ratio,
    ) -> SimulationTestBed<TestAircraft<LandingGear>> {
        let mut test_bed = SimulationTestBed::from(LandingGear::new());
        test_bed.write(LandingGear::GEAR_CENTER_POSITION, position);

        test_bed.run();

        test_bed
    }

    fn run_test_bed_on_with_compression(
        left: Ratio,
        center: Ratio,
        right: Ratio,
    ) -> SimulationTestBed<TestAircraft<LandingGear>> {
        let mut test_bed = SimulationTestBed::from(LandingGear::new());
        test_bed.write(LandingGear::GEAR_LEFT_COMPRESSION, left);
        test_bed.write(LandingGear::GEAR_CENTER_COMPRESSION, center);
        test_bed.write(LandingGear::GEAR_RIGHT_COMPRESSION, right);

        test_bed.run();

        test_bed
    }
}
