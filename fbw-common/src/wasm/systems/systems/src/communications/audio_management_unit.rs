use crate::{
    //communications::receivers::*,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        ElectricalBusType, ElectricalBuses,
    },
    simulation::{
        InitContext, Read, SideControlling, SimulationElement, SimulationElementVisitor,
        SimulatorReader, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};
use std::time::Duration;

use num_derive::FromPrimitive;
use num_traits::FromPrimitive;

use super::audio_control_panel::AudioControlPanel;
use super::receivers::{CommTransceiver, NavReceiver};

// Restart full cycle every 160ms as stated in AMM
pub const TIMEOUT: Duration = Duration::from_millis(160);

enum TypeCard {
    Selcal(Selcal),
    Bite(Bite),
}

pub struct WordAudioManagementUnitAudioControlPanelInfo {
    identification: IdentificationWordAudioManagementUnitAudioControlPanel,
    sdi: u32,
    label: LabelWordAudioManagementUnitAudioControlPanel,
}
impl WordAudioManagementUnitAudioControlPanelInfo {
    pub fn new(
        identification: IdentificationWordAudioManagementUnitAudioControlPanel,
        // sdi is a term used in the protocol documentation to describe which subsystem/instrument
        // of a group is being monitored. For instance, 1 for VOR1, 2 for VOR2.
        // I don't know what it stands for though
        sdi: u32,
        label: LabelWordAudioManagementUnitAudioControlPanel,
    ) -> Self {
        Self {
            identification,
            sdi,
            label,
        }
    }

    pub fn get_identification(&self) -> IdentificationWordAudioManagementUnitAudioControlPanel {
        self.identification
    }

    pub fn get_sdi(&self) -> u32 {
        self.sdi
    }

    pub fn get_label(&self) -> LabelWordAudioManagementUnitAudioControlPanel {
        self.label
    }
}

#[derive(Eq, PartialEq, PartialOrd, Copy, Clone)]
pub enum IdentificationWordAudioManagementUnitAudioControlPanel {
    Word0,
    WordAudioManagementUnit,
    Word01,
    Word02,
    Word03,
    Word04,
    Word05,
    Word06,
    Word07,
    Word08,
    Word09,
    Word10,
    Word11,
    Word12,
    // Satcom but not used for now
    // Word13(LabelArinc429Comms, i32 ),
    // Word14(LabelArinc429Comms, i32 ),
    Word15,
    Word16,
}

#[repr(u32)]
#[derive(FromPrimitive, Eq, PartialOrd, PartialEq, Copy, Clone)]
pub enum LabelWordAudioManagementUnitAudioControlPanel {
    Label300Request = 3,
    Label301AudioManagementUnit = 0x83,
    Label210VolumeControlVhf = 0x11,
    Label211VolumeControlHf = 0x91,
    Label212VolumeControlAdfPa = 0x51,
    Label213VolumeControlVorMkr = 0xD1,
    Label215VolumeControlIntCab = 0xB1,
    Label217VolumeControlIls = 0xF1,
}
#[derive(Copy, Clone)]
pub struct MixedAudio {
    receive_com1: bool,
    receive_com2: bool,
    receive_adf1: bool,
    receive_adf2: bool,
    receive_vor1: bool,
    receive_vor2: bool,
    receive_ils: bool,
    enable_beep: bool,
    receive_markers: bool,
    sound_markers: bool,

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // receive_gls: bool,
    // receive_hf1: bool,
    // receive_hf2: bool,
    // receive_mech: bool,
    // receive_att: bool,
    // receive_pa: bool,
    //
    volume_com1: u32,
    volume_com2: u32,
    volume_com3: u32,
    volume_adf1: u32,
    volume_adf2: u32,
    volume_vor1: u32,
    volume_vor2: u32,
    volume_ils: u32,
    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // volume_markers: u32,
    // volume_hf1: u32,
    // volume_hf2: u32,
    // volume_att: u32,
    // volume_mech: u32,
    // volume_pa: u32,
    //
}

