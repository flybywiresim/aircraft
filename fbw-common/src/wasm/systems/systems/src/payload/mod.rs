use std::{cell::Cell, rc::Rc, time::Duration};
use uom::si::{f64::Ratio, ratio::percent};

use crate::{
    shared::random_from_range,
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write, Writer,
    },
};
use nalgebra::Vector3;
use uom::si::{f64::Mass, mass::kilogram, mass::pound};

pub struct LoadsheetInfo {
    pub operating_empty_weight_kg: f64,
    pub operating_empty_position: (f64, f64, f64),
    pub per_pax_weight_kg: f64,
    pub mean_aerodynamic_chord_size: f64,
    pub leading_edge_mean_aerodynamic_chord: f64,
}

pub struct PaxInfo<'a> {
    pub max_pax: i8,
    pub position: (f64, f64, f64),
    pub pax_id: &'a str,
    pub payload_id: &'a str,
}
pub struct CargoInfo<'a> {
    pub max_cargo_kg: f64,
    pub position: (f64, f64, f64),
    pub cargo_id: &'a str,
    pub payload_id: &'a str,
}

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

#[derive(Debug)]
pub struct BoardingAgent<const P: usize> {
    door_id: Option<VariableIdentifier>,
    door_open_ratio: Ratio,
    order: [usize; P],
}
impl<const P: usize> BoardingAgent<P> {
    pub fn new(door_id: Option<VariableIdentifier>, order: [usize; P]) -> Self {
        BoardingAgent {
            door_id,
            order,
            door_open_ratio: Ratio::default(),
        }
    }

    pub fn handle_one_pax(&self, pax: &mut [Pax; P]) {
        for ps in self.order {
            if self.is_door_open() {
                if pax[ps].pax_is_target() {
                    continue;
                }
                pax[ps].move_one_pax();
                break;
            }
        }
    }

    pub fn force_one_pax(&self, pax: &mut [Pax; P]) {
        for ps in self.order {
            if pax[ps].pax_is_target() {
                continue;
            }
            pax[ps].move_one_pax();
            break;
        }
    }

    pub fn force_num_pax(&self, num_to_move: i32, pax: &mut [Pax; P]) {
        for _ in 0..num_to_move {
            self.force_one_pax(pax);
        }
    }

    pub fn is_door_open(&self) -> bool {
        self.door_open_ratio >= Ratio::new::<percent>(100.)
    }
}
impl<const P: usize> SimulationElement for BoardingAgent<P> {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.door_open_ratio = self
            .door_id
            .map(|door_id| reader.read(&door_id))
            .unwrap_or_default();
    }
}

#[derive(Debug)]
pub struct PassengerDeck<const N: usize, const G: usize> {
    pax: [Pax; N],
    default_boarding_agent: BoardingAgent<N>,
    boarding_agents: [BoardingAgent<N>; G],
}
impl<const N: usize, const G: usize> PassengerDeck<N, G> {
    pub fn new(
        pax: [Pax; N],
        default_boarding_agent: BoardingAgent<N>,
        boarding_agents: [BoardingAgent<N>; G],
    ) -> Self {
        PassengerDeck {
            pax,
            default_boarding_agent,
            boarding_agents,
        }
    }

    fn pax_num(&self, ps: usize) -> i8 {
        self.pax[ps].pax_num()
    }

    fn total_pax_num(&self) -> i32 {
        self.pax.iter().map(|ps| ps.pax_num() as i32).sum()
    }

    fn pax_payload(&self, ps: usize) -> Mass {
        self.pax[ps].payload()
    }

    fn pax_target_payload(&self, ps: usize) -> Mass {
        self.pax[ps].payload_target()
    }

    fn max_pax(&self, ps: usize) -> i8 {
        self.pax[ps].max_pax()
    }

    fn has_pax(&self) -> bool {
        self.pax.iter().any(|ps| ps.pax_num() > 0)
    }

    fn total_passenger_load(&self) -> Mass {
        self.pax.iter().map(|ps| ps.payload()).sum()
    }

    fn total_target_passenger_load(&self) -> Mass {
        self.pax.iter().map(|ps| ps.payload_target()).sum()
    }

    fn total_passenger_moment(&self) -> Vector3<f64> {
        self.pax.iter().map(|ps| ps.pax_moment()).sum()
    }

    fn total_target_passenger_moment(&self) -> Vector3<f64> {
        self.pax.iter().map(|ps| ps.pax_target_moment()).sum()
    }

    fn is_pax_boarding(&self, is_door_open: bool) -> bool {
        is_door_open && self.pax.iter().any(|ps| ps.pax_num() < ps.pax_target_num())
    }

    fn is_pax_deboarding(&self, is_door_open: bool) -> bool {
        is_door_open && self.pax.iter().any(|ps| ps.pax_num() > ps.pax_target_num())
    }

