use super::parameters::*;
use std::time::Duration;
use uom::si::f64::Length;

mod air_data;
mod auto_call_outs;
mod auto_flight;
mod engine;
mod flight_phases;
mod landing_gear;
mod memo;
mod monitor;

use super::monitor::{A320FwcMonitorFeedback, A320FwcMonitorParameters};
use crate::flight_warning::runtime::audio::{AutoCallOut, SoundFile};
use air_data::*;
use auto_call_outs::*;
use auto_flight::*;
use engine::*;
use flight_phases::*;
use landing_gear::*;
use memo::*;
use monitor::*;
use systems::flight_warning::warnings::WarningCode;

#[derive(Clone)]
pub(super) struct FlightPhases {
    flight_phases: Vec<u8>,
}

impl FlightPhases {
    pub(super) fn all() -> Self {
        Self {
            flight_phases: vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        }
    }

    pub(super) fn ground() -> Self {
        Self {
            flight_phases: vec![1, 2, 3, 4, 8, 9, 10],
        }
    }

    pub(super) fn in_flight() -> Self {
        Self {
            flight_phases: vec![5, 6, 7],
        }
    }

    pub(super) fn contains(&self, flight_phase: u8) -> bool {
        self.flight_phases.contains(&flight_phase)
    }
}

#[derive(Copy, Clone, Debug, PartialEq)]
pub(super) enum WarningType {
    PrimaryFailure,
    SecondaryFailure,
    IndependentFailure,
    AutoCallOut,
    DecisionHeight,
    Memo,
    SpecialLine,
    StatusInformation,
    StatusInopSys,
    StatusApproach,
    StatusMaintenance,
}

impl WarningType {
    pub(super) fn bypass_activation_delay(&self) -> bool {
        matches!(self, Self::AutoCallOut | Self::DecisionHeight)
    }
}

/*enum WarningOptions {
    CLR,
    RCL,
    C,
    EC,
    STS,
}

impl BitOr for WarningOptions {
    type Output = u8;

    fn bitor(self, rhs: Self) -> Self::Output {
        let lhs: u8 = self.into();
        let _rhs: u8 = rhs.into();
        lhs | _rhs
    }
}

impl BitOr<u8> for WarningOptions {
    type Output = u8;

    fn bitor(self, rhs: u8) -> Self::Output {
        let lhs: u8 = self.into();
        lhs | rhs
    }
}

impl BitOr<WarningOptions> for u8 {
    type Output = u8;

    fn bitor(self, rhs: WarningOptions) -> Self::Output {
        let _rhs: u8 = rhs.into();
        self | rhs
    }
}*/

pub(super) trait WarningConfiguration {
    fn warning_type(&self) -> WarningType;

    fn warning_code(&self) -> WarningCode;

    fn flight_phases(&self) -> FlightPhases;

    //fn flags(&self) -> u8;

    fn confirmation_delay(&self) -> Duration {
        Duration::from_millis(300)
    }

    fn audio_file(&self) -> Option<SoundFile> {
        None
    }

    fn synthetic_voice(&self) -> Option<AutoCallOut> {
        None
    }
}

pub(super) trait WarningActivation {
    fn audio(&self) -> bool {
        self.warning()
    }

    fn warning(&self) -> bool;
}

pub(super) trait WarningVisitor {
    fn visit(&mut self, warning: &(impl WarningConfiguration + WarningActivation));
}

