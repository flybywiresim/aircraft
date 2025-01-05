use crate::hydraulic::linear_actuator::Actuator;
use crate::shared::Clamp;
use crate::shared::{interpolation, low_pass_filter::LowPassFilter, SectionPressure};
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

use super::bypass_pin::BypassPin;

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

    nominal_speed: AngularVelocity,

    angular_to_linear_ratio: Ratio,

    total_volume_to_actuator: Volume,
    total_volume_to_reservoir: Volume,

    actuator_area: Area,

    reference_pressure_for_max_speed: Pressure,

    is_steered_by_tug: bool,
}
impl SteeringActuator {
    const MIN_PRESSURE_ALLOWING_STEERING_PSI: f64 = 300.;

    const CURRENT_SPEED_FILTER_TIMECONST: Duration = Duration::from_millis(150);

    // Adjusts how the steering slows down with position error
    // Formula is speed_coefficient = POSITION_ERROR_TO_MAX_SPEED_GAIN * position_error^2
    // Then max speed will be max_speed = nominal_speed * speed_coefficient
    // Note this is open loop: it will overshoot or undershoot depending on this factor
    const POSITION_ERROR_TO_MAX_SPEED_GAIN: f64 = 0.18;

    pub fn new(
        context: &mut InitContext,
        wheel_id: &str,
        max_half_angle: Angle,
        nominal_speed: AngularVelocity,
        actuator_diameter: Length,
        angular_to_linear_ratio: Ratio,
        reference_pressure_for_max_speed: Pressure,
        is_steered_by_tug: bool,
    ) -> Self {
        Self {
            position_id: context.get_identifier(format!("{}_POSITION_RATIO", wheel_id)),

            current_speed: LowPassFilter::<AngularVelocity>::new(
                Self::CURRENT_SPEED_FILTER_TIMECONST,
            ),
            current_position: Angle::new::<radian>(0.),

            max_half_angle,

            nominal_speed,
            angular_to_linear_ratio,

            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_to_reservoir: Volume::new::<gallon>(0.),

            actuator_area: std::f64::consts::PI
                * (actuator_diameter / 2.)
                * (actuator_diameter / 2.),

            reference_pressure_for_max_speed,

            is_steered_by_tug,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        section_pressure: &impl SectionPressure,
        steering_controller: &impl SteeringController,
        pushback_tug: &impl Pushback,
        bypass_pin: &BypassPin,
    ) {
        if !bypass_pin.is_nose_wheel_steering_pin_inserted() || !self.is_steered_by_tug {
            let limited_requested_angle = steering_controller
                .requested_position()
                .clamp(-self.max_half_angle, self.max_half_angle);

            self.update_current_speed(context, section_pressure, limited_requested_angle);

            self.update_final_speed_position(context);
        } else {
            self.update_speed_position_during_pushback(pushback_tug);
        }

        self.update_flow(context, bypass_pin);
    }

    fn update_final_speed_position(&mut self, context: &UpdateContext) {
        self.current_position += Angle::new::<radian>(
            self.current_speed.output().get::<radian_per_second>() * context.delta_as_secs_f64(),
        );
    }

    fn update_speed_position_during_pushback(&mut self, pushback_tug: &impl Pushback) {
        self.current_speed
            .reset(AngularVelocity::new::<radian_per_second>(0.));
        self.current_position = pushback_tug.steering_angle();
    }

    fn update_current_speed(
        &mut self,
        context: &UpdateContext,
        section_pressure: &impl SectionPressure,
        requested_angle: Angle,
    ) {
        let current_pressure = section_pressure.pressure_downstream_priority_valve();

        let max_speed_for_current_hydraulics_pressure =
            self.max_speed_for_current_hydraulics_pressure(context, current_pressure);

        let max_speed_closing_to_requested_position =
            self.max_speed_for_position_error(requested_angle);

        // Final speed is the max allowed by hydraulic power, potentially diminished by the closing position factor
        let final_absolute_speed =
            max_speed_for_current_hydraulics_pressure.min(max_speed_closing_to_requested_position);

        self.current_speed.update(
            context.delta(),
            if requested_angle > self.position_feedback() {
                final_absolute_speed
            } else {
                -final_absolute_speed
            },
        );
    }

    fn max_speed_for_current_hydraulics_pressure(
        &self,
        context: &UpdateContext,
        current_pressure: Pressure,
    ) -> AngularVelocity {
        (if current_pressure.get::<psi>() > Self::MIN_PRESSURE_ALLOWING_STEERING_PSI {
            self.nominal_speed * current_pressure.get::<psi>().sqrt()
                / self.reference_pressure_for_max_speed.get::<psi>().sqrt()
        } else {
            (0.04 * context.ground_speed().get::<knot>().abs().sqrt()).clamp(0., 1.)
                * self.nominal_speed
        })
        .min(self.nominal_speed)
    }

    fn max_speed_for_position_error(&self, requested_angle: Angle) -> AngularVelocity {
        let position_error_abs = (requested_angle - self.position_feedback()).abs();

        // When closing to requested position, speed decreases using coefficient formula
        //   This yields a 0..1 coefficient that reduces the nominal max speed
        let slowing_coefficient = (Self::POSITION_ERROR_TO_MAX_SPEED_GAIN
            * position_error_abs.get::<degree>().powi(2))
        .min(1.);

        self.nominal_speed * slowing_coefficient
    }

    fn update_flow(&mut self, context: &UpdateContext, bypass_pin: &BypassPin) {
        if !bypass_pin.is_nose_wheel_steering_pin_inserted() {
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

    use crate::simulation::test::{ReadByName, SimulationTestBed, TestBed, WriteByName};
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

    #[derive(Default)]
    struct TestHydraulicSection {
        pressure: Pressure,
    }
    impl TestHydraulicSection {
        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure = pressure;
        }
    }
    impl SectionPressure for TestHydraulicSection {
        fn pressure(&self) -> Pressure {
            self.pressure
        }

        fn pressure_downstream_leak_valve(&self) -> Pressure {
            self.pressure
        }

        fn pressure_downstream_priority_valve(&self) -> Pressure {
            self.pressure
        }

        fn is_pressure_switch_pressurised(&self) -> bool {
            self.pressure.get::<psi>() > 1700.
        }
    }

    struct TestAircraft {
        steering_actuator: SteeringActuator,

        controller: TestSteeringController,

        pressure: TestHydraulicSection,

        pushback: TestPushBack,

        bypass_pin: BypassPin,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                steering_actuator: steering_actuator(context),

                controller: TestSteeringController::new(),

                pressure: TestHydraulicSection::default(),

                pushback: TestPushBack::new(),

                bypass_pin: BypassPin::new(context),
            }
        }

        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure.set_pressure(pressure);
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
            self.bypass_pin.update(&self.pushback);

            self.steering_actuator.update(
                context,
                &self.pressure,
                &self.controller,
                &self.pushback,
                &self.bypass_pin,
            );

            println!(
                "Steering feedback {:.3} deg, Norm pos {:.1}, Speed {:.3} rad/s, Target {:.1} deg , Pressure {:.0}",
                self.steering_actuator.position_feedback().get::<degree>(),
                self.steering_actuator.position_normalized().get::<ratio>(),
                self.steering_actuator
                    .current_speed
                    .output().get::<radian_per_second>(),
                self.controller.requested_position().get::<degree>(),
                self.pressure.pressure(). get::<psi>()
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.bypass_pin.accept(visitor);
            self.steering_actuator.accept(visitor);
            visitor.visit(self);
        }
    }