    fn is_pax_loaded(&self) -> bool {
        self.pax.iter().all(|ps| ps.pax_is_target())
    }

    fn override_payload(&mut self, ps: usize, payload: Mass) {
        self.pax[ps].override_payload(payload);
    }

    fn target_none(&mut self) {
        for cs in &mut self.pax {
            cs.reset_pax_target();
        }
    }

    fn update_one_tick(&mut self) {
        let doors_open = self.boarding_agents.iter().any(|ba| ba.is_door_open());
        if doors_open {
            for boarding_agent in &mut self.boarding_agents {
                boarding_agent.handle_one_pax(&mut self.pax);
            }
        } else {
            self.default_boarding_agent.force_one_pax(&mut self.pax);
        }
    }

    fn spawn_all_pax(&mut self) {
        for ps in &mut self.pax {
            if ps.pax_is_target() {
                continue;
            }
            ps.spawn_pax();
        }
    }

    fn board_pax_until_target(&mut self, pax_target: i32) {
        let pax_diff = pax_target - self.total_pax_num();
        if pax_diff > 0 {
            let mut available_agents = self
                .boarding_agents
                .iter()
                .filter(|ba| ba.is_door_open())
                .peekable();

            if available_agents.peek().is_some() {
                for boarding_agent in available_agents.cycle().take(pax_diff as usize) {
                    boarding_agent.handle_one_pax(&mut self.pax);
                }
            } else {
                self.default_boarding_agent
                    .force_num_pax(pax_diff, &mut self.pax);
            }
        }
    }

    fn deboard_pax_until_target(&mut self, pax_target: i32) {
        let pax_diff = self.total_pax_num() - pax_target;
        if pax_diff > 0 {
            self.default_boarding_agent
                .force_num_pax(pax_diff, &mut self.pax);
        }
    }
}

impl<const N: usize, const G: usize> SimulationElement for PassengerDeck<N, G> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.pax, visitor);
        accept_iterable!(self.boarding_agents, visitor);

        visitor.visit(self);
    }
}

pub struct CargoDeck<const N: usize> {
    cargo: [Cargo; N],
}
impl<const N: usize> CargoDeck<N> {
    pub fn new(cargo: [Cargo; N]) -> Self {
        CargoDeck { cargo }
    }

    pub fn station(&self, cs: usize) -> &Cargo {
        &self.cargo[cs]
    }

    fn cargo(&self, cs: usize) -> Mass {
        self.cargo[cs].cargo()
    }

    fn cargo_payload(&self, cs: usize) -> Mass {
        self.cargo[cs].payload()
    }

    fn total_cargo_load(&self) -> Mass {
        self.cargo.iter().map(|cs| cs.cargo()).sum()
    }

    fn total_target_cargo_load(&self) -> Mass {
        self.cargo.iter().map(|cs| cs.cargo_target()).sum()
    }

    fn total_cargo_moment(&self) -> Vector3<f64> {
        self.cargo.iter().map(|cs| cs.cargo_moment()).sum()
    }

    fn total_target_cargo_moment(&self) -> Vector3<f64> {
        self.cargo.iter().map(|cs| cs.cargo_target_moment()).sum()
    }

    fn max_cargo(&self, cs: usize) -> Mass {
        self.cargo[cs].max_capacity()
    }

    fn is_cargo_loaded(&self) -> bool {
        self.cargo.iter().all(|cs| cs.cargo_is_target())
    }

    fn update_cargo_loaded(&mut self) {
        for cargo in &mut self.cargo {
            cargo.update_cargo_loaded()
        }
    }

    fn reset_cargo_loaded(&mut self) {
        for cargo in &mut self.cargo {
            cargo.reset_cargo_loaded()
        }
    }

    fn load_cargo_deck_percent(&mut self, p: f64) {
        for cs in &mut self.cargo {
            cs.load_cargo_percent(p);
        }
    }

    fn target_none(&mut self) {
        for cs in &mut self.cargo {
            cs.reset_cargo_target();
        }
    }

    fn move_one_cargo(&mut self) {
        for cs in &mut self.cargo {
            if cs.cargo_is_target() {
                continue;
            }
            cs.move_one_cargo();
            break;
        }
    }

    fn spawn_all_cargo(&mut self) {
        for cs in &mut self.cargo {
            if cs.cargo_is_target() {
                continue;
            }
            cs.spawn_cargo();
        }
    }
}

impl<const N: usize> SimulationElement for CargoDeck<N> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cargo, visitor);

        visitor.visit(self);
    }
}