/// This struct organizes all the warning activation logic and updates them.
#[derive(Default)]
pub(super) struct A320FwcWarnings {
    new_ground_def: NewGroundActivation,
    ground_detection: GroundDetectionActivation,
    speed_detection: SpeedDetectionActivation,
    engines_not_running: EngineNotRunningCfmActivation,
    both_engine_running: EngRunningActivation,
    altitude_def: AltitudeDefActivation,
    eng_take_off_cfm: EngTakeOffCfmActivation,
    tla_pwr_reverse: TlaPwrReverseActivation,
    tla_at_mct_or_flex_to_cfm: TlaAtMctOrFlexToCfmActivation,
    tla_at_cl_cfm: TlaAtClCfmActivation,
    neo_ecu: NeoEcuActivation,
    cfm_flight_phases: CfmFlightPhasesDefActivation,
    flight_phases_ground: FlightPhasesGroundActivation,
    flight_phases_air: FlightPhasesAirActivation,
    dh_dt_positive: GeneralDhDtPositiveActivation,
    general_cancel: GeneralCancelActivation,
    general_recall: GeneralRecallActivation,
    lg_downlocked: LgDownlockedActivation,
    eng_1_start_sequence: Eng1StartSequenceActivation,
    eng_2_start_sequence: Eng2StartSequenceActivation,
    audio_attenuation: AudioAttenuationActivation,
    ap_off_voluntarily: AutoFlightAutopilotOffVoluntaryActivation,
    ap_off_unvoluntarily: AutoFlightAutopilotOffUnvoluntaryActivation,
    adr_switching: AdrSwitchingActivation,
    altitude_basic: AltitudeBasicActivation,
    altitude_dmc: DmcAltitudeSettingActivation,
    altitude_capt: AltitudeCaptCorrectedActivation,
    altitude_fo: AltitudeFoCorrectedActivation,
    altitude_alert: AltitudeAlertActivation,
    altitude_alert_thresholds: AltitudeAlertThresholdsActivation,
    altitude_alert_inhibit: AltitudeAlertGeneralInhibitActivation,
    altitude_alert_slats: AltitudeAlertSlatInhibitActivation,
    altitude_alert_fmgc: AltitudeAlertFmgcInhibitActivation,
    altitude_alert_ap_tcas: AltitudeAlertApTcasInhibitActivation,
    hoisted_gpws_inhibition: HoistedGpwsInhibitionActivation,
    audio_generated: AudioGeneratedActivation,
    decision_height_val: DecisionHeightValActivation,
    mda_mdh_inhib: MdaMdhInbitionActivation,
    hundred_above: HundredAboveActivation,
    minimum: MinimumActivation,
    priority_left: PriorityLeftActivation,
    priority_right: PriorityRightActivation,
    altitude_callout_threshold1: AltitudeThreshold1Activation,
    altitude_callout_threshold2: AltitudeThreshold2Activation,
    altitude_callout_threshold3: AltitudeThreshold3Activation,
    altitude_callout_inhibit: AutomaticCallOutInhibitionActivation,
    altitude_callout_triggers1: AltitudeThresholdTriggers1Activation,
    altitude_callout_triggers2: AltitudeThresholdTriggers2Activation,
    altitude_callout_triggers3: AltitudeThresholdTriggers3Activation,
    tla_at_idle_retard: TlaAtIdleRetardActivation,
    retard_toga_inhibition: RetardTogaInhibitionActivation,
    retard_tla_inhibition: RetardTlaInhibitionActivation,
    retard_callout: AutoCallOutRetardAnnounceActivation,
    altitude_callout_5_ft: AltitudeCallout5FtAnnounceActivation,
    altitude_callout_10_ft: AltitudeCallout10FtAnnounceActivation,
    altitude_callout_20_ft: AltitudeCallout20FtAnnounceActivation,
    altitude_callout_30_ft: AltitudeCallout30FtAnnounceActivation,
    altitude_callout_40_ft: AltitudeCallout40FtAnnounceActivation,
    altitude_callout_50_ft: AltitudeCallout50FtAnnounceActivation,
    altitude_callout_100_ft: AltitudeCallout100FtAnnounceActivation,
    altitude_callout_200_ft: AltitudeCallout200FtAnnounceActivation,
    altitude_callout_300_ft: AltitudeCallout300FtAnnounceActivation,
    altitude_callout_400_ft: AltitudeCallout400FtAnnounceActivation,
    altitude_callout_500_ft: AltitudeCallout500FtAnnounceActivation,
    altitude_callout_1000_ft: AltitudeCallout1000FtAnnounceActivation,
    altitude_callout_2000_ft: AltitudeCallout2000FtAnnounceActivation,
    altitude_callout_2500_ft: AltitudeCallout2500FtAnnounceActivation,
    altitude_callout_2500b_ft: AltitudeCallout2500BFtAnnounceActivation,
    twenty_retard_callout: AutoCallOutTwentyRetardAnnounceActivation,
    ten_retard_callout: AutoCallOutTenRetardAnnounceActivation,
    altitude_callout_threshold_detection: AltitudeCalloutThresholdDetectionActivation,
    altitude_callout_intermediate_audio: IntermediateAudioActivation,
    to_memo: ToMemoActivation,
    ldg_memo: LdgMemoActivation,
    memo_flight_phase_inhib_ovrd: MemoFlightPhaseInhibOvrdActivation,
    to_inhibit_memo: ToInhibitMemoActivation,
    ldg_inhibit_memo: LdgInhibitMemoActivation,
}

