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

use num_derive::FromPrimitive;
use num_traits::FromPrimitive;

use super::acp::AudioControlPanel;

enum TypeCard {
    SELCAL(SELCAL),
    BITE(BITE),
}

pub struct AAA {
    identification: IdentificationWordAMUACP,
    sdi: u32,
    label: LabelWordAMUACP,
}
impl AAA {
    pub fn new(identification: IdentificationWordAMUACP, sdi: u32, label: LabelWordAMUACP) -> Self {
        Self {
            identification,
            sdi,
            label,
        }
    }

    pub fn get_identification(&self) -> IdentificationWordAMUACP {
        self.identification
    }

    pub fn get_sdi(&self) -> u32 {
        self.sdi
    }

    pub fn get_label(&self) -> LabelWordAMUACP {
        self.label
    }
}

#[derive(Eq, PartialEq, PartialOrd, Copy, Clone)]
pub enum IdentificationWordAMUACP {
    WORD0,
    WORDAMU,
    WORD01,
    WORD02,
    WORD03,
    WORD04,
    WORD05,
    WORD06,
    WORD07,
    WORD08,
    WORD09,
    WORD10,
    WORD11,
    WORD12,
    // SATCOM but not used for now
    // WORD13(LabelArinc429Comms, i32 ),
    // WORD14(LabelArinc429Comms, i32 ),
    WORD15,
    WORD16,
}

#[repr(u32)]
#[derive(FromPrimitive, Eq, PartialOrd, PartialEq, Copy, Clone)]
pub enum LabelWordAMUACP {
    Label300Request = 3,
    Label301AMU = 0x83,
    Label210VolumeControlVHF = 0x11,
    Label211VolumeControlHF = 0x91,
    Label212VolumeControlADFPA = 0x51,
    Label213VolumeControlVORMKR = 0xD1,
    Label215VolumeControlINTCAB = 0xB1,
    Label217VolumeControlILS = 0xF1,
}
#[derive(Default)]
pub struct MixedAudio {
    receive_com1: bool,
    receive_com2: bool,
    receive_adf1: bool,
    receive_adf2: bool,
    receive_vor1: bool,
    receive_vor2: bool,
    receive_ils: bool,
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
    volume_com1: u8,
    volume_com2: u8,
    volume_com3: u8,
    volume_adf1: u8,
    volume_adf2: u8,
    volume_vor1: u8,
    volume_vor2: u8,
    volume_ils: u8,
    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // volume_markers: u8,
    // volume_hf1: u8,
    // volume_hf2: u8,
    // volume_att: u8,
    // volume_mech: u8,
    // volume_pa: u8,
    //
}
impl MixedAudio {
    pub fn new() -> Self {
        Self {
            receive_markers: true,
            ..Default::default()
        }
    }
}

#[derive(Default, PartialEq, Eq)]
pub enum AudioSwitchingKnobPosition {
    CAPTAIN,
    #[default]
    NORM,
    FO,
}

