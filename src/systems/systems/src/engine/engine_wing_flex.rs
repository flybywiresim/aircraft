use crate::{
    hydraulic::SpringPhysics,
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use uom::si::{f64::*, mass::kilogram, ratio::ratio};

use nalgebra::Vector3;
use std::fmt::Debug;

pub struct EngineFlexPhysics {
    x_position_id: VariableIdentifier,
    reference_point_cg: Vector3<f64>,
    cg_position: Vector3<f64>,
    cg_speed: Vector3<f64>,

    virtual_mass: Mass,
    spring: SpringPhysics,
    anisotropic_damping_constant: Vector3<f64>,
}
impl EngineFlexPhysics {
    pub fn new(context: &mut InitContext, engine_number: usize) -> Self {
        Self {
            x_position_id: context
                .get_identifier(format!("ENGINE_{}_WOBBLE_X_POSITION", engine_number)),
            reference_point_cg: Vector3::default(),
            cg_position: Vector3::new(0., -0.2, 0.),
            cg_speed: Vector3::default(),

            virtual_mass: Mass::new::<kilogram>(100.),
            spring: SpringPhysics::default(),
            anisotropic_damping_constant: Vector3::new(25., 20., 25.),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.update_speed_position(context);
    }

    fn update_forces(&mut self, context: &UpdateContext) -> Vector3<f64> {
        let gravity_force = context.acceleration_plane_reference_filtered_ms2_vector()
            * self.virtual_mass.get::<kilogram>();

        let spring_force =
            self.spring
                .update_force(context, self.reference_point_cg, self.cg_position);

        let viscosity_damping = -self
            .cg_speed
            .component_mul(&self.anisotropic_damping_constant);

        gravity_force + spring_force + viscosity_damping
    }

    fn update_speed_position(&mut self, context: &UpdateContext) {
        let acceleration = self.update_forces(context) / self.virtual_mass.get::<kilogram>();

        self.cg_speed += acceleration * context.delta_as_secs_f64();

        self.cg_position += self.cg_speed * context.delta_as_secs_f64();
    }
}
impl SimulationElement for EngineFlexPhysics {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.x_position_id, self.cg_position[1]);
    }
}
impl Debug for EngineFlexPhysics {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nEngine Flex=> CG [{:.2};{:.2};{:.2}]",
            self.cg_position[0], self.cg_position[1], self.cg_position[2]
        )
    }
}
