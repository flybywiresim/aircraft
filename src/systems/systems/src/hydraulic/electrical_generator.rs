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

use crate::shared::{
    interpolation, EmergencyElectricalRatPushButton, EmergencyElectricalState,
    EmergencyGeneratorInterface, GeneratorControlUnitInterface, LgciuWeightOnWheels,
};

use crate::simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write};

use super::brake_circuit::Actuator;

pub struct GeneratorControlUnit {
    is_active: bool,
    power_demand: Power,
    power_target: Power,
    valve_position_request: Ratio,
    max_allowed_power_rpm_breakpoints: [f64; 9],
    max_allowed_power: [f64; 9],
    nominal_power: Power,
    nominal_rpm: AngularVelocity,
    current_speed: AngularVelocity,

    emer_on_was_pressed: bool,
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
            current_speed: AngularVelocity::new::<revolution_per_minute>(0.),
            emer_on_was_pressed: false,
        }
    }

    fn update_active_state(
        &mut self,
        elec_emergency_state: &impl EmergencyElectricalState,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        lgciu: &impl LgciuWeightOnWheels,
        pressure_feedback: Pressure,
    ) {
        self.emer_on_was_pressed = self.emer_on_was_pressed || rat_and_emer_gen_man_on.is_pressed();

        self.is_active = elec_emergency_state.is_in_emergency_elec()
            || self.emer_on_was_pressed
                && !lgciu.left_and_right_gear_compressed(false)
                && pressure_feedback.get::<psi>() > 500.;
    }

    fn is_active(&self) -> bool {
        self.is_active
    }

    pub fn update(
        &mut self,
        generator_speed_feedback: AngularVelocity,
        pressure_feedback: Pressure,
        elec_emergency_state: &impl EmergencyElectricalState,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        self.current_speed = generator_speed_feedback;

        self.update_active_state(
            elec_emergency_state,
            rat_and_emer_gen_man_on,
            lgciu,
            pressure_feedback,
        );

        self.update_valve_control();

        self.update_power_demand();
    }

    fn max_allowed_power(&self) -> Power {
        Power::new::<watt>(interpolation(
            &self.max_allowed_power_rpm_breakpoints,
            &self.max_allowed_power,
            self.current_speed.get::<revolution_per_minute>(),
        ))
    }

    fn update_power_demand(&mut self) {
        if self.is_active() {
            self.power_target = self.nominal_power;
            self.power_demand = self
                .power_target
                .min(self.power_demand + Power::new::<watt>(100.))
                .min(self.max_allowed_power());
        } else {
            self.power_demand = Power::new::<watt>(0.);
            self.power_target = Power::new::<watt>(0.);
        }
    }

    fn update_valve_control(&mut self) {
        if self.is_active() {
            let speed_error = self.nominal_rpm - self.current_speed;

            self.valve_position_request = Ratio::new::<ratio>(
                (speed_error.get::<revolution_per_minute>() * 0.003)
                    .max(0.)
                    .min(1.),
            );
        } else {
            self.valve_position_request = Ratio::new::<ratio>(0.);
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

    fn hydraulic_motor_speed(&self) -> AngularVelocity {
        self.current_speed
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

    fn update_resistant_torque(&mut self, emergency_generator: &impl EmergencyGeneratorInterface) {
        self.total_torque -= emergency_generator.resistant_torque();
    }

    fn update_generated_torque(&mut self, pressure: Pressure) {
        self.virtual_displacement = self.virtual_displacement_after_valve_inlet();

        if self.virtual_displacement > Volume::new::<cubic_inch>(0.001) {
            self.generated_torque = Torque::new::<pound_force_inch>(
                pressure.get::<psi>() * self.virtual_displacement.get::<cubic_inch>()
                    / (2. * std::f64::consts::PI),
            );

            // println!(
            //     "GEN TORQ Nm:{:.2}",
            //     self.generated_torque.get::<newton_meter>()
            // );
        } else {
            self.generated_torque =
                Torque::new::<newton_meter>(-0.0005 * self.speed().get::<revolution_per_minute>())
        }
    }

    fn virtual_displacement_after_valve_inlet(&mut self) -> Volume {
        self.displacement * self.valve.position()
    }

    fn update_speed(&mut self, context: &UpdateContext) {
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

        self.total_torque = Torque::new::<newton_meter>(0.);
    }

    fn update_flow(&mut self, context: &UpdateContext) {
        self.current_flow = self.flow();

        let total_volume = self.current_flow * context.delta_as_time();
        self.volume_to_actuator_accumulator += total_volume;
        self.volume_to_res_accumulator = self.volume_to_actuator_accumulator;
    }

    fn flow(&self) -> VolumeRate {
        VolumeRate::new::<gallon_per_minute>(
            self.speed.get::<revolution_per_minute>()
                * self.virtual_displacement.get::<cubic_inch>()
                / 231.,
        )
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

pub struct ElectricalEmergencyGenerator {
    hyd_motor: HydraulicMotor,
    produced_power: Power,
}
impl ElectricalEmergencyGenerator {
    pub fn new(displacement: Volume) -> Self {
        Self {
            hyd_motor: HydraulicMotor::new(displacement),
            produced_power: Power::new::<watt>(0.),
        }
    }

    pub fn speed(&self) -> AngularVelocity {
        self.hyd_motor.speed()
    }

    pub fn is_producing_power(&self) -> bool {
        self.produced_power > Power::new::<watt>(100.)
    }

    pub fn update(
        &mut self,
        pressure: Pressure,
        gcu: &impl GeneratorControlUnitInterface,
        emergency_generator: &impl EmergencyGeneratorInterface,
        context: &UpdateContext,
    ) {
        self.hyd_motor.update_valve_position(gcu, context);
        self.hyd_motor.update_resistant_torque(emergency_generator);
        self.hyd_motor.update_generated_torque(pressure);
        self.hyd_motor.update_speed(context);
        self.hyd_motor.update_flow(context);

        self.produced_power = emergency_generator.power_generated();

        // println!(
        //     "Gen: speed:{:.0} power:{:.0} pressure:{:.0} flow GPM:{:.1}",
        //     self.hyd_motor.speed().get::<revolution_per_minute>(),
        //     self.generator.elec_power_generated.get::<watt>(),
        //     pressure.get::<psi>(),
        //     self.hyd_motor.current_flow.get::<gallon_per_second>() * 60.
        // );
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

        writer.write("HYD_EMERGENCY_GEN_POWER", self.produced_power.get::<watt>());
    }
}

pub struct TestGenerator {
    speed: AngularVelocity,
    resistant_torque_from_power_gen: Torque,
    generated_power: Power,
}
impl TestGenerator {
    const EFFICIENCY: f64 = 0.95;

    pub fn new() -> Self {
        Self {
            speed: AngularVelocity::new::<revolution_per_minute>(0.),
            resistant_torque_from_power_gen: Torque::new::<newton_meter>(0.),
            generated_power: Power::new::<watt>(0.),
        }
    }

    fn from_gcu(gcu: &impl GeneratorControlUnitInterface) -> Self {
        let mut g = TestGenerator {
            speed: gcu.hydraulic_motor_speed(),
            resistant_torque_from_power_gen: Torque::new::<newton_meter>(0.),
            generated_power: Power::new::<watt>(0.),
        };

        g.update(gcu);
        g
    }

    pub fn update(&mut self, gcu: &impl GeneratorControlUnitInterface) {
        self.speed = gcu.hydraulic_motor_speed();
        self.generated_power = gcu.power_demand();
        self.update_resistant_torque(gcu);
    }

    fn update_resistant_torque(&mut self, gcu: &impl GeneratorControlUnitInterface) {
        if gcu.hydraulic_motor_speed() < AngularVelocity::new::<radian_per_second>(1.) {
            self.resistant_torque_from_power_gen = Torque::new::<newton_meter>(0.3);
        } else {
            let elec_torque = Torque::new::<newton_meter>(
                gcu.power_demand().get::<watt>()
                    / gcu.hydraulic_motor_speed().get::<radian_per_second>(),
            );
            self.resistant_torque_from_power_gen =
                elec_torque + (1. - Self::EFFICIENCY) * elec_torque;
        }
    }
}
impl EmergencyGeneratorInterface for TestGenerator {
    fn power_generated(&self) -> Power {
        self.generated_power
    }
    fn resistant_torque(&self) -> Torque {
        self.resistant_torque_from_power_gen
    }
}

pub struct TestGeneratorControlUnit {
    power_demand: Power,
    valve_position_request: Ratio,
    current_speed: AngularVelocity,
}

impl TestGeneratorControlUnit {
    pub fn commanding_full_open() -> Self {
        Self {
            power_demand: Power::new::<watt>(50.),
            valve_position_request: Ratio::new::<ratio>(1.),
            current_speed: AngularVelocity::new::<revolution_per_minute>(0.),
        }
    }
    pub fn commanding_full_closed() -> Self {
        Self {
            power_demand: Power::new::<watt>(0.),
            valve_position_request: Ratio::new::<ratio>(0.),
            current_speed: AngularVelocity::new::<revolution_per_minute>(0.),
        }
    }
    pub fn _steady_state_generating_power() -> Self {
        Self {
            power_demand: Power::new::<watt>(5000.),
            valve_position_request: Ratio::new::<ratio>(0.7),
            current_speed: AngularVelocity::new::<revolution_per_minute>(12000.),
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

    fn hydraulic_motor_speed(&self) -> AngularVelocity {
        self.current_speed
    }
}
mod tests {
    // use crate::shared::LgciuGearExtension;
    //use crate::simulation::UpdateContext;
    use std::time::Duration;

    use uom::si::{
        acceleration::foot_per_second_squared, f64::*, length::foot,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    struct TestEmergencyState {
        is_emergency: bool,
    }
    impl TestEmergencyState {
        #[cfg(test)]
        fn in_emergency() -> Self {
            Self { is_emergency: true }
        }
        #[cfg(test)]
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

    #[cfg(test)]
    struct TestRatManOn {
        is_pressed: bool,
    }

    #[cfg(test)]
    impl TestRatManOn {
        fn _pressed() -> Self {
            Self { is_pressed: true }
        }
        fn not_pressed() -> Self {
            Self { is_pressed: false }
        }
    }

    #[cfg(test)]
    impl EmergencyElectricalRatPushButton for TestRatManOn {
        fn is_pressed(&self) -> bool {
            self.is_pressed
        }
    }

    struct TestLgciuInterface {
        main_gear_compressed: bool,
    }
    impl TestLgciuInterface {
        fn _is_compressed() -> Self {
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
            &TestGenerator::from_gcu(&gcu),
            &context(Duration::from_millis(50)),
        );

        assert!(emergency_gen.hyd_motor.speed == AngularVelocity::new::<radian_per_second>(0.));
    }

    #[test]
    fn emergency_generator_with_opened_valve_should_spin() {
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        let gcu = TestGeneratorControlUnit::commanding_full_open();

        let timestep = 0.05;
        let context = context(Duration::from_secs_f64(timestep));

        let mut time = 0.0;
        for _ in 0..500 {
            emergency_gen.update(
                Pressure::new::<psi>(2500.),
                &gcu,
                &TestGenerator::from_gcu(&gcu),
                &context,
            );

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
        let context = context(Duration::from_secs_f64(timestep));

        let mut time = 0.0;
        for _ in 0..50 {
            emergency_gen.update(
                Pressure::new::<psi>(2500.),
                &gcu,
                &TestGenerator::from_gcu(&gcu),
                &context,
            );

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
        let context = context(Duration::from_secs_f64(timestep));

        let mut time = 0.0;

        let mut emergency_state = TestEmergencyState::not_in_emergency();
        let lgciu = TestLgciuInterface::is_extended();
        for _ in 0..500 {
            if time > 2. {
                emergency_state = TestEmergencyState::in_emergency();
            }

            gcu.update(
                emergency_gen.speed(),
                Pressure::new::<psi>(2500.),
                &emergency_state,
                &TestRatManOn::not_pressed(),
                &lgciu,
            );
            emergency_gen.update(
                Pressure::new::<psi>(2500.),
                &gcu,
                &TestGenerator::from_gcu(&gcu),
                &context,
            );

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

            // Full load should be below 12 GPM
            assert!(
                emergency_gen
                    .hyd_motor
                    .current_flow
                    .get::<gallon_per_minute>()
                    < 12.
            );

            time += timestep;

            println!(
                "Time:{:.2} Rpm:{:.0} Power{:.0}",
                time,
                emergency_gen
                    .hyd_motor
                    .speed()
                    .get::<revolution_per_minute>(),
                emergency_gen.produced_power.get::<watt>()
            );
        }
    }

    #[test]
    fn gen_control_unit_stops() {
        let mut gcu = gen_control_unit();
        let mut emergency_gen = ElectricalEmergencyGenerator::new(Volume::new::<cubic_inch>(0.19));

        assert!(!gcu.is_active);

        let timestep = 0.05;
        let context = context(Duration::from_secs_f64(timestep));

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

            gcu.update(
                emergency_gen.speed(),
                Pressure::new::<psi>(2500.),
                &emergency_state,
                &TestRatManOn::not_pressed(),
                &lgciu,
            );
            emergency_gen.update(
                Pressure::new::<psi>(2500.),
                &gcu,
                &TestGenerator::from_gcu(&gcu),
                &context,
            );

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
                emergency_gen.produced_power.get::<watt>()
            );
        }
    }

    #[cfg(test)]
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

    #[cfg(test)]
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
