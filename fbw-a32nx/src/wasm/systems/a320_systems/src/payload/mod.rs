use nalgebra::Vector3;

use std::{cell::Cell, rc::Rc, time::Duration};

use uom::si::{f64::Mass, mass::kilogram};

use systems::{
    accept_iterable,
    misc::{BoardingSounds, Gsx, GsxState},
    payload::{BoardingRate, Cargo, CargoInfo, Pax, PaxInfo},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

#[cfg(test)]
pub mod test;

pub trait NumberOfPassengers {
    fn number_of_passengers(&self, ps: usize) -> i8;
}

pub trait PassengerPayload {
    fn total_passenger_load(&self) -> Mass;
    fn total_target_passenger_load(&self) -> Mass;

    fn center_of_gravity(&self) -> Vector3<f64>;
    fn fore_aft_center_of_gravity(&self) -> f64;
    fn target_center_of_gravity(&self) -> Vector3<f64>;
    fn target_fore_aft_center_of_gravity(&self) -> f64;
}

pub trait CargoPayload {
    fn total_cargo_load(&self) -> Mass;
    fn total_target_cargo_load(&self) -> Mass;

    fn center_of_gravity(&self) -> Vector3<f64>;
    fn fore_aft_center_of_gravity(&self) -> f64;
    fn target_center_of_gravity(&self) -> Vector3<f64>;
    fn target_fore_aft_center_of_gravity(&self) -> f64;
}

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

#[allow(dead_code)]
pub enum A320Cargo {
    FwdBaggage,
    AftContainer,
    AftBaggage,
    AftBulkLoose,
}
impl From<A320Cargo> for usize {
    fn from(value: A320Cargo) -> Self {
        value as usize
    }
}
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
    developer_state_id: VariableIdentifier,
    is_boarding_id: VariableIdentifier,
    board_rate_id: VariableIdentifier,
    per_pax_weight_id: VariableIdentifier,

    developer_state: i8,
    is_boarding: bool,
    board_rate: BoardingRate,
    per_pax_weight: Rc<Cell<Mass>>,

    pax: [Pax; 4],
    cargo: [Cargo; 4],
    boarding_sounds: BoardingSounds,
    gsx: Gsx,
    time: Duration,
}
impl A320Payload {
    // Note: These constants reflect flight_model.cfg values and will have to be updated in sync with the configuration

    pub const DEFAULT_PER_PAX_WEIGHT_KG: f64 = 84.;