pub struct AMU {
    adaptation_board: AdaptationBoard,
    // vhfs: [VHF; 3],
    // comms: [COMM; 5], // Transceivers not simulated due to SDK capabilities. Just to make the knobs rotatable/pushable
    // adfs: [ADF; 2],
    // vors: [VOR; 2],
    // ils: ILS,
    // gls: GLS,
    // markers: MARKERS,
}
impl AMU {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            adaptation_board: AdaptationBoard::new(context),
            // vhfs: [VHF::new_vhf1(), VHF::new_vhf2(), VHF::new_vhf3()],
            // comms: [
            //     COMM::new_hf1(),
            //     COMM::new_hf1(),
            //     COMM::new_cids1(),
            //     COMM::new_cids2(),
            //     COMM::new_flt_int(),
            // ],
            // adfs: [ADF::new_adf1(), ADF::new_adf2()],
            // vors: [VOR::new_vor1(), VOR::new_vor2()],
            // ils: ILS::new_ils(),
            // gls: GLS::new_gls(),
            // markers: MARKERS::new_markers(),
        }
    }

    // pub fn is_vhf1_powered(&self) -> bool {
    //     self.vhfs[0].is_powered()
    // }

    // pub fn is_vhf2_powered(&self) -> bool {
    //     self.vhfs[1].is_powered()
    // }

    // pub fn is_vhf3_powered(&self) -> bool {
    //     self.vhfs[2].is_powered()
    // }

    // pub fn is_hf1_powered(&self) -> bool {
    //     self.comms[0].is_powered()
    // }

    // pub fn is_hf2_powered(&self) -> bool {
    //     self.comms[1].is_powered()
    // }

    // pub fn is_cids1_powered(&self) -> bool {
    //     self.comms[2].is_powered()
    // }

    // pub fn is_cids2_powered(&self) -> bool {
    //     self.comms[3].is_powered()
    // }

    // pub fn is_flit_int_powered(&self) -> bool {
    //     self.comms[4].is_powered()
    // }

    // pub fn is_vor1_powered(&self) -> bool {
    //     self.vors[0].is_powered()
    // }

    // pub fn is_vor2_powered(&self) -> bool {
    //     self.vors[1].is_powered()
    // }

    // pub fn is_adf1_powered(&self) -> bool {
    //     self.adfs[0].is_powered()
    // }

    // pub fn is_adf2_powered(&self) -> bool {
    //     self.adfs[1].is_powered()
    // }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        need_update_from_acp_or_options: bool,
        side_controlling: &SideControlling,
    ) {
        self.adaptation_board
            .update(context, need_update_from_acp_or_options, side_controlling);
    }
}

impl SimulationElement for AMU {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        // for vhf in self.vhfs.iter_mut() {
        //     vhf.accept(visitor);
        // }
        // for comm in self.comms.iter_mut() {
        //     comm.accept(visitor);
        // }
        // for adf in self.adfs.iter_mut() {
        //     adf.accept(visitor);
        // }
        // for vor in self.vors.iter_mut() {
        //     vor.accept(visitor);
        // }

        // self.ils.accept(visitor);
        // self.gls.accept(visitor);
        // self.markers.accept(visitor);

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

    receive_com1_id: VariableIdentifier,
    receive_com2_id: VariableIdentifier,

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // receive_com3_id: VariableIdentifier, deactivated since vPilot needs com3 to be always on
    // receive_hf1_id: VariableIdentifier,
    // receive_hf2_id: VariableIdentifier,
    // receive_mech_id: VariableIdentifier,
    // receive_att_id: VariableIdentifier,
    // receive_pa_id: VariableIdentifier,
    //
    receive_adf1_id: VariableIdentifier,
    receive_adf2_id: VariableIdentifier,
    receive_vor1_id: VariableIdentifier,
    receive_vor2_id: VariableIdentifier,
    receive_ils_id: VariableIdentifier,
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

    mixed_audio: MixedAudio,
    transmission_table_acp1: u32,
    transmission_table_acp2: u32,
    transmission_table_acp3: u32,

    is_flt_int_powered: bool,
    is_calls_card_powered: bool,

    audio_switching_knob_id: VariableIdentifier,
    audio_switching_knob: AudioSwitchingKnobPosition,

    ls_fcu1_pressed: bool,
    ls_fcu2_pressed: bool,

    pilot_transmit_channel: u32,
    copilot_transmit_channel: u32,

    need_update: bool,
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

            // Needed to update the K events
            receive_com1_id: context.get_identifier("COM1_RECEIVE".to_owned()),
            receive_com2_id: context.get_identifier("COM2_RECEIVE".to_owned()),
            receive_adf1_id: context.get_identifier("ADF1_IDENT".to_owned()),
            receive_adf2_id: context.get_identifier("ADF2_IDENT".to_owned()),
            receive_vor1_id: context.get_identifier("VOR1_IDENT".to_owned()),
            receive_vor2_id: context.get_identifier("VOR2_IDENT".to_owned()),
            receive_ils_id: context.get_identifier("ILS_IDENT".to_owned()),
            receive_markers_id: context.get_identifier("MARKER_IDENT".to_owned()),
            sound_markers_id: context.get_identifier("MARKER SOUND".to_owned()),

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            //receive_gls_id: context.get_identifier("GLS_IDENT".to_owned()),
            //
            volume_com1_id: context.get_identifier("VHF1_VOLUME".to_owned()),
            volume_com2_id: context.get_identifier("VHF2_VOLUME".to_owned()),
            volume_com3_id: context.get_identifier("VHF3_VOLUME".to_owned()),
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
            ls_fcu1_pressed_id: context.get_identifier("BTN_LS_1_FILTER_ACTIVE".to_owned()),
            ls_fcu2_pressed_id: context.get_identifier("BTN_LS_2_FILTER_ACTIVE".to_owned()),

