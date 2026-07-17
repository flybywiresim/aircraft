#include "A380PrimComputerFg.h"
#include "rtwtypes.h"
#include "A380PrimComputerFg_types.h"
#include <cmath>
#include <cstring>
#include <stddef.h>

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
  base_arinc_429 rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic;
  real_T ex;
  real_T rtb_Bias1;
  int32_T y;
  real32_T rtb_y_e;
  real32_T rtb_y_p;
  uint32_T rtb_SSM_m;
  uint32_T rtb_y;
  int8_T rtb_value_d;
  boolean_T athrCondition;
  boolean_T rtb_AND3_i;
  boolean_T rtb_AND4_c;
  boolean_T rtb_Compare_of;
  boolean_T rtb_NOR_g;
  boolean_T rtb_OR1_l0_tmp;
  boolean_T rtb_OR2;
  boolean_T rtb_OR2_b;
  boolean_T rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0;
  boolean_T rtb_y_be;
  if (A380PrimComputerFg_U.in.data.sim_data.computer_running) {
    if (!A380PrimComputerFg_DWork.Runtime_MODE) {
      A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.SRFlipFlop1_initial_condition;
      A380PrimComputerFg_DWork.Delay_29_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.tcas_active;
      A380PrimComputerFg_DWork.Delay_DSTATE = A380PrimComputerFg_P.Delay_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.SRFlipFlop_initial_condition;
      A380PrimComputerFg_DWork.Delay_8_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.rwy_loc_submode_active;
      A380PrimComputerFg_DWork.Delay_10_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.land_active;
      A380PrimComputerFg_DWork.Delay_34_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.land_armed;
      A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_P.Delay_InitialCondition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_P.SRFlipFlop_initial_condition_b;
      A380PrimComputerFg_DWork.Delay_66_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.fd_auto_disengage;
      A380PrimComputerFg_DWork.Delay_DSTATE_a = A380PrimComputerFg_P.Delay_InitialCondition_f;
      A380PrimComputerFg_DWork.Delay_2_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.nav_active;
      A380PrimComputerFg_DWork.Delay_3_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.loc_cpt_active;
      A380PrimComputerFg_DWork.Delay_4_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.loc_trk_active;
      A380PrimComputerFg_DWork.Delay_12_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.rollout_submode_active;
      A380PrimComputerFg_DWork.Delay_13_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.clb_active;
      A380PrimComputerFg_DWork.Delay_14_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.des_active;
      A380PrimComputerFg_DWork.Delay_17_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.pitch_takeoff_active;
      A380PrimComputerFg_DWork.Delay_18_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.pitch_goaround_active;
      A380PrimComputerFg_DWork.Delay_21_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.alt_acq_active;
      A380PrimComputerFg_DWork.Delay_22_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.alt_hold_active;
      A380PrimComputerFg_DWork.Delay_30_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.alt_acq_armed;
      A380PrimComputerFg_DWork.Delay_35_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.glide_armed;
      A380PrimComputerFg_DWork.Delay_36_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.final_des_armed;
      A380PrimComputerFg_DWork.Delay_37_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.clb_armed;
      A380PrimComputerFg_DWork.Delay_38_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.des_armed;
      A380PrimComputerFg_DWork.Delay_42_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.auto_spd_control_active;
      A380PrimComputerFg_DWork.Delay_43_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.manual_spd_control_active;
      A380PrimComputerFg_DWork.Delay_47_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alpha_floor_mode_active;
      A380PrimComputerFg_DWork.Delay_48_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.thrust_mode_active;
      A380PrimComputerFg_DWork.Delay_50_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.speed_mach_mode_active;
      A380PrimComputerFg_DWork.Delay_51_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.retard_mode_active;
      A380PrimComputerFg_DWork.Delay_56_DSTATE =
        A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alt_cstr_applicable;
      A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_k;
      A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_P.Delay_InitialCondition_o;
      A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_P.DelayOneStep_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_o;
      A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_P.SRFlipFlop_initial_condition_a;
      A380PrimComputerFg_DWork.Delay_DSTATE_d = A380PrimComputerFg_P.Delay_InitialCondition_h;
      A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_P.DelayOneStep1_InitialCondition;
      A380PrimComputerFg_DWork.Memory_PreviousInput_mz = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_j;
      A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_P.SRFlipFlop_initial_condition_o;
      A380PrimComputerFg_DWork.Memory_PreviousInput_l5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_h;
      A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_P.Delay_InitialCondition_i;
      A380PrimComputerFg_DWork.Memory_PreviousInput_io = A380PrimComputerFg_P.SRFlipFlop_initial_condition_c;
      A380PrimComputerFg_DWork.Memory_PreviousInput_iy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d;
      A380PrimComputerFg_DWork.Delay_DSTATE_j = A380PrimComputerFg_P.Delay_InitialCondition_jm;
      A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_h;
      A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_f;
      A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d;
      A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_c;
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_at);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_aq);
      A380PrimComputerFg_DWork.vMemoEo_not_empty = false;
      A380PrimComputerFg_DWork.vMemoGa_not_empty = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_km);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a5);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fh);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_h);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pg);
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
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_oy);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_e0);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cz);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_p2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_j);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ec);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_eb);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_or);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cj);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_g2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_m);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cs);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_e);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_l0);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_a2);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ik);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ox);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ecl);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_nl);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_mq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cv);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ku);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_k);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_o3);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_pl);
      A380PrimComputerFg_MATLABFunction_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bl);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_d);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ci);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_lk);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_jq);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bc);
      A380PrimComputerFg_DWork.p_true_active = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ka);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ne);
      A380PrimComputerFg_DWork.p_trk_fpa_active = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bbo);
      A380PrimComputerFg_DWork.p_metric_alt_active = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_bb);
      A380PrimComputerFg_DWork.eventTime_not_empty = false;
      A380PrimComputerFg_DWork.pValue_not_empty_n = false;
      A380PrimComputerFg_DWork.prevMachActive_not_empty = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_cb);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_ck);
      A380PrimComputerFg_MATLABFunction1_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction1_o);
      A380PrimComputerFg_DWork.pValue_not_empty_a = false;
      A380PrimComputerFg_DWork.pValue_not_empty_j = false;
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_hq);
      A380PrimComputerFg_MATLABFunction1_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction1_d);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_fhn);
      A380PrimComputerFg_MATLABFunction_l_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_li);
      A380PrimComputerFg_MATLABFunction_o_Reset(&A380PrimComputerFg_DWork.sf_MATLABFunction_gw);
      A380PrimComputerFg_DWork.pValue_not_empty = false;
      A380PrimComputerFg_DWork.prevTrkFpaActive_not_empty = false;
      A380PrimComputerFg_DWork.Runtime_MODE = true;
    }

    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_U.in.data.discrete_inputs.athr_instinctive_disc,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_at);
    A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.Logic_table[(((static_cast<uint32_T>(rtb_y_be) <<
      1) + A380PrimComputerFg_P.Constant_Value_o) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput];
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode1_isRisingEdge, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_aq);
    A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.Logic_table_m[(((static_cast<uint32_T>
      (A380PrimComputerFg_DWork.Delay_29_DSTATE && rtb_y_be) << 1) + A380PrimComputerFg_DWork.Delay_DSTATE) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_g];
    A380PrimComputerFg_B.ils_tune_inhibit = (A380PrimComputerFg_DWork.Delay_8_DSTATE ||
      A380PrimComputerFg_DWork.Delay_10_DSTATE || (A380PrimComputerFg_DWork.Delay_34_DSTATE &&
      (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <= A380PrimComputerFg_P.CompareToConstant_const)));
    athrCondition = !A380PrimComputerFg_B.ils_tune_inhibit;
    if (athrCondition) {
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

    if (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active) {
      A380PrimComputerFg_DWork.vMemoGa = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    if (!A380PrimComputerFg_U.in.general_logic.one_engine_out) {
      A380PrimComputerFg_DWork.vMemoEo = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
    }

    if (A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active) {
      if (A380PrimComputerFg_U.in.general_logic.one_engine_out) {
        y = 15;
      } else {
        y = 25;
      }

      rtb_Bias1 = A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + static_cast<real_T>(y);
      ex = A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 5.0;
      if (A380PrimComputerFg_U.in.flight_envelope.v_max_kn - 5.0 > rtb_Bias1) {
        ex = rtb_Bias1;
      }

      if (ex > A380PrimComputerFg_DWork.vMemoGa) {
        ex = A380PrimComputerFg_DWork.vMemoGa;
      }

      A380PrimComputerFg_B.spd_target_kts = std::fmax(A380PrimComputerFg_B.u, ex);
      A380PrimComputerFg_B.pfd_spd_target_kts = A380PrimComputerFg_B.spd_target_kts;
    } else if (A380PrimComputerFg_U.in.general_logic.one_engine_out) {
      A380PrimComputerFg_B.spd_target_kts = std::fmax(A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts, std::fmin
        (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts + 15.0, A380PrimComputerFg_DWork.vMemoEo));
      A380PrimComputerFg_B.pfd_spd_target_kts = A380PrimComputerFg_B.spd_target_kts;
    } else {
      A380PrimComputerFg_B.spd_target_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts + 10.0;
      A380PrimComputerFg_B.pfd_spd_target_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts;
    }

    A380PrimComputerFg_B.fcu_1_chosen = (((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_2 &&
      A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy) ||
      ((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_1 || A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_3)
       && (!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_2_healthy))) &&
      A380PrimComputerFg_U.in.fctl_logic.is_master_prim);
    if (A380PrimComputerFg_B.fcu_1_chosen) {
      rtb_SSM_m = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.SSM;
      rtb_y_p = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.Data;
    } else {
      rtb_SSM_m = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.SSM;
      rtb_y_p = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.SSM = rtb_SSM_m;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.Data = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.BitfromLabel4_bit, &A380PrimComputerFg_B.SSM);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_B.SSM != 0U), A380PrimComputerFg_P.PulseNode4_isRisingEdge,
      &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_km);
    A380PrimComputerFg_B.mach_control_active = A380PrimComputerFg_P.Logic_table_d[(((static_cast<uint32_T>
      (((!A380PrimComputerFg_DWork.Delay_DSTATE_h) && rtb_y_be) ||
       A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_mach_mode_activate ||
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate &&
        (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_mach > A380PrimComputerFg_P.CompareToConstant1_const))) <<
      1) + ((rtb_y_be && A380PrimComputerFg_DWork.Delay_DSTATE_h) ||
            A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_spd_mode_activate ||
            (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate &&
             (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_kts >
              A380PrimComputerFg_P.CompareToConstant_const_f)))) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_l];
    if (A380PrimComputerFg_B.fcu_1_chosen) {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1;
    } else {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1;
    }

    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.BitfromLabel1_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge,
      &rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0, &A380PrimComputerFg_DWork.sf_MATLABFunction_a5);
    A380PrimComputerFg_MATLABFunction(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_b,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_f, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_fh);
    A380PrimComputerFg_B.gnd_eng_stop_flt_5s = (((!A380PrimComputerFg_U.in.general_logic.engine_running) &&
      A380PrimComputerFg_U.in.general_logic.on_ground) || rtb_y_be);
    A380PrimComputerFg_B.all_fcu_failure = ((!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy) &&
      (!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_2_healthy));
    A380PrimComputerFg_B.fcu_2_chosen = (((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_2 &&
      (!A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy)) ||
      ((A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_1 || A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_3)
       && A380PrimComputerFg_U.in.data.discrete_inputs.fcu_2_healthy)) &&
      A380PrimComputerFg_U.in.fctl_logic.is_master_prim);
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg,
      &rtb_NOR_g);
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg,
      &rtb_y_be);
    A380PrimComputerFg_B.both_ils_valid = (rtb_NOR_g && rtb_y_be);
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg,
      &rtb_NOR_g);
    A380PrimComputerFg_MATLABFunction_n(&A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg,
      &rtb_y_be);
    rtb_y_be = (rtb_NOR_g && rtb_y_be);
    A380PrimComputerFg_B.ils_failure = ((!A380PrimComputerFg_B.both_ils_valid) && (!rtb_y_be));
    A380PrimComputerFg_B.both_ils_valid = (A380PrimComputerFg_B.both_ils_valid && rtb_y_be);
    if (rtb_y_be) {
      A380PrimComputerFg_B.SSM_kxx = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.SSM;
      A380PrimComputerFg_B.Data_fwx = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.Data;
    } else {
      A380PrimComputerFg_B.SSM_kxx = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.SSM;
      A380PrimComputerFg_B.Data_fwx = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.SSM = A380PrimComputerFg_B.SSM_kxx;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.Data = A380PrimComputerFg_B.Data_fwx;
    A380PrimComputerFg_MATLABFunction_g(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.A429ValueOrDefault3_defaultValue, &rtb_y_e);
    if (athrCondition) {
      A380PrimComputerFg_B.u_l = rtb_y_e;
    }

    if (rtb_y_be) {
      A380PrimComputerFg_B.SSM_kx = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.SSM;
      A380PrimComputerFg_B.Data_fw = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.Data;
      A380PrimComputerFg_B.SSM_k = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.SSM;
    } else {
      A380PrimComputerFg_B.SSM_kx = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.SSM;
      A380PrimComputerFg_B.Data_fw = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.Data;
      A380PrimComputerFg_B.SSM_k = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.SSM;
    }

    if (A380PrimComputerFg_U.in.data.adcn_inputs.fms.backbeam_selected) {
      if (rtb_y_be) {
        rtb_y_e = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.Data;
      } else {
        rtb_y_e = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.Data;
      }

      A380PrimComputerFg_B.Data_f = A380PrimComputerFg_P.Gain_Gain * rtb_y_e;
    } else if (rtb_y_be) {
      A380PrimComputerFg_B.Data_f = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.Data;
    } else {
      A380PrimComputerFg_B.Data_f = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.Data;
    }

    if (rtb_y_be) {
      A380PrimComputerFg_B.SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.SSM;
      A380PrimComputerFg_B.Data = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.Data;
    } else {
      A380PrimComputerFg_B.SSM = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.SSM;
      A380PrimComputerFg_B.Data = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.Data;
    }

    A380PrimComputerFg_MATLABFunction_h((A380PrimComputerFg_DWork.Delay_12_DSTATE && (std::abs(A380PrimComputerFg_B.u_l)
      > A380PrimComputerFg_P.CompareToConstant_const_f2)), A380PrimComputerFg_U.in.data.time.dt, &rtb_y_be,
      A380PrimComputerFg_P.MTrigNode_isRisingEdge, A380PrimComputerFg_P.MTrigNode_retriggerable,
      A380PrimComputerFg_P.MTrigNode_triggerDuration, &A380PrimComputerFg_DWork.sf_MATLABFunction_h);
    rtb_OR1_l0_tmp = !A380PrimComputerFg_B.all_fcu_failure;
    A380PrimComputerFg_MATLABFunction(((rtb_OR1_l0_tmp || (A380PrimComputerFg_DWork.Delay_10_DSTATE ||
      A380PrimComputerFg_DWork.Delay_18_DSTATE)) && ((A380PrimComputerFg_U.in.fctl_logic.active_pitch_law ==
      a380_pitch_efcs_law::NormalLaw) || (A380PrimComputerFg_U.in.fctl_logic.active_pitch_law == a380_pitch_efcs_law::
      AlternateLaw1A) || (A380PrimComputerFg_U.in.fctl_logic.active_pitch_law == a380_pitch_efcs_law::AlternateLaw1B)) &&
      (!A380PrimComputerFg_U.in.general_logic.double_adr_failure) &&
      (!A380PrimComputerFg_U.in.general_logic.double_ir_failure)), A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge, A380PrimComputerFg_P.ConfirmNode_timeDelay,
      &A380PrimComputerFg_B.ap_fd_common_condition, &A380PrimComputerFg_DWork.sf_MATLABFunction_pg);
    A380PrimComputerFg_B.fd_1_engaged = A380PrimComputerFg_P.Logic_table_h[(((static_cast<uint32_T>
      (rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0 && (!A380PrimComputerFg_DWork.Delay_DSTATE_a) &&
       A380PrimComputerFg_B.ap_fd_common_condition) << 1) + ((!A380PrimComputerFg_B.ap_fd_common_condition) ||
      (rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0 && A380PrimComputerFg_DWork.Delay_DSTATE_a) ||
      A380PrimComputerFg_DWork.Delay_66_DSTATE)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_m];
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.ap_1_pushbutton_pressed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_b, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_c);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge, &A380PrimComputerFg_B.ap_2_inop,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_f);
    rtb_NOR_g = (A380PrimComputerFg_B.ap_2_inop && A380PrimComputerFg_U.in.general_logic.on_ground);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.DelayOneStep_DSTATE,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge, &A380PrimComputerFg_B.ap_2_inop,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_a);
    rtb_OR2 = ((!A380PrimComputerFg_DWork.Delay_34_DSTATE) && (!A380PrimComputerFg_DWork.Delay_10_DSTATE) &&
               (!A380PrimComputerFg_DWork.Delay_18_DSTATE));
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode1_isRisingEdge_p,
      &rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0, &A380PrimComputerFg_DWork.sf_MATLABFunction_p);
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.data =
      A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.general_logic =
      A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.flight_envelope =
      A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.laws =
      A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fctl_logic =
      A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.gnd_eng_stop_flt_5s =
      A380PrimComputerFg_B.gnd_eng_stop_flt_5s;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_fd_common_condition
      = A380PrimComputerFg_B.ap_fd_common_condition;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_engaged =
      A380PrimComputerFg_U.in.fg_logic.ap_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_engaged =
      A380PrimComputerFg_U.in.fg_logic.ap_2_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_engaged =
      A380PrimComputerFg_U.in.fg_logic.athr_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_inop =
      A380PrimComputerFg_U.in.fg_logic.ap_1_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_inop =
      A380PrimComputerFg_U.in.fg_logic.ap_2_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_inop =
      A380PrimComputerFg_U.in.fg_logic.athr_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fmgc_opp_priority =
      A380PrimComputerFg_U.in.fg_logic.fmgc_opp_priority;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.altitude_indicated_ft
      = A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.all_fcu_failure =
      A380PrimComputerFg_B.all_fcu_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_1_chosen =
      A380PrimComputerFg_B.fcu_1_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_2_chosen =
      A380PrimComputerFg_B.fcu_2_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_failure =
      A380PrimComputerFg_B.ils_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.both_ils_valid =
      A380PrimComputerFg_B.both_ils_valid;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.SSM
      = A380PrimComputerFg_B.SSM_kxx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.Data
      = A380PrimComputerFg_B.Data_fwx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.SSM
      = A380PrimComputerFg_B.SSM_kx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.Data
      = A380PrimComputerFg_B.Data_fw;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM_k;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.Data
      = A380PrimComputerFg_B.Data_f;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.Data
      = A380PrimComputerFg_B.Data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_tune_inhibit =
      A380PrimComputerFg_B.ils_tune_inhibit;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.rwy_hdg_memo =
      A380PrimComputerFg_B.u_l;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_failure = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_mode_available =
      false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic =
      A380PrimComputerFg_U.in.fg_mode_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_laws =
      A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.discrete_outputs =
      A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.analog_outputs =
      A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.bus_outputs =
      A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_APEngagedLogic(rtb_y_be, A380PrimComputerFg_DWork.Delay_DSTATE_b, rtb_NOR_g,
      ((A380PrimComputerFg_B.ap_2_inop && rtb_OR2) || (A380PrimComputerFg_DWork.DelayOneStep_DSTATE &&
      rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0 && (A380PrimComputerFg_P.APEngagedLogic_isSide2 != 0.0))),
      (A380PrimComputerFg_U.in.general_logic.on_ground && (A380PrimComputerFg_DWork.Delay_18_DSTATE ||
      (A380PrimComputerFg_P.CompareToConstant3_const <= 0.0) || (A380PrimComputerFg_P.CompareToConstant5_const <= 0.0))),
      ((A380PrimComputerFg_U.in.flight_envelope.v_max_kn < 0.0) || (A380PrimComputerFg_U.in.flight_envelope.v_ls_kn >
      0.0) || (A380PrimComputerFg_P.CompareToConstant_const_g > 0.0) || (A380PrimComputerFg_P.CompareToConstant1_const_g
      < 0.0) || (A380PrimComputerFg_P.CompareToConstant2_const < 0.0)),
      &A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1,
      &A380PrimComputerFg_B.ap_2_inop, &rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0,
      &A380PrimComputerFg_B.ap_1_inop);
    A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.Logic_table_i[(((static_cast<uint32_T>
      (A380PrimComputerFg_B.ap_2_inop) << 1) + rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_n];
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Memory_PreviousInput_n,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_g,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_b, &A380PrimComputerFg_B.ap_2_inop,
      &A380PrimComputerFg_DWork.sf_MATLABFunction);
    A380PrimComputerFg_B.ap_1_engaged = A380PrimComputerFg_P.Logic_table_dm[(((static_cast<uint32_T>(rtb_y_be &&
      A380PrimComputerFg_DWork.Memory_PreviousInput_n) << 1) + ((!A380PrimComputerFg_B.ap_2_inop) ||
      A380PrimComputerFg_U.in.data.discrete_inputs.capt_priority_takeover_pressed ||
      A380PrimComputerFg_U.in.data.discrete_inputs.fo_priority_takeover_pressed)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_i];
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.ap_2_pushbutton_pressed,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_l, &rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_al);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_n, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_fe);
    rtb_AND4_c = (rtb_y_be && A380PrimComputerFg_U.in.general_logic.on_ground);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.DelayOneStep1_DSTATE,
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_b, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_o);
    rtb_OR2_b = ((!A380PrimComputerFg_DWork.Delay_34_DSTATE) && (!A380PrimComputerFg_DWork.Delay_10_DSTATE) &&
                 (!A380PrimComputerFg_DWork.Delay_18_DSTATE));
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2_b, A380PrimComputerFg_P.PulseNode1_isRisingEdge_b, &rtb_NOR_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ad);
    rtb_AND3_i = (A380PrimComputerFg_DWork.DelayOneStep1_DSTATE && rtb_NOR_g &&
                  (A380PrimComputerFg_P.APEngagedLogic1_isSide2 != 0.0));
    rtb_NOR_g = (A380PrimComputerFg_U.in.flight_envelope.v_max_kn < 0.0);
    rtb_OR2 = (A380PrimComputerFg_U.in.flight_envelope.v_ls_kn > 0.0);
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.data =
      A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.general_logic =
      A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.flight_envelope =
      A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.laws =
      A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fctl_logic =
      A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.gnd_eng_stop_flt_5s =
      A380PrimComputerFg_B.gnd_eng_stop_flt_5s;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_fd_common_condition
      = A380PrimComputerFg_B.ap_fd_common_condition;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_engaged =
      A380PrimComputerFg_U.in.fg_logic.ap_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_engaged =
      A380PrimComputerFg_U.in.fg_logic.ap_2_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_engaged =
      A380PrimComputerFg_U.in.fg_logic.athr_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_inop =
      A380PrimComputerFg_U.in.fg_logic.ap_1_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_inop =
      A380PrimComputerFg_U.in.fg_logic.ap_2_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_inop =
      A380PrimComputerFg_U.in.fg_logic.athr_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fmgc_opp_priority =
      A380PrimComputerFg_U.in.fg_logic.fmgc_opp_priority;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.altitude_indicated_ft
      = A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.all_fcu_failure =
      A380PrimComputerFg_B.all_fcu_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_1_chosen =
      A380PrimComputerFg_B.fcu_1_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_2_chosen =
      A380PrimComputerFg_B.fcu_2_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_failure =
      A380PrimComputerFg_B.ils_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.both_ils_valid =
      A380PrimComputerFg_B.both_ils_valid;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.SSM
      = A380PrimComputerFg_B.SSM_kxx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.Data
      = A380PrimComputerFg_B.Data_fwx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.SSM
      = A380PrimComputerFg_B.SSM_kx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.Data
      = A380PrimComputerFg_B.Data_fw;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM_k;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.Data
      = A380PrimComputerFg_B.Data_f;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.Data
      = A380PrimComputerFg_B.Data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_tune_inhibit =
      A380PrimComputerFg_B.ils_tune_inhibit;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.rwy_hdg_memo =
      A380PrimComputerFg_B.u_l;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_failure = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_mode_available =
      false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic =
      A380PrimComputerFg_U.in.fg_mode_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_laws =
      A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.discrete_outputs =
      A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.analog_outputs =
      A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.bus_outputs =
      A380PrimComputerFg_U.in.bus_outputs;
    A380PrimComputerFg_APEngagedLogic(rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0,
      A380PrimComputerFg_DWork.Delay_DSTATE_d, rtb_AND4_c, ((rtb_y_be && rtb_OR2_b) || rtb_AND3_i),
      (A380PrimComputerFg_U.in.general_logic.on_ground && (A380PrimComputerFg_DWork.Delay_18_DSTATE ||
      (A380PrimComputerFg_P.CompareToConstant3_const_k <= 0.0) || (A380PrimComputerFg_P.CompareToConstant5_const_f <=
      0.0))), (rtb_NOR_g || rtb_OR2 || (A380PrimComputerFg_P.CompareToConstant_const_a > 0.0) ||
               (A380PrimComputerFg_P.CompareToConstant1_const_e < 0.0) ||
               (A380PrimComputerFg_P.CompareToConstant2_const_n < 0.0)),
      &A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1, &rtb_NOR_g, &rtb_OR2,
      &A380PrimComputerFg_B.ap_2_inop);
    A380PrimComputerFg_DWork.Memory_PreviousInput_mz = A380PrimComputerFg_P.Logic_table_o[(((static_cast<uint32_T>
      (rtb_NOR_g) << 1) + rtb_OR2) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_mz];
    rtb_y_be = (rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0 &&
                A380PrimComputerFg_DWork.Memory_PreviousInput_mz);
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Memory_PreviousInput_mz,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode_isRisingEdge_p,
      A380PrimComputerFg_P.ConfirmNode_timeDelay_h, &rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_b);
    rtb_NOR_g = ((!rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0) ||
                 A380PrimComputerFg_U.in.data.discrete_inputs.capt_priority_takeover_pressed ||
                 A380PrimComputerFg_U.in.data.discrete_inputs.fo_priority_takeover_pressed);
    A380PrimComputerFg_B.ap_2_engaged = A380PrimComputerFg_P.Logic_table_m3[(((static_cast<uint32_T>(rtb_y_be) << 1) +
      rtb_NOR_g) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_o];
    rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0 = (A380PrimComputerFg_B.ap_1_engaged ||
      A380PrimComputerFg_B.ap_2_engaged);
    A380PrimComputerFg_B.any_ap_fd_engaged = (rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0 ||
      A380PrimComputerFg_B.fd_1_engaged || A380PrimComputerFg_B.fd_1_engaged);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_B.any_ap_fd_engaged,
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_j, &rtb_OR2, &A380PrimComputerFg_DWork.sf_MATLABFunction_oy);
    rtb_Compare_of = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts !=
                      A380PrimComputerFg_P.CompareToConstant_const_i);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_e0);
    A380PrimComputerFg_MATLABFunction_c(rtb_Compare_of, A380PrimComputerFg_P.PulseNode2_isRisingEdge_h, &rtb_NOR_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cz);
    rtb_y_be = ((rtb_OR2 && rtb_Compare_of) || (rtb_y_be && rtb_Compare_of && A380PrimComputerFg_B.any_ap_fd_engaged) ||
                (A380PrimComputerFg_B.any_ap_fd_engaged && rtb_NOR_g));
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active ||
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_takeoff_active),
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_f, &rtb_NOR_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_p2);
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode_isRisingEdge_j, &rtb_OR2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_j);
    rtb_OR2 = ((A380PrimComputerFg_U.in.general_logic.on_ground && rtb_y_be) || (rtb_NOR_g || rtb_OR2));
    rtb_y_be = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts !=
                A380PrimComputerFg_P.CompareToConstant2_const_k);
    rtb_NOR_g = (A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts != A380PrimComputerFg_P.CompareToConstant3_const_f);
    rtb_Compare_of = (rtb_OR2 && (rtb_y_be || rtb_NOR_g));
    A380PrimComputerFg_MATLABFunction(rtb_Compare_of, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_p5, A380PrimComputerFg_P.ConfirmNode_timeDelay_i, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ec);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
      A380PrimComputerFg_P.CompareToConstant4_const), A380PrimComputerFg_P.PulseNode6_isRisingEdge, &rtb_OR2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_eb);
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts ==
      A380PrimComputerFg_P.CompareToConstant5_const_d), A380PrimComputerFg_P.PulseNode7_isRisingEdge, &rtb_NOR_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_or);
    rtb_y_be = ((A380PrimComputerFg_DWork.Delay_43_DSTATE && (!rtb_y_be)) ||
                (A380PrimComputerFg_U.in.general_logic.on_ground &&
                 ((!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active) &&
                  (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_takeoff_active) && athrCondition) &&
                 (rtb_OR2 || rtb_NOR_g)));
    A380PrimComputerFg_B.auto_spd_control_active = A380PrimComputerFg_P.Logic_table_c[(((static_cast<uint32_T>
      (rtb_Compare_of) << 1) + rtb_y_be) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_l5];
    if (A380PrimComputerFg_B.auto_spd_control_active) {
      if (A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active ||
          A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.land_armed ||
          (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase ==
           A380PrimComputerFg_P.EnumeratedConstant_Value)) {
        A380PrimComputerFg_B.spd_target_kts = std::fmax(std::fmax(std::fmax
          (A380PrimComputerFg_U.in.flight_envelope.v_man_kn, A380PrimComputerFg_U.in.flight_envelope.v_4_kn),
          A380PrimComputerFg_U.in.flight_envelope.v_3_kn), A380PrimComputerFg_B.u);
        A380PrimComputerFg_B.pfd_spd_target_kts = A380PrimComputerFg_B.u;
      } else if ((!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active) &&
                 (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_takeoff_active)) {
        if ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode ==
             A380PrimComputerFg_P.EnumeratedConstant1_Value) &&
            A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.des_active &&
            A380PrimComputerFg_U.in.data.adcn_inputs.fms.show_speed_margins) {
          A380PrimComputerFg_B.spd_target_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_upper_margin_kts;
        } else {
          A380PrimComputerFg_B.spd_target_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
        }

        A380PrimComputerFg_B.pfd_spd_target_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
      }
    } else {
      A380PrimComputerFg_B.spd_target_kts = 0.0;
      A380PrimComputerFg_B.pfd_spd_target_kts = 0.0;
    }

    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.data.discrete_inputs.athr_pushbutton,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_p, &rtb_AND4_c, &A380PrimComputerFg_DWork.sf_MATLABFunction_g);
    A380PrimComputerFg_MATLABFunction((A380PrimComputerFg_DWork.Delay_18_DSTATE ||
      A380PrimComputerFg_DWork.Delay_17_DSTATE), A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode2_isRisingEdge, A380PrimComputerFg_P.ConfirmNode2_timeDelay, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_cj);
    A380PrimComputerFg_MATLABFunction_c(rtb_y_be, A380PrimComputerFg_P.PulseNode1_isRisingEdge_pq, &rtb_OR2_b,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_g2);
    rtb_NOR_g = (A380PrimComputerFg_P.CompareToConstant1_const_h > 0.0);
    A380PrimComputerFg_MATLABFunction_c(((A380PrimComputerFg_P.CompareToConstant_const_k > 0.0) && rtb_NOR_g),
      A380PrimComputerFg_P.PulseNode2_isRisingEdge_m, &rtb_AND3_i, &A380PrimComputerFg_DWork.sf_MATLABFunction_m);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.flight_envelope.alpha_floor_condition,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_p, &rtb_Compare_of, &A380PrimComputerFg_DWork.sf_MATLABFunction_cs);
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode4_isRisingEdge_i, &rtb_OR2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_l);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_DWork.Delay_29_DSTATE,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_e, &rtb_NOR_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_e);
    rtb_y_be = true;
    A380PrimComputerFg_MATLABFunction(A380PrimComputerFg_DWork.Delay_DSTATE_m, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode3_isRisingEdge, A380PrimComputerFg_P.ConfirmNode3_timeDelay, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pv);
    athrCondition = ((A380PrimComputerFg_DWork.Delay_43_DSTATE || A380PrimComputerFg_DWork.Delay_42_DSTATE) &&
                     (!A380PrimComputerFg_DWork.Memory_PreviousInput) && rtb_OR1_l0_tmp &&
                     (!A380PrimComputerFg_U.in.flight_envelope.speed_scale_lost));
    A380PrimComputerFg_B.athr_inop = !athrCondition;
    A380PrimComputerFg_B.athr_engaged = A380PrimComputerFg_P.Logic_table_hv[(((static_cast<uint32_T>(athrCondition &&
      ((rtb_AND4_c && ((A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft > 100.0) ||
                       A380PrimComputerFg_U.in.general_logic.all_ra_failure)) || rtb_OR2_b || rtb_Compare_of ||
       rtb_NOR_g)) << 1) + (A380PrimComputerFg_B.athr_inop || rtb_OR2 || (A380PrimComputerFg_DWork.Delay_DSTATE_m &&
      rtb_AND4_c && (!A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active)) ||
      A380PrimComputerFg_U.in.data.discrete_inputs.athr_instinctive_disc || rtb_AND3_i || rtb_y_be)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_io];
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode3_isRisingEdge_nw, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_l0);
    athrCondition = !A380PrimComputerFg_B.athr_engaged;
    A380PrimComputerFg_B.alpha_floor_mode_active = A380PrimComputerFg_P.Logic_table_j[(((static_cast<uint32_T>(rtb_y_be)
      << 1) + athrCondition) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_iy];
    A380PrimComputerFg_MATLABFunction(!A380PrimComputerFg_U.in.general_logic.on_ground,
      A380PrimComputerFg_U.in.data.time.dt, A380PrimComputerFg_P.ConfirmNode1_isRisingEdge_e,
      A380PrimComputerFg_P.ConfirmNode1_timeDelay_c, &rtb_OR2, &A380PrimComputerFg_DWork.sf_MATLABFunction_a2);
    A380PrimComputerFg_MATLABFunction_c(rtb_OR2, A380PrimComputerFg_P.PulseNode3_isRisingEdge_i, &rtb_OR2_b,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ik);
    A380PrimComputerFg_MATLABFunction_c(false, A380PrimComputerFg_P.PulseNode2_isRisingEdge_p, &rtb_AND4_c,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ox);
    rtb_NOR_g = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate;
    A380PrimComputerFg_MATLABFunction_c((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
      A380PrimComputerFg_P.CompareToConstant1_const_i), A380PrimComputerFg_P.PulseNode4_isRisingEdge_a, &rtb_AND3_i,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ecl);
    rtb_OR2 = !A380PrimComputerFg_U.in.general_logic.on_ground;
    rtb_y_be = (rtb_AND3_i && rtb_OR2 &&
                ((!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_takeoff_active) &&
                 (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active) &&
                 (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.gs_capt_active) &&
                 (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.gs_trk_active) &&
                 (!A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active)));
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.tcas_active,
      A380PrimComputerFg_P.PulseNode7_isRisingEdge_a, &rtb_OR2, &A380PrimComputerFg_DWork.sf_MATLABFunction_nl);
    rtb_OR1_l0_tmp = !A380PrimComputerFg_B.any_ap_fd_engaged;
    rtb_y_be = ((A380PrimComputerFg_DWork.Delay_DSTATE_j && (!A380PrimComputerFg_U.in.general_logic.on_ground)) ||
                ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts ==
                  A380PrimComputerFg_P.CompareToConstant_const_j) && rtb_OR2_b &&
                 ((!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_takeoff_active) &&
                  (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active) &&
                  (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.gs_capt_active) &&
                  (!A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.gs_trk_active) &&
                  (!A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active))) || (rtb_OR1_l0_tmp &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase !=
       A380PrimComputerFg_P.EnumeratedConstant_Value_i)) || (rtb_AND4_c && A380PrimComputerFg_B.gnd_eng_stop_flt_5s) ||
                A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate || rtb_y_be || rtb_OR2);
    rtb_OR2 = rtb_y_be;
    A380PrimComputerFg_MATLABFunction(rtb_y_be, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_b, A380PrimComputerFg_P.ConfirmNode_timeDelay_hl, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_mq);
    rtb_Compare_of = !rtb_y_be;
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode6_isRisingEdge_k, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_cv);
    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_B.any_ap_fd_engaged,
      A380PrimComputerFg_P.PulseNode5_isRisingEdge_o, &rtb_NOR_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_ku);
    A380PrimComputerFg_B.manual_spd_control_active = A380PrimComputerFg_P.Logic_table_cb
      [((((A380PrimComputerFg_DWork.Delay_42_DSTATE && rtb_Compare_of) ||
          (A380PrimComputerFg_U.in.general_logic.on_ground && (rtb_y_be || rtb_NOR_g))) + (static_cast<uint32_T>(rtb_OR2)
          << 1)) << 1) + A380PrimComputerFg_DWork.Memory_PreviousInput_h];
    A380PrimComputerFg_MATLABFunction_c((((A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::
      SPD_MACH) || (A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::SRS) ||
      ((A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::VPATH) &&
       (A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_THRUST))) &&
      A380PrimComputerFg_B.athr_engaged), A380PrimComputerFg_P.PulseNode_isRisingEdge_m, &rtb_OR2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_k);
    rtb_Compare_of = !A380PrimComputerFg_B.alpha_floor_mode_active;
    rtb_NOR_g = rtb_Compare_of;
    rtb_y_be = (rtb_OR2 && rtb_Compare_of);
    A380PrimComputerFg_MATLABFunction(rtb_y_be, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_gd, A380PrimComputerFg_P.ConfirmNode_timeDelay_p, &rtb_NOR_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bq);
    A380PrimComputerFg_B.thrust_mode_active = A380PrimComputerFg_P.Logic_table_ja[(((athrCondition ||
      ((A380PrimComputerFg_DWork.Delay_47_DSTATE || A380PrimComputerFg_DWork.Delay_51_DSTATE ||
        A380PrimComputerFg_DWork.Delay_50_DSTATE) && (!rtb_NOR_g))) + (static_cast<uint32_T>(rtb_y_be) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_j];
    A380PrimComputerFg_MATLABFunction_c(((((A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law ==
      vertical_law::NONE) && ((!A380PrimComputerFg_DWork.Delay_51_DSTATE) ||
      (!A380PrimComputerFg_U.in.general_logic.on_ground))) ||
      (A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::ALT_HOLD) ||
      (A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::ALT_ACQ) ||
      (A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::VS) ||
      (A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::FPA) ||
      (A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::GS) ||
      (A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::FLARE) ||
      ((A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law == vertical_law::VPATH) &&
       ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode == fmgc_des_submode::VPATH_SPEED) ||
        A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.final_des_active))) &&
      A380PrimComputerFg_B.athr_engaged), A380PrimComputerFg_P.PulseNode_isRisingEdge_h, &rtb_OR2,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_o3);
    rtb_NOR_g = rtb_Compare_of;
    rtb_y_be = (rtb_OR2 && rtb_Compare_of);
    A380PrimComputerFg_MATLABFunction(rtb_y_be, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_br, A380PrimComputerFg_P.ConfirmNode_timeDelay_e, &rtb_NOR_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_pl);
    A380PrimComputerFg_B.speed_mach_mode_active = A380PrimComputerFg_P.Logic_table_e[(((athrCondition ||
      ((A380PrimComputerFg_DWork.Delay_47_DSTATE || A380PrimComputerFg_DWork.Delay_51_DSTATE ||
        A380PrimComputerFg_DWork.Delay_48_DSTATE) && (!rtb_NOR_g))) + (static_cast<uint32_T>(rtb_y_be) << 1)) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_hs];
    rtb_OR2 = (A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft <=
               A380PrimComputerFg_P.CompareToConstant_const_d);
    rtb_NOR_g = false;
    A380PrimComputerFg_MATLABFunction(false, A380PrimComputerFg_U.in.data.time.dt,
      A380PrimComputerFg_P.ConfirmNode_isRisingEdge_d, A380PrimComputerFg_P.ConfirmNode_timeDelay_j, &rtb_NOR_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bl);
    A380PrimComputerFg_B.retard_mode_active = A380PrimComputerFg_P.Logic_table_f[(static_cast<uint32_T>(athrCondition ||
      ((A380PrimComputerFg_DWork.Delay_47_DSTATE || A380PrimComputerFg_DWork.Delay_48_DSTATE ||
        A380PrimComputerFg_DWork.Delay_50_DSTATE) && (!rtb_NOR_g))) << 1) +
      A380PrimComputerFg_DWork.Memory_PreviousInput_gd];
    A380PrimComputerFg_MATLABFunction_g(&A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft,
      A380PrimComputerFg_P.A429ValueOrDefault1_defaultValue, &rtb_y_e);
    A380PrimComputerFg_DWork.Delay_21_DSTATE = (A380PrimComputerFg_DWork.Delay_21_DSTATE ||
      A380PrimComputerFg_DWork.Delay_22_DSTATE);
    A380PrimComputerFg_DWork.Delay_2_DSTATE = (A380PrimComputerFg_DWork.Delay_2_DSTATE ||
      A380PrimComputerFg_DWork.Delay_3_DSTATE || A380PrimComputerFg_DWork.Delay_4_DSTATE);
    rtb_y_be = (A380PrimComputerFg_DWork.Delay_21_DSTATE && A380PrimComputerFg_DWork.Delay_56_DSTATE &&
                A380PrimComputerFg_DWork.Delay_2_DSTATE &&
                A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid);
    if (rtb_y_e < 0.0F) {
      athrCondition = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft < 0.0) &&
                       ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft + 250.0 > rtb_y_e) || rtb_y_be));
    } else {
      athrCondition = ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft > 0.0) &&
                       ((A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft - 250.0 < rtb_y_e) || rtb_y_be));
    }

    A380PrimComputerFg_B.alt_cstr_applicable = ((A380PrimComputerFg_DWork.Delay_37_DSTATE ||
      A380PrimComputerFg_DWork.Delay_38_DSTATE || A380PrimComputerFg_DWork.Delay_13_DSTATE ||
      A380PrimComputerFg_DWork.Delay_14_DSTATE || rtb_y_be) &&
      (A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft != 0.0) && athrCondition);
    if (A380PrimComputerFg_B.alt_cstr_applicable) {
      A380PrimComputerFg_B.alt_sel_or_cstr = A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft;
    } else {
      A380PrimComputerFg_B.alt_sel_or_cstr = 0.0;
    }

    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.general_logic.engine_running,
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_na, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_d);
    A380PrimComputerFg_B.lateral_mode_reset = (rtb_OR1_l0_tmp || (rtb_y_be &&
      A380PrimComputerFg_U.in.general_logic.on_ground));
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_DWork.Delay_29_DSTATE, A380PrimComputerFg_U.in.data.time.dt,
      &A380PrimComputerFg_B.tcas_ra_inhibited, A380PrimComputerFg_P.MTrigNode_isRisingEdge_l,
      A380PrimComputerFg_P.MTrigNode_retriggerable_b, A380PrimComputerFg_P.MTrigNode_triggerDuration_a,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ci);
    rtb_y_be = !A380PrimComputerFg_DWork.Delay_29_DSTATE;
    A380PrimComputerFg_DWork.Delay_DSTATE = (A380PrimComputerFg_DWork.Memory_PreviousInput_g && rtb_y_be);
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_DWork.Delay_DSTATE, A380PrimComputerFg_U.in.data.time.dt,
      &A380PrimComputerFg_B.trk_fpa_deselected, A380PrimComputerFg_P.MTrigNode1_isRisingEdge,
      A380PrimComputerFg_P.MTrigNode1_retriggerable, A380PrimComputerFg_P.MTrigNode1_triggerDuration,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_lk);
    A380PrimComputerFg_MATLABFunction_h((A380PrimComputerFg_DWork.Delay_29_DSTATE &&
      (A380PrimComputerFg_DWork.Delay_37_DSTATE || A380PrimComputerFg_DWork.Delay_38_DSTATE ||
       A380PrimComputerFg_DWork.Delay_36_DSTATE || A380PrimComputerFg_DWork.Delay_35_DSTATE ||
       A380PrimComputerFg_DWork.Delay_30_DSTATE)), A380PrimComputerFg_U.in.data.time.dt,
      &A380PrimComputerFg_B.longi_large_box_tcas, A380PrimComputerFg_P.MTrigNode2_isRisingEdge,
      A380PrimComputerFg_P.MTrigNode2_retriggerable, A380PrimComputerFg_P.MTrigNode2_triggerDuration,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_jq);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.SSM = rtb_SSM_m;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.Data = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.BitfromLabel3_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode2_isRisingEdge_p1, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bc);
    if (rtb_y_be) {
      A380PrimComputerFg_DWork.p_true_active = !A380PrimComputerFg_DWork.p_true_active;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.SSM = rtb_SSM_m;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.Data = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.BitfromLabel1_bit_i, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode_isRisingEdge_e, &rtb_NOR_g,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_ka);
    rtb_y_be = (A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active &&
                (!A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.trk_active));
    A380PrimComputerFg_MATLABFunction_c((rtb_y_be ||
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.tcas_active),
      A380PrimComputerFg_P.PulseNode3_isRisingEdge_pe, &rtb_y_be, &A380PrimComputerFg_DWork.sf_MATLABFunction_ne);
    if (rtb_y_be) {
      A380PrimComputerFg_DWork.p_trk_fpa_active = false;
    } else if (rtb_NOR_g) {
      A380PrimComputerFg_DWork.p_trk_fpa_active = !A380PrimComputerFg_DWork.p_trk_fpa_active;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.SSM = rtb_SSM_m;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic.Data = rtb_y_p;
    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.BitfromLabel2_bit, &rtb_y);
    A380PrimComputerFg_MATLABFunction_c((rtb_y != 0U), A380PrimComputerFg_P.PulseNode1_isRisingEdge_i, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_bbo);
    if (rtb_y_be) {
      A380PrimComputerFg_DWork.p_metric_alt_active = !A380PrimComputerFg_DWork.p_metric_alt_active;
    }

    A380PrimComputerFg_MATLABFunction_c(A380PrimComputerFg_U.in.fg_mode_logic.manual_spd_control_active,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_jn, &rtb_NOR_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_bb);
    if (A380PrimComputerFg_B.fcu_1_chosen) {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2;
    } else {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2;
    }

    A380PrimComputerFg_MATLABFunction_g(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue, &rtb_y_p);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_p, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field);
    if (!A380PrimComputerFg_DWork.eventTime_not_empty) {
      A380PrimComputerFg_DWork.eventTime = A380PrimComputerFg_U.in.data.time.simulation_time;
      A380PrimComputerFg_DWork.eventTime_not_empty = true;
    }

    if (rtb_NOR_g) {
      A380PrimComputerFg_DWork.eventTime = (A380PrimComputerFg_U.in.data.time.simulation_time - 10.0) - 1.0;
    } else if (A380PrimComputerFg_U.in.fg_mode_logic.manual_spd_control_active || (rtb_value_d !=
                A380PrimComputerFg_P.CompareToConstant_const_l)) {
      A380PrimComputerFg_DWork.eventTime = A380PrimComputerFg_U.in.data.time.simulation_time;
    }

    A380PrimComputerFg_B.spd_mach_dashes = (A380PrimComputerFg_U.in.data.time.simulation_time -
      A380PrimComputerFg_DWork.eventTime > 10.0);
    if (A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate) {
      if (A380PrimComputerFg_B.mach_control_active) {
        rtb_Bias1 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_mach;
      } else {
        rtb_Bias1 = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_kts;
      }
    } else {
      rtb_Bias1 = A380PrimComputerFg_P.Constant_Value;
    }

    if (!A380PrimComputerFg_DWork.pValue_not_empty_n) {
      A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_P.Constant_Value_e;
      A380PrimComputerFg_DWork.pValue_not_empty_n = true;
    }

    if (!A380PrimComputerFg_DWork.prevMachActive_not_empty) {
      A380PrimComputerFg_DWork.prevMachActive = A380PrimComputerFg_B.mach_control_active;
      A380PrimComputerFg_DWork.prevMachActive_not_empty = true;
    }

    if (A380PrimComputerFg_DWork.prevMachActive != A380PrimComputerFg_B.mach_control_active) {
      A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_P.Constant_Value_e;
    }

    if (A380PrimComputerFg_B.spd_mach_dashes) {
      A380PrimComputerFg_DWork.pValue_e = A380PrimComputerFg_P.Constant_Value_e;
    }

    if (static_cast<real32_T>(rtb_Bias1) > 0.0F) {
      A380PrimComputerFg_DWork.pValue_e = static_cast<real32_T>(rtb_Bias1);
    }

    if (A380PrimComputerFg_B.mach_control_active) {
      A380PrimComputerFg_DWork.pValue_e += static_cast<real32_T>(rtb_value_d) * 0.01F;
      A380PrimComputerFg_DWork.pValue_e = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_e, 0.99F), 0.1F);
      A380PrimComputerFg_DWork.pValue_e = std::round(A380PrimComputerFg_DWork.pValue_e / 0.01F) * 0.01F;
    } else {
      A380PrimComputerFg_DWork.pValue_e += static_cast<real32_T>(rtb_value_d);
      A380PrimComputerFg_DWork.pValue_e = std::fmax(std::fmin(A380PrimComputerFg_DWork.pValue_e, 399.0F), 100.0F);
      A380PrimComputerFg_DWork.pValue_e = std::round(A380PrimComputerFg_DWork.pValue_e);
    }

    A380PrimComputerFg_DWork.prevMachActive = A380PrimComputerFg_B.mach_control_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.data =
      A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.general_logic =
      A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.flight_envelope =
      A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.laws =
      A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fctl_logic =
      A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.gnd_eng_stop_flt_5s =
      A380PrimComputerFg_B.gnd_eng_stop_flt_5s;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_fd_common_condition
      = A380PrimComputerFg_B.ap_fd_common_condition;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_engaged =
      A380PrimComputerFg_B.ap_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_engaged =
      A380PrimComputerFg_B.ap_2_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_engaged =
      A380PrimComputerFg_B.athr_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_inop =
      A380PrimComputerFg_B.ap_1_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_inop =
      A380PrimComputerFg_B.ap_2_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_inop =
      A380PrimComputerFg_B.athr_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fmgc_opp_priority =
      A380PrimComputerFg_U.in.fg_logic.fmgc_opp_priority;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.altitude_indicated_ft
      = A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.all_fcu_failure =
      A380PrimComputerFg_B.all_fcu_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_1_chosen =
      A380PrimComputerFg_B.fcu_1_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_2_chosen =
      A380PrimComputerFg_B.fcu_2_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_failure =
      A380PrimComputerFg_B.ils_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.both_ils_valid =
      A380PrimComputerFg_B.both_ils_valid;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.SSM
      = A380PrimComputerFg_B.SSM_kxx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.Data
      = A380PrimComputerFg_B.Data_fwx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.SSM
      = A380PrimComputerFg_B.SSM_kx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.Data
      = A380PrimComputerFg_B.Data_fw;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM_k;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.Data
      = A380PrimComputerFg_B.Data_f;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.Data
      = A380PrimComputerFg_B.Data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_tune_inhibit =
      A380PrimComputerFg_B.ils_tune_inhibit;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.rwy_hdg_memo =
      A380PrimComputerFg_B.u_l;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_failure = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_mode_available =
      false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.lateral_modes =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_modes
      = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.armed_modes =
      A380PrimComputerFg_U.in.fg_mode_logic.armed_modes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.active_lateral_law
      = A380PrimComputerFg_U.in.fg_mode_logic.active_lateral_law;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.active_longitudinal_law
      = A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.auto_spd_control_active
      = A380PrimComputerFg_U.in.fg_mode_logic.auto_spd_control_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.manual_spd_control_active
      = A380PrimComputerFg_U.in.fg_mode_logic.manual_spd_control_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.mach_control_active
      = A380PrimComputerFg_B.mach_control_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_active =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_limited =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_limited;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alpha_floor_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.alpha_floor_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.thrust_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.thrust_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.thrust_target_idle
      = A380PrimComputerFg_U.in.fg_mode_logic.thrust_target_idle;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.speed_mach_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.speed_mach_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.retard_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.retard_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_fma_mode =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_mode;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_fma_message
      = A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_message;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.spd_target_kts =
      A380PrimComputerFg_U.in.fg_mode_logic.spd_target_kts;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.pfd_spd_target_kts
      = A380PrimComputerFg_U.in.fg_mode_logic.pfd_spd_target_kts;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_cstr_applicable
      = A380PrimComputerFg_B.alt_cstr_applicable;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_sel_or_cstr =
      A380PrimComputerFg_B.alt_sel_or_cstr;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.fmgc_opp_mode_sync
      = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.any_ap_fd_engaged
      = A380PrimComputerFg_B.any_ap_fd_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.any_lateral_mode_engaged
      = A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.any_longitudinal_mode_engaged
      = A380PrimComputerFg_U.in.fg_mode_logic.any_longitudinal_mode_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.lateral_mode_reset
      = A380PrimComputerFg_B.lateral_mode_reset;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_mode_reset
      = A380PrimComputerFg_B.lateral_mode_reset;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.hdg_trk_preset_available
      = A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_soft_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.alt_soft_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.fd_auto_disengage
      = A380PrimComputerFg_U.in.fg_mode_logic.fd_auto_disengage;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.ap_fd_mode_reversion
      = A380PrimComputerFg_U.in.fg_mode_logic.ap_fd_mode_reversion;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.lateral_mode_reversion
      = A380PrimComputerFg_U.in.fg_mode_logic.lateral_mode_reversion;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_mode_reversion_vs
      = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_vs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_mode_reversion_op_clb
      = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_op_clb;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.pitch_fd_bars_flashing
      = A380PrimComputerFg_U.in.fg_mode_logic.pitch_fd_bars_flashing;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.roll_fd_bars_flashing
      = A380PrimComputerFg_U.in.fg_mode_logic.roll_fd_bars_flashing;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.loc_bc_selection
      = A380PrimComputerFg_U.in.fg_mode_logic.loc_bc_selection;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.vs_target_not_held
      = A380PrimComputerFg_U.in.fg_mode_logic.vs_target_not_held;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_vs_target =
      0.0;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_ra_corrective
      = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.active_tcas_submode
      = A380PrimComputerFg_U.in.fg_mode_logic.active_tcas_submode;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_alt_acq_cond
      = A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_acq_cond;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_alt_hold_cond
      = A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_hold_cond;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_ra_inhibited
      = A380PrimComputerFg_B.tcas_ra_inhibited;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.trk_fpa_deselected
      = A380PrimComputerFg_B.trk_fpa_deselected;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longi_large_box_tcas
      = A380PrimComputerFg_B.longi_large_box_tcas;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_2_capability
      = A380PrimComputerFg_U.in.fg_mode_logic.land_2_capability;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_passive_capability
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_capability;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_op_capability
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_capability;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_2_inop =
      A380PrimComputerFg_U.in.fg_mode_logic.land_2_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_passive_inop
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_op_inop
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tla_to_ga_set =
      A380PrimComputerFg_U.in.fg_mode_logic.tla_to_ga_set;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.true_active =
      A380PrimComputerFg_DWork.p_true_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.trk_fpa_active =
      A380PrimComputerFg_DWork.p_trk_fpa_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.metric_alt_active
      = A380PrimComputerFg_DWork.p_metric_alt_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.spd_mach_display_value
      = A380PrimComputerFg_DWork.pValue_e;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.spd_mach_dashes =
      A380PrimComputerFg_B.spd_mach_dashes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.hdg_trk_display_value
      = A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_display_value;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.hdg_trk_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_dashes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_display_value
      = A380PrimComputerFg_U.in.fg_mode_logic.alt_display_value;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.vs_fpa_display_value
      = A380PrimComputerFg_U.in.fg_mode_logic.vs_fpa_display_value;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.vs_fpa_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.vs_fpa_dashes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_laws =
      A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.discrete_outputs =
      A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.analog_outputs =
      A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.bus_outputs =
      A380PrimComputerFg_U.in.bus_outputs;
    rtb_y_be = (A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.hdg_active ||
                A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.trk_active);
    athrCondition = !rtb_y_be;
    A380PrimComputerFg_MATLABFunction_c((athrCondition && A380PrimComputerFg_B.any_ap_fd_engaged),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_o, &rtb_OR2, &A380PrimComputerFg_DWork.sf_MATLABFunction_cb);
    rtb_NOR_g = rtb_OR1_l0_tmp;
    A380PrimComputerFg_MATLABFunction_c((athrCondition &&
      (!A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available) && (!rtb_OR1_l0_tmp)),
      A380PrimComputerFg_P.PulseNode_isRisingEdge_ln, &rtb_NOR_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_ck);
    if (A380PrimComputerFg_B.fcu_1_chosen) {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2;
    } else {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2;
    }

    A380PrimComputerFg_MATLABFunction_g(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_p, &rtb_y_p);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_p, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_h);
    A380PrimComputerFg_MATLABFunction1
      (&A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1, (rtb_OR2 || rtb_NOR_g),
       (rtb_y_be || rtb_OR1_l0_tmp || (rtb_value_d != A380PrimComputerFg_P.CompareToConstant_const_m) ||
        A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available), &A380PrimComputerFg_B.hdg_trk_dashes,
       &A380PrimComputerFg_DWork.sf_MATLABFunction1_o);
    if (!A380PrimComputerFg_DWork.pValue_not_empty_a) {
      A380PrimComputerFg_DWork.pValue_i = A380PrimComputerFg_P.Constant_Value_c;
      A380PrimComputerFg_DWork.pValue_not_empty_a = true;
    }

    if (A380PrimComputerFg_B.hdg_trk_dashes) {
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

    if (A380PrimComputerFg_B.fcu_1_chosen) {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2;
    } else {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2;
    }

    A380PrimComputerFg_MATLABFunction_g(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_j, &rtb_y_p);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_p, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_n);
    if (A380PrimComputerFg_B.fcu_1_chosen) {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1;
    } else {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1;
    }

    A380PrimComputerFg_MATLABFunction_cr(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.BitfromLabel3_bit_o, &rtb_y);
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
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.data =
      A380PrimComputerFg_U.in.data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.general_logic =
      A380PrimComputerFg_U.in.general_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.flight_envelope =
      A380PrimComputerFg_U.in.flight_envelope;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.laws =
      A380PrimComputerFg_U.in.laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fctl_logic =
      A380PrimComputerFg_U.in.fctl_logic;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.gnd_eng_stop_flt_5s =
      A380PrimComputerFg_B.gnd_eng_stop_flt_5s;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_fd_common_condition
      = A380PrimComputerFg_B.ap_fd_common_condition;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_engaged =
      A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_engaged =
      A380PrimComputerFg_B.ap_1_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_engaged =
      A380PrimComputerFg_B.ap_2_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_engaged =
      A380PrimComputerFg_B.athr_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_1_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fd_2_inop = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_1_inop =
      A380PrimComputerFg_B.ap_1_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ap_2_inop =
      A380PrimComputerFg_B.ap_2_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.athr_inop =
      A380PrimComputerFg_B.athr_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fmgc_opp_priority =
      A380PrimComputerFg_U.in.fg_logic.fmgc_opp_priority;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.altitude_indicated_ft
      = A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.all_fcu_failure =
      A380PrimComputerFg_B.all_fcu_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_1_chosen =
      A380PrimComputerFg_B.fcu_1_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.fcu_2_chosen =
      A380PrimComputerFg_B.fcu_2_chosen;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_failure =
      A380PrimComputerFg_B.ils_failure;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.both_ils_valid =
      A380PrimComputerFg_B.both_ils_valid;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.SSM
      = A380PrimComputerFg_B.SSM_kxx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.runway_heading_deg.Data
      = A380PrimComputerFg_B.Data_fwx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.SSM
      = A380PrimComputerFg_B.SSM_kx;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.ils_frequency_mhz.Data
      = A380PrimComputerFg_B.Data_fw;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM_k;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.localizer_deviation_deg.Data
      = A380PrimComputerFg_B.Data_f;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM
      = A380PrimComputerFg_B.SSM;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_computation_data.glideslope_deviation_deg.Data
      = A380PrimComputerFg_B.Data;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.ils_tune_inhibit =
      A380PrimComputerFg_B.ils_tune_inhibit;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.rwy_hdg_memo =
      A380PrimComputerFg_B.u_l;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_failure = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_logic.tcas_mode_available =
      false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.lateral_modes =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_modes
      = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.armed_modes =
      A380PrimComputerFg_U.in.fg_mode_logic.armed_modes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.active_lateral_law
      = A380PrimComputerFg_U.in.fg_mode_logic.active_lateral_law;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.active_longitudinal_law
      = A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.auto_spd_control_active
      = A380PrimComputerFg_U.in.fg_mode_logic.auto_spd_control_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.manual_spd_control_active
      = A380PrimComputerFg_U.in.fg_mode_logic.manual_spd_control_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.mach_control_active
      = A380PrimComputerFg_B.mach_control_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_active =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_limited =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_limited;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alpha_floor_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.alpha_floor_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.thrust_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.thrust_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.thrust_target_idle
      = A380PrimComputerFg_U.in.fg_mode_logic.thrust_target_idle;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.speed_mach_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.speed_mach_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.retard_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.retard_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_fma_mode =
      A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_mode;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.athr_fma_message
      = A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_message;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.spd_target_kts =
      A380PrimComputerFg_U.in.fg_mode_logic.spd_target_kts;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.pfd_spd_target_kts
      = A380PrimComputerFg_U.in.fg_mode_logic.pfd_spd_target_kts;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_cstr_applicable
      = A380PrimComputerFg_B.alt_cstr_applicable;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_sel_or_cstr =
      A380PrimComputerFg_B.alt_sel_or_cstr;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.fmgc_opp_mode_sync
      = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.any_ap_fd_engaged
      = A380PrimComputerFg_B.any_ap_fd_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.any_lateral_mode_engaged
      = A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.any_longitudinal_mode_engaged
      = A380PrimComputerFg_U.in.fg_mode_logic.any_longitudinal_mode_engaged;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.lateral_mode_reset
      = A380PrimComputerFg_B.lateral_mode_reset;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_mode_reset
      = A380PrimComputerFg_B.lateral_mode_reset;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.hdg_trk_preset_available
      = A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_soft_mode_active
      = A380PrimComputerFg_U.in.fg_mode_logic.alt_soft_mode_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.fd_auto_disengage
      = A380PrimComputerFg_U.in.fg_mode_logic.fd_auto_disengage;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.ap_fd_mode_reversion
      = A380PrimComputerFg_U.in.fg_mode_logic.ap_fd_mode_reversion;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.lateral_mode_reversion
      = A380PrimComputerFg_U.in.fg_mode_logic.lateral_mode_reversion;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_mode_reversion_vs
      = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_vs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longitudinal_mode_reversion_op_clb
      = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_op_clb;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.pitch_fd_bars_flashing
      = A380PrimComputerFg_U.in.fg_mode_logic.pitch_fd_bars_flashing;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.roll_fd_bars_flashing
      = A380PrimComputerFg_U.in.fg_mode_logic.roll_fd_bars_flashing;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.loc_bc_selection
      = A380PrimComputerFg_U.in.fg_mode_logic.loc_bc_selection;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.vs_target_not_held
      = A380PrimComputerFg_U.in.fg_mode_logic.vs_target_not_held;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_vs_target =
      0.0;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_ra_corrective
      = false;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.active_tcas_submode
      = A380PrimComputerFg_U.in.fg_mode_logic.active_tcas_submode;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_alt_acq_cond
      = A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_acq_cond;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_alt_hold_cond
      = A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_hold_cond;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tcas_ra_inhibited
      = A380PrimComputerFg_B.tcas_ra_inhibited;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.trk_fpa_deselected
      = A380PrimComputerFg_B.trk_fpa_deselected;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.longi_large_box_tcas
      = A380PrimComputerFg_B.longi_large_box_tcas;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_2_capability
      = A380PrimComputerFg_U.in.fg_mode_logic.land_2_capability;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_passive_capability
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_capability;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_op_capability
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_capability;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_2_inop =
      A380PrimComputerFg_U.in.fg_mode_logic.land_2_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_passive_inop
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.land_3_fail_op_inop
      = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_inop;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.tla_to_ga_set =
      A380PrimComputerFg_U.in.fg_mode_logic.tla_to_ga_set;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.true_active =
      A380PrimComputerFg_DWork.p_true_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.trk_fpa_active =
      A380PrimComputerFg_DWork.p_trk_fpa_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.metric_alt_active
      = A380PrimComputerFg_DWork.p_metric_alt_active;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.spd_mach_display_value
      = A380PrimComputerFg_DWork.pValue_e;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.spd_mach_dashes =
      A380PrimComputerFg_B.spd_mach_dashes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.hdg_trk_display_value
      = A380PrimComputerFg_DWork.pValue_i;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.hdg_trk_dashes =
      A380PrimComputerFg_B.hdg_trk_dashes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.alt_display_value
      = A380PrimComputerFg_DWork.pValue_p;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.vs_fpa_display_value
      = A380PrimComputerFg_U.in.fg_mode_logic.vs_fpa_display_value;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_mode_logic.vs_fpa_dashes =
      A380PrimComputerFg_U.in.fg_mode_logic.vs_fpa_dashes;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.fg_laws =
      A380PrimComputerFg_U.in.fg_laws;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.discrete_outputs =
      A380PrimComputerFg_U.in.discrete_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.analog_outputs =
      A380PrimComputerFg_U.in.analog_outputs;
    A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1.bus_outputs =
      A380PrimComputerFg_U.in.bus_outputs;
    rtb_y_be = (A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.vs_active ||
                A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.fpa_active);
    A380PrimComputerFg_MATLABFunction_c(((!rtb_y_be) && A380PrimComputerFg_B.any_ap_fd_engaged),
      A380PrimComputerFg_P.PulseNode1_isRisingEdge_l, &rtb_Compare_of, &A380PrimComputerFg_DWork.sf_MATLABFunction_hq);
    rtb_NOR_g = rtb_OR1_l0_tmp;
    if (A380PrimComputerFg_B.fcu_1_chosen) {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2;
    } else {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic =
        A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2;
    }

    A380PrimComputerFg_MATLABFunction_g(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_ic,
      A380PrimComputerFg_P.A429ValueOrDefault_defaultValue_n, &rtb_y_p);
    A380PrimComputerFg_FCUKnobTurnsUnpack(rtb_y_p, &rtb_value_d, A380PrimComputerFg_P.FCUKnobTurnsUnpack_field_e);
    rtb_OR2 = (rtb_value_d != A380PrimComputerFg_P.CompareToConstant_const_mw);
    A380PrimComputerFg_MATLABFunction1
      (&A380PrimComputerFg_B.BusConversion_InsertedFor_APEngagedLogic_at_inport_6_BusCreator1, rtb_Compare_of, (rtb_y_be
        || rtb_OR1_l0_tmp || rtb_OR2), &A380PrimComputerFg_B.vs_fpa_dashes,
       &A380PrimComputerFg_DWork.sf_MATLABFunction1_d);
    A380PrimComputerFg_MATLABFunction_c(rtb_TmpBufferAtTmpGroundAtBusAssignmentInport3Outport1_c0,
      A380PrimComputerFg_P.PulseNode_isRisingEdge_d, &rtb_NOR_g, &A380PrimComputerFg_DWork.sf_MATLABFunction_fhn);
    A380PrimComputerFg_MATLABFunction_h(A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.tcas_active,
      A380PrimComputerFg_U.in.data.time.dt, &rtb_OR2, A380PrimComputerFg_P.MTrigNode1_isRisingEdge_m,
      A380PrimComputerFg_P.MTrigNode1_retriggerable_o, A380PrimComputerFg_P.MTrigNode1_triggerDuration_f,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_li);
    A380PrimComputerFg_MATLABFunction_c((rtb_y_be && rtb_OR2), A380PrimComputerFg_P.PulseNode3_isRisingEdge_l, &rtb_y_be,
      &A380PrimComputerFg_DWork.sf_MATLABFunction_gw);
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

    if (rtb_NOR_g || A380PrimComputerFg_B.vs_fpa_dashes) {
      A380PrimComputerFg_DWork.pValue = A380PrimComputerFg_P.Constant_Value_cu;
    }

    if (rtb_y_be && A380PrimComputerFg_B.tcas_ra_inhibited) {
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
    A380PrimComputerFg_B.vs_fpa_display_value = A380PrimComputerFg_DWork.pValue;
    A380PrimComputerFg_B.alt_display_value = A380PrimComputerFg_DWork.pValue_p;
    A380PrimComputerFg_B.hdg_trk_display_value = A380PrimComputerFg_DWork.pValue_i;
    A380PrimComputerFg_B.spd_mach_display_value = A380PrimComputerFg_DWork.pValue_e;
    A380PrimComputerFg_B.metric_alt_active = A380PrimComputerFg_DWork.p_metric_alt_active;
    A380PrimComputerFg_B.trk_fpa_active = A380PrimComputerFg_DWork.p_trk_fpa_active;
    A380PrimComputerFg_B.true_active = A380PrimComputerFg_DWork.p_true_active;
    A380PrimComputerFg_B.tcas_ra_corrective = false;
    A380PrimComputerFg_B.tcas_vs_target = 0.0;
    A380PrimComputerFg_B.longitudinal_mode_reset = A380PrimComputerFg_B.lateral_mode_reset;
    A380PrimComputerFg_B.fmgc_opp_mode_sync = false;
    A380PrimComputerFg_B.athr_active = (A380PrimComputerFg_B.athr_engaged &&
      (A380PrimComputerFg_B.alpha_floor_mode_active || ((A380PrimComputerFg_P.CompareToConstant_const_b <= 0.0) &&
      (A380PrimComputerFg_P.CompareToConstant2_const_kg >= 0.0) && (A380PrimComputerFg_P.CompareToConstant1_const_m <=
      0.0) && (A380PrimComputerFg_P.CompareToConstant3_const_e >= 0.0)) ||
       (A380PrimComputerFg_U.in.general_logic.one_engine_out && ((A380PrimComputerFg_P.CompareToConstant4_const_g < 0.0)
      && (A380PrimComputerFg_P.CompareToConstant6_const >= 0.0) && (A380PrimComputerFg_P.CompareToConstant5_const_p <
      0.0) && (A380PrimComputerFg_P.CompareToConstant7_const >= 0.0)))));
    A380PrimComputerFg_B.athr_limited = (A380PrimComputerFg_B.athr_active &&
      ((A380PrimComputerFg_P.CompareToConstant10_const > 0.0) || (A380PrimComputerFg_P.CompareToConstant11_const > 0.0) ||
       (A380PrimComputerFg_U.in.general_logic.one_engine_out && ((A380PrimComputerFg_P.CompareToConstant8_const > 0.0) ||
      (A380PrimComputerFg_P.CompareToConstant9_const > 0.0)))));
    A380PrimComputerFg_DWork.Delay_66_DSTATE = ((((A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.clb_active ||
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.op_clb_active) &&
      (A380PrimComputerFg_U.in.flight_envelope.v_max_kn + A380PrimComputerFg_P.Bias_Bias <
       A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn)) ||
      ((A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn <
        A380PrimComputerFg_U.in.flight_envelope.v_ls_kn + A380PrimComputerFg_P.Bias1_Bias) &&
       (A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.des_active ||
        A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.op_des_active))) &&
      ((!A380PrimComputerFg_B.ap_1_engaged) && (!A380PrimComputerFg_B.ap_2_engaged)) &&
      A380PrimComputerFg_B.athr_engaged && A380PrimComputerFg_B.fd_1_engaged);
    A380PrimComputerFg_B.fd_auto_disengage = A380PrimComputerFg_DWork.Delay_66_DSTATE;
    A380PrimComputerFg_B.fd_2_inop = false;
    A380PrimComputerFg_B.fd_1_inop = false;
    A380PrimComputerFg_B.fd_2_engaged = A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_B.tcas_mode_available = false;
    A380PrimComputerFg_B.tcas_failure = false;
    A380PrimComputerFg_B.rwy_hdg_memo = A380PrimComputerFg_B.u_l;
    A380PrimComputerFg_B.thrust_target_idle = (A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.des_active ||
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.op_des_active ||
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.final_des_active);
    A380PrimComputerFg_B.dt = A380PrimComputerFg_U.in.data.time.dt;
    A380PrimComputerFg_B.prim_overhead_button_pressed =
      A380PrimComputerFg_U.in.data.discrete_inputs.prim_overhead_button_pressed;
    A380PrimComputerFg_B.SSM_kxxt =
      A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFg_B.fqms = A380PrimComputerFg_U.in.data.adcn_inputs.fqms;
    A380PrimComputerFg_B.SSM_kxxta = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg.SSM;
    A380PrimComputerFg_B.Data_fwxk = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_tla_deg.Data;
    A380PrimComputerFg_B.SSM_kxxtac = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_ref_percent.SSM;
    A380PrimComputerFg_B.Data_fwxkf = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_ref_percent.Data;
    A380PrimComputerFg_B.SSM_kxxtac0 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_flex_temp_deg.SSM;
    A380PrimComputerFg_B.Data_fwxkft = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_flex_temp_deg.Data;
    A380PrimComputerFg_B.SSM_kxxtac0z = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_status_word_1.SSM;
    A380PrimComputerFg_B.Data_fwxkftc = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_status_word_1.Data;
    A380PrimComputerFg_B.SSM_kxxtac0zt = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_status_word_2.SSM;
    A380PrimComputerFg_B.Data_fwxkftc3 =
      A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFg_B.Data_fwxkftc3e = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_status_word_2.Data;
    A380PrimComputerFg_B.SSM_kxxtac0ztg = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_status_word_3.SSM;
    A380PrimComputerFg_B.Data_fwxkftc3ep = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_status_word_3.Data;
    A380PrimComputerFg_B.SSM_kxxtac0ztgf = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_limit_percent.SSM;
    A380PrimComputerFg_B.Data_fwxkftc3epg = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_limit_percent.Data;
    A380PrimComputerFg_B.SSM_kxxtac0ztgf2 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_maximum_percent.SSM;
    A380PrimComputerFg_B.Data_fwxkftc3epgt = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_maximum_percent.Data;
    A380PrimComputerFg_B.SSM_kxxtac0ztgf2u = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_command_percent.SSM;
    A380PrimComputerFg_B.Data_fwxkftc3epgtd = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.n1_command_percent.Data;
    A380PrimComputerFg_B.SSM_kxxtac0ztgf2ux =
      A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_n2_actual_percent.SSM;
    A380PrimComputerFg_B.SSM_kxxtac0ztgf2uxn =
      A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
    A380PrimComputerFg_B.Data_fwxkftc3epgtdx =
      A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_n2_actual_percent.Data;
    A380PrimComputerFg_B.SSM_ky = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_n1_actual_percent.SSM;
    A380PrimComputerFg_B.Data_fwxkftc3epgtdxc =
      A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.selected_n1_actual_percent.Data;
    A380PrimComputerFg_B.SSM_d = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_maintenance_word_6.SSM;
    A380PrimComputerFg_B.Data_h = A380PrimComputerFg_U.in.data.adcn_inputs.eec_1.ecu_maintenance_word_6.Data;
    A380PrimComputerFg_B.SSM_h = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg.SSM;
    A380PrimComputerFg_B.Data_e = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_tla_deg.Data;
    A380PrimComputerFg_B.SSM_kb = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_ref_percent.SSM;
    A380PrimComputerFg_B.Data_j = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_ref_percent.Data;
    A380PrimComputerFg_B.SSM_p = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_flex_temp_deg.SSM;
    A380PrimComputerFg_B.Data_d = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    A380PrimComputerFg_B.Data_p = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_flex_temp_deg.Data;
    A380PrimComputerFg_B.SSM_di = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_status_word_1.SSM;
    A380PrimComputerFg_B.Data_i = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_status_word_1.Data;
    A380PrimComputerFg_B.SSM_j = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_status_word_2.SSM;
    A380PrimComputerFg_B.Data_g = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_status_word_2.Data;
    A380PrimComputerFg_B.SSM_i = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_status_word_3.SSM;
    A380PrimComputerFg_B.Data_a = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_status_word_3.Data;
    A380PrimComputerFg_B.SSM_g = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_limit_percent.SSM;
    A380PrimComputerFg_B.Data_eb = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_limit_percent.Data;
    A380PrimComputerFg_B.SSM_db = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_maximum_percent.SSM;
    A380PrimComputerFg_B.SSM_n = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft.SSM;
    A380PrimComputerFg_B.Data_jo = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_maximum_percent.Data;
    A380PrimComputerFg_B.SSM_a = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_command_percent.SSM;
    A380PrimComputerFg_B.Data_ex = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.n1_command_percent.Data;
    A380PrimComputerFg_B.SSM_ir = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_n2_actual_percent.SSM;
    A380PrimComputerFg_B.Data_fd = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_n2_actual_percent.Data;
    A380PrimComputerFg_B.SSM_hu = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_n1_actual_percent.SSM;
    A380PrimComputerFg_B.Data_ja = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.selected_n1_actual_percent.Data;
    A380PrimComputerFg_B.SSM_e = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_maintenance_word_6.SSM;
    A380PrimComputerFg_B.Data_k = A380PrimComputerFg_U.in.data.adcn_inputs.eec_2.ecu_maintenance_word_6.Data;
    A380PrimComputerFg_B.SSM_gr = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg.SSM;
    A380PrimComputerFg_B.Data_joy = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft.Data;
    A380PrimComputerFg_B.Data_h3 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_tla_deg.Data;
    A380PrimComputerFg_B.SSM_ev = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_ref_percent.SSM;
    A380PrimComputerFg_B.Data_a0 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_ref_percent.Data;
    A380PrimComputerFg_B.SSM_l = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_flex_temp_deg.SSM;
    A380PrimComputerFg_B.Data_b = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_flex_temp_deg.Data;
    A380PrimComputerFg_B.SSM_ei = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_status_word_1.SSM;
    A380PrimComputerFg_B.Data_eq = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_status_word_1.Data;
    A380PrimComputerFg_B.SSM_an = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_status_word_2.SSM;
    A380PrimComputerFg_B.Data_iz = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_status_word_2.Data;
    A380PrimComputerFg_B.SSM_c = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_status_word_3.SSM;
    A380PrimComputerFg_B.SSM_cb = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft.SSM;
    A380PrimComputerFg_B.Data_j2 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_status_word_3.Data;
    A380PrimComputerFg_B.SSM_lb = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_limit_percent.SSM;
    A380PrimComputerFg_B.Data_o = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_limit_percent.Data;
    A380PrimComputerFg_B.SSM_ia = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_maximum_percent.SSM;
    A380PrimComputerFg_B.Data_m = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_maximum_percent.Data;
    A380PrimComputerFg_B.SSM_kyz = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_command_percent.SSM;
    A380PrimComputerFg_B.Data_oq = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.n1_command_percent.Data;
    A380PrimComputerFg_B.SSM_as = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_n2_actual_percent.SSM;
    A380PrimComputerFg_B.Data_fo = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_n2_actual_percent.Data;
    A380PrimComputerFg_B.SSM_is = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_n1_actual_percent.SSM;
    A380PrimComputerFg_B.Data_p1 = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft.Data;
    A380PrimComputerFg_B.Data_p1y = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.selected_n1_actual_percent.Data;
    A380PrimComputerFg_B.SSM_ca = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_maintenance_word_6.SSM;
    A380PrimComputerFg_B.Data_l = A380PrimComputerFg_U.in.data.adcn_inputs.eec_3.ecu_maintenance_word_6.Data;
    A380PrimComputerFg_B.SSM_o = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg.SSM;
    A380PrimComputerFg_B.Data_kp = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_tla_deg.Data;
    A380PrimComputerFg_B.SSM_ak = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_ref_percent.SSM;
    A380PrimComputerFg_B.Data_k0 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_ref_percent.Data;
    A380PrimComputerFg_B.SSM_cbj = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_flex_temp_deg.SSM;
    A380PrimComputerFg_B.Data_pi = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_flex_temp_deg.Data;
    A380PrimComputerFg_B.SSM_cu = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_status_word_1.SSM;
    A380PrimComputerFg_B.SSM_nn = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.mach.SSM;
    A380PrimComputerFg_B.Data_dm = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_status_word_1.Data;
    A380PrimComputerFg_B.SSM_b = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_status_word_2.SSM;
    A380PrimComputerFg_B.Data_f5 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_status_word_2.Data;
    A380PrimComputerFg_B.SSM_m = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_status_word_3.SSM;
    A380PrimComputerFg_B.Data_js = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_status_word_3.Data;
    A380PrimComputerFg_B.SSM_f = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_limit_percent.SSM;
    A380PrimComputerFg_B.Data_ee = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_limit_percent.Data;
    A380PrimComputerFg_B.SSM_bp = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_maximum_percent.SSM;
    A380PrimComputerFg_B.Data_ig = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_maximum_percent.Data;
    A380PrimComputerFg_B.SSM_hb = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_command_percent.SSM;
    A380PrimComputerFg_B.Data_mk = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.mach.Data;
    A380PrimComputerFg_B.Data_pu = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.n1_command_percent.Data;
    A380PrimComputerFg_B.SSM_gz = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_n2_actual_percent.SSM;
    A380PrimComputerFg_B.Data_ly = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_n2_actual_percent.Data;
    A380PrimComputerFg_B.SSM_pv = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_n1_actual_percent.SSM;
    A380PrimComputerFg_B.Data_jq = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.selected_n1_actual_percent.Data;
    A380PrimComputerFg_B.SSM_mf = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_maintenance_word_6.SSM;
    A380PrimComputerFg_B.Data_o5 = A380PrimComputerFg_U.in.data.adcn_inputs.eec_4.ecu_maintenance_word_6.Data;
    A380PrimComputerFg_B.on_ground = A380PrimComputerFg_U.in.general_logic.on_ground;
    A380PrimComputerFg_B.tracking_mode_on = A380PrimComputerFg_U.in.general_logic.tracking_mode_on;
    A380PrimComputerFg_B.double_adr_failure = A380PrimComputerFg_U.in.general_logic.double_adr_failure;
    A380PrimComputerFg_B.is_unit_1 = A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_1;
    A380PrimComputerFg_B.SSM_m0 = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFg_B.triple_adr_failure = A380PrimComputerFg_U.in.general_logic.triple_adr_failure;
    A380PrimComputerFg_B.cas_or_mach_disagree = A380PrimComputerFg_U.in.general_logic.cas_or_mach_disagree;
    A380PrimComputerFg_B.alpha_disagree = A380PrimComputerFg_U.in.general_logic.alpha_disagree;
    A380PrimComputerFg_B.double_ir_failure = A380PrimComputerFg_U.in.general_logic.double_ir_failure;
    A380PrimComputerFg_B.triple_ir_failure = A380PrimComputerFg_U.in.general_logic.triple_ir_failure;
    A380PrimComputerFg_B.ir_failure_not_self_detected =
      A380PrimComputerFg_U.in.general_logic.ir_failure_not_self_detected;
    A380PrimComputerFg_B.V_ias_kn = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_ias_kn;
    A380PrimComputerFg_B.V_tas_kn = A380PrimComputerFg_U.in.general_logic.adr_computation_data.V_tas_kn;
    A380PrimComputerFg_B.mach = A380PrimComputerFg_U.in.general_logic.adr_computation_data.mach;
    A380PrimComputerFg_B.alpha_deg = A380PrimComputerFg_U.in.general_logic.adr_computation_data.alpha_deg;
    A380PrimComputerFg_B.Data_lyw = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
    A380PrimComputerFg_B.p_s_c_hpa = A380PrimComputerFg_U.in.general_logic.adr_computation_data.p_s_c_hpa;
    A380PrimComputerFg_B.altitude_standard_ft =
      A380PrimComputerFg_U.in.general_logic.adr_computation_data.altitude_standard_ft;
    A380PrimComputerFg_B.theta_deg = A380PrimComputerFg_U.in.general_logic.ir_computation_data.theta_deg;
    A380PrimComputerFg_B.phi_deg = A380PrimComputerFg_U.in.general_logic.ir_computation_data.phi_deg;
    A380PrimComputerFg_B.q_deg_s = A380PrimComputerFg_U.in.general_logic.ir_computation_data.q_deg_s;
    A380PrimComputerFg_B.r_deg_s = A380PrimComputerFg_U.in.general_logic.ir_computation_data.r_deg_s;
    A380PrimComputerFg_B.n_x_g = A380PrimComputerFg_U.in.general_logic.ir_computation_data.n_x_g;
    A380PrimComputerFg_B.n_y_g = A380PrimComputerFg_U.in.general_logic.ir_computation_data.n_y_g;
    A380PrimComputerFg_B.n_z_g = A380PrimComputerFg_U.in.general_logic.ir_computation_data.n_z_g;
    A380PrimComputerFg_B.theta_dot_deg_s = A380PrimComputerFg_U.in.general_logic.ir_computation_data.theta_dot_deg_s;
    A380PrimComputerFg_B.SSM_kd = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
    A380PrimComputerFg_B.phi_dot_deg_s = A380PrimComputerFg_U.in.general_logic.ir_computation_data.phi_dot_deg_s;
    A380PrimComputerFg_B.ra_computation_data_ft = A380PrimComputerFg_U.in.general_logic.ra_computation_data_ft;
    A380PrimComputerFg_B.two_ra_failure = A380PrimComputerFg_U.in.general_logic.two_ra_failure;
    A380PrimComputerFg_B.all_ra_failure = A380PrimComputerFg_U.in.general_logic.all_ra_failure;
    A380PrimComputerFg_B.all_sfcc_lost = A380PrimComputerFg_U.in.general_logic.all_sfcc_lost;
    A380PrimComputerFg_B.flap_handle_index = A380PrimComputerFg_U.in.general_logic.flap_handle_index;
    A380PrimComputerFg_B.flap_angle_deg = A380PrimComputerFg_U.in.general_logic.flap_angle_deg;
    A380PrimComputerFg_B.slat_angle_deg = A380PrimComputerFg_U.in.general_logic.slat_angle_deg;
    A380PrimComputerFg_B.slat_flap_actual_pos = A380PrimComputerFg_U.in.general_logic.slat_flap_actual_pos;
    A380PrimComputerFg_B.flap_surface_angle_deg = A380PrimComputerFg_U.in.general_logic.flap_surface_angle_deg;
    A380PrimComputerFg_B.Data_gq = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
    A380PrimComputerFg_B.slat_surface_angle_deg = A380PrimComputerFg_U.in.general_logic.slat_surface_angle_deg;
    A380PrimComputerFg_B.double_lgciu_failure = A380PrimComputerFg_U.in.general_logic.double_lgciu_failure;
    A380PrimComputerFg_B.slats_locked = A380PrimComputerFg_U.in.general_logic.slats_locked;
    A380PrimComputerFg_B.flaps_locked = A380PrimComputerFg_U.in.general_logic.flaps_locked;
    A380PrimComputerFg_B.landing_gear_down = A380PrimComputerFg_U.in.general_logic.landing_gear_down;
    A380PrimComputerFg_B.one_engine_out = A380PrimComputerFg_U.in.general_logic.one_engine_out;
    A380PrimComputerFg_B.engine_running = A380PrimComputerFg_U.in.general_logic.engine_running;
    A380PrimComputerFg_B.is_yellow_hydraulic_power_avail =
      A380PrimComputerFg_U.in.general_logic.is_yellow_hydraulic_power_avail;
    A380PrimComputerFg_B.is_green_hydraulic_power_avail =
      A380PrimComputerFg_U.in.general_logic.is_green_hydraulic_power_avail;
    A380PrimComputerFg_B.beta_target_deg = A380PrimComputerFg_U.in.flight_envelope.beta_target_deg;
    A380PrimComputerFg_B.SSM_pu = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFg_B.beta_target_visible = A380PrimComputerFg_U.in.flight_envelope.beta_target_visible;
    A380PrimComputerFg_B.alpha_floor_condition = A380PrimComputerFg_U.in.flight_envelope.alpha_floor_condition;
    A380PrimComputerFg_B.computed_weight_lbs = A380PrimComputerFg_U.in.flight_envelope.computed_weight_lbs;
    A380PrimComputerFg_B.computed_cg_percent = A380PrimComputerFg_U.in.flight_envelope.computed_cg_percent;
    A380PrimComputerFg_B.speed_scale_lost = A380PrimComputerFg_U.in.flight_envelope.speed_scale_lost;
    A380PrimComputerFg_B.speed_scale_visible = A380PrimComputerFg_U.in.flight_envelope.speed_scale_visible;
    A380PrimComputerFg_B.v_ls_kn = A380PrimComputerFg_U.in.flight_envelope.v_ls_kn;
    A380PrimComputerFg_B.v_stall_kn = A380PrimComputerFg_U.in.flight_envelope.v_stall_kn;
    A380PrimComputerFg_B.v_3_kn = A380PrimComputerFg_U.in.flight_envelope.v_3_kn;
    A380PrimComputerFg_B.v_3_visible = A380PrimComputerFg_U.in.flight_envelope.v_3_visible;
    A380PrimComputerFg_B.Data_n = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFg_B.v_4_kn = A380PrimComputerFg_U.in.flight_envelope.v_4_kn;
    A380PrimComputerFg_B.v_4_visible = A380PrimComputerFg_U.in.flight_envelope.v_4_visible;
    A380PrimComputerFg_B.v_man_kn = A380PrimComputerFg_U.in.flight_envelope.v_man_kn;
    A380PrimComputerFg_B.v_man_visible = A380PrimComputerFg_U.in.flight_envelope.v_man_visible;
    A380PrimComputerFg_B.v_max_kn = A380PrimComputerFg_U.in.flight_envelope.v_max_kn;
    A380PrimComputerFg_B.v_fe_next_kn = A380PrimComputerFg_U.in.flight_envelope.v_fe_next_kn;
    A380PrimComputerFg_B.v_fe_next_visible = A380PrimComputerFg_U.in.flight_envelope.v_fe_next_visible;
    A380PrimComputerFg_B.v_c_trend_kn = A380PrimComputerFg_U.in.flight_envelope.v_c_trend_kn;
    A380PrimComputerFg_B.gamma_a_deg = A380PrimComputerFg_U.in.flight_envelope.gamma_a_deg;
    A380PrimComputerFg_B.gamma_t_deg = A380PrimComputerFg_U.in.flight_envelope.gamma_t_deg;
    A380PrimComputerFg_B.SSM_nv = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFg_B.pitch_pitch_warning_active = A380PrimComputerFg_U.in.flight_envelope.pitch_pitch_warning_active;
    A380PrimComputerFg_B.low_energy_warning_active = A380PrimComputerFg_U.in.flight_envelope.low_energy_warning_active;
    A380PrimComputerFg_B.left_inboard_aileron_deg =
      A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_inboard_aileron_deg;
    A380PrimComputerFg_B.right_inboard_aileron_deg =
      A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_inboard_aileron_deg;
    A380PrimComputerFg_B.left_midboard_aileron_deg =
      A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_midboard_aileron_deg;
    A380PrimComputerFg_B.right_midboard_aileron_deg =
      A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_midboard_aileron_deg;
    A380PrimComputerFg_B.left_outboard_aileron_deg =
      A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_outboard_aileron_deg;
    A380PrimComputerFg_B.right_outboard_aileron_deg =
      A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_outboard_aileron_deg;
    A380PrimComputerFg_B.left_spoiler_1_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_1_deg;
    A380PrimComputerFg_B.right_spoiler_1_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_1_deg;
    A380PrimComputerFg_B.Data_bq = A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    A380PrimComputerFg_B.left_spoiler_2_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_2_deg;
    A380PrimComputerFg_B.right_spoiler_2_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_2_deg;
    A380PrimComputerFg_B.left_spoiler_3_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_3_deg;
    A380PrimComputerFg_B.right_spoiler_3_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_3_deg;
    A380PrimComputerFg_B.left_spoiler_4_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_4_deg;
    A380PrimComputerFg_B.right_spoiler_4_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_4_deg;
    A380PrimComputerFg_B.left_spoiler_5_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_5_deg;
    A380PrimComputerFg_B.right_spoiler_5_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_5_deg;
    A380PrimComputerFg_B.left_spoiler_6_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_6_deg;
    A380PrimComputerFg_B.right_spoiler_6_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_6_deg;
    A380PrimComputerFg_B.SSM_d5 =
      A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFg_B.left_spoiler_7_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_7_deg;
    A380PrimComputerFg_B.right_spoiler_7_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_7_deg;
    A380PrimComputerFg_B.left_spoiler_8_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.left_spoiler_8_deg;
    A380PrimComputerFg_B.right_spoiler_8_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.right_spoiler_8_deg;
    A380PrimComputerFg_B.upper_rudder_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.upper_rudder_deg;
    A380PrimComputerFg_B.lower_rudder_deg = A380PrimComputerFg_U.in.laws.lateral_law_outputs.lower_rudder_deg;
    A380PrimComputerFg_B.left_inboard_elevator_deg =
      A380PrimComputerFg_U.in.laws.pitch_law_outputs.left_inboard_elevator_deg;
    A380PrimComputerFg_B.right_inboard_elevator_deg =
      A380PrimComputerFg_U.in.laws.pitch_law_outputs.right_inboard_elevator_deg;
    A380PrimComputerFg_B.left_outboard_elevator_deg =
      A380PrimComputerFg_U.in.laws.pitch_law_outputs.left_outboard_elevator_deg;
    A380PrimComputerFg_B.right_outboard_elevator_deg =
      A380PrimComputerFg_U.in.laws.pitch_law_outputs.right_outboard_elevator_deg;
    A380PrimComputerFg_B.Data_dmn =
      A380PrimComputerFg_U.in.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFg_B.ths_deg = A380PrimComputerFg_U.in.laws.pitch_law_outputs.ths_deg;
    A380PrimComputerFg_B.left_inboard_aileron_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.left_inboard_aileron_engaged;
    A380PrimComputerFg_B.right_inboard_aileron_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.right_inboard_aileron_engaged;
    A380PrimComputerFg_B.left_midboard_aileron_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.left_midboard_aileron_engaged;
    A380PrimComputerFg_B.right_midboard_aileron_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.right_midboard_aileron_engaged;
    A380PrimComputerFg_B.left_outboard_aileron_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.left_outboard_aileron_engaged;
    A380PrimComputerFg_B.right_outboard_aileron_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.right_outboard_aileron_engaged;
    A380PrimComputerFg_B.spoiler_pair_1_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_1_engaged;
    A380PrimComputerFg_B.spoiler_pair_2_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_2_engaged;
    A380PrimComputerFg_B.spoiler_pair_3_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_3_engaged;
    A380PrimComputerFg_B.is_unit_2 = A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_2;
    A380PrimComputerFg_B.SSM_eo = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
    A380PrimComputerFg_B.spoiler_pair_4_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_4_engaged;
    A380PrimComputerFg_B.spoiler_pair_5_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_5_engaged;
    A380PrimComputerFg_B.spoiler_pair_6_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_6_engaged;
    A380PrimComputerFg_B.spoiler_pair_7_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_7_engaged;
    A380PrimComputerFg_B.spoiler_pair_8_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.spoiler_pair_8_engaged;
    A380PrimComputerFg_B.left_inboard_elevator_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.left_inboard_elevator_engaged;
    A380PrimComputerFg_B.right_inboard_elevator_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.right_inboard_elevator_engaged;
    A380PrimComputerFg_B.left_outboard_elevator_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.left_outboard_elevator_engaged;
    A380PrimComputerFg_B.right_outboard_elevator_engaged =
      A380PrimComputerFg_U.in.fctl_logic.surface_statuses.right_outboard_elevator_engaged;
    A380PrimComputerFg_B.ths_engaged = A380PrimComputerFg_U.in.fctl_logic.surface_statuses.ths_engaged;
    A380PrimComputerFg_B.Data_jn = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
    A380PrimComputerFg_B.upper_rudder_engaged = A380PrimComputerFg_U.in.fctl_logic.surface_statuses.upper_rudder_engaged;
    A380PrimComputerFg_B.lower_rudder_engaged = A380PrimComputerFg_U.in.fctl_logic.surface_statuses.lower_rudder_engaged;
    A380PrimComputerFg_B.left_inboard_aileron_deg_g =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg;
    A380PrimComputerFg_B.right_inboard_aileron_deg_b =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg;
    A380PrimComputerFg_B.left_midboard_aileron_deg_f =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg;
    A380PrimComputerFg_B.right_midboard_aileron_deg_f =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg;
    A380PrimComputerFg_B.left_outboard_aileron_deg_g =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg;
    A380PrimComputerFg_B.right_outboard_aileron_deg_m =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg;
    A380PrimComputerFg_B.left_spoiler_1_deg_b =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_1_deg;
    A380PrimComputerFg_B.right_spoiler_1_deg_o =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_1_deg;
    A380PrimComputerFg_B.SSM_nd = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
    A380PrimComputerFg_B.left_spoiler_2_deg_i =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_2_deg;
    A380PrimComputerFg_B.right_spoiler_2_deg_g =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_2_deg;
    A380PrimComputerFg_B.left_spoiler_3_deg_i =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_3_deg;
    A380PrimComputerFg_B.right_spoiler_3_deg_b =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_3_deg;
    A380PrimComputerFg_B.left_spoiler_4_deg_g =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_4_deg;
    A380PrimComputerFg_B.right_spoiler_4_deg_a =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_4_deg;
    A380PrimComputerFg_B.left_spoiler_5_deg_d =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_5_deg;
    A380PrimComputerFg_B.right_spoiler_5_deg_m =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_5_deg;
    A380PrimComputerFg_B.left_spoiler_6_deg_o =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_6_deg;
    A380PrimComputerFg_B.right_spoiler_6_deg_d =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_6_deg;
    A380PrimComputerFg_B.Data_c = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.latitude_deg.Data;
    A380PrimComputerFg_B.left_spoiler_7_deg_a =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_7_deg;
    A380PrimComputerFg_B.right_spoiler_7_deg_j =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_7_deg;
    A380PrimComputerFg_B.left_spoiler_8_deg_h =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.left_spoiler_8_deg;
    A380PrimComputerFg_B.right_spoiler_8_deg_j =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.right_spoiler_8_deg;
    A380PrimComputerFg_B.upper_rudder_deg_m =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.upper_rudder_deg;
    A380PrimComputerFg_B.lower_rudder_deg_c =
      A380PrimComputerFg_U.in.fctl_logic.lateral_surface_positions.lower_rudder_deg;
    A380PrimComputerFg_B.left_inboard_elevator_deg_k =
      A380PrimComputerFg_U.in.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg;
    A380PrimComputerFg_B.right_inboard_elevator_deg_o =
      A380PrimComputerFg_U.in.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg;
    A380PrimComputerFg_B.left_outboard_elevator_deg_p =
      A380PrimComputerFg_U.in.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg;
    A380PrimComputerFg_B.right_outboard_elevator_deg_g =
      A380PrimComputerFg_U.in.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg;
    A380PrimComputerFg_B.SSM_bq = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
    A380PrimComputerFg_B.ths_deg_o = A380PrimComputerFg_U.in.fctl_logic.pitch_surface_positions.ths_deg;
    A380PrimComputerFg_B.lateral_law_capability = A380PrimComputerFg_U.in.fctl_logic.lateral_law_capability;
    A380PrimComputerFg_B.active_lateral_law_n = A380PrimComputerFg_U.in.fctl_logic.active_lateral_law;
    A380PrimComputerFg_B.pitch_law_capability = A380PrimComputerFg_U.in.fctl_logic.pitch_law_capability;
    A380PrimComputerFg_B.active_pitch_law = A380PrimComputerFg_U.in.fctl_logic.active_pitch_law;
    A380PrimComputerFg_B.abnormal_condition_law_active =
      A380PrimComputerFg_U.in.fctl_logic.abnormal_condition_law_active;
    A380PrimComputerFg_B.is_master_prim = A380PrimComputerFg_U.in.fctl_logic.is_master_prim;
    A380PrimComputerFg_B.elevator_1_avail = A380PrimComputerFg_U.in.fctl_logic.elevator_1_avail;
    A380PrimComputerFg_B.elevator_1_engaged = A380PrimComputerFg_U.in.fctl_logic.elevator_1_engaged;
    A380PrimComputerFg_B.elevator_2_avail = A380PrimComputerFg_U.in.fctl_logic.elevator_2_avail;
    A380PrimComputerFg_B.Data_lx = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.longitude_deg.Data;
    A380PrimComputerFg_B.elevator_2_engaged = A380PrimComputerFg_U.in.fctl_logic.elevator_2_engaged;
    A380PrimComputerFg_B.elevator_3_avail = A380PrimComputerFg_U.in.fctl_logic.elevator_3_avail;
    A380PrimComputerFg_B.elevator_3_engaged = A380PrimComputerFg_U.in.fctl_logic.elevator_3_engaged;
    A380PrimComputerFg_B.ths_avail = A380PrimComputerFg_U.in.fctl_logic.ths_avail;
    A380PrimComputerFg_B.ths_engaged_h = A380PrimComputerFg_U.in.fctl_logic.ths_engaged;
    A380PrimComputerFg_B.left_aileron_1_avail = A380PrimComputerFg_U.in.fctl_logic.left_aileron_1_avail;
    A380PrimComputerFg_B.left_aileron_1_engaged = A380PrimComputerFg_U.in.fctl_logic.left_aileron_1_engaged;
    A380PrimComputerFg_B.left_aileron_2_avail = A380PrimComputerFg_U.in.fctl_logic.left_aileron_2_avail;
    A380PrimComputerFg_B.left_aileron_2_engaged = A380PrimComputerFg_U.in.fctl_logic.left_aileron_2_engaged;
    A380PrimComputerFg_B.right_aileron_1_avail = A380PrimComputerFg_U.in.fctl_logic.right_aileron_1_avail;
    A380PrimComputerFg_B.SSM_hi = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
    A380PrimComputerFg_B.right_aileron_1_engaged = A380PrimComputerFg_U.in.fctl_logic.right_aileron_1_engaged;
    A380PrimComputerFg_B.right_aileron_2_avail = A380PrimComputerFg_U.in.fctl_logic.right_aileron_2_avail;
    A380PrimComputerFg_B.right_aileron_2_engaged = A380PrimComputerFg_U.in.fctl_logic.right_aileron_2_engaged;
    A380PrimComputerFg_B.left_spoiler_hydraulic_mode_avail =
      A380PrimComputerFg_U.in.fctl_logic.left_spoiler_hydraulic_mode_avail;
    A380PrimComputerFg_B.left_spoiler_electric_mode_avail =
      A380PrimComputerFg_U.in.fctl_logic.left_spoiler_electric_mode_avail;
    A380PrimComputerFg_B.left_spoiler_hydraulic_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.left_spoiler_hydraulic_mode_engaged;
    A380PrimComputerFg_B.left_spoiler_electric_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.left_spoiler_electric_mode_engaged;
    A380PrimComputerFg_B.right_spoiler_hydraulic_mode_avail =
      A380PrimComputerFg_U.in.fctl_logic.right_spoiler_hydraulic_mode_avail;
    A380PrimComputerFg_B.right_spoiler_electric_mode_avail =
      A380PrimComputerFg_U.in.fctl_logic.right_spoiler_electric_mode_avail;
    A380PrimComputerFg_B.right_spoiler_hydraulic_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.right_spoiler_hydraulic_mode_engaged;
    A380PrimComputerFg_B.Data_jb = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
    A380PrimComputerFg_B.right_spoiler_electric_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.right_spoiler_electric_mode_engaged;
    A380PrimComputerFg_B.rudder_1_hydraulic_mode_avail =
      A380PrimComputerFg_U.in.fctl_logic.rudder_1_hydraulic_mode_avail;
    A380PrimComputerFg_B.rudder_1_electric_mode_avail = A380PrimComputerFg_U.in.fctl_logic.rudder_1_electric_mode_avail;
    A380PrimComputerFg_B.rudder_1_hydraulic_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.rudder_1_hydraulic_mode_engaged;
    A380PrimComputerFg_B.rudder_1_electric_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.rudder_1_electric_mode_engaged;
    A380PrimComputerFg_B.rudder_2_hydraulic_mode_avail =
      A380PrimComputerFg_U.in.fctl_logic.rudder_2_hydraulic_mode_avail;
    A380PrimComputerFg_B.rudder_2_electric_mode_avail = A380PrimComputerFg_U.in.fctl_logic.rudder_2_electric_mode_avail;
    A380PrimComputerFg_B.rudder_2_hydraulic_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.rudder_2_hydraulic_mode_engaged;
    A380PrimComputerFg_B.rudder_2_electric_mode_engaged =
      A380PrimComputerFg_U.in.fctl_logic.rudder_2_electric_mode_engaged;
    A380PrimComputerFg_B.aileron_droop_active = A380PrimComputerFg_U.in.fctl_logic.aileron_droop_active;
    A380PrimComputerFg_B.SSM_mm = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
    A380PrimComputerFg_B.aileron_antidroop_active = A380PrimComputerFg_U.in.fctl_logic.aileron_antidroop_active;
    A380PrimComputerFg_B.ths_automatic_mode_active = A380PrimComputerFg_U.in.fctl_logic.ths_automatic_mode_active;
    A380PrimComputerFg_B.ths_manual_mode_c_deg_s = A380PrimComputerFg_U.in.fctl_logic.ths_manual_mode_c_deg_s;
    A380PrimComputerFg_B.eha_ebha_elec_mode_inhibited = A380PrimComputerFg_U.in.fctl_logic.eha_ebha_elec_mode_inhibited;
    A380PrimComputerFg_B.left_sidestick_disabled = A380PrimComputerFg_U.in.fctl_logic.left_sidestick_disabled;
    A380PrimComputerFg_B.right_sidestick_disabled = A380PrimComputerFg_U.in.fctl_logic.right_sidestick_disabled;
    A380PrimComputerFg_B.left_sidestick_priority_locked =
      A380PrimComputerFg_U.in.fctl_logic.left_sidestick_priority_locked;
    A380PrimComputerFg_B.right_sidestick_priority_locked =
      A380PrimComputerFg_U.in.fctl_logic.right_sidestick_priority_locked;
    A380PrimComputerFg_B.total_sidestick_pitch_command =
      A380PrimComputerFg_U.in.fctl_logic.total_sidestick_pitch_command;
    A380PrimComputerFg_B.total_sidestick_roll_command = A380PrimComputerFg_U.in.fctl_logic.total_sidestick_roll_command;
    A380PrimComputerFg_B.Data_fn = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
    A380PrimComputerFg_B.speed_brake_inhibited = A380PrimComputerFg_U.in.fctl_logic.speed_brake_inhibited;
    A380PrimComputerFg_B.speed_brake_command_deg = A380PrimComputerFg_U.in.fctl_logic.speed_brake_command_deg;
    A380PrimComputerFg_B.ground_spoilers_armed = A380PrimComputerFg_U.in.fctl_logic.ground_spoilers_armed;
    A380PrimComputerFg_B.ground_spoilers_out = A380PrimComputerFg_U.in.fctl_logic.ground_spoilers_out;
    A380PrimComputerFg_B.phased_lift_dumping_active = A380PrimComputerFg_U.in.fctl_logic.phased_lift_dumping_active;
    A380PrimComputerFg_B.spoiler_lift_active = A380PrimComputerFg_U.in.fctl_logic.spoiler_lift_active;
    A380PrimComputerFg_B.ap_authorised = A380PrimComputerFg_U.in.fctl_logic.ap_authorised;
    A380PrimComputerFg_B.protection_ap_disconnect = A380PrimComputerFg_U.in.fctl_logic.protection_ap_disconnect;
    A380PrimComputerFg_B.high_alpha_prot_active = A380PrimComputerFg_U.in.fctl_logic.high_alpha_prot_active;
    A380PrimComputerFg_B.alpha_prot_deg = A380PrimComputerFg_U.in.fctl_logic.alpha_prot_deg;
    A380PrimComputerFg_B.is_unit_3 = A380PrimComputerFg_U.in.data.discrete_inputs.is_unit_3;
    A380PrimComputerFg_B.SSM_kz = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
    A380PrimComputerFg_B.alpha_max_deg = A380PrimComputerFg_U.in.fctl_logic.alpha_max_deg;
    A380PrimComputerFg_B.v_alpha_prot_kn = A380PrimComputerFg_U.in.fctl_logic.v_alpha_prot_kn;
    A380PrimComputerFg_B.v_alpha_max_kn = A380PrimComputerFg_U.in.fctl_logic.v_alpha_max_kn;
    A380PrimComputerFg_B.v_alpha_stall_warn_kn = A380PrimComputerFg_U.in.fctl_logic.v_alpha_stall_warn_kn;
    A380PrimComputerFg_B.high_speed_prot_active = A380PrimComputerFg_U.in.fctl_logic.high_speed_prot_active;
    A380PrimComputerFg_B.high_speed_prot_lo_thresh_kn = A380PrimComputerFg_U.in.fctl_logic.high_speed_prot_lo_thresh_kn;
    A380PrimComputerFg_B.high_speed_prot_hi_thresh_kn = A380PrimComputerFg_U.in.fctl_logic.high_speed_prot_hi_thresh_kn;
    A380PrimComputerFg_B.Data_od = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
    A380PrimComputerFg_B.fmgc_opp_priority = A380PrimComputerFg_U.in.fg_logic.fmgc_opp_priority;
    A380PrimComputerFg_B.SSM_il = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
    A380PrimComputerFg_B.SSM_i2 = A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft.SSM;
    A380PrimComputerFg_B.Data_ez = A380PrimComputerFg_U.in.fg_logic.altitude_indicated_ft.Data;
    A380PrimComputerFg_B.Data_pw = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
    A380PrimComputerFg_B.rwy_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.rwy_active;
    A380PrimComputerFg_B.SSM_ah = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFg_B.nav_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.nav_active;
    A380PrimComputerFg_B.loc_cpt_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.loc_cpt_active;
    A380PrimComputerFg_B.loc_trk_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.loc_trk_active;
    A380PrimComputerFg_B.roll_goaround_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.roll_goaround_active;
    A380PrimComputerFg_B.hdg_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.hdg_active;
    A380PrimComputerFg_B.trk_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.trk_active;
    A380PrimComputerFg_B.rwy_loc_submode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.rwy_loc_submode_active;
    A380PrimComputerFg_B.rwy_trk_submode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.rwy_trk_submode_active;
    A380PrimComputerFg_B.land_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active;
    A380PrimComputerFg_B.align_submode_active = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.align_submode_active;
    A380PrimComputerFg_B.Data_m2 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
    A380PrimComputerFg_B.rollout_submode_active =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.rollout_submode_active;
    A380PrimComputerFg_B.clb_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.clb_active;
    A380PrimComputerFg_B.des_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.des_active;
    A380PrimComputerFg_B.op_clb_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.op_clb_active;
    A380PrimComputerFg_B.op_des_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.op_des_active;
    A380PrimComputerFg_B.pitch_takeoff_active =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_takeoff_active;
    A380PrimComputerFg_B.pitch_goaround_active =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active;
    A380PrimComputerFg_B.vs_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.vs_active;
    A380PrimComputerFg_B.fpa_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.fpa_active;
    A380PrimComputerFg_B.alt_acq_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.alt_acq_active;
    A380PrimComputerFg_B.SSM_en = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFg_B.alt_hold_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.alt_hold_active;
    A380PrimComputerFg_B.fma_dash_display = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.fma_dash_display;
    A380PrimComputerFg_B.gs_capt_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.gs_capt_active;
    A380PrimComputerFg_B.gs_trk_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.gs_trk_active;
    A380PrimComputerFg_B.final_des_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.final_des_active;
    A380PrimComputerFg_B.flare_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.flare_active;
    A380PrimComputerFg_B.cruise_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.cruise_active;
    A380PrimComputerFg_B.tcas_active = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.tcas_active;
    A380PrimComputerFg_B.alt_acq_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.alt_acq_armed;
    A380PrimComputerFg_B.alt_acq_arm_possible = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.alt_acq_arm_possible;
    A380PrimComputerFg_B.Data_ek = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFg_B.nav_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.nav_armed;
    A380PrimComputerFg_B.loc_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.loc_armed;
    A380PrimComputerFg_B.land_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.land_armed;
    A380PrimComputerFg_B.glide_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.glide_armed;
    A380PrimComputerFg_B.final_des_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.final_des_armed;
    A380PrimComputerFg_B.clb_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.clb_armed;
    A380PrimComputerFg_B.des_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.des_armed;
    A380PrimComputerFg_B.tcas_armed = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.tcas_armed;
    A380PrimComputerFg_B.active_lateral_law = A380PrimComputerFg_U.in.fg_mode_logic.active_lateral_law;
    A380PrimComputerFg_B.active_longitudinal_law = A380PrimComputerFg_U.in.fg_mode_logic.active_longitudinal_law;
    A380PrimComputerFg_B.SSM_dq = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFg_B.Data_iy = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
    A380PrimComputerFg_B.athr_fma_mode = A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_mode;
    A380PrimComputerFg_B.athr_fma_message = A380PrimComputerFg_U.in.fg_mode_logic.athr_fma_message;
    A380PrimComputerFg_B.any_lateral_mode_engaged = A380PrimComputerFg_U.in.fg_mode_logic.any_lateral_mode_engaged;
    A380PrimComputerFg_B.any_longitudinal_mode_engaged =
      A380PrimComputerFg_U.in.fg_mode_logic.any_longitudinal_mode_engaged;
    A380PrimComputerFg_B.capt_priority_takeover_pressed =
      A380PrimComputerFg_U.in.data.discrete_inputs.capt_priority_takeover_pressed;
    A380PrimComputerFg_B.SSM_px = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
    A380PrimComputerFg_B.hdg_trk_preset_available = A380PrimComputerFg_U.in.fg_mode_logic.hdg_trk_preset_available;
    A380PrimComputerFg_B.alt_soft_mode_active = A380PrimComputerFg_U.in.fg_mode_logic.alt_soft_mode_active;
    A380PrimComputerFg_B.ap_fd_mode_reversion = A380PrimComputerFg_U.in.fg_mode_logic.ap_fd_mode_reversion;
    A380PrimComputerFg_B.lateral_mode_reversion = A380PrimComputerFg_U.in.fg_mode_logic.lateral_mode_reversion;
    A380PrimComputerFg_B.longitudinal_mode_reversion_vs =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_vs;
    A380PrimComputerFg_B.longitudinal_mode_reversion_op_clb =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_mode_reversion_op_clb;
    A380PrimComputerFg_B.pitch_fd_bars_flashing = A380PrimComputerFg_U.in.fg_mode_logic.pitch_fd_bars_flashing;
    A380PrimComputerFg_B.Data_lk = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
    A380PrimComputerFg_B.roll_fd_bars_flashing = A380PrimComputerFg_U.in.fg_mode_logic.roll_fd_bars_flashing;
    A380PrimComputerFg_B.loc_bc_selection = A380PrimComputerFg_U.in.fg_mode_logic.loc_bc_selection;
    A380PrimComputerFg_B.vs_target_not_held = A380PrimComputerFg_U.in.fg_mode_logic.vs_target_not_held;
    A380PrimComputerFg_B.active_tcas_submode = A380PrimComputerFg_U.in.fg_mode_logic.active_tcas_submode;
    A380PrimComputerFg_B.tcas_alt_acq_cond = A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_acq_cond;
    A380PrimComputerFg_B.tcas_alt_hold_cond = A380PrimComputerFg_U.in.fg_mode_logic.tcas_alt_hold_cond;
    A380PrimComputerFg_B.SSM_lbo = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFg_B.land_2_capability = A380PrimComputerFg_U.in.fg_mode_logic.land_2_capability;
    A380PrimComputerFg_B.land_3_fail_passive_capability =
      A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_capability;
    A380PrimComputerFg_B.land_3_fail_op_capability = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_capability;
    A380PrimComputerFg_B.land_2_inop = A380PrimComputerFg_U.in.fg_mode_logic.land_2_inop;
    A380PrimComputerFg_B.land_3_fail_passive_inop = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_passive_inop;
    A380PrimComputerFg_B.land_3_fail_op_inop = A380PrimComputerFg_U.in.fg_mode_logic.land_3_fail_op_inop;
    A380PrimComputerFg_B.tla_to_ga_set = A380PrimComputerFg_U.in.fg_mode_logic.tla_to_ga_set;
    A380PrimComputerFg_B.Data_ca = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    A380PrimComputerFg_B.Phi_loc_c = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.Phi_loc_c;
    A380PrimComputerFg_B.Nosewheel_c = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.Nosewheel_c;
    A380PrimComputerFg_B.SSM_p5 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
    A380PrimComputerFg_B.Theta_c_deg = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flight_director.Theta_c_deg;
    A380PrimComputerFg_B.Phi_c_deg = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flight_director.Phi_c_deg;
    A380PrimComputerFg_B.Beta_c_deg = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flight_director.Beta_c_deg;
    A380PrimComputerFg_B.Theta_c_deg_n = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.autopilot.Theta_c_deg;
    A380PrimComputerFg_B.Phi_c_deg_h = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.autopilot.Phi_c_deg;
    A380PrimComputerFg_B.Beta_c_deg_b = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.autopilot.Beta_c_deg;
    A380PrimComputerFg_B.condition_Flare = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flare_law.condition_Flare;
    A380PrimComputerFg_B.H_dot_radio_fpm = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flare_law.H_dot_radio_fpm;
    A380PrimComputerFg_B.H_dot_c_fpm = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flare_law.H_dot_c_fpm;
    A380PrimComputerFg_B.delta_Theta_H_dot_deg = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flare_law.delta_Theta_H_dot_deg;
    A380PrimComputerFg_B.Data_pix = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
    A380PrimComputerFg_B.delta_Theta_bz_deg = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flare_law.delta_Theta_bz_deg;
    A380PrimComputerFg_B.delta_Theta_bx_deg = A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flare_law.delta_Theta_bx_deg;
    A380PrimComputerFg_B.delta_Theta_beta_c_deg =
      A380PrimComputerFg_U.in.fg_laws.ap_fd_1.flare_law.delta_Theta_beta_c_deg;
    A380PrimComputerFg_B.Phi_loc_c_j = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.Phi_loc_c;
    A380PrimComputerFg_B.Nosewheel_c_f = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.Nosewheel_c;
    A380PrimComputerFg_B.Theta_c_deg_n0 = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flight_director.Theta_c_deg;
    A380PrimComputerFg_B.Phi_c_deg_hj = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flight_director.Phi_c_deg;
    A380PrimComputerFg_B.Beta_c_deg_bp = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flight_director.Beta_c_deg;
    A380PrimComputerFg_B.Theta_c_deg_n03 = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.autopilot.Theta_c_deg;
    A380PrimComputerFg_B.Phi_c_deg_hjv = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.autopilot.Phi_c_deg;
    A380PrimComputerFg_B.SSM_mk = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
    A380PrimComputerFg_B.Beta_c_deg_bpl = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.autopilot.Beta_c_deg;
    A380PrimComputerFg_B.condition_Flare_n = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flare_law.condition_Flare;
    A380PrimComputerFg_B.H_dot_radio_fpm_p = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flare_law.H_dot_radio_fpm;
    A380PrimComputerFg_B.H_dot_c_fpm_j = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flare_law.H_dot_c_fpm;
    A380PrimComputerFg_B.delta_Theta_H_dot_deg_l =
      A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flare_law.delta_Theta_H_dot_deg;
    A380PrimComputerFg_B.delta_Theta_bz_deg_a = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flare_law.delta_Theta_bz_deg;
    A380PrimComputerFg_B.delta_Theta_bx_deg_j = A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flare_law.delta_Theta_bx_deg;
    A380PrimComputerFg_B.delta_Theta_beta_c_deg_g =
      A380PrimComputerFg_U.in.fg_laws.ap_fd_2.flare_law.delta_Theta_beta_c_deg;
    A380PrimComputerFg_B.n_1_c_percent = A380PrimComputerFg_U.in.fg_laws.n_1_c_percent;
    A380PrimComputerFg_B.alignment_dummy = A380PrimComputerFg_U.in.discrete_outputs.alignment_dummy;
    A380PrimComputerFg_B.Data_di = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
    A380PrimComputerFg_B.elevator_1_active_mode = A380PrimComputerFg_U.in.discrete_outputs.elevator_1_active_mode;
    A380PrimComputerFg_B.elevator_2_active_mode = A380PrimComputerFg_U.in.discrete_outputs.elevator_2_active_mode;
    A380PrimComputerFg_B.elevator_3_active_mode = A380PrimComputerFg_U.in.discrete_outputs.elevator_3_active_mode;
    A380PrimComputerFg_B.ths_active_mode = A380PrimComputerFg_U.in.discrete_outputs.ths_active_mode;
    A380PrimComputerFg_B.left_aileron_1_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.left_aileron_1_active_mode;
    A380PrimComputerFg_B.left_aileron_2_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.left_aileron_2_active_mode;
    A380PrimComputerFg_B.right_aileron_1_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.right_aileron_1_active_mode;
    A380PrimComputerFg_B.right_aileron_2_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.right_aileron_2_active_mode;
    A380PrimComputerFg_B.left_spoiler_electronic_module_enable =
      A380PrimComputerFg_U.in.discrete_outputs.left_spoiler_electronic_module_enable;
    A380PrimComputerFg_B.right_spoiler_electronic_module_enable =
      A380PrimComputerFg_U.in.discrete_outputs.right_spoiler_electronic_module_enable;
    A380PrimComputerFg_B.SSM_mu = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
    A380PrimComputerFg_B.rudder_1_hydraulic_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.rudder_1_hydraulic_active_mode;
    A380PrimComputerFg_B.rudder_1_electric_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.rudder_1_electric_active_mode;
    A380PrimComputerFg_B.rudder_2_hydraulic_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.rudder_2_hydraulic_active_mode;
    A380PrimComputerFg_B.rudder_2_electric_active_mode =
      A380PrimComputerFg_U.in.discrete_outputs.rudder_2_electric_active_mode;
    A380PrimComputerFg_B.prim_healthy = A380PrimComputerFg_U.in.discrete_outputs.prim_healthy;
    A380PrimComputerFg_B.fcu_1_select = A380PrimComputerFg_U.in.discrete_outputs.fcu_1_select;
    A380PrimComputerFg_B.fcu_2_select = A380PrimComputerFg_U.in.discrete_outputs.fcu_2_select;
    A380PrimComputerFg_B.ap_engaged = A380PrimComputerFg_U.in.discrete_outputs.ap_engaged;
    A380PrimComputerFg_B.reverser_tertiary_lock = A380PrimComputerFg_U.in.discrete_outputs.reverser_tertiary_lock;
    A380PrimComputerFg_B.elevator_1_pos_order_deg = A380PrimComputerFg_U.in.analog_outputs.elevator_1_pos_order_deg;
    A380PrimComputerFg_B.Data_lz = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
    A380PrimComputerFg_B.elevator_2_pos_order_deg = A380PrimComputerFg_U.in.analog_outputs.elevator_2_pos_order_deg;
    A380PrimComputerFg_B.elevator_3_pos_order_deg = A380PrimComputerFg_U.in.analog_outputs.elevator_3_pos_order_deg;
    A380PrimComputerFg_B.ths_pos_order_deg = A380PrimComputerFg_U.in.analog_outputs.ths_pos_order_deg;
    A380PrimComputerFg_B.left_aileron_1_pos_order_deg =
      A380PrimComputerFg_U.in.analog_outputs.left_aileron_1_pos_order_deg;
    A380PrimComputerFg_B.left_aileron_2_pos_order_deg =
      A380PrimComputerFg_U.in.analog_outputs.left_aileron_2_pos_order_deg;
    A380PrimComputerFg_B.right_aileron_1_pos_order_deg =
      A380PrimComputerFg_U.in.analog_outputs.right_aileron_1_pos_order_deg;
    A380PrimComputerFg_B.right_aileron_2_pos_order_deg =
      A380PrimComputerFg_U.in.analog_outputs.right_aileron_2_pos_order_deg;
    A380PrimComputerFg_B.left_spoiler_pos_order_deg = A380PrimComputerFg_U.in.analog_outputs.left_spoiler_pos_order_deg;
    A380PrimComputerFg_B.right_spoiler_pos_order_deg =
      A380PrimComputerFg_U.in.analog_outputs.right_spoiler_pos_order_deg;
    A380PrimComputerFg_B.rudder_1_pos_order_deg = A380PrimComputerFg_U.in.analog_outputs.rudder_1_pos_order_deg;
    A380PrimComputerFg_B.fo_priority_takeover_pressed =
      A380PrimComputerFg_U.in.data.discrete_inputs.fo_priority_takeover_pressed;
    A380PrimComputerFg_B.SSM_cbl = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFg_B.rudder_2_pos_order_deg = A380PrimComputerFg_U.in.analog_outputs.rudder_2_pos_order_deg;
    A380PrimComputerFg_B.SSM_gzd = A380PrimComputerFg_U.in.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_lu = A380PrimComputerFg_U.in.bus_outputs.fctl.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_mo = A380PrimComputerFg_U.in.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_dc = A380PrimComputerFg_U.in.bus_outputs.fctl.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_me = A380PrimComputerFg_U.in.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_gc = A380PrimComputerFg_U.in.bus_outputs.fctl.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_mj = A380PrimComputerFg_U.in.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_am = A380PrimComputerFg_U.in.bus_outputs.fctl.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_a5 = A380PrimComputerFg_U.in.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_mo = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFg_B.Data_dg = A380PrimComputerFg_U.in.bus_outputs.fctl.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_bt = A380PrimComputerFg_U.in.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_e1 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_om = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFg_B.Data_fp = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_1_command_deg.Data;
    A380PrimComputerFg_B.SSM_ar = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFg_B.Data_ns = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_1_command_deg.Data;
    A380PrimComputerFg_B.SSM_ce = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFg_B.Data_m3 = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_2_command_deg.Data;
    A380PrimComputerFg_B.SSM_ed = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFg_B.SSM_jh = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_oj = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_2_command_deg.Data;
    A380PrimComputerFg_B.SSM_je = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFg_B.Data_jy = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_3_command_deg.Data;
    A380PrimComputerFg_B.SSM_jt = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFg_B.Data_j1 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_3_command_deg.Data;
    A380PrimComputerFg_B.SSM_cui = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFg_B.Data_fc = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_4_command_deg.Data;
    A380PrimComputerFg_B.SSM_mq = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFg_B.Data_of = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_4_command_deg.Data;
    A380PrimComputerFg_B.SSM_ni = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFg_B.Data_lg = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFg_B.Data_n4 = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_5_command_deg.Data;
    A380PrimComputerFg_B.SSM_df = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFg_B.Data_ot = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_5_command_deg.Data;
    A380PrimComputerFg_B.SSM_oe = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFg_B.Data_gv = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_6_command_deg.Data;
    A380PrimComputerFg_B.SSM_ha = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFg_B.Data_ou = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_6_command_deg.Data;
    A380PrimComputerFg_B.SSM_op = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFg_B.Data_dh = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_7_command_deg.Data;
    A380PrimComputerFg_B.SSM_a50 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFg_B.SSM_og = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_ph = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_7_command_deg.Data;
    A380PrimComputerFg_B.SSM_a4 = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFg_B.Data_gs = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_8_command_deg.Data;
    A380PrimComputerFg_B.SSM_bv = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFg_B.Data_fd4 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_8_command_deg.Data;
    A380PrimComputerFg_B.SSM_bo = A380PrimComputerFg_U.in.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_hm = A380PrimComputerFg_U.in.bus_outputs.fctl.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_d1 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_i2 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_hy = A380PrimComputerFg_U.in.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_og = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFg_B.Data_fv = A380PrimComputerFg_U.in.bus_outputs.fctl.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_gi = A380PrimComputerFg_U.in.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_oc = A380PrimComputerFg_U.in.bus_outputs.fctl.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_pp = A380PrimComputerFg_U.in.bus_outputs.fctl.ths_command_deg.SSM;
    A380PrimComputerFg_B.Data_kq = A380PrimComputerFg_U.in.bus_outputs.fctl.ths_command_deg.Data;
    A380PrimComputerFg_B.SSM_iab = A380PrimComputerFg_U.in.bus_outputs.fctl.upper_rudder_command_deg.SSM;
    A380PrimComputerFg_B.Data_ne = A380PrimComputerFg_U.in.bus_outputs.fctl.upper_rudder_command_deg.Data;
    A380PrimComputerFg_B.SSM_jtv = A380PrimComputerFg_U.in.bus_outputs.fctl.lower_rudder_command_deg.SSM;
    A380PrimComputerFg_B.Data_it = A380PrimComputerFg_U.in.bus_outputs.fctl.lower_rudder_command_deg.Data;
    A380PrimComputerFg_B.SSM_fy = A380PrimComputerFg_U.in.bus_outputs.fctl.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.SSM_d4 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
    A380PrimComputerFg_B.Data_ch = A380PrimComputerFg_U.in.bus_outputs.fctl.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_ars = A380PrimComputerFg_U.in.bus_outputs.fctl.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_bb = A380PrimComputerFg_U.in.bus_outputs.fctl.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_din = A380PrimComputerFg_U.in.bus_outputs.fctl.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_ol = A380PrimComputerFg_U.in.bus_outputs.fctl.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_m3 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_hw = A380PrimComputerFg_U.in.bus_outputs.fctl.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_np = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_pedal_position_deg.SSM;
    A380PrimComputerFg_B.Data_hs = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_pedal_position_deg.Data;
    A380PrimComputerFg_B.SSM_ax = A380PrimComputerFg_U.in.bus_outputs.fctl.aileron_status_word.SSM;
    A380PrimComputerFg_B.Data_fj = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
    A380PrimComputerFg_B.Data_ky = A380PrimComputerFg_U.in.bus_outputs.fctl.aileron_status_word.Data;
    A380PrimComputerFg_B.SSM_cl = A380PrimComputerFg_U.in.bus_outputs.fctl.left_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_h5 = A380PrimComputerFg_U.in.bus_outputs.fctl.left_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_es = A380PrimComputerFg_U.in.bus_outputs.fctl.left_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ku = A380PrimComputerFg_U.in.bus_outputs.fctl.left_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_gi1 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_jp = A380PrimComputerFg_U.in.bus_outputs.fctl.right_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_jz = A380PrimComputerFg_U.in.bus_outputs.fctl.right_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_nu = A380PrimComputerFg_U.in.bus_outputs.fctl.right_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_kt = A380PrimComputerFg_U.in.bus_outputs.fctl.spoiler_status_word.SSM;
    A380PrimComputerFg_B.SSM_ds = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
    A380PrimComputerFg_B.Data_br = A380PrimComputerFg_U.in.bus_outputs.fctl.spoiler_status_word.Data;
    A380PrimComputerFg_B.SSM_eg = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_position_deg.SSM;
    A380PrimComputerFg_B.Data_ae = A380PrimComputerFg_U.in.bus_outputs.fctl.left_spoiler_position_deg.Data;
    A380PrimComputerFg_B.SSM_a0 = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_position_deg.SSM;
    A380PrimComputerFg_B.Data_pe = A380PrimComputerFg_U.in.bus_outputs.fctl.right_spoiler_position_deg.Data;
    A380PrimComputerFg_B.SSM_cv = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_status_word.SSM;
    A380PrimComputerFg_B.Data_fy = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_status_word.Data;
    A380PrimComputerFg_B.SSM_ea = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_na = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_p4 = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_my = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
    A380PrimComputerFg_B.Data_i4 = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_m2 = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_3_position_deg.SSM;
    A380PrimComputerFg_B.Data_cx = A380PrimComputerFg_U.in.bus_outputs.fctl.elevator_3_position_deg.Data;
    A380PrimComputerFg_B.SSM_bt0 = A380PrimComputerFg_U.in.bus_outputs.fctl.ths_position_deg.SSM;
    A380PrimComputerFg_B.Data_nz = A380PrimComputerFg_U.in.bus_outputs.fctl.ths_position_deg.Data;
    A380PrimComputerFg_B.SSM_nr = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_status_word.SSM;
    A380PrimComputerFg_B.Data_id = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_status_word.Data;
    A380PrimComputerFg_B.SSM_fr = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_o2 = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_cc = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_2_position_deg.SSM;
    A380PrimComputerFg_B.ap_1_pushbutton_pressed = A380PrimComputerFg_U.in.data.discrete_inputs.ap_1_pushbutton_pressed;
    A380PrimComputerFg_B.SSM_lm = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
    A380PrimComputerFg_B.Data_gqq = A380PrimComputerFg_U.in.bus_outputs.fctl.rudder_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_mkm = A380PrimComputerFg_U.in.bus_outputs.fctl.radio_height_1_ft.SSM;
    A380PrimComputerFg_B.Data_md = A380PrimComputerFg_U.in.bus_outputs.fctl.radio_height_1_ft.Data;
    A380PrimComputerFg_B.SSM_jhd = A380PrimComputerFg_U.in.bus_outputs.fctl.radio_height_2_ft.SSM;
    A380PrimComputerFg_B.Data_cz = A380PrimComputerFg_U.in.bus_outputs.fctl.radio_height_2_ft.Data;
    A380PrimComputerFg_B.SSM_av = A380PrimComputerFg_U.in.bus_outputs.fctl.fctl_law_status_word.SSM;
    A380PrimComputerFg_B.Data_pm = A380PrimComputerFg_U.in.bus_outputs.fctl.fctl_law_status_word.Data;
    A380PrimComputerFg_B.SSM_ira = A380PrimComputerFg_U.in.bus_outputs.fctl.discrete_status_word_1.SSM;
    A380PrimComputerFg_B.Data_bj = A380PrimComputerFg_U.in.bus_outputs.fctl.discrete_status_word_1.Data;
    A380PrimComputerFg_B.SSM_ge = A380PrimComputerFg_U.in.bus_outputs.fctl.v_alpha_lim_kn.SSM;
    A380PrimComputerFg_B.Data_ox = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
    A380PrimComputerFg_B.Data_pe5 = A380PrimComputerFg_U.in.bus_outputs.fctl.v_alpha_lim_kn.Data;
    A380PrimComputerFg_B.SSM_lv = A380PrimComputerFg_U.in.bus_outputs.fctl.v_alpha_prot_kn.SSM;
    A380PrimComputerFg_B.Data_jj = A380PrimComputerFg_U.in.bus_outputs.fctl.v_alpha_prot_kn.Data;
    A380PrimComputerFg_B.SSM_cg = A380PrimComputerFg_U.in.bus_outputs.fctl.v_alpha_stall_warn_kn.SSM;
    A380PrimComputerFg_B.Data_p5 = A380PrimComputerFg_U.in.bus_outputs.fctl.v_alpha_stall_warn_kn.Data;
    A380PrimComputerFg_B.SSM_be = A380PrimComputerFg_U.in.bus_outputs.fe.gamma_a_deg.SSM;
    A380PrimComputerFg_B.Data_ekl = A380PrimComputerFg_U.in.bus_outputs.fe.gamma_a_deg.Data;
    A380PrimComputerFg_B.SSM_axb = A380PrimComputerFg_U.in.bus_outputs.fe.gamma_t_deg.SSM;
    A380PrimComputerFg_B.Data_nd = A380PrimComputerFg_U.in.bus_outputs.fe.gamma_t_deg.Data;
    A380PrimComputerFg_B.SSM_nz = A380PrimComputerFg_U.in.bus_outputs.fe.sideslip_target_deg.SSM;
    A380PrimComputerFg_B.SSM_cx = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_n2 = A380PrimComputerFg_U.in.bus_outputs.fe.sideslip_target_deg.Data;
    A380PrimComputerFg_B.SSM_gh = A380PrimComputerFg_U.in.bus_outputs.fe.v_ls_kn.SSM;
    A380PrimComputerFg_B.Data_dl = A380PrimComputerFg_U.in.bus_outputs.fe.v_ls_kn.Data;
    A380PrimComputerFg_B.SSM_ks = A380PrimComputerFg_U.in.bus_outputs.fe.v_stall_kn.SSM;
    A380PrimComputerFg_B.Data_gs2 = A380PrimComputerFg_U.in.bus_outputs.fe.v_stall_kn.Data;
    A380PrimComputerFg_B.SSM_pw = A380PrimComputerFg_U.in.bus_outputs.fe.speed_trend_kn.SSM;
    A380PrimComputerFg_B.Data_h4 = A380PrimComputerFg_U.in.bus_outputs.fe.speed_trend_kn.Data;
    A380PrimComputerFg_B.SSM_fh = A380PrimComputerFg_U.in.bus_outputs.fe.v_3_kn.SSM;
    A380PrimComputerFg_B.Data_e3 = A380PrimComputerFg_U.in.bus_outputs.fe.v_3_kn.Data;
    A380PrimComputerFg_B.SSM_gzn = A380PrimComputerFg_U.in.bus_outputs.fe.v_4_kn.SSM;
    A380PrimComputerFg_B.Data_f5h = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFg_B.Data_an = A380PrimComputerFg_U.in.bus_outputs.fe.v_4_kn.Data;
    A380PrimComputerFg_B.SSM_oo = A380PrimComputerFg_U.in.bus_outputs.fe.v_man_kn.SSM;
    A380PrimComputerFg_B.Data_i4o = A380PrimComputerFg_U.in.bus_outputs.fe.v_man_kn.Data;
    A380PrimComputerFg_B.SSM_evh = A380PrimComputerFg_U.in.bus_outputs.fe.v_max_kn.SSM;
    A380PrimComputerFg_B.Data_af = A380PrimComputerFg_U.in.bus_outputs.fe.v_max_kn.Data;
    A380PrimComputerFg_B.SSM_cn = A380PrimComputerFg_U.in.bus_outputs.fe.v_fe_next_kn.SSM;
    A380PrimComputerFg_B.Data_bm = A380PrimComputerFg_U.in.bus_outputs.fe.v_fe_next_kn.Data;
    A380PrimComputerFg_B.SSM_co = A380PrimComputerFg_U.in.bus_outputs.fe.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_dk = A380PrimComputerFg_U.in.bus_outputs.fe.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_pe = A380PrimComputerFg_U.in.bus_outputs.fg.pfd_spd_tgt_kts.SSM;
    A380PrimComputerFg_B.SSM_cgz = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_nv = A380PrimComputerFg_U.in.bus_outputs.fg.pfd_spd_tgt_kts.Data;
    A380PrimComputerFg_B.SSM_fw = A380PrimComputerFg_U.in.bus_outputs.fg.pfd_short_term_mngd_spd_kts.SSM;
    A380PrimComputerFg_B.Data_jpf = A380PrimComputerFg_U.in.bus_outputs.fg.pfd_short_term_mngd_spd_kts.Data;
    A380PrimComputerFg_B.SSM_h4 = A380PrimComputerFg_U.in.bus_outputs.fg.selected_spd_kts.SSM;
    A380PrimComputerFg_B.Data_i5 = A380PrimComputerFg_U.in.bus_outputs.fg.selected_spd_kts.Data;
    A380PrimComputerFg_B.SSM_cb3 = A380PrimComputerFg_U.in.bus_outputs.fg.selected_mach_kts.SSM;
    A380PrimComputerFg_B.Data_k2 = A380PrimComputerFg_U.in.bus_outputs.fg.selected_mach_kts.Data;
    A380PrimComputerFg_B.SSM_pj = A380PrimComputerFg_U.in.bus_outputs.fg.selected_hdg_deg.SSM;
    A380PrimComputerFg_B.Data_as = A380PrimComputerFg_U.in.bus_outputs.fg.selected_hdg_deg.Data;
    A380PrimComputerFg_B.SSM_dv = A380PrimComputerFg_U.in.bus_outputs.fg.selected_trk_deg.SSM;
    A380PrimComputerFg_B.Data_gk = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFg_B.Data_jl = A380PrimComputerFg_U.in.bus_outputs.fg.selected_trk_deg.Data;
    A380PrimComputerFg_B.SSM_i4 = A380PrimComputerFg_U.in.bus_outputs.fg.selected_alt_ft.SSM;
    A380PrimComputerFg_B.Data_e32 = A380PrimComputerFg_U.in.bus_outputs.fg.selected_alt_ft.Data;
    A380PrimComputerFg_B.SSM_fm = A380PrimComputerFg_U.in.bus_outputs.fg.selected_vs_ft_min.SSM;
    A380PrimComputerFg_B.Data_ih = A380PrimComputerFg_U.in.bus_outputs.fg.selected_vs_ft_min.Data;
    A380PrimComputerFg_B.SSM_e5 = A380PrimComputerFg_U.in.bus_outputs.fg.selected_fpa_deg.SSM;
    A380PrimComputerFg_B.Data_du = A380PrimComputerFg_U.in.bus_outputs.fg.selected_fpa_deg.Data;
    A380PrimComputerFg_B.SSM_bf = A380PrimComputerFg_U.in.bus_outputs.fg.runway_hdg_memorized_deg.SSM;
    A380PrimComputerFg_B.Data_nx = A380PrimComputerFg_U.in.bus_outputs.fg.runway_hdg_memorized_deg.Data;
    A380PrimComputerFg_B.SSM_fd = A380PrimComputerFg_U.in.bus_outputs.fg.preset_mach_from_fms.SSM;
    A380PrimComputerFg_B.SSM_fv = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_n0 = A380PrimComputerFg_U.in.bus_outputs.fg.preset_mach_from_fms.Data;
    A380PrimComputerFg_B.SSM_dt = A380PrimComputerFg_U.in.bus_outputs.fg.preset_speed_from_fms_kts.SSM;
    A380PrimComputerFg_B.Data_eqi = A380PrimComputerFg_U.in.bus_outputs.fg.preset_speed_from_fms_kts.Data;
    A380PrimComputerFg_B.SSM_j5 = A380PrimComputerFg_U.in.bus_outputs.fg.roll_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_om = A380PrimComputerFg_U.in.bus_outputs.fg.roll_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_ng = A380PrimComputerFg_U.in.bus_outputs.fg.pitch_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_nr = A380PrimComputerFg_U.in.bus_outputs.fg.pitch_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_cs = A380PrimComputerFg_U.in.bus_outputs.fg.yaw_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_p3 = A380PrimComputerFg_U.in.bus_outputs.fg.yaw_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_ls = A380PrimComputerFg_U.in.bus_outputs.fg.roll_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_nb = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFg_B.Data_hd = A380PrimComputerFg_U.in.bus_outputs.fg.roll_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_dg = A380PrimComputerFg_U.in.bus_outputs.fg.pitch_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_al = A380PrimComputerFg_U.in.bus_outputs.fg.pitch_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_d3 = A380PrimComputerFg_U.in.bus_outputs.fg.yaw_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_gu = A380PrimComputerFg_U.in.bus_outputs.fg.yaw_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_p2 = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_5.SSM;
    A380PrimComputerFg_B.Data_ix = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_5.Data;
    A380PrimComputerFg_B.SSM_bo0 = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_4.SSM;
    A380PrimComputerFg_B.Data_do = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_4.Data;
    A380PrimComputerFg_B.SSM_bc = A380PrimComputerFg_U.in.bus_outputs.fg.fm_alt_constraint_ft.SSM;
    A380PrimComputerFg_B.SSM_h0 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
    A380PrimComputerFg_B.Data_hu = A380PrimComputerFg_U.in.bus_outputs.fg.fm_alt_constraint_ft.Data;
    A380PrimComputerFg_B.SSM_giz = A380PrimComputerFg_U.in.bus_outputs.fg.ats_discrete_word.SSM;
    A380PrimComputerFg_B.Data_pm1 = A380PrimComputerFg_U.in.bus_outputs.fg.ats_discrete_word.Data;
    A380PrimComputerFg_B.SSM_mqp = A380PrimComputerFg_U.in.bus_outputs.fg.ats_fma_discrete_word.SSM;
    A380PrimComputerFg_B.Data_i2y = A380PrimComputerFg_U.in.bus_outputs.fg.ats_fma_discrete_word.Data;
    A380PrimComputerFg_B.SSM_ba = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_3.SSM;
    A380PrimComputerFg_B.Data_pg = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_3.Data;
    A380PrimComputerFg_B.SSM_in = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_ni = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_ff = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_fr = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
    A380PrimComputerFg_B.Data_cn = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_ic = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_6.SSM;
    A380PrimComputerFg_B.Data_nxl = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_6.Data;
    A380PrimComputerFg_B.SSM_fs = A380PrimComputerFg_U.in.bus_outputs.fg.low_target_speed_margin_kts.SSM;
    A380PrimComputerFg_B.Data_jh = A380PrimComputerFg_U.in.bus_outputs.fg.low_target_speed_margin_kts.Data;
    A380PrimComputerFg_B.SSM_ja = A380PrimComputerFg_U.in.bus_outputs.fg.high_target_speed_margin_kts.SSM;
    A380PrimComputerFg_B.Data_gl = A380PrimComputerFg_U.in.bus_outputs.fg.high_target_speed_margin_kts.Data;
    A380PrimComputerFg_B.SSM_js = A380PrimComputerFg_U.in.bus_outputs.fg.nosewheel_cmd_deg.SSM;
    A380PrimComputerFg_B.Data_gn = A380PrimComputerFg_U.in.bus_outputs.fg.nosewheel_cmd_deg.Data;
    A380PrimComputerFg_B.SSM_is3 = A380PrimComputerFg_U.in.bus_outputs.fg.n1_command_percent.SSM;
    A380PrimComputerFg_B.ap_2_pushbutton_pressed = A380PrimComputerFg_U.in.data.discrete_inputs.ap_2_pushbutton_pressed;
    A380PrimComputerFg_B.SSM_ag = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFg_B.Data_myb = A380PrimComputerFg_U.in.bus_outputs.fg.n1_command_percent.Data;
    A380PrimComputerFg_B.SSM_f5 = A380PrimComputerFg_U.in.bus_outputs.fg.flx_to_temp_deg_c.SSM;
    A380PrimComputerFg_B.Data_l2 = A380PrimComputerFg_U.in.bus_outputs.fg.flx_to_temp_deg_c.Data;
    A380PrimComputerFg_B.SSM_ph = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_7.SSM;
    A380PrimComputerFg_B.Data_o5o = A380PrimComputerFg_U.in.bus_outputs.fg.discrete_word_7.Data;
    A380PrimComputerFg_B.Data_l5 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFg_B.SSM_jw = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFg_B.Data_dc2 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFg_B.SSM_jy = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
    A380PrimComputerFg_B.Data_gr = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
    A380PrimComputerFg_B.SSM_j1 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFg_B.Data_gp = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFg_B.SSM_ov = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFg_B.Data_i3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
    A380PrimComputerFg_B.fcu_1_healthy = A380PrimComputerFg_U.in.data.discrete_inputs.fcu_1_healthy;
    A380PrimComputerFg_B.SSM_mx = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFg_B.Data_et = A380PrimComputerFg_U.in.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
    A380PrimComputerFg_B.SSM_b4 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_mc = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_gb = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
    A380PrimComputerFg_B.Data_k3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.latitude_deg.Data;
    A380PrimComputerFg_B.SSM_oh = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
    A380PrimComputerFg_B.Data_f2 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.longitude_deg.Data;
    A380PrimComputerFg_B.SSM_mm5 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
    A380PrimComputerFg_B.Data_gh = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
    A380PrimComputerFg_B.fcu_2_healthy = A380PrimComputerFg_U.in.data.discrete_inputs.fcu_2_healthy;
    A380PrimComputerFg_B.SSM_br = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
    A380PrimComputerFg_B.Data_ed = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
    A380PrimComputerFg_B.SSM_c2 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
    A380PrimComputerFg_B.Data_o2j = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
    A380PrimComputerFg_B.SSM_hc = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
    A380PrimComputerFg_B.Data_i43 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
    A380PrimComputerFg_B.SSM_ktr = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFg_B.Data_ic = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
    A380PrimComputerFg_B.SSM_gl = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFg_B.Data_ak = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFg_B.simulation_time = A380PrimComputerFg_U.in.data.time.simulation_time;
    A380PrimComputerFg_B.athr_pushbutton = A380PrimComputerFg_U.in.data.discrete_inputs.athr_pushbutton;
    A380PrimComputerFg_B.SSM_my = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFg_B.Data_jg = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
    A380PrimComputerFg_B.SSM_j3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
    A380PrimComputerFg_B.Data_cu = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
    A380PrimComputerFg_B.SSM_go = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFg_B.Data_ep = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    A380PrimComputerFg_B.SSM_e5c = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
    A380PrimComputerFg_B.Data_d3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
    A380PrimComputerFg_B.SSM_dk = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
    A380PrimComputerFg_B.Data_bt = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
    A380PrimComputerFg_B.ir_3_on_capt = A380PrimComputerFg_U.in.data.discrete_inputs.ir_3_on_capt;
    A380PrimComputerFg_B.SSM_evc = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
    A380PrimComputerFg_B.Data_e0 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
    A380PrimComputerFg_B.SSM_kk = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_jl3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_af = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_nm = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_npr = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_ia = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_ew = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
    A380PrimComputerFg_B.Data_j0 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
    A380PrimComputerFg_B.ir_3_on_fo = A380PrimComputerFg_U.in.data.discrete_inputs.ir_3_on_fo;
    A380PrimComputerFg_B.SSM_lt = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
    A380PrimComputerFg_B.Data_bs = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
    A380PrimComputerFg_B.SSM_ger = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
    A380PrimComputerFg_B.Data_hp = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
    A380PrimComputerFg_B.SSM_pxo = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_ct = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_co2 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_pc = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_ny = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_nzt = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFg_B.adr_3_on_capt = A380PrimComputerFg_U.in.data.discrete_inputs.adr_3_on_capt;
    A380PrimComputerFg_B.SSM_l4 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
    A380PrimComputerFg_B.Data_c0 = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
    A380PrimComputerFg_B.SSM_nm = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFg_B.Data_ojg = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFg_B.SSM_nh = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFg_B.Data_lm = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFg_B.SSM_dl = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
    A380PrimComputerFg_B.Data_fz = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
    A380PrimComputerFg_B.SSM_dx = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFg_B.Data_oz = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFg_B.adr_3_on_fo = A380PrimComputerFg_U.in.data.discrete_inputs.adr_3_on_fo;
    A380PrimComputerFg_B.SSM_a5h = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFg_B.Data_gf = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
    A380PrimComputerFg_B.SSM_fl = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFg_B.Data_nn = A380PrimComputerFg_U.in.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
    A380PrimComputerFg_B.SSM_p3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_a0z = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_ns = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
    A380PrimComputerFg_B.Data_fk = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.latitude_deg.Data;
    A380PrimComputerFg_B.SSM_bm = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
    A380PrimComputerFg_B.Data_bu = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.longitude_deg.Data;
    A380PrimComputerFg_B.rat_deployed = A380PrimComputerFg_U.in.data.discrete_inputs.rat_deployed;
    A380PrimComputerFg_B.SSM_nl = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
    A380PrimComputerFg_B.Data_o23 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
    A380PrimComputerFg_B.SSM_grm = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
    A380PrimComputerFg_B.Data_g3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
    A380PrimComputerFg_B.SSM_gzm = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
    A380PrimComputerFg_B.Data_icc = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
    A380PrimComputerFg_B.SSM_oi = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
    A380PrimComputerFg_B.Data_pwf = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
    A380PrimComputerFg_B.SSM_aa = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFg_B.Data_gvk = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
    A380PrimComputerFg_B.rat_contactor_closed = A380PrimComputerFg_U.in.data.discrete_inputs.rat_contactor_closed;
    A380PrimComputerFg_B.SSM_fvk = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFg_B.Data_ln = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFg_B.SSM_lw = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFg_B.Data_ka = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
    A380PrimComputerFg_B.SSM_fa = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
    A380PrimComputerFg_B.Data_mp = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
    A380PrimComputerFg_B.SSM_lbx = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFg_B.Data_m4 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    A380PrimComputerFg_B.SSM_n3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
    A380PrimComputerFg_B.Data_fki = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
    A380PrimComputerFg_B.athr_instinctive_disc = A380PrimComputerFg_U.in.data.discrete_inputs.athr_instinctive_disc;
    A380PrimComputerFg_B.SSM_a1 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
    A380PrimComputerFg_B.Data_bv = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
    A380PrimComputerFg_B.SSM_p1 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
    A380PrimComputerFg_B.Data_m21 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
    A380PrimComputerFg_B.SSM_cn2 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_nbg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_an3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_l25 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_c3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_ki = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFg_B.pitch_trim_up_pressed = A380PrimComputerFg_U.in.data.discrete_inputs.pitch_trim_up_pressed;
    A380PrimComputerFg_B.SSM_dp = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
    A380PrimComputerFg_B.Data_p5p = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
    A380PrimComputerFg_B.SSM_boy = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
    A380PrimComputerFg_B.Data_nry = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
    A380PrimComputerFg_B.SSM_lg = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
    A380PrimComputerFg_B.Data_mh = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
    A380PrimComputerFg_B.SSM_cm = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_ll = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_hl = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_hy = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFg_B.pitch_trim_down_pressed = A380PrimComputerFg_U.in.data.discrete_inputs.pitch_trim_down_pressed;
    A380PrimComputerFg_B.SSM_irh = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFg_B.Data_j04 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFg_B.SSM_b42 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
    A380PrimComputerFg_B.Data_pf = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
    A380PrimComputerFg_B.SSM_anz = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFg_B.Data_pl = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFg_B.SSM_d2 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFg_B.Data_gb = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFg_B.SSM_gov = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
    A380PrimComputerFg_B.Data_hq = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
    A380PrimComputerFg_B.monotonic_time = A380PrimComputerFg_U.in.data.time.monotonic_time;
    A380PrimComputerFg_B.green_low_pressure = A380PrimComputerFg_U.in.data.discrete_inputs.green_low_pressure;
    A380PrimComputerFg_B.SSM_nb = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFg_B.Data_ai = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFg_B.SSM_pe3 = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFg_B.Data_gfr = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
    A380PrimComputerFg_B.SSM_jj = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFg_B.Data_czp = A380PrimComputerFg_U.in.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
    A380PrimComputerFg_B.isis_1_bus = A380PrimComputerFg_U.in.data.bus_inputs.isis_1_bus;
    A380PrimComputerFg_B.isis_2_bus = A380PrimComputerFg_U.in.data.bus_inputs.isis_2_bus;
    A380PrimComputerFg_B.rate_gyro_pitch_1_bus = A380PrimComputerFg_U.in.data.bus_inputs.rate_gyro_pitch_1_bus;
    A380PrimComputerFg_B.rate_gyro_pitch_2_bus = A380PrimComputerFg_U.in.data.bus_inputs.rate_gyro_pitch_2_bus;
    A380PrimComputerFg_B.yellow_low_pressure = A380PrimComputerFg_U.in.data.discrete_inputs.yellow_low_pressure;
    A380PrimComputerFg_B.rate_gyro_roll_1_bus = A380PrimComputerFg_U.in.data.bus_inputs.rate_gyro_roll_1_bus;
    A380PrimComputerFg_B.rate_gyro_roll_2_bus = A380PrimComputerFg_U.in.data.bus_inputs.rate_gyro_roll_2_bus;
    A380PrimComputerFg_B.rate_gyro_yaw_1_bus = A380PrimComputerFg_U.in.data.bus_inputs.rate_gyro_yaw_1_bus;
    A380PrimComputerFg_B.rate_gyro_yaw_2_bus = A380PrimComputerFg_U.in.data.bus_inputs.rate_gyro_yaw_2_bus;
    A380PrimComputerFg_B.SSM_jx = A380PrimComputerFg_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
    A380PrimComputerFg_B.Data_fm = A380PrimComputerFg_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
    A380PrimComputerFg_B.SSM_npl = A380PrimComputerFg_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
    A380PrimComputerFg_B.Data_jsg = A380PrimComputerFg_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
    A380PrimComputerFg_B.SSM_gf = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.SSM;
    A380PrimComputerFg_B.Data_g1 = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.runway_heading_deg.Data;
    A380PrimComputerFg_B.capt_pitch_stick_pos = A380PrimComputerFg_U.in.data.analog_inputs.capt_pitch_stick_pos;
    A380PrimComputerFg_B.SSM_gbi = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.SSM;
    A380PrimComputerFg_B.Data_j4 = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.ils_frequency_mhz.Data;
    A380PrimComputerFg_B.SSM_fhm = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.SSM;
    A380PrimComputerFg_B.Data_jyh = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.localizer_deviation_deg.Data;
    A380PrimComputerFg_B.SSM_ltj = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.SSM;
    A380PrimComputerFg_B.Data_e4 = A380PrimComputerFg_U.in.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.Data;
    A380PrimComputerFg_B.SSM_hn = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.SSM;
    A380PrimComputerFg_B.Data_ghs = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.runway_heading_deg.Data;
    A380PrimComputerFg_B.SSM_h3 = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.SSM;
    A380PrimComputerFg_B.Data_bmk = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.ils_frequency_mhz.Data;
    A380PrimComputerFg_B.fo_pitch_stick_pos = A380PrimComputerFg_U.in.data.analog_inputs.fo_pitch_stick_pos;
    A380PrimComputerFg_B.SSM_bfs = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.SSM;
    A380PrimComputerFg_B.Data_lzt = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.localizer_deviation_deg.Data;
    A380PrimComputerFg_B.SSM_p0 = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.SSM;
    A380PrimComputerFg_B.Data_kn = A380PrimComputerFg_U.in.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.Data;
    A380PrimComputerFg_B.SSM_fu = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
    A380PrimComputerFg_B.Data_nab =
      A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
    A380PrimComputerFg_B.SSM_hr = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
    A380PrimComputerFg_B.Data_lgf = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
    A380PrimComputerFg_B.SSM_bi = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputerFg_B.Data_fpq =
      A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    A380PrimComputerFg_B.capt_roll_stick_pos = A380PrimComputerFg_U.in.data.analog_inputs.capt_roll_stick_pos;
    A380PrimComputerFg_B.SSM_bd = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
    A380PrimComputerFg_B.Data_dt = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
    A380PrimComputerFg_B.SSM_omt = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
    A380PrimComputerFg_B.Data_b1 = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
    A380PrimComputerFg_B.SSM_la = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
    A380PrimComputerFg_B.Data_nmr =
      A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
    A380PrimComputerFg_B.SSM_l1 = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
    A380PrimComputerFg_B.Data_ea = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
    A380PrimComputerFg_B.SSM_dy = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputerFg_B.Data_nib =
      A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    A380PrimComputerFg_B.fo_roll_stick_pos = A380PrimComputerFg_U.in.data.analog_inputs.fo_roll_stick_pos;
    A380PrimComputerFg_B.SSM_ie = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
    A380PrimComputerFg_B.Data_i2t = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
    A380PrimComputerFg_B.SSM_kf = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
    A380PrimComputerFg_B.Data_ng = A380PrimComputerFg_U.in.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
    A380PrimComputerFg_B.SSM_p5l = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_h31 = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_g3 = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_ew = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_b3 = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
    A380PrimComputerFg_B.Data_j1s = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
    A380PrimComputerFg_B.speed_brake_lever_pos = A380PrimComputerFg_U.in.data.analog_inputs.speed_brake_lever_pos;
    A380PrimComputerFg_B.SSM_dxv = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
    A380PrimComputerFg_B.Data_j5 = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
    A380PrimComputerFg_B.SSM_mxz = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_cw = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_kk4 = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_gqa = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_cy = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
    A380PrimComputerFg_B.Data_hz = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
    A380PrimComputerFg_B.SSM_ju = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
    A380PrimComputerFg_B.Data_fri = A380PrimComputerFg_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
    A380PrimComputerFg_B.thr_lever_1_pos = A380PrimComputerFg_U.in.data.analog_inputs.thr_lever_1_pos;
    A380PrimComputerFg_B.irdc_1_bus = A380PrimComputerFg_U.in.data.bus_inputs.irdc_1_bus;
    A380PrimComputerFg_B.irdc_2_bus = A380PrimComputerFg_U.in.data.bus_inputs.irdc_2_bus;
    A380PrimComputerFg_B.irdc_3_bus = A380PrimComputerFg_U.in.data.bus_inputs.irdc_3_bus;
    A380PrimComputerFg_B.irdc_4_a_bus = A380PrimComputerFg_U.in.data.bus_inputs.irdc_4_a_bus;
    A380PrimComputerFg_B.irdc_4_b_bus = A380PrimComputerFg_U.in.data.bus_inputs.irdc_4_b_bus;
    A380PrimComputerFg_B.SSM_ey = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.efis_discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_cm = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.efis_discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_jr = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.efis_discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_czj = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.efis_discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_hs = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.baro_setting_hpa.SSM;
    A380PrimComputerFg_B.thr_lever_2_pos = A380PrimComputerFg_U.in.data.analog_inputs.thr_lever_2_pos;
    A380PrimComputerFg_B.Data_mb = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.baro_setting_hpa.Data;
    A380PrimComputerFg_B.SSM_mx3 = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.baro_setting_inhg.SSM;
    A380PrimComputerFg_B.Data_gk4 = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.baro_setting_inhg.Data;
    A380PrimComputerFg_B.SSM_er = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_gbt = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_hm = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_p0 = A380PrimComputerFg_U.in.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_dm = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.efis_discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_dn = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.efis_discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_fk = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.efis_discrete_word_2.SSM;
    A380PrimComputerFg_B.thr_lever_3_pos = A380PrimComputerFg_U.in.data.analog_inputs.thr_lever_3_pos;
    A380PrimComputerFg_B.Data_iyw = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.efis_discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_lm1 = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.baro_setting_hpa.SSM;
    A380PrimComputerFg_B.Data_p5d = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.baro_setting_hpa.Data;
    A380PrimComputerFg_B.SSM_nc = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.baro_setting_inhg.SSM;
    A380PrimComputerFg_B.Data_oo = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.baro_setting_inhg.Data;
    A380PrimComputerFg_B.SSM_e4 = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_ho = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_bw = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_kqr = A380PrimComputerFg_U.in.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_na =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.slew_on = A380PrimComputerFg_U.in.data.sim_data.slew_on;
    A380PrimComputerFg_B.thr_lever_4_pos = A380PrimComputerFg_U.in.data.analog_inputs.thr_lever_4_pos;
    A380PrimComputerFg_B.Data_omv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_lf =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_mby =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_oz =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_hk =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_mub =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_hg =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_li =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_bi =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_hcd =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.elevator_1_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.elevator_1_pos_deg;
    A380PrimComputerFg_B.Data_i4u =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_php =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFg_B.Data_ik =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.Data;
    A380PrimComputerFg_B.SSM_ma =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFg_B.Data_dq =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.Data;
    A380PrimComputerFg_B.SSM_jut =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFg_B.Data_pv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.Data;
    A380PrimComputerFg_B.SSM_kh =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFg_B.Data_p1d =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.Data;
    A380PrimComputerFg_B.SSM_h2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFg_B.elevator_2_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.elevator_2_pos_deg;
    A380PrimComputerFg_B.Data_lyv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.Data;
    A380PrimComputerFg_B.SSM_ago =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFg_B.Data_ke =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.Data;
    A380PrimComputerFg_B.SSM_ep = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFg_B.Data_cv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.Data;
    A380PrimComputerFg_B.SSM_kc =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFg_B.Data_pfh =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.Data;
    A380PrimComputerFg_B.SSM_cnf =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFg_B.Data_jy4 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.Data;
    A380PrimComputerFg_B.SSM_lwa =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFg_B.elevator_3_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.elevator_3_pos_deg;
    A380PrimComputerFg_B.Data_o1 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.Data;
    A380PrimComputerFg_B.SSM_aq = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFg_B.Data_ga =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.Data;
    A380PrimComputerFg_B.SSM_ja2 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFg_B.Data_kd =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.Data;
    A380PrimComputerFg_B.SSM_in3 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFg_B.Data_fx =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.Data;
    A380PrimComputerFg_B.SSM_ap =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFg_B.Data_nml =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.Data;
    A380PrimComputerFg_B.SSM_mg = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFg_B.ths_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.ths_pos_deg;
    A380PrimComputerFg_B.Data_fa =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.Data;
    A380PrimComputerFg_B.SSM_mw =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFg_B.Data_nh =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.Data;
    A380PrimComputerFg_B.SSM_bu =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_or =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_cbb =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_otn =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_iao =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_cam =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_ip =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.left_aileron_1_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.left_aileron_1_pos_deg;
    A380PrimComputerFg_B.Data_gsl =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_f4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.SSM;
    A380PrimComputerFg_B.Data_amp = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.Data;
    A380PrimComputerFg_B.SSM_id = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.SSM;
    A380PrimComputerFg_B.Data_mv = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.Data;
    A380PrimComputerFg_B.SSM_mqr = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.SSM;
    A380PrimComputerFg_B.Data_gx = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.Data;
    A380PrimComputerFg_B.SSM_cm2 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_lb =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_ck =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.left_aileron_2_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.left_aileron_2_pos_deg;
    A380PrimComputerFg_B.Data_can =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_pl =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_gae =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_d50 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_h1 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_gs = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.SSM;
    A380PrimComputerFg_B.Data_bc =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.Data;
    A380PrimComputerFg_B.SSM_kse = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.SSM;
    A380PrimComputerFg_B.Data_fof = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.Data;
    A380PrimComputerFg_B.SSM_icj =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.right_aileron_1_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.right_aileron_1_pos_deg;
    A380PrimComputerFg_B.Data_nj =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_ds4 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_i0 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_gbf =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_lr =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_opv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_k0s =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_gha = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.SSM;
    A380PrimComputerFg_B.Data_m4b = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.Data;
    A380PrimComputerFg_B.SSM_ple = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.SSM;
    A380PrimComputerFg_B.right_aileron_2_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.right_aileron_2_pos_deg;
    A380PrimComputerFg_B.Data_e3r =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data;
    A380PrimComputerFg_B.SSM_h0n =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.SSM;
    A380PrimComputerFg_B.Data_au =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data;
    A380PrimComputerFg_B.SSM_c1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.SSM;
    A380PrimComputerFg_B.Data_czc = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.Data;
    A380PrimComputerFg_B.SSM_dd = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_itz = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_ai = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_nsk = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_at = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.SSM;
    A380PrimComputerFg_B.left_spoiler_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.left_spoiler_pos_deg;
    A380PrimComputerFg_B.Data_is = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data;
    A380PrimComputerFg_B.SSM_bz = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.SSM;
    A380PrimComputerFg_B.Data_pk = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.Data;
    A380PrimComputerFg_B.SSM_n0 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.SSM;
    A380PrimComputerFg_B.Data_f52 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.Data;
    A380PrimComputerFg_B.SSM_haz = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_dg0 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_hz = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_nru = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_hk = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM;
    A380PrimComputerFg_B.pause_on = A380PrimComputerFg_U.in.data.sim_data.pause_on;
    A380PrimComputerFg_B.right_spoiler_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.right_spoiler_pos_deg;
    A380PrimComputerFg_B.Data_d5 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data;
    A380PrimComputerFg_B.SSM_cvn = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.SSM;
    A380PrimComputerFg_B.Data_oa = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.Data;
    A380PrimComputerFg_B.SSM_iy = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.SSM;
    A380PrimComputerFg_B.Data_bp = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.Data;
    A380PrimComputerFg_B.SSM_jwz = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.SSM;
    A380PrimComputerFg_B.Data_cl = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.Data;
    A380PrimComputerFg_B.SSM_o2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.SSM;
    A380PrimComputerFg_B.Data_er = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.Data;
    A380PrimComputerFg_B.SSM_eig = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.SSM;
    A380PrimComputerFg_B.rudder_1_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.rudder_1_pos_deg;
    A380PrimComputerFg_B.Data_in = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.Data;
    A380PrimComputerFg_B.SSM_jl = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.SSM;
    A380PrimComputerFg_B.Data_btl = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.Data;
    A380PrimComputerFg_B.SSM_cci = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.SSM;
    A380PrimComputerFg_B.Data_a5 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.Data;
    A380PrimComputerFg_B.SSM_ow = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.SSM;
    A380PrimComputerFg_B.Data_hyo = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.Data;
    A380PrimComputerFg_B.SSM_bcj = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.SSM;
    A380PrimComputerFg_B.Data_bjx = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.Data;
    A380PrimComputerFg_B.SSM_i5 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_ls_kn.SSM;
    A380PrimComputerFg_B.rudder_2_pos_deg = A380PrimComputerFg_U.in.data.analog_inputs.rudder_2_pos_deg;
    A380PrimComputerFg_B.Data_ci = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_ls_kn.Data;
    A380PrimComputerFg_B.SSM_jww = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_stall_kn.SSM;
    A380PrimComputerFg_B.Data_h2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_stall_kn.Data;
    A380PrimComputerFg_B.SSM_kkj = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.SSM;
    A380PrimComputerFg_B.Data_ce = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.Data;
    A380PrimComputerFg_B.SSM_ndh = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_3_kn.SSM;
    A380PrimComputerFg_B.Data_dx = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_3_kn.Data;
    A380PrimComputerFg_B.SSM_k1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_4_kn.SSM;
    A380PrimComputerFg_B.Data_fvi = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_4_kn.Data;
    A380PrimComputerFg_B.SSM_en3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_man_kn.SSM;
    A380PrimComputerFg_B.rudder_pedal_pos = A380PrimComputerFg_U.in.data.analog_inputs.rudder_pedal_pos;
    A380PrimComputerFg_B.Data_gnm = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_man_kn.Data;
    A380PrimComputerFg_B.SSM_kl = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_max_kn.SSM;
    A380PrimComputerFg_B.Data_e3y = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_max_kn.Data;
    A380PrimComputerFg_B.SSM_po = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.SSM;
    A380PrimComputerFg_B.Data_ld = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.Data;
    A380PrimComputerFg_B.SSM_ie0 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_k3v = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fe.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_ay = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pfd_spd_tgt_kts.SSM;
    A380PrimComputerFg_B.Data_oi = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pfd_spd_tgt_kts.Data;
    A380PrimComputerFg_B.SSM_gsb = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pfd_short_term_mngd_spd_kts.SSM;
    A380PrimComputerFg_B.yellow_hyd_pressure_psi = A380PrimComputerFg_U.in.data.analog_inputs.yellow_hyd_pressure_psi;
    A380PrimComputerFg_B.Data_oy =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pfd_short_term_mngd_spd_kts.Data;
    A380PrimComputerFg_B.SSM_mxy = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_spd_kts.SSM;
    A380PrimComputerFg_B.Data_nl = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_spd_kts.Data;
    A380PrimComputerFg_B.SSM_gt = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_mach_kts.SSM;
    A380PrimComputerFg_B.Data_aei = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_mach_kts.Data;
    A380PrimComputerFg_B.SSM_cum = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_hdg_deg.SSM;
    A380PrimComputerFg_B.Data_jz = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_hdg_deg.Data;
    A380PrimComputerFg_B.SSM_ka = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_trk_deg.SSM;
    A380PrimComputerFg_B.Data_pwfb = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_trk_deg.Data;
    A380PrimComputerFg_B.SSM_lu = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_alt_ft.SSM;
    A380PrimComputerFg_B.green_hyd_pressure_psi = A380PrimComputerFg_U.in.data.analog_inputs.green_hyd_pressure_psi;
    A380PrimComputerFg_B.Data_la = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_alt_ft.Data;
    A380PrimComputerFg_B.SSM_c5 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_vs_ft_min.SSM;
    A380PrimComputerFg_B.Data_b0 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_vs_ft_min.Data;
    A380PrimComputerFg_B.SSM_ol = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_fpa_deg.SSM;
    A380PrimComputerFg_B.Data_g5 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.selected_fpa_deg.Data;
    A380PrimComputerFg_B.SSM_k2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.runway_hdg_memorized_deg.SSM;
    A380PrimComputerFg_B.Data_os = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.runway_hdg_memorized_deg.Data;
    A380PrimComputerFg_B.SSM_gn = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.preset_mach_from_fms.SSM;
    A380PrimComputerFg_B.Data_btc = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.preset_mach_from_fms.Data;
    A380PrimComputerFg_B.SSM_bdi = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.preset_speed_from_fms_kts.SSM;
    A380PrimComputerFg_B.vert_acc_1_g = A380PrimComputerFg_U.in.data.analog_inputs.vert_acc_1_g;
    A380PrimComputerFg_B.Data_nhn = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.preset_speed_from_fms_kts.Data;
    A380PrimComputerFg_B.SSM_lil = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.roll_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_im = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.roll_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_lmv = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_no = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_ig = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_av = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_ch = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.roll_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_me = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.roll_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_ef = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_2.SSM;
    A380PrimComputerFg_B.vert_acc_2_g = A380PrimComputerFg_U.in.data.analog_inputs.vert_acc_2_g;
    A380PrimComputerFg_B.Data_hc = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_dbs = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_f5c = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_ilr = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_5.SSM;
    A380PrimComputerFg_B.Data_iu = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_5.Data;
    A380PrimComputerFg_B.SSM_ch3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_4.SSM;
    A380PrimComputerFg_B.Data_ihf = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_4.Data;
    A380PrimComputerFg_B.SSM_ozd = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.fm_alt_constraint_ft.SSM;
    A380PrimComputerFg_B.Data_ao = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.fm_alt_constraint_ft.Data;
    A380PrimComputerFg_B.SSM_ob = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.ats_discrete_word.SSM;
    A380PrimComputerFg_B.vert_acc_3_g = A380PrimComputerFg_U.in.data.analog_inputs.vert_acc_3_g;
    A380PrimComputerFg_B.Data_c2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.ats_discrete_word.Data;
    A380PrimComputerFg_B.SSM_dd4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.ats_fma_discrete_word.SSM;
    A380PrimComputerFg_B.Data_f1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.ats_fma_discrete_word.Data;
    A380PrimComputerFg_B.SSM_ps = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_3.SSM;
    A380PrimComputerFg_B.Data_nst = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_3.Data;
    A380PrimComputerFg_B.SSM_agc = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_fq = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_nt = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_amc = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_oa = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_6.SSM;
    A380PrimComputerFg_B.lat_acc_1_g = A380PrimComputerFg_U.in.data.analog_inputs.lat_acc_1_g;
    A380PrimComputerFg_B.Data_nn1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_6.Data;
    A380PrimComputerFg_B.SSM_oj = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.low_target_speed_margin_kts.SSM;
    A380PrimComputerFg_B.Data_b0d =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.low_target_speed_margin_kts.Data;
    A380PrimComputerFg_B.SSM_lq = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.high_target_speed_margin_kts.SSM;
    A380PrimComputerFg_B.Data_bri =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.high_target_speed_margin_kts.Data;
    A380PrimComputerFg_B.SSM_fc = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.nosewheel_cmd_deg.SSM;
    A380PrimComputerFg_B.Data_nmx = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.nosewheel_cmd_deg.Data;
    A380PrimComputerFg_B.SSM_do = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.n1_command_percent.SSM;
    A380PrimComputerFg_B.Data_oal = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.n1_command_percent.Data;
    A380PrimComputerFg_B.SSM_eu = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.flx_to_temp_deg_c.SSM;
    A380PrimComputerFg_B.tracking_mode_on_override = A380PrimComputerFg_U.in.data.sim_data.tracking_mode_on_override;
    A380PrimComputerFg_B.lat_acc_2_g = A380PrimComputerFg_U.in.data.analog_inputs.lat_acc_2_g;
    A380PrimComputerFg_B.Data_dmb = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.flx_to_temp_deg_c.Data;
    A380PrimComputerFg_B.SSM_pjf = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_7.SSM;
    A380PrimComputerFg_B.Data_nf = A380PrimComputerFg_U.in.data.bus_inputs.prim_x_bus.fg.discrete_word_7.Data;
    A380PrimComputerFg_B.SSM_gu =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_anh =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_jsu =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_idf =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_eb =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_gm =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_dbu =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.lat_acc_3_g = A380PrimComputerFg_U.in.data.analog_inputs.lat_acc_3_g;
    A380PrimComputerFg_B.Data_jqv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_hh =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_ni3 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_jsuo =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFg_B.Data_d1 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFg_B.SSM_dj = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFg_B.Data_dv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.Data;
    A380PrimComputerFg_B.SSM_oio =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFg_B.Data_oq4 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.Data;
    A380PrimComputerFg_B.SSM_ewd =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFg_B.left_body_wheel_speed = A380PrimComputerFg_U.in.data.analog_inputs.left_body_wheel_speed;
    A380PrimComputerFg_B.Data_fb =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.Data;
    A380PrimComputerFg_B.SSM_pjk =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFg_B.Data_bsv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.Data;
    A380PrimComputerFg_B.SSM_j3l =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFg_B.Data_nt =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.Data;
    A380PrimComputerFg_B.SSM_ceq =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFg_B.Data_ac =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.Data;
    A380PrimComputerFg_B.SSM_d4h =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFg_B.Data_dcn =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.Data;
    A380PrimComputerFg_B.SSM_dc =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFg_B.left_wing_wheel_speed = A380PrimComputerFg_U.in.data.analog_inputs.left_wing_wheel_speed;
    A380PrimComputerFg_B.Data_joe =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.Data;
    A380PrimComputerFg_B.SSM_obg =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFg_B.Data_nol =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.Data;
    A380PrimComputerFg_B.SSM_b5 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFg_B.Data_bun =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.Data;
    A380PrimComputerFg_B.SSM_al = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFg_B.Data_ge =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.Data;
    A380PrimComputerFg_B.SSM_hib =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFg_B.Data_mj =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.Data;
    A380PrimComputerFg_B.SSM_dbe =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFg_B.right_body_wheel_speed = A380PrimComputerFg_U.in.data.analog_inputs.right_body_wheel_speed;
    A380PrimComputerFg_B.Data_naq =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.Data;
    A380PrimComputerFg_B.SSM_b1 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFg_B.Data_j43 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.Data;
    A380PrimComputerFg_B.SSM_d0 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFg_B.Data_po =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.Data;
    A380PrimComputerFg_B.SSM_m5 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFg_B.Data_ey =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.Data;
    A380PrimComputerFg_B.SSM_jli =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_a3 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_mxc =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.right_wing_wheel_speed = A380PrimComputerFg_U.in.data.analog_inputs.right_wing_wheel_speed;
    A380PrimComputerFg_B.Data_pey =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_ogm =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_kf =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_nlt =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFg_B.Data_hk1 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFg_B.SSM_dz = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.SSM;
    A380PrimComputerFg_B.Data_grt = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.Data;
    A380PrimComputerFg_B.SSM_oiy = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.SSM;
    A380PrimComputerFg_B.Data_cmi =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.Data;
    A380PrimComputerFg_B.SSM_jsb = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.SSM;
    A380PrimComputerFg_B.SSM_i5w = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
    A380PrimComputerFg_B.Data_eyi =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.Data;
    A380PrimComputerFg_B.SSM_my5 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_jr =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_lp =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_hom =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_hlu =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_je =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_hu3 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_k5 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_d5s = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.SSM;
    A380PrimComputerFg_B.Data_hux = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    A380PrimComputerFg_B.Data_ima =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.Data;
    A380PrimComputerFg_B.SSM_n4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.SSM;
    A380PrimComputerFg_B.Data_c4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.Data;
    A380PrimComputerFg_B.SSM_gg =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_bk =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_kkj5 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_fb4 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_cr =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_jf =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_nx =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.SSM_ebo = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft.SSM;
    A380PrimComputerFg_B.Data_mz =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_po3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.SSM;
    A380PrimComputerFg_B.Data_p3h = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.Data;
    A380PrimComputerFg_B.SSM_o0 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.SSM;
    A380PrimComputerFg_B.Data_kv =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data;
    A380PrimComputerFg_B.SSM_mt = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.SSM;
    A380PrimComputerFg_B.Data_bv1 =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data;
    A380PrimComputerFg_B.SSM_o5 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.SSM;
    A380PrimComputerFg_B.Data_g4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.Data;
    A380PrimComputerFg_B.SSM_mkz = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_iyr = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft.Data;
    A380PrimComputerFg_B.Data_otv = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_dqh = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_kqu = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_ki = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.SSM;
    A380PrimComputerFg_B.Data_n4p = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.Data;
    A380PrimComputerFg_B.SSM_ez = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.SSM;
    A380PrimComputerFg_B.Data_n3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.Data;
    A380PrimComputerFg_B.SSM_k4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.SSM;
    A380PrimComputerFg_B.Data_ma = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.Data;
    A380PrimComputerFg_B.SSM_ac = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.SSM;
    A380PrimComputerFg_B.tailstrike_protection_on = A380PrimComputerFg_U.in.data.sim_data.tailstrike_protection_on;
    A380PrimComputerFg_B.SSM_klm = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft.SSM;
    A380PrimComputerFg_B.Data_gsd = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_iz = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ij = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_b4c = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.SSM;
    A380PrimComputerFg_B.Data_ogy = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.Data;
    A380PrimComputerFg_B.SSM_gn1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM;
    A380PrimComputerFg_B.Data_hc3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data;
    A380PrimComputerFg_B.SSM_p0z = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.SSM;
    A380PrimComputerFg_B.Data_m5 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.Data;
    A380PrimComputerFg_B.SSM_iet = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.SSM;
    A380PrimComputerFg_B.Data_mcz = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft.Data;
    A380PrimComputerFg_B.Data_cxq = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.Data;
    A380PrimComputerFg_B.SSM_omi = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.SSM;
    A380PrimComputerFg_B.Data_oat = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.Data;
    A380PrimComputerFg_B.SSM_bdv = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.SSM;
    A380PrimComputerFg_B.Data_f4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.Data;
    A380PrimComputerFg_B.SSM_hhc = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.SSM;
    A380PrimComputerFg_B.Data_itt = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.Data;
    A380PrimComputerFg_B.SSM_apw = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.SSM;
    A380PrimComputerFg_B.Data_hr = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.Data;
    A380PrimComputerFg_B.SSM_e2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.SSM;
    A380PrimComputerFg_B.SSM_crl = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.mach.SSM;
    A380PrimComputerFg_B.Data_cta = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.Data;
    A380PrimComputerFg_B.SSM_goz = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.SSM;
    A380PrimComputerFg_B.Data_kn3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.Data;
    A380PrimComputerFg_B.SSM_mku = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_ls_kn.SSM;
    A380PrimComputerFg_B.Data_aj = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_ls_kn.Data;
    A380PrimComputerFg_B.SSM_k24 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_stall_kn.SSM;
    A380PrimComputerFg_B.Data_ml = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_stall_kn.Data;
    A380PrimComputerFg_B.SSM_l2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.SSM;
    A380PrimComputerFg_B.Data_l55 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.Data;
    A380PrimComputerFg_B.SSM_lfy = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_3_kn.SSM;
    A380PrimComputerFg_B.Data_g5n = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.mach.Data;
    A380PrimComputerFg_B.Data_hi = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_3_kn.Data;
    A380PrimComputerFg_B.SSM_aj = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_4_kn.SSM;
    A380PrimComputerFg_B.Data_ad = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_4_kn.Data;
    A380PrimComputerFg_B.SSM_he = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_man_kn.SSM;
    A380PrimComputerFg_B.Data_lyc = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_man_kn.Data;
    A380PrimComputerFg_B.SSM_hkw = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_max_kn.SSM;
    A380PrimComputerFg_B.Data_kw = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_max_kn.Data;
    A380PrimComputerFg_B.SSM_m2q = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.SSM;
    A380PrimComputerFg_B.Data_oue = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.Data;
    A380PrimComputerFg_B.SSM_bg = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.discrete_word_1.SSM;
    A380PrimComputerFg_B.SSM_n2 = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFg_B.Data_njd = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fe.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_nq = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pfd_spd_tgt_kts.SSM;
    A380PrimComputerFg_B.Data_n1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pfd_spd_tgt_kts.Data;
    A380PrimComputerFg_B.SSM_hng = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pfd_short_term_mngd_spd_kts.SSM;
    A380PrimComputerFg_B.Data_ihk =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pfd_short_term_mngd_spd_kts.Data;
    A380PrimComputerFg_B.SSM_pd = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_spd_kts.SSM;
    A380PrimComputerFg_B.Data_hiq = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_spd_kts.Data;
    A380PrimComputerFg_B.SSM_or = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_mach_kts.SSM;
    A380PrimComputerFg_B.Data_lb2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_mach_kts.Data;
    A380PrimComputerFg_B.SSM_ao = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_hdg_deg.SSM;
    A380PrimComputerFg_B.Data_dr = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    A380PrimComputerFg_B.Data_l5t = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_hdg_deg.Data;
    A380PrimComputerFg_B.SSM_e4y = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_trk_deg.SSM;
    A380PrimComputerFg_B.Data_p5q = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_trk_deg.Data;
    A380PrimComputerFg_B.SSM_lk = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_alt_ft.SSM;
    A380PrimComputerFg_B.Data_by = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_alt_ft.Data;
    A380PrimComputerFg_B.SSM_cmh = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_vs_ft_min.SSM;
    A380PrimComputerFg_B.Data_fz4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_vs_ft_min.Data;
    A380PrimComputerFg_B.SSM_fb = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_fpa_deg.SSM;
    A380PrimComputerFg_B.Data_bf = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.selected_fpa_deg.Data;
    A380PrimComputerFg_B.SSM_jwb = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.runway_hdg_memorized_deg.SSM;
    A380PrimComputerFg_B.SSM_pb = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
    A380PrimComputerFg_B.Data_o3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.runway_hdg_memorized_deg.Data;
    A380PrimComputerFg_B.SSM_lqf = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.preset_mach_from_fms.SSM;
    A380PrimComputerFg_B.Data_b0i = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.preset_mach_from_fms.Data;
    A380PrimComputerFg_B.SSM_f4j = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.preset_speed_from_fms_kts.SSM;
    A380PrimComputerFg_B.Data_ki2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.preset_speed_from_fms_kts.Data;
    A380PrimComputerFg_B.SSM_a0z = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.roll_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_adu = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.roll_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_hj = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_h4h = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_nrk = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_1.SSM;
    A380PrimComputerFg_B.Data_c0z = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    A380PrimComputerFg_B.Data_dod = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_1.Data;
    A380PrimComputerFg_B.SSM_bl = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.roll_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_fqj = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.roll_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_gx = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_hgw = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_i3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_2.SSM;
    A380PrimComputerFg_B.Data_dko = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_2.Data;
    A380PrimComputerFg_B.SSM_nx2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_5.SSM;
    A380PrimComputerFg_B.Data_iga = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_5.Data;
    A380PrimComputerFg_B.SSM_jm = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_4.SSM;
    A380PrimComputerFg_B.SSM_kr = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFg_B.Data_hds = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_4.Data;
    A380PrimComputerFg_B.SSM_khm = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.fm_alt_constraint_ft.SSM;
    A380PrimComputerFg_B.Data_dqt = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.fm_alt_constraint_ft.Data;
    A380PrimComputerFg_B.SSM_m1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.ats_discrete_word.SSM;
    A380PrimComputerFg_B.Data_pd = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.ats_discrete_word.Data;
    A380PrimComputerFg_B.SSM_ek = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.ats_fma_discrete_word.SSM;
    A380PrimComputerFg_B.Data_i0g = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.ats_fma_discrete_word.Data;
    A380PrimComputerFg_B.SSM_g1 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_3.SSM;
    A380PrimComputerFg_B.Data_jzm = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_3.Data;
    A380PrimComputerFg_B.SSM_c4 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_1.SSM;
    A380PrimComputerFg_B.Data_li = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFg_B.Data_bs3 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_1.Data;
    A380PrimComputerFg_B.SSM_kj = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_2.SSM;
    A380PrimComputerFg_B.Data_ko = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_2.Data;
    A380PrimComputerFg_B.SSM_fn = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_6.SSM;
    A380PrimComputerFg_B.Data_nq = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_6.Data;
    A380PrimComputerFg_B.SSM_jb = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.low_target_speed_margin_kts.SSM;
    A380PrimComputerFg_B.Data_ita =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.low_target_speed_margin_kts.Data;
    A380PrimComputerFg_B.SSM_ku = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.high_target_speed_margin_kts.SSM;
    A380PrimComputerFg_B.Data_pn =
      A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.high_target_speed_margin_kts.Data;
    A380PrimComputerFg_B.SSM_irk = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.nosewheel_cmd_deg.SSM;
    A380PrimComputerFg_B.computer_running = A380PrimComputerFg_U.in.data.sim_data.computer_running;
    A380PrimComputerFg_B.SSM_f5q = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFg_B.Data_lgm = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.nosewheel_cmd_deg.Data;
    A380PrimComputerFg_B.SSM_nca = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.n1_command_percent.SSM;
    A380PrimComputerFg_B.Data_ir = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.n1_command_percent.Data;
    A380PrimComputerFg_B.SSM_im = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.flx_to_temp_deg_c.SSM;
    A380PrimComputerFg_B.Data_jv = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.flx_to_temp_deg_c.Data;
    A380PrimComputerFg_B.SSM_j2 = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_7.SSM;
    A380PrimComputerFg_B.Data_ore = A380PrimComputerFg_U.in.data.bus_inputs.prim_y_bus.fg.discrete_word_7.Data;
    A380PrimComputerFg_B.SSM_ba5 =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_ijm =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_p4l =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_jet = A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    A380PrimComputerFg_B.Data_jo0 =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_l25 = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_bn =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_e4o =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_izj =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_d1a = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFg_B.Data_pdd = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFg_B.SSM_bol = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.aileron_status_word.SSM;
    A380PrimComputerFg_B.Data_bjv = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.aileron_status_word.Data;
    A380PrimComputerFg_B.SSM_mi = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.SSM_cyd =
      A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFg_B.Data_lye = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_py = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ft = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_lp0 = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_a2 = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_f0 = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ii = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_gj = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM;
    A380PrimComputerFg_B.Data_of3 = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word.Data;
    A380PrimComputerFg_B.SSM_ncq = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_k4 =
      A380PrimComputerFg_U.in.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFg_B.Data_pj = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_ix = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_es = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_gle = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_mly = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_h21 = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_p3m = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_cf = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_status_word.SSM;
    A380PrimComputerFg_B.Data_ijw = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_status_word.Data;
    A380PrimComputerFg_B.SSM_ghc = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFg_B.SSM_ai4 = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
    A380PrimComputerFg_B.Data_fqp = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_lj = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_liu = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_nsn = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFg_B.Data_ki1 = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data;
    A380PrimComputerFg_B.SSM_ovo = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.ths_position_deg.SSM;
    A380PrimComputerFg_B.Data_byo = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.ths_position_deg.Data;
    A380PrimComputerFg_B.SSM_nst = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
    A380PrimComputerFg_B.Data_cwz = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
    A380PrimComputerFg_B.SSM_iv = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_ixn = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    A380PrimComputerFg_B.Data_k2d = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_pq = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_h5f = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_ii = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFg_B.Data_c0o = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFg_B.SSM_olh = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM;
    A380PrimComputerFg_B.Data_db = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data;
    A380PrimComputerFg_B.SSM_fkb = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM;
    A380PrimComputerFg_B.Data_dcz = A380PrimComputerFg_U.in.data.bus_inputs.sec_1_bus.misc_data_status_word.Data;
    A380PrimComputerFg_B.SSM_gev =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.SSM_j2m = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft.SSM;
    A380PrimComputerFg_B.Data_ork =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_jp =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_f11 =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_iu = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_hyn =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_bew =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_cg =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_eie = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFg_B.Data_mor = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFg_B.SSM_nk = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.aileron_status_word.SSM;
    A380PrimComputerFg_B.Data_i1 = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft.Data;
    A380PrimComputerFg_B.Data_l1 = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.aileron_status_word.Data;
    A380PrimComputerFg_B.SSM_buw = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_ms = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_ht = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ag = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_io = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_epm = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_igr = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_pp = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_np1 = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM;
    A380PrimComputerFg_B.SSM_fc4 = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft.SSM;
    A380PrimComputerFg_B.Data_nek = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word.Data;
    A380PrimComputerFg_B.SSM_hkwh = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_cho = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_ahu = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_aet = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_ka4 = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_oxr = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_k2r = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_oq5 = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_i0 = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_status_word.SSM;
    A380PrimComputerFg_B.Data_ihw = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft.Data;
    A380PrimComputerFg_B.Data_cuh = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_status_word.Data;
    A380PrimComputerFg_B.SSM_jes = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_jlt = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_kg = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_jm = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_frj = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFg_B.Data_fg = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data;
    A380PrimComputerFg_B.SSM_ej = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.ths_position_deg.SSM;
    A380PrimComputerFg_B.Data_np = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.ths_position_deg.Data;
    A380PrimComputerFg_B.SSM_ok = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
    A380PrimComputerFg_B.alignment_dummy_h = A380PrimComputerFg_U.in.data.discrete_inputs.alignment_dummy;
    A380PrimComputerFg_B.SSM_m4 = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.mach.SSM;
    A380PrimComputerFg_B.Data_pmi = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
    A380PrimComputerFg_B.SSM_iyk = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_b2 = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_mv = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ogu = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_f4l = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFg_B.Data_lw = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFg_B.SSM_mtx = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM;
    A380PrimComputerFg_B.Data_f44 = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data;
    A380PrimComputerFg_B.SSM_ahy = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM;
    A380PrimComputerFg_B.Data_buw = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.mach.Data;
    A380PrimComputerFg_B.Data_oau = A380PrimComputerFg_U.in.data.bus_inputs.sec_2_bus.misc_data_status_word.Data;
    A380PrimComputerFg_B.SSM_ovo2 =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_aoh =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_hsq =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFg_B.Data_mon =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFg_B.SSM_nxn = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_i4t =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_nnx =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFg_B.Data_mt =
      A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFg_B.SSM_lo = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFg_B.SSM_dir = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFg_B.Data_jh0 = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFg_B.SSM_apz = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.aileron_status_word.SSM;
    A380PrimComputerFg_B.Data_nvn = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.aileron_status_word.Data;
    A380PrimComputerFg_B.SSM_fi = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_b0e = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_iw = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_f22 = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_dfj = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_dn0 = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_e1 = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ctc = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    A380PrimComputerFg_B.Data_ngo = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_mp = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM;
    A380PrimComputerFg_B.Data_bkg = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word.Data;
    A380PrimComputerFg_B.SSM_k2j = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_ora = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_eyo = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_cd = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_ceqr = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_inj = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_c3y = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFg_B.SSM_eib = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
    A380PrimComputerFg_B.Data_fno = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_em = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_status_word.SSM;
    A380PrimComputerFg_B.Data_dd = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_status_word.Data;
    A380PrimComputerFg_B.SSM_cre = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_jff = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_lfz = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_fh = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_pji = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFg_B.Data_kc = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data;
    A380PrimComputerFg_B.SSM_hbr = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.ths_position_deg.SSM;
    A380PrimComputerFg_B.Data_cd0 = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    A380PrimComputerFg_B.Data_odm = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.ths_position_deg.Data;
    A380PrimComputerFg_B.SSM_p2n = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.SSM;
    A380PrimComputerFg_B.Data_h5r = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.Data;
    A380PrimComputerFg_B.SSM_lc = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFg_B.Data_pb = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data;
    A380PrimComputerFg_B.SSM_haw = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFg_B.Data_ma4 = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data;
    A380PrimComputerFg_B.SSM_km = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFg_B.Data_hwb = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFg_B.SSM_chn = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM;
    A380PrimComputerFg_B.SSM_bqd = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFg_B.Data_ndk = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data;
    A380PrimComputerFg_B.SSM_cz = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM;
    A380PrimComputerFg_B.Data_e1h = A380PrimComputerFg_U.in.data.bus_inputs.sec_3_bus.misc_data_status_word.Data;
    A380PrimComputerFg_B.fm_valid = A380PrimComputerFg_U.in.data.adcn_inputs.fms.fm_valid;
    A380PrimComputerFg_B.active_fms_flight_phase = A380PrimComputerFg_U.in.data.adcn_inputs.fms.active_fms_flight_phase;
    A380PrimComputerFg_B.selected_approach_type = A380PrimComputerFg_U.in.data.adcn_inputs.fms.selected_approach_type;
    A380PrimComputerFg_B.backbeam_selected = A380PrimComputerFg_U.in.data.adcn_inputs.fms.backbeam_selected;
    A380PrimComputerFg_B.fms_loc_distance = A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_loc_distance;
    A380PrimComputerFg_B.fms_unrealistic_gs_angle_deg =
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_unrealistic_gs_angle_deg;
    A380PrimComputerFg_B.fms_weight_lbs = A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_weight_lbs;
    A380PrimComputerFg_B.Data_gw = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFg_B.fms_cg_percent = A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_cg_percent;
    A380PrimComputerFg_B.lateral_flight_plan_valid =
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.lateral_flight_plan_valid;
    A380PrimComputerFg_B.nav_capture_condition = A380PrimComputerFg_U.in.data.adcn_inputs.fms.nav_capture_condition;
    A380PrimComputerFg_B.phi_c_deg = A380PrimComputerFg_U.in.data.adcn_inputs.fms.phi_c_deg;
    A380PrimComputerFg_B.xtk_nmi = A380PrimComputerFg_U.in.data.adcn_inputs.fms.xtk_nmi;
    A380PrimComputerFg_B.tke_deg = A380PrimComputerFg_U.in.data.adcn_inputs.fms.tke_deg;
    A380PrimComputerFg_B.phi_limit_deg = A380PrimComputerFg_U.in.data.adcn_inputs.fms.phi_limit_deg;
    A380PrimComputerFg_B.direct_to_nav_engage = A380PrimComputerFg_U.in.data.adcn_inputs.fms.direct_to_nav_engage;
    A380PrimComputerFg_B.vertical_flight_plan_valid =
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.vertical_flight_plan_valid;
    A380PrimComputerFg_B.final_app_can_engage = A380PrimComputerFg_U.in.data.adcn_inputs.fms.final_app_can_engage;
    A380PrimComputerFg_B.SSM_dby = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFg_B.next_alt_cstr_ft = A380PrimComputerFg_U.in.data.adcn_inputs.fms.next_alt_cstr_ft;
    A380PrimComputerFg_B.requested_des_submode = A380PrimComputerFg_U.in.data.adcn_inputs.fms.requested_des_submode;
    A380PrimComputerFg_B.alt_profile_tgt_ft = A380PrimComputerFg_U.in.data.adcn_inputs.fms.alt_profile_tgt_ft;
    A380PrimComputerFg_B.vs_target_ft_min = A380PrimComputerFg_U.in.data.adcn_inputs.fms.vs_target_ft_min;
    A380PrimComputerFg_B.v_2_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_2_kts;
    A380PrimComputerFg_B.v_app_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_app_kts;
    A380PrimComputerFg_B.v_managed_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_managed_kts;
    A380PrimComputerFg_B.v_upper_margin_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_upper_margin_kts;
    A380PrimComputerFg_B.v_lower_margin_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.v_lower_margin_kts;
    A380PrimComputerFg_B.show_speed_margins = A380PrimComputerFg_U.in.data.adcn_inputs.fms.show_speed_margins;
    A380PrimComputerFg_B.Data_pr = A380PrimComputerFg_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    A380PrimComputerFg_B.preset_spd_kts = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_kts;
    A380PrimComputerFg_B.preset_mach = A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_mach;
    A380PrimComputerFg_B.preset_spd_mach_activate =
      A380PrimComputerFg_U.in.data.adcn_inputs.fms.preset_spd_mach_activate;
    A380PrimComputerFg_B.fms_spd_mode_activate = A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_spd_mode_activate;
    A380PrimComputerFg_B.fms_mach_mode_activate = A380PrimComputerFg_U.in.data.adcn_inputs.fms.fms_mach_mode_activate;
    A380PrimComputerFg_B.flex_temp_deg_c = A380PrimComputerFg_U.in.data.adcn_inputs.fms.flex_temp_deg_c;
    A380PrimComputerFg_B.acceleration_alt_ft = A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_ft;
    A380PrimComputerFg_B.acceleration_alt_eo_ft = A380PrimComputerFg_U.in.data.adcn_inputs.fms.acceleration_alt_eo_ft;
    A380PrimComputerFg_B.thrust_reduction_alt_ft = A380PrimComputerFg_U.in.data.adcn_inputs.fms.thrust_reduction_alt_ft;
    A380PrimComputerFg_B.cruise_alt_ft = A380PrimComputerFg_U.in.data.adcn_inputs.fms.cruise_alt_ft;
    A380PrimComputerFg_DWork.Delay_29_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.tcas_active;
    A380PrimComputerFg_DWork.Delay_8_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.rwy_loc_submode_active;
    A380PrimComputerFg_DWork.Delay_10_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.land_active;
    A380PrimComputerFg_DWork.Delay_34_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.land_armed;
    A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_B.mach_control_active;
    A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_B.mach_control_active;
    A380PrimComputerFg_DWork.Delay_DSTATE_a = A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_DWork.Delay_2_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.nav_active;
    A380PrimComputerFg_DWork.Delay_3_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.loc_cpt_active;
    A380PrimComputerFg_DWork.Delay_4_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.loc_trk_active;
    A380PrimComputerFg_DWork.Delay_12_DSTATE =
      A380PrimComputerFg_U.in.fg_mode_logic.lateral_modes.rollout_submode_active;
    A380PrimComputerFg_DWork.Delay_13_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.clb_active;
    A380PrimComputerFg_DWork.Delay_14_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.des_active;
    A380PrimComputerFg_DWork.Delay_17_DSTATE =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_takeoff_active;
    A380PrimComputerFg_DWork.Delay_18_DSTATE =
      A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.pitch_goaround_active;
    A380PrimComputerFg_DWork.Delay_21_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.alt_acq_active;
    A380PrimComputerFg_DWork.Delay_22_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.longitudinal_modes.alt_hold_active;
    A380PrimComputerFg_DWork.Delay_30_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.alt_acq_armed;
    A380PrimComputerFg_DWork.Delay_35_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.glide_armed;
    A380PrimComputerFg_DWork.Delay_36_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.final_des_armed;
    A380PrimComputerFg_DWork.Delay_37_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.clb_armed;
    A380PrimComputerFg_DWork.Delay_38_DSTATE = A380PrimComputerFg_U.in.fg_mode_logic.armed_modes.des_armed;
    A380PrimComputerFg_DWork.Delay_42_DSTATE = A380PrimComputerFg_B.auto_spd_control_active;
    A380PrimComputerFg_DWork.Delay_43_DSTATE = A380PrimComputerFg_B.manual_spd_control_active;
    A380PrimComputerFg_DWork.Delay_47_DSTATE = A380PrimComputerFg_B.alpha_floor_mode_active;
    A380PrimComputerFg_DWork.Delay_48_DSTATE = A380PrimComputerFg_B.thrust_mode_active;
    A380PrimComputerFg_DWork.Delay_50_DSTATE = A380PrimComputerFg_B.speed_mach_mode_active;
    A380PrimComputerFg_DWork.Delay_51_DSTATE = A380PrimComputerFg_B.retard_mode_active;
    A380PrimComputerFg_DWork.Delay_56_DSTATE = A380PrimComputerFg_B.alt_cstr_applicable;
    A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_B.fd_1_engaged;
    A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_B.ap_1_engaged;
    A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_B.ap_2_engaged;
    A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_B.ap_1_engaged;
    A380PrimComputerFg_DWork.Delay_DSTATE_d = A380PrimComputerFg_B.ap_2_engaged;
    A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_B.ap_1_engaged;
    A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_B.ap_2_engaged;
    A380PrimComputerFg_DWork.Memory_PreviousInput_l5 = A380PrimComputerFg_B.auto_spd_control_active;
    A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_B.athr_engaged;
    A380PrimComputerFg_DWork.Memory_PreviousInput_io = A380PrimComputerFg_B.athr_engaged;
    A380PrimComputerFg_DWork.Memory_PreviousInput_iy = A380PrimComputerFg_B.alpha_floor_mode_active;
    A380PrimComputerFg_DWork.Delay_DSTATE_j = A380PrimComputerFg_P.Constant_Value_n;
    A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_B.manual_spd_control_active;
    A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_B.thrust_mode_active;
    A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_B.speed_mach_mode_active;
    A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_B.retard_mode_active;
  } else {
    A380PrimComputerFg_DWork.Runtime_MODE = false;
  }

  A380PrimComputerFg_Y.out.data.time.dt = A380PrimComputerFg_B.dt;
  A380PrimComputerFg_Y.out.data.time.simulation_time = A380PrimComputerFg_B.simulation_time;
  A380PrimComputerFg_Y.out.data.time.monotonic_time = A380PrimComputerFg_B.monotonic_time;
  A380PrimComputerFg_Y.out.data.sim_data.slew_on = A380PrimComputerFg_B.slew_on;
  A380PrimComputerFg_Y.out.data.sim_data.pause_on = A380PrimComputerFg_B.pause_on;
  A380PrimComputerFg_Y.out.data.sim_data.tracking_mode_on_override = A380PrimComputerFg_B.tracking_mode_on_override;
  A380PrimComputerFg_Y.out.data.sim_data.tailstrike_protection_on = A380PrimComputerFg_B.tailstrike_protection_on;
  A380PrimComputerFg_Y.out.data.sim_data.computer_running = A380PrimComputerFg_B.computer_running;
  A380PrimComputerFg_Y.out.data.discrete_inputs.alignment_dummy = A380PrimComputerFg_B.alignment_dummy_h;
  A380PrimComputerFg_Y.out.data.discrete_inputs.prim_overhead_button_pressed =
    A380PrimComputerFg_B.prim_overhead_button_pressed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.is_unit_1 = A380PrimComputerFg_B.is_unit_1;
  A380PrimComputerFg_Y.out.data.discrete_inputs.is_unit_2 = A380PrimComputerFg_B.is_unit_2;
  A380PrimComputerFg_Y.out.data.discrete_inputs.is_unit_3 = A380PrimComputerFg_B.is_unit_3;
  A380PrimComputerFg_Y.out.data.discrete_inputs.capt_priority_takeover_pressed =
    A380PrimComputerFg_B.capt_priority_takeover_pressed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.fo_priority_takeover_pressed =
    A380PrimComputerFg_B.fo_priority_takeover_pressed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.ap_1_pushbutton_pressed = A380PrimComputerFg_B.ap_1_pushbutton_pressed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.ap_2_pushbutton_pressed = A380PrimComputerFg_B.ap_2_pushbutton_pressed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.fcu_1_healthy = A380PrimComputerFg_B.fcu_1_healthy;
  A380PrimComputerFg_Y.out.data.discrete_inputs.fcu_2_healthy = A380PrimComputerFg_B.fcu_2_healthy;
  A380PrimComputerFg_Y.out.data.discrete_inputs.athr_pushbutton = A380PrimComputerFg_B.athr_pushbutton;
  A380PrimComputerFg_Y.out.data.discrete_inputs.ir_3_on_capt = A380PrimComputerFg_B.ir_3_on_capt;
  A380PrimComputerFg_Y.out.data.discrete_inputs.ir_3_on_fo = A380PrimComputerFg_B.ir_3_on_fo;
  A380PrimComputerFg_Y.out.data.discrete_inputs.adr_3_on_capt = A380PrimComputerFg_B.adr_3_on_capt;
  A380PrimComputerFg_Y.out.data.discrete_inputs.adr_3_on_fo = A380PrimComputerFg_B.adr_3_on_fo;
  A380PrimComputerFg_Y.out.data.discrete_inputs.rat_deployed = A380PrimComputerFg_B.rat_deployed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.rat_contactor_closed = A380PrimComputerFg_B.rat_contactor_closed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.athr_instinctive_disc = A380PrimComputerFg_B.athr_instinctive_disc;
  A380PrimComputerFg_Y.out.data.discrete_inputs.pitch_trim_up_pressed = A380PrimComputerFg_B.pitch_trim_up_pressed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.pitch_trim_down_pressed = A380PrimComputerFg_B.pitch_trim_down_pressed;
  A380PrimComputerFg_Y.out.data.discrete_inputs.green_low_pressure = A380PrimComputerFg_B.green_low_pressure;
  A380PrimComputerFg_Y.out.data.discrete_inputs.yellow_low_pressure = A380PrimComputerFg_B.yellow_low_pressure;
  A380PrimComputerFg_Y.out.data.analog_inputs.capt_pitch_stick_pos = A380PrimComputerFg_B.capt_pitch_stick_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.fo_pitch_stick_pos = A380PrimComputerFg_B.fo_pitch_stick_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.capt_roll_stick_pos = A380PrimComputerFg_B.capt_roll_stick_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.fo_roll_stick_pos = A380PrimComputerFg_B.fo_roll_stick_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.speed_brake_lever_pos = A380PrimComputerFg_B.speed_brake_lever_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.thr_lever_1_pos = A380PrimComputerFg_B.thr_lever_1_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.thr_lever_2_pos = A380PrimComputerFg_B.thr_lever_2_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.thr_lever_3_pos = A380PrimComputerFg_B.thr_lever_3_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.thr_lever_4_pos = A380PrimComputerFg_B.thr_lever_4_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.elevator_1_pos_deg = A380PrimComputerFg_B.elevator_1_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.elevator_2_pos_deg = A380PrimComputerFg_B.elevator_2_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.elevator_3_pos_deg = A380PrimComputerFg_B.elevator_3_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.ths_pos_deg = A380PrimComputerFg_B.ths_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.left_aileron_1_pos_deg = A380PrimComputerFg_B.left_aileron_1_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.left_aileron_2_pos_deg = A380PrimComputerFg_B.left_aileron_2_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.right_aileron_1_pos_deg = A380PrimComputerFg_B.right_aileron_1_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.right_aileron_2_pos_deg = A380PrimComputerFg_B.right_aileron_2_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.left_spoiler_pos_deg = A380PrimComputerFg_B.left_spoiler_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.right_spoiler_pos_deg = A380PrimComputerFg_B.right_spoiler_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.rudder_1_pos_deg = A380PrimComputerFg_B.rudder_1_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.rudder_2_pos_deg = A380PrimComputerFg_B.rudder_2_pos_deg;
  A380PrimComputerFg_Y.out.data.analog_inputs.rudder_pedal_pos = A380PrimComputerFg_B.rudder_pedal_pos;
  A380PrimComputerFg_Y.out.data.analog_inputs.yellow_hyd_pressure_psi = A380PrimComputerFg_B.yellow_hyd_pressure_psi;
  A380PrimComputerFg_Y.out.data.analog_inputs.green_hyd_pressure_psi = A380PrimComputerFg_B.green_hyd_pressure_psi;
  A380PrimComputerFg_Y.out.data.analog_inputs.vert_acc_1_g = A380PrimComputerFg_B.vert_acc_1_g;
  A380PrimComputerFg_Y.out.data.analog_inputs.vert_acc_2_g = A380PrimComputerFg_B.vert_acc_2_g;
  A380PrimComputerFg_Y.out.data.analog_inputs.vert_acc_3_g = A380PrimComputerFg_B.vert_acc_3_g;
  A380PrimComputerFg_Y.out.data.analog_inputs.lat_acc_1_g = A380PrimComputerFg_B.lat_acc_1_g;
  A380PrimComputerFg_Y.out.data.analog_inputs.lat_acc_2_g = A380PrimComputerFg_B.lat_acc_2_g;
  A380PrimComputerFg_Y.out.data.analog_inputs.lat_acc_3_g = A380PrimComputerFg_B.lat_acc_3_g;
  A380PrimComputerFg_Y.out.data.analog_inputs.left_body_wheel_speed = A380PrimComputerFg_B.left_body_wheel_speed;
  A380PrimComputerFg_Y.out.data.analog_inputs.left_wing_wheel_speed = A380PrimComputerFg_B.left_wing_wheel_speed;
  A380PrimComputerFg_Y.out.data.analog_inputs.right_body_wheel_speed = A380PrimComputerFg_B.right_body_wheel_speed;
  A380PrimComputerFg_Y.out.data.analog_inputs.right_wing_wheel_speed = A380PrimComputerFg_B.right_wing_wheel_speed;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM = A380PrimComputerFg_B.SSM_i5w;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data = A380PrimComputerFg_B.Data_hux;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft.SSM = A380PrimComputerFg_B.SSM_ebo;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft.Data = A380PrimComputerFg_B.Data_iyr;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft.SSM = A380PrimComputerFg_B.SSM_klm;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft.Data = A380PrimComputerFg_B.Data_mcz;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.mach.SSM = A380PrimComputerFg_B.SSM_crl;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.mach.Data = A380PrimComputerFg_B.Data_g5n;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM = A380PrimComputerFg_B.SSM_n2;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data = A380PrimComputerFg_B.Data_dr;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM = A380PrimComputerFg_B.SSM_pb;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data = A380PrimComputerFg_B.Data_c0z;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM = A380PrimComputerFg_B.SSM_kr;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data = A380PrimComputerFg_B.Data_li;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM = A380PrimComputerFg_B.SSM_f5q;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data = A380PrimComputerFg_B.Data_jet;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM =
    A380PrimComputerFg_B.SSM_cyd;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFg_B.Data_k4;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM = A380PrimComputerFg_B.SSM_ai4;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data = A380PrimComputerFg_B.Data_ixn;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft.SSM = A380PrimComputerFg_B.SSM_j2m;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft.Data = A380PrimComputerFg_B.Data_i1;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft.SSM = A380PrimComputerFg_B.SSM_fc4;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft.Data = A380PrimComputerFg_B.Data_ihw;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.mach.SSM = A380PrimComputerFg_B.SSM_m4;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.mach.Data = A380PrimComputerFg_B.Data_buw;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM = A380PrimComputerFg_B.SSM_dir;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data = A380PrimComputerFg_B.Data_ctc;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM = A380PrimComputerFg_B.SSM_eib;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data = A380PrimComputerFg_B.Data_cd0;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM = A380PrimComputerFg_B.SSM_bqd;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data = A380PrimComputerFg_B.Data_gw;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM = A380PrimComputerFg_B.SSM_dby;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data = A380PrimComputerFg_B.Data_pr;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM =
    A380PrimComputerFg_B.SSM_kxxt;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFg_B.Data_fwxkftc3;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM = A380PrimComputerFg_B.SSM_kxxtac0ztgf2uxn;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data = A380PrimComputerFg_B.Data_d;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft.SSM = A380PrimComputerFg_B.SSM_n;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft.Data = A380PrimComputerFg_B.Data_joy;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft.SSM = A380PrimComputerFg_B.SSM_cb;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft.Data = A380PrimComputerFg_B.Data_p1;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.mach.SSM = A380PrimComputerFg_B.SSM_nn;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.mach.Data = A380PrimComputerFg_B.Data_mk;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM = A380PrimComputerFg_B.SSM_m0;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data = A380PrimComputerFg_B.Data_lyw;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM = A380PrimComputerFg_B.SSM_kd;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data = A380PrimComputerFg_B.Data_gq;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM = A380PrimComputerFg_B.SSM_pu;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data = A380PrimComputerFg_B.Data_n;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM = A380PrimComputerFg_B.SSM_nv;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data = A380PrimComputerFg_B.Data_bq;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM = A380PrimComputerFg_B.SSM_d5;
  A380PrimComputerFg_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFg_B.Data_dmn;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_eo;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.Data = A380PrimComputerFg_B.Data_jn;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.SSM = A380PrimComputerFg_B.SSM_nd;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.Data = A380PrimComputerFg_B.Data_c;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.SSM = A380PrimComputerFg_B.SSM_bq;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.Data = A380PrimComputerFg_B.Data_lx;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM = A380PrimComputerFg_B.SSM_hi;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.Data = A380PrimComputerFg_B.Data_jb;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM = A380PrimComputerFg_B.SSM_mm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data = A380PrimComputerFg_B.Data_fn;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.SSM = A380PrimComputerFg_B.SSM_kz;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.Data = A380PrimComputerFg_B.Data_od;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM = A380PrimComputerFg_B.SSM_il;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.Data = A380PrimComputerFg_B.Data_pw;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM = A380PrimComputerFg_B.SSM_ah;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data = A380PrimComputerFg_B.Data_m2;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFg_B.SSM_en;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data = A380PrimComputerFg_B.Data_ek;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM = A380PrimComputerFg_B.SSM_dq;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data = A380PrimComputerFg_B.Data_iy;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM = A380PrimComputerFg_B.SSM_px;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.Data = A380PrimComputerFg_B.Data_lk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM = A380PrimComputerFg_B.SSM_lbo;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data = A380PrimComputerFg_B.Data_ca;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM = A380PrimComputerFg_B.SSM_p5;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data = A380PrimComputerFg_B.Data_pix;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM = A380PrimComputerFg_B.SSM_mk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data = A380PrimComputerFg_B.Data_di;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM = A380PrimComputerFg_B.SSM_mu;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.Data = A380PrimComputerFg_B.Data_lz;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_cbl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFg_B.Data_mo;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_jh;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data = A380PrimComputerFg_B.Data_lg;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_og;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFg_B.Data_og;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM = A380PrimComputerFg_B.SSM_d4;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.Data = A380PrimComputerFg_B.Data_fj;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM = A380PrimComputerFg_B.SSM_ds;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data = A380PrimComputerFg_B.Data_my;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM = A380PrimComputerFg_B.SSM_lm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data = A380PrimComputerFg_B.Data_ox;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_cx;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data = A380PrimComputerFg_B.Data_f5h;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_cgz;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFg_B.Data_gk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_fv;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data = A380PrimComputerFg_B.Data_nb;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM = A380PrimComputerFg_B.SSM_h0;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data = A380PrimComputerFg_B.Data_fr;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFg_B.SSM_ag;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data = A380PrimComputerFg_B.Data_l5;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFg_B.SSM_jw;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFg_B.Data_dc2;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM = A380PrimComputerFg_B.SSM_jy;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.Data = A380PrimComputerFg_B.Data_gr;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFg_B.SSM_j1;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFg_B.Data_gp;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM = A380PrimComputerFg_B.SSM_ov;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data = A380PrimComputerFg_B.Data_i3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM = A380PrimComputerFg_B.SSM_mx;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data = A380PrimComputerFg_B.Data_et;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_b4;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.Data = A380PrimComputerFg_B.Data_mc;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.SSM = A380PrimComputerFg_B.SSM_gb;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.Data = A380PrimComputerFg_B.Data_k3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.SSM = A380PrimComputerFg_B.SSM_oh;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.Data = A380PrimComputerFg_B.Data_f2;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM = A380PrimComputerFg_B.SSM_mm5;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.Data = A380PrimComputerFg_B.Data_gh;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM = A380PrimComputerFg_B.SSM_br;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data = A380PrimComputerFg_B.Data_ed;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.SSM = A380PrimComputerFg_B.SSM_c2;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.Data = A380PrimComputerFg_B.Data_o2j;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM = A380PrimComputerFg_B.SSM_hc;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.Data = A380PrimComputerFg_B.Data_i43;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM = A380PrimComputerFg_B.SSM_ktr;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data = A380PrimComputerFg_B.Data_ic;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFg_B.SSM_gl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data = A380PrimComputerFg_B.Data_ak;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM = A380PrimComputerFg_B.SSM_my;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data = A380PrimComputerFg_B.Data_jg;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM = A380PrimComputerFg_B.SSM_j3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.Data = A380PrimComputerFg_B.Data_cu;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM = A380PrimComputerFg_B.SSM_go;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data = A380PrimComputerFg_B.Data_ep;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM = A380PrimComputerFg_B.SSM_e5c;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data = A380PrimComputerFg_B.Data_d3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM = A380PrimComputerFg_B.SSM_dk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data = A380PrimComputerFg_B.Data_bt;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM = A380PrimComputerFg_B.SSM_evc;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.Data = A380PrimComputerFg_B.Data_e0;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_kk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFg_B.Data_jl3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_af;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data = A380PrimComputerFg_B.Data_nm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_npr;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFg_B.Data_ia;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM = A380PrimComputerFg_B.SSM_ew;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.Data = A380PrimComputerFg_B.Data_j0;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM = A380PrimComputerFg_B.SSM_lt;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data = A380PrimComputerFg_B.Data_bs;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM = A380PrimComputerFg_B.SSM_ger;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data = A380PrimComputerFg_B.Data_hp;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_pxo;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data = A380PrimComputerFg_B.Data_ct;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_co2;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFg_B.Data_pc;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_ny;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data = A380PrimComputerFg_B.Data_nzt;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM = A380PrimComputerFg_B.SSM_l4;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data = A380PrimComputerFg_B.Data_c0;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFg_B.SSM_nm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data = A380PrimComputerFg_B.Data_ojg;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFg_B.SSM_nh;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFg_B.Data_lm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM = A380PrimComputerFg_B.SSM_dl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.Data = A380PrimComputerFg_B.Data_fz;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFg_B.SSM_dx;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFg_B.Data_oz;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM = A380PrimComputerFg_B.SSM_a5h;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data = A380PrimComputerFg_B.Data_gf;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM = A380PrimComputerFg_B.SSM_fl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data = A380PrimComputerFg_B.Data_nn;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_p3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.Data = A380PrimComputerFg_B.Data_a0z;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.SSM = A380PrimComputerFg_B.SSM_ns;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.Data = A380PrimComputerFg_B.Data_fk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.SSM = A380PrimComputerFg_B.SSM_bm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.Data = A380PrimComputerFg_B.Data_bu;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM = A380PrimComputerFg_B.SSM_nl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.Data = A380PrimComputerFg_B.Data_o23;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM = A380PrimComputerFg_B.SSM_grm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data = A380PrimComputerFg_B.Data_g3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.SSM = A380PrimComputerFg_B.SSM_gzm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.Data = A380PrimComputerFg_B.Data_icc;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM = A380PrimComputerFg_B.SSM_oi;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.Data = A380PrimComputerFg_B.Data_pwf;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM = A380PrimComputerFg_B.SSM_aa;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data = A380PrimComputerFg_B.Data_gvk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFg_B.SSM_fvk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data = A380PrimComputerFg_B.Data_ln;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM = A380PrimComputerFg_B.SSM_lw;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data = A380PrimComputerFg_B.Data_ka;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM = A380PrimComputerFg_B.SSM_fa;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.Data = A380PrimComputerFg_B.Data_mp;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM = A380PrimComputerFg_B.SSM_lbx;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data = A380PrimComputerFg_B.Data_m4;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM = A380PrimComputerFg_B.SSM_n3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data = A380PrimComputerFg_B.Data_fki;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM = A380PrimComputerFg_B.SSM_a1;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data = A380PrimComputerFg_B.Data_bv;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM = A380PrimComputerFg_B.SSM_p1;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.Data = A380PrimComputerFg_B.Data_m21;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_cn2;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFg_B.Data_nbg;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_an3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data = A380PrimComputerFg_B.Data_l25;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_c3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFg_B.Data_ki;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM = A380PrimComputerFg_B.SSM_dp;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.Data = A380PrimComputerFg_B.Data_p5p;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM = A380PrimComputerFg_B.SSM_boy;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data = A380PrimComputerFg_B.Data_nry;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM = A380PrimComputerFg_B.SSM_lg;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data = A380PrimComputerFg_B.Data_mh;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_cm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data = A380PrimComputerFg_B.Data_ll;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_hl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFg_B.Data_hy;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFg_B.SSM_irh;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data = A380PrimComputerFg_B.Data_j04;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM = A380PrimComputerFg_B.SSM_b42;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data = A380PrimComputerFg_B.Data_pf;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFg_B.SSM_anz;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data = A380PrimComputerFg_B.Data_pl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFg_B.SSM_d2;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFg_B.Data_gb;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM = A380PrimComputerFg_B.SSM_gov;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.Data = A380PrimComputerFg_B.Data_hq;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFg_B.SSM_nb;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFg_B.Data_ai;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM = A380PrimComputerFg_B.SSM_pe3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data = A380PrimComputerFg_B.Data_gfr;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM = A380PrimComputerFg_B.SSM_jj;
  A380PrimComputerFg_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data = A380PrimComputerFg_B.Data_czp;
  A380PrimComputerFg_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.SSM = A380PrimComputerFg_B.SSM_jx;
  A380PrimComputerFg_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.Data = A380PrimComputerFg_B.Data_fm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.SSM = A380PrimComputerFg_B.SSM_npl;
  A380PrimComputerFg_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.Data = A380PrimComputerFg_B.Data_jsg;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.runway_heading_deg.SSM = A380PrimComputerFg_B.SSM_gf;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.runway_heading_deg.Data = A380PrimComputerFg_B.Data_g1;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.ils_frequency_mhz.SSM = A380PrimComputerFg_B.SSM_gbi;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.ils_frequency_mhz.Data = A380PrimComputerFg_B.Data_j4;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.localizer_deviation_deg.SSM = A380PrimComputerFg_B.SSM_fhm;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.localizer_deviation_deg.Data = A380PrimComputerFg_B.Data_jyh;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.SSM = A380PrimComputerFg_B.SSM_ltj;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.Data = A380PrimComputerFg_B.Data_e4;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.runway_heading_deg.SSM = A380PrimComputerFg_B.SSM_hn;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.runway_heading_deg.Data = A380PrimComputerFg_B.Data_ghs;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.ils_frequency_mhz.SSM = A380PrimComputerFg_B.SSM_h3;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.ils_frequency_mhz.Data = A380PrimComputerFg_B.Data_bmk;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.localizer_deviation_deg.SSM = A380PrimComputerFg_B.SSM_bfs;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.localizer_deviation_deg.Data = A380PrimComputerFg_B.Data_lzt;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.SSM = A380PrimComputerFg_B.SSM_p0;
  A380PrimComputerFg_Y.out.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.Data = A380PrimComputerFg_B.Data_kn;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM = A380PrimComputerFg_B.SSM_fu;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data =
    A380PrimComputerFg_B.Data_nab;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM = A380PrimComputerFg_B.SSM_hr;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data = A380PrimComputerFg_B.Data_lgf;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM = A380PrimComputerFg_B.SSM_bi;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data =
    A380PrimComputerFg_B.Data_fpq;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM = A380PrimComputerFg_B.SSM_bd;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data = A380PrimComputerFg_B.Data_dt;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM = A380PrimComputerFg_B.SSM_omt;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data = A380PrimComputerFg_B.Data_b1;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM = A380PrimComputerFg_B.SSM_la;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data =
    A380PrimComputerFg_B.Data_nmr;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM = A380PrimComputerFg_B.SSM_l1;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data = A380PrimComputerFg_B.Data_ea;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM = A380PrimComputerFg_B.SSM_dy;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data =
    A380PrimComputerFg_B.Data_nib;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM = A380PrimComputerFg_B.SSM_ie;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data = A380PrimComputerFg_B.Data_i2t;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM = A380PrimComputerFg_B.SSM_kf;
  A380PrimComputerFg_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data = A380PrimComputerFg_B.Data_ng;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_p5l;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data = A380PrimComputerFg_B.Data_h31;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM = A380PrimComputerFg_B.SSM_g3;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data = A380PrimComputerFg_B.Data_ew;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM = A380PrimComputerFg_B.SSM_b3;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data = A380PrimComputerFg_B.Data_j1s;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM = A380PrimComputerFg_B.SSM_dxv;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data = A380PrimComputerFg_B.Data_j5;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_mxz;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data = A380PrimComputerFg_B.Data_cw;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM = A380PrimComputerFg_B.SSM_kk4;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data = A380PrimComputerFg_B.Data_gqa;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM = A380PrimComputerFg_B.SSM_cy;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data = A380PrimComputerFg_B.Data_hz;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM = A380PrimComputerFg_B.SSM_ju;
  A380PrimComputerFg_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data = A380PrimComputerFg_B.Data_fri;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.efis_discrete_word_1.SSM = A380PrimComputerFg_B.SSM_ey;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.efis_discrete_word_1.Data = A380PrimComputerFg_B.Data_cm;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.efis_discrete_word_2.SSM = A380PrimComputerFg_B.SSM_jr;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.efis_discrete_word_2.Data = A380PrimComputerFg_B.Data_czj;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.baro_setting_hpa.SSM = A380PrimComputerFg_B.SSM_hs;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.baro_setting_hpa.Data = A380PrimComputerFg_B.Data_mb;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.baro_setting_inhg.SSM = A380PrimComputerFg_B.SSM_mx3;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.baro_setting_inhg.Data = A380PrimComputerFg_B.Data_gk4;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.SSM = A380PrimComputerFg_B.SSM_er;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.Data = A380PrimComputerFg_B.Data_gbt;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.SSM = A380PrimComputerFg_B.SSM_hm;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.Data = A380PrimComputerFg_B.Data_p0;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.efis_discrete_word_1.SSM = A380PrimComputerFg_B.SSM_dm;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.efis_discrete_word_1.Data = A380PrimComputerFg_B.Data_dn;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.efis_discrete_word_2.SSM = A380PrimComputerFg_B.SSM_fk;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.efis_discrete_word_2.Data = A380PrimComputerFg_B.Data_iyw;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.baro_setting_hpa.SSM = A380PrimComputerFg_B.SSM_lm1;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.baro_setting_hpa.Data = A380PrimComputerFg_B.Data_p5d;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.baro_setting_inhg.SSM = A380PrimComputerFg_B.SSM_nc;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.baro_setting_inhg.Data = A380PrimComputerFg_B.Data_oo;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.SSM = A380PrimComputerFg_B.SSM_e4;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.Data = A380PrimComputerFg_B.Data_ho;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.SSM = A380PrimComputerFg_B.SSM_bw;
  A380PrimComputerFg_Y.out.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.Data = A380PrimComputerFg_B.Data_kqr;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_na;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_omv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_lf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_mby;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_oz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_hk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_mub;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_hg;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_li;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_bi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_hcd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_i4u;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.SSM = A380PrimComputerFg_B.SSM_php;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.Data =
    A380PrimComputerFg_B.Data_ik;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.SSM = A380PrimComputerFg_B.SSM_ma;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.Data =
    A380PrimComputerFg_B.Data_dq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.SSM = A380PrimComputerFg_B.SSM_jut;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.Data =
    A380PrimComputerFg_B.Data_pv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.SSM = A380PrimComputerFg_B.SSM_kh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.Data =
    A380PrimComputerFg_B.Data_p1d;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.SSM = A380PrimComputerFg_B.SSM_h2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.Data =
    A380PrimComputerFg_B.Data_lyv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.SSM =
    A380PrimComputerFg_B.SSM_ago;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.Data =
    A380PrimComputerFg_B.Data_ke;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.SSM = A380PrimComputerFg_B.SSM_ep;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.Data =
    A380PrimComputerFg_B.Data_cv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.SSM = A380PrimComputerFg_B.SSM_kc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.Data =
    A380PrimComputerFg_B.Data_pfh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.SSM = A380PrimComputerFg_B.SSM_cnf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.Data =
    A380PrimComputerFg_B.Data_jy4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.SSM =
    A380PrimComputerFg_B.SSM_lwa;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.Data =
    A380PrimComputerFg_B.Data_o1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.SSM = A380PrimComputerFg_B.SSM_aq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.Data =
    A380PrimComputerFg_B.Data_ga;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.SSM =
    A380PrimComputerFg_B.SSM_ja2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.Data =
    A380PrimComputerFg_B.Data_kd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.SSM = A380PrimComputerFg_B.SSM_in3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.Data =
    A380PrimComputerFg_B.Data_fx;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.SSM = A380PrimComputerFg_B.SSM_ap;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.Data =
    A380PrimComputerFg_B.Data_nml;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.SSM = A380PrimComputerFg_B.SSM_mg;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.Data =
    A380PrimComputerFg_B.Data_fa;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.SSM = A380PrimComputerFg_B.SSM_mw;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.Data =
    A380PrimComputerFg_B.Data_nh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_bu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_or;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_cbb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_otn;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_iao;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_cam;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_ip;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_gsl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.SSM = A380PrimComputerFg_B.SSM_f4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.Data = A380PrimComputerFg_B.Data_amp;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.SSM = A380PrimComputerFg_B.SSM_id;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.Data = A380PrimComputerFg_B.Data_mv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.SSM = A380PrimComputerFg_B.SSM_mqr;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.Data = A380PrimComputerFg_B.Data_gx;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFg_B.SSM_cm2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_lb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFg_B.SSM_ck;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_can;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFg_B.SSM_pl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_gae;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFg_B.SSM_d50;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_h1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.SSM = A380PrimComputerFg_B.SSM_gs;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.Data = A380PrimComputerFg_B.Data_bc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.SSM = A380PrimComputerFg_B.SSM_kse;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.Data = A380PrimComputerFg_B.Data_fof;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM =
    A380PrimComputerFg_B.SSM_icj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data =
    A380PrimComputerFg_B.Data_nj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.SSM =
    A380PrimComputerFg_B.SSM_ds4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.Data =
    A380PrimComputerFg_B.Data_i0;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM =
    A380PrimComputerFg_B.SSM_gbf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data =
    A380PrimComputerFg_B.Data_lr;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.SSM =
    A380PrimComputerFg_B.SSM_opv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.Data =
    A380PrimComputerFg_B.Data_k0s;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.SSM = A380PrimComputerFg_B.SSM_gha;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.Data = A380PrimComputerFg_B.Data_m4b;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.SSM = A380PrimComputerFg_B.SSM_ple;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data =
    A380PrimComputerFg_B.Data_e3r;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.SSM = A380PrimComputerFg_B.SSM_h0n;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data =
    A380PrimComputerFg_B.Data_au;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.SSM = A380PrimComputerFg_B.SSM_c1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.Data = A380PrimComputerFg_B.Data_czc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.SSM = A380PrimComputerFg_B.SSM_dd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.Data = A380PrimComputerFg_B.Data_itz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.SSM = A380PrimComputerFg_B.SSM_ai;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.Data = A380PrimComputerFg_B.Data_nsk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.SSM = A380PrimComputerFg_B.SSM_at;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data = A380PrimComputerFg_B.Data_is;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.SSM = A380PrimComputerFg_B.SSM_bz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.Data = A380PrimComputerFg_B.Data_pk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.SSM = A380PrimComputerFg_B.SSM_n0;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.Data = A380PrimComputerFg_B.Data_f52;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.SSM = A380PrimComputerFg_B.SSM_haz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.Data = A380PrimComputerFg_B.Data_dg0;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.SSM = A380PrimComputerFg_B.SSM_hz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.Data = A380PrimComputerFg_B.Data_nru;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM = A380PrimComputerFg_B.SSM_hk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data = A380PrimComputerFg_B.Data_d5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.SSM = A380PrimComputerFg_B.SSM_cvn;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.Data = A380PrimComputerFg_B.Data_oa;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.SSM = A380PrimComputerFg_B.SSM_iy;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.Data = A380PrimComputerFg_B.Data_bp;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.SSM = A380PrimComputerFg_B.SSM_jwz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.Data = A380PrimComputerFg_B.Data_cl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.SSM = A380PrimComputerFg_B.SSM_o2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.Data = A380PrimComputerFg_B.Data_er;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.SSM = A380PrimComputerFg_B.SSM_eig;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.Data = A380PrimComputerFg_B.Data_in;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.SSM = A380PrimComputerFg_B.SSM_jl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.Data = A380PrimComputerFg_B.Data_btl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.SSM = A380PrimComputerFg_B.SSM_cci;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.Data = A380PrimComputerFg_B.Data_a5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.SSM = A380PrimComputerFg_B.SSM_ow;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.Data = A380PrimComputerFg_B.Data_hyo;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.SSM = A380PrimComputerFg_B.SSM_bcj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.Data = A380PrimComputerFg_B.Data_bjx;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_ls_kn.SSM = A380PrimComputerFg_B.SSM_i5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_ls_kn.Data = A380PrimComputerFg_B.Data_ci;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_stall_kn.SSM = A380PrimComputerFg_B.SSM_jww;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_stall_kn.Data = A380PrimComputerFg_B.Data_h2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.SSM = A380PrimComputerFg_B.SSM_kkj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.Data = A380PrimComputerFg_B.Data_ce;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_3_kn.SSM = A380PrimComputerFg_B.SSM_ndh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_3_kn.Data = A380PrimComputerFg_B.Data_dx;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_4_kn.SSM = A380PrimComputerFg_B.SSM_k1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_4_kn.Data = A380PrimComputerFg_B.Data_fvi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_man_kn.SSM = A380PrimComputerFg_B.SSM_en3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_man_kn.Data = A380PrimComputerFg_B.Data_gnm;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_max_kn.SSM = A380PrimComputerFg_B.SSM_kl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_max_kn.Data = A380PrimComputerFg_B.Data_e3y;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.SSM = A380PrimComputerFg_B.SSM_po;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.Data = A380PrimComputerFg_B.Data_ld;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_ie0;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fe.discrete_word_1.Data = A380PrimComputerFg_B.Data_k3v;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pfd_spd_tgt_kts.SSM = A380PrimComputerFg_B.SSM_ay;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pfd_spd_tgt_kts.Data = A380PrimComputerFg_B.Data_oi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pfd_short_term_mngd_spd_kts.SSM = A380PrimComputerFg_B.SSM_gsb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pfd_short_term_mngd_spd_kts.Data = A380PrimComputerFg_B.Data_oy;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_spd_kts.SSM = A380PrimComputerFg_B.SSM_mxy;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_spd_kts.Data = A380PrimComputerFg_B.Data_nl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_mach_kts.SSM = A380PrimComputerFg_B.SSM_gt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_mach_kts.Data = A380PrimComputerFg_B.Data_aei;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_hdg_deg.SSM = A380PrimComputerFg_B.SSM_cum;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_hdg_deg.Data = A380PrimComputerFg_B.Data_jz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_trk_deg.SSM = A380PrimComputerFg_B.SSM_ka;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_trk_deg.Data = A380PrimComputerFg_B.Data_pwfb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_alt_ft.SSM = A380PrimComputerFg_B.SSM_lu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_alt_ft.Data = A380PrimComputerFg_B.Data_la;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_vs_ft_min.SSM = A380PrimComputerFg_B.SSM_c5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_vs_ft_min.Data = A380PrimComputerFg_B.Data_b0;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_fpa_deg.SSM = A380PrimComputerFg_B.SSM_ol;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.selected_fpa_deg.Data = A380PrimComputerFg_B.Data_g5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.runway_hdg_memorized_deg.SSM = A380PrimComputerFg_B.SSM_k2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.runway_hdg_memorized_deg.Data = A380PrimComputerFg_B.Data_os;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.preset_mach_from_fms.SSM = A380PrimComputerFg_B.SSM_gn;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.preset_mach_from_fms.Data = A380PrimComputerFg_B.Data_btc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.preset_speed_from_fms_kts.SSM = A380PrimComputerFg_B.SSM_bdi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.preset_speed_from_fms_kts.Data = A380PrimComputerFg_B.Data_nhn;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.roll_fd_command_1.SSM = A380PrimComputerFg_B.SSM_lil;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.roll_fd_command_1.Data = A380PrimComputerFg_B.Data_im;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_1.SSM = A380PrimComputerFg_B.SSM_lmv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_1.Data = A380PrimComputerFg_B.Data_no;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_1.SSM = A380PrimComputerFg_B.SSM_ig;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_1.Data = A380PrimComputerFg_B.Data_av;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.roll_fd_command_2.SSM = A380PrimComputerFg_B.SSM_ch;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.roll_fd_command_2.Data = A380PrimComputerFg_B.Data_me;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_2.SSM = A380PrimComputerFg_B.SSM_ef;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_2.Data = A380PrimComputerFg_B.Data_hc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_2.SSM = A380PrimComputerFg_B.SSM_dbs;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_2.Data = A380PrimComputerFg_B.Data_f5c;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_5.SSM = A380PrimComputerFg_B.SSM_ilr;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_5.Data = A380PrimComputerFg_B.Data_iu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_4.SSM = A380PrimComputerFg_B.SSM_ch3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_4.Data = A380PrimComputerFg_B.Data_ihf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.fm_alt_constraint_ft.SSM = A380PrimComputerFg_B.SSM_ozd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.fm_alt_constraint_ft.Data = A380PrimComputerFg_B.Data_ao;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.ats_discrete_word.SSM = A380PrimComputerFg_B.SSM_ob;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.ats_discrete_word.Data = A380PrimComputerFg_B.Data_c2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.ats_fma_discrete_word.SSM = A380PrimComputerFg_B.SSM_dd4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.ats_fma_discrete_word.Data = A380PrimComputerFg_B.Data_f1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_3.SSM = A380PrimComputerFg_B.SSM_ps;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_3.Data = A380PrimComputerFg_B.Data_nst;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_agc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_1.Data = A380PrimComputerFg_B.Data_fq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_2.SSM = A380PrimComputerFg_B.SSM_nt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_2.Data = A380PrimComputerFg_B.Data_amc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_6.SSM = A380PrimComputerFg_B.SSM_oa;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_6.Data = A380PrimComputerFg_B.Data_nn1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.low_target_speed_margin_kts.SSM = A380PrimComputerFg_B.SSM_oj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.low_target_speed_margin_kts.Data =
    A380PrimComputerFg_B.Data_b0d;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.high_target_speed_margin_kts.SSM = A380PrimComputerFg_B.SSM_lq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.high_target_speed_margin_kts.Data =
    A380PrimComputerFg_B.Data_bri;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.nosewheel_cmd_deg.SSM = A380PrimComputerFg_B.SSM_fc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.nosewheel_cmd_deg.Data = A380PrimComputerFg_B.Data_nmx;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.n1_command_percent.SSM = A380PrimComputerFg_B.SSM_do;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.n1_command_percent.Data = A380PrimComputerFg_B.Data_oal;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.flx_to_temp_deg_c.SSM = A380PrimComputerFg_B.SSM_eu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.flx_to_temp_deg_c.Data = A380PrimComputerFg_B.Data_dmb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_7.SSM = A380PrimComputerFg_B.SSM_pjf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_x_bus.fg.discrete_word_7.Data = A380PrimComputerFg_B.Data_nf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_gu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_anh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_jsu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_idf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_eb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_gm;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_dbu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_jqv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_hh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_ni3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.SSM =
    A380PrimComputerFg_B.SSM_jsuo;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.Data =
    A380PrimComputerFg_B.Data_d1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.SSM = A380PrimComputerFg_B.SSM_dj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.Data =
    A380PrimComputerFg_B.Data_dv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.SSM =
    A380PrimComputerFg_B.SSM_oio;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.Data =
    A380PrimComputerFg_B.Data_oq4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.SSM = A380PrimComputerFg_B.SSM_ewd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.Data =
    A380PrimComputerFg_B.Data_fb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.SSM =
    A380PrimComputerFg_B.SSM_pjk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.Data =
    A380PrimComputerFg_B.Data_bsv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.SSM = A380PrimComputerFg_B.SSM_j3l;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.Data =
    A380PrimComputerFg_B.Data_nt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.SSM =
    A380PrimComputerFg_B.SSM_ceq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.Data =
    A380PrimComputerFg_B.Data_ac;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.SSM = A380PrimComputerFg_B.SSM_d4h;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.Data =
    A380PrimComputerFg_B.Data_dcn;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.SSM = A380PrimComputerFg_B.SSM_dc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.Data =
    A380PrimComputerFg_B.Data_joe;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.SSM = A380PrimComputerFg_B.SSM_obg;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.Data =
    A380PrimComputerFg_B.Data_nol;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.SSM = A380PrimComputerFg_B.SSM_b5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.Data =
    A380PrimComputerFg_B.Data_bun;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.SSM = A380PrimComputerFg_B.SSM_al;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.Data =
    A380PrimComputerFg_B.Data_ge;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.SSM =
    A380PrimComputerFg_B.SSM_hib;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.Data =
    A380PrimComputerFg_B.Data_mj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.SSM = A380PrimComputerFg_B.SSM_dbe;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.Data =
    A380PrimComputerFg_B.Data_naq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.SSM = A380PrimComputerFg_B.SSM_b1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.Data =
    A380PrimComputerFg_B.Data_j43;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.SSM = A380PrimComputerFg_B.SSM_d0;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.Data =
    A380PrimComputerFg_B.Data_po;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.SSM = A380PrimComputerFg_B.SSM_m5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.Data =
    A380PrimComputerFg_B.Data_ey;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_jli;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_a3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_mxc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_pey;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_ogm;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_kf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.SSM =
    A380PrimComputerFg_B.SSM_nlt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.Data =
    A380PrimComputerFg_B.Data_hk1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.SSM = A380PrimComputerFg_B.SSM_dz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.Data = A380PrimComputerFg_B.Data_grt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.SSM = A380PrimComputerFg_B.SSM_oiy;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.Data = A380PrimComputerFg_B.Data_cmi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.SSM = A380PrimComputerFg_B.SSM_jsb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.Data = A380PrimComputerFg_B.Data_eyi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFg_B.SSM_my5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_jr;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFg_B.SSM_lp;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_hom;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFg_B.SSM_hlu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_je;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFg_B.SSM_hu3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_k5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.SSM = A380PrimComputerFg_B.SSM_d5s;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.Data =
    A380PrimComputerFg_B.Data_ima;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.SSM = A380PrimComputerFg_B.SSM_n4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.Data = A380PrimComputerFg_B.Data_c4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_gg;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.Data =
    A380PrimComputerFg_B.Data_bk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.SSM =
    A380PrimComputerFg_B.SSM_kkj5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data =
    A380PrimComputerFg_B.Data_fb4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.SSM =
    A380PrimComputerFg_B.SSM_cr;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.Data =
    A380PrimComputerFg_B.Data_jf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.SSM =
    A380PrimComputerFg_B.SSM_nx;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data =
    A380PrimComputerFg_B.Data_mz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.SSM = A380PrimComputerFg_B.SSM_po3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.Data = A380PrimComputerFg_B.Data_p3h;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.SSM = A380PrimComputerFg_B.SSM_o0;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data = A380PrimComputerFg_B.Data_kv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.SSM = A380PrimComputerFg_B.SSM_mt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data =
    A380PrimComputerFg_B.Data_bv1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.SSM = A380PrimComputerFg_B.SSM_o5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.Data = A380PrimComputerFg_B.Data_g4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM = A380PrimComputerFg_B.SSM_mkz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data = A380PrimComputerFg_B.Data_otv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.SSM = A380PrimComputerFg_B.SSM_dqh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data = A380PrimComputerFg_B.Data_kqu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.SSM = A380PrimComputerFg_B.SSM_ki;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.Data = A380PrimComputerFg_B.Data_n4p;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.SSM = A380PrimComputerFg_B.SSM_ez;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.Data = A380PrimComputerFg_B.Data_n3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.SSM = A380PrimComputerFg_B.SSM_k4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.Data = A380PrimComputerFg_B.Data_ma;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.SSM = A380PrimComputerFg_B.SSM_ac;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data = A380PrimComputerFg_B.Data_gsd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.SSM = A380PrimComputerFg_B.SSM_iz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.Data = A380PrimComputerFg_B.Data_ij;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.SSM = A380PrimComputerFg_B.SSM_b4c;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.Data = A380PrimComputerFg_B.Data_ogy;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM = A380PrimComputerFg_B.SSM_gn1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data = A380PrimComputerFg_B.Data_hc3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.SSM = A380PrimComputerFg_B.SSM_p0z;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.Data = A380PrimComputerFg_B.Data_m5;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.SSM = A380PrimComputerFg_B.SSM_iet;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.Data = A380PrimComputerFg_B.Data_cxq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.SSM = A380PrimComputerFg_B.SSM_omi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.Data = A380PrimComputerFg_B.Data_oat;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.SSM = A380PrimComputerFg_B.SSM_bdv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.Data = A380PrimComputerFg_B.Data_f4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.SSM = A380PrimComputerFg_B.SSM_hhc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.Data = A380PrimComputerFg_B.Data_itt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.SSM = A380PrimComputerFg_B.SSM_apw;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.Data = A380PrimComputerFg_B.Data_hr;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.SSM = A380PrimComputerFg_B.SSM_e2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.Data = A380PrimComputerFg_B.Data_cta;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.SSM = A380PrimComputerFg_B.SSM_goz;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.Data = A380PrimComputerFg_B.Data_kn3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_ls_kn.SSM = A380PrimComputerFg_B.SSM_mku;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_ls_kn.Data = A380PrimComputerFg_B.Data_aj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_stall_kn.SSM = A380PrimComputerFg_B.SSM_k24;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_stall_kn.Data = A380PrimComputerFg_B.Data_ml;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.SSM = A380PrimComputerFg_B.SSM_l2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.Data = A380PrimComputerFg_B.Data_l55;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_3_kn.SSM = A380PrimComputerFg_B.SSM_lfy;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_3_kn.Data = A380PrimComputerFg_B.Data_hi;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_4_kn.SSM = A380PrimComputerFg_B.SSM_aj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_4_kn.Data = A380PrimComputerFg_B.Data_ad;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_man_kn.SSM = A380PrimComputerFg_B.SSM_he;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_man_kn.Data = A380PrimComputerFg_B.Data_lyc;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_max_kn.SSM = A380PrimComputerFg_B.SSM_hkw;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_max_kn.Data = A380PrimComputerFg_B.Data_kw;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.SSM = A380PrimComputerFg_B.SSM_m2q;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.Data = A380PrimComputerFg_B.Data_oue;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_bg;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fe.discrete_word_1.Data = A380PrimComputerFg_B.Data_njd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pfd_spd_tgt_kts.SSM = A380PrimComputerFg_B.SSM_nq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pfd_spd_tgt_kts.Data = A380PrimComputerFg_B.Data_n1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pfd_short_term_mngd_spd_kts.SSM = A380PrimComputerFg_B.SSM_hng;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pfd_short_term_mngd_spd_kts.Data =
    A380PrimComputerFg_B.Data_ihk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_spd_kts.SSM = A380PrimComputerFg_B.SSM_pd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_spd_kts.Data = A380PrimComputerFg_B.Data_hiq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_mach_kts.SSM = A380PrimComputerFg_B.SSM_or;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_mach_kts.Data = A380PrimComputerFg_B.Data_lb2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_hdg_deg.SSM = A380PrimComputerFg_B.SSM_ao;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_hdg_deg.Data = A380PrimComputerFg_B.Data_l5t;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_trk_deg.SSM = A380PrimComputerFg_B.SSM_e4y;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_trk_deg.Data = A380PrimComputerFg_B.Data_p5q;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_alt_ft.SSM = A380PrimComputerFg_B.SSM_lk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_alt_ft.Data = A380PrimComputerFg_B.Data_by;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_vs_ft_min.SSM = A380PrimComputerFg_B.SSM_cmh;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_vs_ft_min.Data = A380PrimComputerFg_B.Data_fz4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_fpa_deg.SSM = A380PrimComputerFg_B.SSM_fb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.selected_fpa_deg.Data = A380PrimComputerFg_B.Data_bf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.runway_hdg_memorized_deg.SSM = A380PrimComputerFg_B.SSM_jwb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.runway_hdg_memorized_deg.Data = A380PrimComputerFg_B.Data_o3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.preset_mach_from_fms.SSM = A380PrimComputerFg_B.SSM_lqf;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.preset_mach_from_fms.Data = A380PrimComputerFg_B.Data_b0i;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.preset_speed_from_fms_kts.SSM = A380PrimComputerFg_B.SSM_f4j;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.preset_speed_from_fms_kts.Data = A380PrimComputerFg_B.Data_ki2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.roll_fd_command_1.SSM = A380PrimComputerFg_B.SSM_a0z;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.roll_fd_command_1.Data = A380PrimComputerFg_B.Data_adu;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_1.SSM = A380PrimComputerFg_B.SSM_hj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_1.Data = A380PrimComputerFg_B.Data_h4h;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_1.SSM = A380PrimComputerFg_B.SSM_nrk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_1.Data = A380PrimComputerFg_B.Data_dod;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.roll_fd_command_2.SSM = A380PrimComputerFg_B.SSM_bl;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.roll_fd_command_2.Data = A380PrimComputerFg_B.Data_fqj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_2.SSM = A380PrimComputerFg_B.SSM_gx;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_2.Data = A380PrimComputerFg_B.Data_hgw;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_2.SSM = A380PrimComputerFg_B.SSM_i3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_2.Data = A380PrimComputerFg_B.Data_dko;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_5.SSM = A380PrimComputerFg_B.SSM_nx2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_5.Data = A380PrimComputerFg_B.Data_iga;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_4.SSM = A380PrimComputerFg_B.SSM_jm;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_4.Data = A380PrimComputerFg_B.Data_hds;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.fm_alt_constraint_ft.SSM = A380PrimComputerFg_B.SSM_khm;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.fm_alt_constraint_ft.Data = A380PrimComputerFg_B.Data_dqt;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.ats_discrete_word.SSM = A380PrimComputerFg_B.SSM_m1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.ats_discrete_word.Data = A380PrimComputerFg_B.Data_pd;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.ats_fma_discrete_word.SSM = A380PrimComputerFg_B.SSM_ek;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.ats_fma_discrete_word.Data = A380PrimComputerFg_B.Data_i0g;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_3.SSM = A380PrimComputerFg_B.SSM_g1;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_3.Data = A380PrimComputerFg_B.Data_jzm;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_c4;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_1.Data = A380PrimComputerFg_B.Data_bs3;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_2.SSM = A380PrimComputerFg_B.SSM_kj;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_2.Data = A380PrimComputerFg_B.Data_ko;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_6.SSM = A380PrimComputerFg_B.SSM_fn;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_6.Data = A380PrimComputerFg_B.Data_nq;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.low_target_speed_margin_kts.SSM = A380PrimComputerFg_B.SSM_jb;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.low_target_speed_margin_kts.Data =
    A380PrimComputerFg_B.Data_ita;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.high_target_speed_margin_kts.SSM = A380PrimComputerFg_B.SSM_ku;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.high_target_speed_margin_kts.Data =
    A380PrimComputerFg_B.Data_pn;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.nosewheel_cmd_deg.SSM = A380PrimComputerFg_B.SSM_irk;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.nosewheel_cmd_deg.Data = A380PrimComputerFg_B.Data_lgm;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.n1_command_percent.SSM = A380PrimComputerFg_B.SSM_nca;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.n1_command_percent.Data = A380PrimComputerFg_B.Data_ir;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.flx_to_temp_deg_c.SSM = A380PrimComputerFg_B.SSM_im;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.flx_to_temp_deg_c.Data = A380PrimComputerFg_B.Data_jv;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_7.SSM = A380PrimComputerFg_B.SSM_j2;
  A380PrimComputerFg_Y.out.data.bus_inputs.prim_y_bus.fg.discrete_word_7.Data = A380PrimComputerFg_B.Data_ore;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFg_B.SSM_ba5;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_ijm;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFg_B.SSM_p4l;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_jo0;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_l25;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data = A380PrimComputerFg_B.Data_bn;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_e4o;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_izj;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFg_B.SSM_d1a;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data = A380PrimComputerFg_B.Data_pdd;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.aileron_status_word.SSM = A380PrimComputerFg_B.SSM_bol;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.aileron_status_word.Data = A380PrimComputerFg_B.Data_bjv;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_mi;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_lye;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_py;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_ft;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_lp0;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_a2;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_f0;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_ii;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM = A380PrimComputerFg_B.SSM_gj;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.spoiler_status_word.Data = A380PrimComputerFg_B.Data_of3;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFg_B.SSM_ncq;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFg_B.Data_pj;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFg_B.SSM_ix;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data = A380PrimComputerFg_B.Data_es;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFg_B.SSM_gle;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFg_B.Data_mly;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFg_B.SSM_h21;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data = A380PrimComputerFg_B.Data_p3m;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_status_word.SSM = A380PrimComputerFg_B.SSM_cf;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_status_word.Data = A380PrimComputerFg_B.Data_ijw;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM = A380PrimComputerFg_B.SSM_ghc;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data = A380PrimComputerFg_B.Data_fqp;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM = A380PrimComputerFg_B.SSM_lj;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data = A380PrimComputerFg_B.Data_liu;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM = A380PrimComputerFg_B.SSM_nsn;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data = A380PrimComputerFg_B.Data_ki1;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.ths_position_deg.SSM = A380PrimComputerFg_B.SSM_ovo;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.ths_position_deg.Data = A380PrimComputerFg_B.Data_byo;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_status_word.SSM = A380PrimComputerFg_B.SSM_nst;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_status_word.Data = A380PrimComputerFg_B.Data_cwz;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM = A380PrimComputerFg_B.SSM_iv;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data = A380PrimComputerFg_B.Data_k2d;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM = A380PrimComputerFg_B.SSM_pq;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data = A380PrimComputerFg_B.Data_h5f;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFg_B.SSM_ii;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFg_B.Data_c0o;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM = A380PrimComputerFg_B.SSM_olh;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data = A380PrimComputerFg_B.Data_db;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM = A380PrimComputerFg_B.SSM_fkb;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_1_bus.misc_data_status_word.Data = A380PrimComputerFg_B.Data_dcz;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFg_B.SSM_gev;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_ork;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM = A380PrimComputerFg_B.SSM_jp;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_f11;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_iu;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_hyn;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_bew;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_cg;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFg_B.SSM_eie;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data = A380PrimComputerFg_B.Data_mor;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.aileron_status_word.SSM = A380PrimComputerFg_B.SSM_nk;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.aileron_status_word.Data = A380PrimComputerFg_B.Data_l1;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_buw;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_ms;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_ht;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_ag;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_io;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_epm;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_igr;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_pp;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM = A380PrimComputerFg_B.SSM_np1;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.spoiler_status_word.Data = A380PrimComputerFg_B.Data_nek;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFg_B.SSM_hkwh;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFg_B.Data_cho;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFg_B.SSM_ahu;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data = A380PrimComputerFg_B.Data_aet;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFg_B.SSM_ka4;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFg_B.Data_oxr;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFg_B.SSM_k2r;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data = A380PrimComputerFg_B.Data_oq5;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_status_word.SSM = A380PrimComputerFg_B.SSM_i0;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_status_word.Data = A380PrimComputerFg_B.Data_cuh;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM = A380PrimComputerFg_B.SSM_jes;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data = A380PrimComputerFg_B.Data_jlt;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM = A380PrimComputerFg_B.SSM_kg;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data = A380PrimComputerFg_B.Data_jm;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM = A380PrimComputerFg_B.SSM_frj;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data = A380PrimComputerFg_B.Data_fg;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.ths_position_deg.SSM = A380PrimComputerFg_B.SSM_ej;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.ths_position_deg.Data = A380PrimComputerFg_B.Data_np;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_status_word.SSM = A380PrimComputerFg_B.SSM_ok;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_status_word.Data = A380PrimComputerFg_B.Data_pmi;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM = A380PrimComputerFg_B.SSM_iyk;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data = A380PrimComputerFg_B.Data_b2;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM = A380PrimComputerFg_B.SSM_mv;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data = A380PrimComputerFg_B.Data_ogu;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFg_B.SSM_f4l;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFg_B.Data_lw;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM = A380PrimComputerFg_B.SSM_mtx;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data = A380PrimComputerFg_B.Data_f44;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM = A380PrimComputerFg_B.SSM_ahy;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_2_bus.misc_data_status_word.Data = A380PrimComputerFg_B.Data_oau;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFg_B.SSM_ovo2;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_aoh;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFg_B.SSM_hsq;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFg_B.Data_mon;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_nxn;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_i4t;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_nnx;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFg_B.Data_mt;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFg_B.SSM_lo;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data = A380PrimComputerFg_B.Data_jh0;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.aileron_status_word.SSM = A380PrimComputerFg_B.SSM_apz;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.aileron_status_word.Data = A380PrimComputerFg_B.Data_nvn;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_fi;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_b0e;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_iw;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_f22;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_dfj;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_dn0;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_e1;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_ngo;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM = A380PrimComputerFg_B.SSM_mp;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.spoiler_status_word.Data = A380PrimComputerFg_B.Data_bkg;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFg_B.SSM_k2j;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFg_B.Data_ora;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFg_B.SSM_eyo;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data = A380PrimComputerFg_B.Data_cd;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFg_B.SSM_ceqr;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFg_B.Data_inj;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFg_B.SSM_c3y;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data = A380PrimComputerFg_B.Data_fno;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_status_word.SSM = A380PrimComputerFg_B.SSM_em;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_status_word.Data = A380PrimComputerFg_B.Data_dd;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM = A380PrimComputerFg_B.SSM_cre;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data = A380PrimComputerFg_B.Data_jff;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM = A380PrimComputerFg_B.SSM_lfz;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data = A380PrimComputerFg_B.Data_fh;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM = A380PrimComputerFg_B.SSM_pji;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data = A380PrimComputerFg_B.Data_kc;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.ths_position_deg.SSM = A380PrimComputerFg_B.SSM_hbr;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.ths_position_deg.Data = A380PrimComputerFg_B.Data_odm;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_status_word.SSM = A380PrimComputerFg_B.SSM_p2n;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_status_word.Data = A380PrimComputerFg_B.Data_h5r;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM = A380PrimComputerFg_B.SSM_lc;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data = A380PrimComputerFg_B.Data_pb;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM = A380PrimComputerFg_B.SSM_haw;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data = A380PrimComputerFg_B.Data_ma4;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFg_B.SSM_km;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFg_B.Data_hwb;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM = A380PrimComputerFg_B.SSM_chn;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data = A380PrimComputerFg_B.Data_ndk;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM = A380PrimComputerFg_B.SSM_cz;
  A380PrimComputerFg_Y.out.data.bus_inputs.sec_3_bus.misc_data_status_word.Data = A380PrimComputerFg_B.Data_e1h;
  A380PrimComputerFg_Y.out.data.bus_inputs.isis_1_bus = A380PrimComputerFg_B.isis_1_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.isis_2_bus = A380PrimComputerFg_B.isis_2_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.rate_gyro_pitch_1_bus = A380PrimComputerFg_B.rate_gyro_pitch_1_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.rate_gyro_pitch_2_bus = A380PrimComputerFg_B.rate_gyro_pitch_2_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.rate_gyro_roll_1_bus = A380PrimComputerFg_B.rate_gyro_roll_1_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.rate_gyro_roll_2_bus = A380PrimComputerFg_B.rate_gyro_roll_2_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.rate_gyro_yaw_1_bus = A380PrimComputerFg_B.rate_gyro_yaw_1_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.rate_gyro_yaw_2_bus = A380PrimComputerFg_B.rate_gyro_yaw_2_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.irdc_1_bus = A380PrimComputerFg_B.irdc_1_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.irdc_2_bus = A380PrimComputerFg_B.irdc_2_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.irdc_3_bus = A380PrimComputerFg_B.irdc_3_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.irdc_4_a_bus = A380PrimComputerFg_B.irdc_4_a_bus;
  A380PrimComputerFg_Y.out.data.bus_inputs.irdc_4_b_bus = A380PrimComputerFg_B.irdc_4_b_bus;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.fm_valid = A380PrimComputerFg_B.fm_valid;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.active_fms_flight_phase = A380PrimComputerFg_B.active_fms_flight_phase;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.selected_approach_type = A380PrimComputerFg_B.selected_approach_type;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.backbeam_selected = A380PrimComputerFg_B.backbeam_selected;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.fms_loc_distance = A380PrimComputerFg_B.fms_loc_distance;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.fms_unrealistic_gs_angle_deg =
    A380PrimComputerFg_B.fms_unrealistic_gs_angle_deg;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.fms_weight_lbs = A380PrimComputerFg_B.fms_weight_lbs;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.fms_cg_percent = A380PrimComputerFg_B.fms_cg_percent;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.lateral_flight_plan_valid =
    A380PrimComputerFg_B.lateral_flight_plan_valid;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.nav_capture_condition = A380PrimComputerFg_B.nav_capture_condition;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.phi_c_deg = A380PrimComputerFg_B.phi_c_deg;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.xtk_nmi = A380PrimComputerFg_B.xtk_nmi;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.tke_deg = A380PrimComputerFg_B.tke_deg;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.phi_limit_deg = A380PrimComputerFg_B.phi_limit_deg;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.direct_to_nav_engage = A380PrimComputerFg_B.direct_to_nav_engage;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.vertical_flight_plan_valid =
    A380PrimComputerFg_B.vertical_flight_plan_valid;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.final_app_can_engage = A380PrimComputerFg_B.final_app_can_engage;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.next_alt_cstr_ft = A380PrimComputerFg_B.next_alt_cstr_ft;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.requested_des_submode = A380PrimComputerFg_B.requested_des_submode;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.alt_profile_tgt_ft = A380PrimComputerFg_B.alt_profile_tgt_ft;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.vs_target_ft_min = A380PrimComputerFg_B.vs_target_ft_min;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.v_2_kts = A380PrimComputerFg_B.v_2_kts;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.v_app_kts = A380PrimComputerFg_B.v_app_kts;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.v_managed_kts = A380PrimComputerFg_B.v_managed_kts;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.v_upper_margin_kts = A380PrimComputerFg_B.v_upper_margin_kts;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.v_lower_margin_kts = A380PrimComputerFg_B.v_lower_margin_kts;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.show_speed_margins = A380PrimComputerFg_B.show_speed_margins;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.preset_spd_kts = A380PrimComputerFg_B.preset_spd_kts;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.preset_mach = A380PrimComputerFg_B.preset_mach;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.preset_spd_mach_activate = A380PrimComputerFg_B.preset_spd_mach_activate;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.fms_spd_mode_activate = A380PrimComputerFg_B.fms_spd_mode_activate;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.fms_mach_mode_activate = A380PrimComputerFg_B.fms_mach_mode_activate;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.flex_temp_deg_c = A380PrimComputerFg_B.flex_temp_deg_c;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.acceleration_alt_ft = A380PrimComputerFg_B.acceleration_alt_ft;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.acceleration_alt_eo_ft = A380PrimComputerFg_B.acceleration_alt_eo_ft;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.thrust_reduction_alt_ft = A380PrimComputerFg_B.thrust_reduction_alt_ft;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fms.cruise_alt_ft = A380PrimComputerFg_B.cruise_alt_ft;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_tla_deg.SSM = A380PrimComputerFg_B.SSM_kxxta;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_tla_deg.Data = A380PrimComputerFg_B.Data_fwxk;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_ref_percent.SSM = A380PrimComputerFg_B.SSM_kxxtac;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_ref_percent.Data = A380PrimComputerFg_B.Data_fwxkf;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_flex_temp_deg.SSM = A380PrimComputerFg_B.SSM_kxxtac0;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_flex_temp_deg.Data = A380PrimComputerFg_B.Data_fwxkft;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_status_word_1.SSM = A380PrimComputerFg_B.SSM_kxxtac0z;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_status_word_1.Data = A380PrimComputerFg_B.Data_fwxkftc;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_status_word_2.SSM = A380PrimComputerFg_B.SSM_kxxtac0zt;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_status_word_2.Data = A380PrimComputerFg_B.Data_fwxkftc3e;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_status_word_3.SSM = A380PrimComputerFg_B.SSM_kxxtac0ztg;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_status_word_3.Data = A380PrimComputerFg_B.Data_fwxkftc3ep;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_limit_percent.SSM = A380PrimComputerFg_B.SSM_kxxtac0ztgf;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_limit_percent.Data = A380PrimComputerFg_B.Data_fwxkftc3epg;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_maximum_percent.SSM = A380PrimComputerFg_B.SSM_kxxtac0ztgf2;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_maximum_percent.Data = A380PrimComputerFg_B.Data_fwxkftc3epgt;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_command_percent.SSM = A380PrimComputerFg_B.SSM_kxxtac0ztgf2u;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.n1_command_percent.Data = A380PrimComputerFg_B.Data_fwxkftc3epgtd;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_n2_actual_percent.SSM =
    A380PrimComputerFg_B.SSM_kxxtac0ztgf2ux;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_n2_actual_percent.Data =
    A380PrimComputerFg_B.Data_fwxkftc3epgtdx;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_n1_actual_percent.SSM = A380PrimComputerFg_B.SSM_ky;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.selected_n1_actual_percent.Data =
    A380PrimComputerFg_B.Data_fwxkftc3epgtdxc;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_maintenance_word_6.SSM = A380PrimComputerFg_B.SSM_d;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_1.ecu_maintenance_word_6.Data = A380PrimComputerFg_B.Data_h;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_tla_deg.SSM = A380PrimComputerFg_B.SSM_h;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_tla_deg.Data = A380PrimComputerFg_B.Data_e;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_ref_percent.SSM = A380PrimComputerFg_B.SSM_kb;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_ref_percent.Data = A380PrimComputerFg_B.Data_j;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_flex_temp_deg.SSM = A380PrimComputerFg_B.SSM_p;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_flex_temp_deg.Data = A380PrimComputerFg_B.Data_p;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_status_word_1.SSM = A380PrimComputerFg_B.SSM_di;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_status_word_1.Data = A380PrimComputerFg_B.Data_i;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_status_word_2.SSM = A380PrimComputerFg_B.SSM_j;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_status_word_2.Data = A380PrimComputerFg_B.Data_g;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_status_word_3.SSM = A380PrimComputerFg_B.SSM_i;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_status_word_3.Data = A380PrimComputerFg_B.Data_a;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_limit_percent.SSM = A380PrimComputerFg_B.SSM_g;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_limit_percent.Data = A380PrimComputerFg_B.Data_eb;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_maximum_percent.SSM = A380PrimComputerFg_B.SSM_db;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_maximum_percent.Data = A380PrimComputerFg_B.Data_jo;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_command_percent.SSM = A380PrimComputerFg_B.SSM_a;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.n1_command_percent.Data = A380PrimComputerFg_B.Data_ex;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_n2_actual_percent.SSM = A380PrimComputerFg_B.SSM_ir;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_n2_actual_percent.Data = A380PrimComputerFg_B.Data_fd;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_n1_actual_percent.SSM = A380PrimComputerFg_B.SSM_hu;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.selected_n1_actual_percent.Data = A380PrimComputerFg_B.Data_ja;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_maintenance_word_6.SSM = A380PrimComputerFg_B.SSM_e;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_2.ecu_maintenance_word_6.Data = A380PrimComputerFg_B.Data_k;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_tla_deg.SSM = A380PrimComputerFg_B.SSM_gr;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_tla_deg.Data = A380PrimComputerFg_B.Data_h3;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_ref_percent.SSM = A380PrimComputerFg_B.SSM_ev;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_ref_percent.Data = A380PrimComputerFg_B.Data_a0;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_flex_temp_deg.SSM = A380PrimComputerFg_B.SSM_l;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_flex_temp_deg.Data = A380PrimComputerFg_B.Data_b;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_status_word_1.SSM = A380PrimComputerFg_B.SSM_ei;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_status_word_1.Data = A380PrimComputerFg_B.Data_eq;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_status_word_2.SSM = A380PrimComputerFg_B.SSM_an;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_status_word_2.Data = A380PrimComputerFg_B.Data_iz;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_status_word_3.SSM = A380PrimComputerFg_B.SSM_c;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_status_word_3.Data = A380PrimComputerFg_B.Data_j2;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_limit_percent.SSM = A380PrimComputerFg_B.SSM_lb;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_limit_percent.Data = A380PrimComputerFg_B.Data_o;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_maximum_percent.SSM = A380PrimComputerFg_B.SSM_ia;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_maximum_percent.Data = A380PrimComputerFg_B.Data_m;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_command_percent.SSM = A380PrimComputerFg_B.SSM_kyz;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.n1_command_percent.Data = A380PrimComputerFg_B.Data_oq;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_n2_actual_percent.SSM = A380PrimComputerFg_B.SSM_as;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_n2_actual_percent.Data = A380PrimComputerFg_B.Data_fo;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_n1_actual_percent.SSM = A380PrimComputerFg_B.SSM_is;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.selected_n1_actual_percent.Data = A380PrimComputerFg_B.Data_p1y;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_maintenance_word_6.SSM = A380PrimComputerFg_B.SSM_ca;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_3.ecu_maintenance_word_6.Data = A380PrimComputerFg_B.Data_l;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_tla_deg.SSM = A380PrimComputerFg_B.SSM_o;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_tla_deg.Data = A380PrimComputerFg_B.Data_kp;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_ref_percent.SSM = A380PrimComputerFg_B.SSM_ak;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_ref_percent.Data = A380PrimComputerFg_B.Data_k0;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_flex_temp_deg.SSM = A380PrimComputerFg_B.SSM_cbj;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_flex_temp_deg.Data = A380PrimComputerFg_B.Data_pi;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_status_word_1.SSM = A380PrimComputerFg_B.SSM_cu;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_status_word_1.Data = A380PrimComputerFg_B.Data_dm;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_status_word_2.SSM = A380PrimComputerFg_B.SSM_b;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_status_word_2.Data = A380PrimComputerFg_B.Data_f5;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_status_word_3.SSM = A380PrimComputerFg_B.SSM_m;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_status_word_3.Data = A380PrimComputerFg_B.Data_js;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_limit_percent.SSM = A380PrimComputerFg_B.SSM_f;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_limit_percent.Data = A380PrimComputerFg_B.Data_ee;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_maximum_percent.SSM = A380PrimComputerFg_B.SSM_bp;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_maximum_percent.Data = A380PrimComputerFg_B.Data_ig;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_command_percent.SSM = A380PrimComputerFg_B.SSM_hb;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.n1_command_percent.Data = A380PrimComputerFg_B.Data_pu;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_n2_actual_percent.SSM = A380PrimComputerFg_B.SSM_gz;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_n2_actual_percent.Data = A380PrimComputerFg_B.Data_ly;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_n1_actual_percent.SSM = A380PrimComputerFg_B.SSM_pv;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.selected_n1_actual_percent.Data = A380PrimComputerFg_B.Data_jq;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_maintenance_word_6.SSM = A380PrimComputerFg_B.SSM_mf;
  A380PrimComputerFg_Y.out.data.adcn_inputs.eec_4.ecu_maintenance_word_6.Data = A380PrimComputerFg_B.Data_o5;
  A380PrimComputerFg_Y.out.data.adcn_inputs.fqms = A380PrimComputerFg_B.fqms;
  A380PrimComputerFg_Y.out.general_logic.adr_computation_data.V_ias_kn = A380PrimComputerFg_B.V_ias_kn;
  A380PrimComputerFg_Y.out.general_logic.adr_computation_data.V_tas_kn = A380PrimComputerFg_B.V_tas_kn;
  A380PrimComputerFg_Y.out.general_logic.adr_computation_data.mach = A380PrimComputerFg_B.mach;
  A380PrimComputerFg_Y.out.general_logic.adr_computation_data.alpha_deg = A380PrimComputerFg_B.alpha_deg;
  A380PrimComputerFg_Y.out.general_logic.adr_computation_data.p_s_c_hpa = A380PrimComputerFg_B.p_s_c_hpa;
  A380PrimComputerFg_Y.out.general_logic.adr_computation_data.altitude_standard_ft =
    A380PrimComputerFg_B.altitude_standard_ft;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.theta_deg = A380PrimComputerFg_B.theta_deg;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.phi_deg = A380PrimComputerFg_B.phi_deg;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.q_deg_s = A380PrimComputerFg_B.q_deg_s;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.r_deg_s = A380PrimComputerFg_B.r_deg_s;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.n_x_g = A380PrimComputerFg_B.n_x_g;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.n_y_g = A380PrimComputerFg_B.n_y_g;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.n_z_g = A380PrimComputerFg_B.n_z_g;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.theta_dot_deg_s = A380PrimComputerFg_B.theta_dot_deg_s;
  A380PrimComputerFg_Y.out.general_logic.ir_computation_data.phi_dot_deg_s = A380PrimComputerFg_B.phi_dot_deg_s;
  A380PrimComputerFg_Y.out.general_logic.on_ground = A380PrimComputerFg_B.on_ground;
  A380PrimComputerFg_Y.out.general_logic.tracking_mode_on = A380PrimComputerFg_B.tracking_mode_on;
  A380PrimComputerFg_Y.out.general_logic.double_adr_failure = A380PrimComputerFg_B.double_adr_failure;
  A380PrimComputerFg_Y.out.general_logic.triple_adr_failure = A380PrimComputerFg_B.triple_adr_failure;
  A380PrimComputerFg_Y.out.general_logic.cas_or_mach_disagree = A380PrimComputerFg_B.cas_or_mach_disagree;
  A380PrimComputerFg_Y.out.general_logic.alpha_disagree = A380PrimComputerFg_B.alpha_disagree;
  A380PrimComputerFg_Y.out.general_logic.double_ir_failure = A380PrimComputerFg_B.double_ir_failure;
  A380PrimComputerFg_Y.out.general_logic.triple_ir_failure = A380PrimComputerFg_B.triple_ir_failure;
  A380PrimComputerFg_Y.out.general_logic.ir_failure_not_self_detected =
    A380PrimComputerFg_B.ir_failure_not_self_detected;
  A380PrimComputerFg_Y.out.general_logic.ra_computation_data_ft = A380PrimComputerFg_B.ra_computation_data_ft;
  A380PrimComputerFg_Y.out.general_logic.two_ra_failure = A380PrimComputerFg_B.two_ra_failure;
  A380PrimComputerFg_Y.out.general_logic.all_ra_failure = A380PrimComputerFg_B.all_ra_failure;
  A380PrimComputerFg_Y.out.general_logic.all_sfcc_lost = A380PrimComputerFg_B.all_sfcc_lost;
  A380PrimComputerFg_Y.out.general_logic.flap_handle_index = A380PrimComputerFg_B.flap_handle_index;
  A380PrimComputerFg_Y.out.general_logic.flap_angle_deg = A380PrimComputerFg_B.flap_angle_deg;
  A380PrimComputerFg_Y.out.general_logic.slat_angle_deg = A380PrimComputerFg_B.slat_angle_deg;
  A380PrimComputerFg_Y.out.general_logic.slat_flap_actual_pos = A380PrimComputerFg_B.slat_flap_actual_pos;
  A380PrimComputerFg_Y.out.general_logic.flap_surface_angle_deg = A380PrimComputerFg_B.flap_surface_angle_deg;
  A380PrimComputerFg_Y.out.general_logic.slat_surface_angle_deg = A380PrimComputerFg_B.slat_surface_angle_deg;
  A380PrimComputerFg_Y.out.general_logic.double_lgciu_failure = A380PrimComputerFg_B.double_lgciu_failure;
  A380PrimComputerFg_Y.out.general_logic.slats_locked = A380PrimComputerFg_B.slats_locked;
  A380PrimComputerFg_Y.out.general_logic.flaps_locked = A380PrimComputerFg_B.flaps_locked;
  A380PrimComputerFg_Y.out.general_logic.landing_gear_down = A380PrimComputerFg_B.landing_gear_down;
  A380PrimComputerFg_Y.out.general_logic.one_engine_out = A380PrimComputerFg_B.one_engine_out;
  A380PrimComputerFg_Y.out.general_logic.engine_running = A380PrimComputerFg_B.engine_running;
  A380PrimComputerFg_Y.out.general_logic.is_yellow_hydraulic_power_avail =
    A380PrimComputerFg_B.is_yellow_hydraulic_power_avail;
  A380PrimComputerFg_Y.out.general_logic.is_green_hydraulic_power_avail =
    A380PrimComputerFg_B.is_green_hydraulic_power_avail;
  A380PrimComputerFg_Y.out.flight_envelope.beta_target_deg = A380PrimComputerFg_B.beta_target_deg;
  A380PrimComputerFg_Y.out.flight_envelope.beta_target_visible = A380PrimComputerFg_B.beta_target_visible;
  A380PrimComputerFg_Y.out.flight_envelope.alpha_floor_condition = A380PrimComputerFg_B.alpha_floor_condition;
  A380PrimComputerFg_Y.out.flight_envelope.computed_weight_lbs = A380PrimComputerFg_B.computed_weight_lbs;
  A380PrimComputerFg_Y.out.flight_envelope.computed_cg_percent = A380PrimComputerFg_B.computed_cg_percent;
  A380PrimComputerFg_Y.out.flight_envelope.speed_scale_lost = A380PrimComputerFg_B.speed_scale_lost;
  A380PrimComputerFg_Y.out.flight_envelope.speed_scale_visible = A380PrimComputerFg_B.speed_scale_visible;
  A380PrimComputerFg_Y.out.flight_envelope.v_ls_kn = A380PrimComputerFg_B.v_ls_kn;
  A380PrimComputerFg_Y.out.flight_envelope.v_stall_kn = A380PrimComputerFg_B.v_stall_kn;
  A380PrimComputerFg_Y.out.flight_envelope.v_3_kn = A380PrimComputerFg_B.v_3_kn;
  A380PrimComputerFg_Y.out.flight_envelope.v_3_visible = A380PrimComputerFg_B.v_3_visible;
  A380PrimComputerFg_Y.out.flight_envelope.v_4_kn = A380PrimComputerFg_B.v_4_kn;
  A380PrimComputerFg_Y.out.flight_envelope.v_4_visible = A380PrimComputerFg_B.v_4_visible;
  A380PrimComputerFg_Y.out.flight_envelope.v_man_kn = A380PrimComputerFg_B.v_man_kn;
  A380PrimComputerFg_Y.out.flight_envelope.v_man_visible = A380PrimComputerFg_B.v_man_visible;
  A380PrimComputerFg_Y.out.flight_envelope.v_max_kn = A380PrimComputerFg_B.v_max_kn;
  A380PrimComputerFg_Y.out.flight_envelope.v_fe_next_kn = A380PrimComputerFg_B.v_fe_next_kn;
  A380PrimComputerFg_Y.out.flight_envelope.v_fe_next_visible = A380PrimComputerFg_B.v_fe_next_visible;
  A380PrimComputerFg_Y.out.flight_envelope.v_c_trend_kn = A380PrimComputerFg_B.v_c_trend_kn;
  A380PrimComputerFg_Y.out.flight_envelope.gamma_a_deg = A380PrimComputerFg_B.gamma_a_deg;
  A380PrimComputerFg_Y.out.flight_envelope.gamma_t_deg = A380PrimComputerFg_B.gamma_t_deg;
  A380PrimComputerFg_Y.out.flight_envelope.pitch_pitch_warning_active = A380PrimComputerFg_B.pitch_pitch_warning_active;
  A380PrimComputerFg_Y.out.flight_envelope.low_energy_warning_active = A380PrimComputerFg_B.low_energy_warning_active;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_inboard_aileron_deg =
    A380PrimComputerFg_B.left_inboard_aileron_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_inboard_aileron_deg =
    A380PrimComputerFg_B.right_inboard_aileron_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_midboard_aileron_deg =
    A380PrimComputerFg_B.left_midboard_aileron_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_midboard_aileron_deg =
    A380PrimComputerFg_B.right_midboard_aileron_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_outboard_aileron_deg =
    A380PrimComputerFg_B.left_outboard_aileron_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_outboard_aileron_deg =
    A380PrimComputerFg_B.right_outboard_aileron_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_1_deg = A380PrimComputerFg_B.left_spoiler_1_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_1_deg = A380PrimComputerFg_B.right_spoiler_1_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_2_deg = A380PrimComputerFg_B.left_spoiler_2_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_2_deg = A380PrimComputerFg_B.right_spoiler_2_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_3_deg = A380PrimComputerFg_B.left_spoiler_3_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_3_deg = A380PrimComputerFg_B.right_spoiler_3_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_4_deg = A380PrimComputerFg_B.left_spoiler_4_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_4_deg = A380PrimComputerFg_B.right_spoiler_4_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_5_deg = A380PrimComputerFg_B.left_spoiler_5_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_5_deg = A380PrimComputerFg_B.right_spoiler_5_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_6_deg = A380PrimComputerFg_B.left_spoiler_6_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_6_deg = A380PrimComputerFg_B.right_spoiler_6_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_7_deg = A380PrimComputerFg_B.left_spoiler_7_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_7_deg = A380PrimComputerFg_B.right_spoiler_7_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.left_spoiler_8_deg = A380PrimComputerFg_B.left_spoiler_8_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.right_spoiler_8_deg = A380PrimComputerFg_B.right_spoiler_8_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.upper_rudder_deg = A380PrimComputerFg_B.upper_rudder_deg;
  A380PrimComputerFg_Y.out.laws.lateral_law_outputs.lower_rudder_deg = A380PrimComputerFg_B.lower_rudder_deg;
  A380PrimComputerFg_Y.out.laws.pitch_law_outputs.left_inboard_elevator_deg =
    A380PrimComputerFg_B.left_inboard_elevator_deg;
  A380PrimComputerFg_Y.out.laws.pitch_law_outputs.right_inboard_elevator_deg =
    A380PrimComputerFg_B.right_inboard_elevator_deg;
  A380PrimComputerFg_Y.out.laws.pitch_law_outputs.left_outboard_elevator_deg =
    A380PrimComputerFg_B.left_outboard_elevator_deg;
  A380PrimComputerFg_Y.out.laws.pitch_law_outputs.right_outboard_elevator_deg =
    A380PrimComputerFg_B.right_outboard_elevator_deg;
  A380PrimComputerFg_Y.out.laws.pitch_law_outputs.ths_deg = A380PrimComputerFg_B.ths_deg;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.left_inboard_aileron_engaged =
    A380PrimComputerFg_B.left_inboard_aileron_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.right_inboard_aileron_engaged =
    A380PrimComputerFg_B.right_inboard_aileron_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.left_midboard_aileron_engaged =
    A380PrimComputerFg_B.left_midboard_aileron_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.right_midboard_aileron_engaged =
    A380PrimComputerFg_B.right_midboard_aileron_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.left_outboard_aileron_engaged =
    A380PrimComputerFg_B.left_outboard_aileron_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.right_outboard_aileron_engaged =
    A380PrimComputerFg_B.right_outboard_aileron_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_1_engaged =
    A380PrimComputerFg_B.spoiler_pair_1_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_2_engaged =
    A380PrimComputerFg_B.spoiler_pair_2_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_3_engaged =
    A380PrimComputerFg_B.spoiler_pair_3_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_4_engaged =
    A380PrimComputerFg_B.spoiler_pair_4_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_5_engaged =
    A380PrimComputerFg_B.spoiler_pair_5_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_6_engaged =
    A380PrimComputerFg_B.spoiler_pair_6_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_7_engaged =
    A380PrimComputerFg_B.spoiler_pair_7_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.spoiler_pair_8_engaged =
    A380PrimComputerFg_B.spoiler_pair_8_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.left_inboard_elevator_engaged =
    A380PrimComputerFg_B.left_inboard_elevator_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.right_inboard_elevator_engaged =
    A380PrimComputerFg_B.right_inboard_elevator_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.left_outboard_elevator_engaged =
    A380PrimComputerFg_B.left_outboard_elevator_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.right_outboard_elevator_engaged =
    A380PrimComputerFg_B.right_outboard_elevator_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.ths_engaged = A380PrimComputerFg_B.ths_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.upper_rudder_engaged = A380PrimComputerFg_B.upper_rudder_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.surface_statuses.lower_rudder_engaged = A380PrimComputerFg_B.lower_rudder_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg =
    A380PrimComputerFg_B.left_inboard_aileron_deg_g;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg =
    A380PrimComputerFg_B.right_inboard_aileron_deg_b;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg =
    A380PrimComputerFg_B.left_midboard_aileron_deg_f;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg =
    A380PrimComputerFg_B.right_midboard_aileron_deg_f;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg =
    A380PrimComputerFg_B.left_outboard_aileron_deg_g;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg =
    A380PrimComputerFg_B.right_outboard_aileron_deg_m;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_1_deg =
    A380PrimComputerFg_B.left_spoiler_1_deg_b;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_1_deg =
    A380PrimComputerFg_B.right_spoiler_1_deg_o;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_2_deg =
    A380PrimComputerFg_B.left_spoiler_2_deg_i;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_2_deg =
    A380PrimComputerFg_B.right_spoiler_2_deg_g;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_3_deg =
    A380PrimComputerFg_B.left_spoiler_3_deg_i;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_3_deg =
    A380PrimComputerFg_B.right_spoiler_3_deg_b;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_4_deg =
    A380PrimComputerFg_B.left_spoiler_4_deg_g;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_4_deg =
    A380PrimComputerFg_B.right_spoiler_4_deg_a;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_5_deg =
    A380PrimComputerFg_B.left_spoiler_5_deg_d;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_5_deg =
    A380PrimComputerFg_B.right_spoiler_5_deg_m;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_6_deg =
    A380PrimComputerFg_B.left_spoiler_6_deg_o;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_6_deg =
    A380PrimComputerFg_B.right_spoiler_6_deg_d;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_7_deg =
    A380PrimComputerFg_B.left_spoiler_7_deg_a;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_7_deg =
    A380PrimComputerFg_B.right_spoiler_7_deg_j;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_8_deg =
    A380PrimComputerFg_B.left_spoiler_8_deg_h;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_8_deg =
    A380PrimComputerFg_B.right_spoiler_8_deg_j;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.upper_rudder_deg =
    A380PrimComputerFg_B.upper_rudder_deg_m;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_surface_positions.lower_rudder_deg =
    A380PrimComputerFg_B.lower_rudder_deg_c;
  A380PrimComputerFg_Y.out.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg =
    A380PrimComputerFg_B.left_inboard_elevator_deg_k;
  A380PrimComputerFg_Y.out.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg =
    A380PrimComputerFg_B.right_inboard_elevator_deg_o;
  A380PrimComputerFg_Y.out.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg =
    A380PrimComputerFg_B.left_outboard_elevator_deg_p;
  A380PrimComputerFg_Y.out.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg =
    A380PrimComputerFg_B.right_outboard_elevator_deg_g;
  A380PrimComputerFg_Y.out.fctl_logic.pitch_surface_positions.ths_deg = A380PrimComputerFg_B.ths_deg_o;
  A380PrimComputerFg_Y.out.fctl_logic.lateral_law_capability = A380PrimComputerFg_B.lateral_law_capability;
  A380PrimComputerFg_Y.out.fctl_logic.active_lateral_law = A380PrimComputerFg_B.active_lateral_law_n;
  A380PrimComputerFg_Y.out.fctl_logic.pitch_law_capability = A380PrimComputerFg_B.pitch_law_capability;
  A380PrimComputerFg_Y.out.fctl_logic.active_pitch_law = A380PrimComputerFg_B.active_pitch_law;
  A380PrimComputerFg_Y.out.fctl_logic.abnormal_condition_law_active = A380PrimComputerFg_B.abnormal_condition_law_active;
  A380PrimComputerFg_Y.out.fctl_logic.is_master_prim = A380PrimComputerFg_B.is_master_prim;
  A380PrimComputerFg_Y.out.fctl_logic.elevator_1_avail = A380PrimComputerFg_B.elevator_1_avail;
  A380PrimComputerFg_Y.out.fctl_logic.elevator_1_engaged = A380PrimComputerFg_B.elevator_1_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.elevator_2_avail = A380PrimComputerFg_B.elevator_2_avail;
  A380PrimComputerFg_Y.out.fctl_logic.elevator_2_engaged = A380PrimComputerFg_B.elevator_2_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.elevator_3_avail = A380PrimComputerFg_B.elevator_3_avail;
  A380PrimComputerFg_Y.out.fctl_logic.elevator_3_engaged = A380PrimComputerFg_B.elevator_3_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.ths_avail = A380PrimComputerFg_B.ths_avail;
  A380PrimComputerFg_Y.out.fctl_logic.ths_engaged = A380PrimComputerFg_B.ths_engaged_h;
  A380PrimComputerFg_Y.out.fctl_logic.left_aileron_1_avail = A380PrimComputerFg_B.left_aileron_1_avail;
  A380PrimComputerFg_Y.out.fctl_logic.left_aileron_1_engaged = A380PrimComputerFg_B.left_aileron_1_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.left_aileron_2_avail = A380PrimComputerFg_B.left_aileron_2_avail;
  A380PrimComputerFg_Y.out.fctl_logic.left_aileron_2_engaged = A380PrimComputerFg_B.left_aileron_2_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.right_aileron_1_avail = A380PrimComputerFg_B.right_aileron_1_avail;
  A380PrimComputerFg_Y.out.fctl_logic.right_aileron_1_engaged = A380PrimComputerFg_B.right_aileron_1_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.right_aileron_2_avail = A380PrimComputerFg_B.right_aileron_2_avail;
  A380PrimComputerFg_Y.out.fctl_logic.right_aileron_2_engaged = A380PrimComputerFg_B.right_aileron_2_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.left_spoiler_hydraulic_mode_avail =
    A380PrimComputerFg_B.left_spoiler_hydraulic_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.left_spoiler_electric_mode_avail =
    A380PrimComputerFg_B.left_spoiler_electric_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.left_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFg_B.left_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.left_spoiler_electric_mode_engaged =
    A380PrimComputerFg_B.left_spoiler_electric_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.right_spoiler_hydraulic_mode_avail =
    A380PrimComputerFg_B.right_spoiler_hydraulic_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.right_spoiler_electric_mode_avail =
    A380PrimComputerFg_B.right_spoiler_electric_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.right_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFg_B.right_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.right_spoiler_electric_mode_engaged =
    A380PrimComputerFg_B.right_spoiler_electric_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_1_hydraulic_mode_avail = A380PrimComputerFg_B.rudder_1_hydraulic_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_1_electric_mode_avail = A380PrimComputerFg_B.rudder_1_electric_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_1_hydraulic_mode_engaged =
    A380PrimComputerFg_B.rudder_1_hydraulic_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_1_electric_mode_engaged =
    A380PrimComputerFg_B.rudder_1_electric_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_2_hydraulic_mode_avail = A380PrimComputerFg_B.rudder_2_hydraulic_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_2_electric_mode_avail = A380PrimComputerFg_B.rudder_2_electric_mode_avail;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_2_hydraulic_mode_engaged =
    A380PrimComputerFg_B.rudder_2_hydraulic_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.rudder_2_electric_mode_engaged =
    A380PrimComputerFg_B.rudder_2_electric_mode_engaged;
  A380PrimComputerFg_Y.out.fctl_logic.aileron_droop_active = A380PrimComputerFg_B.aileron_droop_active;
  A380PrimComputerFg_Y.out.fctl_logic.aileron_antidroop_active = A380PrimComputerFg_B.aileron_antidroop_active;
  A380PrimComputerFg_Y.out.fctl_logic.ths_automatic_mode_active = A380PrimComputerFg_B.ths_automatic_mode_active;
  A380PrimComputerFg_Y.out.fctl_logic.ths_manual_mode_c_deg_s = A380PrimComputerFg_B.ths_manual_mode_c_deg_s;
  A380PrimComputerFg_Y.out.fctl_logic.eha_ebha_elec_mode_inhibited = A380PrimComputerFg_B.eha_ebha_elec_mode_inhibited;
  A380PrimComputerFg_Y.out.fctl_logic.left_sidestick_disabled = A380PrimComputerFg_B.left_sidestick_disabled;
  A380PrimComputerFg_Y.out.fctl_logic.right_sidestick_disabled = A380PrimComputerFg_B.right_sidestick_disabled;
  A380PrimComputerFg_Y.out.fctl_logic.left_sidestick_priority_locked =
    A380PrimComputerFg_B.left_sidestick_priority_locked;
  A380PrimComputerFg_Y.out.fctl_logic.right_sidestick_priority_locked =
    A380PrimComputerFg_B.right_sidestick_priority_locked;
  A380PrimComputerFg_Y.out.fctl_logic.total_sidestick_pitch_command = A380PrimComputerFg_B.total_sidestick_pitch_command;
  A380PrimComputerFg_Y.out.fctl_logic.total_sidestick_roll_command = A380PrimComputerFg_B.total_sidestick_roll_command;
  A380PrimComputerFg_Y.out.fctl_logic.speed_brake_inhibited = A380PrimComputerFg_B.speed_brake_inhibited;
  A380PrimComputerFg_Y.out.fctl_logic.speed_brake_command_deg = A380PrimComputerFg_B.speed_brake_command_deg;
  A380PrimComputerFg_Y.out.fctl_logic.ground_spoilers_armed = A380PrimComputerFg_B.ground_spoilers_armed;
  A380PrimComputerFg_Y.out.fctl_logic.ground_spoilers_out = A380PrimComputerFg_B.ground_spoilers_out;
  A380PrimComputerFg_Y.out.fctl_logic.phased_lift_dumping_active = A380PrimComputerFg_B.phased_lift_dumping_active;
  A380PrimComputerFg_Y.out.fctl_logic.spoiler_lift_active = A380PrimComputerFg_B.spoiler_lift_active;
  A380PrimComputerFg_Y.out.fctl_logic.ap_authorised = A380PrimComputerFg_B.ap_authorised;
  A380PrimComputerFg_Y.out.fctl_logic.protection_ap_disconnect = A380PrimComputerFg_B.protection_ap_disconnect;
  A380PrimComputerFg_Y.out.fctl_logic.high_alpha_prot_active = A380PrimComputerFg_B.high_alpha_prot_active;
  A380PrimComputerFg_Y.out.fctl_logic.alpha_prot_deg = A380PrimComputerFg_B.alpha_prot_deg;
  A380PrimComputerFg_Y.out.fctl_logic.alpha_max_deg = A380PrimComputerFg_B.alpha_max_deg;
  A380PrimComputerFg_Y.out.fctl_logic.v_alpha_prot_kn = A380PrimComputerFg_B.v_alpha_prot_kn;
  A380PrimComputerFg_Y.out.fctl_logic.v_alpha_max_kn = A380PrimComputerFg_B.v_alpha_max_kn;
  A380PrimComputerFg_Y.out.fctl_logic.v_alpha_stall_warn_kn = A380PrimComputerFg_B.v_alpha_stall_warn_kn;
  A380PrimComputerFg_Y.out.fctl_logic.high_speed_prot_active = A380PrimComputerFg_B.high_speed_prot_active;
  A380PrimComputerFg_Y.out.fctl_logic.high_speed_prot_lo_thresh_kn = A380PrimComputerFg_B.high_speed_prot_lo_thresh_kn;
  A380PrimComputerFg_Y.out.fctl_logic.high_speed_prot_hi_thresh_kn = A380PrimComputerFg_B.high_speed_prot_hi_thresh_kn;
  A380PrimComputerFg_Y.out.fg_logic.altitude_indicated_ft.SSM = A380PrimComputerFg_B.SSM_i2;
  A380PrimComputerFg_Y.out.fg_logic.altitude_indicated_ft.Data = A380PrimComputerFg_B.Data_ez;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.runway_heading_deg.SSM = A380PrimComputerFg_B.SSM_kxx;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.runway_heading_deg.Data = A380PrimComputerFg_B.Data_fwx;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.ils_frequency_mhz.SSM = A380PrimComputerFg_B.SSM_kx;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.ils_frequency_mhz.Data = A380PrimComputerFg_B.Data_fw;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.localizer_deviation_deg.SSM = A380PrimComputerFg_B.SSM_k;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.localizer_deviation_deg.Data = A380PrimComputerFg_B.Data_f;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM = A380PrimComputerFg_B.SSM;
  A380PrimComputerFg_Y.out.fg_logic.ils_computation_data.glideslope_deviation_deg.Data = A380PrimComputerFg_B.Data;
  A380PrimComputerFg_Y.out.fg_logic.gnd_eng_stop_flt_5s = A380PrimComputerFg_B.gnd_eng_stop_flt_5s;
  A380PrimComputerFg_Y.out.fg_logic.ap_fd_common_condition = A380PrimComputerFg_B.ap_fd_common_condition;
  A380PrimComputerFg_Y.out.fg_logic.fd_1_engaged = A380PrimComputerFg_B.fd_1_engaged;
  A380PrimComputerFg_Y.out.fg_logic.fd_2_engaged = A380PrimComputerFg_B.fd_2_engaged;
  A380PrimComputerFg_Y.out.fg_logic.ap_1_engaged = A380PrimComputerFg_B.ap_1_engaged;
  A380PrimComputerFg_Y.out.fg_logic.ap_2_engaged = A380PrimComputerFg_B.ap_2_engaged;
  A380PrimComputerFg_Y.out.fg_logic.athr_engaged = A380PrimComputerFg_B.athr_engaged;
  A380PrimComputerFg_Y.out.fg_logic.fd_1_inop = A380PrimComputerFg_B.fd_1_inop;
  A380PrimComputerFg_Y.out.fg_logic.fd_2_inop = A380PrimComputerFg_B.fd_2_inop;
  A380PrimComputerFg_Y.out.fg_logic.ap_1_inop = A380PrimComputerFg_B.ap_1_inop;
  A380PrimComputerFg_Y.out.fg_logic.ap_2_inop = A380PrimComputerFg_B.ap_2_inop;
  A380PrimComputerFg_Y.out.fg_logic.athr_inop = A380PrimComputerFg_B.athr_inop;
  A380PrimComputerFg_Y.out.fg_logic.fmgc_opp_priority = A380PrimComputerFg_B.fmgc_opp_priority;
  A380PrimComputerFg_Y.out.fg_logic.all_fcu_failure = A380PrimComputerFg_B.all_fcu_failure;
  A380PrimComputerFg_Y.out.fg_logic.fcu_1_chosen = A380PrimComputerFg_B.fcu_1_chosen;
  A380PrimComputerFg_Y.out.fg_logic.fcu_2_chosen = A380PrimComputerFg_B.fcu_2_chosen;
  A380PrimComputerFg_Y.out.fg_logic.ils_failure = A380PrimComputerFg_B.ils_failure;
  A380PrimComputerFg_Y.out.fg_logic.both_ils_valid = A380PrimComputerFg_B.both_ils_valid;
  A380PrimComputerFg_Y.out.fg_logic.ils_tune_inhibit = A380PrimComputerFg_B.ils_tune_inhibit;
  A380PrimComputerFg_Y.out.fg_logic.rwy_hdg_memo = A380PrimComputerFg_B.rwy_hdg_memo;
  A380PrimComputerFg_Y.out.fg_logic.tcas_failure = A380PrimComputerFg_B.tcas_failure;
  A380PrimComputerFg_Y.out.fg_logic.tcas_mode_available = A380PrimComputerFg_B.tcas_mode_available;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.rwy_active = A380PrimComputerFg_B.rwy_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.nav_active = A380PrimComputerFg_B.nav_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.loc_cpt_active = A380PrimComputerFg_B.loc_cpt_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.loc_trk_active = A380PrimComputerFg_B.loc_trk_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.roll_goaround_active = A380PrimComputerFg_B.roll_goaround_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.hdg_active = A380PrimComputerFg_B.hdg_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.trk_active = A380PrimComputerFg_B.trk_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.rwy_loc_submode_active =
    A380PrimComputerFg_B.rwy_loc_submode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.rwy_trk_submode_active =
    A380PrimComputerFg_B.rwy_trk_submode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.land_active = A380PrimComputerFg_B.land_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.align_submode_active = A380PrimComputerFg_B.align_submode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_modes.rollout_submode_active =
    A380PrimComputerFg_B.rollout_submode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.clb_active = A380PrimComputerFg_B.clb_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.des_active = A380PrimComputerFg_B.des_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.op_clb_active = A380PrimComputerFg_B.op_clb_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.op_des_active = A380PrimComputerFg_B.op_des_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.pitch_takeoff_active =
    A380PrimComputerFg_B.pitch_takeoff_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.pitch_goaround_active =
    A380PrimComputerFg_B.pitch_goaround_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.vs_active = A380PrimComputerFg_B.vs_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.fpa_active = A380PrimComputerFg_B.fpa_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.alt_acq_active = A380PrimComputerFg_B.alt_acq_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.alt_hold_active = A380PrimComputerFg_B.alt_hold_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.fma_dash_display = A380PrimComputerFg_B.fma_dash_display;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.gs_capt_active = A380PrimComputerFg_B.gs_capt_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.gs_trk_active = A380PrimComputerFg_B.gs_trk_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.final_des_active = A380PrimComputerFg_B.final_des_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.flare_active = A380PrimComputerFg_B.flare_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.cruise_active = A380PrimComputerFg_B.cruise_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_modes.tcas_active = A380PrimComputerFg_B.tcas_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.alt_acq_armed = A380PrimComputerFg_B.alt_acq_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.alt_acq_arm_possible = A380PrimComputerFg_B.alt_acq_arm_possible;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.nav_armed = A380PrimComputerFg_B.nav_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.loc_armed = A380PrimComputerFg_B.loc_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.land_armed = A380PrimComputerFg_B.land_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.glide_armed = A380PrimComputerFg_B.glide_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.final_des_armed = A380PrimComputerFg_B.final_des_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.clb_armed = A380PrimComputerFg_B.clb_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.des_armed = A380PrimComputerFg_B.des_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.armed_modes.tcas_armed = A380PrimComputerFg_B.tcas_armed;
  A380PrimComputerFg_Y.out.fg_mode_logic.active_lateral_law = A380PrimComputerFg_B.active_lateral_law;
  A380PrimComputerFg_Y.out.fg_mode_logic.active_longitudinal_law = A380PrimComputerFg_B.active_longitudinal_law;
  A380PrimComputerFg_Y.out.fg_mode_logic.auto_spd_control_active = A380PrimComputerFg_B.auto_spd_control_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.manual_spd_control_active = A380PrimComputerFg_B.manual_spd_control_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.mach_control_active = A380PrimComputerFg_B.mach_control_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.athr_active = A380PrimComputerFg_B.athr_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.athr_limited = A380PrimComputerFg_B.athr_limited;
  A380PrimComputerFg_Y.out.fg_mode_logic.alpha_floor_mode_active = A380PrimComputerFg_B.alpha_floor_mode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.thrust_mode_active = A380PrimComputerFg_B.thrust_mode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.thrust_target_idle = A380PrimComputerFg_B.thrust_target_idle;
  A380PrimComputerFg_Y.out.fg_mode_logic.speed_mach_mode_active = A380PrimComputerFg_B.speed_mach_mode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.retard_mode_active = A380PrimComputerFg_B.retard_mode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.athr_fma_mode = A380PrimComputerFg_B.athr_fma_mode;
  A380PrimComputerFg_Y.out.fg_mode_logic.athr_fma_message = A380PrimComputerFg_B.athr_fma_message;
  A380PrimComputerFg_Y.out.fg_mode_logic.spd_target_kts = A380PrimComputerFg_B.spd_target_kts;
  A380PrimComputerFg_Y.out.fg_mode_logic.pfd_spd_target_kts = A380PrimComputerFg_B.pfd_spd_target_kts;
  A380PrimComputerFg_Y.out.fg_mode_logic.alt_cstr_applicable = A380PrimComputerFg_B.alt_cstr_applicable;
  A380PrimComputerFg_Y.out.fg_mode_logic.alt_sel_or_cstr = A380PrimComputerFg_B.alt_sel_or_cstr;
  A380PrimComputerFg_Y.out.fg_mode_logic.fmgc_opp_mode_sync = A380PrimComputerFg_B.fmgc_opp_mode_sync;
  A380PrimComputerFg_Y.out.fg_mode_logic.any_ap_fd_engaged = A380PrimComputerFg_B.any_ap_fd_engaged;
  A380PrimComputerFg_Y.out.fg_mode_logic.any_lateral_mode_engaged = A380PrimComputerFg_B.any_lateral_mode_engaged;
  A380PrimComputerFg_Y.out.fg_mode_logic.any_longitudinal_mode_engaged =
    A380PrimComputerFg_B.any_longitudinal_mode_engaged;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_mode_reset = A380PrimComputerFg_B.lateral_mode_reset;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_mode_reset = A380PrimComputerFg_B.longitudinal_mode_reset;
  A380PrimComputerFg_Y.out.fg_mode_logic.hdg_trk_preset_available = A380PrimComputerFg_B.hdg_trk_preset_available;
  A380PrimComputerFg_Y.out.fg_mode_logic.alt_soft_mode_active = A380PrimComputerFg_B.alt_soft_mode_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.fd_auto_disengage = A380PrimComputerFg_B.fd_auto_disengage;
  A380PrimComputerFg_Y.out.fg_mode_logic.ap_fd_mode_reversion = A380PrimComputerFg_B.ap_fd_mode_reversion;
  A380PrimComputerFg_Y.out.fg_mode_logic.lateral_mode_reversion = A380PrimComputerFg_B.lateral_mode_reversion;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_mode_reversion_vs =
    A380PrimComputerFg_B.longitudinal_mode_reversion_vs;
  A380PrimComputerFg_Y.out.fg_mode_logic.longitudinal_mode_reversion_op_clb =
    A380PrimComputerFg_B.longitudinal_mode_reversion_op_clb;
  A380PrimComputerFg_Y.out.fg_mode_logic.pitch_fd_bars_flashing = A380PrimComputerFg_B.pitch_fd_bars_flashing;
  A380PrimComputerFg_Y.out.fg_mode_logic.roll_fd_bars_flashing = A380PrimComputerFg_B.roll_fd_bars_flashing;
  A380PrimComputerFg_Y.out.fg_mode_logic.loc_bc_selection = A380PrimComputerFg_B.loc_bc_selection;
  A380PrimComputerFg_Y.out.fg_mode_logic.vs_target_not_held = A380PrimComputerFg_B.vs_target_not_held;
  A380PrimComputerFg_Y.out.fg_mode_logic.tcas_vs_target = A380PrimComputerFg_B.tcas_vs_target;
  A380PrimComputerFg_Y.out.fg_mode_logic.tcas_ra_corrective = A380PrimComputerFg_B.tcas_ra_corrective;
  A380PrimComputerFg_Y.out.fg_mode_logic.active_tcas_submode = A380PrimComputerFg_B.active_tcas_submode;
  A380PrimComputerFg_Y.out.fg_mode_logic.tcas_alt_acq_cond = A380PrimComputerFg_B.tcas_alt_acq_cond;
  A380PrimComputerFg_Y.out.fg_mode_logic.tcas_alt_hold_cond = A380PrimComputerFg_B.tcas_alt_hold_cond;
  A380PrimComputerFg_Y.out.fg_mode_logic.tcas_ra_inhibited = A380PrimComputerFg_B.tcas_ra_inhibited;
  A380PrimComputerFg_Y.out.fg_mode_logic.trk_fpa_deselected = A380PrimComputerFg_B.trk_fpa_deselected;
  A380PrimComputerFg_Y.out.fg_mode_logic.longi_large_box_tcas = A380PrimComputerFg_B.longi_large_box_tcas;
  A380PrimComputerFg_Y.out.fg_mode_logic.land_2_capability = A380PrimComputerFg_B.land_2_capability;
  A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_passive_capability =
    A380PrimComputerFg_B.land_3_fail_passive_capability;
  A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_op_capability = A380PrimComputerFg_B.land_3_fail_op_capability;
  A380PrimComputerFg_Y.out.fg_mode_logic.land_2_inop = A380PrimComputerFg_B.land_2_inop;
  A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_passive_inop = A380PrimComputerFg_B.land_3_fail_passive_inop;
  A380PrimComputerFg_Y.out.fg_mode_logic.land_3_fail_op_inop = A380PrimComputerFg_B.land_3_fail_op_inop;
  A380PrimComputerFg_Y.out.fg_mode_logic.tla_to_ga_set = A380PrimComputerFg_B.tla_to_ga_set;
  A380PrimComputerFg_Y.out.fg_mode_logic.true_active = A380PrimComputerFg_B.true_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.trk_fpa_active = A380PrimComputerFg_B.trk_fpa_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.metric_alt_active = A380PrimComputerFg_B.metric_alt_active;
  A380PrimComputerFg_Y.out.fg_mode_logic.spd_mach_display_value = A380PrimComputerFg_B.spd_mach_display_value;
  A380PrimComputerFg_Y.out.fg_mode_logic.spd_mach_dashes = A380PrimComputerFg_B.spd_mach_dashes;
  A380PrimComputerFg_Y.out.fg_mode_logic.hdg_trk_display_value = A380PrimComputerFg_B.hdg_trk_display_value;
  A380PrimComputerFg_Y.out.fg_mode_logic.hdg_trk_dashes = A380PrimComputerFg_B.hdg_trk_dashes;
  A380PrimComputerFg_Y.out.fg_mode_logic.alt_display_value = A380PrimComputerFg_B.alt_display_value;
  A380PrimComputerFg_Y.out.fg_mode_logic.vs_fpa_display_value = A380PrimComputerFg_B.vs_fpa_display_value;
  A380PrimComputerFg_Y.out.fg_mode_logic.vs_fpa_dashes = A380PrimComputerFg_B.vs_fpa_dashes;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flight_director.Theta_c_deg = A380PrimComputerFg_B.Theta_c_deg;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flight_director.Phi_c_deg = A380PrimComputerFg_B.Phi_c_deg;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flight_director.Beta_c_deg = A380PrimComputerFg_B.Beta_c_deg;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.autopilot.Theta_c_deg = A380PrimComputerFg_B.Theta_c_deg_n;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.autopilot.Phi_c_deg = A380PrimComputerFg_B.Phi_c_deg_h;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.autopilot.Beta_c_deg = A380PrimComputerFg_B.Beta_c_deg_b;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flare_law.condition_Flare = A380PrimComputerFg_B.condition_Flare;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flare_law.H_dot_radio_fpm = A380PrimComputerFg_B.H_dot_radio_fpm;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flare_law.H_dot_c_fpm = A380PrimComputerFg_B.H_dot_c_fpm;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flare_law.delta_Theta_H_dot_deg = A380PrimComputerFg_B.delta_Theta_H_dot_deg;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flare_law.delta_Theta_bz_deg = A380PrimComputerFg_B.delta_Theta_bz_deg;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flare_law.delta_Theta_bx_deg = A380PrimComputerFg_B.delta_Theta_bx_deg;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.flare_law.delta_Theta_beta_c_deg =
    A380PrimComputerFg_B.delta_Theta_beta_c_deg;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.Phi_loc_c = A380PrimComputerFg_B.Phi_loc_c;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_1.Nosewheel_c = A380PrimComputerFg_B.Nosewheel_c;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flight_director.Theta_c_deg = A380PrimComputerFg_B.Theta_c_deg_n0;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flight_director.Phi_c_deg = A380PrimComputerFg_B.Phi_c_deg_hj;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flight_director.Beta_c_deg = A380PrimComputerFg_B.Beta_c_deg_bp;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.autopilot.Theta_c_deg = A380PrimComputerFg_B.Theta_c_deg_n03;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.autopilot.Phi_c_deg = A380PrimComputerFg_B.Phi_c_deg_hjv;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.autopilot.Beta_c_deg = A380PrimComputerFg_B.Beta_c_deg_bpl;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flare_law.condition_Flare = A380PrimComputerFg_B.condition_Flare_n;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flare_law.H_dot_radio_fpm = A380PrimComputerFg_B.H_dot_radio_fpm_p;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flare_law.H_dot_c_fpm = A380PrimComputerFg_B.H_dot_c_fpm_j;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flare_law.delta_Theta_H_dot_deg =
    A380PrimComputerFg_B.delta_Theta_H_dot_deg_l;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flare_law.delta_Theta_bz_deg = A380PrimComputerFg_B.delta_Theta_bz_deg_a;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flare_law.delta_Theta_bx_deg = A380PrimComputerFg_B.delta_Theta_bx_deg_j;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.flare_law.delta_Theta_beta_c_deg =
    A380PrimComputerFg_B.delta_Theta_beta_c_deg_g;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.Phi_loc_c = A380PrimComputerFg_B.Phi_loc_c_j;
  A380PrimComputerFg_Y.out.fg_laws.ap_fd_2.Nosewheel_c = A380PrimComputerFg_B.Nosewheel_c_f;
  A380PrimComputerFg_Y.out.fg_laws.n_1_c_percent = A380PrimComputerFg_B.n_1_c_percent;
  A380PrimComputerFg_Y.out.discrete_outputs.alignment_dummy = A380PrimComputerFg_B.alignment_dummy;
  A380PrimComputerFg_Y.out.discrete_outputs.elevator_1_active_mode = A380PrimComputerFg_B.elevator_1_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.elevator_2_active_mode = A380PrimComputerFg_B.elevator_2_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.elevator_3_active_mode = A380PrimComputerFg_B.elevator_3_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.ths_active_mode = A380PrimComputerFg_B.ths_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.left_aileron_1_active_mode = A380PrimComputerFg_B.left_aileron_1_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.left_aileron_2_active_mode = A380PrimComputerFg_B.left_aileron_2_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.right_aileron_1_active_mode =
    A380PrimComputerFg_B.right_aileron_1_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.right_aileron_2_active_mode =
    A380PrimComputerFg_B.right_aileron_2_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.left_spoiler_electronic_module_enable =
    A380PrimComputerFg_B.left_spoiler_electronic_module_enable;
  A380PrimComputerFg_Y.out.discrete_outputs.right_spoiler_electronic_module_enable =
    A380PrimComputerFg_B.right_spoiler_electronic_module_enable;
  A380PrimComputerFg_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode =
    A380PrimComputerFg_B.rudder_1_hydraulic_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.rudder_1_electric_active_mode =
    A380PrimComputerFg_B.rudder_1_electric_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode =
    A380PrimComputerFg_B.rudder_2_hydraulic_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.rudder_2_electric_active_mode =
    A380PrimComputerFg_B.rudder_2_electric_active_mode;
  A380PrimComputerFg_Y.out.discrete_outputs.prim_healthy = A380PrimComputerFg_B.prim_healthy;
  A380PrimComputerFg_Y.out.discrete_outputs.fcu_1_select = A380PrimComputerFg_B.fcu_1_select;
  A380PrimComputerFg_Y.out.discrete_outputs.fcu_2_select = A380PrimComputerFg_B.fcu_2_select;
  A380PrimComputerFg_Y.out.discrete_outputs.ap_engaged = A380PrimComputerFg_B.ap_engaged;
  A380PrimComputerFg_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputerFg_B.reverser_tertiary_lock;
  A380PrimComputerFg_Y.out.analog_outputs.elevator_1_pos_order_deg = A380PrimComputerFg_B.elevator_1_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.elevator_2_pos_order_deg = A380PrimComputerFg_B.elevator_2_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.elevator_3_pos_order_deg = A380PrimComputerFg_B.elevator_3_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputerFg_B.ths_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.left_aileron_1_pos_order_deg =
    A380PrimComputerFg_B.left_aileron_1_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.left_aileron_2_pos_order_deg =
    A380PrimComputerFg_B.left_aileron_2_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.right_aileron_1_pos_order_deg =
    A380PrimComputerFg_B.right_aileron_1_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.right_aileron_2_pos_order_deg =
    A380PrimComputerFg_B.right_aileron_2_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.left_spoiler_pos_order_deg = A380PrimComputerFg_B.left_spoiler_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.right_spoiler_pos_order_deg = A380PrimComputerFg_B.right_spoiler_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.rudder_1_pos_order_deg = A380PrimComputerFg_B.rudder_1_pos_order_deg;
  A380PrimComputerFg_Y.out.analog_outputs.rudder_2_pos_order_deg = A380PrimComputerFg_B.rudder_2_pos_order_deg;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM = A380PrimComputerFg_B.SSM_gzd;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_inboard_aileron_command_deg.Data = A380PrimComputerFg_B.Data_lu;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM = A380PrimComputerFg_B.SSM_mo;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_inboard_aileron_command_deg.Data = A380PrimComputerFg_B.Data_dc;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM = A380PrimComputerFg_B.SSM_me;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_midboard_aileron_command_deg.Data = A380PrimComputerFg_B.Data_gc;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM = A380PrimComputerFg_B.SSM_mj;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_midboard_aileron_command_deg.Data = A380PrimComputerFg_B.Data_am;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM = A380PrimComputerFg_B.SSM_a5;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_outboard_aileron_command_deg.Data = A380PrimComputerFg_B.Data_dg;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM = A380PrimComputerFg_B.SSM_bt;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_outboard_aileron_command_deg.Data = A380PrimComputerFg_B.Data_e1;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_1_command_deg.SSM = A380PrimComputerFg_B.SSM_om;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_1_command_deg.Data = A380PrimComputerFg_B.Data_fp;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_1_command_deg.SSM = A380PrimComputerFg_B.SSM_ar;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_1_command_deg.Data = A380PrimComputerFg_B.Data_ns;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_2_command_deg.SSM = A380PrimComputerFg_B.SSM_ce;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_2_command_deg.Data = A380PrimComputerFg_B.Data_m3;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_2_command_deg.SSM = A380PrimComputerFg_B.SSM_ed;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_2_command_deg.Data = A380PrimComputerFg_B.Data_oj;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_3_command_deg.SSM = A380PrimComputerFg_B.SSM_je;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_3_command_deg.Data = A380PrimComputerFg_B.Data_jy;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_3_command_deg.SSM = A380PrimComputerFg_B.SSM_jt;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_3_command_deg.Data = A380PrimComputerFg_B.Data_j1;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_4_command_deg.SSM = A380PrimComputerFg_B.SSM_cui;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_4_command_deg.Data = A380PrimComputerFg_B.Data_fc;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_4_command_deg.SSM = A380PrimComputerFg_B.SSM_mq;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_4_command_deg.Data = A380PrimComputerFg_B.Data_of;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_5_command_deg.SSM = A380PrimComputerFg_B.SSM_ni;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_5_command_deg.Data = A380PrimComputerFg_B.Data_n4;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_5_command_deg.SSM = A380PrimComputerFg_B.SSM_df;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_5_command_deg.Data = A380PrimComputerFg_B.Data_ot;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_6_command_deg.SSM = A380PrimComputerFg_B.SSM_oe;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_6_command_deg.Data = A380PrimComputerFg_B.Data_gv;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_6_command_deg.SSM = A380PrimComputerFg_B.SSM_ha;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_6_command_deg.Data = A380PrimComputerFg_B.Data_ou;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_7_command_deg.SSM = A380PrimComputerFg_B.SSM_op;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_7_command_deg.Data = A380PrimComputerFg_B.Data_dh;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_7_command_deg.SSM = A380PrimComputerFg_B.SSM_a50;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_7_command_deg.Data = A380PrimComputerFg_B.Data_ph;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_8_command_deg.SSM = A380PrimComputerFg_B.SSM_a4;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_8_command_deg.Data = A380PrimComputerFg_B.Data_gs;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_8_command_deg.SSM = A380PrimComputerFg_B.SSM_bv;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_8_command_deg.Data = A380PrimComputerFg_B.Data_fd4;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM = A380PrimComputerFg_B.SSM_bo;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_inboard_elevator_command_deg.Data = A380PrimComputerFg_B.Data_hm;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM = A380PrimComputerFg_B.SSM_d1;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_inboard_elevator_command_deg.Data = A380PrimComputerFg_B.Data_i2;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM = A380PrimComputerFg_B.SSM_hy;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_outboard_elevator_command_deg.Data = A380PrimComputerFg_B.Data_fv;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM = A380PrimComputerFg_B.SSM_gi;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_outboard_elevator_command_deg.Data = A380PrimComputerFg_B.Data_oc;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.ths_command_deg.SSM = A380PrimComputerFg_B.SSM_pp;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.ths_command_deg.Data = A380PrimComputerFg_B.Data_kq;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.upper_rudder_command_deg.SSM = A380PrimComputerFg_B.SSM_iab;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.upper_rudder_command_deg.Data = A380PrimComputerFg_B.Data_ne;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.lower_rudder_command_deg.SSM = A380PrimComputerFg_B.SSM_jtv;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.lower_rudder_command_deg.Data = A380PrimComputerFg_B.Data_it;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFg_B.SSM_fy;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_sidestick_pitch_command_deg.Data = A380PrimComputerFg_B.Data_ch;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_sidestick_pitch_command_deg.SSM = A380PrimComputerFg_B.SSM_ars;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_sidestick_pitch_command_deg.Data = A380PrimComputerFg_B.Data_bb;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_din;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_sidestick_roll_command_deg.Data = A380PrimComputerFg_B.Data_ol;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_sidestick_roll_command_deg.SSM = A380PrimComputerFg_B.SSM_m3;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_sidestick_roll_command_deg.Data = A380PrimComputerFg_B.Data_hw;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_pedal_position_deg.SSM = A380PrimComputerFg_B.SSM_np;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_pedal_position_deg.Data = A380PrimComputerFg_B.Data_hs;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.aileron_status_word.SSM = A380PrimComputerFg_B.SSM_ax;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.aileron_status_word.Data = A380PrimComputerFg_B.Data_ky;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_cl;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_h5;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_es;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_ku;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_aileron_1_position_deg.SSM = A380PrimComputerFg_B.SSM_gi1;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_aileron_1_position_deg.Data = A380PrimComputerFg_B.Data_jp;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_aileron_2_position_deg.SSM = A380PrimComputerFg_B.SSM_jz;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_aileron_2_position_deg.Data = A380PrimComputerFg_B.Data_nu;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.spoiler_status_word.SSM = A380PrimComputerFg_B.SSM_kt;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.spoiler_status_word.Data = A380PrimComputerFg_B.Data_br;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_position_deg.SSM = A380PrimComputerFg_B.SSM_eg;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.left_spoiler_position_deg.Data = A380PrimComputerFg_B.Data_ae;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_position_deg.SSM = A380PrimComputerFg_B.SSM_a0;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.right_spoiler_position_deg.Data = A380PrimComputerFg_B.Data_pe;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_status_word.SSM = A380PrimComputerFg_B.SSM_cv;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_status_word.Data = A380PrimComputerFg_B.Data_fy;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_1_position_deg.SSM = A380PrimComputerFg_B.SSM_ea;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_1_position_deg.Data = A380PrimComputerFg_B.Data_na;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_2_position_deg.SSM = A380PrimComputerFg_B.SSM_p4;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_2_position_deg.Data = A380PrimComputerFg_B.Data_i4;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_3_position_deg.SSM = A380PrimComputerFg_B.SSM_m2;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.elevator_3_position_deg.Data = A380PrimComputerFg_B.Data_cx;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.ths_position_deg.SSM = A380PrimComputerFg_B.SSM_bt0;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.ths_position_deg.Data = A380PrimComputerFg_B.Data_nz;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_status_word.SSM = A380PrimComputerFg_B.SSM_nr;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_status_word.Data = A380PrimComputerFg_B.Data_id;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_1_position_deg.SSM = A380PrimComputerFg_B.SSM_fr;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_1_position_deg.Data = A380PrimComputerFg_B.Data_o2;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_2_position_deg.SSM = A380PrimComputerFg_B.SSM_cc;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.rudder_2_position_deg.Data = A380PrimComputerFg_B.Data_gqq;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.radio_height_1_ft.SSM = A380PrimComputerFg_B.SSM_mkm;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.radio_height_1_ft.Data = A380PrimComputerFg_B.Data_md;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.radio_height_2_ft.SSM = A380PrimComputerFg_B.SSM_jhd;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.radio_height_2_ft.Data = A380PrimComputerFg_B.Data_cz;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.fctl_law_status_word.SSM = A380PrimComputerFg_B.SSM_av;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.fctl_law_status_word.Data = A380PrimComputerFg_B.Data_pm;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.discrete_status_word_1.SSM = A380PrimComputerFg_B.SSM_ira;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.discrete_status_word_1.Data = A380PrimComputerFg_B.Data_bj;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.v_alpha_lim_kn.SSM = A380PrimComputerFg_B.SSM_ge;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.v_alpha_lim_kn.Data = A380PrimComputerFg_B.Data_pe5;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.v_alpha_prot_kn.SSM = A380PrimComputerFg_B.SSM_lv;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.v_alpha_prot_kn.Data = A380PrimComputerFg_B.Data_jj;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.v_alpha_stall_warn_kn.SSM = A380PrimComputerFg_B.SSM_cg;
  A380PrimComputerFg_Y.out.bus_outputs.fctl.v_alpha_stall_warn_kn.Data = A380PrimComputerFg_B.Data_p5;
  A380PrimComputerFg_Y.out.bus_outputs.fe.gamma_a_deg.SSM = A380PrimComputerFg_B.SSM_be;
  A380PrimComputerFg_Y.out.bus_outputs.fe.gamma_a_deg.Data = A380PrimComputerFg_B.Data_ekl;
  A380PrimComputerFg_Y.out.bus_outputs.fe.gamma_t_deg.SSM = A380PrimComputerFg_B.SSM_axb;
  A380PrimComputerFg_Y.out.bus_outputs.fe.gamma_t_deg.Data = A380PrimComputerFg_B.Data_nd;
  A380PrimComputerFg_Y.out.bus_outputs.fe.sideslip_target_deg.SSM = A380PrimComputerFg_B.SSM_nz;
  A380PrimComputerFg_Y.out.bus_outputs.fe.sideslip_target_deg.Data = A380PrimComputerFg_B.Data_n2;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_ls_kn.SSM = A380PrimComputerFg_B.SSM_gh;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_ls_kn.Data = A380PrimComputerFg_B.Data_dl;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_stall_kn.SSM = A380PrimComputerFg_B.SSM_ks;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_stall_kn.Data = A380PrimComputerFg_B.Data_gs2;
  A380PrimComputerFg_Y.out.bus_outputs.fe.speed_trend_kn.SSM = A380PrimComputerFg_B.SSM_pw;
  A380PrimComputerFg_Y.out.bus_outputs.fe.speed_trend_kn.Data = A380PrimComputerFg_B.Data_h4;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_3_kn.SSM = A380PrimComputerFg_B.SSM_fh;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_3_kn.Data = A380PrimComputerFg_B.Data_e3;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_4_kn.SSM = A380PrimComputerFg_B.SSM_gzn;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_4_kn.Data = A380PrimComputerFg_B.Data_an;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_man_kn.SSM = A380PrimComputerFg_B.SSM_oo;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_man_kn.Data = A380PrimComputerFg_B.Data_i4o;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_max_kn.SSM = A380PrimComputerFg_B.SSM_evh;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_max_kn.Data = A380PrimComputerFg_B.Data_af;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_fe_next_kn.SSM = A380PrimComputerFg_B.SSM_cn;
  A380PrimComputerFg_Y.out.bus_outputs.fe.v_fe_next_kn.Data = A380PrimComputerFg_B.Data_bm;
  A380PrimComputerFg_Y.out.bus_outputs.fe.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_co;
  A380PrimComputerFg_Y.out.bus_outputs.fe.discrete_word_1.Data = A380PrimComputerFg_B.Data_dk;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pfd_spd_tgt_kts.SSM = A380PrimComputerFg_B.SSM_pe;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pfd_spd_tgt_kts.Data = A380PrimComputerFg_B.Data_nv;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pfd_short_term_mngd_spd_kts.SSM = A380PrimComputerFg_B.SSM_fw;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pfd_short_term_mngd_spd_kts.Data = A380PrimComputerFg_B.Data_jpf;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_spd_kts.SSM = A380PrimComputerFg_B.SSM_h4;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_spd_kts.Data = A380PrimComputerFg_B.Data_i5;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_mach_kts.SSM = A380PrimComputerFg_B.SSM_cb3;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_mach_kts.Data = A380PrimComputerFg_B.Data_k2;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_hdg_deg.SSM = A380PrimComputerFg_B.SSM_pj;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_hdg_deg.Data = A380PrimComputerFg_B.Data_as;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_trk_deg.SSM = A380PrimComputerFg_B.SSM_dv;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_trk_deg.Data = A380PrimComputerFg_B.Data_jl;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_alt_ft.SSM = A380PrimComputerFg_B.SSM_i4;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_alt_ft.Data = A380PrimComputerFg_B.Data_e32;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_vs_ft_min.SSM = A380PrimComputerFg_B.SSM_fm;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_vs_ft_min.Data = A380PrimComputerFg_B.Data_ih;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_fpa_deg.SSM = A380PrimComputerFg_B.SSM_e5;
  A380PrimComputerFg_Y.out.bus_outputs.fg.selected_fpa_deg.Data = A380PrimComputerFg_B.Data_du;
  A380PrimComputerFg_Y.out.bus_outputs.fg.runway_hdg_memorized_deg.SSM = A380PrimComputerFg_B.SSM_bf;
  A380PrimComputerFg_Y.out.bus_outputs.fg.runway_hdg_memorized_deg.Data = A380PrimComputerFg_B.Data_nx;
  A380PrimComputerFg_Y.out.bus_outputs.fg.preset_mach_from_fms.SSM = A380PrimComputerFg_B.SSM_fd;
  A380PrimComputerFg_Y.out.bus_outputs.fg.preset_mach_from_fms.Data = A380PrimComputerFg_B.Data_n0;
  A380PrimComputerFg_Y.out.bus_outputs.fg.preset_speed_from_fms_kts.SSM = A380PrimComputerFg_B.SSM_dt;
  A380PrimComputerFg_Y.out.bus_outputs.fg.preset_speed_from_fms_kts.Data = A380PrimComputerFg_B.Data_eqi;
  A380PrimComputerFg_Y.out.bus_outputs.fg.roll_fd_command_1.SSM = A380PrimComputerFg_B.SSM_j5;
  A380PrimComputerFg_Y.out.bus_outputs.fg.roll_fd_command_1.Data = A380PrimComputerFg_B.Data_om;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pitch_fd_command_1.SSM = A380PrimComputerFg_B.SSM_ng;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pitch_fd_command_1.Data = A380PrimComputerFg_B.Data_nr;
  A380PrimComputerFg_Y.out.bus_outputs.fg.yaw_fd_command_1.SSM = A380PrimComputerFg_B.SSM_cs;
  A380PrimComputerFg_Y.out.bus_outputs.fg.yaw_fd_command_1.Data = A380PrimComputerFg_B.Data_p3;
  A380PrimComputerFg_Y.out.bus_outputs.fg.roll_fd_command_2.SSM = A380PrimComputerFg_B.SSM_ls;
  A380PrimComputerFg_Y.out.bus_outputs.fg.roll_fd_command_2.Data = A380PrimComputerFg_B.Data_hd;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pitch_fd_command_2.SSM = A380PrimComputerFg_B.SSM_dg;
  A380PrimComputerFg_Y.out.bus_outputs.fg.pitch_fd_command_2.Data = A380PrimComputerFg_B.Data_al;
  A380PrimComputerFg_Y.out.bus_outputs.fg.yaw_fd_command_2.SSM = A380PrimComputerFg_B.SSM_d3;
  A380PrimComputerFg_Y.out.bus_outputs.fg.yaw_fd_command_2.Data = A380PrimComputerFg_B.Data_gu;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_5.SSM = A380PrimComputerFg_B.SSM_p2;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_5.Data = A380PrimComputerFg_B.Data_ix;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_4.SSM = A380PrimComputerFg_B.SSM_bo0;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_4.Data = A380PrimComputerFg_B.Data_do;
  A380PrimComputerFg_Y.out.bus_outputs.fg.fm_alt_constraint_ft.SSM = A380PrimComputerFg_B.SSM_bc;
  A380PrimComputerFg_Y.out.bus_outputs.fg.fm_alt_constraint_ft.Data = A380PrimComputerFg_B.Data_hu;
  A380PrimComputerFg_Y.out.bus_outputs.fg.ats_discrete_word.SSM = A380PrimComputerFg_B.SSM_giz;
  A380PrimComputerFg_Y.out.bus_outputs.fg.ats_discrete_word.Data = A380PrimComputerFg_B.Data_pm1;
  A380PrimComputerFg_Y.out.bus_outputs.fg.ats_fma_discrete_word.SSM = A380PrimComputerFg_B.SSM_mqp;
  A380PrimComputerFg_Y.out.bus_outputs.fg.ats_fma_discrete_word.Data = A380PrimComputerFg_B.Data_i2y;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_3.SSM = A380PrimComputerFg_B.SSM_ba;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_3.Data = A380PrimComputerFg_B.Data_pg;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_1.SSM = A380PrimComputerFg_B.SSM_in;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_1.Data = A380PrimComputerFg_B.Data_ni;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_2.SSM = A380PrimComputerFg_B.SSM_ff;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_2.Data = A380PrimComputerFg_B.Data_cn;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_6.SSM = A380PrimComputerFg_B.SSM_ic;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_6.Data = A380PrimComputerFg_B.Data_nxl;
  A380PrimComputerFg_Y.out.bus_outputs.fg.low_target_speed_margin_kts.SSM = A380PrimComputerFg_B.SSM_fs;
  A380PrimComputerFg_Y.out.bus_outputs.fg.low_target_speed_margin_kts.Data = A380PrimComputerFg_B.Data_jh;
  A380PrimComputerFg_Y.out.bus_outputs.fg.high_target_speed_margin_kts.SSM = A380PrimComputerFg_B.SSM_ja;
  A380PrimComputerFg_Y.out.bus_outputs.fg.high_target_speed_margin_kts.Data = A380PrimComputerFg_B.Data_gl;
  A380PrimComputerFg_Y.out.bus_outputs.fg.nosewheel_cmd_deg.SSM = A380PrimComputerFg_B.SSM_js;
  A380PrimComputerFg_Y.out.bus_outputs.fg.nosewheel_cmd_deg.Data = A380PrimComputerFg_B.Data_gn;
  A380PrimComputerFg_Y.out.bus_outputs.fg.n1_command_percent.SSM = A380PrimComputerFg_B.SSM_is3;
  A380PrimComputerFg_Y.out.bus_outputs.fg.n1_command_percent.Data = A380PrimComputerFg_B.Data_myb;
  A380PrimComputerFg_Y.out.bus_outputs.fg.flx_to_temp_deg_c.SSM = A380PrimComputerFg_B.SSM_f5;
  A380PrimComputerFg_Y.out.bus_outputs.fg.flx_to_temp_deg_c.Data = A380PrimComputerFg_B.Data_l2;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_7.SSM = A380PrimComputerFg_B.SSM_ph;
  A380PrimComputerFg_Y.out.bus_outputs.fg.discrete_word_7.Data = A380PrimComputerFg_B.Data_o5o;
}

void A380PrimComputerFg::initialize()
{
  A380PrimComputerFg_DWork.Memory_PreviousInput = A380PrimComputerFg_P.SRFlipFlop1_initial_condition;
  A380PrimComputerFg_DWork.Delay_29_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.tcas_active;
  A380PrimComputerFg_DWork.Delay_DSTATE = A380PrimComputerFg_P.Delay_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput_g = A380PrimComputerFg_P.SRFlipFlop_initial_condition;
  A380PrimComputerFg_DWork.Delay_8_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.rwy_loc_submode_active;
  A380PrimComputerFg_DWork.Delay_10_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.land_active;
  A380PrimComputerFg_DWork.Delay_34_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.land_armed;
  A380PrimComputerFg_DWork.Delay_DSTATE_h = A380PrimComputerFg_P.Delay_InitialCondition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_l = A380PrimComputerFg_P.SRFlipFlop_initial_condition_b;
  A380PrimComputerFg_DWork.Delay_66_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.fd_auto_disengage;
  A380PrimComputerFg_DWork.Delay_DSTATE_a = A380PrimComputerFg_P.Delay_InitialCondition_f;
  A380PrimComputerFg_DWork.Delay_2_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.nav_active;
  A380PrimComputerFg_DWork.Delay_3_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.loc_cpt_active;
  A380PrimComputerFg_DWork.Delay_4_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.loc_trk_active;
  A380PrimComputerFg_DWork.Delay_12_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.lateral_modes.rollout_submode_active;
  A380PrimComputerFg_DWork.Delay_13_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.clb_active;
  A380PrimComputerFg_DWork.Delay_14_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.des_active;
  A380PrimComputerFg_DWork.Delay_17_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.pitch_takeoff_active;
  A380PrimComputerFg_DWork.Delay_18_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.pitch_goaround_active;
  A380PrimComputerFg_DWork.Delay_21_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.alt_acq_active;
  A380PrimComputerFg_DWork.Delay_22_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.longitudinal_modes.alt_hold_active;
  A380PrimComputerFg_DWork.Delay_30_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.alt_acq_armed;
  A380PrimComputerFg_DWork.Delay_35_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.glide_armed;
  A380PrimComputerFg_DWork.Delay_36_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.final_des_armed;
  A380PrimComputerFg_DWork.Delay_37_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.clb_armed;
  A380PrimComputerFg_DWork.Delay_38_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.armed_modes.des_armed;
  A380PrimComputerFg_DWork.Delay_42_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.auto_spd_control_active;
  A380PrimComputerFg_DWork.Delay_43_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.manual_spd_control_active;
  A380PrimComputerFg_DWork.Delay_47_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alpha_floor_mode_active;
  A380PrimComputerFg_DWork.Delay_48_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.thrust_mode_active;
  A380PrimComputerFg_DWork.Delay_50_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.speed_mach_mode_active;
  A380PrimComputerFg_DWork.Delay_51_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.retard_mode_active;
  A380PrimComputerFg_DWork.Delay_56_DSTATE =
    A380PrimComputerFg_P.prim_fg_mode_logic_output_MATLABStruct.alt_cstr_applicable;
  A380PrimComputerFg_DWork.Memory_PreviousInput_m = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_k;
  A380PrimComputerFg_DWork.Delay_DSTATE_b = A380PrimComputerFg_P.Delay_InitialCondition_o;
  A380PrimComputerFg_DWork.DelayOneStep_DSTATE = A380PrimComputerFg_P.DelayOneStep_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput_n = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_o;
  A380PrimComputerFg_DWork.Memory_PreviousInput_i = A380PrimComputerFg_P.SRFlipFlop_initial_condition_a;
  A380PrimComputerFg_DWork.Delay_DSTATE_d = A380PrimComputerFg_P.Delay_InitialCondition_h;
  A380PrimComputerFg_DWork.DelayOneStep1_DSTATE = A380PrimComputerFg_P.DelayOneStep1_InitialCondition;
  A380PrimComputerFg_DWork.Memory_PreviousInput_mz = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_j;
  A380PrimComputerFg_DWork.Memory_PreviousInput_o = A380PrimComputerFg_P.SRFlipFlop_initial_condition_o;
  A380PrimComputerFg_DWork.Memory_PreviousInput_l5 = A380PrimComputerFg_P.SRFlipFlop_initial_condition_h;
  A380PrimComputerFg_DWork.Delay_DSTATE_m = A380PrimComputerFg_P.Delay_InitialCondition_i;
  A380PrimComputerFg_DWork.Memory_PreviousInput_io = A380PrimComputerFg_P.SRFlipFlop_initial_condition_c;
  A380PrimComputerFg_DWork.Memory_PreviousInput_iy = A380PrimComputerFg_P.SRFlipFlop_initial_condition_d;
  A380PrimComputerFg_DWork.Delay_DSTATE_j = A380PrimComputerFg_P.Delay_InitialCondition_jm;
  A380PrimComputerFg_DWork.Memory_PreviousInput_h = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_h;
  A380PrimComputerFg_DWork.Memory_PreviousInput_j = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_f;
  A380PrimComputerFg_DWork.Memory_PreviousInput_hs = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_d;
  A380PrimComputerFg_DWork.Memory_PreviousInput_gd = A380PrimComputerFg_P.SRFlipFlop1_initial_condition_c;
  A380PrimComputerFg_B.u = A380PrimComputerFg_P.Y_Y0_h;
  A380PrimComputerFg_B.u_l = A380PrimComputerFg_P.Y_Y0;
  A380PrimComputerFg_B.dt = A380PrimComputerFg_P.out_Y0.data.time.dt;
  A380PrimComputerFg_B.simulation_time = A380PrimComputerFg_P.out_Y0.data.time.simulation_time;
  A380PrimComputerFg_B.monotonic_time = A380PrimComputerFg_P.out_Y0.data.time.monotonic_time;
  A380PrimComputerFg_B.slew_on = A380PrimComputerFg_P.out_Y0.data.sim_data.slew_on;
  A380PrimComputerFg_B.pause_on = A380PrimComputerFg_P.out_Y0.data.sim_data.pause_on;
  A380PrimComputerFg_B.tracking_mode_on_override = A380PrimComputerFg_P.out_Y0.data.sim_data.tracking_mode_on_override;
  A380PrimComputerFg_B.tailstrike_protection_on = A380PrimComputerFg_P.out_Y0.data.sim_data.tailstrike_protection_on;
  A380PrimComputerFg_B.computer_running = A380PrimComputerFg_P.out_Y0.data.sim_data.computer_running;
  A380PrimComputerFg_B.alignment_dummy_h = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.alignment_dummy;
  A380PrimComputerFg_B.prim_overhead_button_pressed =
    A380PrimComputerFg_P.out_Y0.data.discrete_inputs.prim_overhead_button_pressed;
  A380PrimComputerFg_B.is_unit_1 = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.is_unit_1;
  A380PrimComputerFg_B.is_unit_2 = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.is_unit_2;
  A380PrimComputerFg_B.is_unit_3 = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.is_unit_3;
  A380PrimComputerFg_B.capt_priority_takeover_pressed =
    A380PrimComputerFg_P.out_Y0.data.discrete_inputs.capt_priority_takeover_pressed;
  A380PrimComputerFg_B.fo_priority_takeover_pressed =
    A380PrimComputerFg_P.out_Y0.data.discrete_inputs.fo_priority_takeover_pressed;
  A380PrimComputerFg_B.ap_1_pushbutton_pressed =
    A380PrimComputerFg_P.out_Y0.data.discrete_inputs.ap_1_pushbutton_pressed;
  A380PrimComputerFg_B.ap_2_pushbutton_pressed =
    A380PrimComputerFg_P.out_Y0.data.discrete_inputs.ap_2_pushbutton_pressed;
  A380PrimComputerFg_B.fcu_1_healthy = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.fcu_1_healthy;
  A380PrimComputerFg_B.fcu_2_healthy = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.fcu_2_healthy;
  A380PrimComputerFg_B.athr_pushbutton = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.athr_pushbutton;
  A380PrimComputerFg_B.ir_3_on_capt = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.ir_3_on_capt;
  A380PrimComputerFg_B.ir_3_on_fo = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.ir_3_on_fo;
  A380PrimComputerFg_B.adr_3_on_capt = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.adr_3_on_capt;
  A380PrimComputerFg_B.adr_3_on_fo = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.adr_3_on_fo;
  A380PrimComputerFg_B.rat_deployed = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.rat_deployed;
  A380PrimComputerFg_B.rat_contactor_closed = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.rat_contactor_closed;
  A380PrimComputerFg_B.athr_instinctive_disc = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.athr_instinctive_disc;
  A380PrimComputerFg_B.pitch_trim_up_pressed = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.pitch_trim_up_pressed;
  A380PrimComputerFg_B.pitch_trim_down_pressed =
    A380PrimComputerFg_P.out_Y0.data.discrete_inputs.pitch_trim_down_pressed;
  A380PrimComputerFg_B.green_low_pressure = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.green_low_pressure;
  A380PrimComputerFg_B.yellow_low_pressure = A380PrimComputerFg_P.out_Y0.data.discrete_inputs.yellow_low_pressure;
  A380PrimComputerFg_B.capt_pitch_stick_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.capt_pitch_stick_pos;
  A380PrimComputerFg_B.fo_pitch_stick_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.fo_pitch_stick_pos;
  A380PrimComputerFg_B.capt_roll_stick_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.capt_roll_stick_pos;
  A380PrimComputerFg_B.fo_roll_stick_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.fo_roll_stick_pos;
  A380PrimComputerFg_B.speed_brake_lever_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.speed_brake_lever_pos;
  A380PrimComputerFg_B.thr_lever_1_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.thr_lever_1_pos;
  A380PrimComputerFg_B.thr_lever_2_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.thr_lever_2_pos;
  A380PrimComputerFg_B.thr_lever_3_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.thr_lever_3_pos;
  A380PrimComputerFg_B.thr_lever_4_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.thr_lever_4_pos;
  A380PrimComputerFg_B.elevator_1_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.elevator_1_pos_deg;
  A380PrimComputerFg_B.elevator_2_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.elevator_2_pos_deg;
  A380PrimComputerFg_B.elevator_3_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.elevator_3_pos_deg;
  A380PrimComputerFg_B.ths_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.ths_pos_deg;
  A380PrimComputerFg_B.left_aileron_1_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.left_aileron_1_pos_deg;
  A380PrimComputerFg_B.left_aileron_2_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.left_aileron_2_pos_deg;
  A380PrimComputerFg_B.right_aileron_1_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.right_aileron_1_pos_deg;
  A380PrimComputerFg_B.right_aileron_2_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.right_aileron_2_pos_deg;
  A380PrimComputerFg_B.left_spoiler_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.left_spoiler_pos_deg;
  A380PrimComputerFg_B.right_spoiler_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.right_spoiler_pos_deg;
  A380PrimComputerFg_B.rudder_1_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.rudder_1_pos_deg;
  A380PrimComputerFg_B.rudder_2_pos_deg = A380PrimComputerFg_P.out_Y0.data.analog_inputs.rudder_2_pos_deg;
  A380PrimComputerFg_B.rudder_pedal_pos = A380PrimComputerFg_P.out_Y0.data.analog_inputs.rudder_pedal_pos;
  A380PrimComputerFg_B.yellow_hyd_pressure_psi = A380PrimComputerFg_P.out_Y0.data.analog_inputs.yellow_hyd_pressure_psi;
  A380PrimComputerFg_B.green_hyd_pressure_psi = A380PrimComputerFg_P.out_Y0.data.analog_inputs.green_hyd_pressure_psi;
  A380PrimComputerFg_B.vert_acc_1_g = A380PrimComputerFg_P.out_Y0.data.analog_inputs.vert_acc_1_g;
  A380PrimComputerFg_B.vert_acc_2_g = A380PrimComputerFg_P.out_Y0.data.analog_inputs.vert_acc_2_g;
  A380PrimComputerFg_B.vert_acc_3_g = A380PrimComputerFg_P.out_Y0.data.analog_inputs.vert_acc_3_g;
  A380PrimComputerFg_B.lat_acc_1_g = A380PrimComputerFg_P.out_Y0.data.analog_inputs.lat_acc_1_g;
  A380PrimComputerFg_B.lat_acc_2_g = A380PrimComputerFg_P.out_Y0.data.analog_inputs.lat_acc_2_g;
  A380PrimComputerFg_B.lat_acc_3_g = A380PrimComputerFg_P.out_Y0.data.analog_inputs.lat_acc_3_g;
  A380PrimComputerFg_B.left_body_wheel_speed = A380PrimComputerFg_P.out_Y0.data.analog_inputs.left_body_wheel_speed;
  A380PrimComputerFg_B.left_wing_wheel_speed = A380PrimComputerFg_P.out_Y0.data.analog_inputs.left_wing_wheel_speed;
  A380PrimComputerFg_B.right_body_wheel_speed = A380PrimComputerFg_P.out_Y0.data.analog_inputs.right_body_wheel_speed;
  A380PrimComputerFg_B.right_wing_wheel_speed = A380PrimComputerFg_P.out_Y0.data.analog_inputs.right_wing_wheel_speed;
  A380PrimComputerFg_B.SSM_i5w = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
  A380PrimComputerFg_B.Data_hux = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
  A380PrimComputerFg_B.SSM_ebo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft.SSM;
  A380PrimComputerFg_B.Data_iyr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_1_ft.Data;
  A380PrimComputerFg_B.SSM_klm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft.SSM;
  A380PrimComputerFg_B.Data_mcz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_2_ft.Data;
  A380PrimComputerFg_B.SSM_crl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.mach.SSM;
  A380PrimComputerFg_B.Data_g5n = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.mach.Data;
  A380PrimComputerFg_B.SSM_n2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFg_B.Data_dr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
  A380PrimComputerFg_B.SSM_pb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
  A380PrimComputerFg_B.Data_c0z = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
  A380PrimComputerFg_B.SSM_kr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFg_B.Data_li = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFg_B.SSM_f5q = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFg_B.Data_jet = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
  A380PrimComputerFg_B.SSM_cyd =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFg_B.Data_k4 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFg_B.SSM_ai4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
  A380PrimComputerFg_B.Data_ixn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
  A380PrimComputerFg_B.SSM_j2m = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft.SSM;
  A380PrimComputerFg_B.Data_i1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_1_ft.Data;
  A380PrimComputerFg_B.SSM_fc4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft.SSM;
  A380PrimComputerFg_B.Data_ihw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_2_ft.Data;
  A380PrimComputerFg_B.SSM_m4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.mach.SSM;
  A380PrimComputerFg_B.Data_buw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.mach.Data;
  A380PrimComputerFg_B.SSM_dir = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFg_B.Data_ctc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
  A380PrimComputerFg_B.SSM_eib = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
  A380PrimComputerFg_B.Data_cd0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
  A380PrimComputerFg_B.SSM_bqd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFg_B.Data_gw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFg_B.SSM_dby = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFg_B.Data_pr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
  A380PrimComputerFg_B.SSM_kxxt =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFg_B.SSM_kxxtac0ztgf2uxn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
  A380PrimComputerFg_B.Data_d = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
  A380PrimComputerFg_B.SSM_n = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft.SSM;
  A380PrimComputerFg_B.Data_joy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_1_ft.Data;
  A380PrimComputerFg_B.SSM_cb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft.SSM;
  A380PrimComputerFg_B.Data_p1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_2_ft.Data;
  A380PrimComputerFg_B.SSM_nn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.mach.SSM;
  A380PrimComputerFg_B.Data_mk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.mach.Data;
  A380PrimComputerFg_B.SSM_m0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFg_B.Data_lyw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
  A380PrimComputerFg_B.SSM_kd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
  A380PrimComputerFg_B.Data_gq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
  A380PrimComputerFg_B.SSM_pu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFg_B.Data_n = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFg_B.SSM_nv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFg_B.Data_bq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
  A380PrimComputerFg_B.SSM_d5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFg_B.Data_dmn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFg_B.SSM_eo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_jn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_nd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
  A380PrimComputerFg_B.Data_c = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.Data;
  A380PrimComputerFg_B.SSM_bq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
  A380PrimComputerFg_B.Data_lx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.Data;
  A380PrimComputerFg_B.SSM_hi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
  A380PrimComputerFg_B.Data_jb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
  A380PrimComputerFg_B.SSM_mm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
  A380PrimComputerFg_B.Data_fn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
  A380PrimComputerFg_B.SSM_kz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
  A380PrimComputerFg_B.Data_od = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
  A380PrimComputerFg_B.SSM_il = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
  A380PrimComputerFg_B.Data_pw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
  A380PrimComputerFg_B.SSM_ah = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFg_B.Data_m2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
  A380PrimComputerFg_B.SSM_en = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFg_B.Data_ek = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFg_B.SSM_dq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFg_B.Data_iy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
  A380PrimComputerFg_B.SSM_px = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
  A380PrimComputerFg_B.Data_lk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
  A380PrimComputerFg_B.SSM_lbo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFg_B.Data_ca = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
  A380PrimComputerFg_B.SSM_p5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
  A380PrimComputerFg_B.Data_pix = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
  A380PrimComputerFg_B.SSM_mk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
  A380PrimComputerFg_B.Data_di = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  A380PrimComputerFg_B.SSM_mu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
  A380PrimComputerFg_B.Data_lz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  A380PrimComputerFg_B.SSM_cbl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_mo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_jh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_lg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_og = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_og = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_d4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
  A380PrimComputerFg_B.Data_fj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
  A380PrimComputerFg_B.SSM_ds = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
  A380PrimComputerFg_B.Data_my = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
  A380PrimComputerFg_B.SSM_lm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
  A380PrimComputerFg_B.Data_ox = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  A380PrimComputerFg_B.SSM_cx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_f5h = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_cgz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_gk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_fv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_nb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_h0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
  A380PrimComputerFg_B.Data_fr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
  A380PrimComputerFg_B.SSM_ag = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFg_B.Data_l5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFg_B.SSM_jw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFg_B.Data_dc2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFg_B.SSM_jy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
  A380PrimComputerFg_B.Data_gr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
  A380PrimComputerFg_B.SSM_j1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFg_B.Data_gp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFg_B.SSM_ov = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFg_B.Data_i3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
  A380PrimComputerFg_B.SSM_mx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFg_B.Data_et = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
  A380PrimComputerFg_B.SSM_b4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_mc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_gb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
  A380PrimComputerFg_B.Data_k3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.Data;
  A380PrimComputerFg_B.SSM_oh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
  A380PrimComputerFg_B.Data_f2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.Data;
  A380PrimComputerFg_B.SSM_mm5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
  A380PrimComputerFg_B.Data_gh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
  A380PrimComputerFg_B.SSM_br = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
  A380PrimComputerFg_B.Data_ed = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
  A380PrimComputerFg_B.SSM_c2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
  A380PrimComputerFg_B.Data_o2j = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
  A380PrimComputerFg_B.SSM_hc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
  A380PrimComputerFg_B.Data_i43 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
  A380PrimComputerFg_B.SSM_ktr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFg_B.Data_ic = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
  A380PrimComputerFg_B.SSM_gl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFg_B.Data_ak = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFg_B.SSM_my = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFg_B.Data_jg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
  A380PrimComputerFg_B.SSM_j3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
  A380PrimComputerFg_B.Data_cu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
  A380PrimComputerFg_B.SSM_go = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFg_B.Data_ep = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
  A380PrimComputerFg_B.SSM_e5c = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
  A380PrimComputerFg_B.Data_d3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
  A380PrimComputerFg_B.SSM_dk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
  A380PrimComputerFg_B.Data_bt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
  A380PrimComputerFg_B.SSM_evc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
  A380PrimComputerFg_B.Data_e0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
  A380PrimComputerFg_B.SSM_kk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_jl3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_af = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_nm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_npr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_ia = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_ew = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
  A380PrimComputerFg_B.Data_j0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
  A380PrimComputerFg_B.SSM_lt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
  A380PrimComputerFg_B.Data_bs = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
  A380PrimComputerFg_B.SSM_ger = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
  A380PrimComputerFg_B.Data_hp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
  A380PrimComputerFg_B.SSM_pxo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_ct = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_co2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_pc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_ny = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_nzt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_l4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
  A380PrimComputerFg_B.Data_c0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
  A380PrimComputerFg_B.SSM_nm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFg_B.Data_ojg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFg_B.SSM_nh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFg_B.Data_lm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFg_B.SSM_dl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
  A380PrimComputerFg_B.Data_fz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
  A380PrimComputerFg_B.SSM_dx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFg_B.Data_oz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFg_B.SSM_a5h = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFg_B.Data_gf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
  A380PrimComputerFg_B.SSM_fl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFg_B.Data_nn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
  A380PrimComputerFg_B.SSM_p3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_a0z = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_ns = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
  A380PrimComputerFg_B.Data_fk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.Data;
  A380PrimComputerFg_B.SSM_bm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
  A380PrimComputerFg_B.Data_bu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.Data;
  A380PrimComputerFg_B.SSM_nl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
  A380PrimComputerFg_B.Data_o23 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
  A380PrimComputerFg_B.SSM_grm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
  A380PrimComputerFg_B.Data_g3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
  A380PrimComputerFg_B.SSM_gzm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
  A380PrimComputerFg_B.Data_icc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
  A380PrimComputerFg_B.SSM_oi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
  A380PrimComputerFg_B.Data_pwf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
  A380PrimComputerFg_B.SSM_aa = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFg_B.Data_gvk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
  A380PrimComputerFg_B.SSM_fvk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFg_B.Data_ln = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFg_B.SSM_lw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFg_B.Data_ka = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
  A380PrimComputerFg_B.SSM_fa = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
  A380PrimComputerFg_B.Data_mp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
  A380PrimComputerFg_B.SSM_lbx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFg_B.Data_m4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
  A380PrimComputerFg_B.SSM_n3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
  A380PrimComputerFg_B.Data_fki = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
  A380PrimComputerFg_B.SSM_a1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
  A380PrimComputerFg_B.Data_bv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
  A380PrimComputerFg_B.SSM_p1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
  A380PrimComputerFg_B.Data_m21 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
  A380PrimComputerFg_B.SSM_cn2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_nbg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_an3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_l25 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_c3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_ki = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_dp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
  A380PrimComputerFg_B.Data_p5p = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
  A380PrimComputerFg_B.SSM_boy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
  A380PrimComputerFg_B.Data_nry = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
  A380PrimComputerFg_B.SSM_lg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
  A380PrimComputerFg_B.Data_mh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
  A380PrimComputerFg_B.SSM_cm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_ll = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_hl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_hy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_irh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFg_B.Data_j04 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFg_B.SSM_b42 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
  A380PrimComputerFg_B.Data_pf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
  A380PrimComputerFg_B.SSM_anz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFg_B.Data_pl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFg_B.SSM_d2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFg_B.Data_gb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFg_B.SSM_gov = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
  A380PrimComputerFg_B.Data_hq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
  A380PrimComputerFg_B.SSM_nb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFg_B.Data_ai = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFg_B.SSM_pe3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFg_B.Data_gfr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
  A380PrimComputerFg_B.SSM_jj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFg_B.Data_czp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
  A380PrimComputerFg_B.isis_1_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.isis_1_bus;
  A380PrimComputerFg_B.isis_2_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.isis_2_bus;
  A380PrimComputerFg_B.rate_gyro_pitch_1_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.rate_gyro_pitch_1_bus;
  A380PrimComputerFg_B.rate_gyro_pitch_2_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.rate_gyro_pitch_2_bus;
  A380PrimComputerFg_B.rate_gyro_roll_1_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.rate_gyro_roll_1_bus;
  A380PrimComputerFg_B.rate_gyro_roll_2_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.rate_gyro_roll_2_bus;
  A380PrimComputerFg_B.rate_gyro_yaw_1_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.rate_gyro_yaw_1_bus;
  A380PrimComputerFg_B.rate_gyro_yaw_2_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.rate_gyro_yaw_2_bus;
  A380PrimComputerFg_B.SSM_jx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
  A380PrimComputerFg_B.Data_fm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
  A380PrimComputerFg_B.SSM_npl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
  A380PrimComputerFg_B.Data_jsg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
  A380PrimComputerFg_B.SSM_gf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.runway_heading_deg.SSM;
  A380PrimComputerFg_B.Data_g1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.runway_heading_deg.Data;
  A380PrimComputerFg_B.SSM_gbi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.ils_frequency_mhz.SSM;
  A380PrimComputerFg_B.Data_j4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.ils_frequency_mhz.Data;
  A380PrimComputerFg_B.SSM_fhm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.localizer_deviation_deg.SSM;
  A380PrimComputerFg_B.Data_jyh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.localizer_deviation_deg.Data;
  A380PrimComputerFg_B.SSM_ltj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.SSM;
  A380PrimComputerFg_B.Data_e4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_1_bus.glideslope_deviation_deg.Data;
  A380PrimComputerFg_B.SSM_hn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.runway_heading_deg.SSM;
  A380PrimComputerFg_B.Data_ghs = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.runway_heading_deg.Data;
  A380PrimComputerFg_B.SSM_h3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.ils_frequency_mhz.SSM;
  A380PrimComputerFg_B.Data_bmk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.ils_frequency_mhz.Data;
  A380PrimComputerFg_B.SSM_bfs = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.localizer_deviation_deg.SSM;
  A380PrimComputerFg_B.Data_lzt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.localizer_deviation_deg.Data;
  A380PrimComputerFg_B.SSM_p0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.SSM;
  A380PrimComputerFg_B.Data_kn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.ils_2_bus.glideslope_deviation_deg.Data;
  A380PrimComputerFg_B.SSM_fu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
  A380PrimComputerFg_B.Data_nab =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
  A380PrimComputerFg_B.SSM_hr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
  A380PrimComputerFg_B.Data_lgf =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
  A380PrimComputerFg_B.SSM_bi =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputerFg_B.Data_fpq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
  A380PrimComputerFg_B.SSM_bd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
  A380PrimComputerFg_B.Data_dt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
  A380PrimComputerFg_B.SSM_omt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
  A380PrimComputerFg_B.Data_b1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
  A380PrimComputerFg_B.SSM_la =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
  A380PrimComputerFg_B.Data_nmr =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
  A380PrimComputerFg_B.SSM_l1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
  A380PrimComputerFg_B.Data_ea =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
  A380PrimComputerFg_B.SSM_dy =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputerFg_B.Data_nib =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
  A380PrimComputerFg_B.SSM_ie = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
  A380PrimComputerFg_B.Data_i2t = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
  A380PrimComputerFg_B.SSM_kf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
  A380PrimComputerFg_B.Data_ng = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
  A380PrimComputerFg_B.SSM_p5l = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_h31 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_g3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_ew = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_b3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
  A380PrimComputerFg_B.Data_j1s = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
  A380PrimComputerFg_B.SSM_dxv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
  A380PrimComputerFg_B.Data_j5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
  A380PrimComputerFg_B.SSM_mxz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_cw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_kk4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_gqa = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_cy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
  A380PrimComputerFg_B.Data_hz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
  A380PrimComputerFg_B.SSM_ju = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
  A380PrimComputerFg_B.Data_fri = A380PrimComputerFg_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
  A380PrimComputerFg_B.irdc_1_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.irdc_1_bus;
  A380PrimComputerFg_B.irdc_2_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.irdc_2_bus;
  A380PrimComputerFg_B.irdc_3_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.irdc_3_bus;
  A380PrimComputerFg_B.irdc_4_a_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.irdc_4_a_bus;
  A380PrimComputerFg_B.irdc_4_b_bus = A380PrimComputerFg_P.out_Y0.data.bus_inputs.irdc_4_b_bus;
  A380PrimComputerFg_B.SSM_ey = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.efis_discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_cm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.efis_discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_jr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.efis_discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_czj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.efis_discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_hs = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.baro_setting_hpa.SSM;
  A380PrimComputerFg_B.Data_mb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.baro_setting_hpa.Data;
  A380PrimComputerFg_B.SSM_mx3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.baro_setting_inhg.SSM;
  A380PrimComputerFg_B.Data_gk4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.baro_setting_inhg.Data;
  A380PrimComputerFg_B.SSM_er = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_gbt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.afs_discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_hm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_p0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_1_bus.afs_discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_dm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.efis_discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_dn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.efis_discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_fk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.efis_discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_iyw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.efis_discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_lm1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.baro_setting_hpa.SSM;
  A380PrimComputerFg_B.Data_p5d = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.baro_setting_hpa.Data;
  A380PrimComputerFg_B.SSM_nc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.baro_setting_inhg.SSM;
  A380PrimComputerFg_B.Data_oo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.baro_setting_inhg.Data;
  A380PrimComputerFg_B.SSM_e4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_ho = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.afs_discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_bw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_kqr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.fcu_2_bus.afs_discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_na =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_omv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_lf =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_mby =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_oz =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_hk =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_mub =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_hg =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_li =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_bi =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_hcd =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_i4u =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_php =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFg_B.Data_ik =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.Data;
  A380PrimComputerFg_B.SSM_ma =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFg_B.Data_dq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.Data;
  A380PrimComputerFg_B.SSM_jut =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFg_B.Data_pv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.Data;
  A380PrimComputerFg_B.SSM_kh =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFg_B.Data_p1d =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.Data;
  A380PrimComputerFg_B.SSM_h2 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFg_B.Data_lyv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.Data;
  A380PrimComputerFg_B.SSM_ago =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFg_B.Data_ke =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.Data;
  A380PrimComputerFg_B.SSM_ep =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFg_B.Data_cv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.Data;
  A380PrimComputerFg_B.SSM_kc =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFg_B.Data_pfh =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.Data;
  A380PrimComputerFg_B.SSM_cnf =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFg_B.Data_jy4 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.Data;
  A380PrimComputerFg_B.SSM_lwa =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFg_B.Data_o1 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.Data;
  A380PrimComputerFg_B.SSM_aq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFg_B.Data_ga =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.Data;
  A380PrimComputerFg_B.SSM_ja2 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFg_B.Data_kd =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.Data;
  A380PrimComputerFg_B.SSM_in3 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFg_B.Data_fx =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.Data;
  A380PrimComputerFg_B.SSM_ap =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFg_B.Data_nml =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.Data;
  A380PrimComputerFg_B.SSM_mg =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFg_B.Data_fa =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.Data;
  A380PrimComputerFg_B.SSM_mw =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFg_B.Data_nh =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.Data;
  A380PrimComputerFg_B.SSM_bu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_or =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_cbb =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_otn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_iao =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_cam =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_ip =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_gsl =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_f4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.SSM;
  A380PrimComputerFg_B.Data_amp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.Data;
  A380PrimComputerFg_B.SSM_id = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.SSM;
  A380PrimComputerFg_B.Data_mv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.Data;
  A380PrimComputerFg_B.SSM_mqr =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.SSM;
  A380PrimComputerFg_B.Data_gx =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.Data;
  A380PrimComputerFg_B.SSM_cm2 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_lb =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_ck =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_can =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_pl =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_gae =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_d50 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_h1 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_gs =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.SSM;
  A380PrimComputerFg_B.Data_bc =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_pedal_position_deg.Data;
  A380PrimComputerFg_B.SSM_kse = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.SSM;
  A380PrimComputerFg_B.Data_fof = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.aileron_status_word.Data;
  A380PrimComputerFg_B.SSM_icj =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_nj =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_ds4 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_i0 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_gbf =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_lr =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_opv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_k0s =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_gha = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.SSM;
  A380PrimComputerFg_B.Data_m4b = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word.Data;
  A380PrimComputerFg_B.SSM_ple =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.SSM;
  A380PrimComputerFg_B.Data_e3r =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data;
  A380PrimComputerFg_B.SSM_h0n =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.SSM;
  A380PrimComputerFg_B.Data_au =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data;
  A380PrimComputerFg_B.SSM_c1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.SSM;
  A380PrimComputerFg_B.Data_czc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_status_word.Data;
  A380PrimComputerFg_B.SSM_dd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_itz =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_ai = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_nsk =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_at = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.SSM;
  A380PrimComputerFg_B.Data_is =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data;
  A380PrimComputerFg_B.SSM_bz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.SSM;
  A380PrimComputerFg_B.Data_pk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.Data;
  A380PrimComputerFg_B.SSM_n0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.SSM;
  A380PrimComputerFg_B.Data_f52 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_status_word.Data;
  A380PrimComputerFg_B.SSM_haz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_dg0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_hz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_nru = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_hk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.SSM;
  A380PrimComputerFg_B.Data_d5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_1_ft.Data;
  A380PrimComputerFg_B.SSM_cvn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.SSM;
  A380PrimComputerFg_B.Data_oa = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.radio_height_2_ft.Data;
  A380PrimComputerFg_B.SSM_iy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.SSM;
  A380PrimComputerFg_B.Data_bp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word.Data;
  A380PrimComputerFg_B.SSM_jwz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.SSM;
  A380PrimComputerFg_B.Data_cl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1.Data;
  A380PrimComputerFg_B.SSM_o2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.SSM;
  A380PrimComputerFg_B.Data_er = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_lim_kn.Data;
  A380PrimComputerFg_B.SSM_eig = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.SSM;
  A380PrimComputerFg_B.Data_in = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_prot_kn.Data;
  A380PrimComputerFg_B.SSM_jl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.SSM;
  A380PrimComputerFg_B.Data_btl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fctl.v_alpha_stall_warn_kn.Data;
  A380PrimComputerFg_B.SSM_cci = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.SSM;
  A380PrimComputerFg_B.Data_a5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_a_deg.Data;
  A380PrimComputerFg_B.SSM_ow = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.SSM;
  A380PrimComputerFg_B.Data_hyo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.gamma_t_deg.Data;
  A380PrimComputerFg_B.SSM_bcj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.SSM;
  A380PrimComputerFg_B.Data_bjx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.sideslip_target_deg.Data;
  A380PrimComputerFg_B.SSM_i5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_ls_kn.SSM;
  A380PrimComputerFg_B.Data_ci = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_ls_kn.Data;
  A380PrimComputerFg_B.SSM_jww = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_stall_kn.SSM;
  A380PrimComputerFg_B.Data_h2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_stall_kn.Data;
  A380PrimComputerFg_B.SSM_kkj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.SSM;
  A380PrimComputerFg_B.Data_ce = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.speed_trend_kn.Data;
  A380PrimComputerFg_B.SSM_ndh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_3_kn.SSM;
  A380PrimComputerFg_B.Data_dx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_3_kn.Data;
  A380PrimComputerFg_B.SSM_k1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_4_kn.SSM;
  A380PrimComputerFg_B.Data_fvi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_4_kn.Data;
  A380PrimComputerFg_B.SSM_en3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_man_kn.SSM;
  A380PrimComputerFg_B.Data_gnm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_man_kn.Data;
  A380PrimComputerFg_B.SSM_kl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_max_kn.SSM;
  A380PrimComputerFg_B.Data_e3y = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_max_kn.Data;
  A380PrimComputerFg_B.SSM_po = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.SSM;
  A380PrimComputerFg_B.Data_ld = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.v_fe_next_kn.Data;
  A380PrimComputerFg_B.SSM_ie0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_k3v = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fe.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_ay = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pfd_spd_tgt_kts.SSM;
  A380PrimComputerFg_B.Data_oi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pfd_spd_tgt_kts.Data;
  A380PrimComputerFg_B.SSM_gsb =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pfd_short_term_mngd_spd_kts.SSM;
  A380PrimComputerFg_B.Data_oy =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pfd_short_term_mngd_spd_kts.Data;
  A380PrimComputerFg_B.SSM_mxy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_spd_kts.SSM;
  A380PrimComputerFg_B.Data_nl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_spd_kts.Data;
  A380PrimComputerFg_B.SSM_gt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_mach_kts.SSM;
  A380PrimComputerFg_B.Data_aei = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_mach_kts.Data;
  A380PrimComputerFg_B.SSM_cum = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_hdg_deg.SSM;
  A380PrimComputerFg_B.Data_jz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_hdg_deg.Data;
  A380PrimComputerFg_B.SSM_ka = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_trk_deg.SSM;
  A380PrimComputerFg_B.Data_pwfb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_trk_deg.Data;
  A380PrimComputerFg_B.SSM_lu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_alt_ft.SSM;
  A380PrimComputerFg_B.Data_la = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_alt_ft.Data;
  A380PrimComputerFg_B.SSM_c5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_vs_ft_min.SSM;
  A380PrimComputerFg_B.Data_b0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_vs_ft_min.Data;
  A380PrimComputerFg_B.SSM_ol = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_fpa_deg.SSM;
  A380PrimComputerFg_B.Data_g5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.selected_fpa_deg.Data;
  A380PrimComputerFg_B.SSM_k2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.runway_hdg_memorized_deg.SSM;
  A380PrimComputerFg_B.Data_os = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.runway_hdg_memorized_deg.Data;
  A380PrimComputerFg_B.SSM_gn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.preset_mach_from_fms.SSM;
  A380PrimComputerFg_B.Data_btc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.preset_mach_from_fms.Data;
  A380PrimComputerFg_B.SSM_bdi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.preset_speed_from_fms_kts.SSM;
  A380PrimComputerFg_B.Data_nhn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.preset_speed_from_fms_kts.Data;
  A380PrimComputerFg_B.SSM_lil = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.roll_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_im = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.roll_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_lmv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_no = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_ig = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_av = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_ch = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.roll_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_me = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.roll_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_ef = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_hc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.pitch_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_dbs = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_f5c = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.yaw_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_ilr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_5.SSM;
  A380PrimComputerFg_B.Data_iu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_5.Data;
  A380PrimComputerFg_B.SSM_ch3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_4.SSM;
  A380PrimComputerFg_B.Data_ihf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_4.Data;
  A380PrimComputerFg_B.SSM_ozd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.fm_alt_constraint_ft.SSM;
  A380PrimComputerFg_B.Data_ao = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.fm_alt_constraint_ft.Data;
  A380PrimComputerFg_B.SSM_ob = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.ats_discrete_word.SSM;
  A380PrimComputerFg_B.Data_c2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.ats_discrete_word.Data;
  A380PrimComputerFg_B.SSM_dd4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.ats_fma_discrete_word.SSM;
  A380PrimComputerFg_B.Data_f1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.ats_fma_discrete_word.Data;
  A380PrimComputerFg_B.SSM_ps = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_3.SSM;
  A380PrimComputerFg_B.Data_nst = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_3.Data;
  A380PrimComputerFg_B.SSM_agc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_fq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_nt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_amc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_oa = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_6.SSM;
  A380PrimComputerFg_B.Data_nn1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_6.Data;
  A380PrimComputerFg_B.SSM_oj =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.low_target_speed_margin_kts.SSM;
  A380PrimComputerFg_B.Data_b0d =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.low_target_speed_margin_kts.Data;
  A380PrimComputerFg_B.SSM_lq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.high_target_speed_margin_kts.SSM;
  A380PrimComputerFg_B.Data_bri =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.high_target_speed_margin_kts.Data;
  A380PrimComputerFg_B.SSM_fc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.nosewheel_cmd_deg.SSM;
  A380PrimComputerFg_B.Data_nmx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.nosewheel_cmd_deg.Data;
  A380PrimComputerFg_B.SSM_do = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.n1_command_percent.SSM;
  A380PrimComputerFg_B.Data_oal = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.n1_command_percent.Data;
  A380PrimComputerFg_B.SSM_eu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.flx_to_temp_deg_c.SSM;
  A380PrimComputerFg_B.Data_dmb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.flx_to_temp_deg_c.Data;
  A380PrimComputerFg_B.SSM_pjf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_7.SSM;
  A380PrimComputerFg_B.Data_nf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_x_bus.fg.discrete_word_7.Data;
  A380PrimComputerFg_B.SSM_gu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_anh =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_jsu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_idf =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_eb =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_gm =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_dbu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_jqv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_hh =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_ni3 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_jsuo =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_d1 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_dj =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFg_B.Data_dv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.Data;
  A380PrimComputerFg_B.SSM_oio =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFg_B.Data_oq4 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.Data;
  A380PrimComputerFg_B.SSM_ewd =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFg_B.Data_fb =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.Data;
  A380PrimComputerFg_B.SSM_pjk =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFg_B.Data_bsv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.Data;
  A380PrimComputerFg_B.SSM_j3l =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFg_B.Data_nt =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.Data;
  A380PrimComputerFg_B.SSM_ceq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFg_B.Data_ac =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.Data;
  A380PrimComputerFg_B.SSM_d4h =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFg_B.Data_dcn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.Data;
  A380PrimComputerFg_B.SSM_dc =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFg_B.Data_joe =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.Data;
  A380PrimComputerFg_B.SSM_obg =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFg_B.Data_nol =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.Data;
  A380PrimComputerFg_B.SSM_b5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFg_B.Data_bun =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.Data;
  A380PrimComputerFg_B.SSM_al =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFg_B.Data_ge =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.Data;
  A380PrimComputerFg_B.SSM_hib =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFg_B.Data_mj =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.Data;
  A380PrimComputerFg_B.SSM_dbe =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFg_B.Data_naq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.Data;
  A380PrimComputerFg_B.SSM_b1 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFg_B.Data_j43 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.Data;
  A380PrimComputerFg_B.SSM_d0 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFg_B.Data_po =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.Data;
  A380PrimComputerFg_B.SSM_m5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFg_B.Data_ey =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.Data;
  A380PrimComputerFg_B.SSM_jli =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_a3 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_mxc =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_pey =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_ogm =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_kf =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_nlt =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_hk1 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_dz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.SSM;
  A380PrimComputerFg_B.Data_grt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.Data;
  A380PrimComputerFg_B.SSM_oiy =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.SSM;
  A380PrimComputerFg_B.Data_cmi =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.Data;
  A380PrimComputerFg_B.SSM_jsb =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.SSM;
  A380PrimComputerFg_B.Data_eyi =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.Data;
  A380PrimComputerFg_B.SSM_my5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_jr =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_lp =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_hom =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_hlu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_je =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_hu3 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_k5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_d5s =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.SSM;
  A380PrimComputerFg_B.Data_ima =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_pedal_position_deg.Data;
  A380PrimComputerFg_B.SSM_n4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.SSM;
  A380PrimComputerFg_B.Data_c4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.aileron_status_word.Data;
  A380PrimComputerFg_B.SSM_gg =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_bk =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_kkj5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_fb4 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_cr =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_jf =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_nx =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_mz =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_po3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.SSM;
  A380PrimComputerFg_B.Data_p3h = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word.Data;
  A380PrimComputerFg_B.SSM_o0 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.SSM;
  A380PrimComputerFg_B.Data_kv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data;
  A380PrimComputerFg_B.SSM_mt =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.SSM;
  A380PrimComputerFg_B.Data_bv1 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data;
  A380PrimComputerFg_B.SSM_o5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.SSM;
  A380PrimComputerFg_B.Data_g4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_status_word.Data;
  A380PrimComputerFg_B.SSM_mkz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_otv =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_dqh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_kqu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_ki = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.SSM;
  A380PrimComputerFg_B.Data_n4p =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.elevator_3_position_deg.Data;
  A380PrimComputerFg_B.SSM_ez = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.SSM;
  A380PrimComputerFg_B.Data_n3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.Data;
  A380PrimComputerFg_B.SSM_k4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.SSM;
  A380PrimComputerFg_B.Data_ma = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_status_word.Data;
  A380PrimComputerFg_B.SSM_ac = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_gsd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_iz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ij = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.rudder_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_b4c = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.SSM;
  A380PrimComputerFg_B.Data_ogy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_1_ft.Data;
  A380PrimComputerFg_B.SSM_gn1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.SSM;
  A380PrimComputerFg_B.Data_hc3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.radio_height_2_ft.Data;
  A380PrimComputerFg_B.SSM_p0z = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.SSM;
  A380PrimComputerFg_B.Data_m5 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word.Data;
  A380PrimComputerFg_B.SSM_iet = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.SSM;
  A380PrimComputerFg_B.Data_cxq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1.Data;
  A380PrimComputerFg_B.SSM_omi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.SSM;
  A380PrimComputerFg_B.Data_oat = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_lim_kn.Data;
  A380PrimComputerFg_B.SSM_bdv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.SSM;
  A380PrimComputerFg_B.Data_f4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_prot_kn.Data;
  A380PrimComputerFg_B.SSM_hhc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.SSM;
  A380PrimComputerFg_B.Data_itt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fctl.v_alpha_stall_warn_kn.Data;
  A380PrimComputerFg_B.SSM_apw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.SSM;
  A380PrimComputerFg_B.Data_hr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_a_deg.Data;
  A380PrimComputerFg_B.SSM_e2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.SSM;
  A380PrimComputerFg_B.Data_cta = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.gamma_t_deg.Data;
  A380PrimComputerFg_B.SSM_goz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.SSM;
  A380PrimComputerFg_B.Data_kn3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.sideslip_target_deg.Data;
  A380PrimComputerFg_B.SSM_mku = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_ls_kn.SSM;
  A380PrimComputerFg_B.Data_aj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_ls_kn.Data;
  A380PrimComputerFg_B.SSM_k24 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_stall_kn.SSM;
  A380PrimComputerFg_B.Data_ml = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_stall_kn.Data;
  A380PrimComputerFg_B.SSM_l2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.SSM;
  A380PrimComputerFg_B.Data_l55 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.speed_trend_kn.Data;
  A380PrimComputerFg_B.SSM_lfy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_3_kn.SSM;
  A380PrimComputerFg_B.Data_hi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_3_kn.Data;
  A380PrimComputerFg_B.SSM_aj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_4_kn.SSM;
  A380PrimComputerFg_B.Data_ad = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_4_kn.Data;
  A380PrimComputerFg_B.SSM_he = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_man_kn.SSM;
  A380PrimComputerFg_B.Data_lyc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_man_kn.Data;
  A380PrimComputerFg_B.SSM_hkw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_max_kn.SSM;
  A380PrimComputerFg_B.Data_kw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_max_kn.Data;
  A380PrimComputerFg_B.SSM_m2q = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.SSM;
  A380PrimComputerFg_B.Data_oue = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.v_fe_next_kn.Data;
  A380PrimComputerFg_B.SSM_bg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_njd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fe.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_nq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pfd_spd_tgt_kts.SSM;
  A380PrimComputerFg_B.Data_n1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pfd_spd_tgt_kts.Data;
  A380PrimComputerFg_B.SSM_hng =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pfd_short_term_mngd_spd_kts.SSM;
  A380PrimComputerFg_B.Data_ihk =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pfd_short_term_mngd_spd_kts.Data;
  A380PrimComputerFg_B.SSM_pd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_spd_kts.SSM;
  A380PrimComputerFg_B.Data_hiq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_spd_kts.Data;
  A380PrimComputerFg_B.SSM_or = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_mach_kts.SSM;
  A380PrimComputerFg_B.Data_lb2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_mach_kts.Data;
  A380PrimComputerFg_B.SSM_ao = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_hdg_deg.SSM;
  A380PrimComputerFg_B.Data_l5t = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_hdg_deg.Data;
  A380PrimComputerFg_B.SSM_e4y = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_trk_deg.SSM;
  A380PrimComputerFg_B.Data_p5q = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_trk_deg.Data;
  A380PrimComputerFg_B.SSM_lk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_alt_ft.SSM;
  A380PrimComputerFg_B.Data_by = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_alt_ft.Data;
  A380PrimComputerFg_B.SSM_cmh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_vs_ft_min.SSM;
  A380PrimComputerFg_B.Data_fz4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_vs_ft_min.Data;
  A380PrimComputerFg_B.SSM_fb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_fpa_deg.SSM;
  A380PrimComputerFg_B.Data_bf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.selected_fpa_deg.Data;
  A380PrimComputerFg_B.SSM_jwb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.runway_hdg_memorized_deg.SSM;
  A380PrimComputerFg_B.Data_o3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.runway_hdg_memorized_deg.Data;
  A380PrimComputerFg_B.SSM_lqf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.preset_mach_from_fms.SSM;
  A380PrimComputerFg_B.Data_b0i = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.preset_mach_from_fms.Data;
  A380PrimComputerFg_B.SSM_f4j = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.preset_speed_from_fms_kts.SSM;
  A380PrimComputerFg_B.Data_ki2 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.preset_speed_from_fms_kts.Data;
  A380PrimComputerFg_B.SSM_a0z = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.roll_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_adu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.roll_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_hj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_h4h = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_nrk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_dod = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_bl = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.roll_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_fqj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.roll_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_gx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_hgw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.pitch_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_i3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_dko = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.yaw_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_nx2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_5.SSM;
  A380PrimComputerFg_B.Data_iga = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_5.Data;
  A380PrimComputerFg_B.SSM_jm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_4.SSM;
  A380PrimComputerFg_B.Data_hds = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_4.Data;
  A380PrimComputerFg_B.SSM_khm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.fm_alt_constraint_ft.SSM;
  A380PrimComputerFg_B.Data_dqt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.fm_alt_constraint_ft.Data;
  A380PrimComputerFg_B.SSM_m1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.ats_discrete_word.SSM;
  A380PrimComputerFg_B.Data_pd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.ats_discrete_word.Data;
  A380PrimComputerFg_B.SSM_ek = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.ats_fma_discrete_word.SSM;
  A380PrimComputerFg_B.Data_i0g = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.ats_fma_discrete_word.Data;
  A380PrimComputerFg_B.SSM_g1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_3.SSM;
  A380PrimComputerFg_B.Data_jzm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_3.Data;
  A380PrimComputerFg_B.SSM_c4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_bs3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_kj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_ko = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_fn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_6.SSM;
  A380PrimComputerFg_B.Data_nq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_6.Data;
  A380PrimComputerFg_B.SSM_jb =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.low_target_speed_margin_kts.SSM;
  A380PrimComputerFg_B.Data_ita =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.low_target_speed_margin_kts.Data;
  A380PrimComputerFg_B.SSM_ku =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.high_target_speed_margin_kts.SSM;
  A380PrimComputerFg_B.Data_pn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.high_target_speed_margin_kts.Data;
  A380PrimComputerFg_B.SSM_irk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.nosewheel_cmd_deg.SSM;
  A380PrimComputerFg_B.Data_lgm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.nosewheel_cmd_deg.Data;
  A380PrimComputerFg_B.SSM_nca = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.n1_command_percent.SSM;
  A380PrimComputerFg_B.Data_ir = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.n1_command_percent.Data;
  A380PrimComputerFg_B.SSM_im = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.flx_to_temp_deg_c.SSM;
  A380PrimComputerFg_B.Data_jv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.flx_to_temp_deg_c.Data;
  A380PrimComputerFg_B.SSM_j2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_7.SSM;
  A380PrimComputerFg_B.Data_ore = A380PrimComputerFg_P.out_Y0.data.bus_inputs.prim_y_bus.fg.discrete_word_7.Data;
  A380PrimComputerFg_B.SSM_ba5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_ijm =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_p4l =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_jo0 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_l25 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_bn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_e4o =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_izj =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_d1a = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFg_B.Data_pdd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFg_B.SSM_bol = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.aileron_status_word.SSM;
  A380PrimComputerFg_B.Data_bjv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.aileron_status_word.Data;
  A380PrimComputerFg_B.SSM_mi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_lye = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_py = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ft = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_lp0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_a2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_f0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ii = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_gj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM;
  A380PrimComputerFg_B.Data_of3 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.spoiler_status_word.Data;
  A380PrimComputerFg_B.SSM_ncq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_pj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_ix = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_es = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_gle = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_mly = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_h21 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_p3m =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_cf = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_status_word.SSM;
  A380PrimComputerFg_B.Data_ijw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_status_word.Data;
  A380PrimComputerFg_B.SSM_ghc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_fqp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_lj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_liu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_nsn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFg_B.Data_ki1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data;
  A380PrimComputerFg_B.SSM_ovo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.ths_position_deg.SSM;
  A380PrimComputerFg_B.Data_byo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.ths_position_deg.Data;
  A380PrimComputerFg_B.SSM_nst = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
  A380PrimComputerFg_B.Data_cwz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
  A380PrimComputerFg_B.SSM_iv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_k2d = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_pq = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_h5f = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_ii = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFg_B.Data_c0o = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFg_B.SSM_olh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM;
  A380PrimComputerFg_B.Data_db = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data;
  A380PrimComputerFg_B.SSM_fkb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM;
  A380PrimComputerFg_B.Data_dcz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_1_bus.misc_data_status_word.Data;
  A380PrimComputerFg_B.SSM_gev =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_ork =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_jp =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_f11 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_iu =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_hyn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_bew =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_cg =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_eie = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFg_B.Data_mor = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFg_B.SSM_nk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.aileron_status_word.SSM;
  A380PrimComputerFg_B.Data_l1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.aileron_status_word.Data;
  A380PrimComputerFg_B.SSM_buw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_ms = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_ht = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ag = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_io = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_epm =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_igr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_pp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_np1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM;
  A380PrimComputerFg_B.Data_nek = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.spoiler_status_word.Data;
  A380PrimComputerFg_B.SSM_hkwh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_cho = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_ahu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_aet =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_ka4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_oxr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_k2r = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_oq5 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_i0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_status_word.SSM;
  A380PrimComputerFg_B.Data_cuh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_status_word.Data;
  A380PrimComputerFg_B.SSM_jes = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_jlt = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_kg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_jm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_frj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFg_B.Data_fg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data;
  A380PrimComputerFg_B.SSM_ej = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.ths_position_deg.SSM;
  A380PrimComputerFg_B.Data_np = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.ths_position_deg.Data;
  A380PrimComputerFg_B.SSM_ok = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
  A380PrimComputerFg_B.Data_pmi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
  A380PrimComputerFg_B.SSM_iyk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_b2 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_mv = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ogu = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_f4l = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFg_B.Data_lw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFg_B.SSM_mtx = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM;
  A380PrimComputerFg_B.Data_f44 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data;
  A380PrimComputerFg_B.SSM_ahy = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM;
  A380PrimComputerFg_B.Data_oau = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_2_bus.misc_data_status_word.Data;
  A380PrimComputerFg_B.SSM_ovo2 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_aoh =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_hsq =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_mon =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_nxn =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_i4t =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_nnx =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_mt =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_lo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFg_B.Data_jh0 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFg_B.SSM_apz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.aileron_status_word.SSM;
  A380PrimComputerFg_B.Data_nvn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.aileron_status_word.Data;
  A380PrimComputerFg_B.SSM_fi = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_b0e = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_iw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_f22 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_dfj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_dn0 =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_e1 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ngo =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_mp = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM;
  A380PrimComputerFg_B.Data_bkg = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.spoiler_status_word.Data;
  A380PrimComputerFg_B.SSM_k2j = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_ora = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_eyo = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_cd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_ceqr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_inj = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_c3y = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_fno =
    A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_em = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_status_word.SSM;
  A380PrimComputerFg_B.Data_dd = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_status_word.Data;
  A380PrimComputerFg_B.SSM_cre = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_jff = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_lfz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_fh = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_pji = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFg_B.Data_kc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data;
  A380PrimComputerFg_B.SSM_hbr = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.ths_position_deg.SSM;
  A380PrimComputerFg_B.Data_odm = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.ths_position_deg.Data;
  A380PrimComputerFg_B.SSM_p2n = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_status_word.SSM;
  A380PrimComputerFg_B.Data_h5r = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_status_word.Data;
  A380PrimComputerFg_B.SSM_lc = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_pb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_haw = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ma4 = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_km = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFg_B.Data_hwb = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFg_B.SSM_chn = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM;
  A380PrimComputerFg_B.Data_ndk = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data;
  A380PrimComputerFg_B.SSM_cz = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM;
  A380PrimComputerFg_B.Data_e1h = A380PrimComputerFg_P.out_Y0.data.bus_inputs.sec_3_bus.misc_data_status_word.Data;
  A380PrimComputerFg_B.fm_valid = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.fm_valid;
  A380PrimComputerFg_B.active_fms_flight_phase =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.active_fms_flight_phase;
  A380PrimComputerFg_B.selected_approach_type = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.selected_approach_type;
  A380PrimComputerFg_B.backbeam_selected = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.backbeam_selected;
  A380PrimComputerFg_B.fms_loc_distance = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.fms_loc_distance;
  A380PrimComputerFg_B.fms_unrealistic_gs_angle_deg =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.fms_unrealistic_gs_angle_deg;
  A380PrimComputerFg_B.fms_weight_lbs = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.fms_weight_lbs;
  A380PrimComputerFg_B.fms_cg_percent = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.fms_cg_percent;
  A380PrimComputerFg_B.lateral_flight_plan_valid =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.lateral_flight_plan_valid;
  A380PrimComputerFg_B.nav_capture_condition = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.nav_capture_condition;
  A380PrimComputerFg_B.phi_c_deg = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.phi_c_deg;
  A380PrimComputerFg_B.xtk_nmi = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.xtk_nmi;
  A380PrimComputerFg_B.tke_deg = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.tke_deg;
  A380PrimComputerFg_B.phi_limit_deg = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.phi_limit_deg;
  A380PrimComputerFg_B.direct_to_nav_engage = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.direct_to_nav_engage;
  A380PrimComputerFg_B.vertical_flight_plan_valid =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.vertical_flight_plan_valid;
  A380PrimComputerFg_B.final_app_can_engage = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.final_app_can_engage;
  A380PrimComputerFg_B.next_alt_cstr_ft = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.next_alt_cstr_ft;
  A380PrimComputerFg_B.requested_des_submode = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.requested_des_submode;
  A380PrimComputerFg_B.alt_profile_tgt_ft = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.alt_profile_tgt_ft;
  A380PrimComputerFg_B.vs_target_ft_min = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.vs_target_ft_min;
  A380PrimComputerFg_B.v_2_kts = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.v_2_kts;
  A380PrimComputerFg_B.v_app_kts = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.v_app_kts;
  A380PrimComputerFg_B.v_managed_kts = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.v_managed_kts;
  A380PrimComputerFg_B.v_upper_margin_kts = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.v_upper_margin_kts;
  A380PrimComputerFg_B.v_lower_margin_kts = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.v_lower_margin_kts;
  A380PrimComputerFg_B.show_speed_margins = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.show_speed_margins;
  A380PrimComputerFg_B.preset_spd_kts = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.preset_spd_kts;
  A380PrimComputerFg_B.preset_mach = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.preset_mach;
  A380PrimComputerFg_B.preset_spd_mach_activate =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.preset_spd_mach_activate;
  A380PrimComputerFg_B.fms_spd_mode_activate = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.fms_spd_mode_activate;
  A380PrimComputerFg_B.fms_mach_mode_activate = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.fms_mach_mode_activate;
  A380PrimComputerFg_B.flex_temp_deg_c = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.flex_temp_deg_c;
  A380PrimComputerFg_B.acceleration_alt_ft = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.acceleration_alt_ft;
  A380PrimComputerFg_B.acceleration_alt_eo_ft = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.acceleration_alt_eo_ft;
  A380PrimComputerFg_B.thrust_reduction_alt_ft =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.thrust_reduction_alt_ft;
  A380PrimComputerFg_B.cruise_alt_ft = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fms.cruise_alt_ft;
  A380PrimComputerFg_B.fqms = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.fqms;
  A380PrimComputerFg_B.SSM_kxxta = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_tla_deg.SSM;
  A380PrimComputerFg_B.Data_fwxk = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_tla_deg.Data;
  A380PrimComputerFg_B.SSM_kxxtac = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_ref_percent.SSM;
  A380PrimComputerFg_B.Data_fwxkf = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_ref_percent.Data;
  A380PrimComputerFg_B.SSM_kxxtac0 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_flex_temp_deg.SSM;
  A380PrimComputerFg_B.Data_fwxkft = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_flex_temp_deg.Data;
  A380PrimComputerFg_B.SSM_kxxtac0z = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_status_word_1.SSM;
  A380PrimComputerFg_B.Data_fwxkftc = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_status_word_1.Data;
  A380PrimComputerFg_B.SSM_kxxtac0zt = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_status_word_2.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3e = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_status_word_2.Data;
  A380PrimComputerFg_B.SSM_kxxtac0ztg = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_status_word_3.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3ep = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_status_word_3.Data;
  A380PrimComputerFg_B.SSM_kxxtac0ztgf = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_limit_percent.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3epg = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_limit_percent.Data;
  A380PrimComputerFg_B.SSM_kxxtac0ztgf2 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_maximum_percent.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3epgt = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_maximum_percent.Data;
  A380PrimComputerFg_B.SSM_kxxtac0ztgf2u = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_command_percent.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3epgtd = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.n1_command_percent.Data;
  A380PrimComputerFg_B.SSM_kxxtac0ztgf2ux =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_n2_actual_percent.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3epgtdx =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_n2_actual_percent.Data;
  A380PrimComputerFg_B.SSM_ky = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_n1_actual_percent.SSM;
  A380PrimComputerFg_B.Data_fwxkftc3epgtdxc =
    A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.selected_n1_actual_percent.Data;
  A380PrimComputerFg_B.SSM_d = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_maintenance_word_6.SSM;
  A380PrimComputerFg_B.Data_h = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_1.ecu_maintenance_word_6.Data;
  A380PrimComputerFg_B.SSM_h = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_tla_deg.SSM;
  A380PrimComputerFg_B.Data_e = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_tla_deg.Data;
  A380PrimComputerFg_B.SSM_kb = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_ref_percent.SSM;
  A380PrimComputerFg_B.Data_j = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_ref_percent.Data;
  A380PrimComputerFg_B.SSM_p = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_flex_temp_deg.SSM;
  A380PrimComputerFg_B.Data_p = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_flex_temp_deg.Data;
  A380PrimComputerFg_B.SSM_di = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_status_word_1.SSM;
  A380PrimComputerFg_B.Data_i = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_status_word_1.Data;
  A380PrimComputerFg_B.SSM_j = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_status_word_2.SSM;
  A380PrimComputerFg_B.Data_g = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_status_word_2.Data;
  A380PrimComputerFg_B.SSM_i = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_status_word_3.SSM;
  A380PrimComputerFg_B.Data_a = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_status_word_3.Data;
  A380PrimComputerFg_B.SSM_g = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_limit_percent.SSM;
  A380PrimComputerFg_B.Data_eb = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_limit_percent.Data;
  A380PrimComputerFg_B.SSM_db = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_maximum_percent.SSM;
  A380PrimComputerFg_B.Data_jo = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_maximum_percent.Data;
  A380PrimComputerFg_B.SSM_a = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_command_percent.SSM;
  A380PrimComputerFg_B.Data_ex = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.n1_command_percent.Data;
  A380PrimComputerFg_B.SSM_ir = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_n2_actual_percent.SSM;
  A380PrimComputerFg_B.Data_fd = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_n2_actual_percent.Data;
  A380PrimComputerFg_B.SSM_hu = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_n1_actual_percent.SSM;
  A380PrimComputerFg_B.Data_ja = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.selected_n1_actual_percent.Data;
  A380PrimComputerFg_B.SSM_e = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_maintenance_word_6.SSM;
  A380PrimComputerFg_B.Data_k = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_2.ecu_maintenance_word_6.Data;
  A380PrimComputerFg_B.SSM_gr = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_tla_deg.SSM;
  A380PrimComputerFg_B.Data_h3 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_tla_deg.Data;
  A380PrimComputerFg_B.SSM_ev = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_ref_percent.SSM;
  A380PrimComputerFg_B.Data_a0 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_ref_percent.Data;
  A380PrimComputerFg_B.SSM_l = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_flex_temp_deg.SSM;
  A380PrimComputerFg_B.Data_b = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_flex_temp_deg.Data;
  A380PrimComputerFg_B.SSM_ei = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_status_word_1.SSM;
  A380PrimComputerFg_B.Data_eq = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_status_word_1.Data;
  A380PrimComputerFg_B.SSM_an = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_status_word_2.SSM;
  A380PrimComputerFg_B.Data_iz = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_status_word_2.Data;
  A380PrimComputerFg_B.SSM_c = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_status_word_3.SSM;
  A380PrimComputerFg_B.Data_j2 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_status_word_3.Data;
  A380PrimComputerFg_B.SSM_lb = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_limit_percent.SSM;
  A380PrimComputerFg_B.Data_o = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_limit_percent.Data;
  A380PrimComputerFg_B.SSM_ia = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_maximum_percent.SSM;
  A380PrimComputerFg_B.Data_m = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_maximum_percent.Data;
  A380PrimComputerFg_B.SSM_kyz = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_command_percent.SSM;
  A380PrimComputerFg_B.Data_oq = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.n1_command_percent.Data;
  A380PrimComputerFg_B.SSM_as = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_n2_actual_percent.SSM;
  A380PrimComputerFg_B.Data_fo = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_n2_actual_percent.Data;
  A380PrimComputerFg_B.SSM_is = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_n1_actual_percent.SSM;
  A380PrimComputerFg_B.Data_p1y = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.selected_n1_actual_percent.Data;
  A380PrimComputerFg_B.SSM_ca = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_maintenance_word_6.SSM;
  A380PrimComputerFg_B.Data_l = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_3.ecu_maintenance_word_6.Data;
  A380PrimComputerFg_B.SSM_o = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_tla_deg.SSM;
  A380PrimComputerFg_B.Data_kp = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_tla_deg.Data;
  A380PrimComputerFg_B.SSM_ak = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_ref_percent.SSM;
  A380PrimComputerFg_B.Data_k0 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_ref_percent.Data;
  A380PrimComputerFg_B.SSM_cbj = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_flex_temp_deg.SSM;
  A380PrimComputerFg_B.Data_pi = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_flex_temp_deg.Data;
  A380PrimComputerFg_B.SSM_cu = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_status_word_1.SSM;
  A380PrimComputerFg_B.Data_dm = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_status_word_1.Data;
  A380PrimComputerFg_B.SSM_b = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_status_word_2.SSM;
  A380PrimComputerFg_B.Data_f5 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_status_word_2.Data;
  A380PrimComputerFg_B.SSM_m = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_status_word_3.SSM;
  A380PrimComputerFg_B.Data_js = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_status_word_3.Data;
  A380PrimComputerFg_B.SSM_f = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_limit_percent.SSM;
  A380PrimComputerFg_B.Data_ee = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_limit_percent.Data;
  A380PrimComputerFg_B.SSM_bp = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_maximum_percent.SSM;
  A380PrimComputerFg_B.Data_ig = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_maximum_percent.Data;
  A380PrimComputerFg_B.SSM_hb = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_command_percent.SSM;
  A380PrimComputerFg_B.Data_pu = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.n1_command_percent.Data;
  A380PrimComputerFg_B.SSM_gz = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_n2_actual_percent.SSM;
  A380PrimComputerFg_B.Data_ly = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_n2_actual_percent.Data;
  A380PrimComputerFg_B.SSM_pv = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_n1_actual_percent.SSM;
  A380PrimComputerFg_B.Data_jq = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.selected_n1_actual_percent.Data;
  A380PrimComputerFg_B.SSM_mf = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_maintenance_word_6.SSM;
  A380PrimComputerFg_B.Data_o5 = A380PrimComputerFg_P.out_Y0.data.adcn_inputs.eec_4.ecu_maintenance_word_6.Data;
  A380PrimComputerFg_B.on_ground = A380PrimComputerFg_P.out_Y0.general_logic.on_ground;
  A380PrimComputerFg_B.tracking_mode_on = A380PrimComputerFg_P.out_Y0.general_logic.tracking_mode_on;
  A380PrimComputerFg_B.double_adr_failure = A380PrimComputerFg_P.out_Y0.general_logic.double_adr_failure;
  A380PrimComputerFg_B.triple_adr_failure = A380PrimComputerFg_P.out_Y0.general_logic.triple_adr_failure;
  A380PrimComputerFg_B.cas_or_mach_disagree = A380PrimComputerFg_P.out_Y0.general_logic.cas_or_mach_disagree;
  A380PrimComputerFg_B.alpha_disagree = A380PrimComputerFg_P.out_Y0.general_logic.alpha_disagree;
  A380PrimComputerFg_B.double_ir_failure = A380PrimComputerFg_P.out_Y0.general_logic.double_ir_failure;
  A380PrimComputerFg_B.triple_ir_failure = A380PrimComputerFg_P.out_Y0.general_logic.triple_ir_failure;
  A380PrimComputerFg_B.ir_failure_not_self_detected =
    A380PrimComputerFg_P.out_Y0.general_logic.ir_failure_not_self_detected;
  A380PrimComputerFg_B.V_ias_kn = A380PrimComputerFg_P.out_Y0.general_logic.adr_computation_data.V_ias_kn;
  A380PrimComputerFg_B.V_tas_kn = A380PrimComputerFg_P.out_Y0.general_logic.adr_computation_data.V_tas_kn;
  A380PrimComputerFg_B.mach = A380PrimComputerFg_P.out_Y0.general_logic.adr_computation_data.mach;
  A380PrimComputerFg_B.alpha_deg = A380PrimComputerFg_P.out_Y0.general_logic.adr_computation_data.alpha_deg;
  A380PrimComputerFg_B.p_s_c_hpa = A380PrimComputerFg_P.out_Y0.general_logic.adr_computation_data.p_s_c_hpa;
  A380PrimComputerFg_B.altitude_standard_ft =
    A380PrimComputerFg_P.out_Y0.general_logic.adr_computation_data.altitude_standard_ft;
  A380PrimComputerFg_B.theta_deg = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.theta_deg;
  A380PrimComputerFg_B.phi_deg = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.phi_deg;
  A380PrimComputerFg_B.q_deg_s = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.q_deg_s;
  A380PrimComputerFg_B.r_deg_s = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.r_deg_s;
  A380PrimComputerFg_B.n_x_g = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.n_x_g;
  A380PrimComputerFg_B.n_y_g = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.n_y_g;
  A380PrimComputerFg_B.n_z_g = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.n_z_g;
  A380PrimComputerFg_B.theta_dot_deg_s = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.theta_dot_deg_s;
  A380PrimComputerFg_B.phi_dot_deg_s = A380PrimComputerFg_P.out_Y0.general_logic.ir_computation_data.phi_dot_deg_s;
  A380PrimComputerFg_B.ra_computation_data_ft = A380PrimComputerFg_P.out_Y0.general_logic.ra_computation_data_ft;
  A380PrimComputerFg_B.two_ra_failure = A380PrimComputerFg_P.out_Y0.general_logic.two_ra_failure;
  A380PrimComputerFg_B.all_ra_failure = A380PrimComputerFg_P.out_Y0.general_logic.all_ra_failure;
  A380PrimComputerFg_B.all_sfcc_lost = A380PrimComputerFg_P.out_Y0.general_logic.all_sfcc_lost;
  A380PrimComputerFg_B.flap_handle_index = A380PrimComputerFg_P.out_Y0.general_logic.flap_handle_index;
  A380PrimComputerFg_B.flap_angle_deg = A380PrimComputerFg_P.out_Y0.general_logic.flap_angle_deg;
  A380PrimComputerFg_B.slat_angle_deg = A380PrimComputerFg_P.out_Y0.general_logic.slat_angle_deg;
  A380PrimComputerFg_B.slat_flap_actual_pos = A380PrimComputerFg_P.out_Y0.general_logic.slat_flap_actual_pos;
  A380PrimComputerFg_B.flap_surface_angle_deg = A380PrimComputerFg_P.out_Y0.general_logic.flap_surface_angle_deg;
  A380PrimComputerFg_B.slat_surface_angle_deg = A380PrimComputerFg_P.out_Y0.general_logic.slat_surface_angle_deg;
  A380PrimComputerFg_B.double_lgciu_failure = A380PrimComputerFg_P.out_Y0.general_logic.double_lgciu_failure;
  A380PrimComputerFg_B.slats_locked = A380PrimComputerFg_P.out_Y0.general_logic.slats_locked;
  A380PrimComputerFg_B.flaps_locked = A380PrimComputerFg_P.out_Y0.general_logic.flaps_locked;
  A380PrimComputerFg_B.landing_gear_down = A380PrimComputerFg_P.out_Y0.general_logic.landing_gear_down;
  A380PrimComputerFg_B.one_engine_out = A380PrimComputerFg_P.out_Y0.general_logic.one_engine_out;
  A380PrimComputerFg_B.engine_running = A380PrimComputerFg_P.out_Y0.general_logic.engine_running;
  A380PrimComputerFg_B.is_yellow_hydraulic_power_avail =
    A380PrimComputerFg_P.out_Y0.general_logic.is_yellow_hydraulic_power_avail;
  A380PrimComputerFg_B.is_green_hydraulic_power_avail =
    A380PrimComputerFg_P.out_Y0.general_logic.is_green_hydraulic_power_avail;
  A380PrimComputerFg_B.beta_target_deg = A380PrimComputerFg_P.out_Y0.flight_envelope.beta_target_deg;
  A380PrimComputerFg_B.beta_target_visible = A380PrimComputerFg_P.out_Y0.flight_envelope.beta_target_visible;
  A380PrimComputerFg_B.alpha_floor_condition = A380PrimComputerFg_P.out_Y0.flight_envelope.alpha_floor_condition;
  A380PrimComputerFg_B.computed_weight_lbs = A380PrimComputerFg_P.out_Y0.flight_envelope.computed_weight_lbs;
  A380PrimComputerFg_B.computed_cg_percent = A380PrimComputerFg_P.out_Y0.flight_envelope.computed_cg_percent;
  A380PrimComputerFg_B.speed_scale_lost = A380PrimComputerFg_P.out_Y0.flight_envelope.speed_scale_lost;
  A380PrimComputerFg_B.speed_scale_visible = A380PrimComputerFg_P.out_Y0.flight_envelope.speed_scale_visible;
  A380PrimComputerFg_B.v_ls_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_ls_kn;
  A380PrimComputerFg_B.v_stall_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_stall_kn;
  A380PrimComputerFg_B.v_3_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_3_kn;
  A380PrimComputerFg_B.v_3_visible = A380PrimComputerFg_P.out_Y0.flight_envelope.v_3_visible;
  A380PrimComputerFg_B.v_4_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_4_kn;
  A380PrimComputerFg_B.v_4_visible = A380PrimComputerFg_P.out_Y0.flight_envelope.v_4_visible;
  A380PrimComputerFg_B.v_man_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_man_kn;
  A380PrimComputerFg_B.v_man_visible = A380PrimComputerFg_P.out_Y0.flight_envelope.v_man_visible;
  A380PrimComputerFg_B.v_max_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_max_kn;
  A380PrimComputerFg_B.v_fe_next_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_fe_next_kn;
  A380PrimComputerFg_B.v_fe_next_visible = A380PrimComputerFg_P.out_Y0.flight_envelope.v_fe_next_visible;
  A380PrimComputerFg_B.v_c_trend_kn = A380PrimComputerFg_P.out_Y0.flight_envelope.v_c_trend_kn;
  A380PrimComputerFg_B.gamma_a_deg = A380PrimComputerFg_P.out_Y0.flight_envelope.gamma_a_deg;
  A380PrimComputerFg_B.gamma_t_deg = A380PrimComputerFg_P.out_Y0.flight_envelope.gamma_t_deg;
  A380PrimComputerFg_B.pitch_pitch_warning_active =
    A380PrimComputerFg_P.out_Y0.flight_envelope.pitch_pitch_warning_active;
  A380PrimComputerFg_B.low_energy_warning_active = A380PrimComputerFg_P.out_Y0.flight_envelope.low_energy_warning_active;
  A380PrimComputerFg_B.left_inboard_aileron_deg =
    A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_inboard_aileron_deg;
  A380PrimComputerFg_B.right_inboard_aileron_deg =
    A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_inboard_aileron_deg;
  A380PrimComputerFg_B.left_midboard_aileron_deg =
    A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_midboard_aileron_deg;
  A380PrimComputerFg_B.right_midboard_aileron_deg =
    A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_midboard_aileron_deg;
  A380PrimComputerFg_B.left_outboard_aileron_deg =
    A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_outboard_aileron_deg;
  A380PrimComputerFg_B.right_outboard_aileron_deg =
    A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_outboard_aileron_deg;
  A380PrimComputerFg_B.left_spoiler_1_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_1_deg;
  A380PrimComputerFg_B.right_spoiler_1_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_1_deg;
  A380PrimComputerFg_B.left_spoiler_2_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_2_deg;
  A380PrimComputerFg_B.right_spoiler_2_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_2_deg;
  A380PrimComputerFg_B.left_spoiler_3_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_3_deg;
  A380PrimComputerFg_B.right_spoiler_3_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_3_deg;
  A380PrimComputerFg_B.left_spoiler_4_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_4_deg;
  A380PrimComputerFg_B.right_spoiler_4_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_4_deg;
  A380PrimComputerFg_B.left_spoiler_5_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_5_deg;
  A380PrimComputerFg_B.right_spoiler_5_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_5_deg;
  A380PrimComputerFg_B.left_spoiler_6_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_6_deg;
  A380PrimComputerFg_B.right_spoiler_6_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_6_deg;
  A380PrimComputerFg_B.left_spoiler_7_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_7_deg;
  A380PrimComputerFg_B.right_spoiler_7_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_7_deg;
  A380PrimComputerFg_B.left_spoiler_8_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.left_spoiler_8_deg;
  A380PrimComputerFg_B.right_spoiler_8_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.right_spoiler_8_deg;
  A380PrimComputerFg_B.upper_rudder_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.upper_rudder_deg;
  A380PrimComputerFg_B.lower_rudder_deg = A380PrimComputerFg_P.out_Y0.laws.lateral_law_outputs.lower_rudder_deg;
  A380PrimComputerFg_B.left_inboard_elevator_deg =
    A380PrimComputerFg_P.out_Y0.laws.pitch_law_outputs.left_inboard_elevator_deg;
  A380PrimComputerFg_B.right_inboard_elevator_deg =
    A380PrimComputerFg_P.out_Y0.laws.pitch_law_outputs.right_inboard_elevator_deg;
  A380PrimComputerFg_B.left_outboard_elevator_deg =
    A380PrimComputerFg_P.out_Y0.laws.pitch_law_outputs.left_outboard_elevator_deg;
  A380PrimComputerFg_B.right_outboard_elevator_deg =
    A380PrimComputerFg_P.out_Y0.laws.pitch_law_outputs.right_outboard_elevator_deg;
  A380PrimComputerFg_B.ths_deg = A380PrimComputerFg_P.out_Y0.laws.pitch_law_outputs.ths_deg;
  A380PrimComputerFg_B.left_inboard_aileron_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.left_inboard_aileron_engaged;
  A380PrimComputerFg_B.right_inboard_aileron_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.right_inboard_aileron_engaged;
  A380PrimComputerFg_B.left_midboard_aileron_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.left_midboard_aileron_engaged;
  A380PrimComputerFg_B.right_midboard_aileron_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.right_midboard_aileron_engaged;
  A380PrimComputerFg_B.left_outboard_aileron_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.left_outboard_aileron_engaged;
  A380PrimComputerFg_B.right_outboard_aileron_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.right_outboard_aileron_engaged;
  A380PrimComputerFg_B.spoiler_pair_1_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_1_engaged;
  A380PrimComputerFg_B.spoiler_pair_2_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_2_engaged;
  A380PrimComputerFg_B.spoiler_pair_3_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_3_engaged;
  A380PrimComputerFg_B.spoiler_pair_4_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_4_engaged;
  A380PrimComputerFg_B.spoiler_pair_5_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_5_engaged;
  A380PrimComputerFg_B.spoiler_pair_6_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_6_engaged;
  A380PrimComputerFg_B.spoiler_pair_7_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_7_engaged;
  A380PrimComputerFg_B.spoiler_pair_8_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_8_engaged;
  A380PrimComputerFg_B.left_inboard_elevator_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.left_inboard_elevator_engaged;
  A380PrimComputerFg_B.right_inboard_elevator_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.right_inboard_elevator_engaged;
  A380PrimComputerFg_B.left_outboard_elevator_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.left_outboard_elevator_engaged;
  A380PrimComputerFg_B.right_outboard_elevator_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.right_outboard_elevator_engaged;
  A380PrimComputerFg_B.ths_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.ths_engaged;
  A380PrimComputerFg_B.upper_rudder_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.upper_rudder_engaged;
  A380PrimComputerFg_B.lower_rudder_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.surface_statuses.lower_rudder_engaged;
  A380PrimComputerFg_B.left_inboard_aileron_deg_g =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg;
  A380PrimComputerFg_B.right_inboard_aileron_deg_b =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg;
  A380PrimComputerFg_B.left_midboard_aileron_deg_f =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg;
  A380PrimComputerFg_B.right_midboard_aileron_deg_f =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg;
  A380PrimComputerFg_B.left_outboard_aileron_deg_g =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg;
  A380PrimComputerFg_B.right_outboard_aileron_deg_m =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg;
  A380PrimComputerFg_B.left_spoiler_1_deg_b =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_1_deg;
  A380PrimComputerFg_B.right_spoiler_1_deg_o =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_1_deg;
  A380PrimComputerFg_B.left_spoiler_2_deg_i =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_2_deg;
  A380PrimComputerFg_B.right_spoiler_2_deg_g =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_2_deg;
  A380PrimComputerFg_B.left_spoiler_3_deg_i =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_3_deg;
  A380PrimComputerFg_B.right_spoiler_3_deg_b =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_3_deg;
  A380PrimComputerFg_B.left_spoiler_4_deg_g =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_4_deg;
  A380PrimComputerFg_B.right_spoiler_4_deg_a =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_4_deg;
  A380PrimComputerFg_B.left_spoiler_5_deg_d =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_5_deg;
  A380PrimComputerFg_B.right_spoiler_5_deg_m =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_5_deg;
  A380PrimComputerFg_B.left_spoiler_6_deg_o =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_6_deg;
  A380PrimComputerFg_B.right_spoiler_6_deg_d =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_6_deg;
  A380PrimComputerFg_B.left_spoiler_7_deg_a =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_7_deg;
  A380PrimComputerFg_B.right_spoiler_7_deg_j =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_7_deg;
  A380PrimComputerFg_B.left_spoiler_8_deg_h =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_8_deg;
  A380PrimComputerFg_B.right_spoiler_8_deg_j =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_8_deg;
  A380PrimComputerFg_B.upper_rudder_deg_m =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.upper_rudder_deg;
  A380PrimComputerFg_B.lower_rudder_deg_c =
    A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_surface_positions.lower_rudder_deg;
  A380PrimComputerFg_B.left_inboard_elevator_deg_k =
    A380PrimComputerFg_P.out_Y0.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg;
  A380PrimComputerFg_B.right_inboard_elevator_deg_o =
    A380PrimComputerFg_P.out_Y0.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg;
  A380PrimComputerFg_B.left_outboard_elevator_deg_p =
    A380PrimComputerFg_P.out_Y0.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg;
  A380PrimComputerFg_B.right_outboard_elevator_deg_g =
    A380PrimComputerFg_P.out_Y0.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg;
  A380PrimComputerFg_B.ths_deg_o = A380PrimComputerFg_P.out_Y0.fctl_logic.pitch_surface_positions.ths_deg;
  A380PrimComputerFg_B.lateral_law_capability = A380PrimComputerFg_P.out_Y0.fctl_logic.lateral_law_capability;
  A380PrimComputerFg_B.active_lateral_law_n = A380PrimComputerFg_P.out_Y0.fctl_logic.active_lateral_law;
  A380PrimComputerFg_B.pitch_law_capability = A380PrimComputerFg_P.out_Y0.fctl_logic.pitch_law_capability;
  A380PrimComputerFg_B.active_pitch_law = A380PrimComputerFg_P.out_Y0.fctl_logic.active_pitch_law;
  A380PrimComputerFg_B.abnormal_condition_law_active =
    A380PrimComputerFg_P.out_Y0.fctl_logic.abnormal_condition_law_active;
  A380PrimComputerFg_B.is_master_prim = A380PrimComputerFg_P.out_Y0.fctl_logic.is_master_prim;
  A380PrimComputerFg_B.elevator_1_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.elevator_1_avail;
  A380PrimComputerFg_B.elevator_1_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.elevator_1_engaged;
  A380PrimComputerFg_B.elevator_2_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.elevator_2_avail;
  A380PrimComputerFg_B.elevator_2_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.elevator_2_engaged;
  A380PrimComputerFg_B.elevator_3_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.elevator_3_avail;
  A380PrimComputerFg_B.elevator_3_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.elevator_3_engaged;
  A380PrimComputerFg_B.ths_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.ths_avail;
  A380PrimComputerFg_B.ths_engaged_h = A380PrimComputerFg_P.out_Y0.fctl_logic.ths_engaged;
  A380PrimComputerFg_B.left_aileron_1_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.left_aileron_1_avail;
  A380PrimComputerFg_B.left_aileron_1_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.left_aileron_1_engaged;
  A380PrimComputerFg_B.left_aileron_2_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.left_aileron_2_avail;
  A380PrimComputerFg_B.left_aileron_2_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.left_aileron_2_engaged;
  A380PrimComputerFg_B.right_aileron_1_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.right_aileron_1_avail;
  A380PrimComputerFg_B.right_aileron_1_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.right_aileron_1_engaged;
  A380PrimComputerFg_B.right_aileron_2_avail = A380PrimComputerFg_P.out_Y0.fctl_logic.right_aileron_2_avail;
  A380PrimComputerFg_B.right_aileron_2_engaged = A380PrimComputerFg_P.out_Y0.fctl_logic.right_aileron_2_engaged;
  A380PrimComputerFg_B.left_spoiler_hydraulic_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.left_spoiler_hydraulic_mode_avail;
  A380PrimComputerFg_B.left_spoiler_electric_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.left_spoiler_electric_mode_avail;
  A380PrimComputerFg_B.left_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.left_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFg_B.left_spoiler_electric_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.left_spoiler_electric_mode_engaged;
  A380PrimComputerFg_B.right_spoiler_hydraulic_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.right_spoiler_hydraulic_mode_avail;
  A380PrimComputerFg_B.right_spoiler_electric_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.right_spoiler_electric_mode_avail;
  A380PrimComputerFg_B.right_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.right_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFg_B.right_spoiler_electric_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.right_spoiler_electric_mode_engaged;
  A380PrimComputerFg_B.rudder_1_hydraulic_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_1_hydraulic_mode_avail;
  A380PrimComputerFg_B.rudder_1_electric_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_1_electric_mode_avail;
  A380PrimComputerFg_B.rudder_1_hydraulic_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_1_hydraulic_mode_engaged;
  A380PrimComputerFg_B.rudder_1_electric_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_1_electric_mode_engaged;
  A380PrimComputerFg_B.rudder_2_hydraulic_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_2_hydraulic_mode_avail;
  A380PrimComputerFg_B.rudder_2_electric_mode_avail =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_2_electric_mode_avail;
  A380PrimComputerFg_B.rudder_2_hydraulic_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_2_hydraulic_mode_engaged;
  A380PrimComputerFg_B.rudder_2_electric_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fctl_logic.rudder_2_electric_mode_engaged;
  A380PrimComputerFg_B.aileron_droop_active = A380PrimComputerFg_P.out_Y0.fctl_logic.aileron_droop_active;
  A380PrimComputerFg_B.aileron_antidroop_active = A380PrimComputerFg_P.out_Y0.fctl_logic.aileron_antidroop_active;
  A380PrimComputerFg_B.ths_automatic_mode_active = A380PrimComputerFg_P.out_Y0.fctl_logic.ths_automatic_mode_active;
  A380PrimComputerFg_B.ths_manual_mode_c_deg_s = A380PrimComputerFg_P.out_Y0.fctl_logic.ths_manual_mode_c_deg_s;
  A380PrimComputerFg_B.eha_ebha_elec_mode_inhibited =
    A380PrimComputerFg_P.out_Y0.fctl_logic.eha_ebha_elec_mode_inhibited;
  A380PrimComputerFg_B.left_sidestick_disabled = A380PrimComputerFg_P.out_Y0.fctl_logic.left_sidestick_disabled;
  A380PrimComputerFg_B.right_sidestick_disabled = A380PrimComputerFg_P.out_Y0.fctl_logic.right_sidestick_disabled;
  A380PrimComputerFg_B.left_sidestick_priority_locked =
    A380PrimComputerFg_P.out_Y0.fctl_logic.left_sidestick_priority_locked;
  A380PrimComputerFg_B.right_sidestick_priority_locked =
    A380PrimComputerFg_P.out_Y0.fctl_logic.right_sidestick_priority_locked;
  A380PrimComputerFg_B.total_sidestick_pitch_command =
    A380PrimComputerFg_P.out_Y0.fctl_logic.total_sidestick_pitch_command;
  A380PrimComputerFg_B.total_sidestick_roll_command =
    A380PrimComputerFg_P.out_Y0.fctl_logic.total_sidestick_roll_command;
  A380PrimComputerFg_B.speed_brake_inhibited = A380PrimComputerFg_P.out_Y0.fctl_logic.speed_brake_inhibited;
  A380PrimComputerFg_B.speed_brake_command_deg = A380PrimComputerFg_P.out_Y0.fctl_logic.speed_brake_command_deg;
  A380PrimComputerFg_B.ground_spoilers_armed = A380PrimComputerFg_P.out_Y0.fctl_logic.ground_spoilers_armed;
  A380PrimComputerFg_B.ground_spoilers_out = A380PrimComputerFg_P.out_Y0.fctl_logic.ground_spoilers_out;
  A380PrimComputerFg_B.phased_lift_dumping_active = A380PrimComputerFg_P.out_Y0.fctl_logic.phased_lift_dumping_active;
  A380PrimComputerFg_B.spoiler_lift_active = A380PrimComputerFg_P.out_Y0.fctl_logic.spoiler_lift_active;
  A380PrimComputerFg_B.ap_authorised = A380PrimComputerFg_P.out_Y0.fctl_logic.ap_authorised;
  A380PrimComputerFg_B.protection_ap_disconnect = A380PrimComputerFg_P.out_Y0.fctl_logic.protection_ap_disconnect;
  A380PrimComputerFg_B.high_alpha_prot_active = A380PrimComputerFg_P.out_Y0.fctl_logic.high_alpha_prot_active;
  A380PrimComputerFg_B.alpha_prot_deg = A380PrimComputerFg_P.out_Y0.fctl_logic.alpha_prot_deg;
  A380PrimComputerFg_B.alpha_max_deg = A380PrimComputerFg_P.out_Y0.fctl_logic.alpha_max_deg;
  A380PrimComputerFg_B.v_alpha_prot_kn = A380PrimComputerFg_P.out_Y0.fctl_logic.v_alpha_prot_kn;
  A380PrimComputerFg_B.v_alpha_max_kn = A380PrimComputerFg_P.out_Y0.fctl_logic.v_alpha_max_kn;
  A380PrimComputerFg_B.v_alpha_stall_warn_kn = A380PrimComputerFg_P.out_Y0.fctl_logic.v_alpha_stall_warn_kn;
  A380PrimComputerFg_B.high_speed_prot_active = A380PrimComputerFg_P.out_Y0.fctl_logic.high_speed_prot_active;
  A380PrimComputerFg_B.high_speed_prot_lo_thresh_kn =
    A380PrimComputerFg_P.out_Y0.fctl_logic.high_speed_prot_lo_thresh_kn;
  A380PrimComputerFg_B.high_speed_prot_hi_thresh_kn =
    A380PrimComputerFg_P.out_Y0.fctl_logic.high_speed_prot_hi_thresh_kn;
  A380PrimComputerFg_B.gnd_eng_stop_flt_5s = A380PrimComputerFg_P.out_Y0.fg_logic.gnd_eng_stop_flt_5s;
  A380PrimComputerFg_B.ap_fd_common_condition = A380PrimComputerFg_P.out_Y0.fg_logic.ap_fd_common_condition;
  A380PrimComputerFg_B.fd_1_engaged = A380PrimComputerFg_P.out_Y0.fg_logic.fd_1_engaged;
  A380PrimComputerFg_B.fd_2_engaged = A380PrimComputerFg_P.out_Y0.fg_logic.fd_2_engaged;
  A380PrimComputerFg_B.ap_1_engaged = A380PrimComputerFg_P.out_Y0.fg_logic.ap_1_engaged;
  A380PrimComputerFg_B.ap_2_engaged = A380PrimComputerFg_P.out_Y0.fg_logic.ap_2_engaged;
  A380PrimComputerFg_B.athr_engaged = A380PrimComputerFg_P.out_Y0.fg_logic.athr_engaged;
  A380PrimComputerFg_B.fd_1_inop = A380PrimComputerFg_P.out_Y0.fg_logic.fd_1_inop;
  A380PrimComputerFg_B.fd_2_inop = A380PrimComputerFg_P.out_Y0.fg_logic.fd_2_inop;
  A380PrimComputerFg_B.ap_1_inop = A380PrimComputerFg_P.out_Y0.fg_logic.ap_1_inop;
  A380PrimComputerFg_B.ap_2_inop = A380PrimComputerFg_P.out_Y0.fg_logic.ap_2_inop;
  A380PrimComputerFg_B.athr_inop = A380PrimComputerFg_P.out_Y0.fg_logic.athr_inop;
  A380PrimComputerFg_B.fmgc_opp_priority = A380PrimComputerFg_P.out_Y0.fg_logic.fmgc_opp_priority;
  A380PrimComputerFg_B.SSM_i2 = A380PrimComputerFg_P.out_Y0.fg_logic.altitude_indicated_ft.SSM;
  A380PrimComputerFg_B.Data_ez = A380PrimComputerFg_P.out_Y0.fg_logic.altitude_indicated_ft.Data;
  A380PrimComputerFg_B.all_fcu_failure = A380PrimComputerFg_P.out_Y0.fg_logic.all_fcu_failure;
  A380PrimComputerFg_B.fcu_1_chosen = A380PrimComputerFg_P.out_Y0.fg_logic.fcu_1_chosen;
  A380PrimComputerFg_B.fcu_2_chosen = A380PrimComputerFg_P.out_Y0.fg_logic.fcu_2_chosen;
  A380PrimComputerFg_B.ils_failure = A380PrimComputerFg_P.out_Y0.fg_logic.ils_failure;
  A380PrimComputerFg_B.both_ils_valid = A380PrimComputerFg_P.out_Y0.fg_logic.both_ils_valid;
  A380PrimComputerFg_B.SSM_kxx = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.runway_heading_deg.SSM;
  A380PrimComputerFg_B.Data_fwx = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.runway_heading_deg.Data;
  A380PrimComputerFg_B.SSM_kx = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.ils_frequency_mhz.SSM;
  A380PrimComputerFg_B.Data_fw = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.ils_frequency_mhz.Data;
  A380PrimComputerFg_B.SSM_k = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.localizer_deviation_deg.SSM;
  A380PrimComputerFg_B.Data_f = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.localizer_deviation_deg.Data;
  A380PrimComputerFg_B.SSM = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.glideslope_deviation_deg.SSM;
  A380PrimComputerFg_B.Data = A380PrimComputerFg_P.out_Y0.fg_logic.ils_computation_data.glideslope_deviation_deg.Data;
  A380PrimComputerFg_B.ils_tune_inhibit = A380PrimComputerFg_P.out_Y0.fg_logic.ils_tune_inhibit;
  A380PrimComputerFg_B.rwy_hdg_memo = A380PrimComputerFg_P.out_Y0.fg_logic.rwy_hdg_memo;
  A380PrimComputerFg_B.tcas_failure = A380PrimComputerFg_P.out_Y0.fg_logic.tcas_failure;
  A380PrimComputerFg_B.tcas_mode_available = A380PrimComputerFg_P.out_Y0.fg_logic.tcas_mode_available;
  A380PrimComputerFg_B.rwy_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.rwy_active;
  A380PrimComputerFg_B.nav_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.nav_active;
  A380PrimComputerFg_B.loc_cpt_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.loc_cpt_active;
  A380PrimComputerFg_B.loc_trk_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.loc_trk_active;
  A380PrimComputerFg_B.roll_goaround_active =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.roll_goaround_active;
  A380PrimComputerFg_B.hdg_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.hdg_active;
  A380PrimComputerFg_B.trk_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.trk_active;
  A380PrimComputerFg_B.rwy_loc_submode_active =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.rwy_loc_submode_active;
  A380PrimComputerFg_B.rwy_trk_submode_active =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.rwy_trk_submode_active;
  A380PrimComputerFg_B.land_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.land_active;
  A380PrimComputerFg_B.align_submode_active =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.align_submode_active;
  A380PrimComputerFg_B.rollout_submode_active =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_modes.rollout_submode_active;
  A380PrimComputerFg_B.clb_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.clb_active;
  A380PrimComputerFg_B.des_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.des_active;
  A380PrimComputerFg_B.op_clb_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.op_clb_active;
  A380PrimComputerFg_B.op_des_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.op_des_active;
  A380PrimComputerFg_B.pitch_takeoff_active =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.pitch_takeoff_active;
  A380PrimComputerFg_B.pitch_goaround_active =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.pitch_goaround_active;
  A380PrimComputerFg_B.vs_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.vs_active;
  A380PrimComputerFg_B.fpa_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.fpa_active;
  A380PrimComputerFg_B.alt_acq_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.alt_acq_active;
  A380PrimComputerFg_B.alt_hold_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.alt_hold_active;
  A380PrimComputerFg_B.fma_dash_display = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.fma_dash_display;
  A380PrimComputerFg_B.gs_capt_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.gs_capt_active;
  A380PrimComputerFg_B.gs_trk_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.gs_trk_active;
  A380PrimComputerFg_B.final_des_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.final_des_active;
  A380PrimComputerFg_B.flare_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.flare_active;
  A380PrimComputerFg_B.cruise_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.cruise_active;
  A380PrimComputerFg_B.tcas_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_modes.tcas_active;
  A380PrimComputerFg_B.alt_acq_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.alt_acq_armed;
  A380PrimComputerFg_B.alt_acq_arm_possible = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.alt_acq_arm_possible;
  A380PrimComputerFg_B.nav_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.nav_armed;
  A380PrimComputerFg_B.loc_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.loc_armed;
  A380PrimComputerFg_B.land_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.land_armed;
  A380PrimComputerFg_B.glide_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.glide_armed;
  A380PrimComputerFg_B.final_des_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.final_des_armed;
  A380PrimComputerFg_B.clb_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.clb_armed;
  A380PrimComputerFg_B.des_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.des_armed;
  A380PrimComputerFg_B.tcas_armed = A380PrimComputerFg_P.out_Y0.fg_mode_logic.armed_modes.tcas_armed;
  A380PrimComputerFg_B.active_lateral_law = A380PrimComputerFg_P.out_Y0.fg_mode_logic.active_lateral_law;
  A380PrimComputerFg_B.active_longitudinal_law = A380PrimComputerFg_P.out_Y0.fg_mode_logic.active_longitudinal_law;
  A380PrimComputerFg_B.auto_spd_control_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.auto_spd_control_active;
  A380PrimComputerFg_B.manual_spd_control_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.manual_spd_control_active;
  A380PrimComputerFg_B.mach_control_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.mach_control_active;
  A380PrimComputerFg_B.athr_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.athr_active;
  A380PrimComputerFg_B.athr_limited = A380PrimComputerFg_P.out_Y0.fg_mode_logic.athr_limited;
  A380PrimComputerFg_B.alpha_floor_mode_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.alpha_floor_mode_active;
  A380PrimComputerFg_B.thrust_mode_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.thrust_mode_active;
  A380PrimComputerFg_B.thrust_target_idle = A380PrimComputerFg_P.out_Y0.fg_mode_logic.thrust_target_idle;
  A380PrimComputerFg_B.speed_mach_mode_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.speed_mach_mode_active;
  A380PrimComputerFg_B.retard_mode_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.retard_mode_active;
  A380PrimComputerFg_B.athr_fma_mode = A380PrimComputerFg_P.out_Y0.fg_mode_logic.athr_fma_mode;
  A380PrimComputerFg_B.athr_fma_message = A380PrimComputerFg_P.out_Y0.fg_mode_logic.athr_fma_message;
  A380PrimComputerFg_B.spd_target_kts = A380PrimComputerFg_P.out_Y0.fg_mode_logic.spd_target_kts;
  A380PrimComputerFg_B.pfd_spd_target_kts = A380PrimComputerFg_P.out_Y0.fg_mode_logic.pfd_spd_target_kts;
  A380PrimComputerFg_B.alt_cstr_applicable = A380PrimComputerFg_P.out_Y0.fg_mode_logic.alt_cstr_applicable;
  A380PrimComputerFg_B.alt_sel_or_cstr = A380PrimComputerFg_P.out_Y0.fg_mode_logic.alt_sel_or_cstr;
  A380PrimComputerFg_B.fmgc_opp_mode_sync = A380PrimComputerFg_P.out_Y0.fg_mode_logic.fmgc_opp_mode_sync;
  A380PrimComputerFg_B.any_ap_fd_engaged = A380PrimComputerFg_P.out_Y0.fg_mode_logic.any_ap_fd_engaged;
  A380PrimComputerFg_B.any_lateral_mode_engaged = A380PrimComputerFg_P.out_Y0.fg_mode_logic.any_lateral_mode_engaged;
  A380PrimComputerFg_B.any_longitudinal_mode_engaged =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.any_longitudinal_mode_engaged;
  A380PrimComputerFg_B.lateral_mode_reset = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_mode_reset;
  A380PrimComputerFg_B.longitudinal_mode_reset = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_mode_reset;
  A380PrimComputerFg_B.hdg_trk_preset_available = A380PrimComputerFg_P.out_Y0.fg_mode_logic.hdg_trk_preset_available;
  A380PrimComputerFg_B.alt_soft_mode_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.alt_soft_mode_active;
  A380PrimComputerFg_B.fd_auto_disengage = A380PrimComputerFg_P.out_Y0.fg_mode_logic.fd_auto_disengage;
  A380PrimComputerFg_B.ap_fd_mode_reversion = A380PrimComputerFg_P.out_Y0.fg_mode_logic.ap_fd_mode_reversion;
  A380PrimComputerFg_B.lateral_mode_reversion = A380PrimComputerFg_P.out_Y0.fg_mode_logic.lateral_mode_reversion;
  A380PrimComputerFg_B.longitudinal_mode_reversion_vs =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_mode_reversion_vs;
  A380PrimComputerFg_B.longitudinal_mode_reversion_op_clb =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.longitudinal_mode_reversion_op_clb;
  A380PrimComputerFg_B.pitch_fd_bars_flashing = A380PrimComputerFg_P.out_Y0.fg_mode_logic.pitch_fd_bars_flashing;
  A380PrimComputerFg_B.roll_fd_bars_flashing = A380PrimComputerFg_P.out_Y0.fg_mode_logic.roll_fd_bars_flashing;
  A380PrimComputerFg_B.loc_bc_selection = A380PrimComputerFg_P.out_Y0.fg_mode_logic.loc_bc_selection;
  A380PrimComputerFg_B.vs_target_not_held = A380PrimComputerFg_P.out_Y0.fg_mode_logic.vs_target_not_held;
  A380PrimComputerFg_B.tcas_vs_target = A380PrimComputerFg_P.out_Y0.fg_mode_logic.tcas_vs_target;
  A380PrimComputerFg_B.tcas_ra_corrective = A380PrimComputerFg_P.out_Y0.fg_mode_logic.tcas_ra_corrective;
  A380PrimComputerFg_B.active_tcas_submode = A380PrimComputerFg_P.out_Y0.fg_mode_logic.active_tcas_submode;
  A380PrimComputerFg_B.tcas_alt_acq_cond = A380PrimComputerFg_P.out_Y0.fg_mode_logic.tcas_alt_acq_cond;
  A380PrimComputerFg_B.tcas_alt_hold_cond = A380PrimComputerFg_P.out_Y0.fg_mode_logic.tcas_alt_hold_cond;
  A380PrimComputerFg_B.tcas_ra_inhibited = A380PrimComputerFg_P.out_Y0.fg_mode_logic.tcas_ra_inhibited;
  A380PrimComputerFg_B.trk_fpa_deselected = A380PrimComputerFg_P.out_Y0.fg_mode_logic.trk_fpa_deselected;
  A380PrimComputerFg_B.longi_large_box_tcas = A380PrimComputerFg_P.out_Y0.fg_mode_logic.longi_large_box_tcas;
  A380PrimComputerFg_B.land_2_capability = A380PrimComputerFg_P.out_Y0.fg_mode_logic.land_2_capability;
  A380PrimComputerFg_B.land_3_fail_passive_capability =
    A380PrimComputerFg_P.out_Y0.fg_mode_logic.land_3_fail_passive_capability;
  A380PrimComputerFg_B.land_3_fail_op_capability = A380PrimComputerFg_P.out_Y0.fg_mode_logic.land_3_fail_op_capability;
  A380PrimComputerFg_B.land_2_inop = A380PrimComputerFg_P.out_Y0.fg_mode_logic.land_2_inop;
  A380PrimComputerFg_B.land_3_fail_passive_inop = A380PrimComputerFg_P.out_Y0.fg_mode_logic.land_3_fail_passive_inop;
  A380PrimComputerFg_B.land_3_fail_op_inop = A380PrimComputerFg_P.out_Y0.fg_mode_logic.land_3_fail_op_inop;
  A380PrimComputerFg_B.tla_to_ga_set = A380PrimComputerFg_P.out_Y0.fg_mode_logic.tla_to_ga_set;
  A380PrimComputerFg_B.true_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.true_active;
  A380PrimComputerFg_B.trk_fpa_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.trk_fpa_active;
  A380PrimComputerFg_B.metric_alt_active = A380PrimComputerFg_P.out_Y0.fg_mode_logic.metric_alt_active;
  A380PrimComputerFg_B.spd_mach_display_value = A380PrimComputerFg_P.out_Y0.fg_mode_logic.spd_mach_display_value;
  A380PrimComputerFg_B.spd_mach_dashes = A380PrimComputerFg_P.out_Y0.fg_mode_logic.spd_mach_dashes;
  A380PrimComputerFg_B.hdg_trk_display_value = A380PrimComputerFg_P.out_Y0.fg_mode_logic.hdg_trk_display_value;
  A380PrimComputerFg_B.hdg_trk_dashes = A380PrimComputerFg_P.out_Y0.fg_mode_logic.hdg_trk_dashes;
  A380PrimComputerFg_B.alt_display_value = A380PrimComputerFg_P.out_Y0.fg_mode_logic.alt_display_value;
  A380PrimComputerFg_B.vs_fpa_display_value = A380PrimComputerFg_P.out_Y0.fg_mode_logic.vs_fpa_display_value;
  A380PrimComputerFg_B.vs_fpa_dashes = A380PrimComputerFg_P.out_Y0.fg_mode_logic.vs_fpa_dashes;
  A380PrimComputerFg_B.Phi_loc_c = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.Phi_loc_c;
  A380PrimComputerFg_B.Nosewheel_c = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.Nosewheel_c;
  A380PrimComputerFg_B.Theta_c_deg = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flight_director.Theta_c_deg;
  A380PrimComputerFg_B.Phi_c_deg = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flight_director.Phi_c_deg;
  A380PrimComputerFg_B.Beta_c_deg = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flight_director.Beta_c_deg;
  A380PrimComputerFg_B.Theta_c_deg_n = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.autopilot.Theta_c_deg;
  A380PrimComputerFg_B.Phi_c_deg_h = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.autopilot.Phi_c_deg;
  A380PrimComputerFg_B.Beta_c_deg_b = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.autopilot.Beta_c_deg;
  A380PrimComputerFg_B.condition_Flare = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flare_law.condition_Flare;
  A380PrimComputerFg_B.H_dot_radio_fpm = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flare_law.H_dot_radio_fpm;
  A380PrimComputerFg_B.H_dot_c_fpm = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flare_law.H_dot_c_fpm;
  A380PrimComputerFg_B.delta_Theta_H_dot_deg =
    A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flare_law.delta_Theta_H_dot_deg;
  A380PrimComputerFg_B.delta_Theta_bz_deg = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flare_law.delta_Theta_bz_deg;
  A380PrimComputerFg_B.delta_Theta_bx_deg = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flare_law.delta_Theta_bx_deg;
  A380PrimComputerFg_B.delta_Theta_beta_c_deg =
    A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_1.flare_law.delta_Theta_beta_c_deg;
  A380PrimComputerFg_B.Phi_loc_c_j = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.Phi_loc_c;
  A380PrimComputerFg_B.Nosewheel_c_f = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.Nosewheel_c;
  A380PrimComputerFg_B.Theta_c_deg_n0 = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flight_director.Theta_c_deg;
  A380PrimComputerFg_B.Phi_c_deg_hj = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flight_director.Phi_c_deg;
  A380PrimComputerFg_B.Beta_c_deg_bp = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flight_director.Beta_c_deg;
  A380PrimComputerFg_B.Theta_c_deg_n03 = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.autopilot.Theta_c_deg;
  A380PrimComputerFg_B.Phi_c_deg_hjv = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.autopilot.Phi_c_deg;
  A380PrimComputerFg_B.Beta_c_deg_bpl = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.autopilot.Beta_c_deg;
  A380PrimComputerFg_B.condition_Flare_n = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flare_law.condition_Flare;
  A380PrimComputerFg_B.H_dot_radio_fpm_p = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flare_law.H_dot_radio_fpm;
  A380PrimComputerFg_B.H_dot_c_fpm_j = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flare_law.H_dot_c_fpm;
  A380PrimComputerFg_B.delta_Theta_H_dot_deg_l =
    A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flare_law.delta_Theta_H_dot_deg;
  A380PrimComputerFg_B.delta_Theta_bz_deg_a = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flare_law.delta_Theta_bz_deg;
  A380PrimComputerFg_B.delta_Theta_bx_deg_j = A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flare_law.delta_Theta_bx_deg;
  A380PrimComputerFg_B.delta_Theta_beta_c_deg_g =
    A380PrimComputerFg_P.out_Y0.fg_laws.ap_fd_2.flare_law.delta_Theta_beta_c_deg;
  A380PrimComputerFg_B.n_1_c_percent = A380PrimComputerFg_P.out_Y0.fg_laws.n_1_c_percent;
  A380PrimComputerFg_B.alignment_dummy = A380PrimComputerFg_P.out_Y0.discrete_outputs.alignment_dummy;
  A380PrimComputerFg_B.elevator_1_active_mode = A380PrimComputerFg_P.out_Y0.discrete_outputs.elevator_1_active_mode;
  A380PrimComputerFg_B.elevator_2_active_mode = A380PrimComputerFg_P.out_Y0.discrete_outputs.elevator_2_active_mode;
  A380PrimComputerFg_B.elevator_3_active_mode = A380PrimComputerFg_P.out_Y0.discrete_outputs.elevator_3_active_mode;
  A380PrimComputerFg_B.ths_active_mode = A380PrimComputerFg_P.out_Y0.discrete_outputs.ths_active_mode;
  A380PrimComputerFg_B.left_aileron_1_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.left_aileron_1_active_mode;
  A380PrimComputerFg_B.left_aileron_2_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.left_aileron_2_active_mode;
  A380PrimComputerFg_B.right_aileron_1_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.right_aileron_1_active_mode;
  A380PrimComputerFg_B.right_aileron_2_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.right_aileron_2_active_mode;
  A380PrimComputerFg_B.left_spoiler_electronic_module_enable =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.left_spoiler_electronic_module_enable;
  A380PrimComputerFg_B.right_spoiler_electronic_module_enable =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.right_spoiler_electronic_module_enable;
  A380PrimComputerFg_B.rudder_1_hydraulic_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.rudder_1_hydraulic_active_mode;
  A380PrimComputerFg_B.rudder_1_electric_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.rudder_1_electric_active_mode;
  A380PrimComputerFg_B.rudder_2_hydraulic_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.rudder_2_hydraulic_active_mode;
  A380PrimComputerFg_B.rudder_2_electric_active_mode =
    A380PrimComputerFg_P.out_Y0.discrete_outputs.rudder_2_electric_active_mode;
  A380PrimComputerFg_B.prim_healthy = A380PrimComputerFg_P.out_Y0.discrete_outputs.prim_healthy;
  A380PrimComputerFg_B.fcu_1_select = A380PrimComputerFg_P.out_Y0.discrete_outputs.fcu_1_select;
  A380PrimComputerFg_B.fcu_2_select = A380PrimComputerFg_P.out_Y0.discrete_outputs.fcu_2_select;
  A380PrimComputerFg_B.ap_engaged = A380PrimComputerFg_P.out_Y0.discrete_outputs.ap_engaged;
  A380PrimComputerFg_B.reverser_tertiary_lock = A380PrimComputerFg_P.out_Y0.discrete_outputs.reverser_tertiary_lock;
  A380PrimComputerFg_B.elevator_1_pos_order_deg = A380PrimComputerFg_P.out_Y0.analog_outputs.elevator_1_pos_order_deg;
  A380PrimComputerFg_B.elevator_2_pos_order_deg = A380PrimComputerFg_P.out_Y0.analog_outputs.elevator_2_pos_order_deg;
  A380PrimComputerFg_B.elevator_3_pos_order_deg = A380PrimComputerFg_P.out_Y0.analog_outputs.elevator_3_pos_order_deg;
  A380PrimComputerFg_B.ths_pos_order_deg = A380PrimComputerFg_P.out_Y0.analog_outputs.ths_pos_order_deg;
  A380PrimComputerFg_B.left_aileron_1_pos_order_deg =
    A380PrimComputerFg_P.out_Y0.analog_outputs.left_aileron_1_pos_order_deg;
  A380PrimComputerFg_B.left_aileron_2_pos_order_deg =
    A380PrimComputerFg_P.out_Y0.analog_outputs.left_aileron_2_pos_order_deg;
  A380PrimComputerFg_B.right_aileron_1_pos_order_deg =
    A380PrimComputerFg_P.out_Y0.analog_outputs.right_aileron_1_pos_order_deg;
  A380PrimComputerFg_B.right_aileron_2_pos_order_deg =
    A380PrimComputerFg_P.out_Y0.analog_outputs.right_aileron_2_pos_order_deg;
  A380PrimComputerFg_B.left_spoiler_pos_order_deg =
    A380PrimComputerFg_P.out_Y0.analog_outputs.left_spoiler_pos_order_deg;
  A380PrimComputerFg_B.right_spoiler_pos_order_deg =
    A380PrimComputerFg_P.out_Y0.analog_outputs.right_spoiler_pos_order_deg;
  A380PrimComputerFg_B.rudder_1_pos_order_deg = A380PrimComputerFg_P.out_Y0.analog_outputs.rudder_1_pos_order_deg;
  A380PrimComputerFg_B.rudder_2_pos_order_deg = A380PrimComputerFg_P.out_Y0.analog_outputs.rudder_2_pos_order_deg;
  A380PrimComputerFg_B.SSM_gzd = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_lu = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_mo = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_dc = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_me = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_gc = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_mj = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_am = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_a5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_dg = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_bt = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFg_B.Data_e1 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFg_B.SSM_om = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFg_B.Data_fp = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_1_command_deg.Data;
  A380PrimComputerFg_B.SSM_ar = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFg_B.Data_ns = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_1_command_deg.Data;
  A380PrimComputerFg_B.SSM_ce = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFg_B.Data_m3 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_2_command_deg.Data;
  A380PrimComputerFg_B.SSM_ed = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFg_B.Data_oj = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_2_command_deg.Data;
  A380PrimComputerFg_B.SSM_je = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFg_B.Data_jy = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_3_command_deg.Data;
  A380PrimComputerFg_B.SSM_jt = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFg_B.Data_j1 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_3_command_deg.Data;
  A380PrimComputerFg_B.SSM_cui = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFg_B.Data_fc = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_4_command_deg.Data;
  A380PrimComputerFg_B.SSM_mq = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFg_B.Data_of = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_4_command_deg.Data;
  A380PrimComputerFg_B.SSM_ni = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFg_B.Data_n4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_5_command_deg.Data;
  A380PrimComputerFg_B.SSM_df = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFg_B.Data_ot = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_5_command_deg.Data;
  A380PrimComputerFg_B.SSM_oe = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFg_B.Data_gv = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_6_command_deg.Data;
  A380PrimComputerFg_B.SSM_ha = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFg_B.Data_ou = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_6_command_deg.Data;
  A380PrimComputerFg_B.SSM_op = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFg_B.Data_dh = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_7_command_deg.Data;
  A380PrimComputerFg_B.SSM_a50 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFg_B.Data_ph = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_7_command_deg.Data;
  A380PrimComputerFg_B.SSM_a4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFg_B.Data_gs = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_8_command_deg.Data;
  A380PrimComputerFg_B.SSM_bv = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFg_B.Data_fd4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_8_command_deg.Data;
  A380PrimComputerFg_B.SSM_bo = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_hm = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_d1 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_i2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_hy = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_fv = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_gi = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFg_B.Data_oc = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFg_B.SSM_pp = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.ths_command_deg.SSM;
  A380PrimComputerFg_B.Data_kq = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.ths_command_deg.Data;
  A380PrimComputerFg_B.SSM_iab = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.upper_rudder_command_deg.SSM;
  A380PrimComputerFg_B.Data_ne = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.upper_rudder_command_deg.Data;
  A380PrimComputerFg_B.SSM_jtv = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.lower_rudder_command_deg.SSM;
  A380PrimComputerFg_B.Data_it = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.lower_rudder_command_deg.Data;
  A380PrimComputerFg_B.SSM_fy = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_ch = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_ars = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFg_B.Data_bb = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFg_B.SSM_din = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_ol = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_m3 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFg_B.Data_hw = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFg_B.SSM_np = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_pedal_position_deg.SSM;
  A380PrimComputerFg_B.Data_hs = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_pedal_position_deg.Data;
  A380PrimComputerFg_B.SSM_ax = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.aileron_status_word.SSM;
  A380PrimComputerFg_B.Data_ky = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.aileron_status_word.Data;
  A380PrimComputerFg_B.SSM_cl = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_h5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_es = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_ku = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_gi1 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_aileron_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_jp = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_aileron_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_jz = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_aileron_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_nu = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_aileron_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_kt = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.spoiler_status_word.SSM;
  A380PrimComputerFg_B.Data_br = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.spoiler_status_word.Data;
  A380PrimComputerFg_B.SSM_eg = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_position_deg.SSM;
  A380PrimComputerFg_B.Data_ae = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.left_spoiler_position_deg.Data;
  A380PrimComputerFg_B.SSM_a0 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_position_deg.SSM;
  A380PrimComputerFg_B.Data_pe = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.right_spoiler_position_deg.Data;
  A380PrimComputerFg_B.SSM_cv = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_status_word.SSM;
  A380PrimComputerFg_B.Data_fy = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_status_word.Data;
  A380PrimComputerFg_B.SSM_ea = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_na = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_p4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_i4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_m2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_3_position_deg.SSM;
  A380PrimComputerFg_B.Data_cx = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.elevator_3_position_deg.Data;
  A380PrimComputerFg_B.SSM_bt0 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.ths_position_deg.SSM;
  A380PrimComputerFg_B.Data_nz = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.ths_position_deg.Data;
  A380PrimComputerFg_B.SSM_nr = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_status_word.SSM;
  A380PrimComputerFg_B.Data_id = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_status_word.Data;
  A380PrimComputerFg_B.SSM_fr = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_1_position_deg.SSM;
  A380PrimComputerFg_B.Data_o2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_1_position_deg.Data;
  A380PrimComputerFg_B.SSM_cc = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_2_position_deg.SSM;
  A380PrimComputerFg_B.Data_gqq = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.rudder_2_position_deg.Data;
  A380PrimComputerFg_B.SSM_mkm = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.radio_height_1_ft.SSM;
  A380PrimComputerFg_B.Data_md = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.radio_height_1_ft.Data;
  A380PrimComputerFg_B.SSM_jhd = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.radio_height_2_ft.SSM;
  A380PrimComputerFg_B.Data_cz = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.radio_height_2_ft.Data;
  A380PrimComputerFg_B.SSM_av = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.fctl_law_status_word.SSM;
  A380PrimComputerFg_B.Data_pm = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.fctl_law_status_word.Data;
  A380PrimComputerFg_B.SSM_ira = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.discrete_status_word_1.SSM;
  A380PrimComputerFg_B.Data_bj = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.discrete_status_word_1.Data;
  A380PrimComputerFg_B.SSM_ge = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.v_alpha_lim_kn.SSM;
  A380PrimComputerFg_B.Data_pe5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.v_alpha_lim_kn.Data;
  A380PrimComputerFg_B.SSM_lv = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.v_alpha_prot_kn.SSM;
  A380PrimComputerFg_B.Data_jj = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.v_alpha_prot_kn.Data;
  A380PrimComputerFg_B.SSM_cg = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.v_alpha_stall_warn_kn.SSM;
  A380PrimComputerFg_B.Data_p5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fctl.v_alpha_stall_warn_kn.Data;
  A380PrimComputerFg_B.SSM_be = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.gamma_a_deg.SSM;
  A380PrimComputerFg_B.Data_ekl = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.gamma_a_deg.Data;
  A380PrimComputerFg_B.SSM_axb = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.gamma_t_deg.SSM;
  A380PrimComputerFg_B.Data_nd = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.gamma_t_deg.Data;
  A380PrimComputerFg_B.SSM_nz = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.sideslip_target_deg.SSM;
  A380PrimComputerFg_B.Data_n2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.sideslip_target_deg.Data;
  A380PrimComputerFg_B.SSM_gh = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_ls_kn.SSM;
  A380PrimComputerFg_B.Data_dl = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_ls_kn.Data;
  A380PrimComputerFg_B.SSM_ks = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_stall_kn.SSM;
  A380PrimComputerFg_B.Data_gs2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_stall_kn.Data;
  A380PrimComputerFg_B.SSM_pw = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.speed_trend_kn.SSM;
  A380PrimComputerFg_B.Data_h4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.speed_trend_kn.Data;
  A380PrimComputerFg_B.SSM_fh = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_3_kn.SSM;
  A380PrimComputerFg_B.Data_e3 = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_3_kn.Data;
  A380PrimComputerFg_B.SSM_gzn = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_4_kn.SSM;
  A380PrimComputerFg_B.Data_an = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_4_kn.Data;
  A380PrimComputerFg_B.SSM_oo = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_man_kn.SSM;
  A380PrimComputerFg_B.Data_i4o = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_man_kn.Data;
  A380PrimComputerFg_B.SSM_evh = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_max_kn.SSM;
  A380PrimComputerFg_B.Data_af = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_max_kn.Data;
  A380PrimComputerFg_B.SSM_cn = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_fe_next_kn.SSM;
  A380PrimComputerFg_B.Data_bm = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.v_fe_next_kn.Data;
  A380PrimComputerFg_B.SSM_co = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_dk = A380PrimComputerFg_P.out_Y0.bus_outputs.fe.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_pe = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pfd_spd_tgt_kts.SSM;
  A380PrimComputerFg_B.Data_nv = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pfd_spd_tgt_kts.Data;
  A380PrimComputerFg_B.SSM_fw = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pfd_short_term_mngd_spd_kts.SSM;
  A380PrimComputerFg_B.Data_jpf = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pfd_short_term_mngd_spd_kts.Data;
  A380PrimComputerFg_B.SSM_h4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_spd_kts.SSM;
  A380PrimComputerFg_B.Data_i5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_spd_kts.Data;
  A380PrimComputerFg_B.SSM_cb3 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_mach_kts.SSM;
  A380PrimComputerFg_B.Data_k2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_mach_kts.Data;
  A380PrimComputerFg_B.SSM_pj = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_hdg_deg.SSM;
  A380PrimComputerFg_B.Data_as = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_hdg_deg.Data;
  A380PrimComputerFg_B.SSM_dv = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_trk_deg.SSM;
  A380PrimComputerFg_B.Data_jl = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_trk_deg.Data;
  A380PrimComputerFg_B.SSM_i4 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_alt_ft.SSM;
  A380PrimComputerFg_B.Data_e32 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_alt_ft.Data;
  A380PrimComputerFg_B.SSM_fm = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_vs_ft_min.SSM;
  A380PrimComputerFg_B.Data_ih = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_vs_ft_min.Data;
  A380PrimComputerFg_B.SSM_e5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_fpa_deg.SSM;
  A380PrimComputerFg_B.Data_du = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.selected_fpa_deg.Data;
  A380PrimComputerFg_B.SSM_bf = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.runway_hdg_memorized_deg.SSM;
  A380PrimComputerFg_B.Data_nx = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.runway_hdg_memorized_deg.Data;
  A380PrimComputerFg_B.SSM_fd = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.preset_mach_from_fms.SSM;
  A380PrimComputerFg_B.Data_n0 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.preset_mach_from_fms.Data;
  A380PrimComputerFg_B.SSM_dt = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.preset_speed_from_fms_kts.SSM;
  A380PrimComputerFg_B.Data_eqi = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.preset_speed_from_fms_kts.Data;
  A380PrimComputerFg_B.SSM_j5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.roll_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_om = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.roll_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_ng = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pitch_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_nr = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pitch_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_cs = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.yaw_fd_command_1.SSM;
  A380PrimComputerFg_B.Data_p3 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.yaw_fd_command_1.Data;
  A380PrimComputerFg_B.SSM_ls = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.roll_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_hd = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.roll_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_dg = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pitch_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_al = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.pitch_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_d3 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.yaw_fd_command_2.SSM;
  A380PrimComputerFg_B.Data_gu = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.yaw_fd_command_2.Data;
  A380PrimComputerFg_B.SSM_p2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_5.SSM;
  A380PrimComputerFg_B.Data_ix = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_5.Data;
  A380PrimComputerFg_B.SSM_bo0 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_4.SSM;
  A380PrimComputerFg_B.Data_do = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_4.Data;
  A380PrimComputerFg_B.SSM_bc = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.fm_alt_constraint_ft.SSM;
  A380PrimComputerFg_B.Data_hu = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.fm_alt_constraint_ft.Data;
  A380PrimComputerFg_B.SSM_giz = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.ats_discrete_word.SSM;
  A380PrimComputerFg_B.Data_pm1 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.ats_discrete_word.Data;
  A380PrimComputerFg_B.SSM_mqp = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.ats_fma_discrete_word.SSM;
  A380PrimComputerFg_B.Data_i2y = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.ats_fma_discrete_word.Data;
  A380PrimComputerFg_B.SSM_ba = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_3.SSM;
  A380PrimComputerFg_B.Data_pg = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_3.Data;
  A380PrimComputerFg_B.SSM_in = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_1.SSM;
  A380PrimComputerFg_B.Data_ni = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_1.Data;
  A380PrimComputerFg_B.SSM_ff = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_2.SSM;
  A380PrimComputerFg_B.Data_cn = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_2.Data;
  A380PrimComputerFg_B.SSM_ic = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_6.SSM;
  A380PrimComputerFg_B.Data_nxl = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_6.Data;
  A380PrimComputerFg_B.SSM_fs = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.low_target_speed_margin_kts.SSM;
  A380PrimComputerFg_B.Data_jh = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.low_target_speed_margin_kts.Data;
  A380PrimComputerFg_B.SSM_ja = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.high_target_speed_margin_kts.SSM;
  A380PrimComputerFg_B.Data_gl = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.high_target_speed_margin_kts.Data;
  A380PrimComputerFg_B.SSM_js = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.nosewheel_cmd_deg.SSM;
  A380PrimComputerFg_B.Data_gn = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.nosewheel_cmd_deg.Data;
  A380PrimComputerFg_B.SSM_is3 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.n1_command_percent.SSM;
  A380PrimComputerFg_B.Data_myb = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.n1_command_percent.Data;
  A380PrimComputerFg_B.SSM_f5 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.flx_to_temp_deg_c.SSM;
  A380PrimComputerFg_B.Data_l2 = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.flx_to_temp_deg_c.Data;
  A380PrimComputerFg_B.SSM_ph = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_7.SSM;
  A380PrimComputerFg_B.Data_o5o = A380PrimComputerFg_P.out_Y0.bus_outputs.fg.discrete_word_7.Data;
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
