use systems::{
    accept_iterable,
    air_conditioning::{cabin_air::CabinZone, AirConditioningSystem, DuctTemperature},
    shared::{CabinAltitude, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, UpdateContext,
    },
};
use uom::si::{f64::*, volume::cubic_meter};

pub(super) struct A320AirConditioning {
    a320cabin: A320Cabin,
    air_conditioning_system: AirConditioningSystem,
}

impl A320AirConditioning {
    pub fn new() -> Self {
        let cabin_zone_ids: Vec<&str> = vec!["CKPT", "FWD", "AFT"];

        Self {
            a320cabin: A320Cabin::new(),
            air_conditioning_system: AirConditioningSystem::new(cabin_zone_ids),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        pressurization: &impl CabinAltitude,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.a320cabin
            .update(context, &self.air_conditioning_system);
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
    cabin_zone: [CabinZone; 3],
    cabin_passengers: usize,
}

impl A320Cabin {
    // TODO: Improve volume according to specs
    const A320_CABIN_VOLUME: f64 = 400.; //m3
    const A320_COCKPIT_VOLUME: f64 = 60.;

    fn new() -> Self {
        Self {
            cabin_zone: [
                CabinZone::new(
                    "CKPT".to_string(),
                    Volume::new::<cubic_meter>(Self::A320_COCKPIT_VOLUME),
                    2,
                ),
                CabinZone::new(
                    "FWD".to_string(),
                    Volume::new::<cubic_meter>(Self::A320_CABIN_VOLUME / 2.),
                    174 / 2,
                ),
                CabinZone::new(
                    "AFT".to_string(),
                    Volume::new::<cubic_meter>(Self::A320_CABIN_VOLUME / 2.),
                    174 / 2,
                ),
            ],
            cabin_passengers: 174, //TODO: Read simvar
        }
    }

    fn update(&mut self, context: &UpdateContext, duct_temperature: &impl DuctTemperature) {
        for zone in self.cabin_zone.iter_mut() {
            zone.update(
                context,
                (self.cabin_passengers / 2) as usize,
                duct_temperature,
            ); // TODO Read simvar for pax numbers
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
                let zone_passengers_1: usize = reader.read("PAX_TOTAL_ROWS_1_6");
                let zone_passengers_2: usize = reader.read("PAX_TOTAL_ROWS_7_13");
                zone.update_number_of_passengers(zone_passengers_1 + zone_passengers_2);
            } else if zone.zone_id() == "AFT" {
                let zone_passengers_1: usize = reader.read("PAX_TOTAL_ROWS_14_21");
                let zone_passengers_2: usize = reader.read("PAX_TOTAL_ROWS_22_29");
                zone.update_number_of_passengers(zone_passengers_1 + zone_passengers_2);
            }
        }
    }
}
