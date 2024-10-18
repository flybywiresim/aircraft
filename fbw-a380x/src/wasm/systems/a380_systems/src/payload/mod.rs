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

pub enum A380Pax {
    MainFwdA,
    MainFwdB,
    MainMid1A,
    MainMid1B,
    MainMid1C,
    MainMid2A,
    MainMid2B,
    MainMid2C,
    MainAftA,
    MainAftB,
    UpperFwd,
    UpperMidA,
    UpperMidB,
    UpperAft,
}
impl From<A380Pax> for usize {
    fn from(value: A380Pax) -> Self {
        value as usize
    }
}
impl From<usize> for A380Pax {
    fn from(value: usize) -> Self {
        match value {
            0 => A380Pax::MainFwdA,
            1 => A380Pax::MainFwdB,
            2 => A380Pax::MainMid1A,
            3 => A380Pax::MainMid1B,
            4 => A380Pax::MainMid1C,
            5 => A380Pax::MainMid2A,
            6 => A380Pax::MainMid2B,
            7 => A380Pax::MainMid2C,
            8 => A380Pax::MainAftA,
            9 => A380Pax::MainAftB,
            10 => A380Pax::UpperFwd,
            11 => A380Pax::UpperMidA,
            12 => A380Pax::UpperMidB,
            13 => A380Pax::UpperAft,
            i => panic!("Cannot convert from {} to A380Pax.", i),
        }
    }
}
#[cfg(test)]
pub enum A380Cargo {
    Fwd,
    Aft,
    Bulk,
}
#[cfg(test)]
impl From<A380Cargo> for usize {
    fn from(value: A380Cargo) -> Self {
        value as usize
    }
}
#[cfg(test)]
impl From<usize> for A380Cargo {
    fn from(value: usize) -> Self {
        match value {
            0 => A380Cargo::Fwd,
            1 => A380Cargo::Aft,
            2 => A380Cargo::Bulk,
            i => panic!("Cannot convert from {} to A380Cargo.", i),
        }
    }
}
pub struct A380Payload {
    payload_manager: PayloadManager<14, 5, 3>,
}
impl A380Payload {
    // Note: These constants reflect flight_model.cfg values and will have to be updated in sync with the configuration
    pub const DEFAULT_PER_PAX_WEIGHT_KG: f64 = 84.;
    // TODO: Move into a toml cfg
    const A380_PAX: [PaxInfo<'static>; 14] = [
        PaxInfo {
            max_pax: 28,
            position: (75.7, 0., 7.1),
            pax_id: "PAX_MAIN_FWD_A",
            payload_id: "PAYLOAD_STATION_1_REQ",
        },
        PaxInfo {
            max_pax: 28,
            position: (75.7, 0., 7.1),
            pax_id: "PAX_MAIN_FWD_B",
            payload_id: "PAYLOAD_STATION_2_REQ",
        },
        // PAX MAIN FWD: 56
        PaxInfo {
            max_pax: 39,
            position: (30.6, 0., 7.1),
            pax_id: "PAX_MAIN_MID_1A",
            payload_id: "PAYLOAD_STATION_3_REQ",
        },
        PaxInfo {
            max_pax: 50,
            position: (30.6, 0., 7.1),
            pax_id: "PAX_MAIN_MID_1B",
            payload_id: "PAYLOAD_STATION_4_REQ",
        },
        PaxInfo {
            max_pax: 43,
            position: (30.6, 0., 7.1),
            pax_id: "PAX_MAIN_MID_1C",
            payload_id: "PAYLOAD_STATION_5_REQ",
        },
        // PAX MAIN MID 1: 132
        PaxInfo {
            max_pax: 48,
            position: (-11.1, 0., 7.1),
            pax_id: "PAX_MAIN_MID_2A",
            payload_id: "PAYLOAD_STATION_6_REQ",
        },
        PaxInfo {
            max_pax: 40,
            position: (-11.1, 0., 7.1),
            pax_id: "PAX_MAIN_MID_2B",
            payload_id: "PAYLOAD_STATION_7_REQ",
        },
        PaxInfo {
            max_pax: 36,
            position: (-11.1, 0., 7.1),
            pax_id: "PAX_MAIN_MID_2C",
            payload_id: "PAYLOAD_STATION_8_REQ",
        },
        // PAX MAIN MID 2: 124
        PaxInfo {
            max_pax: 42,
            position: (-46.9, 0., 7.1),
            pax_id: "PAX_MAIN_AFT_A",
            payload_id: "PAYLOAD_STATION_9_REQ",
        },
        PaxInfo {
            max_pax: 40,
            position: (-46.9, 0., 7.1),
            pax_id: "PAX_MAIN_AFT_B",
            payload_id: "PAYLOAD_STATION_10_REQ",
        },
        // PAX MAIN AFT: 82
        PaxInfo {
            max_pax: 14,
            position: (60.8, 0., 15.6),
            pax_id: "PAX_UPPER_FWD",
            payload_id: "PAYLOAD_STATION_11_REQ",
        },
        // PAX UPPER FWD: 14
        PaxInfo {
            max_pax: 30,
            position: (11.7, 0., 15.6),
            pax_id: "PAX_UPPER_MID_A",
            payload_id: "PAYLOAD_STATION_12_REQ",
        },
        PaxInfo {
            max_pax: 28,
            position: (11.7, 0., 15.6),
            pax_id: "PAX_UPPER_MID_B",
            payload_id: "PAYLOAD_STATION_13_REQ",
        },
        // PAX UPPER MID: 58
        PaxInfo {
            max_pax: 18,
            position: (-29.3, 0., 15.6),
            pax_id: "PAX_UPPER_AFT",
            payload_id: "PAYLOAD_STATION_14_REQ",
        },
        // PAX UPPER AFT: 18
    ];
    // TODO: Move into a toml cfg
    const A380_CARGO: [CargoInfo<'static>; 3] = [
        CargoInfo {
            max_cargo_kg: 28577.,
            position: (67.4, 0., -0.95),
            cargo_id: "CARGO_FWD",
            payload_id: "PAYLOAD_STATION_15_REQ",
        },
        CargoInfo {
            max_cargo_kg: 20310.,
            position: (-18.5, 0., -0.95),
            cargo_id: "CARGO_AFT",
            payload_id: "PAYLOAD_STATION_16_REQ",
        },
        CargoInfo {
            max_cargo_kg: 2513.,
            position: (-52.9, 0., -0.71),
            cargo_id: "CARGO_BULK",
            payload_id: "PAYLOAD_STATION_17_REQ",
        },
    ];

