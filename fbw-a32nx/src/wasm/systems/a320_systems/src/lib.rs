extern crate systems;

mod air_conditioning;
mod airframe;
mod electrical;
mod fuel;
pub mod hydraulic;
mod landing_gear;
mod navigation;
mod payload;
mod pneumatic;
mod power_consumption;

use self::{
    air_conditioning::{A320AirConditioning, A320PressurizationOverheadPanel},
    fuel::A320Fuel,
    payload::A320Payload,
    pneumatic::{A320Pneumatic, A320PneumaticOverheadPanel},
};
use airframe::A320Airframe;
use electrical::{
    A320Electrical, A320ElectricalOverheadPanel, A320EmergencyElectricalOverheadPanel,
    APU_START_MOTOR_BUS_TYPE,
};
use hydraulic::{A320Hydraulic, A320HydraulicOverheadPanel};
use landing_gear::LandingGearControlInterfaceUnitSet;
use navigation::A320RadioAltimeters;
use power_consumption::A320PowerConsumption;
use systems::enhanced_gpwc::EnhancedGroundProximityWarningComputer;
use systems::simulation::InitContext;
use uom::si::{f64::Length, length::nautical_mile};

use systems::{
    apu::{
        Aps3200ApuGenerator, Aps3200StartMotor, AuxiliaryPowerUnit, AuxiliaryPowerUnitFactory,
        AuxiliaryPowerUnitFireOverheadPanel, AuxiliaryPowerUnitOverheadPanel,
    },
    electrical::{Electricity, ElectricitySource, ExternalPowerSource},
    engine::{leap_engine::LeapEngine, reverser_thrust::ReverserForce, EngineFireOverheadPanel},
    hydraulic::brake_circuit::AutobrakePanel,
    navigation::adirs::{
        AirDataInertialReferenceSystem, AirDataInertialReferenceSystemOverheadPanel,
    },
    shared::ElectricalBusType,
    simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext},
};

pub struct A320 {
    adirs: AirDataInertialReferenceSystem,
    adirs_overhead: AirDataInertialReferenceSystemOverheadPanel,
    air_conditioning: A320AirConditioning,
    apu: AuxiliaryPowerUnit<Aps3200ApuGenerator, Aps3200StartMotor, 1>,
    apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
    apu_overhead: AuxiliaryPowerUnitOverheadPanel,
    pneumatic_overhead: A320PneumaticOverheadPanel,
    pressurization_overhead: A320PressurizationOverheadPanel,
    electrical_overhead: A320ElectricalOverheadPanel,
    emergency_electrical_overhead: A320EmergencyElectricalOverheadPanel,
    payload: A320Payload,
    airframe: A320Airframe,
    fuel: A320Fuel,
    engine_1: LeapEngine,
    engine_2: LeapEngine,
    engine_fire_overhead: EngineFireOverheadPanel<2>,
    electrical: A320Electrical,
    power_consumption: A320PowerConsumption,
    ext_pwr: ExternalPowerSource,
    lgcius: LandingGearControlInterfaceUnitSet,
    hydraulic: A320Hydraulic,
    hydraulic_overhead: A320HydraulicOverheadPanel,
    autobrake_panel: AutobrakePanel,
    pneumatic: A320Pneumatic,
    radio_altimeters: A320RadioAltimeters,
    egpwc: EnhancedGroundProximityWarningComputer,
    reverse_thrust: ReverserForce,
}
impl A320 {
    pub fn new(context: &mut InitContext) -> A320 {
        A320 {
            adirs: AirDataInertialReferenceSystem::new(context),
            adirs_overhead: AirDataInertialReferenceSystemOverheadPanel::new(context),
            air_conditioning: A320AirConditioning::new(context),
            apu: AuxiliaryPowerUnitFactory::new_aps3200(
                context,
                1,
                APU_START_MOTOR_BUS_TYPE,
                ElectricalBusType::DirectCurrentBattery,
                ElectricalBusType::DirectCurrentBattery,
            ),
            apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(context),
            apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(context),
            pneumatic_overhead: A320PneumaticOverheadPanel::new(context),
            pressurization_overhead: A320PressurizationOverheadPanel::new(context),
            electrical_overhead: A320ElectricalOverheadPanel::new(context),
            emergency_electrical_overhead: A320EmergencyElectricalOverheadPanel::new(context),
            payload: A320Payload::new(context),
            airframe: A320Airframe::new(context),
            fuel: A320Fuel::new(context),
            engine_1: LeapEngine::new(context, 1),
            engine_2: LeapEngine::new(context, 2),
            engine_fire_overhead: EngineFireOverheadPanel::new(context),
            electrical: A320Electrical::new(context),
            power_consumption: A320PowerConsumption::new(context),
            ext_pwr: ExternalPowerSource::new(context, 1),
            lgcius: LandingGearControlInterfaceUnitSet::new(
                context,
                ElectricalBusType::DirectCurrentEssential,
                ElectricalBusType::DirectCurrentGndFltService,
            ),
            hydraulic: A320Hydraulic::new(context),
            hydraulic_overhead: A320HydraulicOverheadPanel::new(context),
            autobrake_panel: AutobrakePanel::new(context),
            pneumatic: A320Pneumatic::new(context),
            radio_altimeters: A320RadioAltimeters::new(context),
            egpwc: EnhancedGroundProximityWarningComputer::new(
                context,
                ElectricalBusType::DirectCurrent(1),
                vec![
                    Length::new::<nautical_mile>(10.0),
                    Length::new::<nautical_mile>(20.0),
                    Length::new::<nautical_mile>(40.0),
                    Length::new::<nautical_mile>(80.0),
                    Length::new::<nautical_mile>(160.0),
                    Length::new::<nautical_mile>(320.0),
                ],
                0,
            ),
            reverse_thrust: ReverserForce::new(context),
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
            self.lgcius.lgciu1(),
        );

        self.electrical_overhead
            .update_after_electrical(&self.electrical, electricity);
        self.emergency_electrical_overhead
            .update_after_electrical(context, &self.electrical);
        self.payload.update(context);
        self.airframe
            .update(&self.fuel, &self.payload, &self.payload);
    }

    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.apu.update_after_power_distribution();
        self.apu_overhead.update_after_apu(&self.apu);

