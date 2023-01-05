use std::time::Duration;

use crate::{
    hydraulic::SpringPhysics,
    shared::random_from_normal_distribution,
    shared::update_iterator::MaxStepLoop,
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, StartState, UpdateContext, VariableIdentifier, Write,
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

            reference_point_cg: Vector3::default(),
            cg_position: Vector3::default(),
            cg_speed: Vector3::default(),

            virtual_mass: Mass::new::<kilogram>(random_from_normal_distribution(2000., 100.)),
            spring: SpringPhysics::new(
                random_from_normal_distribution(800000., 50000.),
                random_from_normal_distribution(500., 20.),
            ),
            anisotropic_damping_constant: Vector3::new(
                random_from_normal_distribution(500., 50.),
                random_from_normal_distribution(500., 50.),
                random_from_normal_distribution(500., 50.),
            ),
            position_output_gain: 90.,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.update_speed_position(context);
    }

    fn update_forces(&mut self, context: &UpdateContext) -> Vector3<f64> {
        let acceleration_force =
            context.local_acceleration_without_gravity() * self.virtual_mass.get::<kilogram>();

        let spring_force =
            self.spring
                .update_force(context, self.reference_point_cg, self.cg_position);

        let viscosity_damping = -self
            .cg_speed
            .component_mul(&self.anisotropic_damping_constant);

        acceleration_force + spring_force + viscosity_damping
    }

    fn update_speed_position(&mut self, context: &UpdateContext) {
        let acceleration = self.update_forces(context) / self.virtual_mass.get::<kilogram>();

        self.cg_speed += acceleration * context.delta_as_secs_f64();

        self.cg_position += self.cg_speed * context.delta_as_secs_f64();
    }

    fn animation_position(&self) -> f64 {
        let limited_pos = (self.position_output_gain * (self.cg_position[0] + self.cg_position[1]))
            .min(1.)
            .max(-1.);

        let final_pos = (limited_pos + 1.) / 2.;

        println!(
            "current cg {:.2}/{:.2}/{:.2} lim {:.2} final {:.1} ",
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

        if new_gain > 0. {
            self.position_output_gain = new_gain;
        }

        let new_xdamp: f64 = reader.read(&self.xdamp_id);
        let new_ydamp: f64 = reader.read(&self.ydamp_id);

        if new_xdamp > 0. {
            self.anisotropic_damping_constant[0] = new_xdamp;
        }

        if new_ydamp > 0. {
            self.anisotropic_damping_constant[1] = new_ydamp;
            self.anisotropic_damping_constant[2] = new_ydamp;
        }
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

pub struct EnginesFlexiblePhysics<const N: usize> {
    engines_flex_updater: MaxStepLoop,
    engines_flex: Vec<EngineFlexPhysics>,
}
impl<const N: usize> EnginesFlexiblePhysics<N> {
    const ENGINES_FLEX_SIM_TIME_STEP: Duration = Duration::from_millis(10);

    pub fn new(context: &mut InitContext) -> Self {
        let mut all_engines: Vec<EngineFlexPhysics> = vec![];
        for engine_number in 1..=N {
            all_engines.push(EngineFlexPhysics::new(context, engine_number));
        }

        Self {
            engines_flex_updater: MaxStepLoop::new(Self::ENGINES_FLEX_SIM_TIME_STEP),
            engines_flex: all_engines,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.engines_flex_updater.update(context);

        for cur_time_step in self.engines_flex_updater {
            for engine_flex in &mut self.engines_flex {
                engine_flex.update(&context.with_delta(cur_time_step));
            }
        }
    }
}
impl SimulationElement for EnginesFlexiblePhysics<4> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.engines_flex, visitor);

        visitor.visit(self);
    }
}