impl Default for MixedAudio {
    fn default() -> MixedAudio {
        MixedAudio {
            receive_com1: false,
            receive_com2: false,
            receive_adf1: false,
            receive_adf2: false,
            receive_vor1: false,
            receive_vor2: false,
            receive_ils: false,
            enable_beep: false,
            receive_markers: true,
            sound_markers: false,
            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // receive_gls: false,
            // receive_hf1: false,
            // receive_hf2: false,
            // receive_mech: false,
            // receive_att: false,
            // receive_pa: false,
            //
            volume_com1: 0,
            volume_com2: 0,
            volume_com3: 0,
            volume_adf1: 0,
            volume_adf2: 0,
            volume_vor1: 0,
            volume_vor2: 0,
            volume_ils: 0,
            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // volume_markers: 0,
            // volume_hf1: 0,
            // volume_hf2: 0,
            // volume_att: 0,
            // volume_mech: 0,
            // volume_pa: 0,
            //
        }
    }
}

#[derive(Default, PartialEq, Eq)]
pub enum AudioSwitchingKnobPosition {
    Captain,
    #[default]
    Norm,
    Fo,
}
read_write_enum!(AudioSwitchingKnobPosition);
impl From<f64> for AudioSwitchingKnobPosition {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => Self::Captain,
            2 => Self::Fo,
            _ => Self::Norm,
        }
    }
}

pub struct AudioManagementUnit {
    adaptation_board: AdaptationBoard,
}
impl AudioManagementUnit {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            adaptation_board: AdaptationBoard::new(context),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.adaptation_board.update(context);
    }
}

impl SimulationElement for AudioManagementUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adaptation_board.accept(visitor);

        visitor.visit(self);
    }
}

pub struct AdaptationBoard {
    acp_ovhd: AudioControlPanel,
    bus_acp_3rd: Vec<Arinc429Word<u32>>,
    bus_acp_avncs: Vec<Arinc429Word<u32>>,
    bus_arinc_3rd: Vec<Arinc429Word<u32>>,
    bus_arinc_bay: Vec<Arinc429Word<u32>>,

    computer_a: Computer,
    computer_b: Computer,

    mixed_audio: MixedAudio,

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // receive_com3_id: VariableIdentifier, deactivated since vPilot needs com3 to be always on
    // receive_hf1_id: VariableIdentifier,
    // receive_hf2_id: VariableIdentifier,
    // receive_mech_id: VariableIdentifier,
    // receive_att_id: VariableIdentifier,
    // receive_pa_id: VariableIdentifier,
    //
    receive_markers_id: VariableIdentifier,
    //receive_gls_id: VariableIdentifier,
    //
    volume_com1_id: VariableIdentifier,
    volume_com2_id: VariableIdentifier,
    volume_com3_id: VariableIdentifier,

    volume_adf1_id: VariableIdentifier,
    volume_adf2_id: VariableIdentifier,
    volume_vor1_id: VariableIdentifier,
    volume_vor2_id: VariableIdentifier,
    volume_ils_id: VariableIdentifier,
    sound_markers_id: VariableIdentifier,

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    //volume_markers_id: VariableIdentifier,
    //volume_gls_id: VariableIdentifier,
    // volume_hf1_id: VariableIdentifier,
    // volume_hf2_id: VariableIdentifier,
    // volume_mech_id: VariableIdentifier,
    // volume_att_id: VariableIdentifier,
    // volume_pa_id: VariableIdentifier,
    // voice_button_id: VariableIdentifier,
    //
    ls_fcu1_pressed_id: VariableIdentifier,
    ls_fcu2_pressed_id: VariableIdentifier,

    pilot_transmit_id: VariableIdentifier,
    copilot_transmit_id: VariableIdentifier,

    vhfs: [CommTransceiver; 2],
    adfs: [NavReceiver; 2],
    vors: [NavReceiver; 2],
    ils: NavReceiver,

    is_flt_int_powered: bool,
    is_calls_card_powered: bool,

    audio_switching_knob_id: VariableIdentifier,
    audio_switching_knob: AudioSwitchingKnobPosition,

    ls_fcu1_pressed: bool,
    ls_fcu2_pressed: bool,

    pilot_transmit_channel: u32,
}

