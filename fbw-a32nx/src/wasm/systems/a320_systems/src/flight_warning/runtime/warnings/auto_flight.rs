use std::time::Duration;

use super::*;
use systems::flight_warning::logic::*;
use systems::flight_warning::parameters::{SignStatusMatrix, Value};
use systems::flight_warning::utils::FwcSsm;
use systems::warning_code;
use uom::si::length::foot;

pub(in crate::flight_warning::runtime) trait AutoFlightAutopilotOffVoluntary {
    /// This signal indicates that AP1 is fully engaged (command & monitor channel).
    fn ap1_engd(&self) -> bool;

    /// This signal indicates that AP2 is fully engaged (command & monitor channel).
    fn ap2_engd(&self) -> bool;

    /// This signal indicates that any one of the APs is fully engaged (command & monitor).
    fn one_ap_engd(&self) -> bool;

    /// This signal indicates that the Cavalry Charge should be playing due to one of the
    /// instinctive P/Bs being pressed.
    fn ap_off_audio(&self) -> bool;

    /// This signal indicates that the MW should start flashing due to one of the instinctive P/Bs
    /// being pressed.
    fn ap_off_mw(&self) -> bool;

    /// This signal indicates that the special line "AP OFF" in the EWD should be shown due to one
    /// of the instinctive P/Bs being pressed.
    fn ap_off_text(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct AutoFlightAutopilotOffVoluntaryActivation {
    pulse1: PulseNode,
    pulse2: PulseNode,
    pulse3: PulseNode,
    instinc_discnct_pulse: PulseNode,
    conf1: ConfirmationNode,
    mtrig1: MonostableTriggerNode,
    mtrig2: MonostableTriggerNode,
    mtrig3: MonostableTriggerNode,
    mtrig4: MonostableTriggerNode,
    mtrig5: MonostableTriggerNode,
    mtrig6: MonostableTriggerNode,
    mtrig7: MonostableTriggerNode,
    mtrig8: MonostableTriggerNode,
    mtrig9: MonostableTriggerNode,
    mtrig10: MonostableTriggerNode,
    ap_off_audio_mem: MemoryNode,
    ap1_engd: bool,
    ap2_engd: bool,
    one_ap_engd: bool,
    ap_off_audio: bool,
    ap_off_mw: bool,
    ap_off_text: bool,
}

impl Default for AutoFlightAutopilotOffVoluntaryActivation {
    fn default() -> Self {
        Self {
            pulse1: PulseNode::new(false),
            pulse2: PulseNode::new(false),
            pulse3: PulseNode::new(false),
            instinc_discnct_pulse: PulseNode::new(true),
            conf1: ConfirmationNode::new_leading(Duration::from_secs_f64(0.2)),
            mtrig1: MonostableTriggerNode::new_leading(Duration::from_secs_f64(1.3)),
            mtrig2: MonostableTriggerNode::new_leading(Duration::from_secs_f64(1.3)),
            mtrig3: MonostableTriggerNode::new_leading(Duration::from_secs_f64(5.0)),
            mtrig4: MonostableTriggerNode::new_leading(Duration::from_secs_f64(1.5)),
            mtrig5: MonostableTriggerNode::new_leading(Duration::from_secs_f64(3.0)),
            mtrig6: MonostableTriggerNode::new_leading(Duration::from_secs_f64(3.0)),
            mtrig7: MonostableTriggerNode::new_leading(Duration::from_secs_f64(9.0)),
            mtrig8: MonostableTriggerNode::new_leading(Duration::from_secs_f64(9.0)),
            mtrig9: MonostableTriggerNode::new_leading(Duration::from_secs_f64(0.5)),
            mtrig10: MonostableTriggerNode::new_falling(Duration::from_secs_f64(1.5)),
            ap_off_audio_mem: MemoryNode::new(true),
            ap1_engd: false,
            ap2_engd: false,
            one_ap_engd: false,
            ap_off_audio: false,
            ap_off_mw: false,
            ap_off_text: false,
        }
    }
}

impl AutoFlightAutopilotOffVoluntaryActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl Ap1Engd
              + Ap2Engd
              + CaptMwCancelOn
              + FoMwCancelOn
              + InstincDiscnct1ApEngd
              + InstincDiscnct2ApEngd),
        cavalry_charge_emitted: bool,
    ) {
        self.ap1_engd = signals.ap1_engd_com().value() && signals.ap1_engd_mon().value();
        self.ap2_engd = signals.ap2_engd_com().value() && signals.ap2_engd_mon().value();
        let one_ap_engd = self.ap1_engd || self.ap2_engd;
        self.one_ap_engd = one_ap_engd;

        let allow_cancel = self.conf1.update(!one_ap_engd, delta);

        let instinc_discnct_1ap_engd = signals.instinc_discnct_1ap_engd().value();
        let instinc_discnct_2ap_engd = signals.instinc_discnct_2ap_engd().value();
        let instinc_discnct_pulse_out = self
            .instinc_discnct_pulse
            .update(instinc_discnct_1ap_engd || instinc_discnct_2ap_engd);

        let red_warning = false; // TODO certain red warnings should have priority over AP cancel
        let mw_cancel = (signals.capt_mw_cancel_on().value() || signals.fo_mw_cancel_on().value())
            && !red_warning;
        let do_cancel = allow_cancel && (mw_cancel || instinc_discnct_pulse_out);

        let any_instinc_discnct_mtrig = self.mtrig1.update(instinc_discnct_1ap_engd, delta)
            || self.mtrig2.update(instinc_discnct_2ap_engd, delta);
        let ap_disengage_pulse = self.pulse1.update(self.ap1_engd || self.ap2_engd);
        let instinctive_disconnect = ap_disengage_pulse && any_instinc_discnct_mtrig;

        let reset_ap_off_audio_cond_1 = self.pulse2.update(
            self.mtrig3
                .update(ap_disengage_pulse && any_instinc_discnct_mtrig, delta),
        );
        let reset_ap_off_audio_cond_2 = self
            .pulse3
            .update(self.mtrig4.update(cavalry_charge_emitted, delta));

        // these signals are true if the warning should be active in the first place
        let ap_off_audio_mem_out = self.ap_off_audio_mem.update(
            instinctive_disconnect,
            reset_ap_off_audio_cond_1 || reset_ap_off_audio_cond_2,
        );
        let ap_off_mw_mtrig_out = self.mtrig5.update(instinctive_disconnect, delta);
        let ap_of_text_mtrig_out = self.mtrig7.update(instinctive_disconnect, delta);

        // these signals are true if the warning should be cancelled
        let cancel_ap_off_audio = self
            .mtrig10
            .update(self.mtrig9.update(do_cancel, delta), delta);
        let cancel_ap_off_mw = self.mtrig6.update(do_cancel, delta);
        let cancel_ap_off_text = self.mtrig8.update(do_cancel, delta);

        self.ap_off_audio = ap_off_audio_mem_out && !one_ap_engd && !cancel_ap_off_audio;
        self.ap_off_mw = ap_off_mw_mtrig_out && !one_ap_engd && !cancel_ap_off_mw;
        self.ap_off_text = ap_of_text_mtrig_out && !one_ap_engd && !cancel_ap_off_text;
    }
}

