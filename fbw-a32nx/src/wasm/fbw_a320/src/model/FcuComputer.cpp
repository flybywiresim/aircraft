#include "FcuComputer.h"
#include "rtwtypes.h"
#include "FcuComputer_types.h"
#include <cmath>

void FcuComputer::FcuComputer_MATLABFunction_Reset(rtDW_MATLABFunction_FcuComputer_T *localDW)
{
  localDW->previousInput = false;
  localDW->remainingTriggerTime = 0.0;
}

void FcuComputer::FcuComputer_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T rtp_isRisingEdge,
  real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_FcuComputer_T *localDW)
{
  if (localDW->remainingTriggerTime > 0.0) {
    localDW->remainingTriggerTime -= rtu_Ts;
  } else if (localDW->remainingTriggerTime < 0.0) {
    localDW->remainingTriggerTime = 0.0;
  }

  if (((rtp_retriggerable != 0.0) || (localDW->remainingTriggerTime == 0.0)) && (((rtp_isRisingEdge != 0.0) && rtu_u &&
        (!localDW->previousInput)) || ((rtp_isRisingEdge == 0.0) && (!rtu_u) && localDW->previousInput))) {
    localDW->remainingTriggerTime = rtp_triggerDuration;
  }

  localDW->previousInput = rtu_u;
  *rty_y = (localDW->remainingTriggerTime > 0.0);
}

