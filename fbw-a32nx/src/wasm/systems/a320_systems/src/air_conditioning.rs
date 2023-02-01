use systems::{
    accept_iterable,
    air_conditioning::{
        acs_controller::{Pack, PackFlowController},
        cabin_air::CabinZone,
        AirConditioningSystem, DuctTemperature, PackFlow, PackFlowControllers, ZoneType,
    },
    pneumatic::PneumaticContainer,
    pressurization::PressurizationOverheadPanel,
    shared::{
        CabinAir, CabinTemperature, ElectricalBusType, EngineBleedPushbutton, EngineCorrectedN1,
        EngineFirePushButtons, EngineStartState, GroundSpeed, LgciuWeightOnWheels,
        PackFlowValveState, PneumaticBleed,
    },
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::{f64::*, mass_rate::kilogram_per_second, volume::cubic_meter};

pub(super) struct A320AirConditioning {
    a320_cabin: A320Cabin,
    a320_air_conditioning_system: AirConditioningSystem<3, 2, 2>,
}

impl A320AirConditioning {
    pub fn new(context: &mut InitContext) -> Self {
        let cabin_zones: [ZoneType; 3] =
            [ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)];

        Self {
            a320_cabin: A320Cabin::new(context),
            a320_air_conditioning_system: AirConditioningSystem::new(
                context,
                cabin_zones,
                vec![
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::AlternatingCurrent(1),
                ],
                vec![
                    ElectricalBusType::DirectCurrent(2),
                    ElectricalBusType::AlternatingCurrent(2),
                ],
                ElectricalBusType::AlternatingCurrent(1),
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl GroundSpeed,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<2>,
        pressurization: &impl CabinAir,
        pressurization_overhead: &PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.a320_air_conditioning_system.update(
            context,
            adirs,
            &self.a320_cabin,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pneumatic_overhead,
            pressurization,
            pressurization_overhead,
            lgciu,
        );
        self.a320_cabin.update(
            context,
            &self.a320_air_conditioning_system,
            &self.a320_air_conditioning_system,
            pressurization,
        );
    }

    pub fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        self.a320_air_conditioning_system
            .mix_packs_air_update(pack_container);
    }
}

impl PackFlowControllers<3, 2> for A320AirConditioning {
    fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<3, 2> {
        self.a320_air_conditioning_system
            .pack_flow_controller(pack_id)
    }
}

impl SimulationElement for A320AirConditioning {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.a320_cabin.accept(visitor);
        self.a320_air_conditioning_system.accept(visitor);

        visitor.visit(self);
    }
}

struct A320Cabin {
    cabin_zone: [CabinZone<2>; 3],
}

impl A320Cabin {
    // TODO: Improve volume according to specs
    const A320_CABIN_VOLUME_CUBIC_METER: f64 = 200.; // m3
    const A320_COCKPIT_VOLUME_CUBIC_METER: f64 = 10.; // m3

    fn new(context: &mut InitContext) -> Self {
        Self {
            cabin_zone: [
                CabinZone::new(
                    context,
                    ZoneType::Cockpit,
                    Volume::new::<cubic_meter>(Self::A320_COCKPIT_VOLUME_CUBIC_METER),
                    2,
                    None,
                ),
                CabinZone::new(
                    context,
                    ZoneType::Cabin(1),
                    Volume::new::<cubic_meter>(Self::A320_CABIN_VOLUME_CUBIC_METER / 2.),
                    0,
                    Some(["A", "B"]),
                ),
                CabinZone::new(
                    context,
                    ZoneType::Cabin(2),
                    Volume::new::<cubic_meter>(Self::A320_CABIN_VOLUME_CUBIC_METER / 2.),
                    0,
                    Some(["C", "D"]),
                ),
            ],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        duct_temperature: &impl DuctTemperature,
        pack_flow: &impl PackFlow,
        pressurization: &impl CabinAir,
    ) {
        let flow_rate_per_cubic_meter: MassRate = MassRate::new::<kilogram_per_second>(
            pack_flow.pack_flow().get::<kilogram_per_second>()
                / (Self::A320_CABIN_VOLUME_CUBIC_METER + Self::A320_COCKPIT_VOLUME_CUBIC_METER),
        );
        for zone in self.cabin_zone.iter_mut() {
            zone.update(
                context,
                duct_temperature,
                flow_rate_per_cubic_meter,
                pressurization,
            );
        }
    }
}

impl CabinTemperature for A320Cabin {
    fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature> {
        let mut cabin_temperature_vector = Vec::new();
        for zone in self.cabin_zone.iter() {
            cabin_temperature_vector.append(&mut zone.cabin_temperature())
        }
        cabin_temperature_vector
    }
}

impl SimulationElement for A320Cabin {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cabin_zone, visitor);

        visitor.visit(self);
    }
}
