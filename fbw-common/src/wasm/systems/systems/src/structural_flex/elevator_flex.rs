use std::time::Duration;

use crate::{
    physics::{GravityEffect, WobblePhysics},
    shared::update_iterator::MaxStepLoop,
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use uom::si::{acceleration::meter_per_second_squared, f64::*, torque::newton_meter};

use nalgebra::Vector3;
use std::fmt::Debug;

#[derive(PartialEq, Clone, Copy)]
enum ElevatorSide {
    Left,
    Right,
}

struct AftConeFlexPhysics {
    position_id: VariableIdentifier,
    wobble_physics: WobblePhysics,

    position_output_gain: f64,

    animation_position: f64,
}
impl AftConeFlexPhysics {
    // What is the gain from a torque value to how much we want to flex the rudder animation
    const AERODYNAMIC_TORQUE_TO_ANIMATION_DEFLECTION_GAIN: f64 = 0.00001;

    // Upper surface is further from rudder root so it has more force to flex the rudder. This is the gain defining how much
    //      stronger it is to flex the rudder relative to lower surface
    const AERODYNAMIC_FLEX_COEF_FOR_UPPER_RUDDER_SURFACE: f64 = 1.5;

    const SURFACE_VIBRATION_SENSITIVITY: f64 = 1.0;

    fn new(context: &mut InitContext) -> Self {
        Self {
            position_id: context.get_identifier("AFT_FLEX_POSITION".to_owned()),

            wobble_physics: WobblePhysics::new(
                GravityEffect::NoGravity,
                Vector3::default(),
                300.,
                5.,
                40000.,
                100.,
                300.,
                10.,
                Vector3::new(200., 200., 200.),
                5.,
            ),

            position_output_gain: 2.,

            animation_position: 0.5,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        rudder_aero_torques: (Torque, Torque),
        surface_vibration_acceleration: Acceleration,
    ) {
        self.wobble_physics.update(
            context,
            Vector3::new(
                0.,
                (surface_vibration_acceleration * Self::SURFACE_VIBRATION_SENSITIVITY)
                    .get::<meter_per_second_squared>(),
                0.,
            ),
            Vector3::new(0., 3.4, -25.),
        );

        self.update_animation_position(rudder_aero_torques);
    }

    fn update_animation_position(&mut self, rudder_aero_torques: (Torque, Torque)) {
        let cg_position = self.wobble_physics.position();

        let aero_deflection = Self::AERODYNAMIC_TORQUE_TO_ANIMATION_DEFLECTION_GAIN
            * (Self::AERODYNAMIC_FLEX_COEF_FOR_UPPER_RUDDER_SURFACE
                * rudder_aero_torques.0.get::<newton_meter>()
                + rudder_aero_torques.1.get::<newton_meter>());

        let limited_pos = (self.position_output_gain * (cg_position[0] + cg_position[1])
            + aero_deflection)
            .min(1.)
            .max(-1.);

        self.animation_position = (limited_pos + 1.) / 2.;
    }
}
impl SimulationElement for AftConeFlexPhysics {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.animation_position);
    }
}

struct ElevatorFlexPhysics {
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

    side: ElevatorSide,
}
impl ElevatorFlexPhysics {
    // What is the gain from a torque value to how much we want to flex the elevator animation
    const AERODYNAMIC_TORQUE_TO_ANIMATION_DEFLECTION_GAIN: f64 = 0.00003;

    // Outer surface is further from elevator root so it has more force to flex the elevator. This is the gain defining how much
    //      stronger it is to flex the elevator relative to inner surface
    const AERODYNAMIC_FLEX_COEF_FOR_OUTER_ELEVATOR_SURFACE: f64 = 1.5;

    const SURFACE_VIBRATION_SENSITIVITY: f64 = 1.0;