impl AutoFlightAutopilotOffVoluntary for AutoFlightAutopilotOffVoluntaryActivation {
    fn ap1_engd(&self) -> bool {
        self.ap1_engd
    }

    fn ap2_engd(&self) -> bool {
        self.ap2_engd
    }

    fn one_ap_engd(&self) -> bool {
        self.one_ap_engd
    }

    fn ap_off_audio(&self) -> bool {
        self.ap_off_audio
    }

    fn ap_off_mw(&self) -> bool {
        self.ap_off_mw
    }

    fn ap_off_text(&self) -> bool {
        self.ap_off_text
    }
}

pub(in crate::flight_warning::runtime) trait AutoFlightAutopilotOffUnvoluntary {
    /// This signal indicates that the textual warning part of the AP OFF warning should be visible
    /// on the EWD.
    fn ap_off_warning(&self) -> bool;

    /// This signal indicates that an involuntary AP disocnnect was detected and and that the MW
    /// should start flashing.
    fn ap_unvol_off(&self) -> bool;

    /// This signal indicates that the AP condition for MW no longer exists because either an AP was
    /// reengaged or Phase 1 was reached, and that the MW related to the AP disconnect should stop
    /// flashing.
    fn ap_off_reset(&self) -> bool;

    /// This signal indicates that a MW cancel button has been pressed and that the MW related to
    /// the AP disconnect should stop flashing.
    fn ap_mw(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct AutoFlightAutopilotOffUnvoluntaryActivation {
    pulse_ap_disengage: PulseNode,
    pulse_ap_unvol_off: PulseNode,
    pulse_instinc_discnct: PulseNode,
    pulse_phase1: PulseNode,
    pulse_ap_engage: PulseNode,
    pulse_mw_cancel: PulseNode,
    mtrig1: MonostableTriggerNode,
    mtrig2: MonostableTriggerNode,
    mtrig3: MonostableTriggerNode,
    mem_ap_unvol_off: MemoryNode,
    mem_warning: MemoryNode,
    ap_off_warning: bool,
    ap_unvol_off: bool,
    ap_off_reset: bool,
    ap_mw: bool,
    ap_off_audio: bool,
}

impl Default for AutoFlightAutopilotOffUnvoluntaryActivation {
    fn default() -> Self {
        Self {
            pulse_ap_disengage: PulseNode::new(false),
            pulse_ap_unvol_off: PulseNode::new(true),
            pulse_instinc_discnct: PulseNode::new(true),
            pulse_phase1: PulseNode::new(true),
            pulse_ap_engage: PulseNode::new(true),
            pulse_mw_cancel: PulseNode::new(true),
            mtrig1: MonostableTriggerNode::new(true, Duration::from_secs_f64(1.3)),
            mtrig2: MonostableTriggerNode::new(true, Duration::from_secs_f64(1.3)),
            mtrig3: MonostableTriggerNode::new(true, Duration::from_secs_f64(1.5)),
            mem_ap_unvol_off: MemoryNode::new(false),
            mem_warning: MemoryNode::new(false),
            ap_off_warning: false,
            ap_off_audio: false,
            ap_unvol_off: false,
            ap_off_reset: false,
            ap_mw: false,
        }
    }
}

impl AutoFlightAutopilotOffUnvoluntaryActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl Ap1Engd
              + Ap2Engd
              + CaptMwCancelOn
              + FoMwCancelOn
              + InstincDiscnct1ApEngd
              + InstincDiscnct2ApEngd
              + BlueSysLoPr
              + YellowSysLoPr
              + GreenSysLoPr),
        voluntary_sheet: &impl AutoFlightAutopilotOffVoluntary,
        flight_phases_ground: &impl FlightPhasesGround,
        cavalry_charge_emitted: bool,
    ) {
        let phase1 = flight_phases_ground.phase_1();
        let inhibited_on_ground = phase1
            && signals.blue_sys_lo_pr().value()
            && signals.yellow_sys_lo_pr().value()
            && signals.green_sys_lo_pr().value();
        let instinc_discnct_1ap = signals.instinc_discnct_1ap_engd().value();
        let instinc_discnct_2ap = signals.instinc_discnct_2ap_engd().value();
        let mtrig1_out = self.mtrig1.update(instinc_discnct_1ap, delta);
        let mtrig2_out = self.mtrig2.update(instinc_discnct_2ap, delta);
        let recent_voluntary_disconnect = mtrig1_out || mtrig2_out;

        let ap1_engaged = signals.ap1_engd_com().value() && signals.ap1_engd_mon().value();
        let ap2_engaged = signals.ap2_engd_com().value() && signals.ap2_engd_mon().value();
        let any_ap_engaged = ap1_engaged || ap2_engaged;
        let ap_disenage_pulse = self.pulse_ap_disengage.update(any_ap_engaged);
        let phase1_pulse = self.pulse_phase1.update(phase1);
        let ap_engage_pulse = self.pulse_ap_engage.update(any_ap_engaged);

        let reset_ap_warnings = ap_engage_pulse || phase1_pulse;

        let ap_unvol_off = self.mem_ap_unvol_off.update(
            !inhibited_on_ground && !recent_voluntary_disconnect && ap_disenage_pulse,
            reset_ap_warnings,
        );
        let ap_unvol_off_pulse = self.pulse_ap_unvol_off.update(self.ap_unvol_off);
        let ap_recently_unvol_off = self.mtrig3.update(ap_unvol_off_pulse, delta);

        let any_mw_cancel = (signals.capt_mw_cancel_on().value()
            || signals.fo_mw_cancel_on().value())
            && cavalry_charge_emitted;
        let ap_mw = self
            .pulse_mw_cancel
            .update(!any_ap_engaged && any_mw_cancel);

        let any_instinc_discnct = instinc_discnct_1ap || instinc_discnct_2ap;
        let any_instinc_discnct_pulse =
            self.pulse_instinc_discnct.update(any_instinc_discnct) && !any_ap_engaged;

        let ap_off_reset =
            reset_ap_warnings || (!ap_recently_unvol_off && (any_instinc_discnct_pulse || ap_mw));

        self.ap_off_audio = self.mem_warning.update(ap_unvol_off_pulse, ap_off_reset);
        self.ap_off_warning = voluntary_sheet.ap_off_text() || ap_unvol_off;
        self.ap_unvol_off = ap_unvol_off;
        self.ap_off_reset = ap_off_reset;
        self.ap_mw = ap_mw;
    }
}

