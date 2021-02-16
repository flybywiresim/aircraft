mod electrical;
mod fuel;
mod hydraulic;
mod pneumatic;

use self::{fuel::A320Fuel, pneumatic::A320PneumaticOverheadPanel};
use electrical::{A320Electrical, A320ElectricalOverheadPanel};
use hydraulic::A320Hydraulic;
use systems::{
    apu::{
        Aps3200ApuGenerator, AuxiliaryPowerUnit, AuxiliaryPowerUnitFactory,
        AuxiliaryPowerUnitFireOverheadPanel, AuxiliaryPowerUnitOverheadPanel,
    },
    electrical::{ExternalPowerSource},
    engine::Engine,
    simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext},
};

pub struct A320 {
    apu: AuxiliaryPowerUnit<Aps3200ApuGenerator>,
    apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
    apu_overhead: AuxiliaryPowerUnitOverheadPanel,
    pneumatic_overhead: A320PneumaticOverheadPanel,
    electrical_overhead: A320ElectricalOverheadPanel,
    fuel: A320Fuel,
    engine_1: Engine,
    engine_2: Engine,
    electrical: A320Electrical,
    ext_pwr: ExternalPowerSource,
    hydraulic: A320Hydraulic,
}
impl A320 {
    pub fn new() -> A320 {
        A320 {
            apu: AuxiliaryPowerUnitFactory::new_shutdown_aps3200(1),
            apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(),
            apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(),
            pneumatic_overhead: A320PneumaticOverheadPanel::new(),
            electrical_overhead: A320ElectricalOverheadPanel::new(),
            fuel: A320Fuel::new(),
            engine_1: Engine::new(1),
            engine_2: Engine::new(2),
            electrical: A320Electrical::new(),
            ext_pwr: ExternalPowerSource::new(),
            hydraulic: A320Hydraulic::new(),
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

        self.electrical.update(
            context,
            &self.engine_1,
            &self.engine_2,
            &self.apu,
            &self.ext_pwr,
            &self.hydraulic,
            &self.electrical_overhead,
        );
        self.electrical_overhead.update_after_elec(&self.electrical);
    }
}
impl SimulationElement for A320 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu.accept(visitor);
        self.apu_fire_overhead.accept(visitor);
        self.apu_overhead.accept(visitor);
        self.electrical_overhead.accept(visitor);
        self.fuel.accept(visitor);
        self.pneumatic_overhead.accept(visitor);
        self.engine_1.accept(visitor);
        self.engine_2.accept(visitor);
        self.electrical.accept(visitor);
        self.ext_pwr.accept(visitor);
        visitor.visit(self);
    }
}
