use std::time::Duration;

use crate::{
    failures::{Failure, FailureType},
    shared::arinc429::{Arinc429Word, SignStatus},
    shared::{
        height_over_ground, ElectricalBusType, ElectricalBuses, GearWheel, LandingGearHandle,
        LgciuDoorPosition, LgciuGearControl, LgciuGearExtension, LgciuId, LgciuInterface,
        LgciuWeightOnWheels,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};
use uom::si::{
    angle::degree,
    f64::*,
    length::meter,
    ratio::{percent, ratio},
};

use nalgebra::Vector3;
pub trait GearSystemSensors {
    fn is_wheel_id_up_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool;
    fn is_wheel_id_down_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool;
    fn is_door_id_up_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool;
    fn is_door_id_down_and_locked(&self, wheel_id: GearWheel, lgciu_id: LgciuId) -> bool;
}

pub struct TiltingGear {
    tilt_animation_id: VariableIdentifier,
    compression_id: VariableIdentifier,

    tilt_height_from_low_to_up: Length,
    contact_point_offset_from_datum_ref_meters: Vector3<f64>,
    tilting_max_angle: Angle,

    current_compression: Ratio,
    tilt_position: Ratio,
}
impl TiltingGear {
    // Indicates the tilt angle already used with plane on ground standing still
    const PLANE_PITCH_OFFSET_ON_GROUND_DEGREES: f64 = 0.8;

    const HEIGHT_TO_ACTIVATE_GROUND_COLLISION_METER: f64 = 0.0005;

    // Max speed at which tilt can move if gear is instantly in the air
    const TILT_SPEED_WHEN_AIRBORN_RATIO_PER_SECOND: f64 = 0.5;

    pub fn new(
        context: &mut InitContext,
        tilt_height_from_low_to_up: Length,
        contact_point_id: usize,
        contact_point_offset_from_datum_ref_meters: Vector3<f64>,
        tilting_max_angle: Angle,
    ) -> Self {
        Self {
            tilt_animation_id: context
                .get_identifier(format!("GEAR_{}_TILT_POSITION", contact_point_id)),
            compression_id: context
                .get_identifier(format!("GEAR ANIMATION POSITION:{}", contact_point_id)),
            tilt_height_from_low_to_up,
            contact_point_offset_from_datum_ref_meters,
            tilting_max_angle,

            current_compression: Ratio::default(),
            tilt_position: Ratio::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let current_tire_height =
            height_over_ground(context, self.contact_point_offset_from_datum_ref_meters);

        self.tilt_position = if current_tire_height.get::<meter>()
            <= Self::HEIGHT_TO_ACTIVATE_GROUND_COLLISION_METER
        {
            let ground_tilt_raw = Ratio::new::<ratio>(
                (1. - (current_tire_height.abs() / self.tilt_height_from_low_to_up).get::<ratio>())
                    .min(1.)
                    .max(0.),
            );

            ground_tilt_raw.max(self.max_ground_tilt_from_plane_pitch(context))
        } else {
            // Tilt for positive Gs else untilt for negative Gs
            let delta_tilt = if context.acceleration_plane_reference_filtered_ms2_vector()[1] <= 0.
            {
                Ratio::new::<ratio>(
                    Self::TILT_SPEED_WHEN_AIRBORN_RATIO_PER_SECOND * context.delta_as_secs_f64(),
                )
            } else {
                Ratio::new::<ratio>(
                    -1. * Self::TILT_SPEED_WHEN_AIRBORN_RATIO_PER_SECOND
                        * context.delta_as_secs_f64(),
                )
            };

            (self.tilt_position + delta_tilt)
                .min(Ratio::new::<ratio>(1.))
                .max(Ratio::new::<ratio>(0.))
        };
    }

    fn max_ground_tilt_from_plane_pitch(&self, context: &UpdateContext) -> Ratio {
        let plane_pitch = -context.pitch();

        let pitch_offset = Angle::new::<degree>(-Self::PLANE_PITCH_OFFSET_ON_GROUND_DEGREES);

        let offset_pitch = plane_pitch - pitch_offset;

        offset_pitch
            .max(Angle::new::<degree>(0.))
            .min(self.tilting_max_angle)
            / self.tilting_max_angle
    }
}
impl SimulationElement for TiltingGear {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.tilt_animation_id, self.tilt_position.get::<ratio>());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.current_compression = reader.read(&self.compression_id);
    }
}

/// Represents a landing gear on Airbus aircraft.
/// Note that this type somewhat hides the gear's position.
/// The real aircraft also can only check whether or not the gear is up and
/// locked or down and locked. No in between state.
/// It provides as well the state of all weight on wheel sensors
pub struct LandingGear {
    center_compression_id: VariableIdentifier,
    left_compression_id: VariableIdentifier,
    right_compression_id: VariableIdentifier,

    center_compression: Ratio,
    left_compression: Ratio,
    right_compression: Ratio,
}
impl LandingGear {
    pub const GEAR_CENTER_COMPRESSION: &'static str = "GEAR ANIMATION POSITION";
    pub const GEAR_LEFT_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:1";
    pub const GEAR_RIGHT_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:2";

    // Is extended at 0.5, we set a super small margin of 0.02 from fully extended so 0.52
    const COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO: f64 = 0.52;

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            center_compression_id: context.get_identifier(Self::GEAR_CENTER_COMPRESSION.to_owned()),
            left_compression_id: context.get_identifier(Self::GEAR_LEFT_COMPRESSION.to_owned()),
            right_compression_id: context.get_identifier(Self::GEAR_RIGHT_COMPRESSION.to_owned()),

            center_compression: Ratio::new::<percent>(0.),
            left_compression: Ratio::new::<percent>(0.),
            right_compression: Ratio::new::<percent>(0.),
        }
    }

    fn is_wheel_id_compressed(&self, wheel_id: GearWheel) -> bool {
        self.wheel_id_compression(wheel_id)
            > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
    }

    fn wheel_id_compression(&self, wheel_id: GearWheel) -> Ratio {
        match wheel_id {
            GearWheel::NOSE => self.center_compression,
            GearWheel::LEFT => self.left_compression,
            GearWheel::RIGHT => self.right_compression,
        }
    }
}
impl SimulationElement for LandingGear {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.center_compression = reader.read(&self.center_compression_id);
        self.left_compression = reader.read(&self.left_compression_id);
        self.right_compression = reader.read(&self.right_compression_id);
    }
}

fn lgciu_number(lgciu_id: LgciuId) -> u8 {
    match lgciu_id {
        LgciuId::Lgciu1 => 1,
        LgciuId::Lgciu2 => 2,
    }
}

