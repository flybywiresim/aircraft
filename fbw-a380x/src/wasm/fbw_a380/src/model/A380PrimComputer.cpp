#include "A380PrimComputer.h"
#include "rtwtypes.h"
#include "A380PrimComputer_types.h"
#include <cmath>
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"
#include "A380LateralNormalLaw.h"
#include "A380LateralDirectLaw.h"
#include "A380PitchNormalLaw.h"
#include "A380PitchAlternateLaw.h"
#include "A380PitchDirectLaw.h"

const uint8_T A380PrimComputer_IN_Flying{ 1U };

const uint8_T A380PrimComputer_IN_Landed{ 2U };

const uint8_T A380PrimComputer_IN_Landing100ft{ 3U };

const uint8_T A380PrimComputer_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PrimComputer_IN_Takeoff100ft{ 4U };

const real_T A380PrimComputer_RGND{ 0.0 };

void A380PrimComputer::A380PrimComputer_RateLimiter_Reset(rtDW_RateLimiter_A380PrimComputer_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputer_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380PrimComputer::A380PrimComputer_RateLimiter_b_Reset(rtDW_RateLimiter_A380PrimComputer_g_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_RateLimiter_a(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputer_g_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_init;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void A380PrimComputer::A380PrimComputer_RateLimiter_bb_Reset(rtDW_RateLimiter_A380PrimComputer_d_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_RateLimiter_m(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputer_d_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_init;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void A380PrimComputer::A380PrimComputer_RateLimiter_o_Reset(rtDW_RateLimiter_A380PrimComputer_i_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_RateLimiter_c(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputer_i_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_u;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_u;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void A380PrimComputer::A380PrimComputer_Spoiler345Computation(real_T rtu_xiSplr, real_T rtu_speedBrakeDeflection, real_T
  *rty_leftCommand, real_T *rty_rightCommand)
{
  real_T leftCommand;
  real_T rightCommand;
  if (rtu_xiSplr >= 0.0) {
    leftCommand = rtu_speedBrakeDeflection - rtu_xiSplr;
    rightCommand = rtu_speedBrakeDeflection;
  } else {
    leftCommand = rtu_speedBrakeDeflection;
    rightCommand = rtu_speedBrakeDeflection + rtu_xiSplr;
  }

  *rty_leftCommand = std::fmax(leftCommand - (rightCommand - std::fmax(rightCommand, -45.0)), -45.0);
  *rty_rightCommand = std::fmax(rightCommand - (leftCommand - std::fmax(leftCommand, -45.0)), -45.0);
}

void A380PrimComputer::A380PrimComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_e(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_o(boolean_T rtu_bit1, boolean_T rtu_bit2, boolean_T rtu_bit3,
  boolean_T rtu_bit4, boolean_T rtu_bit5, boolean_T rtu_bit6, real_T *rty_handleIndex)
{
  if (rtu_bit1) {
    *rty_handleIndex = 0.0;
  } else if (rtu_bit2 && rtu_bit6) {
    *rty_handleIndex = 1.0;
  } else if (rtu_bit2 && (!rtu_bit6)) {
    *rty_handleIndex = 2.0;
  } else if (rtu_bit3) {
    *rty_handleIndex = 3.0;
  } else if (rtu_bit4) {
    *rty_handleIndex = 4.0;
  } else if (rtu_bit5) {
    *rty_handleIndex = 5.0;
  } else {
    *rty_handleIndex = 0.0;
  }
}

void A380PrimComputer::A380PrimComputer_LagFilter_Reset(rtDW_LagFilter_A380PrimComputer_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PrimComputer_T *localDW)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_c_Reset(rtDW_MATLABFunction_A380PrimComputer_o_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_A380PrimComputer_o_T *localDW)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_ge_Reset(rtDW_MATLABFunction_A380PrimComputer_hg_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputer_hg_T *localDW)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_d_Reset(rtDW_MATLABFunction_A380PrimComputer_c_T *localDW)
{
  localDW->output = false;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_n(real_T rtu_u, real_T rtu_highTrigger, real_T rtu_lowTrigger,
  boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputer_c_T *localDW)
{
  boolean_T output_tmp;
  output_tmp = !localDW->output;
  localDW->output = ((output_tmp && (rtu_u >= rtu_highTrigger)) || ((output_tmp || (rtu_u > rtu_lowTrigger)) &&
    localDW->output));
  *rty_y = localDW->output;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_ek(boolean_T rtu_bit1, boolean_T rtu_bit2, boolean_T rtu_bit3,
  boolean_T rtu_valid, a380_pitch_efcs_law *rty_law)
{
  boolean_T tmp;
  boolean_T tmp_0;
  boolean_T tmp_1;
  boolean_T tmp_2;
  tmp_0 = !rtu_bit1;
  tmp_2 = !rtu_bit2;
  tmp = (tmp_0 && tmp_2);
  tmp_1 = !rtu_bit3;
  if ((tmp && tmp_1) || (!rtu_valid)) {
    *rty_law = a380_pitch_efcs_law::None;
  } else if (tmp && rtu_bit3) {
    *rty_law = a380_pitch_efcs_law::NormalLaw;
  } else {
    tmp_0 = (tmp_0 && rtu_bit2);
    if (tmp_0 && tmp_1) {
      *rty_law = a380_pitch_efcs_law::AlternateLaw1A;
    } else if (tmp_0 && rtu_bit3) {
      *rty_law = a380_pitch_efcs_law::AlternateLaw1B;
    } else if (rtu_bit1 && tmp_2 && tmp_1) {
      *rty_law = a380_pitch_efcs_law::AlternateLaw1C;
    } else if (rtu_bit1 && rtu_bit2 && tmp_1) {
      *rty_law = a380_pitch_efcs_law::DirectLaw;
    } else {
      *rty_law = a380_pitch_efcs_law::None;
    }
  }
}

void A380PrimComputer::A380PrimComputer_GetIASforMach4(real_T rtu_m, real_T rtu_m_t, real_T rtu_v, real_T *rty_v_t)
{
  *rty_v_t = rtu_v * rtu_m_t / rtu_m;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_i(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_b(a380_pitch_efcs_law rtu_law, boolean_T *rty_bit1, boolean_T
  *rty_bit2, boolean_T *rty_bit3)
{
  switch (rtu_law) {
   case a380_pitch_efcs_law::None:
    *rty_bit1 = false;
    *rty_bit2 = false;
    *rty_bit3 = false;
    break;

   case a380_pitch_efcs_law::NormalLaw:
    *rty_bit1 = false;
    *rty_bit2 = false;
    *rty_bit3 = true;
    break;

   case a380_pitch_efcs_law::AlternateLaw1A:
    *rty_bit1 = false;
    *rty_bit2 = true;
    *rty_bit3 = false;
    break;

   case a380_pitch_efcs_law::AlternateLaw1B:
    *rty_bit1 = false;
    *rty_bit2 = true;
    *rty_bit3 = true;
    break;

   case a380_pitch_efcs_law::AlternateLaw1C:
    *rty_bit1 = true;
    *rty_bit2 = false;
    *rty_bit3 = false;
    break;

   case a380_pitch_efcs_law::AlternateLaw2:
    *rty_bit1 = true;
    *rty_bit2 = false;
    *rty_bit3 = true;
    break;

   default:
    *rty_bit1 = true;
    *rty_bit2 = true;
    *rty_bit3 = false;
    break;
  }
}

void A380PrimComputer::A380PrimComputer_MATLABFunction2(a380_lateral_efcs_law rtu_law, boolean_T *rty_bit1, boolean_T
  *rty_bit2)
{
  switch (rtu_law) {
   case a380_lateral_efcs_law::None:
    *rty_bit1 = false;
    *rty_bit2 = false;
    break;

   case a380_lateral_efcs_law::NormalLaw:
    *rty_bit1 = true;
    *rty_bit2 = false;
    break;

   default:
    *rty_bit1 = false;
    *rty_bit2 = true;
    break;
  }
}

void A380PrimComputer::step()
{
  real_T rtb_xi_inboard_deg;
  real_T rtb_xi_midboard_deg;
  real_T rtb_xi_outboard_deg;
  real_T rtb_xi_spoiler_deg;
  real_T rtb_zeta_upper_deg;
  real_T rtb_zeta_lower_deg;
  real_T rtb_xi_inboard_deg_n;
  real_T rtb_xi_midboard_deg_a;
  real_T rtb_xi_outboard_deg_l;
  real_T rtb_xi_spoiler_deg_i;
  real_T rtb_zeta_upper_deg_p;
  real_T rtb_zeta_lower_deg_n;
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_dot_deg_s;
  real_T rtb_eta_trim_limit_lo;
  real_T rtb_eta_trim_limit_up;
  real_T rtb_eta_deg_o;
  real_T rtb_eta_trim_dot_deg_s_a;
  real_T rtb_eta_trim_limit_lo_h;
  real_T rtb_eta_trim_limit_up_d;
  const base_arinc_429 *rtb_Switch_ir_0;
  real_T abs_rate_c;
  real_T rtb_BusAssignment_nw_logic_alpha_max_deg;
  real_T rtb_BusAssignment_nw_logic_high_speed_prot_hi_thresh_kn;
  real_T rtb_BusAssignment_nw_logic_high_speed_prot_lo_thresh_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
  real_T rtb_Gain_f;
  real_T rtb_Sum6;
  real_T rtb_Switch10_n;
  real_T rtb_Switch1_k;
  real_T rtb_Switch4_d;
  real_T rtb_Switch6_i;
  real_T rtb_Switch7_e;
  real_T rtb_Switch8_o;
  real_T rtb_Switch9_f;
  real_T rtb_Switch_h;
  real_T rtb_Y;
  real_T rtb_Y_dc;
  real_T rtb_elevator1Command;
  real_T rtb_elevator2Command;
  real_T rtb_elevator3Command;
  real_T rtb_eta_deg_dv;
  real_T rtb_eta_trim_dot_deg_s_n;
  real_T rtb_eta_trim_limit_lo_d;
  real_T rtb_eta_trim_limit_up_m;
  real_T rtb_handleIndex;
  real_T rtb_handleIndex_b;
  real_T rtb_leftInboardAilPos;
  real_T rtb_leftInboardElevPos;
  real_T rtb_leftMidboardAilPos;
  real_T rtb_leftOutboardAilPos;
  real_T rtb_leftOutboardElevPos;
  real_T rtb_leftSplr4Pos;
  real_T rtb_leftSplr5Pos;
  real_T rtb_leftSplr6Pos;
  real_T rtb_leftSpoilerCommand;
  real_T rtb_left_inboard_aileron_deg;
  real_T rtb_left_midboard_aileron_deg;
  real_T rtb_left_spoiler_2_deg;
  real_T rtb_left_spoiler_3_deg;
  real_T rtb_lowerRudderPos;
  real_T rtb_outerAilLowerLim;
  real_T rtb_outerAilUpperLim;
  real_T rtb_rightAileron2Command;
  real_T rtb_rightInboardAilPos;
  real_T rtb_rightInboardElevPos;
  real_T rtb_rightMidboardAilPos;
  real_T rtb_rightOutboardAilPos;
  real_T rtb_rightOutboardElevPos;
  real_T rtb_rightSplr4Pos;
  real_T rtb_rightSplr5Pos;
  real_T rtb_rightSplr6Pos;
  real_T rtb_rightSpoilerCommand;
  real_T rtb_right_inboard_aileron_deg;
  real_T rtb_right_midboard_aileron_deg;
  real_T rtb_right_outboard_aileron_deg;
  real_T rtb_right_spoiler_2_deg;
  real_T rtb_right_spoiler_3_deg;
  real_T rtb_rudder2Command;
  real_T rtb_speedBrakeGain;
  real_T rtb_thsPos;
  real_T rtb_upperRudderPos;
  real_T rtb_xi_spoiler_deg_b;
  real_T u0;
  real_T u0_0;
  int32_T b_nz;
  int32_T iindx;
  int32_T nz;
  int32_T prim3LawCap;
  int32_T rtb_left_inboard_elevator_command_deg_SSM;
  int32_T rtb_left_outboard_aileron_command_deg_SSM;
  int32_T rtb_left_outboard_elevator_command_deg_SSM;
  int32_T rtb_left_spoiler_1_command_deg_SSM;
  int32_T rtb_left_spoiler_2_command_deg_SSM;
  int32_T rtb_left_spoiler_3_command_deg_SSM;
  int32_T rtb_left_spoiler_4_command_deg_SSM;
  int32_T rtb_left_spoiler_5_command_deg_SSM;
  int32_T rtb_left_spoiler_6_command_deg_SSM;
  int32_T rtb_left_spoiler_7_command_deg_SSM;
  int32_T rtb_left_spoiler_8_command_deg_SSM;
  int32_T rtb_right_inboard_elevator_command_deg_SSM;
  int32_T rtb_right_outboard_aileron_command_deg_SSM;
  int32_T rtb_right_outboard_elevator_command_deg_SSM;
  int32_T rtb_right_spoiler_1_command_deg_SSM;
  int32_T rtb_right_spoiler_2_command_deg_SSM;
  int32_T rtb_right_spoiler_3_command_deg_SSM;
  int32_T rtb_right_spoiler_4_command_deg_SSM;
  int32_T rtb_right_spoiler_5_command_deg_SSM;
  int32_T rtb_right_spoiler_6_command_deg_SSM;
  int32_T rtb_right_spoiler_7_command_deg_SSM;
  int32_T rtb_right_spoiler_8_command_deg_SSM;
  int32_T rtb_ths_command_deg_SSM;
  real32_T rtb_Switch_g_idx_0;
  real32_T rtb_Switch_g_idx_1;
  real32_T rtb_Switch_g_idx_2;
  real32_T rtb_Switch_g_idx_3;
  real32_T rtb_Switch_left_inboard_aileron_command_deg_Data;
  real32_T rtb_Switch_left_midboard_aileron_command_deg_Data;
  real32_T rtb_Switch_left_outboard_aileron_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_1_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_2_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_3_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_4_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_5_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_6_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_7_command_deg_Data;
  real32_T rtb_Switch_left_spoiler_8_command_deg_Data;
  real32_T rtb_Switch_lower_rudder_command_deg_Data;
  real32_T rtb_Switch_right_inboard_aileron_command_deg_Data;
  real32_T rtb_Switch_right_midboard_aileron_command_deg_Data;
  real32_T rtb_Switch_right_outboard_aileron_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_1_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_2_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_3_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_4_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_5_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_6_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_7_command_deg_Data;
  real32_T rtb_Switch_right_spoiler_8_command_deg_Data;
  real32_T rtb_Switch_upper_rudder_command_deg_Data;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_mach;
  real32_T rtb_n_x;
  real32_T rtb_n_y;
  real32_T rtb_n_z;
  real32_T rtb_phi;
  real32_T rtb_phi_dot;
  real32_T rtb_q;
  real32_T rtb_r;
  real32_T rtb_raComputationValue;
  real32_T rtb_theta_dot;
  uint32_T rtb_DataTypeConversion1_j;
  uint32_T rtb_Switch29;
  uint32_T rtb_Switch31;
  uint32_T rtb_y_a;
  uint32_T rtb_y_i4;
  uint32_T rtb_y_m;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_ep[19];
  boolean_T b_x[6];
  boolean_T elevator1Avail;
  boolean_T elevator2Avail;
  boolean_T leftAileron2Avail;
  boolean_T leftInboardElevEngaged;
  boolean_T leftSpoilerElectricModeAvail;
  boolean_T leftSpoilerHydraulicModeAvail;
  boolean_T rightSpoilerElectricModeAvail;
  boolean_T rightSpoilerHydraulicModeAvail;
  boolean_T rtb_AND10;
  boolean_T rtb_AND10_b;
  boolean_T rtb_AND11;
  boolean_T rtb_AND12;
  boolean_T rtb_AND13;
  boolean_T rtb_AND15;
  boolean_T rtb_AND15_l;
  boolean_T rtb_AND16;
  boolean_T rtb_AND16_n;
  boolean_T rtb_AND17;
  boolean_T rtb_AND18_c;
  boolean_T rtb_AND19;
  boolean_T rtb_AND1_at;
  boolean_T rtb_AND1_ci;
  boolean_T rtb_AND1_e;
  boolean_T rtb_AND20;
  boolean_T rtb_AND2_ac;
  boolean_T rtb_AND2_i;
  boolean_T rtb_AND3;
  boolean_T rtb_AND3_h;
  boolean_T rtb_AND4_d;
  boolean_T rtb_AND4_f;
  boolean_T rtb_AND4_fg3;
  boolean_T rtb_AND5_e;
  boolean_T rtb_AND6_o;
  boolean_T rtb_AND7;
  boolean_T rtb_AND7_d;
  boolean_T rtb_AND8;
  boolean_T rtb_AND9;
  boolean_T rtb_AND9_o;
  boolean_T rtb_AND_e;
  boolean_T rtb_AND_n;
  boolean_T rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
  boolean_T rtb_BusAssignment_j_logic_is_yellow_hydraulic_power_avail;
  boolean_T rtb_BusAssignment_p_logic_spoiler_lift_active;
  boolean_T rtb_DataTypeConversion_m5;
  boolean_T rtb_NOT_k;
  boolean_T rtb_OR;
  boolean_T rtb_OR1;
  boolean_T rtb_OR3;
  boolean_T rtb_OR4;
  boolean_T rtb_OR6;
  boolean_T rtb_OR7;
  boolean_T rtb_OR_b;
  boolean_T rtb_aileronAntidroopActive;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_doubleIrFault;
  boolean_T rtb_doubleIrFault_tmp;
  boolean_T rtb_leftSpoilerElectricModeEngaged;
  boolean_T rtb_leftSpoilerHydraulicModeEngaged;
  boolean_T rtb_ra2Invalid;
  boolean_T rtb_rightAileron2Engaged;
  boolean_T rtb_rightSpoilerElectricModeEngaged;
  boolean_T rtb_rightSpoilerHydraulicModeEngaged;
  boolean_T rtb_rudder1HydraulicModeEngaged;
  boolean_T rtb_rudder2HydraulicModeEngaged;
  boolean_T rtb_thsEngaged;
  boolean_T rtb_tripleAdrFault;
  boolean_T rtb_tripleIrFault;
  boolean_T rtb_y_av;
  boolean_T rtb_y_fa;
  boolean_T rtb_y_fl;
  boolean_T rtb_y_g;
  boolean_T rtb_y_lu;
  boolean_T rtb_y_nl;
  boolean_T rudder1ElectricModeAvail;
  boolean_T rudder1HydraulicModeAvail;
  boolean_T rudder1HydraulicModeHasPriority;
  boolean_T rudder2ElectricModeHasPriority;
  boolean_T rudder2HydraulicModeHasPriority;
  boolean_T thsAvail;
  a380_lateral_efcs_law rtb_activeLateralLaw;
  a380_pitch_efcs_law rtb_law;
  a380_pitch_efcs_law rtb_law_k;
  a380_pitch_efcs_law rtb_pitchLawCapability;
  if (A380PrimComputer_U.in.sim_data.computer_running) {
    if (!A380PrimComputer_DWork.Runtime_MODE) {
      A380PrimComputer_DWork.Delay_DSTATE_cc = A380PrimComputer_P.Delay_InitialCondition;
      A380PrimComputer_DWork.Delay1_DSTATE = A380PrimComputer_P.Delay1_InitialCondition;
      A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.SRFlipFlop_initial_condition;
      A380PrimComputer_DWork.Memory_PreviousInput_a = A380PrimComputer_P.SRFlipFlop1_initial_condition;
      A380PrimComputer_DWork.Delay1_DSTATE_b = A380PrimComputer_P.Delay1_InitialCondition_n;
      A380PrimComputer_DWork.Delay2_DSTATE = A380PrimComputer_P.Delay2_InitialCondition;
      A380PrimComputer_DWork.Delay3_DSTATE = A380PrimComputer_P.Delay3_InitialCondition;
      A380PrimComputer_DWork.Delay_DSTATE_e = A380PrimComputer_P.Delay_InitialCondition_o;
      A380PrimComputer_DWork.Memory_PreviousInput_d = A380PrimComputer_P.SRFlipFlop1_initial_condition_i;
      A380PrimComputer_DWork.Memory_PreviousInput_j = A380PrimComputer_P.SRFlipFlop_initial_condition_i;
      A380PrimComputer_DWork.Delay_DSTATE = A380PrimComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380PrimComputer_DWork.icLoad = true;
      A380PrimComputer_LagFilter_Reset(&A380PrimComputer_DWork.sf_LagFilter_a);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jz);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_lf);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jl);
      A380PrimComputer_DWork.ra1CoherenceRejected = false;
      A380PrimComputer_DWork.ra2CoherenceRejected = false;
      A380PrimComputer_DWork.configFullEventTime_not_empty = false;
      A380PrimComputer_MATLABFunction_d_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_nj);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_cx);
      A380PrimComputer_MATLABFunction_d_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_e1);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_kq);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_nb);
      A380PrimComputer_DWork.abnormalConditionWasActive = false;
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_g4);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_nu);
      A380PrimComputer_DWork.pLeftStickDisabled = false;
      A380PrimComputer_DWork.pRightStickDisabled = false;
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_j2);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_g24);
      A380PrimComputer_RateLimiter_o_Reset(&A380PrimComputer_DWork.sf_RateLimiter_ne);
      A380PrimComputer_DWork.eventTime_not_empty_i = false;
      A380PrimComputer_RateLimiter_o_Reset(&A380PrimComputer_DWork.sf_RateLimiter_mr);
      A380PrimComputer_DWork.sProtActive = false;
      A380PrimComputer_DWork.resetEventTime_not_empty = false;
      A380PrimComputer_DWork.sProtActive_l = false;
      A380PrimComputer_DWork.is_active_c28_A380PrimComputer = 0U;
      A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_NO_ACTIVE_CHILD;
      A380PrimComputer_DWork.eventTime_not_empty = false;
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_al4);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ny);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_gc);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_m1);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ff);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ky);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_dmh);
      LawMDLOBJ2.reset();
      LawMDLOBJ1.reset();
      A380PrimComputer_RateLimiter_Reset(&A380PrimComputer_DWork.sf_RateLimiter);
      A380PrimComputer_RateLimiter_Reset(&A380PrimComputer_DWork.sf_RateLimiter_b);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_a);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_n);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_f);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_au);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_mn);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_lm);
      A380PrimComputer_RateLimiter_Reset(&A380PrimComputer_DWork.sf_RateLimiter_c);
      A380PrimComputer_RateLimiter_Reset(&A380PrimComputer_DWork.sf_RateLimiter_g);
      A380PrimComputer_RateLimiter_o_Reset(&A380PrimComputer_DWork.sf_RateLimiter_h);
      A380PrimComputer_RateLimiter_bb_Reset(&A380PrimComputer_DWork.sf_RateLimiter_me);
      A380PrimComputer_RateLimiter_bb_Reset(&A380PrimComputer_DWork.sf_RateLimiter_md);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_j4);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_cd);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_l);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_d);
      A380PrimComputer_RateLimiter_o_Reset(&A380PrimComputer_DWork.sf_RateLimiter_mv);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_gr);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_nh);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_c5);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_m);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_n2);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_j);
      A380PrimComputer_RateLimiter_o_Reset(&A380PrimComputer_DWork.sf_RateLimiter_cp);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_k);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_bo);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_i);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_f1);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_gm);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_nl);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_np);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_iy);
      A380PrimComputer_LagFilter_Reset(&A380PrimComputer_DWork.sf_LagFilter);
      LawMDLOBJ5.reset();
      LawMDLOBJ3.reset();
      LawMDLOBJ4.reset();
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_cr);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_p);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_cda);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_ph);
      A380PrimComputer_DWork.Runtime_MODE = true;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit, &rtb_y_a);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit, &rtb_DataTypeConversion1_j);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit, &rtb_Switch31);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel6_bit, &rtb_Switch29);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel7_bit, &rtb_y_i4);
    if (!A380PrimComputer_P.Constant_Value_cc) {
      if (rtb_y_a != 0U) {
        rtb_Switch_g_idx_0 = 0.0F;
      } else if ((rtb_y_m != 0U) && (rtb_y_i4 != 0U)) {
        rtb_Switch_g_idx_0 = 1.0F;
      } else if ((rtb_y_m != 0U) && (rtb_y_i4 == 0U)) {
        rtb_Switch_g_idx_0 = 2.0F;
      } else if (rtb_DataTypeConversion1_j != 0U) {
        rtb_Switch_g_idx_0 = 3.0F;
      } else if (rtb_Switch31 != 0U) {
        rtb_Switch_g_idx_0 = 4.0F;
      } else if (rtb_Switch29 != 0U) {
        rtb_Switch_g_idx_0 = 5.0F;
      } else {
        rtb_Switch_g_idx_0 = 0.0F;
      }

      rtb_Switch_g_idx_1 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
      rtb_Switch_g_idx_2 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
      rtb_Switch_g_idx_3 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    } else if (A380PrimComputer_P.Constant5_Value_i) {
      rtb_Switch_g_idx_0 = A380PrimComputer_P.Constant2_Value_i;
      rtb_Switch_g_idx_1 = A380PrimComputer_P.Constant3_Value_e;
      rtb_Switch_g_idx_2 = A380PrimComputer_P.Constant6_Value_a;
      rtb_Switch_g_idx_3 = A380PrimComputer_P.Constant4_Value_iq;
    } else {
      rtb_Switch_g_idx_0 = A380PrimComputer_P.Constant1_Value_i;
      rtb_Switch_g_idx_1 = A380PrimComputer_P.Constant1_Value_i;
      rtb_Switch_g_idx_2 = A380PrimComputer_P.Constant1_Value_i;
      rtb_Switch_g_idx_3 = A380PrimComputer_P.Constant1_Value_i;
    }

    rtb_OR1 = ((A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380PrimComputer_P.Constant1_Value_b ||
               A380PrimComputer_P.Constant1_Value_b);
    rtb_OR3 = ((A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380PrimComputer_P.Constant1_Value_b ||
               A380PrimComputer_P.Constant1_Value_b);
    rtb_OR4 = ((A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380PrimComputer_P.Constant1_Value_b ||
               A380PrimComputer_P.Constant1_Value_b);
    rtb_ra2Invalid = (rtb_OR1 && rtb_OR3);
    rtb_doubleAdrFault = (rtb_ra2Invalid || (rtb_OR1 && rtb_OR4) || (rtb_OR3 && rtb_OR4));
    rtb_tripleAdrFault = (rtb_ra2Invalid && rtb_OR4);
    rtb_OR = ((A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM
               != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM != static_cast<
               uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) ||
              (A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || A380PrimComputer_P.Constant_Value_ad);
    rtb_OR6 = ((A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM
                != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || A380PrimComputer_P.Constant_Value_ad);
    rtb_OR7 = ((A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM
                != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || A380PrimComputer_P.Constant_Value_ad);
    rtb_tripleIrFault = (rtb_OR && rtb_OR6);
    rtb_doubleIrFault_tmp = (rtb_OR && rtb_OR7);
    rtb_doubleIrFault = (rtb_tripleIrFault || rtb_doubleIrFault_tmp || (rtb_OR6 && rtb_OR7));
    rtb_tripleIrFault = (rtb_tripleIrFault && rtb_OR7);
    rtb_AND2_i = !rtb_OR4;
    rtb_y_g = !rtb_OR3;
    leftAileron2Avail = (rtb_OR1 && rtb_y_g);
    if (leftAileron2Avail && rtb_AND2_i) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data +
                  A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else {
      rtb_OR1 = !rtb_OR1;
      rtb_OR3 = (rtb_OR1 && rtb_OR3);
      if (rtb_OR3 && rtb_AND2_i) {
        rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                     A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
        rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                     A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
        rtb_mach = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                    A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
        rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                     A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
      } else {
        rtb_y_g = (rtb_OR1 && rtb_y_g);
        if ((rtb_y_g && rtb_AND2_i) || (rtb_y_g && rtb_OR4)) {
          rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                       A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
          rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                       A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
          rtb_mach = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                      A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data) / 2.0F;
          rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                       A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
        } else if (rtb_OR3 && rtb_OR4) {
          rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
          rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
          rtb_mach = A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
        } else if (leftAileron2Avail && rtb_OR4) {
          rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
          rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
          rtb_mach = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
        } else if (rtb_ra2Invalid && rtb_AND2_i) {
          rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
          rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
          rtb_mach = A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
        } else {
          rtb_V_ias = 0.0F;
          rtb_V_tas = 0.0F;
          rtb_mach = 0.0F;
          rtb_alpha = 0.0F;
        }
      }
    }

    A380PrimComputer_LagFilter(static_cast<real_T>(rtb_alpha), A380PrimComputer_P.LagFilter_C1,
      A380PrimComputer_U.in.time.dt, &rtb_Y, &A380PrimComputer_DWork.sf_LagFilter_a);
    rtb_eta_deg_dv = rtb_V_ias;
    rtb_eta_trim_dot_deg_s_n = rtb_V_tas;
    rtb_eta_trim_limit_lo_d = rtb_mach;
    rtb_AND2_i = !rtb_OR6;
    rtb_y_g = !rtb_OR7;
    leftAileron2Avail = (rtb_OR && rtb_y_g);
    if (leftAileron2Avail && rtb_AND2_i) {
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data +
                 A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data +
               A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data +
               A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data +
                 A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data +
                 A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data +
                 A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data +
                       A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data +
                     A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else {
      rtb_OR1 = !rtb_OR;
      rtb_OR3 = (rtb_OR1 && rtb_OR7);
      if (rtb_OR3 && rtb_AND2_i) {
        rtb_alpha = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                     A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data) / 2.0F;
        rtb_phi = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data) / 2.0F;
        rtb_q = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
                 A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data) / 2.0F;
        rtb_r = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
                 A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data) / 2.0F;
        rtb_n_x = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                   A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data) / 2.0F;
        rtb_n_y = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                   A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data) / 2.0F;
        rtb_n_z = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                   A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data) / 2.0F;
        rtb_theta_dot = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                         A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data) / 2.0F;
        rtb_phi_dot = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                       A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data) / 2.0F;
      } else {
        rtb_y_g = (rtb_OR1 && rtb_y_g);
        if ((rtb_y_g && rtb_AND2_i) || (rtb_y_g && rtb_OR6)) {
          rtb_alpha = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                       A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) / 2.0F;
          rtb_phi = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                     A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) / 2.0F;
          rtb_q = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
                   A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) / 2.0F;
          rtb_r = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
                   A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) / 2.0F;
          rtb_n_x = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                     A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) / 2.0F;
          rtb_n_y = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                     A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) / 2.0F;
          rtb_n_z = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                     A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) / 2.0F;
          rtb_theta_dot = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                           A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) / 2.0F;
          rtb_phi_dot = (A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                         A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) / 2.0F;
        } else if (rtb_OR3 && rtb_OR6) {
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
          rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
          rtb_q = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
          rtb_r = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
          rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
          rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
          rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
        } else if (leftAileron2Avail && rtb_OR6) {
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
          rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
          rtb_q = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
          rtb_r = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
          rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
          rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
          rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
        } else if (rtb_doubleIrFault_tmp && rtb_AND2_i) {
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
          rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
          rtb_q = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
          rtb_r = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
          rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
          rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
          rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
        } else {
          rtb_alpha = 0.0F;
          rtb_phi = 0.0F;
          rtb_q = 0.0F;
          rtb_r = 0.0F;
          rtb_n_x = 0.0F;
          rtb_n_y = 0.0F;
          rtb_n_z = 0.0F;
          rtb_theta_dot = 0.0F;
          rtb_phi_dot = 0.0F;
        }
      }
    }

    rtb_left_inboard_aileron_deg = rtb_phi_dot;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit, &rtb_y_a);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_NOT_k);
    rtb_OR = ((rtb_y_a != 0U) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit, &rtb_y_a);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_y_nl);
    rtb_OR6 = ((rtb_y_a != 0U) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_c((std::abs(A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data -
      A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) > A380PrimComputer_P.CompareToConstant_const_l),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge,
      A380PrimComputer_P.ConfirmNode_timeDelay, &rtb_y_fl, &A380PrimComputer_DWork.sf_MATLABFunction_jz);
    rtb_rudder2HydraulicModeEngaged = (rtb_tripleAdrFault || (rtb_doubleAdrFault && A380PrimComputer_P.Constant1_Value_b));
    A380PrimComputer_MATLABFunction_c(((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_rudder2HydraulicModeEngaged), A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode2_isRisingEdge, A380PrimComputer_P.ConfirmNode2_timeDelay, &rtb_y_nl,
      &A380PrimComputer_DWork.sf_MATLABFunction_lf);
    A380PrimComputer_MATLABFunction_c(((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_rudder2HydraulicModeEngaged), A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode1_isRisingEdge, A380PrimComputer_P.ConfirmNode1_timeDelay, &rtb_NOT_k,
      &A380PrimComputer_DWork.sf_MATLABFunction_jl);
    A380PrimComputer_DWork.ra1CoherenceRejected = (rtb_y_nl || A380PrimComputer_DWork.ra1CoherenceRejected);
    A380PrimComputer_DWork.ra2CoherenceRejected = (rtb_NOT_k || A380PrimComputer_DWork.ra2CoherenceRejected);
    rtb_OR4 = ((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || A380PrimComputer_DWork.ra1CoherenceRejected);
    rtb_ra2Invalid = ((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>
                       (SignStatusMatrix::FailureWarning)) || A380PrimComputer_DWork.ra2CoherenceRejected);
    if (!A380PrimComputer_DWork.configFullEventTime_not_empty) {
      A380PrimComputer_DWork.configFullEventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.configFullEventTime_not_empty = true;
    }

    if ((!rtb_OR) && (!rtb_OR6)) {
      A380PrimComputer_DWork.configFullEventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    rtb_AND2_i = !rtb_ra2Invalid;
    rtb_y_g = !rtb_OR4;
    if (rtb_y_g && rtb_AND2_i) {
      if (rtb_y_fl) {
        if (A380PrimComputer_U.in.time.simulation_time > A380PrimComputer_DWork.configFullEventTime + 10.0) {
          rtb_raComputationValue = std::fmin(A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data,
            A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data);
        } else {
          rtb_raComputationValue = 250.0F;
        }
      } else {
        rtb_raComputationValue = (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
          A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) / 2.0F;
      }
    } else if ((rtb_OR4 && rtb_AND2_i) || (rtb_y_g && rtb_ra2Invalid)) {
      if ((rtb_V_ias > 180.0F) && rtb_rudder2HydraulicModeEngaged) {
        rtb_raComputationValue = 250.0F;
      } else if (rtb_ra2Invalid) {
        rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
      } else {
        rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
      }
    } else {
      rtb_raComputationValue = 250.0F;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel6_bit_o, &rtb_y_a);
    rtb_y_g = (rtb_y_a != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel1_bit_j, &rtb_y_a);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, &rtb_NOT_k);
    rtb_OR6 = ((rtb_y_g || (rtb_y_a != 0U)) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel3_bit_g, &rtb_y_a);
    rtb_y_g = (rtb_y_a != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel2_bit_m, &rtb_y_a);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, &rtb_y_nl);
    rtb_OR = (A380PrimComputer_U.in.sim_data.slew_on || A380PrimComputer_U.in.sim_data.pause_on ||
              A380PrimComputer_U.in.sim_data.tracking_mode_on_override);
    rtb_OR6 = (rtb_OR6 || ((rtb_y_g || (rtb_y_a != 0U)) && rtb_y_nl));
    A380PrimComputer_MATLABFunction_n(A380PrimComputer_U.in.analog_inputs.yellow_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode2_highTrigger, A380PrimComputer_P.HysteresisNode2_lowTrigger, &rtb_y_nl,
      &A380PrimComputer_DWork.sf_MATLABFunction_nj);
    A380PrimComputer_MATLABFunction_c(((!A380PrimComputer_U.in.discrete_inputs.yellow_low_pressure) && rtb_y_nl),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge_l,
      A380PrimComputer_P.ConfirmNode_timeDelay_i, &rtb_NOT_k, &A380PrimComputer_DWork.sf_MATLABFunction_cx);
    A380PrimComputer_MATLABFunction_n(A380PrimComputer_U.in.analog_inputs.green_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode3_highTrigger, A380PrimComputer_P.HysteresisNode3_lowTrigger, &rtb_y_nl,
      &A380PrimComputer_DWork.sf_MATLABFunction_e1);
    A380PrimComputer_MATLABFunction_c(((!A380PrimComputer_U.in.discrete_inputs.green_low_pressure) && rtb_y_nl),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode2_isRisingEdge_i,
      A380PrimComputer_P.ConfirmNode2_timeDelay_h, &rtb_y_nl, &A380PrimComputer_DWork.sf_MATLABFunction_kq);
    rtb_rudder2HydraulicModeEngaged = !rtb_y_nl;
    rtb_rudder1HydraulicModeEngaged = !rtb_NOT_k;
    rtb_OR1 = !A380PrimComputer_P.Constant_Value_aq;
    rtb_OR7 = (rtb_OR6 && ((rtb_y_nl || rtb_NOT_k || (!A380PrimComputer_U.in.discrete_inputs.rat_contactor_closed) ||
      (!A380PrimComputer_U.in.discrete_inputs.rat_deployed)) && ((rtb_rudder2HydraulicModeEngaged || rtb_OR1) &&
      (rtb_rudder1HydraulicModeEngaged || rtb_OR1))));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_doubleIrFault_tmp = rtb_y_nl;
      rtb_OR3 = rtb_y_nl;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_doubleIrFault_tmp = rtb_y_nl;
      rtb_OR3 = rtb_y_nl;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_doubleIrFault_tmp = rtb_NOT_k;
      rtb_OR3 = rtb_NOT_k;
    } else {
      rtb_doubleIrFault_tmp = false;
      rtb_OR3 = false;
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel2_bit_k, &rtb_y_a);
    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_y_fa);
    rtb_AND1_e = ((rtb_y_a != 0U) && rtb_y_fa);
    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel1_bit_b, &rtb_y_a);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      leftAileron2Avail = true;
      rtb_OR1 = true;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      leftAileron2Avail = true;
      rtb_OR1 = true;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      leftAileron2Avail = rtb_NOT_k;
      rtb_OR1 = rtb_NOT_k;
    } else {
      leftAileron2Avail = false;
      rtb_OR1 = false;
    }

    rudder2ElectricModeHasPriority = !rtb_OR7;
    rtb_rightAileron2Engaged = (A380PrimComputer_U.in.discrete_inputs.is_unit_3 || rudder2ElectricModeHasPriority);
    rtb_AND1_e = (leftAileron2Avail && ((!rtb_AND1_e) && rtb_rightAileron2Engaged));
    rtb_rightAileron2Engaged = (rtb_OR1 && (((!rtb_y_fa) || (rtb_y_a == 0U)) && rtb_rightAileron2Engaged));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      leftSpoilerHydraulicModeAvail = rtb_y_nl;
      leftSpoilerElectricModeAvail = true;
      rightSpoilerHydraulicModeAvail = rtb_y_nl;
      rightSpoilerElectricModeAvail = true;
      rtb_leftSpoilerHydraulicModeEngaged = rtb_y_nl;
      rtb_leftSpoilerElectricModeEngaged = (rtb_rudder2HydraulicModeEngaged && rudder2ElectricModeHasPriority);
      rtb_rightSpoilerHydraulicModeEngaged = rtb_y_nl;
      rtb_rightSpoilerElectricModeEngaged = rtb_leftSpoilerElectricModeEngaged;
      elevator1Avail = rtb_y_nl;
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        leftSpoilerHydraulicModeAvail = rtb_NOT_k;
        leftSpoilerElectricModeAvail = true;
        rightSpoilerHydraulicModeAvail = rtb_NOT_k;
        rightSpoilerElectricModeAvail = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        leftSpoilerHydraulicModeAvail = rtb_y_nl;
        leftSpoilerElectricModeAvail = true;
        rightSpoilerHydraulicModeAvail = rtb_y_nl;
        rightSpoilerElectricModeAvail = true;
      } else {
        leftSpoilerHydraulicModeAvail = false;
        leftSpoilerElectricModeAvail = false;
        rightSpoilerHydraulicModeAvail = false;
        rightSpoilerElectricModeAvail = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2 || A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rtb_leftSpoilerHydraulicModeEngaged = (leftSpoilerHydraulicModeAvail && rightSpoilerHydraulicModeAvail);
        rtb_leftSpoilerElectricModeEngaged = false;
        rtb_rightSpoilerHydraulicModeEngaged = rtb_leftSpoilerHydraulicModeEngaged;
        rtb_rightSpoilerElectricModeEngaged = false;
      } else {
        rtb_leftSpoilerHydraulicModeEngaged = false;
        rtb_leftSpoilerElectricModeEngaged = false;
        rtb_rightSpoilerHydraulicModeEngaged = false;
        rtb_rightSpoilerElectricModeEngaged = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        elevator1Avail = rtb_NOT_k;
      } else {
        elevator1Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_y_nl);
      }
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word;
    }

    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_y_fa);
    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel1_bit_n, &rtb_y_a);
    rtb_AND_e = (rtb_y_fa && (rtb_y_a != 0U));
    elevator2Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_1 ||
                      (A380PrimComputer_U.in.discrete_inputs.is_unit_2 ||
                       (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_NOT_k)));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND2_i = ((!rtb_AND_e) && rudder2ElectricModeHasPriority);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND2_i = ((!rtb_AND_e) && rudder2ElectricModeHasPriority);
    } else {
      rtb_AND2_i = A380PrimComputer_U.in.discrete_inputs.is_unit_3;
    }

    rtb_AND_e = (elevator2Avail && rtb_AND2_i);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_av);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_l, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word, &rtb_y_fa);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_l, &rtb_y_a);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_y_av = (rtb_y_av && (rtb_y_m != 0U));
    } else {
      rtb_y_av = (rtb_y_fa && (rtb_y_a != 0U));
    }

    rtb_y_fa = (A380PrimComputer_U.in.discrete_inputs.is_unit_1 || A380PrimComputer_U.in.discrete_inputs.is_unit_2);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND2_i = ((!rtb_y_av) && rudder2ElectricModeHasPriority);
    } else {
      rtb_AND2_i = (A380PrimComputer_U.in.discrete_inputs.is_unit_2 && ((!rtb_y_av) && rudder2ElectricModeHasPriority));
    }

    rtb_y_av = (rtb_y_fa && rtb_AND2_i);
    rtb_BusAssignment_j_logic_is_yellow_hydraulic_power_avail = rtb_NOT_k;
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_bv, &rtb_y_i4);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      thsAvail = rtb_BusAssignment_j_logic_is_yellow_hydraulic_power_avail;
      rtb_AND2_i = ((!rtb_NOT_k) || (rtb_y_i4 == 0U));
    } else {
      rtb_NOT_k = !A380PrimComputer_U.in.discrete_inputs.is_unit_2;
      thsAvail = (rtb_NOT_k && (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_y_nl));
      rtb_AND2_i = (rtb_NOT_k && A380PrimComputer_U.in.discrete_inputs.is_unit_3);
    }

    rtb_thsEngaged = (thsAvail && rtb_AND2_i);
    rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail = rtb_y_nl;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_k, &rtb_y_a);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_e, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word, &rtb_y_fl);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND2_i = (rtb_y_a != 0U);
    } else {
      rtb_AND2_i = (rtb_y_m != 0U);
    }

    rtb_AND_n = (rtb_AND2_i && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_c, &rtb_y_m);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_p, &rtb_DataTypeConversion1_j);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel6_bit_k, &rtb_y_a);
    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_y_nl);
    rtb_AND6_o = ((rtb_y_a != 0U) && rtb_y_nl);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel9_bit, &rtb_y_a);
    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel10_bit, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_NOT_k);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND2_i = (rtb_y_a != 0U);
    } else {
      rtb_AND2_i = (rtb_Switch31 != 0U);
    }

    rtb_AND3 = (rtb_AND2_i && rtb_NOT_k);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeAvail = rtb_BusAssignment_j_logic_is_yellow_hydraulic_power_avail;
      rudder1ElectricModeAvail = true;
      rudder1HydraulicModeHasPriority = true;
      rtb_AND_n = ((!rtb_AND_n) && rtb_rudder1HydraulicModeEngaged && (!rtb_AND6_o) && (!rtb_AND3) &&
                   rudder2ElectricModeHasPriority);
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        rudder1HydraulicModeAvail = rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeAvail = rtb_BusAssignment_j_logic_is_yellow_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else {
        rudder1HydraulicModeAvail = false;
        rudder1ElectricModeAvail = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2 || A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeHasPriority = !rtb_AND_n;
        if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
          rtb_AND2_i = (rtb_y_m != 0U);
        } else {
          rtb_AND2_i = (rtb_DataTypeConversion1_j != 0U);
        }

        rtb_AND_n = (rudder1HydraulicModeHasPriority && ((!rtb_y_fl) || (!rtb_AND2_i)) && (!rudder1HydraulicModeAvail) &&
                     (!rtb_AND6_o) && (!rtb_AND3) && rudder2ElectricModeHasPriority);
      } else {
        rudder1HydraulicModeHasPriority = false;
        rtb_AND_n = false;
      }
    }

    rtb_rudder1HydraulicModeEngaged = (rudder1HydraulicModeAvail && rudder1HydraulicModeHasPriority);
    rtb_AND_n = (rudder1ElectricModeAvail && rtb_AND_n);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_n, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word, &rtb_y_fl);
    rtb_AND3 = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_g, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word, &rtb_NOT_k);
    rtb_AND4_f = ((rtb_y_m != 0U) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel8_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word, &rtb_y_nl);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND6_o = rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
      rudder1HydraulicModeHasPriority = true;
      rudder2HydraulicModeHasPriority = true;
      rudder2ElectricModeHasPriority = ((!rtb_AND3) && rtb_rudder2HydraulicModeEngaged && (!rtb_AND4_f) && ((rtb_y_m ==
        0U) || (!rtb_y_nl)) && rudder2ElectricModeHasPriority);
    } else {
      rtb_AND6_o = false;
      rudder1HydraulicModeHasPriority = false;
      rudder2HydraulicModeHasPriority = false;
      rudder2ElectricModeHasPriority = false;
    }

    rtb_rudder2HydraulicModeEngaged = (rtb_AND6_o && rudder2HydraulicModeHasPriority);
    rudder2ElectricModeHasPriority = (rudder1HydraulicModeHasPriority && rudder2ElectricModeHasPriority);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel_bit_i, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word, &rtb_y_g);
    rtb_AND3 = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_c, &rtb_y_m);
    rudder2HydraulicModeHasPriority = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_p, &rtb_y_m);
    rtb_AND2_ac = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_n, &rtb_y_m);
    rtb_AND1_at = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_j, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word, &rtb_y_fl);
    rtb_AND4_d = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_i, &rtb_y_m);
    rtb_AND4_f = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_j, &rtb_y_m);
    rtb_AND7 = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_n, &rtb_y_m);
    rtb_AND8 = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_n, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word, &rtb_NOT_k);
    rtb_AND13 = ((rtb_y_m != 0U) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel9_bit_b, &rtb_y_m);
    rtb_AND11 = ((rtb_y_m != 0U) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel10_bit_h, &rtb_y_m);
    rtb_AND10 = ((rtb_y_m != 0U) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel11_bit, &rtb_y_m);
    rtb_AND9 = ((rtb_y_m != 0U) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel14_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.aileron_status_word, &rtb_y_nl);
    rtb_AND15 = ((rtb_y_m != 0U) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel15_bit, &rtb_y_m);
    rtb_AND16 = ((rtb_y_m != 0U) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel16_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.aileron_status_word, &rtb_y_fl);
    rtb_AND17 = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel17_bit, &rtb_y_m);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND5_e = (rtb_doubleIrFault_tmp || rtb_AND2_ac);
      rtb_AND9_o = (rtb_OR3 || rtb_AND1_at);
      rtb_AND2_ac = (rtb_AND1_e || rtb_AND4_d);
      rtb_AND1_at = (rtb_rightAileron2Engaged || rtb_AND4_f);
      rtb_AND3 = (rtb_AND3 || rtb_AND7);
      rudder2HydraulicModeHasPriority = (rudder2HydraulicModeHasPriority || rtb_AND8);
      rtb_leftInboardAilPos = A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      rtb_rightInboardAilPos = A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
      rtb_leftMidboardAilPos = A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      rtb_rightMidboardAilPos = A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_leftOutboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        rtb_leftOutboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_rightOutboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        rtb_rightOutboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND5_e = (rtb_AND1_e || rtb_AND3);
      rtb_AND9_o = (rtb_rightAileron2Engaged || rudder2HydraulicModeHasPriority);
      rtb_AND2_ac = (rtb_AND2_ac || rtb_AND4_d);
      rtb_AND1_at = (rtb_AND1_at || rtb_AND4_f);
      rtb_AND3 = (rtb_doubleIrFault_tmp || rtb_AND7);
      rudder2HydraulicModeHasPriority = (rtb_OR3 || rtb_AND8);
      rtb_leftInboardAilPos = A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      rtb_rightInboardAilPos = A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_leftMidboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
      } else {
        rtb_leftMidboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_rightMidboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
      } else {
        rtb_rightMidboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
      }

      rtb_leftOutboardAilPos = A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      rtb_rightOutboardAilPos = A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND5_e = (rtb_AND3 || rtb_AND7);
      rtb_AND9_o = (rudder2HydraulicModeHasPriority || rtb_AND8);
      rtb_AND2_ac = (rtb_doubleIrFault_tmp || rtb_AND2_ac);
      rtb_AND1_at = (rtb_OR3 || rtb_AND1_at);
      rtb_AND3 = (rtb_AND4_d || rtb_AND1_e);
      rudder2HydraulicModeHasPriority = (rtb_AND4_f || rtb_rightAileron2Engaged);
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_leftInboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        rtb_leftInboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_rightInboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        rtb_rightInboardAilPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }

      rtb_leftMidboardAilPos = A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      rtb_rightMidboardAilPos = A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
      rtb_leftOutboardAilPos = A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      rtb_rightOutboardAilPos = A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
    } else {
      rtb_AND5_e = false;
      rtb_AND9_o = false;
      rtb_AND2_ac = false;
      rtb_AND1_at = false;
      rtb_AND3 = false;
      rudder2HydraulicModeHasPriority = false;
      rtb_leftInboardAilPos = 0.0;
      rtb_rightInboardAilPos = 0.0;
      rtb_leftMidboardAilPos = 0.0;
      rtb_rightMidboardAilPos = 0.0;
      rtb_leftOutboardAilPos = 0.0;
      rtb_rightOutboardAilPos = 0.0;
    }

    rtb_AND4_f = (rtb_AND5_e || (rtb_AND13 || rtb_AND15));
    rtb_AND11 = (rtb_AND9_o || (rtb_AND11 || rtb_AND16));
    rtb_AND10 = (rtb_AND2_ac || (rtb_AND10 || rtb_AND17));
    rtb_AND9 = (rtb_AND1_at || (rtb_AND9 || ((rtb_y_m != 0U) && rtb_y_fl)));
    rtb_rightAileron2Command = rtb_alpha;
    rtb_elevator1Command = rtb_phi;
    rtb_right_midboard_aileron_deg = rtb_r;
    rtb_elevator2Command = rtb_n_z;
    rtb_elevator3Command = rtb_theta_dot;
    rtb_handleIndex_b = rtb_raComputationValue;
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word, &rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_g, &rtb_y_i4);
    rtb_y_g = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_pc, &rtb_y_i4);
    rtb_AND13 = (rtb_y_nl && (rtb_y_g || (rtb_y_i4 != 0U)));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word, &rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_i, &rtb_y_i4);
    rtb_y_lu = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_n, &rtb_y_i4);
    rtb_AND17 = (rtb_y_nl && (rtb_y_lu || (rtb_y_i4 != 0U)));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.spoiler_status_word, &rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_nd, &rtb_y_i4);
    rtb_y_g = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_d, &rtb_y_i4);
    rtb_AND4_d = (rtb_y_nl && (rtb_y_g || (rtb_y_i4 != 0U)));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_l, &rtb_y_i4);
    rtb_y_g = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel9_bit_g, &rtb_y_i4);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word, &rtb_NOT_k);
    rtb_AND15 = ((rtb_y_g || (rtb_y_i4 != 0U)) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel10_bit_j, &rtb_y_i4);
    rtb_y_fl = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel11_bit_j, &rtb_y_i4);
    rtb_AND16 = ((rtb_y_fl || (rtb_y_i4 != 0U)) && rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel14_bit_p, &rtb_y_i4);
    rtb_y_fl = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel15_bit_i, &rtb_y_i4);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word, &rtb_y_nl);
    rtb_AND8 = ((rtb_y_fl || (rtb_y_i4 != 0U)) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel12_bit, &rtb_y_i4);
    rtb_y_fl = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel13_bit, &rtb_y_i4);
    rtb_AND9_o = ((rtb_y_fl || (rtb_y_i4 != 0U)) && rtb_y_nl);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND7 = (rtb_AND8 || rtb_AND9_o);
      rtb_AND8 = (rtb_AND15 || rtb_AND16);
      rtb_AND15 = (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
                   rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND7 = (rtb_AND8 || rtb_AND9_o);
      rtb_AND8 = (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
                  rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
      rtb_AND15 = (rtb_AND15 || rtb_AND16);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND7 = (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
                  rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
      rtb_AND8 = (rtb_AND8 || rtb_AND9_o);
      rtb_AND15 = (rtb_AND15 || rtb_AND16);
    } else {
      rtb_AND7 = false;
      rtb_AND8 = false;
      rtb_AND15 = false;
    }

    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word, &rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_l, &rtb_y_i4);
    rtb_y_fl = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_f, &rtb_y_i4);
    rtb_AND16 = (rtb_y_nl && (rtb_y_fl || (rtb_y_i4 != 0U)));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word, &rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_p, &rtb_y_i4);
    rtb_y_g = (rtb_y_i4 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_b, &rtb_y_i4);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_leftSplr4Pos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      rtb_rightSplr4Pos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      rtb_leftSplr5Pos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      rtb_rightSplr5Pos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
      rtb_leftSplr6Pos = A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      rtb_rightSplr6Pos = A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_leftSplr4Pos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      rtb_rightSplr4Pos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      rtb_leftSplr5Pos = A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      rtb_rightSplr5Pos = A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
      rtb_leftSplr6Pos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      rtb_rightSplr6Pos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_leftSplr4Pos = A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      rtb_rightSplr4Pos = A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
      rtb_leftSplr5Pos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      rtb_rightSplr5Pos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      rtb_leftSplr6Pos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      rtb_rightSplr6Pos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else {
      rtb_leftSplr4Pos = 0.0;
      rtb_rightSplr4Pos = 0.0;
      rtb_leftSplr5Pos = 0.0;
      rtb_rightSplr5Pos = 0.0;
      rtb_leftSplr6Pos = 0.0;
      rtb_rightSplr6Pos = 0.0;
    }

    rtb_AND9_o = (rtb_y_nl && (rtb_y_g || (rtb_y_i4 != 0U)));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel16_bit_b, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word, &rtb_y_fl);
    rtb_AND2_ac = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel17_bit_i, &rtb_y_m);
    rtb_AND15_l = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel18_bit, &rtb_y_m);
    rtb_AND1_at = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel19_bit, &rtb_y_m);
    rtb_AND12 = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel20_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_nl);
    rtb_AND16_n = ((rtb_y_m != 0U) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel21_bit, &rtb_y_m);
    rtb_AND18_c = ((rtb_y_m != 0U) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel22_bit, &rtb_y_m);
    rtb_AND19 = ((rtb_y_m != 0U) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel23_bit, &rtb_y_m);
    rtb_AND20 = ((rtb_y_m != 0U) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_lr, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word, &rtb_y_g);
    rtb_AND5_e = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_g, &rtb_y_m);
    rtb_AND3_h = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_k, &rtb_y_m);
    rtb_AND2_i = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_n, &rtb_y_m);
    rtb_y_nl = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_e, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word, &rtb_y_g);
    rtb_AND4_fg3 = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_b, &rtb_y_m);
    rtb_NOT_k = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_p, &rtb_y_m);
    rtb_AND7_d = ((rtb_y_m != 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_d, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word, &rtb_y_fl);
    rtb_y_g = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel9_bit_e, &rtb_y_m);
    rtb_AND10_b = ((rtb_y_m != 0U) && rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel11_bit_n, &rtb_y_m);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      leftInboardElevEngaged = (rtb_AND_e || rtb_AND16_n);
      rtb_AND19 = (rtb_AND18_c || rtb_AND1_at);
      rtb_AND15_l = (elevator1Avail || rtb_AND15_l);
      rtb_AND16_n = (rtb_AND2_ac || rtb_y_av);
      rtb_AND12 = (rtb_thsEngaged || rtb_AND20);
      rtb_leftInboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_rightInboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      } else {
        rtb_rightInboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      rtb_leftOutboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      rtb_rightOutboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg;
      rtb_thsPos = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      leftInboardElevEngaged = (rtb_AND16_n || rtb_AND15_l);
      rtb_AND19 = (rtb_y_av || rtb_AND18_c);
      rtb_AND15_l = (rtb_AND_e || rtb_AND2_ac);
      rtb_AND16_n = (elevator1Avail || rtb_AND1_at);
      rtb_AND12 = (rtb_AND12 || rtb_AND20);
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_leftInboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        rtb_leftInboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
      }

      rtb_rightInboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg;
      rtb_leftOutboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      rtb_rightOutboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
           NormalOperation)) {
        rtb_thsPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.Data;
      } else {
        rtb_thsPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      leftInboardElevEngaged = (elevator1Avail || rtb_AND15_l);
      rtb_AND19 = (rtb_AND_e || rtb_AND19);
      rtb_AND15_l = (rtb_AND2_ac || rtb_AND18_c);
      rtb_AND16_n = (rtb_AND16_n || rtb_AND1_at);
      rtb_AND12 = (rtb_thsEngaged || rtb_AND12);
      rtb_leftInboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      rtb_rightInboardElevPos = A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_leftOutboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
      } else {
        rtb_leftOutboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_rightOutboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        rtb_rightOutboardElevPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      rtb_thsPos = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    } else {
      leftInboardElevEngaged = false;
      rtb_AND19 = false;
      rtb_AND15_l = false;
      rtb_AND16_n = false;
      rtb_AND12 = false;
      rtb_leftInboardElevPos = 0.0;
      rtb_rightInboardElevPos = 0.0;
      rtb_leftOutboardElevPos = 0.0;
      rtb_rightOutboardElevPos = 0.0;
      rtb_thsPos = 0.0;
    }

    rtb_AND2_ac = (leftInboardElevEngaged || (rtb_y_g || rtb_AND3_h));
    rtb_AND1_at = (rtb_AND19 || (rtb_AND10_b || rtb_AND7_d));
    rtb_AND5_e = (rtb_AND15_l || (rtb_AND5_e || rtb_NOT_k));
    rtb_AND4_fg3 = (rtb_AND16_n || (rtb_AND4_fg3 || rtb_AND2_i));
    rtb_AND12 = (rtb_AND12 || (((rtb_y_m != 0U) && rtb_y_fl) || rtb_y_nl));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel38_bit, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel39_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word, &rtb_y_g);
    rtb_AND3_h = ((rtb_NOT_k || (rtb_y_m != 0U)) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel32_bit, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel33_bit, &rtb_y_m);
    rtb_AND15_l = ((rtb_NOT_k || (rtb_y_m != 0U)) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel36_bit, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel37_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word, &rtb_y_nl);
    rtb_AND20 = ((rtb_NOT_k || (rtb_y_m != 0U)) && rtb_y_nl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_m, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_b, &rtb_y_m);
    rtb_y_nl = (rtb_NOT_k || (rtb_y_m != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word, &rtb_y_lu);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_pt, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_h, &rtb_y_m);
    rtb_y_fl = (rtb_NOT_k || (rtb_y_m != 0U));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_d, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_p, &rtb_y_m);
    rtb_AND16_n = (rtb_NOT_k || (rtb_y_m != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word, &rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_gt, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_i, &rtb_y_m);
    rtb_AND2_i = (rtb_NOT_k || (rtb_y_m != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word, &rtb_NOT_k);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND3_h = (rtb_rudder1HydraulicModeEngaged || rtb_AND_n || rtb_AND3_h);
      rtb_AND15_l = (rtb_rudder2HydraulicModeEngaged || rudder2ElectricModeHasPriority || rtb_AND20);
      rtb_upperRudderPos = A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
      rtb_lowerRudderPos = A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND3_h = (rtb_rudder1HydraulicModeEngaged || rtb_AND_n || rtb_AND3_h);
      rtb_AND15_l = (rtb_AND15_l || rtb_AND20);
      rtb_upperRudderPos = A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_lowerRudderPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
      } else {
        rtb_lowerRudderPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND3_h = (rtb_AND3_h || rtb_AND20);
      rtb_AND15_l = (rtb_rudder1HydraulicModeEngaged || rtb_AND_n || rtb_AND15_l);
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_upperRudderPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
      } else {
        rtb_upperRudderPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }

      rtb_lowerRudderPos = A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
    } else {
      rtb_AND3_h = false;
      rtb_AND15_l = false;
      rtb_upperRudderPos = 0.0;
      rtb_lowerRudderPos = 0.0;
    }

    rtb_AND3_h = (rtb_AND3_h || (rtb_y_nl && rtb_y_lu) || (rtb_AND16_n && rtb_y_g));
    rtb_AND15_l = (rtb_AND15_l || (rtb_y_fl && rtb_y_lu) || (rtb_AND2_i && rtb_NOT_k));
    A380PrimComputer_MATLABFunction_c(A380PrimComputer_U.in.sim_data.slew_on, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode_isRisingEdge_o, A380PrimComputer_P.ConfirmNode_timeDelay_d, &rtb_y_nl,
      &A380PrimComputer_DWork.sf_MATLABFunction_nb);
    abs_rate_c = std::abs(static_cast<real_T>(rtb_phi));
    rtb_AND1_ci = !rtb_OR6;
    rtb_AND16_n = ((!rtb_y_nl) && rtb_AND1_ci && (((!rtb_tripleAdrFault) && ((rtb_mach > 0.96) || (rtb_Y < -10.0) ||
      (rtb_Y > 37.5) || (rtb_V_ias > 420.0F) || (rtb_V_ias < 70.0F))) || ((!rtb_tripleIrFault) && ((!rtb_doubleIrFault) ||
      (!A380PrimComputer_P.Constant_Value_ad)) && ((abs_rate_c > 120.0) || ((rtb_alpha > 50.0F) || (rtb_alpha < -30.0F))))));
    A380PrimComputer_DWork.abnormalConditionWasActive = (rtb_AND16_n || (rtb_AND1_ci &&
      A380PrimComputer_DWork.abnormalConditionWasActive));
    nz = ((rtb_AND2_ac + rtb_AND1_at) + rtb_AND5_e) + rtb_AND4_fg3;
    b_x[0] = rtb_AND4_f;
    b_x[1] = rtb_AND11;
    b_x[2] = rtb_AND10;
    b_x[3] = rtb_AND9;
    b_x[4] = rtb_AND3;
    b_x[5] = rudder2HydraulicModeHasPriority;
    b_nz = rtb_AND4_f;
    for (prim3LawCap = 0; prim3LawCap < 5; prim3LawCap++) {
      b_nz += b_x[prim3LawCap + 1];
    }

    if (rtb_AND16_n) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::DirectLaw;
    } else if (nz == 2) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1B;
    } else if (A380PrimComputer_DWork.abnormalConditionWasActive || ((rtb_AND3_h && (!rtb_AND15_l)) || ((!rtb_AND3_h) &&
      rtb_AND15_l)) || (nz == 3) || (b_nz == 4)) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1A;
    } else {
      rtb_pitchLawCapability = a380_pitch_efcs_law::NormalLaw;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel_bit_o, &rtb_y_m);
    rtb_y_fl = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_e, &rtb_y_m);
    rtb_AND2_i = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_hr, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_kq, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_nl);
    A380PrimComputer_MATLABFunction_ek(rtb_y_fl, rtb_AND2_i, rtb_NOT_k, rtb_y_nl, &rtb_law_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_le, &rtb_y_m);
    rtb_y_fl = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_bl, &rtb_y_m);
    rtb_AND2_i = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_p, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_h, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word, &rtb_y_nl);
    A380PrimComputer_MATLABFunction_ek(rtb_y_fl, rtb_AND2_i, rtb_NOT_k, rtb_y_nl, &rtb_law);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      nz = static_cast<int32_T>(rtb_pitchLawCapability);
      b_nz = static_cast<int32_T>(rtb_law_k);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      nz = static_cast<int32_T>(rtb_law_k);
      b_nz = static_cast<int32_T>(rtb_pitchLawCapability);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else {
      nz = static_cast<int32_T>(rtb_law_k);
      b_nz = static_cast<int32_T>(rtb_law);
      prim3LawCap = static_cast<int32_T>(rtb_pitchLawCapability);
    }

    iindx = 1;
    if (nz > b_nz) {
      nz = b_nz;
      iindx = 2;
    }

    if (nz > prim3LawCap) {
      iindx = 3;
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND20 = (iindx == 1);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND20 = (iindx == 2);
    } else {
      rtb_AND20 = (iindx == 3);
    }

    rtb_AND2_i = !rtb_AND20;
    if (rtb_AND2_i) {
      rtb_law_k = a380_pitch_efcs_law::None;
      rtb_activeLateralLaw = a380_lateral_efcs_law::None;
    } else {
      rtb_law_k = rtb_pitchLawCapability;
      rtb_activeLateralLaw = a380_lateral_efcs_law::NormalLaw;
    }

    A380PrimComputer_MATLABFunction_f(A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode_isRisingEdge, &rtb_NOT_k, &A380PrimComputer_DWork.sf_MATLABFunction_g4);
    A380PrimComputer_MATLABFunction_f(A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode1_isRisingEdge, &rtb_y_nl, &A380PrimComputer_DWork.sf_MATLABFunction_nu);
    if (rtb_NOT_k) {
      A380PrimComputer_DWork.pRightStickDisabled = true;
      A380PrimComputer_DWork.pLeftStickDisabled = false;
    } else if (rtb_y_nl) {
      A380PrimComputer_DWork.pLeftStickDisabled = true;
      A380PrimComputer_DWork.pRightStickDisabled = false;
    }

    if (A380PrimComputer_DWork.pRightStickDisabled &&
        ((!A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed) &&
         (!A380PrimComputer_DWork.Delay1_DSTATE))) {
      A380PrimComputer_DWork.pRightStickDisabled = false;
    } else if (A380PrimComputer_DWork.pLeftStickDisabled) {
      A380PrimComputer_DWork.pLeftStickDisabled = (A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed ||
        A380PrimComputer_DWork.Delay_DSTATE_cc);
    }

    A380PrimComputer_MATLABFunction_c((A380PrimComputer_DWork.pLeftStickDisabled &&
      (A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || A380PrimComputer_DWork.Delay_DSTATE_cc)),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode1_isRisingEdge_k,
      A380PrimComputer_P.ConfirmNode1_timeDelay_a, &rtb_AND7_d, &A380PrimComputer_DWork.sf_MATLABFunction_j2);
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_DWork.pRightStickDisabled &&
      (A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || A380PrimComputer_DWork.Delay1_DSTATE)),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge_j,
      A380PrimComputer_P.ConfirmNode_timeDelay_a, &rtb_AND10_b, &A380PrimComputer_DWork.sf_MATLABFunction_g24);
    if (!A380PrimComputer_DWork.pRightStickDisabled) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant_Value_p;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      u0_0 = A380PrimComputer_P.Constant_Value_p;
    } else {
      u0_0 = A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    u0 = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg + u0_0;
    if (u0 > A380PrimComputer_P.Saturation_UpperSat_d) {
      u0 = A380PrimComputer_P.Saturation_UpperSat_d;
    } else if (u0 < A380PrimComputer_P.Saturation_LowerSat_h) {
      u0 = A380PrimComputer_P.Saturation_LowerSat_h;
    }

    if (!A380PrimComputer_DWork.pRightStickDisabled) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant1_Value_p;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      u0_0 = A380PrimComputer_P.Constant1_Value_p;
    } else {
      u0_0 = A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    u0_0 += rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg;
    if (u0_0 > A380PrimComputer_P.Saturation1_UpperSat) {
      u0_0 = A380PrimComputer_P.Saturation1_UpperSat;
    } else if (u0_0 < A380PrimComputer_P.Saturation1_LowerSat) {
      u0_0 = A380PrimComputer_P.Saturation1_LowerSat;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_h, &rtb_y_m);
    rtb_y_fl = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_gs, &rtb_y_m);
    rtb_y_nl = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_nu, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_gj, &rtb_y_m);
    rtb_y_g = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_e, &rtb_y_m);
    rtb_AND18_c = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_a, &rtb_y_m);
    A380PrimComputer_MATLABFunction_o(rtb_y_fl, rtb_y_nl, rtb_NOT_k, rtb_y_g, rtb_AND18_c, (rtb_y_m != 0U),
      &rtb_handleIndex);
    A380PrimComputer_RateLimiter_c(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_handleIndex,
      A380PrimComputer_P.alphamax_bp01Data, A380PrimComputer_P.alphamax_bp02Data, A380PrimComputer_P.alphamax_tableData,
      A380PrimComputer_P.alphamax_maxIndex, 4U), A380PrimComputer_P.RateLimiterGenericVariableTs_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo, A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value,
      &rtb_Switch_h, &A380PrimComputer_DWork.sf_RateLimiter_ne);
    if (!A380PrimComputer_DWork.eventTime_not_empty_i) {
      A380PrimComputer_DWork.eventTime_p = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.eventTime_not_empty_i = true;
    }

    if (rtb_OR6 || (A380PrimComputer_DWork.eventTime_p == 0.0)) {
      A380PrimComputer_DWork.eventTime_p = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_RateLimiter_c(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_handleIndex,
      A380PrimComputer_P.alphaprotection_bp01Data, A380PrimComputer_P.alphaprotection_bp02Data,
      A380PrimComputer_P.alphaprotection_tableData, A380PrimComputer_P.alphaprotection_maxIndex, 4U),
      A380PrimComputer_P.RateLimiterGenericVariableTs1_up, A380PrimComputer_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value_j, &rtb_Switch4_d,
      &A380PrimComputer_DWork.sf_RateLimiter_mr);
    if (A380PrimComputer_U.in.time.simulation_time - A380PrimComputer_DWork.eventTime_p <=
        A380PrimComputer_P.CompareToConstant_const) {
      rtb_handleIndex = rtb_Switch_h;
    } else {
      rtb_handleIndex = rtb_Switch4_d;
    }

    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach), A380PrimComputer_P.Constant6_Value_b,
      static_cast<real_T>(rtb_V_ias), &rtb_Switch4_d);
    rtb_right_outboard_aileron_deg = std::fmin(A380PrimComputer_P.Constant5_Value_k, rtb_Switch4_d);
    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach), A380PrimComputer_P.Constant8_Value_h,
      static_cast<real_T>(rtb_V_ias), &rtb_Switch4_d);
    rtb_right_inboard_aileron_deg = rtb_alpha - std::cos(A380PrimComputer_P.Gain1_Gain * rtb_phi) * rtb_Y;
    rtb_y_fl = ((rtb_law_k == a380_pitch_efcs_law::NormalLaw) || (rtb_activeLateralLaw == a380_lateral_efcs_law::
      NormalLaw));
    if ((!A380PrimComputer_U.in.temporary_ap_input.ap_engaged) && (rtb_V_ias > std::fmin(look1_binlxpw
          (rtb_right_inboard_aileron_deg, A380PrimComputer_P.uDLookupTable1_bp01Data,
           A380PrimComputer_P.uDLookupTable1_tableData, 3U), static_cast<real_T>(rtb_V_ias) / rtb_mach * look1_binlxpw
          (rtb_right_inboard_aileron_deg, A380PrimComputer_P.uDLookupTable2_bp01Data,
           A380PrimComputer_P.uDLookupTable2_tableData, 3U)))) {
      A380PrimComputer_DWork.sProtActive = (rtb_y_fl || A380PrimComputer_DWork.sProtActive);
    }

    rtb_aileronAntidroopActive = !A380PrimComputer_U.in.temporary_ap_input.ap_engaged;
    A380PrimComputer_DWork.sProtActive = ((rtb_V_ias >= rtb_right_outboard_aileron_deg) && rtb_aileronAntidroopActive &&
      rtb_y_fl && A380PrimComputer_DWork.sProtActive);
    if (!A380PrimComputer_DWork.resetEventTime_not_empty) {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.resetEventTime_not_empty = true;
    }

    if ((u0 >= -0.03125) || (rtb_Y >= rtb_Switch_h) || (A380PrimComputer_DWork.resetEventTime == 0.0)) {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_DWork.sProtActive_l = ((rtb_AND1_ci && rtb_y_fl && rtb_aileronAntidroopActive && (rtb_Y >
      rtb_handleIndex) && (A380PrimComputer_U.in.time.monotonic_time > 10.0)) || A380PrimComputer_DWork.sProtActive_l);
    A380PrimComputer_DWork.sProtActive_l = ((A380PrimComputer_U.in.time.simulation_time -
      A380PrimComputer_DWork.resetEventTime <= 0.5) && (u0 >= -0.5) && ((rtb_raComputationValue >= 200.0F) || (u0 >= 0.5)
      || (rtb_Y >= rtb_handleIndex - 2.0)) && rtb_AND1_ci && rtb_y_fl && A380PrimComputer_DWork.sProtActive_l);
    if (A380PrimComputer_DWork.is_active_c28_A380PrimComputer == 0) {
      A380PrimComputer_DWork.is_active_c28_A380PrimComputer = 1U;
      A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
      nz = 0;
    } else {
      switch (A380PrimComputer_DWork.is_c28_A380PrimComputer) {
       case A380PrimComputer_IN_Flying:
        if (rtb_raComputationValue < 100.0F) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landing100ft;
          nz = 1;
        } else if (rtb_OR6) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
          nz = 0;
        } else {
          nz = 0;
        }
        break;

       case A380PrimComputer_IN_Landed:
        if (rtb_AND1_ci) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Takeoff100ft;
          nz = 0;
        } else {
          nz = 0;
        }
        break;

       case A380PrimComputer_IN_Landing100ft:
        if (rtb_raComputationValue > 100.0F) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Flying;
          nz = 0;
        } else if (rtb_OR6) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
          nz = 0;
        } else {
          nz = 1;
        }
        break;

       default:
        if (rtb_OR6) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
          nz = 0;
        } else if (rtb_raComputationValue > 100.0F) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Flying;
          nz = 0;
        } else {
          nz = 0;
        }
        break;
      }
    }

    if (!A380PrimComputer_DWork.eventTime_not_empty) {
      A380PrimComputer_DWork.eventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.eventTime_not_empty = true;
    }

    if ((rtb_V_ias <= std::fmin(365.0, static_cast<real_T>(rtb_V_ias) / rtb_mach * (look1_binlxpw
           (rtb_right_inboard_aileron_deg, A380PrimComputer_P.uDLookupTable_bp01Data_m,
            A380PrimComputer_P.uDLookupTable_tableData_n, 3U) + 0.01))) || ((rtb_law_k != a380_pitch_efcs_law::NormalLaw)
         && (rtb_activeLateralLaw != a380_lateral_efcs_law::NormalLaw)) || (A380PrimComputer_DWork.eventTime == 0.0)) {
      A380PrimComputer_DWork.eventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    rtb_NOT_k = ((rtb_AND1_ci && (((nz != 0) && (rtb_Y > rtb_Switch_h)) || (rtb_Y > rtb_handleIndex + 0.25)) && rtb_y_fl)
                 || (A380PrimComputer_U.in.time.simulation_time - A380PrimComputer_DWork.eventTime > 3.0) ||
                 A380PrimComputer_DWork.sProtActive || A380PrimComputer_DWork.sProtActive_l);
    rtb_AND18_c = ((std::abs(u0) <= 0.5) && (std::abs(u0_0) <= 0.5) && ((std::abs
      (A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos) <= 0.4) && ((rtb_alpha <= 25.0F) && (rtb_alpha >= -13.0F) &&
      (abs_rate_c <= 45.0) && (!rtb_NOT_k))));
    leftInboardElevEngaged = rtb_NOT_k;
    rtb_y_g = (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos >= A380PrimComputer_P.CompareToConstant1_const);
    rtb_NOT_k = (A380PrimComputer_P.Constant_Value_h || A380PrimComputer_DWork.sProtActive_l ||
                 ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos >= A380PrimComputer_P.CompareToConstant3_const) ||
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos >= A380PrimComputer_P.CompareToConstant4_const) ||
                  rtb_y_g || (A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos >=
      A380PrimComputer_P.CompareToConstant2_const)));
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos <
      A380PrimComputer_P.CompareToConstant_const_n), A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode_isRisingEdge_c, A380PrimComputer_P.ConfirmNode_timeDelay_g, &rtb_y_nl,
      &A380PrimComputer_DWork.sf_MATLABFunction_al4);
    A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_NOT_k) <<
      1) + rtb_y_nl) << 1) + A380PrimComputer_DWork.Memory_PreviousInput];
    rtb_y_nl = (rtb_NOT_k || A380PrimComputer_DWork.Memory_PreviousInput);
    A380PrimComputer_MATLABFunction_f(rtb_OR6, A380PrimComputer_P.PulseNode7_isRisingEdge, &rtb_y_g,
      &A380PrimComputer_DWork.sf_MATLABFunction_ny);
    A380PrimComputer_MATLABFunction_f(rtb_OR6, A380PrimComputer_P.PulseNode6_isRisingEdge, &rtb_y_fl,
      &A380PrimComputer_DWork.sf_MATLABFunction_gc);
    A380PrimComputer_DWork.Memory_PreviousInput_a = A380PrimComputer_P.Logic_table_h[(((static_cast<uint32_T>(rtb_y_g ||
      (((A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed < A380PrimComputer_P.CompareToConstant13_const) ||
        (A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed < A380PrimComputer_P.CompareToConstant9_const)) &&
       ((A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed < A380PrimComputer_P.CompareToConstant10_const) ||
        (A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed < A380PrimComputer_P.CompareToConstant14_const)))) <<
      1) + rtb_y_fl) << 1) + A380PrimComputer_DWork.Memory_PreviousInput_a];
    rtb_NOT_k = (A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos <
                 A380PrimComputer_P.CompareToConstant_const_m);
    rtb_y_lu = (A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos <= A380PrimComputer_P.CompareToConstant18_const);
    rtb_y_fl = ((((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos >
                   A380PrimComputer_P.CompareToConstant26_const) || rtb_NOT_k) &&
                 ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos < A380PrimComputer_P.CompareToConstant11_const) &&
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos < A380PrimComputer_P.CompareToConstant27_const) &&
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos < A380PrimComputer_P.CompareToConstant5_const) &&
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos < A380PrimComputer_P.CompareToConstant6_const))) ||
                (((A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos < A380PrimComputer_P.CompareToConstant12_const) ||
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos < A380PrimComputer_P.CompareToConstant15_const)) &&
                 (static_cast<int32_T>(((static_cast<uint32_T>(A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <=
      A380PrimComputer_P.CompareToConstant29_const) + (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <=
      A380PrimComputer_P.CompareToConstant16_const)) + (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos <=
      A380PrimComputer_P.CompareToConstant17_const)) + rtb_y_lu) >= A380PrimComputer_P.CompareToConstant19_const)));
    A380PrimComputer_MATLABFunction_f(false, A380PrimComputer_P.PulseNode5_isRisingEdge, &rtb_y_lu,
      &A380PrimComputer_DWork.sf_MATLABFunction_m1);
    rtb_y_g = (((A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed >=
                 A380PrimComputer_P.CompareToConstant7_const) ||
                (A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed >=
                 A380PrimComputer_P.CompareToConstant8_const)) &&
               ((A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed >=
                 A380PrimComputer_P.CompareToConstant3_const_n) ||
                (A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed >=
                 A380PrimComputer_P.CompareToConstant4_const_k)) && A380PrimComputer_DWork.Memory_PreviousInput_a);
    A380PrimComputer_DWork.Delay1_DSTATE_b = (rtb_y_fl && (rtb_y_lu || rtb_y_g || A380PrimComputer_DWork.Delay1_DSTATE_b));
    A380PrimComputer_MATLABFunction_f(false, A380PrimComputer_P.PulseNode4_isRisingEdge, &rtb_y_g,
      &A380PrimComputer_DWork.sf_MATLABFunction_ff);
    A380PrimComputer_DWork.Delay2_DSTATE = (rtb_y_fl && (rtb_y_g || A380PrimComputer_DWork.Delay2_DSTATE));
    A380PrimComputer_DWork.Delay3_DSTATE = (rtb_NOT_k && ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <=
      A380PrimComputer_P.CompareToConstant1_const_a) && (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <=
      A380PrimComputer_P.CompareToConstant2_const_k)) && (rtb_y_lu || A380PrimComputer_DWork.Delay3_DSTATE));
    rtb_AND19 = ((!A380PrimComputer_DWork.Delay1_DSTATE_b) && (A380PrimComputer_DWork.Delay2_DSTATE ||
      A380PrimComputer_DWork.Delay3_DSTATE));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_l, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_g);
    rtb_y_fl = ((rtb_y_m == 0U) && rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_cm, &rtb_y_m);
    rtb_y_g = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_y_g);
    rtb_BusAssignment_p_logic_spoiler_lift_active = (rtb_OR6 && (rtb_y_fl || ((rtb_y_m == 0U) && rtb_y_g)));
    A380PrimComputer_Y.out.logic.ground_spoilers_armed = rtb_NOT_k;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_e, &rtb_y_m);
    rtb_y_g = (rtb_y_m == 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_fl);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_d, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_NOT_k);
    rtb_OR_b = ((rtb_y_g && rtb_y_fl) || ((rtb_y_m == 0U) && rtb_NOT_k));
    rtb_aileronAntidroopActive = (rtb_aileronAntidroopActive && A380PrimComputer_DWork.Delay1_DSTATE_b);
    A380PrimComputer_MATLABFunction_f(rtb_OR6, A380PrimComputer_P.PulseNode1_isRisingEdge_n, &rtb_y_lu,
      &A380PrimComputer_DWork.sf_MATLABFunction_ky);
    A380PrimComputer_MATLABFunction_f(rtb_OR6, A380PrimComputer_P.PulseNode2_isRisingEdge, &rtb_y_fl,
      &A380PrimComputer_DWork.sf_MATLABFunction_dmh);
    A380PrimComputer_DWork.Memory_PreviousInput_d = A380PrimComputer_P.Logic_table_j[(((static_cast<uint32_T>(rtb_y_lu) <<
      1) + (rtb_y_fl || A380PrimComputer_DWork.Delay_DSTATE_e)) << 1) + A380PrimComputer_DWork.Memory_PreviousInput_d];
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_pt, &rtb_y_i4);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_g);
    if ((rtb_y_i4 != 0U) && rtb_y_g) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_x_bus.discrete_status_word_1;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_y_bus.discrete_status_word_1;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel3_bit_gv, &rtb_y_i4);
    if (rtb_AND20) {
      rtb_y_fl = (rtb_AND1_ci && (rtb_law_k != A380PrimComputer_P.EnumeratedConstant_Value_l));
    } else {
      rtb_y_fl = ((rtb_y_i4 != 0U) && (rtb_Switch_ir_0->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)));
    }

    rtb_y_g = A380PrimComputer_DWork.Memory_PreviousInput_j;
    A380PrimComputer_DWork.Delay_DSTATE_e = A380PrimComputer_P.Logic_table_n[(((rtb_y_fl || (std::abs(rtb_thsPos) <=
      A380PrimComputer_P.CompareToConstant1_const_p) || A380PrimComputer_U.in.discrete_inputs.pitch_trim_up_pressed ||
      A380PrimComputer_U.in.discrete_inputs.pitch_trim_down_pressed) + (static_cast<uint32_T>((rtb_V_ias <=
      A380PrimComputer_P.CompareToConstant_const_c) && A380PrimComputer_DWork.Memory_PreviousInput_d) << 1)) << 1) +
      A380PrimComputer_DWork.Memory_PreviousInput_j];
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel4_bit_pi, &rtb_Switch29);
    rtb_NOT_k = (rtb_Switch29 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_g, &rtb_Switch29);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_g);
    rtb_AND1_ci = (((!rtb_NOT_k) || (rtb_Switch29 == 0U)) && rtb_y_g);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_g);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel6_bit_l, &rtb_Switch29);
    rtb_NOT_k = (rtb_Switch29 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel5_bit_as, &rtb_Switch29);
    if (rtb_AND1_ci || (rtb_y_g && ((!rtb_NOT_k) || (rtb_Switch29 == 0U)))) {
      abs_rate_c = 0.25;
    } else {
      abs_rate_c = 0.15;
    }

    if (A380PrimComputer_DWork.Delay_DSTATE_e) {
      abs_rate_c = A380PrimComputer_P.Gain_Gain * rtb_thsPos;
      if (abs_rate_c > A380PrimComputer_P.Saturation_UpperSat) {
        abs_rate_c = A380PrimComputer_P.Saturation_UpperSat;
      } else if (abs_rate_c < A380PrimComputer_P.Saturation_LowerSat) {
        abs_rate_c = A380PrimComputer_P.Saturation_LowerSat;
      }
    } else if (!A380PrimComputer_U.in.discrete_inputs.pitch_trim_down_pressed) {
      if (A380PrimComputer_U.in.discrete_inputs.pitch_trim_up_pressed) {
        abs_rate_c = -abs_rate_c;
      } else {
        abs_rate_c = 0.0;
      }
    }

    rtb_BusAssignment_nw_logic_alpha_max_deg = rtb_Switch_h;
    rtb_BusAssignment_nw_logic_high_speed_prot_lo_thresh_kn = rtb_right_outboard_aileron_deg;
    rtb_BusAssignment_nw_logic_high_speed_prot_hi_thresh_kn = std::fmin(A380PrimComputer_P.Constant7_Value_g,
      rtb_Switch4_d);
    rtb_AND1_ci = rtb_y_fl;
    rtb_y_fl = (rtb_OR || (static_cast<real_T>(rtb_activeLateralLaw) != A380PrimComputer_P.CompareToConstant_const_m4));
    LawMDLOBJ2.step(&A380PrimComputer_U.in.time.dt, &rtb_rightAileron2Command, &rtb_elevator1Command,
                    &rtb_right_midboard_aileron_deg, &rtb_left_inboard_aileron_deg, &A380PrimComputer_P.Constant_Value_a,
                    &rtb_eta_deg_dv, &rtb_eta_trim_dot_deg_s_n, &u0_0,
                    &A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos, &rtb_OR6, &rtb_y_fl,
                    &A380PrimComputer_DWork.sProtActive_l, &A380PrimComputer_DWork.sProtActive,
                    &A380PrimComputer_U.in.temporary_ap_input.roll_command,
                    &A380PrimComputer_U.in.temporary_ap_input.yaw_command,
                    &A380PrimComputer_U.in.temporary_ap_input.ap_engaged, &rtb_xi_inboard_deg, &rtb_xi_midboard_deg,
                    &rtb_xi_outboard_deg, &rtb_xi_spoiler_deg, &rtb_zeta_upper_deg, &rtb_zeta_lower_deg);
    LawMDLOBJ1.step(&A380PrimComputer_U.in.time.dt, &u0_0, (const_cast<real_T*>(&A380PrimComputer_RGND)),
                    &rtb_xi_inboard_deg_n, &rtb_xi_midboard_deg_a, &rtb_xi_outboard_deg_l, &rtb_xi_spoiler_deg_i,
                    &rtb_zeta_upper_deg_p, &rtb_zeta_lower_deg_n);
    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_right_inboard_aileron_deg = rtb_xi_inboard_deg;
      break;

     case 1:
      rtb_right_inboard_aileron_deg = rtb_xi_inboard_deg_n;
      break;

     default:
      rtb_right_inboard_aileron_deg = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    if (rtb_OR_b) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant2_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant1_Value;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs2_up, A380PrimComputer_P.RateLimiterVariableTs2_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_Switch4_d,
      &A380PrimComputer_DWork.sf_RateLimiter);
    if (rtb_aileronAntidroopActive) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant4_Value_a;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant3_Value;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs3_up, A380PrimComputer_P.RateLimiterVariableTs3_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.RateLimiterVariableTs3_InitialCondition, &rtb_Y_dc,
      &A380PrimComputer_DWork.sf_RateLimiter_b);
    rtb_right_outboard_aileron_deg = rtb_Switch4_d + rtb_Y_dc;
    rtb_right_spoiler_2_deg = A380PrimComputer_P.Gain_Gain_m * rtb_right_inboard_aileron_deg +
      rtb_right_outboard_aileron_deg;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation2_UpperSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation2_UpperSat;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation2_LowerSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation2_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs_up_b,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo_k, A380PrimComputer_U.in.time.dt, rtb_leftInboardAilPos,
      ((!rtb_AND4_f) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_a);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel_bit_la, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_fl);
    if ((rtb_y_m != 0U) && rtb_y_fl) {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
      rtb_Switch_right_outboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
      rtb_Switch_left_spoiler_1_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
      rtb_Switch_right_spoiler_1_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
      rtb_Switch_left_spoiler_2_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
      rtb_Switch_right_spoiler_2_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
      rtb_Switch_left_spoiler_3_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
      rtb_Switch_right_spoiler_3_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
      rtb_Switch_left_spoiler_4_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
      rtb_Switch_right_spoiler_4_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
      rtb_Switch_left_spoiler_5_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
      rtb_Switch_right_spoiler_5_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
      rtb_Switch_left_spoiler_6_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
      rtb_Switch_right_spoiler_6_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
      rtb_Switch_left_spoiler_7_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
      rtb_Switch_right_spoiler_7_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
      rtb_Switch_left_spoiler_8_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
      rtb_Switch_right_spoiler_8_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
      rtb_Switch_upper_rudder_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
      rtb_Switch_lower_rudder_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
    } else {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
      rtb_Switch_right_outboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
      rtb_Switch_left_spoiler_1_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
      rtb_Switch_right_spoiler_1_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
      rtb_Switch_left_spoiler_2_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
      rtb_Switch_right_spoiler_2_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
      rtb_Switch_left_spoiler_3_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
      rtb_Switch_right_spoiler_3_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
      rtb_Switch_left_spoiler_4_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
      rtb_Switch_right_spoiler_4_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
      rtb_Switch_left_spoiler_5_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
      rtb_Switch_right_spoiler_5_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
      rtb_Switch_left_spoiler_6_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
      rtb_Switch_right_spoiler_6_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
      rtb_Switch_left_spoiler_7_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
      rtb_Switch_right_spoiler_7_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
      rtb_Switch_left_spoiler_8_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
      rtb_Switch_right_spoiler_8_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
      rtb_Switch_upper_rudder_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
      rtb_Switch_lower_rudder_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
    }

    if (rtb_AND20) {
      rtb_left_inboard_aileron_deg = rtb_Switch4_d;
    } else {
      rtb_left_inboard_aileron_deg = rtb_Switch_left_inboard_aileron_command_deg_Data;
    }

    rtb_right_spoiler_2_deg = rtb_right_outboard_aileron_deg + rtb_right_inboard_aileron_deg;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation1_UpperSat_a) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation1_UpperSat_a;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation1_LowerSat_p) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation1_LowerSat_p;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs1_up_k,
      A380PrimComputer_P.RateLimiterGenericVariableTs1_lo_i, A380PrimComputer_U.in.time.dt, rtb_rightInboardAilPos,
      ((!rtb_AND11) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_n);
    if (rtb_AND20) {
      rtb_right_inboard_aileron_deg = rtb_Switch4_d;
    } else {
      rtb_right_inboard_aileron_deg = rtb_Switch_right_inboard_aileron_command_deg_Data;
    }

    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_right_midboard_aileron_deg = rtb_xi_midboard_deg;
      break;

     case 1:
      rtb_right_midboard_aileron_deg = rtb_xi_midboard_deg_a;
      break;

     default:
      rtb_right_midboard_aileron_deg = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    rtb_right_spoiler_2_deg = A380PrimComputer_P.Gain3_Gain * rtb_right_midboard_aileron_deg +
      rtb_right_outboard_aileron_deg;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation3_UpperSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation3_UpperSat;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation3_LowerSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation3_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs2_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs2_lo, A380PrimComputer_U.in.time.dt, rtb_leftMidboardAilPos,
      ((!rtb_AND10) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_f);
    if (rtb_AND20) {
      rtb_left_midboard_aileron_deg = rtb_Switch4_d;
    } else {
      rtb_left_midboard_aileron_deg = rtb_Switch_left_midboard_aileron_command_deg_Data;
    }

    rtb_right_spoiler_2_deg = rtb_right_outboard_aileron_deg + rtb_right_midboard_aileron_deg;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation4_UpperSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation4_UpperSat;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation4_LowerSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation4_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs3_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs3_lo, A380PrimComputer_U.in.time.dt, rtb_rightMidboardAilPos,
      ((!rtb_AND9) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_au);
    if (rtb_AND20) {
      rtb_right_midboard_aileron_deg = rtb_Switch4_d;
    } else {
      rtb_right_midboard_aileron_deg = rtb_Switch_right_midboard_aileron_command_deg_Data;
    }

    rtb_outerAilUpperLim = std::fmax(std::fmin(-(rtb_V_ias - 240.0) / 20.0, 1.0), 0.0) * 20.0;
    rtb_outerAilLowerLim = std::fmax(std::fmin(-(rtb_V_ias - 300.0) / 20.0, 1.0), 0.0) * -30.0;
    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_right_spoiler_2_deg = rtb_xi_outboard_deg;
      break;

     case 1:
      rtb_right_spoiler_2_deg = rtb_xi_outboard_deg_l;
      break;

     default:
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    rtb_Sum6 = A380PrimComputer_P.Gain4_Gain * rtb_right_spoiler_2_deg + rtb_right_outboard_aileron_deg;
    if (rtb_Sum6 > rtb_outerAilUpperLim) {
      rtb_Sum6 = rtb_outerAilUpperLim;
    } else if (rtb_Sum6 < rtb_outerAilLowerLim) {
      rtb_Sum6 = rtb_outerAilLowerLim;
    }

    A380PrimComputer_RateLimiter_a(rtb_Sum6, A380PrimComputer_P.RateLimiterGenericVariableTs4_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs4_lo, A380PrimComputer_U.in.time.dt, rtb_leftOutboardAilPos,
      ((!rtb_AND3) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_mn);
    if (rtb_AND20) {
      rtb_Sum6 = rtb_Switch4_d;
    } else {
      rtb_Sum6 = rtb_Switch_left_outboard_aileron_command_deg_Data;
    }

    rtb_right_outboard_aileron_deg += rtb_right_spoiler_2_deg;
    if (rtb_right_outboard_aileron_deg > rtb_outerAilUpperLim) {
      rtb_right_outboard_aileron_deg = rtb_outerAilUpperLim;
    } else if (rtb_right_outboard_aileron_deg < rtb_outerAilLowerLim) {
      rtb_right_outboard_aileron_deg = rtb_outerAilLowerLim;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_outboard_aileron_deg, A380PrimComputer_P.RateLimiterGenericVariableTs5_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs5_lo, A380PrimComputer_U.in.time.dt, rtb_rightOutboardAilPos,
      ((!rudder2HydraulicModeHasPriority) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_lm);
    if (rtb_AND20) {
      rtb_right_outboard_aileron_deg = rtb_Switch4_d;
    } else {
      rtb_right_outboard_aileron_deg = rtb_Switch_right_outboard_aileron_command_deg_Data;
    }

    if (rtb_AND19) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant5_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant6_Value;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs4_up, A380PrimComputer_P.RateLimiterVariableTs4_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.RateLimiterVariableTs4_InitialCondition, &rtb_Y_dc,
      &A380PrimComputer_DWork.sf_RateLimiter_c);
    if (A380PrimComputer_DWork.Delay1_DSTATE_b) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs6_up, A380PrimComputer_P.RateLimiterVariableTs6_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.RateLimiterVariableTs6_InitialCondition, &rtb_Y_dc,
      &A380PrimComputer_DWork.sf_RateLimiter_g);
    rtb_right_spoiler_2_deg = A380PrimComputer_P.Gain5_Gain * rtb_Y_dc;
    rtb_NOT_k = (A380PrimComputer_DWork.Delay1_DSTATE_b || rtb_AND19);
    switch (static_cast<int32_T>(rtb_Switch_g_idx_0)) {
     case 2:
      rtb_outerAilUpperLim = 0.26666666666666666;
      break;

     case 3:
      rtb_outerAilUpperLim = 0.2;
      break;

     case 4:
      rtb_outerAilUpperLim = 0.17777777777777778;
      break;

     case 5:
      rtb_outerAilUpperLim = 0.13333333333333333;
      break;

     default:
      rtb_outerAilUpperLim = 0.44444444444444442;
      break;
    }

    A380PrimComputer_RateLimiter_c(rtb_outerAilUpperLim, A380PrimComputer_P.RateLimiterGenericVariableTs28_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs28_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.reset_Value_h, &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_h);
    if (rtb_y_nl) {
      rtb_outerAilUpperLim = A380PrimComputer_P.Constant8_Value_d;
    } else {
      rtb_outerAilUpperLim = look1_binlxpw(A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos,
        A380PrimComputer_P.uDLookupTable_bp01Data, A380PrimComputer_P.uDLookupTable_tableData, 4U);
    }

    A380PrimComputer_RateLimiter_m(rtb_outerAilUpperLim, A380PrimComputer_P.RateLimiterGenericVariableTs24_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs24_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterGenericVariableTs24_InitialCondition, A380PrimComputer_P.reset_Value_f,
      &rtb_Switch10_n, &A380PrimComputer_DWork.sf_RateLimiter_me);
    if (rtb_BusAssignment_p_logic_spoiler_lift_active) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant9_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant8_Value_d;
    }

    A380PrimComputer_RateLimiter_m
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs25_up, A380PrimComputer_P.RateLimiterGenericVariableTs25_lo,
       A380PrimComputer_U.in.time.dt, A380PrimComputer_P.RateLimiterGenericVariableTs25_InitialCondition,
       A380PrimComputer_P.reset_Value_l, &rtb_Switch1_k, &A380PrimComputer_DWork.sf_RateLimiter_md);
    rtb_left_spoiler_3_deg = std::fmin(rtb_Switch4_d * rtb_Switch10_n, rtb_Switch1_k);
    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_right_spoiler_2_deg;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_left_spoiler_3_deg;
    }

    rtb_y_g = ((!rtb_AND13) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs8_up, A380PrimComputer_P.RateLimiterGenericVariableTs8_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data), rtb_y_g, &rtb_Switch4_d,
       &A380PrimComputer_DWork.sf_RateLimiter_j4);
    if (rtb_AND20) {
      rtb_outerAilUpperLim = rtb_Switch4_d;
    } else {
      rtb_outerAilUpperLim = rtb_Switch_left_spoiler_1_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_right_spoiler_2_deg;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_left_spoiler_3_deg;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs9_up, A380PrimComputer_P.RateLimiterGenericVariableTs9_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data), rtb_y_g, &rtb_Switch4_d,
       &A380PrimComputer_DWork.sf_RateLimiter_cd);
    if (rtb_AND20) {
      rtb_outerAilLowerLim = rtb_Switch4_d;
    } else {
      rtb_outerAilLowerLim = rtb_Switch_right_spoiler_1_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_right_spoiler_2_deg;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_left_spoiler_3_deg;
    }

    rtb_y_g = ((!rtb_AND17) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs10_up, A380PrimComputer_P.RateLimiterGenericVariableTs10_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data), rtb_y_g, &rtb_Switch4_d,
       &A380PrimComputer_DWork.sf_RateLimiter_l);
    if (rtb_AND20) {
      rtb_left_spoiler_2_deg = rtb_Switch4_d;
    } else {
      rtb_left_spoiler_2_deg = rtb_Switch_left_spoiler_2_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_left_spoiler_3_deg = rtb_right_spoiler_2_deg;
    }

    A380PrimComputer_RateLimiter_a(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterGenericVariableTs11_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs11_lo, A380PrimComputer_U.in.time.dt, static_cast<real_T>
      (A380PrimComputer_U.in.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data), rtb_y_g, &rtb_Switch4_d,
      &A380PrimComputer_DWork.sf_RateLimiter_d);
    if (rtb_AND20) {
      rtb_right_spoiler_2_deg = rtb_Switch4_d;
    } else {
      rtb_right_spoiler_2_deg = rtb_Switch_right_spoiler_2_command_deg_Data;
    }

    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_xi_spoiler_deg_b = rtb_xi_spoiler_deg;
      break;

     case 1:
      rtb_xi_spoiler_deg_b = rtb_xi_spoiler_deg_i;
      break;

     default:
      rtb_xi_spoiler_deg_b = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    switch (static_cast<int32_T>(rtb_Switch_g_idx_0)) {
     case 2:
      rtb_left_spoiler_3_deg = 0.37777777777777777;
      break;

     case 3:
      rtb_left_spoiler_3_deg = 0.2;
      break;

     case 4:
      rtb_left_spoiler_3_deg = 0.066666666666666666;
      break;

     case 5:
      rtb_left_spoiler_3_deg = 0.0;
      break;

     default:
      rtb_left_spoiler_3_deg = 0.44444444444444442;
      break;
    }

    A380PrimComputer_RateLimiter_c(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterGenericVariableTs27_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs27_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.reset_Value_d, &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_mv);
    A380PrimComputer_Spoiler345Computation(rtb_xi_spoiler_deg_b, std::fmin(rtb_Switch4_d * rtb_Switch10_n, rtb_Switch1_k),
      &rtb_Switch4_d, &rtb_Switch_h);
    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch4_d;
    }

    rtb_y_g = ((!rtb_AND4_d) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs14_up, A380PrimComputer_P.RateLimiterGenericVariableTs14_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data), rtb_y_g, &rtb_eta_trim_limit_up_m,
       &A380PrimComputer_DWork.sf_RateLimiter_gr);
    if (rtb_AND20) {
      rtb_left_spoiler_3_deg = rtb_eta_trim_limit_up_m;
    } else {
      rtb_left_spoiler_3_deg = rtb_Switch_left_spoiler_3_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs15_up, A380PrimComputer_P.RateLimiterGenericVariableTs15_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data), rtb_y_g, &rtb_eta_trim_limit_up_m,
       &A380PrimComputer_DWork.sf_RateLimiter_nh);
    if (rtb_AND20) {
      rtb_right_spoiler_3_deg = rtb_eta_trim_limit_up_m;
    } else {
      rtb_right_spoiler_3_deg = rtb_Switch_right_spoiler_3_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch4_d;
    }

    rtb_y_g = ((!rtb_AND7) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs12_up, A380PrimComputer_P.RateLimiterGenericVariableTs12_lo,
       A380PrimComputer_U.in.time.dt, rtb_leftSplr4Pos, rtb_y_g, &rtb_eta_trim_limit_up_m,
       &A380PrimComputer_DWork.sf_RateLimiter_c5);
    if (rtb_AND20) {
      rtb_Switch9_f = rtb_eta_trim_limit_up_m;
    } else {
      rtb_Switch9_f = rtb_Switch_left_spoiler_4_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs13_up, A380PrimComputer_P.RateLimiterGenericVariableTs13_lo,
       A380PrimComputer_U.in.time.dt, rtb_rightSplr4Pos, rtb_y_g, &rtb_eta_trim_limit_up_m,
       &A380PrimComputer_DWork.sf_RateLimiter_m);
    if (rtb_AND20) {
      rtb_Switch8_o = rtb_eta_trim_limit_up_m;
    } else {
      rtb_Switch8_o = rtb_Switch_right_spoiler_4_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch4_d;
    }

    rtb_y_g = ((!rtb_AND8) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs18_up, A380PrimComputer_P.RateLimiterGenericVariableTs18_lo,
       A380PrimComputer_U.in.time.dt, rtb_leftSplr5Pos, rtb_y_g, &rtb_Switch4_d,
       &A380PrimComputer_DWork.sf_RateLimiter_n2);
    if (rtb_AND20) {
      rtb_Switch7_e = rtb_Switch4_d;
    } else {
      rtb_Switch7_e = rtb_Switch_left_spoiler_5_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Switch_h = rtb_Y_dc;
    }

    A380PrimComputer_RateLimiter_a(rtb_Switch_h, A380PrimComputer_P.RateLimiterGenericVariableTs19_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs19_lo, A380PrimComputer_U.in.time.dt, rtb_rightSplr5Pos, rtb_y_g,
      &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_j);
    if (rtb_AND20) {
      rtb_Switch6_i = rtb_Switch4_d;
    } else {
      rtb_Switch6_i = rtb_Switch_right_spoiler_5_command_deg_Data;
    }

    switch (static_cast<int32_T>(rtb_Switch_g_idx_0)) {
     case 2:
      rtb_speedBrakeGain = 0.46666666666666667;
      break;

     case 3:
      rtb_speedBrakeGain = 0.37777777777777777;
      break;

     case 4:
      rtb_speedBrakeGain = 0.22222222222222221;
      break;

     case 5:
      rtb_speedBrakeGain = 0.22222222222222221;
      break;

     default:
      rtb_speedBrakeGain = 1.0;
      break;
    }

    A380PrimComputer_RateLimiter_c(rtb_speedBrakeGain, A380PrimComputer_P.RateLimiterGenericVariableTs26_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs26_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.reset_Value_a, &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_cp);
    A380PrimComputer_Spoiler345Computation(rtb_xi_spoiler_deg_b, std::fmin(rtb_Switch4_d * rtb_Switch10_n, rtb_Switch1_k),
      &rtb_Switch4_d, &rtb_Switch_h);
    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch4_d;
    }

    rtb_y_g = ((!rtb_AND15) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs16_up, A380PrimComputer_P.RateLimiterGenericVariableTs16_lo,
       A380PrimComputer_U.in.time.dt, rtb_leftSplr6Pos, rtb_y_g, &rtb_Switch1_k,
       &A380PrimComputer_DWork.sf_RateLimiter_k);
    if (rtb_AND20) {
      rtb_xi_spoiler_deg_b = rtb_Switch1_k;
    } else {
      rtb_xi_spoiler_deg_b = rtb_Switch_left_spoiler_6_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs17_up, A380PrimComputer_P.RateLimiterGenericVariableTs17_lo,
       A380PrimComputer_U.in.time.dt, rtb_rightSplr6Pos, rtb_y_g, &rtb_Switch1_k,
       &A380PrimComputer_DWork.sf_RateLimiter_bo);
    if (rtb_AND20) {
      rtb_speedBrakeGain = rtb_Switch1_k;
    } else {
      rtb_speedBrakeGain = rtb_Switch_right_spoiler_6_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch4_d;
    }

    rtb_y_g = ((!rtb_AND16) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs22_up, A380PrimComputer_P.RateLimiterGenericVariableTs22_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data), rtb_y_g, &rtb_Switch1_k,
       &A380PrimComputer_DWork.sf_RateLimiter_i);
    if (rtb_AND20) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg = rtb_Switch1_k;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg =
        rtb_Switch_left_spoiler_7_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs23_up, A380PrimComputer_P.RateLimiterGenericVariableTs23_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data), rtb_y_g, &rtb_Switch1_k,
       &A380PrimComputer_DWork.sf_RateLimiter_f1);
    if (rtb_AND20) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg = rtb_Switch1_k;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg =
        rtb_Switch_right_spoiler_7_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_dc;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch4_d;
    }

    rtb_y_g = ((!rtb_AND9_o) || rtb_AND2_i);
    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs20_up, A380PrimComputer_P.RateLimiterGenericVariableTs20_lo,
       A380PrimComputer_U.in.time.dt, static_cast<real_T>
       (A380PrimComputer_U.in.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data), rtb_y_g, &rtb_Switch4_d,
       &A380PrimComputer_DWork.sf_RateLimiter_gm);
    if (rtb_AND20) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Switch4_d;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        rtb_Switch_left_spoiler_8_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Switch_h = rtb_Y_dc;
    }

    A380PrimComputer_RateLimiter_a(rtb_Switch_h, A380PrimComputer_P.RateLimiterGenericVariableTs21_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs21_lo, A380PrimComputer_U.in.time.dt, static_cast<real_T>
      (A380PrimComputer_U.in.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data), rtb_y_g, &rtb_Switch4_d,
      &A380PrimComputer_DWork.sf_RateLimiter_nl);
    if (rtb_AND20) {
      rtb_Y_dc = rtb_Switch4_d;
    } else {
      rtb_Y_dc = rtb_Switch_right_spoiler_8_command_deg_Data;
    }

    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_Switch_h = rtb_zeta_upper_deg;
      break;

     case 1:
      rtb_Switch_h = rtb_zeta_upper_deg_p;
      break;

     default:
      rtb_Switch_h = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_Switch_h, A380PrimComputer_P.RateLimiterGenericVariableTs6_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs6_lo, A380PrimComputer_U.in.time.dt, rtb_upperRudderPos,
      ((!rtb_AND3_h) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_np);
    if (rtb_AND20) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg = rtb_Switch4_d;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg =
        rtb_Switch_upper_rudder_command_deg_Data;
    }

    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_Switch_h = rtb_zeta_lower_deg;
      break;

     case 1:
      rtb_Switch_h = rtb_zeta_lower_deg_n;
      break;

     default:
      rtb_Switch_h = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_Switch_h, A380PrimComputer_P.RateLimiterGenericVariableTs7_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs7_lo, A380PrimComputer_U.in.time.dt, rtb_lowerRudderPos,
      ((!rtb_AND15_l) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_iy);
    if (!rtb_AND20) {
      rtb_Switch4_d = rtb_Switch_lower_rudder_command_deg_Data;
    }

    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg = rtb_Switch4_d;
    rtb_Gain_f = A380PrimComputer_P.DiscreteDerivativeVariableTs_Gain * rtb_theta_dot;
    A380PrimComputer_LagFilter((rtb_Gain_f - A380PrimComputer_DWork.Delay_DSTATE) / A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.LagFilter_C1_e, A380PrimComputer_U.in.time.dt, &rtb_Switch_h,
      &A380PrimComputer_DWork.sf_LagFilter);
    rtb_Switch4_d = ((rtb_leftInboardElevPos + rtb_rightInboardElevPos) + rtb_leftOutboardElevPos) +
      rtb_rightOutboardElevPos;
    rtb_Switch10_n = rtb_Switch4_d * A380PrimComputer_P.Gain_Gain_a;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_p, &rtb_y_m);
    rtb_y_fl = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_h, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_fv, &rtb_y_m);
    rtb_y_g = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_cv, &rtb_y_m);
    rtb_y_lu = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_n4, &rtb_y_m);
    rtb_DataTypeConversion_m5 = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_py, &rtb_y_m);
    A380PrimComputer_MATLABFunction_o(rtb_y_fl, rtb_NOT_k, rtb_y_g, rtb_y_lu, rtb_DataTypeConversion_m5, (rtb_y_m != 0U),
      &rtb_Switch1_k);
    rtb_y_fl = (rtb_OR || ((static_cast<real_T>(rtb_law_k) != A380PrimComputer_P.CompareToConstant_const_f) && (
      static_cast<real_T>(rtb_law_k) != A380PrimComputer_P.CompareToConstant2_const_f)));
    LawMDLOBJ5.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_U.in.time.simulation_time, &rtb_elevator2Command,
                    &rtb_rightAileron2Command, &rtb_elevator1Command, &rtb_elevator3Command, &rtb_Switch_h,
                    &rtb_Switch10_n, &A380PrimComputer_U.in.analog_inputs.ths_pos_deg, &rtb_Y, &rtb_eta_deg_dv,
                    &rtb_eta_trim_dot_deg_s_n, &rtb_handleIndex_b, &rtb_Switch1_k, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), (const_cast<real_T*>(&A380PrimComputer_RGND)), &A380PrimComputer_P.Constant_Value_g,
                    &A380PrimComputer_P.Constant_Value_g, &A380PrimComputer_U.in.sim_data.tailstrike_protection_on, (
      const_cast<real_T*>(&A380PrimComputer_RGND)), &u0, &rtb_OR6, &rtb_y_fl, &A380PrimComputer_DWork.sProtActive_l,
                    &A380PrimComputer_DWork.sProtActive, &rtb_handleIndex, &rtb_BusAssignment_nw_logic_alpha_max_deg,
                    &rtb_BusAssignment_nw_logic_high_speed_prot_hi_thresh_kn,
                    &rtb_BusAssignment_nw_logic_high_speed_prot_lo_thresh_kn,
                    &A380PrimComputer_U.in.temporary_ap_input.pitch_command,
                    &A380PrimComputer_U.in.temporary_ap_input.ap_engaged, &rtb_eta_deg, &rtb_eta_trim_dot_deg_s,
                    &rtb_eta_trim_limit_lo, &rtb_eta_trim_limit_up);
    rtb_Switch4_d *= A380PrimComputer_P.Gain_Gain_g;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_n, &rtb_y_m);
    rtb_y_fl = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_h1, &rtb_y_m);
    rtb_NOT_k = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_gn, &rtb_y_m);
    rtb_y_g = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_b, &rtb_y_m);
    rtb_y_lu = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_i, &rtb_y_m);
    rtb_DataTypeConversion_m5 = (rtb_y_m != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_l, &rtb_y_m);
    A380PrimComputer_MATLABFunction_o(rtb_y_fl, rtb_NOT_k, rtb_y_g, rtb_y_lu, rtb_DataTypeConversion_m5, (rtb_y_m != 0U),
      &rtb_handleIndex_b);
    rtb_y_fl = (rtb_OR || ((static_cast<real_T>(rtb_law_k) != A380PrimComputer_P.CompareToConstant3_const_o) && (
      static_cast<real_T>(rtb_law_k) != A380PrimComputer_P.CompareToConstant4_const_o) && (static_cast<real_T>(rtb_law_k)
      != A380PrimComputer_P.CompareToConstant5_const_b)));
    rtb_NOT_k = (rtb_law_k != A380PrimComputer_P.EnumeratedConstant_Value_b);
    LawMDLOBJ3.step(&A380PrimComputer_U.in.time.dt, &rtb_elevator2Command, &rtb_rightAileron2Command,
                    &rtb_elevator1Command, &rtb_elevator3Command, &rtb_Switch4_d,
                    &A380PrimComputer_U.in.analog_inputs.ths_pos_deg, &rtb_eta_deg_dv, &rtb_eta_trim_limit_lo_d,
                    &rtb_eta_trim_dot_deg_s_n, &rtb_handleIndex_b, (const_cast<real_T*>(&A380PrimComputer_RGND)), (
      const_cast<real_T*>(&A380PrimComputer_RGND)), &u0, &rtb_y_fl, &rtb_NOT_k, &rtb_eta_deg_o,
                    &rtb_eta_trim_dot_deg_s_a, &rtb_eta_trim_limit_lo_h, &rtb_eta_trim_limit_up_d);
    LawMDLOBJ4.step(&A380PrimComputer_U.in.time.dt, &u0, &rtb_eta_deg_dv, &rtb_eta_trim_dot_deg_s_n,
                    &rtb_eta_trim_limit_lo_d, &rtb_eta_trim_limit_up_m);
    switch (static_cast<int32_T>(rtb_law_k)) {
     case 0:
     case 1:
      rtb_eta_deg_dv = rtb_eta_deg;
      break;

     case 2:
     case 3:
     case 4:
      rtb_eta_deg_dv = rtb_eta_deg_o;
      break;

     case 5:
      break;

     default:
      rtb_eta_deg_dv = A380PrimComputer_P.Constant_Value_af;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs_up_a,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo_f, A380PrimComputer_U.in.time.dt, rtb_leftInboardElevPos,
      ((!rtb_AND2_ac) || rtb_AND2_i), &rtb_Switch4_d, &A380PrimComputer_DWork.sf_RateLimiter_cr);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel_bit_of, &rtb_y_m);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_fl);
    if ((rtb_y_m != 0U) && rtb_y_fl) {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_command_deg.Data;
    } else {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_command_deg.Data;
    }

    if (!rtb_AND20) {
      rtb_Switch4_d = rtb_Switch_left_inboard_aileron_command_deg_Data;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs1_up_a,
      A380PrimComputer_P.RateLimiterGenericVariableTs1_lo_c, A380PrimComputer_U.in.time.dt, rtb_rightInboardElevPos,
      ((!rtb_AND1_at) || rtb_AND2_i), &rtb_Switch_h, &A380PrimComputer_DWork.sf_RateLimiter_p);
    if (!rtb_AND20) {
      rtb_Switch_h = rtb_Switch_right_inboard_aileron_command_deg_Data;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs2_up_l,
      A380PrimComputer_P.RateLimiterGenericVariableTs2_lo_k, A380PrimComputer_U.in.time.dt, rtb_leftOutboardElevPos,
      ((!rtb_AND5_e) || rtb_AND2_i), &rtb_Switch1_k, &A380PrimComputer_DWork.sf_RateLimiter_cda);
    if (!rtb_AND20) {
      rtb_Switch1_k = rtb_Switch_left_midboard_aileron_command_deg_Data;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs3_up_j,
      A380PrimComputer_P.RateLimiterGenericVariableTs3_lo_k, A380PrimComputer_U.in.time.dt, rtb_rightOutboardElevPos, ((
      !rtb_AND4_fg3) || rtb_AND2_i), &rtb_Switch10_n, &A380PrimComputer_DWork.sf_RateLimiter_ph);
    if (!rtb_AND20) {
      rtb_Switch10_n = rtb_Switch_right_midboard_aileron_command_deg_Data;
    }

    switch (static_cast<int32_T>(rtb_law_k)) {
     case 0:
     case 1:
      rtb_eta_trim_limit_up_m = rtb_eta_trim_limit_up;
      break;

     case 2:
     case 3:
     case 4:
      rtb_eta_trim_limit_up_m = rtb_eta_trim_limit_up_d;
      break;

     case 5:
      break;

     default:
      rtb_eta_trim_limit_up_m = A380PrimComputer_P.Constant2_Value_l;
      break;
    }

    if (rtb_AND1_ci) {
      switch (static_cast<int32_T>(rtb_law_k)) {
       case 0:
       case 1:
        rtb_eta_trim_dot_deg_s_n = rtb_eta_trim_dot_deg_s;
        break;

       case 2:
       case 3:
       case 4:
        rtb_eta_trim_dot_deg_s_n = rtb_eta_trim_dot_deg_s_a;
        break;

       case 5:
        break;

       default:
        rtb_eta_trim_dot_deg_s_n = A380PrimComputer_P.Constant_Value_af;
        break;
      }

      rtb_AND2_i = ((!rtb_AND12) || rtb_AND2_i);
    } else {
      rtb_eta_trim_dot_deg_s_n = abs_rate_c;
      rtb_AND2_i = !rtb_thsEngaged;
    }

    rtb_eta_trim_dot_deg_s_n = A380PrimComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_eta_trim_dot_deg_s_n *
      A380PrimComputer_U.in.time.dt;
    A380PrimComputer_DWork.icLoad = (rtb_AND2_i || A380PrimComputer_DWork.icLoad);
    if (A380PrimComputer_DWork.icLoad) {
      A380PrimComputer_DWork.Delay_DSTATE_c = rtb_thsPos - rtb_eta_trim_dot_deg_s_n;
    }

    A380PrimComputer_DWork.Delay_DSTATE_c += rtb_eta_trim_dot_deg_s_n;
    if (A380PrimComputer_DWork.Delay_DSTATE_c > rtb_eta_trim_limit_up_m) {
      A380PrimComputer_DWork.Delay_DSTATE_c = rtb_eta_trim_limit_up_m;
    } else {
      switch (static_cast<int32_T>(rtb_law_k)) {
       case 0:
       case 1:
        rtb_eta_trim_limit_lo_d = rtb_eta_trim_limit_lo;
        break;

       case 2:
       case 3:
       case 4:
        rtb_eta_trim_limit_lo_d = rtb_eta_trim_limit_lo_h;
        break;

       case 5:
        break;

       default:
        rtb_eta_trim_limit_lo_d = A380PrimComputer_P.Constant3_Value_h;
        break;
      }

      if (A380PrimComputer_DWork.Delay_DSTATE_c < rtb_eta_trim_limit_lo_d) {
        A380PrimComputer_DWork.Delay_DSTATE_c = rtb_eta_trim_limit_lo_d;
      }
    }

    if (rtb_AND20) {
      rtb_eta_trim_limit_up_m = A380PrimComputer_DWork.Delay_DSTATE_c;
    } else if (rtb_AND1_ci) {
      rtb_eta_trim_limit_up_m = rtb_Switch_left_outboard_aileron_command_deg_Data;
    } else {
      rtb_eta_trim_limit_up_m = A380PrimComputer_DWork.Delay_DSTATE_c;
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_eta_deg_dv = rtb_left_inboard_aileron_deg;
      rtb_eta_trim_dot_deg_s_n = rtb_right_inboard_aileron_deg;
      rtb_eta_trim_limit_lo_d = rtb_left_midboard_aileron_deg;
      rtb_rightAileron2Command = rtb_right_midboard_aileron_deg;
      rtb_elevator1Command = rtb_Switch1_k;
      rtb_elevator2Command = rtb_Switch4_d;
      rtb_elevator3Command = rtb_Switch10_n;
      rtb_handleIndex_b = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
      rtb_rudder2Command = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
      rtb_leftSpoilerCommand = rtb_xi_spoiler_deg_b;
      rtb_rightSpoilerCommand = rtb_speedBrakeGain;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_eta_deg_dv = rtb_Sum6;
      rtb_eta_trim_dot_deg_s_n = rtb_right_outboard_aileron_deg;
      rtb_eta_trim_limit_lo_d = rtb_left_inboard_aileron_deg;
      rtb_rightAileron2Command = rtb_right_inboard_aileron_deg;
      rtb_elevator1Command = rtb_Switch10_n;
      rtb_elevator2Command = rtb_Switch1_k;
      rtb_elevator3Command = rtb_Switch_h;
      rtb_handleIndex_b = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
      rtb_rudder2Command = 0.0;
      rtb_leftSpoilerCommand = rtb_Switch7_e;
      rtb_rightSpoilerCommand = rtb_Switch6_i;
    } else {
      rtb_eta_deg_dv = rtb_left_midboard_aileron_deg;
      rtb_eta_trim_dot_deg_s_n = rtb_right_midboard_aileron_deg;
      rtb_eta_trim_limit_lo_d = rtb_Sum6;
      rtb_rightAileron2Command = rtb_right_outboard_aileron_deg;
      rtb_elevator1Command = rtb_Switch4_d;
      rtb_elevator2Command = rtb_Switch_h;
      rtb_elevator3Command = 0.0;
      rtb_handleIndex_b = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
      rtb_rudder2Command = 0.0;
      rtb_leftSpoilerCommand = rtb_Switch9_f;
      rtb_rightSpoilerCommand = rtb_Switch8_o;
    }

    A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant_Value);
    if (rtb_AND20) {
      nz = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.Data = static_cast<real32_T>
        (rtb_right_inboard_aileron_deg);
      b_nz = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.Data = static_cast<real32_T>
        (rtb_left_midboard_aileron_deg);
      prim3LawCap = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.Data = static_cast<real32_T>
        (rtb_right_midboard_aileron_deg);
      iindx = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.Data = static_cast<real32_T>(rtb_Sum6);
      rtb_left_outboard_aileron_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.Data = static_cast<real32_T>
        (rtb_right_outboard_aileron_deg);
      rtb_right_outboard_aileron_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.Data = static_cast<real32_T>(rtb_outerAilUpperLim);
      rtb_left_spoiler_1_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.Data = static_cast<real32_T>(rtb_outerAilLowerLim);
      rtb_right_spoiler_1_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.Data = static_cast<real32_T>(rtb_left_spoiler_2_deg);
      rtb_left_spoiler_2_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.Data = static_cast<real32_T>
        (rtb_right_spoiler_2_deg);
      rtb_right_spoiler_2_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.Data = static_cast<real32_T>(rtb_left_spoiler_3_deg);
      rtb_left_spoiler_3_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.Data = static_cast<real32_T>
        (rtb_right_spoiler_3_deg);
      rtb_right_spoiler_3_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.Data = static_cast<real32_T>(rtb_Switch9_f);
      rtb_left_spoiler_4_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.Data = static_cast<real32_T>(rtb_Switch8_o);
      rtb_right_spoiler_4_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.Data = static_cast<real32_T>(rtb_Switch7_e);
      rtb_left_spoiler_5_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.Data = static_cast<real32_T>(rtb_Switch6_i);
      rtb_right_spoiler_5_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.Data = static_cast<real32_T>(rtb_xi_spoiler_deg_b);
      rtb_left_spoiler_6_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.Data = static_cast<real32_T>(rtb_speedBrakeGain);
      rtb_right_spoiler_6_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg);
      rtb_left_spoiler_7_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg);
      rtb_right_spoiler_7_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg);
      rtb_left_spoiler_8_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.Data = static_cast<real32_T>(rtb_Y_dc);
      rtb_right_spoiler_8_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.Data = static_cast<real32_T>(rtb_Switch4_d);
      rtb_left_inboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.Data = static_cast<real32_T>(rtb_Switch_h);
      rtb_right_inboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.Data = static_cast<real32_T>(rtb_Switch1_k);
      rtb_left_outboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.Data = static_cast<real32_T>(rtb_Switch10_n);
      rtb_right_outboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.ths_command_deg.Data = static_cast<real32_T>(rtb_eta_trim_limit_up_m);
      rtb_ths_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg);
      A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg);
    } else {
      nz = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.Data = A380PrimComputer_P.Constant14_Value;
      b_nz = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.Data = A380PrimComputer_P.Constant13_Value;
      prim3LawCap = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.Data = A380PrimComputer_P.Constant12_Value;
      iindx = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.Data = A380PrimComputer_P.Constant11_Value_i;
      rtb_left_outboard_aileron_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.Data = A380PrimComputer_P.Constant10_Value_d;
      rtb_right_outboard_aileron_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.Data = A380PrimComputer_P.Constant9_Value_d;
      rtb_left_spoiler_1_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.Data = A380PrimComputer_P.Constant8_Value_l;
      rtb_right_spoiler_1_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.Data = A380PrimComputer_P.Constant24_Value;
      rtb_left_spoiler_2_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.Data = A380PrimComputer_P.Constant23_Value;
      rtb_right_spoiler_2_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.Data = A380PrimComputer_P.Constant7_Value_a;
      rtb_left_spoiler_3_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.Data = A380PrimComputer_P.Constant6_Value_a0;
      rtb_right_spoiler_3_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.Data = A380PrimComputer_P.Constant26_Value;
      rtb_left_spoiler_4_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.Data = A380PrimComputer_P.Constant25_Value;
      rtb_right_spoiler_4_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.Data = A380PrimComputer_P.Constant28_Value;
      rtb_left_spoiler_5_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.Data = A380PrimComputer_P.Constant27_Value;
      rtb_right_spoiler_5_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.Data = A380PrimComputer_P.Constant5_Value_c;
      rtb_left_spoiler_6_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.Data = A380PrimComputer_P.Constant4_Value_p;
      rtb_right_spoiler_6_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.Data = A380PrimComputer_P.Constant30_Value;
      rtb_left_spoiler_7_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.Data = A380PrimComputer_P.Constant29_Value;
      rtb_right_spoiler_7_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.Data = A380PrimComputer_P.Constant32_Value;
      rtb_left_spoiler_8_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.Data = A380PrimComputer_P.Constant31_Value;
      rtb_right_spoiler_8_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.Data = A380PrimComputer_P.Constant3_Value_m;
      rtb_left_inboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.Data = A380PrimComputer_P.Constant33_Value;
      rtb_right_inboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.Data = A380PrimComputer_P.Constant34_Value;
      rtb_left_outboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.Data = A380PrimComputer_P.Constant35_Value;
      rtb_right_outboard_elevator_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.ths_command_deg.Data = A380PrimComputer_P.Constant2_Value_n;
      rtb_ths_command_deg_SSM = static_cast<int32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.Data = A380PrimComputer_P.Constant1_Value_g;
      A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.Data = A380PrimComputer_P.Constant15_Value;
    }

    rtb_VectorConcatenate[0] = rtb_doubleIrFault_tmp;
    rtb_VectorConcatenate[1] = rtb_doubleIrFault_tmp;
    rtb_VectorConcatenate[2] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[3] = rtb_OR3;
    rtb_VectorConcatenate[4] = rtb_OR3;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[6] = leftAileron2Avail;
    rtb_VectorConcatenate[7] = rtb_AND1_e;
    rtb_VectorConcatenate[8] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[9] = rtb_OR1;
    rtb_VectorConcatenate[10] = rtb_rightAileron2Engaged;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant16_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.aileron_status_word.Data);
    rtb_VectorConcatenate[0] = leftSpoilerHydraulicModeAvail;
    rtb_VectorConcatenate[1] = leftSpoilerElectricModeAvail;
    rtb_VectorConcatenate[2] = rtb_leftSpoilerHydraulicModeEngaged;
    rtb_VectorConcatenate[3] = rtb_leftSpoilerElectricModeEngaged;
    rtb_VectorConcatenate[4] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[6] = rightSpoilerHydraulicModeAvail;
    rtb_VectorConcatenate[7] = rightSpoilerElectricModeAvail;
    rtb_VectorConcatenate[8] = rtb_rightSpoilerHydraulicModeEngaged;
    rtb_VectorConcatenate[9] = rtb_rightSpoilerElectricModeEngaged;
    rtb_VectorConcatenate[10] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant17_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.spoiler_status_word.Data);
    rtb_VectorConcatenate[0] = elevator1Avail;
    rtb_VectorConcatenate[1] = elevator1Avail;
    rtb_VectorConcatenate[2] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[3] = elevator2Avail;
    rtb_VectorConcatenate[4] = rtb_AND_e;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[6] = rtb_y_fa;
    rtb_VectorConcatenate[7] = rtb_y_av;
    rtb_VectorConcatenate[8] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[9] = thsAvail;
    rtb_VectorConcatenate[10] = rtb_thsEngaged;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant18_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.elevator_status_word.Data);
    rtb_VectorConcatenate[0] = rudder1HydraulicModeAvail;
    rtb_VectorConcatenate[1] = rudder1ElectricModeAvail;
    rtb_VectorConcatenate[2] = rtb_rudder1HydraulicModeEngaged;
    rtb_VectorConcatenate[3] = rtb_AND_n;
    rtb_VectorConcatenate[4] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[6] = rtb_AND6_o;
    rtb_VectorConcatenate[7] = rudder1HydraulicModeHasPriority;
    rtb_VectorConcatenate[8] = rtb_rudder2HydraulicModeEngaged;
    rtb_VectorConcatenate[9] = rudder2ElectricModeHasPriority;
    rtb_VectorConcatenate[10] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant19_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate, &A380PrimComputer_Y.out.bus_outputs.rudder_status_word.Data);
    A380PrimComputer_Y.out.bus_outputs.fg_status_word.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg);
    A380PrimComputer_MATLABFunction_b(rtb_pitchLawCapability, &rtb_VectorConcatenate_ep[0], &rtb_VectorConcatenate_ep[1],
      &rtb_VectorConcatenate_ep[2]);
    A380PrimComputer_MATLABFunction2(a380_lateral_efcs_law::NormalLaw, &rtb_VectorConcatenate_ep[3],
      &rtb_VectorConcatenate_ep[4]);
    A380PrimComputer_MATLABFunction_b(rtb_law_k, &rtb_VectorConcatenate_ep[5], &rtb_VectorConcatenate_ep[6],
      &rtb_VectorConcatenate_ep[7]);
    A380PrimComputer_MATLABFunction2(rtb_activeLateralLaw, &rtb_VectorConcatenate_ep[8], &rtb_VectorConcatenate_ep[9]);
    rtb_VectorConcatenate_ep[10] = rtb_AND20;
    rtb_VectorConcatenate_ep[11] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[12] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[13] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[14] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[15] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[16] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[17] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[18] = A380PrimComputer_P.Constant21_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep,
      &A380PrimComputer_Y.out.bus_outputs.fctl_law_status_word.Data);
    rtb_VectorConcatenate_ep[0] = rtb_AND1_ci;
    rtb_VectorConcatenate_ep[1] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[2] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[3] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[4] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[5] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[6] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[7] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[8] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[9] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[10] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[11] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[12] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[13] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[14] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[15] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[16] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[17] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_ep[18] = A380PrimComputer_P.Constant22_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep,
      &A380PrimComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
    rtb_VectorConcatenate_ep[0] = rtb_AND18_c;
    rtb_VectorConcatenate_ep[1] = leftInboardElevEngaged;
    rtb_VectorConcatenate_ep[2] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[3] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[4] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[5] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[6] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[7] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[8] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[9] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[10] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[11] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[12] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[13] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[14] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[15] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[16] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[17] = A380PrimComputer_P.Constant36_Value;
    rtb_VectorConcatenate_ep[18] = A380PrimComputer_P.Constant36_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep, &A380PrimComputer_Y.out.bus_outputs.fe_status_word.Data);
    rtb_VectorConcatenate_ep[0] = A380PrimComputer_U.in.temporary_ap_input.ap_engaged;
    rtb_VectorConcatenate_ep[1] = A380PrimComputer_U.in.temporary_ap_input.ap_engaged;
    rtb_VectorConcatenate_ep[2] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[3] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[4] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[5] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[6] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[7] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[8] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[9] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[10] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[11] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[12] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[13] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[14] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[15] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[16] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[17] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[18] = A380PrimComputer_P.Constant37_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep, &A380PrimComputer_Y.out.bus_outputs.fg_status_word.Data);
    A380PrimComputer_Y.out.data = A380PrimComputer_U.in;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_inboard_aileron_deg = rtb_left_inboard_aileron_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_inboard_aileron_deg = rtb_right_inboard_aileron_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_midboard_aileron_deg = rtb_left_midboard_aileron_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_midboard_aileron_deg = rtb_right_midboard_aileron_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_outboard_aileron_deg = rtb_Sum6;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_outboard_aileron_deg = rtb_right_outboard_aileron_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_1_deg = rtb_outerAilUpperLim;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_1_deg = rtb_outerAilLowerLim;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_2_deg = rtb_left_spoiler_2_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_2_deg = rtb_right_spoiler_2_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_3_deg = rtb_left_spoiler_3_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_3_deg = rtb_right_spoiler_3_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_4_deg = rtb_Switch9_f;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_4_deg = rtb_Switch8_o;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_5_deg = rtb_Switch7_e;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_5_deg = rtb_Switch6_i;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_6_deg = rtb_xi_spoiler_deg_b;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_6_deg = rtb_speedBrakeGain;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_7_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_7_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_8_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_8_deg = rtb_Y_dc;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.upper_rudder_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.lower_rudder_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
    A380PrimComputer_Y.out.laws.pitch_law_outputs.left_inboard_elevator_deg = rtb_Switch4_d;
    A380PrimComputer_Y.out.laws.pitch_law_outputs.right_inboard_elevator_deg = rtb_Switch_h;
    A380PrimComputer_Y.out.laws.pitch_law_outputs.left_outboard_elevator_deg = rtb_Switch1_k;
    A380PrimComputer_Y.out.laws.pitch_law_outputs.right_outboard_elevator_deg = rtb_Switch10_n;
    A380PrimComputer_Y.out.laws.pitch_law_outputs.ths_deg = rtb_eta_trim_limit_up_m;
    A380PrimComputer_Y.out.logic.on_ground = rtb_OR6;
    A380PrimComputer_Y.out.logic.tracking_mode_on = rtb_OR;
    A380PrimComputer_Y.out.logic.surface_statuses.left_inboard_aileron_engaged = rtb_AND4_f;
    A380PrimComputer_Y.out.logic.surface_statuses.right_inboard_aileron_engaged = rtb_AND11;
    A380PrimComputer_Y.out.logic.surface_statuses.left_midboard_aileron_engaged = rtb_AND10;
    A380PrimComputer_Y.out.logic.surface_statuses.right_midboard_aileron_engaged = rtb_AND9;
    A380PrimComputer_Y.out.logic.surface_statuses.left_outboard_aileron_engaged = rtb_AND3;
    A380PrimComputer_Y.out.logic.surface_statuses.right_outboard_aileron_engaged = rudder2HydraulicModeHasPriority;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_1_engaged = rtb_AND13;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_2_engaged = rtb_AND17;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_3_engaged = rtb_AND4_d;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_4_engaged = rtb_AND7;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_5_engaged = rtb_AND8;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_6_engaged = rtb_AND15;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_7_engaged = rtb_AND16;
    A380PrimComputer_Y.out.logic.surface_statuses.spoiler_pair_8_engaged = rtb_AND9_o;
    A380PrimComputer_Y.out.logic.surface_statuses.left_inboard_elevator_engaged = rtb_AND2_ac;
    A380PrimComputer_Y.out.logic.surface_statuses.right_inboard_elevator_engaged = rtb_AND1_at;
    A380PrimComputer_Y.out.logic.surface_statuses.left_outboard_elevator_engaged = rtb_AND5_e;
    A380PrimComputer_Y.out.logic.surface_statuses.right_outboard_elevator_engaged = rtb_AND4_fg3;
    A380PrimComputer_Y.out.logic.surface_statuses.ths_engaged = rtb_AND12;
    A380PrimComputer_Y.out.logic.surface_statuses.upper_rudder_engaged = rtb_AND3_h;
    A380PrimComputer_Y.out.logic.surface_statuses.lower_rudder_engaged = rtb_AND15_l;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_inboard_aileron_deg = rtb_leftInboardAilPos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_inboard_aileron_deg = rtb_rightInboardAilPos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_midboard_aileron_deg = rtb_leftMidboardAilPos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_midboard_aileron_deg = rtb_rightMidboardAilPos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_outboard_aileron_deg = rtb_leftOutboardAilPos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_outboard_aileron_deg = rtb_rightOutboardAilPos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_1_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_1_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_2_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_2_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_3_deg =
      A380PrimComputer_U.in.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_3_deg =
      A380PrimComputer_U.in.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_4_deg = rtb_leftSplr4Pos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_4_deg = rtb_rightSplr4Pos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_5_deg = rtb_leftSplr5Pos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_5_deg = rtb_rightSplr5Pos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_6_deg = rtb_leftSplr6Pos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_6_deg = rtb_rightSplr6Pos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_7_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_7_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.left_spoiler_8_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.right_spoiler_8_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.upper_rudder_deg = rtb_upperRudderPos;
    A380PrimComputer_Y.out.logic.lateral_surface_positions.lower_rudder_deg = rtb_lowerRudderPos;
    A380PrimComputer_Y.out.logic.pitch_surface_positions.left_inboard_elevator_deg = rtb_leftInboardElevPos;
    A380PrimComputer_Y.out.logic.pitch_surface_positions.right_inboard_elevator_deg = rtb_rightInboardElevPos;
    A380PrimComputer_Y.out.logic.pitch_surface_positions.left_outboard_elevator_deg = rtb_leftOutboardElevPos;
    A380PrimComputer_Y.out.logic.pitch_surface_positions.right_outboard_elevator_deg = rtb_rightOutboardElevPos;
    A380PrimComputer_Y.out.logic.pitch_surface_positions.ths_deg = rtb_thsPos;
    A380PrimComputer_Y.out.logic.lateral_law_capability = a380_lateral_efcs_law::NormalLaw;
    A380PrimComputer_Y.out.logic.active_lateral_law = rtb_activeLateralLaw;
    A380PrimComputer_Y.out.logic.pitch_law_capability = rtb_pitchLawCapability;
    A380PrimComputer_Y.out.logic.active_pitch_law = rtb_law_k;
    A380PrimComputer_Y.out.logic.abnormal_condition_law_active = rtb_AND16_n;
    A380PrimComputer_Y.out.logic.is_master_prim = rtb_AND20;
    A380PrimComputer_Y.out.logic.elevator_1_avail = elevator1Avail;
    A380PrimComputer_Y.out.logic.elevator_1_engaged = elevator1Avail;
    A380PrimComputer_Y.out.logic.elevator_2_avail = elevator2Avail;
    A380PrimComputer_Y.out.logic.elevator_2_engaged = rtb_AND_e;
    A380PrimComputer_Y.out.logic.elevator_3_avail = rtb_y_fa;
    A380PrimComputer_Y.out.logic.elevator_3_engaged = rtb_y_av;
    A380PrimComputer_Y.out.logic.ths_avail = thsAvail;
    A380PrimComputer_Y.out.logic.ths_engaged = rtb_thsEngaged;
    A380PrimComputer_Y.out.logic.left_aileron_1_avail = rtb_doubleIrFault_tmp;
    A380PrimComputer_Y.out.logic.left_aileron_1_engaged = rtb_doubleIrFault_tmp;
    A380PrimComputer_Y.out.logic.left_aileron_2_avail = leftAileron2Avail;
    A380PrimComputer_Y.out.logic.left_aileron_2_engaged = rtb_AND1_e;
    A380PrimComputer_Y.out.logic.right_aileron_1_avail = rtb_OR3;
    A380PrimComputer_Y.out.logic.right_aileron_1_engaged = rtb_OR3;
    A380PrimComputer_Y.out.logic.right_aileron_2_avail = rtb_OR1;
    A380PrimComputer_Y.out.logic.right_aileron_2_engaged = rtb_rightAileron2Engaged;
    A380PrimComputer_Y.out.logic.left_spoiler_hydraulic_mode_avail = leftSpoilerHydraulicModeAvail;
    A380PrimComputer_Y.out.logic.left_spoiler_electric_mode_avail = leftSpoilerElectricModeAvail;
    A380PrimComputer_Y.out.logic.left_spoiler_hydraulic_mode_engaged = rtb_leftSpoilerHydraulicModeEngaged;
    A380PrimComputer_Y.out.logic.left_spoiler_electric_mode_engaged = rtb_leftSpoilerElectricModeEngaged;
    A380PrimComputer_Y.out.logic.right_spoiler_hydraulic_mode_avail = rightSpoilerHydraulicModeAvail;
    A380PrimComputer_Y.out.logic.right_spoiler_electric_mode_avail = rightSpoilerElectricModeAvail;
    A380PrimComputer_Y.out.logic.right_spoiler_hydraulic_mode_engaged = rtb_rightSpoilerHydraulicModeEngaged;
    A380PrimComputer_Y.out.logic.right_spoiler_electric_mode_engaged = rtb_rightSpoilerElectricModeEngaged;
    A380PrimComputer_Y.out.logic.rudder_1_hydraulic_mode_avail = rudder1HydraulicModeAvail;
    A380PrimComputer_Y.out.logic.rudder_1_electric_mode_avail = rudder1ElectricModeAvail;
    A380PrimComputer_Y.out.logic.rudder_1_hydraulic_mode_engaged = rtb_rudder1HydraulicModeEngaged;
    A380PrimComputer_Y.out.logic.rudder_1_electric_mode_engaged = rtb_AND_n;
    A380PrimComputer_Y.out.logic.rudder_2_hydraulic_mode_avail = rtb_AND6_o;
    A380PrimComputer_Y.out.logic.rudder_2_electric_mode_avail = rudder1HydraulicModeHasPriority;
    A380PrimComputer_Y.out.logic.rudder_2_hydraulic_mode_engaged = rtb_rudder2HydraulicModeEngaged;
    A380PrimComputer_Y.out.logic.rudder_2_electric_mode_engaged = rudder2ElectricModeHasPriority;
    A380PrimComputer_Y.out.logic.aileron_droop_active = rtb_OR_b;
    A380PrimComputer_Y.out.logic.aileron_antidroop_active = rtb_aileronAntidroopActive;
    A380PrimComputer_Y.out.logic.ths_automatic_mode_active = rtb_AND1_ci;
    A380PrimComputer_Y.out.logic.ths_manual_mode_c_deg_s = abs_rate_c;
    A380PrimComputer_Y.out.logic.is_yellow_hydraulic_power_avail =
      rtb_BusAssignment_j_logic_is_yellow_hydraulic_power_avail;
    A380PrimComputer_Y.out.logic.is_green_hydraulic_power_avail =
      rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
    A380PrimComputer_Y.out.logic.eha_ebha_elec_mode_inhibited = rtb_OR7;
    A380PrimComputer_Y.out.logic.left_sidestick_disabled = A380PrimComputer_DWork.pLeftStickDisabled;
    A380PrimComputer_Y.out.logic.right_sidestick_disabled = A380PrimComputer_DWork.pRightStickDisabled;
    A380PrimComputer_Y.out.logic.left_sidestick_priority_locked = rtb_AND7_d;
    A380PrimComputer_Y.out.logic.right_sidestick_priority_locked = rtb_AND10_b;
    A380PrimComputer_Y.out.logic.total_sidestick_pitch_command = u0;
    A380PrimComputer_Y.out.logic.total_sidestick_roll_command = u0_0;
    A380PrimComputer_Y.out.logic.speed_brake_inhibited = rtb_y_nl;
    A380PrimComputer_Y.out.logic.ground_spoilers_out = A380PrimComputer_DWork.Delay1_DSTATE_b;
    A380PrimComputer_Y.out.logic.phased_lift_dumping_active = rtb_AND19;
    A380PrimComputer_Y.out.logic.spoiler_lift_active = rtb_BusAssignment_p_logic_spoiler_lift_active;
    A380PrimComputer_Y.out.logic.ap_authorised = rtb_AND18_c;
    A380PrimComputer_Y.out.logic.protection_ap_disconnect = leftInboardElevEngaged;
    A380PrimComputer_Y.out.logic.high_alpha_prot_active = A380PrimComputer_DWork.sProtActive_l;
    A380PrimComputer_Y.out.logic.alpha_prot_deg = rtb_handleIndex;
    A380PrimComputer_Y.out.logic.alpha_max_deg = rtb_BusAssignment_nw_logic_alpha_max_deg;
    A380PrimComputer_Y.out.logic.high_speed_prot_active = A380PrimComputer_DWork.sProtActive;
    A380PrimComputer_Y.out.logic.high_speed_prot_lo_thresh_kn = rtb_BusAssignment_nw_logic_high_speed_prot_lo_thresh_kn;
    A380PrimComputer_Y.out.logic.high_speed_prot_hi_thresh_kn = rtb_BusAssignment_nw_logic_high_speed_prot_hi_thresh_kn;
    A380PrimComputer_Y.out.logic.double_adr_failure = rtb_doubleAdrFault;
    A380PrimComputer_Y.out.logic.triple_adr_failure = rtb_tripleAdrFault;
    A380PrimComputer_Y.out.logic.cas_or_mach_disagree = A380PrimComputer_P.Constant1_Value_b;
    A380PrimComputer_Y.out.logic.alpha_disagree = A380PrimComputer_P.Constant1_Value_b;
    A380PrimComputer_Y.out.logic.double_ir_failure = rtb_doubleIrFault;
    A380PrimComputer_Y.out.logic.triple_ir_failure = rtb_tripleIrFault;
    A380PrimComputer_Y.out.logic.ir_failure_not_self_detected = A380PrimComputer_P.Constant_Value_ad;
    A380PrimComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    A380PrimComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    A380PrimComputer_Y.out.logic.adr_computation_data.mach = rtb_mach;
    A380PrimComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_Y;
    A380PrimComputer_Y.out.logic.ir_computation_data.theta_deg = rtb_alpha;
    A380PrimComputer_Y.out.logic.ir_computation_data.phi_deg = rtb_phi;
    A380PrimComputer_Y.out.logic.ir_computation_data.q_deg_s = rtb_q;
    A380PrimComputer_Y.out.logic.ir_computation_data.r_deg_s = rtb_r;
    A380PrimComputer_Y.out.logic.ir_computation_data.n_x_g = rtb_n_x;
    A380PrimComputer_Y.out.logic.ir_computation_data.n_y_g = rtb_n_y;
    A380PrimComputer_Y.out.logic.ir_computation_data.n_z_g = rtb_n_z;
    A380PrimComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    A380PrimComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    A380PrimComputer_Y.out.logic.ra_computation_data_ft = rtb_raComputationValue;
    A380PrimComputer_Y.out.logic.dual_ra_failure = (rtb_OR4 && rtb_ra2Invalid);
    A380PrimComputer_Y.out.logic.all_sfcc_lost = A380PrimComputer_P.Constant_Value_cc;
    A380PrimComputer_Y.out.logic.flap_handle_index = rtb_Switch_g_idx_0;
    A380PrimComputer_Y.out.logic.flap_angle_deg = rtb_Switch_g_idx_1;
    A380PrimComputer_Y.out.logic.slat_angle_deg = rtb_Switch_g_idx_2;
    A380PrimComputer_Y.out.logic.slat_flap_actual_pos = rtb_Switch_g_idx_3;
    A380PrimComputer_Y.out.discrete_outputs.elevator_1_active_mode = elevator1Avail;
    A380PrimComputer_Y.out.discrete_outputs.elevator_2_active_mode = rtb_AND_e;
    A380PrimComputer_Y.out.discrete_outputs.elevator_3_active_mode = rtb_y_av;
    A380PrimComputer_Y.out.discrete_outputs.ths_active_mode = rtb_thsEngaged;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_1_active_mode = rtb_doubleIrFault_tmp;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_2_active_mode = rtb_AND1_e;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_1_active_mode = rtb_OR3;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_2_active_mode = rtb_rightAileron2Engaged;
    A380PrimComputer_Y.out.discrete_outputs.left_spoiler_electronic_module_enable = rtb_leftSpoilerElectricModeEngaged;
    A380PrimComputer_Y.out.discrete_outputs.right_spoiler_electronic_module_enable = rtb_rightSpoilerElectricModeEngaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode = rtb_rudder1HydraulicModeEngaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_electric_active_mode = rtb_AND_n;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode = rtb_rudder2HydraulicModeEngaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_electric_active_mode = rudder2ElectricModeHasPriority;
    A380PrimComputer_Y.out.discrete_outputs.prim_healthy = A380PrimComputer_P.Constant1_Value_f;
    A380PrimComputer_Y.out.discrete_outputs.fcu_own_select = A380PrimComputer_P.Constant_Value_ba;
    A380PrimComputer_Y.out.discrete_outputs.fcu_opp_select = A380PrimComputer_P.Constant_Value_ba;
    A380PrimComputer_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputer_P.Constant_Value_ba;
    if (elevator1Avail) {
      A380PrimComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = rtb_elevator1Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = A380PrimComputer_P.Constant_Value_b;
    }

    if (rtb_AND_e) {
      A380PrimComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = rtb_elevator2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = A380PrimComputer_P.Constant1_Value_n;
    }

    if (rtb_y_av) {
      A380PrimComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = rtb_elevator3Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = A380PrimComputer_P.Constant2_Value_k;
    }

    if (rtb_thsEngaged) {
      A380PrimComputer_Y.out.analog_outputs.ths_pos_order_deg = rtb_eta_trim_limit_up_m;
    } else {
      A380PrimComputer_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputer_P.Constant3_Value_g;
    }

    if (rtb_doubleIrFault_tmp) {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = rtb_eta_deg_dv;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = A380PrimComputer_P.Constant4_Value_i;
    }

    if (rtb_AND1_e) {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = rtb_eta_trim_limit_lo_d;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = A380PrimComputer_P.Constant5_Value_n;
    }

    if (rtb_OR3) {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = rtb_eta_trim_dot_deg_s_n;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = A380PrimComputer_P.Constant6_Value_f;
    }

    if (rtb_rightAileron2Engaged) {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = rtb_rightAileron2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = A380PrimComputer_P.Constant7_Value;
    }

    if (rtb_leftSpoilerElectricModeEngaged || rtb_leftSpoilerHydraulicModeEngaged) {
      A380PrimComputer_Y.out.analog_outputs.left_spoiler_pos_order_deg = rtb_leftSpoilerCommand;
      A380PrimComputer_Y.out.analog_outputs.right_spoiler_pos_order_deg = rtb_rightSpoilerCommand;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_spoiler_pos_order_deg = A380PrimComputer_P.Constant8_Value;
      A380PrimComputer_Y.out.analog_outputs.right_spoiler_pos_order_deg = A380PrimComputer_P.Constant9_Value_n;
    }

    if (rtb_AND_n || rtb_rudder1HydraulicModeEngaged) {
      A380PrimComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = rtb_handleIndex_b;
    } else {
      A380PrimComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = A380PrimComputer_P.Constant10_Value;
    }

    if (rudder2ElectricModeHasPriority || rtb_rudder2HydraulicModeEngaged) {
      A380PrimComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = rtb_rudder2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = A380PrimComputer_P.Constant11_Value;
    }

    A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.SSM = static_cast<uint32_T>(nz);
    if (rtb_AND20) {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.Data = static_cast<real32_T>
        (rtb_left_inboard_aileron_deg);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.Data = A380PrimComputer_P.Constant20_Value;
    }

    A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.SSM = static_cast<uint32_T>(b_nz);
    A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.SSM = static_cast<uint32_T>(prim3LawCap);
    A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.SSM = static_cast<uint32_T>(iindx);
    A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_outboard_aileron_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_outboard_aileron_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_1_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_1_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_2_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_2_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_3_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_3_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_4_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_4_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_5_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_5_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_6_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_6_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_7_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_7_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_spoiler_8_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_spoiler_8_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_inboard_elevator_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_inboard_elevator_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
      (rtb_left_outboard_elevator_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
      (rtb_right_outboard_elevator_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.ths_command_deg.SSM = static_cast<uint32_T>(rtb_ths_command_deg_SSM);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = A380PrimComputer_P.Gain_Gain_k *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = A380PrimComputer_P.Gain1_Gain_g *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = A380PrimComputer_P.Gain2_Gain *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = A380PrimComputer_P.Gain3_Gain_e *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = A380PrimComputer_P.Gain4_Gain_l * static_cast<
      real32_T>(A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos);
    A380PrimComputer_Y.out.bus_outputs.aileron_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.left_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.spoiler_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.elevator_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.elevator_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.elevator_3_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_3_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.ths_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.rudder_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.rudder_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.fctl_law_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.fe_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.fg_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_DWork.Delay_DSTATE_cc = rtb_AND7_d;
    A380PrimComputer_DWork.Delay1_DSTATE = rtb_AND10_b;
    A380PrimComputer_DWork.Memory_PreviousInput_j = A380PrimComputer_DWork.Delay_DSTATE_e;
    A380PrimComputer_DWork.Delay_DSTATE = rtb_Gain_f;
    A380PrimComputer_DWork.icLoad = false;
  } else {
    A380PrimComputer_DWork.Runtime_MODE = false;
  }
}

