extern crate systems;

mod air_conditioning;
mod airframe;
mod avionics_data_communication_network;
mod control_display_system;
mod electrical;
mod fire_and_smoke_protection;
mod fuel;
pub mod hydraulic;
mod icing;
mod navigation;
mod payload;
mod pneumatic;
mod power_consumption;
mod reverser;
mod structural_flex;

use self::{
    air_conditioning::{A380AirConditioning, A380PressurizationOverheadPanel},
    avionics_data_communication_network::A380AvionicsDataCommunicationNetwork,
    control_display_system::A380ControlDisplaySystem,
    fuel::A380Fuel,
    pneumatic::{A380Pneumatic, A380PneumaticOverheadPanel},
    structural_flex::A380StructuralFlex,
};
use airframe::A380Airframe;
use avionics_data_communication_network::A380AvionicsDataCommunicationNetworkSimvarTranslator;
use electrical::{
    A380Electrical, A380ElectricalOverheadPanel, A380EmergencyElectricalOverheadPanel,
    APU_START_MOTOR_BUS_TYPE,
};
use fire_and_smoke_protection::A380FireAndSmokeProtection;
use fuel::FuelLevel;
use hydraulic::{autobrakes::A380AutobrakePanel, A380Hydraulic, A380HydraulicOverheadPanel};
use icing::Icing;
use navigation::{A380AirDataInertialReferenceSystemBuilder, A380RadioAltimeters};
use payload::A380Payload;
use power_consumption::A380PowerConsumption;
use reverser::{A380ReverserController, A380Reversers};
use uom::si::{f64::Length, length::nautical_mile};

use systems::{
    accept_iterable,
    apu::{
        AuxiliaryPowerUnit, AuxiliaryPowerUnitFactory, AuxiliaryPowerUnitFireOverheadPanel,
        AuxiliaryPowerUnitOverheadPanel, Pw980ApuGenerator, Pw980Constants, Pw980StartMotor,
    },
    electrical::{Electricity, ElectricitySource, ExternalPowerSource},
    engine::{reverser_thrust::ReverserForce, trent_engine::TrentEngine, EngineFireOverheadPanel},
    enhanced_gpwc::EnhancedGroundProximityWarningComputer,
    landing_gear::{LandingGear, LandingGearControlInterfaceUnitSet},
    navigation::adirs::{
        AirDataInertialReferenceSystem, AirDataInertialReferenceSystemOverheadPanel,
    },
    shared::ElectricalBusType,
    simulation::{
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    },
};

pub struct A380 {
    adcn: A380AvionicsDataCommunicationNetwork,
    adcn_simvar_translation: A380AvionicsDataCommunicationNetworkSimvarTranslator,
    adirs: AirDataInertialReferenceSystem,
    adirs_overhead: AirDataInertialReferenceSystemOverheadPanel,
    air_conditioning: A380AirConditioning,
    apu: AuxiliaryPowerUnit<Pw980ApuGenerator, Pw980StartMotor, Pw980Constants, 2>,
    apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
    apu_overhead: AuxiliaryPowerUnitOverheadPanel,
    pneumatic_overhead: A380PneumaticOverheadPanel,
    pressurization_overhead: A380PressurizationOverheadPanel,
    electrical_overhead: A380ElectricalOverheadPanel,
    emergency_electrical_overhead: A380EmergencyElectricalOverheadPanel,
    payload: A380Payload,
    airframe: A380Airframe,
    fire_and_smoke_protection: A380FireAndSmokeProtection,
    fuel: A380Fuel,
    engine_1: TrentEngine,
    engine_2: TrentEngine,
    engine_3: TrentEngine,
    engine_4: TrentEngine,
    engine_fire_overhead: EngineFireOverheadPanel<4>,
    electrical: A380Electrical,
    power_consumption: A380PowerConsumption,
    ext_pwrs: [ExternalPowerSource; 4],
    lgcius: LandingGearControlInterfaceUnitSet,
    hydraulic: A380Hydraulic,
    hydraulic_overhead: A380HydraulicOverheadPanel,
    autobrake_panel: A380AutobrakePanel,
    landing_gear: LandingGear,
    pneumatic: A380Pneumatic,
    radio_altimeters: A380RadioAltimeters,
    cds: A380ControlDisplaySystem,
    egpwc: EnhancedGroundProximityWarningComputer,
    icing_simulation: Icing,
    structural_flex: A380StructuralFlex,