impl A320FwcWarnings {
    pub(super) fn update(
        &mut self,
        delta: Duration,
        parameters: &A320FwcParameterTable,
        monitor_feedback: &A320FwcMonitorFeedback,
    ) {
        // Air Data
        self.adr_switching.update(parameters);
        self.altitude_dmc.update(parameters);
        self.altitude_basic.update(parameters);
        self.altitude_capt.update(parameters, &self.adr_switching);
        self.altitude_fo.update(parameters, &self.adr_switching);

        // Flight Phases
        self.new_ground_def.update(delta, parameters);
        self.ground_detection
            .update(delta, parameters, &self.new_ground_def);

        self.speed_detection.update(delta, parameters);
        self.engines_not_running
            .update(delta, parameters, &self.ground_detection);
        self.both_engine_running
            .update(delta, parameters, &self.engines_not_running);
        self.altitude_def.update(delta, parameters);

        self.neo_ecu.update(parameters);
        self.tla_at_mct_or_flex_to_cfm.update(parameters);
        self.eng_take_off_cfm.update(parameters);
        self.tla_pwr_reverse
            .update(delta, parameters, &self.eng_take_off_cfm);
        self.tla_at_cl_cfm.update(delta, parameters);
        self.cfm_flight_phases.update(
            delta,
            parameters,
            &self.neo_ecu,
            &self.tla_at_mct_or_flex_to_cfm,
            &self.tla_pwr_reverse,
            &self.altitude_def,
            &self.tla_at_cl_cfm,
        );

        self.flight_phases_ground.update(
            delta,
            parameters,
            &self.ground_detection,
            &self.speed_detection,
            &self.both_engine_running,
            &self.cfm_flight_phases,
        );

        self.flight_phases_air.update(
            delta,
            &self.ground_detection,
            &self.altitude_def,
            &self.cfm_flight_phases,
            &self.flight_phases_ground,
        );

        // Misc

        self.dh_dt_positive.update(delta, parameters);
        self.general_cancel.update(parameters);
        self.general_recall.update(delta, parameters);

        // Audio Setup

        self.lg_downlocked.update(parameters);

        self.eng_1_start_sequence.update(delta, parameters);
        self.eng_2_start_sequence.update(
            delta,
            parameters,
            &self.flight_phases_ground,
            &self.flight_phases_air,
        );

        // Autopilot

        let cavalry_charge_emitted =
            self.ap_off_voluntarily.ap_off_audio() || self.ap_off_unvoluntarily.audio(); // TODO feedback from monitor

        self.ap_off_voluntarily
            .update(delta, parameters, cavalry_charge_emitted);

        self.ap_off_unvoluntarily.update(
            delta,
            parameters,
            &self.ap_off_voluntarily,
            &self.flight_phases_ground,
            cavalry_charge_emitted,
        );

        // Audio Altitude Alert

        self.altitude_alert_thresholds.update(
            parameters,
            &self.altitude_dmc,
            &self.altitude_basic,
            &self.altitude_capt,
            &self.altitude_fo,
        );

        self.altitude_alert_slats.update(&self.lg_downlocked);
        self.altitude_alert_fmgc.update(parameters);
        self.altitude_alert_inhibit.update(
            parameters,
            &self.altitude_alert_slats,
            &self.altitude_alert_fmgc,
        );

        self.altitude_alert_ap_tcas.update(
            delta,
            parameters,
            &self.lg_downlocked,
            &self.altitude_alert_thresholds,
            &self.altitude_alert_inhibit,
        );

        self.altitude_alert.update(
            delta,
            parameters,
            &self.ground_detection,
            &self.ap_off_voluntarily,
            &self.altitude_alert_ap_tcas,
            &self.altitude_alert_thresholds,
            &self.altitude_alert_inhibit,
            &self.lg_downlocked,
        );

        // Auto Call Out Setup
        self.hoisted_gpws_inhibition.update(delta, parameters);
        self.audio_generated.update(
            monitor_feedback.minimum_generated(),
            monitor_feedback.hundred_above_generated(),
            monitor_feedback.priority_left_generated(),
            monitor_feedback.priority_right_generated(),
        );

        self.altitude_callout_threshold1.update(parameters);
        self.altitude_callout_inhibit.update(
            parameters,
            &self.altitude_callout_threshold1,
            &self.ground_detection,
            &self.cfm_flight_phases,
            &self.flight_phases_ground,
            &self.eng_1_start_sequence,
            &self.eng_2_start_sequence,
        );

        // Hundred Above & Minimum Callout

        self.decision_height_val.update(parameters);
        self.mda_mdh_inhib.update(
            delta,
            parameters,
            &self.hoisted_gpws_inhibition,
            &self.decision_height_val,
            &self.altitude_callout_inhibit,
        );
        self.hundred_above.update(
            delta,
            parameters,
            &self.audio_generated,
            &self.decision_height_val,
            &self.mda_mdh_inhib,
        );
        self.minimum.update(
            delta,
            parameters,
            &self.hundred_above,
            &self.audio_generated,
            &self.decision_height_val,
            &self.mda_mdh_inhib,
        );

        // Priority Callouts

        self.priority_left.update(
            delta,
            parameters,
            &self.audio_generated,
            &self.hoisted_gpws_inhibition,
        );
        self.priority_right.update(
            delta,
            parameters,
            &self.audio_generated,
            &self.hoisted_gpws_inhibition,
        );

        // Audio Altitude Callout

        self.altitude_callout_threshold2
            .update(delta, &self.altitude_callout_threshold1);
        self.altitude_callout_threshold3.update(
            &self.hoisted_gpws_inhibition,
            &self.dh_dt_positive,
            &self.altitude_callout_threshold1,
            &self.altitude_callout_threshold2,
            &self.minimum,
        );

        self.altitude_callout_triggers1.update(
            delta,
            parameters,
            &self.altitude_callout_threshold1,
            &self.altitude_callout_threshold3,
        );
        self.altitude_callout_triggers2.update(
            parameters,
            &self.altitude_callout_threshold1,
            &self.altitude_callout_threshold3,
        );
        self.altitude_callout_triggers3.update(
            parameters,
            &self.altitude_callout_threshold1,
            &self.altitude_callout_threshold2,
            &self.altitude_callout_threshold3,
        );

        self.twenty_retard_callout.update(
            delta,
            parameters,
            &self.altitude_callout_inhibit,
            &self.tla_at_mct_or_flex_to_cfm,
            &self.flight_phases_ground,
            &self.altitude_callout_triggers3,
            &self.ap_off_voluntarily,
        );
        self.ten_retard_callout.update(
            delta,
            parameters,
            &self.altitude_callout_inhibit,
            &self.twenty_retard_callout,
            &self.altitude_callout_triggers3,
            &self.ap_off_voluntarily,
        );
        self.tla_at_idle_retard.update(parameters);
        self.retard_toga_inhibition.update(
            &self.tla_at_idle_retard,
            &self.flight_phases_ground,
            &self.flight_phases_air,
        );
        self.retard_tla_inhibition.update(
            &self.engines_not_running,
            &self.tla_pwr_reverse,
            &self.tla_at_idle_retard,
            &self.retard_toga_inhibition,
        );
        self.retard_callout.update(
            delta,
            parameters,
            &self.retard_tla_inhibition,
            &self.altitude_callout_threshold2,
            &self.cfm_flight_phases,
            &self.flight_phases_ground,
            &self.flight_phases_air,
            &self.twenty_retard_callout,
            &self.ap_off_voluntarily,
        );

        self.altitude_callout_5_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers3,
            &self.retard_callout,
        );
        self.altitude_callout_10_ft.update(
            delta,
            parameters,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers3,
            &self.ap_off_voluntarily,
            &self.altitude_callout_5_ft,
            &self.retard_callout,
        );
        self.altitude_callout_20_ft.update(
            delta,
            parameters,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers3,
            &self.ap_off_voluntarily,
            &self.altitude_callout_10_ft,
        );
        self.altitude_callout_30_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers3,
            &self.altitude_callout_20_ft,
        );
        self.altitude_callout_40_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers3,
            &self.altitude_callout_30_ft,
        );
        self.altitude_callout_50_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers2,
            &self.altitude_callout_40_ft,
        );
        self.altitude_callout_100_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers2,
        );
        self.altitude_callout_200_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers2,
        );
        self.altitude_callout_300_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers2,
        );
        self.altitude_callout_400_ft.update(
            delta,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers2,
        );
        self.altitude_callout_500_ft.update(
            delta,
            parameters,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers1,
        );
        self.altitude_callout_1000_ft.update(
            &self.altitude_callout_threshold1,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers1,
        );
        self.altitude_callout_2000_ft.update(
            &self.altitude_callout_threshold1,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers1,
        );
        self.altitude_callout_2500_ft.update(
            &self.altitude_callout_threshold1,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers1,
        );
        self.altitude_callout_2500b_ft.update(
            &self.altitude_callout_threshold1,
            &self.altitude_callout_inhibit,
            &self.altitude_callout_triggers1,
        );
        self.altitude_callout_threshold_detection.update(
            &self.altitude_callout_triggers2,
            &self.altitude_callout_triggers3,
        );
        self.altitude_callout_intermediate_audio.update(
            delta,
            &self.altitude_callout_threshold1,
            &self.altitude_callout_threshold3,
            &self.altitude_callout_threshold_detection,
            &self.minimum,
            monitor_feedback.auto_call_out_generated(),
            monitor_feedback.inter_audio(),
        );

        // Audio Attenuation

        self.audio_attenuation
            .update(&self.ground_detection, &self.engines_not_running);

        // Other

        self.to_memo.update(
            delta,
            parameters,
            &self.engines_not_running,
            &self.flight_phases_ground,
            &self.flight_phases_air,
        );
        self.ldg_memo.update(
            delta,
            parameters,
            &self.flight_phases_ground,
            &self.flight_phases_air,
            &self.lg_downlocked,
            &self.to_memo,
        );

        self.memo_flight_phase_inhib_ovrd.update(
            &self.general_recall,
            &self.flight_phases_ground,
            &self.flight_phases_air,
        );
        self.to_inhibit_memo.update(
            delta,
            &self.memo_flight_phase_inhib_ovrd,
            &self.flight_phases_ground,
            &self.flight_phases_air,
        );
        self.ldg_inhibit_memo.update(
            delta,
            &self.memo_flight_phase_inhib_ovrd,
            &self.flight_phases_ground,
            &self.flight_phases_air,
        );
    }

    /// This method queries the corresponding activations to find the first phase that is currently
    /// active.
    pub(super) fn flight_phase(&self) -> Option<u8> {
        if self.flight_phases_ground.phase_1() {
            Some(1)
        } else if self.flight_phases_ground.phase_2() {
            Some(2)
        } else if self.flight_phases_ground.phase_3() {
            Some(3)
        } else if self.flight_phases_ground.phase_4() {
            Some(4)
        } else if self.flight_phases_air.phase_5() {
            Some(5)
        } else if self.flight_phases_air.phase_6() {
            Some(6)
        } else if self.flight_phases_air.phase_7() {
            Some(7)
        } else if self.flight_phases_ground.phase_8() {
            Some(8)
        } else if self.flight_phases_ground.phase_9() {
            Some(9)
        } else if self.flight_phases_ground.phase_10() {
            Some(10)
        } else {
            None
        }
    }

    pub(super) fn audio_attenuation(&self) -> bool {
        self.audio_attenuation.audio_attenuation()
    }

    pub(super) fn alt_alert_light_on(&self) -> bool {
        // TODO this should be happening in a new sheet in the warnings
        self.altitude_alert.steady_light() || self.altitude_alert.flashing_light()
    }

    pub(super) fn alt_alert_flashing_light(&self) -> bool {
        // TODO this should be happening in a new sheet in the warnings
        self.altitude_alert.flashing_light() && !self.altitude_alert.steady_light()
    }
}

