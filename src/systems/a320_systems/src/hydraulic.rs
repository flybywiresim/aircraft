use systems::simulation::{SimulationElement, UpdateContext};

pub struct A320Hydraulic {
    // Until hydraulic is implemented, we'll fake it with this boolean.
    blue_pressurised: bool,
}
impl A320Hydraulic {
    pub fn new() -> A320Hydraulic {
        A320Hydraulic {
            blue_pressurised: true,
        }
    }

    pub fn is_blue_pressurised(&self) -> bool {
        self.blue_pressurised
    }

    pub fn update(&mut self, _: &UpdateContext) {}
}
impl SimulationElement for A320Hydraulic {}