void A380PrimComputer::initialize()
{
  A380PrimComputer_DWork.Delay_DSTATE_cc = A380PrimComputer_P.Delay_InitialCondition;
  A380PrimComputer_DWork.Delay1_DSTATE = A380PrimComputer_P.Delay1_InitialCondition;
  A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.SRFlipFlop_initial_condition;
  A380PrimComputer_DWork.Memory_PreviousInput_a = A380PrimComputer_P.SRFlipFlop1_initial_condition;
  A380PrimComputer_DWork.Delay1_DSTATE_b = A380PrimComputer_P.Delay1_InitialCondition_n;
  A380PrimComputer_DWork.Delay2_DSTATE = A380PrimComputer_P.Delay2_InitialCondition;
  A380PrimComputer_DWork.Delay3_DSTATE = A380PrimComputer_P.Delay3_InitialCondition;
  A380PrimComputer_DWork.Delay_DSTATE_e = A380PrimComputer_P.Delay_InitialCondition_o;
  A380PrimComputer_DWork.Memory_PreviousInput_d = A380PrimComputer_P.SRFlipFlop1_initial_condition_i;
  A380PrimComputer_DWork.Memory_PreviousInput_j = A380PrimComputer_P.SRFlipFlop_initial_condition_i;
  A380PrimComputer_DWork.Delay_DSTATE = A380PrimComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380PrimComputer_DWork.icLoad = true;
  LawMDLOBJ2.init();
  LawMDLOBJ5.init();
  LawMDLOBJ3.init();
  A380PrimComputer_Y.out = A380PrimComputer_P.out_Y0;
}

void A380PrimComputer::terminate()
{
}

A380PrimComputer::A380PrimComputer():
  A380PrimComputer_U(),
  A380PrimComputer_Y(),
  A380PrimComputer_DWork()
{
}

A380PrimComputer::~A380PrimComputer() = default;