impl A320FwcMonitorParameters for A320FwcWarnings {
    fn visit_warnings(&self, visitor: &mut impl WarningVisitor) {
        // Synthetic Voice
        visitor.visit(&self.priority_left);
        visitor.visit(&self.priority_right);
        visitor.visit(&self.ten_retard_callout);
        visitor.visit(&self.twenty_retard_callout);
        visitor.visit(&self.retard_callout);
        visitor.visit(&self.hundred_above);
        visitor.visit(&self.minimum);
        visitor.visit(&self.altitude_callout_5_ft);
        visitor.visit(&self.altitude_callout_10_ft);
        visitor.visit(&self.altitude_callout_20_ft);
        visitor.visit(&self.altitude_callout_30_ft);
        visitor.visit(&self.altitude_callout_40_ft);
        visitor.visit(&self.altitude_callout_50_ft);
        visitor.visit(&self.altitude_callout_100_ft);
        visitor.visit(&self.altitude_callout_200_ft);
        visitor.visit(&self.altitude_callout_300_ft);
        visitor.visit(&self.altitude_callout_400_ft);
        visitor.visit(&self.altitude_callout_500_ft);
        visitor.visit(&self.altitude_callout_1000_ft);
        visitor.visit(&self.altitude_callout_2000_ft);
        visitor.visit(&self.altitude_callout_2500b_ft);
        visitor.visit(&self.altitude_callout_2500_ft);

        visitor.visit(&self.altitude_alert);

        // Special Lines
        visitor.visit(&self.to_memo);
        visitor.visit(&self.ldg_memo);
        visitor.visit(&self.to_inhibit_memo);
        visitor.visit(&self.ldg_inhibit_memo);
    }

