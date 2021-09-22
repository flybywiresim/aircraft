use nalgebra::{Rotation3, Unit, Vector3};

use uom::si::{
    angle::radian, angular_acceleration::radian_per_second_squared,
    angular_velocity::radian_per_second, f64::*, force::newton, length::meter, mass::kilogram,
    ratio::ratio, torque::newton_meter,
};

use crate::simulation::UpdateContext;

/// Trait linked to anything moving bounded between a minimum and maximum position.
/// Those bounds implies that it will have a max and min distance from a fixed
/// point in space to the position where we apply forces to it,
/// for example a control arm where an actuator is attached.
pub trait BoundedLinearLength {
    fn min_absolute_length_to_anchor(&self) -> Length;
    fn max_absolute_length_to_anchor(&self) -> Length;
}

/// Represent any physical object able to rotate on a hinge axis.
/// It can be a gear, elevator, cargo door, etc. Only one rotation degree of freedom is handled.
/// An linear actuator or multiple linear actuators can apply forces to its control arm.
///
/// Coordinates are as follows:
/// on x (left->right looking at the plane from the back)
/// on y (down->up)
/// on z (aft->fwd)
///
/// All coordinate references are from the hinge axis. So (0,0,0) is the hinge rotation axis center.
#[derive(PartialEq, Clone, Copy)]
pub struct LinearActuatedRigidBodyOnHingeAxis {
    total_travel: Angle,
    min_angle: Angle,
    max_angle: Angle,

    // size in meters
    size: Vector3<f64>,

    center_of_gravity_offset: Vector3<f64>,
    center_of_gravity_actual: Vector3<f64>,

    control_arm: Vector3<f64>,
    control_arm_actual: Vector3<f64>,
    actuator_extension_gives_positive_angle: bool,

    anchor_point: Vector3<f64>,

    position: Angle,
    speed: AngularVelocity,
    acceleration: AngularAcceleration,
    sum_of_torques: Torque,

    position_normalized: Ratio,
    position_normalized_prev: Ratio,

    mass: Mass,
    inertia_at_hinge: f64,

    natural_damping_constant: f64,

    lock_position_request: Ratio,
    is_lock_requested: bool,
    is_locked: bool,

    axis_direction: Vector3<f64>,
}
impl LinearActuatedRigidBodyOnHingeAxis {
    // Rebound energy when hiting min or max position. 0.3 means the body rebounds at 30% of the speed it hit the min/max position
    const DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR: f64 = 0.3;

    #[allow(clippy::too_many_arguments)]
    pub fn new(
        mass: Mass,
        size: Vector3<f64>,
        center_of_gravity_offset: Vector3<f64>,
        control_arm: Vector3<f64>,
        anchor_point: Vector3<f64>,
        min_angle: Angle,
        total_travel: Angle,
        natural_damping_constant: f64,
        locked: bool,
        axis_direction: Vector3<f64>,
    ) -> Self {
        // The inertia about a given axis is the sum of squares of the size of the rectangle, minus
        // the size along the axis dimension
        let relevant_inertia = size.norm_squared();
        let relevant_inertia = relevant_inertia - (size.dot(&axis_direction)).powf(2.);
        let inertia_at_cog = (1. / 12.) * mass.get::<kilogram>() * relevant_inertia;
        // Parallel axis theorem to get inertia at hinge axis from inertia at CoG
        let inertia_at_hinge =
            inertia_at_cog + mass.get::<kilogram>() * center_of_gravity_offset.norm_squared();

        let mut new_body = Self {
            total_travel,
            min_angle,
            max_angle: min_angle + total_travel,
            size,
            center_of_gravity_offset,
            center_of_gravity_actual: center_of_gravity_offset,
            control_arm,
            control_arm_actual: control_arm,
            actuator_extension_gives_positive_angle: false,
            anchor_point,
            position: min_angle,
            speed: AngularVelocity::new::<radian_per_second>(0.),
            acceleration: AngularAcceleration::new::<radian_per_second_squared>(0.),
            sum_of_torques: Torque::new::<newton_meter>(0.),
            position_normalized: Ratio::new::<ratio>(0.),
            position_normalized_prev: Ratio::new::<ratio>(0.),
            mass,
            inertia_at_hinge,
            natural_damping_constant,
            lock_position_request: Ratio::new::<ratio>(0.),
            is_lock_requested: locked,
            is_locked: locked,
            axis_direction,
        };
        // Make sure the new object has coherent structure by updating internal roations and positions once
        new_body.actuator_extension_gives_positive_angle =
            Self::initialize_actuator_force_direction(new_body);
        new_body.update_all_rotations();
        new_body.update_position_normalized();
        new_body
    }

