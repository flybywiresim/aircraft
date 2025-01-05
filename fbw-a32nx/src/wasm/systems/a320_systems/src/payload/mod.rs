use nalgebra::Vector3;

use std::{cell::Cell, rc::Rc};

use uom::si::{f64::Mass, mass::kilogram};

use systems::{
    payload::{
        BoardingAgent, BoardingSounds, Cargo, CargoDeck, CargoInfo, CargoPayload,
        NumberOfPassengers, PassengerDeck, PassengerPayload, Pax, PaxInfo, PayloadManager,
    },
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};

#[cfg(test)]
mod test;

pub enum A320Pax {
    A,
    B,
    C,
    D,
}
impl From<A320Pax> for usize {
    fn from(value: A320Pax) -> Self {
        value as usize
    }
}
impl From<usize> for A320Pax {
    fn from(value: usize) -> Self {
        match value {
            0 => A320Pax::A,
            1 => A320Pax::B,
            2 => A320Pax::C,
            3 => A320Pax::D,
            i => panic!("Cannot convert from {} to A320Pax.", i),
        }
    }
}

#[cfg(test)]
pub enum A320Cargo {
    FwdBaggage,
    AftContainer,
    AftBaggage,
    AftBulkLoose,
}
#[cfg(test)]
impl From<A320Cargo> for usize {
    fn from(value: A320Cargo) -> Self {
        value as usize
    }
}
#[cfg(test)]
impl From<usize> for A320Cargo {
    fn from(value: usize) -> Self {
        match value {
            0 => A320Cargo::FwdBaggage,
            1 => A320Cargo::AftContainer,
            2 => A320Cargo::AftBaggage,
            3 => A320Cargo::AftBulkLoose,
            i => panic!("Cannot convert from {} to A320Cargo.", i),
        }
    }
}

pub struct A320Payload {
    payload_manager: PayloadManager<4, 3, 4>,
}
impl A320Payload {
    // Note: These constants reflect flight_model.cfg values and will have to be updated in sync with the configuration
    pub const DEFAULT_PER_PAX_WEIGHT_KG: f64 = 84.;
    const A320_PAX: [PaxInfo<'static>; 4] = [
        PaxInfo {
            max_pax: 36,
            position: (20.5, 0., 5.),
            pax_id: "PAX_A",
            payload_id: "PAYLOAD_STATION_1_REQ",
        },
        PaxInfo {
            max_pax: 42,
            position: (1.5, 0., 5.1),
            pax_id: "PAX_B",
            payload_id: "PAYLOAD_STATION_2_REQ",
        },
        PaxInfo {
            max_pax: 48,
            position: (-16.6, 0., 5.3),
            pax_id: "PAX_C",
            payload_id: "PAYLOAD_STATION_3_REQ",
        },
        PaxInfo {
            max_pax: 48,
            position: (-35.6, 0., 5.3),
            pax_id: "PAX_D",
            payload_id: "PAYLOAD_STATION_4_REQ",
        },
    ];

    const A320_CARGO: [CargoInfo<'static>; 4] = [
        CargoInfo {
            max_cargo_kg: 3402.,
            position: (17.3, 0., 0.),
            cargo_id: "CARGO_FWD_BAGGAGE_CONTAINER",
            payload_id: "PAYLOAD_STATION_5_REQ",
        },
        CargoInfo {
            max_cargo_kg: 2426.,
            position: (-24.1, 0., 1.),
            cargo_id: "CARGO_AFT_CONTAINER",
            payload_id: "PAYLOAD_STATION_6_REQ",
        },
        CargoInfo {
            max_cargo_kg: 2110.,
            position: (-34.1, 0., 1.2),
            cargo_id: "CARGO_AFT_BAGGAGE",
            payload_id: "PAYLOAD_STATION_7_REQ",
        },
        CargoInfo {
            max_cargo_kg: 1497.,
            position: (-42.4, 0., 1.4),
            cargo_id: "CARGO_AFT_BULK_LOOSE",
            payload_id: "PAYLOAD_STATION_8_REQ",
        },
    ];

    pub fn new(context: &mut InitContext) -> Self {
        let per_pax_weight = Rc::new(Cell::new(Mass::new::<kilogram>(
            Self::DEFAULT_PER_PAX_WEIGHT_KG,
        )));
        let developer_state = Rc::new(Cell::new(0));
        let boarding_sounds = BoardingSounds::new(context);
        let pax = Self::A320_PAX.map(|p| {
            Pax::new(
                context.get_identifier(p.pax_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", p.pax_id)),
                context.get_identifier(p.payload_id.to_owned()),
                developer_state.clone(),
                per_pax_weight.clone(),
                Vector3::new(p.position.0, p.position.1, p.position.2),
                p.max_pax,
            )
        });

        let cargo = Self::A320_CARGO.map(|c| {
            Cargo::new(
                context.get_identifier(c.cargo_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", c.cargo_id)),
                context.get_identifier(c.payload_id.to_owned()),
                developer_state.clone(),
                Vector3::new(c.position.0, c.position.1, c.position.2),
                Mass::new::<kilogram>(c.max_cargo_kg),
            )
        });
        let default_boarding_agent = BoardingAgent::new(None, [0, 1, 2, 3]);

        let boarding_agents = [
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:0".to_owned())),
                [0, 1, 2, 3],
            ),
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:1".to_owned())),
                [0, 1, 2, 3],
            ),
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:2".to_owned())),
                [3, 2, 1, 0],
            ),
        ];