struct LgciuSensorInputs {
    lgciu_id: LgciuId,

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
    fn new(context: &mut InitContext, lgciu_id: LgciuId) -> Self {
        Self {
            lgciu_id,
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

            nose_gear_compressed_id: context.get_identifier(format!(
                "LGCIU_{}_NOSE_GEAR_COMPRESSED",
                lgciu_number(lgciu_id)
            )),
            left_gear_compressed_id: context.get_identifier(format!(
                "LGCIU_{}_LEFT_GEAR_COMPRESSED",
                lgciu_number(lgciu_id)
            )),
            right_gear_compressed_id: context.get_identifier(format!(
                "LGCIU_{}_RIGHT_GEAR_COMPRESSED",
                lgciu_number(lgciu_id)
            )),
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

        self.nose_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::NOSE);
        self.left_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::LEFT);
        self.right_gear_sensor_compressed = landing_gear.is_wheel_id_compressed(GearWheel::RIGHT);

        self.right_gear_up_and_locked =
            gear_system_sensors.is_wheel_id_up_and_locked(GearWheel::RIGHT, self.lgciu_id);
        self.left_gear_up_and_locked =
            gear_system_sensors.is_wheel_id_up_and_locked(GearWheel::LEFT, self.lgciu_id);
        self.nose_gear_up_and_locked =
            gear_system_sensors.is_wheel_id_up_and_locked(GearWheel::NOSE, self.lgciu_id);

        self.right_gear_down_and_locked =
            gear_system_sensors.is_wheel_id_down_and_locked(GearWheel::RIGHT, self.lgciu_id);
        self.left_gear_down_and_locked =
            gear_system_sensors.is_wheel_id_down_and_locked(GearWheel::LEFT, self.lgciu_id);
        self.nose_gear_down_and_locked =
            gear_system_sensors.is_wheel_id_down_and_locked(GearWheel::NOSE, self.lgciu_id);