    #[test]
    fn writes_its_states() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("NOSE_WHEEL_POSITION_RATIO"));
    }

    #[test]
    fn init_with_zero_angle() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(90.)));

        test_bed.run_multiple_frames(Duration::from_secs(5));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(75.)
        ));

        assert!(
            test_bed.query(|a| a.steering_actuator.position_normalized())
                >= Ratio::new::<ratio>(0.98)
        );

        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(-90.)));
        test_bed.run_multiple_frames(Duration::from_secs(10));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(-75.)
        ));

        assert!(
            test_bed.query(|a| a.steering_actuator.position_normalized())
                <= Ratio::new::<ratio>(-0.98)
        );
    }

    #[test]
    fn steering_stops_at_target_position() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(20.)));

        test_bed.run_multiple_frames(Duration::from_secs(5));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(20.)
        ));
    }

    #[test]
    fn steering_direction_change_is_smooth() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

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

    #[test]
    fn steering_returns_neutral_if_ground_speed_but_no_hydraulics() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(20.)));

        test_bed.run_multiple_frames(Duration::from_secs(5));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(20.)
        ));

        test_bed.command(|a| a.set_pressure(Pressure::new::<psi>(0.)));
        test_bed.command(|a| a.command_steer_angle(Angle::new::<degree>(0.)));

        test_bed.run_multiple_frames(Duration::from_secs(5));

        assert!(is_equal_angle(
            test_bed.query(|a| a.steering_actuator.position_feedback()),
            Angle::new::<degree>(20.)
        ));

        test_bed.write_by_name("GPS GROUND SPEED", 20.);

        test_bed.run_multiple_frames(Duration::from_secs(8));

        assert!(
            test_bed
                .query(|a| a.steering_actuator.position_feedback())
                .abs()
                < Angle::new::<degree>(0.1)
        );
    }

    fn steering_actuator(context: &mut InitContext) -> SteeringActuator {
        SteeringActuator::new(
            context,
            "NOSE_WHEEL",
            Angle::new::<degree>(75.),
            AngularVelocity::new::<radian_per_second>(0.35),
            Length::new::<meter>(0.05),
            Ratio::new::<ratio>(0.15),
            Pressure::new::<psi>(2000.),
            true,
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
        const EPSILON_DEGREE: f64 = 1.;

        (a1 - a2).abs() <= Angle::new::<degree>(EPSILON_DEGREE)
    }
}
