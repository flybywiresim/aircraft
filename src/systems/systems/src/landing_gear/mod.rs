use crate::simulation::{InitContext, VariableIdentifier};
use crate::{
    hydraulic::landing_gear::{GearComponentController, GearSystemStateMachine, GearsSystemState},
    shared::{
        ElectricalBusType, ElectricalBuses, GearWheel, LandingGearHandle, LandingGearRealPosition,
        LgciuDoorPosition, LgciuGearControl, LgciuGearExtension, LgciuSensors, LgciuWeightOnWheels,
    },
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter, Write,
    },
};
use uom::si::{
    f64::*,
    ratio::{percent, ratio},
};

pub trait GearSystemSensors {
    fn is_wheel_id_up_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool;
    fn is_wheel_id_down_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool;
    fn is_door_id_up_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool;
    fn is_door_id_down_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool;
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

struct LgciuSensorInputs {
    number_index: usize,

    external_power_available: bool,
    is_powered: bool,

    right_gear_sensor_compressed: bool,
    left_gear_sensor_compressed: bool,
    nose_gear_sensor_compressed: bool,

    right_gear_up_and_locked: bool,
    left_gear_up_and_locked: bool,
    nose_gear_up_and_locked: bool,

    right_gear_down_and_locked: bool,
    left_gear_down_and_locked: bool,
    nose_gear_down_and_locked: bool,

    nose_door_fully_opened: bool,
    right_door_fully_opened: bool,
    left_door_fully_opened: bool,

    nose_door_up_and_locked: bool,
    right_door_up_and_locked: bool,
    left_door_up_and_locked: bool,

    nose_gear_compressed_id: VariableIdentifier,
    left_gear_compressed_id: VariableIdentifier,
    right_gear_compressed_id: VariableIdentifier,
}
impl LgciuSensorInputs {
    fn new(context: &mut InitContext, number: usize) -> Self {
        assert!(number > 0);

        Self {
            number_index: number - 1,
            external_power_available: false,
            is_powered: false,

            right_gear_sensor_compressed: true,
            left_gear_sensor_compressed: true,
            nose_gear_sensor_compressed: true,

            right_gear_up_and_locked: false,
            left_gear_up_and_locked: false,
            nose_gear_up_and_locked: false,
            right_gear_down_and_locked: false,
            left_gear_down_and_locked: false,
            nose_gear_down_and_locked: false,

            nose_door_fully_opened: false,
            right_door_fully_opened: false,
            left_door_fully_opened: false,
            nose_door_up_and_locked: false,
            right_door_up_and_locked: false,
            left_door_up_and_locked: false,

            nose_gear_compressed_id: context
                .get_identifier(format!("LGCIU_{}_NOSE_GEAR_COMPRESSED", number)),
            left_gear_compressed_id: context
                .get_identifier(format!("LGCIU_{}_LEFT_GEAR_COMPRESSED", number)),
            right_gear_compressed_id: context
                .get_identifier(format!("LGCIU_{}_RIGHT_GEAR_COMPRESSED", number)),
        }
    }

