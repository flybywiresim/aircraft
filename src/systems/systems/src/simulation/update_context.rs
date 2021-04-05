use std::time::Duration;
use uom::si::{f64::*, length::foot, thermodynamic_temperature::degree_celsius, velocity::knot};

use super::SimulatorReader;

/// Provides data unowned by any system in the aircraft system simulation
/// for the purpose of handling a simulation tick.
#[derive(Debug)]
pub struct UpdateContext {
    delta: Duration,
    indicated_airspeed: Velocity,
    indicated_altitude: Length,
    ambient_temperature: ThermodynamicTemperature,
    is_on_ground: bool,
}
impl UpdateContext {
    pub(crate) const AMBIENT_TEMPERATURE_KEY: &'static str = "AMBIENT TEMPERATURE";
    pub(crate) const INDICATED_AIRSPEED_KEY: &'static str = "AIRSPEED INDICATED";
    pub(crate) const INDICATED_ALTITUDE_KEY: &'static str = "INDICATED ALTITUDE";
    pub(crate) const IS_ON_GROUND_KEY: &'static str = "SIM ON GROUND";

    pub fn new(
        delta: Duration,
        indicated_airspeed: Velocity,
        indicated_altitude: Length,
        ambient_temperature: ThermodynamicTemperature,
        is_on_ground: bool,
    ) -> UpdateContext {
        UpdateContext {
            delta,
            indicated_airspeed,
            indicated_altitude,
            ambient_temperature,
            is_on_ground,
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
            is_on_ground: reader.read_bool(UpdateContext::IS_ON_GROUND_KEY),
            delta: delta_time,
        }
    }

    pub fn is_in_flight(&self) -> bool {
        !self.is_on_ground
    }

    pub fn delta(&self) -> Duration {
        self.delta
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
}
