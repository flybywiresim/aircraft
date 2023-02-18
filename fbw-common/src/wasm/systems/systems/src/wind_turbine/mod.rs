use crate::shared::interpolation;
use crate::simulation::{
    InitContext, SimulationElement, SimulatorWriter, VariableIdentifier, Write,
};

use uom::si::{
    angle::{degree, radian},
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    torque::newton_meter,
    velocity::knot,
};

use std::time::Duration;

pub struct WindTurbine {
    rpm_id: VariableIdentifier,
    angular_position_id: VariableIdentifier,
    propeller_angle_id: VariableIdentifier,

    position: Angle,
    speed: AngularVelocity,
    acceleration: f64,
    torque_sum: f64,

    propeller_angle: Angle,
}
impl WindTurbine {
    // Low speed special calculation threshold. Under that value we compute resistant torque depending on pump angle and displacement.
    const LOW_SPEED_PHYSICS_ACTIVATION: f64 = 15.;
    const STOWED_ANGLE: f64 = std::f64::consts::PI / 2.;
    const PROPELLER_INERTIA: f64 = 0.2;
    const FRICTION_COEFFICIENT: f64 = 0.0002;
    const AIR_LIFT_COEFFICIENT: f64 = 0.018;

    const RPM_GOVERNOR_BREAKPTS: [f64; 9] = [
        0.0, 1000., 3000.0, 4000.0, 4800.0, 5800.0, 6250.0, 9000.0, 15000.0,
    ];
    const PROP_ALPHA_MAP: [f64; 9] = [45., 45., 45., 45., 35., 25., 1., 1., 1.];

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            rpm_id: context.get_identifier("RAT_RPM".to_owned()),
            angular_position_id: context.get_identifier("RAT_ANGULAR_POSITION".to_owned()),
            propeller_angle_id: context.get_identifier("RAT_PROPELLER_ANGLE".to_owned()),

            position: Angle::new::<radian>(Self::STOWED_ANGLE),
            speed: AngularVelocity::default(),
            acceleration: 0.,
            torque_sum: 0.,

            propeller_angle: Angle::default(),
        }
    }

    pub fn speed(&self) -> AngularVelocity {
        self.speed
    }

    pub fn position(&self) -> Angle {
        self.position
    }

    pub fn is_low_speed(&self) -> bool {
        self.speed.get::<revolution_per_minute>().abs() < Self::LOW_SPEED_PHYSICS_ACTIVATION
    }

    fn update_generated_torque(&mut self, indicated_speed: Velocity, stow_pos: f64) {
        let cur_alpha_degrees = interpolation(
            &Self::RPM_GOVERNOR_BREAKPTS,
            &Self::PROP_ALPHA_MAP,
            self.speed().get::<revolution_per_minute>(),
        );

        self.propeller_angle = Angle::new::<degree>(cur_alpha_degrees);

        // Simple model. stow pos sin simulates the angle of the blades vs wind while deploying
        let air_speed_torque = cur_alpha_degrees.to_radians().sin()
            * (indicated_speed.get::<knot>()
                * indicated_speed.get::<knot>()
                * Self::AIR_LIFT_COEFFICIENT)
            * 0.5
            * (std::f64::consts::PI / 2. * stow_pos).sin();

        self.torque_sum += air_speed_torque;
    }

    fn update_friction_torque(&mut self, resistant_torque: Torque) {
        let pump_torque = if self.is_low_speed() {
            self.speed().get::<radian_per_second>() * 0.25
        } else {
            20. + (self.speed().get::<radian_per_second>()
                * self.speed().get::<radian_per_second>())
                * Self::FRICTION_COEFFICIENT
        };

        self.torque_sum += resistant_torque.get::<newton_meter>() - pump_torque;
    }

    fn update_physics(&mut self, delta_time: &Duration) {
        self.acceleration = self.torque_sum / Self::PROPELLER_INERTIA;
        self.speed +=
            AngularVelocity::new::<radian_per_second>(self.acceleration * delta_time.as_secs_f64());
        self.position +=
            Angle::new::<radian>(self.speed.get::<radian_per_second>() * delta_time.as_secs_f64());

        // Reset torque accumulator at end of update
        self.torque_sum = 0.;

        self.position = Angle::new::<degree>(self.position.get::<degree>() % 360.);
    }

    pub fn update(
        &mut self,
        delta_time: &Duration,
        indicated_speed: Velocity,
        stow_pos: f64,
        resistant_torque: Torque,
    ) {
        if stow_pos > 0.1 {
            // Do not update anything on the propeller if still stowed
            self.update_generated_torque(indicated_speed, stow_pos);
            self.update_friction_torque(resistant_torque);
            self.update_physics(delta_time);
        }
    }
}
impl SimulationElement for WindTurbine {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.rpm_id, self.speed());

        writer.write(
            &self.angular_position_id,
            self.position.get::<degree>() % 360.,
        );

        writer.write(
            &self.propeller_angle_id,
            self.propeller_angle.get::<degree>() / 45.,
        );
    }
}
