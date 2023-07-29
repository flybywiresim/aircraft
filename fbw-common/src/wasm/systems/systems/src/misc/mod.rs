use crate::simulation::{
    Read, Reader, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier, Write,
    Writer,
};

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

pub struct Gsx {
    is_enabled_id: VariableIdentifier,
    boarding_state_id: VariableIdentifier,
    deboarding_state_id: VariableIdentifier,
    pax_boarding_id: VariableIdentifier,
    pax_deboarding_id: VariableIdentifier,
    cargo_boarding_pct_id: VariableIdentifier,
    cargo_deboarding_pct_id: VariableIdentifier,

    is_enabled: bool,
    boarding_state: GsxState,
    deboarding_state: GsxState,
    pax_boarding: i32,
    pax_deboarding: i32,
    cargo_boarding_pct: f64,
    cargo_deboarding_pct: f64,
}
impl Gsx {
    pub fn new(
        is_enabled_id: VariableIdentifier,
        boarding_state_id: VariableIdentifier,
        deboarding_state_id: VariableIdentifier,
        pax_boarding_id: VariableIdentifier,
        pax_deboarding_id: VariableIdentifier,
        cargo_boarding_pct_id: VariableIdentifier,
        cargo_deboarding_pct_id: VariableIdentifier,
    ) -> Self {
        Gsx {
            is_enabled_id,
            boarding_state_id,
            deboarding_state_id,
            pax_boarding_id,
            pax_deboarding_id,
            cargo_boarding_pct_id,
            cargo_deboarding_pct_id,
            is_enabled: false,
            boarding_state: GsxState::None,
            deboarding_state: GsxState::None,
            pax_boarding: 0,
            pax_deboarding: 0,
            cargo_boarding_pct: 0.0,
            cargo_deboarding_pct: 0.0,
        }
    }

    pub fn is_enabled(&self) -> bool {
        self.is_enabled
    }

    pub fn boarding_state(&self) -> GsxState {
        self.boarding_state
    }

    pub fn deboarding_state(&self) -> GsxState {
        self.deboarding_state
    }

    pub fn pax_boarding(&self) -> i32 {
        self.pax_boarding
    }

    pub fn pax_deboarding(&self) -> i32 {
        self.pax_deboarding
    }

    pub fn cargo_boarding_pct(&self) -> f64 {
        self.cargo_boarding_pct
    }

    pub fn cargo_deboarding_pct(&self) -> f64 {
        self.cargo_deboarding_pct
    }

    pub fn set_is_enabled(&mut self, is_enabled: bool) {
        self.is_enabled = is_enabled;
    }

    pub fn set_boarding_state(&mut self, boarding_state: GsxState) {
        self.boarding_state = boarding_state;
    }

    pub fn set_deboarding_state(&mut self, deboarding_state: GsxState) {
        self.deboarding_state = deboarding_state;
    }

    pub fn set_pax_boarding(&mut self, pax_boarding: i32) {
        self.pax_boarding = pax_boarding;
    }

    pub fn set_pax_deboarding(&mut self, pax_deboarding: i32) {
        self.pax_deboarding = pax_deboarding;
    }

    pub fn set_cargo_boarding_pct(&mut self, cargo_boarding_pct: f64) {
        self.cargo_boarding_pct = cargo_boarding_pct;
    }

    pub fn set_cargo_deboarding_pct(&mut self, cargo_deboarding_pct: f64) {
        self.cargo_deboarding_pct = cargo_deboarding_pct;
    }
}
impl SimulationElement for Gsx {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_enabled = reader.read(&self.is_enabled_id);
        self.pax_boarding = reader.read(&self.pax_boarding_id);
        self.pax_deboarding = reader.read(&self.pax_deboarding_id);
        self.cargo_boarding_pct = reader.read(&self.cargo_boarding_pct_id);
        self.cargo_deboarding_pct = reader.read(&self.cargo_deboarding_pct_id);
        self.boarding_state = reader.read(&self.boarding_state_id);
        self.deboarding_state = reader.read(&self.deboarding_state_id);
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
    pub fn new(
        pax_board_id: VariableIdentifier,
        pax_deboard_id: VariableIdentifier,
        pax_complete_id: VariableIdentifier,
        pax_ambience_id: VariableIdentifier,
    ) -> Self {
        BoardingSounds {
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

    pub fn pax_boarding(&self) -> bool {
        self.pax_boarding
    }

    pub fn pax_deboarding(&self) -> bool {
        self.pax_deboarding
    }

    pub fn pax_complete(&self) -> bool {
        self.pax_complete
    }

    pub fn pax_ambience(&self) -> bool {
        self.pax_ambience
    }

    pub fn start_pax_boarding(&mut self) {
        self.pax_boarding = true;
    }

    pub fn stop_pax_boarding(&mut self) {
        self.pax_boarding = false;
    }

    pub fn start_pax_deboarding(&mut self) {
        self.pax_deboarding = true;
    }

    pub fn stop_pax_deboarding(&mut self) {
        self.pax_deboarding = false;
    }

    pub fn start_pax_complete(&mut self) {
        self.pax_complete = true;
    }

    pub fn stop_pax_complete(&mut self) {
        self.pax_complete = false;
    }

    pub fn start_pax_ambience(&mut self) {
        self.pax_ambience = true;
    }

    pub fn stop_pax_ambience(&mut self) {
        self.pax_ambience = false;
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
