use crate::shared::{ElectricalBusType, ElectricalBuses};
use crate::simulation::{
    InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
    VariableIdentifier, Write, Writer,
};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd)]
enum SelectedMode {
    Vhf1 = 1,
    Vhf2,
    Vhf3,
    Hf1,
    Hf2,
    Nav,
    Vor,
    Ils,
    Mls,
    Adf,
    Bfo,
    Am,
}
read_write_enum!(SelectedMode);

impl From<f64> for SelectedMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            2 => Self::Vhf2,
            3 => Self::Vhf3,
            4 => Self::Hf1,
            5 => Self::Hf2,
            6 => Self::Nav,
            7 => Self::Vor,
            8 => Self::Ils,
            9 => Self::Mls,
            10 => Self::Adf,
            11 => Self::Bfo,
            12 => Self::Am,
            _ => Self::Vhf1,
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

            selected_mode: SelectedMode::Vhf1,

            toggle_switch: false,
            is_power_supply_powered: false,

            power_supply: ElectricalBusType::DirectCurrentEssential,

            toggle_switch_id: context.get_identifier("RMP_L_TOGGLE_SWITCH".to_string()),
            selected_mode_id: context.get_identifier("RMP_L_SELECTED_MODE".to_string()),
        }
    }

    pub fn new_fo(context: &mut InitContext) -> Self {
        Self {
            id_rmp: 2,

            selected_mode: SelectedMode::Vhf2,

            power_supply: ElectricalBusType::DirectCurrent(2),

            toggle_switch: false,
            is_power_supply_powered: false,

            toggle_switch_id: context.get_identifier("RMP_R_TOGGLE_SWITCH".to_string()),
            selected_mode_id: context.get_identifier("RMP_R_SELECTED_MODE".to_string()),
        }
    }

    //No RMP3 for the time being

    pub fn is_abnormal_mode(&self) -> bool {
        self.is_powered()
            && ((self.selected_mode == SelectedMode::Vhf3
                || self.selected_mode == SelectedMode::Hf1
                || self.selected_mode == SelectedMode::Hf2)
                && (self.id_rmp == 1 || self.id_rmp == 2))
            || (self.selected_mode == SelectedMode::Vhf1 && (self.id_rmp == 2 || self.id_rmp == 3))
            || (self.selected_mode == SelectedMode::Vhf2 && (self.id_rmp == 1 || self.id_rmp == 3))
    }

    pub fn is_nav_backup_mode(&self) -> bool {
        self.selected_mode > SelectedMode::Hf2
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
        self.selected_mode = reader.read(&self.selected_mode_id);
        self.toggle_switch = reader.read(&self.toggle_switch_id);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.power_supply);
    }
}
