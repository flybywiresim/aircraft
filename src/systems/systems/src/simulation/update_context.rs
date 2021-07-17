use std::time::Duration;
use uom::si::{angle::radian, f64::*, time::second};

use super::{Read, SimulatorReader};

/// Provides data unowned by any system in the aircraft system simulation
/// for the purpose of handling a simulation tick.
#[derive(Clone, Copy, Debug)]
pub struct UpdateContext {
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
}
impl UpdateContext {
    pub(crate) const AMBIENT_TEMPERATURE_KEY: &'static str = "AMBIENT TEMPERATURE";
    pub(crate) const INDICATED_AIRSPEED_KEY: &'static str = "AIRSPEED INDICATED";
    pub(crate) const INDICATED_ALTITUDE_KEY: &'static str = "INDICATED ALTITUDE";
    pub(crate) const IS_ON_GROUND_KEY: &'static str = "SIM ON GROUND";
    pub(crate) const ACCEL_BODY_X_KEY: &'static str = "ACCELERATION BODY X";
    pub(crate) const ACCEL_BODY_Y_KEY: &'static str = "ACCELERATION BODY Y";
    pub(crate) const ACCEL_BODY_Z_KEY: &'static str = "ACCELERATION BODY Z";
    pub(crate) const PLANE_PITCH_KEY: &'static str = "PLANE PITCH DEGREES";
    pub(crate) const PLANE_BANK_KEY: &'static str = "PLANE BANK DEGREES";

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
            is_on_ground,
            longitudinal_acceleration,
            lateral_acceleration,
            vertical_acceleration,
            pitch,
            bank,
        }
    }

    /// Creates a context based on the data that was read from the simulator.
    pub(super) fn from_reader(reader: &mut SimulatorReader, delta_time: Duration) -> UpdateContext {
        UpdateContext {
            ambient_temperature: reader.read(UpdateContext::AMBIENT_TEMPERATURE_KEY),
            indicated_airspeed: reader.read(UpdateContext::INDICATED_AIRSPEED_KEY),
            indicated_altitude: reader.read(UpdateContext::INDICATED_ALTITUDE_KEY),
            is_on_ground: reader.read(UpdateContext::IS_ON_GROUND_KEY),
            delta: delta_time,
            longitudinal_acceleration: reader.read(UpdateContext::ACCEL_BODY_Z_KEY),
            lateral_acceleration: reader.read(UpdateContext::ACCEL_BODY_X_KEY),
            vertical_acceleration: reader.read(UpdateContext::ACCEL_BODY_Y_KEY),
            pitch: reader.read(UpdateContext::PLANE_PITCH_KEY),
            bank: reader.read(UpdateContext::PLANE_BANK_KEY),
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

    pub fn is_on_ground(&self) -> bool {
        self.is_on_ground
    }

    pub fn long_accel(&self) -> Acceleration {
        self.longitudinal_acceleration
    }

    pub fn lat_accel(&self) -> Acceleration {
        self.lateral_acceleration
    }

    pub fn vert_accel(&self) -> Acceleration {
        self.vertical_acceleration
    }

    pub fn pitch(&self) -> Angle {
        self.pitch
    }

    pub fn bank(&self) -> Angle {
        self.bank
    }
    pub fn with_delta(&self, delta: Duration) -> Self {
        let mut copy: UpdateContext = *self;
        copy.delta = delta;

        copy
    }
}