#[derive(Debug)]
pub struct Pax {
    pax_id: VariableIdentifier,
    pax_target_id: VariableIdentifier,
    payload_id: VariableIdentifier,
    developer_state: Rc<Cell<i8>>,
    per_pax_weight: Rc<Cell<Mass>>,
    pax_target: u64,
    pax: u64,

    payload: Mass,

    position: Vector3<f64>,
    max: i8,
}
impl Pax {
    const JS_MAX_SAFE_INTEGER: i8 = 53;

    pub fn new(
        pax_id: VariableIdentifier,
        pax_target_id: VariableIdentifier,
        payload_id: VariableIdentifier,
        developer_state: Rc<Cell<i8>>,
        per_pax_weight: Rc<Cell<Mass>>,
        position: Vector3<f64>,
        max: i8,
    ) -> Self {
        Pax {
            pax_id,
            pax_target_id,
            developer_state,
            per_pax_weight,
            payload_id,
            pax_target: 0,
            pax: 0,
            payload: Mass::default(),
            position,
            max,
        }
    }

    fn is_developer_state_active(&self) -> bool {
        self.developer_state.get() > 0
    }

    pub fn per_pax_weight(&self) -> Mass {
        self.per_pax_weight.get()
    }

    pub fn pax_is_target(&self) -> bool {
        self.pax == self.pax_target
    }

    pub fn pax(&self) -> u64 {
        self.pax
    }

    pub fn pax_num(&self) -> i8 {
        self.pax.count_ones() as i8
    }

    pub fn pax_target_num(&self) -> i8 {
        self.pax_target.count_ones() as i8
    }

    pub fn max_pax(&self) -> i8 {
        self.max
    }

    pub fn payload(&self) -> Mass {
        self.payload
    }

    pub fn payload_target(&self) -> Mass {
        Mass::new::<pound>(self.pax_target_num() as f64 * self.per_pax_weight().get::<pound>())
    }

    pub fn pax_moment(&self) -> Vector3<f64> {
        self.pax_num() as f64 * self.per_pax_weight().get::<kilogram>() * self.position
    }

    pub fn pax_target_moment(&self) -> Vector3<f64> {
        self.pax_target_num() as f64 * self.per_pax_weight().get::<kilogram>() * self.position
    }

    pub fn payload_is_sync(&self) -> bool {
        self.payload
            == Mass::new::<pound>(self.pax_num() as f64 * self.per_pax_weight().get::<pound>())
    }

    pub fn override_payload(&mut self, payload: Mass) {
        self.payload = payload;
    }

    pub fn load_payload(&mut self) {
        self.payload =
            Mass::new::<pound>(self.pax_num() as f64 * self.per_pax_weight().get::<pound>());
    }

    pub fn spawn_pax(&mut self) {
        self.pax = self.pax_target;
        self.load_payload();
    }

    pub fn move_num_pax(&mut self, pax: i8) {
        for _ in 0..pax {
            self.move_one_pax();
        }
    }

    pub fn move_one_pax(&mut self) {
        let pax_diff = self.pax_target_num() - self.pax_num();

        let n = if pax_diff > 0 {
            !self.pax & self.pax_target
        } else {
            self.pax & !self.pax_target
        };
        let count = n.count_ones() as f64;
        if count > 0. {
            let mut skip = random_from_range(0., count) as i8;

            for i in 0..Self::JS_MAX_SAFE_INTEGER {
                let bit = 1 << i;
                if (n & bit) > 0 {
                    if skip <= 0 {
                        self.pax ^= bit;
                        break;
                    }
                    skip -= 1;
                }
            }
        }
        self.load_payload();
    }

    pub fn reset_pax_target(&mut self) {
        self.pax_target = 0;
    }
}
impl SimulationElement for Pax {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.pax = reader.read(&self.pax_id);
        self.pax_target = reader.read(&self.pax_target_id);
        self.payload = reader.read(&self.payload_id);
        if !self.is_developer_state_active() && !self.payload_is_sync() {
            self.load_payload()
        }
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pax_id, self.pax);
        writer.write(&self.pax_target_id, self.pax_target);
        writer.write(&self.payload_id, self.payload.get::<pound>());
    }
}

#[derive(Debug)]
pub struct Cargo {
    cargo_target_id: VariableIdentifier,
    cargo_id: VariableIdentifier,
    payload_id: VariableIdentifier,
    cargo: Mass,
    cargo_loaded: Mass,
    cargo_target: Mass,
    developer_state: Rc<Cell<i8>>,
    payload: Mass,

    position: Vector3<f64>,
    max_capacity: Mass,
}
impl Cargo {
    const MAX_CARGO_MOVE: f64 = 60.;