    fn flight_phases(&self) -> [bool; 10] {
        [
            self.flight_phases_ground.phase_1(),
            self.flight_phases_ground.phase_2(),
            self.flight_phases_ground.phase_3(),
            self.flight_phases_ground.phase_4(),
            self.flight_phases_air.phase_5(),
            self.flight_phases_air.phase_6(),
            self.flight_phases_air.phase_7(),
            self.flight_phases_ground.phase_8(),
            self.flight_phases_ground.phase_9(),
            self.flight_phases_ground.phase_10(),
        ]
    }

    fn flight_phase_inhib_ovrd(&self) -> bool {
        self.memo_flight_phase_inhib_ovrd.flight_phase_inhib_ovrd()
    }

    fn mw_cancel_pulse_up(&self) -> bool {
        self.general_cancel.mw_cancel_pulse_up()
    }

    fn mc_cancel_pulse_up(&self) -> bool {
        self.general_cancel.mc_cancel_pulse_up()
    }

    fn radio_height(&self) -> Length {
        self.altitude_callout_threshold1.radio_height()
    }

    fn intermediate_call_out(&self) -> bool {
        self.altitude_callout_intermediate_audio
            .intermediate_call_out()
    }

    fn auto_call_out_inhib(&self) -> bool {
        self.altitude_callout_inhibit.auto_call_out_inhib()
    }

