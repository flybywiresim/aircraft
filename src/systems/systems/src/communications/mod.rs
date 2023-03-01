pub mod audio;
pub mod communications_panel;

use crate::{
    communications::communications_panel::CommunicationsPanel,
    simulation::{
        InitContext, Read, SideControlling, SimulationElement, SimulationElementVisitor,
        SimulatorReader, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};
use std::time::Duration;

#[derive(Clone, Copy, Debug, PartialEq)]
enum ACPName {
    NONE,
    CAPTAIN,
    FO,
    OVHD,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum AudioSwitchingKnobPosition {
    CAPTAIN,
    NORM,
    FO,
}

pub struct Communications {
    communications_panel_captain: CommunicationsPanel,
    communications_panel_first_officer: CommunicationsPanel,
    communications_panel_ovhd: CommunicationsPanel,

    audio_switching_knob_id: VariableIdentifier,
    audio_switching_knob: AudioSwitchingKnobPosition,

    pilot_transmit_id: VariableIdentifier,
    copilot_transmit_id: VariableIdentifier,

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
    receive_gls_id: VariableIdentifier,
    receive_markers_id: VariableIdentifier,

    volume_com1_id: VariableIdentifier,
    volume_com2_id: VariableIdentifier,

    volume_adf1_id: VariableIdentifier,
    volume_adf2_id: VariableIdentifier,
    volume_vor1_id: VariableIdentifier,
    volume_vor2_id: VariableIdentifier,
    volume_ils_id: VariableIdentifier,
    volume_gls_id: VariableIdentifier,
    volume_markers_id: VariableIdentifier,
    sound_markers_id: VariableIdentifier,

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // volume_hf1_id: VariableIdentifier,
    // volume_hf2_id: VariableIdentifier,
    // volume_mech_id: VariableIdentifier,
    // volume_att_id: VariableIdentifier,
    // volume_pa_id: VariableIdentifier,
    // voice_button_id: VariableIdentifier,
    //
    is_emitting_id: VariableIdentifier,
    update_comms_id: VariableIdentifier,

    previous_side_controlling: SideControlling,
    previous_audio_switching_knob: AudioSwitchingKnobPosition,

    pilot_transmit_channel: u8,
    copilot_transmit_channel: u8,

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

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // receive_hf1: bool,
    // receive_hf2: bool,
    // receive_mech: bool,
    // receive_att: bool,
    // receive_pa: bool,
    //
    is_emitting: bool,
    update_comms: ACPName,
    last_acp_used: ACPName,

    volume_com1: u8,
    volume_com2: u8,
    volume_adf1: u8,
    volume_adf2: u8,
    volume_vor1: u8,
    volume_vor2: u8,
    volume_ils: u8,
    volume_gls: u8,
    volume_markers: u8,

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // volume_hf1: u8,
    // volume_hf2: u8,
    // volume_att: u8,
    // volume_mech: u8,
    // volume_pa: u8,
    //
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

            pilot_transmit_id: context.get_identifier("PILOT_TRANSMIT_CHANNEL".to_owned()),
            copilot_transmit_id: context.get_identifier("COPILOT_TRANSMIT_CHANNEL".to_owned()),

            // Needed to update the K events
            receive_com1_id: context.get_identifier("COM1_RECEIVE".to_owned()),
            receive_com2_id: context.get_identifier("COM2_RECEIVE".to_owned()),
            receive_adf1_id: context.get_identifier("ADF1_IDENT".to_owned()),
            receive_adf2_id: context.get_identifier("ADF2_IDENT".to_owned()),
            receive_vor1_id: context.get_identifier("VOR1_IDENT".to_owned()),
            receive_vor2_id: context.get_identifier("VOR2_IDENT".to_owned()),
            receive_ils_id: context.get_identifier("ILS_IDENT".to_owned()),
            receive_gls_id: context.get_identifier("GLS_IDENT".to_owned()),
            receive_markers_id: context.get_identifier("MARKER_IDENT".to_owned()),

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // receive_com3_id: VariableIdentifier, deactivated since vPilot needs com3 to be always on
            // receive_hf1_id: context.get_identifier("HF1_RECEIVE".to_owned()),
            // receive_hf2_id: context.get_identifier("HF2_RECEIVE".to_owned()),
            // receive_att_id: context.get_identifier("ATT_RECEIVE".to_owned()),
            // receive_mech_id: context.get_identifier("MECH_RECEIVE".to_owned()),
            // receive_pa_id: context.get_identifier("PA_RECEIVE".to_owned()),
            // voice_button_id: context.get_identifier("VOICE_BUTTON_DOWN".to_owned()),
            //
            sound_markers_id: context.get_identifier("MARKER SOUND".to_owned()),

            volume_com1_id: context.get_identifier("VHF1_VOLUME".to_owned()),
            volume_com2_id: context.get_identifier("VHF2_VOLUME".to_owned()),
            volume_adf1_id: context.get_identifier("ADF1_VOLUME".to_owned()),
            volume_adf2_id: context.get_identifier("ADF2_VOLUME".to_owned()),
            volume_vor1_id: context.get_identifier("VOR1_VOLUME".to_owned()),
            volume_vor2_id: context.get_identifier("VOR2_VOLUME".to_owned()),
            volume_ils_id: context.get_identifier("ILS_VOLUME".to_owned()),
            volume_gls_id: context.get_identifier("GLS_VOLUME".to_owned()),
            volume_markers_id: context.get_identifier("MKR_VOLUME".to_owned()),

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // volume_hf1_id: context.get_identifier("HF1_VOLUME".to_owned()),
            // volume_hf2_id: context.get_identifier("HF2_VOLUME".to_owned()),
            // volume_att_id: context.get_identifier("ATT_VOLUME".to_owned()),
            // volume_mech_id: context.get_identifier("MECH_VOLUME".to_owned()),
            // volume_pa_id: context.get_identifier("PA_VOLUME".to_owned()),
            //
            is_emitting_id: context.get_identifier("IS_EMITTING_ON_FREQUENCY".to_owned()),
            update_comms_id: context.get_identifier("UPDATE_COMMS".to_owned()),
            previous_side_controlling: SideControlling::BOTH,
            previous_audio_switching_knob: AudioSwitchingKnobPosition::NORM,

            pilot_transmit_channel: 1,
            copilot_transmit_channel: 1,

            receive_com1: false,
            receive_com2: false,
            receive_adf1: false,
            receive_adf2: false,
            receive_vor1: false,
            receive_vor2: false,
            receive_ils: false,
            receive_gls: false,
            receive_markers: false,

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // receive_hf1: false,
            // receive_hf2: false,
            // receive_mech: false,
            // receive_att: false,
            // receive_pa: false,
            // voice_button: false,
            //
            sound_markers: false,
            is_emitting: false,
            update_comms: ACPName::CAPTAIN,
            last_acp_used: ACPName::CAPTAIN,

            volume_com1: 0,
            volume_com2: 0,
            volume_adf1: 0,
            volume_adf2: 0,
            volume_vor1: 0,
            volume_vor2: 0,
            volume_ils: 0,
            volume_gls: 0,
            volume_markers: 0,
            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // volume_hf1: 0,
            // volume_hf2: 0,
            // volume_att: 0,
            // volume_mech: 0,
            // volume_pa: 0,
            //
            morse_adf1: Morse::new(context, "ADF", 1),
            morse_adf2: Morse::new(context, "ADF", 2),
            morse_vor1: Morse::new(context, "NAV", 1),
            morse_vor2: Morse::new(context, "NAV", 2),
            morse_ils: Morse::new(context, "NAV", 3),
            morse_gls: Morse::new(context, "NAV", 4),
        }
    }

    /*
     * This function does its job only if there are some changes on any ACP, AudioSwitching knob or side played via EFB option
     *
     * This function gets the ACP on which the changes occured via "update_comms" variable.
     * Depending on AudioSwitching knob position and side played option, it applies ACP data to simvars or other ACPs
     *
     * "Last ACP used" stands for the last ACP which was used to feed the simvars.
     * For example, ACP3 can become the last used when the AudioSwitching knob is rotated although none of its knobs/buttons were rotated/pushed
     * Similarly, even if ACP2 knobs get rotated, it would not be the last used if the AudioSwitching knob is on FO and the EFB option is on Captain
     *
     */
    pub fn update(&mut self, context: &UpdateContext) {
        if self.update_comms != ACPName::NONE
            || self.previous_side_controlling != context.side_controlling()
            || self.audio_switching_knob != self.previous_audio_switching_knob
        {
            // If guess_panel() return None, it means the ACP was taken into account
            // Most likely due to AudioSwitching knob position or EFB mode
            if let Some(chosen_panel) = self.guess_panel(context.side_controlling()) {
                self.last_acp_used = self.update_comms;

                self.is_emitting = chosen_panel.is_emitting();

                self.pilot_transmit_channel = chosen_panel.get_transmit_channel_value();
                self.copilot_transmit_channel = chosen_panel.get_transmit_channel_value();

                self.receive_com1 = chosen_panel.get_receive_com1();
                self.receive_com2 = chosen_panel.get_receive_com2();
                self.receive_adf1 = chosen_panel.get_receive_adf1();
                self.receive_adf2 = chosen_panel.get_receive_adf2();
                self.receive_vor1 = chosen_panel.get_receive_vor1();
                self.receive_vor2 = chosen_panel.get_receive_vor2();
                self.receive_ils = chosen_panel.get_receive_ils();
                self.receive_gls = chosen_panel.get_receive_gls();

                self.receive_markers = (self.sound_markers && !chosen_panel.get_receive_markers())
                    || (!self.sound_markers && chosen_panel.get_receive_markers());

                // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
                // self.receive_hf1 = chosen_panel.get_receive_hf1();
                // self.receive_hf2 = chosen_panel.get_receive_hf2();
                // self.receive_mech = chosen_panel.get_receive_mech();
                // self.receive_att = chosen_panel.get_receive_att();
                // self.receive_pa = chosen_panel.get_receive_pa();
                // self.voice_button = chosen_panel.get_voice_button();

                self.volume_com1 = chosen_panel.get_volume_com1();
                self.volume_com2 = chosen_panel.get_volume_com2();
                self.volume_adf1 = chosen_panel.get_volume_adf1();
                self.volume_adf2 = chosen_panel.get_volume_adf2();
                self.volume_vor1 = chosen_panel.get_volume_vor1();
                self.volume_vor2 = chosen_panel.get_volume_vor2();
                self.volume_ils = chosen_panel.get_volume_ils();
                self.volume_gls = chosen_panel.get_volume_gls();
                self.volume_markers = chosen_panel.get_volume_markers();

                // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
                // self.volume_hf1 = chosen_panel.get_volume_hf1();
                // self.volume_hf2 = chosen_panel.get_volume_hf2();
                // self.volume_att = chosen_panel.get_volume_att();
                // self.volume_mech = chosen_panel.get_volume_mech();
                // self.volume_pa = chosen_panel.get_volume_pa();

                self.morse_adf1.update(context);
                self.morse_adf2.update(context);
                self.morse_vor1.update(context);
                self.morse_vor2.update(context);
                self.morse_ils.update(context);
                self.morse_gls.update(context);

                // Updating all ACPs with same values if EFB option is on BOTH
                if context.side_controlling() == SideControlling::BOTH {
                    self.communications_panel_captain
                        .update_transmit(&chosen_panel);
                    self.communications_panel_first_officer
                        .update_transmit(&chosen_panel);
                    self.communications_panel_ovhd
                        .update_transmit(&chosen_panel);

                    self.communications_panel_captain
                        .update_receive(&chosen_panel);
                    self.communications_panel_first_officer
                        .update_receive(&chosen_panel);
                    self.communications_panel_ovhd.update_receive(&chosen_panel);

                    self.communications_panel_captain
                        .update_volume(&chosen_panel);
                    self.communications_panel_first_officer
                        .update_volume(&chosen_panel);
                    self.communications_panel_ovhd.update_volume(&chosen_panel);

                    self.communications_panel_captain.update_misc(&chosen_panel);
                    self.communications_panel_first_officer
                        .update_misc(&chosen_panel);
                    self.communications_panel_ovhd.update_misc(&chosen_panel);
                } else if context.side_controlling() == SideControlling::CAPTAIN {
                    self.copilot_transmit_channel = 4;
                } else {
                    self.pilot_transmit_channel = 4;
                }
            }

            self.previous_side_controlling = context.side_controlling();
            self.previous_audio_switching_knob = self.audio_switching_knob;
        }
    }

    /*
     * This functions guesses which ACP to use for display and simvars update
     * depending on AudioSwitchingKnob position and the side the player is playing on (EFB option)
     *
     * A lot of comparisons but needed for shared cockpit cases
     */
    fn guess_panel(&mut self, side_controlling: SideControlling) -> Option<CommunicationsPanel> {
        let mut chosen_panel = None;

        /*
         * Here, let's detect the changes in the EFB and AudioSwitching knob
         *
         * These conditions are intended to guess the ACP to use upon action on EFB option or AudioSwitching knob ONLY
         * in order to update simvars
         */

        if side_controlling != self.previous_side_controlling {
            // Whenever the player presses BOTH on the EFB
            // Let's configure the ACPs with the last ACP used as we cannot guess otherwise
            if side_controlling == SideControlling::BOTH {
                // See last_acp_used definition in update() top comment
                self.update_comms = self.last_acp_used;
            } else if side_controlling == SideControlling::CAPTAIN {
                // If Captain is now controlling, let's base our guess on AudioSwitching knob position
                // ACP1 is the chosen one
                self.update_comms = match self.audio_switching_knob {
                    AudioSwitchingKnobPosition::NORM | AudioSwitchingKnobPosition::FO => {
                        ACPName::CAPTAIN
                    }
                    _ => ACPName::OVHD,
                }
            } else {
                self.update_comms = match self.audio_switching_knob {
                    AudioSwitchingKnobPosition::NORM | AudioSwitchingKnobPosition::CAPTAIN => {
                        ACPName::FO
                    }
                    _ => ACPName::OVHD,
                }
            }

            // Whenever the player switches the AudioSwitching knob
            // If the switch is on Capt or FO, let's choose the ovhd panel to be the chosen one
            // If NORM, let's guess using the EFB option as we cannot guess otherwise (ACP1 preferred)
        } else if self.audio_switching_knob != self.previous_audio_switching_knob {
            self.update_comms = match self.audio_switching_knob {
                AudioSwitchingKnobPosition::NORM => match side_controlling {
                    SideControlling::BOTH | SideControlling::CAPTAIN => ACPName::CAPTAIN,
                    SideControlling::FO => ACPName::FO,
                },
                _ => ACPName::OVHD,
            }
        }

        /*
         * Here, let's get ACP object according to previous detection and/or player actions on the ACPs
         *
         */

        // ACP1 disabled if ACP3 in Captain mode OR the FO is controlling (via the EFB)
        if self.update_comms == ACPName::CAPTAIN {
            if self.audio_switching_knob != AudioSwitchingKnobPosition::CAPTAIN
                && side_controlling != SideControlling::FO
            {
                chosen_panel = Some(self.communications_panel_captain);
            }
        // ACP2 disabled if ACP3 in FO mode OR the Captain is controlling (via the EFB)
        } else if self.update_comms == ACPName::FO {
            if self.audio_switching_knob != AudioSwitchingKnobPosition::FO
                && side_controlling != SideControlling::CAPTAIN
            {
                chosen_panel = Some(self.communications_panel_first_officer);
            }
        // ACP3 taken into account only if the audioswitching knob is in Captain or FO mode
        } else if self.update_comms == ACPName::OVHD
            && self.audio_switching_knob != AudioSwitchingKnobPosition::NORM
        {
            chosen_panel = Some(self.communications_panel_ovhd);
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
        self.update_comms = match reader.read(&self.update_comms_id) {
            0 => ACPName::NONE,
            1 => ACPName::CAPTAIN,
            2 => ACPName::FO,
            _ => ACPName::OVHD,
        };
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.update_comms != ACPName::NONE {
            writer.write(&self.update_comms_id, 0);

            writer.write(&self.is_emitting_id, self.is_emitting);

            writer.write(&self.pilot_transmit_id, self.pilot_transmit_channel);
            writer.write(&self.copilot_transmit_id, self.copilot_transmit_channel);

            writer.write(&self.receive_com1_id, self.receive_com1);
            writer.write(&self.receive_com2_id, self.receive_com2);
            writer.write(&self.receive_adf1_id, self.receive_adf1);
            writer.write(&self.receive_adf2_id, self.receive_adf2);
            writer.write(&self.receive_vor1_id, self.receive_vor1);
            writer.write(&self.receive_vor2_id, self.receive_vor2);
            writer.write(&self.receive_ils_id, self.receive_ils);
            writer.write(&self.receive_gls_id, self.receive_gls);

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // writer.write(&self.receive_hf1_id, self.receive_hf1);
            // writer.write(&self.receive_hf2_id, self.receive_hf2);
            // writer.write(&self.receive_mech_id, self.receive_mech);
            // writer.write(&self.receive_att_id, self.receive_att);
            // writer.write(&self.receive_pa_id, self.receive_pa);

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
            writer.write(&self.volume_markers_id, self.volume_markers);

            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // writer.write(&self.volume_hf1_id, self.volume_hf1);
            // writer.write(&self.volume_hf2_id, self.volume_hf2);
            // writer.write(&self.volume_att_id, self.volume_att);
            // writer.write(&self.volume_mech_id, self.volume_mech);
            // writer.write(&self.volume_pa_id, self.volume_pa);
        }
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