    pub fn new(
        cargo_id: VariableIdentifier,
        cargo_target_id: VariableIdentifier,
        payload_id: VariableIdentifier,
        developer_state: Rc<Cell<i8>>,
        position: Vector3<f64>,
        max_capacity: Mass,
    ) -> Self {
        Cargo {
            cargo_id,
            cargo_target_id,
            payload_id,
            cargo: Mass::default(),
            cargo_loaded: Mass::default(),
            cargo_target: Mass::default(),
            developer_state,
            payload: Mass::default(),
            position,
            max_capacity,
        }
    }

    fn is_developer_state_active(&self) -> bool {
        self.developer_state.get() > 0
    }

    pub fn cargo(&self) -> Mass {
        self.cargo
    }

    pub fn cargo_target(&self) -> Mass {
        self.cargo_target
    }

    pub fn max_capacity(&self) -> Mass {
        self.max_capacity
    }

    pub fn update_cargo_loaded(&mut self) {
        self.cargo_loaded = self.cargo
    }

    pub fn reset_cargo_loaded(&mut self) {
        self.cargo_loaded = Mass::default()
    }

    pub fn payload(&self) -> Mass {
        self.payload
    }

    pub fn payload_is_sync(&self) -> bool {
        self.payload == self.cargo
    }

    pub fn cargo_moment(&self) -> Vector3<f64> {
        self.cargo.get::<kilogram>() * self.position
    }

    pub fn cargo_target_moment(&self) -> Vector3<f64> {
        self.cargo_target.get::<kilogram>() * self.position
    }

    pub fn cargo_is_target(&self) -> bool {
        self.cargo == self.cargo_target
    }

    pub fn load_payload(&mut self) {
        self.payload = self.cargo;
    }

    pub fn spawn_cargo(&mut self) {
        self.cargo = self.cargo_target;
        self.load_payload();
    }

    pub fn move_one_cargo(&mut self) {
        let max_move = Self::MAX_CARGO_MOVE;
        let cargo_delta =
            f64::abs(self.cargo_target.get::<kilogram>() - self.cargo.get::<kilogram>());

        let qty = Mass::new::<kilogram>(f64::min(cargo_delta, max_move));

        if self.cargo < self.cargo_target {
            self.cargo += qty;
        } else if self.cargo > self.cargo_target {
            self.cargo -= qty;
        }
        self.load_payload();
    }

    pub fn load_cargo_percent(&mut self, p: f64) {
        if self.cargo_loaded.get::<kilogram>() > 0. {
            self.cargo = self.cargo_loaded * (p / 100.)
        } else {
            self.cargo = (p / 100.) * self.cargo_target;
        }
        self.load_payload();
    }

    pub fn reset_cargo_target(&mut self) {
        self.cargo_target = Mass::default();
    }
}
impl SimulationElement for Cargo {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.cargo = Mass::new::<kilogram>(reader.read(&self.cargo_id));
        self.cargo_target = Mass::new::<kilogram>(reader.read(&self.cargo_target_id));
        self.payload = reader.read(&self.payload_id);
        if !self.is_developer_state_active() && !self.payload_is_sync() {
            self.load_payload()
        }
    }
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.cargo_id, self.cargo.get::<kilogram>());
        writer.write(&self.payload_id, self.payload);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BoardingRate {
    Instant,
    Fast,
    Real,
}
read_write_enum!(BoardingRate);
impl From<f64> for BoardingRate {
    fn from(value: f64) -> Self {
        match value as u8 {
            2 => BoardingRate::Real,
            1 => BoardingRate::Fast,
            0 => BoardingRate::Instant,
            _ => panic!("{} cannot be converted into BoardingRate", value),
        }
    }
}

pub struct BoardingSounds {
    pax_board_id: VariableIdentifier,
    pax_deboard_id: VariableIdentifier,
    pax_complete_id: VariableIdentifier,
    pax_ambience_id: VariableIdentifier,

    pax_boarding: bool,
    pax_deboarding: bool,
    pax_complete: bool,
    pax_ambience: bool,
}
impl BoardingSounds {
    pub fn new(context: &mut InitContext) -> Self {
        BoardingSounds {
            pax_board_id: context.get_identifier("SOUND_PAX_BOARDING".to_owned()),
            pax_deboard_id: context.get_identifier("SOUND_PAX_DEBOARDING".to_owned()),
            pax_complete_id: context.get_identifier("SOUND_BOARDING_COMPLETE".to_owned()),
            pax_ambience_id: context.get_identifier("SOUND_PAX_AMBIENCE".to_owned()),
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

    pub fn play_sound_pax_boarding(&mut self, playing: bool) {
        self.pax_boarding = playing;
    }

    pub fn play_sound_pax_deboarding(&mut self, playing: bool) {
        self.pax_deboarding = playing;
    }

    pub fn play_sound_pax_complete(&mut self, playing: bool) {
        self.pax_complete = playing;
    }

    pub fn play_sound_pax_ambience(&mut self, playing: bool) {
        self.pax_ambience = playing;
    }

    pub fn stop_boarding_sounds(&mut self) {
        self.pax_boarding = false;
        self.pax_deboarding = false;
        self.pax_complete = false;
    }
}
impl SimulationElement for BoardingSounds {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pax_board_id, self.pax_boarding);
        writer.write(&self.pax_deboard_id, self.pax_deboarding);
        writer.write(&self.pax_complete_id, self.pax_complete);
        writer.write(&self.pax_ambience_id, self.pax_ambience);
    }
}

