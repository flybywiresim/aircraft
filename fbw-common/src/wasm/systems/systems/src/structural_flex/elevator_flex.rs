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

pub struct ElevatorFlexPhysics {
    y_position_id: VariableIdentifier,

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
impl ElevatorFlexPhysics {
    pub fn new(context: &mut InitContext, side: &str) -> Self {
        Self {
            y_position_id: context.get_identifier(format!("ELEVATOR_{}_WOBBLE_Y_POSITION", side)),
            spring_const_id: context.get_identifier("ELEVATOR_WOBBLE_DEV_K_CONST".to_owned()),
            damping_const_id: context.get_identifier("ELEVATOR_WOBBLE_DEV_DAMP_CONST".to_owned()),
            mass_id: context.get_identifier("ELEVATOR_WOBBLE_DEV_MASS".to_owned()),
            output_gain_id: context.get_identifier("ELEVATOR_WOBBLE_DEV_OUT_GAIN".to_owned()),
            lateral_damping_id: context.get_identifier("ELEVATOR_WOBBLE_DEV_XDAMP".to_owned()),
            vertical_damping_id: context.get_identifier("ELEVATOR_WOBBLE_DEV_YDAMP".to_owned()),
            dev_mode_enable_id: context.get_identifier("ELEVATOR_WOBBLE_DEV_ENABLE".to_owned()),

            wobble_physics: WobblePhysics::new(
                GravityEffect::NoGravity,
                Vector3::default(),
                300.,
                5.,
                40000.,
                100.,
                150.,
                10.,
                Vector3::new(200., 50., 200.),
                5.,
            ),

            position_output_gain: 5.,

            animation_position: 0.5,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.wobble_physics.update(context);

        self.update_animation_position();
    }

    fn update_animation_position(&mut self) {
        let cg_position = self.wobble_physics.position();

        let limited_pos = (self.position_output_gain * cg_position[1])
            .min(1.)
            .max(-1.);

        self.animation_position = (limited_pos + 1.) / 2.;
    }
}
impl SimulationElement for ElevatorFlexPhysics {
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
        writer.write(&self.y_position_id, self.animation_position);
    }
}
impl Debug for ElevatorFlexPhysics {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "\nElevator Flex=> CG [{:.2};{:.2};{:.2}]",
            self.wobble_physics.position()[0] * self.position_output_gain,
            self.wobble_physics.position()[1] * self.position_output_gain,
            self.wobble_physics.position()[2] * self.position_output_gain
        )
    }
}

pub struct FlexibleElevators {
    flex_updater: MaxStepLoop,
    elevators_flex: [ElevatorFlexPhysics; 2],
}
impl FlexibleElevators {
    const ELEVATOR_FLEX_SIM_TIME_STEP: Duration = Duration::from_millis(10);

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            flex_updater: MaxStepLoop::new(Self::ELEVATOR_FLEX_SIM_TIME_STEP),
            elevators_flex: [
                ElevatorFlexPhysics::new(context, "LEFT"),
                ElevatorFlexPhysics::new(context, "RIGHT"),
            ],
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.flex_updater.update(context);

        for cur_time_step in self.flex_updater {
            for elevator_flex in &mut self.elevators_flex {
                elevator_flex.update(&context.with_delta(cur_time_step));
            }
        }
    }
}
impl SimulationElement for FlexibleElevators {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.elevators_flex, visitor);

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
        elevators_flex: FlexibleElevators,
    }
    impl EngineFlexTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                elevators_flex: FlexibleElevators::new(context),
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.elevators_flex.update(context);
        }
    }
    impl Aircraft for EngineFlexTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.update(context);
        }
    }
    impl SimulationElement for EngineFlexTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.elevators_flex.accept(visitor);
            visitor.visit(self);
        }
    }

    fn show_animation_positions(test_bed: &mut SimulationTestBed<EngineFlexTestAircraft>) {
        let left_position: f64 = test_bed.read_by_name("ELEVATOR_LEFT_WOBBLE_Y_POSITION");
        let right_position: f64 = test_bed.read_by_name("ELEVATOR_RIGHT_WOBBLE_Y_POSITION");

        println!("Eleft {:.2} Eright {:.2}", left_position, right_position);
    }

    #[test]
    fn check_init_positions_are_zero_point_five() {
        let mut test_bed = SimulationTestBed::new(EngineFlexTestAircraft::new);

        test_bed.run();

        let left_position: f64 = test_bed.read_by_name("ELEVATOR_LEFT_WOBBLE_Y_POSITION");
        let right_position: f64 = test_bed.read_by_name("ELEVATOR_RIGHT_WOBBLE_Y_POSITION");

        assert_about_eq!(left_position, 0.5);
        assert_about_eq!(right_position, 0.5);
    }

    // Following test is ignored because it's hard to set static boundaries to desired results
    // Tuning is better done visually using dev mode to edit physical properties
    #[test]
    #[ignore]
    fn check_elevators_move_in_light_turbulances() {
        let mut test_bed = SimulationTestBed::new(EngineFlexTestAircraft::new);

        for _ in 0..500 {
            test_bed.write_by_name("ACCELERATION BODY Y", 5.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
            test_bed.write_by_name("ACCELERATION BODY Y", -5.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
        }
    }

    // Following test is ignored because it's hard to set static boundaries to desired results
    // Tuning is better done visually using dev mode to edit physical properties
    #[test]
    #[ignore]
    fn check_elevators_move_in_strong_turbulances() {
        let mut test_bed = SimulationTestBed::new(EngineFlexTestAircraft::new);

        for _ in 0..500 {
            test_bed.write_by_name("ACCELERATION BODY Y", 15.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
            test_bed.write_by_name("ACCELERATION BODY Y", -15.);
            test_bed.run_with_delta(Duration::from_secs_f64(0.5));
            show_animation_positions(&mut test_bed);
        }
    }
}
