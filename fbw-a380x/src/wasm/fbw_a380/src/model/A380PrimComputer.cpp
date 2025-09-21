#include "A380PrimComputer.h"
#include "rtwtypes.h"
#include "A380PrimComputer_types.h"
#include <cmath>
#include "combineVectorElements_N0KSVqzt.h"
#include "multiword_types.h"
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"
#include "Double2MultiWord.h"
#include "MultiWordAnd.h"
#include "uMultiWordNe.h"
#include "Single2MultiWord.h"
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
  } else if (tmp_0 && rtu_bit2 && tmp_1) {
    *rty_law = a380_pitch_efcs_law::AlternateLaw1A;
  } else if ((!rtu_bit1) && rtu_bit2 && rtu_bit3) {
    *rty_law = a380_pitch_efcs_law::AlternateLaw1B;
  } else if (rtu_bit1 && tmp_2 && tmp_1) {
    *rty_law = a380_pitch_efcs_law::AlternateLaw1C;
  } else if (rtu_bit1 && rtu_bit2 && tmp_1) {
    *rty_law = a380_pitch_efcs_law::DirectLaw;
  } else {
    *rty_law = a380_pitch_efcs_law::None;
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

boolean_T A380PrimComputer::A380PrimComputer_a429_bitValueOr(uint32_T word_SSM, real32_T word_Data)
{
  uint64m_T tmp;
  uint64m_T tmp_0;
  static const uint64m_T tmp_1{ { 4U, 0U }
  };

  static const uint64m_T tmp_2{ { 0U, 0U }
  };

  Single2MultiWord(word_Data, &tmp_0.chunks[0U], 2);
  MultiWordAnd(&tmp_0.chunks[0U], &tmp_1.chunks[0U], &tmp.chunks[0U], 2);
  return ((word_SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) || (word_SSM == static_cast<uint32_T>
           (SignStatusMatrix::FunctionalTest))) && uMultiWordNe(&tmp.chunks[0U], &tmp_2.chunks[0U], 2);
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
  real_T rtb_eta_deg_od;
  real_T rtb_eta_trim_dot_deg_s_l;
  real_T rtb_eta_trim_limit_lo_b;
  real_T rtb_eta_trim_limit_up_a;
  base_arinc_429 rtb_discrete_status_word_1;
  base_arinc_429 rtb_fctl_law_status_word;
  base_arinc_429 rtb_fe_status_word_c;
  base_arinc_429 rtb_fg_status_word_o;
  uint64m_T tmp_0;
  uint64m_T tmp_1;
  uint64m_T tmp_2;
  uint64m_T tmp_3;
  uint64m_T tmp_4;
  uint64m_T tmp_5;
  uint64m_T tmp_6;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
  real_T rtb_Gain_bk;
  real_T rtb_Gain_g;
  real_T rtb_Gain_p;
  real_T rtb_Sum6;
  real_T rtb_Switch2_a;
  real_T rtb_Switch3_h;
  real_T rtb_Switch6_i;
  real_T rtb_Switch7_e;
  real_T rtb_Switch8_o;
  real_T rtb_Switch9_f;
  real_T rtb_Y;
  real_T rtb_Y_f;
  real_T rtb_Y_i;
  real_T rtb_elevator1Command;
  real_T rtb_elevator2Command;
  real_T rtb_elevator3Command;
  real_T rtb_handleIndex;
  real_T rtb_handleIndex_d;
  real_T rtb_handleIndex_f;
  real_T rtb_leftAileron2Command;
  real_T rtb_leftSpoilerCommand;
  real_T rtb_left_midboard_aileron_deg;
  real_T rtb_left_spoiler_2_deg;
  real_T rtb_left_spoiler_3_deg;
  real_T rtb_outerAilLowerLim;
  real_T rtb_rightAileron1Command;
  real_T rtb_rightAileron2Command;
  real_T rtb_rightSpoilerCommand;
  real_T rtb_right_inboard_aileron_deg;
  real_T rtb_right_spoiler_1_deg;
  real_T rtb_right_spoiler_2_deg;
  real_T rtb_right_spoiler_3_deg;
  real_T rtb_rudder1Command;
  real_T rtb_rudder2Command;
  real_T rtb_thsPos;
  real_T rtb_xi_spoiler_deg_b;
  int32_T b_nz;
  int32_T d_nz;
  int32_T nz;
  int32_T prim3LawCap;
  real32_T v[3];
  real32_T rtb_Switch_g_idx_0;
  real32_T rtb_Switch_g_idx_1;
  real32_T rtb_Switch_g_idx_2;
  real32_T rtb_Switch_g_idx_3;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_left_inboard_elevator_command_deg_Data;
  real32_T rtb_left_outboard_elevator_command_deg_Data;
  real32_T rtb_left_spoiler_3_command_deg_Data;
  real32_T rtb_left_spoiler_4_command_deg_Data;
  real32_T rtb_left_spoiler_5_command_deg_Data;
  real32_T rtb_left_spoiler_6_command_deg_Data;
  real32_T rtb_left_spoiler_7_command_deg_Data;
  real32_T rtb_left_spoiler_8_command_deg_Data;
  real32_T rtb_mach;
  real32_T rtb_n_x;
  real32_T rtb_n_y;
  real32_T rtb_n_z;
  real32_T rtb_phi;
  real32_T rtb_phi_dot;
  real32_T rtb_q;
  real32_T rtb_r;
  real32_T rtb_raComputationValue;
  real32_T rtb_right_inboard_elevator_command_deg_Data;
  real32_T rtb_right_outboard_elevator_command_deg_Data;
  real32_T rtb_right_spoiler_4_command_deg_Data;
  real32_T rtb_right_spoiler_5_command_deg_Data;
  real32_T rtb_right_spoiler_6_command_deg_Data;
  real32_T rtb_right_spoiler_7_command_deg_Data;
  real32_T rtb_right_spoiler_8_command_deg_Data;
  real32_T rtb_theta_dot;
  uint32_T rtb_DataTypeConversion1_j;
  uint32_T rtb_Switch29;
  uint32_T rtb_Switch31;
  uint32_T rtb_left_inboard_elevator_command_deg_SSM;
  uint32_T rtb_left_outboard_aileron_command_deg_SSM;
  uint32_T rtb_left_outboard_elevator_command_deg_SSM;
  uint32_T rtb_left_spoiler_1_command_deg_SSM;
  uint32_T rtb_left_spoiler_2_command_deg_SSM;
  uint32_T rtb_left_spoiler_3_command_deg_SSM;
  uint32_T rtb_left_spoiler_4_command_deg_SSM;
  uint32_T rtb_left_spoiler_5_command_deg_SSM;
  uint32_T rtb_left_spoiler_6_command_deg_SSM;
  uint32_T rtb_left_spoiler_7_command_deg_SSM;
  uint32_T rtb_left_spoiler_8_command_deg_SSM;
  uint32_T rtb_right_inboard_elevator_command_deg_SSM;
  uint32_T rtb_right_midboard_aileron_command_deg_SSM;
  uint32_T rtb_right_outboard_aileron_command_deg_SSM;
  uint32_T rtb_right_outboard_elevator_command_deg_SSM;
  uint32_T rtb_right_spoiler_1_command_deg_SSM;
  uint32_T rtb_right_spoiler_2_command_deg_SSM;
  uint32_T rtb_right_spoiler_3_command_deg_SSM;
  uint32_T rtb_right_spoiler_4_command_deg_SSM;
  uint32_T rtb_right_spoiler_5_command_deg_SSM;
  uint32_T rtb_right_spoiler_6_command_deg_SSM;
  uint32_T rtb_right_spoiler_7_command_deg_SSM;
  uint32_T rtb_right_spoiler_8_command_deg_SSM;
  uint32_T rtb_y_e;
  uint32_T rtb_y_k1;
  uint32_T rtb_y_m;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_ep[19];
  boolean_T b_x[6];
  boolean_T tmp[3];
  boolean_T b;
  boolean_T elevator1Avail;
  boolean_T elevator2Avail;
  boolean_T gndSplrAvail;
  boolean_T land3FailPassiveConditions_tmp;
  boolean_T leftSpoilerElectricModeAvail;
  boolean_T leftSpoilerHydraulicModeAvail;
  boolean_T normalLawAvail;
  boolean_T oneLgersAvail;
  boolean_T rightAileron2Avail;
  boolean_T rightSpoilerElectricModeAvail;
  boolean_T rightSpoilerHydraulicModeAvail;
  boolean_T rtb_AND10;
  boolean_T rtb_AND10_b;
  boolean_T rtb_AND11;
  boolean_T rtb_AND13;
  boolean_T rtb_AND15;
  boolean_T rtb_AND16_n;
  boolean_T rtb_AND17;
  boolean_T rtb_AND18_c;
  boolean_T rtb_AND19;
  boolean_T rtb_AND1_at;
  boolean_T rtb_AND1_e;
  boolean_T rtb_AND20;
  boolean_T rtb_AND2_b;
  boolean_T rtb_AND2_jo;
  boolean_T rtb_AND3;
  boolean_T rtb_AND3_d;
  boolean_T rtb_AND4_d;
  boolean_T rtb_AND4_f;
  boolean_T rtb_AND6_o;
  boolean_T rtb_AND6_pt;
  boolean_T rtb_AND7;
  boolean_T rtb_AND8;
  boolean_T rtb_AND9;
  boolean_T rtb_AND_e;
  boolean_T rtb_AND_n;
  boolean_T rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
  boolean_T rtb_BusAssignment_hi_logic_is_yellow_hydraulic_power_avail;
  boolean_T rtb_DataTypeConversion_dj;
  boolean_T rtb_DataTypeConversion_gf;
  boolean_T rtb_DataTypeConversion_m2;
  boolean_T rtb_Equal;
  boolean_T rtb_NOT_k;
  boolean_T rtb_OR;
  boolean_T rtb_OR1;
  boolean_T rtb_OR3;
  boolean_T rtb_OR4;
  boolean_T rtb_OR6;
  boolean_T rtb_OR7;
  boolean_T rtb_OR_a;
  boolean_T rtb_OR_ll;
  boolean_T rtb_OR_lu;
  boolean_T rtb_OR_n;
  boolean_T rtb_OR_ou;
  boolean_T rtb_doubleIrFault_tmp;
  boolean_T rtb_leftSpoilerElectricModeEngaged;
  boolean_T rtb_leftSpoilerHydraulicModeEngaged;
  boolean_T rtb_ra3Invalid;
  boolean_T rtb_rightAileron2Engaged;
  boolean_T rtb_rightSpoilerElectricModeEngaged;
  boolean_T rtb_rightSpoilerHydraulicModeEngaged;
  boolean_T rtb_rudder2HydraulicModeEngaged;
  boolean_T rtb_thsEngaged;
  boolean_T rtb_tripleIrFault;
  boolean_T rtb_y_ag;
  boolean_T rtb_y_dm;
  boolean_T rtb_y_hz;
  boolean_T rtb_y_i;
  boolean_T rtb_y_kkg;
  boolean_T rtb_y_nt;
  boolean_T rudder1ElectricModeAvail;
  boolean_T rudder1HydraulicModeAvail;
  boolean_T rudder1HydraulicModeHasPriority;
  boolean_T rudder2HydraulicModeHasPriority;
  boolean_T thsAvail;
  a380_lateral_efcs_law rtb_activeLateralLaw;
  a380_lateral_efcs_law rtb_lateralLawCapability;
  a380_pitch_efcs_law rtb_law;
  a380_pitch_efcs_law rtb_law_j;
  a380_pitch_efcs_law rtb_pitchLawCapability;
  static const uint64m_T tmp_7{ { MAX_uint32_T, MAX_uint32_T }
  };

  static const uint64m_T tmp_8{ { 0U, 0U }
  };

  static const uint64m_T tmp_9{ { 134217728U, 0U }
  };

  static const uint64m_T tmp_a{ { 16U, 0U }
  };

  static const uint64m_T tmp_b{ { 2U, 0U }
  };

  const base_arinc_429 *rtb_Switch_ir_0;
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
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_lf);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jl);
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_mm);
      A380PrimComputer_DWork.ra1CoherenceRejected = false;
      A380PrimComputer_DWork.ra2CoherenceRejected = false;
      A380PrimComputer_DWork.ra3CoherenceRejected = false;
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
      A380PrimComputer_DWork.eventTime_not_empty_m = false;
      A380PrimComputer_RateLimiter_o_Reset(&A380PrimComputer_DWork.sf_RateLimiter_mr);
      A380PrimComputer_DWork.sProtActive = false;
      A380PrimComputer_DWork.resetEventTime_not_empty = false;
      A380PrimComputer_DWork.sProtActive_g = false;
      A380PrimComputer_DWork.is_active_c28_A380PrimComputer = 0U;
      A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_NO_ACTIVE_CHILD;
      A380PrimComputer_DWork.eventTime_not_empty = false;
      A380PrimComputer_MATLABFunction_ge_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_al4);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_m1);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ny);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_gc);
      A380PrimComputer_MATLABFunction_c_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ff);
      A380PrimComputer_DWork.pApproachModeArmedAbove400Ft = false;
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
      A380PrimComputer_P.BitfromLabel2_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit, &rtb_y_k1);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit, &rtb_DataTypeConversion1_j);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit, &rtb_Switch31);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel6_bit, &rtb_Switch29);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel7_bit, &rtb_y_e);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      &rtb_NOT_k);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word, &rtb_y_i);
    rtb_y_hz = ((!rtb_NOT_k) && (!rtb_y_i));
    if (!rtb_y_hz) {
      if (rtb_y_m != 0U) {
        rtb_Switch_g_idx_0 = 0.0F;
      } else if ((rtb_y_k1 != 0U) && (rtb_y_e != 0U)) {
        rtb_Switch_g_idx_0 = 1.0F;
      } else if ((rtb_y_k1 != 0U) && (rtb_y_e == 0U)) {
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

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit, &rtb_y_m);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel8_bit, &rtb_y_e);
    rtb_OR_ou = rtb_y_hz;
    rtb_OR_a = (rtb_y_m != 0U);
    rtb_OR_ll = (rtb_y_e != 0U);
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
    rtb_ra3Invalid = (rtb_OR1 && rtb_OR3);
    rtb_Equal = (rtb_ra3Invalid || (rtb_OR1 && rtb_OR4) || (rtb_OR3 && rtb_OR4));
    rtb_OR_n = (rtb_ra3Invalid && rtb_OR4);
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
    rtb_OR_lu = (rtb_tripleIrFault || rtb_doubleIrFault_tmp || (rtb_OR6 && rtb_OR7));
    rtb_tripleIrFault = (rtb_tripleIrFault && rtb_OR7);
    rtb_y_hz = !rtb_OR4;
    rightAileron2Avail = !rtb_OR3;
    rtb_AND1_e = (rtb_OR1 && rightAileron2Avail);
    if (rtb_AND1_e && rtb_y_hz) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data +
                  A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if ((!rtb_OR1) && rtb_OR3 && rtb_y_hz) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                  A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if (((!rtb_OR1) && rightAileron2Avail && rtb_y_hz) || ((!rtb_OR1) && (!rtb_OR3) && rtb_OR4)) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                  A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if ((!rtb_OR1) && rtb_OR3 && rtb_OR4) {
      rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    } else if (rtb_AND1_e && rtb_OR4) {
      rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      rtb_mach = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    } else if (rtb_ra3Invalid && rtb_y_hz) {
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

    A380PrimComputer_LagFilter(static_cast<real_T>(rtb_alpha), A380PrimComputer_P.LagFilter_C1,
      A380PrimComputer_U.in.time.dt, &rtb_Y, &A380PrimComputer_DWork.sf_LagFilter_a);
    rtb_y_hz = !rtb_OR6;
    rightAileron2Avail = !rtb_OR7;
    rtb_AND1_e = (rtb_OR && rightAileron2Avail);
    if (rtb_AND1_e && rtb_y_hz) {
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
    } else if ((!rtb_OR) && rtb_OR7 && rtb_y_hz) {
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
    } else if (((!rtb_OR) && rightAileron2Avail && rtb_y_hz) || ((!rtb_OR) && (!rtb_OR7) && rtb_OR6)) {
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
    } else if ((!rtb_OR) && rtb_OR7 && rtb_OR6) {
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_AND1_e && rtb_OR6) {
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      rtb_q = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_doubleIrFault_tmp && rtb_y_hz) {
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

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_j, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_y_i);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch31 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.SSM;
      rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.Data;
      rtb_Switch29 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.SSM;
      rtb_left_spoiler_3_command_deg_Data = A380PrimComputer_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.Data;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch31 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.SSM;
      rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.Data;
      rtb_Switch29 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.radio_height_1_ft.SSM;
      rtb_left_spoiler_3_command_deg_Data = A380PrimComputer_U.in.bus_inputs.prim_y_bus.radio_height_1_ft.Data;
    } else {
      rtb_Switch31 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.radio_height_2_ft.SSM;
      rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.prim_x_bus.radio_height_2_ft.Data;
      rtb_Switch29 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.SSM;
      rtb_left_spoiler_3_command_deg_Data = A380PrimComputer_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.Data;
    }

    if (rtb_Switch31 != static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) {
      rtb_Switch29 = rtb_Switch31;
      rtb_left_spoiler_3_command_deg_Data = rtb_raComputationValue;
    }

    rtb_OR1 = (rtb_OR_n || (rtb_Equal && A380PrimComputer_P.Constant1_Value_b));
    A380PrimComputer_MATLABFunction_c(((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR1), A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode2_isRisingEdge, A380PrimComputer_P.ConfirmNode2_timeDelay, &rtb_NOT_k,
      &A380PrimComputer_DWork.sf_MATLABFunction_lf);
    A380PrimComputer_MATLABFunction_c(((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR1), A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode1_isRisingEdge, A380PrimComputer_P.ConfirmNode1_timeDelay, &rtb_y_kkg,
      &A380PrimComputer_DWork.sf_MATLABFunction_jl);
    A380PrimComputer_MATLABFunction_c(((rtb_left_spoiler_3_command_deg_Data > 50.0F) && (rtb_Switch29 ==
      static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR1),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode3_isRisingEdge,
      A380PrimComputer_P.ConfirmNode3_timeDelay, &rtb_y_i, &A380PrimComputer_DWork.sf_MATLABFunction_mm);
    A380PrimComputer_DWork.ra1CoherenceRejected = (rtb_NOT_k || A380PrimComputer_DWork.ra1CoherenceRejected);
    A380PrimComputer_DWork.ra2CoherenceRejected = (rtb_y_kkg || A380PrimComputer_DWork.ra2CoherenceRejected);
    A380PrimComputer_DWork.ra3CoherenceRejected = (rtb_y_i || A380PrimComputer_DWork.ra3CoherenceRejected);
    rtb_OR3 = ((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || A380PrimComputer_DWork.ra1CoherenceRejected);
    rtb_OR4 = ((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || A380PrimComputer_DWork.ra2CoherenceRejected);
    rtb_ra3Invalid = ((rtb_Switch29 == static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                      A380PrimComputer_DWork.ra3CoherenceRejected);
    rtb_raComputationValue = 250.0F;
    rtb_OR1 = false;
    switch ((!rtb_OR3 + !rtb_OR4) + !rtb_ra3Invalid) {
     case 3:
      v[0] = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
      v[1] = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
      v[2] = rtb_left_spoiler_3_command_deg_Data;
      if (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data <
          A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) {
        if (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data < rtb_left_spoiler_3_command_deg_Data) {
          nz = 1;
        } else if (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data < rtb_left_spoiler_3_command_deg_Data)
        {
          nz = 2;
        } else {
          nz = 0;
        }
      } else if (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data < rtb_left_spoiler_3_command_deg_Data) {
        nz = 0;
      } else if (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data < rtb_left_spoiler_3_command_deg_Data) {
        nz = 2;
      } else {
        nz = 1;
      }

      rtb_raComputationValue = v[nz];
      break;

     case 2:
      if (rtb_OR3) {
        rtb_raComputationValue = (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data +
          rtb_left_spoiler_3_command_deg_Data) / 2.0F;
      } else if (rtb_OR4) {
        rtb_raComputationValue = (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
          rtb_left_spoiler_3_command_deg_Data) / 2.0F;
      } else if (rtb_ra3Invalid) {
        rtb_raComputationValue = (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
          A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) / 2.0F;
      }
      break;

     case 1:
      rtb_OR1 = true;
      if ((rtb_V_ias <= 180.0F) || ((!rtb_OR_n) && ((!rtb_Equal) || (!A380PrimComputer_P.Constant1_Value_b)))) {
        if (!rtb_OR3) {
          rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
        } else if (!rtb_OR4) {
          rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
        } else if (!rtb_ra3Invalid) {
          rtb_raComputationValue = rtb_left_spoiler_3_command_deg_Data;
        }
      }
      break;

     default:
      rtb_OR1 = true;
      break;
    }

    rtb_OR3 = (rtb_OR3 && rtb_OR4 && rtb_ra3Invalid);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel6_bit_o, &rtb_Switch31);
    rtb_y_nt = (rtb_Switch31 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel1_bit_jr, &rtb_Switch31);
    rtb_OR4 = (rtb_y_nt || (rtb_Switch31 != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, &rtb_NOT_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel3_bit_g, &rtb_Switch31);
    rtb_y_nt = (rtb_Switch31 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      A380PrimComputer_P.BitfromLabel2_bit_m, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, &rtb_y_i);
    rtb_y_nt = ((rtb_OR4 && rtb_NOT_k) || ((rtb_y_nt || (rtb_Switch31 != 0U)) && rtb_y_i));
    rtb_OR4 = ((!rtb_NOT_k) && (!rtb_y_i));
    A380PrimComputer_B.BusAssignment_nw.logic.tracking_mode_on = (A380PrimComputer_U.in.sim_data.slew_on ||
      A380PrimComputer_U.in.sim_data.pause_on || A380PrimComputer_U.in.sim_data.tracking_mode_on_override);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      A380PrimComputer_P.BitfromLabel8_bit_i, &rtb_Switch31);
    rtb_DataTypeConversion_m2 = (rtb_Switch31 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      A380PrimComputer_P.BitfromLabel9_bit, &rtb_Switch31);
    rtb_y_kkg = (rtb_Switch31 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      A380PrimComputer_P.BitfromLabel10_bit, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_y_i);
    rtb_ra3Invalid = ((rtb_DataTypeConversion_m2 || rtb_y_kkg || (rtb_Switch31 != 0U)) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      A380PrimComputer_P.BitfromLabel4_bit_h, &rtb_Switch31);
    rtb_NOT_k = (rtb_Switch31 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      A380PrimComputer_P.BitfromLabel5_bit_l, &rtb_Switch31);
    rtb_y_kkg = (rtb_Switch31 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      A380PrimComputer_P.BitfromLabel7_bit_l, &rtb_Switch31);
    rtb_OR = (rtb_NOT_k || rtb_y_kkg || (rtb_Switch31 != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_NOT_k);
    rtb_ra3Invalid = (rtb_ra3Invalid && (rtb_OR && rtb_NOT_k));
    A380PrimComputer_MATLABFunction_n(A380PrimComputer_U.in.analog_inputs.yellow_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode2_highTrigger, A380PrimComputer_P.HysteresisNode2_lowTrigger, &rtb_y_i,
      &A380PrimComputer_DWork.sf_MATLABFunction_nj);
    A380PrimComputer_MATLABFunction_c(((!A380PrimComputer_U.in.discrete_inputs.yellow_low_pressure) && rtb_y_i),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge,
      A380PrimComputer_P.ConfirmNode_timeDelay, &rtb_DataTypeConversion_m2, &A380PrimComputer_DWork.sf_MATLABFunction_cx);
    A380PrimComputer_MATLABFunction_n(A380PrimComputer_U.in.analog_inputs.green_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode3_highTrigger, A380PrimComputer_P.HysteresisNode3_lowTrigger, &rtb_y_i,
      &A380PrimComputer_DWork.sf_MATLABFunction_e1);
    A380PrimComputer_MATLABFunction_c(((!A380PrimComputer_U.in.discrete_inputs.green_low_pressure) && rtb_y_i),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode2_isRisingEdge_i,
      A380PrimComputer_P.ConfirmNode2_timeDelay_h, &rtb_y_i, &A380PrimComputer_DWork.sf_MATLABFunction_kq);
    rtb_y_kkg = false;
    rtb_DataTypeConversion_dj = !rtb_y_i;
    rtb_DataTypeConversion_gf = !rtb_DataTypeConversion_m2;
    rtb_OR = (rtb_y_nt && ((rtb_y_i || rtb_DataTypeConversion_m2 ||
                (!A380PrimComputer_U.in.discrete_inputs.rat_contactor_closed) ||
                (!A380PrimComputer_U.in.discrete_inputs.rat_deployed)) && ((rtb_DataTypeConversion_dj ||
      (!A380PrimComputer_P.Constant_Value_aq)) && (rtb_DataTypeConversion_gf || (!A380PrimComputer_P.Constant_Value_aq)))));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_OR6 = rtb_y_i;
      rtb_OR7 = rtb_y_i;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_OR6 = rtb_y_i;
      rtb_OR7 = rtb_y_i;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_OR6 = rtb_DataTypeConversion_m2;
      rtb_OR7 = rtb_DataTypeConversion_m2;
    } else {
      rtb_OR6 = false;
      rtb_OR7 = false;
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel2_bit_k, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_y_dm);
    rtb_AND1_e = ((rtb_Switch31 != 0U) && rtb_y_dm);
    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel1_bit_b, &rtb_Switch31);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_doubleIrFault_tmp = true;
      rightAileron2Avail = true;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_doubleIrFault_tmp = true;
      rightAileron2Avail = true;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_doubleIrFault_tmp = rtb_DataTypeConversion_m2;
      rightAileron2Avail = rtb_DataTypeConversion_m2;
    } else {
      rtb_doubleIrFault_tmp = false;
      rightAileron2Avail = false;
    }

    rtb_rudder2HydraulicModeEngaged = !rtb_OR;
    rtb_rightAileron2Engaged = (A380PrimComputer_U.in.discrete_inputs.is_unit_3 || rtb_rudder2HydraulicModeEngaged);
    rtb_AND1_e = (rtb_doubleIrFault_tmp && ((!rtb_AND1_e) && rtb_rightAileron2Engaged));
    rtb_rightAileron2Engaged = (rightAileron2Avail && (((!rtb_y_dm) || (rtb_Switch31 == 0U)) && rtb_rightAileron2Engaged));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      leftSpoilerHydraulicModeAvail = rtb_y_i;
      leftSpoilerElectricModeAvail = true;
      rightSpoilerHydraulicModeAvail = rtb_y_i;
      rightSpoilerElectricModeAvail = true;
      rtb_leftSpoilerHydraulicModeEngaged = rtb_y_i;
      rtb_leftSpoilerElectricModeEngaged = (rtb_DataTypeConversion_dj && rtb_rudder2HydraulicModeEngaged);
      rtb_rightSpoilerHydraulicModeEngaged = rtb_y_i;
      rtb_rightSpoilerElectricModeEngaged = rtb_leftSpoilerElectricModeEngaged;
      elevator1Avail = rtb_y_i;
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        leftSpoilerHydraulicModeAvail = rtb_DataTypeConversion_m2;
        leftSpoilerElectricModeAvail = true;
        rightSpoilerHydraulicModeAvail = rtb_DataTypeConversion_m2;
        rightSpoilerElectricModeAvail = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        leftSpoilerHydraulicModeAvail = rtb_y_i;
        leftSpoilerElectricModeAvail = true;
        rightSpoilerHydraulicModeAvail = rtb_y_i;
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
        elevator1Avail = rtb_DataTypeConversion_m2;
      } else {
        elevator1Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_y_i);
      }
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word;
    }

    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_y_dm);
    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel1_bit_n, &rtb_Switch31);
    rtb_AND_e = (rtb_y_dm && (rtb_Switch31 != 0U));
    elevator2Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_1 ||
                      (A380PrimComputer_U.in.discrete_inputs.is_unit_2 ||
                       (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_DataTypeConversion_m2)));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_y_hz = ((!rtb_AND_e) && rtb_rudder2HydraulicModeEngaged);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_y_hz = ((!rtb_AND_e) && rtb_rudder2HydraulicModeEngaged);
    } else {
      rtb_y_hz = A380PrimComputer_U.in.discrete_inputs.is_unit_3;
    }

    rtb_AND_e = (elevator2Avail && rtb_y_hz);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_ag);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_l, &rtb_Switch29);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word, &rtb_y_dm);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_l, &rtb_Switch31);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_y_ag = (rtb_y_ag && (rtb_Switch29 != 0U));
    } else {
      rtb_y_ag = (rtb_y_dm && (rtb_Switch31 != 0U));
    }

    rtb_y_dm = (A380PrimComputer_U.in.discrete_inputs.is_unit_1 || A380PrimComputer_U.in.discrete_inputs.is_unit_2);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_y_hz = ((!rtb_y_ag) && rtb_rudder2HydraulicModeEngaged);
    } else {
      rtb_y_hz = (A380PrimComputer_U.in.discrete_inputs.is_unit_2 && ((!rtb_y_ag) && rtb_rudder2HydraulicModeEngaged));
    }

    rtb_y_ag = (rtb_y_dm && rtb_y_hz);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_bv, &rtb_y_e);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      thsAvail = rtb_DataTypeConversion_m2;
      rtb_y_hz = ((!rtb_y_kkg) || (rtb_y_e == 0U));
    } else {
      thsAvail = ((!A380PrimComputer_U.in.discrete_inputs.is_unit_2) && (A380PrimComputer_U.in.discrete_inputs.is_unit_3
        && rtb_y_i));
      rtb_y_hz = ((!A380PrimComputer_U.in.discrete_inputs.is_unit_2) && A380PrimComputer_U.in.discrete_inputs.is_unit_3);
    }

    rtb_thsEngaged = (thsAvail && rtb_y_hz);
    rtb_BusAssignment_hi_logic_is_yellow_hydraulic_power_avail = rtb_DataTypeConversion_m2;
    rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail = rtb_y_i;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_k, &rtb_Switch31);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_e, &rtb_Switch29);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      &rtb_DataTypeConversion_m2);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_y_hz = (rtb_Switch31 != 0U);
    } else {
      rtb_y_hz = (rtb_Switch29 != 0U);
    }

    rtb_AND_n = (rtb_y_hz && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_c, &rtb_Switch31);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_p, &rtb_Switch29);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel6_bit_k, &rtb_y_m);
    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_y_i);
    rtb_AND6_o = ((rtb_y_m != 0U) && rtb_y_i);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel9_bit_l, &rtb_y_m);
    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel10_bit_b, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(rtb_Switch_ir_0, &rtb_y_kkg);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_y_hz = (rtb_y_m != 0U);
    } else {
      rtb_y_hz = (rtb_y_k1 != 0U);
    }

    rtb_AND3 = (rtb_y_hz && rtb_y_kkg);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeAvail = rtb_BusAssignment_hi_logic_is_yellow_hydraulic_power_avail;
      rudder1ElectricModeAvail = true;
      rudder1HydraulicModeHasPriority = true;
      rtb_AND6_o = ((!rtb_AND_n) && rtb_DataTypeConversion_gf && (!rtb_AND6_o) && (!rtb_AND3) &&
                    rtb_rudder2HydraulicModeEngaged);
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        rudder1HydraulicModeAvail = rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeAvail = rtb_BusAssignment_hi_logic_is_yellow_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else {
        rudder1HydraulicModeAvail = false;
        rudder1ElectricModeAvail = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2 || A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeHasPriority = !rtb_AND_n;
        if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
          rtb_y_hz = (rtb_Switch31 != 0U);
        } else {
          rtb_y_hz = (rtb_Switch29 != 0U);
        }

        rtb_AND6_o = (rudder1HydraulicModeHasPriority && ((!rtb_DataTypeConversion_m2) || (!rtb_y_hz)) &&
                      (!rudder1HydraulicModeAvail) && (!rtb_AND6_o) && (!rtb_AND3) && rtb_rudder2HydraulicModeEngaged);
      } else {
        rudder1HydraulicModeHasPriority = false;
        rtb_AND6_o = false;
      }
    }

    rtb_AND_n = (rudder1HydraulicModeAvail && rudder1HydraulicModeHasPriority);
    rtb_AND6_o = (rudder1ElectricModeAvail && rtb_AND6_o);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_n, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      &rtb_DataTypeConversion_m2);
    rtb_AND2_jo = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_g, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word, &rtb_y_kkg);
    rtb_AND4_f = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_g, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word, &rtb_y_i);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeHasPriority = rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
      rtb_AND3 = true;
      rudder2HydraulicModeHasPriority = true;
      rtb_AND2_jo = ((!rtb_AND2_jo) && rtb_DataTypeConversion_dj && (!rtb_AND4_f) && ((rtb_y_k1 == 0U) || (!rtb_y_i)) &&
                     rtb_rudder2HydraulicModeEngaged);
    } else {
      rudder1HydraulicModeHasPriority = false;
      rtb_AND3 = false;
      rudder2HydraulicModeHasPriority = false;
      rtb_AND2_jo = false;
    }

    rtb_rudder2HydraulicModeEngaged = (rudder1HydraulicModeHasPriority && rudder2HydraulicModeHasPriority);
    rtb_AND2_jo = (rtb_AND3 && rtb_AND2_jo);
    rudder2HydraulicModeHasPriority = rtb_y_nt;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel_bit_i, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word, &rtb_y_nt);
    rtb_AND4_f = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_c, &rtb_y_k1);
    rtb_AND3_d = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_p, &rtb_y_k1);
    rtb_AND2_b = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_n, &rtb_y_k1);
    rtb_AND1_at = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_j, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      &rtb_DataTypeConversion_m2);
    rtb_AND4_d = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_i, &rtb_y_k1);
    rtb_AND6_pt = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_j, &rtb_y_k1);
    rtb_AND7 = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_n, &rtb_y_k1);
    rtb_AND8 = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_n, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word, &rtb_y_kkg);
    rtb_AND13 = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel9_bit_b, &rtb_y_k1);
    rtb_AND11 = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel10_bit_h, &rtb_y_k1);
    rtb_AND10 = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel11_bit, &rtb_y_k1);
    rtb_AND9 = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel14_bit, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.aileron_status_word, &rtb_y_i);
    rtb_AND15 = ((rtb_y_k1 != 0U) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel15_bit, &rtb_y_k1);
    rtb_y_i = ((rtb_y_k1 != 0U) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel16_bit, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.aileron_status_word, &rtb_y_nt);
    rtb_AND17 = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel17_bit, &rtb_y_k1);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_NOT_k = (rtb_OR6 || rtb_AND2_b);
      rtb_y_kkg = (rtb_OR7 || rtb_AND1_at);
      rtb_AND2_b = (rtb_AND1_e || rtb_AND4_d);
      rtb_DataTypeConversion_m2 = (rtb_rightAileron2Engaged || rtb_AND6_pt);
      rtb_AND4_f = (rtb_AND4_f || rtb_AND7);
      rtb_AND3_d = (rtb_AND3_d || rtb_AND8);
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_NOT_k = (rtb_AND1_e || rtb_AND4_f);
      rtb_y_kkg = (rtb_rightAileron2Engaged || rtb_AND3_d);
      rtb_AND2_b = (rtb_AND2_b || rtb_AND4_d);
      rtb_DataTypeConversion_m2 = (rtb_AND1_at || rtb_AND6_pt);
      rtb_AND4_f = (rtb_OR6 || rtb_AND7);
      rtb_AND3_d = (rtb_OR7 || rtb_AND8);
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
      }

      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_NOT_k = (rtb_AND4_f || rtb_AND7);
      rtb_y_kkg = (rtb_AND3_d || rtb_AND8);
      rtb_AND2_b = (rtb_OR6 || rtb_AND2_b);
      rtb_DataTypeConversion_m2 = (rtb_OR7 || rtb_AND1_at);
      rtb_AND4_f = (rtb_AND4_d || rtb_AND1_e);
      rtb_AND3_d = (rtb_AND6_pt || rtb_rightAileron2Engaged);
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }

      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
    } else {
      rtb_NOT_k = false;
      rtb_y_kkg = false;
      rtb_AND2_b = false;
      rtb_DataTypeConversion_m2 = false;
      rtb_AND4_f = false;
      rtb_AND3_d = false;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_inboard_aileron_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_inboard_aileron_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_midboard_aileron_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_midboard_aileron_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_outboard_aileron_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_outboard_aileron_deg = 0.0;
    }

    rtb_AND6_pt = (rtb_NOT_k || (rtb_AND13 || rtb_AND15));
    rtb_AND11 = (rtb_y_kkg || (rtb_AND11 || rtb_y_i));
    rtb_AND10 = (rtb_AND2_b || (rtb_AND10 || rtb_AND17));
    rtb_AND9 = (rtb_DataTypeConversion_m2 || (rtb_AND9 || ((rtb_y_k1 != 0U) && rtb_y_nt)));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word, &rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_g, &rtb_y_e);
    rtb_NOT_k = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_pc, &rtb_y_e);
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_1_engaged = (rtb_y_i && (rtb_NOT_k ||
      (rtb_y_e != 0U)));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word, &rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_i, &rtb_y_e);
    rtb_y_kkg = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_n, &rtb_y_e);
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_2_engaged = (rtb_y_i && (rtb_y_kkg ||
      (rtb_y_e != 0U)));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.spoiler_status_word, &rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_nd, &rtb_y_e);
    rtb_DataTypeConversion_m2 = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_d, &rtb_y_e);
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_3_engaged = (rtb_y_i &&
      (rtb_DataTypeConversion_m2 || (rtb_y_e != 0U)));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_l, &rtb_y_e);
    rtb_y_nt = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel9_bit_g, &rtb_y_e);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word, &rtb_y_hz);
    rtb_AND13 = ((rtb_y_nt || (rtb_y_e != 0U)) && rtb_y_hz);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel10_bit_j, &rtb_y_e);
    rtb_y_nt = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel11_bit_j, &rtb_y_e);
    rtb_AND17 = ((rtb_y_nt || (rtb_y_e != 0U)) && rtb_y_hz);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel14_bit_p, &rtb_y_e);
    rtb_y_nt = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel15_bit_i, &rtb_y_e);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word, &rtb_y_i);
    rtb_AND4_d = ((rtb_y_nt || (rtb_y_e != 0U)) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel12_bit, &rtb_y_e);
    rtb_y_nt = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel13_bit, &rtb_y_e);
    rtb_y_nt = ((rtb_y_nt || (rtb_y_e != 0U)) && rtb_y_i);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_4_engaged = (rtb_AND4_d || rtb_y_nt);
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_5_engaged = (rtb_AND13 || rtb_AND17);
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_6_engaged =
        (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
         rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_4_engaged = (rtb_AND4_d || rtb_y_nt);
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_5_engaged =
        (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
         rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_6_engaged = (rtb_AND13 || rtb_AND17);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_4_engaged =
        (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
         rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_5_engaged = (rtb_AND4_d || rtb_y_nt);
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_6_engaged = (rtb_AND13 || rtb_AND17);
    } else {
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_4_engaged = false;
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_5_engaged = false;
      A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_6_engaged = false;
    }

    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word, &rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_l, &rtb_y_e);
    rtb_y_nt = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_f, &rtb_y_e);
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_7_engaged = (rtb_y_i && (rtb_y_nt ||
      (rtb_y_e != 0U)));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word, &rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_p, &rtb_y_e);
    rtb_DataTypeConversion_m2 = (rtb_y_e != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_b, &rtb_y_e);
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_8_engaged = (rtb_y_i &&
      (rtb_DataTypeConversion_m2 || (rtb_y_e != 0U)));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else {
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_4_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_4_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_5_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_5_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_6_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_6_deg = 0.0;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel16_bit_b, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word, &rtb_y_nt);
    rtb_AND4_d = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel17_bit_i, &rtb_y_k1);
    rtb_NOT_k = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel18_bit, &rtb_y_k1);
    rtb_AND7 = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel19_bit, &rtb_y_k1);
    rtb_AND8 = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel20_bit, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_i);
    rtb_AND16_n = ((rtb_y_k1 != 0U) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel21_bit, &rtb_y_k1);
    rtb_AND18_c = ((rtb_y_k1 != 0U) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel22_bit, &rtb_y_k1);
    rtb_AND19 = ((rtb_y_k1 != 0U) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel23_bit, &rtb_y_k1);
    rtb_AND20 = ((rtb_y_k1 != 0U) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_lr, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      &rtb_DataTypeConversion_m2);
    rtb_AND15 = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_g, &rtb_y_k1);
    rtb_AND1_at = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_k, &rtb_y_k1);
    rtb_y_i = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_n, &rtb_y_k1);
    rtb_AND13 = ((rtb_y_k1 != 0U) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_e, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word, &rtb_y_nt);
    rtb_AND2_b = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_b, &rtb_y_k1);
    rtb_DataTypeConversion_m2 = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_p, &rtb_y_k1);
    rtb_y_nt = ((rtb_y_k1 != 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_d, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word, &rtb_y_kkg);
    rtb_y_hz = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel9_bit_e, &rtb_y_k1);
    rtb_AND10_b = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel11_bit_n, &rtb_y_k1);
    rtb_AND17 = ((rtb_y_k1 != 0U) && rtb_y_kkg);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_y_kkg = (rtb_AND_e || rtb_AND16_n);
      rtb_AND19 = (rtb_AND18_c || rtb_AND7);
      rtb_NOT_k = (elevator1Avail || rtb_NOT_k);
      rtb_AND16_n = (rtb_AND4_d || rtb_y_ag);
      rtb_AND4_d = (rtb_thsEngaged || rtb_AND20);
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg;
      rtb_thsPos = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_y_kkg = (rtb_AND16_n || rtb_NOT_k);
      rtb_AND19 = (rtb_y_ag || rtb_AND18_c);
      rtb_NOT_k = (rtb_AND_e || rtb_AND4_d);
      rtb_AND16_n = (elevator1Avail || rtb_AND7);
      rtb_AND4_d = (rtb_AND8 || rtb_AND20);
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
      }

      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
           NormalOperation)) {
        rtb_thsPos = A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.Data;
      } else {
        rtb_thsPos = A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_y_kkg = (elevator1Avail || rtb_NOT_k);
      rtb_AND19 = (rtb_AND_e || rtb_AND19);
      rtb_NOT_k = (rtb_AND4_d || rtb_AND18_c);
      rtb_AND16_n = (rtb_AND16_n || rtb_AND7);
      rtb_AND4_d = (rtb_thsEngaged || rtb_AND8);
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      rtb_thsPos = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    } else {
      rtb_y_kkg = false;
      rtb_AND19 = false;
      rtb_NOT_k = false;
      rtb_AND16_n = false;
      rtb_AND4_d = false;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg = 0.0;
      rtb_thsPos = 0.0;
    }

    rtb_AND7 = (rtb_y_kkg || (rtb_y_hz || rtb_AND1_at));
    rtb_AND8 = (rtb_AND19 || (rtb_AND10_b || rtb_y_nt));
    rtb_AND15 = (rtb_NOT_k || (rtb_AND15 || rtb_DataTypeConversion_m2));
    rtb_AND2_b = (rtb_AND16_n || (rtb_AND2_b || rtb_y_i));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel38_bit, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel39_bit, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      &rtb_DataTypeConversion_m2);
    rtb_AND1_at = ((rtb_NOT_k || (rtb_y_k1 != 0U)) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel32_bit, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel33_bit, &rtb_y_k1);
    rtb_AND16_n = ((rtb_NOT_k || (rtb_y_k1 != 0U)) && rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel36_bit, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel37_bit, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word, &rtb_y_i);
    rtb_AND18_c = ((rtb_NOT_k || (rtb_y_k1 != 0U)) && rtb_y_i);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_m, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_b, &rtb_y_k1);
    rtb_AND20 = (rtb_NOT_k || (rtb_y_k1 != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      &rtb_DataTypeConversion_m2);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_pt, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_h, &rtb_y_k1);
    rtb_y_i = (rtb_NOT_k || (rtb_y_k1 != 0U));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_d, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_p, &rtb_y_k1);
    rtb_AND10_b = (rtb_NOT_k || (rtb_y_k1 != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_2_bus.rudder_status_word, &rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_gt, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel8_bit_i5, &rtb_y_k1);
    rtb_y_kkg = (rtb_NOT_k || (rtb_y_k1 != 0U));
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word, &rtb_NOT_k);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND1_at = (rtb_AND_n || rtb_AND6_o || rtb_AND1_at);
      rtb_AND16_n = (rtb_rudder2HydraulicModeEngaged || rtb_AND2_jo || rtb_AND18_c);
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.upper_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.lower_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND1_at = (rtb_AND_n || rtb_AND6_o || rtb_AND1_at);
      rtb_AND16_n = (rtb_AND16_n || rtb_AND18_c);
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.upper_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.lower_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.lower_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND1_at = (rtb_AND1_at || rtb_AND18_c);
      rtb_AND16_n = (rtb_AND_n || rtb_AND6_o || rtb_AND16_n);
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.upper_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.upper_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }

      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.lower_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
    } else {
      rtb_AND1_at = false;
      rtb_AND16_n = false;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.upper_rudder_deg = 0.0;
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.lower_rudder_deg = 0.0;
    }

    rtb_AND1_at = (rtb_AND1_at || (rtb_AND20 && rtb_DataTypeConversion_m2) || (rtb_AND10_b && rtb_y_nt));
    rtb_AND16_n = (rtb_AND16_n || (rtb_y_i && rtb_DataTypeConversion_m2) || (rtb_y_kkg && rtb_NOT_k));
    A380PrimComputer_MATLABFunction_c(A380PrimComputer_U.in.sim_data.slew_on, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode_isRisingEdge_o, A380PrimComputer_P.ConfirmNode_timeDelay_d, &rtb_y_i,
      &A380PrimComputer_DWork.sf_MATLABFunction_nb);
    rtb_Sum6 = std::abs(static_cast<real_T>(rtb_phi));
    rtb_AND10_b = !rudder2HydraulicModeHasPriority;
    rtb_AND20 = ((!rtb_y_i) && rtb_AND10_b && (((!rtb_OR_n) && ((rtb_mach > 0.96) || (rtb_mach < 0.1) || (rtb_Y < -10.0)
      || (rtb_Y > 37.5) || (rtb_V_ias > 420.0F) || (rtb_V_ias < 70.0F))) || ((!rtb_tripleIrFault) && ((!rtb_OR_lu) ||
      (!A380PrimComputer_P.Constant_Value_ad)) && ((rtb_Sum6 > 120.0) || ((rtb_alpha > 50.0F) || (rtb_alpha < -30.0F))))));
    A380PrimComputer_DWork.abnormalConditionWasActive = (rtb_AND20 || (rtb_AND10_b &&
      A380PrimComputer_DWork.abnormalConditionWasActive));
    nz = ((rtb_AND7 + rtb_AND8) + rtb_AND15) + rtb_AND2_b;
    b_x[0] = rtb_AND6_pt;
    b_x[1] = rtb_AND11;
    b_x[2] = rtb_AND10;
    b_x[3] = rtb_AND9;
    b_x[4] = rtb_AND4_f;
    b_x[5] = rtb_AND3_d;
    b_nz = rtb_AND6_pt;
    for (prim3LawCap = 0; prim3LawCap < 5; prim3LawCap++) {
      b_nz += b_x[prim3LawCap + 1];
    }

    if (rtb_OR_n || rtb_AND20) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::DirectLaw;
      rtb_lateralLawCapability = a380_lateral_efcs_law::DirectLaw;
    } else if (rtb_OR4) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw2;
      rtb_lateralLawCapability = a380_lateral_efcs_law::DirectLaw;
    } else {
      if ((nz == 2) || rtb_Equal || rtb_OR_lu) {
        rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1B;
      } else if (A380PrimComputer_DWork.abnormalConditionWasActive || ((rtb_AND1_at && (!rtb_AND16_n)) || ((!rtb_AND1_at)
        && rtb_AND16_n)) || (nz == 3) || (b_nz == 4) || rtb_OR_a || rtb_OR_ll || rtb_OR_ou || (rtb_OR3 && rtb_ra3Invalid
                  && (!A380PrimComputer_U.in.temporary_ap_input.ap_engaged)) || (rtb_DataTypeConversion_gf &&
                  rtb_DataTypeConversion_dj) || (!thsAvail)) {
        rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1A;
      } else {
        rtb_pitchLawCapability = a380_pitch_efcs_law::NormalLaw;
      }

      rtb_lateralLawCapability = a380_lateral_efcs_law::NormalLaw;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel_bit_o, &rtb_y_k1);
    rtb_DataTypeConversion_dj = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_e, &rtb_y_k1);
    rtb_DataTypeConversion_gf = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_hr, &rtb_y_k1);
    rtb_y_nt = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_kq, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_i);
    A380PrimComputer_MATLABFunction_ek(rtb_DataTypeConversion_dj, rtb_DataTypeConversion_gf, rtb_y_nt, rtb_y_i,
      &rtb_law_j);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_le, &rtb_y_k1);
    rtb_DataTypeConversion_dj = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_bl, &rtb_y_k1);
    rtb_DataTypeConversion_gf = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_p, &rtb_y_k1);
    rtb_y_nt = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_h, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word, &rtb_y_i);
    A380PrimComputer_MATLABFunction_ek(rtb_DataTypeConversion_dj, rtb_DataTypeConversion_gf, rtb_y_nt, rtb_y_i, &rtb_law);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      nz = static_cast<int32_T>(rtb_pitchLawCapability);
      b_nz = static_cast<int32_T>(rtb_law_j);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      nz = static_cast<int32_T>(rtb_law_j);
      b_nz = static_cast<int32_T>(rtb_pitchLawCapability);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else {
      nz = static_cast<int32_T>(rtb_law_j);
      b_nz = static_cast<int32_T>(rtb_law);
      prim3LawCap = static_cast<int32_T>(rtb_pitchLawCapability);
    }

    d_nz = 1;
    if (nz > b_nz) {
      nz = b_nz;
      d_nz = 2;
    }

    if (nz > prim3LawCap) {
      d_nz = 3;
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND18_c = (d_nz == 1);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND18_c = (d_nz == 2);
    } else {
      rtb_AND18_c = (d_nz == 3);
    }

    if (!rtb_AND18_c) {
      rtb_law_j = a380_pitch_efcs_law::None;
      rtb_activeLateralLaw = a380_lateral_efcs_law::None;
    } else {
      rtb_law_j = rtb_pitchLawCapability;
      rtb_activeLateralLaw = rtb_lateralLawCapability;
    }

    A380PrimComputer_MATLABFunction_f(A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode_isRisingEdge, &rtb_NOT_k, &A380PrimComputer_DWork.sf_MATLABFunction_g4);
    A380PrimComputer_MATLABFunction_f(A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode1_isRisingEdge, &rtb_y_i, &A380PrimComputer_DWork.sf_MATLABFunction_nu);
    if (rtb_NOT_k) {
      A380PrimComputer_DWork.pRightStickDisabled = true;
      A380PrimComputer_DWork.pLeftStickDisabled = false;
    } else if (rtb_y_i) {
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
      A380PrimComputer_P.ConfirmNode1_timeDelay_a, &rtb_DataTypeConversion_dj,
      &A380PrimComputer_DWork.sf_MATLABFunction_j2);
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_DWork.pRightStickDisabled &&
      (A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || A380PrimComputer_DWork.Delay1_DSTATE)),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge_j,
      A380PrimComputer_P.ConfirmNode_timeDelay_a, &rtb_DataTypeConversion_gf,
      &A380PrimComputer_DWork.sf_MATLABFunction_g24);
    if (!A380PrimComputer_DWork.pRightStickDisabled) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant_Value_p;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      rtb_handleIndex = A380PrimComputer_P.Constant_Value_p;
    } else {
      rtb_handleIndex = A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    rtb_right_spoiler_2_deg = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg +
      rtb_handleIndex;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation_UpperSat_d) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation_UpperSat_d;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation_LowerSat_h) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation_LowerSat_h;
    }

    if (!A380PrimComputer_DWork.pRightStickDisabled) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant1_Value_p;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      rtb_handleIndex = A380PrimComputer_P.Constant1_Value_p;
    } else {
      rtb_handleIndex = A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    rtb_left_midboard_aileron_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg + rtb_handleIndex;
    if (rtb_left_midboard_aileron_deg > A380PrimComputer_P.Saturation1_UpperSat) {
      rtb_left_midboard_aileron_deg = A380PrimComputer_P.Saturation1_UpperSat;
    } else if (rtb_left_midboard_aileron_deg < A380PrimComputer_P.Saturation1_LowerSat) {
      rtb_left_midboard_aileron_deg = A380PrimComputer_P.Saturation1_LowerSat;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_h, &rtb_y_k1);
    rtb_y_nt = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_gs, &rtb_y_k1);
    rtb_y_i = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_nu, &rtb_y_k1);
    rtb_y_kkg = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_gj, &rtb_y_k1);
    rtb_DataTypeConversion_m2 = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_e, &rtb_y_k1);
    rtb_NOT_k = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_a, &rtb_y_k1);
    A380PrimComputer_MATLABFunction_o(rtb_y_nt, rtb_y_i, rtb_y_kkg, rtb_DataTypeConversion_m2, rtb_NOT_k, (rtb_y_k1 !=
      0U), &rtb_handleIndex);
    A380PrimComputer_RateLimiter_c(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_handleIndex,
      A380PrimComputer_P.alphamax_bp01Data, A380PrimComputer_P.alphamax_bp02Data, A380PrimComputer_P.alphamax_tableData,
      A380PrimComputer_P.alphamax_maxIndex, 4U), A380PrimComputer_P.RateLimiterGenericVariableTs_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo, A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value,
      &rtb_Gain_p, &A380PrimComputer_DWork.sf_RateLimiter_ne);
    if (!A380PrimComputer_DWork.eventTime_not_empty_m) {
      A380PrimComputer_DWork.eventTime_f = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.eventTime_not_empty_m = true;
    }

    if (rudder2HydraulicModeHasPriority || (A380PrimComputer_DWork.eventTime_f == 0.0)) {
      A380PrimComputer_DWork.eventTime_f = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_RateLimiter_c(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_handleIndex,
      A380PrimComputer_P.alphaprotection_bp01Data, A380PrimComputer_P.alphaprotection_bp02Data,
      A380PrimComputer_P.alphaprotection_tableData, A380PrimComputer_P.alphaprotection_maxIndex, 4U),
      A380PrimComputer_P.RateLimiterGenericVariableTs1_up, A380PrimComputer_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value_j, &rtb_Y_i,
      &A380PrimComputer_DWork.sf_RateLimiter_mr);
    if (A380PrimComputer_U.in.time.simulation_time - A380PrimComputer_DWork.eventTime_f <=
        A380PrimComputer_P.CompareToConstant_const) {
      rtb_outerAilLowerLim = rtb_Gain_p;
    } else {
      rtb_outerAilLowerLim = rtb_Y_i;
    }

    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach), A380PrimComputer_P.Constant6_Value_b,
      static_cast<real_T>(rtb_V_ias), &rtb_Y_i);
    rtb_handleIndex = std::fmin(A380PrimComputer_P.Constant5_Value_k, rtb_Y_i);
    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach), A380PrimComputer_P.Constant8_Value_h,
      static_cast<real_T>(rtb_V_ias), &rtb_Y_i);
    rtb_right_inboard_aileron_deg = rtb_alpha - std::cos(A380PrimComputer_P.Gain1_Gain * rtb_phi) * rtb_Y;
    rtb_y_nt = ((rtb_law_j == a380_pitch_efcs_law::NormalLaw) || (rtb_activeLateralLaw == a380_lateral_efcs_law::
      NormalLaw));
    if ((!A380PrimComputer_U.in.temporary_ap_input.ap_engaged) && (rtb_V_ias > std::fmin(look1_binlxpw
          (rtb_right_inboard_aileron_deg, A380PrimComputer_P.uDLookupTable1_bp01Data,
           A380PrimComputer_P.uDLookupTable1_tableData, 3U), static_cast<real_T>(rtb_V_ias) / rtb_mach * look1_binlxpw
          (rtb_right_inboard_aileron_deg, A380PrimComputer_P.uDLookupTable2_bp01Data,
           A380PrimComputer_P.uDLookupTable2_tableData, 3U)))) {
      A380PrimComputer_DWork.sProtActive = (rtb_y_nt || A380PrimComputer_DWork.sProtActive);
    }

    A380PrimComputer_DWork.sProtActive = ((rtb_V_ias >= rtb_handleIndex) &&
      (!A380PrimComputer_U.in.temporary_ap_input.ap_engaged) && rtb_y_nt && A380PrimComputer_DWork.sProtActive);
    if (!A380PrimComputer_DWork.resetEventTime_not_empty) {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.resetEventTime_not_empty = true;
    }

    if ((rtb_right_spoiler_2_deg >= -0.03125) || (rtb_Y >= rtb_Gain_p) || (A380PrimComputer_DWork.resetEventTime == 0.0))
    {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_DWork.sProtActive_g = ((rtb_AND10_b && rtb_y_nt &&
      (!A380PrimComputer_U.in.temporary_ap_input.ap_engaged) && (rtb_Y > rtb_outerAilLowerLim) &&
      (A380PrimComputer_U.in.time.monotonic_time > 10.0)) || A380PrimComputer_DWork.sProtActive_g);
    A380PrimComputer_DWork.sProtActive_g = ((A380PrimComputer_U.in.time.simulation_time -
      A380PrimComputer_DWork.resetEventTime <= 0.5) && (rtb_right_spoiler_2_deg >= -0.5) && ((rtb_raComputationValue >=
      200.0F) || (rtb_right_spoiler_2_deg >= 0.5) || (rtb_Y >= rtb_outerAilLowerLim - 2.0)) && rtb_AND10_b && rtb_y_nt &&
      A380PrimComputer_DWork.sProtActive_g);
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
        } else if (rudder2HydraulicModeHasPriority) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
          nz = 0;
        } else {
          nz = 0;
        }
        break;

       case A380PrimComputer_IN_Landed:
        if (rtb_AND10_b) {
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
        } else if (rudder2HydraulicModeHasPriority) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
          nz = 0;
        } else {
          nz = 1;
        }
        break;

       default:
        if (rudder2HydraulicModeHasPriority) {
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
            A380PrimComputer_P.uDLookupTable_tableData_n, 3U) + 0.01))) || ((rtb_law_j != a380_pitch_efcs_law::NormalLaw)
         && (rtb_activeLateralLaw != a380_lateral_efcs_law::NormalLaw)) || (A380PrimComputer_DWork.eventTime == 0.0)) {
      A380PrimComputer_DWork.eventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    rtb_NOT_k = ((rtb_AND10_b && (((nz != 0) && (rtb_Y > rtb_Gain_p)) || (rtb_Y > rtb_outerAilLowerLim + 0.25)) &&
                  rtb_y_nt) || (A380PrimComputer_U.in.time.simulation_time - A380PrimComputer_DWork.eventTime > 3.0) ||
                 A380PrimComputer_DWork.sProtActive || A380PrimComputer_DWork.sProtActive_g);
    A380PrimComputer_B.BusAssignment_nw.logic.ap_authorised = ((std::abs(rtb_right_spoiler_2_deg) <= 0.5) && (std::abs
      (rtb_left_midboard_aileron_deg) <= 0.5) && ((std::abs(A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos) <= 0.4)
      && ((rtb_alpha <= 25.0F) && (rtb_alpha >= -13.0F) && (rtb_Sum6 <= 45.0) && (!rtb_NOT_k))));
    A380PrimComputer_B.BusAssignment_nw.logic.protection_ap_disconnect = rtb_NOT_k;
    rtb_NOT_k = (A380PrimComputer_P.Constant_Value_h || A380PrimComputer_DWork.sProtActive_g ||
                 ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos >= A380PrimComputer_P.CompareToConstant3_const) ||
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos >= A380PrimComputer_P.CompareToConstant4_const) ||
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos >= A380PrimComputer_P.CompareToConstant1_const) ||
                  (A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos >= A380PrimComputer_P.CompareToConstant2_const)));
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos <
      A380PrimComputer_P.CompareToConstant_const_n), A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode_isRisingEdge_c, A380PrimComputer_P.ConfirmNode_timeDelay_g, &rtb_y_i,
      &A380PrimComputer_DWork.sf_MATLABFunction_al4);
    A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_NOT_k) <<
      1) + rtb_y_i) << 1) + A380PrimComputer_DWork.Memory_PreviousInput];
    A380PrimComputer_B.BusAssignment_nw.logic.speed_brake_inhibited = (rtb_NOT_k ||
      A380PrimComputer_DWork.Memory_PreviousInput);
    rtb_NOT_k = (A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos <
                 A380PrimComputer_P.CompareToConstant_const_m);
    rtb_DataTypeConversion_m2 = (A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos <=
      A380PrimComputer_P.CompareToConstant18_const);
    rtb_y_kkg = ((((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos >
                    A380PrimComputer_P.CompareToConstant26_const) || rtb_NOT_k) &&
                  ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos < A380PrimComputer_P.CompareToConstant11_const) &&
                   (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos < A380PrimComputer_P.CompareToConstant27_const) &&
                   (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos < A380PrimComputer_P.CompareToConstant5_const) &&
                   (A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos < A380PrimComputer_P.CompareToConstant6_const)))
                 || (((A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <
                       A380PrimComputer_P.CompareToConstant12_const) ||
                      (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos <
                       A380PrimComputer_P.CompareToConstant15_const)) && (static_cast<int32_T>(((static_cast<uint32_T>
      (A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <= A380PrimComputer_P.CompareToConstant29_const) +
      (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <= A380PrimComputer_P.CompareToConstant16_const)) +
      (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos <= A380PrimComputer_P.CompareToConstant17_const)) +
      rtb_DataTypeConversion_m2) >= A380PrimComputer_P.CompareToConstant19_const)));
    A380PrimComputer_MATLABFunction_f(false, A380PrimComputer_P.PulseNode5_isRisingEdge, &rtb_y_hz,
      &A380PrimComputer_DWork.sf_MATLABFunction_m1);
    A380PrimComputer_MATLABFunction_f(rudder2HydraulicModeHasPriority, A380PrimComputer_P.PulseNode7_isRisingEdge,
      &rtb_DataTypeConversion_m2, &A380PrimComputer_DWork.sf_MATLABFunction_ny);
    A380PrimComputer_MATLABFunction_f(rudder2HydraulicModeHasPriority, A380PrimComputer_P.PulseNode6_isRisingEdge,
      &rtb_y_nt, &A380PrimComputer_DWork.sf_MATLABFunction_gc);
    A380PrimComputer_DWork.Memory_PreviousInput_a = A380PrimComputer_P.Logic_table_h[(((static_cast<uint32_T>
      (rtb_DataTypeConversion_m2 || (((A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed <
      A380PrimComputer_P.CompareToConstant13_const) || (A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed <
      A380PrimComputer_P.CompareToConstant9_const)) && ((A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed <
      A380PrimComputer_P.CompareToConstant10_const) || (A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed <
      A380PrimComputer_P.CompareToConstant14_const)))) << 1) + rtb_y_nt) << 1) +
      A380PrimComputer_DWork.Memory_PreviousInput_a];
    rtb_y_nt = (A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed >=
                A380PrimComputer_P.CompareToConstant4_const_k);
    rtb_DataTypeConversion_m2 = (((A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed >=
      A380PrimComputer_P.CompareToConstant7_const) || (A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed >=
      A380PrimComputer_P.CompareToConstant8_const)) && ((A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed >=
      A380PrimComputer_P.CompareToConstant3_const_n) || rtb_y_nt) && A380PrimComputer_DWork.Memory_PreviousInput_a);
    A380PrimComputer_DWork.Delay1_DSTATE_b = (rtb_y_kkg && (rtb_y_hz || rtb_DataTypeConversion_m2 ||
      A380PrimComputer_DWork.Delay1_DSTATE_b));
    A380PrimComputer_MATLABFunction_f(false, A380PrimComputer_P.PulseNode4_isRisingEdge, &rtb_DataTypeConversion_m2,
      &A380PrimComputer_DWork.sf_MATLABFunction_ff);
    A380PrimComputer_DWork.Delay2_DSTATE = (rtb_y_kkg && (rtb_DataTypeConversion_m2 ||
      A380PrimComputer_DWork.Delay2_DSTATE));
    A380PrimComputer_DWork.Delay3_DSTATE = (rtb_NOT_k && ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <=
      A380PrimComputer_P.CompareToConstant1_const_a) && (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <=
      A380PrimComputer_P.CompareToConstant2_const_k)) && (rtb_y_hz || A380PrimComputer_DWork.Delay3_DSTATE));
    A380PrimComputer_B.BusAssignment_nw.logic.phased_lift_dumping_active = ((!A380PrimComputer_DWork.Delay1_DSTATE_b) &&
      (A380PrimComputer_DWork.Delay2_DSTATE || A380PrimComputer_DWork.Delay3_DSTATE));
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_l, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_nt);
    rtb_y_nt = ((rtb_y_k1 == 0U) && rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_cm, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_DataTypeConversion_m2);
    A380PrimComputer_B.BusAssignment_nw.logic.spoiler_lift_active = (rudder2HydraulicModeHasPriority && (rtb_y_nt ||
      ((rtb_y_k1 == 0U) && rtb_DataTypeConversion_m2)));
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = std::round
      (A380PrimComputer_U.in.temporary_ap_input.lateral_mode_armed);
    if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg < 1.8446744073709552E+19)
    {
      if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg >= 0.0) {
        Double2MultiWord(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
                         &tmp_0.chunks[0U], 2);
      } else {
        tmp_0 = tmp_8;
      }
    } else {
      tmp_0 = tmp_7;
    }

    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = std::round
      (A380PrimComputer_U.in.temporary_ap_input.vertical_mode_armed);
    if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg < 1.8446744073709552E+19)
    {
      if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg >= 0.0) {
        Double2MultiWord(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
                         &tmp_1.chunks[0U], 2);
      } else {
        tmp_1 = tmp_8;
      }
    } else {
      tmp_1 = tmp_7;
    }

    MultiWordAnd(&tmp_0.chunks[0U], &tmp_b.chunks[0U], &tmp_2.chunks[0U], 2);
    MultiWordAnd(&tmp_1.chunks[0U], &tmp_a.chunks[0U], &tmp_3.chunks[0U], 2);
    rtb_y_i = ((uMultiWordNe(&tmp_2.chunks[0U], &tmp_8.chunks[0U], 2) ||
                ((A380PrimComputer_U.in.temporary_ap_input.lateral_mode >= 30.0) &&
                 (A380PrimComputer_U.in.temporary_ap_input.lateral_mode <= 34.0))) && (uMultiWordNe(&tmp_3.chunks[0U],
      &tmp_8.chunks[0U], 2) || ((A380PrimComputer_U.in.temporary_ap_input.vertical_mode >= 30.0) &&
      (A380PrimComputer_U.in.temporary_ap_input.vertical_mode <= 34.0))));
    A380PrimComputer_DWork.pApproachModeArmedAbove400Ft = (((!A380PrimComputer_DWork.pApproachModeArmedAbove400Ft) &&
      rtb_y_i && (rtb_raComputationValue > 400.0F)) || A380PrimComputer_DWork.pApproachModeArmedAbove400Ft);
    rtb_y_nt = (A380PrimComputer_U.in.temporary_ap_input.ap_1_engaged && rtb_y_i);
    rtb_y_kkg = (A380PrimComputer_U.in.temporary_ap_input.ap_2_engaged && rtb_y_i);
    nz = (A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM != static_cast<uint32_T>
          (SignStatusMatrix::FailureWarning)) +
      (A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM != static_cast<uint32_T>
       (SignStatusMatrix::FailureWarning));
    Single2MultiWord(A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word.Data, &tmp_5.chunks[0U], 2);
    tmp_0 = tmp_9;
    MultiWordAnd(&tmp_5.chunks[0U], &tmp_9.chunks[0U], &tmp_4.chunks[0U], 2);
    Single2MultiWord(A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word.Data, &tmp_6.chunks[0U], 2);
    MultiWordAnd(&tmp_6.chunks[0U], &tmp_9.chunks[0U], &tmp_0.chunks[0U], 2);
    rtb_DataTypeConversion_m2 = ((((A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
      (A380PrimComputer_U.in.bus_inputs.sec_1_bus.rudder_status_word.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FunctionalTest))) && uMultiWordNe(&tmp_4.chunks[0U], &tmp_8.chunks[0U], 2)) ||
      (((A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.sec_3_bus.rudder_status_word.SSM == static_cast<uint32_T>
      (SignStatusMatrix::FunctionalTest))) && uMultiWordNe(&tmp_0.chunks[0U], &tmp_8.chunks[0U], 2)));
    normalLawAvail = (rtb_lateralLawCapability == a380_lateral_efcs_law::NormalLaw);
    b_nz = rtb_BusAssignment_hi_logic_is_yellow_hydraulic_power_avail +
      rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
    oneLgersAvail = ((A380PrimComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_1.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::FailureWarning)) +
                     (A380PrimComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_1.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::FailureWarning)) >= 1);
    rtb_y_i = (leftSpoilerHydraulicModeAvail || leftSpoilerElectricModeAvail);
    gndSplrAvail = rtb_y_i;
    tmp[0] = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
               FailureWarning));
    tmp[1] = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
               FailureWarning));
    tmp[2] = (A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
               FailureWarning));
    prim3LawCap = combineVectorElements_N0KSVqzt(tmp);
    tmp[0] = A380PrimComputer_a429_bitValueOr(A380PrimComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.SSM,
      A380PrimComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.Data);
    tmp[1] = A380PrimComputer_a429_bitValueOr(A380PrimComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.SSM,
      A380PrimComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.Data);
    tmp[2] = A380PrimComputer_a429_bitValueOr(A380PrimComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.SSM,
      A380PrimComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.Data);
    d_nz = combineVectorElements_N0KSVqzt(tmp);
    rtb_y_hz = ((nz >= 1) && rtb_DataTypeConversion_m2 && normalLawAvail && (b_nz >= 1) &&
                A380PrimComputer_U.in.discrete_inputs.fcu_healthy && oneLgersAvail && rtb_y_i && (prim3LawCap >= 2) &&
                (d_nz >= 2));
    rtb_y_i = (rtb_y_hz && (!rtb_OR3));
    land3FailPassiveConditions_tmp = !rtb_OR1;
    rtb_AND19 = (rtb_y_hz && land3FailPassiveConditions_tmp);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_y_hz = ((A380PrimComputer_U.in.bus_inputs.prim_x_bus.radio_height_1_ft.SSM != static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) ||
                  (A380PrimComputer_U.in.bus_inputs.prim_y_bus.radio_height_2_ft.SSM != static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)));
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_y_hz = (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM != static_cast<uint32_T>
                  (SignStatusMatrix::FailureWarning));
    } else {
      rtb_y_hz = (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM != static_cast<uint32_T>
                  (SignStatusMatrix::FailureWarning));
    }

    normalLawAvail = ((nz >= 2) && rtb_DataTypeConversion_m2 && normalLawAvail && (b_nz == 2) &&
                      A380PrimComputer_U.in.discrete_inputs.fcu_healthy && oneLgersAvail && gndSplrAvail && (prim3LawCap
      == 3) && (d_nz == 3) && rtb_y_hz && land3FailPassiveConditions_tmp);
    oneLgersAvail = (A380PrimComputer_DWork.pApproachModeArmedAbove400Ft && normalLawAvail && rtb_y_nt && rtb_y_kkg &&
                     A380PrimComputer_U.in.temporary_ap_input.athr_engaged);
    gndSplrAvail = (rtb_y_nt || rtb_y_kkg);
    land3FailPassiveConditions_tmp = !oneLgersAvail;
    b = (A380PrimComputer_DWork.pApproachModeArmedAbove400Ft && rtb_AND19 && gndSplrAvail &&
         A380PrimComputer_U.in.temporary_ap_input.athr_engaged && land3FailPassiveConditions_tmp);
    A380PrimComputer_B.BusAssignment_nw.logic.ground_spoilers_armed = rtb_NOT_k;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_e, &rtb_y_k1);
    rtb_y_nt = (rtb_y_k1 == 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_kkg);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_d, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_NOT_k);
    A380PrimComputer_B.BusAssignment_nw.logic.aileron_droop_active = ((rtb_y_nt && rtb_y_kkg) || ((rtb_y_k1 == 0U) &&
      rtb_NOT_k));
    A380PrimComputer_MATLABFunction_f(rudder2HydraulicModeHasPriority, A380PrimComputer_P.PulseNode1_isRisingEdge_n,
      &rtb_DataTypeConversion_m2, &A380PrimComputer_DWork.sf_MATLABFunction_ky);
    A380PrimComputer_MATLABFunction_f(rudder2HydraulicModeHasPriority, A380PrimComputer_P.PulseNode2_isRisingEdge,
      &rtb_y_kkg, &A380PrimComputer_DWork.sf_MATLABFunction_dmh);
    A380PrimComputer_DWork.Memory_PreviousInput_d = A380PrimComputer_P.Logic_table_j[(((static_cast<uint32_T>
      (rtb_DataTypeConversion_m2) << 1) + (rtb_y_kkg || A380PrimComputer_DWork.Delay_DSTATE_e)) << 1) +
      A380PrimComputer_DWork.Memory_PreviousInput_d];
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_pt, &rtb_y_e);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      &rtb_DataTypeConversion_m2);
    if ((rtb_y_e != 0U) && rtb_DataTypeConversion_m2) {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_x_bus.discrete_status_word_1;
    } else {
      rtb_Switch_ir_0 = &A380PrimComputer_U.in.bus_inputs.prim_y_bus.discrete_status_word_1;
    }

    A380PrimComputer_MATLABFunction_e(rtb_Switch_ir_0, A380PrimComputer_P.BitfromLabel3_bit_gv, &rtb_y_e);
    if (rtb_AND18_c) {
      rtb_y_kkg = (rtb_AND10_b && (rtb_law_j != A380PrimComputer_P.EnumeratedConstant_Value_l));
    } else {
      rtb_y_kkg = ((rtb_y_e != 0U) && (rtb_Switch_ir_0->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)));
    }

    A380PrimComputer_DWork.Delay_DSTATE_e = A380PrimComputer_P.Logic_table_n[(((rtb_y_kkg || (std::abs(rtb_thsPos) <=
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
      &rtb_y_hz);
    rtb_DataTypeConversion_m2 = (((!rtb_NOT_k) || (rtb_Switch29 == 0U)) && rtb_y_hz);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_nt);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel6_bit_l, &rtb_Switch29);
    rtb_NOT_k = (rtb_Switch29 != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel5_bit_as, &rtb_Switch29);
    if (rtb_DataTypeConversion_m2 || (rtb_y_nt && ((!rtb_NOT_k) || (rtb_Switch29 == 0U)))) {
      rtb_right_inboard_aileron_deg = 0.25;
    } else {
      rtb_right_inboard_aileron_deg = 0.15;
    }

    if (A380PrimComputer_DWork.Delay_DSTATE_e) {
      rtb_right_inboard_aileron_deg = A380PrimComputer_P.Gain_Gain * rtb_thsPos;
      if (rtb_right_inboard_aileron_deg > A380PrimComputer_P.Saturation_UpperSat) {
        A380PrimComputer_B.BusAssignment_nw.logic.ths_manual_mode_c_deg_s = A380PrimComputer_P.Saturation_UpperSat;
      } else if (rtb_right_inboard_aileron_deg < A380PrimComputer_P.Saturation_LowerSat) {
        A380PrimComputer_B.BusAssignment_nw.logic.ths_manual_mode_c_deg_s = A380PrimComputer_P.Saturation_LowerSat;
      } else {
        A380PrimComputer_B.BusAssignment_nw.logic.ths_manual_mode_c_deg_s = rtb_right_inboard_aileron_deg;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.pitch_trim_down_pressed) {
      A380PrimComputer_B.BusAssignment_nw.logic.ths_manual_mode_c_deg_s = rtb_right_inboard_aileron_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.pitch_trim_up_pressed) {
      A380PrimComputer_B.BusAssignment_nw.logic.ths_manual_mode_c_deg_s = -rtb_right_inboard_aileron_deg;
    } else {
      A380PrimComputer_B.BusAssignment_nw.logic.ths_manual_mode_c_deg_s = 0.0;
    }

    A380PrimComputer_B.BusAssignment_nw.data = A380PrimComputer_U.in;
    A380PrimComputer_B.BusAssignment_nw.laws = rtP_prim_laws_output_MATLABStruct;
    A380PrimComputer_B.BusAssignment_nw.logic.on_ground = rudder2HydraulicModeHasPriority;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_inboard_aileron_engaged = rtb_AND6_pt;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_inboard_aileron_engaged = rtb_AND11;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_midboard_aileron_engaged = rtb_AND10;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_midboard_aileron_engaged = rtb_AND9;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_outboard_aileron_engaged = rtb_AND4_f;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_outboard_aileron_engaged = rtb_AND3_d;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_inboard_elevator_engaged = rtb_AND7;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_inboard_elevator_engaged = rtb_AND8;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_outboard_elevator_engaged = rtb_AND15;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_outboard_elevator_engaged = rtb_AND2_b;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.ths_engaged = (rtb_AND4_d || (rtb_AND17 || rtb_AND13));
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.upper_rudder_engaged = rtb_AND1_at;
    A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.lower_rudder_engaged = rtb_AND16_n;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_1_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_1_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_2_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_2_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_3_deg =
      A380PrimComputer_U.in.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_3_deg =
      A380PrimComputer_U.in.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_7_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_7_deg =
      A380PrimComputer_U.in.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_8_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_8_deg =
      A380PrimComputer_U.in.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.ths_deg = rtb_thsPos;
    A380PrimComputer_B.BusAssignment_nw.logic.lateral_law_capability = rtb_lateralLawCapability;
    A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law = rtb_activeLateralLaw;
    A380PrimComputer_B.BusAssignment_nw.logic.pitch_law_capability = rtb_pitchLawCapability;
    A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law = rtb_law_j;
    A380PrimComputer_B.BusAssignment_nw.logic.abnormal_condition_law_active = rtb_AND20;
    A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim = rtb_AND18_c;
    A380PrimComputer_B.BusAssignment_nw.logic.elevator_1_avail = elevator1Avail;
    A380PrimComputer_B.BusAssignment_nw.logic.elevator_1_engaged = elevator1Avail;
    A380PrimComputer_B.BusAssignment_nw.logic.elevator_2_avail = elevator2Avail;
    A380PrimComputer_B.BusAssignment_nw.logic.elevator_2_engaged = rtb_AND_e;
    A380PrimComputer_B.BusAssignment_nw.logic.elevator_3_avail = rtb_y_dm;
    A380PrimComputer_B.BusAssignment_nw.logic.elevator_3_engaged = rtb_y_ag;
    A380PrimComputer_B.BusAssignment_nw.logic.ths_avail = thsAvail;
    A380PrimComputer_B.BusAssignment_nw.logic.ths_engaged = rtb_thsEngaged;
    A380PrimComputer_B.BusAssignment_nw.logic.left_aileron_1_avail = rtb_OR6;
    A380PrimComputer_B.BusAssignment_nw.logic.left_aileron_1_engaged = rtb_OR6;
    A380PrimComputer_B.BusAssignment_nw.logic.left_aileron_2_avail = rtb_doubleIrFault_tmp;
    A380PrimComputer_B.BusAssignment_nw.logic.left_aileron_2_engaged = rtb_AND1_e;
    A380PrimComputer_B.BusAssignment_nw.logic.right_aileron_1_avail = rtb_OR7;
    A380PrimComputer_B.BusAssignment_nw.logic.right_aileron_1_engaged = rtb_OR7;
    A380PrimComputer_B.BusAssignment_nw.logic.right_aileron_2_avail = rightAileron2Avail;
    A380PrimComputer_B.BusAssignment_nw.logic.right_aileron_2_engaged = rtb_rightAileron2Engaged;
    A380PrimComputer_B.BusAssignment_nw.logic.left_spoiler_hydraulic_mode_avail = leftSpoilerHydraulicModeAvail;
    A380PrimComputer_B.BusAssignment_nw.logic.left_spoiler_electric_mode_avail = leftSpoilerElectricModeAvail;
    A380PrimComputer_B.BusAssignment_nw.logic.left_spoiler_hydraulic_mode_engaged = rtb_leftSpoilerHydraulicModeEngaged;
    A380PrimComputer_B.BusAssignment_nw.logic.left_spoiler_electric_mode_engaged = rtb_leftSpoilerElectricModeEngaged;
    A380PrimComputer_B.BusAssignment_nw.logic.right_spoiler_hydraulic_mode_avail = rightSpoilerHydraulicModeAvail;
    A380PrimComputer_B.BusAssignment_nw.logic.right_spoiler_electric_mode_avail = rightSpoilerElectricModeAvail;
    A380PrimComputer_B.BusAssignment_nw.logic.right_spoiler_hydraulic_mode_engaged =
      rtb_rightSpoilerHydraulicModeEngaged;
    A380PrimComputer_B.BusAssignment_nw.logic.right_spoiler_electric_mode_engaged = rtb_rightSpoilerElectricModeEngaged;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_1_hydraulic_mode_avail = rudder1HydraulicModeAvail;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_1_electric_mode_avail = rudder1ElectricModeAvail;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_1_hydraulic_mode_engaged = rtb_AND_n;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_1_electric_mode_engaged = rtb_AND6_o;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_2_hydraulic_mode_avail = rudder1HydraulicModeHasPriority;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_2_electric_mode_avail = rtb_AND3;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_2_hydraulic_mode_engaged = rtb_rudder2HydraulicModeEngaged;
    A380PrimComputer_B.BusAssignment_nw.logic.rudder_2_electric_mode_engaged = rtb_AND2_jo;
    A380PrimComputer_B.BusAssignment_nw.logic.aileron_antidroop_active =
      ((!A380PrimComputer_U.in.temporary_ap_input.ap_engaged) && A380PrimComputer_DWork.Delay1_DSTATE_b);
    A380PrimComputer_B.BusAssignment_nw.logic.is_yellow_hydraulic_power_avail =
      rtb_BusAssignment_hi_logic_is_yellow_hydraulic_power_avail;
    A380PrimComputer_B.BusAssignment_nw.logic.is_green_hydraulic_power_avail =
      rtb_BusAssignment_hi_logic_is_green_hydraulic_power_avail;
    A380PrimComputer_B.BusAssignment_nw.logic.eha_ebha_elec_mode_inhibited = rtb_OR;
    A380PrimComputer_B.BusAssignment_nw.logic.left_sidestick_disabled = A380PrimComputer_DWork.pLeftStickDisabled;
    A380PrimComputer_B.BusAssignment_nw.logic.right_sidestick_disabled = A380PrimComputer_DWork.pRightStickDisabled;
    A380PrimComputer_B.BusAssignment_nw.logic.left_sidestick_priority_locked = rtb_DataTypeConversion_dj;
    A380PrimComputer_B.BusAssignment_nw.logic.right_sidestick_priority_locked = rtb_DataTypeConversion_gf;
    A380PrimComputer_B.BusAssignment_nw.logic.total_sidestick_pitch_command = rtb_right_spoiler_2_deg;
    A380PrimComputer_B.BusAssignment_nw.logic.total_sidestick_roll_command = rtb_left_midboard_aileron_deg;
    A380PrimComputer_B.BusAssignment_nw.logic.ground_spoilers_out = A380PrimComputer_DWork.Delay1_DSTATE_b;
    A380PrimComputer_B.BusAssignment_nw.logic.high_alpha_prot_active = A380PrimComputer_DWork.sProtActive_g;
    A380PrimComputer_B.BusAssignment_nw.logic.alpha_prot_deg = rtb_outerAilLowerLim;
    A380PrimComputer_B.BusAssignment_nw.logic.alpha_max_deg = rtb_Gain_p;
    A380PrimComputer_B.BusAssignment_nw.logic.high_speed_prot_active = A380PrimComputer_DWork.sProtActive;
    A380PrimComputer_B.BusAssignment_nw.logic.high_speed_prot_lo_thresh_kn = rtb_handleIndex;
    A380PrimComputer_B.BusAssignment_nw.logic.high_speed_prot_hi_thresh_kn = std::fmin
      (A380PrimComputer_P.Constant7_Value_g, rtb_Y_i);
    A380PrimComputer_B.BusAssignment_nw.logic.double_adr_failure = rtb_Equal;
    A380PrimComputer_B.BusAssignment_nw.logic.triple_adr_failure = rtb_OR_n;
    A380PrimComputer_B.BusAssignment_nw.logic.cas_or_mach_disagree = A380PrimComputer_P.Constant1_Value_b;
    A380PrimComputer_B.BusAssignment_nw.logic.alpha_disagree = A380PrimComputer_P.Constant1_Value_b;
    A380PrimComputer_B.BusAssignment_nw.logic.double_ir_failure = rtb_OR_lu;
    A380PrimComputer_B.BusAssignment_nw.logic.triple_ir_failure = rtb_tripleIrFault;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_failure_not_self_detected = A380PrimComputer_P.Constant_Value_ad;
    A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.mach = rtb_mach;
    A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.alpha_deg = rtb_Y;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_deg = rtb_alpha;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.phi_deg = rtb_phi;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.q_deg_s = rtb_q;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.r_deg_s = rtb_r;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.n_x_g = rtb_n_x;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.n_y_g = rtb_n_y;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.n_z_g = rtb_n_z;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    A380PrimComputer_B.BusAssignment_nw.logic.ra_computation_data_ft = rtb_raComputationValue;
    A380PrimComputer_B.BusAssignment_nw.logic.two_ra_failure = rtb_OR1;
    A380PrimComputer_B.BusAssignment_nw.logic.all_ra_failure = rtb_OR3;
    A380PrimComputer_B.BusAssignment_nw.logic.all_sfcc_lost = rtb_OR_ou;
    A380PrimComputer_B.BusAssignment_nw.logic.flap_handle_index = rtb_Switch_g_idx_0;
    A380PrimComputer_B.BusAssignment_nw.logic.flap_angle_deg = rtb_Switch_g_idx_1;
    A380PrimComputer_B.BusAssignment_nw.logic.slat_angle_deg = rtb_Switch_g_idx_2;
    A380PrimComputer_B.BusAssignment_nw.logic.slat_flap_actual_pos = rtb_Switch_g_idx_3;
    A380PrimComputer_B.BusAssignment_nw.logic.double_lgciu_failure = rtb_OR4;
    A380PrimComputer_B.BusAssignment_nw.logic.slats_locked = rtb_OR_a;
    A380PrimComputer_B.BusAssignment_nw.logic.flaps_locked = rtb_OR_ll;
    A380PrimComputer_B.BusAssignment_nw.logic.landing_gear_down = rtb_ra3Invalid;
    A380PrimComputer_B.BusAssignment_nw.fg_logic.land_2_capability = (rtb_y_i && gndSplrAvail && (!b) &&
      land3FailPassiveConditions_tmp);
    A380PrimComputer_B.BusAssignment_nw.fg_logic.land_3_fail_passive_capability = b;
    A380PrimComputer_B.BusAssignment_nw.fg_logic.land_3_fail_op_capability = oneLgersAvail;
    A380PrimComputer_B.BusAssignment_nw.fg_logic.land_2_inop = !rtb_y_i;
    A380PrimComputer_B.BusAssignment_nw.fg_logic.land_3_fail_passive_inop = !rtb_AND19;
    A380PrimComputer_B.BusAssignment_nw.fg_logic.land_3_fail_op_inop = !normalLawAvail;
    A380PrimComputer_B.BusAssignment_nw.discrete_outputs = rtP_prim_discrete_output_MATLABStruct;
    A380PrimComputer_B.BusAssignment_nw.analog_outputs = rtP_prim_analog_output_MATLABStruct;
    A380PrimComputer_B.BusAssignment_nw.bus_outputs = A380PrimComputer_P.Constant4_Value;
    A380PrimComputer_B.BusAssignment_nw.logic.ths_automatic_mode_active = rtb_y_kkg;
    rtb_OR_ou = (A380PrimComputer_B.BusAssignment_nw.logic.tracking_mode_on || (static_cast<real_T>
      (A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law) != A380PrimComputer_P.CompareToConstant_const_m4));
    LawMDLOBJ2.step(&A380PrimComputer_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.r_deg_s,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.phi_dot_deg_s,
                    &A380PrimComputer_P.Constant_Value_a,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputer_B.BusAssignment_nw.logic.total_sidestick_roll_command,
                    &A380PrimComputer_B.BusAssignment_nw.data.analog_inputs.rudder_pedal_pos,
                    &A380PrimComputer_B.BusAssignment_nw.logic.on_ground, &rtb_OR_ou,
                    &A380PrimComputer_B.BusAssignment_nw.logic.high_alpha_prot_active,
                    &A380PrimComputer_B.BusAssignment_nw.logic.high_speed_prot_active,
                    &A380PrimComputer_B.BusAssignment_nw.data.temporary_ap_input.roll_command,
                    &A380PrimComputer_B.BusAssignment_nw.data.temporary_ap_input.yaw_command,
                    &A380PrimComputer_B.BusAssignment_nw.data.temporary_ap_input.ap_engaged, &rtb_xi_inboard_deg,
                    &rtb_xi_midboard_deg, &rtb_xi_outboard_deg, &rtb_xi_spoiler_deg, &rtb_zeta_upper_deg,
                    &rtb_zeta_lower_deg);
    LawMDLOBJ1.step(&A380PrimComputer_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputer_B.BusAssignment_nw.logic.total_sidestick_roll_command, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), &rtb_xi_inboard_deg_n, &rtb_xi_midboard_deg_a, &rtb_xi_outboard_deg_l,
                    &rtb_xi_spoiler_deg_i, &rtb_zeta_upper_deg_p, &rtb_zeta_lower_deg_n);
    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law)) {
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

    if (A380PrimComputer_B.BusAssignment_nw.logic.aileron_droop_active) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant2_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant1_Value;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs2_up, A380PrimComputer_P.RateLimiterVariableTs2_lo,
      A380PrimComputer_B.BusAssignment_nw.data.time.dt, A380PrimComputer_P.RateLimiterVariableTs2_InitialCondition,
      &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter);
    if (A380PrimComputer_B.BusAssignment_nw.logic.aileron_antidroop_active) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant4_Value_a;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant3_Value;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs3_up, A380PrimComputer_P.RateLimiterVariableTs3_lo,
      A380PrimComputer_B.BusAssignment_nw.data.time.dt, A380PrimComputer_P.RateLimiterVariableTs3_InitialCondition,
      &rtb_Y_f, &A380PrimComputer_DWork.sf_RateLimiter_b);
    rtb_handleIndex = rtb_Y_i + rtb_Y_f;
    rtb_right_spoiler_2_deg = A380PrimComputer_P.Gain_Gain_m * rtb_right_inboard_aileron_deg + rtb_handleIndex;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation2_UpperSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation2_UpperSat;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation2_LowerSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation2_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs_up_b,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo_k, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_inboard_aileron_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_inboard_aileron_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_a);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl_law_status_word,
       A380PrimComputer_P.BitfromLabel_bit_la, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      &rtb_y_kkg);
    if ((rtb_y_k1 != 0U) && rtb_y_kkg) {
      rtb_Switch_g_idx_0 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
      rtb_Switch_g_idx_1 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
      rtb_Switch_g_idx_2 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
      rtb_Switch_g_idx_3 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
      rtb_V_ias = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
      rtb_V_tas = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
      rtb_mach = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
      rtb_alpha = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
      rtb_phi = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
      rtb_q = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
      rtb_r = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
      rtb_n_x = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
      rtb_n_y = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
      rtb_n_z = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
      rtb_theta_dot = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
      rtb_phi_dot = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
      rtb_left_spoiler_3_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
      rtb_raComputationValue =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
      rtb_left_spoiler_4_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
      rtb_right_spoiler_4_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
      rtb_left_spoiler_5_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
      rtb_right_spoiler_5_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
      rtb_left_spoiler_6_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
      rtb_right_spoiler_6_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
    } else {
      rtb_Switch_g_idx_0 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
      rtb_Switch_g_idx_1 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
      rtb_Switch_g_idx_2 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
      rtb_Switch_g_idx_3 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
      rtb_V_ias = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
      rtb_V_tas = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
      rtb_mach = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
      rtb_alpha = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
      rtb_phi = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
      rtb_q = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
      rtb_r = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
      rtb_n_x = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
      rtb_n_y = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
      rtb_n_z = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
      rtb_theta_dot = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
      rtb_phi_dot = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
      rtb_left_spoiler_3_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
      rtb_raComputationValue =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
      rtb_left_spoiler_4_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
      rtb_right_spoiler_4_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
      rtb_left_spoiler_5_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
      rtb_right_spoiler_5_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
      rtb_left_spoiler_6_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
      rtb_right_spoiler_6_command_deg_Data =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
    }

    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Y = rtb_Y_i;
    } else {
      rtb_Y = rtb_Switch_g_idx_0;
    }

    rtb_right_spoiler_2_deg = rtb_handleIndex + rtb_right_inboard_aileron_deg;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation1_UpperSat_a) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation1_UpperSat_a;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation1_LowerSat_p) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation1_LowerSat_p;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs1_up_k,
      A380PrimComputer_P.RateLimiterGenericVariableTs1_lo_i, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_inboard_aileron_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_inboard_aileron_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_n);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_right_inboard_aileron_deg = rtb_Y_i;
    } else {
      rtb_right_inboard_aileron_deg = rtb_Switch_g_idx_1;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law)) {
     case 0:
      rtb_thsPos = rtb_xi_midboard_deg;
      break;

     case 1:
      rtb_thsPos = rtb_xi_midboard_deg_a;
      break;

     default:
      rtb_thsPos = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    rtb_right_spoiler_2_deg = A380PrimComputer_P.Gain3_Gain * rtb_thsPos + rtb_handleIndex;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation3_UpperSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation3_UpperSat;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation3_LowerSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation3_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs2_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs2_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_midboard_aileron_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_midboard_aileron_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_f);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_left_midboard_aileron_deg = rtb_Y_i;
    } else {
      rtb_left_midboard_aileron_deg = rtb_Switch_g_idx_2;
    }

    rtb_right_spoiler_2_deg = rtb_handleIndex + rtb_thsPos;
    if (rtb_right_spoiler_2_deg > A380PrimComputer_P.Saturation4_UpperSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation4_UpperSat;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputer_P.Saturation4_LowerSat) {
      rtb_right_spoiler_2_deg = A380PrimComputer_P.Saturation4_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_right_spoiler_2_deg, A380PrimComputer_P.RateLimiterGenericVariableTs3_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs3_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_midboard_aileron_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_midboard_aileron_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_au);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_thsPos = rtb_Y_i;
    } else {
      rtb_thsPos = rtb_Switch_g_idx_3;
    }

    rtb_Gain_p = std::fmax(std::fmin(-(A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_ias_kn - 240.0) /
      20.0, 1.0), 0.0) * 20.0;
    rtb_outerAilLowerLim = std::fmax(std::fmin(-(A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_ias_kn
      - 300.0) / 20.0, 1.0), 0.0) * -30.0;
    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law)) {
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

    rtb_Sum6 = A380PrimComputer_P.Gain4_Gain * rtb_right_spoiler_2_deg + rtb_handleIndex;
    if (rtb_Sum6 > rtb_Gain_p) {
      rtb_Sum6 = rtb_Gain_p;
    } else if (rtb_Sum6 < rtb_outerAilLowerLim) {
      rtb_Sum6 = rtb_outerAilLowerLim;
    }

    A380PrimComputer_RateLimiter_a(rtb_Sum6, A380PrimComputer_P.RateLimiterGenericVariableTs4_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs4_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_outboard_aileron_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_outboard_aileron_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_mn);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Sum6 = rtb_Y_i;
    } else {
      rtb_Sum6 = rtb_V_ias;
    }

    rtb_handleIndex += rtb_right_spoiler_2_deg;
    if (rtb_handleIndex > rtb_Gain_p) {
      rtb_handleIndex = rtb_Gain_p;
    } else if (rtb_handleIndex < rtb_outerAilLowerLim) {
      rtb_handleIndex = rtb_outerAilLowerLim;
    }

    A380PrimComputer_RateLimiter_a(rtb_handleIndex, A380PrimComputer_P.RateLimiterGenericVariableTs5_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs5_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_outboard_aileron_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_outboard_aileron_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_lm);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_handleIndex = rtb_Y_i;
    } else {
      rtb_handleIndex = rtb_V_tas;
    }

    if (A380PrimComputer_B.BusAssignment_nw.logic.phased_lift_dumping_active) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant5_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant6_Value;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs4_up, A380PrimComputer_P.RateLimiterVariableTs4_lo,
      A380PrimComputer_B.BusAssignment_nw.data.time.dt, A380PrimComputer_P.RateLimiterVariableTs4_InitialCondition,
      &rtb_Y_f, &A380PrimComputer_DWork.sf_RateLimiter_c);
    if (A380PrimComputer_B.BusAssignment_nw.logic.ground_spoilers_out) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    }

    A380PrimComputer_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
      A380PrimComputer_P.RateLimiterVariableTs6_up, A380PrimComputer_P.RateLimiterVariableTs6_lo,
      A380PrimComputer_B.BusAssignment_nw.data.time.dt, A380PrimComputer_P.RateLimiterVariableTs6_InitialCondition,
      &rtb_Y_f, &A380PrimComputer_DWork.sf_RateLimiter_g);
    rtb_right_spoiler_2_deg = A380PrimComputer_P.Gain5_Gain * rtb_Y_f;
    rtb_NOT_k = (A380PrimComputer_B.BusAssignment_nw.logic.ground_spoilers_out ||
                 A380PrimComputer_B.BusAssignment_nw.logic.phased_lift_dumping_active);
    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.flap_handle_index)) {
     case 2:
      rtb_Gain_p = 0.26666666666666666;
      break;

     case 3:
      rtb_Gain_p = 0.2;
      break;

     case 4:
      rtb_Gain_p = 0.17777777777777778;
      break;

     case 5:
      rtb_Gain_p = 0.13333333333333333;
      break;

     default:
      rtb_Gain_p = 0.44444444444444442;
      break;
    }

    A380PrimComputer_RateLimiter_c(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs28_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs28_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_P.reset_Value_h, &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_h);
    if (A380PrimComputer_B.BusAssignment_nw.logic.speed_brake_inhibited) {
      rtb_Gain_p = A380PrimComputer_P.Constant8_Value_d;
    } else {
      rtb_Gain_p = look1_binlxpw(A380PrimComputer_B.BusAssignment_nw.data.analog_inputs.speed_brake_lever_pos,
        A380PrimComputer_P.uDLookupTable_bp01Data, A380PrimComputer_P.uDLookupTable_tableData, 4U);
    }

    A380PrimComputer_RateLimiter_m(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs24_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs24_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_P.RateLimiterGenericVariableTs24_InitialCondition, A380PrimComputer_P.reset_Value_f,
      &rtb_handleIndex_f, &A380PrimComputer_DWork.sf_RateLimiter_me);
    if (A380PrimComputer_B.BusAssignment_nw.logic.spoiler_lift_active) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant9_Value;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        A380PrimComputer_P.Constant8_Value_d;
    }

    A380PrimComputer_RateLimiter_m
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs25_up, A380PrimComputer_P.RateLimiterGenericVariableTs25_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_P.RateLimiterGenericVariableTs25_InitialCondition, A380PrimComputer_P.reset_Value_l, &rtb_Gain_g,
       &A380PrimComputer_DWork.sf_RateLimiter_md);
    rtb_left_spoiler_3_deg = std::fmin(rtb_Y_i * rtb_handleIndex_f, rtb_Gain_g);
    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_right_spoiler_2_deg;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_left_spoiler_3_deg;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs8_up, A380PrimComputer_P.RateLimiterGenericVariableTs8_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_1_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_1_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i,
       &A380PrimComputer_DWork.sf_RateLimiter_j4);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_outerAilLowerLim = rtb_Y_i;
    } else {
      rtb_outerAilLowerLim = rtb_mach;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_right_spoiler_2_deg;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_left_spoiler_3_deg;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs9_up, A380PrimComputer_P.RateLimiterGenericVariableTs9_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_1_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_1_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i,
       &A380PrimComputer_DWork.sf_RateLimiter_cd);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_right_spoiler_1_deg = rtb_Y_i;
    } else {
      rtb_right_spoiler_1_deg = rtb_alpha;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_right_spoiler_2_deg;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_left_spoiler_3_deg;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs10_up, A380PrimComputer_P.RateLimiterGenericVariableTs10_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_2_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_2_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_l);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_left_spoiler_2_deg = rtb_Y_i;
    } else {
      rtb_left_spoiler_2_deg = rtb_phi;
    }

    if (rtb_NOT_k) {
      rtb_left_spoiler_3_deg = rtb_right_spoiler_2_deg;
    }

    A380PrimComputer_RateLimiter_a(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterGenericVariableTs11_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs11_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_2_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_2_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_d);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_right_spoiler_2_deg = rtb_Y_i;
    } else {
      rtb_right_spoiler_2_deg = rtb_q;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law)) {
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

    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.flap_handle_index)) {
     case 2:
      rtb_Gain_p = 0.37777777777777777;
      break;

     case 3:
      rtb_Gain_p = 0.2;
      break;

     case 4:
      rtb_Gain_p = 0.066666666666666666;
      break;

     case 5:
      rtb_Gain_p = 0.0;
      break;

     default:
      rtb_Gain_p = 0.44444444444444442;
      break;
    }

    A380PrimComputer_RateLimiter_c(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs27_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs27_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_P.reset_Value_d, &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_mv);
    A380PrimComputer_Spoiler345Computation(rtb_xi_spoiler_deg_b, std::fmin(rtb_Y_i * rtb_handleIndex_f, rtb_Gain_g),
      &rtb_Y_i, &rtb_Gain_p);
    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_i;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs14_up, A380PrimComputer_P.RateLimiterGenericVariableTs14_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_3_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_3_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_handleIndex_d,
       &A380PrimComputer_DWork.sf_RateLimiter_gr);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_left_spoiler_3_deg = rtb_handleIndex_d;
    } else {
      rtb_left_spoiler_3_deg = rtb_r;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Gain_p;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs15_up, A380PrimComputer_P.RateLimiterGenericVariableTs15_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_3_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_3_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_handleIndex_d,
       &A380PrimComputer_DWork.sf_RateLimiter_nh);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_right_spoiler_3_deg = rtb_handleIndex_d;
    } else {
      rtb_right_spoiler_3_deg = rtb_n_x;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_i;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs12_up, A380PrimComputer_P.RateLimiterGenericVariableTs12_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_4_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_4_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_handleIndex_d,
       &A380PrimComputer_DWork.sf_RateLimiter_c5);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Switch9_f = rtb_handleIndex_d;
    } else {
      rtb_Switch9_f = rtb_n_y;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Gain_p;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs13_up, A380PrimComputer_P.RateLimiterGenericVariableTs13_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_4_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_4_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_handleIndex_d,
       &A380PrimComputer_DWork.sf_RateLimiter_m);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Switch8_o = rtb_handleIndex_d;
    } else {
      rtb_Switch8_o = rtb_n_z;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_i;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs18_up, A380PrimComputer_P.RateLimiterGenericVariableTs18_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_5_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_5_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i,
       &A380PrimComputer_DWork.sf_RateLimiter_n2);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Switch7_e = rtb_Y_i;
    } else {
      rtb_Switch7_e = rtb_theta_dot;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_f;
    }

    A380PrimComputer_RateLimiter_a(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs19_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs19_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_5_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_5_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_j);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Switch6_i = rtb_Y_i;
    } else {
      rtb_Switch6_i = rtb_phi_dot;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.flap_handle_index)) {
     case 2:
      rtb_Gain_p = 0.46666666666666667;
      break;

     case 3:
      rtb_Gain_p = 0.37777777777777777;
      break;

     case 4:
      rtb_Gain_p = 0.22222222222222221;
      break;

     case 5:
      rtb_Gain_p = 0.22222222222222221;
      break;

     default:
      rtb_Gain_p = 1.0;
      break;
    }

    A380PrimComputer_RateLimiter_c(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs26_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs26_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_P.reset_Value_a, &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_cp);
    A380PrimComputer_Spoiler345Computation(rtb_xi_spoiler_deg_b, std::fmin(rtb_Y_i * rtb_handleIndex_f, rtb_Gain_g),
      &rtb_Y_i, &rtb_Gain_p);
    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_i;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs16_up, A380PrimComputer_P.RateLimiterGenericVariableTs16_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_6_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_6_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Gain_g,
       &A380PrimComputer_DWork.sf_RateLimiter_k);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_xi_spoiler_deg_b = rtb_Gain_g;
    } else {
      rtb_xi_spoiler_deg_b = rtb_left_spoiler_3_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Gain_p;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs17_up, A380PrimComputer_P.RateLimiterGenericVariableTs17_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_6_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_6_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Gain_g,
       &A380PrimComputer_DWork.sf_RateLimiter_bo);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Switch3_h = rtb_Gain_g;
    } else {
      rtb_Switch3_h = rtb_raComputationValue;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_i;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs22_up, A380PrimComputer_P.RateLimiterGenericVariableTs22_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_7_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_7_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Gain_g,
       &A380PrimComputer_DWork.sf_RateLimiter_i);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg = rtb_Gain_g;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg =
        rtb_left_spoiler_4_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Gain_p;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs23_up, A380PrimComputer_P.RateLimiterGenericVariableTs23_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_7_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_7_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Gain_g,
       &A380PrimComputer_DWork.sf_RateLimiter_f1);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg = rtb_Gain_g;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg =
        rtb_right_spoiler_4_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_f;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_i;
    }

    A380PrimComputer_RateLimiter_a
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg,
       A380PrimComputer_P.RateLimiterGenericVariableTs20_up, A380PrimComputer_P.RateLimiterGenericVariableTs20_lo,
       A380PrimComputer_B.BusAssignment_nw.data.time.dt,
       A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.left_spoiler_8_deg,
       ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_8_engaged) ||
        (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i,
       &A380PrimComputer_DWork.sf_RateLimiter_gm);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_Y_i;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        rtb_left_spoiler_5_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_f;
    }

    A380PrimComputer_RateLimiter_a(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs21_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs21_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.right_spoiler_8_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.spoiler_pair_8_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_nl);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Y_f = rtb_Y_i;
    } else {
      rtb_Y_f = rtb_right_spoiler_5_command_deg_Data;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law)) {
     case 0:
      rtb_Gain_p = rtb_zeta_upper_deg;
      break;

     case 1:
      rtb_Gain_p = rtb_zeta_upper_deg_p;
      break;

     default:
      rtb_Gain_p = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs6_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs6_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.upper_rudder_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.upper_rudder_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_np);
    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg = rtb_Y_i;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg =
        rtb_left_spoiler_6_command_deg_Data;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_lateral_law)) {
     case 0:
      rtb_Gain_p = rtb_zeta_lower_deg;
      break;

     case 1:
      rtb_Gain_p = rtb_zeta_lower_deg_n;
      break;

     default:
      rtb_Gain_p = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_Gain_p, A380PrimComputer_P.RateLimiterGenericVariableTs7_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs7_lo, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.lateral_surface_positions.lower_rudder_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.lower_rudder_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_iy);
    if (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Y_i = rtb_right_spoiler_6_command_deg_Data;
    }

    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg = rtb_Y_i;
    rtb_Gain_bk = A380PrimComputer_P.DiscreteDerivativeVariableTs_Gain *
      A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_dot_deg_s;
    A380PrimComputer_LagFilter((rtb_Gain_bk - A380PrimComputer_DWork.Delay_DSTATE) /
      A380PrimComputer_B.BusAssignment_nw.data.time.dt, A380PrimComputer_P.LagFilter_C1_e,
      A380PrimComputer_B.BusAssignment_nw.data.time.dt, &rtb_Y_i, &A380PrimComputer_DWork.sf_LagFilter);
    rtb_Gain_p = (((A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg +
                    A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg) +
                   A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg) +
                  A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg) *
      A380PrimComputer_P.Gain_Gain_a;
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel_bit_p, &rtb_y_k1);
    rtb_OR_ou = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel1_bit_h, &rtb_y_k1);
    rtb_OR_a = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel2_bit_fv, &rtb_y_k1);
    rtb_OR_ll = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel3_bit_cv, &rtb_y_k1);
    rtb_Equal = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel4_bit_n4, &rtb_y_k1);
    rtb_OR_n = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel5_bit_py, &rtb_y_k1);
    A380PrimComputer_MATLABFunction_o(rtb_OR_ou, rtb_OR_a, rtb_OR_ll, rtb_Equal, rtb_OR_n, (rtb_y_k1 != 0U),
      &rtb_handleIndex_f);
    rtb_OR_a = (A380PrimComputer_B.BusAssignment_nw.logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant_const_f) && (
      static_cast<real_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law) !=
      A380PrimComputer_P.CompareToConstant2_const_f)));
    LawMDLOBJ5.step(&A380PrimComputer_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputer_B.BusAssignment_nw.data.time.simulation_time,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.n_z_g,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_dot_deg_s, &rtb_Y_i,
                    &rtb_Gain_p, &A380PrimComputer_B.BusAssignment_nw.data.analog_inputs.ths_pos_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.alpha_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ra_computation_data_ft, &rtb_handleIndex_f,
                    (const_cast<real_T*>(&A380PrimComputer_RGND)), (const_cast<real_T*>(&A380PrimComputer_RGND)),
                    &A380PrimComputer_P.Constant_Value_g, &A380PrimComputer_P.Constant_Value_g,
                    &A380PrimComputer_B.BusAssignment_nw.data.sim_data.tailstrike_protection_on, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), &A380PrimComputer_B.BusAssignment_nw.logic.total_sidestick_pitch_command,
                    &A380PrimComputer_B.BusAssignment_nw.logic.on_ground, &rtb_OR_a,
                    &A380PrimComputer_B.BusAssignment_nw.logic.high_alpha_prot_active,
                    &A380PrimComputer_B.BusAssignment_nw.logic.high_speed_prot_active,
                    &A380PrimComputer_B.BusAssignment_nw.logic.alpha_prot_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.alpha_max_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.high_speed_prot_hi_thresh_kn,
                    &A380PrimComputer_B.BusAssignment_nw.logic.high_speed_prot_lo_thresh_kn,
                    &A380PrimComputer_B.BusAssignment_nw.data.temporary_ap_input.pitch_command,
                    &A380PrimComputer_B.BusAssignment_nw.data.temporary_ap_input.ap_engaged, &rtb_eta_deg,
                    &rtb_eta_trim_dot_deg_s, &rtb_eta_trim_limit_lo, &rtb_eta_trim_limit_up);
    rtb_Y_i = ((A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg +
                A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg) +
               A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg) +
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg;
    rtb_Gain_g = A380PrimComputer_P.Gain_Gain_g * rtb_Y_i;
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel_bit_n, &rtb_y_k1);
    rtb_OR_ou = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel1_bit_h1, &rtb_y_k1);
    rtb_OR_a = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel2_bit_gn, &rtb_y_k1);
    rtb_OR_ll = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel3_bit_b, &rtb_y_k1);
    rtb_Equal = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel4_bit_i, &rtb_y_k1);
    rtb_OR_n = (rtb_y_k1 != 0U);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputer_P.BitfromLabel5_bit_le, &rtb_y_k1);
    A380PrimComputer_MATLABFunction_o(rtb_OR_ou, rtb_OR_a, rtb_OR_ll, rtb_Equal, rtb_OR_n, (rtb_y_k1 != 0U),
      &rtb_handleIndex_d);
    rtb_OR_ll = (A380PrimComputer_B.BusAssignment_nw.logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant3_const_o) &&
      (static_cast<real_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law) !=
       A380PrimComputer_P.CompareToConstant4_const_o) && (static_cast<real_T>
      (A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant5_const_b)));
    rtb_Equal = (A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law !=
                 A380PrimComputer_P.EnumeratedConstant_Value_b);
    LawMDLOBJ3.step(&A380PrimComputer_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputer_B.BusAssignment_nw.data.time.simulation_time,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.n_z_g,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ir_computation_data.theta_dot_deg_s, &rtb_Gain_g,
                    &A380PrimComputer_B.BusAssignment_nw.data.analog_inputs.ths_pos_deg,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.mach,
                    &A380PrimComputer_B.BusAssignment_nw.logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputer_B.BusAssignment_nw.logic.ra_computation_data_ft, &rtb_handleIndex_d,
                    (const_cast<real_T*>(&A380PrimComputer_RGND)), (const_cast<real_T*>(&A380PrimComputer_RGND)),
                    &A380PrimComputer_B.BusAssignment_nw.logic.total_sidestick_pitch_command,
                    &A380PrimComputer_B.BusAssignment_nw.logic.on_ground, &rtb_OR_ll, &rtb_Equal, &rtb_eta_deg_o,
                    &rtb_eta_trim_dot_deg_s_a, &rtb_eta_trim_limit_lo_h, &rtb_eta_trim_limit_up_d);
    LawMDLOBJ4.step(&A380PrimComputer_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputer_B.BusAssignment_nw.logic.total_sidestick_pitch_command, &rtb_eta_deg_od,
                    &rtb_eta_trim_dot_deg_s_l, &rtb_eta_trim_limit_lo_b, &rtb_eta_trim_limit_up_a);
    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law)) {
     case 0:
     case 1:
      rtb_handleIndex_d = rtb_eta_deg;
      break;

     case 2:
     case 3:
     case 4:
      rtb_handleIndex_d = rtb_eta_deg_o;
      break;

     case 5:
      rtb_handleIndex_d = rtb_eta_deg_od;
      break;

     default:
      rtb_handleIndex_d = A380PrimComputer_P.Constant_Value_af;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_handleIndex_d, A380PrimComputer_P.RateLimiterGenericVariableTs_up_a,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo_f, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_inboard_elevator_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_inboard_elevator_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Y_i, &A380PrimComputer_DWork.sf_RateLimiter_cr);
    A380PrimComputer_MATLABFunction_e
      (&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl_law_status_word,
       A380PrimComputer_P.BitfromLabel_bit_of, &rtb_y_k1);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      &rtb_y_kkg);
    if ((rtb_y_k1 != 0U) && rtb_y_kkg) {
      rtb_Switch_g_idx_0 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
      rtb_Switch_g_idx_1 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
      rtb_Switch_g_idx_2 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
      rtb_Switch_g_idx_3 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
      rtb_V_ias = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.ths_command_deg.Data;
    } else {
      rtb_Switch_g_idx_0 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
      rtb_Switch_g_idx_1 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
      rtb_Switch_g_idx_2 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
      rtb_Switch_g_idx_3 =
        A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
      rtb_V_ias = A380PrimComputer_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.ths_command_deg.Data;
    }

    if (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Y_i = rtb_Switch_g_idx_0;
    }

    A380PrimComputer_RateLimiter_a(rtb_handleIndex_d, A380PrimComputer_P.RateLimiterGenericVariableTs1_up_a,
      A380PrimComputer_P.RateLimiterGenericVariableTs1_lo_c, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_inboard_elevator_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_inboard_elevator_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Gain_p,
      &A380PrimComputer_DWork.sf_RateLimiter_p);
    if (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Gain_p = rtb_Switch_g_idx_1;
    }

    A380PrimComputer_RateLimiter_a(rtb_handleIndex_d, A380PrimComputer_P.RateLimiterGenericVariableTs2_up_l,
      A380PrimComputer_P.RateLimiterGenericVariableTs2_lo_k, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.left_outboard_elevator_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.left_outboard_elevator_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_Gain_g,
      &A380PrimComputer_DWork.sf_RateLimiter_cda);
    if (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_Gain_g = rtb_Switch_g_idx_2;
    }

    A380PrimComputer_RateLimiter_a(rtb_handleIndex_d, A380PrimComputer_P.RateLimiterGenericVariableTs3_up_j,
      A380PrimComputer_P.RateLimiterGenericVariableTs3_lo_k, A380PrimComputer_B.BusAssignment_nw.data.time.dt,
      A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.right_outboard_elevator_deg,
      ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.right_outboard_elevator_engaged) ||
       (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim)), &rtb_handleIndex_f,
      &A380PrimComputer_DWork.sf_RateLimiter_ph);
    if (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_handleIndex_f = rtb_Switch_g_idx_3;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law)) {
     case 0:
     case 1:
      rtb_handleIndex_d = rtb_eta_trim_limit_up;
      break;

     case 2:
     case 3:
     case 4:
      rtb_handleIndex_d = rtb_eta_trim_limit_up_d;
      break;

     case 5:
      rtb_handleIndex_d = rtb_eta_trim_limit_up_a;
      break;

     default:
      rtb_handleIndex_d = A380PrimComputer_P.Constant2_Value_l;
      break;
    }

    if (A380PrimComputer_B.BusAssignment_nw.logic.ths_automatic_mode_active) {
      switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law)) {
       case 0:
       case 1:
        rtb_Switch2_a = rtb_eta_trim_dot_deg_s;
        break;

       case 2:
       case 3:
       case 4:
        rtb_Switch2_a = rtb_eta_trim_dot_deg_s_a;
        break;

       case 5:
        rtb_Switch2_a = rtb_eta_trim_dot_deg_s_l;
        break;

       default:
        rtb_Switch2_a = A380PrimComputer_P.Constant_Value_af;
        break;
      }
    } else {
      rtb_Switch2_a = A380PrimComputer_B.BusAssignment_nw.logic.ths_manual_mode_c_deg_s;
    }

    rtb_Switch2_a = A380PrimComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_Switch2_a *
      A380PrimComputer_B.BusAssignment_nw.data.time.dt;
    if (A380PrimComputer_B.BusAssignment_nw.logic.ths_automatic_mode_active) {
      rtb_y_hz = ((!A380PrimComputer_B.BusAssignment_nw.logic.surface_statuses.ths_engaged) ||
                  (!A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim));
    } else {
      rtb_y_hz = !A380PrimComputer_B.BusAssignment_nw.logic.ths_engaged;
    }

    A380PrimComputer_DWork.icLoad = (rtb_y_hz || A380PrimComputer_DWork.icLoad);
    if (A380PrimComputer_DWork.icLoad) {
      A380PrimComputer_DWork.Delay_DSTATE_c = A380PrimComputer_B.BusAssignment_nw.logic.pitch_surface_positions.ths_deg
        - rtb_Switch2_a;
    }

    A380PrimComputer_DWork.Delay_DSTATE_c += rtb_Switch2_a;
    if (A380PrimComputer_DWork.Delay_DSTATE_c > rtb_handleIndex_d) {
      A380PrimComputer_DWork.Delay_DSTATE_c = rtb_handleIndex_d;
    } else {
      switch (static_cast<int32_T>(A380PrimComputer_B.BusAssignment_nw.logic.active_pitch_law)) {
       case 0:
       case 1:
        rtb_handleIndex_d = rtb_eta_trim_limit_lo;
        break;

       case 2:
       case 3:
       case 4:
        rtb_handleIndex_d = rtb_eta_trim_limit_lo_h;
        break;

       case 5:
        rtb_handleIndex_d = rtb_eta_trim_limit_lo_b;
        break;

       default:
        rtb_handleIndex_d = A380PrimComputer_P.Constant3_Value_h;
        break;
      }

      if (A380PrimComputer_DWork.Delay_DSTATE_c < rtb_handleIndex_d) {
        A380PrimComputer_DWork.Delay_DSTATE_c = rtb_handleIndex_d;
      }
    }

    if (A380PrimComputer_B.BusAssignment_nw.logic.is_master_prim) {
      rtb_handleIndex_d = A380PrimComputer_DWork.Delay_DSTATE_c;
    } else if (A380PrimComputer_B.BusAssignment_nw.logic.ths_automatic_mode_active) {
      rtb_handleIndex_d = rtb_V_ias;
    } else {
      rtb_handleIndex_d = A380PrimComputer_DWork.Delay_DSTATE_c;
    }

    A380PrimComputer_B.BusAssignment_om = A380PrimComputer_B.BusAssignment_nw;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_inboard_aileron_deg = rtb_Y;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_inboard_aileron_deg =
      rtb_right_inboard_aileron_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_midboard_aileron_deg =
      rtb_left_midboard_aileron_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_midboard_aileron_deg = rtb_thsPos;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_outboard_aileron_deg = rtb_Sum6;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_outboard_aileron_deg = rtb_handleIndex;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_1_deg = rtb_outerAilLowerLim;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_1_deg = rtb_right_spoiler_1_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_2_deg = rtb_left_spoiler_2_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_2_deg = rtb_right_spoiler_2_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_3_deg = rtb_left_spoiler_3_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_3_deg = rtb_right_spoiler_3_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_4_deg = rtb_Switch9_f;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_4_deg = rtb_Switch8_o;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_5_deg = rtb_Switch7_e;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_5_deg = rtb_Switch6_i;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_6_deg = rtb_xi_spoiler_deg_b;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_6_deg = rtb_Switch3_h;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_7_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_7_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.left_spoiler_8_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.right_spoiler_8_deg = rtb_Y_f;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.upper_rudder_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
    A380PrimComputer_B.BusAssignment_om.laws.lateral_law_outputs.lower_rudder_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
    A380PrimComputer_B.BusAssignment_om.laws.pitch_law_outputs.left_inboard_elevator_deg = rtb_Y_i;
    A380PrimComputer_B.BusAssignment_om.laws.pitch_law_outputs.right_inboard_elevator_deg = rtb_Gain_p;
    A380PrimComputer_B.BusAssignment_om.laws.pitch_law_outputs.left_outboard_elevator_deg = rtb_Gain_g;
    A380PrimComputer_B.BusAssignment_om.laws.pitch_law_outputs.right_outboard_elevator_deg = rtb_handleIndex_f;
    A380PrimComputer_B.BusAssignment_om.laws.pitch_law_outputs.ths_deg = rtb_handleIndex_d;
    if (A380PrimComputer_B.BusAssignment_om.data.discrete_inputs.is_unit_1) {
      rtb_Switch2_a = rtb_Y;
      rtb_rightAileron1Command = rtb_right_inboard_aileron_deg;
      rtb_leftAileron2Command = rtb_left_midboard_aileron_deg;
      rtb_rightAileron2Command = rtb_thsPos;
      rtb_elevator1Command = rtb_Gain_g;
      rtb_elevator2Command = rtb_Y_i;
      rtb_elevator3Command = rtb_handleIndex_f;
      rtb_rudder1Command = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
      rtb_rudder2Command = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
      rtb_leftSpoilerCommand = rtb_xi_spoiler_deg_b;
      rtb_rightSpoilerCommand = rtb_Switch3_h;
    } else if (A380PrimComputer_B.BusAssignment_om.data.discrete_inputs.is_unit_2) {
      rtb_Switch2_a = rtb_Sum6;
      rtb_rightAileron1Command = rtb_handleIndex;
      rtb_leftAileron2Command = rtb_Y;
      rtb_rightAileron2Command = rtb_right_inboard_aileron_deg;
      rtb_elevator1Command = rtb_handleIndex_f;
      rtb_elevator2Command = rtb_Gain_g;
      rtb_elevator3Command = rtb_Gain_p;
      rtb_rudder1Command = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg;
      rtb_rudder2Command = 0.0;
      rtb_leftSpoilerCommand = rtb_Switch7_e;
      rtb_rightSpoilerCommand = rtb_Switch6_i;
    } else {
      rtb_Switch2_a = rtb_left_midboard_aileron_deg;
      rtb_rightAileron1Command = rtb_thsPos;
      rtb_leftAileron2Command = rtb_Sum6;
      rtb_rightAileron2Command = rtb_handleIndex;
      rtb_elevator1Command = rtb_Y_i;
      rtb_elevator2Command = rtb_Gain_p;
      rtb_elevator3Command = 0.0;
      rtb_rudder1Command = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg;
      rtb_rudder2Command = 0.0;
      rtb_leftSpoilerCommand = rtb_Switch9_f;
      rtb_rightSpoilerCommand = rtb_Switch8_o;
    }

    rtb_Switch31 = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
    if (A380PrimComputer_B.BusAssignment_om.logic.is_master_prim) {
      rtb_y_k1 = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_alpha = static_cast<real32_T>(rtb_right_inboard_aileron_deg);
      rtb_DataTypeConversion1_j = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_phi = static_cast<real32_T>(rtb_left_midboard_aileron_deg);
      rtb_y_e = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_q = static_cast<real32_T>(rtb_thsPos);
      rtb_right_midboard_aileron_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_r = static_cast<real32_T>(rtb_Sum6);
      rtb_left_outboard_aileron_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_n_x = static_cast<real32_T>(rtb_handleIndex);
      rtb_right_outboard_aileron_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_n_y = static_cast<real32_T>(rtb_outerAilLowerLim);
      rtb_left_spoiler_1_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_n_z = static_cast<real32_T>(rtb_right_spoiler_1_deg);
      rtb_right_spoiler_1_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_theta_dot = static_cast<real32_T>(rtb_left_spoiler_2_deg);
      rtb_left_spoiler_2_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_phi_dot = static_cast<real32_T>(rtb_right_spoiler_2_deg);
      rtb_right_spoiler_2_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_spoiler_3_command_deg_Data = static_cast<real32_T>(rtb_left_spoiler_3_deg);
      rtb_left_spoiler_3_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_raComputationValue = static_cast<real32_T>(rtb_right_spoiler_3_deg);
      rtb_right_spoiler_3_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_spoiler_4_command_deg_Data = static_cast<real32_T>(rtb_Switch9_f);
      rtb_left_spoiler_4_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_right_spoiler_4_command_deg_Data = static_cast<real32_T>(rtb_Switch8_o);
      rtb_right_spoiler_4_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_spoiler_5_command_deg_Data = static_cast<real32_T>(rtb_Switch7_e);
      rtb_left_spoiler_5_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_right_spoiler_5_command_deg_Data = static_cast<real32_T>(rtb_Switch6_i);
      rtb_right_spoiler_5_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_spoiler_6_command_deg_Data = static_cast<real32_T>(rtb_xi_spoiler_deg_b);
      rtb_left_spoiler_6_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_right_spoiler_6_command_deg_Data = static_cast<real32_T>(rtb_Switch3_h);
      rtb_right_spoiler_6_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_spoiler_7_command_deg_Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg);
      rtb_left_spoiler_7_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_right_spoiler_7_command_deg_Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg);
      rtb_right_spoiler_7_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_spoiler_8_command_deg_Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg);
      rtb_left_spoiler_8_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_right_spoiler_8_command_deg_Data = static_cast<real32_T>(rtb_Y_f);
      rtb_right_spoiler_8_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_inboard_elevator_command_deg_Data = static_cast<real32_T>(rtb_Y_i);
      rtb_left_inboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_right_inboard_elevator_command_deg_Data = static_cast<real32_T>(rtb_Gain_p);
      rtb_right_inboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_left_outboard_elevator_command_deg_Data = static_cast<real32_T>(rtb_Gain_g);
      rtb_left_outboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_right_outboard_elevator_command_deg_Data = static_cast<real32_T>(rtb_handleIndex_f);
      rtb_right_outboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_Switch_g_idx_0 = static_cast<real32_T>(rtb_handleIndex_d);
      rtb_y_m = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_Switch29 = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_Switch_g_idx_1 = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_upper_rudder_deg);
      rtb_Switch31 = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
      rtb_Switch_g_idx_2 = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_lower_rudder_deg);
    } else {
      rtb_y_k1 = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_alpha = A380PrimComputer_P.Constant14_Value;
      rtb_DataTypeConversion1_j = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_phi = A380PrimComputer_P.Constant13_Value;
      rtb_y_e = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_q = A380PrimComputer_P.Constant12_Value;
      rtb_right_midboard_aileron_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_r = A380PrimComputer_P.Constant11_Value_i;
      rtb_left_outboard_aileron_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_n_x = A380PrimComputer_P.Constant10_Value_d;
      rtb_right_outboard_aileron_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_n_y = A380PrimComputer_P.Constant9_Value_d;
      rtb_left_spoiler_1_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_n_z = A380PrimComputer_P.Constant8_Value_l;
      rtb_right_spoiler_1_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_theta_dot = A380PrimComputer_P.Constant24_Value;
      rtb_left_spoiler_2_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_phi_dot = A380PrimComputer_P.Constant23_Value;
      rtb_right_spoiler_2_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_spoiler_3_command_deg_Data = A380PrimComputer_P.Constant7_Value_a;
      rtb_left_spoiler_3_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_raComputationValue = A380PrimComputer_P.Constant6_Value_a0;
      rtb_right_spoiler_3_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_spoiler_4_command_deg_Data = A380PrimComputer_P.Constant26_Value;
      rtb_left_spoiler_4_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_right_spoiler_4_command_deg_Data = A380PrimComputer_P.Constant25_Value;
      rtb_right_spoiler_4_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_spoiler_5_command_deg_Data = A380PrimComputer_P.Constant28_Value;
      rtb_left_spoiler_5_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_right_spoiler_5_command_deg_Data = A380PrimComputer_P.Constant27_Value;
      rtb_right_spoiler_5_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_spoiler_6_command_deg_Data = A380PrimComputer_P.Constant5_Value_c;
      rtb_left_spoiler_6_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_right_spoiler_6_command_deg_Data = A380PrimComputer_P.Constant4_Value_p;
      rtb_right_spoiler_6_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_spoiler_7_command_deg_Data = A380PrimComputer_P.Constant30_Value;
      rtb_left_spoiler_7_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_right_spoiler_7_command_deg_Data = A380PrimComputer_P.Constant29_Value;
      rtb_right_spoiler_7_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_spoiler_8_command_deg_Data = A380PrimComputer_P.Constant32_Value;
      rtb_left_spoiler_8_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_right_spoiler_8_command_deg_Data = A380PrimComputer_P.Constant31_Value;
      rtb_right_spoiler_8_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_inboard_elevator_command_deg_Data = A380PrimComputer_P.Constant3_Value_m;
      rtb_left_inboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_right_inboard_elevator_command_deg_Data = A380PrimComputer_P.Constant33_Value;
      rtb_right_inboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_left_outboard_elevator_command_deg_Data = A380PrimComputer_P.Constant34_Value;
      rtb_left_outboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_right_outboard_elevator_command_deg_Data = A380PrimComputer_P.Constant35_Value;
      rtb_right_outboard_elevator_command_deg_SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_Switch_g_idx_0 = A380PrimComputer_P.Constant2_Value_n;
      rtb_y_m = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_Switch29 = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant_Value);
      rtb_Switch_g_idx_1 = A380PrimComputer_P.Constant1_Value_g;
      rtb_Switch_g_idx_2 = A380PrimComputer_P.Constant15_Value;
    }

    rtb_VectorConcatenate[0] = A380PrimComputer_B.BusAssignment_om.logic.left_aileron_1_avail;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.BusAssignment_om.logic.left_aileron_1_engaged;
    rtb_VectorConcatenate[2] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.BusAssignment_om.logic.right_aileron_1_avail;
    rtb_VectorConcatenate[4] = A380PrimComputer_B.BusAssignment_om.logic.right_aileron_1_engaged;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.BusAssignment_om.logic.left_aileron_2_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.BusAssignment_om.logic.left_aileron_2_engaged;
    rtb_VectorConcatenate[8] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.BusAssignment_om.logic.right_aileron_2_avail;
    rtb_VectorConcatenate[10] = A380PrimComputer_B.BusAssignment_om.logic.right_aileron_2_engaged;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant16_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate, &rtb_Switch_g_idx_3);
    rtb_VectorConcatenate[0] = A380PrimComputer_B.BusAssignment_om.logic.left_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.BusAssignment_om.logic.left_spoiler_electric_mode_avail;
    rtb_VectorConcatenate[2] = A380PrimComputer_B.BusAssignment_om.logic.left_spoiler_hydraulic_mode_engaged;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.BusAssignment_om.logic.left_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate[4] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.BusAssignment_om.logic.right_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.BusAssignment_om.logic.right_spoiler_electric_mode_avail;
    rtb_VectorConcatenate[8] = A380PrimComputer_B.BusAssignment_om.logic.right_spoiler_hydraulic_mode_engaged;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.BusAssignment_om.logic.right_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate[10] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant17_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate, &rtb_V_ias);
    rtb_VectorConcatenate[0] = A380PrimComputer_B.BusAssignment_om.logic.elevator_1_avail;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.BusAssignment_om.logic.elevator_1_engaged;
    rtb_VectorConcatenate[2] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.BusAssignment_om.logic.elevator_2_avail;
    rtb_VectorConcatenate[4] = A380PrimComputer_B.BusAssignment_om.logic.elevator_2_engaged;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.BusAssignment_om.logic.elevator_3_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.BusAssignment_om.logic.elevator_3_engaged;
    rtb_VectorConcatenate[8] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.BusAssignment_om.logic.ths_avail;
    rtb_VectorConcatenate[10] = A380PrimComputer_B.BusAssignment_om.logic.ths_engaged;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant18_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate, &rtb_V_tas);
    rtb_VectorConcatenate[0] = A380PrimComputer_B.BusAssignment_om.logic.rudder_1_hydraulic_mode_avail;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.BusAssignment_om.logic.rudder_1_electric_mode_avail;
    rtb_VectorConcatenate[2] = A380PrimComputer_B.BusAssignment_om.logic.rudder_1_hydraulic_mode_engaged;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.BusAssignment_om.logic.rudder_1_electric_mode_engaged;
    rtb_VectorConcatenate[4] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.BusAssignment_om.logic.rudder_2_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.BusAssignment_om.logic.rudder_2_electric_mode_avail;
    rtb_VectorConcatenate[8] = A380PrimComputer_B.BusAssignment_om.logic.rudder_2_hydraulic_mode_engaged;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.BusAssignment_om.logic.rudder_2_electric_mode_engaged;
    rtb_VectorConcatenate[10] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant19_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate, &rtb_mach);
    A380PrimComputer_MATLABFunction_b(A380PrimComputer_B.BusAssignment_om.logic.pitch_law_capability,
      &rtb_VectorConcatenate_ep[0], &rtb_VectorConcatenate_ep[1], &rtb_VectorConcatenate_ep[2]);
    A380PrimComputer_MATLABFunction2(A380PrimComputer_B.BusAssignment_om.logic.lateral_law_capability,
      &rtb_VectorConcatenate_ep[3], &rtb_VectorConcatenate_ep[4]);
    A380PrimComputer_MATLABFunction_b(A380PrimComputer_B.BusAssignment_om.logic.active_pitch_law,
      &rtb_VectorConcatenate_ep[5], &rtb_VectorConcatenate_ep[6], &rtb_VectorConcatenate_ep[7]);
    A380PrimComputer_MATLABFunction2(A380PrimComputer_B.BusAssignment_om.logic.active_lateral_law,
      &rtb_VectorConcatenate_ep[8], &rtb_VectorConcatenate_ep[9]);
    rtb_VectorConcatenate_ep[10] = A380PrimComputer_B.BusAssignment_om.logic.is_master_prim;
    rtb_VectorConcatenate_ep[11] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[12] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[13] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[14] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[15] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[16] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[17] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_ep[18] = A380PrimComputer_P.Constant21_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep, &rtb_fctl_law_status_word.Data);
    rtb_fctl_law_status_word.SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
    rtb_VectorConcatenate_ep[0] = A380PrimComputer_B.BusAssignment_om.logic.ths_automatic_mode_active;
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
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep, &rtb_discrete_status_word_1.Data);
    rtb_discrete_status_word_1.SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
    rtb_VectorConcatenate_ep[0] = A380PrimComputer_B.BusAssignment_om.logic.ap_authorised;
    rtb_VectorConcatenate_ep[1] = A380PrimComputer_B.BusAssignment_om.logic.protection_ap_disconnect;
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
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep, &rtb_fe_status_word_c.Data);
    rtb_fe_status_word_c.SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
    rtb_VectorConcatenate_ep[0] = A380PrimComputer_P.Constant38_Value;
    rtb_VectorConcatenate_ep[1] = A380PrimComputer_B.BusAssignment_om.data.temporary_ap_input.ap_engaged;
    rtb_VectorConcatenate_ep[2] = A380PrimComputer_B.BusAssignment_om.data.temporary_ap_input.ap_engaged;
    rtb_VectorConcatenate_ep[3] = A380PrimComputer_P.Constant38_Value;
    rtb_VectorConcatenate_ep[4] = A380PrimComputer_P.Constant38_Value;
    rtb_VectorConcatenate_ep[5] = A380PrimComputer_B.BusAssignment_om.fg_logic.land_2_capability;
    rtb_VectorConcatenate_ep[6] = A380PrimComputer_B.BusAssignment_om.fg_logic.land_3_fail_passive_capability;
    rtb_VectorConcatenate_ep[7] = A380PrimComputer_B.BusAssignment_om.fg_logic.land_3_fail_op_capability;
    rtb_VectorConcatenate_ep[8] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[9] = A380PrimComputer_B.BusAssignment_om.fg_logic.land_2_inop;
    rtb_VectorConcatenate_ep[10] = A380PrimComputer_B.BusAssignment_om.fg_logic.land_3_fail_passive_inop;
    rtb_VectorConcatenate_ep[11] = A380PrimComputer_B.BusAssignment_om.fg_logic.land_3_fail_op_inop;
    rtb_VectorConcatenate_ep[12] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[13] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[14] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[15] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[16] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[17] = A380PrimComputer_P.Constant37_Value;
    rtb_VectorConcatenate_ep[18] = A380PrimComputer_P.Constant37_Value;
    A380PrimComputer_MATLABFunction_i(rtb_VectorConcatenate_ep, &rtb_fg_status_word_o.Data);
    rtb_fg_status_word_o.SSM = static_cast<uint32_T>(A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out = A380PrimComputer_B.BusAssignment_om;
    A380PrimComputer_Y.out.discrete_outputs.alignment_dummy = A380PrimComputer_P.Constant2_Value_o;
    A380PrimComputer_Y.out.discrete_outputs.elevator_1_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.elevator_1_engaged;
    A380PrimComputer_Y.out.discrete_outputs.elevator_2_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.elevator_2_engaged;
    A380PrimComputer_Y.out.discrete_outputs.elevator_3_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.elevator_3_engaged;
    A380PrimComputer_Y.out.discrete_outputs.ths_active_mode = A380PrimComputer_B.BusAssignment_om.logic.ths_engaged;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_1_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.left_aileron_1_engaged;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_2_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.left_aileron_2_engaged;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_1_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.right_aileron_1_engaged;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_2_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.right_aileron_2_engaged;
    A380PrimComputer_Y.out.discrete_outputs.left_spoiler_electronic_module_enable =
      A380PrimComputer_B.BusAssignment_om.logic.left_spoiler_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.right_spoiler_electronic_module_enable =
      A380PrimComputer_B.BusAssignment_om.logic.right_spoiler_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.rudder_1_hydraulic_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_electric_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.rudder_1_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.rudder_2_hydraulic_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_electric_active_mode =
      A380PrimComputer_B.BusAssignment_om.logic.rudder_2_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.prim_healthy = A380PrimComputer_P.Constant1_Value_f;
    A380PrimComputer_Y.out.discrete_outputs.fcu_own_select = A380PrimComputer_P.Constant_Value_ba;
    A380PrimComputer_Y.out.discrete_outputs.fcu_opp_select = A380PrimComputer_P.Constant_Value_ba;
    A380PrimComputer_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputer_P.Constant_Value_ba;
    if (A380PrimComputer_B.BusAssignment_om.logic.elevator_1_engaged) {
      A380PrimComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = rtb_elevator1Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = A380PrimComputer_P.Constant_Value_b;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.elevator_2_engaged) {
      A380PrimComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = rtb_elevator2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = A380PrimComputer_P.Constant1_Value_n;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.elevator_3_engaged) {
      A380PrimComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = rtb_elevator3Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = A380PrimComputer_P.Constant2_Value_k;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.ths_engaged) {
      A380PrimComputer_Y.out.analog_outputs.ths_pos_order_deg = rtb_handleIndex_d;
    } else {
      A380PrimComputer_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputer_P.Constant3_Value_g;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.left_aileron_1_engaged) {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = rtb_Switch2_a;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = A380PrimComputer_P.Constant4_Value_i;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.left_aileron_2_engaged) {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = rtb_leftAileron2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = A380PrimComputer_P.Constant5_Value_n;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.right_aileron_1_engaged) {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = rtb_rightAileron1Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = A380PrimComputer_P.Constant6_Value_f;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.right_aileron_2_engaged) {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = rtb_rightAileron2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = A380PrimComputer_P.Constant7_Value;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.left_spoiler_electric_mode_engaged ||
        A380PrimComputer_B.BusAssignment_om.logic.left_spoiler_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.left_spoiler_pos_order_deg = rtb_leftSpoilerCommand;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_spoiler_pos_order_deg = A380PrimComputer_P.Constant8_Value;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.right_spoiler_electric_mode_engaged ||
        A380PrimComputer_B.BusAssignment_om.logic.right_spoiler_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.right_spoiler_pos_order_deg = rtb_rightSpoilerCommand;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_spoiler_pos_order_deg = A380PrimComputer_P.Constant9_Value_n;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.rudder_1_electric_mode_engaged ||
        A380PrimComputer_B.BusAssignment_om.logic.rudder_1_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = rtb_rudder1Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = A380PrimComputer_P.Constant10_Value;
    }

    if (A380PrimComputer_B.BusAssignment_om.logic.rudder_2_electric_mode_engaged ||
        A380PrimComputer_B.BusAssignment_om.logic.rudder_2_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = rtb_rudder2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = A380PrimComputer_P.Constant11_Value;
    }

    A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.SSM = rtb_y_k1;
    if (A380PrimComputer_B.BusAssignment_om.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.Data = static_cast<real32_T>(rtb_Y);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.Data = A380PrimComputer_P.Constant20_Value;
    }

    A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.SSM = rtb_DataTypeConversion1_j;
    A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.Data = rtb_alpha;
    A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.SSM = rtb_y_e;
    A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.Data = rtb_phi;
    A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.SSM =
      rtb_right_midboard_aileron_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.Data = rtb_q;
    A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.SSM = rtb_left_outboard_aileron_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.Data = rtb_r;
    A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.SSM =
      rtb_right_outboard_aileron_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.Data = rtb_n_x;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.SSM = rtb_left_spoiler_1_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.Data = rtb_n_y;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.SSM = rtb_right_spoiler_1_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.Data = rtb_n_z;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.SSM = rtb_left_spoiler_2_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.Data = rtb_theta_dot;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.SSM = rtb_right_spoiler_2_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.Data = rtb_phi_dot;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.SSM = rtb_left_spoiler_3_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.Data = rtb_left_spoiler_3_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.SSM = rtb_right_spoiler_3_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.Data = rtb_raComputationValue;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.SSM = rtb_left_spoiler_4_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.Data = rtb_left_spoiler_4_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.SSM = rtb_right_spoiler_4_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.Data = rtb_right_spoiler_4_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.SSM = rtb_left_spoiler_5_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.Data = rtb_left_spoiler_5_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.SSM = rtb_right_spoiler_5_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.Data = rtb_right_spoiler_5_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.SSM = rtb_left_spoiler_6_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.Data = rtb_left_spoiler_6_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.SSM = rtb_right_spoiler_6_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.Data = rtb_right_spoiler_6_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.SSM = rtb_left_spoiler_7_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.Data = rtb_left_spoiler_7_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.SSM = rtb_right_spoiler_7_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.Data = rtb_right_spoiler_7_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.SSM = rtb_left_spoiler_8_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.Data = rtb_left_spoiler_8_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.SSM = rtb_right_spoiler_8_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.Data = rtb_right_spoiler_8_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.SSM = rtb_left_inboard_elevator_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.Data =
      rtb_left_inboard_elevator_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.SSM =
      rtb_right_inboard_elevator_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.Data =
      rtb_right_inboard_elevator_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.SSM =
      rtb_left_outboard_elevator_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.Data =
      rtb_left_outboard_elevator_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.SSM =
      rtb_right_outboard_elevator_command_deg_SSM;
    A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.Data =
      rtb_right_outboard_elevator_command_deg_Data;
    A380PrimComputer_Y.out.bus_outputs.ths_command_deg.SSM = rtb_y_m;
    A380PrimComputer_Y.out.bus_outputs.ths_command_deg.Data = rtb_Switch_g_idx_0;
    A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.SSM = rtb_Switch29;
    A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.Data = rtb_Switch_g_idx_1;
    A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.SSM = rtb_Switch31;
    A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.Data = rtb_Switch_g_idx_2;
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = A380PrimComputer_P.Gain_Gain_k *
      static_cast<real32_T>(A380PrimComputer_B.BusAssignment_om.data.analog_inputs.capt_pitch_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = A380PrimComputer_P.Gain1_Gain_g *
      static_cast<real32_T>(A380PrimComputer_B.BusAssignment_om.data.analog_inputs.fo_pitch_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = A380PrimComputer_P.Gain2_Gain *
      static_cast<real32_T>(A380PrimComputer_B.BusAssignment_om.data.analog_inputs.capt_roll_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = A380PrimComputer_P.Gain3_Gain_e *
      static_cast<real32_T>(A380PrimComputer_B.BusAssignment_om.data.analog_inputs.fo_roll_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = A380PrimComputer_P.Gain4_Gain_l *
      static_cast<real32_T>(A380PrimComputer_B.BusAssignment_om.data.analog_inputs.rudder_pedal_pos);
    A380PrimComputer_Y.out.bus_outputs.aileron_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.aileron_status_word.Data = rtb_Switch_g_idx_3;
    A380PrimComputer_Y.out.bus_outputs.left_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.left_aileron_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.left_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.left_aileron_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.right_aileron_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.right_aileron_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.spoiler_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.spoiler_status_word.Data = rtb_V_ias;
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_spoiler_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.left_spoiler_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_spoiler_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.right_spoiler_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.elevator_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_status_word.Data = rtb_V_tas;
    A380PrimComputer_Y.out.bus_outputs.elevator_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.elevator_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.elevator_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.elevator_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.elevator_3_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.elevator_3_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.elevator_3_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.ths_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.rudder_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_status_word.Data = rtb_mach;
    A380PrimComputer_Y.out.bus_outputs.rudder_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.rudder_1_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.rudder_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputer_B.BusAssignment_om.data.analog_inputs.rudder_2_pos_deg);
    A380PrimComputer_Y.out.bus_outputs.radio_height_1_ft =
      A380PrimComputer_B.BusAssignment_om.data.bus_inputs.ra_1_bus.radio_height_ft;
    A380PrimComputer_Y.out.bus_outputs.radio_height_2_ft =
      A380PrimComputer_B.BusAssignment_om.data.bus_inputs.ra_2_bus.radio_height_ft;
    A380PrimComputer_Y.out.bus_outputs.fctl_law_status_word = rtb_fctl_law_status_word;
    A380PrimComputer_Y.out.bus_outputs.discrete_status_word_1 = rtb_discrete_status_word_1;
    A380PrimComputer_Y.out.bus_outputs.fe_status_word = rtb_fe_status_word_c;
    A380PrimComputer_Y.out.bus_outputs.fg_status_word = rtb_fg_status_word_o;
    A380PrimComputer_DWork.Delay_DSTATE_cc = rtb_DataTypeConversion_dj;
    A380PrimComputer_DWork.Delay1_DSTATE = rtb_DataTypeConversion_gf;
    A380PrimComputer_DWork.Memory_PreviousInput_j = A380PrimComputer_DWork.Delay_DSTATE_e;
    A380PrimComputer_DWork.Delay_DSTATE = rtb_Gain_bk;
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
  A380PrimComputer_B(),
  A380PrimComputer_DWork()
{
}

A380PrimComputer::~A380PrimComputer() = default;
