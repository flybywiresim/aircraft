use super::amu::{IdentificationWordAMUACP, LabelWordAMUACP, AAA};
use crate::{
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        ElectricalBusType, ElectricalBuses,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};
use num_traits::FromPrimitive;
use std::time::Duration;

// Foundable in XML behaviors for MECH
//pub const TRANSMIT_ID_INT: u8 = 6;

pub struct AudioControlPanel {
    id_acp: u32,

    transmit_channel_id: VariableIdentifier,
    transmit_pushed_id: VariableIdentifier,
    voice_button_id: VariableIdentifier,
    reset_button_id: VariableIdentifier,
    int_rad_switch_id: VariableIdentifier,

    voice_button: bool,
    reset_button: bool,

    transmit_channel: u32,
    transmit_pushed: u32,
    int_rad_switch: u8,

    vhfs: [CommunicationsTransceiver; 3],
    comms: [CommunicationsTransceiver; 5], // Transceivers not simulated due to SDK capabilities. Just to make the knobs rotatable/pushable
    adfs: [NavTransceiver; 2],
    vors: [NavTransceiver; 2],
    ils: NavTransceiver,
    gls: NavTransceiver,
    markers: NavTransceiver,

    // vhfs: [VHF; 3],
    // comms: [COMM; 5], // Transceivers not simulated due to SDK capabilities. Just to make the knobs rotatable/pushable
    // adfs: [ADF; 2],
    // vors: [VOR; 2],
    // ils: ILS,
    // gls: GLS,
    // markers: MARKERS,
    power_supply: ElectricalBusType,
    is_power_supply_powered: bool,

    list_arinc_words: Vec<AAA>,
    last_complete_cycle_sent: Duration,
    duration: Duration,
}
impl AudioControlPanel {
    const DEFAULT_INT_RAD_SWITCH: u8 = 100;
    const TRANSMIT_ID_INT: u8 = 200;

    pub fn new(context: &mut InitContext, id_acp: u32, power_supply: ElectricalBusType) -> Self {
        Self {
            id_acp,

            transmit_channel_id: context.get_identifier(format!("ACP{}_TRANSMIT_CHANNEL", id_acp)),
            transmit_pushed_id: context.get_identifier(format!("ACP{}_TRANSMIT_PUSHED", id_acp)),
            voice_button_id: context.get_identifier(format!("ACP{}_VOICE_BUTTON_DOWN", id_acp)),
            reset_button_id: context.get_identifier(format!("ACP{}_RESET_BUTTON_DOWN", id_acp)),
            int_rad_switch_id: context.get_identifier(format!("ACP{}_SWITCH_INT", id_acp)),

            voice_button: false,
            reset_button: false,

            transmit_channel: 0,
            transmit_pushed: 0,
            int_rad_switch: Self::DEFAULT_INT_RAD_SWITCH,

            vhfs: [
                CommunicationsTransceiver::new(context, id_acp, "VHF1"),
                CommunicationsTransceiver::new(context, id_acp, "VHF2"),
                CommunicationsTransceiver::new(context, id_acp, "VHF3"),
            ],
            comms: [
                CommunicationsTransceiver::new(context, id_acp, "HF1"),
                CommunicationsTransceiver::new(context, id_acp, "HF2"),
                CommunicationsTransceiver::new(context, id_acp, "MECH"),
                CommunicationsTransceiver::new(context, id_acp, "ATT"),
                CommunicationsTransceiver::new(context, id_acp, "PA"),
            ],
            adfs: [
                NavTransceiver::new(context, id_acp, "ADF1"),
                NavTransceiver::new(context, id_acp, "ADF2"),
            ],
            vors: [
                NavTransceiver::new(context, id_acp, "VOR1"),
                NavTransceiver::new(context, id_acp, "VOR2"),
            ],
            ils: NavTransceiver::new(context, id_acp, "ILS"),
            gls: NavTransceiver::new(context, id_acp, "MLS"),
            markers: NavTransceiver::new(context, id_acp, "MKR"),

            // vhfs: [
            //     VHF::new_vhf1(context, id_acp),
            //     VHF::new_vhf2(context, id_acp),
            //     VHF::new_vhf3(context, id_acp),
            // ],
            // comms: [
            //     COMM::new_hf1(context, id_acp),
            //     COMM::new_hf2(context, id_acp),
            //     COMM::new_mech(context, id_acp),
            //     COMM::new_cab(context, id_acp),
            //     COMM::new_pa(context, id_acp),
            // ],
            // adfs: [
            //     ADF::new_adf1(context, id_acp),
            //     ADF::new_adf2(context, id_acp),
            // ],
            // vors: [
            //     VOR::new_vor1(context, id_acp),
            //     VOR::new_vor2(context, id_acp),
            // ],
            // ils: ILS::new_ils(context, id_acp),
            // gls: GLS::new_gls(context, id_acp),
            // markers: MARKERS::new_markers(context, id_acp),
            power_supply,
            is_power_supply_powered: false,

            list_arinc_words: Vec::from([
                AAA::new(
                    IdentificationWordAMUACP::WORD0,
                    0,
                    LabelWordAMUACP::Label300Request,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORDAMU,
                    0,
                    LabelWordAMUACP::Label301AMU,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD01,
                    1,
                    LabelWordAMUACP::Label210VolumeControlVHF,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD02,
                    2,
                    LabelWordAMUACP::Label210VolumeControlVHF,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD03,
                    3,
                    LabelWordAMUACP::Label210VolumeControlVHF,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD04,
                    1,
                    LabelWordAMUACP::Label211VolumeControlHF,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD05,
                    2,
                    LabelWordAMUACP::Label211VolumeControlHF,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD06,
                    1,
                    LabelWordAMUACP::Label215VolumeControlINTCAB,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD07,
                    2,
                    LabelWordAMUACP::Label215VolumeControlINTCAB,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD08,
                    3,
                    LabelWordAMUACP::Label212VolumeControlADFPA,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD09,
                    1,
                    LabelWordAMUACP::Label213VolumeControlVORMKR,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD10,
                    2,
                    LabelWordAMUACP::Label213VolumeControlVORMKR,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD11,
                    3,
                    LabelWordAMUACP::Label213VolumeControlVORMKR,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD12,
                    0,
                    LabelWordAMUACP::Label217VolumeControlILS,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD15,
                    1,
                    LabelWordAMUACP::Label212VolumeControlADFPA,
                ),
                AAA::new(
                    IdentificationWordAMUACP::WORD16,
                    2,
                    LabelWordAMUACP::Label212VolumeControlADFPA,
                ),
            ]),
            last_complete_cycle_sent: Duration::from_millis(0),
            duration: Duration::from_millis(0),
        }
    }

