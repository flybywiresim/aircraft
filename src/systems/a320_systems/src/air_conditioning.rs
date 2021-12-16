use systems::{
    accept_iterable,
    air_conditioning::{cabin_air::CabinZone, AirConditioningSystem, DuctTemperature, PackFlow},
    shared::{CabinAltitude, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        UpdateContext, VariableIdentifier,
    },
};
use uom::si::{f64::*, mass_rate::kilogram_per_second, volume::cubic_meter};

pub(super) struct A320AirConditioning {
    a320cabin: A320Cabin,
    air_conditioning_system: AirConditioningSystem,
}

impl A320AirConditioning {
    pub fn new(context: &mut InitContext) -> Self {
        let cabin_zone_ids: Vec<&str> = vec!["CKPT", "FWD", "AFT"];

        Self {
            a320cabin: A320Cabin::new(context),
            air_conditioning_system: AirConditioningSystem::new(context, cabin_zone_ids),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        pressurization: &impl CabinAltitude,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.a320cabin.update(
            context,
            &self.air_conditioning_system,
            &self.air_conditioning_system,
            pressurization,
        );
        self.air_conditioning_system
            .update(context, engines, pressurization, lgciu);
    }
}

impl SimulationElement for A320AirConditioning {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.a320cabin.accept(visitor);
        self.air_conditioning_system.accept(visitor);

        visitor.visit(self);
    }
}

struct A320Cabin {
    pax_rows_1_6_id: VariableIdentifier,
    pax_rows_7_13_id: VariableIdentifier,
    pax_rows_14_21_id: VariableIdentifier,
    pax_rows_22_29_id: VariableIdentifier,

    cabin_zone: [CabinZone; 3],
}

impl A320Cabin {
    // TODO: Improve volume according to specs
    const A320_CABIN_VOLUME_CUBIC_METER: f64 = 400.; // m3
    const A320_COCKPIT_VOLUME_CUBIC_METER: f64 = 20.; // m3

    fn new(context: &mut InitContext) -> Self {
        Self {
            pax_rows_1_6_id: context.get_identifier("PAX_TOTAL_ROWS_1_6".to_owned()),
            pax_rows_7_13_id: context.get_identifier("PAX_TOTAL_ROWS_7_13".to_owned()),
            pax_rows_14_21_id: context.get_identifier("PAX_TOTAL_ROWS_14_21".to_owned()),
            pax_rows_22_29_id: context.get_identifier("PAX_TOTAL_ROWS_22_29".to_owned()),

            cabin_zone: [
                CabinZone::new(
                    context,
                    "CKPT",
                    Volume::new::<cubic_meter>(Self::A320_COCKPIT_VOLUME_CUBIC_METER),
                    2,
                ),
                CabinZone::new(
                    context,
                    "FWD",
                    Volume::new::<cubic_meter>(Self::A320_CABIN_VOLUME_CUBIC_METER / 2.),
                    0,
                ),
                CabinZone::new(
                    context,
                    "AFT",
                    Volume::new::<cubic_meter>(Self::A320_CABIN_VOLUME_CUBIC_METER / 2.),
                    0,
                ),
            ],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        duct_temperature: &impl DuctTemperature,
        pack_flow: &impl PackFlow,
        pressurization: &impl CabinAltitude,
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

    fn read(&mut self, reader: &mut SimulatorReader) {
        for zone in self.cabin_zone.iter_mut() {
            if zone.zone_id() == "FWD" {
                let zone_passengers_1: u8 = reader.read(&self.pax_rows_1_6_id);
                let zone_passengers_2: u8 = reader.read(&self.pax_rows_7_13_id);
                zone.update_number_of_passengers(zone_passengers_1 + zone_passengers_2);
            } else if zone.zone_id() == "AFT" {
                let zone_passengers_1: u8 = reader.read(&self.pax_rows_14_21_id);
                let zone_passengers_2: u8 = reader.read(&self.pax_rows_22_29_id);
                zone.update_number_of_passengers(zone_passengers_1 + zone_passengers_2);
            }
        }
    }
}
