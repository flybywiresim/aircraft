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

    k_const_id: VariableIdentifier,
    damp_const_id: VariableIdentifier,
    mass_id: VariableIdentifier,
    gain_id: VariableIdentifier,
    xdamp_id: VariableIdentifier,
    ydamp_id: VariableIdentifier,
    dual_dim_mode_id: VariableIdentifier,

    dual_dim_mode_enable: bool,

    reference_point_cg: Vector3<f64>,
    cg_position: Vector3<f64>,
    cg_speed: Vector3<f64>,

    virtual_mass: Mass,
    spring: SpringPhysics,
    anisotropic_damping_constant: Vector3<f64>,

    position_output_gain: f64,
}
impl EngineFlexPhysics {
    pub fn new(context: &mut InitContext, engine_number: usize) -> Self {
        Self {
            x_position_id: context
                .get_identifier(format!("ENGINE_{}_WOBBLE_X_POSITION", engine_number)),
            k_const_id: context.get_identifier("TEST_K_CONST".to_owned()),
            damp_const_id: context.get_identifier("TEST_DAMP_CONST".to_owned()),
            mass_id: context.get_identifier("TEST_MASS".to_owned()),
            gain_id: context.get_identifier("TEST_OUT_GAIN".to_owned()),
            xdamp_id: context.get_identifier("TEST_XDAMP".to_owned()),
            ydamp_id: context.get_identifier("TEST_YDAMP".to_owned()),
            dual_dim_mode_id: context.get_identifier("TEST_DUAL_XZ".to_owned()),

            dual_dim_mode_enable: false,

            reference_point_cg: Vector3::default(),
            cg_position: Vector3::new(0., -0.2, 0.),
            cg_speed: Vector3::default(),

            virtual_mass: Mass::new::<kilogram>(500.),
            spring: SpringPhysics::new(50000., 500.),
            anisotropic_damping_constant: Vector3::new(10., 50., 50.),
            position_output_gain: 1.,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.update_speed_position(context);
    }

    fn update_forces(&mut self, context: &UpdateContext) -> Vector3<f64> {
        let gravity_force = context.acceleration_plane_reference_unfiltered_ms2_vector()
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

    fn animation_position(&self) -> f64 {
        let limited_pos = if self.dual_dim_mode_enable {
            (self.position_output_gain * (self.cg_position[0] + self.cg_position[2]))
                .min(1.)
                .max(-1.)
        } else {
            (self.position_output_gain * self.cg_position[0])
                .min(1.)
                .max(-1.)
        };

        let final_pos = (limited_pos + 1.) / 2.;

        println!(
            "current cg {:.1}/{:.1}/{:.1} lim {:.1} final {:.1} ",
            self.cg_position[0], self.cg_position[1], self.cg_position[2], limited_pos, final_pos
        );

        final_pos
    }
}
impl SimulationElement for EngineFlexPhysics {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let new_k = reader.read(&self.k_const_id);

        let new_damp = reader.read(&self.damp_const_id);

        let new_mass: f64 = reader.read(&self.mass_id);

        let new_gain: f64 = reader.read(&self.gain_id);

        if new_k > 0. || new_damp > 0. {
            self.spring.set_k_and_damping(new_k, new_damp);
        }

        if new_mass > 0. {
            self.virtual_mass = Mass::new::<kilogram>(new_mass);
        }

        if new_gain >= 0. {
            self.position_output_gain = new_gain;
        }

        let new_xdamp: f64 = reader.read(&self.xdamp_id);
        let new_ydamp: f64 = reader.read(&self.ydamp_id);

        if new_xdamp >= 0. {
            self.anisotropic_damping_constant[0] = new_xdamp;
        }

        if new_ydamp >= 0. {
            self.anisotropic_damping_constant[1] = new_ydamp;
            self.anisotropic_damping_constant[2] = new_ydamp;
        }

        let mode_ena: f64 = reader.read(&self.dual_dim_mode_id);
        self.dual_dim_mode_enable = mode_ena > 0.;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.x_position_id, self.animation_position());
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
