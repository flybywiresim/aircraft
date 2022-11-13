#include "A380LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include <cstring>
#include "look1_binlxpw.h"

A380LateralNormalLaw::Parameters_A380LateralNormalLaw_T A380LateralNormalLaw::A380LateralNormalLaw_rtP{

  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 120.0, 150.0, 380.0 },


  { 0.0, 140.0, 180.0, 220.0, 250.0, 270.0, 300.0, 320.0, 400.0 },


  { 0.0, 130.0, 200.0, 250.0, 300.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  2.0,

  1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -67.0,


  { 4.5, 4.5, 4.5, 3.5, 2.0, 1.5, 1.5 },


  { 1.4, 1.4, 1.4, 1.2, 1.0, 0.8, 0.8 },


  { -15.0, -15.0, -15.0, -2.0 },


  { 1.1, 1.3, 1.8, 2.0, 2.2, 2.5, 2.7, 3.2, 3.8 },


  { 3.0, 3.0, 2.5, 1.0, 1.0 },


  { 1.1, 1.0, 0.6, 0.3, 0.1 },

  67.0,

  -0.2,

  -15.0,

  -2.0,

  -1000.0,

  -50.0,

  -50.0,

  -50.0,

  -50.0,

  -5.0,

  0.2,

  15.0,

  2.0,

  0.33333333333333331,

  50.0,

  50.0,

  50.0,

  50.0,

  5.0,


  { 20.0, 15.0, 0.0, -15.0, -20.0 },


  { -50.0, -40.0, 0.0, 40.0, 50.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -66.0, -45.0, -33.0, 0.0, 33.0, 45.0, 66.0, 90.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -71.0, -66.0, -33.0, 0.0, 33.0, 66.0, 71.0, 90.0 },

  0.0,

  1.0,

  0.0,

  0.0,

  15.0,

  15.0,

  -15.0,

  67.0,

  -67.0,

  0.017453292519943295,

  9.81,

  0.017453292519943295,

  1000.0,

  100.0,

  0.51444444444444448,

  57.295779513082323,

  25.0,

  -25.0,

  1.0,

  0.0,

  1.0,

  25.0,

  -25.0,

  1.0,

  0.0,

  1.0,

  25.0,

  -25.0,

  30.0,

  -30.0,

  1.0,

  0.0,

  1.0,

  0.0,

  -30.0,

  1.0,

  1.0,

  0.0,

  1.0,

  -30.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  2.5,

  30.0,

  -30.0,

  30.0,

  -30.0,

  1.0,

  0.0,

  1.0,

  30.0,

  -30.0,

  1.0,

  0.0,

  1.0,

  0.0
};

void A380LateralNormalLaw::A380LateralNormalLaw_RateLimiter_Reset(rtDW_RateLimiter_A380LateralNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380LateralNormalLaw::A380LateralNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T
  *rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380LateralNormalLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380LateralNormalLaw::init(void)
{
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Delay_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
  A380LateralNormalLaw_DWork.pointer = 1.0;
  A380LateralNormalLaw_DWork.timeSinceLastSample = 10.0;
}

void A380LateralNormalLaw::reset(void)
{
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Delay_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_n);
  A380LateralNormalLaw_DWork.pY_not_empty_a = false;
  A380LateralNormalLaw_DWork.pY_not_empty_i = false;
  A380LateralNormalLaw_DWork.pY_not_empty = false;
  A380LateralNormalLaw_DWork.pU_not_empty = false;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_ie);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_i);
  std::memset(&A380LateralNormalLaw_DWork.stack[0], 0, 35U * sizeof(real_T));
  A380LateralNormalLaw_DWork.pointer = 1.0;
  A380LateralNormalLaw_DWork.timeSinceLastSample = 10.0;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_f);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_h);
  A380LateralNormalLaw_DWork.pY_not_empty_n = false;
}

