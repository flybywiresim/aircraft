use crate::flight_warning::input::A320FwcInputs;
use crate::flight_warning::runtime::parameters::A320FwcParameterTable;
use std::time::Duration;
use systems::flight_warning::acquisition::{
    Arinc429Acquisition, DiscreteAcquisition, DiscreteInputType, ReadBit,
};
use systems::flight_warning::parameters::DiscreteParameter;
use uom::si::f64::{Angle, Length, Ratio, Velocity};

pub(super) struct A320FwcAcquisition {
    fwc_ident_side1: DiscreteAcquisition,
    fwc_ident_side2: DiscreteAcquisition,
    ess_lh_lg_compressed: DiscreteAcquisition,
    norm_lh_lg_compressed: DiscreteAcquisition,
    blue_sys_lo_pr: DiscreteAcquisition,
    yellow_sys_lo_pr: DiscreteAcquisition,
    green_sys_lo_pr: DiscreteAcquisition,
    ap1_engd_com: DiscreteAcquisition,
    ap1_engd_mon: DiscreteAcquisition,
    ap2_engd_com: DiscreteAcquisition,
    ap2_engd_mon: DiscreteAcquisition,
    mw_cancel_on_capt: DiscreteAcquisition,
    mw_cancel_on_fo: DiscreteAcquisition,
    mc_cancel_on_capt: DiscreteAcquisition,
    mc_cancel_on_fo: DiscreteAcquisition,
    ecp_emer_cancel_on: DiscreteAcquisition,
    ecp_clear: DiscreteAcquisition,
    ecp_recall: DiscreteAcquisition,
    ecp_status: DiscreteAcquisition,
    eng1_fire_pb_out: DiscreteAcquisition,
    eng2_fire_pb_out: DiscreteAcquisition,
    gpws_modes_on: DiscreteAcquisition,
    gs_visual_alert_on: DiscreteAcquisition,
    tcas_aural_advisory_output: DiscreteAcquisition,
    synthetic_voice_synchronization: DiscreteAcquisition,
    auto_call_out_2500_ft: DiscreteAcquisition,
    auto_call_out_2500b: DiscreteAcquisition,
    auto_call_out_2000_ft: DiscreteAcquisition,
    auto_call_out_1000_ft: DiscreteAcquisition,
    auto_call_out_500_ft: DiscreteAcquisition,
    auto_call_out_500_ft_glide_deviation: DiscreteAcquisition,
    auto_call_out_400_ft: DiscreteAcquisition,
    auto_call_out_300_ft: DiscreteAcquisition,
    auto_call_out_200_ft: DiscreteAcquisition,
    auto_call_out_100_ft: DiscreteAcquisition,
    auto_call_out_50_ft: DiscreteAcquisition,
    auto_call_out_40_ft: DiscreteAcquisition,
    auto_call_out_30_ft: DiscreteAcquisition,
    auto_call_out_20_ft: DiscreteAcquisition,
    auto_call_out_10_ft: DiscreteAcquisition,
    auto_call_out_5_ft: DiscreteAcquisition,
    ecp_warning_switches_word: Arinc429Acquisition<u32>,
    lgciu_1_discrete_word_1: Arinc429Acquisition<u32>,
    lgciu_2_discrete_word_1: Arinc429Acquisition<u32>,
    lgciu_1_discrete_word_2: Arinc429Acquisition<u32>,
    lgciu_2_discrete_word_2: Arinc429Acquisition<u32>,
    radio_height_1: Arinc429Acquisition<Length>,
    radio_height_2: Arinc429Acquisition<Length>,
    computed_speed_1: Arinc429Acquisition<Velocity>,
    computed_speed_2: Arinc429Acquisition<Velocity>,
    computed_speed_3: Arinc429Acquisition<Velocity>,
    altitude_1: Arinc429Acquisition<Length>,
    altitude_2: Arinc429Acquisition<Length>,
    altitude_3: Arinc429Acquisition<Length>,
    capt_corrected_altitude_1: Arinc429Acquisition<Length>,
    capt_corrected_altitude_2: Arinc429Acquisition<Length>,
    capt_corrected_altitude_3: Arinc429Acquisition<Length>,
    fo_corrected_altitude_1: Arinc429Acquisition<Length>,
    fo_corrected_altitude_2: Arinc429Acquisition<Length>,
    fo_corrected_altitude_3: Arinc429Acquisition<Length>,
    mmr_1_glide_slope_deviation: Arinc429Acquisition<Ratio>,
    mmr_2_glide_slope_deviation: Arinc429Acquisition<Ratio>,
    eiu_1_word_031: Arinc429Acquisition<u32>,
    eiu_2_word_031: Arinc429Acquisition<u32>,
    ecu_1a_tla: Arinc429Acquisition<Angle>,
    ecu_1b_tla: Arinc429Acquisition<Angle>,
    ecu_2a_tla: Arinc429Acquisition<Angle>,
    ecu_2b_tla: Arinc429Acquisition<Angle>,
    ecu_1a_status_word_1: Arinc429Acquisition<u32>,
    ecu_1b_status_word_1: Arinc429Acquisition<u32>,
    ecu_2a_status_word_1: Arinc429Acquisition<u32>,
    ecu_2b_status_word_1: Arinc429Acquisition<u32>,
    ecu_1a_status_word_3: Arinc429Acquisition<u32>,
    ecu_1b_status_word_3: Arinc429Acquisition<u32>,
    ecu_2a_status_word_3: Arinc429Acquisition<u32>,
    ecu_2b_status_word_3: Arinc429Acquisition<u32>,
    ecu_1a_word_272: Arinc429Acquisition<u32>,
    ecu_1b_word_272: Arinc429Acquisition<u32>,
    ecu_2a_word_272: Arinc429Acquisition<u32>,
    ecu_2b_word_272: Arinc429Acquisition<u32>,
    fcdc_1_discrete_word_2: Arinc429Acquisition<u32>,
    fcdc_2_discrete_word_2: Arinc429Acquisition<u32>,
    fcu_ats_discrete_word: Arinc429Acquisition<u32>,
    fcu_discrete_word_1: Arinc429Acquisition<u32>,
    fcu_ap_tcas_word: Arinc429Acquisition<u32>,
    fcu_selected_altitude_word: Arinc429Acquisition<Length>,
    fmgc_1_discrete_word_1: Arinc429Acquisition<u32>,
    fmgc_2_discrete_word_1: Arinc429Acquisition<u32>,
    fmgc_1_discrete_word_4: Arinc429Acquisition<u32>,
    fmgc_2_discrete_word_4: Arinc429Acquisition<u32>,
    dmc_1_decision_height_word: Arinc429Acquisition<Length>,
    dmc_2_decision_height_word: Arinc429Acquisition<Length>,
    dmc_1_discrete_status_word_270: Arinc429Acquisition<u32>,
    dmc_2_discrete_status_word_270: Arinc429Acquisition<u32>,
    dmc_1_discrete_status_word_272: Arinc429Acquisition<u32>,
    dmc_2_discrete_status_word_272: Arinc429Acquisition<u32>,
    dmc_1_discrete_status_word_350: Arinc429Acquisition<u32>,
    dmc_2_discrete_status_word_350: Arinc429Acquisition<u32>,
}

