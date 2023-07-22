use enum_map::{Enum, EnumMap};
use lazy_static::lazy_static;

use std::{cell::Cell, rc::Rc, time::Duration};

use uom::si::{f64::Mass, mass::kilogram};

use systems::{
    payload::{BoardingRate, Cargo, CargoInfo, GsxState, Pax, PaxInfo},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

#[cfg(test)]
pub mod test;

#[derive(Debug, Clone, Copy, Enum)]
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
impl A380Pax {
    pub fn iterator() -> impl Iterator<Item = A380Pax> {
        [
            A380Pax::MainFwdA,
            A380Pax::MainFwdB,
            A380Pax::MainMid1A,
            A380Pax::MainMid1B,
            A380Pax::MainMid1C,
            A380Pax::MainMid2A,
            A380Pax::MainMid2B,
            A380Pax::MainMid2C,
            A380Pax::MainAftA,
            A380Pax::MainAftB,
            A380Pax::UpperFwd,
            A380Pax::UpperMidA,
            A380Pax::UpperMidB,
            A380Pax::UpperAft,
        ]
        .iter()
        .copied()
    }
}

#[derive(Debug, Clone, Copy, Enum)]
pub enum A380Cargo {
    Fwd,
    Aft,
    Bulk,
}
impl A380Cargo {
    pub fn iterator() -> impl Iterator<Item = A380Cargo> {
        [A380Cargo::Fwd, A380Cargo::Aft, A380Cargo::Bulk]
            .iter()
            .copied()
    }
}

lazy_static! {
    static ref A380_PAX: EnumMap<A380Pax, PaxInfo> = EnumMap::from_array([
        PaxInfo::new(44, "PAX_MAIN_FWD_A", "PAYLOAD_STATION_1_REQ"),
        PaxInfo::new(44, "PAX_MAIN_FWD_B", "PAYLOAD_STATION_2_REQ"), // 88
        PaxInfo::new(42, "PAX_MAIN_MID_1A", "PAYLOAD_STATION_3_REQ"),
        PaxInfo::new(50, "PAX_MAIN_MID_1B", "PAYLOAD_STATION_4_REQ"),
        PaxInfo::new(43, "PAX_MAIN_MID_1C", "PAYLOAD_STATION_5_REQ"), // 135
        PaxInfo::new(48, "PAX_MAIN_MID_2A", "PAYLOAD_STATION_6_REQ"),
        PaxInfo::new(40, "PAX_MAIN_MID_2B", "PAYLOAD_STATION_7_REQ"),
        PaxInfo::new(36, "PAX_MAIN_MID_2C", "PAYLOAD_STATION_8_REQ"), // 124
        PaxInfo::new(48, "PAX_MAIN_AFT_A", "PAYLOAD_STATION_9_REQ"),
        PaxInfo::new(34, "PAX_MAIN_AFT_B", "PAYLOAD_STATION_10_REQ"), // 82
        PaxInfo::new(14, "PAX_UPPER_FWD", "PAYLOAD_STATION_11_REQ"),  // 14
        PaxInfo::new(30, "PAX_UPPER_MID_A", "PAYLOAD_STATION_12_REQ"),
        PaxInfo::new(28, "PAX_UPPER_MID_B", "PAYLOAD_STATION_13_REQ"), // 58
        PaxInfo::new(18, "PAX_UPPER_AFT", "PAYLOAD_STATION_14_REQ"), // 18
    ]);
    static ref A380_CARGO: EnumMap<A380Cargo, CargoInfo> = EnumMap::from_array([
        CargoInfo::new(
            Mass::new::<kilogram>(28577.),
            "CARGO_FWD",
            "PAYLOAD_STATION_15_REQ",
        ),
        CargoInfo::new(
            Mass::new::<kilogram>(20310.),
            "CARGO_AFT",
            "PAYLOAD_STATION_16_REQ",
        ),
        CargoInfo::new(
            Mass::new::<kilogram>(2513.),
            "CARGO_BULK",
            "PAYLOAD_STATION_17_REQ",
        ),
    ]);
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

    fn pax_ambience(&self) -> bool {
        self.pax_ambience
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
    pub fn new(context: &mut InitContext) -> Self {
        let per_pax_weight = Rc::new(Cell::new(Mass::new::<kilogram>(
            Self::DEFAULT_PER_PAX_WEIGHT_KG,
        )));

        let mut pax = Vec::new();

        for ps in A380Pax::iterator() {
            pax.push(Pax::new(
                context.get_identifier(A380_PAX[ps].pax_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", A380_PAX[ps].pax_id).to_owned()),
                context.get_identifier(A380_PAX[ps].payload_id.to_owned()),
                Rc::clone(&per_pax_weight),
            ));
        }

        let mut cargo = Vec::new();
        for cs in A380Cargo::iterator() {
            cargo.push(Cargo::new(
                context.get_identifier(A380_CARGO[cs].cargo_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", A380_CARGO[cs].cargo_id).to_owned()),
                context.get_identifier(A380_CARGO[cs].payload_id.to_owned()),
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
            self.stop_all_sounds();
            self.update_extern_gsx(context);
        } else {
            self.update_intern(context);
        }
    }

    fn ensure_payload_sync(&mut self) {
        for ps in A380Pax::iterator() {
            if !self.pax_is_sync(ps) {
                self.sync_pax(ps);
            }
        }

        for cs in A380Cargo::iterator() {
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
                self.reset_all_pax_and_targets();
                self.reset_all_cargo_and_targets();
            }
            GsxState::Completed => {
                self.board_cargo();
            }
            GsxState::Performing => {
                self.board_pax(
                    self.total_pax_num() - (self.total_max_pax() - self.gsx_pax_deboarding),
                );
                self.load_all_cargo_percent(100. - self.gsx_cargo_deboarding_pct);
            }
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

    fn stop_all_sounds(&mut self) {
        self.boarding_sounds.stop_pax_boarding();
        self.boarding_sounds.stop_pax_deboarding();
        self.boarding_sounds.stop_pax_ambience();
        self.boarding_sounds.stop_pax_complete();
    }

    fn reset_all_pax_and_targets(&mut self) {
        for ps in A380Pax::iterator() {
            self.reset_pax_and_target(ps);
        }
    }

    fn board_pax(&mut self, pax_diff: i32) {
        if pax_diff > 0 {
            for _ in 0..pax_diff {
                for ps in A380Pax::iterator() {
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
        for ps in A380Pax::iterator() {
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

    fn reset_all_cargo_and_targets(&mut self) {
        for cs in A380Cargo::iterator() {
            self.reset_cargo_and_target(cs);
        }
    }

    fn update_cargo(&mut self) {
        for cs in A380Cargo::iterator() {
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
        for ps in A380Pax::iterator() {
            if self.pax_num(ps) < self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_deboarding(&mut self) -> bool {
        for ps in A380Pax::iterator() {
            if self.pax_num(ps) > self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_loaded(&mut self) -> bool {
        for ps in A380Pax::iterator() {
            if !self.pax_is_target(ps) {
                return false;
            }
        }
        true
    }

    fn is_cargo_loaded(&mut self) -> bool {
        for cs in A380Cargo::iterator() {
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
        for ps in A380Pax::iterator() {
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

    fn pax_num(&self, ps: A380Pax) -> i8 {
        self.pax[ps as usize].pax_num() as i8
    }

    fn total_pax_num(&self) -> i32 {
        let mut pax_num = 0;
        for ps in A380Pax::iterator() {
            pax_num += self.pax_num(ps) as i32;
        }
        pax_num
    }

    fn total_max_pax(&self) -> i32 {
        let mut max_pax = 0;
        for ps in A380Pax::iterator() {
            max_pax += A380_PAX[ps].max_pax as i32;
        }
        max_pax
    }

    fn pax_target_num(&self, ps: A380Pax) -> i8 {
        self.pax[ps as usize].pax_target_num() as i8
    }

    fn pax_is_sync(&mut self, ps: A380Pax) -> bool {
        self.pax[ps as usize].payload_is_sync()
    }

    fn pax_is_target(&mut self, ps: A380Pax) -> bool {
        self.pax[ps as usize].pax_is_target()
    }

    fn sync_pax(&mut self, ps: A380Pax) {
        self.pax[ps as usize].load_payload();
    }

    fn move_all_pax(&mut self, ps: A380Pax) {
        self.pax[ps as usize].move_all_pax();
    }

    fn move_one_pax(&mut self, ps: A380Pax) {
        self.pax[ps as usize].move_one_pax();
    }

    fn reset_pax_and_target(&mut self, ps: A380Pax) {
        self.pax[ps as usize].reset_pax_target();
    }

    fn reset_cargo_and_target(&mut self, cs: A380Cargo) {
        self.cargo[cs as usize].reset_cargo_target();
    }

    fn cargo_is_sync(&mut self, cs: A380Cargo) -> bool {
        self.cargo[cs as usize].payload_is_sync()
    }

    fn cargo_is_target(&mut self, cs: A380Cargo) -> bool {
        self.cargo[cs as usize].cargo_is_target()
    }

    fn move_all_cargo(&mut self, cs: A380Cargo) {
        self.cargo[cs as usize].move_all_cargo();
    }

    fn move_one_cargo(&mut self, cs: A380Cargo) {
        self.cargo[cs as usize].move_one_cargo();
    }

    fn board_cargo(&mut self) {
        for cs in A380Cargo::iterator() {
            self.move_all_cargo(cs);
        }
    }

    fn load_all_cargo_percent(&mut self, percent: f64) {
        for cs in A380Cargo::iterator() {
            self.load_cargo_percent(cs, percent);
        }
    }

    fn load_cargo_percent(&mut self, cs: A380Cargo, percent: f64) {
        self.cargo[cs as usize].load_cargo_percent(percent)
    }

    fn sync_cargo(&mut self, cs: A380Cargo) {
        self.cargo[cs as usize].load_payload();
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
        for ps in 0..self.pax.len() {
            self.pax[ps].accept(visitor);
        }
        for cs in 0..self.cargo.len() {
            self.cargo[cs].accept(visitor);
        }
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