    pub fn apply_control_arm_force(&mut self, actuator_local_force: Force) {
        // Actuator local force convention is positive in extension / negative in compression. We reverse direction depending on
        // rigid body configuration so we get an absolute force in the rigid body frame of reference
        let mut absolute_actuator_force = actuator_local_force;
        if !self.actuator_extension_gives_positive_angle() {
            absolute_actuator_force = -actuator_local_force;
        }

        // Computing the normalized vector on which force is applied. This is the vector from anchor point of actuator to where
        // it is connected to the rigid body
        let force_support_vector = self.anchor_point - self.control_arm_actual;
        let force_support_vector_normalized = force_support_vector / force_support_vector.norm();

        // Final torque is control arm position relative to hinge, cross product with
        // magnitude of the force applied on the force support vector
        let torque = self
            .control_arm
            .cross(&(absolute_actuator_force.get::<newton>() * force_support_vector_normalized));

        let torque_value = Torque::new::<newton_meter>(self.axis_direction.dot(&torque));

        self.sum_of_torques += torque_value;
    }

    pub fn linear_extension_to_anchor(&self) -> Length {
        Length::new::<meter>((self.anchor_point - self.control_arm_actual).norm())
    }

    /// Indicates correct direction of the rigid body when an actuator would be extending or compressing.
    /// If compressing actuator would give a rising rigid body angle, sets TRUE
    /// If extending actuator would give a lowering rigid body angle, sets FALSE
    fn initialize_actuator_force_direction(rigid_body: LinearActuatedRigidBodyOnHingeAxis) -> bool {
        rigid_body.max_absolute_length_to_anchor() < rigid_body.min_absolute_length_to_anchor()
    }

    // If compressing actuator would give a rising rigid body angle, returns TRUE
    // If extending actuator would give a lowering rigid body angle, returns FALSE
    pub fn actuator_extension_gives_positive_angle(&self) -> bool {
        self.actuator_extension_gives_positive_angle
    }

    fn lock_requested_position_in_absolute_reference(&self) -> Angle {
        self.lock_position_request.get::<ratio>() * self.total_travel + self.min_angle
    }

    pub fn position_normalized(&self) -> Ratio {
        self.position_normalized
    }

    fn update_position_normalized(&mut self) {
        self.position_normalized_prev = self.position_normalized;

        self.position_normalized = (self.position - self.min_angle) / self.total_travel;
    }

