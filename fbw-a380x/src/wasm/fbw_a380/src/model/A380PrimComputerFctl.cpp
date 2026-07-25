#include "A380PrimComputerFctl.h"
#include "rtwtypes.h"
#include "A380PrimComputerFctl_types.h"
#include <cmath>
#include <cstring>
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"
#include "A380LateralNormalLaw.h"
#include "A380LateralDirectLaw.h"
#include "A380PitchNormalLaw.h"
#include "A380PitchAlternateLaw.h"
#include "A380PitchDirectLaw.h"

const uint8_T A380PrimComputerFctl_IN_Flying{ 1U };

const uint8_T A380PrimComputerFctl_IN_Landed{ 2U };

const uint8_T A380PrimComputerFctl_IN_Landing100ft{ 3U };

const uint8_T A380PrimComputerFctl_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PrimComputerFctl_IN_Takeoff100ft{ 4U };

const real_T A380PrimComputerFctl_RGND{ 0.0 };

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_Reset(rtDW_RateLimiter_A380PrimComputerFctl_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFctl_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_a_Reset(rtDW_RateLimiter_A380PrimComputerFctl_p_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_h(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  real_T rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFctl_p_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_b_Reset(rtDW_RateLimiter_A380PrimComputerFctl_m_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_d(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  real_T rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFctl_m_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_f_Reset(rtDW_RateLimiter_A380PrimComputerFctl_c_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_l(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFctl_c_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_TransportDelay_Init(rtDW_TransportDelay_A380PrimComputerFctl_T *localDW)
{
  localDW->pointer = 1.0;
}

void A380PrimComputerFctl::A380PrimComputerFctl_TransportDelay_Reset(rtDW_TransportDelay_A380PrimComputerFctl_T *localDW)
{
  std::memset(&localDW->stack[0], 0, 70U * sizeof(real_T));
  localDW->pointer = 1.0;
  localDW->timeSinceLastSample = 0.0;
}

void A380PrimComputerFctl::A380PrimComputerFctl_TransportDelay(real_T rtu_u, real_T rtu_dt, boolean_T rtu_reset, real_T *
  rty_y, rtDW_TransportDelay_A380PrimComputerFctl_T *localDW)
{
  if (!rtu_reset) {
    real_T finalIdx;
    real_T idx;
    real_T timeSinceIdx;
    boolean_T exitg1;
    timeSinceIdx = 0.0;
    idx = localDW->pointer;
    finalIdx = localDW->pointer + 1.0;
    if (localDW->pointer + 1.0 > 35.0) {
      finalIdx = 1.0;
    }

    *rty_y = localDW->stack[static_cast<int32_T>(localDW->pointer) - 1];
    exitg1 = false;
    while ((!exitg1) && (idx != finalIdx)) {
      timeSinceIdx += localDW->stack[static_cast<int32_T>(idx) + 34];
      *rty_y = localDW->stack[static_cast<int32_T>(idx) - 1];
      if (timeSinceIdx >= 0.35) {
        exitg1 = true;
      } else {
        idx--;
        if (idx < 1.0) {
          idx = 35.0;
        }
      }
    }

    localDW->timeSinceLastSample += rtu_dt;
    if (localDW->timeSinceLastSample > 0.01) {
      localDW->stack[static_cast<int32_T>(localDW->pointer) - 1] = rtu_u;
      localDW->stack[static_cast<int32_T>(localDW->pointer) + 34] = localDW->timeSinceLastSample;
      localDW->pointer++;
      if (localDW->pointer > 35.0) {
        localDW->pointer = 1.0;
      }

      localDW->timeSinceLastSample = 0.0;
    }
  } else {
    localDW->timeSinceLastSample = 0.0;
    std::memset(&localDW->stack[0], 0, 70U * sizeof(real_T));
    for (int32_T i{0}; i < 35; i++) {
      localDW->stack[i] = rtu_u;
    }

    *rty_y = rtu_u;
  }
}

void A380PrimComputerFctl::A380PrimComputerFctl_Spoiler345Computation(real_T rtu_xiSplr, real_T rtu_speedBrakeDeflection,
  real_T *rty_leftCommand, real_T *rty_rightCommand)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_p(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T
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

void A380PrimComputerFctl::A380PrimComputerFctl_LagFilter_Reset(rtDW_LagFilter_A380PrimComputerFctl_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PrimComputerFctl_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_m(boolean_T rtu_bit1, boolean_T rtu_bit2, boolean_T
  rtu_bit3, boolean_T rtu_bit4, boolean_T rtu_bit5, boolean_T rtu_bit6, real_T *rty_handleIndex)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_b_Reset(rtDW_MATLABFunction_A380PrimComputerFctl_o_T
  *localDW)
{
  localDW->previousInput_not_empty = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *
  rty_y, rtDW_MATLABFunction_A380PrimComputerFctl_o_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_g(boolean_T rtu_bit1, boolean_T rtu_bit2, boolean_T
  rtu_bit3, boolean_T rtu_valid, a380_pitch_efcs_law *rty_law)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_k_Reset(rtDW_MATLABFunction_A380PrimComputerFctl_a_T
  *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_n(boolean_T rtu_u, real_T rtu_Ts, boolean_T
  rtu_isRisingEdge, real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputerFctl_a_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_CalculateV_alpha_max(real_T rtu_v_ias, real_T rtu_alpha, real_T
  rtu_alpha_0, real_T rtu_alpha_target, real_T *rty_V_alpha_target)
{
  *rty_V_alpha_target = std::sqrt(std::abs(rtu_alpha - rtu_alpha_0) / (rtu_alpha_target - rtu_alpha_0)) * rtu_v_ias;
}

void A380PrimComputerFctl::A380PrimComputerFctl_GetIASforMach4(real_T rtu_m, real_T rtu_m_t, real_T rtu_v, real_T
  *rty_v_t)
{
  *rty_v_t = rtu_v * rtu_m_t / rtu_m;
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_c(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_gr(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_h(a380_pitch_efcs_law rtu_law, boolean_T *rty_bit1,
  boolean_T *rty_bit2, boolean_T *rty_bit3)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction2(a380_lateral_efcs_law rtu_law, boolean_T *rty_bit1,
  boolean_T *rty_bit2)
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

void A380PrimComputerFctl::step()
{
  real_T rtb_xi_deg;
  real_T rtb_zeta_deg;
  real_T rtb_xi_deg_l;
  real_T rtb_zeta_deg_c;
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_dot_deg_s;
  real_T rtb_eta_trim_limit_lo;
  real_T rtb_eta_trim_limit_up;
  real_T rtb_eta_deg_h;
  real_T rtb_eta_trim_dot_deg_s_p;
  real_T rtb_eta_trim_limit_lo_m;
  real_T rtb_eta_trim_limit_up_c;
  real_T rtb_eta_deg_c;
  real_T rtb_eta_trim_dot_deg_s_l;
  real_T rtb_eta_trim_limit_lo_o;
  real_T rtb_eta_trim_limit_up_n;
  const base_arinc_429 *rtb_Switch_i_0;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg;
  real_T rtb_Gain2;
  real_T rtb_Gain_cu;
  real_T rtb_Gain_om;
  real_T rtb_Gain_p;
  real_T rtb_Sum6;
  real_T rtb_Switch1;
  real_T rtb_Switch23;
  real_T rtb_Switch6_i;
  real_T rtb_Switch7_e;
  real_T rtb_Switch8_o;
  real_T rtb_Switch9_f;
  real_T rtb_Switch_k;
  real_T rtb_Switch_nb;
  real_T rtb_Y;
  real_T rtb_Y_eb;
  real_T rtb_Y_k;
  real_T rtb_Y_m;
  real_T rtb_elevator1Command;
  real_T rtb_elevator2Command;
  real_T rtb_elevator3Command;
  real_T rtb_handleIndex;
  real_T rtb_handleIndex_h;
  real_T rtb_leftAileron2Command;
  real_T rtb_leftSpoilerCommand;
  real_T rtb_left_inboard_aileron_deg;
  real_T rtb_left_midboard_aileron_deg;
  real_T rtb_left_spoiler_2_deg;
  real_T rtb_left_spoiler_3_deg;
  real_T rtb_outerAilLowerLim;
  real_T rtb_outerAilUpperLim;
  real_T rtb_rightAileron1Command;
  real_T rtb_rightAileron2Command;
  real_T rtb_rightSpoilerCommand;
  real_T rtb_right_spoiler_2_deg;
  real_T rtb_rudder1Command;
  real_T rtb_rudder2Command;
  real_T rtb_speedBrakeGain;
  real_T rtb_y_ow;
  int32_T b_nz;
  int32_T iindx;
  int32_T nz;
  int32_T prim3LawCap;
  real32_T rtb_DataTypeConversion2_a;
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
  real32_T rtb_aileron_status_word_Data;
  real32_T rtb_elevator_status_word_Data;
  real32_T rtb_fctl_discrete_status_word_1_Data;
  real32_T rtb_fctl_fctl_law_status_word_Data;
  real32_T rtb_fctl_rudder_status_word_Data;
  real32_T rtb_left_outboard_elevator_command_deg_Data;
  real32_T rtb_lower_rudder_command_deg_Data;
  real32_T rtb_right_outboard_elevator_command_deg_Data;
  real32_T rtb_spoiler_status_word_Data;
  real32_T rtb_ths_command_deg_Data;
  real32_T rtb_upper_rudder_command_deg_Data;
  real32_T rtb_y_d;
  real32_T rtb_y_h4;
  real32_T rtb_y_i;
  real32_T rtb_y_kc;
  real32_T rtb_y_ks;
  real32_T rtb_y_ku;
  real32_T rtb_y_m0;
  real32_T rtb_y_ny;
  uint32_T rtb_DataTypeConversion_nx;
  uint32_T rtb_Switch3_a;
  uint32_T rtb_fctl_v_alpha_prot_kn_SSM;
  uint32_T rtb_fe_v_max_kn_SSM;
  uint32_T rtb_speed_trend_kn_SSM;
  uint32_T rtb_v_3_kn_SSM;
  uint32_T rtb_v_4_kn_SSM;
  uint32_T rtb_v_man_kn_SSM;
  uint32_T rtb_y_kp;
  uint32_T rtb_y_ml;
  uint32_T rtb_y_o5;
  uint32_T rtb_y_p;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_o[19];
  boolean_T rtb_VectorConcatenate_pw[19];
  boolean_T b_x[6];
  boolean_T elevator1Avail;
  boolean_T elevator2Avail;
  boolean_T leftInboardElevEngaged;
  boolean_T rightSpoilerHydraulicModeAvail;
  boolean_T rtb_AND10;
  boolean_T rtb_AND11;
  boolean_T rtb_AND11_m;
  boolean_T rtb_AND12;
  boolean_T rtb_AND13;
  boolean_T rtb_AND15_l;
  boolean_T rtb_AND16;
  boolean_T rtb_AND16_n;
  boolean_T rtb_AND17;
  boolean_T rtb_AND18_c;
  boolean_T rtb_AND19;
  boolean_T rtb_AND1_l;
  boolean_T rtb_AND2;
  boolean_T rtb_AND2_ac;
  boolean_T rtb_AND3;
  boolean_T rtb_AND3_h;
  boolean_T rtb_AND4;
  boolean_T rtb_AND4_d;
  boolean_T rtb_AND4_n;
  boolean_T rtb_AND6;
  boolean_T rtb_AND6_b;
  boolean_T rtb_AND6_m;
  boolean_T rtb_AND7;
  boolean_T rtb_AND8;
  boolean_T rtb_AND9;
  boolean_T rtb_AND_e;
  boolean_T rtb_AND_n;
  boolean_T rtb_Equal;
  boolean_T rtb_NOT_k;
  boolean_T rtb_OR1_h;
  boolean_T rtb_OR1_l;
  boolean_T rtb_OR_a;
  boolean_T rtb_OR_d;
  boolean_T rtb_OR_i;
  boolean_T rtb_OR_jr;
  boolean_T rtb_OR_o;
  boolean_T rtb_leftSpoilerElectricModeEngaged;
  boolean_T rtb_leftSpoilerHydraulicModeEngaged;
  boolean_T rtb_rightSpoilerElectricModeEngaged;
  boolean_T rtb_rightSpoilerHydraulicModeEngaged;
  boolean_T rtb_rudder2HydraulicModeEngaged;
  boolean_T rtb_thsEngaged;
  boolean_T rtb_y_a;
  boolean_T rtb_y_bi;
  boolean_T rtb_y_btf;
  boolean_T rtb_y_ep;
  boolean_T rtb_y_g;
  boolean_T rtb_y_i0;
  boolean_T rudder1ElectricModeAvail;
  boolean_T rudder1HydraulicModeAvail;
  boolean_T rudder1HydraulicModeHasPriority;
  boolean_T rudder2HydraulicModeHasPriority;
  boolean_T thsAvail;
  a380_lateral_efcs_law rtb_activeLateralLaw;
  a380_lateral_efcs_law rtb_lateralLawCapability;
  a380_pitch_efcs_law rtb_law;
  a380_pitch_efcs_law rtb_law_p;
  a380_pitch_efcs_law rtb_pitchLawCapability;
  if (A380PrimComputerFctl_U.in.data.sim_data.computer_running) {
    if (!A380PrimComputerFctl_DWork.Runtime_MODE) {
      A380PrimComputerFctl_DWork.Delay_DSTATE_c = A380PrimComputerFctl_P.Delay_InitialCondition;
      A380PrimComputerFctl_DWork.Delay1_DSTATE = A380PrimComputerFctl_P.Delay1_InitialCondition;
      A380PrimComputerFctl_DWork.Memory_PreviousInput = A380PrimComputerFctl_P.SRFlipFlop_initial_condition;
      A380PrimComputerFctl_DWork.Memory_PreviousInput_a = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition;
      A380PrimComputerFctl_DWork.Delay1_DSTATE_b = A380PrimComputerFctl_P.Delay1_InitialCondition_n;
      A380PrimComputerFctl_DWork.Delay2_DSTATE = A380PrimComputerFctl_P.Delay2_InitialCondition;
      A380PrimComputerFctl_DWork.Delay3_DSTATE = A380PrimComputerFctl_P.Delay3_InitialCondition;
      A380PrimComputerFctl_DWork.Delay_DSTATE_e = A380PrimComputerFctl_P.Delay_InitialCondition_o;
      A380PrimComputerFctl_DWork.Memory_PreviousInput_d = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition_i;
      A380PrimComputerFctl_DWork.Memory_PreviousInput_j = A380PrimComputerFctl_P.SRFlipFlop_initial_condition_i;
      A380PrimComputerFctl_DWork.Delay_DSTATE = A380PrimComputerFctl_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380PrimComputerFctl_DWork.icLoad = true;
      A380PrimComputerFctl_MATLABFunction_k_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_nb);
      A380PrimComputerFctl_DWork.abnormalConditionWasActive = false;
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_g4);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_nu);
      A380PrimComputerFctl_DWork.pLeftStickDisabled = false;
      A380PrimComputerFctl_DWork.pRightStickDisabled = false;
      A380PrimComputerFctl_MATLABFunction_k_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_j2);
      A380PrimComputerFctl_MATLABFunction_k_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_g2);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ne);
      A380PrimComputerFctl_DWork.eventTime_not_empty_m = false;
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_mr);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_b4);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_lf);
      A380PrimComputerFctl_DWork.sProtActive = false;
      A380PrimComputerFctl_DWork.resetEventTime_not_empty = false;
      A380PrimComputerFctl_DWork.sProtActive_g = false;
      A380PrimComputerFctl_DWork.is_active_c28_A380PrimComputerFctl = 0U;
      A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_NO_ACTIVE_CHILD;
      A380PrimComputerFctl_DWork.eventTime_not_empty = false;
      A380PrimComputerFctl_MATLABFunction_k_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_al4);
      A380PrimComputerFctl_RateLimiter_b_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_nd);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_ny);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_gc);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_m1);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_ff);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_ky);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_dmh);
      A380PrimComputerFctl_LagFilter_Reset(&A380PrimComputerFctl_DWork.sf_LagFilter);
      LawMDLOBJ2.reset();
      LawMDLOBJ1.reset();
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_it);
      A380PrimComputerFctl_TransportDelay_Reset(&A380PrimComputerFctl_DWork.sf_TransportDelay);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_m);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ng);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_h);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_iu);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_l);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ib);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_po);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_g);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_i);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_a);
      A380PrimComputerFctl_RateLimiter_b_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_d);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_c);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_k);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_f);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_o);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_oa);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_mt);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_iv);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_gk);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_fk);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_hj);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_p);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_l3);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_f1);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ob);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_n);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_la);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_iq);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_oj);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_dg);
      A380PrimComputerFctl_TransportDelay_Reset(&A380PrimComputerFctl_DWork.sf_TransportDelay_c);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_lv);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_pw);
      A380PrimComputerFctl_LagFilter_Reset(&A380PrimComputerFctl_DWork.sf_LagFilter_k);
      LawMDLOBJ5.reset();
      LawMDLOBJ3.reset();
      LawMDLOBJ4.reset();
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_mp);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_c4);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_b);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_j);
      A380PrimComputerFctl_DWork.Runtime_MODE = true;
    }

    rtb_OR_i = (A380PrimComputerFctl_U.in.general_logic.on_ground &&
                ((A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail ||
                  A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail ||
                  (!A380PrimComputerFctl_U.in.data.discrete_inputs.rat_contactor_closed) ||
                  (!A380PrimComputerFctl_U.in.data.discrete_inputs.rat_deployed)) &&
                 (((!A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail) ||
                   (!A380PrimComputerFctl_P.Constant_Value_a)) &&
                  ((!A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail) ||
                   (!A380PrimComputerFctl_P.Constant_Value_a)))));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_OR1_l = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
      rtb_OR_jr = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_OR1_l = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
      rtb_OR_jr = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_OR1_l = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
      rtb_OR_jr = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
    } else {
      rtb_OR1_l = false;
      rtb_OR_jr = false;
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word;
    } else {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word;
    }

    A380PrimComputerFctl_MATLABFunction_p(rtb_Switch_i_0, A380PrimComputerFctl_P.BitfromLabel2_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(rtb_Switch_i_0, &rtb_y_i0);
    rtb_Equal = ((rtb_y_kp != 0U) && rtb_y_i0);
    A380PrimComputerFctl_MATLABFunction_p(rtb_Switch_i_0, A380PrimComputerFctl_P.BitfromLabel1_bit, &rtb_y_kp);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_OR1_h = true;
      rtb_OR_d = true;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_OR1_h = true;
      rtb_OR_d = true;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_OR1_h = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
      rtb_OR_d = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
    } else {
      rtb_OR1_h = false;
      rtb_OR_d = false;
    }

    rtb_rudder2HydraulicModeEngaged = !rtb_OR_i;
    rtb_OR_o = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 || rtb_rudder2HydraulicModeEngaged);
    rtb_Equal = (rtb_OR1_h && ((!rtb_Equal) && rtb_OR_o));
    rtb_OR_o = (rtb_OR_d && (((!rtb_y_i0) || (rtb_y_kp == 0U)) && rtb_OR_o));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_OR_a = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_spoiler_electric_mode_avail = true;
      rightSpoilerHydraulicModeAvail = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_spoiler_electric_mode_avail = true;
      rtb_leftSpoilerHydraulicModeEngaged = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
      rtb_leftSpoilerElectricModeEngaged = ((!A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail) &&
        rtb_rudder2HydraulicModeEngaged);
      rtb_rightSpoilerHydraulicModeEngaged = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
      rtb_rightSpoilerElectricModeEngaged = ((!A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail) &&
        rtb_rudder2HydraulicModeEngaged);
      elevator1Avail = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
    } else {
      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
        rtb_OR_a = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_spoiler_electric_mode_avail = true;
        rightSpoilerHydraulicModeAvail = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_spoiler_electric_mode_avail = true;
      } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        rtb_OR_a = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_spoiler_electric_mode_avail = true;
        rightSpoilerHydraulicModeAvail = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_spoiler_electric_mode_avail = true;
      } else {
        rtb_OR_a = false;
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_spoiler_electric_mode_avail = false;
        rightSpoilerHydraulicModeAvail = false;
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_spoiler_electric_mode_avail = false;
      }

      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 ||
          A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        rtb_leftSpoilerHydraulicModeEngaged = (rtb_OR_a && rightSpoilerHydraulicModeAvail);
        rtb_leftSpoilerElectricModeEngaged = false;
        rtb_rightSpoilerHydraulicModeEngaged = rtb_leftSpoilerHydraulicModeEngaged;
        rtb_rightSpoilerElectricModeEngaged = false;
      } else {
        rtb_leftSpoilerHydraulicModeEngaged = false;
        rtb_leftSpoilerElectricModeEngaged = false;
        rtb_rightSpoilerHydraulicModeEngaged = false;
        rtb_rightSpoilerElectricModeEngaged = false;
      }

      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
        elevator1Avail = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
      } else {
        elevator1Avail = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 &&
                          A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail);
      }
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word;
    } else {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word;
    }

    A380PrimComputerFctl_MATLABFunction(rtb_Switch_i_0, &rtb_y_i0);
    A380PrimComputerFctl_MATLABFunction_p(rtb_Switch_i_0, A380PrimComputerFctl_P.BitfromLabel1_bit_n, &rtb_y_kp);
    rtb_AND_e = (rtb_y_i0 && (rtb_y_kp != 0U));
    elevator2Avail = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1 ||
                      (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 ||
                       (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 &&
                        A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail)));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_y_ep = ((!rtb_AND_e) && rtb_rudder2HydraulicModeEngaged);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_y_ep = ((!rtb_AND_e) && rtb_rudder2HydraulicModeEngaged);
    } else {
      rtb_y_ep = A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3;
    }

    rtb_AND_e = (elevator2Avail && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
      &rtb_y_g);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel3_bit, &rtb_y_ml);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word,
      &rtb_y_i0);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_l, &rtb_y_kp);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_y_g = (rtb_y_g && (rtb_y_ml != 0U));
    } else {
      rtb_y_g = (rtb_y_i0 && (rtb_y_kp != 0U));
    }

    rtb_y_i0 = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1 ||
                A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_y_ep = ((!rtb_y_g) && rtb_rudder2HydraulicModeEngaged);
    } else {
      rtb_y_ep = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 && ((!rtb_y_g) &&
        rtb_rudder2HydraulicModeEngaged));
    }

    rtb_y_g = (rtb_y_i0 && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
      &rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_b, &rtb_y_kp);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      thsAvail = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
      rtb_y_ep = ((!rtb_y_bi) || (rtb_y_kp == 0U));
    } else {
      thsAvail = ((!A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) &&
                  (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 &&
                   A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail));
      rtb_y_ep = ((!A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) &&
                  A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3);
    }

    rtb_thsEngaged = (thsAvail && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_k, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_e, &rtb_y_ml);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      &rtb_NOT_k);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_y_ep = (rtb_y_kp != 0U);
    } else {
      rtb_y_ep = (rtb_y_ml != 0U);
    }

    rtb_AND_n = (rtb_y_ep && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_c, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit, &rtb_y_ml);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word;
    } else {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word;
    }

    A380PrimComputerFctl_MATLABFunction_p(rtb_Switch_i_0, A380PrimComputerFctl_P.BitfromLabel6_bit, &rtb_y_p);
    A380PrimComputerFctl_MATLABFunction(rtb_Switch_i_0, &rtb_y_ep);
    rtb_AND6 = ((rtb_y_p != 0U) && rtb_y_ep);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word;
    } else {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word;
    }

    A380PrimComputerFctl_MATLABFunction_p(rtb_Switch_i_0, A380PrimComputerFctl_P.BitfromLabel9_bit, &rtb_y_p);
    A380PrimComputerFctl_MATLABFunction_p(rtb_Switch_i_0, A380PrimComputerFctl_P.BitfromLabel10_bit, &rtb_y_o5);
    A380PrimComputerFctl_MATLABFunction(rtb_Switch_i_0, &rtb_y_bi);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_y_ep = (rtb_y_p != 0U);
    } else {
      rtb_y_ep = (rtb_y_o5 != 0U);
    }

    rtb_AND3 = (rtb_y_ep && rtb_y_bi);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeAvail = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
      rudder1ElectricModeAvail = true;
      rudder1HydraulicModeHasPriority = true;
      rtb_AND6 = ((!rtb_AND_n) && (!A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail) &&
                  (!rtb_AND6) && (!rtb_AND3) && rtb_rudder2HydraulicModeEngaged);
    } else {
      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
        rudder1HydraulicModeAvail = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeAvail = A380PrimComputerFctl_U.in.general_logic.is_yellow_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else {
        rudder1HydraulicModeAvail = false;
        rudder1ElectricModeAvail = false;
      }

      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 ||
          A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeHasPriority = !rtb_AND_n;
        if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
          rtb_y_ep = (rtb_y_kp != 0U);
        } else {
          rtb_y_ep = (rtb_y_ml != 0U);
        }

        rtb_AND6 = (rudder1HydraulicModeHasPriority && ((!rtb_NOT_k) || (!rtb_y_ep)) && (!rudder1HydraulicModeAvail) &&
                    (!rtb_AND6) && (!rtb_AND3) && rtb_rudder2HydraulicModeEngaged);
      } else {
        rudder1HydraulicModeHasPriority = false;
        rtb_AND6 = false;
      }
    }

    rtb_AND_n = (rudder1HydraulicModeAvail && rudder1HydraulicModeHasPriority);
    rtb_AND6 = (rudder1ElectricModeAvail && rtb_AND6);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word,
      &rtb_NOT_k);
    rtb_AND2 = ((rtb_y_kp != 0U) && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      &rtb_y_bi);
    rtb_AND4 = ((rtb_y_kp != 0U) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      &rtb_y_ep);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeHasPriority = A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail;
      rtb_AND3 = true;
      rudder2HydraulicModeHasPriority = true;
      rtb_AND2 = ((!rtb_AND2) && (!A380PrimComputerFctl_U.in.general_logic.is_green_hydraulic_power_avail) && (!rtb_AND4)
                  && ((rtb_y_kp == 0U) || (!rtb_y_ep)) && rtb_rudder2HydraulicModeEngaged);
    } else {
      rudder1HydraulicModeHasPriority = false;
      rtb_AND3 = false;
      rudder2HydraulicModeHasPriority = false;
      rtb_AND2 = false;
    }

    rtb_rudder2HydraulicModeEngaged = (rudder1HydraulicModeHasPriority && rudder2HydraulicModeHasPriority);
    rtb_AND2 = (rtb_AND3 && rtb_AND2);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word,
      &rtb_y_a);
    rudder2HydraulicModeHasPriority = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_c, &rtb_y_kp);
    rtb_AND4 = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_p, &rtb_y_kp);
    rtb_AND2_ac = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_n, &rtb_y_kp);
    rtb_AND1_l = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit_j, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word,
      &rtb_NOT_k);
    rtb_AND4_n = ((rtb_y_kp != 0U) && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit_i, &rtb_y_kp);
    rtb_AND6_m = ((rtb_y_kp != 0U) && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel6_bit_j, &rtb_y_kp);
    rtb_AND7 = ((rtb_y_kp != 0U) && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit_n, &rtb_y_kp);
    rtb_AND8 = ((rtb_y_kp != 0U) && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_n, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      &rtb_y_bi);
    rtb_AND13 = ((rtb_y_kp != 0U) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel9_bit_b, &rtb_y_kp);
    rtb_AND11 = ((rtb_y_kp != 0U) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel10_bit_h, &rtb_y_kp);
    rtb_AND10 = ((rtb_y_kp != 0U) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel11_bit, &rtb_y_kp);
    rtb_AND9 = ((rtb_y_kp != 0U) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel14_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word,
      &rtb_y_ep);
    rtb_y_bi = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel15_bit, &rtb_y_kp);
    rtb_AND16 = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel16_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word,
      &rtb_y_ep);
    rtb_AND17 = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel17_bit, &rtb_y_kp);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_AND4_d = (rtb_OR1_l || rtb_AND2_ac);
      rtb_NOT_k = (rtb_OR_jr || rtb_AND1_l);
      rtb_AND2_ac = (rtb_Equal || rtb_AND4_n);
      rtb_AND1_l = (rtb_OR_o || rtb_AND6_m);
      rudder2HydraulicModeHasPriority = (rudder2HydraulicModeHasPriority || rtb_AND7);
      rtb_AND4 = (rtb_AND4 || rtb_AND8);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM ==
          static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM == static_cast<
          uint32_T>(SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data;
      }
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_AND4_d = (rtb_Equal || rudder2HydraulicModeHasPriority);
      rtb_NOT_k = (rtb_OR_o || rtb_AND4);
      rtb_AND2_ac = (rtb_AND2_ac || rtb_AND4_n);
      rtb_AND1_l = (rtb_AND1_l || rtb_AND6_m);
      rudder2HydraulicModeHasPriority = (rtb_OR1_l || rtb_AND7);
      rtb_AND4 = (rtb_OR_jr || rtb_AND8);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.SSM ==
          static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.SSM ==
          static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_2_position_deg.Data;
      }

      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_AND4_d = (rudder2HydraulicModeHasPriority || rtb_AND7);
      rtb_NOT_k = (rtb_AND4 || rtb_AND8);
      rtb_AND2_ac = (rtb_OR1_l || rtb_AND2_ac);
      rtb_AND1_l = (rtb_OR_jr || rtb_AND1_l);
      rudder2HydraulicModeHasPriority = (rtb_AND4_n || rtb_Equal);
      rtb_AND4 = (rtb_AND6_m || rtb_OR_o);
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.SSM ==
          static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.SSM ==
          static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.right_aileron_2_position_deg.Data;
      }

      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg;
    } else {
      rtb_AND4_d = false;
      rtb_NOT_k = false;
      rtb_AND2_ac = false;
      rtb_AND1_l = false;
      rudder2HydraulicModeHasPriority = false;
      rtb_AND4 = false;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg = 0.0;
    }

    rtb_AND6_m = (rtb_AND4_d || (rtb_AND13 || rtb_y_bi));
    rtb_AND11 = (rtb_NOT_k || (rtb_AND11 || rtb_AND16));
    rtb_AND10 = (rtb_AND2_ac || (rtb_AND10 || rtb_AND17));
    rtb_AND9 = (rtb_AND1_l || (rtb_AND9 || ((rtb_y_kp != 0U) && rtb_y_ep)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      &rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_g, &rtb_y_kp);
    rtb_y_btf = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_pc, &rtb_y_kp);
    rtb_AND13 = (rtb_y_bi && (rtb_y_btf || (rtb_y_kp != 0U)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      &rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_i, &rtb_y_kp);
    rtb_y_ep = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_n, &rtb_y_kp);
    rtb_AND17 = (rtb_y_bi && (rtb_y_ep || (rtb_y_kp != 0U)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word,
      &rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_nd, &rtb_y_kp);
    rtb_y_ep = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_d, &rtb_y_kp);
    rtb_AND4_n = (rtb_y_bi && (rtb_y_ep || (rtb_y_kp != 0U)));
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_l, &rtb_y_kp);
    rtb_y_ep = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel9_bit_g, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word,
      &rtb_NOT_k);
    rtb_AND7 = ((rtb_y_ep || (rtb_y_kp != 0U)) && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel10_bit_j, &rtb_y_kp);
    rtb_y_a = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel11_bit_j, &rtb_y_kp);
    rtb_AND8 = ((rtb_y_a || (rtb_y_kp != 0U)) && rtb_NOT_k);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel14_bit_p, &rtb_y_kp);
    rtb_y_a = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel15_bit_i, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word,
      &rtb_y_bi);
    rtb_AND16 = ((rtb_y_a || (rtb_y_kp != 0U)) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel12_bit, &rtb_y_kp);
    rtb_y_a = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel13_bit, &rtb_y_kp);
    rtb_y_bi = ((rtb_y_a || (rtb_y_kp != 0U)) && rtb_y_bi);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_4_engaged = (rtb_AND16 ||
        rtb_y_bi);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_5_engaged = (rtb_AND7 || rtb_AND8);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_6_engaged =
        (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
         rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_4_engaged = (rtb_AND16 ||
        rtb_y_bi);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_5_engaged =
        (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
         rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_6_engaged = (rtb_AND7 || rtb_AND8);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_4_engaged =
        (rtb_leftSpoilerHydraulicModeEngaged || rtb_leftSpoilerElectricModeEngaged ||
         rtb_rightSpoilerHydraulicModeEngaged || rtb_rightSpoilerElectricModeEngaged);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_5_engaged = (rtb_AND16 ||
        rtb_y_bi);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_6_engaged = (rtb_AND7 || rtb_AND8);
    } else {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_4_engaged = false;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_5_engaged = false;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_6_engaged = false;
    }

    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      &rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_l, &rtb_y_kp);
    rtb_y_a = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_f, &rtb_y_kp);
    rtb_AND7 = (rtb_y_bi && (rtb_y_a || (rtb_y_kp != 0U)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      &rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_p, &rtb_y_kp);
    rtb_y_ep = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_b, &rtb_y_kp);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.right_spoiler_position_deg.Data;
    } else {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_4_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_4_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_5_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_5_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_6_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_6_deg = 0.0;
    }

    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_8_engaged = (rtb_y_bi && (rtb_y_ep ||
      (rtb_y_kp != 0U)));
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel16_bit_b, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word,
      &rtb_y_ep);
    rtb_AND8 = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel17_bit_i, &rtb_y_kp);
    rtb_AND15_l = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel18_bit, &rtb_y_kp);
    rtb_AND16 = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel19_bit, &rtb_y_kp);
    rtb_AND12 = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel20_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
      &rtb_y_ep);
    rtb_AND16_n = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel21_bit, &rtb_y_kp);
    rtb_AND18_c = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel22_bit, &rtb_y_kp);
    rtb_AND19 = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_status_word,
       A380PrimComputerFctl_P.BitfromLabel23_bit, &rtb_y_kp);
    rtb_y_btf = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_lr, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      &rtb_y_a);
    rtb_AND2_ac = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_g, &rtb_y_kp);
    rtb_AND3_h = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_k, &rtb_y_kp);
    rtb_NOT_k = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit_n, &rtb_y_kp);
    rtb_AND1_l = ((rtb_y_kp != 0U) && rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit_e, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      &rtb_y_ep);
    rtb_AND4_d = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel6_bit_b, &rtb_y_kp);
    rtb_AND6_b = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit_p, &rtb_y_kp);
    rtb_y_ep = ((rtb_y_kp != 0U) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_d, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      &rtb_y_bi);
    rtb_AND11_m = ((rtb_y_kp != 0U) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel9_bit_e, &rtb_y_kp);
    rtb_y_a = ((rtb_y_kp != 0U) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel11_bit_n, &rtb_y_kp);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      leftInboardElevEngaged = (rtb_AND_e || rtb_AND16_n);
      rtb_AND19 = (rtb_AND18_c || rtb_AND16);
      rtb_AND15_l = (elevator1Avail || rtb_AND15_l);
      rtb_AND16_n = (rtb_AND8 || rtb_y_g);
      rtb_AND12 = (rtb_thsEngaged || rtb_y_btf);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data;
      }

      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_3_pos_deg;
      rtb_Switch1 = A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      leftInboardElevEngaged = (rtb_AND16_n || rtb_AND15_l);
      rtb_AND19 = (rtb_y_g || rtb_AND18_c);
      rtb_AND15_l = (rtb_AND_e || rtb_AND8);
      rtb_AND16_n = (elevator1Avail || rtb_AND16);
      rtb_AND12 = (rtb_AND12 || rtb_y_btf);
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_2_position_deg.Data;
      }

      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_3_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        rtb_Switch1 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.ths_position_deg.Data;
      } else {
        rtb_Switch1 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.ths_position_deg.Data;
      }
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      leftInboardElevEngaged = (elevator1Avail || rtb_AND15_l);
      rtb_AND19 = (rtb_AND_e || rtb_AND19);
      rtb_AND15_l = (rtb_AND8 || rtb_AND18_c);
      rtb_AND16_n = (rtb_AND16_n || rtb_AND16);
      rtb_AND12 = (rtb_thsEngaged || rtb_AND12);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.elevator_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.elevator_3_position_deg.Data;
      }

      rtb_Switch1 = A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg;
    } else {
      leftInboardElevEngaged = false;
      rtb_AND19 = false;
      rtb_AND15_l = false;
      rtb_AND16_n = false;
      rtb_AND12 = false;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg = 0.0;
      rtb_Switch1 = 0.0;
    }

    rtb_AND8 = (leftInboardElevEngaged || (rtb_AND11_m || rtb_AND3_h));
    rtb_AND16 = (rtb_AND19 || (rtb_y_a || rtb_y_ep));
    rtb_AND2_ac = (rtb_AND15_l || (rtb_AND2_ac || rtb_AND6_b));
    rtb_AND6_b = (rtb_AND16_n || (rtb_AND4_d || rtb_NOT_k));
    rtb_AND12 = (rtb_AND12 || (((rtb_y_kp != 0U) && rtb_y_bi) || rtb_AND1_l));
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel38_bit, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel39_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      &rtb_y_bi);
    rtb_AND4_d = ((rtb_NOT_k || (rtb_y_kp != 0U)) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel32_bit, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel33_bit, &rtb_y_kp);
    rtb_y_a = ((rtb_NOT_k || (rtb_y_kp != 0U)) && rtb_y_bi);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel36_bit, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel37_bit, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_status_word,
      &rtb_y_ep);
    rtb_AND16_n = ((rtb_NOT_k || (rtb_y_kp != 0U)) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_m, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit_b, &rtb_y_kp);
    rtb_AND3_h = (rtb_NOT_k || (rtb_y_kp != 0U));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      &rtb_y_btf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_pt, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_h, &rtb_y_kp);
    rtb_y_bi = (rtb_NOT_k || (rtb_y_kp != 0U));
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit_d, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel6_bit_p, &rtb_y_kp);
    rtb_AND15_l = (rtb_NOT_k || (rtb_y_kp != 0U));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word,
      &rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit_g, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_i, &rtb_y_kp);
    rtb_AND1_l = (rtb_NOT_k || (rtb_y_kp != 0U));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      &rtb_NOT_k);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_AND4_d = (rtb_AND_n || rtb_AND6 || rtb_AND4_d);
      rtb_y_a = (rtb_rudder2HydraulicModeEngaged || rtb_AND2 || rtb_AND16_n);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.rudder_2_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_AND4_d = (rtb_AND_n || rtb_AND6 || rtb_AND4_d);
      rtb_y_a = (rtb_y_a || rtb_AND16_n);
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_2_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data;
      }
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_AND4_d = (rtb_AND4_d || rtb_AND16_n);
      rtb_y_a = (rtb_AND_n || rtb_AND6 || rtb_y_a);
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.rudder_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.rudder_1_position_deg.Data;
      }

      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg =
        A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg;
    } else {
      rtb_AND4_d = false;
      rtb_y_a = false;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg = 0.0;
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg = 0.0;
    }

    rtb_AND3_h = (rtb_AND4_d || (rtb_AND3_h && rtb_y_btf) || (rtb_AND15_l && rtb_y_ep));
    rtb_AND15_l = (rtb_y_a || (rtb_y_bi && rtb_y_btf) || (rtb_AND1_l && rtb_NOT_k));
    A380PrimComputerFctl_MATLABFunction_n(A380PrimComputerFctl_U.in.data.sim_data.slew_on,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.ConfirmNode_isRisingEdge,
      A380PrimComputerFctl_P.ConfirmNode_timeDelay, &rtb_y_ep, &A380PrimComputerFctl_DWork.sf_MATLABFunction_nb);
    rtb_AND16_n = ((!rtb_y_ep) && (!A380PrimComputerFctl_U.in.general_logic.on_ground) &&
                   (((!A380PrimComputerFctl_U.in.general_logic.triple_adr_failure) &&
                     ((A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach > 0.96) ||
                      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach < 0.1) ||
                      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg < -10.0) ||
                      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg > 37.5) ||
                      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn > 420.0) ||
                      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn < 70.0))) ||
                    ((!A380PrimComputerFctl_U.in.general_logic.triple_ir_failure) &&
                     ((!A380PrimComputerFctl_U.in.general_logic.double_ir_failure) ||
                      (!A380PrimComputerFctl_U.in.general_logic.ir_failure_not_self_detected)) && ((std::abs
      (A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg) > 120.0) ||
      ((A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg > 50.0) ||
       (A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg < -30.0))))));
    A380PrimComputerFctl_DWork.abnormalConditionWasActive = (rtb_AND16_n ||
      ((!A380PrimComputerFctl_U.in.general_logic.on_ground) && A380PrimComputerFctl_DWork.abnormalConditionWasActive));
    nz = ((rtb_AND8 + rtb_AND16) + rtb_AND2_ac) + rtb_AND6_b;
    b_x[0] = rtb_AND6_m;
    b_x[1] = rtb_AND11;
    b_x[2] = rtb_AND10;
    b_x[3] = rtb_AND9;
    b_x[4] = rudder2HydraulicModeHasPriority;
    b_x[5] = rtb_AND4;
    b_nz = rtb_AND6_m;
    for (prim3LawCap = 0; prim3LawCap < 5; prim3LawCap++) {
      b_nz += b_x[prim3LawCap + 1];
    }

    if (A380PrimComputerFctl_U.in.general_logic.triple_adr_failure || rtb_AND16_n) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::DirectLaw;
      rtb_lateralLawCapability = a380_lateral_efcs_law::DirectLaw;
    } else if (A380PrimComputerFctl_U.in.general_logic.double_lgciu_failure) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw2;
      rtb_lateralLawCapability = a380_lateral_efcs_law::DirectLaw;
    } else {
      if ((nz == 2) || A380PrimComputerFctl_U.in.general_logic.double_adr_failure ||
          A380PrimComputerFctl_U.in.general_logic.double_ir_failure) {
        rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1B;
      } else if (A380PrimComputerFctl_DWork.abnormalConditionWasActive || ((rtb_AND3_h && (!rtb_AND15_l)) ||
                  ((!rtb_AND3_h) && rtb_AND15_l)) || (nz == 3) || (b_nz == 4) ||
                 A380PrimComputerFctl_U.in.general_logic.slats_locked ||
                 A380PrimComputerFctl_U.in.general_logic.flaps_locked ||
                 A380PrimComputerFctl_U.in.general_logic.all_sfcc_lost ||
                 (A380PrimComputerFctl_U.in.general_logic.all_ra_failure &&
                  A380PrimComputerFctl_U.in.general_logic.landing_gear_down &&
                  ((!A380PrimComputerFctl_U.in.fg_logic.ap_1_engaged) &&
                   (!A380PrimComputerFctl_U.in.fg_logic.ap_2_engaged))) || (!rtb_AND12)) {
        rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1A;
      } else {
        rtb_pitchLawCapability = a380_pitch_efcs_law::NormalLaw;
      }

      rtb_lateralLawCapability = a380_lateral_efcs_law::NormalLaw;
    }

    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_c, &rtb_y_kp);
    rtb_y_bi = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_o, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_hn, &rtb_y_kp);
    rtb_AND1_l = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel6_bit_h, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
      &rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_g(rtb_y_bi, rtb_NOT_k, rtb_AND1_l, rtb_y_ep, &rtb_law_p);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel3_bit_b, &rtb_y_kp);
    rtb_y_bi = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_g, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_j, &rtb_y_kp);
    rtb_AND1_l = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel7_bit_o, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.fctl_law_status_word,
      &rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction_g(rtb_y_bi, rtb_NOT_k, rtb_AND1_l, rtb_y_ep, &rtb_law);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      nz = static_cast<int32_T>(rtb_pitchLawCapability);
      b_nz = static_cast<int32_T>(rtb_law_p);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      nz = static_cast<int32_T>(rtb_law_p);
      b_nz = static_cast<int32_T>(rtb_pitchLawCapability);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else {
      nz = static_cast<int32_T>(rtb_law_p);
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

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_AND18_c = (iindx == 1);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_AND18_c = (iindx == 2);
    } else {
      rtb_AND18_c = (iindx == 3);
    }

    if (!rtb_AND18_c) {
      rtb_law_p = a380_pitch_efcs_law::None;
      rtb_activeLateralLaw = a380_lateral_efcs_law::None;
    } else {
      rtb_law_p = rtb_pitchLawCapability;
      rtb_activeLateralLaw = rtb_lateralLawCapability;
    }

    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.data.discrete_inputs.capt_priority_takeover_pressed,
      A380PrimComputerFctl_P.PulseNode_isRisingEdge, &rtb_y_bi, &A380PrimComputerFctl_DWork.sf_MATLABFunction_g4);
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.data.discrete_inputs.fo_priority_takeover_pressed,
      A380PrimComputerFctl_P.PulseNode1_isRisingEdge, &rtb_y_ep, &A380PrimComputerFctl_DWork.sf_MATLABFunction_nu);
    if (rtb_y_bi) {
      A380PrimComputerFctl_DWork.pRightStickDisabled = true;
      A380PrimComputerFctl_DWork.pLeftStickDisabled = false;
    } else if (rtb_y_ep) {
      A380PrimComputerFctl_DWork.pLeftStickDisabled = true;
      A380PrimComputerFctl_DWork.pRightStickDisabled = false;
    }

    if (A380PrimComputerFctl_DWork.pRightStickDisabled &&
        ((!A380PrimComputerFctl_U.in.data.discrete_inputs.capt_priority_takeover_pressed) &&
         (!A380PrimComputerFctl_DWork.Delay1_DSTATE))) {
      A380PrimComputerFctl_DWork.pRightStickDisabled = false;
    } else if (A380PrimComputerFctl_DWork.pLeftStickDisabled) {
      A380PrimComputerFctl_DWork.pLeftStickDisabled =
        (A380PrimComputerFctl_U.in.data.discrete_inputs.fo_priority_takeover_pressed ||
         A380PrimComputerFctl_DWork.Delay_DSTATE_c);
    }

    A380PrimComputerFctl_MATLABFunction_n((A380PrimComputerFctl_DWork.pLeftStickDisabled &&
      (A380PrimComputerFctl_U.in.data.discrete_inputs.fo_priority_takeover_pressed ||
       A380PrimComputerFctl_DWork.Delay_DSTATE_c)), A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.ConfirmNode1_isRisingEdge, A380PrimComputerFctl_P.ConfirmNode1_timeDelay, &rtb_AND1_l,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_j2);
    A380PrimComputerFctl_MATLABFunction_n((A380PrimComputerFctl_DWork.pRightStickDisabled &&
      (A380PrimComputerFctl_U.in.data.discrete_inputs.capt_priority_takeover_pressed ||
       A380PrimComputerFctl_DWork.Delay1_DSTATE)), A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.ConfirmNode_isRisingEdge_j, A380PrimComputerFctl_P.ConfirmNode_timeDelay_a, &rtb_AND4_d,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_g2);
    if (!A380PrimComputerFctl_DWork.pRightStickDisabled) {
      rtb_Gain_p = A380PrimComputerFctl_U.in.data.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant_Value_p;
    }

    if (A380PrimComputerFctl_DWork.pLeftStickDisabled) {
      rtb_Y_k = A380PrimComputerFctl_P.Constant_Value_p;
    } else {
      rtb_Y_k = A380PrimComputerFctl_U.in.data.analog_inputs.capt_pitch_stick_pos;
    }

    rtb_left_spoiler_3_deg = rtb_Gain_p + rtb_Y_k;
    if (rtb_left_spoiler_3_deg > A380PrimComputerFctl_P.Saturation_UpperSat_d) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation_UpperSat_d;
    } else if (rtb_left_spoiler_3_deg < A380PrimComputerFctl_P.Saturation_LowerSat_h) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation_LowerSat_h;
    }

    if (!A380PrimComputerFctl_DWork.pRightStickDisabled) {
      rtb_Gain_p = A380PrimComputerFctl_U.in.data.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant1_Value_p;
    }

    if (A380PrimComputerFctl_DWork.pLeftStickDisabled) {
      rtb_Y_k = A380PrimComputerFctl_P.Constant1_Value_p;
    } else {
      rtb_Y_k = A380PrimComputerFctl_U.in.data.analog_inputs.capt_roll_stick_pos;
    }

    rtb_right_spoiler_2_deg = rtb_Gain_p + rtb_Y_k;
    if (rtb_right_spoiler_2_deg > A380PrimComputerFctl_P.Saturation1_UpperSat) {
      rtb_right_spoiler_2_deg = A380PrimComputerFctl_P.Saturation1_UpperSat;
    } else if (rtb_right_spoiler_2_deg < A380PrimComputerFctl_P.Saturation1_LowerSat) {
      rtb_right_spoiler_2_deg = A380PrimComputerFctl_P.Saturation1_LowerSat;
    }

    A380PrimComputerFctl_RateLimiter_l(look2_binlxpw(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      static_cast<real_T>(A380PrimComputerFctl_U.in.general_logic.flap_handle_index),
      A380PrimComputerFctl_P.alphamax_bp01Data, A380PrimComputerFctl_P.alphamax_bp02Data,
      A380PrimComputerFctl_P.alphamax_tableData, A380PrimComputerFctl_P.alphamax_maxIndex, 4U),
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs_up, A380PrimComputerFctl_P.RateLimiterGenericVariableTs_lo,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.reset_Value, &rtb_handleIndex,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ne);
    if (!A380PrimComputerFctl_DWork.eventTime_not_empty_m) {
      A380PrimComputerFctl_DWork.eventTime_f = A380PrimComputerFctl_U.in.data.time.simulation_time;
      A380PrimComputerFctl_DWork.eventTime_not_empty_m = true;
    }

    if (A380PrimComputerFctl_U.in.general_logic.on_ground || (A380PrimComputerFctl_DWork.eventTime_f == 0.0)) {
      A380PrimComputerFctl_DWork.eventTime_f = A380PrimComputerFctl_U.in.data.time.simulation_time;
    }

    A380PrimComputerFctl_RateLimiter_l(look2_binlxpw(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      static_cast<real_T>(A380PrimComputerFctl_U.in.general_logic.flap_handle_index),
      A380PrimComputerFctl_P.alphaprotection_bp01Data, A380PrimComputerFctl_P.alphaprotection_bp02Data,
      A380PrimComputerFctl_P.alphaprotection_tableData, A380PrimComputerFctl_P.alphaprotection_maxIndex, 4U),
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_up, A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.reset_Value_j, &rtb_Gain_cu,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_mr);
    if (A380PrimComputerFctl_U.in.data.time.simulation_time - A380PrimComputerFctl_DWork.eventTime_f <=
        A380PrimComputerFctl_P.CompareToConstant_const) {
      rtb_Sum6 = rtb_handleIndex;
    } else {
      rtb_Sum6 = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_l(look1_binlxpw(static_cast<real_T>
      (A380PrimComputerFctl_U.in.general_logic.flap_handle_index), A380PrimComputerFctl_P.alpha0_bp01Data,
      A380PrimComputerFctl_P.alpha0_tableData, 5U), A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.reset_Value_jz, &rtb_Y, &A380PrimComputerFctl_DWork.sf_RateLimiter_b4);
    A380PrimComputerFctl_CalculateV_alpha_max(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg, rtb_Y, rtb_Gain_cu,
      &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.v_alpha_prot_kn);
    A380PrimComputerFctl_CalculateV_alpha_max(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg, rtb_Y, rtb_handleIndex,
      &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.v_alpha_max_kn);
    A380PrimComputerFctl_RateLimiter_l(look2_binlxpw(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      static_cast<real_T>(A380PrimComputerFctl_U.in.general_logic.flap_handle_index),
      A380PrimComputerFctl_P.alphastallwarnmax_bp01Data, A380PrimComputerFctl_P.alphastallwarnmax_bp02Data,
      A380PrimComputerFctl_P.alphastallwarnmax_tableData, A380PrimComputerFctl_P.alphastallwarnmax_maxIndex, 4U),
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_up, A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_lo,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.reset_Value_g, &rtb_Gain_cu,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_lf);
    A380PrimComputerFctl_CalculateV_alpha_max(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg, rtb_Y, rtb_Gain_cu,
      &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.v_alpha_stall_warn_kn);
    A380PrimComputerFctl_GetIASforMach4(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      A380PrimComputerFctl_P.Constant6_Value_b, A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      &rtb_Gain_cu);
    rtb_Y_k = std::fmin(A380PrimComputerFctl_P.Constant5_Value_k, rtb_Gain_cu);
    A380PrimComputerFctl_GetIASforMach4(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      A380PrimComputerFctl_P.Constant8_Value_h, A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      &rtb_Gain_cu);
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_speed_prot_hi_thresh_kn = std::fmin
      (A380PrimComputerFctl_P.Constant7_Value_g, rtb_Gain_cu);
    rtb_Switch_nb = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg - std::cos
      (A380PrimComputerFctl_P.Gain1_Gain_d * A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg) *
      A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg;
    rtb_y_bi = ((rtb_law_p == a380_pitch_efcs_law::NormalLaw) || (rtb_activeLateralLaw == a380_lateral_efcs_law::
      NormalLaw));
    rtb_y_ep = ((!A380PrimComputerFctl_U.in.fg_logic.ap_1_engaged) && (!A380PrimComputerFctl_U.in.fg_logic.ap_2_engaged));
    if (rtb_y_ep && (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn > std::fmin(look1_binlxpw
          (rtb_Switch_nb, A380PrimComputerFctl_P.uDLookupTable1_bp01Data,
           A380PrimComputerFctl_P.uDLookupTable1_tableData, 3U),
          A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn /
          A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach * look1_binlxpw(rtb_Switch_nb,
           A380PrimComputerFctl_P.uDLookupTable2_bp01Data, A380PrimComputerFctl_P.uDLookupTable2_tableData, 3U)))) {
      A380PrimComputerFctl_DWork.sProtActive = (rtb_y_bi || A380PrimComputerFctl_DWork.sProtActive);
    }

    A380PrimComputerFctl_DWork.sProtActive = ((A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn >=
      rtb_Y_k) && rtb_y_ep && rtb_y_bi && A380PrimComputerFctl_DWork.sProtActive);
    if (!A380PrimComputerFctl_DWork.resetEventTime_not_empty) {
      A380PrimComputerFctl_DWork.resetEventTime = A380PrimComputerFctl_U.in.data.time.simulation_time;
      A380PrimComputerFctl_DWork.resetEventTime_not_empty = true;
    }

    if ((rtb_left_spoiler_3_deg >= -0.03125) || (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg >=
         rtb_handleIndex) || (A380PrimComputerFctl_DWork.resetEventTime == 0.0)) {
      A380PrimComputerFctl_DWork.resetEventTime = A380PrimComputerFctl_U.in.data.time.simulation_time;
    }

    A380PrimComputerFctl_DWork.sProtActive_g = (((!A380PrimComputerFctl_U.in.general_logic.on_ground) && rtb_y_bi &&
      ((!A380PrimComputerFctl_U.in.fg_logic.ap_1_engaged) && (!A380PrimComputerFctl_U.in.fg_logic.ap_2_engaged)) &&
      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg > rtb_Sum6) &&
      (A380PrimComputerFctl_U.in.data.time.monotonic_time > 10.0)) || A380PrimComputerFctl_DWork.sProtActive_g);
    A380PrimComputerFctl_DWork.sProtActive_g = ((A380PrimComputerFctl_U.in.data.time.simulation_time -
      A380PrimComputerFctl_DWork.resetEventTime <= 0.5) && (rtb_left_spoiler_3_deg >= -0.5) &&
      ((A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft >= 200.0) || (rtb_left_spoiler_3_deg >= 0.5) ||
       (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg >= rtb_Sum6 - 2.0)) &&
      (!A380PrimComputerFctl_U.in.general_logic.on_ground) && rtb_y_bi && A380PrimComputerFctl_DWork.sProtActive_g);
    if (A380PrimComputerFctl_DWork.is_active_c28_A380PrimComputerFctl == 0) {
      A380PrimComputerFctl_DWork.is_active_c28_A380PrimComputerFctl = 1U;
      A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Landed;
      nz = 0;
    } else {
      switch (A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl) {
       case A380PrimComputerFctl_IN_Flying:
        if (A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft < 100.0) {
          A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Landing100ft;
          nz = 1;
        } else if (A380PrimComputerFctl_U.in.general_logic.on_ground) {
          A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Landed;
          nz = 0;
        } else {
          nz = 0;
        }
        break;

       case A380PrimComputerFctl_IN_Landed:
        if (!A380PrimComputerFctl_U.in.general_logic.on_ground) {
          A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Takeoff100ft;
          nz = 0;
        } else {
          nz = 0;
        }
        break;

       case A380PrimComputerFctl_IN_Landing100ft:
        if (A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft > 100.0) {
          A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Flying;
          nz = 0;
        } else if (A380PrimComputerFctl_U.in.general_logic.on_ground) {
          A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Landed;
          nz = 0;
        } else {
          nz = 1;
        }
        break;

       default:
        if (A380PrimComputerFctl_U.in.general_logic.on_ground) {
          A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Landed;
          nz = 0;
        } else if (A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft > 100.0) {
          A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_Flying;
          nz = 0;
        } else {
          nz = 0;
        }
        break;
      }
    }

    if (!A380PrimComputerFctl_DWork.eventTime_not_empty) {
      A380PrimComputerFctl_DWork.eventTime = A380PrimComputerFctl_U.in.data.time.simulation_time;
      A380PrimComputerFctl_DWork.eventTime_not_empty = true;
    }

    if ((A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn <= std::fmin(365.0,
          A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn /
          A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach * (look1_binlxpw(rtb_Switch_nb,
            A380PrimComputerFctl_P.uDLookupTable_bp01Data_m, A380PrimComputerFctl_P.uDLookupTable_tableData_n, 3U) +
           0.01))) || ((rtb_law_p != a380_pitch_efcs_law::NormalLaw) && (rtb_activeLateralLaw != a380_lateral_efcs_law::
          NormalLaw)) || (A380PrimComputerFctl_DWork.eventTime == 0.0)) {
      A380PrimComputerFctl_DWork.eventTime = A380PrimComputerFctl_U.in.data.time.simulation_time;
    }

    rtb_NOT_k = (((!A380PrimComputerFctl_U.in.general_logic.on_ground) && (((nz != 0) &&
      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg > rtb_handleIndex)) ||
      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg > rtb_Sum6 + 0.25)) && rtb_y_bi) ||
                 (A380PrimComputerFctl_U.in.data.time.simulation_time - A380PrimComputerFctl_DWork.eventTime > 3.0) ||
                 A380PrimComputerFctl_DWork.sProtActive || A380PrimComputerFctl_DWork.sProtActive_g);
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ap_authorised = ((std::abs(rtb_left_spoiler_3_deg) <= 0.5) &&
      (std::abs(rtb_right_spoiler_2_deg) <= 0.5) && ((std::abs
      (A380PrimComputerFctl_U.in.data.analog_inputs.rudder_pedal_pos) <= 0.4) &&
      ((A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg <= 25.0) &&
       (A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg >= -13.0) && (std::abs
      (A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg) <= 45.0) && (!rtb_NOT_k))));
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.protection_ap_disconnect = rtb_NOT_k;
    rtb_NOT_k = (A380PrimComputerFctl_P.Constant_Value_h || A380PrimComputerFctl_DWork.sProtActive_g ||
                 ((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos >=
                   A380PrimComputerFctl_P.CompareToConstant3_const) ||
                  (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos >=
                   A380PrimComputerFctl_P.CompareToConstant4_const) ||
                  (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos >=
                   A380PrimComputerFctl_P.CompareToConstant1_const) ||
                  (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_4_pos >=
                   A380PrimComputerFctl_P.CompareToConstant2_const)));
    A380PrimComputerFctl_MATLABFunction_n((A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos <
      A380PrimComputerFctl_P.CompareToConstant_const_n), A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.ConfirmNode_isRisingEdge_c, A380PrimComputerFctl_P.ConfirmNode_timeDelay_g, &rtb_y_ep,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_al4);
    A380PrimComputerFctl_DWork.Memory_PreviousInput = A380PrimComputerFctl_P.Logic_table[(((static_cast<uint32_T>
      (rtb_NOT_k) << 1) + rtb_y_ep) << 1) + A380PrimComputerFctl_DWork.Memory_PreviousInput];
    rtb_NOT_k = (rtb_NOT_k || A380PrimComputerFctl_DWork.Memory_PreviousInput);
    if (rtb_NOT_k) {
      rtb_Switch_nb = A380PrimComputerFctl_P.Constant1_Value_b;
    } else {
      rtb_Switch_nb = look1_binlxpw(A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos,
        A380PrimComputerFctl_P.uDLookupTable_bp01Data, A380PrimComputerFctl_P.uDLookupTable_tableData, 4U);
    }

    A380PrimComputerFctl_RateLimiter_d(rtb_Switch_nb, A380PrimComputerFctl_P.RateLimiterGenericVariableTs24_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs24_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs24_InitialCondition, A380PrimComputerFctl_P.reset_Value_f,
      &rtb_Gain_cu, &A380PrimComputerFctl_DWork.sf_RateLimiter_nd);
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.speed_brake_inhibited = rtb_NOT_k;
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode7_isRisingEdge, &rtb_y_bi, &A380PrimComputerFctl_DWork.sf_MATLABFunction_ny);
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode6_isRisingEdge, &rtb_y_ep, &A380PrimComputerFctl_DWork.sf_MATLABFunction_gc);
    A380PrimComputerFctl_DWork.Memory_PreviousInput_a = A380PrimComputerFctl_P.Logic_table_h[(((static_cast<uint32_T>
      (rtb_y_bi || (((A380PrimComputerFctl_U.in.data.analog_inputs.left_body_wheel_speed <
                      A380PrimComputerFctl_P.CompareToConstant13_const) ||
                     (A380PrimComputerFctl_U.in.data.analog_inputs.left_wing_wheel_speed <
                      A380PrimComputerFctl_P.CompareToConstant9_const)) &&
                    ((A380PrimComputerFctl_U.in.data.analog_inputs.right_body_wheel_speed <
                      A380PrimComputerFctl_P.CompareToConstant10_const) ||
                     (A380PrimComputerFctl_U.in.data.analog_inputs.right_wing_wheel_speed <
                      A380PrimComputerFctl_P.CompareToConstant14_const)))) << 1) + rtb_y_ep) << 1) +
      A380PrimComputerFctl_DWork.Memory_PreviousInput_a];
    rtb_NOT_k = (A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos <
                 A380PrimComputerFctl_P.CompareToConstant_const_m);
    rtb_y_a = ((((A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos >
                  A380PrimComputerFctl_P.CompareToConstant26_const) || rtb_NOT_k) &&
                ((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos <
                  A380PrimComputerFctl_P.CompareToConstant11_const) &&
                 (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <
                  A380PrimComputerFctl_P.CompareToConstant27_const) &&
                 (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos <
                  A380PrimComputerFctl_P.CompareToConstant5_const) &&
                 (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_4_pos <
                  A380PrimComputerFctl_P.CompareToConstant6_const))) ||
               (((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <
                  A380PrimComputerFctl_P.CompareToConstant12_const) ||
                 (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos <
                  A380PrimComputerFctl_P.CompareToConstant15_const)) && (static_cast<int32_T>(((static_cast<uint32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos <= A380PrimComputerFctl_P.CompareToConstant29_const)
      + (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <=
         A380PrimComputerFctl_P.CompareToConstant16_const)) +
      (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos <= A380PrimComputerFctl_P.CompareToConstant17_const))
      + (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_4_pos <=
         A380PrimComputerFctl_P.CompareToConstant18_const)) >= A380PrimComputerFctl_P.CompareToConstant19_const)));
    A380PrimComputerFctl_MATLABFunction_f(false, A380PrimComputerFctl_P.PulseNode5_isRisingEdge, &rtb_y_bi,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_m1);
    rtb_y_btf = (A380PrimComputerFctl_U.in.data.analog_inputs.right_wing_wheel_speed >=
                 A380PrimComputerFctl_P.CompareToConstant4_const_k);
    rtb_y_ep = (((A380PrimComputerFctl_U.in.data.analog_inputs.left_body_wheel_speed >=
                  A380PrimComputerFctl_P.CompareToConstant7_const) ||
                 (A380PrimComputerFctl_U.in.data.analog_inputs.left_wing_wheel_speed >=
                  A380PrimComputerFctl_P.CompareToConstant8_const)) &&
                ((A380PrimComputerFctl_U.in.data.analog_inputs.right_body_wheel_speed >=
                  A380PrimComputerFctl_P.CompareToConstant3_const_n) || rtb_y_btf) &&
                A380PrimComputerFctl_DWork.Memory_PreviousInput_a);
    A380PrimComputerFctl_DWork.Delay1_DSTATE_b = (rtb_y_a && (rtb_y_bi || rtb_y_ep ||
      A380PrimComputerFctl_DWork.Delay1_DSTATE_b));
    A380PrimComputerFctl_MATLABFunction_f(false, A380PrimComputerFctl_P.PulseNode4_isRisingEdge, &rtb_y_ep,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_ff);
    A380PrimComputerFctl_DWork.Delay2_DSTATE = (rtb_y_a && (rtb_y_ep || A380PrimComputerFctl_DWork.Delay2_DSTATE));
    A380PrimComputerFctl_DWork.Delay3_DSTATE = (rtb_NOT_k &&
      ((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos <=
        A380PrimComputerFctl_P.CompareToConstant1_const_a) &&
       (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <=
        A380PrimComputerFctl_P.CompareToConstant2_const_k)) && (rtb_y_bi || A380PrimComputerFctl_DWork.Delay3_DSTATE));
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.phased_lift_dumping_active =
      ((!A380PrimComputerFctl_DWork.Delay1_DSTATE_b) && (A380PrimComputerFctl_DWork.Delay2_DSTATE ||
        A380PrimComputerFctl_DWork.Delay3_DSTATE));
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_l, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_y_btf);
    rtb_y_ep = ((rtb_y_kp == 0U) && rtb_y_btf);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_cm, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_y_bi);
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.spoiler_lift_active =
      (A380PrimComputerFctl_U.in.general_logic.on_ground && (rtb_y_ep || ((rtb_y_kp == 0U) && rtb_y_bi)));
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ground_spoilers_armed = rtb_NOT_k;
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_e, &rtb_y_kp);
    rtb_y_ep = (rtb_y_kp == 0U);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_y_a);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_d, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_y_bi);
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.aileron_droop_active = ((rtb_y_ep && rtb_y_a) || ((rtb_y_kp == 0U)
      && rtb_y_bi));
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode1_isRisingEdge_n, &rtb_y_ep, &A380PrimComputerFctl_DWork.sf_MATLABFunction_ky);
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode2_isRisingEdge, &rtb_y_a, &A380PrimComputerFctl_DWork.sf_MATLABFunction_dmh);
    A380PrimComputerFctl_DWork.Memory_PreviousInput_d = A380PrimComputerFctl_P.Logic_table_j[(((static_cast<uint32_T>
      (rtb_y_ep) << 1) + (rtb_y_a || A380PrimComputerFctl_DWork.Delay_DSTATE_e)) << 1) +
      A380PrimComputerFctl_DWork.Memory_PreviousInput_d];
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_pt, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
      &rtb_y_ep);
    if ((rtb_y_kp != 0U) && rtb_y_ep) {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl.discrete_status_word_1;
    } else {
      rtb_Switch_i_0 = &A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl.discrete_status_word_1;
    }

    A380PrimComputerFctl_MATLABFunction_p(rtb_Switch_i_0, A380PrimComputerFctl_P.BitfromLabel3_bit_g, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction_c(rtb_Switch_i_0, &rtb_y_bi);
    if (rtb_AND18_c) {
      rtb_y_a = ((!A380PrimComputerFctl_U.in.general_logic.on_ground) && (rtb_law_p !=
                  A380PrimComputerFctl_P.EnumeratedConstant_Value_l));
    } else {
      rtb_y_a = ((rtb_y_kp != 0U) && rtb_y_bi);
    }

    A380PrimComputerFctl_DWork.Delay_DSTATE_e = A380PrimComputerFctl_P.Logic_table_n[(((rtb_y_a || (std::abs(rtb_Switch1)
      <= A380PrimComputerFctl_P.CompareToConstant1_const_p) ||
      A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_up_pressed ||
      A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_down_pressed) + (static_cast<uint32_T>
      ((A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn <=
        A380PrimComputerFctl_P.CompareToConstant_const_c) && A380PrimComputerFctl_DWork.Memory_PreviousInput_d) << 1)) <<
      1) + A380PrimComputerFctl_DWork.Memory_PreviousInput_j];
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_p, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_g, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_y_ep);
    rtb_y_bi = (((!rtb_NOT_k) || (rtb_y_kp == 0U)) && rtb_y_ep);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_y_btf);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel6_bit_l, &rtb_y_kp);
    rtb_NOT_k = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_a, &rtb_y_kp);
    if (rtb_y_bi || (rtb_y_btf && ((!rtb_NOT_k) || (rtb_y_kp == 0U)))) {
      rtb_Switch_nb = 0.25;
    } else {
      rtb_Switch_nb = 0.15;
    }

    if (A380PrimComputerFctl_DWork.Delay_DSTATE_e) {
      rtb_Switch_nb = A380PrimComputerFctl_P.Gain_Gain_g * rtb_Switch1;
      if (rtb_Switch_nb > A380PrimComputerFctl_P.Saturation_UpperSat) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_manual_mode_c_deg_s =
          A380PrimComputerFctl_P.Saturation_UpperSat;
      } else if (rtb_Switch_nb < A380PrimComputerFctl_P.Saturation_LowerSat) {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_manual_mode_c_deg_s =
          A380PrimComputerFctl_P.Saturation_LowerSat;
      } else {
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_manual_mode_c_deg_s = rtb_Switch_nb;
      }
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_down_pressed) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_manual_mode_c_deg_s = rtb_Switch_nb;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_up_pressed) {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_manual_mode_c_deg_s = -rtb_Switch_nb;
    } else {
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_manual_mode_c_deg_s = 0.0;
    }

    A380PrimComputerFctl_B.BusAssignment_nw.data.time = A380PrimComputerFctl_U.in.data.time;
    A380PrimComputerFctl_B.BusAssignment_nw.data.sim_data = A380PrimComputerFctl_U.in.data.sim_data;
    A380PrimComputerFctl_B.BusAssignment_nw.data.discrete_inputs = A380PrimComputerFctl_U.in.data.discrete_inputs;
    A380PrimComputerFctl_B.BusAssignment_nw.data.analog_inputs = A380PrimComputerFctl_U.in.data.analog_inputs;
    A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs = A380PrimComputerFctl_U.in.data.bus_inputs;
    A380PrimComputerFctl_B.BusAssignment_nw.data.adcn_inputs = A380PrimComputerFctl_U.in.data.adcn_inputs;
    A380PrimComputerFctl_B.BusAssignment_nw.general_logic = A380PrimComputerFctl_U.in.general_logic;
    A380PrimComputerFctl_B.BusAssignment_nw.flight_envelope = A380PrimComputerFctl_U.in.flight_envelope;
    A380PrimComputerFctl_B.BusAssignment_nw.laws = A380PrimComputerFctl_U.in.laws;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_inboard_aileron_engaged = rtb_AND6_m;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_inboard_aileron_engaged = rtb_AND11;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_midboard_aileron_engaged = rtb_AND10;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_midboard_aileron_engaged = rtb_AND9;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_outboard_aileron_engaged =
      rudder2HydraulicModeHasPriority;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_outboard_aileron_engaged = rtb_AND4;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_1_engaged = rtb_AND13;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_2_engaged = rtb_AND17;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_3_engaged = rtb_AND4_n;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_7_engaged = rtb_AND7;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_inboard_elevator_engaged = rtb_AND8;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_inboard_elevator_engaged = rtb_AND16;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_outboard_elevator_engaged = rtb_AND2_ac;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_outboard_elevator_engaged = rtb_AND6_b;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.ths_engaged = rtb_AND12;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.upper_rudder_engaged = rtb_AND3_h;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.lower_rudder_engaged = rtb_AND15_l;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_1_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_1_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_2_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_2_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_3_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_3_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_7_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_7_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_8_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_8_deg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.ths_deg = rtb_Switch1;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_law_capability = rtb_lateralLawCapability;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_lateral_law = rtb_activeLateralLaw;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_law_capability = rtb_pitchLawCapability;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law = rtb_law_p;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.abnormal_condition_law_active = rtb_AND16_n;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim = rtb_AND18_c;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.elevator_1_avail = elevator1Avail;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.elevator_1_engaged = elevator1Avail;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.elevator_2_avail = elevator2Avail;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.elevator_2_engaged = rtb_AND_e;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.elevator_3_avail = rtb_y_i0;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.elevator_3_engaged = rtb_y_g;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_avail = thsAvail;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_engaged = rtb_thsEngaged;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_aileron_1_avail = rtb_OR1_l;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_aileron_1_engaged = rtb_OR1_l;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_aileron_2_avail = rtb_OR1_h;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_aileron_2_engaged = rtb_Equal;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_aileron_1_avail = rtb_OR_jr;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_aileron_1_engaged = rtb_OR_jr;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_aileron_2_avail = rtb_OR_d;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_aileron_2_engaged = rtb_OR_o;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_spoiler_hydraulic_mode_avail = rtb_OR_a;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_spoiler_hydraulic_mode_engaged =
      rtb_leftSpoilerHydraulicModeEngaged;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_spoiler_electric_mode_engaged =
      rtb_leftSpoilerElectricModeEngaged;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_spoiler_hydraulic_mode_avail =
      rightSpoilerHydraulicModeAvail;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_spoiler_hydraulic_mode_engaged =
      rtb_rightSpoilerHydraulicModeEngaged;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_spoiler_electric_mode_engaged =
      rtb_rightSpoilerElectricModeEngaged;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_1_hydraulic_mode_avail = rudder1HydraulicModeAvail;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_1_electric_mode_avail = rudder1ElectricModeAvail;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_1_hydraulic_mode_engaged = rtb_AND_n;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_1_electric_mode_engaged = rtb_AND6;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_2_hydraulic_mode_avail = rudder1HydraulicModeHasPriority;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_2_electric_mode_avail = rtb_AND3;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_2_hydraulic_mode_engaged = rtb_rudder2HydraulicModeEngaged;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.rudder_2_electric_mode_engaged = rtb_AND2;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.aileron_antidroop_active =
      A380PrimComputerFctl_DWork.Delay1_DSTATE_b;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.eha_ebha_elec_mode_inhibited = rtb_OR_i;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_sidestick_disabled =
      A380PrimComputerFctl_DWork.pLeftStickDisabled;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_sidestick_disabled =
      A380PrimComputerFctl_DWork.pRightStickDisabled;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.left_sidestick_priority_locked = rtb_AND1_l;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.right_sidestick_priority_locked = rtb_AND4_d;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.total_sidestick_pitch_command = rtb_left_spoiler_3_deg;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.total_sidestick_roll_command = rtb_right_spoiler_2_deg;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.speed_brake_command_deg = rtb_Gain_cu;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ground_spoilers_out = A380PrimComputerFctl_DWork.Delay1_DSTATE_b;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_alpha_prot_active = A380PrimComputerFctl_DWork.sProtActive_g;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.alpha_prot_deg = rtb_Sum6;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.alpha_max_deg = rtb_handleIndex;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_speed_prot_active = A380PrimComputerFctl_DWork.sProtActive;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_speed_prot_lo_thresh_kn = rtb_Y_k;
    A380PrimComputerFctl_B.BusAssignment_nw.fg_logic = A380PrimComputerFctl_U.in.fg_logic;
    A380PrimComputerFctl_B.BusAssignment_nw.fg_mode_logic = A380PrimComputerFctl_U.in.fg_mode_logic;
    A380PrimComputerFctl_B.BusAssignment_nw.fg_laws = A380PrimComputerFctl_U.in.fg_laws;
    A380PrimComputerFctl_B.BusAssignment_nw.discrete_outputs = A380PrimComputerFctl_U.in.discrete_outputs;
    A380PrimComputerFctl_B.BusAssignment_nw.analog_outputs = A380PrimComputerFctl_U.in.analog_outputs;
    A380PrimComputerFctl_B.BusAssignment_nw.bus_outputs = A380PrimComputerFctl_U.in.bus_outputs;
    A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_automatic_mode_active = rtb_y_a;
    rtb_OR_i = (A380PrimComputerFctl_B.BusAssignment_nw.general_logic.tracking_mode_on || (static_cast<real_T>
      (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_lateral_law) !=
      A380PrimComputerFctl_P.CompareToConstant_const_e));
    rtb_Y_k = A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn * 0.5144;
    if (A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn >= 30.0) {
      rtb_Switch_nb = rtb_Y_k * rtb_Y_k * 0.6125 * 845.0 / (400000.0 * rtb_Y_k);
      rtb_Switch_nb = (A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.n_y_g * 9.81 -
                       (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg +
                        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg) /
                       2.0 * 3.1415926535897931 / 180.0 * (rtb_Switch_nb * 0.418 * rtb_Y_k)) / (rtb_Switch_nb * -0.646 *
        rtb_Y_k) * 180.0 / 3.1415926535897931;
    } else {
      rtb_Switch_nb = 0.0;
    }

    A380PrimComputerFctl_LagFilter(rtb_Switch_nb, A380PrimComputerFctl_P.LagFilter1_C1,
      A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt, &rtb_Y_k, &A380PrimComputerFctl_DWork.sf_LagFilter);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fg_logic.ap_1_engaged) {
      rtb_Switch_nb = A380PrimComputerFctl_B.BusAssignment_nw.fg_laws.ap_fd_1.autopilot.Phi_c_deg;
      rtb_Switch1 = A380PrimComputerFctl_B.BusAssignment_nw.fg_laws.ap_fd_1.autopilot.Beta_c_deg;
    } else {
      rtb_Switch_nb = A380PrimComputerFctl_B.BusAssignment_nw.fg_laws.ap_fd_2.autopilot.Phi_c_deg;
      rtb_Switch1 = A380PrimComputerFctl_B.BusAssignment_nw.fg_laws.ap_fd_2.autopilot.Beta_c_deg;
    }

    rtb_OR1_l = (A380PrimComputerFctl_B.BusAssignment_nw.fg_logic.ap_1_engaged ||
                 A380PrimComputerFctl_B.BusAssignment_nw.fg_logic.ap_2_engaged);
    LawMDLOBJ2.step(&A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.theta_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.phi_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.r_deg_s,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.phi_dot_deg_s, &rtb_Y_k,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.total_sidestick_roll_command,
                    &A380PrimComputerFctl_B.BusAssignment_nw.data.analog_inputs.rudder_pedal_pos,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.on_ground, &rtb_OR_i,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_alpha_prot_active,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_speed_prot_active, &rtb_Switch_nb,
                    &rtb_Switch1, &rtb_OR1_l, &rtb_xi_deg, &rtb_zeta_deg);
    LawMDLOBJ1.step(&A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.total_sidestick_roll_command,
                    &A380PrimComputerFctl_B.BusAssignment_nw.data.analog_inputs.rudder_pedal_pos, &rtb_xi_deg_l,
                    &rtb_zeta_deg_c);
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_lateral_law)) {
     case 0:
      rtb_Switch_nb = rtb_xi_deg;
      break;

     case 1:
      rtb_Switch_nb = rtb_xi_deg_l;
      break;

     default:
      rtb_Switch_nb = A380PrimComputerFctl_P.Constant_Value_i;
      break;
    }

    A380PrimComputerFctl_RateLimiter(A380PrimComputerFctl_P.Gain8_Gain * rtb_Switch_nb,
      A380PrimComputerFctl_P.RateLimiterVariableTs1_up, A380PrimComputerFctl_P.RateLimiterVariableTs1_lo,
      A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs1_InitialCondition, &rtb_Y_eb,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_it);
    rtb_OR_i = (A380PrimComputerFctl_B.BusAssignment_nw.general_logic.on_ground ||
                (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_lateral_law !=
                 A380PrimComputerFctl_P.EnumeratedConstant_Value_g));
    if (rtb_OR_i) {
      rtb_Y_eb = rtb_Switch_nb;
      rtb_Switch1 = rtb_Switch_nb;
    } else {
      rtb_Switch1 = A380PrimComputerFctl_P.Gain1_Gain * rtb_Y_eb;
    }

    A380PrimComputerFctl_TransportDelay(rtb_Switch1, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt, rtb_OR_i,
      &rtb_y_ow, &A380PrimComputerFctl_DWork.sf_TransportDelay);
    if (rtb_y_ow > A380PrimComputerFctl_P.Saturation3_UpperSat) {
      rtb_Switch_nb = A380PrimComputerFctl_P.Saturation3_UpperSat;
    } else if (rtb_y_ow < A380PrimComputerFctl_P.Saturation3_LowerSat) {
      rtb_Switch_nb = A380PrimComputerFctl_P.Saturation3_LowerSat;
    } else {
      rtb_Switch_nb = rtb_y_ow;
    }

    if (rtb_Switch1 > A380PrimComputerFctl_P.Saturation_UpperSat_f) {
      rtb_Y_k = A380PrimComputerFctl_P.Saturation_UpperSat_f;
    } else if (rtb_Switch1 < A380PrimComputerFctl_P.Saturation_LowerSat_hn) {
      rtb_Y_k = A380PrimComputerFctl_P.Saturation_LowerSat_hn;
    } else {
      rtb_Y_k = rtb_Switch1;
    }

    rtb_Switch1 = (((rtb_Switch1 - rtb_Y_k) + rtb_y_ow) - rtb_Switch_nb) + rtb_Y_eb;
    if (rtb_Switch1 > A380PrimComputerFctl_P.Saturation2_UpperSat) {
      rtb_Switch1 = A380PrimComputerFctl_P.Saturation2_UpperSat;
    } else if (rtb_Switch1 < A380PrimComputerFctl_P.Saturation2_LowerSat) {
      rtb_Switch1 = A380PrimComputerFctl_P.Saturation2_LowerSat;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.aileron_droop_active) {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant2_Value;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant1_Value;
    }

    A380PrimComputerFctl_RateLimiter(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterVariableTs2_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs2_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs2_InitialCondition, &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.aileron_antidroop_active) {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant4_Value;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant3_Value;
    }

    A380PrimComputerFctl_RateLimiter(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterVariableTs3_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs3_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs3_InitialCondition, &rtb_Y_m,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_m);
    rtb_right_spoiler_2_deg = rtb_y_ow + rtb_Y_m;
    rtb_Sum6 = A380PrimComputerFctl_P.Gain4_Gain * rtb_Switch1 + rtb_right_spoiler_2_deg;
    rtb_outerAilUpperLim = std::fmax(std::fmin
      (-(A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn - 240.0) / 20.0, 1.0), 0.0)
      * 20.0;
    rtb_outerAilLowerLim = std::fmax(std::fmin
      (-(A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn - 300.0) / 20.0, 1.0), 0.0)
      * -30.0;
    if (rtb_Sum6 > rtb_outerAilUpperLim) {
      rtb_Sum6 = rtb_outerAilUpperLim;
    } else if (rtb_Sum6 < rtb_outerAilLowerLim) {
      rtb_Sum6 = rtb_outerAilLowerLim;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Sum6, A380PrimComputerFctl_P.RateLimiterGenericVariableTs4_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs4_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_outboard_aileron_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ng);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_ci, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word, &rtb_y_a);
    if ((rtb_y_kp != 0U) && rtb_y_a) {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_inboard_aileron_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_inboard_aileron_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_midboard_aileron_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_midboard_aileron_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_outboard_aileron_command_deg.Data;
      rtb_Switch_right_outboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_outboard_aileron_command_deg.Data;
      rtb_Switch_left_spoiler_1_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_1_command_deg.Data;
      rtb_Switch_right_spoiler_1_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_1_command_deg.Data;
      rtb_Switch_left_spoiler_2_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_2_command_deg.Data;
      rtb_Switch_right_spoiler_2_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_2_command_deg.Data;
      rtb_Switch_left_spoiler_3_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_3_command_deg.Data;
      rtb_Switch_right_spoiler_3_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_3_command_deg.Data;
      rtb_Switch_left_spoiler_4_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_4_command_deg.Data;
      rtb_Switch_right_spoiler_4_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_4_command_deg.Data;
      rtb_Switch_left_spoiler_5_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_5_command_deg.Data;
      rtb_Switch_right_spoiler_5_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_5_command_deg.Data;
      rtb_Switch_left_spoiler_6_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_6_command_deg.Data;
      rtb_Switch_right_spoiler_6_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_6_command_deg.Data;
      rtb_Switch_left_spoiler_7_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_7_command_deg.Data;
      rtb_Switch_right_spoiler_7_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_7_command_deg.Data;
      rtb_Switch_left_spoiler_8_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_spoiler_8_command_deg.Data;
      rtb_Switch_right_spoiler_8_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_spoiler_8_command_deg.Data;
      rtb_Switch_upper_rudder_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.upper_rudder_command_deg.Data;
      rtb_Switch_lower_rudder_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.lower_rudder_command_deg.Data;
    } else {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_inboard_aileron_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_inboard_aileron_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_midboard_aileron_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_midboard_aileron_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_outboard_aileron_command_deg.Data;
      rtb_Switch_right_outboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_outboard_aileron_command_deg.Data;
      rtb_Switch_left_spoiler_1_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_1_command_deg.Data;
      rtb_Switch_right_spoiler_1_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_1_command_deg.Data;
      rtb_Switch_left_spoiler_2_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_2_command_deg.Data;
      rtb_Switch_right_spoiler_2_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_2_command_deg.Data;
      rtb_Switch_left_spoiler_3_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_3_command_deg.Data;
      rtb_Switch_right_spoiler_3_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_3_command_deg.Data;
      rtb_Switch_left_spoiler_4_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_4_command_deg.Data;
      rtb_Switch_right_spoiler_4_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_4_command_deg.Data;
      rtb_Switch_left_spoiler_5_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_5_command_deg.Data;
      rtb_Switch_right_spoiler_5_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_5_command_deg.Data;
      rtb_Switch_left_spoiler_6_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_6_command_deg.Data;
      rtb_Switch_right_spoiler_6_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_6_command_deg.Data;
      rtb_Switch_left_spoiler_7_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_7_command_deg.Data;
      rtb_Switch_right_spoiler_7_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_7_command_deg.Data;
      rtb_Switch_left_spoiler_8_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_spoiler_8_command_deg.Data;
      rtb_Switch_right_spoiler_8_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_spoiler_8_command_deg.Data;
      rtb_Switch_upper_rudder_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.upper_rudder_command_deg.Data;
      rtb_Switch_lower_rudder_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.lower_rudder_command_deg.Data;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Sum6 = rtb_y_ow;
    } else {
      rtb_Sum6 = rtb_Switch_left_outboard_aileron_command_deg_Data;
    }

    rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Gain_Gain_h * rtb_Y_k + rtb_right_spoiler_2_deg;
    if (rtb_left_spoiler_3_deg > A380PrimComputerFctl_P.Saturation2_UpperSat_j) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation2_UpperSat_j;
    } else if (rtb_left_spoiler_3_deg < A380PrimComputerFctl_P.Saturation2_LowerSat_i) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation2_LowerSat_i;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_left_spoiler_3_deg, A380PrimComputerFctl_P.RateLimiterGenericVariableTs_up_p,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs_lo_d, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_inboard_aileron_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_h);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_left_inboard_aileron_deg = rtb_y_ow;
    } else {
      rtb_left_inboard_aileron_deg = rtb_Switch_left_inboard_aileron_command_deg_Data;
    }

    rtb_left_spoiler_3_deg = rtb_right_spoiler_2_deg + rtb_Y_k;
    if (rtb_left_spoiler_3_deg > A380PrimComputerFctl_P.Saturation1_UpperSat_n) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation1_UpperSat_n;
    } else if (rtb_left_spoiler_3_deg < A380PrimComputerFctl_P.Saturation1_LowerSat_c) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation1_LowerSat_c;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_left_spoiler_3_deg, A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_up_o,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_lo_h, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_inboard_aileron_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_iu);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Y_k = rtb_y_ow;
    } else {
      rtb_Y_k = rtb_Switch_right_inboard_aileron_command_deg_Data;
    }

    rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Gain3_Gain * rtb_Switch_nb + rtb_right_spoiler_2_deg;
    if (rtb_left_spoiler_3_deg > A380PrimComputerFctl_P.Saturation3_UpperSat_b) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation3_UpperSat_b;
    } else if (rtb_left_spoiler_3_deg < A380PrimComputerFctl_P.Saturation3_LowerSat_h) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation3_LowerSat_h;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_left_spoiler_3_deg, A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_up_m,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_lo_b, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_midboard_aileron_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_l);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_left_midboard_aileron_deg = rtb_y_ow;
    } else {
      rtb_left_midboard_aileron_deg = rtb_Switch_left_midboard_aileron_command_deg_Data;
    }

    rtb_left_spoiler_3_deg = rtb_right_spoiler_2_deg + rtb_Switch_nb;
    if (rtb_left_spoiler_3_deg > A380PrimComputerFctl_P.Saturation4_UpperSat) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation4_UpperSat;
    } else if (rtb_left_spoiler_3_deg < A380PrimComputerFctl_P.Saturation4_LowerSat) {
      rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation4_LowerSat;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_left_spoiler_3_deg, A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_up_b,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_lo_b, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_midboard_aileron_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ib);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Switch_nb = rtb_y_ow;
    } else {
      rtb_Switch_nb = rtb_Switch_right_midboard_aileron_command_deg_Data;
    }

    rtb_Switch1 += rtb_right_spoiler_2_deg;
    if (rtb_Switch1 > rtb_outerAilUpperLim) {
      rtb_Switch1 = rtb_outerAilUpperLim;
    } else if (rtb_Switch1 < rtb_outerAilLowerLim) {
      rtb_Switch1 = rtb_outerAilLowerLim;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Switch1, A380PrimComputerFctl_P.RateLimiterGenericVariableTs5_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs5_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_outboard_aileron_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_po);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Switch1 = rtb_y_ow;
    } else {
      rtb_Switch1 = rtb_Switch_right_outboard_aileron_command_deg_Data;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.phased_lift_dumping_active) {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant5_Value;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant6_Value;
    }

    A380PrimComputerFctl_RateLimiter(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterVariableTs4_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs4_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs4_InitialCondition, &rtb_Y_m,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_g);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ground_spoilers_out) {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant_Value;
    } else {
      rtb_Gain_p = rtb_Y_m;
    }

    A380PrimComputerFctl_RateLimiter(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterVariableTs6_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs6_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs6_InitialCondition, &rtb_Y_m,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_i);
    rtb_right_spoiler_2_deg = A380PrimComputerFctl_P.Gain5_Gain * rtb_Y_m;
    rtb_NOT_k = (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ground_spoilers_out ||
                 A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.phased_lift_dumping_active);
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.general_logic.flap_handle_index)) {
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

    A380PrimComputerFctl_RateLimiter_l(rtb_outerAilUpperLim, A380PrimComputerFctl_P.RateLimiterGenericVariableTs28_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs28_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.reset_Value_p, &rtb_y_ow, &A380PrimComputerFctl_DWork.sf_RateLimiter_a);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.spoiler_lift_active) {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant9_Value;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_P.Constant8_Value;
    }

    A380PrimComputerFctl_RateLimiter_d(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs25_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs25_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs25_InitialCondition, A380PrimComputerFctl_P.reset_Value_m,
      &rtb_Y, &A380PrimComputerFctl_DWork.sf_RateLimiter_d);
    rtb_left_spoiler_3_deg = std::fmin(rtb_y_ow *
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.speed_brake_command_deg, rtb_Y);
    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_right_spoiler_2_deg;
    } else {
      rtb_Gain_p = rtb_left_spoiler_3_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs8_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs8_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_1_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_1_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_c);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_outerAilUpperLim = rtb_y_ow;
    } else {
      rtb_outerAilUpperLim = rtb_Switch_left_spoiler_1_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_right_spoiler_2_deg;
    } else {
      rtb_Gain_p = rtb_left_spoiler_3_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs9_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs9_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_1_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_1_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_k);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_outerAilLowerLim = rtb_y_ow;
    } else {
      rtb_outerAilLowerLim = rtb_Switch_right_spoiler_1_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_right_spoiler_2_deg;
    } else {
      rtb_Gain_p = rtb_left_spoiler_3_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs10_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs10_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_2_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_2_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_f);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_left_spoiler_2_deg = rtb_y_ow;
    } else {
      rtb_left_spoiler_2_deg = rtb_Switch_left_spoiler_2_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_left_spoiler_3_deg = rtb_right_spoiler_2_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_left_spoiler_3_deg, A380PrimComputerFctl_P.RateLimiterGenericVariableTs11_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs11_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_2_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_2_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_o);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_right_spoiler_2_deg = rtb_y_ow;
    } else {
      rtb_right_spoiler_2_deg = rtb_Switch_right_spoiler_2_command_deg_Data;
    }

    if (A380PrimComputerFctl_P.Constant7_Value_o) {
      rtb_left_spoiler_3_deg = rtb_Y_eb;
    } else {
      rtb_left_spoiler_3_deg = std::abs(rtb_Y_eb) + A380PrimComputerFctl_P.Bias_Bias;
      if (rtb_left_spoiler_3_deg > A380PrimComputerFctl_P.Saturation7_UpperSat) {
        rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation7_UpperSat;
      } else if (rtb_left_spoiler_3_deg < A380PrimComputerFctl_P.Saturation7_LowerSat) {
        rtb_left_spoiler_3_deg = A380PrimComputerFctl_P.Saturation7_LowerSat;
      }

      if (rtb_Y_eb < 0.0) {
        nz = -1;
      } else {
        nz = (rtb_Y_eb > 0.0);
      }

      rtb_left_spoiler_3_deg = rtb_left_spoiler_3_deg * static_cast<real_T>(nz) * A380PrimComputerFctl_P.Gain6_Gain;
    }

    rtb_Gain2 = A380PrimComputerFctl_P.Gain2_Gain * rtb_left_spoiler_3_deg;
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.general_logic.flap_handle_index)) {
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

    A380PrimComputerFctl_RateLimiter_l(rtb_left_spoiler_3_deg, A380PrimComputerFctl_P.RateLimiterGenericVariableTs27_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs27_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.reset_Value_n, &rtb_y_ow, &A380PrimComputerFctl_DWork.sf_RateLimiter_oa);
    A380PrimComputerFctl_Spoiler345Computation(rtb_Gain2, std::fmin(rtb_y_ow *
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.speed_brake_command_deg, rtb_Y), &rtb_y_ow, &rtb_Gain_cu);
    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_y_ow;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs14_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs14_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_3_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_3_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_handleIndex,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_mt);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_left_spoiler_3_deg = rtb_handleIndex;
    } else {
      rtb_left_spoiler_3_deg = rtb_Switch_left_spoiler_3_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs15_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs15_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_3_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_3_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_handleIndex,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_iv);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Y_eb = rtb_handleIndex;
    } else {
      rtb_Y_eb = rtb_Switch_right_spoiler_3_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_y_ow;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs12_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs12_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_4_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_4_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_handleIndex,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_gk);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Switch9_f = rtb_handleIndex;
    } else {
      rtb_Switch9_f = rtb_Switch_left_spoiler_4_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs13_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs13_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_4_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_4_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_handleIndex,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_fk);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Switch8_o = rtb_handleIndex;
    } else {
      rtb_Switch8_o = rtb_Switch_right_spoiler_4_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_y_ow;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs18_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs18_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_5_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_5_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_hj);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Switch7_e = rtb_y_ow;
    } else {
      rtb_Switch7_e = rtb_Switch_left_spoiler_5_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_cu = rtb_Y_m;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs19_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs19_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_5_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_5_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_p);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Switch6_i = rtb_y_ow;
    } else {
      rtb_Switch6_i = rtb_Switch_right_spoiler_5_command_deg_Data;
    }

    switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.general_logic.flap_handle_index)) {
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

    A380PrimComputerFctl_RateLimiter_l(rtb_speedBrakeGain, A380PrimComputerFctl_P.RateLimiterGenericVariableTs26_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs26_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.reset_Value_nc, &rtb_y_ow, &A380PrimComputerFctl_DWork.sf_RateLimiter_l3);
    A380PrimComputerFctl_Spoiler345Computation(rtb_Gain2, std::fmin(rtb_y_ow *
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.speed_brake_command_deg, rtb_Y), &rtb_y_ow, &rtb_Gain_cu);
    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_y_ow;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs16_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs16_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_6_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_6_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Y,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_f1);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Gain2 = rtb_Y;
    } else {
      rtb_Gain2 = rtb_Switch_left_spoiler_6_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs17_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs17_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_6_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_6_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Y,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ob);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_speedBrakeGain = rtb_Y;
    } else {
      rtb_speedBrakeGain = rtb_Switch_right_spoiler_6_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_y_ow;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs22_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs22_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_7_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_7_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Y,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_n);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg = rtb_Y;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg =
        rtb_Switch_left_spoiler_7_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs23_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs23_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_7_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_7_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Y,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_la);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg = rtb_Y;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg =
        rtb_Switch_right_spoiler_7_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_p = rtb_Y_m;
    } else {
      rtb_Gain_p = rtb_y_ow;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs20_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs20_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.left_spoiler_8_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_8_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_iq);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg = rtb_y_ow;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg =
        rtb_Switch_left_spoiler_8_command_deg_Data;
    }

    if (rtb_NOT_k) {
      rtb_Gain_cu = rtb_Y_m;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs21_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs21_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.right_spoiler_8_deg,
      ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.spoiler_pair_8_engaged) ||
       (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_oj);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Y_m = rtb_y_ow;
    } else {
      rtb_Y_m = rtb_Switch_right_spoiler_8_command_deg_Data;
    }

    rtb_Gain_cu = look1_binlxpw(A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn,
      A380PrimComputerFctl_P.uDLookupTable1_bp01Data_n, A380PrimComputerFctl_P.uDLookupTable1_tableData_d, 8U);
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_lateral_law)) {
     case 0:
      rtb_Y = rtb_zeta_deg;
      break;

     case 1:
      rtb_Y = rtb_zeta_deg_c;
      break;

     default:
      rtb_Y = A380PrimComputerFctl_P.Constant_Value_i;
      break;
    }

    A380PrimComputerFctl_RateLimiter(A380PrimComputerFctl_P.Gain9_Gain * rtb_Y,
      A380PrimComputerFctl_P.RateLimiterVariableTs5_up, A380PrimComputerFctl_P.RateLimiterVariableTs5_lo,
      A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs5_InitialCondition, &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_dg);
    if (rtb_OR_i) {
      rtb_Switch23 = rtb_Y;
    } else {
      rtb_Y = rtb_y_ow;
      rtb_Switch23 = A380PrimComputerFctl_P.Gain7_Gain * rtb_y_ow;
    }

    rtb_handleIndex = look1_binlxpw(A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn,
      A380PrimComputerFctl_P.uDLookupTable2_bp01Data_o, A380PrimComputerFctl_P.uDLookupTable2_tableData_o, 8U);
    if (rtb_Switch23 <= rtb_handleIndex) {
      rtb_handleIndex *= A380PrimComputerFctl_P.Gain1_Gain_c;
      if (rtb_Switch23 >= rtb_handleIndex) {
        rtb_handleIndex = rtb_Switch23;
      }
    }

    A380PrimComputerFctl_TransportDelay(rtb_Y, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt, rtb_OR_i, &rtb_y_ow,
      &A380PrimComputerFctl_DWork.sf_TransportDelay_c);
    rtb_Y = (rtb_Switch23 - rtb_handleIndex) + rtb_y_ow;
    if (rtb_Y > rtb_Gain_cu) {
      rtb_Y = rtb_Gain_cu;
    } else {
      rtb_Gain_cu *= A380PrimComputerFctl_P.Gain_Gain;
      if (rtb_Y < rtb_Gain_cu) {
        rtb_Y = rtb_Gain_cu;
      }
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg >
        A380PrimComputerFctl_P.Saturation6_UpperSat) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation6_UpperSat;
    } else if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg <
               A380PrimComputerFctl_P.Saturation6_LowerSat) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation6_LowerSat;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.upper_rudder_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y, A380PrimComputerFctl_P.RateLimiterGenericVariableTs6_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs6_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      rtb_Gain_p, ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.upper_rudder_engaged) ||
                   (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Gain_cu,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_lv);
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_y_ow = rtb_Gain_cu;
    } else {
      rtb_y_ow = rtb_Switch_upper_rudder_command_deg_Data;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg >
        A380PrimComputerFctl_P.Saturation5_UpperSat) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation5_UpperSat;
    } else if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg <
               A380PrimComputerFctl_P.Saturation5_LowerSat) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation5_LowerSat;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.lateral_surface_positions.lower_rudder_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_handleIndex, A380PrimComputerFctl_P.RateLimiterGenericVariableTs7_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs7_lo, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      rtb_Gain_p, ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.lower_rudder_engaged) ||
                   (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Gain_cu,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_pw);
    if (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Gain_cu = rtb_Switch_lower_rudder_command_deg_Data;
    }

    rtb_Switch23 = rtb_Gain_cu;
    rtb_Gain_om = A380PrimComputerFctl_P.DiscreteDerivativeVariableTs_Gain *
      A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.theta_dot_deg_s;
    A380PrimComputerFctl_LagFilter((rtb_Gain_om - A380PrimComputerFctl_DWork.Delay_DSTATE) /
      A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt, A380PrimComputerFctl_P.LagFilter_C1,
      A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt, &rtb_Y, &A380PrimComputerFctl_DWork.sf_LagFilter_k);
    rtb_Gain_cu =
      (((A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg +
         A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg) +
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg) +
       A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg) *
      A380PrimComputerFctl_P.Gain_Gain_p;
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_j, &rtb_y_kp);
    rtb_OR_i = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_h, &rtb_y_kp);
    rtb_OR1_l = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_he, &rtb_y_kp);
    rtb_OR_jr = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel3_bit_l, &rtb_y_kp);
    rtb_OR1_h = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_nn, &rtb_y_kp);
    rtb_OR_d = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_f, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction_m(rtb_OR_i, rtb_OR1_l, rtb_OR_jr, rtb_OR1_h, rtb_OR_d, (rtb_y_kp != 0U),
      &rtb_handleIndex);
    rtb_OR_jr = (A380PrimComputerFctl_B.BusAssignment_nw.general_logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law) !=
      A380PrimComputerFctl_P.CompareToConstant_const_b) && (static_cast<real_T>
      (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law) !=
      A380PrimComputerFctl_P.CompareToConstant2_const_h)));
    if (A380PrimComputerFctl_B.BusAssignment_nw.fg_logic.ap_1_engaged) {
      rtb_Switch_k = A380PrimComputerFctl_B.BusAssignment_nw.fg_laws.ap_fd_1.autopilot.Theta_c_deg;
    } else {
      rtb_Switch_k = A380PrimComputerFctl_B.BusAssignment_nw.fg_laws.ap_fd_2.autopilot.Theta_c_deg;
    }

    rtb_OR1_h = (A380PrimComputerFctl_B.BusAssignment_nw.fg_logic.ap_1_engaged ||
                 A380PrimComputerFctl_B.BusAssignment_nw.fg_logic.ap_2_engaged);
    LawMDLOBJ5.step(&A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputerFctl_B.BusAssignment_nw.data.time.simulation_time,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.n_z_g,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.theta_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.phi_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.theta_dot_deg_s, &rtb_Y,
                    &rtb_Gain_cu, &A380PrimComputerFctl_B.BusAssignment_nw.data.analog_inputs.ths_pos_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.alpha_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ra_computation_data_ft, &rtb_handleIndex, (
      const_cast<real_T*>(&A380PrimComputerFctl_RGND)), (const_cast<real_T*>(&A380PrimComputerFctl_RGND)),
                    &A380PrimComputerFctl_P.Constant_Value_g, &A380PrimComputerFctl_P.Constant_Value_g,
                    &A380PrimComputerFctl_B.BusAssignment_nw.data.sim_data.tailstrike_protection_on, (const_cast<real_T*>
      (&A380PrimComputerFctl_RGND)), &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.total_sidestick_pitch_command,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.on_ground, &rtb_OR_jr,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_alpha_prot_active,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_speed_prot_active,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.alpha_prot_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.alpha_max_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_speed_prot_hi_thresh_kn,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.high_speed_prot_lo_thresh_kn, &rtb_Switch_k,
                    &rtb_OR1_h, &rtb_eta_deg, &rtb_eta_trim_dot_deg_s, &rtb_eta_trim_limit_lo, &rtb_eta_trim_limit_up);
    rtb_Gain_cu = ((A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg
                    + A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg)
                   + A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg)
      + A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg;
    rtb_Gain_p = A380PrimComputerFctl_P.Gain_Gain_a * rtb_Gain_cu;
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_d, &rtb_y_kp);
    rtb_OR_i = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_lh, &rtb_y_kp);
    rtb_OR1_l = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_c, &rtb_y_kp);
    rtb_OR_jr = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel3_bit_i, &rtb_y_kp);
    rtb_OR1_h = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_o, &rtb_y_kp);
    rtb_OR_d = (rtb_y_kp != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_ft, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction_m(rtb_OR_i, rtb_OR1_l, rtb_OR_jr, rtb_OR1_h, rtb_OR_d, (rtb_y_kp != 0U),
      &rtb_handleIndex_h);
    rtb_OR_d = (A380PrimComputerFctl_B.BusAssignment_nw.general_logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law) !=
      A380PrimComputerFctl_P.CompareToConstant3_const_m) && (static_cast<real_T>
      (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law) !=
      A380PrimComputerFctl_P.CompareToConstant4_const_e) && (static_cast<real_T>
      (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law) !=
      A380PrimComputerFctl_P.CompareToConstant5_const_p)));
    rtb_Equal = (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law !=
                 A380PrimComputerFctl_P.EnumeratedConstant_Value_j);
    LawMDLOBJ3.step(&A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputerFctl_B.BusAssignment_nw.data.time.simulation_time,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.n_z_g,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.theta_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.phi_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ir_computation_data.theta_dot_deg_s,
                    &rtb_Gain_p, &A380PrimComputerFctl_B.BusAssignment_nw.data.analog_inputs.ths_pos_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.alpha_deg,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.ra_computation_data_ft, &rtb_handleIndex_h, (
      const_cast<real_T*>(&A380PrimComputerFctl_RGND)), (const_cast<real_T*>(&A380PrimComputerFctl_RGND)),
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.total_sidestick_pitch_command,
                    &A380PrimComputerFctl_B.BusAssignment_nw.general_logic.on_ground, &rtb_OR_d, &rtb_Equal,
                    &rtb_eta_deg_h, &rtb_eta_trim_dot_deg_s_p, &rtb_eta_trim_limit_lo_m, &rtb_eta_trim_limit_up_c);
    LawMDLOBJ4.step(&A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
                    &A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.total_sidestick_pitch_command, &rtb_eta_deg_c,
                    &rtb_eta_trim_dot_deg_s_l, &rtb_eta_trim_limit_lo_o, &rtb_eta_trim_limit_up_n);
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law)) {
     case 0:
     case 1:
      rtb_handleIndex_h = rtb_eta_deg;
      break;

     case 2:
     case 3:
     case 4:
      rtb_handleIndex_h = rtb_eta_deg_h;
      break;

     case 5:
      rtb_handleIndex_h = rtb_eta_deg_c;
      break;

     default:
      rtb_handleIndex_h = A380PrimComputerFctl_P.Constant_Value_j;
      break;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg >
        A380PrimComputerFctl_P.Saturation3_UpperSat_o) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation3_UpperSat_o;
    } else if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg <
               A380PrimComputerFctl_P.Saturation3_LowerSat_f) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation3_LowerSat_f;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_handleIndex_h, A380PrimComputerFctl_P.RateLimiterGenericVariableTs_up_b,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs_lo_c, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      rtb_Gain_p, ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_inboard_elevator_engaged) ||
                   (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Gain_cu,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_mp);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_h, &rtb_y_kp);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.fctl_law_status_word, &rtb_y_a);
    if ((rtb_y_kp != 0U) && rtb_y_a) {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_inboard_elevator_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_inboard_elevator_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.left_outboard_elevator_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.right_outboard_elevator_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_x_bus.fctl.ths_command_deg.Data;
    } else {
      rtb_Switch_left_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_inboard_elevator_command_deg.Data;
      rtb_Switch_right_inboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_inboard_elevator_command_deg.Data;
      rtb_Switch_left_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.left_outboard_elevator_command_deg.Data;
      rtb_Switch_right_midboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.right_outboard_elevator_command_deg.Data;
      rtb_Switch_left_outboard_aileron_command_deg_Data =
        A380PrimComputerFctl_B.BusAssignment_nw.data.bus_inputs.prim_y_bus.fctl.ths_command_deg.Data;
    }

    if (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Gain_cu = rtb_Switch_left_inboard_aileron_command_deg_Data;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg >
        A380PrimComputerFctl_P.Saturation2_UpperSat_l) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation2_UpperSat_l;
    } else if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg <
               A380PrimComputerFctl_P.Saturation2_LowerSat_l) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation2_LowerSat_l;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_handleIndex_h, A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_up_g,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_lo_a, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      rtb_Gain_p, ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_inboard_elevator_engaged)
                   || (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Y,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_c4);
    if (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Y = rtb_Switch_right_inboard_aileron_command_deg_Data;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg >
        A380PrimComputerFctl_P.Saturation_UpperSat_g) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation_UpperSat_g;
    } else if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg <
               A380PrimComputerFctl_P.Saturation_LowerSat_c) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation_LowerSat_c;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_handleIndex_h, A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_up_d,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_lo_m, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      rtb_Gain_p, ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.left_outboard_elevator_engaged)
                   || (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_handleIndex,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_b);
    if (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_handleIndex = rtb_Switch_left_midboard_aileron_command_deg_Data;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg >
        A380PrimComputerFctl_P.Saturation1_UpperSat_m) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation1_UpperSat_m;
    } else if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg <
               A380PrimComputerFctl_P.Saturation1_LowerSat_b) {
      rtb_Gain_p = A380PrimComputerFctl_P.Saturation1_LowerSat_b;
    } else {
      rtb_Gain_p =
        A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_handleIndex_h, A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_up_m,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_lo_p, A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt,
      rtb_Gain_p, ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.right_outboard_elevator_engaged)
                   || (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim)), &rtb_Switch_k,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_j);
    if (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Switch_k = rtb_Switch_right_midboard_aileron_command_deg_Data;
    }

    switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law)) {
     case 0:
     case 1:
      rtb_Gain_p = rtb_eta_trim_limit_up;
      break;

     case 2:
     case 3:
     case 4:
      rtb_Gain_p = rtb_eta_trim_limit_up_c;
      break;

     case 5:
      rtb_Gain_p = rtb_eta_trim_limit_up_n;
      break;

     default:
      rtb_Gain_p = A380PrimComputerFctl_P.Constant2_Value_g;
      break;
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_automatic_mode_active) {
      switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law)) {
       case 0:
       case 1:
        rtb_handleIndex_h = rtb_eta_trim_dot_deg_s;
        break;

       case 2:
       case 3:
       case 4:
        rtb_handleIndex_h = rtb_eta_trim_dot_deg_s_p;
        break;

       case 5:
        rtb_handleIndex_h = rtb_eta_trim_dot_deg_s_l;
        break;

       default:
        rtb_handleIndex_h = A380PrimComputerFctl_P.Constant_Value_j;
        break;
      }
    } else {
      rtb_handleIndex_h = A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_manual_mode_c_deg_s;
    }

    rtb_handleIndex_h = A380PrimComputerFctl_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_handleIndex_h *
      A380PrimComputerFctl_B.BusAssignment_nw.data.time.dt;
    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_automatic_mode_active) {
      rtb_y_ep = ((!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.surface_statuses.ths_engaged) ||
                  (!A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim));
    } else {
      rtb_y_ep = !A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_engaged;
    }

    A380PrimComputerFctl_DWork.icLoad = (rtb_y_ep || A380PrimComputerFctl_DWork.icLoad);
    if (A380PrimComputerFctl_DWork.icLoad) {
      A380PrimComputerFctl_DWork.Delay_DSTATE_m = 0.0 - rtb_handleIndex_h;
    }

    A380PrimComputerFctl_DWork.Delay_DSTATE_m += rtb_handleIndex_h;
    if (A380PrimComputerFctl_DWork.Delay_DSTATE_m > rtb_Gain_p) {
      A380PrimComputerFctl_DWork.Delay_DSTATE_m = rtb_Gain_p;
    } else {
      switch (static_cast<int32_T>(A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.active_pitch_law)) {
       case 0:
       case 1:
        rtb_Gain_p = rtb_eta_trim_limit_lo;
        break;

       case 2:
       case 3:
       case 4:
        rtb_Gain_p = rtb_eta_trim_limit_lo_m;
        break;

       case 5:
        rtb_Gain_p = rtb_eta_trim_limit_lo_o;
        break;

       default:
        rtb_Gain_p = A380PrimComputerFctl_P.Constant3_Value_m;
        break;
      }

      if (A380PrimComputerFctl_DWork.Delay_DSTATE_m < rtb_Gain_p) {
        A380PrimComputerFctl_DWork.Delay_DSTATE_m = rtb_Gain_p;
      }
    }

    if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.is_master_prim) {
      rtb_Gain_p = A380PrimComputerFctl_DWork.Delay_DSTATE_m;
    } else if (A380PrimComputerFctl_B.BusAssignment_nw.fctl_logic.ths_automatic_mode_active) {
      rtb_Gain_p = rtb_Switch_left_outboard_aileron_command_deg_Data;
    } else {
      rtb_Gain_p = A380PrimComputerFctl_DWork.Delay_DSTATE_m;
    }

    A380PrimComputerFctl_B.BusAssignment_m = A380PrimComputerFctl_B.BusAssignment_nw;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_inboard_aileron_deg =
      rtb_left_inboard_aileron_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_inboard_aileron_deg = rtb_Y_k;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_midboard_aileron_deg =
      rtb_left_midboard_aileron_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_midboard_aileron_deg = rtb_Switch_nb;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_outboard_aileron_deg = rtb_Sum6;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_outboard_aileron_deg = rtb_Switch1;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_1_deg = rtb_outerAilUpperLim;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_1_deg = rtb_outerAilLowerLim;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_2_deg = rtb_left_spoiler_2_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_2_deg = rtb_right_spoiler_2_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_3_deg = rtb_left_spoiler_3_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_3_deg = rtb_Y_eb;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_4_deg = rtb_Switch9_f;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_4_deg = rtb_Switch8_o;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_5_deg = rtb_Switch7_e;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_5_deg = rtb_Switch6_i;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_6_deg = rtb_Gain2;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_6_deg = rtb_speedBrakeGain;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_7_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_7_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.left_spoiler_8_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.right_spoiler_8_deg = rtb_Y_m;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.upper_rudder_deg = rtb_y_ow;
    A380PrimComputerFctl_B.BusAssignment_m.laws.lateral_law_outputs.lower_rudder_deg = rtb_Switch23;
    A380PrimComputerFctl_B.BusAssignment_m.laws.pitch_law_outputs.left_inboard_elevator_deg = rtb_Gain_cu;
    A380PrimComputerFctl_B.BusAssignment_m.laws.pitch_law_outputs.right_inboard_elevator_deg = rtb_Y;
    A380PrimComputerFctl_B.BusAssignment_m.laws.pitch_law_outputs.left_outboard_elevator_deg = rtb_handleIndex;
    A380PrimComputerFctl_B.BusAssignment_m.laws.pitch_law_outputs.right_outboard_elevator_deg = rtb_Switch_k;
    A380PrimComputerFctl_B.BusAssignment_m.laws.pitch_law_outputs.ths_deg = rtb_Gain_p;
    if (A380PrimComputerFctl_B.BusAssignment_m.data.discrete_inputs.is_unit_1) {
      rtb_handleIndex_h = rtb_left_inboard_aileron_deg;
      rtb_rightAileron1Command = rtb_Y_k;
      rtb_leftAileron2Command = rtb_left_midboard_aileron_deg;
      rtb_rightAileron2Command = rtb_Switch_nb;
      rtb_elevator1Command = rtb_handleIndex;
      rtb_elevator2Command = rtb_Gain_cu;
      rtb_elevator3Command = rtb_Switch_k;
      rtb_rudder1Command = rtb_y_ow;
      rtb_rudder2Command = rtb_Switch23;
      rtb_leftSpoilerCommand = rtb_Gain2;
      rtb_rightSpoilerCommand = rtb_speedBrakeGain;
    } else if (A380PrimComputerFctl_B.BusAssignment_m.data.discrete_inputs.is_unit_2) {
      rtb_handleIndex_h = rtb_Sum6;
      rtb_rightAileron1Command = rtb_Switch1;
      rtb_leftAileron2Command = rtb_left_inboard_aileron_deg;
      rtb_rightAileron2Command = rtb_Y_k;
      rtb_elevator1Command = rtb_Switch_k;
      rtb_elevator2Command = rtb_handleIndex;
      rtb_elevator3Command = rtb_Y;
      rtb_rudder1Command = rtb_y_ow;
      rtb_rudder2Command = 0.0;
      rtb_leftSpoilerCommand = rtb_Switch7_e;
      rtb_rightSpoilerCommand = rtb_Switch6_i;
    } else {
      rtb_handleIndex_h = rtb_left_midboard_aileron_deg;
      rtb_rightAileron1Command = rtb_Switch_nb;
      rtb_leftAileron2Command = rtb_Sum6;
      rtb_rightAileron2Command = rtb_Switch1;
      rtb_elevator1Command = rtb_Gain_cu;
      rtb_elevator2Command = rtb_Y;
      rtb_elevator3Command = 0.0;
      rtb_rudder1Command = rtb_Switch23;
      rtb_rudder2Command = 0.0;
      rtb_leftSpoilerCommand = rtb_Switch9_f;
      rtb_rightSpoilerCommand = rtb_Switch8_o;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      rtb_Switch_left_inboard_aileron_command_deg_Data = static_cast<real32_T>(rtb_left_inboard_aileron_deg);
      rtb_Switch_right_inboard_aileron_command_deg_Data = static_cast<real32_T>(rtb_Y_k);
      rtb_Switch_left_midboard_aileron_command_deg_Data = static_cast<real32_T>(rtb_left_midboard_aileron_deg);
      rtb_Switch_right_midboard_aileron_command_deg_Data = static_cast<real32_T>(rtb_Switch_nb);
      rtb_Switch_left_outboard_aileron_command_deg_Data = static_cast<real32_T>(rtb_Sum6);
      rtb_Switch_right_outboard_aileron_command_deg_Data = static_cast<real32_T>(rtb_Switch1);
      rtb_Switch_left_spoiler_1_command_deg_Data = static_cast<real32_T>(rtb_outerAilUpperLim);
      rtb_Switch_right_spoiler_1_command_deg_Data = static_cast<real32_T>(rtb_outerAilLowerLim);
      rtb_Switch_left_spoiler_2_command_deg_Data = static_cast<real32_T>(rtb_left_spoiler_2_deg);
      rtb_Switch_right_spoiler_2_command_deg_Data = static_cast<real32_T>(rtb_right_spoiler_2_deg);
      rtb_Switch_left_spoiler_3_command_deg_Data = static_cast<real32_T>(rtb_left_spoiler_3_deg);
      rtb_Switch_right_spoiler_3_command_deg_Data = static_cast<real32_T>(rtb_Y_eb);
      rtb_Switch_left_spoiler_4_command_deg_Data = static_cast<real32_T>(rtb_Switch9_f);
      rtb_Switch_right_spoiler_4_command_deg_Data = static_cast<real32_T>(rtb_Switch8_o);
      rtb_Switch_left_spoiler_5_command_deg_Data = static_cast<real32_T>(rtb_Switch7_e);
      rtb_Switch_right_spoiler_5_command_deg_Data = static_cast<real32_T>(rtb_Switch6_i);
      rtb_Switch_left_spoiler_6_command_deg_Data = static_cast<real32_T>(rtb_Gain2);
      rtb_Switch_right_spoiler_6_command_deg_Data = static_cast<real32_T>(rtb_speedBrakeGain);
      rtb_Switch_left_spoiler_7_command_deg_Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_7_deg);
      rtb_Switch_right_spoiler_7_command_deg_Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_spoiler_7_deg);
      rtb_Switch_left_spoiler_8_command_deg_Data = static_cast<real32_T>
        (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_left_spoiler_8_deg);
      rtb_Switch_right_spoiler_8_command_deg_Data = static_cast<real32_T>(rtb_Y_m);
      rtb_Switch_upper_rudder_command_deg_Data = static_cast<real32_T>(rtb_Gain_cu);
      rtb_Switch_lower_rudder_command_deg_Data = static_cast<real32_T>(rtb_Y);
      rtb_left_outboard_elevator_command_deg_Data = static_cast<real32_T>(rtb_handleIndex);
      rtb_right_outboard_elevator_command_deg_Data = static_cast<real32_T>(rtb_Switch_k);
      rtb_ths_command_deg_Data = static_cast<real32_T>(rtb_Gain_p);
      rtb_upper_rudder_command_deg_Data = static_cast<real32_T>(rtb_y_ow);
      rtb_lower_rudder_command_deg_Data = static_cast<real32_T>(rtb_Switch23);
    } else {
      rtb_Switch_left_inboard_aileron_command_deg_Data = A380PrimComputerFctl_P.Constant20_Value;
      rtb_Switch_right_inboard_aileron_command_deg_Data = A380PrimComputerFctl_P.Constant14_Value;
      rtb_Switch_left_midboard_aileron_command_deg_Data = A380PrimComputerFctl_P.Constant13_Value;
      rtb_Switch_right_midboard_aileron_command_deg_Data = A380PrimComputerFctl_P.Constant12_Value;
      rtb_Switch_left_outboard_aileron_command_deg_Data = A380PrimComputerFctl_P.Constant11_Value_a;
      rtb_Switch_right_outboard_aileron_command_deg_Data = A380PrimComputerFctl_P.Constant10_Value_b;
      rtb_Switch_left_spoiler_1_command_deg_Data = A380PrimComputerFctl_P.Constant9_Value_o;
      rtb_Switch_right_spoiler_1_command_deg_Data = A380PrimComputerFctl_P.Constant8_Value_j;
      rtb_Switch_left_spoiler_2_command_deg_Data = A380PrimComputerFctl_P.Constant24_Value;
      rtb_Switch_right_spoiler_2_command_deg_Data = A380PrimComputerFctl_P.Constant23_Value;
      rtb_Switch_left_spoiler_3_command_deg_Data = A380PrimComputerFctl_P.Constant7_Value_k;
      rtb_Switch_right_spoiler_3_command_deg_Data = A380PrimComputerFctl_P.Constant6_Value_h;
      rtb_Switch_left_spoiler_4_command_deg_Data = A380PrimComputerFctl_P.Constant26_Value;
      rtb_Switch_right_spoiler_4_command_deg_Data = A380PrimComputerFctl_P.Constant25_Value;
      rtb_Switch_left_spoiler_5_command_deg_Data = A380PrimComputerFctl_P.Constant28_Value;
      rtb_Switch_right_spoiler_5_command_deg_Data = A380PrimComputerFctl_P.Constant27_Value;
      rtb_Switch_left_spoiler_6_command_deg_Data = A380PrimComputerFctl_P.Constant5_Value_a;
      rtb_Switch_right_spoiler_6_command_deg_Data = A380PrimComputerFctl_P.Constant4_Value_b;
      rtb_Switch_left_spoiler_7_command_deg_Data = A380PrimComputerFctl_P.Constant30_Value;
      rtb_Switch_right_spoiler_7_command_deg_Data = A380PrimComputerFctl_P.Constant29_Value;
      rtb_Switch_left_spoiler_8_command_deg_Data = A380PrimComputerFctl_P.Constant32_Value;
      rtb_Switch_right_spoiler_8_command_deg_Data = A380PrimComputerFctl_P.Constant31_Value;
      rtb_Switch_upper_rudder_command_deg_Data = A380PrimComputerFctl_P.Constant3_Value_k;
      rtb_Switch_lower_rudder_command_deg_Data = A380PrimComputerFctl_P.Constant33_Value;
      rtb_left_outboard_elevator_command_deg_Data = A380PrimComputerFctl_P.Constant34_Value;
      rtb_right_outboard_elevator_command_deg_Data = A380PrimComputerFctl_P.Constant35_Value;
      rtb_ths_command_deg_Data = A380PrimComputerFctl_P.Constant2_Value_kh;
      rtb_upper_rudder_command_deg_Data = A380PrimComputerFctl_P.Constant1_Value_a;
      rtb_lower_rudder_command_deg_Data = A380PrimComputerFctl_P.Constant15_Value;
    }

    rtb_VectorConcatenate[0] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_1_avail;
    rtb_VectorConcatenate[1] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_1_engaged;
    rtb_VectorConcatenate[2] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[3] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_1_avail;
    rtb_VectorConcatenate[4] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_1_engaged;
    rtb_VectorConcatenate[5] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[6] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_2_avail;
    rtb_VectorConcatenate[7] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_2_engaged;
    rtb_VectorConcatenate[8] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[9] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_2_avail;
    rtb_VectorConcatenate[10] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_2_engaged;
    rtb_VectorConcatenate[11] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[12] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[13] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[14] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[15] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[16] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[17] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[18] = A380PrimComputerFctl_P.Constant16_Value;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate, &rtb_aileron_status_word_Data);
    rtb_VectorConcatenate[0] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate[1] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_spoiler_electric_mode_avail;
    rtb_VectorConcatenate[2] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_spoiler_hydraulic_mode_engaged;
    rtb_VectorConcatenate[3] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate[4] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[5] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[6] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_spoiler_electric_mode_avail;
    rtb_VectorConcatenate[8] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_spoiler_hydraulic_mode_engaged;
    rtb_VectorConcatenate[9] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate[10] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[11] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[12] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[13] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[14] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[15] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[16] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[17] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate[18] = A380PrimComputerFctl_P.Constant17_Value;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate, &rtb_spoiler_status_word_Data);
    rtb_VectorConcatenate[0] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_1_avail;
    rtb_VectorConcatenate[1] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_1_engaged;
    rtb_VectorConcatenate[2] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[3] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_2_avail;
    rtb_VectorConcatenate[4] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_2_engaged;
    rtb_VectorConcatenate[5] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[6] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_3_avail;
    rtb_VectorConcatenate[7] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_3_engaged;
    rtb_VectorConcatenate[8] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[9] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.ths_avail;
    rtb_VectorConcatenate[10] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.ths_engaged;
    rtb_VectorConcatenate[11] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[12] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[13] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[14] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[15] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[16] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[17] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate[18] = A380PrimComputerFctl_P.Constant18_Value;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate, &rtb_elevator_status_word_Data);
    rtb_VectorConcatenate[0] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_hydraulic_mode_avail;
    rtb_VectorConcatenate[1] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_electric_mode_avail;
    rtb_VectorConcatenate[2] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_hydraulic_mode_engaged;
    rtb_VectorConcatenate[3] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_electric_mode_engaged;
    rtb_VectorConcatenate[4] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[5] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[6] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_electric_mode_avail;
    rtb_VectorConcatenate[8] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_hydraulic_mode_engaged;
    rtb_VectorConcatenate[9] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_electric_mode_engaged;
    rtb_VectorConcatenate[10] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[11] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[12] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[13] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[14] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[15] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[16] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[17] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate[18] = A380PrimComputerFctl_P.Constant19_Value;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate, &rtb_fctl_rudder_status_word_Data);
    A380PrimComputerFctl_MATLABFunction_h(A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.pitch_law_capability,
      &rtb_VectorConcatenate_o[0], &rtb_VectorConcatenate_o[1], &rtb_VectorConcatenate_o[2]);
    A380PrimComputerFctl_MATLABFunction2(A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.lateral_law_capability,
      &rtb_VectorConcatenate_o[3], &rtb_VectorConcatenate_o[4]);
    A380PrimComputerFctl_MATLABFunction_h(A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.active_pitch_law,
      &rtb_VectorConcatenate_o[5], &rtb_VectorConcatenate_o[6], &rtb_VectorConcatenate_o[7]);
    A380PrimComputerFctl_MATLABFunction2(A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.active_lateral_law,
      &rtb_VectorConcatenate_o[8], &rtb_VectorConcatenate_o[9]);
    rtb_VectorConcatenate_o[10] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim;
    rtb_VectorConcatenate_o[11] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_o[12] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_o[13] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_o[14] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_o[15] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_o[16] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_o[17] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_o[18] = A380PrimComputerFctl_P.Constant21_Value;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_o, &rtb_fctl_fctl_law_status_word_Data);
    rtb_VectorConcatenate_o[0] = A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.ths_automatic_mode_active;
    rtb_VectorConcatenate_o[1] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[2] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[3] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[4] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[5] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[6] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[7] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[8] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[9] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[10] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[11] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[12] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[13] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[14] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[15] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[16] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[17] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[18] = A380PrimComputerFctl_P.Constant22_Value;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_o, &rtb_fctl_discrete_status_word_1_Data);
    rtb_y_p = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value);
    rtb_DataTypeConversion_nx = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
    if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_lost) {
      rtb_y_o5 = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value);
      rtb_fctl_v_alpha_prot_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value);
      rtb_Switch3_a = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
      rtb_speed_trend_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
      rtb_v_3_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
      rtb_v_4_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
      rtb_v_man_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
      rtb_fe_v_max_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
    } else {
      if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_visible) {
        rtb_y_o5 = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
        rtb_fctl_v_alpha_prot_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
        rtb_y_p = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      } else {
        rtb_y_o5 = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
        rtb_fctl_v_alpha_prot_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
        rtb_y_p = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      }

      rtb_Switch3_a = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
      rtb_speed_trend_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
      if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_visible &&
          A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_3_visible) {
        rtb_v_3_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
      } else {
        rtb_v_3_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value_e);
      }

      if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_visible &&
          A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_4_visible) {
        rtb_v_4_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
      } else {
        rtb_v_4_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value_e);
      }

      if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_visible &&
          A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_man_visible) {
        rtb_v_man_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
      } else {
        rtb_v_man_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value_e);
      }

      if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_visible) {
        rtb_fe_v_max_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
      } else {
        rtb_fe_v_max_kn_SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value_e);
      }

      if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_visible &&
          A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_fe_next_visible) {
        rtb_DataTypeConversion_nx = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
      } else {
        rtb_DataTypeConversion_nx = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value_e);
      }
    }

    rtb_VectorConcatenate_o[0] = A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.alpha_floor_condition;
    rtb_VectorConcatenate_o[1] = A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.low_energy_warning_active;
    rtb_VectorConcatenate_o[2] = A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.pitch_pitch_warning_active;
    rtb_VectorConcatenate_o[3] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[4] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[5] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[6] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[7] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[8] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[9] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[10] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[11] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[12] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[13] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[14] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[15] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[16] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[17] = A380PrimComputerFctl_P.Constant_Value_ho;
    rtb_VectorConcatenate_o[18] = A380PrimComputerFctl_P.Constant_Value_ho;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_o, &rtb_DataTypeConversion2_a);
    rtb_OR_i = !A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.trk_fpa_active;
    rtb_NOT_k = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.vs_fpa_dashes || rtb_OR_i);
    if (rtb_NOT_k) {
      rtb_y_ml = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    } else {
      rtb_y_ml = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    }

    A380PrimComputerFctl_MATLABFunction_c
      (&A380PrimComputerFctl_B.BusAssignment_nw.fg_logic.ils_computation_data.runway_heading_deg, &rtb_NOT_k);
    rtb_VectorConcatenate_o[0] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.trk_fpa_active;
    rtb_VectorConcatenate_o[1] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.mach_control_active;
    rtb_VectorConcatenate_o[2] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.true_active;
    rtb_VectorConcatenate_o[3] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.metric_alt_active;
    rtb_VectorConcatenate_o[4] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[5] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[6] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.auto_spd_control_active;
    rtb_VectorConcatenate_o[7] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.manual_spd_control_active;
    rtb_VectorConcatenate_o[8] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[9] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[10] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ils_tune_inhibit;
    rtb_VectorConcatenate_o[11] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[12] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[13] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[14] = A380PrimComputerFctl_P.Constant9_Value_f;
    rtb_VectorConcatenate_o[15] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.pitch_fd_bars_flashing;
    rtb_VectorConcatenate_o[16] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.roll_fd_bars_flashing;
    rtb_VectorConcatenate_o[17] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.ap_fd_mode_reversion;
    rtb_VectorConcatenate_o[18] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.vs_target_not_held;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_o, &rtb_y_d);
    rtb_VectorConcatenate_o[0] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rwy_active;
    rtb_VectorConcatenate_o[1] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.nav_active;
    rtb_VectorConcatenate_o[2] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.loc_cpt_active;
    rtb_VectorConcatenate_o[3] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.loc_trk_active;
    rtb_VectorConcatenate_o[4] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.roll_goaround_active;
    rtb_VectorConcatenate_o[5] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.hdg_active;
    rtb_VectorConcatenate_o[6] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.trk_active;
    rtb_VectorConcatenate_o[7] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rwy_loc_submode_active;
    rtb_VectorConcatenate_o[8] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rwy_trk_submode_active;
    rtb_VectorConcatenate_o[9] = A380PrimComputerFctl_P.Constant8_Value_h3;
    rtb_VectorConcatenate_o[10] = A380PrimComputerFctl_P.Constant8_Value_h3;
    rtb_VectorConcatenate_o[11] = A380PrimComputerFctl_P.Constant8_Value_h3;
    rtb_VectorConcatenate_o[12] = A380PrimComputerFctl_P.Constant8_Value_h3;
    rtb_VectorConcatenate_o[13] = A380PrimComputerFctl_P.Constant8_Value_h3;
    rtb_VectorConcatenate_o[14] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.align_submode_active;
    rtb_VectorConcatenate_o[15] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rollout_submode_active;
    rtb_VectorConcatenate_o[16] = A380PrimComputerFctl_P.Constant8_Value_h3;
    rtb_VectorConcatenate_o[17] = A380PrimComputerFctl_P.Constant8_Value_h3;
    rtb_VectorConcatenate_o[18] = A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.backbeam_selected;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_o, &rtb_y_ks);
    rtb_VectorConcatenate_o[0] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.athr_engaged;
    rtb_VectorConcatenate_o[1] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_active;
    rtb_VectorConcatenate_o[2] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.athr_inop;
    rtb_VectorConcatenate_o[3] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_limited;
    rtb_VectorConcatenate_o[4] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[5] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[6] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[7] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.speed_mach_mode_active;
    rtb_VectorConcatenate_o[8] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.retard_mode_active;
    rtb_VectorConcatenate_o[9] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.thrust_mode_active;
    rtb_VectorConcatenate_o[10] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[11] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[12] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[13] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.alpha_floor_mode_active;
    rtb_VectorConcatenate_o[14] = false;
    rtb_VectorConcatenate_o[15] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[16] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[17] = A380PrimComputerFctl_P.Constant4_Value_o;
    rtb_VectorConcatenate_o[18] = A380PrimComputerFctl_P.Constant4_Value_o;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_o, &rtb_y_kc);
    rtb_VectorConcatenate_pw[0] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::MAN_TOGA);
    rtb_VectorConcatenate_pw[1] = ((A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::MAN_MCT) || (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::THR_MCT));
    rtb_VectorConcatenate_pw[2] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::MAN_FLEX);
    rtb_VectorConcatenate_pw[3] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::THR_CLB);
    rtb_VectorConcatenate_pw[4] = ((A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::MAN_THR) || (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::THR_LVR));
    rtb_VectorConcatenate_pw[5] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::THR_IDLE);
    rtb_VectorConcatenate_pw[6] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::A_FLOOR);
    rtb_VectorConcatenate_pw[7] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::TOGA_LK);
    rtb_VectorConcatenate_pw[8] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::SPEED);
    rtb_VectorConcatenate_pw[9] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::MACH);
    rtb_VectorConcatenate_pw[10] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::THR_DCLB);
    rtb_VectorConcatenate_pw[11] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::NOISE);
    rtb_VectorConcatenate_pw[12] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_mode ==
      a380_athr_fma_mode::THR_DES);
    rtb_VectorConcatenate_pw[13] = false;
    rtb_VectorConcatenate_pw[14] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_message ==
      a380_athr_fma_message::LVR_ASYM);
    rtb_VectorConcatenate_pw[15] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_message ==
      a380_athr_fma_message::LVR_CLB);
    rtb_VectorConcatenate_pw[16] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_message ==
      a380_athr_fma_message::LVR_MCT);
    rtb_VectorConcatenate_pw[17] = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.athr_fma_message ==
      a380_athr_fma_message::LVR_TOGA);
    rtb_VectorConcatenate_pw[18] = A380PrimComputerFctl_P.Constant5_Value_c;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_pw, &rtb_y_i);
    rtb_VectorConcatenate_pw[0] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.clb_active;
    rtb_VectorConcatenate_pw[1] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.des_active;
    rtb_VectorConcatenate_pw[2] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.op_clb_active;
    rtb_VectorConcatenate_pw[3] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.op_des_active;
    rtb_VectorConcatenate_pw[4] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.pitch_takeoff_active;
    rtb_VectorConcatenate_pw[5] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.pitch_goaround_active;
    rtb_VectorConcatenate_pw[6] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.vs_active;
    rtb_VectorConcatenate_pw[7] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.fpa_active;
    rtb_VectorConcatenate_pw[8] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.alt_acq_active;
    rtb_VectorConcatenate_pw[9] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.alt_hold_active;
    rtb_VectorConcatenate_pw[10] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.gs_capt_active;
    rtb_VectorConcatenate_pw[11] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.gs_trk_active;
    rtb_VectorConcatenate_pw[12] =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.app_des_active;
    rtb_VectorConcatenate_pw[13] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.flare_active;
    rtb_VectorConcatenate_pw[14] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.tcas_active;
    rtb_VectorConcatenate_pw[15] = A380PrimComputerFctl_P.Constant7_Value_p;
    rtb_VectorConcatenate_pw[16] = A380PrimComputerFctl_P.Constant7_Value_p;
    rtb_VectorConcatenate_pw[17] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.alt_cstr_applicable;
    rtb_VectorConcatenate_pw[18] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longitudinal_modes.cruise_active;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_pw, &rtb_y_ku);
    rtb_VectorConcatenate_pw[0] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ap_1_engaged;
    rtb_VectorConcatenate_pw[1] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ap_2_engaged;
    rtb_VectorConcatenate_pw[2] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.fd_1_engaged;
    rtb_VectorConcatenate_pw[3] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.fd_2_engaged;
    rtb_VectorConcatenate_pw[4] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ap_1_inop;
    rtb_VectorConcatenate_pw[5] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ap_2_inop;
    rtb_VectorConcatenate_pw[6] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.fd_1_inop;
    rtb_VectorConcatenate_pw[7] = A380PrimComputerFctl_B.BusAssignment_m.fg_logic.fd_2_inop;
    rtb_VectorConcatenate_pw[8] = A380PrimComputerFctl_P.Constant1_Value_h;
    rtb_VectorConcatenate_pw[9] = A380PrimComputerFctl_P.Constant1_Value_h;
    rtb_VectorConcatenate_pw[10] = A380PrimComputerFctl_P.Constant1_Value_h;
    rtb_VectorConcatenate_pw[11] = A380PrimComputerFctl_P.Constant1_Value_h;
    rtb_VectorConcatenate_pw[12] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.land_active;
    rtb_VectorConcatenate_pw[13] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.land_2_capability;
    rtb_VectorConcatenate_pw[14] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.land_3_fail_passive_capability;
    rtb_VectorConcatenate_pw[15] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.land_3_fail_op_capability;
    rtb_VectorConcatenate_pw[16] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.land_2_inop;
    rtb_VectorConcatenate_pw[17] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.land_3_fail_passive_inop;
    rtb_VectorConcatenate_pw[18] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.land_3_fail_op_inop;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_pw, &rtb_y_ny);
    rtb_VectorConcatenate_pw[0] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.alt_acq_armed;
    rtb_VectorConcatenate_pw[1] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.alt_acq_arm_possible;
    rtb_VectorConcatenate_pw[2] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.glide_armed;
    rtb_VectorConcatenate_pw[3] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.app_des_armed;
    rtb_VectorConcatenate_pw[4] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.clb_armed;
    rtb_VectorConcatenate_pw[5] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.des_armed;
    rtb_VectorConcatenate_pw[6] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.op_clb_armed;
    rtb_VectorConcatenate_pw[7] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.tcas_armed;
    rtb_VectorConcatenate_pw[8] = A380PrimComputerFctl_P.Constant6_Value_o;
    rtb_VectorConcatenate_pw[9] = A380PrimComputerFctl_P.Constant6_Value_o;
    rtb_VectorConcatenate_pw[10] = A380PrimComputerFctl_P.Constant6_Value_o;
    rtb_VectorConcatenate_pw[11] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.nav_armed;
    rtb_VectorConcatenate_pw[12] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.loc_armed;
    rtb_VectorConcatenate_pw[13] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.rwy_armed;
    rtb_VectorConcatenate_pw[14] = A380PrimComputerFctl_P.Constant6_Value_o;
    rtb_VectorConcatenate_pw[15] = A380PrimComputerFctl_P.Constant6_Value_o;
    rtb_VectorConcatenate_pw[16] = A380PrimComputerFctl_P.Constant6_Value_o;
    rtb_VectorConcatenate_pw[17] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.armed_modes.land_armed;
    rtb_VectorConcatenate_pw[18] = A380PrimComputerFctl_P.Constant6_Value_o;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_pw, &rtb_y_m0);
    rtb_VectorConcatenate_pw[0] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.longi_large_box_tcas;
    rtb_VectorConcatenate_pw[1] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.tcas_ra_inhibited;
    rtb_VectorConcatenate_pw[2] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.trk_fpa_deselected;
    rtb_VectorConcatenate_pw[3] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.tcas_ra_corrective;
    rtb_VectorConcatenate_pw[4] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.fcu_alt_abv_acft;
    rtb_VectorConcatenate_pw[5] = A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.fcu_alt_blw_acft;
    rtb_VectorConcatenate_pw[6] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[7] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[8] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[9] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[10] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[11] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[12] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[13] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[14] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[15] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[16] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[17] = A380PrimComputerFctl_P.Constant2_Value_d;
    rtb_VectorConcatenate_pw[18] = A380PrimComputerFctl_P.Constant2_Value_d;
    A380PrimComputerFctl_MATLABFunction_gr(rtb_VectorConcatenate_pw, &rtb_y_h4);
    if (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.show_speed_margins) {
      rtb_y_kp = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      rtb_y_kp = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out = A380PrimComputerFctl_B.BusAssignment_m;
    A380PrimComputerFctl_Y.out.discrete_outputs.alignment_dummy = A380PrimComputerFctl_P.Constant2_Value_o;
    A380PrimComputerFctl_Y.out.discrete_outputs.elevator_1_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_1_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.elevator_2_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_2_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.elevator_3_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_3_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.ths_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.ths_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.left_aileron_1_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_1_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.left_aileron_2_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_2_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.right_aileron_1_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_1_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.right_aileron_2_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_2_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.left_spoiler_electronic_module_enable =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_spoiler_electric_mode_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.right_spoiler_electronic_module_enable =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_spoiler_electric_mode_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_hydraulic_mode_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.rudder_1_electric_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_electric_mode_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_hydraulic_mode_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.rudder_2_electric_active_mode =
      A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_electric_mode_engaged;
    A380PrimComputerFctl_Y.out.discrete_outputs.prim_healthy = A380PrimComputerFctl_P.Constant1_Value_f;
    A380PrimComputerFctl_Y.out.discrete_outputs.fcu_1_select =
      A380PrimComputerFctl_B.BusAssignment_m.fg_logic.fcu_1_chosen;
    A380PrimComputerFctl_Y.out.discrete_outputs.fcu_2_select =
      A380PrimComputerFctl_B.BusAssignment_m.fg_logic.fcu_2_chosen;
    A380PrimComputerFctl_Y.out.discrete_outputs.ap_engaged =
      (A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ap_1_engaged ||
       A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ap_2_engaged);
    A380PrimComputerFctl_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputerFctl_P.Constant_Value_ba;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_1_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.elevator_1_pos_order_deg = rtb_elevator1Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.elevator_1_pos_order_deg = A380PrimComputerFctl_P.Constant_Value_b;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_2_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.elevator_2_pos_order_deg = rtb_elevator2Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.elevator_2_pos_order_deg = A380PrimComputerFctl_P.Constant1_Value_n;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.elevator_3_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.elevator_3_pos_order_deg = rtb_elevator3Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.elevator_3_pos_order_deg = A380PrimComputerFctl_P.Constant2_Value_k;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.ths_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.ths_pos_order_deg = rtb_Gain_p;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputerFctl_P.Constant3_Value_g;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_1_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.left_aileron_1_pos_order_deg = rtb_handleIndex_h;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.left_aileron_1_pos_order_deg = A380PrimComputerFctl_P.Constant4_Value_i;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_aileron_2_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.left_aileron_2_pos_order_deg = rtb_leftAileron2Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.left_aileron_2_pos_order_deg = A380PrimComputerFctl_P.Constant5_Value_n;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_1_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.right_aileron_1_pos_order_deg = rtb_rightAileron1Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.right_aileron_1_pos_order_deg = A380PrimComputerFctl_P.Constant6_Value_f;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_aileron_2_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.right_aileron_2_pos_order_deg = rtb_rightAileron2Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.right_aileron_2_pos_order_deg = A380PrimComputerFctl_P.Constant7_Value;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_spoiler_electric_mode_engaged ||
        A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.left_spoiler_hydraulic_mode_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.left_spoiler_pos_order_deg = rtb_leftSpoilerCommand;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.left_spoiler_pos_order_deg = A380PrimComputerFctl_P.Constant8_Value_p;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_spoiler_electric_mode_engaged ||
        A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.right_spoiler_hydraulic_mode_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.right_spoiler_pos_order_deg = rtb_rightSpoilerCommand;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.right_spoiler_pos_order_deg = A380PrimComputerFctl_P.Constant9_Value_n;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_electric_mode_engaged ||
        A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_1_hydraulic_mode_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.rudder_1_pos_order_deg = rtb_rudder1Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.rudder_1_pos_order_deg = A380PrimComputerFctl_P.Constant10_Value;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_electric_mode_engaged ||
        A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.rudder_2_hydraulic_mode_engaged) {
      A380PrimComputerFctl_Y.out.analog_outputs.rudder_2_pos_order_deg = rtb_rudder2Command;
    } else {
      A380PrimComputerFctl_Y.out.analog_outputs.rudder_2_pos_order_deg = A380PrimComputerFctl_P.Constant11_Value;
    }

    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_inboard_aileron_command_deg.Data =
      rtb_Switch_left_inboard_aileron_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_inboard_aileron_command_deg.Data =
      rtb_Switch_right_inboard_aileron_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_midboard_aileron_command_deg.Data =
      rtb_Switch_left_midboard_aileron_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_midboard_aileron_command_deg.Data =
      rtb_Switch_right_midboard_aileron_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_outboard_aileron_command_deg.Data =
      rtb_Switch_left_outboard_aileron_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_outboard_aileron_command_deg.Data =
      rtb_Switch_right_outboard_aileron_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_1_command_deg.Data =
      rtb_Switch_left_spoiler_1_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_1_command_deg.Data =
      rtb_Switch_right_spoiler_1_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_2_command_deg.Data =
      rtb_Switch_left_spoiler_2_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_2_command_deg.Data =
      rtb_Switch_right_spoiler_2_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_3_command_deg.Data =
      rtb_Switch_left_spoiler_3_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_3_command_deg.Data =
      rtb_Switch_right_spoiler_3_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_4_command_deg.Data =
      rtb_Switch_left_spoiler_4_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_4_command_deg.Data =
      rtb_Switch_right_spoiler_4_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_5_command_deg.Data =
      rtb_Switch_left_spoiler_5_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_5_command_deg.Data =
      rtb_Switch_right_spoiler_5_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_6_command_deg.Data =
      rtb_Switch_left_spoiler_6_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_6_command_deg.Data =
      rtb_Switch_right_spoiler_6_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_7_command_deg.Data =
      rtb_Switch_left_spoiler_7_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_7_command_deg.Data =
      rtb_Switch_right_spoiler_7_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_8_command_deg.Data =
      rtb_Switch_left_spoiler_8_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_8_command_deg.Data =
      rtb_Switch_right_spoiler_8_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_inboard_elevator_command_deg.Data =
      rtb_Switch_upper_rudder_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_inboard_elevator_command_deg.Data =
      rtb_Switch_lower_rudder_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_outboard_elevator_command_deg.Data =
      rtb_left_outboard_elevator_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_outboard_elevator_command_deg.Data =
      rtb_right_outboard_elevator_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.ths_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.ths_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.ths_command_deg.Data = rtb_ths_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.upper_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.upper_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.upper_rudder_command_deg.Data = rtb_upper_rudder_command_deg_Data;
    if (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.is_master_prim) {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.lower_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fctl.lower_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fctl.lower_rudder_command_deg.Data = rtb_lower_rudder_command_deg_Data;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_sidestick_pitch_command_deg.Data =
      A380PrimComputerFctl_P.Gain_Gain_n * static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.capt_pitch_stick_pos);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_sidestick_pitch_command_deg.Data =
      A380PrimComputerFctl_P.Gain1_Gain_i * static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.fo_pitch_stick_pos);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_sidestick_roll_command_deg.Data =
      A380PrimComputerFctl_P.Gain2_Gain_g * static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.capt_roll_stick_pos);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_sidestick_roll_command_deg.Data =
      A380PrimComputerFctl_P.Gain3_Gain_a * static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.fo_roll_stick_pos);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_pedal_position_deg.Data = A380PrimComputerFctl_P.Gain4_Gain_h *
      static_cast<real32_T>(A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.rudder_pedal_pos);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.aileron_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.aileron_status_word.Data = rtb_aileron_status_word_Data;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.left_aileron_1_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.left_aileron_2_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.right_aileron_1_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.right_aileron_2_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.spoiler_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.spoiler_status_word.Data = rtb_spoiler_status_word_Data;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.left_spoiler_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.left_spoiler_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.right_spoiler_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.right_spoiler_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_status_word.Data = rtb_elevator_status_word_Data;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.elevator_1_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.elevator_2_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_3_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.elevator_3_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.elevator_3_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.ths_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.ths_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.ths_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_status_word.Data = rtb_fctl_rudder_status_word_Data;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_1_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_1_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.rudder_1_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_2_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.rudder_2_position_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.analog_inputs.rudder_2_pos_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.radio_height_1_ft =
      A380PrimComputerFctl_B.BusAssignment_m.data.bus_inputs.ra_1_bus.radio_height_ft;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.radio_height_2_ft =
      A380PrimComputerFctl_B.BusAssignment_m.data.bus_inputs.ra_2_bus.radio_height_ft;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.fctl_law_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.fctl_law_status_word.Data = rtb_fctl_fctl_law_status_word_Data;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.discrete_status_word_1.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.discrete_status_word_1.Data = rtb_fctl_discrete_status_word_1_Data;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.v_alpha_lim_kn.SSM = rtb_y_o5;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.v_alpha_lim_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.v_alpha_max_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.v_alpha_prot_kn.SSM = rtb_fctl_v_alpha_prot_kn_SSM;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.v_alpha_prot_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.v_alpha_prot_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.v_alpha_stall_warn_kn.SSM = rtb_y_p;
    A380PrimComputerFctl_Y.out.bus_outputs.fctl.v_alpha_stall_warn_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fctl_logic.v_alpha_stall_warn_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.gamma_a_deg.SSM = rtb_Switch3_a;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.gamma_a_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.gamma_a_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.gamma_t_deg.SSM = rtb_Switch3_a;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.gamma_t_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.gamma_t_deg);
    if (A380PrimComputerFctl_P.Switch7_Threshold < 0.0) {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.sideslip_target_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
    } else if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.beta_target_visible) {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.sideslip_target_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.sideslip_target_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_e);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fe.sideslip_target_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.beta_target_deg);
    if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_lost) {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.v_ls_kn.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
    } else if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_visible) {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.v_ls_kn.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.v_ls_kn.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_e);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_ls_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_ls_kn);
    if (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.speed_scale_lost) {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.v_stall_kn.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant2_Value_l);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fe.v_stall_kn.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_stall_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_stall_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.speed_trend_kn.SSM = rtb_speed_trend_kn_SSM;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.speed_trend_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_c_trend_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_3_kn.SSM = rtb_v_3_kn_SSM;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_3_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_3_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_4_kn.SSM = rtb_v_4_kn_SSM;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_4_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_4_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_man_kn.SSM = rtb_v_man_kn_SSM;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_man_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_man_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_max_kn.SSM = rtb_fe_v_max_kn_SSM;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_max_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_max_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_fe_next_kn.SSM = rtb_DataTypeConversion_nx;
    A380PrimComputerFctl_Y.out.bus_outputs.fe.v_fe_next_kn.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.flight_envelope.v_fe_next_kn);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.discrete_word_1.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_j);
    A380PrimComputerFctl_Y.out.bus_outputs.fe.discrete_word_1.Data = rtb_DataTypeConversion2_a;
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.spd_mach_dashes &&
        (!A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.auto_spd_control_active)) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pfd_spd_tgt_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pfd_spd_tgt_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.pfd_spd_tgt_kts.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.pfd_spd_target_kts);
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.short_term_managed_spd_visible) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pfd_short_term_mngd_spd_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pfd_short_term_mngd_spd_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.pfd_short_term_mngd_spd_kts.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.short_term_managed_spd_kts);
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.spd_mach_dashes ||
        A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.mach_control_active) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_spd_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_spd_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_spd_kts.Data =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.selected_spd_mach;
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.spd_mach_dashes ||
        (!A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.mach_control_active)) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_mach_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_mach_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_mach_kts.Data =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.selected_spd_mach;
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.hdg_trk_dashes ||
        A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.trk_fpa_active) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_hdg_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_hdg_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_hdg_deg.Data =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.selected_hdg_trk;
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.hdg_trk_dashes || rtb_OR_i) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_trk_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_trk_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_trk_deg.Data =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.selected_hdg_trk;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_alt_ft.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_alt_ft.Data =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.selected_alt;
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.vs_fpa_dashes ||
        A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.trk_fpa_active) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_vs_ft_min.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_vs_ft_min.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_vs_ft_min.Data =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.selected_vs_fpa;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_fpa_deg.SSM = rtb_y_ml;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.selected_fpa_deg.Data =
      A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.selected_vs_fpa;
    if (rtb_NOT_k || A380PrimComputerFctl_B.BusAssignment_m.fg_logic.ils_tune_inhibit) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.runway_hdg_memorized_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.runway_hdg_memorized_deg.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.runway_hdg_memorized_deg.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_logic.rwy_hdg_memo);
    if (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.preset_mach >
        A380PrimComputerFctl_P.CompareToConstant1_const_b) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.preset_mach_from_fms.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.preset_mach_from_fms.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.preset_mach_from_fms.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.preset_mach);
    if (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.preset_spd_kts >
        A380PrimComputerFctl_P.CompareToConstant2_const_d) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.preset_speed_from_fms_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.preset_speed_from_fms_kts.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.preset_speed_from_fms_kts.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.preset_spd_kts);
    rtb_y_ep = !A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rollout_submode_active;
    rtb_OR_i = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.any_lateral_mode_engaged &&
                (!A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rwy_loc_submode_active) && rtb_y_ep);
    if (rtb_OR_i) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.roll_fd_command_1.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.roll_fd_command_1.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.roll_fd_command_1.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_laws.ap_fd_1.flight_director.Phi_c_deg);
    rtb_y_ep = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.any_longitudinal_mode_engaged && rtb_y_ep);
    if (rtb_y_ep) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pitch_fd_command_1.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pitch_fd_command_1.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.pitch_fd_command_1.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_laws.ap_fd_1.flight_director.Theta_c_deg);
    rtb_OR1_l = (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rwy_loc_submode_active ||
                 A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.rollout_submode_active ||
                 A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.lateral_modes.align_submode_active);
    if (rtb_OR1_l) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.yaw_fd_command_1.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.yaw_fd_command_1.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.yaw_fd_command_1.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_laws.ap_fd_1.flight_director.Beta_c_deg);
    if (rtb_OR_i) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.roll_fd_command_2.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.roll_fd_command_2.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.roll_fd_command_2.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_laws.ap_fd_2.flight_director.Phi_c_deg);
    if (rtb_y_ep) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pitch_fd_command_2.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.pitch_fd_command_2.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.pitch_fd_command_2.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_laws.ap_fd_2.flight_director.Theta_c_deg);
    if (rtb_OR1_l) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.yaw_fd_command_2.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.yaw_fd_command_2.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.yaw_fd_command_2.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_laws.ap_fd_2.flight_director.Beta_c_deg);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_5.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_5.Data = rtb_y_d;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_4.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_4.Data = rtb_y_ks;
    if (A380PrimComputerFctl_B.BusAssignment_m.fg_mode_logic.alt_cstr_applicable) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.fm_alt_constraint_ft.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.fm_alt_constraint_ft.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.fm_alt_constraint_ft.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.next_alt_cstr_ft);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.ats_discrete_word.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.ats_discrete_word.Data = rtb_y_kc;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.ats_fma_discrete_word.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.ats_fma_discrete_word.Data = rtb_y_i;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_3.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_3.Data = rtb_y_ku;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_1.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_1.Data = rtb_y_ny;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_2.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_2.Data = rtb_y_m0;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_6.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_6.Data = rtb_y_h4;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.low_target_speed_margin_kts.SSM = rtb_y_kp;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.low_target_speed_margin_kts.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.v_lower_margin_kts);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.high_target_speed_margin_kts.SSM = rtb_y_kp;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.high_target_speed_margin_kts.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.v_upper_margin_kts);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.nosewheel_cmd_deg.SSM = 0U;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.nosewheel_cmd_deg.Data = 0.0F;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.n1_command_percent.SSM = static_cast<uint32_T>
      (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.n1_command_percent.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.fg_laws.n_1_c_percent);
    if (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.flex_temp_deg_c !=
        A380PrimComputerFctl_P.CompareToConstant_const_d) {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.flx_to_temp_deg_c.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value_g);
    } else {
      A380PrimComputerFctl_Y.out.bus_outputs.fg.flx_to_temp_deg_c.SSM = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant_Value_i);
    }

    A380PrimComputerFctl_Y.out.bus_outputs.fg.flx_to_temp_deg_c.Data = static_cast<real32_T>
      (A380PrimComputerFctl_B.BusAssignment_m.data.adcn_inputs.fms.flex_temp_deg_c);
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_7.SSM = 0U;
    A380PrimComputerFctl_Y.out.bus_outputs.fg.discrete_word_7.Data = 0.0F;
    A380PrimComputerFctl_DWork.Delay_DSTATE_c = rtb_AND1_l;
    A380PrimComputerFctl_DWork.Delay1_DSTATE = rtb_AND4_d;
    A380PrimComputerFctl_DWork.Memory_PreviousInput_j = A380PrimComputerFctl_DWork.Delay_DSTATE_e;
    A380PrimComputerFctl_DWork.Delay_DSTATE = rtb_Gain_om;
    A380PrimComputerFctl_DWork.icLoad = false;
  } else {
    A380PrimComputerFctl_DWork.Runtime_MODE = false;
  }
}