pub struct PayloadManager<const P: usize, const G: usize, const C: usize> {
    time: Duration,
    fast_rate: u16,
    real_rate: u16,
    boarding_inputs: BoardingInputs,
    boarding_sounds: BoardingSounds,
    passenger_deck: PassengerDeck<P, G>,
    cargo_deck: CargoDeck<C>,
    gsx_driver: GsxDriver,
}
impl<const P: usize, const G: usize, const C: usize> PayloadManager<P, G, C> {
    pub fn new(
        context: &mut InitContext,
        per_pax_weight: Rc<Cell<Mass>>,
        developer_state: Rc<Cell<i8>>,
        boarding_sounds: BoardingSounds,
        passenger_deck: PassengerDeck<P, G>,
        cargo_deck: CargoDeck<C>,
        fast_rate: u16,
        real_rate: u16,
    ) -> Self {
        PayloadManager {
            time: Duration::default(),
            boarding_inputs: BoardingInputs::new(context, per_pax_weight, developer_state),
            boarding_sounds,
            gsx_driver: GsxDriver::new(context),
            passenger_deck,
            cargo_deck,
            fast_rate,
            real_rate,
        }
    }

    fn time(&self) -> Duration {
        self.time
    }

    pub fn is_boarding_allowed(&self) -> bool {
        self.boarding_inputs.is_boarding()
    }

    pub fn board_rate(&self) -> BoardingRate {
        self.boarding_inputs.board_rate()
    }

    // ======================================

    pub fn pax_num(&self, ps: usize) -> i8 {
        self.passenger_deck.pax_num(ps)
    }

    pub fn total_pax_num(&self) -> i32 {
        self.passenger_deck.total_pax_num()
    }

    pub fn total_passenger_load(&self) -> Mass {
        self.passenger_deck.total_passenger_load()
    }

    pub fn total_target_passenger_load(&self) -> Mass {
        self.passenger_deck.total_target_passenger_load()
    }

    pub fn total_passenger_moment(&self) -> Vector3<f64> {
        self.passenger_deck.total_passenger_moment()
    }

    pub fn total_target_passenger_moment(&self) -> Vector3<f64> {
        self.passenger_deck.total_target_passenger_moment()
    }

    pub fn total_cargo_load(&self) -> Mass {
        self.cargo_deck.total_cargo_load()
    }

    pub fn total_target_cargo_load(&self) -> Mass {
        self.cargo_deck.total_target_cargo_load()
    }

    pub fn total_cargo_moment(&self) -> Vector3<f64> {
        self.cargo_deck.total_cargo_moment()
    }

    pub fn total_target_cargo_moment(&self) -> Vector3<f64> {
        self.cargo_deck.total_target_cargo_moment()
    }

    // ======================================

    pub fn max_pax(&self, ps: usize) -> i8 {
        self.passenger_deck.max_pax(ps)
    }

    pub fn pax_payload(&self, ps: usize) -> Mass {
        self.passenger_deck.pax_payload(ps)
    }

    pub fn pax_target_payload(&self, ps: usize) -> Mass {
        self.passenger_deck.pax_target_payload(ps)
    }

    pub fn cargo(&self, ps: usize) -> Mass {
        self.cargo_deck.cargo(ps)
    }

    pub fn cargo_payload(&self, cs: usize) -> Mass {
        self.cargo_deck.cargo_payload(cs)
    }

    pub fn max_cargo(&self, cs: usize) -> Mass {
        self.cargo_deck.max_cargo(cs)
    }

    pub fn sound_pax_boarding_playing(&self) -> bool {
        self.boarding_sounds.pax_boarding()
    }

    pub fn sound_pax_ambience_playing(&self) -> bool {
        self.boarding_sounds.pax_ambience()
    }

    pub fn sound_pax_complete_playing(&self) -> bool {
        self.boarding_sounds.pax_complete()
    }

    pub fn sound_pax_deboarding_playing(&self) -> bool {
        self.boarding_sounds.pax_deboarding()
    }

    // ======================================