impl AutoFlightAutopilotOffUnvoluntary for AutoFlightAutopilotOffUnvoluntaryActivation {
    fn ap_off_warning(&self) -> bool {
        self.ap_off_warning
    }

    fn ap_unvol_off(&self) -> bool {
        self.ap_unvol_off
    }

    fn ap_off_reset(&self) -> bool {
        self.ap_off_reset
    }

    fn ap_mw(&self) -> bool {
        self.ap_mw
    }
}

impl WarningConfiguration for AutoFlightAutopilotOffUnvoluntaryActivation {
    fn warning_type(&self) -> WarningType {
        WarningType::IndependentFailure
    }

    fn warning_code(&self) -> WarningCode {
        warning_code!("22", "00", "005")
    }

    fn flight_phases(&self) -> FlightPhases {
        FlightPhases::all()
    }

    fn confirmation_delay(&self) -> Duration {
        Duration::ZERO
    }

    fn audio_file(&self) -> Option<SoundFile> {
        // TODO
        None
    }
}

impl WarningActivation for AutoFlightAutopilotOffUnvoluntaryActivation {
    fn audio(&self) -> bool {
        self.ap_off_audio
    }

    fn warning(&self) -> bool {
        self.ap_unvol_off
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeAlertThresholds {
    fn alt_200(&self) -> bool;
    fn alt_750(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AltitudeAlertThresholdsActivation {
    alt_200: bool,
    alt_750: bool,
}

impl AltitudeAlertThresholdsActivation {
    fn check_200(a: Length, b: Length) -> bool {
        return (a - b).abs() < Length::new::<foot>(200.0);
    }

    fn check_750(a: Length, b: Length) -> bool {
        return (a - b).abs() < Length::new::<foot>(750.0);
    }

    pub fn update(
        &mut self,
        signals: &impl AltiSelect,
        setting_sheet: &impl DmcAltitudeSetting,
        altitude_sheet: &impl AltitudeBasic,
        capt_altitude_sheet: &impl AltitudeCaptCorrected,
        fo_altitude_sheet: &impl AltitudeFoCorrected,
    ) {
        let selected = signals.alti_select().value();

        let any_std = setting_sheet.dmc_l_std() || setting_sheet.dmc_r_std();
        let alti_std = altitude_sheet.alti_basic();
        let std_200 = any_std && Self::check_200(alti_std, selected);
        let std_750 = any_std && Self::check_750(alti_std, selected);

        let capt_qnh = setting_sheet.dmc_l_qnh() || setting_sheet.dmc_l_qfe();
        let alti_capt = capt_altitude_sheet.capt_baro_alti();
        let capt_200 = capt_qnh && Self::check_200(alti_capt, selected);
        let capt_750 = capt_qnh && Self::check_750(alti_capt, selected);

        let fo_qnh = setting_sheet.dmc_r_qnh() || setting_sheet.dmc_r_qfe();
        let alti_fo = fo_altitude_sheet.fo_baro_alti();
        let fo_200 = fo_qnh && Self::check_200(alti_fo, selected);
        let fo_750 = fo_qnh && Self::check_750(alti_fo, selected);

        self.alt_200 = std_200 || capt_200 || fo_200;
        self.alt_750 = std_750 || capt_750 || fo_750;
    }
}

impl AltitudeAlertThresholds for AltitudeAlertThresholdsActivation {
    fn alt_200(&self) -> bool {
        self.alt_200
    }

    fn alt_750(&self) -> bool {
        self.alt_750
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeAlertSlatInhibit {
    /// This signal indicates that the altitude alerts should be inhibited because the gear is down.
    fn slat_inhibit(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AltitudeAlertSlatInhibitActivation {
    slat_inhibit: bool,
}

impl AltitudeAlertSlatInhibitActivation {
    pub fn update(&mut self, lg_downlocked_sheet: &impl LgDownlocked) {
        let lg_downlocked = lg_downlocked_sheet.lg_downlocked();
        self.slat_inhibit = lg_downlocked; // TODO gear down selection with flap setting
    }
}

impl AltitudeAlertSlatInhibit for AltitudeAlertSlatInhibitActivation {
    fn slat_inhibit(&self) -> bool {
        self.slat_inhibit
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeAlertFmgcInhibit {
    /// This signal indicates that the altitude alerts should be inhibited because a descent is
    /// expected, for example because the aircraft is following a glide slope.
    fn fmgc_inhibit(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AltitudeAlertFmgcInhibitActivation {
    fmgc_inhibit: bool,
}

impl AltitudeAlertFmgcInhibitActivation {
    pub fn update(
        &mut self,
        signals: &(impl GsModeOn + LandTrkModeOn + CaptModeOn + TrackModeOn + FinalDescentModeOn),
    ) {
        let fmgc_1_land_trk = signals.land_trk_mode_on(1);
        let fmgc_1_capt = signals.capt_mode_on(1);
        let fmgc_1_gs = signals.gs_mode_on(1);
        let fmgc_1_inhibit = fmgc_1_land_trk.value()
            || (fmgc_1_gs.value() && fmgc_1_capt.value())
            || (fmgc_1_gs.value() && signals.track_mode_on(1).value())
            || signals.final_descent_mode_on(1).value();

        let fmgc_2_land_trk = signals.land_trk_mode_on(2);
        let fmgc_2_capt = signals.capt_mode_on(2);
        let fmgc_2_gs = signals.gs_mode_on(2);
        let fmgc_2_inhibit = fmgc_2_land_trk.value()
            || (fmgc_2_gs.value() && fmgc_2_capt.value())
            || (fmgc_2_gs.value() && signals.track_mode_on(2).value())
            || signals.final_descent_mode_on(2).value();

        let dual_fmgc_invalidity = fmgc_1_land_trk.is_inv()
            && fmgc_1_capt.is_inv()
            && fmgc_2_land_trk.is_inv()
            && fmgc_2_capt.is_inv();

        self.fmgc_inhibit = fmgc_1_inhibit || fmgc_2_inhibit || dual_fmgc_invalidity;
    }
}

impl AltitudeAlertFmgcInhibit for AltitudeAlertFmgcInhibitActivation {
    fn fmgc_inhibit(&self) -> bool {
        self.fmgc_inhibit
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeAlertGeneralInhibit {
    /// This signal indicates that the altitude alerts should be inhibited for example because a
    /// descent is expected (on glideslope, or gear down) or because of a system failure (invalid altitude source).
    fn general_inhibit(&self) -> bool;
}

#[derive(Default)]
pub(in crate::flight_warning::runtime) struct AltitudeAlertGeneralInhibitActivation {
    general_inhibit: bool,
}

impl AltitudeAlertGeneralInhibitActivation {
    pub fn update(
        &mut self,
        signals: &(impl AltiSelect + AltSelectChg),
        slat_sheet: &impl AltitudeAlertSlatInhibit,
        fmgc_sheet: &impl AltitudeAlertFmgcInhibit,
    ) {
        let alti_select = signals.alti_select();
        let bad_alti_select = alti_select.is_ncd() || alti_select.is_inv();

        self.general_inhibit = bad_alti_select
            || signals.alt_select_chg().value()
            || slat_sheet.slat_inhibit()
            || fmgc_sheet.fmgc_inhibit();
        // TODO baro failures
    }
}

impl AltitudeAlertGeneralInhibit for AltitudeAlertGeneralInhibitActivation {
    fn general_inhibit(&self) -> bool {
        self.general_inhibit
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeAlertApTcasInhibit {
    /// This signal indicates that the Autopilot TCAS is available and engaged.
    fn ap_tcas_mode_eng(&self) -> bool;

    /// This signal indicates that the aural altitude alert should be inhibited because the
    /// deviation was initiated by AP TCAS.
    fn alt_alert_inib(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct AltitudeAlertApTcasInhibitActivation {
    pulse1: PulseNode,
    pulse2: PulseNode,
    pulse3: PulseNode,
    pulse4: PulseNode,
    mrtrig1: MonostableTriggerNode,
    mrtrig2: MonostableTriggerNode,
    mem_altitude_alert_inhib: MemoryNode,
    ap_tcas_mode_eng: bool,
    alt_alert_inib: bool,
}

impl Default for AltitudeAlertApTcasInhibitActivation {
    fn default() -> Self {
        Self {
            mem_altitude_alert_inhib: MemoryNode::new(true),
            pulse1: PulseNode::new(false),
            pulse2: PulseNode::new(true),
            pulse3: PulseNode::new(false),
            pulse4: PulseNode::new(false),
            mrtrig1: MonostableTriggerNode::new_retriggerable(true, Duration::from_secs(1)),
            mrtrig2: MonostableTriggerNode::new_retriggerable(true, Duration::from_secs(1)),
            ap_tcas_mode_eng: false,
            alt_alert_inib: false,
        }
    }
}

impl AltitudeAlertApTcasInhibitActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &(impl TcasEngaged + AltSelectChg),
        lg_downlocked_sheet: &impl LgDownlocked,
        alti_threshold_sheet: &impl AltitudeAlertThresholds,
        general_inhibit_sheet: &impl AltitudeAlertGeneralInhibit,
    ) {
        self.ap_tcas_mode_eng = signals.tcas_engaged().value(); // TODO pin programming

        let alt_200 = alti_threshold_sheet.alt_200();
        let alt_750 = alti_threshold_sheet.alt_750();
        let inhibit = general_inhibit_sheet.general_inhibit();
        let lg_downlocked = lg_downlocked_sheet.lg_downlocked();

        let pulse1_out = self.pulse1.update(alt_200 && alt_750 && !inhibit);

        let pulse23_in = !alt_200 && !alt_750 && !inhibit;
        let pulse2_out = self.pulse2.update(pulse23_in);

        let set = self.ap_tcas_mode_eng && (pulse1_out || pulse2_out);

        let pulse3_out = self.pulse3.update(pulse23_in);
        let pulse4_out = self.pulse4.update(lg_downlocked);

        let mrtrig1_out = self.mrtrig1.update(lg_downlocked, delta);
        let mrtrig2_out = self.mrtrig2.update(signals.alt_select_chg().value(), delta);

        let reset = pulse3_out || pulse4_out || mrtrig1_out || mrtrig2_out;
        self.alt_alert_inib = self.mem_altitude_alert_inhib.update(set, reset);
    }
}

impl AltitudeAlertApTcasInhibit for AltitudeAlertApTcasInhibitActivation {
    fn ap_tcas_mode_eng(&self) -> bool {
        self.ap_tcas_mode_eng
    }

    fn alt_alert_inib(&self) -> bool {
        self.alt_alert_inib
    }
}

pub(in crate::flight_warning::runtime) trait AltitudeAlert {
    /// This signal indicates that the C. Chord (Altitude Alert) should be playing.
    fn c_chord(&self) -> bool;

    /// This signal indicates that the altitude indicator on the PFDs should be slowly flashing in
    /// yellow (slight altitude deviation).
    fn steady_light(&self) -> bool;

    /// This signal indicates that the altitude indicator on the PFDs should be rapidly flashing in
    /// amber (severe altitude deviation).
    fn flashing_light(&self) -> bool;
}

pub(in crate::flight_warning::runtime) struct AltitudeAlertActivation {
    pulse1: PulseNode,
    mtrig1: MonostableTriggerNode,
    mtrig2: MonostableTriggerNode,
    mtrig3: MonostableTriggerNode,
    mtrig4: MonostableTriggerNode,
    mem_within_200: MemoryNode,
    mem_within_750: MemoryNode,
    c_chord: bool,
    steady_light: bool,
    flashing_light: bool,
}

impl Default for AltitudeAlertActivation {
    fn default() -> Self {
        Self {
            pulse1: PulseNode::new(false),
            mtrig1: MonostableTriggerNode::new(true, Duration::from_secs_f64(1.0)),
            mtrig2: MonostableTriggerNode::new(true, Duration::from_secs_f64(1.0)),
            mtrig3: MonostableTriggerNode::new(true, Duration::from_secs_f64(1.5)),
            mtrig4: MonostableTriggerNode::new(true, Duration::from_secs_f64(1.5)),
            mem_within_200: MemoryNode::new(false),
            mem_within_750: MemoryNode::new(false),
            c_chord: false,
            steady_light: false,
            flashing_light: false,
        }
    }
}

impl AltitudeAlertActivation {
    pub fn update(
        &mut self,
        delta: Duration,
        signals: &impl AltSelectChg,
        gnd_sheet: &impl GroundDetection,
        ap_sheet: &impl AutoFlightAutopilotOffVoluntary,
        ap_tcas_alt_inhibit_sheet: &impl AltitudeAlertApTcasInhibit,
        threshold_sheet: &impl AltitudeAlertThresholds,
        inhibit_sheet: &impl AltitudeAlertGeneralInhibit,
        lg_sheet: &impl LgDownlocked,
    ) {
        let ap_tcas_mode_eng = ap_tcas_alt_inhibit_sheet.ap_tcas_mode_eng();
        let ground_or_ap_tcas = gnd_sheet.ground() || ap_tcas_mode_eng;

        let mtrig1_out = self.mtrig1.update(signals.alt_select_chg().value(), delta);
        let mtrig2_out = self.mtrig2.update(lg_sheet.lg_downlocked(), delta);
        let reset_mems = mtrig1_out || mtrig2_out;

        let alt_200 = threshold_sheet.alt_200();
        let alt_750 = threshold_sheet.alt_750();
        let general_inhibit = inhibit_sheet.general_inhibit();

        let within_200 = alt_200 && alt_750 && !general_inhibit;
        let within_750 = !alt_200 && alt_750 && !general_inhibit;
        let not_750 = !alt_200 && !alt_750 && !general_inhibit;

        let mem_was_within_200 = self
            .mem_within_200
            .update(within_200, not_750 || reset_mems);

        let mem_was_within_750 = self.mem_within_750.update(within_750, reset_mems);

        let left_200 = within_750 && mem_was_within_200;
        let left_750 = not_750 && mem_was_within_750;
        let flashing_light_cond = left_200 || left_750;

        self.flashing_light = !ground_or_ap_tcas && flashing_light_cond;
        self.steady_light = !ground_or_ap_tcas && within_750 && !left_200;

        let one_ap_engd = ap_sheet.one_ap_engd();
        let mtrig3_out = self.mtrig3.update(!one_ap_engd && within_750, delta);

        let mtrig4_in = !one_ap_engd && self.pulse1.update(ap_tcas_mode_eng) && !general_inhibit;
        let approaching_alt = self.mtrig4.update(mtrig4_in, delta);

        self.c_chord = !ground_or_ap_tcas
            && (mtrig3_out
                || approaching_alt
                || (!ap_tcas_alt_inhibit_sheet.alt_alert_inib() && flashing_light_cond));
    }
}

impl AltitudeAlert for AltitudeAlertActivation {
    fn c_chord(&self) -> bool {
        self.c_chord
    }

    fn steady_light(&self) -> bool {
        self.steady_light
    }

    fn flashing_light(&self) -> bool {
        self.flashing_light
    }
}

impl WarningConfiguration for AltitudeAlertActivation {
    fn warning_type(&self) -> WarningType {
        WarningType::IndependentFailure
    }

    fn warning_code(&self) -> WarningCode {
        warning_code!("22", "00", "050")
    }

    fn flight_phases(&self) -> FlightPhases {
        FlightPhases::all()
    }

    fn audio_file(&self) -> Option<SoundFile> {
        Some(SoundFile::CChord)
    }
}

impl WarningActivation for AltitudeAlertActivation {
    fn warning(&self) -> bool {
        self.c_chord
    }
}

#[cfg(test)]
pub mod tests {
    use super::*;
    use crate::flight_warning::runtime::test::{test_bed, test_bed_with};

    mod voluntary_autopilot_warnings {
        use super::*;

        #[test]
        fn reports_ap1_engaged() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().ap1_engaged(true).parameters(),
                false,
            );
            assert!(sheet.ap1_engd());
            assert!(!sheet.ap2_engd());
            assert!(sheet.one_ap_engd());
            assert!(!sheet.ap_off_audio());
            assert!(!sheet.ap_off_mw());
            assert!(!sheet.ap_off_text());
        }

        #[test]
        fn reports_ap2_engaged() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with().ap2_engaged(true).parameters(),
                false,
            );
            assert!(!sheet.ap1_engd());
            assert!(sheet.ap2_engd());
            assert!(sheet.one_ap_engd());
            assert!(!sheet.ap_off_audio());
            assert!(!sheet.ap_off_mw());
            assert!(!sheet.ap_off_text());
        }

        #[test]
        fn reports_both_aps_engaged() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs(1),
                test_bed_with()
                    .ap1_engaged(true)
                    .ap2_engaged(true)
                    .parameters(),
                false,
            );
            assert!(sheet.ap1_engd());
            assert!(sheet.ap2_engd());
            assert!(sheet.one_ap_engd());
            assert!(!sheet.ap_off_audio());
            assert!(!sheet.ap_off_mw());
            assert!(!sheet.ap_off_text());
        }

        #[test]
        fn warns_when_ap1_is_instinctively_disconnected() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with().ap1_engaged(true).parameters(),
                false,
            );
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with()
                    .ap1_engaged(false)
                    .instinc_disconnect_1ap_engd(true)
                    .parameters(),
                false,
            );
            assert!(sheet.ap_off_audio());
            assert!(sheet.ap_off_mw());
            assert!(sheet.ap_off_text());
            sheet.update(Duration::from_secs_f64(1.5), test_bed().parameters(), true);
            assert!(sheet.ap_off_audio());
            assert!(sheet.ap_off_mw());
            assert!(sheet.ap_off_text());
            sheet.update(Duration::from_secs_f64(1.5), test_bed().parameters(), true);
            assert!(!sheet.ap_off_audio());
            assert!(!sheet.ap_off_mw());
            assert!(sheet.ap_off_text());
            sheet.update(Duration::from_secs_f64(6.0), test_bed().parameters(), false);
            assert!(!sheet.ap_off_audio());
            assert!(!sheet.ap_off_mw());
            assert!(!sheet.ap_off_text());
        }

        #[test]
        fn stops_warning_when_instinctive_disconnect_is_pressed_again() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs_f64(0.001),
                test_bed_with().ap1_engaged(true).parameters(),
                false,
            );
            sheet.update(
                Duration::from_secs_f64(0.001),
                test_bed_with()
                    .ap1_engaged(false)
                    .instinc_disconnect_1ap_engd(true)
                    .parameters(),
                false,
            );
            assert!(sheet.ap_off_audio());
            assert!(sheet.ap_off_mw());
            assert!(sheet.ap_off_text());
            sheet.update(
                Duration::from_secs_f64(0.001),
                test_bed_with()
                    .instinc_disconnect_1ap_engd(false)
                    .parameters(),
                false,
            );

            // another press within 0.2s is inhibited
            sheet.update(
                Duration::from_secs_f64(0.001),
                test_bed_with()
                    .instinc_disconnect_1ap_engd(true)
                    .parameters(),
                false,
            );
            sheet.update(
                Duration::from_secs_f64(0.001),
                test_bed_with()
                    .instinc_disconnect_1ap_engd(false)
                    .parameters(),
                false,
            );
            assert!(sheet.ap_off_audio());
            assert!(sheet.ap_off_mw());
            assert!(sheet.ap_off_text());

            // after 0.2s a press inhibits the mw and text signal, but audio remains
            sheet.update(
                Duration::from_secs_f64(0.2),
                test_bed_with()
                    .instinc_disconnect_1ap_engd(true)
                    .parameters(),
                false,
            );
            assert!(sheet.ap_off_audio());
            assert!(!sheet.ap_off_mw());
            assert!(!sheet.ap_off_text());

            // once 0.5s have passed since the inhibit is pressed, the audio is also inhibited
            sheet.update(
                Duration::from_secs_f64(0.5),
                test_bed_with()
                    .instinc_disconnect_1ap_engd(true)
                    .parameters(),
                false,
            );
            assert!(!sheet.ap_off_audio());
        }

        #[test]
        fn warns_when_ap2_is_instinctively_disconnected() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with().ap2_engaged(true).parameters(),
                false,
            );
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with()
                    .ap2_engaged(false)
                    .instinc_disconnect_2ap_engd(true)
                    .parameters(),
                false,
            );
            assert!(sheet.ap_off_audio());
            assert!(sheet.ap_off_mw());
            assert!(sheet.ap_off_text());
        }

        #[test]
        fn warns_when_both_aps_are_instinctively_disconnected() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with()
                    .ap1_engaged(true)
                    .ap2_engaged(true)
                    .parameters(),
                false,
            );
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with()
                    .ap1_engaged(false)
                    .ap2_engaged(false)
                    .instinc_disconnect_1ap_engd(true)
                    .parameters(),
                false,
            );
            assert!(sheet.ap_off_audio());
            assert!(sheet.ap_off_mw());
            assert!(sheet.ap_off_text());
        }