    fn retard_inhibition(&self) -> bool {
        self.retard_callout.retard_inhibition()
    }
}

#[cfg(test)]
mod tests {
    use crate::flight_warning::runtime::test::*;
    use std::time::Duration;
    use uom::si::f64::*;
    use uom::si::{length::foot, velocity::knot};

    use super::*;

    /*#[cfg(test)]
    mod warning_configuration_tests {
        use super::*;

        #[test]
        fn is_foo() {
            let flags = WarningOptions::CLR | WarningOptions::RCL;
            assert_ne!(flags << WarningOptions::CLR, 0);
            assert_ne!(flags << WarningOptions::RCL, 0);
            assert_eq!(flags << WarningOptions::C, 0);
        }
    }*/

    #[cfg(test)]
    mod flight_warning_computer_warnings_tests {
        use super::*;

        mod flight_phase_tests {
            use super::*;

            trait FlightPhaseAssertions {
                /// This method can be called to assert that exactly and only the supplied flight phase is
                /// currently active.
                fn assert_exact_flight_phase(self, flight_phase: usize);
            }

            impl FlightPhaseAssertions for A320FwcWarnings {
                fn assert_exact_flight_phase(self, flight_phase: usize) {
                    assert!(
                        !((flight_phase == 1) ^ self.flight_phases_ground.phase_1()),
                        "{}",
                        if flight_phase == 1 {
                            "Flight phase 1 wasn't active"
                        } else {
                            "Flight phase 1 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 2) ^ self.flight_phases_ground.phase_2()),
                        "{}",
                        if flight_phase == 2 {
                            "Flight phase 2 wasn't active"
                        } else {
                            "Flight phase 2 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 3) ^ self.flight_phases_ground.phase_3()),
                        "{}",
                        if flight_phase == 3 {
                            "Flight phase 3 wasn't active"
                        } else {
                            "Flight phase 3 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 4) ^ self.flight_phases_ground.phase_4()),
                        "{}",
                        if flight_phase == 4 {
                            "Flight phase 4 wasn't active"
                        } else {
                            "Flight phase 4 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 5) ^ self.flight_phases_air.phase_5()),
                        "{}",
                        if flight_phase == 5 {
                            "Flight phase 5 wasn't active"
                        } else {
                            "Flight phase 5 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 6) ^ self.flight_phases_air.phase_6()),
                        "{}",
                        if flight_phase == 6 {
                            "Flight phase 6 wasn't active"
                        } else {
                            "Flight phase 6 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 7) ^ self.flight_phases_air.phase_7()),
                        "{}",
                        if flight_phase == 7 {
                            "Flight phase 7 wasn't active"
                        } else {
                            "Flight phase 7 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 8) ^ self.flight_phases_ground.phase_8()),
                        "{}",
                        if flight_phase == 8 {
                            "Flight phase 8 wasn't active"
                        } else {
                            "Flight phase 8 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 9) ^ self.flight_phases_ground.phase_9()),
                        "{}",
                        if flight_phase == 9 {
                            "Flight phase 9 wasn't active"
                        } else {
                            "Flight phase 9 was active"
                        }
                    );
                    assert!(
                        !((flight_phase == 10) ^ self.flight_phases_ground.phase_10()),
                        "{}",
                        if flight_phase == 10 {
                            "Flight phase 10 wasn't active"
                        } else {
                            "Flight phase 10 was active"
                        }
                    );
                }
            }

            #[test]
            fn when_spawning_cold_and_dark_is_phase_1() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(1),
                    &test_bed().on_ground().parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(1);
            }

            #[test]
            fn when_first_engine_running_for_30_sec_is_phase_2() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed().on_ground().one_engine_running().parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(2);
            }

            #[test]
            fn when_engines_at_takeoff_power_is_phase_3() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed()
                        .on_ground()
                        .engines_running()
                        .engines_at_takeoff_power()
                        .parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(3);
            }

            #[test]
            fn when_above_80_knots_is_phase_4() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed()
                        .on_ground()
                        .engines_running()
                        .engines_at_takeoff_power()
                        .computed_speeds(
                            Velocity::new::<knot>(85.0),
                            Velocity::new::<knot>(85.0),
                            Velocity::new::<knot>(85.0),
                        )
                        .parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(4);
            }

            #[test]
            fn when_airborne_is_phase_5() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed()
                        .engines_running()
                        .engines_at_takeoff_power()
                        .radio_heights(Length::new::<foot>(10.0), Length::new::<foot>(10.0))
                        .computed_speeds(
                            Velocity::new::<knot>(157.0),
                            Velocity::new::<knot>(157.0),
                            Velocity::new::<knot>(157.0),
                        )
                        .parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(5);
            }

            #[test]
            fn when_above_1500ft_is_phase_6() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed()
                        .engines_running()
                        .engines_at_takeoff_power()
                        .radio_heights(Length::new::<foot>(1550.0), Length::new::<foot>(1550.0))
                        .computed_speeds(
                            Velocity::new::<knot>(180.0),
                            Velocity::new::<knot>(180.0),
                            Velocity::new::<knot>(180.0),
                        )
                        .parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(6);
            }

            /// This test asserts a special case where everything points to the ground, except for
            /// the radio altimeters returning nonsensical readings (but not FW or NCD). This could
            /// happen when the ground around the aircraft is heavily contaminated. The RAs in this
            /// case are able to outvote both LGCIUs and the aircraft would be incorrectly
            /// considered to be in flight.
            #[test]
            fn on_ground_with_dual_bad_radio_altimeters_is_phase_6() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed()
                        .on_ground()
                        .radio_heights(Length::new::<foot>(800.), Length::new::<foot>(1200.))
                        .engines_running()
                        .parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(6);
            }

