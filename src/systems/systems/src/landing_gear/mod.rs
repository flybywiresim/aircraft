use crate::simulation::{InitContext, VariableIdentifier};
use crate::{
    shared::{
        ElectricalBusType, ElectricalBuses, LandingGearRealPosition, LgciuGearExtension,
        LgciuSensors, LgciuWeightOnWheels,
    },
    simulation::{Read, SimulationElement, SimulatorReader},
};
use uom::si::{
    f64::*,
    ratio::{percent, ratio},
};

pub enum GearWheel {
    CENTER = 0,
    LEFT = 1,
    RIGHT = 2,
}
/// Represents a landing gear on Airbus aircraft.
/// Note that this type somewhat hides the gear's position.
/// The real aircraft also can only check whether or not the gear is up and
/// locked or down and locked. No in between state.
/// It provides as well the state of all weight on wheel sensors
pub struct LandingGear {
    center_position_id: VariableIdentifier,
    left_position_id: VariableIdentifier,
    right_position_id: VariableIdentifier,
    center_compression_id: VariableIdentifier,
    left_compression_id: VariableIdentifier,
    right_compression_id: VariableIdentifier,

    center_position: Ratio,
    left_position: Ratio,
    right_position: Ratio,

    center_compression: Ratio,
    left_compression: Ratio,
    right_compression: Ratio,
}
impl LandingGear {
    const GEAR_CENTER_POSITION: &'static str = "GEAR CENTER POSITION";
    const GEAR_LEFT_POSITION: &'static str = "GEAR LEFT POSITION";
    const GEAR_RIGHT_POSITION: &'static str = "GEAR RIGHT POSITION";

    pub const GEAR_CENTER_COMPRESSION: &'static str = "GEAR ANIMATION POSITION";
    pub const GEAR_LEFT_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:1";
    pub const GEAR_RIGHT_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:2";

    // Is extended at 0.5, we set a super small margin of 0.02 from fully extended so 0.52
    const COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO: f64 = 0.52;

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            center_position_id: context.get_identifier(Self::GEAR_CENTER_POSITION.to_owned()),
            left_position_id: context.get_identifier(Self::GEAR_LEFT_POSITION.to_owned()),
            right_position_id: context.get_identifier(Self::GEAR_RIGHT_POSITION.to_owned()),
            center_compression_id: context.get_identifier(Self::GEAR_CENTER_COMPRESSION.to_owned()),
            left_compression_id: context.get_identifier(Self::GEAR_LEFT_COMPRESSION.to_owned()),
            right_compression_id: context.get_identifier(Self::GEAR_RIGHT_COMPRESSION.to_owned()),

            center_position: Ratio::new::<percent>(0.),
            left_position: Ratio::new::<percent>(0.),
            right_position: Ratio::new::<percent>(0.),

            center_compression: Ratio::new::<percent>(0.),
            left_compression: Ratio::new::<percent>(0.),
            right_compression: Ratio::new::<percent>(0.),
        }
    }

    fn is_wheel_id_up_and_locked(&self, wheel_id: GearWheel) -> bool {
        (self.wheel_id_position(wheel_id).get::<percent>() - 0.).abs() < f64::EPSILON
    }

    fn is_wheel_id_down_and_locked(&self, wheel_id: GearWheel) -> bool {
        (self.wheel_id_position(wheel_id).get::<percent>() - 100.).abs() < f64::EPSILON
    }

    fn is_wheel_id_compressed(&self, wheel_id: GearWheel) -> bool {
        self.wheel_id_compression(wheel_id)
            > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
    }

    fn wheel_id_position(&self, wheel_id: GearWheel) -> Ratio {
        match wheel_id {
            GearWheel::CENTER => self.center_position,
            GearWheel::LEFT => self.left_position,
            GearWheel::RIGHT => self.right_position,
        }
    }

    fn wheel_id_compression(&self, wheel_id: GearWheel) -> Ratio {
        match wheel_id {
            GearWheel::CENTER => self.center_compression,
            GearWheel::LEFT => self.left_compression,
            GearWheel::RIGHT => self.right_compression,
        }
    }
}
impl LandingGearRealPosition for LandingGear {
    fn is_up_and_locked(&self) -> bool {
        self.is_wheel_id_up_and_locked(GearWheel::CENTER)
            && self.is_wheel_id_up_and_locked(GearWheel::LEFT)
            && self.is_wheel_id_up_and_locked(GearWheel::RIGHT)
    }

    fn is_down_and_locked(&self) -> bool {
        self.is_wheel_id_down_and_locked(GearWheel::CENTER)
            && self.is_wheel_id_down_and_locked(GearWheel::LEFT)
            && self.is_wheel_id_down_and_locked(GearWheel::RIGHT)
    }
}
impl SimulationElement for LandingGear {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.center_position = reader.read(&self.center_position_id);
        self.left_position = reader.read(&self.left_position_id);
        self.right_position = reader.read(&self.right_position_id);

        self.center_compression = reader.read(&self.center_compression_id);
        self.left_compression = reader.read(&self.left_compression_id);
        self.right_compression = reader.read(&self.right_compression_id);
    }
}

pub struct LandingGearControlInterfaceUnit {
    is_powered: bool,
    powered_by: ElectricalBusType,
    external_power_available: bool,

    right_gear_sensor_compressed: bool,
    left_gear_sensor_compressed: bool,
    nose_gear_sensor_compressed: bool,

    right_gear_up_and_locked: bool,
    left_gear_up_and_locked: bool,
    nose_gear_up_and_locked: bool,