    engine_reverser_control: [A380ReverserController; 2],
    reversers_assembly: A380Reversers,
    reverse_thrust: ReverserForce,
}
impl A380 {
    pub fn new(context: &mut InitContext) -> A380 {
        let mut adcn = A380AvionicsDataCommunicationNetwork::new(context);
        let adcn_simvar_translation =
            A380AvionicsDataCommunicationNetworkSimvarTranslator::new(context, &mut adcn);
        let fuel = A380Fuel::new(context, &mut adcn);
        A380 {
            adcn,
            adcn_simvar_translation,
            adirs: A380AirDataInertialReferenceSystemBuilder::build(context),
            adirs_overhead: AirDataInertialReferenceSystemOverheadPanel::new(context),
            air_conditioning: A380AirConditioning::new(context),
            apu: AuxiliaryPowerUnitFactory::new_pw980(
                context,
                APU_START_MOTOR_BUS_TYPE,
                ElectricalBusType::DirectCurrentEssential,
                ElectricalBusType::DirectCurrentEssential,
            ),
            apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(context),
            apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(context),
            pneumatic_overhead: A380PneumaticOverheadPanel::new(context),
            pressurization_overhead: A380PressurizationOverheadPanel::new(context),
            electrical_overhead: A380ElectricalOverheadPanel::new(context),
            emergency_electrical_overhead: A380EmergencyElectricalOverheadPanel::new(context),
            payload: A380Payload::new(context),
            airframe: A380Airframe::new(context),
            fire_and_smoke_protection: A380FireAndSmokeProtection::new(context),
            fuel,
            engine_1: TrentEngine::new(context, 1),
            engine_2: TrentEngine::new(context, 2),
            engine_3: TrentEngine::new(context, 3),
            engine_4: TrentEngine::new(context, 4),
            engine_fire_overhead: EngineFireOverheadPanel::new(context),
            electrical: A380Electrical::new(context),
            power_consumption: A380PowerConsumption::new(context),
            ext_pwrs: [1, 2, 3, 4].map(|i| ExternalPowerSource::new(context, i)),
            lgcius: LandingGearControlInterfaceUnitSet::new(
                context,
                ElectricalBusType::DirectCurrentEssential,
                ElectricalBusType::DirectCurrentGndFltService,
            ),
            hydraulic: A380Hydraulic::new(context),
            hydraulic_overhead: A380HydraulicOverheadPanel::new(context),
            autobrake_panel: A380AutobrakePanel::new(context),
            landing_gear: LandingGear::new(context, true),
            pneumatic: A380Pneumatic::new(context),
            radio_altimeters: A380RadioAltimeters::new(context),
            cds: A380ControlDisplaySystem::new(context),
            egpwc: EnhancedGroundProximityWarningComputer::new(
                context,
                ElectricalBusType::AlternatingCurrentEssential,
                vec![
                    Length::new::<nautical_mile>(0.0),
                    Length::new::<nautical_mile>(10.0),
                    Length::new::<nautical_mile>(20.0),
                    Length::new::<nautical_mile>(40.0),
                    Length::new::<nautical_mile>(80.0),
                    Length::new::<nautical_mile>(160.0),
                    Length::new::<nautical_mile>(320.0),
                    Length::new::<nautical_mile>(640.0),
                ],
                3,
            ),

            icing_simulation: Icing::new(context),
            structural_flex: A380StructuralFlex::new(context),
            engine_reverser_control: [
                A380ReverserController::new(context, 2),
                A380ReverserController::new(context, 3),
            ],
            reversers_assembly: A380Reversers::new(context),
            reverse_thrust: ReverserForce::new(context),
        }
    }
}
impl Aircraft for A380 {
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
    ) {
        self.apu.update_before_electrical(
            context,
            &self.apu_overhead,
            self.fire_and_smoke_protection.apu_fire_on_ground(),
            &self.apu_fire_overhead,
            self.pneumatic_overhead.apu_bleed_is_on(),
            // This will be replaced when integrating the whole electrical system.
            // For now we use the same logic as found in the JavaScript code; ignoring whether or not
            // the engine generators are supplying electricity.
            (self.electrical_overhead.apu_generator_is_on(1)
                || self.electrical_overhead.apu_generator_is_on(2))
                && !(self.electrical_overhead.external_power_is_on(1)
                    && self.electrical_overhead.external_power_is_available(1)),
            self.pneumatic.apu_bleed_air_valve(),
            self.fuel.feed_four_tank_has_fuel(),
        );

        self.electrical.update(
            context,
            electricity,
            &self.ext_pwrs,
            &self.electrical_overhead,
            &self.emergency_electrical_overhead,
            &mut self.apu,
            &self.engine_fire_overhead,
            [
                &self.engine_1,
                &self.engine_2,
                &self.engine_3,
                &self.engine_4,
            ],
            self.lgcius.lgciu1(),
            &self.adirs,
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
        self.apu.update_after_power_distribution(
            &[
                &self.engine_1,
                &self.engine_2,
                &self.engine_3,
                &self.engine_4,
            ],
            [self.lgcius.lgciu1(), self.lgcius.lgciu2()],
        );
        self.apu_overhead.update_after_apu(&self.apu);

        self.adcn.update();
        self.adcn_simvar_translation.update(&self.adcn);
        self.lgcius.update(
            context,
            &self.landing_gear,
            self.hydraulic.gear_system(),
            self.ext_pwrs[0].output_potential().is_powered(),
        );

        self.fire_and_smoke_protection.update(
            context,
            &self.engine_fire_overhead,
            [self.lgcius.lgciu1(), self.lgcius.lgciu2()],
        );

        self.radio_altimeters.update(context);

        self.hydraulic.update(
            context,
            [
                &self.engine_1,
                &self.engine_2,
                &self.engine_3,
                &self.engine_4,
            ],
            &self.hydraulic_overhead,
            &self.autobrake_panel,
            &self.engine_fire_overhead,
            &self.lgcius,
            &self.pneumatic,
            &self.adirs,
        );

        self.pneumatic.update_hydraulic_reservoir_spatial_volumes(
            self.hydraulic.green_reservoir(),
            self.hydraulic.yellow_reservoir(),
        );

        self.hydraulic_overhead.update(&self.hydraulic);

        self.adirs.update(context, &self.adirs_overhead);
        self.adirs_overhead.update(context, &self.adirs);

        self.power_consumption.update(context);

        self.pneumatic.update(
            context,
            [
                &self.engine_1,
                &self.engine_2,
                &self.engine_3,
                &self.engine_4,
            ],
            &self.pneumatic_overhead,
            &self.engine_fire_overhead,
            &self.apu,
            &self.air_conditioning,
        );
        self.air_conditioning
            .mix_packs_air_update(self.pneumatic.packs());
        self.air_conditioning.update(
            context,
            &self.adirs,
            &self.hydraulic,
            &self.adcn,
            [
                &self.engine_1,
                &self.engine_2,
                &self.engine_3,
                &self.engine_4,
            ],
            &self.engine_fire_overhead,
            &self.payload,
            &self.pneumatic,
            &self.pneumatic_overhead,
            &self.pressurization_overhead,
            [self.lgcius.lgciu1(), self.lgcius.lgciu2()],
        );

        self.cds.update();

        self.egpwc.update(&self.adirs, self.lgcius.lgciu1());

        self.structural_flex.update(
            context,
            [
                self.hydraulic.left_elevator_aero_torques(),
                self.hydraulic.right_elevator_aero_torques(),
            ],
            self.hydraulic.up_down_rudder_aero_torques(),
            &self.hydraulic,
            &self.fuel,
        );
        self.cds.update();

        self.icing_simulation.update(context);

        self.egpwc.update(&self.adirs, self.lgcius.lgciu1());
        self.fuel.update(context, &self.adcn);

        self.engine_reverser_control[0].update(
            &self.engine_2,
            self.lgcius.lgciu1(),
            self.reversers_assembly.reverser_feedback(0),
        );
        self.engine_reverser_control[1].update(
            &self.engine_3,
            self.lgcius.lgciu2(),
            self.reversers_assembly.reverser_feedback(1),
        );

        self.reversers_assembly
            .update(context, &self.engine_reverser_control);

        self.reverse_thrust.update(
            context,
            [&self.engine_2, &self.engine_3],
            self.reversers_assembly.reversers_position(),
        );
    }
}
impl SimulationElement for A380 {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adcn.accept(visitor);
        self.adcn_simvar_translation.accept(visitor);
        self.adirs.accept(visitor);
        self.adirs_overhead.accept(visitor);
        self.air_conditioning.accept(visitor);
        self.apu.accept(visitor);
        self.apu_fire_overhead.accept(visitor);
        self.apu_overhead.accept(visitor);
        self.electrical_overhead.accept(visitor);
        self.emergency_electrical_overhead.accept(visitor);
        self.fire_and_smoke_protection.accept(visitor);
        self.fuel.accept(visitor);
        self.payload.accept(visitor);
        self.airframe.accept(visitor);
        self.pneumatic_overhead.accept(visitor);
        self.pressurization_overhead.accept(visitor);
        self.engine_1.accept(visitor);
        self.engine_2.accept(visitor);
        self.engine_3.accept(visitor);
        self.engine_4.accept(visitor);
        self.engine_fire_overhead.accept(visitor);
        self.electrical.accept(visitor);
        self.power_consumption.accept(visitor);
        accept_iterable!(self.ext_pwrs, visitor);
        self.lgcius.accept(visitor);
        self.radio_altimeters.accept(visitor);
        self.autobrake_panel.accept(visitor);
        self.hydraulic.accept(visitor);
        self.hydraulic_overhead.accept(visitor);
        self.landing_gear.accept(visitor);
        self.pneumatic.accept(visitor);
        self.cds.accept(visitor);
        self.egpwc.accept(visitor);
        self.icing_simulation.accept(visitor);
        self.structural_flex.accept(visitor);

        accept_iterable!(self.engine_reverser_control, visitor);
        self.reversers_assembly.accept(visitor);
        self.reverse_thrust.accept(visitor);

        visitor.visit(self);
    }
}