impl AdaptationBoard {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            acp_ovhd: AudioControlPanel::new(context, 3, ElectricalBusType::DirectCurrent(1)),
            bus_acp_3rd: Vec::new(),
            bus_acp_avncs: Vec::new(),
            bus_arinc_3rd: Vec::new(),
            bus_arinc_bay: Vec::new(),

            computer_a: Computer::new_cpt_and_avncs(context),
            computer_b: Computer::new_fo_and_ovhd(context),

            mixed_audio: Default::default(),

            // Needed to update the K events
            receive_markers_id: context.get_identifier("MARKER_IDENT".to_owned()),
            sound_markers_id: context.get_identifier("MARKER SOUND".to_owned()),

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            //receive_gls_id: context.get_identifier("GLS_IDENT".to_owned()),
            //
            volume_com1_id: context.get_identifier("VHF1_VOLUME".to_owned()),
            volume_com2_id: context.get_identifier("VHF2_VOLUME".to_owned()),
            volume_com3_id: context.get_identifier("VHF3_VOLUME".to_owned()),

            // Have to use custom Nav volume due to impossibility to overwrite native morse code playing
            volume_adf1_id: context.get_identifier("ADF_VOLUME:1".to_owned()),
            volume_adf2_id: context.get_identifier("ADF_VOLUME:2".to_owned()),
            volume_vor1_id: context.get_identifier("NAV_VOLUME:1".to_owned()),
            volume_vor2_id: context.get_identifier("NAV_VOLUME:2".to_owned()),
            volume_ils_id: context.get_identifier("NAV_VOLUME:3".to_owned()),

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // volume_markers_id: context.get_identifier("MKR_VOLUME".to_owned()),
            // volume_gls_id: context.get_identifier("NAV_VOLUME:4".to_owned()),
            // receive_com3_id: VariableIdentifier, deactivated since vPilot needs com3 to be always on
            // receive_hf1_id: context.get_identifier("HF1_RECEIVE".to_owned()),
            // receive_hf2_id: context.get_identifier("HF2_RECEIVE".to_owned()),
            // receive_att_id: context.get_identifier("ATT_RECEIVE".to_owned()),
            // receive_mech_id: context.get_identifier("MECH_RECEIVE".to_owned()),
            // receive_pa_id: context.get_identifier("PA_RECEIVE".to_owned()),
            // voice_button_id: context.get_identifier("VOICE_BUTTON_DOWN".to_owned()),
            // volume_hf1_id: context.get_identifier("HF1_VOLUME".to_owned()),
            // volume_hf2_id: context.get_identifier("HF2_VOLUME".to_owned()),
            // volume_att_id: context.get_identifier("ATT_VOLUME".to_owned()),
            // volume_mech_id: context.get_identifier("MECH_VOLUME".to_owned()),
            // volume_pa_id: context.get_identifier("PA_VOLUME".to_owned()),

            //_FILTER_ACTIVE Should be moved to C++ with an even, same as A380.
            // beside Morse code generation
            ls_fcu1_pressed_id: context.get_identifier("BTN_LS_1_FILTER_ACTIVE".to_owned()),
            ls_fcu2_pressed_id: context.get_identifier("BTN_LS_2_FILTER_ACTIVE".to_owned()),

            audio_switching_knob_id: context.get_identifier("AUDIOSWITCHING_KNOB".to_owned()),

            pilot_transmit_id: context.get_identifier("PILOT_TRANSMIT_CHANNEL".to_owned()),
            copilot_transmit_id: context.get_identifier("COPILOT_TRANSMIT_CHANNEL".to_owned()),

            vhfs: [
                CommTransceiver::new(context, 1, ElectricalBusType::DirectCurrentEssential),
                CommTransceiver::new(context, 2, ElectricalBusType::DirectCurrent(2)),
            ],
            adfs: [
                NavReceiver::new(
                    context,
                    "ADF1",
                    ElectricalBusType::AlternatingCurrentEssentialShed,
                ),
                NavReceiver::new(context, "ADF2", ElectricalBusType::AlternatingCurrent(2)),
            ],
            vors: [
                NavReceiver::new(
                    context,
                    "VOR1",
                    ElectricalBusType::AlternatingCurrentEssential,
                ),
                NavReceiver::new(context, "VOR2", ElectricalBusType::AlternatingCurrent(2)),
            ],
            ils: NavReceiver::new(
                context,
                "ILS",
                ElectricalBusType::AlternatingCurrentEssential,
            ),

