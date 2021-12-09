use super::linear_actuator::Actuator;
use crate::shared::{interpolation, low_pass_filter::LowPassFilter, FeedbackPositionPickoffUnit};
use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{
    angle::{degree, radian},
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    pressure::psi,
    ratio::ratio,
    torque::pound_force_inch,
    volume::{cubic_inch, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

use std::time::Duration;

/// Simple hydraulic motor directly driven with a speed.
/// Speed is smoothly rising or lowering to simulate transients states
/// Flow is updated from current motor speed
pub struct FlapSlatHydraulicMotor {
    rpm_id: VariableIdentifier,

    speed: LowPassFilter<AngularVelocity>,
    displacement: Volume,
    current_flow: VolumeRate,

    total_volume_to_actuator: Volume,
    total_volume_returned_to_reservoir: Volume,
}
impl FlapSlatHydraulicMotor {
    // Simulates rpm transients.
    const LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT: Duration = Duration::from_millis(300);

    const MIN_MOTOR_RPM: f64 = 20.;

    // Corrective factor to adjust final flow consumption to tune the model
    const FLOW_CORRECTION_FACTOR: f64 = 0.85;

    fn new(context: &mut InitContext, id: &str, displacement: Volume) -> Self {
        Self {
            rpm_id: context.get_identifier(format!("HYD_{}_MOTOR_RPM", id)),
            speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT,
            ),
            displacement,
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_returned_to_reservoir: Volume::new::<gallon>(0.),
        }
    }

    fn update_speed(&mut self, context: &UpdateContext, speed: AngularVelocity) {
        // Low pass filter to simulate motors spool up and down. Will ease pressure impact on transients
        self.speed.update(context.delta(), speed);

        // Forcing 0 speed at low speed to avoid endless spool down due to low pass filter
        if self.speed.output().get::<revolution_per_minute>() < Self::MIN_MOTOR_RPM
            && self.speed.output().get::<revolution_per_minute>() > -Self::MIN_MOTOR_RPM
        {
            self.speed.reset();
        }
    }

    fn update_flow(&mut self, context: &UpdateContext) {
        self.current_flow = VolumeRate::new::<gallon_per_minute>(
            Self::FLOW_CORRECTION_FACTOR
                * self.speed().get::<revolution_per_minute>().abs()
                * self.displacement.get::<cubic_inch>()
                / 231.,
        );

        self.total_volume_to_actuator += self.current_flow * context.delta_as_time();
        self.total_volume_returned_to_reservoir += self.current_flow * context.delta_as_time();
    }

    fn torque(&self, pressure: Pressure) -> Torque {
        Torque::new::<pound_force_inch>(
            pressure.get::<psi>() * self.displacement.get::<cubic_inch>()
                / (2. * std::f64::consts::PI),
        )
    }

    fn reset_accumulators(&mut self) {
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
        self.total_volume_returned_to_reservoir = Volume::new::<gallon>(0.);
    }

    fn speed(&self) -> AngularVelocity {
        self.speed.output()
    }

    #[cfg(test)]
    fn flow(&self) -> VolumeRate {
        self.current_flow
    }
}
impl Actuator for FlapSlatHydraulicMotor {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }
    fn reservoir_return(&self) -> Volume {
        self.total_volume_returned_to_reservoir
    }
    fn reset_volumes(&mut self) {
        self.total_volume_returned_to_reservoir = Volume::new::<gallon>(0.);
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
    }
}
impl SimulationElement for FlapSlatHydraulicMotor {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.rpm_id, self.speed().get::<revolution_per_minute>());
    }
}

pub struct FlapSlatAssembly {
    position_left_percent_id: VariableIdentifier,
    position_right_percent_id: VariableIdentifier,
    angle_left_id: VariableIdentifier,
    angle_right_id: VariableIdentifier,
    is_moving_id: VariableIdentifier,

    flap_control_arm_position: Angle,

    max_synchro_gear_position: Angle,
    final_requested_synchro_gear_position: Angle,

    speed: AngularVelocity,
    current_max_speed: LowPassFilter<AngularVelocity>,
    full_pressure_max_speed: AngularVelocity,

    gearbox_ratio: Ratio,
    flap_to_synchro_gear_ratio: Ratio,
    flap_gear_ratio: Ratio,

