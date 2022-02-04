use crate::hydraulic::linear_actuator::Actuator;
use crate::shared::{interpolation, low_pass_filter::LowPassFilter};
use crate::simulation::{
    InitContext, SimulationElement, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};

use std::time::Duration;
use uom::si::{
    angle::{degree, radian},
    angular_velocity::radian_per_second,
    f64::*,
    length::meter,
    pressure::psi,
    ratio::ratio,
    velocity::knot,
    volume::gallon,
};

pub trait Pushback {
    fn is_nose_wheel_steering_pin_inserted(&self) -> bool;
    fn steering_angle(&self) -> Angle;
}

pub trait SteeringController {
    fn requested_position(&self) -> Angle;
}

/// Computes steering angle based on angle demand and input speed
///
/// Speed_limited_angle = MAP(Angle_Demand,Speed)
pub struct SteeringAngleLimiter<const N: usize> {
    speed_map: [f64; N],
    speed_coeff_map: [f64; N],
}
impl<const N: usize> SteeringAngleLimiter<N> {
    pub fn new(speed_map: [f64; N], speed_coeff_map: [f64; N]) -> Self {
        Self {
            speed_map,
            speed_coeff_map,
        }
    }

    /// Gets final steering angle coefficient based on current speed
    pub fn angle_from_speed(&self, speed: Velocity, angle_demand: Angle) -> Angle {
        let speed_coeff =
            interpolation(&self.speed_map, &self.speed_coeff_map, speed.get::<knot>());

        speed_coeff * angle_demand
    }
}

/// Computes a steering angle based on steering ratio requested [-1;1] , a gain and a
/// curve map.
/// Input steering ratio is first multiplied by an input gain
/// This Input x Gain value then goes through a table to get an angle demand
///
/// Angle_Demand = MAP(Input * Gain)
pub struct SteeringRatioToAngle<const N: usize> {
    input_gain: Ratio,
    controller_angle_map: [f64; N],
    controller_angle_input: [f64; N],
}
impl<const N: usize> SteeringRatioToAngle<N> {
    pub fn new(
        input_gain: Ratio,
        controller_angle_input: [f64; N],
        controller_angle_map: [f64; N],
    ) -> Self {
        Self {
            input_gain,
            controller_angle_input,
            controller_angle_map,
        }
    }

    pub fn angle_demand_from_input_demand(&self, steering_ratio_requested: Ratio) -> Angle {
        let raw_input =
            Angle::new::<degree>((steering_ratio_requested * self.input_gain).get::<ratio>());

        let raw_demanded_angle = Angle::new::<degree>(interpolation(
            &self.controller_angle_input,
            &self.controller_angle_map,
            raw_input.get::<degree>().abs(),
        ));

        if steering_ratio_requested.get::<ratio>() > 0. {
            raw_demanded_angle
        } else {
            -raw_demanded_angle
        }
    }
}

pub struct SteeringActuator {
    position_id: VariableIdentifier,

    current_speed: LowPassFilter<AngularVelocity>,
    current_position: Angle,

    max_half_angle: Angle,

    max_speed: LowPassFilter<AngularVelocity>,
    nominal_speed: AngularVelocity,

    angular_to_linear_ratio: Ratio,

    total_volume_to_actuator: Volume,
    total_volume_to_reservoir: Volume,

    actuator_area: Area,
}
impl SteeringActuator {
    const MIN_PRESSURE_ALLOWING_STEERING_PSI: f64 = 300.;

    const REFERENCE_PRESS_FOR_NOMINAL_SPEED_PSI: f64 = 2000.;

    const MAX_SPEED_FILTER_TIMECONST: Duration = Duration::from_millis(100);
    const CURRENT_SPEED_FILTER_TIMECONST: Duration = Duration::from_millis(150);