    // Rotates the static coordinates of the body according to its current angle to get the actual coordinates
    fn update_all_rotations(&mut self) {
        let rotation_transform = Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            self.position.get::<radian>(),
        );
        self.control_arm_actual = rotation_transform * self.control_arm;
        self.center_of_gravity_actual = rotation_transform * self.center_of_gravity_offset;
    }

    // Computes local acceleration including world gravity and plane acceleration
    // Note that this does not compute acceleration due to angular velocity of the plane
    fn local_acceleration_and_gravity(&self, context: &UpdateContext) -> Torque {
        let plane_acceleration_plane_reference = context.acceleration().to_ms2_vector();

        let pitch_rotation = context.attitude().pitch_rotation_transform();

        let bank_rotation = context.attitude().bank_rotation_transform();

        let gravity_acceleration_world_reference = Vector3::new(0., -9.8, 0.);

        // Total acceleration in plane reference is the gravity in world reference rotated to plane reference. To this we substract
        // the local plane reference to get final local acceleration (if plane falling at 1G final local accel is 1G of gravity - 1G local accel = 0G)
        let total_acceleration_plane_reference = (pitch_rotation
            * (bank_rotation * gravity_acceleration_world_reference))
            - plane_acceleration_plane_reference;

        // We add a 0 component to make the 2D CG position a 3D vector so we can compute a cross product easily

        // Force = m * G
        let resultant_force_plane_reference =
            total_acceleration_plane_reference * self.mass.get::<kilogram>();

        // The Moment generated by acceleration force is the CoG offset from hinge position cross product with the acceleration force
        let gravity_moment_vector = self
            .center_of_gravity_actual
            .cross(&resultant_force_plane_reference);

        // We work with only one degree of freedom so final result holds in the hinge rotation component only
        Torque::new::<newton_meter>(gravity_moment_vector.dot(&self.axis_direction))
    }

    // A global damping factor that simulates hinge friction and local air resistance
    fn natural_damping(&self) -> Torque {
        Torque::new::<newton_meter>(
            -self.speed.get::<radian_per_second>() * self.natural_damping_constant,
        )
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if !self.is_locked {
            self.sum_of_torques +=
                self.natural_damping() + self.local_acceleration_and_gravity(context);

            self.acceleration = AngularAcceleration::new::<radian_per_second_squared>(
                self.sum_of_torques.get::<newton_meter>() / self.inertia_at_hinge,
            );

            self.speed += AngularVelocity::new::<radian_per_second>(
                self.acceleration.get::<radian_per_second_squared>() * context.delta_as_secs_f64(),
            );

            self.position += Angle::new::<radian>(
                self.speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
            );

            // We check if lock is requested and if we crossed the lock position since last update
            if self.is_lock_requested {
                if self.position_normalized >= self.lock_position_request
                    && self.position_normalized_prev <= self.lock_position_request
                    || self.position_normalized <= self.lock_position_request
                        && self.position_normalized_prev >= self.lock_position_request
                {
                    self.is_locked = true;
                    self.position = self.lock_requested_position_in_absolute_reference();
                    self.speed = AngularVelocity::new::<radian_per_second>(0.);
                }
            } else if self.position >= self.max_angle {
                self.position = self.max_angle;
                self.speed = -self.speed * Self::DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR;
            } else if self.position <= self.min_angle {
                self.position = self.min_angle;
                self.speed = -self.speed * Self::DEFAULT_MAX_MIN_POSITION_REBOUND_FACTOR;
            }

            self.update_position_normalized();
            self.update_all_rotations();
        }

        self.sum_of_torques = Torque::new::<newton_meter>(0.);
    }

    pub fn unlock(&mut self) {
        self.is_locked = false;
        self.is_lock_requested = false;
    }

    pub fn lock_at_position_normalized(&mut self, position_normalized: Ratio) {
        self.is_lock_requested = true;
        self.lock_position_request = position_normalized;
    }

    pub fn is_locked(&self) -> bool {
        self.is_locked
    }

    fn absolute_length_to_anchor_at_angle(&self, position: Angle) -> Length {
        let rotation = Rotation3::from_axis_angle(
            &Unit::new_normalize(self.axis_direction),
            position.get::<radian>(),
        );
        let control_arm_position = rotation * self.control_arm;

        Length::new::<meter>((self.anchor_point - control_arm_position).norm())
    }
}
impl BoundedLinearLength for LinearActuatedRigidBodyOnHingeAxis {
    fn min_absolute_length_to_anchor(&self) -> Length {
        self.absolute_length_to_anchor_at_angle(self.min_angle)
    }