            pilot_transmit_channel: 1,

            is_flt_int_powered: false,
            is_calls_card_powered: false,

            audio_switching_knob: AudioSwitchingKnobPosition::default(),

            ls_fcu1_pressed: false,
            ls_fcu2_pressed: false,
        }
    }

    pub fn send_amu_word(bus_acp: &mut Vec<Arinc429Word<u32>>, transmission_table: &u32) {
        let mut word_arinc: Arinc429Word<u32> = Arinc429Word::new(0, SignStatus::NormalOperation);

        word_arinc.set_bits(
            1,
            LabelWordAudioManagementUnitAudioControlPanel::Label301AudioManagementUnit as u32,
        );
        word_arinc.set_bits(11, *transmission_table);

        // Will have to be used when SELCAL will be written in Rust
        // word_arinc.set_bits(25, (calls > 4) & 1);
        // word_arinc.set_bits(26, (calls > 3) & 1);
        // word_arinc.set_bits(27, (calls > 2) & 1);
        // word_arinc.set_bits(28, (calls > 1) & 1);
        // word_arinc.set_bits(29, calls & 1);

        bus_acp.push(word_arinc);
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let acp_to_take_into_account = if self.audio_switching_knob
            != AudioSwitchingKnobPosition::Fo
            && context.side_controlling() == SideControlling::FO
        {
            2
        } else if self.audio_switching_knob == AudioSwitchingKnobPosition::Fo
            && context.side_controlling() == SideControlling::FO
            || self.audio_switching_knob == AudioSwitchingKnobPosition::Captain
                && context.side_controlling() == SideControlling::CAPTAIN
        {
            3
        } else {
            1
        };

        self.computer_a.update(context, &mut self.bus_arinc_bay);
        self.computer_b.update(context, &mut self.bus_arinc_3rd);

        // 3rd ACP is connected to Board B by default
        // hence if audio switching knob is NOT on FO, data can be wired to default board

        // Appends pretty useless in this case but in real life this is what happens
        if self.audio_switching_knob != AudioSwitchingKnobPosition::Fo {
            self.bus_acp_3rd.append(&mut self.bus_arinc_3rd);
            self.acp_ovhd.update(context, &mut self.bus_acp_3rd);
            self.bus_arinc_3rd.append(&mut self.bus_acp_3rd);
        } else {
            self.bus_acp_avncs.append(&mut self.bus_arinc_bay);
            self.acp_ovhd.update(context, &mut self.bus_acp_avncs);
            self.bus_arinc_bay.append(&mut self.bus_acp_avncs);
        }

        if acp_to_take_into_account == 1 {
            self.mixed_audio = self.computer_a.get_mixed_audio_acp();

            self.pilot_transmit_channel = self.computer_a.get_transmission_table_acp();
        } else if acp_to_take_into_account == 2 {
            self.mixed_audio = self.computer_b.get_mixed_audio_acp();
            self.pilot_transmit_channel = self.computer_b.get_transmission_table_acp();
        } else if context.side_controlling() == SideControlling::CAPTAIN {
            self.mixed_audio = self.computer_b.get_mixed_audio_acp3();
            self.pilot_transmit_channel = self.computer_b.get_transmission_table_acp3();
        } else {
            self.mixed_audio = self.computer_a.get_mixed_audio_acp3();
            self.pilot_transmit_channel = self.computer_a.get_transmission_table_acp3();
        }

        // We only take into account VHF1/2 as Vatsim and IVAO use them only
        // 4 stands for NONE as per SDK but stand for HF1 for us therefore we need to filter
        self.pilot_transmit_channel = if self.pilot_transmit_channel == 0
            || self.pilot_transmit_channel > 2
            || self.pilot_transmit_channel == 1 && !self.vhfs[0].is_powered()
            || self.pilot_transmit_channel == 2 && !self.vhfs[1].is_powered()
        {
            4
        } else {
            self.pilot_transmit_channel - 1
        };

        self.vhfs[0].update(self.mixed_audio.receive_com1);
        self.vhfs[1].update(self.mixed_audio.receive_com2);

        self.adfs[0].update(
            context,
            !self.mixed_audio.enable_beep && self.mixed_audio.receive_adf1,
        );
        self.adfs[1].update(
            context,
            !self.mixed_audio.enable_beep && self.mixed_audio.receive_adf2,
        );

        self.vors[0].update(
            context,
            !self.mixed_audio.enable_beep && self.mixed_audio.receive_vor1,
        );
        self.vors[1].update(
            context,
            !self.mixed_audio.enable_beep && self.mixed_audio.receive_vor2,
        );

        self.ils.update(
            context,
            if context.side_controlling() == SideControlling::CAPTAIN {
                self.ls_fcu1_pressed && self.mixed_audio.receive_ils
            } else {
                self.ls_fcu2_pressed && self.mixed_audio.receive_ils
            },
        );
    }
}