    pub fn new(
        context: &mut InitContext,
        max_half_angle: Angle,
        nominal_speed: AngularVelocity,
        actuator_diameter: Length,
        angular_to_linear_ratio: Ratio,
    ) -> Self {
        Self {
            position_id: context.get_identifier("NOSE_WHEEL_POSITION_RATIO".to_owned()),

            current_speed: LowPassFilter::<AngularVelocity>::new(
                Self::CURRENT_SPEED_FILTER_TIMECONST,
            ),
            current_position: Angle::new::<radian>(0.),

            max_half_angle,

            max_speed: LowPassFilter::<AngularVelocity>::new(Self::MAX_SPEED_FILTER_TIMECONST),
            nominal_speed,
            angular_to_linear_ratio,

            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_to_reservoir: Volume::new::<gallon>(0.),

            actuator_area: std::f64::consts::PI
                * (actuator_diameter / 2.)
                * (actuator_diameter / 2.),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        current_pressure: Pressure,
        steering_controller: &impl SteeringController,
        pushback_tug: &impl Pushback,
    ) {
        if !pushback_tug.is_nose_wheel_steering_pin_inserted() {
            self.update_max_speed(context, current_pressure);

            let limited_requested_angle = steering_controller
                .requested_position()
                .min(self.max_half_angle)
                .max(-self.max_half_angle);

            self.update_current_speed(context, limited_requested_angle);

            self.update_final_speed_position(context, limited_requested_angle);
        } else {
            self.update_speed_position_during_pushback(pushback_tug);
        }

        self.update_flow(context, pushback_tug);
    }

    fn update_final_speed_position(&mut self, context: &UpdateContext, requested_angle: Angle) {
        self.current_position += Angle::new::<radian>(
            self.current_speed.output().get::<radian_per_second>() * context.delta_as_secs_f64(),
        );

        let position_error_abs = (requested_angle - self.position_feedback()).abs();

        // If we crossed desired position between frames we assume we stopped at correct position
        // Checking a position error because if requested angle changed since last frame by a huge
        // amount, we want to track new position not to directly set new position
        if position_error_abs.get::<degree>() < 5.
            && ((self.current_speed.output().get::<radian_per_second>() > 0.
                && requested_angle < self.position_feedback())
                || (self.current_speed.output().get::<radian_per_second>() < 0.
                    && requested_angle > self.position_feedback()))
        {
            self.current_speed
                .reset(AngularVelocity::new::<radian_per_second>(0.));
            self.current_position = requested_angle;
        }
    }

    fn update_speed_position_during_pushback(&mut self, pushback_tug: &impl Pushback) {
        self.current_speed
            .reset(AngularVelocity::new::<radian_per_second>(0.));
        self.current_position = pushback_tug.steering_angle();
    }

    fn update_current_speed(&mut self, context: &UpdateContext, requested_angle: Angle) {
        let signed_max_speed = if requested_angle > self.position_feedback() {
            self.max_speed.output()
        } else if requested_angle < self.position_feedback() {
            -self.max_speed.output()
        } else {
            AngularVelocity::new::<radian_per_second>(0.)
        };

        self.current_speed.update(context.delta(), signed_max_speed);
    }

    fn update_max_speed(&mut self, context: &UpdateContext, current_pressure: Pressure) {
        let mut new_max_speed =
            if current_pressure.get::<psi>() > Self::MIN_PRESSURE_ALLOWING_STEERING_PSI {
                self.nominal_speed * current_pressure.get::<psi>().sqrt() * 1.
                    / Self::REFERENCE_PRESS_FOR_NOMINAL_SPEED_PSI.sqrt()
            } else {
                AngularVelocity::new::<radian_per_second>(0.)
            };

        new_max_speed = new_max_speed.min(self.nominal_speed);

        self.max_speed.update(context.delta(), new_max_speed);
    }

    fn update_flow(&mut self, context: &UpdateContext, pushback_tug: &impl Pushback) {
        if !pushback_tug.is_nose_wheel_steering_pin_inserted() {
            let angular_position_delta_abs = Angle::new::<radian>(
                self.current_speed.output().get::<radian_per_second>().abs()
                    * context.delta_as_secs_f64(),
            );

            let linear_position_delta = Length::new::<meter>(
                angular_position_delta_abs.get::<radian>()
                    * self.angular_to_linear_ratio.get::<ratio>(),
            );

            self.total_volume_to_actuator = linear_position_delta * self.actuator_area;
            self.total_volume_to_reservoir = linear_position_delta * self.actuator_area;
        }
    }

    pub fn position_feedback(&self) -> Angle {
        self.current_position
    }

    fn position_normalized(&self) -> Ratio {
        Ratio::new::<ratio>(
            self.current_position.get::<radian>() / self.max_half_angle.get::<radian>(),
        )
    }
}
impl Actuator for SteeringActuator {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }

    fn reservoir_return(&self) -> Volume {
        self.total_volume_to_reservoir
    }