            audio_switching_knob_id: context.get_identifier("AUDIOSWITCHING_KNOB".to_owned()),

            pilot_transmit_id: context.get_identifier("PILOT_TRANSMIT_CHANNEL".to_owned()),
            copilot_transmit_id: context.get_identifier("COPILOT_TRANSMIT_CHANNEL".to_owned()),

            mixed_audio: MixedAudio::new(),
            transmission_table_acp1: 1,
            transmission_table_acp2: 1,
            transmission_table_acp3: 1,

            pilot_transmit_channel: 1,
            copilot_transmit_channel: 1,

            is_flt_int_powered: false,
            is_calls_card_powered: false,

            audio_switching_knob: AudioSwitchingKnobPosition::default(),

            ls_fcu1_pressed: false,
            ls_fcu2_pressed: false,

            need_update: false,
        }
    }

    pub fn decode_arinc_words(
        bus: &mut Vec<Arinc429Word<u32>>,
        mixed_audio: &mut MixedAudio,
        acp_id: u32,
        transmission_table_acp: &mut u32,
        can_send_amu_word: &mut bool,
        acp_to_take_into_account: &u32,
    ) {
        loop {
            match bus.pop() {
                Some(word) => {
                    let label_option: Option<LabelWordAMUACP> =
                        FromPrimitive::from_u32(word.get_bits(8, 1));

                    if label_option.is_some() {
                        let label = label_option.unwrap();

                        if label == LabelWordAMUACP::Label300Request {
                            if acp_id == 2 {
                                println!("Received word 0");
                            }
                            if word.get_bits(3, 29) != 0 {
                                *can_send_amu_word = true;
                            }
                        } else {
                            let sdi = word.get_bits(2, 9) as u8;
                            let transmission_table = word.get_bits(4, 11);
                            let _int = word.get_bits(1, 15) != 0;
                            let _rad = word.get_bits(1, 16) != 0;
                            let volume = word.get_bits(8, 17) as u8;
                            let reception = word.get_bits(1, 25) as u8;
                            let voice = word.get_bits(1, 26) != 0;
                            let _reset = word.get_bits(1, 27) != 0;

                            if acp_id == 2 {
                                println!(
                                    "transmission_table received from ACP{} = {}",
                                    acp_id, *transmission_table_acp
                                );
                            }

                            *transmission_table_acp = transmission_table;

                            if *acp_to_take_into_account == acp_id {
                                // Perform this only if the data currently analyzed is from the chosen acp
                                match label {
                                    LabelWordAMUACP::Label210VolumeControlVHF => {
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
                                    LabelWordAMUACP::Label213VolumeControlVORMKR => {
                                        if sdi == 1 {
                                            mixed_audio.volume_vor1 = volume;
                                            mixed_audio.receive_vor1 = reception != 0 && !voice;
                                        } else if sdi == 2 {
                                            mixed_audio.volume_vor2 = volume;
                                            mixed_audio.receive_vor2 = reception != 0 && !voice;
                                        } else if sdi == 3 {
                                            mixed_audio.receive_markers = reception != 0;
                                        }
                                    }
                                    LabelWordAMUACP::Label212VolumeControlADFPA => {
                                        // PA should be here but not simulated
                                        if sdi == 1 {
                                            mixed_audio.volume_adf1 = volume;
                                            mixed_audio.receive_adf1 = reception != 0 && !voice;
                                        } else if sdi == 2 {
                                            mixed_audio.volume_adf2 = volume;
                                            mixed_audio.receive_adf2 = reception != 0 && !voice;
                                        }
                                    }
                                    LabelWordAMUACP::Label217VolumeControlILS => {
                                        mixed_audio.volume_ils = volume;
                                        mixed_audio.receive_ils = reception != 0 && !voice;
                                    }
                                    _ => {}
                                }
                            }
                        }
                    }
                }
                _ => break,
            }
        }
    }

    pub fn send_amu_word(bus_acp: &mut Vec<Arinc429Word<u32>>, transmission_table: &u32) {
        let mut word_arinc: Arinc429Word<u32> = Arinc429Word::new(0, SignStatus::NormalOperation);

        word_arinc.set_bits(1, LabelWordAMUACP::Label301AMU as u32);
        // println!(
        //     "transmission_table sent via amu word to ACP is {}",
        //     *transmission_table
        // );
        word_arinc.set_bits(11, *transmission_table);

        bus_acp.push(word_arinc);
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        need_update_from_options: bool,
        side_controlling: &SideControlling,
    ) {
        let mut acp_to_take_into_account: u32 = 1;
        let mut can_send_amu_word: bool = false;

        if self.audio_switching_knob != AudioSwitchingKnobPosition::FO
            && side_controlling.to_owned() == SideControlling::FO
        {
            acp_to_take_into_account = 2;
        } else if self.audio_switching_knob == AudioSwitchingKnobPosition::FO
            && side_controlling.to_owned() == SideControlling::FO
            || self.audio_switching_knob == AudioSwitchingKnobPosition::CAPTAIN
                && side_controlling.to_owned() == SideControlling::CAPTAIN
        {
            acp_to_take_into_account = 3;
        }

        self.computer_a
            .update(context, &mut self.bus_arinc_bay, need_update_from_options);
        self.computer_b
            .update(context, &mut self.bus_arinc_3rd, need_update_from_options);

        // 3rd ACP is connected to Board B by default
        // hence if audio switching knob is NOT on FO, data can be wired to default board
        if self.audio_switching_knob != AudioSwitchingKnobPosition::FO {
            self.acp_ovhd
                .update(context, &mut self.bus_acp_3rd, need_update_from_options);

            AdaptationBoard::decode_arinc_words(
                &mut self.bus_acp_3rd,
                &mut self.mixed_audio,
                3,
                &mut self.transmission_table_acp3,
                &mut can_send_amu_word,
                &acp_to_take_into_account,
            );
            if can_send_amu_word {
                AdaptationBoard::send_amu_word(
                    &mut self.bus_acp_3rd,
                    &self.transmission_table_acp3,
                );
            }
        } else {
            self.acp_ovhd
                .update(context, &mut self.bus_acp_avncs, need_update_from_options);

            AdaptationBoard::decode_arinc_words(
                &mut self.bus_acp_avncs,
                &mut self.mixed_audio,
                3,
                &mut self.transmission_table_acp3,
                &mut can_send_amu_word,
                &acp_to_take_into_account,
            );
            if can_send_amu_word {
                AdaptationBoard::send_amu_word(
                    &mut self.bus_acp_avncs,
                    &self.transmission_table_acp3,
                );
            }
        }

        can_send_amu_word = false;

        AdaptationBoard::decode_arinc_words(
            &mut self.bus_arinc_bay,
            &mut self.mixed_audio,
            1,
            &mut self.transmission_table_acp1,
            &mut can_send_amu_word,
            &acp_to_take_into_account,
        );
        if can_send_amu_word {
            AdaptationBoard::send_amu_word(&mut self.bus_arinc_bay, &self.transmission_table_acp1);
            can_send_amu_word = false;
        }

        AdaptationBoard::decode_arinc_words(
            &mut self.bus_arinc_3rd,
            &mut self.mixed_audio,
            2,
            &mut self.transmission_table_acp2,
            &mut can_send_amu_word,
            &acp_to_take_into_account,
        );
        if can_send_amu_word {
            println!(
                "Sending amu word with transmission table = {}",
                self.transmission_table_acp2
            );
            AdaptationBoard::send_amu_word(&mut self.bus_arinc_3rd, &self.transmission_table_acp2);
        }

        // We take into account on VHF1/2/3 as per SDK
        self.pilot_transmit_channel = if acp_to_take_into_account == 1 {
            self.transmission_table_acp1
        } else if acp_to_take_into_account == 3 {
            self.transmission_table_acp3
        } else {
            4
        };
        self.copilot_transmit_channel = if acp_to_take_into_account == 2 {
            self.transmission_table_acp2
        } else if acp_to_take_into_account == 3 {
            self.transmission_table_acp3
        } else {
            4
        };

        // 4 is NONE according to the SDK
        if context.side_controlling() == SideControlling::CAPTAIN {
            self.copilot_transmit_channel = 4;
        } else {
            self.pilot_transmit_channel = 4;
        }
    }
}