        self.nose_door_fully_opened =
            gear_system_sensors.is_door_id_down_and_locked(GearWheel::NOSE, self.lgciu_id);
        self.right_door_fully_opened =
            gear_system_sensors.is_door_id_down_and_locked(GearWheel::RIGHT, self.lgciu_id);
        self.left_door_fully_opened =
            gear_system_sensors.is_door_id_down_and_locked(GearWheel::LEFT, self.lgciu_id);
        self.nose_door_up_and_locked =
            gear_system_sensors.is_door_id_up_and_locked(GearWheel::NOSE, self.lgciu_id);
        self.right_door_up_and_locked =
            gear_system_sensors.is_door_id_up_and_locked(GearWheel::RIGHT, self.lgciu_id);
        self.left_door_up_and_locked =
            gear_system_sensors.is_door_id_up_and_locked(GearWheel::LEFT, self.lgciu_id);
    }

    fn unlock_state(&self, wheel_id: GearWheel, gear_lever_is_down: bool) -> bool {
        let gear_uplocked = match wheel_id {
            GearWheel::LEFT => self.left_gear_up_and_locked,
            GearWheel::NOSE => self.nose_gear_up_and_locked,
            GearWheel::RIGHT => self.right_gear_up_and_locked,
        };
        let gear_downlocked = match wheel_id {
            GearWheel::LEFT => self.left_gear_down_and_locked,
            GearWheel::NOSE => self.nose_gear_down_and_locked,
            GearWheel::RIGHT => self.right_gear_down_and_locked,
        };

        let in_transition = !(gear_downlocked ^ gear_uplocked);
        let not_uplocked = !gear_lever_is_down && !gear_uplocked;
        let not_downlocked = gear_lever_is_down && !gear_downlocked;

        in_transition || not_uplocked || not_downlocked
    }

    fn downlock_state(&self, wheel_id: GearWheel) -> bool {
        match wheel_id {
            GearWheel::LEFT => self.left_gear_down_and_locked,
            GearWheel::NOSE => self.nose_gear_down_and_locked,
            GearWheel::RIGHT => self.right_gear_down_and_locked,
        }
    }
}
impl SimulationElement for LgciuSensorInputs {
    fn write(&self, writer: &mut SimulatorWriter) {
        // ref FBW-32-01
        writer.write(
            &self.nose_gear_compressed_id,
            self.is_powered && self.nose_gear_compressed(false),
        );
        writer.write(
            &self.left_gear_compressed_id,
            self.is_powered && self.left_gear_compressed(false),
        );
        writer.write(
            &self.right_gear_compressed_id,
            self.is_powered && self.right_gear_compressed(false),
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
    fn left_gear_down_and_locked(&self) -> bool {
        self.is_powered && self.left_gear_down_and_locked
    }
    fn right_gear_down_and_locked(&self) -> bool {
        self.is_powered && self.right_gear_down_and_locked
    }
    fn nose_gear_down_and_locked(&self) -> bool {
        self.is_powered && self.nose_gear_down_and_locked
    }
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
    fn main_down_and_locked(&self) -> bool {
        self.is_powered && self.right_gear_down_and_locked && self.left_gear_down_and_locked
    }
    fn main_up_and_locked(&self) -> bool {
        self.is_powered && self.right_gear_up_and_locked && self.left_gear_up_and_locked
    }
    fn nose_down_and_locked(&self) -> bool {
        self.is_powered && self.nose_gear_down_and_locked
    }
    fn nose_up_and_locked(&self) -> bool {
        self.is_powered && self.nose_gear_up_and_locked
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

struct LandingGearControlCoordinator {
    active_lgciu_id: LgciuId,
    previous_gear_handle_is_down: bool,
}
impl LandingGearControlCoordinator {
    fn new(context: &mut InitContext) -> Self {
        Self {
            active_lgciu_id: LgciuId::Lgciu1,
            previous_gear_handle_is_down: context.start_gear_down(),
        }
    }

    fn update(&mut self, lgcius_status: [LgciuStatus; 2], gear_handle: &impl LandingGearHandle) {
        let lgciu_should_switch_at_new_up_cycle =
            self.previous_gear_handle_is_down && !gear_handle.gear_handle_is_down();

        let lgciu_should_switch_because_failed_and_new_lever_command =
            self.previous_gear_handle_is_down != gear_handle.gear_handle_is_down()
                && lgcius_status[self.active_lgciu_id as usize] != LgciuStatus::Ok;

        let lgciu_should_switch_because_is_failed =
            match lgcius_status[self.active_lgciu_id as usize] {
                LgciuStatus::Ok | LgciuStatus::FailedNoChangeOver => false,
                LgciuStatus::FailedNotPowered | LgciuStatus::FailedAutoChangeOver => true,
            };

        if lgciu_should_switch_at_new_up_cycle
            || lgciu_should_switch_because_is_failed
            || lgciu_should_switch_because_failed_and_new_lever_command
        {
            self.lgciu_switchover(lgcius_status);
        }

        self.previous_gear_handle_is_down = gear_handle.gear_handle_is_down();
    }

    fn lgciu_switchover(&mut self, lgcius_status: [LgciuStatus; 2]) {
        let target_lgciu = (self.active_lgciu_id as usize + 1) % 2;

        let target_lgciu_state = lgcius_status[target_lgciu];

        if target_lgciu_state == LgciuStatus::Ok {
            self.active_lgciu_id = if target_lgciu == 0 {
                LgciuId::Lgciu1
            } else {
                LgciuId::Lgciu2
            };
        }
    }

    fn active_lgciu_id(&self) -> LgciuId {
        self.active_lgciu_id
    }
}

/// Gathers multiple LGCIUs and handle the inter lgciu master/slave mechanism
/// and their interface with gear handle lever logic
pub struct LandingGearControlInterfaceUnitSet {
    gear_handle_baulk_lock_id: VariableIdentifier,
    coordinator: LandingGearControlCoordinator,
    lgcius: [LandingGearControlInterfaceUnit; 2],
    gear_handle_unit: LandingGearHandleUnit,
}
impl LandingGearControlInterfaceUnitSet {
    pub fn new(
        context: &mut InitContext,
        lgciu1_powered_by: ElectricalBusType,
        lgciu2_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            gear_handle_baulk_lock_id: context.get_identifier("GEAR_LEVER_LOCKED".to_owned()),
            coordinator: LandingGearControlCoordinator::new(context),
            lgcius: [
                LandingGearControlInterfaceUnit::new(context, LgciuId::Lgciu1, lgciu1_powered_by),
                LandingGearControlInterfaceUnit::new(context, LgciuId::Lgciu2, lgciu2_powered_by),
            ],
            gear_handle_unit: LandingGearHandleUnit::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        landing_gear: &LandingGear,
        gear_system_sensors: &impl GearSystemSensors,
        external_power_available: bool,
    ) {
        self.coordinator.update(
            [
                self.lgcius[LgciuId::Lgciu1 as usize].status(),
                self.lgcius[LgciuId::Lgciu2 as usize].status(),
            ],
            &self.gear_handle_unit,
        );

        self.lgcius[LgciuId::Lgciu1 as usize].update(
            context,
            landing_gear,
            gear_system_sensors,
            external_power_available,
            &self.gear_handle_unit,
            self.coordinator.active_lgciu_id() == LgciuId::Lgciu1,
        );
        self.lgcius[LgciuId::Lgciu2 as usize].update(
            context,
            landing_gear,
            gear_system_sensors,
            external_power_available,
            &self.gear_handle_unit,
            self.coordinator.active_lgciu_id() == LgciuId::Lgciu2,
        );

        self.gear_handle_unit.update(
            context,
            &self.lgcius[LgciuId::Lgciu1 as usize],
            &self.lgcius[LgciuId::Lgciu2 as usize],
        );
    }

    pub fn lgciu1(&self) -> &LandingGearControlInterfaceUnit {
        &self.lgcius[LgciuId::Lgciu1 as usize]
    }

    pub fn lgciu2(&self) -> &LandingGearControlInterfaceUnit {
        &self.lgcius[LgciuId::Lgciu2 as usize]
    }

    pub fn active_lgciu(&self) -> &LandingGearControlInterfaceUnit {
        &self.lgcius[self.coordinator.active_lgciu_id() as usize]
    }

    #[cfg(test)]
    fn active_lgciu_id(&self) -> LgciuId {
        self.coordinator.active_lgciu_id()
    }

    #[cfg(test)]
    fn gear_system_state(&self) -> GearSystemState {
        self.active_lgciu().gear_system_state()
    }
}
impl SimulationElement for LandingGearControlInterfaceUnitSet {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.gear_handle_unit.accept(visitor);
        accept_iterable!(self.lgcius, visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.gear_handle_baulk_lock_id,
            self.gear_handle_baulk_locked(),
        );
    }
}
impl LandingGearHandle for LandingGearControlInterfaceUnitSet {
    fn gear_handle_is_down(&self) -> bool {
        self.gear_handle_unit.gear_handle_is_down()
    }

    fn gear_handle_baulk_locked(&self) -> bool {
        self.gear_handle_unit.gear_handle_baulk_locked()
    }
}

struct LandingGearHandleUnit {
    gear_handle_real_position_id: VariableIdentifier,
    gear_handle_position_requested_id: VariableIdentifier,
    gear_handle_hits_lock_sound_id: VariableIdentifier,

    lever_should_lock_down: bool,

    lever_position: Ratio,
    lever_commanded_down: bool,

    lever_just_hit_lock_sound: bool,
}
impl LandingGearHandleUnit {
    const GEAR_LEVER_SPEED_PERCENT_PER_S: f64 = 180.;

    const GEAR_LEVER_MAX_LOCK_POSITION: f64 = 0.95;

    const GEAR_LEVER_UP_DOWN_DETECTION_POSITION: f64 = 0.5;

    fn new(context: &mut InitContext) -> Self {
        let init_gear_down = context.start_gear_down();

        Self {
            gear_handle_real_position_id: context.get_identifier("GEAR_HANDLE_POSITION".to_owned()),
            gear_handle_position_requested_id: context
                .get_identifier("GEAR_LEVER_POSITION_REQUEST".to_owned()),
            gear_handle_hits_lock_sound_id: context
                .get_identifier("GEAR_HANDLE_HITS_LOCK_SOUND".to_owned()),

            lever_should_lock_down: init_gear_down,

            lever_position: if init_gear_down {
                Ratio::new::<ratio>(1.)
            } else {
                Ratio::new::<ratio>(0.)
            },

            lever_commanded_down: init_gear_down,

            lever_just_hit_lock_sound: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        lgciu1: &impl LandingGearHandle,
        lgciu2: &impl LandingGearHandle,
    ) {
        self.lever_should_lock_down =
            lgciu1.gear_handle_baulk_locked() && lgciu2.gear_handle_baulk_locked();

        self.update_position(context);
    }

    fn update_position(&mut self, context: &UpdateContext) {
        let previous_position = self.lever_position;

        if self.lever_commanded_down {
            self.lever_position += Ratio::new::<percent>(
                Self::GEAR_LEVER_SPEED_PERCENT_PER_S * context.delta_as_secs_f64(),
            );
        } else {
            let could_hit_lock_mechanism_after_update = self.lever_position.get::<ratio>()
                >= Self::GEAR_LEVER_MAX_LOCK_POSITION
                && self.lever_should_lock_down;

            self.lever_position -= Ratio::new::<percent>(
                Self::GEAR_LEVER_SPEED_PERCENT_PER_S * context.delta_as_secs_f64(),
            );

            if could_hit_lock_mechanism_after_update {
                self.lever_position = self
                    .lever_position
                    .max(Ratio::new::<ratio>(Self::GEAR_LEVER_MAX_LOCK_POSITION));
            }
        }

        self.lever_position = self
            .lever_position
            .max(Ratio::new::<ratio>(0.))
            .min(Ratio::new::<ratio>(1.));

        self.lever_just_hit_lock_sound = previous_position.get::<ratio>()
            > Self::GEAR_LEVER_MAX_LOCK_POSITION
            && self.lever_position == Ratio::new::<ratio>(Self::GEAR_LEVER_MAX_LOCK_POSITION);
    }
}
impl LandingGearHandle for LandingGearHandleUnit {
    fn gear_handle_is_down(&self) -> bool {
        self.lever_position.get::<ratio>() >= Self::GEAR_LEVER_UP_DOWN_DETECTION_POSITION
    }

    fn gear_handle_baulk_locked(&self) -> bool {
        self.lever_should_lock_down
    }
}
impl SimulationElement for LandingGearHandleUnit {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let lever_down_req_raw: bool = reader.read(&self.gear_handle_position_requested_id);
        self.lever_commanded_down = lever_down_req_raw;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.gear_handle_real_position_id,
            self.lever_position.get::<ratio>(),
        );

        writer.write(
            &self.gear_handle_hits_lock_sound_id,
            self.lever_just_hit_lock_sound,
        );
    }
}

#[derive(PartialEq, Clone, Copy, Debug)]
enum LgciuStatus {
    Ok,
    FailedNotPowered,
    FailedNoChangeOver,
    FailedAutoChangeOver,
}

pub struct LandingGearControlInterfaceUnit {
    left_gear_downlock_id: VariableIdentifier,
    left_gear_unlock_id: VariableIdentifier,
    nose_gear_downlock_id: VariableIdentifier,
    nose_gear_unlock_id: VariableIdentifier,
    right_gear_downlock_id: VariableIdentifier,
    right_gear_unlock_id: VariableIdentifier,
    fault_ecam_id: VariableIdentifier,

    discrete_word_1_id: VariableIdentifier,
    discrete_word_2_id: VariableIdentifier,
    discrete_word_3_id: VariableIdentifier,

    is_powered: bool,
    is_powered_previous_state: bool,

    powered_by: ElectricalBusType,
    external_power_available: bool,

    sensor_inputs: LgciuSensorInputs,
    gear_system_control: GearSystemStateMachine,
    is_gear_lever_down: bool,

    transition_duration: Duration,
    gear_lever_position_is_down_previous_state: bool,
    status: LgciuStatus,

    power_supply_failure: Failure,
    internal_error_failure: Failure,

    is_active_computer_previous_state: bool,

    should_open_doors: bool,
    should_extend_gears: bool,
}
impl LandingGearControlInterfaceUnit {
    const MAX_TRANSITION_DURATION: Duration = Duration::from_secs(30);

    pub fn new(
        context: &mut InitContext,
        lgciu_id: LgciuId,
        powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            left_gear_downlock_id: context.get_identifier(format!(
                "LGCIU_{}_LEFT_GEAR_DOWNLOCKED",
                lgciu_number(lgciu_id)
            )),
            left_gear_unlock_id: context.get_identifier(format!(
                "LGCIU_{}_LEFT_GEAR_UNLOCKED",
                lgciu_number(lgciu_id)
            )),
            nose_gear_downlock_id: context.get_identifier(format!(
                "LGCIU_{}_NOSE_GEAR_DOWNLOCKED",
                lgciu_number(lgciu_id)
            )),
            nose_gear_unlock_id: context.get_identifier(format!(
                "LGCIU_{}_NOSE_GEAR_UNLOCKED",
                lgciu_number(lgciu_id)
            )),
            right_gear_downlock_id: context.get_identifier(format!(
                "LGCIU_{}_RIGHT_GEAR_DOWNLOCKED",
                lgciu_number(lgciu_id)
            )),
            right_gear_unlock_id: context.get_identifier(format!(
                "LGCIU_{}_RIGHT_GEAR_UNLOCKED",
                lgciu_number(lgciu_id)
            )),
            fault_ecam_id: context
                .get_identifier(format!("LGCIU_{}_FAULT", lgciu_number(lgciu_id))),

            discrete_word_1_id: context
                .get_identifier(format!("LGCIU_{}_DISCRETE_WORD_1", lgciu_number(lgciu_id))),
            discrete_word_2_id: context
                .get_identifier(format!("LGCIU_{}_DISCRETE_WORD_2", lgciu_number(lgciu_id))),
            discrete_word_3_id: context
                .get_identifier(format!("LGCIU_{}_DISCRETE_WORD_3", lgciu_number(lgciu_id))),

            is_powered: false,
            is_powered_previous_state: false,

            powered_by,
            external_power_available: false,

            sensor_inputs: LgciuSensorInputs::new(context, lgciu_id),
            gear_system_control: GearSystemStateMachine::default(),
            is_gear_lever_down: true,

            transition_duration: Duration::default(),
            gear_lever_position_is_down_previous_state: true,
            status: LgciuStatus::Ok,

            power_supply_failure: Failure::new(FailureType::LgciuPowerSupply(lgciu_id)),
            internal_error_failure: Failure::new(FailureType::LgciuInternalError(lgciu_id)),

            is_active_computer_previous_state: lgciu_id == LgciuId::Lgciu1,

            should_open_doors: false,
            should_extend_gears: context.start_gear_down(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        landing_gear: &LandingGear,
        gear_system_sensors: &impl GearSystemSensors,
        external_power_available: bool,
        gear_handle: &impl LandingGearHandle,
        is_master_computer: bool,
    ) {
        self.is_gear_lever_down = gear_handle.gear_handle_is_down();
        self.external_power_available = external_power_available;

        self.sensor_inputs.update(
            landing_gear,
            gear_system_sensors,
            external_power_available,
            self.is_powered,
        );

        if self.is_powered {
            if is_master_computer && !self.is_active_computer_previous_state {
                self.actions_when_becoming_master();
            }

            if !is_master_computer {
                self.actions_when_slave();
            }

            if !self.is_powered_previous_state {
                self.actions_when_startup();
            }

            if is_master_computer {
                self.monitor_gear_state();

                // Only allow statemachine to work if status is OK. If not outputs will be frozen at old value
                if self.status() == LgciuStatus::Ok {
                    self.gear_system_control
                        .update(&self.sensor_inputs, !self.is_gear_lever_down);

                    self.compute_open_doors_output();
                    self.compute_extend_gears_output();
                }
            }
        }

        if context.is_sim_ready() {
            self.update_monitoring(context, gear_handle);
        }

        self.is_active_computer_previous_state = is_master_computer;
        self.is_powered_previous_state = self.is_powered;
    }

    fn update_monitoring(&mut self, context: &UpdateContext, gear_handle: &impl LandingGearHandle) {
        self.update_transition_timer(context, gear_handle);

        if !self.is_powered {
            self.status = LgciuStatus::FailedNotPowered;
        } else if self.status == LgciuStatus::Ok {
            if self.transition_duration > Self::MAX_TRANSITION_DURATION {
                self.status = LgciuStatus::FailedNoChangeOver;
            }

            if self.internal_error_failure.is_active() {
                self.status = LgciuStatus::FailedAutoChangeOver;
            }
        }
    }

    fn update_transition_timer(
        &mut self,
        context: &UpdateContext,
        gear_handle: &impl LandingGearHandle,
    ) {
        match self.gear_system_state() {
            GearSystemState::AllUpLocked | GearSystemState::AllDownLocked => {
                if self.status == LgciuStatus::Ok {
                    self.transition_duration = Duration::default()
                } else {
                    self.transition_duration += context.delta()
                }
            }
            GearSystemState::Extending | GearSystemState::Retracting => {
                // If gear handle position is changed during transistion we reset transition timer
                if self.gear_lever_position_is_down_previous_state
                    == gear_handle.gear_handle_is_down()
                {
                    self.transition_duration += context.delta()
                } else {
                    self.transition_duration = Duration::default()
                }
            }
        };

        self.gear_lever_position_is_down_previous_state = gear_handle.gear_handle_is_down();
    }

    fn actions_when_becoming_master(&mut self) {
        self.reset_fault_timers();
        self.compute_init_gear_state();
    }

    fn actions_when_slave(&mut self) {
        self.reset_fault_timers();
    }

    fn actions_when_startup(&mut self) {
        self.reset_fault_timers();
        self.compute_init_gear_state();
    }

    fn compute_init_gear_state(&mut self) {
        self.status = if self
            .gear_system_control
            .init_gear_state(&self.sensor_inputs, !self.is_gear_lever_down)
        {
            //If state ok on init let's compute statemachine outputs
            self.compute_open_doors_output();
            self.compute_extend_gears_output();
            LgciuStatus::Ok
        } else {
            LgciuStatus::FailedNoChangeOver
        };
    }

    fn monitor_gear_state(&mut self) {
        self.status = if self
            .gear_system_control
            .check_gear_state(&self.sensor_inputs)
        {
            LgciuStatus::Ok
        } else {
            LgciuStatus::FailedNoChangeOver
        };
    }

    fn compute_open_doors_output(&mut self) {
        self.should_open_doors = match self.gear_system_control.state() {
            GearSystemState::AllUpLocked => false,
            GearSystemState::Retracting => !self.all_up_and_locked(),
            GearSystemState::Extending => !self.all_down_and_locked(),
            GearSystemState::AllDownLocked => false,
        };
    }

    fn compute_extend_gears_output(&mut self) {
        self.should_extend_gears = match self.gear_system_control.state() {
            GearSystemState::AllUpLocked => false,
            GearSystemState::Retracting => !(self.all_fully_opened() || self.all_up_and_locked()),
            GearSystemState::Extending => self.all_fully_opened() || self.all_down_and_locked(),
            GearSystemState::AllDownLocked => true,
        };
    }

    fn reset_fault_timers(&mut self) {
        self.transition_duration = Duration::default();
    }

    pub fn gear_system_state(&self) -> GearSystemState {
        self.gear_system_control.state()
    }

    fn status(&self) -> LgciuStatus {
        self.status
    }

    pub fn discrete_word_1(&self) -> Arinc429Word<u32> {
        if !self.is_powered {
            Arinc429Word::new(0, SignStatus::FailureWarning)
        } else {
            let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);
            word.set_bit(
                11,
                !self.sensor_inputs.left_gear_up_and_locked && !self.gear_handle_is_down(),
            );
            word.set_bit(
                12,
                !self.sensor_inputs.right_gear_up_and_locked && !self.gear_handle_is_down(),
            );
            word.set_bit(
                13,
                !self.sensor_inputs.nose_gear_up_and_locked && !self.gear_handle_is_down(),
            );
            word.set_bit(
                14,
                !self.sensor_inputs.left_gear_down_and_locked && self.gear_handle_is_down(),
            );
            word.set_bit(
                15,
                !self.sensor_inputs.right_gear_down_and_locked && self.gear_handle_is_down(),
            );
            word.set_bit(
                16,
                !self.sensor_inputs.nose_gear_down_and_locked && self.gear_handle_is_down(),
            );
            word.set_bit(17, !self.sensor_inputs.left_door_up_and_locked);
            word.set_bit(18, !self.sensor_inputs.right_door_up_and_locked);
            word.set_bit(19, !self.sensor_inputs.nose_door_up_and_locked);
            // The conditions for bits 20, 21 and 22 are not implemented, so they are set to false for now.
            word.set_bit(20, false);
            word.set_bit(21, false);
            word.set_bit(22, false);
            word.set_bit(23, self.sensor_inputs.downlock_state(GearWheel::LEFT));
            word.set_bit(24, self.sensor_inputs.downlock_state(GearWheel::RIGHT));
            word.set_bit(25, self.sensor_inputs.downlock_state(GearWheel::NOSE));
            word.set_bit(26, self.sensor_inputs.left_gear_compressed(true));
            word.set_bit(27, self.sensor_inputs.right_gear_compressed(true));
            word.set_bit(28, self.sensor_inputs.nose_gear_compressed(true));
            word.set_bit(29, self.gear_handle_is_down());

            word
        }
    }

    pub fn discrete_word_2(&self) -> Arinc429Word<u32> {
        if !self.is_powered {
            Arinc429Word::new(0, SignStatus::FailureWarning)
        } else {
            let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);
            word.set_bit(11, self.sensor_inputs.left_and_right_gear_compressed(false));
            word.set_bit(12, self.sensor_inputs.nose_gear_compressed(false));
            word.set_bit(13, self.sensor_inputs.left_gear_compressed(false));
            word.set_bit(14, self.sensor_inputs.right_gear_compressed(false));
            word.set_bit(
                15,
                self.sensor_inputs.left_gear_down_and_locked
                    && self.sensor_inputs.right_gear_down_and_locked,
            );

            word
        }
    }

    pub fn discrete_word_3(&self) -> Arinc429Word<u32> {
        if !self.is_powered {
            Arinc429Word::new(0, SignStatus::FailureWarning)
        } else {
            let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);
            word.set_bit(11, !self.sensor_inputs.left_gear_up_and_locked);
            word.set_bit(12, !self.sensor_inputs.right_gear_up_and_locked);
            word.set_bit(13, !self.sensor_inputs.nose_gear_up_and_locked);
            word.set_bit(14, !self.gear_handle_is_down());
            word.set_bit(25, self.sensor_inputs.left_door_fully_opened);
            word.set_bit(26, self.sensor_inputs.right_door_fully_opened);
            word.set_bit(27, self.sensor_inputs.nose_door_fully_opened);
            // Nose gear door should be seperated into left/right doors. For now, just copy the data.
            word.set_bit(28, self.sensor_inputs.nose_door_fully_opened);

            word
        }
    }
}
impl SimulationElement for LandingGearControlInterfaceUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.sensor_inputs.accept(visitor);
        self.internal_error_failure.accept(visitor);
        self.power_supply_failure.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered =
            !self.power_supply_failure.is_active() && buses.is_powered(self.powered_by);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.left_gear_unlock_id,
            self.is_powered
                && self
                    .sensor_inputs
                    .unlock_state(GearWheel::LEFT, self.gear_handle_is_down()),
        );
        writer.write(
            &self.left_gear_downlock_id,
            self.is_powered && self.sensor_inputs.downlock_state(GearWheel::LEFT),
        );

        writer.write(
            &self.nose_gear_unlock_id,
            self.is_powered
                && self
                    .sensor_inputs
                    .unlock_state(GearWheel::NOSE, self.gear_handle_is_down()),
        );
        writer.write(
            &self.nose_gear_downlock_id,
            self.is_powered && self.sensor_inputs.downlock_state(GearWheel::NOSE),
        );

        writer.write(
            &self.right_gear_unlock_id,
            self.is_powered
                && self
                    .sensor_inputs
                    .unlock_state(GearWheel::RIGHT, self.gear_handle_is_down()),
        );
        writer.write(
            &self.right_gear_downlock_id,
            self.is_powered && self.sensor_inputs.downlock_state(GearWheel::RIGHT),
        );

        writer.write(&self.fault_ecam_id, self.status() != LgciuStatus::Ok);

        writer.write(&self.discrete_word_1_id, self.discrete_word_1());
        writer.write(&self.discrete_word_2_id, self.discrete_word_2());
        writer.write(&self.discrete_word_3_id, self.discrete_word_3());
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
    fn left_gear_down_and_locked(&self) -> bool {
        self.sensor_inputs.left_gear_down_and_locked()
    }
    fn right_gear_down_and_locked(&self) -> bool {
        self.sensor_inputs.right_gear_down_and_locked()
    }
    fn nose_gear_down_and_locked(&self) -> bool {
        self.sensor_inputs.nose_gear_down_and_locked()
    }
    fn all_down_and_locked(&self) -> bool {
        self.sensor_inputs.all_down_and_locked()
    }
    fn all_up_and_locked(&self) -> bool {
        self.sensor_inputs.all_up_and_locked()
    }
    fn main_down_and_locked(&self) -> bool {
        self.sensor_inputs.main_down_and_locked()
    }
    fn main_up_and_locked(&self) -> bool {
        self.sensor_inputs.main_up_and_locked()
    }
    fn nose_down_and_locked(&self) -> bool {
        self.sensor_inputs.nose_down_and_locked()
    }
    fn nose_up_and_locked(&self) -> bool {
        self.sensor_inputs.nose_up_and_locked()
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
        self.should_open_doors
    }

    fn should_extend_gears(&self) -> bool {
        self.should_extend_gears
    }

    fn control_active(&self) -> bool {
        let stop_hyd_control = !self.gear_handle_is_down()
            && self.gear_system_state() == GearSystemState::AllUpLocked
            || (self.gear_handle_is_down()
                && self.gear_system_state() == GearSystemState::AllDownLocked);

        match self.status {
            LgciuStatus::Ok | LgciuStatus::FailedNoChangeOver => !stop_hyd_control,
            LgciuStatus::FailedNotPowered | LgciuStatus::FailedAutoChangeOver => false,
        }
    }
}
impl LandingGearHandle for LandingGearControlInterfaceUnit {
    fn gear_handle_is_down(&self) -> bool {
        self.is_gear_lever_down
    }