    fn reset_volumes(&mut self) {
        self.total_volume_to_reservoir = Volume::new::<gallon>(0.);
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
    }
}
impl SimulationElement for SteeringActuator {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.position_normalized().get::<ratio>());
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    use crate::simulation::test::{ReadByName, SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor};
    use std::time::Duration;
    use uom::si::{angle::degree, pressure::psi};

    struct TestPushBack {
        steering: Angle,
        is_connected: bool,
    }
    impl TestPushBack {
        fn new() -> Self {
            Self {
                steering: Angle::new::<radian>(0.),
                is_connected: false,
            }
        }

        fn set_pin_inserted(&mut self) {
            self.is_connected = true;
        }

        fn set_steer_angle(&mut self, angle: Angle) {
            self.steering = angle;
        }
    }
    impl Pushback for TestPushBack {
        fn is_nose_wheel_steering_pin_inserted(&self) -> bool {
            self.is_connected
        }

        fn steering_angle(&self) -> Angle {
            self.steering
        }
    }

    struct TestSteeringController {
        requested_position: Angle,
    }
    impl TestSteeringController {
        fn new() -> Self {
            Self {
                requested_position: Angle::new::<radian>(0.),
            }
        }

        fn set_requested_position(&mut self, requested_position: Angle) {
            self.requested_position = requested_position;
        }
    }
    impl SteeringController for TestSteeringController {
        fn requested_position(&self) -> Angle {
            self.requested_position
        }
    }

    struct TestAircraft {
        steering_actuator: SteeringActuator,

        controller: TestSteeringController,

        pressure: Pressure,

        pushback: TestPushBack,
    }
    impl TestAircraft {
        fn new(steering_actuator: SteeringActuator) -> Self {
            Self {
                steering_actuator,

                controller: TestSteeringController::new(),

                pressure: Pressure::new::<psi>(0.),

                pushback: TestPushBack::new(),
            }
        }

        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure = pressure;
        }

        fn command_steer_angle(&mut self, angle: Angle) {
            self.controller.set_requested_position(angle);
        }

        fn command_pushback_angle(&mut self, angle: Angle) {
            self.pushback.set_steer_angle(angle);
        }

        fn set_pushback(&mut self) {
            self.pushback.set_pin_inserted();
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.steering_actuator
                .update(context, self.pressure, &self.controller, &self.pushback);

            println!(
                "Steering feedback {:.3} deg, Norm pos {:.1}, Speed {:.3} rad/s, Target {:.1} deg , Pressure {:.0}",
                self.steering_actuator.position_feedback().get::<degree>(),
                self.steering_actuator.position_normalized().get::<ratio>(),
                self.steering_actuator
                    .current_speed
                    .output().get::<radian_per_second>(),
                self.controller.requested_position().get::<degree>(),
                self.pressure.get::<psi>()
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.steering_actuator.accept(visitor);
            visitor.visit(self);
        }
    }

    #[test]
    fn writes_its_states() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("NOSE_WHEEL_POSITION_RATIO"));
    }

    #[test]
    fn init_with_zero_angle() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        let actuator_position_init = test_bed.query(|a| a.steering_actuator.position_feedback());

        test_bed.run_multiple_frames(Duration::from_secs(1));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            actuator_position_init
        ));

        let normalized_position: f64 = test_bed.read_by_name("NOSE_WHEEL_POSITION_RATIO");
        assert!(normalized_position == 0.);
    }

    #[test]
    fn steering_not_moving_without_pressure() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        let actuator_position_init = test_bed.query(|a| a.steering_actuator.position_feedback());
        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(0.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(90.)));

        test_bed.run_multiple_frames(Duration::from_secs(1));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            actuator_position_init
        ));

        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(-90.)));

        test_bed.run_multiple_frames(Duration::from_secs(1));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            actuator_position_init
        ));
    }

    #[test]
    fn steering_not_moving_with_pushback_pin_inserted() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        let actuator_position_init = test_bed.query(|a| a.steering_actuator.position_feedback());
        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(90.)));
        test_bed.command(|a| a.set_pushback());

        test_bed.run_multiple_frames(Duration::from_secs(1));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            actuator_position_init
        ));

        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(-90.)));

        test_bed.run_multiple_frames(Duration::from_secs(1));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            actuator_position_init
        ));
    }

    #[test]
    fn steering_driven_by_pushback_angle_when_pushing_back() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(90.)));
        test_bed.command(|a| a.set_pushback());
        test_bed.command(|a| a.command_pushback_angle(Angle::new::<degree>(12.)));

        test_bed.run_multiple_frames(Duration::from_secs(1));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(12.)
        ));
    }

    #[test]
    fn steering_moving_with_pressure_to_max_pos_less_than_5s() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(90.)));

        test_bed.run_multiple_frames(Duration::from_secs(5));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(75.)
        ));

        assert!(
            test_bed.query(|a| a.steering_actuator.position_normalized())
                == Ratio::new::<ratio>(1.)
        );

        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(-90.)));
        test_bed.run_multiple_frames(Duration::from_secs(10));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(-75.)
        ));

        assert!(
            test_bed.query(|a| a.steering_actuator.position_normalized())
                == Ratio::new::<ratio>(-1.)
        );
    }

    #[test]
    fn steering_stops_at_target_position() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(20.)));

        test_bed.run_multiple_frames(Duration::from_secs(2));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(20.)
        ));
    }

    #[test]
    fn steering_direction_change_is_smooth() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(90.)));

        test_bed.run_multiple_frames(Duration::from_millis(3500));

        let position_captured = test_bed.query(|a| a.steering_actuator.position_feedback());

        println!("REVERT SPEED");

        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(-90.)));
        test_bed.run_multiple_frames(Duration::from_millis(400));

        let new_position = test_bed.query(|a| a.steering_actuator.position_feedback());
        assert!((position_captured - new_position).abs() < Angle::new::<degree>(10.));
    }

    #[test]
    fn steering_from_rudder_moving_only_by_6_deg_at_20_knot() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        let angle_limiter = pedal_speed_angle_limiter();
        let input_map = pedal_input_angle();

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| {
            a.command_steer_angle(angle_limiter.angle_from_speed(
                Velocity::new::<knot>(20.),
                input_map.angle_demand_from_input_demand(Ratio::new::<ratio>(1.)),
            ))
        });

        test_bed.run_multiple_frames(Duration::from_secs(3));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(6.4)
        ));

        test_bed.command(|a| {
            a.command_steer_angle(angle_limiter.angle_from_speed(
                Velocity::new::<knot>(20.),
                input_map.angle_demand_from_input_demand(Ratio::new::<ratio>(-1.)),
            ))
        });

        test_bed.run_multiple_frames(Duration::from_secs(6));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(-6.4)
        ));
    }

    #[test]
    fn steering_tiller_handle_20_degrees_requests_only_4_degrees() {
        let mut test_bed =
            SimulationTestBed::new(|context| TestAircraft::new(steering_actuator(context)));

        let angle_limiter = tiller_speed_angle_limiter();
        let input_map = tiller_input_angle();

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| {
            a.command_steer_angle(angle_limiter.angle_from_speed(
                Velocity::new::<knot>(0.),
                input_map.angle_demand_from_input_demand(Ratio::new::<ratio>(20. / 75.)),
            ))
        });

        test_bed.run_multiple_frames(Duration::from_secs(3));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(4.)
        ));
    }

    fn steering_actuator(context: &mut InitContext) -> SteeringActuator {
        SteeringActuator::new(
            context,
            Angle::new::<degree>(75.),
            AngularVelocity::new::<radian_per_second>(0.35),
            Length::new::<meter>(0.05),
            Ratio::new::<ratio>(0.15),
        )
    }

    fn pedal_input_angle() -> SteeringRatioToAngle<6> {
        const PEDAL_GAIN: f64 = 32.;
        const PEDAL_INPUT: [f64; 6] = [0., 1., 2., 32., 32., 32.];
        const PEDAL_INPUT_MAP: [f64; 6] = [0., 0., 2., 6.4, 6.4, 6.4];

        SteeringRatioToAngle::new(
            Ratio::new::<ratio>(PEDAL_GAIN),
            PEDAL_INPUT,
            PEDAL_INPUT_MAP,
        )
    }

    fn pedal_speed_angle_limiter() -> SteeringAngleLimiter<5> {
        const SPEED_MAP: [f64; 5] = [0., 40., 130., 1500.0, 2800.0];
        const SPEED_COEFF: [f64; 5] = [1., 1., 0., 0., 0.];

        SteeringAngleLimiter::new(SPEED_MAP, SPEED_COEFF)
    }

    fn tiller_input_angle() -> SteeringRatioToAngle<6> {
        const GAIN: f64 = 75.;
        const INPUT: [f64; 6] = [0., 1., 20., 40., 66., 75.];
        const INPUT_MAP: [f64; 6] = [0., 0., 4., 15., 45., 74.];

        SteeringRatioToAngle::new(Ratio::new::<ratio>(GAIN), INPUT, INPUT_MAP)
    }

    fn tiller_speed_angle_limiter() -> SteeringAngleLimiter<5> {
        const SPEED_MAP: [f64; 5] = [0., 20., 70., 1500.0, 2800.0];
        const SPEED_COEFF: [f64; 5] = [1., 1., 0., 0., 0.];

        SteeringAngleLimiter::new(SPEED_MAP, SPEED_COEFF)
    }

    fn is_equal_angle(a1: Angle, a2: Angle) -> bool {
        const EPSILON_DEGREE: f64 = 0.1;

        (a1 - a2).abs() <= Angle::new::<degree>(EPSILON_DEGREE)
    }
}