impl Default for A320FwcAcquisition {
    fn default() -> Self {
        Self {
            fwc_ident_side1: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            fwc_ident_side2: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ess_lh_lg_compressed: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            norm_lh_lg_compressed: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            blue_sys_lo_pr: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            yellow_sys_lo_pr: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            green_sys_lo_pr: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ap1_engd_com: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ap1_engd_mon: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ap2_engd_com: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ap2_engd_mon: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            mw_cancel_on_capt: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            mw_cancel_on_fo: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            mc_cancel_on_capt: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            mc_cancel_on_fo: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            eng1_fire_pb_out: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            eng2_fire_pb_out: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            gpws_modes_on: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            gs_visual_alert_on: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            tcas_aural_advisory_output: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            synthetic_voice_synchronization: DiscreteAcquisition::new(DiscreteInputType::IpMinus),

            auto_call_out_2500_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_2500b: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_2000_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_1000_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_500_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_500_ft_glide_deviation: DiscreteAcquisition::new(
                DiscreteInputType::IpMinus,
            ),
            auto_call_out_400_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_300_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_200_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_100_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_50_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_40_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_30_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_20_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_10_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            auto_call_out_5_ft: DiscreteAcquisition::new(DiscreteInputType::IpMinus),

            ecp_warning_switches_word: Arinc429Acquisition::new(Duration::from_millis(60)),
            ecp_emer_cancel_on: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ecp_clear: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ecp_recall: DiscreteAcquisition::new(DiscreteInputType::IpMinus),
            ecp_status: DiscreteAcquisition::new(DiscreteInputType::IpMinus),

            lgciu_1_discrete_word_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            lgciu_2_discrete_word_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            lgciu_1_discrete_word_2: Arinc429Acquisition::new(Duration::from_millis(60)),
            lgciu_2_discrete_word_2: Arinc429Acquisition::new(Duration::from_millis(60)),

            radio_height_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            radio_height_2: Arinc429Acquisition::new(Duration::from_millis(60)),

            computed_speed_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            computed_speed_2: Arinc429Acquisition::new(Duration::from_millis(60)),
            computed_speed_3: Arinc429Acquisition::new(Duration::from_millis(60)),

            altitude_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            altitude_2: Arinc429Acquisition::new(Duration::from_millis(60)),
            altitude_3: Arinc429Acquisition::new(Duration::from_millis(60)),
            capt_corrected_altitude_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            capt_corrected_altitude_2: Arinc429Acquisition::new(Duration::from_millis(60)),
            capt_corrected_altitude_3: Arinc429Acquisition::new(Duration::from_millis(60)),
            fo_corrected_altitude_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            fo_corrected_altitude_2: Arinc429Acquisition::new(Duration::from_millis(60)),
            fo_corrected_altitude_3: Arinc429Acquisition::new(Duration::from_millis(60)),

            mmr_1_glide_slope_deviation: Arinc429Acquisition::new(Duration::from_millis(50)),
            mmr_2_glide_slope_deviation: Arinc429Acquisition::new(Duration::from_millis(50)),

            eiu_1_word_031: Arinc429Acquisition::new(Duration::from_millis(60)),
            eiu_2_word_031: Arinc429Acquisition::new(Duration::from_millis(60)),

            ecu_1a_tla: Arinc429Acquisition::new(Duration::from_millis(125)),
            ecu_1b_tla: Arinc429Acquisition::new(Duration::from_millis(125)),
            ecu_2a_tla: Arinc429Acquisition::new(Duration::from_millis(125)),
            ecu_2b_tla: Arinc429Acquisition::new(Duration::from_millis(125)),

            ecu_1a_status_word_1: Arinc429Acquisition::new(Duration::from_millis(250)),
            ecu_1b_status_word_1: Arinc429Acquisition::new(Duration::from_millis(250)),
            ecu_2a_status_word_1: Arinc429Acquisition::new(Duration::from_millis(250)),
            ecu_2b_status_word_1: Arinc429Acquisition::new(Duration::from_millis(250)),

            ecu_1a_status_word_3: Arinc429Acquisition::new(Duration::from_millis(125)),
            ecu_1b_status_word_3: Arinc429Acquisition::new(Duration::from_millis(125)),
            ecu_2a_status_word_3: Arinc429Acquisition::new(Duration::from_millis(125)),
            ecu_2b_status_word_3: Arinc429Acquisition::new(Duration::from_millis(125)),

            ecu_1a_word_272: Arinc429Acquisition::new(Duration::from_millis(250)),
            ecu_1b_word_272: Arinc429Acquisition::new(Duration::from_millis(250)),
            ecu_2a_word_272: Arinc429Acquisition::new(Duration::from_millis(250)),
            ecu_2b_word_272: Arinc429Acquisition::new(Duration::from_millis(250)),

            fcdc_1_discrete_word_2: Arinc429Acquisition::new(Duration::from_millis(60)),
            fcdc_2_discrete_word_2: Arinc429Acquisition::new(Duration::from_millis(60)),

            fcu_ats_discrete_word: Arinc429Acquisition::new(Duration::from_millis(60)),
            fcu_discrete_word_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            fcu_ap_tcas_word: Arinc429Acquisition::new(Duration::from_millis(60)),
            fcu_selected_altitude_word: Arinc429Acquisition::new(Duration::from_millis(60)),

            fmgc_1_discrete_word_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            fmgc_2_discrete_word_1: Arinc429Acquisition::new(Duration::from_millis(60)),
            fmgc_1_discrete_word_4: Arinc429Acquisition::new(Duration::from_millis(60)),
            fmgc_2_discrete_word_4: Arinc429Acquisition::new(Duration::from_millis(60)),

            dmc_1_decision_height_word: Arinc429Acquisition::new(Duration::from_millis(60)),
            dmc_2_decision_height_word: Arinc429Acquisition::new(Duration::from_millis(60)),
            dmc_1_discrete_status_word_270: Arinc429Acquisition::new(Duration::from_millis(800)),
            dmc_2_discrete_status_word_270: Arinc429Acquisition::new(Duration::from_millis(800)),
            dmc_1_discrete_status_word_272: Arinc429Acquisition::new(Duration::from_millis(800)),
            dmc_2_discrete_status_word_272: Arinc429Acquisition::new(Duration::from_millis(800)),
            dmc_1_discrete_status_word_350: Arinc429Acquisition::new(Duration::from_millis(640)),
            dmc_2_discrete_status_word_350: Arinc429Acquisition::new(Duration::from_millis(640)),
        }
    }
}

