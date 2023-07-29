use enum_map::{Enum, EnumMap};
use nalgebra::Vector3;

use std::{cell::Cell, rc::Rc, time::Duration};

use uom::si::{f64::Mass, mass::kilogram};

use systems::{
    accept_iterable,
    misc::GsxState,
    payload::{BoardingRate, Cargo, CargoInfo, Pax, PaxInfo},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

#[cfg(test)]
pub mod test;

#[derive(Debug, Clone, Copy, Enum)]
pub enum A380PaxStation {
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
impl A380PaxStation {
    pub fn iterator() -> impl Iterator<Item = A380PaxStation> {
        [
            A380PaxStation::MainFwdA,
            A380PaxStation::MainFwdB,
            A380PaxStation::MainMid1A,
            A380PaxStation::MainMid1B,
            A380PaxStation::MainMid1C,
            A380PaxStation::MainMid2A,
            A380PaxStation::MainMid2B,
            A380PaxStation::MainMid2C,
            A380PaxStation::MainAftA,
            A380PaxStation::MainAftB,
            A380PaxStation::UpperFwd,
            A380PaxStation::UpperMidA,
            A380PaxStation::UpperMidB,
            A380PaxStation::UpperAft,
        ]
        .iter()
        .copied()
    }
}

#[derive(Debug, Clone, Copy, Enum)]
pub enum A380CargoStation {
    Fwd,
    Aft,
    Bulk,
}
impl A380CargoStation {
    pub fn iterator() -> impl Iterator<Item = A380CargoStation> {
        [
            A380CargoStation::Fwd,
            A380CargoStation::Aft,
            A380CargoStation::Bulk,
        ]
        .iter()
        .copied()
    }
}
pub struct A380BoardingSounds {
    pax_board_id: VariableIdentifier,
    pax_deboard_id: VariableIdentifier,
    pax_complete_id: VariableIdentifier,
    pax_ambience_id: VariableIdentifier,
    pax_boarding: bool,
    pax_deboarding: bool,
    pax_complete: bool,
    pax_ambience: bool,
}
impl A380BoardingSounds {
    pub fn new(
        pax_board_id: VariableIdentifier,
        pax_deboard_id: VariableIdentifier,
        pax_complete_id: VariableIdentifier,
        pax_ambience_id: VariableIdentifier,
    ) -> Self {
        A380BoardingSounds {
            pax_board_id,
            pax_deboard_id,
            pax_complete_id,
            pax_ambience_id,
            pax_boarding: false,
            pax_deboarding: false,
            pax_complete: false,
            pax_ambience: false,
        }
    }

    fn pax_boarding(&self) -> bool {
        self.pax_boarding
    }

    fn pax_deboarding(&self) -> bool {
        self.pax_deboarding
    }

    fn pax_complete(&self) -> bool {
        self.pax_complete
    }

    fn pax_ambience(&self) -> bool {
        self.pax_ambience
    }

    fn start_pax_boarding(&mut self) {
        self.pax_boarding = true;
    }

    fn stop_pax_boarding(&mut self) {
        self.pax_boarding = false;
    }

    fn start_pax_deboarding(&mut self) {
        self.pax_deboarding = true;
    }

    fn stop_pax_deboarding(&mut self) {
        self.pax_deboarding = false;
    }

    fn start_pax_complete(&mut self) {
        self.pax_complete = true;
    }

    fn stop_pax_complete(&mut self) {
        self.pax_complete = false;
    }

    fn start_pax_ambience(&mut self) {
        self.pax_ambience = true;
    }

    fn stop_pax_ambience(&mut self) {
        self.pax_ambience = false;
    }
}
impl SimulationElement for A380BoardingSounds {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pax_board_id, self.pax_boarding);
        writer.write(&self.pax_deboard_id, self.pax_deboarding);
        writer.write(&self.pax_complete_id, self.pax_complete);
        writer.write(&self.pax_ambience_id, self.pax_ambience);
    }
}
pub struct A380Payload {
    developer_state_id: VariableIdentifier,
    is_boarding_id: VariableIdentifier,
    board_rate_id: VariableIdentifier,
    per_pax_weight_id: VariableIdentifier,

    is_gsx_enabled_id: VariableIdentifier,
    gsx_boarding_state_id: VariableIdentifier,
    gsx_deboarding_state_id: VariableIdentifier,
    gsx_pax_boarding_id: VariableIdentifier,
    gsx_pax_deboarding_id: VariableIdentifier,
    gsx_cargo_boarding_pct_id: VariableIdentifier,
    gsx_cargo_deboarding_pct_id: VariableIdentifier,

