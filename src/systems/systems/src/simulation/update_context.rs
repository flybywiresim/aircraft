use std::time::Duration;
use uom::si::{
    acceleration::meter_per_second_squared, angle::radian, f64::*, pressure::inch_of_mercury,
    time::second, velocity::foot_per_minute,
};

use super::{Read, SimulatorReader};
use crate::{
    shared::MachNumber,
    simulation::{InitContext, VariableIdentifier},
};
use nalgebra::{Rotation3, Vector3};

#[derive(Clone, Copy, Debug, Default)]
pub struct Attitude {
    pitch: Angle,
    bank: Angle,
}
impl Attitude {
    fn new(pitch: Angle, bank: Angle) -> Self {
        Self { pitch, bank }
    }

    pub fn pitch_rotation_transform(&self) -> Rotation3<f64> {
        Rotation3::from_axis_angle(&Vector3::x_axis(), self.pitch.get::<radian>())
    }

    pub fn bank_rotation_transform(&self) -> Rotation3<f64> {
        Rotation3::from_axis_angle(&Vector3::z_axis(), -self.bank.get::<radian>())
    }

    fn pitch(&self) -> Angle {
        self.pitch
    }

    fn bank(&self) -> Angle {
        self.bank
    }
}
#[derive(Clone, Copy, Debug, Default)]
pub struct LocalAcceleration {
    acceleration: [Acceleration; 3],
}
impl LocalAcceleration {
    const ACCEL_X_AXIS: usize = 0;
    const ACCEL_Y_AXIS: usize = 1;
    const ACCEL_Z_AXIS: usize = 2;

    fn new(
        lateral_acceleration: Acceleration,
        vertical_acceleration: Acceleration,
        longitudinal_acceleration: Acceleration,
    ) -> Self {
        Self {
            acceleration: [
                lateral_acceleration,
                vertical_acceleration,
                longitudinal_acceleration,
            ],
        }
    }

    fn long_accel(&self) -> Acceleration {
        self.acceleration[Self::ACCEL_Z_AXIS]
    }

    fn lat_accel(&self) -> Acceleration {
        self.acceleration[Self::ACCEL_X_AXIS]
    }

    fn vert_accel(&self) -> Acceleration {
        self.acceleration[Self::ACCEL_Y_AXIS]
    }

    pub fn to_ms2_vector(&self) -> Vector3<f64> {
        Vector3::new(
            self.lat_accel().get::<meter_per_second_squared>(),
            self.vert_accel().get::<meter_per_second_squared>(),
            self.long_accel().get::<meter_per_second_squared>(),
        )
    }
}
/// Provides data unowned by any system in the aircraft system simulation
/// for the purpose of handling a simulation tick.
#[derive(Clone, Copy, Debug)]
pub struct UpdateContext {
    ambient_temperature_id: VariableIdentifier,
    indicated_airspeed_id: VariableIdentifier,
    true_airspeed_id: VariableIdentifier,
    indicated_altitude_id: VariableIdentifier,
    is_on_ground_id: VariableIdentifier,
    ambient_pressure_id: VariableIdentifier,
    vertical_speed_id: VariableIdentifier,
    accel_body_x_id: VariableIdentifier,
    accel_body_y_id: VariableIdentifier,
    accel_body_z_id: VariableIdentifier,
    plane_pitch_id: VariableIdentifier,
    plane_bank_id: VariableIdentifier,
    mach_number_id: VariableIdentifier,

