#include "A380LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

A380LateralNormalLaw::Parameters_A380LateralNormalLaw_T A380LateralNormalLaw::A380LateralNormalLaw_rtP{

  { 0.0, 0.06, 0.1, 0.2, 1.0 },


  { 0.0, 120.0, 150.0, 380.0 },


  { 0.0, 130.0, 200.0, 250.0, 300.0 },

  2.0,

  1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -67.0,


  { 1.1, 1.0, 0.6, 0.3, 0.1 },


  { -15.0, -15.0, -15.0, -2.0 },


  { 3.0, 3.0, 2.5, 1.0, 1.0 },

  67.0,

  -0.2,

  -15.0,

  -50.0,

  -5.0,

  -2.0,

  -1000.0,

  0.2,

  15.0,

  50.0,

  5.0,

  2.0,

  0.33333333333333331,


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

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  25.0,

  -25.0,

  1.0,

  0.0,

  1.0,

  0.0,

  -25.0,

  1.0,

  0.0,

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

void A380LateralNormalLaw::init(real_T *rty_Out_xi_inboard_deg, real_T *rty_Out_xi_midboard_deg, real_T
  *rty_Out_xi_outboard_deg, real_T *rty_Out_zeta_upper_deg, real_T *rty_Out_zeta_lower_deg)
{
  *rty_Out_zeta_lower_deg = A380LateralNormalLaw_rtP.Constant_Value_m;
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Delay_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
  *rty_Out_xi_inboard_deg = *rty_Out_zeta_lower_deg;
  *rty_Out_xi_midboard_deg = *rty_Out_zeta_lower_deg;
  *rty_Out_xi_outboard_deg = *rty_Out_zeta_lower_deg;
  *rty_Out_zeta_upper_deg = *rty_Out_zeta_lower_deg;
}

void A380LateralNormalLaw::reset(void)
{
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.Delay_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_n);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_j);
  A380LateralNormalLaw_DWork.pY_not_empty = false;
  A380LateralNormalLaw_DWork.pU_not_empty = false;
  A380LateralNormalLaw_DWork.pY_not_empty_n = false;
  A380LateralNormalLaw_DWork.pY_not_empty_a = false;
  A380LateralNormalLaw_DWork.pY_not_empty_i = false;
}