    fn new(context: &mut InitContext, side: ElevatorSide) -> Self {
        Self {
            y_position_id: if side == ElevatorSide::Left {
                context.get_identifier("ELEVATOR_LEFT_WOBBLE_Y_POSITION".to_owned())
            } else {
                context.get_identifier("ELEVATOR_RIGHT_WOBBLE_Y_POSITION".to_owned())
            },
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
                250.,
                10.,
                Vector3::new(200., 100., 200.),
                5.,
            ),

            position_output_gain: 2.5,

            animation_position: 0.5,

            side,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        outer_inner_elevator_aero_torques: (Torque, Torque),
        surface_vibration_acceleration: Acceleration,
    ) {
        self.wobble_physics.update(
            context,
            Vector3::new(
                0.,
                (surface_vibration_acceleration * Self::SURFACE_VIBRATION_SENSITIVITY)
                    .get::<meter_per_second_squared>(),
                0.,
            ),
            Vector3::new(0., 3.4, -28.2),
        );

        self.update_animation_position(outer_inner_elevator_aero_torques);
    }

    fn update_animation_position(&mut self, elevator_aero_torques: (Torque, Torque)) {
        // We set left side negative to get that torsion visual effect
        let cg_position_y = if self.side == ElevatorSide::Left {
            -self.wobble_physics.position()[1]
        } else {
            self.wobble_physics.position()[1]
        };

        let aero_deflection = Self::AERODYNAMIC_TORQUE_TO_ANIMATION_DEFLECTION_GAIN
            * (Self::AERODYNAMIC_FLEX_COEF_FOR_OUTER_ELEVATOR_SURFACE
                * elevator_aero_torques.0.get::<newton_meter>()
                + elevator_aero_torques.1.get::<newton_meter>());

        let limited_pos = (self.position_output_gain * cg_position_y + aero_deflection)
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
    aft_cone_flex: AftConeFlexPhysics,
}
impl FlexibleElevators {
    const ELEVATOR_FLEX_SIM_TIME_STEP: Duration = Duration::from_millis(10);

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            flex_updater: MaxStepLoop::new(Self::ELEVATOR_FLEX_SIM_TIME_STEP),
            elevators_flex: [
                ElevatorFlexPhysics::new(context, ElevatorSide::Left),
                ElevatorFlexPhysics::new(context, ElevatorSide::Right),
            ],
            aft_cone_flex: AftConeFlexPhysics::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        outer_inner_elevator_aero_torques: [(Torque, Torque); 2],
        up_down_rudder_aero_torques: (Torque, Torque),
        surface_vibration_acceleration: Acceleration,
    ) {
        self.flex_updater.update(context);

        for cur_time_step in self.flex_updater {
            for (idx, elevator_flex) in &mut self.elevators_flex.iter_mut().enumerate() {
                elevator_flex.update(
                    &context.with_delta(cur_time_step),
                    outer_inner_elevator_aero_torques[idx],
                    surface_vibration_acceleration,
                );
            }

            self.aft_cone_flex.update(
                &context.with_delta(cur_time_step),
                up_down_rudder_aero_torques,
                surface_vibration_acceleration,
            );
        }
    }
}
impl SimulationElement for FlexibleElevators {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.elevators_flex, visitor);
        self.aft_cone_flex.accept(visitor);

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

        outer_elevator_aero_torque: Torque,
        inner_elevator_aero_torque: Torque,

        down_rudder_aero_torque: Torque,
        up_rudder_aero_torque: Torque,
    }
    impl EngineFlexTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                elevators_flex: FlexibleElevators::new(context),

                outer_elevator_aero_torque: Torque::default(),
                inner_elevator_aero_torque: Torque::default(),
                down_rudder_aero_torque: Torque::default(),
                up_rudder_aero_torque: Torque::default(),
            }
        }

        fn update(&mut self, context: &UpdateContext) {
            self.elevators_flex.update(
                context,
                [
                    (
                        self.outer_elevator_aero_torque,
                        self.inner_elevator_aero_torque,
                    ),
                    (
                        self.outer_elevator_aero_torque,
                        self.inner_elevator_aero_torque,
                    ),
                ],
                (self.up_rudder_aero_torque, self.down_rudder_aero_torque),
                Acceleration::default(),
            );
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
        let aft_position: f64 = test_bed.read_by_name("AFT_FLEX_POSITION");

        assert_about_eq!(left_position, 0.5);
        assert_about_eq!(right_position, 0.5);
        assert_about_eq!(aft_position, 0.5);
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
