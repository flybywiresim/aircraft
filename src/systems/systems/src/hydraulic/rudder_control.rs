use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{
    angle::{degree, radian},
    angular_velocity::{degree_per_second, radian_per_second, revolution_per_minute},
    f64::*,
    pressure::psi,
    ratio::ratio,
    volume::gallon,
    volume_rate::gallon_per_minute,
};

use crate::shared::{
    interpolation, low_pass_filter::LowPassFilter, ElectricalBusType, ElectricalBuses,
};

use std::time::Duration;

struct ElecMotor {
    powered_by: ElectricalBusType,
    is_powered: bool,

    is_active: bool,

    target_angle: Angle,
}
impl ElecMotor {
    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            powered_by,
            is_powered: false,
            is_active: false,
            target_angle: Angle::default(),
        }
    }

    fn set_active(&mut self, is_commanded_active: bool, target_position: Angle) {
        self.target_angle = target_position;
        self.is_active = is_commanded_active && self.is_powered
    }

    fn is_active(&self) -> bool {
        self.is_active
    }

    fn target_angle(&self) -> Angle {
        self.target_angle
    }
}
impl SimulationElement for ElecMotor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

trait YawDamperActuatorController {
    fn is_solenoid_energized(&self) -> bool;
    fn position_request(&self) -> Ratio;
}

struct YawDamperActuator {
    current_ratio: LowPassFilter<Ratio>,
    is_control_active: bool,
}
impl YawDamperActuator {
    const POSITION_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(1500);
    const POSITION_FILTER_MECHANICAL_CENTERING_TIME_CONSTANT: Duration =
        Duration::from_millis(3000);

    const MIN_HYD_PRESS_FOR_ACTIVE_MODE_PSI: f64 = 1500.;
    const REFERENCE_HYD_PRESS_FOR_MAX_SPEED_PSI: f64 = 3000.;

    fn new() -> Self {
        Self {
            current_ratio: LowPassFilter::<Ratio>::new_with_init_value(
                Self::POSITION_FILTER_TIME_CONSTANT,
                Ratio::new::<ratio>(0.5),
            ),
            is_control_active: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        actuator_controller: &impl YawDamperActuatorController,
        current_pressure: Pressure,
    ) {
        if current_pressure.get::<psi>() > Self::MIN_HYD_PRESS_FOR_ACTIVE_MODE_PSI
            && actuator_controller.is_solenoid_energized()
        {
            self.update_time_constant_from_pressure(current_pressure);

            self.current_ratio.update(
                context.delta(),
                actuator_controller
                    .position_request()
                    .min(Ratio::new::<ratio>(1.))
                    .max(Ratio::new::<ratio>(0.)),
            );

            self.is_control_active = true;
        } else {
            self.update_time_constant_for_spring_centering();
            self.current_ratio
                .update(context.delta(), Ratio::new::<ratio>(0.5));
            self.is_control_active = false;
        }
    }

    fn update_time_constant_from_pressure(&mut self, pressure: Pressure) {
        let pressure_speed_ratio =
            pressure.get::<psi>() / Self::REFERENCE_HYD_PRESS_FOR_MAX_SPEED_PSI;

        self.current_ratio
            .set_time_constant(Duration::from_secs_f64(
                Self::POSITION_FILTER_TIME_CONSTANT.as_secs_f64() * pressure_speed_ratio,
            ));
    }

    fn update_time_constant_for_spring_centering(&mut self) {
        self.current_ratio
            .set_time_constant(Self::POSITION_FILTER_MECHANICAL_CENTERING_TIME_CONSTANT);
    }

    fn is_control_active(&self) -> bool {
        self.is_control_active
    }

    fn position_normalized(&self) -> Ratio {
        self.current_ratio.output()
    }

    fn set_slaved_position(&mut self, master_actuator_position_normalized: Ratio) {
        self.current_ratio
            .reset(master_actuator_position_normalized);
    }
}

struct YawDamperMechanism {
    actuators: [YawDamperActuator; 2],
}
impl YawDamperMechanism {
    const RATIO_TO_ANGLE_GAIN: f64 = 50.;