    fn send_word_0(&self, bus_acp: &mut Vec<Arinc429Word<u32>>) {
        let mut word_arinc: Arinc429Word<u32> = Arinc429Word::new(0, SignStatus::NormalOperation);

        word_arinc.set_bits(1, LabelWordAMUACP::Label300Request as u32);
        word_arinc.set_bits(29, self.id_acp);

        bus_acp.push(word_arinc);
    }

    fn send_volume_control(&self, bus_acp: &mut Vec<Arinc429Word<u32>>, index: usize) {
        let mut word_arinc: Arinc429Word<u32> = Arinc429Word::new(0, SignStatus::NormalOperation);
        word_arinc.set_bits(1, self.list_arinc_words[index].get_label() as u32);
        word_arinc.set_bits(9, self.list_arinc_words[index].get_sdi());

        word_arinc.set_bits(11, self.transmit_pushed);
        word_arinc.set_bit(15, self.int_rad_switch <= Self::DEFAULT_INT_RAD_SWITCH);
        word_arinc.set_bit(16, self.int_rad_switch == Self::TRANSMIT_ID_INT);

        match self.list_arinc_words[index].get_identification() {
            IdentificationWordAMUACP::WORD01 => {
                word_arinc.set_bits(17, self.vhfs[0].volume);
                word_arinc.set_bit(25, self.vhfs[0].knob);
            }
            IdentificationWordAMUACP::WORD02 => {
                word_arinc.set_bits(17, self.vhfs[1].volume);
                word_arinc.set_bit(25, self.vhfs[1].knob);
            }
            IdentificationWordAMUACP::WORD03 => {
                word_arinc.set_bits(17, self.vhfs[2].volume);
                word_arinc.set_bit(25, self.vhfs[2].knob);
            }
            IdentificationWordAMUACP::WORD04 => {
                word_arinc.set_bits(17, self.comms[0].volume);
                word_arinc.set_bit(25, self.comms[0].knob);
            }
            IdentificationWordAMUACP::WORD05 => {
                word_arinc.set_bits(17, self.comms[1].volume);
                word_arinc.set_bit(25, self.comms[1].knob);
            }
            IdentificationWordAMUACP::WORD06 => {
                word_arinc.set_bits(17, self.comms[2].volume);
                word_arinc.set_bit(25, self.comms[2].knob);
            }
            IdentificationWordAMUACP::WORD07 => {
                word_arinc.set_bits(17, self.comms[3].volume);
                word_arinc.set_bit(25, self.comms[3].knob);
            }
            IdentificationWordAMUACP::WORD08 => {
                word_arinc.set_bits(17, self.comms[4].volume);
                word_arinc.set_bit(25, self.comms[4].knob);
            }
            IdentificationWordAMUACP::WORD09 => {
                word_arinc.set_bits(17, self.vors[0].volume);
                word_arinc.set_bit(25, self.vors[0].knob);
            }
            IdentificationWordAMUACP::WORD10 => {
                word_arinc.set_bits(17, self.vors[1].volume);
                word_arinc.set_bit(25, self.vors[1].knob);
            }
            IdentificationWordAMUACP::WORD11 => {
                word_arinc.set_bits(17, self.markers.volume);
                word_arinc.set_bit(25, self.markers.knob);
            }
            IdentificationWordAMUACP::WORD12 => {
                word_arinc.set_bits(17, self.ils.volume);
                word_arinc.set_bit(25, self.ils.knob);
            }
            IdentificationWordAMUACP::WORD15 => {
                word_arinc.set_bits(17, self.adfs[0].volume);
                word_arinc.set_bit(25, self.adfs[0].knob);
            }
            IdentificationWordAMUACP::WORD16 => {
                word_arinc.set_bits(17, self.adfs[1].volume);
                word_arinc.set_bit(25, self.adfs[1].knob);
            }
            i => {
                println!("Cant find {}", i as u32);
                panic!();
            }
        }

        word_arinc.set_bit(26, self.voice_button);
        word_arinc.set_bit(27, self.reset_button);

        bus_acp.push(word_arinc);
    }