            #[test]
            fn when_below_800ft_is_phase_7() {
                let mut warnings = A320FwcWarnings::default();
                let mut test_bed = test_bed()
                    .engines_running()
                    .engines_at_takeoff_power()
                    .radio_heights(Length::new::<foot>(1550.0), Length::new::<foot>(1550.0))
                    .computed_speeds(
                        Velocity::new::<knot>(180.0),
                        Velocity::new::<knot>(180.0),
                        Velocity::new::<knot>(180.0),
                    );
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed.parameters(),
                    &Default::default(),
                );
                test_bed = test_bed
                    .engines_at_idle()
                    .radio_heights(Length::new::<foot>(750.0), Length::new::<foot>(750.0));
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed.parameters(),
                    &Default::default(),
                );
                warnings.assert_exact_flight_phase(7);
            }
        }

        mod audio_attenuation_tests {
            use super::*;

            #[test]
            fn when_both_engines_off_and_on_ground_audio_is_attenuated() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed().on_ground().parameters(),
                    &Default::default(),
                );
                assert!(warnings.audio_attenuation());
            }

            #[test]
            fn when_both_engines_off_and_in_air_audio_is_not_attenuated() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed().parameters(),
                    &Default::default(),
                );
                assert!(!warnings.audio_attenuation());
            }

            #[test]
            fn when_both_engines_running_and_on_ground_audio_is_not_attenuated() {
                let mut warnings = A320FwcWarnings::default();
                warnings.update(
                    Duration::from_secs(30),
                    &test_bed().on_ground().with().engines_running().parameters(),
                    &Default::default(),
                );
                assert!(!warnings.audio_attenuation());
            }
        }
    }
}