    fn new() -> Self {
        Self {
            actuators: [YawDamperActuator::new(), YawDamperActuator::new()],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        controllers: [&impl YawDamperActuatorController; 2],
        pressures: [Pressure; 2],
    ) {
        self.actuators[0].update(context, controllers[0], pressures[0]);
        self.actuators[1].update(context, controllers[1], pressures[1]);

        self.update_position_of_slaved_actuator();
    }

    fn update_position_of_slaved_actuator(&mut self) {
        if self.actuators[0].is_control_active() {
            self.actuators[1].set_slaved_position(self.actuators[0].position_normalized());
        } else if self.actuators[1].is_control_active() {
            self.actuators[0].set_slaved_position(self.actuators[1].position_normalized());
        }
    }

    fn position_angle(&self) -> Angle {
        let position_normalized = if self.actuators[0].is_control_active() {
            self.actuators[0].position_normalized()
        } else if self.actuators[1].is_control_active() {
            self.actuators[1].position_normalized()
        } else {
            (self.actuators[0].position_normalized() + self.actuators[1].position_normalized()) / 2.
        };

        Angle::new::<degree>((position_normalized.get::<ratio>() - 0.5) * Self::RATIO_TO_ANGLE_GAIN)
    }
}

pub trait AngularPositioningController {
    fn commanded_position(&self) -> [Angle; 2];
    fn energised_motor(&self) -> [bool; 2];
}

/// Position an output shaft with the help of two elec motors.
/// This is common to trim and travel limiter mechanisms
struct AngularPositioningWithDualElecMotors {
    angle: Angle,
    speed: LowPassFilter<AngularVelocity>,
    motors: [ElecMotor; 2],

    last_delta_angle: Angle,

    max_speed: AngularVelocity,
    max_angle: Angle,
    min_angle: Angle,
}
impl AngularPositioningWithDualElecMotors {
    const SPEED_FILTER_TIME_CONST: Duration = Duration::from_millis(500);

    fn new(
        max_speed: AngularVelocity,
        max_angle: Angle,
        min_angle: Angle,
        init_angle: Angle,
        motor1_powered_by: ElectricalBusType,
        motor2_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            angle: init_angle,
            speed: LowPassFilter::new(Self::SPEED_FILTER_TIME_CONST),
            motors: [
                ElecMotor::new(motor1_powered_by),
                ElecMotor::new(motor2_powered_by),
            ],

            last_delta_angle: init_angle,
            max_speed,
            max_angle,
            min_angle,
        }
    }

    fn update(&mut self, context: &UpdateContext, controller: &impl AngularPositioningController) {
        self.update_motors_command(controller);

        if let Some(angle_request) = self.active_position_request() {
            self.update_trim_speed_from_angle_request(context, angle_request);
        } else {
            self.speed.update(
                context.delta(),
                AngularVelocity::new::<degree_per_second>(0.),
            );
        }

        self.update_position(context);
    }

    fn update_motors_command(&mut self, controller: &impl AngularPositioningController) {
        for (index, motor) in self.motors.iter_mut().enumerate() {
            motor.set_active(
                controller.energised_motor()[index],
                controller.commanded_position()[index],
            );
        }
    }

    fn active_position_request(&self) -> Option<Angle> {
        if self.motors[0].is_active() {
            Some(self.motors[0].target_angle())
        } else if self.motors[1].is_active() {
            Some(self.motors[1].target_angle())
        } else {
            None
        }
    }

    fn update_trim_speed_from_angle_request(
        &mut self,
        context: &UpdateContext,
        angle_request: Angle,
    ) {
        let delta_angle = angle_request - self.angle;

        if delta_angle > Angle::new::<degree>(0.04)
            && self.last_delta_angle > Angle::new::<degree>(0.)
        {
            self.speed.update(context.delta(), self.max_speed);
        } else if delta_angle < Angle::new::<degree>(-0.04)
            && self.last_delta_angle < Angle::new::<degree>(0.)
        {
            self.speed.update(context.delta(), -self.max_speed);
        } else {
            self.speed
                .reset(AngularVelocity::new::<degree_per_second>(0.));
        }

        self.last_delta_angle = delta_angle;
    }

    fn update_position(&mut self, context: &UpdateContext) {
        self.angle += Angle::new::<degree>(
            self.speed.output().get::<degree_per_second>() * context.delta_as_secs_f64(),
        );

        self.angle = self.angle.min(self.max_angle).max(self.min_angle);
    }

    fn angle(&self) -> Angle {
        self.angle
    }
}
impl SimulationElement for AngularPositioningWithDualElecMotors {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.motors, visitor);

        visitor.visit(self);
    }
}

struct RudderTrimActuator {
    rudder_trim_feedback_angle_id: VariableIdentifier,
    mechanism: AngularPositioningWithDualElecMotors,
}

