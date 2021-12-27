use systems::{
    accept_iterable,
    air_conditioning::{
        cabin_air::CabinZone, AirConditioningSystem, DuctTemperature, PackFlow, ZoneType,
    },
    shared::{Cabin, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::{f64::*, mass_rate::kilogram_per_second, volume::cubic_meter};

pub(super) struct A320AirConditioning {
    a320_cabin: A320Cabin,
    a320_air_conditioning_system: AirConditioningSystem<3>,
}

impl A320AirConditioning {
    pub fn new(context: &mut InitContext) -> Self {
        let cabin_zones: [ZoneType; 3] =
            [ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)];

        Self {
            a320_cabin: A320Cabin::new(context),
            a320_air_conditioning_system: AirConditioningSystem::new(context, cabin_zones),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        pressurization: &impl Cabin,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.a320_air_conditioning_system
            .update(context, engines, pressurization, lgciu);
        self.a320_cabin.update(
            context,
            &self.a320_air_conditioning_system,
            &self.a320_air_conditioning_system,
            pressurization,
        );
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
    const A320_CABIN_VOLUME_CUBIC_METER: f64 = 400.; // m3
    const A320_COCKPIT_VOLUME_CUBIC_METER: f64 = 20.; // m3

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
                    Some([(1, 6), (7, 13)]),
                ),
                CabinZone::new(
                    context,
                    ZoneType::Cabin(2),
                    Volume::new::<cubic_meter>(Self::A320_CABIN_VOLUME_CUBIC_METER / 2.),
                    0,
                    Some([(14, 21), (22, 29)]),
                ),
            ],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        duct_temperature: &impl DuctTemperature,
        pack_flow: &impl PackFlow,
        pressurization: &impl Cabin,
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

impl SimulationElement for A320Cabin {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cabin_zone, visitor);

        visitor.visit(self);
    }
}