    pub fn update(
        &mut self,
        landing_gear: &LandingGear,
        gear_system_sensors: &impl GearSystemSensors,
        external_power_available: bool,
        is_powered: bool,
    ) {
        self.external_power_available = external_power_available;
        self.is_powered = is_powered;

        self.nose_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::CENTER);
        self.left_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::LEFT);
        self.right_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::RIGHT);

        self.right_gear_up_and_locked =
            gear_system_sensors.is_wheel_id_up_and_locked(GearWheel::RIGHT, self.number_index);
        self.left_gear_up_and_locked =
            gear_system_sensors.is_wheel_id_up_and_locked(GearWheel::LEFT, self.number_index);
        self.nose_gear_up_and_locked =
            gear_system_sensors.is_wheel_id_up_and_locked(GearWheel::CENTER, self.number_index);

        self.right_gear_down_and_locked =
            gear_system_sensors.is_wheel_id_down_and_locked(GearWheel::RIGHT, self.number_index);
        self.left_gear_down_and_locked =
            gear_system_sensors.is_wheel_id_down_and_locked(GearWheel::LEFT, self.number_index);
        self.nose_gear_down_and_locked =
            gear_system_sensors.is_wheel_id_down_and_locked(GearWheel::CENTER, self.number_index);

        self.nose_door_fully_opened =
            gear_system_sensors.is_door_id_down_and_locked(GearWheel::CENTER, self.number_index);
        self.right_door_fully_opened =
            gear_system_sensors.is_door_id_down_and_locked(GearWheel::RIGHT, self.number_index);
        self.left_door_fully_opened =
            gear_system_sensors.is_door_id_down_and_locked(GearWheel::LEFT, self.number_index);
        self.nose_door_up_and_locked =
            gear_system_sensors.is_door_id_up_and_locked(GearWheel::CENTER, self.number_index);
        self.right_door_up_and_locked =
            gear_system_sensors.is_door_id_up_and_locked(GearWheel::RIGHT, self.number_index);
        self.left_door_up_and_locked =
            gear_system_sensors.is_door_id_up_and_locked(GearWheel::LEFT, self.number_index);
    }
}
impl SimulationElement for LgciuSensorInputs {
    fn write(&self, writer: &mut SimulatorWriter) {
        // ref FBW-32-01
        writer.write(
            &self.nose_gear_compressed_id,
            self.nose_gear_compressed(false),
        );
        writer.write(
            &self.left_gear_compressed_id,
            self.left_gear_compressed(false),
        );
        writer.write(
            &self.right_gear_compressed_id,
            self.right_gear_compressed(false),
        );
    }
}

impl LgciuWeightOnWheels for LgciuSensorInputs {
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
impl LgciuGearExtension for LgciuSensorInputs {
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
impl LgciuDoorPosition for LgciuSensorInputs {
    fn all_fully_opened(&self) -> bool {
        self.is_powered
            && self.nose_door_fully_opened
            && self.right_door_fully_opened
            && self.left_door_fully_opened
    }
    fn all_closed_and_locked(&self) -> bool {
        self.is_powered
            && self.nose_door_up_and_locked
            && self.right_door_up_and_locked
            && self.left_door_up_and_locked
    }
}
impl LgciuSensors for LgciuSensorInputs {}

pub struct LandingGearControlInterfaceUnit {
    gear_handle_position_id: VariableIdentifier,

    is_powered: bool,

    powered_by: ElectricalBusType,
    external_power_available: bool,

    sensor_inputs: LgciuSensorInputs,
    gear_system_control: GearSystemStateMachine,
    is_gear_lever_down: bool,
}
impl LandingGearControlInterfaceUnit {
    pub fn new(context: &mut InitContext, number: usize, powered_by: ElectricalBusType) -> Self {
        Self {
            gear_handle_position_id: context.get_identifier("GEAR HANDLE POSITION".to_owned()),

            is_powered: false,

            powered_by,
            external_power_available: false,

            sensor_inputs: LgciuSensorInputs::new(context, number),
            gear_system_control: GearSystemStateMachine::new(),
            is_gear_lever_down: true,
        }
    }

    pub fn update(
        &mut self,
        landing_gear: &LandingGear,
        gear_system_sensors: &impl GearSystemSensors,
        external_power_available: bool,
    ) {
        self.sensor_inputs.update(
            landing_gear,
            gear_system_sensors,
            external_power_available,
            self.is_powered,
        );

        self.external_power_available = external_power_available;

        self.gear_system_control
            .update(&self.sensor_inputs, !self.is_gear_lever_down);
    }

    pub fn gear_system_state(&self) -> GearsSystemState {
        self.gear_system_control.state()
    }
}
impl SimulationElement for LandingGearControlInterfaceUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.sensor_inputs.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_gear_lever_down = reader.read(&self.gear_handle_position_id);
    }
}

