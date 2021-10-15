use super::linear_actuator::Actuator;
use crate::shared::{interpolation, FeedbackPositionPickoffUnit};
use crate::simulation::{
    SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
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

/// Simple hydraulic motor directly driven with a speed.
/// Speed is smoothly rising or lowering to simulate transients states
/// Flow is updated from current motor speed
pub struct FlapSlatHydraulicMotor {
    rpm_id: String,

    speed: AngularVelocity,
    displacement: Volume,
    current_flow: VolumeRate,

    total_volume_to_actuator: Volume,
    total_volume_returned_to_reservoir: Volume,
}
impl FlapSlatHydraulicMotor {
    // Simulates rpm transients.
    const LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT_S: f64 = 0.3;

    // Corrective factor to adjust final flow consumption to tune the model
    const FLOW_CORRECTION_FACTOR: f64 = 0.9;

    fn new(id: &str, displacement: Volume) -> Self {
        Self {
            rpm_id: format!("HYD_{}_MOTOR_RPM", id),
            speed: AngularVelocity::new::<radian_per_second>(0.),
            displacement,
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_returned_to_reservoir: Volume::new::<gallon>(0.),
        }
    }

    fn update_speed_and_flow(&mut self, speed: AngularVelocity, context: &UpdateContext) {
        // Low pass filter to simulate motors spool up and down. Will ease pressure impact on transients
        self.speed = self.speed
            + (speed - self.speed)
                * (1.
                    - std::f64::consts::E.powf(
                        -context.delta_as_secs_f64() / Self::LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT_S,
                    ));

        // Forcing 0 speed at low speed to avoid endless spool down due to low pass filter
        if self.speed.get::<revolution_per_minute>() < 20.
            && self.speed.get::<revolution_per_minute>() > -20.
        {
            self.speed = AngularVelocity::new::<revolution_per_minute>(0.);
        }

        self.current_flow = VolumeRate::new::<gallon_per_minute>(
            Self::FLOW_CORRECTION_FACTOR
                * self.speed.get::<revolution_per_minute>().abs()
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
        writer.write(&self.rpm_id, self.speed.get::<revolution_per_minute>());
    }
}

pub struct FlapSlatAssembly {
    position_left_percent_id: String,
    position_right_percent_id: String,
    angle_left_id: String,
    angle_right_id: String,

    flap_control_arm_position: Angle,

    max_synchro_gear_position: Angle,
    final_requested_synchro_gear_position: Angle,

    current_speed: AngularVelocity,
    current_max_speed: AngularVelocity,
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
    const LOW_PASS_FILTER_FLAP_POSITION_TRANSIENT_TIME_CONSTANT_S: f64 = 0.3;
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;
    const MAX_CIRCUIT_PRESSURE_PSI: f64 = 3000.;
    const ANGLE_THRESHOLD_FOR_REDUCED_SPEED_DEGREES: f64 = 6.69;
    const ANGULAR_SPEED_LIMIT_FACTOR_WHEN_APROACHING_POSITION: f64 = 0.5;

    pub fn new(
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
        Self {
            position_left_percent_id: format!("LEFT_{}_POSITION_PERCENT", id),
            position_right_percent_id: format!("RIGHT_{}_POSITION_PERCENT", id),
            angle_left_id: format!("LEFT_{}_ANGLE", id),
            angle_right_id: format!("RIGHT_{}_ANGLE", id),
            flap_control_arm_position: Angle::new::<radian>(0.),
            max_synchro_gear_position,
            final_requested_synchro_gear_position: Angle::new::<radian>(0.),
            current_speed: AngularVelocity::new::<radian_per_second>(0.),
            current_max_speed: AngularVelocity::new::<radian_per_second>(0.),
            full_pressure_max_speed,
            gearbox_ratio,
            flap_to_synchro_gear_ratio: flap_gear_ratio / synchro_gear_ratio,
            flap_gear_ratio,
            left_motor: FlapSlatHydraulicMotor::new(
                format!("LEFT_{}", id).as_str(),
                motor_displacement,
            ),
            right_motor: FlapSlatHydraulicMotor::new(
                format!("RIGHT_{}", id).as_str(),
                motor_displacement,
            ),
            synchro_gear_breakpoints,
            final_flap_angle_carac,
        }
    }

    fn synchro_angle_to_flap_angle(&self, synchro_gear_angle: Angle) -> Angle {
        synchro_gear_angle / self.flap_to_synchro_gear_ratio.get::<ratio>()
    }

    pub fn update(
        &mut self,
        sfcc1_flap_position_request: Option<Angle>,
        sfcc2_flap_position_request: Option<Angle>,
        left_pressure: Pressure,
        right_pressure: Pressure,
        context: &UpdateContext,
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
                self.current_max_speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.current_speed = self.current_max_speed;
        } else if self.final_requested_synchro_gear_position < self.position_feedback() {
            self.flap_control_arm_position -= Angle::new::<radian>(
                self.current_max_speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.current_speed = -self.current_max_speed;
        } else {
            self.current_speed = AngularVelocity::new::<radian_per_second>(0.);
        }

        if self.current_speed > AngularVelocity::new::<radian_per_second>(0.)
            && self.final_requested_synchro_gear_position < self.position_feedback()
            || self.current_speed < AngularVelocity::new::<radian_per_second>(0.)
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
        if sfcc1_angle_request.is_some() {
            self.final_requested_synchro_gear_position =
                self.feedback_angle_from_flap_surface_angle(sfcc1_angle_request.unwrap());
        } else if sfcc2_angle_request.is_some() {
            self.final_requested_synchro_gear_position =
                self.feedback_angle_from_flap_surface_angle(sfcc2_angle_request.unwrap());
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

        //new_theoretical_max_speed = new_theoretical_max_speed.min(self.full_pressure_max_speed);

        if self.is_approaching_requested_position(self.final_requested_synchro_gear_position) {
            new_theoretical_max_speed *= Self::ANGULAR_SPEED_LIMIT_FACTOR_WHEN_APROACHING_POSITION;
        }

        // Final max speed filtered to simulate smooth movements
        self.current_max_speed = self.current_max_speed
            + (new_theoretical_max_speed - self.current_max_speed)
                * (1.
                    - std::f64::consts::E.powf(
                        -context.delta_as_secs_f64()
                            / Self::LOW_PASS_FILTER_FLAP_POSITION_TRANSIENT_TIME_CONSTANT_S,
                    ));
    }

    fn max_speed_factor_from_pressure(current_pressure: Pressure) -> f64 {
        let press_corrected =
            current_pressure.get::<psi>() - Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI;
        if current_pressure > Pressure::new::<psi>(Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI) {
            (0.00045 * (press_corrected * press_corrected)
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
            self.current_speed.get::<radian_per_second>() * self.flap_gear_ratio.get::<ratio>(),
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

        self.left_motor.update_speed_and_flow(
            AngularVelocity::new::<radian_per_second>(
                torque_shaft_speed.get::<radian_per_second>()
                    * left_torque_ratio.get::<ratio>()
                    * self.gearbox_ratio.get::<ratio>(),
            ),
            context,
        );
        self.right_motor.update_speed_and_flow(
            AngularVelocity::new::<radian_per_second>(
                torque_shaft_speed.get::<radian_per_second>()
                    * right_torque_ratio.get::<ratio>()
                    * self.gearbox_ratio.get::<ratio>(),
            ),
            context,
        );
    }

    fn is_approaching_requested_position(&self, synchro_gear_angle_request: Angle) -> bool {
        self.current_speed.get::<radian_per_second>() > 0.
            && synchro_gear_angle_request - self.position_feedback()
                < Angle::new::<degree>(Self::ANGLE_THRESHOLD_FOR_REDUCED_SPEED_DEGREES)
            || self.current_speed.get::<radian_per_second>() < 0.
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

    pub fn left_motor_rpm(&mut self) -> f64 {
        self.left_motor.speed.get::<revolution_per_minute>()
    }

    pub fn right_motor_rpm(&mut self) -> f64 {
        self.right_motor.speed.get::<revolution_per_minute>()
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

    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::psi,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    #[test]
    fn flap_slat_assembly_init() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);
        assert!(flap_system.left_motor.current_flow == VolumeRate::new::<gallon_per_minute>(0.));
        assert!(flap_system.right_motor.current_flow == VolumeRate::new::<gallon_per_minute>(0.));

        assert!(flap_system.left_motor.speed == AngularVelocity::new::<revolution_per_minute>(0.));
        assert!(flap_system.right_motor.speed == AngularVelocity::new::<revolution_per_minute>(0.));
    }

    #[test]
    fn flap_slat_assembly_full_pressure() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);
        assert!(flap_system.current_speed.get::<radian_per_second>() == 0.);

        flap_system.update(
            Some(Angle::new::<degree>(20.)),
            Some(Angle::new::<degree>(20.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(2000)),
        );

        assert!(
            (flap_system.current_speed - max_speed).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            flap_system.left_motor.speed >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && flap_system.left_motor.speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );
        assert!(
            flap_system.right_motor.speed >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && flap_system.right_motor.speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            flap_system.left_motor.flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.left_motor.flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
        assert!(
            flap_system.right_motor.flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.right_motor.flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_full_pressure_reverse_direction_has_negative_motor_speeds() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        // Two updates to reach demanded position
        flap_system.update(
            Some(Angle::new::<degree>(20.)),
            Some(Angle::new::<degree>(20.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(15000)),
        );

        flap_system.update(
            Some(Angle::new::<degree>(20.)),
            Some(Angle::new::<degree>(20.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(5000)),
        );

        assert!(flap_system.current_speed == AngularVelocity::new::<radian_per_second>(0.));

        // Now testing reverse movement parameters

        flap_system.update(
            Some(Angle::new::<degree>(-20.)),
            Some(Angle::new::<degree>(-20.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(1500)),
        );

        assert!(
            flap_system.left_motor.speed <= AngularVelocity::new::<revolution_per_minute>(-2000.)
                && flap_system.left_motor.speed
                    >= AngularVelocity::new::<revolution_per_minute>(-6000.)
        );
        assert!(
            flap_system.right_motor.speed <= AngularVelocity::new::<revolution_per_minute>(-2000.)
                && flap_system.right_motor.speed
                    >= AngularVelocity::new::<revolution_per_minute>(-6000.)
        );

        assert!(
            flap_system.left_motor.flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.left_motor.flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
        assert!(
            flap_system.right_motor.flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.right_motor.flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_right() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Some(Angle::new::<degree>(20.)),
            Some(Angle::new::<degree>(20.)),
            Pressure::new::<psi>(0.),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(2000)),
        );

        assert!(
            (flap_system.current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(flap_system.left_motor.speed == AngularVelocity::new::<revolution_per_minute>(0.));
        assert!(
            flap_system.right_motor.speed >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && flap_system.right_motor.speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(flap_system.left_motor.flow() == VolumeRate::new::<gallon_per_minute>(0.));
        assert!(
            flap_system.right_motor.flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.right_motor.flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_left() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Some(Angle::new::<degree>(20.)),
            Some(Angle::new::<degree>(20.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(0.),
            &context(Duration::from_millis(2000)),
        );

        assert!(
            (flap_system.current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(flap_system.right_motor.speed == AngularVelocity::new::<revolution_per_minute>(0.));
        assert!(
            flap_system.left_motor.speed >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && flap_system.left_motor.speed
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(flap_system.right_motor.flow() == VolumeRate::new::<gallon_per_minute>(0.));
        assert!(
            flap_system.left_motor.flow() >= VolumeRate::new::<gallon_per_minute>(3.)
                && flap_system.left_motor.flow() <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_goes_to_req_position() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Some(Angle::new::<degree>(20.)),
            Some(Angle::new::<degree>(20.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(100)),
        );

        let mut time = Duration::from_millis(0);
        let mut last_position = flap_system.position_feedback();

        let flap_position_request = Angle::new::<degree>(20.);
        let synchro_gear_angle_request =
            flap_system.feedback_angle_from_flap_surface_angle(flap_position_request);

        for _ in 0..200 {
            flap_system.update(
                Some(Angle::new::<degree>(20.)),
                Some(Angle::new::<degree>(20.)),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );
            if flap_system.position_feedback() < synchro_gear_angle_request {
                assert!(flap_system.position_feedback() > last_position);
            }
            assert!(flap_system.position_feedback() <= flap_system.max_synchro_gear_position);

            last_position = flap_system.position_feedback();
            println!(
                "Time: {:.1}s  -> Position {:.2}/{} speed{:.3} RightMotor rpm {:.0}",
                time.as_secs_f64(),
                last_position.get::<degree>(),
                synchro_gear_angle_request.get::<degree>(),
                flap_system.current_speed.get::<radian_per_second>(),
                flap_system.right_motor.speed.get::<revolution_per_minute>()
            );
            time += Duration::from_millis(100);
        }

        assert!(flap_system.position_feedback() == synchro_gear_angle_request);
    }

    #[test]
    fn flap_slat_assembly_stops_at_max_position_on_half_pressure_less_than_37_seconds() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            Some(Angle::new::<degree>(45.)),
            Some(Angle::new::<degree>(45.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(0.),
            &context(Duration::from_millis(100)),
        );

        let mut time = Duration::from_millis(0);

        for _ in 0..370 {
            flap_system.update(
                Some(Angle::new::<degree>(45.)),
                Some(Angle::new::<degree>(45.)),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(0.),
                &context(Duration::from_millis(100)),
            );

            assert!(flap_system.position_feedback() <= flap_system.max_synchro_gear_position);

            assert!(
                flap_system.current_speed
                    < (max_speed / 2.) + AngularVelocity::new::<radian_per_second>(0.01)
            );

            println!(
                "Time: {:.1}s  -> Position {:.2}/{}-> speed {:.3} SurfaceAngle {:.1}",
                time.as_secs_f64(),
                flap_system.position_feedback().get::<degree>(),
                flap_system.max_synchro_gear_position.get::<degree>(),
                flap_system.current_speed.get::<radian_per_second>(),
                flap_system.flap_surface_angle().get::<degree>(),
            );
            time += Duration::from_millis(100);
        }
    }

    #[test]
    fn flap_slat_assembly_goes_back_from_max_position() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        let mut time = Duration::from_millis(0);

        for _ in 0..300 {
            flap_system.update(
                Some(Angle::new::<degree>(40.)),
                Some(Angle::new::<degree>(40.)),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            assert!(flap_system.position_feedback() <= flap_system.max_synchro_gear_position);

            println!(
                "Time: {:.1}s  -> Position {:.2}/{} -> Motor speed {:.0}",
                time.as_secs_f64(),
                flap_system.position_feedback().get::<degree>(),
                flap_system.max_synchro_gear_position.get::<degree>(),
                flap_system.left_motor.speed.get::<revolution_per_minute>()
            );
            time += Duration::from_millis(100);
        }

        assert!(flap_system.position_feedback() == flap_system.max_synchro_gear_position);

        for _ in 0..300 {
            flap_system.update(
                Some(Angle::new::<degree>(-8.)),
                Some(Angle::new::<degree>(-8.)),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            assert!(flap_system.position_feedback() <= flap_system.max_synchro_gear_position);
            assert!(flap_system.position_feedback() >= Angle::new::<degree>(0.));

            println!(
                "Time: {:.1}s  -> Position {:.1}/{} -> Motor speed {:.0}",
                time.as_secs_f64(),
                flap_system.position_feedback().get::<degree>(),
                flap_system.max_synchro_gear_position.get::<degree>(),
                flap_system.left_motor.speed.get::<revolution_per_minute>()
            );
            time += Duration::from_millis(100);
        }

        assert!(flap_system.position_feedback() == Angle::new::<degree>(0.));
    }

    #[test]
    fn flap_slat_assembly_stops_at_max_position_at_half_speed_with_one_sfcc() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        flap_system.update(
            None,
            Some(Angle::new::<degree>(40.)),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
            &context(Duration::from_millis(100)),
        );

        let mut time = Duration::from_millis(0);

        for _ in 0..370 {
            flap_system.update(
                None,
                Some(Angle::new::<degree>(40.)),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            assert!(flap_system.position_feedback() <= flap_system.max_synchro_gear_position);

            assert!(
                flap_system.current_speed
                    < (max_speed / 2.) + AngularVelocity::new::<radian_per_second>(0.01)
            );

            println!(
                "Time: {:.1}s  -> Position {:.2}/{}-> speed {:.3} SurfaceAngle {:.1}",
                time.as_secs_f64(),
                flap_system.position_feedback().get::<degree>(),
                flap_system.max_synchro_gear_position.get::<degree>(),
                flap_system.current_speed.get::<radian_per_second>(),
                flap_system.flap_surface_angle().get::<degree>(),
            );
            time += Duration::from_millis(100);
        }
    }

    #[test]
    fn flap_slat_assembly_stops_if_no_sfcc() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        let mut time = Duration::from_millis(0);
        let mut sfcc_demand = Some(Angle::new::<degree>(40.));
        for _ in 0..150 {
            flap_system.update(
                sfcc_demand,
                sfcc_demand,
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            if time >= Duration::from_millis(10000) {
                sfcc_demand = None;
            }

            if time >= Duration::from_millis(12000) {
                assert!(
                    flap_system.current_speed <= AngularVelocity::new::<radian_per_second>(0.001)
                );
                assert!(
                    flap_system.current_speed >= AngularVelocity::new::<radian_per_second>(-0.001)
                );
            }

            println!(
                "Time {:.1} Position {:.2}/{}-> speed {:.3} SurfaceAngle {:.1}",
                time.as_secs_f64(),
                flap_system.position_feedback().get::<degree>(),
                flap_system.max_synchro_gear_position.get::<degree>(),
                flap_system.current_speed.get::<radian_per_second>(),
                flap_system.flap_surface_angle().get::<degree>(),
            );

            time += Duration::from_millis(100);
        }
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_extending() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        let mut flap_speed_snapshot = AngularVelocity::new::<radian_per_second>(100.);

        let mut time = Duration::from_millis(0);
        let sfcc_demand = Some(Angle::new::<degree>(20.));

        for _ in 0..150 {
            flap_system.update(
                sfcc_demand,
                sfcc_demand,
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            if time > Duration::from_millis(5000) && time < Duration::from_millis(5500) {
                flap_speed_snapshot = flap_system.current_speed;
            }

            if (flap_system.flap_surface_angle() - sfcc_demand.unwrap())
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(flap_system.current_speed < flap_speed_snapshot)
            }

            println!(
                "Time {:.1} Position {:.2}/{}-> speed {:.3} SurfaceAngle {:.1} Flow L gpm {:.2},  Flow R gpm {:.2}",
                time.as_secs_f64(),
                flap_system.position_feedback().get::<degree>(),
                flap_system.max_synchro_gear_position.get::<degree>(),
                flap_system.current_speed.get::<radian_per_second>(),
                flap_system.flap_surface_angle().get::<degree>(),
                flap_system.left_motor.flow().get::<gallon_per_minute>(),
                flap_system.right_motor.flow().get::<gallon_per_minute>()
            );

            time += Duration::from_millis(100);
        }
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_retracting() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut flap_system = flap_system(max_speed);

        assert!(flap_system.position_feedback().get::<degree>() == 0.);

        let mut flap_speed_snapshot = AngularVelocity::new::<radian_per_second>(100.);

        let mut time = Duration::from_millis(0);
        let mut sfcc_demand = Some(Angle::new::<degree>(20.));

        for _ in 0..150 {
            flap_system.update(
                sfcc_demand,
                sfcc_demand,
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );
        }

        // Retracting now
        sfcc_demand = Some(Angle::new::<degree>(10.));
        for _ in 0..150 {
            flap_system.update(
                sfcc_demand,
                sfcc_demand,
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(FlapSlatAssembly::MAX_CIRCUIT_PRESSURE_PSI),
                &context(Duration::from_millis(100)),
            );

            if time > Duration::from_millis(1000) && time < Duration::from_millis(1500) {
                flap_speed_snapshot = flap_system.current_speed;
            }

            if (flap_system.flap_surface_angle() - sfcc_demand.unwrap())
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(flap_system.current_speed > flap_speed_snapshot)
            }

            println!(
                "Time {:.1} Position {:.2}/{}-> speed {:.3} SurfaceAngle {:.1} Flow gpm {:.2}",
                time.as_secs_f64(),
                flap_system.position_feedback().get::<degree>(),
                flap_system.max_synchro_gear_position.get::<degree>(),
                flap_system.current_speed.get::<radian_per_second>(),
                flap_system.flap_surface_angle().get::<degree>(),
                flap_system.right_motor.flow().get::<gallon_per_minute>()
            );

            time += Duration::from_millis(100);
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
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
        )
    }

    fn flap_system(max_speed: AngularVelocity) -> FlapSlatAssembly {
        FlapSlatAssembly::new(
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
