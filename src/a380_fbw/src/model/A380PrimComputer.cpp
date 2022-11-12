#include "A380PrimComputer.h"
#include "A380PrimComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"
#include "A380PitchNormalLaw.h"
#include "A380PitchAlternateLaw.h"
#include "A380PitchDirectLaw.h"
#include "A380LateralDirectLaw.h"
#include "A380LateralNormalLaw.h"

const uint8_T A380PrimComputer_IN_Flying{ 1U };

const uint8_T A380PrimComputer_IN_Landed{ 2U };

const uint8_T A380PrimComputer_IN_Landing100ft{ 3U };

const uint8_T A380PrimComputer_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PrimComputer_IN_Takeoff100ft{ 4U };

const real_T A380PrimComputer_RGND{ 0.0 };

const boolean_T A380PrimComputer_BGND{ false };

void A380PrimComputer::A380PrimComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_j(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_p_Reset(rtDW_MATLABFunction_A380PrimComputer_kz_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputer_kz_T *localDW)
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

void A380PrimComputer::A380PrimComputer_MATLABFunction_f_Reset(rtDW_MATLABFunction_A380PrimComputer_km_T *localDW)
{
  localDW->output = false;
}

void A380PrimComputer::A380PrimComputer_MATLABFunction_jg(real_T rtu_u, real_T rtu_highTrigger, real_T rtu_lowTrigger,
  boolean_T *rty_y, rtDW_MATLABFunction_A380PrimComputer_km_T *localDW)
{
  boolean_T output_tmp;
  output_tmp = !localDW->output;
  localDW->output = ((output_tmp && (rtu_u >= rtu_highTrigger)) || ((output_tmp || (rtu_u > rtu_lowTrigger)) &&
    localDW->output));
  *rty_y = localDW->output;
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

void A380PrimComputer::step()
{
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_dot_deg_s;
  real_T rtb_eta_trim_limit_lo;
  real_T rtb_eta_trim_limit_up;
  real_T rtb_eta_deg_o;
  real_T rtb_eta_trim_dot_deg_s_a;
  real_T rtb_eta_trim_limit_lo_h;
  real_T rtb_eta_trim_limit_up_d;
  real_T rtb_xi_inboard_deg;
  real_T rtb_xi_midboard_deg;
  real_T rtb_xi_outboard_deg;
  real_T rtb_zeta_upper_deg;
  real_T rtb_zeta_lower_deg;
  real_T rtb_Abs;
  real_T rtb_Sum_b;
  real_T rtb_Y;
  real_T rtb_Y_h;
  real_T rtb_handleIndex;
  real32_T rtb_V_ias;
  uint32_T rtb_y_a3;
  uint32_T rtb_y_bx;
  uint32_T rtb_y_c1;
  uint32_T rtb_y_n;
  uint32_T rtb_y_n4;
  uint32_T rtb_y_noh;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_AND2_o;
  boolean_T rtb_Compare_d;
  boolean_T rtb_NOT_ba;
  boolean_T rtb_OR3;
  boolean_T rtb_OR4;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_tripleAdrFault;
  if (A380PrimComputer_U.in.sim_data.computer_running) {
    real_T rtb_logic_total_sidestick_pitch_command;
    real32_T rtb_V_tas;
    real32_T rtb_alpha;
    real32_T rtb_mach_h;
    real32_T rtb_n_x;
    real32_T rtb_n_y;
    real32_T rtb_n_z;
    real32_T rtb_phi;
    real32_T rtb_phi_dot;
    real32_T rtb_q;
    real32_T rtb_r;
    real32_T rtb_raComputationValue;
    real32_T rtb_theta_dot;
    boolean_T elevator1Avail;
    boolean_T elevator2Avail;
    boolean_T rtb_OR;
    boolean_T rtb_OR1;
    boolean_T rtb_OR6;
    boolean_T rtb_doubleIrFault;
    boolean_T rtb_ra2Invalid;
    boolean_T rtb_tripleIrFault;
    boolean_T rudder1ElectricModeAvail;
    boolean_T rudder1ElectricModeHasPriority;
    boolean_T rudder1HydraulicModeAvail;
    boolean_T rudder1HydraulicModeHasPriority;
    boolean_T rudder2HydraulicModeAvail;
    boolean_T thsAvail;
    if (!A380PrimComputer_DWork.Runtime_MODE) {
      A380PrimComputer_DWork.Delay_DSTATE_cc = A380PrimComputer_P.Delay_InitialCondition;
      A380PrimComputer_DWork.Delay1_DSTATE = A380PrimComputer_P.Delay1_InitialCondition;
      A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.SRFlipFlop_initial_condition;
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
      A380PrimComputer_MATLABFunction_f_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jg);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_cj);
      A380PrimComputer_MATLABFunction_f_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_br);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_gfx);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_n);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_g4);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_nu);
      A380PrimComputer_DWork.pLeftStickDisabled = false;
      A380PrimComputer_DWork.pRightStickDisabled = false;
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_j2);
      A380PrimComputer_MATLABFunction_p_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_g24);
      A380PrimComputer_RateLimiter_e_Reset(&A380PrimComputer_DWork.sf_RateLimiter_n);
      A380PrimComputer_DWork.eventTime_not_empty_a = false;
      A380PrimComputer_RateLimiter_e_Reset(&A380PrimComputer_DWork.sf_RateLimiter_m);
      A380PrimComputer_DWork.resetEventTime_not_empty = false;
      A380PrimComputer_DWork.is_active_c28_A380PrimComputer = 0U;
      A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_NO_ACTIVE_CHILD;
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_jj);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ej);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_ja);
      A380PrimComputer_MATLABFunction_m_Reset(&A380PrimComputer_DWork.sf_MATLABFunction_mb);
      A380PrimComputer_LagFilter_Reset(&A380PrimComputer_DWork.sf_LagFilter);
      LawMDLOBJ5.reset();
      LawMDLOBJ3.reset();
      LawMDLOBJ4.reset();
      LawMDLOBJ1.reset();
      LawMDLOBJ2.reset();
      A380PrimComputer_RateLimiter_Reset(&A380PrimComputer_DWork.sf_RateLimiter);
      A380PrimComputer_RateLimiter_Reset(&A380PrimComputer_DWork.sf_RateLimiter_b);
      A380PrimComputer_DWork.pY_not_empty = false;
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
    rtb_Compare_d = ((A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) ||
                     (A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) ||
                     (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) ||
                     (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) ||
                     (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) ||
                     (A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) ||
                     (A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) ||
                     (A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                      (SignStatusMatrix::NormalOperation)) || A380PrimComputer_P.Constant_Value_ad);
    rtb_tripleIrFault = (rtb_OR && rtb_OR6);
    rtb_ra2Invalid = (rtb_OR && rtb_Compare_d);
    rtb_doubleIrFault = (rtb_tripleIrFault || rtb_ra2Invalid || (rtb_OR6 && rtb_Compare_d));
    rtb_tripleIrFault = (rtb_tripleIrFault && rtb_Compare_d);
    rtb_AND2_o = !rtb_OR4;
    rtb_NOT_ba = !rtb_OR3;
    if (rtb_OR1 && rtb_NOT_ba && rtb_AND2_o) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach_h = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data +
                    A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if ((!rtb_OR1) && rtb_OR3 && rtb_AND2_o) {
      rtb_V_ias = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach_h = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                    A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if (((!rtb_OR1) && rtb_NOT_ba && rtb_AND2_o) || ((!rtb_OR1) && rtb_NOT_ba && rtb_OR4)) {
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
    } else if (rtb_OR1 && rtb_NOT_ba && rtb_OR4) {
      rtb_V_ias = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      rtb_mach_h = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
      rtb_alpha = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    } else if (rtb_OR1 && rtb_OR3 && rtb_AND2_o) {
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
    rtb_AND2_o = !rtb_OR6;
    rtb_NOT_ba = !rtb_Compare_d;
    rtb_OR1 = (rtb_OR && rtb_NOT_ba);
    if (rtb_OR1 && rtb_AND2_o) {
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
      rtb_Compare_d = (rtb_OR3 && rtb_Compare_d);
      if (rtb_Compare_d && rtb_AND2_o) {
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
        rtb_NOT_ba = (rtb_OR3 && rtb_NOT_ba);
        if ((rtb_NOT_ba && rtb_AND2_o) || (rtb_NOT_ba && rtb_OR6)) {
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
        } else if (rtb_Compare_d && rtb_OR6) {
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
          rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
          rtb_q = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
          rtb_r = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
          rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
          rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
          rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
        } else if (rtb_OR1 && rtb_OR6) {
          rtb_alpha = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
          rtb_phi = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
          rtb_q = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
          rtb_r = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
          rtb_n_y = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
          rtb_n_z = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
          rtb_theta_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
        } else if (rtb_ra2Invalid && rtb_AND2_o) {
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

    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit, &rtb_y_a3);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_OR3);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit, &rtb_y_bx);
    rtb_NOT_ba = (rtb_y_bx != 0U);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_OR4);
    A380PrimComputer_MATLABFunction_c(std::abs(A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data -
      A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) > A380PrimComputer_P.CompareToConstant_const_ll,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge,
      A380PrimComputer_P.ConfirmNode_timeDelay, &rtb_Compare_d, &A380PrimComputer_DWork.sf_MATLABFunction_jz);
    rtb_OR1 = (rtb_tripleAdrFault || (rtb_doubleAdrFault && A380PrimComputer_P.Constant1_Value_b));
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR1, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode2_isRisingEdge, A380PrimComputer_P.ConfirmNode2_timeDelay, &rtb_NOT_ba,
      &A380PrimComputer_DWork.sf_MATLABFunction_lf);
    A380PrimComputer_MATLABFunction_c((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
      (A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && rtb_OR1, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode1_isRisingEdge, A380PrimComputer_P.ConfirmNode1_timeDelay, &rtb_AND2_o,
      &A380PrimComputer_DWork.sf_MATLABFunction_jl);
    A380PrimComputer_DWork.ra1CoherenceRejected = (rtb_NOT_ba || A380PrimComputer_DWork.ra1CoherenceRejected);
    A380PrimComputer_DWork.ra2CoherenceRejected = (rtb_AND2_o || A380PrimComputer_DWork.ra2CoherenceRejected);
    rtb_OR6 = ((A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || A380PrimComputer_DWork.ra1CoherenceRejected);
    rtb_ra2Invalid = ((A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>
                       (SignStatusMatrix::FailureWarning)) || A380PrimComputer_DWork.ra2CoherenceRejected);
    if (!A380PrimComputer_DWork.configFullEventTime_not_empty) {
      A380PrimComputer_DWork.configFullEventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.configFullEventTime_not_empty = true;
    }

    if (((rtb_y_a3 == 0U) || (!rtb_OR3)) && ((rtb_y_bx == 0U) || (!rtb_OR4))) {
      A380PrimComputer_DWork.configFullEventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    rtb_AND2_o = !rtb_ra2Invalid;
    rtb_NOT_ba = !rtb_OR6;
    if (rtb_NOT_ba && rtb_AND2_o) {
      if (rtb_Compare_d) {
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
    } else if ((rtb_OR6 && rtb_AND2_o) || (rtb_NOT_ba && rtb_ra2Invalid)) {
      if ((rtb_V_ias > 180.0F) && rtb_OR1) {
        rtb_raComputationValue = 250.0F;
      } else if (rtb_ra2Invalid) {
        rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
      } else {
        rtb_raComputationValue = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
      }
    } else {
      rtb_raComputationValue = 250.0F;
    }

    rtb_Compare_d = false;
    rtb_AND2_o = (A380PrimComputer_U.in.sim_data.slew_on || A380PrimComputer_U.in.sim_data.pause_on ||
                  A380PrimComputer_U.in.sim_data.tracking_mode_on_override);
    A380PrimComputer_B.logic.tracking_mode_on = rtb_AND2_o;
    A380PrimComputer_MATLABFunction_jg(A380PrimComputer_U.in.analog_inputs.yellow_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode2_highTrigger, A380PrimComputer_P.HysteresisNode2_lowTrigger, &rtb_AND2_o,
      &A380PrimComputer_DWork.sf_MATLABFunction_jg);
    A380PrimComputer_MATLABFunction_c((!A380PrimComputer_U.in.discrete_inputs.yellow_low_pressure) && rtb_AND2_o,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.ConfirmNode_isRisingEdge_k,
      A380PrimComputer_P.ConfirmNode_timeDelay_n, &rtb_Compare_d, &A380PrimComputer_DWork.sf_MATLABFunction_cj);
    rtb_NOT_ba = !A380PrimComputer_U.in.discrete_inputs.green_low_pressure;
    A380PrimComputer_MATLABFunction_jg(A380PrimComputer_U.in.analog_inputs.green_hyd_pressure_psi,
      A380PrimComputer_P.HysteresisNode3_highTrigger, A380PrimComputer_P.HysteresisNode3_lowTrigger, &rtb_AND2_o,
      &A380PrimComputer_DWork.sf_MATLABFunction_br);
    A380PrimComputer_MATLABFunction_c(rtb_NOT_ba && rtb_AND2_o, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode2_isRisingEdge_j, A380PrimComputer_P.ConfirmNode2_timeDelay_k, &rtb_NOT_ba,
      &A380PrimComputer_DWork.sf_MATLABFunction_gfx);
    A380PrimComputer_B.logic.is_green_hydraulic_power_avail = rtb_NOT_ba;
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_OR1 = rtb_NOT_ba;
      rtb_OR3 = rtb_NOT_ba;
      A380PrimComputer_B.logic.left_aileron_2_avail = rtb_NOT_ba;
      A380PrimComputer_B.logic.right_aileron_2_avail = rtb_NOT_ba;
      rtb_OR4 = rtb_NOT_ba;
      A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = true;
      rtb_OR = rtb_NOT_ba;
      A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = true;
      A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_engaged = rtb_NOT_ba;
      rtb_AND2_o = !rtb_NOT_ba;
      A380PrimComputer_B.logic.left_spoiler_electric_mode_engaged = rtb_AND2_o;
      A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_engaged = rtb_NOT_ba;
      A380PrimComputer_B.logic.right_spoiler_electric_mode_engaged = rtb_AND2_o;
      elevator1Avail = rtb_NOT_ba;
      elevator2Avail = rtb_NOT_ba;
      A380PrimComputer_B.logic.elevator_3_avail = rtb_NOT_ba;
      thsAvail = rtb_Compare_d;
      rtb_AND2_o = rtb_Compare_d;
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        rtb_OR1 = rtb_NOT_ba;
        rtb_OR3 = rtb_NOT_ba;
        A380PrimComputer_B.logic.left_aileron_2_avail = rtb_NOT_ba;
        A380PrimComputer_B.logic.right_aileron_2_avail = rtb_NOT_ba;
        rtb_OR4 = rtb_NOT_ba;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = true;
        rtb_OR = rtb_NOT_ba;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rtb_OR1 = rtb_Compare_d;
        rtb_OR3 = rtb_Compare_d;
        A380PrimComputer_B.logic.left_aileron_2_avail = rtb_Compare_d;
        A380PrimComputer_B.logic.right_aileron_2_avail = rtb_Compare_d;
        rtb_OR4 = rtb_NOT_ba;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = true;
        rtb_OR = rtb_NOT_ba;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = true;
      } else {
        rtb_OR1 = false;
        rtb_OR3 = false;
        A380PrimComputer_B.logic.left_aileron_2_avail = false;
        A380PrimComputer_B.logic.right_aileron_2_avail = false;
        rtb_OR4 = false;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_avail = false;
        rtb_OR = false;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_avail = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2 || A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rtb_AND2_o = (rtb_OR4 && rtb_OR);
        A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_engaged = rtb_AND2_o;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_engaged = false;
        A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_engaged = rtb_AND2_o;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_engaged = false;
      } else {
        A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_engaged = false;
        A380PrimComputer_B.logic.left_spoiler_electric_mode_engaged = false;
        A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_engaged = false;
        A380PrimComputer_B.logic.right_spoiler_electric_mode_engaged = false;
      }

      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        elevator1Avail = rtb_Compare_d;
        elevator2Avail = rtb_Compare_d;
      } else {
        elevator1Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_NOT_ba);
        elevator2Avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_Compare_d);
      }

      A380PrimComputer_B.logic.elevator_3_avail = (A380PrimComputer_U.in.discrete_inputs.is_unit_2 && rtb_Compare_d);
      rtb_AND2_o = !A380PrimComputer_U.in.discrete_inputs.is_unit_2;
      thsAvail = (rtb_AND2_o && (A380PrimComputer_U.in.discrete_inputs.is_unit_3 && rtb_NOT_ba));
      rtb_AND2_o = (rtb_AND2_o && A380PrimComputer_U.in.discrete_inputs.is_unit_3);
    }

    A380PrimComputer_B.logic.ths_engaged = (thsAvail && rtb_AND2_o);
    if (A380PrimComputer_U.in.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeAvail = rtb_Compare_d;
      rudder1ElectricModeAvail = true;
      rudder1HydraulicModeHasPriority = true;
      rudder1ElectricModeHasPriority = false;
      rudder2HydraulicModeAvail = rtb_NOT_ba;
      A380PrimComputer_B.logic.rudder_2_electric_mode_avail = true;
    } else {
      if (A380PrimComputer_U.in.discrete_inputs.is_unit_2) {
        rudder1HydraulicModeAvail = rtb_NOT_ba;
        rudder1ElectricModeAvail = true;
        rudder1HydraulicModeHasPriority = false;
        rudder1ElectricModeHasPriority = true;
      } else if (A380PrimComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeAvail = rtb_Compare_d;
        rudder1ElectricModeAvail = true;
        rudder1HydraulicModeHasPriority = false;
        rudder1ElectricModeHasPriority = true;
      } else {
        rudder1HydraulicModeAvail = false;
        rudder1ElectricModeAvail = false;
        rudder1HydraulicModeHasPriority = false;
        rudder1ElectricModeHasPriority = false;
      }

      rudder2HydraulicModeAvail = false;
      A380PrimComputer_B.logic.rudder_2_electric_mode_avail = false;
    }

    A380PrimComputer_MATLABFunction_c(A380PrimComputer_U.in.sim_data.slew_on, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.ConfirmNode_isRisingEdge_o, A380PrimComputer_P.ConfirmNode_timeDelay_d, &rtb_NOT_ba,
      &A380PrimComputer_DWork.sf_MATLABFunction_n);
    A380PrimComputer_B.logic.abnormal_condition_law_active = ((!rtb_NOT_ba) && (((!rtb_tripleAdrFault) && ((rtb_mach_h >
      0.91) || (rtb_Y < -10.0) || (rtb_Y > 40.0) || (rtb_V_ias > 440.0F) || (rtb_V_ias < 60.0F))) ||
      ((!rtb_tripleIrFault) && ((!rtb_doubleIrFault) || (!A380PrimComputer_P.Constant_Value_ad)) && ((std::abs(
      static_cast<real_T>(rtb_phi)) > 125.0) || ((rtb_alpha > 50.0F) || (rtb_alpha < -30.0F))))));
    A380PrimComputer_MATLABFunction_m(A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode_isRisingEdge, &rtb_AND2_o, &A380PrimComputer_DWork.sf_MATLABFunction_g4);
    A380PrimComputer_MATLABFunction_m(A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
      A380PrimComputer_P.PulseNode1_isRisingEdge, &rtb_NOT_ba, &A380PrimComputer_DWork.sf_MATLABFunction_nu);
    if (rtb_AND2_o) {
      A380PrimComputer_DWork.pRightStickDisabled = true;
      A380PrimComputer_DWork.pLeftStickDisabled = false;
    } else if (rtb_NOT_ba) {
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
      rtb_Y_h = A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_Y_h = A380PrimComputer_P.Constant_Value_p;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      rtb_handleIndex = A380PrimComputer_P.Constant_Value_p;
    } else {
      rtb_handleIndex = A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    rtb_Sum_b = rtb_Y_h + rtb_handleIndex;
    if (rtb_Sum_b > A380PrimComputer_P.Saturation_UpperSat) {
      rtb_Sum_b = A380PrimComputer_P.Saturation_UpperSat;
    } else if (rtb_Sum_b < A380PrimComputer_P.Saturation_LowerSat) {
      rtb_Sum_b = A380PrimComputer_P.Saturation_LowerSat;
    }

    if (A380PrimComputer_DWork.pLeftStickDisabled) {
      rtb_Abs = A380PrimComputer_P.Constant1_Value_p;
    } else {
      rtb_Abs = A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    if (!A380PrimComputer_DWork.pRightStickDisabled) {
      rtb_Y_h = A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_Y_h = A380PrimComputer_P.Constant1_Value_p;
    }

    rtb_handleIndex = rtb_Y_h + rtb_Abs;
    if (rtb_handleIndex > A380PrimComputer_P.Saturation1_UpperSat) {
      rtb_handleIndex = A380PrimComputer_P.Saturation1_UpperSat;
    } else if (rtb_handleIndex < A380PrimComputer_P.Saturation1_LowerSat) {
      rtb_handleIndex = A380PrimComputer_P.Saturation1_LowerSat;
    }

    rtb_logic_total_sidestick_pitch_command = rtb_Sum_b;
    A380PrimComputer_B.logic.total_sidestick_roll_command = rtb_handleIndex;
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_h, &rtb_y_a3);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_g, &rtb_y_bx);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit, &rtb_y_n4);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit, &rtb_y_n);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit, &rtb_y_noh);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit, &rtb_y_c1);
    A380PrimComputer_MATLABFunction_o(rtb_y_a3 != 0U, rtb_y_bx != 0U, rtb_y_n4 != 0U, rtb_y_n != 0U, rtb_y_noh != 0U,
      rtb_y_c1 != 0U, &rtb_handleIndex);
    A380PrimComputer_RateLimiter_n(look2_binlxpw(static_cast<real_T>(rtb_mach_h), rtb_handleIndex,
      A380PrimComputer_P.alphamax_bp01Data, A380PrimComputer_P.alphamax_bp02Data, A380PrimComputer_P.alphamax_tableData,
      A380PrimComputer_P.alphamax_maxIndex, 4U), A380PrimComputer_P.RateLimiterGenericVariableTs_up,
      A380PrimComputer_P.RateLimiterGenericVariableTs_lo, A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value,
      &rtb_Y_h, &A380PrimComputer_DWork.sf_RateLimiter_n);
    if (!A380PrimComputer_DWork.eventTime_not_empty_a) {
      A380PrimComputer_DWork.eventTime_g = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.eventTime_not_empty_a = true;
    }

    if (A380PrimComputer_DWork.eventTime_g == 0.0) {
      A380PrimComputer_DWork.eventTime_g = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_RateLimiter_n(look2_binlxpw(static_cast<real_T>(rtb_mach_h), rtb_handleIndex,
      A380PrimComputer_P.alphaprotection_bp01Data, A380PrimComputer_P.alphaprotection_bp02Data,
      A380PrimComputer_P.alphaprotection_tableData, A380PrimComputer_P.alphaprotection_maxIndex, 4U),
      A380PrimComputer_P.RateLimiterGenericVariableTs1_up, A380PrimComputer_P.RateLimiterGenericVariableTs1_lo,
      A380PrimComputer_U.in.time.dt, A380PrimComputer_P.reset_Value_j, &rtb_Sum_b,
      &A380PrimComputer_DWork.sf_RateLimiter_m);
    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach_h), A380PrimComputer_P.Constant6_Value_b,
      static_cast<real_T>(rtb_V_ias), &rtb_handleIndex);
    A380PrimComputer_GetIASforMach4(static_cast<real_T>(rtb_mach_h), A380PrimComputer_P.Constant8_Value_h,
      static_cast<real_T>(rtb_V_ias), &rtb_Abs);
    if (!A380PrimComputer_DWork.resetEventTime_not_empty) {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
      A380PrimComputer_DWork.resetEventTime_not_empty = true;
    }

    if ((rtb_logic_total_sidestick_pitch_command >= -0.03125) || (rtb_Y >= rtb_Y_h) ||
        (A380PrimComputer_DWork.resetEventTime == 0.0)) {
      A380PrimComputer_DWork.resetEventTime = A380PrimComputer_U.in.time.simulation_time;
    }

    A380PrimComputer_DWork.sProtActive = false;
    if (A380PrimComputer_DWork.is_active_c28_A380PrimComputer == 0U) {
      A380PrimComputer_DWork.is_active_c28_A380PrimComputer = 1U;
      A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landed;
    } else {
      switch (A380PrimComputer_DWork.is_c28_A380PrimComputer) {
       case A380PrimComputer_IN_Flying:
        if (rtb_raComputationValue < 100.0F) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Landing100ft;
        }
        break;

       case A380PrimComputer_IN_Landed:
        A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Takeoff100ft;
        break;

       case A380PrimComputer_IN_Landing100ft:
        if (rtb_raComputationValue > 100.0F) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Flying;
        }
        break;

       default:
        if (rtb_raComputationValue > 100.0F) {
          A380PrimComputer_DWork.is_c28_A380PrimComputer = A380PrimComputer_IN_Flying;
        }
        break;
      }
    }

    A380PrimComputer_DWork.eventTime_not_empty = true;
    A380PrimComputer_B.logic.is_yellow_hydraulic_power_avail = rtb_Compare_d;
    A380PrimComputer_MATLABFunction_m(false, A380PrimComputer_P.PulseNode3_isRisingEdge, &rtb_Compare_d,
      &A380PrimComputer_DWork.sf_MATLABFunction_jj);
    A380PrimComputer_MATLABFunction_m(false, A380PrimComputer_P.PulseNode2_isRisingEdge, &rtb_NOT_ba,
      &A380PrimComputer_DWork.sf_MATLABFunction_ej);
    A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_Compare_d ||
      ((A380PrimComputer_P.CompareToConstant11_const > 0.0) && (A380PrimComputer_P.CompareToConstant12_const > 0.0))) <<
      1) + rtb_NOT_ba) << 1) + A380PrimComputer_DWork.Memory_PreviousInput];
    rtb_AND2_o = (A380PrimComputer_P.CompareToConstant6_const <= 0.0);
    rtb_Compare_d = ((A380PrimComputer_P.CompareToConstant5_const <= 0.0) && rtb_AND2_o);
    A380PrimComputer_MATLABFunction_m(false, A380PrimComputer_P.PulseNode1_isRisingEdge_c, &rtb_AND2_o,
      &A380PrimComputer_DWork.sf_MATLABFunction_ja);
    rtb_NOT_ba = (A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos <
                  A380PrimComputer_P.CompareToConstant_const_m);
    A380PrimComputer_DWork.Delay1_DSTATE_b = (((((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos >
      A380PrimComputer_P.CompareToConstant15_const) || rtb_NOT_ba) &&
      ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <= A380PrimComputer_P.CompareToConstant1_const) ||
       (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <= A380PrimComputer_P.CompareToConstant2_const))) ||
      (((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos < A380PrimComputer_P.CompareToConstant3_const) &&
        (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <= A380PrimComputer_P.CompareToConstant4_const)) ||
       ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <= A380PrimComputer_P.CompareToConstant13_const) &&
        (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos < A380PrimComputer_P.CompareToConstant14_const)))) &&
      (rtb_AND2_o || (rtb_Compare_d && A380PrimComputer_DWork.Memory_PreviousInput) ||
       A380PrimComputer_DWork.Delay1_DSTATE_b));
    rtb_AND2_o = (A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <= A380PrimComputer_P.CompareToConstant8_const);
    rtb_Compare_d = (((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <
                       A380PrimComputer_P.CompareToConstant17_const) &&
                      (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <=
                       A380PrimComputer_P.CompareToConstant18_const)) || (rtb_AND2_o &&
      (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos < A380PrimComputer_P.CompareToConstant9_const)));
    A380PrimComputer_MATLABFunction_m(false, A380PrimComputer_P.PulseNode_isRisingEdge_n, &rtb_AND2_o,
      &A380PrimComputer_DWork.sf_MATLABFunction_mb);
    A380PrimComputer_DWork.Delay_DSTATE_f = (((((A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos >
      A380PrimComputer_P.CompareToConstant10_const) || rtb_NOT_ba) &&
      ((A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos <= A380PrimComputer_P.CompareToConstant7_const) &&
       (A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos <= A380PrimComputer_P.CompareToConstant16_const))) ||
      rtb_Compare_d) && (rtb_AND2_o || A380PrimComputer_DWork.Delay_DSTATE_f));
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_e, &rtb_y_a3);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_Compare_d);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_d, &rtb_y_bx);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_AND2_o);
    A380PrimComputer_B.logic.on_ground = false;
    A380PrimComputer_B.logic.lateral_law_capability = lateral_efcs_law::NormalLaw;
    A380PrimComputer_B.logic.active_lateral_law = lateral_efcs_law::None;
    A380PrimComputer_B.logic.pitch_law_capability = pitch_efcs_law::NormalLaw;
    A380PrimComputer_B.logic.active_pitch_law = pitch_efcs_law::None;
    A380PrimComputer_B.logic.is_master_prim = false;
    A380PrimComputer_B.logic.elevator_1_avail = elevator1Avail;
    A380PrimComputer_B.logic.elevator_1_engaged = elevator1Avail;
    A380PrimComputer_B.logic.elevator_2_avail = elevator2Avail;
    A380PrimComputer_B.logic.elevator_2_engaged = (elevator2Avail && ((!A380PrimComputer_U.in.discrete_inputs.is_unit_1)
      && ((!A380PrimComputer_U.in.discrete_inputs.is_unit_2) && A380PrimComputer_U.in.discrete_inputs.is_unit_3)));
    A380PrimComputer_B.logic.elevator_3_engaged = false;
    A380PrimComputer_B.logic.ths_avail = thsAvail;
    A380PrimComputer_B.logic.left_aileron_1_avail = rtb_OR1;
    A380PrimComputer_B.logic.left_aileron_1_engaged = rtb_OR1;
    A380PrimComputer_B.logic.left_aileron_2_engaged = false;
    A380PrimComputer_B.logic.right_aileron_1_avail = rtb_OR3;
    A380PrimComputer_B.logic.right_aileron_1_engaged = rtb_OR3;
    A380PrimComputer_B.logic.right_aileron_2_engaged = false;
    A380PrimComputer_B.logic.left_spoiler_hydraulic_mode_avail = rtb_OR4;
    A380PrimComputer_B.logic.right_spoiler_hydraulic_mode_avail = rtb_OR;
    A380PrimComputer_B.logic.rudder_1_hydraulic_mode_avail = rudder1HydraulicModeAvail;
    A380PrimComputer_B.logic.rudder_1_electric_mode_avail = rudder1ElectricModeAvail;
    A380PrimComputer_B.logic.rudder_1_hydraulic_mode_engaged = (rudder1HydraulicModeAvail &&
      rudder1HydraulicModeHasPriority);
    A380PrimComputer_B.logic.rudder_1_electric_mode_engaged = (rudder1ElectricModeAvail &&
      rudder1ElectricModeHasPriority);
    A380PrimComputer_B.logic.rudder_2_hydraulic_mode_avail = rudder2HydraulicModeAvail;
    A380PrimComputer_B.logic.rudder_2_hydraulic_mode_engaged = (rudder2HydraulicModeAvail &&
      A380PrimComputer_U.in.discrete_inputs.is_unit_1);
    A380PrimComputer_B.logic.rudder_2_electric_mode_engaged = false;
    A380PrimComputer_B.logic.aileron_droop_active = (((rtb_y_a3 == 0U) && rtb_Compare_d) || ((rtb_y_bx == 0U) &&
      rtb_AND2_o));
    A380PrimComputer_B.logic.aileron_antidroop_active = A380PrimComputer_DWork.Delay1_DSTATE_b;
    A380PrimComputer_B.logic.left_sidestick_disabled = A380PrimComputer_DWork.pLeftStickDisabled;
    A380PrimComputer_B.logic.right_sidestick_disabled = A380PrimComputer_DWork.pRightStickDisabled;
    A380PrimComputer_B.logic.left_sidestick_priority_locked = A380PrimComputer_DWork.Delay_DSTATE_cc;
    A380PrimComputer_B.logic.right_sidestick_priority_locked = A380PrimComputer_DWork.Delay1_DSTATE;
    A380PrimComputer_B.logic.total_sidestick_pitch_command = rtb_logic_total_sidestick_pitch_command;
    A380PrimComputer_B.logic.ground_spoilers_armed = rtb_NOT_ba;
    A380PrimComputer_B.logic.ground_spoilers_out = A380PrimComputer_DWork.Delay1_DSTATE_b;
    A380PrimComputer_B.logic.phased_lift_dumping_active = ((!A380PrimComputer_DWork.Delay1_DSTATE_b) &&
      A380PrimComputer_DWork.Delay_DSTATE_f);
    A380PrimComputer_B.logic.ap_authorised = false;
    A380PrimComputer_B.logic.protection_ap_disconnect = false;
    A380PrimComputer_B.logic.high_alpha_prot_active = false;
    if (A380PrimComputer_U.in.time.simulation_time - A380PrimComputer_DWork.eventTime_g <=
        A380PrimComputer_P.CompareToConstant_const_l) {
      A380PrimComputer_B.logic.alpha_prot_deg = rtb_Y_h;
    } else {
      A380PrimComputer_B.logic.alpha_prot_deg = rtb_Sum_b;
    }

    A380PrimComputer_B.logic.alpha_max_deg = rtb_Y_h;
    A380PrimComputer_B.logic.high_speed_prot_active = false;
    A380PrimComputer_B.logic.high_speed_prot_lo_thresh_kn = std::fmin(A380PrimComputer_P.Constant5_Value_k,
      rtb_handleIndex);
    A380PrimComputer_B.logic.high_speed_prot_hi_thresh_kn = std::fmin(A380PrimComputer_P.Constant7_Value_g, rtb_Abs);
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
    A380PrimComputer_B.logic.dual_ra_failure = (rtb_OR6 && rtb_ra2Invalid);
    rtb_doubleAdrFault = (A380PrimComputer_B.logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant_const_f) &&
      (static_cast<real_T>(A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant2_const_f)));
    rtb_Y = A380PrimComputer_P.DiscreteDerivativeVariableTs_Gain *
      A380PrimComputer_B.logic.ir_computation_data.theta_dot_deg_s;
    A380PrimComputer_LagFilter((rtb_Y - A380PrimComputer_DWork.Delay_DSTATE) / A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.LagFilter_C1_e, A380PrimComputer_U.in.time.dt, &rtb_handleIndex,
      &A380PrimComputer_DWork.sf_LagFilter);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_p, &rtb_y_a3);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_h, &rtb_y_bx);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_f, &rtb_y_n4);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_c, &rtb_y_n);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_n, &rtb_y_noh);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_p, &rtb_y_c1);
    A380PrimComputer_MATLABFunction_o(rtb_y_a3 != 0U, rtb_y_bx != 0U, rtb_y_n4 != 0U, rtb_y_n != 0U, rtb_y_noh != 0U,
      rtb_y_c1 != 0U, &rtb_Sum_b);
    LawMDLOBJ5.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.ir_computation_data.n_z_g,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_dot_deg_s, &rtb_handleIndex, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), &A380PrimComputer_U.in.analog_inputs.ths_pos_deg,
                    &A380PrimComputer_B.logic.adr_computation_data.alpha_deg,
                    &A380PrimComputer_B.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.logic.adr_computation_data.V_tas_kn,
                    &A380PrimComputer_B.logic.ra_computation_data_ft, &rtb_Sum_b, (const_cast<real_T*>
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
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel_bit_n, &rtb_y_a3);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel1_bit_h1, &rtb_y_bx);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel2_bit_g, &rtb_y_n4);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel3_bit_b, &rtb_y_n);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel4_bit_i, &rtb_y_noh);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      A380PrimComputer_P.BitfromLabel5_bit_l, &rtb_y_c1);
    A380PrimComputer_MATLABFunction_o(rtb_y_a3 != 0U, rtb_y_bx != 0U, rtb_y_n4 != 0U, rtb_y_n != 0U, rtb_y_noh != 0U,
      rtb_y_c1 != 0U, &rtb_handleIndex);
    rtb_doubleAdrFault = (A380PrimComputer_B.logic.tracking_mode_on || ((static_cast<real_T>
      (A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant3_const_o) &&
      (static_cast<real_T>(A380PrimComputer_B.logic.active_pitch_law) != A380PrimComputer_P.CompareToConstant4_const_o)));
    rtb_tripleAdrFault = (A380PrimComputer_B.logic.active_pitch_law != A380PrimComputer_P.EnumeratedConstant_Value_b);
    LawMDLOBJ3.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.ir_computation_data.n_z_g,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.theta_dot_deg_s, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), &A380PrimComputer_U.in.analog_inputs.ths_pos_deg,
                    &A380PrimComputer_B.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.logic.adr_computation_data.mach,
                    &A380PrimComputer_B.logic.adr_computation_data.V_tas_kn, &rtb_handleIndex, (const_cast<real_T*>
      (&A380PrimComputer_RGND)), (const_cast<real_T*>(&A380PrimComputer_RGND)),
                    &A380PrimComputer_B.logic.total_sidestick_pitch_command, &rtb_doubleAdrFault, &rtb_tripleAdrFault,
                    &rtb_eta_deg_o, &rtb_eta_trim_dot_deg_s_a, &rtb_eta_trim_limit_lo_h, &rtb_eta_trim_limit_up_d);
    LawMDLOBJ4.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.total_sidestick_pitch_command, &rtb_Sum_b,
                    &rtb_Y_h, &rtb_Abs, &rtb_handleIndex);
    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_pitch_law)) {
     case 0:
     case 1:
      A380PrimComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_eta_deg;
      break;

     case 2:
     case 3:
      A380PrimComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_eta_deg_o;
      break;

     case 4:
      A380PrimComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_Sum_b;
      break;

     default:
      A380PrimComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = A380PrimComputer_P.Constant_Value_a;
      break;
    }

    switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_pitch_law)) {
     case 0:
     case 1:
      rtb_handleIndex = rtb_eta_trim_limit_up;
      break;

     case 2:
     case 3:
      rtb_handleIndex = rtb_eta_trim_limit_up_d;
      break;

     case 4:
      break;

     default:
      rtb_handleIndex = A380PrimComputer_P.Constant2_Value_l;
      break;
    }

    if (A380PrimComputer_DWork.icLoad) {
      A380PrimComputer_DWork.Delay_DSTATE_c = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    }

    if (A380PrimComputer_DWork.Delay_DSTATE_c > rtb_handleIndex) {
      A380PrimComputer_DWork.Delay_DSTATE_c = rtb_handleIndex;
    } else {
      switch (static_cast<int32_T>(A380PrimComputer_B.logic.active_pitch_law)) {
       case 0:
       case 1:
        rtb_Abs = rtb_eta_trim_limit_lo;
        break;

       case 2:
       case 3:
        rtb_Abs = rtb_eta_trim_limit_lo_h;
        break;

       case 4:
        break;

       default:
        rtb_Abs = A380PrimComputer_P.Constant3_Value_h;
        break;
      }

      if (A380PrimComputer_DWork.Delay_DSTATE_c < rtb_Abs) {
        A380PrimComputer_DWork.Delay_DSTATE_c = rtb_Abs;
      }
    }

    rtb_handleIndex = look1_binlxpw(A380PrimComputer_B.logic.adr_computation_data.V_ias_kn,
      A380PrimComputer_P.uDLookupTable_bp01Data_h, A380PrimComputer_P.uDLookupTable_tableData_j, 6U);
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_inboard_aileron_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_inboard_aileron_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_midboard_aileron_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_midboard_aileron_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_outboard_aileron_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_outboard_aileron_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_1_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_1_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_2_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_2_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_3_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_3_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_4_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_4_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_5_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_5_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_6_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_6_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_7_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_7_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.left_spoiler_8_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.right_spoiler_8_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.upper_rudder_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.lateral_law_outputs.lower_rudder_command_deg = 0.0;
    A380PrimComputer_Y.out.laws.pitch_law_outputs.ths_command_deg = A380PrimComputer_DWork.Delay_DSTATE_c;
    A380PrimComputer_Y.out.laws.pitch_law_outputs.elevator_double_pressurization_active = false;
    LawMDLOBJ1.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.total_sidestick_roll_command,
                    (const_cast<real_T*>(&A380PrimComputer_RGND)), &rtb_xi_inboard_deg, &rtb_xi_midboard_deg,
                    &rtb_xi_outboard_deg, &rtb_zeta_upper_deg, &rtb_zeta_lower_deg);
    rtb_Sum_b = static_cast<real_T>(A380PrimComputer_B.logic.active_lateral_law);
    rtb_doubleAdrFault = (A380PrimComputer_B.logic.tracking_mode_on || (static_cast<real_T>
      (A380PrimComputer_B.logic.active_lateral_law) != A380PrimComputer_P.CompareToConstant_const_m4));
    LawMDLOBJ2.step(&A380PrimComputer_U.in.time.dt, &A380PrimComputer_B.logic.ir_computation_data.phi_deg,
                    &A380PrimComputer_B.logic.ir_computation_data.phi_dot_deg_s,
                    &A380PrimComputer_B.logic.adr_computation_data.V_ias_kn,
                    &A380PrimComputer_B.logic.total_sidestick_roll_command,
                    &A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos, &A380PrimComputer_B.logic.on_ground,
                    &rtb_doubleAdrFault, &A380PrimComputer_B.logic.high_alpha_prot_active,
                    &A380PrimComputer_B.logic.high_speed_prot_active, (const_cast<real_T*>(&A380PrimComputer_RGND)), (
      const_cast<real_T*>(&A380PrimComputer_RGND)), (const_cast<boolean_T*>(&A380PrimComputer_BGND)), &rtb_handleIndex,
                    &rtb_Sum_b, &rtb_Y_h, &rtb_Abs, &A380PrimComputer_B.zeta_lower_deg);
    if (A380PrimComputer_B.logic.aileron_droop_active) {
      rtb_Y_h = A380PrimComputer_P.Constant2_Value;
    } else {
      rtb_Y_h = A380PrimComputer_P.Constant1_Value;
    }

    A380PrimComputer_RateLimiter(rtb_Y_h, A380PrimComputer_P.RateLimiterVariableTs2_up,
      A380PrimComputer_P.RateLimiterVariableTs2_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_handleIndex,
      &A380PrimComputer_DWork.sf_RateLimiter);
    if (A380PrimComputer_B.logic.aileron_antidroop_active) {
      rtb_Y_h = A380PrimComputer_P.Constant4_Value_a;
    } else {
      rtb_Y_h = A380PrimComputer_P.Constant3_Value;
    }

    A380PrimComputer_RateLimiter(rtb_Y_h, A380PrimComputer_P.RateLimiterVariableTs3_up,
      A380PrimComputer_P.RateLimiterVariableTs3_lo, A380PrimComputer_U.in.time.dt,
      A380PrimComputer_P.RateLimiterVariableTs3_InitialCondition, &rtb_Sum_b, &A380PrimComputer_DWork.sf_RateLimiter_b);
    rtb_Sum_b += rtb_handleIndex;
    A380PrimComputer_DWork.pY_l = 0.0;
    A380PrimComputer_DWork.pY_not_empty_f = true;
    if (!A380PrimComputer_DWork.pY_not_empty) {
      A380PrimComputer_DWork.pY = 0.0;
      A380PrimComputer_DWork.pY_not_empty = true;
    }

    if (rtb_Sum_b > A380PrimComputer_P.Saturation1_UpperSat_g) {
      rtb_Sum_b = A380PrimComputer_P.Saturation1_UpperSat_g;
    } else if (rtb_Sum_b < A380PrimComputer_P.Saturation1_LowerSat_n) {
      rtb_Sum_b = A380PrimComputer_P.Saturation1_LowerSat_n;
    }

    A380PrimComputer_DWork.pY += std::fmax(std::fmin(rtb_Sum_b - A380PrimComputer_DWork.pY, std::abs
      (A380PrimComputer_P.RateLimiterGenericVariableTs1_up_g) * A380PrimComputer_U.in.time.dt), -std::abs
      (A380PrimComputer_P.RateLimiterGenericVariableTs1_lo_c) * A380PrimComputer_U.in.time.dt);
    A380PrimComputer_B.dt = A380PrimComputer_U.in.time.dt;
    A380PrimComputer_B.is_unit_1 = A380PrimComputer_U.in.discrete_inputs.is_unit_1;
    A380PrimComputer_B.SSM = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_k = A380PrimComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_f = A380PrimComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_kx = A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_fw = A380PrimComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_kxx = A380PrimComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_fwx = A380PrimComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_kxxt = A380PrimComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_fwxk = A380PrimComputer_U.in.bus_inputs.ir_1_bus.discrete_word_1.Data;
    A380PrimComputer_B.is_unit_2 = A380PrimComputer_U.in.discrete_inputs.is_unit_2;
    A380PrimComputer_B.SSM_kxxta = A380PrimComputer_U.in.bus_inputs.ir_1_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_fwxkf = A380PrimComputer_U.in.bus_inputs.ir_1_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_kxxtac = A380PrimComputer_U.in.bus_inputs.ir_1_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_fwxkft = A380PrimComputer_U.in.bus_inputs.ir_1_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_fwxkftc = A380PrimComputer_U.in.bus_inputs.ir_1_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_kxxtac0z = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0zt = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3e = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_true_deg.Data;
    A380PrimComputer_B.is_unit_3 = A380PrimComputer_U.in.discrete_inputs.is_unit_3;
    A380PrimComputer_B.SSM_kxxtac0ztg = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_fwxkftc3ep = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epg = A380PrimComputer_U.in.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgt = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2u = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtd = A380PrimComputer_U.in.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2ux = A380PrimComputer_U.in.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtdx = A380PrimComputer_U.in.bus_inputs.ir_1_bus.drift_angle_deg.Data;
    A380PrimComputer_B.capt_priority_takeover_pressed =
      A380PrimComputer_U.in.discrete_inputs.capt_priority_takeover_pressed;
    A380PrimComputer_B.SSM_kxxtac0ztgf2uxn = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtdxc = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_ky = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_h = A380PrimComputer_U.in.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_d = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_e = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_h = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_j = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_kb = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_d = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.fo_priority_takeover_pressed = A380PrimComputer_U.in.discrete_inputs.fo_priority_takeover_pressed;
    A380PrimComputer_B.SSM_p = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_p = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_di = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_i = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_j = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_g = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_i = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_a = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_g = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_eb = A380PrimComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.ap_1_puhsbutton_pressed = A380PrimComputer_U.in.discrete_inputs.ap_1_puhsbutton_pressed;
    A380PrimComputer_B.SSM_db = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_jo = A380PrimComputer_U.in.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_n = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ex = A380PrimComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_a = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_fd = A380PrimComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_ir = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_ja = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_hu = A380PrimComputer_U.in.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_k = A380PrimComputer_U.in.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.ap_2_puhsbutton_pressed = A380PrimComputer_U.in.discrete_inputs.ap_2_puhsbutton_pressed;
    A380PrimComputer_B.SSM_e = A380PrimComputer_U.in.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_joy = A380PrimComputer_U.in.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_gr = A380PrimComputer_U.in.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_h3 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_ev = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_a0 = A380PrimComputer_U.in.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_l = A380PrimComputer_U.in.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_b = A380PrimComputer_U.in.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_ei = A380PrimComputer_U.in.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_eq = A380PrimComputer_U.in.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.fcu_healthy = A380PrimComputer_U.in.discrete_inputs.fcu_healthy;
    A380PrimComputer_B.SSM_an = A380PrimComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_iz = A380PrimComputer_U.in.bus_inputs.ir_2_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_c = A380PrimComputer_U.in.bus_inputs.ir_2_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_j2 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_cb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_o = A380PrimComputer_U.in.bus_inputs.ir_2_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_lb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_m = A380PrimComputer_U.in.bus_inputs.ir_2_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_ia = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_oq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.athr_pushbutton = A380PrimComputer_U.in.discrete_inputs.athr_pushbutton;
    A380PrimComputer_B.SSM_kyz = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_fo = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_as = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_p1 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_is = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_p1y = A380PrimComputer_U.in.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_ca = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_l = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_o = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_kp = A380PrimComputer_U.in.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.ir_3_on_capt = A380PrimComputer_U.in.discrete_inputs.ir_3_on_capt;
    A380PrimComputer_B.SSM_ak = A380PrimComputer_U.in.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_k0 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_cbj = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_pi = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_cu = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_dm = A380PrimComputer_U.in.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_nn = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_f5 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_b = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_js = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
    A380PrimComputer_B.simulation_time = A380PrimComputer_U.in.time.simulation_time;
    A380PrimComputer_B.ir_3_on_fo = A380PrimComputer_U.in.discrete_inputs.ir_3_on_fo;
    A380PrimComputer_B.SSM_m = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ee = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_f = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ig = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_bp = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_mk = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_hb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_pu = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_gz = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_ly = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.adr_3_on_capt = A380PrimComputer_U.in.discrete_inputs.adr_3_on_capt;
    A380PrimComputer_B.SSM_pv = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_jq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_mf = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_o5 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_m0 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_lyw = A380PrimComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_kd = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_gq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_pu = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_n = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.adr_3_on_fo = A380PrimComputer_U.in.discrete_inputs.adr_3_on_fo;
    A380PrimComputer_B.SSM_nv = A380PrimComputer_U.in.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_bq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_d5 = A380PrimComputer_U.in.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_dmn = A380PrimComputer_U.in.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_eo = A380PrimComputer_U.in.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_jn = A380PrimComputer_U.in.bus_inputs.ir_2_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_nd = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_c = A380PrimComputer_U.in.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_bq = A380PrimComputer_U.in.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_lx = A380PrimComputer_U.in.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.pitch_trim_up_pressed = A380PrimComputer_U.in.discrete_inputs.pitch_trim_up_pressed;
    A380PrimComputer_B.SSM_hi = A380PrimComputer_U.in.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_jb = A380PrimComputer_U.in.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.SSM_mm = A380PrimComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_fn = A380PrimComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_kz = A380PrimComputer_U.in.bus_inputs.ir_3_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_od = A380PrimComputer_U.in.bus_inputs.ir_3_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_il = A380PrimComputer_U.in.bus_inputs.ir_3_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_ez = A380PrimComputer_U.in.bus_inputs.ir_3_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_i2 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_pw = A380PrimComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.Data;
    A380PrimComputer_B.pitch_trim_down_pressed = A380PrimComputer_U.in.discrete_inputs.pitch_trim_down_pressed;
    A380PrimComputer_B.SSM_ah = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_m2 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_en = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_ek = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_dq = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_iy = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_px = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_lk = A380PrimComputer_U.in.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_lbo = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_ca = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.green_low_pressure = A380PrimComputer_U.in.discrete_inputs.green_low_pressure;
    A380PrimComputer_B.SSM_p5 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_pix = A380PrimComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_mk = A380PrimComputer_U.in.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_di = A380PrimComputer_U.in.bus_inputs.ir_3_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_mu = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_lz = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_cbl = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_lu = A380PrimComputer_U.in.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_gzd = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_dc = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.yellow_low_pressure = A380PrimComputer_U.in.discrete_inputs.yellow_low_pressure;
    A380PrimComputer_B.SSM_mo = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_gc = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_me = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_am = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_mj = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_mo = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_a5 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_dg = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_bt = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_e1 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
    A380PrimComputer_B.capt_pitch_stick_pos = A380PrimComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    A380PrimComputer_B.SSM_om = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_fp = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_ar = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_ns = A380PrimComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_ce = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_m3 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_ed = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_oj = A380PrimComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_jh = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_jy = A380PrimComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.fo_pitch_stick_pos = A380PrimComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    A380PrimComputer_B.SSM_je = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_j1 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_jt = A380PrimComputer_U.in.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_fc = A380PrimComputer_U.in.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_cui = A380PrimComputer_U.in.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_of = A380PrimComputer_U.in.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_mq = A380PrimComputer_U.in.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_lg = A380PrimComputer_U.in.bus_inputs.ir_3_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_ni = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_n4 = A380PrimComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.capt_roll_stick_pos = A380PrimComputer_U.in.analog_inputs.capt_roll_stick_pos;
    A380PrimComputer_B.SSM_df = A380PrimComputer_U.in.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_ot = A380PrimComputer_U.in.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_oe = A380PrimComputer_U.in.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_gv = A380PrimComputer_U.in.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.isis_1_bus = A380PrimComputer_U.in.bus_inputs.isis_1_bus;
    A380PrimComputer_B.isis_2_bus = A380PrimComputer_U.in.bus_inputs.isis_2_bus;
    A380PrimComputer_B.rate_gyro_pitch_1_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_pitch_1_bus;
    A380PrimComputer_B.rate_gyro_pitch_2_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_pitch_2_bus;
    A380PrimComputer_B.rate_gyro_roll_1_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_roll_1_bus;
    A380PrimComputer_B.rate_gyro_roll_2_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_roll_2_bus;
    A380PrimComputer_B.monotonic_time = A380PrimComputer_U.in.time.monotonic_time;
    A380PrimComputer_B.fo_roll_stick_pos = A380PrimComputer_U.in.analog_inputs.fo_roll_stick_pos;
    A380PrimComputer_B.rate_gyro_yaw_1_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_yaw_1_bus;
    A380PrimComputer_B.rate_gyro_yaw_2_bus = A380PrimComputer_U.in.bus_inputs.rate_gyro_yaw_2_bus;
    A380PrimComputer_B.SSM_ha = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM;
    A380PrimComputer_B.Data_ou = A380PrimComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
    A380PrimComputer_B.SSM_op = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM;
    A380PrimComputer_B.Data_dh = A380PrimComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
    A380PrimComputer_B.SSM_a50 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
    A380PrimComputer_B.Data_ph = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
    A380PrimComputer_B.SSM_og = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
    A380PrimComputer_B.Data_gs = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
    A380PrimComputer_B.speed_brake_lever_pos = A380PrimComputer_U.in.analog_inputs.speed_brake_lever_pos;
    A380PrimComputer_B.SSM_a4 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputer_B.Data_fd4 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    A380PrimComputer_B.SSM_bv = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
    A380PrimComputer_B.Data_hm = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
    A380PrimComputer_B.SSM_bo = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
    A380PrimComputer_B.Data_i2 = A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
    A380PrimComputer_B.SSM_d1 = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
    A380PrimComputer_B.Data_og = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
    A380PrimComputer_B.SSM_hy = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
    A380PrimComputer_B.Data_fv = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
    A380PrimComputer_B.thr_lever_1_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_1_pos;
    A380PrimComputer_B.SSM_gi = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputer_B.Data_oc = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    A380PrimComputer_B.SSM_pp = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
    A380PrimComputer_B.Data_kq = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
    A380PrimComputer_B.SSM_iab = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
    A380PrimComputer_B.Data_ne = A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
    A380PrimComputer_B.fcu_own_bus = A380PrimComputer_U.in.bus_inputs.fcu_own_bus;
    A380PrimComputer_B.fcu_opp_bus = A380PrimComputer_U.in.bus_inputs.fcu_opp_bus;
    A380PrimComputer_B.prim_x_bus = A380PrimComputer_U.in.bus_inputs.prim_x_bus;
    A380PrimComputer_B.prim_y_bus = A380PrimComputer_U.in.bus_inputs.prim_y_bus;
    A380PrimComputer_B.thr_lever_2_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_2_pos;
    A380PrimComputer_B.sec_1_bus = A380PrimComputer_U.in.bus_inputs.sec_1_bus;
    A380PrimComputer_B.sec_2_bus = A380PrimComputer_U.in.bus_inputs.sec_2_bus;
    A380PrimComputer_B.sec_3_bus = A380PrimComputer_U.in.bus_inputs.sec_3_bus;
    A380PrimComputer_B.thr_lever_3_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_3_pos;
    A380PrimComputer_B.thr_lever_4_pos = A380PrimComputer_U.in.analog_inputs.thr_lever_4_pos;
    A380PrimComputer_B.elevator_1_pos_deg = A380PrimComputer_U.in.analog_inputs.elevator_1_pos_deg;
    A380PrimComputer_B.elevator_2_pos_deg = A380PrimComputer_U.in.analog_inputs.elevator_2_pos_deg;
    A380PrimComputer_B.ths_pos_deg = A380PrimComputer_U.in.analog_inputs.ths_pos_deg;
    A380PrimComputer_B.left_aileron_1_pos_deg = A380PrimComputer_U.in.analog_inputs.left_aileron_1_pos_deg;
    A380PrimComputer_B.slew_on = A380PrimComputer_U.in.sim_data.slew_on;
    A380PrimComputer_B.left_aileron_2_pos_deg = A380PrimComputer_U.in.analog_inputs.left_aileron_2_pos_deg;
    A380PrimComputer_B.right_aileron_1_pos_deg = A380PrimComputer_U.in.analog_inputs.right_aileron_1_pos_deg;
    A380PrimComputer_B.right_aileron_2_pos_deg = A380PrimComputer_U.in.analog_inputs.right_aileron_2_pos_deg;
    A380PrimComputer_B.left_spoiler_pos_deg = A380PrimComputer_U.in.analog_inputs.left_spoiler_pos_deg;
    A380PrimComputer_B.right_spoiler_pos_deg = A380PrimComputer_U.in.analog_inputs.right_spoiler_pos_deg;
    A380PrimComputer_B.rudder_1_pos_deg = A380PrimComputer_U.in.analog_inputs.rudder_1_pos_deg;
    A380PrimComputer_B.rudder_2_pos_deg = A380PrimComputer_U.in.analog_inputs.rudder_2_pos_deg;
    A380PrimComputer_B.rudder_pedal_pos = A380PrimComputer_U.in.analog_inputs.rudder_pedal_pos;
    A380PrimComputer_B.yellow_hyd_pressure_psi = A380PrimComputer_U.in.analog_inputs.yellow_hyd_pressure_psi;
    A380PrimComputer_B.green_hyd_pressure_psi = A380PrimComputer_U.in.analog_inputs.green_hyd_pressure_psi;
    A380PrimComputer_B.pause_on = A380PrimComputer_U.in.sim_data.pause_on;
    A380PrimComputer_B.vert_acc_1_g = A380PrimComputer_U.in.analog_inputs.vert_acc_1_g;
    A380PrimComputer_B.vert_acc_2_g = A380PrimComputer_U.in.analog_inputs.vert_acc_2_g;
    A380PrimComputer_B.vert_acc_3_g = A380PrimComputer_U.in.analog_inputs.vert_acc_3_g;
    A380PrimComputer_B.lat_acc_1_g = A380PrimComputer_U.in.analog_inputs.lat_acc_1_g;
    A380PrimComputer_B.lat_acc_2_g = A380PrimComputer_U.in.analog_inputs.lat_acc_2_g;
    A380PrimComputer_B.lat_acc_3_g = A380PrimComputer_U.in.analog_inputs.lat_acc_3_g;
    A380PrimComputer_B.left_body_wheel_speed = A380PrimComputer_U.in.analog_inputs.left_body_wheel_speed;
    A380PrimComputer_B.left_wing_wheel_speed = A380PrimComputer_U.in.analog_inputs.left_wing_wheel_speed;
    A380PrimComputer_B.right_body_wheel_speed = A380PrimComputer_U.in.analog_inputs.right_body_wheel_speed;
    A380PrimComputer_B.right_wing_wheel_speed = A380PrimComputer_U.in.analog_inputs.right_wing_wheel_speed;
    A380PrimComputer_B.tracking_mode_on_override = A380PrimComputer_U.in.sim_data.tracking_mode_on_override;
    A380PrimComputer_B.SSM_jtv = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_it = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_fy = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_ch = A380PrimComputer_U.in.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_d4 = A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.SSM;
    A380PrimComputer_B.Data_bb = A380PrimComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
    A380PrimComputer_B.SSM_ars = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_ol = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM_din = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data_hw = A380PrimComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.tailstrike_protection_on = A380PrimComputer_U.in.sim_data.tailstrike_protection_on;
    A380PrimComputer_B.SSM_m3 = A380PrimComputer_U.in.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_hs = A380PrimComputer_U.in.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_np = A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_fj = A380PrimComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_ax = A380PrimComputer_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_ky = A380PrimComputer_U.in.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_cl = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_h5 = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_es = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_ku = A380PrimComputer_U.in.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.computer_running = A380PrimComputer_U.in.sim_data.computer_running;
    A380PrimComputer_B.SSM_gi1 = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.SSM;
    A380PrimComputer_B.Data_jp = A380PrimComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
    A380PrimComputer_B.SSM_jz = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_nu = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM_kt = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data_br = A380PrimComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_ds = A380PrimComputer_U.in.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_ae = A380PrimComputer_U.in.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_eg = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_pe = A380PrimComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.prim_overhead_button_pressed = A380PrimComputer_U.in.discrete_inputs.prim_overhead_button_pressed;
    A380PrimComputer_B.SSM_a0 = A380PrimComputer_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_fy = A380PrimComputer_U.in.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_cv = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_na = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_ea = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_my = A380PrimComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_p4 = A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.SSM;
    A380PrimComputer_B.Data_i4 = A380PrimComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
    A380PrimComputer_B.SSM_m2 = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_cx = A380PrimComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_doubleAdrFault);
    A380PrimComputer_MATLABFunction(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_doubleAdrFault);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel_bit_a, &rtb_y_a3);
    A380PrimComputer_MATLABFunction_j(&A380PrimComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380PrimComputer_P.BitfromLabel1_bit_p, &rtb_y_a3);
    if (A380PrimComputer_P.Switch17_Threshold < 0.0) {
      rtb_V_ias = 0.0F;
    } else {
      rtb_V_ias = static_cast<real32_T>(A380PrimComputer_P.Constant8_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.elevator_double_pressurization_command_deg.Data = rtb_V_ias;
    rtb_VectorConcatenate[0] = false;
    rtb_VectorConcatenate[9] = false;
    rtb_VectorConcatenate[12] = false;
    rtb_VectorConcatenate[13] = false;
    rtb_VectorConcatenate[14] = false;
    rtb_VectorConcatenate[15] = false;
    rtb_VectorConcatenate[16] = false;
    rtb_VectorConcatenate[17] = false;
    rtb_VectorConcatenate[18] = false;
    rtb_VectorConcatenate[1] = false;
    rtb_VectorConcatenate[2] = false;
    rtb_VectorConcatenate[3] = false;
    rtb_VectorConcatenate[4] = false;
    rtb_VectorConcatenate[5] = false;
    rtb_VectorConcatenate[6] = false;
    rtb_VectorConcatenate[7] = false;
    rtb_VectorConcatenate[8] = false;
    rtb_VectorConcatenate[10] = true;
    rtb_VectorConcatenate[11] = true;
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate,
      &A380PrimComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
    rtb_VectorConcatenate[0] = false;
    rtb_VectorConcatenate[9] = false;
    rtb_VectorConcatenate[10] = false;
    rtb_VectorConcatenate[11] = false;
    rtb_VectorConcatenate[12] = false;
    rtb_VectorConcatenate[13] = false;
    rtb_VectorConcatenate[14] = false;
    rtb_VectorConcatenate[15] = false;
    rtb_VectorConcatenate[16] = false;
    rtb_VectorConcatenate[17] = false;
    rtb_VectorConcatenate[18] = false;
    rtb_VectorConcatenate[1] = false;
    rtb_VectorConcatenate[2] = false;
    rtb_VectorConcatenate[3] = false;
    rtb_VectorConcatenate[4] = false;
    rtb_VectorConcatenate[5] = false;
    rtb_VectorConcatenate[6] = false;
    rtb_VectorConcatenate[7] = false;
    rtb_VectorConcatenate[8] = false;
    A380PrimComputer_MATLABFunction_cw(rtb_VectorConcatenate, &rtb_V_ias);
    if (A380PrimComputer_P.Switch1_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.left_aileron_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_aileron_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    }

    if (A380PrimComputer_P.Switch_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.left_aileron_position_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant_Value_j);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_aileron_position_deg.Data = 0.0F;
    }

    if (A380PrimComputer_P.Switch3_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.right_aileron_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_aileron_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    }

    if (A380PrimComputer_P.Switch2_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.right_aileron_position_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant1_Value_d);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_aileron_position_deg.Data = 0.0F;
    }

    if (A380PrimComputer_P.Switch5_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    }

    if (A380PrimComputer_P.Switch4_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant2_Value_b);
    } else {
      A380PrimComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = 0.0F;
    }

    if (A380PrimComputer_P.Switch7_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    }

    if (A380PrimComputer_P.Switch6_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant3_Value_f);
    } else {
      A380PrimComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = 0.0F;
    }

    if (A380PrimComputer_P.Switch9_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    }

    if (A380PrimComputer_P.Switch8_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant4_Value_i);
    } else {
      A380PrimComputer_Y.out.bus_outputs.ths_position_deg.Data = 0.0F;
    }

    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = 0.0F;
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = 0.0F;
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = 0.0F;
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = 0.0F;
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = 0.0F;
    if (A380PrimComputer_P.Switch11_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    if (A380PrimComputer_P.Switch10_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.aileron_command_deg.Data = 0.0F;
    } else {
      A380PrimComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant5_Value);
    }

    if (A380PrimComputer_P.Switch13_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    if (A380PrimComputer_P.Switch12_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = 0.0F;
    } else {
      A380PrimComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant6_Value);
    }

    if (A380PrimComputer_P.Switch15_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.yaw_damper_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.yaw_damper_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    if (A380PrimComputer_P.Switch14_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.yaw_damper_command_deg.Data = 0.0F;
    } else {
      A380PrimComputer_Y.out.bus_outputs.yaw_damper_command_deg.Data = static_cast<real32_T>
        (A380PrimComputer_P.Constant7_Value);
    }

    if (A380PrimComputer_P.Switch18_Threshold < 0.0) {
      A380PrimComputer_Y.out.bus_outputs.elevator_double_pressurization_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant1_Value);
    } else {
      A380PrimComputer_Y.out.bus_outputs.elevator_double_pressurization_command_deg.SSM = static_cast<uint32_T>
        (A380PrimComputer_P.EnumeratedConstant_Value);
    }

    A380PrimComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
      (A380PrimComputer_P.EnumeratedConstant1_Value);
    A380PrimComputer_Y.out.bus_outputs.discrete_status_word_2.Data = rtb_V_ias;
    A380PrimComputer_Y.out.discrete_outputs.elevator_1_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.elevator_2_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.elevator_3_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.ths_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_1_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.left_aileron_2_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_1_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.right_aileron_2_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.left_spoiler_electronic_module_enable = false;
    A380PrimComputer_Y.out.discrete_outputs.right_spoiler_electronic_module_enable = false;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.rudder_1_electric_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.rudder_2_electric_active_mode = false;
    A380PrimComputer_Y.out.discrete_outputs.prim_healthy = A380PrimComputer_P.Constant1_Value_f;
    A380PrimComputer_Y.out.discrete_outputs.fcu_own_select = A380PrimComputer_P.Constant_Value_b;
    A380PrimComputer_Y.out.discrete_outputs.fcu_opp_select = A380PrimComputer_P.Constant_Value_b;
    A380PrimComputer_Y.out.discrete_outputs.reverser_tertiary_lock = A380PrimComputer_P.Constant_Value_b;
    A380PrimComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.ths_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.left_spoiler_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.right_spoiler_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = 0.0;
    A380PrimComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = 0.0;
    A380PrimComputer_DWork.Delay_DSTATE = rtb_Y;
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
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM = A380PrimComputer_B.SSM_jtv;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data = A380PrimComputer_B.Data_it;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM = A380PrimComputer_B.SSM_fy;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data = A380PrimComputer_B.Data_ch;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.mach.SSM = A380PrimComputer_B.SSM_d4;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.mach.Data = A380PrimComputer_B.Data_bb;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM = A380PrimComputer_B.SSM_ars;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data = A380PrimComputer_B.Data_ol;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM = A380PrimComputer_B.SSM_din;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data = A380PrimComputer_B.Data_hw;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM = A380PrimComputer_B.SSM_m3;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data = A380PrimComputer_B.Data_hs;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM = A380PrimComputer_B.SSM_np;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data = A380PrimComputer_B.Data_fj;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM = A380PrimComputer_B.SSM_ax;
  A380PrimComputer_Y.out.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data = A380PrimComputer_B.Data_ky;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM = A380PrimComputer_B.SSM_cl;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data = A380PrimComputer_B.Data_h5;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM = A380PrimComputer_B.SSM_es;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data = A380PrimComputer_B.Data_ku;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.mach.SSM = A380PrimComputer_B.SSM_gi1;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.mach.Data = A380PrimComputer_B.Data_jp;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM = A380PrimComputer_B.SSM_jz;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data = A380PrimComputer_B.Data_nu;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM = A380PrimComputer_B.SSM_kt;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data = A380PrimComputer_B.Data_br;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM = A380PrimComputer_B.SSM_ds;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data = A380PrimComputer_B.Data_ae;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM = A380PrimComputer_B.SSM_eg;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data = A380PrimComputer_B.Data_pe;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM = A380PrimComputer_B.SSM_a0;
  A380PrimComputer_Y.out.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data = A380PrimComputer_B.Data_fy;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM = A380PrimComputer_B.SSM_cv;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data = A380PrimComputer_B.Data_na;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM = A380PrimComputer_B.SSM_ea;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data = A380PrimComputer_B.Data_my;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.mach.SSM = A380PrimComputer_B.SSM_p4;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.mach.Data = A380PrimComputer_B.Data_i4;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM = A380PrimComputer_B.SSM_m2;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data = A380PrimComputer_B.Data_cx;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM = A380PrimComputer_B.SSM;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data = A380PrimComputer_B.Data;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM = A380PrimComputer_B.SSM_k;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data = A380PrimComputer_B.Data_f;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM = A380PrimComputer_B.SSM_kx;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data = A380PrimComputer_B.Data_fw;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM = A380PrimComputer_B.SSM_kxx;
  A380PrimComputer_Y.out.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data = A380PrimComputer_B.Data_fwx;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.SSM = A380PrimComputer_B.SSM_kxxt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.discrete_word_1.Data = A380PrimComputer_B.Data_fwxk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.SSM = A380PrimComputer_B.SSM_kxxta;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.latitude_deg.Data = A380PrimComputer_B.Data_fwxkf;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.SSM = A380PrimComputer_B.SSM_kxxtac;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.longitude_deg.Data = A380PrimComputer_B.Data_fwxkft;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM = A380PrimComputer_B.SSM_kxxtac0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.ground_speed_kn.Data = A380PrimComputer_B.Data_fwxkftc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM = A380PrimComputer_B.SSM_kxxtac0z;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data = A380PrimComputer_B.Data_fwxkftc3;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.SSM = A380PrimComputer_B.SSM_kxxtac0zt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_true_deg.Data = A380PrimComputer_B.Data_fwxkftc3e;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM = A380PrimComputer_B.SSM_kxxtac0ztg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_speed_kn.Data = A380PrimComputer_B.Data_fwxkftc3ep;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data = A380PrimComputer_B.Data_fwxkftc3epg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2u;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgtd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2ux;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.drift_angle_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgtdx;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM = A380PrimComputer_B.SSM_kxxtac0ztgf2uxn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data = A380PrimComputer_B.Data_fwxkftc3epgtdxc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM = A380PrimComputer_B.SSM_ky;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data = A380PrimComputer_B.Data_h;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM = A380PrimComputer_B.SSM_d;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data = A380PrimComputer_B.Data_e;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM = A380PrimComputer_B.SSM_h;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_angle_deg.Data = A380PrimComputer_B.Data_j;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM = A380PrimComputer_B.SSM_kb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data = A380PrimComputer_B.Data_d;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM = A380PrimComputer_B.SSM_p;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data = A380PrimComputer_B.Data_p;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM = A380PrimComputer_B.SSM_di;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data = A380PrimComputer_B.Data_i;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM = A380PrimComputer_B.SSM_j;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_long_accel_g.Data = A380PrimComputer_B.Data_g;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM = A380PrimComputer_B.SSM_i;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data = A380PrimComputer_B.Data_a;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM = A380PrimComputer_B.SSM_g;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data = A380PrimComputer_B.Data_eb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM = A380PrimComputer_B.SSM_db;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data = A380PrimComputer_B.Data_jo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_n;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data = A380PrimComputer_B.Data_ex;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_a;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data = A380PrimComputer_B.Data_fd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM = A380PrimComputer_B.SSM_ir;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data = A380PrimComputer_B.Data_ja;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_hu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data = A380PrimComputer_B.Data_k;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_e;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data = A380PrimComputer_B.Data_joy;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM = A380PrimComputer_B.SSM_gr;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.vertical_accel_g.Data = A380PrimComputer_B.Data_h3;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputer_B.SSM_ev;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputer_B.Data_a0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM = A380PrimComputer_B.SSM_l;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data = A380PrimComputer_B.Data_b;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM = A380PrimComputer_B.SSM_ei;
  A380PrimComputer_Y.out.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data = A380PrimComputer_B.Data_eq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.SSM = A380PrimComputer_B.SSM_an;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.discrete_word_1.Data = A380PrimComputer_B.Data_iz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.SSM = A380PrimComputer_B.SSM_c;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.latitude_deg.Data = A380PrimComputer_B.Data_j2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.SSM = A380PrimComputer_B.SSM_cb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.longitude_deg.Data = A380PrimComputer_B.Data_o;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM = A380PrimComputer_B.SSM_lb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.ground_speed_kn.Data = A380PrimComputer_B.Data_m;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM = A380PrimComputer_B.SSM_ia;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data = A380PrimComputer_B.Data_oq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.SSM = A380PrimComputer_B.SSM_kyz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_true_deg.Data = A380PrimComputer_B.Data_fo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM = A380PrimComputer_B.SSM_as;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_speed_kn.Data = A380PrimComputer_B.Data_p1;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM = A380PrimComputer_B.SSM_is;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data = A380PrimComputer_B.Data_p1y;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM = A380PrimComputer_B.SSM_ca;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data = A380PrimComputer_B.Data_l;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM = A380PrimComputer_B.SSM_o;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data = A380PrimComputer_B.Data_kp;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM = A380PrimComputer_B.SSM_ak;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.drift_angle_deg.Data = A380PrimComputer_B.Data_k0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM = A380PrimComputer_B.SSM_cbj;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data = A380PrimComputer_B.Data_pi;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM = A380PrimComputer_B.SSM_cu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data = A380PrimComputer_B.Data_dm;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM = A380PrimComputer_B.SSM_nn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data = A380PrimComputer_B.Data_f5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM = A380PrimComputer_B.SSM_b;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_angle_deg.Data = A380PrimComputer_B.Data_js;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM = A380PrimComputer_B.SSM_m;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data = A380PrimComputer_B.Data_ee;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM = A380PrimComputer_B.SSM_f;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data = A380PrimComputer_B.Data_ig;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM = A380PrimComputer_B.SSM_bp;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data = A380PrimComputer_B.Data_mk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM = A380PrimComputer_B.SSM_hb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_long_accel_g.Data = A380PrimComputer_B.Data_pu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM = A380PrimComputer_B.SSM_gz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data = A380PrimComputer_B.Data_ly;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM = A380PrimComputer_B.SSM_pv;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data = A380PrimComputer_B.Data_jq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM = A380PrimComputer_B.SSM_mf;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data = A380PrimComputer_B.Data_o5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_m0;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data = A380PrimComputer_B.Data_lyw;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_kd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data = A380PrimComputer_B.Data_gq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM = A380PrimComputer_B.SSM_pu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data = A380PrimComputer_B.Data_n;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_nv;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data = A380PrimComputer_B.Data_bq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_d5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data = A380PrimComputer_B.Data_dmn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM = A380PrimComputer_B.SSM_eo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.vertical_accel_g.Data = A380PrimComputer_B.Data_jn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputer_B.SSM_nd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputer_B.Data_c;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM = A380PrimComputer_B.SSM_bq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data = A380PrimComputer_B.Data_lx;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM = A380PrimComputer_B.SSM_hi;
  A380PrimComputer_Y.out.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data = A380PrimComputer_B.Data_jb;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.SSM = A380PrimComputer_B.SSM_mm;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.Data = A380PrimComputer_B.Data_fn;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.SSM = A380PrimComputer_B.SSM_kz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.Data = A380PrimComputer_B.Data_od;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.SSM = A380PrimComputer_B.SSM_il;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.Data = A380PrimComputer_B.Data_ez;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM = A380PrimComputer_B.SSM_i2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.Data = A380PrimComputer_B.Data_pw;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM = A380PrimComputer_B.SSM_ah;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data = A380PrimComputer_B.Data_m2;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.SSM = A380PrimComputer_B.SSM_en;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.Data = A380PrimComputer_B.Data_ek;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM = A380PrimComputer_B.SSM_dq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.Data = A380PrimComputer_B.Data_iy;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM = A380PrimComputer_B.SSM_px;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data = A380PrimComputer_B.Data_lk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM = A380PrimComputer_B.SSM_lbo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data = A380PrimComputer_B.Data_ca;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM = A380PrimComputer_B.SSM_p5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data = A380PrimComputer_B.Data_pix;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM = A380PrimComputer_B.SSM_mk;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.Data = A380PrimComputer_B.Data_di;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM = A380PrimComputer_B.SSM_mu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data = A380PrimComputer_B.Data_lz;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM = A380PrimComputer_B.SSM_cbl;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data = A380PrimComputer_B.Data_lu;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM = A380PrimComputer_B.SSM_gzd;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data = A380PrimComputer_B.Data_dc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM = A380PrimComputer_B.SSM_mo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.Data = A380PrimComputer_B.Data_gc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM = A380PrimComputer_B.SSM_me;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data = A380PrimComputer_B.Data_am;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM = A380PrimComputer_B.SSM_mj;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data = A380PrimComputer_B.Data_mo;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM = A380PrimComputer_B.SSM_a5;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data = A380PrimComputer_B.Data_dg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM = A380PrimComputer_B.SSM_bt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.Data = A380PrimComputer_B.Data_e1;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM = A380PrimComputer_B.SSM_om;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data = A380PrimComputer_B.Data_fp;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM = A380PrimComputer_B.SSM_ar;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data = A380PrimComputer_B.Data_ns;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM = A380PrimComputer_B.SSM_ce;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data = A380PrimComputer_B.Data_m3;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_ed;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data = A380PrimComputer_B.Data_oj;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM = A380PrimComputer_B.SSM_jh;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data = A380PrimComputer_B.Data_jy;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM = A380PrimComputer_B.SSM_je;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data = A380PrimComputer_B.Data_j1;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_jt;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data = A380PrimComputer_B.Data_fc;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM = A380PrimComputer_B.SSM_cui;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data = A380PrimComputer_B.Data_of;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM = A380PrimComputer_B.SSM_mq;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.Data = A380PrimComputer_B.Data_lg;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM = A380PrimComputer_B.SSM_ni;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data = A380PrimComputer_B.Data_n4;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM = A380PrimComputer_B.SSM_df;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data = A380PrimComputer_B.Data_ot;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM = A380PrimComputer_B.SSM_oe;
  A380PrimComputer_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data = A380PrimComputer_B.Data_gv;
  A380PrimComputer_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.SSM = A380PrimComputer_B.SSM_ha;
  A380PrimComputer_Y.out.data.bus_inputs.ra_1_bus.radio_height_ft.Data = A380PrimComputer_B.Data_ou;
  A380PrimComputer_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.SSM = A380PrimComputer_B.SSM_op;
  A380PrimComputer_Y.out.data.bus_inputs.ra_2_bus.radio_height_ft.Data = A380PrimComputer_B.Data_dh;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM = A380PrimComputer_B.SSM_a50;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data = A380PrimComputer_B.Data_ph;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM = A380PrimComputer_B.SSM_og;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data = A380PrimComputer_B.Data_gs;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM = A380PrimComputer_B.SSM_a4;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data = A380PrimComputer_B.Data_fd4;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM = A380PrimComputer_B.SSM_bv;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data = A380PrimComputer_B.Data_hm;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM = A380PrimComputer_B.SSM_bo;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data = A380PrimComputer_B.Data_i2;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM = A380PrimComputer_B.SSM_d1;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data = A380PrimComputer_B.Data_og;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM = A380PrimComputer_B.SSM_hy;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data = A380PrimComputer_B.Data_fv;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM = A380PrimComputer_B.SSM_gi;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data = A380PrimComputer_B.Data_oc;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM = A380PrimComputer_B.SSM_pp;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data = A380PrimComputer_B.Data_kq;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM = A380PrimComputer_B.SSM_iab;
  A380PrimComputer_Y.out.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data = A380PrimComputer_B.Data_ne;
  A380PrimComputer_Y.out.data.bus_inputs.isis_1_bus = A380PrimComputer_B.isis_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.isis_2_bus = A380PrimComputer_B.isis_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_pitch_1_bus = A380PrimComputer_B.rate_gyro_pitch_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_pitch_2_bus = A380PrimComputer_B.rate_gyro_pitch_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_roll_1_bus = A380PrimComputer_B.rate_gyro_roll_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_roll_2_bus = A380PrimComputer_B.rate_gyro_roll_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_yaw_1_bus = A380PrimComputer_B.rate_gyro_yaw_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.rate_gyro_yaw_2_bus = A380PrimComputer_B.rate_gyro_yaw_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.fcu_own_bus = A380PrimComputer_B.fcu_own_bus;
  A380PrimComputer_Y.out.data.bus_inputs.fcu_opp_bus = A380PrimComputer_B.fcu_opp_bus;
  A380PrimComputer_Y.out.data.bus_inputs.prim_x_bus = A380PrimComputer_B.prim_x_bus;
  A380PrimComputer_Y.out.data.bus_inputs.prim_y_bus = A380PrimComputer_B.prim_y_bus;
  A380PrimComputer_Y.out.data.bus_inputs.sec_1_bus = A380PrimComputer_B.sec_1_bus;
  A380PrimComputer_Y.out.data.bus_inputs.sec_2_bus = A380PrimComputer_B.sec_2_bus;
  A380PrimComputer_Y.out.data.bus_inputs.sec_3_bus = A380PrimComputer_B.sec_3_bus;
  A380PrimComputer_Y.out.logic = A380PrimComputer_B.logic;
}