    right_gear_down_and_locked: bool,
    left_gear_down_and_locked: bool,
    nose_gear_down_and_locked: bool,
}
impl LandingGearControlInterfaceUnit {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_powered: false,
            powered_by,
            external_power_available: false,
            right_gear_sensor_compressed: true,
            left_gear_sensor_compressed: true,
            nose_gear_sensor_compressed: true,
            right_gear_up_and_locked: false,
            left_gear_up_and_locked: false,
            nose_gear_up_and_locked: false,
            right_gear_down_and_locked: false,
            left_gear_down_and_locked: false,
            nose_gear_down_and_locked: false,
        }
    }

    pub fn update(&mut self, landing_gear: &LandingGear, external_power_available: bool) {
        self.nose_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::CENTER);
        self.left_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::LEFT);
        self.right_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::RIGHT);

        self.external_power_available = external_power_available;

        self.right_gear_up_and_locked = landing_gear.is_wheel_id_up_and_locked(GearWheel::RIGHT);
        self.left_gear_up_and_locked = landing_gear.is_wheel_id_up_and_locked(GearWheel::LEFT);
        self.nose_gear_up_and_locked = landing_gear.is_wheel_id_up_and_locked(GearWheel::CENTER);

        self.right_gear_down_and_locked =
            landing_gear.is_wheel_id_down_and_locked(GearWheel::RIGHT);
        self.left_gear_down_and_locked = landing_gear.is_wheel_id_down_and_locked(GearWheel::LEFT);
        self.nose_gear_down_and_locked =
            landing_gear.is_wheel_id_down_and_locked(GearWheel::CENTER);
    }
}
impl SimulationElement for LandingGearControlInterfaceUnit {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

impl LgciuWeightOnWheels for LandingGearControlInterfaceUnit {
    fn right_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.is_powered
            && (self.right_gear_sensor_compressed
                || treat_ext_pwr_as_ground && self.external_power_available)
    }
    fn right_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.is_powered
            && !self.right_gear_sensor_compressed
            && !(treat_ext_pwr_as_ground && self.external_power_available)
    }

    fn left_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.is_powered
            && (self.left_gear_sensor_compressed
                || treat_ext_pwr_as_ground && self.external_power_available)
    }
    fn left_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.is_powered
            && !self.left_gear_sensor_compressed
            && !(treat_ext_pwr_as_ground && self.external_power_available)
    }

    fn left_and_right_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.is_powered && (self.left_gear_sensor_compressed && self.right_gear_sensor_compressed)
            || treat_ext_pwr_as_ground && self.external_power_available
    }
    fn left_and_right_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        !(!self.is_powered
            || self.left_gear_sensor_compressed
            || self.right_gear_sensor_compressed
            || treat_ext_pwr_as_ground && self.external_power_available)
    }
    fn nose_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.is_powered
            && (self.nose_gear_sensor_compressed
                || treat_ext_pwr_as_ground && self.external_power_available)
    }
    fn nose_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.is_powered
            && !self.nose_gear_sensor_compressed
            && !(treat_ext_pwr_as_ground && self.external_power_available)
    }
}
impl LgciuGearExtension for LandingGearControlInterfaceUnit {
    fn all_down_and_locked(&self) -> bool {
        self.is_powered
            && self.nose_gear_down_and_locked
            && self.right_gear_down_and_locked
            && self.left_gear_down_and_locked
    }
    fn all_up_and_locked(&self) -> bool {
        self.is_powered
            && self.nose_gear_up_and_locked
            && self.right_gear_up_and_locked
            && self.left_gear_up_and_locked
    }
}

impl LgciuSensors for LandingGearControlInterfaceUnit {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, WriteByName};
    use crate::simulation::test::{SimulationTestBed, TestAircraft, TestBed};

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

        assert!(test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::CENTER)));
        assert!(test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::LEFT)));
        assert!(test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::RIGHT)));
    }

    #[test]
    fn no_weight_on_wheels_when_all_extended() {
        let test_bed = run_test_bed_on_with_compression(
            Ratio::new::<ratio>(0.51),
            Ratio::new::<ratio>(0.51),
            Ratio::new::<ratio>(0.51),
        );

        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::CENTER)));
        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::LEFT)));
        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::RIGHT)));
    }

    #[test]
    fn left_weight_on_wheels_only_when_only_left_compressed() {
        let test_bed = run_test_bed_on_with_compression(
            Ratio::new::<ratio>(0.8),
            Ratio::new::<ratio>(0.51),
            Ratio::new::<ratio>(0.51),
        );

        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::CENTER)));
        assert!(test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::LEFT)));
        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::RIGHT)));
    }

    fn run_test_bed_on_with_position(
        position: Ratio,
    ) -> SimulationTestBed<TestAircraft<LandingGear>> {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(LandingGear::new));
        test_bed.write_by_name(LandingGear::GEAR_CENTER_POSITION, position);
        test_bed.write_by_name(LandingGear::GEAR_LEFT_POSITION, position);
        test_bed.write_by_name(LandingGear::GEAR_RIGHT_POSITION, position);

        test_bed.run();

        test_bed
    }

    fn run_test_bed_on_with_compression(
        left: Ratio,
        center: Ratio,
        right: Ratio,
    ) -> SimulationTestBed<TestAircraft<LandingGear>> {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(LandingGear::new));
        test_bed.write_by_name(LandingGear::GEAR_LEFT_COMPRESSION, left);
        test_bed.write_by_name(LandingGear::GEAR_CENTER_COMPRESSION, center);
        test_bed.write_by_name(LandingGear::GEAR_RIGHT_COMPRESSION, right);

        test_bed.run();

        test_bed
    }
}