        self.lgcius.update(
            context,
            self.hydraulic.gear_system(),
            self.ext_pwr.output_potential().is_powered(),
        );

        self.radio_altimeters.update(context);

        self.hydraulic.update(
            context,
            &self.engine_1,
            &self.engine_2,
            &self.hydraulic_overhead,
            &self.autobrake_panel,
            &self.engine_fire_overhead,
            &self.lgcius,
            &self.emergency_electrical_overhead,
            &self.electrical,
            &self.pneumatic,
            &self.adirs,
        );

        self.reverse_thrust.update(
            context,
            [&self.engine_1, &self.engine_2],
            self.hydraulic.reversers_position(),
        );

        self.pneumatic.update_hydraulic_reservoir_spatial_volumes(
            self.hydraulic.green_reservoir(),
            self.hydraulic.blue_reservoir(),
            self.hydraulic.yellow_reservoir(),
        );

        self.hydraulic_overhead.update(&self.hydraulic);

        self.adirs.update(context, &self.adirs_overhead);
        self.adirs_overhead.update(context, &self.adirs);

        self.power_consumption.update(context);

        self.pneumatic.update(
            context,
            [&self.engine_1, &self.engine_2],
            &self.pneumatic_overhead,
            &self.engine_fire_overhead,
            &self.apu,
            &self.air_conditioning,
            [self.lgcius.lgciu1(), self.lgcius.lgciu2()],
        );
        self.air_conditioning
            .mix_packs_air_update(self.pneumatic.packs());
        self.air_conditioning.update(
            context,
            &self.adirs,
            [&self.engine_1, &self.engine_2],
            &self.engine_fire_overhead,
            &self.payload,
            &self.pneumatic,
            &self.pressurization_overhead,
            [self.lgcius.lgciu1(), self.lgcius.lgciu2()],
        );

        self.egpwc.update(&self.adirs, self.lgcius.lgciu1());
    }
}
impl SimulationElement for A320 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adirs.accept(visitor);
        self.adirs_overhead.accept(visitor);
        self.air_conditioning.accept(visitor);
        self.apu.accept(visitor);
        self.apu_fire_overhead.accept(visitor);
        self.apu_overhead.accept(visitor);
        self.payload.accept(visitor);
        self.airframe.accept(visitor);
        self.electrical_overhead.accept(visitor);
        self.emergency_electrical_overhead.accept(visitor);
        self.fuel.accept(visitor);
        self.pneumatic_overhead.accept(visitor);
        self.pressurization_overhead.accept(visitor);
        self.engine_1.accept(visitor);
        self.engine_2.accept(visitor);
        self.engine_fire_overhead.accept(visitor);
        self.electrical.accept(visitor);
        self.power_consumption.accept(visitor);
        self.ext_pwr.accept(visitor);
        self.lgcius.accept(visitor);
        self.radio_altimeters.accept(visitor);
        self.autobrake_panel.accept(visitor);
        self.hydraulic.accept(visitor);
        self.hydraulic_overhead.accept(visitor);
        self.pneumatic.accept(visitor);
        self.egpwc.accept(visitor);
        self.reverse_thrust.accept(visitor);

        visitor.visit(self);
    }
}
