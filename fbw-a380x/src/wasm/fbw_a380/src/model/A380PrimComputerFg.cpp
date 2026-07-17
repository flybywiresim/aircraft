#include "A380PrimComputerFg.h"
#include "rtwtypes.h"
#include "A380PrimComputerFg_types.h"
#include <cmath>
#include <cstring>
#include <stddef.h>

const base_arinc_429 A380PrimComputerFg_rtZbase_arinc_429{
  0U,
  0.0F
};

void A380PrimComputerFg::A380PrimComputerFg_APEngagedLogic(boolean_T rtu_pulsedFcuButton, boolean_T rtu_prevApEngaged,
  boolean_T rtu_groundEngineStartCondition, boolean_T rtu_dualApDiscCondition, boolean_T rtu_groundGa, boolean_T
  rtu_envelopeInhibition, const prim_outputs *rtu_in, boolean_T *rty_engagementCondition, boolean_T
  *rty_disengagementCondition, boolean_T *rty_ap_inop)
{
  boolean_T apCondition;
  boolean_T apInstinctiveDisc;
  apInstinctiveDisc = (rtu_in->data.discrete_inputs.capt_priority_takeover_pressed ||
                       rtu_in->data.discrete_inputs.fo_priority_takeover_pressed);
  apCondition = ((!apInstinctiveDisc) && rtu_in->fctl_logic.ap_authorised);
  *rty_engagementCondition = (rtu_pulsedFcuButton && (!rtu_prevApEngaged) && rtu_in->fg_logic.gnd_eng_stop_flt_5s &&
    rtu_in->fg_logic.ap_fd_common_condition && apCondition && (!rtu_envelopeInhibition));
  apCondition = ((!rtu_in->fg_logic.ap_fd_common_condition) || (!apCondition));
  *rty_disengagementCondition = (apCondition || (rtu_pulsedFcuButton && rtu_prevApEngaged) || apInstinctiveDisc ||
    rtu_dualApDiscCondition || rtu_groundGa || rtu_groundEngineStartCondition);
  *rty_ap_inop = apCondition;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_Reset(rtDW_MATLABFunction_A380PrimComputerFg_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputerFg_T *localDW)
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

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_l_Reset(rtDW_MATLABFunction_A380PrimComputerFg_l_T *localDW)
{
  localDW->previousInput = false;
  localDW->remainingTriggerTime = 0.0;
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_h(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T
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

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_cr(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T
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

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_n(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_g(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T
  *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void A380PrimComputerFg::A380PrimComputerFg_MATLABFunction_nn(const base_arinc_429 *rtu_u, boolean_T *rty_y)
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

void A380PrimComputerFg::step()
{
  base_arinc_429 rtb_BusAssignment_g1_fg_logic_chosen_fcu_discrete_word_1;
  base_arinc_429 rtb_BusAssignment_gq_fg_logic_chosen_fcu_discrete_word_1;
  base_arinc_429 rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1;
  base_arinc_429 rtb_BusAssignment_i0_fg_logic_ils_computation_data_glideslope_deviation_deg;
  base_arinc_429 rtb_BusAssignment_ie_fg_logic_ils_computation_data_localizer_deviation_deg;
  base_arinc_429 rtb_BusAssignment_ie_fg_logic_ils_computation_data_runway_heading_deg;
  base_arinc_429 rtb_BusAssignment_il_fg_logic_ils_computation_data_localizer_deviation_deg;
  base_arinc_429 rtb_BusAssignment_o_fg_logic_chosen_fcu_discrete_word_1;
  base_arinc_429 rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1;
  base_arinc_429 rtb_Switch1_l;
  real_T dPsi_1;
  real_T dPsi_2;
  real_T rtb_altCstrOrFcu;
  int32_T tmp;
  int32_T y;
  real32_T delta;
  real32_T rtb_Delay_selected_alt;
  real32_T rtb_Switch2_j_Data;
  real32_T rtb_Switch_glideslope_deviation_deg_Data;
  real32_T rtb_Switch_ils_frequency_mhz_Data;
  real32_T rtb_Switch_runway_heading_deg_Data;
  real32_T rtb_y_b;
  real32_T rtb_y_l;
  real32_T rtb_y_n;
  real32_T rtb_y_o;
  uint32_T rtb_Switch2_j_SSM;
  uint32_T rtb_Switch_b_SSM;
  uint32_T rtb_Switch_glideslope_deviation_deg_SSM;
  uint32_T rtb_Switch_ils_frequency_mhz_SSM;
  uint32_T rtb_Switch_localizer_deviation_deg_SSM;
  uint32_T rtb_Switch_runway_heading_deg_SSM;
  uint32_T rtb_y;
  int8_T rtb_value_d;
  boolean_T rtb_AND10_j;
  boolean_T rtb_AND1_is;
  boolean_T rtb_AND2;
  boolean_T rtb_AND4;
  boolean_T rtb_AND_k1;
  boolean_T rtb_BusAssignment_a_fg_logic_fcu_1_chosen;
  boolean_T rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s;
  boolean_T rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset;
  boolean_T rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond;
  boolean_T rtb_Compare_g;
  boolean_T rtb_Compare_l1;
  boolean_T rtb_Compare_no;
  boolean_T rtb_Compare_o0;
  boolean_T rtb_Logic_g4_idx_0_tmp;
  boolean_T rtb_OR2;
  boolean_T rtb_OR4_b;
  boolean_T rtb_OR_g;
  boolean_T rtb_OR_o;
  boolean_T rtb_y_b3a;
  boolean_T rtb_y_be;
  boolean_T rtb_y_c;
  boolean_T rtb_y_ch;
  boolean_T rtb_y_h;
  boolean_T rtb_y_j;
  boolean_T rtb_y_j3;
  boolean_T rtb_y_o2;
  boolean_T rtb_y_oe;
  boolean_T rtb_y_p;
  vertical_law rtb_active_longitudinal_law;
  if (A380PrimComputerFg_U.in.data.sim_data.computer_running) {
    if (!A380PrimComputerFg_DWork.Runtime_MODE) {
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes;
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes;
      A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes;
      A380PrimComputerFg_DWork.Delay_DSTATE.auto_spd_control_active =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.auto_spd_control_active;
      A380PrimComputerFg_DWork.Delay_DSTATE.manual_spd_control_active =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.manual_spd_control_active;
      A380PrimComputerFg_DWork.Delay_DSTATE.alpha_floor_mode_active =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alpha_floor_mode_active;
      A380PrimComputerFg_DWork.Delay_DSTATE.thrust_mode_active =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.thrust_mode_active;
      A380PrimComputerFg_DWork.Delay_DSTATE.speed_mach_mode_active =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.speed_mach_mode_active;
      A380PrimComputerFg_DWork.Delay_DSTATE.retard_mode_active =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.retard_mode_active;
      A380PrimComputerFg_DWork.Delay_DSTATE.alt_cstr_applicable =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alt_cstr_applicable;
      A380PrimComputerFg_DWork.Delay_DSTATE.any_lateral_mode_engaged =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.any_lateral_mode_engaged;
      A380PrimComputerFg_DWork.Delay_DSTATE.any_longitudinal_mode_engaged =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.any_longitudinal_mode_engaged;
      A380PrimComputerFg_DWork.Delay_DSTATE.hdg_trk_preset_available =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.hdg_trk_preset_available;
      A380PrimComputerFg_DWork.Delay_DSTATE.fd_auto_disengage =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.fd_auto_disengage;
      A380PrimComputerFg_DWork.Delay_DSTATE.active_tcas_submode =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.active_tcas_submode;
      A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.selected_alt;
      A380PrimComputerFg_DWork.Delay_DSTATE.selected_vs_fpa =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.selected_vs_fpa;
      A380PrimComputerFg_DWork.Delay_DSTATE_a = A380PrimComputerFg_P.Delay_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.SRFlipFlop1_initial_condition;
      A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_P.Delay_InitialCondition_o;
      A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_P.DelayOneStep_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_o;
      A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_P.SRFlipFlop_initial_condition;
      A380PrimComputerFg_DWork.Delay_DSTATE_d = A380PrimComputerFg_P.Delay_InitialCondition_h;
      A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_P.DelayOneStep1_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_P.SRFlipFlop_initial_condition_o;
      A380PrimComputerFg_DWork.Memory_PreviousInput_m0 = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_f;
      A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_P.Delay_InitialCondition_i;
      A380PrimComputerFg_DWork.Memory_PreviousInput_io = A380PrimComputerFg_P.SRFlipFlop_initial_condition_c;
      A380PrimComputerFg_DWork.Delay_DSTATE_me = A380PrimComputerFg_P.Delay_InitialCondition_n;
      A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.SRFlipFlop_initial_condition_n;
      A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_P.Delay_InitialCondition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_P.SRFlipFlop_initial_condition_b;
      A380PrimComputerFg_DWork.Memory_PreviousInput_nb = A380PrimComputerFg_P.SRFlipFlop_initial_condition_k;
      A380PrimComputerFg_DWork.Memory_PreviousInput_oc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_l;
      A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bj;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ov = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ok;
      A380PrimComputerFg_DWork.Memory_PreviousInput_e = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_en = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lg;
      A380PrimComputerFg_DWork.Memory_PreviousInput_d = A380PrimComputerFg_P.SRFlipFlop_initial_condition_oh;
      A380PrimComputerFg_DWork.Memory_PreviousInput_a = A380PrimComputerFg_P.SRFlipFlop_initial_condition_cl;
      A380PrimComputerFg_DWork.Memory_PreviousInput_l5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_h;
      A380PrimComputerFg_DWork.Memory_PreviousInput_at = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bjr;
      A380PrimComputerFg_DWork.Memory_PreviousInput_p = A380PrimComputerFg_P.SRFlipFlop_initial_condition_m;
      A380PrimComputerFg_DWork.Memory_PreviousInput_lm = A380PrimComputerFg_P.SRFlipFlop_initial_condition_g;
      A380PrimComputerFg_DWork.Memory_PreviousInput_o4 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jb;
      A380PrimComputerFg_DWork.Memory_PreviousInput_eu = A380PrimComputerFg_P.SRFlipFlop_initial_condition_nh;
      A380PrimComputerFg_DWork.Memory_PreviousInput_k = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d;
      A380PrimComputerFg_DWork.Memory_PreviousInput_f = A380PrimComputerFg_P.SRFlipFlop_initial_condition_db;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ox = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lv;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_i = A380PrimComputerFg_P.DetectChange_vinit_m;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ek = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_g;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_k = A380PrimComputerFg_P.DetectChange_vinit_p;
      A380PrimComputerFg_DWork.Memory_PreviousInput_l1 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jn;
      A380PrimComputerFg_DWork.Memory_PreviousInput_e0 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_i;
      A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_gz;
      A380PrimComputerFg_DWork.Memory_PreviousInput_og = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_c;
      A380PrimComputerFg_DWork.Memory_PreviousInput_oy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_p;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE = A380PrimComputerFg_P.DetectChange_vinit;
      A380PrimComputerFg_DWork.Memory_PreviousInput_jh = A380PrimComputerFg_P.SRFlipFlop_initial_condition_a;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ei = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bp;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_j = A380PrimComputerFg_P.DetectChange_vinit_a;
      A380PrimComputerFg_DWork.Memory_PreviousInput_kj = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lk;
      A380PrimComputerFg_DWork.Memory_PreviousInput_kc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mc;
      A380PrimComputerFg_DWork.Memory_PreviousInput_i3 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j1;
      A380PrimComputerFg_DWork.Memory_PreviousInput_il = A380PrimComputerFg_P.SRFlipFlop_initial_condition_md;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_f = A380PrimComputerFg_P.DetectDecrease_vinit;
      A380PrimComputerFg_DWork.Memory_PreviousInput_lp = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ac;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ae = A380PrimComputerFg_P.SRFlipFlop_initial_condition_hq;
      A380PrimComputerFg_DWork.Memory_PreviousInput_ik = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_fn;
      A380PrimComputerFg_DWork.Memory_PreviousInput_kx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jq;
      A380PrimComputerFg_DWork.Memory_PreviousInput_b = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d;
      A380PrimComputerFg_DWork.Memory_PreviousInput_pt = A380PrimComputerFg_P.SRFlipFlop2_initial_condition;
      A380PrimComputerFg_DWork.Delay_DSTATE_p = A380PrimComputerFg_P.Delay_InitialCondition_hi;
      A380PrimComputerFg_DWork.Memory_PreviousInput_od = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_jg;
      A380PrimComputerFg_DWork.Memory_PreviousInput_hx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pb;
      A380PrimComputerFg_DWork.Memory_PreviousInput_py = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mv;
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_d = A380PrimComputerFg_P.DetectChange_vinit_d;
      A380PrimComputerFg_DWork.Memory_PreviousInput_i5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pq;
      A380PrimComputerFg_DWork.Memory_PreviousInput_iy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d3;
      A380PrimComputerFg_DWork.Memory_PreviousInput_jm = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_fnn;
      A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d2;
      A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_co;
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fh);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_h);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pg);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a5);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_c);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_f);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_p);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_al);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fe);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_o);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ad);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_b);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_at);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cj);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_m);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cs);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_e);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dt);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cia);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_aqw);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lk);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jqs);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_km);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ka);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ne);
      A380PrimComputerFg_DWork.p_trk_fpa_active = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bbo);
      A380PrimComputerFg_DWork.p_metric_alt_active = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bck);
      A380PrimComputerFg_DWork.p_true_active = false;
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eu);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_c4);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ks);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gm);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_na);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ll);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cd);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hv);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ph);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eo);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mn);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a0);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_byg);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cg);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pq0);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_it);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ai);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_h0);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g2i);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fc);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_an);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_br);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ld);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ox);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mv);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_li);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_b4);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lw);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fr);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ab);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ju);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g1d);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bf);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a0v);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g13);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hs);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_my);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ak);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lx);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_b1);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dx);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_is);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_az);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kd);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mm);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_n4);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_p4);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_n3);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_aq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nm);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oqd);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_b2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jx);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dvt);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_iy);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jp);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ed);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fb);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bc);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_d0);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kl);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nc);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g4);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_av);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hp);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fy);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oyv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cm);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_os);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kv);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_je);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cn);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_isd);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oa);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eow);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bi);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oy);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_f3);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_h4);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oz);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oh);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cd0);
      A380PrimComputerFg_DWork.pY_not_empty = false;
      A380PrimComputerFg_DWork.pU_not_empty = false;
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l1);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l0a);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ob);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hw);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pw);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gg);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_j2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oks);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_er);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jf);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kdl);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dm);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oc);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lwx);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_kq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ef);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fk);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jo);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_n11);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bb);
      A380PrimComputerFg_DWork.eventTime_not_empty = false;
      A380PrimComputerFg_DWork.pValue_not_empty_n = false;
      A380PrimComputerFg_DWork.prevMachActive_not_empty = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cbh);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ckt);
      A380PrimComputerFg_MATLABFunction1_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction1_o);
      A380PrimComputerFg_DWork.pValue_not_empty_a = false;
      A380PrimComputerFg_DWork.pValue_not_empty_j = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hq);
      A380PrimComputerFg_MATLABFunction1_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction1_d);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lis);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gw);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fhn);
      A380PrimComputerFg_DWork.pValue_not_empty = false;
      A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty = false;
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ok);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_j0);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a0p);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lth);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_d4);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_dxb);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ep);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_llo);
      A380PrimComputerFg_DWork.vMemoEo_not_empty = false;
      A380PrimComputerFg_DWork.vMemoGa_not_empty = false;
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ar);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_d);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ps);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l0);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_k);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_o3);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pl);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bl);
      A380PrimComputerFg_DWork.pLand3FailOp = false;
      A380PrimComputerFg_DWork.pLand3FailPass = false;
      A380PrimComputerFg_DWork.Runtime_MODE = true;
    }

    A380PrimComputerFg_MATLABFunction(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay, &rtb_y_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_fh);
    rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s = (((!A380PrimComputerFg_U.in.general_logic.engine_running) &&
      A380PrimComputerFg_U.in.general_logic.on_ground) || rtb_y_j);
    rtb_y_ch = ((!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy) &&
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
      rtb_Switch_b_SSM = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.SSM;
      delta = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.Data;
      rtb_Switch2_j_SSM = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.SSM;
      rtb_Switch2_j_Data = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.Data;
    } else if (rtb_AND2) {
      rtb_Switch_b_SSM = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.SSM;
      delta = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.Data;
      rtb_Switch2_j_SSM = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.SSM;
      rtb_Switch2_j_Data = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.Data;
    } else {
      rtb_Switch_b_SSM = A380PrimComputerFg_P.Constant_Value.SSM;
      delta = A380PrimComputerFg_P.Constant_Value.Data;
      rtb_Switch2_j_SSM = A380PrimComputerFg_P.Constant_Value.SSM;
      rtb_Switch2_j_Data = A380PrimComputerFg_P.Constant_Value.Data;
    }

    rtb_BusAssignment_a_fg_logic_fcu_1_chosen = rtb_AND10_j;
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg,
      &rtb_y_c);
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg,
      &rtb_y_j);
    rtb_y_p = (rtb_y_c && rtb_y_j);
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg,
      &rtb_y_c);
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg,
      &rtb_y_j);
    rtb_y_be = (rtb_y_c && rtb_y_j);
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_failure = ((!rtb_y_p) && (!rtb_y_be));
    rtb_y_b3a = (rtb_y_p && rtb_y_be);
    if (rtb_y_be) {
      rtb_Switch_runway_heading_deg_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.SSM;
      rtb_Switch_runway_heading_deg_Data = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.Data;
      rtb_Switch_ils_frequency_mhz_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.SSM;
      rtb_Switch_ils_frequency_mhz_Data = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.Data;
      rtb_Switch_localizer_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.SSM;
      rtb_y_b = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.Data;
      rtb_Switch_glideslope_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.SSM;
      rtb_Switch_glideslope_deviation_deg_Data =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.Data;
    } else {
      rtb_Switch_runway_heading_deg_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.SSM;
      rtb_Switch_runway_heading_deg_Data = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.Data;
      rtb_Switch_ils_frequency_mhz_SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.SSM;
      rtb_Switch_ils_frequency_mhz_Data = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.Data;
      rtb_Switch_localizer_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.SSM;
      rtb_y_b = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.Data;
      rtb_Switch_glideslope_deviation_deg_SSM =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.SSM;
      rtb_Switch_glideslope_deviation_deg_Data =
        A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.Data;
    }

    if (A380PrimComputerFg_U.in.data.adcn_inputs.fms.backbeam_selected) {
      rtb_y_b *= A380PrimComputerFg_P.Gain_Gain;
    }

    rtb_Switch1_l.SSM = rtb_Switch_runway_heading_deg_SSM;
    rtb_Switch1_l.Data = rtb_Switch_runway_heading_deg_Data;
    rtb_Delay_selected_alt = A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt;
    rtb_y_p = (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active ||
               A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active ||
               (A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed &&
                (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <=
                 A380PrimComputerFg_P.CompareToConstant_const)));
    A380PrimComputerFg_MATLABFunction_g(&rtb_Switch1_l, A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue, &rtb_y_n);
    if (!rtb_y_p) {
      A380PrimComputerFg_B.u_lyj = rtb_y_n;
    }

    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_tune_inhibit = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_h((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rollout_submode_active &&
      (std::abs(A380PrimComputerFg_B.u_lyj) > A380PrimComputerFg_P.CompareToConstant_const_f)),
      A380PrimComputerFg_U.in.data.time.dt, &rtb_y_oe, A380PrimComputerFg_P.MTrigNode_isRisingEdge,
      A380PrimComputerFg_P.MTrigNode_retriggerable, A380PrimComputerFg_P.MTrigNode_triggerDuration,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_h);
    rtb_y_h = !rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(((rtb_y_h || (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active)) &&
      ((A380PrimComputerFg_U.in.fctl_logic.active_pitch_law == a380_pitch_efcs_law::NormalLaw) ||
       (A380PrimComputerFg_U.in.fctl_logic.active_pitch_law == a380_pitch_efcs_law::AlternateLaw1A) ||
       (A380PrimComputerFg_U.in.fctl_logic.active_pitch_law == a380_pitch_efcs_law::AlternateLaw1B)) &&
      (!A380PrimComputerFg_U.in.general_logic.double_adr_failure) &&
      (!A380PrimComputerFg_U.in.general_logic.double_ir_failure)), A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge, A380PrimComputerFg_P.ConfirmNode_timeDelay, &rtb_y_oe,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pg);
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.SSM = rtb_Switch_b_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1.Data = delta;
    A380PrimComputerFg_MATLABFunction_cr(&A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge, &rtb_y_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_a5);
    A380PrimComputerFg_DWork.Delay_DSTATE_a = A380PrimComputerFg_P.Logic_table[(((static_cast<uint32_T>(rtb_y_j &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE_a) && rtb_y_oe) << 1) + ((!rtb_y_oe) || (rtb_y_j &&
      A380PrimComputerFg_DWork.Delay_DSTATE_a) || A380PrimComputerFg_DWork.Delay_DSTATE.fd_auto_disengage)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput];
    A380PrimComputerFg_B.BusAssignment_i.data = A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusAssignment_i.general_logic = A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusAssignment_i.flight_envelope = A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusAssignment_i.laws = A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusAssignment_i.fctl_logic = A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.gnd_eng_stop_flt_5s = rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_common_condition = rtb_y_oe;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_engaged = A380PrimComputerFg_U.in.fg_logic.ap_1_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_engaged = A380PrimComputerFg_U.in.fg_logic.ap_2_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.athr_engaged = A380PrimComputerFg_U.in.fg_logic.athr_engaged;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_1_inop = A380PrimComputerFg_U.in.fg_logic.ap_1_inop;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_2_inop = A380PrimComputerFg_U.in.fg_logic.ap_2_inop;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.athr_inop = A380PrimComputerFg_U.in.fg_logic.athr_inop;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fmgc_opp_priority = A380PrimComputerFg_U.in.fg_logic.fmgc_opp_priority;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.altitude_indicated_ft =
      A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.all_fcu_failure = rtb_y_ch;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fcu_1_chosen = rtb_AND10_j;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fcu_2_chosen = rtb_AND2;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2.SSM = rtb_Switch2_j_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.chosen_fcu_discrete_word_2.Data = rtb_Switch2_j_Data;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.both_ils_valid = rtb_y_b3a;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.runway_heading_deg.SSM =
      rtb_Switch_runway_heading_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.runway_heading_deg.Data =
      rtb_Switch_runway_heading_deg_Data;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.ils_frequency_mhz.SSM =
      rtb_Switch_ils_frequency_mhz_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.ils_frequency_mhz.Data =
      rtb_Switch_ils_frequency_mhz_Data;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.SSM =
      rtb_Switch_localizer_deviation_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.Data = rtb_y_b;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM =
      rtb_Switch_glideslope_deviation_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.glideslope_deviation_deg.Data =
      rtb_Switch_glideslope_deviation_deg_Data;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_tune_inhibit = rtb_y_p;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.rwy_hdg_memo = A380PrimComputerFg_B.u_lyj;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_failure = false;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.tcas_mode_available = false;
    A380PrimComputerFg_B.BusAssignment_i.fg_mode_logic = A380PrimComputerFg_U.in.fg_mode_logic;
    A380PrimComputerFg_B.BusAssignment_i.fg_laws = A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusAssignment_i.discrete_outputs = A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusAssignment_i.analog_outputs = A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusAssignment_i.bus_outputs = A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_engaged = A380PrimComputerFg_DWork.Delay_DSTATE_a;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_1_inop = false;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_2_engaged = A380PrimComputerFg_DWork.Delay_DSTATE_a;
    A380PrimComputerFg_B.BusAssignment_i.fg_logic.fd_2_inop = false;
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.ap_1_pushbutton_pressed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_b, &rtb_y_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_c);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge, &rtb_y_oe, &A380PrimComputerFg_DWork.sf_MATLABFunction_f);
    rtb_AND4 = (rtb_y_oe && A380PrimComputerFg_U.in.general_logic.on_ground);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.DelayOneStep_DSTATE,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge, &rtb_y_oe, &A380PrimComputerFg_DWork.sf_MATLABFunction_a);
    rtb_OR2 = ((!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active));
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode1_isRisingEdge, &rtb_y_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_p);
    A380PrimComputerFg_APEngagedLogic(rtb_y_c, A380PrimComputerFg_DWork.Delay_DSTATE_b, rtb_AND4, ((rtb_y_oe && rtb_OR2)
      || (A380PrimComputerFg_DWork.DelayOneStep_DSTATE && rtb_y_j && (A380PrimComputerFg_P.APEngagedLogic_isSide2 != 0.0))),
      (A380PrimComputerFg_U.in.general_logic.on_ground &&
       (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
        (A380PrimComputerFg_P.CompareToConstant3_const <= 0.0) || (A380PrimComputerFg_P.CompareToConstant5_const <= 0.0))),
      ((A380PrimComputerFg_U.in.flight_envelope.v_max_kn < 0.0) || (A380PrimComputerFg_U.in.flight_envelope.v_ls_kn >
      0.0) || (A380PrimComputerFg_P.CompareToConstant_const_g > 0.0) || (A380PrimComputerFg_P.CompareToConstant1_const <
      0.0) || (A380PrimComputerFg_P.CompareToConstant2_const < 0.0)), &A380PrimComputerFg_B.BusAssignment_i, &rtb_y_oe,
      &rtb_y_j, &A380PrimComputerFg_B.BusAssignment_es.fg_logic.ap_1_inop);
    A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.Logic_table_i[(((static_cast<uint32_T>
      (rtb_y_oe) << 1) + rtb_y_j) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_n];
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Memory_PreviousInput_n,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_g,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_b, &rtb_y_oe, &A380PrimComputerFg_DWork.sf_MATLABFunction);
    A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_P.Logic_table_d[(((static_cast<uint32_T>(rtb_y_c &&
      A380PrimComputerFg_DWork.Memory_PreviousInput_n) << 1) + ((!rtb_y_oe) ||
      A380PrimComputerFg_U.in.data.discrete_inputs.capt_priority_takeover_pressed ||
      A380PrimComputerFg_U.in.data.discrete_inputs.fo_priority_takeover_pressed)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_i];
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.ap_2_pushbutton_pressed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_l, &rtb_y_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_al);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_n, &rtb_y_oe, &A380PrimComputerFg_DWork.sf_MATLABFunction_fe);
    rtb_AND4 = (rtb_y_oe && A380PrimComputerFg_U.in.general_logic.on_ground);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.DelayOneStep1_DSTATE,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_b, &rtb_y_oe, &A380PrimComputerFg_DWork.sf_MATLABFunction_o);
    rtb_OR2 = ((!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active));
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode1_isRisingEdge_b, &rtb_y_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ad);
    A380PrimComputerFg_APEngagedLogic(rtb_y_c, A380PrimComputerFg_DWork.Delay_DSTATE_d, rtb_AND4, ((rtb_y_oe && rtb_OR2)
      || (A380PrimComputerFg_DWork.DelayOneStep1_DSTATE && rtb_y_j && (A380PrimComputerFg_P.APEngagedLogic1_isSide2 !=
      0.0))), (A380PrimComputerFg_U.in.general_logic.on_ground &&
               (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                (A380PrimComputerFg_P.CompareToConstant3_const_k <= 0.0) ||
                (A380PrimComputerFg_P.CompareToConstant5_const_f <= 0.0))),
      ((A380PrimComputerFg_U.in.flight_envelope.v_max_kn < 0.0) || (A380PrimComputerFg_U.in.flight_envelope.v_ls_kn >
      0.0) || (A380PrimComputerFg_P.CompareToConstant_const_a > 0.0) || (A380PrimComputerFg_P.CompareToConstant1_const_e
      < 0.0) || (A380PrimComputerFg_P.CompareToConstant2_const_n < 0.0)), &A380PrimComputerFg_B.BusAssignment_i,
      &rtb_y_oe, &rtb_y_j, &A380PrimComputerFg_B.BusAssignment_es.fg_logic.ap_2_inop);
    A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.Logic_table_o[(((static_cast<uint32_T>
      (rtb_y_oe) << 1) + rtb_y_j) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_m];
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Memory_PreviousInput_m,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_p,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_h, &rtb_y_oe, &A380PrimComputerFg_DWork.sf_MATLABFunction_b);
    A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_P.Logic_table_m[(((static_cast<uint32_T>(rtb_y_c &&
      A380PrimComputerFg_DWork.Memory_PreviousInput_m) << 1) + ((!rtb_y_oe) ||
      A380PrimComputerFg_U.in.data.discrete_inputs.capt_priority_takeover_pressed ||
      A380PrimComputerFg_U.in.data.discrete_inputs.fo_priority_takeover_pressed)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_o];
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_U.in.data.discrete_inputs.athr_instinctive_disc,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_p,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_l, &rtb_y_oe, &A380PrimComputerFg_DWork.sf_MATLABFunction_at);
    A380PrimComputerFg_DWork.Memory_PreviousInput_m0 = A380PrimComputerFg_P.Logic_table_a[(((static_cast<uint32_T>
      (rtb_y_oe) << 1) + A380PrimComputerFg_P.Constant_Value_o) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_m0];
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.athr_pushbutton,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_p, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_g);
    A380PrimComputerFg_MATLABFunction((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode2_isRisingEdge,
      A380PrimComputerFg_P.ConfirmNode2_timeDelay, &rtb_y_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_cj);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_j, A380PrimComputerFg_P.PulseNode1_isRisingEdge_p, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g2);
    A380PrimComputerFg_MATLABFunction_c(((A380PrimComputerFg_P.CompareToConstant_const_k > 0.0) &&
      (A380PrimComputerFg_P.CompareToConstant1_const_h > 0.0)), A380PrimComputerFg_P.PulseNode2_isRisingEdge_m,
      &rtb_y_j3, &A380PrimComputerFg_DWork.sf_MATLABFunction_m);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.flight_envelope.alpha_floor_condition,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_p, &rtb_y_o2, &A380PrimComputerFg_DWork.sf_MATLABFunction_cs);
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode4_isRisingEdge, &rtb_y_c,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_l);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge, &rtb_y_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_e);
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Delay_DSTATE_m, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode3_isRisingEdge, A380PrimComputerFg_P.ConfirmNode3_timeDelay, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pv);
    rtb_y_oe = ((A380PrimComputerFg_DWork.Delay_DSTATE.manual_spd_control_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE.auto_spd_control_active) &&
                (!A380PrimComputerFg_DWork.Memory_PreviousInput_m0) && rtb_y_h &&
                (!A380PrimComputerFg_U.in.flight_envelope.speed_scale_lost));
    rtb_OR4_b = !rtb_y_oe;
    A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_P.Logic_table_h[(((static_cast<uint32_T>(rtb_y_oe &&
      ((rtb_y_ch && ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft > 100.0) ||
                     A380PrimComputerFg_U.in.general_logic.all_ra_failure)) || rtb_y_p || rtb_y_o2 || rtb_y_j)) << 1) +
      (rtb_OR4_b || rtb_y_c || (A380PrimComputerFg_DWork.Delay_DSTATE_m && rtb_y_ch &&
      (!A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active)) ||
       A380PrimComputerFg_U.in.data.discrete_inputs.athr_instinctive_disc || rtb_y_j3 || rtb_Compare_no)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_io];
    rtb_y_oe = (A380PrimComputerFg_DWork.Delay_DSTATE_b || A380PrimComputerFg_DWork.DelayOneStep_DSTATE);
    rtb_y_be = (rtb_y_oe || A380PrimComputerFg_DWork.Delay_DSTATE_a || A380PrimComputerFg_DWork.Delay_DSTATE_a);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_na, &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_dt);
    rtb_Compare_l1 = !rtb_y_be;
    rtb_AND10_j = (rtb_Compare_l1 || (rtb_y_p && A380PrimComputerFg_U.in.general_logic.on_ground));
    rtb_AND4 = !A380PrimComputerFg_U.in.fctl_logic.is_master_prim;
    rtb_OR2 = rtb_y_be;
    rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset = rtb_AND10_j;
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_Compare_no, A380PrimComputerFg_P.MTrigNode_isRisingEdge_l,
      A380PrimComputerFg_P.MTrigNode_retriggerable_b, A380PrimComputerFg_P.MTrigNode_triggerDuration_a,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cia);
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode1_isRisingEdge_f, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_aqw);
    A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.Logic_table_mv[(((static_cast<uint32_T>
      (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active && rtb_y_p) << 1) +
      A380PrimComputerFg_DWork.Delay_DSTATE_me) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_g];
    A380PrimComputerFg_DWork.Delay_DSTATE_me = (A380PrimComputerFg_DWork.Memory_PreviousInput_g &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active));
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_DWork.Delay_DSTATE_me, A380PrimComputerFg_U.in.data.time.dt,
      &rtb_y_ch, A380PrimComputerFg_P.MTrigNode1_isRisingEdge, A380PrimComputerFg_P.MTrigNode1_retriggerable,
      A380PrimComputerFg_P.MTrigNode1_triggerDuration, &A380PrimComputerFg_DWork.sf_MATLABFunction_lk);
    A380PrimComputerFg_MATLABFunction_h((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.clb_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.des_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.app_des_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.glide_armed ||
       A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.alt_acq_armed)), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_p,
      A380PrimComputerFg_P.MTrigNode2_isRisingEdge, A380PrimComputerFg_P.MTrigNode2_retriggerable,
      A380PrimComputerFg_P.MTrigNode2_triggerDuration, &A380PrimComputerFg_DWork.sf_MATLABFunction_jqs);
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue, &rtb_y_n);
    rtb_AND_k1 = ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) &&
                  A380PrimComputerFg_DWork.Delay_DSTATE.alt_cstr_applicable &&
                  (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active) &&
                  A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid);
    if (A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt > rtb_y_n) {
      rtb_y_h = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft <
                  A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt) &&
                 ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft + 250.0 > rtb_y_n) || rtb_AND_k1));
    } else {
      rtb_y_h = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft >
                  A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt) &&
                 ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft - 250.0 < rtb_y_n) || rtb_AND_k1));
    }

    rtb_AND_k1 = ((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.clb_armed ||
                   A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.des_armed ||
                   A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
                   A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active || rtb_AND_k1) &&
                  (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft != 0.0) && rtb_y_h);
    if (rtb_AND_k1) {
      rtb_altCstrOrFcu = A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft;
    } else {
      rtb_altCstrOrFcu = A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt;
    }

    rtb_BusAssignment_g1_fg_logic_chosen_fcu_discrete_word_1.SSM = rtb_Switch_b_SSM;
    rtb_BusAssignment_g1_fg_logic_chosen_fcu_discrete_word_1.Data = delta;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.trk_fpa_deselected = rtb_y_ch;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longi_large_box_tcas = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_g1_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode4_isRisingEdge_h, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_km);
    A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_P.Logic_table_d4[(((static_cast<uint32_T>
      (((!A380PrimComputerFg_DWork.Delay_DSTATE_h) && rtb_y_p) ||
       A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_mach_mode_activate ||
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate &&
        (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_mach > A380PrimComputerFg_P.CompareToConstant1_const_k))) <<
      1) + ((rtb_y_p && A380PrimComputerFg_DWork.Delay_DSTATE_h) ||
            A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_spd_mode_activate ||
            (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate &&
             (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_kts >
              A380PrimComputerFg_P.CompareToConstant_const_fo)))) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_l];
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_g1_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_i, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_e, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ka);
    A380PrimComputerFg_MATLABFunction_c(((A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active
      && (!A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.trk_active)) ||
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.tcas_active),
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_pe, &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_ne);
    if (rtb_y_p) {
      A380PrimComputerFg_DWork.p_trk_fpa_active = false;
    } else if (rtb_y_ch) {
      A380PrimComputerFg_DWork.p_trk_fpa_active = !A380PrimComputerFg_DWork.p_trk_fpa_active;
    }

    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_g1_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_i, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bbo);
    if (rtb_y_p) {
      A380PrimComputerFg_DWork.p_metric_alt_active = !A380PrimComputerFg_DWork.p_metric_alt_active;
    }

    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_g1_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel3_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_p, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bck);
    if (rtb_y_p) {
      A380PrimComputerFg_DWork.p_true_active = !A380PrimComputerFg_DWork.p_true_active;
    }

    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_e,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_j, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_eu);
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode_isRisingEdge_n, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_c4);
    rtb_OR_o = !rtb_AND4;
    rtb_OR_g = (rtb_OR_o && (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active) && rtb_y_ch &&
                (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts > A380PrimComputerFg_P.CompareToConstant2_const_d)
                && (A380PrimComputerFg_U.in.general_logic.flap_handle_index >=
                    A380PrimComputerFg_P.CompareToConstant_const_o) && rtb_y_p);
    A380PrimComputerFg_MATLABFunction(rtb_OR_g, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_j, A380PrimComputerFg_P.ConfirmNode_timeDelay_d, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ks);
    A380PrimComputerFg_DWork.Memory_PreviousInput_nb = A380PrimComputerFg_P.Logic_table_m0[(((rtb_AND10_j ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_p))) + (static_cast<uint32_T>
      (rtb_OR_g) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_nb];
    rtb_BusAssignment_ie_fg_logic_ils_computation_data_runway_heading_deg.SSM = rtb_Switch_runway_heading_deg_SSM;
    rtb_BusAssignment_ie_fg_logic_ils_computation_data_runway_heading_deg.Data = rtb_Switch_runway_heading_deg_Data;
    rtb_BusAssignment_ie_fg_logic_ils_computation_data_localizer_deviation_deg.SSM =
      rtb_Switch_localizer_deviation_deg_SSM;
    rtb_BusAssignment_ie_fg_logic_ils_computation_data_localizer_deviation_deg.Data = rtb_y_b;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tcas_ra_inhibited = rtb_Compare_no;
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_f,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_o, &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_gm);
    A380PrimComputerFg_MATLABFunction_g(&rtb_BusAssignment_ie_fg_logic_ils_computation_data_runway_heading_deg,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_d, &rtb_y_o);
    rtb_y_b = std::abs(rtb_y_o);
    A380PrimComputerFg_MATLABFunction_g(&rtb_BusAssignment_ie_fg_logic_ils_computation_data_localizer_deviation_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue, &rtb_y_o);
    A380PrimComputerFg_MATLABFunction_nn(&rtb_BusAssignment_ie_fg_logic_ils_computation_data_localizer_deviation_deg,
      &rtb_Compare_no);
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_k,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_m, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_na);
    if (rtb_y_o < 0.0F) {
      dPsi_1 = -rtb_y_o;
    } else {
      dPsi_1 = rtb_y_o;
    }

    rtb_OR_g = (rtb_OR_o && (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active) &&
                ((A380PrimComputerFg_U.in.general_logic.flap_handle_index >=
                  A380PrimComputerFg_P.CompareToConstant_const_j0) && rtb_y_p && (rtb_y_b <=
      A380PrimComputerFg_P.CompareToConstant2_const_mw) && (dPsi_1 < A380PrimComputerFg_P.CompareToConstant1_const_i) &&
                 A380PrimComputerFg_P.Constant_Value_g && rtb_Compare_no && rtb_y_ch));
    A380PrimComputerFg_MATLABFunction(rtb_OR_g, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_g2, A380PrimComputerFg_P.ConfirmNode_timeDelay_dd, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ll);
    rtb_y_j = !rtb_y_p;
    A380PrimComputerFg_MATLABFunction_nn(&rtb_BusAssignment_ie_fg_logic_ils_computation_data_localizer_deviation_deg,
      &rtb_y_p);
    A380PrimComputerFg_DWork.Memory_PreviousInput_oc = A380PrimComputerFg_P.Logic_table_k[((((rtb_y_j &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_trk_submode_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_AND10_j || (!rtb_y_p)) +
      (static_cast<uint32_T>(rtb_OR_g) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_oc];
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
      A380PrimComputerFg_P.CompareToConstant_const_h), A380PrimComputerFg_P.PulseNode_isRisingEdge_le, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cd);
    A380PrimComputerFg_MATLABFunction_h(rtb_y_p, A380PrimComputerFg_U.in.data.time.dt, &rtb_y_ch,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_h, A380PrimComputerFg_P.MTrigNode_retriggerable_l,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_j, &A380PrimComputerFg_DWork.sf_MATLABFunction_hv);
    rtb_OR_g = (rtb_OR_o && ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.nav_armed)) && rtb_y_ch);
    A380PrimComputerFg_MATLABFunction(rtb_OR_g, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_b, A380PrimComputerFg_P.ConfirmNode_timeDelay_p, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ph);
    A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.Logic_table_ml[(((((!rtb_y_p) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_AND10_j) + (static_cast<uint32_T>
      (rtb_OR_g) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_h];
    rtb_BusAssignment_gq_fg_logic_chosen_fcu_discrete_word_1.SSM = rtb_Switch_b_SSM;
    rtb_BusAssignment_gq_fg_logic_chosen_fcu_discrete_word_1.Data = delta;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_gq_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_b, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_f, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_eo);
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_h,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_df, &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_mn);
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_m, &rtb_y_n);
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_k, &rtb_y_l);
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg,
      A380PrimComputerFg_P.A429ValueOrDefault2_defaultValue, &rtb_y_b);
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_e, &rtb_y_o);
    rtb_AND1_is = !A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_failure;
    rtb_Compare_g = ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (rtb_OR_o &&
      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.selected_approach_type ==
        A380PrimComputerFg_P.EnumeratedConstant_Value) && rtb_AND1_is &&
       ((!A380PrimComputerFg_U.in.general_logic.engine_running) ||
        (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >= A380PrimComputerFg_P.CompareToConstant_const_kb))
       && (!A380PrimComputerFg_U.in.general_logic.all_ra_failure) && rtb_Compare_no && (!rtb_y_p) &&
       ((!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active) &&
        (!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.app_des_armed))) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active) &&
      (!A380PrimComputerFg_P.Constant2_Value) && (!A380PrimComputerFg_P.Constant2_Value) && (((rtb_y_n == rtb_y_l) &&
      (rtb_y_b == rtb_y_o)) || (!rtb_y_b3a))));
    rtb_y_o2 = (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active);
    rtb_Compare_o0 = (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active),
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_bh, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_a0);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_n4,
      &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_dv);
    rtb_OR_g = (rtb_Compare_o0 && rtb_y_p);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_gq_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_l, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_d, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_byg);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ov = A380PrimComputerFg_P.Logic_table_b
      [(((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active || ((!rtb_y_o2) &&
           (!rtb_Compare_o0) && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.nav_armed) || ((rtb_y_o2 && rtb_y_ch) ||
           rtb_OR_g) || (rtb_Compare_no && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed) || rtb_y_p ||
          rtb_AND10_j || A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active) + (static_cast<uint32_T>
          (rtb_Compare_g) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_ov];
    A380PrimComputerFg_MATLABFunction(!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_hr,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_jv, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_cg);
    A380PrimComputerFg_MATLABFunction((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <
      A380PrimComputerFg_P.CompareToConstant_const_b), A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_h, A380PrimComputerFg_P.ConfirmNode1_timeDelay_ll, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pq0);
    rtb_y_j = (rtb_y_ch && (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active &&
                A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active && rtb_y_p));
    A380PrimComputerFg_MATLABFunction(rtb_y_j, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_o, A380PrimComputerFg_P.ConfirmNode_timeDelay_g, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_it);
    rtb_y_j3 = !rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_gq_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_d, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_bf, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ai);
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode2_isRisingEdge_k,
      A380PrimComputerFg_P.ConfirmNode2_timeDelay_i, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_h0);
    rtb_OR_g = ((!A380PrimComputerFg_DWork.Delay_DSTATE_b) && (!A380PrimComputerFg_DWork.DelayOneStep_DSTATE));
    A380PrimComputerFg_DWork.Memory_PreviousInput_e = A380PrimComputerFg_P.Logic_table_of
      [(((((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
             A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active)) && rtb_y_j3) ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active || (rtb_OR_g && rtb_y_p &&
           rtb_y_ch) || rtb_AND10_j) + (static_cast<uint32_T>(rtb_y_j) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_e];
    A380PrimComputerFg_MATLABFunction((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active &&
      (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <= A380PrimComputerFg_P.CompareToConstant2_const_o) &&
      A380PrimComputerFg_U.in.general_logic.on_ground), A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_k, A380PrimComputerFg_P.ConfirmNode1_timeDelay_f, &rtb_y_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g2i);
    A380PrimComputerFg_DWork.Memory_PreviousInput_en = A380PrimComputerFg_P.Logic_table_n[(((static_cast<uint32_T>
      (rtb_y_j) << 1) + static_cast<uint32_T>(!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_en];
    A380PrimComputerFg_MATLABFunction(false, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_e, A380PrimComputerFg_P.ConfirmNode1_timeDelay_l3, &rtb_y_j3,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fc);
    A380PrimComputerFg_DWork.Memory_PreviousInput_d = A380PrimComputerFg_P.Logic_table_mh[(((static_cast<uint32_T>
      (rtb_y_j3) << 1) + static_cast<uint32_T>(!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) << 1)
      + A380PrimComputerFg_DWork.Memory_PreviousInput_d];
    rtb_BusAssignment_o_fg_logic_chosen_fcu_discrete_word_1.SSM = rtb_Switch_b_SSM;
    rtb_BusAssignment_o_fg_logic_chosen_fcu_discrete_word_1.Data = delta;
    rtb_Compare_o0 = false;
    rtb_y_p = ((!A380PrimComputerFg_U.in.general_logic.engine_running) ||
               (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                A380PrimComputerFg_P.CompareToConstant_const_m) || A380PrimComputerFg_U.in.general_logic.all_ra_failure);
    rtb_Compare_no = !A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active;
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.app_des_armed,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bv,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_hq, &rtb_y_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_an);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_o_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_j, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_i, &rtb_y_o2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_br);
    rtb_AND10_j = ((!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active) && rtb_Compare_no &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active) &&
                   (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active) && (!rtb_y_c) && rtb_y_o2);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.nav_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_b,
      &rtb_Compare_no, &A380PrimComputerFg_DWork.sf_MATLABFunction_ld);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_o_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_j, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_fw, &rtb_Compare_o0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ox);
    A380PrimComputerFg_DWork.Memory_PreviousInput_a = A380PrimComputerFg_P.Logic_table_az[(((static_cast<uint32_T>
      ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (rtb_OR_o &&
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid &&
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.selected_approach_type ==
       A380PrimComputerFg_P.EnumeratedConstant_Value_g) && rtb_y_p &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed) && rtb_AND10_j)) << 1) +
      (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
       (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid) || rtb_Compare_no || (rtb_y_o2 &&
      A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.app_des_armed) || rtb_Compare_o0 ||
       rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_a];
    rtb_y_j = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active &&
               A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.app_des_armed &&
               A380PrimComputerFg_U.in.data.adcn_inputs.fms.final_app_can_engage &&
               (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                A380PrimComputerFg_P.EnumeratedConstant_Value_m));
    A380PrimComputerFg_MATLABFunction(rtb_y_j, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_n, A380PrimComputerFg_P.ConfirmNode_timeDelay_k, &rtb_y_c,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_mv);
    A380PrimComputerFg_DWork.Memory_PreviousInput_l5 = A380PrimComputerFg_P.Logic_table_p
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_c))) + (static_cast<uint32_T>
          (rtb_y_j) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_l5];
    rtb_y_ch = rtb_OR_o;
    rtb_y_o2 = !A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active;
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_om,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_a, &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_oq);
    rtb_Compare_o0 = (A380PrimComputerFg_U.in.general_logic.flap_angle_deg >=
                      A380PrimComputerFg_P.CompareToConstant_const_p);
    rtb_Compare_g = (A380PrimComputerFg_P.CompareToConstant3_const_b <= 0.0);
    rtb_y_h = (A380PrimComputerFg_P.CompareToConstant5_const_b <= 0.0);
    A380PrimComputerFg_MATLABFunction_c((rtb_Compare_g || rtb_y_h), A380PrimComputerFg_P.PulseNode_isRisingEdge_k,
      &rtb_Compare_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_li);
    rtb_y_j = (rtb_OR_o && (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active) && rtb_y_o2 &&
               (!rtb_y_p) && rtb_Compare_o0 && rtb_Compare_g);
    A380PrimComputerFg_MATLABFunction(rtb_y_j, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ks, A380PrimComputerFg_P.ConfirmNode_timeDelay_k1, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_b4);
    A380PrimComputerFg_DWork.Memory_PreviousInput_at = A380PrimComputerFg_P.Logic_table_bt
      [((((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
           (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) && (!rtb_y_ch)) + (static_cast<uint32_T>
          (rtb_y_j) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_at];
    rtb_y_ch = rtb_OR_o;
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_y_o2, A380PrimComputerFg_P.MTrigNode_isRisingEdge_c,
      A380PrimComputerFg_P.MTrigNode_retriggerable_c, A380PrimComputerFg_P.MTrigNode_triggerDuration_n,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lw);
    rtb_y_j = (rtb_OR_o && ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active) && rtb_y_o2));
    A380PrimComputerFg_MATLABFunction(rtb_y_j, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bw, A380PrimComputerFg_P.ConfirmNode_timeDelay_ax, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fr);
    A380PrimComputerFg_DWork.Memory_PreviousInput_p = A380PrimComputerFg_P.Logic_table_m0u
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_ch))) + (static_cast<uint32_T>
          (rtb_y_j) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_p];
    rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1.SSM = rtb_Switch_b_SSM;
    rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1.Data = delta;
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_e,
      &rtb_Compare_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_ab);
    rtb_Compare_no = ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active) &&
                      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active) &&
                      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) &&
                      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active));
    rtb_y_o2 = ((!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active));
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_i, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h((rtb_y != 0U), A380PrimComputerFg_U.in.data.time.dt, &rtb_Compare_g,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_f, A380PrimComputerFg_P.MTrigNode_retriggerable_g,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_jn, &A380PrimComputerFg_DWork.sf_MATLABFunction_ju);
    rtb_y_j = ((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active) && rtb_Compare_o0 && rtb_Compare_no &&
               rtb_y_o2 && (!rtb_Compare_g));
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.app_des_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active),
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_e, &rtb_Compare_no, &A380PrimComputerFg_DWork.sf_MATLABFunction_g1d);
    rtb_y_ch = (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_im, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_g, &rtb_Compare_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bf);
    rtb_y_j3 = (rtb_y_ch && ((!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed) &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) && rtb_Compare_g);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel5_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_a, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_a0v);
    rtb_y_p = ((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active &&
                ((!A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid) ||
                 (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.nav_capture_condition)) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active)) || rtb_y_j || (rtb_y_o2 &&
                rtb_Compare_no && A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active &&
                ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active))) || rtb_y_j3 ||
               (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active &&
                A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active && rtb_y_ch));
    rtb_Compare_no = rtb_OR_o;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_i, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_ft, &rtb_Compare_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g13);
    rtb_y_o2 = (rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s && rtb_Compare_g &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) &&
                ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active) ||
                 (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                  A380PrimComputerFg_P.CompareToConstant_const_j)));
    rtb_Compare_o0 = !A380PrimComputerFg_U.in.general_logic.on_ground;
    A380PrimComputerFg_MATLABFunction_c(rtb_y_be, A380PrimComputerFg_P.PulseNode4_isRisingEdge_b, &rtb_y_h,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_hs);
    rtb_Compare_g = ((!A380PrimComputerFg_DWork.Delay_DSTATE.any_lateral_mode_engaged) &&
                     (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active));
    rtb_y_j = (rtb_OR_o && (rtb_y_o2 || (rtb_Compare_o0 && rtb_y_h && rtb_Compare_g) || rtb_y_p));
    A380PrimComputerFg_MATLABFunction(rtb_y_j, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_d, A380PrimComputerFg_P.ConfirmNode_timeDelay_c, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_my);
    A380PrimComputerFg_DWork.Memory_PreviousInput_lm = A380PrimComputerFg_P.Logic_table_ou[(((((!rtb_Compare_no) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) ||
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset) + (static_cast<uint32_T>(rtb_y_j) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_lm];
    rtb_y_j = ((!A380PrimComputerFg_DWork.p_trk_fpa_active) && A380PrimComputerFg_DWork.Memory_PreviousInput_lm);
    rtb_y_j3 = (A380PrimComputerFg_DWork.Memory_PreviousInput_lm && A380PrimComputerFg_DWork.p_trk_fpa_active);
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_mode_reversion = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_jq, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_nq, &rtb_Compare_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ak);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.adcn_inputs.fms.direct_to_nav_engage,
      A380PrimComputerFg_P.PulseNode7_isRisingEdge, &rtb_Compare_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_lx);
    rtb_y_o2 = !A380PrimComputerFg_U.in.data.adcn_inputs.fms.nav_capture_condition;
    rtb_y_ch = ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active) &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (rtb_Compare_g || (rtb_Compare_o0 &&
      rtb_y_o2)));
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_a, &rtb_y_o2, &A380PrimComputerFg_DWork.sf_MATLABFunction_b1);
    rtb_Compare_no = ((!A380PrimComputerFg_DWork.Delay_DSTATE.hdg_trk_preset_available) || rtb_y_o2);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.app_des_armed,
      A380PrimComputerFg_P.PulseNode4_isRisingEdge_g, &rtb_Compare_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_dx);
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_Compare_g, A380PrimComputerFg_P.MTrigNode_isRisingEdge_p,
      A380PrimComputerFg_P.MTrigNode_retriggerable_k, A380PrimComputerFg_P.MTrigNode_triggerDuration_l,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_is);
    rtb_y_o2 = !A380PrimComputerFg_DWork.Delay_DSTATE.hdg_trk_preset_available;
    rtb_y_p = (rtb_OR_o && A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid && (rtb_y_ch ||
                (A380PrimComputerFg_U.in.general_logic.on_ground && rtb_Compare_no &&
                 ((!A380PrimComputerFg_DWork.Delay_DSTATE.any_lateral_mode_engaged) ||
                  A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active)) || rtb_Compare_o0 ||
                (rtb_Compare_g && rtb_y_o2)));
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE.hdg_trk_preset_available,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_i, &rtb_Compare_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_az);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_f, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_k, &rtb_y_h,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_kd);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.loc_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode6_isRisingEdge,
      &rtb_y_o2, &A380PrimComputerFg_DWork.sf_MATLABFunction_mm);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Memory_PreviousInput_a,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_g, &rtb_Compare_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_n4);
    A380PrimComputerFg_DWork.Memory_PreviousInput_o4 = A380PrimComputerFg_P.Logic_table_h5[(((rtb_Compare_g || rtb_y_h ||
      rtb_y_o2 || (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid) || rtb_Compare_o0 ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active || rtb_Compare_l1) + (static_cast<uint32_T>(rtb_y_p)
      << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_o4];
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_U.in.data.adcn_inputs.fms.direct_to_nav_engage,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_y_o2, A380PrimComputerFg_P.MTrigNode_isRisingEdge_n,
      A380PrimComputerFg_P.MTrigNode_retriggerable_d, A380PrimComputerFg_P.MTrigNode_triggerDuration_d,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_p4);
    rtb_Compare_no = (A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.nav_armed || (rtb_y_o2 &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active))));
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_U.in.data.adcn_inputs.fms.nav_capture_condition && rtb_Compare_no &&
                ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                  A380PrimComputerFg_P.CompareToConstant_const_e) ||
                 A380PrimComputerFg_U.in.general_logic.all_ra_failure) &&
                ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active) ||
                 (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                  A380PrimComputerFg_P.CompareToConstant1_const_g)));
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_nr, A380PrimComputerFg_P.ConfirmNode_timeDelay_kx, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_n3);
    A380PrimComputerFg_DWork.Memory_PreviousInput_eu = A380PrimComputerFg_P.Logic_table_as
      [((((!A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid) ||
          rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_no))) +
         (static_cast<uint32_T>(rtb_y_ch) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_eu];
    rtb_y_ch = rtb_OR_o;
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode1_isRisingEdge_pq,
      &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_aq);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_h_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_c, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_h, &rtb_y_h,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_nm);
    rtb_Compare_no = rtb_AND1_is;
    rtb_y_o2 = (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
                A380PrimComputerFg_P.CompareToConstant_const_n);
    rtb_AND1_is = (rtb_y_h && rtb_AND1_is && rtb_y_o2 && ((A380PrimComputerFg_P.EnumeratedConstant_Value_i !=
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
       A380PrimComputerFg_P.EnumeratedConstant1_Value_d)));
    A380PrimComputerFg_MATLABFunction(rtb_AND1_is, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ez, A380PrimComputerFg_P.ConfirmNode_timeDelay_i, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oqd);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_k3, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_b2);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.nav_armed,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_i, &rtb_y_o2, &A380PrimComputerFg_DWork.sf_MATLABFunction_jx);
    A380PrimComputerFg_DWork.Memory_PreviousInput_k = A380PrimComputerFg_P.Logic_table_id[(((((!rtb_Compare_no) &&
      rtb_y_ch) || A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      ((!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed) &&
       (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && rtb_y_h &&
       A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.loc_armed) || rtb_y_o2) + (static_cast<uint32_T>(rtb_OR_o &&
      (rtb_y_p || rtb_AND1_is)) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_k];
    rtb_BusAssignment_il_fg_logic_ils_computation_data_localizer_deviation_deg.SSM =
      rtb_Switch_localizer_deviation_deg_SSM;
    rtb_BusAssignment_il_fg_logic_ils_computation_data_localizer_deviation_deg.Data =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_computation_data.localizer_deviation_deg.Data;
    A380PrimComputerFg_MATLABFunction_g(&rtb_BusAssignment_il_fg_logic_ils_computation_data_localizer_deviation_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_i, &rtb_y_o);
    dPsi_1 = std::fmod((0.0 - (A380PrimComputerFg_B.u_lyj + 360.0)) + 360.0, 360.0);
    if (dPsi_1 == 0.0) {
      dPsi_1 = 0.0;
    } else if (dPsi_1 < 0.0) {
      dPsi_1 += 360.0;
    }

    dPsi_2 = std::fmod(360.0 - dPsi_1, 360.0);
    if (dPsi_1 < dPsi_2) {
      dPsi_2 = -dPsi_1;
    }

    if (dPsi_2 < 0.0) {
      y = -1;
    } else {
      y = (dPsi_2 > 0.0);
    }

    rtb_y_ch = (y == 0);
    dPsi_1 = std::abs(dPsi_2);
    if (dPsi_1 < 115.0) {
      rtb_y_b = std::abs(rtb_y_o);
      if (rtb_y_o < 0.0F) {
        tmp = -1;
      } else {
        tmp = (rtb_y_o > 0.0F);
      }

      if (((dPsi_1 > 25.0) && ((rtb_y_b < 10.0F) && ((y != tmp) && rtb_y_ch))) || (rtb_y_b < 1.92)) {
        rtb_y_ch = (rtb_y_ch || ((dPsi_1 < 15.0) && (rtb_y_b < 1.1)));
      } else {
        rtb_y_ch = false;
      }
    } else {
      rtb_y_ch = false;
    }

    A380PrimComputerFg_MATLABFunction_nn(&rtb_BusAssignment_il_fg_logic_ils_computation_data_localizer_deviation_deg,
      &rtb_Compare_no);
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.loc_armed && rtb_y_ch && rtb_Compare_no);
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_f, A380PrimComputerFg_P.ConfirmNode_timeDelay_dw, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_dvt);
    A380PrimComputerFg_DWork.Memory_PreviousInput_f = A380PrimComputerFg_P.Logic_table_py[(((((!rtb_y_ch) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) ||
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset) + (static_cast<uint32_T>(rtb_y_p) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_f];
    A380PrimComputerFg_MATLABFunction_g(&rtb_BusAssignment_il_fg_logic_ils_computation_data_localizer_deviation_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_h, &rtb_y_o);
    if (rtb_y_o < 0.0F) {
      dPsi_1 = -rtb_y_o;
    } else {
      dPsi_1 = rtb_y_o;
    }

    A380PrimComputerFg_MATLABFunction((dPsi_1 < A380PrimComputerFg_P.CompareToConstant1_const_n),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_jx,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_cd, &rtb_Compare_no, &A380PrimComputerFg_DWork.sf_MATLABFunction_iy);
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active && rtb_Compare_no);
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_c, A380PrimComputerFg_P.ConfirmNode_timeDelay_kp, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_jp);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ox = A380PrimComputerFg_P.Logic_table_c[(((((!rtb_y_ch) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) ||
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset) + (static_cast<uint32_T>(rtb_y_p) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_ox];
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue_c, &rtb_y_o);
    rtb_y_o -= A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt;
    rtb_y_b = std::abs(rtb_y_o);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ek = A380PrimComputerFg_P.Logic_table_pp[(((static_cast<uint32_T>
      ((A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt != A380PrimComputerFg_DWork.DelayInput1_DSTATE_i) || (rtb_y_b
      > A380PrimComputerFg_P.CompareToConstant1_const_j)) << 1) +
      (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active && (rtb_y_b <=
      A380PrimComputerFg_P.CompareToConstant_const_oj))) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_ek];
    rtb_Compare_no = !A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active;
    if (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active) {
      rtb_y_b = A380PrimComputerFg_DWork.Delay_DSTATE.selected_vs_fpa;
    } else {
      rtb_y_b = 0.0F;
    }

    rtb_y_be = (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active);
    if (rtb_y_o < 0.0F) {
      rtb_y_h = (rtb_y_b <= 0.0F);
    } else {
      rtb_y_h = ((rtb_y_o > 0.0F) && (rtb_y_b >= 0.0F));
    }

    rtb_y_c = (rtb_OR_o && rtb_Compare_no && (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active)
               && (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && ((!rtb_y_h) ||
                ((!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active))) && ((!rtb_y_be) || (rtb_y_o <=
      A380PrimComputerFg_P.CompareToConstant2_const_e)));
    rtb_y_ch = rtb_OR_o;
    A380PrimComputerFg_MATLABFunction_h((A380PrimComputerFg_U.in.fg_mode_logic.selected_alt !=
      A380PrimComputerFg_DWork.DelayInput1_DSTATE_k), A380PrimComputerFg_U.in.data.time.dt, &rtb_Compare_no,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_d, A380PrimComputerFg_P.MTrigNode_retriggerable_m,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_m, &A380PrimComputerFg_DWork.sf_MATLABFunction_ed);
    if (rtb_altCstrOrFcu < 0.0) {
      y = -1;
    } else {
      y = (rtb_altCstrOrFcu > 0.0);
    }

    dPsi_1 = std::abs(rtb_altCstrOrFcu);
    rtb_Compare_no = (A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.alt_acq_armed && (!rtb_Compare_no) && ((dPsi_1 <
      80.0) && (y == 0)));
    rtb_Compare_o0 = true;
    rtb_y_p = (rtb_OR_o && rtb_Compare_no && ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >=
      A380PrimComputerFg_P.CompareToConstant_const_i) ||
                ((!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active))) &&
               (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active));
    A380PrimComputerFg_MATLABFunction(rtb_y_p, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_gx, A380PrimComputerFg_P.ConfirmNode_timeDelay_bi, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fb);
    A380PrimComputerFg_DWork.Memory_PreviousInput_l1 = A380PrimComputerFg_P.Logic_table_hk
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_ch))) + (static_cast<uint32_T>
          (rtb_y_p) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_l1];
    rtb_AND1_is = rtb_Compare_no;
    A380PrimComputerFg_MATLABFunction((dPsi_1 < A380PrimComputerFg_P.CompareToConstant_const_jk),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ne,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_f, &rtb_Compare_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_bc);
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active && rtb_Compare_o0 &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active));
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_l, A380PrimComputerFg_P.ConfirmNode_timeDelay_o, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_d0);
    A380PrimComputerFg_DWork.Memory_PreviousInput_e0 = A380PrimComputerFg_P.Logic_table_f
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_ch))) + (static_cast<uint32_T>
          (rtb_y_p) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_e0];
    rtb_y_ch = !A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active;
    A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.Logic_table_ib[(((static_cast<uint32_T>(std::
      abs(A380PrimComputerFg_U.in.data.adcn_inputs.fms.cruise_alt_ft) < A380PrimComputerFg_P.CompareToConstant1_const_p)
      << 1) + rtb_y_ch) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_j];
    rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1.SSM = rtb_Switch_b_SSM;
    rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1.Data = delta;
    rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond = rtb_Compare_o0;
    rtb_y_p = (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
               A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode3_isRisingEdge_f,
      &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_kl);
    rtb_Compare_no = (rtb_y_p && rtb_y_be);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active,
      A380PrimComputerFg_P.PulseNode4_isRisingEdge_k, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_nc);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel6_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode5_isRisingEdge_k, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g4);
    if (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active) {
      A380PrimComputerFg_B.u_l = rtb_altCstrOrFcu;
    }

    rtb_y_b = A380PrimComputerFg_U.in.fg_mode_logic.selected_alt;
    rtb_Compare_o0 = ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
                       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active) &&
                      (A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias1_Bias < 0.0) &&
                      rtb_OR_g && A380PrimComputerFg_DWork.Delay_DSTATE_m && A380PrimComputerFg_P.Constant_Value_h);
    rtb_y_h = true;
    rtb_y_p = (rtb_Compare_no || (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active && (rtb_y_ch ||
      rtb_y_p)) || (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active &&
                    ((A380PrimComputerFg_P.EnumeratedConstant_Value_a ==
                      A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) ||
                     (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                      A380PrimComputerFg_P.EnumeratedConstant1_Value_n) ||
                     (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                      A380PrimComputerFg_P.EnumeratedConstant2_Value) ||
                     ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) &&
                      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active) &&
                      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active)) ||
                     (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid))) ||
               (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active && (std::abs
      (A380PrimComputerFg_B.u_l - rtb_altCstrOrFcu) >= A380PrimComputerFg_P.CompareToConstant_const_n2)) ||
               ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active) &&
                (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt > A380PrimComputerFg_P.CompareToConstant1_const_hc))
               || ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
                    A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active) &&
                   (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt <
                    A380PrimComputerFg_P.CompareToConstant2_const_pq)) ||
               ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active) &&
                (A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + A380PrimComputerFg_P.Bias_Bias > 0.0) && rtb_OR_g &&
                A380PrimComputerFg_DWork.Delay_DSTATE_m && A380PrimComputerFg_P.Constant_Value_h) || rtb_Compare_o0 ||
               A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active);
    rtb_Compare_no = rtb_OR_o;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_m, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_pu, &rtb_Compare_o0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_av);
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode1_isRisingEdge_c, &rtb_y_h,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_hp);
    rtb_Compare_g = !A380PrimComputerFg_DWork.Delay_DSTATE.any_longitudinal_mode_engaged;
    rtb_y_ch = ((!A380PrimComputerFg_U.in.general_logic.on_ground) && rtb_y_h && rtb_Compare_g);
    A380PrimComputerFg_MATLABFunction(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bx,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_e, &rtb_Compare_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_fy);
    rtb_y_ch = (rtb_OR_o && ((rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s && rtb_Compare_o0 &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_y_ch || (rtb_Compare_g &&
      (!A380PrimComputerFg_DWork.Delay_DSTATE.any_longitudinal_mode_engaged)) || rtb_y_p));
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_co, A380PrimComputerFg_P.ConfirmNode_timeDelay_ol, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oyv);
    A380PrimComputerFg_DWork.Memory_PreviousInput_og = A380PrimComputerFg_P.Logic_table_bw
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_no))) +
         (static_cast<uint32_T>(rtb_y_ch) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_og];
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reversion_vs = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_l, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_h, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cm);
    rtb_y_o2 = (A380PrimComputerFg_U.in.general_logic.on_ground ||
                A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active);
    rtb_y_h = (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
               A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.nav_armed);
    rtb_Compare_o0 = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft !=
                       A380PrimComputerFg_P.CompareToConstant_const_c) &&
                      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft <
                       A380PrimComputerFg_U.in.fg_mode_logic.selected_alt) &&
                      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft <
                        A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft) ||
                       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft ==
                        A380PrimComputerFg_P.CompareToConstant1_const_cg)) && rtb_y_h &&
                      ((!A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged) ||
                       A380PrimComputerFg_DWork.Memory_PreviousInput_oc));
    rtb_Logic_g4_idx_0_tmp = !rtb_AND_k1;
    A380PrimComputerFg_DWork.Memory_PreviousInput_oy = A380PrimComputerFg_P.Logic_table_nb[((((rtb_y_o2 &&
      (!rtb_Compare_o0)) || (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active) && rtb_Logic_g4_idx_0_tmp) ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active) ||
      (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt < 0.0F) ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) && (rtb_Logic_g4_idx_0_tmp ||
      (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) ||
      (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid))) ||
      ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
        A380PrimComputerFg_P.EnumeratedConstant3_Value) ||
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
        A380PrimComputerFg_P.EnumeratedConstant4_Value)) || rtb_Compare_l1) + (static_cast<uint32_T>(rtb_OR_o &&
      (((!A380PrimComputerFg_U.in.general_logic.on_ground) &&
        ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
          A380PrimComputerFg_P.EnumeratedConstant1_Value_e) &&
         (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
          A380PrimComputerFg_P.EnumeratedConstant2_Value_g)) &&
        A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active &&
        (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt > 0.0F) &&
        A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
        (((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
           A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) && rtb_AND_k1) || (rtb_y_be &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) && (rtb_AND_k1 && (dPsi_1 <=
      A380PrimComputerFg_P.CompareToConstant2_const_m))))) || (rtb_y_o2 && rtb_Compare_o0))) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_oy];
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft < 0.0),
      A380PrimComputerFg_P.PulseNode_isRisingEdge_j, &rtb_y_h, &A380PrimComputerFg_DWork.sf_MATLABFunction_os);
    rtb_Compare_g = (A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.clb_armed && (rtb_y_h ||
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft != A380PrimComputerFg_DWork.DelayInput1_DSTATE)));
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel3_bit_d, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_ag, &rtb_AND10_j,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_kv);
    rtb_y_h = (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
               A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active);
    rtb_y_be = (rtb_Logic_g4_idx_0_tmp || (dPsi_1 > A380PrimComputerFg_P.CompareToConstant2_const_a));
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible &&
                rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s &&
                ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active)) &&
                A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active &&
                A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
                (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt > 0.0F) &&
                ((A380PrimComputerFg_P.EnumeratedConstant_Value_m1 !=
                  A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
                 (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                  A380PrimComputerFg_P.EnumeratedConstant1_Value_k)) && (rtb_Compare_g || (rtb_AND10_j && ((!rtb_y_h) ||
      (rtb_y_h && (!A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.clb_armed) && rtb_y_be)))));
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_a, A380PrimComputerFg_P.ConfirmNode_timeDelay_g5, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_je);
    A380PrimComputerFg_DWork.Memory_PreviousInput_jh = A380PrimComputerFg_P.Logic_table_fi
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_ch))) + (static_cast<uint32_T>
          (rtb_y_p) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_jh];
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_a, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_bi, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cn);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ei = A380PrimComputerFg_P.Logic_table_mh5
      [(((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
          A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
          (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt > 0.0F) ||
          ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) &&
           (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active) &&
           (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active)) ||
          ((A380PrimComputerFg_P.EnumeratedConstant3_Value_g ==
            A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) ||
           (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
            A380PrimComputerFg_P.EnumeratedConstant5_Value) ||
           (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
            A380PrimComputerFg_P.EnumeratedConstant4_Value_m)) ||
          (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid) ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) && rtb_Logic_g4_idx_0_tmp) ||
          rtb_Compare_l1) + (static_cast<uint32_T>(rtb_OR_o &&
           ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
             A380PrimComputerFg_P.EnumeratedConstant1_Value_o) &&
            (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
             A380PrimComputerFg_P.EnumeratedConstant2_Value_l) && (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt <
             0.0F) && (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
                       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active) &&
            A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
            (((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
               A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) && rtb_AND_k1) || (rtb_y_be &&
              (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
               A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active) && (rtb_AND_k1 && (dPsi_1 <=
                A380PrimComputerFg_P.CompareToConstant2_const_k)))))) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_ei];
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel3_bit_b, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_kp, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_isd);
    rtb_y_p = (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
               A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active);
    rtb_y_be = !A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.des_armed;
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible &&
                rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s &&
                ((!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active) &&
                 (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active)) &&
                (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                 A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active) &&
                A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid &&
                (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt < 0.0F) &&
                ((A380PrimComputerFg_P.EnumeratedConstant_Value_e !=
                  A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) &&
                 (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                  A380PrimComputerFg_P.EnumeratedConstant1_Value_b) &&
                 (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                  A380PrimComputerFg_P.EnumeratedConstant2_Value_e)) &&
                ((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.des_armed &&
                  (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft !=
                   A380PrimComputerFg_DWork.DelayInput1_DSTATE_j)) || (rtb_y_ch && ((!rtb_y_p) || (rtb_y_p && rtb_y_be &&
      (rtb_Logic_g4_idx_0_tmp || (dPsi_1 > A380PrimComputerFg_P.CompareToConstant2_const_nt)))))));
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_lt, A380PrimComputerFg_P.ConfirmNode_timeDelay_iw, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oa);
    A380PrimComputerFg_DWork.Memory_PreviousInput_kj = A380PrimComputerFg_P.Logic_table_kk
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_ch))) + (static_cast<uint32_T>
          (rtb_y_p) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_kj];
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_rtZbase_arinc_429,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue_b, &rtb_y_b);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_o, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_c, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_eow);
    rtb_y_p = !A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid;
    rtb_Compare_g = (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                     A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active);
    A380PrimComputerFg_MATLABFunction((A380PrimComputerFg_DWork.Delay_DSTATE.manual_spd_control_active && rtb_Compare_g),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_gw,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_mw, &rtb_Compare_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_bi);
    rtb_Compare_o0 = ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active &&
                       ((A380PrimComputerFg_P.EnumeratedConstant_Value_p ==
                         A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase) ||
                        (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                         A380PrimComputerFg_P.EnumeratedConstant1_Value_p) ||
                        (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) || rtb_y_p)) || rtb_Compare_g);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft < 0.0),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_bm, &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_oy);
    rtb_y_h = ((!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.nav_active) ||
               (!A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid));
    rtb_Compare_g = (rtb_y_be || rtb_Compare_o0 || (rtb_y_p &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft !=
       A380PrimComputerFg_P.CompareToConstant_const_jg) && rtb_y_h));
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible &&
                rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) &&
                (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt > rtb_y_b) && rtb_Compare_g);
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_p2, A380PrimComputerFg_P.ConfirmNode_timeDelay_js, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_f3);
    A380PrimComputerFg_DWork.Memory_PreviousInput_kc = A380PrimComputerFg_P.Logic_table_on
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_ch))) + (static_cast<uint32_T>
          (rtb_y_p) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_kc];
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reversion_op_clb =
      (A380PrimComputerFg_DWork.Memory_PreviousInput_kc && rtb_Compare_o0);
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusAssignment_ps_fg_logic_chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel4_bit_b, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_nb, &rtb_Compare_o0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_h4);
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible &&
                rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s &&
                (!A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) &&
                (A380PrimComputerFg_U.in.fg_mode_logic.selected_alt < 0.0F) && rtb_Compare_o0);
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_f5, A380PrimComputerFg_P.ConfirmNode_timeDelay_dt, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oz);
    A380PrimComputerFg_DWork.Memory_PreviousInput_i3 = A380PrimComputerFg_P.Logic_table_ig
      [(((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
          ((A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_ch))) + (static_cast<uint32_T>
          (rtb_y_p) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_i3];
    rtb_BusAssignment_i0_fg_logic_ils_computation_data_glideslope_deviation_deg.SSM =
      rtb_Switch_glideslope_deviation_deg_SSM;
    rtb_BusAssignment_i0_fg_logic_ils_computation_data_glideslope_deviation_deg.Data =
      rtb_Switch_glideslope_deviation_deg_Data;
    rtb_y_ch = rtb_OR_o;
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed ||
      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active), A380PrimComputerFg_P.PulseNode1_isRisingEdge_ds,
      &rtb_Compare_o0, &A380PrimComputerFg_DWork.sf_MATLABFunction_oh);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.land_armed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_ll, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_cd0);
    A380PrimComputerFg_DWork.Memory_PreviousInput_il = A380PrimComputerFg_P.Logic_table_f5[(((static_cast<uint32_T>
      (rtb_OR_o && (rtb_Compare_o0 && (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active) &&
                    (!A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active))) << 1) + (rtb_y_ch ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_il];
    rtb_Compare_no = (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                      A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    A380PrimComputerFg_MATLABFunction_g(&rtb_BusAssignment_i0_fg_logic_ils_computation_data_glideslope_deviation_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_f, &rtb_y_b);
    if ((!A380PrimComputerFg_DWork.pY_not_empty) || (!A380PrimComputerFg_DWork.pU_not_empty)) {
      A380PrimComputerFg_DWork.pU = rtb_y_b;
      A380PrimComputerFg_DWork.pU_not_empty = true;
      A380PrimComputerFg_DWork.pY = rtb_y_b;
      A380PrimComputerFg_DWork.pY_not_empty = true;
    }

    dPsi_1 = A380PrimComputerFg_U.in.data.time.dt * A380PrimComputerFg_P.LagFilter_C1 + 2.0;
    dPsi_2 = A380PrimComputerFg_U.in.data.time.dt * A380PrimComputerFg_P.LagFilter_C1 / dPsi_1;
    A380PrimComputerFg_DWork.pY = static_cast<real32_T>((2.0 - A380PrimComputerFg_U.in.data.time.dt *
      A380PrimComputerFg_P.LagFilter_C1) / dPsi_1) * A380PrimComputerFg_DWork.pY + (rtb_y_b * static_cast<real32_T>
      (dPsi_2) + A380PrimComputerFg_DWork.pU * static_cast<real32_T>(dPsi_2));
    A380PrimComputerFg_DWork.pU = rtb_y_b;
    if (rtb_y_b < 0.0F) {
      dPsi_2 = -rtb_y_b;
    } else {
      dPsi_2 = rtb_y_b;
    }

    A380PrimComputerFg_MATLABFunction_nn(&rtb_BusAssignment_i0_fg_logic_ils_computation_data_glideslope_deviation_deg,
      &rtb_Compare_o0);
    rtb_y_ch = (rtb_OR_o && A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes.glide_armed && rtb_Compare_no &&
                (((A380PrimComputerFg_DWork.pY < A380PrimComputerFg_DWork.DelayInput1_DSTATE_f) && (dPsi_2 <
      A380PrimComputerFg_P.CompareToConstant1_const_a)) || (dPsi_2 < A380PrimComputerFg_P.CompareToConstant2_const_c)) &&
                rtb_Compare_o0);
    rtb_y_p = rtb_y_ch;
    A380PrimComputerFg_MATLABFunction(rtb_y_ch, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_i, A380PrimComputerFg_P.ConfirmNode_timeDelay_mc, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_l1);
    A380PrimComputerFg_DWork.Memory_PreviousInput_lp = A380PrimComputerFg_P.Logic_table_or[(((((!rtb_y_ch) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) ||
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset) + (static_cast<uint32_T>(rtb_y_p) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_lp];
    rtb_y_ch = rtb_OR_o;
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Memory_PreviousInput_lp,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_pb,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_dm, &rtb_Compare_no, &A380PrimComputerFg_DWork.sf_MATLABFunction_l0a);
    A380PrimComputerFg_MATLABFunction_g(&rtb_BusAssignment_i0_fg_logic_ils_computation_data_glideslope_deviation_deg,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_j, &rtb_y_b);
    if (rtb_y_b < 0.0F) {
      dPsi_1 = -rtb_y_b;
    } else {
      dPsi_1 = rtb_y_b;
    }

    rtb_y_p = (rtb_OR_o && rtb_Compare_no && (dPsi_1 < A380PrimComputerFg_P.CompareToConstant2_const_p));
    A380PrimComputerFg_MATLABFunction(rtb_y_p, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_ab, A380PrimComputerFg_P.ConfirmNode_timeDelay_fa, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ob);
    A380PrimComputerFg_DWork.Memory_PreviousInput_ae = A380PrimComputerFg_P.Logic_table_d2[(((((!rtb_y_ch) &&
      (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
       A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) ||
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset) + (static_cast<uint32_T>(rtb_y_p) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_ae];
    A380PrimComputerFg_DWork.Memory_PreviousInput_ik =
      A380PrimComputerFg_P.Logic_table_kr[A380PrimComputerFg_DWork.Memory_PreviousInput_ik + 2U];
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode1_isRisingEdge_n, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_hw);
    rtb_y_ch = false;
    A380PrimComputerFg_MATLABFunction(false, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_bz, A380PrimComputerFg_P.ConfirmNode_timeDelay_l, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pw);
    A380PrimComputerFg_DWork.Memory_PreviousInput_kx = A380PrimComputerFg_P.Logic_table_l[(static_cast<uint32_T>
      ((rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset ||
        (A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.app_des_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
         A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active)) && (!rtb_y_ch)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_kx];
    if (A380PrimComputerFg_P.EnumeratedConstant_Value_o != A380PrimComputerFg_DWork.Delay_DSTATE.active_tcas_submode) {
      A380PrimComputerFg_B.u_ly = rtb_altCstrOrFcu;
    }

    A380PrimComputerFg_DWork.Memory_PreviousInput_b = A380PrimComputerFg_P.Logic_table_azy[(((static_cast<uint32_T>
      (rtb_AND1_is) << 1) + 1U) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_b];
    rtb_Compare_no = ((A380PrimComputerFg_P.EnumeratedConstant1_Value_bl ==
                       A380PrimComputerFg_DWork.Delay_DSTATE.active_tcas_submode) &&
                      rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond);
    A380PrimComputerFg_DWork.Memory_PreviousInput_pt = A380PrimComputerFg_P.Logic_table_cp[(((static_cast<uint32_T>
      (rtb_Compare_no) << 1) + 1U) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_pt];
    A380PrimComputerFg_MATLABFunction(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_c,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_m, &rtb_Compare_no, &A380PrimComputerFg_DWork.sf_MATLABFunction_gg);
    A380PrimComputerFg_MATLABFunction_c(rtb_Compare_no, A380PrimComputerFg_P.PulseNode3_isRisingEdge_h, &rtb_y_h,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_j2);
    rtb_y_ch = rtb_Compare_l1;
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode2_isRisingEdge_o, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_oks);
    rtb_y_ch = (rtb_y_ch && rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
      A380PrimComputerFg_P.CompareToConstant1_const_cm), A380PrimComputerFg_P.PulseNode4_isRisingEdge_i, &rtb_Compare_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_er);
    rtb_y_o2 = !A380PrimComputerFg_U.in.general_logic.on_ground;
    rtb_y_be = !A380PrimComputerFg_DWork.Memory_PreviousInput_at;
    rtb_AND10_j = !A380PrimComputerFg_DWork.Memory_PreviousInput_nb;
    rtb_y_p = (rtb_AND10_j && rtb_y_be && (!A380PrimComputerFg_DWork.Memory_PreviousInput_lp) &&
               (!A380PrimComputerFg_DWork.Memory_PreviousInput_ae) && (!A380PrimComputerFg_DWork.Memory_PreviousInput_e));
    rtb_Compare_no = (rtb_Compare_g && rtb_y_o2 && rtb_y_p);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Memory_PreviousInput_kx,
      A380PrimComputerFg_P.PulseNode7_isRisingEdge_g, &rtb_y_o2, &A380PrimComputerFg_DWork.sf_MATLABFunction_jf);
    rtb_y_p = ((A380PrimComputerFg_DWork.Delay_DSTATE_p && (!A380PrimComputerFg_U.in.general_logic.on_ground)) ||
               ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
                 A380PrimComputerFg_P.CompareToConstant_const_mv) && rtb_y_h && rtb_y_p) || (rtb_Compare_l1 &&
                (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
                 A380PrimComputerFg_P.EnumeratedConstant_Value_gt)) || rtb_y_ch ||
               A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate || rtb_Compare_no || rtb_y_o2);
    rtb_y_h = rtb_y_p;
    A380PrimComputerFg_MATLABFunction(rtb_y_p, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_fi, A380PrimComputerFg_P.ConfirmNode_timeDelay_e4, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lq);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode6_isRisingEdge_i, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_kdl);
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode5_isRisingEdge_a, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_nv);
    A380PrimComputerFg_DWork.Memory_PreviousInput_od = A380PrimComputerFg_P.Logic_table_g
      [((((A380PrimComputerFg_DWork.Delay_DSTATE.auto_spd_control_active && (!rtb_y_p)) ||
          (A380PrimComputerFg_U.in.general_logic.on_ground && (rtb_y_ch || rtb_Compare_no))) + (static_cast<uint32_T>
          (rtb_y_h) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_od];
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode1_isRisingEdge_j, &rtb_y_o2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_dm);
    rtb_y_p = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts != A380PrimComputerFg_P.CompareToConstant_const_d);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_aw, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_oc);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_p, A380PrimComputerFg_P.PulseNode2_isRisingEdge_j, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lwx);
    rtb_Compare_no = (rtb_OR2 && rtb_Compare_no);
    rtb_y_ch = (A380PrimComputerFg_U.in.general_logic.on_ground && ((rtb_y_o2 && rtb_y_p) || (rtb_y_ch && rtb_y_p &&
      rtb_OR2) || rtb_Compare_no));
    rtb_y_h = (A380PrimComputerFg_DWork.Memory_PreviousInput_at || A380PrimComputerFg_DWork.Memory_PreviousInput_nb);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_h, A380PrimComputerFg_P.PulseNode3_isRisingEdge_g, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_kq);
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode_isRisingEdge_kh, &rtb_y_o2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ef);
    rtb_y_p = (rtb_Compare_no || rtb_y_o2);
    rtb_Compare_no = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts !=
                      A380PrimComputerFg_P.CompareToConstant3_const_g);
    rtb_y_p = ((rtb_y_ch || rtb_y_p) && ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts !=
      A380PrimComputerFg_P.CompareToConstant2_const_j) || rtb_Compare_no));
    rtb_y_ch = rtb_y_p;
    A380PrimComputerFg_MATLABFunction(rtb_y_p, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_jb, A380PrimComputerFg_P.ConfirmNode_timeDelay_as, &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fk);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
      A380PrimComputerFg_P.CompareToConstant4_const), A380PrimComputerFg_P.PulseNode6_isRisingEdge_m, &rtb_y_o2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_jo);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts ==
      A380PrimComputerFg_P.CompareToConstant5_const_a), A380PrimComputerFg_P.PulseNode7_isRisingEdge_i, &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_n11);
    rtb_Compare_no = (rtb_y_o2 || rtb_Compare_no);
    A380PrimComputerFg_DWork.Memory_PreviousInput_hx = A380PrimComputerFg_P.Logic_table_iv
      [((((A380PrimComputerFg_DWork.Delay_DSTATE.manual_spd_control_active && (!rtb_y_p)) ||
          (A380PrimComputerFg_U.in.general_logic.on_ground && (rtb_y_be && rtb_AND10_j &&
            (!A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_tune_inhibit)) && rtb_Compare_no)) +
         (static_cast<uint32_T>(rtb_y_ch) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_hx];
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_2.SSM = rtb_Switch2_j_SSM;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_2.Data = rtb_Switch2_j_Data;
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Memory_PreviousInput_od,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_jn, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_bb);
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_e, &rtb_y_b);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_b, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field);
    if (!A380PrimComputerFg_DWork.eventTime_not_empty) {
      A380PrimComputerFg_DWork.eventTime = A380PrimComputerFg_U.in.data.time.simulation_time;
      A380PrimComputerFg_DWork.eventTime_not_empty = true;
    }

    if (rtb_y_ch) {
      A380PrimComputerFg_DWork.eventTime = (A380PrimComputerFg_U.in.data.time.simulation_time - 10.0) - 1.0;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_od || (rtb_value_d !=
                A380PrimComputerFg_P.CompareToConstant_const_l)) {
      A380PrimComputerFg_DWork.eventTime = A380PrimComputerFg_U.in.data.time.simulation_time;
    }

    rtb_AND10_j = (A380PrimComputerFg_U.in.data.time.simulation_time - A380PrimComputerFg_DWork.eventTime > 10.0);
    if (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate) {
      if (A380PrimComputerFg_DWork.Delay_DSTATE_h) {
        dPsi_2 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_mach;
      } else {
        dPsi_2 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_kts;
      }
    } else {
      dPsi_2 = A380PrimComputerFg_P.Constant_Value_f;
    }

    if (!A380PrimComputerFg_DWork.pValue_not_empty_n) {
      A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_P.Constant_Value_e;
      A380PrimComputerFg_DWork.pValue_not_empty_n = true;
    }

    if (!A380PrimComputerFg_DWork.prevMachActive_not_empty) {
      A380PrimComputerFg_DWork.prevMachActive = A380PrimComputerFg_DWork.Delay_DSTATE_h;
      A380PrimComputerFg_DWork.prevMachActive_not_empty = true;
    }

    if (A380PrimComputerFg_DWork.prevMachActive != A380PrimComputerFg_DWork.Delay_DSTATE_h) {
      A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_P.Constant_Value_e;
    }

    if (rtb_AND10_j) {
      A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_P.Constant_Value_e;
    }

    if (static_cast<real32_T>(dPsi_2) > 0.0F) {
      A380PrimComputerFg_DWork.pValue_e = static_cast<real32_T>(dPsi_2);
    }

    if (A380PrimComputerFg_DWork.Delay_DSTATE_h) {
      A380PrimComputerFg_DWork.pValue_e += static_cast<real32_T>(rtb_value_d) * 0.01F;
      A380PrimComputerFg_DWork.pValue_e = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_e, 0.99F), 0.1F);
      A380PrimComputerFg_DWork.pValue_e = std::round(A380PrimComputerFg_DWork.pValue_e / 0.01F) * 0.01F;
    } else {
      A380PrimComputerFg_DWork.pValue_e += static_cast<real32_T>(rtb_value_d);
      A380PrimComputerFg_DWork.pValue_e = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_e, 399.0F), 100.0F);
      A380PrimComputerFg_DWork.pValue_e = std::round(A380PrimComputerFg_DWork.pValue_e);
    }

    A380PrimComputerFg_DWork.prevMachActive = A380PrimComputerFg_DWork.Delay_DSTATE_h;
    A380PrimComputerFg_B.BusAssignment_es.data = A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusAssignment_es.general_logic = A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusAssignment_es.flight_envelope = A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusAssignment_es.laws = A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusAssignment_es.fctl_logic = A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.gnd_eng_stop_flt_5s = rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ap_fd_common_condition =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ap_fd_common_condition;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.fd_1_engaged = A380PrimComputerFg_DWork.Delay_DSTATE_a;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.fd_2_engaged = A380PrimComputerFg_DWork.Delay_DSTATE_a;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ap_1_engaged = A380PrimComputerFg_DWork.Delay_DSTATE_b;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ap_2_engaged = A380PrimComputerFg_DWork.DelayOneStep_DSTATE;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.athr_engaged = A380PrimComputerFg_DWork.Delay_DSTATE_m;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.fd_1_inop = false;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.fd_2_inop = false;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.athr_inop = rtb_OR4_b;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.fmgc_opp_priority =
      A380PrimComputerFg_U.in.fg_logic.fmgc_opp_priority;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.altitude_indicated_ft =
      A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.all_fcu_failure =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.all_fcu_failure;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.fcu_1_chosen = rtb_BusAssignment_a_fg_logic_fcu_1_chosen;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.fcu_2_chosen = rtb_AND2;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_1.SSM = rtb_Switch_b_SSM;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_1.Data = delta;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_failure =
      A380PrimComputerFg_B.BusAssignment_i.fg_logic.ils_failure;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.both_ils_valid = rtb_y_b3a;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.runway_heading_deg.SSM =
      rtb_Switch_runway_heading_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.runway_heading_deg.Data =
      rtb_Switch_runway_heading_deg_Data;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.ils_frequency_mhz.SSM =
      rtb_Switch_ils_frequency_mhz_SSM;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.ils_frequency_mhz.Data =
      rtb_Switch_ils_frequency_mhz_Data;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.localizer_deviation_deg.SSM =
      rtb_Switch_localizer_deviation_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.localizer_deviation_deg.Data =
      rtb_BusAssignment_ie_fg_logic_ils_computation_data_localizer_deviation_deg.Data;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM =
      rtb_Switch_glideslope_deviation_deg_SSM;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_computation_data.glideslope_deviation_deg.Data =
      rtb_Switch_glideslope_deviation_deg_Data;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.rwy_hdg_memo = A380PrimComputerFg_B.u_lyj;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.tcas_failure = false;
    A380PrimComputerFg_B.BusAssignment_es.fg_logic.tcas_mode_available = false;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.rwy_active =
      (A380PrimComputerFg_DWork.Memory_PreviousInput_oc || A380PrimComputerFg_DWork.Memory_PreviousInput_h);
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.nav_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_eu;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.loc_cpt_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_f;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.loc_trk_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ox;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.roll_goaround_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_p;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.hdg_active = rtb_y_j;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.trk_active = rtb_y_j3;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.rwy_loc_submode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_oc;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.rwy_trk_submode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_h;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.land_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_e;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.align_submode_active =
      (A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes.land_active &&
       (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <= A380PrimComputerFg_P.CompareToConstant1_const_c));
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.rollout_submode_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_en;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.clb_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_jh;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.des_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_kj;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.op_clb_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_kc;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.op_des_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_i3;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.pitch_takeoff_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_nb;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.pitch_goaround_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_at;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.vs_active =
      ((!A380PrimComputerFg_DWork.p_trk_fpa_active) && A380PrimComputerFg_DWork.Memory_PreviousInput_og);
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.fpa_active =
      (A380PrimComputerFg_DWork.Memory_PreviousInput_og && A380PrimComputerFg_DWork.p_trk_fpa_active);
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.alt_acq_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_l1;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.alt_hold_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_e0;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.fma_dash_display =
      (A380PrimComputerFg_DWork.Memory_PreviousInput_e0 && rtb_Logic_g4_idx_0_tmp &&
       A380PrimComputerFg_DWork.Memory_PreviousInput_j);
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.gs_capt_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_lp;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.gs_trk_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ae;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.app_des_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_l5;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.flare_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_d;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.cruise_active =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.cruise_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.tcas_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_kx;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.alt_acq_armed = (rtb_y_c && rtb_OR2 &&
      A380PrimComputerFg_DWork.Memory_PreviousInput_ek);
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.alt_acq_arm_possible =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ek;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.nav_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_o4;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.loc_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_k;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.rwy_armed =
      A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.rwy_armed;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.land_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ov;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.glide_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_il;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.app_des_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_a;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.clb_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_oy;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.des_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ei;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.op_clb_armed =
      A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.op_clb_armed;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes.tcas_armed =
      A380PrimComputerFg_DWork.Memory_PreviousInput_ik;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_lateral_law =
      A380PrimComputerFg_U.in.fg_mode_logic.active_lateral_law;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_longitudinal_law =
      A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.auto_spd_control_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_hx;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.manual_spd_control_active =
      A380PrimComputerFg_DWork.Memory_PreviousInput_od;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.mach_control_active = A380PrimComputerFg_DWork.Delay_DSTATE_h;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.athr_active = A380PrimComputerFg_U.in.fg_mode_logic.athr_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.athr_limited =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_limited;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.alpha_floor_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.alpha_floor_mode_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.thrust_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.thrust_mode_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.thrust_target_idle =
      A380PrimComputerFg_U.in.fg_mode_logic.thrust_target_idle;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.speed_mach_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.speed_mach_mode_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.retard_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.retard_mode_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.athr_fma_mode =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_mode;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.athr_fma_message =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_message;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.spd_target_kts =
      A380PrimComputerFg_U.in.fg_mode_logic.spd_target_kts;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.pfd_spd_target_kts =
      A380PrimComputerFg_U.in.fg_mode_logic.pfd_spd_target_kts;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.alt_cstr_applicable = rtb_AND_k1;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.alt_sel_or_cstr = rtb_altCstrOrFcu;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.mode_sync_active = rtb_AND4;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.any_ap_fd_engaged = rtb_OR2;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.any_lateral_mode_engaged =
      A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.any_longitudinal_mode_engaged =
      A380PrimComputerFg_U.in.fg_mode_logic.any_longitudinal_mode_engaged;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_mode_reset =
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reset =
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.hdg_trk_preset_available =
      A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.alt_soft_mode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.alt_soft_mode_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.fd_auto_disengage =
      A380PrimComputerFg_U.in.fg_mode_logic.fd_auto_disengage;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.ap_fd_mode_reversion =
      A380PrimComputerFg_U.in.fg_mode_logic.ap_fd_mode_reversion;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.pitch_fd_bars_flashing =
      A380PrimComputerFg_U.in.fg_mode_logic.pitch_fd_bars_flashing;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.roll_fd_bars_flashing =
      A380PrimComputerFg_U.in.fg_mode_logic.roll_fd_bars_flashing;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.loc_bc_selection =
      A380PrimComputerFg_U.in.fg_mode_logic.loc_bc_selection;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.vs_target_not_held =
      A380PrimComputerFg_U.in.fg_mode_logic.vs_target_not_held;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tcas_vs_target = 0.0;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tcas_ra_corrective = false;
    if (A380PrimComputerFg_DWork.Memory_PreviousInput_b) {
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_tcas_submode = tcas_submode::ALT_ACQ;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_pt) {
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_tcas_submode = tcas_submode::ALT_HOLD;
    } else {
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_tcas_submode = tcas_submode::VS;
    }

    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tcas_alt_acq_cond = rtb_AND1_is;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tcas_alt_hold_cond =
      rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.land_2_capability =
      A380PrimComputerFg_U.in.fg_mode_logic.land_2_capability;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.land_3_fail_passive_capability =
      A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_capability;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.land_3_fail_op_capability =
      A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_capability;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.land_2_inop = A380PrimComputerFg_U.in.fg_mode_logic.land_2_inop;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.land_3_fail_passive_inop =
      A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_inop;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.land_3_fail_op_inop =
      A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_inop;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tla_to_ga_set = false;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.true_active = A380PrimComputerFg_DWork.p_true_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.trk_fpa_active = A380PrimComputerFg_DWork.p_trk_fpa_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.metric_alt_active = A380PrimComputerFg_DWork.p_metric_alt_active;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.selected_hdg_trk =
      A380PrimComputerFg_U.in.fg_mode_logic.selected_hdg_trk;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.hdg_trk_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_dashes;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.selected_alt =
      A380PrimComputerFg_U.in.fg_mode_logic.selected_alt;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.selected_vs_fpa =
      A380PrimComputerFg_U.in.fg_mode_logic.selected_vs_fpa;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.vs_fpa_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.vs_fpa_dashes;
    A380PrimComputerFg_B.BusAssignment_es.fg_laws = A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusAssignment_es.discrete_outputs = A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusAssignment_es.analog_outputs = A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusAssignment_es.bus_outputs = A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.selected_spd_mach = A380PrimComputerFg_DWork.pValue_e;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.spd_mach_dashes = rtb_AND10_j;
    rtb_y_p = (rtb_y_j || rtb_y_j3);
    rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s = !rtb_y_p;
    A380PrimComputerFg_MATLABFunction_c((rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s && rtb_OR2),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_o, &rtb_Compare_no, &A380PrimComputerFg_DWork.sf_MATLABFunction_cbh);
    rtb_y_ch = rtb_Compare_l1;
    A380PrimComputerFg_MATLABFunction_c((rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s &&
      (!A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available) && (!rtb_Compare_l1)),
      A380PrimComputerFg_P.PulseNode_isRisingEdge_ln, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_ckt);
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_p, &rtb_y_b);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_b, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_h);
    A380PrimComputerFg_MATLABFunction1(&A380PrimComputerFg_B.BusAssignment_es, (rtb_Compare_no || rtb_y_ch), (rtb_y_p ||
      rtb_Compare_l1 || (rtb_value_d != A380PrimComputerFg_P.CompareToConstant_const_mo) ||
      A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available), &rtb_y_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction1_o);
    if (!A380PrimComputerFg_DWork.pValue_not_empty_a) {
      A380PrimComputerFg_DWork.pValue_i = A380PrimComputerFg_P.Constant_Value_c;
      A380PrimComputerFg_DWork.pValue_not_empty_a = true;
    }

    if (rtb_y_p) {
      A380PrimComputerFg_DWork.pValue_i = A380PrimComputerFg_P.Constant_Value_c;
      A380PrimComputerFg_DWork.pValue_i = std::round(A380PrimComputerFg_DWork.pValue_i);
    }

    A380PrimComputerFg_DWork.pValue_i += static_cast<real32_T>(rtb_value_d);
    A380PrimComputerFg_DWork.pValue_i = std::round(A380PrimComputerFg_DWork.pValue_i);
    if (A380PrimComputerFg_DWork.pValue_i > 359.0F) {
      A380PrimComputerFg_DWork.pValue_i -= 360.0F;
    } else if (A380PrimComputerFg_DWork.pValue_i < 0.0F) {
      A380PrimComputerFg_DWork.pValue_i += 360.0F;
    }

    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.selected_hdg_trk = A380PrimComputerFg_DWork.pValue_i;
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.hdg_trk_dashes = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_jj, &rtb_y_b);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_b, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_n);
    if (rtb_BusAssignment_a_fg_logic_fcu_1_chosen) {
      rtb_Switch1_l = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1;
    } else {
      rtb_Switch1_l = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1;
    }

    A380PrimComputerFg_MATLABFunction_cr(&rtb_Switch1_l, A380PrimComputerFg_P.BitfromLabel3_bit_o, &rtb_y);
    y = (rtb_y != 0U) * 900;
    if (!A380PrimComputerFg_DWork.pValue_not_empty_j) {
      A380PrimComputerFg_DWork.pValue_p = std::round(A380PrimComputerFg_P.Constant1_Value / static_cast<real32_T>(y +
        100)) * (static_cast<real32_T>(y) + 100.0F);
      A380PrimComputerFg_DWork.pValue_not_empty_j = true;
    }

    if (A380PrimComputerFg_P.Constant_Value_cg != -1.0F) {
      A380PrimComputerFg_DWork.pValue_p = A380PrimComputerFg_P.Constant_Value_cg;
    }

    if ((A380PrimComputerFg_P.Constant_Value_cg != -1.0F) || (rtb_value_d != 0)) {
      A380PrimComputerFg_DWork.pValue_p = std::round(((static_cast<real32_T>(y + 100) / 2.0F + 1.0F) *
        static_cast<real32_T>(rtb_value_d) + A380PrimComputerFg_DWork.pValue_p) / static_cast<real32_T>(y + 100)) * (
        static_cast<real32_T>(y) + 100.0F);
    }

    A380PrimComputerFg_DWork.pValue_p = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_p, 49000.0F), 100.0F);
    A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.selected_alt = A380PrimComputerFg_DWork.pValue_p;
    rtb_BusAssignment_a_fg_logic_fcu_1_chosen =
      (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.vs_active ||
       A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.fpa_active);
    rtb_y_p = rtb_BusAssignment_a_fg_logic_fcu_1_chosen;
    A380PrimComputerFg_MATLABFunction_c(((!rtb_BusAssignment_a_fg_logic_fcu_1_chosen) && rtb_OR2),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_l, &rtb_y_o2, &A380PrimComputerFg_DWork.sf_MATLABFunction_hq);
    rtb_y_ch = rtb_Compare_l1;
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_2,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_n, &rtb_y_b);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_b, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_e);
    rtb_Compare_no = (rtb_value_d != A380PrimComputerFg_P.CompareToConstant_const_mw);
    A380PrimComputerFg_MATLABFunction1(&A380PrimComputerFg_B.BusAssignment_es, rtb_y_o2,
      (rtb_BusAssignment_a_fg_logic_fcu_1_chosen || rtb_Compare_l1 || rtb_Compare_no), &rtb_Compare_no,
      &A380PrimComputerFg_DWork.sf_MATLABFunction1_d);
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_DWork.Memory_PreviousInput_kx,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_y_ch, A380PrimComputerFg_P.MTrigNode1_isRisingEdge_m,
      A380PrimComputerFg_P.MTrigNode1_retriggerable_o, A380PrimComputerFg_P.MTrigNode1_triggerDuration_f,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lis);
    A380PrimComputerFg_MATLABFunction_c((rtb_BusAssignment_a_fg_logic_fcu_1_chosen && rtb_y_ch),
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_l, &rtb_y_p, &A380PrimComputerFg_DWork.sf_MATLABFunction_gw);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_oe, A380PrimComputerFg_P.PulseNode_isRisingEdge_d, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_fhn);
    if (!A380PrimComputerFg_DWork.pValue_not_empty) {
      A380PrimComputerFg_DWork.pValue = A380PrimComputerFg_P.Constant_Value_cu;
      A380PrimComputerFg_DWork.pValue_not_empty = true;
    }

    if (!A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty) {
      A380PrimComputerFg_DWork.prevTrkFpaActive = A380PrimComputerFg_DWork.p_trk_fpa_active;
      A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty = true;
    }

    if (A380PrimComputerFg_DWork.prevTrkFpaActive != A380PrimComputerFg_DWork.p_trk_fpa_active) {
      A380PrimComputerFg_DWork.pValue = A380PrimComputerFg_P.Constant_Value_cu;
    }

    if (rtb_y_ch || rtb_Compare_no) {
      A380PrimComputerFg_DWork.pValue = A380PrimComputerFg_P.Constant_Value_cu;
    }

    if (rtb_y_p && A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tcas_ra_inhibited) {
      if (A380PrimComputerFg_P.CompareToConstant2_const_n1 < 0.0) {
        A380PrimComputerFg_DWork.pValue = A380PrimComputerFg_P.Constant_Value_cu;
      } else {
        A380PrimComputerFg_DWork.pValue = 0.0F;
      }
    }

    if (A380PrimComputerFg_DWork.p_trk_fpa_active) {
      A380PrimComputerFg_DWork.pValue += static_cast<real32_T>(rtb_value_d) * 0.1F;
      A380PrimComputerFg_DWork.pValue = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue, 9.9F), -9.9F);
      A380PrimComputerFg_DWork.pValue = std::round(A380PrimComputerFg_DWork.pValue / 0.1F) * 0.1F;
    } else {
      A380PrimComputerFg_DWork.pValue += static_cast<real32_T>(rtb_value_d) * 100.0F;
      A380PrimComputerFg_DWork.pValue = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue, 6000.0F), -6000.0F);
      A380PrimComputerFg_DWork.pValue = std::round(A380PrimComputerFg_DWork.pValue / 100.0F) * 100.0F;
    }

    A380PrimComputerFg_DWork.prevTrkFpaActive = A380PrimComputerFg_DWork.p_trk_fpa_active;
    rtb_y_ch = rtb_OR_g;
    rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s = (A380PrimComputerFg_DWork.Memory_PreviousInput_kj ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_i3);
    rtb_AND2 = ((((A380PrimComputerFg_DWork.Memory_PreviousInput_jh || A380PrimComputerFg_DWork.Memory_PreviousInput_kc)
                  && (A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias_Bias_p < 0.0)) ||
                 ((A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + A380PrimComputerFg_P.Bias1_Bias_e > 0.0) &&
                  rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s)) && rtb_OR_g &&
                A380PrimComputerFg_DWork.Delay_DSTATE_m && A380PrimComputerFg_DWork.Delay_DSTATE_a);
    A380PrimComputerFg_Y.out.fg_mode_logic.vs_fpa_dashes = rtb_Compare_no;
    if (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.vs_active) {
      delta = 0.0F - A380PrimComputerFg_DWork.pValue;
      dPsi_1 = 50.0;
    } else {
      delta = 0.0F - A380PrimComputerFg_DWork.pValue;
      dPsi_1 = 0.1;
    }

    rtb_y_b3a = (rtb_y_oe && rtb_BusAssignment_a_fg_logic_fcu_1_chosen);
    rtb_y_b3a = ((rtb_y_b3a && (A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + 3.0 > 0.0) && (delta < -dPsi_1)) ||
                 (rtb_y_b3a && (A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 3.0 < 0.0) && (delta > dPsi_1)));
    A380PrimComputerFg_MATLABFunction_h((rtb_OR2 && (rtb_y_b3a || rtb_AND2 ||
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reversion_op_clb ||
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reversion_vs ||
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_mode_reversion)), A380PrimComputerFg_U.in.data.time.dt,
      &rtb_Compare_no, A380PrimComputerFg_P.MTrigNode2_isRisingEdge_o, A380PrimComputerFg_P.MTrigNode2_retriggerable_j,
      A380PrimComputerFg_P.MTrigNode2_triggerDuration_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_ok);
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode_isRisingEdge_g, &rtb_y_ch,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_j0);
    rtb_y_p = (rtb_y_ch && (!A380PrimComputerFg_DWork.Memory_PreviousInput_kx));
    A380PrimComputerFg_MATLABFunction_h
      ((A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reversion_vs || rtb_y_p),
       A380PrimComputerFg_U.in.data.time.dt, &rtb_y_ch, A380PrimComputerFg_P.MTrigNode_isRisingEdge_le,
       A380PrimComputerFg_P.MTrigNode_retriggerable_md, A380PrimComputerFg_P.MTrigNode_triggerDuration_jd,
       &A380PrimComputerFg_DWork.sf_MATLABFunction_a0p);
    A380PrimComputerFg_MATLABFunction_h((A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_mode_reversion ||
      rtb_y_p), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_p, A380PrimComputerFg_P.MTrigNode1_isRisingEdge_n,
      A380PrimComputerFg_P.MTrigNode1_retriggerable_d, A380PrimComputerFg_P.MTrigNode1_triggerDuration_p,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lth);
    A380PrimComputerFg_Y.out.fg_mode_logic.ap_fd_mode_reversion = rtb_Compare_no;
    A380PrimComputerFg_Y.out.fg_mode_logic.pitch_fd_bars_flashing = rtb_y_ch;
    A380PrimComputerFg_Y.out.fg_mode_logic.roll_fd_bars_flashing = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel2_bit_g, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h(((!A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.hdg_trk_dashes) || (rtb_y
      != 0U)), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_o2, A380PrimComputerFg_P.MTrigNode1_isRisingEdge_mw,
      A380PrimComputerFg_P.MTrigNode1_retriggerable_o0, A380PrimComputerFg_P.MTrigNode1_triggerDuration_b,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_d4);
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Memory_PreviousInput_o4,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_ei,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_b, &rtb_y_ch, &A380PrimComputerFg_DWork.sf_MATLABFunction_dxb);
    rtb_y_p = (A380PrimComputerFg_DWork.Memory_PreviousInput_f || A380PrimComputerFg_DWork.Memory_PreviousInput_ox ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_e || A380PrimComputerFg_DWork.Memory_PreviousInput_l5 ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_p || A380PrimComputerFg_DWork.Memory_PreviousInput_h);
    rtb_OR4_b = (rtb_y_ch || rtb_y_p);
    rtb_Compare_no = !A380PrimComputerFg_U.in.general_logic.all_ra_failure;
    rtb_y_p = (rtb_y_p || A380PrimComputerFg_U.in.general_logic.on_ground ||
               ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <
                 A380PrimComputerFg_P.CompareToConstant_const_ki) && rtb_Compare_no));
    rtb_y_ch = (rtb_y_o2 && rtb_OR4_b && rtb_y_p);
    A380PrimComputerFg_MATLABFunction_cr(&A380PrimComputerFg_B.BusAssignment_es.fg_logic.chosen_fcu_discrete_word_1,
      A380PrimComputerFg_P.BitfromLabel1_bit_la, &rtb_y);
    A380PrimComputerFg_MATLABFunction_h((rtb_y != 0U), A380PrimComputerFg_U.in.data.time.dt, &rtb_Compare_no,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge_k, A380PrimComputerFg_P.MTrigNode_retriggerable_cq,
      A380PrimComputerFg_P.MTrigNode_triggerDuration_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_ep);
    A380PrimComputerFg_MATLABFunction(rtb_Compare_l1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_f1, A380PrimComputerFg_P.ConfirmNode_timeDelay_ki, &rtb_y_o2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_llo);
    A380PrimComputerFg_DWork.Memory_PreviousInput_py = A380PrimComputerFg_P.Logic_table_bk[((((!rtb_y_p) || rtb_y_j ||
      rtb_y_j3 || A380PrimComputerFg_DWork.Memory_PreviousInput_eu || rtb_Compare_no || rtb_y_o2) +
      (static_cast<uint32_T>(rtb_y_ch) << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_py];
    if (!A380PrimComputerFg_B.BusAssignment_es.fg_logic.ils_tune_inhibit) {
      A380PrimComputerFg_B.u = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
    }

    if (!A380PrimComputerFg_DWork.vMemoEo_not_empty) {
      A380PrimComputerFg_DWork.vMemoEo = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
      A380PrimComputerFg_DWork.vMemoEo_not_empty = true;
    }

    if (!A380PrimComputerFg_DWork.vMemoGa_not_empty) {
      A380PrimComputerFg_DWork.vMemoGa = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
      A380PrimComputerFg_DWork.vMemoGa_not_empty = true;
    }

    if (rtb_y_be) {
      A380PrimComputerFg_DWork.vMemoGa = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    if (!A380PrimComputerFg_U.in.general_logic.one_engine_out) {
      A380PrimComputerFg_DWork.vMemoEo = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_at) {
      if (A380PrimComputerFg_U.in.general_logic.one_engine_out) {
        y = 15;
      } else {
        y = 25;
      }

      dPsi_1 = A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + static_cast<real_T>(y);
      dPsi_2 = A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 5.0;
      if (A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 5.0 > dPsi_1) {
        dPsi_2 = dPsi_1;
      }

      if (dPsi_2 > A380PrimComputerFg_DWork.vMemoGa) {
        dPsi_2 = A380PrimComputerFg_DWork.vMemoGa;
      }

      dPsi_1 = std::fmax(A380PrimComputerFg_B.u, dPsi_2);
      dPsi_2 = dPsi_1;
    } else if (A380PrimComputerFg_U.in.general_logic.one_engine_out) {
      dPsi_1 = std::fmax(A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts, std::fmin
                         (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts + 15.0, A380PrimComputerFg_DWork.vMemoEo));
      dPsi_2 = dPsi_1;
    } else {
      dPsi_1 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts + 10.0;
      dPsi_2 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_hx) {
      if (A380PrimComputerFg_DWork.Memory_PreviousInput_e || A380PrimComputerFg_DWork.Memory_PreviousInput_ov ||
          (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
           A380PrimComputerFg_P.EnumeratedConstant_Value_l)) {
        dPsi_1 = std::fmax(std::fmax(std::fmax(A380PrimComputerFg_U.in.flight_envelope.v_man_kn,
          A380PrimComputerFg_U.in.flight_envelope.v_4_kn), A380PrimComputerFg_U.in.flight_envelope.v_3_kn),
                           A380PrimComputerFg_B.u);
        A380PrimComputerFg_Y.out.fg_mode_logic.pfd_spd_target_kts = A380PrimComputerFg_B.u;
      } else if (rtb_y_h) {
        A380PrimComputerFg_Y.out.fg_mode_logic.pfd_spd_target_kts = dPsi_2;
      } else {
        if ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode ==
             A380PrimComputerFg_P.EnumeratedConstant1_Value) && A380PrimComputerFg_DWork.Memory_PreviousInput_kj &&
            A380PrimComputerFg_U.in.data.adcn_inputs.fms.show_speed_margins) {
          dPsi_1 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_upper_margin_kts;
        } else {
          dPsi_1 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
        }

        A380PrimComputerFg_Y.out.fg_mode_logic.pfd_spd_target_kts =
          A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
      }
    } else {
      if (A380PrimComputerFg_DWork.Delay_DSTATE_h) {
        delta = 0.0F;
      } else {
        delta = A380PrimComputerFg_DWork.pValue_e;
      }

      dPsi_1 = delta;
      A380PrimComputerFg_Y.out.fg_mode_logic.pfd_spd_target_kts = delta;
    }

    rtb_y_p = (A380PrimComputerFg_DWork.Memory_PreviousInput_e0 &&
               (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
                A380PrimComputerFg_P.EnumeratedConstant_Value_k) && A380PrimComputerFg_DWork.Delay_DSTATE_h &&
               A380PrimComputerFg_DWork.Delay_DSTATE_m);
    dPsi_2 = std::abs(dPsi_1);
    rtb_Compare_l1 = (dPsi_2 > A380PrimComputerFg_P.CompareToConstant_const_iw);
    A380PrimComputerFg_MATLABFunction(rtb_Compare_l1, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_ku, A380PrimComputerFg_P.ConfirmNode1_timeDelay_n, &rtb_y_o2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ar);
    A380PrimComputerFg_MATLABFunction((dPsi_2 > A380PrimComputerFg_P.CompareToConstant1_const_gt),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode2_isRisingEdge_h,
      A380PrimComputerFg_P.ConfirmNode2_timeDelay_j, &rtb_y_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_d);
    rtb_y_ch = ((!rtb_y_p) || rtb_y_o2 || rtb_y_c || (A380PrimComputerFg_U.in.flight_envelope.v_max_kn +
      A380PrimComputerFg_P.Bias_Bias_m < 0.0) || (dPsi_1 != A380PrimComputerFg_DWork.DelayInput1_DSTATE_d));
    A380PrimComputerFg_MATLABFunction((rtb_y_p && (!rtb_Compare_l1) && (!rtb_y_ch)),
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_jo,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_aq, &rtb_y_h, &A380PrimComputerFg_DWork.sf_MATLABFunction_ps);
    A380PrimComputerFg_DWork.Memory_PreviousInput_i5 = A380PrimComputerFg_P.Logic_table_lp[(((static_cast<uint32_T>
      (rtb_y_h) << 1) + rtb_y_ch) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_i5];
    A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = lateral_law::NONE;
    rtb_active_longitudinal_law = vertical_law::NONE;
    if (A380PrimComputerFg_DWork.Memory_PreviousInput_en || A380PrimComputerFg_DWork.Memory_PreviousInput_oc) {
      A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = lateral_law::ROLL_OUT;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_ox || A380PrimComputerFg_DWork.Memory_PreviousInput_e) {
      A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = lateral_law::LOC_TRACK;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_f) {
      A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = lateral_law::LOC_CPT;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_eu) {
      A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = lateral_law::HPATH;
    } else if (rtb_y_j3 || A380PrimComputerFg_DWork.Memory_PreviousInput_h ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_p) {
      A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = lateral_law::TRACK;
    } else if (rtb_y_j) {
      A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = lateral_law::HDG;
    }

    if (A380PrimComputerFg_DWork.Memory_PreviousInput_d) {
      rtb_active_longitudinal_law = vertical_law::FLARE;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_lp || A380PrimComputerFg_DWork.Memory_PreviousInput_ae ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_e) {
      rtb_active_longitudinal_law = vertical_law::GS;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_nb || A380PrimComputerFg_DWork.Memory_PreviousInput_at) {
      rtb_active_longitudinal_law = vertical_law::SRS;
    } else if (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.fpa_active) {
      rtb_active_longitudinal_law = vertical_law::FPA;
    } else if (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes.vs_active ||
               (A380PrimComputerFg_DWork.Memory_PreviousInput_kx &&
                (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_tcas_submode == tcas_submode::VS))) {
      rtb_active_longitudinal_law = vertical_law::VS;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_jh || A380PrimComputerFg_DWork.Memory_PreviousInput_i3 ||
               A380PrimComputerFg_DWork.Memory_PreviousInput_kc) {
      rtb_active_longitudinal_law = vertical_law::SPD_MACH;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_l1 || (A380PrimComputerFg_DWork.Memory_PreviousInput_kx &&
                (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_tcas_submode == tcas_submode::ALT_ACQ))) {
      rtb_active_longitudinal_law = vertical_law::ALT_ACQ;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_e0 || (A380PrimComputerFg_DWork.Memory_PreviousInput_kx &&
                (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_tcas_submode == tcas_submode::ALT_HOLD))) {
      rtb_active_longitudinal_law = vertical_law::ALT_HOLD;
    } else if (A380PrimComputerFg_DWork.Memory_PreviousInput_l5) {
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

    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode3_isRisingEdge_nw, &rtb_y_o2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_l0);
    rtb_Compare_l1 = !A380PrimComputerFg_DWork.Delay_DSTATE_m;
    A380PrimComputerFg_DWork.Memory_PreviousInput_iy = A380PrimComputerFg_P.Logic_table_j[(((static_cast<uint32_T>
      (rtb_y_o2) << 1) + rtb_Compare_l1) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_iy];
    rtb_y_p = (A380PrimComputerFg_DWork.Delay_DSTATE_m && (A380PrimComputerFg_DWork.Memory_PreviousInput_iy ||
                ((A380PrimComputerFg_P.CompareToConstant_const_bx <= 0.0) &&
                 (A380PrimComputerFg_P.CompareToConstant2_const_kg >= 0.0) &&
                 (A380PrimComputerFg_P.CompareToConstant1_const_m <= 0.0) &&
                 (A380PrimComputerFg_P.CompareToConstant3_const_e >= 0.0)) ||
                (A380PrimComputerFg_U.in.general_logic.one_engine_out &&
                 ((A380PrimComputerFg_P.CompareToConstant4_const_g < 0.0) &&
                  (A380PrimComputerFg_P.CompareToConstant6_const >= 0.0) &&
                  (A380PrimComputerFg_P.CompareToConstant5_const_p < 0.0) &&
                  (A380PrimComputerFg_P.CompareToConstant7_const >= 0.0)))));
    A380PrimComputerFg_MATLABFunction_c((((rtb_active_longitudinal_law == vertical_law::SPD_MACH) ||
      (rtb_active_longitudinal_law == vertical_law::SRS) || ((rtb_active_longitudinal_law == vertical_law::VPATH) &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_THRUST))) &&
      A380PrimComputerFg_DWork.Delay_DSTATE_m), A380PrimComputerFg_P.PulseNode_isRisingEdge_m, &rtb_y_c,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_k);
    rtb_OR4_b = !A380PrimComputerFg_DWork.Memory_PreviousInput_iy;
    rtb_OR_g = (rtb_OR_o && rtb_y_c && rtb_OR4_b);
    A380PrimComputerFg_MATLABFunction(rtb_OR_g, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_gd, A380PrimComputerFg_P.ConfirmNode_timeDelay_pz, &rtb_y_c,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bq);
    A380PrimComputerFg_DWork.Memory_PreviousInput_jm = A380PrimComputerFg_P.Logic_table_ja[(((rtb_Compare_l1 ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE.alpha_floor_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.retard_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.speed_mach_mode_active) && (!rtb_y_c))) + (static_cast<uint32_T>(rtb_OR_g)
      << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_jm];
    A380PrimComputerFg_MATLABFunction_c(((((rtb_active_longitudinal_law == vertical_law::NONE) &&
      ((!A380PrimComputerFg_DWork.Delay_DSTATE.retard_mode_active) || (!A380PrimComputerFg_U.in.general_logic.on_ground)))
      || (rtb_active_longitudinal_law == vertical_law::ALT_HOLD) || (rtb_active_longitudinal_law == vertical_law::
      ALT_ACQ) || (rtb_active_longitudinal_law == vertical_law::VS) || (rtb_active_longitudinal_law == vertical_law::FPA)
      || (rtb_active_longitudinal_law == vertical_law::GS) || (rtb_active_longitudinal_law == vertical_law::FLARE) ||
      ((rtb_active_longitudinal_law == vertical_law::VPATH) &&
       ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_SPEED) ||
        A380PrimComputerFg_DWork.Memory_PreviousInput_l5))) && A380PrimComputerFg_DWork.Delay_DSTATE_m),
      A380PrimComputerFg_P.PulseNode_isRisingEdge_hj, &rtb_y_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_o3);
    rtb_OR_o = (rtb_OR_o && rtb_y_c && rtb_OR4_b);
    A380PrimComputerFg_MATLABFunction(rtb_OR_o, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_br, A380PrimComputerFg_P.ConfirmNode_timeDelay_el, &rtb_y_c,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pl);
    A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.Logic_table_e[(((rtb_Compare_l1 ||
      ((A380PrimComputerFg_DWork.Delay_DSTATE.alpha_floor_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.retard_mode_active ||
        A380PrimComputerFg_DWork.Delay_DSTATE.thrust_mode_active) && (!rtb_y_c))) + (static_cast<uint32_T>(rtb_OR_o) <<
      1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_hs];
    A380PrimComputerFg_MATLABFunction(false, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_d3, A380PrimComputerFg_P.ConfirmNode_timeDelay_jvf, &rtb_y_c,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bl);
    A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.Logic_table_fj[(static_cast<uint32_T>
      (rtb_Compare_l1 || ((A380PrimComputerFg_DWork.Delay_DSTATE.alpha_floor_mode_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.thrust_mode_active ||
      A380PrimComputerFg_DWork.Delay_DSTATE.speed_mach_mode_active) && (!rtb_y_c))) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_gd];
    A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_op_capability = A380PrimComputerFg_DWork.pLand3FailOp;
    A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_passive_capability = A380PrimComputerFg_DWork.pLand3FailPass;
    if ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft >= 100.0) ||
        (((!A380PrimComputerFg_DWork.Memory_PreviousInput_ov) && (!A380PrimComputerFg_DWork.Memory_PreviousInput_e)) ||
         (!rtb_y_oe))) {
      A380PrimComputerFg_DWork.pLand3FailOp = false;
      A380PrimComputerFg_DWork.pLand3FailPass = false;
    }

    A380PrimComputerFg_Y.out.data = A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_Y.out.general_logic = A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_Y.out.flight_envelope = A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_Y.out.laws = A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_Y.out.fctl_logic = A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_Y.out.fg_logic = A380PrimComputerFg_B.BusAssignment_es.fg_logic;
    A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes;
    A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_modes;
    A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes = A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.armed_modes;
    A380PrimComputerFg_Y.out.fg_mode_logic.active_longitudinal_law = rtb_active_longitudinal_law;
    A380PrimComputerFg_Y.out.fg_mode_logic.auto_spd_control_active = A380PrimComputerFg_DWork.Memory_PreviousInput_hx;
    A380PrimComputerFg_Y.out.fg_mode_logic.manual_spd_control_active = A380PrimComputerFg_DWork.Memory_PreviousInput_od;
    A380PrimComputerFg_Y.out.fg_mode_logic.mach_control_active = A380PrimComputerFg_DWork.Delay_DSTATE_h;
    A380PrimComputerFg_Y.out.fg_mode_logic.athr_active = rtb_y_p;
    A380PrimComputerFg_Y.out.fg_mode_logic.athr_limited = (rtb_y_p && ((A380PrimComputerFg_P.CompareToConstant10_const >
      0.0) || (A380PrimComputerFg_P.CompareToConstant11_const > 0.0) ||
      (A380PrimComputerFg_U.in.general_logic.one_engine_out && ((A380PrimComputerFg_P.CompareToConstant8_const > 0.0) ||
      (A380PrimComputerFg_P.CompareToConstant9_const > 0.0)))));
    A380PrimComputerFg_Y.out.fg_mode_logic.alpha_floor_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_iy;
    A380PrimComputerFg_Y.out.fg_mode_logic.thrust_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_jm;
    A380PrimComputerFg_Y.out.fg_mode_logic.thrust_target_idle = (rtb_BusAssignment_fg_logic_gnd_eng_stop_flt_5s ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_l5);
    A380PrimComputerFg_Y.out.fg_mode_logic.speed_mach_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_hs;
    A380PrimComputerFg_Y.out.fg_mode_logic.retard_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_gd;
    A380PrimComputerFg_Y.out.fg_mode_logic.athr_fma_mode = A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_mode;
    A380PrimComputerFg_Y.out.fg_mode_logic.athr_fma_message = A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_message;
    A380PrimComputerFg_Y.out.fg_mode_logic.spd_target_kts = dPsi_1;
    A380PrimComputerFg_Y.out.fg_mode_logic.alt_cstr_applicable = rtb_AND_k1;
    A380PrimComputerFg_Y.out.fg_mode_logic.alt_sel_or_cstr = rtb_altCstrOrFcu;
    A380PrimComputerFg_Y.out.fg_mode_logic.mode_sync_active = rtb_AND4;
    A380PrimComputerFg_Y.out.fg_mode_logic.any_ap_fd_engaged = rtb_OR2;
    A380PrimComputerFg_Y.out.fg_mode_logic.any_lateral_mode_engaged =
      (A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_modes.rwy_active ||
       A380PrimComputerFg_DWork.Memory_PreviousInput_p || A380PrimComputerFg_DWork.Memory_PreviousInput_f ||
       A380PrimComputerFg_DWork.Memory_PreviousInput_ox || rtb_y_j || rtb_y_j3 ||
       A380PrimComputerFg_DWork.Memory_PreviousInput_eu || A380PrimComputerFg_DWork.Memory_PreviousInput_e);
    A380PrimComputerFg_Y.out.fg_mode_logic.any_longitudinal_mode_engaged = (rtb_BusAssignment_a_fg_logic_fcu_1_chosen ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_e0 || A380PrimComputerFg_DWork.Memory_PreviousInput_l1 ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_jh || A380PrimComputerFg_DWork.Memory_PreviousInput_kj ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_l5 || A380PrimComputerFg_DWork.Memory_PreviousInput_lp ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_ae || A380PrimComputerFg_DWork.Memory_PreviousInput_kc ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_i3 || A380PrimComputerFg_DWork.Memory_PreviousInput_at ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_nb || A380PrimComputerFg_DWork.Memory_PreviousInput_kx ||
      A380PrimComputerFg_DWork.Memory_PreviousInput_e);
    A380PrimComputerFg_Y.out.fg_mode_logic.lateral_mode_reset = rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset;
    A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_mode_reset =
      rtb_BusAssignment_lt_fg_mode_logic_lateral_mode_reset;
    A380PrimComputerFg_Y.out.fg_mode_logic.hdg_trk_preset_available = A380PrimComputerFg_DWork.Memory_PreviousInput_py;
    A380PrimComputerFg_Y.out.fg_mode_logic.alt_soft_mode_active = A380PrimComputerFg_DWork.Memory_PreviousInput_i5;
    A380PrimComputerFg_Y.out.fg_mode_logic.fd_auto_disengage = rtb_AND2;
    A380PrimComputerFg_Y.out.fg_mode_logic.lateral_mode_reversion =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.lateral_mode_reversion;
    A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_mode_reversion_vs =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reversion_vs;
    A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_mode_reversion_op_clb =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longitudinal_mode_reversion_op_clb;
    A380PrimComputerFg_Y.out.fg_mode_logic.loc_bc_selection = A380PrimComputerFg_U.in.fg_mode_logic.loc_bc_selection;
    A380PrimComputerFg_Y.out.fg_mode_logic.vs_target_not_held = rtb_y_b3a;
    A380PrimComputerFg_Y.out.fg_mode_logic.tcas_vs_target = 0.0;
    A380PrimComputerFg_Y.out.fg_mode_logic.tcas_ra_corrective = false;
    A380PrimComputerFg_Y.out.fg_mode_logic.active_tcas_submode =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.active_tcas_submode;
    A380PrimComputerFg_Y.out.fg_mode_logic.tcas_alt_acq_cond = rtb_AND1_is;
    A380PrimComputerFg_Y.out.fg_mode_logic.tcas_alt_hold_cond = rtb_BusAssignment_ps_fg_mode_logic_tcas_alt_hold_cond;
    A380PrimComputerFg_Y.out.fg_mode_logic.tcas_ra_inhibited =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.tcas_ra_inhibited;
    A380PrimComputerFg_Y.out.fg_mode_logic.trk_fpa_deselected =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.trk_fpa_deselected;
    A380PrimComputerFg_Y.out.fg_mode_logic.longi_large_box_tcas =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.longi_large_box_tcas;
    A380PrimComputerFg_Y.out.fg_mode_logic.tla_to_ga_set = false;
    A380PrimComputerFg_Y.out.fg_mode_logic.true_active = A380PrimComputerFg_DWork.p_true_active;
    A380PrimComputerFg_Y.out.fg_mode_logic.trk_fpa_active = A380PrimComputerFg_DWork.p_trk_fpa_active;
    A380PrimComputerFg_Y.out.fg_mode_logic.metric_alt_active = A380PrimComputerFg_DWork.p_metric_alt_active;
    A380PrimComputerFg_Y.out.fg_mode_logic.selected_spd_mach = A380PrimComputerFg_DWork.pValue_e;
    A380PrimComputerFg_Y.out.fg_mode_logic.spd_mach_dashes = rtb_AND10_j;
    A380PrimComputerFg_Y.out.fg_mode_logic.selected_hdg_trk = A380PrimComputerFg_DWork.pValue_i;
    A380PrimComputerFg_Y.out.fg_mode_logic.hdg_trk_dashes =
      A380PrimComputerFg_B.BusAssignment_es.fg_mode_logic.hdg_trk_dashes;
    A380PrimComputerFg_Y.out.fg_mode_logic.selected_alt = A380PrimComputerFg_DWork.pValue_p;
    A380PrimComputerFg_Y.out.fg_mode_logic.selected_vs_fpa = A380PrimComputerFg_DWork.pValue;
    A380PrimComputerFg_Y.out.fg_laws = A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_Y.out.discrete_outputs = A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_Y.out.analog_outputs = A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_Y.out.bus_outputs = A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_Y.out.fg_mode_logic.land_2_capability = false;
    A380PrimComputerFg_Y.out.fg_mode_logic.land_2_inop = true;
    A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_passive_inop = true;
    A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_op_inop = true;
    A380PrimComputerFg_DWork.Delay_DSTATE = A380PrimComputerFg_Y.out.fg_mode_logic;
    A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_DWork.Delay_DSTATE_a;
    A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_DWork.Delay_DSTATE_b;
    A380PrimComputerFg_DWork.Delay_DSTATE_d = A380PrimComputerFg_DWork.DelayOneStep_DSTATE;
    A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_DWork.Delay_DSTATE_b;
    A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_DWork.DelayOneStep_DSTATE;
    A380PrimComputerFg_DWork.Memory_PreviousInput_io = A380PrimComputerFg_DWork.Delay_DSTATE_m;
    A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_DWork.Delay_DSTATE_h;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_i = rtb_Delay_selected_alt;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_k = A380PrimComputerFg_U.in.fg_mode_logic.selected_alt;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE = A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_j = A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_f = A380PrimComputerFg_DWork.pY;
    A380PrimComputerFg_DWork.Delay_DSTATE_p = A380PrimComputerFg_P.Constant_Value_eg;
    A380PrimComputerFg_DWork.DelayInput1_DSTATE_d = dPsi_1;
  } else {
    A380PrimComputerFg_DWork.Runtime_MODE = false;
  }
}

void A380PrimComputerFg::initialize()
{
  A380PrimComputerFg_DWork.Delay_DSTATE.lateral_modes =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes;
  A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_modes =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes;
  A380PrimComputerFg_DWork.Delay_DSTATE.armed_modes =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes;
  A380PrimComputerFg_DWork.Delay_DSTATE.active_lateral_law =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.active_lateral_law;
  A380PrimComputerFg_DWork.Delay_DSTATE.active_longitudinal_law =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.active_longitudinal_law;
  A380PrimComputerFg_DWork.Delay_DSTATE.auto_spd_control_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.auto_spd_control_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.manual_spd_control_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.manual_spd_control_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.mach_control_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.mach_control_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.athr_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.athr_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.athr_limited =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.athr_limited;
  A380PrimComputerFg_DWork.Delay_DSTATE.alpha_floor_mode_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alpha_floor_mode_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.thrust_mode_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.thrust_mode_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.thrust_target_idle =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.thrust_target_idle;
  A380PrimComputerFg_DWork.Delay_DSTATE.speed_mach_mode_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.speed_mach_mode_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.retard_mode_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.retard_mode_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.athr_fma_mode =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.athr_fma_mode;
  A380PrimComputerFg_DWork.Delay_DSTATE.athr_fma_message =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.athr_fma_message;
  A380PrimComputerFg_DWork.Delay_DSTATE.spd_target_kts =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.spd_target_kts;
  A380PrimComputerFg_DWork.Delay_DSTATE.pfd_spd_target_kts =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.pfd_spd_target_kts;
  A380PrimComputerFg_DWork.Delay_DSTATE.alt_cstr_applicable =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alt_cstr_applicable;
  A380PrimComputerFg_DWork.Delay_DSTATE.alt_sel_or_cstr =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alt_sel_or_cstr;
  A380PrimComputerFg_DWork.Delay_DSTATE.mode_sync_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.mode_sync_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.any_ap_fd_engaged =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.any_ap_fd_engaged;
  A380PrimComputerFg_DWork.Delay_DSTATE.any_lateral_mode_engaged =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.any_lateral_mode_engaged;
  A380PrimComputerFg_DWork.Delay_DSTATE.any_longitudinal_mode_engaged =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.any_longitudinal_mode_engaged;
  A380PrimComputerFg_DWork.Delay_DSTATE.lateral_mode_reset =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_mode_reset;
  A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_mode_reset =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_mode_reset;
  A380PrimComputerFg_DWork.Delay_DSTATE.hdg_trk_preset_available =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.hdg_trk_preset_available;
  A380PrimComputerFg_DWork.Delay_DSTATE.alt_soft_mode_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alt_soft_mode_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.fd_auto_disengage =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.fd_auto_disengage;
  A380PrimComputerFg_DWork.Delay_DSTATE.ap_fd_mode_reversion =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.ap_fd_mode_reversion;
  A380PrimComputerFg_DWork.Delay_DSTATE.lateral_mode_reversion =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_mode_reversion;
  A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_mode_reversion_vs =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_mode_reversion_vs;
  A380PrimComputerFg_DWork.Delay_DSTATE.longitudinal_mode_reversion_op_clb =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_mode_reversion_op_clb;
  A380PrimComputerFg_DWork.Delay_DSTATE.pitch_fd_bars_flashing =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.pitch_fd_bars_flashing;
  A380PrimComputerFg_DWork.Delay_DSTATE.roll_fd_bars_flashing =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.roll_fd_bars_flashing;
  A380PrimComputerFg_DWork.Delay_DSTATE.loc_bc_selection =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.loc_bc_selection;
  A380PrimComputerFg_DWork.Delay_DSTATE.vs_target_not_held =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.vs_target_not_held;
  A380PrimComputerFg_DWork.Delay_DSTATE.tcas_vs_target =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.tcas_vs_target;
  A380PrimComputerFg_DWork.Delay_DSTATE.tcas_ra_corrective =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.tcas_ra_corrective;
  A380PrimComputerFg_DWork.Delay_DSTATE.active_tcas_submode =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.active_tcas_submode;
  A380PrimComputerFg_DWork.Delay_DSTATE.tcas_alt_acq_cond =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.tcas_alt_acq_cond;
  A380PrimComputerFg_DWork.Delay_DSTATE.tcas_alt_hold_cond =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.tcas_alt_hold_cond;
  A380PrimComputerFg_DWork.Delay_DSTATE.tcas_ra_inhibited =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.tcas_ra_inhibited;
  A380PrimComputerFg_DWork.Delay_DSTATE.trk_fpa_deselected =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.trk_fpa_deselected;
  A380PrimComputerFg_DWork.Delay_DSTATE.longi_large_box_tcas =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longi_large_box_tcas;
  A380PrimComputerFg_DWork.Delay_DSTATE.land_2_capability =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.land_2_capability;
  A380PrimComputerFg_DWork.Delay_DSTATE.land_3_fail_passive_capability =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_passive_capability;
  A380PrimComputerFg_DWork.Delay_DSTATE.land_3_fail_op_capability =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_op_capability;
  A380PrimComputerFg_DWork.Delay_DSTATE.land_2_inop =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.land_2_inop;
  A380PrimComputerFg_DWork.Delay_DSTATE.land_3_fail_passive_inop =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_passive_inop;
  A380PrimComputerFg_DWork.Delay_DSTATE.land_3_fail_op_inop =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.land_3_fail_op_inop;
  A380PrimComputerFg_DWork.Delay_DSTATE.tla_to_ga_set =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.tla_to_ga_set;
  A380PrimComputerFg_DWork.Delay_DSTATE.true_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.true_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.trk_fpa_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.trk_fpa_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.metric_alt_active =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.metric_alt_active;
  A380PrimComputerFg_DWork.Delay_DSTATE.selected_spd_mach =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.selected_spd_mach;
  A380PrimComputerFg_DWork.Delay_DSTATE.spd_mach_dashes =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.spd_mach_dashes;
  A380PrimComputerFg_DWork.Delay_DSTATE.selected_hdg_trk =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.selected_hdg_trk;
  A380PrimComputerFg_DWork.Delay_DSTATE.hdg_trk_dashes =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.hdg_trk_dashes;
  A380PrimComputerFg_DWork.Delay_DSTATE.selected_alt =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.selected_alt;
  A380PrimComputerFg_DWork.Delay_DSTATE.selected_vs_fpa =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.selected_vs_fpa;
  A380PrimComputerFg_DWork.Delay_DSTATE.vs_fpa_dashes =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.vs_fpa_dashes;
  A380PrimComputerFg_DWork.Delay_DSTATE_a = A380PrimComputerFg_P.Delay_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.SRFlipFlop1_initial_condition;
  A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_P.Delay_InitialCondition_o;
  A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_P.DelayOneStep_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_o;
  A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_P.SRFlipFlop_initial_condition;
  A380PrimComputerFg_DWork.Delay_DSTATE_d = A380PrimComputerFg_P.Delay_InitialCondition_h;
  A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_P.DelayOneStep1_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_P.SRFlipFlop_initial_condition_o;
  A380PrimComputerFg_DWork.Memory_PreviousInput_m0 = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_f;
  A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_P.Delay_InitialCondition_i;
  A380PrimComputerFg_DWork.Memory_PreviousInput_io = A380PrimComputerFg_P.SRFlipFlop_initial_condition_c;
  A380PrimComputerFg_DWork.Delay_DSTATE_me = A380PrimComputerFg_P.Delay_InitialCondition_n;
  A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.SRFlipFlop_initial_condition_n;
  A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_P.Delay_InitialCondition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_P.SRFlipFlop_initial_condition_b;
  A380PrimComputerFg_DWork.Memory_PreviousInput_nb = A380PrimComputerFg_P.SRFlipFlop_initial_condition_k;
  A380PrimComputerFg_DWork.Memory_PreviousInput_oc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_l;
  A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bj;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ov = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ok;
  A380PrimComputerFg_DWork.Memory_PreviousInput_e = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_en = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lg;
  A380PrimComputerFg_DWork.Memory_PreviousInput_d = A380PrimComputerFg_P.SRFlipFlop_initial_condition_oh;
  A380PrimComputerFg_DWork.Memory_PreviousInput_a = A380PrimComputerFg_P.SRFlipFlop_initial_condition_cl;
  A380PrimComputerFg_DWork.Memory_PreviousInput_l5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_h;
  A380PrimComputerFg_DWork.Memory_PreviousInput_at = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bjr;
  A380PrimComputerFg_DWork.Memory_PreviousInput_p = A380PrimComputerFg_P.SRFlipFlop_initial_condition_m;
  A380PrimComputerFg_DWork.Memory_PreviousInput_lm = A380PrimComputerFg_P.SRFlipFlop_initial_condition_g;
  A380PrimComputerFg_DWork.Memory_PreviousInput_o4 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jb;
  A380PrimComputerFg_DWork.Memory_PreviousInput_eu = A380PrimComputerFg_P.SRFlipFlop_initial_condition_nh;
  A380PrimComputerFg_DWork.Memory_PreviousInput_k = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d;
  A380PrimComputerFg_DWork.Memory_PreviousInput_f = A380PrimComputerFg_P.SRFlipFlop_initial_condition_db;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ox = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lv;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_i = A380PrimComputerFg_P.DetectChange_vinit_m;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ek = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_g;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_k = A380PrimComputerFg_P.DetectChange_vinit_p;
  A380PrimComputerFg_DWork.Memory_PreviousInput_l1 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jn;
  A380PrimComputerFg_DWork.Memory_PreviousInput_e0 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_i;
  A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_gz;
  A380PrimComputerFg_DWork.Memory_PreviousInput_og = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_c;
  A380PrimComputerFg_DWork.Memory_PreviousInput_oy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_p;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE = A380PrimComputerFg_P.DetectChange_vinit;
  A380PrimComputerFg_DWork.Memory_PreviousInput_jh = A380PrimComputerFg_P.SRFlipFlop_initial_condition_a;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ei = A380PrimComputerFg_P.SRFlipFlop_initial_condition_bp;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_j = A380PrimComputerFg_P.DetectChange_vinit_a;
  A380PrimComputerFg_DWork.Memory_PreviousInput_kj = A380PrimComputerFg_P.SRFlipFlop_initial_condition_lk;
  A380PrimComputerFg_DWork.Memory_PreviousInput_kc = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mc;
  A380PrimComputerFg_DWork.Memory_PreviousInput_i3 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_j1;
  A380PrimComputerFg_DWork.Memory_PreviousInput_il = A380PrimComputerFg_P.SRFlipFlop_initial_condition_md;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_f = A380PrimComputerFg_P.DetectDecrease_vinit;
  A380PrimComputerFg_DWork.Memory_PreviousInput_lp = A380PrimComputerFg_P.SRFlipFlop_initial_condition_ac;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ae = A380PrimComputerFg_P.SRFlipFlop_initial_condition_hq;
  A380PrimComputerFg_DWork.Memory_PreviousInput_ik = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_fn;
  A380PrimComputerFg_DWork.Memory_PreviousInput_kx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_jq;
  A380PrimComputerFg_DWork.Memory_PreviousInput_b = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d;
  A380PrimComputerFg_DWork.Memory_PreviousInput_pt = A380PrimComputerFg_P.SRFlipFlop2_initial_condition;
  A380PrimComputerFg_DWork.Delay_DSTATE_p = A380PrimComputerFg_P.Delay_InitialCondition_hi;
  A380PrimComputerFg_DWork.Memory_PreviousInput_od = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_jg;
  A380PrimComputerFg_DWork.Memory_PreviousInput_hx = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pb;
  A380PrimComputerFg_DWork.Memory_PreviousInput_py = A380PrimComputerFg_P.SRFlipFlop_initial_condition_mv;
  A380PrimComputerFg_DWork.DelayInput1_DSTATE_d = A380PrimComputerFg_P.DetectChange_vinit_d;
  A380PrimComputerFg_DWork.Memory_PreviousInput_i5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_pq;
  A380PrimComputerFg_DWork.Memory_PreviousInput_iy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d3;
  A380PrimComputerFg_DWork.Memory_PreviousInput_jm = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_fnn;
  A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d2;
  A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_co;
  A380PrimComputerFg_B.u_lyj = A380PrimComputerFg_P.Y_Y0;
  A380PrimComputerFg_B.u_l = A380PrimComputerFg_P.Y_Y0_l;
  A380PrimComputerFg_B.u_ly = A380PrimComputerFg_P.Y_Y0_a;
  A380PrimComputerFg_B.u = A380PrimComputerFg_P.Y_Y0_h;
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