impl SimulationElement for AdaptationBoard {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.vhfs, visitor);
        accept_iterable!(self.adfs, visitor);
        accept_iterable!(self.vors, visitor);

        self.ils.accept(visitor);

        self.acp_ovhd.accept(visitor);
        self.computer_a.accept(visitor);
        self.computer_b.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_flt_int_powered = buses.is_powered(ElectricalBusType::DirectCurrentEssential);
        self.is_calls_card_powered = buses.is_powered(ElectricalBusType::DirectCurrent(1));
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.mixed_audio.sound_markers = reader.read(&self.sound_markers_id);
        let ls_fcu1_pressed = reader.read(&self.ls_fcu1_pressed_id);
        let ls_fcu2_pressed = reader.read(&self.ls_fcu2_pressed_id);

        self.audio_switching_knob = reader.read(&self.audio_switching_knob_id);

        self.ls_fcu1_pressed = ls_fcu1_pressed;
        self.ls_fcu2_pressed = ls_fcu2_pressed;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pilot_transmit_id, self.pilot_transmit_channel);
        // Forcing copilot to NONE as the pilot version sets copilot too and it's an undesired behaviour
        writer.write(&self.copilot_transmit_id, 4);

        // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
        // writer.write(&self.receive_gls_id, self.mixed_audio.receive_gls);
        // writer.write(&self.receive_hf1_id, self.receive_hf1);
        // writer.write(&self.receive_hf2_id, self.receive_hf2);
        // writer.write(&self.receive_mech_id, self.receive_mech);
        // writer.write(&self.receive_att_id, self.receive_att);
        // writer.write(&self.receive_pa_id, self.receive_pa);

        // Special case for markers as there's no XXXX_SET function. Only Toggle.
        if self.mixed_audio.receive_markers && !self.mixed_audio.sound_markers
            || !self.mixed_audio.receive_markers && self.mixed_audio.sound_markers
        {
            writer.write(&self.receive_markers_id, !self.mixed_audio.sound_markers);
        }

        writer.write(&self.volume_com1_id, self.mixed_audio.volume_com1);
        writer.write(&self.volume_com2_id, self.mixed_audio.volume_com2);
        writer.write(&self.volume_com3_id, self.mixed_audio.volume_com3);
        writer.write(&self.volume_adf1_id, self.mixed_audio.volume_adf1);
        writer.write(&self.volume_adf2_id, self.mixed_audio.volume_adf2);
        writer.write(&self.volume_vor1_id, self.mixed_audio.volume_vor1);
        writer.write(&self.volume_vor2_id, self.mixed_audio.volume_vor2);
        writer.write(&self.volume_ils_id, self.mixed_audio.volume_ils);

        // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
        // writer.write(&self.volume_markers_id, self.mixed_audio.volume_markers);
        // writer.write(&self.volume_gls_id, self.mixed_audio.volume_gls);
        // writer.write(&self.volume_hf1_id, self.volume_hf1);
        // writer.write(&self.volume_hf2_id, self.volume_hf2);
        // writer.write(&self.volume_att_id, self.volume_att);
        // writer.write(&self.volume_mech_id, self.volume_mech);
        // writer.write(&self.volume_pa_id, self.volume_pa);
    }
}