    pub fn decode_amu_word(
        bus: &mut Vec<Arinc429Word<u32>>,
        transmission_table: &mut u32,
        call_mech: &mut bool,
        call_att: &mut bool,
        calls: &mut u32,
    ) -> bool {
        let mut ret: bool = false;
        let label_option: Option<LabelWordAMUACP> = FromPrimitive::from_u32(bus[0].get_bits(8, 1));

        if let Some(label) = label_option {
            //println!("label_option   ({})", label as u32);
            if label == LabelWordAMUACP::Label301AMU {
                let word = bus.remove(0);
                *transmission_table = word.get_bits(4, 11);
                *call_mech = word.get_bit(15);
                *call_att = word.get_bit(16);
                *calls = word.get_bits(5, 25);

                println!(
                    "transmission_table received from AMU = {}",
                    *transmission_table
                );

                ret = true;
            }
        }

        ret
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        bus_acp: &mut Vec<Arinc429Word<u32>>,
        need_update_from_options: bool,
    ) {
        if self.is_power_supply_powered {
            self.last_complete_cycle_sent += context.delta();
            self.duration += context.delta();

            // Restart full cycle every 160ms as stated in AMM
            if self.last_complete_cycle_sent.as_millis() > 170 || need_update_from_options {
                if self.id_acp == 2 {
                    println!("Starting full cycle after {} ms", self.duration.as_millis());
                }

                self.send_word_0(bus_acp);
                self.last_complete_cycle_sent = Duration::from_millis(0);
            } else if bus_acp.len() != 0 {
                let mut call_mech: bool = false;
                let mut call_att: bool = false;

                let mut calls: u32 = 0;

                if AudioControlPanel::decode_amu_word(
                    bus_acp,
                    &mut self.transmit_channel,
                    &mut call_mech,
                    &mut call_att,
                    &mut calls,
                ) {
                    // Volume control word should be sent every 10ms
                    // but due to sim capabilities, refresh rate turns out to be not high enough
                    // which leads to actions on the ACP ending up very slow.
                    // Therefore I took the decision to send all the words at the same time to avoid that.
                    for index in 2..(self.list_arinc_words.len() - 1) {
                        self.send_volume_control(bus_acp, index);
                    }
                    if self.id_acp == 2 {
                        println!("Received amu word after {} ms ", self.duration.as_millis());
                    }

                    self.duration = Duration::from_millis(0);
                    // self.index_list_arinc_words = 2;
                }
            }

            let transmission_pb_pushed: bool = self.transmit_channel != self.transmit_pushed;

            if self.vhfs[0].has_changed() || transmission_pb_pushed && self.transmit_pushed == 1 {
                println!("Updating VHF1 ACP {}", self.id_acp);
                self.send_volume_control(bus_acp, 2);
                self.duration = Duration::from_millis(0);
            }
            if self.vhfs[1].has_changed() || transmission_pb_pushed && self.transmit_pushed == 2 {
                self.send_volume_control(bus_acp, 3);
            }
            if self.vhfs[2].has_changed() || transmission_pb_pushed && self.transmit_pushed == 3 {
                self.send_volume_control(bus_acp, 4);
            }

            if self.comms[0].has_changed() || transmission_pb_pushed && self.transmit_pushed == 4 {
                self.send_volume_control(bus_acp, 5);
            }
            if self.comms[1].has_changed() || transmission_pb_pushed && self.transmit_pushed == 5 {
                self.send_volume_control(bus_acp, 6);
            }
            if self.comms[2].has_changed() || transmission_pb_pushed && self.transmit_pushed == 6 {
                self.send_volume_control(bus_acp, 7);
            }
            if self.comms[3].has_changed() || transmission_pb_pushed && self.transmit_pushed == 7 {
                self.send_volume_control(bus_acp, 8);
            }
            if self.comms[4].has_changed() || transmission_pb_pushed && self.transmit_pushed == 8 {
                self.send_volume_control(bus_acp, 9);
            }

            if self.vors[0].has_changed() {
                self.send_volume_control(bus_acp, 10);
            }
            if self.vors[1].has_changed() {
                self.send_volume_control(bus_acp, 11);
            }

            if self.markers.has_changed() {
                self.send_volume_control(bus_acp, 12);
            }

            if self.ils.has_changed() {
                self.send_volume_control(bus_acp, 13);
            }

            if self.adfs[0].has_changed() {
                self.send_volume_control(bus_acp, 14);
            }
            if self.adfs[1].has_changed() {
                self.send_volume_control(bus_acp, 15);
            }
        }
    }
}