impl LgciuWeightOnWheels for LandingGearControlInterfaceUnit {
    fn right_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .right_gear_compressed(treat_ext_pwr_as_ground)
    }
    fn right_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .right_gear_extended(treat_ext_pwr_as_ground)
    }

    fn left_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .left_gear_compressed(treat_ext_pwr_as_ground)
    }
    fn left_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .left_gear_extended(treat_ext_pwr_as_ground)
    }

    fn left_and_right_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .left_and_right_gear_compressed(treat_ext_pwr_as_ground)
    }
    fn left_and_right_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .left_and_right_gear_extended(treat_ext_pwr_as_ground)
    }
    fn nose_gear_compressed(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .nose_gear_compressed(treat_ext_pwr_as_ground)
    }
    fn nose_gear_extended(&self, treat_ext_pwr_as_ground: bool) -> bool {
        self.sensor_inputs
            .nose_gear_extended(treat_ext_pwr_as_ground)
    }
}
impl LgciuGearExtension for LandingGearControlInterfaceUnit {
    fn all_down_and_locked(&self) -> bool {
        self.sensor_inputs.all_down_and_locked()
    }
    fn all_up_and_locked(&self) -> bool {
        self.sensor_inputs.all_up_and_locked()
    }
}
impl LgciuDoorPosition for LandingGearControlInterfaceUnit {
    fn all_fully_opened(&self) -> bool {
        self.sensor_inputs.all_fully_opened()
    }
    fn all_closed_and_locked(&self) -> bool {
        self.sensor_inputs.all_closed_and_locked()
    }
}
impl LgciuGearControl for LandingGearControlInterfaceUnit {
    fn should_open_doors(&self) -> bool {
        match self.gear_system_control.state() {
            GearsSystemState::AllUpLocked => false,
            GearsSystemState::Retracting => {
                if !self.all_up_and_locked() {
                    true
                } else {
                    false
                }
            }
            GearsSystemState::Extending => {
                if !self.all_down_and_locked() {
                    true
                } else {
                    false
                }
            }
            GearsSystemState::AllDownLocked => false,
        }
    }

    fn should_extend_gears(&self) -> bool {
        match self.gear_system_control.state() {
            GearsSystemState::AllUpLocked => false,
            GearsSystemState::Retracting => {
                if self.all_fully_opened() || self.all_up_and_locked() {
                    false
                } else {
                    true
                }
            }
            GearsSystemState::Extending => {
                if self.all_fully_opened() || self.all_down_and_locked() {
                    true
                } else {
                    false
                }
            }
            GearsSystemState::AllDownLocked => true,
        }
    }
}
impl LandingGearHandle for LandingGearControlInterfaceUnit {
    fn gear_handle_is_down(&self) -> bool {
        self.gear_handle_is_down()
    }

    fn gear_handle_baulk_locked(&self) -> bool {
        // TODO
        false
    }
}