void FcuComputer::FcuComputer_MATLABFunction_i(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void FcuComputer::FcuComputer_MATLABFunction1_Reset(rtDW_MATLABFunction1_FcuComputer_T *localDW)
{
  localDW->eventTime_not_empty = false;
}

void FcuComputer::FcuComputer_MATLABFunction1(const fcu_outputs *rtu_in, boolean_T rtu_set_dashes, boolean_T
  rtu_set_selection, boolean_T *rty_dashes, rtDW_MATLABFunction1_FcuComputer_T *localDW)
{
  if (!localDW->eventTime_not_empty) {
    localDW->eventTime = rtu_in->data.time.simulation_time;
    localDW->eventTime_not_empty = true;
  }

  if (rtu_set_dashes) {
    localDW->eventTime = (rtu_in->data.time.simulation_time - 10.0) - 1.0;
  } else if (rtu_set_selection) {
    localDW->eventTime = rtu_in->data.time.simulation_time;
  }

  *rty_dashes = (rtu_in->data.time.simulation_time - localDW->eventTime > 10.0);
}

void FcuComputer::FcuComputer_MATLABFunction_o_Reset(rtDW_MATLABFunction_FcuComputer_e_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void FcuComputer::FcuComputer_MATLABFunction_d(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_FcuComputer_e_T *localDW)
{
  if (!localDW->previousInput_not_empty) {
    localDW->previousInput = rtu_isRisingEdge;
    localDW->previousInput_not_empty = true;
  }

  if (rtu_isRisingEdge) {
    *rty_y = (rtu_u && (!localDW->previousInput));
  } else {
    *rty_y = ((!rtu_u) && localDW->previousInput);
  }

  localDW->previousInput = rtu_u;
}

void FcuComputer::FcuComputer_MATLABFunction_m(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void FcuComputer::FcuComputer_MATLABFunction_a(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
{
  real32_T tmp;
  uint32_T a;
  tmp = std::round(rtu_u->Data);
  if (tmp < 4.2949673E+9F) {
    if (tmp >= 0.0F) {
      a = static_cast<uint32_T>(tmp);
    } else {
      a = 0U;
    }
  } else {
    a = MAX_uint32_T;
  }

  if (-(rtu_bit - 1.0) >= 0.0) {
    if (-(rtu_bit - 1.0) <= 31.0) {
      a <<= static_cast<uint8_T>(-(rtu_bit - 1.0));
    } else {
      a = 0U;
    }
  } else if (-(rtu_bit - 1.0) >= -31.0) {
    a >>= static_cast<uint8_T>(rtu_bit - 1.0);
  } else {
    a = 0U;
  }

  *rty_y = a & 1U;
}

void FcuComputer::FcuComputer_EFISFilterLogic_Reset(rtDW_EFISFilterLogic_FcuComputer_T *localDW)
{
  localDW->pEfisFilter = efis_filter_selection::NONE;
}

void FcuComputer::FcuComputer_EFISFilterLogic(boolean_T rtu_cstr, boolean_T rtu_wpt, boolean_T rtu_vord, boolean_T
  rtu_ndb, boolean_T rtu_arpt, efis_filter_selection *rty_efisFilter, rtDW_EFISFilterLogic_FcuComputer_T *localDW)
{
  if (((localDW->pEfisFilter == efis_filter_selection::CSTR) && rtu_cstr) || ((localDW->pEfisFilter ==
        efis_filter_selection::WPT) && rtu_wpt) || ((localDW->pEfisFilter == efis_filter_selection::VORD) && rtu_vord) ||
      ((localDW->pEfisFilter == efis_filter_selection::NDB) && rtu_ndb) || ((localDW->pEfisFilter ==
        efis_filter_selection::ARPT) && rtu_arpt)) {
    localDW->pEfisFilter = efis_filter_selection::NONE;
  } else if (rtu_cstr) {
    localDW->pEfisFilter = efis_filter_selection::CSTR;
  } else if (rtu_wpt) {
    localDW->pEfisFilter = efis_filter_selection::WPT;
  } else if (rtu_vord) {
    localDW->pEfisFilter = efis_filter_selection::VORD;
  } else if (rtu_ndb) {
    localDW->pEfisFilter = efis_filter_selection::NDB;
  } else if (rtu_arpt) {
    localDW->pEfisFilter = efis_filter_selection::ARPT;
  }

  *rty_efisFilter = localDW->pEfisFilter;
}

void FcuComputer::FcuComputer_MATLABFunction_j_Init(rtDW_MATLABFunction_FcuComputer_b_T *localDW)
{
  localDW->qnh_active = true;
}

void FcuComputer::FcuComputer_MATLABFunction_a_Reset(rtDW_MATLABFunction_FcuComputer_b_T *localDW)
{
  localDW->std_active = false;
  localDW->qnh_active = true;
  localDW->qfe_active = false;
}

void FcuComputer::FcuComputer_MATLABFunction_p(boolean_T rtu_knob_push, boolean_T rtu_knob_pull, boolean_T *rty_std,
  boolean_T *rty_qnh, boolean_T *rty_qfe, rtDW_MATLABFunction_FcuComputer_b_T *localDW)
{
  if (rtu_knob_push && localDW->std_active) {
    localDW->std_active = false;
  } else {
    boolean_T tmp;
    tmp = !localDW->std_active;
    if (rtu_knob_push && tmp) {
      localDW->qnh_active = !localDW->qnh_active;
      localDW->qfe_active = !localDW->qfe_active;
    } else {
      localDW->std_active = ((rtu_knob_pull && tmp) || localDW->std_active);
    }
  }

  *rty_std = localDW->std_active;
  *rty_qnh = localDW->qnh_active;
  *rty_qfe = localDW->qfe_active;
}

void FcuComputer::FcuComputer_MATLABFunction1_i_Init(rtDW_MATLABFunction1_FcuComputer_b_T *localDW)
{
  localDW->pValueHpa = 1013.0;
  localDW->pValueInhg = 29.92;
}

void FcuComputer::FcuComputer_MATLABFunction1_c_Reset(rtDW_MATLABFunction1_FcuComputer_b_T *localDW)
{
  localDW->pValueHpa = 1013.0;
  localDW->pValueInhg = 29.92;
}

void FcuComputer::FcuComputer_MATLABFunction1_h(boolean_T rtu_std_active, boolean_T rtu_inhg_active, real_T
  rtu_click_count, real_T *rty_value_hpa, real_T *rty_value_inhg, rtDW_MATLABFunction1_FcuComputer_b_T *localDW)
{
  boolean_T tmp;
  tmp = !rtu_std_active;
  if (tmp && (!rtu_inhg_active)) {
    localDW->pValueHpa = std::fmax(std::fmin(localDW->pValueHpa + rtu_click_count, 1100.0), 745.0);
    localDW->pValueInhg = std::round(localDW->pValueHpa * 0.02953 * 100.0) / 100.0;
  } else if (tmp && rtu_inhg_active) {
    localDW->pValueInhg = std::fmax(std::fmin(rtu_click_count * 0.01 + localDW->pValueInhg, 32.48), 22.0);
    localDW->pValueHpa = localDW->pValueInhg * 33.863867253640365;
    localDW->pValueHpa = std::round(localDW->pValueHpa);
  }

  *rty_value_hpa = localDW->pValueHpa;
  *rty_value_inhg = localDW->pValueInhg;
}

void FcuComputer::FcuComputer_MATLABFunction_i_Reset(rtDW_MATLABFunction_FcuComputer_l_T *localDW)
{
  localDW->pY_not_empty = false;
}

void FcuComputer::FcuComputer_MATLABFunction_mb(boolean_T rtu_u, boolean_T *rty_y, boolean_T rtp_init,
  rtDW_MATLABFunction_FcuComputer_l_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtp_init;
    localDW->pY_not_empty = true;
  }

  if (rtu_u) {
    localDW->pY = !localDW->pY;
  }

  *rty_y = localDW->pY;
}

void FcuComputer::FcuComputer_MATLABFunction_e(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void FcuComputer::FcuComputer_MATLABFunction_n(const base_fcu_efis_logic_outputs *rtu_logic, const
  base_fcu_efis_panel_inputs *rtu_data, int8_T *rty_baroValueMode, real32_T *rty_baroValue, int8_T *rty_baroMode)
{
  int8_T baroValueMode;
  if (rtu_logic->baro_std) {
    baroValueMode = 0;
  } else if (!rtu_data->baro_is_inhg) {
    baroValueMode = 1;
  } else {
    baroValueMode = 2;
  }

  switch (baroValueMode) {
   case 1:
    *rty_baroValue = rtu_logic->baro_value_hpa;
    break;

   case 2:
    *rty_baroValue = rtu_logic->baro_value_inhg;
    break;

   default:
    *rty_baroValue = 0.0F;
    break;
  }

  if (rtu_logic->baro_std) {
    *rty_baroMode = 0;
  } else if (rtu_logic->baro_qnh) {
    *rty_baroMode = 1;
  } else {
    *rty_baroMode = 2;
  }

  *rty_baroValueMode = baroValueMode;
}

void FcuComputer::step()
{
  const base_arinc_429 *rtb_Switch1_2;
  const base_arinc_429 *rtb_Switch2_0;
  const base_arinc_429 *rtb_Switch_fpa_deg;
  const base_arinc_429 *rtb_Switch_heading_deg;
  const base_arinc_429 *rtb_Switch_k_0;
  const base_arinc_429 *rtb_Switch_track_deg;
  const base_arinc_429 *rtb_Switch_vertical_speed_ft_min;
  fcu_outputs rtb_BusAssignment_m;
  real_T rtb_DataTypeConversion2;
  real_T rtb_DataTypeConversion3;
  real32_T rtb_y;
  uint32_T rtb_Switch1_oa;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_AND1_l;
  boolean_T rtb_AND2_m;
  boolean_T rtb_AND_g;
  boolean_T rtb_BusAssignment_l_logic_afs_any_ap_fd_engaged;
  boolean_T rtb_BusAssignment_o_baro_qfe;
  boolean_T rtb_BusAssignment_o_baro_qnh;
  boolean_T rtb_DataTypeConversion_d;
  boolean_T rtb_Equal6;
  boolean_T rtb_Equal7;
  boolean_T rtb_Equal8;
  boolean_T rtb_Equal9;
  boolean_T rtb_OR3_j;
  boolean_T rtb_OR_o;
  boolean_T rtb_fmgc1Priority;
  boolean_T rtb_y_f;
  boolean_T rtb_y_h;
  boolean_T rtb_y_i;
  efis_filter_selection rtb_BusAssignment_o_efis_filter;
  efis_filter_selection rtb_efisFilter;
  if (FcuComputer_U.in.sim_data.computer_running) {
    if (!FcuComputer_DWork.Runtime_MODE) {
      FcuComputer_DWork.DelayInput1_DSTATE[0] = FcuComputer_P.DetectChange_vinit;
      FcuComputer_DWork.DelayInput1_DSTATE[1] = FcuComputer_P.DetectChange_vinit;
      FcuComputer_DWork.DelayInput1_DSTATE[2] = FcuComputer_P.DetectChange_vinit;
      FcuComputer_DWork.DelayInput1_DSTATE[3] = FcuComputer_P.DetectChange_vinit;
      FcuComputer_DWork.Delay_DSTATE = FcuComputer_P.Delay_InitialCondition;
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_he);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_nz);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_id);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_gb);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_bpf);
      FcuComputer_EFISFilterLogic_Reset(&FcuComputer_DWork.sf_EFISFilterLogic);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_ik);
      FcuComputer_MATLABFunction_i_Reset(&FcuComputer_DWork.sf_MATLABFunction_mb);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_jr);
      FcuComputer_MATLABFunction_i_Reset(&FcuComputer_DWork.sf_MATLABFunction_kc);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_hc);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_b3);
      FcuComputer_MATLABFunction_a_Reset(&FcuComputer_DWork.sf_MATLABFunction_pr);
      FcuComputer_MATLABFunction1_c_Reset(&FcuComputer_DWork.sf_MATLABFunction1_h);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_fiq);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_ec);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_hlu);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_df);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_cb);
      FcuComputer_EFISFilterLogic_Reset(&FcuComputer_DWork.sf_EFISFilterLogic_h);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_ja0);
      FcuComputer_MATLABFunction_i_Reset(&FcuComputer_DWork.sf_MATLABFunction_ja);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_je);
      FcuComputer_MATLABFunction_i_Reset(&FcuComputer_DWork.sf_MATLABFunction_hk);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_ng);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_gx);
      FcuComputer_MATLABFunction_a_Reset(&FcuComputer_DWork.sf_MATLABFunction_jp);
      FcuComputer_MATLABFunction1_c_Reset(&FcuComputer_DWork.sf_MATLABFunction1_e3);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_e);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_k);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_n);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_b);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_l);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_m);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_kr);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_f);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_c);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_a);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_o);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_kh);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_d);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_i);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_k0);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_g);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_a4);
      FcuComputer_DWork.p_trk_fpa_active = false;
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_ma);
      FcuComputer_DWork.p_metric_alt_active = false;
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_kl);
      FcuComputer_MATLABFunction1_Reset(&FcuComputer_DWork.sf_MATLABFunction1_p);
      FcuComputer_DWork.pValue_not_empty_l = false;
      FcuComputer_DWork.prevMachActive = false;
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_dc);
      FcuComputer_MATLABFunction1_Reset(&FcuComputer_DWork.sf_MATLABFunction1);
      FcuComputer_DWork.pValue_not_empty_lk = false;
      FcuComputer_DWork.prevTrkFpaActive_not_empty_c = false;
      FcuComputer_DWork.pValue_not_empty_m = false;
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_kw);
      FcuComputer_MATLABFunction1_Reset(&FcuComputer_DWork.sf_MATLABFunction1_o);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_hh);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_ar);
      FcuComputer_MATLABFunction_o_Reset(&FcuComputer_DWork.sf_MATLABFunction_ch);
      FcuComputer_DWork.pValue_not_empty = false;
      FcuComputer_DWork.prevTrkFpaActive_not_empty = false;
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_av);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_p5r);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_lh);
      FcuComputer_MATLABFunction_Reset(&FcuComputer_DWork.sf_MATLABFunction_oi);
      FcuComputer_DWork.Runtime_MODE = true;
    }

    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.cstr_button_pushed,
      FcuComputer_P.PulseNode_isRisingEdge, &rtb_Equal9, &FcuComputer_DWork.sf_MATLABFunction_he);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.wpt_button_pushed,
      FcuComputer_P.PulseNode1_isRisingEdge, &rtb_Equal8, &FcuComputer_DWork.sf_MATLABFunction_nz);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.vord_button_pushed,
      FcuComputer_P.PulseNode2_isRisingEdge, &rtb_Equal7, &FcuComputer_DWork.sf_MATLABFunction_id);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.ndb_button_pushed,
      FcuComputer_P.PulseNode3_isRisingEdge, &rtb_Equal6, &FcuComputer_DWork.sf_MATLABFunction_gb);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.arpt_button_pushed,
      FcuComputer_P.PulseNode4_isRisingEdge, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_bpf);
    FcuComputer_EFISFilterLogic(rtb_Equal9, rtb_Equal8, rtb_Equal7, rtb_Equal6, rtb_OR3_j,
      &rtb_BusAssignment_o_efis_filter, &FcuComputer_DWork.sf_EFISFilterLogic);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.fd_button_pushed,
      FcuComputer_P.PulseNode_isRisingEdge_n, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_ik);
    FcuComputer_MATLABFunction_mb(rtb_OR3_j, &rtb_Equal7, FcuComputer_P.TFlipFlop_init,
      &FcuComputer_DWork.sf_MATLABFunction_mb);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.ls_button_pushed,
      FcuComputer_P.PulseNode_isRisingEdge_nj, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_jr);
    FcuComputer_MATLABFunction_mb(rtb_OR3_j, &rtb_Equal6, FcuComputer_P.TFlipFlop1_init,
      &FcuComputer_DWork.sf_MATLABFunction_kc);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.baro_knob.pushed,
      FcuComputer_P.PulseNode_isRisingEdge_a, &rtb_Equal8, &FcuComputer_DWork.sf_MATLABFunction_hc);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.baro_knob.pulled,
      FcuComputer_P.PulseNode1_isRisingEdge_h, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_b3);
    FcuComputer_MATLABFunction_p(rtb_Equal8, rtb_OR3_j, &rtb_Equal9, &rtb_BusAssignment_o_baro_qnh,
      &rtb_BusAssignment_o_baro_qfe, &FcuComputer_DWork.sf_MATLABFunction_pr);
    FcuComputer_MATLABFunction1_h(rtb_Equal9, FcuComputer_U.in.discrete_inputs.capt_efis_inputs.baro_is_inhg,
      static_cast<real_T>(FcuComputer_U.in.discrete_inputs.capt_efis_inputs.baro_knob.turns), &rtb_DataTypeConversion3,
      &rtb_DataTypeConversion2, &FcuComputer_DWork.sf_MATLABFunction1_h);
    rtb_BusAssignment_m.logic.capt_efis.fd_on = rtb_Equal7;
    rtb_BusAssignment_m.logic.capt_efis.ls_on = rtb_Equal6;
    rtb_BusAssignment_m.logic.capt_efis.baro_std = rtb_Equal9;
    rtb_BusAssignment_m.logic.capt_efis.baro_value_hpa = static_cast<real32_T>(rtb_DataTypeConversion3);
    rtb_BusAssignment_m.logic.capt_efis.baro_value_inhg = static_cast<real32_T>(rtb_DataTypeConversion2);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.cstr_button_pushed,
      FcuComputer_P.PulseNode_isRisingEdge_m, &rtb_Equal9, &FcuComputer_DWork.sf_MATLABFunction_fiq);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.wpt_button_pushed,
      FcuComputer_P.PulseNode1_isRisingEdge_k, &rtb_Equal8, &FcuComputer_DWork.sf_MATLABFunction_ec);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.vord_button_pushed,
      FcuComputer_P.PulseNode2_isRisingEdge_a, &rtb_Equal7, &FcuComputer_DWork.sf_MATLABFunction_hlu);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.ndb_button_pushed,
      FcuComputer_P.PulseNode3_isRisingEdge_g, &rtb_Equal6, &FcuComputer_DWork.sf_MATLABFunction_df);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.arpt_button_pushed,
      FcuComputer_P.PulseNode4_isRisingEdge_a, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_cb);
    FcuComputer_EFISFilterLogic(rtb_Equal9, rtb_Equal8, rtb_Equal7, rtb_Equal6, rtb_OR3_j, &rtb_efisFilter,
      &FcuComputer_DWork.sf_EFISFilterLogic_h);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.fd_button_pushed,
      FcuComputer_P.PulseNode_isRisingEdge_i, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_ja0);
    FcuComputer_MATLABFunction_mb(rtb_OR3_j, &rtb_Equal7, FcuComputer_P.TFlipFlop_init_f,
      &FcuComputer_DWork.sf_MATLABFunction_ja);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.ls_button_pushed,
      FcuComputer_P.PulseNode_isRisingEdge_h, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_je);
    FcuComputer_MATLABFunction_mb(rtb_OR3_j, &rtb_Equal6, FcuComputer_P.TFlipFlop1_init_a,
      &FcuComputer_DWork.sf_MATLABFunction_hk);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.baro_knob.pushed,
      FcuComputer_P.PulseNode_isRisingEdge_o, &rtb_Equal8, &FcuComputer_DWork.sf_MATLABFunction_ng);
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.baro_knob.pulled,
      FcuComputer_P.PulseNode1_isRisingEdge_f, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_gx);
    FcuComputer_MATLABFunction_p(rtb_Equal8, rtb_OR3_j, &rtb_Equal9, &rtb_DataTypeConversion_d, &rtb_y_h,
      &FcuComputer_DWork.sf_MATLABFunction_jp);
    FcuComputer_MATLABFunction1_h(rtb_Equal9, FcuComputer_U.in.discrete_inputs.fo_efis_inputs.baro_is_inhg, static_cast<
      real_T>(FcuComputer_U.in.discrete_inputs.fo_efis_inputs.baro_knob.turns), &rtb_DataTypeConversion3,
      &rtb_DataTypeConversion2, &FcuComputer_DWork.sf_MATLABFunction1_e3);
    rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.hdg_deg = static_cast<real32_T>(rtb_DataTypeConversion3);
    rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.v_mach = static_cast<real32_T>(rtb_DataTypeConversion2);
    rtb_fmgc1Priority = !FcuComputer_U.in.discrete_inputs.ap_2_engaged;
    rtb_fmgc1Priority = (FcuComputer_U.in.discrete_inputs.ap_1_engaged || (rtb_fmgc1Priority &&
      FcuComputer_U.in.discrete_inputs.fd_1_engaged) || (rtb_fmgc1Priority &&
      (!FcuComputer_U.in.discrete_inputs.fd_2_engaged) && FcuComputer_U.in.discrete_inputs.athr_1_engaged));
    if (rtb_fmgc1Priority) {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.altitude_ft;
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.mach;
      rtb_Switch2_0 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.cas_kts;
      rtb_Switch_track_deg = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.track_deg;
      rtb_Switch_heading_deg = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.heading_deg;
      rtb_Switch_fpa_deg = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.fpa_deg;
      rtb_Switch_vertical_speed_ft_min = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.vertical_speed_ft_min;
    } else {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.altitude_ft;
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.mach;
      rtb_Switch2_0 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.cas_kts;
      rtb_Switch_track_deg = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.track_deg;
      rtb_Switch_heading_deg = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.heading_deg;
      rtb_Switch_fpa_deg = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.fpa_deg;
      rtb_Switch_vertical_speed_ft_min = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.vertical_speed_ft_min;
    }

    FcuComputer_MATLABFunction_i(rtb_Switch2_0, FcuComputer_P.A429ValueOrDefault_defaultValue, &rtb_y);
    FcuComputer_MATLABFunction_i(rtb_Switch1_2, FcuComputer_P.A429ValueOrDefault1_defaultValue,
      &rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.v_mach);
    FcuComputer_MATLABFunction_i(rtb_Switch_heading_deg, FcuComputer_P.A429ValueOrDefault2_defaultValue,
      &rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.hdg_deg);
    FcuComputer_MATLABFunction_i(rtb_Switch_track_deg, FcuComputer_P.A429ValueOrDefault3_defaultValue,
      &rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.trk_deg);
    FcuComputer_MATLABFunction_i(rtb_Switch_k_0, FcuComputer_P.A429ValueOrDefault4_defaultValue,
      &rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.alt_ft);
    FcuComputer_MATLABFunction_i(rtb_Switch_vertical_speed_ft_min, FcuComputer_P.A429ValueOrDefault5_defaultValue,
      &rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.vs_ft_min);
    FcuComputer_MATLABFunction_i(rtb_Switch_fpa_deg, FcuComputer_P.A429ValueOrDefault6_defaultValue,
      &rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.fpa_deg);
    rtb_BusAssignment_m.logic.fo_efis.ls_on = rtb_Equal6;
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.pushed, FcuComputer_U.in.time.dt,
      &rtb_OR3_j, FcuComputer_P.MTrigNode_isRisingEdge, FcuComputer_P.MTrigNode_retriggerable,
      FcuComputer_P.KnobMtrigProcessing_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_e);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.pulled, FcuComputer_U.in.time.dt,
      &rtb_BusAssignment_m.logic.afs.hdg_trk_buttons.pulled, FcuComputer_P.MTrigNode1_isRisingEdge,
      FcuComputer_P.MTrigNode1_retriggerable, FcuComputer_P.KnobMtrigProcessing_triggerDuration,
      &FcuComputer_DWork.sf_MATLABFunction_k);
    FcuComputer_MATLABFunction((FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.turns !=
      FcuComputer_P.CompareToConstant_const), FcuComputer_U.in.time.dt, &rtb_y_i, FcuComputer_P.MTrigNode2_isRisingEdge,
      FcuComputer_P.MTrigNode2_retriggerable, FcuComputer_P.KnobMtrigProcessing_triggerDuration,
      &FcuComputer_DWork.sf_MATLABFunction_n);
    rtb_BusAssignment_m.logic.afs.hdg_trk_buttons.pushed = rtb_OR3_j;
    rtb_BusAssignment_m.logic.afs.hdg_trk_buttons.turns = static_cast<int8_T>(rtb_y_i);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.pushed, FcuComputer_U.in.time.dt,
      &rtb_OR3_j, FcuComputer_P.MTrigNode_isRisingEdge_a, FcuComputer_P.MTrigNode_retriggerable_f,
      FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_b);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.pulled, FcuComputer_U.in.time.dt,
      &rtb_BusAssignment_m.logic.afs.spd_mach_buttons.pulled, FcuComputer_P.MTrigNode1_isRisingEdge_j,
      FcuComputer_P.MTrigNode1_retriggerable_d, FcuComputer_P.KnobMtrigProcessing1_triggerDuration,
      &FcuComputer_DWork.sf_MATLABFunction_l);
    FcuComputer_MATLABFunction((FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.turns !=
      FcuComputer_P.CompareToConstant_const_p), FcuComputer_U.in.time.dt, &rtb_y_i,
      FcuComputer_P.MTrigNode2_isRisingEdge_j, FcuComputer_P.MTrigNode2_retriggerable_i,
      FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_m);
    rtb_BusAssignment_m.logic.afs.spd_mach_buttons.pushed = rtb_OR3_j;
    rtb_BusAssignment_m.logic.afs.spd_mach_buttons.turns = static_cast<int8_T>(rtb_y_i);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.pushed, FcuComputer_U.in.time.dt,
      &rtb_OR3_j, FcuComputer_P.MTrigNode_isRisingEdge_k, FcuComputer_P.MTrigNode_retriggerable_h,
      FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_kr);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.pulled, FcuComputer_U.in.time.dt,
      &rtb_BusAssignment_m.logic.afs.alt_buttons.pulled, FcuComputer_P.MTrigNode1_isRisingEdge_o,
      FcuComputer_P.MTrigNode1_retriggerable_j, FcuComputer_P.KnobMtrigProcessing2_triggerDuration,
      &FcuComputer_DWork.sf_MATLABFunction_f);
    FcuComputer_MATLABFunction((FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.turns !=
      FcuComputer_P.CompareToConstant_const_pg), FcuComputer_U.in.time.dt, &rtb_y_i,
      FcuComputer_P.MTrigNode2_isRisingEdge_h, FcuComputer_P.MTrigNode2_retriggerable_h,
      FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_c);
    rtb_BusAssignment_m.logic.afs.alt_buttons.pushed = rtb_OR3_j;
    rtb_BusAssignment_m.logic.afs.alt_buttons.turns = static_cast<int8_T>(rtb_y_i);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.pushed, FcuComputer_U.in.time.dt,
      &rtb_OR3_j, FcuComputer_P.MTrigNode_isRisingEdge_d, FcuComputer_P.MTrigNode_retriggerable_g,
      FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_a);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.pulled, FcuComputer_U.in.time.dt,
      &rtb_BusAssignment_m.logic.afs.vs_fpa_buttons.pulled, FcuComputer_P.MTrigNode1_isRisingEdge_c,
      FcuComputer_P.MTrigNode1_retriggerable_l, FcuComputer_P.KnobMtrigProcessing3_triggerDuration,
      &FcuComputer_DWork.sf_MATLABFunction_o);
    FcuComputer_MATLABFunction((FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.turns !=
      FcuComputer_P.CompareToConstant_const_e), FcuComputer_U.in.time.dt, &rtb_y_i,
      FcuComputer_P.MTrigNode2_isRisingEdge_hx, FcuComputer_P.MTrigNode2_retriggerable_g,
      FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_kh);
    rtb_BusAssignment_m.logic.afs.vs_fpa_buttons.turns = static_cast<int8_T>(rtb_y_i);
    rtb_BusAssignment_m.logic.afs.vs_fpa_buttons.pushed = rtb_OR3_j;
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.loc_button_pressed, FcuComputer_U.in.time.dt,
      &rtb_Equal6, FcuComputer_P.MTrigNode_isRisingEdge_c, FcuComputer_P.MTrigNode_retriggerable_i,
      FcuComputer_P.MTrigNode_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_d);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.exped_button_pressed,
      FcuComputer_U.in.time.dt, &rtb_OR3_j, FcuComputer_P.MTrigNode1_isRisingEdge_a,
      FcuComputer_P.MTrigNode1_retriggerable_ls, FcuComputer_P.MTrigNode1_triggerDuration,
      &FcuComputer_DWork.sf_MATLABFunction_i);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.appr_button_pressed, FcuComputer_U.in.time.dt,
      &rtb_BusAssignment_m.logic.afs.appr_pushed, FcuComputer_P.MTrigNode2_isRisingEdge_p,
      FcuComputer_P.MTrigNode2_retriggerable_c, FcuComputer_P.MTrigNode2_triggerDuration,
      &FcuComputer_DWork.sf_MATLABFunction_k0);
    FcuComputer_MATLABFunction(FcuComputer_U.in.discrete_inputs.afs_inputs.spd_mach_button_pressed,
      FcuComputer_U.in.time.dt, &rtb_y_i, FcuComputer_P.MTrigNode3_isRisingEdge, FcuComputer_P.MTrigNode3_retriggerable,
      FcuComputer_P.MTrigNode3_triggerDuration, &FcuComputer_DWork.sf_MATLABFunction_g);
    rtb_BusAssignment_m.logic.afs.exped_pushed = rtb_OR3_j;
    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.afs_inputs.trk_fpa_button_pressed,
      FcuComputer_P.PulseNode_isRisingEdge_oa, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_a4);
    if (rtb_OR3_j) {
      FcuComputer_DWork.p_trk_fpa_active = !FcuComputer_DWork.p_trk_fpa_active;
    }

    FcuComputer_MATLABFunction_d(FcuComputer_U.in.discrete_inputs.afs_inputs.metric_alt_button_pressed,
      FcuComputer_P.PulseNode1_isRisingEdge_ke, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_ma);
    if (rtb_OR3_j) {
      FcuComputer_DWork.p_metric_alt_active = !FcuComputer_DWork.p_metric_alt_active;
    }

    rtb_BusAssignment_l_logic_afs_any_ap_fd_engaged = (FcuComputer_U.in.discrete_inputs.ap_1_engaged ||
      FcuComputer_U.in.discrete_inputs.ap_2_engaged || FcuComputer_U.in.discrete_inputs.fd_1_engaged ||
      FcuComputer_U.in.discrete_inputs.fd_2_engaged);
    rtb_BusAssignment_m.logic.afs.loc_pushed = rtb_Equal6;
    rtb_BusAssignment_m.logic.afs.spd_mach_switching_pushed = rtb_y_i;
    rtb_BusAssignment_m.logic.fo_efis.fd_on = rtb_Equal7;
    rtb_BusAssignment_m.logic.fo_efis.baro_std = rtb_Equal9;
    rtb_BusAssignment_m.logic.fo_efis.baro_qnh = rtb_DataTypeConversion_d;
    rtb_BusAssignment_m.logic.fo_efis.baro_qfe = rtb_y_h;
    if (rtb_fmgc1Priority) {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_5;
    } else {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_5;
    }

    FcuComputer_MATLABFunction_a(rtb_Switch_k_0, FcuComputer_P.BitfromLabel_bit, &rtb_Switch1_oa);
    FcuComputer_MATLABFunction_m(rtb_Switch_k_0, &rtb_y_i);
    rtb_AND_g = ((rtb_Switch1_oa != 0U) && rtb_y_i);
    FcuComputer_MATLABFunction_a(rtb_Switch_k_0, FcuComputer_P.BitfromLabel1_bit, &rtb_Switch1_oa);
    rtb_AND1_l = (rtb_y_i && (rtb_Switch1_oa != 0U));
    if (rtb_fmgc1Priority) {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_3;
    } else {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_3;
    }

    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel4_bit, &rtb_Switch1_oa);
    rtb_Equal7 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel3_bit, &rtb_Switch1_oa);
    FcuComputer_MATLABFunction_m(rtb_Switch1_2, &rtb_y_i);
    rtb_OR3_j = ((rtb_Equal7 || (rtb_Switch1_oa != 0U)) && rtb_y_i);
    if (rtb_fmgc1Priority) {
      rtb_Switch2_0 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_2;
    } else {
      rtb_Switch2_0 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_2;
    }

    FcuComputer_MATLABFunction_a(rtb_Switch2_0, FcuComputer_P.BitfromLabel6_bit, &rtb_Switch1_oa);
    rtb_y_h = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch2_0, FcuComputer_P.BitfromLabel5_bit, &rtb_Switch1_oa);
    rtb_Equal7 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch2_0, FcuComputer_P.BitfromLabel8_bit, &rtb_Switch1_oa);
    rtb_DataTypeConversion_d = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch2_0, FcuComputer_P.BitfromLabel7_bit, &rtb_Switch1_oa);
    rtb_Equal9 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch2_0, FcuComputer_P.BitfromLabel9_bit, &rtb_Switch1_oa);
    rtb_Equal8 = (rtb_Switch1_oa != 0U);
    if (rtb_fmgc1Priority) {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_4;
    } else {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_4;
    }

    FcuComputer_MATLABFunction_a(rtb_Switch_k_0, FcuComputer_P.BitfromLabel10_bit, &rtb_Switch1_oa);
    FcuComputer_MATLABFunction_m(rtb_Switch2_0, &rtb_y_f);
    rtb_Equal9 = ((rtb_y_h || rtb_Equal7 || rtb_DataTypeConversion_d || rtb_Equal9 || rtb_Equal8 || (rtb_Switch1_oa !=
      0U)) && rtb_y_f);
    FcuComputer_MATLABFunction_a(rtb_Switch2_0, FcuComputer_P.BitfromLabel2_bit, &rtb_Switch1_oa);
    rtb_Equal8 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch2_0, FcuComputer_P.BitfromLabel1_bit_l, &rtb_Switch1_oa);
    rtb_BusAssignment_m.logic.afs.hdg_trk_selected = (rtb_y_f && (rtb_Equal8 || (rtb_Switch1_oa != 0U)));
    FcuComputer_MATLABFunction_m(rtb_Switch1_2, &rtb_y_i);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel2_bit_l, &rtb_Switch1_oa);
    rtb_BusAssignment_m.logic.afs.hdg_trk_preset_available = (rtb_y_i && (rtb_Switch1_oa != 0U));
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel12_bit, &rtb_Switch1_oa);
    rtb_DataTypeConversion_d = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel11_bit, &rtb_Switch1_oa);
    rtb_y_h = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel4_bit_n, &rtb_Switch1_oa);
    rtb_Equal7 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel3_bit_p, &rtb_Switch1_oa);
    FcuComputer_MATLABFunction_m(rtb_Switch1_2, &rtb_y_f);
    rtb_AND2_m = ((rtb_DataTypeConversion_d || rtb_y_h || rtb_Equal7 || (rtb_Switch1_oa != 0U)) && rtb_y_f);
    if (rtb_fmgc1Priority) {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.fm_alt_constraint_ft;
    } else {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.fm_alt_constraint_ft;
    }

    FcuComputer_MATLABFunction_m(rtb_Switch1_2, &rtb_y_i);
    if (rtb_fmgc1Priority) {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_1;
    } else {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_1;
    }

    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel17_bit, &rtb_Switch1_oa);
    rtb_Equal8 = (rtb_y_i && (rtb_Switch1_oa != 0U));
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel16_bit, &rtb_Switch1_oa);
    rtb_Equal6 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel15_bit, &rtb_Switch1_oa);
    rtb_y_i = (rtb_Equal6 || (rtb_Switch1_oa != 0U));
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel14_bit, &rtb_Switch1_oa);
    rtb_Equal6 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel13_bit, &rtb_Switch1_oa);
    rtb_DataTypeConversion_d = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel9_bit_i, &rtb_Switch1_oa);
    rtb_y_f = ((!rtb_Equal6) && (!rtb_DataTypeConversion_d) && (rtb_Switch1_oa == 0U));
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel6_bit_n, &rtb_Switch1_oa);
    rtb_Equal6 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel5_bit_f, &rtb_Switch1_oa);
    rtb_DataTypeConversion_d = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel8_bit_h, &rtb_Switch1_oa);
    rtb_y_h = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel7_bit_j, &rtb_Switch1_oa);
    rtb_Equal7 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch_k_0, FcuComputer_P.BitfromLabel10_bit_c, &rtb_Switch1_oa);
    rtb_DataTypeConversion_d = (rtb_Equal8 || (rtb_y_i && rtb_y_f) || rtb_Equal6 || rtb_DataTypeConversion_d || rtb_y_h ||
      rtb_Equal7 || (rtb_Switch1_oa != 0U));
    FcuComputer_MATLABFunction_m(rtb_Switch1_2, &rtb_y_h);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel2_bit_a, &rtb_Switch1_oa);
    rtb_Equal6 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel1_bit_m, &rtb_Switch1_oa);
    rtb_OR_o = (rtb_Equal6 || (rtb_Switch1_oa != 0U));
    if (rtb_fmgc1Priority) {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_1;
    } else {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_1;
    }

    FcuComputer_MATLABFunction_a(rtb_Switch_k_0, FcuComputer_P.BitfromLabel6_bit_b, &rtb_Switch1_oa);
    FcuComputer_MATLABFunction_m(rtb_Switch_k_0, &rtb_y_i);
    rtb_BusAssignment_m.logic.afs.exped_active = ((rtb_Switch1_oa != 0U) && rtb_y_i);
    if (rtb_fmgc1Priority) {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_3;
    } else {
      rtb_Switch_k_0 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_3;
    }

    FcuComputer_MATLABFunction_m(rtb_Switch_k_0, &rtb_y_f);
    if (rtb_fmgc1Priority) {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_4;
    } else {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_4;
    }

    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel1_bit_i, &rtb_Switch1_oa);
    rtb_Equal6 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch_k_0, FcuComputer_P.BitfromLabel2_bit_g, &rtb_Switch1_oa);
    FcuComputer_MATLABFunction_m(rtb_Switch1_2, &rtb_y_i);
    rtb_Equal6 = ((rtb_Equal6 || (rtb_Switch1_oa != 0U)) && rtb_y_i && rtb_y_f);
    if (rtb_fmgc1Priority) {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_1_bus.discrete_word_2;
    } else {
      rtb_Switch1_2 = &FcuComputer_U.in.bus_inputs.fmgc_2_bus.discrete_word_2;
    }

    FcuComputer_MATLABFunction_m(rtb_Switch1_2, &rtb_y_i);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel5_bit_p, &rtb_Switch1_oa);
    rtb_Equal7 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch1_2, FcuComputer_P.BitfromLabel4_bit_o, &rtb_Switch1_oa);
    rtb_Equal8 = (rtb_Switch1_oa != 0U);
    FcuComputer_MATLABFunction_a(rtb_Switch_k_0, FcuComputer_P.BitfromLabel3_bit_f, &rtb_Switch1_oa);
    rtb_BusAssignment_m.logic.afs.loc_only_active = (rtb_y_i && (rtb_Equal7 || rtb_Equal8 || (rtb_Switch1_oa != 0U)) &&
      rtb_y_f && (!rtb_Equal6));
    rtb_BusAssignment_m.data = FcuComputer_U.in;
    rtb_BusAssignment_m.logic.afs.fmgc_1_has_priority = rtb_fmgc1Priority;
    rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.v_cas_kts = rtb_y;
    rtb_BusAssignment_m.logic.afs.any_ap_fd_engaged = rtb_BusAssignment_l_logic_afs_any_ap_fd_engaged;
    rtb_BusAssignment_m.logic.afs.trk_fpa_active = FcuComputer_DWork.p_trk_fpa_active;
    rtb_BusAssignment_m.logic.afs.metric_alt_active = FcuComputer_DWork.p_metric_alt_active;
    rtb_BusAssignment_m.logic.afs.auto_speed_control = rtb_AND_g;
    rtb_BusAssignment_m.logic.afs.selected_speed_control = rtb_AND1_l;
    rtb_BusAssignment_m.logic.afs.spd_mach_display_value = FcuComputer_P.Constant1_Value.afs.spd_mach_display_value;
    rtb_BusAssignment_m.logic.afs.spd_mach_dashes = FcuComputer_P.Constant1_Value.afs.spd_mach_dashes;
    rtb_BusAssignment_m.logic.afs.hdg_trk_managed = (rtb_OR3_j || rtb_Equal9);
    rtb_BusAssignment_m.logic.afs.hdg_trk_display_value = FcuComputer_P.Constant1_Value.afs.hdg_trk_display_value;
    rtb_BusAssignment_m.logic.afs.hdg_trk_dashes = FcuComputer_P.Constant1_Value.afs.hdg_trk_dashes;
    rtb_BusAssignment_m.logic.afs.alt_display_value = FcuComputer_P.Constant1_Value.afs.alt_display_value;
    rtb_BusAssignment_m.logic.afs.lvl_ch_managed = (rtb_AND2_m || (rtb_DataTypeConversion_d && rtb_y_h));
    rtb_BusAssignment_m.logic.afs.lvl_ch_vs_fpa = (rtb_y_h && rtb_OR_o);
    rtb_BusAssignment_m.logic.afs.vs_fpa_display_value = FcuComputer_P.Constant1_Value.afs.vs_fpa_display_value;
    rtb_BusAssignment_m.logic.afs.vs_fpa_dashes = FcuComputer_P.Constant1_Value.afs.vs_fpa_dashes;
    rtb_BusAssignment_m.logic.afs.lat_value_changed = FcuComputer_P.Constant1_Value.afs.lat_value_changed;
    rtb_BusAssignment_m.logic.afs.alt_value_changed = FcuComputer_P.Constant1_Value.afs.alt_value_changed;
    rtb_BusAssignment_m.logic.afs.vpath_value_changed = FcuComputer_P.Constant1_Value.afs.vpath_value_changed;
    rtb_BusAssignment_m.logic.afs.spd_mach_value_changed = FcuComputer_P.Constant1_Value.afs.spd_mach_value_changed;
    rtb_BusAssignment_m.logic.capt_efis.efis_filter = rtb_BusAssignment_o_efis_filter;
    rtb_BusAssignment_m.logic.capt_efis.baro_qnh = rtb_BusAssignment_o_baro_qnh;
    rtb_BusAssignment_m.logic.capt_efis.baro_qfe = rtb_BusAssignment_o_baro_qfe;
    rtb_BusAssignment_m.logic.fo_efis.efis_filter = rtb_efisFilter;
    rtb_BusAssignment_m.logic.fo_efis.baro_value_hpa = static_cast<real32_T>(rtb_DataTypeConversion3);
    rtb_BusAssignment_m.logic.fo_efis.baro_value_inhg = static_cast<real32_T>(rtb_DataTypeConversion2);
    rtb_BusAssignment_m.discrete_outputs = FcuComputer_P.Constant3_Value;
    rtb_BusAssignment_m.bus_outputs = FcuComputer_P.Constant2_Value;
    rtb_BusAssignment_m.logic.afs.appr_active = rtb_Equal6;
    FcuComputer_MATLABFunction_d((rtb_AND_g || (!rtb_AND1_l)), FcuComputer_P.PulseNode_isRisingEdge_l, &rtb_Equal7,
      &FcuComputer_DWork.sf_MATLABFunction_kl);
    rtb_BusAssignment_o_baro_qfe = !rtb_BusAssignment_l_logic_afs_any_ap_fd_engaged;
    rtb_OR3_j = rtb_BusAssignment_o_baro_qfe;
    FcuComputer_MATLABFunction1(&rtb_BusAssignment_m, rtb_Equal7, (rtb_AND1_l || rtb_BusAssignment_o_baro_qfe ||
      (FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.turns != FcuComputer_P.CompareToConstant_const_p0)),
      &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction1_p);
    if (!FcuComputer_DWork.pValue_not_empty_l) {
      FcuComputer_DWork.pValue_e = rtb_y;
      FcuComputer_DWork.pValue_not_empty_l = true;
    }

    if (FcuComputer_DWork.prevMachActive) {
      FcuComputer_DWork.pValue_e = rtb_y;
    }

    if (rtb_OR3_j) {
      FcuComputer_DWork.pValue_e = rtb_y;
    }

    FcuComputer_DWork.pValue_e += static_cast<real32_T>(FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.turns);
    FcuComputer_DWork.pValue_e = std::fmax(std::fmin(FcuComputer_DWork.pValue_e, 399.0F), 100.0F);
    FcuComputer_DWork.pValue_e = std::round(FcuComputer_DWork.pValue_e);
    FcuComputer_DWork.prevMachActive = false;
    rtb_BusAssignment_m.logic.afs.spd_mach_display_value = FcuComputer_DWork.pValue_e;
    rtb_BusAssignment_m.logic.afs.spd_mach_dashes = rtb_OR3_j;
    FcuComputer_MATLABFunction_d(((!rtb_BusAssignment_m.logic.afs.hdg_trk_selected) &&
      rtb_BusAssignment_l_logic_afs_any_ap_fd_engaged), FcuComputer_P.PulseNode_isRisingEdge_hz, &rtb_y_i,
      &FcuComputer_DWork.sf_MATLABFunction_dc);
    rtb_Equal7 = (rtb_BusAssignment_m.logic.afs.hdg_trk_preset_available && (!FcuComputer_DWork.Delay_DSTATE));
    FcuComputer_MATLABFunction1(&rtb_BusAssignment_m, rtb_y_i, (rtb_BusAssignment_m.logic.afs.hdg_trk_selected ||
      rtb_BusAssignment_o_baro_qfe || (FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.turns !=
      FcuComputer_P.CompareToConstant_const_es) || rtb_Equal7), &FcuComputer_DWork.Delay_DSTATE,
      &FcuComputer_DWork.sf_MATLABFunction1);
    if (!FcuComputer_DWork.pValue_not_empty_lk) {
      if (FcuComputer_DWork.p_trk_fpa_active) {
        FcuComputer_DWork.pValue_j = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.trk_deg;
        FcuComputer_DWork.pValue_not_empty_lk = true;
      } else {
        FcuComputer_DWork.pValue_j = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.hdg_deg;
        FcuComputer_DWork.pValue_not_empty_lk = true;
      }
    }

    if (!FcuComputer_DWork.prevTrkFpaActive_not_empty_c) {
      FcuComputer_DWork.prevTrkFpaActive_a = FcuComputer_DWork.p_trk_fpa_active;
      FcuComputer_DWork.prevTrkFpaActive_not_empty_c = true;
    }

    if (FcuComputer_DWork.prevTrkFpaActive_a != FcuComputer_DWork.p_trk_fpa_active) {
      if (FcuComputer_DWork.p_trk_fpa_active) {
        rtb_y = FcuComputer_DWork.pValue_j - rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.hdg_deg;
      } else {
        rtb_y = FcuComputer_DWork.pValue_j - rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.trk_deg;
      }

      if (rtb_y > 180.0F) {
        rtb_y -= 360.0F;
      } else if (rtb_y < -180.0F) {
        rtb_y += 360.0F;
      }

      rtb_y = std::abs(rtb_y);
      if ((rtb_y < 5.0F) && FcuComputer_DWork.p_trk_fpa_active) {
        FcuComputer_DWork.pValue_j = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.trk_deg;
      } else if ((rtb_y < 5.0F) && (!FcuComputer_DWork.p_trk_fpa_active)) {
        FcuComputer_DWork.pValue_j = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.hdg_deg;
      }
    }

    if (FcuComputer_DWork.Delay_DSTATE) {
      if (FcuComputer_DWork.p_trk_fpa_active) {
        FcuComputer_DWork.pValue_j = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.trk_deg;
        FcuComputer_DWork.pValue_j = std::round(FcuComputer_DWork.pValue_j);
      } else {
        FcuComputer_DWork.pValue_j = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.hdg_deg;
        FcuComputer_DWork.pValue_j = std::round(FcuComputer_DWork.pValue_j);
      }
    }

    FcuComputer_DWork.pValue_j += static_cast<real32_T>(FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.turns);
    FcuComputer_DWork.pValue_j = std::round(FcuComputer_DWork.pValue_j);
    if (FcuComputer_DWork.pValue_j > 359.0F) {
      FcuComputer_DWork.pValue_j -= 360.0F;
    } else if (FcuComputer_DWork.pValue_j < 0.0F) {
      FcuComputer_DWork.pValue_j += 360.0F;
    }

    FcuComputer_DWork.prevTrkFpaActive_a = FcuComputer_DWork.p_trk_fpa_active;
    rtb_BusAssignment_m.logic.afs.hdg_trk_display_value = FcuComputer_DWork.pValue_j;
    rtb_BusAssignment_m.logic.afs.hdg_trk_dashes = FcuComputer_DWork.Delay_DSTATE;
    if (!FcuComputer_DWork.pValue_not_empty_m) {
      FcuComputer_DWork.pValue_n = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.alt_ft;
      FcuComputer_DWork.pValue_not_empty_m = true;
    }

    if (FcuComputer_U.in.discrete_inputs.afs_inputs.alt_increment_1000) {
      FcuComputer_DWork.pValue_n = std::round((static_cast<real32_T>
        (FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.turns) * 1000.0F + FcuComputer_DWork.pValue_n) / 1000.0F) *
        1000.0F;
    } else {
      FcuComputer_DWork.pValue_n = std::round((static_cast<real32_T>
        (FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.turns) * 100.0F + FcuComputer_DWork.pValue_n) / 100.0F) *
        100.0F;
    }

    FcuComputer_DWork.pValue_n = std::fmax(std::fmin(FcuComputer_DWork.pValue_n, 49000.0F), 100.0F);
    rtb_BusAssignment_m.logic.afs.alt_display_value = FcuComputer_DWork.pValue_n;
    FcuComputer_MATLABFunction_d(((!rtb_BusAssignment_m.logic.afs.lvl_ch_vs_fpa) &&
      rtb_BusAssignment_l_logic_afs_any_ap_fd_engaged), FcuComputer_P.PulseNode1_isRisingEdge_e, &rtb_Equal7,
      &FcuComputer_DWork.sf_MATLABFunction_kw);
    rtb_OR3_j = rtb_BusAssignment_o_baro_qfe;
    rtb_Equal6 = (FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.turns !=
                  FcuComputer_P.CompareToConstant_const_o);
    FcuComputer_MATLABFunction1(&rtb_BusAssignment_m, rtb_Equal7, (rtb_BusAssignment_m.logic.afs.lvl_ch_vs_fpa ||
      rtb_BusAssignment_o_baro_qfe || rtb_Equal6), &rtb_Equal8, &FcuComputer_DWork.sf_MATLABFunction1_o);
    FcuComputer_MATLABFunction(rtb_BusAssignment_m.logic.afs.vs_fpa_buttons.pushed, FcuComputer_U.in.time.dt, &rtb_OR3_j,
      FcuComputer_P.MTrigNode_isRisingEdge_kt, FcuComputer_P.MTrigNode_retriggerable_m,
      FcuComputer_P.MTrigNode_triggerDuration_k, &FcuComputer_DWork.sf_MATLABFunction_hh);
    FcuComputer_MATLABFunction_d((rtb_BusAssignment_m.logic.afs.lvl_ch_vs_fpa && rtb_OR3_j),
      FcuComputer_P.PulseNode2_isRisingEdge_k, &rtb_OR3_j, &FcuComputer_DWork.sf_MATLABFunction_ar);
    FcuComputer_MATLABFunction_d((FcuComputer_U.in.discrete_inputs.ap_1_engaged ||
      FcuComputer_U.in.discrete_inputs.ap_2_engaged), FcuComputer_P.PulseNode_isRisingEdge_d, &rtb_Equal6,
      &FcuComputer_DWork.sf_MATLABFunction_ch);
    if (!FcuComputer_DWork.pValue_not_empty) {
      if (FcuComputer_DWork.p_trk_fpa_active) {
        FcuComputer_DWork.pValue = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.fpa_deg;
        FcuComputer_DWork.pValue_not_empty = true;
      } else {
        FcuComputer_DWork.pValue = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.vs_ft_min;
        FcuComputer_DWork.pValue_not_empty = true;
      }
    }

    if (!FcuComputer_DWork.prevTrkFpaActive_not_empty) {
      FcuComputer_DWork.prevTrkFpaActive = FcuComputer_DWork.p_trk_fpa_active;
      FcuComputer_DWork.prevTrkFpaActive_not_empty = true;
    }

    if (FcuComputer_DWork.prevTrkFpaActive != FcuComputer_DWork.p_trk_fpa_active) {
      if (FcuComputer_DWork.p_trk_fpa_active) {
        FcuComputer_DWork.pValue = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.fpa_deg;
      } else {
        FcuComputer_DWork.pValue = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.vs_ft_min;
      }
    }

    if (rtb_Equal6 || rtb_Equal8) {
      if (FcuComputer_DWork.p_trk_fpa_active) {
        FcuComputer_DWork.pValue = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.fpa_deg;
      } else {
        FcuComputer_DWork.pValue = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data.vs_ft_min;
      }
    }

    if (rtb_OR3_j) {
      FcuComputer_DWork.pValue = 0.0F;
    }

    if (FcuComputer_DWork.p_trk_fpa_active) {
      FcuComputer_DWork.pValue += static_cast<real32_T>(FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.turns) *
        0.1F;
      FcuComputer_DWork.pValue = std::fmax(std::fmin(FcuComputer_DWork.pValue, 9.9F), -9.9F);
      FcuComputer_DWork.pValue = std::round(FcuComputer_DWork.pValue / 0.1F) * 0.1F;
    } else {
      FcuComputer_DWork.pValue += static_cast<real32_T>(FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.turns) *
        100.0F;
      FcuComputer_DWork.pValue = std::fmax(std::fmin(FcuComputer_DWork.pValue, 6000.0F), -6000.0F);
      FcuComputer_DWork.pValue = std::round(FcuComputer_DWork.pValue / 100.0F) * 100.0F;
    }

    FcuComputer_DWork.prevTrkFpaActive = FcuComputer_DWork.p_trk_fpa_active;
    rtb_BusAssignment_o_baro_qfe = rtb_Equal8;
    FcuComputer_MATLABFunction((FcuComputer_DWork.pValue_j != FcuComputer_DWork.DelayInput1_DSTATE[0]),
      FcuComputer_U.in.time.dt, &rtb_Equal8, FcuComputer_P.MTrigNode_isRisingEdge_i,
      FcuComputer_P.MTrigNode_retriggerable_k, FcuComputer_P.MTrigNode_triggerDuration_m,
      &FcuComputer_DWork.sf_MATLABFunction_av);
    FcuComputer_MATLABFunction((FcuComputer_DWork.pValue_n != FcuComputer_DWork.DelayInput1_DSTATE[1]),
      FcuComputer_U.in.time.dt, &rtb_Equal7, FcuComputer_P.MTrigNode1_isRisingEdge_m,
      FcuComputer_P.MTrigNode1_retriggerable_p, FcuComputer_P.MTrigNode1_triggerDuration_h,
      &FcuComputer_DWork.sf_MATLABFunction_p5r);
    FcuComputer_MATLABFunction((FcuComputer_DWork.pValue != FcuComputer_DWork.DelayInput1_DSTATE[2]),
      FcuComputer_U.in.time.dt, &rtb_Equal6, FcuComputer_P.MTrigNode2_isRisingEdge_hp,
      FcuComputer_P.MTrigNode2_retriggerable_k, FcuComputer_P.MTrigNode2_triggerDuration_a,
      &FcuComputer_DWork.sf_MATLABFunction_lh);
    FcuComputer_MATLABFunction((FcuComputer_DWork.pValue_e != FcuComputer_DWork.DelayInput1_DSTATE[3]),
      FcuComputer_U.in.time.dt, &rtb_OR3_j, FcuComputer_P.MTrigNode3_isRisingEdge_j,
      FcuComputer_P.MTrigNode3_retriggerable_a, FcuComputer_P.MTrigNode3_triggerDuration_h,
      &FcuComputer_DWork.sf_MATLABFunction_oi);
    FcuComputer_MATLABFunction_n(&rtb_BusAssignment_m.logic.capt_efis,
      &FcuComputer_U.in.discrete_inputs.capt_efis_inputs,
      &FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.baro_value_mode,
      &FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.baro_value,
      &FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.baro_mode);
    FcuComputer_MATLABFunction_n(&rtb_BusAssignment_m.logic.fo_efis, &FcuComputer_U.in.discrete_inputs.fo_efis_inputs,
      &FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.baro_value_mode,
      &FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.baro_value,
      &FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.baro_mode);
    if (rtb_fmgc1Priority) {
      FcuComputer_Y.out.bus_outputs.ats_fma_discrete_word.SSM =
        FcuComputer_U.in.bus_inputs.fmgc_1_bus.ats_fma_discrete_word.SSM;
      FcuComputer_Y.out.bus_outputs.ats_fma_discrete_word.Data =
        FcuComputer_U.in.bus_inputs.fmgc_1_bus.ats_fma_discrete_word.Data;
      FcuComputer_Y.out.bus_outputs.fcu_flex_to_temp_deg_c.SSM =
        FcuComputer_U.in.bus_inputs.fmgc_1_bus.flx_to_temp_deg_c.SSM;
      FcuComputer_Y.out.bus_outputs.fcu_flex_to_temp_deg_c.Data =
        FcuComputer_U.in.bus_inputs.fmgc_1_bus.flx_to_temp_deg_c.Data;
      FcuComputer_Y.out.bus_outputs.ats_discrete_word.SSM = FcuComputer_U.in.bus_inputs.fmgc_1_bus.ats_discrete_word.SSM;
      FcuComputer_Y.out.bus_outputs.ats_discrete_word.Data =
        FcuComputer_U.in.bus_inputs.fmgc_1_bus.ats_discrete_word.Data;
    } else {
      FcuComputer_Y.out.bus_outputs.ats_fma_discrete_word.SSM =
        FcuComputer_U.in.bus_inputs.fmgc_2_bus.ats_fma_discrete_word.SSM;
      FcuComputer_Y.out.bus_outputs.ats_fma_discrete_word.Data =
        FcuComputer_U.in.bus_inputs.fmgc_2_bus.ats_fma_discrete_word.Data;
      FcuComputer_Y.out.bus_outputs.fcu_flex_to_temp_deg_c.SSM =
        FcuComputer_U.in.bus_inputs.fmgc_2_bus.flx_to_temp_deg_c.SSM;
      FcuComputer_Y.out.bus_outputs.fcu_flex_to_temp_deg_c.Data =
        FcuComputer_U.in.bus_inputs.fmgc_2_bus.flx_to_temp_deg_c.Data;
      FcuComputer_Y.out.bus_outputs.ats_discrete_word.SSM = FcuComputer_U.in.bus_inputs.fmgc_2_bus.ats_discrete_word.SSM;
      FcuComputer_Y.out.bus_outputs.ats_discrete_word.Data =
        FcuComputer_U.in.bus_inputs.fmgc_2_bus.ats_discrete_word.Data;
    }

    rtb_VectorConcatenate[0] = FcuComputer_U.in.discrete_inputs.capt_efis_inputs.baro_is_inhg;
    rtb_VectorConcatenate[1] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[2] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[3] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[4] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[5] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[6] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[7] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[8] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[9] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[10] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[11] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[12] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[13] = FcuComputer_P.Constant10_Value;
    rtb_VectorConcatenate[14] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant2_Value_g);
    rtb_VectorConcatenate[15] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant1_Value_h);
    rtb_VectorConcatenate[16] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant3_Value_i);
    rtb_VectorConcatenate[17] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant4_Value_n);
    rtb_VectorConcatenate[18] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant5_Value_a);
    FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_left.Data);
    rtb_VectorConcatenate[0] = FcuComputer_U.in.discrete_inputs.fo_efis_inputs.baro_is_inhg;
    rtb_VectorConcatenate[1] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[2] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[3] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[4] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[5] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[6] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[7] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[8] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[9] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[10] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[11] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[12] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[13] = FcuComputer_P.Constant10_Value_a;
    rtb_VectorConcatenate[14] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant2_Value_l);
    rtb_VectorConcatenate[15] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant1_Value_n);
    rtb_VectorConcatenate[16] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant3_Value_e);
    rtb_VectorConcatenate[17] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant4_Value_i);
    rtb_VectorConcatenate[18] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_range ==
      FcuComputer_P.EnumeratedConstant5_Value_k);
    FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_right.Data);
    rtb_VectorConcatenate[0] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant2_Value);
    rtb_VectorConcatenate[1] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant1_Value_b);
    rtb_VectorConcatenate[2] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant3_Value);
    rtb_VectorConcatenate[3] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant4_Value);
    rtb_VectorConcatenate[4] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant5_Value);
    rtb_VectorConcatenate[5] = FcuComputer_P.Constant10_Value_p;
    rtb_VectorConcatenate[6] = (rtb_BusAssignment_o_efis_filter == FcuComputer_P.EnumeratedConstant7_Value_k);
    rtb_VectorConcatenate[7] = (rtb_BusAssignment_o_efis_filter == FcuComputer_P.EnumeratedConstant6_Value_l);
    rtb_VectorConcatenate[8] = (rtb_BusAssignment_o_efis_filter == FcuComputer_P.EnumeratedConstant8_Value_a);
    rtb_VectorConcatenate[9] = (rtb_BusAssignment_o_efis_filter == FcuComputer_P.EnumeratedConstant9_Value_g);
    rtb_VectorConcatenate[10] = (rtb_BusAssignment_o_efis_filter == FcuComputer_P.EnumeratedConstant10_Value_b);
    rtb_VectorConcatenate[11] = rtb_BusAssignment_m.logic.capt_efis.ls_on;
    rtb_y_h = !rtb_BusAssignment_m.logic.capt_efis.fd_on;
    rtb_VectorConcatenate[12] = rtb_y_h;
    rtb_VectorConcatenate[13] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_navaid_1 ==
      FcuComputer_P.EnumeratedConstant12_Value);
    rtb_VectorConcatenate[14] = (FcuComputer_P.EnumeratedConstant12_Value ==
      FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_navaid_2);
    rtb_VectorConcatenate[15] = (FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_navaid_1 ==
      FcuComputer_P.EnumeratedConstant11_Value);
    rtb_VectorConcatenate[16] = (FcuComputer_P.EnumeratedConstant11_Value ==
      FcuComputer_U.in.discrete_inputs.capt_efis_inputs.efis_navaid_2);
    rtb_VectorConcatenate[17] = rtb_BusAssignment_m.logic.capt_efis.baro_std;
    rtb_VectorConcatenate[18] = rtb_BusAssignment_o_baro_qnh;
    FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_left.Data);
    rtb_VectorConcatenate[0] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant2_Value_a);
    rtb_VectorConcatenate[1] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant1_Value_m);
    rtb_VectorConcatenate[2] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant3_Value_l);
    rtb_VectorConcatenate[3] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant4_Value_b);
    rtb_VectorConcatenate[4] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_mode ==
      FcuComputer_P.EnumeratedConstant5_Value_e);
    rtb_VectorConcatenate[5] = FcuComputer_P.Constant10_Value_e;
    rtb_VectorConcatenate[6] = (rtb_efisFilter == FcuComputer_P.EnumeratedConstant7_Value_a);
    rtb_VectorConcatenate[7] = (rtb_efisFilter == FcuComputer_P.EnumeratedConstant6_Value_l4);
    rtb_VectorConcatenate[8] = (rtb_efisFilter == FcuComputer_P.EnumeratedConstant8_Value_p);
    rtb_VectorConcatenate[9] = (rtb_efisFilter == FcuComputer_P.EnumeratedConstant9_Value_o);
    rtb_VectorConcatenate[10] = (rtb_efisFilter == FcuComputer_P.EnumeratedConstant10_Value_e);
    rtb_VectorConcatenate[11] = rtb_BusAssignment_m.logic.fo_efis.ls_on;
    rtb_BusAssignment_o_baro_qnh = !rtb_BusAssignment_m.logic.fo_efis.fd_on;
    rtb_VectorConcatenate[12] = rtb_BusAssignment_o_baro_qnh;
    rtb_VectorConcatenate[13] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_navaid_1 ==
      FcuComputer_P.EnumeratedConstant12_Value_a);
    rtb_VectorConcatenate[14] = (FcuComputer_P.EnumeratedConstant12_Value_a ==
      FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_navaid_2);
    rtb_VectorConcatenate[15] = (FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_navaid_1 ==
      FcuComputer_P.EnumeratedConstant11_Value_o);
    rtb_VectorConcatenate[16] = (FcuComputer_P.EnumeratedConstant11_Value_o ==
      FcuComputer_U.in.discrete_inputs.fo_efis_inputs.efis_navaid_2);
    rtb_VectorConcatenate[17] = rtb_BusAssignment_m.logic.fo_efis.baro_std;
    rtb_VectorConcatenate[18] = rtb_BusAssignment_m.logic.fo_efis.baro_qnh;
    FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_right.Data);
    rtb_VectorConcatenate[0] = rtb_BusAssignment_m.logic.afs.hdg_trk_buttons.pushed;
    rtb_VectorConcatenate[1] = rtb_BusAssignment_m.logic.afs.hdg_trk_buttons.pulled;
    rtb_VectorConcatenate[2] = rtb_BusAssignment_m.logic.afs.loc_pushed;
    rtb_VectorConcatenate[3] = rtb_Equal8;
    rtb_VectorConcatenate[4] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[6] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[7] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[8] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[9] = rtb_fmgc1Priority;
    rtb_VectorConcatenate[10] = !rtb_fmgc1Priority;
    rtb_VectorConcatenate[11] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = rtb_y_h;
    rtb_VectorConcatenate[16] = rtb_BusAssignment_o_baro_qnh;
    rtb_VectorConcatenate[17] = FcuComputer_P.Constant19_Value;
    rtb_VectorConcatenate[18] = FcuComputer_P.Constant19_Value;
    FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &FcuComputer_Y.out.bus_outputs.fcu_discrete_word_2.Data);
    rtb_VectorConcatenate[0] = rtb_BusAssignment_m.logic.afs.spd_mach_buttons.pushed;
    rtb_VectorConcatenate[1] = rtb_BusAssignment_m.logic.afs.spd_mach_buttons.pulled;
    rtb_VectorConcatenate[2] = rtb_Equal7;
    rtb_VectorConcatenate[3] = rtb_Equal6;
    rtb_VectorConcatenate[4] = rtb_OR3_j;
    rtb_VectorConcatenate[5] = rtb_BusAssignment_m.logic.afs.vs_fpa_buttons.pushed;
    rtb_VectorConcatenate[6] = rtb_BusAssignment_m.logic.afs.alt_buttons.pushed;
    rtb_VectorConcatenate[7] = rtb_BusAssignment_m.logic.afs.alt_buttons.pulled;
    rtb_VectorConcatenate[8] = rtb_BusAssignment_m.logic.afs.vs_fpa_buttons.pulled;
    rtb_VectorConcatenate[9] = FcuComputer_DWork.p_metric_alt_active;
    rtb_VectorConcatenate[10] = rtb_BusAssignment_m.logic.afs.spd_mach_switching_pushed;
    rtb_VectorConcatenate[11] = rtb_BusAssignment_m.logic.afs.exped_pushed;
    rtb_VectorConcatenate[12] = rtb_BusAssignment_m.logic.afs.appr_pushed;
    rtb_y_h = !FcuComputer_DWork.p_trk_fpa_active;
    rtb_VectorConcatenate[13] = rtb_y_h;
    rtb_VectorConcatenate[14] = FcuComputer_DWork.p_trk_fpa_active;
    rtb_VectorConcatenate[15] = FcuComputer_P.Constant20_Value;
    rtb_VectorConcatenate[16] = FcuComputer_P.Constant20_Value;
    rtb_VectorConcatenate[17] = FcuComputer_P.Constant20_Value;
    rtb_VectorConcatenate[18] = FcuComputer_P.Constant20_Value;
    FcuComputer_MATLABFunction_e(rtb_VectorConcatenate, &FcuComputer_Y.out.bus_outputs.fcu_discrete_word_1.Data);
    if (rtb_fmgc1Priority) {
      FcuComputer_Y.out.bus_outputs.n1_cmd_percent.SSM = FcuComputer_U.in.bus_inputs.fmgc_1_bus.n1_command_percent.SSM;
      FcuComputer_Y.out.bus_outputs.n1_cmd_percent.Data = FcuComputer_U.in.bus_inputs.fmgc_1_bus.n1_command_percent.Data;
    } else {
      FcuComputer_Y.out.bus_outputs.n1_cmd_percent.SSM = FcuComputer_U.in.bus_inputs.fmgc_2_bus.n1_command_percent.SSM;
      FcuComputer_Y.out.bus_outputs.n1_cmd_percent.Data = FcuComputer_U.in.bus_inputs.fmgc_2_bus.n1_command_percent.Data;
    }

    FcuComputer_Y.out.data = FcuComputer_U.in;
    FcuComputer_Y.out.logic.afs.fmgc_1_has_priority = rtb_fmgc1Priority;
    FcuComputer_Y.out.logic.afs.chosen_fmgc_data = rtb_BusAssignment_m.logic.afs.chosen_fmgc_data;
    FcuComputer_Y.out.logic.afs.any_ap_fd_engaged = rtb_BusAssignment_l_logic_afs_any_ap_fd_engaged;
    FcuComputer_Y.out.logic.afs.trk_fpa_active = FcuComputer_DWork.p_trk_fpa_active;
    FcuComputer_Y.out.logic.afs.metric_alt_active = FcuComputer_DWork.p_metric_alt_active;
    FcuComputer_Y.out.logic.afs.auto_speed_control = rtb_AND_g;
    FcuComputer_Y.out.logic.afs.selected_speed_control = rtb_AND1_l;
    FcuComputer_Y.out.logic.afs.spd_mach_display_value = FcuComputer_DWork.pValue_e;
    FcuComputer_Y.out.logic.afs.spd_mach_dashes = rtb_BusAssignment_m.logic.afs.spd_mach_dashes;
    FcuComputer_Y.out.logic.afs.hdg_trk_managed = rtb_BusAssignment_m.logic.afs.hdg_trk_managed;
    FcuComputer_Y.out.logic.afs.hdg_trk_selected = rtb_BusAssignment_m.logic.afs.hdg_trk_selected;
    FcuComputer_Y.out.logic.afs.hdg_trk_display_value = FcuComputer_DWork.pValue_j;
    FcuComputer_Y.out.logic.afs.hdg_trk_dashes = FcuComputer_DWork.Delay_DSTATE;
    FcuComputer_Y.out.logic.afs.hdg_trk_preset_available = rtb_BusAssignment_m.logic.afs.hdg_trk_preset_available;
    FcuComputer_Y.out.logic.afs.alt_display_value = FcuComputer_DWork.pValue_n;
    FcuComputer_Y.out.logic.afs.lvl_ch_managed = rtb_BusAssignment_m.logic.afs.lvl_ch_managed;
    FcuComputer_Y.out.logic.afs.lvl_ch_vs_fpa = rtb_BusAssignment_m.logic.afs.lvl_ch_vs_fpa;
    FcuComputer_Y.out.logic.afs.vs_fpa_display_value = FcuComputer_DWork.pValue;
    FcuComputer_Y.out.logic.afs.vs_fpa_dashes = rtb_BusAssignment_o_baro_qfe;
    FcuComputer_Y.out.logic.afs.exped_active = rtb_BusAssignment_m.logic.afs.exped_active;
    FcuComputer_Y.out.logic.afs.loc_only_active = rtb_BusAssignment_m.logic.afs.loc_only_active;
    FcuComputer_Y.out.logic.afs.appr_active = rtb_BusAssignment_m.logic.afs.appr_active;
    FcuComputer_Y.out.logic.afs.hdg_trk_buttons = rtb_BusAssignment_m.logic.afs.hdg_trk_buttons;
    FcuComputer_Y.out.logic.afs.spd_mach_buttons = rtb_BusAssignment_m.logic.afs.spd_mach_buttons;
    FcuComputer_Y.out.logic.afs.alt_buttons = rtb_BusAssignment_m.logic.afs.alt_buttons;
    FcuComputer_Y.out.logic.afs.vs_fpa_buttons = rtb_BusAssignment_m.logic.afs.vs_fpa_buttons;
    FcuComputer_Y.out.logic.afs.loc_pushed = rtb_BusAssignment_m.logic.afs.loc_pushed;
    FcuComputer_Y.out.logic.afs.exped_pushed = rtb_BusAssignment_m.logic.afs.exped_pushed;
    FcuComputer_Y.out.logic.afs.appr_pushed = rtb_BusAssignment_m.logic.afs.appr_pushed;
    FcuComputer_Y.out.logic.afs.spd_mach_switching_pushed = rtb_BusAssignment_m.logic.afs.spd_mach_switching_pushed;
    FcuComputer_Y.out.logic.afs.lat_value_changed = rtb_Equal8;
    FcuComputer_Y.out.logic.afs.alt_value_changed = rtb_Equal7;
    FcuComputer_Y.out.logic.afs.vpath_value_changed = rtb_Equal6;
    FcuComputer_Y.out.logic.afs.spd_mach_value_changed = rtb_OR3_j;
    FcuComputer_Y.out.logic.capt_efis = rtb_BusAssignment_m.logic.capt_efis;
    FcuComputer_Y.out.logic.fo_efis = rtb_BusAssignment_m.logic.fo_efis;
    FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.fd_light_on = rtb_BusAssignment_m.logic.capt_efis.fd_on;
    FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.ls_light_on = rtb_BusAssignment_m.logic.capt_efis.ls_on;
    FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.cstr_light_on = (rtb_BusAssignment_o_efis_filter ==
      FcuComputer_P.EnumeratedConstant7_Value);
    FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.wpt_light_on = (rtb_BusAssignment_o_efis_filter ==
      FcuComputer_P.EnumeratedConstant6_Value);
    FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.vord_light_on = (rtb_BusAssignment_o_efis_filter ==
      FcuComputer_P.EnumeratedConstant8_Value);
    FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.ndb_light_on = (rtb_BusAssignment_o_efis_filter ==
      FcuComputer_P.EnumeratedConstant9_Value);
    FcuComputer_Y.out.discrete_outputs.capt_efis_outputs.arpt_light_on = (rtb_BusAssignment_o_efis_filter ==
      FcuComputer_P.EnumeratedConstant10_Value);
    FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.fd_light_on = rtb_BusAssignment_m.logic.fo_efis.fd_on;
    FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.ls_light_on = rtb_BusAssignment_m.logic.fo_efis.ls_on;
    FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.cstr_light_on = (rtb_efisFilter ==
      FcuComputer_P.EnumeratedConstant7_Value_b);
    FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.wpt_light_on = (rtb_efisFilter ==
      FcuComputer_P.EnumeratedConstant6_Value_m);
    FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.vord_light_on = (rtb_efisFilter ==
      FcuComputer_P.EnumeratedConstant8_Value_g);
    FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.ndb_light_on = (rtb_efisFilter ==
      FcuComputer_P.EnumeratedConstant9_Value_c);
    FcuComputer_Y.out.discrete_outputs.fo_efis_outputs.arpt_light_on = (rtb_efisFilter ==
      FcuComputer_P.EnumeratedConstant10_Value_m);
    FcuComputer_Y.out.discrete_outputs.afs_outputs.loc_light_on = rtb_BusAssignment_m.logic.afs.loc_only_active;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.exped_light_on = rtb_BusAssignment_m.logic.afs.exped_active;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.appr_light_on = rtb_BusAssignment_m.logic.afs.appr_active;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.ap_1_light_on = FcuComputer_U.in.discrete_inputs.ap_1_engaged;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.ap_2_light_on = FcuComputer_U.in.discrete_inputs.ap_2_engaged;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.athr_light_on = (FcuComputer_U.in.discrete_inputs.athr_1_engaged ||
      FcuComputer_U.in.discrete_inputs.athr_2_engaged);
    FcuComputer_Y.out.discrete_outputs.afs_outputs.trk_fpa_mode = FcuComputer_DWork.p_trk_fpa_active;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.mach_mode = FcuComputer_P.Constant15_Value;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.spd_mach_value = FcuComputer_DWork.pValue_e;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.spd_mach_dashes = rtb_BusAssignment_m.logic.afs.spd_mach_dashes;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.spd_mach_managed = rtb_AND_g;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.hdg_trk_value = FcuComputer_DWork.pValue_j;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.hdg_trk_dashes = FcuComputer_DWork.Delay_DSTATE;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.hdg_trk_managed = rtb_BusAssignment_m.logic.afs.hdg_trk_managed;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.alt_value = FcuComputer_DWork.pValue_n;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.lvl_ch_managed = rtb_BusAssignment_m.logic.afs.lvl_ch_managed;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.vs_fpa_value = FcuComputer_DWork.pValue;
    FcuComputer_Y.out.discrete_outputs.afs_outputs.vs_fpa_dashes = rtb_BusAssignment_o_baro_qfe;
    FcuComputer_Y.out.discrete_outputs.fcu_healthy = FcuComputer_P.Constant1_Value_i;
    if (FcuComputer_DWork.Delay_DSTATE || FcuComputer_DWork.p_trk_fpa_active) {
      FcuComputer_Y.out.bus_outputs.selected_hdg_deg.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant_Value);
    } else {
      FcuComputer_Y.out.bus_outputs.selected_hdg_deg.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant1_Value);
    }

    FcuComputer_Y.out.bus_outputs.selected_hdg_deg.Data = FcuComputer_DWork.pValue_j;
    FcuComputer_Y.out.bus_outputs.selected_alt_ft.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.selected_alt_ft.Data = FcuComputer_DWork.pValue_n;
    if (rtb_BusAssignment_m.logic.afs.spd_mach_dashes || FcuComputer_P.Constant1_Value_d) {
      FcuComputer_Y.out.bus_outputs.selected_spd_kts.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant_Value);
    } else {
      FcuComputer_Y.out.bus_outputs.selected_spd_kts.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant1_Value);
    }

    FcuComputer_Y.out.bus_outputs.selected_spd_kts.Data = FcuComputer_DWork.pValue_e;
    if (rtb_BusAssignment_o_baro_qfe || FcuComputer_DWork.p_trk_fpa_active) {
      FcuComputer_Y.out.bus_outputs.selected_vz_ft_min.SSM = static_cast<uint32_T>
        (FcuComputer_P.EnumeratedConstant_Value);
    } else {
      FcuComputer_Y.out.bus_outputs.selected_vz_ft_min.SSM = static_cast<uint32_T>
        (FcuComputer_P.EnumeratedConstant1_Value);
    }

    FcuComputer_Y.out.bus_outputs.selected_vz_ft_min.Data = FcuComputer_DWork.pValue;
    if (rtb_BusAssignment_m.logic.afs.spd_mach_dashes || FcuComputer_P.Constant_Value) {
      FcuComputer_Y.out.bus_outputs.selected_mach.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant_Value);
    } else {
      FcuComputer_Y.out.bus_outputs.selected_mach.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant1_Value);
    }

    FcuComputer_Y.out.bus_outputs.selected_mach.Data = FcuComputer_DWork.pValue_e;
    if (FcuComputer_DWork.Delay_DSTATE || rtb_y_h) {
      FcuComputer_Y.out.bus_outputs.selected_trk_deg.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant_Value);
    } else {
      FcuComputer_Y.out.bus_outputs.selected_trk_deg.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant1_Value);
    }

    FcuComputer_Y.out.bus_outputs.selected_trk_deg.Data = FcuComputer_DWork.pValue_j;
    if (rtb_BusAssignment_o_baro_qfe || rtb_y_h) {
      FcuComputer_Y.out.bus_outputs.selected_fpa_deg.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant_Value);
    } else {
      FcuComputer_Y.out.bus_outputs.selected_fpa_deg.SSM = static_cast<uint32_T>(FcuComputer_P.EnumeratedConstant1_Value);
    }

    FcuComputer_Y.out.bus_outputs.selected_fpa_deg.Data = FcuComputer_DWork.pValue;
    FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_left.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.eis_discrete_word_1_right.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_left.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.eis_discrete_word_2_right.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.baro_setting_left_hpa.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.baro_setting_left_hpa.Data = rtb_BusAssignment_m.logic.capt_efis.baro_value_hpa;
    FcuComputer_Y.out.bus_outputs.baro_setting_right_hpa.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.baro_setting_right_hpa.Data = static_cast<real32_T>(rtb_DataTypeConversion3);
    FcuComputer_Y.out.bus_outputs.baro_setting_left_inhg.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.baro_setting_left_inhg.Data = rtb_BusAssignment_m.logic.capt_efis.baro_value_inhg;
    FcuComputer_Y.out.bus_outputs.baro_setting_right_inhg.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.baro_setting_right_inhg.Data = static_cast<real32_T>(rtb_DataTypeConversion2);
    FcuComputer_Y.out.bus_outputs.fcu_discrete_word_2.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_Y.out.bus_outputs.fcu_discrete_word_1.SSM = static_cast<uint32_T>
      (FcuComputer_P.EnumeratedConstant1_Value);
    FcuComputer_DWork.DelayInput1_DSTATE[0] = FcuComputer_DWork.pValue_j;
    FcuComputer_DWork.DelayInput1_DSTATE[1] = FcuComputer_DWork.pValue_n;
    FcuComputer_DWork.DelayInput1_DSTATE[2] = FcuComputer_DWork.pValue;
    FcuComputer_DWork.DelayInput1_DSTATE[3] = FcuComputer_DWork.pValue_e;
  } else {
    FcuComputer_DWork.Runtime_MODE = false;
  }
}