impl RudderTrimActuator {
    const MOTOR1_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrentEssential;
    const MOTOR2_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(2);

    const TRIM_SPEED_DEG_PER_S: f64 = 1.;
    const MIN_ANGLE_DEG: f64 = -25.;
    const MAX_ANGLE_DEG: f64 = 25.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            rudder_trim_feedback_angle_id: context
                .get_identifier("HYD_RUDDER_TRIM_FEEDBACK_ANGLE".to_owned()),

            mechanism: AngularPositioningWithDualElecMotors::new(
                AngularVelocity::new::<degree_per_second>(Self::TRIM_SPEED_DEG_PER_S),
                Angle::new::<degree>(Self::MAX_ANGLE_DEG),
                Angle::new::<degree>(Self::MIN_ANGLE_DEG),
                Angle::default(),
                Self::MOTOR1_POWER_BUS,
                Self::MOTOR2_POWER_BUS,
            ),
        }
    }

    fn update(&mut self, context: &UpdateContext, controller: &impl AngularPositioningController) {
        self.mechanism.update(context, controller);
    }

    fn angle(&self) -> Angle {
        self.mechanism.angle()
    }
}
impl SimulationElement for RudderTrimActuator {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mechanism.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.rudder_trim_feedback_angle_id, self.angle());
    }
}

struct RudderTravelLimiter {
    rudder_limiter_feedback_angle_id: VariableIdentifier,

    mechanism: AngularPositioningWithDualElecMotors,
}
impl RudderTravelLimiter {
    const MOTOR1_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrentEssential;
    const MOTOR2_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(2);

    const SPEED_DEG_PER_S: f64 = 1.;
    const MIN_ANGLE_DEG: f64 = 3.5;
    const MAX_ANGLE_DEG: f64 = 25.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            rudder_limiter_feedback_angle_id: context
                .get_identifier("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE".to_owned()),

            mechanism: AngularPositioningWithDualElecMotors::new(
                AngularVelocity::new::<degree_per_second>(Self::SPEED_DEG_PER_S),
                Angle::new::<degree>(Self::MAX_ANGLE_DEG),
                Angle::new::<degree>(Self::MIN_ANGLE_DEG),
                Angle::new::<degree>(Self::MAX_ANGLE_DEG),
                Self::MOTOR1_POWER_BUS,
                Self::MOTOR2_POWER_BUS,
            ),
        }
    }

    fn update(&mut self, context: &UpdateContext, controller: &impl AngularPositioningController) {
        self.mechanism.update(context, controller);
    }

    fn min(&self) -> Angle {
        -self.mechanism.angle()
    }

    fn max(&self) -> Angle {
        self.mechanism.angle()
    }
}
impl SimulationElement for RudderTravelLimiter {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mechanism.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.rudder_limiter_feedback_angle_id, self.max());
    }
}

struct RudderMechanicalControl {
    travel_limiter: RudderTravelLimiter,
    trim: RudderTrimActuator,

    final_actuators_input: Angle,
}
impl RudderMechanicalControl {
    fn new(context: &mut InitContext) -> Self {
        Self {
            travel_limiter: RudderTravelLimiter::new(context),
            trim: RudderTrimActuator::new(context),

            final_actuators_input: Angle::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        rudder_pedal_position_requested: Angle,
        trim_controller: &impl AngularPositioningController,
        travel_limiter_controller: &impl AngularPositioningController,
    ) {
        self.travel_limiter
            .update(context, travel_limiter_controller);
        self.trim.update(context, trim_controller);

        self.final_actuators_input = (rudder_pedal_position_requested + self.trim.angle())
            .min(self.travel_limiter.max())
            .max(self.travel_limiter.min())
    }
}
impl SimulationElement for RudderMechanicalControl {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.travel_limiter.accept(visitor);
        self.trim.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use uom::si::angle::degree;
    use uom::si::{angular_velocity::degree_per_second, electric_potential::volt, ratio::percent};

    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use super::*;
    use crate::shared::{update_iterator::FixedStepLoop, PotentialOrigin};
    use crate::simulation::test::{ReadByName, SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};
    use std::time::Duration;

    use rstest::rstest;

    struct TestPositionController {
        motor_active: [bool; 2],
        position_request: [Angle; 2],
    }
    impl TestPositionController {
        fn default() -> Self {
            Self {
                motor_active: [false; 2],
                position_request: [Angle::default(); 2],
            }
        }