impl A320FwcAcquisition {
    pub fn acquire(&mut self) -> A320FwcParameterTable {
        A320FwcParameterTable {
            fwc_ident_side1: self.fwc_ident_side1.read(),
            fwc_ident_side2: self.fwc_ident_side2.read(),
            lh_lg_compressed_1: self.lgciu_1_discrete_word_2.read_bit(13),
            lh_lg_compressed_2: self.lgciu_2_discrete_word_2.read_bit(13),
            ess_lh_lg_compressed: self.ess_lh_lg_compressed.read(),
            norm_lh_lg_compressed: self.norm_lh_lg_compressed.read(),
            lh_gear_down_lock_1: self.lgciu_1_discrete_word_1.read_bit(23),
            lh_gear_down_lock_2: self.lgciu_2_discrete_word_1.read_bit(23),
            rh_gear_down_lock_1: self.lgciu_1_discrete_word_1.read_bit(24),
            rh_gear_down_lock_2: self.lgciu_2_discrete_word_1.read_bit(24),
            nose_gear_down_lock_1: self.lgciu_1_discrete_word_1.read_bit(25),
            nose_gear_down_lock_2: self.lgciu_2_discrete_word_1.read_bit(25),
            radio_height_1: self.radio_height_1.read(),
            radio_height_2: self.radio_height_2.read(),
            computed_speed_1: self.computed_speed_1.read(),
            computed_speed_2: self.computed_speed_2.read(),
            computed_speed_3: self.computed_speed_3.read(),
            eng1_master_lever_select_on: self.eiu_1_word_031.read_bit(14),
            eng2_master_lever_select_on: self.eiu_2_word_031.read_bit(14),
            eng1_master_lever_select_off: self.eiu_1_word_031.read_bit(15),
            eng2_master_lever_select_off: self.eiu_2_word_031.read_bit(15),
            eng1_core_speed_at_or_above_idle_a: self.ecu_1a_status_word_3.read_bit(18),
            eng1_core_speed_at_or_above_idle_b: self.ecu_1b_status_word_3.read_bit(18),
            eng2_core_speed_at_or_above_idle_a: self.ecu_1a_status_word_3.read_bit(18),
            eng2_core_speed_at_or_above_idle_b: self.ecu_2b_status_word_3.read_bit(18),
            eng_1_fire_pb_out: self.eng1_fire_pb_out.read(),
            eng_2_fire_pb_out: self.eng2_fire_pb_out.read(),
            to_config_test: self.ecp_warning_switches_word.read_bit(18),
            eng1_tla_a: self.ecu_1a_tla.read(),
            eng1_tla_b: self.ecu_1b_tla.read(),
            eng2_tla_a: self.ecu_2a_tla.read(),
            eng2_tla_b: self.ecu_2b_tla.read(),
            eng1_tla_fto_a: self.ecu_1a_word_272.read_bit(16),
            eng1_tla_fto_b: self.ecu_1a_word_272.read_bit(16),
            eng2_tla_fto_a: self.ecu_1a_word_272.read_bit(16),
            eng2_tla_fto_b: self.ecu_1a_word_272.read_bit(16),
            eng1_n1_selected_actual_a: Default::default(),
            eng1_n1_selected_actual_b: Default::default(),
            eng2_n1_selected_actual_a: Default::default(),
            eng2_n1_selected_actual_b: Default::default(),
            tla1_idle_pwr_a: Default::default(),
            tla1_idle_pwr_b: Default::default(),
            tla2_idle_pwr_a: Default::default(),
            tla2_idle_pwr_b: Default::default(),
            eng1_channel_a_in_control: self.ecu_1a_status_word_1.read_bit(24),
            eng1_channel_b_in_control: self.ecu_1b_status_word_1.read_bit(24),
            eng2_channel_a_in_control: self.ecu_2a_status_word_1.read_bit(24),
            eng2_channel_b_in_control: self.ecu_2b_status_word_1.read_bit(24),
            eng_1_auto_toga_a: Default::default(),
            eng_1_auto_toga_b: Default::default(),
            eng_2_auto_toga_a: Default::default(),
            eng_2_auto_toga_b: Default::default(),
            eng_1_limit_mode_soft_ga_a: Default::default(),
            eng_1_limit_mode_soft_ga_b: Default::default(),
            eng_2_limit_mode_soft_ga_a: Default::default(),
            eng_2_limit_mode_soft_ga_b: Default::default(),
            dmc_1_adc_transfer_coding_bit_13: self.dmc_1_discrete_status_word_272.read_bit(13),
            dmc_1_adc_transfer_coding_bit_14: self.dmc_1_discrete_status_word_272.read_bit(14),
            dmc_2_adc_transfer_coding_bit_13: self.dmc_2_discrete_status_word_272.read_bit(13),
            dmc_2_adc_transfer_coding_bit_14: self.dmc_2_discrete_status_word_272.read_bit(14),
            dmc_1_baro_ref_coding_bit_11: self.dmc_1_discrete_status_word_350.read_bit(11),
            dmc_1_baro_ref_coding_bit_12: self.dmc_1_discrete_status_word_350.read_bit(12),
            dmc_2_baro_ref_coding_bit_11: self.dmc_2_discrete_status_word_350.read_bit(11),
            dmc_2_baro_ref_coding_bit_12: self.dmc_2_discrete_status_word_350.read_bit(12),
            altitude_1: self.altitude_1.read(),
            altitude_2: self.altitude_2.read(),
            altitude_3: self.altitude_3.read(),
            capt_corrected_altitude_1: self.capt_corrected_altitude_1.read(),
            capt_corrected_altitude_2: self.capt_corrected_altitude_2.read(),
            capt_corrected_altitude_3: self.capt_corrected_altitude_3.read(),
            fo_corrected_altitude_1: self.fo_corrected_altitude_1.read(),
            fo_corrected_altitude_2: self.fo_corrected_altitude_2.read(),
            fo_corrected_altitude_3: self.fo_corrected_altitude_3.read(),
            alti_select: self.fcu_selected_altitude_word.read(),
            alti_select_chg: self.fcu_discrete_word_1.read_bit(13),
            ap1_engd_com: self.ap1_engd_com.read(),
            ap1_engd_mon: self.ap1_engd_mon.read(),
            ap2_engd_com: self.ap2_engd_com.read(),
            ap2_engd_mon: self.ap2_engd_mon.read(),
            instinc_discnct_1ap_engd: Default::default(),
            instinc_discnct_2ap_engd: Default::default(),
            capt_mw_cancel_on: self.mw_cancel_on_capt.read(),
            fo_mw_cancel_on: self.mw_cancel_on_fo.read(),
            capt_mc_cancel_on: self.mc_cancel_on_capt.read(),
            fo_mc_cancel_on: self.mc_cancel_on_fo.read(),
            rcl: self.ecp_warning_switches_word.read_bit(14),
            ecp_emer_cancel_on: self.ecp_emer_cancel_on.read(),
            ecp_clear: self.ecp_clear.read(),
            ecp_recall: self.ecp_recall.read(),
            ecp_status: self.ecp_status.read(),
            blue_sys_lo_pr: self.blue_sys_lo_pr.read(),
            yellow_sys_lo_pr: self.yellow_sys_lo_pr.read(),
            green_sys_lo_pr: self.green_sys_lo_pr.read(),
            tcas_engaged: self.fcu_ap_tcas_word.read_bit(13),
            gs_mode_on_1: self.fmgc_1_discrete_word_1.read_bit(22),
            gs_mode_on_2: self.fmgc_2_discrete_word_1.read_bit(22),
            gpws_modes_on: self.gpws_modes_on.read(),
            gs_visual_alert_on: self.gs_visual_alert_on.read(),
            tcas_aural_advisory_output: self.tcas_aural_advisory_output.read(),
            decision_height_1: self.dmc_1_decision_height_word.read(),
            decision_height_2: self.dmc_2_decision_height_word.read(),
            hundred_above_for_mda_mdh_request_1: self.dmc_1_discrete_status_word_270.read_bit(20),
            hundred_above_for_mda_mdh_request_2: self.dmc_2_discrete_status_word_270.read_bit(20),
            minimum_for_mda_mdh_request_1: self.dmc_1_discrete_status_word_270.read_bit(21),
            minimum_for_mda_mdh_request_2: self.dmc_2_discrete_status_word_270.read_bit(21),
            capt_side_stick_inop_1: self.fcdc_1_discrete_word_2.read_bit(28),
            capt_side_stick_inop_2: self.fcdc_2_discrete_word_2.read_bit(28),
            fo_side_stick_inop_1: self.fcdc_1_discrete_word_2.read_bit(29),
            fo_side_stick_inop_2: self.fcdc_2_discrete_word_2.read_bit(29),
            decision_height_code_a: DiscreteParameter::new(true), // TODO
            decision_height_code_b: DiscreteParameter::new(true), // TODO
            decision_height_plus_100_ft_code_a: DiscreteParameter::new(true), // TODO
            decision_height_plus_100_ft_code_b: DiscreteParameter::new(true), // TODO
            auto_call_out_2500_ft: self.auto_call_out_2500_ft.read(),
            auto_call_out_2500b: self.auto_call_out_2500b.read(),
            auto_call_out_2000_ft: self.auto_call_out_2000_ft.read(),
            auto_call_out_1000_ft: self.auto_call_out_1000_ft.read(),
            auto_call_out_500_ft: self.auto_call_out_500_ft.read(),
            auto_call_out_500_ft_glide_deviation: self.auto_call_out_500_ft_glide_deviation.read(),
            auto_call_out_400_ft: self.auto_call_out_400_ft.read(),
            auto_call_out_300_ft: self.auto_call_out_300_ft.read(),
            auto_call_out_200_ft: self.auto_call_out_200_ft.read(),
            auto_call_out_100_ft: self.auto_call_out_100_ft.read(),
            auto_call_out_50_ft: self.auto_call_out_50_ft.read(),
            auto_call_out_40_ft: self.auto_call_out_40_ft.read(),
            auto_call_out_30_ft: self.auto_call_out_30_ft.read(),
            auto_call_out_20_ft: self.auto_call_out_20_ft.read(),
            auto_call_out_10_ft: self.auto_call_out_10_ft.read(),
            auto_call_out_5_ft: self.auto_call_out_5_ft.read(),
            glide_deviation_1: self.mmr_1_glide_slope_deviation.read(),
            glide_deviation_2: self.mmr_2_glide_slope_deviation.read(),
            land_trk_mode_on_1: self.fmgc_1_discrete_word_4.read_bit(14),
            land_trk_mode_on_2: self.fmgc_2_discrete_word_4.read_bit(14),
            capt_mode_on_1: self.fmgc_1_discrete_word_1.read_bit(21),
            capt_mode_on_2: self.fmgc_2_discrete_word_1.read_bit(21),
            track_mode_on_1: self.fmgc_1_discrete_word_1.read_bit(20),
            track_mode_on_2: self.fmgc_2_discrete_word_1.read_bit(20),
            final_descent_mode_on_1: self.fmgc_1_discrete_word_1.read_bit(23),
            final_descent_mode_on_2: self.fmgc_2_discrete_word_1.read_bit(23),
            athr_engaged: self.fcu_ats_discrete_word.read_bit(13),
            synthetic_voice_synchronization_in: self.synthetic_voice_synchronization.read(),
        }
    }

