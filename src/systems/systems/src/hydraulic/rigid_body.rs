extern crate nalgebra as na;
use na::{Rotation2, Vector2, Vector3};

use uom::si::{
    acceleration::meter_per_second_squared,
    angle::radian,
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{degree_per_second, radian_per_second},
    f64::*,
    mass::kilogram,
};

use crate::simulation::UpdateContext;

struct RigidBodyOnHingeAxis {
    throw: f64,
    min_angle: f64,
    max_angle: f64,

    size: Vector3<f64>,

    center_of_gravity_offset: Vector2<f64>,
    center_of_gravity_actual: Vector2<f64>,

    control_arm: Vector2<f64>,
    control_arm_actual: Vector2<f64>,

    anchor_point: Vector2<f64>,

    position: f64,
    speed: f64,
    acceleration: f64,

    mass: Mass,
    inertia_at_hinge: f64,

    natural_damping: f64,
    max_speed: f64,
}
impl RigidBodyOnHingeAxis {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        mass: Mass,
        size: Vector3<f64>,
        center_of_gravity_offset: Vector2<f64>,
        control_arm: Vector2<f64>,
        anchor_point: Vector2<f64>,
        min_angle: Angle,
        throw: Angle,
        natural_damping: f64,
    ) -> Self {
        let inertia_at_cog =
            (1. / 12.) * mass.get::<kilogram>() * size[0] * size[0] + size[1] * size[1];

        // Parallel axis theorem to get inertia at hinge axis from inertia at CoG
        let inertia_at_hinge =
            inertia_at_cog + mass.get::<kilogram>() * center_of_gravity_offset.norm_squared();

        Self {
            throw: throw.get::<radian>(),
            min_angle: min_angle.get::<radian>(),
            max_angle: min_angle.get::<radian>() + throw.get::<radian>(),
            size,
            center_of_gravity_offset,
            center_of_gravity_actual: center_of_gravity_offset,
            control_arm,
            control_arm_actual: control_arm,
            anchor_point,
            position: min_angle.get::<radian>(),
            speed: 0.,
            acceleration: 0.,
            mass,
            inertia_at_hinge,
            natural_damping,
            max_speed: 4.0,
        }
    }

    fn update_all_rotations(&mut self) {
        let rotation_transform = Rotation2::new(self.position);
        self.control_arm_actual = rotation_transform * self.control_arm;
        self.center_of_gravity_actual = rotation_transform * self.center_of_gravity_offset;
    }

    fn gravity_force(&self, context: &UpdateContext) -> f64 {
        let mg = context.long_accel().get::<meter_per_second_squared>()* self.mass.get::<kilogram>();
        let gravity_force = Vector3::new(
            0.,
            mg,
            0.,
        );

        let center_of_gravity_3d = Vector3::new(
            self.center_of_gravity_actual[0],
            self.center_of_gravity_actual[1],
            0.,
        );

        let gravity_moment_vector = center_of_gravity_3d.cross(&gravity_force);

        gravity_moment_vector[2]
    }

    fn natural_damping(&self) -> f64 {
        -self.speed * self.natural_damping
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let total_force = self.natural_damping() + self.gravity_force(context);
        self.acceleration = total_force / self.inertia_at_hinge;

        self.speed += self.acceleration * context.delta_as_secs_f64();

        self.position += self.speed * context.delta_as_secs_f64();

        if self.position >= self.max_angle {
            self.position = self.max_angle;
            self.speed = -self.speed * 0.3;
        } else if self.position <= self.min_angle {
            self.position = self.min_angle;
            self.speed = -self.speed * 0.3;
        }

        self.update_all_rotations();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::{
        acceleration::meter_per_second_squared,
        angle::{degree, radian},
        length::foot,
        pressure::{pascal, psi},
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
    };

    #[test]
    fn body_gravity_movement() {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector2::new(0., -size[1] / 2.);

        let control_arm = Vector2::new(-0.1597, -0.1614);
        let anchor = Vector2::new(-0.759, -0.086);

        let mut rigid_body = RigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(130.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            100.,
        );

        let dt = 0.05;

        let mut time = 0.;
        for _ in 0..1000 {
            rigid_body.update(&context(Duration::from_secs_f64(dt)));
            time += dt;
            println!("Pos {} t={}", rigid_body.position, time);
        }
    }

    fn context(delta_time: Duration) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<meter_per_second_squared>(0.),
            Acceleration::new::<meter_per_second_squared>(0.),
            Acceleration::new::<meter_per_second_squared>(-9.8),
        )
    }
}
