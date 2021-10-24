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
    interpolation, ControlValveCommand, EmergencyElectricalRatPushButton, EmergencyElectricalState,
    EmergencyGeneratorInterface, GeneratorControlUnitInterface, LgciuWeightOnWheels,
};

use crate::simulation::{InitContext, VariableIdentifier};
use crate::simulation::{SimulationElement, SimulatorWriter, UpdateContext, Write};

use super::linear_actuator::Actuator;

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
    fn power_demand(&self) -> Power {
        self.power_demand
    }

    fn hydraulic_motor_speed(&self) -> AngularVelocity {
        self.current_speed
    }
}
impl ControlValveCommand for GeneratorControlUnit {
    fn valve_position_command(&self) -> Ratio {
        self.valve_position_request
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
        gcu_interface: &impl ControlValveCommand,
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

            println!(
                "GEN TORQ Nm:{:.2} speed{:.0}",
                self.generated_torque.get::<newton_meter>(),
                self.speed().get::<revolution_per_minute>()
            );
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
    generator_rpm_id: VariableIdentifier,
    hyd_motor: HydraulicMotor,
    produced_power: Power,
}
impl ElectricalEmergencyGenerator {
    pub fn new(context: &mut InitContext, displacement: Volume) -> Self {
        Self {
            generator_rpm_id: context.get_identifier("HYD_EMERGENCY_GEN_RPM".to_owned()),
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
        gcu: &impl ControlValveCommand,
        emergency_generator: &impl EmergencyGeneratorInterface,
        context: &UpdateContext,
    ) {
        self.hyd_motor.update_valve_position(gcu, context);
        self.hyd_motor.update_resistant_torque(emergency_generator);
        self.hyd_motor.update_generated_torque(pressure);
        self.hyd_motor.update_speed(context);
        self.hyd_motor.update_flow(context);

        self.produced_power = emergency_generator.generated_power();

        println!(
            "Gen: speed:{:.0} power:{:.0} pressure:{:.0} flow GPM:{:.1}",
            self.hyd_motor.speed().get::<revolution_per_minute>(),
            emergency_generator.generated_power().get::<watt>(),
            pressure.get::<psi>(),
            self.hyd_motor.current_flow.get::<gallon_per_second>() * 60.
        );
    }
}
impl Actuator for ElectricalEmergencyGenerator {
    fn used_volume(&self) -> Volume {
        self.hyd_motor.volume_to_actuator_accumulator
    }
    fn reservoir_return(&self) -> Volume {
        self.hyd_motor.volume_to_res_accumulator
    }

    fn reset_accumulators(&mut self) {
        self.hyd_motor.volume_to_res_accumulator = Volume::new::<gallon>(0.);
        self.hyd_motor.volume_to_actuator_accumulator = Volume::new::<gallon>(0.);
    }
}
impl SimulationElement for ElectricalEmergencyGenerator {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.generator_rpm_id,
            self.speed().get::<revolution_per_minute>(),
        );
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

    #[cfg(test)]
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
    fn generated_power(&self) -> Power {
        self.generated_power
    }
    fn resistant_torque(&self) -> Torque {
        self.resistant_torque_from_power_gen
    }
}
impl Default for TestGenerator {
    fn default() -> Self {
        Self::new()
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
    fn power_demand(&self) -> Power {
        self.power_demand
    }

    fn hydraulic_motor_speed(&self) -> AngularVelocity {
        self.current_speed
    }
}
impl ControlValveCommand for TestGeneratorControlUnit {
    fn valve_position_command(&self) -> Ratio {
        self.valve_position_request
    }
}

#[cfg(test)]
mod tests {
    use crate::hydraulic::update_iterator::FixedStepLoop;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor};
    use std::time::Duration;

