use crate::{
    overhead::OnOffPushButton,
    simulator::{
        SimulatorReadState, SimulatorReadWritable, SimulatorVisitable, SimulatorVisitor,
        UpdateContext,
    },
};

pub struct A320ElectricalOverheadPanel {
    apu_gen: OnOffPushButton,
    ext_pwr: OnOffPushButton,
}
impl A320ElectricalOverheadPanel {
    pub fn new() -> A320ElectricalOverheadPanel {
        A320ElectricalOverheadPanel {
            apu_gen: OnOffPushButton::new_on(),
            ext_pwr: OnOffPushButton::new_on(),
        }
    }

    pub fn update(&mut self, _: &UpdateContext) {}

    pub fn external_power_is_available(&self) -> bool {
        self.ext_pwr.shows_available()
    }

    pub fn external_power_is_on(&self) -> bool {
        self.ext_pwr.is_on()
    }

    pub fn apu_generator_is_on(&self) -> bool {
        self.apu_gen.is_on()
    }
}
impl SimulatorVisitable for A320ElectricalOverheadPanel {
    fn accept(&mut self, visitor: &mut Box<&mut dyn SimulatorVisitor>) {
        visitor.visit(&mut Box::new(self));
    }
}
impl SimulatorReadWritable for A320ElectricalOverheadPanel {
    fn read(&mut self, state: &SimulatorReadState) {
        self.ext_pwr.set_available(state.external_power_available);
        self.ext_pwr.set(state.external_power_sw_on);
        self.apu_gen.set(state.apu_gen_sw_on);
    }
}
