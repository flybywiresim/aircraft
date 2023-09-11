use systems::{
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
    structural_flex::elevator_flex::FlexibleElevators,
    structural_flex::engine_wobble::EnginesFlexiblePhysics,
    structural_flex::wing_flex::WingFlexA380,
    structural_flex::SurfaceVibrationGenerator,
};

use uom::si::{f64::*, ratio::ratio};

pub struct A380StructuralFlex {
    ground_weight_ratio_id: VariableIdentifier,

    engines_flex_physics: EnginesFlexiblePhysics<4>,
    elevators_flex_physics: FlexibleElevators,
    wing_flex: WingFlexA380,

    surface_vibrations: SurfaceVibrationGenerator,
}
impl A380StructuralFlex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            ground_weight_ratio_id: context
                .get_identifier("GROUND_WEIGHT_ON_WHEELS_RATIO".to_owned()),

            engines_flex_physics: EnginesFlexiblePhysics::new(context),
            elevators_flex_physics: FlexibleElevators::new(context),
            wing_flex: WingFlexA380::new(context),

            surface_vibrations: SurfaceVibrationGenerator::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        outer_inner_elevator_aero_torques: [(Torque, Torque); 2],
        up_down_rudder_aero_torques: (Torque, Torque),
        spoiler_positions: ([Ratio; 8], [Ratio; 8]),
        aileron_positions: ([Ratio; 3], [Ratio; 3]),
        flaps_positions: ([Ratio; 1], [Ratio; 1]),
    ) {
        self.elevators_flex_physics.update(
            context,
            outer_inner_elevator_aero_torques,
            up_down_rudder_aero_torques,
            self.surface_vibrations.surface_vibration_acceleration(),
        );

        self.wing_flex.update(
            context,
            self.surface_vibrations.surface_vibration_acceleration(),
            spoiler_positions,
            aileron_positions,
            flaps_positions,
        );

        self.engines_flex_physics
            .update(context, self.wing_flex.accelerations_at_engines_pylons());

        self.surface_vibrations
            .update(context, self.wing_flex.ground_weight_ratio());
    }
}
impl SimulationElement for A380StructuralFlex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.elevators_flex_physics.accept(visitor);
        self.engines_flex_physics.accept(visitor);
        self.wing_flex.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.ground_weight_ratio_id,
            self.wing_flex.ground_weight_ratio().get::<ratio>(),
        );
    }
}