    fn gear_handle_baulk_locked(&self) -> bool {
        // Unpowered lgciu will lock mechanism
        !(self.is_powered
            && self.left_and_right_gear_extended(false)
            && self.nose_gear_extended(false))
    }
}

impl LgciuInterface for LandingGearControlInterfaceUnit {}

#[derive(PartialEq, Eq, Clone, Copy, Debug)]
pub enum GearSystemState {
    AllUpLocked,
    Retracting,
    Extending,
    AllDownLocked,
}

#[derive(Debug)]
struct GearSystemStateMachine {
    gears_state: GearSystemState,
}
impl GearSystemStateMachine {
    pub fn default() -> Self {
        Self {
            gears_state: GearSystemState::AllDownLocked,
        }
    }

    fn new_gear_state(
        &self,
        lgciu: &(impl LgciuGearExtension + LgciuDoorPosition),
        gear_handle_position_is_up: bool,
    ) -> GearSystemState {
        match self.gears_state {
            GearSystemState::AllUpLocked => {
                if !gear_handle_position_is_up {
                    GearSystemState::Extending
                } else {
                    GearSystemState::AllUpLocked
                }
            }
            GearSystemState::Retracting => {
                if lgciu.all_up_and_locked() && lgciu.all_closed_and_locked() {
                    GearSystemState::AllUpLocked
                } else if !gear_handle_position_is_up {
                    GearSystemState::Extending
                } else {
                    self.gears_state
                }
            }
            GearSystemState::Extending => {
                if lgciu.all_down_and_locked() && lgciu.all_closed_and_locked() {
                    GearSystemState::AllDownLocked
                } else if gear_handle_position_is_up {
                    GearSystemState::Retracting
                } else {
                    self.gears_state
                }
            }
            GearSystemState::AllDownLocked => {
                if gear_handle_position_is_up {
                    GearSystemState::Retracting
                } else {
                    self.gears_state
                }
            }
        }
    }