    developer_state: i8,
    is_boarding: bool,
    board_rate: BoardingRate,
    per_pax_weight: Rc<Cell<Mass>>,

    is_gsx_enabled: bool,
    gsx_boarding_state: GsxState,
    gsx_deboarding_state: GsxState,
    gsx_pax_boarding: i32,
    gsx_pax_deboarding: i32,
    gsx_cargo_boarding_pct: f64,
    gsx_cargo_deboarding_pct: f64,

    pax: Vec<Pax>,
    cargo: Vec<Cargo>,
    boarding_sounds: A380BoardingSounds,
    time: Duration,
}
impl A380Payload {
    const DEFAULT_PER_PAX_WEIGHT_KG: f64 = 84.;
    const A380_PAX: EnumMap<A380PaxStation, PaxInfo<'_>> = EnumMap::from_array([
        PaxInfo {
            max_pax: 44,
            position: (70.7, 0., 7.1),
            pax_id: "PAX_MAIN_FWD_A",
            payload_id: "PAYLOAD_STATION_1_REQ",
        },
        PaxInfo {
            max_pax: 44,
            position: (70.7, 0., 7.1),
            pax_id: "PAX_MAIN_FWD_B",
            payload_id: "PAYLOAD_STATION_2_REQ",
        },
        // PAX MAIN FWD: 88
        PaxInfo {
            max_pax: 42,
            position: (25.6, 0., 7.1),
            pax_id: "PAX_MAIN_MID_1A",
            payload_id: "PAYLOAD_STATION_3_REQ",
        },
        PaxInfo {
            max_pax: 50,
            position: (25.6, 0., 7.1),
            pax_id: "PAX_MAIN_MID_1B",
            payload_id: "PAYLOAD_STATION_4_REQ",
        },
        PaxInfo {
            max_pax: 43,
            position: (25.6, 0., 7.1),
            pax_id: "PAX_MAIN_MID_1C",
            payload_id: "PAYLOAD_STATION_5_REQ",
        },
        // PAX MAIN MID 1: 135
        PaxInfo {
            max_pax: 48,
            position: (-16.1, 0., 7.1),
            pax_id: "PAX_MAIN_MID_2A",
            payload_id: "PAYLOAD_STATION_6_REQ",
        },
        PaxInfo {
            max_pax: 40,
            position: (-16.1, 0., 7.1),
            pax_id: "PAX_MAIN_MID_2B",
            payload_id: "PAYLOAD_STATION_7_REQ",
        },
        PaxInfo {
            max_pax: 36,
            position: (-16.1, 0., 7.1),
            pax_id: "PAX_MAIN_MID_2C",
            payload_id: "PAYLOAD_STATION_8_REQ",
        },
        // PAX MAIN MID 2: 124
        PaxInfo {
            max_pax: 48,
            position: (-51.9, 0., 7.1),
            pax_id: "PAX_MAIN_AFT_A",
            payload_id: "PAYLOAD_STATION_9_REQ",
        },
        PaxInfo {
            max_pax: 34,
            position: (-51.9, 0., 7.1),
            pax_id: "PAX_MAIN_AFT_B",
            payload_id: "PAYLOAD_STATION_10_REQ",
        },
        // PAX MAIN AFT: 82
        PaxInfo {
            max_pax: 14,
            position: (55.8, 0., 15.6),
            pax_id: "PAX_UPPER_FWD",
            payload_id: "PAYLOAD_STATION_11_REQ",
        },
        // PAX UPPER FWD: 14
        PaxInfo {
            max_pax: 30,
            position: (6.7, 0., 15.6),
            pax_id: "PAX_UPPER_MID_A",
            payload_id: "PAYLOAD_STATION_12_REQ",
        },
        PaxInfo {
            max_pax: 28,
            position: (6.7, 0., 15.6),
            pax_id: "PAX_UPPER_MID_B",
            payload_id: "PAYLOAD_STATION_13_REQ",
        },
        // PAX UPPER MID: 58
        PaxInfo {
            max_pax: 18,
            position: (-34.3, 0., 15.6),
            pax_id: "PAX_UPPER_AFT",
            payload_id: "PAYLOAD_STATION_14_REQ",
        },
        // PAX UPPER AFT: 18
    ]);

    const A380_CARGO: EnumMap<A380CargoStation, CargoInfo<'_>> = EnumMap::from_array([
        CargoInfo {
            max_cargo_kg: 28577.,
            position: (-62.4, 0., -0.95),
            cargo_id: "CARGO_FWD",
            payload_id: "PAYLOAD_STATION_15_REQ",
        },
        CargoInfo {
            max_cargo_kg: 20310.,
            position: (-23.5, 0., -0.95),
            cargo_id: "CARGO_AFT",
            payload_id: "PAYLOAD_STATION_16_REQ",
        },
        CargoInfo {
            max_cargo_kg: 2513.,
            position: (-57.9, 0., -0.71),
            cargo_id: "CARGO_BULK",
            payload_id: "PAYLOAD_STATION_17_REQ",
        },
    ]);

    pub fn new(context: &mut InitContext) -> Self {
        let per_pax_weight = Rc::new(Cell::new(Mass::new::<kilogram>(
            Self::DEFAULT_PER_PAX_WEIGHT_KG,
        )));

        let mut pax = Vec::new();

        for ps in A380PaxStation::iterator() {
            let pos = Self::A380_PAX[ps].position;
            pax.push(Pax::new(
                context.get_identifier(Self::A380_PAX[ps].pax_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", Self::A380_PAX[ps].pax_id).to_owned()),
                context.get_identifier(Self::A380_PAX[ps].payload_id.to_owned()),
                Rc::clone(&per_pax_weight),
                Vector3::new(pos.0, pos.1, pos.2),
                Self::A380_PAX[ps].max_pax,
            ));
        }

        let mut cargo = Vec::new();
        for cs in A380CargoStation::iterator() {
            let pos = Self::A380_CARGO[cs].position;
            cargo.push(Cargo::new(
                context.get_identifier(Self::A380_CARGO[cs].cargo_id.to_owned()),
                context.get_identifier(
                    format!("{}_DESIRED", Self::A380_CARGO[cs].cargo_id).to_owned(),
                ),
                context.get_identifier(Self::A380_CARGO[cs].payload_id.to_owned()),
                Vector3::new(pos.0, pos.1, pos.2),
                Mass::new::<kilogram>(Self::A380_CARGO[cs].max_cargo_kg),
            ));
        }
        A380Payload {
            developer_state_id: context.get_identifier("DEVELOPER_STATE".to_owned()),
            is_boarding_id: context.get_identifier("BOARDING_STARTED_BY_USR".to_owned()),
            board_rate_id: context.get_identifier("BOARDING_RATE".to_owned()),
            per_pax_weight_id: context.get_identifier("WB_PER_PAX_WEIGHT".to_owned()),

            is_gsx_enabled_id: context.get_identifier("GSX_PAYLOAD_SYNC_ENABLED".to_owned()),
            gsx_boarding_state_id: context.get_identifier("FSDT_GSX_BOARDING_STATE".to_owned()),
            gsx_deboarding_state_id: context.get_identifier("FSDT_GSX_DEBOARDING_STATE".to_owned()),
            gsx_pax_boarding_id: context
                .get_identifier("FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL".to_owned()),
            gsx_pax_deboarding_id: context
                .get_identifier("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL".to_owned()),
            gsx_cargo_boarding_pct_id: context
                .get_identifier("FSDT_GSX_BOARDING_CARGO_PERCENT".to_owned()),
            gsx_cargo_deboarding_pct_id: context
                .get_identifier("FSDT_GSX_DEBOARDING_CARGO_PERCENT".to_owned()),

            developer_state: 0,
            is_boarding: false,
            board_rate: BoardingRate::Instant,
            per_pax_weight,
            is_gsx_enabled: false,
            gsx_boarding_state: GsxState::None,
            gsx_deboarding_state: GsxState::None,
            gsx_pax_boarding: 0,
            gsx_pax_deboarding: 0,
            gsx_cargo_boarding_pct: 0.,
            gsx_cargo_deboarding_pct: 0.,
            boarding_sounds: A380BoardingSounds::new(
                context.get_identifier("SOUND_PAX_BOARDING".to_owned()),
                context.get_identifier("SOUND_PAX_DEBOARDING".to_owned()),
                context.get_identifier("SOUND_BOARDING_COMPLETE".to_owned()),
                context.get_identifier("SOUND_PAX_AMBIENCE".to_owned()),
            ),
            pax,
            cargo,
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
        for ps in A380PaxStation::iterator() {
            if !self.pax_is_sync(ps) {
                self.sync_pax(ps);
            }
        }

        for cs in A380CargoStation::iterator() {
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
        match self.gsx_deboarding_state {
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
                    self.total_pax_num() - (self.total_max_pax() - self.gsx_pax_deboarding),
                );
                self.load_all_cargo_percent(100. - self.gsx_cargo_deboarding_pct);
            }
        }
    }

    fn update_cargo_loaded(&mut self) {
        for cs in A380CargoStation::iterator() {
            self.cargo[cs as usize].update_cargo_loaded()
        }
    }

    fn reset_cargo_loaded(&mut self) {
        for cs in A380CargoStation::iterator() {
            self.cargo[cs as usize].reset_cargo_loaded()
        }
    }

    fn update_gsx_boarding(&mut self, _context: &UpdateContext) {
        self.update_pax_ambience();
        match self.gsx_boarding_state {
            GsxState::None
            | GsxState::Available
            | GsxState::NotAvailable
            | GsxState::Bypassed
            | GsxState::Requested => {}
            GsxState::Completed => {
                self.board_cargo();
            }
            GsxState::Performing => {
                self.board_pax(self.gsx_pax_boarding - self.total_pax_num());
                self.load_all_cargo_percent(self.gsx_cargo_boarding_pct);
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
            500
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
        for ps in A380PaxStation::iterator() {
            self.reset_pax_target(ps);
        }
    }

    fn move_all_pax_num(&mut self, pax_diff: i32) {
        if pax_diff > 0 {
            for _ in 0..pax_diff {
                for ps in A380PaxStation::iterator() {
                    if self.pax_is_target(ps) {
                        continue;
                    }
                    self.move_one_pax(ps);
                    break;
                }
            }
        }
    }

    fn board_pax(&mut self, pax_diff: i32) {
        if pax_diff > 0 {
            for _ in 0..pax_diff {
                for ps in A380PaxStation::iterator() {
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
        for ps in A380PaxStation::iterator() {
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
        for cs in A380CargoStation::iterator() {
            self.reset_cargo_target(cs);
        }
    }

    fn update_cargo(&mut self) {
        for cs in A380CargoStation::iterator() {
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

    fn is_developer_state_active(&mut self) -> bool {
        self.developer_state > 0
    }

    fn is_pax_boarding(&mut self) -> bool {
        for ps in A380PaxStation::iterator() {
            if self.pax_num(ps) < self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_deboarding(&mut self) -> bool {
        for ps in A380PaxStation::iterator() {
            if self.pax_num(ps) > self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_loaded(&mut self) -> bool {
        for ps in A380PaxStation::iterator() {
            if !self.pax_is_target(ps) {
                return false;
            }
        }
        true
    }

    fn is_cargo_loaded(&mut self) -> bool {
        for cs in A380CargoStation::iterator() {
            if !self.cargo_is_target(cs) {
                return false;
            }
        }
        true
    }

    fn is_fully_loaded(&mut self) -> bool {
        self.is_pax_loaded() && self.is_cargo_loaded()
    }

    fn has_no_pax(&mut self) -> bool {
        for ps in A380PaxStation::iterator() {
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

    fn sound_pax_boarding_playing(&self) -> bool {
        self.boarding_sounds.pax_boarding()
    }

    fn sound_pax_ambience_playing(&self) -> bool {
        self.boarding_sounds.pax_ambience()
    }

    fn sound_pax_complete_playing(&self) -> bool {
        self.boarding_sounds.pax_complete()
    }

    fn sound_pax_deboarding_playing(&self) -> bool {
        self.boarding_sounds.pax_deboarding()
    }

    fn pax_num(&self, ps: A380PaxStation) -> i8 {
        self.pax[ps as usize].pax_num() as i8
    }

    fn pax_payload(&self, ps: A380PaxStation) -> Mass {
        self.pax[ps as usize].payload()
    }

    fn pax_target_payload(&self, ps: A380PaxStation) -> Mass {
        self.pax[ps as usize].payload_target()
    }

    fn pax_moment(&self, ps: A380PaxStation) -> Vector3<f64> {
        self.pax[ps as usize].pax_moment()
    }

    fn pax_target_moment(&self, ps: A380PaxStation) -> Vector3<f64> {
        self.pax[ps as usize].pax_target_moment()
    }

    fn max_pax(&self, ps: A380PaxStation) -> i8 {
        self.pax[ps as usize].max_pax()
    }

    fn total_pax_num(&self) -> i32 {
        let mut pax_num = 0;
        for ps in A380PaxStation::iterator() {
            pax_num += self.pax_num(ps) as i32;
        }
        pax_num
    }

    fn total_max_pax(&self) -> i32 {
        let mut max_pax = 0;
        for ps in A380PaxStation::iterator() {
            max_pax += Self::A380_PAX[ps].max_pax as i32;
        }
        max_pax
    }

    fn pax_target_num(&self, ps: A380PaxStation) -> i8 {
        self.pax[ps as usize].pax_target_num() as i8
    }

    fn pax_is_sync(&mut self, ps: A380PaxStation) -> bool {
        self.pax[ps as usize].payload_is_sync()
    }

    fn pax_is_target(&mut self, ps: A380PaxStation) -> bool {
        self.pax[ps as usize].pax_is_target()
    }

    fn sync_pax(&mut self, ps: A380PaxStation) {
        self.pax[ps as usize].load_payload();
    }

    fn move_all_pax(&mut self, ps: A380PaxStation) {
        self.pax[ps as usize].move_all_pax();
    }

    fn move_one_pax(&mut self, ps: A380PaxStation) {
        self.pax[ps as usize].move_one_pax();
    }

    fn reset_pax_target(&mut self, ps: A380PaxStation) {
        self.pax[ps as usize].reset_pax_target();
    }

    fn reset_cargo_target(&mut self, cs: A380CargoStation) {
        self.cargo[cs as usize].reset_cargo_target();
    }

    fn cargo(&self, cs: A380CargoStation) -> Mass {
        self.cargo[cs as usize].cargo()
    }

    fn cargo_target(&self, cs: A380CargoStation) -> Mass {
        self.cargo[cs as usize].cargo_target()
    }

    fn cargo_payload(&self, cs: A380CargoStation) -> Mass {
        self.cargo[cs as usize].payload()
    }

    fn cargo_moment(&self, cs: A380CargoStation) -> Vector3<f64> {
        self.cargo[cs as usize].cargo_moment()
    }

    fn cargo_target_moment(&self, cs: A380CargoStation) -> Vector3<f64> {
        self.cargo[cs as usize].cargo_target_moment()
    }

    fn max_cargo(&self, cs: A380CargoStation) -> Mass {
        self.cargo[cs as usize].max_cargo()
    }

    fn cargo_is_sync(&mut self, cs: A380CargoStation) -> bool {
        self.cargo[cs as usize].payload_is_sync()
    }

    fn cargo_is_target(&mut self, cs: A380CargoStation) -> bool {
        self.cargo[cs as usize].cargo_is_target()
    }

    fn move_all_cargo(&mut self, cs: A380CargoStation) {
        self.cargo[cs as usize].move_all_cargo();
    }

    fn move_one_cargo(&mut self, cs: A380CargoStation) {
        self.cargo[cs as usize].move_one_cargo();
    }

    fn board_cargo(&mut self) {
        for cs in A380CargoStation::iterator() {
            self.move_all_cargo(cs);
        }
    }

    fn load_all_cargo_percent(&mut self, percent: f64) {
        for cs in A380CargoStation::iterator() {
            self.load_cargo_percent(cs, percent);
        }
    }

    fn load_cargo_percent(&mut self, cs: A380CargoStation, percent: f64) {
        self.cargo[cs as usize].load_cargo_percent(percent)
    }

    fn sync_cargo(&mut self, cs: A380CargoStation) {
        self.cargo[cs as usize].load_payload();
    }

    fn move_all_payload(&mut self) {
        for ps in A380PaxStation::iterator() {
            self.move_all_pax(ps)
        }
        for cs in A380CargoStation::iterator() {
            self.move_all_cargo(cs)
        }
    }

    fn is_boarding(&self) -> bool {
        self.is_boarding
    }

    fn is_gsx_enabled(&self) -> bool {
        self.is_gsx_enabled
    }

    fn stop_boarding(&mut self) {
        self.is_boarding = false;
    }

    fn per_pax_weight(&self) -> Mass {
        self.per_pax_weight.get()
    }
}
impl SimulationElement for A380Payload {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.pax, visitor);
        accept_iterable!(self.cargo, visitor);
        self.boarding_sounds.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.developer_state = reader.read(&self.developer_state_id);
        self.is_boarding = reader.read(&self.is_boarding_id);
        self.board_rate = reader.read(&self.board_rate_id);
        self.is_gsx_enabled = reader.read(&self.is_gsx_enabled_id);
        self.gsx_boarding_state = reader.read(&self.gsx_boarding_state_id);
        self.gsx_deboarding_state = reader.read(&self.gsx_deboarding_state_id);
        self.gsx_pax_boarding = reader.read(&self.gsx_pax_boarding_id);
        self.gsx_pax_deboarding = reader.read(&self.gsx_pax_deboarding_id);
        self.gsx_cargo_boarding_pct = reader.read(&self.gsx_cargo_boarding_pct_id);
        self.gsx_cargo_deboarding_pct = reader.read(&self.gsx_cargo_deboarding_pct_id);
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