impl SimulationElement for AudioControlPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for vhf in self.vhfs.iter_mut() {
            vhf.accept(visitor);
        }
        for comm in self.comms.iter_mut() {
            comm.accept(visitor);
        }
        for adf in self.adfs.iter_mut() {
            adf.accept(visitor);
        }
        for vor in self.vors.iter_mut() {
            vor.accept(visitor);
        }

        self.ils.accept(visitor);
        self.gls.accept(visitor);
        self.markers.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        if self.is_power_supply_powered {
            self.int_rad_switch = reader.read(&self.int_rad_switch_id);
            self.voice_button = reader.read(&self.voice_button_id);
            self.reset_button = reader.read(&self.reset_button_id);

            self.transmit_pushed = reader.read(&self.transmit_pushed_id);
        }
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.is_power_supply_powered {
            writer.write(&self.transmit_channel_id, self.transmit_channel);
        }

        writer.write(&self.reset_button_id, 0);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.power_supply);
    }
}

#[derive(Default)]
struct CommunicationsTransceiver {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    changed: bool,
    knob: bool,
    volume: u32,
}
impl CommunicationsTransceiver {
    pub fn new(context: &mut InitContext, id_acp: u32, name: &str) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_{}_VOLUME", id_acp, name)),
            knob_id: context.get_identifier(format!("ACP{}_{}_KNOB_VOLUME_DOWN", id_acp, name)),
            ..Default::default()
        }
    }

    pub fn has_changed(&self) -> bool {
        self.changed
    }
}
impl SimulationElement for CommunicationsTransceiver {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let volume: u32 = reader.read(&self.volume_id);
        let knob: bool = reader.read(&self.knob_id);

        if volume != self.volume {
            println!("New value! {} {}", self.volume, volume);
        }
        self.changed = volume != self.volume || knob != self.knob;

        if volume != self.volume {
            println!(
                "New value! {} {} changed = {}",
                self.volume, volume, self.changed
            );
        }

        self.volume = volume;
        self.knob = knob;
    }
}

