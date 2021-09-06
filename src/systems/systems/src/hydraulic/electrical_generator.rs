use uom::si::{
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    power::watt,
    pressure::psi,
    ratio::ratio,
    torque::{newton_meter, pound_force_inch},
    volume::{cubic_inch, gallon},
    volume_rate::gallon_per_second,
};

use crate::shared::interpolation;
use crate::simulation::UpdateContext;

use super::brake_circuit::Actuator;

trait GeneratorControlUnitInterface {
    fn valve_position_command(&self) -> Ratio;
    fn power_demand(&self) -> Power;
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

            self.valve_position_request = Ratio::new::<ratio>(
                (speed_error.get::<revolution_per_minute>() * 0.003)
                    .max(0.)
                    .min(1.),
            );

            let max_power_allowed = Power::new::<watt>(interpolation(
                &self.max_allowed_power_rpm_breakpoints,
                &self.max_allowed_power,
                hydraulic_motor.speed.get::<revolution_per_minute>(),
            ));

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

    fn power_demand(&self) -> Power {
        self.power_demand
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
    const VALVE_DYNAMIC_FILTER: f64 = 0.4;
    const MOTOR_INERTIA: f64 = 0.01;

    fn new(displacement: Volume) -> Self {
        Self {
            acceleration: AngularAcceleration::new::<radian_per_second_squared>(0.),
            speed: AngularVelocity::new::<radian_per_second>(0.),

            intertia: Self::MOTOR_INERTIA,
            generated_torque: Torque::new::<newton_meter>(0.),
            total_torque: Torque::new::<newton_meter>(0.),
            displacement,
            virtual_displacement: Volume::new::<gallon>(0.),
            current_flow: VolumeRate::new::<gallon_per_second>(0.),

            valve_position: Ratio::new::<ratio>(0.),
            valve_dynamic_filter: Self::VALVE_DYNAMIC_FILTER,

            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),
        }
    }
    fn speed(&self) -> AngularVelocity {
        self.speed
    }

    fn update_valve_position(&mut self, gcu_interface: &impl GeneratorControlUnitInterface) {
        self.valve_position = self.valve_dynamic_filter * gcu_interface.valve_position_command()
            + (1. - self.valve_dynamic_filter) * self.valve_position;
    }

    fn updateHydMotorResistantTorque(&mut self, elecGen: &Generator) {
        self.total_torque -= elecGen.resistant_torque;
    }

    fn updateHydMotorTorque(&mut self, pressure: Pressure) {
        self.updateHydMotorDisplacement();
        self.generated_torque = Torque::new::<pound_force_inch>(
            pressure.get::<psi>() * self.virtual_displacement.get::<cubic_inch>() / 2.
                * std::f64::consts::PI,
        );
    }

    fn updateHydMotorDisplacement(&mut self) {
        self.virtual_displacement = self.displacement * self.valve_position;
    }