        #[test]
        fn does_not_warn_when_ap1_is_involuntarily_disconnected() {
            let mut sheet = AutoFlightAutopilotOffVoluntaryActivation::default();
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with().ap1_engaged(true).parameters(),
                false,
            );
            sheet.update(
                Duration::from_secs_f64(0.1),
                test_bed_with()
                    .ap1_engaged(false)
                    .instinc_disconnect_1ap_engd(false)
                    .parameters(),
                false,
            );
            assert!(!sheet.ap_off_audio());
            assert!(!sheet.ap_off_mw());
            assert!(!sheet.ap_off_text());
        }
    }

    #[derive(Default)]
    pub struct TestAutoFlightAutopilotOffVoluntary {
        ap1_engd: bool,
        ap2_engd: bool,
        ap_off_audio: bool,
        ap_off_mw: bool,
        ap_off_text: bool,
    }

    impl TestAutoFlightAutopilotOffVoluntary {
        pub fn new(
            ap1_engd: bool,
            ap2_engd: bool,
            ap_off_audio: bool,
            ap_off_mw: bool,
            ap_off_text: bool,
        ) -> Self {
            Self {
                ap1_engd,
                ap2_engd,
                ap_off_audio,
                ap_off_mw,
                ap_off_text,
            }
        }

        pub fn new_ap1_engd() -> Self {
            Self {
                ap1_engd: true,
                ap2_engd: false,
                ap_off_audio: false,
                ap_off_mw: false,
                ap_off_text: false,
            }
        }
    }

    impl AutoFlightAutopilotOffVoluntary for TestAutoFlightAutopilotOffVoluntary {
        fn ap1_engd(&self) -> bool {
            self.ap1_engd
        }

        fn ap2_engd(&self) -> bool {
            self.ap2_engd
        }

        fn one_ap_engd(&self) -> bool {
            self.ap1_engd || self.ap2_engd
        }

        fn ap_off_audio(&self) -> bool {
            self.ap_off_audio
        }

        fn ap_off_mw(&self) -> bool {
            self.ap_off_mw
        }

        fn ap_off_text(&self) -> bool {
            self.ap_off_text
        }
    }
}
