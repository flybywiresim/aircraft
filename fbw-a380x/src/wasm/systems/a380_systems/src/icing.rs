use systems::{
    icing_state::{IcingState, PassiveIcingElement},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};

use std::time::Duration;

pub struct Icing {
    cockpit_icing_stick: IcingState,
}
impl Icing {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            cockpit_icing_stick: IcingState::new(
                context,
                "ICING_STICK_INDICATOR",
                Duration::from_secs(120),
                Duration::from_secs(200),
                None,
            ),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.cockpit_icing_stick
            .update(context, None::<&PassiveIcingElement>);
    }
}
impl SimulationElement for Icing {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.cockpit_icing_stick.accept(visitor);
    }
}
