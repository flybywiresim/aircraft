use crate::shared::{ElectricalBusType, ElectricalBuses};
use crate::simulation::{
    InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
    VariableIdentifier,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd)]
enum SelectedMode {
    VHF1 = 1,
    VHF2,
    VHF3,
    HF1,
    HF2,
    VOR,
    ILS,
    MLS,
    ADF,
    BFO,
    AM,
    NAV,
}

impl From<f64> for SelectedMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            2 => Self::VHF2,
            3 => Self::VHF3,
            4 => Self::HF1,
            5 => Self::HF2,
            6 => Self::VOR,
            7 => Self::ILS,
            8 => Self::MLS,
            9 => Self::ADF,
            10 => Self::BFO,
            11 => Self::AM,
            12 => Self::NAV,
            _ => Self::VHF1,
        }
    }
}

#[derive(Clone)]
pub struct RadioManagementPanel {
    id_rmp: usize,
    selected_mode: SelectedMode,

    toggle_switch: bool,
    is_power_supply_powered: bool,

    power_supply: ElectricalBusType,

    toggle_switch_id: VariableIdentifier,
    selected_mode_id: VariableIdentifier,
}
impl RadioManagementPanel {
    pub fn new_cpt(context: &mut InitContext) -> Self {
        Self {
            id_rmp: 1,

            selected_mode: SelectedMode::VHF1,

            toggle_switch: false,
            is_power_supply_powered: false,

            power_supply: ElectricalBusType::DirectCurrentEssential,

            toggle_switch_id: context.get_identifier(format!("RMP_L_TOGGLE_SWITCH")),
            selected_mode_id: context.get_identifier(format!("RMP_L_SELECTED_MODE")),
        }
    }

    pub fn new_fo(context: &mut InitContext) -> Self {
        Self {
            id_rmp: 2,

            selected_mode: SelectedMode::VHF2,

            power_supply: ElectricalBusType::DirectCurrent(2),

            toggle_switch: false,
            is_power_supply_powered: false,

            toggle_switch_id: context.get_identifier(format!("RMP_R_TOGGLE_SWITCH")),
            selected_mode_id: context.get_identifier(format!("RMP_R_SELECTED_MODE")),
        }
    }

    //No RMP3 for the time being

    pub fn is_abnormal_mode(&self) -> bool {
        self.is_powered()
            && ((self.selected_mode == SelectedMode::VHF3
                || self.selected_mode == SelectedMode::HF1
                || self.selected_mode == SelectedMode::HF2)
                && (self.id_rmp == 1 || self.id_rmp == 2))
            || (self.selected_mode == SelectedMode::VHF1 && (self.id_rmp == 2 || self.id_rmp == 3))
            || (self.selected_mode == SelectedMode::VHF2 && (self.id_rmp == 1 || self.id_rmp == 3))
    }

    pub fn is_powered(&self) -> bool {
        self.toggle_switch && self.is_power_supply_powered
    }
}

impl SimulationElement for RadioManagementPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.selected_mode = SelectedMode::from(reader.read_f64(&self.selected_mode_id));
        self.toggle_switch = reader.read(&self.toggle_switch_id);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.power_supply);
    }
}