pub struct Computer {
    audio_card: AudioCard,
    _second_card: TypeCard,

    is_power_supply_powered: bool,
}

impl Computer {
    pub fn new_cpt_and_avncs(context: &mut InitContext) -> Self {
        Self {
            audio_card: AudioCard::new(context, 1),
            // Not used for now
            _second_card: TypeCard::Selcal(Selcal::new()),
            is_power_supply_powered: false,
        }
    }

    pub fn new_fo_and_ovhd(context: &mut InitContext) -> Self {
        Self {
            audio_card: AudioCard::new(context, 2),
            // Not used for now
            _second_card: TypeCard::Bite(Bite::new()),
            is_power_supply_powered: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, bus: &mut Vec<Arinc429Word<u32>>) {
        self.audio_card
            .update(context, bus, self.is_power_supply_powered);
    }

    pub fn get_mixed_audio_acp(&self) -> MixedAudio {
        self.audio_card.get_mixed_audio_acp()
    }

    pub fn get_mixed_audio_acp3(&self) -> MixedAudio {
        self.audio_card.get_mixed_audio_acp3()
    }

    pub fn get_transmission_table_acp(&self) -> u32 {
        self.audio_card.get_transmission_table_acp()
    }

    pub fn get_transmission_table_acp3(&self) -> u32 {
        self.audio_card.get_transmission_table_acp3()
    }
}

impl SimulationElement for Computer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.audio_card.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(ElectricalBusType::DirectCurrentEssential);
    }
}

pub struct AudioCard {
    bus_acp: Vec<Arinc429Word<u32>>,
    acp: AudioControlPanel,
    mixed_audio_acp: MixedAudio,
    mixed_audio_acp3: MixedAudio,
    transmission_table_acp: u32,
    transmission_table_acp3: u32,
    last_time_data_received_from_acp: Duration,
    last_time_data_received_from_acp3: Duration,
}

