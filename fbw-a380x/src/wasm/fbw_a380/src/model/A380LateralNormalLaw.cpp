#include "A380LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

A380LateralNormalLaw::Parameters_A380LateralNormalLaw_T A380LateralNormalLaw::A380LateralNormalLaw_rtP{

  { 0.0, 120.0, 150.0, 380.0 },


  { 0.0, 130.0, 200.0, 250.0, 300.0 },


  { 0.0, 140.0, 180.0, 220.0, 250.0, 270.0, 300.0, 320.0, 400.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  2.0,

  1.0,

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


  { -15.0, -15.0, -15.0, -2.0 },


  { 3.0, 3.0, 2.5, 1.0, 1.0 },


  { 1.1, 1.3, 1.8, 2.0, 2.2, 2.5, 2.7, 3.2, 3.8 },


  { 1.5, 1.5, 1.5, 1.0, 0.6, 0.1, 0.1 },


  { 1.4, 1.4, 1.4, 1.2, 1.0, 0.8, 0.8 },


  { 1.1, 1.0, 0.6, 0.3, 0.1 },

  67.0,

  -0.2,

  -5.0,

  -1000.0,

  -2.0,

  -15.0,

  -30.0,

  -12.0,

  -30.0,

  0.2,

  5.0,

  0.33333333333333331,

  2.0,

  15.0,

  30.0,

  12.0,

  30.0,


  { 20.0, 15.0, 0.0, -15.0, -20.0 },


  { -50.0, -40.0, 0.0, 40.0, 50.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -66.0, -45.0, -33.0, 0.0, 33.0, 45.0, 66.0, 90.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -71.0, -66.0, -33.0, 0.0, 33.0, 66.0, 71.0, 90.0 },

  0.0,

  2.0,

  -5.0,

  25.0,

  0.0,

  1.2,

  2.5,

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

  30.0,

  -30.0,

  1.0,

  1.0,

  0.0,

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

  0.66666666666666663,

  1.0,

  0.0,

  1.0,

  0.0,

  1.0,

  0.0,

  30.0,

  -30.0,

  30.0,

  -30.0,

  1.0,

  0.0,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  25.0,

  -25.0,

  0.66666666666666663,

  0.0,

  30.0,

  -30.0,

  30.0,

  -30.0,

  1.5,

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
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380LateralNormalLaw_DWork.Delay1_DSTATE = A380LateralNormalLaw_rtP.Delay1_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
}

void A380LateralNormalLaw::reset(void)
{
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380LateralNormalLaw_DWork.Delay1_DSTATE = A380LateralNormalLaw_rtP.Delay1_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_k);
  A380LateralNormalLaw_DWork.pY_not_empty = false;
  A380LateralNormalLaw_DWork.pU_not_empty = false;
  A380LateralNormalLaw_DWork.pY_not_empty_j = false;
  A380LateralNormalLaw_DWork.pY_not_empty_a = false;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_go);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_g);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_l);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_i);
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
  real_T L_xi;
  real_T Vias;
  real_T Vtas;
  real_T denom;
  real_T dynamic_pressure;
  real_T k_phi;
  real_T omega_0;
  real_T r;
  real_T rtb_Limiterxi;
  real_T rtb_Product_l;
  real_T rtb_Sum;
  real_T rtb_Y;
  real_T rtb_Y_j;
  int32_T high_i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int16_T r_tmp;
  boolean_T rtb_NOT;
  static const int16_T b[4]{ 0, 120, 150, 380 };

  static const int8_T c[4]{ -15, -15, -15, -2 };

  static const int16_T b_0[5]{ -1, 0, 120, 320, 400 };

  static const real_T c_0[5]{ 0.3, 0.3, 0.4, 0.8, 0.8 };

  rtb_NOT = !*rtu_In_on_ground;
  if (static_cast<real_T>(rtb_NOT) > A380LateralNormalLaw_rtP.Saturation_UpperSat) {
    Vias = A380LateralNormalLaw_rtP.Saturation_UpperSat;
  } else if (static_cast<real_T>(rtb_NOT) < A380LateralNormalLaw_rtP.Saturation_LowerSat) {
    Vias = A380LateralNormalLaw_rtP.Saturation_LowerSat;
  } else {
    Vias = rtb_NOT;
  }

  A380LateralNormalLaw_RateLimiter(Vias, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_j,
    &A380LateralNormalLaw_DWork.sf_RateLimiter);
  Vias = std::fmax(*rtu_In_V_ias_kn, 60.0);
  r = 0.0;
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

    r_tmp = b[low_i - 1];
    r = (Vias - static_cast<real_T>(r_tmp)) / static_cast<real_T>(b[low_i] - r_tmp);
    if (r == 0.0) {
      r = -15.0;
    } else if (r == 1.0) {
      r = c[low_i];
    } else if (c[low_i] == -15) {
      r = -15.0;
    } else {
      r = (1.0 - r) * -15.0 + r * static_cast<real_T>(c[low_i]);
    }
  }

  rtb_Limiterxi = Vias * 0.5144;
  A380LateralNormalLaw_RateLimiter(0.814 / std::sqrt(1.3734E+6 / (149.45000000000002 * (rtb_Limiterxi * rtb_Limiterxi)))
    * (r * *rtu_In_delta_zeta_pos), A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &Vias,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_k);
  rtb_Limiterxi = A380LateralNormalLaw_rtP.Gain1_Gain_o * *rtu_In_delta_xi_pos;
  Vias = std::fmax(*rtu_In_V_ias_kn, 80.0) * 0.5144;
  dynamic_pressure = Vias * Vias * 0.6125;
  L_xi = dynamic_pressure * 845.0 * 39.9 * -0.0964294411726867 / 8.5E+7;
  if (*rtu_In_V_ias_kn > 400.0) {
    omega_0 = 0.8;
  } else if (*rtu_In_V_ias_kn < -1.0) {
    omega_0 = 0.3;
  } else {
    high_i = 5;
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
      omega_0 = (1.0 - r) * c_0[low_i] + c_0[low_i + 1] * r;
    }
  }

  k_phi = -(omega_0 * omega_0) / L_xi;
  r = A380LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain * rtb_Limiterxi;
  rtb_Sum = r - A380LateralNormalLaw_DWork.Delay_DSTATE;
  if (*rtu_In_high_speed_prot_active) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = look1_binlxpw(*rtu_In_Phi_deg,
      A380LateralNormalLaw_rtP.BankAngleProtection2_bp01Data, A380LateralNormalLaw_rtP.BankAngleProtection2_tableData,
      4U);
  } else if (*rtu_In_high_aoa_prot_active) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = look1_binlxpw(*rtu_In_Phi_deg,
      A380LateralNormalLaw_rtP.BankAngleProtection_bp01Data, A380LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    A380LateralNormalLaw_DWork.Delay_DSTATE = look1_binlxpw(*rtu_In_Phi_deg,
      A380LateralNormalLaw_rtP.BankAngleProtection1_bp01Data, A380LateralNormalLaw_rtP.BankAngleProtection1_tableData,
      8U);
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE += rtb_Sum / *rtu_In_time_dt * (1.0 / omega_0) + rtb_Limiterxi;
  rtb_Sum = 15.0;
  rtb_Limiterxi = -15.0;
  if (A380LateralNormalLaw_DWork.Delay1_DSTATE >= 25.0) {
    rtb_Limiterxi = *rtu_In_pk_deg_s;
  } else if (A380LateralNormalLaw_DWork.Delay1_DSTATE <= -25.0) {
    rtb_Sum = *rtu_In_pk_deg_s;
  }

  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation3_UpperSat) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation3_UpperSat;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation3_LowerSat) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation3_LowerSat;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE = std::fmin(rtb_Sum, std::fmax(rtb_Limiterxi,
    A380LateralNormalLaw_DWork.Delay_DSTATE * rtb_Y_j)) * A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain
    * *rtu_In_time_dt;
  A380LateralNormalLaw_DWork.icLoad = ((rtb_Y_j == 0.0) || (*rtu_In_tracking_mode_on) || (*rtu_In_any_ap_engaged) ||
    A380LateralNormalLaw_DWork.icLoad);
  if (A380LateralNormalLaw_DWork.icLoad) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_o = *rtu_In_Phi_deg - A380LateralNormalLaw_DWork.Delay_DSTATE;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE += A380LateralNormalLaw_DWork.Delay_DSTATE_o;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_o = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE <
             A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_o = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  } else {
    A380LateralNormalLaw_DWork.Delay_DSTATE_o = A380LateralNormalLaw_DWork.Delay_DSTATE;
  }

  if (*rtu_In_any_ap_engaged) {
    if (*rtu_In_tracking_mode_on) {
      rtb_Sum = *rtu_In_Phi_deg;
    } else {
      rtb_Sum = *rtu_In_ap_phi_c_deg;
    }
  } else {
    rtb_Sum = A380LateralNormalLaw_DWork.Delay_DSTATE_o;
  }

  Vtas = std::fmax(1.0, *rtu_In_V_tas_kn * 0.5144);
  rtb_Limiterxi = *rtu_In_V_ias_kn * 0.5144;
  if (*rtu_In_V_ias_kn >= 60.0) {
    denom = *rtu_In_beta_deg;
    rtb_Limiterxi = ((rtb_Limiterxi * rtb_Limiterxi * 0.6125 * 122.0 / (70000.0 * Vtas) * 0.814 * *rtu_In_beta_deg *
                      3.1415926535897931 / 180.0 - *rtu_In_r_deg_s * 3.1415926535897931 / 180.0) + rtb_Sum *
                     3.1415926535897931 / 180.0 * (9.81 / Vtas)) * 180.0 / 3.1415926535897931;
  } else {
    denom = 0.0;
    rtb_Limiterxi = 0.0;
  }

  if (*rtu_In_any_ap_engaged) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = *rtu_In_ap_beta_c_deg + A380LateralNormalLaw_rtP.Constant_Value;
  } else {
    A380LateralNormalLaw_DWork.Delay_DSTATE = *rtu_In_delta_zeta_pos * look1_binlxpw(*rtu_In_V_ias_kn,
      A380LateralNormalLaw_rtP.ScheduledGain3_BreakpointsForDimension1, A380LateralNormalLaw_rtP.ScheduledGain3_Table,
      3U);
  }

  rtb_Limiterxi = (A380LateralNormalLaw_DWork.Delay_DSTATE - denom) * look1_binlxpw(*rtu_In_V_ias_kn,
    A380LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1, A380LateralNormalLaw_rtP.ScheduledGain1_Table, 4U)
    - rtb_Limiterxi;
  if ((!A380LateralNormalLaw_DWork.pY_not_empty) || (!A380LateralNormalLaw_DWork.pU_not_empty)) {
    A380LateralNormalLaw_DWork.pU = rtb_Limiterxi;
    A380LateralNormalLaw_DWork.pU_not_empty = true;
    A380LateralNormalLaw_DWork.pY = rtb_Limiterxi;
    A380LateralNormalLaw_DWork.pY_not_empty = true;
  }

  denom = *rtu_In_time_dt * A380LateralNormalLaw_rtP.LagFilter_C1 + 2.0;
  Vtas = *rtu_In_time_dt * A380LateralNormalLaw_rtP.LagFilter_C1 / denom;
  A380LateralNormalLaw_DWork.pY = (2.0 - *rtu_In_time_dt * A380LateralNormalLaw_rtP.LagFilter_C1) / denom *
    A380LateralNormalLaw_DWork.pY + (rtb_Limiterxi * Vtas + A380LateralNormalLaw_DWork.pU * Vtas);
  A380LateralNormalLaw_DWork.pU = rtb_Limiterxi;
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_DWork.Delay_DSTATE * look1_binlxpw(*rtu_In_V_ias_kn,
    A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1, A380LateralNormalLaw_rtP.ScheduledGain_Table, 8U) +
    A380LateralNormalLaw_DWork.pY;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation_UpperSat_c) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation_LowerSat_l) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation_LowerSat_l;
  }

  if (!A380LateralNormalLaw_DWork.pY_not_empty_j) {
    A380LateralNormalLaw_DWork.pY_m = A380LateralNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition;
    A380LateralNormalLaw_DWork.pY_not_empty_j = true;
  }

  A380LateralNormalLaw_DWork.pY_m += std::fmax(std::fmin(static_cast<real_T>(*rtu_In_on_ground) -
    A380LateralNormalLaw_DWork.pY_m, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_up) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_lo) * *rtu_In_time_dt);
  if (A380LateralNormalLaw_DWork.pY_m > A380LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Limiterxi = A380LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (A380LateralNormalLaw_DWork.pY_m < A380LateralNormalLaw_rtP.Saturation_LowerSat_j) {
    rtb_Limiterxi = A380LateralNormalLaw_rtP.Saturation_LowerSat_j;
  } else {
    rtb_Limiterxi = A380LateralNormalLaw_DWork.pY_m;
  }

  denom = (A380LateralNormalLaw_rtP.Constant_Value_o - rtb_Limiterxi) * A380LateralNormalLaw_DWork.Delay_DSTATE;
  Vtas = *rtu_In_ap_beta_c_deg * rtb_Limiterxi;
  if (*rtu_In_V_tas_kn > A380LateralNormalLaw_rtP.Saturation_UpperSat_e) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (*rtu_In_V_tas_kn < A380LateralNormalLaw_rtP.Saturation_LowerSat_jd) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation_LowerSat_jd;
  } else {
    A380LateralNormalLaw_DWork.Delay_DSTATE = *rtu_In_V_tas_kn;
  }

  rtb_Limiterxi = A380LateralNormalLaw_rtP.Gain6_Gain * A380LateralNormalLaw_DWork.Delay_DSTATE;
  A380LateralNormalLaw_DWork.Delay_DSTATE = look1_binlxpw(*rtu_In_V_tas_kn,
    A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_a, A380LateralNormalLaw_rtP.ScheduledGain_Table_e,
    6U);
  A380LateralNormalLaw_DWork.Delay_DSTATE *= *rtu_In_r_deg_s - std::sin(A380LateralNormalLaw_rtP.Gain1_Gain_f * rtb_Sum)
    * A380LateralNormalLaw_rtP.Constant2_Value * std::cos(A380LateralNormalLaw_rtP.Gain1_Gain_l * *rtu_In_Theta_deg) /
    rtb_Limiterxi * A380LateralNormalLaw_rtP.Gain_Gain_i;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation1_UpperSat) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation1_LowerSat) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  if (!A380LateralNormalLaw_DWork.pY_not_empty_a) {
    A380LateralNormalLaw_DWork.pY_a = A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_m;
    A380LateralNormalLaw_DWork.pY_not_empty_a = true;
  }

  A380LateralNormalLaw_DWork.pY_a += std::fmax(std::fmin(static_cast<real_T>(rtb_NOT) - A380LateralNormalLaw_DWork.pY_a,
    std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_j) * *rtu_In_time_dt), -std::abs
    (A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_n) * *rtu_In_time_dt);
  if (A380LateralNormalLaw_DWork.pY_a > A380LateralNormalLaw_rtP.Saturation_UpperSat_n) {
    rtb_Limiterxi = A380LateralNormalLaw_rtP.Saturation_UpperSat_n;
  } else if (A380LateralNormalLaw_DWork.pY_a < A380LateralNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Limiterxi = A380LateralNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Limiterxi = A380LateralNormalLaw_DWork.pY_a;
  }

  rtb_Product_l = A380LateralNormalLaw_DWork.Delay_DSTATE * rtb_Limiterxi;
  A380LateralNormalLaw_DWork.Delay_DSTATE = look1_binlxpw(*rtu_In_V_tas_kn,
    A380LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1_j, A380LateralNormalLaw_rtP.ScheduledGain1_Table_m,
    6U);
  A380LateralNormalLaw_DWork.Delay_DSTATE *= *rtu_In_r_deg_s;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation2_UpperSat) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation2_UpperSat;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation2_LowerSat) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation2_LowerSat;
  }

  A380LateralNormalLaw_RateLimiter(A380LateralNormalLaw_rtP.Gain6_Gain_j * ((Vtas + denom) + (rtb_Product_l +
    (A380LateralNormalLaw_rtP.Constant_Value_k - rtb_Limiterxi) * A380LateralNormalLaw_DWork.Delay_DSTATE)),
    A380LateralNormalLaw_rtP.RateLimiterVariableTs4_up, A380LateralNormalLaw_rtP.RateLimiterVariableTs4_lo,
    rtu_In_time_dt, A380LateralNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition, &rtb_Y,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_go);
  A380LateralNormalLaw_DWork.Delay_DSTATE = rtb_Y_j + static_cast<real_T>(*rtu_In_any_ap_engaged);
  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation1_UpperSat_e) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation1_UpperSat_e;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation1_LowerSat_l) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation1_LowerSat_l;
  }

  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation_UpperSat_es) {
    rtb_Limiterxi = A380LateralNormalLaw_rtP.Saturation_UpperSat_es;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation_LowerSat_k) {
    rtb_Limiterxi = A380LateralNormalLaw_rtP.Saturation_LowerSat_k;
  } else {
    rtb_Limiterxi = A380LateralNormalLaw_DWork.Delay_DSTATE;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Y * rtb_Limiterxi + (A380LateralNormalLaw_rtP.Constant_Value_g - rtb_Limiterxi) *
    (A380LateralNormalLaw_rtP.Gain1_Gain * *rtu_In_delta_zeta_pos), A380LateralNormalLaw_rtP.RateLimiterVariableTs3_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_j,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_g);
  if (static_cast<real_T>(rtb_NOT) > A380LateralNormalLaw_rtP.Switch1_Threshold) {
    rtb_Limiterxi = A380LateralNormalLaw_rtP.Gain3_Gain * rtb_Y_j;
  } else {
    rtb_Limiterxi = rtb_Y_j;
  }

  if (rtb_Limiterxi > A380LateralNormalLaw_rtP.Saturation6_UpperSat) {
    *rty_Out_zeta_lower_deg = A380LateralNormalLaw_rtP.Saturation6_UpperSat;
  } else if (rtb_Limiterxi < A380LateralNormalLaw_rtP.Saturation6_LowerSat) {
    *rty_Out_zeta_lower_deg = A380LateralNormalLaw_rtP.Saturation6_LowerSat;
  } else {
    *rty_Out_zeta_lower_deg = rtb_Limiterxi;
  }

  if (rtb_Y_j > A380LateralNormalLaw_rtP.Saturation5_UpperSat) {
    *rty_Out_zeta_upper_deg = A380LateralNormalLaw_rtP.Saturation5_UpperSat;
  } else if (rtb_Y_j < A380LateralNormalLaw_rtP.Saturation5_LowerSat) {
    *rty_Out_zeta_upper_deg = A380LateralNormalLaw_rtP.Saturation5_LowerSat;
  } else {
    *rty_Out_zeta_upper_deg = rtb_Y_j;
  }

  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Saturation_UpperSat_h) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation_UpperSat_h;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Saturation_LowerSat_a) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Saturation_LowerSat_a;
  }

  A380LateralNormalLaw_DWork.Delay1_DSTATE = ((-(dynamic_pressure / Vias * 845.0 * 1592.01 * -0.5 / 8.5E+7 + 1.414 *
    omega_0) / L_xi * (A380LateralNormalLaw_rtP.Gain1_Gain_d * *rtu_In_pk_deg_s) + A380LateralNormalLaw_rtP.Gain1_Gain_h
    * *rtu_In_Phi_deg * k_phi) + A380LateralNormalLaw_rtP.Gain1_Gain_j * rtb_Sum * -k_phi) * look1_binlxpw
    (*rtu_In_time_dt, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_b,
     A380LateralNormalLaw_rtP.ScheduledGain_Table_h, 4U) * A380LateralNormalLaw_rtP.Gain_Gain_cw;
  if (A380LateralNormalLaw_DWork.Delay1_DSTATE > A380LateralNormalLaw_rtP.Limiterxi_UpperSat) {
    Vias = A380LateralNormalLaw_rtP.Limiterxi_UpperSat;
  } else if (A380LateralNormalLaw_DWork.Delay1_DSTATE < A380LateralNormalLaw_rtP.Limiterxi_LowerSat) {
    Vias = A380LateralNormalLaw_rtP.Limiterxi_LowerSat;
  } else {
    Vias = A380LateralNormalLaw_DWork.Delay1_DSTATE;
  }

  A380LateralNormalLaw_RateLimiter(A380LateralNormalLaw_rtP.Gain5_Gain * Vias,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs2_up_g, A380LateralNormalLaw_rtP.RateLimiterVariableTs2_lo_o,
    rtu_In_time_dt, A380LateralNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition_c, &dynamic_pressure,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_l);
  A380LateralNormalLaw_RateLimiter(dynamic_pressure * A380LateralNormalLaw_DWork.Delay_DSTATE +
    (A380LateralNormalLaw_rtP.Constant_Value_j - A380LateralNormalLaw_DWork.Delay_DSTATE) *
    (A380LateralNormalLaw_rtP.Gain_Gain_c * *rtu_In_delta_xi_pos), A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_d,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_k, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_e, &rtb_Y_j,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_i);
  if (static_cast<real_T>(rtb_NOT) > A380LateralNormalLaw_rtP.Switch_Threshold) {
    Vias = A380LateralNormalLaw_rtP.Gain_Gain * rtb_Y_j;
  } else {
    Vias = rtb_Y_j;
  }

  if (Vias > A380LateralNormalLaw_rtP.Saturation_UpperSat_a) {
    *rty_Out_xi_inboard_deg = A380LateralNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation_LowerSat_m) {
    *rty_Out_xi_inboard_deg = A380LateralNormalLaw_rtP.Saturation_LowerSat_m;
  } else {
    *rty_Out_xi_inboard_deg = Vias;
  }

  if (Vias > A380LateralNormalLaw_rtP.Saturation3_UpperSat_o) {
    *rty_Out_xi_midboard_deg = A380LateralNormalLaw_rtP.Saturation3_UpperSat_o;
  } else if (Vias < A380LateralNormalLaw_rtP.Saturation3_LowerSat_o) {
    *rty_Out_xi_midboard_deg = A380LateralNormalLaw_rtP.Saturation3_LowerSat_o;
  } else {
    *rty_Out_xi_midboard_deg = Vias;
  }

  if (A380LateralNormalLaw_rtP.Constant_Value_li) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = rtb_Y_j;
  } else {
    Vias = std::abs(rtb_Y_j) + A380LateralNormalLaw_rtP.Bias_Bias;
    if (Vias > A380LateralNormalLaw_rtP.Saturation4_UpperSat) {
      Vias = A380LateralNormalLaw_rtP.Saturation4_UpperSat;
    } else if (Vias < A380LateralNormalLaw_rtP.Saturation4_LowerSat) {
      Vias = A380LateralNormalLaw_rtP.Saturation4_LowerSat;
    }

    if (rtb_Y_j < 0.0) {
      high_i = -1;
    } else {
      high_i = (rtb_Y_j > 0.0);
    }

    A380LateralNormalLaw_DWork.Delay_DSTATE = Vias * static_cast<real_T>(high_i) * A380LateralNormalLaw_rtP.Gain2_Gain;
  }

  *rty_Out_xi_spoiler_deg = A380LateralNormalLaw_rtP.Gain1_Gain_m * A380LateralNormalLaw_DWork.Delay_DSTATE;
  if (rtb_Y_j > A380LateralNormalLaw_rtP.Saturation2_UpperSat_n) {
    *rty_Out_xi_outboard_deg = A380LateralNormalLaw_rtP.Saturation2_UpperSat_n;
  } else if (rtb_Y_j < A380LateralNormalLaw_rtP.Saturation2_LowerSat_p) {
    *rty_Out_xi_outboard_deg = A380LateralNormalLaw_rtP.Saturation2_LowerSat_p;
  } else {
    *rty_Out_xi_outboard_deg = rtb_Y_j;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE = r;
  A380LateralNormalLaw_DWork.icLoad = false;
}

A380LateralNormalLaw::A380LateralNormalLaw():
  A380LateralNormalLaw_DWork()
{
}

A380LateralNormalLaw::~A380LateralNormalLaw() = default;
