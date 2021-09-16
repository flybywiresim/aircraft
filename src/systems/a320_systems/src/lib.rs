#![allow(clippy::suspicious_operation_groupings)]

mod electrical;
mod fuel;
mod hydraulic;
mod pneumatic;
mod power_consumption;

use self::{fuel::A320Fuel, pneumatic::A320PneumaticOverheadPanel};
use electrical::{
    A320Electrical, A320ElectricalOverheadPanel, A320EmergencyElectricalOverheadPanel,
    APU_START_MOTOR_BUS_TYPE,
};
use hydraulic::{A320Hydraulic, A320HydraulicOverheadPanel};
use pneumatic::A320Pneumatic;
use power_consumption::A320PowerConsumption;
use systems::{
    apu::{
        Aps3200ApuGenerator, Aps3200StartMotor, AuxiliaryPowerUnit, AuxiliaryPowerUnitFactory,
        AuxiliaryPowerUnitFireOverheadPanel, AuxiliaryPowerUnitOverheadPanel,
    },
    electrical::{Electricity, ElectricitySource, ExternalPowerSource},
    engine::{leap_engine::LeapEngine, EngineFireOverheadPanel},
    hydraulic::brake_circuit::AutobrakePanel,
    landing_gear::{LandingGear, LandingGearControlInterfaceUnit},
    navigation::adirs::{
        AirDataInertialReferenceSystem, AirDataInertialReferenceSystemOverheadPanel,
    },
    pressurization::Pressurization,
    shared::ElectricalBusType,
    simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext},
};

pub struct A320 {
    adirs: AirDataInertialReferenceSystem,
    adirs_overhead: AirDataInertialReferenceSystemOverheadPanel,
    apu: AuxiliaryPowerUnit<Aps3200ApuGenerator, Aps3200StartMotor>,
    apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
    apu_overhead: AuxiliaryPowerUnitOverheadPanel,
    pneumatic_overhead: A320PneumaticOverheadPanel,
    electrical_overhead: A320ElectricalOverheadPanel,
    emergency_electrical_overhead: A320EmergencyElectricalOverheadPanel,
    fuel: A320Fuel,
    engine_1: LeapEngine,
    engine_2: LeapEngine,
    engine_fire_overhead: EngineFireOverheadPanel,
    electrical: A320Electrical,
    power_consumption: A320PowerConsumption,
    ext_pwr: ExternalPowerSource,
    lgciu1: LandingGearControlInterfaceUnit,
    lgciu2: LandingGearControlInterfaceUnit,
    hydraulic: A320Hydraulic,
    hydraulic_overhead: A320HydraulicOverheadPanel,
    autobrake_panel: AutobrakePanel,
    landing_gear: LandingGear,
    pressurization: Pressurization,
    pneumatic: A320Pneumatic,
}
impl A320 {
    pub fn new(electricity: &mut Electricity) -> A320 {
        A320 {
            adirs: AirDataInertialReferenceSystem::new(),
            adirs_overhead: AirDataInertialReferenceSystemOverheadPanel::new(),
            apu: AuxiliaryPowerUnitFactory::new_aps3200(
                1,
                electricity,
                APU_START_MOTOR_BUS_TYPE,
                ElectricalBusType::DirectCurrentBattery,
                ElectricalBusType::DirectCurrentBattery,
            ),
            apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(),
            apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(),
            pneumatic_overhead: A320PneumaticOverheadPanel::new(),
            electrical_overhead: A320ElectricalOverheadPanel::new(),
            emergency_electrical_overhead: A320EmergencyElectricalOverheadPanel::new(),
            fuel: A320Fuel::new(),
            engine_1: LeapEngine::new(1),
            engine_2: LeapEngine::new(2),
            engine_fire_overhead: EngineFireOverheadPanel::new(),
            electrical: A320Electrical::new(electricity),
            power_consumption: A320PowerConsumption::new(),
            ext_pwr: ExternalPowerSource::new(electricity),
            lgciu1: LandingGearControlInterfaceUnit::new(ElectricalBusType::DirectCurrentEssential),
            lgciu2: LandingGearControlInterfaceUnit::new(ElectricalBusType::DirectCurrent(2)),
            hydraulic: A320Hydraulic::new(),
            hydraulic_overhead: A320HydraulicOverheadPanel::new(),
            autobrake_panel: AutobrakePanel::new(),
            landing_gear: LandingGear::new(),
            pressurization: Pressurization::new(),
            pneumatic: A320Pneumatic::new(),
        }
    }
}
impl Aircraft for A320 {
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
    ) {
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
            self.pneumatic.apu_bleed_air_valve(),
            self.fuel.left_inner_tank_has_fuel_remaining(),
        );

        self.electrical.update(
            context,
            electricity,
            &self.ext_pwr,
            &self.electrical_overhead,
            &self.emergency_electrical_overhead,
            &mut self.apu,
            &self.apu_overhead,
            &self.engine_fire_overhead,
            [&self.engine_1, &self.engine_2],
            &self.hydraulic,
            &self.landing_gear,
        );

        self.electrical_overhead
            .update_after_electrical(&self.electrical, electricity);
        self.emergency_electrical_overhead
            .update_after_electrical(context, &self.electrical);
    }

    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.apu.update_after_power_distribution();
        self.apu_overhead.update_after_apu(&self.apu);

        self.lgciu1.update(
            &self.landing_gear,
            self.ext_pwr.output_potential().is_powered(),
        );
        self.lgciu2.update(
            &self.landing_gear,
            self.ext_pwr.output_potential().is_powered(),
        );
        self.pressurization
            .update(context, [&self.engine_1, &self.engine_2]);

        self.hydraulic.update(
            context,
            &self.engine_1,
            &self.engine_2,
            &self.hydraulic_overhead,
            &self.autobrake_panel,
            &self.engine_fire_overhead,
            &self.lgciu1,
            &self.lgciu2,
            &self.emergency_electrical_overhead,
            &self.electrical,
        );

        self.hydraulic_overhead.update(&self.hydraulic);

        self.adirs.update(context, &self.adirs_overhead);
        self.adirs_overhead.update(context, &self.adirs);

        self.power_consumption.update(context);

        self.pneumatic.update(
            context,
            [&self.engine_1, &self.engine_2],
            &mut self.pneumatic_overhead,
            &self.engine_fire_overhead,
            &self.hydraulic,
        );
    }
}
impl SimulationElement for A320 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adirs.accept(visitor);
        self.adirs_overhead.accept(visitor);
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
        self.lgciu1.accept(visitor);
        self.lgciu2.accept(visitor);
        self.autobrake_panel.accept(visitor);
        self.hydraulic.accept(visitor);
        self.hydraulic_overhead.accept(visitor);
        self.landing_gear.accept(visitor);
        self.pressurization.accept(visitor);
        self.pneumatic.accept(visitor);

        visitor.visit(self);
    }
}
