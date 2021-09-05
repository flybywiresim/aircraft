use uom::si::{
    angular_acceleration::radian_per_second_squared,
    angular_velocity::radian_per_second,
    f64::*,
    power::watt,
    pressure::psi,
    ratio::ratio,
    torque::newton_meter,
    volume::{cubic_inch, gallon},
    volume_rate::gallon_per_second,
};

use super::brake_circuit::Actuator;

struct GeneratorControlUnit {
    is_active: bool,
    power_demand: f64,
    power_target: f64,
    valve_position_request: Ratio,
    max_allowed_power_rpm_breakpoints: [f64; 9],
    max_allowed_power: [f64; 9],
}
impl GeneratorControlUnit {
    fn update_gcu_control(&mut self, hydraulic_motor: &HydraulicMotor) {}
}

struct HydraulicMotor {
    acceleration: AngularAcceleration,
    speed: AngularVelocity,

    intertia: f64,
    generated_torque: Torque,
    total_torque: Torque,
    displacement: Volume,
    virtual_displacement: Volume,
    currentflow: VolumeRate,

    valve_position: Ratio,
    valve_dynamic_filter: f64,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,
}
impl HydraulicMotor {
    fn update_valve_position(&mut self) {}
}

struct Generator {
    speed: AngularVelocity,
    efficiency: f64,
    elec_power_generated: Power,
    resistant_torque: Torque,
}
impl Generator {}

struct ElectricalGenerator {
    hyd_motor: HydraulicMotor,
    generator: Generator,
}
impl ElectricalGenerator {}
impl Actuator for ElectricalGenerator {
    fn used_volume(&self) -> Volume {
        Volume::new::<gallon>(0.)
    }
    fn reservoir_return(&self) -> Volume {
        Volume::new::<gallon>(0.)
    }
}