    struct TestEmergencyState {
        is_emergency: bool,
    }
    impl TestEmergencyState {
        #[cfg(test)]
        fn _in_emergency() -> Self {
            Self { is_emergency: true }
        }
        #[cfg(test)]
        fn not_in_emergency() -> Self {
            Self {
                is_emergency: false,
            }
        }

        fn set_in_emergency(&mut self, state: bool) {
            self.is_emergency = state;
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
        fn pressed() -> Self {
            Self { is_pressed: true }
        }
        fn not_pressed() -> Self {
            Self { is_pressed: false }
        }

        fn press(&mut self) {
            self.is_pressed = true;
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
        fn _is_extended() -> Self {
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

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        gcu: GeneratorControlUnit,
        lgciu: TestLgciuInterface,
        rat_man_on: TestRatManOn,
        emergency_state: TestEmergencyState,
        current_pressure: Pressure,

        emergency_gen: ElectricalEmergencyGenerator,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(33)),
                gcu: gen_control_unit(),
                lgciu: TestLgciuInterface::_is_compressed(),
                rat_man_on: TestRatManOn::not_pressed(),
                emergency_state: TestEmergencyState::not_in_emergency(),

                current_pressure: Pressure::new::<psi>(2500.),

                emergency_gen: ElectricalEmergencyGenerator::new(
                    context,
                    Volume::new::<cubic_inch>(0.19),
                ),
            }
        }

        fn rat_man_on_pressed(&mut self) {
            self.rat_man_on.press();
        }

        fn set_in_emergency(&mut self, state: bool) {
            self.emergency_state.set_in_emergency(state);
        }

        fn set_hyd_pressure(&mut self, pressure: Pressure) {
            self.current_pressure = pressure;
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.gcu.update(
                    self.emergency_gen.speed(),
                    self.current_pressure,
                    &self.emergency_state,
                    &self.rat_man_on,
                    &self.lgciu,
                );

                self.emergency_gen.update(
                    self.current_pressure,
                    &self.gcu,
                    &TestGenerator::from_gcu(&self.gcu),
                    &context.with_delta(cur_time_step),
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.emergency_gen.accept(visitor);

            visitor.visit(self);
        }
    }

    use super::*;

    #[test]
    fn emergency_generator_init_state() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run();

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed() == AngularVelocity::new::<radian_per_second>(0.)
        }));

        assert!(test_bed.query(|a| a.gcu.valve_position_command() == Ratio::new::<ratio>(0.)));
    }

    #[test]
    fn emergency_generator_in_emergency_state_should_start_spining_with_pressure() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed() == AngularVelocity::new::<revolution_per_minute>(0.)
        }));

        test_bed.command(|a| a.set_in_emergency(true));

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed() >= AngularVelocity::new::<revolution_per_minute>(100.)
        }));
    }

    #[test]
    fn emergency_generator_in_emergency_state_should_not_start_spining_without_pressure() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(0.)));
        test_bed.command(|a| a.set_in_emergency(true));

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed() == AngularVelocity::new::<revolution_per_minute>(0.)
        }));
    }

    #[test]
    fn emergency_generator_in_emergency_state_regulates_speed() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_in_emergency(true));

        test_bed.run_with_delta(Duration::from_secs_f64(15.));

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed()
                >= AngularVelocity::new::<revolution_per_minute>(11900.)
        }));

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed()
                <= AngularVelocity::new::<revolution_per_minute>(12100.)
        }));
    }

    #[test]
    fn emergency_generator_stops_in_less_than_5_seconds() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_in_emergency(true));

        test_bed.run_with_delta(Duration::from_secs_f64(15.));

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed()
                >= AngularVelocity::new::<revolution_per_minute>(11000.)
        }));

        test_bed.command(|a| a.set_in_emergency(false));

        test_bed.run_with_delta(Duration::from_secs_f64(5.));

        assert!(test_bed.query(|a| {
            a.emergency_gen.hyd_motor.speed() <= AngularVelocity::new::<revolution_per_minute>(5.)
        }));
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
