use super::audio_management_unit::{
    IdentificationWordAMUACP, LabelWordAMUACP, WordAMUACPInfo, TIMEOUT,
};
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

#[derive(PartialEq, Copy, Clone, Eq)]
pub enum TransmitID {
    None = 0,
    Vhf1,
    VHf2,
    Vhf3,
    Hf1,
    Hf2,
    Mech,
    Cab,
    Pa,
}
impl From<u32> for TransmitID {
    fn from(value: u32) -> Self {
        match value {
            0 => TransmitID::None,
            1 => TransmitID::Vhf1,
            2 => TransmitID::VHf2,
            3 => TransmitID::Vhf3,
            4 => TransmitID::Hf1,
            5 => TransmitID::Hf2,
            6 => TransmitID::Mech,
            7 => TransmitID::Cab,
            8 => TransmitID::Pa,
            i => panic!("Unknown Transmit ID {i}"),
        }
    }
}

pub struct AudioControlPanel {
    id_acp: u32,

    transmit_channel_id: VariableIdentifier,
    transmit_pushed_id: VariableIdentifier,
    voice_button_id: VariableIdentifier,
    reset_button_id: VariableIdentifier,

    voice_button: bool,
    reset_button: bool,

    transmit_channel: TransmitID,
    transmit_pushed: TransmitID,

    vhfs: [TransceiverACPFacade; 3],
    comms: [TransceiverACPFacade; 5], // TransceiverACPFacades not simulated due to SDK capabilities. Just to make the knobs rotatable/pushable
    adfs: [TransceiverACPFacade; 2],
    vors: [TransceiverACPFacade; 2],
    ils: TransceiverACPFacade,
    gls: TransceiverACPFacade,
    markers: TransceiverACPFacade,

    power_supply: ElectricalBusType,
    is_power_supply_powered: bool,

    list_arinc_words: Vec<WordAMUACPInfo>,
    last_complete_cycle_sent: Duration,
}
impl AudioControlPanel {
    pub fn new(context: &mut InitContext, id_acp: u32, power_supply: ElectricalBusType) -> Self {
        Self {
            id_acp,

            transmit_channel_id: context.get_identifier(format!("ACP{}_TRANSMIT_CHANNEL", id_acp)),
            transmit_pushed_id: context.get_identifier(format!("ACP{}_TRANSMIT_PUSHED", id_acp)),
            voice_button_id: context.get_identifier(format!("ACP{}_VOICE_BUTTON_DOWN", id_acp)),
            reset_button_id: context.get_identifier(format!("ACP{}_RESET_BUTTON_DOWN", id_acp)),

            voice_button: false,
            reset_button: false,

            transmit_channel: TransmitID::Vhf1,
            transmit_pushed: TransmitID::Vhf1,

            vhfs: [
                TransceiverACPFacade::new(context, id_acp, "VHF1"),
                TransceiverACPFacade::new(context, id_acp, "VHF2"),
                TransceiverACPFacade::new(context, id_acp, "VHF3"),
            ],
            comms: [
                TransceiverACPFacade::new(context, id_acp, "HF1"),
                TransceiverACPFacade::new(context, id_acp, "HF2"),
                TransceiverACPFacade::new(context, id_acp, "MECH"),
                TransceiverACPFacade::new(context, id_acp, "ATT"),
                TransceiverACPFacade::new(context, id_acp, "PA"),
            ],
            adfs: [
                TransceiverACPFacade::new(context, id_acp, "ADF1"),
                TransceiverACPFacade::new(context, id_acp, "ADF2"),
            ],
            vors: [
                TransceiverACPFacade::new(context, id_acp, "VOR1"),
                TransceiverACPFacade::new(context, id_acp, "VOR2"),
            ],
            ils: TransceiverACPFacade::new(context, id_acp, "ILS"),
            gls: TransceiverACPFacade::new(context, id_acp, "MLS"),
            markers: TransceiverACPFacade::new(context, id_acp, "MKR"),

            power_supply,
            is_power_supply_powered: false,

            list_arinc_words: Vec::from([
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word0,
                    0,
                    LabelWordAMUACP::Label300Request,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Wordamu,
                    0,
                    LabelWordAMUACP::Label301AMU,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word01,
                    1,
                    LabelWordAMUACP::Label210VolumeControlVHF,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word02,
                    2,
                    LabelWordAMUACP::Label210VolumeControlVHF,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word03,
                    3,
                    LabelWordAMUACP::Label210VolumeControlVHF,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word04,
                    1,
                    LabelWordAMUACP::Label211VolumeControlHF,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word05,
                    2,
                    LabelWordAMUACP::Label211VolumeControlHF,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word06,
                    1,
                    LabelWordAMUACP::Label215VolumeControlINTCAB,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word07,
                    2,
                    LabelWordAMUACP::Label215VolumeControlINTCAB,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word08,
                    3,
                    LabelWordAMUACP::Label212VolumeControlADFPA,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word09,
                    1,
                    LabelWordAMUACP::Label213VolumeControlVORMKR,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word10,
                    2,
                    LabelWordAMUACP::Label213VolumeControlVORMKR,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word11,
                    3,
                    LabelWordAMUACP::Label213VolumeControlVORMKR,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word12,
                    0,
                    LabelWordAMUACP::Label217VolumeControlILS,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word15,
                    1,
                    LabelWordAMUACP::Label212VolumeControlADFPA,
                ),
                WordAMUACPInfo::new(
                    IdentificationWordAMUACP::Word16,
                    2,
                    LabelWordAMUACP::Label212VolumeControlADFPA,
                ),
            ]),
            last_complete_cycle_sent: Duration::from_millis(0),
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

        word_arinc.set_bits(11, self.transmit_pushed as u32);

        // Not used so far
        // word_arinc.set_bit(15, self.int_rad_switch <= Self::DEFAULT_INT_RAD_SWITCH);
        // word_arinc.set_bit(16, self.int_rad_switch == Self::TRANSMIT_ID_INT);

        let (volume, knob) = match self.list_arinc_words[index].get_identification() {
            IdentificationWordAMUACP::Word01 => (self.vhfs[0].volume, self.vhfs[0].knob),
            IdentificationWordAMUACP::Word02 => (self.vhfs[1].volume, self.vhfs[1].knob),
            IdentificationWordAMUACP::Word03 => (self.vhfs[2].volume, self.vhfs[2].knob),
            IdentificationWordAMUACP::Word04 => (self.comms[0].volume, self.comms[0].knob),
            IdentificationWordAMUACP::Word05 => (self.comms[1].volume, self.comms[1].knob),
            IdentificationWordAMUACP::Word06 => (self.comms[2].volume, self.comms[2].knob),
            IdentificationWordAMUACP::Word07 => (self.comms[3].volume, self.comms[3].knob),
            IdentificationWordAMUACP::Word08 => (self.comms[4].volume, self.comms[4].knob),
            IdentificationWordAMUACP::Word09 => (self.vors[0].volume, self.vors[0].knob),
            IdentificationWordAMUACP::Word10 => (self.vors[1].volume, self.vors[1].knob),
            IdentificationWordAMUACP::Word11 => (self.markers.volume, self.markers.knob),
            IdentificationWordAMUACP::Word12 => (self.ils.volume, self.ils.knob),
            IdentificationWordAMUACP::Word15 => (self.adfs[0].volume, self.adfs[0].knob),
            IdentificationWordAMUACP::Word16 => (self.adfs[1].volume, self.adfs[1].knob),
            i => panic!("Cant find word acp with id {}", i as u32),
        };

        word_arinc.set_bits(17, volume);
        word_arinc.set_bit(25, knob);
        word_arinc.set_bit(26, self.voice_button);
        word_arinc.set_bit(27, self.reset_button);

        bus_acp.push(word_arinc);
    }

