#include "A380PrimComputerFg.h"
#include "A380PrimComputerFg_types.h"
#include "rtwtypes.h"
#include <cmath>
#include <cstring>
#include <stddef.h>
#include "rt_modd.h"
#include "look1_binlxpw.h"
#include "look1_iflf_binlxpw.h"
#include "A380FgOuterLoops.h"

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T
  *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void A380PrimComputerFg::A380PrimComputerFg_LeadLagFilter_Reset(rtDW_LeadLagFilter_A380PrimComputerFg_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PrimComputerFg::A380PrimComputerFg_LeadLagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_C2, real_T rtu_C3,
  real_T rtu_C4, real_T rtu_dt, real_T *rty_Y, rtDW_LeadLagFilter_A380PrimComputerFg_T *localDW)
{
  real_T denom;
  real_T denom_tmp;
  real_T denom_tmp_0;
  real_T tmp;
  real_T tmp_0;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = 2.0 * rtu_C3;
  denom_tmp_0 = rtu_dt * rtu_C4;
  denom = denom_tmp + denom_tmp_0;
  tmp = rtu_dt * rtu_C2;
  tmp_0 = 2.0 * rtu_C1;
  *rty_Y = ((tmp_0 + tmp) / denom * rtu_U + (tmp - tmp_0) / denom * localDW->pU) + (denom_tmp - denom_tmp_0) / denom *
    localDW->pY;
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380PrimComputerFg::A380PrimComputerFg_LagFilter_Reset(rtDW_LagFilter_A380PrimComputerFg_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PrimComputerFg::A380PrimComputerFg_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PrimComputerFg_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380PrimComputerFg::A380PrimComputerFg_LagFilter_j_Reset(rtDW_LagFilter_A380PrimComputerFg_b_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PrimComputerFg::A380PrimComputerFg_LagFilter_b(real32_T rtu_U, real_T rtu_C1, real_T rtu_dt, real32_T *rty_Y,
  rtDW_LagFilter_A380PrimComputerFg_b_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = static_cast<real32_T>((2.0 - denom_tmp) / (denom_tmp + 2.0)) * localDW->pY + (rtu_U * static_cast<real32_T>
    (ca) + localDW->pU * static_cast<real32_T>(ca));
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380PrimComputerFg::A380PrimComputerFg_Voter1(real_T rtu_u1, real_T rtu_u2, real_T rtu_u3, real_T *rty_Y)
{
  real_T v[3];
  int32_T tmp;
  v[0] = rtu_u1;
  v[1] = rtu_u2;
  v[2] = rtu_u3;
  if (rtu_u1 < rtu_u2) {
    if (rtu_u2 < rtu_u3) {
      tmp = 1;
    } else if (rtu_u1 < rtu_u3) {
      tmp = 2;
    } else {
      tmp = 0;
    }
  } else if (rtu_u1 < rtu_u3) {
    tmp = 0;
  } else if (rtu_u2 < rtu_u3) {
    tmp = 2;
  } else {
    tmp = 1;
  }

  *rty_Y = v[tmp];
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_h(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_e(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T
  *rty_y)
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

void A380PrimComputerFg::A380PrimComputerFg_APEngagedLogic(boolean_T rtu_pulsedFcuButton, boolean_T rtu_prevApEngaged,
  boolean_T rtu_groundEngineStartCondition, boolean_T rtu_dualApDiscCondition, boolean_T rtu_groundGa, boolean_T
  rtu_envelopeInhibition, boolean_T rtu_apFdSpecificCondition, const prim_outputs *rtu_apFdSpecificCondition_l,
  boolean_T *rty_engagementCondition, boolean_T *rty_disengagementCondition, boolean_T *rty_ap_inop)
{
  boolean_T tmp;
  *rty_engagementCondition = (rtu_pulsedFcuButton && (!rtu_prevApEngaged) &&
    rtu_apFdSpecificCondition_l->fg_logic.gnd_eng_stop_flt_5s &&
    rtu_apFdSpecificCondition_l->fg_logic.ap_fd_common_condition && rtu_apFdSpecificCondition &&
    (!rtu_envelopeInhibition) && rtu_apFdSpecificCondition_l->fctl_logic.ap_authorised);
  tmp = ((!rtu_apFdSpecificCondition_l->fg_logic.ap_fd_common_condition) || (!rtu_apFdSpecificCondition));
  *rty_disengagementCondition = (tmp || (rtu_pulsedFcuButton && rtu_prevApEngaged) ||
    (rtu_apFdSpecificCondition_l->data.discrete_inputs.capt_priority_takeover_pressed ||
     rtu_apFdSpecificCondition_l->data.discrete_inputs.fo_priority_takeover_pressed) || rtu_dualApDiscCondition ||
    rtu_groundGa || rtu_groundEngineStartCondition || (!rtu_apFdSpecificCondition_l->fctl_logic.ap_authorised));
  *rty_ap_inop = tmp;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_o_Reset(rtDW_MATLABFunction_A380PrimComputerFg_k_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_c(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T
  *rty_y, rtDW_MATLABFunction_A380PrimComputerFg_k_T *localDW)
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

void A380PrimComputerFg::A380PrimComputerFg_Subsystem_Init(boolean_T rtp_initial_condition,
  rtDW_Subsystem_A380PrimComputerFg_T *localDW)
{
  localDW->Memory_PreviousInput = rtp_initial_condition;
}

void A380PrimComputerFg::A380PrimComputerFg_Subsystem_Reset(boolean_T rtp_initial_condition,
  rtDW_Subsystem_A380PrimComputerFg_T *localDW)
{
  localDW->Memory_PreviousInput = rtp_initial_condition;
}

void A380PrimComputerFg::A380PrimComputerFg_Subsystem(boolean_T rtu_S, boolean_T rtu_R, boolean_T rtu_externalActive,
  boolean_T rtu_syncEnable, boolean_T rty_Q[2], rtDW_Subsystem_A380PrimComputerFg_T *localDW,
  rtP_Subsystem_A380PrimComputerFg_T *localP)
{
  uint32_T rowIdx;
  boolean_T rtb_OR1_i;
  rtb_OR1_i = !rtu_syncEnable;
  rowIdx = (((static_cast<uint32_T>((rtu_externalActive && rtu_syncEnable) || (rtb_OR1_i && rtu_S)) << 1) +
             (((!rtu_externalActive) && rtu_syncEnable) || (rtb_OR1_i && rtu_R))) << 1) + localDW->Memory_PreviousInput;
  rty_Q[0U] = localP->Logic_table[rowIdx];
  rty_Q[1U] = localP->Logic_table[rowIdx + 8U];
  localDW->Memory_PreviousInput = rty_Q[0];
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_e_Reset(rtDW_MATLABFunction_A380PrimComputerFg_l_T *localDW)
{
  localDW->previousInput = false;
  localDW->remainingTriggerTime = 0.0;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_hf(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T
  rtp_isRisingEdge, real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_A380PrimComputerFg_l_T
  *localDW)
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

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_em_Reset(rtDW_MATLABFunction_A380PrimComputerFg_b_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_a(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputerFg_b_T *localDW)
{
  if (rtu_u == rtu_isRisingEdge) {
    localDW->timeSinceCondition += rtu_Ts;
    if (localDW->timeSinceCondition >= rtu_timeDelay) {
      localDW->output = rtu_u;
    }
  } else {
    localDW->timeSinceCondition = 0.0;
    localDW->output = rtu_u;
  }

  *rty_y = localDW->output;
}

void A380PrimComputerFg::A380PrimComputerFg_SRFlipFlopwithSyncInput_Init(boolean_T rtp_initial_condition,
  rtDW_SRFlipFlopwithSyncInput_A380PrimComputerFg_T *localDW)
{
  localDW->Memory_PreviousInput = rtp_initial_condition;
}

void A380PrimComputerFg::A380PrimComputerFg_SRFlipFlopwithSyncInput_Reset(boolean_T rtp_initial_condition,
  rtDW_SRFlipFlopwithSyncInput_A380PrimComputerFg_T *localDW)
{
  localDW->Memory_PreviousInput = rtp_initial_condition;
}

void A380PrimComputerFg::A380PrimComputerFg_SRFlipFlopwithSyncInput(boolean_T rtu_S, boolean_T rtu_R, boolean_T
  rtu_externalActive, boolean_T rtu_syncEnable, boolean_T rty_Q[2], rtDW_SRFlipFlopwithSyncInput_A380PrimComputerFg_T
  *localDW, rtP_SRFlipFlopwithSyncInput_A380PrimComputerFg_T *localP)
{
  uint32_T rowIdx;
  boolean_T rtb_OR1_mn;
  rtb_OR1_mn = !rtu_syncEnable;
  rowIdx = (((static_cast<uint32_T>((rtu_externalActive && rtu_syncEnable) || (rtb_OR1_mn && rtu_S)) << 1) +
             (((!rtu_externalActive) && rtu_syncEnable) || (rtb_OR1_mn && rtu_R))) << 1) + localDW->Memory_PreviousInput;
  rty_Q[0U] = localP->Logic_table[rowIdx];
  rty_Q[1U] = localP->Logic_table[rowIdx + 8U];
  localDW->Memory_PreviousInput = rty_Q[0];
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_j(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380PrimComputerFg::A380PrimComputerFg_FCUKnobTurnsUnpack(real32_T rtu_y, int8_T *rty_value, int8_T rtp_field)
{
  int32_T tmp;
  uint32_T v;
  int8_T tmp_0;
  std::memcpy((void *)&v, (void *)&rtu_y, (uint32_T)((size_t)1 * sizeof(uint32_T)));
  if (rtp_field > 31) {
    tmp_0 = MAX_int8_T;
  } else if (rtp_field <= -32) {
    tmp_0 = MIN_int8_T;
  } else {
    tmp_0 = static_cast<int8_T>(rtp_field << 2);
  }

  tmp = tmp_0 + 10;
  if (rtp_field > 31) {
    tmp_0 = MAX_int8_T;
  } else if (rtp_field <= -32) {
    tmp_0 = MIN_int8_T;
  } else {
    tmp_0 = static_cast<int8_T>(rtp_field << 2);
  }

  if (tmp_0 + 10 > 127) {
    tmp = 127;
  }

  if (static_cast<int8_T>(-tmp) >= 0) {
    if (static_cast<int8_T>(-tmp) <= 31) {
      v <<= static_cast<int8_T>(-tmp);
    } else {
      v = 0U;
    }
  } else if (static_cast<int8_T>(-tmp) >= -31) {
    v >>= -static_cast<int8_T>(-tmp);
  } else {
    v = 0U;
  }

  v &= 15U;
  if (v >= 8U) {
    *rty_value = static_cast<int8_T>(static_cast<int32_T>(v) - 16);
  } else {
    *rty_value = static_cast<int8_T>(v);
  }
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction1_Reset(rtDW_MATLABFunction1_A380PrimComputerFg_T *localDW)
{
  localDW->eventTime_not_empty = false;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction1(const prim_outputs *rtu_in, boolean_T rtu_set_dashes,
  boolean_T rtu_set_selection, boolean_T *rty_dashes, rtDW_MATLABFunction1_A380PrimComputerFg_T *localDW)
{
  if (!localDW->eventTime_not_empty) {
    localDW->eventTime = rtu_in->data.time.simulation_time;
    localDW->eventTime_not_empty = true;
  }

  if (rtu_set_dashes) {
    localDW->eventTime = (rtu_in->data.time.simulation_time - 45.0) - 1.0;
  } else if (rtu_set_selection) {
    localDW->eventTime = rtu_in->data.time.simulation_time;
  }

  *rty_dashes = (rtu_in->data.time.simulation_time - localDW->eventTime > 45.0);
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_a5(const base_arinc_429 *rtu_u, real32_T *rty_y)
{
  *rty_y = rtu_u->Data;
}

void A380PrimComputerFg::A380PrimComputerFg_AltitudeChoice(const base_arinc_429 *rtu_altitude_standard_ft, const
  base_arinc_429 *rtu_altitude_corrected_1, const base_arinc_429 *rtu_altitude_corrected_2, boolean_T rtu_useApFdSource1,
  const prim_outputs *rtu_in_Inport_5, base_arinc_429 *rty_alt_ind, rtP_AltitudeChoice_A380PrimComputerFg_T *localP)
{
  base_arinc_429 rtb_Switch2_bx;
  uint32_T rtb_y_mn;
  boolean_T rtb_y_dc;
  if (rtu_useApFdSource1) {
    rtb_Switch2_bx = rtu_in_Inport_5->data.bus_inputs.fcu_1_bus.efis_discrete_word_2;
  } else {
    rtb_Switch2_bx = rtu_in_Inport_5->data.bus_inputs.fcu_2_bus.efis_discrete_word_2;
  }

  A380PrimComputerFg_MATLABFunction_h(&rtb_Switch2_bx, &rtb_y_dc);
  A380PrimComputerFg_MATLABFunction_e(&rtb_Switch2_bx, localP->BitfromLabel1_bit, &rtb_y_mn);
  if ((rtb_y_mn != 0U) || (!rtb_y_dc)) {
    *rty_alt_ind = *rtu_altitude_standard_ft;
  } else if (rtu_useApFdSource1) {
    *rty_alt_ind = *rtu_altitude_corrected_1;
  } else {
    *rty_alt_ind = *rtu_altitude_corrected_2;
  }
}

void A380PrimComputerFg::A380PrimComputerFg_betaestimation1(real32_T rtu_Vcas_kn, real32_T rtu_n_y_g, real_T
  rtu_zeta_deg, real_T rtu_gross_weight_kg, real32_T *rty_beta)
{
  real32_T Vcas;
  Vcas = rtu_Vcas_kn * 0.5144F;
  if (rtu_Vcas_kn >= 30.0F) {
    real32_T tmp;
    tmp = Vcas * Vcas * 0.6125F * 845.0F / (static_cast<real32_T>(rtu_gross_weight_kg) * Vcas);
    *rty_beta = (rtu_n_y_g * 9.81F - tmp * 0.418F * Vcas * static_cast<real32_T>(rtu_zeta_deg * 3.1415926535897931 /
      180.0)) / (tmp * -0.646F * Vcas);
    *rty_beta = *rty_beta * 180.0F / 3.14159274F;
  } else {
    *rty_beta = 0.0F;
  }
}

void A380PrimComputerFg::step()
{
  ap_laws_input rtb_Out_BusCreator_BusCreator1;
  ap_raw_output rtb_output;
  ap_raw_output rtb_output_k;
  base_arinc_429 rtb_Switch2_d;
  base_arinc_429 rtb_Switch5_body_long_accel_g;
  base_arinc_429 rtb_Switch5_body_normal_accel_g;
  base_arinc_429 rtb_Switch5_heading_magnetic_deg;
  base_arinc_429 rtb_Switch5_heading_true_deg;
  base_arinc_429 rtb_Switch5_track_angle_magnetic_deg;
  base_arinc_429 rtb_Switch5_track_angle_true_deg;
  real_T absAdvRateToMaintain;
  real_T rtb_DataTypeConversion11;
  real_T rtb_DataTypeConversion23;
  real_T rtb_DataTypeConversion25;
  real_T rtb_Gain2;
  real_T rtb_Mod1;
  real_T rtb_Mod1_o;
  real_T rtb_Mod2;
  real_T rtb_Mod2_j;
  real_T rtb_Switch5_d_idx_0;
  int32_T high_i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  real32_T rtb_Y_m;
  real32_T rtb_altCorr1;
  real32_T rtb_altCorr2;
  real32_T rtb_altStd;
  real32_T rtb_headingMag;
  real32_T rtb_mach_b;
  real32_T rtb_trackMag;
  real32_T rtb_trackTrue;
  real32_T rtb_vsInert;
  uint32_T rtb_Switch_o_glideslope_deviation_deg_SSM;
  uint32_T rtb_Switch_o_ils_frequency_mhz_SSM;
  uint32_T rtb_Switch_o_localizer_deviation_deg_SSM;
  uint32_T rtb_Switch_o_runway_heading_deg_SSM;
  uint32_T rtb_y;
  int8_T rtb_value_d;
  boolean_T rtb_Logic_af[2];
  boolean_T rtb_Logic_ag[2];
  boolean_T rtb_Logic_bn[2];
  boolean_T rtb_Logic_dt[2];
  boolean_T rtb_Logic_es[2];
  boolean_T rtb_Logic_fj[2];
  boolean_T rtb_Logic_hk[2];
  boolean_T rtb_Logic_op[2];
  boolean_T rtb_Logic_pg[2];
  boolean_T rtb_AND10_j;
  boolean_T rtb_AND2;
  boolean_T rtb_AND2_ci;
  boolean_T rtb_AND3_oo;
  boolean_T rtb_AND4_a;
  boolean_T rtb_AND7_b;
  boolean_T rtb_AND_k1;
  boolean_T rtb_BusAssignment_mv_fg_mode_logic_longitudinal_mode_reversion_vs;
  boolean_T rtb_BusAssignment_mv_fg_mode_logic_longitudinal_modes_fpa_active;
  boolean_T rtb_BusAssignment_p_fg_mode_logic_tcas_alt_acq_cond;
  boolean_T rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond;
  boolean_T rtb_Compare_dy;
  boolean_T rtb_Compare_fz;
  boolean_T rtb_Compare_gc;
  boolean_T rtb_Compare_han_0;
  boolean_T rtb_Compare_i5;
  boolean_T rtb_Compare_j1;
  boolean_T rtb_Compare_jd;
  boolean_T rtb_Compare_oy;
  boolean_T rtb_Compare_pk;
  boolean_T rtb_LowerRelop1;
  boolean_T rtb_LowerRelop1_e;
  boolean_T rtb_LowerRelop1_p;
  boolean_T rtb_NOT1_it;
  boolean_T rtb_NOT1_k_tmp;
  boolean_T rtb_OR2;
  boolean_T rtb_OR2_nm;
  boolean_T rtb_OR3_hg;
  boolean_T rtb_OR4_kx;
  boolean_T rtb_OR_lr;
  boolean_T rtb_ap_fd_1_condition;
  boolean_T rtb_ap_fd_2_condition;
  boolean_T rtb_ap_fd_condition;
  boolean_T rtb_disengagementCondition;
  boolean_T rtb_engagementCondition;
  boolean_T rtb_vsInertValid;
  boolean_T rtb_y_at;
  boolean_T rtb_y_av;
  boolean_T rtb_y_d;
  boolean_T rtb_y_e;
  boolean_T rtb_y_gn;
  boolean_T rtb_y_ld;
  boolean_T rtb_y_nt;
  boolean_T rtb_y_o0;
  boolean_T rtb_y_p3;
  boolean_T vsOrFpaEngaged;
  lateral_law rtb_active_lateral_law;
  tcas_submode rtb_mode;
  vertical_law rtb_active_longitudinal_law;
  static const int16_T b[7]{ 0, 1000, 3333, 4000, 6000, 8000, 10000 };

  static const real_T c[24]{ -3.7631613045100394E-12, -3.7631613045100418E-12, 6.2076488130688133E-12,
    2.3375903616618146E-12, -2.9675180723323623E-12, -2.9675180723323619E-12, 2.2735910872868498E-8,
    1.1446426959338374E-8, -1.4891939010927404E-8, -2.4704337359767112E-9, 1.1555108433994175E-8, -6.25E-9,
    -1.897274956835846E-5, 1.520958826384842E-5, 7.1712086474912069E-6, -4.4094939746938354E-6, 1.3759855421341094E-5,
    2.4370072289329445E-5, 0.05, 0.05, 0.1, 0.1, 0.1, 0.15 };

  const base_arinc_429 *rtb_Switch4_airspeed_true_kn;
  const base_arinc_429 *rtb_Switch4_aoa_corrected_deg;
  const base_arinc_429 *rtb_Switch5_body_lat_accel_g;
  const base_arinc_429 *rtb_Switch5_body_pitch_rate_deg_s;
  const base_arinc_429 *rtb_Switch5_body_roll_rate_deg_s;
  const base_arinc_429 *rtb_Switch5_body_yaw_rate_deg_s;
  const base_arinc_429 *rtb_Switch5_inertial_vertical_speed_ft_s;
  const base_arinc_429 *rtb_Switch5_pitch_angle_deg;
  const base_arinc_429 *rtb_Switch5_roll_angle_deg;
  const base_prim_out_bus *rtb_Switch_0;
  boolean_T guard1;
  boolean_T tmp;
  if (A380PrimComputerFg_U.in.data.sim_data.computer_running) {
    if (!A380PrimComputerFg_DWork.Runtime_MODE) {
      A380PrimComputerFg_DWork.Delay_DSTATE_c = A380PrimComputerFg_P.Delay_InitialCondition;
      A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_P.DelayOneStep_InitialCondition;
      A380PrimComputerFg_DWork.Delay_DSTATE_aw = A380PrimComputerFg_P.Delay_InitialCondition_f;
      A380PrimComputerFg_DWork.icLoad = true;
      A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_P.Delay_InitialCondition_o;
      A380PrimComputerFg_DWork.DelayOneStep_DSTATE_a = A380PrimComputerFg_P.DelayOneStep_InitialCondition_c;
      A380PrimComputerFg_DWork.Delay_DSTATE_bq = A380PrimComputerFg_P.Delay_InitialCondition_a;
      A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_P.DelayOneStep1_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.SRFlipFlop1_initial_condition;
      A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_P.Delay_InitialCondition_ir;
      A380PrimComputerFg_DWork.Delay_DSTATE_me = A380PrimComputerFg_P.Delay_InitialCondition_n;
      A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.SRFlipFlop_initial_condition;
      A380PrimComputerFg_DWork.Delay1_DSTATE = A380PrimComputerFg_P.Delay1_InitialCondition;
      A380PrimComputerFg_DWork.Delay2_DSTATE_n = A380PrimComputerFg_P.Delay2_InitialCondition_b;
      A380PrimComputerFg_DWork.Delay3_DSTATE = A380PrimComputerFg_P.Delay3_InitialCondition;
      A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_P.Delay_InitialCondition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.SRFlipFlop_initial_condition_k;
      A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_P.SRFlipFlop_initial_condition_l;
      A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.SRFlipFlop_initial_condition_b;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ov = A380PrimComputerFg_P.SRFlipFlop_initial_condition_o;
      A380PrimComputerFg_DWork.Memory_PreviousInput_e = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_en = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lg;
      A380PrimComputerFg_DWork.Delay2_DSTATE = A380PrimComputerFg_P.Delay2_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput_d = A380PrimComputerFg_P.SRFlipFlop_initial_condition_oh;
      A380PrimComputerFg_DWork.Memory_PreviousInput_a = A380PrimComputerFg_P.SRFlipFlop_initial_condition_c;
      A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_P.SRFlipFlop_initial_condition_h;
      A380PrimComputerFg_DWork.Memory_PreviousInput_at = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bj;
      A380PrimComputerFg_DWork.Memory_PreviousInput_p = A380PrimComputerFg_P.SRFlipFlop_initial_condition_m;
      A380PrimComputerFg_DWork.Memory_PreviousInput_lm = A380PrimComputerFg_P.SRFlipFlop_initial_condition_g;
      A380PrimComputerFg_DWork.Memory_PreviousInput_o4 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jb;
      A380PrimComputerFg_DWork.Memory_PreviousInput_eu = A380PrimComputerFg_P.SRFlipFlop_initial_condition_n;
      A380PrimComputerFg_DWork.Memory_PreviousInput_k = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d;
      A380PrimComputerFg_DWork.Memory_PreviousInput_f = A380PrimComputerFg_P.SRFlipFlop_initial_condition_db;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ox = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lv;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_i = A380PrimComputerFg_P.DetectChange_vinit_m;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ek = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_g;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_k = A380PrimComputerFg_P.DetectChange_vinit_p;
      A380PrimComputerFg_DWork.Memory_PreviousInput_l1 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jn;
      A380PrimComputerFg_DWork.Memory_PreviousInput_e0 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_i;
      A380PrimComputerFg_DWork.Memory_PreviousInput_hw = A380PrimComputerFg_P.SRFlipFlop2_initial_condition;
      A380PrimComputerFg_DWork.Memory_PreviousInput_oz = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_n;
      A380PrimComputerFg_DWork.Memory_PreviousInput_og = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_c;
      A380PrimComputerFg_DWork.Memory_PreviousInput_oy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_p;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE = A380PrimComputerFg_P.DetectChange_vinit;
      A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.SRFlipFlop_initial_condition_a;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ei = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bp;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_j = A380PrimComputerFg_P.DetectChange_vinit_a;
      A380PrimComputerFg_DWork.Memory_PreviousInput_kj = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lk;
      A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ok;
      A380PrimComputerFg_DWork.Memory_PreviousInput_kc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mc;
      A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j1;
      A380PrimComputerFg_DWork.Memory_PreviousInput_il = A380PrimComputerFg_P.SRFlipFlop_initial_condition_md;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_f = A380PrimComputerFg_P.DetectDecrease_vinit;
      A380PrimComputerFg_DWork.Memory_PreviousInput_lp = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ac;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ae = A380PrimComputerFg_P.SRFlipFlop_initial_condition_hq;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ik = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_f;
      A380PrimComputerFg_DWork.Memory_PreviousInput_kx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jq;
      A380PrimComputerFg_DWork.Memory_PreviousInput_b = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d;
      A380PrimComputerFg_DWork.Memory_PreviousInput_pt = A380PrimComputerFg_P.SRFlipFlop2_initial_condition_e;
      A380PrimComputerFg_DWork.Delay_DSTATE_p = A380PrimComputerFg_P.Delay_InitialCondition_h;
      A380PrimComputerFg_DWork.Memory_PreviousInput_od = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_hx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pb;
      A380PrimComputerFg_DWork.Memory_PreviousInput_py = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mv;
      A380PrimComputerFg_DWork.Memory_PreviousInput_dp = A380PrimComputerFg_P.SRFlipFlop_initial_condition_f;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_d = A380PrimComputerFg_P.DetectChange_vinit_d;
      A380PrimComputerFg_DWork.Memory_PreviousInput_i5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pq;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ou = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_jw;
      A380PrimComputerFg_DWork.Memory_PreviousInput_jm = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_fn;
      A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d2;
      A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_co;
      A380PrimComputerFg_DWork.Memory_PreviousInput_oyc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ll;
      A380PrimComputerFg_DWork.Memory_PreviousInput_g3 = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_b;
      A380PrimComputerFg_DWork.Delay_DSTATE_o = A380PrimComputerFg_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380PrimComputerFg_DWork.Delay_DSTATE_i = A380PrimComputerFg_P.Delay_InitialCondition_i;
      A380PrimComputerFg_DWork.icLoad_p = true;
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fh);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hf);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a5);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dg);
      A380PrimComputerFg_SRFlipFlopwithSyncInput_Reset(A380PrimComputerFg_P.SRFlipFlopwithSyncInput_initial_condition,
        &A380PrimComputerFg_DWork.SRFlipFlopwithSyncInput_d);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ci);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fp);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pa);
      A380PrimComputerFg_Subsystem_Reset(A380PrimComputerFg_P.Subsystem_initial_condition,
        &A380PrimComputerFg_DWork.Subsystem);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_o5);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fr);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bu);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_d);
      A380PrimComputerFg_Subsystem_Reset(A380PrimComputerFg_P.Subsystem_initial_condition_e,
        &A380PrimComputerFg_DWork.Subsystem_n);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_at);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gf);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cj);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mp);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cs);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eh);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pv);
      A380PrimComputerFg_SRFlipFlopwithSyncInput_Reset(A380PrimComputerFg_P.SRFlipFlopwithSyncInput_initial_condition_l,
        &A380PrimComputerFg_DWork.SRFlipFlopwithSyncInput);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dth);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cia);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_aqw);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lk);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jqs);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_h5);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g0v);
      A380PrimComputerFg_Subsystem_Reset(A380PrimComputerFg_P.Subsystem4_initial_condition,
        &A380PrimComputerFg_DWork.Subsystem4_c);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_du);
      A380PrimComputerFg_Subsystem_Reset(A380PrimComputerFg_P.Subsystem3_initial_condition,
        &A380PrimComputerFg_DWork.Subsystem3);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nv);
      A380PrimComputerFg_Subsystem_Reset(A380PrimComputerFg_P.Subsystem1_initial_condition,
        &A380PrimComputerFg_DWork.Subsystem1);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kmp);
      A380PrimComputerFg_Subsystem_Reset(A380PrimComputerFg_P.Subsystem_initial_condition_l,
        &A380PrimComputerFg_DWork.Subsystem_c);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bby);
      A380PrimComputerFg_MATLABFunction1_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction1_l);
      A380PrimComputerFg_DWork.pValue_not_empty_n = false;
      A380PrimComputerFg_DWork.prevMachActive_not_empty = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cbh);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ckt);
      A380PrimComputerFg_MATLABFunction1_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction1_o);
      A380PrimComputerFg_DWork.pValue_not_empty_a = false;
      A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty_n = false;
      A380PrimComputerFg_DWork.pValue_not_empty_j = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hq5);
      A380PrimComputerFg_MATLABFunction1_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction1_d);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lis);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gw);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fhn);
      A380PrimComputerFg_DWork.pValue_not_empty = false;
      A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty = false;
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eu);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_c4);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ks);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oe);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gm);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_na);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ll);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cd);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hv2);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ph);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eo);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mn);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a0);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_byg);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cg);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pq0);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_it);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ai);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_h0);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g2i);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fcu);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_an);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_br);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ld);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ox);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mva);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_li);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_b4);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lw);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fre);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ab);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ju);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g1d);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bf);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a0v);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g13);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hs);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_my);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ak);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lx);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_b1);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dxv);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_is);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_az);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kdz);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mm);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_n4);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_p4);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_n3);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_aq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nm);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oqd);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_b2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jx);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dvt);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_iy);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jp);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ed);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ep);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fb);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bc);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nab);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_d0);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_on);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kl);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nc);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g4);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_av);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hp);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fy);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oyv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cm);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_os);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kv);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_je);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cn);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_isd);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oa);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eow);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bii);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oy);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_f34);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_h4e);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oz);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oh);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cd0);
      A380PrimComputerFg_LagFilter_j_Reset(&A380PrimComputerFg_DWork.sf_LagFilter_b4);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l1);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l0a);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ob);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hw);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pw);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gg);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_j2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oks);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_erf);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jfh);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kdl);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nvo);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dm);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ocv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lwx);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ef);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fk);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jo);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_n11);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ok);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_j0);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a0p);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lth);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_d4);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dxb);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ep5);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_llo);
      A380PrimComputerFg_DWork.vMemoEo_not_empty = false;
      A380PrimComputerFg_DWork.vMemoGa_not_empty = false;
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ar);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dgp);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ps);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bo);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_iv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l0);
      A380PrimComputerFg_Subsystem_Reset(A380PrimComputerFg_P.Subsystem4_initial_condition_p,
        &A380PrimComputerFg_DWork.Subsystem4);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_k1);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_o3);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pl);
      A380PrimComputerFg_MATLABFunction_em_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bl);
      A380PrimComputerFg_MATLABFunction_e_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kw);
      A380PrimComputerFg_LagFilter_Reset(&A380PrimComputerFg_DWork.sf_LagFilter_c);
      LawMDLOBJ1.reset();
      A380PrimComputerFg_LagFilter_Reset(&A380PrimComputerFg_DWork.sf_LagFilter_f);
      Law1MDLOBJ2.reset();
      A380PrimComputerFg_DWork.pY_not_empty_g = false;
      A380PrimComputerFg_DWork.pU_not_empty_o = false;
      A380PrimComputerFg_LeadLagFilter_Reset(&A380PrimComputerFg_DWork.sf_LeadLagFilter);
      A380PrimComputerFg_LeadLagFilter_Reset(&A380PrimComputerFg_DWork.sf_LeadLagFilter_c);
      A380PrimComputerFg_LagFilter_Reset(&A380PrimComputerFg_DWork.sf_LagFilter);
      A380PrimComputerFg_LagFilter_j_Reset(&A380PrimComputerFg_DWork.sf_LagFilter_b);
      A380PrimComputerFg_DWork.pY_not_empty = false;
      A380PrimComputerFg_DWork.pU_not_empty = false;
      A380PrimComputerFg_DWork.pY_not_empty_c = false;
      A380PrimComputerFg_DWork.Runtime_MODE = true;
    }

    A380PrimComputerFg_MATLABFunction_a(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay, &rtb_y_ld, &A380PrimComputerFg_DWork.sf_MATLABFunction_fh);
    rtb_OR4_kx = (((!A380PrimComputerFg_U.in.general_logic.engine_running) &&
                   A380PrimComputerFg_U.in.general_logic.on_ground) || rtb_y_ld);
    rtb_AND_k1 = !A380PrimComputerFg_U.in.fctl_logic.is_master_prim;
    rtb_y_gn = ((!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy) &&
                (!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_2_healthy));
    rtb_AND10_j = (((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_2 &&
                     A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy) ||
                    ((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_1 ||
                      A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_3) &&
                     (!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_2_healthy))) &&
                   A380PrimComputerFg_U.in.fctl_logic.is_master_prim);
    rtb_AND2 = (((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_2 &&
                  (!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy)) ||
                 ((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_1 ||
                   A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_3) &&
                  A380PrimComputerFg_U.in.data.discrete_inputs.fcu_2_healthy)) &&
                A380PrimComputerFg_U.in.fctl_logic.is_master_prim);
    if (rtb_AND10_j) {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.SSM;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.Data =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2 =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2;
    } else if (rtb_AND2) {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.SSM;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.Data =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2 =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2;
    } else {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.SSM =
        A380PrimComputerFg_P.Constant_Value_h.SSM;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.Data =
        A380PrimComputerFg_P.Constant_Value_h.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2 = A380PrimComputerFg_P.Constant_Value_h;
    }

    rtb_OR2 = rtb_AND10_j;
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg,
      &rtb_y_av);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg,
      &rtb_y_ld);
    rtb_y_at = (rtb_y_av && rtb_y_ld);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg,
      &rtb_y_av);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg,
      &rtb_y_ld);
    rtb_y_nt = (rtb_y_av && rtb_y_ld);
    rtb_OR2_nm = ((!rtb_y_at) && (!rtb_y_nt));
    rtb_vsInertValid = (rtb_y_at && rtb_y_nt);
    if (rtb_y_nt) {
      rtb_Switch_o_runway_heading_deg_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.SSM;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.Data;
      rtb_Switch_o_ils_frequency_mhz_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.SSM;
      rtb_headingMag = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.Data;
      rtb_Switch_o_localizer_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.SSM;
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.Data;
      rtb_Switch_o_glideslope_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.SSM;
      rtb_vsInert = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.Data;
    } else {
      rtb_Switch_o_runway_heading_deg_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.SSM;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.Data;
      rtb_Switch_o_ils_frequency_mhz_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.SSM;
      rtb_headingMag = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.Data;
      rtb_Switch_o_localizer_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.SSM;
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.Data;
      rtb_Switch_o_glideslope_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.SSM;
      rtb_vsInert = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.Data;
    }

    rtb_Switch2_d.SSM = rtb_Switch_o_runway_heading_deg_SSM;
    rtb_Switch2_d.Data = rtb_trackTrue;
    rtb_y_at = (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_loc_submode_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active ||
                (A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed &&
                 (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <=
                  A380PrimComputerFg_P.CompareToConstant_const_e)));
    A380PrimComputerFg_MATLABFunction(&rtb_Switch2_d, A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue, &rtb_Y_m);
    if (!rtb_y_at) {
      A380PrimComputerFg_B.u_lyjj = rtb_Y_m;
    }

    if (A380PrimComputerFg_U.in.data.adcn_inputs.fms.backbeam_selected) {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.Data =
        A380PrimComputerFg_P.Gain_Gain_fm * rtb_trackMag;
    } else {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.Data = rtb_trackMag;
    }

    rtb_OR3_hg = rtb_y_at;
    rtb_OR_lr = !rtb_y_gn;
    rtb_ap_fd_condition = ((rtb_OR_lr || (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active)) &&
      ((A380PrimComputerFg_U.in.fctl_logic.pitch_law_capability == a380_pitch_efcs_law::NormalLaw) ||
       (A380PrimComputerFg_U.in.fctl_logic.pitch_law_capability == a380_pitch_efcs_law::AlternateLaw1A) ||
       (A380PrimComputerFg_U.in.fctl_logic.pitch_law_capability == a380_pitch_efcs_law::AlternateLaw1B)) &&
      (!A380PrimComputerFg_U.in.general_logic.double_adr_failure) &&
      (!A380PrimComputerFg_U.in.general_logic.double_ir_failure) &&
      ((!A380PrimComputerFg_U.in.general_logic.all_ra_failure) ||
       ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active))));
    A380PrimComputerFg_MATLABFunction_hf((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rollout_submode_active &&
      (std::abs(A380PrimComputerFg_B.u_lyjj - A380PrimComputerFg_DWork.DelayOneStep_DSTATE) >
       A380PrimComputerFg_P.CompareToConstant_const_f)), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_ld,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge, A380PrimComputerFg_P.MTrigNode_retriggerable,
      A380PrimComputerFg_P.MTrigNode_triggerDuration, &A380PrimComputerFg_DWork.sf_MATLABFunction_hf);
    rtb_ap_fd_2_condition = !rtb_y_ld;
    rtb_ap_fd_1_condition = (rtb_ap_fd_2_condition && ((!A380PrimComputerFg_U.in.general_logic.ir_1_rejected) ||
      (!A380PrimComputerFg_U.in.general_logic.ir_3_rejected)));
    rtb_ap_fd_2_condition = (rtb_ap_fd_2_condition && ((!A380PrimComputerFg_U.in.general_logic.ir_2_rejected) ||
      (!A380PrimComputerFg_U.in.general_logic.ir_3_rejected)));
    rtb_y_at = (rtb_ap_fd_condition && rtb_ap_fd_1_condition);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_k, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge, &rtb_y_av,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_a5);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active
      || A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge, &rtb_y_ld, &A380PrimComputerFg_DWork.sf_MATLABFunction_dg);
    rtb_engagementCondition = (rtb_ap_fd_condition && ((rtb_y_av && (!A380PrimComputerFg_DWork.Delay_DSTATE_aw)) ||
      rtb_y_ld));
    rtb_disengagementCondition = ((!rtb_ap_fd_condition) || A380PrimComputerFg_DWork.Delay_DSTATE_c.fd_auto_disengage ||
      (A380PrimComputerFg_DWork.Delay_DSTATE_aw && rtb_y_av));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
      A380PrimComputerFg_P.BitfromLabel1_bit_d, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
      &rtb_y_av);
    rtb_y_nt = ((rtb_y != 0U) && rtb_y_av);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word,
      A380PrimComputerFg_P.BitfromLabel6_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word,
      &rtb_y_ld);
    if (rtb_y_nt) {
      rtb_Switch_0 = &A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus;
    } else if ((rtb_y != 0U) && rtb_y_ld) {
      rtb_Switch_0 = &A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus;
    } else {
      rtb_Switch_0 = &A380PrimComputerFg_P.Constant_Value;
    }

    if (A380PrimComputerFg_DWork.icLoad) {
      A380PrimComputerFg_DWork.Delay_DSTATE[0] = *rtb_Switch_0;
      A380PrimComputerFg_DWork.Delay_DSTATE[1] = *rtb_Switch_0;
    }

    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit, &rtb_y);
    rtb_y_nt = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel3_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_1, &rtb_y_av);
    A380PrimComputerFg_SRFlipFlopwithSyncInput(rtb_engagementCondition, rtb_disengagementCondition, ((rtb_y_nt || (rtb_y
      != 0U)) && rtb_y_av), rtb_AND_k1, rtb_Logic_dt, &A380PrimComputerFg_DWork.SRFlipFlopwithSyncInput_d,
      &A380PrimComputerFg_P.SRFlipFlopwithSyncInput_d);
    rtb_AND10_j = (rtb_ap_fd_condition && rtb_ap_fd_2_condition);
    A380PrimComputerFg_B.BusAssignment_i.data = A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusAssignment_i.general_logic = A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusAssignment_i.flight_envelope = A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusAssignment_i.laws = A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusAssignment_i.fctl_logic = A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s = rtb_OR4_kx;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active = rtb_AND_k1;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_common_condition = rtb_ap_fd_condition;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_1_condition = rtb_ap_fd_1_condition;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_2_condition = rtb_ap_fd_2_condition;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_engaged = A380PrimComputerFg_U.in.fg_logic.ap_1_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_engaged = A380PrimComputerFg_U.in.fg_logic.ap_2_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.athr_engaged = A380PrimComputerFg_U.in.fg_logic.athr_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_inop = A380PrimComputerFg_U.in.fg_logic.ap_1_inop;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_inop = A380PrimComputerFg_U.in.fg_logic.ap_2_inop;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.athr_inop = A380PrimComputerFg_U.in.fg_logic.athr_inop;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_1_on_adr_3 = A380PrimComputerFg_U.in.fg_logic.ap_fd_1_on_adr_3;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_2_on_adr_3 = A380PrimComputerFg_U.in.fg_logic.ap_fd_2_on_adr_3;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_1_on_ir_3 = A380PrimComputerFg_U.in.fg_logic.ap_fd_1_on_ir_3;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_2_on_ir_3 = A380PrimComputerFg_U.in.fg_logic.ap_fd_2_on_ir_3;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data =
      A380PrimComputerFg_U.in.fg_logic.adirs_computation_data;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.all_fcu_failure = rtb_y_gn;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fcu_1_chosen = rtb_OR2;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fcu_2_chosen = rtb_AND2;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_failure = rtb_OR2_nm;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.both_ils_valid = rtb_vsInertValid;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.runway_heading_deg.SSM =
      rtb_Switch_o_runway_heading_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.runway_heading_deg.Data = rtb_trackTrue;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.ils_frequency_mhz.SSM =
      rtb_Switch_o_ils_frequency_mhz_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.ils_frequency_mhz.Data = rtb_headingMag;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.SSM =
      rtb_Switch_o_localizer_deviation_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM =
      rtb_Switch_o_glideslope_deviation_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg.Data = rtb_vsInert;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_tune_inhibit = rtb_OR3_hg;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.rwy_hdg_memo = A380PrimComputerFg_B.u_lyjj;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_failure =
      !A380PrimComputerFg_U.in.data.adcn_inputs.tcas.tcas_valid;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_mode_available =
      (A380PrimComputerFg_U.in.data.adcn_inputs.tcas.tcas_valid &&
       A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ta_ra_mode &&
       (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft > A380PrimComputerFg_P.CompareToConstant_const));
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic = A380PrimComputerFg_U.in.fg_mode_logic;
    A380PrimComputerFg_B.BusAssignment_i.fg_laws = A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusAssignment_i.discrete_outputs = A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusAssignment_i.analog_outputs = A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusAssignment_i.bus_outputs = A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_engaged = (rtb_y_at && rtb_Logic_dt[0]);
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_inop = !rtb_y_at;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_2_engaged = (rtb_Logic_dt[0] && rtb_AND10_j);
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_2_inop = !rtb_AND10_j;
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.ap_1_pushbutton_pressed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_b, &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_ci);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge, &rtb_y_ld, &A380PrimComputerFg_DWork.sf_MATLABFunction_fp);
    rtb_AND2 = (rtb_y_ld && A380PrimComputerFg_U.in.general_logic.on_ground);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.DelayOneStep_DSTATE_a,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge, &rtb_y_ld, &A380PrimComputerFg_DWork.sf_MATLABFunction_a);
    rtb_OR2 = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active));
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode1_isRisingEdge_p, &rtb_y_av,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pa);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue, &rtb_Y_m);
    rtb_y_at = (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant3_const_h);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue, &rtb_Y_m);
    rtb_y_nt = (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant5_const_i);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue, &rtb_Y_m);
    rtb_AND10_j = (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant4_const_e);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_d, &rtb_Y_m);
    A380PrimComputerFg_APEngagedLogic(rtb_y_d, A380PrimComputerFg_DWork.Delay_DSTATE_b, rtb_AND2, ((rtb_y_ld && rtb_OR2)
      || (A380PrimComputerFg_DWork.DelayOneStep_DSTATE_a && rtb_y_av && (A380PrimComputerFg_P.APEngagedLogic_isSide2 !=
      0.0))), (A380PrimComputerFg_U.in.general_logic.on_ground &&
               (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active || rtb_y_at || rtb_y_nt
                || rtb_AND10_j || (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant6_const_h))),
      ((A380PrimComputerFg_U.in.flight_envelope.v_max_kn <
        A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn) ||
       (A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn <
        A380PrimComputerFg_U.in.flight_envelope.v_ls_kn) ||
       (A380PrimComputerFg_U.in.general_logic.ir_computation_data.theta_deg <
        A380PrimComputerFg_P.CompareToConstant_const_g) ||
       (A380PrimComputerFg_U.in.general_logic.ir_computation_data.theta_deg >
        A380PrimComputerFg_P.CompareToConstant1_const) || (std::abs
      (A380PrimComputerFg_U.in.general_logic.ir_computation_data.phi_deg) >
      A380PrimComputerFg_P.CompareToConstant2_const)), rtb_ap_fd_1_condition, &A380PrimComputerFg_B.BusAssignment_i,
      &rtb_y_ld, &rtb_y_av, &rtb_OR4_kx);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_d, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_1,
      &rtb_ap_fd_1_condition);
    A380PrimComputerFg_Subsystem(rtb_y_ld, rtb_y_av, ((rtb_y != 0U) && rtb_ap_fd_1_condition), rtb_AND_k1, rtb_Logic_hk,
      &A380PrimComputerFg_DWork.Subsystem, &A380PrimComputerFg_P.Subsystem);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.ap_2_pushbutton_pressed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_d, &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_o5);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_k, &rtb_y_ld, &A380PrimComputerFg_DWork.sf_MATLABFunction_fr);
    rtb_OR2 = (rtb_y_ld && A380PrimComputerFg_U.in.general_logic.on_ground);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.DelayOneStep1_DSTATE,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_g, &rtb_y_ld, &A380PrimComputerFg_DWork.sf_MATLABFunction_bu);
    rtb_OR2_nm = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed) &&
                  (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
                  (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active));
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2_nm, A380PrimComputerFg_P.PulseNode1_isRisingEdge_b, &rtb_y_av,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_d);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_g, &rtb_Y_m);
    rtb_y_at = (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant3_const_a);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_b, &rtb_Y_m);
    rtb_y_nt = (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant5_const_n);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_d, &rtb_Y_m);
    rtb_AND10_j = (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant4_const_j);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_f, &rtb_Y_m);
    A380PrimComputerFg_APEngagedLogic(rtb_y_d, A380PrimComputerFg_DWork.Delay_DSTATE_bq, rtb_OR2, ((rtb_y_ld &&
      rtb_OR2_nm) || (A380PrimComputerFg_DWork.DelayOneStep1_DSTATE && rtb_y_av &&
                      (A380PrimComputerFg_P.APEngagedLogic1_isSide2 != 0.0))),
      (A380PrimComputerFg_U.in.general_logic.on_ground &&
       (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active || rtb_y_at || rtb_y_nt ||
        rtb_AND10_j || (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant6_const_a))),
      ((A380PrimComputerFg_U.in.flight_envelope.v_max_kn <
        A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn) ||
       (A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn <
        A380PrimComputerFg_U.in.flight_envelope.v_ls_kn) ||
       (A380PrimComputerFg_U.in.general_logic.ir_computation_data.theta_deg <
        A380PrimComputerFg_P.CompareToConstant_const_d) ||
       (A380PrimComputerFg_U.in.general_logic.ir_computation_data.theta_deg >
        A380PrimComputerFg_P.CompareToConstant1_const_i) || (std::abs
      (A380PrimComputerFg_U.in.general_logic.ir_computation_data.phi_deg) >
      A380PrimComputerFg_P.CompareToConstant2_const_h)), rtb_ap_fd_2_condition, &A380PrimComputerFg_B.BusAssignment_i,
      &rtb_y_ld, &rtb_y_av, &rtb_AND2);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_b, &rtb_y);
    A380PrimComputerFg_Subsystem(rtb_y_ld, rtb_y_av, ((rtb_y != 0U) && rtb_ap_fd_1_condition), rtb_AND_k1, rtb_Logic_af,
      &A380PrimComputerFg_DWork.Subsystem_n, &A380PrimComputerFg_P.Subsystem_n);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_U.in.data.discrete_inputs.athr_instinctive_disc,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_p,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_l, &rtb_y_ld, &A380PrimComputerFg_DWork.sf_MATLABFunction_at);
    A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.Logic_table[(((static_cast<uint32_T>(rtb_y_ld) <<
      1) + A380PrimComputerFg_P.Constant_Value_o) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput];
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.athr_pushbutton,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_p, &rtb_ap_fd_1_condition,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_gf);
    A380PrimComputerFg_MATLABFunction_a
      ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active),
       A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode2_isRisingEdge,
       A380PrimComputerFg_P.ConfirmNode2_timeDelay, &rtb_y_av, &A380PrimComputerFg_DWork.sf_MATLABFunction_cj);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_av, A380PrimComputerFg_P.PulseNode1_isRisingEdge_pq, &rtb_y_p3,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g2);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_p, &rtb_Y_m);
    rtb_ap_fd_2_condition = (rtb_Y_m < A380PrimComputerFg_P.CompareToConstant_const_k);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_i, &rtb_Y_m);
    rtb_y_ld = (rtb_Y_m < A380PrimComputerFg_P.CompareToConstant1_const_h);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_b, &rtb_Y_m);
    rtb_OR2 = (rtb_Y_m < A380PrimComputerFg_P.CompareToConstant2_const_o);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_a, &rtb_Y_m);
    A380PrimComputerFg_MATLABFunction_c((rtb_ap_fd_2_condition && rtb_y_ld && rtb_OR2 && (rtb_Y_m <
      A380PrimComputerFg_P.CompareToConstant3_const)), A380PrimComputerFg_P.PulseNode2_isRisingEdge_m,
      &rtb_disengagementCondition, &A380PrimComputerFg_DWork.sf_MATLABFunction_mp);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.flight_envelope.alpha_floor_condition,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_p, &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_cs);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge, &rtb_y_av, &A380PrimComputerFg_DWork.sf_MATLABFunction_eh);
    A380PrimComputerFg_MATLABFunction_a(false, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode3_isRisingEdge, A380PrimComputerFg_P.ConfirmNode3_timeDelay, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pv);
    rtb_OR_lr = ((!A380PrimComputerFg_U.in.general_logic.triple_adr_failure) &&
                 (!A380PrimComputerFg_U.in.general_logic.triple_ir_failure) &&
                 (!A380PrimComputerFg_DWork.Memory_PreviousInput) && rtb_OR_lr &&
                 (!A380PrimComputerFg_U.in.flight_envelope.speed_scale_lost));
    rtb_ap_fd_2_condition = (rtb_OR_lr && (A380PrimComputerFg_DWork.Delay_DSTATE_c.manual_spd_control_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.auto_spd_control_active) && ((rtb_ap_fd_1_condition &&
      ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft > 100.0) ||
       A380PrimComputerFg_U.in.general_logic.all_ra_failure)) || rtb_y_p3 || rtb_y_d || rtb_y_av));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.ats_discrete_word,
      A380PrimComputerFg_P.BitfromLabel2_bit_dp, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.ats_discrete_word, &rtb_y_av);
    rtb_OR2_nm = !rtb_OR_lr;
    A380PrimComputerFg_SRFlipFlopwithSyncInput(rtb_ap_fd_2_condition, (rtb_OR2_nm ||
      (A380PrimComputerFg_DWork.Delay_DSTATE_m && rtb_ap_fd_1_condition &&
       (!A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active)) ||
      A380PrimComputerFg_U.in.data.discrete_inputs.athr_instinctive_disc || rtb_disengagementCondition ||
      rtb_LowerRelop1), ((rtb_y != 0U) && rtb_y_av), rtb_AND_k1, rtb_Logic_fj,
      &A380PrimComputerFg_DWork.SRFlipFlopwithSyncInput, &A380PrimComputerFg_P.SRFlipFlopwithSyncInput);
    rtb_OR_lr = (A380PrimComputerFg_U.in.general_logic.adr_1_rejected ||
                 A380PrimComputerFg_U.in.data.discrete_inputs.adr_3_on_capt);
    rtb_ap_fd_2_condition = (A380PrimComputerFg_U.in.general_logic.adr_2_rejected ||
      A380PrimComputerFg_U.in.data.discrete_inputs.adr_3_on_fo);
    rtb_y_ld = (A380PrimComputerFg_U.in.general_logic.ir_1_rejected ||
                A380PrimComputerFg_U.in.data.discrete_inputs.ir_3_on_capt);
    rtb_OR2 = (A380PrimComputerFg_U.in.general_logic.ir_2_rejected ||
               A380PrimComputerFg_U.in.data.discrete_inputs.ir_3_on_fo);
    rtb_y_p3 = !rtb_Logic_af[0];
    rtb_ap_fd_1_condition = (rtb_Logic_hk[0] || (rtb_y_p3 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_engaged));
    if (rtb_ap_fd_1_condition && (!rtb_y_ld) && (!A380PrimComputerFg_U.in.general_logic.ir_1_rejected)) {
      rtb_Y_m = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
      rtb_headingMag = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_dir_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_speed_kn =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      rtb_vsInert = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
      rtb_vsInertValid = ((A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM ==
                           static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                          (A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM ==
                           static_cast<uint32_T>(SignStatusMatrix::FunctionalTest)));
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.flight_path_angle_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    } else if ((!rtb_ap_fd_1_condition) && (!rtb_OR2) && (!A380PrimComputerFg_U.in.general_logic.ir_2_rejected)) {
      rtb_Y_m = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
      rtb_headingMag = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_dir_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_speed_kn =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
      rtb_vsInert = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
      rtb_vsInertValid = ((A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM ==
                           static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                          (A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM ==
                           static_cast<uint32_T>(SignStatusMatrix::FunctionalTest)));
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.flight_path_angle_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    } else if ((rtb_ap_fd_1_condition && rtb_y_ld) || ((!rtb_ap_fd_1_condition) && rtb_OR2 &&
                (!A380PrimComputerFg_U.in.general_logic.ir_3_rejected))) {
      rtb_Y_m = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
      rtb_headingMag = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_dir_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_speed_kn =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      rtb_vsInert = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
      rtb_vsInertValid = ((A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM ==
                           static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                          (A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM ==
                           static_cast<uint32_T>(SignStatusMatrix::FunctionalTest)));
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.flight_path_angle_deg =
        A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    } else {
      rtb_Y_m = 0.0F;
      rtb_headingMag = 0.0F;
      rtb_trackTrue = 0.0F;
      rtb_trackMag = 0.0F;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_dir_deg = 0.0F;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_speed_kn = 0.0F;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg = 0.0F;
      rtb_vsInert = 0.0F;
      rtb_vsInertValid = false;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.flight_path_angle_deg = 0.0F;
    }

    if (A380PrimComputerFg_DWork.Delay_DSTATE_c.true_active) {
      rtb_headingMag = rtb_Y_m;
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.track_deg = rtb_trackTrue;
    } else {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.track_deg = rtb_trackMag;
    }

    if (rtb_ap_fd_1_condition && (!rtb_OR_lr) && (!A380PrimComputerFg_U.in.general_logic.adr_1_rejected)) {
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
      rtb_altStd = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
      rtb_altCorr1 = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft.Data;
      rtb_altCorr2 = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft.Data;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
      rtb_Y_m = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_mach_b = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.mach.Data;
    } else if ((!rtb_ap_fd_1_condition) && (!rtb_ap_fd_2_condition) &&
               (!A380PrimComputerFg_U.in.general_logic.adr_2_rejected)) {
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
      rtb_altStd = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
      rtb_altCorr1 = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft.Data;
      rtb_altCorr2 = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft.Data;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
      rtb_Y_m = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_mach_b = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.mach.Data;
    } else if ((rtb_ap_fd_1_condition && rtb_OR_lr) || ((!rtb_ap_fd_1_condition) && rtb_ap_fd_2_condition &&
                (!A380PrimComputerFg_U.in.general_logic.adr_3_rejected))) {
      rtb_trackMag = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
      rtb_altStd = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
      rtb_altCorr1 = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft.Data;
      rtb_altCorr2 = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft.Data;
      rtb_trackTrue = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
      rtb_Y_m = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_mach_b = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.mach.Data;
    } else {
      rtb_trackMag = 0.0F;
      rtb_altStd = 0.0F;
      rtb_altCorr1 = 0.0F;
      rtb_altCorr2 = 0.0F;
      rtb_trackTrue = 0.0F;
      rtb_Y_m = 0.0F;
      rtb_mach_b = 0.0F;
    }

    if (rtb_vsInertValid) {
      rtb_trackMag = rtb_vsInert;
    }

    if (rtb_ap_fd_1_condition) {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.efis_discrete_word_2;
    } else {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.efis_discrete_word_2;
    }

    A380PrimComputerFg_MATLABFunction_h(&rtb_Switch2_d, &rtb_y_d);
    A380PrimComputerFg_MATLABFunction_e(&rtb_Switch2_d, A380PrimComputerFg_P.BitfromLabel1_bit, &rtb_y);
    if ((rtb_y != 0U) || (!rtb_y_d)) {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft = rtb_altStd;
    } else if (rtb_ap_fd_1_condition) {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft = rtb_altCorr1;
    } else {
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft = rtb_altCorr2;
    }

    A380PrimComputerFg_DWork.DelayOneStep_DSTATE = rtb_headingMag;
    rtb_vsInertValid = (rtb_Logic_hk[0] || rtb_Logic_af[0]);
    rtb_y_at = (rtb_vsInertValid || A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_engaged ||
                A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_2_engaged);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_n, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_dth);
    rtb_y_nt = ((!rtb_y_at) || (rtb_LowerRelop1 && A380PrimComputerFg_U.in.general_logic.on_ground));
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged = rtb_y_at;
    absAdvRateToMaintain = std::abs(A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_rate_to_maintain);
    if (absAdvRateToMaintain != 0.0) {
      absAdvRateToMaintain += 200.0;
    } else {
      absAdvRateToMaintain = 0.0;
    }

    if ((!A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_corrective) ||
        (!A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_active)) {
      A380PrimComputerFg_B.u_lyjjl = rtb_trackMag;
    }

    if (A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_corrective) {
      if (A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_rate_to_maintain < 0.0) {
        A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target = -absAdvRateToMaintain;
      } else {
        A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target = absAdvRateToMaintain;
      }
    } else {
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target = A380PrimComputerFg_B.u_lyjjl;
    }

    A380PrimComputerFg_MATLABFunction_hf((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active &&
      (!A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_mode_available)), A380PrimComputerFg_U.in.data.time.dt,
      &A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_ra_inhibited,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_l, A380PrimComputerFg_P.MTrigNode_retriggerable_b,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_a, &A380PrimComputerFg_DWork.sf_MATLABFunction_cia);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.trk_fpa_active,
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_f, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_aqw);
    A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.Logic_table_m[(((static_cast<uint32_T>
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active && rtb_LowerRelop1) << 1) +
      A380PrimComputerFg_DWork.Delay_DSTATE_me) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_g];
    A380PrimComputerFg_DWork.Delay_DSTATE_me = (A380PrimComputerFg_DWork.Memory_PreviousInput_g &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active));
    A380PrimComputerFg_MATLABFunction_hf(A380PrimComputerFg_DWork.Delay_DSTATE_me, A380PrimComputerFg_U.in.data.time.dt,
      &A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.trk_fpa_deselected,
      A380PrimComputerFg_P.MTrigNode1_isRisingEdge, A380PrimComputerFg_P.MTrigNode1_retriggerable,
      A380PrimComputerFg_P.MTrigNode1_triggerDuration, &A380PrimComputerFg_DWork.sf_MATLABFunction_lk);
    A380PrimComputerFg_MATLABFunction_hf((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.clb_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.des_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.app_des_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.glide_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.alt_acq_armed)), A380PrimComputerFg_U.in.data.time.dt,
      &rtb_LowerRelop1, A380PrimComputerFg_P.MTrigNode2_isRisingEdge, A380PrimComputerFg_P.MTrigNode2_retriggerable,
      A380PrimComputerFg_P.MTrigNode2_triggerDuration, &A380PrimComputerFg_DWork.sf_MATLABFunction_jqs);
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longi_large_box_tcas = rtb_LowerRelop1;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_l, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_a, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_h5);
    A380PrimComputerFg_MATLABFunction_c
      (((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active &&
         (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active)) ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active),
       A380PrimComputerFg_P.PulseNode3_isRisingEdge_m, &rtb_ap_fd_1_condition,
       &A380PrimComputerFg_DWork.sf_MATLABFunction_g0v);
    rtb_OR3_hg = ((rtb_LowerRelop1 && A380PrimComputerFg_DWork.Delay1_DSTATE) || rtb_ap_fd_1_condition);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      A380PrimComputerFg_P.BitfromLabel6_bit_h, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      &rtb_ap_fd_1_condition);
    A380PrimComputerFg_Subsystem((rtb_LowerRelop1 && (!A380PrimComputerFg_DWork.Delay1_DSTATE)), rtb_OR3_hg, ((rtb_y !=
      0U) && rtb_ap_fd_1_condition), rtb_AND_k1, rtb_Logic_ag, &A380PrimComputerFg_DWork.Subsystem4_c,
      &A380PrimComputerFg_P.Subsystem4_c);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_k, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_j,
      &rtb_ap_fd_1_condition, &A380PrimComputerFg_DWork.sf_MATLABFunction_du);
    rtb_OR3_hg = (rtb_ap_fd_1_condition && (!A380PrimComputerFg_DWork.Delay2_DSTATE_n));
    rtb_ap_fd_condition = (rtb_ap_fd_1_condition && A380PrimComputerFg_DWork.Delay2_DSTATE_n);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      A380PrimComputerFg_P.BitfromLabel7_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      &rtb_ap_fd_1_condition);
    A380PrimComputerFg_Subsystem(rtb_OR3_hg, rtb_ap_fd_condition, ((rtb_y != 0U) && rtb_ap_fd_1_condition), rtb_AND_k1,
      rtb_Logic_bn, &A380PrimComputerFg_DWork.Subsystem3, &A380PrimComputerFg_P.Subsystem3);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel3_bit_d, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_k,
      &rtb_ap_fd_1_condition, &A380PrimComputerFg_DWork.sf_MATLABFunction_nv);
    rtb_OR3_hg = (rtb_ap_fd_1_condition && (!A380PrimComputerFg_DWork.Delay3_DSTATE));
    rtb_ap_fd_condition = (rtb_ap_fd_1_condition && A380PrimComputerFg_DWork.Delay3_DSTATE);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      A380PrimComputerFg_P.BitfromLabel8_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      &rtb_ap_fd_1_condition);
    A380PrimComputerFg_Subsystem(rtb_OR3_hg, rtb_ap_fd_condition, ((rtb_y != 0U) && rtb_ap_fd_1_condition), rtb_AND_k1,
      rtb_Logic_pg, &A380PrimComputerFg_DWork.Subsystem1, &A380PrimComputerFg_P.Subsystem1);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode4_isRisingEdge,
      &rtb_ap_fd_1_condition, &A380PrimComputerFg_DWork.sf_MATLABFunction_kmp);
    rtb_OR3_hg = (((!A380PrimComputerFg_DWork.Delay_DSTATE_h) && rtb_ap_fd_1_condition) ||
                  A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_mach_mode_activate ||
                  (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate &&
                   (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_mach >
                    A380PrimComputerFg_P.CompareToConstant1_const_k)));
    rtb_y_at = (rtb_ap_fd_1_condition && A380PrimComputerFg_DWork.Delay_DSTATE_h);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      A380PrimComputerFg_P.BitfromLabel5_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      &rtb_ap_fd_1_condition);
    A380PrimComputerFg_Subsystem(rtb_OR3_hg, (rtb_y_at ||
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_spd_mode_activate ||
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate &&
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_kts > A380PrimComputerFg_P.CompareToConstant_const_fo))),
      ((rtb_y != 0U) && rtb_ap_fd_1_condition), rtb_AND_k1, rtb_Logic_op, &A380PrimComputerFg_DWork.Subsystem_c,
      &A380PrimComputerFg_P.Subsystem_c);
    A380PrimComputerFg_B.BusAssignment_i.data = A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusAssignment_i.general_logic = A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusAssignment_i.flight_envelope = A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusAssignment_i.laws = A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusAssignment_i.fctl_logic = A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_engaged = rtb_Logic_hk[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_engaged = rtb_Logic_af[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.athr_engaged = rtb_Logic_fj[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_inop = rtb_OR4_kx;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_inop = rtb_AND2;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.athr_inop = rtb_OR2_nm;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_1_on_adr_3 = rtb_OR_lr;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_2_on_adr_3 = rtb_ap_fd_2_condition;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_1_on_ir_3 = rtb_y_ld;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_2_on_ir_3 = rtb_OR2;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.alignment_dummy =
      A380PrimComputerFg_P.Constant_Value_i;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.heading_deg = rtb_headingMag;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.vertical_speed_ft_min = rtb_trackMag;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.static_pressure_hpa = rtb_trackTrue;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.airspeed_computed_kn = rtb_Y_m;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.mach = rtb_mach_b;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.rwy_hdg_memo = A380PrimComputerFg_B.u_lyjj;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_failure =
      !A380PrimComputerFg_U.in.data.adcn_inputs.tcas.tcas_valid;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_mode_available =
      (A380PrimComputerFg_U.in.data.adcn_inputs.tcas.tcas_valid &&
       A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ta_ra_mode &&
       (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft > A380PrimComputerFg_P.CompareToConstant_const));
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.lateral_modes =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_modes =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.armed_modes = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.active_lateral_law =
      A380PrimComputerFg_U.in.fg_mode_logic.active_lateral_law;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.active_longitudinal_law =
      A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.auto_spd_control_active =
      A380PrimComputerFg_U.in.fg_mode_logic.auto_spd_control_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.manual_spd_control_active =
      A380PrimComputerFg_U.in.fg_mode_logic.manual_spd_control_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.athr_active = A380PrimComputerFg_U.in.fg_mode_logic.athr_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.athr_limited = A380PrimComputerFg_U.in.fg_mode_logic.athr_limited;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.alpha_floor_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.alpha_floor_mode_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.thrust_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.thrust_mode_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.thrust_target_idle =
      A380PrimComputerFg_U.in.fg_mode_logic.thrust_target_idle;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.speed_mach_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.speed_mach_mode_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.retard_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.retard_mode_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.athr_fma_mode =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_mode;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.athr_fma_message =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_message;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.spd_target_kts =
      A380PrimComputerFg_U.in.fg_mode_logic.spd_target_kts;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.pfd_spd_target_kts =
      A380PrimComputerFg_U.in.fg_mode_logic.pfd_spd_target_kts;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.short_term_managed_spd_kts =
      A380PrimComputerFg_U.in.fg_mode_logic.short_term_managed_spd_kts;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.short_term_managed_spd_visible =
      A380PrimComputerFg_U.in.fg_mode_logic.short_term_managed_spd_visible;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.alt_cstr_applicable =
      A380PrimComputerFg_U.in.fg_mode_logic.alt_cstr_applicable;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.alt_sel_or_cstr =
      A380PrimComputerFg_U.in.fg_mode_logic.alt_sel_or_cstr;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_lateral_mode_engaged =
      A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_longitudinal_mode_engaged =
      A380PrimComputerFg_U.in.fg_mode_logic.any_longitudinal_mode_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.lateral_mode_reset = rtb_y_nt;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset = rtb_y_nt;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.hdg_trk_preset_available =
      A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.alt_soft_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.alt_soft_mode_active;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.fd_auto_disengage =
      A380PrimComputerFg_U.in.fg_mode_logic.fd_auto_disengage;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.ap_fd_mode_reversion =
      A380PrimComputerFg_U.in.fg_mode_logic.ap_fd_mode_reversion;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.lateral_mode_reversion =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_mode_reversion;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reversion_vs =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_vs;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reversion_op_clb =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_op_clb;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.pitch_fd_bars_flashing =
      A380PrimComputerFg_U.in.fg_mode_logic.pitch_fd_bars_flashing;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.roll_fd_bars_flashing =
      A380PrimComputerFg_U.in.fg_mode_logic.roll_fd_bars_flashing;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.loc_bc_selection =
      A380PrimComputerFg_U.in.fg_mode_logic.loc_bc_selection;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.vs_target_not_held =
      A380PrimComputerFg_U.in.fg_mode_logic.vs_target_not_held;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_ra_corrective =
      A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_corrective;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.active_tcas_submode =
      A380PrimComputerFg_U.in.fg_mode_logic.active_tcas_submode;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_alt_acq_cond =
      A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_acq_cond;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_alt_hold_cond =
      A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_hold_cond;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.fcu_alt_abv_acft =
      A380PrimComputerFg_U.in.fg_mode_logic.fcu_alt_abv_acft;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.fcu_alt_blw_acft =
      A380PrimComputerFg_U.in.fg_mode_logic.fcu_alt_blw_acft;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.land_2_capability =
      A380PrimComputerFg_U.in.fg_mode_logic.land_2_capability;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.land_3_fail_passive_capability =
      A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_capability;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.land_3_fail_op_capability =
      A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_capability;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tla_to_ga_set =
      A380PrimComputerFg_U.in.fg_mode_logic.tla_to_ga_set;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_spd_mach =
      A380PrimComputerFg_U.in.fg_mode_logic.selected_spd_mach;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.spd_mach_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.spd_mach_dashes;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_hdg_trk =
      A380PrimComputerFg_U.in.fg_mode_logic.selected_hdg_trk;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.hdg_trk_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_dashes;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_alt = A380PrimComputerFg_U.in.fg_mode_logic.selected_alt;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_vs_fpa =
      A380PrimComputerFg_U.in.fg_mode_logic.selected_vs_fpa;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.vs_fpa_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.vs_fpa_dashes;
    A380PrimComputerFg_B.BusAssignment_i.fg_laws = A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusAssignment_i.discrete_outputs = A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusAssignment_i.analog_outputs = A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusAssignment_i.bus_outputs = A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.trk_fpa_active = rtb_Logic_ag[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.metric_alt_active = rtb_Logic_bn[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.true_active = rtb_Logic_pg[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.mach_control_active = rtb_Logic_op[0];
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.manual_spd_control_active,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_j, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_bby);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_e, &rtb_trackMag);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_trackMag, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field);
    A380PrimComputerFg_MATLABFunction1(&A380PrimComputerFg_B.BusAssignment_i, rtb_LowerRelop1,
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.manual_spd_control_active || (rtb_value_d !=
      A380PrimComputerFg_P.CompareToConstant_const_l) || (A380PrimComputerFg_U.in.data.sim_input.spd_mach !=
      A380PrimComputerFg_P.CompareToConstant1_const_j)), &rtb_ap_fd_1_condition,
      &A380PrimComputerFg_DWork.sf_MATLABFunction1_l);
    if (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate) {
      if (rtb_Logic_op[0]) {
        rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_mach;
      } else {
        rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_kts;
      }
    } else {
      rtb_DataTypeConversion23 = A380PrimComputerFg_P.Constant_Value_f;
    }

    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.selected_mach_kts,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_h, &rtb_trackMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.selected_spd_kts,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_dd, &rtb_vsInert);
    absAdvRateToMaintain = A380PrimComputerFg_DWork.Delay_DSTATE_c.spd_target_kts / 1479.1;
    if (rtb_AND_k1) {
      if (rtb_Logic_op[0]) {
        rtb_vsInert = rtb_trackMag;
      }
    } else {
      if (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active || (!rtb_ap_fd_1_condition))
      {
        if (rtb_Logic_op[0]) {
          absAdvRateToMaintain = rtb_mach_b;
        } else {
          absAdvRateToMaintain = rtb_Y_m;
        }
      } else if (rtb_Logic_op[0]) {
        absAdvRateToMaintain = std::sqrt((std::pow(static_cast<real32_T>((std::pow(absAdvRateToMaintain *
          absAdvRateToMaintain + 1.0, 3.5) - 1.0) * 1013.25) / rtb_trackTrue + 1.0F, 0.285714298F) - 1.0F) / 0.2F);
      } else {
        absAdvRateToMaintain = A380PrimComputerFg_DWork.Delay_DSTATE_c.spd_target_kts;
      }

      rtb_vsInert = static_cast<real32_T>(absAdvRateToMaintain);
    }

    if (!A380PrimComputerFg_DWork.pValue_not_empty_n) {
      A380PrimComputerFg_DWork.pValue_e = rtb_vsInert;
      A380PrimComputerFg_DWork.pValue_not_empty_n = true;
    }

    if (!A380PrimComputerFg_DWork.prevMachActive_not_empty) {
      A380PrimComputerFg_DWork.prevMachActive = rtb_Logic_op[0];
      A380PrimComputerFg_DWork.prevMachActive_not_empty = true;
    }

    if (A380PrimComputerFg_U.in.data.sim_input.spd_mach != -1.0F) {
      if (rtb_Logic_op[0]) {
        A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_U.in.data.sim_input.spd_mach / 100.0F;
      } else {
        A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_U.in.data.sim_input.spd_mach;
      }
    }

    if (A380PrimComputerFg_DWork.prevMachActive != rtb_Logic_op[0]) {
      A380PrimComputerFg_DWork.pValue_e = rtb_vsInert;
    }

    if (rtb_AND_k1 || rtb_ap_fd_1_condition) {
      A380PrimComputerFg_DWork.pValue_e = rtb_vsInert;
    }

    if (static_cast<real32_T>(rtb_DataTypeConversion23) > 0.0F) {
      A380PrimComputerFg_DWork.pValue_e = static_cast<real32_T>(rtb_DataTypeConversion23);
    }

    if (rtb_Logic_op[0]) {
      A380PrimComputerFg_DWork.pValue_e += static_cast<real32_T>(rtb_value_d) * 0.01F;
      A380PrimComputerFg_DWork.pValue_e = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_e, 0.99F), 0.1F);
      A380PrimComputerFg_DWork.pValue_e = std::round(A380PrimComputerFg_DWork.pValue_e / 0.01F) * 0.01F;
    } else {
      A380PrimComputerFg_DWork.pValue_e += static_cast<real32_T>(rtb_value_d);
      A380PrimComputerFg_DWork.pValue_e = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_e, 399.0F), 100.0F);
      A380PrimComputerFg_DWork.pValue_e = std::round(A380PrimComputerFg_DWork.pValue_e);
    }

    A380PrimComputerFg_DWork.prevMachActive = rtb_Logic_op[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_spd_mach = A380PrimComputerFg_DWork.pValue_e;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.spd_mach_dashes = rtb_ap_fd_1_condition;
    rtb_y_at = (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active);
    rtb_y_o0 = !rtb_y_at;
    A380PrimComputerFg_MATLABFunction_c((rtb_y_o0 && A380PrimComputerFg_DWork.Delay_DSTATE_c.any_ap_fd_engaged),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_o, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_cbh);
    A380PrimComputerFg_MATLABFunction_c((rtb_y_o0 && (!A380PrimComputerFg_DWork.Delay_DSTATE_c.hdg_trk_preset_available)
      && A380PrimComputerFg_DWork.Delay_DSTATE_c.any_ap_fd_engaged), A380PrimComputerFg_P.PulseNode_isRisingEdge_l,
      &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_ckt);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_ph, &rtb_mach_b);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_mach_b, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_h);
    A380PrimComputerFg_MATLABFunction1(&A380PrimComputerFg_B.BusAssignment_i, (rtb_LowerRelop1 || rtb_y_gn), (rtb_y_at ||
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.any_ap_fd_engaged) || (rtb_value_d !=
      A380PrimComputerFg_P.CompareToConstant_const_mo) || (A380PrimComputerFg_U.in.data.sim_input.hdg_trk !=
      A380PrimComputerFg_P.CompareToConstant1_const_jq) ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.hdg_trk_preset_available), &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction1_o);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.selected_hdg_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_f, &rtb_trackMag);
    tmp = !A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active;
    if (tmp) {
      rtb_trackMag = rtb_headingMag;
    }

    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.selected_trk_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_g, &rtb_mach_b);
    if (tmp) {
      rtb_mach_b = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.track_deg;
    }

    if (!A380PrimComputerFg_DWork.pValue_not_empty_a) {
      if (rtb_Logic_ag[0]) {
        A380PrimComputerFg_DWork.pValue_i = rtb_mach_b;
        A380PrimComputerFg_DWork.pValue_not_empty_a = true;
      } else {
        A380PrimComputerFg_DWork.pValue_i = rtb_trackMag;
        A380PrimComputerFg_DWork.pValue_not_empty_a = true;
      }
    }

    if (!A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty_n) {
      A380PrimComputerFg_DWork.prevTrkFpaActive_i = rtb_Logic_ag[0];
      A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty_n = true;
    }

    if (A380PrimComputerFg_U.in.data.sim_input.hdg_trk != -1.0F) {
      A380PrimComputerFg_DWork.pValue_i = A380PrimComputerFg_U.in.data.sim_input.hdg_trk;
    }

    if (A380PrimComputerFg_DWork.prevTrkFpaActive_i != rtb_Logic_ag[0]) {
      if (rtb_Logic_ag[0]) {
        rtb_altStd = A380PrimComputerFg_DWork.pValue_i - rtb_trackMag;
      } else {
        rtb_altStd = A380PrimComputerFg_DWork.pValue_i - rtb_mach_b;
      }

      if (rtb_altStd > 180.0F) {
        rtb_altStd -= 360.0F;
      } else if (rtb_altStd < -180.0F) {
        rtb_altStd += 360.0F;
      }

      rtb_vsInert = std::abs(rtb_altStd);
      if ((rtb_vsInert < 5.0F) && rtb_Logic_ag[0]) {
        A380PrimComputerFg_DWork.pValue_i = rtb_mach_b;
      } else if ((rtb_vsInert < 5.0F) && (!rtb_Logic_ag[0])) {
        A380PrimComputerFg_DWork.pValue_i = rtb_trackMag;
      }
    }

    if (A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active || rtb_LowerRelop1) {
      if (rtb_Logic_ag[0]) {
        A380PrimComputerFg_DWork.pValue_i = rtb_mach_b;
        A380PrimComputerFg_DWork.pValue_i = std::round(A380PrimComputerFg_DWork.pValue_i);
      } else {
        A380PrimComputerFg_DWork.pValue_i = rtb_trackMag;
        A380PrimComputerFg_DWork.pValue_i = std::round(A380PrimComputerFg_DWork.pValue_i);
      }
    }

    A380PrimComputerFg_DWork.pValue_i += static_cast<real32_T>(rtb_value_d);
    A380PrimComputerFg_DWork.pValue_i = std::round(A380PrimComputerFg_DWork.pValue_i);
    if (A380PrimComputerFg_DWork.pValue_i > 359.0F) {
      A380PrimComputerFg_DWork.pValue_i -= 360.0F;
    } else if (A380PrimComputerFg_DWork.pValue_i < 0.0F) {
      A380PrimComputerFg_DWork.pValue_i += 360.0F;
    }

    A380PrimComputerFg_DWork.prevTrkFpaActive_i = rtb_Logic_ag[0];
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_hdg_trk = A380PrimComputerFg_DWork.pValue_i;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.hdg_trk_dashes = rtb_LowerRelop1;
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_j, &rtb_mach_b);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_mach_b, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_n);
    if (A380PrimComputerFg_B.BusAssignment_i.fg_logic.fcu_1_chosen) {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1;
    } else {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1;
    }

    A380PrimComputerFg_MATLABFunction_e(&rtb_Switch2_d, A380PrimComputerFg_P.BitfromLabel3_bit_o, &rtb_y);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.selected_alt_ft,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_o, &rtb_mach_b);
    if (!A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) {
      rtb_mach_b = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft;
    }

    low_i = (rtb_y != 0U) * 900;
    if (!A380PrimComputerFg_DWork.pValue_not_empty_j) {
      A380PrimComputerFg_DWork.pValue_p = std::round(rtb_mach_b / static_cast<real32_T>(low_i + 100)) *
        (static_cast<real32_T>(low_i) + 100.0F);
      A380PrimComputerFg_DWork.pValue_not_empty_j = true;
    }

    if (A380PrimComputerFg_U.in.data.sim_input.alt != -1.0F) {
      A380PrimComputerFg_DWork.pValue_p = A380PrimComputerFg_U.in.data.sim_input.alt;
    }

    if (A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) {
      A380PrimComputerFg_DWork.pValue_p = rtb_mach_b;
    }

    if ((A380PrimComputerFg_U.in.data.sim_input.alt != -1.0F) || (rtb_value_d != 0)) {
      A380PrimComputerFg_DWork.pValue_p = std::round(((static_cast<real32_T>(low_i + 100) / 2.0F + 1.0F) * static_cast<
        real32_T>(rtb_value_d) + A380PrimComputerFg_DWork.pValue_p) / static_cast<real32_T>(low_i + 100)) * (
        static_cast<real32_T>(low_i) + 100.0F);
    }

    A380PrimComputerFg_DWork.pValue_p = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_p, 49000.0F), 100.0F);
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_alt = A380PrimComputerFg_DWork.pValue_p;
    rtb_y_at = (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active);
    A380PrimComputerFg_MATLABFunction_c(((!rtb_y_at) && A380PrimComputerFg_DWork.Delay_DSTATE_c.any_ap_fd_engaged),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_l, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_hq5);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_n, &rtb_mach_b);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_mach_b, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_e);
    A380PrimComputerFg_MATLABFunction1(&A380PrimComputerFg_B.BusAssignment_i, rtb_LowerRelop1, (rtb_y_at ||
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.any_ap_fd_engaged) || (rtb_value_d !=
      A380PrimComputerFg_P.CompareToConstant_const_mw) || (A380PrimComputerFg_U.in.data.sim_input.vs_fpa !=
      A380PrimComputerFg_P.CompareToConstant1_const_hh)), &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction1_d);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.selected_vs_ft_min,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_c, &rtb_trackMag);
    tmp = !A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active;
    if (tmp) {
      rtb_trackMag = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.vertical_speed_ft_min;
    }

    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.selected_fpa_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_n, &rtb_mach_b);
    if (tmp) {
      rtb_mach_b = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.flight_path_angle_deg;
    }

    A380PrimComputerFg_MATLABFunction_hf(A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_LowerRelop1, A380PrimComputerFg_P.MTrigNode1_isRisingEdge_m,
      A380PrimComputerFg_P.MTrigNode1_retriggerable_o, A380PrimComputerFg_P.MTrigNode1_triggerDuration_f,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lis);
    A380PrimComputerFg_MATLABFunction_c((rtb_y_at && rtb_LowerRelop1), A380PrimComputerFg_P.PulseNode3_isRisingEdge_l,
      &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_gw);
    A380PrimComputerFg_MATLABFunction_c(rtb_vsInertValid, A380PrimComputerFg_P.PulseNode_isRisingEdge_dy, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fhn);
    if (!A380PrimComputerFg_DWork.pValue_not_empty) {
      if (rtb_Logic_ag[0]) {
        A380PrimComputerFg_DWork.pValue = rtb_mach_b;
        A380PrimComputerFg_DWork.pValue_not_empty = true;
      } else {
        A380PrimComputerFg_DWork.pValue = rtb_trackMag;
        A380PrimComputerFg_DWork.pValue_not_empty = true;
      }
    }

    if (!A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty) {
      A380PrimComputerFg_DWork.prevTrkFpaActive = rtb_Logic_ag[0];
      A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty = true;
    }

    if (A380PrimComputerFg_DWork.prevTrkFpaActive != rtb_Logic_ag[0]) {
      if (rtb_Logic_ag[0]) {
        A380PrimComputerFg_DWork.pValue = rtb_mach_b;
      } else {
        A380PrimComputerFg_DWork.pValue = rtb_trackMag;
      }
    }

    if (A380PrimComputerFg_U.in.data.sim_input.vs_fpa != -1.0F) {
      if (rtb_Logic_ag[0]) {
        A380PrimComputerFg_DWork.pValue = A380PrimComputerFg_U.in.data.sim_input.vs_fpa / 10.0F;
      } else {
        A380PrimComputerFg_DWork.pValue = A380PrimComputerFg_U.in.data.sim_input.vs_fpa;
      }
    }

    if (A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active || rtb_y_gn || rtb_AND10_j) {
      if (rtb_Logic_ag[0]) {
        A380PrimComputerFg_DWork.pValue = rtb_mach_b;
      } else {
        A380PrimComputerFg_DWork.pValue = rtb_trackMag;
      }
    }

    if (rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_ra_inhibited) {
      if (A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target >
          A380PrimComputerFg_P.CompareToConstant2_const_n) {
        A380PrimComputerFg_DWork.pValue = rtb_trackMag;
      } else {
        A380PrimComputerFg_DWork.pValue = 0.0F;
      }
    } else if (rtb_LowerRelop1 && A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_corrective) {
      rtb_trackMag = A380PrimComputerFg_DWork.pValue_p -
        A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft;
      if ((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft > 30000.0F) &&
          (rtb_trackMag > 0.0F)) {
        A380PrimComputerFg_DWork.pValue = 500.0F;
      } else {
        if (rtb_trackMag < 0.0F) {
          high_i = -1;
        } else {
          high_i = (rtb_trackMag > 0.0F);
        }

        A380PrimComputerFg_DWork.pValue = 1000.0F * static_cast<real32_T>(high_i);
      }
    }

    if (rtb_Logic_ag[0]) {
      A380PrimComputerFg_DWork.pValue += static_cast<real32_T>(rtb_value_d) * 0.1F;
      A380PrimComputerFg_DWork.pValue = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue, 9.9F), -9.9F);
      A380PrimComputerFg_DWork.pValue = std::round(A380PrimComputerFg_DWork.pValue / 0.1F) * 0.1F;
    } else {
      A380PrimComputerFg_DWork.pValue += static_cast<real32_T>(rtb_value_d) * 100.0F;
      A380PrimComputerFg_DWork.pValue = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue, 6000.0F), -6000.0F);
      A380PrimComputerFg_DWork.pValue = std::round(A380PrimComputerFg_DWork.pValue / 100.0F) * 100.0F;
    }

    A380PrimComputerFg_DWork.prevTrkFpaActive = rtb_Logic_ag[0];
    rtb_AND_k1 = ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) &&
                  A380PrimComputerFg_DWork.Delay_DSTATE_c.alt_cstr_applicable &&
                  (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active) &&
                  A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid);
    if (A380PrimComputerFg_DWork.pValue_p >
        A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) {
      rtb_y_o0 = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft < A380PrimComputerFg_DWork.pValue_p) &&
                  ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft + 250.0 >
                    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) ||
                   rtb_AND_k1));
    } else {
      rtb_y_o0 = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft > A380PrimComputerFg_DWork.pValue_p) &&
                  ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft - 250.0 <
                    A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) ||
                   rtb_AND_k1));
    }

    rtb_AND_k1 = ((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.clb_armed ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.des_armed ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active || rtb_AND_k1) &&
                  (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft != 0.0) && rtb_y_o0);
    if (rtb_AND_k1) {
      absAdvRateToMaintain = A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft;
    } else {
      absAdvRateToMaintain = A380PrimComputerFg_DWork.pValue_p;
    }

    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel1_bit_a, &rtb_y);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge,
      A380PrimComputerFg_P.ConfirmNode_timeDelay, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_eu);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_l, &rtb_mach_b);
    rtb_NOT1_it = (rtb_mach_b < A380PrimComputerFg_P.CompareToConstant3_const_d);
    rtb_OR3_hg = !rtb_NOT1_it;
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_flex_temp_deg,
      &rtb_LowerRelop1);
    rtb_ap_fd_condition = (rtb_NOT1_it && (rtb_mach_b > A380PrimComputerFg_P.CompareToConstant4_const) &&
      rtb_LowerRelop1);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_a, &rtb_mach_b);
    rtb_NOT1_it = (rtb_mach_b < A380PrimComputerFg_P.CompareToConstant5_const);
    rtb_engagementCondition = !rtb_NOT1_it;
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_flex_temp_deg,
      &rtb_LowerRelop1);
    rtb_y_av = (rtb_NOT1_it && (rtb_mach_b > A380PrimComputerFg_P.CompareToConstant6_const) && rtb_LowerRelop1);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_nt, &rtb_mach_b);
    rtb_NOT1_it = (rtb_mach_b < A380PrimComputerFg_P.CompareToConstant7_const);
    rtb_disengagementCondition = !rtb_NOT1_it;
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_flex_temp_deg,
      &rtb_LowerRelop1);
    rtb_AND7_b = (rtb_NOT1_it && (rtb_mach_b > A380PrimComputerFg_P.CompareToConstant8_const) && rtb_LowerRelop1);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_i, &rtb_mach_b);
    rtb_NOT1_it = (rtb_mach_b < A380PrimComputerFg_P.CompareToConstant9_const);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_flex_temp_deg,
      &rtb_LowerRelop1);
    rtb_OR3_hg = ((rtb_OR3_hg || rtb_ap_fd_condition) && (rtb_engagementCondition || rtb_y_av) &&
                  (rtb_disengagementCondition || rtb_AND7_b) && ((!rtb_NOT1_it) || (rtb_NOT1_it && (rtb_mach_b >
      A380PrimComputerFg_P.CompareToConstant10_const) && rtb_LowerRelop1)));
    A380PrimComputerFg_MATLABFunction_c(rtb_OR3_hg, A380PrimComputerFg_P.PulseNode_isRisingEdge_n, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_c4);
    rtb_ap_fd_condition = (((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts >
      A380PrimComputerFg_P.CompareToConstant1_const_l) && (rtb_y != 0U) &&
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active) && rtb_y_gn &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts > A380PrimComputerFg_P.CompareToConstant2_const_d) &&
      (A380PrimComputerFg_U.in.general_logic.flap_handle_index >= A380PrimComputerFg_P.CompareToConstant_const_ov) &&
      rtb_LowerRelop1));
    A380PrimComputerFg_MATLABFunction_a(rtb_ap_fd_condition, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_j, A380PrimComputerFg_P.ConfirmNode_timeDelay_d, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ks);
    A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.Logic_table_m0[((((rtb_y_nt ||
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) && (!rtb_LowerRelop1)) +
      (static_cast<uint32_T>(rtb_ap_fd_condition) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_n];
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.runway_heading_deg,
       A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_m, &rtb_mach_b);
    rtb_Mod1 = rt_modd((rtb_mach_b - (rtb_headingMag + A380PrimComputerFg_P.Constant3_Value_d)) +
                       A380PrimComputerFg_P.Constant3_Value_d, A380PrimComputerFg_P.Constant3_Value_d);
    rtb_Mod2 = rt_modd(A380PrimComputerFg_P.Constant3_Value_d - rtb_Mod1, A380PrimComputerFg_P.Constant3_Value_d);
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg,
       A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_py, &rtb_mach_b);
    if (rtb_mach_b < 0.0F) {
      rtb_DataTypeConversion11 = -rtb_mach_b;
    } else {
      rtb_DataTypeConversion11 = rtb_mach_b;
    }

    A380PrimComputerFg_MATLABFunction_j
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg, &rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_o,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_g, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_oe);
    rtb_ap_fd_condition = ((A380PrimComputerFg_U.in.general_logic.flap_handle_index >=
      A380PrimComputerFg_P.CompareToConstant_const_dl) &&
      (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.backbeam_selected) && A380PrimComputerFg_P.Constant_Value_op &&
      rtb_y_gn && rtb_LowerRelop1 && (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_loc_submode_active) &&
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.vs_fpa_dashes = rtb_AND10_j;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel1_bit_c, &rtb_y);
    rtb_NOT1_it = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel2_bit_e, &rtb_y);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_f,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_o, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_gm);
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.runway_heading_deg,
       A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_d, &rtb_mach_b);
    rtb_Mod1_o = rt_modd((rtb_mach_b - (rtb_headingMag + A380PrimComputerFg_P.Constant3_Value_m)) +
                         A380PrimComputerFg_P.Constant3_Value_m, A380PrimComputerFg_P.Constant3_Value_m);
    rtb_Mod2_j = rt_modd(A380PrimComputerFg_P.Constant3_Value_m - rtb_Mod1_o, A380PrimComputerFg_P.Constant3_Value_m);
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg,
       A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_d, &rtb_mach_b);
    A380PrimComputerFg_MATLABFunction_j
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg, &rtb_AND10_j);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_k,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_m, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_na);
    if (rtb_Mod1_o < rtb_Mod2_j) {
      rtb_DataTypeConversion23 = A380PrimComputerFg_P.Gain1_Gain * rtb_Mod1_o;
    } else {
      rtb_DataTypeConversion23 = A380PrimComputerFg_P.Gain_Gain_f * rtb_Mod2_j;
    }

    if (rtb_mach_b < 0.0F) {
      rtb_Mod2_j = -rtb_mach_b;
    } else {
      rtb_Mod2_j = rtb_mach_b;
    }

    rtb_engagementCondition = ((rtb_NOT1_it && (rtb_y != 0U) &&
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_loc_submode_active) &&
      ((A380PrimComputerFg_U.in.general_logic.flap_handle_index >= A380PrimComputerFg_P.CompareToConstant_const_j0) &&
       rtb_LowerRelop1 && (std::abs(rtb_DataTypeConversion23) <= A380PrimComputerFg_P.CompareToConstant2_const_m) &&
       (rtb_Mod2_j < A380PrimComputerFg_P.CompareToConstant1_const_ia) && A380PrimComputerFg_P.Constant_Value_g0 &&
       rtb_AND10_j && rtb_y_gn)));
    A380PrimComputerFg_MATLABFunction_a(rtb_engagementCondition, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_g, A380PrimComputerFg_P.ConfirmNode_timeDelay_dd, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ll);
    rtb_y_av = !rtb_LowerRelop1;
    A380PrimComputerFg_MATLABFunction_j
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg, &rtb_LowerRelop1);
    A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_P.Logic_table_k[((((rtb_y_av &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_trk_submode_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) || rtb_y_nt || (!rtb_LowerRelop1)) + (
      static_cast<uint32_T>(rtb_engagementCondition) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_o];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel1_bit_cm, &rtb_y);
    rtb_NOT1_it = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel2_bit_j, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
      A380PrimComputerFg_P.CompareToConstant_const_h), A380PrimComputerFg_P.PulseNode_isRisingEdge_le, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cd);
    A380PrimComputerFg_MATLABFunction_hf(rtb_LowerRelop1, A380PrimComputerFg_U.in.data.time.dt, &rtb_y_gn,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_h, A380PrimComputerFg_P.MTrigNode_retriggerable_l,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_hv2);
    rtb_engagementCondition = ((rtb_NOT1_it && (rtb_y != 0U) &&
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.nav_armed)) && rtb_y_gn));
    A380PrimComputerFg_MATLABFunction_a(rtb_engagementCondition, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_b, A380PrimComputerFg_P.ConfirmNode_timeDelay_p, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ph);
    A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.Logic_table_ml[(((((!rtb_LowerRelop1) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_loc_submode_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) || rtb_y_nt) + (static_cast<uint32_T>
      (rtb_engagementCondition) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_h];
    rtb_engagementCondition = (A380PrimComputerFg_DWork.Memory_PreviousInput_o ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_h);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_n, &rtb_y);
    rtb_y_at = ((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_b, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_f, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_eo);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_h,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_df, &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_mn);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_m, &rtb_headingMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_k, &rtb_altStd);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_f, &rtb_trackMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_e, &rtb_mach_b);
    rtb_NOT1_k_tmp = !A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_failure;
    rtb_NOT1_it = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (rtb_y_at || (tmp &&
      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.selected_approach_type ==
        A380PrimComputerFg_P.EnumeratedConstant_Value) && rtb_NOT1_k_tmp &&
       ((!A380PrimComputerFg_U.in.general_logic.engine_running) ||
        (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >= A380PrimComputerFg_P.CompareToConstant_const_kb))
       && (!A380PrimComputerFg_U.in.general_logic.all_ra_failure) && rtb_AND10_j && (!rtb_LowerRelop1) &&
       ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.app_des_armed))) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active) &&
      (!A380PrimComputerFg_P.Constant2_Value_c) && (!A380PrimComputerFg_P.Constant2_Value_c) && (((rtb_headingMag ==
      rtb_altStd) && (rtb_trackMag == rtb_mach_b)) || (!A380PrimComputerFg_B.BusAssignment_i.fg_logic.both_ils_valid)))));
    rtb_AND2_ci = (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active);
    rtb_y_at = (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active),
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_b, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_a0);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_n4,
      &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_dv);
    rtb_y_av = (rtb_y_at && rtb_LowerRelop1);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_li, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_d, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_byg);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ov = A380PrimComputerFg_P.Logic_table_b
      [(((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active || ((!rtb_AND2_ci) &&
           (!rtb_y_at) && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.nav_armed) || ((rtb_AND2_ci && rtb_y_gn) ||
           rtb_y_av) || (rtb_AND10_j && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed) ||
          rtb_LowerRelop1 || rtb_y_nt || A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active) + (
          static_cast<uint32_T>(rtb_NOT1_it) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_ov];
    A380PrimComputerFg_MATLABFunction_a(!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_hr,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_j, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_cg);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_i, &rtb_y);
    A380PrimComputerFg_MATLABFunction_a((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <
      A380PrimComputerFg_P.CompareToConstant_const_b), A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_h, A380PrimComputerFg_P.ConfirmNode1_timeDelay_ll, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pq0);
    rtb_y_av = (rtb_y_gn && (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active &&
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active && rtb_LowerRelop1)));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_av, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ok, A380PrimComputerFg_P.ConfirmNode_timeDelay_gg, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_it);
    rtb_AND7_b = !rtb_LowerRelop1;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_d3, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_bf, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ai);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode2_isRisingEdge_k,
      A380PrimComputerFg_P.ConfirmNode2_timeDelay_i, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_h0);
    rtb_LowerRelop1_p = ((!rtb_Logic_hk[0]) && rtb_y_p3);
    A380PrimComputerFg_DWork.Memory_PreviousInput_e = A380PrimComputerFg_P.Logic_table_o
      [(((((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active)) && rtb_AND7_b) ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active || (rtb_LowerRelop1_p &&
           rtb_LowerRelop1 && rtb_y_gn) || rtb_y_nt) + (static_cast<uint32_T>(rtb_y_av) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_e];
    A380PrimComputerFg_MATLABFunction_a((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active &&
      (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <= A380PrimComputerFg_P.CompareToConstant2_const_o4)
      && A380PrimComputerFg_U.in.general_logic.on_ground), A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_k, A380PrimComputerFg_P.ConfirmNode1_timeDelay_f, &rtb_y_av,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g2i);
    A380PrimComputerFg_DWork.Memory_PreviousInput_en = A380PrimComputerFg_P.Logic_table_n[(((static_cast<uint32_T>
      (rtb_y_av) << 1) + static_cast<uint32_T>(!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) << 1)
      + A380PrimComputerFg_DWork.Memory_PreviousInput_en];
    rtb_Compare_han_0 = (rtb_Logic_hk[0] || (rtb_y_p3 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_engaged));
    if (rtb_Compare_han_0) {
      rtb_y_o0 = A380PrimComputerFg_DWork.Delay2_DSTATE.ap_fd_1.flare_law.condition_Flare;
    } else {
      rtb_y_o0 = A380PrimComputerFg_DWork.Delay2_DSTATE.ap_fd_2.flare_law.condition_Flare;
    }

    rtb_y_av = ((!A380PrimComputerFg_U.in.general_logic.all_ra_failure) && rtb_y_o0 &&
                A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active);
    A380PrimComputerFg_MATLABFunction_a(rtb_y_av, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_e, A380PrimComputerFg_P.ConfirmNode1_timeDelay_l3, &rtb_y_p3,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fcu);
    A380PrimComputerFg_DWork.Memory_PreviousInput_d = A380PrimComputerFg_P.Logic_table_mh[(((static_cast<uint32_T>
      (rtb_y_p3) << 1) + static_cast<uint32_T>(!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) << 1)
      + A380PrimComputerFg_DWork.Memory_PreviousInput_d];
    rtb_y_av = (rtb_y_av || A380PrimComputerFg_DWork.Memory_PreviousInput_d);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_os, &rtb_y);
    rtb_NOT1_it = ((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active);
    rtb_y_o0 = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.selected_approach_type ==
                A380PrimComputerFg_P.EnumeratedConstant_Value_g);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.app_des_armed,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bv,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_h, &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_an);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_jb, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_i,
      &rtb_disengagementCondition, &A380PrimComputerFg_DWork.sf_MATLABFunction_br);
    rtb_AND10_j = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active) && (!rtb_y_d) &&
                   rtb_disengagementCondition);
    rtb_y_at = (tmp && A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid &&
                A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid && rtb_y_o0 &&
                ((!A380PrimComputerFg_U.in.general_logic.engine_running) ||
                 (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                  A380PrimComputerFg_P.CompareToConstant_const_m) ||
                 A380PrimComputerFg_U.in.general_logic.all_ra_failure) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed) && rtb_AND10_j);
    rtb_AND2_ci = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (rtb_NOT1_it || rtb_y_at));
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.nav_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_b,
      &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_ld);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_j, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_fw, &rtb_NOT1_it,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ox);
    A380PrimComputerFg_DWork.Memory_PreviousInput_a = A380PrimComputerFg_P.Logic_table_a
      [(((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
          (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid) || rtb_AND10_j ||
          (rtb_disengagementCondition && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.app_des_armed) ||
          rtb_NOT1_it || rtb_y_nt || A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active) + (
          static_cast<uint32_T>(rtb_AND2_ci) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_a];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_l, &rtb_y);
    rtb_y_p3 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active &&
      A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.app_des_armed &&
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.final_app_can_engage &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
       A380PrimComputerFg_P.EnumeratedConstant_Value_m)));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_p3, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_n, A380PrimComputerFg_P.ConfirmNode_timeDelay_k, &rtb_y_d,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_mva);
    A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_P.Logic_table_p[(((rtb_y_nt ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_d))) + (static_cast<uint32_T>
      (rtb_y_p3) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_l];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel1_bit_g, &rtb_y);
    rtb_y_gn = tmp;
    rtb_AND2_ci = !A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active;
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_om,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_a, &rtb_y_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_oq);
    rtb_NOT1_it = (A380PrimComputerFg_U.in.general_logic.flap_handle_index >=
                   A380PrimComputerFg_P.CompareToConstant_const_p);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_h, &rtb_mach_b);
    rtb_y_p3 = (rtb_mach_b >= A380PrimComputerFg_P.CompareToConstant3_const_b);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_bm, &rtb_mach_b);
    rtb_AND7_b = (rtb_mach_b >= A380PrimComputerFg_P.CompareToConstant5_const_b);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_m, &rtb_mach_b);
    rtb_Compare_fz = (rtb_mach_b >= A380PrimComputerFg_P.CompareToConstant1_const_f);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_c, &rtb_mach_b);
    A380PrimComputerFg_MATLABFunction_c((static_cast<int32_T>(((static_cast<uint32_T>(rtb_y_p3) + rtb_AND7_b) +
      rtb_Compare_fz) + (rtb_mach_b >= A380PrimComputerFg_P.CompareToConstant2_const_oh)) >=
      A380PrimComputerFg_P.CompareToConstant4_const_b), A380PrimComputerFg_P.PulseNode_isRisingEdge_k, &rtb_y_at,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_li);
    rtb_y_p3 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active) && rtb_AND2_ci && (!rtb_y_o0) &&
      rtb_NOT1_it && rtb_y_at));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_p3, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ks, A380PrimComputerFg_P.ConfirmNode_timeDelay_k1, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_b4);
    A380PrimComputerFg_DWork.Memory_PreviousInput_at = A380PrimComputerFg_P.Logic_table_bt[((((rtb_y_nt ||
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) && (!rtb_y_gn)) + (static_cast<uint32_T>
      (rtb_y_p3) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_at];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel1_bit_n, &rtb_y);
    rtb_y_gn = tmp;
    A380PrimComputerFg_MATLABFunction_hf
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active,
       A380PrimComputerFg_U.in.data.time.dt, &rtb_AND2_ci, A380PrimComputerFg_P.MTrigNode_isRisingEdge_c,
       A380PrimComputerFg_P.MTrigNode_retriggerable_c, A380PrimComputerFg_P.MTrigNode_triggerDuration_n,
       &A380PrimComputerFg_DWork.sf_MATLABFunction_lw);
    rtb_y_p3 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active) && rtb_AND2_ci)));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_p3, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bw, A380PrimComputerFg_P.ConfirmNode_timeDelay_ax, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fre);
    A380PrimComputerFg_DWork.Memory_PreviousInput_p = A380PrimComputerFg_P.Logic_table_m0u[(((rtb_y_nt ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_gn))) + (static_cast<uint32_T>
      (rtb_y_p3) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_p];
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_e,
      &rtb_NOT1_it, &A380PrimComputerFg_DWork.sf_MATLABFunction_ab);
    rtb_AND10_j = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active));
    rtb_AND2_ci = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_i, &rtb_y);
    A380PrimComputerFg_MATLABFunction_hf((rtb_y != 0U), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_at,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_f, A380PrimComputerFg_P.MTrigNode_retriggerable_g,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_jn, &A380PrimComputerFg_DWork.sf_MATLABFunction_ju);
    rtb_y_p3 = ((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active) && rtb_NOT1_it && rtb_AND10_j &&
                rtb_AND2_ci && (!rtb_y_at));
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.app_des_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active),
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_e, &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_g1d);
    rtb_y_gn = (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_im, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_gk, &rtb_y_at,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bf);
    rtb_AND7_b = (rtb_y_gn && ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) && rtb_y_at);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel5_bit_b, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_a, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_a0v);
    rtb_LowerRelop1 = ((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active &&
                        ((!A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid) ||
                         (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.nav_capture_condition)) &&
                        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active)) || rtb_y_p3 ||
                       (rtb_AND2_ci && rtb_AND10_j && A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active &&
                        ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active) &&
                         (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active) &&
                         (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active) &&
                         (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active) &&
                         (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active))) || rtb_AND7_b ||
                       (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active &&
                        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active && rtb_y_gn));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel3_bit_i, &rtb_y);
    rtb_y_gn = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel6_bit_b, &rtb_y);
    rtb_y_gn = (rtb_y_gn || (rtb_y != 0U));
    rtb_AND10_j = tmp;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_i, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_ft, &rtb_y_at,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g13);
    rtb_AND2_ci = (A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s && rtb_y_at &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
                   ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active) ||
                    (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                     A380PrimComputerFg_P.CompareToConstant_const_j)));
    rtb_NOT1_it = !A380PrimComputerFg_U.in.general_logic.on_ground;
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged,
      A380PrimComputerFg_P.PulseNode4_isRisingEdge_b, &rtb_y_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_hs);
    rtb_y_at = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.any_lateral_mode_engaged) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active));
    rtb_y_p3 = ((rtb_y_gn && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp && (rtb_AND2_ci ||
      (rtb_NOT1_it && rtb_y_o0 && rtb_y_at) || rtb_LowerRelop1)));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_p3, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_d, A380PrimComputerFg_P.ConfirmNode_timeDelay_c, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_my);
    A380PrimComputerFg_DWork.Memory_PreviousInput_lm = A380PrimComputerFg_P.Logic_table_ou[(((((!rtb_AND10_j) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) || rtb_y_nt) + (static_cast<uint32_T>
      (rtb_y_p3) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_lm];
    rtb_AND3_oo = !rtb_Logic_ag[0];
    rtb_y_p3 = (rtb_AND3_oo && A380PrimComputerFg_DWork.Memory_PreviousInput_lm);
    rtb_AND7_b = (A380PrimComputerFg_DWork.Memory_PreviousInput_lm && rtb_Logic_ag[0]);
    rtb_Compare_fz = rtb_LowerRelop1;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_j, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_jq, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_nq, &rtb_y_at,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ak);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.adcn_inputs.fms.direct_to_nav_engage,
      A380PrimComputerFg_P.PulseNode7_isRisingEdge, &rtb_NOT1_it, &A380PrimComputerFg_DWork.sf_MATLABFunction_lx);
    rtb_AND2_ci = !A380PrimComputerFg_U.in.data.adcn_inputs.fms.nav_capture_condition;
    rtb_AND4_a = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active) &&
                  (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active) &&
                  (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (rtb_y_at || (rtb_NOT1_it &&
      rtb_AND2_ci)));
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_a, &rtb_AND2_ci, &A380PrimComputerFg_DWork.sf_MATLABFunction_b1);
    rtb_AND10_j = ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.hdg_trk_preset_available) || rtb_AND2_ci);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.app_des_armed,
      A380PrimComputerFg_P.PulseNode4_isRisingEdge_g, &rtb_NOT1_it, &A380PrimComputerFg_DWork.sf_MATLABFunction_dxv);
    A380PrimComputerFg_MATLABFunction_hf
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active,
       A380PrimComputerFg_U.in.data.time.dt, &rtb_y_at, A380PrimComputerFg_P.MTrigNode_isRisingEdge_p,
       A380PrimComputerFg_P.MTrigNode_retriggerable_k, A380PrimComputerFg_P.MTrigNode_triggerDuration_l,
       &A380PrimComputerFg_DWork.sf_MATLABFunction_is);
    rtb_AND2_ci = !A380PrimComputerFg_DWork.Delay_DSTATE_c.hdg_trk_preset_available;
    rtb_LowerRelop1 = ((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid && (rtb_AND4_a ||
      (A380PrimComputerFg_U.in.general_logic.on_ground && rtb_AND10_j &&
       ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.any_lateral_mode_engaged) ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_loc_submode_active)) || rtb_NOT1_it || (rtb_y_at &&
      rtb_AND2_ci))));
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.hdg_trk_preset_available,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_i, &rtb_y_at, &A380PrimComputerFg_DWork.sf_MATLABFunction_az);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_f, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_k, &rtb_y_o0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_kdz);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.loc_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode6_isRisingEdge,
      &rtb_AND2_ci, &A380PrimComputerFg_DWork.sf_MATLABFunction_mm);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Memory_PreviousInput_a,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_g, &rtb_NOT1_it, &A380PrimComputerFg_DWork.sf_MATLABFunction_n4);
    rtb_y_d = !A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged;
    A380PrimComputerFg_DWork.Memory_PreviousInput_o4 = A380PrimComputerFg_P.Logic_table_h[(((rtb_y_at || rtb_y_o0 ||
      rtb_AND2_ci || (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid) || rtb_NOT1_it ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active || rtb_y_d) + (static_cast<uint32_T>
      (rtb_LowerRelop1) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_o4];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel3_bit_k, &rtb_y);
    A380PrimComputerFg_MATLABFunction_hf(A380PrimComputerFg_U.in.data.adcn_inputs.fms.direct_to_nav_engage,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_AND2_ci, A380PrimComputerFg_P.MTrigNode_isRisingEdge_n,
      A380PrimComputerFg_P.MTrigNode_retriggerable_d, A380PrimComputerFg_P.MTrigNode_triggerDuration_d,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_p4);
    rtb_AND10_j = (A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.nav_armed || (rtb_AND2_ci &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active))));
    rtb_AND4_a = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.nav_capture_condition && rtb_AND10_j &&
      ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >= A380PrimComputerFg_P.CompareToConstant_const_ep)
       || A380PrimComputerFg_U.in.general_logic.all_ra_failure) &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active) ||
       (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >= A380PrimComputerFg_P.CompareToConstant1_const_g))));
    A380PrimComputerFg_MATLABFunction_a(rtb_AND4_a, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_nr, A380PrimComputerFg_P.ConfirmNode_timeDelay_kx, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_n3);
    A380PrimComputerFg_DWork.Memory_PreviousInput_eu = A380PrimComputerFg_P.Logic_table_as
      [((((!A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid) || rtb_y_nt ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_AND10_j))) +
         (static_cast<uint32_T>(rtb_AND4_a) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_eu];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_kl, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    rtb_y_gn = tmp;
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_pqz, &rtb_y_at, &A380PrimComputerFg_DWork.sf_MATLABFunction_aq);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_c3, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_h, &rtb_y_o0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_nm);
    rtb_AND10_j = rtb_NOT1_k_tmp;
    rtb_AND2_ci = (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                   A380PrimComputerFg_P.CompareToConstant_const_n);
    rtb_AND4_a = (rtb_y_o0 && rtb_NOT1_k_tmp && rtb_AND2_ci && ((A380PrimComputerFg_P.EnumeratedConstant_Value_i !=
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
       A380PrimComputerFg_P.EnumeratedConstant1_Value_d)));
    A380PrimComputerFg_MATLABFunction_a(rtb_AND4_a, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_e, A380PrimComputerFg_P.ConfirmNode_timeDelay_i, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oqd);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_k3, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_b2);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.nav_armed,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_i, &rtb_AND2_ci, &A380PrimComputerFg_DWork.sf_MATLABFunction_jx);
    A380PrimComputerFg_DWork.Memory_PreviousInput_k = A380PrimComputerFg_P.Logic_table_i[(((((!rtb_AND10_j) && rtb_y_gn)
      || A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && rtb_y_o0 &&
       A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.loc_armed) || rtb_AND2_ci) + (static_cast<uint32_T>
      ((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp && (rtb_y_at ||
      rtb_AND4_a))) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_k];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel3_bit_ky, &rtb_y);
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg,
       A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_i, &rtb_mach_b);
    rtb_AND10_j = rtb_Compare_han_0;
    if (rtb_Compare_han_0) {
      rtb_Mod1_o = A380PrimComputerFg_DWork.Delay2_DSTATE.ap_fd_1.Phi_loc_c;
    } else {
      rtb_Mod1_o = A380PrimComputerFg_DWork.Delay2_DSTATE.ap_fd_2.Phi_loc_c;
    }

    rtb_headingMag = std::fmod((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.heading_deg -
      static_cast<real32_T>(A380PrimComputerFg_B.u_lyjj + 360.0)) + 360.0F, 360.0F);
    if (rtb_headingMag == 0.0F) {
      rtb_headingMag = 0.0F;
    } else if (rtb_headingMag < 0.0F) {
      rtb_headingMag += 360.0F;
    }

    rtb_trackMag = std::fmod(360.0F - rtb_headingMag, 360.0F);
    if (rtb_headingMag < rtb_trackMag) {
      rtb_trackMag = -rtb_headingMag;
    }

    if (rtb_Mod1_o < 0.0) {
      high_i = -1;
    } else {
      high_i = (rtb_Mod1_o > 0.0);
    }

    if (rtb_trackMag < 0.0F) {
      low_ip1 = -1;
    } else {
      low_ip1 = (rtb_trackMag > 0.0F);
    }

    if (low_ip1 == high_i) {
      rtb_DataTypeConversion23 = std::abs(rtb_Mod1_o);
      guard1 = false;
      if (rtb_DataTypeConversion23 > 5.0) {
        if (std::abs(A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg) <= 5.0F) {
          rtb_AND4_a = true;
        } else {
          if (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg < 0.0F) {
            low_i = -1;
          } else {
            low_i = (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg > 0.0F);
          }

          if (high_i != low_i) {
            rtb_AND4_a = true;
          } else {
            guard1 = true;
          }
        }
      } else {
        guard1 = true;
      }

      if (guard1) {
        if (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg < 0.0F) {
          low_i = -1;
        } else {
          low_i = (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg > 0.0F);
        }

        rtb_AND4_a = ((rtb_DataTypeConversion23 >= std::abs
                       (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.roll_angle_deg)) && (high_i
          == low_i));
      }
    } else {
      rtb_AND4_a = false;
    }

    rtb_vsInert = std::abs(rtb_trackMag);
    if (rtb_vsInert < 115.0F) {
      rtb_headingMag = std::abs(rtb_mach_b);
      if (rtb_mach_b < 0.0F) {
        high_i = -1;
      } else {
        high_i = (rtb_mach_b > 0.0F);
      }

      if (((rtb_vsInert > 25.0F) && ((rtb_headingMag < 10.0F) && ((low_ip1 != high_i) && rtb_AND4_a))) ||
          (rtb_headingMag < 1.92)) {
        rtb_AND4_a = (rtb_AND4_a || ((rtb_vsInert < 15.0F) && (rtb_headingMag < 1.1)));
      } else {
        rtb_AND4_a = false;
      }
    } else {
      rtb_AND4_a = false;
    }

    A380PrimComputerFg_MATLABFunction_j
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg, &rtb_AND10_j);
    rtb_y_gn = (tmp && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.loc_armed && rtb_AND4_a && rtb_AND10_j);
    rtb_AND4_a = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_AND4_a, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_f, A380PrimComputerFg_P.ConfirmNode_timeDelay_dw, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_dvt);
    A380PrimComputerFg_DWork.Memory_PreviousInput_f = A380PrimComputerFg_P.Logic_table_py[(((((!rtb_y_gn) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) || rtb_y_nt) + (static_cast<uint32_T>
      (rtb_AND4_a) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_f];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_4,
      A380PrimComputerFg_P.BitfromLabel3_bit_b, &rtb_y);
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg,
       A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_hv, &rtb_mach_b);
    if (rtb_mach_b < 0.0F) {
      rtb_DataTypeConversion23 = -rtb_mach_b;
    } else {
      rtb_DataTypeConversion23 = rtb_mach_b;
    }

    A380PrimComputerFg_MATLABFunction_a((rtb_DataTypeConversion23 < A380PrimComputerFg_P.CompareToConstant1_const_n),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_jx,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_cd, &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_iy);
    rtb_y_gn = (tmp && A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active && rtb_AND10_j);
    rtb_AND4_a = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_AND4_a, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_c, A380PrimComputerFg_P.ConfirmNode_timeDelay_kp, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_jp);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ox = A380PrimComputerFg_P.Logic_table_c[(((((!rtb_y_gn) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.rwy_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) || rtb_y_nt) + (static_cast<uint32_T>
      (rtb_AND4_a) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_ox];
    rtb_headingMag = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft -
      A380PrimComputerFg_DWork.pValue_p;
    rtb_trackMag = std::abs(rtb_headingMag);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ek = A380PrimComputerFg_P.Logic_table_pp[(((static_cast<uint32_T>
      ((A380PrimComputerFg_DWork.pValue_p != A380PrimComputerFg_DWork.DelayInput1_DSTATE_i) || (rtb_trackMag >
      A380PrimComputerFg_P.CompareToConstant1_const_j2)) << 1) +
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active && (rtb_trackMag <=
      A380PrimComputerFg_P.CompareToConstant_const_oj))) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_ek];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_g, &rtb_y);
    rtb_AND2_ci = !A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active;
    rtb_y_at = !A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active;
    if (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active) {
      rtb_trackMag = A380PrimComputerFg_DWork.pValue;
    } else if (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active &&
               (!A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_corrective)) {
      rtb_trackMag = static_cast<real32_T>(A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target);
    } else {
      rtb_trackMag = 0.0F;
    }

    if (rtb_headingMag < 0.0F) {
      rtb_y_o0 = (rtb_trackMag <= 0.0F);
    } else {
      rtb_y_o0 = ((rtb_headingMag > 0.0F) && (rtb_trackMag >= 0.0F));
    }

    rtb_AND4_a = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active) && rtb_AND2_ci &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active) && rtb_y_at &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && ((!rtb_y_o0) ||
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active))) &&
      (((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active)) || (rtb_headingMag <=
      A380PrimComputerFg_P.CompareToConstant2_const_e)) &&
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged &&
      A380PrimComputerFg_DWork.Memory_PreviousInput_ek));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_m, &rtb_y);
    rtb_y_gn = tmp;
    A380PrimComputerFg_MATLABFunction_hf((A380PrimComputerFg_DWork.pValue_p !=
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_k), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_at,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_d, A380PrimComputerFg_P.MTrigNode_retriggerable_m,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_m, &A380PrimComputerFg_DWork.sf_MATLABFunction_ed);
    A380PrimComputerFg_MATLABFunction_c(rtb_vsInertValid, A380PrimComputerFg_P.PulseNode_isRisingEdge_dn, &rtb_AND2_ci,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ep);
    rtb_DataTypeConversion25 = absAdvRateToMaintain -
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft;
    rtb_DataTypeConversion23 = std::abs(rtb_DataTypeConversion25);
    rtb_headingMag = std::abs(A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.vertical_speed_ft_min);
    high_i = 7;
    low_i = 0;
    low_ip1 = 2;
    while (high_i > low_ip1) {
      mid_i = ((low_i + high_i) + 1) >> 1;
      if (static_cast<real_T>(rtb_headingMag) >= b[mid_i - 1]) {
        low_i = mid_i - 1;
        low_ip1 = mid_i + 1;
      } else {
        high_i = mid_i;
      }
    }

    rtb_trackMag = rtb_headingMag - static_cast<real32_T>(b[low_i]);
    rtb_vsInert = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.vertical_speed_ft_min * 0.00508F;
    if (rtb_DataTypeConversion25 < 0.0) {
      high_i = -1;
    } else {
      high_i = (rtb_DataTypeConversion25 > 0.0);
    }

    if (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.vertical_speed_ft_min < 0.0F) {
      low_ip1 = -1;
    } else {
      low_ip1 = (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.vertical_speed_ft_min > 0.0F);
    }

    rtb_AND10_j = ((!rtb_y_at) && ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active &&
      rtb_AND2_ci && (rtb_DataTypeConversion23 <= A380PrimComputerFg_P.CompareToConstant1_const_m)) ||
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.alt_acq_armed && (std::fmin(3000.0F, std::fmax(80.0F,
      rtb_vsInert * rtb_vsInert / ((((rtb_trackMag * static_cast<real32_T>(c[low_i]) + static_cast<real32_T>(c[low_i + 6]))
      * rtb_trackMag + static_cast<real32_T>(c[low_i + 12])) * rtb_trackMag + static_cast<real32_T>(c[low_i + 18])) *
      9.81F) * 3.28084F)) > rtb_DataTypeConversion23) && (high_i == low_ip1))));
    rtb_NOT1_k_tmp = !A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_mode_available;
    rtb_NOT1_it = rtb_NOT1_k_tmp;
    rtb_y_nt = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp && rtb_AND10_j
      && ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
           A380PrimComputerFg_P.CompareToConstant_const_i) ||
          ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active) &&
           (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active))) &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active) ||
       ((!A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_active) &&
        (A380PrimComputerFg_DWork.Delay_DSTATE_c.active_tcas_submode == A380PrimComputerFg_P.EnumeratedConstant3_Value_a)
        && (!rtb_NOT1_k_tmp)))));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_nt, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_gx, A380PrimComputerFg_P.ConfirmNode_timeDelay_b, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fb);
    A380PrimComputerFg_DWork.Memory_PreviousInput_l1 = A380PrimComputerFg_P.Logic_table_hk
      [(((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_gn))) + (static_cast<uint32_T>
          (rtb_y_nt) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_l1];
    rtb_BusAssignment_p_fg_mode_logic_tcas_alt_acq_cond = rtb_AND10_j;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_e, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    rtb_y_gn = tmp;
    A380PrimComputerFg_MATLABFunction_a((rtb_DataTypeConversion23 < A380PrimComputerFg_P.CompareToConstant_const_jk),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ne,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_f, &rtb_y_at, &A380PrimComputerFg_DWork.sf_MATLABFunction_bc);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_h, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_nr, &rtb_NOT1_it,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_nab);
    rtb_AND2_ci = (rtb_NOT1_it && ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active) ||
       (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft > A380PrimComputerFg_P.CompareToConstant2_const_a))));
    rtb_y_nt = ((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      ((rtb_y_at && A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active) || rtb_AND2_ci) &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active) ||
       ((!A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_active) &&
        (A380PrimComputerFg_DWork.Delay_DSTATE_c.active_tcas_submode == A380PrimComputerFg_P.EnumeratedConstant3_Value_h)
        && A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_mode_available))));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_nt, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_l, A380PrimComputerFg_P.ConfirmNode_timeDelay_o, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_d0);
    rtb_LowerRelop1 = (A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
                       ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_gn)));
    A380PrimComputerFg_DWork.Memory_PreviousInput_e0 = A380PrimComputerFg_P.Logic_table_f[(((static_cast<uint32_T>
      (rtb_y_nt) << 1) + rtb_LowerRelop1) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_e0];
    A380PrimComputerFg_MATLABFunction_c(rtb_vsInertValid, A380PrimComputerFg_P.PulseNode1_isRisingEdge_c,
      &rtb_LowerRelop1, &A380PrimComputerFg_DWork.sf_MATLABFunction_on);
    rtb_y_nt = !A380PrimComputerFg_DWork.Memory_PreviousInput_e0;
    A380PrimComputerFg_DWork.Memory_PreviousInput_hw = A380PrimComputerFg_P.Logic_table_j[(((static_cast<uint32_T>
      ((rtb_LowerRelop1 && (rtb_DataTypeConversion23 > A380PrimComputerFg_P.CompareToConstant4_const_l)) || rtb_AND2_ci)
      << 1) + ((rtb_headingMag <= A380PrimComputerFg_P.CompareToConstant3_const_br) || rtb_y_nt)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_hw];
    rtb_LowerRelop1 = (std::abs(A380PrimComputerFg_U.in.data.adcn_inputs.fms.cruise_alt_ft -
      A380PrimComputerFg_DWork.pValue_p) < A380PrimComputerFg_P.CompareToConstant1_const_p);
    rtb_y_gn = ((A380PrimComputerFg_DWork.Memory_PreviousInput_l1 || (std::abs
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.cruise_alt_ft -
       A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) <
      A380PrimComputerFg_P.CompareToConstant5_const_o)) && rtb_LowerRelop1);
    A380PrimComputerFg_DWork.Memory_PreviousInput_oz = A380PrimComputerFg_P.Logic_table_pi[((((!rtb_y_gn) && (rtb_y_nt ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_hw)) + (static_cast<uint32_T>(rtb_y_gn) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_oz];
    rtb_LowerRelop1_e = (rtb_AND4_a && rtb_LowerRelop1);
    rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond = rtb_y_at;
    rtb_LowerRelop1 = (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
                       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_f,
      &rtb_y_nt, &A380PrimComputerFg_DWork.sf_MATLABFunction_kl);
    rtb_y_nt = (rtb_LowerRelop1 && rtb_y_nt);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active,
      A380PrimComputerFg_P.PulseNode4_isRisingEdge_k, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_nc);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel6_bit_o, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode5_isRisingEdge_k, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g4);
    if (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active) {
      A380PrimComputerFg_B.u_ly = absAdvRateToMaintain;
    }

    rtb_trackMag = A380PrimComputerFg_DWork.pValue_p -
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft;
    rtb_NOT1_it = ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
                    A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active) && (rtb_Y_m >
      A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias1_Bias) && rtb_LowerRelop1_p &&
                   rtb_Logic_fj[0] && A380PrimComputerFg_P.Constant_Value_h2);
    rtb_y_o0 = (rtb_NOT1_k_tmp || (A380PrimComputerFg_DWork.Delay_DSTATE_c.active_tcas_submode ==
      A380PrimComputerFg_P.EnumeratedConstant3_Value_i));
    rtb_LowerRelop1 = (rtb_y_nt || (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active &&
      (rtb_y_gn || rtb_LowerRelop1)) || (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active &&
      ((A380PrimComputerFg_P.EnumeratedConstant_Value_a ==
        A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) ||
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
        A380PrimComputerFg_P.EnumeratedConstant1_Value_n) ||
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
        A380PrimComputerFg_P.EnumeratedConstant2_Value_e) ||
       ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active)) ||
       (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid))) ||
                       (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active && (std::abs
      (A380PrimComputerFg_B.u_ly - absAdvRateToMaintain) >= A380PrimComputerFg_P.CompareToConstant_const_n2)) ||
                       ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active) && (rtb_trackMag >
      A380PrimComputerFg_P.CompareToConstant1_const_hc)) ||
                       ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active) && (rtb_trackMag <
      A380PrimComputerFg_P.CompareToConstant2_const_pq)) ||
                       ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
                         A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active) &&
                        (A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + A380PrimComputerFg_P.Bias_Bias_m > rtb_Y_m) &&
                        rtb_LowerRelop1_p && rtb_Logic_fj[0] && A380PrimComputerFg_P.Constant_Value_h2) || rtb_NOT1_it ||
                       (((!A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_active) || rtb_NOT1_k_tmp) &&
                        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active && rtb_y_o0));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_i1, &rtb_y);
    rtb_y_gn = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel1_bit_dx, &rtb_y);
    rtb_y_gn = (rtb_y_gn || (rtb_y != 0U));
    rtb_AND10_j = tmp;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_m, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_pu, &rtb_NOT1_it,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_av);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged,
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_cr, &rtb_y_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_hp);
    rtb_y_at = !A380PrimComputerFg_DWork.Delay_DSTATE_c.any_longitudinal_mode_engaged;
    rtb_y_nt = ((!A380PrimComputerFg_U.in.general_logic.on_ground) && rtb_y_o0 && rtb_y_at);
    A380PrimComputerFg_MATLABFunction_a(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bx,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_e, &rtb_y_at, &A380PrimComputerFg_DWork.sf_MATLABFunction_fy);
    rtb_y_nt = ((rtb_y_gn && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      ((A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s && rtb_NOT1_it &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) || rtb_y_nt || (rtb_y_at &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.any_longitudinal_mode_engaged)) || rtb_LowerRelop1)));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_nt, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_co, A380PrimComputerFg_P.ConfirmNode_timeDelay_ol, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oyv);
    A380PrimComputerFg_DWork.Memory_PreviousInput_og = A380PrimComputerFg_P.Logic_table_bw
      [(((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_AND10_j))) +
         (static_cast<uint32_T>(rtb_y_nt) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_og];
    rtb_AND3_oo = (rtb_AND3_oo && A380PrimComputerFg_DWork.Memory_PreviousInput_og);
    rtb_BusAssignment_mv_fg_mode_logic_longitudinal_modes_fpa_active = (A380PrimComputerFg_DWork.Memory_PreviousInput_og
      && rtb_Logic_ag[0]);
    rtb_BusAssignment_mv_fg_mode_logic_longitudinal_mode_reversion_vs = rtb_LowerRelop1;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_im, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_l, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_h, &rtb_y_nt,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cm);
    rtb_AND2_ci = (A380PrimComputerFg_U.in.general_logic.on_ground ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active);
    rtb_y_o0 = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft <
                 A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft) ||
                (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft ==
                 A380PrimComputerFg_P.CompareToConstant1_const_cg));
    rtb_NOT1_it = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft !=
                    A380PrimComputerFg_P.CompareToConstant_const_c) &&
                   (A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft < A380PrimComputerFg_DWork.pValue_p)
                   && rtb_y_o0 && (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.nav_armed) &&
                   ((!A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged) ||
                    A380PrimComputerFg_DWork.Memory_PreviousInput_o) &&
                   A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid);
    rtb_Compare_han_0 = !rtb_AND_k1;
    A380PrimComputerFg_DWork.Memory_PreviousInput_oy = A380PrimComputerFg_P.Logic_table_nb[((((rtb_AND2_ci &&
      (!rtb_NOT1_it)) || (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
                          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active) && rtb_Compare_han_0) ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active) ||
      (A380PrimComputerFg_DWork.pValue_p <
       A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) && (rtb_Compare_han_0 ||
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active) ||
      (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid))) ||
      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
        A380PrimComputerFg_P.EnumeratedConstant3_Value) ||
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
        A380PrimComputerFg_P.EnumeratedConstant4_Value)) || rtb_y_d) + (static_cast<uint32_T>((rtb_LowerRelop1 &&
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      (((!A380PrimComputerFg_U.in.general_logic.on_ground) &&
        ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
          A380PrimComputerFg_P.EnumeratedConstant1_Value_e) &&
         (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
          A380PrimComputerFg_P.EnumeratedConstant2_Value_g)) &&
        A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active && (A380PrimComputerFg_DWork.pValue_p >
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) &&
        A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
        (((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
           A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) && rtb_AND_k1) || (rtb_y_nt &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) && (rtb_AND_k1 &&
      (rtb_DataTypeConversion23 <= A380PrimComputerFg_P.CompareToConstant2_const_mi))))) || (rtb_AND2_ci && rtb_NOT1_it))))
      << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_oy];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel1_bit_e, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_c
      ((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft >
        A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft),
       A380PrimComputerFg_P.PulseNode_isRisingEdge_j2, &rtb_y_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_os);
    rtb_y_at = (A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.clb_armed && (rtb_y_o0 ||
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft != A380PrimComputerFg_DWork.DelayInput1_DSTATE)));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel3_bit_dp, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_ag, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_kv);
    rtb_y_o0 = (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active);
    rtb_y_gn = (tmp && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.alt_acq_arm_possible &&
                A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s &&
                ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active)) &&
                A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active &&
                A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
                (A380PrimComputerFg_DWork.pValue_p >
                 A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) &&
                ((A380PrimComputerFg_P.EnumeratedConstant_Value_m1 !=
                  A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
                 (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                  A380PrimComputerFg_P.EnumeratedConstant1_Value_k)) && (rtb_y_at || (rtb_AND10_j && ((!rtb_y_o0) ||
      (rtb_y_o0 && (!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.clb_armed) && (rtb_Compare_han_0 ||
      (rtb_DataTypeConversion23 > A380PrimComputerFg_P.CompareToConstant2_const_ay)))))));
    rtb_y_nt = ((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_y_nt, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_a, A380PrimComputerFg_P.ConfirmNode_timeDelay_g5, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_je);
    A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.Logic_table_fi
      [(((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_gn))) + (static_cast<uint32_T>
          (rtb_y_nt) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_j];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_nd, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_a, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_bi, &rtb_y_nt,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cn);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ei = A380PrimComputerFg_P.Logic_table_mh5
      [(((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active || (A380PrimComputerFg_DWork.pValue_p >
           A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) ||
          ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active) &&
           (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active) &&
           (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active)) ||
          ((A380PrimComputerFg_P.EnumeratedConstant3_Value_g ==
            A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) ||
           (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
            A380PrimComputerFg_P.EnumeratedConstant5_Value) ||
           (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
            A380PrimComputerFg_P.EnumeratedConstant4_Value_m)) ||
          (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid) ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) && rtb_Compare_han_0) || rtb_y_d)
         + (static_cast<uint32_T>((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) ||
           (tmp && ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                     A380PrimComputerFg_P.EnumeratedConstant1_Value_o) &&
                    (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                     A380PrimComputerFg_P.EnumeratedConstant2_Value_l) && (A380PrimComputerFg_DWork.pValue_p <
              A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) &&
                    (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
                     A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
                     A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active) &&
                    A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
                    (((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
                       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) && rtb_AND_k1) ||
                     (rtb_y_nt && (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active) && (rtb_AND_k1 &&
                (rtb_DataTypeConversion23 <= A380PrimComputerFg_P.CompareToConstant2_const_k))))))) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_ei];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel1_bit_h, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel3_bit_bw, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_kp, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_isd);
    rtb_y_at = (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active);
    rtb_y_gn = (tmp && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.alt_acq_arm_possible &&
                A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s &&
                ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active)) &&
                (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active) &&
                A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
                (A380PrimComputerFg_DWork.pValue_p <
                 A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) &&
                ((A380PrimComputerFg_P.EnumeratedConstant_Value_e !=
                  A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
                 (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                  A380PrimComputerFg_P.EnumeratedConstant1_Value_b) &&
                 (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                  A380PrimComputerFg_P.EnumeratedConstant2_Value_ec)) &&
                ((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.des_armed &&
                  (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft !=
                   A380PrimComputerFg_DWork.DelayInput1_DSTATE_j)) || (rtb_y_gn && ((!rtb_y_at) || (rtb_y_at &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.des_armed) && (rtb_Compare_han_0 ||
      (rtb_DataTypeConversion23 > A380PrimComputerFg_P.CompareToConstant2_const_nt)))))));
    rtb_y_nt = ((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_y_nt, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_lt, A380PrimComputerFg_P.ConfirmNode_timeDelay_iw, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oa);
    A380PrimComputerFg_DWork.Memory_PreviousInput_kj = A380PrimComputerFg_P.Logic_table_kk
      [(((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_gn))) + (static_cast<uint32_T>
          (rtb_y_nt) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_kj];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_j1, &rtb_y);
    rtb_AND10_j = (A380PrimComputerFg_U.in.general_logic.on_ground ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active);
    rtb_AND2_ci = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft !=
                    A380PrimComputerFg_P.CompareToConstant_const_o) &&
                   (A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft < A380PrimComputerFg_DWork.pValue_p)
                   && ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft <
                        A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft) ||
                       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft ==
                        A380PrimComputerFg_P.CompareToConstant1_const_a)) &&
                   (((!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active) &&
                     (!A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.nav_armed)) ||
                    (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid)) &&
                   ((!A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged) ||
                    A380PrimComputerFg_DWork.Memory_PreviousInput_o));
    A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.Logic_table_fe[((((rtb_AND10_j &&
      (!rtb_AND2_ci)) || (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
                          A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active) ||
      (A380PrimComputerFg_DWork.pValue_p <
       A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.clb_armed || rtb_y_d) + (static_cast<uint32_T>(((rtb_y != 0U) &&
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp && (rtb_AND10_j && rtb_AND2_ci))) << 1)) <<
      1) + A380PrimComputerFg_DWork.Memory_PreviousInput_m];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_i4, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_o, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_c, &rtb_y_nt,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_eow);
    rtb_y_o0 = !A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.nav_active;
    rtb_NOT1_it = ((A380PrimComputerFg_P.EnumeratedConstant_Value_p ==
                    A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) ||
                   (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                    A380PrimComputerFg_P.EnumeratedConstant1_Value_p) || rtb_y_o0 ||
                   (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid));
    rtb_y_at = (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active);
    A380PrimComputerFg_MATLABFunction_a((A380PrimComputerFg_DWork.Delay_DSTATE_c.manual_spd_control_active && rtb_y_at),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_gw,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_mw, &rtb_y_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_bii);
    rtb_NOT1_it = ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active && rtb_NOT1_it) || rtb_y_o0);
    A380PrimComputerFg_MATLABFunction_c
      ((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft >
        A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft),
       A380PrimComputerFg_P.PulseNode1_isRisingEdge_bm, &rtb_y_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_oy);
    rtb_y_at = (rtb_y_nt || rtb_NOT1_it || (rtb_y_at && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.op_clb_armed
      && rtb_y_o0));
    rtb_y_gn = (tmp && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.alt_acq_arm_possible &&
                A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
                (A380PrimComputerFg_DWork.pValue_p >
                 A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) && rtb_y_at);
    rtb_y_nt = ((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_y_nt, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_p, A380PrimComputerFg_P.ConfirmNode_timeDelay_js, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_f34);
    A380PrimComputerFg_DWork.Memory_PreviousInput_kc = A380PrimComputerFg_P.Logic_table_on
      [(((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_gn))) + (static_cast<uint32_T>
          (rtb_y_nt) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_kc];
    rtb_y_nt = (A380PrimComputerFg_DWork.Memory_PreviousInput_kc && rtb_NOT1_it);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_mo, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_b, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_nb, &rtb_NOT1_it,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_h4e);
    rtb_y_gn = (tmp && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.alt_acq_arm_possible &&
                A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) &&
                (A380PrimComputerFg_DWork.pValue_p <
                 A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft) &&
                rtb_NOT1_it);
    rtb_LowerRelop1 = ((rtb_LowerRelop1 && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_LowerRelop1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_f5, A380PrimComputerFg_P.ConfirmNode_timeDelay_dt, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oz);
    A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_P.Logic_table_ig
      [(((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active) && (!rtb_y_gn))) + (static_cast<uint32_T>
          (rtb_LowerRelop1) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_i];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_gq, &rtb_y);
    rtb_y_gn = tmp;
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_ds, &rtb_NOT1_it, &A380PrimComputerFg_DWork.sf_MATLABFunction_oh);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.land_armed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_ll, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_cd0);
    A380PrimComputerFg_DWork.Memory_PreviousInput_il = A380PrimComputerFg_P.Logic_table_f5[(((static_cast<uint32_T>
      (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp && (rtb_NOT1_it &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active)))) << 1) + (rtb_y_gn ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_il];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_ib, &rtb_y);
    rtb_AND10_j = (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_cpt_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.loc_trk_active);
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg,
       A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_f, &rtb_mach_b);
    A380PrimComputerFg_LagFilter_b(rtb_mach_b, A380PrimComputerFg_P.LagFilter_C1, A380PrimComputerFg_U.in.data.time.dt,
      &rtb_vsInert, &A380PrimComputerFg_DWork.sf_LagFilter_b4);
    if (rtb_mach_b < 0.0F) {
      rtb_DataTypeConversion25 = -rtb_mach_b;
    } else {
      rtb_DataTypeConversion25 = rtb_mach_b;
    }

    A380PrimComputerFg_MATLABFunction_j
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg, &rtb_NOT1_it);
    rtb_y_gn = (tmp && A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.glide_armed && rtb_AND10_j && (((rtb_vsInert <
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_f) && (rtb_DataTypeConversion25 <
      A380PrimComputerFg_P.CompareToConstant1_const_ai)) || (rtb_DataTypeConversion25 <
      A380PrimComputerFg_P.CompareToConstant2_const_cc)) && rtb_NOT1_it);
    rtb_LowerRelop1 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_LowerRelop1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_i, A380PrimComputerFg_P.ConfirmNode_timeDelay_mc, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_l1);
    A380PrimComputerFg_DWork.Memory_PreviousInput_lp = A380PrimComputerFg_P.Logic_table_or[(((((!rtb_y_gn) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) ||
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset) + (static_cast<uint32_T>
      (rtb_LowerRelop1) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_lp];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_kr, &rtb_y);
    rtb_y_gn = tmp;
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_DWork.Memory_PreviousInput_lp,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_pb,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_dm, &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_l0a);
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg,
       A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_jq, &rtb_mach_b);
    if (rtb_mach_b < 0.0F) {
      rtb_DataTypeConversion23 = -rtb_mach_b;
    } else {
      rtb_DataTypeConversion23 = rtb_mach_b;
    }

    rtb_LowerRelop1 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      rtb_AND10_j && (rtb_DataTypeConversion23 < A380PrimComputerFg_P.CompareToConstant2_const_p)));
    A380PrimComputerFg_MATLABFunction_a(rtb_LowerRelop1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ab, A380PrimComputerFg_P.ConfirmNode_timeDelay_fa, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ob);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ae = A380PrimComputerFg_P.Logic_table_d[(((((!rtb_y_gn) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) ||
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset) + (static_cast<uint32_T>
      (rtb_LowerRelop1) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_ae];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_2,
      A380PrimComputerFg_P.BitfromLabel3_bit_er, &rtb_y);
    rtb_LowerRelop1 = (tmp && A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_mode_available);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ik = A380PrimComputerFg_P.Logic_table_kr[(((static_cast<uint32_T>
      (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (rtb_LowerRelop1 &&
      A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ta_active)) << 1) +
      ((!A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ta_active) || rtb_NOT1_k_tmp ||
       A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.tcas_active)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_ik];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_3,
      A380PrimComputerFg_P.BitfromLabel3_bit_a, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_active,
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_n, &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_hw);
    rtb_y_gn = (rtb_LowerRelop1 && rtb_AND10_j);
    rtb_LowerRelop1 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_a(rtb_LowerRelop1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bz, A380PrimComputerFg_P.ConfirmNode_timeDelay_l, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pw);
    A380PrimComputerFg_DWork.Memory_PreviousInput_kx = A380PrimComputerFg_P.Logic_table_l
      [((((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset ||
           (A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active)) && (!rtb_y_gn)) + (static_cast<uint32_T>
          (rtb_LowerRelop1) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_kx];
    if (A380PrimComputerFg_P.EnumeratedConstant_Value_o != A380PrimComputerFg_DWork.Delay_DSTATE_c.active_tcas_submode)
    {
      A380PrimComputerFg_B.u_lyj = absAdvRateToMaintain;
    }

    rtb_LowerRelop1 = !A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_active;
    rtb_y_gn = !A380PrimComputerFg_DWork.Delay_DSTATE_c.armed_modes.alt_acq_armed;
    A380PrimComputerFg_DWork.Memory_PreviousInput_b = A380PrimComputerFg_P.Logic_table_az[((((std::abs
      (A380PrimComputerFg_B.u_lyj - absAdvRateToMaintain) >= A380PrimComputerFg_P.CompareToConstant_const_il) ||
      rtb_LowerRelop1 || rtb_y_gn) + (static_cast<uint32_T>(rtb_BusAssignment_p_fg_mode_logic_tcas_alt_acq_cond) << 1)) <<
      1) + A380PrimComputerFg_DWork.Memory_PreviousInput_b];
    rtb_AND10_j = ((A380PrimComputerFg_P.EnumeratedConstant1_Value_bl ==
                    A380PrimComputerFg_DWork.Delay_DSTATE_c.active_tcas_submode) &&
                   rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond);
    A380PrimComputerFg_DWork.Memory_PreviousInput_pt = A380PrimComputerFg_P.Logic_table_cp[(((static_cast<uint32_T>
      (rtb_AND10_j) << 1) + (rtb_y_gn || rtb_LowerRelop1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_pt];
    if (A380PrimComputerFg_DWork.Memory_PreviousInput_b) {
      rtb_mode = tcas_submode::ALT_ACQ;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_pt) {
      rtb_mode = tcas_submode::ALT_HOLD;
    } else {
      rtb_mode = tcas_submode::VS;
    }

    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      A380PrimComputerFg_P.BitfromLabel1_bit_p, &rtb_y);
    rtb_LowerRelop1 = ((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active);
    A380PrimComputerFg_MATLABFunction_a(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_c,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_m, &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_gg);
    A380PrimComputerFg_MATLABFunction_c(rtb_AND10_j, A380PrimComputerFg_P.PulseNode3_isRisingEdge_h, &rtb_y_o0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_j2);
    rtb_y_gn = rtb_y_d;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_es, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_o, &rtb_y_gn,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oks);
    rtb_y_gn = (rtb_y_gn && A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s);
    rtb_NOT1_k_tmp = !A380PrimComputerFg_DWork.Memory_PreviousInput_n;
    rtb_AND10_j = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate && (rtb_NOT1_k_tmp ||
      (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft <=
       A380PrimComputerFg_DWork.pValue_p)));
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
      A380PrimComputerFg_P.CompareToConstant1_const_cm), A380PrimComputerFg_P.PulseNode4_isRisingEdge_i, &rtb_y_at,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_erf);
    rtb_AND2_ci = !A380PrimComputerFg_U.in.general_logic.on_ground;
    rtb_NOT1_it = !A380PrimComputerFg_DWork.Memory_PreviousInput_at;
    rtb_Compare_han_0 = (rtb_NOT1_k_tmp && rtb_NOT1_it && (!A380PrimComputerFg_DWork.Memory_PreviousInput_lp) &&
                         (!A380PrimComputerFg_DWork.Memory_PreviousInput_ae) &&
                         (!A380PrimComputerFg_DWork.Memory_PreviousInput_e));
    rtb_y_at = (rtb_y_at && rtb_AND2_ci && rtb_Compare_han_0);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Memory_PreviousInput_kx,
      A380PrimComputerFg_P.PulseNode7_isRisingEdge_g, &rtb_AND2_ci, &A380PrimComputerFg_DWork.sf_MATLABFunction_jfh);
    rtb_y_at = (rtb_LowerRelop1 || ((A380PrimComputerFg_DWork.Delay_DSTATE_p &&
      (!A380PrimComputerFg_U.in.general_logic.on_ground)) ||
      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts == A380PrimComputerFg_P.CompareToConstant_const_mv) &&
       rtb_y_o0 && rtb_Compare_han_0) || (rtb_y_d &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
       A380PrimComputerFg_P.EnumeratedConstant_Value_gt)) || rtb_y_gn || rtb_AND10_j || rtb_y_at || rtb_AND2_ci));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_at, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_fi, A380PrimComputerFg_P.ConfirmNode_timeDelay_e4, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lq);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode6_isRisingEdge_i, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_kdl);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_a, &rtb_AND10_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_nvo);
    A380PrimComputerFg_DWork.Memory_PreviousInput_od = A380PrimComputerFg_P.Logic_table_g
      [((((A380PrimComputerFg_DWork.Delay_DSTATE_c.auto_spd_control_active && (!rtb_LowerRelop1)) ||
          (A380PrimComputerFg_U.in.general_logic.on_ground && (rtb_y_gn || rtb_AND10_j))) + (static_cast<uint32_T>
          (rtb_y_at) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_od];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.discrete_word_5,
      A380PrimComputerFg_P.BitfromLabel1_bit_hz, &rtb_y);
    rtb_LowerRelop1 = ((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged,
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_jl, &rtb_AND2_ci, &A380PrimComputerFg_DWork.sf_MATLABFunction_dm);
    rtb_y_at = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts != A380PrimComputerFg_P.CompareToConstant_const_de);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_aw, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_ocv);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_at, A380PrimComputerFg_P.PulseNode2_isRisingEdge_j, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lwx);
    rtb_AND10_j = (A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged && rtb_AND10_j);
    rtb_y_gn = ((rtb_AND2_ci && rtb_y_at) || (rtb_y_gn && rtb_y_at &&
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged) || rtb_AND10_j);
    rtb_y_o0 = (A380PrimComputerFg_DWork.Memory_PreviousInput_at || A380PrimComputerFg_DWork.Memory_PreviousInput_n);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_o0, A380PrimComputerFg_P.PulseNode3_isRisingEdge_g, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_kq);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_ji, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_kh, &rtb_AND2_ci,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ef);
    rtb_y_gn = ((A380PrimComputerFg_U.in.general_logic.on_ground && rtb_y_gn) || (rtb_AND10_j || rtb_AND2_ci));
    rtb_AND10_j = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts !=
                   A380PrimComputerFg_P.CompareToConstant3_const_g);
    rtb_y_gn = (rtb_LowerRelop1 || ((!rtb_LowerRelop1) && rtb_y_gn &&
      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts != A380PrimComputerFg_P.CompareToConstant2_const_j) ||
       rtb_AND10_j)));
    A380PrimComputerFg_MATLABFunction_a(rtb_y_gn, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_jb, A380PrimComputerFg_P.ConfirmNode_timeDelay_as, &rtb_LowerRelop1,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fk);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
      A380PrimComputerFg_P.CompareToConstant4_const_h), A380PrimComputerFg_P.PulseNode6_isRisingEdge_m, &rtb_AND2_ci,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_jo);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts ==
      A380PrimComputerFg_P.CompareToConstant5_const_a), A380PrimComputerFg_P.PulseNode7_isRisingEdge_i, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_n11);
    rtb_y_at = !A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_tune_inhibit;
    A380PrimComputerFg_DWork.Memory_PreviousInput_hx = A380PrimComputerFg_P.Logic_table_iv
      [((((A380PrimComputerFg_DWork.Delay_DSTATE_c.manual_spd_control_active && (!rtb_LowerRelop1)) ||
          (A380PrimComputerFg_U.in.general_logic.on_ground && (rtb_NOT1_it && rtb_NOT1_k_tmp && rtb_y_at) &&
           (rtb_AND2_ci || rtb_AND10_j))) + (static_cast<uint32_T>(rtb_y_gn) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_hx];
    rtb_y_gn = rtb_LowerRelop1_p;
    rtb_AND10_j = (A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_engaged ||
                   A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_2_engaged);
    rtb_Compare_han_0 = (A380PrimComputerFg_DWork.Memory_PreviousInput_kj ||
                         A380PrimComputerFg_DWork.Memory_PreviousInput_i);
    rtb_LowerRelop1_p = ((((A380PrimComputerFg_DWork.Memory_PreviousInput_j ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_kc) && (A380PrimComputerFg_U.in.flight_envelope.v_max_kn +
      A380PrimComputerFg_P.Bias_Bias_p < rtb_Y_m)) || ((rtb_Y_m < A380PrimComputerFg_U.in.flight_envelope.v_ls_kn +
      A380PrimComputerFg_P.Bias1_Bias_e) && rtb_Compare_han_0)) && rtb_LowerRelop1_p && rtb_Logic_fj[0] && rtb_AND10_j);
    vsOrFpaEngaged = (rtb_AND3_oo || rtb_BusAssignment_mv_fg_mode_logic_longitudinal_modes_fpa_active);
    if (rtb_AND3_oo) {
      rtb_altStd = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.vertical_speed_ft_min -
        A380PrimComputerFg_DWork.pValue;
      rtb_Mod1_o = 50.0;
    } else {
      rtb_altStd = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.flight_path_angle_deg -
        A380PrimComputerFg_DWork.pValue;
      rtb_Mod1_o = 0.1;
    }

    rtb_LowerRelop1 = (rtb_vsInertValid && vsOrFpaEngaged);
    rtb_y_e = ((rtb_LowerRelop1 && (rtb_Y_m < A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + 3.0) && (rtb_altStd <
      -rtb_Mod1_o)) || (rtb_LowerRelop1 && (rtb_Y_m > A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 3.0) &&
                        (rtb_altStd > rtb_Mod1_o)));
    A380PrimComputerFg_MATLABFunction_hf((A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged &&
      (rtb_y_e || rtb_LowerRelop1_p || rtb_y_nt || rtb_BusAssignment_mv_fg_mode_logic_longitudinal_mode_reversion_vs ||
       rtb_Compare_fz)), A380PrimComputerFg_U.in.data.time.dt, &rtb_AND10_j,
      A380PrimComputerFg_P.MTrigNode2_isRisingEdge_o, A380PrimComputerFg_P.MTrigNode2_retriggerable_j,
      A380PrimComputerFg_P.MTrigNode2_triggerDuration_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_ok);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_g, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_j0);
    rtb_LowerRelop1 = (rtb_y_gn && vsOrFpaEngaged);
    A380PrimComputerFg_MATLABFunction_hf((rtb_BusAssignment_mv_fg_mode_logic_longitudinal_mode_reversion_vs ||
      rtb_LowerRelop1), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_gn, A380PrimComputerFg_P.MTrigNode_isRisingEdge_le,
      A380PrimComputerFg_P.MTrigNode_retriggerable_md, A380PrimComputerFg_P.MTrigNode_triggerDuration_jd,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_a0p);
    A380PrimComputerFg_MATLABFunction_hf((rtb_Compare_fz || rtb_LowerRelop1), A380PrimComputerFg_U.in.data.time.dt,
      &rtb_LowerRelop1, A380PrimComputerFg_P.MTrigNode1_isRisingEdge_n, A380PrimComputerFg_P.MTrigNode1_retriggerable_d,
      A380PrimComputerFg_P.MTrigNode1_triggerDuration_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_lth);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.ap_fd_mode_reversion = rtb_AND10_j;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.pitch_fd_bars_flashing = rtb_y_gn;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.roll_fd_bars_flashing = rtb_LowerRelop1;
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_g, &rtb_y);
    A380PrimComputerFg_MATLABFunction_hf(((!A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.hdg_trk_dashes) || (rtb_y
      != 0U)), A380PrimComputerFg_U.in.data.time.dt, &rtb_AND2_ci, A380PrimComputerFg_P.MTrigNode1_isRisingEdge_mw,
      A380PrimComputerFg_P.MTrigNode1_retriggerable_o0, A380PrimComputerFg_P.MTrigNode1_triggerDuration_b,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_d4);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_DWork.Memory_PreviousInput_o4,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_ei,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_b, &rtb_y_gn, &A380PrimComputerFg_DWork.sf_MATLABFunction_dxb);
    rtb_LowerRelop1 = (A380PrimComputerFg_DWork.Memory_PreviousInput_f ||
                       A380PrimComputerFg_DWork.Memory_PreviousInput_ox ||
                       A380PrimComputerFg_DWork.Memory_PreviousInput_e ||
                       A380PrimComputerFg_DWork.Memory_PreviousInput_l ||
                       A380PrimComputerFg_DWork.Memory_PreviousInput_p ||
                       A380PrimComputerFg_DWork.Memory_PreviousInput_h);
    rtb_y_gn = (rtb_y_gn || rtb_LowerRelop1);
    rtb_AND10_j = !A380PrimComputerFg_U.in.general_logic.all_ra_failure;
    rtb_LowerRelop1 = (rtb_LowerRelop1 || A380PrimComputerFg_U.in.general_logic.on_ground ||
                       ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <
                         A380PrimComputerFg_P.CompareToConstant_const_ki) && rtb_AND10_j));
    rtb_y_gn = (rtb_AND2_ci && rtb_y_gn && rtb_LowerRelop1);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_la, &rtb_y);
    A380PrimComputerFg_MATLABFunction_hf((rtb_y != 0U), A380PrimComputerFg_U.in.data.time.dt, &rtb_AND10_j,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_k, A380PrimComputerFg_P.MTrigNode_retriggerable_cq,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_ep5);
    A380PrimComputerFg_MATLABFunction_a(rtb_y_d, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_f1, A380PrimComputerFg_P.ConfirmNode_timeDelay_ki, &rtb_AND2_ci,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_llo);
    A380PrimComputerFg_DWork.Memory_PreviousInput_py = A380PrimComputerFg_P.Logic_table_bk[((((!rtb_LowerRelop1) ||
      rtb_y_p3 || rtb_AND7_b || A380PrimComputerFg_DWork.Memory_PreviousInput_eu || rtb_AND10_j || rtb_AND2_ci) + (
      static_cast<uint32_T>(rtb_y_gn) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_py];
    if (rtb_y_at) {
      A380PrimComputerFg_B.u_l = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_app_kts;
    }

    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_U.in.data.adcn_inputs.fms.tower_headwind_kn, &rtb_mach_b);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.fms.tower_headwind_kn, &rtb_y_at);
    rtb_AND2_ci = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                   A380PrimComputerFg_P.EnumeratedConstant_Value_l);
    if (A380PrimComputerFg_U.in.flight_envelope.v_man_visible) {
      rtb_Mod1_o = A380PrimComputerFg_U.in.flight_envelope.v_man_kn;
    } else if (A380PrimComputerFg_U.in.flight_envelope.v_4_visible) {
      rtb_Mod1_o = A380PrimComputerFg_U.in.flight_envelope.v_4_kn;
    } else if (A380PrimComputerFg_U.in.flight_envelope.v_3_visible &&
               ((A380PrimComputerFg_U.in.general_logic.flap_handle_index !=
                 A380PrimComputerFg_P.CompareToConstant_const_a) ||
                (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.flap_3_approach_selected) || (!rtb_AND2_ci))) {
      rtb_Mod1_o = A380PrimComputerFg_U.in.flight_envelope.v_3_kn;
    } else {
      rtb_Mod1_o = A380PrimComputerFg_P.Constant_Value_hn;
    }

    if (!A380PrimComputerFg_DWork.vMemoEo_not_empty) {
      A380PrimComputerFg_DWork.vMemoEo = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
      A380PrimComputerFg_DWork.vMemoEo_not_empty = true;
    }

    if (!A380PrimComputerFg_DWork.vMemoGa_not_empty) {
      A380PrimComputerFg_DWork.vMemoGa = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
      A380PrimComputerFg_DWork.vMemoGa_not_empty = true;
    }

    if (rtb_NOT1_it) {
      A380PrimComputerFg_DWork.vMemoGa = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    if (!A380PrimComputerFg_U.in.general_logic.engine_out) {
      A380PrimComputerFg_DWork.vMemoEo = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_at) {
      if (A380PrimComputerFg_U.in.general_logic.engine_out) {
        high_i = 15;
      } else {
        high_i = 25;
      }

      rtb_Mod2_j = A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + static_cast<real_T>(high_i);
      rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 5.0;
      if (A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 5.0 > rtb_Mod2_j) {
        rtb_DataTypeConversion23 = rtb_Mod2_j;
      }

      if (rtb_DataTypeConversion23 > A380PrimComputerFg_DWork.vMemoGa) {
        rtb_DataTypeConversion23 = A380PrimComputerFg_DWork.vMemoGa;
      }

      rtb_Switch5_d_idx_0 = std::fmax(A380PrimComputerFg_B.u_l, rtb_DataTypeConversion23);
      rtb_Mod2_j = rtb_Switch5_d_idx_0;
    } else if (A380PrimComputerFg_U.in.general_logic.engine_out) {
      rtb_Switch5_d_idx_0 = std::fmax(A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts, std::fmin
        (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts + 15.0, A380PrimComputerFg_DWork.vMemoEo));
      rtb_Mod2_j = rtb_Switch5_d_idx_0;
    } else {
      rtb_Switch5_d_idx_0 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts + 10.0;
      rtb_Mod2_j = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts;
    }

    A380PrimComputerFg_DWork.Memory_PreviousInput_dp = A380PrimComputerFg_P.Logic_table_b4[(((static_cast<uint32_T>
      ((rtb_Y_m < A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_lower_margin_kts) &&
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode ==
        A380PrimComputerFg_P.EnumeratedConstant2_Value)) << 1) + ((rtb_Y_m >
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts) ||
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode !=
       A380PrimComputerFg_P.EnumeratedConstant2_Value))) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_dp];
    if (A380PrimComputerFg_DWork.Memory_PreviousInput_e || A380PrimComputerFg_DWork.Memory_PreviousInput_ov ||
        rtb_AND2_ci) {
      if (rtb_y_at) {
        rtb_Mod2_j = rt_modd((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_dir_deg -
                              (A380PrimComputerFg_B.u_lyjj + A380PrimComputerFg_P.Constant3_Value)) +
                             A380PrimComputerFg_P.Constant3_Value, A380PrimComputerFg_P.Constant3_Value);
        rtb_Switch5_d_idx_0 = rt_modd(A380PrimComputerFg_P.Constant3_Value - rtb_Mod2_j,
          A380PrimComputerFg_P.Constant3_Value);
        if (A380PrimComputerFg_U.in.flight_envelope.v_fe_next_visible) {
          rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.flight_envelope.v_fe_next_kn;
        } else {
          rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias_Bias;
        }

        if (rtb_Mod2_j < rtb_Switch5_d_idx_0) {
          rtb_Mod2_j *= A380PrimComputerFg_P.Gain1_Gain_k;
        } else {
          rtb_Mod2_j = A380PrimComputerFg_P.Gain_Gain_c * rtb_Switch5_d_idx_0;
        }

        rtb_Mod2_j = std::fmin(rtb_DataTypeConversion23, std::fmax(std::cos(A380PrimComputerFg_P.Gain1_Gain_g *
          rtb_Mod2_j) * A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.wind_speed_kn - std::fmax(
          static_cast<real_T>(rtb_mach_b), A380PrimComputerFg_P.Constant1_Value_o),
          A380PrimComputerFg_P.Constant_Value_j) * A380PrimComputerFg_P.Gain_Gain_m + A380PrimComputerFg_B.u_l);
      } else {
        rtb_Mod2_j = A380PrimComputerFg_B.u_l;
      }

      rtb_Switch5_d_idx_0 = std::fmax(rtb_Mod1_o, rtb_Mod2_j);
    } else if (!rtb_y_o0) {
      rtb_LowerRelop1 = (A380PrimComputerFg_DWork.Memory_PreviousInput_kj &&
                         A380PrimComputerFg_U.in.data.adcn_inputs.fms.show_speed_margins);
      if ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode ==
           A380PrimComputerFg_P.EnumeratedConstant1_Value) && rtb_LowerRelop1) {
        rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_upper_margin_kts;
      } else if (rtb_LowerRelop1 && A380PrimComputerFg_DWork.Memory_PreviousInput_dp) {
        rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_lower_margin_kts;
      } else {
        rtb_DataTypeConversion23 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
      }

      rtb_Switch5_d_idx_0 = std::fmax(rtb_Mod1_o, rtb_DataTypeConversion23);
      rtb_Mod2_j = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_hx) {
      rtb_Mod1_o = rtb_Switch5_d_idx_0;
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.pfd_spd_target_kts = rtb_Mod2_j;
    } else {
      if (rtb_Logic_op[0]) {
        rtb_trackTrue = std::sqrt(std::pow((std::pow(A380PrimComputerFg_DWork.pValue_e *
          A380PrimComputerFg_DWork.pValue_e * 0.2F + 1.0F, 3.5F) - 1.0F) * (rtb_trackTrue / 1013.25F) + 1.0F,
          0.285714298F) - 1.0F) * 1479.1F;
      } else {
        rtb_trackTrue = A380PrimComputerFg_DWork.pValue_e;
      }

      rtb_Mod1_o = rtb_trackTrue;
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.pfd_spd_target_kts = rtb_trackTrue;
    }

    A380PrimComputerFg_Voter1(A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias_Bias_b,
      rtb_Mod1_o, A380PrimComputerFg_U.in.flight_envelope.v_ls_kn, &rtb_Mod2_j);
    rtb_Mod1_o = rtb_Mod2_j;
    rtb_LowerRelop1 = (A380PrimComputerFg_DWork.Memory_PreviousInput_e0 &&
                       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                        A380PrimComputerFg_P.EnumeratedConstant_Value_k) && rtb_Logic_op[0] && rtb_Logic_fj[0]);
    rtb_DataTypeConversion25 = std::abs(rtb_Mod2_j - rtb_Y_m);
    rtb_y_o0 = (rtb_DataTypeConversion25 > A380PrimComputerFg_P.CompareToConstant_const_iw);
    A380PrimComputerFg_MATLABFunction_a(rtb_y_o0, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_ku, A380PrimComputerFg_P.ConfirmNode1_timeDelay_n,
      &rtb_disengagementCondition, &A380PrimComputerFg_DWork.sf_MATLABFunction_ar);
    A380PrimComputerFg_MATLABFunction_a((rtb_DataTypeConversion25 > A380PrimComputerFg_P.CompareToConstant1_const_gt),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode2_isRisingEdge_h,
      A380PrimComputerFg_P.ConfirmNode2_timeDelay_j, &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_dgp);
    rtb_AND10_j = (rtb_Mod2_j != A380PrimComputerFg_DWork.DelayInput1_DSTATE_d);
    rtb_y_gn = ((!rtb_LowerRelop1) || rtb_disengagementCondition || rtb_y_d || (rtb_Y_m >
      A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias_Bias_mk) || rtb_AND10_j);
    A380PrimComputerFg_MATLABFunction_a((rtb_LowerRelop1 && (!rtb_y_o0) && (!rtb_y_gn)),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_jo,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_aq, &rtb_y_at, &A380PrimComputerFg_DWork.sf_MATLABFunction_ps);
    A380PrimComputerFg_DWork.Memory_PreviousInput_i5 = A380PrimComputerFg_P.Logic_table_lp[(((static_cast<uint32_T>
      (rtb_y_at) << 1) + rtb_y_gn) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_i5];
    rtb_active_lateral_law = lateral_law::NONE;
    rtb_active_longitudinal_law = vertical_law::NONE;
    if (A380PrimComputerFg_DWork.Memory_PreviousInput_en || A380PrimComputerFg_DWork.Memory_PreviousInput_o) {
      rtb_active_lateral_law = lateral_law::ROLL_OUT;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_ox || A380PrimComputerFg_DWork.Memory_PreviousInput_e) {
      rtb_active_lateral_law = lateral_law::LOC_TRACK;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_f) {
      rtb_active_lateral_law = lateral_law::LOC_CPT;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_eu) {
      rtb_active_lateral_law = lateral_law::HPATH;
    } else if (rtb_AND7_b || A380PrimComputerFg_DWork.Memory_PreviousInput_h ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_p) {
      rtb_active_lateral_law = lateral_law::TRACK;
    } else if (rtb_y_p3) {
      rtb_active_lateral_law = lateral_law::HDG;
    }

    if (rtb_y_av) {
      rtb_active_longitudinal_law = vertical_law::FLARE;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_lp || A380PrimComputerFg_DWork.Memory_PreviousInput_ae ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_e) {
      rtb_active_longitudinal_law = vertical_law::GS;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_n || A380PrimComputerFg_DWork.Memory_PreviousInput_at) {
      rtb_active_longitudinal_law = vertical_law::SRS;
    } else if (rtb_BusAssignment_mv_fg_mode_logic_longitudinal_modes_fpa_active) {
      rtb_active_longitudinal_law = vertical_law::FPA;
    } else if (rtb_AND3_oo || (A380PrimComputerFg_DWork.Memory_PreviousInput_kx && (rtb_mode == tcas_submode::VS)) ||
               (A380PrimComputerFg_DWork.Memory_PreviousInput_e0 && A380PrimComputerFg_DWork.Memory_PreviousInput_hw)) {
      rtb_active_longitudinal_law = vertical_law::VS;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_j || A380PrimComputerFg_DWork.Memory_PreviousInput_i ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_kc) {
      rtb_active_longitudinal_law = vertical_law::SPD_MACH;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_l1 || (A380PrimComputerFg_DWork.Memory_PreviousInput_kx &&
                (rtb_mode == tcas_submode::ALT_ACQ))) {
      rtb_active_longitudinal_law = vertical_law::ALT_ACQ;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_e0 || (A380PrimComputerFg_DWork.Memory_PreviousInput_kx &&
                (rtb_mode == tcas_submode::ALT_HOLD))) {
      rtb_active_longitudinal_law = vertical_law::ALT_HOLD;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_l) {
      rtb_active_longitudinal_law = vertical_law::VPATH;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_kj) {
      if (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::SPEED_THRUST) {
        rtb_active_longitudinal_law = vertical_law::SPD_MACH;
      } else if ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_THRUST) ||
                 (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_SPEED))
      {
        rtb_active_longitudinal_law = vertical_law::VPATH;
      } else {
        switch (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode) {
         case fmgc_des_submode::FPA_SPEED:
          rtb_active_longitudinal_law = vertical_law::FPA;
          break;

         case fmgc_des_submode::VS_SPEED:
          rtb_active_longitudinal_law = vertical_law::VS;
          break;
        }
      }
    }

    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Memory_PreviousInput_kx,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_ky, &rtb_y_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_bo);
    A380PrimComputerFg_MATLABFunction_a(A380PrimComputerFg_DWork.Memory_PreviousInput_kx,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_a0,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_pt, &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_iv);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_e, &rtb_altStd);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_al, &rtb_trackMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_hj, &rtb_headingMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault4_defaultValue, &rtb_Y_m);
    rtb_y_at = !A380PrimComputerFg_DWork.Memory_PreviousInput_kx;
    rtb_Switch_o_runway_heading_deg_SSM = (((rtb_y_at || (rtb_y_d && ((rtb_altStd <
      A380PrimComputerFg_P.CompareToConstant_const_mj) || (rtb_trackMag <
      A380PrimComputerFg_P.CompareToConstant1_const_ko) || (rtb_headingMag <
      A380PrimComputerFg_P.CompareToConstant2_const_pa) || (rtb_Y_m < A380PrimComputerFg_P.CompareToConstant3_const_l))))
      + (static_cast<uint32_T>(rtb_y_o0) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_ou;
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_P.Logic_table_ho[rtb_Switch_o_runway_heading_deg_SSM + 8U] &&
      A380PrimComputerFg_U.in.flight_envelope.alpha_floor_condition), A380PrimComputerFg_P.PulseNode3_isRisingEdge_nw,
      &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_l0);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.ats_discrete_word,
      A380PrimComputerFg_P.BitfromLabel1_bit_io, &rtb_y);
    rtb_y_o0 = !rtb_Logic_fj[0];
    A380PrimComputerFg_Subsystem(rtb_y_d, rtb_y_o0, (rtb_y != 0U),
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active, rtb_Logic_es, &A380PrimComputerFg_DWork.Subsystem4,
      &A380PrimComputerFg_P.Subsystem4);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_k, &rtb_headingMag);
    rtb_LowerRelop1 = (rtb_headingMag >= A380PrimComputerFg_P.CompareToConstant_const_bx);
    rtb_Compare_dy = (rtb_headingMag <= A380PrimComputerFg_P.CompareToConstant2_const_kg);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_n, &rtb_altStd);
    rtb_Compare_gc = (rtb_altStd >= A380PrimComputerFg_P.CompareToConstant1_const_mh);
    rtb_Compare_jd = (rtb_altStd <= A380PrimComputerFg_P.CompareToConstant3_const_e);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_j, &rtb_trackMag);
    rtb_Compare_i5 = (rtb_trackMag >= A380PrimComputerFg_P.CompareToConstant12_const);
    rtb_Compare_j1 = (rtb_trackMag <= A380PrimComputerFg_P.CompareToConstant14_const);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_l, &rtb_Y_m);
    rtb_Compare_oy = (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant13_const);
    rtb_Compare_pk = (rtb_Y_m <= A380PrimComputerFg_P.CompareToConstant15_const);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_flex_temp_deg,
      &rtb_AND10_j);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_flex_temp_deg,
      &rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_flex_temp_deg,
      &rtb_disengagementCondition);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_flex_temp_deg, &rtb_y_d);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault4_defaultValue_e, &rtb_headingMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault5_defaultValue, &rtb_altStd);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault6_defaultValue, &rtb_trackMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault7_defaultValue, &rtb_Y_m);
    rtb_Compare_dy = (rtb_Logic_fj[0] && (rtb_Logic_es[0] || (rtb_LowerRelop1 && rtb_Compare_dy && rtb_Compare_gc &&
      rtb_Compare_jd && rtb_Compare_i5 && rtb_Compare_j1 && rtb_Compare_oy && rtb_Compare_pk) || ((!rtb_AND10_j) &&
      (!rtb_y_gn) && (!rtb_disengagementCondition) && (!rtb_y_d) && A380PrimComputerFg_U.in.general_logic.engine_out &&
      ((rtb_headingMag >= A380PrimComputerFg_P.CompareToConstant4_const_g) && (rtb_headingMag <=
      A380PrimComputerFg_P.CompareToConstant6_const_k) && (rtb_altStd >= A380PrimComputerFg_P.CompareToConstant5_const_p)
       && (rtb_altStd <= A380PrimComputerFg_P.CompareToConstant7_const_l) && (rtb_trackMag >=
      A380PrimComputerFg_P.CompareToConstant8_const_kz) && (rtb_trackMag <=
      A380PrimComputerFg_P.CompareToConstant10_const_c) && (rtb_Y_m >= A380PrimComputerFg_P.CompareToConstant9_const_k) &&
       (rtb_Y_m <= A380PrimComputerFg_P.CompareToConstant11_const_p)))));
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_a, &rtb_Y_m);
    rtb_DataTypeConversion25 = rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_g, &rtb_Y_m);
    rtb_DataTypeConversion23 = rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_mu, &rtb_Y_m);
    rtb_Gain2 = rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_f2, &rtb_Y_m);
    rtb_Compare_gc = ((rtb_DataTypeConversion25 < A380PrimComputerFg_P.CompareToConstant10_const_h) &&
                      (rtb_DataTypeConversion23 < A380PrimComputerFg_P.CompareToConstant11_const) && (rtb_Gain2 <
      A380PrimComputerFg_P.CompareToConstant1_const_b) && (rtb_Y_m < A380PrimComputerFg_P.CompareToConstant2_const_f));
    rtb_Compare_jd = (A380PrimComputerFg_U.in.general_logic.engine_out && (rtb_DataTypeConversion25 <
      A380PrimComputerFg_P.CompareToConstant8_const_k) && (rtb_DataTypeConversion23 <
      A380PrimComputerFg_P.CompareToConstant9_const_d) && (rtb_Gain2 < A380PrimComputerFg_P.CompareToConstant3_const_i) &&
                      (rtb_Y_m < A380PrimComputerFg_P.CompareToConstant4_const_c));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.ats_discrete_word,
      A380PrimComputerFg_P.BitfromLabel1_bit_lz, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((((rtb_active_longitudinal_law == vertical_law::SPD_MACH) ||
      (rtb_active_longitudinal_law == vertical_law::SRS) || ((rtb_active_longitudinal_law == vertical_law::VPATH) &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_THRUST))) &&
      rtb_Logic_fj[0]), A380PrimComputerFg_P.PulseNode_isRisingEdge_m, &rtb_y_d,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_k1);
    rtb_AND10_j = !rtb_Logic_es[0];
    rtb_LowerRelop1 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      rtb_y_d && rtb_AND10_j));
    A380PrimComputerFg_MATLABFunction_a(rtb_LowerRelop1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_gd, A380PrimComputerFg_P.ConfirmNode_timeDelay_pz, &rtb_y_d,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bq);
    A380PrimComputerFg_DWork.Memory_PreviousInput_jm = A380PrimComputerFg_P.Logic_table_ja[(((rtb_y_o0 ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE_c.alpha_floor_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.retard_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.speed_mach_mode_active) && (!rtb_y_d))) + (static_cast<uint32_T>
      (rtb_LowerRelop1) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_jm];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.ats_discrete_word,
      A380PrimComputerFg_P.BitfromLabel1_bit_m, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c(((((rtb_active_longitudinal_law == vertical_law::NONE) &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE_c.retard_mode_active) ||
       (!A380PrimComputerFg_U.in.general_logic.on_ground))) || (rtb_active_longitudinal_law == vertical_law::ALT_HOLD) ||
      (rtb_active_longitudinal_law == vertical_law::ALT_ACQ) || (rtb_active_longitudinal_law == vertical_law::VS) ||
      (rtb_active_longitudinal_law == vertical_law::FPA) || (rtb_active_longitudinal_law == vertical_law::GS) ||
      (rtb_active_longitudinal_law == vertical_law::FLARE) || ((rtb_active_longitudinal_law == vertical_law::VPATH) &&
      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_SPEED) ||
       A380PrimComputerFg_DWork.Memory_PreviousInput_l))) && rtb_Logic_fj[0]),
      A380PrimComputerFg_P.PulseNode_isRisingEdge_hj, &rtb_y_d, &A380PrimComputerFg_DWork.sf_MATLABFunction_o3);
    rtb_LowerRelop1 = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      rtb_y_d && rtb_AND10_j));
    A380PrimComputerFg_MATLABFunction_a(rtb_LowerRelop1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_br, A380PrimComputerFg_P.ConfirmNode_timeDelay_el, &rtb_y_d,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pl);
    A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.Logic_table_e[(((rtb_y_o0 ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE_c.alpha_floor_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.retard_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE_c.thrust_mode_active) && (!rtb_y_d))) + (static_cast<uint32_T>
      (rtb_LowerRelop1) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_hs];
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_DWork.Delay_DSTATE[0U].fg.ats_discrete_word,
      A380PrimComputerFg_P.BitfromLabel1_bit_bb, &rtb_y);
    rtb_vsInertValid = (((rtb_y != 0U) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.mode_sync_active) || (tmp &&
      A380PrimComputerFg_DWork.Memory_PreviousInput_e && rtb_vsInertValid &&
      (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <= A380PrimComputerFg_P.CompareToConstant_const_d4) &&
      rtb_AND10_j));
    A380PrimComputerFg_MATLABFunction_a(rtb_vsInertValid, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_d3, A380PrimComputerFg_P.ConfirmNode_timeDelay_jv, &rtb_y_d,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bl);
    rtb_LowerRelop1 = (rtb_y_o0 || ((A380PrimComputerFg_DWork.Delay_DSTATE_c.alpha_floor_mode_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.thrust_mode_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE_c.speed_mach_mode_active) && (!rtb_y_d)));
    A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.Logic_table_fj[(((static_cast<uint32_T>
      (rtb_vsInertValid) << 1) + rtb_LowerRelop1) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_gd];
    rtb_vsInertValid = (rtb_Compare_han_0 || A380PrimComputerFg_DWork.Memory_PreviousInput_l);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_ag, &rtb_headingMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_hs, &rtb_altStd);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_i, &rtb_trackMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_id, &rtb_Y_m);
    rtb_Y_m = std::fmax(std::fmax(std::fmax(rtb_headingMag, rtb_altStd), rtb_trackMag), rtb_Y_m);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_flex_temp_deg,
      &rtb_y_gn);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_flex_temp_deg,
      &rtb_LowerRelop1);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_flex_temp_deg,
      &rtb_disengagementCondition);
    A380PrimComputerFg_MATLABFunction_j(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_flex_temp_deg, &rtb_y_d);
    rtb_disengagementCondition = (rtb_y_gn || rtb_LowerRelop1 || rtb_disengagementCondition || rtb_y_d);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::NONE;
    rtb_Compare_han_0 = !rtb_Compare_dy;
    rtb_y_o0 = (rtb_Logic_fj[0] && rtb_Compare_han_0);
    if (rtb_y_o0 && (rtb_Y_m > 44.0F)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::MAN_TOGA;
    } else if (rtb_y_o0 && (rtb_Y_m > 34.0F) && (rtb_Y_m < 36.0F) && rtb_disengagementCondition) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::MAN_FLEX;
    } else if (rtb_Logic_fj[0] && (!rtb_Compare_dy) && (rtb_Y_m > 34.0F) && (rtb_Y_m < 36.0F) &&
               (!rtb_disengagementCondition)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::MAN_MCT;
    } else if (rtb_y_o0 && (rtb_Y_m > 24.0F)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::MAN_THR;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && A380PrimComputerFg_DWork.Memory_PreviousInput_hs && (!rtb_Logic_op[0]))
    {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::SPEED;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && A380PrimComputerFg_DWork.Memory_PreviousInput_hs && rtb_Logic_op[0])
    {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::MACH;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && A380PrimComputerFg_DWork.Memory_PreviousInput_jm && (rtb_Y_m > 34.0F)
               && (!rtb_vsInertValid)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::THR_MCT;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && A380PrimComputerFg_DWork.Memory_PreviousInput_jm && (rtb_Y_m > 24.0F)
               && (!rtb_vsInertValid)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::THR_CLB;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && A380PrimComputerFg_DWork.Memory_PreviousInput_jm && (rtb_Y_m < 25.0F)
               && (!rtb_vsInertValid)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::THR_LVR;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && ((A380PrimComputerFg_DWork.Memory_PreviousInput_jm &&
                 rtb_vsInertValid) || A380PrimComputerFg_DWork.Memory_PreviousInput_gd)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::THR_IDLE;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && rtb_Logic_es[0] &&
               A380PrimComputerFg_U.in.flight_envelope.alpha_floor_condition) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::A_FLOOR;
    } else if (rtb_Logic_fj[0] && rtb_Compare_dy && rtb_Logic_es[0] &&
               (!A380PrimComputerFg_U.in.flight_envelope.alpha_floor_condition)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_mode = a380_athr_fma_mode::TOGA_LK;
    }

    A380PrimComputerFg_DWork.Memory_PreviousInput_oyc = A380PrimComputerFg_P.Logic_table_fg[(((static_cast<uint32_T>
      (((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft >=
         A380PrimComputerFg_U.in.data.adcn_inputs.fms.thrust_reduction_alt_ft) ||
        A380PrimComputerFg_DWork.Memory_PreviousInput_l1 || A380PrimComputerFg_DWork.Memory_PreviousInput_e0 ||
        rtb_AND3_oo || rtb_BusAssignment_mv_fg_mode_logic_longitudinal_modes_fpa_active) &&
       (!A380PrimComputerFg_U.in.general_logic.engine_out)) << 1) + (A380PrimComputerFg_U.in.general_logic.engine_out ||
      A380PrimComputerFg_U.in.general_logic.on_ground || ((A380PrimComputerFg_P.EnumeratedConstant_Value_ag ==
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
      (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft <
       A380PrimComputerFg_U.in.data.adcn_inputs.fms.thrust_reduction_alt_ft)))) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_oyc];
    A380PrimComputerFg_DWork.Memory_PreviousInput_g3 = A380PrimComputerFg_P.Logic_table_nr[(((static_cast<uint32_T>
      (((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft >=
         A380PrimComputerFg_U.in.data.adcn_inputs.fms.thrust_reduction_alt_ft) ||
        A380PrimComputerFg_DWork.Memory_PreviousInput_l1 || A380PrimComputerFg_DWork.Memory_PreviousInput_e0 ||
        rtb_AND3_oo || rtb_BusAssignment_mv_fg_mode_logic_longitudinal_modes_fpa_active) &&
       A380PrimComputerFg_U.in.general_logic.engine_out) << 1) + ((!A380PrimComputerFg_U.in.general_logic.engine_out) ||
      A380PrimComputerFg_U.in.general_logic.on_ground || ((A380PrimComputerFg_P.EnumeratedConstant1_Value_i ==
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
      (A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft <
       A380PrimComputerFg_U.in.data.adcn_inputs.fms.thrust_reduction_alt_ft)))) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_g3];
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault4_defaultValue_o, &rtb_Y_m);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault5_defaultValue_n, &rtb_headingMag);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault6_defaultValue_b, &rtb_altStd);
    A380PrimComputerFg_MATLABFunction(&A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg,
      A380PrimComputerFg_P.A429ValueOrDefault7_defaultValue_l, &rtb_trackMag);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_message = a380_athr_fma_message::NONE;
    rtb_disengagementCondition = (rtb_Logic_fj[0] && rtb_AND10_j);
    rtb_LowerRelop1 = ((rtb_Y_m > 24.0F) && (rtb_Y_m < 26.0F));
    rtb_y_gn = ((rtb_headingMag > 24.0F) && (rtb_headingMag < 26.0F));
    rtb_y_d = ((rtb_altStd > 24.0F) && (rtb_altStd < 26.0F));
    rtb_AND10_j = ((rtb_trackMag > 24.0F) && (rtb_trackMag < 26.0F));
    if (rtb_disengagementCondition && ((A380PrimComputerFg_DWork.Memory_PreviousInput_oyc &&
          ((A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft >
            A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias_Bias_n) ||
           (A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target <=
            A380PrimComputerFg_P.CompareToConstant_const_cm) || rtb_y_at || (!rtb_Compare_han_0))) ||
         (A380PrimComputerFg_DWork.Memory_PreviousInput_kx && rtb_Compare_han_0 &&
          (A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target <=
           A380PrimComputerFg_P.CompareToConstant1_const_h4))) && (((rtb_Y_m < 24.0F) && (rtb_headingMag < 24.0F) &&
          (rtb_altStd < 24.0F) && (rtb_trackMag < 24.0F)) || (rtb_Y_m > 26.0F) || (rtb_headingMag > 26.0F) ||
         (rtb_altStd > 26.0F) || (rtb_trackMag > 26.0F))) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_message = a380_athr_fma_message::LVR_CLB;
    } else if (rtb_disengagementCondition && A380PrimComputerFg_DWork.Memory_PreviousInput_g3 && (rtb_Y_m < 34.0F) &&
               (rtb_headingMag < 34.0F) && (rtb_altStd < 34.0F) && (rtb_trackMag < 34.0F)) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_message = a380_athr_fma_message::LVR_MCT;
    } else if (rtb_disengagementCondition && (!A380PrimComputerFg_U.in.general_logic.engine_out) && (rtb_LowerRelop1 ||
                rtb_y_gn || rtb_y_d || rtb_AND10_j) && ((!rtb_LowerRelop1) || (!rtb_y_gn) || (!rtb_y_d) || (!rtb_AND10_j)))
    {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_fma_message = a380_athr_fma_message::LVR_ASYM;
    }

    rtb_trackMag = A380PrimComputerFg_B.BusAssignment_i.fg_logic.adirs_computation_data.altitude_indicated_ft -
      A380PrimComputerFg_DWork.pValue_p;
    rtb_AND10_j = (rtb_trackMag < A380PrimComputerFg_P.CompareToConstant_const_gf);
    rtb_LowerRelop1 = ((!rtb_AND4_a) && ((vsOrFpaEngaged && (A380PrimComputerFg_DWork.pValue !=
      A380PrimComputerFg_P.CompareToConstant1_const_ak)) || A380PrimComputerFg_DWork.Memory_PreviousInput_n ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_at));
    rtb_disengagementCondition = (rtb_LowerRelop1 && rtb_AND10_j);
    A380PrimComputerFg_MATLABFunction_hf(rtb_disengagementCondition, A380PrimComputerFg_U.in.data.time.dt, &rtb_y_d,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_kv, A380PrimComputerFg_P.MTrigNode_retriggerable_ci,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_h, &A380PrimComputerFg_DWork.sf_MATLABFunction_kw);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.fcu_alt_blw_acft = (rtb_LowerRelop1 && (!rtb_AND10_j));
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFg_P.BitfromLabel3_bit_h, &rtb_y);
    rtb_LowerRelop1 = (rtb_y != 0U);
    A380PrimComputerFg_MATLABFunction_e(&A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputerFg_P.BitfromLabel1_bit_mi, &rtb_y);
    rtb_LowerRelop1 = (rtb_LowerRelop1 || (rtb_y != 0U));
    rtb_OR2_nm = !rtb_OR2_nm;
    rtb_y_gn = (A380PrimComputerFg_U.in.fctl_logic.pitch_law_capability == a380_pitch_efcs_law::NormalLaw);
    rtb_OR4_kx = !rtb_OR4_kx;
    rtb_AND2 = !rtb_AND2;
    rtb_AND10_j = ((rtb_OR4_kx || rtb_AND2) && A380PrimComputerFg_B.BusAssignment_i.fg_logic.both_ils_valid &&
                   (!A380PrimComputerFg_U.in.general_logic.all_ra_failure) && rtb_y_gn && rtb_LowerRelop1 &&
                   (!A380PrimComputerFg_U.in.general_logic.double_adr_failure) &&
                   (!A380PrimComputerFg_U.in.general_logic.double_ir_failure));
    A380PrimComputerFg_B.BusAssignment_ic.data = A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusAssignment_ic.general_logic = A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusAssignment_ic.flight_envelope = A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusAssignment_ic.laws = A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusAssignment_ic.fctl_logic = A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusAssignment_ic.fg_logic = A380PrimComputerFg_B.BusAssignment_i.fg_logic;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.alignment_dummy =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.alignment_dummy;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.rwy_active = rtb_engagementCondition;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.nav_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_eu;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.loc_cpt_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_f;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.loc_trk_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ox;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.roll_goaround_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_p;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.hdg_active = rtb_y_p3;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.trk_active = rtb_AND7_b;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.rwy_loc_submode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_o;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.rwy_trk_submode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_h;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.land_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_e;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.align_submode_active =
      (A380PrimComputerFg_DWork.Delay_DSTATE_c.lateral_modes.land_active &&
       (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <= A380PrimComputerFg_P.CompareToConstant1_const_c));
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_modes.rollout_submode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_en;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.alignment_dummy =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.alignment_dummy;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.clb_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_j;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.des_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_kj;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.op_clb_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_kc;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.op_des_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_i;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.pitch_takeoff_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_n;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.pitch_goaround_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_at;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.vs_active = rtb_AND3_oo;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.fpa_active =
      rtb_BusAssignment_mv_fg_mode_logic_longitudinal_modes_fpa_active;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.alt_acq_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_l1;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.alt_hold_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_e0;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.alt_hold_vs_submode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_hw;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.gs_capt_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_lp;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.gs_trk_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ae;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.app_des_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_l;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.flare_active = rtb_y_av;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.cruise_active = (rtb_LowerRelop1_e ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_oz);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_modes.tcas_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_kx;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.alignment_dummy =
      A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.alignment_dummy;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.alt_acq_armed = rtb_AND4_a;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.alt_acq_arm_possible =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ek;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.nav_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_o4;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.loc_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_k;
    if (rtb_Mod1 < rtb_Mod2) {
      rtb_DataTypeConversion23 = A380PrimComputerFg_P.Gain1_Gain_l * rtb_Mod1;
    } else {
      rtb_DataTypeConversion23 = A380PrimComputerFg_P.Gain_Gain_k * rtb_Mod2;
    }

    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.rwy_armed = ((std::abs(rtb_DataTypeConversion23) <=
      A380PrimComputerFg_P.CompareToConstant2_const_c) && (rtb_DataTypeConversion11 <
      A380PrimComputerFg_P.CompareToConstant1_const_lr) && rtb_ap_fd_condition);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.land_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ov;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.glide_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_il;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.app_des_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_a;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.clb_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_oy;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.des_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ei;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.op_clb_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_m;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.armed_modes.tcas_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ik;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.active_lateral_law = rtb_active_lateral_law;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.active_longitudinal_law = rtb_active_longitudinal_law;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.auto_spd_control_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_hx;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.manual_spd_control_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_od;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.mach_control_active = rtb_Logic_op[0];
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_active = rtb_Compare_dy;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.athr_limited = (rtb_Compare_dy && (rtb_Compare_gc ||
      rtb_Compare_jd));
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.alpha_floor_mode_active = rtb_Logic_es[0];
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.thrust_mode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_jm;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.thrust_target_idle = rtb_vsInertValid;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.speed_mach_mode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_hs;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.retard_mode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_gd;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.spd_target_kts = rtb_Mod2_j;
    if (A380PrimComputerFg_DWork.Memory_PreviousInput_hx) {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.short_term_managed_spd_kts = rtb_Mod2_j;
    } else {
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.short_term_managed_spd_kts = rtb_Switch5_d_idx_0;
    }

    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.short_term_managed_spd_visible =
      (((A380PrimComputerFg_DWork.Memory_PreviousInput_hx &&
         (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
          A380PrimComputerFg_P.EnumeratedConstant2_Value_c) && (!A380PrimComputerFg_DWork.Memory_PreviousInput_kj)) ||
        (A380PrimComputerFg_DWork.Memory_PreviousInput_od && ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts !=
           A380PrimComputerFg_P.CompareToConstant2_const_ma) ||
          (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts != A380PrimComputerFg_P.CompareToConstant3_const_m))))
       && ((!A380PrimComputerFg_U.in.general_logic.on_ground) && rtb_NOT1_k_tmp && rtb_NOT1_it &&
           (A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged || rtb_AND2_ci)));
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.alt_cstr_applicable = rtb_AND_k1;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.alt_sel_or_cstr = absAdvRateToMaintain;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.any_ap_fd_engaged =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.any_ap_fd_engaged;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.any_lateral_mode_engaged = (rtb_engagementCondition ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_p || A380PrimComputerFg_DWork.Memory_PreviousInput_f ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_ox || rtb_y_p3 || rtb_AND7_b ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_eu || A380PrimComputerFg_DWork.Memory_PreviousInput_e);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.any_longitudinal_mode_engaged = (vsOrFpaEngaged ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_e0 || A380PrimComputerFg_DWork.Memory_PreviousInput_l1 ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_j || A380PrimComputerFg_DWork.Memory_PreviousInput_kj ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_l || A380PrimComputerFg_DWork.Memory_PreviousInput_lp ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_ae || A380PrimComputerFg_DWork.Memory_PreviousInput_kc ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_i || A380PrimComputerFg_DWork.Memory_PreviousInput_at ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_n || A380PrimComputerFg_DWork.Memory_PreviousInput_kx ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_e);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_mode_reset =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.lateral_mode_reset;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_mode_reset =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longitudinal_mode_reset;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.hdg_trk_preset_available =
      A380PrimComputerFg_DWork.Memory_PreviousInput_py;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.alt_soft_mode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_i5;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.fd_auto_disengage = rtb_LowerRelop1_p;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.lateral_mode_reversion = rtb_Compare_fz;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_mode_reversion_vs =
      rtb_BusAssignment_mv_fg_mode_logic_longitudinal_mode_reversion_vs;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longitudinal_mode_reversion_op_clb = rtb_y_nt;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.loc_bc_selection =
      A380PrimComputerFg_U.in.fg_mode_logic.loc_bc_selection;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.vs_target_not_held = rtb_y_e;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.tcas_vs_target =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.tcas_ra_corrective =
      A380PrimComputerFg_U.in.data.adcn_inputs.tcas.ra_corrective;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.active_tcas_submode = rtb_mode;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.tcas_alt_acq_cond =
      rtb_BusAssignment_p_fg_mode_logic_tcas_alt_acq_cond;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.tcas_alt_hold_cond =
      rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.tcas_ra_inhibited =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_ra_inhibited;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.trk_fpa_deselected =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.trk_fpa_deselected;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.longi_large_box_tcas =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.longi_large_box_tcas;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.fcu_alt_abv_acft = (rtb_disengagementCondition && rtb_y_d);
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.tla_to_ga_set = rtb_OR3_hg;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.true_active = rtb_Logic_pg[0];
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.trk_fpa_active = rtb_Logic_ag[0];
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.metric_alt_active = rtb_Logic_bn[0];
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.selected_spd_mach = A380PrimComputerFg_DWork.pValue_e;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.spd_mach_dashes = rtb_ap_fd_1_condition;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.selected_hdg_trk = A380PrimComputerFg_DWork.pValue_i;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.hdg_trk_dashes =
      A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.hdg_trk_dashes;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.selected_alt = A380PrimComputerFg_DWork.pValue_p;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.selected_vs_fpa = A380PrimComputerFg_DWork.pValue;
    A380PrimComputerFg_B.BusAssignment_ic.fg_laws = A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusAssignment_ic.discrete_outputs = A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusAssignment_ic.analog_outputs = A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusAssignment_ic.bus_outputs = A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.land_2_capability = rtb_AND10_j;
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.land_3_fail_passive_capability = (rtb_AND10_j && rtb_OR2_nm && (
      !A380PrimComputerFg_U.in.general_logic.two_ra_failure));
    A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.land_3_fail_op_capability = (rtb_OR4_kx && rtb_AND2 &&
      rtb_OR2_nm && rtb_LowerRelop1 && rtb_y_gn && A380PrimComputerFg_U.in.general_logic.is_yellow_hydraulic_power_avail
      && A380PrimComputerFg_U.in.general_logic.is_green_hydraulic_power_avail &&
      (((!A380PrimComputerFg_U.in.general_logic.ra_a_rejected) && (!A380PrimComputerFg_U.in.general_logic.ra_b_rejected))
       || ((!A380PrimComputerFg_U.in.general_logic.ra_a_rejected) &&
           (!A380PrimComputerFg_U.in.general_logic.ra_c_rejected))) &&
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.both_ils_valid &&
      ((!A380PrimComputerFg_U.in.general_logic.adr_1_rejected) && (!A380PrimComputerFg_U.in.general_logic.adr_2_rejected)
       && (!A380PrimComputerFg_U.in.general_logic.adr_3_rejected)) &&
      ((!A380PrimComputerFg_U.in.general_logic.ir_1_rejected) && (!A380PrimComputerFg_U.in.general_logic.ir_2_rejected) &&
       (!A380PrimComputerFg_U.in.general_logic.ir_3_rejected)));
    if ((rtb_y_ld && (A380PrimComputerFg_P.Constant4_Value != 0.0)) || (rtb_OR2 && (A380PrimComputerFg_P.Constant4_Value
          == 0.0))) {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn;
      rtb_Switch5_track_angle_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg;
      rtb_Switch5_heading_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_true_deg;
      rtb_Switch5_track_angle_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg;
      rtb_Switch5_heading_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg;
      rtb_Switch5_pitch_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg;
      rtb_Switch5_roll_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg;
      rtb_Switch5_body_pitch_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s;
      rtb_Switch5_body_roll_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s;
      rtb_Switch5_body_yaw_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s;
      rtb_Switch5_body_long_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_long_accel_g;
      rtb_Switch5_body_lat_accel_g = &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_lat_accel_g;
      rtb_Switch5_body_normal_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g;
      rtb_Switch5_inertial_vertical_speed_ft_s =
        &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s;
    } else if (A380PrimComputerFg_P.Constant4_Value > A380PrimComputerFg_P.Switch8_Threshold) {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.ground_speed_kn;
      rtb_Switch5_track_angle_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg;
      rtb_Switch5_heading_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_true_deg;
      rtb_Switch5_track_angle_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg;
      rtb_Switch5_heading_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg;
      rtb_Switch5_pitch_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.pitch_angle_deg;
      rtb_Switch5_roll_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg;
      rtb_Switch5_body_pitch_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s;
      rtb_Switch5_body_roll_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s;
      rtb_Switch5_body_yaw_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s;
      rtb_Switch5_body_long_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_long_accel_g;
      rtb_Switch5_body_lat_accel_g = &A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_lat_accel_g;
      rtb_Switch5_body_normal_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_normal_accel_g;
      rtb_Switch5_inertial_vertical_speed_ft_s =
        &A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s;
    } else {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.ground_speed_kn;
      rtb_Switch5_track_angle_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg;
      rtb_Switch5_heading_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_true_deg;
      rtb_Switch5_track_angle_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg;
      rtb_Switch5_heading_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg;
      rtb_Switch5_pitch_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.pitch_angle_deg;
      rtb_Switch5_roll_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg;
      rtb_Switch5_body_pitch_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s;
      rtb_Switch5_body_roll_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s;
      rtb_Switch5_body_yaw_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s;
      rtb_Switch5_body_long_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_long_accel_g;
      rtb_Switch5_body_lat_accel_g = &A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_lat_accel_g;
      rtb_Switch5_body_normal_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_normal_accel_g;
      rtb_Switch5_inertial_vertical_speed_ft_s =
        &A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s;
    }

    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_pitch_angle_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Theta_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_roll_angle_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Phi_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_body_pitch_rate_deg_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.qk_deg_s = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_body_yaw_rate_deg_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.rk_deg_s = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_body_roll_rate_deg_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.pk_deg_s = rtb_trackMag;
    rtb_LowerRelop1 = ((rtb_OR_lr && (A380PrimComputerFg_P.Constant3_Value_k != 0.0)) || (rtb_ap_fd_2_condition &&
      (A380PrimComputerFg_P.Constant3_Value_k == 0.0)));
    if (rtb_LowerRelop1) {
      rtb_Switch5_pitch_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft;
      rtb_Switch5_roll_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft;
      rtb_Switch5_body_pitch_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft;
      rtb_Switch5_body_roll_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.mach;
      rtb_Switch5_body_yaw_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn;
      rtb_Switch4_airspeed_true_kn = &A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_true_kn;
      rtb_Switch4_aoa_corrected_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg;
    } else if (A380PrimComputerFg_P.Constant3_Value_k > A380PrimComputerFg_P.Switch7_Threshold) {
      rtb_Switch5_pitch_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft;
      rtb_Switch5_roll_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft;
      rtb_Switch5_body_pitch_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft;
      rtb_Switch5_body_roll_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.mach;
      rtb_Switch5_body_yaw_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn;
      rtb_Switch4_airspeed_true_kn = &A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.airspeed_true_kn;
      rtb_Switch4_aoa_corrected_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg;
    } else {
      rtb_Switch5_pitch_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft;
      rtb_Switch5_roll_angle_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft;
      rtb_Switch5_body_pitch_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft;
      rtb_Switch5_body_roll_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.mach;
      rtb_Switch5_body_yaw_rate_deg_s = &A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn;
      rtb_Switch4_airspeed_true_kn = &A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.airspeed_true_kn;
      rtb_Switch4_aoa_corrected_deg = &A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg;
    }

    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_body_yaw_rate_deg_s, &rtb_altStd);
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch4_airspeed_true_kn, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.V_tas_kn = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_body_roll_rate_deg_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.V_mach = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&rtb_Switch2_d, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.V_gnd_kn = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch4_aoa_corrected_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.alpha_deg = rtb_trackMag;
    rtb_Mod1 = (A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.upper_rudder_deg +
                A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.lower_rudder_deg) *
      A380PrimComputerFg_P.Gain3_Gain;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_body_lat_accel_g, &rtb_headingMag);
    if (A380PrimComputerFg_U.in.flight_envelope.computed_gross_weight_kg > A380PrimComputerFg_P.Saturation_UpperSat_n) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation_UpperSat_n;
    } else if (A380PrimComputerFg_U.in.flight_envelope.computed_gross_weight_kg <
               A380PrimComputerFg_P.Saturation_LowerSat_n) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation_LowerSat_n;
    } else {
      rtb_DataTypeConversion11 = A380PrimComputerFg_U.in.flight_envelope.computed_gross_weight_kg;
    }

    A380PrimComputerFg_betaestimation1(rtb_altStd, rtb_headingMag, rtb_Mod1, rtb_DataTypeConversion11, &rtb_trackMag);
    A380PrimComputerFg_LagFilter(static_cast<real_T>(rtb_trackMag), A380PrimComputerFg_P.LagFilter1_C1,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_Mod2_j, &A380PrimComputerFg_DWork.sf_LagFilter_c);
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_pitch_angle_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.H_ft = rtb_trackMag;
    A380PrimComputerFg_AltitudeChoice(rtb_Switch5_pitch_angle_deg, rtb_Switch5_roll_angle_deg,
      rtb_Switch5_body_pitch_rate_deg_s, A380PrimComputerFg_P.Constant2_Value_d, &A380PrimComputerFg_B.BusAssignment_ic,
      &A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2, &A380PrimComputerFg_P.AltitudeChoice_m);
    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2,
      &rtb_trackMag);
    rtb_DataTypeConversion11 = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(rtb_Switch5_inertial_vertical_speed_ft_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.H_dot_ft_min = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&rtb_Switch5_heading_magnetic_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Psi_magnetic_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&rtb_Switch5_track_angle_magnetic_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Psi_magnetic_track_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&rtb_Switch5_heading_true_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Psi_true_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&rtb_Switch5_track_angle_true_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Chi_true_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&rtb_Switch5_body_long_accel_g, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.bx_m_s2 = A380PrimComputerFg_P.Gain_Gain_me * rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&rtb_Switch5_body_normal_accel_g, &rtb_trackMag);
    rtb_Mod2 = rtb_trackMag + A380PrimComputerFg_P.Bias_Bias_mq;
    if (!A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_tune_inhibit) {
      A380PrimComputerFg_B.u_d = A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.fms_loc_distance;
    }

    A380PrimComputerFg_MATLABFunction_j
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg, &rtb_LowerRelop1);
    rtb_Out_BusCreator_BusCreator1.data.H_ind_ft = rtb_DataTypeConversion11;
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_track_angle_magnetic_deg,
      A380PrimComputerFg_P.A429ValueOrDefault8_defaultValue, &rtb_trackMag);
    rtb_OR2_nm = ((!A380PrimComputerFg_DWork.Memory_PreviousInput_p) &&
                  (!A380PrimComputerFg_DWork.Memory_PreviousInput_h));
    if (rtb_OR2_nm) {
      A380PrimComputerFg_B.u_dg = rtb_trackMag;
      rtb_trackMag = A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_hdg_trk;
    } else {
      rtb_trackMag = A380PrimComputerFg_B.u_dg;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_hw) {
      rtb_Out_BusCreator_BusCreator1.input.H_c_ft = rtb_DataTypeConversion11;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.H_c_ft = absAdvRateToMaintain;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_kx) {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm =
        A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_kj) {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm =
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.vs_target_ft_min;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_hw) {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm = A380PrimComputerFg_P.Constant6_Value;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm = A380PrimComputerFg_DWork.pValue;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_kj) {
      rtb_Out_BusCreator_BusCreator1.input.FPA_c_deg =
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.vs_target_ft_min;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.FPA_c_deg = A380PrimComputerFg_DWork.pValue;
    }

    rtb_Out_BusCreator_BusCreator1.time.dt = A380PrimComputerFg_B.BusAssignment_i.data.time.dt;
    rtb_Out_BusCreator_BusCreator1.time.simulation_time = A380PrimComputerFg_B.BusAssignment_i.data.time.simulation_time;
    rtb_Out_BusCreator_BusCreator1.data.V_ias_kn = rtb_altStd;
    rtb_Out_BusCreator_BusCreator1.data.beta_deg = rtb_Mod2_j;
    rtb_Out_BusCreator_BusCreator1.data.H_radio_ft =
      A380PrimComputerFg_B.BusAssignment_i.general_logic.ra_computation_data_ft;
    rtb_Out_BusCreator_BusCreator1.data.by_m_s2 = A380PrimComputerFg_P.Gain1_Gain_o * rtb_headingMag;
    rtb_Out_BusCreator_BusCreator1.data.bz_m_s2 = A380PrimComputerFg_P.Gain2_Gain * rtb_Mod2;
    rtb_Out_BusCreator_BusCreator1.data.nav_loc_deg = A380PrimComputerFg_B.BusAssignment_i.fg_logic.rwy_hdg_memo;
    rtb_Out_BusCreator_BusCreator1.data.nav_gs_deg =
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.fms_unrealistic_gs_angle_deg;
    rtb_Out_BusCreator_BusCreator1.data.nav_dme_nmi = A380PrimComputerFg_B.u_d;
    rtb_Out_BusCreator_BusCreator1.data.nav_loc_magvar_deg = A380PrimComputerFg_P.Constant_Value_a;
    rtb_Out_BusCreator_BusCreator1.data.nav_loc_error_deg =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.Data;
    rtb_Out_BusCreator_BusCreator1.data.nav_gs_valid = rtb_LowerRelop1;
    rtb_Out_BusCreator_BusCreator1.data.nav_gs_error_deg =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg.Data;
    rtb_Out_BusCreator_BusCreator1.data.fms_xtk_nmi = A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.xtk_nmi;
    rtb_Out_BusCreator_BusCreator1.data.fms_tae_deg = A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.tke_deg;
    rtb_Out_BusCreator_BusCreator1.data.fms_phi_deg =
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.phi_c_deg;
    rtb_Out_BusCreator_BusCreator1.data.fms_phi_limit_deg =
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.phi_limit_deg;
    rtb_Out_BusCreator_BusCreator1.data.fms_H_c_profile_ft =
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.alt_profile_tgt_ft;
    rtb_Out_BusCreator_BusCreator1.data.fms_H_dot_c_profile_ft_min =
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.vs_target_ft_min;
    rtb_Out_BusCreator_BusCreator1.data.VLS_kn = A380PrimComputerFg_B.BusAssignment_i.flight_envelope.v_ls_kn;
    rtb_Out_BusCreator_BusCreator1.data.VMAX_kn = A380PrimComputerFg_B.BusAssignment_i.flight_envelope.v_max_kn;
    rtb_Out_BusCreator_BusCreator1.data.on_ground = A380PrimComputerFg_B.BusAssignment_i.general_logic.on_ground;
    rtb_Out_BusCreator_BusCreator1.data.zeta_deg = rtb_Mod1;
    rtb_Out_BusCreator_BusCreator1.data.total_weight_kg =
      A380PrimComputerFg_B.BusAssignment_i.flight_envelope.computed_gross_weight_kg;
    if (A380PrimComputerFg_P.Constant5_Value > A380PrimComputerFg_P.Switch9_Threshold) {
      rtb_Out_BusCreator_BusCreator1.input.ap_engaged = A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_engaged;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.ap_engaged = A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_engaged;
    }

    rtb_Out_BusCreator_BusCreator1.input.lateral_law = static_cast<real_T>(rtb_active_lateral_law);
    rtb_Out_BusCreator_BusCreator1.input.vertical_law = static_cast<real_T>(rtb_active_longitudinal_law);
    rtb_Out_BusCreator_BusCreator1.input.Psi_c_deg = A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_hdg_trk;
    rtb_Out_BusCreator_BusCreator1.input.Chi_c_deg = rtb_trackMag;
    rtb_Out_BusCreator_BusCreator1.input.V_c_kn = A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.spd_target_kts;
    rtb_Out_BusCreator_BusCreator1.input.ALT_soft_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_i5;
    rtb_Out_BusCreator_BusCreator1.input.TCAS_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_kx;
    rtb_Out_BusCreator_BusCreator1.input.FINAL_DES_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_l;
    rtb_y_o0 = (A380PrimComputerFg_DWork.Memory_PreviousInput_ae || A380PrimComputerFg_DWork.Memory_PreviousInput_e);
    rtb_Out_BusCreator_BusCreator1.input.GS_track_mode = rtb_y_o0;
    LawMDLOBJ1.step(&rtb_Out_BusCreator_BusCreator1, &rtb_output);
    if (((!A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_1_on_ir_3) || (A380PrimComputerFg_P.Constant4_Value_f ==
          0.0)) && ((!A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_2_on_ir_3) ||
                    (A380PrimComputerFg_P.Constant4_Value_f != 0.0))) {
      if (A380PrimComputerFg_P.Constant4_Value_f > A380PrimComputerFg_P.Switch8_Threshold_m) {
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.ground_speed_kn =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.ground_speed_kn;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.track_angle_true_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.track_angle_true_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.heading_true_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.heading_true_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.heading_magnetic_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.heading_magnetic_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.pitch_angle_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.pitch_angle_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.roll_angle_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.roll_angle_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_long_accel_g =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.body_long_accel_g;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_lat_accel_g =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.body_lat_accel_g;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_normal_accel_g =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.body_normal_accel_g;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s;
      } else {
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.ground_speed_kn =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.ground_speed_kn;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.track_angle_true_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.track_angle_true_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.heading_true_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.heading_true_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.heading_magnetic_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.heading_magnetic_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.pitch_angle_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.pitch_angle_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.roll_angle_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.roll_angle_deg;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_long_accel_g =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.body_long_accel_g;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_lat_accel_g =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.body_lat_accel_g;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_normal_accel_g =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.body_normal_accel_g;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s;
      }
    }

    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.pitch_angle_deg,
      &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Theta_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.roll_angle_deg,
      &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Phi_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.qk_deg_s = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.rk_deg_s = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.pk_deg_s = rtb_trackMag;
    rtb_LowerRelop1 = ((A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_1_on_adr_3 &&
                        (A380PrimComputerFg_P.Constant3_Value_i != 0.0)) ||
                       (A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_2_on_adr_3 &&
                        (A380PrimComputerFg_P.Constant3_Value_i == 0.0)));
    if (!rtb_LowerRelop1) {
      if (A380PrimComputerFg_P.Constant3_Value_i > A380PrimComputerFg_P.Switch7_Threshold_g) {
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_standard_ft =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.altitude_standard_ft;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.mach =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.mach;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.airspeed_computed_kn =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.airspeed_computed_kn;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.airspeed_true_kn =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.airspeed_true_kn;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.aoa_corrected_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.aoa_corrected_deg;
      } else {
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_standard_ft =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.altitude_standard_ft;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.mach =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.mach;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.airspeed_computed_kn =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.airspeed_computed_kn;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.airspeed_true_kn =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.airspeed_true_kn;
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.aoa_corrected_deg =
          A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.aoa_corrected_deg;
      }
    }

    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.airspeed_computed_kn, &rtb_altStd);
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.airspeed_true_kn, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.V_tas_kn = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.mach,
      &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.V_mach = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.ground_speed_kn,
      &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.V_gnd_kn = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.aoa_corrected_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.alpha_deg = rtb_trackMag;
    rtb_Mod1 = (A380PrimComputerFg_B.BusAssignment_i.fctl_logic.lateral_surface_positions.upper_rudder_deg +
                A380PrimComputerFg_B.BusAssignment_i.fctl_logic.lateral_surface_positions.lower_rudder_deg) *
      A380PrimComputerFg_P.Gain3_Gain_k;
    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_lat_accel_g,
      &rtb_headingMag);
    if (A380PrimComputerFg_B.BusAssignment_i.flight_envelope.computed_gross_weight_kg >
        A380PrimComputerFg_P.Saturation_UpperSat_m) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation_UpperSat_m;
    } else if (A380PrimComputerFg_B.BusAssignment_i.flight_envelope.computed_gross_weight_kg <
               A380PrimComputerFg_P.Saturation_LowerSat_m) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation_LowerSat_m;
    } else {
      rtb_DataTypeConversion11 = A380PrimComputerFg_B.BusAssignment_i.flight_envelope.computed_gross_weight_kg;
    }

    A380PrimComputerFg_betaestimation1(rtb_altStd, rtb_headingMag, rtb_Mod1, rtb_DataTypeConversion11, &rtb_trackMag);
    A380PrimComputerFg_LagFilter(static_cast<real_T>(rtb_trackMag), A380PrimComputerFg_P.LagFilter1_C1_a,
      A380PrimComputerFg_B.BusAssignment_i.data.time.dt, &rtb_Mod2_j, &A380PrimComputerFg_DWork.sf_LagFilter_f);
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_standard_ft, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.H_ft = rtb_trackMag;
    A380PrimComputerFg_AltitudeChoice
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_standard_ft,
       &A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft,
       &A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft,
       A380PrimComputerFg_P.Constant2_Value_o, &A380PrimComputerFg_B.BusAssignment_ic,
       &A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2, &A380PrimComputerFg_P.AltitudeChoice_g);
    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2,
      &rtb_trackMag);
    rtb_DataTypeConversion11 = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.H_dot_ft_min = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.heading_magnetic_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Psi_magnetic_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Psi_magnetic_track_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5(&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.heading_true_deg,
      &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Psi_true_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.track_angle_true_deg, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.Chi_true_deg = rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_long_accel_g, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.bx_m_s2 = A380PrimComputerFg_P.Gain_Gain_l * rtb_trackMag;
    A380PrimComputerFg_MATLABFunction_a5
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.body_normal_accel_g, &rtb_trackMag);
    rtb_Out_BusCreator_BusCreator1.data.bz_m_s2 = (rtb_trackMag + A380PrimComputerFg_P.Bias_Bias_bi) *
      A380PrimComputerFg_P.Gain2_Gain_i;
    if (!A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_tune_inhibit) {
      A380PrimComputerFg_B.u = A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.fms_loc_distance;
    }

    A380PrimComputerFg_MATLABFunction_j
      (&A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg, &rtb_LowerRelop1);
    rtb_Out_BusCreator_BusCreator1.data.H_ind_ft = rtb_DataTypeConversion11;
    A380PrimComputerFg_MATLABFunction
      (&A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg,
       A380PrimComputerFg_P.A429ValueOrDefault8_defaultValue_o, &rtb_trackMag);
    if (rtb_OR2_nm) {
      A380PrimComputerFg_B.u_c = rtb_trackMag;
      rtb_trackMag = A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_hdg_trk;
    } else {
      rtb_trackMag = A380PrimComputerFg_B.u_c;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_hw) {
      rtb_Out_BusCreator_BusCreator1.input.H_c_ft = rtb_DataTypeConversion11;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.H_c_ft = absAdvRateToMaintain;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_kx) {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm =
        A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.tcas_vs_target;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_kj) {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm =
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.vs_target_ft_min;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_hw) {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm = A380PrimComputerFg_P.Constant6_Value_o;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.H_dot_c_fpm = A380PrimComputerFg_DWork.pValue;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_kj) {
      rtb_Out_BusCreator_BusCreator1.input.FPA_c_deg =
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.vs_target_ft_min;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.FPA_c_deg = A380PrimComputerFg_DWork.pValue;
    }

    rtb_Out_BusCreator_BusCreator1.data.V_ias_kn = rtb_altStd;
    rtb_Out_BusCreator_BusCreator1.data.beta_deg = rtb_Mod2_j;
    rtb_Out_BusCreator_BusCreator1.data.by_m_s2 = A380PrimComputerFg_P.Gain1_Gain_i * rtb_headingMag;
    rtb_Out_BusCreator_BusCreator1.data.nav_dme_nmi = A380PrimComputerFg_B.u;
    rtb_Out_BusCreator_BusCreator1.data.nav_loc_magvar_deg = A380PrimComputerFg_P.Constant_Value_ag;
    rtb_Out_BusCreator_BusCreator1.data.nav_loc_error_deg =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.Data;
    rtb_Out_BusCreator_BusCreator1.data.nav_gs_valid = rtb_LowerRelop1;
    rtb_Out_BusCreator_BusCreator1.data.nav_gs_error_deg =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg.Data;
    rtb_Out_BusCreator_BusCreator1.data.zeta_deg = rtb_Mod1;
    if (A380PrimComputerFg_P.Constant5_Value_h > A380PrimComputerFg_P.Switch9_Threshold_f) {
      rtb_Out_BusCreator_BusCreator1.input.ap_engaged = A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_engaged;
    } else {
      rtb_Out_BusCreator_BusCreator1.input.ap_engaged = A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_engaged;
    }

    rtb_Out_BusCreator_BusCreator1.input.lateral_law = static_cast<real_T>(rtb_active_lateral_law);
    rtb_Out_BusCreator_BusCreator1.input.vertical_law = static_cast<real_T>(rtb_active_longitudinal_law);
    rtb_Out_BusCreator_BusCreator1.input.Psi_c_deg = A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic.selected_hdg_trk;
    rtb_Out_BusCreator_BusCreator1.input.Chi_c_deg = rtb_trackMag;
    rtb_Out_BusCreator_BusCreator1.input.GS_track_mode = rtb_y_o0;
    Law1MDLOBJ2.step(&rtb_Out_BusCreator_BusCreator1, &rtb_output_k);
    A380PrimComputerFg_B.BusAssignment_ic.fg_laws.ap_fd_1 = rtb_output;
    A380PrimComputerFg_B.BusAssignment_ic.fg_laws.ap_fd_2 = rtb_output_k;
    rtb_OR4_kx = (A380PrimComputerFg_B.BusAssignment_ic.fg_logic.ap_1_engaged ||
                  ((!A380PrimComputerFg_B.BusAssignment_ic.fg_logic.ap_2_engaged) &&
                   A380PrimComputerFg_B.BusAssignment_ic.fg_logic.fd_1_engaged));
    rtb_OR2_nm = !rtb_OR4_kx;
    if ((A380PrimComputerFg_B.BusAssignment_ic.fg_logic.ap_fd_1_on_adr_3 && rtb_OR4_kx) ||
        (A380PrimComputerFg_B.BusAssignment_ic.fg_logic.ap_fd_2_on_adr_3 && rtb_OR2_nm)) {
      rtb_Switch2_d = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn;
    } else if (rtb_OR4_kx) {
      rtb_Switch2_d = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_1_bus.airspeed_computed_kn;
    } else {
      rtb_Switch2_d = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.adr_2_bus.airspeed_computed_kn;
    }

    A380PrimComputerFg_MATLABFunction(&rtb_Switch2_d, A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_o, &rtb_Y_m);
    A380PrimComputerFg_Voter1(A380PrimComputerFg_B.BusAssignment_i.flight_envelope.v_ls_kn,
      A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic.spd_target_kts,
      A380PrimComputerFg_B.BusAssignment_i.flight_envelope.v_max_kn, &rtb_Mod2_j);
    absAdvRateToMaintain = rtb_Mod2_j - rtb_Y_m;
    if ((A380PrimComputerFg_B.BusAssignment_ic.fg_logic.ap_fd_1_on_ir_3 && rtb_OR4_kx) ||
        (A380PrimComputerFg_B.BusAssignment_ic.fg_logic.ap_fd_2_on_ir_3 && rtb_OR2_nm)) {
      rtb_Switch5_track_angle_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn;
      rtb_Switch5_heading_true_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg;
      rtb_Switch5_track_angle_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg;
      rtb_Switch5_heading_magnetic_deg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg;
      rtb_Switch5_body_long_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg;
      rtb_Switch5_body_lat_accel_g = &A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g;
      rtb_Switch5_body_normal_accel_g = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s;
    } else if (rtb_OR4_kx) {
      rtb_Switch5_track_angle_true_deg = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.ground_speed_kn;
      rtb_Switch5_heading_true_deg =
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg;
      rtb_Switch5_track_angle_magnetic_deg =
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.heading_magnetic_deg;
      rtb_Switch5_heading_magnetic_deg = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.pitch_angle_deg;
      rtb_Switch5_body_long_accel_g = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.roll_angle_deg;
      rtb_Switch5_body_lat_accel_g = &A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.body_normal_accel_g;
      rtb_Switch5_body_normal_accel_g =
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s;
    } else {
      rtb_Switch5_track_angle_true_deg = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.ground_speed_kn;
      rtb_Switch5_heading_true_deg =
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg;
      rtb_Switch5_track_angle_magnetic_deg =
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.heading_magnetic_deg;
      rtb_Switch5_heading_magnetic_deg = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.pitch_angle_deg;
      rtb_Switch5_body_long_accel_g = A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.roll_angle_deg;
      rtb_Switch5_body_lat_accel_g = &A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.body_normal_accel_g;
      rtb_Switch5_body_normal_accel_g =
        A380PrimComputerFg_B.BusAssignment_i.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s;
    }

    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_heading_magnetic_deg,
      A380PrimComputerFg_P.A429ValueOrDefault11_defaultValue, &rtb_Y_m);
    rtb_Mod2_j = A380PrimComputerFg_P.Gain1_Gain_p * rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_body_normal_accel_g,
      A380PrimComputerFg_P.A429ValueOrDefault10_defaultValue, &rtb_Y_m);
    rtb_DataTypeConversion23 = A380PrimComputerFg_P.fpmtoms_Gain * rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_track_angle_true_deg,
      A380PrimComputerFg_P.A429ValueOrDefault8_defaultValue_i, &rtb_Y_m);
    rtb_DataTypeConversion11 = rtb_Y_m;
    rtb_Switch5_d_idx_0 = A380PrimComputerFg_P.kntoms_Gain * rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_body_long_accel_g,
      A380PrimComputerFg_P.A429ValueOrDefault12_defaultValue, &rtb_Y_m);
    rtb_Mod1 = A380PrimComputerFg_P.Gain1_Gain_ib * rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_track_angle_magnetic_deg,
      A380PrimComputerFg_P.A429ValueOrDefault13_defaultValue, &rtb_Y_m);
    rtb_DataTypeConversion25 = A380PrimComputerFg_P.Gain1_Gain_gv * rtb_Y_m;
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_heading_true_deg,
      A380PrimComputerFg_P.A429ValueOrDefault14_defaultValue, &rtb_Y_m);
    if (rtb_DataTypeConversion11 > A380PrimComputerFg_P.Saturation_UpperSat_a) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation_UpperSat_a;
    } else if (rtb_DataTypeConversion11 < A380PrimComputerFg_P.Saturation_LowerSat_mu) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation_LowerSat_mu;
    }

    rtb_Gain2 = A380PrimComputerFg_P.ktstomps_Gain * rtb_DataTypeConversion11 * A380PrimComputerFg_P._Gain;
    if ((!A380PrimComputerFg_DWork.pY_not_empty_g) || (!A380PrimComputerFg_DWork.pU_not_empty_o)) {
      A380PrimComputerFg_DWork.pU = rtb_Gain2;
      A380PrimComputerFg_DWork.pU_not_empty_o = true;
      A380PrimComputerFg_DWork.pY_a = rtb_Gain2;
      A380PrimComputerFg_DWork.pY_not_empty_g = true;
    }

    rtb_DataTypeConversion11 = A380PrimComputerFg_B.BusAssignment_i.data.time.dt * A380PrimComputerFg_P.WashoutFilter_C1
      + 2.0;
    rtb_Mod2 = 2.0 / rtb_DataTypeConversion11;
    A380PrimComputerFg_DWork.pY_a = (2.0 - A380PrimComputerFg_B.BusAssignment_i.data.time.dt *
      A380PrimComputerFg_P.WashoutFilter_C1) / rtb_DataTypeConversion11 * A380PrimComputerFg_DWork.pY_a + (rtb_Gain2 *
      rtb_Mod2 - A380PrimComputerFg_DWork.pU * rtb_Mod2);
    A380PrimComputerFg_DWork.pU = rtb_Gain2;
    if (rtb_Switch5_d_idx_0 > A380PrimComputerFg_P.Saturation_UpperSat_c) {
      rtb_Switch5_d_idx_0 = A380PrimComputerFg_P.Saturation_UpperSat_c;
    } else if (rtb_Switch5_d_idx_0 < A380PrimComputerFg_P.Saturation_LowerSat_d) {
      rtb_Switch5_d_idx_0 = A380PrimComputerFg_P.Saturation_LowerSat_d;
    }

    A380PrimComputerFg_LeadLagFilter(A380PrimComputerFg_DWork.pY_a - A380PrimComputerFg_P.g_Gain *
      (A380PrimComputerFg_P.Gain1_Gain_oj * (A380PrimComputerFg_P.Gain_Gain_h * ((rtb_Mod2_j -
      A380PrimComputerFg_P.Gain1_Gain_m * (A380PrimComputerFg_P.Gain_Gain_o * std::atan(rtb_DataTypeConversion23 /
      rtb_Switch5_d_idx_0))) * (A380PrimComputerFg_P.Constant_Value_g2 - std::cos(rtb_Mod1)) + std::sin(rtb_Mod1) * std::
      sin(A380PrimComputerFg_P.Gain1_Gain_iz * rtb_Y_m - rtb_DataTypeConversion25)))),
      A380PrimComputerFg_P.HighPassFilter_C1, A380PrimComputerFg_P.HighPassFilter_C2,
      A380PrimComputerFg_P.HighPassFilter_C3, A380PrimComputerFg_P.HighPassFilter_C4,
      A380PrimComputerFg_B.BusAssignment_i.data.time.dt, &rtb_Mod1, &A380PrimComputerFg_DWork.sf_LeadLagFilter);
    A380PrimComputerFg_MATLABFunction(&rtb_Switch2_d, A380PrimComputerFg_P.A429ValueOrDefault9_defaultValue, &rtb_Y_m);
    if (rtb_Y_m > A380PrimComputerFg_P.Saturation1_UpperSat_l) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation1_UpperSat_l;
    } else if (rtb_Y_m < A380PrimComputerFg_P.Saturation1_LowerSat_o) {
      rtb_DataTypeConversion11 = A380PrimComputerFg_P.Saturation1_LowerSat_o;
    } else {
      rtb_DataTypeConversion11 = rtb_Y_m;
    }

    A380PrimComputerFg_LeadLagFilter(A380PrimComputerFg_P.ktstomps_Gain_n * rtb_DataTypeConversion11,
      A380PrimComputerFg_P.LowPassFilter_C1, A380PrimComputerFg_P.LowPassFilter_C2,
      A380PrimComputerFg_P.LowPassFilter_C3, A380PrimComputerFg_P.LowPassFilter_C4,
      A380PrimComputerFg_B.BusAssignment_i.data.time.dt, &rtb_Mod2_j, &A380PrimComputerFg_DWork.sf_LeadLagFilter_c);
    absAdvRateToMaintain += (rtb_Mod1 + rtb_Mod2_j) * A380PrimComputerFg_P.mpstokts_Gain *
      A380PrimComputerFg_P.Gain4_Gain * look1_binlxpw(absAdvRateToMaintain,
      A380PrimComputerFg_P.ScheduledGain1_BreakpointsForDimension1, A380PrimComputerFg_P.ScheduledGain1_Table, 4U);
    rtb_DataTypeConversion11 = A380PrimComputerFg_DWork.Delay_DSTATE_o;
    A380PrimComputerFg_DWork.Delay_DSTATE_o = A380PrimComputerFg_P.DiscreteDerivativeVariableTs_Gain *
      absAdvRateToMaintain;
    A380PrimComputerFg_LagFilter((A380PrimComputerFg_DWork.Delay_DSTATE_o - rtb_DataTypeConversion11) /
      A380PrimComputerFg_B.BusAssignment_i.data.time.dt, A380PrimComputerFg_P.LagFilter_C1_j,
      A380PrimComputerFg_B.BusAssignment_i.data.time.dt, &rtb_Mod2_j, &A380PrimComputerFg_DWork.sf_LagFilter);
    A380PrimComputerFg_MATLABFunction(rtb_Switch5_body_lat_accel_g,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_ce, &rtb_trackMag);
    A380PrimComputerFg_LagFilter_b(rtb_trackMag, A380PrimComputerFg_P.LagFilter1_C1_n,
      A380PrimComputerFg_B.BusAssignment_i.data.time.dt, &rtb_Y_m, &A380PrimComputerFg_DWork.sf_LagFilter_b);
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_heading_magnetic_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_iz, &rtb_trackMag);
    rtb_trackTrue = std::cos(A380PrimComputerFg_P.Gain1_Gain_b * rtb_trackMag);
    A380PrimComputerFg_MATLABFunction(&rtb_Switch5_body_long_accel_g,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue_gg, &rtb_trackMag);
    rtb_Y_m -= rtb_trackTrue / std::cos(A380PrimComputerFg_P.Gain1_Gain_mf * rtb_trackMag);
    rtb_trackTrue = A380PrimComputerFg_P.Gain2_Gain_o * rtb_Y_m;
    A380PrimComputerFg_Y.out = A380PrimComputerFg_B.BusAssignment_ic;
    if ((!A380PrimComputerFg_DWork.pY_not_empty) || (!A380PrimComputerFg_DWork.pU_not_empty)) {
      A380PrimComputerFg_DWork.pU_i = rtb_trackTrue;
      A380PrimComputerFg_DWork.pU_not_empty = true;
      A380PrimComputerFg_DWork.pY_j = rtb_trackTrue;
      A380PrimComputerFg_DWork.pY_not_empty = true;
    }

    rtb_DataTypeConversion11 = A380PrimComputerFg_B.BusAssignment_i.data.time.dt *
      A380PrimComputerFg_P.WashoutFilter_C1_o + 2.0;
    rtb_Mod2 = 2.0 / rtb_DataTypeConversion11;
    A380PrimComputerFg_DWork.pY_j = static_cast<real32_T>((2.0 - A380PrimComputerFg_B.BusAssignment_i.data.time.dt *
      A380PrimComputerFg_P.WashoutFilter_C1_o) / rtb_DataTypeConversion11) * A380PrimComputerFg_DWork.pY_j +
      (rtb_trackTrue * static_cast<real32_T>(rtb_Mod2) - A380PrimComputerFg_DWork.pU_i * static_cast<real32_T>(rtb_Mod2));
    A380PrimComputerFg_DWork.pU_i = rtb_trackTrue;
    if (!A380PrimComputerFg_DWork.pY_not_empty_c) {
      A380PrimComputerFg_DWork.pY = A380PrimComputerFg_P.RateLimiterVariableTs_InitialCondition;
      A380PrimComputerFg_DWork.pY_not_empty_c = true;
    }

    A380PrimComputerFg_DWork.pY += std::fmax(std::fmin(static_cast<real_T>
      (A380PrimComputerFg_DWork.Memory_PreviousInput_i5) - A380PrimComputerFg_DWork.pY, std::abs
      (A380PrimComputerFg_P.RateLimiterVariableTs_up) * A380PrimComputerFg_B.BusAssignment_i.data.time.dt), -std::abs
      (A380PrimComputerFg_P.RateLimiterVariableTs_lo) * A380PrimComputerFg_B.BusAssignment_i.data.time.dt);
    if (A380PrimComputerFg_B.BusAssignment_i.data.sim_data.tracking_mode_on_override) {
      absAdvRateToMaintain = A380PrimComputerFg_P.Constant2_Value;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_gd) {
      absAdvRateToMaintain = A380PrimComputerFg_P.RETARD_Value;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_hs) {
      absAdvRateToMaintain = ((A380PrimComputerFg_P.Gain_Gain * absAdvRateToMaintain + rtb_Mod2_j) +
        (A380PrimComputerFg_P.Gain1_Gain_ix * rtb_Y_m + A380PrimComputerFg_P.Gain3_Gain_ka *
         A380PrimComputerFg_DWork.pY_j)) * look1_binlxpw(A380PrimComputerFg_DWork.Delay_DSTATE_i,
        A380PrimComputerFg_P.ScheduledGain2_BreakpointsForDimension1, A380PrimComputerFg_P.ScheduledGain2_Table, 3U) *
        look1_binlxpw(A380PrimComputerFg_DWork.pY, A380PrimComputerFg_P.ScheduledGain4_BreakpointsForDimension1,
                      A380PrimComputerFg_P.ScheduledGain4_Table, 1U);
      if (absAdvRateToMaintain > A380PrimComputerFg_P.Saturation1_UpperSat) {
        absAdvRateToMaintain = A380PrimComputerFg_P.Saturation1_UpperSat;
      } else if (absAdvRateToMaintain < A380PrimComputerFg_P.Saturation1_LowerSat) {
        absAdvRateToMaintain = A380PrimComputerFg_P.Saturation1_LowerSat;
      }
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_jm) {
      if (rtb_vsInertValid) {
        rtb_DataTypeConversion11 = A380PrimComputerFg_P.Constant_Value_g;
      } else {
        rtb_DataTypeConversion11 = A380PrimComputerFg_P.Constant1_Value;
      }

      absAdvRateToMaintain = rtb_DataTypeConversion11 * look1_iflf_binlxpw(std::fmin(std::fmin(std::fmin
        (A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_1.selected_n1_actual_percent.Data,
         A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_2.selected_n1_actual_percent.Data),
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_3.selected_n1_actual_percent.Data),
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_4.selected_n1_actual_percent.Data),
        A380PrimComputerFg_P.uDLookupTable_bp01Data, A380PrimComputerFg_P.uDLookupTable_tableData, 6U);
      if (absAdvRateToMaintain > A380PrimComputerFg_P.Saturation_UpperSat) {
        absAdvRateToMaintain = A380PrimComputerFg_P.Saturation_UpperSat;
      } else if (absAdvRateToMaintain < A380PrimComputerFg_P.Saturation_LowerSat) {
        absAdvRateToMaintain = A380PrimComputerFg_P.Saturation_LowerSat;
      }
    } else {
      absAdvRateToMaintain = A380PrimComputerFg_P.Constant1_Value_h;
    }

    absAdvRateToMaintain = A380PrimComputerFg_P.DiscreteTimeIntegratorVariableTsLimit_Gain * absAdvRateToMaintain *
      A380PrimComputerFg_B.BusAssignment_i.data.time.dt;
    A380PrimComputerFg_DWork.icLoad_p = ((!A380PrimComputerFg_B.BusAssignment_ic.fg_logic.athr_engaged) ||
      rtb_Compare_han_0 || rtb_Logic_es[0] || A380PrimComputerFg_DWork.icLoad_p);
    if (A380PrimComputerFg_DWork.icLoad_p) {
      A380PrimComputerFg_DWork.Delay_DSTATE_a = std::fmax(std::fmax(std::fmax
        (A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_1.selected_n1_actual_percent.Data,
         A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_2.selected_n1_actual_percent.Data),
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_3.selected_n1_actual_percent.Data),
        A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_4.selected_n1_actual_percent.Data) -
        absAdvRateToMaintain;
    }

    A380PrimComputerFg_DWork.Delay_DSTATE_i = absAdvRateToMaintain + A380PrimComputerFg_DWork.Delay_DSTATE_a;
    rtb_trackMag = std::fmax(std::fmax(std::fmax
      (A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_1.n1_ref_percent.Data,
       A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_2.n1_ref_percent.Data),
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_3.n1_ref_percent.Data),
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.eec_4.n1_ref_percent.Data);
    if (A380PrimComputerFg_DWork.Delay_DSTATE_i > rtb_trackMag) {
      A380PrimComputerFg_DWork.Delay_DSTATE_i = rtb_trackMag;
    } else if (A380PrimComputerFg_DWork.Delay_DSTATE_i < A380PrimComputerFg_P.Constant_Value_l) {
      A380PrimComputerFg_DWork.Delay_DSTATE_i = A380PrimComputerFg_P.Constant_Value_l;
    }

    if (rtb_Logic_es[0]) {
      A380PrimComputerFg_Y.out.fg_laws.n_1_c_percent = std::fmax(std::fmax(std::fmax
        (A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_maximum_percent.Data,
         A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_maximum_percent.Data),
        A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_maximum_percent.Data),
        A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_maximum_percent.Data);
    } else {
      A380PrimComputerFg_Y.out.fg_laws.n_1_c_percent = A380PrimComputerFg_DWork.Delay_DSTATE_i;
    }

    A380PrimComputerFg_DWork.Delay_DSTATE_c = A380PrimComputerFg_B.BusAssignment_ic.fg_mode_logic;
    A380PrimComputerFg_DWork.Delay_DSTATE_aw = rtb_Logic_dt[0];
    A380PrimComputerFg_DWork.icLoad = false;
    A380PrimComputerFg_DWork.Delay_DSTATE[0] = A380PrimComputerFg_DWork.Delay_DSTATE[1];
    A380PrimComputerFg_DWork.Delay_DSTATE[1] = *rtb_Switch_0;
    A380PrimComputerFg_DWork.Delay_DSTATE_b = rtb_Logic_hk[0];
    A380PrimComputerFg_DWork.DelayOneStep_DSTATE_a = rtb_Logic_af[0];
    A380PrimComputerFg_DWork.Delay_DSTATE_bq = rtb_Logic_af[0];
    A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = rtb_Logic_hk[0];
    A380PrimComputerFg_DWork.Delay_DSTATE_m = rtb_Logic_fj[0];
    A380PrimComputerFg_DWork.Delay1_DSTATE = rtb_Logic_ag[0];
    A380PrimComputerFg_DWork.Delay2_DSTATE_n = rtb_Logic_bn[0];
    A380PrimComputerFg_DWork.Delay3_DSTATE = rtb_Logic_pg[0];
    A380PrimComputerFg_DWork.Delay_DSTATE_h = rtb_Logic_op[0];
    A380PrimComputerFg_DWork.Delay2_DSTATE = A380PrimComputerFg_B.BusAssignment_ic.fg_laws;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_i = A380PrimComputerFg_DWork.pValue_p;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_k = A380PrimComputerFg_DWork.pValue_p;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE =
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.next_alt_cstr_ft;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_j =
      A380PrimComputerFg_B.BusAssignment_i.data.adcn_inputs.fms.next_alt_cstr_ft;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_f = rtb_vsInert;
    A380PrimComputerFg_DWork.Delay_DSTATE_p = A380PrimComputerFg_P.Constant_Value_e;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_d = rtb_Mod1_o;
    A380PrimComputerFg_DWork.Memory_PreviousInput_ou =
      A380PrimComputerFg_P.Logic_table_ho[rtb_Switch_o_runway_heading_deg_SSM];
    A380PrimComputerFg_DWork.icLoad_p = false;
    A380PrimComputerFg_DWork.Delay_DSTATE_a = A380PrimComputerFg_DWork.Delay_DSTATE_i;
  } else {
    A380PrimComputerFg_DWork.Runtime_MODE = false;
  }
}