    pub fn new(context: &mut InitContext) -> Self {
        let per_pax_weight = Rc::new(Cell::new(Mass::new::<kilogram>(
            Self::DEFAULT_PER_PAX_WEIGHT_KG,
        )));
        let developer_state = Rc::new(Cell::new(0));
        let boarding_sounds = BoardingSounds::new(context);
        let pax = Self::A380_PAX.map(|p| {
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

        let cargo = Self::A380_CARGO.map(|c| {
            Cargo::new(
                context.get_identifier(c.cargo_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", c.cargo_id)),
                context.get_identifier(c.payload_id.to_owned()),
                Rc::clone(&developer_state),
                Vector3::new(c.position.0, c.position.1, c.position.2),
                Mass::new::<kilogram>(c.max_cargo_kg),
            )
        });
        let default_boarding_agent =
            BoardingAgent::new(None, [10, 13, 12, 11, 1, 0, 9, 8, 7, 6, 5, 4, 3, 2]);

        // TODO: Move into a toml cfg
        let boarding_agents = [
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:0".to_owned())),
                [10, 13, 12, 11, 1, 0, 9, 8, 7, 6, 5, 4, 3, 2],
            ), // M1L
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:2".to_owned())),
                [1, 0, 9, 8, 7, 6, 5, 2, 3, 4, 10, 11, 12, 13],
            ), // M2L
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:6".to_owned())),
                [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            ), // M4L
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:8".to_owned())),
                [13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            ), // M5L
            BoardingAgent::new(
                Some(context.get_identifier("INTERACTIVE POINT OPEN:10".to_owned())),
                [10, 13, 12, 11, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
            ), // U1L
        ];

        let passenger_deck = PassengerDeck::new(pax, default_boarding_agent, boarding_agents);
        let cargo_deck = CargoDeck::new(cargo);

        A380Payload {
            payload_manager: PayloadManager::new(
                context,
                per_pax_weight,
                developer_state,
                boarding_sounds,
                passenger_deck,
                cargo_deck,
                500,
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

impl NumberOfPassengers for A380Payload {
    fn number_of_passengers(&self, ps: usize) -> i8 {
        self.pax_num(ps)
    }
}
impl PassengerPayload for A380Payload {
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
impl CargoPayload for A380Payload {
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
impl SimulationElement for A380Payload {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.payload_manager.accept(visitor);

        visitor.visit(self);
    }
}
