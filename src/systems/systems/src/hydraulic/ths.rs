use uom::si::{
    angle::{degree, radian},
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

use crate::shared::{interpolation, low_pass_filter::LowPassFilter};

use std::time::Duration;

struct TrimWheels {
    position: Angle,
    trim_actuator_over_trim_wheel_ratio: Ratio,

    min_angle: Angle,
    max_angle: Angle,
}
impl TrimWheels {
    fn new(
        context: &InitContext,
        trim_actuator_over_trim_wheel_ratio: Ratio,
        min_angle: Angle,
        total_range_angle: Angle,
    ) -> Self {
        Self {
            position: Angle::default(),
            trim_actuator_over_trim_wheel_ratio,
            min_angle,
            max_angle: min_angle + total_range_angle,
        }
    }

    fn update(&mut self, pta: &PitchTrimActuator) {
        self.position = pta.position / self.trim_actuator_over_trim_wheel_ratio.get::<ratio>();
    }
}

#[derive(Clone, Copy)]
struct DriveMotor {
    speed: LowPassFilter<AngularVelocity>,
    position_request: Angle,

    is_active: bool,
    max_speed: AngularVelocity,

    speed_regulation_coef_map: [f64; 7],
    speed_error_breakpoint: [f64; 7],
}
impl DriveMotor {
    fn new(
        max_speed: AngularVelocity,

        speed_error_breakpoint: [f64; 7],
        speed_regulation_coef_map: [f64; 7],
    ) -> Self {
        Self {
            speed: LowPassFilter::new(Duration::from_millis(50)),
            position_request: Angle::default(),

            is_active: false,
            max_speed,

            speed_regulation_coef_map,
            speed_error_breakpoint,
        }
    }

    fn set_active_state(&mut self, is_active: bool) {
        self.is_active = is_active;
    }

    fn set_position_request(&mut self, position_requested: Angle) {
        self.position_request = position_requested;
    }

    fn update(&mut self, context: &UpdateContext, measured_position: Angle) {
        let new_speed = if self.is_active {
            let position_error = self.position_request - measured_position;

            let speed_coef = interpolation(
                &self.speed_error_breakpoint,
                &self.speed_regulation_coef_map,
                position_error.get::<degree>(),
            );

            // println!(
            //     "dmnd{:.1}, act {:.1}, err {:.1},SPED COEF {:.1}",
            //     self.position_request.get::<degree>(),
            //     measured_position.get::<degree>(),
            //     position_error.get::<degree>(),
            //     speed_coef
            // );
            self.max_speed * speed_coef
        } else {
            AngularVelocity::default()
        };

        self.speed.update(context.delta(), new_speed);
    }

    fn speed(&self) -> AngularVelocity {
        self.speed.output()
    }

    fn set_max_speed(&mut self, new_max_speed: AngularVelocity) {
        self.max_speed = new_max_speed;
    }
}

struct ElectricDriveMotor {
    motor: DriveMotor,

    is_powered: bool,
}
impl ElectricDriveMotor {
    fn new(
        max_speed: AngularVelocity,

        speed_error_breakpoint: [f64; 7],
        speed_regulation_coef_map: [f64; 7],
    ) -> Self {
        Self {
            motor: DriveMotor::new(max_speed, speed_error_breakpoint, speed_regulation_coef_map),
            is_powered: true,
        }
    }

    fn set_active_state(&mut self, is_active: bool) {
        self.motor.set_active_state(is_active && self.is_powered);
    }

    fn set_position_request(&mut self, position_requested: Angle) {
        self.motor.set_position_request(position_requested);
    }

    fn update(&mut self, context: &UpdateContext, measured_position: Angle) {
        self.motor.update(context, measured_position);
    }

    fn speed(&self) -> AngularVelocity {
        self.motor.speed()
    }
}

#[derive(Clone, Copy)]
struct HydraulicDriveMotor {
    motor: DriveMotor,
}
impl HydraulicDriveMotor {
    fn new(
        max_speed: AngularVelocity,

        speed_error_breakpoint: [f64; 7],
        speed_regulation_coef_map: [f64; 7],
    ) -> Self {
        Self {
            motor: DriveMotor::new(max_speed, speed_error_breakpoint, speed_regulation_coef_map),
        }
    }

    fn set_position_request(&mut self, position_requested: Angle) {
        self.motor.set_position_request(position_requested);
    }

    fn update(&mut self, context: &UpdateContext, measured_position: Angle, pressure: Pressure) {
        self.motor
            .set_active_state(pressure > Pressure::new::<psi>(1450.));

        self.motor.update(context, measured_position);
    }

    fn speed(&self) -> AngularVelocity {
        self.motor.speed()
    }
}

#[derive(Clone, Copy)]
struct ElectricMotorClutch {
    is_powered: bool,
    is_energized: bool,
}
impl ElectricMotorClutch {
    fn default() -> Self {
        Self {
            is_powered: true,
            is_energized: false,
        }
    }

    fn is_clutch_engaged(&self) -> bool {
        self.is_powered && self.is_energized
    }

    fn set_energized(&mut self, is_energized: bool) {
        self.is_energized = is_energized;
    }
}

pub trait PitchTrimActuatorController {
    fn commanded_position(&self) -> Angle;
    fn energised_motor(&self) -> [bool; 3];
}

pub trait ManualPitchTrimController {
    fn is_manually_moved(&self) -> bool;
    fn moving_speed(&self) -> AngularVelocity;
}

struct PitchTrimActuator {
    electric_motors: [ElectricDriveMotor; 3],
    electric_clutches: [ElectricMotorClutch; 3],
    position_request: Angle,
    position: Angle,
    speed: AngularVelocity,

    elec_motor_over_trim_actuator_ratio: Ratio,

    min_actuator_angle: Angle,
    max_actuator_angle: Angle,
}
impl PitchTrimActuator {
    const ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT: [f64; 7] =
        [-50., -5., -0.05, 0., 0.05, 5., 50.];
    const ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP: [f64; 7] = [-1., -1., -0.01, 0., 0.01, 1., 1.];

    fn new(
        min_actuator_angle: Angle,
        total_actuator_range_angle: Angle,
        max_elec_motor_speed: AngularVelocity,
        elec_motor_over_trim_actuator_ratio: Ratio,
    ) -> Self {
        Self {
            electric_motors: [
                ElectricDriveMotor::new(
                    max_elec_motor_speed,
                    Self::ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                    Self::ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP,
                ),
                ElectricDriveMotor::new(
                    max_elec_motor_speed,
                    Self::ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                    Self::ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP,
                ),
                ElectricDriveMotor::new(
                    max_elec_motor_speed,
                    Self::ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                    Self::ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP,
                ),
            ],
            electric_clutches: [ElectricMotorClutch::default(); 3],
            position_request: Angle::default(),
            position: Angle::default(),
            speed: AngularVelocity::default(),

            elec_motor_over_trim_actuator_ratio,

            min_actuator_angle,
            max_actuator_angle: min_actuator_angle + total_actuator_range_angle,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        electric_controller: &impl PitchTrimActuatorController,
        manual_controller: &impl ManualPitchTrimController,
        ths_hydraulic_assembly: &ThsHydraulicAssembly,
    ) {
        self.update_clutches_state(electric_controller);
        self.update_motors(context, electric_controller);

        self.update_speed(manual_controller, ths_hydraulic_assembly);

        self.update_position(context);
    }

    fn update_position(&mut self, context: &UpdateContext) {
        self.position = self.position
            + Angle::new::<radian>(
                self.speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );

        self.position = self
            .position
            .min(self.max_actuator_angle)
            .max(self.min_actuator_angle);
    }

    fn update_speed(
        &mut self,
        manual_controller: &impl ManualPitchTrimController,
        ths_hydraulic_assembly: &ThsHydraulicAssembly,
    ) {
        if manual_controller.is_manually_moved() {
            self.speed = manual_controller.moving_speed();
        } else {
            let mut sum_of_speeds = AngularVelocity::default();

            for (motor_index, motor) in self.electric_motors.iter_mut().enumerate() {
                if self.electric_clutches[motor_index].is_clutch_engaged() {
                    sum_of_speeds +=
                        motor.speed() / self.elec_motor_over_trim_actuator_ratio.get::<ratio>();
                }
            }

            self.speed = sum_of_speeds;
        }

        if ths_hydraulic_assembly.is_at_max_down_spool_valve
            && self.speed.get::<radian_per_second>() < 0.
            || ths_hydraulic_assembly.is_at_max_up_spool_valve
                && self.speed.get::<radian_per_second>() > 0.
        {
            self.speed = AngularVelocity::default();
        }
    }

    fn update_clutches_state(&mut self, controller: &impl PitchTrimActuatorController) {
        for (clutch_index, clutch) in self.electric_clutches.iter_mut().enumerate() {
            clutch.set_energized(controller.energised_motor()[clutch_index]);
        }
    }

    fn update_motors(
        &mut self,
        context: &UpdateContext,
        controller: &impl PitchTrimActuatorController,
    ) {
        for (motor_index, motor) in self.electric_motors.iter_mut().enumerate() {
            motor.set_active_state(controller.energised_motor()[motor_index]);
            motor.set_position_request(controller.commanded_position());
            //println!("ELEC motor");
            motor.update(context, self.position);
        }
    }

    fn position_normalized(&self) -> Ratio {
        let range = self.max_actuator_angle - self.min_actuator_angle;

        Ratio::new::<ratio>(
            (self.position.get::<radian>() - self.min_actuator_angle.get::<radian>())
                / range.get::<radian>(),
        )
    }
}

pub struct TrimInputAssembly {
    pitch_trim_actuator: PitchTrimActuator,
    trim_wheel: TrimWheels,
}
impl TrimInputAssembly {
    pub fn new(
        context: &InitContext,

        min_actuator_angle: Angle,
        total_actuator_range_angle: Angle,

        min_trim_wheel_angle: Angle,
        total_trim_wheel_range_angle: Angle,

        max_elec_motor_speed: AngularVelocity,
        elec_motor_over_trim_actuator_ratio: Ratio,
    ) -> Self {
        Self {
            pitch_trim_actuator: PitchTrimActuator::new(
                min_actuator_angle,
                total_actuator_range_angle,
                max_elec_motor_speed,
                elec_motor_over_trim_actuator_ratio,
            ),
            trim_wheel: TrimWheels::new(
                context,
                total_actuator_range_angle / total_trim_wheel_range_angle,
                min_trim_wheel_angle,
                total_trim_wheel_range_angle,
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electric_controller: &impl PitchTrimActuatorController,
        manual_controller: &impl ManualPitchTrimController,
        ths_hydraulic_assembly: &ThsHydraulicAssembly,
    ) {
        self.pitch_trim_actuator.update(
            context,
            electric_controller,
            manual_controller,
            ths_hydraulic_assembly,
        );

        self.trim_wheel.update(&self.pitch_trim_actuator);
    }

    pub fn position_normalized(&self) -> Ratio {
        self.pitch_trim_actuator.position_normalized()
    }
}
impl SimulationElement for TrimInputAssembly {}

pub struct ThsHydraulicAssembly {
    deflection_id: VariableIdentifier,
    hydraulic_motors: [HydraulicDriveMotor; 2],

    speed: AngularVelocity,
    actual_deflection: Angle,

    min_deflection: Angle,
    max_deflection: Angle,
    deflection_range: Angle,

    is_at_max_up_spool_valve: bool,
    is_at_max_down_spool_valve: bool,
}
impl ThsHydraulicAssembly {
    const HYDRAULIC_MOTOR_POSITION_ERROR_BREAKPOINT: [f64; 7] = [-50., -1., -0.1, 0., 0.1, 1., 50.];
    const HYDRAULIC_MOTOR_SPEED_REGULATION_COEF_MAP: [f64; 7] = [-1., -1., -0.6, 0., 0.6, 1., 1.];

    const HYD_MOTOR_SPEED_TO_THS_DEFLECTION_SPEED_GAIN: f64 = 0.0000005;

    const MAX_DEFLECTION_FOR_FULL_OPEN_SPOOL_VALVE_DEGREES: f64 = 0.2;

    pub fn new(context: &mut InitContext, min_deflection: Angle, deflection_range: Angle) -> Self {
        Self {
            deflection_id: context.get_identifier("HYD_FINAL_THS_DEFLECTION".to_owned()),
            hydraulic_motors: [HydraulicDriveMotor::new(
                AngularVelocity::new::<revolution_per_minute>(2000.),
                Self::HYDRAULIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                Self::HYDRAULIC_MOTOR_SPEED_REGULATION_COEF_MAP,
            ); 2],

            speed: AngularVelocity::default(),
            actual_deflection: Angle::default(),
            min_deflection,
            max_deflection: min_deflection + deflection_range,
            deflection_range,

            is_at_max_up_spool_valve: false,
            is_at_max_down_spool_valve: false,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        pressures: [Pressure; 2],
        trim_actuator_output_position_normalized: Ratio,
    ) {
        let deflection_demand = self.deflection_range
            * trim_actuator_output_position_normalized.get::<ratio>()
            + self.min_deflection;

        self.update_spool_valve_lock_position(deflection_demand);

        for (motor_index, motor) in self.hydraulic_motors.iter_mut().enumerate() {
            motor.set_position_request(deflection_demand);

            //println!("HYD motor");
            motor.update(context, self.actual_deflection, pressures[motor_index])
        }

        self.update_speed();

        self.update_position(context);
    }

    fn update_speed(&mut self) {
        let mut sum_of_speeds = AngularVelocity::default();

        for motor in self.hydraulic_motors {
            sum_of_speeds += motor.speed() * Self::HYD_MOTOR_SPEED_TO_THS_DEFLECTION_SPEED_GAIN;
        }

        self.speed = sum_of_speeds;
    }

    fn update_spool_valve_lock_position(&mut self, deflection_demand: Angle) {
        let deflection_error = deflection_demand - self.actual_deflection;
        self.is_at_max_up_spool_valve = deflection_error.get::<degree>()
            > Self::MAX_DEFLECTION_FOR_FULL_OPEN_SPOOL_VALVE_DEGREES;
        self.is_at_max_down_spool_valve = deflection_error.get::<degree>()
            < -Self::MAX_DEFLECTION_FOR_FULL_OPEN_SPOOL_VALVE_DEGREES;

        // println!(
        //     "DEFLECT DEMAND {:.2} DEFLECT ERROR {:.2} is_max_up {:?} is_max_down {:?}",
        //     deflection_demand.get::<degree>(),
        //     deflection_error.get::<degree>(),
        //     self.is_at_max_up_spool_valve,
        //     self.is_at_max_down_spool_valve
        // );
    }

    fn update_position(&mut self, context: &UpdateContext) {
        self.actual_deflection = self.actual_deflection
            + Angle::new::<radian>(
                self.speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );

        self.actual_deflection = self
            .actual_deflection
            .min(self.max_deflection)
            .max(self.min_deflection);
    }
}
impl SimulationElement for ThsHydraulicAssembly {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.deflection_id, self.actual_deflection.get::<degree>());
    }
}

#[cfg(test)]
mod tests {
    use uom::si::angle::degree;
    use uom::si::angular_velocity::degree_per_second;

    use super::*;
    use crate::shared::update_iterator::FixedStepLoop;
    use crate::simulation::test::{ReadByName, SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor};
    use std::time::Duration;

    use rstest::rstest;

    struct TestElecTrimControl {
        control_active: bool,
        position_request: Angle,
        motor_idx_in_control: usize,
    }
    impl TestElecTrimControl {
        fn with_motor_idx_and_pos_demand(
            motor_idx_in_control: usize,
            position_request: Angle,
        ) -> Self {
            Self {
                control_active: true,
                position_request,
                motor_idx_in_control,
            }
        }

        fn inactive_control() -> Self {
            Self {
                control_active: false,
                position_request: Angle::default(),
                motor_idx_in_control: 0,
            }
        }
    }
    impl PitchTrimActuatorController for TestElecTrimControl {
        fn commanded_position(&self) -> Angle {
            self.position_request
        }

        fn energised_motor(&self) -> [bool; 3] {
            if !self.control_active {
                [false, false, false]
            } else {
                let mut energized_array = [false, false, false];
                energized_array[self.motor_idx_in_control] = true;
                energized_array
            }
        }
    }

    struct TestManualTrimControl {
        control_active: bool,
        speed: AngularVelocity,
    }
    impl TestManualTrimControl {
        fn with_manual_input(speed: AngularVelocity) -> Self {
            Self {
                control_active: true,
                speed,
            }
        }

        fn without_manual_input() -> Self {
            Self {
                control_active: false,
                speed: AngularVelocity::default(),
            }
        }
    }
    impl ManualPitchTrimController for TestManualTrimControl {
        fn is_manually_moved(&self) -> bool {
            self.control_active
        }

        fn moving_speed(&self) -> AngularVelocity {
            self.speed
        }
    }

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        elec_trim_control: TestElecTrimControl,
        manual_trim_control: TestManualTrimControl,

        trim_assembly: TrimInputAssembly,

        ths_assembly: ThsHydraulicAssembly,

        hydraulic_pressures: [Pressure; 2],
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(33)),
                elec_trim_control: TestElecTrimControl::inactive_control(),
                manual_trim_control: TestManualTrimControl::without_manual_input(),
                trim_assembly: TrimInputAssembly::new(
                    context,
                    Angle::new::<degree>(360. * -1.4),
                    Angle::new::<degree>(360. * 6.13),
                    Angle::new::<degree>(360. * -1.87),
                    Angle::new::<degree>(360. * 6.32),
                    AngularVelocity::new::<revolution_per_minute>(5000.),
                    Ratio::new::<ratio>(2035. / 6.13),
                ),
                ths_assembly: ThsHydraulicAssembly::new(
                    context,
                    Angle::new::<degree>(-4.),
                    Angle::new::<degree>(17.5),
                ),

                hydraulic_pressures: [Pressure::new::<psi>(3000.); 2],
            }
        }

        fn set_elec_trim_demand(&mut self, angle_request: Angle, motor_idx: usize) {
            self.elec_trim_control =
                TestElecTrimControl::with_motor_idx_and_pos_demand(motor_idx, angle_request);
        }

        fn set_manual_trim_input(&mut self, trim_up: bool) {
            self.manual_trim_control = if trim_up {
                TestManualTrimControl::with_manual_input(AngularVelocity::new::<degree_per_second>(
                    30.,
                ))
            } else {
                TestManualTrimControl::with_manual_input(AngularVelocity::new::<degree_per_second>(
                    -30.,
                ))
            }
        }

        fn set_no_manual_input(&mut self) {
            self.manual_trim_control = TestManualTrimControl::without_manual_input();
        }

        fn set_no_elec_input(&mut self) {
            self.elec_trim_control = TestElecTrimControl::inactive_control();
        }

        fn set_hyd_pressure(&mut self, pressures: [Pressure; 2]) {
            self.hydraulic_pressures = pressures;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.trim_assembly.update(
                    &context.with_delta(cur_time_step),
                    &self.elec_trim_control,
                    &self.manual_trim_control,
                    &self.ths_assembly,
                );

                self.ths_assembly.update(
                    context,
                    self.hydraulic_pressures,
                    self.trim_assembly.position_normalized(),
                );

                println!(
                    "TW turns: {:.3} ,PTA turns {:.3}, PTA norm {:.2} EMotors rpm {:.0}/{:.0}/{:.0} HydMotors rpm {:.0} {:.0} THS Deg {:.1}",
                    self.trim_assembly.trim_wheel.position.get::<degree>() / 360.,
                    self.trim_assembly
                        .pitch_trim_actuator
                        .position
                        .get::<degree>()
                        / 360.,
                    self.trim_assembly.position_normalized().get::<ratio>(),
                    self.trim_assembly.pitch_trim_actuator.electric_motors[0]
                        .speed()
                        .get::<revolution_per_minute>(),
                    self.trim_assembly.pitch_trim_actuator.electric_motors[1]
                        .speed()
                        .get::<revolution_per_minute>(),
                    self.trim_assembly.pitch_trim_actuator.electric_motors[2]
                        .speed()
                        .get::<revolution_per_minute>(),
                    self.ths_assembly.hydraulic_motors[0].speed().get::<revolution_per_minute>(),
                    self.ths_assembly.hydraulic_motors[1].speed().get::<revolution_per_minute>(),
                    self.ths_assembly.actual_deflection.get::<degree>()

                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.trim_assembly.accept(visitor);
            self.ths_assembly.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn trim_assembly_init_state() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run_with_delta(Duration::from_millis(100));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>().abs() < 0.01);
    }

    #[rstest]
    #[case(0)]
    #[case(1)]
    #[case(2)]
    fn trim_assembly_trim_up_trim_down_motor_n(#[case] motor_idx: usize) {
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(360. * 4.5), motor_idx));
        test_bed.run_with_delta(Duration::from_millis(20000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() > 12.);
        assert!(deflection.get::<degree>() < 14.);

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(360. * -1.), motor_idx));
        test_bed.run_with_delta(Duration::from_millis(20000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() >= -4.);
        assert!(deflection.get::<degree>() < -2.);
    }

    #[test]
    fn trim_assembly_trim_up_trim_down_motor_0() {
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(360. * 4.5), 0));
        test_bed.run_with_delta(Duration::from_millis(2000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        // assert!(deflection.get::<degree>() > 12.);
        // assert!(deflection.get::<degree>() < 14.);

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(360. * -1.), 0));
        test_bed.run_with_delta(Duration::from_millis(2000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        // assert!(deflection.get::<degree>() >= -4.);
        // assert!(deflection.get::<degree>() < -2.);
    }

    #[test]
    fn trim_assembly_moves_but_ths_stops_with_hyd_press_below_1450psi() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(360. * 4.5), 0));
        test_bed.run_with_delta(Duration::from_millis(5000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() > 2.);

        println!("PRESSURE DROP");
        test_bed.command(|a| {
            a.set_hyd_pressure([Pressure::new::<psi>(1300.), Pressure::new::<psi>(1300.)])
        });
        test_bed.run_with_delta(Duration::from_millis(5000));

        let deflection_after_hyd_fail: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!((deflection - deflection_after_hyd_fail).abs() < Angle::new::<degree>(1.));
    }
}