    fn decode_amu_word(bus: &mut Vec<Arinc429Word<u32>>) -> Option<(TransmitID, bool, bool, u32)> {
        let label_option: Option<LabelWordAMUACP> = FromPrimitive::from_u32(bus[0].get_bits(8, 1));

        label_option.and_then(|label| {
            if label == LabelWordAMUACP::Label301AMU {
                let word = bus.remove(0);
                Some((
                    TransmitID::from(word.get_bits(4, 11)),
                    word.get_bit(15),
                    word.get_bit(16),
                    word.get_bits(5, 25),
                ))
            } else {
                None
            }
        })
    }

    pub fn update(&mut self, context: &UpdateContext, bus_acp: &mut Vec<Arinc429Word<u32>>) {
        self.last_complete_cycle_sent += context.delta();

        if self.is_power_supply_powered {
            if !bus_acp.is_empty() {
                // These will be used later on
                // Especially "calls" when SELCAL will be
                // translated into Rust
                if let Some((transmit_channel, _call_mech, _call_att, _calls)) =
                    AudioControlPanel::decode_amu_word(bus_acp)
                {
                    self.transmit_channel = transmit_channel;
                    // Volume control word should be sent every 10ms
                    // but due to sim capabilities, refresh rate turns out to be not high enough
                    // which leads to actions on the ACP ending up very slow.
                    // Therefore I took the decision to send all the words at the same time to avoid that.
                    for index in 2..(self.list_arinc_words.len()) {
                        self.send_volume_control(bus_acp, index);
                    }
                }
            }

            if self.last_complete_cycle_sent.as_millis() > TIMEOUT {
                self.send_word_0(bus_acp);
                self.last_complete_cycle_sent = Duration::from_millis(0);
            }

            let transmission_pb_pushed = self.transmit_channel != self.transmit_pushed;

            if self.vhfs[0].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::Vhf1
            {
                self.send_volume_control(bus_acp, 2);
            }
            if self.vhfs[1].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::VHf2
            {
                self.send_volume_control(bus_acp, 3);
            }
            if self.vhfs[2].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::Vhf3
            {
                self.send_volume_control(bus_acp, 4);
            }

            if self.comms[0].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::Hf1
            {
                self.send_volume_control(bus_acp, 5);
            }
            if self.comms[1].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::Hf2
            {
                self.send_volume_control(bus_acp, 6);
            }
            if self.comms[2].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::Mech
            {
                self.send_volume_control(bus_acp, 7);
            }
            if self.comms[3].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::Cab
            {
                self.send_volume_control(bus_acp, 8);
            }
            if self.comms[4].has_changed()
                || transmission_pb_pushed && self.transmit_pushed == TransmitID::Pa
            {
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
        accept_iterable!(self.vhfs, visitor);
        accept_iterable!(self.comms, visitor);
        accept_iterable!(self.adfs, visitor);
        accept_iterable!(self.vors, visitor);

        self.ils.accept(visitor);
        self.gls.accept(visitor);
        self.markers.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        if self.is_power_supply_powered {
            self.voice_button = reader.read(&self.voice_button_id);
            self.reset_button = reader.read(&self.reset_button_id);

            let tmp: u32 = reader.read(&self.transmit_pushed_id);
            self.transmit_pushed = TransmitID::from(tmp);
        }
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.is_power_supply_powered {
            writer.write(&self.transmit_channel_id, self.transmit_channel as u32);
        }

        writer.write(&self.reset_button_id, 0);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.power_supply);
    }
}

#[derive(Default)]
struct TransceiverACPFacade {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    changed: bool,
    knob: bool,
    volume: u32,
}
impl TransceiverACPFacade {
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
impl SimulationElement for TransceiverACPFacade {
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