void A380PrimComputer::initialize()
{
  {
    real_T rtb_xi_inboard_deg_l;
    real_T rtb_xi_midboard_deg_a;
    real_T rtb_xi_outboard_deg_f;
    real_T rtb_zeta_upper_deg_l;
    A380PrimComputer_DWork.Delay_DSTATE_cc = A380PrimComputer_P.Delay_InitialCondition;
    A380PrimComputer_DWork.Delay1_DSTATE = A380PrimComputer_P.Delay1_InitialCondition;
    A380PrimComputer_DWork.Memory_PreviousInput = A380PrimComputer_P.SRFlipFlop_initial_condition;
    A380PrimComputer_DWork.Delay1_DSTATE_b = A380PrimComputer_P.Delay1_InitialCondition_n;
    A380PrimComputer_DWork.Delay_DSTATE_f = A380PrimComputer_P.Delay_InitialCondition_d;
    A380PrimComputer_DWork.Delay_DSTATE = A380PrimComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
    A380PrimComputer_DWork.icLoad = true;
    LawMDLOBJ5.init();
    LawMDLOBJ3.init();
    LawMDLOBJ2.init(&rtb_xi_inboard_deg_l, &rtb_xi_midboard_deg_a, &rtb_xi_outboard_deg_f, &rtb_zeta_upper_deg_l,
                    &A380PrimComputer_B.zeta_lower_deg);
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
    A380PrimComputer_B.SSM_jtv = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_it = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_fy = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_ch = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_d4 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.mach.SSM;
    A380PrimComputer_B.Data_bb = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.mach.Data;
    A380PrimComputer_B.SSM_ars = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_ol = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM_din = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data_hw = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_m3 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_hs = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_np = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_fj = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_ax =
      A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_ky =
      A380PrimComputer_P.out_Y0.data.bus_inputs.adr_1_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_cl = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_h5 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_es = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_ku = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_gi1 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.mach.SSM;
    A380PrimComputer_B.Data_jp = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.mach.Data;
    A380PrimComputer_B.SSM_jz = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_nu = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM_kt = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data_br = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_ds = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_ae = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_eg = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_pe = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_a0 =
      A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_fy =
      A380PrimComputer_P.out_Y0.data.bus_inputs.adr_2_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_cv = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
    A380PrimComputer_B.Data_na = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    A380PrimComputer_B.SSM_ea = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
    A380PrimComputer_B.Data_my = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
    A380PrimComputer_B.SSM_p4 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.mach.SSM;
    A380PrimComputer_B.Data_i4 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.mach.Data;
    A380PrimComputer_B.SSM_m2 = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
    A380PrimComputer_B.Data_cx = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
    A380PrimComputer_B.SSM = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
    A380PrimComputer_B.Data = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
    A380PrimComputer_B.SSM_k = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
    A380PrimComputer_B.Data_f = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
    A380PrimComputer_B.SSM_kx = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
    A380PrimComputer_B.Data_fw = A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    A380PrimComputer_B.SSM_kxx =
      A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
    A380PrimComputer_B.Data_fwx =
      A380PrimComputer_P.out_Y0.data.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
    A380PrimComputer_B.SSM_kxxt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_fwxk = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_kxxta = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_fwxkf = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_kxxtac = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_fwxkft = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_fwxkftc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_kxxtac0z = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0zt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3e = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztg = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_fwxkftc3ep = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epg =
      A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2 =
      A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgt =
      A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2u = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2ux = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtdx = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_kxxtac0ztgf2uxn =
      A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_fwxkftc3epgtdxc =
      A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_ky = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_h = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_d = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_e = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_h = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_j = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_kb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_d = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_p = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_p = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_di = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_i = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_j = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_g = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_i = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_a = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_g = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_eb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_db = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_jo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_n = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ex = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_a = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_fd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_ir = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_ja = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_hu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_k = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_e = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_joy = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_gr = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_h3 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_ev = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_a0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_l = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_b = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_ei = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_eq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_1_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.SSM_an = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_iz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_c = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_j2 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_cb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_o = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_lb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_m = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_ia = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_oq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_kyz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_fo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_as = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_p1 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_is = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_p1y = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_ca = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_l = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_o = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_kp = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_ak = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_k0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_cbj = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_pi = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_cu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_dm = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_nn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_f5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_b = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_js = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_m = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ee = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_f = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_ig = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_bp = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_mk = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_hb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_pu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_gz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_ly = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_pv = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_jq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_mf = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_o5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_m0 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_lyw = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_kd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_gq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_pu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_n = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_nv = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_bq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_d5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_dmn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_eo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_jn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_nd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_c = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_bq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_lx = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_hi = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_jb = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_2_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.SSM_mm = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
    A380PrimComputer_B.Data_fn = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
    A380PrimComputer_B.SSM_kz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
    A380PrimComputer_B.Data_od = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.Data;
    A380PrimComputer_B.SSM_il = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
    A380PrimComputer_B.Data_ez = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.Data;
    A380PrimComputer_B.SSM_i2 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
    A380PrimComputer_B.Data_pw = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
    A380PrimComputer_B.SSM_ah = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
    A380PrimComputer_B.Data_m2 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
    A380PrimComputer_B.SSM_en = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
    A380PrimComputer_B.Data_ek = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
    A380PrimComputer_B.SSM_dq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
    A380PrimComputer_B.Data_iy = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
    A380PrimComputer_B.SSM_px = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
    A380PrimComputer_B.Data_lk = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
    A380PrimComputer_B.SSM_lbo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
    A380PrimComputer_B.Data_ca = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
    A380PrimComputer_B.SSM_p5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
    A380PrimComputer_B.Data_pix = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
    A380PrimComputer_B.SSM_mk = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
    A380PrimComputer_B.Data_di = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
    A380PrimComputer_B.SSM_mu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
    A380PrimComputer_B.Data_lz = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    A380PrimComputer_B.SSM_cbl = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
    A380PrimComputer_B.Data_lu = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
    A380PrimComputer_B.SSM_gzd = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
    A380PrimComputer_B.Data_dc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
    A380PrimComputer_B.SSM_mo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
    A380PrimComputer_B.Data_gc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
    A380PrimComputer_B.SSM_me = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
    A380PrimComputer_B.Data_am = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
    A380PrimComputer_B.SSM_mj = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
    A380PrimComputer_B.Data_mo = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
    A380PrimComputer_B.SSM_a5 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
    A380PrimComputer_B.Data_dg = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
    A380PrimComputer_B.SSM_bt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
    A380PrimComputer_B.Data_e1 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
    A380PrimComputer_B.SSM_om = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
    A380PrimComputer_B.Data_fp = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
    A380PrimComputer_B.SSM_ar = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
    A380PrimComputer_B.Data_ns = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
    A380PrimComputer_B.SSM_ce = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
    A380PrimComputer_B.Data_m3 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
    A380PrimComputer_B.SSM_ed = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_oj = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_jh = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
    A380PrimComputer_B.Data_jy = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    A380PrimComputer_B.SSM_je = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
    A380PrimComputer_B.Data_j1 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
    A380PrimComputer_B.SSM_jt = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_fc = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_cui = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
    A380PrimComputer_B.Data_of = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
    A380PrimComputer_B.SSM_mq = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
    A380PrimComputer_B.Data_lg = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
    A380PrimComputer_B.SSM_ni = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
    A380PrimComputer_B.Data_n4 = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
    A380PrimComputer_B.SSM_df = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
    A380PrimComputer_B.Data_ot = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
    A380PrimComputer_B.SSM_oe = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
    A380PrimComputer_B.Data_gv = A380PrimComputer_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
    A380PrimComputer_B.isis_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.isis_1_bus;
    A380PrimComputer_B.isis_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.isis_2_bus;
    A380PrimComputer_B.rate_gyro_pitch_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_pitch_1_bus;
    A380PrimComputer_B.rate_gyro_pitch_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_pitch_2_bus;
    A380PrimComputer_B.rate_gyro_roll_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_roll_1_bus;
    A380PrimComputer_B.rate_gyro_roll_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_roll_2_bus;
    A380PrimComputer_B.rate_gyro_yaw_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_yaw_1_bus;
    A380PrimComputer_B.rate_gyro_yaw_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.rate_gyro_yaw_2_bus;
    A380PrimComputer_B.SSM_ha = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.SSM;
    A380PrimComputer_B.Data_ou = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_1_bus.radio_height_ft.Data;
    A380PrimComputer_B.SSM_op = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.SSM;
    A380PrimComputer_B.Data_dh = A380PrimComputer_P.out_Y0.data.bus_inputs.ra_2_bus.radio_height_ft.Data;
    A380PrimComputer_B.SSM_a50 =
      A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.SSM;
    A380PrimComputer_B.Data_ph =
      A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_component_status_word.Data;
    A380PrimComputer_B.SSM_og = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.SSM;
    A380PrimComputer_B.Data_gs = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_system_status_word.Data;
    A380PrimComputer_B.SSM_a4 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputer_B.Data_fd4 =
      A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word.Data;
    A380PrimComputer_B.SSM_bv = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.SSM;
    A380PrimComputer_B.Data_hm = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.slat_actual_position_deg.Data;
    A380PrimComputer_B.SSM_bo = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.SSM;
    A380PrimComputer_B.Data_i2 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_1_bus.flap_actual_position_deg.Data;
    A380PrimComputer_B.SSM_d1 = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.SSM;
    A380PrimComputer_B.Data_og =
      A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_component_status_word.Data;
    A380PrimComputer_B.SSM_hy = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.SSM;
    A380PrimComputer_B.Data_fv = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_system_status_word.Data;
    A380PrimComputer_B.SSM_gi = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.SSM;
    A380PrimComputer_B.Data_oc =
      A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word.Data;
    A380PrimComputer_B.SSM_pp = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.SSM;
    A380PrimComputer_B.Data_kq = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.slat_actual_position_deg.Data;
    A380PrimComputer_B.SSM_iab = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.SSM;
    A380PrimComputer_B.Data_ne = A380PrimComputer_P.out_Y0.data.bus_inputs.sfcc_2_bus.flap_actual_position_deg.Data;
    A380PrimComputer_B.fcu_own_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.fcu_own_bus;
    A380PrimComputer_B.fcu_opp_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.fcu_opp_bus;
    A380PrimComputer_B.prim_x_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_x_bus;
    A380PrimComputer_B.prim_y_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.prim_y_bus;
    A380PrimComputer_B.sec_1_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.sec_1_bus;
    A380PrimComputer_B.sec_2_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.sec_2_bus;
    A380PrimComputer_B.sec_3_bus = A380PrimComputer_P.out_Y0.data.bus_inputs.sec_3_bus;
    A380PrimComputer_Y.out.laws = A380PrimComputer_P.out_Y0.laws;
    A380PrimComputer_B.logic = A380PrimComputer_P.out_Y0.logic;
    A380PrimComputer_Y.out.discrete_outputs = A380PrimComputer_P.out_Y0.discrete_outputs;
    A380PrimComputer_Y.out.analog_outputs = A380PrimComputer_P.out_Y0.analog_outputs;
    A380PrimComputer_Y.out.bus_outputs = A380PrimComputer_P.out_Y0.bus_outputs;
  }
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