void A380LateralNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T
  *rtu_In_Phi_deg, const real_T *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_V_ias_kn, const
  real_T *rtu_In_V_tas_kn, const real_T *rtu_In_delta_xi_pos, const real_T *rtu_In_delta_zeta_pos, const boolean_T
  *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T *rtu_In_high_aoa_prot_active, const
  boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_ap_phi_c_deg, const real_T *rtu_In_ap_beta_c_deg, const
  boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_xi_inboard_deg, real_T *rty_Out_xi_midboard_deg, real_T
  *rty_Out_xi_outboard_deg, real_T *rty_Out_zeta_upper_deg, real_T *rty_Out_zeta_lower_deg)
{
  static const int16_T b[4]{ 0, 120, 320, 400 };

  static const int8_T c[4]{ 1, 2, 3, 3 };

  real_T rtb_Gain1;
  real_T rtb_Gain1_l;
  real_T rtb_Gain_b;
  real_T rtb_Gain_ld;
  real_T rtb_Product_ai;
  real_T rtb_Product_l;
  real_T rtb_Product_l1;
  real_T rtb_Saturation2;
  real_T rtb_Saturation_b;
  real_T rtb_Sum1;
  real_T rtb_Sum1_j;
  real_T rtb_Y_i;
  boolean_T rtb_NOT_h_tmp;
  boolean_T rtb_OR;
  rtb_NOT_h_tmp = !*rtu_In_on_ground;
  if (static_cast<real_T>(rtb_NOT_h_tmp) > A380LateralNormalLaw_rtP.Saturation_UpperSat) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation_UpperSat;
  } else if (static_cast<real_T>(rtb_NOT_h_tmp) < A380LateralNormalLaw_rtP.Saturation_LowerSat) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Saturation_b = rtb_NOT_h_tmp;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Saturation_b, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i,
    &A380LateralNormalLaw_DWork.sf_RateLimiter);
  rtb_OR = ((rtb_Y_i == 0.0) || (*rtu_In_tracking_mode_on) || (*rtu_In_any_ap_engaged));
  rtb_Gain1 = A380LateralNormalLaw_rtP.Gain1_Gain * *rtu_In_delta_xi_pos;
  if (*rtu_In_high_speed_prot_active) {
    rtb_Saturation_b = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection2_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection2_tableData, 4U);
  } else if (*rtu_In_high_aoa_prot_active) {
    rtb_Saturation_b = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    rtb_Saturation_b = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection1_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection1_tableData, 8U);
  }

  rtb_Product_l1 = rtb_Gain1 + rtb_Saturation_b;
  rtb_Saturation_b = 15.0;
  rtb_Gain1 = -15.0;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE >= 25.0) {
    rtb_Gain1 = *rtu_In_pk_deg_s;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE <= -25.0) {
    rtb_Saturation_b = *rtu_In_pk_deg_s;
  }

  if (rtb_Product_l1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_a) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Product_l1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_o) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Saturation_b = std::fmin(rtb_Saturation_b, std::fmax(rtb_Gain1, rtb_Product_l1 * rtb_Y_i)) *
    A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  rtb_Gain1 = *rtu_In_Phi_deg - rtb_Saturation_b;
  A380LateralNormalLaw_DWork.icLoad = (rtb_OR || A380LateralNormalLaw_DWork.icLoad);
  if (A380LateralNormalLaw_DWork.icLoad) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = rtb_Gain1;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE_d += rtb_Saturation_b;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE_d > A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit)
  {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE_d <
             A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (A380LateralNormalLaw_DWork.Delay_DSTATE_d > A380LateralNormalLaw_rtP.Saturation_UpperSat_g) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation_UpperSat_g;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE_d < A380LateralNormalLaw_rtP.Saturation_LowerSat_e) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation_LowerSat_e;
  } else {
    rtb_Saturation_b = A380LateralNormalLaw_DWork.Delay_DSTATE_d;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Saturation_b, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up_m,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo_k, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Saturation2,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_n);
  if (*rtu_In_any_ap_engaged) {
    if (*rtu_In_tracking_mode_on) {
      rtb_Saturation_b = *rtu_In_Phi_deg;
    } else {
      rtb_Saturation_b = *rtu_In_ap_phi_c_deg;
    }
  } else {
    rtb_Saturation_b = rtb_Saturation2;
  }

  rtb_Gain1 = A380LateralNormalLaw_rtP.Gain1_Gain_l * *rtu_In_Theta_deg;
  rtb_Product_l1 = *rtu_In_V_tas_kn;
  if (rtb_Product_l1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_e) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (rtb_Product_l1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_j) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation_LowerSat_j;
  }

  rtb_Saturation2 = *rtu_In_r_deg_s - std::sin(A380LateralNormalLaw_rtP.Gain1_Gain_f * rtb_Saturation_b) *
    A380LateralNormalLaw_rtP.Constant2_Value * std::cos(rtb_Gain1) / (A380LateralNormalLaw_rtP.Gain6_Gain *
    rtb_Product_l1) * A380LateralNormalLaw_rtP.Gain_Gain;
  rtb_Gain1 = look1_binlxpw(*rtu_In_V_tas_kn, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain_Table, 6U);
  if (!A380LateralNormalLaw_DWork.pY_not_empty_a) {
    A380LateralNormalLaw_DWork.pY_b = A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition;
    A380LateralNormalLaw_DWork.pY_not_empty_a = true;
  }

  A380LateralNormalLaw_DWork.pY_b += std::fmax(std::fmin(static_cast<real_T>(rtb_NOT_h_tmp) -
    A380LateralNormalLaw_DWork.pY_b, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo) * *rtu_In_time_dt);
  if (A380LateralNormalLaw_DWork.pY_b > A380LateralNormalLaw_rtP.Saturation_UpperSat_n) {
    rtb_Gain_b = A380LateralNormalLaw_rtP.Saturation_UpperSat_n;
  } else if (A380LateralNormalLaw_DWork.pY_b < A380LateralNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Gain_b = A380LateralNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Gain_b = A380LateralNormalLaw_DWork.pY_b;
  }

  rtb_Product_l1 = rtb_Saturation2 * rtb_Gain1;
  if (rtb_Product_l1 > A380LateralNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Product_l1 < A380LateralNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  rtb_Product_l = rtb_Product_l1 * rtb_Gain_b;
  rtb_Sum1 = A380LateralNormalLaw_rtP.Constant_Value_k - rtb_Gain_b;
  rtb_Gain_b = look1_binlxpw(*rtu_In_V_tas_kn, A380LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain1_Table, 6U);
  rtb_Gain_ld = *rtu_In_r_deg_s * rtb_Gain_b;
  if (!A380LateralNormalLaw_DWork.pY_not_empty_i) {
    A380LateralNormalLaw_DWork.pY_p = A380LateralNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition;
    A380LateralNormalLaw_DWork.pY_not_empty_i = true;
  }

  A380LateralNormalLaw_DWork.pY_p += std::fmax(std::fmin(static_cast<real_T>(*rtu_In_on_ground) -
    A380LateralNormalLaw_DWork.pY_p, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_up) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_lo) * *rtu_In_time_dt);
  if (A380LateralNormalLaw_DWork.pY_p > A380LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Gain_b = A380LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (A380LateralNormalLaw_DWork.pY_p < A380LateralNormalLaw_rtP.Saturation_LowerSat_jw) {
    rtb_Gain_b = A380LateralNormalLaw_rtP.Saturation_LowerSat_jw;
  } else {
    rtb_Gain_b = A380LateralNormalLaw_DWork.pY_p;
  }

  rtb_Product_ai = *rtu_In_ap_beta_c_deg * rtb_Gain_b;
  rtb_Sum1_j = A380LateralNormalLaw_rtP.Constant_Value_o - rtb_Gain_b;
  rtb_Gain1 = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain3_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain3_Table, 3U);
  if (*rtu_In_any_ap_engaged) {
    rtb_Gain_b = *rtu_In_ap_beta_c_deg + A380LateralNormalLaw_rtP.Constant_Value;
  } else {
    rtb_Gain_b = *rtu_In_delta_zeta_pos * rtb_Gain1;
  }

  rtb_Gain1 = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_h,
    A380LateralNormalLaw_rtP.ScheduledGain_Table_l, 8U);
  rtb_Product_l1 = rtb_Gain_b * rtb_Gain1;
  rtb_Gain1 = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1_n,
    A380LateralNormalLaw_rtP.ScheduledGain1_Table_k, 4U);
  rtb_Gain1 *= rtb_Gain_b;
  if ((!A380LateralNormalLaw_DWork.pY_not_empty) || (!A380LateralNormalLaw_DWork.pU_not_empty)) {
    A380LateralNormalLaw_DWork.pU = rtb_Gain1;
    A380LateralNormalLaw_DWork.pU_not_empty = true;
    A380LateralNormalLaw_DWork.pY = rtb_Gain1;
    A380LateralNormalLaw_DWork.pY_not_empty = true;
  }

  rtb_Gain_b = *rtu_In_time_dt * A380LateralNormalLaw_rtP.LagFilter_C1;
  rtb_Saturation2 = rtb_Gain_b / (rtb_Gain_b + 2.0);
  A380LateralNormalLaw_DWork.pY = (2.0 - rtb_Gain_b) / (rtb_Gain_b + 2.0) * A380LateralNormalLaw_DWork.pY + (rtb_Gain1 *
    rtb_Saturation2 + A380LateralNormalLaw_DWork.pU * rtb_Saturation2);
  A380LateralNormalLaw_DWork.pU = rtb_Gain1;
  rtb_Gain1 = rtb_Y_i + static_cast<real_T>(*rtu_In_any_ap_engaged);
  if (rtb_Gain1 > A380LateralNormalLaw_rtP.Saturation1_UpperSat_e) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Saturation1_UpperSat_e;
  } else if (rtb_Gain1 < A380LateralNormalLaw_rtP.Saturation1_LowerSat_l) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Saturation1_LowerSat_l;
  }

  if (rtb_Gain1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_eh) {
    rtb_Saturation2 = A380LateralNormalLaw_rtP.Saturation_UpperSat_eh;
  } else if (rtb_Gain1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_i) {
    rtb_Saturation2 = A380LateralNormalLaw_rtP.Saturation_LowerSat_i;
  } else {
    rtb_Saturation2 = rtb_Gain1;
  }

  rtb_Gain_b = A380LateralNormalLaw_rtP.Gain1_Gain_i * *rtu_In_delta_zeta_pos;
  rtb_Product_l1 += A380LateralNormalLaw_DWork.pY;
  if (rtb_Product_l1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_c) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (rtb_Product_l1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_l) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation_LowerSat_l;
  }

  if (rtb_Gain_ld > A380LateralNormalLaw_rtP.Saturation2_UpperSat) {
    rtb_Gain_ld = A380LateralNormalLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Gain_ld < A380LateralNormalLaw_rtP.Saturation2_LowerSat) {
    rtb_Gain_ld = A380LateralNormalLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Product_l1 = (rtb_Sum1_j * rtb_Product_l1 + rtb_Product_ai) + (rtb_Sum1 * rtb_Gain_ld + rtb_Product_l);
  if (rtb_Product_l1 > A380LateralNormalLaw_rtP.Saturation4_UpperSat) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation4_UpperSat;
  } else if (rtb_Product_l1 < A380LateralNormalLaw_rtP.Saturation4_LowerSat) {
    rtb_Product_l1 = A380LateralNormalLaw_rtP.Saturation4_LowerSat;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Product_l1 * rtb_Saturation2 + (A380LateralNormalLaw_rtP.Constant_Value_kl -
    rtb_Saturation2) * rtb_Gain_b, A380LateralNormalLaw_rtP.RateLimiterVariableTs3_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition, rty_Out_zeta_lower_deg,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_ie);
  *rty_Out_zeta_upper_deg = *rty_Out_zeta_lower_deg;
  if (rtb_Gain1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_l1) {
    rtb_Saturation2 = A380LateralNormalLaw_rtP.Saturation_UpperSat_l1;
  } else if (rtb_Gain1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_g) {
    rtb_Saturation2 = A380LateralNormalLaw_rtP.Saturation_LowerSat_g;
  } else {
    rtb_Saturation2 = rtb_Gain1;
  }

  rtb_Gain_b = A380LateralNormalLaw_rtP.Gain_Gain_c * *rtu_In_delta_xi_pos;
  rtb_Y_i = A380LateralNormalLaw_rtP.Gain1_Gain_n * rtb_Saturation_b;
  rtb_Product_l1 = std::fmax(*rtu_In_V_ias_kn, 80.0) * 0.5144;
  rtb_Product_l = rtb_Product_l1 * rtb_Product_l1 * 0.6125;
  rtb_Sum1 = rtb_Product_l * 122.0 * 17.9 * -0.090320788790706555 / 1.0E+6;
  rtb_Gain_ld = 0.0;
  if ((*rtu_In_V_ias_kn <= 400.0) && (*rtu_In_V_ias_kn >= 0.0)) {
    int32_T high_i;
    int32_T low_i;
    int32_T low_ip1;
    high_i = 4;
    low_i = 0;
    low_ip1 = 2;
    while (high_i > low_ip1) {
      int32_T mid_i;
      mid_i = ((low_i + high_i) + 1) >> 1;
      if (*rtu_In_V_ias_kn >= b[mid_i - 1]) {
        low_i = mid_i - 1;
        low_ip1 = mid_i + 1;
      } else {
        high_i = mid_i;
      }
    }

    rtb_Saturation_b = (*rtu_In_V_ias_kn - static_cast<real_T>(b[low_i])) / static_cast<real_T>(b[low_i + 1] - b[low_i]);
    if (rtb_Saturation_b == 0.0) {
      rtb_Gain_ld = c[low_i];
    } else if (rtb_Saturation_b == 1.0) {
      rtb_Gain_ld = c[low_i + 1];
    } else if (c[low_i + 1] == c[low_i]) {
      rtb_Gain_ld = c[low_i];
    } else {
      rtb_Gain_ld = (1.0 - rtb_Saturation_b) * static_cast<real_T>(c[low_i]) + static_cast<real_T>(c[low_i + 1]) *
        rtb_Saturation_b;
    }
  }

  rtb_Product_ai = -(rtb_Gain_ld * rtb_Gain_ld) / rtb_Sum1;
  rtb_Sum1_j = A380LateralNormalLaw_rtP.Gain1_Gain_c * *rtu_In_pk_deg_s;
  rtb_Gain1_l = A380LateralNormalLaw_rtP.Gain1_Gain_b * *rtu_In_Phi_deg;
  rtb_Saturation_b = look1_binlxpw(*rtu_In_time_dt, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_j,
    A380LateralNormalLaw_rtP.ScheduledGain_Table_i, 4U);
  A380LateralNormalLaw_DWork.Delay_DSTATE = ((-(rtb_Product_l / rtb_Product_l1 * 122.0 * 320.40999999999997 * -0.487 /
    1.0E+6 + 1.414 * rtb_Gain_ld) / rtb_Sum1 * rtb_Sum1_j + rtb_Product_ai * rtb_Gain1_l) + -rtb_Product_ai * rtb_Y_i) *
    rtb_Saturation_b * A380LateralNormalLaw_rtP.Gain_Gain_p;
  rtb_Saturation_b = A380LateralNormalLaw_rtP.Gain_Gain_k * A380LateralNormalLaw_DWork.Delay_DSTATE;
  if (rtb_Saturation_b > A380LateralNormalLaw_rtP.Saturation_UpperSat_ai) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation_UpperSat_ai;
  } else if (rtb_Saturation_b < A380LateralNormalLaw_rtP.Saturation_LowerSat_m) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation_LowerSat_m;
  } else {
    rtb_Y_i = rtb_Saturation_b;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Y_i * rtb_Saturation2 + (A380LateralNormalLaw_rtP.Constant_Value_e -
    rtb_Saturation2) * rtb_Gain_b, A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_d,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_k, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_e, rty_Out_xi_inboard_deg,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_i);
  rtb_Saturation2 = A380LateralNormalLaw_DWork.stack[static_cast<int32_T>(A380LateralNormalLaw_DWork.pointer) - 1];
  A380LateralNormalLaw_DWork.timeSinceLastSample += *rtu_In_time_dt;
  if (A380LateralNormalLaw_DWork.timeSinceLastSample > 0.01) {
    A380LateralNormalLaw_DWork.stack[static_cast<int32_T>(A380LateralNormalLaw_DWork.pointer) - 1] = rtb_Saturation_b;
    A380LateralNormalLaw_DWork.pointer++;
    if (A380LateralNormalLaw_DWork.pointer > 35.0) {
      A380LateralNormalLaw_DWork.pointer = 1.0;
    }

    A380LateralNormalLaw_DWork.timeSinceLastSample = 0.0;
  }

  if (rtb_Gain1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_p) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation_UpperSat_p;
  } else if (rtb_Gain1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_p) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation_LowerSat_p;
  } else {
    rtb_Saturation_b = rtb_Gain1;
  }

  if (rtb_Saturation2 > A380LateralNormalLaw_rtP.Saturation3_UpperSat) {
    rtb_Saturation2 = A380LateralNormalLaw_rtP.Saturation3_UpperSat;
  } else if (rtb_Saturation2 < A380LateralNormalLaw_rtP.Saturation3_LowerSat) {
    rtb_Saturation2 = A380LateralNormalLaw_rtP.Saturation3_LowerSat;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Saturation2 * rtb_Saturation_b + (A380LateralNormalLaw_rtP.Constant_Value_f -
    rtb_Saturation_b) * rtb_Gain_b, A380LateralNormalLaw_rtP.RateLimiterVariableTs2_up_k,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs2_lo_a, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition_k, rty_Out_xi_midboard_deg,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_f);
  if (rtb_Gain1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_c4) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Saturation_UpperSat_c4;
  } else if (rtb_Gain1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_me) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Saturation_LowerSat_me;
  }

  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation2_UpperSat_n) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation2_UpperSat_n;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation2_LowerSat_p) {
    rtb_Saturation_b = A380LateralNormalLaw_rtP.Saturation2_LowerSat_p;
  } else {
    rtb_Saturation_b = A380LateralNormalLaw_DWork.Delay_DSTATE;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Saturation_b * rtb_Gain1 + (A380LateralNormalLaw_rtP.Constant_Value_n - rtb_Gain1)
    * rtb_Gain_b, A380LateralNormalLaw_rtP.RateLimiterVariableTs4_up, A380LateralNormalLaw_rtP.RateLimiterVariableTs4_lo,
    rtu_In_time_dt, A380LateralNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition, rty_Out_xi_outboard_deg,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_h);
  if (!A380LateralNormalLaw_DWork.pY_not_empty_n) {
    A380LateralNormalLaw_DWork.pY_k = A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_o;
    A380LateralNormalLaw_DWork.pY_not_empty_n = true;
  }

  A380LateralNormalLaw_DWork.pY_k += std::fmax(std::fmin(A380LateralNormalLaw_rtP.Constant1_Value -
    A380LateralNormalLaw_DWork.pY_k, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_p) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_c) * *rtu_In_time_dt);
  A380LateralNormalLaw_DWork.icLoad = false;
}

A380LateralNormalLaw::A380LateralNormalLaw():
  A380LateralNormalLaw_DWork()
{
}

A380LateralNormalLaw::~A380LateralNormalLaw()
{
}
