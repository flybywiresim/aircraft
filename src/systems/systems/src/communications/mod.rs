pub mod audio;
pub mod receiver;

use crate::{
    communications::audio::AudioControlPanel,
    simulation::{
        InitContext, Read, Reader, SidePlaying, SimulationElement, SimulationElementVisitor,
        SimulatorReader, SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};
use std::time::Duration;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum TransmitType {
    COM1,
    COM2,
    COM3,
    DUMMY,
    NONE,
}

read_write_enum!(TransmitType);

impl From<f64> for TransmitType {
    fn from(value: f64) -> TransmitType {
        match value as u32 {
            0 => TransmitType::COM1,
            1 => TransmitType::COM2,
            2 => TransmitType::COM3,
            _ => TransmitType::NONE,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum SideTransmission {
    CAPTAIN,
    FO,
    BOTH,
}

read_write_enum!(SideTransmission);

impl From<f64> for SideTransmission {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => SideTransmission::CAPTAIN,
            1 => SideTransmission::FO,
            _ => SideTransmission::BOTH,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum AudioSwitchingKnobPosition {
    CAPTAIN,
    NORM,
    FO,
}

pub struct Communications {
    acp1: AudioControlPanel,
    acp2: AudioControlPanel,
    acp3: AudioControlPanel,

    audio_switching_knob_id: VariableIdentifier,
    audio_switching_knob: AudioSwitchingKnobPosition,

    pilot_transmit_id: VariableIdentifier,
    copilot_transmit_id: VariableIdentifier,

    // transmit_com1_id: VariableIdentifier,
    // transmit_com2_id: VariableIdentifier,
    receive_com1_id: VariableIdentifier,
    receive_com2_id: VariableIdentifier,
    //receive_com3_id: VariableIdentifier, deactivated since vPilot needs com3 to be always on
    receive_adf1_id: VariableIdentifier,
    receive_adf2_id: VariableIdentifier,
    receive_vor1_id: VariableIdentifier,
    receive_vor2_id: VariableIdentifier,
    receive_ils_id: VariableIdentifier,
    receive_gls_id: VariableIdentifier,
    receive_markers_id: VariableIdentifier,

    volume_com1_id: VariableIdentifier,
    volume_com2_id: VariableIdentifier,
    volume_hf1_id: VariableIdentifier,
    volume_hf2_id: VariableIdentifier,
    volume_pa_id: VariableIdentifier,
    volume_att_id: VariableIdentifier,
    volume_mech_id: VariableIdentifier,
    volume_adf1_id: VariableIdentifier,
    volume_adf2_id: VariableIdentifier,
    volume_vor1_id: VariableIdentifier,
    volume_vor2_id: VariableIdentifier,
    volume_ils_id: VariableIdentifier,
    volume_gls_id: VariableIdentifier,
    volume_markers_id: VariableIdentifier,
    sound_markers_id: VariableIdentifier,

    pilot_transmit: TransmitType,
    copilot_transmit: TransmitType,

    // transmit_com1: bool,
    // transmit_com2: bool,
    receive_com1: bool,
    receive_com2: bool,
    receive_adf1: bool,
    receive_adf2: bool,
    receive_vor1: bool,
    receive_vor2: bool,
    receive_ils: bool,
    receive_gls: bool,
    receive_markers: bool,
    sound_markers: bool,

    volume_com1: u8,
    volume_com2: u8,
    volume_hf1: u8,
    volume_hf2: u8,
    volume_pa: u8,
    volume_att: u8,
    volume_mech: u8,
    volume_adf1: u8,
    volume_adf2: u8,
    volume_vor1: u8,
    volume_vor2: u8,
    volume_ils: u8,
    volume_gls: u8,
    volume_markers: u8,

    morse_adf1: Morse,
    morse_adf2: Morse,
    morse_vor1: Morse,
    morse_vor2: Morse,
    morse_ils: Morse,
    morse_gls: Morse,
}

impl Communications {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            acp1: AudioControlPanel::new(context, 1),
            acp2: AudioControlPanel::new(context, 2),
            acp3: AudioControlPanel::new(context, 3),

            audio_switching_knob_id: context.get_identifier("AUDIOSWITCHING_KNOB".to_owned()),
            audio_switching_knob: AudioSwitchingKnobPosition::NORM,

            pilot_transmit_id: context.get_identifier("PILOT_TRANSMIT".to_owned()),
            copilot_transmit_id: context.get_identifier("COPILOT_TRANSMIT".to_owned()),

            // transmit_com1_id: context.get_identifier("COM1_TRANSMIT".to_owned()),
            // transmit_com2_id: context.get_identifier("COM2_TRANSMIT".to_owned()),
            receive_com1_id: context.get_identifier("COM1_RECEIVE".to_owned()),
            receive_com2_id: context.get_identifier("COM2_RECEIVE".to_owned()),
            //receive_com3_id: VariableIdentifier, deactivated since vPilot needs com3 to be always on
            receive_adf1_id: context.get_identifier("ADF1_IDENT".to_owned()),
            receive_adf2_id: context.get_identifier("ADF2_IDENT".to_owned()),
            receive_vor1_id: context.get_identifier("VOR1_IDENT".to_owned()),
            receive_vor2_id: context.get_identifier("VOR2_IDENT".to_owned()),
            receive_ils_id: context.get_identifier("ILS_IDENT".to_owned()),
            receive_gls_id: context.get_identifier("GLS_IDENT".to_owned()),
            receive_markers_id: context.get_identifier("MARKER_IDENT".to_owned()),

            sound_markers_id: context.get_identifier("MARKER SOUND".to_owned()),

            volume_com1_id: context.get_identifier("VHF1_VOLUME".to_owned()),
            volume_com2_id: context.get_identifier("VHF2_VOLUME".to_owned()),
            volume_hf1_id: context.get_identifier("HF1_VOLUME".to_owned()),
            volume_hf2_id: context.get_identifier("HF2_VOLUME".to_owned()),
            volume_pa_id: context.get_identifier("PA_VOLUME".to_owned()),
            volume_att_id: context.get_identifier("ATT_VOLUME".to_owned()),
            volume_mech_id: context.get_identifier("MECH_VOLUME".to_owned()),
            volume_adf1_id: context.get_identifier("ADF1_VOLUME".to_owned()),
            volume_adf2_id: context.get_identifier("ADF2_VOLUME".to_owned()),
            volume_vor1_id: context.get_identifier("VOR1_VOLUME".to_owned()),
            volume_vor2_id: context.get_identifier("VOR2_VOLUME".to_owned()),
            volume_ils_id: context.get_identifier("ILS_VOLUME".to_owned()),
            volume_gls_id: context.get_identifier("GLS_VOLUME".to_owned()),
            volume_markers_id: context.get_identifier("MARKER_VOLUME".to_owned()),

            pilot_transmit: TransmitType::NONE,
            copilot_transmit: TransmitType::NONE,

            // transmit_com1: false,
            // transmit_com2: false,
            receive_com1: false,
            receive_com2: false,
            receive_adf1: false,
            receive_adf2: false,
            receive_vor1: false,
            receive_vor2: false,
            receive_ils: false,
            receive_gls: false,
            receive_markers: false,

            sound_markers: false,

            volume_com1: 0,
            volume_com2: 0,
            volume_adf1: 0,
            volume_adf2: 0,
            volume_vor1: 0,
            volume_vor2: 0,
            volume_ils: 0,
            volume_gls: 0,
            volume_hf1: 0,
            volume_hf2: 0,
            volume_pa: 0,
            volume_att: 0,
            volume_mech: 0,
            volume_markers: 0,

            morse_adf1: Morse::new(context, "ADF", 1),
            morse_adf2: Morse::new(context, "ADF", 2),
            morse_vor1: Morse::new(context, "NAV", 1),
            morse_vor2: Morse::new(context, "NAV", 2),
            morse_ils: Morse::new(context, "NAV", 3),
            morse_gls: Morse::new(context, "NAV", 4),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let side: SidePlaying = context.side_playing();

        let (transmit_com1, side_com1) = self.guess_transmit(
            self.acp1.get_transmit_com1(),
            self.acp2.get_transmit_com1(),
            self.acp3.get_transmit_com1(),
            &side,
        );
        let (transmit_com2, _side_com2) = self.guess_transmit(
            self.acp1.get_transmit_com2(),
            self.acp2.get_transmit_com2(),
            self.acp3.get_transmit_com2(),
            &side,
        );

        self.pilot_transmit = TransmitType::NONE;
        self.copilot_transmit = TransmitType::NONE;

        if transmit_com1 || transmit_com2 {
            match side_com1 {
                SideTransmission::CAPTAIN => {
                    self.pilot_transmit = if transmit_com1 {
                        TransmitType::COM1
                    } else {
                        TransmitType::COM2
                    };
                }
                SideTransmission::FO => {
                    self.copilot_transmit = if transmit_com1 {
                        TransmitType::COM1
                    } else {
                        TransmitType::COM2
                    };
                }
                _ => {
                    self.pilot_transmit = if transmit_com1 {
                        TransmitType::COM1
                    } else {
                        TransmitType::COM2
                    };
                    self.copilot_transmit = self.pilot_transmit;
                }
            }
        }

        println!("Going to write pilot {}", self.pilot_transmit as u32);
        println!("Going to write copilot {}", self.copilot_transmit as u32);

        self.receive_com1 = self.guess(
            self.acp1.get_receive_com1(),
            self.acp2.get_receive_com1(),
            self.acp3.get_receive_com1(),
            &side,
        );
        self.receive_com2 = self.guess(
            self.acp1.get_receive_com2(),
            self.acp2.get_receive_com2(),
            self.acp3.get_receive_com2(),
            &side,
        );
        self.receive_adf1 = self.guess(
            self.acp1.get_receive_adf1(),
            self.acp2.get_receive_adf1(),
            self.acp3.get_receive_adf1(),
            &side,
        );
        self.receive_adf2 = self.guess(
            self.acp1.get_receive_adf2(),
            self.acp2.get_receive_adf2(),
            self.acp3.get_receive_adf2(),
            &side,
        );
        self.receive_vor1 = self.guess(
            self.acp1.get_receive_vor1(),
            self.acp2.get_receive_vor1(),
            self.acp3.get_receive_vor1(),
            &side,
        );
        self.receive_vor2 = self.guess(
            self.acp1.get_receive_vor2(),
            self.acp2.get_receive_vor2(),
            self.acp3.get_receive_vor2(),
            &side,
        );
        self.receive_ils = self.guess(
            self.acp1.get_receive_ils(),
            self.acp2.get_receive_ils(),
            self.acp3.get_receive_ils(),
            &side,
        );
        self.receive_gls = self.guess(
            self.acp1.get_receive_gls(),
            self.acp2.get_receive_gls(),
            self.acp3.get_receive_gls(),
            &side,
        );

        // Special case for markers as there's no XXXX_SET function. Only Toggle
        self.receive_markers = self.guess_receive_markers(
            self.acp1.get_receive_markers(),
            self.acp2.get_receive_markers(),
            self.acp3.get_receive_markers(),
        );

        self.volume_com1 = self.guess(
            self.acp1.get_volume_com1(),
            self.acp2.get_volume_com1(),
            self.acp3.get_volume_com1(),
            &side,
        );

        println!("Going to write volume_com1 {}", self.volume_com1 as f64);

        self.volume_com2 = self.guess(
            self.acp1.get_volume_com2(),
            self.acp2.get_volume_com2(),
            self.acp3.get_volume_com2(),
            &side,
        );
        self.volume_adf1 = self.guess(
            self.acp1.get_volume_adf1(),
            self.acp2.get_volume_adf1(),
            self.acp3.get_volume_adf1(),
            &side,
        );
        self.volume_adf2 = self.guess(
            self.acp1.get_volume_adf2(),
            self.acp2.get_volume_adf2(),
            self.acp3.get_volume_adf2(),
            &side,
        );
        self.volume_vor1 = self.guess(
            self.acp1.get_volume_vor1(),
            self.acp2.get_volume_vor1(),
            self.acp3.get_volume_vor1(),
            &side,
        );
        self.volume_vor2 = self.guess(
            self.acp1.get_volume_vor2(),
            self.acp2.get_volume_vor2(),
            self.acp3.get_volume_vor2(),
            &side,
        );
        self.volume_ils = self.guess(
            self.acp1.get_volume_ils(),
            self.acp2.get_volume_ils(),
            self.acp3.get_volume_ils(),
            &side,
        );
        self.volume_gls = self.guess(
            self.acp1.get_volume_gls(),
            self.acp2.get_volume_gls(),
            self.acp3.get_volume_gls(),
            &side,
        );
        self.volume_hf1 = self.guess(
            self.acp1.get_volume_hf1(),
            self.acp2.get_volume_hf1(),
            self.acp3.get_volume_hf1(),
            &side,
        );
        self.volume_hf2 = self.guess(
            self.acp1.get_volume_hf2(),
            self.acp2.get_volume_hf2(),
            self.acp3.get_volume_hf2(),
            &side,
        );
        self.volume_pa = self.guess(
            self.acp1.get_volume_pa(),
            self.acp2.get_volume_pa(),
            self.acp3.get_volume_pa(),
            &side,
        );
        self.volume_att = self.guess(
            self.acp1.get_volume_att(),
            self.acp2.get_volume_att(),
            self.acp3.get_volume_att(),
            &side,
        );
        self.volume_mech = self.guess(
            self.acp1.get_volume_mech(),
            self.acp2.get_volume_mech(),
            self.acp3.get_volume_mech(),
            &side,
        );
        self.volume_markers = self.guess(
            self.acp1.get_volume_markers(),
            self.acp2.get_volume_markers(),
            self.acp3.get_volume_markers(),
            &side,
        );

        self.morse_adf1.update(context);
        self.morse_adf2.update(context);
        self.morse_vor1.update(context);
        self.morse_vor2.update(context);
        self.morse_ils.update(context);
        self.morse_gls.update(context);
    }

    fn guess<T: Copy>(
        &self,
        to_use_acp1: T,
        to_use_acp2: T,
        to_use_acp3: T,
        side_playing: &SidePlaying,
    ) -> T {
        // By default, let's use Captain's side
        let mut receive_to_use: T = to_use_acp1;

        if self.audio_switching_knob != AudioSwitchingKnobPosition::NORM {
            receive_to_use = to_use_acp3;

            if self.audio_switching_knob == AudioSwitchingKnobPosition::CAPTAIN {
                if matches!(side_playing, SidePlaying::FO) {
                    receive_to_use = to_use_acp2;
                }
            } else {
                if matches!(side_playing, SidePlaying::CAPTAIN) {
                    receive_to_use = to_use_acp1;
                }
            }
        } else {
            if matches!(side_playing, SidePlaying::FO) {
                receive_to_use = to_use_acp2;
            }
        }

        receive_to_use
    }

    fn guess_transmit(
        &self,
        to_use_acp1: bool,
        to_use_acp2: bool,
        to_use_acp3: bool,
        side_playing: &SidePlaying,
    ) -> (bool, SideTransmission) {
        // By default, let's use Captain's side
        let mut transmit_to_use = to_use_acp1;
        let mut side = SideTransmission::BOTH;

        if self.audio_switching_knob != AudioSwitchingKnobPosition::NORM {
            transmit_to_use = to_use_acp3;

            if self.audio_switching_knob == AudioSwitchingKnobPosition::CAPTAIN {
                side = SideTransmission::CAPTAIN;

                if matches!(side_playing, SidePlaying::FO) {
                    transmit_to_use = to_use_acp2;
                    side = SideTransmission::FO;
                }
            } else {
                side = SideTransmission::FO;

                if matches!(side_playing, SidePlaying::CAPTAIN) {
                    transmit_to_use = to_use_acp1;
                    side = SideTransmission::CAPTAIN;
                }
            }
        } else {
            if matches!(side_playing, SidePlaying::FO) {
                transmit_to_use = to_use_acp2;
            }
        }

        (transmit_to_use, side)
    }

    fn guess_receive_markers(&self, knob_acp1: bool, knob_acp2: bool, knob_acp3: bool) -> bool {
        let mut receive_to_return_1 = knob_acp1;
        let mut receive_to_return_2 = knob_acp2;

        if self.audio_switching_knob != AudioSwitchingKnobPosition::NORM {
            receive_to_return_2 = knob_acp3;

            if self.audio_switching_knob == AudioSwitchingKnobPosition::CAPTAIN {
                receive_to_return_1 = knob_acp2;
            } else {
                receive_to_return_1 = knob_acp1;
            }
        }

        (self.sound_markers && (!receive_to_return_1 && !receive_to_return_2))
            || (!self.sound_markers && (receive_to_return_1 || receive_to_return_2))
    }
}

impl SimulationElement for Communications {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.acp1.accept(visitor);
        self.acp2.accept(visitor);
        self.acp3.accept(visitor);

        self.morse_adf1.accept(visitor);
        self.morse_adf2.accept(visitor);
        self.morse_vor1.accept(visitor);
        self.morse_vor2.accept(visitor);
        self.morse_ils.accept(visitor);
        self.morse_gls.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.audio_switching_knob = match reader.read(&self.audio_switching_knob_id) {
            0 => AudioSwitchingKnobPosition::CAPTAIN,
            2 => AudioSwitchingKnobPosition::FO,
            _ => AudioSwitchingKnobPosition::NORM,
        };

        self.sound_markers = reader.read(&self.sound_markers_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pilot_transmit_id, self.pilot_transmit);
        writer.write(&self.copilot_transmit_id, self.copilot_transmit);

        // writer.write(&self.transmit_com1_id, self.transmit_com1);
        // writer.write(&self.transmit_com2_id, self.transmit_com2);

        writer.write(&self.receive_com1_id, self.receive_com1);
        writer.write(&self.receive_com2_id, self.receive_com2);
        writer.write(&self.receive_adf1_id, self.receive_adf1);
        writer.write(&self.receive_adf2_id, self.receive_adf2);
        writer.write(&self.receive_vor1_id, self.receive_vor1);
        writer.write(&self.receive_vor2_id, self.receive_vor2);
        writer.write(&self.receive_ils_id, self.receive_ils);
        writer.write(&self.receive_gls_id, self.receive_gls);

        // Special case for markers as there's no XXXX_SET function. Only Toggle
        if self.receive_markers {
            writer.write(&self.receive_markers_id, self.receive_markers);
        }

        writer.write(&self.volume_com1_id, self.volume_com1);
        println!("Wrote volume_com1 {}", self.volume_com1 as u32);
        writer.write(&self.volume_com2_id, self.volume_com2);
        writer.write(&self.volume_adf1_id, self.volume_adf1);
        writer.write(&self.volume_adf2_id, self.volume_adf2);
        writer.write(&self.volume_vor1_id, self.volume_vor1);
        writer.write(&self.volume_vor2_id, self.volume_vor2);
        writer.write(&self.volume_ils_id, self.volume_ils);
        writer.write(&self.volume_gls_id, self.volume_gls);
        writer.write(&self.volume_hf1_id, self.volume_hf1);
        writer.write(&self.volume_hf2_id, self.volume_hf2);
        writer.write(&self.volume_pa_id, self.volume_pa);
        writer.write(&self.volume_att_id, self.volume_att);
        writer.write(&self.volume_mech_id, self.volume_mech);
    }
}

struct Morse {
    ident_active_id: VariableIdentifier,
    ident_id: VariableIdentifier,
    short_beep_id: VariableIdentifier,
    long_beep_id: VariableIdentifier,
    ident_new: usize,
    ident_current: usize,
    morse: String,
    is_ils: bool,
    ident_active: bool,
    short_beep: bool,
    long_beep: bool,
    duration_between_symbols: Duration,
    duration_short_beep: Duration,
    duration_long_beep: Duration,
    duration_between_letters: Duration,
    duration_end_of_ident: Duration,
    duration_current: Duration,
    duration_to_wait: Duration,
}

impl Morse {
    pub fn new(context: &mut InitContext, name: &str, id: usize) -> Self {
        Self {
            ident_active_id: context.get_identifier(format!("{} SOUND:{}", name, id)),
            ident_id: context.get_identifier(format!("{}{}_IDENT", name, id)),
            short_beep_id: context.get_identifier(format!("ACP_MORSE_SHORT_BEEP_{}{}", name, id)),
            long_beep_id: context.get_identifier(format!("ACP_MORSE_LONG_BEEP_{}{}", name, id)),
            ident_new: 0,
            ident_current: 0,
            morse: "".to_owned(),
            is_ils: if name == "NAV" && id == 3 {
                true
            } else {
                false
            },
            ident_active: false,
            short_beep: false,
            long_beep: false,
            duration_between_symbols: Duration::from_millis(0),
            duration_short_beep: Duration::from_millis(0),
            duration_long_beep: Duration::from_millis(0),
            duration_between_letters: Duration::from_millis(0),
            duration_end_of_ident: Duration::from_secs(0),
            duration_current: Duration::from_millis(0),
            duration_to_wait: Duration::from_millis(0),
        }
    }

    // From unpack function in file simvar.ts
    fn unpack(&self, value: usize) -> String {
        let mut unpacked: String = "PARIS".to_owned();

        // let mut i: usize = 0;
        // while i < 8 {
        //     // pow to returns 0 in the game if big number
        //     let power = pow(2, (i % 8) * 6);
        //     if power > 0 {
        //         let code: usize = (value / power) & 0x3f;
        //         if code > 0 {
        //             unpacked.push(char::from_u32((code + 31) as u32).unwrap());
        //         }
        //     }

        //     i += 1;
        // }

        unpacked
    }

    fn convert_ident_to_morse(&mut self) -> String {
        let mut copy = "".to_owned();

        let mut total_elements = 0;

        for c in self.unpack(self.ident_current).chars() {
            // elements counts for number of characters + space between them
            let (code, elements) = match c.to_ascii_uppercase() {
                'A' => ("._", 5),
                'B' => ("_...", 9),
                'C' => ("_._.", 11),
                'D' => ("_..", 7),
                'E' => (".", 1),
                'F' => (".._.", 9),
                'G' => ("__.", 9),
                'H' => ("....", 7),
                'I' => ("..", 3),
                'J' => (".___", 13),
                'K' => ("_._", 9),
                'L' => ("._..", 9),
                'M' => ("__", 7),
                'N' => ("_.", 5),
                'O' => ("___", 11),
                'P' => (".__.", 11),
                'Q' => ("__._", 13),
                'R' => ("._.", 7),
                'S' => ("...", 5),
                'T' => ("_", 3),
                'U' => (".._", 7),
                'V' => ("..._", 9),
                'W' => (".__", 9),
                'X' => ("_.._", 11),
                'Y' => ("_.__", 13),
                'Z' => ("__..", 11),
                _ => ("", 0),
            };

            copy.push_str(code);
            copy.push_str(" ");

            // +3 to take into account the space between letters
            total_elements += elements + 3;
        }

        // End of the word. Should be +7 but as we added +3 at the last letter...
        total_elements += 4;

        println!("{}", total_elements);

        // Calculating the length of a dot. Converted 60s into ms. *7 for 7 words a minute
        let mut time_base = Duration::from_millis(60000 / (total_elements * 7)).as_millis();
        // ILS DME is bounded between 110ms and 160ms according to ICAO specifications
        if self.is_ils {
            time_base = num_traits::clamp(time_base, 110, 160);
        }

        self.duration_between_symbols = Duration::from_millis((time_base + 1) as u64);
        self.duration_short_beep = Duration::from_millis(time_base as u64);
        self.duration_long_beep = Duration::from_millis((time_base * 3) as u64);
        self.duration_between_letters = Duration::from_millis((time_base * 3) as u64);

        // Compute to remaining time between end of ident and the next 10 seconds
        self.duration_end_of_ident =
            Duration::from_secs((10000 - (time_base as u64 * total_elements)) as u64);

        copy.chars().rev().collect::<String>()
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.duration_current += context.delta();

        // Manage new ident
        if self.ident_new != self.ident_current {
            self.ident_current = self.ident_new;
            self.morse.clear();
        }

        // Manage case whenever the morse ident has to restart at the beginning
        if self.ident_current > 0 && self.morse.is_empty() {
            self.morse = self.convert_ident_to_morse();
            self.duration_to_wait = self.duration_end_of_ident;
            self.duration_current = Duration::from_millis(0);
        }

        if !self.morse.is_empty() {
            // If timedout
            if self.duration_current.as_millis() > self.duration_to_wait.as_millis() {
                self.duration_current = Duration::from_millis(0);
                self.short_beep = false;
                self.long_beep = false;

                // After a beep, we have to wait an amount of time
                if self.duration_to_wait.as_millis() == self.duration_short_beep.as_millis()
                    || self.duration_to_wait.as_millis() == self.duration_long_beep.as_millis()
                {
                    self.duration_to_wait = self.duration_between_symbols;
                } else {
                    let symbol = self.morse.pop().unwrap();

                    if symbol == '.' {
                        if self.ident_active {
                            self.short_beep = true;
                        }

                        self.duration_to_wait = self.duration_short_beep;
                    } else if symbol == '_' {
                        if self.ident_active {
                            self.long_beep = true;
                        }

                        self.duration_to_wait = self.duration_long_beep;
                    } else {
                        // space
                        self.duration_to_wait = self.duration_between_letters;
                    }
                }
            }
        } else {
            self.short_beep = false;
            self.long_beep = false;
        }
    }
}

impl SimulationElement for Morse {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.ident_active = reader.read(&self.ident_active_id);
        self.ident_new = reader.read(&self.ident_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.short_beep_id, self.short_beep);
        writer.write(&self.long_beep_id, self.long_beep);
    }
}

#[cfg(test)]
mod communications_tests {
    use super::*;
    use crate::simulation::{
        test::{SimulationTestBed, TestBed, WriteByName, ReadByName},
        Aircraft,
    };

    pub struct TestCommunications {
        communications: Communications,
    }
    impl TestCommunications {
        fn new(context: &mut InitContext) -> Self {
            Self {
                communications: Communications::new(context),
            }
        }
    }

    fn test_bed() -> CommunicationsTestBed {
        CommunicationsTestBed::new()
    }

    impl SimulationElement for TestCommunications {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.communications.accept(visitor);
            visitor.visit(self);
        }
    }

    impl Aircraft for TestCommunications {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.communications.update(context);
        }
    }

    struct CommunicationsTestBed {
        test_bed: SimulationTestBed<TestCommunications>,
    }
    impl CommunicationsTestBed {
        fn new() -> Self {
            let test_bed = CommunicationsTestBed {
                test_bed: SimulationTestBed::new(TestCommunications::new),
            };

            test_bed
        }
    }
    impl TestBed for CommunicationsTestBed {
        type Aircraft = TestCommunications;

        fn test_bed(&self) -> &SimulationTestBed<TestCommunications> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestCommunications> {
            &mut self.test_bed
        }
    }

    impl SimulationElement for CommunicationsTestBed {}

    #[test]
    fn test_unpack() {
        let mut test_bed = test_bed();
        //13831281
        test_bed.write_by_name("ACP1_VHF1_VOLUME", 50);
        test_bed.write_by_name("AUDIOSWITCHING_KNOB", 1);
        test_bed.write_by_name("SIDE_PLAYING", 1);

        test_bed.run();

        let value: f64 = test_bed.read_by_name("COM VOLUME:1");
        assert!(value == 50.0);
    }
}