    pub(super) fn update(&mut self, _delta: Duration, inputs: &A320FwcInputs) {
        self.measure_discretes(inputs);
        self.receive_arinc429(inputs);
    }

    fn measure_discretes(&mut self, inputs: &A320FwcInputs) {
        // Pins
        self.fwc_ident_side1.measure(inputs.fwc_ident_side1());
        self.fwc_ident_side2.measure(inputs.fwc_ident_side2());

        self.auto_call_out_2500_ft
            .measure(inputs.auto_call_out_2500_ft());
        self.auto_call_out_2500b
            .measure(inputs.auto_call_out_2500b());
        self.auto_call_out_2000_ft
            .measure(inputs.auto_call_out_2000_ft());
        self.auto_call_out_1000_ft
            .measure(inputs.auto_call_out_1000_ft());
        self.auto_call_out_500_ft
            .measure(inputs.auto_call_out_500_ft());
        self.auto_call_out_500_ft_glide_deviation
            .measure(inputs.auto_call_out_500_ft_glide_deviation());
        self.auto_call_out_400_ft
            .measure(inputs.auto_call_out_400_ft());
        self.auto_call_out_300_ft
            .measure(inputs.auto_call_out_300_ft());
        self.auto_call_out_200_ft
            .measure(inputs.auto_call_out_200_ft());
        self.auto_call_out_100_ft
            .measure(inputs.auto_call_out_100_ft());
        self.auto_call_out_50_ft
            .measure(inputs.auto_call_out_50_ft());
        self.auto_call_out_40_ft
            .measure(inputs.auto_call_out_40_ft());
        self.auto_call_out_30_ft
            .measure(inputs.auto_call_out_30_ft());
        self.auto_call_out_20_ft
            .measure(inputs.auto_call_out_20_ft());
        self.auto_call_out_10_ft
            .measure(inputs.auto_call_out_10_ft());
        self.auto_call_out_5_ft.measure(inputs.auto_call_out_5_ft());

        // Other
        self.ess_lh_lg_compressed
            .measure(inputs.ess_lh_lg_compressed());
        self.norm_lh_lg_compressed
            .measure(inputs.norm_lh_lg_compressed());

        self.green_sys_lo_pr.measure(inputs.green_sys_lo_pr());
        self.blue_sys_lo_pr.measure(inputs.blue_sys_lo_pr());
        self.yellow_sys_lo_pr.measure(inputs.yellow_sys_lo_pr());

        self.ap1_engd_com.measure(inputs.ap1_engd_com());
        self.ap1_engd_mon.measure(inputs.ap1_engd_mon());
        self.ap2_engd_com.measure(inputs.ap2_engd_com());
        self.ap2_engd_mon.measure(inputs.ap2_engd_mon());
        self.mw_cancel_on_capt.measure(inputs.mw_cancel_on_capt());
        self.mw_cancel_on_fo.measure(inputs.mw_cancel_on_fo());
        self.mc_cancel_on_capt.measure(inputs.mc_cancel_on_capt());
        self.mc_cancel_on_fo.measure(inputs.mc_cancel_on_fo());
        self.ecp_clear.measure(inputs.ecp_clear());
        self.ecp_emer_cancel_on.measure(inputs.ecp_emer_cancel_on());
        self.ecp_recall.measure(inputs.ecp_recall());
        self.ecp_status.measure(inputs.ecp_status());
        self.eng1_fire_pb_out.measure(inputs.eng1_fire_pb_out());
        self.eng2_fire_pb_out.measure(inputs.eng2_fire_pb_out());

        self.gpws_modes_on.measure(inputs.gpws_modes_on());
        self.gs_visual_alert_on.measure(inputs.gs_visual_alert_on());

        self.tcas_aural_advisory_output
            .measure(inputs.tcas_aural_advisory_output());

        self.synthetic_voice_synchronization
            .measure(inputs.synthetic_voice_synchronization_in());
    }