    /// Tries to figure out gear state from given inputs
    /// Typically used on init/reset
    /// Returns init status: true-> state is updated / false -> init is failed due to sensor inconsistency
    fn init_gear_state(
        &mut self,
        lgciu: &(impl LgciuGearExtension + LgciuDoorPosition),
        gear_handle_position_is_up: bool,
    ) -> bool {
        if self.doors_in_transition(lgciu) && self.gears_in_transition(lgciu) {
            return false;
        }

        self.gears_state = if lgciu.all_up_and_locked() && lgciu.all_closed_and_locked() {
            GearSystemState::AllUpLocked
        } else if lgciu.all_down_and_locked() && lgciu.all_closed_and_locked() {
            GearSystemState::AllDownLocked
        } else if gear_handle_position_is_up {
            GearSystemState::Retracting
        } else {
            GearSystemState::Extending
        };

        true
    }

    /// Checks if sensors are consistent with current state so we can monitor this continuously
    fn check_gear_state(&mut self, lgciu: &(impl LgciuGearExtension + LgciuDoorPosition)) -> bool {
        if self.doors_in_transition(lgciu) && self.gears_in_transition(lgciu) {
            return false;
        }

        match self.gears_state {
            GearSystemState::AllUpLocked => {
                lgciu.all_up_and_locked() && lgciu.all_closed_and_locked()
            }
            GearSystemState::AllDownLocked => {
                lgciu.all_down_and_locked() && lgciu.all_closed_and_locked()
            }
            GearSystemState::Extending | GearSystemState::Retracting => true,
        }
    }

