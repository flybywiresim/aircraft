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

const boolean_T A380PrimComputer_BGND{ false };

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

void A380PrimComputer::A380PrimComputer_Spoiler12SpeedbrakeGain(real_T rtu_spdBrkDeflection, real_T
  *rty_spdBrkDeflectionOut)
{
  *rty_spdBrkDeflectionOut = rtu_spdBrkDeflection * 0.44444444444444442;
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_m_Reset(rtDW_MATLABFunction_A380PrimComputer_j_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_m(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_A380PrimComputer_j_T *localDW)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_p_Reset(rtDW_MATLABFunction_A380PrimComputer_k_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputer_k_T *localDW)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_j_Reset(rtDW_MATLABFunction_A380PrimComputer_km_T *localDW)
{
  localDW->output = false;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_j(real_T rtu_u, real_T rtu_highTrigger, real_T rtu_lowTrigger,
  boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputer_km_T *localDW)
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

void A380PrimComputer::A380PrimComputer_RateLimiter_e_Reset(rtDW_RateLimiter_A380PrimComputer_b_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PrimComputer::A380PrimComputer_RateLimiter_n(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PrimComputer_b_T *localDW)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_cw(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_ei(a380_pitch_efcs_law rtu_law, boolean_T *rty_bit1, boolean_T
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
  base_arinc_429 rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1;
  real_T rtb_Switch8_o;
  real_T rtb_Switch_h;
  real_T rtb_Y;
  real_T rtb_Y_j;
  real_T rtb_eta_deg_dv;
  real_T rtb_eta_trim_limit_lo_d;
  real_T rtb_handleIndex;
  real_T rtb_left_spoiler_3_deg;
  real_T rtb_xi_spoiler_deg_b;
  uint32_T rtb_Switch31;
  uint32_T rtb_y_po;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_c[19];
  boolean_T b_x[6];
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_tripleAdrFault;
  boolean_T rtb_y_di;
  boolean_T rtb_y_f;
  boolean_T rtb_y_h;
  boolean_T rtb_y_jj;
  boolean_T rtb_y_k;
  a380_pitch_efcs_law rtb_law;
  a380_pitch_efcs_law rtb_law_k;
  if (A380PrimComputer_U.in.sim_data.computer_running) {
    real_T rtb_leftAileron2Command;
    real_T rtb_rightAileron1Command;
    real_T rtb_rightAileron2Command;
    int32_T b_nz;
    int32_T iindx;
    int32_T nz;
    int32_T prim3LawCap;
    real32_T rtb_V_ias;
    real32_T rtb_V_tas;
    real32_T rtb_alpha;
    real32_T rtb_left_outboard_elevator_command_deg_nj_Data;
    real32_T rtb_left_spoiler_5_command_deg_ey_Data;
    real32_T rtb_left_spoiler_6_command_deg_ma_Data;
    real32_T rtb_left_spoiler_7_command_deg_op_Data;
    real32_T rtb_left_spoiler_8_command_deg_kt_Data;
    real32_T rtb_lower_rudder_command_deg_nt_Data;
    real32_T rtb_mach_h;
    real32_T rtb_n_x;
    real32_T rtb_n_y;
    real32_T rtb_n_z;
    real32_T rtb_phi;
    real32_T rtb_phi_dot;
    real32_T rtb_q;
    real32_T rtb_r;
    real32_T rtb_raComputationValue;
    real32_T rtb_right_inboard_elevator_command_deg_ff_Data;
    real32_T rtb_right_outboard_elevator_command_deg_eb_Data;
    real32_T rtb_right_spoiler_5_command_deg_nc_Data;
    real32_T rtb_right_spoiler_6_command_deg_jn_Data;
    real32_T rtb_right_spoiler_7_command_deg_b1_Data;
    real32_T rtb_right_spoiler_8_command_deg_g0_Data;
    real32_T rtb_theta_dot;
    real32_T rtb_ths_command_deg_aj_Data;
    real32_T rtb_upper_rudder_command_deg_pg_Data;
    real32_T rtb_y_oq;
    boolean_T elevator1Avail;
    boolean_T elevator2Avail;
    boolean_T leftSpoilerHydraulicModeAvail;
    boolean_T rightSpoilerHydraulicModeAvail;
    boolean_T rtb_AND1;
    boolean_T rtb_AND12;
    boolean_T rtb_AND14;
    boolean_T rtb_AND16;
    boolean_T rtb_AND1_at;
    boolean_T rtb_AND1_e;
    boolean_T rtb_AND2_ac;
    boolean_T rtb_AND3_d;
    boolean_T rtb_AND4;
    boolean_T rtb_AND5;
    boolean_T rtb_AND6;
    boolean_T rtb_AND7;
    boolean_T rtb_AND_cs;
    boolean_T rtb_AND_h0;
    boolean_T rtb_OR;
    boolean_T rtb_OR1;
    boolean_T rtb_OR3;
    boolean_T rtb_OR4;
    boolean_T rtb_OR7;
    boolean_T rtb_doubleIrFault;
    boolean_T rtb_leftInboardAilEngaged;
    boolean_T rtb_leftSpoilerElectricModeEngaged;
    boolean_T rtb_leftSpoilerHydraulicModeEngaged;
    boolean_T rtb_lowerRudderEngaged;
    boolean_T rtb_rightAileron2Engaged;
    boolean_T rtb_rightInboardAilEngaged;
    boolean_T rtb_rightOutboardAilEngaged;
    boolean_T rtb_rightSpoilerElectricModeEngaged;
    boolean_T rtb_rightSpoilerHydraulicModeEngaged;
    boolean_T rtb_thsEngaged;
    boolean_T rtb_tripleIrFault;
    boolean_T rtb_y_o;
    boolean_T rudder1ElectricModeAvail;
    boolean_T rudder1ElectricModeHasPriority;
    boolean_T rudder1HydraulicModeAvail;
    boolean_T rudder1HydraulicModeHasPriority;
    boolean_T rudder2ElectricModeAvail;
    boolean_T rudder2ElectricModeHasPriority;
    boolean_T rudder2HydraulicModeHasPriority;
    boolean_T thsAvail;
    a380_lateral_efcs_law rtb_activeLateralLaw;
    a380_pitch_efcs_law rtb_pitchLawCapability;
    if (!A380PrimComputer_DWork.Runtime_MODE) {
      A380PrimComputer_DWork.Delay_DSTATE_cc = A380PrimComputer_P.Delay_InitialCondition;
      A380PrimComputer_DWork.Delay1_DSTATE = A380PrimComputer_P.Delay1_InitialCondition;
      A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.SRFlipFlop_initial_condition;
      A380PrimComputer_DWork.Memory_PreviousInput_j = A380PrimComputer_P.SRFlipFlop_initial_condition_c;
      A380PrimComputer_DWork.Delay1_DSTATE_b = A380PrimComputer_P.Delay1_InitialCondition_n;
      A380PrimComputer_DWork.Delay_DSTATE_f = A380PrimComputer_P.Delay_InitialCondition_d;
      A380PrimComputer_DWork.Delay_DSTATE = A380PrimComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380PrimComputer_DWork.icLoad = true;
      A380PrimComputer_LagFilter_Reset(&A380PrimComputer_DWork.sf_LagFilter_a);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jz);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_lf);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jl);
      A380PrimComputer_DWork.ra1CoherenceRejected = false;
      A380PrimComputer_DWork.ra2CoherenceRejected = false;
      A380PrimComputer_DWork.configFullEventTime_not_empty = false;
      A380PrimComputer_MATLABFunction_j_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jg);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_cj);
      A380PrimComputer_MATLABFunction_j_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_br);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_gfx);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_nb);
      A380PrimComputer_DWork.abnormalConditionWasActive = false;
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_g4);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_nu);
      A380PrimComputer_DWork.pLeftStickDisabled = false;
      A380PrimComputer_DWork.pRightStickDisabled = false;
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_j2);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_g24);
      A380PrimComputer_RateLimiter_e_Reset(&A380PrimComputer_DWork.sf_RateLimiter_ne);
      A380PrimComputer_DWork.eventTime_not_empty_a = false;
      A380PrimComputer_RateLimiter_e_Reset(&A380PrimComputer_DWork.sf_RateLimiter_mr);
      A380PrimComputer_DWork.resetEventTime_not_empty = false;
      A380PrimComputer_DWork.sProtActive = false;
      A380PrimComputer_DWork.is_active_c28_A380PrimComputer = 0U;
      A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_NO_ACTIVE_CHILD;
      A380PrimComputer_DWork.eventTime_not_empty = false;
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_al);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jj);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ej);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ja);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_mb);
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
      A380PrimComputer_RateLimiter_bb_Reset(&A380PrimComputer_DWork.sf_RateLimiter_me);
      A380PrimComputer_RateLimiter_bb_Reset(&A380PrimComputer_DWork.sf_RateLimiter_md);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_j4);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_cd);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_l);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_d);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_gr);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_nh);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_c5);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_m);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_n2);
      A380PrimComputer_RateLimiter_b_Reset(&A380PrimComputer_DWork.sf_RateLimiter_j);
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
    rtb_doubleAdrFault = ((rtb_OR1 && rtb_OR3) || (rtb_OR1 && rtb_OR4) || (rtb_OR3 && rtb_OR4));
    rtb_tripleAdrFault = (rtb_OR1 && rtb_OR3 && rtb_OR4);
    rtb_y_f = A380PrimComputer_P.Constant1_Value_b;
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
    rtb_y_jj = ((A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM != static_cast<uint32_T>
      (SignStatusMatrix::NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM !=
      static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM != static_cast<uint32_T>
                 (SignStatusMatrix::NormalOperation)) || (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM
      != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                (A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
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
    rtb_tripleIrFault = (rtb_OR && rtb_y_jj);
    rtb_y_o = (rtb_OR && rtb_OR7);
    rtb_doubleIrFault = (rtb_tripleIrFault || rtb_y_o || (rtb_y_jj && rtb_OR7));
    rtb_tripleIrFault = (rtb_tripleIrFault && rtb_OR7);
    rtb_AND_h0 = !rtb_OR4;
    rtb_AND1 = !rtb_OR3;
    if (rtb_OR1 && rtb_AND1 && rtb_AND_h0) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach_h = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data +
                    A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if ((!rtb_OR1) && rtb_OR3 && rtb_AND_h0) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach_h = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                    A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if (((!rtb_OR1) && rtb_AND1 && rtb_AND_h0) || ((!rtb_OR1) && rtb_AND1 && rtb_OR4)) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach_h = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                    A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if ((!rtb_OR1) && rtb_OR3 && rtb_OR4) {
      rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      rtb_mach_h = A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    } else if (rtb_OR1 && rtb_AND1 && rtb_OR4) {
      rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      rtb_mach_h = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    } else if (rtb_OR1 && rtb_OR3 && rtb_AND_h0) {
      rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_mach_h = A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach_h = 0.0F;
      rtb_alpha = 0.0F;
    }

    A380PrimComputer_LagFilter(static_cast<real_T>(rtb_alpha), A380PrimComputer_P.LagFilter_C1,
      A380PrimComputer_U.in.time.dt, &rtb_Y, &A380PrimComputer_DWork.sf_LagFilter_a);
    rtb_AND_h0 = !rtb_y_jj;
    rtb_AND1 = !rtb_OR7;
    rtb_OR1 = (rtb_OR && rtb_AND1);
    if (rtb_OR1 && rtb_AND_h0) {
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
      rtb_OR3 = !rtb_OR;
      rtb_OR4 = (rtb_OR3 && rtb_OR7);
      if (rtb_OR4 && rtb_AND_h0) {
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
        rtb_AND1 = (rtb_OR3 && rtb_AND1);
        if ((rtb_AND1 && rtb_AND_h0) || (rtb_AND1 && rtb_y_jj)) {
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
        } else if (rtb_OR4 && rtb_y_jj) {
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
          rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
          rtb_q = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
          rtb_r = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
          rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
          rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
          rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
        } else if (rtb_OR1 && rtb_y_jj) {
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
          rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
          rtb_q = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
          rtb_r = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
          rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
          rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
          rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
        } else if (rtb_y_o && rtb_AND_h0) {
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

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_jj);
    rtb_AND1 = ((rtb_y_po != 0U) && rtb_y_jj);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_y_f);
    rtb_OR1 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_c(std::abs(A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data -
      A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) > A380PrimComputer_P.CompareToConstant_const_ll,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge,
      A380PrimComputer_P.ConfirmNode_timeDelay, &rtb_y_jj, &A380PrimComputer_DWork.sf_MATLABFunction_jz);
    rtb_y_o = (rtb_tripleAdrFault || (rtb_doubleAdrFault && A380PrimComputer_P.Constant1_Value_b));
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_y_o, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode2_isRisingEdge, A380PrimComputer_P.ConfirmNode2_timeDelay, &rtb_y_f,
      &A380PrimComputer_DWork.sf_MATLABFunction_lf);
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_y_o, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode1_isRisingEdge, A380PrimComputer_P.ConfirmNode1_timeDelay, &rtb_y_h,
      &A380PrimComputer_DWork.sf_MATLABFunction_jl);
    A380PrimComputer_DWork.ra1CoherenceRejected = (rtb_y_f || A380PrimComputer_DWork.ra1CoherenceRejected);
    A380PrimComputer_DWork.ra2CoherenceRejected = (rtb_y_h || A380PrimComputer_DWork.ra2CoherenceRejected);
    rtb_OR3 = ((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || A380PrimComputer_DWork.ra1CoherenceRejected);
    rtb_OR4 = ((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || A380PrimComputer_DWork.ra2CoherenceRejected);
    if (!A380PrimComputer_DWork.configFullEventTime_not_empty) {
      A380PrimComputer_DWork.configFullEventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.configFullEventTime_not_empty = true;
    }

    if ((!rtb_AND1) && (!rtb_OR1)) {
      A380PrimComputer_DWork.configFullEventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    rtb_AND_h0 = !rtb_OR4;
    rtb_AND1 = !rtb_OR3;
    if (rtb_AND1 && rtb_AND_h0) {
      if (rtb_y_jj) {
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
    } else if ((rtb_OR3 && rtb_AND_h0) || (rtb_AND1 && rtb_OR4)) {
      if ((rtb_V_ias > 180.0F) && rtb_y_o) {
        rtb_raComputationValue = 250.0F;
      } else if (rtb_OR4) {
        rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
      } else {
        rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
      }
    } else {
      rtb_raComputationValue = 250.0F;
    }

    rtb_AND1 = (rtb_OR3 && rtb_OR4);
    rtb_y_o = ((rtb_raComputationValue < A380PrimComputer_P.CompareToConstant_const) && (!rtb_AND1));
    rtb_y_jj = (A380PrimComputer_U.in.sim_data.slew_on || A380PrimComputer_U.in.sim_data.pause_on ||
                A380PrimComputer_U.in.sim_data.tracking_mode_on_override);
    A380PrimComputer_B.logic.tracking_mode_on = rtb_y_jj;
    A380PrimComputer_MATLABFunction_j(A380PrimComputer_U.in.analog_inputs.yellow_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode2_highTrigger, A380PrimComputer_P.HysteresisNode2_lowTrigger, &rtb_y_f,
      &A380PrimComputer_DWork.sf_MATLABFunction_jg);
    A380PrimComputer_MATLABFunction_c((!A380PrimComputer_U.in.discrete_inputs.yellow_low_pressure) && rtb_y_f,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge_k,
      A380PrimComputer_P.ConfirmNode_timeDelay_n, &rtb_y_jj, &A380PrimComputer_DWork.sf_MATLABFunction_cj);
    A380PrimComputer_MATLABFunction_j(A380PrimComputer_U.in.analog_inputs.green_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode3_highTrigger, A380PrimComputer_P.HysteresisNode3_lowTrigger, &rtb_y_f,
      &A380PrimComputer_DWork.sf_MATLABFunction_br);
    A380PrimComputer_MATLABFunction_c((!A380PrimComputer_U.in.discrete_inputs.green_low_pressure) && rtb_y_f,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode2_isRisingEdge_j,
      A380PrimComputer_P.ConfirmNode2_timeDelay_k, &rtb_y_f, &A380PrimComputer_DWork.sf_MATLABFunction_gfx);
    rtb_OR = rtb_y_f;
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_OR1 = rtb_y_f;
      rtb_OR3 = rtb_y_f;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_OR1 = rtb_y_f;
      rtb_OR3 = rtb_y_f;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_OR1 = rtb_y_jj;
      rtb_OR3 = rtb_y_jj;
    } else {
      rtb_OR1 = false;
      rtb_OR3 = false;
    }

    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch31 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word.SSM;
      rtb_y_oq = A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word.Data;
    } else {
      rtb_Switch31 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word.SSM;
      rtb_y_oq = A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_Switch31;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = rtb_y_oq;
    A380PrimComputer_MATLABFunction_e(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputer_P.BitfromLabel2_bit, &rtb_y_po);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_Switch31;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = rtb_y_oq;
    A380PrimComputer_MATLABFunction(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1, &rtb_y_k);
    rtb_AND1_e = ((rtb_y_po != 0U) && rtb_y_k);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_Switch31;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = rtb_y_oq;
    A380PrimComputer_MATLABFunction_e(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputer_P.BitfromLabel1_bit_b, &rtb_y_po);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_OR4 = true;
      rtb_OR7 = true;
      leftSpoilerHydraulicModeAvail = rtb_y_f;
      A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = true;
      rightSpoilerHydraulicModeAvail = rtb_y_f;
      A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = true;
      rtb_leftSpoilerHydraulicModeEngaged = rtb_y_f;
      rtb_leftSpoilerElectricModeEngaged = !rtb_y_f;
      rtb_rightSpoilerHydraulicModeEngaged = rtb_y_f;
      rtb_rightSpoilerElectricModeEngaged = rtb_leftSpoilerElectricModeEngaged;
      elevator1Avail = rtb_y_f;
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        rtb_OR4 = true;
        rtb_OR7 = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rtb_OR4 = rtb_y_jj;
        rtb_OR7 = rtb_y_jj;
      } else {
        rtb_OR4 = false;
        rtb_OR7 = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        leftSpoilerHydraulicModeAvail = rtb_y_jj;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = true;
        rightSpoilerHydraulicModeAvail = rtb_y_jj;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        leftSpoilerHydraulicModeAvail = rtb_y_f;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = true;
        rightSpoilerHydraulicModeAvail = rtb_y_f;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = true;
      } else {
        leftSpoilerHydraulicModeAvail = false;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = false;
        rightSpoilerHydraulicModeAvail = false;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = false;
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
        elevator1Avail = rtb_y_jj;
      } else {
        elevator1Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_y_f);
      }
    }

    rtb_AND1_e = (rtb_OR4 && (!rtb_AND1_e));
    rtb_rightAileron2Engaged = (rtb_OR7 && ((!rtb_y_k) || (rtb_y_po == 0U)));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch31 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word.SSM;
      rtb_y_oq = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word.Data;
    } else {
      rtb_Switch31 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word.SSM;
      rtb_y_oq = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word.Data;
    }

    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_Switch31;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = rtb_y_oq;
    A380PrimComputer_MATLABFunction(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1, &rtb_y_k);
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.SSM = rtb_Switch31;
    rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1.Data = rtb_y_oq;
    A380PrimComputer_MATLABFunction_e(&rtb_BusConversion_InsertedFor_MATLABFunction_at_inport_0_BusCreator1_c1,
      A380PrimComputer_P.BitfromLabel1_bit_n, &rtb_y_po);
    rtb_AND_cs = (rtb_y_k && (rtb_y_po != 0U));
    elevator2Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_1 ||
                      (A380PrimComputer_U.in.discrete_inputs.is_unit_2 ||
                       (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_y_jj)));
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND_h0 = !rtb_AND_cs;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND_h0 = !rtb_AND_cs;
    } else {
      rtb_AND_h0 = A380PrimComputer_U.in.discrete_inputs.is_unit_3;
    }

    rtb_AND_cs = (elevator2Avail && rtb_AND_h0);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_di);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel3_bit, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word, &rtb_y_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_l, &rtb_y_po);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_y_di = (rtb_y_di && (rtb_Switch31 != 0U));
    } else {
      rtb_y_di = (rtb_y_k && (rtb_y_po != 0U));
    }

    rtb_y_k = (A380PrimComputer_U.in.discrete_inputs.is_unit_1 || A380PrimComputer_U.in.discrete_inputs.is_unit_2);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND_h0 = !rtb_y_di;
    } else {
      rtb_AND_h0 = (A380PrimComputer_U.in.discrete_inputs.is_unit_2 && (!rtb_y_di));
    }

    rtb_y_di = (rtb_y_k && rtb_AND_h0);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_bv, &rtb_y_po);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      thsAvail = rtb_y_jj;
      rtb_AND_h0 = ((!rtb_y_f) || (rtb_y_po == 0U));
    } else {
      rtb_thsEngaged = !A380PrimComputer_U.in.discrete_inputs.is_unit_2;
      thsAvail = (rtb_thsEngaged && (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_OR));
      rtb_AND_h0 = (rtb_thsEngaged && A380PrimComputer_U.in.discrete_inputs.is_unit_3);
    }

    rtb_thsEngaged = (thsAvail && rtb_AND_h0);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_k, &rtb_y_po);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_e, &rtb_Switch31);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word, &rtb_y_f);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND_h0 = (rtb_y_po != 0U);
    } else {
      rtb_AND_h0 = (rtb_Switch31 != 0U);
    }

    rtb_AND_h0 = (rtb_AND_h0 && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_c, &rtb_y_po);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel4_bit, &rtb_Switch31);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeAvail = rtb_y_jj;
      rudder1ElectricModeAvail = true;
      rudder1HydraulicModeHasPriority = true;
      rudder1ElectricModeHasPriority = ((!rtb_AND_h0) && (!rtb_y_jj));
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        rudder1HydraulicModeAvail = rtb_OR;
        rudder1ElectricModeAvail = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeAvail = rtb_y_jj;
        rudder1ElectricModeAvail = true;
      } else {
        rudder1HydraulicModeAvail = false;
        rudder1ElectricModeAvail = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2 || A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeHasPriority = !rtb_AND_h0;
        if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
          rtb_AND_h0 = (rtb_y_po != 0U);
        } else {
          rtb_AND_h0 = (rtb_Switch31 != 0U);
        }

        rudder1ElectricModeHasPriority = (rudder1HydraulicModeHasPriority && ((!rtb_y_f) || (!rtb_AND_h0)) &&
          (!rudder1HydraulicModeAvail));
      } else {
        rudder1HydraulicModeHasPriority = false;
        rudder1ElectricModeHasPriority = false;
      }
    }

    rtb_AND_h0 = (rudder1HydraulicModeAvail && rudder1HydraulicModeHasPriority);
    rudder1HydraulicModeHasPriority = (rudder1ElectricModeAvail && rudder1ElectricModeHasPriority);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel5_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word, &rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel7_bit, &rtb_y_po);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rudder1ElectricModeHasPriority = rtb_OR;
      rudder2ElectricModeAvail = true;
      rudder2HydraulicModeHasPriority = true;
      rudder2ElectricModeHasPriority = (((!rtb_y_h) || (!rtb_y_f)) && (!rtb_OR));
    } else {
      rudder1ElectricModeHasPriority = false;
      rudder2ElectricModeAvail = false;
      rudder2HydraulicModeHasPriority = false;
      rudder2ElectricModeHasPriority = false;
    }

    rudder2HydraulicModeHasPriority = (rudder1ElectricModeHasPriority && rudder2HydraulicModeHasPriority);
    rudder2ElectricModeHasPriority = (rudder2ElectricModeAvail && rudder2ElectricModeHasPriority);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel_bit_i, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word, &rtb_y_f);
    rtb_AND5 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_c, &rtb_y_po);
    rtb_AND3_d = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_p, &rtb_y_po);
    rtb_AND2_ac = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_n, &rtb_y_po);
    rtb_AND1_at = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_j, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word, &rtb_y_f);
    rtb_AND4 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_i, &rtb_y_po);
    rtb_AND6 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel6_bit, &rtb_y_po);
    rtb_AND7 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_n, &rtb_y_po);
    rtb_y_f = ((rtb_y_po != 0U) && rtb_y_f);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_leftInboardAilEngaged = (rtb_OR1 || rtb_AND2_ac);
      rtb_rightInboardAilEngaged = (rtb_OR3 || rtb_AND1_at);
      rtb_AND2_ac = (rtb_AND1_e || rtb_AND4);
      rtb_AND1_at = (rtb_rightAileron2Engaged || rtb_AND6);
      rtb_AND4 = (rtb_AND5 || rtb_AND7);
      rtb_rightOutboardAilEngaged = (rtb_AND3_d || rtb_y_f);
      A380PrimComputer_B.logic.lateral_surface_positions.left_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.left_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.left_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.left_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.right_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.right_outboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_leftInboardAilEngaged = (rtb_AND1_e || rtb_AND5);
      rtb_rightInboardAilEngaged = (rtb_rightAileron2Engaged || rtb_AND3_d);
      rtb_AND2_ac = (rtb_AND2_ac || rtb_AND4);
      rtb_AND1_at = (rtb_AND1_at || rtb_AND6);
      rtb_AND4 = (rtb_OR1 || rtb_AND7);
      rtb_rightOutboardAilEngaged = (rtb_OR3 || rtb_y_f);
      A380PrimComputer_B.logic.lateral_surface_positions.left_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_inboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.left_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.left_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.right_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.right_midboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
      }

      A380PrimComputer_B.logic.lateral_surface_positions.left_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_leftInboardAilEngaged = (rtb_AND5 || rtb_AND7);
      rtb_rightInboardAilEngaged = (rtb_AND3_d || rtb_y_f);
      rtb_AND2_ac = (rtb_OR1 || rtb_AND2_ac);
      rtb_AND1_at = (rtb_OR3 || rtb_AND1_at);
      rtb_AND4 = (rtb_AND4 || rtb_AND1_e);
      rtb_rightOutboardAilEngaged = (rtb_AND6 || rtb_rightAileron2Engaged);
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.left_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.left_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.right_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.right_inboard_aileron_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
      }

      A380PrimComputer_B.logic.lateral_surface_positions.left_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_midboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.left_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_outboard_aileron_deg =
        A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
    } else {
      rtb_leftInboardAilEngaged = false;
      rtb_rightInboardAilEngaged = false;
      rtb_AND2_ac = false;
      rtb_AND1_at = false;
      rtb_AND4 = false;
      rtb_rightOutboardAilEngaged = false;
      A380PrimComputer_B.logic.lateral_surface_positions.left_inboard_aileron_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.right_inboard_aileron_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.left_midboard_aileron_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.right_midboard_aileron_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.left_outboard_aileron_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.right_outboard_aileron_deg = 0.0;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel8_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel9_bit, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word, &rtb_y_f);
    rtb_AND3_d = ((rtb_y_h || (rtb_y_po != 0U)) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel10_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel11_bit, &rtb_y_po);
    rtb_AND5 = ((rtb_y_h || (rtb_y_po != 0U)) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel14_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel15_bit, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word, &rtb_y_f);
    rtb_AND6 = ((rtb_y_h || (rtb_y_po != 0U)) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel12_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word,
      A380PrimComputer_P.BitfromLabel13_bit, &rtb_y_po);
    rtb_y_f = ((rtb_y_h || (rtb_y_po != 0U)) && rtb_y_f);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_4_engaged = (rtb_AND6 || rtb_y_f);
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_5_engaged = (rtb_AND3_d || rtb_AND5);
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_6_engaged = (rtb_leftSpoilerHydraulicModeEngaged ||
        rtb_leftSpoilerElectricModeEngaged || rtb_rightSpoilerHydraulicModeEngaged ||
        rtb_rightSpoilerElectricModeEngaged);
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_4_engaged = (rtb_AND6 || rtb_y_f);
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_5_engaged = (rtb_leftSpoilerHydraulicModeEngaged ||
        rtb_leftSpoilerElectricModeEngaged || rtb_rightSpoilerHydraulicModeEngaged ||
        rtb_rightSpoilerElectricModeEngaged);
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_6_engaged = (rtb_AND3_d || rtb_AND5);
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_4_engaged = (rtb_leftSpoilerHydraulicModeEngaged ||
        rtb_leftSpoilerElectricModeEngaged || rtb_rightSpoilerHydraulicModeEngaged ||
        rtb_rightSpoilerElectricModeEngaged);
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_5_engaged = (rtb_AND6 || rtb_y_f);
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_6_engaged = (rtb_AND3_d || rtb_AND5);
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_4_deg =
        A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_4_deg =
        A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    } else {
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_4_engaged = false;
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_5_engaged = false;
      A380PrimComputer_B.logic.surface_statuses.spoiler_pair_6_engaged = false;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_4_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_4_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_5_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_5_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_6_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_6_deg = 0.0;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel16_bit, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word, &rtb_y_f);
    rtb_AND7 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel17_bit, &rtb_y_po);
    rtb_AND6 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel18_bit, &rtb_y_po);
    rtb_AND14 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel19_bit, &rtb_y_po);
    rtb_AND12 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel20_bit, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word, &rtb_y_f);
    rtb_AND16 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel21_bit, &rtb_y_po);
    rtb_y_h = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel22_bit, &rtb_y_po);
    rtb_AND5 = ((rtb_y_po != 0U) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word,
      A380PrimComputer_P.BitfromLabel23_bit, &rtb_y_po);
    rtb_y_f = ((rtb_y_po != 0U) && rtb_y_f);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND3_d = (rtb_AND_cs || rtb_AND16);
      rtb_AND5 = (rtb_AND14 || rtb_y_h);
      rtb_AND6 = (elevator1Avail || rtb_AND6);
      rtb_AND7 = (rtb_AND7 || rtb_y_di);
      A380PrimComputer_B.logic.surface_statuses.ths_engaged = (rtb_thsEngaged || rtb_y_f);
      A380PrimComputer_B.logic.pitch_surface_positions.left_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.pitch_surface_positions.right_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.pitch_surface_positions.right_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      A380PrimComputer_B.logic.pitch_surface_positions.left_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      A380PrimComputer_B.logic.pitch_surface_positions.right_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg;
      A380PrimComputer_B.logic.pitch_surface_positions.ths_deg = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND3_d = (rtb_AND16 || rtb_AND6);
      rtb_AND5 = (rtb_y_di || rtb_y_h);
      rtb_AND6 = (rtb_AND_cs || rtb_AND7);
      rtb_AND7 = (elevator1Avail || rtb_AND14);
      A380PrimComputer_B.logic.surface_statuses.ths_engaged = (rtb_AND12 || rtb_y_f);
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.pitch_surface_positions.left_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.pitch_surface_positions.left_inboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
      }

      A380PrimComputer_B.logic.pitch_surface_positions.right_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg;
      A380PrimComputer_B.logic.pitch_surface_positions.left_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      A380PrimComputer_B.logic.pitch_surface_positions.right_outboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
           NormalOperation)) {
        A380PrimComputer_B.logic.pitch_surface_positions.ths_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.pitch_surface_positions.ths_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND3_d = (elevator1Avail || rtb_AND6);
      rtb_AND5 = (rtb_AND_cs || rtb_AND5);
      rtb_AND6 = (rtb_AND7 || rtb_y_h);
      rtb_AND7 = (rtb_AND16 || rtb_AND14);
      A380PrimComputer_B.logic.surface_statuses.ths_engaged = (rtb_thsEngaged || rtb_AND12);
      A380PrimComputer_B.logic.pitch_surface_positions.left_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
      A380PrimComputer_B.logic.pitch_surface_positions.right_inboard_elevator_deg =
        A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.pitch_surface_positions.left_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.pitch_surface_positions.left_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
      }

      if (A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.pitch_surface_positions.right_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.pitch_surface_positions.right_outboard_elevator_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
      }

      A380PrimComputer_B.logic.pitch_surface_positions.ths_deg = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    } else {
      rtb_AND3_d = false;
      rtb_AND5 = false;
      rtb_AND6 = false;
      rtb_AND7 = false;
      A380PrimComputer_B.logic.surface_statuses.ths_engaged = false;
      A380PrimComputer_B.logic.pitch_surface_positions.left_inboard_elevator_deg = 0.0;
      A380PrimComputer_B.logic.pitch_surface_positions.right_inboard_elevator_deg = 0.0;
      A380PrimComputer_B.logic.pitch_surface_positions.left_outboard_elevator_deg = 0.0;
      A380PrimComputer_B.logic.pitch_surface_positions.right_outboard_elevator_deg = 0.0;
      A380PrimComputer_B.logic.pitch_surface_positions.ths_deg = 0.0;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel38_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel39_bit, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word, &rtb_y_f);
    rtb_AND14 = ((rtb_y_h || (rtb_y_po != 0U)) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel32_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel33_bit, &rtb_y_po);
    rtb_AND12 = ((rtb_y_h || (rtb_y_po != 0U)) && rtb_y_f);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel36_bit, &rtb_y_po);
    rtb_y_h = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word,
      A380PrimComputer_P.BitfromLabel37_bit, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word, &rtb_y_f);
    rtb_y_f = ((rtb_y_h || (rtb_y_po != 0U)) && rtb_y_f);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND16 = (rtb_AND_h0 || rudder1HydraulicModeHasPriority || rtb_AND14);
      rtb_lowerRudderEngaged = (rudder2HydraulicModeHasPriority || rudder2ElectricModeHasPriority || rtb_y_f);
      A380PrimComputer_B.logic.lateral_surface_positions.upper_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
      A380PrimComputer_B.logic.lateral_surface_positions.lower_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND16 = (rtb_AND_h0 || rudder1HydraulicModeHasPriority || rtb_AND14);
      rtb_lowerRudderEngaged = (rtb_AND12 || rtb_y_f);
      A380PrimComputer_B.logic.lateral_surface_positions.upper_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.lower_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.lower_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND16 = (rtb_AND14 || rtb_y_f);
      rtb_lowerRudderEngaged = (rtb_AND_h0 || rudder1HydraulicModeHasPriority || rtb_AND12);
      if (A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM == static_cast<uint32_T>
          (SignStatusMatrix::NormalOperation)) {
        A380PrimComputer_B.logic.lateral_surface_positions.upper_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
      } else {
        A380PrimComputer_B.logic.lateral_surface_positions.upper_rudder_deg =
          A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
      }

      A380PrimComputer_B.logic.lateral_surface_positions.lower_rudder_deg =
        A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
    } else {
      rtb_AND16 = false;
      rtb_lowerRudderEngaged = false;
      A380PrimComputer_B.logic.lateral_surface_positions.upper_rudder_deg = 0.0;
      A380PrimComputer_B.logic.lateral_surface_positions.lower_rudder_deg = 0.0;
    }

    A380PrimComputer_B.logic.surface_statuses.left_inboard_aileron_engaged = rtb_leftInboardAilEngaged;
    A380PrimComputer_B.logic.surface_statuses.right_inboard_aileron_engaged = rtb_rightInboardAilEngaged;
    A380PrimComputer_B.logic.surface_statuses.left_midboard_aileron_engaged = rtb_AND2_ac;
    A380PrimComputer_B.logic.surface_statuses.right_midboard_aileron_engaged = rtb_AND1_at;
    A380PrimComputer_B.logic.surface_statuses.left_outboard_aileron_engaged = rtb_AND4;
    A380PrimComputer_B.logic.surface_statuses.right_outboard_aileron_engaged = rtb_rightOutboardAilEngaged;
    A380PrimComputer_MATLABFunction_c(A380PrimComputer_U.in.sim_data.slew_on, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode_isRisingEdge_o, A380PrimComputer_P.ConfirmNode_timeDelay_d, &rtb_y_f,
      &A380PrimComputer_DWork.sf_MATLABFunction_nb);
    rtb_AND14 = !rtb_y_o;
    rtb_AND12 = ((!rtb_y_f) && rtb_AND14 && (((!rtb_tripleAdrFault) && ((rtb_mach_h > 0.96) || (rtb_Y < -10.0) || (rtb_Y
      > 37.5) || (rtb_V_ias > 420.0F) || (rtb_V_ias < 70.0F))) || ((!rtb_tripleIrFault) && ((!rtb_doubleIrFault) ||
      (!A380PrimComputer_P.Constant_Value_ad)) && ((std::abs(static_cast<real_T>(rtb_phi)) > 120.0) || ((rtb_alpha >
      50.0F) || (rtb_alpha < -30.0F))))));
    A380PrimComputer_DWork.abnormalConditionWasActive = (rtb_AND12 || (rtb_AND14 &&
      A380PrimComputer_DWork.abnormalConditionWasActive));
    nz = ((rtb_AND3_d + rtb_AND5) + rtb_AND6) + rtb_AND7;
    b_x[0] = rtb_leftInboardAilEngaged;
    b_x[1] = rtb_rightInboardAilEngaged;
    b_x[2] = rtb_AND2_ac;
    b_x[3] = rtb_AND1_at;
    b_x[4] = rtb_AND4;
    b_x[5] = rtb_rightOutboardAilEngaged;
    b_nz = rtb_leftInboardAilEngaged;
    for (prim3LawCap = 0; prim3LawCap < 5; prim3LawCap++) {
      b_nz += b_x[prim3LawCap + 1];
    }

    if (rtb_AND12) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::DirectLaw;
    } else if (nz == 2) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1B;
    } else if (A380PrimComputer_DWork.abnormalConditionWasActive || ((rtb_AND16 && (!rtb_lowerRudderEngaged)) ||
                ((!rtb_AND16) && rtb_lowerRudderEngaged)) || (nz == 3) || (b_nz == 4)) {
      rtb_pitchLawCapability = a380_pitch_efcs_law::AlternateLaw1A;
    } else {
      rtb_pitchLawCapability = a380_pitch_efcs_law::NormalLaw;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel_bit_o, &rtb_y_po);
    rtb_leftInboardAilEngaged = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_e, &rtb_y_po);
    rtb_rightInboardAilEngaged = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_h, &rtb_y_po);
    rtb_AND2_ac = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel6_bit_k, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_f);
    A380PrimComputer_MATLABFunction_ek(rtb_leftInboardAilEngaged, rtb_rightInboardAilEngaged, rtb_AND2_ac, rtb_y_f,
      &rtb_law_k);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_l, &rtb_y_po);
    rtb_leftInboardAilEngaged = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_b, &rtb_y_po);
    rtb_rightInboardAilEngaged = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_p, &rtb_y_po);
    rtb_AND2_ac = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel7_bit_h, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word, &rtb_y_f);
    A380PrimComputer_MATLABFunction_ek(rtb_leftInboardAilEngaged, rtb_rightInboardAilEngaged, rtb_AND2_ac, rtb_y_f,
      &rtb_law);
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
      rtb_leftInboardAilEngaged = (iindx == 1);
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_leftInboardAilEngaged = (iindx == 2);
    } else {
      rtb_leftInboardAilEngaged = (iindx == 3);
    }

    if (!rtb_leftInboardAilEngaged) {
      rtb_law_k = a380_pitch_efcs_law::None;
      rtb_activeLateralLaw = a380_lateral_efcs_law::None;
    } else {
      rtb_law_k = rtb_pitchLawCapability;
      rtb_activeLateralLaw = a380_lateral_efcs_law::NormalLaw;
    }

    A380PrimComputer_MATLABFunction_m(A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode_isRisingEdge, &rtb_y_h, &A380PrimComputer_DWork.sf_MATLABFunction_g4);
    A380PrimComputer_MATLABFunction_m(A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode1_isRisingEdge, &rtb_y_f, &A380PrimComputer_DWork.sf_MATLABFunction_nu);
    if (rtb_y_h) {
      A380PrimComputer_DWork.pRightStickDisabled = true;
      A380PrimComputer_DWork.pLeftStickDisabled = false;
    } else if (rtb_y_f) {
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

    A380PrimComputer_MATLABFunction_c(A380PrimComputer_DWork.pLeftStickDisabled &&
      (A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || A380PrimComputer_DWork.Delay_DSTATE_cc),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode1_isRisingEdge_k,
      A380PrimComputer_P.ConfirmNode1_timeDelay_a, &A380PrimComputer_DWork.Delay_DSTATE_cc,
      &A380PrimComputer_DWork.sf_MATLABFunction_j2);
    A380PrimComputer_MATLABFunction_c(A380PrimComputer_DWork.pRightStickDisabled &&
      (A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || A380PrimComputer_DWork.Delay1_DSTATE),
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge_j,
      A380PrimComputer_P.ConfirmNode_timeDelay_a, &A380PrimComputer_DWork.Delay1_DSTATE,
      &A380PrimComputer_DWork.sf_MATLABFunction_g24);
    if (!A380PrimComputer_DWork.pRightStickDisabled) {
      rtb_left_spoiler_3_deg = A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant_Value_p;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      rtb_Y_j = A380PrimComputer_P.Constant_Value_p;
    } else {
      rtb_Y_j = A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    rtb_Y_j += rtb_left_spoiler_3_deg;
    if (rtb_Y_j > A380PrimComputer_P.Saturation_UpperSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation_UpperSat;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation_LowerSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation_LowerSat;
    }

    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_h, &rtb_y_po);
    rtb_y_f = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_g, &rtb_y_po);
    rtb_rightInboardAilEngaged = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_n, &rtb_y_po);
    rtb_AND2_ac = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_g, &rtb_y_po);
    rtb_AND1_at = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_e, &rtb_y_po);
    rtb_AND4 = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_a, &rtb_y_po);
    A380PrimComputer_MATLABFunction_o(rtb_y_f, rtb_rightInboardAilEngaged, rtb_AND2_ac, rtb_AND1_at, rtb_AND4, rtb_y_po
      != 0U, &rtb_handleIndex);
    A380PrimComputer_RateLimiter_n(look2_binlxpw(static_cast<real_T>(rtb_mach_h), rtb_handleIndex,
      A380PrimComputer_P.alphamax_bp01Data, A380PrimComputer_P.alphamax_bp02Data, A380PrimComputer_P.alphamax_tableData,
      A380PrimComputer_P.alphamax_maxIndex, 4U), A380PrimComputer_P.RateLimiterGenericVariableTs_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo, A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value,
      &rtb_Switch_h, &A380PrimComputer_DWork.sf_RateLimiter_ne);
    if (!A380PrimComputer_DWork.eventTime_not_empty_a) {
      A380PrimComputer_DWork.eventTime_g = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.eventTime_not_empty_a = true;
    }

    if (rtb_y_o || (A380PrimComputer_DWork.eventTime_g == 0.0)) {
      A380PrimComputer_DWork.eventTime_g = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_RateLimiter_n(look2_binlxpw(static_cast<real_T>(rtb_mach_h), rtb_handleIndex,
      A380PrimComputer_P.alphaprotection_bp01Data, A380PrimComputer_P.alphaprotection_bp02Data,
      A380PrimComputer_P.alphaprotection_tableData, A380PrimComputer_P.alphaprotection_maxIndex, 4U),
      A380PrimComputer_P.RateLimiterGenericVariableTs1_up, A380PrimComputer_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value_j, &rtb_Switch8_o,
      &A380PrimComputer_DWork.sf_RateLimiter_mr);
    if (A380PrimComputer_U.in.time.simulation_time - A380PrimComputer_DWork.eventTime_g <=
        A380PrimComputer_P.CompareToConstant_const_l) {
      rtb_handleIndex = rtb_Switch_h;
    } else {
      rtb_handleIndex = rtb_Switch8_o;
    }

    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach_h), A380PrimComputer_P.Constant6_Value_b,
      static_cast<real_T>(rtb_V_ias), &rtb_Switch8_o);
    A380PrimComputer_B.logic.high_speed_prot_lo_thresh_kn = std::fmin(A380PrimComputer_P.Constant5_Value_k,
      rtb_Switch8_o);
    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach_h), A380PrimComputer_P.Constant8_Value_h,
      static_cast<real_T>(rtb_V_ias), &rtb_Switch8_o);
    rtb_y_f = ((rtb_law_k == a380_pitch_efcs_law::NormalLaw) || (rtb_activeLateralLaw == a380_lateral_efcs_law::
                NormalLaw));
    if (!A380PrimComputer_DWork.resetEventTime_not_empty) {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.resetEventTime_not_empty = true;
    }

    if ((rtb_Y_j >= -0.03125) || (rtb_Y >= rtb_Switch_h) || (A380PrimComputer_DWork.resetEventTime == 0.0)) {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_DWork.sProtActive = ((rtb_AND14 && rtb_y_f && (rtb_Y > rtb_handleIndex) &&
      (A380PrimComputer_U.in.time.monotonic_time > 10.0)) || A380PrimComputer_DWork.sProtActive);
    A380PrimComputer_DWork.sProtActive = ((A380PrimComputer_U.in.time.simulation_time -
      A380PrimComputer_DWork.resetEventTime <= 0.5) && (rtb_Y_j >= -0.5) && ((rtb_raComputationValue >= 200.0F) ||
      (rtb_Y_j >= 0.5) || (rtb_Y >= rtb_handleIndex - 2.0)) && rtb_AND14 && rtb_y_f &&
      A380PrimComputer_DWork.sProtActive);
    if (A380PrimComputer_DWork.is_active_c28_A380PrimComputer == 0U) {
      A380PrimComputer_DWork.is_active_c28_A380PrimComputer = 1U;
      A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
      nz = 0;
    } else {
      switch (A380PrimComputer_DWork.is_c28_A380PrimComputer) {
       case A380PrimComputer_IN_Flying:
        if (rtb_raComputationValue < 100.0F) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landing100ft;
          nz = 1;
        } else if (rtb_y_o) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
          nz = 0;
        } else {
          nz = 0;
        }
        break;

       case A380PrimComputer_IN_Landed:
        if (!rtb_y_o) {
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
        } else if (rtb_y_o) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
          nz = 0;
        } else {
          nz = 1;
        }
        break;

       default:
        if (rtb_y_o) {
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

    if ((rtb_V_ias <= std::fmin(365.0, (look1_binlxpw(rtb_alpha - std::cos(A380PrimComputer_P.Gain1_Gain * rtb_phi) *
            rtb_Y, A380PrimComputer_P.uDLookupTable_bp01Data_m, A380PrimComputer_P.uDLookupTable_tableData_n, 3U) + 0.01)
          * (static_cast<real_T>(rtb_V_ias) / rtb_mach_h))) || ((rtb_law_k != a380_pitch_efcs_law::NormalLaw) &&
         (rtb_activeLateralLaw != a380_lateral_efcs_law::NormalLaw)) || (A380PrimComputer_DWork.eventTime == 0.0)) {
      A380PrimComputer_DWork.eventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_B.logic.surface_statuses.spoiler_pair_1_engaged = A380PrimComputer_P.Constant_Value_o;
    A380PrimComputer_B.logic.surface_statuses.spoiler_pair_2_engaged = A380PrimComputer_P.Constant_Value_o;
    A380PrimComputer_B.logic.surface_statuses.spoiler_pair_3_engaged = A380PrimComputer_P.Constant_Value_o;
    A380PrimComputer_B.logic.surface_statuses.spoiler_pair_7_engaged = A380PrimComputer_P.Constant_Value_o;
    A380PrimComputer_B.logic.surface_statuses.spoiler_pair_8_engaged = A380PrimComputer_P.Constant_Value_o;
    A380PrimComputer_B.logic.surface_statuses.left_inboard_elevator_engaged = rtb_AND3_d;
    A380PrimComputer_B.logic.surface_statuses.right_inboard_elevator_engaged = rtb_AND5;
    A380PrimComputer_B.logic.surface_statuses.left_outboard_elevator_engaged = rtb_AND6;
    A380PrimComputer_B.logic.surface_statuses.right_outboard_elevator_engaged = rtb_AND7;
    A380PrimComputer_B.logic.surface_statuses.upper_rudder_engaged = rtb_AND16;
    A380PrimComputer_B.logic.surface_statuses.lower_rudder_engaged = rtb_lowerRudderEngaged;
    A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_1_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_1_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_2_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_2_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_3_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_3_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_7_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_7_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_8_deg = 0.0;
    A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_8_deg = 0.0;
    A380PrimComputer_B.logic.is_yellow_hydraulic_power_avail = rtb_y_jj;
    rtb_y_jj = (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos >= A380PrimComputer_P.CompareToConstant4_const);
    rtb_y_f = (A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos >= A380PrimComputer_P.CompareToConstant1_const);
    rtb_y_h = (A380PrimComputer_P.Constant_Value_h || A380PrimComputer_DWork.sProtActive ||
               ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos >= A380PrimComputer_P.CompareToConstant3_const) ||
                rtb_y_jj || rtb_y_f || (A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos >=
      A380PrimComputer_P.CompareToConstant2_const)));
    A380PrimComputer_MATLABFunction_c(A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos <
      A380PrimComputer_P.CompareToConstant_const_n, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode_isRisingEdge_c, A380PrimComputer_P.ConfirmNode_timeDelay_g, &rtb_y_f,
      &A380PrimComputer_DWork.sf_MATLABFunction_al);
    A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_y_h) << 1)
      + rtb_y_f) << 1) + A380PrimComputer_DWork.Memory_PreviousInput];
    A380PrimComputer_B.logic.speed_brake_inhibited = (rtb_y_h || A380PrimComputer_DWork.Memory_PreviousInput);
    A380PrimComputer_MATLABFunction_m(rtb_y_o, A380PrimComputer_P.PulseNode3_isRisingEdge, &rtb_y_jj,
      &A380PrimComputer_DWork.sf_MATLABFunction_jj);
    A380PrimComputer_MATLABFunction_m(rtb_y_o, A380PrimComputer_P.PulseNode2_isRisingEdge, &rtb_y_f,
      &A380PrimComputer_DWork.sf_MATLABFunction_ej);
    A380PrimComputer_DWork.Memory_PreviousInput_j = A380PrimComputer_P.Logic_table_h[(((static_cast<uint32_T>(rtb_y_jj ||
      (((A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed < A380PrimComputer_P.CompareToConstant23_const) ||
        (A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed < A380PrimComputer_P.CompareToConstant21_const)) &&
       ((A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed < A380PrimComputer_P.CompareToConstant22_const) ||
        (A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed < A380PrimComputer_P.CompareToConstant24_const)))) <<
      1) + rtb_y_f) << 1) + A380PrimComputer_DWork.Memory_PreviousInput_j];
    rtb_y_h = (A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed >=
               A380PrimComputer_P.CompareToConstant20_const);
    rtb_y_f = (((A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed >=
                 A380PrimComputer_P.CompareToConstant5_const) ||
                (A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed >=
                 A380PrimComputer_P.CompareToConstant6_const)) &&
               ((A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed >=
                 A380PrimComputer_P.CompareToConstant19_const) || rtb_y_h));
    A380PrimComputer_MATLABFunction_m(false, A380PrimComputer_P.PulseNode1_isRisingEdge_c, &rtb_y_h,
      &A380PrimComputer_DWork.sf_MATLABFunction_ja);
    rtb_y_jj = (rtb_y_h || (rtb_y_f && A380PrimComputer_DWork.Memory_PreviousInput_j));
    rtb_y_f = (A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos < A380PrimComputer_P.CompareToConstant_const_m);
    A380PrimComputer_DWork.Delay1_DSTATE_b = (((((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos >
      A380PrimComputer_P.CompareToConstant15_const) || rtb_y_f) && ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos
      <= A380PrimComputer_P.CompareToConstant1_const_p) || (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <=
      A380PrimComputer_P.CompareToConstant2_const_i))) || (((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <
      A380PrimComputer_P.CompareToConstant3_const_e) && (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <=
      A380PrimComputer_P.CompareToConstant4_const_c)) || ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <=
      A380PrimComputer_P.CompareToConstant13_const) && (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <
      A380PrimComputer_P.CompareToConstant14_const)))) && (rtb_y_jj || A380PrimComputer_DWork.Delay1_DSTATE_b));
    rtb_y_h = (A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <= A380PrimComputer_P.CompareToConstant8_const);
    rtb_y_jj = (((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos < A380PrimComputer_P.CompareToConstant17_const) &&
                 (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <= A380PrimComputer_P.CompareToConstant18_const)) ||
                (rtb_y_h && (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <
      A380PrimComputer_P.CompareToConstant9_const)));
    A380PrimComputer_MATLABFunction_m(false, A380PrimComputer_P.PulseNode_isRisingEdge_n, &rtb_y_h,
      &A380PrimComputer_DWork.sf_MATLABFunction_mb);
    A380PrimComputer_DWork.Delay_DSTATE_f = (((((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos >
      A380PrimComputer_P.CompareToConstant10_const) || rtb_y_f) && ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos
      <= A380PrimComputer_P.CompareToConstant7_const) && (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <=
      A380PrimComputer_P.CompareToConstant16_const))) || rtb_y_jj) && (rtb_y_h || A380PrimComputer_DWork.Delay_DSTATE_f));
    rtb_y_h = ((!A380PrimComputer_DWork.Delay1_DSTATE_b) && A380PrimComputer_DWork.Delay_DSTATE_f);
    A380PrimComputer_B.logic.ground_spoilers_armed = rtb_y_f;
    A380PrimComputer_B.logic.phased_lift_dumping_active = rtb_y_h;
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_e, &rtb_y_po);
    rtb_y_jj = (rtb_y_po == 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_h);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_d, &rtb_y_po);
    rtb_y_f = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_y_f);
    A380PrimComputer_B.logic.on_ground = rtb_y_o;
    A380PrimComputer_B.logic.lateral_law_capability = a380_lateral_efcs_law::NormalLaw;
    A380PrimComputer_B.logic.active_lateral_law = rtb_activeLateralLaw;
    A380PrimComputer_B.logic.pitch_law_capability = rtb_pitchLawCapability;
    A380PrimComputer_B.logic.active_pitch_law = rtb_law_k;
    A380PrimComputer_B.logic.abnormal_condition_law_active = rtb_AND12;
    A380PrimComputer_B.logic.is_master_prim = rtb_leftInboardAilEngaged;
    A380PrimComputer_B.logic.elevator_1_avail = elevator1Avail;
    A380PrimComputer_B.logic.elevator_1_engaged = elevator1Avail;
    A380PrimComputer_B.logic.elevator_2_avail = elevator2Avail;
    A380PrimComputer_B.logic.elevator_2_engaged = rtb_AND_cs;
    A380PrimComputer_B.logic.elevator_3_avail = rtb_y_k;
    A380PrimComputer_B.logic.elevator_3_engaged = rtb_y_di;
    A380PrimComputer_B.logic.ths_avail = thsAvail;
    A380PrimComputer_B.logic.ths_engaged = rtb_thsEngaged;
    A380PrimComputer_B.logic.left_aileron_1_avail = rtb_OR1;
    A380PrimComputer_B.logic.left_aileron_1_engaged = rtb_OR1;
    A380PrimComputer_B.logic.left_aileron_2_avail = rtb_OR4;
    A380PrimComputer_B.logic.left_aileron_2_engaged = rtb_AND1_e;
    A380PrimComputer_B.logic.right_aileron_1_avail = rtb_OR3;
    A380PrimComputer_B.logic.right_aileron_1_engaged = rtb_OR3;
    A380PrimComputer_B.logic.right_aileron_2_avail = rtb_OR7;
    A380PrimComputer_B.logic.right_aileron_2_engaged = rtb_rightAileron2Engaged;
    A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_avail = leftSpoilerHydraulicModeAvail;
    A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_engaged = rtb_leftSpoilerHydraulicModeEngaged;
    A380PrimComputer_B.logic.left_spoiler_electric_mode_engaged = rtb_leftSpoilerElectricModeEngaged;
    A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_avail = rightSpoilerHydraulicModeAvail;
    A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_engaged = rtb_rightSpoilerHydraulicModeEngaged;
    A380PrimComputer_B.logic.right_spoiler_electric_mode_engaged = rtb_rightSpoilerElectricModeEngaged;
    A380PrimComputer_B.logic.rudder_1_hydraulic_mode_avail = rudder1HydraulicModeAvail;
    A380PrimComputer_B.logic.rudder_1_electric_mode_avail = rudder1ElectricModeAvail;
    A380PrimComputer_B.logic.rudder_1_hydraulic_mode_engaged = rtb_AND_h0;
    A380PrimComputer_B.logic.rudder_1_electric_mode_engaged = rudder1HydraulicModeHasPriority;
    A380PrimComputer_B.logic.rudder_2_hydraulic_mode_avail = rudder1ElectricModeHasPriority;
    A380PrimComputer_B.logic.rudder_2_electric_mode_avail = rudder2ElectricModeAvail;
    A380PrimComputer_B.logic.rudder_2_hydraulic_mode_engaged = rudder2HydraulicModeHasPriority;
    A380PrimComputer_B.logic.rudder_2_electric_mode_engaged = rudder2ElectricModeHasPriority;
    A380PrimComputer_B.logic.aileron_droop_active = ((rtb_y_jj && rtb_y_h) || ((rtb_y_po == 0U) && rtb_y_f));
    A380PrimComputer_B.logic.aileron_antidroop_active = A380PrimComputer_DWork.Delay1_DSTATE_b;
    A380PrimComputer_B.logic.is_green_hydraulic_power_avail = rtb_OR;
    A380PrimComputer_B.logic.left_sidestick_disabled = A380PrimComputer_DWork.pLeftStickDisabled;
    A380PrimComputer_B.logic.right_sidestick_disabled = A380PrimComputer_DWork.pRightStickDisabled;
    A380PrimComputer_B.logic.left_sidestick_priority_locked = A380PrimComputer_DWork.Delay_DSTATE_cc;
    A380PrimComputer_B.logic.right_sidestick_priority_locked = A380PrimComputer_DWork.Delay1_DSTATE;
    A380PrimComputer_B.logic.total_sidestick_pitch_command = rtb_Y_j;
    if (!A380PrimComputer_DWork.pRightStickDisabled) {
      rtb_left_spoiler_3_deg = A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant1_Value_p;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      rtb_Y_j = A380PrimComputer_P.Constant1_Value_p;
    } else {
      rtb_Y_j = A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    rtb_Y_j += rtb_left_spoiler_3_deg;
    if (rtb_Y_j > A380PrimComputer_P.Saturation1_UpperSat) {
      A380PrimComputer_B.logic.total_sidestick_roll_command = A380PrimComputer_P.Saturation1_UpperSat;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation1_LowerSat) {
      A380PrimComputer_B.logic.total_sidestick_roll_command = A380PrimComputer_P.Saturation1_LowerSat;
    } else {
      A380PrimComputer_B.logic.total_sidestick_roll_command = rtb_Y_j;
    }

    A380PrimComputer_B.logic.ground_spoilers_out = A380PrimComputer_DWork.Delay1_DSTATE_b;
    A380PrimComputer_B.logic.ap_authorised = false;
    A380PrimComputer_B.logic.protection_ap_disconnect = ((rtb_AND14 && (((nz != 0) && (rtb_Y > rtb_Switch_h)) || (rtb_Y >
      rtb_handleIndex + 0.25)) && ((rtb_law_k == a380_pitch_efcs_law::NormalLaw) || (rtb_activeLateralLaw ==
      a380_lateral_efcs_law::NormalLaw))) || (A380PrimComputer_U.in.time.simulation_time -
      A380PrimComputer_DWork.eventTime > 3.0) || A380PrimComputer_DWork.sProtActive);
    A380PrimComputer_B.logic.high_alpha_prot_active = A380PrimComputer_DWork.sProtActive;
    A380PrimComputer_B.logic.alpha_prot_deg = rtb_handleIndex;
    A380PrimComputer_B.logic.alpha_max_deg = rtb_Switch_h;
    A380PrimComputer_B.logic.high_speed_prot_active = false;
    A380PrimComputer_B.logic.high_speed_prot_hi_thresh_kn = std::fmin(A380PrimComputer_P.Constant7_Value_g,
      rtb_Switch8_o);
    A380PrimComputer_B.logic.double_adr_failure = rtb_doubleAdrFault;
    A380PrimComputer_B.logic.triple_adr_failure = rtb_tripleAdrFault;
    A380PrimComputer_B.logic.cas_or_mach_disagree = A380PrimComputer_P.Constant1_Value_b;
    A380PrimComputer_B.logic.alpha_disagree = A380PrimComputer_P.Constant1_Value_b;
    A380PrimComputer_B.logic.double_ir_failure = rtb_doubleIrFault;
    A380PrimComputer_B.logic.triple_ir_failure = rtb_tripleIrFault;
    A380PrimComputer_B.logic.ir_failure_not_self_detected = A380PrimComputer_P.Constant_Value_ad;
    A380PrimComputer_B.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    A380PrimComputer_B.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    A380PrimComputer_B.logic.adr_computation_data.mach = rtb_mach_h;
    A380PrimComputer_B.logic.adr_computation_data.alpha_deg = rtb_Y;
    A380PrimComputer_B.logic.ir_computation_data.theta_deg = rtb_alpha;
    A380PrimComputer_B.logic.ir_computation_data.phi_deg = rtb_phi;
    A380PrimComputer_B.logic.ir_computation_data.q_deg_s = rtb_q;
    A380PrimComputer_B.logic.ir_computation_data.r_deg_s = rtb_r;
    A380PrimComputer_B.logic.ir_computation_data.n_x_g = rtb_n_x;
    A380PrimComputer_B.logic.ir_computation_data.n_y_g = rtb_n_y;
    A380PrimComputer_B.logic.ir_computation_data.n_z_g = rtb_n_z;
    A380PrimComputer_B.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    A380PrimComputer_B.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    A380PrimComputer_B.logic.ra_computation_data_ft = rtb_raComputationValue;
    A380PrimComputer_B.logic.dual_ra_failure = rtb_AND1;
    rtb_doubleAdrFault = (A380PrimComputer_B.logic.tracking_mode_on || (static_cast<real_T>
      (A380PrimComputer_B.logic.active_lateral_law) != A380PrimComputer_P.CompareToConstant_const_m4));
    LawMDLOBJ2.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.r_deg_s,
                    &A380PrimComputer_B.logic.ir_computation_data.phi_dot_deg_s, &A380PrimComputer_P.Constant_Value_a,
                    &A380PrimComputer_B.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputer_B.logic.total_sidestick_roll_command,
                    &A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos, &A380PrimComputer_B.logic.on_ground,
                    &rtb_doubleAdrFault, &A380PrimComputer_B.logic.high_alpha_prot_active,
                    &A380PrimComputer_B.logic.high_speed_prot_active, (const_cast<real_T*>(&A380PrimComputer_RGND)), (
      const_cast<real_T*>(&A380PrimComputer_RGND)), (const_cast<boolean_T*>(&A380PrimComputer_BGND)),
                    &rtb_xi_inboard_deg, &rtb_xi_midboard_deg, &rtb_xi_outboard_deg, &rtb_xi_spoiler_deg,
                    &rtb_zeta_upper_deg, &rtb_zeta_lower_deg);
    LawMDLOBJ1.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.total_sidestick_roll_command, (const_cast<
      real_T*>(&A380PrimComputer_RGND)), &rtb_xi_inboard_deg_n, &rtb_xi_midboard_deg_a, &rtb_xi_outboard_deg_l,
                    &rtb_xi_spoiler_deg_i, &rtb_zeta_upper_deg_p, &rtb_zeta_lower_deg_n);
    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_lateral_law)) {
     case 0:
      rtb_handleIndex = rtb_xi_inboard_deg;
      break;

     case 1:
      rtb_handleIndex = rtb_xi_inboard_deg_n;
      break;

     default:
      rtb_handleIndex = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    if (A380PrimComputer_B.logic.aileron_droop_active) {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant2_Value;
    } else {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant1_Value;
    }

    A380PrimComputer_RateLimiter(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterVariableTs2_up,
      A380PrimComputer_P.RateLimiterVariableTs2_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter);
    if (A380PrimComputer_B.logic.aileron_antidroop_active) {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant4_Value_a;
    } else {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant3_Value;
    }

    A380PrimComputer_RateLimiter(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterVariableTs3_up,
      A380PrimComputer_P.RateLimiterVariableTs3_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterVariableTs3_InitialCondition, &rtb_Y_j, &A380PrimComputer_DWork.sf_RateLimiter_b);
    rtb_Y = rtb_Switch8_o + rtb_Y_j;
    rtb_Y_j = A380PrimComputer_P.Gain_Gain * rtb_handleIndex + rtb_Y;
    if (rtb_Y_j > A380PrimComputer_P.Saturation2_UpperSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation2_UpperSat;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation2_LowerSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation2_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs_up_b,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo_k, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_inboard_aileron_deg,
      (!A380PrimComputer_B.logic.surface_statuses.left_inboard_aileron_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_a);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel_bit_l, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_jj);
    rtb_doubleAdrFault = ((rtb_y_po != 0U) && rtb_y_jj);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_inboard_aileron_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_inboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_inboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
    }

    rtb_Y_j = rtb_Y + rtb_handleIndex;
    if (rtb_Y_j > A380PrimComputer_P.Saturation1_UpperSat_a) {
      rtb_Y_j = A380PrimComputer_P.Saturation1_UpperSat_a;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation1_LowerSat_p) {
      rtb_Y_j = A380PrimComputer_P.Saturation1_LowerSat_p;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs1_up_k,
      A380PrimComputer_P.RateLimiterGenericVariableTs1_lo_i, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_inboard_aileron_deg,
      (!A380PrimComputer_B.logic.surface_statuses.right_inboard_aileron_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_n);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_inboard_aileron_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_inboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_inboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_lateral_law)) {
     case 0:
      rtb_Switch_h = rtb_xi_midboard_deg;
      break;

     case 1:
      rtb_Switch_h = rtb_xi_midboard_deg_a;
      break;

     default:
      rtb_Switch_h = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    rtb_Y_j = A380PrimComputer_P.Gain3_Gain * rtb_Switch_h + rtb_Y;
    if (rtb_Y_j > A380PrimComputer_P.Saturation3_UpperSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation3_UpperSat;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation3_LowerSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation3_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs2_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs2_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_midboard_aileron_deg,
      (!A380PrimComputer_B.logic.surface_statuses.left_midboard_aileron_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_f);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_midboard_aileron_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_midboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_midboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
    }

    rtb_Y_j = rtb_Y + rtb_Switch_h;
    if (rtb_Y_j > A380PrimComputer_P.Saturation4_UpperSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation4_UpperSat;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation4_LowerSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation4_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs3_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs3_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_midboard_aileron_deg,
      (!A380PrimComputer_B.logic.surface_statuses.right_midboard_aileron_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_au);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_midboard_aileron_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_midboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_midboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_lateral_law)) {
     case 0:
      rtb_Switch_h = rtb_xi_outboard_deg;
      break;

     case 1:
      rtb_Switch_h = rtb_xi_outboard_deg_l;
      break;

     default:
      rtb_Switch_h = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    rtb_Y_j = A380PrimComputer_P.Gain4_Gain * rtb_Switch_h + rtb_Y;
    if (rtb_Y_j > A380PrimComputer_P.Saturation5_UpperSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation5_UpperSat;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation5_LowerSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation5_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs4_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs4_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_outboard_aileron_deg,
      (!A380PrimComputer_B.logic.surface_statuses.left_outboard_aileron_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_mn);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_outboard_aileron_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_outboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_outboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
    }

    rtb_Y_j = rtb_Y + rtb_Switch_h;
    if (rtb_Y_j > A380PrimComputer_P.Saturation6_UpperSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation6_UpperSat;
    } else if (rtb_Y_j < A380PrimComputer_P.Saturation6_LowerSat) {
      rtb_Y_j = A380PrimComputer_P.Saturation6_LowerSat;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs5_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs5_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_outboard_aileron_deg,
      (!A380PrimComputer_B.logic.surface_statuses.right_outboard_aileron_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_lm);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_outboard_aileron_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_outboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_outboard_aileron_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
    }

    if (A380PrimComputer_B.logic.phased_lift_dumping_active) {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant5_Value;
    } else {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant6_Value;
    }

    A380PrimComputer_RateLimiter(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterVariableTs4_up,
      A380PrimComputer_P.RateLimiterVariableTs4_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterVariableTs4_InitialCondition, &rtb_Y_j, &A380PrimComputer_DWork.sf_RateLimiter_c);
    if (A380PrimComputer_B.logic.ground_spoilers_out) {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant_Value;
    } else {
      rtb_left_spoiler_3_deg = rtb_Y_j;
    }

    A380PrimComputer_RateLimiter(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterVariableTs6_up,
      A380PrimComputer_P.RateLimiterVariableTs6_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterVariableTs6_InitialCondition, &rtb_Y_j, &A380PrimComputer_DWork.sf_RateLimiter_g);
    rtb_Switch_h = A380PrimComputer_P.Gain5_Gain * rtb_Y_j;
    rtb_y_f = (A380PrimComputer_B.logic.ground_spoilers_out || A380PrimComputer_B.logic.phased_lift_dumping_active);
    if (A380PrimComputer_B.logic.speed_brake_inhibited) {
      rtb_Switch8_o = A380PrimComputer_P.Constant8_Value_d;
    } else {
      rtb_Switch8_o = look1_binlxpw(A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos,
        A380PrimComputer_P.uDLookupTable_bp01Data, A380PrimComputer_P.uDLookupTable_tableData, 4U);
    }

    A380PrimComputer_RateLimiter_m(rtb_Switch8_o, A380PrimComputer_P.RateLimiterGenericVariableTs24_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs24_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterGenericVariableTs24_InitialCondition, A380PrimComputer_P.reset_Value_f,
      &rtb_handleIndex, &A380PrimComputer_DWork.sf_RateLimiter_me);
    A380PrimComputer_Spoiler12SpeedbrakeGain(rtb_handleIndex, &rtb_Switch8_o);
    if (A380PrimComputer_P.Constant7_Value_n) {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant9_Value;
    } else {
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant8_Value_d;
    }

    A380PrimComputer_RateLimiter_m(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterGenericVariableTs25_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs25_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterGenericVariableTs25_InitialCondition, A380PrimComputer_P.reset_Value_l, &rtb_Y,
      &A380PrimComputer_DWork.sf_RateLimiter_md);
    rtb_left_spoiler_3_deg = rtb_Switch8_o + rtb_Y;
    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Switch_h;
    } else {
      rtb_eta_deg_dv = rtb_left_spoiler_3_deg;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs8_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs8_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_1_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_1_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_j4);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_1_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_1_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_1_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Switch_h;
    } else {
      rtb_eta_deg_dv = rtb_left_spoiler_3_deg;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs9_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs9_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_1_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_1_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_cd);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_1_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_1_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_1_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Switch_h;
    } else {
      rtb_eta_deg_dv = rtb_left_spoiler_3_deg;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs10_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs10_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_2_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_2_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_l);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_2_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_2_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_2_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_left_spoiler_3_deg = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a(rtb_left_spoiler_3_deg, A380PrimComputer_P.RateLimiterGenericVariableTs11_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs11_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_2_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_2_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_d);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_2_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_2_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_2_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_lateral_law)) {
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

    A380PrimComputer_Spoiler12SpeedbrakeGain(rtb_handleIndex, &rtb_Switch8_o);
    A380PrimComputer_Spoiler345Computation(rtb_xi_spoiler_deg_b, rtb_Switch8_o + rtb_Y, &rtb_Switch8_o, &rtb_Switch_h);
    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch8_o;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs14_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs14_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_3_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_3_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_left_spoiler_3_deg, &A380PrimComputer_DWork.sf_RateLimiter_gr);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_3_deg = rtb_left_spoiler_3_deg;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_3_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_3_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs15_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs15_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_3_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_3_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_left_spoiler_3_deg, &A380PrimComputer_DWork.sf_RateLimiter_nh);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_3_deg = rtb_left_spoiler_3_deg;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_3_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_3_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch8_o;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs12_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs12_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_4_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_4_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_left_spoiler_3_deg, &A380PrimComputer_DWork.sf_RateLimiter_c5);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_4_deg = rtb_left_spoiler_3_deg;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs13_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs13_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_4_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_4_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_left_spoiler_3_deg, &A380PrimComputer_DWork.sf_RateLimiter_m);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_4_deg = rtb_left_spoiler_3_deg;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_4_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch8_o;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs18_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs18_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_5_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_5_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_n2);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_5_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_Switch_h = rtb_Y_j;
    }

    A380PrimComputer_RateLimiter_a(rtb_Switch_h, A380PrimComputer_P.RateLimiterGenericVariableTs19_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs19_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_5_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_5_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_j);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_5_deg = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_5_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
    }

    A380PrimComputer_Spoiler345Computation(rtb_xi_spoiler_deg_b, rtb_handleIndex + rtb_Y, &rtb_Switch8_o, &rtb_Switch_h);
    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch8_o;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs16_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs16_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_6_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_6_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Y, &A380PrimComputer_DWork.sf_RateLimiter_k);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_6_deg = rtb_Y;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs17_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs17_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_6_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_6_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Y, &A380PrimComputer_DWork.sf_RateLimiter_bo);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_6_deg = rtb_Y;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_6_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch8_o;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs22_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs22_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_7_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_7_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Y, &A380PrimComputer_DWork.sf_RateLimiter_i);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_7_deg = rtb_Y;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_7_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_7_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch_h;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs23_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs23_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_7_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_7_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Y, &A380PrimComputer_DWork.sf_RateLimiter_f1);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_7_deg = rtb_Y;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_7_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_7_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_eta_deg_dv = rtb_Y_j;
    } else {
      rtb_eta_deg_dv = rtb_Switch8_o;
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs20_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs20_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.left_spoiler_8_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_8_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_gm);
    if (A380PrimComputer_B.logic.is_master_prim) {
      rtb_handleIndex = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      rtb_handleIndex = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
    } else {
      rtb_handleIndex = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
    }

    if (rtb_y_f) {
      rtb_Switch_h = rtb_Y_j;
    }

    A380PrimComputer_RateLimiter_a(rtb_Switch_h, A380PrimComputer_P.RateLimiterGenericVariableTs21_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs21_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.right_spoiler_8_deg,
      (!A380PrimComputer_B.logic.surface_statuses.spoiler_pair_8_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_nl);
    if (A380PrimComputer_B.logic.is_master_prim) {
      rtb_Y = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      rtb_Y = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
    } else {
      rtb_Y = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_lateral_law)) {
     case 0:
      rtb_Y_j = rtb_zeta_upper_deg;
      break;

     case 1:
      rtb_Y_j = rtb_zeta_upper_deg_p;
      break;

     default:
      rtb_Y_j = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs6_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs6_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.upper_rudder_deg,
      (!A380PrimComputer_B.logic.surface_statuses.upper_rudder_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_np);
    if (A380PrimComputer_B.logic.is_master_prim) {
      rtb_Switch_h = rtb_Switch8_o;
    } else if (rtb_doubleAdrFault) {
      rtb_Switch_h = A380PrimComputer_U.in.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
    } else {
      rtb_Switch_h = A380PrimComputer_U.in.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_lateral_law)) {
     case 0:
      rtb_Y_j = rtb_zeta_lower_deg;
      break;

     case 1:
      rtb_Y_j = rtb_zeta_lower_deg_n;
      break;

     default:
      rtb_Y_j = A380PrimComputer_P.Constant_Value_c;
      break;
    }

    A380PrimComputer_RateLimiter_a(rtb_Y_j, A380PrimComputer_P.RateLimiterGenericVariableTs7_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs7_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.lateral_surface_positions.lower_rudder_deg,
      (!A380PrimComputer_B.logic.surface_statuses.lower_rudder_engaged) || (!A380PrimComputer_B.logic.is_master_prim),
      &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_iy);
    if (!A380PrimComputer_B.logic.is_master_prim) {
      if (rtb_doubleAdrFault) {
        rtb_Switch8_o = A380PrimComputer_U.in.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
      } else {
        rtb_Switch8_o = A380PrimComputer_U.in.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
      }
    }

    A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_8_deg = rtb_handleIndex;
    A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_8_deg = rtb_Y;
    A380PrimComputer_B.laws.lateral_law_outputs.upper_rudder_deg = rtb_Switch_h;
    A380PrimComputer_B.laws.lateral_law_outputs.lower_rudder_deg = rtb_Switch8_o;
    rtb_Y_j = A380PrimComputer_P.DiscreteDerivativeVariableTs_Gain *
      A380PrimComputer_B.logic.ir_computation_data.theta_dot_deg_s;
    rtb_Switch8_o = rtb_Y_j - A380PrimComputer_DWork.Delay_DSTATE;
    A380PrimComputer_LagFilter(rtb_Switch8_o / A380PrimComputer_U.in.time.dt, A380PrimComputer_P.LagFilter_C1_e,
      A380PrimComputer_U.in.time.dt, &rtb_Switch_h, &A380PrimComputer_DWork.sf_LagFilter);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_p, &rtb_y_po);
    rtb_doubleAdrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_h, &rtb_y_po);
    rtb_tripleAdrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_f, &rtb_y_po);
    rtb_doubleIrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_cv, &rtb_y_po);
    rtb_tripleIrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_n, &rtb_y_po);
    rtb_y_jj = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_py, &rtb_y_po);
    A380PrimComputer_MATLABFunction_o(rtb_doubleAdrFault, rtb_tripleAdrFault, rtb_doubleIrFault, rtb_tripleIrFault,
      rtb_y_jj, rtb_y_po != 0U, &rtb_Switch8_o);
    rtb_doubleAdrFault = (A380PrimComputer_B.logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant_const_f) &&
      (static_cast<real_T>(A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant2_const_f)));
    LawMDLOBJ5.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_U.in.time.simulation_time,
                    &A380PrimComputer_B.logic.ir_computation_data.n_z_g,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_dot_deg_s, &rtb_Switch_h, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), &A380PrimComputer_U.in.analog_inputs.ths_pos_deg,
                    &A380PrimComputer_B.logic.adr_computation_data.alpha_deg,
                    &A380PrimComputer_B.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputer_B.logic.ra_computation_data_ft, &rtb_Switch8_o, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), (const_cast<real_T*>(&A380PrimComputer_RGND)), &A380PrimComputer_P.Constant_Value_g,
                    &A380PrimComputer_P.Constant_Value_g, &A380PrimComputer_U.in.sim_data.tailstrike_protection_on, (
      const_cast<real_T*>(&A380PrimComputer_RGND)), &A380PrimComputer_B.logic.total_sidestick_pitch_command,
                    &A380PrimComputer_B.logic.on_ground, &rtb_doubleAdrFault,
                    &A380PrimComputer_B.logic.high_alpha_prot_active, &A380PrimComputer_B.logic.high_speed_prot_active,
                    &A380PrimComputer_B.logic.alpha_prot_deg, &A380PrimComputer_B.logic.alpha_max_deg,
                    &A380PrimComputer_B.logic.high_speed_prot_hi_thresh_kn,
                    &A380PrimComputer_B.logic.high_speed_prot_lo_thresh_kn, (const_cast<real_T*>(&A380PrimComputer_RGND)),
                    (const_cast<boolean_T*>(&A380PrimComputer_BGND)), &rtb_eta_deg, &rtb_eta_trim_dot_deg_s,
                    &rtb_eta_trim_limit_lo, &rtb_eta_trim_limit_up);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_n, &rtb_y_po);
    rtb_doubleAdrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_h1, &rtb_y_po);
    rtb_tripleAdrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_g, &rtb_y_po);
    rtb_doubleIrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_b, &rtb_y_po);
    rtb_tripleIrFault = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_i, &rtb_y_po);
    rtb_y_jj = (rtb_y_po != 0U);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_l, &rtb_y_po);
    A380PrimComputer_MATLABFunction_o(rtb_doubleAdrFault, rtb_tripleAdrFault, rtb_doubleIrFault, rtb_tripleIrFault,
      rtb_y_jj, rtb_y_po != 0U, &rtb_Switch8_o);
    rtb_doubleAdrFault = (A380PrimComputer_B.logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant3_const_o) &&
      (static_cast<real_T>(A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant4_const_o) &&
      (static_cast<real_T>(A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant5_const_b)));
    rtb_tripleAdrFault = (A380PrimComputer_B.logic.active_pitch_law != A380PrimComputer_P.EnumeratedConstant_Value_b);
    LawMDLOBJ3.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.ir_computation_data.n_z_g,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_dot_deg_s, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), &A380PrimComputer_U.in.analog_inputs.ths_pos_deg,
                    &A380PrimComputer_B.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.logic.adr_computation_data.mach,
                    &A380PrimComputer_B.logic.adr_computation_data.V_tas_kn, &rtb_Switch8_o, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), (const_cast<real_T*>(&A380PrimComputer_RGND)),
                    &A380PrimComputer_B.logic.total_sidestick_pitch_command, &rtb_doubleAdrFault, &rtb_tripleAdrFault,
                    &rtb_eta_deg_o, &rtb_eta_trim_dot_deg_s_a, &rtb_eta_trim_limit_lo_h, &rtb_eta_trim_limit_up_d);
    LawMDLOBJ4.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.total_sidestick_pitch_command,
                    &rtb_eta_deg_dv, &rtb_xi_spoiler_deg_b, &rtb_eta_trim_limit_lo_d, &rtb_left_spoiler_3_deg);
    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_pitch_law)) {
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
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo_f, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.pitch_surface_positions.left_inboard_elevator_deg,
      (!A380PrimComputer_B.logic.surface_statuses.left_inboard_elevator_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch8_o, &A380PrimComputer_DWork.sf_RateLimiter_cr);
    A380PrimComputer_MATLABFunction_e(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word,
      A380PrimComputer_P.BitfromLabel_bit_of, &rtb_y_po);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word, &rtb_y_h);
    rtb_doubleAdrFault = ((rtb_y_po != 0U) && rtb_y_h);
    if (!A380PrimComputer_B.logic.is_master_prim) {
      if (rtb_doubleAdrFault) {
        rtb_Switch8_o = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
      } else {
        rtb_Switch8_o = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
      }
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs1_up_a,
      A380PrimComputer_P.RateLimiterGenericVariableTs1_lo_c, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.pitch_surface_positions.right_inboard_elevator_deg,
      (!A380PrimComputer_B.logic.surface_statuses.right_inboard_elevator_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Switch_h, &A380PrimComputer_DWork.sf_RateLimiter_p);
    if (!A380PrimComputer_B.logic.is_master_prim) {
      if (rtb_doubleAdrFault) {
        rtb_Switch_h = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
      } else {
        rtb_Switch_h = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
      }
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs2_up_l,
      A380PrimComputer_P.RateLimiterGenericVariableTs2_lo_k, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.pitch_surface_positions.left_outboard_elevator_deg,
      (!A380PrimComputer_B.logic.surface_statuses.left_outboard_elevator_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_Y, &A380PrimComputer_DWork.sf_RateLimiter_cda);
    if (!A380PrimComputer_B.logic.is_master_prim) {
      if (rtb_doubleAdrFault) {
        rtb_Y = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
      } else {
        rtb_Y = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
      }
    }

    A380PrimComputer_RateLimiter_a(rtb_eta_deg_dv, A380PrimComputer_P.RateLimiterGenericVariableTs3_up_j,
      A380PrimComputer_P.RateLimiterGenericVariableTs3_lo_k, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_B.logic.pitch_surface_positions.right_outboard_elevator_deg,
      (!A380PrimComputer_B.logic.surface_statuses.right_outboard_elevator_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim), &rtb_handleIndex, &A380PrimComputer_DWork.sf_RateLimiter_ph);
    if (!A380PrimComputer_B.logic.is_master_prim) {
      if (rtb_doubleAdrFault) {
        rtb_handleIndex = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
      } else {
        rtb_handleIndex = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
      }
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_pitch_law)) {
     case 0:
     case 1:
      rtb_left_spoiler_3_deg = rtb_eta_trim_limit_up;
      break;

     case 2:
     case 3:
     case 4:
      rtb_left_spoiler_3_deg = rtb_eta_trim_limit_up_d;
      break;

     case 5:
      break;

     default:
      rtb_left_spoiler_3_deg = A380PrimComputer_P.Constant2_Value_l;
      break;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_pitch_law)) {
     case 0:
     case 1:
      rtb_xi_spoiler_deg_b = rtb_eta_trim_dot_deg_s;
      break;

     case 2:
     case 3:
     case 4:
      rtb_xi_spoiler_deg_b = rtb_eta_trim_dot_deg_s_a;
      break;

     case 5:
      break;

     default:
      rtb_xi_spoiler_deg_b = A380PrimComputer_P.Constant_Value_af;
      break;
    }

    rtb_xi_spoiler_deg_b = A380PrimComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_xi_spoiler_deg_b *
      A380PrimComputer_U.in.time.dt;
    A380PrimComputer_DWork.icLoad = ((!A380PrimComputer_B.logic.surface_statuses.ths_engaged) ||
      (!A380PrimComputer_B.logic.is_master_prim) || A380PrimComputer_DWork.icLoad);
    if (A380PrimComputer_DWork.icLoad) {
      A380PrimComputer_DWork.Delay_DSTATE_c = A380PrimComputer_B.logic.pitch_surface_positions.ths_deg -
        rtb_xi_spoiler_deg_b;
    }

    A380PrimComputer_DWork.Delay_DSTATE_c += rtb_xi_spoiler_deg_b;
    if (A380PrimComputer_DWork.Delay_DSTATE_c > rtb_left_spoiler_3_deg) {
      A380PrimComputer_DWork.Delay_DSTATE_c = rtb_left_spoiler_3_deg;
    } else {
      switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_pitch_law)) {
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

    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_B.laws.pitch_law_outputs.ths_deg = A380PrimComputer_DWork.Delay_DSTATE_c;
    } else if (rtb_doubleAdrFault) {
      A380PrimComputer_B.laws.pitch_law_outputs.ths_deg =
        A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_command_deg.Data;
    } else {
      A380PrimComputer_B.laws.pitch_law_outputs.ths_deg =
        A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_command_deg.Data;
    }

    A380PrimComputer_B.laws.pitch_law_outputs.left_inboard_elevator_deg = rtb_Switch8_o;
    A380PrimComputer_B.laws.pitch_law_outputs.right_inboard_elevator_deg = rtb_Switch_h;
    A380PrimComputer_B.laws.pitch_law_outputs.left_outboard_elevator_deg = rtb_Y;
    A380PrimComputer_B.laws.pitch_law_outputs.right_outboard_elevator_deg = rtb_handleIndex;
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch8_o = A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_6_deg;
      rtb_Switch_h = A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_6_deg;
      rtb_handleIndex = A380PrimComputer_B.laws.pitch_law_outputs.left_outboard_elevator_deg;
      rtb_Y = A380PrimComputer_B.laws.pitch_law_outputs.left_inboard_elevator_deg;
      rtb_left_spoiler_3_deg = A380PrimComputer_B.laws.pitch_law_outputs.right_outboard_elevator_deg;
      rtb_eta_deg_dv = A380PrimComputer_B.laws.lateral_law_outputs.lower_rudder_deg;
      rtb_xi_spoiler_deg_b = A380PrimComputer_B.laws.lateral_law_outputs.upper_rudder_deg;
      rtb_eta_trim_limit_lo_d = A380PrimComputer_B.laws.lateral_law_outputs.left_inboard_aileron_deg;
      rtb_rightAileron1Command = A380PrimComputer_B.laws.lateral_law_outputs.right_inboard_aileron_deg;
      rtb_leftAileron2Command = A380PrimComputer_B.laws.lateral_law_outputs.left_midboard_aileron_deg;
      rtb_rightAileron2Command = A380PrimComputer_B.laws.lateral_law_outputs.right_midboard_aileron_deg;
    } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch8_o = A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_5_deg;
      rtb_Switch_h = A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_5_deg;
      rtb_handleIndex = A380PrimComputer_B.laws.pitch_law_outputs.right_outboard_elevator_deg;
      rtb_Y = A380PrimComputer_B.laws.pitch_law_outputs.left_outboard_elevator_deg;
      rtb_left_spoiler_3_deg = A380PrimComputer_B.laws.pitch_law_outputs.right_inboard_elevator_deg;
      rtb_eta_deg_dv = A380PrimComputer_B.laws.lateral_law_outputs.upper_rudder_deg;
      rtb_xi_spoiler_deg_b = 0.0;
      rtb_eta_trim_limit_lo_d = A380PrimComputer_B.laws.lateral_law_outputs.left_outboard_aileron_deg;
      rtb_rightAileron1Command = A380PrimComputer_B.laws.lateral_law_outputs.right_outboard_aileron_deg;
      rtb_leftAileron2Command = A380PrimComputer_B.laws.lateral_law_outputs.left_inboard_aileron_deg;
      rtb_rightAileron2Command = A380PrimComputer_B.laws.lateral_law_outputs.right_inboard_aileron_deg;
    } else {
      rtb_Switch8_o = A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_4_deg;
      rtb_Switch_h = A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_4_deg;
      rtb_handleIndex = A380PrimComputer_B.laws.pitch_law_outputs.left_inboard_elevator_deg;
      rtb_Y = A380PrimComputer_B.laws.pitch_law_outputs.right_inboard_elevator_deg;
      rtb_left_spoiler_3_deg = 0.0;
      rtb_eta_deg_dv = A380PrimComputer_B.laws.lateral_law_outputs.lower_rudder_deg;
      rtb_xi_spoiler_deg_b = 0.0;
      rtb_eta_trim_limit_lo_d = A380PrimComputer_B.laws.lateral_law_outputs.left_midboard_aileron_deg;
      rtb_rightAileron1Command = A380PrimComputer_B.laws.lateral_law_outputs.right_midboard_aileron_deg;
      rtb_leftAileron2Command = A380PrimComputer_B.laws.lateral_law_outputs.left_outboard_aileron_deg;
      rtb_rightAileron2Command = A380PrimComputer_B.laws.lateral_law_outputs.right_outboard_aileron_deg;
    }

    if (A380PrimComputer_B.logic.elevator_1_engaged) {
      A380PrimComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = rtb_handleIndex;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = A380PrimComputer_P.Constant_Value_b;
    }

    if (A380PrimComputer_B.logic.elevator_2_engaged) {
      A380PrimComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = rtb_Y;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = A380PrimComputer_P.Constant1_Value_n;
    }

    if (A380PrimComputer_B.logic.elevator_3_engaged) {
      A380PrimComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = rtb_left_spoiler_3_deg;
    } else {
      A380PrimComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = A380PrimComputer_P.Constant2_Value_k;
    }

    if (A380PrimComputer_B.logic.ths_engaged) {
      A380PrimComputer_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputer_B.laws.pitch_law_outputs.ths_deg;
    } else {
      A380PrimComputer_Y.out.analog_outputs.ths_pos_order_deg = A380PrimComputer_P.Constant3_Value_g;
    }

    if (A380PrimComputer_B.logic.left_aileron_1_engaged) {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = rtb_eta_trim_limit_lo_d;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = A380PrimComputer_P.Constant4_Value_i;
    }

    if (A380PrimComputer_B.logic.left_aileron_2_engaged) {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = rtb_leftAileron2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = A380PrimComputer_P.Constant5_Value_n;
    }

    if (A380PrimComputer_B.logic.right_aileron_1_engaged) {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = rtb_rightAileron1Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = A380PrimComputer_P.Constant6_Value_f;
    }

    if (A380PrimComputer_B.logic.right_aileron_2_engaged) {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = rtb_rightAileron2Command;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = A380PrimComputer_P.Constant7_Value;
    }

    if (A380PrimComputer_B.logic.left_spoiler_electric_mode_engaged ||
        A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.left_spoiler_pos_order_deg = rtb_Switch8_o;
    } else {
      A380PrimComputer_Y.out.analog_outputs.left_spoiler_pos_order_deg = A380PrimComputer_P.Constant8_Value;
    }

    if (A380PrimComputer_B.logic.right_spoiler_electric_mode_engaged ||
        A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.right_spoiler_pos_order_deg = rtb_Switch_h;
    } else {
      A380PrimComputer_Y.out.analog_outputs.right_spoiler_pos_order_deg = A380PrimComputer_P.Constant9_Value_n;
    }

    if (A380PrimComputer_B.logic.rudder_1_electric_mode_engaged ||
        A380PrimComputer_B.logic.rudder_1_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = rtb_eta_deg_dv;
    } else {
      A380PrimComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = A380PrimComputer_P.Constant10_Value;
    }

    if (A380PrimComputer_B.logic.rudder_2_electric_mode_engaged ||
        A380PrimComputer_B.logic.rudder_2_hydraulic_mode_engaged) {
      A380PrimComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = rtb_xi_spoiler_deg_b;
    } else {
      A380PrimComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = A380PrimComputer_P.Constant11_Value;
    }

    if (A380PrimComputer_B.logic.is_master_prim) {
      rtb_V_ias = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.left_inboard_aileron_deg);
      rtb_V_tas = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.right_inboard_aileron_deg);
      rtb_mach_h = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.left_midboard_aileron_deg);
      rtb_alpha = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.right_midboard_aileron_deg);
      rtb_phi = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.left_outboard_aileron_deg);
      rtb_q = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.right_outboard_aileron_deg);
      rtb_r = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_1_deg);
      rtb_n_x = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_1_deg);
      rtb_n_y = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_2_deg);
      rtb_n_z = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_2_deg);
      rtb_theta_dot = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_3_deg);
      rtb_phi_dot = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_3_deg);
      rtb_raComputationValue = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_3_deg);
      rtb_y_oq = static_cast<real32_T>(A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_3_deg);
      rtb_left_spoiler_5_command_deg_ey_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_3_deg);
      rtb_right_spoiler_5_command_deg_nc_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_3_deg);
      rtb_left_spoiler_6_command_deg_ma_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_6_deg);
      rtb_right_spoiler_6_command_deg_jn_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_6_deg);
      rtb_left_spoiler_7_command_deg_op_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_6_deg);
      rtb_right_spoiler_7_command_deg_b1_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_6_deg);
      rtb_left_spoiler_8_command_deg_kt_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.left_spoiler_6_deg);
      rtb_right_spoiler_8_command_deg_g0_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.right_spoiler_6_deg);
      rtb_right_inboard_elevator_command_deg_ff_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.pitch_law_outputs.right_inboard_elevator_deg);
      rtb_left_outboard_elevator_command_deg_nj_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.pitch_law_outputs.left_outboard_elevator_deg);
      rtb_right_outboard_elevator_command_deg_eb_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.pitch_law_outputs.right_outboard_elevator_deg);
      rtb_ths_command_deg_aj_Data = static_cast<real32_T>(A380PrimComputer_B.laws.pitch_law_outputs.ths_deg);
      rtb_upper_rudder_command_deg_pg_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.upper_rudder_deg);
      rtb_lower_rudder_command_deg_nt_Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.lateral_law_outputs.lower_rudder_deg);
    } else {
      rtb_V_ias = A380PrimComputer_P.Constant20_Value;
      rtb_V_tas = A380PrimComputer_P.Constant14_Value;
      rtb_mach_h = A380PrimComputer_P.Constant13_Value;
      rtb_alpha = A380PrimComputer_P.Constant12_Value;
      rtb_phi = A380PrimComputer_P.Constant11_Value_l;
      rtb_q = A380PrimComputer_P.Constant10_Value_l;
      rtb_r = A380PrimComputer_P.Constant9_Value_m;
      rtb_n_x = A380PrimComputer_P.Constant8_Value_hh;
      rtb_n_y = A380PrimComputer_P.Constant24_Value;
      rtb_n_z = A380PrimComputer_P.Constant23_Value;
      rtb_theta_dot = A380PrimComputer_P.Constant7_Value_j;
      rtb_phi_dot = A380PrimComputer_P.Constant6_Value_k;
      rtb_raComputationValue = A380PrimComputer_P.Constant26_Value;
      rtb_y_oq = A380PrimComputer_P.Constant25_Value;
      rtb_left_spoiler_5_command_deg_ey_Data = A380PrimComputer_P.Constant28_Value;
      rtb_right_spoiler_5_command_deg_nc_Data = A380PrimComputer_P.Constant27_Value;
      rtb_left_spoiler_6_command_deg_ma_Data = A380PrimComputer_P.Constant5_Value_g;
      rtb_right_spoiler_6_command_deg_jn_Data = A380PrimComputer_P.Constant4_Value_a5;
      rtb_left_spoiler_7_command_deg_op_Data = A380PrimComputer_P.Constant30_Value;
      rtb_right_spoiler_7_command_deg_b1_Data = A380PrimComputer_P.Constant29_Value;
      rtb_left_spoiler_8_command_deg_kt_Data = A380PrimComputer_P.Constant32_Value;
      rtb_right_spoiler_8_command_deg_g0_Data = A380PrimComputer_P.Constant31_Value;
      rtb_right_inboard_elevator_command_deg_ff_Data = A380PrimComputer_P.Constant33_Value;
      rtb_left_outboard_elevator_command_deg_nj_Data = A380PrimComputer_P.Constant34_Value;
      rtb_right_outboard_elevator_command_deg_eb_Data = A380PrimComputer_P.Constant35_Value;
      rtb_ths_command_deg_aj_Data = A380PrimComputer_P.Constant2_Value_c;
      rtb_upper_rudder_command_deg_pg_Data = A380PrimComputer_P.Constant1_Value_nj;
      rtb_lower_rudder_command_deg_nt_Data = A380PrimComputer_P.Constant15_Value;
    }

    rtb_VectorConcatenate[0] = A380PrimComputer_B.logic.left_aileron_1_avail;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.logic.right_aileron_2_avail;
    rtb_VectorConcatenate[10] = A380PrimComputer_B.logic.right_aileron_2_engaged;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.logic.left_aileron_1_engaged;
    rtb_VectorConcatenate[2] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.logic.right_aileron_1_avail;
    rtb_VectorConcatenate[4] = A380PrimComputer_B.logic.right_aileron_1_engaged;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant16_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.logic.left_aileron_2_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.logic.left_aileron_2_engaged;
    rtb_VectorConcatenate[8] = A380PrimComputer_P.Constant16_Value;
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.aileron_status_word.Data);
    rtb_VectorConcatenate[0] = A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.logic.right_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate[10] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.logic.left_spoiler_electric_mode_avail;
    rtb_VectorConcatenate[2] = A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_engaged;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.logic.left_spoiler_electric_mode_engaged;
    rtb_VectorConcatenate[4] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant17_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.logic.right_spoiler_electric_mode_avail;
    rtb_VectorConcatenate[8] = A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_engaged;
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.spoiler_status_word.Data);
    rtb_VectorConcatenate[0] = A380PrimComputer_B.logic.elevator_1_avail;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.logic.ths_avail;
    rtb_VectorConcatenate[10] = A380PrimComputer_B.logic.ths_engaged;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.logic.elevator_1_engaged;
    rtb_VectorConcatenate[2] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.logic.elevator_2_avail;
    rtb_VectorConcatenate[4] = A380PrimComputer_B.logic.elevator_2_engaged;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant18_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.logic.elevator_3_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.logic.elevator_3_engaged;
    rtb_VectorConcatenate[8] = A380PrimComputer_P.Constant18_Value;
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.elevator_status_word.Data);
    rtb_VectorConcatenate[0] = A380PrimComputer_B.logic.rudder_1_hydraulic_mode_avail;
    rtb_VectorConcatenate[9] = A380PrimComputer_B.logic.rudder_2_electric_mode_engaged;
    rtb_VectorConcatenate[10] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[11] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[16] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[17] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[18] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[1] = A380PrimComputer_B.logic.rudder_1_electric_mode_avail;
    rtb_VectorConcatenate[2] = A380PrimComputer_B.logic.rudder_1_hydraulic_mode_engaged;
    rtb_VectorConcatenate[3] = A380PrimComputer_B.logic.rudder_1_electric_mode_engaged;
    rtb_VectorConcatenate[4] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = A380PrimComputer_P.Constant19_Value;
    rtb_VectorConcatenate[6] = A380PrimComputer_B.logic.rudder_2_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380PrimComputer_B.logic.rudder_2_electric_mode_avail;
    rtb_VectorConcatenate[8] = A380PrimComputer_B.logic.rudder_2_hydraulic_mode_engaged;
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.rudder_status_word.Data);
    A380PrimComputer_Y.out.bus_outputs.misc_data_status_word.Data = static_cast<real32_T>
      (A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg);
    rtb_VectorConcatenate_c[10] = A380PrimComputer_B.logic.is_master_prim;
    rtb_VectorConcatenate_c[11] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[12] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[13] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[14] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[15] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[16] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[17] = A380PrimComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[18] = A380PrimComputer_P.Constant21_Value;
    A380PrimComputer_MATLABFunction_ei(A380PrimComputer_B.logic.pitch_law_capability, &rtb_VectorConcatenate_c[0],
      &rtb_VectorConcatenate_c[1], &rtb_VectorConcatenate_c[2]);
    A380PrimComputer_MATLABFunction2(A380PrimComputer_B.logic.lateral_law_capability, &rtb_VectorConcatenate_c[3],
      &rtb_VectorConcatenate_c[4]);
    A380PrimComputer_MATLABFunction_ei(A380PrimComputer_B.logic.active_pitch_law, &rtb_VectorConcatenate_c[5],
      &rtb_VectorConcatenate_c[6], &rtb_VectorConcatenate_c[7]);
    A380PrimComputer_MATLABFunction2(A380PrimComputer_B.logic.active_lateral_law, &rtb_VectorConcatenate_c[8],
      &rtb_VectorConcatenate_c[9]);
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate_c,
      &A380PrimComputer_Y.out.bus_outputs.fctl_law_status_word.Data);
    rtb_VectorConcatenate_c[0] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[9] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[10] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[11] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[12] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[13] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[14] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[15] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[16] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[17] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[18] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[1] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[2] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[3] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[4] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[5] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[6] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[7] = A380PrimComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[8] = A380PrimComputer_P.Constant22_Value;
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate_c,
      &A380PrimComputer_Y.out.bus_outputs.misc_data_status_word.Data);
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_inboard_aileron_command_deg.Data = rtb_V_ias;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_inboard_aileron_command_deg.Data = rtb_V_tas;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_midboard_aileron_command_deg.Data = rtb_mach_h;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_midboard_aileron_command_deg.Data = rtb_alpha;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_outboard_aileron_command_deg.Data = rtb_phi;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_outboard_aileron_command_deg.Data = rtb_q;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_1_command_deg.Data = rtb_r;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_1_command_deg.Data = rtb_n_x;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_2_command_deg.Data = rtb_n_y;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_2_command_deg.Data = rtb_n_z;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_3_command_deg.Data = rtb_theta_dot;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_3_command_deg.Data = rtb_phi_dot;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_4_command_deg.Data = rtb_raComputationValue;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_4_command_deg.Data = rtb_y_oq;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_5_command_deg.Data = rtb_left_spoiler_5_command_deg_ey_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_5_command_deg.Data = rtb_right_spoiler_5_command_deg_nc_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_6_command_deg.Data = rtb_left_spoiler_6_command_deg_ma_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_6_command_deg.Data = rtb_right_spoiler_6_command_deg_jn_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_7_command_deg.Data = rtb_left_spoiler_7_command_deg_op_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_7_command_deg.Data = rtb_right_spoiler_7_command_deg_b1_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_spoiler_8_command_deg.Data = rtb_left_spoiler_8_command_deg_kt_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_spoiler_8_command_deg.Data = rtb_right_spoiler_8_command_deg_g0_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
      A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.Data = static_cast<real32_T>
        (A380PrimComputer_B.laws.pitch_law_outputs.left_inboard_elevator_deg);
      A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
      A380PrimComputer_Y.out.bus_outputs.left_inboard_elevator_command_deg.Data = A380PrimComputer_P.Constant3_Value_ge;
      A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_inboard_elevator_command_deg.Data =
      rtb_right_inboard_elevator_command_deg_ff_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.left_outboard_elevator_command_deg.Data =
      rtb_left_outboard_elevator_command_deg_nj_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.right_outboard_elevator_command_deg.Data =
      rtb_right_outboard_elevator_command_deg_eb_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.ths_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.ths_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.ths_command_deg.Data = rtb_ths_command_deg_aj_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.upper_rudder_command_deg.Data = rtb_upper_rudder_command_deg_pg_Data;
    if (A380PrimComputer_B.logic.is_master_prim) {
      A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.lower_rudder_command_deg.Data = rtb_lower_rudder_command_deg_nt_Data;
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = A380PrimComputer_P.Gain_Gain_b *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = A380PrimComputer_P.Gain1_Gain_f *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = A380PrimComputer_P.Gain2_Gain *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = A380PrimComputer_P.Gain3_Gain_g *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos);
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = A380PrimComputer_P.Gain4_Gain_l *
      static_cast<real32_T>(A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos);
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
    A380PrimComputer_Y.out.bus_outputs.misc_data_status_word.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.discrete_outputs.elevator_1_active_mode = A380PrimComputer_B.logic.elevator_1_engaged;
    A380PrimComputer_Y.out.discrete_outputs.elevator_2_active_mode = A380PrimComputer_B.logic.elevator_2_engaged;
    A380PrimComputer_Y.out.discrete_outputs.elevator_3_active_mode = A380PrimComputer_B.logic.elevator_3_engaged;
    A380PrimComputer_Y.out.discrete_outputs.ths_active_mode = A380PrimComputer_B.logic.ths_engaged;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_1_active_mode = A380PrimComputer_B.logic.left_aileron_1_engaged;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_2_active_mode = A380PrimComputer_B.logic.left_aileron_2_engaged;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_1_active_mode =
      A380PrimComputer_B.logic.right_aileron_1_engaged;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_2_active_mode =
      A380PrimComputer_B.logic.right_aileron_2_engaged;
    A380PrimComputer_Y.out.discrete_outputs.left_spoiler_electronic_module_enable =
      A380PrimComputer_B.logic.left_spoiler_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.right_spoiler_electronic_module_enable =
      A380PrimComputer_B.logic.right_spoiler_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode =
      A380PrimComputer_B.logic.rudder_1_hydraulic_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_electric_active_mode =
      A380PrimComputer_B.logic.rudder_1_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode =
      A380PrimComputer_B.logic.rudder_2_hydraulic_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_electric_active_mode =
      A380PrimComputer_B.logic.rudder_2_electric_mode_engaged;
    A380PrimComputer_Y.out.discrete_outputs.prim_healthy = A380PrimComputer_P.Constant1_Value_f;
    A380PrimComputer_Y.out.discrete_outputs.fcu_own_select = A380PrimComputer_P.Constant_Value_ba;
    A380PrimComputer_Y.out.discrete_outputs.fcu_opp_select = A380PrimComputer_P.Constant_Value_ba;
    A380PrimComputer_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputer_P.Constant_Value_ba;
    A380PrimComputer_B.dt = A380PrimComputer_U.in.time.dt;
    A380PrimComputer_B.is_unit_1 = A380PrimComputer_U.in.discrete_inputs.is_unit_1;
    A380PrimComputer_B.Data = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data_f = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_k = A380PrimComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_fw = A380PrimComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_kx = A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_fwx = A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_kxx = A380PrimComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_fwxk = A380PrimComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_kxxt = A380PrimComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.SSM;
    A380PrimComputer_B.is_unit_2 = A380PrimComputer_U.in.discrete_inputs.is_unit_2;
    A380PrimComputer_B.Data_fwxkf = A380PrimComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_kxxta = A380PrimComputer_U.in.bus_inputs.ir_1_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_fwxkft = A380PrimComputer_U.in.bus_inputs.ir_1_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_kxxtac = A380PrimComputer_U.in.bus_inputs.ir_1_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc = A380PrimComputer_U.in.bus_inputs.ir_1_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_fwxkftc3 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_kxxtac0z = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3e = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0zt = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_true_deg.SSM;
    A380PrimComputer_B.is_unit_3 = A380PrimComputer_U.in.discrete_inputs.is_unit_3;
    A380PrimComputer_B.Data_fwxkftc3ep = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztg = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_fwxkftc3epg = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgt = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtd = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2u = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtdx = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2ux = A380PrimComputer_U.in.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.capt_priority_takeover_pressed =
      A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed;
    A380PrimComputer_B.Data_fwxkftc3epgtdxc = A380PrimComputer_U.in.bus_inputs.ir_1_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2uxn = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_h = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_ky = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_e = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_d = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_j = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_h = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_d = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_kb = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.fo_priority_takeover_pressed = A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed;
    A380PrimComputer_B.Data_p = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_p = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_i = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_di = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_g = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_j = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_a = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_i = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_eb = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_g = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.ap_1_puhsbutton_pressed = A380PrimComputer_U.in.discrete_inputs.ap_1_puhsbutton_pressed;
    A380PrimComputer_B.Data_jo = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_db = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ex = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_n = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_fd = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_a = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ja = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_ir = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_k = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_hu = A380PrimComputer_U.in.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.ap_2_puhsbutton_pressed = A380PrimComputer_U.in.discrete_inputs.ap_2_puhsbutton_pressed;
    A380PrimComputer_B.Data_joy = A380PrimComputer_U.in.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_e = A380PrimComputer_U.in.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_h3 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_gr = A380PrimComputer_U.in.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_a0 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_ev = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_b = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_l = A380PrimComputer_U.in.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_eq = A380PrimComputer_U.in.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_ei = A380PrimComputer_U.in.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.fcu_healthy = A380PrimComputer_U.in.discrete_inputs.fcu_healthy;
    A380PrimComputer_B.Data_iz = A380PrimComputer_U.in.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.SSM_an = A380PrimComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_j2 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_c = A380PrimComputer_U.in.bus_inputs.ir_2_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_o = A380PrimComputer_U.in.bus_inputs.ir_2_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_cb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_m = A380PrimComputer_U.in.bus_inputs.ir_2_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_lb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_oq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_ia = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.athr_pushbutton = A380PrimComputer_U.in.discrete_inputs.athr_pushbutton;
    A380PrimComputer_B.Data_fo = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_kyz = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_p1 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_as = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_p1y = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_is = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_l = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_ca = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_kp = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_o = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.ir_3_on_capt = A380PrimComputer_U.in.discrete_inputs.ir_3_on_capt;
    A380PrimComputer_B.Data_k0 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_ak = A380PrimComputer_U.in.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_pi = A380PrimComputer_U.in.bus_inputs.ir_2_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_cbj = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_dm = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_cu = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_f5 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_nn = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_js = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_b = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.simulation_time = A380PrimComputer_U.in.time.simulation_time;
    A380PrimComputer_B.ir_3_on_fo = A380PrimComputer_U.in.discrete_inputs.ir_3_on_fo;
    A380PrimComputer_B.Data_ee = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_m = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ig = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_f = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_mk = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_bp = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_pu = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_hb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_ly = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_gz = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.adr_3_on_capt = A380PrimComputer_U.in.discrete_inputs.adr_3_on_capt;
    A380PrimComputer_B.Data_jq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_pv = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_o5 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_mf = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_lyw = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_m0 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_gq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_kd = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_n = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_pu = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.adr_3_on_fo = A380PrimComputer_U.in.discrete_inputs.adr_3_on_fo;
    A380PrimComputer_B.Data_bq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_nv = A380PrimComputer_U.in.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_dmn = A380PrimComputer_U.in.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_d5 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_jn = A380PrimComputer_U.in.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_eo = A380PrimComputer_U.in.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_c = A380PrimComputer_U.in.bus_inputs.ir_2_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_nd = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_lx = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_bq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.pitch_trim_up_pressed = A380PrimComputer_U.in.discrete_inputs.pitch_trim_up_pressed;
    A380PrimComputer_B.Data_jb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_hi = A380PrimComputer_U.in.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_fn = A380PrimComputer_U.in.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.SSM_mm = A380PrimComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_od = A380PrimComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_kz = A380PrimComputer_U.in.bus_inputs.ir_3_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_ez = A380PrimComputer_U.in.bus_inputs.ir_3_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_il = A380PrimComputer_U.in.bus_inputs.ir_3_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_pw = A380PrimComputer_U.in.bus_inputs.ir_3_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_i2 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.pitch_trim_down_pressed = A380PrimComputer_U.in.discrete_inputs.pitch_trim_down_pressed;
    A380PrimComputer_B.Data_m2 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_ah = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_ek = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_en = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_iy = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_dq = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_lk = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_px = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_ca = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_lbo = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.green_low_pressure = A380PrimComputer_U.in.discrete_inputs.green_low_pressure;
    A380PrimComputer_B.Data_pix = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_p5 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_di = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_mk = A380PrimComputer_U.in.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_lz = A380PrimComputer_U.in.bus_inputs.ir_3_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_mu = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_lu = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_cbl = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_dc = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_gzd = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.yellow_low_pressure = A380PrimComputer_U.in.discrete_inputs.yellow_low_pressure;
    A380PrimComputer_B.Data_gc = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_mo = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_am = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_me = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_mo = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_mj = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_dg = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_a5 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_e1 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_bt = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.capt_pitch_stick_pos = A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    A380PrimComputer_B.Data_fp = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_om = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_ns = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_ar = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_m3 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_ce = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_oj = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_ed = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_jy = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_jh = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.fo_pitch_stick_pos = A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    A380PrimComputer_B.Data_j1 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_je = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_fc = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_jt = A380PrimComputer_U.in.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_of = A380PrimComputer_U.in.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_cui = A380PrimComputer_U.in.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_lg = A380PrimComputer_U.in.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_mq = A380PrimComputer_U.in.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_n4 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_ni = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.capt_roll_stick_pos = A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos;
    A380PrimComputer_B.Data_ot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_df = A380PrimComputer_U.in.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_gv = A380PrimComputer_U.in.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_oe = A380PrimComputer_U.in.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_ou = A380PrimComputer_U.in.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.isis_1_bus = A380PrimComputer_U.in.bus_inputs.isis_1_bus;
    A380PrimComputer_B.isis_2_bus = A380PrimComputer_U.in.bus_inputs.isis_2_bus;
    A380PrimComputer_B.rate_gyro_pitch_1_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_pitch_1_bus;
    A380PrimComputer_B.rate_gyro_pitch_2_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_pitch_2_bus;
    A380PrimComputer_B.rate_gyro_roll_1_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_roll_1_bus;
    A380PrimComputer_B.monotonic_time = A380PrimComputer_U.in.time.monotonic_time;
    A380PrimComputer_B.fo_roll_stick_pos = A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos;
    A380PrimComputer_B.rate_gyro_roll_2_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_roll_2_bus;
    A380PrimComputer_B.rate_gyro_yaw_1_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_yaw_1_bus;
    A380PrimComputer_B.rate_gyro_yaw_2_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_yaw_2_bus;
    A380PrimComputer_B.SSM_ha = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM;
    A380PrimComputer_B.Data_dh = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
    A380PrimComputer_B.SSM_op = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM;
    A380PrimComputer_B.Data_ph = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
    A380PrimComputer_B.SSM_a50 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
    A380PrimComputer_B.Data_gs = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
    A380PrimComputer_B.SSM_og = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
    A380PrimComputer_B.speed_brake_lever_pos = A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos;
    A380PrimComputer_B.Data_fd4 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
    A380PrimComputer_B.SSM_a4 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputer_B.Data_hm = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    A380PrimComputer_B.SSM_bv = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
    A380PrimComputer_B.Data_i2 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
    A380PrimComputer_B.SSM_bo = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
    A380PrimComputer_B.Data_og = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
    A380PrimComputer_B.SSM_d1 = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
    A380PrimComputer_B.Data_fv = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
    A380PrimComputer_B.SSM_hy = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
    A380PrimComputer_B.thr_lever_1_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos;
    A380PrimComputer_B.Data_oc = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
    A380PrimComputer_B.SSM_gi = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputer_B.Data_kq = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    A380PrimComputer_B.SSM_pp = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
    A380PrimComputer_B.Data_ne = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
    A380PrimComputer_B.SSM_iab = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
    A380PrimComputer_B.Data_it = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
    A380PrimComputer_B.irdc_1_bus = A380PrimComputer_U.in.bus_inputs.irdc_1_bus;
    A380PrimComputer_B.irdc_2_bus = A380PrimComputer_U.in.bus_inputs.irdc_2_bus;
    A380PrimComputer_B.irdc_3_bus = A380PrimComputer_U.in.bus_inputs.irdc_3_bus;
    A380PrimComputer_B.thr_lever_2_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos;
    A380PrimComputer_B.irdc_4_a_bus = A380PrimComputer_U.in.bus_inputs.irdc_4_a_bus;
    A380PrimComputer_B.irdc_4_b_bus = A380PrimComputer_U.in.bus_inputs.irdc_4_b_bus;
    A380PrimComputer_B.fcu_own_bus = A380PrimComputer_U.in.bus_inputs.fcu_own_bus;
    A380PrimComputer_B.fcu_opp_bus = A380PrimComputer_U.in.bus_inputs.fcu_opp_bus;
    A380PrimComputer_B.SSM_jtv = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_ch = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_fy = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_bb = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_d4 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_ol = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
    A380PrimComputer_B.thr_lever_3_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos;
    A380PrimComputer_B.SSM_ars = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_hw = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_din = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_hs = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_m3 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_fj = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_np = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.SSM;
    A380PrimComputer_B.Data_ky = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
    A380PrimComputer_B.SSM_ax = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.SSM;
    A380PrimComputer_B.Data_h5 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
    A380PrimComputer_B.thr_lever_4_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos;
    A380PrimComputer_B.SSM_cl = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.SSM;
    A380PrimComputer_B.Data_ku = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
    A380PrimComputer_B.SSM_es = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.SSM;
    A380PrimComputer_B.Data_jp = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
    A380PrimComputer_B.SSM_gi1 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.SSM;
    A380PrimComputer_B.Data_nu = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
    A380PrimComputer_B.SSM_jz = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.SSM;
    A380PrimComputer_B.Data_br = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
    A380PrimComputer_B.SSM_kt = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.SSM;
    A380PrimComputer_B.Data_ae = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
    A380PrimComputer_B.elevator_1_pos_deg = A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
    A380PrimComputer_B.SSM_ds = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.SSM;
    A380PrimComputer_B.Data_pe = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
    A380PrimComputer_B.SSM_eg = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.SSM;
    A380PrimComputer_B.Data_fy = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
    A380PrimComputer_B.SSM_a0 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.SSM;
    A380PrimComputer_B.Data_na = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
    A380PrimComputer_B.SSM_cv = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.SSM;
    A380PrimComputer_B.Data_my = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
    A380PrimComputer_B.SSM_ea = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.SSM;
    A380PrimComputer_B.Data_i4 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
    A380PrimComputer_B.elevator_2_pos_deg = A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
    A380PrimComputer_B.SSM_p4 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.SSM;
    A380PrimComputer_B.Data_cx = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
    A380PrimComputer_B.SSM_m2 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.SSM;
    A380PrimComputer_B.Data_nz = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
    A380PrimComputer_B.SSM_bt0 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.SSM;
    A380PrimComputer_B.Data_id = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
    A380PrimComputer_B.SSM_nr = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.SSM;
    A380PrimComputer_B.Data_o2 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
    A380PrimComputer_B.SSM_fr = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_gqq = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
    A380PrimComputer_B.elevator_3_pos_deg = A380PrimComputer_U.in.analog_inputs.elevator_3_pos_deg;
    A380PrimComputer_B.SSM_cc = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_md = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
    A380PrimComputer_B.SSM_lm = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_cz = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
    A380PrimComputer_B.SSM_mkm = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_pm = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
    A380PrimComputer_B.SSM_jhd = A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_command_deg.SSM;
    A380PrimComputer_B.Data_bj = A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_command_deg.Data;
    A380PrimComputer_B.SSM_av = A380PrimComputer_U.in.bus_inputs.prim_x_bus.upper_rudder_command_deg.SSM;
    A380PrimComputer_B.Data_ox = A380PrimComputer_U.in.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
    A380PrimComputer_B.ths_pos_deg = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    A380PrimComputer_B.SSM_ira = A380PrimComputer_U.in.bus_inputs.prim_x_bus.lower_rudder_command_deg.SSM;
    A380PrimComputer_B.Data_pe5 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
    A380PrimComputer_B.SSM_ge = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputer_B.Data_jj = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputer_B.SSM_lv = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputer_B.Data_p5 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputer_B.SSM_cg = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputer_B.Data_ekl = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputer_B.SSM_be = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputer_B.Data_nd = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputer_B.slew_on = A380PrimComputer_U.in.sim_data.slew_on;
    A380PrimComputer_B.left_aileron_1_pos_deg = A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
    A380PrimComputer_B.SSM_axb = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputer_B.Data_n2 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_pedal_position_deg.Data;
    A380PrimComputer_B.SSM_nz = A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word.SSM;
    A380PrimComputer_B.Data_dl = A380PrimComputer_U.in.bus_inputs.prim_x_bus.aileron_status_word.Data;
    A380PrimComputer_B.SSM_cx = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputer_B.Data_gs2 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
    A380PrimComputer_B.SSM_gh = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputer_B.Data_h4 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
    A380PrimComputer_B.SSM_ks = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputer_B.Data_e3 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
    A380PrimComputer_B.left_aileron_2_pos_deg = A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
    A380PrimComputer_B.SSM_pw = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputer_B.Data_f5h = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
    A380PrimComputer_B.SSM_fh = A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word.SSM;
    A380PrimComputer_B.Data_an = A380PrimComputer_U.in.bus_inputs.prim_x_bus.spoiler_status_word.Data;
    A380PrimComputer_B.SSM_gzn = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.SSM;
    A380PrimComputer_B.Data_i4o = A380PrimComputer_U.in.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
    A380PrimComputer_B.SSM_oo = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.SSM;
    A380PrimComputer_B.Data_af = A380PrimComputer_U.in.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
    A380PrimComputer_B.SSM_evh = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word.SSM;
    A380PrimComputer_B.Data_bm = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_status_word.Data;
    A380PrimComputer_B.right_aileron_1_pos_deg = A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
    A380PrimComputer_B.SSM_cn = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM;
    A380PrimComputer_B.Data_dk = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
    A380PrimComputer_B.SSM_co = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_2_position_deg.SSM;
    A380PrimComputer_B.Data_nv = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
    A380PrimComputer_B.SSM_pe = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.SSM;
    A380PrimComputer_B.Data_jpf = A380PrimComputer_U.in.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
    A380PrimComputer_B.SSM_cgz = A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_position_deg.SSM;
    A380PrimComputer_B.Data_i5 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.ths_position_deg.Data;
    A380PrimComputer_B.SSM_fw = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word.SSM;
    A380PrimComputer_B.Data_k2 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_status_word.Data;
    A380PrimComputer_B.right_aileron_2_pos_deg = A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
    A380PrimComputer_B.SSM_h4 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM;
    A380PrimComputer_B.Data_as = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
    A380PrimComputer_B.SSM_cb3 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM;
    A380PrimComputer_B.Data_gk = A380PrimComputer_U.in.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
    A380PrimComputer_B.SSM_pj = A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word.SSM;
    A380PrimComputer_B.Data_jl = A380PrimComputer_U.in.bus_inputs.prim_x_bus.fctl_law_status_word.Data;
    A380PrimComputer_B.SSM_dv = A380PrimComputer_U.in.bus_inputs.prim_x_bus.misc_data_status_word.SSM;
    A380PrimComputer_B.Data_e32 = A380PrimComputer_U.in.bus_inputs.prim_x_bus.misc_data_status_word.Data;
    A380PrimComputer_B.SSM_i4 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_ih = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
    A380PrimComputer_B.left_spoiler_pos_deg = A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
    A380PrimComputer_B.SSM_fm = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_du = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_e5 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_nx = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_bf = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_n0 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_fd = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_eqi = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
    A380PrimComputer_B.SSM_fv = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.SSM;
    A380PrimComputer_B.Data_om = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
    A380PrimComputer_B.right_spoiler_pos_deg = A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
    A380PrimComputer_B.SSM_dt = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.SSM;
    A380PrimComputer_B.Data_nr = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
    A380PrimComputer_B.SSM_j5 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.SSM;
    A380PrimComputer_B.Data_p3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
    A380PrimComputer_B.SSM_ng = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.SSM;
    A380PrimComputer_B.Data_nb = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
    A380PrimComputer_B.SSM_cs = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.SSM;
    A380PrimComputer_B.Data_hd = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
    A380PrimComputer_B.SSM_ls = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.SSM;
    A380PrimComputer_B.Data_al = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
    A380PrimComputer_B.rudder_1_pos_deg = A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
    A380PrimComputer_B.SSM_dg = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.SSM;
    A380PrimComputer_B.Data_gu = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
    A380PrimComputer_B.SSM_d3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.SSM;
    A380PrimComputer_B.Data_ix = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
    A380PrimComputer_B.SSM_p2 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.SSM;
    A380PrimComputer_B.Data_do = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
    A380PrimComputer_B.SSM_bo0 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.SSM;
    A380PrimComputer_B.Data_hu = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
    A380PrimComputer_B.SSM_bc = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.SSM;
    A380PrimComputer_B.Data_pm1 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
    A380PrimComputer_B.rudder_2_pos_deg = A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg;
    A380PrimComputer_B.SSM_h0 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.SSM;
    A380PrimComputer_B.Data_i2y = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
    A380PrimComputer_B.SSM_giz = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.SSM;
    A380PrimComputer_B.Data_pg = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
    A380PrimComputer_B.SSM_mqp = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.SSM;
    A380PrimComputer_B.Data_ni = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
    A380PrimComputer_B.SSM_ba = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.SSM;
    A380PrimComputer_B.Data_fr = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
    A380PrimComputer_B.SSM_in = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.SSM;
    A380PrimComputer_B.Data_cn = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
    A380PrimComputer_B.rudder_pedal_pos = A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos;
    A380PrimComputer_B.SSM_ff = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.SSM;
    A380PrimComputer_B.Data_nxl = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
    A380PrimComputer_B.SSM_ic = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_jh = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
    A380PrimComputer_B.SSM_fs = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_gl = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
    A380PrimComputer_B.SSM_ja = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_gn = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
    A380PrimComputer_B.SSM_js = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.SSM;
    A380PrimComputer_B.Data_myb = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
    A380PrimComputer_B.yellow_hyd_pressure_psi = A380PrimComputer_U.in.analog_inputs.yellow_hyd_pressure_psi;
    A380PrimComputer_B.SSM_is3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_command_deg.SSM;
    A380PrimComputer_B.Data_l2 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_command_deg.Data;
    A380PrimComputer_B.SSM_ag = A380PrimComputer_U.in.bus_inputs.prim_y_bus.upper_rudder_command_deg.SSM;
    A380PrimComputer_B.Data_o5o = A380PrimComputer_U.in.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
    A380PrimComputer_B.SSM_f5 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.lower_rudder_command_deg.SSM;
    A380PrimComputer_B.Data_l5 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
    A380PrimComputer_B.SSM_ph = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.SSM;
    A380PrimComputer_B.Data_dc2 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.Data;
    A380PrimComputer_B.SSM_jw = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.SSM;
    A380PrimComputer_B.Data_gr = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.Data;
    A380PrimComputer_B.pause_on = A380PrimComputer_U.in.sim_data.pause_on;
    A380PrimComputer_B.green_hyd_pressure_psi = A380PrimComputer_U.in.analog_inputs.green_hyd_pressure_psi;
    A380PrimComputer_B.SSM_jy = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.SSM;
    A380PrimComputer_B.Data_gp = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.Data;
    A380PrimComputer_B.SSM_j1 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.SSM;
    A380PrimComputer_B.Data_i3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.Data;
    A380PrimComputer_B.SSM_ov = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_pedal_position_deg.SSM;
    A380PrimComputer_B.Data_et = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_pedal_position_deg.Data;
    A380PrimComputer_B.SSM_mx = A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word.SSM;
    A380PrimComputer_B.Data_mc = A380PrimComputer_U.in.bus_inputs.prim_y_bus.aileron_status_word.Data;
    A380PrimComputer_B.SSM_b4 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM;
    A380PrimComputer_B.Data_k3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
    A380PrimComputer_B.vert_acc_1_g = A380PrimComputer_U.in.analog_inputs.vert_acc_1_g;
    A380PrimComputer_B.SSM_gb = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.SSM;
    A380PrimComputer_B.Data_f2 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
    A380PrimComputer_B.SSM_oh = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM;
    A380PrimComputer_B.Data_gh = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
    A380PrimComputer_B.SSM_mm5 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.SSM;
    A380PrimComputer_B.Data_ed = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
    A380PrimComputer_B.SSM_br = A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word.SSM;
    A380PrimComputer_B.Data_o2j = A380PrimComputer_U.in.bus_inputs.prim_y_bus.spoiler_status_word.Data;
    A380PrimComputer_B.SSM_c2 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.SSM;
    A380PrimComputer_B.Data_i43 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
    A380PrimComputer_B.vert_acc_2_g = A380PrimComputer_U.in.analog_inputs.vert_acc_2_g;
    A380PrimComputer_B.SSM_hc = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.SSM;
    A380PrimComputer_B.Data_ic = A380PrimComputer_U.in.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
    A380PrimComputer_B.SSM_ktr = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word.SSM;
    A380PrimComputer_B.Data_ak = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_status_word.Data;
    A380PrimComputer_B.SSM_gl = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM;
    A380PrimComputer_B.Data_jg = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
    A380PrimComputer_B.SSM_my = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM;
    A380PrimComputer_B.Data_cu = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
    A380PrimComputer_B.SSM_j3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_3_position_deg.SSM;
    A380PrimComputer_B.Data_ep = A380PrimComputer_U.in.bus_inputs.prim_y_bus.elevator_3_position_deg.Data;
    A380PrimComputer_B.vert_acc_3_g = A380PrimComputer_U.in.analog_inputs.vert_acc_3_g;
    A380PrimComputer_B.SSM_go = A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.SSM;
    A380PrimComputer_B.Data_d3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.ths_position_deg.Data;
    A380PrimComputer_B.SSM_e5c = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word.SSM;
    A380PrimComputer_B.Data_bt = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_status_word.Data;
    A380PrimComputer_B.SSM_dk = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.SSM;
    A380PrimComputer_B.Data_e0 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
    A380PrimComputer_B.SSM_evc = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_2_position_deg.SSM;
    A380PrimComputer_B.Data_jl3 = A380PrimComputer_U.in.bus_inputs.prim_y_bus.rudder_2_position_deg.Data;
    A380PrimComputer_B.SSM_kk = A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word.SSM;
    A380PrimComputer_B.Data_nm = A380PrimComputer_U.in.bus_inputs.prim_y_bus.fctl_law_status_word.Data;
    A380PrimComputer_B.lat_acc_1_g = A380PrimComputer_U.in.analog_inputs.lat_acc_1_g;
    A380PrimComputer_B.SSM_af = A380PrimComputer_U.in.bus_inputs.prim_y_bus.misc_data_status_word.SSM;
    A380PrimComputer_B.Data_ia = A380PrimComputer_U.in.bus_inputs.prim_y_bus.misc_data_status_word.Data;
    A380PrimComputer_B.sec_1_bus = A380PrimComputer_U.in.bus_inputs.sec_1_bus;
    A380PrimComputer_B.sec_2_bus = A380PrimComputer_U.in.bus_inputs.sec_2_bus;
    A380PrimComputer_B.sec_3_bus = A380PrimComputer_U.in.bus_inputs.sec_3_bus;
    A380PrimComputer_B.lat_acc_2_g = A380PrimComputer_U.in.analog_inputs.lat_acc_2_g;
    A380PrimComputer_B.lat_acc_3_g = A380PrimComputer_U.in.analog_inputs.lat_acc_3_g;
    A380PrimComputer_B.left_body_wheel_speed = A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed;
    A380PrimComputer_B.left_wing_wheel_speed = A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed;
    A380PrimComputer_B.right_body_wheel_speed = A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed;
    A380PrimComputer_B.tracking_mode_on_override = A380PrimComputer_U.in.sim_data.tracking_mode_on_override;
    A380PrimComputer_B.right_wing_wheel_speed = A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed;
    A380PrimComputer_B.SSM_npr = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_j0 = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_ew = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_bs = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_lt = A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.SSM;
    A380PrimComputer_B.Data_hp = A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
    A380PrimComputer_B.SSM_ger = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_ct = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM_pxo = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.tailstrike_protection_on = A380PrimComputer_U.in.sim_data.tailstrike_protection_on;
    A380PrimComputer_B.Data_pc = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_co2 = A380PrimComputer_U.in.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_nzt = A380PrimComputer_U.in.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_ny = A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_c0 = A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_l4 = A380PrimComputer_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_ojg = A380PrimComputer_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_nm = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_lm = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_nh = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.computer_running = A380PrimComputer_U.in.sim_data.computer_running;
    A380PrimComputer_B.Data_fz = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_dl = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.SSM;
    A380PrimComputer_B.Data_oz = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
    A380PrimComputer_B.SSM_dx = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_gf = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM_a5h = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data_nn = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_fl = A380PrimComputer_U.in.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_a0z = A380PrimComputer_U.in.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_p3 = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.prim_overhead_button_pressed = A380PrimComputer_U.in.discrete_inputs.prim_overhead_button_pressed;
    A380PrimComputer_B.Data_fk = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_ns = A380PrimComputer_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_bu = A380PrimComputer_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_bm = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_o23 = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_nl = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_g3 = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_grm = A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.SSM;
    A380PrimComputer_B.Data_icc = A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
    A380PrimComputer_B.SSM_gzm = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_DWork.Delay_DSTATE = rtb_Y_j;
    A380PrimComputer_DWork.icLoad = false;
  } else {
    A380PrimComputer_DWork.Runtime_MODE = false;
  }

  A380PrimComputer_Y.out.data.time.dt = A380PrimComputer_B.dt;
  A380PrimComputer_Y.out.data.time.simulation_time = A380PrimComputer_B.simulation_time;
  A380PrimComputer_Y.out.data.time.monotonic_time = A380PrimComputer_B.monotonic_time;
  A380PrimComputer_Y.out.data.sim_data.slew_on = A380PrimComputer_B.slew_on;
  A380PrimComputer_Y.out.data.sim_data.pause_on = A380PrimComputer_B.pause_on;
  A380PrimComputer_Y.out.data.sim_data.tracking_mode_on_override = A380PrimComputer_B.tracking_mode_on_override;
  A380PrimComputer_Y.out.data.sim_data.tailstrike_protection_on = A380PrimComputer_B.tailstrike_protection_on;
  A380PrimComputer_Y.out.data.sim_data.computer_running = A380PrimComputer_B.computer_running;
  A380PrimComputer_Y.out.data.discrete_inputs.prim_overhead_button_pressed =
    A380PrimComputer_B.prim_overhead_button_pressed;
  A380PrimComputer_Y.out.data.discrete_inputs.is_unit_1 = A380PrimComputer_B.is_unit_1;
  A380PrimComputer_Y.out.data.discrete_inputs.is_unit_2 = A380PrimComputer_B.is_unit_2;
  A380PrimComputer_Y.out.data.discrete_inputs.is_unit_3 = A380PrimComputer_B.is_unit_3;
  A380PrimComputer_Y.out.data.discrete_inputs.capt_priority_takeover_pressed =
    A380PrimComputer_B.capt_priority_takeover_pressed;
  A380PrimComputer_Y.out.data.discrete_inputs.fo_priority_takeover_pressed =
    A380PrimComputer_B.fo_priority_takeover_pressed;
  A380PrimComputer_Y.out.data.discrete_inputs.ap_1_puhsbutton_pressed = A380PrimComputer_B.ap_1_puhsbutton_pressed;
  A380PrimComputer_Y.out.data.discrete_inputs.ap_2_puhsbutton_pressed = A380PrimComputer_B.ap_2_puhsbutton_pressed;
  A380PrimComputer_Y.out.data.discrete_inputs.fcu_healthy = A380PrimComputer_B.fcu_healthy;
  A380PrimComputer_Y.out.data.discrete_inputs.athr_pushbutton = A380PrimComputer_B.athr_pushbutton;
  A380PrimComputer_Y.out.data.discrete_inputs.ir_3_on_capt = A380PrimComputer_B.ir_3_on_capt;
  A380PrimComputer_Y.out.data.discrete_inputs.ir_3_on_fo = A380PrimComputer_B.ir_3_on_fo;
  A380PrimComputer_Y.out.data.discrete_inputs.adr_3_on_capt = A380PrimComputer_B.adr_3_on_capt;
  A380PrimComputer_Y.out.data.discrete_inputs.adr_3_on_fo = A380PrimComputer_B.adr_3_on_fo;
  A380PrimComputer_Y.out.data.discrete_inputs.pitch_trim_up_pressed = A380PrimComputer_B.pitch_trim_up_pressed;
  A380PrimComputer_Y.out.data.discrete_inputs.pitch_trim_down_pressed = A380PrimComputer_B.pitch_trim_down_pressed;
  A380PrimComputer_Y.out.data.discrete_inputs.green_low_pressure = A380PrimComputer_B.green_low_pressure;
  A380PrimComputer_Y.out.data.discrete_inputs.yellow_low_pressure = A380PrimComputer_B.yellow_low_pressure;
  A380PrimComputer_Y.out.data.analog_inputs.capt_pitch_stick_pos = A380PrimComputer_B.capt_pitch_stick_pos;
  A380PrimComputer_Y.out.data.analog_inputs.fo_pitch_stick_pos = A380PrimComputer_B.fo_pitch_stick_pos;
  A380PrimComputer_Y.out.data.analog_inputs.capt_roll_stick_pos = A380PrimComputer_B.capt_roll_stick_pos;
  A380PrimComputer_Y.out.data.analog_inputs.fo_roll_stick_pos = A380PrimComputer_B.fo_roll_stick_pos;
  A380PrimComputer_Y.out.data.analog_inputs.speed_brake_lever_pos = A380PrimComputer_B.speed_brake_lever_pos;
  A380PrimComputer_Y.out.data.analog_inputs.thr_lever_1_pos = A380PrimComputer_B.thr_lever_1_pos;
  A380PrimComputer_Y.out.data.analog_inputs.thr_lever_2_pos = A380PrimComputer_B.thr_lever_2_pos;
  A380PrimComputer_Y.out.data.analog_inputs.thr_lever_3_pos = A380PrimComputer_B.thr_lever_3_pos;
  A380PrimComputer_Y.out.data.analog_inputs.thr_lever_4_pos = A380PrimComputer_B.thr_lever_4_pos;
  A380PrimComputer_Y.out.data.analog_inputs.elevator_1_pos_deg = A380PrimComputer_B.elevator_1_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.elevator_2_pos_deg = A380PrimComputer_B.elevator_2_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.elevator_3_pos_deg = A380PrimComputer_B.elevator_3_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.ths_pos_deg = A380PrimComputer_B.ths_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.left_aileron_1_pos_deg = A380PrimComputer_B.left_aileron_1_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.left_aileron_2_pos_deg = A380PrimComputer_B.left_aileron_2_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.right_aileron_1_pos_deg = A380PrimComputer_B.right_aileron_1_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.right_aileron_2_pos_deg = A380PrimComputer_B.right_aileron_2_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.left_spoiler_pos_deg = A380PrimComputer_B.left_spoiler_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.right_spoiler_pos_deg = A380PrimComputer_B.right_spoiler_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.rudder_1_pos_deg = A380PrimComputer_B.rudder_1_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.rudder_2_pos_deg = A380PrimComputer_B.rudder_2_pos_deg;
  A380PrimComputer_Y.out.data.analog_inputs.rudder_pedal_pos = A380PrimComputer_B.rudder_pedal_pos;
  A380PrimComputer_Y.out.data.analog_inputs.yellow_hyd_pressure_psi = A380PrimComputer_B.yellow_hyd_pressure_psi;
  A380PrimComputer_Y.out.data.analog_inputs.green_hyd_pressure_psi = A380PrimComputer_B.green_hyd_pressure_psi;
  A380PrimComputer_Y.out.data.analog_inputs.vert_acc_1_g = A380PrimComputer_B.vert_acc_1_g;
  A380PrimComputer_Y.out.data.analog_inputs.vert_acc_2_g = A380PrimComputer_B.vert_acc_2_g;
  A380PrimComputer_Y.out.data.analog_inputs.vert_acc_3_g = A380PrimComputer_B.vert_acc_3_g;
  A380PrimComputer_Y.out.data.analog_inputs.lat_acc_1_g = A380PrimComputer_B.lat_acc_1_g;
  A380PrimComputer_Y.out.data.analog_inputs.lat_acc_2_g = A380PrimComputer_B.lat_acc_2_g;
  A380PrimComputer_Y.out.data.analog_inputs.lat_acc_3_g = A380PrimComputer_B.lat_acc_3_g;
  A380PrimComputer_Y.out.data.analog_inputs.left_body_wheel_speed = A380PrimComputer_B.left_body_wheel_speed;
  A380PrimComputer_Y.out.data.analog_inputs.left_wing_wheel_speed = A380PrimComputer_B.left_wing_wheel_speed;
  A380PrimComputer_Y.out.data.analog_inputs.right_body_wheel_speed = A380PrimComputer_B.right_body_wheel_speed;
  A380PrimComputer_Y.out.data.analog_inputs.right_wing_wheel_speed = A380PrimComputer_B.right_wing_wheel_speed;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM = A380PrimComputer_B.SSM_npr;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data = A380PrimComputer_B.Data_j0;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM = A380PrimComputer_B.SSM_ew;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data = A380PrimComputer_B.Data_bs;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.mach.SSM = A380PrimComputer_B.SSM_lt;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.mach.Data = A380PrimComputer_B.Data_hp;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM = A380PrimComputer_B.SSM_ger;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data = A380PrimComputer_B.Data_ct;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM = A380PrimComputer_B.SSM_pxo;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data = A380PrimComputer_B.Data_pc;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM = A380PrimComputer_B.SSM_co2;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data = A380PrimComputer_B.Data_nzt;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM = A380PrimComputer_B.SSM_ny;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data = A380PrimComputer_B.Data_c0;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM = A380PrimComputer_B.SSM_l4;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data = A380PrimComputer_B.Data_ojg;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM = A380PrimComputer_B.SSM_nm;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data = A380PrimComputer_B.Data_lm;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM = A380PrimComputer_B.SSM_nh;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data = A380PrimComputer_B.Data_fz;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.mach.SSM = A380PrimComputer_B.SSM_dl;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.mach.Data = A380PrimComputer_B.Data_oz;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM = A380PrimComputer_B.SSM_dx;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data = A380PrimComputer_B.Data_gf;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM = A380PrimComputer_B.SSM_a5h;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data = A380PrimComputer_B.Data_nn;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM = A380PrimComputer_B.SSM_fl;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data = A380PrimComputer_B.Data_a0z;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM = A380PrimComputer_B.SSM_p3;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data = A380PrimComputer_B.Data_fk;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM = A380PrimComputer_B.SSM_ns;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data = A380PrimComputer_B.Data_bu;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM = A380PrimComputer_B.SSM_bm;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data = A380PrimComputer_B.Data_o23;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM = A380PrimComputer_B.SSM_nl;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data = A380PrimComputer_B.Data_g3;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.mach.SSM = A380PrimComputer_B.SSM_grm;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.mach.Data = A380PrimComputer_B.Data_icc;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM = A380PrimComputer_B.SSM_gzm;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data = A380PrimComputer_B.Data;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM = A380PrimComputer_B.SSM;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data = A380PrimComputer_B.Data_f;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM = A380PrimComputer_B.SSM_k;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data = A380PrimComputer_B.Data_fw;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM = A380PrimComputer_B.SSM_kx;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data = A380PrimComputer_B.Data_fwx;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM = A380PrimComputer_B.SSM_kxx;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data = A380PrimComputer_B.Data_fwxk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.SSM = A380PrimComputer_B.SSM_kxxt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.Data = A380PrimComputer_B.Data_fwxkf;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.SSM = A380PrimComputer_B.SSM_kxxta;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.Data = A380PrimComputer_B.Data_fwxkft;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.SSM = A380PrimComputer_B.SSM_kxxtac;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.Data = A380PrimComputer_B.Data_fwxkftc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM = A380PrimComputer_B.SSM_kxxtac0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.Data = A380PrimComputer_B.Data_fwxkftc3;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM = A380PrimComputer_B.SSM_kxxtac0z;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data = A380PrimComputer_B.Data_fwxkftc3e;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.SSM = A380PrimComputer_B.SSM_kxxtac0zt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.Data = A380PrimComputer_B.Data_fwxkftc3ep;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM = A380PrimComputer_B.SSM_kxxtac0ztg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.Data = A380PrimComputer_B.Data_fwxkftc3epg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgtd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2u;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgtdx;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2ux;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgtdxc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2uxn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data = A380PrimComputer_B.Data_h;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM = A380PrimComputer_B.SSM_ky;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data = A380PrimComputer_B.Data_e;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM = A380PrimComputer_B.SSM_d;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data = A380PrimComputer_B.Data_j;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM = A380PrimComputer_B.SSM_h;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.Data = A380PrimComputer_B.Data_d;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM = A380PrimComputer_B.SSM_kb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data = A380PrimComputer_B.Data_p;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM = A380PrimComputer_B.SSM_p;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data = A380PrimComputer_B.Data_i;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM = A380PrimComputer_B.SSM_di;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data = A380PrimComputer_B.Data_g;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM = A380PrimComputer_B.SSM_j;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.Data = A380PrimComputer_B.Data_a;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM = A380PrimComputer_B.SSM_i;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data = A380PrimComputer_B.Data_eb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM = A380PrimComputer_B.SSM_g;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data = A380PrimComputer_B.Data_jo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM = A380PrimComputer_B.SSM_db;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data = A380PrimComputer_B.Data_ex;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_n;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data = A380PrimComputer_B.Data_fd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_a;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data = A380PrimComputer_B.Data_ja;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM = A380PrimComputer_B.SSM_ir;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data = A380PrimComputer_B.Data_k;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_hu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data = A380PrimComputer_B.Data_joy;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_e;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data = A380PrimComputer_B.Data_h3;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM = A380PrimComputer_B.SSM_gr;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.Data = A380PrimComputer_B.Data_a0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputer_B.SSM_ev;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputer_B.Data_b;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM = A380PrimComputer_B.SSM_l;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data = A380PrimComputer_B.Data_eq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM = A380PrimComputer_B.SSM_ei;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data = A380PrimComputer_B.Data_iz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.SSM = A380PrimComputer_B.SSM_an;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.Data = A380PrimComputer_B.Data_j2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.SSM = A380PrimComputer_B.SSM_c;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.Data = A380PrimComputer_B.Data_o;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.SSM = A380PrimComputer_B.SSM_cb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.Data = A380PrimComputer_B.Data_m;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM = A380PrimComputer_B.SSM_lb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.Data = A380PrimComputer_B.Data_oq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM = A380PrimComputer_B.SSM_ia;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data = A380PrimComputer_B.Data_fo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.SSM = A380PrimComputer_B.SSM_kyz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.Data = A380PrimComputer_B.Data_p1;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM = A380PrimComputer_B.SSM_as;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.Data = A380PrimComputer_B.Data_p1y;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM = A380PrimComputer_B.SSM_is;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data = A380PrimComputer_B.Data_l;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM = A380PrimComputer_B.SSM_ca;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data = A380PrimComputer_B.Data_kp;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM = A380PrimComputer_B.SSM_o;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data = A380PrimComputer_B.Data_k0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM = A380PrimComputer_B.SSM_ak;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.Data = A380PrimComputer_B.Data_pi;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM = A380PrimComputer_B.SSM_cbj;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data = A380PrimComputer_B.Data_dm;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM = A380PrimComputer_B.SSM_cu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data = A380PrimComputer_B.Data_f5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM = A380PrimComputer_B.SSM_nn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data = A380PrimComputer_B.Data_js;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM = A380PrimComputer_B.SSM_b;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.Data = A380PrimComputer_B.Data_ee;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM = A380PrimComputer_B.SSM_m;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data = A380PrimComputer_B.Data_ig;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM = A380PrimComputer_B.SSM_f;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data = A380PrimComputer_B.Data_mk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM = A380PrimComputer_B.SSM_bp;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data = A380PrimComputer_B.Data_pu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM = A380PrimComputer_B.SSM_hb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.Data = A380PrimComputer_B.Data_ly;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM = A380PrimComputer_B.SSM_gz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data = A380PrimComputer_B.Data_jq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM = A380PrimComputer_B.SSM_pv;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data = A380PrimComputer_B.Data_o5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM = A380PrimComputer_B.SSM_mf;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data = A380PrimComputer_B.Data_lyw;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_m0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data = A380PrimComputer_B.Data_gq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_kd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data = A380PrimComputer_B.Data_n;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM = A380PrimComputer_B.SSM_pu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data = A380PrimComputer_B.Data_bq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_nv;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data = A380PrimComputer_B.Data_dmn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_d5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data = A380PrimComputer_B.Data_jn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM = A380PrimComputer_B.SSM_eo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.Data = A380PrimComputer_B.Data_c;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputer_B.SSM_nd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputer_B.Data_lx;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM = A380PrimComputer_B.SSM_bq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data = A380PrimComputer_B.Data_jb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM = A380PrimComputer_B.SSM_hi;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data = A380PrimComputer_B.Data_fn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.SSM = A380PrimComputer_B.SSM_mm;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.Data = A380PrimComputer_B.Data_od;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.SSM = A380PrimComputer_B.SSM_kz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.Data = A380PrimComputer_B.Data_ez;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.SSM = A380PrimComputer_B.SSM_il;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.Data = A380PrimComputer_B.Data_pw;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM = A380PrimComputer_B.SSM_i2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.Data = A380PrimComputer_B.Data_m2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM = A380PrimComputer_B.SSM_ah;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data = A380PrimComputer_B.Data_ek;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.SSM = A380PrimComputer_B.SSM_en;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.Data = A380PrimComputer_B.Data_iy;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM = A380PrimComputer_B.SSM_dq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.Data = A380PrimComputer_B.Data_lk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM = A380PrimComputer_B.SSM_px;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data = A380PrimComputer_B.Data_ca;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM = A380PrimComputer_B.SSM_lbo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data = A380PrimComputer_B.Data_pix;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM = A380PrimComputer_B.SSM_p5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data = A380PrimComputer_B.Data_di;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM = A380PrimComputer_B.SSM_mk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.Data = A380PrimComputer_B.Data_lz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM = A380PrimComputer_B.SSM_mu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data = A380PrimComputer_B.Data_lu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM = A380PrimComputer_B.SSM_cbl;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data = A380PrimComputer_B.Data_dc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM = A380PrimComputer_B.SSM_gzd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data = A380PrimComputer_B.Data_gc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM = A380PrimComputer_B.SSM_mo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.Data = A380PrimComputer_B.Data_am;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM = A380PrimComputer_B.SSM_me;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data = A380PrimComputer_B.Data_mo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM = A380PrimComputer_B.SSM_mj;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data = A380PrimComputer_B.Data_dg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM = A380PrimComputer_B.SSM_a5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data = A380PrimComputer_B.Data_e1;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM = A380PrimComputer_B.SSM_bt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.Data = A380PrimComputer_B.Data_fp;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM = A380PrimComputer_B.SSM_om;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data = A380PrimComputer_B.Data_ns;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM = A380PrimComputer_B.SSM_ar;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data = A380PrimComputer_B.Data_m3;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM = A380PrimComputer_B.SSM_ce;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data = A380PrimComputer_B.Data_oj;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_ed;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data = A380PrimComputer_B.Data_jy;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_jh;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data = A380PrimComputer_B.Data_j1;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM = A380PrimComputer_B.SSM_je;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data = A380PrimComputer_B.Data_fc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_jt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data = A380PrimComputer_B.Data_of;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_cui;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data = A380PrimComputer_B.Data_lg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM = A380PrimComputer_B.SSM_mq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.Data = A380PrimComputer_B.Data_n4;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputer_B.SSM_ni;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputer_B.Data_ot;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM = A380PrimComputer_B.SSM_df;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data = A380PrimComputer_B.Data_gv;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM = A380PrimComputer_B.SSM_oe;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data = A380PrimComputer_B.Data_ou;
  A380PrimComputer_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.SSM = A380PrimComputer_B.SSM_ha;
  A380PrimComputer_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.Data = A380PrimComputer_B.Data_dh;
  A380PrimComputer_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.SSM = A380PrimComputer_B.SSM_op;
  A380PrimComputer_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.Data = A380PrimComputer_B.Data_ph;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM = A380PrimComputer_B.SSM_a50;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data = A380PrimComputer_B.Data_gs;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM = A380PrimComputer_B.SSM_og;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data = A380PrimComputer_B.Data_fd4;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM = A380PrimComputer_B.SSM_a4;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data = A380PrimComputer_B.Data_hm;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM = A380PrimComputer_B.SSM_bv;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data = A380PrimComputer_B.Data_i2;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM = A380PrimComputer_B.SSM_bo;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data = A380PrimComputer_B.Data_og;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM = A380PrimComputer_B.SSM_d1;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data = A380PrimComputer_B.Data_fv;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM = A380PrimComputer_B.SSM_hy;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data = A380PrimComputer_B.Data_oc;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM = A380PrimComputer_B.SSM_gi;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data = A380PrimComputer_B.Data_kq;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM = A380PrimComputer_B.SSM_pp;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data = A380PrimComputer_B.Data_ne;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM = A380PrimComputer_B.SSM_iab;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data = A380PrimComputer_B.Data_it;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_jtv;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data = A380PrimComputer_B.Data_ch;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_fy;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data = A380PrimComputer_B.Data_bb;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_d4;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data = A380PrimComputer_B.Data_ol;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_ars;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data = A380PrimComputer_B.Data_hw;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_din;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data = A380PrimComputer_B.Data_hs;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_m3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data = A380PrimComputer_B.Data_fj;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.SSM = A380PrimComputer_B.SSM_np;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data = A380PrimComputer_B.Data_ky;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.SSM = A380PrimComputer_B.SSM_ax;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data = A380PrimComputer_B.Data_h5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.SSM = A380PrimComputer_B.SSM_cl;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data = A380PrimComputer_B.Data_ku;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.SSM = A380PrimComputer_B.SSM_es;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data = A380PrimComputer_B.Data_jp;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.SSM = A380PrimComputer_B.SSM_gi1;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data = A380PrimComputer_B.Data_nu;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.SSM = A380PrimComputer_B.SSM_jz;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data = A380PrimComputer_B.Data_br;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.SSM = A380PrimComputer_B.SSM_kt;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data = A380PrimComputer_B.Data_ae;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.SSM = A380PrimComputer_B.SSM_ds;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data = A380PrimComputer_B.Data_pe;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.SSM = A380PrimComputer_B.SSM_eg;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data = A380PrimComputer_B.Data_fy;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.SSM = A380PrimComputer_B.SSM_a0;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data = A380PrimComputer_B.Data_na;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.SSM = A380PrimComputer_B.SSM_cv;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data = A380PrimComputer_B.Data_my;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.SSM = A380PrimComputer_B.SSM_ea;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data = A380PrimComputer_B.Data_i4;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.SSM = A380PrimComputer_B.SSM_p4;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data = A380PrimComputer_B.Data_cx;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.SSM = A380PrimComputer_B.SSM_m2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data = A380PrimComputer_B.Data_nz;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.SSM = A380PrimComputer_B.SSM_bt0;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data = A380PrimComputer_B.Data_id;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.SSM = A380PrimComputer_B.SSM_nr;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data = A380PrimComputer_B.Data_o2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_fr;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data = A380PrimComputer_B.Data_gqq;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_cc;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data = A380PrimComputer_B.Data_md;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_lm;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data = A380PrimComputer_B.Data_cz;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_mkm;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data =
    A380PrimComputer_B.Data_pm;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.ths_command_deg.SSM = A380PrimComputer_B.SSM_jhd;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.ths_command_deg.Data = A380PrimComputer_B.Data_bj;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.SSM = A380PrimComputer_B.SSM_av;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data = A380PrimComputer_B.Data_ox;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.SSM = A380PrimComputer_B.SSM_ira;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data = A380PrimComputer_B.Data_pe5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.SSM = A380PrimComputer_B.SSM_ge;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.Data = A380PrimComputer_B.Data_jj;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.SSM = A380PrimComputer_B.SSM_lv;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.Data = A380PrimComputer_B.Data_p5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputer_B.SSM_cg;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.Data = A380PrimComputer_B.Data_ekl;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputer_B.SSM_be;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.Data = A380PrimComputer_B.Data_nd;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.SSM = A380PrimComputer_B.SSM_axb;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.Data = A380PrimComputer_B.Data_n2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.aileron_status_word.SSM = A380PrimComputer_B.SSM_nz;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.aileron_status_word.Data = A380PrimComputer_B.Data_dl;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM = A380PrimComputer_B.SSM_cx;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data = A380PrimComputer_B.Data_gs2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.SSM = A380PrimComputer_B.SSM_gh;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data = A380PrimComputer_B.Data_h4;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM = A380PrimComputer_B.SSM_ks;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data = A380PrimComputer_B.Data_e3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.SSM = A380PrimComputer_B.SSM_pw;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data = A380PrimComputer_B.Data_f5h;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.spoiler_status_word.SSM = A380PrimComputer_B.SSM_fh;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.spoiler_status_word.Data = A380PrimComputer_B.Data_an;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.SSM = A380PrimComputer_B.SSM_gzn;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data = A380PrimComputer_B.Data_i4o;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.SSM = A380PrimComputer_B.SSM_oo;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data = A380PrimComputer_B.Data_af;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_status_word.SSM = A380PrimComputer_B.SSM_evh;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_status_word.Data = A380PrimComputer_B.Data_bm;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM = A380PrimComputer_B.SSM_cn;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_1_position_deg.Data = A380PrimComputer_B.Data_dk;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_2_position_deg.SSM = A380PrimComputer_B.SSM_co;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_2_position_deg.Data = A380PrimComputer_B.Data_nv;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_3_position_deg.SSM = A380PrimComputer_B.SSM_pe;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.elevator_3_position_deg.Data = A380PrimComputer_B.Data_jpf;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.ths_position_deg.SSM = A380PrimComputer_B.SSM_cgz;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.ths_position_deg.Data = A380PrimComputer_B.Data_i5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_status_word.SSM = A380PrimComputer_B.SSM_fw;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_status_word.Data = A380PrimComputer_B.Data_k2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM = A380PrimComputer_B.SSM_h4;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_1_position_deg.Data = A380PrimComputer_B.Data_as;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM = A380PrimComputer_B.SSM_cb3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.rudder_2_position_deg.Data = A380PrimComputer_B.Data_gk;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.fctl_law_status_word.SSM = A380PrimComputer_B.SSM_pj;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.fctl_law_status_word.Data = A380PrimComputer_B.Data_jl;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.misc_data_status_word.SSM = A380PrimComputer_B.SSM_dv;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus.misc_data_status_word.Data = A380PrimComputer_B.Data_e32;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_i4;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data = A380PrimComputer_B.Data_ih;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_fm;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data = A380PrimComputer_B.Data_du;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_e5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data = A380PrimComputer_B.Data_nx;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_bf;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data = A380PrimComputer_B.Data_n0;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_fd;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data = A380PrimComputer_B.Data_eqi;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.SSM = A380PrimComputer_B.SSM_fv;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data = A380PrimComputer_B.Data_om;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.SSM = A380PrimComputer_B.SSM_dt;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data = A380PrimComputer_B.Data_nr;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.SSM = A380PrimComputer_B.SSM_j5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data = A380PrimComputer_B.Data_p3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.SSM = A380PrimComputer_B.SSM_ng;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data = A380PrimComputer_B.Data_nb;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.SSM = A380PrimComputer_B.SSM_cs;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data = A380PrimComputer_B.Data_hd;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.SSM = A380PrimComputer_B.SSM_ls;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data = A380PrimComputer_B.Data_al;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.SSM = A380PrimComputer_B.SSM_dg;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data = A380PrimComputer_B.Data_gu;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.SSM = A380PrimComputer_B.SSM_d3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data = A380PrimComputer_B.Data_ix;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.SSM = A380PrimComputer_B.SSM_p2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data = A380PrimComputer_B.Data_do;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.SSM = A380PrimComputer_B.SSM_bo0;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data = A380PrimComputer_B.Data_hu;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.SSM = A380PrimComputer_B.SSM_bc;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data = A380PrimComputer_B.Data_pm1;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.SSM = A380PrimComputer_B.SSM_h0;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data = A380PrimComputer_B.Data_i2y;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.SSM = A380PrimComputer_B.SSM_giz;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data = A380PrimComputer_B.Data_pg;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.SSM = A380PrimComputer_B.SSM_mqp;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data = A380PrimComputer_B.Data_ni;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.SSM = A380PrimComputer_B.SSM_ba;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data = A380PrimComputer_B.Data_fr;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.SSM = A380PrimComputer_B.SSM_in;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data = A380PrimComputer_B.Data_cn;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.SSM = A380PrimComputer_B.SSM_ff;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data = A380PrimComputer_B.Data_nxl;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_ic;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data = A380PrimComputer_B.Data_jh;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_fs;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data = A380PrimComputer_B.Data_gl;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_ja;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data = A380PrimComputer_B.Data_gn;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.SSM = A380PrimComputer_B.SSM_js;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data =
    A380PrimComputer_B.Data_myb;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.ths_command_deg.SSM = A380PrimComputer_B.SSM_is3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.ths_command_deg.Data = A380PrimComputer_B.Data_l2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.SSM = A380PrimComputer_B.SSM_ag;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data = A380PrimComputer_B.Data_o5o;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.SSM = A380PrimComputer_B.SSM_f5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data = A380PrimComputer_B.Data_l5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.SSM = A380PrimComputer_B.SSM_ph;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.Data = A380PrimComputer_B.Data_dc2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.SSM = A380PrimComputer_B.SSM_jw;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.Data = A380PrimComputer_B.Data_gr;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.SSM = A380PrimComputer_B.SSM_jy;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.Data = A380PrimComputer_B.Data_gp;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.SSM = A380PrimComputer_B.SSM_j1;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.Data = A380PrimComputer_B.Data_i3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.SSM = A380PrimComputer_B.SSM_ov;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.Data = A380PrimComputer_B.Data_et;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.aileron_status_word.SSM = A380PrimComputer_B.SSM_mx;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.aileron_status_word.Data = A380PrimComputer_B.Data_mc;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM = A380PrimComputer_B.SSM_b4;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data = A380PrimComputer_B.Data_k3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.SSM = A380PrimComputer_B.SSM_gb;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data = A380PrimComputer_B.Data_f2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM = A380PrimComputer_B.SSM_oh;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data = A380PrimComputer_B.Data_gh;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.SSM = A380PrimComputer_B.SSM_mm5;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data = A380PrimComputer_B.Data_ed;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.spoiler_status_word.SSM = A380PrimComputer_B.SSM_br;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.spoiler_status_word.Data = A380PrimComputer_B.Data_o2j;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.SSM = A380PrimComputer_B.SSM_c2;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data = A380PrimComputer_B.Data_i43;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.SSM = A380PrimComputer_B.SSM_hc;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data = A380PrimComputer_B.Data_ic;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_status_word.SSM = A380PrimComputer_B.SSM_ktr;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_status_word.Data = A380PrimComputer_B.Data_ak;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM = A380PrimComputer_B.SSM_gl;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_1_position_deg.Data = A380PrimComputer_B.Data_jg;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM = A380PrimComputer_B.SSM_my;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_2_position_deg.Data = A380PrimComputer_B.Data_cu;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_3_position_deg.SSM = A380PrimComputer_B.SSM_j3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.elevator_3_position_deg.Data = A380PrimComputer_B.Data_ep;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.ths_position_deg.SSM = A380PrimComputer_B.SSM_go;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.ths_position_deg.Data = A380PrimComputer_B.Data_d3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_status_word.SSM = A380PrimComputer_B.SSM_e5c;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_status_word.Data = A380PrimComputer_B.Data_bt;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_1_position_deg.SSM = A380PrimComputer_B.SSM_dk;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_1_position_deg.Data = A380PrimComputer_B.Data_e0;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_2_position_deg.SSM = A380PrimComputer_B.SSM_evc;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.rudder_2_position_deg.Data = A380PrimComputer_B.Data_jl3;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.fctl_law_status_word.SSM = A380PrimComputer_B.SSM_kk;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.fctl_law_status_word.Data = A380PrimComputer_B.Data_nm;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.misc_data_status_word.SSM = A380PrimComputer_B.SSM_af;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus.misc_data_status_word.Data = A380PrimComputer_B.Data_ia;
  A380PrimComputer_Y.out.data.bus_inputs.isis_1_bus = A380PrimComputer_B.isis_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.isis_2_bus = A380PrimComputer_B.isis_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_pitch_1_bus = A380PrimComputer_B.rate_gyro_pitch_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_pitch_2_bus = A380PrimComputer_B.rate_gyro_pitch_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_roll_1_bus = A380PrimComputer_B.rate_gyro_roll_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_roll_2_bus = A380PrimComputer_B.rate_gyro_roll_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_yaw_1_bus = A380PrimComputer_B.rate_gyro_yaw_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_yaw_2_bus = A380PrimComputer_B.rate_gyro_yaw_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.irdc_1_bus = A380PrimComputer_B.irdc_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.irdc_2_bus = A380PrimComputer_B.irdc_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.irdc_3_bus = A380PrimComputer_B.irdc_3_bus;
  A380PrimComputer_Y.out.data.bus_inputs.irdc_4_a_bus = A380PrimComputer_B.irdc_4_a_bus;
  A380PrimComputer_Y.out.data.bus_inputs.irdc_4_b_bus = A380PrimComputer_B.irdc_4_b_bus;
  A380PrimComputer_Y.out.data.bus_inputs.fcu_own_bus = A380PrimComputer_B.fcu_own_bus;
  A380PrimComputer_Y.out.data.bus_inputs.fcu_opp_bus = A380PrimComputer_B.fcu_opp_bus;
  A380PrimComputer_Y.out.data.bus_inputs.sec_1_bus = A380PrimComputer_B.sec_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.sec_2_bus = A380PrimComputer_B.sec_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.sec_3_bus = A380PrimComputer_B.sec_3_bus;
  A380PrimComputer_Y.out.laws = A380PrimComputer_B.laws;
  A380PrimComputer_Y.out.logic = A380PrimComputer_B.logic;
}

