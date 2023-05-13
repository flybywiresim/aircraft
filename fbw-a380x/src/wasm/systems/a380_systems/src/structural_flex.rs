use systems::{
    engine::engine_wing_flex::EnginesFlexiblePhysics,
    simulation::{
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    },
    structural_flex::elevator_flex::FlexibleElevators,
    structural_flex::wing_flex::WingFlexA380,
};

use uom::si::{
    acceleration::meter_per_second_squared,
    angle::radian,
    f64::*,
    force::newton,
    length::meter,
    mass::kilogram,
    mass_density::kilogram_per_cubic_meter,
    ratio::percent,
    ratio::ratio,
    velocity::{knot, meter_per_second},
};

pub struct A380StructuralFlex {
    engines_flex_physics: EnginesFlexiblePhysics<4>,
    elevators_flex_physics: FlexibleElevators,
    wing_flex: WingFlexA380,
}
impl A380StructuralFlex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            engines_flex_physics: EnginesFlexiblePhysics::new(context),
            elevators_flex_physics: FlexibleElevators::new(context),
            wing_flex: WingFlexA380::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        outter_inner_elevator_aero_torques: [(Torque, Torque); 2],
        up_down_rudder_aero_torques: (Torque, Torque),
    ) {
        self.elevators_flex_physics.update(
            context,
            outter_inner_elevator_aero_torques,
            up_down_rudder_aero_torques,
        );

        self.wing_flex.update(context);

        self.engines_flex_physics.update(context);
    }
}
impl SimulationElement for A380StructuralFlex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.elevators_flex_physics.accept(visitor);
        self.engines_flex_physics.accept(visitor);
        self.wing_flex.accept(visitor);

        visitor.visit(self);
    }
}
