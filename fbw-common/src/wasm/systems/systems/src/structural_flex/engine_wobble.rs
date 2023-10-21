use std::time::Duration;

use crate::{
    physics::{GravityEffect, WobblePhysics},
    shared::update_iterator::MaxStepLoop,
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use nalgebra::Vector3;
use std::fmt::Debug;
use uom::si::{acceleration::meter_per_second_squared, f64::*};

/// Solves a basic mass connected to a static point through a spring damper system
/// Mass center of gravity position reacting to external accelerations is then used to model engine wobbling movement
pub struct EngineFlexPhysics {
    x_position_id: VariableIdentifier,

    spring_const_id: VariableIdentifier,
    damping_const_id: VariableIdentifier,
    mass_id: VariableIdentifier,
    output_gain_id: VariableIdentifier,
    lateral_damping_id: VariableIdentifier,
    vertical_damping_id: VariableIdentifier,
    dev_mode_enable_id: VariableIdentifier,

    wobble_physics: WobblePhysics,

    position_output_gain: f64,

    animation_position: f64,
}
impl EngineFlexPhysics {
    pub fn new(context: &mut InitContext, engine_number: usize) -> Self {
        Self {
            x_position_id: context
                .get_identifier(format!("ENGINE_{}_WOBBLE_X_POSITION", engine_number)),
            spring_const_id: context.get_identifier("ENGINE_WOBBLE_DEV_K_CONST".to_owned()),
            damping_const_id: context.get_identifier("ENGINE_WOBBLE_DEV_DAMP_CONST".to_owned()),
            mass_id: context.get_identifier("ENGINE_WOBBLE_DEV_MASS".to_owned()),
            output_gain_id: context.get_identifier("ENGINE_WOBBLE_DEV_OUT_GAIN".to_owned()),
            lateral_damping_id: context.get_identifier("ENGINE_WOBBLE_DEV_XDAMP".to_owned()),
            vertical_damping_id: context.get_identifier("ENGINE_WOBBLE_DEV_YDAMP".to_owned()),
            dev_mode_enable_id: context.get_identifier("ENGINE_WOBBLE_DEV_ENABLE".to_owned()),

            wobble_physics: WobblePhysics::new(
                GravityEffect::ExternalAccelerationOnly,
                Vector3::default(),
                2000.,
                100.,
                800000.,
                50000.,
                1500.,
                100.,
                Vector3::new(1000., 1000., 1000.),
                50.,
            ),

            position_output_gain: 70.,

            animation_position: 0.5,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, wing_pylon_acceleration: Acceleration) {
        self.wobble_physics.update(
            context,
            Vector3::new(
                0.,
                wing_pylon_acceleration.get::<meter_per_second_squared>(),
                0.,
            ),
            Vector3::default(),
        );

        self.update_animation_position();
    }

    fn update_animation_position(&mut self) {
        let cg_position = self.wobble_physics.position();

        let limited_pos = (self.position_output_gain * (cg_position[0] + cg_position[1]))
            .min(1.)
            .max(-1.);

        self.animation_position = (limited_pos + 1.) / 2.;
    }
}
impl SimulationElement for EngineFlexPhysics {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let activate_dev_mode: f64 = reader.read(&self.dev_mode_enable_id);

        if activate_dev_mode > 0. {
            self.wobble_physics.set_k_and_damping(
                reader.read(&self.spring_const_id),
                reader.read(&self.damping_const_id),
            );
            self.wobble_physics.set_mass(reader.read(&self.mass_id));
            self.position_output_gain = reader.read(&self.output_gain_id);

            // Z dimension not really used we use same param as Y damping
            self.wobble_physics.set_aniso_damping(
                reader.read(&self.lateral_damping_id),
                reader.read(&self.vertical_damping_id),
                reader.read(&self.vertical_damping_id),
            );
        }
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.x_position_id, self.animation_position);
    }
}
impl Debug for EngineFlexPhysics {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nEngine Flex=> CG [{:.2};{:.2};{:.2}]",
            self.wobble_physics.position()[0] * self.position_output_gain,
            self.wobble_physics.position()[1] * self.position_output_gain,
            self.wobble_physics.position()[2] * self.position_output_gain
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
        Self {
            engines_flex_updater: MaxStepLoop::new(Self::ENGINES_FLEX_SIM_TIME_STEP),
            engines_flex: (1..=N)
                .map(|engine_number| EngineFlexPhysics::new(context, engine_number))
                .collect(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, pylons_accelerations: [Acceleration; N]) {
        self.engines_flex_updater.update(context);

        for cur_time_step in self.engines_flex_updater {
            for (engine_flex, pylons_acceleration) in
                &mut self.engines_flex.iter_mut().zip(pylons_accelerations)
            {
                engine_flex.update(&context.with_delta(cur_time_step), pylons_acceleration);
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

#[cfg(test)]
mod tests {
    use super::*;

    use crate::simulation::{
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    };

    use ntest::assert_about_eq;
    use std::time::Duration;

    struct EngineFlexTestAircraft {
        engines_flex: EnginesFlexiblePhysics<4>,
    }
    impl EngineFlexTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engines_flex: EnginesFlexiblePhysics::new(context),
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.engines_flex
                .update(context, [Acceleration::default(); 4]);
        }
    }
    impl Aircraft for EngineFlexTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.update(context);
        }
    }
    impl SimulationElement for EngineFlexTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.engines_flex.accept(visitor);
            visitor.visit(self);
        }
    }

    fn show_animation_positions(test_bed: &mut SimulationTestBed<EngineFlexTestAircraft>) {
        let engine_1_position: f64 = test_bed.read_by_name("ENGINE_1_WOBBLE_X_POSITION");
        let engine_2_position: f64 = test_bed.read_by_name("ENGINE_2_WOBBLE_X_POSITION");
        let engine_3_position: f64 = test_bed.read_by_name("ENGINE_3_WOBBLE_X_POSITION");
        let engine_4_position: f64 = test_bed.read_by_name("ENGINE_4_WOBBLE_X_POSITION");

        println!(
            "E1 {:.2} E2 {:.2} E3 {:.2} E4 {:.2}",
            engine_1_position, engine_2_position, engine_3_position, engine_4_position
        );
    }

    #[test]
    fn check_init_positions_are_zero_point_five() {
        let mut test_bed = SimulationTestBed::new(EngineFlexTestAircraft::new);

        test_bed.run();

        let engine_1_position: f64 = test_bed.read_by_name("ENGINE_1_WOBBLE_X_POSITION");
        let engine_2_position: f64 = test_bed.read_by_name("ENGINE_2_WOBBLE_X_POSITION");
        let engine_3_position: f64 = test_bed.read_by_name("ENGINE_3_WOBBLE_X_POSITION");
        let engine_4_position: f64 = test_bed.read_by_name("ENGINE_4_WOBBLE_X_POSITION");

        assert_about_eq!(engine_1_position, 0.5);
        assert_about_eq!(engine_2_position, 0.5);
        assert_about_eq!(engine_3_position, 0.5);
        assert_about_eq!(engine_4_position, 0.5);
    }

    // Following test is ignored because it's hard to set static boundaries to desired results
    // Tuning is better done visually using dev mode to edit physical properties
    #[test]
    #[ignore]
    fn check_engines_move_in_light_turbulances() {
        let mut test_bed = SimulationTestBed::new(EngineFlexTestAircraft::new);

        for _ in 0..500 {
            test_bed.write_by_name("ACCELERATION BODY X", 5.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
            test_bed.write_by_name("ACCELERATION BODY X", -5.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
        }
    }

    // Following test is ignored because it's hard to set static boundaries to desired results
    // Tuning is better done visually using dev mode to edit physical properties
    #[test]
    #[ignore]
    fn check_engines_move_in_strong_turbulances() {
        let mut test_bed = SimulationTestBed::new(EngineFlexTestAircraft::new);

        for _ in 0..500 {
            test_bed.write_by_name("ACCELERATION BODY X", 15.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
            test_bed.write_by_name("ACCELERATION BODY X", -15.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
        }
    }
}
