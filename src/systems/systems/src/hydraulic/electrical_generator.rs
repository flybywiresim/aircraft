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

use crate::shared::{interpolation, EmergencyElectricalState, LgciuWeightOnWheels};

use crate::simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write};

use super::brake_circuit::Actuator;

pub trait GeneratorControlUnitInterface {
    fn valve_position_command(&self) -> Ratio;
    fn power_demand(&self) -> Power;
}
pub struct GeneratorControlUnit {
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
    pub fn new(
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

    // todo add lgciu input
    fn update_active_state(
        &mut self,
        elec_emergency_state: &impl EmergencyElectricalState,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        self.is_active = elec_emergency_state.is_in_emergency_elec()
            && !lgciu.left_and_right_gear_compressed(false);
    }

    fn is_active(&self) -> bool {
        self.is_active
    }

    pub fn update_gcu_control(
        &mut self,
        generator_speed_feedback: AngularVelocity,
        elec_emergency_state: &impl EmergencyElectricalState,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        self.update_active_state(elec_emergency_state, lgciu);

        if self.is_active() {
            self.power_target = self.nominal_power;
            let speed_error = self.nominal_rpm - generator_speed_feedback;

            self.valve_position_request = Ratio::new::<ratio>(
                (speed_error.get::<revolution_per_minute>() * 0.003)
                    .max(0.)
                    .min(1.),
            );

            let max_power_allowed = Power::new::<watt>(interpolation(
                &self.max_allowed_power_rpm_breakpoints,
                &self.max_allowed_power,
                generator_speed_feedback.get::<revolution_per_minute>(),
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

    inertia: f64,
    generated_torque: Torque,
    total_torque: Torque,
    displacement: Volume,
    virtual_displacement: Volume,
    current_flow: VolumeRate,

    valve: MeteringValve,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,
}
impl HydraulicMotor {
    const MOTOR_INERTIA: f64 = 0.01;

    fn new(displacement: Volume) -> Self {
        Self {
            acceleration: AngularAcceleration::new::<radian_per_second_squared>(0.),
            speed: AngularVelocity::new::<radian_per_second>(0.),

            inertia: Self::MOTOR_INERTIA,
            generated_torque: Torque::new::<newton_meter>(0.),
            total_torque: Torque::new::<newton_meter>(0.),
            displacement,
            virtual_displacement: Volume::new::<gallon>(0.),
            current_flow: VolumeRate::new::<gallon_per_second>(0.),

            valve: MeteringValve::new(),

            volume_to_actuator_accumulator: Volume::new::<gallon>(0.),
            volume_to_res_accumulator: Volume::new::<gallon>(0.),
        }
    }
    fn speed(&self) -> AngularVelocity {
        self.speed
    }

    fn update_valve_position(
        &mut self,
        gcu_interface: &impl GeneratorControlUnitInterface,
        context: &UpdateContext,
    ) {
        self.valve
            .update(gcu_interface.valve_position_command(), context);
    }

    fn updateHydMotorResistantTorque(&mut self, elecGen: &Generator) {
        self.total_torque -= elecGen.resistant_torque;
    }

    fn updateHydMotorTorque(&mut self, pressure: Pressure) {
        self.virtual_displacement = self.virtual_displacement_after_valve_inlet();

        if self.virtual_displacement > Volume::new::<cubic_inch>(0.001) {
            self.generated_torque = Torque::new::<pound_force_inch>(
                pressure.get::<psi>()
                    * self
                        .virtual_displacement_after_valve_inlet()
                        .get::<cubic_inch>()
                    / (2. * std::f64::consts::PI),
            );
        } else {
            self.generated_torque =
                Torque::new::<newton_meter>(-0.001 * self.speed().get::<revolution_per_minute>())
        }
    }

    fn virtual_displacement_after_valve_inlet(&mut self) -> Volume {
        self.displacement * self.valve.position()
    }

    fn updateHydMotorPhysics(&mut self, context: &UpdateContext) {
        let friction_torque =
            Torque::new::<newton_meter>(-0.00018 * self.speed.get::<revolution_per_minute>());

        self.total_torque += friction_torque;
        self.total_torque += self.generated_torque;

        self.acceleration = AngularAcceleration::new::<radian_per_second_squared>(
            self.total_torque.get::<newton_meter>() / self.inertia,
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

struct MeteringValve {
    position: Ratio,
}
impl MeteringValve {
    const POSITION_RESPONSE_TIME_CONSTANT_S: f64 = 0.1;

    fn new() -> Self {
        Self {
            position: Ratio::new::<ratio>(0.),
        }
    }

    fn update(&mut self, commanded_position: Ratio, context: &UpdateContext) {
        self.position = self.position
            + (commanded_position - self.position)
                * (1.
                    - std::f64::consts::E.powf(
                        -context.delta_as_secs_f64() / Self::POSITION_RESPONSE_TIME_CONSTANT_S,
                    ));
    }

    fn position(&self) -> Ratio {
        self.position
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

pub struct ElectricalEmergencyGenerator {
    hyd_motor: HydraulicMotor,
    generator: Generator,
}
impl ElectricalEmergencyGenerator {
    const EFFICIENCY: f64 = 0.92;

    pub fn new(displacement: Volume) -> Self {
        Self {
            hyd_motor: HydraulicMotor::new(displacement),
            generator: Generator::new(Self::EFFICIENCY),
        }
    }

    pub fn speed(&self) -> AngularVelocity {
        self.hyd_motor.speed()
    }

    pub fn update(
        &mut self,
        pressure: Pressure,
        gcu: &impl GeneratorControlUnitInterface,
        context: &UpdateContext,
    ) {
        self.hyd_motor.update_valve_position(gcu, context);
        self.generator.updatebeforeHydMotor(self.hyd_motor.speed());
        self.generator
            .updatePowerResistantTorque(gcu.power_demand());
        self.hyd_motor
            .updateHydMotorResistantTorque(&self.generator);

        self.hyd_motor.updateHydMotorTorque(pressure);
        self.hyd_motor.updateHydMotorPhysics(context);
    }

    pub fn reset_accumulators(&mut self) {
        self.hyd_motor.volume_to_res_accumulator = Volume::new::<gallon>(0.);
        self.hyd_motor.volume_to_actuator_accumulator = Volume::new::<gallon>(0.);
    }
}
impl Actuator for ElectricalEmergencyGenerator {
    fn used_volume(&self) -> Volume {
        self.hyd_motor.volume_to_actuator_accumulator
    }
    fn reservoir_return(&self) -> Volume {
        self.hyd_motor.volume_to_res_accumulator
    }
}
impl SimulationElement for ElectricalEmergencyGenerator {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            "HYD_EMERGENCY_GEN_RPM",
            self.speed().get::<revolution_per_minute>(),
        );

        writer.write(
            "HYD_EMERGENCY_GEN_POWER",
            self.generator.elec_power_generated.get::<watt>(),
        );
    }
}

mod tests {
    use crate::shared::{interpolation, LgciuGearExtension};
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
                power_demand: Power::new::<watt>(50.),
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

    struct TestEmergencyState {
        is_emergency: bool,
    }
    impl TestEmergencyState {
        fn in_emergency() -> Self {
            Self { is_emergency: true }
        }
        fn not_in_emergency() -> Self {
            Self {
                is_emergency: false,
            }
        }
    }
    impl EmergencyElectricalState for TestEmergencyState {
        fn is_in_emergency_elec(&self) -> bool {
            self.is_emergency
        }
    }

    struct TestLgciuInterface {
        main_gear_compressed: bool,
    }
    impl TestLgciuInterface {
        fn is_compressed() -> Self {
            Self {
                main_gear_compressed: true,
            }
        }
        fn is_extended() -> Self {
            Self {
                main_gear_compressed: false,
            }
        }
    }
    impl LgciuWeightOnWheels for TestLgciuInterface {
        fn right_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn right_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }

        fn left_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn left_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }

        fn left_and_right_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn left_and_right_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }

        fn nose_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn nose_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }
    }

    use super::*;
    #[test]
    /// Runs electric pump, checks pressure OK, shut it down, check drop of pressure after 20s
    fn emergency_generator_init_state() {
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
    fn emergency_generator_opened_valve() {
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        let gcu = TestGeneratorControlUnit::commanding_full_open();

        let timestep = 0.05;
        let mut context = context(Duration::from_secs_f64(timestep));
        let mut indicated_airspeed = context.indicated_airspeed();

        let mut time = 0.0;
        for x in 0..500 {
            emergency_gen.update(Pressure::new::<psi>(2500.), &gcu, &context);

            assert!(emergency_gen.hyd_motor.speed > AngularVelocity::new::<radian_per_second>(0.));

            time += timestep;

            if time >= 3.0 && time <= 3.5 {
                // Check we reached a relevant speed threshold after 3s
                assert!(
                    emergency_gen.hyd_motor.speed
                        >= AngularVelocity::new::<revolution_per_minute>(1000.)
                );
            }

            println!(
                "Time:{:.2} Rpm:{:.0}",
                time,
                emergency_gen
                    .hyd_motor
                    .speed()
                    .get::<revolution_per_minute>()
            );
        }

        // Check it's not going at crazy speed
        assert!(
            emergency_gen.hyd_motor.speed <= AngularVelocity::new::<revolution_per_minute>(100000.)
        );
    }

    #[test]
    fn gen_control_unit_init() {
        let gcu = gen_control_unit();
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        assert!(!gcu.is_active);

        let timestep = 0.05;
        let mut context = context(Duration::from_secs_f64(timestep));

        let mut time = 0.0;
        for _ in 0..50 {
            emergency_gen.update(Pressure::new::<psi>(2500.), &gcu, &context);

            assert!(emergency_gen.hyd_motor.speed == AngularVelocity::new::<radian_per_second>(0.));
            assert!(!gcu.is_active);

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
    }

    #[test]
    fn gen_control_unit_starts() {
        let mut gcu = gen_control_unit();
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        assert!(!gcu.is_active);

        let timestep = 0.05;
        let mut context = context(Duration::from_secs_f64(timestep));

        let mut time = 0.0;

        let mut emergency_state = TestEmergencyState::not_in_emergency();
        let lgciu = TestLgciuInterface::is_extended();
        for _ in 0..500 {
            if time > 2. {
                emergency_state = TestEmergencyState::in_emergency();
            }

            gcu.update_gcu_control(&emergency_gen.hyd_motor, &emergency_state, &lgciu);
            emergency_gen.update(Pressure::new::<psi>(2500.), &gcu, &context);

            if time > 5. {
                assert!(
                    emergency_gen
                        .hyd_motor
                        .speed()
                        .get::<revolution_per_minute>()
                        > 10000.
                );
                assert!(
                    emergency_gen
                        .hyd_motor
                        .speed()
                        .get::<revolution_per_minute>()
                        < 15000.
                );
            }

            time += timestep;

            println!(
                "Time:{:.2} Rpm:{:.0} Power{:.0}",
                time,
                emergency_gen
                    .hyd_motor
                    .speed()
                    .get::<revolution_per_minute>(),
                emergency_gen.generator.elec_power_generated.get::<watt>()
            );
        }
    }

    #[test]
    fn gen_control_unit_stops() {
        let mut gcu = gen_control_unit();
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        assert!(!gcu.is_active);

        let timestep = 0.05;
        let mut context = context(Duration::from_secs_f64(timestep));

        let mut time = 0.0;

        let mut emergency_state = TestEmergencyState::not_in_emergency();
        let lgciu = TestLgciuInterface::is_extended();
        for _ in 0..500 {
            if time > 2. {
                emergency_state = TestEmergencyState::in_emergency();
            }

            if time > 10. {
                emergency_state = TestEmergencyState::not_in_emergency();
            }

            gcu.update_gcu_control(&emergency_gen.hyd_motor, &emergency_state, &lgciu);
            emergency_gen.update(Pressure::new::<psi>(2500.), &gcu, &context);

            if time > 5. && time < 10. {
                assert!(
                    emergency_gen
                        .hyd_motor
                        .speed()
                        .get::<revolution_per_minute>()
                        > 10000.
                );
                assert!(
                    emergency_gen
                        .hyd_motor
                        .speed()
                        .get::<revolution_per_minute>()
                        < 15000.
                );
            }

            if time > 10.5 {
                assert!(!gcu.is_active);
            }

            if time > 15. {
                assert!(
                    emergency_gen
                        .hyd_motor
                        .speed()
                        .get::<revolution_per_minute>()
                        < 10000.
                );
            }

            time += timestep;

            println!(
                "Time:{:.2} Rpm:{:.0} Power{:.0}",
                time,
                emergency_gen
                    .hyd_motor
                    .speed()
                    .get::<revolution_per_minute>(),
                emergency_gen.generator.elec_power_generated.get::<watt>()
            );
        }
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

    fn gen_control_unit() -> GeneratorControlUnit {
        GeneratorControlUnit::new(
            Power::new::<watt>(6000.),
            AngularVelocity::new::<revolution_per_minute>(12000.),
            [
                0., 1000., 6000., 9999., 10000., 12000., 14000., 14001., 30000.,
            ],
            [0., 0., 0., 0., 1000., 6000., 1000., 0., 0.],
        )
    }
}