    fn has_pax(&self) -> bool {
        self.passenger_deck.has_pax()
    }
    fn is_pax_boarding(&self) -> bool {
        self.passenger_deck
            .is_pax_boarding(self.is_boarding_allowed())
    }
    fn is_pax_deboarding(&self) -> bool {
        self.passenger_deck
            .is_pax_deboarding(self.is_boarding_allowed())
    }
    fn is_pax_loaded(&self) -> bool {
        self.passenger_deck.is_pax_loaded()
    }
    fn is_cargo_loaded(&self) -> bool {
        self.cargo_deck.is_cargo_loaded()
    }

    fn is_fully_loaded(&self) -> bool {
        self.is_pax_loaded() && self.is_cargo_loaded()
    }

    // ======================================

    fn update_time(&mut self, delta_time: Duration) {
        self.time += delta_time;
    }

    fn reset_time(&mut self) {
        self.time = Duration::default()
    }

    fn emit_stop_boarding(&mut self) {
        self.boarding_inputs.stop_boarding();
    }

    // ======================================

    fn spawn_all_pax(&mut self) {
        self.passenger_deck.spawn_all_pax();
    }

    fn update_one_tick(&mut self) {
        self.passenger_deck.update_one_tick();
    }

    pub fn override_pax_payload(&mut self, ps: usize, payload: Mass) {
        self.passenger_deck.override_payload(ps, payload)
    }

    fn spawn_all_cargo(&mut self) {
        self.cargo_deck.spawn_all_cargo();
    }

    fn update_one_cargo(&mut self) {
        self.cargo_deck.move_one_cargo();
    }

    fn update_pax_tick(&mut self) {
        match self.board_rate() {
            BoardingRate::Instant => self.spawn_all_pax(),
            BoardingRate::Fast => self.update_one_tick(),
            BoardingRate::Real => self.update_one_tick(),
        }
    }

    fn update_cargo_tick(&mut self) {
        match self.board_rate() {
            BoardingRate::Instant => self.spawn_all_cargo(),
            BoardingRate::Fast => self.update_one_cargo(),
            BoardingRate::Real => self.update_one_cargo(),
        }
    }

    fn update_pax_ambience(&mut self) {
        self.boarding_sounds.play_sound_pax_ambience(self.has_pax());
    }

    fn update_boarding_sounds(&mut self) {
        self.boarding_sounds
            .play_sound_pax_boarding(self.is_pax_boarding() && !self.is_pax_deboarding());
        self.boarding_sounds
            .play_sound_pax_deboarding(self.is_pax_deboarding() && !self.is_pax_boarding());
        self.boarding_sounds.play_sound_pax_complete(
            self.has_pax() && self.is_pax_loaded() && self.is_boarding_allowed(),
        )
    }

    fn stop_boarding_sounds(&mut self) {
        self.boarding_sounds.stop_boarding_sounds()
    }

    // ======================================
    pub fn update(&mut self, delta_time: Duration) {
        self.update_pax_ambience();

        if !self.gsx_driver.is_enabled() {
            if !self.is_boarding_allowed() {
                self.reset_time();
                self.stop_boarding_sounds();
                return;
            }
            let ms_delay = if self.board_rate() == BoardingRate::Instant {
                0
            } else if self.board_rate() == BoardingRate::Fast {
                self.fast_rate.into()
            } else {
                self.real_rate.into()
            };
            self.update_time(delta_time);

            if self.time().as_millis() > ms_delay {
                self.reset_time();
                self.update_pax_tick();
                self.update_cargo_tick();
            }
            self.update_boarding_sounds();
            if self.is_fully_loaded() {
                self.emit_stop_boarding();
            }
        } else {
            self.emit_stop_boarding();
            self.stop_boarding_sounds();
            self.gsx_driver.update(
                &mut self.passenger_deck,
                &mut self.cargo_deck,
                &mut self.boarding_sounds,
            )
        }
    }
}
impl<const P: usize, const G: usize, const C: usize> SimulationElement for PayloadManager<P, G, C> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.boarding_inputs.accept(visitor);
        self.passenger_deck.accept(visitor);
        self.cargo_deck.accept(visitor);
        self.boarding_sounds.accept(visitor);
        self.gsx_driver.accept(visitor);

        visitor.visit(self);
    }
}

pub struct BoardingInputs {
    developer_state_id: VariableIdentifier,
    is_boarding_id: VariableIdentifier,
    board_rate_id: VariableIdentifier,
    per_pax_weight_id: VariableIdentifier,

    developer_state: Rc<Cell<i8>>,
    is_boarding: bool,
    board_rate: BoardingRate,
    per_pax_weight: Rc<Cell<Mass>>,
}
impl BoardingInputs {
    pub fn new(
        context: &mut InitContext,
        per_pax_weight: Rc<Cell<Mass>>,
        developer_state: Rc<Cell<i8>>,
    ) -> Self {
        BoardingInputs {
            developer_state_id: context.get_identifier("DEVELOPER_STATE".to_owned()),
            is_boarding_id: context.get_identifier("BOARDING_STARTED_BY_USR".to_owned()),
            board_rate_id: context.get_identifier("BOARDING_RATE".to_owned()),
            per_pax_weight_id: context.get_identifier("WB_PER_PAX_WEIGHT".to_owned()),

            developer_state,
            is_boarding: false,
            board_rate: BoardingRate::Instant,
            per_pax_weight,
        }
    }

