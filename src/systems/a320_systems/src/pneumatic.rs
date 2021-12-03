use systems::simulation::InitContext;
use systems::{
    overhead::OnOffFaultPushButton,
    simulation::{NestedElement, SimulationElement},
};

#[derive(NestedElement)]
pub struct A320PneumaticOverheadPanel {
    apu_bleed: OnOffFaultPushButton,
}
impl A320PneumaticOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        A320PneumaticOverheadPanel {
            apu_bleed: OnOffFaultPushButton::new_on(context, "PNEU_APU_BLEED"),
        }
    }

    pub fn apu_bleed_is_on(&self) -> bool {
        self.apu_bleed.is_on()
    }
}
impl SimulationElement for A320PneumaticOverheadPanel {}
