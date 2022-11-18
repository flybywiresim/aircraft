#include "A380LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include <cstring>
#include "look1_binlxpw.h"

A380LateralNormalLaw::Parameters_A380LateralNormalLaw_T A380LateralNormalLaw::A380LateralNormalLaw_rtP{

  { 0.0, 120.0, 150.0, 380.0 },


  { 0.0, 130.0, 200.0, 250.0, 300.0 },


  { 0.0, 140.0, 180.0, 220.0, 250.0, 270.0, 300.0, 320.0, 400.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },

  2.0,

  1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -67.0,


  { -15.0, -15.0, -15.0, -2.0 },


  { 3.0, 3.0, 2.5, 1.0, 1.0 },


  { 1.1, 1.3, 1.8, 2.0, 2.2, 2.5, 2.7, 3.2, 3.8 },


  { 1.1, 1.0, 0.6, 0.3, 0.1 },


  { 1.5, 1.5, 1.5, 1.0, 0.7, 0.15, 0.15 },


  { 1.4, 1.4, 1.4, 1.2, 1.0, 0.8, 0.8 },

  67.0,

  -0.2,

  -5.0,

  -15.0,

  -1000.0,

  -30.0,

  -2.0,

  0.2,

  5.0,

  15.0,

  0.33333333333333331,

  30.0,

  2.0,


  { 20.0, 15.0, 0.0, -15.0, -20.0 },


  { -50.0, -40.0, 0.0, 40.0, 50.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -66.0, -45.0, -33.0, 0.0, 33.0, 45.0, 66.0, 90.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -71.0, -66.0, -33.0, 0.0, 33.0, 66.0, 71.0, 90.0 },

  0.0,

  -5.0,

  25.0,

  0.0,

  1.2,

  1.0,

  0.0,

  -30.0,

  -30.0,

  0.0,

  0.0,

  15.0,

  15.0,

  -15.0,

  0.0,

  67.0,

  -67.0,

  30.0,

  -30.0,

  1.0,

  1.0,

  0.0,

  30.0,

  -30.0,

  1.0,

  0.0,

  1.0,

  0.0,

  1.0,

  1.0,

  0.0,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.6,

  0.017453292519943295,

  57.295779513082323,

  0.5,

  1.5,

  30.0,

  -30.0,

  1.0,

  0.0,

  1.0,

  2.5,

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

  1.0,

  0.0,

  1.0,

  9.81,

  0.017453292519943295,

  0.017453292519943295,

  1000.0,

  100.0,

  0.51444444444444448,

  57.295779513082323,

  30.0,

  -30.0,

  1.0,

  0.0,

  30.0,

  -30.0,

  1.0,

  30.0,

  -30.0,

  false
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
}

void A380LateralNormalLaw::reset(void)
{
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Delay_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_dw);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_n);
  A380LateralNormalLaw_DWork.pY_not_empty = false;
  A380LateralNormalLaw_DWork.pU_not_empty = false;
  A380LateralNormalLaw_DWork.pY_not_empty_i = false;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_i);
  std::memset(&A380LateralNormalLaw_DWork.stack[0], 0, 70U * sizeof(real_T));
  A380LateralNormalLaw_DWork.pointer = 1.0;
  A380LateralNormalLaw_DWork.timeSinceLastSample = 0.0;
  A380LateralNormalLaw_DWork.pY_not_empty_a = false;
}