#[derive(Default)]
struct NavTransceiver {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    changed: bool,
    knob: bool,
    volume: u32,
}
impl NavTransceiver {
    pub fn new(context: &mut InitContext, id_acp: u32, name: &str) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_{}_VOLUME", id_acp, name)),
            knob_id: context.get_identifier(format!("ACP{}_{}_KNOB_VOLUME_DOWN", id_acp, name)),
            ..Default::default()
        }
    }

    pub fn has_changed(&self) -> bool {
        self.changed
    }
}
impl SimulationElement for NavTransceiver {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let volume: u32 = reader.read(&self.volume_id);
        let knob: bool = reader.read(&self.knob_id);

        self.changed = volume != self.volume || knob != self.knob;

        self.volume = volume;
        self.knob = knob;
    }
}

// #[derive(Default)]
// pub struct VHF {
//     volume_id: VariableIdentifier,
//     knob_id: VariableIdentifier,
//     knob: bool,
//     volume: u8,
// }
// impl VHF {
//     pub fn new_vhf1(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_VHF1_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_VHF1_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_vhf2(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_VHF2_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_VHF2_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_vhf3(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_VHF3_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_VHF3_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     // fn get_volume(&self) -> u8 {
//     //     self.volume
//     // }
//     // fn get_receive(&self) -> bool {
//     //     self.knob
//     // }
// }

// impl SimulationElement for VHF {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn read(&mut self, reader: &mut SimulatorReader) {
//         self.volume = reader.read(&self.volume_id);
//         self.knob = reader.read(&self.knob_id);
//     }

//     fn write(&self, writer: &mut SimulatorWriter) {
//         writer.write(&self.volume_id, self.volume);
//         writer.write(&self.knob_id, self.knob);
//     }
// }

// #[derive(Default)]
// pub struct COMM {
//     volume_id: VariableIdentifier,
//     knob_id: VariableIdentifier,
//     volume: u8,
//     knob: bool,
// }
// impl COMM {
//     pub fn new_hf1(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_HF1_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_HF1_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_hf2(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_HF2_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_HF2_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_mech(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_MECH_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_MECH_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_cab(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_ATT_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_ATT_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_pa(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_PA_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_PA_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     // fn get_volume(&self) -> u8 {
//     //     self.volume
//     // }
//     // fn get_receive(&self) -> bool {
//     //     self.knob
//     // }
// }

// impl SimulationElement for COMM {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn read(&mut self, reader: &mut SimulatorReader) {
//         self.volume = reader.read(&self.volume_id);
//         self.knob = reader.read(&self.knob_id);
//     }

//     fn write(&self, writer: &mut SimulatorWriter) {
//         writer.write(&self.volume_id, self.volume);
//         writer.write(&self.knob_id, self.knob);
//     }
// }

// #[derive(Default)]
// pub struct ADF {
//     volume_id: VariableIdentifier,
//     knob_id: VariableIdentifier,
//     volume: u8,
//     knob: bool,
// }
// impl ADF {
//     pub fn new_adf1(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_ADF1_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_ADF1_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_adf2(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_ADF2_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_ADF2_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     // fn get_volume(&self) -> u8 {
//     //     self.volume
//     // }
//     // fn get_receive(&self) -> bool {
//     //     self.knob
//     // }
// }

// impl SimulationElement for ADF {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn read(&mut self, reader: &mut SimulatorReader) {
//         self.volume = reader.read(&self.volume_id);
//         self.knob = reader.read(&self.knob_id);
//     }

//     fn write(&self, writer: &mut SimulatorWriter) {
//         writer.write(&self.volume_id, self.volume);
//         writer.write(&self.knob_id, self.knob);
//     }
// }

// #[derive(Default)]
// pub struct VOR {
//     volume_id: VariableIdentifier,
//     knob_id: VariableIdentifier,
//     volume: u8,
//     knob: bool,
// }
// impl VOR {
//     pub fn new_vor1(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_VOR1_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_VOR1_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     pub fn new_vor2(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_VOR2_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_VOR2_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     // fn get_volume(&self) -> u8 {
//     //     self.volume
//     // }
//     // fn get_receive(&self) -> bool {
//     //     self.knob
//     // }
// }

// impl SimulationElement for VOR {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn read(&mut self, reader: &mut SimulatorReader) {
//         self.volume = reader.read(&self.volume_id);
//         self.knob = reader.read(&self.knob_id);
//     }

//     fn write(&self, writer: &mut SimulatorWriter) {
//         writer.write(&self.volume_id, self.volume);
//         writer.write(&self.knob_id, self.knob);
//     }
// }

