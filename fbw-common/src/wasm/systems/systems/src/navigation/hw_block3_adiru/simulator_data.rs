use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, UpdateContext, VariableIdentifier,
};
use uom::si::{angular_velocity::degree_per_second, f64::*, velocity::foot_per_minute};

#[derive(Clone, Copy, Default)]
pub(crate) struct AdrSimulatorData {
    mach_id: VariableIdentifier,
    pub mach: Ratio,

    true_airspeed_id: VariableIdentifier,
    pub true_airspeed: Velocity,

    total_air_temperature_id: VariableIdentifier,
    pub total_air_temperature: ThermodynamicTemperature,

    angle_of_attack_id: VariableIdentifier,
    pub angle_of_attack: Angle,

    pub indicated_airspeed: Velocity,

    pub ambient_temperature: ThermodynamicTemperature,
}
impl AdrSimulatorData {
    pub(super) const MACH: &'static str = "AIRSPEED MACH";
    pub(super) const TRUE_AIRSPEED: &'static str = "AIRSPEED TRUE";
    pub(super) const TOTAL_AIR_TEMPERATURE: &'static str = "TOTAL AIR TEMPERATURE";
    pub(super) const ANGLE_OF_ATTACK: &'static str = "INCIDENCE ALPHA";

    pub(crate) fn new(context: &mut InitContext) -> Self {
        Self {
            mach_id: context.get_identifier(Self::MACH.to_owned()),
            mach: Default::default(),

            true_airspeed_id: context.get_identifier(Self::TRUE_AIRSPEED.to_owned()),
            true_airspeed: Default::default(),

            total_air_temperature_id: context
                .get_identifier(Self::TOTAL_AIR_TEMPERATURE.to_owned()),
            total_air_temperature: Default::default(),

            angle_of_attack_id: context.get_identifier(Self::ANGLE_OF_ATTACK.to_owned()),
            angle_of_attack: Default::default(),

            indicated_airspeed: Default::default(),

            ambient_temperature: Default::default(),
        }
    }

    pub(crate) fn update(&mut self, context: &UpdateContext) {
        self.indicated_airspeed = context.indicated_airspeed();
        self.ambient_temperature = context.ambient_temperature();
    }
}
impl SimulationElement for AdrSimulatorData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        // To reduce reads, we only read these values once and then share it with the underlying ADRs and IRs.
        self.mach = reader.read(&self.mach_id);
        self.true_airspeed = reader.read(&self.true_airspeed_id);
        self.total_air_temperature = reader.read(&self.total_air_temperature_id);
        self.angle_of_attack = reader.read(&self.angle_of_attack_id);
    }
}

#[derive(Clone, Copy, Default)]
pub(crate) struct IrSimulatorData {
    vertical_speed_id: VariableIdentifier,
    pub vertical_speed: Velocity,

    latitude_id: VariableIdentifier,
    pub latitude: Angle,

    longitude_id: VariableIdentifier,
    pub longitude: Angle,

    pitch_id: VariableIdentifier,
    pub pitch: Angle,

    roll_id: VariableIdentifier,
    pub roll: Angle,

    body_rotation_rate_x_id: VariableIdentifier,
    pub body_rotation_rate_x: AngularVelocity,

    body_rotation_rate_y_id: VariableIdentifier,
    pub body_rotation_rate_y: AngularVelocity,

    body_rotation_rate_z_id: VariableIdentifier,
    pub body_rotation_rate_z: AngularVelocity,

    pub body_acceleration_lat: Acceleration,

    pub body_acceleration_long: Acceleration,

    pub body_acceleration_normal: Acceleration,

    heading_id: VariableIdentifier,
    pub heading: Angle,

    true_heading_id: VariableIdentifier,
    pub true_heading: Angle,

    track_id: VariableIdentifier,
    pub track: Angle,

    true_track_id: VariableIdentifier,
    pub true_track: Angle,