    left_motor: FlapSlatHydraulicMotor,
    right_motor: FlapSlatHydraulicMotor,

    synchro_gear_breakpoints: [f64; 12],
    final_flap_angle_carac: [f64; 12],
}
impl FlapSlatAssembly {
    const LOW_PASS_FILTER_FLAP_POSITION_TRANSIENT_TIME_CONSTANT: Duration =
        Duration::from_millis(300);
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;
    const MAX_CIRCUIT_PRESSURE_PSI: f64 = 3000.;
    const ANGLE_THRESHOLD_FOR_REDUCED_SPEED_DEGREES: f64 = 6.69;
    const ANGULAR_SPEED_LIMIT_FACTOR_WHEN_APROACHING_POSITION: f64 = 0.5;
    const MIN_TOTAL_MOTOR_RPM_TO_REPORT_MOVING: f64 = 20.;

    pub fn new(
        context: &mut InitContext,
        id: &str,
        motor_displacement: Volume,
        full_pressure_max_speed: AngularVelocity,
        max_synchro_gear_position: Angle,
        synchro_gear_ratio: Ratio,
        gearbox_ratio: Ratio,
        flap_gear_ratio: Ratio,
        synchro_gear_breakpoints: [f64; 12],
        final_flap_angle_carac: [f64; 12],
    ) -> Self {
        let left_motor = FlapSlatHydraulicMotor::new(
            context,
            format!("LEFT_{}", id).as_str(),
            motor_displacement,
        );

        let right_motor = FlapSlatHydraulicMotor::new(
            context,
            format!("RIGHT_{}", id).as_str(),
            motor_displacement,
        );

        Self {
            position_left_percent_id: context
                .get_identifier(format!("LEFT_{}_POSITION_PERCENT", id)),
            position_right_percent_id: context
                .get_identifier(format!("RIGHT_{}_POSITION_PERCENT", id)),

            angle_left_id: context.get_identifier(format!("LEFT_{}_ANGLE", id)),
            angle_right_id: context.get_identifier(format!("RIGHT_{}_ANGLE", id)),

            is_moving_id: context.get_identifier(format!("IS_{}_MOVING", id)),

            flap_control_arm_position: Angle::new::<radian>(0.),
            max_synchro_gear_position,
            final_requested_synchro_gear_position: Angle::new::<radian>(0.),
            speed: AngularVelocity::new::<radian_per_second>(0.),
            current_max_speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_FILTER_FLAP_POSITION_TRANSIENT_TIME_CONSTANT,
            ),
            full_pressure_max_speed,
            gearbox_ratio,
            flap_to_synchro_gear_ratio: flap_gear_ratio / synchro_gear_ratio,
            flap_gear_ratio,
            left_motor,
            right_motor,
            synchro_gear_breakpoints,
            final_flap_angle_carac,
        }
    }

    fn synchro_angle_to_flap_angle(&self, synchro_gear_angle: Angle) -> Angle {
        synchro_gear_angle / self.flap_to_synchro_gear_ratio.get::<ratio>()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        sfcc1_flap_position_request: Option<Angle>,
        sfcc2_flap_position_request: Option<Angle>,
        left_pressure: Pressure,
        right_pressure: Pressure,
    ) {
        self.update_final_ffpu_angle_request(
            sfcc1_flap_position_request,
            sfcc2_flap_position_request,
        );

        self.update_current_max_speed(
            sfcc1_flap_position_request.is_some(),
            sfcc2_flap_position_request.is_some(),
            left_pressure,
            right_pressure,
            context,
        );

        self.update_speed_and_position(context);

        self.update_motor_speed_and_flows(left_pressure, right_pressure, context);
    }

    fn update_speed_and_position(&mut self, context: &UpdateContext) {
        if self.final_requested_synchro_gear_position > self.position_feedback() {
            self.flap_control_arm_position += Angle::new::<radian>(
                self.max_speed().get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.speed = self.max_speed();
        } else if self.final_requested_synchro_gear_position < self.position_feedback() {
            self.flap_control_arm_position -= Angle::new::<radian>(
                self.max_speed().get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.speed = -self.max_speed();
        } else {
            self.speed = AngularVelocity::new::<radian_per_second>(0.);
        }

        if self.speed > AngularVelocity::new::<radian_per_second>(0.)
            && self.final_requested_synchro_gear_position < self.position_feedback()
            || self.speed < AngularVelocity::new::<radian_per_second>(0.)
                && self.final_requested_synchro_gear_position > self.position_feedback()
        {
            self.flap_control_arm_position =
                self.synchro_angle_to_flap_angle(self.final_requested_synchro_gear_position);
        }

        self.flap_control_arm_position = self
            .flap_control_arm_position
            .max(Angle::new::<radian>(0.))
            .min(self.synchro_angle_to_flap_angle(self.max_synchro_gear_position));
    }

    fn update_final_ffpu_angle_request(
        &mut self,
        sfcc1_angle_request: Option<Angle>,
        sfcc2_angle_request: Option<Angle>,
    ) {
        if let Some(sfcc1_angle) = sfcc1_angle_request {
            self.final_requested_synchro_gear_position =
                self.feedback_angle_from_flap_surface_angle(sfcc1_angle);
        } else if let Some(sfcc2_angle) = sfcc2_angle_request {
            self.final_requested_synchro_gear_position =
                self.feedback_angle_from_flap_surface_angle(sfcc2_angle);
        }
    }

    fn update_current_max_speed(
        &mut self,
        sfcc1_is_active: bool,
        sfcc2_is_active: bool,
        left_pressure: Pressure,
        right_pressure: Pressure,
        context: &UpdateContext,
    ) {
        // Final pressures are the current pressure or 0 if corresponding sfcc is offline
        // This simulates a motor not responding to a failed or offline sfcc
        let mut final_left_pressure = left_pressure;
        if !sfcc1_is_active {
            final_left_pressure = Pressure::new::<psi>(0.);
        }

        let mut final_right_pressure = right_pressure;
        if !sfcc2_is_active {
            final_right_pressure = Pressure::new::<psi>(0.);
        }

        let new_theoretical_max_speed_left_side = AngularVelocity::new::<radian_per_second>(
            0.5 * self.full_pressure_max_speed.get::<radian_per_second>()
                * Self::max_speed_factor_from_pressure(final_left_pressure),
        );

        let new_theoretical_max_speed_right_side = AngularVelocity::new::<radian_per_second>(
            0.5 * self.full_pressure_max_speed.get::<radian_per_second>()
                * Self::max_speed_factor_from_pressure(final_right_pressure),
        );

        let mut new_theoretical_max_speed =
            new_theoretical_max_speed_left_side + new_theoretical_max_speed_right_side;

        if self.is_approaching_requested_position(self.final_requested_synchro_gear_position) {
            new_theoretical_max_speed *= Self::ANGULAR_SPEED_LIMIT_FACTOR_WHEN_APROACHING_POSITION;
        }

        // Final max speed filtered to simulate smooth movements
        self.current_max_speed
            .update(context.delta(), new_theoretical_max_speed);
    }

    fn max_speed_factor_from_pressure(current_pressure: Pressure) -> f64 {
        let press_corrected =
            current_pressure.get::<psi>() - Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI;
        if current_pressure > Pressure::new::<psi>(Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI) {
            (0.0006 * (press_corrected * press_corrected)
                / (Self::MAX_CIRCUIT_PRESSURE_PSI - Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI))
                .min(1.)
                .max(0.)
        } else {
            0.
        }
    }

    fn update_motor_speed_and_flows(
        &mut self,
        left_pressure: Pressure,
        right_pressure: Pressure,
        context: &UpdateContext,
    ) {
        let torque_shaft_speed = AngularVelocity::new::<radian_per_second>(
            self.speed.get::<radian_per_second>() * self.flap_gear_ratio.get::<ratio>(),
        );

        let left_torque =
            if left_pressure.get::<psi>() < Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI {
                Torque::new::<pound_force_inch>(0.)
            } else {
                self.left_motor.torque(left_pressure)
            };

        let right_torque =
            if right_pressure.get::<psi>() < Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI {
                Torque::new::<pound_force_inch>(0.)
            } else {
                self.right_motor.torque(right_pressure)
            };

        let total_motor_torque = left_torque + right_torque;

        let mut left_torque_ratio = Ratio::new::<ratio>(0.);
        let mut right_torque_ratio = Ratio::new::<ratio>(0.);

        if total_motor_torque.get::<pound_force_inch>() > 0.001 {
            left_torque_ratio = left_torque / total_motor_torque;
            right_torque_ratio = right_torque / total_motor_torque;
        }

        self.left_motor.update_speed(
            context,
            AngularVelocity::new::<radian_per_second>(
                torque_shaft_speed.get::<radian_per_second>()
                    * left_torque_ratio.get::<ratio>()
                    * self.gearbox_ratio.get::<ratio>(),
            ),
        );
        self.left_motor.update_flow(context);

        self.right_motor.update_speed(
            context,
            AngularVelocity::new::<radian_per_second>(
                torque_shaft_speed.get::<radian_per_second>()
                    * right_torque_ratio.get::<ratio>()
                    * self.gearbox_ratio.get::<ratio>(),
            ),
        );
        self.right_motor.update_flow(context);
    }

    fn is_approaching_requested_position(&self, synchro_gear_angle_request: Angle) -> bool {
        self.speed.get::<radian_per_second>() > 0.
            && synchro_gear_angle_request - self.position_feedback()
                < Angle::new::<degree>(Self::ANGLE_THRESHOLD_FOR_REDUCED_SPEED_DEGREES)
            || self.speed.get::<radian_per_second>() < 0.
                && self.position_feedback() - synchro_gear_angle_request
                    < Angle::new::<degree>(Self::ANGLE_THRESHOLD_FOR_REDUCED_SPEED_DEGREES)
    }

    pub fn position_feedback(&self) -> Angle {
        self.flap_control_arm_position * self.flap_to_synchro_gear_ratio.get::<ratio>()
    }

    pub fn left_motor(&mut self) -> &mut impl Actuator {
        &mut self.left_motor
    }

    pub fn right_motor(&mut self) -> &mut impl Actuator {
        &mut self.right_motor
    }

    pub fn left_motor_rpm(&self) -> f64 {
        self.left_motor.speed().get::<revolution_per_minute>()
    }

    pub fn right_motor_rpm(&self) -> f64 {
        self.right_motor.speed().get::<revolution_per_minute>()
    }

    pub fn max_speed(&self) -> AngularVelocity {
        self.current_max_speed.output()
    }

    /// Gets flap surface angle from current Feedback Position Pickup Unit (FPPU) position
    fn flap_surface_angle(&self) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.synchro_gear_breakpoints,
            &self.final_flap_angle_carac,
            self.position_feedback().get::<degree>(),
        ))
    }

    /// Gets Feedback Position Pickup Unit (FPPU) position from current flap surface angle
    fn feedback_angle_from_flap_surface_angle(&self, flap_surface_angle: Angle) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.final_flap_angle_carac,
            &self.synchro_gear_breakpoints,
            flap_surface_angle.get::<degree>(),
        ))
    }

    // Reset of accumulators will be moved to Actuator trait in other hydraulic overhaul PR
    pub fn reset_left_accumulators(&mut self) {
        self.left_motor.reset_accumulators();
    }

    pub fn reset_right_accumulators(&mut self) {
        self.right_motor.reset_accumulators();
    }

    fn is_surface_moving(&self) -> bool {
        self.left_motor_rpm() + self.right_motor_rpm() > Self::MIN_TOTAL_MOTOR_RPM_TO_REPORT_MOVING
    }
}
impl SimulationElement for FlapSlatAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.left_motor.accept(visitor);
        self.right_motor.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.position_left_percent_id,
            self.position_feedback().get::<degree>()
                / self.max_synchro_gear_position.get::<degree>()
                * 100.,
        );
        writer.write(
            &self.position_right_percent_id,
            self.position_feedback().get::<degree>()
                / self.max_synchro_gear_position.get::<degree>()
                * 100.,
        );

        let flaps_surface_angle = self.flap_surface_angle();
        writer.write(&self.angle_left_id, flaps_surface_angle.get::<degree>());
        writer.write(&self.angle_right_id, flaps_surface_angle.get::<degree>());

        writer.write(&self.is_moving_id, self.is_surface_moving());
    }
}
impl FeedbackPositionPickoffUnit for FlapSlatAssembly {
    fn angle(&self) -> Angle {
        self.position_feedback()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::angle::degree;

    use uom::si::pressure::psi;

    use crate::hydraulic::update_iterator::FixedStepLoop;

    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext};

