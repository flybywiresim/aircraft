use self::{fuel::A320Fuel, pneumatic::A320PneumaticOverheadPanel};
use crate::{
    apu::{
        AuxiliaryPowerUnit, AuxiliaryPowerUnitFireOverheadPanel, AuxiliaryPowerUnitOverheadPanel,
    },
    simulator::{Aircraft, SimulatorVisitable, SimulatorVisitor, UpdateContext},
};

mod electrical;
pub use electrical::*;

mod fuel;

mod pneumatic;

pub struct A320 {
    apu: AuxiliaryPowerUnit,
    apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
    apu_overhead: AuxiliaryPowerUnitOverheadPanel,
    pneumatic_overhead: A320PneumaticOverheadPanel,
    electrical_overhead: A320ElectricalOverheadPanel,
    fuel: A320Fuel,
}
impl A320 {
    pub fn new() -> A320 {
        A320 {
            apu: AuxiliaryPowerUnit::new_aps3200(),
            apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(),
            apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(),
            pneumatic_overhead: A320PneumaticOverheadPanel::new(),
            electrical_overhead: A320ElectricalOverheadPanel::new(),
            fuel: A320Fuel::new(),
        }
    }
}
impl Default for A320 {
    fn default() -> Self {
        Self::new()
    }
}
impl Aircraft for A320 {
    fn update(&mut self, context: &UpdateContext) {
        self.electrical_overhead.update(context);
        self.fuel.update();

        self.apu.update(
            context,
            &self.apu_overhead,
            &self.apu_fire_overhead,
            self.pneumatic_overhead.apu_bleed_is_on(),
            // This will be replaced when integrating the whole electrical system.
            // For now we use the same logic as found in the JavaScript code; ignoring whether or not
            // the engine generators are supplying electricity.
            self.electrical_overhead.apu_generator_is_on()
                && !(self.electrical_overhead.external_power_is_on()
                    && self.electrical_overhead.external_power_is_available()),
            self.fuel.left_inner_tank_has_fuel_remaining(),
        );
        self.apu_overhead.update_after_apu(&self.apu);
        self.pneumatic_overhead.update_after_apu(&self.apu);
    }
}
impl SimulatorVisitable for A320 {
    fn accept(&mut self, visitor: &mut Box<&mut dyn SimulatorVisitor>) {
        self.apu.accept(visitor);
        self.apu_fire_overhead.accept(visitor);
        self.apu_overhead.accept(visitor);
        self.electrical_overhead.accept(visitor);
        self.fuel.accept(visitor);
        self.pneumatic_overhead.accept(visitor);
    }
}