    pub fn is_developer_state_active(&self) -> bool {
        self.developer_state.get() > 0
    }

    pub fn is_boarding(&self) -> bool {
        self.is_boarding
    }

    pub fn board_rate(&self) -> BoardingRate {
        self.board_rate
    }

    pub fn stop_boarding(&mut self) {
        self.is_boarding = false;
    }

    pub fn per_pax_weight(&self) -> Mass {
        self.per_pax_weight.get()
    }
}
impl SimulationElement for BoardingInputs {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.developer_state
            .set(reader.read(&self.developer_state_id));
        self.is_boarding = reader.read(&self.is_boarding_id);
        self.board_rate = reader.read(&self.board_rate_id);
        self.per_pax_weight
            .set(Mass::new::<kilogram>(reader.read(&self.per_pax_weight_id)));
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_boarding_id, self.is_boarding);
        writer.write(
            &self.per_pax_weight_id,
            self.per_pax_weight().get::<kilogram>(),
        );
    }
}

// ========================================
// GSX Integration
// ========================================

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GsxState {
    None,
    Available,
    NotAvailable,
    Bypassed,
    Requested,
    Performing,
    Completed,
}
impl From<f64> for GsxState {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => GsxState::None,
            1 => GsxState::Available,
            2 => GsxState::NotAvailable,
            3 => GsxState::Bypassed,
            4 => GsxState::Requested,
            5 => GsxState::Performing,
            6 => GsxState::Completed,
            i => panic!("Cannot convert from {} to GsxState.", i),
        }
    }
}

read_write_enum!(GsxState);

pub struct GsxInput {
    is_enabled_id: VariableIdentifier,
    boarding_state_id: VariableIdentifier,
    deboarding_state_id: VariableIdentifier,
    pax_boarding_id: VariableIdentifier,
    pax_deboarding_id: VariableIdentifier,
    cargo_boarding_percent_id: VariableIdentifier,
    cargo_deboarding_percent_id: VariableIdentifier,

    is_enabled: bool,
    boarding_state: GsxState,
    deboarding_state: GsxState,
    pax_boarding: i32,
    pax_deboarding: i32,
    cargo_boarding_percent: f64,
    cargo_deboarding_percent: f64,
}
impl GsxInput {
    pub fn new(context: &mut InitContext) -> Self {
        GsxInput {
            is_enabled_id: context.get_identifier("GSX_PAYLOAD_SYNC_ENABLED".to_owned()),
            boarding_state_id: context.get_identifier("FSDT_GSX_BOARDING_STATE".to_owned()),
            deboarding_state_id: context.get_identifier("FSDT_GSX_DEBOARDING_STATE".to_owned()),
            pax_boarding_id: context
                .get_identifier("FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL".to_owned()),
            pax_deboarding_id: context
                .get_identifier("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL".to_owned()),
            cargo_boarding_percent_id: context
                .get_identifier("FSDT_GSX_BOARDING_CARGO_PERCENT".to_owned()),
            cargo_deboarding_percent_id: context
                .get_identifier("FSDT_GSX_DEBOARDING_CARGO_PERCENT".to_owned()),
            is_enabled: false,
            boarding_state: GsxState::None,
            deboarding_state: GsxState::None,
            pax_boarding: 0,
            pax_deboarding: 0,
            cargo_boarding_percent: 0.0,
            cargo_deboarding_percent: 0.0,
        }
    }

    fn is_enabled(&self) -> bool {
        self.is_enabled
    }

    fn boarding_state(&self) -> GsxState {
        self.boarding_state
    }

    fn deboarding_state(&self) -> GsxState {
        self.deboarding_state
    }

    fn pax_boarding(&self) -> i32 {
        self.pax_boarding
    }

    fn pax_deboarding(&self) -> i32 {
        self.pax_deboarding
    }
}
impl SimulationElement for GsxInput {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_enabled = reader.read(&self.is_enabled_id);
        self.pax_boarding = reader.read(&self.pax_boarding_id);
        self.pax_deboarding = reader.read(&self.pax_deboarding_id);
        self.cargo_boarding_percent = reader.read(&self.cargo_boarding_percent_id);
        self.cargo_deboarding_percent = reader.read(&self.cargo_deboarding_percent_id);
        self.boarding_state = reader.read(&self.boarding_state_id);
        self.deboarding_state = reader.read(&self.deboarding_state_id);
    }
}

