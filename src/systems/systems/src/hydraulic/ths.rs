use uom::si::{
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    power::watt,
    pressure::psi,
    ratio::ratio,
    torque::{newton_meter, pound_force_inch},
    volume::{cubic_inch, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

use crate::simulation::{
    InitContext, SimulationElement, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};

struct TrimmingWheels {
    position: Angle,
    speed: AngularVelocity,

    min_angle: Angle,
    max_angle: Angle,
}
impl TrimmingWheels {
    fn new(context: &InitContext, min_angle: Angle, max_angle: Angle) -> Self {
        Self {
            position: Angle::default(),
            speed: AngularVelocity::default(),

            min_angle,
            max_angle,
        }
    }
}

struct ElectricDriveMotor {
    speed: AngularVelocity,
    position_request: Angle,

    is_active: bool,
    max_speed: AngularVelocity,

    ratio_to_trimwheel: Ratio,

    speed_target_map: [f64; 7],
    speed_error_map: [f64; 7],
}
impl ElectricDriveMotor {
    fn new(
        max_speed: AngularVelocity,
        ratio_to_trimwheel: Ratio,
        speed_target_map: [f64; 7],
        speed_error_map: [f64; 7],
    ) -> Self {
        Self {
            speed: AngularVelocity::default(),
            position_request: Angle::default(),

            is_active: false,
            max_speed,

            ratio_to_trimwheel,

            speed_target_map,
            speed_error_map,
        }
    }
}