    fn max_absolute_length_to_anchor(&self) -> Length {
        self.absolute_length_to_anchor_at_angle(self.max_angle)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::{
        acceleration::meter_per_second_squared, angle::degree, length::foot,
        thermodynamic_temperature::degree_celsius, velocity::knot,
    };

    #[test]
    fn body_gravity_movement() {
        let mut rigid_body = cargo_door_body(false);

        let dt = 0.05;

        let mut time = 0.;
        for _ in 0..100 {
            rigid_body.update(&context(
                Duration::from_secs_f64(dt),
                Angle::new::<degree>(0.),
                Angle::new::<degree>(-45.),
            ));
            time += dt;
            println!("Pos {} t={}", rigid_body.position.get::<radian>(), time);
        }
    }

    #[test]
    fn not_locked_at_init_will_move() {
        let mut rigid_body = cargo_door_body(false);
        let init_pos = rigid_body.position;

        let dt = 0.05;

        let mut time = 0.;
        for _ in 0..100 {
            rigid_body.update(&context(
                Duration::from_secs_f64(dt),
                Angle::new::<degree>(0.),
                Angle::new::<degree>(-45.),
            ));
            time += dt;
            println!("Pos {} t={}", rigid_body.position.get::<radian>(), time);
            assert!(
                (rigid_body.position.get::<radian>() - init_pos.get::<radian>()).abs()
                    > f64::EPSILON
            );
        }
    }

    #[test]
    fn locked_at_init_wont_move() {
        let mut rigid_body = cargo_door_body(true);

        let dt = 0.05;

        let init_pos = rigid_body.position;

        let mut time = 0.;
        for _ in 0..100 {
            rigid_body.update(&context(
                Duration::from_secs_f64(dt),
                Angle::new::<degree>(0.),
                Angle::new::<degree>(-45.),
            ));
            time += dt;
            println!("Pos {} t={}", rigid_body.position.get::<radian>(), time);
            assert!(
                (rigid_body.position.get::<radian>() - init_pos.get::<radian>()).abs()
                    < f64::EPSILON
            );
        }
    }

    #[test]
    fn start_moving_once_unlocked() {
        let mut rigid_body = cargo_door_body(true);

        let dt = 0.05;

        let init_pos = rigid_body.position;

        let mut time = 0.;
        for _ in 0..100 {
            rigid_body.update(&context(
                Duration::from_secs_f64(dt),
                Angle::new::<degree>(0.),
                Angle::new::<degree>(-45.),
            ));
            time += dt;

            if time < 1. {
                assert!(
                    (rigid_body.position.get::<radian>() - init_pos.get::<radian>()).abs()
                        < f64::EPSILON
                );
            }

            if time >= 1. && time < 1. + dt {
                rigid_body.unlock();
                println!("UNLOCK t={}", time);
            }

            if time > 1. + dt {
                assert!(
                    (rigid_body.position.get::<radian>() - init_pos.get::<radian>()).abs()
                        > f64::EPSILON
                );
            }

            println!(
                "Pos {} t={}",
                rigid_body.position_normalized().get::<ratio>(),
                time
            );
        }
    }

    #[test]
    fn locks_at_required_position() {
        let mut rigid_body = cargo_door_body(false);

        let dt = 0.05;

        let mut time = 0.;

        rigid_body.lock_at_position_normalized(Ratio::new::<ratio>(0.5));

        assert!(rigid_body.is_lock_requested);

        assert!(!rigid_body.is_locked);

        for _ in 0..100 {
            rigid_body.update(&context(
                Duration::from_secs_f64(dt),
                Angle::new::<degree>(0.),
                Angle::new::<degree>(-45.),
            ));
            time += dt;

            println!(
                "Pos {} t={}",
                rigid_body.position_normalized().get::<ratio>(),
                time
            );
        }

        assert!(rigid_body.is_locked);
        assert!((rigid_body.position_normalized().get::<ratio>() - 0.5).abs() < f64::EPSILON);
    }

    fn context(delta_time: Duration, pitch: Angle, bank: Angle) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<meter_per_second_squared>(0.),
            Acceleration::new::<meter_per_second_squared>(0.),
            Acceleration::new::<meter_per_second_squared>(0.),
            pitch,
            bank,
        )
    }

    fn cargo_door_body(is_locked: bool) -> LinearActuatedRigidBodyOnHingeAxis {
        let size = Vector3::new(100. / 1000., 1855. / 1000., 2025. / 1000.);
        let cg_offset = Vector3::new(0., -size[1] / 2., 0.);

        let control_arm = Vector3::new(-0.1597, -0.1614, 0.);
        let anchor = Vector3::new(-0.759, -0.086, 0.);

        LinearActuatedRigidBodyOnHingeAxis::new(
            Mass::new::<kilogram>(130.),
            size,
            cg_offset,
            control_arm,
            anchor,
            Angle::new::<degree>(-23.),
            Angle::new::<degree>(136.),
            100.,
            is_locked,
            Vector3::new(0., 0., 1.),
        )
    }
}