void A380PrimComputerFg::initialize()
{
  A380PrimComputerFg_DWork.Delay_DSTATE_c = A380PrimComputerFg_P.Delay_InitialCondition;
  A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_P.DelayOneStep_InitialCondition;
  A380PrimComputerFg_DWork.Delay_DSTATE_aw = A380PrimComputerFg_P.Delay_InitialCondition_f;
  A380PrimComputerFg_DWork.icLoad = true;
  A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_P.Delay_InitialCondition_o;
  A380PrimComputerFg_DWork.DelayOneStep_DSTATE_a = A380PrimComputerFg_P.DelayOneStep_InitialCondition_c;
  A380PrimComputerFg_DWork.Delay_DSTATE_bq = A380PrimComputerFg_P.Delay_InitialCondition_a;
  A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_P.DelayOneStep1_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.SRFlipFlop1_initial_condition;
  A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_P.Delay_InitialCondition_ir;
  A380PrimComputerFg_DWork.Delay_DSTATE_me = A380PrimComputerFg_P.Delay_InitialCondition_n;
  A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.SRFlipFlop_initial_condition;
  A380PrimComputerFg_DWork.Delay1_DSTATE = A380PrimComputerFg_P.Delay1_InitialCondition;
  A380PrimComputerFg_DWork.Delay2_DSTATE_n = A380PrimComputerFg_P.Delay2_InitialCondition_b;
  A380PrimComputerFg_DWork.Delay3_DSTATE = A380PrimComputerFg_P.Delay3_InitialCondition;
  A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_P.Delay_InitialCondition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.SRFlipFlop_initial_condition_k;
  A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_P.SRFlipFlop_initial_condition_l;
  A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.SRFlipFlop_initial_condition_b;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ov = A380PrimComputerFg_P.SRFlipFlop_initial_condition_o;
  A380PrimComputerFg_DWork.Memory_PreviousInput_e = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_en = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lg;
  A380PrimComputerFg_DWork.Delay2_DSTATE = A380PrimComputerFg_P.Delay2_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput_d = A380PrimComputerFg_P.SRFlipFlop_initial_condition_oh;
  A380PrimComputerFg_DWork.Memory_PreviousInput_a = A380PrimComputerFg_P.SRFlipFlop_initial_condition_c;
  A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_P.SRFlipFlop_initial_condition_h;
  A380PrimComputerFg_DWork.Memory_PreviousInput_at = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bj;
  A380PrimComputerFg_DWork.Memory_PreviousInput_p = A380PrimComputerFg_P.SRFlipFlop_initial_condition_m;
  A380PrimComputerFg_DWork.Memory_PreviousInput_lm = A380PrimComputerFg_P.SRFlipFlop_initial_condition_g;
  A380PrimComputerFg_DWork.Memory_PreviousInput_o4 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jb;
  A380PrimComputerFg_DWork.Memory_PreviousInput_eu = A380PrimComputerFg_P.SRFlipFlop_initial_condition_n;
  A380PrimComputerFg_DWork.Memory_PreviousInput_k = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d;
  A380PrimComputerFg_DWork.Memory_PreviousInput_f = A380PrimComputerFg_P.SRFlipFlop_initial_condition_db;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ox = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lv;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_i = A380PrimComputerFg_P.DetectChange_vinit_m;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ek = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_g;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_k = A380PrimComputerFg_P.DetectChange_vinit_p;
  A380PrimComputerFg_DWork.Memory_PreviousInput_l1 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jn;
  A380PrimComputerFg_DWork.Memory_PreviousInput_e0 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_i;
  A380PrimComputerFg_DWork.Memory_PreviousInput_hw = A380PrimComputerFg_P.SRFlipFlop2_initial_condition;
  A380PrimComputerFg_DWork.Memory_PreviousInput_oz = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_n;
  A380PrimComputerFg_DWork.Memory_PreviousInput_og = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_c;
  A380PrimComputerFg_DWork.Memory_PreviousInput_oy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_p;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE = A380PrimComputerFg_P.DetectChange_vinit;
  A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.SRFlipFlop_initial_condition_a;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ei = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bp;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_j = A380PrimComputerFg_P.DetectChange_vinit_a;
  A380PrimComputerFg_DWork.Memory_PreviousInput_kj = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lk;
  A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ok;
  A380PrimComputerFg_DWork.Memory_PreviousInput_kc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mc;
  A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j1;
  A380PrimComputerFg_DWork.Memory_PreviousInput_il = A380PrimComputerFg_P.SRFlipFlop_initial_condition_md;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_f = A380PrimComputerFg_P.DetectDecrease_vinit;
  A380PrimComputerFg_DWork.Memory_PreviousInput_lp = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ac;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ae = A380PrimComputerFg_P.SRFlipFlop_initial_condition_hq;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ik = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_f;
  A380PrimComputerFg_DWork.Memory_PreviousInput_kx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jq;
  A380PrimComputerFg_DWork.Memory_PreviousInput_b = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d;
  A380PrimComputerFg_DWork.Memory_PreviousInput_pt = A380PrimComputerFg_P.SRFlipFlop2_initial_condition_e;
  A380PrimComputerFg_DWork.Delay_DSTATE_p = A380PrimComputerFg_P.Delay_InitialCondition_h;
  A380PrimComputerFg_DWork.Memory_PreviousInput_od = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_hx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pb;
  A380PrimComputerFg_DWork.Memory_PreviousInput_py = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mv;
  A380PrimComputerFg_DWork.Memory_PreviousInput_dp = A380PrimComputerFg_P.SRFlipFlop_initial_condition_f;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_d = A380PrimComputerFg_P.DetectChange_vinit_d;
  A380PrimComputerFg_DWork.Memory_PreviousInput_i5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pq;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ou = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_jw;
  A380PrimComputerFg_DWork.Memory_PreviousInput_jm = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_fn;
  A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d2;
  A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_co;
  A380PrimComputerFg_DWork.Memory_PreviousInput_oyc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ll;
  A380PrimComputerFg_DWork.Memory_PreviousInput_g3 = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_b;
  A380PrimComputerFg_DWork.Delay_DSTATE_o = A380PrimComputerFg_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380PrimComputerFg_DWork.Delay_DSTATE_i = A380PrimComputerFg_P.Delay_InitialCondition_i;
  A380PrimComputerFg_DWork.icLoad_p = true;
  A380PrimComputerFg_B.u_lyjj = A380PrimComputerFg_P.Y_Y0;
  A380PrimComputerFg_SRFlipFlopwithSyncInput_Init(A380PrimComputerFg_P.SRFlipFlopwithSyncInput_initial_condition,
    &A380PrimComputerFg_DWork.SRFlipFlopwithSyncInput_d);
  A380PrimComputerFg_Subsystem_Init(A380PrimComputerFg_P.Subsystem_initial_condition,
    &A380PrimComputerFg_DWork.Subsystem);
  A380PrimComputerFg_Subsystem_Init(A380PrimComputerFg_P.Subsystem_initial_condition_e,
    &A380PrimComputerFg_DWork.Subsystem_n);
  A380PrimComputerFg_SRFlipFlopwithSyncInput_Init(A380PrimComputerFg_P.SRFlipFlopwithSyncInput_initial_condition_l,
    &A380PrimComputerFg_DWork.SRFlipFlopwithSyncInput);
  A380PrimComputerFg_B.u_lyjjl = A380PrimComputerFg_P.Y_Y0_l0;
  A380PrimComputerFg_Subsystem_Init(A380PrimComputerFg_P.Subsystem4_initial_condition,
    &A380PrimComputerFg_DWork.Subsystem4_c);
  A380PrimComputerFg_Subsystem_Init(A380PrimComputerFg_P.Subsystem3_initial_condition,
    &A380PrimComputerFg_DWork.Subsystem3);
  A380PrimComputerFg_Subsystem_Init(A380PrimComputerFg_P.Subsystem1_initial_condition,
    &A380PrimComputerFg_DWork.Subsystem1);
  A380PrimComputerFg_Subsystem_Init(A380PrimComputerFg_P.Subsystem_initial_condition_l,
    &A380PrimComputerFg_DWork.Subsystem_c);
  A380PrimComputerFg_B.u_ly = A380PrimComputerFg_P.Y_Y0_l;
  A380PrimComputerFg_B.u_lyj = A380PrimComputerFg_P.Y_Y0_a;
  A380PrimComputerFg_B.u_l = A380PrimComputerFg_P.Y_Y0_h;
  A380PrimComputerFg_Subsystem_Init(A380PrimComputerFg_P.Subsystem4_initial_condition_p,
    &A380PrimComputerFg_DWork.Subsystem4);
  A380PrimComputerFg_B.u_d = A380PrimComputerFg_P.Y_Y0_i;
  A380PrimComputerFg_B.u_dg = A380PrimComputerFg_P.Y_Y0_k;
  LawMDLOBJ1.init();
  A380PrimComputerFg_B.u = A380PrimComputerFg_P.Y_Y0_j;
  A380PrimComputerFg_B.u_c = A380PrimComputerFg_P.Y_Y0_g;
  Law1MDLOBJ2.init();
  A380PrimComputerFg_Y.out = A380PrimComputerFg_P.out_Y0;
}

void A380PrimComputerFg::terminate()
{
}

A380PrimComputerFg::A380PrimComputerFg():
  A380PrimComputerFg_U(),
  A380PrimComputerFg_Y(),
  A380PrimComputerFg_B(),
  A380PrimComputerFg_DWork()
{
}

A380PrimComputerFg::~A380PrimComputerFg() = default;
