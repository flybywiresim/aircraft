use systems::shared::{random_from_normal_distribution, LgciuInterface};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{f64::*, ratio::ratio};

struct A380AuxiliaryGearDoor {
    door_id: VariableIdentifier,

    speed_ratio_per_sec: f64,
    position: Ratio,
}
impl A380AuxiliaryGearDoor {
    const MEAN_SPEED_RAT_PER_S: f64 = 0.4;
    const STDEV_SPEED_RAT_PER_S: f64 = 0.03;
    pub fn new(context: &mut InitContext, side: &str) -> A380AuxiliaryGearDoor {
        A380AuxiliaryGearDoor {
            door_id: context.get_identifier(format!("SECONDARY_GEAR_DOOR_{}_POSITION", side)),

            speed_ratio_per_sec: random_from_normal_distribution(
                Self::MEAN_SPEED_RAT_PER_S,
                Self::STDEV_SPEED_RAT_PER_S,
            ),
            position: if context.start_gear_down() {
                Ratio::new::<ratio>(1.)
            } else {
                Ratio::default()
            },
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        lgciu: &impl LgciuInterface,
        has_hydraulics: bool,
    ) {
        if has_hydraulics {
            let should_open = lgciu.main_down_and_locked() && lgciu.gear_handle_is_down();

            let delta_position =
                Ratio::new::<ratio>(self.speed_ratio_per_sec * context.delta_as_secs_f64());

            self.position += if should_open {
                delta_position
            } else {
                -delta_position
            };

            self.position = Ratio::new::<ratio>(self.position.get::<ratio>().clamp(0., 1.));
        }
    }
}
impl SimulationElement for A380AuxiliaryGearDoor {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.door_id, self.position);
    }
}

pub struct A380AuxiliaryGearDoorSet {
    left_door: A380AuxiliaryGearDoor,
    right_door: A380AuxiliaryGearDoor,
}
impl A380AuxiliaryGearDoorSet {
    pub fn new(context: &mut InitContext) -> A380AuxiliaryGearDoorSet {
        A380AuxiliaryGearDoorSet {
            left_door: A380AuxiliaryGearDoor::new(context, "LEFT"),
            right_door: A380AuxiliaryGearDoor::new(context, "RIGHT"),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        lgciu: &impl LgciuInterface,
        has_hydraulics: bool,
    ) {
        self.left_door.update(context, lgciu, has_hydraulics);
        self.right_door.update(context, lgciu, has_hydraulics);
    }
}
impl SimulationElement for A380AuxiliaryGearDoorSet {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.left_door.accept(visitor);
        self.right_door.accept(visitor);

        visitor.visit(self);
    }
}