// #[derive(Default)]
// pub struct ILS {
//     volume_id: VariableIdentifier,
//     knob_id: VariableIdentifier,
//     volume: u8,
//     knob: bool,
// }
// impl ILS {
//     pub fn new_ils(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_ILS_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_ILS_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     // fn get_volume(&self) -> u8 {
//     //     self.volume
//     // }
//     // fn get_receive(&self) -> bool {
//     //     self.knob
//     // }
// }

// impl SimulationElement for ILS {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn read(&mut self, reader: &mut SimulatorReader) {
//         self.volume = reader.read(&self.volume_id);
//         self.knob = reader.read(&self.knob_id);
//     }

//     fn write(&self, writer: &mut SimulatorWriter) {
//         writer.write(&self.volume_id, self.volume);
//         writer.write(&self.knob_id, self.knob);
//     }
// }

// #[derive(Default)]
// pub struct GLS {
//     volume_id: VariableIdentifier,
//     knob_id: VariableIdentifier,
//     volume: u8,
//     knob: bool,
// }
// impl GLS {
//     pub fn new_gls(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             // To change to GLS version once flight deck reworked
//             volume_id: context.get_identifier(format!("ACP{}_MLS_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_MLS_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     // fn get_volume(&self) -> u8 {
//     //     self.volume
//     // }
//     // fn get_receive(&self) -> bool {
//     //     self.knob
//     // }
// }

// impl SimulationElement for GLS {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn read(&mut self, reader: &mut SimulatorReader) {
//         self.volume = reader.read(&self.volume_id);
//         self.knob = reader.read(&self.knob_id);
//     }

//     fn write(&self, writer: &mut SimulatorWriter) {
//         writer.write(&self.volume_id, self.volume);
//         writer.write(&self.knob_id, self.knob);
//     }
// }

// #[derive(Default)]
// pub struct MARKERS {
//     volume_id: VariableIdentifier,
//     knob_id: VariableIdentifier,
//     volume: u8,
//     knob: bool,
// }
// impl MARKERS {
//     pub fn new_markers(context: &mut InitContext, id_acp: u32) -> Self {
//         Self {
//             volume_id: context.get_identifier(format!("ACP{}_MKR_VOLUME", id_acp)),
//             knob_id: context.get_identifier(format!("ACP{}_MKR_KNOB_VOLUME_DOWN", id_acp)),
//             ..Default::default()
//         }
//     }

//     // fn get_volume(&self) -> u8 {
//     //     self.volume
//     // }
//     // fn get_receive(&self) -> bool {
//     //     self.knob
//     // }
// }

// impl SimulationElement for MARKERS {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn read(&mut self, reader: &mut SimulatorReader) {
//         self.volume = reader.read(&self.volume_id);
//         self.knob = reader.read(&self.knob_id);
//     }

//     fn write(&self, writer: &mut SimulatorWriter) {
//         writer.write(&self.volume_id, self.volume);
//         writer.write(&self.knob_id, self.knob);
//     }
// }

// #[cfg(test)]
// mod audio_tests {
//     use super::*;
//     use crate::simulation::{
//         Aircraft,
//         test::{
//             ReadByName, SimulationTestBed, TestBed, WriteByName,
//         },
//     };

//     pub struct TestAircraft {
//         receivers: [Receiver; 1],
//     }
//     impl TestAircraft {
//         fn new(context: &mut InitContext) -> Self {
//             Self {
//                 receivers: [
//                     Receiver::new(context, "NAV", 1),
//                 ],
//             }
//         }
//     }

//     impl SimulationElement for TestAircraft {
//         fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
//             accept_iterable!(self.receivers, visitor);

//             visitor.visit(self);
//         }
//     }

//     impl Aircraft for TestAircraft {
//     }

//     struct AudioControlPanelTestBed {
//         test_bed: SimulationTestBed<TestAircraft>,
//     }
//     impl AudioControlPanelTestBed {
//         fn new() -> Self {
//             let test_bed = AudioControlPanelTestBed {
//                 test_bed: SimulationTestBed::new(TestAircraft::new),
//             };
//             test_bed
//         }
//     }

//     impl TestBed for AudioControlPanelTestBed {
//         type Aircraft = TestAircraft;

//         fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
//             &self.test_bed
//         }

//         fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
//             &mut self.test_bed
//         }
//     }

//     fn test_bed() -> AudioControlPanelTestBed {
//         AudioControlPanelTestBed::new()
//     }

//     #[test]
//     fn aaaa() {
//         let mut receiver = test_bed();
//         receiver.run();
//     }
// }