void FcuComputer::initialize()
{
  FcuComputer_DWork.DelayInput1_DSTATE[0] = FcuComputer_P.DetectChange_vinit;
  FcuComputer_DWork.DelayInput1_DSTATE[1] = FcuComputer_P.DetectChange_vinit;
  FcuComputer_DWork.DelayInput1_DSTATE[2] = FcuComputer_P.DetectChange_vinit;
  FcuComputer_DWork.DelayInput1_DSTATE[3] = FcuComputer_P.DetectChange_vinit;
  FcuComputer_DWork.Delay_DSTATE = FcuComputer_P.Delay_InitialCondition;
  FcuComputer_MATLABFunction_j_Init(&FcuComputer_DWork.sf_MATLABFunction_pr);
  FcuComputer_MATLABFunction1_i_Init(&FcuComputer_DWork.sf_MATLABFunction1_h);
  FcuComputer_MATLABFunction_j_Init(&FcuComputer_DWork.sf_MATLABFunction_jp);
  FcuComputer_MATLABFunction1_i_Init(&FcuComputer_DWork.sf_MATLABFunction1_e3);
  FcuComputer_Y.out = FcuComputer_P.out_Y0;
}

void FcuComputer::terminate()
{
}

FcuComputer::FcuComputer():
  FcuComputer_U(),
  FcuComputer_Y(),
  FcuComputer_DWork()
{
}

FcuComputer::~FcuComputer() = default;