void A380LateralNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Phi_deg, const real_T
  *rtu_In_pk_deg_s, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_delta_xi_pos, const real_T
  *rtu_In_delta_zeta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_ap_phi_c_deg, const
  real_T *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_xi_inboard_deg, real_T
  *rty_Out_xi_midboard_deg, real_T *rty_Out_xi_outboard_deg, real_T *rty_Out_zeta_upper_deg, real_T
  *rty_Out_zeta_lower_deg)
{
  static const int16_T b[4]{ 0, 120, 320, 400 };

  static const int8_T c[4]{ 1, 2, 3, 3 };

  real_T L_xi;
  real_T dynamic_pressure;
  real_T k_phi;
  real_T omega_0;
  real_T rtb_Gain1;
  real_T rtb_Gain1_c;
  real_T rtb_Gain1_l;
  real_T rtb_Y_i;
  real_T rtb_Y_m;
  real_T v_cas_ms;
  boolean_T rtb_NOT_h_tmp;
  boolean_T rtb_OR;
  rtb_NOT_h_tmp = !*rtu_In_on_ground;
  if (static_cast<real_T>(rtb_NOT_h_tmp) > A380LateralNormalLaw_rtP.Saturation_UpperSat) {
    rtb_Y_m = A380LateralNormalLaw_rtP.Saturation_UpperSat;
  } else if (static_cast<real_T>(rtb_NOT_h_tmp) < A380LateralNormalLaw_rtP.Saturation_LowerSat) {
    rtb_Y_m = A380LateralNormalLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Y_m = rtb_NOT_h_tmp;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Y_m, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i,
    &A380LateralNormalLaw_DWork.sf_RateLimiter);
  rtb_OR = ((rtb_Y_i == 0.0) || (*rtu_In_tracking_mode_on) || (*rtu_In_any_ap_engaged));
  rtb_Gain1 = A380LateralNormalLaw_rtP.Gain1_Gain * *rtu_In_delta_xi_pos;
  if (*rtu_In_high_speed_prot_active) {
    rtb_Y_m = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection2_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection2_tableData, 4U);
  } else if (*rtu_In_high_aoa_prot_active) {
    rtb_Y_m = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    rtb_Y_m = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection1_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection1_tableData, 8U);
  }

  rtb_Y_m += rtb_Gain1;
  rtb_Gain1 = 15.0;
  v_cas_ms = -15.0;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE >= 25.0) {
    v_cas_ms = *rtu_In_pk_deg_s;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE <= -25.0) {
    rtb_Gain1 = *rtu_In_pk_deg_s;
  }

  if (rtb_Y_m > A380LateralNormalLaw_rtP.Saturation_UpperSat_a) {
    rtb_Y_m = A380LateralNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Y_m < A380LateralNormalLaw_rtP.Saturation_LowerSat_o) {
    rtb_Y_m = A380LateralNormalLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Y_m = std::fmin(rtb_Gain1, std::fmax(v_cas_ms, rtb_Y_m * rtb_Y_i)) *
    A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  rtb_Gain1 = *rtu_In_Phi_deg - rtb_Y_m;
  A380LateralNormalLaw_DWork.icLoad = (rtb_OR || A380LateralNormalLaw_DWork.icLoad);
  if (A380LateralNormalLaw_DWork.icLoad) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = rtb_Gain1;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE_d += rtb_Y_m;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE_d > A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit)
  {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE_d <
             A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_d = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (A380LateralNormalLaw_DWork.Delay_DSTATE_d > A380LateralNormalLaw_rtP.Saturation_UpperSat_g) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Saturation_UpperSat_g;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE_d < A380LateralNormalLaw_rtP.Saturation_LowerSat_e) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Saturation_LowerSat_e;
  } else {
    rtb_Gain1 = A380LateralNormalLaw_DWork.Delay_DSTATE_d;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Gain1, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up_m,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo_k, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Y_m,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_n);
  if (*rtu_In_any_ap_engaged) {
    if (*rtu_In_tracking_mode_on) {
      rtb_Y_m = *rtu_In_Phi_deg;
    } else {
      rtb_Y_m = *rtu_In_ap_phi_c_deg;
    }
  }

  rtb_Gain1 = A380LateralNormalLaw_rtP.Gain1_Gain_n * rtb_Y_m;
  v_cas_ms = std::fmax(*rtu_In_V_ias_kn, 80.0) * 0.5144;
  dynamic_pressure = v_cas_ms * v_cas_ms * 0.6125;
  L_xi = dynamic_pressure * 122.0 * 17.9 * -0.090320788790706555 / 1.0E+6;
  omega_0 = 0.0;
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

    rtb_Y_m = (*rtu_In_V_ias_kn - static_cast<real_T>(b[low_i])) / static_cast<real_T>(b[low_i + 1] - b[low_i]);
    if (rtb_Y_m == 0.0) {
      omega_0 = c[low_i];
    } else if (rtb_Y_m == 1.0) {
      omega_0 = c[low_i + 1];
    } else if (c[low_i + 1] == c[low_i]) {
      omega_0 = c[low_i];
    } else {
      omega_0 = (1.0 - rtb_Y_m) * static_cast<real_T>(c[low_i]) + static_cast<real_T>(c[low_i + 1]) * rtb_Y_m;
    }
  }

  k_phi = -(omega_0 * omega_0) / L_xi;
  rtb_Gain1_l = A380LateralNormalLaw_rtP.Gain1_Gain_b * *rtu_In_Phi_deg;
  rtb_Gain1_c = A380LateralNormalLaw_rtP.Gain1_Gain_c * *rtu_In_pk_deg_s;
  rtb_Y_m = look1_binlxpw(*rtu_In_time_dt, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain_Table, 4U);
  A380LateralNormalLaw_DWork.Delay_DSTATE = ((-(dynamic_pressure / v_cas_ms * 122.0 * 320.40999999999997 * -0.487 /
    1.0E+6 + 1.414 * omega_0) / L_xi * rtb_Gain1_c + k_phi * rtb_Gain1_l) + -k_phi * rtb_Gain1) * rtb_Y_m *
    A380LateralNormalLaw_rtP.Gain_Gain;
  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  if (rtb_Y_i > A380LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (rtb_Y_i < A380LateralNormalLaw_rtP.Saturation_LowerSat_og) {
    rtb_Y_i = A380LateralNormalLaw_rtP.Saturation_LowerSat_og;
  }

  rtb_Y_m = A380LateralNormalLaw_rtP.Gain_Gain_c * *rtu_In_delta_xi_pos;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.Limiterxi_UpperSat) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Limiterxi_UpperSat;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE < A380LateralNormalLaw_rtP.Limiterxi_LowerSat) {
    rtb_Gain1 = A380LateralNormalLaw_rtP.Limiterxi_LowerSat;
  } else {
    rtb_Gain1 = A380LateralNormalLaw_DWork.Delay_DSTATE;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Gain1 * rtb_Y_i + (A380LateralNormalLaw_rtP.Constant_Value_l - rtb_Y_i) * rtb_Y_m,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_up_d, A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo_b,
    rtu_In_time_dt, A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_k, &v_cas_ms,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_j);
  *rty_Out_zeta_lower_deg = A380LateralNormalLaw_rtP.Constant_Value_m;
  *rty_Out_xi_inboard_deg = *rty_Out_zeta_lower_deg;
  *rty_Out_xi_midboard_deg = *rty_Out_zeta_lower_deg;
  *rty_Out_xi_outboard_deg = *rty_Out_zeta_lower_deg;
  *rty_Out_zeta_upper_deg = *rty_Out_zeta_lower_deg;
  rtb_Y_i = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain3_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain3_Table, 3U);
  if (*rtu_In_any_ap_engaged) {
    rtb_Y_i = *rtu_In_ap_beta_c_deg + A380LateralNormalLaw_rtP.Constant_Value;
  } else {
    rtb_Y_i *= *rtu_In_delta_zeta_pos;
  }

  rtb_Y_m = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1,
    A380LateralNormalLaw_rtP.ScheduledGain1_Table, 4U);
  rtb_Y_i *= rtb_Y_m;
  if ((!A380LateralNormalLaw_DWork.pY_not_empty) || (!A380LateralNormalLaw_DWork.pU_not_empty)) {
    A380LateralNormalLaw_DWork.pU = rtb_Y_i;
    A380LateralNormalLaw_DWork.pU_not_empty = true;
    A380LateralNormalLaw_DWork.pY = rtb_Y_i;
    A380LateralNormalLaw_DWork.pY_not_empty = true;
  }

  rtb_Y_m = *rtu_In_time_dt * A380LateralNormalLaw_rtP.LagFilter_C1;
  rtb_Gain1 = rtb_Y_m / (rtb_Y_m + 2.0);
  A380LateralNormalLaw_DWork.pY = (2.0 - rtb_Y_m) / (rtb_Y_m + 2.0) * A380LateralNormalLaw_DWork.pY + (rtb_Y_i *
    rtb_Gain1 + A380LateralNormalLaw_DWork.pU * rtb_Gain1);
  A380LateralNormalLaw_DWork.pU = rtb_Y_i;
  if (!A380LateralNormalLaw_DWork.pY_not_empty_n) {
    A380LateralNormalLaw_DWork.pY_k = A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition;
    A380LateralNormalLaw_DWork.pY_not_empty_n = true;
  }

  A380LateralNormalLaw_DWork.pY_k += std::fmax(std::fmin(A380LateralNormalLaw_rtP.Constant1_Value -
    A380LateralNormalLaw_DWork.pY_k, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo) * *rtu_In_time_dt);
  if (!A380LateralNormalLaw_DWork.pY_not_empty_a) {
    A380LateralNormalLaw_DWork.pY_b = A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_m;
    A380LateralNormalLaw_DWork.pY_not_empty_a = true;
  }

  A380LateralNormalLaw_DWork.pY_b += std::fmax(std::fmin(static_cast<real_T>(rtb_NOT_h_tmp) -
    A380LateralNormalLaw_DWork.pY_b, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_j) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_n) * *rtu_In_time_dt);
  if (!A380LateralNormalLaw_DWork.pY_not_empty_i) {
    A380LateralNormalLaw_DWork.pY_p = A380LateralNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition;
    A380LateralNormalLaw_DWork.pY_not_empty_i = true;
  }

  A380LateralNormalLaw_DWork.pY_p += std::fmax(std::fmin(static_cast<real_T>(*rtu_In_on_ground) -
    A380LateralNormalLaw_DWork.pY_p, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_up) * *rtu_In_time_dt),
    -std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_lo) * *rtu_In_time_dt);
  A380LateralNormalLaw_DWork.icLoad = false;
}

A380LateralNormalLaw::A380LateralNormalLaw():
  A380LateralNormalLaw_DWork()
{
}

A380LateralNormalLaw::~A380LateralNormalLaw()
{
}