void A380PrimComputerFctl::initialize()
{
  A380PrimComputerFctl_DWork.Delay_DSTATE_c = A380PrimComputerFctl_P.Delay_InitialCondition;
  A380PrimComputerFctl_DWork.Delay1_DSTATE = A380PrimComputerFctl_P.Delay1_InitialCondition;
  A380PrimComputerFctl_DWork.Memory_PreviousInput = A380PrimComputerFctl_P.SRFlipFlop_initial_condition;
  A380PrimComputerFctl_DWork.Memory_PreviousInput_a = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition;
  A380PrimComputerFctl_DWork.Delay1_DSTATE_b = A380PrimComputerFctl_P.Delay1_InitialCondition_n;
  A380PrimComputerFctl_DWork.Delay2_DSTATE = A380PrimComputerFctl_P.Delay2_InitialCondition;
  A380PrimComputerFctl_DWork.Delay3_DSTATE = A380PrimComputerFctl_P.Delay3_InitialCondition;
  A380PrimComputerFctl_DWork.Delay_DSTATE_e = A380PrimComputerFctl_P.Delay_InitialCondition_o;
  A380PrimComputerFctl_DWork.Memory_PreviousInput_d = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition_i;
  A380PrimComputerFctl_DWork.Memory_PreviousInput_j = A380PrimComputerFctl_P.SRFlipFlop_initial_condition_i;
  A380PrimComputerFctl_DWork.Delay_DSTATE = A380PrimComputerFctl_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380PrimComputerFctl_DWork.icLoad = true;
  LawMDLOBJ2.init();
  A380PrimComputerFctl_TransportDelay_Init(&A380PrimComputerFctl_DWork.sf_TransportDelay);
  A380PrimComputerFctl_TransportDelay_Init(&A380PrimComputerFctl_DWork.sf_TransportDelay_c);
  LawMDLOBJ5.init();
  LawMDLOBJ3.init();
  A380PrimComputerFctl_Y.out = A380PrimComputerFctl_P.out_Y0;
}

void A380PrimComputerFctl::terminate()
{
}

A380PrimComputerFctl::A380PrimComputerFctl():
  A380PrimComputerFctl_U(),
  A380PrimComputerFctl_Y(),
  A380PrimComputerFctl_B(),
  A380PrimComputerFctl_DWork()
{
}

A380PrimComputerFctl::~A380PrimComputerFctl() = default;
