use crate::{
    shared::local_acceleration_at_plane_coordinate, shared::random_from_normal_distribution,
    simulation::UpdateContext,
};

use uom::si::{f64::*, mass::kilogram};

use nalgebra::Vector3;

struct SpringPhysics {
    last_length: f64,
    spring_constant: f64,
    damping_constant: f64,
}
impl SpringPhysics {
    fn new(spring_constant: f64, damping_constant: f64) -> Self {
        Self {
            last_length: 0.,
            spring_constant,
            damping_constant,
        }
    }

    fn update_force(
        &mut self,
        context: &UpdateContext,
        position1: Vector3<f64>,
        position2: Vector3<f64>,
    ) -> Vector3<f64> {
        let spring_vector = position1 - position2;
        let spring_length = spring_vector.norm();

        if spring_length.abs() < 0.001 {
            self.last_length = spring_length;

            return Vector3::default();
        }

        let spring_vector_normalized = spring_vector.normalize();
        let velocity = (spring_length - self.last_length) / context.delta_as_secs_f64();

        let k_force = spring_length * self.spring_constant;
        let damping_force = velocity * self.damping_constant;

        self.last_length = spring_length;

        (k_force + damping_force) * spring_vector_normalized
    }

    fn set_k_and_damping(&mut self, spring_constant: f64, damping_constant: f64) {
        self.spring_constant = spring_constant;
        self.damping_constant = damping_constant;
    }
}

pub enum GravityEffect {
    NoGravity,
    GravityFiltered,
    ExternalAccelerationOnly,
}

pub struct WobblePhysics {
    reference_point_cg: Vector3<f64>,
    cg_position: Vector3<f64>,
    cg_speed: Vector3<f64>,

    virtual_mass: Mass,
    spring: SpringPhysics,
    anisotropic_damping_constant: Vector3<f64>,

    gravity_effect: GravityEffect,
}
impl WobblePhysics {
    pub fn new(
        gravity_effect: GravityEffect,
        init_position: Vector3<f64>,
        mean_mass_kg: f64,
        std_mass_kg: f64,
        mean_spring: f64,
        std_spring: f64,
        mean_damp: f64,
        std_damp: f64,
        mean_aniso_damp: Vector3<f64>,
        std_aniso_damp: f64,
    ) -> Self {
        Self {
            reference_point_cg: Vector3::default(),
            cg_position: init_position,
            cg_speed: Vector3::default(),

            virtual_mass: Mass::new::<kilogram>(random_from_normal_distribution(
                mean_mass_kg,
                std_mass_kg,
            )),
            spring: SpringPhysics::new(
                random_from_normal_distribution(mean_spring, std_spring),
                random_from_normal_distribution(mean_damp, std_damp),
            ),
            anisotropic_damping_constant: Vector3::new(
                random_from_normal_distribution(mean_aniso_damp[0], std_aniso_damp),
                random_from_normal_distribution(mean_aniso_damp[1], std_aniso_damp),
                random_from_normal_distribution(mean_aniso_damp[2], std_aniso_damp),
            ),
            gravity_effect,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        external_acceleration: Vector3<f64>,
        offset_point_coordinates: Vector3<f64>,
    ) {
        let acceleration =
            self.update_forces(context, external_acceleration, offset_point_coordinates)
                / self.virtual_mass.get::<kilogram>();

        self.cg_speed += acceleration * context.delta_as_secs_f64();

        self.cg_position += self.cg_speed * context.delta_as_secs_f64();
    }

    fn update_forces(
        &mut self,
        context: &UpdateContext,
        external_acceleration: Vector3<f64>,
        offset_point_coordinates: Vector3<f64>,
    ) -> Vector3<f64> {
        let local_acceleration = match self.gravity_effect {
            GravityEffect::NoGravity => {
                context.local_acceleration_without_gravity() + external_acceleration
                    - local_acceleration_at_plane_coordinate(context, offset_point_coordinates)
            }
            GravityEffect::GravityFiltered => {
                context.acceleration_plane_reference_filtered_ms2_vector() + external_acceleration
            }
            GravityEffect::ExternalAccelerationOnly => external_acceleration,
        };

        let acceleration_force = local_acceleration * self.virtual_mass.get::<kilogram>();

        let spring_force =
            self.spring
                .update_force(context, self.reference_point_cg, self.cg_position);

        let viscosity_damping = -self
            .cg_speed
            .component_mul(&self.anisotropic_damping_constant);

        acceleration_force + spring_force + viscosity_damping
    }

    pub fn position(&self) -> Vector3<f64> {
        self.cg_position
    }

    pub fn set_k_and_damping(&mut self, spring_constant: f64, damping_constant: f64) {
        self.spring
            .set_k_and_damping(spring_constant, damping_constant)
    }

    pub fn set_mass(&mut self, mass: Mass) {
        self.virtual_mass = mass;
    }

    pub fn set_aniso_damping(&mut self, x: f64, y: f64, z: f64) {
        self.anisotropic_damping_constant[0] = x;
        self.anisotropic_damping_constant[1] = y;
        self.anisotropic_damping_constant[2] = z;
    }
}
