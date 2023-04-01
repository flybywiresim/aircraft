pub mod audio;
pub mod communications_panel;

use crate::{
    communications::audio::{DEFAULT_INT_RAD_SWITCH, TRANSMIT_ID_INT},
    communications::communications_panel::CommunicationsPanel,
    simulation::{
        InitContext, Read, SideControlling, SimulationElement, SimulationElementVisitor,
        SimulatorReader, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CommunicationPanelSideName {
    NONE,
    CAPTAIN,
    FO,
    OVHD,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum AudioSwitchingKnobPosition {
    CAPTAIN,
    NORM,
    FO,
}

pub struct Communications {
    communications_panel_elected: Option<CommunicationsPanel>,
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
    ls_fcu1_pressed_id: VariableIdentifier,
    ls_fcu2_pressed_id: VariableIdentifier,

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
    ls_fcu1_pressed: bool,
    ls_fcu2_pressed: bool,
    previous_ls_fcu1_pressed: bool,
    previous_ls_fcu2_pressed: bool,

    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // receive_hf1: bool,
    // receive_hf2: bool,
    // receive_mech: bool,
    // receive_att: bool,
    // receive_pa: bool,
    //
    is_emitting: bool,
    update_comms: CommunicationPanelSideName,
    last_acp_used: CommunicationPanelSideName,

    volume_com1: u8,
    volume_com2: u8,
    volume_adf1: u8,
    volume_adf2: u8,
    volume_vor1: u8,
    volume_vor2: u8,
    volume_ils: u8,
    volume_gls: u8,
    volume_markers: u8,
    //
    // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
    // volume_hf1: u8,
    // volume_hf2: u8,
    // volume_att: u8,
    // volume_mech: u8,
    // volume_pa: u8,
}

impl Communications {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            communications_panel_elected: None,
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
            ls_fcu1_pressed_id: context.get_identifier("BTN_LS_1_FILTER_ACTIVE".to_owned()),
            ls_fcu2_pressed_id: context.get_identifier("BTN_LS_2_FILTER_ACTIVE".to_owned()),

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
            ls_fcu1_pressed: false,
            ls_fcu2_pressed: false,
            previous_ls_fcu1_pressed: false,
            previous_ls_fcu2_pressed: false,

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
            update_comms: CommunicationPanelSideName::NONE,
            last_acp_used: CommunicationPanelSideName::NONE,

            volume_com1: 0,
            volume_com2: 0,
            volume_adf1: 0,
            volume_adf2: 0,
            volume_vor1: 0,
            volume_vor2: 0,
            volume_ils: 0,
            volume_gls: 0,
            volume_markers: 0,
            //
            // FOR FUTURE USE: Not needed for the time being as there's no K event for all this
            // volume_hf1: 0,
            // volume_hf2: 0,
            // volume_att: 0,
            // volume_mech: 0,
            // volume_pa: 0,
            //
        }
    }

    /*
     * This function elects an ACP from which the simvars will be updated.
     * This election is based on which side the player is playing (EFB option) AND AudioSwitching knob.
     *
     * Once elected, the ACP's data are used to update the simvars and/or the other ACPs.
     * It is possible that no ACP is elected for update. For example if the AudioSwitching knob is on FO and the EFB option is on Captain.
     *
     * "Last ACP used" stands for the last ACP which was used to feed the simvars.
     *
     * For example, ACP3 can become the last used when the AudioSwitching knob is rotated although none of its knobs/buttons were rotated/pushed
     * Similarly, even if ACP2 knobs get rotated, it would not be the last used if the AudioSwitching knob is on FO and the EFB option is on Captain
     *
     */
    pub fn update(&mut self, context: &UpdateContext) {
        self.guess_panel_other_actions_based(context.side_controlling());

        if self.communications_panel_elected.is_none() {
            self.guess_panel_acp_actions_based(context.side_controlling());
        }

        if let Some(chosen_panel) = self.communications_panel_elected {
            self.last_acp_used = self.update_comms;

            self.is_emitting = chosen_panel.is_emitting();

            if chosen_panel.get_int_rad_switch() <= DEFAULT_INT_RAD_SWITCH {
                self.pilot_transmit_channel = chosen_panel.get_transmit_channel_value();
                self.copilot_transmit_channel = chosen_panel.get_transmit_channel_value();
            } else {
                self.pilot_transmit_channel = TRANSMIT_ID_INT;
                self.copilot_transmit_channel = TRANSMIT_ID_INT;
            }

            self.receive_com1 = chosen_panel.get_receive_com1();
            self.receive_com2 = chosen_panel.get_receive_com2();
            self.receive_adf1 = chosen_panel.get_receive_adf1();
            self.receive_adf2 = chosen_panel.get_receive_adf2();
            self.receive_vor1 = chosen_panel.get_receive_vor1();
            self.receive_vor2 = chosen_panel.get_receive_vor2();
            self.receive_ils = chosen_panel.get_receive_ils();

            // FIXME: It's very likely there is not direct bus between FCU buttons and ACPs.
            // To fix with proper simulation
            // FCOM compliant: ILS can be listened to only if LS is pressed
            self.receive_ils &= match chosen_panel.get_name() {
                CommunicationPanelSideName::OVHD => match self.audio_switching_knob {
                    AudioSwitchingKnobPosition::NORM | AudioSwitchingKnobPosition::CAPTAIN => {
                        self.ls_fcu1_pressed
                    }
                    AudioSwitchingKnobPosition::FO => self.ls_fcu1_pressed,
                },
                CommunicationPanelSideName::CAPTAIN => self.ls_fcu1_pressed,
                CommunicationPanelSideName::FO => self.ls_fcu2_pressed,
                CommunicationPanelSideName::NONE => false,
            };
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

            // Updating all ACPs with same values if EFB option is on BOTH
            // We are updating an ACP with itself but not a big deal
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
    }

    /*
     * guess_panel_other_actions_based()
     *
     * This function detects any changes on AudioSwitching knob, EFB option or LS FCU button.
     * If there are any changes, that mean the configuration has changed.
     * Therefore it elects an ACP which will be used to update the simvars.
     *
     * @return None if there was no ACP elected. The elected ACP otherwise.
     */
    fn guess_panel_other_actions_based(
        &mut self,
        side_controlling: SideControlling,
    ) -> Option<CommunicationsPanel> {
        self.communications_panel_elected = None;

        if side_controlling != self.previous_side_controlling {
            // Whenever the player presses BOTH on the EFB
            // Let's configure the ACPs with the last ACP used as we cannot guess otherwise
            if side_controlling == SideControlling::BOTH {
                // See last_acp_used definition in update() top comment
                self.communications_panel_elected = match self.last_acp_used {
                    CommunicationPanelSideName::CAPTAIN => Some(self.communications_panel_captain),
                    CommunicationPanelSideName::FO => Some(self.communications_panel_first_officer),
                    CommunicationPanelSideName::OVHD => Some(self.communications_panel_ovhd),
                    _ => None,
                };
            } else if side_controlling == SideControlling::CAPTAIN {
                // If Captain is now controlling, ACP3 is chosen if AudioSwitching knob on Captain
                self.communications_panel_elected = match self.audio_switching_knob {
                    AudioSwitchingKnobPosition::CAPTAIN => Some(self.communications_panel_ovhd),
                    _ => Some(self.communications_panel_captain),
                }
            } else {
                // If FO is now controlling, ACP3 is chosen if AudioSwitching knob on FO
                self.communications_panel_elected = match self.audio_switching_knob {
                    AudioSwitchingKnobPosition::FO => Some(self.communications_panel_ovhd),
                    _ => Some(self.communications_panel_first_officer),
                }
            }

            self.previous_side_controlling = side_controlling;

            // Whenever the player switches the AudioSwitching knob
            // If knob position and EFB option are matching, OVHD ACP is preferred
        } else if self.audio_switching_knob != self.previous_audio_switching_knob {
            self.communications_panel_elected = match self.audio_switching_knob {
                AudioSwitchingKnobPosition::NORM => match side_controlling {
                    SideControlling::BOTH | SideControlling::CAPTAIN => {
                        Some(self.communications_panel_captain)
                    }
                    SideControlling::FO => Some(self.communications_panel_first_officer),
                },
                AudioSwitchingKnobPosition::CAPTAIN => match side_controlling {
                    SideControlling::BOTH | SideControlling::CAPTAIN => {
                        Some(self.communications_panel_ovhd)
                    }
                    SideControlling::FO => Some(self.communications_panel_first_officer),
                },
                AudioSwitchingKnobPosition::FO => match side_controlling {
                    SideControlling::BOTH | SideControlling::FO => {
                        Some(self.communications_panel_ovhd)
                    }
                    SideControlling::CAPTAIN => Some(self.communications_panel_captain),
                },
            };

            self.previous_audio_switching_knob = self.audio_switching_knob;
        } else if self.previous_ls_fcu1_pressed != self.ls_fcu1_pressed {
            // FCU1 is connected to Captain only. Therefore, we only need to check AudioSwitching knob position
            // and the next group of conditions will make the job with side_controlling
            if self.audio_switching_knob == AudioSwitchingKnobPosition::NORM {
                self.communications_panel_elected = Some(self.communications_panel_captain)
            } else if self.audio_switching_knob == AudioSwitchingKnobPosition::CAPTAIN {
                self.communications_panel_elected = Some(self.communications_panel_ovhd)
            }

            self.previous_ls_fcu1_pressed = self.ls_fcu1_pressed;
        } else if self.previous_ls_fcu2_pressed != self.ls_fcu2_pressed {
            // FCU1 is connected to FO only. Therefore, we only need to check AudioSwitching knob position
            // and the next group of conditions will make the job with side_controlling
            if self.audio_switching_knob == AudioSwitchingKnobPosition::NORM {
                self.communications_panel_elected = Some(self.communications_panel_first_officer)
            } else if self.audio_switching_knob == AudioSwitchingKnobPosition::FO {
                self.communications_panel_elected = Some(self.communications_panel_ovhd)
            }

            self.previous_ls_fcu2_pressed = self.ls_fcu2_pressed;
        }

        self.communications_panel_elected
    }

    /*
     * guess_panel_acp_actions_based()
     *
     * This functions determine if the ACP (served as an ID in self.update_comms) is suitable for simvars update
     * depending on the current configuration (AudioSwitching knob position and side played (EFB option).
     *
     * "The ACP" means the ACP on which an action was performed.
     *
     * @return None if the association ACP/Configuration was not suitable. The ACP otherwise.
     *
     */
    fn guess_panel_acp_actions_based(
        &mut self,
        side_controlling: SideControlling,
    ) -> Option<CommunicationsPanel> {
        self.communications_panel_elected = None;

        if self.update_comms != CommunicationPanelSideName::NONE {
            // ACP1 disabled if ACP3 in Captain mode OR the FO is controlling (via the EFB)
            if self.update_comms == CommunicationPanelSideName::CAPTAIN {
                if self.audio_switching_knob != AudioSwitchingKnobPosition::CAPTAIN
                    && side_controlling != SideControlling::FO
                {
                    self.communications_panel_elected = Some(self.communications_panel_captain);
                }
            // ACP2 disabled if ACP3 in FO mode OR the Captain is controlling (via the EFB)
            } else if self.update_comms == CommunicationPanelSideName::FO {
                if self.audio_switching_knob != AudioSwitchingKnobPosition::FO
                    && side_controlling != SideControlling::CAPTAIN
                {
                    self.communications_panel_elected =
                        Some(self.communications_panel_first_officer);
                }
            // ACP3 taken into account only if the audioswitching knob and side playing are matching
            } else if side_controlling == SideControlling::BOTH
                || (self.audio_switching_knob == AudioSwitchingKnobPosition::CAPTAIN
                    && side_controlling == SideControlling::CAPTAIN)
                || (self.audio_switching_knob == AudioSwitchingKnobPosition::FO
                    && side_controlling == SideControlling::FO)
            {
                self.communications_panel_elected = Some(self.communications_panel_ovhd);
            }
        }

        self.communications_panel_elected
    }
}

impl SimulationElement for Communications {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.communications_panel_captain.accept(visitor);
        self.communications_panel_first_officer.accept(visitor);
        self.communications_panel_ovhd.accept(visitor);

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
            0 => CommunicationPanelSideName::NONE,
            1 => CommunicationPanelSideName::CAPTAIN,
            2 => CommunicationPanelSideName::FO,
            _ => CommunicationPanelSideName::OVHD,
        };
        self.ls_fcu1_pressed = reader.read(&self.ls_fcu1_pressed_id);
        self.ls_fcu2_pressed = reader.read(&self.ls_fcu2_pressed_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.communications_panel_elected.is_some() {
            // To avoid data race
            if self.update_comms != CommunicationPanelSideName::NONE {
                writer.write(&self.update_comms_id, 0);
            }

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
            // Setting opposite value of sound_markers to trigger the event as it
            // using VariableToEventWriteOn::Change
            if self.receive_markers {
                writer.write(&self.receive_markers_id, !self.sound_markers);
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

#[cfg(test)]
mod communications_tests {
    use super::*;
    use crate::simulation::{
        test::{SimulationTestBed, TestBed, WriteByName},
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
            Self {
                test_bed: SimulationTestBed::new(TestCommunications::new),
            }
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
        //883636401
        test_bed.write_by_name("ADF1_IDENT_PACKED", 883636401);
        test_bed.write_by_name("ACP1_ADF1_KNOB_VOLUME_DOWN", 1);
        test_bed.write_by_name("ACP1_VHF1_VOLUME", 50);
        test_bed.write_by_name("AUDIOSWITCHING_KNOB", 1);
        test_bed.write_by_name("SIDE_CONTROLLING", 2);

        test_bed.run();

        //let value: f64 = test_bed.read_by_name("COM VOLUME:1");
        //assert!(value == 50);
    }
}
