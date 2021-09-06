use uom::si::{
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    power::watt,
    pressure::psi,
    ratio::ratio,
    torque::newton_meter,
    volume::{cubic_inch, gallon},
    volume_rate::gallon_per_second,
};

use crate::simulation::UpdateContext;

use super::brake_circuit::Actuator;

trait GeneratorControlUnitInterface {
    fn valve_position_command(&self) -> Ratio;
}
struct GeneratorControlUnit {
    is_active: bool,
    power_demand: Power,
    power_target: Power,
    valve_position_request: Ratio,
    max_allowed_power_rpm_breakpoints: [f64; 9],
    max_allowed_power: [f64; 9],
    nominal_power: Power,
    nominal_rpm: AngularVelocity,
}
impl GeneratorControlUnit {
    fn new(
        nominal_power: Power,
        nominal_rpm: AngularVelocity,
        max_allowed_power_rpm_breakpoints: [f64; 9],
        max_allowed_power: [f64; 9],
    ) -> Self {
        Self {
            is_active: false,
            power_demand: Power::new::<watt>(0.),
            power_target: Power::new::<watt>(0.),
            valve_position_request: Ratio::new::<ratio>(0.),
            max_allowed_power_rpm_breakpoints,
            max_allowed_power,
            nominal_power,
            nominal_rpm,
        }
    }
    fn update_gcu_control(&mut self, hydraulic_motor: &HydraulicMotor) {
        if self.is_active {
            self.power_target = self.nominal_power;
            let speed_error = self.nominal_rpm - hydraulic_motor.speed;

            self.valve_position_request =
                speed_error.get::<revolution_per_minute>() * 0.003.max(0.).min(1.);

            max_power_allowed = interpolate(
                self.max_allowed_power_rpm_breakpoints,
                self.max_allowed_power,
                hydraulic_motor.speed.get::<revolution_per_minute>(),
            );

            self.power_demand = self
                .power_target
                .min(self.power_demand + Power::new::<watt>(100.))
                .min(max_power_allowed);
        } else {
            self.valve_position_request = Ratio::new::<ratio>(0.);
            self.power_demand = Power::new::<watt>(0.);
            self.power_target = Power::new::<watt>(0.);
        }
    }
}
impl GeneratorControlUnitInterface for GeneratorControlUnit {
    fn valve_position_command(&self) -> Ratio {
        self.valve_position_request
    }
}

struct HydraulicMotor {
    acceleration: AngularAcceleration,
    speed: AngularVelocity,

    intertia: f64,
    generated_torque: Torque,
    total_torque: Torque,
    displacement: Volume,
    virtual_displacement: Volume,
    current_flow: VolumeRate,

    valve_position: Ratio,
    valve_dynamic_filter: f64,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,
}
impl HydraulicMotor {
    fn update_valve_position(&mut self, gcu_interface: &impl GeneratorControlUnitInterface) {
        self.valve_position = self.valve_dynamic_filter * gcu_interface.valve_position_command()
            + (1. - self.valve_dynamic_filter) * self.valve_position;
    }

    fn updateHydMotorResistantTorque(&mut self, elecGen: &Generator) {
        self.total_torque = hydMotor.total_torque - elecGen.resistant_torque;
    }

    fn updateHydMotorTorque(&mut self, pressure: Pressure) {
        self.updateHydMotorDisplacement();
        self.generated_torque = pressure * self.virtual_displacement;
    }

    fn updateHydMotorDisplacement(&mut self) {
        self.virtual_displacement = self.displacement * self.valve_position;
    }

    fn updateHydMotorPhysics(&mut self, context: &UpdateContext) {
        let friction_torque =
            Torque::new::<newton_meter>(-0.00018 * self.speed.get::<revolution_per_minute>());

        self.total_torque += friction_torque;
        self.total_torque += self.generated_torque;

        self.acceleration = self.total_torque / self.intertia;
        self.speed += self.acceleration * context.delta_as_time();
        self.speed = self
            .speed
            .max(AngularVelocity::new::<revolution_per_minute>(0.));

        self.current_flow = calcHydMotorFlow();

        let total_volume = self.current_flow * context.delta_as_time();
        self.volume_to_actuator_accumulator += total_volume;
        self.volume_to_res_accumulator = self.volume_to_actuator_accumulator;

        self.total_torque = Torque::new::<newton_meter>(0.);
    }

    fn calcHydMotorFlow(&self) -> VolumeRate {
        self.speed * self.virtual_displacement
    }
}

struct Generator {
    speed: AngularVelocity,
    efficiency: f64,
    elec_power_generated: Power,
    resistant_torque: Torque,
}
impl Generator {
    fn updatebeforeHydMotor(&mut self, hyd_motor_speed: AngularVelocity) {
        self.speed = hyd_motor_speed;
    }

    fn updatePowerResistantTorque(&mut self, power_demand: Power) {
        if self.speed < AngularVelocity::new::<radian_per_second>(1.) {
            self.resistant_torque = 1;
            self.elec_power_generated = 0;
        } else {
            let elec_torque = power_demand / self.speed;
            self.resistant_torque = elec_torque + (1. - self.efficiency) * elec_torque;
            self.elec_power_generated = elec_torque * self.speed;
        }
    }
}

struct ElectricalEmergencyGenerator {
    hyd_motor: HydraulicMotor,
    generator: Generator,
}
impl ElectricalEmergencyGenerator {
    fn update(
        &mut self,
        pressure: Pressure,
        gcu: &impl GeneratorControlUnitInterface,
        context: &UpdateContext,
    ) {
        hyd_motor.updateHydMotorValveControl(gcu);
        generator.updatebeforeHydMotor(hyd_motor.speed());
        [elecGen] = updatePowerResistantTorque(elecGen, gcu.power_demand_w);
        [hydMotor] = updateHydMotorResistantTorque(hydMotor, elecGen);

        hyd_motor.updateHydMotorTorque(pressure);
        hyd_motor.updateHydMotorPhysics(context);
    }
}
impl Actuator for ElectricalEmergencyGenerator {
    fn used_volume(&self) -> Volume {
        Volume::new::<gallon>(0.)
    }
    fn reservoir_return(&self) -> Volume {
        Volume::new::<gallon>(0.)
    }
}