pub struct GsxDriver {
    gsx_input: GsxInput,
    performing_board: bool,
    performing_deboard: bool,
    deboarding_total: i32,
}
impl GsxDriver {
    pub fn new(context: &mut InitContext) -> Self {
        GsxDriver {
            gsx_input: GsxInput::new(context),
            performing_board: false,
            performing_deboard: false,
            deboarding_total: 0,
        }
    }

    fn is_enabled(&self) -> bool {
        self.gsx_input.is_enabled()
    }

    fn deboarding_state(&self) -> GsxState {
        self.gsx_input.deboarding_state()
    }

    fn boarding_state(&self) -> GsxState {
        self.gsx_input.boarding_state()
    }

    fn has_pax<const P: usize, const G: usize>(
        &self,
        passenger_deck: &PassengerDeck<P, G>,
    ) -> bool {
        passenger_deck.has_pax()
    }

    fn pax_boarding(&self) -> i32 {
        self.gsx_input.pax_boarding()
    }

    fn pax_deboarding(&self) -> i32 {
        self.gsx_input.pax_deboarding()
    }

    fn cargo_boarding_percent(&self) -> f64 {
        self.gsx_input.cargo_boarding_percent
    }

    fn cargo_deboarding_percent(&self) -> f64 {
        self.gsx_input.cargo_deboarding_percent
    }

    pub fn update<const P: usize, const G: usize, const C: usize>(
        &mut self,
        passenger_deck: &mut PassengerDeck<P, G>,
        cargo_deck: &mut CargoDeck<C>,
        boarding_sounds: &mut BoardingSounds,
    ) {
        self.update_boarding_sounds(passenger_deck, boarding_sounds);
        self.update_boarding(passenger_deck, cargo_deck);
        self.update_deboarding(passenger_deck, cargo_deck);
    }

    fn update_boarding_sounds<const P: usize, const G: usize>(
        &mut self,
        passenger_deck: &PassengerDeck<P, G>,
        boarding_sounds: &mut BoardingSounds,
    ) {
        boarding_sounds.play_sound_pax_boarding(self.boarding_state() == GsxState::Performing);
        boarding_sounds.play_sound_pax_deboarding(self.deboarding_state() == GsxState::Performing);
        boarding_sounds.play_sound_pax_ambience(self.has_pax(passenger_deck));
        boarding_sounds.play_sound_pax_complete(self.boarding_state() == GsxState::Completed)
    }

    fn update_boarding<const P: usize, const G: usize, const C: usize>(
        &mut self,
        passenger_deck: &mut PassengerDeck<P, G>,
        cargo_deck: &mut CargoDeck<C>,
    ) {
        match self.boarding_state() {
            GsxState::None
            | GsxState::Available
            | GsxState::NotAvailable
            | GsxState::Bypassed
            | GsxState::Requested => {
                self.performing_board = false;
            }
            GsxState::Completed => {
                if self.performing_board {
                    passenger_deck.spawn_all_pax();
                    cargo_deck.spawn_all_cargo();
                }
                self.performing_board = false;
            }
            GsxState::Performing => {
                passenger_deck.board_pax_until_target(self.pax_boarding());
                cargo_deck.load_cargo_deck_percent(self.cargo_boarding_percent());
                self.performing_board = true;
            }
        }
    }

    fn update_deboarding<const P: usize, const G: usize, const C: usize>(
        &mut self,
        passenger_deck: &mut PassengerDeck<P, G>,
        cargo_deck: &mut CargoDeck<C>,
    ) {
        match self.deboarding_state() {
            GsxState::None | GsxState::Available | GsxState::NotAvailable | GsxState::Bypassed => {
                self.deboarding_total = 0;
                self.performing_deboard = false;
            }
            GsxState::Requested => {
                cargo_deck.update_cargo_loaded();
                passenger_deck.target_none();
                cargo_deck.target_none();
                self.deboarding_total = passenger_deck.total_pax_num();
                self.performing_deboard = false;
            }
            GsxState::Completed => {
                if self.performing_deboard {
                    passenger_deck.spawn_all_pax();
                    cargo_deck.spawn_all_cargo();
                    cargo_deck.reset_cargo_loaded();
                    cargo_deck.target_none();
                }
                self.deboarding_total = 0;
                self.performing_deboard = false;
            }
            GsxState::Performing => {
                passenger_deck
                    .deboard_pax_until_target(self.deboarding_total - self.pax_deboarding());
                cargo_deck.load_cargo_deck_percent(100. - self.cargo_deboarding_percent());
                self.performing_deboard = true;
            }
        }
    }
}
impl SimulationElement for GsxDriver {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.gsx_input.accept(visitor);
        visitor.visit(self);
    }
}
