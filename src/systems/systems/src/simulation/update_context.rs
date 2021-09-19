use std::time::Duration;
use uom::si::{f64::*, pressure::inch_of_mercury, time::second, velocity::foot_per_minute};

use super::{Read, SimulatorReader};

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
            ambient_pressure: Pressure::new::<inch_of_mercury>(
                reader.read(UpdateContext::AMBIENT_PRESSURE_KEY),
            ),
            vertical_speed: Velocity::new::<foot_per_minute>(
                reader.read(UpdateContext::VERTICAL_SPEED_KEY),
            ),
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