    delta: Duration,
    indicated_airspeed: Velocity,
    true_airspeed: Velocity,
    indicated_altitude: Length,
    ambient_temperature: ThermodynamicTemperature,
    ambient_pressure: Pressure,
    is_on_ground: bool,
    vertical_speed: Velocity,
    local_acceleration: LocalAcceleration,
    attitude: Attitude,
    mach_number: MachNumber,
}
impl UpdateContext {
    pub(crate) const AMBIENT_TEMPERATURE_KEY: &'static str = "AMBIENT TEMPERATURE";
    pub(crate) const INDICATED_AIRSPEED_KEY: &'static str = "AIRSPEED INDICATED";
    pub(crate) const TRUE_AIRSPEED_KEY: &'static str = "AIRSPEED TRUE";
    pub(crate) const INDICATED_ALTITUDE_KEY: &'static str = "INDICATED ALTITUDE";
    pub(crate) const IS_ON_GROUND_KEY: &'static str = "SIM ON GROUND";
    pub(crate) const AMBIENT_PRESSURE_KEY: &'static str = "AMBIENT PRESSURE";
    pub(crate) const VERTICAL_SPEED_KEY: &'static str = "VELOCITY WORLD Y";
    pub(crate) const ACCEL_BODY_X_KEY: &'static str = "ACCELERATION BODY X";
    pub(crate) const ACCEL_BODY_Y_KEY: &'static str = "ACCELERATION BODY Y";
    pub(crate) const ACCEL_BODY_Z_KEY: &'static str = "ACCELERATION BODY Z";
    pub(crate) const PLANE_PITCH_KEY: &'static str = "PLANE PITCH DEGREES";
    pub(crate) const PLANE_BANK_KEY: &'static str = "PLANE BANK DEGREES";
    pub(crate) const MACH_NUMBER_KEY: &'static str = "AIRSPEED MACH";