        let passenger_deck = PassengerDeck::new(pax, default_boarding_agent, boarding_agents);
        let cargo_deck = CargoDeck::new(cargo);

        A320Payload {
            payload_manager: PayloadManager::new(
                context,
                per_pax_weight,
                developer_state,
                boarding_sounds,
                passenger_deck,
                cargo_deck,
                1000,
                5000,
            ),
        }
    }

    pub(crate) fn update(&mut self, context: &UpdateContext) {
        self.payload_manager.update(context.delta());
    }

    fn pax_num(&self, ps: usize) -> i8 {
        self.payload_manager.pax_num(ps)
    }

    #[cfg(test)]
    fn total_pax_num(&self) -> i32 {
        self.payload_manager.total_pax_num()
    }

    fn total_passenger_load(&self) -> Mass {
        self.payload_manager.total_passenger_load()
    }

    fn total_target_passenger_load(&self) -> Mass {
        self.payload_manager.total_target_passenger_load()
    }

    fn total_passenger_moment(&self) -> Vector3<f64> {
        self.payload_manager.total_passenger_moment()
    }

    fn total_target_passenger_moment(&self) -> Vector3<f64> {
        self.payload_manager.total_target_passenger_moment()
    }

    fn total_cargo_moment(&self) -> Vector3<f64> {
        self.payload_manager.total_cargo_moment()
    }

    fn total_target_cargo_moment(&self) -> Vector3<f64> {
        self.payload_manager.total_target_cargo_moment()
    }

    fn passenger_center_of_gravity(&self) -> Vector3<f64> {
        let total_pax_load = self.total_passenger_load().get::<kilogram>();
        if total_pax_load > 0. {
            self.total_passenger_moment() / total_pax_load
        } else {
            Vector3::zeros()
        }
    }

    fn target_passenger_center_of_gravity(&self) -> Vector3<f64> {
        let total_target_pax_load = self.total_target_passenger_load().get::<kilogram>();
        if total_target_pax_load > 0. {
            self.total_target_passenger_moment() / total_target_pax_load
        } else {
            Vector3::zeros()
        }
    }

    fn cargo_center_of_gravity(&self) -> Vector3<f64> {
        let total_cargo_load = self.total_cargo_load().get::<kilogram>();
        if total_cargo_load > 0. {
            self.total_cargo_moment() / total_cargo_load
        } else {
            Vector3::zeros()
        }
    }

    fn target_cargo_center_of_gravity(&self) -> Vector3<f64> {
        let total_target_cargo_load = self.total_target_cargo_load().get::<kilogram>();
        if total_target_cargo_load > 0. {
            self.total_target_cargo_moment() / total_target_cargo_load
        } else {
            Vector3::zeros()
        }
    }

    #[cfg(test)]
    fn max_pax(&self, ps: usize) -> i8 {
        self.payload_manager.max_pax(ps)
    }

    #[cfg(test)]
    fn cargo(&self, cs: usize) -> Mass {
        self.payload_manager.cargo(cs)
    }

    #[cfg(test)]
    fn cargo_payload(&self, cs: usize) -> Mass {
        self.payload_manager.cargo_payload(cs)
    }

    #[cfg(test)]
    fn pax_payload(&self, ps: usize) -> Mass {
        self.payload_manager.pax_payload(ps)
    }

    #[cfg(test)]
    fn override_pax_payload(&mut self, ps: usize, payload: Mass) {
        self.payload_manager.override_pax_payload(ps, payload)
    }

    #[cfg(test)]
    fn max_cargo(&self, cs: usize) -> Mass {
        self.payload_manager.max_cargo(cs)
    }

    #[cfg(test)]
    fn sound_pax_boarding_playing(&self) -> bool {
        self.payload_manager.sound_pax_boarding_playing()
    }

    #[cfg(test)]
    fn sound_pax_deboarding_playing(&self) -> bool {
        self.payload_manager.sound_pax_deboarding_playing()
    }

    #[cfg(test)]
    fn sound_pax_complete_playing(&self) -> bool {
        self.payload_manager.sound_pax_complete_playing()
    }

    #[cfg(test)]
    fn sound_pax_ambience_playing(&self) -> bool {
        self.payload_manager.sound_pax_ambience_playing()
    }
}

impl NumberOfPassengers for A320Payload {
    fn number_of_passengers(&self, ps: usize) -> i8 {
        self.pax_num(ps)
    }
}
impl PassengerPayload for A320Payload {
    fn total_passenger_load(&self) -> Mass {
        self.total_passenger_load()
    }

    fn total_target_passenger_load(&self) -> Mass {
        self.total_target_passenger_load()
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        self.passenger_center_of_gravity()
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.passenger_center_of_gravity().x
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        self.target_passenger_center_of_gravity()
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        self.target_passenger_center_of_gravity().x
    }
}
impl CargoPayload for A320Payload {
    fn total_cargo_load(&self) -> Mass {
        self.payload_manager.total_cargo_load()
    }

    fn total_target_cargo_load(&self) -> Mass {
        self.payload_manager.total_target_cargo_load()
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        self.cargo_center_of_gravity()
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.cargo_center_of_gravity().x
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        self.target_cargo_center_of_gravity()
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        self.target_cargo_center_of_gravity().x
    }
}
impl SimulationElement for A320Payload {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.payload_manager.accept(visitor);

        visitor.visit(self);
    }
}