impl LgciuSensors for LandingGearControlInterfaceUnit {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, WriteByName};
    use crate::simulation::test::{SimulationTestBed, TestAircraft, TestBed};

    use crate::simulation::{
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    };

    use crate::electrical::{test::TestElectricitySource, ElectricalBus, Electricity};
    use crate::shared::PotentialOrigin;

    use uom::si::{electric_potential::volt, f64::*};

    struct TestGearSystem {
        door_position: u8,
        gear_position: u8,
    }
    impl TestGearSystem {
        const UP_LOCK_TRESHOLD: u8 = 10;

        fn new() -> Self {
            Self {
                door_position: Self::UP_LOCK_TRESHOLD,
                gear_position: 1,
            }
        }

        fn update(&mut self, controller: &impl LgciuGearControl) {
            if controller.should_open_doors() {
                self.door_position -= 1;
            } else {
                self.door_position += 1;
            }

            if controller.should_extend_gears() {
                self.gear_position -= 1;
            } else {
                self.gear_position += 1;
            }

            self.door_position = self.door_position.max(1).min(Self::UP_LOCK_TRESHOLD);
            self.gear_position = self.gear_position.max(1).min(Self::UP_LOCK_TRESHOLD);

            // Ensuring gear and doors never move at the same time
            if self.door_position != 1 && self.door_position != Self::UP_LOCK_TRESHOLD {
                assert!(self.gear_position == 1 || self.gear_position == Self::UP_LOCK_TRESHOLD)
            }

            if self.gear_position != 1 && self.gear_position != Self::UP_LOCK_TRESHOLD {
                assert!(self.door_position == 1 || self.door_position == Self::UP_LOCK_TRESHOLD)
            }
        }
    }
    impl GearSystemSensors for TestGearSystem {
        fn is_wheel_id_up_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
            self.gear_position >= Self::UP_LOCK_TRESHOLD
        }

        fn is_wheel_id_down_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
            self.gear_position <= 1
        }

        fn is_door_id_up_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
            self.door_position >= Self::UP_LOCK_TRESHOLD
        }

        fn is_door_id_down_and_locked(&self, wheel_id: GearWheel, sensor_id: usize) -> bool {
            self.door_position <= 1
        }
    }

    struct TestGearAircraft {
        landing_gear: LandingGear,
        lgciu: LandingGearControlInterfaceUnit,
        gear_system: TestGearSystem,

        powered_source_ac: TestElectricitySource,
        dc_ess_bus: ElectricalBus,
    }
    impl TestGearAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                landing_gear: LandingGear::new(context),
                lgciu: LandingGearControlInterfaceUnit::new(
                    context,
                    1,
                    ElectricalBusType::DirectCurrentEssential,
                ),
                gear_system: TestGearSystem::new(),

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.lgciu
                .update(&self.landing_gear, &self.gear_system, false);

            self.gear_system.update(&self.lgciu);

            println!(
                "LGCIU STATE {:#?} / Doors OPENING {}  / Gears OPENING {} ",
                self.lgciu.gear_system_control.state(),
                self.lgciu.should_open_doors(),
                self.lgciu.should_extend_gears()
            );

            println!(
                "Gear pos{} / Door pos{}",
                self.gear_system.gear_position, self.gear_system.door_position,
            );
        }
    }
    impl Aircraft for TestGearAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(115.));
            electricity.supplied_by(&self.powered_source_ac);
            electricity.flow(&self.powered_source_ac, &self.dc_ess_bus);
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.update(context);
        }
    }
    impl SimulationElement for TestGearAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.lgciu.accept(visitor);
            visitor.visit(self);
        }
    }

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

    #[test]
    fn gear_state_downlock_on_init() {
        let mut test_bed = SimulationTestBed::new(|context| TestGearAircraft::new(context));

        assert!(
            test_bed.query(|a| a.lgciu.gear_system_control.state())
                == GearsSystemState::AllDownLocked
        );
    }

    #[test]
    fn gear_up_when_lever_up_down_when_lever_down() {
        let mut test_bed = SimulationTestBed::new(|context| TestGearAircraft::new(context));

        test_bed.write_by_name("GEAR HANDLE POSITION", 1);
        for _ in 0..2 {
            test_bed.run_without_delta();
        }

        assert!(
            test_bed.query(|a| a.lgciu.gear_system_control.state())
                == GearsSystemState::AllDownLocked
        );

        // Gear UP
        test_bed.write_by_name("GEAR HANDLE POSITION", 0);
        for _ in 0..30 {
            test_bed.run_without_delta();
        }

        assert!(
            test_bed.query(|a| a.lgciu.gear_system_control.state())
                == GearsSystemState::AllUpLocked
        );

        // Gear DOWN
        test_bed.write_by_name("GEAR HANDLE POSITION", 1);
        for _ in 0..30 {
            test_bed.run_without_delta();
        }

        assert!(
            test_bed.query(|a| a.lgciu.gear_system_control.state())
                == GearsSystemState::AllDownLocked
        );
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