void A380PrimComputer::initialize()
{
  A380PrimComputer_DWork.Delay_DSTATE_cc = A380PrimComputer_P.Delay_InitialCondition;
  A380PrimComputer_DWork.Delay1_DSTATE = A380PrimComputer_P.Delay1_InitialCondition;
  A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.SRFlipFlop_initial_condition;
  A380PrimComputer_DWork.Memory_PreviousInput_j = A380PrimComputer_P.SRFlipFlop_initial_condition_c;
  A380PrimComputer_DWork.Delay1_DSTATE_b = A380PrimComputer_P.Delay1_InitialCondition_n;
  A380PrimComputer_DWork.Delay_DSTATE_f = A380PrimComputer_P.Delay_InitialCondition_d;
  A380PrimComputer_DWork.Delay_DSTATE = A380PrimComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380PrimComputer_DWork.icLoad = true;
  LawMDLOBJ2.init();
  LawMDLOBJ5.init();
  LawMDLOBJ3.init();
  A380PrimComputer_B.dt = A380PrimComputer_P.out_Y0.data.time.dt;
  A380PrimComputer_B.simulation_time = A380PrimComputer_P.out_Y0.data.time.simulation_time;
  A380PrimComputer_B.monotonic_time = A380PrimComputer_P.out_Y0.data.time.monotonic_time;
  A380PrimComputer_B.slew_on = A380PrimComputer_P.out_Y0.data.sim_data.slew_on;
  A380PrimComputer_B.pause_on = A380PrimComputer_P.out_Y0.data.sim_data.pause_on;
  A380PrimComputer_B.tracking_mode_on_override = A380PrimComputer_P.out_Y0.data.sim_data.tracking_mode_on_override;
  A380PrimComputer_B.tailstrike_protection_on = A380PrimComputer_P.out_Y0.data.sim_data.tailstrike_protection_on;
  A380PrimComputer_B.computer_running = A380PrimComputer_P.out_Y0.data.sim_data.computer_running;
  A380PrimComputer_B.prim_overhead_button_pressed =
    A380PrimComputer_P.out_Y0.data.discrete_inputs.prim_overhead_button_pressed;
  A380PrimComputer_B.is_unit_1 = A380PrimComputer_P.out_Y0.data.discrete_inputs.is_unit_1;
  A380PrimComputer_B.is_unit_2 = A380PrimComputer_P.out_Y0.data.discrete_inputs.is_unit_2;
  A380PrimComputer_B.is_unit_3 = A380PrimComputer_P.out_Y0.data.discrete_inputs.is_unit_3;
  A380PrimComputer_B.capt_priority_takeover_pressed =
    A380PrimComputer_P.out_Y0.data.discrete_inputs.capt_priority_takeover_pressed;
  A380PrimComputer_B.fo_priority_takeover_pressed =
    A380PrimComputer_P.out_Y0.data.discrete_inputs.fo_priority_takeover_pressed;
  A380PrimComputer_B.ap_1_puhsbutton_pressed = A380PrimComputer_P.out_Y0.data.discrete_inputs.ap_1_puhsbutton_pressed;
  A380PrimComputer_B.ap_2_puhsbutton_pressed = A380PrimComputer_P.out_Y0.data.discrete_inputs.ap_2_puhsbutton_pressed;
  A380PrimComputer_B.fcu_healthy = A380PrimComputer_P.out_Y0.data.discrete_inputs.fcu_healthy;
  A380PrimComputer_B.athr_pushbutton = A380PrimComputer_P.out_Y0.data.discrete_inputs.athr_pushbutton;
  A380PrimComputer_B.ir_3_on_capt = A380PrimComputer_P.out_Y0.data.discrete_inputs.ir_3_on_capt;
  A380PrimComputer_B.ir_3_on_fo = A380PrimComputer_P.out_Y0.data.discrete_inputs.ir_3_on_fo;
  A380PrimComputer_B.adr_3_on_capt = A380PrimComputer_P.out_Y0.data.discrete_inputs.adr_3_on_capt;
  A380PrimComputer_B.adr_3_on_fo = A380PrimComputer_P.out_Y0.data.discrete_inputs.adr_3_on_fo;
  A380PrimComputer_B.pitch_trim_up_pressed = A380PrimComputer_P.out_Y0.data.discrete_inputs.pitch_trim_up_pressed;
  A380PrimComputer_B.pitch_trim_down_pressed = A380PrimComputer_P.out_Y0.data.discrete_inputs.pitch_trim_down_pressed;
  A380PrimComputer_B.green_low_pressure = A380PrimComputer_P.out_Y0.data.discrete_inputs.green_low_pressure;
  A380PrimComputer_B.yellow_low_pressure = A380PrimComputer_P.out_Y0.data.discrete_inputs.yellow_low_pressure;
  A380PrimComputer_B.capt_pitch_stick_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.capt_pitch_stick_pos;
  A380PrimComputer_B.fo_pitch_stick_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.fo_pitch_stick_pos;
  A380PrimComputer_B.capt_roll_stick_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.capt_roll_stick_pos;
  A380PrimComputer_B.fo_roll_stick_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.fo_roll_stick_pos;
  A380PrimComputer_B.speed_brake_lever_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.speed_brake_lever_pos;
  A380PrimComputer_B.thr_lever_1_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.thr_lever_1_pos;
  A380PrimComputer_B.thr_lever_2_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.thr_lever_2_pos;
  A380PrimComputer_B.thr_lever_3_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.thr_lever_3_pos;
  A380PrimComputer_B.thr_lever_4_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.thr_lever_4_pos;
  A380PrimComputer_B.elevator_1_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.elevator_1_pos_deg;
  A380PrimComputer_B.elevator_2_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.elevator_2_pos_deg;
  A380PrimComputer_B.elevator_3_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.elevator_3_pos_deg;
  A380PrimComputer_B.ths_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.ths_pos_deg;
  A380PrimComputer_B.left_aileron_1_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.left_aileron_1_pos_deg;
  A380PrimComputer_B.left_aileron_2_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.left_aileron_2_pos_deg;
  A380PrimComputer_B.right_aileron_1_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.right_aileron_1_pos_deg;
  A380PrimComputer_B.right_aileron_2_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.right_aileron_2_pos_deg;
  A380PrimComputer_B.left_spoiler_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.left_spoiler_pos_deg;
  A380PrimComputer_B.right_spoiler_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.right_spoiler_pos_deg;
  A380PrimComputer_B.rudder_1_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.rudder_1_pos_deg;
  A380PrimComputer_B.rudder_2_pos_deg = A380PrimComputer_P.out_Y0.data.analog_inputs.rudder_2_pos_deg;
  A380PrimComputer_B.rudder_pedal_pos = A380PrimComputer_P.out_Y0.data.analog_inputs.rudder_pedal_pos;
  A380PrimComputer_B.yellow_hyd_pressure_psi = A380PrimComputer_P.out_Y0.data.analog_inputs.yellow_hyd_pressure_psi;
  A380PrimComputer_B.green_hyd_pressure_psi = A380PrimComputer_P.out_Y0.data.analog_inputs.green_hyd_pressure_psi;
  A380PrimComputer_B.vert_acc_1_g = A380PrimComputer_P.out_Y0.data.analog_inputs.vert_acc_1_g;
  A380PrimComputer_B.vert_acc_2_g = A380PrimComputer_P.out_Y0.data.analog_inputs.vert_acc_2_g;
  A380PrimComputer_B.vert_acc_3_g = A380PrimComputer_P.out_Y0.data.analog_inputs.vert_acc_3_g;
  A380PrimComputer_B.lat_acc_1_g = A380PrimComputer_P.out_Y0.data.analog_inputs.lat_acc_1_g;
  A380PrimComputer_B.lat_acc_2_g = A380PrimComputer_P.out_Y0.data.analog_inputs.lat_acc_2_g;
  A380PrimComputer_B.lat_acc_3_g = A380PrimComputer_P.out_Y0.data.analog_inputs.lat_acc_3_g;
  A380PrimComputer_B.left_body_wheel_speed = A380PrimComputer_P.out_Y0.data.analog_inputs.left_body_wheel_speed;
  A380PrimComputer_B.left_wing_wheel_speed = A380PrimComputer_P.out_Y0.data.analog_inputs.left_wing_wheel_speed;
  A380PrimComputer_B.right_body_wheel_speed = A380PrimComputer_P.out_Y0.data.analog_inputs.right_body_wheel_speed;
  A380PrimComputer_B.right_wing_wheel_speed = A380PrimComputer_P.out_Y0.data.analog_inputs.right_wing_wheel_speed;
  A380PrimComputer_B.SSM_npr = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
  A380PrimComputer_B.Data_j0 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
  A380PrimComputer_B.SSM_ew = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
  A380PrimComputer_B.Data_bs = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
  A380PrimComputer_B.SSM_lt = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.mach.SSM;
  A380PrimComputer_B.Data_hp = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.mach.Data;
  A380PrimComputer_B.SSM_ger = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
  A380PrimComputer_B.Data_ct = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
  A380PrimComputer_B.SSM_pxo = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
  A380PrimComputer_B.Data_pc = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
  A380PrimComputer_B.SSM_co2 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
  A380PrimComputer_B.Data_nzt = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
  A380PrimComputer_B.SSM_ny = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
  A380PrimComputer_B.Data_c0 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
  A380PrimComputer_B.SSM_l4 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
  A380PrimComputer_B.Data_ojg =
    A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
  A380PrimComputer_B.SSM_nm = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
  A380PrimComputer_B.Data_lm = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
  A380PrimComputer_B.SSM_nh = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
  A380PrimComputer_B.Data_fz = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
  A380PrimComputer_B.SSM_dl = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.mach.SSM;
  A380PrimComputer_B.Data_oz = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.mach.Data;
  A380PrimComputer_B.SSM_dx = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
  A380PrimComputer_B.Data_gf = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
  A380PrimComputer_B.SSM_a5h = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
  A380PrimComputer_B.Data_nn = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
  A380PrimComputer_B.SSM_fl = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
  A380PrimComputer_B.Data_a0z = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
  A380PrimComputer_B.SSM_p3 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
  A380PrimComputer_B.Data_fk = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
  A380PrimComputer_B.SSM_ns = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
  A380PrimComputer_B.Data_bu =
    A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
  A380PrimComputer_B.SSM_bm = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
  A380PrimComputer_B.Data_o23 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
  A380PrimComputer_B.SSM_nl = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
  A380PrimComputer_B.Data_g3 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
  A380PrimComputer_B.SSM_grm = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.mach.SSM;
  A380PrimComputer_B.Data_icc = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.mach.Data;
  A380PrimComputer_B.SSM_gzm = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
  A380PrimComputer_B.Data = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
  A380PrimComputer_B.SSM = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
  A380PrimComputer_B.Data_f = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
  A380PrimComputer_B.SSM_k = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
  A380PrimComputer_B.Data_fw = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
  A380PrimComputer_B.SSM_kx = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
  A380PrimComputer_B.Data_fwx = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
  A380PrimComputer_B.SSM_kxx = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
  A380PrimComputer_B.Data_fwxk =
    A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
  A380PrimComputer_B.SSM_kxxt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
  A380PrimComputer_B.Data_fwxkf = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
  A380PrimComputer_B.SSM_kxxta = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
  A380PrimComputer_B.Data_fwxkft = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.Data;
  A380PrimComputer_B.SSM_kxxtac = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
  A380PrimComputer_B.Data_fwxkftc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.Data;
  A380PrimComputer_B.SSM_kxxtac0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
  A380PrimComputer_B.Data_fwxkftc3 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
  A380PrimComputer_B.SSM_kxxtac0z = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
  A380PrimComputer_B.Data_fwxkftc3e = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
  A380PrimComputer_B.SSM_kxxtac0zt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
  A380PrimComputer_B.Data_fwxkftc3ep = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
  A380PrimComputer_B.SSM_kxxtac0ztg = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
  A380PrimComputer_B.Data_fwxkftc3epg = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
  A380PrimComputer_B.SSM_kxxtac0ztgf = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
  A380PrimComputer_B.Data_fwxkftc3epgt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
  A380PrimComputer_B.SSM_kxxtac0ztgf2 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputer_B.Data_fwxkftc3epgtd =
    A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
  A380PrimComputer_B.SSM_kxxtac0ztgf2u = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
  A380PrimComputer_B.Data_fwxkftc3epgtdx = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
  A380PrimComputer_B.SSM_kxxtac0ztgf2ux = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
  A380PrimComputer_B.Data_fwxkftc3epgtdxc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
  A380PrimComputer_B.SSM_kxxtac0ztgf2uxn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
  A380PrimComputer_B.Data_h = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
  A380PrimComputer_B.SSM_ky = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
  A380PrimComputer_B.Data_e = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
  A380PrimComputer_B.SSM_d = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
  A380PrimComputer_B.Data_j = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  A380PrimComputer_B.SSM_h = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
  A380PrimComputer_B.Data_d = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  A380PrimComputer_B.SSM_kb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputer_B.Data_p = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputer_B.SSM_p = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputer_B.Data_i = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
  A380PrimComputer_B.SSM_di = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputer_B.Data_g = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputer_B.SSM_j = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
  A380PrimComputer_B.Data_a = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
  A380PrimComputer_B.SSM_i = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
  A380PrimComputer_B.Data_eb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
  A380PrimComputer_B.SSM_g = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
  A380PrimComputer_B.Data_jo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  A380PrimComputer_B.SSM_db = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputer_B.Data_ex = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
  A380PrimComputer_B.SSM_n = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputer_B.Data_fd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputer_B.SSM_a = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputer_B.Data_ja = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  A380PrimComputer_B.SSM_ir = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
  A380PrimComputer_B.Data_k = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
  A380PrimComputer_B.SSM_hu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputer_B.Data_joy = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
  A380PrimComputer_B.SSM_e = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputer_B.Data_h3 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputer_B.SSM_gr = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
  A380PrimComputer_B.Data_a0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
  A380PrimComputer_B.SSM_ev = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputer_B.Data_b = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputer_B.SSM_l = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
  A380PrimComputer_B.Data_eq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
  A380PrimComputer_B.SSM_ei = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
  A380PrimComputer_B.Data_iz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
  A380PrimComputer_B.SSM_an = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
  A380PrimComputer_B.Data_j2 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
  A380PrimComputer_B.SSM_c = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
  A380PrimComputer_B.Data_o = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.Data;
  A380PrimComputer_B.SSM_cb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
  A380PrimComputer_B.Data_m = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.Data;
  A380PrimComputer_B.SSM_lb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
  A380PrimComputer_B.Data_oq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
  A380PrimComputer_B.SSM_ia = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
  A380PrimComputer_B.Data_fo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
  A380PrimComputer_B.SSM_kyz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
  A380PrimComputer_B.Data_p1 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
  A380PrimComputer_B.SSM_as = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
  A380PrimComputer_B.Data_p1y = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
  A380PrimComputer_B.SSM_is = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
  A380PrimComputer_B.Data_l = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
  A380PrimComputer_B.SSM_ca = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputer_B.Data_kp = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
  A380PrimComputer_B.SSM_o = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
  A380PrimComputer_B.Data_k0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
  A380PrimComputer_B.SSM_ak = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
  A380PrimComputer_B.Data_pi = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
  A380PrimComputer_B.SSM_cbj = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
  A380PrimComputer_B.Data_dm = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
  A380PrimComputer_B.SSM_cu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
  A380PrimComputer_B.Data_f5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
  A380PrimComputer_B.SSM_nn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
  A380PrimComputer_B.Data_js = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
  A380PrimComputer_B.SSM_b = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
  A380PrimComputer_B.Data_ee = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
  A380PrimComputer_B.SSM_m = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputer_B.Data_ig = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputer_B.SSM_f = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputer_B.Data_mk = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
  A380PrimComputer_B.SSM_bp = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputer_B.Data_pu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputer_B.SSM_hb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
  A380PrimComputer_B.Data_ly = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
  A380PrimComputer_B.SSM_gz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
  A380PrimComputer_B.Data_jq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
  A380PrimComputer_B.SSM_pv = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
  A380PrimComputer_B.Data_o5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
  A380PrimComputer_B.SSM_mf = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputer_B.Data_lyw = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
  A380PrimComputer_B.SSM_m0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputer_B.Data_gq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputer_B.SSM_kd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputer_B.Data_n = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
  A380PrimComputer_B.SSM_pu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
  A380PrimComputer_B.Data_bq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
  A380PrimComputer_B.SSM_nv = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputer_B.Data_dmn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
  A380PrimComputer_B.SSM_d5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputer_B.Data_jn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputer_B.SSM_eo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
  A380PrimComputer_B.Data_c = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
  A380PrimComputer_B.SSM_nd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputer_B.Data_lx = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputer_B.SSM_bq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
  A380PrimComputer_B.Data_jb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
  A380PrimComputer_B.SSM_hi = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
  A380PrimComputer_B.Data_fn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
  A380PrimComputer_B.SSM_mm = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
  A380PrimComputer_B.Data_od = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
  A380PrimComputer_B.SSM_kz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
  A380PrimComputer_B.Data_ez = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.Data;
  A380PrimComputer_B.SSM_il = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
  A380PrimComputer_B.Data_pw = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.Data;
  A380PrimComputer_B.SSM_i2 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
  A380PrimComputer_B.Data_m2 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
  A380PrimComputer_B.SSM_ah = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
  A380PrimComputer_B.Data_ek = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
  A380PrimComputer_B.SSM_en = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
  A380PrimComputer_B.Data_iy = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
  A380PrimComputer_B.SSM_dq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
  A380PrimComputer_B.Data_lk = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
  A380PrimComputer_B.SSM_px = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
  A380PrimComputer_B.Data_ca = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
  A380PrimComputer_B.SSM_lbo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
  A380PrimComputer_B.Data_pix = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
  A380PrimComputer_B.SSM_p5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
  A380PrimComputer_B.Data_di = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
  A380PrimComputer_B.SSM_mk = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
  A380PrimComputer_B.Data_lz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
  A380PrimComputer_B.SSM_mu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
  A380PrimComputer_B.Data_lu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
  A380PrimComputer_B.SSM_cbl = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
  A380PrimComputer_B.Data_dc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
  A380PrimComputer_B.SSM_gzd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
  A380PrimComputer_B.Data_gc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
  A380PrimComputer_B.SSM_mo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
  A380PrimComputer_B.Data_am = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
  A380PrimComputer_B.SSM_me = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
  A380PrimComputer_B.Data_mo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
  A380PrimComputer_B.SSM_mj = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
  A380PrimComputer_B.Data_dg = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
  A380PrimComputer_B.SSM_a5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
  A380PrimComputer_B.Data_e1 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
  A380PrimComputer_B.SSM_bt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
  A380PrimComputer_B.Data_fp = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
  A380PrimComputer_B.SSM_om = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
  A380PrimComputer_B.Data_ns = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
  A380PrimComputer_B.SSM_ar = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
  A380PrimComputer_B.Data_m3 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
  A380PrimComputer_B.SSM_ce = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
  A380PrimComputer_B.Data_oj = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
  A380PrimComputer_B.SSM_ed = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
  A380PrimComputer_B.Data_jy = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
  A380PrimComputer_B.SSM_jh = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
  A380PrimComputer_B.Data_j1 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
  A380PrimComputer_B.SSM_je = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
  A380PrimComputer_B.Data_fc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
  A380PrimComputer_B.SSM_jt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
  A380PrimComputer_B.Data_of = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
  A380PrimComputer_B.SSM_cui = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
  A380PrimComputer_B.Data_lg = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
  A380PrimComputer_B.SSM_mq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
  A380PrimComputer_B.Data_n4 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
  A380PrimComputer_B.SSM_ni = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
  A380PrimComputer_B.Data_ot = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
  A380PrimComputer_B.SSM_df = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
  A380PrimComputer_B.Data_gv = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
  A380PrimComputer_B.SSM_oe = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
  A380PrimComputer_B.Data_ou = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
  A380PrimComputer_B.isis_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.isis_1_bus;
  A380PrimComputer_B.isis_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.isis_2_bus;
  A380PrimComputer_B.rate_gyro_pitch_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_pitch_1_bus;
  A380PrimComputer_B.rate_gyro_pitch_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_pitch_2_bus;
  A380PrimComputer_B.rate_gyro_roll_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_roll_1_bus;
  A380PrimComputer_B.rate_gyro_roll_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_roll_2_bus;
  A380PrimComputer_B.rate_gyro_yaw_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_yaw_1_bus;
  A380PrimComputer_B.rate_gyro_yaw_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_yaw_2_bus;
  A380PrimComputer_B.SSM_ha = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
  A380PrimComputer_B.Data_dh = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
  A380PrimComputer_B.SSM_op = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
  A380PrimComputer_B.Data_ph = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
  A380PrimComputer_B.SSM_a50 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
  A380PrimComputer_B.Data_gs = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
  A380PrimComputer_B.SSM_og = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
  A380PrimComputer_B.Data_fd4 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
  A380PrimComputer_B.SSM_a4 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputer_B.Data_hm = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
  A380PrimComputer_B.SSM_bv = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
  A380PrimComputer_B.Data_i2 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
  A380PrimComputer_B.SSM_bo = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
  A380PrimComputer_B.Data_og = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
  A380PrimComputer_B.SSM_d1 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
  A380PrimComputer_B.Data_fv = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
  A380PrimComputer_B.SSM_hy = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
  A380PrimComputer_B.Data_oc = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
  A380PrimComputer_B.SSM_gi = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
  A380PrimComputer_B.Data_kq = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
  A380PrimComputer_B.SSM_pp = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
  A380PrimComputer_B.Data_ne = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
  A380PrimComputer_B.SSM_iab = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
  A380PrimComputer_B.Data_it = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
  A380PrimComputer_B.irdc_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.irdc_1_bus;
  A380PrimComputer_B.irdc_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.irdc_2_bus;
  A380PrimComputer_B.irdc_3_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.irdc_3_bus;
  A380PrimComputer_B.irdc_4_a_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.irdc_4_a_bus;
  A380PrimComputer_B.irdc_4_b_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.irdc_4_b_bus;
  A380PrimComputer_B.fcu_own_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.fcu_own_bus;
  A380PrimComputer_B.fcu_opp_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.fcu_opp_bus;
  A380PrimComputer_B.SSM_jtv = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_ch =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_fy = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_bb =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_d4 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_ol =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_midboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_ars =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_hw =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_midboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_din =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_hs =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_m3 =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_fj =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_np = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.SSM;
  A380PrimComputer_B.Data_ky = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_1_command_deg.Data;
  A380PrimComputer_B.SSM_ax = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.SSM;
  A380PrimComputer_B.Data_h5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_1_command_deg.Data;
  A380PrimComputer_B.SSM_cl = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.SSM;
  A380PrimComputer_B.Data_ku = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_2_command_deg.Data;
  A380PrimComputer_B.SSM_es = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.SSM;
  A380PrimComputer_B.Data_jp = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_2_command_deg.Data;
  A380PrimComputer_B.SSM_gi1 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.SSM;
  A380PrimComputer_B.Data_nu = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_3_command_deg.Data;
  A380PrimComputer_B.SSM_jz = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.SSM;
  A380PrimComputer_B.Data_br = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_3_command_deg.Data;
  A380PrimComputer_B.SSM_kt = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.SSM;
  A380PrimComputer_B.Data_ae = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_4_command_deg.Data;
  A380PrimComputer_B.SSM_ds = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.SSM;
  A380PrimComputer_B.Data_pe = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_4_command_deg.Data;
  A380PrimComputer_B.SSM_eg = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.SSM;
  A380PrimComputer_B.Data_fy = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_5_command_deg.Data;
  A380PrimComputer_B.SSM_a0 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.SSM;
  A380PrimComputer_B.Data_na = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_5_command_deg.Data;
  A380PrimComputer_B.SSM_cv = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.SSM;
  A380PrimComputer_B.Data_my = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_6_command_deg.Data;
  A380PrimComputer_B.SSM_ea = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.SSM;
  A380PrimComputer_B.Data_i4 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_6_command_deg.Data;
  A380PrimComputer_B.SSM_p4 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.SSM;
  A380PrimComputer_B.Data_cx = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_7_command_deg.Data;
  A380PrimComputer_B.SSM_m2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.SSM;
  A380PrimComputer_B.Data_nz = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_7_command_deg.Data;
  A380PrimComputer_B.SSM_bt0 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.SSM;
  A380PrimComputer_B.Data_id = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_8_command_deg.Data;
  A380PrimComputer_B.SSM_nr = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.SSM;
  A380PrimComputer_B.Data_o2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_8_command_deg.Data;
  A380PrimComputer_B.SSM_fr = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_gqq =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_inboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_cc =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_md =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_inboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_lm =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_cz =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_outboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_mkm =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_pm =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_outboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_jhd = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.ths_command_deg.SSM;
  A380PrimComputer_B.Data_bj = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.ths_command_deg.Data;
  A380PrimComputer_B.SSM_av = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.SSM;
  A380PrimComputer_B.Data_ox = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.upper_rudder_command_deg.Data;
  A380PrimComputer_B.SSM_ira = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.SSM;
  A380PrimComputer_B.Data_pe5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.lower_rudder_command_deg.Data;
  A380PrimComputer_B.SSM_ge = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputer_B.Data_jj =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputer_B.SSM_lv = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputer_B.Data_p5 =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputer_B.SSM_cg = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputer_B.Data_ekl =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputer_B.SSM_be = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputer_B.Data_nd =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputer_B.SSM_axb = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputer_B.Data_n2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_pedal_position_deg.Data;
  A380PrimComputer_B.SSM_nz = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.aileron_status_word.SSM;
  A380PrimComputer_B.Data_dl = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.aileron_status_word.Data;
  A380PrimComputer_B.SSM_cx = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputer_B.Data_gs2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_1_position_deg.Data;
  A380PrimComputer_B.SSM_gh = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputer_B.Data_h4 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_aileron_2_position_deg.Data;
  A380PrimComputer_B.SSM_ks = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputer_B.Data_e3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_1_position_deg.Data;
  A380PrimComputer_B.SSM_pw = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputer_B.Data_f5h = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_aileron_2_position_deg.Data;
  A380PrimComputer_B.SSM_fh = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.spoiler_status_word.SSM;
  A380PrimComputer_B.Data_an = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.spoiler_status_word.Data;
  A380PrimComputer_B.SSM_gzn = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.SSM;
  A380PrimComputer_B.Data_i4o = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.left_spoiler_position_deg.Data;
  A380PrimComputer_B.SSM_oo = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.SSM;
  A380PrimComputer_B.Data_af = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.right_spoiler_position_deg.Data;
  A380PrimComputer_B.SSM_evh = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_status_word.SSM;
  A380PrimComputer_B.Data_bm = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_status_word.Data;
  A380PrimComputer_B.SSM_cn = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_1_position_deg.SSM;
  A380PrimComputer_B.Data_dk = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_1_position_deg.Data;
  A380PrimComputer_B.SSM_co = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_2_position_deg.SSM;
  A380PrimComputer_B.Data_nv = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_2_position_deg.Data;
  A380PrimComputer_B.SSM_pe = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_3_position_deg.SSM;
  A380PrimComputer_B.Data_jpf = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.elevator_3_position_deg.Data;
  A380PrimComputer_B.SSM_cgz = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.ths_position_deg.SSM;
  A380PrimComputer_B.Data_i5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.ths_position_deg.Data;
  A380PrimComputer_B.SSM_fw = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_status_word.SSM;
  A380PrimComputer_B.Data_k2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_status_word.Data;
  A380PrimComputer_B.SSM_h4 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_1_position_deg.SSM;
  A380PrimComputer_B.Data_as = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_1_position_deg.Data;
  A380PrimComputer_B.SSM_cb3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_2_position_deg.SSM;
  A380PrimComputer_B.Data_gk = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.rudder_2_position_deg.Data;
  A380PrimComputer_B.SSM_pj = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.fctl_law_status_word.SSM;
  A380PrimComputer_B.Data_jl = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.fctl_law_status_word.Data;
  A380PrimComputer_B.SSM_dv = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.misc_data_status_word.SSM;
  A380PrimComputer_B.Data_e32 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus.misc_data_status_word.Data;
  A380PrimComputer_B.SSM_i4 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_ih =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_fm = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_du =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_e5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_nx =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_midboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_bf =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_n0 =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_midboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_fd = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_eqi =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_fv =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.SSM;
  A380PrimComputer_B.Data_om =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_aileron_command_deg.Data;
  A380PrimComputer_B.SSM_dt = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.SSM;
  A380PrimComputer_B.Data_nr = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_1_command_deg.Data;
  A380PrimComputer_B.SSM_j5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.SSM;
  A380PrimComputer_B.Data_p3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_1_command_deg.Data;
  A380PrimComputer_B.SSM_ng = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.SSM;
  A380PrimComputer_B.Data_nb = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_2_command_deg.Data;
  A380PrimComputer_B.SSM_cs = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.SSM;
  A380PrimComputer_B.Data_hd = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_2_command_deg.Data;
  A380PrimComputer_B.SSM_ls = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.SSM;
  A380PrimComputer_B.Data_al = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_3_command_deg.Data;
  A380PrimComputer_B.SSM_dg = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.SSM;
  A380PrimComputer_B.Data_gu = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_3_command_deg.Data;
  A380PrimComputer_B.SSM_d3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.SSM;
  A380PrimComputer_B.Data_ix = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_4_command_deg.Data;
  A380PrimComputer_B.SSM_p2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.SSM;
  A380PrimComputer_B.Data_do = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_4_command_deg.Data;
  A380PrimComputer_B.SSM_bo0 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.SSM;
  A380PrimComputer_B.Data_hu = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_5_command_deg.Data;
  A380PrimComputer_B.SSM_bc = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.SSM;
  A380PrimComputer_B.Data_pm1 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_5_command_deg.Data;
  A380PrimComputer_B.SSM_h0 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.SSM;
  A380PrimComputer_B.Data_i2y = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_6_command_deg.Data;
  A380PrimComputer_B.SSM_giz = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.SSM;
  A380PrimComputer_B.Data_pg = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_6_command_deg.Data;
  A380PrimComputer_B.SSM_mqp = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.SSM;
  A380PrimComputer_B.Data_ni = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_7_command_deg.Data;
  A380PrimComputer_B.SSM_ba = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.SSM;
  A380PrimComputer_B.Data_fr = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_7_command_deg.Data;
  A380PrimComputer_B.SSM_in = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.SSM;
  A380PrimComputer_B.Data_cn = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_8_command_deg.Data;
  A380PrimComputer_B.SSM_ff = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.SSM;
  A380PrimComputer_B.Data_nxl = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_8_command_deg.Data;
  A380PrimComputer_B.SSM_ic = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_jh =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_inboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_fs =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_gl =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_inboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_ja =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_gn =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_outboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_js =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.SSM;
  A380PrimComputer_B.Data_myb =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_outboard_elevator_command_deg.Data;
  A380PrimComputer_B.SSM_is3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.ths_command_deg.SSM;
  A380PrimComputer_B.Data_l2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.ths_command_deg.Data;
  A380PrimComputer_B.SSM_ag = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.SSM;
  A380PrimComputer_B.Data_o5o = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.upper_rudder_command_deg.Data;
  A380PrimComputer_B.SSM_f5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.SSM;
  A380PrimComputer_B.Data_l5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.lower_rudder_command_deg.Data;
  A380PrimComputer_B.SSM_ph = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.SSM;
  A380PrimComputer_B.Data_dc2 =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_pitch_command_deg.Data;
  A380PrimComputer_B.SSM_jw = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.SSM;
  A380PrimComputer_B.Data_gr =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_pitch_command_deg.Data;
  A380PrimComputer_B.SSM_jy = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.SSM;
  A380PrimComputer_B.Data_gp = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_sidestick_roll_command_deg.Data;
  A380PrimComputer_B.SSM_j1 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.SSM;
  A380PrimComputer_B.Data_i3 =
    A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_sidestick_roll_command_deg.Data;
  A380PrimComputer_B.SSM_ov = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.SSM;
  A380PrimComputer_B.Data_et = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_pedal_position_deg.Data;
  A380PrimComputer_B.SSM_mx = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.aileron_status_word.SSM;
  A380PrimComputer_B.Data_mc = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.aileron_status_word.Data;
  A380PrimComputer_B.SSM_b4 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.SSM;
  A380PrimComputer_B.Data_k3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_1_position_deg.Data;
  A380PrimComputer_B.SSM_gb = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.SSM;
  A380PrimComputer_B.Data_f2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_aileron_2_position_deg.Data;
  A380PrimComputer_B.SSM_oh = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.SSM;
  A380PrimComputer_B.Data_gh = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_1_position_deg.Data;
  A380PrimComputer_B.SSM_mm5 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.SSM;
  A380PrimComputer_B.Data_ed = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_aileron_2_position_deg.Data;
  A380PrimComputer_B.SSM_br = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.spoiler_status_word.SSM;
  A380PrimComputer_B.Data_o2j = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.spoiler_status_word.Data;
  A380PrimComputer_B.SSM_c2 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.SSM;
  A380PrimComputer_B.Data_i43 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.left_spoiler_position_deg.Data;
  A380PrimComputer_B.SSM_hc = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.SSM;
  A380PrimComputer_B.Data_ic = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.right_spoiler_position_deg.Data;
  A380PrimComputer_B.SSM_ktr = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_status_word.SSM;
  A380PrimComputer_B.Data_ak = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_status_word.Data;
  A380PrimComputer_B.SSM_gl = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_1_position_deg.SSM;
  A380PrimComputer_B.Data_jg = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_1_position_deg.Data;
  A380PrimComputer_B.SSM_my = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_2_position_deg.SSM;
  A380PrimComputer_B.Data_cu = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_2_position_deg.Data;
  A380PrimComputer_B.SSM_j3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_3_position_deg.SSM;
  A380PrimComputer_B.Data_ep = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.elevator_3_position_deg.Data;
  A380PrimComputer_B.SSM_go = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.ths_position_deg.SSM;
  A380PrimComputer_B.Data_d3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.ths_position_deg.Data;
  A380PrimComputer_B.SSM_e5c = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_status_word.SSM;
  A380PrimComputer_B.Data_bt = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_status_word.Data;
  A380PrimComputer_B.SSM_dk = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_1_position_deg.SSM;
  A380PrimComputer_B.Data_e0 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_1_position_deg.Data;
  A380PrimComputer_B.SSM_evc = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_2_position_deg.SSM;
  A380PrimComputer_B.Data_jl3 = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.rudder_2_position_deg.Data;
  A380PrimComputer_B.SSM_kk = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.fctl_law_status_word.SSM;
  A380PrimComputer_B.Data_nm = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.fctl_law_status_word.Data;
  A380PrimComputer_B.SSM_af = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.misc_data_status_word.SSM;
  A380PrimComputer_B.Data_ia = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus.misc_data_status_word.Data;
  A380PrimComputer_B.sec_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.sec_1_bus;
  A380PrimComputer_B.sec_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.sec_2_bus;
  A380PrimComputer_B.sec_3_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.sec_3_bus;
  A380PrimComputer_B.laws = A380PrimComputer_P.out_Y0.laws;
  A380PrimComputer_B.logic = A380PrimComputer_P.out_Y0.logic;
  A380PrimComputer_Y.out.discrete_outputs = A380PrimComputer_P.out_Y0.discrete_outputs;
  A380PrimComputer_Y.out.analog_outputs = A380PrimComputer_P.out_Y0.analog_outputs;
  A380PrimComputer_Y.out.bus_outputs = A380PrimComputer_P.out_Y0.bus_outputs;
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

A380PrimComputer::~A380PrimComputer()
{
}