void A380LateralNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T
  *rtu_In_Phi_deg, const real_T *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_beta_deg, const
  real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_delta_xi_pos, const real_T
  *rtu_In_delta_zeta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_ap_phi_c_deg, const
  real_T *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_xi_inboard_deg, real_T
  *rty_Out_xi_midboard_deg, real_T *rty_Out_xi_outboard_deg, real_T *rty_Out_xi_spoiler_deg, real_T
  *rty_Out_zeta_upper_deg, real_T *rty_Out_zeta_lower_deg)
{
  static const int16_T b[4]{ 0, 120, 150, 380 };

  static const int16_T b_0[4]{ 0, 120, 320, 400 };

  static const int8_T c[4]{ -15, -15, -15, -2 };

  static const int8_T c_0[4]{ 1, 2, 3, 3 };

  real_T L_xi;
  real_T Vias;
  real_T ca;
  real_T dynamic_pressure;
  real_T k_phi;
  real_T omega_0;
  real_T r;
  real_T rtb_Gain1_c;
  real_T rtb_Gain1_l;
  real_T rtb_Gain_b;
  real_T rtb_Saturation6;
  real_T rtb_Saturation_j;
  real_T rtb_Sum_x0;
  real_T rtb_Y_i;
  int32_T high_i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  boolean_T exitg1;
  boolean_T rtb_NOT_h_tmp;
  boolean_T rtb_OR;
  rtb_NOT_h_tmp = !*rtu_In_on_ground;
  if (static_cast<real_T>(rtb_NOT_h_tmp) > A380LateralNormalLaw_rtP.Saturation_UpperSat) {
    rtb_Saturation_j = A380LateralNormalLaw_rtP.Saturation_UpperSat;
  } else if (static_cast<real_T>(rtb_NOT_h_tmp) < A380LateralNormalLaw_rtP.Saturation_LowerSat) {
    rtb_Saturation_j = A380LateralNormalLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Saturation_j = rtb_NOT_h_tmp;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Saturation_j, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i,
    &A380LateralNormalLaw_DWork.sf_RateLimiter);
  rtb_Gain_b = A380LateralNormalLaw_rtP.Gain_Gain * *rtu_In_delta_xi_pos;
  rtb_Saturation_j = A380LateralNormalLaw_rtP.Gain1_Gain * *rtu_In_delta_zeta_pos;
  r = *rtu_In_V_ias_kn;
  rtb_Sum_x0 = *rtu_In_delta_zeta_pos;
  Vias = std::fmax(r, 60.0);
  rtb_Saturation6 = 0.0;
  if (Vias <= 380.0) {
    high_i = 4;
    low_i = 1;
    low_ip1 = 2;
    while (high_i > low_ip1) {
      mid_i = (low_i + high_i) >> 1;
      if (Vias >= b[mid_i - 1]) {
        low_i = mid_i;
        low_ip1 = mid_i + 1;
      } else {
        high_i = mid_i;
      }
    }

    r = (Vias - static_cast<real_T>(b[low_i - 1])) / static_cast<real_T>(b[low_i] - b[low_i - 1]);
    if (r == 0.0) {
      rtb_Saturation6 = -15.0;
    } else if (r == 1.0) {
      rtb_Saturation6 = c[low_i];
    } else if (c[low_i] == -15) {
      rtb_Saturation6 = -15.0;
    } else {
      rtb_Saturation6 = (1.0 - r) * -15.0 + r * static_cast<real_T>(c[low_i]);
    }
  }

  r = Vias * 0.5144;
  A380LateralNormalLaw_RateLimiter(0.814 / std::sqrt(1.3734E+6 / (149.45000000000002 * (r * r))) * (rtb_Saturation6 *
    rtb_Sum_x0), A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up, A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo,
    rtu_In_time_dt, A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &Vias,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_dw);
  rtb_Saturation6 = *rtu_In_r_deg_s;
  ca = *rtu_In_beta_deg;
  dynamic_pressure = *rtu_In_V_ias_kn;
  L_xi = *rtu_In_V_tas_kn;
  Vias = A380LateralNormalLaw_rtP.Gain1_Gain_b * *rtu_In_delta_xi_pos;
  if (*rtu_In_high_speed_prot_active) {
    r = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection2_bp01Data,
                      A380LateralNormalLaw_rtP.BankAngleProtection2_tableData, 4U);
  } else if (*rtu_In_high_aoa_prot_active) {
    r = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection_bp01Data,
                      A380LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    r = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection1_bp01Data,
                      A380LateralNormalLaw_rtP.BankAngleProtection1_tableData, 8U);
  }

  rtb_Sum_x0 = 15.0;
  omega_0 = -15.0;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE >= 25.0) {
    omega_0 = *rtu_In_pk_deg_s;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE <= -25.0) {
    rtb_Sum_x0 = *rtu_In_pk_deg_s;
  }

  Vias += r;
  if (Vias > A380LateralNormalLaw_rtP.Saturation_UpperSat_a) {
    Vias = A380LateralNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation_LowerSat_o) {
    Vias = A380LateralNormalLaw_rtP.Saturation_LowerSat_o;
  }

  r = std::fmin(rtb_Sum_x0, std::fmax(omega_0, Vias * rtb_Y_i)) *
    A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  rtb_OR = ((rtb_Y_i == 0.0) || (*rtu_In_tracking_mode_on) || (*rtu_In_any_ap_engaged));
  rtb_Sum_x0 = *rtu_In_Phi_deg - r;
  A380LateralNormalLaw_DWork.icLoad = (rtb_OR || A380LateralNormalLaw_DWork.icLoad);
  if (A380LateralNormalLaw_DWork.icLoad) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = rtb_Sum_x0;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE_d += r;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE_d > A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit)
  {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE_d <
             A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (A380LateralNormalLaw_DWork.Delay_DSTATE_d > A380LateralNormalLaw_rtP.Saturation_UpperSat_g) {
    r = A380LateralNormalLaw_rtP.Saturation_UpperSat_g;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE_d < A380LateralNormalLaw_rtP.Saturation_LowerSat_e) {
    r = A380LateralNormalLaw_rtP.Saturation_LowerSat_e;
  } else {
    r = A380LateralNormalLaw_DWork.Delay_DSTATE_d;
  }

  A380LateralNormalLaw_RateLimiter(r, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up_m,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo_k, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Sum_x0,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_n);
  if (*rtu_In_any_ap_engaged) {
    if (*rtu_In_tracking_mode_on) {
      rtb_Sum_x0 = *rtu_In_Phi_deg;
    } else {
      rtb_Sum_x0 = *rtu_In_ap_phi_c_deg;
    }
  }

  Vias = std::fmax(1.0, L_xi * 0.5144);
  r = dynamic_pressure * 0.5144;
  if (dynamic_pressure >= 60.0) {
    Vias = ((r * r * 0.6125 * 122.0 / (70000.0 * Vias) * 0.814 * ca * 3.1415926535897931 / 180.0 + -(rtb_Saturation6 *
              3.1415926535897931 / 180.0)) + rtb_Sum_x0 * 3.1415926535897931 / 180.0 * (9.81 / Vias)) * 180.0 /
      3.1415926535897931;
  } else {
    ca = 0.0;
    Vias = 0.0;
  }

  r = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain3_BreakpointsForDimension1,
                    A380LateralNormalLaw_rtP.ScheduledGain3_Table, 3U);
  if (*rtu_In_any_ap_engaged) {
    r = *rtu_In_ap_beta_c_deg + A380LateralNormalLaw_rtP.Constant_Value;
  } else {
    r *= *rtu_In_delta_zeta_pos;
  }

  rtb_Saturation6 = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain1_Table, 4U);
  rtb_Saturation6 = (r - ca) * rtb_Saturation6 - Vias;
  if ((!A380LateralNormalLaw_DWork.pY_not_empty) || (!A380LateralNormalLaw_DWork.pU_not_empty)) {
    A380LateralNormalLaw_DWork.pU = rtb_Saturation6;
    A380LateralNormalLaw_DWork.pU_not_empty = true;
    A380LateralNormalLaw_DWork.pY = rtb_Saturation6;
    A380LateralNormalLaw_DWork.pY_not_empty = true;
  }

  Vias = *rtu_In_time_dt * A380LateralNormalLaw_rtP.LagFilter_C1;
  ca = Vias / (Vias + 2.0);
  A380LateralNormalLaw_DWork.pY = (2.0 - Vias) / (Vias + 2.0) * A380LateralNormalLaw_DWork.pY + (rtb_Saturation6 * ca +
    A380LateralNormalLaw_DWork.pU * ca);
  A380LateralNormalLaw_DWork.pU = rtb_Saturation6;
  rtb_Saturation6 = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain_Table, 8U);
  Vias = r * rtb_Saturation6;
  if (!A380LateralNormalLaw_DWork.pY_not_empty_i) {
    A380LateralNormalLaw_DWork.pY_p = A380LateralNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition;
    A380LateralNormalLaw_DWork.pY_not_empty_i = true;
  }

  A380LateralNormalLaw_DWork.pY_p += std::fmax(std::fmin(static_cast<real_T>(*rtu_In_on_ground) -
    A380LateralNormalLaw_DWork.pY_p, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_up) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_lo) * *rtu_In_time_dt);
  if (A380LateralNormalLaw_DWork.pY_p > A380LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    r = A380LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (A380LateralNormalLaw_DWork.pY_p < A380LateralNormalLaw_rtP.Saturation_LowerSat_j) {
    r = A380LateralNormalLaw_rtP.Saturation_LowerSat_j;
  } else {
    r = A380LateralNormalLaw_DWork.pY_p;
  }

  rtb_Saturation6 = *rtu_In_ap_beta_c_deg * r;
  Vias += A380LateralNormalLaw_DWork.pY;
  if (Vias > A380LateralNormalLaw_rtP.Saturation_UpperSat_c) {
    Vias = A380LateralNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation_LowerSat_l) {
    Vias = A380LateralNormalLaw_rtP.Saturation_LowerSat_l;
  }

  rtb_Saturation6 += (A380LateralNormalLaw_rtP.Constant_Value_o - r) * Vias;
  rtb_Y_i += static_cast<real_T>(*rtu_In_any_ap_engaged);
  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation_UpperSat_e) {
    ca = A380LateralNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation_LowerSat_i) {
    ca = A380LateralNormalLaw_rtP.Saturation_LowerSat_i;
  } else {
    ca = rtb_Y_i;
  }

  if (rtb_Saturation6 > A380LateralNormalLaw_rtP.Saturation5_UpperSat) {
    r = A380LateralNormalLaw_rtP.Saturation5_UpperSat;
  } else if (rtb_Saturation6 < A380LateralNormalLaw_rtP.Saturation5_LowerSat) {
    r = A380LateralNormalLaw_rtP.Saturation5_LowerSat;
  } else {
    r = rtb_Saturation6;
  }

  *rty_Out_zeta_upper_deg = (A380LateralNormalLaw_rtP.Constant_Value_k - ca) * rtb_Saturation_j + r * ca;
  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation_UpperSat_h) {
    ca = A380LateralNormalLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation_LowerSat_a) {
    ca = A380LateralNormalLaw_rtP.Saturation_LowerSat_a;
  } else {
    ca = rtb_Y_i;
  }

  Vias = std::fmax(*rtu_In_V_ias_kn, 80.0) * 0.5144;
  dynamic_pressure = Vias * Vias * 0.6125;
  L_xi = dynamic_pressure * 122.0 * 17.9 * -0.090320788790706555 / 1.0E+6;
  omega_0 = 0.0;
  if ((*rtu_In_V_ias_kn <= 400.0) && (*rtu_In_V_ias_kn >= 0.0)) {
    high_i = 4;
    low_i = 0;
    low_ip1 = 2;
    while (high_i > low_ip1) {
      mid_i = ((low_i + high_i) + 1) >> 1;
      if (*rtu_In_V_ias_kn >= b_0[mid_i - 1]) {
        low_i = mid_i - 1;
        low_ip1 = mid_i + 1;
      } else {
        high_i = mid_i;
      }
    }

    r = (*rtu_In_V_ias_kn - static_cast<real_T>(b_0[low_i])) / static_cast<real_T>(b_0[low_i + 1] - b_0[low_i]);
    if (r == 0.0) {
      omega_0 = c_0[low_i];
    } else if (r == 1.0) {
      omega_0 = c_0[low_i + 1];
    } else if (c_0[low_i + 1] == c_0[low_i]) {
      omega_0 = c_0[low_i];
    } else {
      omega_0 = (1.0 - r) * static_cast<real_T>(c_0[low_i]) + static_cast<real_T>(c_0[low_i + 1]) * r;
    }
  }

  k_phi = -(omega_0 * omega_0) / L_xi;
  rtb_Gain1_l = A380LateralNormalLaw_rtP.Gain1_Gain_bq * *rtu_In_Phi_deg;
  rtb_Gain1_c = A380LateralNormalLaw_rtP.Gain1_Gain_c * *rtu_In_pk_deg_s;
  r = look1_binlxpw(*rtu_In_time_dt, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_j,
                    A380LateralNormalLaw_rtP.ScheduledGain_Table_i, 4U);
  A380LateralNormalLaw_DWork.Delay_DSTATE = ((-(dynamic_pressure / Vias * 122.0 * 320.40999999999997 * -0.487 / 1.0E+6 +
    1.414 * omega_0) / L_xi * A380LateralNormalLaw_rtP.Gain_Gain_g * rtb_Gain1_c + k_phi * rtb_Gain1_l) +
    A380LateralNormalLaw_rtP.Gain1_Gain_n * rtb_Sum_x0 * -k_phi) * r * A380LateralNormalLaw_rtP.Gain_Gain_p;
  A380LateralNormalLaw_RateLimiter(A380LateralNormalLaw_rtP.Gain_Gain_f * A380LateralNormalLaw_DWork.Delay_DSTATE * ca +
    (A380LateralNormalLaw_rtP.Constant_Value_j - ca) * rtb_Gain_b, A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_d,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_k, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_e, &dynamic_pressure,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_i);
  if (A380LateralNormalLaw_rtP.Constant_Value_li) {
    ca = dynamic_pressure;
  } else {
    Vias = std::abs(dynamic_pressure) + A380LateralNormalLaw_rtP.Bias_Bias;
    if (Vias > A380LateralNormalLaw_rtP.Saturation4_UpperSat) {
      Vias = A380LateralNormalLaw_rtP.Saturation4_UpperSat;
    } else if (Vias < A380LateralNormalLaw_rtP.Saturation4_LowerSat) {
      Vias = A380LateralNormalLaw_rtP.Saturation4_LowerSat;
    }

    if (dynamic_pressure < 0.0) {
      ca = -1.0;
    } else {
      ca = (dynamic_pressure > 0.0);
    }

    ca = Vias * ca * A380LateralNormalLaw_rtP.Gain2_Gain;
  }

  *rty_Out_xi_spoiler_deg = A380LateralNormalLaw_rtP.Gain1_Gain_m * ca;
  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation_UpperSat_c4) {
    r = A380LateralNormalLaw_rtP.Saturation_UpperSat_c4;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation_LowerSat_m) {
    r = A380LateralNormalLaw_rtP.Saturation_LowerSat_m;
  } else {
    r = rtb_Y_i;
  }

  if (dynamic_pressure > A380LateralNormalLaw_rtP.Saturation2_UpperSat) {
    ca = A380LateralNormalLaw_rtP.Saturation2_UpperSat;
  } else if (dynamic_pressure < A380LateralNormalLaw_rtP.Saturation2_LowerSat) {
    ca = A380LateralNormalLaw_rtP.Saturation2_LowerSat;
  } else {
    ca = dynamic_pressure;
  }

  *rty_Out_xi_outboard_deg = (A380LateralNormalLaw_rtP.Constant_Value_n - r) * rtb_Gain_b + ca * r;
  Vias = A380LateralNormalLaw_rtP.Gain_Gain_k * dynamic_pressure;
  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation_UpperSat_l1) {
    r = A380LateralNormalLaw_rtP.Saturation_UpperSat_l1;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation_LowerSat_g) {
    r = A380LateralNormalLaw_rtP.Saturation_LowerSat_g;
  } else {
    r = rtb_Y_i;
  }

  if (Vias > A380LateralNormalLaw_rtP.Saturation_UpperSat_ai) {
    ca = A380LateralNormalLaw_rtP.Saturation_UpperSat_ai;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation_LowerSat_mu) {
    ca = A380LateralNormalLaw_rtP.Saturation_LowerSat_mu;
  } else {
    ca = Vias;
  }

  *rty_Out_xi_inboard_deg = (A380LateralNormalLaw_rtP.Constant_Value_e - r) * rtb_Gain_b + ca * r;
  r = 0.0;
  dynamic_pressure = A380LateralNormalLaw_DWork.pointer;
  L_xi = A380LateralNormalLaw_DWork.pointer + 1.0;
  if (A380LateralNormalLaw_DWork.pointer + 1.0 > 35.0) {
    L_xi = 1.0;
  }

  ca = A380LateralNormalLaw_DWork.stack[static_cast<int32_T>(A380LateralNormalLaw_DWork.pointer) - 1];
  exitg1 = false;
  while ((!exitg1) && (dynamic_pressure != L_xi)) {
    r += A380LateralNormalLaw_DWork.stack[static_cast<int32_T>(dynamic_pressure) + 34];
    ca = A380LateralNormalLaw_DWork.stack[static_cast<int32_T>(dynamic_pressure) - 1];
    if (r >= 0.35) {
      exitg1 = true;
    } else {
      dynamic_pressure--;
      if (dynamic_pressure < 1.0) {
        dynamic_pressure = 35.0;
      }
    }
  }

  A380LateralNormalLaw_DWork.timeSinceLastSample += *rtu_In_time_dt;
  if (A380LateralNormalLaw_DWork.timeSinceLastSample > 0.01) {
    A380LateralNormalLaw_DWork.stack[static_cast<int32_T>(A380LateralNormalLaw_DWork.pointer) - 1] = Vias;
    A380LateralNormalLaw_DWork.stack[static_cast<int32_T>(A380LateralNormalLaw_DWork.pointer) + 34] =
      A380LateralNormalLaw_DWork.timeSinceLastSample;
    A380LateralNormalLaw_DWork.pointer++;
    if (A380LateralNormalLaw_DWork.pointer > 35.0) {
      A380LateralNormalLaw_DWork.pointer = 1.0;
    }

    A380LateralNormalLaw_DWork.timeSinceLastSample = 0.0;
  }

  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation_UpperSat_p) {
    r = A380LateralNormalLaw_rtP.Saturation_UpperSat_p;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation_LowerSat_p) {
    r = A380LateralNormalLaw_rtP.Saturation_LowerSat_p;
  } else {
    r = rtb_Y_i;
  }

  if (ca > A380LateralNormalLaw_rtP.Saturation3_UpperSat) {
    ca = A380LateralNormalLaw_rtP.Saturation3_UpperSat;
  } else if (ca < A380LateralNormalLaw_rtP.Saturation3_LowerSat) {
    ca = A380LateralNormalLaw_rtP.Saturation3_LowerSat;
  }

  *rty_Out_xi_midboard_deg = (A380LateralNormalLaw_rtP.Constant_Value_f - r) * rtb_Gain_b + ca * r;
  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation_UpperSat_c4z) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation_UpperSat_c4z;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation_LowerSat_am) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation_LowerSat_am;
  }

  rtb_Gain_b = (A380LateralNormalLaw_rtP.Constant_Value_lp - rtb_Y_i) * rtb_Saturation_j;
  rtb_Saturation_j = A380LateralNormalLaw_rtP.Gain1_Gain_l * *rtu_In_Theta_deg;
  Vias = *rtu_In_V_tas_kn;
  if (Vias > A380LateralNormalLaw_rtP.Saturation_UpperSat_ek) {
    Vias = A380LateralNormalLaw_rtP.Saturation_UpperSat_ek;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation_LowerSat_jd) {
    Vias = A380LateralNormalLaw_rtP.Saturation_LowerSat_jd;
  }

  rtb_Sum_x0 = *rtu_In_r_deg_s - std::sin(A380LateralNormalLaw_rtP.Gain1_Gain_f * rtb_Sum_x0) *
    A380LateralNormalLaw_rtP.Constant2_Value * std::cos(rtb_Saturation_j) / (A380LateralNormalLaw_rtP.Gain6_Gain * Vias)
    * A380LateralNormalLaw_rtP.Gain_Gain_i;
  ca = look1_binlxpw(*rtu_In_V_tas_kn, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_a,
                     A380LateralNormalLaw_rtP.ScheduledGain_Table_e, 6U);
  if (!A380LateralNormalLaw_DWork.pY_not_empty_a) {
    A380LateralNormalLaw_DWork.pY_b = A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_m;
    A380LateralNormalLaw_DWork.pY_not_empty_a = true;
  }

  A380LateralNormalLaw_DWork.pY_b += std::fmax(std::fmin(static_cast<real_T>(rtb_NOT_h_tmp) -
    A380LateralNormalLaw_DWork.pY_b, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_j) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_n) * *rtu_In_time_dt);
  if (A380LateralNormalLaw_DWork.pY_b > A380LateralNormalLaw_rtP.Saturation_UpperSat_n) {
    rtb_Saturation_j = A380LateralNormalLaw_rtP.Saturation_UpperSat_n;
  } else if (A380LateralNormalLaw_DWork.pY_b < A380LateralNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Saturation_j = A380LateralNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Saturation_j = A380LateralNormalLaw_DWork.pY_b;
  }

  Vias = rtb_Sum_x0 * ca;
  ca = look1_binlxpw(*rtu_In_V_tas_kn, A380LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1_j,
                     A380LateralNormalLaw_rtP.ScheduledGain1_Table_m, 6U);
  ca *= *rtu_In_r_deg_s;
  if (Vias > A380LateralNormalLaw_rtP.Saturation1_UpperSat_j) {
    Vias = A380LateralNormalLaw_rtP.Saturation1_UpperSat_j;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation1_LowerSat_a) {
    Vias = A380LateralNormalLaw_rtP.Saturation1_LowerSat_a;
  }

  if (ca > A380LateralNormalLaw_rtP.Saturation2_UpperSat_n) {
    ca = A380LateralNormalLaw_rtP.Saturation2_UpperSat_n;
  } else if (ca < A380LateralNormalLaw_rtP.Saturation2_LowerSat_a) {
    ca = A380LateralNormalLaw_rtP.Saturation2_LowerSat_a;
  }

  Vias = ((A380LateralNormalLaw_rtP.Constant_Value_ku - rtb_Saturation_j) * ca + Vias * rtb_Saturation_j) +
    rtb_Saturation6;
  if (Vias > A380LateralNormalLaw_rtP.Saturation6_UpperSat) {
    Vias = A380LateralNormalLaw_rtP.Saturation6_UpperSat;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation6_LowerSat) {
    Vias = A380LateralNormalLaw_rtP.Saturation6_LowerSat;
  }

  *rty_Out_zeta_lower_deg = Vias * rtb_Y_i + rtb_Gain_b;
  A380LateralNormalLaw_DWork.icLoad = false;
}

A380LateralNormalLaw::A380LateralNormalLaw():
  A380LateralNormalLaw_DWork()
{
}

A380LateralNormalLaw::~A380LateralNormalLaw()
{
}
