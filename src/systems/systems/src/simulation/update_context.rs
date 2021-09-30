use std::time::Duration;
use uom::si::{
    acceleration::meter_per_second_squared, angle::radian, f64::*, pressure::inch_of_mercury,
    time::second, velocity::foot_per_minute,
};

use super::{Read, SimulatorReader};
use nalgebra::{Rotation3, Vector3};

#[derive(Clone, Copy, Debug)]
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
#[derive(Clone, Copy, Debug)]
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
    delta: Duration,
    indicated_airspeed: Velocity,
    indicated_altitude: Length,
    ambient_temperature: ThermodynamicTemperature,
    ambient_pressure: Pressure,
    is_on_ground: bool,
    vertical_speed: Velocity,
    local_acceleration: LocalAcceleration,
    attitude: Attitude,
}
impl UpdateContext {
    pub(crate) const AMBIENT_TEMPERATURE_KEY: &'static str = "AMBIENT TEMPERATURE";
    pub(crate) const INDICATED_AIRSPEED_KEY: &'static str = "AIRSPEED INDICATED";
    pub(crate) const INDICATED_ALTITUDE_KEY: &'static str = "INDICATED ALTITUDE";
    pub(crate) const IS_ON_GROUND_KEY: &'static str = "SIM ON GROUND";
    pub(crate) const AMBIENT_PRESSURE_KEY: &'static str = "AMBIENT PRESSURE";
    pub(crate) const VERTICAL_SPEED_KEY: &'static str = "VELOCITY WORLD Y";
    pub(crate) const ACCEL_BODY_X_KEY: &'static str = "ACCELERATION BODY X";
    pub(crate) const ACCEL_BODY_Y_KEY: &'static str = "ACCELERATION BODY Y";
    pub(crate) const ACCEL_BODY_Z_KEY: &'static str = "ACCELERATION BODY Z";
    pub(crate) const PLANE_PITCH_KEY: &'static str = "PLANE PITCH DEGREES";
    pub(crate) const PLANE_BANK_KEY: &'static str = "PLANE BANK DEGREES";

    #[allow(clippy::too_many_arguments)]
    pub fn new(
        delta: Duration,
        indicated_airspeed: Velocity,
        indicated_altitude: Length,
        ambient_temperature: ThermodynamicTemperature,
        is_on_ground: bool,
        longitudinal_acceleration: Acceleration,
        lateral_acceleration: Acceleration,
        vertical_acceleration: Acceleration,
        pitch: Angle,
        bank: Angle,
    ) -> UpdateContext {
        UpdateContext {
            delta,
            indicated_airspeed,
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
        }
    }

    /// Creates a context based on the data that was read from the simulator.
    pub(super) fn from_reader(reader: &mut SimulatorReader, delta_time: Duration) -> UpdateContext {
        UpdateContext {
            ambient_temperature: reader.read(UpdateContext::AMBIENT_TEMPERATURE_KEY),
            indicated_airspeed: reader.read(UpdateContext::INDICATED_AIRSPEED_KEY),
            indicated_altitude: reader.read(UpdateContext::INDICATED_ALTITUDE_KEY),
            is_on_ground: reader.read(UpdateContext::IS_ON_GROUND_KEY),
            ambient_pressure: Pressure::new::<inch_of_mercury>(
                reader.read(UpdateContext::AMBIENT_PRESSURE_KEY),
            ),
            vertical_speed: Velocity::new::<foot_per_minute>(
                reader.read(UpdateContext::VERTICAL_SPEED_KEY),
            ),
            delta: delta_time,
            local_acceleration: LocalAcceleration::new(
                reader.read(UpdateContext::ACCEL_BODY_X_KEY),
                reader.read(UpdateContext::ACCEL_BODY_Y_KEY),
                reader.read(UpdateContext::ACCEL_BODY_Z_KEY),
            ),

            attitude: Attitude::new(
                reader.read(UpdateContext::PLANE_PITCH_KEY),
                reader.read(UpdateContext::PLANE_BANK_KEY),
            ),
        }
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

    pub fn with_delta(&self, delta: Duration) -> Self {
        let mut copy: UpdateContext = *self;
        copy.delta = delta;

        copy
    }
}
