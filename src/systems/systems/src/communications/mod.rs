pub mod audio;
pub mod receiver;

use crate::{
    simulation::{
        InitContext, UpdateContext, SimulationElementVisitor, SimulationElement,
    },
    communications::audio::AudioControlPanel,
};

pub struct Communications {
    acp: AudioControlPanel,
}

impl Communications {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            acp: AudioControlPanel::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
    ) {
        self.acp.update(context);
    }
}

impl SimulationElement for Communications {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.acp.accept(visitor);

        visitor.visit(self);
    }
}
