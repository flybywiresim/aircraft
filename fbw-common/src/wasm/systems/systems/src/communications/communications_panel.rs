use crate::simulation::{InitContext, SimulationElement, SimulationElementVisitor};

use super::CommunicationPanelSideName;
use crate::communications::audio::AudioControlPanel;

#[derive(Copy, Clone)]
pub struct CommunicationsPanel {
    name: CommunicationPanelSideName,
    acp: AudioControlPanel,
    // We could think of adding a rmp here in the future
}
impl CommunicationsPanel {
    pub fn new(context: &mut InitContext, id_panel: usize) -> Self {
        Self {
            name: match id_panel {
                1 => CommunicationPanelSideName::CAPTAIN,
                2 => CommunicationPanelSideName::FO,
                3 => CommunicationPanelSideName::OVHD,
                _ => CommunicationPanelSideName::NONE,
            },
            acp: AudioControlPanel::new(context, id_panel),
        }
    }

    pub fn get_name(&self) -> CommunicationPanelSideName {
        self.name
    }

    pub fn get_transmit_channel_value(&self) -> u8 {
        self.acp.get_transmit_channel_value()
    }

    pub fn get_volume_com1(&self) -> u8 {
        self.acp.get_volume_com1()
    }

    pub fn get_volume_com2(&self) -> u8 {
        self.acp.get_volume_com2()
    }

    pub fn get_volume_com3(&self) -> u8 {
        self.acp.get_volume_com3()
    }

    pub fn get_volume_adf1(&self) -> u8 {
        self.acp.get_volume_adf1()
    }

    pub fn get_volume_adf2(&self) -> u8 {
        self.acp.get_volume_adf2()
    }

    pub fn get_volume_vor1(&self) -> u8 {
        self.acp.get_volume_vor1()
    }

    pub fn get_volume_vor2(&self) -> u8 {
        self.acp.get_volume_vor2()
    }

    pub fn get_volume_ils(&self) -> u8 {
        self.acp.get_volume_ils()
    }

    pub fn get_volume_gls(&self) -> u8 {
        self.acp.get_volume_gls()
    }

    pub fn get_volume_hf1(&self) -> u8 {
        self.acp.get_volume_hf1()
    }

    pub fn get_volume_hf2(&self) -> u8 {
        self.acp.get_volume_hf2()
    }

    pub fn get_volume_pa(&self) -> u8 {
        self.acp.get_volume_pa()
    }

    pub fn get_volume_mech(&self) -> u8 {
        self.acp.get_volume_mech()
    }

    pub fn get_volume_att(&self) -> u8 {
        self.acp.get_volume_att()
    }

    pub fn get_volume_markers(&self) -> u8 {
        self.acp.get_volume_markers()
    }

    pub fn get_receive_com1(&self) -> bool {
        self.acp.get_receive_com1()
    }

    pub fn get_receive_com2(&self) -> bool {
        self.acp.get_receive_com2()
    }

    pub fn get_receive_com3(&self) -> bool {
        self.acp.get_receive_com3()
    }

    pub fn get_receive_hf1(&self) -> bool {
        self.acp.get_receive_hf1()
    }

    pub fn get_receive_hf2(&self) -> bool {
        self.acp.get_receive_hf2()
    }

    pub fn get_receive_pa(&self) -> bool {
        self.acp.get_receive_pa()
    }

    pub fn get_receive_mech(&self) -> bool {
        self.acp.get_receive_mech()
    }

    pub fn get_receive_att(&self) -> bool {
        self.acp.get_receive_att()
    }

    // For the following receive functions
    // get_voice_button() called here and not in acp.get_receive_adf1()
    // due to the latter used to update the other ACPs and it could lead
    // to an undesired behavior with the knobs getting turned off
    pub fn get_receive_adf1(&self) -> bool {
        self.acp.get_receive_adf1() && !self.acp.get_voice_button()
    }

    pub fn get_receive_adf2(&self) -> bool {
        self.acp.get_receive_adf2() && !self.acp.get_voice_button()
    }

    pub fn get_receive_vor1(&self) -> bool {
        self.acp.get_receive_vor1() && !self.acp.get_voice_button()
    }

    pub fn get_receive_vor2(&self) -> bool {
        self.acp.get_receive_vor2() && !self.acp.get_voice_button()
    }

    pub fn get_receive_ils(&self) -> bool {
        self.acp.get_receive_ils() && !self.acp.get_voice_button()
    }

    pub fn get_receive_gls(&self) -> bool {
        self.acp.get_receive_gls() && !self.acp.get_voice_button()
    }

    pub fn get_receive_markers(&self) -> bool {
        self.acp.get_receive_markers() && !self.acp.get_voice_button()
    }

    pub fn get_voice_button(&self) -> bool {
        self.acp.get_voice_button()
    }

    pub fn get_int_rad_switch(&self) -> u8 {
        self.acp.get_int_rad_switch()
    }

    pub fn is_emitting(&self) -> bool {
        self.acp.is_emitting()
    }
}

impl SimulationElement for CommunicationsPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.acp.accept(visitor);

        visitor.visit(self);
    }
}