impl SimulationElement for AdaptationBoard {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
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

        let audio_switching_knob = match reader.read(&self.audio_switching_knob_id) {
            0 => AudioSwitchingKnobPosition::CAPTAIN,
            2 => AudioSwitchingKnobPosition::FO,
            _ => AudioSwitchingKnobPosition::NORM,
        };

        self.need_update = self.audio_switching_knob != audio_switching_knob
            || self.ls_fcu1_pressed != ls_fcu1_pressed
            || self.ls_fcu2_pressed != ls_fcu2_pressed;

        self.audio_switching_knob = audio_switching_knob;
        self.ls_fcu1_pressed = ls_fcu1_pressed;
        self.ls_fcu2_pressed = ls_fcu2_pressed;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pilot_transmit_id, self.pilot_transmit_channel);
        writer.write(&self.copilot_transmit_id, self.copilot_transmit_channel);

        writer.write(&self.receive_com1_id, self.mixed_audio.receive_com1);
        writer.write(&self.receive_com2_id, self.mixed_audio.receive_com2);
        writer.write(&self.receive_adf1_id, self.mixed_audio.receive_adf1);
        writer.write(&self.receive_adf2_id, self.mixed_audio.receive_adf2);
        writer.write(&self.receive_vor1_id, self.mixed_audio.receive_vor1);
        writer.write(&self.receive_vor2_id, self.mixed_audio.receive_vor2);
        writer.write(&self.receive_ils_id, self.mixed_audio.receive_ils);

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
            _second_card: TypeCard::SELCAL(SELCAL::new()),
            is_power_supply_powered: false,
        }
    }

    pub fn new_fo_and_ovhd(context: &mut InitContext) -> Self {
        Self {
            audio_card: AudioCard::new(context, 2),
            // Not used for now
            _second_card: TypeCard::BITE(BITE::new()),
            is_power_supply_powered: false,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        bus: &mut Vec<Arinc429Word<u32>>,
        need_update_from_acp_or_options: bool,
    ) {
        if self.is_power_supply_powered {
            self.audio_card
                .update(context, bus, need_update_from_acp_or_options);
        }
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
}

impl AudioCard {
    pub fn new(context: &mut InitContext, id_acp: u32) -> Self {
        Self {
            bus_acp: Vec::new(),
            acp: AudioControlPanel::new(context, id_acp, ElectricalBusType::DirectCurrentEssential),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        bus_from_adaptation_card: &mut Vec<Arinc429Word<u32>>,
        need_update_from_acp_or_options: bool,
    ) {
        self.bus_acp.append(bus_from_adaptation_card);
        bus_from_adaptation_card.clear();

        self.acp
            .update(context, &mut self.bus_acp, need_update_from_acp_or_options);

        bus_from_adaptation_card.append(&mut self.bus_acp);
    }
}

impl SimulationElement for AudioCard {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.acp.accept(visitor);

        visitor.visit(self);
    }
}

pub struct SELCAL {}
impl SELCAL {
    pub fn new() -> Self {
        Self {}
    }
}
pub struct BITE {}
impl BITE {
    pub fn new() -> Self {
        Self {}
    }
}
