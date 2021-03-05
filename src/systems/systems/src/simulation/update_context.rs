use std::time::Duration;
use uom::si::{
    acceleration::foot_per_second_squared, f64::*, length::foot,
    thermodynamic_temperature::degree_celsius, velocity::knot,
};

use super::SimulatorReader;

/// Provides data unowned by any system in the aircraft system simulation
/// for the purpose of handling a simulation tick.
#[derive(Debug)]
pub struct UpdateContext {
    pub delta: Duration,
    pub indicated_airspeed: Velocity,
    pub indicated_altitude: Length,
    pub ambient_temperature: ThermodynamicTemperature,
    pub is_on_ground: bool,
    pub acc_long: Acceleration,
    pub wheel_center_rpm: f64,
    pub wheel_left_rpm: f64,
    pub wheel_right_rpm: f64,
}
impl UpdateContext {
    pub fn new(
        delta: Duration,
        indicated_airspeed: Velocity,
        indicated_altitude: Length,
        ambient_temperature: ThermodynamicTemperature,
        is_on_ground: bool,
        acc_long: Acceleration,
        wheel_center_rpm: f64,
        wheel_left_rpm: f64,
        wheel_right_rpm: f64,
    ) -> UpdateContext {
        UpdateContext {
            delta,
            indicated_airspeed,
            indicated_altitude,
            ambient_temperature,
            is_on_ground,
            acc_long: Acceleration::new::<foot_per_second_squared>(0.),
            wheel_center_rpm: 0.0,
            wheel_left_rpm: 0.0,
            wheel_right_rpm: 0.0,
        }
    }

    /// Creates a context based on the data that was read from the simulator.
    pub(super) fn from_reader(reader: &mut SimulatorReader, delta_time: Duration) -> UpdateContext {
        UpdateContext {
            ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(
                reader.read_f64("AMBIENT TEMPERATURE"),
            ),
            indicated_airspeed: Velocity::new::<knot>(reader.read_f64("AIRSPEED INDICATED")),
            indicated_altitude: Length::new::<foot>(reader.read_f64("INDICATED ALTITUDE")),
            is_on_ground: reader.read_bool("SIM ON GROUND"),
            delta: delta_time,
            acc_long: Acceleration::new::<foot_per_second_squared>(reader.read_f64("LONG ACC")),
            wheel_center_rpm: reader.read_f64("WHEEL RPM CENTER"),
            wheel_left_rpm: reader.read_f64("WHEEL RPM LEFT"),
            wheel_right_rpm: reader.read_f64("WHEEL RPM RIGHT"),
        }
    }

    pub fn is_in_flight(&self) -> bool {
        !self.is_on_ground
    }
}

pub fn context_with() -> UpdateContextBuilder {
    UpdateContextBuilder::new()
}

pub fn context() -> UpdateContext {
    context_with().build()
}

pub struct UpdateContextBuilder {
    delta: Duration,
    indicated_airspeed: Velocity,
    indicated_altitude: Length,
    ambient_temperature: ThermodynamicTemperature,
    on_ground: bool,
    acc_long: Acceleration,
    wheel_center_rpm: f64,
    wheel_left_rpm: f64,
    wheel_right_rpm: f64,
}
impl UpdateContextBuilder {
    fn new() -> UpdateContextBuilder {
        UpdateContextBuilder {
            delta: Duration::from_secs(1),
            indicated_airspeed: Velocity::new::<knot>(250.),
            indicated_altitude: Length::new::<foot>(5000.),
            ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
            on_ground: false,
            acc_long: Acceleration::new::<foot_per_second_squared>(0.),
            wheel_center_rpm: 0.0,
            wheel_left_rpm: 0.0,
            wheel_right_rpm: 0.0,
        }
    }

    pub fn build(&self) -> UpdateContext {
        UpdateContext::new(
            self.delta,
            self.indicated_airspeed,
            self.indicated_altitude,
            self.ambient_temperature,
            self.on_ground,
            self.acc_long,
            self.wheel_center_rpm,
            self.wheel_left_rpm,
            self.wheel_right_rpm,
        )
    }

    pub fn and(self) -> UpdateContextBuilder {
        self
    }

    pub fn delta(mut self, delta: Duration) -> UpdateContextBuilder {
        self.delta = delta;
        self
    }

    pub fn indicated_airspeed(mut self, indicated_airspeed: Velocity) -> UpdateContextBuilder {
        self.indicated_airspeed = indicated_airspeed;
        self
    }

    pub fn indicated_altitude(mut self, indicated_altitude: Length) -> UpdateContextBuilder {
        self.indicated_altitude = indicated_altitude;
        self
    }

    pub fn ambient_temperature(
        mut self,
        ambient_temperature: ThermodynamicTemperature,
    ) -> UpdateContextBuilder {
        self.ambient_temperature = ambient_temperature;
        self
    }

    pub fn on_ground(mut self, on_ground: bool) -> UpdateContextBuilder {
        self.on_ground = on_ground;
        self
    }
}
