#include "A380PrimComputerFctl.h"
#include "rtwtypes.h"
#include "A380PrimComputerFctl_types.h"
#include <cmath>
#include <cstring>
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

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_l_Reset(rtDW_RateLimiter_A380PrimComputerFctl_j_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_RateLimiter_b(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  real_T rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputerFctl_j_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_l_Reset(rtDW_MATLABFunction_A380PrimComputerFctl_h_T
  *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T
  rtu_isRisingEdge, real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputerFctl_h_T *localDW)
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

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_n_Reset(rtDW_MATLABFunction_A380PrimComputerFctl_c_T
  *localDW)
{
  localDW->output = false;
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_n(real_T rtu_u, real_T rtu_highTrigger, real_T
  rtu_lowTrigger, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputerFctl_c_T *localDW)
{
  boolean_T output_tmp;
  output_tmp = !localDW->output;
  localDW->output = ((output_tmp && (rtu_u >= rtu_highTrigger)) || ((output_tmp || (rtu_u > rtu_lowTrigger)) &&
    localDW->output));
  *rty_y = localDW->output;
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

void A380PrimComputerFctl::A380PrimComputerFctl_GetIASforMach4(real_T rtu_m, real_T rtu_m_t, real_T rtu_v, real_T
  *rty_v_t)
{
  *rty_v_t = rtu_v * rtu_m_t / rtu_m;
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_i(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380PrimComputerFctl::A380PrimComputerFctl_MATLABFunction_b(a380_pitch_efcs_law rtu_law, boolean_T *rty_bit1,
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

boolean_T A380PrimComputerFctl::A380PrimComputerFctl_a429_bitValueOr(uint32_T word_SSM, real32_T word_Data)
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
  base_arinc_429 rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1;
  uint64m_T tmp_0;
  uint64m_T tmp_1;
  uint64m_T tmp_2;
  uint64m_T tmp_3;
  uint64m_T tmp_4;
  uint64m_T tmp_5;
  uint64m_T tmp_6;
  real_T rtb_Gain_cu;
  real_T rtb_Gain_p;
  real_T rtb_Y_gl;
  real_T rtb_Y_ms;
  real_T rtb_handleIndex_a;
  real_T rtb_handleIndex_h;
  int32_T b_nz;
  int32_T d_nz;
  int32_T nz;
  int32_T prim3LawCap;
  uint32_T rtb_DataTypeConversion1_j;
  uint32_T rtb_y_cyi;
  uint32_T rtb_y_dp;
  uint32_T rtb_y_jg;
  uint32_T rtb_y_ny;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_a[19];
  boolean_T rtb_VectorConcatenate_b[19];
  boolean_T rtb_VectorConcatenate_i[19];
  boolean_T rtb_VectorConcatenate_ic[19];
  boolean_T rtb_VectorConcatenate_k[19];
  boolean_T rtb_VectorConcatenate_o[19];
  boolean_T rtb_VectorConcatenate_p[19];
  boolean_T b_x[6];
  boolean_T tmp[3];
  boolean_T leftInboardAilEngaged;
  boolean_T rtb_AND10_b;
  boolean_T rtb_AND13;
  boolean_T rtb_AND15;
  boolean_T rtb_AND16_l;
  boolean_T rtb_AND19;
  boolean_T rtb_AND1_l;
  boolean_T rtb_AND2_ac;
  boolean_T rtb_AND3_k;
  boolean_T rtb_AND4_n;
  boolean_T rtb_AND6_m;
  boolean_T rtb_AND7;
  boolean_T rtb_AND8;
  boolean_T rtb_Equal;
  boolean_T rtb_OR_a;
  boolean_T rtb_OR_d;
  boolean_T rtb_OR_i;
  boolean_T rtb_OR_jr;
  boolean_T rtb_OR_o;
  boolean_T rtb_protection_active;
  boolean_T rtb_y_pf;
  a380_pitch_efcs_law rtb_law;
  a380_pitch_efcs_law rtb_law_p;
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

  if (A380PrimComputerFctl_U.in.data.sim_data.computer_running) {
    if (!A380PrimComputerFctl_DWork.Runtime_MODE) {
      A380PrimComputerFctl_DWork.Memory_PreviousInput = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition;
      A380PrimComputerFctl_DWork.Delay1_DSTATE = A380PrimComputerFctl_P.Delay1_InitialCondition;
      A380PrimComputerFctl_DWork.Delay2_DSTATE = A380PrimComputerFctl_P.Delay2_InitialCondition;
      A380PrimComputerFctl_DWork.Delay3_DSTATE = A380PrimComputerFctl_P.Delay3_InitialCondition;
      A380PrimComputerFctl_DWork.Delay_DSTATE_c = A380PrimComputerFctl_P.Delay_InitialCondition;
      A380PrimComputerFctl_DWork.Delay1_DSTATE_n = A380PrimComputerFctl_P.Delay1_InitialCondition_b;
      A380PrimComputerFctl_DWork.Memory_PreviousInput_g = A380PrimComputerFctl_P.SRFlipFlop_initial_condition;
      A380PrimComputerFctl_DWork.Delay_DSTATE_e = A380PrimComputerFctl_P.Delay_InitialCondition_o;
      A380PrimComputerFctl_DWork.Memory_PreviousInput_d = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition_i;
      A380PrimComputerFctl_DWork.Memory_PreviousInput_j = A380PrimComputerFctl_P.SRFlipFlop_initial_condition_i;
      A380PrimComputerFctl_DWork.Delay_DSTATE = A380PrimComputerFctl_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380PrimComputerFctl_DWork.icLoad = true;
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_m1);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_ny);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_gc);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_ff);
      A380PrimComputerFctl_MATLABFunction_n_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_nj);
      A380PrimComputerFctl_MATLABFunction_l_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_cx);
      A380PrimComputerFctl_MATLABFunction_n_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_e1);
      A380PrimComputerFctl_MATLABFunction_l_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_kq);
      A380PrimComputerFctl_MATLABFunction_l_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_nb);
      A380PrimComputerFctl_DWork.abnormalConditionWasActive = false;
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_g4);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_nu);
      A380PrimComputerFctl_DWork.pLeftStickDisabled = false;
      A380PrimComputerFctl_DWork.pRightStickDisabled = false;
      A380PrimComputerFctl_MATLABFunction_l_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_j2);
      A380PrimComputerFctl_MATLABFunction_l_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_g2);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ne);
      A380PrimComputerFctl_DWork.eventTime_not_empty_m = false;
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_mr);
      A380PrimComputerFctl_DWork.resetEventTime_not_empty = false;
      A380PrimComputerFctl_DWork.sProtActive_g = false;
      A380PrimComputerFctl_MATLABFunction_l_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_al4);
      A380PrimComputerFctl_DWork.sProtActive = false;
      A380PrimComputerFctl_DWork.is_active_c28_A380PrimComputerFctl = 0U;
      A380PrimComputerFctl_DWork.is_c28_A380PrimComputerFctl = A380PrimComputerFctl_IN_NO_ACTIVE_CHILD;
      A380PrimComputerFctl_DWork.eventTime_not_empty = false;
      A380PrimComputerFctl_DWork.pApproachModeArmedAbove400Ft = false;
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_ky);
      A380PrimComputerFctl_MATLABFunction_b_Reset(&A380PrimComputerFctl_DWork.sf_MATLABFunction_dmh);
      A380PrimComputerFctl_LagFilter_Reset(&A380PrimComputerFctl_DWork.sf_LagFilter);
      LawMDLOBJ2.reset();
      LawMDLOBJ1.reset();
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_it);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_l3);
      A380PrimComputerFctl_RateLimiter_l_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_b);
      A380PrimComputerFctl_RateLimiter_l_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_d);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_g);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_i);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_oj);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_dg);
      A380PrimComputerFctl_TransportDelay_Reset(&A380PrimComputerFctl_DWork.sf_TransportDelay_c);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_lv);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_pw);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter);
      A380PrimComputerFctl_RateLimiter_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_m);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_h);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_iu);
      A380PrimComputerFctl_TransportDelay_Reset(&A380PrimComputerFctl_DWork.sf_TransportDelay);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_l);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ib);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ng);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_po);
      A380PrimComputerFctl_RateLimiter_f_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_a);
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
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_f1);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_ob);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_n);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_la);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_iq);
      A380PrimComputerFctl_LagFilter_Reset(&A380PrimComputerFctl_DWork.sf_LagFilter_k);
      LawMDLOBJ5.reset();
      LawMDLOBJ3.reset();
      LawMDLOBJ4.reset();
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_mp);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_c4);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_bx);
      A380PrimComputerFctl_RateLimiter_a_Reset(&A380PrimComputerFctl_DWork.sf_RateLimiter_j);
      A380PrimComputerFctl_DWork.Runtime_MODE = true;
    }

    A380PrimComputerFctl_B.ground_spoilers_armed = (A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos <
      A380PrimComputerFctl_P.CompareToConstant_const);
    A380PrimComputerFctl_B.phased_lift_dumping_active =
      ((((A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos >
          A380PrimComputerFctl_P.CompareToConstant26_const) || A380PrimComputerFctl_B.ground_spoilers_armed) &&
        ((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos <
          A380PrimComputerFctl_P.CompareToConstant11_const) &&
         (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <
          A380PrimComputerFctl_P.CompareToConstant27_const) &&
         (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos < A380PrimComputerFctl_P.CompareToConstant5_const)
         && (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_4_pos <
             A380PrimComputerFctl_P.CompareToConstant6_const))) ||
       (((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <
          A380PrimComputerFctl_P.CompareToConstant12_const) ||
         (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos <
          A380PrimComputerFctl_P.CompareToConstant15_const)) && (static_cast<int32_T>(((static_cast<uint32_T>
            (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos <=
             A380PrimComputerFctl_P.CompareToConstant29_const) +
            (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <=
             A380PrimComputerFctl_P.CompareToConstant16_const)) +
           (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos <=
            A380PrimComputerFctl_P.CompareToConstant17_const)) +
          (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_4_pos <=
           A380PrimComputerFctl_P.CompareToConstant18_const)) >= A380PrimComputerFctl_P.CompareToConstant19_const)));
    A380PrimComputerFctl_MATLABFunction_f(false, A380PrimComputerFctl_P.PulseNode5_isRisingEdge,
      &A380PrimComputerFctl_B.is_green_hydraulic_power_avail, &A380PrimComputerFctl_DWork.sf_MATLABFunction_m1);
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode7_isRisingEdge, &A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_ny);
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode6_isRisingEdge, &rtb_OR_i, &A380PrimComputerFctl_DWork.sf_MATLABFunction_gc);
    A380PrimComputerFctl_DWork.Memory_PreviousInput = A380PrimComputerFctl_P.Logic_table[(((static_cast<uint32_T>
      (A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail ||
       (((A380PrimComputerFctl_U.in.data.analog_inputs.left_body_wheel_speed <
          A380PrimComputerFctl_P.CompareToConstant13_const) ||
         (A380PrimComputerFctl_U.in.data.analog_inputs.left_wing_wheel_speed <
          A380PrimComputerFctl_P.CompareToConstant9_const)) &&
        ((A380PrimComputerFctl_U.in.data.analog_inputs.right_body_wheel_speed <
          A380PrimComputerFctl_P.CompareToConstant10_const) ||
         (A380PrimComputerFctl_U.in.data.analog_inputs.right_wing_wheel_speed <
          A380PrimComputerFctl_P.CompareToConstant14_const)))) << 1) + rtb_OR_i) << 1) +
      A380PrimComputerFctl_DWork.Memory_PreviousInput];
    A380PrimComputerFctl_DWork.Delay1_DSTATE = (A380PrimComputerFctl_B.phased_lift_dumping_active &&
      (A380PrimComputerFctl_B.is_green_hydraulic_power_avail ||
       (((A380PrimComputerFctl_U.in.data.analog_inputs.left_body_wheel_speed >=
          A380PrimComputerFctl_P.CompareToConstant7_const) ||
         (A380PrimComputerFctl_U.in.data.analog_inputs.left_wing_wheel_speed >=
          A380PrimComputerFctl_P.CompareToConstant8_const)) &&
        ((A380PrimComputerFctl_U.in.data.analog_inputs.right_body_wheel_speed >=
          A380PrimComputerFctl_P.CompareToConstant3_const) ||
         (A380PrimComputerFctl_U.in.data.analog_inputs.right_wing_wheel_speed >=
          A380PrimComputerFctl_P.CompareToConstant4_const)) && A380PrimComputerFctl_DWork.Memory_PreviousInput) ||
       A380PrimComputerFctl_DWork.Delay1_DSTATE));
    A380PrimComputerFctl_MATLABFunction_f(false, A380PrimComputerFctl_P.PulseNode4_isRisingEdge,
      &A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail, &A380PrimComputerFctl_DWork.sf_MATLABFunction_ff);
    A380PrimComputerFctl_DWork.Delay2_DSTATE = (A380PrimComputerFctl_B.phased_lift_dumping_active &&
      (A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail || A380PrimComputerFctl_DWork.Delay2_DSTATE));
    A380PrimComputerFctl_DWork.Delay3_DSTATE = (A380PrimComputerFctl_B.ground_spoilers_armed &&
      ((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos <= A380PrimComputerFctl_P.CompareToConstant1_const)
       && (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos <=
           A380PrimComputerFctl_P.CompareToConstant2_const)) && (A380PrimComputerFctl_B.is_green_hydraulic_power_avail ||
      A380PrimComputerFctl_DWork.Delay3_DSTATE));
    A380PrimComputerFctl_B.phased_lift_dumping_active = ((!A380PrimComputerFctl_DWork.Delay1_DSTATE) &&
      (A380PrimComputerFctl_DWork.Delay2_DSTATE || A380PrimComputerFctl_DWork.Delay3_DSTATE));
    A380PrimComputerFctl_MATLABFunction_n(A380PrimComputerFctl_U.in.data.analog_inputs.yellow_hyd_pressure_psi,
      A380PrimComputerFctl_P.HysteresisNode2_highTrigger, A380PrimComputerFctl_P.HysteresisNode2_lowTrigger, &rtb_y_pf,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_nj);
    A380PrimComputerFctl_MATLABFunction_c(((!A380PrimComputerFctl_U.in.data.discrete_inputs.yellow_low_pressure) &&
      rtb_y_pf), A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.ConfirmNode_isRisingEdge,
      A380PrimComputerFctl_P.ConfirmNode_timeDelay, &A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_cx);
    A380PrimComputerFctl_MATLABFunction_n(A380PrimComputerFctl_U.in.data.analog_inputs.green_hyd_pressure_psi,
      A380PrimComputerFctl_P.HysteresisNode3_highTrigger, A380PrimComputerFctl_P.HysteresisNode3_lowTrigger, &rtb_y_pf,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_e1);
    A380PrimComputerFctl_MATLABFunction_c(((!A380PrimComputerFctl_U.in.data.discrete_inputs.green_low_pressure) &&
      rtb_y_pf), A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.ConfirmNode2_isRisingEdge,
      A380PrimComputerFctl_P.ConfirmNode2_timeDelay, &A380PrimComputerFctl_B.is_green_hydraulic_power_avail,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_kq);
    rtb_OR_i = !A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
    rtb_OR_jr = !A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
    A380PrimComputerFctl_B.eha_ebha_elec_mode_inhibited = (A380PrimComputerFctl_U.in.general_logic.on_ground &&
      ((A380PrimComputerFctl_B.is_green_hydraulic_power_avail || A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail ||
        (!A380PrimComputerFctl_U.in.data.discrete_inputs.rat_contactor_closed) ||
        (!A380PrimComputerFctl_U.in.data.discrete_inputs.rat_deployed)) && ((rtb_OR_i ||
      (!A380PrimComputerFctl_P.Constant_Value_a)) && (rtb_OR_jr || (!A380PrimComputerFctl_P.Constant_Value_a)))));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.left_aileron_1_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.right_aileron_1_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.left_aileron_1_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.right_aileron_1_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      A380PrimComputerFctl_B.left_aileron_1_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
      A380PrimComputerFctl_B.right_aileron_1_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
    } else {
      A380PrimComputerFctl_B.left_aileron_1_avail = false;
      A380PrimComputerFctl_B.right_aileron_1_avail = false;
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word.Data;
    } else {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_p(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputerFctl_P.BitfromLabel2_bit, &rtb_y_ny);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      &rtb_protection_active);
    rtb_Equal = ((rtb_y_ny != 0U) && rtb_protection_active);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_p(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputerFctl_P.BitfromLabel1_bit, &rtb_y_ny);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.left_aileron_2_avail = true;
      A380PrimComputerFctl_B.right_aileron_2_avail = true;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.left_aileron_2_avail = true;
      A380PrimComputerFctl_B.right_aileron_2_avail = true;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      A380PrimComputerFctl_B.left_aileron_2_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
      A380PrimComputerFctl_B.right_aileron_2_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
    } else {
      A380PrimComputerFctl_B.left_aileron_2_avail = false;
      A380PrimComputerFctl_B.right_aileron_2_avail = false;
    }

    rtb_OR_o = !A380PrimComputerFctl_B.eha_ebha_elec_mode_inhibited;
    rtb_OR_d = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 || rtb_OR_o);
    A380PrimComputerFctl_B.left_aileron_2_engaged = (A380PrimComputerFctl_B.left_aileron_2_avail && ((!rtb_Equal) &&
      rtb_OR_d));
    A380PrimComputerFctl_B.right_aileron_2_engaged = (A380PrimComputerFctl_B.right_aileron_2_avail &&
      (((!rtb_protection_active) || (rtb_y_ny == 0U)) && rtb_OR_d));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.left_spoiler_electric_mode_avail = true;
      A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.right_spoiler_electric_mode_avail = true;
      A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged = (rtb_OR_i && rtb_OR_o);
      A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged =
        A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged =
        A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged;
      A380PrimComputerFctl_B.elevator_1_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
    } else {
      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
        A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail =
          A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
        A380PrimComputerFctl_B.left_spoiler_electric_mode_avail = true;
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail =
          A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
        A380PrimComputerFctl_B.right_spoiler_electric_mode_avail = true;
      } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
        A380PrimComputerFctl_B.left_spoiler_electric_mode_avail = true;
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail =
          A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
        A380PrimComputerFctl_B.right_spoiler_electric_mode_avail = true;
      } else {
        A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail = false;
        A380PrimComputerFctl_B.left_spoiler_electric_mode_avail = false;
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail = false;
        A380PrimComputerFctl_B.right_spoiler_electric_mode_avail = false;
      }

      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 ||
          A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged =
          (A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail &&
           A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail);
        A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged = false;
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged =
          A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged;
        A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged = false;
      } else {
        A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged = false;
        A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged = false;
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged = false;
        A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged = false;
      }

      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
        A380PrimComputerFctl_B.elevator_1_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
      } else {
        A380PrimComputerFctl_B.elevator_1_avail = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 &&
          A380PrimComputerFctl_B.is_green_hydraulic_power_avail);
      }
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word.Data;
    } else {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      &rtb_protection_active);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_p(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputerFctl_P.BitfromLabel1_bit_n, &rtb_y_ny);
    rtb_protection_active = (rtb_protection_active && (rtb_y_ny != 0U));
    A380PrimComputerFctl_B.elevator_2_avail = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1 ||
      (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 ||
       (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 &&
        A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail)));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_protection_active = ((!rtb_protection_active) && rtb_OR_o);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_protection_active = ((!rtb_protection_active) && rtb_OR_o);
    } else {
      rtb_protection_active = A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3;
    }

    A380PrimComputerFctl_B.elevator_2_engaged = (A380PrimComputerFctl_B.elevator_2_avail && rtb_protection_active);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      &rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word,
      &rtb_protection_active);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_l, &rtb_y_ny);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_protection_active = (rtb_OR_d && (rtb_DataTypeConversion1_j != 0U));
    } else {
      rtb_protection_active = (rtb_protection_active && (rtb_y_ny != 0U));
    }

    A380PrimComputerFctl_B.elevator_3_avail = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1 ||
      A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_protection_active = ((!rtb_protection_active) && rtb_OR_o);
    } else {
      rtb_protection_active = (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 && ((!rtb_protection_active) &&
        rtb_OR_o));
    }

    A380PrimComputerFctl_B.elevator_3_engaged = (A380PrimComputerFctl_B.elevator_3_avail && rtb_protection_active);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      &rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_b, &rtb_y_ny);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.ths_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
      rtb_protection_active = ((!rtb_Equal) || (rtb_y_ny == 0U));
    } else {
      A380PrimComputerFctl_B.ths_avail = ((!A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) &&
        (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3 &&
         A380PrimComputerFctl_B.is_green_hydraulic_power_avail));
      rtb_protection_active = ((!A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) &&
        A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3);
    }

    A380PrimComputerFctl_B.ths_engaged_h = (A380PrimComputerFctl_B.ths_avail && rtb_protection_active);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_k, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_e, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      &rtb_OR_d);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_protection_active = (rtb_DataTypeConversion1_j != 0U);
    } else {
      rtb_protection_active = (rtb_y_ny != 0U);
    }

    rtb_OR_a = (rtb_protection_active && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_c, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit, &rtb_y_dp);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
    } else {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_p(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputerFctl_P.BitfromLabel6_bit, &rtb_y_cyi);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      &rtb_y_pf);
    rtb_y_pf = ((rtb_y_cyi != 0U) && rtb_y_pf);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
    } else {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
      A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_p(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputerFctl_P.BitfromLabel9_bit, &rtb_y_cyi);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_p(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputerFctl_P.BitfromLabel10_bit, &rtb_y_jg);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      &rtb_Equal);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_protection_active = (rtb_y_cyi != 0U);
    } else {
      rtb_protection_active = (rtb_y_jg != 0U);
    }

    rtb_AND3_k = (rtb_protection_active && rtb_Equal);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
      A380PrimComputerFctl_B.rudder_1_electric_mode_avail = true;
      rtb_Equal = true;
      rtb_protection_active = ((!rtb_OR_a) && rtb_OR_jr && (!rtb_y_pf) && (!rtb_AND3_k) && rtb_OR_o);
    } else {
      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
        A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
        A380PrimComputerFctl_B.rudder_1_electric_mode_avail = true;
      } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
        A380PrimComputerFctl_B.rudder_1_electric_mode_avail = true;
      } else {
        A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail = false;
        A380PrimComputerFctl_B.rudder_1_electric_mode_avail = false;
      }

      if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2 ||
          A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
        rtb_Equal = !rtb_OR_a;
        if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
          rtb_protection_active = (rtb_y_ny != 0U);
        } else {
          rtb_protection_active = (rtb_y_dp != 0U);
        }

        rtb_protection_active = (rtb_Equal && ((!rtb_OR_d) || (!rtb_protection_active)) &&
          (!A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail) && (!rtb_y_pf) && (!rtb_AND3_k) && rtb_OR_o);
      } else {
        rtb_Equal = false;
        rtb_protection_active = false;
      }
    }

    A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged = (A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail &&
      rtb_Equal);
    A380PrimComputerFctl_B.rudder_1_electric_mode_engaged = (A380PrimComputerFctl_B.rudder_1_electric_mode_avail &&
      rtb_protection_active);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_status_word,
      &rtb_OR_d);
    rtb_protection_active = ((rtb_y_ny != 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      &rtb_Equal);
    rtb_Equal = ((rtb_y_ny != 0U) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      &rtb_y_pf);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.rudder_2_hydraulic_mode_avail = A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
      A380PrimComputerFctl_B.rudder_2_electric_mode_avail = true;
      rtb_OR_d = true;
      rtb_protection_active = ((!rtb_protection_active) && rtb_OR_i && (!rtb_Equal) && ((rtb_y_ny == 0U) || (!rtb_y_pf))
        && rtb_OR_o);
    } else {
      A380PrimComputerFctl_B.rudder_2_hydraulic_mode_avail = false;
      A380PrimComputerFctl_B.rudder_2_electric_mode_avail = false;
      rtb_OR_d = false;
      rtb_protection_active = false;
    }

    A380PrimComputerFctl_B.rudder_2_hydraulic_mode_engaged = (A380PrimComputerFctl_B.rudder_2_hydraulic_mode_avail &&
      rtb_OR_d);
    A380PrimComputerFctl_B.rudder_2_electric_mode_engaged = (A380PrimComputerFctl_B.rudder_2_electric_mode_avail &&
      rtb_protection_active);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word,
      &rtb_OR_o);
    rtb_AND3_k = ((rtb_y_ny != 0U) && rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_c, &rtb_y_ny);
    rtb_OR_a = ((rtb_y_ny != 0U) && rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_p, &rtb_y_ny);
    rtb_AND2_ac = ((rtb_y_ny != 0U) && rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_n, &rtb_y_ny);
    rtb_AND1_l = ((rtb_y_ny != 0U) && rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit_j, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word,
      &rtb_y_pf);
    rtb_AND4_n = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit_i, &rtb_y_ny);
    rtb_AND6_m = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel6_bit_j, &rtb_y_ny);
    rtb_AND7 = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit_n, &rtb_y_ny);
    rtb_AND8 = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_n, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      &rtb_OR_d);
    rtb_AND13 = ((rtb_y_ny != 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel9_bit_b, &rtb_y_ny);
    rtb_OR_o = ((rtb_y_ny != 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel10_bit_h, &rtb_y_ny);
    rtb_protection_active = ((rtb_y_ny != 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel11_bit, &rtb_y_ny);
    rtb_OR_d = ((rtb_y_ny != 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel14_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word,
      &rtb_Equal);
    rtb_AND15 = ((rtb_y_ny != 0U) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel15_bit, &rtb_y_ny);
    rtb_AND16_l = ((rtb_y_ny != 0U) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel16_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word,
      &rtb_y_pf);
    rtb_Equal = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word,
      A380PrimComputerFctl_P.BitfromLabel17_bit, &rtb_y_ny);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      leftInboardAilEngaged = (A380PrimComputerFctl_B.left_aileron_1_avail || rtb_AND2_ac);
      rtb_AND10_b = (A380PrimComputerFctl_B.right_aileron_1_avail || rtb_AND1_l);
      rtb_AND2_ac = (A380PrimComputerFctl_B.left_aileron_2_engaged || rtb_AND4_n);
      rtb_AND1_l = (A380PrimComputerFctl_B.right_aileron_2_engaged || rtb_AND6_m);
      A380PrimComputerFctl_B.left_outboard_aileron_engaged = (rtb_AND3_k || rtb_AND7);
      A380PrimComputerFctl_B.right_outboard_aileron_engaged = (rtb_OR_a || rtb_AND8);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      leftInboardAilEngaged = (A380PrimComputerFctl_B.left_aileron_2_engaged || rtb_AND3_k);
      rtb_AND10_b = (A380PrimComputerFctl_B.right_aileron_2_engaged || rtb_OR_a);
      rtb_AND2_ac = (rtb_AND2_ac || rtb_AND4_n);
      rtb_AND1_l = (rtb_AND1_l || rtb_AND6_m);
      A380PrimComputerFctl_B.left_outboard_aileron_engaged = (A380PrimComputerFctl_B.left_aileron_1_avail || rtb_AND7);
      A380PrimComputerFctl_B.right_outboard_aileron_engaged = (A380PrimComputerFctl_B.right_aileron_1_avail || rtb_AND8);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      leftInboardAilEngaged = (rtb_AND3_k || rtb_AND7);
      rtb_AND10_b = (rtb_OR_a || rtb_AND8);
      rtb_AND2_ac = (A380PrimComputerFctl_B.left_aileron_1_avail || rtb_AND2_ac);
      rtb_AND1_l = (A380PrimComputerFctl_B.right_aileron_1_avail || rtb_AND1_l);
      A380PrimComputerFctl_B.left_outboard_aileron_engaged = (rtb_AND4_n ||
        A380PrimComputerFctl_B.left_aileron_2_engaged);
      A380PrimComputerFctl_B.right_outboard_aileron_engaged = (rtb_AND6_m ||
        A380PrimComputerFctl_B.right_aileron_2_engaged);
    } else {
      leftInboardAilEngaged = false;
      rtb_AND10_b = false;
      rtb_AND2_ac = false;
      rtb_AND1_l = false;
      A380PrimComputerFctl_B.left_outboard_aileron_engaged = false;
      A380PrimComputerFctl_B.right_outboard_aileron_engaged = false;
    }

    A380PrimComputerFctl_B.left_inboard_aileron_engaged = (leftInboardAilEngaged || (rtb_AND13 || rtb_AND15));
    A380PrimComputerFctl_B.right_inboard_aileron_engaged = (rtb_AND10_b || (rtb_OR_o || rtb_AND16_l));
    A380PrimComputerFctl_B.left_midboard_aileron_engaged = (rtb_AND2_ac || (rtb_protection_active || rtb_Equal));
    A380PrimComputerFctl_B.right_midboard_aileron_engaged = (rtb_AND1_l || (rtb_OR_d || ((rtb_y_ny != 0U) && rtb_y_pf)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      &rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_g, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_1_engaged = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_pc, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_1_engaged = (rtb_Equal && (A380PrimComputerFctl_B.spoiler_pair_1_engaged ||
      (rtb_y_ny != 0U)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      &rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_i, &rtb_y_ny);
    rtb_OR_a = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_n, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_2_engaged = (rtb_Equal && (rtb_OR_a || (rtb_y_ny != 0U)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word,
      &rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_nd, &rtb_y_ny);
    rtb_OR_a = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_d, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_3_engaged = (rtb_Equal && (rtb_OR_a || (rtb_y_ny != 0U)));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.left_inboard_aileron_deg_g =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputerFctl_B.right_inboard_aileron_deg_b =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputerFctl_B.left_midboard_aileron_deg_f =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputerFctl_B.right_midboard_aileron_deg_f =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.left_outboard_aileron_deg_g =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_outboard_aileron_deg_g =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.right_outboard_aileron_deg_m =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_outboard_aileron_deg_m =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.left_inboard_aileron_deg_g =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputerFctl_B.right_inboard_aileron_deg_b =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.left_midboard_aileron_deg_f =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_midboard_aileron_deg_f =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.right_midboard_aileron_deg_f =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_midboard_aileron_deg_f =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
      }

      A380PrimComputerFctl_B.left_outboard_aileron_deg_g =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputerFctl_B.right_outboard_aileron_deg_m =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.left_inboard_aileron_deg_g =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_inboard_aileron_deg_g =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.right_inboard_aileron_deg_b =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_inboard_aileron_deg_b =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }

      A380PrimComputerFctl_B.left_midboard_aileron_deg_f =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputerFctl_B.right_midboard_aileron_deg_f =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputerFctl_B.left_outboard_aileron_deg_g =
        A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputerFctl_B.right_outboard_aileron_deg_m =
        A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg;
    } else {
      A380PrimComputerFctl_B.left_inboard_aileron_deg_g = 0.0;
      A380PrimComputerFctl_B.right_inboard_aileron_deg_b = 0.0;
      A380PrimComputerFctl_B.left_midboard_aileron_deg_f = 0.0;
      A380PrimComputerFctl_B.right_midboard_aileron_deg_f = 0.0;
      A380PrimComputerFctl_B.left_outboard_aileron_deg_g = 0.0;
      A380PrimComputerFctl_B.right_outboard_aileron_deg_m = 0.0;
    }

    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_l, &rtb_y_ny);
    rtb_OR_a = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel9_bit_g, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.spoiler_status_word,
      &rtb_OR_d);
    rtb_protection_active = ((rtb_OR_a || (rtb_y_ny != 0U)) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel10_bit_j, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_7_engaged = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel11_bit_j, &rtb_y_ny);
    rtb_OR_d = ((A380PrimComputerFctl_B.spoiler_pair_7_engaged || (rtb_y_ny != 0U)) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel14_bit_p, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_7_engaged = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel15_bit_i, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.spoiler_status_word,
      &rtb_Equal);
    rtb_y_pf = ((A380PrimComputerFctl_B.spoiler_pair_7_engaged || (rtb_y_ny != 0U)) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel12_bit, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_7_engaged = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel13_bit, &rtb_y_ny);
    rtb_Equal = ((A380PrimComputerFctl_B.spoiler_pair_7_engaged || (rtb_y_ny != 0U)) && rtb_Equal);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.spoiler_pair_4_engaged = (rtb_y_pf || rtb_Equal);
      A380PrimComputerFctl_B.spoiler_pair_5_engaged = (rtb_protection_active || rtb_OR_d);
      A380PrimComputerFctl_B.spoiler_pair_6_engaged = (A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged ||
        A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged ||
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged ||
        A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.spoiler_pair_4_engaged = (rtb_y_pf || rtb_Equal);
      A380PrimComputerFctl_B.spoiler_pair_5_engaged = (A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged ||
        A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged ||
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged ||
        A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged);
      A380PrimComputerFctl_B.spoiler_pair_6_engaged = (rtb_protection_active || rtb_OR_d);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      A380PrimComputerFctl_B.spoiler_pair_4_engaged = (A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged ||
        A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged ||
        A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged ||
        A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged);
      A380PrimComputerFctl_B.spoiler_pair_5_engaged = (rtb_y_pf || rtb_Equal);
      A380PrimComputerFctl_B.spoiler_pair_6_engaged = (rtb_protection_active || rtb_OR_d);
    } else {
      A380PrimComputerFctl_B.spoiler_pair_4_engaged = false;
      A380PrimComputerFctl_B.spoiler_pair_5_engaged = false;
      A380PrimComputerFctl_B.spoiler_pair_6_engaged = false;
    }

    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      &rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_l, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_7_engaged = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_f, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_7_engaged = (rtb_Equal && (A380PrimComputerFctl_B.spoiler_pair_7_engaged ||
      (rtb_y_ny != 0U)));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      &rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_p, &rtb_y_ny);
    rtb_OR_a = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_b, &rtb_y_ny);
    A380PrimComputerFctl_B.spoiler_pair_8_engaged = (rtb_Equal && (rtb_OR_a || (rtb_y_ny != 0U)));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.left_spoiler_4_deg_g =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.right_spoiler_4_deg_a =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.left_spoiler_5_deg_d =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.right_spoiler_5_deg_m =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.left_spoiler_6_deg_o = A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputerFctl_B.right_spoiler_6_deg_d = A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.left_spoiler_4_deg_g =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.right_spoiler_4_deg_a =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.left_spoiler_5_deg_d = A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputerFctl_B.right_spoiler_5_deg_m = A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputerFctl_B.left_spoiler_6_deg_o =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.right_spoiler_6_deg_d =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      A380PrimComputerFctl_B.left_spoiler_4_deg_g = A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputerFctl_B.right_spoiler_4_deg_a = A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputerFctl_B.left_spoiler_5_deg_d =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.right_spoiler_5_deg_m =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.left_spoiler_6_deg_o =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputerFctl_B.right_spoiler_6_deg_d =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else {
      A380PrimComputerFctl_B.left_spoiler_4_deg_g = 0.0;
      A380PrimComputerFctl_B.right_spoiler_4_deg_a = 0.0;
      A380PrimComputerFctl_B.left_spoiler_5_deg_d = 0.0;
      A380PrimComputerFctl_B.right_spoiler_5_deg_m = 0.0;
      A380PrimComputerFctl_B.left_spoiler_6_deg_o = 0.0;
      A380PrimComputerFctl_B.right_spoiler_6_deg_d = 0.0;
    }

    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel16_bit_b, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word,
      &rtb_y_pf);
    rtb_AND6_m = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel17_bit_i, &rtb_y_ny);
    rtb_AND8 = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel18_bit, &rtb_y_ny);
    rtb_AND13 = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel19_bit, &rtb_y_ny);
    rtb_AND4_n = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel20_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      &rtb_Equal);
    rtb_AND15 = ((rtb_y_ny != 0U) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel21_bit, &rtb_y_ny);
    rtb_AND2_ac = ((rtb_y_ny != 0U) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel22_bit, &rtb_y_ny);
    rtb_AND19 = ((rtb_y_ny != 0U) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel23_bit, &rtb_y_ny);
    rtb_AND16_l = ((rtb_y_ny != 0U) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_lr, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      &rtb_y_pf);
    rtb_OR_a = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_g, &rtb_y_ny);
    rtb_AND7 = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_k, &rtb_y_ny);
    rtb_protection_active = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit_n, &rtb_y_ny);
    rtb_Equal = ((rtb_y_ny != 0U) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit_e, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      &rtb_OR_o);
    rtb_y_pf = ((rtb_y_ny != 0U) && rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel6_bit_b, &rtb_y_ny);
    rtb_AND3_k = ((rtb_y_ny != 0U) && rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit_p, &rtb_y_ny);
    rtb_OR_o = ((rtb_y_ny != 0U) && rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_d, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      &rtb_OR_d);
    rtb_AND1_l = ((rtb_y_ny != 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel9_bit_e, &rtb_y_ny);
    rtb_AND10_b = ((rtb_y_ny != 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word,
      A380PrimComputerFctl_P.BitfromLabel11_bit_n, &rtb_y_ny);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      leftInboardAilEngaged = (A380PrimComputerFctl_B.elevator_2_engaged || rtb_AND15);
      rtb_AND19 = (rtb_AND2_ac || rtb_AND13);
      rtb_AND8 = (A380PrimComputerFctl_B.elevator_1_avail || rtb_AND8);
      rtb_AND6_m = (rtb_AND6_m || A380PrimComputerFctl_B.elevator_3_engaged);
      rtb_AND13 = (A380PrimComputerFctl_B.ths_engaged_h || rtb_AND16_l);
      A380PrimComputerFctl_B.left_inboard_elevator_deg_k =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.right_inboard_elevator_deg_o =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_inboard_elevator_deg_o =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      A380PrimComputerFctl_B.left_outboard_elevator_deg_p =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg;
      A380PrimComputerFctl_B.right_outboard_elevator_deg_g =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_3_pos_deg;
      A380PrimComputerFctl_B.ths_deg_o = A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      leftInboardAilEngaged = (rtb_AND15 || rtb_AND8);
      rtb_AND19 = (A380PrimComputerFctl_B.elevator_3_engaged || rtb_AND2_ac);
      rtb_AND8 = (A380PrimComputerFctl_B.elevator_2_engaged || rtb_AND6_m);
      rtb_AND6_m = (A380PrimComputerFctl_B.elevator_1_avail || rtb_AND13);
      rtb_AND13 = (rtb_AND4_n || rtb_AND16_l);
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.left_inboard_elevator_deg_k =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_inboard_elevator_deg_k =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
      }

      A380PrimComputerFctl_B.right_inboard_elevator_deg_o =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_3_pos_deg;
      A380PrimComputerFctl_B.left_outboard_elevator_deg_p =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg;
      A380PrimComputerFctl_B.right_outboard_elevator_deg_g =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.ths_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.ths_deg_o = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.ths_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.ths_deg_o = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.ths_position_deg.Data;
      }
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      leftInboardAilEngaged = (A380PrimComputerFctl_B.elevator_1_avail || rtb_AND8);
      rtb_AND19 = (A380PrimComputerFctl_B.elevator_2_engaged || rtb_AND19);
      rtb_AND8 = (rtb_AND6_m || rtb_AND2_ac);
      rtb_AND6_m = (rtb_AND15 || rtb_AND13);
      rtb_AND13 = (A380PrimComputerFctl_B.ths_engaged_h || rtb_AND4_n);
      A380PrimComputerFctl_B.left_inboard_elevator_deg_k =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg;
      A380PrimComputerFctl_B.right_inboard_elevator_deg_o =
        A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.left_outboard_elevator_deg_p =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_outboard_elevator_deg_p =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      }

      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.right_outboard_elevator_deg_g =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_outboard_elevator_deg_g =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      A380PrimComputerFctl_B.ths_deg_o = A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg;
    } else {
      leftInboardAilEngaged = false;
      rtb_AND19 = false;
      rtb_AND8 = false;
      rtb_AND6_m = false;
      rtb_AND13 = false;
      A380PrimComputerFctl_B.left_inboard_elevator_deg_k = 0.0;
      A380PrimComputerFctl_B.right_inboard_elevator_deg_o = 0.0;
      A380PrimComputerFctl_B.left_outboard_elevator_deg_p = 0.0;
      A380PrimComputerFctl_B.right_outboard_elevator_deg_g = 0.0;
      A380PrimComputerFctl_B.ths_deg_o = 0.0;
    }

    A380PrimComputerFctl_B.left_inboard_elevator_engaged = (leftInboardAilEngaged || (rtb_AND1_l || rtb_AND7));
    A380PrimComputerFctl_B.right_inboard_elevator_engaged = (rtb_AND19 || (rtb_AND10_b || rtb_OR_o));
    A380PrimComputerFctl_B.left_outboard_elevator_engaged = (rtb_AND8 || (rtb_OR_a || rtb_AND3_k));
    A380PrimComputerFctl_B.right_outboard_elevator_engaged = (rtb_AND6_m || (rtb_y_pf || rtb_protection_active));
    A380PrimComputerFctl_B.ths_engaged = (rtb_AND13 || (((rtb_y_ny != 0U) && rtb_OR_d) || rtb_Equal));
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel38_bit, &rtb_y_ny);
    rtb_OR_a = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel39_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      &rtb_Equal);
    rtb_OR_a = ((rtb_OR_a || (rtb_y_ny != 0U)) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel32_bit, &rtb_y_ny);
    A380PrimComputerFctl_B.protection_ap_disconnect = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel33_bit, &rtb_y_ny);
    rtb_Equal = ((A380PrimComputerFctl_B.protection_ap_disconnect || (rtb_y_ny != 0U)) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel36_bit, &rtb_y_ny);
    A380PrimComputerFctl_B.protection_ap_disconnect = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel37_bit, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_status_word,
      &rtb_y_pf);
    rtb_AND13 = ((A380PrimComputerFctl_B.protection_ap_disconnect || (rtb_y_ny != 0U)) && rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_m, &rtb_y_ny);
    A380PrimComputerFctl_B.protection_ap_disconnect = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit_b, &rtb_y_ny);
    rtb_AND3_k = (A380PrimComputerFctl_B.protection_ap_disconnect || (rtb_y_ny != 0U));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      &rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_pt, &rtb_y_ny);
    A380PrimComputerFctl_B.protection_ap_disconnect = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_h, &rtb_y_ny);
    rtb_protection_active = (A380PrimComputerFctl_B.protection_ap_disconnect || (rtb_y_ny != 0U));
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit_d, &rtb_y_ny);
    A380PrimComputerFctl_B.protection_ap_disconnect = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel6_bit_p, &rtb_y_ny);
    rtb_AND6_m = (A380PrimComputerFctl_B.protection_ap_disconnect || (rtb_y_ny != 0U));
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word,
      &rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit_g, &rtb_y_ny);
    A380PrimComputerFctl_B.protection_ap_disconnect = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      A380PrimComputerFctl_P.BitfromLabel8_bit_i, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word,
      &rtb_OR_d);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_OR_a = (A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged ||
                  A380PrimComputerFctl_B.rudder_1_electric_mode_engaged || rtb_OR_a);
      rtb_Equal = (A380PrimComputerFctl_B.rudder_2_hydraulic_mode_engaged ||
                   A380PrimComputerFctl_B.rudder_2_electric_mode_engaged || rtb_AND13);
      A380PrimComputerFctl_B.upper_rudder_deg_m = A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg;
      A380PrimComputerFctl_B.lower_rudder_deg_c = A380PrimComputerFctl_U.in.data.analog_inputs.rudder_2_pos_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_OR_a = (A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged ||
                  A380PrimComputerFctl_B.rudder_1_electric_mode_engaged || rtb_OR_a);
      rtb_Equal = (rtb_Equal || rtb_AND13);
      A380PrimComputerFctl_B.upper_rudder_deg_m = A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg;
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.lower_rudder_deg_c =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.lower_rudder_deg_c =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3) {
      rtb_OR_a = (rtb_OR_a || rtb_AND13);
      rtb_Equal = (A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged ||
                   A380PrimComputerFctl_B.rudder_1_electric_mode_engaged || rtb_Equal);
      if (A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputerFctl_B.upper_rudder_deg_m =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
      } else {
        A380PrimComputerFctl_B.upper_rudder_deg_m =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }

      A380PrimComputerFctl_B.lower_rudder_deg_c = A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg;
    } else {
      rtb_OR_a = false;
      rtb_Equal = false;
      A380PrimComputerFctl_B.upper_rudder_deg_m = 0.0;
      A380PrimComputerFctl_B.lower_rudder_deg_c = 0.0;
    }

    A380PrimComputerFctl_B.upper_rudder_engaged = (rtb_OR_a || (rtb_AND3_k && rtb_OR_o) || (rtb_AND6_m && rtb_y_pf));
    A380PrimComputerFctl_B.lower_rudder_engaged = (rtb_Equal || (rtb_protection_active && rtb_OR_o) ||
      ((A380PrimComputerFctl_B.protection_ap_disconnect || (rtb_y_ny != 0U)) && rtb_OR_d));
    A380PrimComputerFctl_MATLABFunction_c(A380PrimComputerFctl_U.in.data.sim_data.slew_on,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.ConfirmNode_isRisingEdge_o,
      A380PrimComputerFctl_P.ConfirmNode_timeDelay_d, &rtb_y_pf, &A380PrimComputerFctl_DWork.sf_MATLABFunction_nb);
    A380PrimComputerFctl_B.abnormal_condition_law_active = ((!rtb_y_pf) &&
      (!A380PrimComputerFctl_U.in.general_logic.on_ground) &&
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
    A380PrimComputerFctl_DWork.abnormalConditionWasActive = (A380PrimComputerFctl_B.abnormal_condition_law_active ||
      ((!A380PrimComputerFctl_U.in.general_logic.on_ground) && A380PrimComputerFctl_DWork.abnormalConditionWasActive));
    nz = ((A380PrimComputerFctl_B.left_inboard_elevator_engaged + A380PrimComputerFctl_B.right_inboard_elevator_engaged)
          + A380PrimComputerFctl_B.left_outboard_elevator_engaged) +
      A380PrimComputerFctl_B.right_outboard_elevator_engaged;
    b_x[0] = A380PrimComputerFctl_B.left_inboard_aileron_engaged;
    b_x[1] = A380PrimComputerFctl_B.right_inboard_aileron_engaged;
    b_x[2] = A380PrimComputerFctl_B.left_midboard_aileron_engaged;
    b_x[3] = A380PrimComputerFctl_B.right_midboard_aileron_engaged;
    b_x[4] = A380PrimComputerFctl_B.left_outboard_aileron_engaged;
    b_x[5] = A380PrimComputerFctl_B.right_outboard_aileron_engaged;
    b_nz = A380PrimComputerFctl_B.left_inboard_aileron_engaged;
    for (prim3LawCap = 0; prim3LawCap < 5; prim3LawCap++) {
      b_nz += b_x[prim3LawCap + 1];
    }

    if (A380PrimComputerFctl_U.in.general_logic.triple_adr_failure ||
        A380PrimComputerFctl_B.abnormal_condition_law_active) {
      A380PrimComputerFctl_B.pitch_law_capability = a380_pitch_efcs_law::DirectLaw;
      A380PrimComputerFctl_B.lateral_law_capability = a380_lateral_efcs_law::DirectLaw;
    } else if (A380PrimComputerFctl_U.in.general_logic.double_lgciu_failure) {
      A380PrimComputerFctl_B.pitch_law_capability = a380_pitch_efcs_law::AlternateLaw2;
      A380PrimComputerFctl_B.lateral_law_capability = a380_lateral_efcs_law::DirectLaw;
    } else {
      if ((nz == 2) || A380PrimComputerFctl_U.in.general_logic.double_adr_failure ||
          A380PrimComputerFctl_U.in.general_logic.double_ir_failure) {
        A380PrimComputerFctl_B.pitch_law_capability = a380_pitch_efcs_law::AlternateLaw1B;
      } else if (A380PrimComputerFctl_DWork.abnormalConditionWasActive || ((A380PrimComputerFctl_B.upper_rudder_engaged &&
        (!A380PrimComputerFctl_B.lower_rudder_engaged)) || ((!A380PrimComputerFctl_B.upper_rudder_engaged) &&
                   A380PrimComputerFctl_B.lower_rudder_engaged)) || (nz == 3) || (b_nz == 4) ||
                 A380PrimComputerFctl_U.in.general_logic.slats_locked ||
                 A380PrimComputerFctl_U.in.general_logic.flaps_locked ||
                 A380PrimComputerFctl_U.in.general_logic.all_sfcc_lost ||
                 (A380PrimComputerFctl_U.in.general_logic.all_ra_failure &&
                  A380PrimComputerFctl_U.in.general_logic.landing_gear_down &&
                  (!A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged)) || (rtb_OR_jr && rtb_OR_i) ||
                 (!A380PrimComputerFctl_B.ths_avail)) {
        A380PrimComputerFctl_B.pitch_law_capability = a380_pitch_efcs_law::AlternateLaw1A;
      } else {
        A380PrimComputerFctl_B.pitch_law_capability = a380_pitch_efcs_law::NormalLaw;
      }

      A380PrimComputerFctl_B.lateral_law_capability = a380_lateral_efcs_law::NormalLaw;
    }

    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel_bit_c, &rtb_y_ny);
    rtb_OR_i = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel1_bit_o, &rtb_y_ny);
    rtb_OR_jr = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_hn, &rtb_y_ny);
    rtb_protection_active = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel6_bit_h, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      &rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_g(rtb_OR_i, rtb_OR_jr, rtb_protection_active, rtb_y_pf, &rtb_law_p);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel3_bit_b, &rtb_y_ny);
    rtb_OR_i = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel4_bit_g, &rtb_y_ny);
    rtb_OR_jr = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel5_bit_j, &rtb_y_ny);
    rtb_protection_active = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel7_bit_o, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl_law_status_word,
      &rtb_y_pf);
    A380PrimComputerFctl_MATLABFunction_g(rtb_OR_i, rtb_OR_jr, rtb_protection_active, rtb_y_pf, &rtb_law);
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      nz = static_cast<int32_T>(A380PrimComputerFctl_B.pitch_law_capability);
      b_nz = static_cast<int32_T>(rtb_law_p);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      nz = static_cast<int32_T>(rtb_law_p);
      b_nz = static_cast<int32_T>(A380PrimComputerFctl_B.pitch_law_capability);
      prim3LawCap = static_cast<int32_T>(rtb_law);
    } else {
      nz = static_cast<int32_T>(rtb_law_p);
      b_nz = static_cast<int32_T>(rtb_law);
      prim3LawCap = static_cast<int32_T>(A380PrimComputerFctl_B.pitch_law_capability);
    }

    d_nz = 1;
    if (nz > b_nz) {
      nz = b_nz;
      d_nz = 2;
    }

    if (nz > prim3LawCap) {
      d_nz = 3;
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.is_master_prim = (d_nz == 1);
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.is_master_prim = (d_nz == 2);
    } else {
      A380PrimComputerFctl_B.is_master_prim = (d_nz == 3);
    }

    rtb_protection_active = !A380PrimComputerFctl_B.is_master_prim;
    if (rtb_protection_active) {
      A380PrimComputerFctl_B.active_pitch_law = a380_pitch_efcs_law::None;
      A380PrimComputerFctl_B.active_lateral_law = a380_lateral_efcs_law::None;
    } else {
      A380PrimComputerFctl_B.active_pitch_law = A380PrimComputerFctl_B.pitch_law_capability;
      A380PrimComputerFctl_B.active_lateral_law = A380PrimComputerFctl_B.lateral_law_capability;
    }

    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.data.discrete_inputs.capt_priority_takeover_pressed,
      A380PrimComputerFctl_P.PulseNode_isRisingEdge, &rtb_Equal, &A380PrimComputerFctl_DWork.sf_MATLABFunction_g4);
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.data.discrete_inputs.fo_priority_takeover_pressed,
      A380PrimComputerFctl_P.PulseNode1_isRisingEdge, &rtb_y_pf, &A380PrimComputerFctl_DWork.sf_MATLABFunction_nu);
    if (rtb_Equal) {
      A380PrimComputerFctl_DWork.pRightStickDisabled = true;
      A380PrimComputerFctl_DWork.pLeftStickDisabled = false;
    } else if (rtb_y_pf) {
      A380PrimComputerFctl_DWork.pLeftStickDisabled = true;
      A380PrimComputerFctl_DWork.pRightStickDisabled = false;
    }

    if (A380PrimComputerFctl_DWork.pRightStickDisabled &&
        ((!A380PrimComputerFctl_U.in.data.discrete_inputs.capt_priority_takeover_pressed) &&
         (!A380PrimComputerFctl_DWork.Delay1_DSTATE_n))) {
      A380PrimComputerFctl_DWork.pRightStickDisabled = false;
    } else if (A380PrimComputerFctl_DWork.pLeftStickDisabled) {
      A380PrimComputerFctl_DWork.pLeftStickDisabled =
        (A380PrimComputerFctl_U.in.data.discrete_inputs.fo_priority_takeover_pressed ||
         A380PrimComputerFctl_DWork.Delay_DSTATE_c);
    }

    A380PrimComputerFctl_MATLABFunction_c((A380PrimComputerFctl_DWork.pLeftStickDisabled &&
      (A380PrimComputerFctl_U.in.data.discrete_inputs.fo_priority_takeover_pressed ||
       A380PrimComputerFctl_DWork.Delay_DSTATE_c)), A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.ConfirmNode1_isRisingEdge, A380PrimComputerFctl_P.ConfirmNode1_timeDelay,
      &A380PrimComputerFctl_B.left_sidestick_priority_locked, &A380PrimComputerFctl_DWork.sf_MATLABFunction_j2);
    A380PrimComputerFctl_MATLABFunction_c((A380PrimComputerFctl_DWork.pRightStickDisabled &&
      (A380PrimComputerFctl_U.in.data.discrete_inputs.capt_priority_takeover_pressed ||
       A380PrimComputerFctl_DWork.Delay1_DSTATE_n)), A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.ConfirmNode_isRisingEdge_j, A380PrimComputerFctl_P.ConfirmNode_timeDelay_a,
      &A380PrimComputerFctl_B.right_sidestick_priority_locked, &A380PrimComputerFctl_DWork.sf_MATLABFunction_g2);
    if (!A380PrimComputerFctl_DWork.pRightStickDisabled) {
      rtb_Y_ms = A380PrimComputerFctl_U.in.data.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant_Value_p;
    }

    if (A380PrimComputerFctl_DWork.pLeftStickDisabled) {
      rtb_Y_gl = A380PrimComputerFctl_P.Constant_Value_p;
    } else {
      rtb_Y_gl = A380PrimComputerFctl_U.in.data.analog_inputs.capt_pitch_stick_pos;
    }

    A380PrimComputerFctl_B.total_sidestick_pitch_command = rtb_Y_ms + rtb_Y_gl;
    if (A380PrimComputerFctl_B.total_sidestick_pitch_command > A380PrimComputerFctl_P.Saturation_UpperSat_d) {
      A380PrimComputerFctl_B.total_sidestick_pitch_command = A380PrimComputerFctl_P.Saturation_UpperSat_d;
    } else if (A380PrimComputerFctl_B.total_sidestick_pitch_command < A380PrimComputerFctl_P.Saturation_LowerSat_h) {
      A380PrimComputerFctl_B.total_sidestick_pitch_command = A380PrimComputerFctl_P.Saturation_LowerSat_h;
    }

    if (!A380PrimComputerFctl_DWork.pRightStickDisabled) {
      rtb_Y_ms = A380PrimComputerFctl_U.in.data.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant1_Value_p;
    }

    if (A380PrimComputerFctl_DWork.pLeftStickDisabled) {
      rtb_Y_gl = A380PrimComputerFctl_P.Constant1_Value_p;
    } else {
      rtb_Y_gl = A380PrimComputerFctl_U.in.data.analog_inputs.capt_roll_stick_pos;
    }

    A380PrimComputerFctl_B.total_sidestick_roll_command = rtb_Y_ms + rtb_Y_gl;
    if (A380PrimComputerFctl_B.total_sidestick_roll_command > A380PrimComputerFctl_P.Saturation1_UpperSat) {
      A380PrimComputerFctl_B.total_sidestick_roll_command = A380PrimComputerFctl_P.Saturation1_UpperSat;
    } else if (A380PrimComputerFctl_B.total_sidestick_roll_command < A380PrimComputerFctl_P.Saturation1_LowerSat) {
      A380PrimComputerFctl_B.total_sidestick_roll_command = A380PrimComputerFctl_P.Saturation1_LowerSat;
    }

    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_h, &rtb_y_ny);
    rtb_OR_i = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_gs, &rtb_y_ny);
    rtb_OR_jr = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_nu, &rtb_y_ny);
    rtb_OR_d = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel3_bit_g, &rtb_y_ny);
    rtb_Equal = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_e, &rtb_y_ny);
    rtb_y_pf = (rtb_y_ny != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_a, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction_m(rtb_OR_i, rtb_OR_jr, rtb_OR_d, rtb_Equal, rtb_y_pf, (rtb_y_ny != 0U),
      &rtb_Y_gl);
    A380PrimComputerFctl_RateLimiter_l(look2_binlxpw(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      rtb_Y_gl, A380PrimComputerFctl_P.alphamax_bp01Data, A380PrimComputerFctl_P.alphamax_bp02Data,
      A380PrimComputerFctl_P.alphamax_tableData, A380PrimComputerFctl_P.alphamax_maxIndex, 4U),
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs_up, A380PrimComputerFctl_P.RateLimiterGenericVariableTs_lo,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.reset_Value, &A380PrimComputerFctl_B.alpha_max_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ne);
    if (!A380PrimComputerFctl_DWork.eventTime_not_empty_m) {
      A380PrimComputerFctl_DWork.eventTime_f = A380PrimComputerFctl_U.in.data.time.simulation_time;
      A380PrimComputerFctl_DWork.eventTime_not_empty_m = true;
    }

    if (A380PrimComputerFctl_U.in.general_logic.on_ground || (A380PrimComputerFctl_DWork.eventTime_f == 0.0)) {
      A380PrimComputerFctl_DWork.eventTime_f = A380PrimComputerFctl_U.in.data.time.simulation_time;
    }

    A380PrimComputerFctl_RateLimiter_l(look2_binlxpw(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      rtb_Y_gl, A380PrimComputerFctl_P.alphaprotection_bp01Data, A380PrimComputerFctl_P.alphaprotection_bp02Data,
      A380PrimComputerFctl_P.alphaprotection_tableData, A380PrimComputerFctl_P.alphaprotection_maxIndex, 4U),
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_up, A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.reset_Value_j,
      &A380PrimComputerFctl_B.alpha_prot_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_mr);
    if (A380PrimComputerFctl_U.in.data.time.simulation_time - A380PrimComputerFctl_DWork.eventTime_f <=
        A380PrimComputerFctl_P.CompareToConstant_const_l) {
      A380PrimComputerFctl_B.alpha_prot_deg = A380PrimComputerFctl_B.alpha_max_deg;
    }

    A380PrimComputerFctl_GetIASforMach4(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      A380PrimComputerFctl_P.Constant6_Value_b, A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      &rtb_Y_gl);
    A380PrimComputerFctl_B.high_speed_prot_lo_thresh_kn = std::fmin(A380PrimComputerFctl_P.Constant5_Value_k, rtb_Y_gl);
    A380PrimComputerFctl_GetIASforMach4(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach,
      A380PrimComputerFctl_P.Constant8_Value_h, A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      &rtb_Y_gl);
    A380PrimComputerFctl_B.high_speed_prot_hi_thresh_kn = std::fmin(A380PrimComputerFctl_P.Constant7_Value_g, rtb_Y_gl);
    rtb_OR_i = ((A380PrimComputerFctl_B.active_pitch_law == a380_pitch_efcs_law::NormalLaw) ||
                (A380PrimComputerFctl_B.active_lateral_law == a380_lateral_efcs_law::NormalLaw));
    if (!A380PrimComputerFctl_DWork.resetEventTime_not_empty) {
      A380PrimComputerFctl_DWork.resetEventTime = A380PrimComputerFctl_U.in.data.time.simulation_time;
      A380PrimComputerFctl_DWork.resetEventTime_not_empty = true;
    }

    if ((A380PrimComputerFctl_B.total_sidestick_pitch_command >= -0.03125) ||
        (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg >= A380PrimComputerFctl_B.alpha_max_deg)
        || (A380PrimComputerFctl_DWork.resetEventTime == 0.0)) {
      A380PrimComputerFctl_DWork.resetEventTime = A380PrimComputerFctl_U.in.data.time.simulation_time;
    }

    A380PrimComputerFctl_DWork.sProtActive_g = (((!A380PrimComputerFctl_U.in.general_logic.on_ground) && rtb_OR_i &&
      (!A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged) &&
      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg > A380PrimComputerFctl_B.alpha_prot_deg) &&
      (A380PrimComputerFctl_U.in.data.time.monotonic_time > 10.0)) || A380PrimComputerFctl_DWork.sProtActive_g);
    A380PrimComputerFctl_DWork.sProtActive_g = ((A380PrimComputerFctl_U.in.data.time.simulation_time -
      A380PrimComputerFctl_DWork.resetEventTime <= 0.5) && (A380PrimComputerFctl_B.total_sidestick_pitch_command >= -0.5)
      && ((A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft >= 200.0) ||
          (A380PrimComputerFctl_B.total_sidestick_pitch_command >= 0.5) ||
          (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg >=
           A380PrimComputerFctl_B.alpha_prot_deg - 2.0)) && (!A380PrimComputerFctl_U.in.general_logic.on_ground) &&
      rtb_OR_i && A380PrimComputerFctl_DWork.sProtActive_g);
    A380PrimComputerFctl_B.speed_brake_inhibited = (A380PrimComputerFctl_P.Constant_Value_h ||
      A380PrimComputerFctl_DWork.sProtActive_g || ((A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos >=
      A380PrimComputerFctl_P.CompareToConstant3_const_l) ||
      (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos >= A380PrimComputerFctl_P.CompareToConstant4_const_c)
      || (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos >=
          A380PrimComputerFctl_P.CompareToConstant1_const_b) ||
      (A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_4_pos >= A380PrimComputerFctl_P.CompareToConstant2_const_c)));
    A380PrimComputerFctl_MATLABFunction_c((A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos <
      A380PrimComputerFctl_P.CompareToConstant_const_n), A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.ConfirmNode_isRisingEdge_c, A380PrimComputerFctl_P.ConfirmNode_timeDelay_g, &rtb_y_pf,
      &A380PrimComputerFctl_DWork.sf_MATLABFunction_al4);
    A380PrimComputerFctl_DWork.Memory_PreviousInput_g = A380PrimComputerFctl_P.Logic_table_g[(((static_cast<uint32_T>
      (A380PrimComputerFctl_B.speed_brake_inhibited) << 1) + rtb_y_pf) << 1) +
      A380PrimComputerFctl_DWork.Memory_PreviousInput_g];
    A380PrimComputerFctl_B.speed_brake_inhibited = (A380PrimComputerFctl_B.speed_brake_inhibited ||
      A380PrimComputerFctl_DWork.Memory_PreviousInput_g);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_l, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_OR_d);
    rtb_OR_jr = ((rtb_y_ny == 0U) && rtb_OR_d);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_cm, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_Equal);
    A380PrimComputerFctl_B.spoiler_lift_active = (A380PrimComputerFctl_U.in.general_logic.on_ground && (rtb_OR_jr ||
      ((rtb_y_ny == 0U) && rtb_Equal)));
    A380PrimComputerFctl_B.ths_manual_mode_c_deg_s =
      A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg - std::cos
      (A380PrimComputerFctl_P.Gain1_Gain_d * A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg) *
      A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg;
    if ((!A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged) &&
        (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn > std::fmin(look1_binlxpw
          (A380PrimComputerFctl_B.ths_manual_mode_c_deg_s, A380PrimComputerFctl_P.uDLookupTable1_bp01Data,
           A380PrimComputerFctl_P.uDLookupTable1_tableData, 3U),
          A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn /
          A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach * look1_binlxpw
          (A380PrimComputerFctl_B.ths_manual_mode_c_deg_s, A380PrimComputerFctl_P.uDLookupTable2_bp01Data,
           A380PrimComputerFctl_P.uDLookupTable2_tableData, 3U)))) {
      A380PrimComputerFctl_DWork.sProtActive = (rtb_OR_i || A380PrimComputerFctl_DWork.sProtActive);
    }

    A380PrimComputerFctl_DWork.sProtActive = ((A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn >=
      A380PrimComputerFctl_B.high_speed_prot_lo_thresh_kn) &&
      (!A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged) && rtb_OR_i &&
      A380PrimComputerFctl_DWork.sProtActive);
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
          A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach * (look1_binlxpw
           (A380PrimComputerFctl_B.ths_manual_mode_c_deg_s, A380PrimComputerFctl_P.uDLookupTable_bp01Data_m,
            A380PrimComputerFctl_P.uDLookupTable_tableData_n, 3U) + 0.01))) || ((A380PrimComputerFctl_B.active_pitch_law
          != a380_pitch_efcs_law::NormalLaw) && (A380PrimComputerFctl_B.active_lateral_law != a380_lateral_efcs_law::
          NormalLaw)) || (A380PrimComputerFctl_DWork.eventTime == 0.0)) {
      A380PrimComputerFctl_DWork.eventTime = A380PrimComputerFctl_U.in.data.time.simulation_time;
    }

    A380PrimComputerFctl_B.protection_ap_disconnect = (((!A380PrimComputerFctl_U.in.general_logic.on_ground) && (((nz !=
      0) && (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg >
             A380PrimComputerFctl_B.alpha_max_deg)) ||
      (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg > A380PrimComputerFctl_B.alpha_prot_deg +
       0.25)) && rtb_OR_i) || (A380PrimComputerFctl_U.in.data.time.simulation_time -
      A380PrimComputerFctl_DWork.eventTime > 3.0) || A380PrimComputerFctl_DWork.sProtActive ||
      A380PrimComputerFctl_DWork.sProtActive_g);
    A380PrimComputerFctl_B.ap_authorised = ((std::abs(A380PrimComputerFctl_B.total_sidestick_pitch_command) <= 0.5) &&
      (std::abs(A380PrimComputerFctl_B.total_sidestick_roll_command) <= 0.5) && ((std::abs
      (A380PrimComputerFctl_U.in.data.analog_inputs.rudder_pedal_pos) <= 0.4) &&
      ((A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg <= 25.0) &&
       (A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg >= -13.0) && (std::abs
      (A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg) <= 45.0) &&
       (!A380PrimComputerFctl_B.protection_ap_disconnect))));
    rtb_Y_ms = std::round(A380PrimComputerFctl_U.in.data.temporary_ap_input.lateral_mode_armed);
    if (rtb_Y_ms < 1.8446744073709552E+19) {
      if (rtb_Y_ms >= 0.0) {
        Double2MultiWord(rtb_Y_ms, &tmp_0.chunks[0U], 2);
      } else {
        tmp_0 = tmp_8;
      }
    } else {
      tmp_0 = tmp_7;
    }

    rtb_Y_ms = std::round(A380PrimComputerFctl_U.in.data.temporary_ap_input.vertical_mode_armed);
    if (rtb_Y_ms < 1.8446744073709552E+19) {
      if (rtb_Y_ms >= 0.0) {
        Double2MultiWord(rtb_Y_ms, &tmp_1.chunks[0U], 2);
      } else {
        tmp_1 = tmp_8;
      }
    } else {
      tmp_1 = tmp_7;
    }

    MultiWordAnd(&tmp_0.chunks[0U], &tmp_b.chunks[0U], &tmp_2.chunks[0U], 2);
    MultiWordAnd(&tmp_1.chunks[0U], &tmp_a.chunks[0U], &tmp_3.chunks[0U], 2);
    rtb_OR_i = ((uMultiWordNe(&tmp_2.chunks[0U], &tmp_8.chunks[0U], 2) ||
                 ((A380PrimComputerFctl_U.in.data.temporary_ap_input.lateral_mode >= 30.0) &&
                  (A380PrimComputerFctl_U.in.data.temporary_ap_input.lateral_mode <= 34.0))) && (uMultiWordNe
      (&tmp_3.chunks[0U], &tmp_8.chunks[0U], 2) || ((A380PrimComputerFctl_U.in.data.temporary_ap_input.vertical_mode >=
      30.0) && (A380PrimComputerFctl_U.in.data.temporary_ap_input.vertical_mode <= 34.0))));
    A380PrimComputerFctl_DWork.pApproachModeArmedAbove400Ft =
      (((!A380PrimComputerFctl_DWork.pApproachModeArmedAbove400Ft) && rtb_OR_i &&
        (A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft > 400.0)) ||
       A380PrimComputerFctl_DWork.pApproachModeArmedAbove400Ft);
    rtb_Equal = (A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_1_engaged && rtb_OR_i);
    rtb_y_pf = (A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_2_engaged && rtb_OR_i);
    nz = (A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM != static_cast<uint32_T>
          (SignStatusMatrix::FailureWarning)) +
      (A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM != static_cast<uint32_T>
       (SignStatusMatrix::FailureWarning));
    Single2MultiWord(A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.Data, &tmp_5.chunks[0U], 2);
    tmp_0 = tmp_9;
    MultiWordAnd(&tmp_5.chunks[0U], &tmp_9.chunks[0U], &tmp_4.chunks[0U], 2);
    Single2MultiWord(A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.Data, &tmp_6.chunks[0U], 2);
    MultiWordAnd(&tmp_6.chunks[0U], &tmp_9.chunks[0U], &tmp_0.chunks[0U], 2);
    rtb_OR_o = ((((A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::NormalOperation)) ||
                  (A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::FunctionalTest))) && uMultiWordNe(&tmp_4.chunks[0U], &tmp_8.chunks[0U], 2)) ||
                (((A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::NormalOperation)) ||
                  (A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::FunctionalTest))) && uMultiWordNe(&tmp_0.chunks[0U], &tmp_8.chunks[0U], 2)));
    rtb_OR_a = (A380PrimComputerFctl_B.lateral_law_capability == a380_lateral_efcs_law::NormalLaw);
    b_nz = A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail +
      A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
    rtb_AND3_k = ((A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM != static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) +
                  (A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM != static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) >= 1);
    rtb_OR_i = (A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail ||
                A380PrimComputerFctl_B.left_spoiler_electric_mode_avail);
    rtb_AND6_m = rtb_OR_i;
    tmp[0] = (A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM != static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning));
    tmp[1] = (A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM != static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning));
    tmp[2] = (A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM != static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning));
    prim3LawCap = combineVectorElements_N0KSVqzt(tmp);
    tmp[0] = A380PrimComputerFctl_a429_bitValueOr(A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.SSM,
      A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.Data);
    tmp[1] = A380PrimComputerFctl_a429_bitValueOr(A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.SSM,
      A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.Data);
    tmp[2] = A380PrimComputerFctl_a429_bitValueOr(A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.SSM,
      A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.Data);
    d_nz = combineVectorElements_N0KSVqzt(tmp);
    rtb_OR_i = ((nz >= 1) && rtb_OR_o && rtb_OR_a && (b_nz >= 1) &&
                A380PrimComputerFctl_U.in.data.discrete_inputs.fcu_healthy && rtb_AND3_k && rtb_OR_i && (prim3LawCap >=
      2) && (d_nz >= 2));
    rtb_OR_jr = (rtb_OR_i && (!A380PrimComputerFctl_U.in.general_logic.all_ra_failure));
    rtb_OR_d = (rtb_OR_i && (!A380PrimComputerFctl_U.in.general_logic.two_ra_failure));
    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      rtb_OR_i = ((A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.radio_height_1_ft.SSM != static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) ||
                  (A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.radio_height_2_ft.SSM != static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)));
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      rtb_OR_i = (A380PrimComputerFctl_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.SSM != static_cast<uint32_T>
                  (SignStatusMatrix::FailureWarning));
    } else {
      rtb_OR_i = (A380PrimComputerFctl_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.SSM != static_cast<uint32_T>
                  (SignStatusMatrix::FailureWarning));
    }

    rtb_OR_i = ((nz >= 2) && rtb_OR_o && rtb_OR_a && (b_nz == 2) &&
                A380PrimComputerFctl_U.in.data.discrete_inputs.fcu_healthy && rtb_AND3_k && rtb_AND6_m && (prim3LawCap ==
      3) && (d_nz == 3) && rtb_OR_i && (!A380PrimComputerFctl_U.in.general_logic.two_ra_failure));
    A380PrimComputerFctl_B.land_3_fail_op_capability = (A380PrimComputerFctl_DWork.pApproachModeArmedAbove400Ft &&
      rtb_OR_i && rtb_Equal && rtb_y_pf && A380PrimComputerFctl_U.in.data.temporary_ap_input.athr_engaged);
    rtb_Equal = (rtb_Equal || rtb_y_pf);
    rtb_y_pf = !A380PrimComputerFctl_B.land_3_fail_op_capability;
    A380PrimComputerFctl_B.land_3_fail_passive_capability = (A380PrimComputerFctl_DWork.pApproachModeArmedAbove400Ft &&
      rtb_OR_d && rtb_Equal && A380PrimComputerFctl_U.in.data.temporary_ap_input.athr_engaged && rtb_y_pf);
    A380PrimComputerFctl_B.land_2_capability = (rtb_OR_jr && rtb_Equal &&
      (!A380PrimComputerFctl_B.land_3_fail_passive_capability) && rtb_y_pf);
    A380PrimComputerFctl_B.land_2_inop = !rtb_OR_jr;
    A380PrimComputerFctl_B.land_3_fail_passive_inop = !rtb_OR_d;
    A380PrimComputerFctl_B.land_3_fail_op_inop = !rtb_OR_i;
    rtb_VectorConcatenate_ic[5] = A380PrimComputerFctl_B.land_2_capability;
    rtb_VectorConcatenate_ic[6] = A380PrimComputerFctl_B.land_3_fail_passive_capability;
    rtb_VectorConcatenate_ic[7] = A380PrimComputerFctl_B.land_3_fail_op_capability;
    rtb_VectorConcatenate_ic[9] = A380PrimComputerFctl_B.land_2_inop;
    rtb_VectorConcatenate_ic[10] = A380PrimComputerFctl_B.land_3_fail_passive_inop;
    rtb_VectorConcatenate_ic[11] = A380PrimComputerFctl_B.land_3_fail_op_inop;
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode1_isRisingEdge_n, &rtb_OR_d, &A380PrimComputerFctl_DWork.sf_MATLABFunction_ky);
    A380PrimComputerFctl_MATLABFunction_f(A380PrimComputerFctl_U.in.general_logic.on_ground,
      A380PrimComputerFctl_P.PulseNode2_isRisingEdge, &rtb_y_pf, &A380PrimComputerFctl_DWork.sf_MATLABFunction_dmh);
    A380PrimComputerFctl_DWork.Memory_PreviousInput_d = A380PrimComputerFctl_P.Logic_table_j[(((static_cast<uint32_T>
      (rtb_OR_d) << 1) + (rtb_y_pf || A380PrimComputerFctl_DWork.Delay_DSTATE_e)) << 1) +
      A380PrimComputerFctl_DWork.Memory_PreviousInput_d];
    rtb_OR_o = ((A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn <=
                 A380PrimComputerFctl_P.CompareToConstant_const_c) && A380PrimComputerFctl_DWork.Memory_PreviousInput_d);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel2_bit_pt, &rtb_y_ny);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      &rtb_y_pf);
    rtb_OR_a = ((rtb_y_ny != 0U) && rtb_y_pf);
    if (rtb_OR_a) {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.discrete_status_word_1.SSM;
    } else {
      rtb_DataTypeConversion1_j = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.discrete_status_word_1.SSM;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_DataTypeConversion1_j;
    if (rtb_OR_a) {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.discrete_status_word_1.Data;
    } else {
      rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data =
        A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.discrete_status_word_1.Data;
    }

    A380PrimComputerFctl_MATLABFunction_p(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputerFctl_P.BitfromLabel3_bit_gv, &rtb_y_ny);
    if (A380PrimComputerFctl_B.is_master_prim) {
      A380PrimComputerFctl_B.ths_automatic_mode_active = ((!A380PrimComputerFctl_U.in.general_logic.on_ground) &&
        (A380PrimComputerFctl_B.active_pitch_law != A380PrimComputerFctl_P.EnumeratedConstant_Value_l));
    } else {
      A380PrimComputerFctl_B.ths_automatic_mode_active = ((rtb_y_ny != 0U) && (rtb_DataTypeConversion1_j == static_cast<
        uint32_T>(SignStatusMatrix::NormalOperation)));
    }

    rtb_OR_a = (A380PrimComputerFctl_B.ths_automatic_mode_active || (std::abs(A380PrimComputerFctl_B.ths_deg_o) <=
      A380PrimComputerFctl_P.CompareToConstant1_const_p) ||
                A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_up_pressed ||
                A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_down_pressed);
    A380PrimComputerFctl_DWork.Delay_DSTATE_e = A380PrimComputerFctl_P.Logic_table_n[(((static_cast<uint32_T>(rtb_OR_o) <<
      1) + rtb_OR_a) << 1) + A380PrimComputerFctl_DWork.Memory_PreviousInput_j];
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_p, &rtb_DataTypeConversion1_j);
    rtb_y_pf = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_g, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_Equal);
    rtb_OR_i = (((!rtb_y_pf) || (rtb_DataTypeConversion1_j == 0U)) && rtb_Equal);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_OR_a);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel6_bit_l, &rtb_DataTypeConversion1_j);
    rtb_y_pf = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_as, &rtb_DataTypeConversion1_j);
    if (rtb_OR_i || (rtb_OR_a && ((!rtb_y_pf) || (rtb_DataTypeConversion1_j == 0U)))) {
      A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = 0.25;
    } else {
      A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = 0.15;
    }

    if (A380PrimComputerFctl_DWork.Delay_DSTATE_e) {
      A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = A380PrimComputerFctl_P.Gain_Gain_g *
        A380PrimComputerFctl_B.ths_deg_o;
      if (A380PrimComputerFctl_B.ths_manual_mode_c_deg_s > A380PrimComputerFctl_P.Saturation_UpperSat) {
        A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = A380PrimComputerFctl_P.Saturation_UpperSat;
      } else if (A380PrimComputerFctl_B.ths_manual_mode_c_deg_s < A380PrimComputerFctl_P.Saturation_LowerSat) {
        A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = A380PrimComputerFctl_P.Saturation_LowerSat;
      }
    } else if (!A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_down_pressed) {
      if (A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_up_pressed) {
        A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = -A380PrimComputerFctl_B.ths_manual_mode_c_deg_s;
      } else {
        A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = 0.0;
      }
    }

    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_e, &rtb_DataTypeConversion1_j);
    rtb_OR_i = (rtb_DataTypeConversion1_j == 0U);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_OR_o);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_d, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_Equal);
    A380PrimComputerFctl_B.aileron_droop_active = ((rtb_OR_i && rtb_OR_o) || ((rtb_DataTypeConversion1_j == 0U) &&
      rtb_Equal));
    A380PrimComputerFctl_B.aileron_antidroop_active = ((!A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged) &&
      A380PrimComputerFctl_DWork.Delay1_DSTATE);
    rtb_Y_gl = A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn * 0.5144;
    if (A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn >= 30.0) {
      rtb_Y_ms = rtb_Y_gl * rtb_Y_gl * 0.6125 * 845.0 / (400000.0 * rtb_Y_gl);
      rtb_Y_ms = (A380PrimComputerFctl_U.in.general_logic.ir_computation_data.n_y_g * 9.81 -
                  (A380PrimComputerFctl_B.upper_rudder_deg_m + A380PrimComputerFctl_B.lower_rudder_deg_c) / 2.0 *
                  3.1415926535897931 / 180.0 * (rtb_Y_ms * 0.418 * rtb_Y_gl)) / (rtb_Y_ms * -0.646 * rtb_Y_gl) * 180.0 /
        3.1415926535897931;
    } else {
      rtb_Y_ms = 0.0;
    }

    A380PrimComputerFctl_LagFilter(rtb_Y_ms, A380PrimComputerFctl_P.LagFilter1_C1,
      A380PrimComputerFctl_U.in.data.time.dt, &rtb_Y_gl, &A380PrimComputerFctl_DWork.sf_LagFilter);
    rtb_OR_i = (A380PrimComputerFctl_U.in.general_logic.tracking_mode_on || (static_cast<real_T>
      (A380PrimComputerFctl_B.active_lateral_law) != A380PrimComputerFctl_P.CompareToConstant_const_e));
    LawMDLOBJ2.step(&A380PrimComputerFctl_U.in.data.time.dt,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.r_deg_s,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_dot_deg_s, &rtb_Y_gl,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputerFctl_B.total_sidestick_roll_command,
                    &A380PrimComputerFctl_U.in.data.analog_inputs.rudder_pedal_pos,
                    &A380PrimComputerFctl_U.in.general_logic.on_ground, &rtb_OR_i,
                    &A380PrimComputerFctl_DWork.sProtActive_g, &A380PrimComputerFctl_DWork.sProtActive,
                    &A380PrimComputerFctl_U.in.data.temporary_ap_input.roll_command,
                    &A380PrimComputerFctl_U.in.data.temporary_ap_input.yaw_command,
                    &A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged, &rtb_xi_deg, &rtb_zeta_deg);
    LawMDLOBJ1.step(&A380PrimComputerFctl_U.in.data.time.dt, &A380PrimComputerFctl_B.total_sidestick_roll_command,
                    &A380PrimComputerFctl_U.in.data.analog_inputs.rudder_pedal_pos, &rtb_xi_deg_l, &rtb_zeta_deg_c);
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.active_lateral_law)) {
     case 0:
      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_xi_deg;
      break;

     case 1:
      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_xi_deg_l;
      break;

     default:
      A380PrimComputerFctl_B.left_outboard_elevator_deg = A380PrimComputerFctl_P.Constant_Value_i;
      break;
    }

    A380PrimComputerFctl_RateLimiter(A380PrimComputerFctl_P.Gain8_Gain *
      A380PrimComputerFctl_B.left_outboard_elevator_deg, A380PrimComputerFctl_P.RateLimiterVariableTs1_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs1_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs1_InitialCondition, &rtb_handleIndex_a,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_it);
    rtb_OR_jr = (A380PrimComputerFctl_U.in.general_logic.on_ground || (A380PrimComputerFctl_B.active_lateral_law !=
      A380PrimComputerFctl_P.EnumeratedConstant_Value_g));
    if (rtb_OR_jr) {
      rtb_handleIndex_a = A380PrimComputerFctl_B.left_outboard_elevator_deg;
    }

    if (A380PrimComputerFctl_P.Constant7_Value_o) {
      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_handleIndex_a;
    } else {
      rtb_Y_ms = std::abs(rtb_handleIndex_a) + A380PrimComputerFctl_P.Bias_Bias;
      if (rtb_Y_ms > A380PrimComputerFctl_P.Saturation7_UpperSat) {
        rtb_Y_ms = A380PrimComputerFctl_P.Saturation7_UpperSat;
      } else if (rtb_Y_ms < A380PrimComputerFctl_P.Saturation7_LowerSat) {
        rtb_Y_ms = A380PrimComputerFctl_P.Saturation7_LowerSat;
      }

      if (rtb_handleIndex_a < 0.0) {
        nz = -1;
      } else {
        nz = (rtb_handleIndex_a > 0.0);
      }

      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_Y_ms * static_cast<real_T>(nz) *
        A380PrimComputerFctl_P.Gain6_Gain;
    }

    rtb_Y_gl = A380PrimComputerFctl_P.Gain2_Gain * A380PrimComputerFctl_B.left_outboard_elevator_deg;
    switch (static_cast<int32_T>(A380PrimComputerFctl_U.in.general_logic.flap_handle_index)) {
     case 2:
      rtb_Y_ms = 0.46666666666666667;
      break;

     case 3:
      rtb_Y_ms = 0.37777777777777777;
      break;

     case 4:
      rtb_Y_ms = 0.22222222222222221;
      break;

     case 5:
      rtb_Y_ms = 0.22222222222222221;
      break;

     default:
      rtb_Y_ms = 1.0;
      break;
    }

    A380PrimComputerFctl_RateLimiter_l(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs26_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs26_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.reset_Value_n, &rtb_Gain_cu, &A380PrimComputerFctl_DWork.sf_RateLimiter_l3);
    if (A380PrimComputerFctl_B.speed_brake_inhibited) {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant8_Value_g;
    } else {
      rtb_Y_ms = look1_binlxpw(A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos,
        A380PrimComputerFctl_P.uDLookupTable_bp01Data, A380PrimComputerFctl_P.uDLookupTable_tableData, 4U);
    }

    A380PrimComputerFctl_RateLimiter_b(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs24_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs24_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs24_InitialCondition, A380PrimComputerFctl_P.reset_Value_a,
      &A380PrimComputerFctl_B.right_spoiler_7_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_b);
    if (A380PrimComputerFctl_B.spoiler_lift_active) {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant9_Value;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant8_Value_g;
    }

    A380PrimComputerFctl_RateLimiter_b(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs25_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs25_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs25_InitialCondition, A380PrimComputerFctl_P.reset_Value_m,
      &A380PrimComputerFctl_B.left_spoiler_7_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_d);
    A380PrimComputerFctl_Spoiler345Computation(rtb_Y_gl, std::fmin(rtb_Gain_cu *
      A380PrimComputerFctl_B.right_spoiler_7_deg, A380PrimComputerFctl_B.left_spoiler_7_deg),
      &A380PrimComputerFctl_B.left_inboard_elevator_deg, &A380PrimComputerFctl_B.right_inboard_elevator_deg);
    if (A380PrimComputerFctl_B.phased_lift_dumping_active) {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant5_Value;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant6_Value;
    }

    A380PrimComputerFctl_RateLimiter(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterVariableTs4_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs4_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs4_InitialCondition, &A380PrimComputerFctl_B.left_inboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_g);
    if (A380PrimComputerFctl_DWork.Delay1_DSTATE) {
      A380PrimComputerFctl_B.left_inboard_aileron_deg = A380PrimComputerFctl_P.Constant_Value;
    }

    A380PrimComputerFctl_RateLimiter(A380PrimComputerFctl_B.left_inboard_aileron_deg,
      A380PrimComputerFctl_P.RateLimiterVariableTs6_up, A380PrimComputerFctl_P.RateLimiterVariableTs6_lo,
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.RateLimiterVariableTs6_InitialCondition,
      &A380PrimComputerFctl_B.left_spoiler_8_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_i);
    rtb_y_pf = (A380PrimComputerFctl_DWork.Delay1_DSTATE || A380PrimComputerFctl_B.phased_lift_dumping_active);
    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.right_inboard_elevator_deg;
    }

    rtb_OR_i = ((!A380PrimComputerFctl_B.spoiler_pair_8_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs21_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs21_lo, A380PrimComputerFctl_U.in.data.time.dt,
      static_cast<real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data),
      rtb_OR_i, &A380PrimComputerFctl_B.right_spoiler_8_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_oj);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel_bit_ci, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      &rtb_OR_a);
    rtb_OR_d = ((rtb_DataTypeConversion1_j != 0U) && rtb_OR_a);
    if (A380PrimComputerFctl_B.is_master_prim) {
      A380PrimComputerFctl_B.Data = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_8_deg);
    } else {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_8_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_8_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
      }

      A380PrimComputerFctl_B.Data = A380PrimComputerFctl_P.Constant31_Value;
    }

    rtb_Y_ms = look1_binlxpw(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      A380PrimComputerFctl_P.uDLookupTable1_bp01Data_n, A380PrimComputerFctl_P.uDLookupTable1_tableData_d, 8U);
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.active_lateral_law)) {
     case 0:
      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_zeta_deg;
      break;

     case 1:
      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_zeta_deg_c;
      break;

     default:
      A380PrimComputerFctl_B.left_outboard_elevator_deg = A380PrimComputerFctl_P.Constant_Value_i;
      break;
    }

    A380PrimComputerFctl_RateLimiter(A380PrimComputerFctl_P.Gain9_Gain *
      A380PrimComputerFctl_B.left_outboard_elevator_deg, A380PrimComputerFctl_P.RateLimiterVariableTs5_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs5_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs5_InitialCondition, &rtb_Gain_p,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_dg);
    if (rtb_OR_jr) {
      rtb_handleIndex_h = A380PrimComputerFctl_B.left_outboard_elevator_deg;
    } else {
      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_Gain_p;
      rtb_handleIndex_h = A380PrimComputerFctl_P.Gain7_Gain * rtb_Gain_p;
    }

    rtb_Gain_cu = look1_binlxpw(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
      A380PrimComputerFctl_P.uDLookupTable2_bp01Data_o, A380PrimComputerFctl_P.uDLookupTable2_tableData_o, 8U);
    if (rtb_handleIndex_h <= rtb_Gain_cu) {
      rtb_Gain_cu *= A380PrimComputerFctl_P.Gain1_Gain_c;
      if (rtb_handleIndex_h >= rtb_Gain_cu) {
        rtb_Gain_cu = rtb_handleIndex_h;
      }
    }

    A380PrimComputerFctl_TransportDelay(A380PrimComputerFctl_B.left_outboard_elevator_deg,
      A380PrimComputerFctl_U.in.data.time.dt, rtb_OR_jr, &rtb_Gain_p, &A380PrimComputerFctl_DWork.sf_TransportDelay_c);
    rtb_Gain_p += rtb_handleIndex_h - rtb_Gain_cu;
    if (rtb_Gain_p > rtb_Y_ms) {
      rtb_Gain_p = rtb_Y_ms;
    } else {
      rtb_Y_ms *= A380PrimComputerFctl_P.Gain_Gain;
      if (rtb_Gain_p < rtb_Y_ms) {
        rtb_Gain_p = rtb_Y_ms;
      }
    }

    if (A380PrimComputerFctl_B.upper_rudder_deg_m > A380PrimComputerFctl_P.Saturation6_UpperSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation6_UpperSat;
    } else if (A380PrimComputerFctl_B.upper_rudder_deg_m < A380PrimComputerFctl_P.Saturation6_LowerSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation6_LowerSat;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.upper_rudder_deg_m;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_p, A380PrimComputerFctl_P.RateLimiterGenericVariableTs6_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs6_lo, A380PrimComputerFctl_U.in.data.time.dt, rtb_Y_ms,
      ((!A380PrimComputerFctl_B.upper_rudder_engaged) || rtb_protection_active),
      &A380PrimComputerFctl_B.upper_rudder_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_lv);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.upper_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.upper_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
      }
    }

    if (A380PrimComputerFctl_B.lower_rudder_deg_c > A380PrimComputerFctl_P.Saturation5_UpperSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation5_UpperSat;
    } else if (A380PrimComputerFctl_B.lower_rudder_deg_c < A380PrimComputerFctl_P.Saturation5_LowerSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation5_LowerSat;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.lower_rudder_deg_c;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs7_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs7_lo, A380PrimComputerFctl_U.in.data.time.dt, rtb_Y_ms,
      ((!A380PrimComputerFctl_B.lower_rudder_engaged) || rtb_protection_active),
      &A380PrimComputerFctl_B.lower_rudder_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_pw);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.lower_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.lower_rudder_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
      }
    }

    if (rtb_OR_jr) {
      rtb_handleIndex_h = rtb_handleIndex_a;
    } else {
      rtb_handleIndex_h = A380PrimComputerFctl_P.Gain1_Gain * rtb_handleIndex_a;
    }

    if (rtb_handleIndex_h > A380PrimComputerFctl_P.Saturation_UpperSat_f) {
      A380PrimComputerFctl_B.left_outboard_elevator_deg = A380PrimComputerFctl_P.Saturation_UpperSat_f;
    } else if (rtb_handleIndex_h < A380PrimComputerFctl_P.Saturation_LowerSat_hn) {
      A380PrimComputerFctl_B.left_outboard_elevator_deg = A380PrimComputerFctl_P.Saturation_LowerSat_hn;
    } else {
      A380PrimComputerFctl_B.left_outboard_elevator_deg = rtb_handleIndex_h;
    }

    if (A380PrimComputerFctl_B.aileron_droop_active) {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant2_Value;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant1_Value;
    }

    A380PrimComputerFctl_RateLimiter(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterVariableTs2_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs2_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs2_InitialCondition, &A380PrimComputerFctl_B.right_inboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter);
    if (A380PrimComputerFctl_B.aileron_antidroop_active) {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant4_Value;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_P.Constant3_Value;
    }

    A380PrimComputerFctl_RateLimiter(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterVariableTs3_up,
      A380PrimComputerFctl_P.RateLimiterVariableTs3_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.RateLimiterVariableTs3_InitialCondition, &A380PrimComputerFctl_B.left_inboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_m);
    A380PrimComputerFctl_B.right_outboard_elevator_deg = A380PrimComputerFctl_B.right_inboard_aileron_deg +
      A380PrimComputerFctl_B.left_inboard_aileron_deg;
    rtb_Y_ms = A380PrimComputerFctl_P.Gain_Gain_h * A380PrimComputerFctl_B.left_outboard_elevator_deg +
      A380PrimComputerFctl_B.right_outboard_elevator_deg;
    if (rtb_Y_ms > A380PrimComputerFctl_P.Saturation2_UpperSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation2_UpperSat;
    } else if (rtb_Y_ms < A380PrimComputerFctl_P.Saturation2_LowerSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation2_LowerSat;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs_up_p,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs_lo_d, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.left_inboard_aileron_deg_g, ((!A380PrimComputerFctl_B.left_inboard_aileron_engaged) ||
      rtb_protection_active), &A380PrimComputerFctl_B.left_inboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_h);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
      }
    }

    rtb_Y_ms = A380PrimComputerFctl_B.right_outboard_elevator_deg + A380PrimComputerFctl_B.left_outboard_elevator_deg;
    if (rtb_Y_ms > A380PrimComputerFctl_P.Saturation1_UpperSat_n) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation1_UpperSat_n;
    } else if (rtb_Y_ms < A380PrimComputerFctl_P.Saturation1_LowerSat_c) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation1_LowerSat_c;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_up_o,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_lo_h, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.right_inboard_aileron_deg_b, ((!A380PrimComputerFctl_B.right_inboard_aileron_engaged) ||
      rtb_protection_active), &A380PrimComputerFctl_B.right_inboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_iu);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_inboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
      }
    }

    A380PrimComputerFctl_TransportDelay(rtb_handleIndex_h, A380PrimComputerFctl_U.in.data.time.dt, rtb_OR_jr,
      &A380PrimComputerFctl_B.right_spoiler_1_deg, &A380PrimComputerFctl_DWork.sf_TransportDelay);
    if (A380PrimComputerFctl_B.right_spoiler_1_deg > A380PrimComputerFctl_P.Saturation3_UpperSat) {
      rtb_Gain_cu = A380PrimComputerFctl_P.Saturation3_UpperSat;
    } else if (A380PrimComputerFctl_B.right_spoiler_1_deg < A380PrimComputerFctl_P.Saturation3_LowerSat) {
      rtb_Gain_cu = A380PrimComputerFctl_P.Saturation3_LowerSat;
    } else {
      rtb_Gain_cu = A380PrimComputerFctl_B.right_spoiler_1_deg;
    }

    rtb_Y_ms = A380PrimComputerFctl_P.Gain3_Gain * rtb_Gain_cu + A380PrimComputerFctl_B.right_outboard_elevator_deg;
    if (rtb_Y_ms > A380PrimComputerFctl_P.Saturation3_UpperSat_b) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation3_UpperSat_b;
    } else if (rtb_Y_ms < A380PrimComputerFctl_P.Saturation3_LowerSat_h) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation3_LowerSat_h;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.left_midboard_aileron_deg_f, ((!A380PrimComputerFctl_B.left_midboard_aileron_engaged) ||
      rtb_protection_active), &A380PrimComputerFctl_B.left_midboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_l);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
      }
    }

    rtb_Y_ms = A380PrimComputerFctl_B.right_outboard_elevator_deg + rtb_Gain_cu;
    if (rtb_Y_ms > A380PrimComputerFctl_P.Saturation4_UpperSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation4_UpperSat;
    } else if (rtb_Y_ms < A380PrimComputerFctl_P.Saturation4_LowerSat) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation4_LowerSat;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.right_midboard_aileron_deg_f, ((!A380PrimComputerFctl_B.right_midboard_aileron_engaged) ||
      rtb_protection_active), &A380PrimComputerFctl_B.right_midboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ib);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_midboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
      }
    }

    rtb_Y_ms = std::fmax(std::fmin(-(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn - 240.0) /
      20.0, 1.0), 0.0) * 20.0;
    rtb_Gain_p = std::fmax(std::fmin(-(A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn - 300.0) /
      20.0, 1.0), 0.0) * -30.0;
    rtb_handleIndex_a += ((rtb_handleIndex_h - A380PrimComputerFctl_B.left_outboard_elevator_deg) +
                          A380PrimComputerFctl_B.right_spoiler_1_deg) - rtb_Gain_cu;
    if (rtb_handleIndex_a > A380PrimComputerFctl_P.Saturation2_UpperSat_k) {
      rtb_handleIndex_a = A380PrimComputerFctl_P.Saturation2_UpperSat_k;
    } else if (rtb_handleIndex_a < A380PrimComputerFctl_P.Saturation2_LowerSat_o) {
      rtb_handleIndex_a = A380PrimComputerFctl_P.Saturation2_LowerSat_o;
    }

    rtb_Gain_cu = A380PrimComputerFctl_P.Gain4_Gain * rtb_handleIndex_a +
      A380PrimComputerFctl_B.right_outboard_elevator_deg;
    if (rtb_Gain_cu > rtb_Y_ms) {
      rtb_Gain_cu = rtb_Y_ms;
    } else if (rtb_Gain_cu < rtb_Gain_p) {
      rtb_Gain_cu = rtb_Gain_p;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs4_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs4_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.left_outboard_aileron_deg_g, ((!A380PrimComputerFctl_B.left_outboard_aileron_engaged) ||
      rtb_protection_active), &A380PrimComputerFctl_B.left_outboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ng);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
      }
    }

    rtb_Gain_cu = A380PrimComputerFctl_B.right_outboard_elevator_deg + rtb_handleIndex_a;
    if (rtb_Gain_cu > rtb_Y_ms) {
      rtb_Gain_cu = rtb_Y_ms;
    } else if (rtb_Gain_cu < rtb_Gain_p) {
      rtb_Gain_cu = rtb_Gain_p;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs5_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs5_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.right_outboard_aileron_deg_m, ((!A380PrimComputerFctl_B.right_outboard_aileron_engaged) ||
      rtb_protection_active), &A380PrimComputerFctl_B.right_outboard_aileron_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_po);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_outboard_aileron_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
      }
    }

    rtb_handleIndex_a = A380PrimComputerFctl_P.Gain5_Gain * A380PrimComputerFctl_B.left_spoiler_8_deg;
    switch (static_cast<int32_T>(A380PrimComputerFctl_U.in.general_logic.flap_handle_index)) {
     case 2:
      rtb_Y_ms = 0.26666666666666666;
      break;

     case 3:
      rtb_Y_ms = 0.2;
      break;

     case 4:
      rtb_Y_ms = 0.17777777777777778;
      break;

     case 5:
      rtb_Y_ms = 0.13333333333333333;
      break;

     default:
      rtb_Y_ms = 0.44444444444444442;
      break;
    }

    A380PrimComputerFctl_RateLimiter_l(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs28_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs28_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.reset_Value_p, &rtb_Gain_cu, &A380PrimComputerFctl_DWork.sf_RateLimiter_a);
    rtb_Gain_cu = std::fmin(rtb_Gain_cu * A380PrimComputerFctl_B.right_spoiler_7_deg,
      A380PrimComputerFctl_B.left_spoiler_7_deg);
    if (rtb_y_pf) {
      rtb_Y_ms = rtb_handleIndex_a;
    } else {
      rtb_Y_ms = rtb_Gain_cu;
    }

    rtb_OR_jr = ((!A380PrimComputerFctl_B.spoiler_pair_1_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs8_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs8_lo, A380PrimComputerFctl_U.in.data.time.dt,
      static_cast<real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data),
      rtb_OR_jr, &A380PrimComputerFctl_B.left_spoiler_1_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_c);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_1_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_1_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = rtb_handleIndex_a;
    } else {
      rtb_Y_ms = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs9_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs9_lo, A380PrimComputerFctl_U.in.data.time.dt,
      static_cast<real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data),
      rtb_OR_jr, &A380PrimComputerFctl_B.right_spoiler_1_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_k);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_1_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_1_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = rtb_handleIndex_a;
    } else {
      rtb_Y_ms = rtb_Gain_cu;
    }

    rtb_OR_jr = ((!A380PrimComputerFctl_B.spoiler_pair_2_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs10_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs10_lo, A380PrimComputerFctl_U.in.data.time.dt,
      static_cast<real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data),
      rtb_OR_jr, &A380PrimComputerFctl_B.left_spoiler_2_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_f);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_2_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_2_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Gain_cu = rtb_handleIndex_a;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs11_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs11_lo, A380PrimComputerFctl_U.in.data.time.dt,
      static_cast<real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data),
      rtb_OR_jr, &A380PrimComputerFctl_B.right_spoiler_2_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_o);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_2_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_2_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
      }
    }

    switch (static_cast<int32_T>(A380PrimComputerFctl_U.in.general_logic.flap_handle_index)) {
     case 2:
      rtb_Y_ms = 0.37777777777777777;
      break;

     case 3:
      rtb_Y_ms = 0.2;
      break;

     case 4:
      rtb_Y_ms = 0.066666666666666666;
      break;

     case 5:
      rtb_Y_ms = 0.0;
      break;

     default:
      rtb_Y_ms = 0.44444444444444442;
      break;
    }

    A380PrimComputerFctl_RateLimiter_l(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs27_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs27_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_P.reset_Value_nh, &rtb_Gain_cu, &A380PrimComputerFctl_DWork.sf_RateLimiter_oa);
    rtb_handleIndex_a = rtb_Gain_cu * A380PrimComputerFctl_B.right_spoiler_7_deg;
    A380PrimComputerFctl_Spoiler345Computation(rtb_Y_gl, std::fmin(rtb_handleIndex_a,
      A380PrimComputerFctl_B.left_spoiler_7_deg), &rtb_handleIndex_a, &rtb_Gain_cu);
    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = rtb_handleIndex_a;
    }

    rtb_OR_jr = ((!A380PrimComputerFctl_B.spoiler_pair_3_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs14_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs14_lo, A380PrimComputerFctl_U.in.data.time.dt,
      static_cast<real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data),
      rtb_OR_jr, &A380PrimComputerFctl_B.left_spoiler_3_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_mt);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_3_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_3_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs15_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs15_lo, A380PrimComputerFctl_U.in.data.time.dt,
      static_cast<real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data),
      rtb_OR_jr, &A380PrimComputerFctl_B.right_spoiler_3_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_iv);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_3_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_3_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = rtb_handleIndex_a;
    }

    rtb_OR_jr = ((!A380PrimComputerFctl_B.spoiler_pair_4_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs12_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs12_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.left_spoiler_4_deg_g, rtb_OR_jr, &A380PrimComputerFctl_B.left_spoiler_4_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_gk);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_4_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_4_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = rtb_Gain_cu;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs13_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs13_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.right_spoiler_4_deg_a, rtb_OR_jr, &A380PrimComputerFctl_B.right_spoiler_4_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_fk);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_4_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_4_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_handleIndex_a = A380PrimComputerFctl_B.left_spoiler_8_deg;
    }

    rtb_OR_jr = ((!A380PrimComputerFctl_B.spoiler_pair_5_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_handleIndex_a, A380PrimComputerFctl_P.RateLimiterGenericVariableTs18_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs18_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.left_spoiler_5_deg_d, rtb_OR_jr, &A380PrimComputerFctl_B.left_spoiler_5_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_hj);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_5_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_5_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Gain_cu = A380PrimComputerFctl_B.left_spoiler_8_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs19_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs19_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.right_spoiler_5_deg_m, rtb_OR_jr, &A380PrimComputerFctl_B.right_spoiler_5_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_p);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_5_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_5_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.left_inboard_elevator_deg;
    }

    rtb_OR_jr = ((!A380PrimComputerFctl_B.spoiler_pair_6_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs16_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs16_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.left_spoiler_6_deg_o, rtb_OR_jr, &A380PrimComputerFctl_B.left_spoiler_6_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_f1);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_6_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_6_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.right_inboard_elevator_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs17_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs17_lo, A380PrimComputerFctl_U.in.data.time.dt,
      A380PrimComputerFctl_B.right_spoiler_6_deg_d, rtb_OR_jr, &A380PrimComputerFctl_B.right_spoiler_6_deg,
      &A380PrimComputerFctl_DWork.sf_RateLimiter_ob);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_6_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_6_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      rtb_Y_ms = A380PrimComputerFctl_B.left_spoiler_8_deg;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.left_inboard_elevator_deg;
    }

    rtb_OR_jr = ((!A380PrimComputerFctl_B.spoiler_pair_7_engaged) || rtb_protection_active);
    A380PrimComputerFctl_RateLimiter_h(rtb_Y_ms, A380PrimComputerFctl_P.RateLimiterGenericVariableTs22_up,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs22_lo, A380PrimComputerFctl_U.in.data.time.dt, static_cast<
      real_T>(A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data), rtb_OR_jr,
      &A380PrimComputerFctl_B.left_spoiler_7_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_n);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_7_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_7_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      A380PrimComputerFctl_B.right_inboard_elevator_deg = A380PrimComputerFctl_B.left_spoiler_8_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(A380PrimComputerFctl_B.right_inboard_elevator_deg,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs23_up, A380PrimComputerFctl_P.RateLimiterGenericVariableTs23_lo,
      A380PrimComputerFctl_U.in.data.time.dt, static_cast<real_T>
      (A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data), rtb_OR_jr,
      &A380PrimComputerFctl_B.right_spoiler_7_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_la);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.right_spoiler_7_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_spoiler_7_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
      }
    }

    if (rtb_y_pf) {
      A380PrimComputerFctl_B.left_inboard_elevator_deg = A380PrimComputerFctl_B.left_spoiler_8_deg;
    }

    A380PrimComputerFctl_RateLimiter_h(A380PrimComputerFctl_B.left_inboard_elevator_deg,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs20_up, A380PrimComputerFctl_P.RateLimiterGenericVariableTs20_lo,
      A380PrimComputerFctl_U.in.data.time.dt, static_cast<real_T>
      (A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data), rtb_OR_i,
      &A380PrimComputerFctl_B.left_spoiler_8_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_iq);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_d) {
        A380PrimComputerFctl_B.left_spoiler_8_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_spoiler_8_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
      }
    }

    rtb_Y_gl = A380PrimComputerFctl_P.DiscreteDerivativeVariableTs_Gain *
      A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_dot_deg_s;
    A380PrimComputerFctl_LagFilter((rtb_Y_gl - A380PrimComputerFctl_DWork.Delay_DSTATE) /
      A380PrimComputerFctl_U.in.data.time.dt, A380PrimComputerFctl_P.LagFilter_C1,
      A380PrimComputerFctl_U.in.data.time.dt, &rtb_Y_ms, &A380PrimComputerFctl_DWork.sf_LagFilter_k);
    rtb_Gain_p = ((A380PrimComputerFctl_B.left_inboard_elevator_deg_k +
                   A380PrimComputerFctl_B.right_inboard_elevator_deg_o) +
                  A380PrimComputerFctl_B.left_outboard_elevator_deg_p) +
      A380PrimComputerFctl_B.right_outboard_elevator_deg_g;
    rtb_Gain_cu = rtb_Gain_p * A380PrimComputerFctl_P.Gain_Gain_p;
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_j, &rtb_DataTypeConversion1_j);
    rtb_OR_i = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_h, &rtb_DataTypeConversion1_j);
    rtb_OR_jr = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_he, &rtb_DataTypeConversion1_j);
    rtb_OR_d = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel3_bit_l, &rtb_DataTypeConversion1_j);
    rtb_Equal = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_nn, &rtb_DataTypeConversion1_j);
    rtb_y_pf = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_f, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction_m(rtb_OR_i, rtb_OR_jr, rtb_OR_d, rtb_Equal, rtb_y_pf, (rtb_DataTypeConversion1_j
      != 0U), &rtb_handleIndex_a);
    rtb_OR_jr = (A380PrimComputerFctl_U.in.general_logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputerFctl_B.active_pitch_law) != A380PrimComputerFctl_P.CompareToConstant_const_b) &&
      (static_cast<real_T>(A380PrimComputerFctl_B.active_pitch_law) != A380PrimComputerFctl_P.CompareToConstant2_const_h)));
    LawMDLOBJ5.step(&A380PrimComputerFctl_U.in.data.time.dt, &A380PrimComputerFctl_U.in.data.time.simulation_time,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.n_z_g,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_dot_deg_s, &rtb_Y_ms,
                    &rtb_Gain_cu, &A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft, &rtb_handleIndex_a,
                    (const_cast<real_T*>(&A380PrimComputerFctl_RGND)), (const_cast<real_T*>(&A380PrimComputerFctl_RGND)),
                    &A380PrimComputerFctl_P.Constant_Value_g, &A380PrimComputerFctl_P.Constant_Value_g,
                    &A380PrimComputerFctl_U.in.data.sim_data.tailstrike_protection_on, (const_cast<real_T*>
      (&A380PrimComputerFctl_RGND)), &A380PrimComputerFctl_B.total_sidestick_pitch_command,
                    &A380PrimComputerFctl_U.in.general_logic.on_ground, &rtb_OR_jr,
                    &A380PrimComputerFctl_DWork.sProtActive_g, &A380PrimComputerFctl_DWork.sProtActive,
                    &A380PrimComputerFctl_B.alpha_prot_deg, &A380PrimComputerFctl_B.alpha_max_deg,
                    &A380PrimComputerFctl_B.high_speed_prot_hi_thresh_kn,
                    &A380PrimComputerFctl_B.high_speed_prot_lo_thresh_kn,
                    &A380PrimComputerFctl_U.in.data.temporary_ap_input.pitch_command,
                    &A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged, &rtb_eta_deg, &rtb_eta_trim_dot_deg_s,
                    &rtb_eta_trim_limit_lo, &rtb_eta_trim_limit_up);
    rtb_Gain_p *= A380PrimComputerFctl_P.Gain_Gain_a;
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel_bit_d, &rtb_DataTypeConversion1_j);
    rtb_OR_i = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel1_bit_lh, &rtb_DataTypeConversion1_j);
    rtb_OR_jr = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel2_bit_c, &rtb_DataTypeConversion1_j);
    rtb_OR_d = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel3_bit_i, &rtb_DataTypeConversion1_j);
    rtb_Equal = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel4_bit_o, &rtb_DataTypeConversion1_j);
    rtb_y_pf = (rtb_DataTypeConversion1_j != 0U);
    A380PrimComputerFctl_MATLABFunction_p
      (&A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
       A380PrimComputerFctl_P.BitfromLabel5_bit_ft, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction_m(rtb_OR_i, rtb_OR_jr, rtb_OR_d, rtb_Equal, rtb_y_pf, (rtb_DataTypeConversion1_j
      != 0U), &rtb_handleIndex_h);
    rtb_OR_d = (A380PrimComputerFctl_U.in.general_logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputerFctl_B.active_pitch_law) != A380PrimComputerFctl_P.CompareToConstant3_const_m) &&
      (static_cast<real_T>(A380PrimComputerFctl_B.active_pitch_law) != A380PrimComputerFctl_P.CompareToConstant4_const_e)
      && (static_cast<real_T>(A380PrimComputerFctl_B.active_pitch_law) !=
          A380PrimComputerFctl_P.CompareToConstant5_const_p)));
    rtb_Equal = (A380PrimComputerFctl_B.active_pitch_law != A380PrimComputerFctl_P.EnumeratedConstant_Value_j);
    LawMDLOBJ3.step(&A380PrimComputerFctl_U.in.data.time.dt, &A380PrimComputerFctl_U.in.data.time.simulation_time,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.n_z_g,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg,
                    &A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_dot_deg_s, &rtb_Gain_p,
                    &A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg,
                    &A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft, &rtb_handleIndex_h,
                    (const_cast<real_T*>(&A380PrimComputerFctl_RGND)), (const_cast<real_T*>(&A380PrimComputerFctl_RGND)),
                    &A380PrimComputerFctl_B.total_sidestick_pitch_command,
                    &A380PrimComputerFctl_U.in.general_logic.on_ground, &rtb_OR_d, &rtb_Equal, &rtb_eta_deg_h,
                    &rtb_eta_trim_dot_deg_s_p, &rtb_eta_trim_limit_lo_m, &rtb_eta_trim_limit_up_c);
    LawMDLOBJ4.step(&A380PrimComputerFctl_U.in.data.time.dt, &A380PrimComputerFctl_B.total_sidestick_pitch_command,
                    &rtb_eta_deg_c, &rtb_eta_trim_dot_deg_s_l, &rtb_eta_trim_limit_lo_o, &rtb_eta_trim_limit_up_n);
    switch (static_cast<int32_T>(A380PrimComputerFctl_B.active_pitch_law)) {
     case 0:
     case 1:
      rtb_Gain_cu = rtb_eta_deg;
      break;

     case 2:
     case 3:
     case 4:
      rtb_Gain_cu = rtb_eta_deg_h;
      break;

     case 5:
      rtb_Gain_cu = rtb_eta_deg_c;
      break;

     default:
      rtb_Gain_cu = A380PrimComputerFctl_P.Constant_Value_j;
      break;
    }

    if (A380PrimComputerFctl_B.left_inboard_elevator_deg_k > A380PrimComputerFctl_P.Saturation3_UpperSat_o) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation3_UpperSat_o;
    } else if (A380PrimComputerFctl_B.left_inboard_elevator_deg_k < A380PrimComputerFctl_P.Saturation3_LowerSat_f) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation3_LowerSat_f;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.left_inboard_elevator_deg_k;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs_up_b,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs_lo_c, A380PrimComputerFctl_U.in.data.time.dt, rtb_Y_ms,
      ((!A380PrimComputerFctl_B.left_inboard_elevator_engaged) || rtb_protection_active),
      &A380PrimComputerFctl_B.left_inboard_elevator_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_mp);
    A380PrimComputerFctl_MATLABFunction_p(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputerFctl_P.BitfromLabel_bit_hy, &rtb_DataTypeConversion1_j);
    A380PrimComputerFctl_MATLABFunction(&A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word,
      &rtb_Equal);
    rtb_OR_i = ((rtb_DataTypeConversion1_j != 0U) && rtb_Equal);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_i) {
        A380PrimComputerFctl_B.left_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
      }
    }

    if (A380PrimComputerFctl_B.right_inboard_elevator_deg_o > A380PrimComputerFctl_P.Saturation2_UpperSat_l) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation2_UpperSat_l;
    } else if (A380PrimComputerFctl_B.right_inboard_elevator_deg_o < A380PrimComputerFctl_P.Saturation2_LowerSat_l) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation2_LowerSat_l;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.right_inboard_elevator_deg_o;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_up_g,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs1_lo_a, A380PrimComputerFctl_U.in.data.time.dt, rtb_Y_ms,
      ((!A380PrimComputerFctl_B.right_inboard_elevator_engaged) || rtb_protection_active),
      &A380PrimComputerFctl_B.right_inboard_elevator_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_c4);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_i) {
        A380PrimComputerFctl_B.right_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_inboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
      }
    }

    if (A380PrimComputerFctl_B.left_outboard_elevator_deg_p > A380PrimComputerFctl_P.Saturation_UpperSat_g) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation_UpperSat_g;
    } else if (A380PrimComputerFctl_B.left_outboard_elevator_deg_p < A380PrimComputerFctl_P.Saturation_LowerSat_c) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation_LowerSat_c;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.left_outboard_elevator_deg_p;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_up_d,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs2_lo_m, A380PrimComputerFctl_U.in.data.time.dt, rtb_Y_ms,
      ((!A380PrimComputerFctl_B.left_outboard_elevator_engaged) || rtb_protection_active),
      &A380PrimComputerFctl_B.left_outboard_elevator_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_bx);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_i) {
        A380PrimComputerFctl_B.left_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.left_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
      }
    }

    if (A380PrimComputerFctl_B.right_outboard_elevator_deg_g > A380PrimComputerFctl_P.Saturation1_UpperSat_m) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation1_UpperSat_m;
    } else if (A380PrimComputerFctl_B.right_outboard_elevator_deg_g < A380PrimComputerFctl_P.Saturation1_LowerSat_b) {
      rtb_Y_ms = A380PrimComputerFctl_P.Saturation1_LowerSat_b;
    } else {
      rtb_Y_ms = A380PrimComputerFctl_B.right_outboard_elevator_deg_g;
    }

    A380PrimComputerFctl_RateLimiter_h(rtb_Gain_cu, A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_up_m,
      A380PrimComputerFctl_P.RateLimiterGenericVariableTs3_lo_p, A380PrimComputerFctl_U.in.data.time.dt, rtb_Y_ms,
      ((!A380PrimComputerFctl_B.right_outboard_elevator_engaged) || rtb_protection_active),
      &A380PrimComputerFctl_B.right_outboard_elevator_deg, &A380PrimComputerFctl_DWork.sf_RateLimiter_j);
    if (!A380PrimComputerFctl_B.is_master_prim) {
      if (rtb_OR_i) {
        A380PrimComputerFctl_B.right_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.right_outboard_elevator_deg =
          A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
      }
    }

    switch (static_cast<int32_T>(A380PrimComputerFctl_B.active_pitch_law)) {
     case 0:
     case 1:
      rtb_handleIndex_a = rtb_eta_trim_limit_up;
      break;

     case 2:
     case 3:
     case 4:
      rtb_handleIndex_a = rtb_eta_trim_limit_up_c;
      break;

     case 5:
      rtb_handleIndex_a = rtb_eta_trim_limit_up_n;
      break;

     default:
      rtb_handleIndex_a = A380PrimComputerFctl_P.Constant2_Value_g;
      break;
    }

    if (A380PrimComputerFctl_B.ths_automatic_mode_active) {
      switch (static_cast<int32_T>(A380PrimComputerFctl_B.active_pitch_law)) {
       case 0:
       case 1:
        rtb_Gain_cu = rtb_eta_trim_dot_deg_s;
        break;

       case 2:
       case 3:
       case 4:
        rtb_Gain_cu = rtb_eta_trim_dot_deg_s_p;
        break;

       case 5:
        rtb_Gain_cu = rtb_eta_trim_dot_deg_s_l;
        break;

       default:
        rtb_Gain_cu = A380PrimComputerFctl_P.Constant_Value_j;
        break;
      }

      rtb_protection_active = ((!A380PrimComputerFctl_B.ths_engaged) || rtb_protection_active);
    } else {
      rtb_Gain_cu = A380PrimComputerFctl_B.ths_manual_mode_c_deg_s;
      rtb_protection_active = !A380PrimComputerFctl_B.ths_engaged_h;
    }

    rtb_Gain_cu = A380PrimComputerFctl_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_Gain_cu *
      A380PrimComputerFctl_U.in.data.time.dt;
    A380PrimComputerFctl_DWork.icLoad = (rtb_protection_active || A380PrimComputerFctl_DWork.icLoad);
    if (A380PrimComputerFctl_DWork.icLoad) {
      A380PrimComputerFctl_DWork.Delay_DSTATE_m = A380PrimComputerFctl_B.ths_deg_o - rtb_Gain_cu;
    }

    A380PrimComputerFctl_DWork.Delay_DSTATE_m += rtb_Gain_cu;
    if (A380PrimComputerFctl_DWork.Delay_DSTATE_m > rtb_handleIndex_a) {
      A380PrimComputerFctl_DWork.Delay_DSTATE_m = rtb_handleIndex_a;
    } else {
      switch (static_cast<int32_T>(A380PrimComputerFctl_B.active_pitch_law)) {
       case 0:
       case 1:
        rtb_Y_ms = rtb_eta_trim_limit_lo;
        break;

       case 2:
       case 3:
       case 4:
        rtb_Y_ms = rtb_eta_trim_limit_lo_m;
        break;

       case 5:
        rtb_Y_ms = rtb_eta_trim_limit_lo_o;
        break;

       default:
        rtb_Y_ms = A380PrimComputerFctl_P.Constant3_Value_m;
        break;
      }

      if (A380PrimComputerFctl_DWork.Delay_DSTATE_m < rtb_Y_ms) {
        A380PrimComputerFctl_DWork.Delay_DSTATE_m = rtb_Y_ms;
      }
    }

    if (A380PrimComputerFctl_B.is_master_prim) {
      A380PrimComputerFctl_B.ths_deg = A380PrimComputerFctl_DWork.Delay_DSTATE_m;
    } else if (A380PrimComputerFctl_B.ths_automatic_mode_active) {
      if (rtb_OR_i) {
        A380PrimComputerFctl_B.ths_deg = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.ths_command_deg.Data;
      } else {
        A380PrimComputerFctl_B.ths_deg = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.ths_command_deg.Data;
      }
    } else {
      A380PrimComputerFctl_B.ths_deg = A380PrimComputerFctl_DWork.Delay_DSTATE_m;
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.elevator_1_pos_order_deg = A380PrimComputerFctl_B.left_outboard_elevator_deg;
      A380PrimComputerFctl_B.elevator_2_pos_order_deg = A380PrimComputerFctl_B.left_inboard_elevator_deg;
      A380PrimComputerFctl_B.elevator_3_pos_order_deg = A380PrimComputerFctl_B.right_outboard_elevator_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.elevator_1_pos_order_deg = A380PrimComputerFctl_B.right_outboard_elevator_deg;
      A380PrimComputerFctl_B.elevator_2_pos_order_deg = A380PrimComputerFctl_B.left_outboard_elevator_deg;
      A380PrimComputerFctl_B.elevator_3_pos_order_deg = A380PrimComputerFctl_B.right_inboard_elevator_deg;
    } else {
      A380PrimComputerFctl_B.elevator_1_pos_order_deg = A380PrimComputerFctl_B.left_inboard_elevator_deg;
      A380PrimComputerFctl_B.elevator_2_pos_order_deg = A380PrimComputerFctl_B.right_inboard_elevator_deg;
      A380PrimComputerFctl_B.elevator_3_pos_order_deg = 0.0;
    }

    if (!A380PrimComputerFctl_B.elevator_1_avail) {
      A380PrimComputerFctl_B.elevator_1_pos_order_deg = A380PrimComputerFctl_P.Constant_Value_b;
    }

    if (!A380PrimComputerFctl_B.elevator_2_engaged) {
      A380PrimComputerFctl_B.elevator_2_pos_order_deg = A380PrimComputerFctl_P.Constant1_Value_n;
    }

    if (!A380PrimComputerFctl_B.elevator_3_engaged) {
      A380PrimComputerFctl_B.elevator_3_pos_order_deg = A380PrimComputerFctl_P.Constant2_Value_k;
    }

    if (A380PrimComputerFctl_B.is_master_prim) {
      A380PrimComputerFctl_B.Data_f = static_cast<real32_T>(A380PrimComputerFctl_B.ths_deg);
    } else {
      A380PrimComputerFctl_B.Data_f = A380PrimComputerFctl_P.Constant2_Value_n;
    }

    if (A380PrimComputerFctl_B.ths_engaged_h) {
      A380PrimComputerFctl_B.ths_pos_order_deg = A380PrimComputerFctl_B.ths_deg;
    } else {
      A380PrimComputerFctl_B.ths_pos_order_deg = A380PrimComputerFctl_P.Constant3_Value_g;
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.left_aileron_1_pos_order_deg = A380PrimComputerFctl_B.left_inboard_aileron_deg;
      A380PrimComputerFctl_B.right_aileron_1_pos_order_deg = A380PrimComputerFctl_B.right_inboard_aileron_deg;
      A380PrimComputerFctl_B.left_aileron_2_pos_order_deg = A380PrimComputerFctl_B.left_midboard_aileron_deg;
      A380PrimComputerFctl_B.right_aileron_2_pos_order_deg = A380PrimComputerFctl_B.right_midboard_aileron_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.left_aileron_1_pos_order_deg = A380PrimComputerFctl_B.left_outboard_aileron_deg;
      A380PrimComputerFctl_B.right_aileron_1_pos_order_deg = A380PrimComputerFctl_B.right_outboard_aileron_deg;
      A380PrimComputerFctl_B.left_aileron_2_pos_order_deg = A380PrimComputerFctl_B.left_inboard_aileron_deg;
      A380PrimComputerFctl_B.right_aileron_2_pos_order_deg = A380PrimComputerFctl_B.right_inboard_aileron_deg;
    } else {
      A380PrimComputerFctl_B.left_aileron_1_pos_order_deg = A380PrimComputerFctl_B.left_midboard_aileron_deg;
      A380PrimComputerFctl_B.right_aileron_1_pos_order_deg = A380PrimComputerFctl_B.right_midboard_aileron_deg;
      A380PrimComputerFctl_B.left_aileron_2_pos_order_deg = A380PrimComputerFctl_B.left_outboard_aileron_deg;
      A380PrimComputerFctl_B.right_aileron_2_pos_order_deg = A380PrimComputerFctl_B.right_outboard_aileron_deg;
    }

    if (!A380PrimComputerFctl_B.left_aileron_1_avail) {
      A380PrimComputerFctl_B.left_aileron_1_pos_order_deg = A380PrimComputerFctl_P.Constant4_Value_i;
    }

    if (!A380PrimComputerFctl_B.left_aileron_2_engaged) {
      A380PrimComputerFctl_B.left_aileron_2_pos_order_deg = A380PrimComputerFctl_P.Constant5_Value_n;
    }

    if (!A380PrimComputerFctl_B.right_aileron_1_avail) {
      A380PrimComputerFctl_B.right_aileron_1_pos_order_deg = A380PrimComputerFctl_P.Constant6_Value_f;
    }

    if (!A380PrimComputerFctl_B.right_aileron_2_engaged) {
      A380PrimComputerFctl_B.right_aileron_2_pos_order_deg = A380PrimComputerFctl_P.Constant7_Value;
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.left_spoiler_pos_order_deg = A380PrimComputerFctl_B.left_spoiler_6_deg;
      A380PrimComputerFctl_B.right_spoiler_pos_order_deg = A380PrimComputerFctl_B.right_spoiler_6_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.left_spoiler_pos_order_deg = A380PrimComputerFctl_B.left_spoiler_5_deg;
      A380PrimComputerFctl_B.right_spoiler_pos_order_deg = A380PrimComputerFctl_B.right_spoiler_5_deg;
    } else {
      A380PrimComputerFctl_B.left_spoiler_pos_order_deg = A380PrimComputerFctl_B.left_spoiler_4_deg;
      A380PrimComputerFctl_B.right_spoiler_pos_order_deg = A380PrimComputerFctl_B.right_spoiler_4_deg;
    }

    if ((!A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged) &&
        (!A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged)) {
      A380PrimComputerFctl_B.left_spoiler_pos_order_deg = A380PrimComputerFctl_P.Constant8_Value;
      A380PrimComputerFctl_B.right_spoiler_pos_order_deg = A380PrimComputerFctl_P.Constant9_Value_n;
    }

    if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1) {
      A380PrimComputerFctl_B.rudder_1_pos_order_deg = A380PrimComputerFctl_B.upper_rudder_deg;
      A380PrimComputerFctl_B.rudder_2_pos_order_deg = A380PrimComputerFctl_B.lower_rudder_deg;
    } else if (A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2) {
      A380PrimComputerFctl_B.rudder_1_pos_order_deg = A380PrimComputerFctl_B.upper_rudder_deg;
      A380PrimComputerFctl_B.rudder_2_pos_order_deg = 0.0;
    } else {
      A380PrimComputerFctl_B.rudder_1_pos_order_deg = A380PrimComputerFctl_B.lower_rudder_deg;
      A380PrimComputerFctl_B.rudder_2_pos_order_deg = 0.0;
    }

    if ((!A380PrimComputerFctl_B.rudder_1_electric_mode_engaged) &&
        (!A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged)) {
      A380PrimComputerFctl_B.rudder_1_pos_order_deg = A380PrimComputerFctl_P.Constant10_Value;
    }

    if ((!A380PrimComputerFctl_B.rudder_2_electric_mode_engaged) &&
        (!A380PrimComputerFctl_B.rudder_2_hydraulic_mode_engaged)) {
      A380PrimComputerFctl_B.rudder_2_pos_order_deg = A380PrimComputerFctl_P.Constant11_Value;
    }

    if (A380PrimComputerFctl_B.is_master_prim) {
      A380PrimComputerFctl_B.Data_fw = static_cast<real32_T>(A380PrimComputerFctl_B.right_outboard_elevator_deg);
      A380PrimComputerFctl_B.Data_fwx = static_cast<real32_T>(A380PrimComputerFctl_B.left_outboard_elevator_deg);
      A380PrimComputerFctl_B.Data_fwxk = static_cast<real32_T>(A380PrimComputerFctl_B.right_inboard_elevator_deg);
      A380PrimComputerFctl_B.Data_fwxkf = static_cast<real32_T>(A380PrimComputerFctl_B.left_inboard_elevator_deg);
      A380PrimComputerFctl_B.Data_fwxkft = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_8_deg);
      A380PrimComputerFctl_B.Data_fwxkftc = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_7_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3 = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_7_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3e = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_6_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3ep = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_6_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3epg = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_5_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3epgt = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_5_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3epgtd = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_4_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3epgtdx = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_4_deg);
      A380PrimComputerFctl_B.Data_fwxkftc3epgtdxc = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_3_deg);
      A380PrimComputerFctl_B.Data_h = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_3_deg);
      A380PrimComputerFctl_B.Data_e = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_2_deg);
      A380PrimComputerFctl_B.Data_j = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_2_deg);
      A380PrimComputerFctl_B.Data_d = static_cast<real32_T>(A380PrimComputerFctl_B.right_spoiler_1_deg);
      A380PrimComputerFctl_B.Data_p = static_cast<real32_T>(A380PrimComputerFctl_B.left_spoiler_1_deg);
      A380PrimComputerFctl_B.Data_i = static_cast<real32_T>(A380PrimComputerFctl_B.right_outboard_aileron_deg);
      A380PrimComputerFctl_B.Data_g = static_cast<real32_T>(A380PrimComputerFctl_B.left_outboard_aileron_deg);
      A380PrimComputerFctl_B.Data_a = static_cast<real32_T>(A380PrimComputerFctl_B.right_midboard_aileron_deg);
      A380PrimComputerFctl_B.Data_eb = static_cast<real32_T>(A380PrimComputerFctl_B.left_midboard_aileron_deg);
      A380PrimComputerFctl_B.Data_jo = static_cast<real32_T>(A380PrimComputerFctl_B.right_inboard_aileron_deg);
      A380PrimComputerFctl_B.Data_ex = static_cast<real32_T>(A380PrimComputerFctl_B.left_inboard_aileron_deg);
      A380PrimComputerFctl_B.Data_fd = static_cast<real32_T>(A380PrimComputerFctl_B.lower_rudder_deg);
      A380PrimComputerFctl_B.Data_ja = static_cast<real32_T>(A380PrimComputerFctl_B.upper_rudder_deg);
    } else {
      A380PrimComputerFctl_B.Data_fw = A380PrimComputerFctl_P.Constant35_Value;
      A380PrimComputerFctl_B.Data_fwx = A380PrimComputerFctl_P.Constant34_Value;
      A380PrimComputerFctl_B.Data_fwxk = A380PrimComputerFctl_P.Constant33_Value;
      A380PrimComputerFctl_B.Data_fwxkf = A380PrimComputerFctl_P.Constant3_Value_mi;
      A380PrimComputerFctl_B.Data_fwxkft = A380PrimComputerFctl_P.Constant32_Value;
      A380PrimComputerFctl_B.Data_fwxkftc = A380PrimComputerFctl_P.Constant29_Value;
      A380PrimComputerFctl_B.Data_fwxkftc3 = A380PrimComputerFctl_P.Constant30_Value;
      A380PrimComputerFctl_B.Data_fwxkftc3e = A380PrimComputerFctl_P.Constant4_Value_p;
      A380PrimComputerFctl_B.Data_fwxkftc3ep = A380PrimComputerFctl_P.Constant5_Value_c;
      A380PrimComputerFctl_B.Data_fwxkftc3epg = A380PrimComputerFctl_P.Constant27_Value;
      A380PrimComputerFctl_B.Data_fwxkftc3epgt = A380PrimComputerFctl_P.Constant28_Value;
      A380PrimComputerFctl_B.Data_fwxkftc3epgtd = A380PrimComputerFctl_P.Constant25_Value;
      A380PrimComputerFctl_B.Data_fwxkftc3epgtdx = A380PrimComputerFctl_P.Constant26_Value;
      A380PrimComputerFctl_B.Data_fwxkftc3epgtdxc = A380PrimComputerFctl_P.Constant6_Value_a;
      A380PrimComputerFctl_B.Data_h = A380PrimComputerFctl_P.Constant7_Value_a;
      A380PrimComputerFctl_B.Data_e = A380PrimComputerFctl_P.Constant23_Value;
      A380PrimComputerFctl_B.Data_j = A380PrimComputerFctl_P.Constant24_Value;
      A380PrimComputerFctl_B.Data_d = A380PrimComputerFctl_P.Constant8_Value_l;
      A380PrimComputerFctl_B.Data_p = A380PrimComputerFctl_P.Constant9_Value_d;
      A380PrimComputerFctl_B.Data_i = A380PrimComputerFctl_P.Constant10_Value_d;
      A380PrimComputerFctl_B.Data_g = A380PrimComputerFctl_P.Constant11_Value_i;
      A380PrimComputerFctl_B.Data_a = A380PrimComputerFctl_P.Constant12_Value;
      A380PrimComputerFctl_B.Data_eb = A380PrimComputerFctl_P.Constant13_Value;
      A380PrimComputerFctl_B.Data_jo = A380PrimComputerFctl_P.Constant14_Value;
      A380PrimComputerFctl_B.Data_ex = A380PrimComputerFctl_P.Constant20_Value;
      A380PrimComputerFctl_B.Data_fd = A380PrimComputerFctl_P.Constant15_Value;
      A380PrimComputerFctl_B.Data_ja = A380PrimComputerFctl_P.Constant1_Value_g;
    }

    rtb_VectorConcatenate_b[0] = A380PrimComputerFctl_B.ths_automatic_mode_active;
    rtb_VectorConcatenate_o[0] = A380PrimComputerFctl_B.ap_authorised;
    rtb_VectorConcatenate_o[1] = A380PrimComputerFctl_B.protection_ap_disconnect;
    A380PrimComputerFctl_B.high_speed_prot_active = A380PrimComputerFctl_DWork.sProtActive;
    A380PrimComputerFctl_B.high_alpha_prot_active = A380PrimComputerFctl_DWork.sProtActive_g;
    A380PrimComputerFctl_B.left_sidestick_disabled = A380PrimComputerFctl_DWork.pLeftStickDisabled;
    A380PrimComputerFctl_B.right_sidestick_disabled = A380PrimComputerFctl_DWork.pRightStickDisabled;
    A380PrimComputerFctl_MATLABFunction_b(A380PrimComputerFctl_B.active_pitch_law, &rtb_VectorConcatenate_k[5],
      &rtb_VectorConcatenate_k[6], &rtb_VectorConcatenate_k[7]);
    A380PrimComputerFctl_MATLABFunction2(A380PrimComputerFctl_B.active_lateral_law, &rtb_VectorConcatenate_k[8],
      &rtb_VectorConcatenate_k[9]);
    if (A380PrimComputerFctl_B.is_master_prim) {
      A380PrimComputerFctl_B.SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_k = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kx = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxx = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxt = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxta = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0 = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0z = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0zt = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztg = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2 = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2u = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2ux = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2uxn = static_cast<uint32_T>
        (A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_ky = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_d = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_h = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_kb = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_p = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_di = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_j = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_i = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_g = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_db = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_n = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_a = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
      A380PrimComputerFctl_B.SSM_ir = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputerFctl_B.SSM = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_k = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kx = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxx = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxt = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxta = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0 = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0z = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0zt = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztg = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2 = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2u = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2ux = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kxxtac0ztgf2uxn = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_ky = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_d = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_h = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_kb = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_p = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_di = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_j = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_i = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_g = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_db = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_n = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_a = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
      A380PrimComputerFctl_B.SSM_ir = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant_Value);
    }

    A380PrimComputerFctl_B.SSM_hu = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_e = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_gr = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_ev = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_l = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_ei = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_an = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_c = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_cb = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_lb = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_ia = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_kyz = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_as = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_is = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_ca = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_o = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_ak = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_cbj = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_cu = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_nn = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_b = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_m = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_f = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_bp = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    A380PrimComputerFctl_B.SSM_hb = static_cast<uint32_T>(A380PrimComputerFctl_P.EnumeratedConstant1_Value);
    rtb_VectorConcatenate_k[10] = A380PrimComputerFctl_B.is_master_prim;
    A380PrimComputerFctl_MATLABFunction2(A380PrimComputerFctl_B.lateral_law_capability, &rtb_VectorConcatenate_k[3],
      &rtb_VectorConcatenate_k[4]);
    A380PrimComputerFctl_MATLABFunction_b(A380PrimComputerFctl_B.pitch_law_capability, &rtb_VectorConcatenate_k[0],
      &rtb_VectorConcatenate_k[1], &rtb_VectorConcatenate_k[2]);
    A380PrimComputerFctl_B.right_spoiler_8_deg_j =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.left_spoiler_8_deg_h =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.right_spoiler_7_deg_j =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.left_spoiler_7_deg_a =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.right_spoiler_3_deg_b =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.left_spoiler_3_deg_i =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.right_spoiler_2_deg_g =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.left_spoiler_2_deg_i =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.right_spoiler_1_deg_o =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.left_spoiler_1_deg_b =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
    rtb_VectorConcatenate_p[6] = A380PrimComputerFctl_B.rudder_2_hydraulic_mode_avail;
    rtb_VectorConcatenate_p[7] = A380PrimComputerFctl_B.rudder_2_electric_mode_avail;
    rtb_VectorConcatenate_p[8] = A380PrimComputerFctl_B.rudder_2_hydraulic_mode_engaged;
    rtb_VectorConcatenate_p[9] = A380PrimComputerFctl_B.rudder_2_electric_mode_engaged;
    A380PrimComputerFctl_B.rudder_2_hydraulic_active_mode = A380PrimComputerFctl_B.rudder_2_hydraulic_mode_engaged;
    A380PrimComputerFctl_B.rudder_2_electric_active_mode = A380PrimComputerFctl_B.rudder_2_electric_mode_engaged;
    rtb_VectorConcatenate_p[0] = A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail;
    rtb_VectorConcatenate_p[1] = A380PrimComputerFctl_B.rudder_1_electric_mode_avail;
    rtb_VectorConcatenate_p[2] = A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged;
    rtb_VectorConcatenate_p[3] = A380PrimComputerFctl_B.rudder_1_electric_mode_engaged;
    A380PrimComputerFctl_B.rudder_1_hydraulic_active_mode = A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged;
    A380PrimComputerFctl_B.rudder_1_electric_active_mode = A380PrimComputerFctl_B.rudder_1_electric_mode_engaged;
    rtb_VectorConcatenate_a[9] = A380PrimComputerFctl_B.ths_avail;
    rtb_VectorConcatenate_a[10] = A380PrimComputerFctl_B.ths_engaged_h;
    A380PrimComputerFctl_B.ths_active_mode = A380PrimComputerFctl_B.ths_engaged_h;
    rtb_VectorConcatenate_a[6] = A380PrimComputerFctl_B.elevator_3_avail;
    rtb_VectorConcatenate_a[7] = A380PrimComputerFctl_B.elevator_3_engaged;
    A380PrimComputerFctl_B.elevator_3_active_mode = A380PrimComputerFctl_B.elevator_3_engaged;
    rtb_VectorConcatenate_a[3] = A380PrimComputerFctl_B.elevator_2_avail;
    rtb_VectorConcatenate_a[4] = A380PrimComputerFctl_B.elevator_2_engaged;
    A380PrimComputerFctl_B.elevator_2_active_mode = A380PrimComputerFctl_B.elevator_2_engaged;
    rtb_VectorConcatenate_a[0] = A380PrimComputerFctl_B.elevator_1_avail;
    rtb_VectorConcatenate_a[1] = A380PrimComputerFctl_B.elevator_1_avail;
    A380PrimComputerFctl_B.elevator_1_engaged = A380PrimComputerFctl_B.elevator_1_avail;
    A380PrimComputerFctl_B.elevator_1_active_mode = A380PrimComputerFctl_B.elevator_1_avail;
    rtb_VectorConcatenate_i[0] = A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate_i[1] = A380PrimComputerFctl_B.left_spoiler_electric_mode_avail;
    rtb_VectorConcatenate_i[2] = A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged;
    rtb_VectorConcatenate_i[3] = A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate_i[6] = A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate_i[7] = A380PrimComputerFctl_B.right_spoiler_electric_mode_avail;
    rtb_VectorConcatenate_i[8] = A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged;
    rtb_VectorConcatenate_i[9] = A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged;
    A380PrimComputerFctl_B.left_spoiler_electronic_module_enable =
      A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged;
    A380PrimComputerFctl_B.right_spoiler_electronic_module_enable =
      A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate[6] = A380PrimComputerFctl_B.left_aileron_2_avail;
    rtb_VectorConcatenate[7] = A380PrimComputerFctl_B.left_aileron_2_engaged;
    rtb_VectorConcatenate[9] = A380PrimComputerFctl_B.right_aileron_2_avail;
    rtb_VectorConcatenate[10] = A380PrimComputerFctl_B.right_aileron_2_engaged;
    A380PrimComputerFctl_B.left_aileron_2_active_mode = A380PrimComputerFctl_B.left_aileron_2_engaged;
    A380PrimComputerFctl_B.right_aileron_2_active_mode = A380PrimComputerFctl_B.right_aileron_2_engaged;
    rtb_VectorConcatenate[0] = A380PrimComputerFctl_B.left_aileron_1_avail;
    rtb_VectorConcatenate[1] = A380PrimComputerFctl_B.left_aileron_1_avail;
    rtb_VectorConcatenate[3] = A380PrimComputerFctl_B.right_aileron_1_avail;
    rtb_VectorConcatenate[4] = A380PrimComputerFctl_B.right_aileron_1_avail;
    A380PrimComputerFctl_B.left_aileron_1_engaged = A380PrimComputerFctl_B.left_aileron_1_avail;
    A380PrimComputerFctl_B.right_aileron_1_engaged = A380PrimComputerFctl_B.right_aileron_1_avail;
    A380PrimComputerFctl_B.left_aileron_1_active_mode = A380PrimComputerFctl_B.left_aileron_1_avail;
    A380PrimComputerFctl_B.right_aileron_1_active_mode = A380PrimComputerFctl_B.right_aileron_1_avail;
    A380PrimComputerFctl_B.ground_spoilers_out = A380PrimComputerFctl_DWork.Delay1_DSTATE;
    rtb_VectorConcatenate[2] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[5] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[8] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[11] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[12] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[13] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[14] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[15] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[16] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[17] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate[18] = A380PrimComputerFctl_P.Constant16_Value;
    rtb_VectorConcatenate_i[4] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[5] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[10] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[11] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[12] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[13] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[14] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[15] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[16] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[17] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_i[18] = A380PrimComputerFctl_P.Constant17_Value;
    rtb_VectorConcatenate_a[2] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[5] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[8] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[11] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[12] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[13] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[14] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[15] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[16] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[17] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_a[18] = A380PrimComputerFctl_P.Constant18_Value;
    rtb_VectorConcatenate_p[4] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[5] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[10] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[11] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[12] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[13] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[14] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[15] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[16] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[17] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_p[18] = A380PrimComputerFctl_P.Constant19_Value;
    rtb_VectorConcatenate_k[11] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_k[12] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_k[13] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_k[14] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_k[15] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_k[16] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_k[17] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_k[18] = A380PrimComputerFctl_P.Constant21_Value;
    rtb_VectorConcatenate_b[1] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[2] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[3] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[4] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[5] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[6] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[7] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[8] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[9] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[10] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[11] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[12] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[13] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[14] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[15] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[16] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[17] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_b[18] = A380PrimComputerFctl_P.Constant22_Value;
    rtb_VectorConcatenate_o[2] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[3] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[4] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[5] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[6] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[7] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[8] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[9] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[10] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[11] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[12] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[13] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[14] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[15] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[16] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[17] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_o[18] = A380PrimComputerFctl_P.Constant36_Value;
    rtb_VectorConcatenate_ic[0] = A380PrimComputerFctl_P.Constant38_Value;
    rtb_VectorConcatenate_ic[3] = A380PrimComputerFctl_P.Constant38_Value;
    rtb_VectorConcatenate_ic[4] = A380PrimComputerFctl_P.Constant38_Value;
    rtb_VectorConcatenate_ic[8] = A380PrimComputerFctl_P.Constant37_Value;
    rtb_VectorConcatenate_ic[12] = A380PrimComputerFctl_P.Constant37_Value;
    rtb_VectorConcatenate_ic[13] = A380PrimComputerFctl_P.Constant37_Value;
    rtb_VectorConcatenate_ic[14] = A380PrimComputerFctl_P.Constant37_Value;
    rtb_VectorConcatenate_ic[15] = A380PrimComputerFctl_P.Constant37_Value;
    rtb_VectorConcatenate_ic[16] = A380PrimComputerFctl_P.Constant37_Value;
    rtb_VectorConcatenate_ic[17] = A380PrimComputerFctl_P.Constant37_Value;
    rtb_VectorConcatenate_ic[18] = A380PrimComputerFctl_P.Constant37_Value;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_k = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate_i, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_joy = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate_a, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_h3 = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate_p, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_a0 = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate_k, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_b = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate_b, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_eq = A380PrimComputerFctl_B.Data_j2;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate_o, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_iz = A380PrimComputerFctl_B.Data_j2;
    rtb_VectorConcatenate_ic[1] = A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged;
    rtb_VectorConcatenate_ic[2] = A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged;
    A380PrimComputerFctl_MATLABFunction_i(rtb_VectorConcatenate_ic, &A380PrimComputerFctl_B.Data_j2);
    A380PrimComputerFctl_B.Data_o = A380PrimComputerFctl_P.Gain_Gain_k * static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.capt_pitch_stick_pos);
    A380PrimComputerFctl_B.Data_m = A380PrimComputerFctl_P.Gain1_Gain_g * static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.fo_pitch_stick_pos);
    A380PrimComputerFctl_B.Data_oq = A380PrimComputerFctl_P.Gain2_Gain_d * static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.capt_roll_stick_pos);
    A380PrimComputerFctl_B.Data_fo = A380PrimComputerFctl_P.Gain3_Gain_e * static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.fo_roll_stick_pos);
    A380PrimComputerFctl_B.Data_p1 = A380PrimComputerFctl_P.Gain4_Gain_l * static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.rudder_pedal_pos);
    A380PrimComputerFctl_B.Data_p1y = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg);
    A380PrimComputerFctl_B.Data_l = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg);
    A380PrimComputerFctl_B.Data_kp = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg);
    A380PrimComputerFctl_B.Data_k0 = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg);
    A380PrimComputerFctl_B.Data_pi = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg);
    A380PrimComputerFctl_B.Data_dm = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg);
    A380PrimComputerFctl_B.Data_f5 = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg);
    A380PrimComputerFctl_B.Data_js = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg);
    A380PrimComputerFctl_B.Data_ee = static_cast<real32_T>
      (A380PrimComputerFctl_U.in.data.analog_inputs.elevator_3_pos_deg);
    A380PrimComputerFctl_B.Data_ig = static_cast<real32_T>(A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg);
    A380PrimComputerFctl_B.Data_mk = static_cast<real32_T>(A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg);
    A380PrimComputerFctl_B.Data_pu = static_cast<real32_T>(A380PrimComputerFctl_U.in.data.analog_inputs.rudder_2_pos_deg);
    A380PrimComputerFctl_B.alignment_dummy = A380PrimComputerFctl_P.Constant2_Value_o;
    A380PrimComputerFctl_B.prim_healthy = A380PrimComputerFctl_P.Constant1_Value_f;
    A380PrimComputerFctl_B.fcu_own_select = A380PrimComputerFctl_P.Constant_Value_ba;
    A380PrimComputerFctl_B.fcu_opp_select = A380PrimComputerFctl_P.Constant_Value_ba;
    A380PrimComputerFctl_B.reverser_tertiary_lock = A380PrimComputerFctl_P.Constant_Value_ba;
    A380PrimComputerFctl_B.dt = A380PrimComputerFctl_U.in.data.time.dt;
    A380PrimComputerFctl_B.prim_overhead_button_pressed =
      A380PrimComputerFctl_U.in.data.discrete_inputs.prim_overhead_button_pressed;
    A380PrimComputerFctl_B.SSM_gz = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.mach.SSM;
    A380PrimComputerFctl_B.Data_ly = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.mach.Data;
    A380PrimComputerFctl_B.SSM_pv = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFctl_B.Data_jq = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
    A380PrimComputerFctl_B.SSM_mf = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
    A380PrimComputerFctl_B.Data_o5 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
    A380PrimComputerFctl_B.SSM_m0 = A380PrimComputerFctl_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
    A380PrimComputerFctl_B.Data_lyw = A380PrimComputerFctl_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
    A380PrimComputerFctl_B.SSM_kd = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFctl_B.SSM_pu = A380PrimComputerFctl_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
    A380PrimComputerFctl_B.Data_gq = A380PrimComputerFctl_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
    A380PrimComputerFctl_B.Data_n = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFctl_B.SSM_nv = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFctl_B.Data_bq = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    A380PrimComputerFctl_B.is_unit_1 = A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_1;
    A380PrimComputerFctl_B.SSM_d5 =
      A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFctl_B.Data_dmn =
      A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFctl_B.SSM_eo = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
    A380PrimComputerFctl_B.Data_jn = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
    A380PrimComputerFctl_B.SSM_nd = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
    A380PrimComputerFctl_B.Data_c = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.latitude_deg.Data;
    A380PrimComputerFctl_B.SSM_bq = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
    A380PrimComputerFctl_B.Data_lx = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.longitude_deg.Data;
    A380PrimComputerFctl_B.SSM_hi = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
    A380PrimComputerFctl_B.Data_jb = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
    A380PrimComputerFctl_B.is_unit_2 = A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_2;
    A380PrimComputerFctl_B.SSM_mm = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
    A380PrimComputerFctl_B.Data_fn = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
    A380PrimComputerFctl_B.SSM_kz = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
    A380PrimComputerFctl_B.Data_od = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
    A380PrimComputerFctl_B.SSM_il = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
    A380PrimComputerFctl_B.Data_ez = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
    A380PrimComputerFctl_B.SSM_i2 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFctl_B.Data_pw = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
    A380PrimComputerFctl_B.SSM_ah = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFctl_B.Data_m2 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFctl_B.is_unit_3 = A380PrimComputerFctl_U.in.data.discrete_inputs.is_unit_3;
    A380PrimComputerFctl_B.SSM_en = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFctl_B.Data_ek = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
    A380PrimComputerFctl_B.SSM_dq = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_iy = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_px = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_lk = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_lbo = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
    A380PrimComputerFctl_B.Data_ca = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
    A380PrimComputerFctl_B.SSM_p5 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_pix = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
    A380PrimComputerFctl_B.capt_priority_takeover_pressed =
      A380PrimComputerFctl_U.in.data.discrete_inputs.capt_priority_takeover_pressed;
    A380PrimComputerFctl_B.SSM_mk = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_di = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_mu = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_lz = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_cbl = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_lu = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_gzd = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_dc = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_mo = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
    A380PrimComputerFctl_B.Data_gc = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
    A380PrimComputerFctl_B.fo_priority_takeover_pressed =
      A380PrimComputerFctl_U.in.data.discrete_inputs.fo_priority_takeover_pressed;
    A380PrimComputerFctl_B.SSM_me = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
    A380PrimComputerFctl_B.Data_am = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
    A380PrimComputerFctl_B.SSM_mj = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
    A380PrimComputerFctl_B.Data_mo = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
    A380PrimComputerFctl_B.SSM_a5 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_dg = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_bt = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_e1 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_om = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_fp = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFctl_B.ap_1_pushbutton_pressed =
      A380PrimComputerFctl_U.in.data.discrete_inputs.ap_1_pushbutton_pressed;
    A380PrimComputerFctl_B.SSM_ar = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
    A380PrimComputerFctl_B.Data_ns = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
    A380PrimComputerFctl_B.SSM_ce = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFctl_B.Data_m3 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFctl_B.SSM_ed = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFctl_B.Data_oj = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFctl_B.SSM_jh = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
    A380PrimComputerFctl_B.Data_jy = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
    A380PrimComputerFctl_B.SSM_je = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFctl_B.Data_j1 =
      A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFctl_B.ap_2_pushbutton_pressed =
      A380PrimComputerFctl_U.in.data.discrete_inputs.ap_2_pushbutton_pressed;
    A380PrimComputerFctl_B.SSM_jt = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFctl_B.Data_fc = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
    A380PrimComputerFctl_B.SSM_cui = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFctl_B.Data_of = A380PrimComputerFctl_U.in.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
    A380PrimComputerFctl_B.SSM_mq = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
    A380PrimComputerFctl_B.Data_lg = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
    A380PrimComputerFctl_B.SSM_ni = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
    A380PrimComputerFctl_B.Data_n4 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.latitude_deg.Data;
    A380PrimComputerFctl_B.SSM_df = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
    A380PrimComputerFctl_B.Data_ot = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.longitude_deg.Data;
    A380PrimComputerFctl_B.fcu_healthy = A380PrimComputerFctl_U.in.data.discrete_inputs.fcu_healthy;
    A380PrimComputerFctl_B.SSM_oe = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
    A380PrimComputerFctl_B.Data_gv = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
    A380PrimComputerFctl_B.SSM_ha = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
    A380PrimComputerFctl_B.Data_ou = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
    A380PrimComputerFctl_B.SSM_op = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
    A380PrimComputerFctl_B.Data_dh = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
    A380PrimComputerFctl_B.SSM_a50 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
    A380PrimComputerFctl_B.Data_ph = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
    A380PrimComputerFctl_B.SSM_og = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFctl_B.Data_gs = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
    A380PrimComputerFctl_B.athr_pushbutton = A380PrimComputerFctl_U.in.data.discrete_inputs.athr_pushbutton;
    A380PrimComputerFctl_B.SSM_a4 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFctl_B.Data_fd4 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFctl_B.SSM_bv = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFctl_B.Data_hm = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
    A380PrimComputerFctl_B.SSM_bo = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_i2 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_d1 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_og = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_hy = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
    A380PrimComputerFctl_B.Data_fv = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
    A380PrimComputerFctl_B.simulation_time = A380PrimComputerFctl_U.in.data.time.simulation_time;
    A380PrimComputerFctl_B.ir_3_on_capt = A380PrimComputerFctl_U.in.data.discrete_inputs.ir_3_on_capt;
    A380PrimComputerFctl_B.SSM_gi = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_oc = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_pp = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_kq = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_iab = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_ne = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_jtv = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_it = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_fy = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_ch = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFctl_B.ir_3_on_fo = A380PrimComputerFctl_U.in.data.discrete_inputs.ir_3_on_fo;
    A380PrimComputerFctl_B.SSM_d4 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
    A380PrimComputerFctl_B.Data_bb = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
    A380PrimComputerFctl_B.SSM_ars = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
    A380PrimComputerFctl_B.Data_ol = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
    A380PrimComputerFctl_B.SSM_din = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
    A380PrimComputerFctl_B.Data_hw = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
    A380PrimComputerFctl_B.SSM_m3 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_hs = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_np = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_fj = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFctl_B.adr_3_on_capt = A380PrimComputerFctl_U.in.data.discrete_inputs.adr_3_on_capt;
    A380PrimComputerFctl_B.SSM_ax = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_ky = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_cl = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
    A380PrimComputerFctl_B.Data_h5 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
    A380PrimComputerFctl_B.SSM_es = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFctl_B.Data_ku = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFctl_B.SSM_gi1 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFctl_B.Data_jp = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFctl_B.SSM_jz = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
    A380PrimComputerFctl_B.Data_nu = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
    A380PrimComputerFctl_B.adr_3_on_fo = A380PrimComputerFctl_U.in.data.discrete_inputs.adr_3_on_fo;
    A380PrimComputerFctl_B.SSM_kt = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFctl_B.Data_br =
      A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFctl_B.SSM_ds = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFctl_B.Data_ae = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
    A380PrimComputerFctl_B.SSM_eg = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFctl_B.Data_pe = A380PrimComputerFctl_U.in.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
    A380PrimComputerFctl_B.SSM_a0 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
    A380PrimComputerFctl_B.Data_fy = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
    A380PrimComputerFctl_B.SSM_cv = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
    A380PrimComputerFctl_B.Data_na = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.latitude_deg.Data;
    A380PrimComputerFctl_B.rat_deployed = A380PrimComputerFctl_U.in.data.discrete_inputs.rat_deployed;
    A380PrimComputerFctl_B.SSM_ea = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
    A380PrimComputerFctl_B.Data_my = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.longitude_deg.Data;
    A380PrimComputerFctl_B.SSM_p4 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
    A380PrimComputerFctl_B.Data_i4 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
    A380PrimComputerFctl_B.SSM_m2 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
    A380PrimComputerFctl_B.Data_cx = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
    A380PrimComputerFctl_B.SSM_bt0 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
    A380PrimComputerFctl_B.Data_nz = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
    A380PrimComputerFctl_B.SSM_nr = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
    A380PrimComputerFctl_B.Data_id = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
    A380PrimComputerFctl_B.rat_contactor_closed = A380PrimComputerFctl_U.in.data.discrete_inputs.rat_contactor_closed;
    A380PrimComputerFctl_B.SSM_fr = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
    A380PrimComputerFctl_B.Data_o2 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
    A380PrimComputerFctl_B.SSM_cc = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputerFctl_B.Data_gqq = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
    A380PrimComputerFctl_B.SSM_lm = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
    A380PrimComputerFctl_B.Data_md = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
    A380PrimComputerFctl_B.SSM_mkm = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_cz = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_jhd = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_pm = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    A380PrimComputerFctl_B.pitch_trim_up_pressed = A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_up_pressed;
    A380PrimComputerFctl_B.SSM_av = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
    A380PrimComputerFctl_B.Data_bj = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
    A380PrimComputerFctl_B.SSM_ira = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_ox = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_ge = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
    A380PrimComputerFctl_B.Data_pe5 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
    A380PrimComputerFctl_B.SSM_lv = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_jj = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_cg = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_p5 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
    A380PrimComputerFctl_B.pitch_trim_down_pressed =
      A380PrimComputerFctl_U.in.data.discrete_inputs.pitch_trim_down_pressed;
    A380PrimComputerFctl_B.SSM_be = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_ekl = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_axb = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
    A380PrimComputerFctl_B.Data_nd = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
    A380PrimComputerFctl_B.SSM_nz = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
    A380PrimComputerFctl_B.Data_n2 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
    A380PrimComputerFctl_B.SSM_cx = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
    A380PrimComputerFctl_B.Data_dl = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
    A380PrimComputerFctl_B.SSM_gh = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_gs2 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
    A380PrimComputerFctl_B.green_low_pressure = A380PrimComputerFctl_U.in.data.discrete_inputs.green_low_pressure;
    A380PrimComputerFctl_B.SSM_ks = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_h4 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_pw = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputerFctl_B.Data_e3 = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    A380PrimComputerFctl_B.SSM_fh = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
    A380PrimComputerFctl_B.Data_f5h = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
    A380PrimComputerFctl_B.SSM_gzn = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputerFctl_B.Data_an = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
    A380PrimComputerFctl_B.SSM_oo = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputerFctl_B.Data_i4o = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputerFctl_B.yellow_low_pressure = A380PrimComputerFctl_U.in.data.discrete_inputs.yellow_low_pressure;
    A380PrimComputerFctl_B.SSM_evh = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
    A380PrimComputerFctl_B.Data_af = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
    A380PrimComputerFctl_B.SSM_cn = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputerFctl_B.Data_bm =
      A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputerFctl_B.SSM_co = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
    A380PrimComputerFctl_B.Data_dk = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
    A380PrimComputerFctl_B.SSM_pe = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
    A380PrimComputerFctl_B.Data_nv = A380PrimComputerFctl_U.in.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
    A380PrimComputerFctl_B.isis_1_bus = A380PrimComputerFctl_U.in.data.bus_inputs.isis_1_bus;
    A380PrimComputerFctl_B.isis_2_bus = A380PrimComputerFctl_U.in.data.bus_inputs.isis_2_bus;
    A380PrimComputerFctl_B.monotonic_time = A380PrimComputerFctl_U.in.data.time.monotonic_time;
    A380PrimComputerFctl_B.capt_pitch_stick_pos = A380PrimComputerFctl_U.in.data.analog_inputs.capt_pitch_stick_pos;
    A380PrimComputerFctl_B.rate_gyro_pitch_1_bus = A380PrimComputerFctl_U.in.data.bus_inputs.rate_gyro_pitch_1_bus;
    A380PrimComputerFctl_B.rate_gyro_pitch_2_bus = A380PrimComputerFctl_U.in.data.bus_inputs.rate_gyro_pitch_2_bus;
    A380PrimComputerFctl_B.rate_gyro_roll_1_bus = A380PrimComputerFctl_U.in.data.bus_inputs.rate_gyro_roll_1_bus;
    A380PrimComputerFctl_B.rate_gyro_roll_2_bus = A380PrimComputerFctl_U.in.data.bus_inputs.rate_gyro_roll_2_bus;
    A380PrimComputerFctl_B.rate_gyro_yaw_1_bus = A380PrimComputerFctl_U.in.data.bus_inputs.rate_gyro_yaw_1_bus;
    A380PrimComputerFctl_B.rate_gyro_yaw_2_bus = A380PrimComputerFctl_U.in.data.bus_inputs.rate_gyro_yaw_2_bus;
    A380PrimComputerFctl_B.SSM_cgz = A380PrimComputerFctl_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
    A380PrimComputerFctl_B.Data_jpf = A380PrimComputerFctl_U.in.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
    A380PrimComputerFctl_B.SSM_fw = A380PrimComputerFctl_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
    A380PrimComputerFctl_B.Data_i5 = A380PrimComputerFctl_U.in.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
    A380PrimComputerFctl_B.fo_pitch_stick_pos = A380PrimComputerFctl_U.in.data.analog_inputs.fo_pitch_stick_pos;
    A380PrimComputerFctl_B.SSM_h4 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
    A380PrimComputerFctl_B.Data_k2 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
    A380PrimComputerFctl_B.SSM_cb3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
    A380PrimComputerFctl_B.Data_as =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
    A380PrimComputerFctl_B.SSM_pj =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputerFctl_B.Data_gk =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    A380PrimComputerFctl_B.SSM_dv = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
    A380PrimComputerFctl_B.Data_jl = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
    A380PrimComputerFctl_B.SSM_i4 = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
    A380PrimComputerFctl_B.Data_e32 = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
    A380PrimComputerFctl_B.capt_roll_stick_pos = A380PrimComputerFctl_U.in.data.analog_inputs.capt_roll_stick_pos;
    A380PrimComputerFctl_B.SSM_fm =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
    A380PrimComputerFctl_B.Data_ih =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
    A380PrimComputerFctl_B.SSM_e5 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
    A380PrimComputerFctl_B.Data_du =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
    A380PrimComputerFctl_B.SSM_bf =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputerFctl_B.Data_nx =
      A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    A380PrimComputerFctl_B.SSM_fd = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
    A380PrimComputerFctl_B.Data_n0 = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
    A380PrimComputerFctl_B.SSM_fv = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
    A380PrimComputerFctl_B.Data_eqi = A380PrimComputerFctl_U.in.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
    A380PrimComputerFctl_B.fo_roll_stick_pos = A380PrimComputerFctl_U.in.data.analog_inputs.fo_roll_stick_pos;
    A380PrimComputerFctl_B.SSM_dt = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
    A380PrimComputerFctl_B.Data_om = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
    A380PrimComputerFctl_B.SSM_j5 = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
    A380PrimComputerFctl_B.Data_nr = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
    A380PrimComputerFctl_B.SSM_ng = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
    A380PrimComputerFctl_B.Data_p3 = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
    A380PrimComputerFctl_B.SSM_cs = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
    A380PrimComputerFctl_B.Data_nb = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
    A380PrimComputerFctl_B.SSM_ls = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
    A380PrimComputerFctl_B.Data_hd = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
    A380PrimComputerFctl_B.speed_brake_lever_pos = A380PrimComputerFctl_U.in.data.analog_inputs.speed_brake_lever_pos;
    A380PrimComputerFctl_B.SSM_dg = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
    A380PrimComputerFctl_B.Data_al = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
    A380PrimComputerFctl_B.SSM_d3 = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
    A380PrimComputerFctl_B.Data_gu = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
    A380PrimComputerFctl_B.SSM_p2 = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
    A380PrimComputerFctl_B.Data_ix = A380PrimComputerFctl_U.in.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
    A380PrimComputerFctl_B.irdc_1_bus = A380PrimComputerFctl_U.in.data.bus_inputs.irdc_1_bus;
    A380PrimComputerFctl_B.irdc_2_bus = A380PrimComputerFctl_U.in.data.bus_inputs.irdc_2_bus;
    A380PrimComputerFctl_B.irdc_3_bus = A380PrimComputerFctl_U.in.data.bus_inputs.irdc_3_bus;
    A380PrimComputerFctl_B.irdc_4_a_bus = A380PrimComputerFctl_U.in.data.bus_inputs.irdc_4_a_bus;
    A380PrimComputerFctl_B.thr_lever_1_pos = A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_1_pos;
    A380PrimComputerFctl_B.irdc_4_b_bus = A380PrimComputerFctl_U.in.data.bus_inputs.irdc_4_b_bus;
    A380PrimComputerFctl_B.fcu_own_bus = A380PrimComputerFctl_U.in.data.bus_inputs.fcu_own_bus;
    A380PrimComputerFctl_B.fcu_opp_bus = A380PrimComputerFctl_U.in.data.bus_inputs.fcu_opp_bus;
    A380PrimComputerFctl_B.SSM_bo0 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_do =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_bc =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_hu =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_h0 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_pm1 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_giz =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.thr_lever_2_pos = A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_2_pos;
    A380PrimComputerFctl_B.Data_i2y =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_mqp =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_pg =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ba =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ni =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_in = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFctl_B.Data_fr =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ff = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFctl_B.Data_cn =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ic = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFctl_B.thr_lever_3_pos = A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_3_pos;
    A380PrimComputerFctl_B.Data_nxl =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
    A380PrimComputerFctl_B.SSM_fs = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFctl_B.Data_jh =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ja = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gl =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
    A380PrimComputerFctl_B.SSM_js = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gn =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
    A380PrimComputerFctl_B.SSM_is3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFctl_B.Data_myb =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ag = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFctl_B.thr_lever_4_pos = A380PrimComputerFctl_U.in.data.analog_inputs.thr_lever_4_pos;
    A380PrimComputerFctl_B.Data_l2 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
    A380PrimComputerFctl_B.SSM_f5 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFctl_B.Data_o5o =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ph = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFctl_B.Data_l5 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
    A380PrimComputerFctl_B.SSM_jw = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFctl_B.Data_dc2 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
    A380PrimComputerFctl_B.SSM_jy = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gr =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
    A380PrimComputerFctl_B.SSM_j1 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFctl_B.elevator_1_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.elevator_1_pos_deg;
    A380PrimComputerFctl_B.Data_gp =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ov = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFctl_B.Data_i3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
    A380PrimComputerFctl_B.SSM_mx = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFctl_B.Data_et =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
    A380PrimComputerFctl_B.SSM_b4 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFctl_B.Data_mc =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
    A380PrimComputerFctl_B.SSM_gb =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.Data_k3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_oh =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.slew_on = A380PrimComputerFctl_U.in.data.sim_data.slew_on;
    A380PrimComputerFctl_B.elevator_2_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.elevator_2_pos_deg;
    A380PrimComputerFctl_B.Data_f2 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_mm5 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gh =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_br =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ed =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_c2 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.ths_command_deg.SSM;
    A380PrimComputerFctl_B.Data_o2j = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.ths_command_deg.Data;
    A380PrimComputerFctl_B.SSM_hc = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.SSM;
    A380PrimComputerFctl_B.Data_i43 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ktr = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.SSM;
    A380PrimComputerFctl_B.elevator_3_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.elevator_3_pos_deg;
    A380PrimComputerFctl_B.Data_ic = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
    A380PrimComputerFctl_B.SSM_gl =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ak =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_my =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_jg =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_j3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_cu =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_go =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ep =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_e5c = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFctl_B.ths_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.ths_pos_deg;
    A380PrimComputerFctl_B.Data_d3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFctl_B.SSM_dk = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word.SSM;
    A380PrimComputerFctl_B.Data_bt = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.aileron_status_word.Data;
    A380PrimComputerFctl_B.SSM_evc =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_e0 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_kk = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_jl3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_af =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_nm =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_npr =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.left_aileron_1_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_1_pos_deg;
    A380PrimComputerFctl_B.Data_ia =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ew = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.spoiler_status_word.SSM;
    A380PrimComputerFctl_B.Data_j0 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.spoiler_status_word.Data;
    A380PrimComputerFctl_B.SSM_lt = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.SSM;
    A380PrimComputerFctl_B.Data_bs = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ger = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.SSM;
    A380PrimComputerFctl_B.Data_hp =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    A380PrimComputerFctl_B.SSM_pxo = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word.SSM;
    A380PrimComputerFctl_B.Data_ct = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_status_word.Data;
    A380PrimComputerFctl_B.SSM_co2 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFctl_B.left_aileron_2_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.left_aileron_2_pos_deg;
    A380PrimComputerFctl_B.Data_pc = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ny = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_nzt = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_l4 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFctl_B.Data_c0 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
    A380PrimComputerFctl_B.SSM_nm = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.ths_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ojg = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.ths_position_deg.Data;
    A380PrimComputerFctl_B.SSM_nh = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word.SSM;
    A380PrimComputerFctl_B.Data_lm = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_status_word.Data;
    A380PrimComputerFctl_B.SSM_dl = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFctl_B.right_aileron_1_pos_deg =
      A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_1_pos_deg;
    A380PrimComputerFctl_B.Data_fz = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_dx = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_oz = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_a5h = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.radio_height_1_ft.SSM;
    A380PrimComputerFctl_B.Data_gf = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.radio_height_1_ft.Data;
    A380PrimComputerFctl_B.SSM_fl = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.radio_height_2_ft.SSM;
    A380PrimComputerFctl_B.Data_nn = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.radio_height_2_ft.Data;
    A380PrimComputerFctl_B.SSM_p3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word.SSM;
    A380PrimComputerFctl_B.Data_a0z = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fctl_law_status_word.Data;
    A380PrimComputerFctl_B.SSM_ns = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.discrete_status_word_1.SSM;
    A380PrimComputerFctl_B.right_aileron_2_pos_deg =
      A380PrimComputerFctl_U.in.data.analog_inputs.right_aileron_2_pos_deg;
    A380PrimComputerFctl_B.Data_fk = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.discrete_status_word_1.Data;
    A380PrimComputerFctl_B.SSM_bm = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fe_status_word.SSM;
    A380PrimComputerFctl_B.Data_bu = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fe_status_word.Data;
    A380PrimComputerFctl_B.SSM_nl = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fg_status_word.SSM;
    A380PrimComputerFctl_B.Data_o23 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_x_bus.fg_status_word.Data;
    A380PrimComputerFctl_B.SSM_grm =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_g3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_gzm =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_icc =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_oi =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.left_spoiler_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.left_spoiler_pos_deg;
    A380PrimComputerFctl_B.Data_pwf =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_aa =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gvk =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_fvk =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ln =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_lw =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ka =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
    A380PrimComputerFctl_B.SSM_fa = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.SSM;
    A380PrimComputerFctl_B.Data_mp =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
    A380PrimComputerFctl_B.SSM_lbx =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.SSM;
    A380PrimComputerFctl_B.right_spoiler_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.right_spoiler_pos_deg;
    A380PrimComputerFctl_B.Data_m4 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
    A380PrimComputerFctl_B.SSM_n3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.SSM;
    A380PrimComputerFctl_B.Data_fki =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
    A380PrimComputerFctl_B.SSM_a1 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.SSM;
    A380PrimComputerFctl_B.Data_bv =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
    A380PrimComputerFctl_B.SSM_p1 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.SSM;
    A380PrimComputerFctl_B.Data_m21 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
    A380PrimComputerFctl_B.SSM_cn2 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.SSM;
    A380PrimComputerFctl_B.Data_nbg =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
    A380PrimComputerFctl_B.SSM_an3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.SSM;
    A380PrimComputerFctl_B.rudder_1_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.rudder_1_pos_deg;
    A380PrimComputerFctl_B.Data_l25 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
    A380PrimComputerFctl_B.SSM_c3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ki =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
    A380PrimComputerFctl_B.SSM_dp = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.SSM;
    A380PrimComputerFctl_B.Data_p5p =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
    A380PrimComputerFctl_B.SSM_boy =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.SSM;
    A380PrimComputerFctl_B.Data_nry =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
    A380PrimComputerFctl_B.SSM_lg = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.SSM;
    A380PrimComputerFctl_B.Data_mh =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
    A380PrimComputerFctl_B.SSM_cm = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.SSM;
    A380PrimComputerFctl_B.pause_on = A380PrimComputerFctl_U.in.data.sim_data.pause_on;
    A380PrimComputerFctl_B.rudder_2_pos_deg = A380PrimComputerFctl_U.in.data.analog_inputs.rudder_2_pos_deg;
    A380PrimComputerFctl_B.Data_ll =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
    A380PrimComputerFctl_B.SSM_hl = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.SSM;
    A380PrimComputerFctl_B.Data_hy =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
    A380PrimComputerFctl_B.SSM_irh =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.SSM;
    A380PrimComputerFctl_B.Data_j04 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
    A380PrimComputerFctl_B.SSM_b42 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.SSM;
    A380PrimComputerFctl_B.Data_pf =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
    A380PrimComputerFctl_B.SSM_anz =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.SSM;
    A380PrimComputerFctl_B.Data_pl =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
    A380PrimComputerFctl_B.SSM_d2 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.rudder_pedal_pos = A380PrimComputerFctl_U.in.data.analog_inputs.rudder_pedal_pos;
    A380PrimComputerFctl_B.Data_gb =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_gov =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.Data_hq =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_nb =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ai =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_pe3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gfr =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
    A380PrimComputerFctl_B.SSM_jj = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.ths_command_deg.SSM;
    A380PrimComputerFctl_B.Data_czp = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.ths_command_deg.Data;
    A380PrimComputerFctl_B.SSM_jx = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.SSM;
    A380PrimComputerFctl_B.yellow_hyd_pressure_psi =
      A380PrimComputerFctl_U.in.data.analog_inputs.yellow_hyd_pressure_psi;
    A380PrimComputerFctl_B.Data_fm = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
    A380PrimComputerFctl_B.SSM_npl = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.SSM;
    A380PrimComputerFctl_B.Data_jsg = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
    A380PrimComputerFctl_B.SSM_gf =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_g1 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_gbi =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_j4 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_fhm =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_jyh =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ltj =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.green_hyd_pressure_psi = A380PrimComputerFctl_U.in.data.analog_inputs.green_hyd_pressure_psi;
    A380PrimComputerFctl_B.Data_e4 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_hn = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ghs =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFctl_B.SSM_h3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word.SSM;
    A380PrimComputerFctl_B.Data_bmk = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.aileron_status_word.Data;
    A380PrimComputerFctl_B.SSM_bfs =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_lzt =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_p0 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_kn =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_fu =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.vert_acc_1_g = A380PrimComputerFctl_U.in.data.analog_inputs.vert_acc_1_g;
    A380PrimComputerFctl_B.Data_nab =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_hr =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_lgf =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_bi = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.spoiler_status_word.SSM;
    A380PrimComputerFctl_B.Data_fpq = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.spoiler_status_word.Data;
    A380PrimComputerFctl_B.SSM_bd = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.SSM;
    A380PrimComputerFctl_B.Data_dt = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
    A380PrimComputerFctl_B.SSM_omt = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.SSM;
    A380PrimComputerFctl_B.Data_b1 =
      A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
    A380PrimComputerFctl_B.SSM_la = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word.SSM;
    A380PrimComputerFctl_B.vert_acc_2_g = A380PrimComputerFctl_U.in.data.analog_inputs.vert_acc_2_g;
    A380PrimComputerFctl_B.Data_nmr = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_status_word.Data;
    A380PrimComputerFctl_B.SSM_l1 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ea = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_dy = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_nib = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ie = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFctl_B.Data_i2t = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.elevator_3_position_deg.Data;
    A380PrimComputerFctl_B.SSM_kf = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.ths_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ng = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.ths_position_deg.Data;
    A380PrimComputerFctl_B.SSM_p5l = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_status_word.SSM;
    A380PrimComputerFctl_B.vert_acc_3_g = A380PrimComputerFctl_U.in.data.analog_inputs.vert_acc_3_g;
    A380PrimComputerFctl_B.Data_h31 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_status_word.Data;
    A380PrimComputerFctl_B.SSM_g3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ew = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_b3 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_j1s = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.rudder_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_dxv = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.radio_height_1_ft.SSM;
    A380PrimComputerFctl_B.Data_j5 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.radio_height_1_ft.Data;
    A380PrimComputerFctl_B.SSM_mxz = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.radio_height_2_ft.SSM;
    A380PrimComputerFctl_B.Data_cw = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.radio_height_2_ft.Data;
    A380PrimComputerFctl_B.SSM_kk4 = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl_law_status_word.SSM;
    A380PrimComputerFctl_B.lat_acc_1_g = A380PrimComputerFctl_U.in.data.analog_inputs.lat_acc_1_g;
    A380PrimComputerFctl_B.Data_gqa = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fctl_law_status_word.Data;
    A380PrimComputerFctl_B.SSM_cy = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.discrete_status_word_1.SSM;
    A380PrimComputerFctl_B.Data_hz = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.discrete_status_word_1.Data;
    A380PrimComputerFctl_B.SSM_ju = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fe_status_word.SSM;
    A380PrimComputerFctl_B.Data_fri = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fe_status_word.Data;
    A380PrimComputerFctl_B.SSM_ey = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fg_status_word.SSM;
    A380PrimComputerFctl_B.Data_cm = A380PrimComputerFctl_U.in.data.bus_inputs.prim_y_bus.fg_status_word.Data;
    A380PrimComputerFctl_B.SSM_jr =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_czj =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_hs =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.lat_acc_2_g = A380PrimComputerFctl_U.in.data.analog_inputs.lat_acc_2_g;
    A380PrimComputerFctl_B.Data_mb =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_mx3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gk4 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_er =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_gbt =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_hm = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFctl_B.Data_p0 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFctl_B.SSM_dm = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word.SSM;
    A380PrimComputerFctl_B.Data_dn = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.aileron_status_word.Data;
    A380PrimComputerFctl_B.SSM_fk = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.lat_acc_3_g = A380PrimComputerFctl_U.in.data.analog_inputs.lat_acc_3_g;
    A380PrimComputerFctl_B.Data_iyw =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_lm1 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_p5d =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_nc = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_oo =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_e4 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ho =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_bw = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM;
    A380PrimComputerFctl_B.Data_kqr = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.spoiler_status_word.Data;
    A380PrimComputerFctl_B.SSM_na = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFctl_B.tracking_mode_on_override = A380PrimComputerFctl_U.in.data.sim_data.tracking_mode_on_override;
    A380PrimComputerFctl_B.left_body_wheel_speed = A380PrimComputerFctl_U.in.data.analog_inputs.left_body_wheel_speed;
    A380PrimComputerFctl_B.Data_omv =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_lf = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_mby =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_oz = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_hk =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_mub =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_hg =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_li = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word.SSM;
    A380PrimComputerFctl_B.Data_bi = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_status_word.Data;
    A380PrimComputerFctl_B.SSM_hcd = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFctl_B.left_wing_wheel_speed = A380PrimComputerFctl_U.in.data.analog_inputs.left_wing_wheel_speed;
    A380PrimComputerFctl_B.Data_i4u = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_php = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ik = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ma = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFctl_B.Data_dq = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data;
    A380PrimComputerFctl_B.SSM_jut = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.ths_position_deg.SSM;
    A380PrimComputerFctl_B.Data_pv = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.ths_position_deg.Data;
    A380PrimComputerFctl_B.SSM_kh = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
    A380PrimComputerFctl_B.Data_p1d = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
    A380PrimComputerFctl_B.SSM_h2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFctl_B.right_body_wheel_speed = A380PrimComputerFctl_U.in.data.analog_inputs.right_body_wheel_speed;
    A380PrimComputerFctl_B.Data_lyv = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ago = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ke = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ep = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFctl_B.Data_cv = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFctl_B.SSM_kc = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM;
    A380PrimComputerFctl_B.Data_pfh = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data;
    A380PrimComputerFctl_B.SSM_cnf = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM;
    A380PrimComputerFctl_B.Data_jy4 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_1_bus.misc_data_status_word.Data;
    A380PrimComputerFctl_B.SSM_lwa =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.right_wing_wheel_speed = A380PrimComputerFctl_U.in.data.analog_inputs.right_wing_wheel_speed;
    A380PrimComputerFctl_B.Data_o1 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_aq =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_ga =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ja2 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_kd =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_in3 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_fx =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_ap = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFctl_B.Data_nml = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFctl_B.SSM_mg = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word.SSM;
    A380PrimComputerFctl_B.SSM_mw = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
    A380PrimComputerFctl_B.Data_fa = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.aileron_status_word.Data;
    A380PrimComputerFctl_B.SSM_bu = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_nh =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_cbb = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_or =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_iao =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_otn =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ip = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_cam =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_f4 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM;
    A380PrimComputerFctl_B.Data_gsl = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    A380PrimComputerFctl_B.Data_amp = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.spoiler_status_word.Data;
    A380PrimComputerFctl_B.SSM_id = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_mv =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_mqr =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_gx =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_cm2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_lb =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ck = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_can =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_pl = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word.SSM;
    A380PrimComputerFctl_B.SSM_d50 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
    A380PrimComputerFctl_B.Data_gae = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_status_word.Data;
    A380PrimComputerFctl_B.SSM_gs = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_h1 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_kse = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_bc = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_icj = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFctl_B.Data_fof = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ds4 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.ths_position_deg.SSM;
    A380PrimComputerFctl_B.Data_nj = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.ths_position_deg.Data;
    A380PrimComputerFctl_B.SSM_gbf = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
    A380PrimComputerFctl_B.Data_i0 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
    A380PrimComputerFctl_B.Data_lr = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
    A380PrimComputerFctl_B.SSM_opv = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_k0s = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_gha = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_m4b = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ple = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFctl_B.Data_e3r =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFctl_B.SSM_h0n = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM;
    A380PrimComputerFctl_B.Data_au = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data;
    A380PrimComputerFctl_B.SSM_c1 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM;
    A380PrimComputerFctl_B.SSM_dd = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.mach.SSM;
    A380PrimComputerFctl_B.Data_czc = A380PrimComputerFctl_U.in.data.bus_inputs.sec_2_bus.misc_data_status_word.Data;
    A380PrimComputerFctl_B.SSM_ai =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_itz =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_at =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputerFctl_B.Data_nsk =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputerFctl_B.SSM_bz =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_is =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_n0 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputerFctl_B.Data_pk =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputerFctl_B.SSM_haz = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputerFctl_B.Data_f52 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.mach.Data;
    A380PrimComputerFctl_B.Data_dg0 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data;
    A380PrimComputerFctl_B.SSM_hz = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word.SSM;
    A380PrimComputerFctl_B.Data_nru = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.aileron_status_word.Data;
    A380PrimComputerFctl_B.SSM_hk = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_d5 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_cvn = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_oa =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_iy = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_bp =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_jwz =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputerFctl_B.tailstrike_protection_on = A380PrimComputerFctl_U.in.data.sim_data.tailstrike_protection_on;
    A380PrimComputerFctl_B.SSM_o2 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFctl_B.Data_cl =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_eig = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM;
    A380PrimComputerFctl_B.Data_er = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.spoiler_status_word.Data;
    A380PrimComputerFctl_B.SSM_jl = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_in =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_cci =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_btl =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ow = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_a5 =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_bcj =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_hyo = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    A380PrimComputerFctl_B.Data_bjx =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_i5 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word.SSM;
    A380PrimComputerFctl_B.Data_ci = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_status_word.Data;
    A380PrimComputerFctl_B.SSM_jww = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_h2 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_kkj = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ce = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ndh = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM;
    A380PrimComputerFctl_B.Data_dx = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data;
    A380PrimComputerFctl_B.SSM_k1 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.ths_position_deg.SSM;
    A380PrimComputerFctl_B.SSM_en3 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
    A380PrimComputerFctl_B.Data_fvi = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.ths_position_deg.Data;
    A380PrimComputerFctl_B.SSM_kl = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.SSM;
    A380PrimComputerFctl_B.Data_gnm = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_status_word.Data;
    A380PrimComputerFctl_B.SSM_po = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM;
    A380PrimComputerFctl_B.Data_e3y = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ie0 = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM;
    A380PrimComputerFctl_B.Data_ld = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data;
    A380PrimComputerFctl_B.SSM_ay = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM;
    A380PrimComputerFctl_B.Data_k3v =
      A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data;
    A380PrimComputerFctl_B.SSM_gsb = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM;
    A380PrimComputerFctl_B.Data_oi = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    A380PrimComputerFctl_B.Data_oy = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data;
    A380PrimComputerFctl_B.SSM_mxy = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM;
    A380PrimComputerFctl_B.Data_nl = A380PrimComputerFctl_U.in.data.bus_inputs.sec_3_bus.misc_data_status_word.Data;
    A380PrimComputerFctl_B.ap_engaged = A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_engaged;
    A380PrimComputerFctl_B.ap_1_engaged = A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_1_engaged;
    A380PrimComputerFctl_B.ap_2_engaged = A380PrimComputerFctl_U.in.data.temporary_ap_input.ap_2_engaged;
    A380PrimComputerFctl_B.athr_engaged = A380PrimComputerFctl_U.in.data.temporary_ap_input.athr_engaged;
    A380PrimComputerFctl_B.roll_command = A380PrimComputerFctl_U.in.data.temporary_ap_input.roll_command;
    A380PrimComputerFctl_B.pitch_command = A380PrimComputerFctl_U.in.data.temporary_ap_input.pitch_command;
    A380PrimComputerFctl_B.yaw_command = A380PrimComputerFctl_U.in.data.temporary_ap_input.yaw_command;
    A380PrimComputerFctl_B.SSM_gt = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFctl_B.lateral_mode = A380PrimComputerFctl_U.in.data.temporary_ap_input.lateral_mode;
    A380PrimComputerFctl_B.lateral_mode_armed = A380PrimComputerFctl_U.in.data.temporary_ap_input.lateral_mode_armed;
    A380PrimComputerFctl_B.vertical_mode = A380PrimComputerFctl_U.in.data.temporary_ap_input.vertical_mode;
    A380PrimComputerFctl_B.vertical_mode_armed = A380PrimComputerFctl_U.in.data.temporary_ap_input.vertical_mode_armed;
    A380PrimComputerFctl_B.on_ground = A380PrimComputerFctl_U.in.general_logic.on_ground;
    A380PrimComputerFctl_B.tracking_mode_on = A380PrimComputerFctl_U.in.general_logic.tracking_mode_on;
    A380PrimComputerFctl_B.double_adr_failure = A380PrimComputerFctl_U.in.general_logic.double_adr_failure;
    A380PrimComputerFctl_B.triple_adr_failure = A380PrimComputerFctl_U.in.general_logic.triple_adr_failure;
    A380PrimComputerFctl_B.cas_or_mach_disagree = A380PrimComputerFctl_U.in.general_logic.cas_or_mach_disagree;
    A380PrimComputerFctl_B.alpha_disagree = A380PrimComputerFctl_U.in.general_logic.alpha_disagree;
    A380PrimComputerFctl_B.Data_aei = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFctl_B.double_ir_failure = A380PrimComputerFctl_U.in.general_logic.double_ir_failure;
    A380PrimComputerFctl_B.triple_ir_failure = A380PrimComputerFctl_U.in.general_logic.triple_ir_failure;
    A380PrimComputerFctl_B.ir_failure_not_self_detected =
      A380PrimComputerFctl_U.in.general_logic.ir_failure_not_self_detected;
    A380PrimComputerFctl_B.V_ias_kn = A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_ias_kn;
    A380PrimComputerFctl_B.V_tas_kn = A380PrimComputerFctl_U.in.general_logic.adr_computation_data.V_tas_kn;
    A380PrimComputerFctl_B.mach = A380PrimComputerFctl_U.in.general_logic.adr_computation_data.mach;
    A380PrimComputerFctl_B.alpha_deg = A380PrimComputerFctl_U.in.general_logic.adr_computation_data.alpha_deg;
    A380PrimComputerFctl_B.theta_deg = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_deg;
    A380PrimComputerFctl_B.phi_deg = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_deg;
    A380PrimComputerFctl_B.q_deg_s = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.q_deg_s;
    A380PrimComputerFctl_B.SSM_cum = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFctl_B.r_deg_s = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.r_deg_s;
    A380PrimComputerFctl_B.n_x_g = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.n_x_g;
    A380PrimComputerFctl_B.n_y_g = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.n_y_g;
    A380PrimComputerFctl_B.n_z_g = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.n_z_g;
    A380PrimComputerFctl_B.theta_dot_deg_s = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.theta_dot_deg_s;
    A380PrimComputerFctl_B.phi_dot_deg_s = A380PrimComputerFctl_U.in.general_logic.ir_computation_data.phi_dot_deg_s;
    A380PrimComputerFctl_B.ra_computation_data_ft = A380PrimComputerFctl_U.in.general_logic.ra_computation_data_ft;
    A380PrimComputerFctl_B.two_ra_failure = A380PrimComputerFctl_U.in.general_logic.two_ra_failure;
    A380PrimComputerFctl_B.all_ra_failure = A380PrimComputerFctl_U.in.general_logic.all_ra_failure;
    A380PrimComputerFctl_B.all_sfcc_lost = A380PrimComputerFctl_U.in.general_logic.all_sfcc_lost;
    A380PrimComputerFctl_B.Data_jz = A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    A380PrimComputerFctl_B.flap_handle_index = A380PrimComputerFctl_U.in.general_logic.flap_handle_index;
    A380PrimComputerFctl_B.flap_angle_deg = A380PrimComputerFctl_U.in.general_logic.flap_angle_deg;
    A380PrimComputerFctl_B.slat_angle_deg = A380PrimComputerFctl_U.in.general_logic.slat_angle_deg;
    A380PrimComputerFctl_B.slat_flap_actual_pos = A380PrimComputerFctl_U.in.general_logic.slat_flap_actual_pos;
    A380PrimComputerFctl_B.double_lgciu_failure = A380PrimComputerFctl_U.in.general_logic.double_lgciu_failure;
    A380PrimComputerFctl_B.slats_locked = A380PrimComputerFctl_U.in.general_logic.slats_locked;
    A380PrimComputerFctl_B.flaps_locked = A380PrimComputerFctl_U.in.general_logic.flaps_locked;
    A380PrimComputerFctl_B.landing_gear_down = A380PrimComputerFctl_U.in.general_logic.landing_gear_down;
    A380PrimComputerFctl_B.SSM_ka =
      A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFctl_B.Data_pwfb =
      A380PrimComputerFctl_U.in.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFctl_B.computer_running = A380PrimComputerFctl_U.in.data.sim_data.computer_running;
    A380PrimComputerFctl_B.SSM_lu = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
    A380PrimComputerFctl_B.Data_la = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    A380PrimComputerFctl_B.SSM_c5 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
    A380PrimComputerFctl_B.Data_b0 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
    A380PrimComputerFctl_B.SSM_ol = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.mach.SSM;
    A380PrimComputerFctl_B.Data_g5 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.mach.Data;
    A380PrimComputerFctl_B.SSM_k2 = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
    A380PrimComputerFctl_B.Data_os = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    A380PrimComputerFctl_B.SSM_gn = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
    A380PrimComputerFctl_B.Data_btc = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    A380PrimComputerFctl_B.alignment_dummy_h = A380PrimComputerFctl_U.in.data.discrete_inputs.alignment_dummy;
    A380PrimComputerFctl_B.SSM_bdi = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
    A380PrimComputerFctl_B.Data_nhn = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
    A380PrimComputerFctl_B.SSM_lil = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
    A380PrimComputerFctl_B.Data_im = A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    A380PrimComputerFctl_B.SSM_lmv =
      A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
    A380PrimComputerFctl_B.Data_no =
      A380PrimComputerFctl_U.in.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
    A380PrimComputerFctl_B.SSM_ig = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
    A380PrimComputerFctl_B.Data_av = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    A380PrimComputerFctl_B.SSM_ch = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
    A380PrimComputerFctl_B.Data_me = A380PrimComputerFctl_U.in.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
    A380PrimComputerFctl_DWork.Delay_DSTATE_c = A380PrimComputerFctl_B.left_sidestick_priority_locked;
    A380PrimComputerFctl_DWork.Delay1_DSTATE_n = A380PrimComputerFctl_B.right_sidestick_priority_locked;
    A380PrimComputerFctl_DWork.Memory_PreviousInput_j = A380PrimComputerFctl_DWork.Delay_DSTATE_e;
    A380PrimComputerFctl_DWork.Delay_DSTATE = rtb_Y_gl;
    A380PrimComputerFctl_DWork.icLoad = false;
  } else {
    A380PrimComputerFctl_DWork.Runtime_MODE = false;
  }

  A380PrimComputerFctl_Y.out.data.time.dt = A380PrimComputerFctl_B.dt;
  A380PrimComputerFctl_Y.out.data.time.simulation_time = A380PrimComputerFctl_B.simulation_time;
  A380PrimComputerFctl_Y.out.data.time.monotonic_time = A380PrimComputerFctl_B.monotonic_time;
  A380PrimComputerFctl_Y.out.data.sim_data.slew_on = A380PrimComputerFctl_B.slew_on;
  A380PrimComputerFctl_Y.out.data.sim_data.pause_on = A380PrimComputerFctl_B.pause_on;
  A380PrimComputerFctl_Y.out.data.sim_data.tracking_mode_on_override = A380PrimComputerFctl_B.tracking_mode_on_override;
  A380PrimComputerFctl_Y.out.data.sim_data.tailstrike_protection_on = A380PrimComputerFctl_B.tailstrike_protection_on;
  A380PrimComputerFctl_Y.out.data.sim_data.computer_running = A380PrimComputerFctl_B.computer_running;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.alignment_dummy = A380PrimComputerFctl_B.alignment_dummy_h;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.prim_overhead_button_pressed =
    A380PrimComputerFctl_B.prim_overhead_button_pressed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.is_unit_1 = A380PrimComputerFctl_B.is_unit_1;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.is_unit_2 = A380PrimComputerFctl_B.is_unit_2;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.is_unit_3 = A380PrimComputerFctl_B.is_unit_3;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.capt_priority_takeover_pressed =
    A380PrimComputerFctl_B.capt_priority_takeover_pressed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.fo_priority_takeover_pressed =
    A380PrimComputerFctl_B.fo_priority_takeover_pressed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.ap_1_pushbutton_pressed =
    A380PrimComputerFctl_B.ap_1_pushbutton_pressed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.ap_2_pushbutton_pressed =
    A380PrimComputerFctl_B.ap_2_pushbutton_pressed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.fcu_healthy = A380PrimComputerFctl_B.fcu_healthy;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.athr_pushbutton = A380PrimComputerFctl_B.athr_pushbutton;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.ir_3_on_capt = A380PrimComputerFctl_B.ir_3_on_capt;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.ir_3_on_fo = A380PrimComputerFctl_B.ir_3_on_fo;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.adr_3_on_capt = A380PrimComputerFctl_B.adr_3_on_capt;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.adr_3_on_fo = A380PrimComputerFctl_B.adr_3_on_fo;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.rat_deployed = A380PrimComputerFctl_B.rat_deployed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.rat_contactor_closed = A380PrimComputerFctl_B.rat_contactor_closed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.pitch_trim_up_pressed = A380PrimComputerFctl_B.pitch_trim_up_pressed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.pitch_trim_down_pressed =
    A380PrimComputerFctl_B.pitch_trim_down_pressed;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.green_low_pressure = A380PrimComputerFctl_B.green_low_pressure;
  A380PrimComputerFctl_Y.out.data.discrete_inputs.yellow_low_pressure = A380PrimComputerFctl_B.yellow_low_pressure;
  A380PrimComputerFctl_Y.out.data.analog_inputs.capt_pitch_stick_pos = A380PrimComputerFctl_B.capt_pitch_stick_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.fo_pitch_stick_pos = A380PrimComputerFctl_B.fo_pitch_stick_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.capt_roll_stick_pos = A380PrimComputerFctl_B.capt_roll_stick_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.fo_roll_stick_pos = A380PrimComputerFctl_B.fo_roll_stick_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.speed_brake_lever_pos = A380PrimComputerFctl_B.speed_brake_lever_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.thr_lever_1_pos = A380PrimComputerFctl_B.thr_lever_1_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.thr_lever_2_pos = A380PrimComputerFctl_B.thr_lever_2_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.thr_lever_3_pos = A380PrimComputerFctl_B.thr_lever_3_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.thr_lever_4_pos = A380PrimComputerFctl_B.thr_lever_4_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.elevator_1_pos_deg = A380PrimComputerFctl_B.elevator_1_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.elevator_2_pos_deg = A380PrimComputerFctl_B.elevator_2_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.elevator_3_pos_deg = A380PrimComputerFctl_B.elevator_3_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.ths_pos_deg = A380PrimComputerFctl_B.ths_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.left_aileron_1_pos_deg = A380PrimComputerFctl_B.left_aileron_1_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.left_aileron_2_pos_deg = A380PrimComputerFctl_B.left_aileron_2_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.right_aileron_1_pos_deg = A380PrimComputerFctl_B.right_aileron_1_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.right_aileron_2_pos_deg = A380PrimComputerFctl_B.right_aileron_2_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.left_spoiler_pos_deg = A380PrimComputerFctl_B.left_spoiler_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.right_spoiler_pos_deg = A380PrimComputerFctl_B.right_spoiler_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.rudder_1_pos_deg = A380PrimComputerFctl_B.rudder_1_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.rudder_2_pos_deg = A380PrimComputerFctl_B.rudder_2_pos_deg;
  A380PrimComputerFctl_Y.out.data.analog_inputs.rudder_pedal_pos = A380PrimComputerFctl_B.rudder_pedal_pos;
  A380PrimComputerFctl_Y.out.data.analog_inputs.yellow_hyd_pressure_psi = A380PrimComputerFctl_B.yellow_hyd_pressure_psi;
  A380PrimComputerFctl_Y.out.data.analog_inputs.green_hyd_pressure_psi = A380PrimComputerFctl_B.green_hyd_pressure_psi;
  A380PrimComputerFctl_Y.out.data.analog_inputs.vert_acc_1_g = A380PrimComputerFctl_B.vert_acc_1_g;
  A380PrimComputerFctl_Y.out.data.analog_inputs.vert_acc_2_g = A380PrimComputerFctl_B.vert_acc_2_g;
  A380PrimComputerFctl_Y.out.data.analog_inputs.vert_acc_3_g = A380PrimComputerFctl_B.vert_acc_3_g;
  A380PrimComputerFctl_Y.out.data.analog_inputs.lat_acc_1_g = A380PrimComputerFctl_B.lat_acc_1_g;
  A380PrimComputerFctl_Y.out.data.analog_inputs.lat_acc_2_g = A380PrimComputerFctl_B.lat_acc_2_g;
  A380PrimComputerFctl_Y.out.data.analog_inputs.lat_acc_3_g = A380PrimComputerFctl_B.lat_acc_3_g;
  A380PrimComputerFctl_Y.out.data.analog_inputs.left_body_wheel_speed = A380PrimComputerFctl_B.left_body_wheel_speed;
  A380PrimComputerFctl_Y.out.data.analog_inputs.left_wing_wheel_speed = A380PrimComputerFctl_B.left_wing_wheel_speed;
  A380PrimComputerFctl_Y.out.data.analog_inputs.right_body_wheel_speed = A380PrimComputerFctl_B.right_body_wheel_speed;
  A380PrimComputerFctl_Y.out.data.analog_inputs.right_wing_wheel_speed = A380PrimComputerFctl_B.right_wing_wheel_speed;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM = A380PrimComputerFctl_B.SSM_mw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data = A380PrimComputerFctl_B.Data_gsl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM = A380PrimComputerFctl_B.SSM_d50;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data = A380PrimComputerFctl_B.Data_i0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.mach.SSM = A380PrimComputerFctl_B.SSM_dd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.mach.Data = A380PrimComputerFctl_B.Data_f52;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM = A380PrimComputerFctl_B.SSM_o2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data = A380PrimComputerFctl_B.Data_hyo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM = A380PrimComputerFctl_B.SSM_en3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data = A380PrimComputerFctl_B.Data_oi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM = A380PrimComputerFctl_B.SSM_gt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data = A380PrimComputerFctl_B.Data_aei;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM = A380PrimComputerFctl_B.SSM_cum;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data = A380PrimComputerFctl_B.Data_jz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM =
    A380PrimComputerFctl_B.SSM_ka;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFctl_B.Data_pwfb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM = A380PrimComputerFctl_B.SSM_lu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data = A380PrimComputerFctl_B.Data_la;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM = A380PrimComputerFctl_B.SSM_c5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data = A380PrimComputerFctl_B.Data_b0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.mach.SSM = A380PrimComputerFctl_B.SSM_ol;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.mach.Data = A380PrimComputerFctl_B.Data_g5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM = A380PrimComputerFctl_B.SSM_k2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data = A380PrimComputerFctl_B.Data_os;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM = A380PrimComputerFctl_B.SSM_gn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data = A380PrimComputerFctl_B.Data_btc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM = A380PrimComputerFctl_B.SSM_bdi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data = A380PrimComputerFctl_B.Data_nhn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM = A380PrimComputerFctl_B.SSM_lil;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data = A380PrimComputerFctl_B.Data_im;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM =
    A380PrimComputerFctl_B.SSM_lmv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFctl_B.Data_no;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM = A380PrimComputerFctl_B.SSM_ig;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data = A380PrimComputerFctl_B.Data_av;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM = A380PrimComputerFctl_B.SSM_ch;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data = A380PrimComputerFctl_B.Data_me;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.mach.SSM = A380PrimComputerFctl_B.SSM_gz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.mach.Data = A380PrimComputerFctl_B.Data_ly;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM = A380PrimComputerFctl_B.SSM_pv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data = A380PrimComputerFctl_B.Data_jq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM = A380PrimComputerFctl_B.SSM_mf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data = A380PrimComputerFctl_B.Data_o5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM = A380PrimComputerFctl_B.SSM_kd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data = A380PrimComputerFctl_B.Data_n;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM = A380PrimComputerFctl_B.SSM_nv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data = A380PrimComputerFctl_B.Data_bq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM =
    A380PrimComputerFctl_B.SSM_d5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data =
    A380PrimComputerFctl_B.Data_dmn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.SSM = A380PrimComputerFctl_B.SSM_eo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.Data = A380PrimComputerFctl_B.Data_jn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.SSM = A380PrimComputerFctl_B.SSM_nd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.Data = A380PrimComputerFctl_B.Data_c;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.SSM = A380PrimComputerFctl_B.SSM_bq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.Data = A380PrimComputerFctl_B.Data_lx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM = A380PrimComputerFctl_B.SSM_hi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.Data = A380PrimComputerFctl_B.Data_jb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM = A380PrimComputerFctl_B.SSM_mm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data = A380PrimComputerFctl_B.Data_fn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.SSM = A380PrimComputerFctl_B.SSM_kz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.Data = A380PrimComputerFctl_B.Data_od;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM = A380PrimComputerFctl_B.SSM_il;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.Data = A380PrimComputerFctl_B.Data_ez;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM = A380PrimComputerFctl_B.SSM_i2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data = A380PrimComputerFctl_B.Data_pw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFctl_B.SSM_ah;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data = A380PrimComputerFctl_B.Data_m2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM = A380PrimComputerFctl_B.SSM_en;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data = A380PrimComputerFctl_B.Data_ek;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM = A380PrimComputerFctl_B.SSM_dq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.Data = A380PrimComputerFctl_B.Data_iy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM = A380PrimComputerFctl_B.SSM_px;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data = A380PrimComputerFctl_B.Data_lk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM = A380PrimComputerFctl_B.SSM_lbo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data = A380PrimComputerFctl_B.Data_ca;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM = A380PrimComputerFctl_B.SSM_p5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data = A380PrimComputerFctl_B.Data_pix;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM = A380PrimComputerFctl_B.SSM_mk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.Data = A380PrimComputerFctl_B.Data_di;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_mu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFctl_B.Data_lz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_cbl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data = A380PrimComputerFctl_B.Data_lu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_gzd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFctl_B.Data_dc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM = A380PrimComputerFctl_B.SSM_mo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.Data = A380PrimComputerFctl_B.Data_gc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM = A380PrimComputerFctl_B.SSM_me;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data = A380PrimComputerFctl_B.Data_am;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM = A380PrimComputerFctl_B.SSM_mj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data = A380PrimComputerFctl_B.Data_mo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_a5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data = A380PrimComputerFctl_B.Data_dg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_bt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFctl_B.Data_e1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_om;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data = A380PrimComputerFctl_B.Data_fp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM = A380PrimComputerFctl_B.SSM_ar;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data = A380PrimComputerFctl_B.Data_ns;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFctl_B.SSM_ce;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data = A380PrimComputerFctl_B.Data_m3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFctl_B.SSM_ed;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFctl_B.Data_oj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM = A380PrimComputerFctl_B.SSM_jh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.Data = A380PrimComputerFctl_B.Data_jy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFctl_B.SSM_je;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFctl_B.Data_j1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM = A380PrimComputerFctl_B.SSM_jt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data = A380PrimComputerFctl_B.Data_fc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM = A380PrimComputerFctl_B.SSM_cui;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data = A380PrimComputerFctl_B.Data_of;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.SSM = A380PrimComputerFctl_B.SSM_mq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.Data = A380PrimComputerFctl_B.Data_lg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.SSM = A380PrimComputerFctl_B.SSM_ni;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.Data = A380PrimComputerFctl_B.Data_n4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.SSM = A380PrimComputerFctl_B.SSM_df;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.Data = A380PrimComputerFctl_B.Data_ot;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM = A380PrimComputerFctl_B.SSM_oe;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.Data = A380PrimComputerFctl_B.Data_gv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM = A380PrimComputerFctl_B.SSM_ha;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data = A380PrimComputerFctl_B.Data_ou;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.SSM = A380PrimComputerFctl_B.SSM_op;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.Data = A380PrimComputerFctl_B.Data_dh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM = A380PrimComputerFctl_B.SSM_a50;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.Data = A380PrimComputerFctl_B.Data_ph;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM = A380PrimComputerFctl_B.SSM_og;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data = A380PrimComputerFctl_B.Data_gs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFctl_B.SSM_a4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data = A380PrimComputerFctl_B.Data_fd4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM = A380PrimComputerFctl_B.SSM_bv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data = A380PrimComputerFctl_B.Data_hm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM = A380PrimComputerFctl_B.SSM_bo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.Data = A380PrimComputerFctl_B.Data_i2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM = A380PrimComputerFctl_B.SSM_d1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data = A380PrimComputerFctl_B.Data_og;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM = A380PrimComputerFctl_B.SSM_hy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data = A380PrimComputerFctl_B.Data_fv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM = A380PrimComputerFctl_B.SSM_gi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data = A380PrimComputerFctl_B.Data_oc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM = A380PrimComputerFctl_B.SSM_pp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.Data = A380PrimComputerFctl_B.Data_kq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_iab;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFctl_B.Data_ne;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_jtv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data = A380PrimComputerFctl_B.Data_it;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_fy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFctl_B.Data_ch;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM = A380PrimComputerFctl_B.SSM_d4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.Data = A380PrimComputerFctl_B.Data_bb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM = A380PrimComputerFctl_B.SSM_ars;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data = A380PrimComputerFctl_B.Data_ol;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM = A380PrimComputerFctl_B.SSM_din;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data = A380PrimComputerFctl_B.Data_hw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_m3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data = A380PrimComputerFctl_B.Data_hs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_np;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFctl_B.Data_fj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_ax;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data = A380PrimComputerFctl_B.Data_ky;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM = A380PrimComputerFctl_B.SSM_cl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data = A380PrimComputerFctl_B.Data_h5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFctl_B.SSM_es;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data = A380PrimComputerFctl_B.Data_ku;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFctl_B.SSM_gi1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFctl_B.Data_jp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM = A380PrimComputerFctl_B.SSM_jz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.Data = A380PrimComputerFctl_B.Data_nu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFctl_B.SSM_kt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFctl_B.Data_br;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM = A380PrimComputerFctl_B.SSM_ds;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data = A380PrimComputerFctl_B.Data_ae;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM = A380PrimComputerFctl_B.SSM_eg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data = A380PrimComputerFctl_B.Data_pe;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.SSM = A380PrimComputerFctl_B.SSM_a0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.Data = A380PrimComputerFctl_B.Data_fy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.SSM = A380PrimComputerFctl_B.SSM_cv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.Data = A380PrimComputerFctl_B.Data_na;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.SSM = A380PrimComputerFctl_B.SSM_ea;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.Data = A380PrimComputerFctl_B.Data_my;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM = A380PrimComputerFctl_B.SSM_p4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.Data = A380PrimComputerFctl_B.Data_i4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM = A380PrimComputerFctl_B.SSM_m2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data = A380PrimComputerFctl_B.Data_cx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.SSM = A380PrimComputerFctl_B.SSM_bt0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.Data = A380PrimComputerFctl_B.Data_nz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM = A380PrimComputerFctl_B.SSM_nr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.Data = A380PrimComputerFctl_B.Data_id;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM = A380PrimComputerFctl_B.SSM_fr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data = A380PrimComputerFctl_B.Data_o2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM = A380PrimComputerFctl_B.SSM_cc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data = A380PrimComputerFctl_B.Data_gqq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM = A380PrimComputerFctl_B.SSM_lm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data = A380PrimComputerFctl_B.Data_md;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM = A380PrimComputerFctl_B.SSM_mkm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.Data = A380PrimComputerFctl_B.Data_cz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM = A380PrimComputerFctl_B.SSM_jhd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data = A380PrimComputerFctl_B.Data_pm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM = A380PrimComputerFctl_B.SSM_av;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data = A380PrimComputerFctl_B.Data_bj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM = A380PrimComputerFctl_B.SSM_ira;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data = A380PrimComputerFctl_B.Data_ox;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM = A380PrimComputerFctl_B.SSM_ge;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.Data = A380PrimComputerFctl_B.Data_pe5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_lv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data = A380PrimComputerFctl_B.Data_jj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_cg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data = A380PrimComputerFctl_B.Data_p5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_be;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data = A380PrimComputerFctl_B.Data_ekl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM = A380PrimComputerFctl_B.SSM_axb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.Data = A380PrimComputerFctl_B.Data_nd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM = A380PrimComputerFctl_B.SSM_nz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data = A380PrimComputerFctl_B.Data_n2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM = A380PrimComputerFctl_B.SSM_cx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data = A380PrimComputerFctl_B.Data_dl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_gh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data = A380PrimComputerFctl_B.Data_gs2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_ks;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data = A380PrimComputerFctl_B.Data_h4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM = A380PrimComputerFctl_B.SSM_pw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data = A380PrimComputerFctl_B.Data_e3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM = A380PrimComputerFctl_B.SSM_fh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data = A380PrimComputerFctl_B.Data_f5h;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM = A380PrimComputerFctl_B.SSM_gzn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data = A380PrimComputerFctl_B.Data_an;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM = A380PrimComputerFctl_B.SSM_oo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data = A380PrimComputerFctl_B.Data_i4o;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM = A380PrimComputerFctl_B.SSM_evh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.Data = A380PrimComputerFctl_B.Data_af;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputerFctl_B.SSM_cn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputerFctl_B.Data_bm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM = A380PrimComputerFctl_B.SSM_co;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data = A380PrimComputerFctl_B.Data_dk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM = A380PrimComputerFctl_B.SSM_pe;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data = A380PrimComputerFctl_B.Data_nv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.SSM = A380PrimComputerFctl_B.SSM_cgz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.Data = A380PrimComputerFctl_B.Data_jpf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.SSM = A380PrimComputerFctl_B.SSM_fw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.Data = A380PrimComputerFctl_B.Data_i5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM =
    A380PrimComputerFctl_B.SSM_h4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data =
    A380PrimComputerFctl_B.Data_k2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM =
    A380PrimComputerFctl_B.SSM_cb3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data =
    A380PrimComputerFctl_B.Data_as;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM =
    A380PrimComputerFctl_B.SSM_pj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data =
    A380PrimComputerFctl_B.Data_gk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM = A380PrimComputerFctl_B.SSM_dv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data = A380PrimComputerFctl_B.Data_jl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM = A380PrimComputerFctl_B.SSM_i4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data = A380PrimComputerFctl_B.Data_e32;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM =
    A380PrimComputerFctl_B.SSM_fm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data =
    A380PrimComputerFctl_B.Data_ih;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM = A380PrimComputerFctl_B.SSM_e5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data =
    A380PrimComputerFctl_B.Data_du;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM =
    A380PrimComputerFctl_B.SSM_bf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data =
    A380PrimComputerFctl_B.Data_nx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM = A380PrimComputerFctl_B.SSM_fd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data = A380PrimComputerFctl_B.Data_n0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM = A380PrimComputerFctl_B.SSM_fv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data = A380PrimComputerFctl_B.Data_eqi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM = A380PrimComputerFctl_B.SSM_dt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data = A380PrimComputerFctl_B.Data_om;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM = A380PrimComputerFctl_B.SSM_j5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data = A380PrimComputerFctl_B.Data_nr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM = A380PrimComputerFctl_B.SSM_ng;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data = A380PrimComputerFctl_B.Data_p3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM = A380PrimComputerFctl_B.SSM_cs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data = A380PrimComputerFctl_B.Data_nb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM = A380PrimComputerFctl_B.SSM_ls;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data = A380PrimComputerFctl_B.Data_hd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM = A380PrimComputerFctl_B.SSM_dg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data = A380PrimComputerFctl_B.Data_al;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM = A380PrimComputerFctl_B.SSM_d3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data = A380PrimComputerFctl_B.Data_gu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM = A380PrimComputerFctl_B.SSM_p2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data = A380PrimComputerFctl_B.Data_ix;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_bo0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_do;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_bc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_hu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_h0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_pm1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_giz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_i2y;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_mqp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_pg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_ba;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_ni;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.SSM = A380PrimComputerFctl_B.SSM_in;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data = A380PrimComputerFctl_B.Data_fr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.SSM = A380PrimComputerFctl_B.SSM_ff;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data =
    A380PrimComputerFctl_B.Data_cn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.SSM = A380PrimComputerFctl_B.SSM_ic;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data =
    A380PrimComputerFctl_B.Data_nxl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.SSM = A380PrimComputerFctl_B.SSM_fs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data =
    A380PrimComputerFctl_B.Data_jh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.SSM = A380PrimComputerFctl_B.SSM_ja;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data = A380PrimComputerFctl_B.Data_gl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.SSM = A380PrimComputerFctl_B.SSM_js;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data =
    A380PrimComputerFctl_B.Data_gn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.SSM = A380PrimComputerFctl_B.SSM_is3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data =
    A380PrimComputerFctl_B.Data_myb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.SSM = A380PrimComputerFctl_B.SSM_ag;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data =
    A380PrimComputerFctl_B.Data_l2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.SSM = A380PrimComputerFctl_B.SSM_f5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data =
    A380PrimComputerFctl_B.Data_o5o;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.SSM = A380PrimComputerFctl_B.SSM_ph;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data =
    A380PrimComputerFctl_B.Data_l5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.SSM = A380PrimComputerFctl_B.SSM_jw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data =
    A380PrimComputerFctl_B.Data_dc2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.SSM = A380PrimComputerFctl_B.SSM_jy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data =
    A380PrimComputerFctl_B.Data_gr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.SSM = A380PrimComputerFctl_B.SSM_j1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data = A380PrimComputerFctl_B.Data_gp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.SSM = A380PrimComputerFctl_B.SSM_ov;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data =
    A380PrimComputerFctl_B.Data_i3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.SSM = A380PrimComputerFctl_B.SSM_mx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data = A380PrimComputerFctl_B.Data_et;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.SSM = A380PrimComputerFctl_B.SSM_b4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data =
    A380PrimComputerFctl_B.Data_mc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_gb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_k3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_oh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_f2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_mm5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_gh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_br;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_ed;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.ths_command_deg.SSM = A380PrimComputerFctl_B.SSM_c2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.ths_command_deg.Data = A380PrimComputerFctl_B.Data_o2j;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.SSM = A380PrimComputerFctl_B.SSM_hc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data = A380PrimComputerFctl_B.Data_i43;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.SSM = A380PrimComputerFctl_B.SSM_ktr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data = A380PrimComputerFctl_B.Data_ic;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_gl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_ak;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_my;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_jg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_j3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_cu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_go;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_ep;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFctl_B.SSM_e5c;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.Data = A380PrimComputerFctl_B.Data_d3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.aileron_status_word.SSM = A380PrimComputerFctl_B.SSM_dk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.aileron_status_word.Data = A380PrimComputerFctl_B.Data_bt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_evc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_e0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_kk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_jl3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_af;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_nm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.SSM =
    A380PrimComputerFctl_B.SSM_npr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_ia;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.spoiler_status_word.SSM = A380PrimComputerFctl_B.SSM_ew;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.spoiler_status_word.Data = A380PrimComputerFctl_B.Data_j0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.SSM = A380PrimComputerFctl_B.SSM_lt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data = A380PrimComputerFctl_B.Data_bs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.SSM = A380PrimComputerFctl_B.SSM_ger;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data = A380PrimComputerFctl_B.Data_hp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_status_word.SSM = A380PrimComputerFctl_B.SSM_pxo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_status_word.Data = A380PrimComputerFctl_B.Data_ct;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_co2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_1_position_deg.Data = A380PrimComputerFctl_B.Data_pc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_ny;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_2_position_deg.Data = A380PrimComputerFctl_B.Data_nzt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_3_position_deg.SSM = A380PrimComputerFctl_B.SSM_l4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.elevator_3_position_deg.Data = A380PrimComputerFctl_B.Data_c0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.ths_position_deg.SSM = A380PrimComputerFctl_B.SSM_nm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.ths_position_deg.Data = A380PrimComputerFctl_B.Data_ojg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_status_word.SSM = A380PrimComputerFctl_B.SSM_nh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_status_word.Data = A380PrimComputerFctl_B.Data_lm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_dl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_1_position_deg.Data = A380PrimComputerFctl_B.Data_fz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_dx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.rudder_2_position_deg.Data = A380PrimComputerFctl_B.Data_oz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.radio_height_1_ft.SSM = A380PrimComputerFctl_B.SSM_a5h;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.radio_height_1_ft.Data = A380PrimComputerFctl_B.Data_gf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.radio_height_2_ft.SSM = A380PrimComputerFctl_B.SSM_fl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.radio_height_2_ft.Data = A380PrimComputerFctl_B.Data_nn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.fctl_law_status_word.SSM = A380PrimComputerFctl_B.SSM_p3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.fctl_law_status_word.Data = A380PrimComputerFctl_B.Data_a0z;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.discrete_status_word_1.SSM = A380PrimComputerFctl_B.SSM_ns;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.discrete_status_word_1.Data = A380PrimComputerFctl_B.Data_fk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.fe_status_word.SSM = A380PrimComputerFctl_B.SSM_bm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.fe_status_word.Data = A380PrimComputerFctl_B.Data_bu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.fg_status_word.SSM = A380PrimComputerFctl_B.SSM_nl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_x_bus.fg_status_word.Data = A380PrimComputerFctl_B.Data_o23;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_grm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_g3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_gzm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_icc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_oi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_pwf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_aa;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_gvk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_fvk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_ln;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_lw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data =
    A380PrimComputerFctl_B.Data_ka;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.SSM = A380PrimComputerFctl_B.SSM_fa;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data = A380PrimComputerFctl_B.Data_mp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.SSM = A380PrimComputerFctl_B.SSM_lbx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data =
    A380PrimComputerFctl_B.Data_m4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.SSM = A380PrimComputerFctl_B.SSM_n3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data =
    A380PrimComputerFctl_B.Data_fki;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.SSM = A380PrimComputerFctl_B.SSM_a1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data =
    A380PrimComputerFctl_B.Data_bv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.SSM = A380PrimComputerFctl_B.SSM_p1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data =
    A380PrimComputerFctl_B.Data_m21;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.SSM = A380PrimComputerFctl_B.SSM_cn2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data =
    A380PrimComputerFctl_B.Data_nbg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.SSM = A380PrimComputerFctl_B.SSM_an3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data =
    A380PrimComputerFctl_B.Data_l25;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.SSM = A380PrimComputerFctl_B.SSM_c3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data =
    A380PrimComputerFctl_B.Data_ki;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.SSM = A380PrimComputerFctl_B.SSM_dp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data =
    A380PrimComputerFctl_B.Data_p5p;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.SSM = A380PrimComputerFctl_B.SSM_boy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data =
    A380PrimComputerFctl_B.Data_nry;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.SSM = A380PrimComputerFctl_B.SSM_lg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data = A380PrimComputerFctl_B.Data_mh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.SSM = A380PrimComputerFctl_B.SSM_cm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data =
    A380PrimComputerFctl_B.Data_ll;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.SSM = A380PrimComputerFctl_B.SSM_hl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data = A380PrimComputerFctl_B.Data_hy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.SSM = A380PrimComputerFctl_B.SSM_irh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data =
    A380PrimComputerFctl_B.Data_j04;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.SSM = A380PrimComputerFctl_B.SSM_b42;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data = A380PrimComputerFctl_B.Data_pf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.SSM = A380PrimComputerFctl_B.SSM_anz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data =
    A380PrimComputerFctl_B.Data_pl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_d2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_gb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_gov;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_hq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_nb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_ai;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_pe3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data =
    A380PrimComputerFctl_B.Data_gfr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.ths_command_deg.SSM = A380PrimComputerFctl_B.SSM_jj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.ths_command_deg.Data = A380PrimComputerFctl_B.Data_czp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.SSM = A380PrimComputerFctl_B.SSM_jx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data = A380PrimComputerFctl_B.Data_fm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.SSM = A380PrimComputerFctl_B.SSM_npl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data = A380PrimComputerFctl_B.Data_jsg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_gf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_g1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_gbi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_j4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_fhm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_jyh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_ltj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_e4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFctl_B.SSM_hn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.Data = A380PrimComputerFctl_B.Data_ghs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.aileron_status_word.SSM = A380PrimComputerFctl_B.SSM_h3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.aileron_status_word.Data = A380PrimComputerFctl_B.Data_bmk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_bfs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_lzt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_p0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_kn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_fu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_nab;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_hr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_lgf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.spoiler_status_word.SSM = A380PrimComputerFctl_B.SSM_bi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.spoiler_status_word.Data = A380PrimComputerFctl_B.Data_fpq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.SSM = A380PrimComputerFctl_B.SSM_bd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data = A380PrimComputerFctl_B.Data_dt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.SSM = A380PrimComputerFctl_B.SSM_omt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data = A380PrimComputerFctl_B.Data_b1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_status_word.SSM = A380PrimComputerFctl_B.SSM_la;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_status_word.Data = A380PrimComputerFctl_B.Data_nmr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_l1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_1_position_deg.Data = A380PrimComputerFctl_B.Data_ea;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_dy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_2_position_deg.Data = A380PrimComputerFctl_B.Data_nib;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_3_position_deg.SSM = A380PrimComputerFctl_B.SSM_ie;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.elevator_3_position_deg.Data = A380PrimComputerFctl_B.Data_i2t;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.ths_position_deg.SSM = A380PrimComputerFctl_B.SSM_kf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.ths_position_deg.Data = A380PrimComputerFctl_B.Data_ng;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_status_word.SSM = A380PrimComputerFctl_B.SSM_p5l;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_status_word.Data = A380PrimComputerFctl_B.Data_h31;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_g3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_1_position_deg.Data = A380PrimComputerFctl_B.Data_ew;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_b3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.rudder_2_position_deg.Data = A380PrimComputerFctl_B.Data_j1s;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.radio_height_1_ft.SSM = A380PrimComputerFctl_B.SSM_dxv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.radio_height_1_ft.Data = A380PrimComputerFctl_B.Data_j5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.radio_height_2_ft.SSM = A380PrimComputerFctl_B.SSM_mxz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.radio_height_2_ft.Data = A380PrimComputerFctl_B.Data_cw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.fctl_law_status_word.SSM = A380PrimComputerFctl_B.SSM_kk4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.fctl_law_status_word.Data = A380PrimComputerFctl_B.Data_gqa;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.discrete_status_word_1.SSM = A380PrimComputerFctl_B.SSM_cy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.discrete_status_word_1.Data = A380PrimComputerFctl_B.Data_hz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.fe_status_word.SSM = A380PrimComputerFctl_B.SSM_ju;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.fe_status_word.Data = A380PrimComputerFctl_B.Data_fri;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.fg_status_word.SSM = A380PrimComputerFctl_B.SSM_ey;
  A380PrimComputerFctl_Y.out.data.bus_inputs.prim_y_bus.fg_status_word.Data = A380PrimComputerFctl_B.Data_cm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_jr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_czj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_hs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_mb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_mx3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_gk4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_er;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_gbt;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFctl_B.SSM_hm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data = A380PrimComputerFctl_B.Data_p0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.aileron_status_word.SSM = A380PrimComputerFctl_B.SSM_dm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.aileron_status_word.Data = A380PrimComputerFctl_B.Data_dn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_fk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_iyw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_lm1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_p5d;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_nc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_oo;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_e4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_ho;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM = A380PrimComputerFctl_B.SSM_bw;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.spoiler_status_word.Data = A380PrimComputerFctl_B.Data_kqr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_na;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_omv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_lf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_mby;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_oz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFctl_B.Data_hk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_mub;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_hg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_status_word.SSM = A380PrimComputerFctl_B.SSM_li;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_status_word.Data = A380PrimComputerFctl_B.Data_bi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_hcd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data = A380PrimComputerFctl_B.Data_i4u;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_php;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data = A380PrimComputerFctl_B.Data_ik;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM = A380PrimComputerFctl_B.SSM_ma;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data = A380PrimComputerFctl_B.Data_dq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.ths_position_deg.SSM = A380PrimComputerFctl_B.SSM_jut;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.ths_position_deg.Data = A380PrimComputerFctl_B.Data_pv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_status_word.SSM = A380PrimComputerFctl_B.SSM_kh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_status_word.Data = A380PrimComputerFctl_B.Data_p1d;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_h2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data = A380PrimComputerFctl_B.Data_lyv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_ago;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data = A380PrimComputerFctl_B.Data_ke;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFctl_B.SSM_ep;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFctl_B.Data_cv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM = A380PrimComputerFctl_B.SSM_kc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data = A380PrimComputerFctl_B.Data_pfh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM = A380PrimComputerFctl_B.SSM_cnf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_1_bus.misc_data_status_word.Data = A380PrimComputerFctl_B.Data_jy4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_lwa;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_o1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_aq;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_ga;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_ja2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_kd;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_in3;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_fx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFctl_B.SSM_ap;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data = A380PrimComputerFctl_B.Data_nml;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.aileron_status_word.SSM = A380PrimComputerFctl_B.SSM_mg;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.aileron_status_word.Data = A380PrimComputerFctl_B.Data_fa;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_bu;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data = A380PrimComputerFctl_B.Data_nh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_cbb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data = A380PrimComputerFctl_B.Data_or;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_iao;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_otn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_ip;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_cam;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM = A380PrimComputerFctl_B.SSM_f4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.spoiler_status_word.Data = A380PrimComputerFctl_B.Data_amp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_id;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFctl_B.Data_mv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_mqr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_gx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_cm2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFctl_B.Data_lb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_ck;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_can;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_status_word.SSM = A380PrimComputerFctl_B.SSM_pl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_status_word.Data = A380PrimComputerFctl_B.Data_gae;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_gs;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data = A380PrimComputerFctl_B.Data_h1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_kse;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data = A380PrimComputerFctl_B.Data_bc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM = A380PrimComputerFctl_B.SSM_icj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data = A380PrimComputerFctl_B.Data_fof;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.ths_position_deg.SSM = A380PrimComputerFctl_B.SSM_ds4;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.ths_position_deg.Data = A380PrimComputerFctl_B.Data_nj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_status_word.SSM = A380PrimComputerFctl_B.SSM_gbf;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_status_word.Data = A380PrimComputerFctl_B.Data_lr;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_opv;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data = A380PrimComputerFctl_B.Data_k0s;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_gha;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data = A380PrimComputerFctl_B.Data_m4b;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFctl_B.SSM_ple;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFctl_B.Data_e3r;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM = A380PrimComputerFctl_B.SSM_h0n;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data = A380PrimComputerFctl_B.Data_au;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM = A380PrimComputerFctl_B.SSM_c1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_2_bus.misc_data_status_word.Data = A380PrimComputerFctl_B.Data_czc;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_ai;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_itz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_at;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data =
    A380PrimComputerFctl_B.Data_nsk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_bz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_is;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_n0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data =
    A380PrimComputerFctl_B.Data_pk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM = A380PrimComputerFctl_B.SSM_haz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data = A380PrimComputerFctl_B.Data_dg0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.aileron_status_word.SSM = A380PrimComputerFctl_B.SSM_hz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.aileron_status_word.Data = A380PrimComputerFctl_B.Data_nru;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_hk;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data = A380PrimComputerFctl_B.Data_d5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_cvn;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data = A380PrimComputerFctl_B.Data_oa;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_iy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_bp;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_jwz;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_cl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM = A380PrimComputerFctl_B.SSM_eig;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.spoiler_status_word.Data = A380PrimComputerFctl_B.Data_er;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_jl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data = A380PrimComputerFctl_B.Data_in;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_cci;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data =
    A380PrimComputerFctl_B.Data_btl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_ow;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data = A380PrimComputerFctl_B.Data_a5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_bcj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data =
    A380PrimComputerFctl_B.Data_bjx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_status_word.SSM = A380PrimComputerFctl_B.SSM_i5;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_status_word.Data = A380PrimComputerFctl_B.Data_ci;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_jww;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data = A380PrimComputerFctl_B.Data_h2;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_kkj;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data = A380PrimComputerFctl_B.Data_ce;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM = A380PrimComputerFctl_B.SSM_ndh;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data = A380PrimComputerFctl_B.Data_dx;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.ths_position_deg.SSM = A380PrimComputerFctl_B.SSM_k1;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.ths_position_deg.Data = A380PrimComputerFctl_B.Data_fvi;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_status_word.SSM = A380PrimComputerFctl_B.SSM_kl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_status_word.Data = A380PrimComputerFctl_B.Data_gnm;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_po;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data = A380PrimComputerFctl_B.Data_e3y;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_ie0;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data = A380PrimComputerFctl_B.Data_ld;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM = A380PrimComputerFctl_B.SSM_ay;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data = A380PrimComputerFctl_B.Data_k3v;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM = A380PrimComputerFctl_B.SSM_gsb;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data = A380PrimComputerFctl_B.Data_oy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM = A380PrimComputerFctl_B.SSM_mxy;
  A380PrimComputerFctl_Y.out.data.bus_inputs.sec_3_bus.misc_data_status_word.Data = A380PrimComputerFctl_B.Data_nl;
  A380PrimComputerFctl_Y.out.data.bus_inputs.isis_1_bus = A380PrimComputerFctl_B.isis_1_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.isis_2_bus = A380PrimComputerFctl_B.isis_2_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.rate_gyro_pitch_1_bus = A380PrimComputerFctl_B.rate_gyro_pitch_1_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.rate_gyro_pitch_2_bus = A380PrimComputerFctl_B.rate_gyro_pitch_2_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.rate_gyro_roll_1_bus = A380PrimComputerFctl_B.rate_gyro_roll_1_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.rate_gyro_roll_2_bus = A380PrimComputerFctl_B.rate_gyro_roll_2_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.rate_gyro_yaw_1_bus = A380PrimComputerFctl_B.rate_gyro_yaw_1_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.rate_gyro_yaw_2_bus = A380PrimComputerFctl_B.rate_gyro_yaw_2_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.irdc_1_bus = A380PrimComputerFctl_B.irdc_1_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.irdc_2_bus = A380PrimComputerFctl_B.irdc_2_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.irdc_3_bus = A380PrimComputerFctl_B.irdc_3_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.irdc_4_a_bus = A380PrimComputerFctl_B.irdc_4_a_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.irdc_4_b_bus = A380PrimComputerFctl_B.irdc_4_b_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.fcu_own_bus = A380PrimComputerFctl_B.fcu_own_bus;
  A380PrimComputerFctl_Y.out.data.bus_inputs.fcu_opp_bus = A380PrimComputerFctl_B.fcu_opp_bus;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.ap_engaged = A380PrimComputerFctl_B.ap_engaged;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.ap_1_engaged = A380PrimComputerFctl_B.ap_1_engaged;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.ap_2_engaged = A380PrimComputerFctl_B.ap_2_engaged;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.athr_engaged = A380PrimComputerFctl_B.athr_engaged;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.roll_command = A380PrimComputerFctl_B.roll_command;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.pitch_command = A380PrimComputerFctl_B.pitch_command;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.yaw_command = A380PrimComputerFctl_B.yaw_command;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.lateral_mode = A380PrimComputerFctl_B.lateral_mode;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.lateral_mode_armed = A380PrimComputerFctl_B.lateral_mode_armed;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.vertical_mode = A380PrimComputerFctl_B.vertical_mode;
  A380PrimComputerFctl_Y.out.data.temporary_ap_input.vertical_mode_armed = A380PrimComputerFctl_B.vertical_mode_armed;
  A380PrimComputerFctl_Y.out.general_logic.adr_computation_data.V_ias_kn = A380PrimComputerFctl_B.V_ias_kn;
  A380PrimComputerFctl_Y.out.general_logic.adr_computation_data.V_tas_kn = A380PrimComputerFctl_B.V_tas_kn;
  A380PrimComputerFctl_Y.out.general_logic.adr_computation_data.mach = A380PrimComputerFctl_B.mach;
  A380PrimComputerFctl_Y.out.general_logic.adr_computation_data.alpha_deg = A380PrimComputerFctl_B.alpha_deg;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.theta_deg = A380PrimComputerFctl_B.theta_deg;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.phi_deg = A380PrimComputerFctl_B.phi_deg;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.q_deg_s = A380PrimComputerFctl_B.q_deg_s;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.r_deg_s = A380PrimComputerFctl_B.r_deg_s;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.n_x_g = A380PrimComputerFctl_B.n_x_g;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.n_y_g = A380PrimComputerFctl_B.n_y_g;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.n_z_g = A380PrimComputerFctl_B.n_z_g;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.theta_dot_deg_s = A380PrimComputerFctl_B.theta_dot_deg_s;
  A380PrimComputerFctl_Y.out.general_logic.ir_computation_data.phi_dot_deg_s = A380PrimComputerFctl_B.phi_dot_deg_s;
  A380PrimComputerFctl_Y.out.general_logic.on_ground = A380PrimComputerFctl_B.on_ground;
  A380PrimComputerFctl_Y.out.general_logic.tracking_mode_on = A380PrimComputerFctl_B.tracking_mode_on;
  A380PrimComputerFctl_Y.out.general_logic.double_adr_failure = A380PrimComputerFctl_B.double_adr_failure;
  A380PrimComputerFctl_Y.out.general_logic.triple_adr_failure = A380PrimComputerFctl_B.triple_adr_failure;
  A380PrimComputerFctl_Y.out.general_logic.cas_or_mach_disagree = A380PrimComputerFctl_B.cas_or_mach_disagree;
  A380PrimComputerFctl_Y.out.general_logic.alpha_disagree = A380PrimComputerFctl_B.alpha_disagree;
  A380PrimComputerFctl_Y.out.general_logic.double_ir_failure = A380PrimComputerFctl_B.double_ir_failure;
  A380PrimComputerFctl_Y.out.general_logic.triple_ir_failure = A380PrimComputerFctl_B.triple_ir_failure;
  A380PrimComputerFctl_Y.out.general_logic.ir_failure_not_self_detected =
    A380PrimComputerFctl_B.ir_failure_not_self_detected;
  A380PrimComputerFctl_Y.out.general_logic.ra_computation_data_ft = A380PrimComputerFctl_B.ra_computation_data_ft;
  A380PrimComputerFctl_Y.out.general_logic.two_ra_failure = A380PrimComputerFctl_B.two_ra_failure;
  A380PrimComputerFctl_Y.out.general_logic.all_ra_failure = A380PrimComputerFctl_B.all_ra_failure;
  A380PrimComputerFctl_Y.out.general_logic.all_sfcc_lost = A380PrimComputerFctl_B.all_sfcc_lost;
  A380PrimComputerFctl_Y.out.general_logic.flap_handle_index = A380PrimComputerFctl_B.flap_handle_index;
  A380PrimComputerFctl_Y.out.general_logic.flap_angle_deg = A380PrimComputerFctl_B.flap_angle_deg;
  A380PrimComputerFctl_Y.out.general_logic.slat_angle_deg = A380PrimComputerFctl_B.slat_angle_deg;
  A380PrimComputerFctl_Y.out.general_logic.slat_flap_actual_pos = A380PrimComputerFctl_B.slat_flap_actual_pos;
  A380PrimComputerFctl_Y.out.general_logic.double_lgciu_failure = A380PrimComputerFctl_B.double_lgciu_failure;
  A380PrimComputerFctl_Y.out.general_logic.slats_locked = A380PrimComputerFctl_B.slats_locked;
  A380PrimComputerFctl_Y.out.general_logic.flaps_locked = A380PrimComputerFctl_B.flaps_locked;
  A380PrimComputerFctl_Y.out.general_logic.landing_gear_down = A380PrimComputerFctl_B.landing_gear_down;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_inboard_aileron_deg =
    A380PrimComputerFctl_B.left_inboard_aileron_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_inboard_aileron_deg =
    A380PrimComputerFctl_B.right_inboard_aileron_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_midboard_aileron_deg =
    A380PrimComputerFctl_B.left_midboard_aileron_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_midboard_aileron_deg =
    A380PrimComputerFctl_B.right_midboard_aileron_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_outboard_aileron_deg =
    A380PrimComputerFctl_B.left_outboard_aileron_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_outboard_aileron_deg =
    A380PrimComputerFctl_B.right_outboard_aileron_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_1_deg = A380PrimComputerFctl_B.left_spoiler_1_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_1_deg = A380PrimComputerFctl_B.right_spoiler_1_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_2_deg = A380PrimComputerFctl_B.left_spoiler_2_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_2_deg = A380PrimComputerFctl_B.right_spoiler_2_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_3_deg = A380PrimComputerFctl_B.left_spoiler_3_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_3_deg = A380PrimComputerFctl_B.right_spoiler_3_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_4_deg = A380PrimComputerFctl_B.left_spoiler_4_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_4_deg = A380PrimComputerFctl_B.right_spoiler_4_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_5_deg = A380PrimComputerFctl_B.left_spoiler_5_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_5_deg = A380PrimComputerFctl_B.right_spoiler_5_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_6_deg = A380PrimComputerFctl_B.left_spoiler_6_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_6_deg = A380PrimComputerFctl_B.right_spoiler_6_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_7_deg = A380PrimComputerFctl_B.left_spoiler_7_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_7_deg = A380PrimComputerFctl_B.right_spoiler_7_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.left_spoiler_8_deg = A380PrimComputerFctl_B.left_spoiler_8_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.right_spoiler_8_deg = A380PrimComputerFctl_B.right_spoiler_8_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.upper_rudder_deg = A380PrimComputerFctl_B.upper_rudder_deg;
  A380PrimComputerFctl_Y.out.laws.lateral_law_outputs.lower_rudder_deg = A380PrimComputerFctl_B.lower_rudder_deg;
  A380PrimComputerFctl_Y.out.laws.pitch_law_outputs.left_inboard_elevator_deg =
    A380PrimComputerFctl_B.left_inboard_elevator_deg;
  A380PrimComputerFctl_Y.out.laws.pitch_law_outputs.right_inboard_elevator_deg =
    A380PrimComputerFctl_B.right_inboard_elevator_deg;
  A380PrimComputerFctl_Y.out.laws.pitch_law_outputs.left_outboard_elevator_deg =
    A380PrimComputerFctl_B.left_outboard_elevator_deg;
  A380PrimComputerFctl_Y.out.laws.pitch_law_outputs.right_outboard_elevator_deg =
    A380PrimComputerFctl_B.right_outboard_elevator_deg;
  A380PrimComputerFctl_Y.out.laws.pitch_law_outputs.ths_deg = A380PrimComputerFctl_B.ths_deg;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.left_inboard_aileron_engaged =
    A380PrimComputerFctl_B.left_inboard_aileron_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.right_inboard_aileron_engaged =
    A380PrimComputerFctl_B.right_inboard_aileron_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.left_midboard_aileron_engaged =
    A380PrimComputerFctl_B.left_midboard_aileron_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.right_midboard_aileron_engaged =
    A380PrimComputerFctl_B.right_midboard_aileron_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.left_outboard_aileron_engaged =
    A380PrimComputerFctl_B.left_outboard_aileron_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.right_outboard_aileron_engaged =
    A380PrimComputerFctl_B.right_outboard_aileron_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_1_engaged =
    A380PrimComputerFctl_B.spoiler_pair_1_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_2_engaged =
    A380PrimComputerFctl_B.spoiler_pair_2_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_3_engaged =
    A380PrimComputerFctl_B.spoiler_pair_3_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_4_engaged =
    A380PrimComputerFctl_B.spoiler_pair_4_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_5_engaged =
    A380PrimComputerFctl_B.spoiler_pair_5_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_6_engaged =
    A380PrimComputerFctl_B.spoiler_pair_6_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_7_engaged =
    A380PrimComputerFctl_B.spoiler_pair_7_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.spoiler_pair_8_engaged =
    A380PrimComputerFctl_B.spoiler_pair_8_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.left_inboard_elevator_engaged =
    A380PrimComputerFctl_B.left_inboard_elevator_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.right_inboard_elevator_engaged =
    A380PrimComputerFctl_B.right_inboard_elevator_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.left_outboard_elevator_engaged =
    A380PrimComputerFctl_B.left_outboard_elevator_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.right_outboard_elevator_engaged =
    A380PrimComputerFctl_B.right_outboard_elevator_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.ths_engaged = A380PrimComputerFctl_B.ths_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.upper_rudder_engaged =
    A380PrimComputerFctl_B.upper_rudder_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.surface_statuses.lower_rudder_engaged =
    A380PrimComputerFctl_B.lower_rudder_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg =
    A380PrimComputerFctl_B.left_inboard_aileron_deg_g;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg =
    A380PrimComputerFctl_B.right_inboard_aileron_deg_b;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg =
    A380PrimComputerFctl_B.left_midboard_aileron_deg_f;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg =
    A380PrimComputerFctl_B.right_midboard_aileron_deg_f;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg =
    A380PrimComputerFctl_B.left_outboard_aileron_deg_g;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg =
    A380PrimComputerFctl_B.right_outboard_aileron_deg_m;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_1_deg =
    A380PrimComputerFctl_B.left_spoiler_1_deg_b;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_1_deg =
    A380PrimComputerFctl_B.right_spoiler_1_deg_o;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_2_deg =
    A380PrimComputerFctl_B.left_spoiler_2_deg_i;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_2_deg =
    A380PrimComputerFctl_B.right_spoiler_2_deg_g;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_3_deg =
    A380PrimComputerFctl_B.left_spoiler_3_deg_i;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_3_deg =
    A380PrimComputerFctl_B.right_spoiler_3_deg_b;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_4_deg =
    A380PrimComputerFctl_B.left_spoiler_4_deg_g;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_4_deg =
    A380PrimComputerFctl_B.right_spoiler_4_deg_a;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_5_deg =
    A380PrimComputerFctl_B.left_spoiler_5_deg_d;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_5_deg =
    A380PrimComputerFctl_B.right_spoiler_5_deg_m;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_6_deg =
    A380PrimComputerFctl_B.left_spoiler_6_deg_o;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_6_deg =
    A380PrimComputerFctl_B.right_spoiler_6_deg_d;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_7_deg =
    A380PrimComputerFctl_B.left_spoiler_7_deg_a;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_7_deg =
    A380PrimComputerFctl_B.right_spoiler_7_deg_j;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.left_spoiler_8_deg =
    A380PrimComputerFctl_B.left_spoiler_8_deg_h;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.right_spoiler_8_deg =
    A380PrimComputerFctl_B.right_spoiler_8_deg_j;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.upper_rudder_deg =
    A380PrimComputerFctl_B.upper_rudder_deg_m;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_surface_positions.lower_rudder_deg =
    A380PrimComputerFctl_B.lower_rudder_deg_c;
  A380PrimComputerFctl_Y.out.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg =
    A380PrimComputerFctl_B.left_inboard_elevator_deg_k;
  A380PrimComputerFctl_Y.out.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg =
    A380PrimComputerFctl_B.right_inboard_elevator_deg_o;
  A380PrimComputerFctl_Y.out.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg =
    A380PrimComputerFctl_B.left_outboard_elevator_deg_p;
  A380PrimComputerFctl_Y.out.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg =
    A380PrimComputerFctl_B.right_outboard_elevator_deg_g;
  A380PrimComputerFctl_Y.out.fctl_logic.pitch_surface_positions.ths_deg = A380PrimComputerFctl_B.ths_deg_o;
  A380PrimComputerFctl_Y.out.fctl_logic.lateral_law_capability = A380PrimComputerFctl_B.lateral_law_capability;
  A380PrimComputerFctl_Y.out.fctl_logic.active_lateral_law = A380PrimComputerFctl_B.active_lateral_law;
  A380PrimComputerFctl_Y.out.fctl_logic.pitch_law_capability = A380PrimComputerFctl_B.pitch_law_capability;
  A380PrimComputerFctl_Y.out.fctl_logic.active_pitch_law = A380PrimComputerFctl_B.active_pitch_law;
  A380PrimComputerFctl_Y.out.fctl_logic.abnormal_condition_law_active =
    A380PrimComputerFctl_B.abnormal_condition_law_active;
  A380PrimComputerFctl_Y.out.fctl_logic.is_master_prim = A380PrimComputerFctl_B.is_master_prim;
  A380PrimComputerFctl_Y.out.fctl_logic.elevator_1_avail = A380PrimComputerFctl_B.elevator_1_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.elevator_1_engaged = A380PrimComputerFctl_B.elevator_1_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.elevator_2_avail = A380PrimComputerFctl_B.elevator_2_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.elevator_2_engaged = A380PrimComputerFctl_B.elevator_2_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.elevator_3_avail = A380PrimComputerFctl_B.elevator_3_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.elevator_3_engaged = A380PrimComputerFctl_B.elevator_3_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.ths_avail = A380PrimComputerFctl_B.ths_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.ths_engaged = A380PrimComputerFctl_B.ths_engaged_h;
  A380PrimComputerFctl_Y.out.fctl_logic.left_aileron_1_avail = A380PrimComputerFctl_B.left_aileron_1_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.left_aileron_1_engaged = A380PrimComputerFctl_B.left_aileron_1_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.left_aileron_2_avail = A380PrimComputerFctl_B.left_aileron_2_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.left_aileron_2_engaged = A380PrimComputerFctl_B.left_aileron_2_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.right_aileron_1_avail = A380PrimComputerFctl_B.right_aileron_1_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.right_aileron_1_engaged = A380PrimComputerFctl_B.right_aileron_1_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.right_aileron_2_avail = A380PrimComputerFctl_B.right_aileron_2_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.right_aileron_2_engaged = A380PrimComputerFctl_B.right_aileron_2_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.left_spoiler_hydraulic_mode_avail =
    A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.left_spoiler_electric_mode_avail =
    A380PrimComputerFctl_B.left_spoiler_electric_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.left_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.left_spoiler_electric_mode_engaged =
    A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.right_spoiler_hydraulic_mode_avail =
    A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.right_spoiler_electric_mode_avail =
    A380PrimComputerFctl_B.right_spoiler_electric_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.right_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.right_spoiler_electric_mode_engaged =
    A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_1_hydraulic_mode_avail =
    A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_1_electric_mode_avail =
    A380PrimComputerFctl_B.rudder_1_electric_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_1_hydraulic_mode_engaged =
    A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_1_electric_mode_engaged =
    A380PrimComputerFctl_B.rudder_1_electric_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_2_hydraulic_mode_avail =
    A380PrimComputerFctl_B.rudder_2_hydraulic_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_2_electric_mode_avail =
    A380PrimComputerFctl_B.rudder_2_electric_mode_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_2_hydraulic_mode_engaged =
    A380PrimComputerFctl_B.rudder_2_hydraulic_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.rudder_2_electric_mode_engaged =
    A380PrimComputerFctl_B.rudder_2_electric_mode_engaged;
  A380PrimComputerFctl_Y.out.fctl_logic.aileron_droop_active = A380PrimComputerFctl_B.aileron_droop_active;
  A380PrimComputerFctl_Y.out.fctl_logic.aileron_antidroop_active = A380PrimComputerFctl_B.aileron_antidroop_active;
  A380PrimComputerFctl_Y.out.fctl_logic.ths_automatic_mode_active = A380PrimComputerFctl_B.ths_automatic_mode_active;
  A380PrimComputerFctl_Y.out.fctl_logic.ths_manual_mode_c_deg_s = A380PrimComputerFctl_B.ths_manual_mode_c_deg_s;
  A380PrimComputerFctl_Y.out.fctl_logic.is_yellow_hydraulic_power_avail =
    A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.is_green_hydraulic_power_avail =
    A380PrimComputerFctl_B.is_green_hydraulic_power_avail;
  A380PrimComputerFctl_Y.out.fctl_logic.eha_ebha_elec_mode_inhibited =
    A380PrimComputerFctl_B.eha_ebha_elec_mode_inhibited;
  A380PrimComputerFctl_Y.out.fctl_logic.left_sidestick_disabled = A380PrimComputerFctl_B.left_sidestick_disabled;
  A380PrimComputerFctl_Y.out.fctl_logic.right_sidestick_disabled = A380PrimComputerFctl_B.right_sidestick_disabled;
  A380PrimComputerFctl_Y.out.fctl_logic.left_sidestick_priority_locked =
    A380PrimComputerFctl_B.left_sidestick_priority_locked;
  A380PrimComputerFctl_Y.out.fctl_logic.right_sidestick_priority_locked =
    A380PrimComputerFctl_B.right_sidestick_priority_locked;
  A380PrimComputerFctl_Y.out.fctl_logic.total_sidestick_pitch_command =
    A380PrimComputerFctl_B.total_sidestick_pitch_command;
  A380PrimComputerFctl_Y.out.fctl_logic.total_sidestick_roll_command =
    A380PrimComputerFctl_B.total_sidestick_roll_command;
  A380PrimComputerFctl_Y.out.fctl_logic.speed_brake_inhibited = A380PrimComputerFctl_B.speed_brake_inhibited;
  A380PrimComputerFctl_Y.out.fctl_logic.ground_spoilers_armed = A380PrimComputerFctl_B.ground_spoilers_armed;
  A380PrimComputerFctl_Y.out.fctl_logic.ground_spoilers_out = A380PrimComputerFctl_B.ground_spoilers_out;
  A380PrimComputerFctl_Y.out.fctl_logic.phased_lift_dumping_active = A380PrimComputerFctl_B.phased_lift_dumping_active;
  A380PrimComputerFctl_Y.out.fctl_logic.spoiler_lift_active = A380PrimComputerFctl_B.spoiler_lift_active;
  A380PrimComputerFctl_Y.out.fctl_logic.ap_authorised = A380PrimComputerFctl_B.ap_authorised;
  A380PrimComputerFctl_Y.out.fctl_logic.protection_ap_disconnect = A380PrimComputerFctl_B.protection_ap_disconnect;
  A380PrimComputerFctl_Y.out.fctl_logic.high_alpha_prot_active = A380PrimComputerFctl_B.high_alpha_prot_active;
  A380PrimComputerFctl_Y.out.fctl_logic.alpha_prot_deg = A380PrimComputerFctl_B.alpha_prot_deg;
  A380PrimComputerFctl_Y.out.fctl_logic.alpha_max_deg = A380PrimComputerFctl_B.alpha_max_deg;
  A380PrimComputerFctl_Y.out.fctl_logic.high_speed_prot_active = A380PrimComputerFctl_B.high_speed_prot_active;
  A380PrimComputerFctl_Y.out.fctl_logic.high_speed_prot_lo_thresh_kn =
    A380PrimComputerFctl_B.high_speed_prot_lo_thresh_kn;
  A380PrimComputerFctl_Y.out.fctl_logic.high_speed_prot_hi_thresh_kn =
    A380PrimComputerFctl_B.high_speed_prot_hi_thresh_kn;
  A380PrimComputerFctl_Y.out.fg_logic.land_2_capability = A380PrimComputerFctl_B.land_2_capability;
  A380PrimComputerFctl_Y.out.fg_logic.land_3_fail_passive_capability =
    A380PrimComputerFctl_B.land_3_fail_passive_capability;
  A380PrimComputerFctl_Y.out.fg_logic.land_3_fail_op_capability = A380PrimComputerFctl_B.land_3_fail_op_capability;
  A380PrimComputerFctl_Y.out.fg_logic.land_2_inop = A380PrimComputerFctl_B.land_2_inop;
  A380PrimComputerFctl_Y.out.fg_logic.land_3_fail_passive_inop = A380PrimComputerFctl_B.land_3_fail_passive_inop;
  A380PrimComputerFctl_Y.out.fg_logic.land_3_fail_op_inop = A380PrimComputerFctl_B.land_3_fail_op_inop;
  A380PrimComputerFctl_Y.out.discrete_outputs.alignment_dummy = A380PrimComputerFctl_B.alignment_dummy;
  A380PrimComputerFctl_Y.out.discrete_outputs.elevator_1_active_mode = A380PrimComputerFctl_B.elevator_1_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.elevator_2_active_mode = A380PrimComputerFctl_B.elevator_2_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.elevator_3_active_mode = A380PrimComputerFctl_B.elevator_3_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.ths_active_mode = A380PrimComputerFctl_B.ths_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.left_aileron_1_active_mode =
    A380PrimComputerFctl_B.left_aileron_1_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.left_aileron_2_active_mode =
    A380PrimComputerFctl_B.left_aileron_2_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.right_aileron_1_active_mode =
    A380PrimComputerFctl_B.right_aileron_1_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.right_aileron_2_active_mode =
    A380PrimComputerFctl_B.right_aileron_2_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.left_spoiler_electronic_module_enable =
    A380PrimComputerFctl_B.left_spoiler_electronic_module_enable;
  A380PrimComputerFctl_Y.out.discrete_outputs.right_spoiler_electronic_module_enable =
    A380PrimComputerFctl_B.right_spoiler_electronic_module_enable;
  A380PrimComputerFctl_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode =
    A380PrimComputerFctl_B.rudder_1_hydraulic_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.rudder_1_electric_active_mode =
    A380PrimComputerFctl_B.rudder_1_electric_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode =
    A380PrimComputerFctl_B.rudder_2_hydraulic_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.rudder_2_electric_active_mode =
    A380PrimComputerFctl_B.rudder_2_electric_active_mode;
  A380PrimComputerFctl_Y.out.discrete_outputs.prim_healthy = A380PrimComputerFctl_B.prim_healthy;
  A380PrimComputerFctl_Y.out.discrete_outputs.fcu_own_select = A380PrimComputerFctl_B.fcu_own_select;
  A380PrimComputerFctl_Y.out.discrete_outputs.fcu_opp_select = A380PrimComputerFctl_B.fcu_opp_select;
  A380PrimComputerFctl_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputerFctl_B.reverser_tertiary_lock;
  A380PrimComputerFctl_Y.out.analog_outputs.elevator_1_pos_order_deg = A380PrimComputerFctl_B.elevator_1_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.elevator_2_pos_order_deg = A380PrimComputerFctl_B.elevator_2_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.elevator_3_pos_order_deg = A380PrimComputerFctl_B.elevator_3_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputerFctl_B.ths_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.left_aileron_1_pos_order_deg =
    A380PrimComputerFctl_B.left_aileron_1_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.left_aileron_2_pos_order_deg =
    A380PrimComputerFctl_B.left_aileron_2_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.right_aileron_1_pos_order_deg =
    A380PrimComputerFctl_B.right_aileron_1_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.right_aileron_2_pos_order_deg =
    A380PrimComputerFctl_B.right_aileron_2_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.left_spoiler_pos_order_deg =
    A380PrimComputerFctl_B.left_spoiler_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.right_spoiler_pos_order_deg =
    A380PrimComputerFctl_B.right_spoiler_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.rudder_1_pos_order_deg = A380PrimComputerFctl_B.rudder_1_pos_order_deg;
  A380PrimComputerFctl_Y.out.analog_outputs.rudder_2_pos_order_deg = A380PrimComputerFctl_B.rudder_2_pos_order_deg;
  A380PrimComputerFctl_Y.out.bus_outputs.left_inboard_aileron_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0;
  A380PrimComputerFctl_Y.out.bus_outputs.left_inboard_aileron_command_deg.Data = A380PrimComputerFctl_B.Data_ex;
  A380PrimComputerFctl_Y.out.bus_outputs.right_inboard_aileron_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0z;
  A380PrimComputerFctl_Y.out.bus_outputs.right_inboard_aileron_command_deg.Data = A380PrimComputerFctl_B.Data_jo;
  A380PrimComputerFctl_Y.out.bus_outputs.left_midboard_aileron_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0zt;
  A380PrimComputerFctl_Y.out.bus_outputs.left_midboard_aileron_command_deg.Data = A380PrimComputerFctl_B.Data_eb;
  A380PrimComputerFctl_Y.out.bus_outputs.right_midboard_aileron_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0ztg;
  A380PrimComputerFctl_Y.out.bus_outputs.right_midboard_aileron_command_deg.Data = A380PrimComputerFctl_B.Data_a;
  A380PrimComputerFctl_Y.out.bus_outputs.left_outboard_aileron_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0ztgf;
  A380PrimComputerFctl_Y.out.bus_outputs.left_outboard_aileron_command_deg.Data = A380PrimComputerFctl_B.Data_g;
  A380PrimComputerFctl_Y.out.bus_outputs.right_outboard_aileron_command_deg.SSM =
    A380PrimComputerFctl_B.SSM_kxxtac0ztgf2;
  A380PrimComputerFctl_Y.out.bus_outputs.right_outboard_aileron_command_deg.Data = A380PrimComputerFctl_B.Data_i;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_1_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0ztgf2u;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_1_command_deg.Data = A380PrimComputerFctl_B.Data_p;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_1_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0ztgf2ux;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_1_command_deg.Data = A380PrimComputerFctl_B.Data_d;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_2_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac0ztgf2uxn;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_2_command_deg.Data = A380PrimComputerFctl_B.Data_j;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_2_command_deg.SSM = A380PrimComputerFctl_B.SSM_ky;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_2_command_deg.Data = A380PrimComputerFctl_B.Data_e;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_3_command_deg.SSM = A380PrimComputerFctl_B.SSM_d;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_3_command_deg.Data = A380PrimComputerFctl_B.Data_h;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_3_command_deg.SSM = A380PrimComputerFctl_B.SSM_h;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_3_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3epgtdxc;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_4_command_deg.SSM = A380PrimComputerFctl_B.SSM_kb;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_4_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3epgtdx;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_4_command_deg.SSM = A380PrimComputerFctl_B.SSM_p;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_4_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3epgtd;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_5_command_deg.SSM = A380PrimComputerFctl_B.SSM_di;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_5_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3epgt;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_5_command_deg.SSM = A380PrimComputerFctl_B.SSM_j;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_5_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3epg;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_6_command_deg.SSM = A380PrimComputerFctl_B.SSM_i;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_6_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3ep;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_6_command_deg.SSM = A380PrimComputerFctl_B.SSM_g;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_6_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3e;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_7_command_deg.SSM = A380PrimComputerFctl_B.SSM_db;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_7_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc3;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_7_command_deg.SSM = A380PrimComputerFctl_B.SSM_n;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_7_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkftc;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_8_command_deg.SSM = A380PrimComputerFctl_B.SSM_a;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_8_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkft;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_8_command_deg.SSM = A380PrimComputerFctl_B.SSM_ir;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_8_command_deg.Data = A380PrimComputerFctl_B.Data;
  A380PrimComputerFctl_Y.out.bus_outputs.left_inboard_elevator_command_deg.SSM = A380PrimComputerFctl_B.SSM;
  A380PrimComputerFctl_Y.out.bus_outputs.left_inboard_elevator_command_deg.Data = A380PrimComputerFctl_B.Data_fwxkf;
  A380PrimComputerFctl_Y.out.bus_outputs.right_inboard_elevator_command_deg.SSM = A380PrimComputerFctl_B.SSM_k;
  A380PrimComputerFctl_Y.out.bus_outputs.right_inboard_elevator_command_deg.Data = A380PrimComputerFctl_B.Data_fwxk;
  A380PrimComputerFctl_Y.out.bus_outputs.left_outboard_elevator_command_deg.SSM = A380PrimComputerFctl_B.SSM_kx;
  A380PrimComputerFctl_Y.out.bus_outputs.left_outboard_elevator_command_deg.Data = A380PrimComputerFctl_B.Data_fwx;
  A380PrimComputerFctl_Y.out.bus_outputs.right_outboard_elevator_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxx;
  A380PrimComputerFctl_Y.out.bus_outputs.right_outboard_elevator_command_deg.Data = A380PrimComputerFctl_B.Data_fw;
  A380PrimComputerFctl_Y.out.bus_outputs.ths_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxt;
  A380PrimComputerFctl_Y.out.bus_outputs.ths_command_deg.Data = A380PrimComputerFctl_B.Data_f;
  A380PrimComputerFctl_Y.out.bus_outputs.upper_rudder_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxta;
  A380PrimComputerFctl_Y.out.bus_outputs.upper_rudder_command_deg.Data = A380PrimComputerFctl_B.Data_ja;
  A380PrimComputerFctl_Y.out.bus_outputs.lower_rudder_command_deg.SSM = A380PrimComputerFctl_B.SSM_kxxtac;
  A380PrimComputerFctl_Y.out.bus_outputs.lower_rudder_command_deg.Data = A380PrimComputerFctl_B.Data_fd;
  A380PrimComputerFctl_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = A380PrimComputerFctl_B.SSM_hu;
  A380PrimComputerFctl_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = A380PrimComputerFctl_B.Data_o;
  A380PrimComputerFctl_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = A380PrimComputerFctl_B.SSM_e;
  A380PrimComputerFctl_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = A380PrimComputerFctl_B.Data_m;
  A380PrimComputerFctl_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = A380PrimComputerFctl_B.SSM_gr;
  A380PrimComputerFctl_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = A380PrimComputerFctl_B.Data_oq;
  A380PrimComputerFctl_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = A380PrimComputerFctl_B.SSM_ev;
  A380PrimComputerFctl_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = A380PrimComputerFctl_B.Data_fo;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = A380PrimComputerFctl_B.SSM_l;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_pedal_position_deg.Data = A380PrimComputerFctl_B.Data_p1;
  A380PrimComputerFctl_Y.out.bus_outputs.aileron_status_word.SSM = A380PrimComputerFctl_B.SSM_ei;
  A380PrimComputerFctl_Y.out.bus_outputs.aileron_status_word.Data = A380PrimComputerFctl_B.Data_k;
  A380PrimComputerFctl_Y.out.bus_outputs.left_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_an;
  A380PrimComputerFctl_Y.out.bus_outputs.left_aileron_1_position_deg.Data = A380PrimComputerFctl_B.Data_p1y;
  A380PrimComputerFctl_Y.out.bus_outputs.left_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_c;
  A380PrimComputerFctl_Y.out.bus_outputs.left_aileron_2_position_deg.Data = A380PrimComputerFctl_B.Data_l;
  A380PrimComputerFctl_Y.out.bus_outputs.right_aileron_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_cb;
  A380PrimComputerFctl_Y.out.bus_outputs.right_aileron_1_position_deg.Data = A380PrimComputerFctl_B.Data_kp;
  A380PrimComputerFctl_Y.out.bus_outputs.right_aileron_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_lb;
  A380PrimComputerFctl_Y.out.bus_outputs.right_aileron_2_position_deg.Data = A380PrimComputerFctl_B.Data_k0;
  A380PrimComputerFctl_Y.out.bus_outputs.spoiler_status_word.SSM = A380PrimComputerFctl_B.SSM_ia;
  A380PrimComputerFctl_Y.out.bus_outputs.spoiler_status_word.Data = A380PrimComputerFctl_B.Data_joy;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_position_deg.SSM = A380PrimComputerFctl_B.SSM_kyz;
  A380PrimComputerFctl_Y.out.bus_outputs.left_spoiler_position_deg.Data = A380PrimComputerFctl_B.Data_pi;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_position_deg.SSM = A380PrimComputerFctl_B.SSM_as;
  A380PrimComputerFctl_Y.out.bus_outputs.right_spoiler_position_deg.Data = A380PrimComputerFctl_B.Data_dm;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_status_word.SSM = A380PrimComputerFctl_B.SSM_is;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_status_word.Data = A380PrimComputerFctl_B.Data_h3;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_ca;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_1_position_deg.Data = A380PrimComputerFctl_B.Data_f5;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_o;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_2_position_deg.Data = A380PrimComputerFctl_B.Data_js;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_3_position_deg.SSM = A380PrimComputerFctl_B.SSM_ak;
  A380PrimComputerFctl_Y.out.bus_outputs.elevator_3_position_deg.Data = A380PrimComputerFctl_B.Data_ee;
  A380PrimComputerFctl_Y.out.bus_outputs.ths_position_deg.SSM = A380PrimComputerFctl_B.SSM_cbj;
  A380PrimComputerFctl_Y.out.bus_outputs.ths_position_deg.Data = A380PrimComputerFctl_B.Data_ig;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_status_word.SSM = A380PrimComputerFctl_B.SSM_cu;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_status_word.Data = A380PrimComputerFctl_B.Data_a0;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_1_position_deg.SSM = A380PrimComputerFctl_B.SSM_nn;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_1_position_deg.Data = A380PrimComputerFctl_B.Data_mk;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_2_position_deg.SSM = A380PrimComputerFctl_B.SSM_b;
  A380PrimComputerFctl_Y.out.bus_outputs.rudder_2_position_deg.Data = A380PrimComputerFctl_B.Data_pu;
  A380PrimComputerFctl_Y.out.bus_outputs.radio_height_1_ft.SSM = A380PrimComputerFctl_B.SSM_m0;
  A380PrimComputerFctl_Y.out.bus_outputs.radio_height_1_ft.Data = A380PrimComputerFctl_B.Data_lyw;
  A380PrimComputerFctl_Y.out.bus_outputs.radio_height_2_ft.SSM = A380PrimComputerFctl_B.SSM_pu;
  A380PrimComputerFctl_Y.out.bus_outputs.radio_height_2_ft.Data = A380PrimComputerFctl_B.Data_gq;
  A380PrimComputerFctl_Y.out.bus_outputs.fctl_law_status_word.SSM = A380PrimComputerFctl_B.SSM_m;
  A380PrimComputerFctl_Y.out.bus_outputs.fctl_law_status_word.Data = A380PrimComputerFctl_B.Data_b;
  A380PrimComputerFctl_Y.out.bus_outputs.discrete_status_word_1.SSM = A380PrimComputerFctl_B.SSM_f;
  A380PrimComputerFctl_Y.out.bus_outputs.discrete_status_word_1.Data = A380PrimComputerFctl_B.Data_eq;
  A380PrimComputerFctl_Y.out.bus_outputs.fe_status_word.SSM = A380PrimComputerFctl_B.SSM_bp;
  A380PrimComputerFctl_Y.out.bus_outputs.fe_status_word.Data = A380PrimComputerFctl_B.Data_iz;
  A380PrimComputerFctl_Y.out.bus_outputs.fg_status_word.SSM = A380PrimComputerFctl_B.SSM_hb;
  A380PrimComputerFctl_Y.out.bus_outputs.fg_status_word.Data = A380PrimComputerFctl_B.Data_j2;
}

void A380PrimComputerFctl::initialize()
{
  A380PrimComputerFctl_DWork.Memory_PreviousInput = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition;
  A380PrimComputerFctl_DWork.Delay1_DSTATE = A380PrimComputerFctl_P.Delay1_InitialCondition;
  A380PrimComputerFctl_DWork.Delay2_DSTATE = A380PrimComputerFctl_P.Delay2_InitialCondition;
  A380PrimComputerFctl_DWork.Delay3_DSTATE = A380PrimComputerFctl_P.Delay3_InitialCondition;
  A380PrimComputerFctl_DWork.Delay_DSTATE_c = A380PrimComputerFctl_P.Delay_InitialCondition;
  A380PrimComputerFctl_DWork.Delay1_DSTATE_n = A380PrimComputerFctl_P.Delay1_InitialCondition_b;
  A380PrimComputerFctl_DWork.Memory_PreviousInput_g = A380PrimComputerFctl_P.SRFlipFlop_initial_condition;
  A380PrimComputerFctl_DWork.Delay_DSTATE_e = A380PrimComputerFctl_P.Delay_InitialCondition_o;
  A380PrimComputerFctl_DWork.Memory_PreviousInput_d = A380PrimComputerFctl_P.SRFlipFlop1_initial_condition_i;
  A380PrimComputerFctl_DWork.Memory_PreviousInput_j = A380PrimComputerFctl_P.SRFlipFlop_initial_condition_i;
  A380PrimComputerFctl_DWork.Delay_DSTATE = A380PrimComputerFctl_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380PrimComputerFctl_DWork.icLoad = true;
  LawMDLOBJ2.init();
  A380PrimComputerFctl_TransportDelay_Init(&A380PrimComputerFctl_DWork.sf_TransportDelay_c);
  A380PrimComputerFctl_TransportDelay_Init(&A380PrimComputerFctl_DWork.sf_TransportDelay);
  LawMDLOBJ5.init();
  LawMDLOBJ3.init();
  A380PrimComputerFctl_B.dt = A380PrimComputerFctl_P.out_Y0.data.time.dt;
  A380PrimComputerFctl_B.simulation_time = A380PrimComputerFctl_P.out_Y0.data.time.simulation_time;
  A380PrimComputerFctl_B.monotonic_time = A380PrimComputerFctl_P.out_Y0.data.time.monotonic_time;
  A380PrimComputerFctl_B.slew_on = A380PrimComputerFctl_P.out_Y0.data.sim_data.slew_on;
  A380PrimComputerFctl_B.pause_on = A380PrimComputerFctl_P.out_Y0.data.sim_data.pause_on;
  A380PrimComputerFctl_B.tracking_mode_on_override =
    A380PrimComputerFctl_P.out_Y0.data.sim_data.tracking_mode_on_override;
  A380PrimComputerFctl_B.tailstrike_protection_on = A380PrimComputerFctl_P.out_Y0.data.sim_data.tailstrike_protection_on;
  A380PrimComputerFctl_B.computer_running = A380PrimComputerFctl_P.out_Y0.data.sim_data.computer_running;
  A380PrimComputerFctl_B.alignment_dummy_h = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.alignment_dummy;
  A380PrimComputerFctl_B.prim_overhead_button_pressed =
    A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.prim_overhead_button_pressed;
  A380PrimComputerFctl_B.is_unit_1 = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.is_unit_1;
  A380PrimComputerFctl_B.is_unit_2 = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.is_unit_2;
  A380PrimComputerFctl_B.is_unit_3 = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.is_unit_3;
  A380PrimComputerFctl_B.capt_priority_takeover_pressed =
    A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.capt_priority_takeover_pressed;
  A380PrimComputerFctl_B.fo_priority_takeover_pressed =
    A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.fo_priority_takeover_pressed;
  A380PrimComputerFctl_B.ap_1_pushbutton_pressed =
    A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.ap_1_pushbutton_pressed;
  A380PrimComputerFctl_B.ap_2_pushbutton_pressed =
    A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.ap_2_pushbutton_pressed;
  A380PrimComputerFctl_B.fcu_healthy = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.fcu_healthy;
  A380PrimComputerFctl_B.athr_pushbutton = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.athr_pushbutton;
  A380PrimComputerFctl_B.ir_3_on_capt = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.ir_3_on_capt;
  A380PrimComputerFctl_B.ir_3_on_fo = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.ir_3_on_fo;
  A380PrimComputerFctl_B.adr_3_on_capt = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.adr_3_on_capt;
  A380PrimComputerFctl_B.adr_3_on_fo = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.adr_3_on_fo;
  A380PrimComputerFctl_B.rat_deployed = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.rat_deployed;
  A380PrimComputerFctl_B.rat_contactor_closed = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.rat_contactor_closed;
  A380PrimComputerFctl_B.pitch_trim_up_pressed =
    A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.pitch_trim_up_pressed;
  A380PrimComputerFctl_B.pitch_trim_down_pressed =
    A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.pitch_trim_down_pressed;
  A380PrimComputerFctl_B.green_low_pressure = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.green_low_pressure;
  A380PrimComputerFctl_B.yellow_low_pressure = A380PrimComputerFctl_P.out_Y0.data.discrete_inputs.yellow_low_pressure;
  A380PrimComputerFctl_B.capt_pitch_stick_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.capt_pitch_stick_pos;
  A380PrimComputerFctl_B.fo_pitch_stick_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.fo_pitch_stick_pos;
  A380PrimComputerFctl_B.capt_roll_stick_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.capt_roll_stick_pos;
  A380PrimComputerFctl_B.fo_roll_stick_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.fo_roll_stick_pos;
  A380PrimComputerFctl_B.speed_brake_lever_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.speed_brake_lever_pos;
  A380PrimComputerFctl_B.thr_lever_1_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.thr_lever_1_pos;
  A380PrimComputerFctl_B.thr_lever_2_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.thr_lever_2_pos;
  A380PrimComputerFctl_B.thr_lever_3_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.thr_lever_3_pos;
  A380PrimComputerFctl_B.thr_lever_4_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.thr_lever_4_pos;
  A380PrimComputerFctl_B.elevator_1_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.elevator_1_pos_deg;
  A380PrimComputerFctl_B.elevator_2_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.elevator_2_pos_deg;
  A380PrimComputerFctl_B.elevator_3_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.elevator_3_pos_deg;
  A380PrimComputerFctl_B.ths_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.ths_pos_deg;
  A380PrimComputerFctl_B.left_aileron_1_pos_deg =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.left_aileron_1_pos_deg;
  A380PrimComputerFctl_B.left_aileron_2_pos_deg =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.left_aileron_2_pos_deg;
  A380PrimComputerFctl_B.right_aileron_1_pos_deg =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.right_aileron_1_pos_deg;
  A380PrimComputerFctl_B.right_aileron_2_pos_deg =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.right_aileron_2_pos_deg;
  A380PrimComputerFctl_B.left_spoiler_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.left_spoiler_pos_deg;
  A380PrimComputerFctl_B.right_spoiler_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.right_spoiler_pos_deg;
  A380PrimComputerFctl_B.rudder_1_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.rudder_1_pos_deg;
  A380PrimComputerFctl_B.rudder_2_pos_deg = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.rudder_2_pos_deg;
  A380PrimComputerFctl_B.rudder_pedal_pos = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.rudder_pedal_pos;
  A380PrimComputerFctl_B.yellow_hyd_pressure_psi =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.yellow_hyd_pressure_psi;
  A380PrimComputerFctl_B.green_hyd_pressure_psi =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.green_hyd_pressure_psi;
  A380PrimComputerFctl_B.vert_acc_1_g = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.vert_acc_1_g;
  A380PrimComputerFctl_B.vert_acc_2_g = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.vert_acc_2_g;
  A380PrimComputerFctl_B.vert_acc_3_g = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.vert_acc_3_g;
  A380PrimComputerFctl_B.lat_acc_1_g = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.lat_acc_1_g;
  A380PrimComputerFctl_B.lat_acc_2_g = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.lat_acc_2_g;
  A380PrimComputerFctl_B.lat_acc_3_g = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.lat_acc_3_g;
  A380PrimComputerFctl_B.left_body_wheel_speed = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.left_body_wheel_speed;
  A380PrimComputerFctl_B.left_wing_wheel_speed = A380PrimComputerFctl_P.out_Y0.data.analog_inputs.left_wing_wheel_speed;
  A380PrimComputerFctl_B.right_body_wheel_speed =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.right_body_wheel_speed;
  A380PrimComputerFctl_B.right_wing_wheel_speed =
    A380PrimComputerFctl_P.out_Y0.data.analog_inputs.right_wing_wheel_speed;
  A380PrimComputerFctl_B.SSM_mw = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
  A380PrimComputerFctl_B.Data_gsl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
  A380PrimComputerFctl_B.SSM_d50 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
  A380PrimComputerFctl_B.Data_i0 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
  A380PrimComputerFctl_B.SSM_dd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.mach.SSM;
  A380PrimComputerFctl_B.Data_f52 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.mach.Data;
  A380PrimComputerFctl_B.SSM_o2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFctl_B.Data_hyo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
  A380PrimComputerFctl_B.SSM_en3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
  A380PrimComputerFctl_B.Data_oi = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
  A380PrimComputerFctl_B.SSM_gt = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFctl_B.Data_aei = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFctl_B.SSM_cum = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFctl_B.Data_jz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
  A380PrimComputerFctl_B.SSM_ka =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFctl_B.Data_pwfb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFctl_B.SSM_lu = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
  A380PrimComputerFctl_B.Data_la = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
  A380PrimComputerFctl_B.SSM_c5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
  A380PrimComputerFctl_B.Data_b0 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
  A380PrimComputerFctl_B.SSM_ol = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.mach.SSM;
  A380PrimComputerFctl_B.Data_g5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.mach.Data;
  A380PrimComputerFctl_B.SSM_k2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFctl_B.Data_os = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
  A380PrimComputerFctl_B.SSM_gn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
  A380PrimComputerFctl_B.Data_btc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
  A380PrimComputerFctl_B.SSM_bdi = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFctl_B.Data_nhn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFctl_B.SSM_lil = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFctl_B.Data_im = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
  A380PrimComputerFctl_B.SSM_lmv =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFctl_B.Data_no =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFctl_B.SSM_ig = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
  A380PrimComputerFctl_B.Data_av = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
  A380PrimComputerFctl_B.SSM_ch = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
  A380PrimComputerFctl_B.Data_me = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
  A380PrimComputerFctl_B.SSM_gz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.mach.SSM;
  A380PrimComputerFctl_B.Data_ly = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.mach.Data;
  A380PrimComputerFctl_B.SSM_pv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
  A380PrimComputerFctl_B.Data_jq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
  A380PrimComputerFctl_B.SSM_mf = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
  A380PrimComputerFctl_B.Data_o5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
  A380PrimComputerFctl_B.SSM_kd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
  A380PrimComputerFctl_B.Data_n = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
  A380PrimComputerFctl_B.SSM_nv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
  A380PrimComputerFctl_B.Data_bq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
  A380PrimComputerFctl_B.SSM_d5 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
  A380PrimComputerFctl_B.Data_dmn =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
  A380PrimComputerFctl_B.SSM_eo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
  A380PrimComputerFctl_B.Data_jn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
  A380PrimComputerFctl_B.SSM_nd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
  A380PrimComputerFctl_B.Data_c = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.Data;
  A380PrimComputerFctl_B.SSM_bq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
  A380PrimComputerFctl_B.Data_lx = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.Data;
  A380PrimComputerFctl_B.SSM_hi = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
  A380PrimComputerFctl_B.Data_jb = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
  A380PrimComputerFctl_B.SSM_mm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
  A380PrimComputerFctl_B.Data_fn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
  A380PrimComputerFctl_B.SSM_kz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
  A380PrimComputerFctl_B.Data_od = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
  A380PrimComputerFctl_B.SSM_il = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
  A380PrimComputerFctl_B.Data_ez = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
  A380PrimComputerFctl_B.SSM_i2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFctl_B.Data_pw = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
  A380PrimComputerFctl_B.SSM_ah = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFctl_B.Data_m2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFctl_B.SSM_en = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFctl_B.Data_ek = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
  A380PrimComputerFctl_B.SSM_dq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_iy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_px = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_lk = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_lbo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
  A380PrimComputerFctl_B.Data_ca = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
  A380PrimComputerFctl_B.SSM_p5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_pix = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_mk = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_di = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_mu = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_lz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_cbl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_lu = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_gzd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_dc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_mo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
  A380PrimComputerFctl_B.Data_gc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
  A380PrimComputerFctl_B.SSM_me = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
  A380PrimComputerFctl_B.Data_am = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
  A380PrimComputerFctl_B.SSM_mj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
  A380PrimComputerFctl_B.Data_mo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  A380PrimComputerFctl_B.SSM_a5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_dg = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_bt = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_e1 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_om = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_fp = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_ar = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
  A380PrimComputerFctl_B.Data_ns = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
  A380PrimComputerFctl_B.SSM_ce = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFctl_B.Data_m3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFctl_B.SSM_ed = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFctl_B.Data_oj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFctl_B.SSM_jh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
  A380PrimComputerFctl_B.Data_jy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
  A380PrimComputerFctl_B.SSM_je =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFctl_B.Data_j1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFctl_B.SSM_jt = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFctl_B.Data_fc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
  A380PrimComputerFctl_B.SSM_cui = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFctl_B.Data_of = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
  A380PrimComputerFctl_B.SSM_mq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
  A380PrimComputerFctl_B.Data_lg = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
  A380PrimComputerFctl_B.SSM_ni = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
  A380PrimComputerFctl_B.Data_n4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.Data;
  A380PrimComputerFctl_B.SSM_df = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
  A380PrimComputerFctl_B.Data_ot = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.Data;
  A380PrimComputerFctl_B.SSM_oe = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
  A380PrimComputerFctl_B.Data_gv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
  A380PrimComputerFctl_B.SSM_ha = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
  A380PrimComputerFctl_B.Data_ou = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
  A380PrimComputerFctl_B.SSM_op = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
  A380PrimComputerFctl_B.Data_dh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
  A380PrimComputerFctl_B.SSM_a50 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
  A380PrimComputerFctl_B.Data_ph = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
  A380PrimComputerFctl_B.SSM_og = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFctl_B.Data_gs = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
  A380PrimComputerFctl_B.SSM_a4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFctl_B.Data_fd4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFctl_B.SSM_bv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFctl_B.Data_hm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
  A380PrimComputerFctl_B.SSM_bo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_i2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_d1 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_og = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_hy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
  A380PrimComputerFctl_B.Data_fv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
  A380PrimComputerFctl_B.SSM_gi = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_oc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_pp = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_kq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_iab = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_ne = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_jtv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_it = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_fy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_ch = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_d4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
  A380PrimComputerFctl_B.Data_bb = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
  A380PrimComputerFctl_B.SSM_ars = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
  A380PrimComputerFctl_B.Data_ol = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
  A380PrimComputerFctl_B.SSM_din = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
  A380PrimComputerFctl_B.Data_hw = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
  A380PrimComputerFctl_B.SSM_m3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_hs = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_np = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_fj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_ax = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_ky = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_cl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
  A380PrimComputerFctl_B.Data_h5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
  A380PrimComputerFctl_B.SSM_es = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFctl_B.Data_ku = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFctl_B.SSM_gi1 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFctl_B.Data_jp = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFctl_B.SSM_jz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
  A380PrimComputerFctl_B.Data_nu = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
  A380PrimComputerFctl_B.SSM_kt =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFctl_B.Data_br =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFctl_B.SSM_ds = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFctl_B.Data_ae = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
  A380PrimComputerFctl_B.SSM_eg = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFctl_B.Data_pe = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
  A380PrimComputerFctl_B.SSM_a0 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
  A380PrimComputerFctl_B.Data_fy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
  A380PrimComputerFctl_B.SSM_cv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
  A380PrimComputerFctl_B.Data_na = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.Data;
  A380PrimComputerFctl_B.SSM_ea = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
  A380PrimComputerFctl_B.Data_my = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.Data;
  A380PrimComputerFctl_B.SSM_p4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
  A380PrimComputerFctl_B.Data_i4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
  A380PrimComputerFctl_B.SSM_m2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
  A380PrimComputerFctl_B.Data_cx = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
  A380PrimComputerFctl_B.SSM_bt0 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
  A380PrimComputerFctl_B.Data_nz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
  A380PrimComputerFctl_B.SSM_nr = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
  A380PrimComputerFctl_B.Data_id = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
  A380PrimComputerFctl_B.SSM_fr = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
  A380PrimComputerFctl_B.Data_o2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
  A380PrimComputerFctl_B.SSM_cc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputerFctl_B.Data_gqq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
  A380PrimComputerFctl_B.SSM_lm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
  A380PrimComputerFctl_B.Data_md = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
  A380PrimComputerFctl_B.SSM_mkm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_cz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_jhd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_pm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_av = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
  A380PrimComputerFctl_B.Data_bj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
  A380PrimComputerFctl_B.SSM_ira = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_ox = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_ge = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
  A380PrimComputerFctl_B.Data_pe5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
  A380PrimComputerFctl_B.SSM_lv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_jj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_cg = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_p5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_be = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_ekl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_axb = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
  A380PrimComputerFctl_B.Data_nd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
  A380PrimComputerFctl_B.SSM_nz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
  A380PrimComputerFctl_B.Data_n2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
  A380PrimComputerFctl_B.SSM_cx = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
  A380PrimComputerFctl_B.Data_dl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
  A380PrimComputerFctl_B.SSM_gh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_gs2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_ks = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_h4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_pw = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputerFctl_B.Data_e3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
  A380PrimComputerFctl_B.SSM_fh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
  A380PrimComputerFctl_B.Data_f5h = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
  A380PrimComputerFctl_B.SSM_gzn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputerFctl_B.Data_an = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
  A380PrimComputerFctl_B.SSM_oo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputerFctl_B.Data_i4o = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputerFctl_B.SSM_evh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
  A380PrimComputerFctl_B.Data_af = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
  A380PrimComputerFctl_B.SSM_cn =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputerFctl_B.Data_bm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputerFctl_B.SSM_co = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
  A380PrimComputerFctl_B.Data_dk = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
  A380PrimComputerFctl_B.SSM_pe = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
  A380PrimComputerFctl_B.Data_nv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
  A380PrimComputerFctl_B.isis_1_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.isis_1_bus;
  A380PrimComputerFctl_B.isis_2_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.isis_2_bus;
  A380PrimComputerFctl_B.rate_gyro_pitch_1_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.rate_gyro_pitch_1_bus;
  A380PrimComputerFctl_B.rate_gyro_pitch_2_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.rate_gyro_pitch_2_bus;
  A380PrimComputerFctl_B.rate_gyro_roll_1_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.rate_gyro_roll_1_bus;
  A380PrimComputerFctl_B.rate_gyro_roll_2_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.rate_gyro_roll_2_bus;
  A380PrimComputerFctl_B.rate_gyro_yaw_1_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.rate_gyro_yaw_1_bus;
  A380PrimComputerFctl_B.rate_gyro_yaw_2_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.rate_gyro_yaw_2_bus;
  A380PrimComputerFctl_B.SSM_cgz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
  A380PrimComputerFctl_B.Data_jpf = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
  A380PrimComputerFctl_B.SSM_fw = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
  A380PrimComputerFctl_B.Data_i5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
  A380PrimComputerFctl_B.SSM_h4 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
  A380PrimComputerFctl_B.Data_k2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
  A380PrimComputerFctl_B.SSM_cb3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
  A380PrimComputerFctl_B.Data_as =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
  A380PrimComputerFctl_B.SSM_pj =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputerFctl_B.Data_gk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
  A380PrimComputerFctl_B.SSM_dv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
  A380PrimComputerFctl_B.Data_jl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
  A380PrimComputerFctl_B.SSM_i4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
  A380PrimComputerFctl_B.Data_e32 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
  A380PrimComputerFctl_B.SSM_fm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
  A380PrimComputerFctl_B.Data_ih =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
  A380PrimComputerFctl_B.SSM_e5 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
  A380PrimComputerFctl_B.Data_du =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
  A380PrimComputerFctl_B.SSM_bf =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputerFctl_B.Data_nx =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
  A380PrimComputerFctl_B.SSM_fd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
  A380PrimComputerFctl_B.Data_n0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
  A380PrimComputerFctl_B.SSM_fv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
  A380PrimComputerFctl_B.Data_eqi =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
  A380PrimComputerFctl_B.SSM_dt = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.SSM;
  A380PrimComputerFctl_B.Data_om = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_1.Data;
  A380PrimComputerFctl_B.SSM_j5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.SSM;
  A380PrimComputerFctl_B.Data_nr = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_2.Data;
  A380PrimComputerFctl_B.SSM_ng = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.SSM;
  A380PrimComputerFctl_B.Data_p3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_3.Data;
  A380PrimComputerFctl_B.SSM_cs = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.SSM;
  A380PrimComputerFctl_B.Data_nb = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_1_bus.discrete_word_4.Data;
  A380PrimComputerFctl_B.SSM_ls = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.SSM;
  A380PrimComputerFctl_B.Data_hd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_1.Data;
  A380PrimComputerFctl_B.SSM_dg = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.SSM;
  A380PrimComputerFctl_B.Data_al = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_2.Data;
  A380PrimComputerFctl_B.SSM_d3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.SSM;
  A380PrimComputerFctl_B.Data_gu = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_3.Data;
  A380PrimComputerFctl_B.SSM_p2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.SSM;
  A380PrimComputerFctl_B.Data_ix = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.lgciu_2_bus.discrete_word_4.Data;
  A380PrimComputerFctl_B.irdc_1_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.irdc_1_bus;
  A380PrimComputerFctl_B.irdc_2_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.irdc_2_bus;
  A380PrimComputerFctl_B.irdc_3_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.irdc_3_bus;
  A380PrimComputerFctl_B.irdc_4_a_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.irdc_4_a_bus;
  A380PrimComputerFctl_B.irdc_4_b_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.irdc_4_b_bus;
  A380PrimComputerFctl_B.fcu_own_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.fcu_own_bus;
  A380PrimComputerFctl_B.fcu_opp_bus = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.fcu_opp_bus;
  A380PrimComputerFctl_B.SSM_bo0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_do =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_bc =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_hu =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_h0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_pm1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_giz =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_i2y =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_mqp =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_pg =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ba =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ni =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_in =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fr =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ff =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFctl_B.Data_cn =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ic =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFctl_B.Data_nxl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
  A380PrimComputerFctl_B.SSM_fs =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFctl_B.Data_jh =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ja =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
  A380PrimComputerFctl_B.SSM_js =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gn =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
  A380PrimComputerFctl_B.SSM_is3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFctl_B.Data_myb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ag =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFctl_B.Data_l2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
  A380PrimComputerFctl_B.SSM_f5 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFctl_B.Data_o5o =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ph =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFctl_B.Data_l5 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
  A380PrimComputerFctl_B.SSM_jw =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFctl_B.Data_dc2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
  A380PrimComputerFctl_B.SSM_jy =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gr =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
  A380PrimComputerFctl_B.SSM_j1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gp =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ov =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFctl_B.Data_i3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
  A380PrimComputerFctl_B.SSM_mx =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFctl_B.Data_et =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
  A380PrimComputerFctl_B.SSM_b4 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFctl_B.Data_mc =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
  A380PrimComputerFctl_B.SSM_gb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_k3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_oh =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_f2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_mm5 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gh =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_br =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ed =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_c2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.ths_command_deg.SSM;
  A380PrimComputerFctl_B.Data_o2j = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.ths_command_deg.Data;
  A380PrimComputerFctl_B.SSM_hc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.SSM;
  A380PrimComputerFctl_B.Data_i43 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ktr = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ic =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
  A380PrimComputerFctl_B.SSM_gl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ak =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_my =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_jg =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_j3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_cu =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_go =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ep =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_e5c =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFctl_B.Data_d3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFctl_B.SSM_dk = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.aileron_status_word.SSM;
  A380PrimComputerFctl_B.Data_bt = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.aileron_status_word.Data;
  A380PrimComputerFctl_B.SSM_evc =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_e0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_kk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_jl3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_af =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_nm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_npr =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ia =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ew = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.spoiler_status_word.SSM;
  A380PrimComputerFctl_B.Data_j0 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.spoiler_status_word.Data;
  A380PrimComputerFctl_B.SSM_lt = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.SSM;
  A380PrimComputerFctl_B.Data_bs =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ger =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.SSM;
  A380PrimComputerFctl_B.Data_hp =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
  A380PrimComputerFctl_B.SSM_pxo = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_status_word.SSM;
  A380PrimComputerFctl_B.Data_ct = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_status_word.Data;
  A380PrimComputerFctl_B.SSM_co2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_pc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ny = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_nzt =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_l4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFctl_B.Data_c0 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
  A380PrimComputerFctl_B.SSM_nm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.ths_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ojg = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.ths_position_deg.Data;
  A380PrimComputerFctl_B.SSM_nh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_status_word.SSM;
  A380PrimComputerFctl_B.Data_lm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_status_word.Data;
  A380PrimComputerFctl_B.SSM_dl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_fz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_dx = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_oz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_a5h = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.radio_height_1_ft.SSM;
  A380PrimComputerFctl_B.Data_gf = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.radio_height_1_ft.Data;
  A380PrimComputerFctl_B.SSM_fl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.radio_height_2_ft.SSM;
  A380PrimComputerFctl_B.Data_nn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.radio_height_2_ft.Data;
  A380PrimComputerFctl_B.SSM_p3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.fctl_law_status_word.SSM;
  A380PrimComputerFctl_B.Data_a0z = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.fctl_law_status_word.Data;
  A380PrimComputerFctl_B.SSM_ns = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.discrete_status_word_1.SSM;
  A380PrimComputerFctl_B.Data_fk = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.discrete_status_word_1.Data;
  A380PrimComputerFctl_B.SSM_bm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.fe_status_word.SSM;
  A380PrimComputerFctl_B.Data_bu = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.fe_status_word.Data;
  A380PrimComputerFctl_B.SSM_nl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.fg_status_word.SSM;
  A380PrimComputerFctl_B.Data_o23 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_x_bus.fg_status_word.Data;
  A380PrimComputerFctl_B.SSM_grm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_g3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_gzm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_icc =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_oi =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_pwf =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_aa =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gvk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_fvk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ln =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_lw =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ka =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_fa =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFctl_B.Data_mp =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
  A380PrimComputerFctl_B.SSM_lbx =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFctl_B.Data_m4 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
  A380PrimComputerFctl_B.SSM_n3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fki =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
  A380PrimComputerFctl_B.SSM_a1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFctl_B.Data_bv =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
  A380PrimComputerFctl_B.SSM_p1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFctl_B.Data_m21 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
  A380PrimComputerFctl_B.SSM_cn2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFctl_B.Data_nbg =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
  A380PrimComputerFctl_B.SSM_an3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFctl_B.Data_l25 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
  A380PrimComputerFctl_B.SSM_c3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ki =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
  A380PrimComputerFctl_B.SSM_dp =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFctl_B.Data_p5p =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
  A380PrimComputerFctl_B.SSM_boy =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFctl_B.Data_nry =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
  A380PrimComputerFctl_B.SSM_lg =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFctl_B.Data_mh =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
  A380PrimComputerFctl_B.SSM_cm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ll =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
  A380PrimComputerFctl_B.SSM_hl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFctl_B.Data_hy =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
  A380PrimComputerFctl_B.SSM_irh =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFctl_B.Data_j04 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
  A380PrimComputerFctl_B.SSM_b42 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFctl_B.Data_pf =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
  A380PrimComputerFctl_B.SSM_anz =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFctl_B.Data_pl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
  A380PrimComputerFctl_B.SSM_d2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_gov =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_hq =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_nb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ai =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_pe3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gfr =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_jj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.ths_command_deg.SSM;
  A380PrimComputerFctl_B.Data_czp = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.ths_command_deg.Data;
  A380PrimComputerFctl_B.SSM_jx = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
  A380PrimComputerFctl_B.SSM_npl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.SSM;
  A380PrimComputerFctl_B.Data_jsg =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
  A380PrimComputerFctl_B.SSM_gf =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_g1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_gbi =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_j4 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_fhm =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_jyh =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ltj =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_e4 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_hn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ghs =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFctl_B.SSM_h3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.aileron_status_word.SSM;
  A380PrimComputerFctl_B.Data_bmk = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.aileron_status_word.Data;
  A380PrimComputerFctl_B.SSM_bfs =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_lzt =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_p0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_kn =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_fu =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_nab =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_hr =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_lgf =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_bi = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.spoiler_status_word.SSM;
  A380PrimComputerFctl_B.Data_fpq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.spoiler_status_word.Data;
  A380PrimComputerFctl_B.SSM_bd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.SSM;
  A380PrimComputerFctl_B.Data_dt =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
  A380PrimComputerFctl_B.SSM_omt =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.SSM;
  A380PrimComputerFctl_B.Data_b1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
  A380PrimComputerFctl_B.SSM_la = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_status_word.SSM;
  A380PrimComputerFctl_B.Data_nmr = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_status_word.Data;
  A380PrimComputerFctl_B.SSM_l1 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ea = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_dy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_nib =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ie = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFctl_B.Data_i2t =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_3_position_deg.Data;
  A380PrimComputerFctl_B.SSM_kf = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.ths_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ng = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.ths_position_deg.Data;
  A380PrimComputerFctl_B.SSM_p5l = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_status_word.SSM;
  A380PrimComputerFctl_B.Data_h31 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_status_word.Data;
  A380PrimComputerFctl_B.SSM_g3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ew = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_b3 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_j1s = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_dxv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.radio_height_1_ft.SSM;
  A380PrimComputerFctl_B.Data_j5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.radio_height_1_ft.Data;
  A380PrimComputerFctl_B.SSM_mxz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.radio_height_2_ft.SSM;
  A380PrimComputerFctl_B.Data_cw = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.radio_height_2_ft.Data;
  A380PrimComputerFctl_B.SSM_kk4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.fctl_law_status_word.SSM;
  A380PrimComputerFctl_B.Data_gqa = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.fctl_law_status_word.Data;
  A380PrimComputerFctl_B.SSM_cy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.discrete_status_word_1.SSM;
  A380PrimComputerFctl_B.Data_hz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.discrete_status_word_1.Data;
  A380PrimComputerFctl_B.SSM_ju = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.fe_status_word.SSM;
  A380PrimComputerFctl_B.Data_fri = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.fe_status_word.Data;
  A380PrimComputerFctl_B.SSM_ey = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.fg_status_word.SSM;
  A380PrimComputerFctl_B.Data_cm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.prim_y_bus.fg_status_word.Data;
  A380PrimComputerFctl_B.SSM_jr =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_czj =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_hs =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_mb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_mx3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gk4 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_er =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_gbt =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_hm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFctl_B.Data_p0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFctl_B.SSM_dm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.aileron_status_word.SSM;
  A380PrimComputerFctl_B.Data_dn = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.aileron_status_word.Data;
  A380PrimComputerFctl_B.SSM_fk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_iyw =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_lm1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_p5d =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_nc =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_oo =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_e4 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ho =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_bw = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.spoiler_status_word.SSM;
  A380PrimComputerFctl_B.Data_kqr = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.spoiler_status_word.Data;
  A380PrimComputerFctl_B.SSM_na =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_omv =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_lf =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_mby =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_oz =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_hk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_mub =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_hg =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_li = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_status_word.SSM;
  A380PrimComputerFctl_B.Data_bi = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_status_word.Data;
  A380PrimComputerFctl_B.SSM_hcd = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_i4u = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_php = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ik = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ma = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFctl_B.Data_dq = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.elevator_3_position_deg.Data;
  A380PrimComputerFctl_B.SSM_jut = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.ths_position_deg.SSM;
  A380PrimComputerFctl_B.Data_pv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.ths_position_deg.Data;
  A380PrimComputerFctl_B.SSM_kh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_status_word.SSM;
  A380PrimComputerFctl_B.Data_p1d = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_status_word.Data;
  A380PrimComputerFctl_B.SSM_h2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_lyv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ago = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ke = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ep = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFctl_B.Data_cv =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFctl_B.SSM_kc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.fctl_law_status_word.SSM;
  A380PrimComputerFctl_B.Data_pfh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.fctl_law_status_word.Data;
  A380PrimComputerFctl_B.SSM_cnf = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.misc_data_status_word.SSM;
  A380PrimComputerFctl_B.Data_jy4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_1_bus.misc_data_status_word.Data;
  A380PrimComputerFctl_B.SSM_lwa =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_o1 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_aq =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ga =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ja2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_kd =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_in3 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fx =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ap = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFctl_B.Data_nml =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFctl_B.SSM_mg = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.aileron_status_word.SSM;
  A380PrimComputerFctl_B.Data_fa = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.aileron_status_word.Data;
  A380PrimComputerFctl_B.SSM_bu =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_nh =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_cbb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_or =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_iao =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_otn =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ip =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_cam =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_f4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.spoiler_status_word.SSM;
  A380PrimComputerFctl_B.Data_amp = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.spoiler_status_word.Data;
  A380PrimComputerFctl_B.SSM_id =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_mv =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_mqr =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_gx =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_cm2 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_lb =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ck =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_can =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_pl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_status_word.SSM;
  A380PrimComputerFctl_B.Data_gae = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_status_word.Data;
  A380PrimComputerFctl_B.SSM_gs = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_h1 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_kse = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_bc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_icj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFctl_B.Data_fof = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.elevator_3_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ds4 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.ths_position_deg.SSM;
  A380PrimComputerFctl_B.Data_nj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.ths_position_deg.Data;
  A380PrimComputerFctl_B.SSM_gbf = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_status_word.SSM;
  A380PrimComputerFctl_B.Data_lr = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_status_word.Data;
  A380PrimComputerFctl_B.SSM_opv = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_k0s = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_gha = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_m4b = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ple =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFctl_B.Data_e3r =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFctl_B.SSM_h0n = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.fctl_law_status_word.SSM;
  A380PrimComputerFctl_B.Data_au = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.fctl_law_status_word.Data;
  A380PrimComputerFctl_B.SSM_c1 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.misc_data_status_word.SSM;
  A380PrimComputerFctl_B.Data_czc = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_2_bus.misc_data_status_word.Data;
  A380PrimComputerFctl_B.SSM_ai =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_itz =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_at =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_nsk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_bz =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_is =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_n0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_pk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_haz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputerFctl_B.Data_dg0 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_pedal_position_deg.Data;
  A380PrimComputerFctl_B.SSM_hz = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.aileron_status_word.SSM;
  A380PrimComputerFctl_B.Data_nru = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.aileron_status_word.Data;
  A380PrimComputerFctl_B.SSM_hk =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_d5 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_cvn =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_oa =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_iy =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_bp =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_jwz =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_cl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_eig = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.spoiler_status_word.SSM;
  A380PrimComputerFctl_B.Data_er = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.spoiler_status_word.Data;
  A380PrimComputerFctl_B.SSM_jl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_in =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_cci =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_btl =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ow =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_a5 =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.left_spoiler_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_bcj =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_bjx =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.right_spoiler_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_i5 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_status_word.SSM;
  A380PrimComputerFctl_B.Data_ci = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_status_word.Data;
  A380PrimComputerFctl_B.SSM_jww = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_h2 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_kkj = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ce = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ndh = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_3_position_deg.SSM;
  A380PrimComputerFctl_B.Data_dx = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.elevator_3_position_deg.Data;
  A380PrimComputerFctl_B.SSM_k1 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.ths_position_deg.SSM;
  A380PrimComputerFctl_B.Data_fvi = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.ths_position_deg.Data;
  A380PrimComputerFctl_B.SSM_kl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_status_word.SSM;
  A380PrimComputerFctl_B.Data_gnm = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_status_word.Data;
  A380PrimComputerFctl_B.SSM_po = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_e3y = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ie0 = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ld = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ay = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.SSM;
  A380PrimComputerFctl_B.Data_k3v =
    A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.rudder_trim_actual_pos_deg.Data;
  A380PrimComputerFctl_B.SSM_gsb = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.fctl_law_status_word.SSM;
  A380PrimComputerFctl_B.Data_oy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.fctl_law_status_word.Data;
  A380PrimComputerFctl_B.SSM_mxy = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.misc_data_status_word.SSM;
  A380PrimComputerFctl_B.Data_nl = A380PrimComputerFctl_P.out_Y0.data.bus_inputs.sec_3_bus.misc_data_status_word.Data;
  A380PrimComputerFctl_B.ap_engaged = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.ap_engaged;
  A380PrimComputerFctl_B.ap_1_engaged = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.ap_1_engaged;
  A380PrimComputerFctl_B.ap_2_engaged = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.ap_2_engaged;
  A380PrimComputerFctl_B.athr_engaged = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.athr_engaged;
  A380PrimComputerFctl_B.roll_command = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.roll_command;
  A380PrimComputerFctl_B.pitch_command = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.pitch_command;
  A380PrimComputerFctl_B.yaw_command = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.yaw_command;
  A380PrimComputerFctl_B.lateral_mode = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.lateral_mode;
  A380PrimComputerFctl_B.lateral_mode_armed = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.lateral_mode_armed;
  A380PrimComputerFctl_B.vertical_mode = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.vertical_mode;
  A380PrimComputerFctl_B.vertical_mode_armed = A380PrimComputerFctl_P.out_Y0.data.temporary_ap_input.vertical_mode_armed;
  A380PrimComputerFctl_B.on_ground = A380PrimComputerFctl_P.out_Y0.general_logic.on_ground;
  A380PrimComputerFctl_B.tracking_mode_on = A380PrimComputerFctl_P.out_Y0.general_logic.tracking_mode_on;
  A380PrimComputerFctl_B.double_adr_failure = A380PrimComputerFctl_P.out_Y0.general_logic.double_adr_failure;
  A380PrimComputerFctl_B.triple_adr_failure = A380PrimComputerFctl_P.out_Y0.general_logic.triple_adr_failure;
  A380PrimComputerFctl_B.cas_or_mach_disagree = A380PrimComputerFctl_P.out_Y0.general_logic.cas_or_mach_disagree;
  A380PrimComputerFctl_B.alpha_disagree = A380PrimComputerFctl_P.out_Y0.general_logic.alpha_disagree;
  A380PrimComputerFctl_B.double_ir_failure = A380PrimComputerFctl_P.out_Y0.general_logic.double_ir_failure;
  A380PrimComputerFctl_B.triple_ir_failure = A380PrimComputerFctl_P.out_Y0.general_logic.triple_ir_failure;
  A380PrimComputerFctl_B.ir_failure_not_self_detected =
    A380PrimComputerFctl_P.out_Y0.general_logic.ir_failure_not_self_detected;
  A380PrimComputerFctl_B.V_ias_kn = A380PrimComputerFctl_P.out_Y0.general_logic.adr_computation_data.V_ias_kn;
  A380PrimComputerFctl_B.V_tas_kn = A380PrimComputerFctl_P.out_Y0.general_logic.adr_computation_data.V_tas_kn;
  A380PrimComputerFctl_B.mach = A380PrimComputerFctl_P.out_Y0.general_logic.adr_computation_data.mach;
  A380PrimComputerFctl_B.alpha_deg = A380PrimComputerFctl_P.out_Y0.general_logic.adr_computation_data.alpha_deg;
  A380PrimComputerFctl_B.theta_deg = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.theta_deg;
  A380PrimComputerFctl_B.phi_deg = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.phi_deg;
  A380PrimComputerFctl_B.q_deg_s = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.q_deg_s;
  A380PrimComputerFctl_B.r_deg_s = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.r_deg_s;
  A380PrimComputerFctl_B.n_x_g = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.n_x_g;
  A380PrimComputerFctl_B.n_y_g = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.n_y_g;
  A380PrimComputerFctl_B.n_z_g = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.n_z_g;
  A380PrimComputerFctl_B.theta_dot_deg_s =
    A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.theta_dot_deg_s;
  A380PrimComputerFctl_B.phi_dot_deg_s = A380PrimComputerFctl_P.out_Y0.general_logic.ir_computation_data.phi_dot_deg_s;
  A380PrimComputerFctl_B.ra_computation_data_ft = A380PrimComputerFctl_P.out_Y0.general_logic.ra_computation_data_ft;
  A380PrimComputerFctl_B.two_ra_failure = A380PrimComputerFctl_P.out_Y0.general_logic.two_ra_failure;
  A380PrimComputerFctl_B.all_ra_failure = A380PrimComputerFctl_P.out_Y0.general_logic.all_ra_failure;
  A380PrimComputerFctl_B.all_sfcc_lost = A380PrimComputerFctl_P.out_Y0.general_logic.all_sfcc_lost;
  A380PrimComputerFctl_B.flap_handle_index = A380PrimComputerFctl_P.out_Y0.general_logic.flap_handle_index;
  A380PrimComputerFctl_B.flap_angle_deg = A380PrimComputerFctl_P.out_Y0.general_logic.flap_angle_deg;
  A380PrimComputerFctl_B.slat_angle_deg = A380PrimComputerFctl_P.out_Y0.general_logic.slat_angle_deg;
  A380PrimComputerFctl_B.slat_flap_actual_pos = A380PrimComputerFctl_P.out_Y0.general_logic.slat_flap_actual_pos;
  A380PrimComputerFctl_B.double_lgciu_failure = A380PrimComputerFctl_P.out_Y0.general_logic.double_lgciu_failure;
  A380PrimComputerFctl_B.slats_locked = A380PrimComputerFctl_P.out_Y0.general_logic.slats_locked;
  A380PrimComputerFctl_B.flaps_locked = A380PrimComputerFctl_P.out_Y0.general_logic.flaps_locked;
  A380PrimComputerFctl_B.landing_gear_down = A380PrimComputerFctl_P.out_Y0.general_logic.landing_gear_down;
  A380PrimComputerFctl_B.left_inboard_aileron_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_inboard_aileron_deg;
  A380PrimComputerFctl_B.right_inboard_aileron_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_inboard_aileron_deg;
  A380PrimComputerFctl_B.left_midboard_aileron_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_midboard_aileron_deg;
  A380PrimComputerFctl_B.right_midboard_aileron_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_midboard_aileron_deg;
  A380PrimComputerFctl_B.left_outboard_aileron_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_outboard_aileron_deg;
  A380PrimComputerFctl_B.right_outboard_aileron_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_outboard_aileron_deg;
  A380PrimComputerFctl_B.left_spoiler_1_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_1_deg;
  A380PrimComputerFctl_B.right_spoiler_1_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_1_deg;
  A380PrimComputerFctl_B.left_spoiler_2_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_2_deg;
  A380PrimComputerFctl_B.right_spoiler_2_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_2_deg;
  A380PrimComputerFctl_B.left_spoiler_3_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_3_deg;
  A380PrimComputerFctl_B.right_spoiler_3_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_3_deg;
  A380PrimComputerFctl_B.left_spoiler_4_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_4_deg;
  A380PrimComputerFctl_B.right_spoiler_4_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_4_deg;
  A380PrimComputerFctl_B.left_spoiler_5_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_5_deg;
  A380PrimComputerFctl_B.right_spoiler_5_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_5_deg;
  A380PrimComputerFctl_B.left_spoiler_6_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_6_deg;
  A380PrimComputerFctl_B.right_spoiler_6_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_6_deg;
  A380PrimComputerFctl_B.left_spoiler_7_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_7_deg;
  A380PrimComputerFctl_B.right_spoiler_7_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_7_deg;
  A380PrimComputerFctl_B.left_spoiler_8_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.left_spoiler_8_deg;
  A380PrimComputerFctl_B.right_spoiler_8_deg =
    A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.right_spoiler_8_deg;
  A380PrimComputerFctl_B.upper_rudder_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.upper_rudder_deg;
  A380PrimComputerFctl_B.lower_rudder_deg = A380PrimComputerFctl_P.out_Y0.laws.lateral_law_outputs.lower_rudder_deg;
  A380PrimComputerFctl_B.left_inboard_elevator_deg =
    A380PrimComputerFctl_P.out_Y0.laws.pitch_law_outputs.left_inboard_elevator_deg;
  A380PrimComputerFctl_B.right_inboard_elevator_deg =
    A380PrimComputerFctl_P.out_Y0.laws.pitch_law_outputs.right_inboard_elevator_deg;
  A380PrimComputerFctl_B.left_outboard_elevator_deg =
    A380PrimComputerFctl_P.out_Y0.laws.pitch_law_outputs.left_outboard_elevator_deg;
  A380PrimComputerFctl_B.right_outboard_elevator_deg =
    A380PrimComputerFctl_P.out_Y0.laws.pitch_law_outputs.right_outboard_elevator_deg;
  A380PrimComputerFctl_B.ths_deg = A380PrimComputerFctl_P.out_Y0.laws.pitch_law_outputs.ths_deg;
  A380PrimComputerFctl_B.left_inboard_aileron_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.left_inboard_aileron_engaged;
  A380PrimComputerFctl_B.right_inboard_aileron_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.right_inboard_aileron_engaged;
  A380PrimComputerFctl_B.left_midboard_aileron_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.left_midboard_aileron_engaged;
  A380PrimComputerFctl_B.right_midboard_aileron_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.right_midboard_aileron_engaged;
  A380PrimComputerFctl_B.left_outboard_aileron_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.left_outboard_aileron_engaged;
  A380PrimComputerFctl_B.right_outboard_aileron_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.right_outboard_aileron_engaged;
  A380PrimComputerFctl_B.spoiler_pair_1_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_1_engaged;
  A380PrimComputerFctl_B.spoiler_pair_2_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_2_engaged;
  A380PrimComputerFctl_B.spoiler_pair_3_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_3_engaged;
  A380PrimComputerFctl_B.spoiler_pair_4_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_4_engaged;
  A380PrimComputerFctl_B.spoiler_pair_5_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_5_engaged;
  A380PrimComputerFctl_B.spoiler_pair_6_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_6_engaged;
  A380PrimComputerFctl_B.spoiler_pair_7_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_7_engaged;
  A380PrimComputerFctl_B.spoiler_pair_8_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.spoiler_pair_8_engaged;
  A380PrimComputerFctl_B.left_inboard_elevator_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.left_inboard_elevator_engaged;
  A380PrimComputerFctl_B.right_inboard_elevator_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.right_inboard_elevator_engaged;
  A380PrimComputerFctl_B.left_outboard_elevator_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.left_outboard_elevator_engaged;
  A380PrimComputerFctl_B.right_outboard_elevator_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.right_outboard_elevator_engaged;
  A380PrimComputerFctl_B.ths_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.ths_engaged;
  A380PrimComputerFctl_B.upper_rudder_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.upper_rudder_engaged;
  A380PrimComputerFctl_B.lower_rudder_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.surface_statuses.lower_rudder_engaged;
  A380PrimComputerFctl_B.left_inboard_aileron_deg_g =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_inboard_aileron_deg;
  A380PrimComputerFctl_B.right_inboard_aileron_deg_b =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_inboard_aileron_deg;
  A380PrimComputerFctl_B.left_midboard_aileron_deg_f =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_midboard_aileron_deg;
  A380PrimComputerFctl_B.right_midboard_aileron_deg_f =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_midboard_aileron_deg;
  A380PrimComputerFctl_B.left_outboard_aileron_deg_g =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_outboard_aileron_deg;
  A380PrimComputerFctl_B.right_outboard_aileron_deg_m =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_outboard_aileron_deg;
  A380PrimComputerFctl_B.left_spoiler_1_deg_b =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_1_deg;
  A380PrimComputerFctl_B.right_spoiler_1_deg_o =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_1_deg;
  A380PrimComputerFctl_B.left_spoiler_2_deg_i =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_2_deg;
  A380PrimComputerFctl_B.right_spoiler_2_deg_g =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_2_deg;
  A380PrimComputerFctl_B.left_spoiler_3_deg_i =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_3_deg;
  A380PrimComputerFctl_B.right_spoiler_3_deg_b =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_3_deg;
  A380PrimComputerFctl_B.left_spoiler_4_deg_g =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_4_deg;
  A380PrimComputerFctl_B.right_spoiler_4_deg_a =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_4_deg;
  A380PrimComputerFctl_B.left_spoiler_5_deg_d =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_5_deg;
  A380PrimComputerFctl_B.right_spoiler_5_deg_m =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_5_deg;
  A380PrimComputerFctl_B.left_spoiler_6_deg_o =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_6_deg;
  A380PrimComputerFctl_B.right_spoiler_6_deg_d =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_6_deg;
  A380PrimComputerFctl_B.left_spoiler_7_deg_a =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_7_deg;
  A380PrimComputerFctl_B.right_spoiler_7_deg_j =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_7_deg;
  A380PrimComputerFctl_B.left_spoiler_8_deg_h =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.left_spoiler_8_deg;
  A380PrimComputerFctl_B.right_spoiler_8_deg_j =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.right_spoiler_8_deg;
  A380PrimComputerFctl_B.upper_rudder_deg_m =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.upper_rudder_deg;
  A380PrimComputerFctl_B.lower_rudder_deg_c =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_surface_positions.lower_rudder_deg;
  A380PrimComputerFctl_B.left_inboard_elevator_deg_k =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.pitch_surface_positions.left_inboard_elevator_deg;
  A380PrimComputerFctl_B.right_inboard_elevator_deg_o =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.pitch_surface_positions.right_inboard_elevator_deg;
  A380PrimComputerFctl_B.left_outboard_elevator_deg_p =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.pitch_surface_positions.left_outboard_elevator_deg;
  A380PrimComputerFctl_B.right_outboard_elevator_deg_g =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.pitch_surface_positions.right_outboard_elevator_deg;
  A380PrimComputerFctl_B.ths_deg_o = A380PrimComputerFctl_P.out_Y0.fctl_logic.pitch_surface_positions.ths_deg;
  A380PrimComputerFctl_B.lateral_law_capability = A380PrimComputerFctl_P.out_Y0.fctl_logic.lateral_law_capability;
  A380PrimComputerFctl_B.active_lateral_law = A380PrimComputerFctl_P.out_Y0.fctl_logic.active_lateral_law;
  A380PrimComputerFctl_B.pitch_law_capability = A380PrimComputerFctl_P.out_Y0.fctl_logic.pitch_law_capability;
  A380PrimComputerFctl_B.active_pitch_law = A380PrimComputerFctl_P.out_Y0.fctl_logic.active_pitch_law;
  A380PrimComputerFctl_B.abnormal_condition_law_active =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.abnormal_condition_law_active;
  A380PrimComputerFctl_B.is_master_prim = A380PrimComputerFctl_P.out_Y0.fctl_logic.is_master_prim;
  A380PrimComputerFctl_B.elevator_1_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.elevator_1_avail;
  A380PrimComputerFctl_B.elevator_1_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.elevator_1_engaged;
  A380PrimComputerFctl_B.elevator_2_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.elevator_2_avail;
  A380PrimComputerFctl_B.elevator_2_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.elevator_2_engaged;
  A380PrimComputerFctl_B.elevator_3_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.elevator_3_avail;
  A380PrimComputerFctl_B.elevator_3_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.elevator_3_engaged;
  A380PrimComputerFctl_B.ths_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.ths_avail;
  A380PrimComputerFctl_B.ths_engaged_h = A380PrimComputerFctl_P.out_Y0.fctl_logic.ths_engaged;
  A380PrimComputerFctl_B.left_aileron_1_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.left_aileron_1_avail;
  A380PrimComputerFctl_B.left_aileron_1_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.left_aileron_1_engaged;
  A380PrimComputerFctl_B.left_aileron_2_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.left_aileron_2_avail;
  A380PrimComputerFctl_B.left_aileron_2_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.left_aileron_2_engaged;
  A380PrimComputerFctl_B.right_aileron_1_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.right_aileron_1_avail;
  A380PrimComputerFctl_B.right_aileron_1_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.right_aileron_1_engaged;
  A380PrimComputerFctl_B.right_aileron_2_avail = A380PrimComputerFctl_P.out_Y0.fctl_logic.right_aileron_2_avail;
  A380PrimComputerFctl_B.right_aileron_2_engaged = A380PrimComputerFctl_P.out_Y0.fctl_logic.right_aileron_2_engaged;
  A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.left_spoiler_hydraulic_mode_avail;
  A380PrimComputerFctl_B.left_spoiler_electric_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.left_spoiler_electric_mode_avail;
  A380PrimComputerFctl_B.left_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.left_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFctl_B.left_spoiler_electric_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.left_spoiler_electric_mode_engaged;
  A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.right_spoiler_hydraulic_mode_avail;
  A380PrimComputerFctl_B.right_spoiler_electric_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.right_spoiler_electric_mode_avail;
  A380PrimComputerFctl_B.right_spoiler_hydraulic_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.right_spoiler_hydraulic_mode_engaged;
  A380PrimComputerFctl_B.right_spoiler_electric_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.right_spoiler_electric_mode_engaged;
  A380PrimComputerFctl_B.rudder_1_hydraulic_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_1_hydraulic_mode_avail;
  A380PrimComputerFctl_B.rudder_1_electric_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_1_electric_mode_avail;
  A380PrimComputerFctl_B.rudder_1_hydraulic_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_1_hydraulic_mode_engaged;
  A380PrimComputerFctl_B.rudder_1_electric_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_1_electric_mode_engaged;
  A380PrimComputerFctl_B.rudder_2_hydraulic_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_2_hydraulic_mode_avail;
  A380PrimComputerFctl_B.rudder_2_electric_mode_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_2_electric_mode_avail;
  A380PrimComputerFctl_B.rudder_2_hydraulic_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_2_hydraulic_mode_engaged;
  A380PrimComputerFctl_B.rudder_2_electric_mode_engaged =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.rudder_2_electric_mode_engaged;
  A380PrimComputerFctl_B.aileron_droop_active = A380PrimComputerFctl_P.out_Y0.fctl_logic.aileron_droop_active;
  A380PrimComputerFctl_B.aileron_antidroop_active = A380PrimComputerFctl_P.out_Y0.fctl_logic.aileron_antidroop_active;
  A380PrimComputerFctl_B.ths_automatic_mode_active = A380PrimComputerFctl_P.out_Y0.fctl_logic.ths_automatic_mode_active;
  A380PrimComputerFctl_B.ths_manual_mode_c_deg_s = A380PrimComputerFctl_P.out_Y0.fctl_logic.ths_manual_mode_c_deg_s;
  A380PrimComputerFctl_B.is_yellow_hydraulic_power_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.is_yellow_hydraulic_power_avail;
  A380PrimComputerFctl_B.is_green_hydraulic_power_avail =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.is_green_hydraulic_power_avail;
  A380PrimComputerFctl_B.eha_ebha_elec_mode_inhibited =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.eha_ebha_elec_mode_inhibited;
  A380PrimComputerFctl_B.left_sidestick_disabled = A380PrimComputerFctl_P.out_Y0.fctl_logic.left_sidestick_disabled;
  A380PrimComputerFctl_B.right_sidestick_disabled = A380PrimComputerFctl_P.out_Y0.fctl_logic.right_sidestick_disabled;
  A380PrimComputerFctl_B.left_sidestick_priority_locked =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.left_sidestick_priority_locked;
  A380PrimComputerFctl_B.right_sidestick_priority_locked =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.right_sidestick_priority_locked;
  A380PrimComputerFctl_B.total_sidestick_pitch_command =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.total_sidestick_pitch_command;
  A380PrimComputerFctl_B.total_sidestick_roll_command =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.total_sidestick_roll_command;
  A380PrimComputerFctl_B.speed_brake_inhibited = A380PrimComputerFctl_P.out_Y0.fctl_logic.speed_brake_inhibited;
  A380PrimComputerFctl_B.ground_spoilers_armed = A380PrimComputerFctl_P.out_Y0.fctl_logic.ground_spoilers_armed;
  A380PrimComputerFctl_B.ground_spoilers_out = A380PrimComputerFctl_P.out_Y0.fctl_logic.ground_spoilers_out;
  A380PrimComputerFctl_B.phased_lift_dumping_active =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.phased_lift_dumping_active;
  A380PrimComputerFctl_B.spoiler_lift_active = A380PrimComputerFctl_P.out_Y0.fctl_logic.spoiler_lift_active;
  A380PrimComputerFctl_B.ap_authorised = A380PrimComputerFctl_P.out_Y0.fctl_logic.ap_authorised;
  A380PrimComputerFctl_B.protection_ap_disconnect = A380PrimComputerFctl_P.out_Y0.fctl_logic.protection_ap_disconnect;
  A380PrimComputerFctl_B.high_alpha_prot_active = A380PrimComputerFctl_P.out_Y0.fctl_logic.high_alpha_prot_active;
  A380PrimComputerFctl_B.alpha_prot_deg = A380PrimComputerFctl_P.out_Y0.fctl_logic.alpha_prot_deg;
  A380PrimComputerFctl_B.alpha_max_deg = A380PrimComputerFctl_P.out_Y0.fctl_logic.alpha_max_deg;
  A380PrimComputerFctl_B.high_speed_prot_active = A380PrimComputerFctl_P.out_Y0.fctl_logic.high_speed_prot_active;
  A380PrimComputerFctl_B.high_speed_prot_lo_thresh_kn =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.high_speed_prot_lo_thresh_kn;
  A380PrimComputerFctl_B.high_speed_prot_hi_thresh_kn =
    A380PrimComputerFctl_P.out_Y0.fctl_logic.high_speed_prot_hi_thresh_kn;
  A380PrimComputerFctl_B.land_2_capability = A380PrimComputerFctl_P.out_Y0.fg_logic.land_2_capability;
  A380PrimComputerFctl_B.land_3_fail_passive_capability =
    A380PrimComputerFctl_P.out_Y0.fg_logic.land_3_fail_passive_capability;
  A380PrimComputerFctl_B.land_3_fail_op_capability = A380PrimComputerFctl_P.out_Y0.fg_logic.land_3_fail_op_capability;
  A380PrimComputerFctl_B.land_2_inop = A380PrimComputerFctl_P.out_Y0.fg_logic.land_2_inop;
  A380PrimComputerFctl_B.land_3_fail_passive_inop = A380PrimComputerFctl_P.out_Y0.fg_logic.land_3_fail_passive_inop;
  A380PrimComputerFctl_B.land_3_fail_op_inop = A380PrimComputerFctl_P.out_Y0.fg_logic.land_3_fail_op_inop;
  A380PrimComputerFctl_B.alignment_dummy = A380PrimComputerFctl_P.out_Y0.discrete_outputs.alignment_dummy;
  A380PrimComputerFctl_B.elevator_1_active_mode = A380PrimComputerFctl_P.out_Y0.discrete_outputs.elevator_1_active_mode;
  A380PrimComputerFctl_B.elevator_2_active_mode = A380PrimComputerFctl_P.out_Y0.discrete_outputs.elevator_2_active_mode;
  A380PrimComputerFctl_B.elevator_3_active_mode = A380PrimComputerFctl_P.out_Y0.discrete_outputs.elevator_3_active_mode;
  A380PrimComputerFctl_B.ths_active_mode = A380PrimComputerFctl_P.out_Y0.discrete_outputs.ths_active_mode;
  A380PrimComputerFctl_B.left_aileron_1_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.left_aileron_1_active_mode;
  A380PrimComputerFctl_B.left_aileron_2_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.left_aileron_2_active_mode;
  A380PrimComputerFctl_B.right_aileron_1_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.right_aileron_1_active_mode;
  A380PrimComputerFctl_B.right_aileron_2_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.right_aileron_2_active_mode;
  A380PrimComputerFctl_B.left_spoiler_electronic_module_enable =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.left_spoiler_electronic_module_enable;
  A380PrimComputerFctl_B.right_spoiler_electronic_module_enable =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.right_spoiler_electronic_module_enable;
  A380PrimComputerFctl_B.rudder_1_hydraulic_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.rudder_1_hydraulic_active_mode;
  A380PrimComputerFctl_B.rudder_1_electric_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.rudder_1_electric_active_mode;
  A380PrimComputerFctl_B.rudder_2_hydraulic_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.rudder_2_hydraulic_active_mode;
  A380PrimComputerFctl_B.rudder_2_electric_active_mode =
    A380PrimComputerFctl_P.out_Y0.discrete_outputs.rudder_2_electric_active_mode;
  A380PrimComputerFctl_B.prim_healthy = A380PrimComputerFctl_P.out_Y0.discrete_outputs.prim_healthy;
  A380PrimComputerFctl_B.fcu_own_select = A380PrimComputerFctl_P.out_Y0.discrete_outputs.fcu_own_select;
  A380PrimComputerFctl_B.fcu_opp_select = A380PrimComputerFctl_P.out_Y0.discrete_outputs.fcu_opp_select;
  A380PrimComputerFctl_B.reverser_tertiary_lock = A380PrimComputerFctl_P.out_Y0.discrete_outputs.reverser_tertiary_lock;
  A380PrimComputerFctl_B.elevator_1_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.elevator_1_pos_order_deg;
  A380PrimComputerFctl_B.elevator_2_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.elevator_2_pos_order_deg;
  A380PrimComputerFctl_B.elevator_3_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.elevator_3_pos_order_deg;
  A380PrimComputerFctl_B.ths_pos_order_deg = A380PrimComputerFctl_P.out_Y0.analog_outputs.ths_pos_order_deg;
  A380PrimComputerFctl_B.left_aileron_1_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.left_aileron_1_pos_order_deg;
  A380PrimComputerFctl_B.left_aileron_2_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.left_aileron_2_pos_order_deg;
  A380PrimComputerFctl_B.right_aileron_1_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.right_aileron_1_pos_order_deg;
  A380PrimComputerFctl_B.right_aileron_2_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.right_aileron_2_pos_order_deg;
  A380PrimComputerFctl_B.left_spoiler_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.left_spoiler_pos_order_deg;
  A380PrimComputerFctl_B.right_spoiler_pos_order_deg =
    A380PrimComputerFctl_P.out_Y0.analog_outputs.right_spoiler_pos_order_deg;
  A380PrimComputerFctl_B.rudder_1_pos_order_deg = A380PrimComputerFctl_P.out_Y0.analog_outputs.rudder_1_pos_order_deg;
  A380PrimComputerFctl_B.rudder_2_pos_order_deg = A380PrimComputerFctl_P.out_Y0.analog_outputs.rudder_2_pos_order_deg;
  A380PrimComputerFctl_B.SSM_kxxtac0 = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_inboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ex = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_inboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0z = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_inboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_jo = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_inboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0zt = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_midboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_eb = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_midboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0ztg =
    A380PrimComputerFctl_P.out_Y0.bus_outputs.right_midboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_a = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_midboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0ztgf =
    A380PrimComputerFctl_P.out_Y0.bus_outputs.left_outboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_g = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_outboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0ztgf2 =
    A380PrimComputerFctl_P.out_Y0.bus_outputs.right_outboard_aileron_command_deg.SSM;
  A380PrimComputerFctl_B.Data_i = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_outboard_aileron_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0ztgf2u = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_1_command_deg.SSM;
  A380PrimComputerFctl_B.Data_p = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_1_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0ztgf2ux = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_1_command_deg.SSM;
  A380PrimComputerFctl_B.Data_d = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_1_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac0ztgf2uxn = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_2_command_deg.SSM;
  A380PrimComputerFctl_B.Data_j = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_2_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ky = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_2_command_deg.SSM;
  A380PrimComputerFctl_B.Data_e = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_2_command_deg.Data;
  A380PrimComputerFctl_B.SSM_d = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_3_command_deg.SSM;
  A380PrimComputerFctl_B.Data_h = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_3_command_deg.Data;
  A380PrimComputerFctl_B.SSM_h = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_3_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3epgtdxc =
    A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_3_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kb = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_4_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3epgtdx = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_4_command_deg.Data;
  A380PrimComputerFctl_B.SSM_p = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_4_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3epgtd = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_4_command_deg.Data;
  A380PrimComputerFctl_B.SSM_di = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_5_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3epgt = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_5_command_deg.Data;
  A380PrimComputerFctl_B.SSM_j = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_5_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3epg = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_5_command_deg.Data;
  A380PrimComputerFctl_B.SSM_i = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_6_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3ep = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_6_command_deg.Data;
  A380PrimComputerFctl_B.SSM_g = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_6_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3e = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_6_command_deg.Data;
  A380PrimComputerFctl_B.SSM_db = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_7_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc3 = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_7_command_deg.Data;
  A380PrimComputerFctl_B.SSM_n = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_7_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkftc = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_7_command_deg.Data;
  A380PrimComputerFctl_B.SSM_a = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_8_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkft = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_8_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ir = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_8_command_deg.SSM;
  A380PrimComputerFctl_B.Data = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_8_command_deg.Data;
  A380PrimComputerFctl_B.SSM = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_inboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxkf = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_inboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_k = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_inboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwxk = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_inboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kx = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_outboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fwx = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_outboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxx = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_outboard_elevator_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fw = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_outboard_elevator_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxt = A380PrimComputerFctl_P.out_Y0.bus_outputs.ths_command_deg.SSM;
  A380PrimComputerFctl_B.Data_f = A380PrimComputerFctl_P.out_Y0.bus_outputs.ths_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxta = A380PrimComputerFctl_P.out_Y0.bus_outputs.upper_rudder_command_deg.SSM;
  A380PrimComputerFctl_B.Data_ja = A380PrimComputerFctl_P.out_Y0.bus_outputs.upper_rudder_command_deg.Data;
  A380PrimComputerFctl_B.SSM_kxxtac = A380PrimComputerFctl_P.out_Y0.bus_outputs.lower_rudder_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fd = A380PrimComputerFctl_P.out_Y0.bus_outputs.lower_rudder_command_deg.Data;
  A380PrimComputerFctl_B.SSM_hu = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_o = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_e = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputerFctl_B.Data_m = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_sidestick_pitch_command_deg.Data;
  A380PrimComputerFctl_B.SSM_gr = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_oq = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_ev = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_sidestick_roll_command_deg.SSM;
  A380PrimComputerFctl_B.Data_fo = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_sidestick_roll_command_deg.Data;
  A380PrimComputerFctl_B.SSM_l = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_pedal_position_deg.SSM;
  A380PrimComputerFctl_B.Data_p1 = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_pedal_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ei = A380PrimComputerFctl_P.out_Y0.bus_outputs.aileron_status_word.SSM;
  A380PrimComputerFctl_B.Data_k = A380PrimComputerFctl_P.out_Y0.bus_outputs.aileron_status_word.Data;
  A380PrimComputerFctl_B.SSM_an = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_p1y = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_c = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_l = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_cb = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_aileron_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_kp = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_aileron_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_lb = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_aileron_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_k0 = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_aileron_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ia = A380PrimComputerFctl_P.out_Y0.bus_outputs.spoiler_status_word.SSM;
  A380PrimComputerFctl_B.Data_joy = A380PrimComputerFctl_P.out_Y0.bus_outputs.spoiler_status_word.Data;
  A380PrimComputerFctl_B.SSM_kyz = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_position_deg.SSM;
  A380PrimComputerFctl_B.Data_pi = A380PrimComputerFctl_P.out_Y0.bus_outputs.left_spoiler_position_deg.Data;
  A380PrimComputerFctl_B.SSM_as = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_position_deg.SSM;
  A380PrimComputerFctl_B.Data_dm = A380PrimComputerFctl_P.out_Y0.bus_outputs.right_spoiler_position_deg.Data;
  A380PrimComputerFctl_B.SSM_is = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_status_word.SSM;
  A380PrimComputerFctl_B.Data_h3 = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_status_word.Data;
  A380PrimComputerFctl_B.SSM_ca = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_f5 = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_o = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_js = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_ak = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_3_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ee = A380PrimComputerFctl_P.out_Y0.bus_outputs.elevator_3_position_deg.Data;
  A380PrimComputerFctl_B.SSM_cbj = A380PrimComputerFctl_P.out_Y0.bus_outputs.ths_position_deg.SSM;
  A380PrimComputerFctl_B.Data_ig = A380PrimComputerFctl_P.out_Y0.bus_outputs.ths_position_deg.Data;
  A380PrimComputerFctl_B.SSM_cu = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_status_word.SSM;
  A380PrimComputerFctl_B.Data_a0 = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_status_word.Data;
  A380PrimComputerFctl_B.SSM_nn = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_1_position_deg.SSM;
  A380PrimComputerFctl_B.Data_mk = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_1_position_deg.Data;
  A380PrimComputerFctl_B.SSM_b = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_2_position_deg.SSM;
  A380PrimComputerFctl_B.Data_pu = A380PrimComputerFctl_P.out_Y0.bus_outputs.rudder_2_position_deg.Data;
  A380PrimComputerFctl_B.SSM_m0 = A380PrimComputerFctl_P.out_Y0.bus_outputs.radio_height_1_ft.SSM;
  A380PrimComputerFctl_B.Data_lyw = A380PrimComputerFctl_P.out_Y0.bus_outputs.radio_height_1_ft.Data;
  A380PrimComputerFctl_B.SSM_pu = A380PrimComputerFctl_P.out_Y0.bus_outputs.radio_height_2_ft.SSM;
  A380PrimComputerFctl_B.Data_gq = A380PrimComputerFctl_P.out_Y0.bus_outputs.radio_height_2_ft.Data;
  A380PrimComputerFctl_B.SSM_m = A380PrimComputerFctl_P.out_Y0.bus_outputs.fctl_law_status_word.SSM;
  A380PrimComputerFctl_B.Data_b = A380PrimComputerFctl_P.out_Y0.bus_outputs.fctl_law_status_word.Data;
  A380PrimComputerFctl_B.SSM_f = A380PrimComputerFctl_P.out_Y0.bus_outputs.discrete_status_word_1.SSM;
  A380PrimComputerFctl_B.Data_eq = A380PrimComputerFctl_P.out_Y0.bus_outputs.discrete_status_word_1.Data;
  A380PrimComputerFctl_B.SSM_bp = A380PrimComputerFctl_P.out_Y0.bus_outputs.fe_status_word.SSM;
  A380PrimComputerFctl_B.Data_iz = A380PrimComputerFctl_P.out_Y0.bus_outputs.fe_status_word.Data;
  A380PrimComputerFctl_B.SSM_hb = A380PrimComputerFctl_P.out_Y0.bus_outputs.fg_status_word.SSM;
  A380PrimComputerFctl_B.Data_j2 = A380PrimComputerFctl_P.out_Y0.bus_outputs.fg_status_word.Data;
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
