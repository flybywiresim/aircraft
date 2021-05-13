mod electrical;
mod fuel;
mod hydraulic;
mod pneumatic;
mod power_consumption;

use self::{fuel::A320Fuel, pneumatic::A320PneumaticOverheadPanel};

use electrical::{
    A320Electrical, A320ElectricalOverheadPanel, A320ElectricalUpdateArguments,
    A320EmergencyElectricalOverheadPanel,
};

use hydraulic::{A320EngineFireOverheadPanel, A320Hydraulic, A320HydraulicOverheadPanel};

use power_consumption::A320PowerConsumption;
use systems::{
    apu::{
        Aps3200ApuGenerator, Aps3200StartMotor, AuxiliaryPowerUnit, AuxiliaryPowerUnitFactory,
        AuxiliaryPowerUnitFireOverheadPanel, AuxiliaryPowerUnitOverheadPanel,
    },
    electrical::{consumption::SuppliedPower, ElectricalSystem, ExternalPowerSource},
    engine::{leap_engine::LeapEngine, Engine},
    landing_gear::LandingGear,
    simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext},
};

pub struct A320 {
    apu: AuxiliaryPowerUnit<Aps3200ApuGenerator, Aps3200StartMotor>,
    apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
    apu_overhead: AuxiliaryPowerUnitOverheadPanel,
    pneumatic_overhead: A320PneumaticOverheadPanel,
    electrical_overhead: A320ElectricalOverheadPanel,
    emergency_electrical_overhead: A320EmergencyElectricalOverheadPanel,
    fuel: A320Fuel,
    engine_1: LeapEngine,
    engine_2: LeapEngine,
    engine_fire_overhead: A320EngineFireOverheadPanel,
    electrical: A320Electrical,
    power_consumption: A320PowerConsumption,
    ext_pwr: ExternalPowerSource,
    hydraulic: A320Hydraulic,
    hydraulic_overhead: A320HydraulicOverheadPanel,
    landing_gear: LandingGear,
}
impl A320 {
    pub fn new() -> A320 {
        A320 {
            apu: AuxiliaryPowerUnitFactory::new_aps3200(1),
            apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(),
            apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(),
            pneumatic_overhead: A320PneumaticOverheadPanel::new(),
            electrical_overhead: A320ElectricalOverheadPanel::new(),
            emergency_electrical_overhead: A320EmergencyElectricalOverheadPanel::new(),
            fuel: A320Fuel::new(),
            engine_1: LeapEngine::new(1),
            engine_2: LeapEngine::new(2),
            engine_fire_overhead: A320EngineFireOverheadPanel::new(),
            electrical: A320Electrical::new(),
            power_consumption: A320PowerConsumption::new(),
            ext_pwr: ExternalPowerSource::new(),
            hydraulic: A320Hydraulic::new(),
            hydraulic_overhead: A320HydraulicOverheadPanel::new(),
            landing_gear: LandingGear::new(),
        }
    }
}
impl Default for A320 {
    fn default() -> Self {
        Self::new()
    }
}
impl Aircraft for A320 {
    fn update_before_power_distribution(&mut self, context: &UpdateContext) {
        self.apu.update_before_electrical(
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

        self.electrical.update(
            context,
            &self.ext_pwr,
            &self.electrical_overhead,
            &self.emergency_electrical_overhead,
            &mut A320ElectricalUpdateArguments::new(
                [self.engine_1.corrected_n2(), self.engine_2.corrected_n2()],
                [
                    self.electrical_overhead.idg_1_push_button_released(),
                    self.electrical_overhead.idg_2_push_button_released(),
                ],
                &mut self.apu,
                self.hydraulic.is_blue_pressurised(),
                self.apu_overhead.master_is_on(),
                self.apu_overhead.start_is_on(),
                self.landing_gear.is_up_and_locked(),
            ),
        );

        self.apu.update_after_electrical();

        self.electrical_overhead
            .update_after_electrical(&self.electrical);
        self.emergency_electrical_overhead
            .update_after_electrical(context, &self.electrical);
        self.apu_overhead.update_after_apu(&self.apu);
    }

    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.hydraulic.update(
            context,
            &self.engine_1,
            &self.engine_2,
            &self.hydraulic_overhead,
            &self.engine_fire_overhead,
            &self.landing_gear,
        );

        self.hydraulic_overhead.update(&self.hydraulic);

        self.power_consumption.update(context);
    }

    fn get_supplied_power(&mut self) -> SuppliedPower {
        self.electrical.get_supplied_power()
    }
}
impl SimulationElement for A320 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu.accept(visitor);
        self.apu_fire_overhead.accept(visitor);
        self.apu_overhead.accept(visitor);
        self.electrical_overhead.accept(visitor);
        self.emergency_electrical_overhead.accept(visitor);
        self.fuel.accept(visitor);
        self.pneumatic_overhead.accept(visitor);
        self.engine_1.accept(visitor);
        self.engine_2.accept(visitor);
        self.engine_fire_overhead.accept(visitor);
        self.electrical.accept(visitor);
        self.power_consumption.accept(visitor);
        self.ext_pwr.accept(visitor);
        self.hydraulic.accept(visitor);
        self.hydraulic_overhead.accept(visitor);
        self.landing_gear.accept(visitor);

        visitor.visit(self);
    }
}