    ground_speed_id: VariableIdentifier,
    pub ground_speed: Velocity,
}
impl IrSimulatorData {
    pub(super) const INERTIAL_VERTICAL_SPEED: &'static str = "VELOCITY WORLD Y";
    pub(super) const LATITUDE: &'static str = "PLANE LATITUDE";
    pub(super) const LONGITUDE: &'static str = "PLANE LONGITUDE";
    pub(super) const PITCH: &'static str = "PLANE PITCH DEGREES";
    pub(super) const ROLL: &'static str = "PLANE BANK DEGREES";
    pub(super) const BODY_ROTATION_RATE_X: &'static str = "ROTATION VELOCITY BODY X";
    pub(super) const BODY_ROTATION_RATE_Y: &'static str = "ROTATION VELOCITY BODY Y";
    pub(super) const BODY_ROTATION_RATE_Z: &'static str = "ROTATION VELOCITY BODY Z";
    pub(super) const HEADING: &'static str = "PLANE HEADING DEGREES MAGNETIC";
    pub(super) const TRUE_HEADING: &'static str = "PLANE HEADING DEGREES TRUE";
    pub(super) const TRACK: &'static str = "GPS GROUND MAGNETIC TRACK";
    pub(super) const TRUE_TRACK: &'static str = "GPS GROUND TRUE TRACK";
    pub(super) const GROUND_SPEED: &'static str = "GPS GROUND SPEED";

    pub(crate) fn new(context: &mut InitContext) -> Self {
        Self {
            vertical_speed_id: context.get_identifier(Self::INERTIAL_VERTICAL_SPEED.to_owned()),
            vertical_speed: Default::default(),

            latitude_id: context.get_identifier(Self::LATITUDE.to_owned()),
            latitude: Default::default(),

            longitude_id: context.get_identifier(Self::LONGITUDE.to_owned()),
            longitude: Default::default(),

            pitch_id: context.get_identifier(Self::PITCH.to_owned()),
            pitch: Default::default(),

            roll_id: context.get_identifier(Self::ROLL.to_owned()),
            roll: Default::default(),

            body_rotation_rate_x_id: context.get_identifier(Self::BODY_ROTATION_RATE_X.to_owned()),
            body_rotation_rate_x: Default::default(),

            body_rotation_rate_y_id: context.get_identifier(Self::BODY_ROTATION_RATE_Y.to_owned()),
            body_rotation_rate_y: Default::default(),

            body_rotation_rate_z_id: context.get_identifier(Self::BODY_ROTATION_RATE_Z.to_owned()),
            body_rotation_rate_z: Default::default(),

            body_acceleration_lat: Default::default(),

            body_acceleration_long: Default::default(),

            body_acceleration_normal: Default::default(),

            heading_id: context.get_identifier(Self::HEADING.to_owned()),
            heading: Default::default(),

            true_heading_id: context.get_identifier(Self::TRUE_HEADING.to_owned()),
            true_heading: Default::default(),

            track_id: context.get_identifier(Self::TRACK.to_owned()),
            track: Default::default(),

            true_track_id: context.get_identifier(Self::TRUE_TRACK.to_owned()),
            true_track: Default::default(),

            ground_speed_id: context.get_identifier(Self::GROUND_SPEED.to_owned()),
            ground_speed: Default::default(),
        }
    }

    pub(crate) fn update(&mut self, context: &UpdateContext) {
        self.body_acceleration_lat = context.lat_accel();
        self.body_acceleration_long = context.long_accel();
        self.body_acceleration_normal = context.vert_accel();
    }
}
impl SimulationElement for IrSimulatorData {
    fn read(&mut self, reader: &mut SimulatorReader) {
        // To reduce reads, we only read these values once and then share it with the underlying ADRs and IRs.
        let vertical_speed: f64 = reader.read(&self.vertical_speed_id);
        self.vertical_speed = Velocity::new::<foot_per_minute>(vertical_speed);
        self.latitude = reader.read(&self.latitude_id);
        self.longitude = reader.read(&self.longitude_id);
        self.pitch = reader.read(&self.pitch_id);
        self.roll = reader.read(&self.roll_id);
        let body_rotation_rate_x: f64 = reader.read(&self.body_rotation_rate_x_id);
        let body_rotation_rate_y: f64 = reader.read(&self.body_rotation_rate_y_id);
        let body_rotation_rate_z: f64 = reader.read(&self.body_rotation_rate_z_id);
        self.body_rotation_rate_x = AngularVelocity::new::<degree_per_second>(body_rotation_rate_x);
        self.body_rotation_rate_y = AngularVelocity::new::<degree_per_second>(body_rotation_rate_y);
        self.body_rotation_rate_z = AngularVelocity::new::<degree_per_second>(body_rotation_rate_z);
        self.heading = reader.read(&self.heading_id);
        self.true_heading = reader.read(&self.true_heading_id);
        self.track = reader.read(&self.track_id);
        self.true_track = reader.read(&self.true_track_id);
        self.ground_speed = reader.read(&self.ground_speed_id);
    }
}