    fn updateHydMotorPhysics(&mut self, context: &UpdateContext) {
        let friction_torque =
            Torque::new::<newton_meter>(-0.00018 * self.speed.get::<revolution_per_minute>());

        self.total_torque += friction_torque;
        self.total_torque += self.generated_torque;

        self.acceleration = AngularAcceleration::new::<radian_per_second_squared>(
            self.total_torque.get::<newton_meter>() / self.intertia,
        );
        self.speed += AngularVelocity::new::<radian_per_second>(
            self.acceleration.get::<radian_per_second_squared>() * context.delta_as_secs_f64(),
        );
        self.speed = self
            .speed
            .max(AngularVelocity::new::<revolution_per_minute>(0.));

        self.current_flow = self.calcHydMotorFlow();

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
    fn new(efficiency: f64) -> Self {
        Self {
            speed: AngularVelocity::new::<radian_per_second>(0.),
            efficiency,
            elec_power_generated: Power::new::<watt>(0.),
            resistant_torque: Torque::new::<newton_meter>(0.),
        }
    }

    fn updatebeforeHydMotor(&mut self, hyd_motor_speed: AngularVelocity) {
        self.speed = hyd_motor_speed;
    }

    fn updatePowerResistantTorque(&mut self, power_demand: Power) {
        if self.speed < AngularVelocity::new::<radian_per_second>(1.) {
            self.resistant_torque = Torque::new::<newton_meter>(1.);
            self.elec_power_generated = Power::new::<watt>(0.);
        } else {
            let elec_torque = Torque::new::<newton_meter>(
                power_demand.get::<watt>() / self.speed.get::<radian_per_second>(),
            );
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
    const EFFICIENCY: f64 = 0.92;

    fn new(displacement: Volume) -> Self {
        Self {
            hyd_motor: HydraulicMotor::new(displacement),
            generator: Generator::new(Self::EFFICIENCY),
        }
    }

    fn update(
        &mut self,
        pressure: Pressure,
        gcu: &impl GeneratorControlUnitInterface,
        context: &UpdateContext,
    ) {
        self.hyd_motor.update_valve_position(gcu);
        self.generator.updatebeforeHydMotor(self.hyd_motor.speed());
        self.generator
            .updatePowerResistantTorque(gcu.power_demand());
        self.hyd_motor
            .updateHydMotorResistantTorque(&self.generator);

        self.hyd_motor.updateHydMotorTorque(pressure);
        self.hyd_motor.updateHydMotorPhysics(context);
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

mod tests {
    use crate::shared::interpolation;
    use crate::simulation::UpdateContext;
    use std::time::Duration;

    use uom::si::{
        acceleration::foot_per_second_squared, f64::*, length::foot, pressure::psi,
        thermodynamic_temperature::degree_celsius, velocity::knot, volume::gallon,
    };

    struct TestGeneratorControlUnit {
        power_demand: Power,
        valve_position_request: Ratio,
    }
    impl TestGeneratorControlUnit {
        fn commanding_full_open() -> Self {
            Self {
                power_demand: Power::new::<watt>(3000.),
                valve_position_request: Ratio::new::<ratio>(1.),
            }
        }
        fn commanding_full_closed() -> Self {
            Self {
                power_demand: Power::new::<watt>(3000.),
                valve_position_request: Ratio::new::<ratio>(0.),
            }
        }
    }
    impl GeneratorControlUnitInterface for TestGeneratorControlUnit {
        fn valve_position_command(&self) -> Ratio {
            self.valve_position_request
        }

        fn power_demand(&self) -> Power {
            self.power_demand
        }
    }

    use super::*;
    #[test]
    /// Runs electric pump, checks pressure OK, shut it down, check drop of pressure after 20s
    fn ElectricalEmergencyGenerator_init_state() {
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        let gcu = TestGeneratorControlUnit::commanding_full_closed();

        assert!(emergency_gen.hyd_motor.speed == AngularVelocity::new::<radian_per_second>(0.));

        emergency_gen.update(
            Pressure::new::<psi>(2500.),
            &gcu,
            &context(Duration::from_millis(50)),
        );

        assert!(emergency_gen.hyd_motor.speed == AngularVelocity::new::<radian_per_second>(0.));
    }

    #[test]
    fn ElectricalEmergencyGenerator_opened_valve() {
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        let gcu = TestGeneratorControlUnit::commanding_full_open();

        let timestep = 0.05;
        let mut context = context(Duration::from_secs_f64(timestep));
        let mut indicated_airspeed = context.indicated_airspeed();

        let mut time = 0.0;
        for x in 0..500{
            emergency_gen.update(Pressure::new::<psi>(2500.), &gcu, &context);

            time += timestep;

            println!(
                "Time:{:.2} Rpm:{:.0}",
                time,
                emergency_gen
                    .hyd_motor
                    .speed()
                    .get::<revolution_per_minute>()
            );
        }

        assert!(emergency_gen.hyd_motor.speed >= AngularVelocity::new::<radian_per_second>(0.));
        assert!(emergency_gen.hyd_motor.speed <= AngularVelocity::new::<radian_per_second>(40000.));
    }

    fn context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
        )
    }
}