    use crate::simulation::test::{SimulationTestBed, TestBed};

    struct TestAircraft {
        core_hydraulic_updater: FixedStepLoop,

        flaps_slats: FlapSlatAssembly,

        left_motor_angle_request: Option<Angle>,
        right_motor_angle_request: Option<Angle>,

        left_motor_pressure: Pressure,
        right_motor_pressure: Pressure,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext, max_speed: AngularVelocity) -> Self {
            Self {
                core_hydraulic_updater: FixedStepLoop::new(Duration::from_millis(33)),
                flaps_slats: flap_system(context, max_speed),
                left_motor_angle_request: None,
                right_motor_angle_request: None,
                left_motor_pressure: Pressure::new::<psi>(0.),
                right_motor_pressure: Pressure::new::<psi>(0.),
            }
        }

        fn set_current_pressure(
            &mut self,
            left_motor_pressure: Pressure,
            right_motor_pressure: Pressure,
        ) {
            self.left_motor_pressure = left_motor_pressure;
            self.right_motor_pressure = right_motor_pressure;
        }

        fn set_angle_request(&mut self, angle_request: Option<Angle>) {
            self.left_motor_angle_request = angle_request;
            self.right_motor_angle_request = angle_request;
        }

        fn set_angle_per_sfcc(
            &mut self,
            angle_request_sfcc1: Option<Angle>,
            angle_request_sfcc2: Option<Angle>,
        ) {
            self.left_motor_angle_request = angle_request_sfcc1;
            self.right_motor_angle_request = angle_request_sfcc2;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.core_hydraulic_updater.update(context);

            for cur_time_step in &mut self.core_hydraulic_updater {
                self.flaps_slats.update(
                    &context.with_delta(cur_time_step),
                    self.left_motor_angle_request,
                    self.right_motor_angle_request,
                    self.left_motor_pressure,
                    self.right_motor_pressure,
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.flaps_slats.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn flap_slat_assembly_init() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .left_motor
                .speed()
                .get::<revolution_per_minute>())
                == 0.
        );
        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .right_motor
                .speed()
                .get::<revolution_per_minute>())
                == 0.
        );
        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .left_motor
                .current_flow
                .get::<gallon_per_minute>())
                == 0.
        );
        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .right_motor
                .current_flow
                .get::<gallon_per_minute>())
                == 0.
        );
        assert!(test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()) == 0.);
    }

    #[test]
    fn flap_slat_assembly_full_pressure() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        assert!(test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()) == 0.);
        assert!(test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()) == 0.);

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(2000));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.left_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.right_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(3.)
                && test_bed.query(|a| a.flaps_slats.left_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(3.)
                && test_bed.query(|a| a.flaps_slats.right_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_full_pressure_reverse_direction_has_negative_motor_speeds() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(20000));

        assert!(
            test_bed.query(|a| a.flaps_slats.speed)
                == AngularVelocity::new::<radian_per_second>(0.)
        );

        // Now testing reverse movement parameters
        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(-20.))));
        test_bed.run_with_delta(Duration::from_millis(1500));

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                <= AngularVelocity::new::<revolution_per_minute>(-2000.)
                && test_bed.query(|a| a.flaps_slats.left_motor.speed())
                    >= AngularVelocity::new::<revolution_per_minute>(-6000.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                <= AngularVelocity::new::<revolution_per_minute>(-2000.)
                && test_bed.query(|a| a.flaps_slats.right_motor.speed())
                    >= AngularVelocity::new::<revolution_per_minute>(-6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(3.)
                && test_bed.query(|a| a.flaps_slats.left_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(3.)
                && test_bed.query(|a| a.flaps_slats.right_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_right() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(0.),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(1500));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                == AngularVelocity::new::<revolution_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.right_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                == VolumeRate::new::<gallon_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(3.)
                && test_bed.query(|a| a.flaps_slats.right_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_left() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(0.),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(1500));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                == AngularVelocity::new::<revolution_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.left_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                == VolumeRate::new::<gallon_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(3.)
                && test_bed.query(|a| a.flaps_slats.left_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_goes_to_req_position() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(35000));

        let synchro_gear_angle_request = test_bed.query(|a| {
            a.flaps_slats
                .feedback_angle_from_flap_surface_angle(flap_position_request)
        });

        assert!(
            test_bed.query(|a| a.flaps_slats.position_feedback()) == synchro_gear_angle_request
        );
    }

    #[test]
    fn flap_slat_assembly_goes_back_from_max_position() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        for _ in 0..300 {
            test_bed.run_multiple_frames(Duration::from_millis(50));

            assert!(
                test_bed.query(|a| a.flaps_slats.position_feedback())
                    <= test_bed.query(|a| a.flaps_slats.max_synchro_gear_position)
            );

            println!(
                "Position {:.2}-> Motor speed {:.0}",
                test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()),
                test_bed.query(|a| a
                    .flaps_slats
                    .left_motor
                    .speed()
                    .get::<revolution_per_minute>())
            );
        }

        assert!(
            test_bed.query(|a| a.flaps_slats.position_feedback())
                == test_bed.query(|a| a.flaps_slats.max_synchro_gear_position)
        );

        let flap_position_request = Angle::new::<degree>(-8.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));

        for _ in 0..300 {
            test_bed.run_multiple_frames(Duration::from_millis(50));

            assert!(
                test_bed.query(|a| a.flaps_slats.position_feedback())
                    <= test_bed.query(|a| a.flaps_slats.max_synchro_gear_position)
            );
            assert!(
                test_bed.query(|a| a.flaps_slats.position_feedback()) >= Angle::new::<degree>(0.)
            );

            println!(
                "Position {:.2}-> Motor speed {:.0}",
                test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()),
                test_bed.query(|a| a
                    .flaps_slats
                    .left_motor
                    .speed()
                    .get::<revolution_per_minute>())
            );
        }

        assert!(test_bed.query(|a| a.flaps_slats.position_feedback()) == Angle::new::<degree>(0.));
    }

    #[test]
    fn flap_slat_assembly_stops_at_max_position_at_half_speed_with_one_sfcc() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed.command(|a| a.set_angle_per_sfcc(None, Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(1000));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        test_bed.run_multiple_frames(Duration::from_millis(40000));

        assert!(
            test_bed.query(|a| a.flaps_slats.position_feedback())
                == test_bed.query(|a| a.flaps_slats.max_synchro_gear_position)
        );
    }

    #[test]
    fn flap_slat_assembly_stops_if_no_sfcc() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(5000));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        test_bed.command(|a| a.set_angle_request(None));

        test_bed.run_multiple_frames(Duration::from_millis(5000));
        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!((current_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01));
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_extending() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(10.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        let mut flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
        for _ in 0..150 {
            test_bed.run_with_delta(Duration::from_millis(100));

            let current_flap_angle = test_bed.query(|a| a.flaps_slats.flap_surface_angle());

            if (current_flap_angle - flap_position_request)
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(test_bed.query(|a| a.flaps_slats.speed) < flap_speed_snapshot)
            } else {
                flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
            }

            println!(
                "Speed {:.2}-> Surface angle {:.2}",
                test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()),
                test_bed.query(|a| a.flaps_slats.flap_surface_angle().get::<degree>())
            );
        }
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_retracting() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(30.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(30000));

        test_bed.command(|a| {
            a.set_angle_request(Some(flap_position_request - Angle::new::<degree>(10.)))
        });

        let mut flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);

        for _ in 0..150 {
            test_bed.run_with_delta(Duration::from_millis(100));

            let current_flap_angle = test_bed.query(|a| a.flaps_slats.flap_surface_angle());

            if (current_flap_angle - flap_position_request)
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(test_bed.query(|a| a.flaps_slats.speed) < flap_speed_snapshot)
            } else {
                flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
            }

            println!(
                "Speed {:.2}-> Surface angle {:.2}",
                test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()),
                test_bed.query(|a| a.flaps_slats.flap_surface_angle().get::<degree>())
            );
        }
    }

    fn flap_system(context: &mut InitContext, max_speed: AngularVelocity) -> FlapSlatAssembly {
        FlapSlatAssembly::new(
            context,
            "FLAPS",
            Volume::new::<cubic_inch>(0.32),
            max_speed,
            Angle::new::<degree>(251.97),
            Ratio::new::<ratio>(140.),
            Ratio::new::<ratio>(16.632),
            Ratio::new::<ratio>(314.98),
            [
                0., 65., 115., 120.53, 136., 145.5, 152., 165., 168.3, 179., 231.2, 251.97,
            ],
            [
                0., 10.318, 18.2561, 19.134, 21.59, 23.098, 24.13, 26.196, 26.72, 28.42, 36.703,
                40.,
            ],
        )
    }
}
