pub mod audio;
pub mod communications_panel;

use crate::{
    communications::communications_panel::CommunicationsPanel,
    simulation::{
        InitContext, Read, Reader, SideControlling, SimulationElement, SimulationElementVisitor,
        SimulatorReader, SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};
use std::time::Duration;

#[derive(Clone, Copy, Debug, PartialEq)]
enum SideTransmission {
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

enum CommunicationsPanelChosen {
    CommunicationsPanelCaptain,
    CommunicationsPanelFO,
    CommunicationsPanelOVHD,
}

pub struct Communications {
    communications_panel_captain: CommunicationsPanel,
    communications_panel_first_officer: CommunicationsPanel,
    communications_panel_ovhd: CommunicationsPanel,

    audio_switching_knob_id: VariableIdentifier,
    audio_switching_knob: AudioSwitchingKnobPosition,

    receive_com1_id: VariableIdentifier,
    receive_com2_id: VariableIdentifier,
    receive_hf1_id: VariableIdentifier,
    receive_hf2_id: VariableIdentifier,
    receive_mech_id: VariableIdentifier,
    receive_att_id: VariableIdentifier,
    receive_pa_id: VariableIdentifier,
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

    voice_button_id: VariableIdentifier,
    is_emitting_id: VariableIdentifier,

    receive_com1: bool,
    receive_com2: bool,
    receive_hf1: bool,
    receive_hf2: bool,
    receive_mech: bool,
    receive_att: bool,
    receive_pa: bool,
    receive_adf1: bool,
    receive_adf2: bool,
    receive_vor1: bool,
    receive_vor2: bool,
    receive_ils: bool,
    receive_gls: bool,
    receive_markers: bool,
    sound_markers: bool,

    voice_button: bool,
    is_emitting: bool,

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
            communications_panel_captain: CommunicationsPanel::new(context, 1),
            communications_panel_first_officer: CommunicationsPanel::new(context, 2),
            communications_panel_ovhd: CommunicationsPanel::new(context, 3),

            audio_switching_knob_id: context.get_identifier("AUDIOSWITCHING_KNOB".to_owned()),
            audio_switching_knob: AudioSwitchingKnobPosition::NORM,

            receive_com1_id: context.get_identifier("COM1_RECEIVE".to_owned()),
            receive_com2_id: context.get_identifier("COM2_RECEIVE".to_owned()),
            receive_hf1_id: context.get_identifier("HF1_RECEIVE".to_owned()),
            receive_hf2_id: context.get_identifier("HF2_RECEIVE".to_owned()),
            receive_pa_id: context.get_identifier("PA_RECEIVE".to_owned()),
            receive_att_id: context.get_identifier("ATT_RECEIVE".to_owned()),
            receive_mech_id: context.get_identifier("MECH_RECEIVE".to_owned()),
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
            volume_markers_id: context.get_identifier("MKR_VOLUME".to_owned()),

            voice_button_id: context.get_identifier("VOICE_BUTTON_DOWN".to_owned()),
            is_emitting_id: context.get_identifier("IS_EMITTING_ON_FREQUENCY".to_owned()),

            receive_com1: false,
            receive_com2: false,
            receive_hf1: false,
            receive_hf2: false,
            receive_mech: false,
            receive_att: false,
            receive_pa: false,
            receive_adf1: false,
            receive_adf2: false,
            receive_vor1: false,
            receive_vor2: false,
            receive_ils: false,
            receive_gls: false,
            receive_markers: false,
            sound_markers: false,
            voice_button: false,
            is_emitting: false,

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

    /*
     * This function gets data from an elected acp
     * according to AudioSwitchKnob position and side played
     *
     * If both sides are sync, let's skip this update
     * since the volume is common between all acps
     * and it's update within the Behaviors
     */
    pub fn update(&mut self, context: &UpdateContext) {
        let chosen_panel: &CommunicationsPanel = match self.guess_panel(&context.side_controlling())
        {
            CommunicationsPanelChosen::CommunicationsPanelCaptain => {
                &(self.communications_panel_captain)
            }
            CommunicationsPanelChosen::CommunicationsPanelFO => {
                &(self.communications_panel_first_officer)
            }
            CommunicationsPanelChosen::CommunicationsPanelOVHD => &(self.communications_panel_ovhd),
        };

        self.voice_button = chosen_panel.get_voice_button();
        self.is_emitting = chosen_panel.is_emitting();

        self.receive_com1 = chosen_panel.get_receive_com1();
        self.receive_com2 = chosen_panel.get_receive_com2();
        self.receive_hf1 = chosen_panel.get_receive_hf1();
        self.receive_hf2 = chosen_panel.get_receive_hf2();
        self.receive_mech = chosen_panel.get_receive_mech();
        self.receive_att = chosen_panel.get_receive_att();
        self.receive_pa = chosen_panel.get_receive_pa();
        self.receive_adf1 = chosen_panel.get_receive_adf1();
        self.receive_adf2 = chosen_panel.get_receive_adf2();
        self.receive_vor1 = chosen_panel.get_receive_vor1();
        self.receive_vor2 = chosen_panel.get_receive_vor2();
        self.receive_ils = chosen_panel.get_receive_ils();
        self.receive_gls = chosen_panel.get_receive_gls();

        self.receive_markers = (self.sound_markers && !chosen_panel.get_receive_markers())
            || (!self.sound_markers && chosen_panel.get_receive_markers());

        self.volume_com1 = chosen_panel.get_volume_com1();
        self.volume_com2 = chosen_panel.get_volume_com2();
        self.volume_adf1 = chosen_panel.get_volume_adf1();
        self.volume_adf2 = chosen_panel.get_volume_adf2();
        self.volume_vor1 = chosen_panel.get_volume_vor1();
        self.volume_vor2 = chosen_panel.get_volume_vor2();
        self.volume_ils = chosen_panel.get_volume_ils();
        self.volume_gls = chosen_panel.get_volume_gls();
        self.volume_hf1 = chosen_panel.get_volume_hf1();
        self.volume_hf2 = chosen_panel.get_volume_hf2();
        self.volume_pa = chosen_panel.get_volume_pa();
        self.volume_att = chosen_panel.get_volume_att();
        self.volume_mech = chosen_panel.get_volume_mech();
        self.volume_markers = chosen_panel.get_volume_markers();

        self.morse_adf1.update(context);
        self.morse_adf2.update(context);
        self.morse_vor1.update(context);
        self.morse_vor2.update(context);
        self.morse_ils.update(context);
        self.morse_gls.update(context);

        // Update ACP 2/3 with ACP1 as ACP1 is the preffered one
        // when both sides are synchronised
        if context.side_controlling() == SideControlling::BOTH {
            self.communications_panel_first_officer
                .update_volume(&self.communications_panel_captain);
            self.communications_panel_ovhd
                .update_volume(&self.communications_panel_captain);

            self.communications_panel_first_officer
                .update_receive(&self.communications_panel_captain);
            self.communications_panel_ovhd
                .update_receive(&self.communications_panel_captain);

            self.communications_panel_first_officer
                .update_misc(&self.communications_panel_captain);
            self.communications_panel_ovhd
                .update_misc(&self.communications_panel_captain);
        }
    }

    /*
     * This functions guesses which ACP to use for calculations
     * according to AudioSwitchingKnob position and the side
     * the player is playing on
     */
    fn guess_panel(&self, side_controlling: &SideControlling) -> CommunicationsPanelChosen {
        let mut chosen_panel = CommunicationsPanelChosen::CommunicationsPanelCaptain;

        // If the sides are sync, let's choose ACP1 as it doewn't matter
        if !matches!(side_controlling, SideControlling::BOTH) {
            if self.audio_switching_knob != AudioSwitchingKnobPosition::NORM {
                chosen_panel = CommunicationsPanelChosen::CommunicationsPanelOVHD;

                if self.audio_switching_knob == AudioSwitchingKnobPosition::CAPTAIN {
                    if matches!(side_controlling, SideControlling::FO) {
                        chosen_panel = CommunicationsPanelChosen::CommunicationsPanelFO;
                    }
                } else {
                    if matches!(side_controlling, SideControlling::CAPTAIN) {
                        chosen_panel = CommunicationsPanelChosen::CommunicationsPanelCaptain;
                    }
                }
            } else {
                if matches!(side_controlling, SideControlling::FO) {
                    chosen_panel = CommunicationsPanelChosen::CommunicationsPanelFO;
                }
            }
        }

        chosen_panel
    }
}

impl SimulationElement for Communications {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.communications_panel_captain.accept(visitor);
        self.communications_panel_first_officer.accept(visitor);
        self.communications_panel_ovhd.accept(visitor);

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
        writer.write(&self.is_emitting_id, self.is_emitting);
        writer.write(&self.voice_button_id, self.voice_button);

        writer.write(&self.receive_com1_id, self.receive_com1);
        writer.write(&self.receive_com2_id, self.receive_com2);
        writer.write(&self.receive_hf1_id, self.receive_hf1);
        writer.write(&self.receive_hf2_id, self.receive_hf2);
        writer.write(&self.receive_mech_id, self.receive_mech);
        writer.write(&self.receive_att_id, self.receive_att);
        writer.write(&self.receive_pa_id, self.receive_pa);

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
        writer.write(&self.volume_markers_id, self.volume_markers);
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
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
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
        test_bed.write_by_name("SIDE_CONTROLLING", 1);

        test_bed.run();

        let value: f64 = test_bed.read_by_name("COM VOLUME:1");
        assert!(value == 50.0);
    }
}