    pub fn update(
        &mut self,
        lgciu: &(impl LgciuGearExtension + LgciuDoorPosition),
        gear_handle_position_is_up: bool,
    ) {
        self.gears_state = self.new_gear_state(lgciu, gear_handle_position_is_up);
    }

    pub fn state(&self) -> GearSystemState {
        self.gears_state
    }

    fn doors_in_transition(&self, lgciu: &(impl LgciuGearExtension + LgciuDoorPosition)) -> bool {
        !lgciu.all_fully_opened() && !lgciu.all_closed_and_locked()
    }

    fn gears_in_transition(&self, lgciu: &(impl LgciuGearExtension + LgciuDoorPosition)) -> bool {
        !lgciu.all_down_and_locked() && !lgciu.all_up_and_locked()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::simulation::test::{
        ElementCtorFn, ReadByName, SimulationTestBed, TestAircraft, TestBed, WriteByName,
    };
    use std::time::Duration;

    use crate::simulation::{
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, StartState,
        UpdateContext,
    };

    use crate::electrical::{test::TestElectricitySource, ElectricalBus, Electricity};
    use crate::shared::PotentialOrigin;

    use uom::si::{electric_potential::volt, pressure::psi};

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

        fn update(&mut self, controller: &impl LgciuGearControl, pressure: Pressure) {
            if pressure.get::<psi>() > 500. {
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
        fn is_wheel_id_up_and_locked(&self, _: GearWheel, _: LgciuId) -> bool {
            self.gear_position >= Self::UP_LOCK_TRESHOLD
        }

        fn is_wheel_id_down_and_locked(&self, _: GearWheel, _: LgciuId) -> bool {
            self.gear_position <= 1
        }

        fn is_door_id_up_and_locked(&self, _: GearWheel, _: LgciuId) -> bool {
            self.door_position >= Self::UP_LOCK_TRESHOLD
        }

        fn is_door_id_down_and_locked(&self, _: GearWheel, _: LgciuId) -> bool {
            self.door_position <= 1
        }
    }

    struct TestGearAircraft {
        landing_gear: LandingGear,
        lgcius: LandingGearControlInterfaceUnitSet,
        gear_system: TestGearSystem,

        powered_source_ac: TestElectricitySource,
        dc_ess_bus: ElectricalBus,
        pressure: Pressure,
    }
    impl TestGearAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                landing_gear: LandingGear::new(context),
                lgcius: LandingGearControlInterfaceUnitSet::new(
                    context,
                    ElectricalBusType::DirectCurrentEssential,
                    ElectricalBusType::DirectCurrentEssential,
                ),
                gear_system: TestGearSystem::new(),

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),

                pressure: Pressure::new::<psi>(3000.),
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.lgcius
                .update(context, &self.landing_gear, &self.gear_system, false);

            self.gear_system
                .update(self.lgcius.active_lgciu(), self.pressure);

            println!(
                "LGCIU STATE {:#?} / Doors OPENING {}  / Gears OPENING {} ",
                self.lgcius.active_lgciu().gear_system_control.state(),
                self.lgcius.active_lgciu().should_open_doors(),
                self.lgcius.active_lgciu().should_extend_gears()
            );

            println!(
                "Gear pos{} / Door pos{}",
                self.gear_system.gear_position, self.gear_system.door_position,
            );
        }