        fn set_active(&mut self, motor_active: [bool; 2], position_request: [Angle; 2]) {
            self.motor_active = motor_active;
            self.position_request = position_request;
        }
    }
    impl AngularPositioningController for TestPositionController {
        fn commanded_position(&self) -> [Angle; 2] {
            self.position_request
        }

        fn energised_motor(&self) -> [bool; 2] {
            self.motor_active
        }
    }

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        trim_controller: TestPositionController,
        limiter_controller: TestPositionController,
        rudder_pedal_input: Angle,

        rudder_control: RudderMechanicalControl,

        hydraulic_pressures: [Pressure; 2],

        powered_source_ac: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        is_elec_powered: bool,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(33)),
                trim_controller: TestPositionController::default(),
                limiter_controller: TestPositionController::default(),
                rudder_pedal_input: Angle::default(),

                rudder_control: RudderMechanicalControl::new(context),

                hydraulic_pressures: [Pressure::new::<psi>(3000.); 2],

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),

                ac_1_bus: ElectricalBus::new(
                    context,
                    ElectricalBusType::AlternatingCurrentEssential,
                ),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),

                is_elec_powered: true,
            }
        }

        fn final_rudder_demand(&self) -> Angle {
            self.rudder_control.final_actuators_input
        }

        fn set_hyd_pressure(&mut self, pressures: [Pressure; 2]) {
            self.hydraulic_pressures = pressures;
        }

        fn set_trim_demand(&mut self, motor_active: [bool; 2], position_request: [Angle; 2]) {
            self.trim_controller
                .set_active(motor_active, position_request);
        }

        fn set_limiter_demand(&mut self, motor_active: [bool; 2], position_request: [Angle; 2]) {
            self.limiter_controller
                .set_active(motor_active, position_request);
        }

        fn set_rudder_pedal_angle(&mut self, pedal_angle: Angle) {
            self.rudder_pedal_input = pedal_angle;
        }

        fn set_no_elec_power(&mut self) {
            self.is_elec_powered = false;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(140.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_elec_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
                electricity.flow(&self.powered_source_ac, &self.ac_2_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.rudder_control.update(
                    &context.with_delta(cur_time_step),
                    self.rudder_pedal_input,
                    &self.trim_controller,
                    &self.limiter_controller,
                );

                println!(
                    "TRIM DEMAND: {:.3} ,TRIM REAL POS {:.3}, LIMITER +/- {:.3} Final actuator input {:.3} ",
                    self.trim_controller.commanded_position()[0].get::<degree>(),
                    self.rudder_control.trim.mechanism.angle.get::<degree>(),
                    self.rudder_control.travel_limiter.mechanism.angle.get::<degree>(),
                    self.rudder_control.final_actuators_input.get::<degree>(),
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.rudder_control.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn trim_demand_up_15_degrees_then_down() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(15.), Angle::new::<degree>(15.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(17000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert!((trim_deflection.get::<degree>() - 15.).abs() < 0.1);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(-15.), Angle::new::<degree>(-15.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(34000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert!((trim_deflection.get::<degree>() - -15.).abs() < 0.1);
    }

    #[test]
    fn trim_demand_up_1_degrees_then_2() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(1.), Angle::new::<degree>(1.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(2000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert!((trim_deflection.get::<degree>() - 1.).abs() < 0.1);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(2.), Angle::new::<degree>(2.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(2000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert!((trim_deflection.get::<degree>() - 2.).abs() < 0.1);
    }

    #[test]
    fn trim_demand_added_to_pedal_demand() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(3.), Angle::new::<degree>(3.)],
            )
        });
        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(5.)));
        test_bed.run_with_delta(Duration::from_millis(4000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert!((trim_deflection.get::<degree>() - 3.).abs() < 0.1);

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert!((final_rudder_deflection.get::<degree>() - 8.).abs() < 0.1);
    }

    #[test]
    fn limiter_limits_final_demand_up() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(3.), Angle::new::<degree>(3.)],
            )
        });
        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(5.)));
        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(30000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert!((trim_deflection.get::<degree>() - 3.).abs() < 0.1);

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert!((final_rudder_deflection.get::<degree>() - 3.5).abs() < 0.1);
    }

    #[test]
    fn limiter_limits_final_demand_down() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(-3.), Angle::new::<degree>(-3.)],
            )
        });
        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(-5.)));
        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(30000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert!((trim_deflection.get::<degree>() - -3.).abs() < 0.1);

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert!((final_rudder_deflection.get::<degree>() - -3.5).abs() < 0.1);
    }
}