    fn receive_arinc429(&mut self, inputs: &A320FwcInputs) {
        self.ecp_warning_switches_word
            .receive(inputs.ecp_warning_switches_word());

        self.lgciu_1_discrete_word_1
            .receive(inputs.lgciu_1_discrete_word_1());
        self.lgciu_2_discrete_word_1
            .receive(inputs.lgciu_2_discrete_word_1());
        self.lgciu_1_discrete_word_2
            .receive(inputs.lgciu_1_discrete_word_2());
        self.lgciu_2_discrete_word_2
            .receive(inputs.lgciu_2_discrete_word_2());

        self.radio_height_1.receive(inputs.radio_height_1());
        self.radio_height_2.receive(inputs.radio_height_2());

        self.computed_speed_1.receive(inputs.computed_speed_1());
        self.computed_speed_2.receive(inputs.computed_speed_2());
        self.computed_speed_3.receive(inputs.computed_speed_3());

        self.altitude_1.receive(inputs.altitude_1());
        self.altitude_2.receive(inputs.altitude_2());
        self.altitude_3.receive(inputs.altitude_3());
        self.capt_corrected_altitude_1
            .receive(inputs.capt_corrected_altitude_1());
        self.capt_corrected_altitude_2
            .receive(inputs.capt_corrected_altitude_2());
        self.capt_corrected_altitude_3
            .receive(inputs.capt_corrected_altitude_3());
        self.fo_corrected_altitude_1
            .receive(inputs.fo_corrected_altitude_1());
        self.fo_corrected_altitude_2
            .receive(inputs.fo_corrected_altitude_2());
        self.fo_corrected_altitude_3
            .receive(inputs.fo_corrected_altitude_3());

        self.mmr_1_glide_slope_deviation
            .receive(inputs.mmr_1_glide_slope_deviation());
        self.mmr_2_glide_slope_deviation
            .receive(inputs.mmr_2_glide_slope_deviation());

        self.eiu_1_word_031.receive(inputs.eiu_1_word_031());
        self.eiu_2_word_031.receive(inputs.eiu_2_word_031());

        self.ecu_1a_tla.receive(inputs.ecu_1a_tla());
        self.ecu_1b_tla.receive(inputs.ecu_1b_tla());
        self.ecu_2a_tla.receive(inputs.ecu_2a_tla());
        self.ecu_2b_tla.receive(inputs.ecu_2b_tla());
        self.ecu_1a_status_word_1
            .receive(inputs.ecu_1a_status_word_1());
        self.ecu_1b_status_word_1
            .receive(inputs.ecu_1b_status_word_1());
        self.ecu_2a_status_word_1
            .receive(inputs.ecu_2a_status_word_1());
        self.ecu_2b_status_word_1
            .receive(inputs.ecu_2b_status_word_1());
        self.ecu_1a_status_word_3
            .receive(inputs.ecu_1a_status_word_3());
        self.ecu_1b_status_word_3
            .receive(inputs.ecu_1b_status_word_3());
        self.ecu_2a_status_word_3
            .receive(inputs.ecu_2a_status_word_3());
        self.ecu_2b_status_word_3
            .receive(inputs.ecu_2b_status_word_3());

        self.ecu_1a_word_272.receive(inputs.ecu_1a_word_272());
        self.ecu_1b_word_272.receive(inputs.ecu_1b_word_272());
        self.ecu_2a_word_272.receive(inputs.ecu_2a_word_272());
        self.ecu_2b_word_272.receive(inputs.ecu_2b_word_272());

        self.fcdc_1_discrete_word_2
            .receive(inputs.fcdc_1_discrete_word_2());
        self.fcdc_2_discrete_word_2
            .receive(inputs.fcdc_2_discrete_word_2());

        self.fcu_ats_discrete_word
            .receive(inputs.fcu_ats_discrete_word());
        self.fcu_discrete_word_1
            .receive(inputs.fcu_discrete_word_1());
        self.fcu_ap_tcas_word.receive(inputs.fcu_ap_tcas_word());
        self.fcu_selected_altitude_word
            .receive(inputs.fcu_selected_altitude_word());

        self.fmgc_1_discrete_word_1
            .receive(inputs.fmgc_1_discrete_word_1());
        self.fmgc_2_discrete_word_1
            .receive(inputs.fmgc_2_discrete_word_1());
        self.fmgc_1_discrete_word_4
            .receive(inputs.fmgc_1_discrete_word_4());
        self.fmgc_2_discrete_word_4
            .receive(inputs.fmgc_2_discrete_word_4());

        self.dmc_1_decision_height_word
            .receive(inputs.dmc_1_decision_height_word());
        self.dmc_2_decision_height_word
            .receive(inputs.dmc_2_decision_height_word());
        self.dmc_1_discrete_status_word_270
            .receive(inputs.dmc_1_discrete_status_word_270());
        self.dmc_2_discrete_status_word_270
            .receive(inputs.dmc_2_discrete_status_word_270());
        self.dmc_1_discrete_status_word_272
            .receive(inputs.dmc_1_discrete_status_word_272());
        self.dmc_2_discrete_status_word_272
            .receive(inputs.dmc_2_discrete_status_word_272());
        self.dmc_1_discrete_status_word_350
            .receive(inputs.dmc_1_discrete_status_word_350());
        self.dmc_2_discrete_status_word_350
            .receive(inputs.dmc_2_discrete_status_word_350());
    }
}
