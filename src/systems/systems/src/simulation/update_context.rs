use std::time::Duration;
use uom::si::{
    acceleration::foot_per_second_squared, f64::*, length::foot,
    thermodynamic_temperature::degree_celsius, time::second, velocity::{knot, foot_per_second},
    pressure::inch_of_mercury,
};

use super::SimulatorReader;

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
}
impl UpdateContext {
    pub(crate) const AMBIENT_TEMPERATURE_KEY: &'static str = "AMBIENT TEMPERATURE";
    pub(crate) const INDICATED_AIRSPEED_KEY: &'static str = "AIRSPEED INDICATED";
    pub(crate) const INDICATED_ALTITUDE_KEY: &'static str = "INDICATED ALTITUDE";
    pub(crate) const IS_ON_GROUND_KEY: &'static str = "SIM ON GROUND";
    pub(crate) const AMBIENT_PRESSURE_KEY: &'static str = "AMBIENT PRESSURE";
    pub(crate) const VERTICAL_SPEED_KEY: &'static str = "VELOCITY WORLD Y";

    pub(crate) const ACCEL_BODY_Z_KEY: &'static str = "ACCELERATION BODY Z";

    pub fn new(
        delta: Duration,
        indicated_airspeed: Velocity,
        indicated_altitude: Length,
        ambient_temperature: ThermodynamicTemperature,
        ambient_pressure: Pressure,
        is_on_ground: bool,
        vertical_speed: Velocity,
        longitudinal_acceleration: Acceleration,
    ) -> UpdateContext {
        UpdateContext {
            delta,
            indicated_airspeed,
            indicated_altitude,
            ambient_temperature,
            ambient_pressure,
            is_on_ground,
            vertical_speed,
            longitudinal_acceleration,
        }
    }

    /// Creates a context based on the data that was read from the simulator.
    pub(super) fn from_reader(reader: &mut SimulatorReader, delta_time: Duration) -> UpdateContext {
        UpdateContext {
            ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(
                reader.read_f64(UpdateContext::AMBIENT_TEMPERATURE_KEY),
            ),
            indicated_airspeed: Velocity::new::<knot>(
                reader.read_f64(UpdateContext::INDICATED_AIRSPEED_KEY),
            ),
            indicated_altitude: Length::new::<foot>(
                reader.read_f64(UpdateContext::INDICATED_ALTITUDE_KEY),
            ),
            ambient_pressure: Pressure::new::<inch_of_mercury>(
                reader.read_f64(UpdateContext::AMBIENT_PRESSURE_KEY),
            ),
            is_on_ground: reader.read_bool(UpdateContext::IS_ON_GROUND_KEY),
            vertical_speed: Velocity::new::<foot_per_second>(
                reader.read_f64(UpdateContext::VERTICAL_SPEED_KEY),
            ),
            delta: delta_time,
            longitudinal_acceleration: Acceleration::new::<foot_per_second_squared>(
                reader.read_f64(UpdateContext::ACCEL_BODY_Z_KEY),
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
        self.longitudinal_acceleration
    }

    pub fn with_delta(&self, delta: Duration) -> Self {
        let mut copy: UpdateContext = *self;
        copy.delta = delta;

        copy
    }
}