    const A320_PAX: [PaxInfo<'_>; 4] = [
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

    const A320_CARGO: [CargoInfo<'_>; 4] = [
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

        let pax: [Pax; 4] = Self::A320_PAX
            .iter()
            .map(|p| {
                Pax::new(
                    context.get_identifier(p.pax_id.to_owned()),
                    context.get_identifier(format!("{}_DESIRED", p.pax_id)),
                    context.get_identifier(p.payload_id.to_owned()),
                    Rc::clone(&per_pax_weight),
                    Vector3::new(p.position.0, p.position.1, p.position.2),
                    p.max_pax,
                )
            })
            .collect::<Vec<Pax>>()
            .try_into()
            .unwrap();

        let cargo: [Cargo; 4] = Self::A320_CARGO
            .iter()
            .map(|c| {
                Cargo::new(
                    context.get_identifier(c.cargo_id.to_owned()),
                    context.get_identifier(format!("{}_DESIRED", c.cargo_id)),
                    context.get_identifier(c.payload_id.to_owned()),
                    Vector3::new(c.position.0, c.position.1, c.position.2),
                    Mass::new::<kilogram>(c.max_cargo_kg),
                )
            })
            .collect::<Vec<Cargo>>()
            .try_into()
            .unwrap();

        A320Payload {
            developer_state_id: context.get_identifier("DEVELOPER_STATE".to_owned()),
            is_boarding_id: context.get_identifier("BOARDING_STARTED_BY_USR".to_owned()),
            board_rate_id: context.get_identifier("BOARDING_RATE".to_owned()),
            per_pax_weight_id: context.get_identifier("WB_PER_PAX_WEIGHT".to_owned()),

            developer_state: 0,
            is_boarding: false,
            board_rate: BoardingRate::Instant,
            per_pax_weight,
            boarding_sounds: BoardingSounds::new(
                context.get_identifier("SOUND_PAX_BOARDING".to_owned()),
                context.get_identifier("SOUND_PAX_DEBOARDING".to_owned()),
                context.get_identifier("SOUND_BOARDING_COMPLETE".to_owned()),
                context.get_identifier("SOUND_PAX_AMBIENCE".to_owned()),
            ),
            pax,
            cargo,
            gsx: Gsx::new(
                context.get_identifier("GSX_PAYLOAD_SYNC_ENABLED".to_owned()),
                context.get_identifier("FSDT_GSX_BOARDING_STATE".to_owned()),
                context.get_identifier("FSDT_GSX_DEBOARDING_STATE".to_owned()),
                context.get_identifier("FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL".to_owned()),
                context.get_identifier("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL".to_owned()),
                context.get_identifier("FSDT_GSX_BOARDING_CARGO_PERCENT".to_owned()),
                context.get_identifier("FSDT_GSX_DEBOARDING_CARGO_PERCENT".to_owned()),
            ),
            time: Duration::from_nanos(0),
        }
    }

    pub(crate) fn update(&mut self, context: &UpdateContext) {
        if !self.is_developer_state_active() {
            self.ensure_payload_sync()
        };

        if self.is_gsx_enabled() {
            self.stop_boarding();
            self.stop_boarding_sounds();
            self.update_extern_gsx(context);
        } else {
            self.update_intern(context);
        }
    }

    fn ensure_payload_sync(&mut self) {
        for ps in 0..Self::A320_PAX.len() {
            if !self.pax_is_sync(ps) {
                self.sync_pax(ps);
            }
        }

        for cs in 0..Self::A320_CARGO.len() {
            if !self.cargo_is_sync(cs) {
                self.sync_cargo(cs);
            }
        }
    }

    fn update_extern_gsx(&mut self, context: &UpdateContext) {
        self.update_gsx_deboarding(context);
        self.update_gsx_boarding(context);
    }

    fn update_gsx_deboarding(&mut self, _context: &UpdateContext) {
        self.update_pax_ambience();
        match self.gsx.deboarding_state() {
            GsxState::None | GsxState::Available | GsxState::NotAvailable | GsxState::Bypassed => {}
            GsxState::Requested => {
                self.update_cargo_loaded();
                self.reset_all_pax_targets();
                self.reset_all_cargo_targets();
            }
            GsxState::Completed => {
                self.move_all_payload();
                self.reset_cargo_loaded();
                self.reset_all_cargo_targets();
            }
            GsxState::Performing => {
                self.move_all_pax_num(
                    self.total_pax_num() - (self.total_max_pax() - self.gsx.pax_deboarding()),
                );
                self.load_all_cargo_percent(100. - self.gsx.cargo_deboarding_pct());
            }
        }
    }

    fn update_cargo_loaded(&mut self) {
        for cs in 0..Self::A320_CARGO.len() {
            self.cargo[cs].update_cargo_loaded()
        }
    }

    fn reset_cargo_loaded(&mut self) {
        for cs in 0..Self::A320_CARGO.len() {
            self.cargo[cs].reset_cargo_loaded()
        }
    }

    fn update_gsx_boarding(&mut self, _context: &UpdateContext) {
        self.update_pax_ambience();
        match self.gsx.boarding_state() {
            GsxState::None
            | GsxState::Available
            | GsxState::NotAvailable
            | GsxState::Bypassed
            | GsxState::Requested => {}
            GsxState::Completed => {
                self.board_cargo();
            }
            GsxState::Performing => {
                self.move_all_pax_num(self.gsx.pax_boarding() - self.total_pax_num());
                self.load_all_cargo_percent(self.gsx.cargo_boarding_pct());
            }
        }
    }

    fn update_intern(&mut self, context: &UpdateContext) {
        self.update_pax_ambience();

        if !self.is_boarding {
            self.time = Duration::from_nanos(0);
            self.stop_boarding_sounds();
            return;
        }

        let ms_delay = if self.board_rate() == BoardingRate::Instant {
            0
        } else if self.board_rate() == BoardingRate::Fast {
            1000
        } else {
            5000
        };

        let delta_time = context.delta();
        self.time += delta_time;
        if self.time.as_millis() > ms_delay {
            self.time = Duration::from_nanos(0);
            self.update_pax();
            self.update_cargo();
        }
        // Check sound before updating boarding status
        self.update_boarding_sounds();
        self.update_boarding_status();
    }

    fn update_boarding_status(&mut self) {
        if self.is_fully_loaded() {
            self.is_boarding = false;
        }
    }

    fn update_boarding_sounds(&mut self) {
        let pax_board = self.is_pax_boarding();
        self.play_sound_pax_boarding(pax_board);

        let pax_deboard = self.is_pax_deboarding();
        self.play_sound_pax_deboarding(pax_deboard);

        let pax_complete = self.is_pax_loaded() && self.is_boarding();
        self.play_sound_pax_complete(pax_complete);
    }

    fn update_pax_ambience(&mut self) {
        let pax_ambience = !self.has_no_pax();
        self.play_sound_pax_ambience(pax_ambience);
    }

    fn play_sound_pax_boarding(&mut self, playing: bool) {
        if playing {
            self.boarding_sounds.start_pax_boarding();
        } else {
            self.boarding_sounds.stop_pax_boarding();
        }
    }

    fn play_sound_pax_deboarding(&mut self, playing: bool) {
        if playing {
            self.boarding_sounds.start_pax_deboarding();
        } else {
            self.boarding_sounds.stop_pax_deboarding();
        }
    }

    fn play_sound_pax_complete(&mut self, playing: bool) {
        if playing {
            self.boarding_sounds.start_pax_complete();
        } else {
            self.boarding_sounds.stop_pax_complete();
        }
    }

    fn play_sound_pax_ambience(&mut self, playing: bool) {
        if playing {
            self.boarding_sounds.start_pax_ambience();
        } else {
            self.boarding_sounds.stop_pax_ambience();
        }
    }

    fn stop_boarding_sounds(&mut self) {
        self.boarding_sounds.stop_pax_boarding();
        self.boarding_sounds.stop_pax_deboarding();
        self.boarding_sounds.stop_pax_complete();
    }

    fn reset_all_pax_targets(&mut self) {
        for ps in 0..Self::A320_PAX.len() {
            self.reset_pax_target(ps);
        }
    }

    fn move_all_pax_num(&mut self, pax_diff: i32) {
        if pax_diff > 0 {
            for _ in 0..pax_diff {
                for ps in 0..Self::A320_PAX.len() {
                    if self.pax_is_target(ps) {
                        continue;
                    }
                    self.move_one_pax(ps);
                    break;
                }
            }
        }
    }

    fn update_pax(&mut self) {
        for ps in 0..Self::A320_PAX.len() {
            if self.pax_is_target(ps) {
                continue;
            }
            if self.board_rate == BoardingRate::Instant {
                self.move_all_pax(ps);
            } else {
                self.move_one_pax(ps);
                break;
            }
        }
    }

    fn reset_all_cargo_targets(&mut self) {
        for cs in 0..Self::A320_CARGO.len() {
            self.reset_cargo_target(cs);
        }
    }

    fn update_cargo(&mut self) {
        for cs in 0..Self::A320_CARGO.len() {
            if self.cargo_is_target(cs) {
                continue;
            }
            if self.board_rate == BoardingRate::Instant {
                self.move_all_cargo(cs);
            } else {
                self.move_one_cargo(cs);
                break;
            }
        }
    }

    fn is_developer_state_active(&self) -> bool {
        self.developer_state > 0
    }

    fn is_pax_boarding(&self) -> bool {
        for ps in 0..Self::A320_PAX.len() {
            if self.pax_num(ps) < self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_deboarding(&self) -> bool {
        for ps in 0..Self::A320_PAX.len() {
            if self.pax_num(ps) > self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_loaded(&self) -> bool {
        for ps in 0..Self::A320_PAX.len() {
            if !self.pax_is_target(ps) {
                return false;
            }
        }
        true
    }

    fn is_cargo_loaded(&self) -> bool {
        for cs in 0..Self::A320_CARGO.len() {
            if !self.cargo_is_target(cs) {
                return false;
            }
        }
        true
    }

    fn is_fully_loaded(&self) -> bool {
        self.is_pax_loaded() && self.is_cargo_loaded()
    }

    fn has_no_pax(&mut self) -> bool {
        for ps in 0..Self::A320_PAX.len() {
            let pax_num = 0;
            if self.pax_num(ps) == pax_num {
                return true;
            }
        }
        false
    }

    fn board_rate(&self) -> BoardingRate {
        self.board_rate
    }

    #[allow(dead_code)]
    fn sound_pax_boarding_playing(&self) -> bool {
        self.boarding_sounds.pax_boarding()
    }

    #[allow(dead_code)]
    fn sound_pax_ambience_playing(&self) -> bool {
        self.boarding_sounds.pax_ambience()
    }

    #[allow(dead_code)]
    fn sound_pax_complete_playing(&self) -> bool {
        self.boarding_sounds.pax_complete()
    }

    #[allow(dead_code)]
    fn sound_pax_deboarding_playing(&self) -> bool {
        self.boarding_sounds.pax_deboarding()
    }

    fn pax_num(&self, ps: usize) -> i8 {
        self.pax[ps].pax_num() as i8
    }

    fn pax_payload(&self, ps: usize) -> Mass {
        self.pax[ps].payload()
    }

    fn pax_target_payload(&self, ps: usize) -> Mass {
        self.pax[ps].payload_target()
    }

    fn pax_moment(&self, ps: usize) -> Vector3<f64> {
        self.pax[ps].pax_moment()
    }

    fn pax_target_moment(&self, ps: usize) -> Vector3<f64> {
        self.pax[ps].pax_target_moment()
    }

    fn max_pax(&self, ps: usize) -> i8 {
        self.pax[ps].max_pax()
    }

    fn total_pax_num(&self) -> i32 {
        let mut pax_num = 0;
        for ps in 0..Self::A320_PAX.len() {
            pax_num += self.pax_num(ps) as i32;
        }
        pax_num
    }

    fn total_max_pax(&self) -> i32 {
        let mut max_pax = 0;
        for ps in 0..Self::A320_PAX.len() {
            max_pax += self.max_pax(ps) as i32;
        }
        max_pax
    }

    fn pax_target_num(&self, ps: usize) -> i8 {
        self.pax[ps].pax_target_num() as i8
    }

    fn pax_is_sync(&self, ps: usize) -> bool {
        self.pax[ps].payload_is_sync()
    }

    fn pax_is_target(&self, ps: usize) -> bool {
        self.pax[ps].pax_is_target()
    }

    fn sync_pax(&mut self, ps: usize) {
        self.pax[ps].load_payload();
    }

    fn move_all_pax(&mut self, ps: usize) {
        self.pax[ps].move_all_pax();
    }

    fn move_one_pax(&mut self, ps: usize) {
        self.pax[ps].move_one_pax();
    }

    fn reset_pax_target(&mut self, ps: usize) {
        self.pax[ps].reset_pax_target();
    }

    fn reset_cargo_target(&mut self, cs: usize) {
        self.cargo[cs].reset_cargo_target();
    }

    fn cargo(&self, cs: usize) -> Mass {
        self.cargo[cs].cargo()
    }

    fn cargo_target(&self, cs: usize) -> Mass {
        self.cargo[cs].cargo_target()
    }

    #[allow(dead_code)]
    fn cargo_payload(&self, cs: usize) -> Mass {
        self.cargo[cs].payload()
    }

    fn cargo_moment(&self, cs: usize) -> Vector3<f64> {
        self.cargo[cs].cargo_moment()
    }

    fn cargo_target_moment(&self, cs: usize) -> Vector3<f64> {
        self.cargo[cs].cargo_target_moment()
    }

    #[allow(dead_code)]
    fn max_cargo(&self, cs: usize) -> Mass {
        self.cargo[cs].max_cargo()
    }

    fn cargo_is_sync(&self, cs: usize) -> bool {
        self.cargo[cs].payload_is_sync()
    }

    fn cargo_is_target(&self, cs: usize) -> bool {
        self.cargo[cs].cargo_is_target()
    }

    fn move_all_cargo(&mut self, cs: usize) {
        self.cargo[cs].move_all_cargo();
    }

    fn move_one_cargo(&mut self, cs: usize) {
        self.cargo[cs].move_one_cargo();
    }

    fn board_cargo(&mut self) {
        for cs in 0..Self::A320_CARGO.len() {
            self.move_all_cargo(cs);
        }
    }

    fn load_all_cargo_percent(&mut self, percent: f64) {
        for cs in 0..Self::A320_CARGO.len() {
            self.load_cargo_percent(cs, percent);
        }
    }

    fn load_cargo_percent(&mut self, cs: usize, percent: f64) {
        self.cargo[cs].load_cargo_percent(percent)
    }

    fn move_all_payload(&mut self) {
        for ps in 0..Self::A320_PAX.len() {
            self.move_all_pax(ps)
        }
        for cs in 0..Self::A320_CARGO.len() {
            self.move_all_cargo(cs)
        }
    }

    fn sync_cargo(&mut self, cs: usize) {
        self.cargo[cs].load_payload();
    }

    fn is_boarding(&self) -> bool {
        self.is_boarding
    }

    fn is_gsx_enabled(&self) -> bool {
        self.gsx.is_enabled()
    }

    fn stop_boarding(&mut self) {
        self.is_boarding = false;
    }

    fn per_pax_weight(&self) -> Mass {
        self.per_pax_weight.get()
    }
}
impl SimulationElement for A320Payload {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.pax, visitor);
        accept_iterable!(self.cargo, visitor);
        self.boarding_sounds.accept(visitor);
        self.gsx.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.developer_state = reader.read(&self.developer_state_id);
        self.is_boarding = reader.read(&self.is_boarding_id);
        self.board_rate = reader.read(&self.board_rate_id);
        self.per_pax_weight
            .replace(Mass::new::<kilogram>(reader.read(&self.per_pax_weight_id)));
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_boarding_id, self.is_boarding);
        writer.write(
            &self.per_pax_weight_id,
            self.per_pax_weight().get::<kilogram>(),
        );
    }
}
impl NumberOfPassengers for A320Payload {
    fn number_of_passengers(&self, ps: usize) -> i8 {
        self.pax_num(ps)
    }
}
impl PassengerPayload for A320Payload {
    fn total_passenger_load(&self) -> Mass {
        let mut total_payload = Mass::default();
        for ps in 0..Self::A320_PAX.len() {
            total_payload += self.pax_payload(ps);
        }
        total_payload
    }

    fn total_target_passenger_load(&self) -> Mass {
        let mut total_payload = Mass::default();
        for ps in 0..Self::A320_PAX.len() {
            total_payload += self.pax_target_payload(ps);
        }
        total_payload
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        let mut moments: Vec<Vector3<f64>> = Vec::new();
        for ps in 0..Self::A320_PAX.len() {
            moments.push(self.pax_moment(ps));
        }
        let total_pax_load = self.total_passenger_load().get::<kilogram>();
        let cg: Vector3<f64> = if total_pax_load > 0. {
            moments.iter().fold(Vector3::zeros(), |acc, x| acc + x) / total_pax_load
        } else {
            Vector3::zeros()
        };
        cg
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        PassengerPayload::center_of_gravity(self).x
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        let mut moments: Vec<Vector3<f64>> = Vec::new();
        for ps in 0..Self::A320_PAX.len() {
            moments.push(self.pax_target_moment(ps));
        }
        let total_tgt_pax_load = self.total_target_passenger_load().get::<kilogram>();
        let cg: Vector3<f64> = if total_tgt_pax_load > 0. {
            moments.iter().fold(Vector3::zeros(), |acc, x| acc + x) / total_tgt_pax_load
        } else {
            Vector3::zeros()
        };
        cg
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        PassengerPayload::target_center_of_gravity(self).x
    }
}

impl CargoPayload for A320Payload {
    fn total_cargo_load(&self) -> Mass {
        let mut total_payload = Mass::default();
        for cs in 0..Self::A320_CARGO.len() {
            total_payload += self.cargo(cs);
        }
        total_payload
    }

    fn total_target_cargo_load(&self) -> Mass {
        let mut total_payload = Mass::default();
        for cs in 0..Self::A320_CARGO.len() {
            total_payload += self.cargo_target(cs);
        }
        total_payload
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        let mut moments: Vec<Vector3<f64>> = Vec::new();
        for cs in 0..Self::A320_CARGO.len() {
            moments.push(self.cargo_moment(cs));
        }
        let total_cargo_load = self.total_cargo_load().get::<kilogram>();
        let cg: Vector3<f64> = if total_cargo_load > 0. {
            moments.iter().fold(Vector3::zeros(), |acc, x| acc + x) / total_cargo_load
        } else {
            Vector3::zeros()
        };
        cg
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        CargoPayload::center_of_gravity(self).x
    }

    fn target_center_of_gravity(&self) -> Vector3<f64> {
        let mut moments: Vec<Vector3<f64>> = Vec::new();
        for cs in 0..Self::A320_CARGO.len() {
            moments.push(self.cargo_target_moment(cs));
        }
        let total_tgt_cargo_load = self.total_target_cargo_load().get::<kilogram>();
        let cg: Vector3<f64> = if total_tgt_cargo_load > 0. {
            moments.iter().fold(Vector3::zeros(), |acc, x| acc + x) / total_tgt_cargo_load
        } else {
            Vector3::zeros()
        };
        cg
    }

    fn target_fore_aft_center_of_gravity(&self) -> f64 {
        CargoPayload::target_center_of_gravity(self).x
    }
}
