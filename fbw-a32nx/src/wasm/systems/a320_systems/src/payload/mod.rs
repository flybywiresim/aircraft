use enum_map::{Enum, EnumMap};
use lazy_static::lazy_static;

use std::{cell::Cell, rc::Rc, time::Duration};

use uom::si::{f64::Mass, mass::kilogram};

use systems::{
    accept_iterable,
    payload::{BoardingRate, Cargo, CargoInfo, GsxState, Pax, PaxInfo},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

#[cfg(test)]
pub mod test;

pub trait NumberOfPassengers {
    fn number_of_passengers(&self, ps: A320Pax) -> i8;
}

#[derive(Debug, Clone, Copy, Enum)]
pub enum A320Pax {
    A,
    B,
    C,
    D,
}
impl A320Pax {
    pub fn iterator() -> impl Iterator<Item = A320Pax> {
        [A320Pax::A, A320Pax::B, A320Pax::C, A320Pax::D]
            .iter()
            .copied()
    }
}

#[derive(Debug, Clone, Copy, Enum)]
pub enum A320Cargo {
    FwdBaggage,
    AftContainer,
    AftBaggage,
    AftBulkLoose,
}
impl A320Cargo {
    pub fn iterator() -> impl Iterator<Item = A320Cargo> {
        [
            A320Cargo::FwdBaggage,
            A320Cargo::AftContainer,
            A320Cargo::AftBaggage,
            A320Cargo::AftBulkLoose,
        ]
        .iter()
        .copied()
    }
}

lazy_static! {
    static ref A320_PAX: EnumMap<A320Pax, PaxInfo> = EnumMap::from_array([
        PaxInfo::new(36, "PAX_A", "PAYLOAD_STATION_1_REQ",),
        PaxInfo::new(42, "PAX_B", "PAYLOAD_STATION_2_REQ",),
        PaxInfo::new(48, "PAX_C", "PAYLOAD_STATION_3_REQ",),
        PaxInfo::new(48, "PAX_D", "PAYLOAD_STATION_4_REQ",)
    ]);
    static ref A320_CARGO: EnumMap<A320Cargo, CargoInfo> = EnumMap::from_array([
        CargoInfo::new(
            Mass::new::<kilogram>(3402.),
            "CARGO_FWD_BAGGAGE_CONTAINER",
            "PAYLOAD_STATION_5_REQ",
        ),
        CargoInfo::new(
            Mass::new::<kilogram>(2426.),
            "CARGO_AFT_CONTAINER",
            "PAYLOAD_STATION_6_REQ",
        ),
        CargoInfo::new(
            Mass::new::<kilogram>(2110.),
            "CARGO_AFT_BAGGAGE",
            "PAYLOAD_STATION_7_REQ",
        ),
        CargoInfo::new(
            Mass::new::<kilogram>(1497.),
            "CARGO_AFT_BULK_LOOSE",
            "PAYLOAD_STATION_8_REQ",
        )
    ]);
}

pub struct A320BoardingSounds {
    pax_board_id: VariableIdentifier,
    pax_deboard_id: VariableIdentifier,
    pax_complete_id: VariableIdentifier,
    pax_ambience_id: VariableIdentifier,
    pax_boarding: bool,
    pax_deboarding: bool,
    pax_complete: bool,
    pax_ambience: bool,
}
impl A320BoardingSounds {
    pub fn new(
        pax_board_id: VariableIdentifier,
        pax_deboard_id: VariableIdentifier,
        pax_complete_id: VariableIdentifier,
        pax_ambience_id: VariableIdentifier,
    ) -> Self {
        A320BoardingSounds {
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
}
impl SimulationElement for A320BoardingSounds {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pax_board_id, self.pax_boarding);
        writer.write(&self.pax_deboard_id, self.pax_deboarding);
        writer.write(&self.pax_complete_id, self.pax_complete);
        writer.write(&self.pax_ambience_id, self.pax_ambience);
    }
}

pub struct A320Payload {
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
    boarding_sounds: A320BoardingSounds,
    time: Duration,
}
impl A320Payload {
    const DEFAULT_PER_PAX_WEIGHT_KG: f64 = 84.;
    pub fn new(context: &mut InitContext) -> Self {
        let per_pax_weight = Rc::new(Cell::new(Mass::new::<kilogram>(
            Self::DEFAULT_PER_PAX_WEIGHT_KG,
        )));

        let mut pax = Vec::new();

        for ps in A320Pax::iterator() {
            pax.push(Pax::new(
                context.get_identifier(A320_PAX[ps].pax_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", A320_PAX[ps].pax_id).to_owned()),
                context.get_identifier(A320_PAX[ps].payload_id.to_owned()),
                Rc::clone(&per_pax_weight),
            ));
        }

        let mut cargo = Vec::new();
        for cs in A320Cargo::iterator() {
            cargo.push(Cargo::new(
                context.get_identifier(A320_CARGO[cs].cargo_id.to_owned()),
                context.get_identifier(format!("{}_DESIRED", A320_CARGO[cs].cargo_id).to_owned()),
                context.get_identifier(A320_CARGO[cs].payload_id.to_owned()),
            ));
        }
        A320Payload {
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
            boarding_sounds: A320BoardingSounds::new(
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
        for ps in A320Pax::iterator() {
            if !self.pax_is_sync(ps) {
                self.sync_pax(ps);
            }
        }

        for cs in A320Cargo::iterator() {
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
        for cs in A320Cargo::iterator() {
            self.cargo[cs as usize].update_cargo_loaded()
        }
    }

    fn reset_cargo_loaded(&mut self) {
        for cs in A320Cargo::iterator() {
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
                for cs in A320Cargo::iterator() {
                    self.move_all_cargo(cs);
                }
            }
            GsxState::Performing => {
                self.move_all_pax_num(self.gsx_pax_boarding - self.total_pax_num());
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
        for ps in A320Pax::iterator() {
            self.reset_pax_target(ps);
        }
    }

    fn move_all_pax_num(&mut self, pax_diff: i32) {
        if pax_diff > 0 {
            for _ in 0..pax_diff {
                for ps in A320Pax::iterator() {
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
        for ps in A320Pax::iterator() {
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
        for cs in A320Cargo::iterator() {
            self.reset_cargo_target(cs);
        }
    }

    fn update_cargo(&mut self) {
        for cs in A320Cargo::iterator() {
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
        for ps in A320Pax::iterator() {
            if self.pax_num(ps) < self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_deboarding(&self) -> bool {
        for ps in A320Pax::iterator() {
            if self.pax_num(ps) > self.pax_target_num(ps) && self.is_boarding() {
                return true;
            }
        }
        false
    }

    fn is_pax_loaded(&self) -> bool {
        for ps in A320Pax::iterator() {
            if !self.pax_is_target(ps) {
                return false;
            }
        }
        true
    }

    fn is_cargo_loaded(&self) -> bool {
        for cs in A320Cargo::iterator() {
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
        for ps in A320Pax::iterator() {
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

    fn pax_num(&self, ps: A320Pax) -> i8 {
        self.pax[ps as usize].pax_num() as i8
    }

    fn total_pax_num(&self) -> i32 {
        let mut pax_num = 0;
        for ps in A320Pax::iterator() {
            pax_num += self.pax_num(ps) as i32;
        }
        pax_num
    }

    fn total_max_pax(&self) -> i32 {
        let mut max_pax = 0;
        for ps in A320Pax::iterator() {
            max_pax += A320_PAX[ps].max_pax as i32;
        }
        max_pax
    }

    fn pax_target_num(&self, ps: A320Pax) -> i8 {
        self.pax[ps as usize].pax_target_num() as i8
    }

    fn pax_is_sync(&mut self, ps: A320Pax) -> bool {
        self.pax[ps as usize].payload_is_sync()
    }

    fn pax_is_target(&self, ps: A320Pax) -> bool {
        self.pax[ps as usize].pax_is_target()
    }

    fn sync_pax(&mut self, ps: A320Pax) {
        self.pax[ps as usize].load_payload();
    }

    fn move_all_pax(&mut self, ps: A320Pax) {
        self.pax[ps as usize].move_all_pax();
    }

    fn move_one_pax(&mut self, ps: A320Pax) {
        self.pax[ps as usize].move_one_pax();
    }

    fn reset_pax_target(&mut self, ps: A320Pax) {
        self.pax[ps as usize].reset_pax_target();
    }

    fn reset_cargo_target(&mut self, cs: A320Cargo) {
        self.cargo[cs as usize].reset_cargo_target();
    }

    fn cargo_is_sync(&mut self, cs: A320Cargo) -> bool {
        self.cargo[cs as usize].payload_is_sync()
    }

    fn cargo_is_target(&self, cs: A320Cargo) -> bool {
        self.cargo[cs as usize].cargo_is_target()
    }

    fn move_all_cargo(&mut self, cs: A320Cargo) {
        self.cargo[cs as usize].move_all_cargo();
    }

    fn move_one_cargo(&mut self, cs: A320Cargo) {
        self.cargo[cs as usize].move_one_cargo();
    }

    fn load_all_cargo_percent(&mut self, percent: f64) {
        for cs in A320Cargo::iterator() {
            self.load_cargo_percent(cs, percent);
        }
    }

    fn load_cargo_percent(&mut self, cs: A320Cargo, percent: f64) {
        self.cargo[cs as usize].load_cargo_percent(percent)
    }

    fn move_all_payload(&mut self) {
        for ps in A320Pax::iterator() {
            self.move_all_pax(ps)
        }
        for cs in A320Cargo::iterator() {
            self.move_all_cargo(cs)
        }
    }

    fn sync_cargo(&mut self, cs: A320Cargo) {
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
impl SimulationElement for A320Payload {
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
impl NumberOfPassengers for A320Payload {
    fn number_of_passengers(&self, ps: A320Pax) -> i8 {
        self.pax_num(ps)
    }
}