    #[deprecated(
        note = "Do not create UpdateContext directly. Instead use the SimulationTestBed or your own custom test bed."
    )]
    pub fn new(
        context: &mut InitContext,
        delta: Duration,
        indicated_airspeed: Velocity,
        true_airspeed: Velocity,
        indicated_altitude: Length,
        ambient_temperature: ThermodynamicTemperature,
        is_on_ground: bool,
        longitudinal_acceleration: Acceleration,
        lateral_acceleration: Acceleration,
        vertical_acceleration: Acceleration,
        pitch: Angle,
        bank: Angle,
        mach_number: MachNumber,
    ) -> UpdateContext {
        UpdateContext {
            ambient_temperature_id: context
                .get_identifier(Self::AMBIENT_TEMPERATURE_KEY.to_owned()),
            indicated_airspeed_id: context.get_identifier(Self::INDICATED_AIRSPEED_KEY.to_owned()),
            true_airspeed_id: context.get_identifier(Self::TRUE_AIRSPEED_KEY.to_owned()),
            indicated_altitude_id: context.get_identifier(Self::INDICATED_ALTITUDE_KEY.to_owned()),
            is_on_ground_id: context.get_identifier(Self::IS_ON_GROUND_KEY.to_owned()),
            ambient_pressure_id: context.get_identifier(Self::AMBIENT_PRESSURE_KEY.to_owned()),
            vertical_speed_id: context.get_identifier(Self::VERTICAL_SPEED_KEY.to_owned()),
            accel_body_x_id: context.get_identifier(Self::ACCEL_BODY_X_KEY.to_owned()),
            accel_body_y_id: context.get_identifier(Self::ACCEL_BODY_Y_KEY.to_owned()),
            accel_body_z_id: context.get_identifier(Self::ACCEL_BODY_Z_KEY.to_owned()),
            plane_pitch_id: context.get_identifier(Self::PLANE_PITCH_KEY.to_owned()),
            plane_bank_id: context.get_identifier(Self::PLANE_BANK_KEY.to_owned()),
            mach_number_id: context.get_identifier(Self::MACH_NUMBER_KEY.to_owned()),

            delta,
            indicated_airspeed,
            true_airspeed,
            indicated_altitude,
            ambient_temperature,
            ambient_pressure: Pressure::new::<inch_of_mercury>(29.92),
            is_on_ground,
            vertical_speed: Velocity::new::<foot_per_minute>(0.),
            local_acceleration: LocalAcceleration::new(
                lateral_acceleration,
                vertical_acceleration,
                longitudinal_acceleration,
            ),
            attitude: Attitude::new(pitch, bank),
            mach_number,
        }
    }

    pub(super) fn new_for_simulation(context: &mut InitContext) -> UpdateContext {
        UpdateContext {
            ambient_temperature_id: context.get_identifier("AMBIENT TEMPERATURE".to_owned()),
            indicated_airspeed_id: context.get_identifier("AIRSPEED INDICATED".to_owned()),
            true_airspeed_id: context.get_identifier("AIRSPEED TRUE".to_owned()),
            indicated_altitude_id: context.get_identifier("INDICATED ALTITUDE".to_owned()),
            is_on_ground_id: context.get_identifier("SIM ON GROUND".to_owned()),
            ambient_pressure_id: context.get_identifier("AMBIENT PRESSURE".to_owned()),
            vertical_speed_id: context.get_identifier("VELOCITY WORLD Y".to_owned()),
            accel_body_x_id: context.get_identifier("ACCELERATION BODY X".to_owned()),
            accel_body_y_id: context.get_identifier("ACCELERATION BODY Y".to_owned()),
            accel_body_z_id: context.get_identifier("ACCELERATION BODY Z".to_owned()),
            plane_pitch_id: context.get_identifier("PLANE PITCH DEGREES".to_owned()),
            plane_bank_id: context.get_identifier("PLANE BANK DEGREES".to_owned()),
            mach_number_id: context.get_identifier("AIRSPEED MACH".to_owned()),

            delta: Default::default(),
            indicated_airspeed: Default::default(),
            true_airspeed: Default::default(),
            indicated_altitude: Default::default(),
            ambient_temperature: Default::default(),
            ambient_pressure: Default::default(),
            is_on_ground: Default::default(),
            vertical_speed: Default::default(),
            local_acceleration: Default::default(),
            attitude: Default::default(),
            mach_number: Default::default(),
        }
    }

    /// Updates a context based on the data that was read from the simulator.
    pub(super) fn update(&mut self, reader: &mut SimulatorReader, delta_time: Duration) {
        self.ambient_temperature = reader.read(&self.ambient_temperature_id);
        self.indicated_airspeed = reader.read(&self.indicated_airspeed_id);
        self.true_airspeed = reader.read(&self.true_airspeed_id);
        self.indicated_altitude = reader.read(&self.indicated_altitude_id);
        self.is_on_ground = reader.read(&self.is_on_ground_id);
        self.ambient_pressure =
            Pressure::new::<inch_of_mercury>(reader.read(&self.ambient_pressure_id));
        self.vertical_speed =
            Velocity::new::<foot_per_minute>(reader.read(&self.vertical_speed_id));
        self.delta = delta_time;
        self.local_acceleration = LocalAcceleration::new(
            reader.read(&self.accel_body_x_id),
            reader.read(&self.accel_body_y_id),
            reader.read(&self.accel_body_z_id),
        );

        self.attitude = Attitude::new(
            reader.read(&self.plane_pitch_id),
            reader.read(&self.plane_bank_id),
        );

        self.mach_number = reader.read(&self.mach_number_id);
    }

    pub fn is_in_flight(&self) -> bool {
        !self.is_on_ground
    }

    pub fn delta(&self) -> Duration {
        self.delta
    }

    pub fn delta_as_secs_f64(&self) -> f64 {
        self.delta.as_secs_f64()
    }

    pub fn delta_as_time(&self) -> Time {
        Time::new::<second>(self.delta.as_secs_f64())
    }

    pub fn indicated_airspeed(&self) -> Velocity {
        self.indicated_airspeed
    }

    pub fn true_airspeed(&self) -> Velocity {
        self.true_airspeed
    }

    pub fn indicated_altitude(&self) -> Length {
        self.indicated_altitude
    }

    pub fn ambient_temperature(&self) -> ThermodynamicTemperature {
        self.ambient_temperature
    }

    pub fn ambient_pressure(&self) -> Pressure {
        self.ambient_pressure
    }

    pub fn vertical_speed(&self) -> Velocity {
        self.vertical_speed
    }

    pub fn is_on_ground(&self) -> bool {
        self.is_on_ground
    }

    pub fn long_accel(&self) -> Acceleration {
        self.local_acceleration.long_accel()
    }

    pub fn lat_accel(&self) -> Acceleration {
        self.local_acceleration.lat_accel()
    }

    pub fn vert_accel(&self) -> Acceleration {
        self.local_acceleration.vert_accel()
    }

    pub fn acceleration(&self) -> LocalAcceleration {
        self.local_acceleration
    }

    pub fn pitch(&self) -> Angle {
        self.attitude.pitch()
    }

    pub fn bank(&self) -> Angle {
        self.attitude.bank()
    }

    pub fn attitude(&self) -> Attitude {
        self.attitude
    }

    pub fn mach_number(&self) -> MachNumber {
        self.mach_number
    }

    pub fn with_delta(&self, delta: Duration) -> Self {
        let mut copy: UpdateContext = *self;
        copy.delta = delta;

        copy
    }
}