impl AudioCard {
    pub fn new(context: &mut InitContext, id_acp: u32) -> Self {
        Self {
            bus_acp: Vec::new(),
            acp: AudioControlPanel::new(context, id_acp, ElectricalBusType::DirectCurrentEssential),
            mixed_audio_acp: Default::default(),
            mixed_audio_acp3: Default::default(),
            transmission_table_acp: 0,
            transmission_table_acp3: 0,
            last_time_data_received_from_acp: Duration::from_millis(0),
            last_time_data_received_from_acp3: Duration::from_millis(0),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        bus_from_adaptation_card: &mut Vec<Arinc429Word<u32>>,
        is_powered: bool,
    ) {
        self.last_time_data_received_from_acp += context.delta();
        self.last_time_data_received_from_acp3 += context.delta();

        if is_powered {
            self.acp.update(context, &mut self.bus_acp);

            if !self.bus_acp.is_empty() {
                self.last_time_data_received_from_acp = Duration::from_millis(0);
            }

            AudioCard::decode_arinc_words_from_acp(
                &mut self.bus_acp,
                &mut self.mixed_audio_acp,
                &mut self.transmission_table_acp,
            );

            if !bus_from_adaptation_card.is_empty() {
                self.last_time_data_received_from_acp3 = Duration::from_millis(0);
            }

            AudioCard::decode_arinc_words_from_acp(
                bus_from_adaptation_card,
                &mut self.mixed_audio_acp3,
                &mut self.transmission_table_acp3,
            );

            // If data were not received within timeframe, we consider the ACP as U/S
            if self.last_time_data_received_from_acp > TIMEOUT {
                self.mixed_audio_acp = Default::default();
            }

            if self.last_time_data_received_from_acp3 > TIMEOUT {
                self.mixed_audio_acp3 = Default::default();
            }
        } else {
            self.mixed_audio_acp = Default::default();
            self.mixed_audio_acp3 = Default::default();

            self.bus_acp.clear();
            bus_from_adaptation_card.clear();
        }
    }

    pub fn decode_arinc_words_from_acp(
        bus: &mut Vec<Arinc429Word<u32>>,
        mixed_audio: &mut MixedAudio,
        transmission_table_acp: &mut u32,
    ) {
        let mut can_send_amu_word = false;

        while let Some(word) = bus.pop() {
            let label_option: Option<LabelWordAudioManagementUnitAudioControlPanel> =
                FromPrimitive::from_u32(word.get_bits(8, 1));

            if let Some(label) = label_option {
                if label == LabelWordAudioManagementUnitAudioControlPanel::Label300Request {
                    // Here the ACP id is available in the word
                    // but we don't need it for now. Maybe in the future with more information...
                    can_send_amu_word = true;
                } else {
                    let sdi = word.get_bits(2, 9) as u8;
                    let transmission_table = word.get_bits(4, 11);
                    let volume = word.get_bits(8, 17);
                    let reception = word.get_bits(1, 25);
                    mixed_audio.enable_beep = word.get_bits(1, 26) != 0;

                    // No not used so far
                    // let _int = word.get_bits(1, 15) != 0;
                    // let _rad = word.get_bits(1, 16) != 0;
                    // let _reset = word.get_bits(1, 27) != 0;

                    *transmission_table_acp = transmission_table;

                    // Perform this only if the data currently analyzed is from the chosen acp
                    match label {
                        LabelWordAudioManagementUnitAudioControlPanel::Label210VolumeControlVhf => {
                            if sdi == 1 {
                                mixed_audio.volume_com1 = volume;
                                mixed_audio.receive_com1 = reception != 0;
                            } else if sdi == 2 {
                                mixed_audio.volume_com2 = volume;
                                mixed_audio.receive_com2 = reception != 0;
                            } else if sdi == 3 {
                                mixed_audio.volume_com3 = volume;
                                // Comment due to vPilot that needs com3 to be received all the time
                                //mixed_audio.receive_com3 = reception != 0;
                            }
                        }
                        LabelWordAudioManagementUnitAudioControlPanel::Label213VolumeControlVorMkr => {
                            if sdi == 1 {
                                mixed_audio.volume_vor1 = volume;
                                mixed_audio.receive_vor1 = reception != 0;
                            } else if sdi == 2 {
                                mixed_audio.volume_vor2 = volume;
                                mixed_audio.receive_vor2 = reception != 0;
                            } else if sdi == 3 {
                                mixed_audio.receive_markers = reception != 0;
                            }
                        }
                        LabelWordAudioManagementUnitAudioControlPanel::Label212VolumeControlAdfPa => {
                            // PA should be here but not simulated
                            if sdi == 1 {
                                mixed_audio.volume_adf1 = volume;
                                mixed_audio.receive_adf1 = reception != 0;
                            } else if sdi == 2 {
                                mixed_audio.volume_adf2 = volume;
                                mixed_audio.receive_adf2 = reception != 0;
                            }
                        }
                        LabelWordAudioManagementUnitAudioControlPanel::Label217VolumeControlIls => {
                            mixed_audio.volume_ils = volume;
                            // TODO: Use data from future DMC. There's a wire between comms and DMC
                            // FCOM compliant: ILS can be listened to only if LS is pressed
                            mixed_audio.receive_ils = reception != 0;
                        }
                        _ => {}
                    }
                }
            }
        }

        if can_send_amu_word {
            AdaptationBoard::send_amu_word(bus, transmission_table_acp);
        }
    }

    pub fn get_mixed_audio_acp(&self) -> MixedAudio {
        self.mixed_audio_acp
    }

    pub fn get_mixed_audio_acp3(&self) -> MixedAudio {
        self.mixed_audio_acp3
    }

    pub fn get_transmission_table_acp(&self) -> u32 {
        self.transmission_table_acp
    }

    pub fn get_transmission_table_acp3(&self) -> u32 {
        self.transmission_table_acp3
    }
}

impl SimulationElement for AudioCard {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.acp.accept(visitor);

        visitor.visit(self);
    }
}

pub struct Selcal {}
impl Selcal {
    pub fn new() -> Self {
        Self {}
    }
}
pub struct Bite {}
impl Bite {
    pub fn new() -> Self {
        Self {}
    }
}