        fn set_no_pressure(&mut self) {
            self.pressure = Pressure::new::<psi>(0.);
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
            self.landing_gear.accept(visitor);
            self.lgcius.accept(visitor);
            visitor.visit(self);
        }
    }

    struct LgciusTestBed {
        test_bed: SimulationTestBed<TestGearAircraft>,
    }
    impl LgciusTestBed {
        fn new(start_state: StartState) -> Self {
            Self {
                test_bed: SimulationTestBed::new_with_start_state(
                    start_state,
                    TestGearAircraft::new,
                ),
            }
        }

        fn run_one_tick(mut self) -> Self {
            self.run_with_delta(Duration::from_secs_f64(0.1));
            self
        }

        fn in_flight(mut self) -> Self {
            self.set_on_ground(false);
            self = self.set_gear_handle_up();
            self
        }

        fn on_the_ground(mut self) -> Self {
            self.set_on_ground(true);
            self = self.set_gear_handle_down();
            self
        }

        fn set_gear_handle_up(mut self) -> Self {
            self.write_by_name("GEAR_LEVER_POSITION_REQUEST", 0.);
            self.run_with_delta(Duration::from_millis(1000));
            self
        }

        fn set_gear_handle_down(mut self) -> Self {
            self.write_by_name("GEAR_LEVER_POSITION_REQUEST", 1.);
            self.run_with_delta(Duration::from_millis(1000));
            self
        }

        fn is_gear_handle_lock_down_active(&mut self) -> bool {
            self.query(|a| a.lgcius.gear_handle_baulk_locked())
        }

        fn is_gear_handle_down(&mut self) -> bool {
            let lever_pos: f64 = self.read_by_name("GEAR_HANDLE_POSITION");
            lever_pos >= 0.90
        }

        fn is_gear_lever_lock_makes_sound(&mut self) -> bool {
            self.read_by_name("GEAR_HANDLE_HITS_LOCK_SOUND")
        }

        fn fail_hyd_pressure(&mut self) {
            self.command(|a| a.set_no_pressure());
        }
    }
    impl TestBed for LgciusTestBed {
        type Aircraft = TestGearAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestGearAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestGearAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed(start_state: StartState) -> LgciusTestBed {
        LgciusTestBed::new(start_state)
    }

    fn test_bed_on_ground_with() -> LgciusTestBed {
        test_bed(StartState::Apron)
    }

    fn test_bed_in_flight_with() -> LgciusTestBed {
        test_bed(StartState::Cruise)
    }

    #[test]
    fn all_weight_on_wheels_when_all_compressed() {
        let test_bed = run_test_bed_on_with_compression(
            Ratio::new::<ratio>(0.9),
            Ratio::new::<ratio>(0.9),
            Ratio::new::<ratio>(0.9),
        );

        assert!(test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::NOSE)));
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

        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::NOSE)));
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

        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::NOSE)));
        assert!(test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::LEFT)));
        assert!(!test_bed.query_element(|e| e.is_wheel_id_compressed(GearWheel::RIGHT)));
    }

    #[test]
    fn gear_lever_init_down_and_locked_on_ground() {
        let mut test_bed = test_bed_on_ground_with().on_the_ground().run_one_tick();

        assert!(test_bed.is_gear_handle_lock_down_active());

        assert!(test_bed.is_gear_handle_down());
    }

    #[test]
    fn gear_lever_locked_makes_locked_sound_once_when_trying_up() {
        let mut test_bed = test_bed_on_ground_with().on_the_ground().run_one_tick();

        assert!(test_bed.is_gear_handle_lock_down_active());
        assert!(test_bed.is_gear_handle_down());
        assert!(!test_bed.is_gear_lever_lock_makes_sound());

        test_bed = test_bed.on_the_ground().set_gear_handle_up();

        assert!(test_bed.is_gear_lever_lock_makes_sound());

        // Make sure next ticks sound doesn't play anymore
        test_bed = test_bed.run_one_tick();
        assert!(!test_bed.is_gear_lever_lock_makes_sound());

        test_bed = test_bed.run_one_tick();
        assert!(!test_bed.is_gear_lever_lock_makes_sound());
    }

    #[test]
    fn gear_lever_up_and_locked_can_go_down_but_not_up() {
        let mut test_bed = test_bed_in_flight_with().in_flight().run_one_tick();

        assert!(!test_bed.is_gear_handle_lock_down_active());
        assert!(!test_bed.is_gear_handle_down());

        test_bed = test_bed.on_the_ground().set_gear_handle_down();

        assert!(test_bed.is_gear_handle_lock_down_active());
        assert!(test_bed.is_gear_handle_down());

        test_bed = test_bed.on_the_ground().set_gear_handle_up();

        assert!(test_bed.is_gear_handle_lock_down_active());
        assert!(test_bed.is_gear_handle_down());
    }

    #[test]
    fn gear_lever_down_not_locked_in_flight() {
        let mut test_bed = test_bed_in_flight_with()
            .in_flight()
            .set_gear_handle_down()
            .run_one_tick();

        assert!(!test_bed.is_gear_handle_lock_down_active());
        assert!(test_bed.is_gear_handle_down());
    }

    #[test]
    fn gear_state_downlock_on_init() {
        let test_bed = SimulationTestBed::new(TestGearAircraft::new);

        assert!(test_bed.query(|a| a.lgcius.gear_system_state()) == GearSystemState::AllDownLocked);
    }

    #[test]
    fn gear_up_when_lever_up_down_when_lever_down() {
        let mut test_bed = test_bed_in_flight_with()
            .in_flight()
            .set_gear_handle_down()
            .run_one_tick();

        for _ in 0..2 {
            test_bed.run_without_delta();
        }

        assert!(test_bed.query(|a| a.lgcius.gear_system_state()) == GearSystemState::AllDownLocked);

        println!("GEAR UP!!");
        test_bed = test_bed.set_gear_handle_up().run_one_tick();

        for _ in 0..30 {
            test_bed.run_without_delta();
        }

        assert!(test_bed.query(|a| a.lgcius.gear_system_state()) == GearSystemState::AllUpLocked);

        // Gear DOWN
        test_bed = test_bed.set_gear_handle_down().run_one_tick();

        for _ in 0..30 {
            test_bed.run_without_delta();
        }

        assert!(test_bed.query(|a| a.lgcius.gear_system_state()) == GearSystemState::AllDownLocked);
    }

    #[test]
    fn lgciu_master_switch_on_gear_up() {
        let mut test_bed = test_bed_in_flight_with()
            .in_flight()
            .set_gear_handle_down()
            .run_one_tick();

        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);

        test_bed = test_bed.set_gear_handle_up().run_one_tick();

        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu2);

        test_bed = test_bed.set_gear_handle_down().run_one_tick();

        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu2);

        test_bed = test_bed.set_gear_handle_up().run_one_tick();

        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);
    }

    #[test]
    fn lgciu_master_switch_if_failed_lgciu_power_and_stays_on_same_lgciu() {
        let mut test_bed = test_bed_in_flight_with()
            .in_flight()
            .set_gear_handle_down()
            .run_one_tick();

        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);

        test_bed = test_bed.set_gear_handle_up().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu2);

        test_bed.fail(FailureType::LgciuPowerSupply(LgciuId::Lgciu2));

        // Two ticks needed after failure to have consistent state of lgciu vs coordinator
        test_bed = test_bed.run_one_tick().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);

        test_bed = test_bed.set_gear_handle_down().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);

        test_bed = test_bed.set_gear_handle_up().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);
    }

    #[test]
    fn lgciu_master_switch_if_unfailed_lgciu_power() {
        let mut test_bed = test_bed_in_flight_with()
            .in_flight()
            .set_gear_handle_down()
            .run_one_tick();

        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);

        test_bed = test_bed.set_gear_handle_up().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu2);

        test_bed.fail(FailureType::LgciuPowerSupply(LgciuId::Lgciu2));

        // Two ticks needed after failure to have consistent state of lgciu vs coordinator
        test_bed = test_bed.run_one_tick().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);

        test_bed.unfail(FailureType::LgciuPowerSupply(LgciuId::Lgciu2));

        test_bed = test_bed.set_gear_handle_down().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu1);

        test_bed = test_bed.set_gear_handle_up().run_one_tick();
        assert!(test_bed.query(|a| a.lgcius.active_lgciu_id()) == LgciuId::Lgciu2);
    }

    #[test]
    fn lgciu_master_fails_but_do_not_switch_if_gear_not_up_in_30s() {
        let mut test_bed = test_bed_in_flight_with()
            .in_flight()
            .set_gear_handle_down()
            .run_one_tick();

        test_bed = test_bed.set_gear_handle_up().run_one_tick();

        test_bed.fail_hyd_pressure();

        test_bed.run_with_delta(Duration::from_secs(28));
        assert!(test_bed.query(|a| a.lgcius.active_lgciu().status) == LgciuStatus::Ok);

        test_bed.run_with_delta(Duration::from_secs(3));
        assert!(test_bed.query(|a| a.lgcius.lgciu2().status) == LgciuStatus::FailedNoChangeOver);
        assert!(test_bed.query(|a| a.lgcius.lgciu1().status) == LgciuStatus::Ok);
    }

    #[test]
    fn tilting_gear_does_not_tilt_when_no_pitch_on_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", 0.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(0.5));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() <= 0.1);
    }

    #[test]
    fn tilting_gear_tilts_when_up_pitch_on_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", -5.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(0.5));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.2 && tilt_position.get::<ratio>() <= 0.8);
    }

    #[test]
    fn tilting_gear_tilts_at_max_angle_when_high_up_pitch_on_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", -15.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(0.5));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.99);
    }

    #[test]
    fn tilting_gear_tilts_at_max_angle_when_not_touching_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", -15.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(20.));

        // Give time to tilt mechanism to go down
        test_bed.run_with_delta(Duration::from_secs(2));

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.99);
    }

    #[test]
    fn tilting_gear_untilts_when_plane_inverted() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE BANK DEGREES", -180.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(20.));

        // Give time to tilt mechanism to go down
        test_bed.run_with_delta(Duration::from_secs(2));

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() <= 0.01);
    }

    #[test]
    fn tilting_gear_at_max_tilt_when_not_compressed_and_just_touching_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", 0.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(2.));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.99);
    }

    #[test]
    fn tilting_gear_start_tilting_when_touching_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", 0.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(1.9));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() < 1. && tilt_position.get::<ratio>() > 0.);
    }

    fn test_tilting_gear_left(context: &mut InitContext) -> TiltingGear {
        TiltingGear::new(
            context,
            Length::new::<meter>(0.28),
            1,
            Vector3::new(-5., -2., -5.),
            Angle::new::<degree>(9.),
        )
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
