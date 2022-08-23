use systems::flight_warning::parameters::*;
use uom::si::angle::degree;
use uom::si::f64::*;
use uom::si::length::foot;
use uom::si::ratio::{percent, ratio};
use uom::si::velocity::knot;

pub(super) trait FwcIdentSide1 {
    /// This signal indicates that the FWC is installed as FWC 1.
    fn fwc_ident_side1(&self) -> &DiscreteParameter;
}

pub(super) trait FwcIdentSide2 {
    /// This signal indicates that the FWC is installed as FWC 2.
    fn fwc_ident_side2(&self) -> &DiscreteParameter;
}

pub(super) trait LhLgCompressed {
    /// This signal indicates that the left main landing gear is compressed.
    /// The index is either 1 or 2, corresponding to LGCIU 1 or 2 respectively.
    fn lh_lg_compressed(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait EssLhLgCompressed {
    /// This signal indicates that the left main landing gear is compressed.
    /// This discrete signal is provided by LGCIU 1, which is powered by the ESS bus.
    fn ess_lh_lg_compressed(&self) -> &DiscreteParameter;
}

pub(super) trait NormLhLgCompressed {
    /// This signal indicates that the left main landing gear is compressed.
    /// This discrete signal is provided by LGCIU 2.
    fn norm_lh_lg_compressed(&self) -> &DiscreteParameter;
}

pub(super) trait LhGearDownLock {
    /// This signal indicates that the left main landing gear is downlocked.
    /// The index is either 1 or 2, corresponding to LGCIU 1 or 2 respectively.
    fn lh_gear_down_lock(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait RhGearDownLock {
    /// This signal indicates that the right main landing gear is downlocked.
    /// The index is either 1 or 2, corresponding to LGCIU 1 or 2 respectively.
    fn rh_gear_down_lock(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait NoseGearDownLock {
    /// This signal indicates that the nose landing gear is downlocked.
    /// The index is either 1 or 2, corresponding to LGCIU 1 or 2 respectively.
    fn nose_gear_down_lock(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait RadioHeight {
    /// This signal contains the measured radio altitude.
    /// The index is either 1 or 2, corresponding to Radio Altimeter 1 or 2 respectively.
    fn radio_height(&self, number: u8) -> &Arinc429Parameter<Length>;
}

pub(super) trait ComputedSpeed {
    fn computed_speed(&self, number: u8) -> &Arinc429Parameter<Velocity>;
}

pub(super) trait Eng1MasterLeverSelect {
    fn eng1_master_lever_select_on(&self) -> &Arinc429Parameter<bool>;
    fn eng1_master_lever_select_off(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng2MasterLeverSelect {
    fn eng2_master_lever_select_on(&self) -> &Arinc429Parameter<bool>;
    fn eng2_master_lever_select_off(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng1CoreSpeedAtOrAboveIdle {
    fn eng1_core_speed_at_or_above_idle(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng2CoreSpeedAtOrAboveIdle {
    fn eng2_core_speed_at_or_above_idle(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng1FirePbOut {
    fn eng_1_fire_pb_out(&self) -> &DiscreteParameter;
}

pub(super) trait Eng2FirePbOut {
    fn eng_2_fire_pb_out(&self) -> &DiscreteParameter;
}

pub(super) trait ToConfigTest {
    fn to_config_test(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng1TlaCfm {
    fn eng1_tla(&self, channel: u8) -> &Arinc429Parameter<Angle>;
}

pub(super) trait Eng2TlaCfm {
    fn eng2_tla(&self, channel: u8) -> &Arinc429Parameter<Angle>;
}

/// This parameter indicates that the engine 1 CFM ECU has determined that the TLA is in the
/// Flex Take Off (FTO) position.
pub(super) trait Eng1TlaFto {
    fn eng1_tla_fto(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

/// This parameter indicates that the engine 2 CFM ECU has determined that the TLA is in the
/// Flex Take Off (FTO) position.
pub(super) trait Eng2TlaFto {
    fn eng2_tla_fto(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng1AutoToga {
    fn eng_1_auto_toga(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng1LimitModeSoftGa {
    fn eng_1_limit_mode_soft_ga(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng2AutoToga {
    fn eng_2_auto_toga(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng2LimitModeSoftGa {
    fn eng_2_limit_mode_soft_ga(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng1N1SelectedActual {
    fn eng1_n1_selected_actual(&self, channel: u8) -> &Arinc429Parameter<Ratio>;
}

pub(super) trait Eng2N1SelectedActual {
    fn eng2_n1_selected_actual(&self, channel: u8) -> &Arinc429Parameter<Ratio>;
}

pub(super) trait Tla1IdlePwr {
    fn tla1_idle_pwr(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Tla2IdlePwr {
    fn tla2_idle_pwr(&self, channel: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng1ChannelInControl {
    fn eng1_channel_a_in_control(&self) -> &Arinc429Parameter<bool>;
    fn eng1_channel_b_in_control(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait Eng2ChannelInControl {
    fn eng2_channel_a_in_control(&self) -> &Arinc429Parameter<bool>;
    fn eng2_channel_b_in_control(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait AdcTransferCoding {
    fn adc_transfer_coding(&self, dmc: u8, bit: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait BaroRefCoding {
    fn baro_ref_coding(&self, dmc: u8, bit: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait AltitudeParameter {
    /// This parameter contains the barometric altitude as measures by the ADR.
    /// The index is 1, 2, or 3, for ADR 1, 2, or 3 respectively.
    fn altitude(&self, number: u8) -> &Arinc429Parameter<Length>;
}

pub(super) trait CaptCorrectedAltitudeParameter {
    /// This parameter contains the barometric altitude as measures by the ADR.
    /// The index is 1, 2, or 3, for ADR 1, 2, or 3 respectively.
    fn capt_corrected_altitude(&self, number: u8) -> &Arinc429Parameter<Length>;
}

pub(super) trait FoCorrectedAltitudeParameter {
    /// This parameter contains the barometric altitude as measures by the ADR.
    /// The index is 1, 2, or 3, for ADR 1, 2, or 3 respectively.
    fn fo_corrected_altitude(&self, number: u8) -> &Arinc429Parameter<Length>;
}

pub(super) trait AltiSelect {
    /// This parameter contains the selected altitude in the FCU.
    fn alti_select(&self) -> &Arinc429Parameter<Length>;
}

pub(super) trait AltSelectChg {
    /// This parameter indicates that the selected altitude in the FCU has been changed.
    fn alt_select_chg(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait Ap1Engd {
    fn ap1_engd_com(&self) -> &DiscreteParameter;
    fn ap1_engd_mon(&self) -> &DiscreteParameter;
}

pub(super) trait Ap2Engd {
    fn ap2_engd_com(&self) -> &DiscreteParameter;
    fn ap2_engd_mon(&self) -> &DiscreteParameter;
}

pub(super) trait InstincDiscnct1ApEngd {
    /// This signal indicates when the A/P Disconnect button on the Captain's sidestick is
    /// depressed.
    fn instinc_discnct_1ap_engd(&self) -> &DiscreteParameter;
}

pub(super) trait InstincDiscnct2ApEngd {
    /// This signal indicates when the A/P Disconnect button on the First Officer's sidestick is
    /// depressed.
    fn instinc_discnct_2ap_engd(&self) -> &DiscreteParameter;
}

pub(super) trait CaptMwCancelOn {
    /// This parameter indicates that the master warning cancel button on the Captain's side
    /// is depressed.
    fn capt_mw_cancel_on(&self) -> &DiscreteParameter;
}

pub(super) trait FoMwCancelOn {
    /// This parameter indicates that the master warning cancel button on the First Officer's side
    /// is depressed.
    fn fo_mw_cancel_on(&self) -> &DiscreteParameter;
}

pub(super) trait CaptMcCancelOn {
    /// This parameter indicates that the master caution cancel button on the Captain's side
    /// is depressed.
    fn capt_mc_cancel_on(&self) -> &DiscreteParameter;
}

pub(super) trait FoMcCancelOn {
    /// This parameter indicates that the master caution cancel button on the First Officer's side
    /// is depressed.
    fn fo_mc_cancel_on(&self) -> &DiscreteParameter;
}

pub(super) trait Rcl {
    fn rcl(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait EcpEmerCancelOn {
    /// This parameter indicates that the EMER CANC button on the ECP is depressed.
    fn ecp_emer_cancel_on(&self) -> &DiscreteParameter;
}

pub(super) trait EcpRecall {
    /// This parameter indicates that the RECALL button on the ECP is depressed.
    fn ecp_recall(&self) -> &DiscreteParameter;
}

pub(super) trait BlueSysLoPr {
    /// This parameter indicates that the pressure switch in the blue hydraulic system has detected
    /// low hydraulic pressure.
    fn blue_sys_lo_pr(&self) -> &DiscreteParameter;
}

pub(super) trait YellowSysLoPr {
    /// This parameter indicates that the pressure switch in the yellow hydraulic system has
    /// detected low hydraulic pressure.
    fn yellow_sys_lo_pr(&self) -> &DiscreteParameter;
}

pub(super) trait GreenSysLoPr {
    /// This parameter indicates that the pressure switch in the green hydraulic system has detected
    /// low hydraulic pressure.
    fn green_sys_lo_pr(&self) -> &DiscreteParameter;
}

pub(super) trait TcasEngaged {
    /// This parameter indicates that the TCAS mode (as used by AP TCAS) is engaged.
    fn tcas_engaged(&self) -> &Arinc429Parameter<bool>;
}

pub(super) trait GsModeOn {
    /// This parameter indicates that the respective autopilot is in GS mode.
    /// The number is 1 or 2, for FMGC 1 or 2 respectively.
    fn gs_mode_on(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait LandTrkModeOn {
    /// This parameter indicates that the respective autopilot is in Land Track mode.
    /// The number is 1 or 2, for FMGC 1 or 2 respectively.
    fn land_trk_mode_on(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait CaptModeOn {
    fn capt_mode_on(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait TrackModeOn {
    fn track_mode_on(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait FinalDescentModeOn {
    fn final_descent_mode_on(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait GpwsModesOn {
    /// This parameter indicates that one of the main GPWS alerts is active.
    fn gpws_modes_on(&self) -> &DiscreteParameter;
}

pub(super) trait GsVisualAlertOn {
    /// This parameter indicates that the GPWS glideslope alert is active.
    fn gs_visual_alert_on(&self) -> &DiscreteParameter;
}

pub(super) trait TcasAuralAdvisaryOutput {
    /// This parameter indicates that the TCAS is issuing an aural alert.
    fn tcas_aural_advisory_output(&self) -> &DiscreteParameter;
}

pub(super) trait DecisionHeight {
    fn decision_height(&self, number: u8) -> &Arinc429Parameter<Length>;
}

pub(super) trait HundredAboveForMdaMdhRequest {
    /// This parameter indicates that the respective DMC has decided that we're 100ft above the
    /// decision altitude.
    fn hundred_above_for_mda_mdh_request(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait MinimumForMdaMdhRequest {
    /// This parameter indicates that the respective DMC has decided that we're at the decision
    /// altitude.
    fn minimum_for_mda_mdh_request(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait CaptSideStickInop {
    /// This parameter indicates that the respective FCDC is considering the CAPT side stick as
    /// disabled.
    fn capt_side_stick_inop(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait FoSideStickInop {
    /// This parameter indicates that the respective FCDC is considering the F/O side stick as
    /// disabled.
    fn fo_side_stick_inop(&self, number: u8) -> &Arinc429Parameter<bool>;
}

pub(super) trait AThrEngaged {
    fn athr_engaged(&self) -> &Arinc429Parameter<bool>;
}

/// This trait represents the pins for the pin programmed auto callouts.
pub(super) trait AutoCalloutPins {
    fn decision_height_code_a(&self) -> &DiscreteParameter;
    fn decision_height_code_b(&self) -> &DiscreteParameter;
    fn decision_height_plus_100_ft_code_a(&self) -> &DiscreteParameter;
    fn decision_height_plus_100_ft_code_b(&self) -> &DiscreteParameter;
    fn auto_call_out_2500_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_2500b(&self) -> &DiscreteParameter;
    fn auto_call_out_2000_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_1000_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_500_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_500_ft_glide_deviation(&self) -> &DiscreteParameter;
    fn auto_call_out_400_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_300_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_200_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_100_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_50_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_40_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_30_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_20_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_10_ft(&self) -> &DiscreteParameter;
    fn auto_call_out_5_ft(&self) -> &DiscreteParameter;
}

pub(super) trait GlideDeviation {
    fn glide_deviation(&self, index: u8) -> &Arinc429Parameter<Ratio>;
}

pub(super) trait SyntheticVoiceSynchronizationIn {
    fn synthetic_voice_synchronization_in(&self) -> &DiscreteParameter;
}

/// This struct represents the in-memory representation of the signals used by a Flight Warning
/// Computer to determine it's activations.
pub struct A320FwcParameterTable {
    pub(super) fwc_ident_side1: DiscreteParameter,
    pub(super) fwc_ident_side2: DiscreteParameter,
    pub(super) lh_lg_compressed_1: Arinc429Parameter<bool>,
    pub(super) lh_lg_compressed_2: Arinc429Parameter<bool>,
    pub(super) ess_lh_lg_compressed: DiscreteParameter,
    pub(super) norm_lh_lg_compressed: DiscreteParameter,
    pub(super) lh_gear_down_lock_1: Arinc429Parameter<bool>,
    pub(super) lh_gear_down_lock_2: Arinc429Parameter<bool>,
    pub(super) rh_gear_down_lock_1: Arinc429Parameter<bool>,
    pub(super) rh_gear_down_lock_2: Arinc429Parameter<bool>,
    pub(super) nose_gear_down_lock_1: Arinc429Parameter<bool>,
    pub(super) nose_gear_down_lock_2: Arinc429Parameter<bool>,
    pub(super) radio_height_1: Arinc429Parameter<Length>,
    pub(super) radio_height_2: Arinc429Parameter<Length>,
    pub(super) computed_speed_1: Arinc429Parameter<Velocity>,
    pub(super) computed_speed_2: Arinc429Parameter<Velocity>,
    pub(super) computed_speed_3: Arinc429Parameter<Velocity>,
    pub(super) eng1_master_lever_select_on: Arinc429Parameter<bool>,
    pub(super) eng2_master_lever_select_on: Arinc429Parameter<bool>,
    pub(super) eng1_master_lever_select_off: Arinc429Parameter<bool>,
    pub(super) eng2_master_lever_select_off: Arinc429Parameter<bool>,
    pub(super) eng1_core_speed_at_or_above_idle_a: Arinc429Parameter<bool>,
    pub(super) eng1_core_speed_at_or_above_idle_b: Arinc429Parameter<bool>,
    pub(super) eng2_core_speed_at_or_above_idle_a: Arinc429Parameter<bool>,
    pub(super) eng2_core_speed_at_or_above_idle_b: Arinc429Parameter<bool>,
    pub(super) eng_1_fire_pb_out: DiscreteParameter,
    pub(super) eng_2_fire_pb_out: DiscreteParameter,
    pub(super) to_config_test: Arinc429Parameter<bool>,
    pub(super) eng1_tla_a: Arinc429Parameter<Angle>,
    pub(super) eng1_tla_b: Arinc429Parameter<Angle>,
    pub(super) eng2_tla_a: Arinc429Parameter<Angle>,
    pub(super) eng2_tla_b: Arinc429Parameter<Angle>,
    pub(super) eng1_tla_fto_a: Arinc429Parameter<bool>,
    pub(super) eng1_tla_fto_b: Arinc429Parameter<bool>,
    pub(super) eng2_tla_fto_a: Arinc429Parameter<bool>,
    pub(super) eng2_tla_fto_b: Arinc429Parameter<bool>,
    pub(super) eng1_n1_selected_actual_a: Arinc429Parameter<Ratio>,
    pub(super) eng1_n1_selected_actual_b: Arinc429Parameter<Ratio>,
    pub(super) eng2_n1_selected_actual_a: Arinc429Parameter<Ratio>,
    pub(super) eng2_n1_selected_actual_b: Arinc429Parameter<Ratio>,
    pub(super) tla1_idle_pwr_a: Arinc429Parameter<bool>,
    pub(super) tla1_idle_pwr_b: Arinc429Parameter<bool>,
    pub(super) tla2_idle_pwr_a: Arinc429Parameter<bool>,
    pub(super) tla2_idle_pwr_b: Arinc429Parameter<bool>,
    pub(super) eng1_channel_a_in_control: Arinc429Parameter<bool>,
    pub(super) eng1_channel_b_in_control: Arinc429Parameter<bool>,
    pub(super) eng2_channel_a_in_control: Arinc429Parameter<bool>,
    pub(super) eng2_channel_b_in_control: Arinc429Parameter<bool>,
    pub(super) eng_1_auto_toga_a: Arinc429Parameter<bool>,
    pub(super) eng_1_auto_toga_b: Arinc429Parameter<bool>,
    pub(super) eng_2_auto_toga_a: Arinc429Parameter<bool>,
    pub(super) eng_2_auto_toga_b: Arinc429Parameter<bool>,
    pub(super) eng_1_limit_mode_soft_ga_a: Arinc429Parameter<bool>,
    pub(super) eng_1_limit_mode_soft_ga_b: Arinc429Parameter<bool>,
    pub(super) eng_2_limit_mode_soft_ga_a: Arinc429Parameter<bool>,
    pub(super) eng_2_limit_mode_soft_ga_b: Arinc429Parameter<bool>,
    pub(super) dmc_1_adc_transfer_coding_bit_13: Arinc429Parameter<bool>,
    pub(super) dmc_1_adc_transfer_coding_bit_14: Arinc429Parameter<bool>,
    pub(super) dmc_2_adc_transfer_coding_bit_13: Arinc429Parameter<bool>,
    pub(super) dmc_2_adc_transfer_coding_bit_14: Arinc429Parameter<bool>,
    pub(super) dmc_1_baro_ref_coding_bit_11: Arinc429Parameter<bool>,
    pub(super) dmc_1_baro_ref_coding_bit_12: Arinc429Parameter<bool>,
    pub(super) dmc_2_baro_ref_coding_bit_11: Arinc429Parameter<bool>,
    pub(super) dmc_2_baro_ref_coding_bit_12: Arinc429Parameter<bool>,
    pub(super) altitude_1: Arinc429Parameter<Length>,
    pub(super) altitude_2: Arinc429Parameter<Length>,
    pub(super) altitude_3: Arinc429Parameter<Length>,
    pub(super) capt_corrected_altitude_1: Arinc429Parameter<Length>,
    pub(super) capt_corrected_altitude_2: Arinc429Parameter<Length>,
    pub(super) capt_corrected_altitude_3: Arinc429Parameter<Length>,
    pub(super) fo_corrected_altitude_1: Arinc429Parameter<Length>,
    pub(super) fo_corrected_altitude_2: Arinc429Parameter<Length>,
    pub(super) fo_corrected_altitude_3: Arinc429Parameter<Length>,
    pub(super) alti_select: Arinc429Parameter<Length>,
    pub(super) alti_select_chg: Arinc429Parameter<bool>,
    pub(super) ap1_engd_com: DiscreteParameter,
    pub(super) ap1_engd_mon: DiscreteParameter,
    pub(super) ap2_engd_com: DiscreteParameter,
    pub(super) ap2_engd_mon: DiscreteParameter,
    pub(super) instinc_discnct_1ap_engd: DiscreteParameter,
    pub(super) instinc_discnct_2ap_engd: DiscreteParameter,
    pub(super) capt_mw_cancel_on: DiscreteParameter,
    pub(super) fo_mw_cancel_on: DiscreteParameter,
    pub(super) capt_mc_cancel_on: DiscreteParameter,
    pub(super) fo_mc_cancel_on: DiscreteParameter,
    pub(super) rcl: Arinc429Parameter<bool>,
    pub(super) ecp_emer_cancel_on: DiscreteParameter,
    pub(super) ecp_clear: DiscreteParameter,
    pub(super) ecp_recall: DiscreteParameter,
    pub(super) ecp_status: DiscreteParameter,
    pub(super) blue_sys_lo_pr: DiscreteParameter,
    pub(super) yellow_sys_lo_pr: DiscreteParameter,
    pub(super) green_sys_lo_pr: DiscreteParameter,
    pub(super) tcas_engaged: Arinc429Parameter<bool>,
    pub(super) gs_mode_on_1: Arinc429Parameter<bool>,
    pub(super) gs_mode_on_2: Arinc429Parameter<bool>,
    pub(super) gpws_modes_on: DiscreteParameter,
    pub(super) gs_visual_alert_on: DiscreteParameter,
    pub(super) tcas_aural_advisory_output: DiscreteParameter,
    pub(super) decision_height_1: Arinc429Parameter<Length>,
    pub(super) decision_height_2: Arinc429Parameter<Length>,
    pub(super) hundred_above_for_mda_mdh_request_1: Arinc429Parameter<bool>,
    pub(super) hundred_above_for_mda_mdh_request_2: Arinc429Parameter<bool>,
    pub(super) minimum_for_mda_mdh_request_1: Arinc429Parameter<bool>,
    pub(super) minimum_for_mda_mdh_request_2: Arinc429Parameter<bool>,
    pub(super) capt_side_stick_inop_1: Arinc429Parameter<bool>,
    pub(super) capt_side_stick_inop_2: Arinc429Parameter<bool>,
    pub(super) fo_side_stick_inop_1: Arinc429Parameter<bool>,
    pub(super) fo_side_stick_inop_2: Arinc429Parameter<bool>,
    pub(super) decision_height_code_a: DiscreteParameter,
    pub(super) decision_height_code_b: DiscreteParameter,
    pub(super) decision_height_plus_100_ft_code_a: DiscreteParameter,
    pub(super) decision_height_plus_100_ft_code_b: DiscreteParameter,
    pub(super) auto_call_out_2500_ft: DiscreteParameter,
    pub(super) auto_call_out_2500b: DiscreteParameter,
    pub(super) auto_call_out_2000_ft: DiscreteParameter,
    pub(super) auto_call_out_1000_ft: DiscreteParameter,
    pub(super) auto_call_out_500_ft: DiscreteParameter,
    pub(super) auto_call_out_500_ft_glide_deviation: DiscreteParameter,
    pub(super) auto_call_out_400_ft: DiscreteParameter,
    pub(super) auto_call_out_300_ft: DiscreteParameter,
    pub(super) auto_call_out_200_ft: DiscreteParameter,
    pub(super) auto_call_out_100_ft: DiscreteParameter,
    pub(super) auto_call_out_50_ft: DiscreteParameter,
    pub(super) auto_call_out_40_ft: DiscreteParameter,
    pub(super) auto_call_out_30_ft: DiscreteParameter,
    pub(super) auto_call_out_20_ft: DiscreteParameter,
    pub(super) auto_call_out_10_ft: DiscreteParameter,
    pub(super) auto_call_out_5_ft: DiscreteParameter,
    pub(super) glide_deviation_1: Arinc429Parameter<Ratio>,
    pub(super) glide_deviation_2: Arinc429Parameter<Ratio>,
    pub(super) land_trk_mode_on_1: Arinc429Parameter<bool>,
    pub(super) land_trk_mode_on_2: Arinc429Parameter<bool>,
    pub(super) capt_mode_on_1: Arinc429Parameter<bool>,
    pub(super) capt_mode_on_2: Arinc429Parameter<bool>,
    pub(super) track_mode_on_1: Arinc429Parameter<bool>,
    pub(super) track_mode_on_2: Arinc429Parameter<bool>,
    pub(super) final_descent_mode_on_1: Arinc429Parameter<bool>,
    pub(super) final_descent_mode_on_2: Arinc429Parameter<bool>,
    pub(super) athr_engaged: Arinc429Parameter<bool>,
    pub(super) synthetic_voice_synchronization_in: DiscreteParameter,
}

impl A320FwcParameterTable {
    pub fn new() -> Self {
        Self {
            fwc_ident_side1: DiscreteParameter::new(false),
            fwc_ident_side2: DiscreteParameter::new(false),
            lh_lg_compressed_1: Arinc429Parameter::new_inv(false),
            lh_lg_compressed_2: Arinc429Parameter::new_inv(false),
            ess_lh_lg_compressed: DiscreteParameter::new(false),
            norm_lh_lg_compressed: DiscreteParameter::new(false),
            lh_gear_down_lock_1: Arinc429Parameter::new_inv(false),
            lh_gear_down_lock_2: Arinc429Parameter::new_inv(false),
            rh_gear_down_lock_1: Arinc429Parameter::new_inv(false),
            rh_gear_down_lock_2: Arinc429Parameter::new_inv(false),
            nose_gear_down_lock_1: Arinc429Parameter::new_inv(false),
            nose_gear_down_lock_2: Arinc429Parameter::new_inv(false),
            radio_height_1: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            radio_height_2: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            computed_speed_1: Arinc429Parameter::new_inv(Velocity::new::<knot>(0.0)),
            computed_speed_2: Arinc429Parameter::new_inv(Velocity::new::<knot>(0.0)),
            computed_speed_3: Arinc429Parameter::new_inv(Velocity::new::<knot>(0.0)),
            eng1_master_lever_select_on: Arinc429Parameter::new_inv(false),
            eng2_master_lever_select_on: Arinc429Parameter::new_inv(false),
            eng1_master_lever_select_off: Arinc429Parameter::new_inv(false),
            eng2_master_lever_select_off: Arinc429Parameter::new_inv(false),
            eng1_core_speed_at_or_above_idle_a: Arinc429Parameter::new_inv(false),
            eng1_core_speed_at_or_above_idle_b: Arinc429Parameter::new_inv(false),
            eng2_core_speed_at_or_above_idle_a: Arinc429Parameter::new_inv(false),
            eng2_core_speed_at_or_above_idle_b: Arinc429Parameter::new_inv(false),
            eng_1_fire_pb_out: DiscreteParameter::new(false),
            eng_2_fire_pb_out: DiscreteParameter::new(false),
            to_config_test: Arinc429Parameter::new_inv(false),
            eng1_tla_a: Arinc429Parameter::new_inv(Angle::new::<degree>(0.0)),
            eng1_tla_b: Arinc429Parameter::new_inv(Angle::new::<degree>(0.0)),
            eng2_tla_a: Arinc429Parameter::new_inv(Angle::new::<degree>(0.0)),
            eng2_tla_b: Arinc429Parameter::new_inv(Angle::new::<degree>(0.0)),
            eng1_tla_fto_a: Arinc429Parameter::new_inv(false),
            eng1_tla_fto_b: Arinc429Parameter::new_inv(false),
            eng2_tla_fto_a: Arinc429Parameter::new_inv(false),
            eng2_tla_fto_b: Arinc429Parameter::new_inv(false),
            eng1_n1_selected_actual_a: Arinc429Parameter::new_inv(Ratio::new::<percent>(0.0)),
            eng1_n1_selected_actual_b: Arinc429Parameter::new_inv(Ratio::new::<percent>(0.0)),
            eng2_n1_selected_actual_a: Arinc429Parameter::new_inv(Ratio::new::<percent>(0.0)),
            eng2_n1_selected_actual_b: Arinc429Parameter::new_inv(Ratio::new::<percent>(0.0)),
            tla1_idle_pwr_a: Arinc429Parameter::new_inv(false),
            tla1_idle_pwr_b: Arinc429Parameter::new_inv(false),
            tla2_idle_pwr_a: Arinc429Parameter::new_inv(false),
            tla2_idle_pwr_b: Arinc429Parameter::new_inv(false),
            eng1_channel_a_in_control: Arinc429Parameter::new_inv(false),
            eng1_channel_b_in_control: Arinc429Parameter::new_inv(false),
            eng2_channel_a_in_control: Arinc429Parameter::new_inv(false),
            eng2_channel_b_in_control: Arinc429Parameter::new_inv(false),
            eng_1_auto_toga_a: Arinc429Parameter::new_inv(false),
            eng_1_auto_toga_b: Arinc429Parameter::new_inv(false),
            eng_2_auto_toga_a: Arinc429Parameter::new_inv(false),
            eng_2_auto_toga_b: Arinc429Parameter::new_inv(false),
            eng_1_limit_mode_soft_ga_a: Arinc429Parameter::new_inv(false),
            eng_1_limit_mode_soft_ga_b: Arinc429Parameter::new_inv(false),
            eng_2_limit_mode_soft_ga_a: Arinc429Parameter::new_inv(false),
            eng_2_limit_mode_soft_ga_b: Arinc429Parameter::new_inv(false),
            dmc_1_adc_transfer_coding_bit_13: Arinc429Parameter::new_inv(false),
            dmc_1_adc_transfer_coding_bit_14: Arinc429Parameter::new_inv(false),
            dmc_2_adc_transfer_coding_bit_13: Arinc429Parameter::new_inv(false),
            dmc_2_adc_transfer_coding_bit_14: Arinc429Parameter::new_inv(false),
            dmc_1_baro_ref_coding_bit_11: Arinc429Parameter::new_inv(false),
            dmc_1_baro_ref_coding_bit_12: Arinc429Parameter::new_inv(false),
            dmc_2_baro_ref_coding_bit_11: Arinc429Parameter::new_inv(false),
            dmc_2_baro_ref_coding_bit_12: Arinc429Parameter::new_inv(false),
            altitude_1: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            altitude_2: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            altitude_3: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            capt_corrected_altitude_1: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            capt_corrected_altitude_2: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            capt_corrected_altitude_3: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            fo_corrected_altitude_1: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            fo_corrected_altitude_2: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            fo_corrected_altitude_3: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            alti_select: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            alti_select_chg: Arinc429Parameter::new_inv(false),
            ap1_engd_com: DiscreteParameter::new(false),
            ap1_engd_mon: DiscreteParameter::new(false),
            ap2_engd_com: DiscreteParameter::new(false),
            ap2_engd_mon: DiscreteParameter::new(false),
            instinc_discnct_1ap_engd: DiscreteParameter::new(false),
            instinc_discnct_2ap_engd: DiscreteParameter::new(false),
            capt_mw_cancel_on: DiscreteParameter::new(false),
            fo_mw_cancel_on: DiscreteParameter::new(false),
            capt_mc_cancel_on: DiscreteParameter::new(false),
            fo_mc_cancel_on: DiscreteParameter::new(false),
            rcl: Arinc429Parameter::new_inv(false),
            ecp_emer_cancel_on: DiscreteParameter::new(false),
            ecp_clear: DiscreteParameter::new(false),
            ecp_recall: DiscreteParameter::new(false),
            ecp_status: DiscreteParameter::new(false),
            blue_sys_lo_pr: DiscreteParameter::new(false),
            yellow_sys_lo_pr: DiscreteParameter::new(false),
            green_sys_lo_pr: DiscreteParameter::new(false),
            tcas_engaged: Arinc429Parameter::new_inv(false),
            gs_mode_on_1: Arinc429Parameter::new_inv(false),
            gs_mode_on_2: Arinc429Parameter::new_inv(false),
            gpws_modes_on: DiscreteParameter::new(false),
            gs_visual_alert_on: DiscreteParameter::new(false),
            tcas_aural_advisory_output: DiscreteParameter::new(false),
            decision_height_1: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            decision_height_2: Arinc429Parameter::new_inv(Length::new::<foot>(0.0)),
            hundred_above_for_mda_mdh_request_1: Arinc429Parameter::new_inv(false),
            hundred_above_for_mda_mdh_request_2: Arinc429Parameter::new_inv(false),
            minimum_for_mda_mdh_request_1: Arinc429Parameter::new_inv(false),
            minimum_for_mda_mdh_request_2: Arinc429Parameter::new_inv(false),
            capt_side_stick_inop_1: Arinc429Parameter::new_inv(false),
            capt_side_stick_inop_2: Arinc429Parameter::new_inv(false),
            fo_side_stick_inop_1: Arinc429Parameter::new_inv(false),
            fo_side_stick_inop_2: Arinc429Parameter::new_inv(false),
            decision_height_code_a: DiscreteParameter::new(true), // TODO
            decision_height_code_b: DiscreteParameter::new(true), // TODO
            decision_height_plus_100_ft_code_a: DiscreteParameter::new(true), // TODO
            decision_height_plus_100_ft_code_b: DiscreteParameter::new(true), // TODO
            auto_call_out_2500_ft: DiscreteParameter::new(true),  // TODO
            auto_call_out_2500b: DiscreteParameter::new(false),   // TODO
            auto_call_out_2000_ft: DiscreteParameter::new(true),  // TODO
            auto_call_out_1000_ft: DiscreteParameter::new(true),  // TODO
            auto_call_out_500_ft: DiscreteParameter::new(true),   // TODO
            auto_call_out_500_ft_glide_deviation: DiscreteParameter::new(false), // TODO
            auto_call_out_400_ft: DiscreteParameter::new(true),   // TODO
            auto_call_out_300_ft: DiscreteParameter::new(true),   // TODO
            auto_call_out_200_ft: DiscreteParameter::new(true),   // TODO
            auto_call_out_100_ft: DiscreteParameter::new(true),   // TODO
            auto_call_out_50_ft: DiscreteParameter::new(true),    // TODO
            auto_call_out_40_ft: DiscreteParameter::new(true),    // TODO
            auto_call_out_30_ft: DiscreteParameter::new(true),    // TODO
            auto_call_out_20_ft: DiscreteParameter::new(true),    // TODO
            auto_call_out_10_ft: DiscreteParameter::new(true),    // TODO
            auto_call_out_5_ft: DiscreteParameter::new(true),     // TODO
            glide_deviation_1: Arinc429Parameter::new_inv(Ratio::new::<ratio>(0.0)),
            glide_deviation_2: Arinc429Parameter::new_inv(Ratio::new::<ratio>(0.0)),
            land_trk_mode_on_1: Arinc429Parameter::new_inv(false),
            land_trk_mode_on_2: Arinc429Parameter::new_inv(false),
            capt_mode_on_1: Arinc429Parameter::new_inv(false),
            capt_mode_on_2: Arinc429Parameter::new_inv(false),
            track_mode_on_1: Arinc429Parameter::new_inv(false),
            track_mode_on_2: Arinc429Parameter::new_inv(false),
            final_descent_mode_on_1: Arinc429Parameter::new_inv(false),
            final_descent_mode_on_2: Arinc429Parameter::new_inv(false),
            athr_engaged: Arinc429Parameter::new_inv(false),
            synthetic_voice_synchronization_in: DiscreteParameter::new(false),
        }
    }
}

impl FwcIdentSide1 for A320FwcParameterTable {
    fn fwc_ident_side1(&self) -> &DiscreteParameter {
        &self.fwc_ident_side1
    }
}

impl FwcIdentSide2 for A320FwcParameterTable {
    fn fwc_ident_side2(&self) -> &DiscreteParameter {
        &self.fwc_ident_side2
    }
}

impl LhLgCompressed for A320FwcParameterTable {
    fn lh_lg_compressed(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.lh_lg_compressed_1,
            2 => &self.lh_lg_compressed_2,
            _ => panic!(),
        }
    }
}

impl EssLhLgCompressed for A320FwcParameterTable {
    fn ess_lh_lg_compressed(&self) -> &DiscreteParameter {
        &self.ess_lh_lg_compressed
    }
}

impl NormLhLgCompressed for A320FwcParameterTable {
    fn norm_lh_lg_compressed(&self) -> &DiscreteParameter {
        &self.norm_lh_lg_compressed
    }
}

impl LhGearDownLock for A320FwcParameterTable {
    fn lh_gear_down_lock(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.lh_gear_down_lock_1,
            2 => &self.lh_gear_down_lock_2,
            _ => panic!(),
        }
    }
}

impl RhGearDownLock for A320FwcParameterTable {
    fn rh_gear_down_lock(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.rh_gear_down_lock_1,
            2 => &self.rh_gear_down_lock_2,
            _ => panic!(),
        }
    }
}

impl NoseGearDownLock for A320FwcParameterTable {
    fn nose_gear_down_lock(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.nose_gear_down_lock_1,
            2 => &self.nose_gear_down_lock_2,
            _ => panic!(),
        }
    }
}

impl RadioHeight for A320FwcParameterTable {
    fn radio_height(&self, number: u8) -> &Arinc429Parameter<Length> {
        match number {
            1 => &self.radio_height_1,
            2 => &self.radio_height_2,
            _ => panic!(),
        }
    }
}

impl ComputedSpeed for A320FwcParameterTable {
    fn computed_speed(&self, number: u8) -> &Arinc429Parameter<Velocity> {
        match number {
            1 => &self.computed_speed_1,
            2 => &self.computed_speed_2,
            3 => &self.computed_speed_3,
            _ => panic!(),
        }
    }
}

impl Eng1MasterLeverSelect for A320FwcParameterTable {
    fn eng1_master_lever_select_on(&self) -> &Arinc429Parameter<bool> {
        &self.eng1_master_lever_select_on
    }

    fn eng1_master_lever_select_off(&self) -> &Arinc429Parameter<bool> {
        &self.eng1_master_lever_select_off
    }
}

impl Eng2MasterLeverSelect for A320FwcParameterTable {
    fn eng2_master_lever_select_on(&self) -> &Arinc429Parameter<bool> {
        &self.eng2_master_lever_select_on
    }

    fn eng2_master_lever_select_off(&self) -> &Arinc429Parameter<bool> {
        &self.eng2_master_lever_select_off
    }
}

impl Eng1CoreSpeedAtOrAboveIdle for A320FwcParameterTable {
    fn eng1_core_speed_at_or_above_idle(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng1_core_speed_at_or_above_idle_a,
            2 => &self.eng1_core_speed_at_or_above_idle_b,
            _ => panic!(),
        }
    }
}

impl Eng2CoreSpeedAtOrAboveIdle for A320FwcParameterTable {
    fn eng2_core_speed_at_or_above_idle(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng2_core_speed_at_or_above_idle_a,
            2 => &self.eng2_core_speed_at_or_above_idle_b,
            _ => panic!(),
        }
    }
}

impl Eng1FirePbOut for A320FwcParameterTable {
    fn eng_1_fire_pb_out(&self) -> &DiscreteParameter {
        &self.eng_1_fire_pb_out
    }
}

impl Eng2FirePbOut for A320FwcParameterTable {
    fn eng_2_fire_pb_out(&self) -> &DiscreteParameter {
        &self.eng_2_fire_pb_out
    }
}

impl ToConfigTest for A320FwcParameterTable {
    fn to_config_test(&self) -> &Arinc429Parameter<bool> {
        &self.to_config_test
    }
}

impl Eng1TlaCfm for A320FwcParameterTable {
    fn eng1_tla(&self, channel: u8) -> &Arinc429Parameter<Angle> {
        match channel {
            1 => &self.eng1_tla_a,
            2 => &self.eng1_tla_b,
            _ => panic!(),
        }
    }
}

impl Eng2TlaCfm for A320FwcParameterTable {
    fn eng2_tla(&self, channel: u8) -> &Arinc429Parameter<Angle> {
        match channel {
            1 => &self.eng2_tla_a,
            2 => &self.eng2_tla_b,
            _ => panic!(),
        }
    }
}

impl Eng1TlaFto for A320FwcParameterTable {
    fn eng1_tla_fto(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng1_tla_fto_a,
            2 => &self.eng1_tla_fto_b,
            _ => panic!(),
        }
    }
}

impl Eng2TlaFto for A320FwcParameterTable {
    fn eng2_tla_fto(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng2_tla_fto_a,
            2 => &self.eng2_tla_fto_b,
            _ => panic!(),
        }
    }
}

impl Eng1N1SelectedActual for A320FwcParameterTable {
    fn eng1_n1_selected_actual(&self, channel: u8) -> &Arinc429Parameter<Ratio> {
        match channel {
            1 => &self.eng1_n1_selected_actual_a,
            2 => &self.eng1_n1_selected_actual_b,
            _ => panic!(),
        }
    }
}

impl Eng2N1SelectedActual for A320FwcParameterTable {
    fn eng2_n1_selected_actual(&self, channel: u8) -> &Arinc429Parameter<Ratio> {
        match channel {
            1 => &self.eng2_n1_selected_actual_a,
            2 => &self.eng2_n1_selected_actual_b,
            _ => panic!(),
        }
    }
}

impl Tla1IdlePwr for A320FwcParameterTable {
    fn tla1_idle_pwr(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.tla1_idle_pwr_a,
            2 => &self.tla1_idle_pwr_b,
            _ => panic!(),
        }
    }
}

impl Tla2IdlePwr for A320FwcParameterTable {
    fn tla2_idle_pwr(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.tla2_idle_pwr_a,
            2 => &self.tla2_idle_pwr_b,
            _ => panic!(),
        }
    }
}

impl Eng1ChannelInControl for A320FwcParameterTable {
    fn eng1_channel_a_in_control(&self) -> &Arinc429Parameter<bool> {
        &self.eng1_channel_a_in_control
    }

    fn eng1_channel_b_in_control(&self) -> &Arinc429Parameter<bool> {
        &self.eng1_channel_b_in_control
    }
}

impl Eng2ChannelInControl for A320FwcParameterTable {
    fn eng2_channel_a_in_control(&self) -> &Arinc429Parameter<bool> {
        &self.eng2_channel_a_in_control
    }

    fn eng2_channel_b_in_control(&self) -> &Arinc429Parameter<bool> {
        &self.eng2_channel_b_in_control
    }
}

impl Eng1AutoToga for A320FwcParameterTable {
    fn eng_1_auto_toga(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng_1_auto_toga_a,
            2 => &self.eng_1_auto_toga_b,
            _ => panic!(),
        }
    }
}

impl Eng2AutoToga for A320FwcParameterTable {
    fn eng_2_auto_toga(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng_2_auto_toga_a,
            2 => &self.eng_2_auto_toga_b,
            _ => panic!(),
        }
    }
}

impl Eng1LimitModeSoftGa for A320FwcParameterTable {
    fn eng_1_limit_mode_soft_ga(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng_1_limit_mode_soft_ga_a,
            2 => &self.eng_1_limit_mode_soft_ga_b,
            _ => panic!(),
        }
    }
}

impl Eng2LimitModeSoftGa for A320FwcParameterTable {
    fn eng_2_limit_mode_soft_ga(&self, channel: u8) -> &Arinc429Parameter<bool> {
        match channel {
            1 => &self.eng_2_limit_mode_soft_ga_a,
            2 => &self.eng_2_limit_mode_soft_ga_b,
            _ => panic!(),
        }
    }
}

impl AdcTransferCoding for A320FwcParameterTable {
    fn adc_transfer_coding(&self, dmc: u8, bit: u8) -> &Arinc429Parameter<bool> {
        match dmc {
            1 => match bit {
                13 => &self.dmc_1_adc_transfer_coding_bit_13,
                14 => &self.dmc_1_adc_transfer_coding_bit_14,
                _ => panic!(),
            },
            2 => match bit {
                13 => &self.dmc_2_adc_transfer_coding_bit_13,
                14 => &self.dmc_2_adc_transfer_coding_bit_14,
                _ => panic!(),
            },
            _ => panic!(),
        }
    }
}

impl BaroRefCoding for A320FwcParameterTable {
    fn baro_ref_coding(&self, dmc: u8, bit: u8) -> &Arinc429Parameter<bool> {
        match dmc {
            1 => match bit {
                11 => &self.dmc_1_baro_ref_coding_bit_11,
                12 => &self.dmc_1_baro_ref_coding_bit_12,
                _ => panic!(),
            },
            2 => match bit {
                11 => &self.dmc_2_baro_ref_coding_bit_11,
                12 => &self.dmc_2_baro_ref_coding_bit_12,
                _ => panic!(),
            },
            _ => panic!(),
        }
    }
}

impl AltitudeParameter for A320FwcParameterTable {
    fn altitude(&self, number: u8) -> &Arinc429Parameter<Length> {
        match number {
            1 => &self.altitude_1,
            2 => &self.altitude_2,
            3 => &self.altitude_3,
            _ => panic!(),
        }
    }
}

impl CaptCorrectedAltitudeParameter for A320FwcParameterTable {
    fn capt_corrected_altitude(&self, number: u8) -> &Arinc429Parameter<Length> {
        match number {
            1 => &self.capt_corrected_altitude_1,
            2 => &self.capt_corrected_altitude_2,
            3 => &self.capt_corrected_altitude_3,
            _ => panic!(),
        }
    }
}

impl FoCorrectedAltitudeParameter for A320FwcParameterTable {
    fn fo_corrected_altitude(&self, number: u8) -> &Arinc429Parameter<Length> {
        match number {
            1 => &self.fo_corrected_altitude_1,
            2 => &self.fo_corrected_altitude_2,
            3 => &self.fo_corrected_altitude_3,
            _ => panic!(),
        }
    }
}

impl AltiSelect for A320FwcParameterTable {
    fn alti_select(&self) -> &Arinc429Parameter<Length> {
        &self.alti_select
    }
}

impl AltSelectChg for A320FwcParameterTable {
    fn alt_select_chg(&self) -> &Arinc429Parameter<bool> {
        &self.alti_select_chg
    }
}

impl Ap1Engd for A320FwcParameterTable {
    fn ap1_engd_com(&self) -> &DiscreteParameter {
        &self.ap1_engd_com
    }

    fn ap1_engd_mon(&self) -> &DiscreteParameter {
        &self.ap1_engd_mon
    }
}

impl Ap2Engd for A320FwcParameterTable {
    fn ap2_engd_com(&self) -> &DiscreteParameter {
        &self.ap2_engd_com
    }

    fn ap2_engd_mon(&self) -> &DiscreteParameter {
        &self.ap2_engd_mon
    }
}

impl InstincDiscnct1ApEngd for A320FwcParameterTable {
    fn instinc_discnct_1ap_engd(&self) -> &DiscreteParameter {
        &self.instinc_discnct_1ap_engd
    }
}

impl InstincDiscnct2ApEngd for A320FwcParameterTable {
    fn instinc_discnct_2ap_engd(&self) -> &DiscreteParameter {
        &self.instinc_discnct_2ap_engd
    }
}

impl CaptMwCancelOn for A320FwcParameterTable {
    fn capt_mw_cancel_on(&self) -> &DiscreteParameter {
        &self.capt_mw_cancel_on
    }
}

impl FoMwCancelOn for A320FwcParameterTable {
    fn fo_mw_cancel_on(&self) -> &DiscreteParameter {
        &self.fo_mw_cancel_on
    }
}

impl CaptMcCancelOn for A320FwcParameterTable {
    fn capt_mc_cancel_on(&self) -> &DiscreteParameter {
        &self.capt_mc_cancel_on
    }
}

impl FoMcCancelOn for A320FwcParameterTable {
    fn fo_mc_cancel_on(&self) -> &DiscreteParameter {
        &self.fo_mc_cancel_on
    }
}

impl Rcl for A320FwcParameterTable {
    fn rcl(&self) -> &Arinc429Parameter<bool> {
        &self.rcl
    }
}

impl EcpRecall for A320FwcParameterTable {
    fn ecp_recall(&self) -> &DiscreteParameter {
        &self.ecp_recall
    }
}

impl BlueSysLoPr for A320FwcParameterTable {
    fn blue_sys_lo_pr(&self) -> &DiscreteParameter {
        &self.blue_sys_lo_pr
    }
}

impl YellowSysLoPr for A320FwcParameterTable {
    fn yellow_sys_lo_pr(&self) -> &DiscreteParameter {
        &self.yellow_sys_lo_pr
    }
}

impl GreenSysLoPr for A320FwcParameterTable {
    fn green_sys_lo_pr(&self) -> &DiscreteParameter {
        &self.green_sys_lo_pr
    }
}

impl TcasEngaged for A320FwcParameterTable {
    fn tcas_engaged(&self) -> &Arinc429Parameter<bool> {
        &self.tcas_engaged
    }
}

impl GsModeOn for A320FwcParameterTable {
    fn gs_mode_on(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.gs_mode_on_1,
            2 => &self.gs_mode_on_2,
            _ => panic!(),
        }
    }
}

impl GpwsModesOn for A320FwcParameterTable {
    fn gpws_modes_on(&self) -> &DiscreteParameter {
        &self.gpws_modes_on
    }
}

impl GsVisualAlertOn for A320FwcParameterTable {
    fn gs_visual_alert_on(&self) -> &DiscreteParameter {
        &self.gs_visual_alert_on
    }
}

impl TcasAuralAdvisaryOutput for A320FwcParameterTable {
    fn tcas_aural_advisory_output(&self) -> &DiscreteParameter {
        &self.tcas_aural_advisory_output
    }
}

impl DecisionHeight for A320FwcParameterTable {
    fn decision_height(&self, number: u8) -> &Arinc429Parameter<Length> {
        match number {
            1 => &self.decision_height_1,
            2 => &self.decision_height_2,
            _ => panic!(),
        }
    }
}

impl HundredAboveForMdaMdhRequest for A320FwcParameterTable {
    fn hundred_above_for_mda_mdh_request(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.hundred_above_for_mda_mdh_request_1,
            2 => &self.hundred_above_for_mda_mdh_request_2,
            _ => panic!(),
        }
    }
}

impl MinimumForMdaMdhRequest for A320FwcParameterTable {
    fn minimum_for_mda_mdh_request(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.minimum_for_mda_mdh_request_1,
            2 => &self.minimum_for_mda_mdh_request_2,
            _ => panic!(),
        }
    }
}

impl CaptSideStickInop for A320FwcParameterTable {
    fn capt_side_stick_inop(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.capt_side_stick_inop_1,
            2 => &self.capt_side_stick_inop_2,
            _ => panic!(),
        }
    }
}

impl FoSideStickInop for A320FwcParameterTable {
    fn fo_side_stick_inop(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.fo_side_stick_inop_1,
            2 => &self.fo_side_stick_inop_2,
            _ => panic!(),
        }
    }
}

impl AutoCalloutPins for A320FwcParameterTable {
    /// TODO move to vars

    fn decision_height_code_a(&self) -> &DiscreteParameter {
        &self.decision_height_code_a
    }

    fn decision_height_code_b(&self) -> &DiscreteParameter {
        &self.decision_height_code_b
    }

    fn decision_height_plus_100_ft_code_a(&self) -> &DiscreteParameter {
        &self.decision_height_plus_100_ft_code_a
    }

    fn decision_height_plus_100_ft_code_b(&self) -> &DiscreteParameter {
        &self.decision_height_plus_100_ft_code_b
    }

    fn auto_call_out_2500_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_2500_ft
    }

    fn auto_call_out_2500b(&self) -> &DiscreteParameter {
        &self.auto_call_out_2500b
    }

    fn auto_call_out_2000_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_2000_ft
    }

    fn auto_call_out_1000_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_1000_ft
    }

    fn auto_call_out_500_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_500_ft
    }

    fn auto_call_out_500_ft_glide_deviation(&self) -> &DiscreteParameter {
        &self.auto_call_out_500_ft_glide_deviation
    }

    fn auto_call_out_400_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_400_ft
    }

    fn auto_call_out_300_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_300_ft
    }

    fn auto_call_out_200_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_200_ft
    }

    fn auto_call_out_100_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_100_ft
    }

    fn auto_call_out_50_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_50_ft
    }

    fn auto_call_out_40_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_40_ft
    }

    fn auto_call_out_30_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_30_ft
    }

    fn auto_call_out_20_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_20_ft
    }

    fn auto_call_out_10_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_10_ft
    }

    fn auto_call_out_5_ft(&self) -> &DiscreteParameter {
        &self.auto_call_out_5_ft
    }
}

impl GlideDeviation for A320FwcParameterTable {
    fn glide_deviation(&self, number: u8) -> &Arinc429Parameter<Ratio> {
        match number {
            1 => &self.glide_deviation_1,
            2 => &self.glide_deviation_2,
            _ => panic!(),
        }
    }
}

impl LandTrkModeOn for A320FwcParameterTable {
    fn land_trk_mode_on(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.land_trk_mode_on_1,
            2 => &self.land_trk_mode_on_2,
            _ => panic!(),
        }
    }
}

impl CaptModeOn for A320FwcParameterTable {
    fn capt_mode_on(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.capt_mode_on_1,
            2 => &self.capt_mode_on_2,
            _ => panic!(),
        }
    }
}

impl TrackModeOn for A320FwcParameterTable {
    fn track_mode_on(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.track_mode_on_1,
            2 => &self.track_mode_on_2,
            _ => panic!(),
        }
    }
}

impl FinalDescentModeOn for A320FwcParameterTable {
    fn final_descent_mode_on(&self, number: u8) -> &Arinc429Parameter<bool> {
        match number {
            1 => &self.final_descent_mode_on_1,
            2 => &self.final_descent_mode_on_2,
            _ => panic!(),
        }
    }
}

impl AThrEngaged for A320FwcParameterTable {
    fn athr_engaged(&self) -> &Arinc429Parameter<bool> {
        &self.athr_engaged
    }
}

impl SyntheticVoiceSynchronizationIn for A320FwcParameterTable {
    fn synthetic_voice_synchronization_in(&self) -> &DiscreteParameter {
        &self.synthetic_voice_synchronization_in
    }
}
