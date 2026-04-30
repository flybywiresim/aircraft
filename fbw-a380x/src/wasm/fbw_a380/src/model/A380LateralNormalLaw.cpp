#include "A380LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

A380LateralNormalLaw::Parameters_A380LateralNormalLaw_T A380LateralNormalLaw::A380LateralNormalLaw_rtP{

  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  1.0,

  1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -15.0,

  -67.0,


  { 1.1, 1.0, 0.6, 0.3, 0.1 },

  15.0,

  67.0,

  -0.2,

  -5.0,

  -1000.0,

  -30.0,

  -30.0,

  0.2,

  5.0,

  0.33333333333333331,

  30.0,

  30.0,


  { 20.0, 15.0, 0.0, -15.0, -20.0 },


  { -50.0, -40.0, 0.0, 40.0, 50.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -66.0, -45.0, -33.0, 0.0, 33.0, 45.0, 66.0, 90.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -71.0, -66.0, -33.0, 0.0, 33.0, 66.0, 71.0, 90.0 },

  -1.0,


  { 15.0, 15.0, 2.0, 2.0 },


  { 100.0, 140.0, 340.0, 400.0 },

  -15.0,

  1.0,

  0.0,

  -30.0,

  -30.0,

  0.0,

  0.0,

  1.0,

  0.0,

  1.0,

  0.0,

  1.0,

  1.0,

  0.0,

  1.0,

  9.81,

  15.0,

  15.0,

  -15.0,

  0.0,

  0.017453292519943295,

  0.017453292519943295,

  1000.0,

  100.0,

  0.51444444444444448,

  57.295779513082323,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  1.0,

  0.0,

  1.0
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
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380LateralNormalLaw_DWork.Delay1_DSTATE = A380LateralNormalLaw_rtP.Delay1_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
}

void A380LateralNormalLaw::reset(void)
{
  A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380LateralNormalLaw_DWork.Delay1_DSTATE = A380LateralNormalLaw_rtP.Delay1_InitialCondition;
  A380LateralNormalLaw_DWork.icLoad = true;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_k);
  A380LateralNormalLaw_DWork.pY_not_empty = false;
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_g);
  A380LateralNormalLaw_RateLimiter_Reset(&A380LateralNormalLaw_DWork.sf_RateLimiter_i);
}

void A380LateralNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T
  *rtu_In_Phi_deg, const real_T *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_beta_deg, const
  real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_delta_xi_pos, const real_T
  *rtu_In_delta_zeta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_ap_phi_c_deg, const
  real_T *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_xi_deg, real_T *rty_Out_zeta_deg)
{
  real_T L_xi;
  real_T N_r;
  real_T N_zeta;
  real_T N_zeta_tmp;
  real_T Vias;
  real_T Y_beta;
  real_T dynamic_pressure;
  real_T h_beta;
  real_T h_beta_tmp;
  real_T k_phi;
  real_T k_r;
  real_T k_r_tmp;
  real_T r;
  real_T rtb_Gain1_c;
  real_T rtb_Saturation_g1;
  real_T rtb_Sum1_j;
  real_T rtb_Sum2;
  real_T rtb_Y_i;
  real_T rtb_Y_j;
  real_T rtb_uDLookupTable_b;
  real_T v_cas_ms;
  real_T x;
  int32_T high_i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int16_T r_tmp;
  boolean_T tmp;
  static const int16_T b[4]{ 0, 120, 150, 380 };

  static const int8_T c[4]{ -15, -15, -15, -2 };

  static const int16_T b_0[4]{ 100, 140, 200, 350 };

  static const real_T c_0[4]{ 0.5, 0.5, 1.0, 1.0 };

  static const real_T c_1[4]{ 1.2, 1.2, 1.5, 1.5 };

  high_i = !*rtu_In_on_ground;
  if (high_i > A380LateralNormalLaw_rtP.Saturation_UpperSat) {
    rtb_Sum2 = A380LateralNormalLaw_rtP.Saturation_UpperSat;
  } else if (high_i < A380LateralNormalLaw_rtP.Saturation_LowerSat) {
    rtb_Sum2 = A380LateralNormalLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Sum2 = high_i;
  }

  A380LateralNormalLaw_RateLimiter(rtb_Sum2, A380LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_j,
    &A380LateralNormalLaw_DWork.sf_RateLimiter);
  Vias = std::fmax(*rtu_In_V_ias_kn, 60.0);
  rtb_Saturation_g1 = 0.0;
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
      rtb_Saturation_g1 = -15.0;
    } else if (r == 1.0) {
      rtb_Saturation_g1 = c[low_i];
    } else if (c[low_i] == -15) {
      rtb_Saturation_g1 = -15.0;
    } else {
      rtb_Saturation_g1 = (1.0 - r) * -15.0 + r * static_cast<real_T>(c[low_i]);
    }
  }

  Vias *= 0.5144;
  A380LateralNormalLaw_RateLimiter(0.814 / std::sqrt(1.3734E+6 / (149.45000000000002 * (Vias * Vias))) *
    (rtb_Saturation_g1 * *rtu_In_delta_zeta_pos), A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_i,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_k);
  rtb_Saturation_g1 = rtb_Y_j + static_cast<real_T>(*rtu_In_any_ap_engaged);
  if (rtb_Saturation_g1 > A380LateralNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Saturation_g1 = A380LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Saturation_g1 < A380LateralNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Saturation_g1 = A380LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  if (rtb_Saturation_g1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_e) {
    Vias = A380LateralNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (rtb_Saturation_g1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_k) {
    Vias = A380LateralNormalLaw_rtP.Saturation_LowerSat_k;
  } else {
    Vias = rtb_Saturation_g1;
  }

  if (!A380LateralNormalLaw_DWork.pY_not_empty) {
    A380LateralNormalLaw_DWork.pY = A380LateralNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition;
    A380LateralNormalLaw_DWork.pY_not_empty = true;
  }

  A380LateralNormalLaw_DWork.pY += std::fmax(std::fmin(static_cast<real_T>(*rtu_In_on_ground) -
    A380LateralNormalLaw_DWork.pY, std::abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_up) * *rtu_In_time_dt), -std::
    abs(A380LateralNormalLaw_rtP.RateLimiterVariableTs2_lo) * *rtu_In_time_dt);
  if (A380LateralNormalLaw_DWork.pY > A380LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Gain1_c = A380LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (A380LateralNormalLaw_DWork.pY < A380LateralNormalLaw_rtP.Saturation_LowerSat_j) {
    rtb_Gain1_c = A380LateralNormalLaw_rtP.Saturation_LowerSat_j;
  } else {
    rtb_Gain1_c = A380LateralNormalLaw_DWork.pY;
  }

  rtb_Y_i = *rtu_In_ap_beta_c_deg * rtb_Gain1_c;
  rtb_Sum1_j = A380LateralNormalLaw_rtP.Constant_Value_o - rtb_Gain1_c;
  v_cas_ms = std::fmax(*rtu_In_V_ias_kn, 80.0) * 0.5144;
  dynamic_pressure = v_cas_ms * v_cas_ms * 0.6125;
  Y_beta = dynamic_pressure / v_cas_ms * 845.0;
  N_r = Y_beta * 1600.0 * -0.649 / 1.5E+8;
  N_zeta_tmp = dynamic_pressure * 845.0 * 40.0;
  N_zeta = N_zeta_tmp * -0.38 / 1.5E+8;
  Y_beta = Y_beta / 400000.0 * -0.646;
  if (*rtu_In_V_ias_kn > 350.0) {
    r = 1.0;
  } else if (*rtu_In_V_ias_kn < 100.0) {
    r = 0.5;
  } else {
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
      r = c_0[low_i];
    } else if (r == 1.0) {
      r = c_0[low_i + 1];
    } else if (c_0[low_i + 1] == c_0[low_i]) {
      r = c_0[low_i];
    } else {
      r = (1.0 - r) * c_0[low_i] + c_0[low_i + 1] * r;
    }
  }

  h_beta_tmp = r * r;
  h_beta = -h_beta_tmp / N_zeta;
  k_r_tmp = 1.414 * r;
  k_r = (((k_r_tmp + 0.3) + N_r) + Y_beta) * (-1.0 / N_zeta);
  if (*rtu_In_any_ap_engaged) {
    rtb_Gain1_c = *rtu_In_ap_beta_c_deg;
  } else {
    dynamic_pressure = look1_binlxpw(*rtu_In_V_ias_kn, A380LateralNormalLaw_rtP.uDLookupTable_bp01Data,
      A380LateralNormalLaw_rtP.uDLookupTable_tableData, 3U);
    rtb_Gain1_c = A380LateralNormalLaw_rtP.Gain1_Gain * *rtu_In_delta_zeta_pos;
    if (rtb_Gain1_c > dynamic_pressure) {
      rtb_Gain1_c = dynamic_pressure;
    } else {
      dynamic_pressure *= A380LateralNormalLaw_rtP.Gain_Gain;
      if (rtb_Gain1_c < dynamic_pressure) {
        rtb_Gain1_c = dynamic_pressure;
      }
    }
  }

  tmp = ((rtb_Y_j == 0.0) || (*rtu_In_tracking_mode_on));
  if (tmp) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE += h_beta * 0.3 * (rtb_Gain1_c - *rtu_In_beta_deg) *
    A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE > A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE <
             A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380LateralNormalLaw_DWork.Delay_DSTATE = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (*rtu_In_high_speed_prot_active) {
    rtb_uDLookupTable_b = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection2_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection2_tableData, 4U);
  } else if (*rtu_In_high_aoa_prot_active) {
    rtb_uDLookupTable_b = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    rtb_uDLookupTable_b = look1_binlxpw(*rtu_In_Phi_deg, A380LateralNormalLaw_rtP.BankAngleProtection1_bp01Data,
      A380LateralNormalLaw_rtP.BankAngleProtection1_tableData, 8U);
  }

  dynamic_pressure = A380LateralNormalLaw_rtP.Gain1_Gain_o * *rtu_In_delta_xi_pos;
  if (dynamic_pressure > A380LateralNormalLaw_rtP.Saturation3_UpperSat) {
    dynamic_pressure = A380LateralNormalLaw_rtP.Saturation3_UpperSat;
  } else if (dynamic_pressure < A380LateralNormalLaw_rtP.Saturation3_LowerSat) {
    dynamic_pressure = A380LateralNormalLaw_rtP.Saturation3_LowerSat;
  }

  rtb_Sum2 = dynamic_pressure + rtb_uDLookupTable_b;
  v_cas_ms = std::fmax(*rtu_In_V_ias_kn, 80.0) * 0.5144;
  dynamic_pressure = v_cas_ms * v_cas_ms * 0.6125;
  L_xi = -(dynamic_pressure * 845.0 * 39.9) / 9.0E+7;
  if (*rtu_In_V_ias_kn > 350.0) {
    r = 1.5;
  } else if (*rtu_In_V_ias_kn < 100.0) {
    r = 1.2;
  } else {
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
      r = c_1[low_i];
    } else if (r == 1.0) {
      r = c_1[low_i + 1];
    } else if (c_1[low_i + 1] == c_1[low_i]) {
      r = c_1[low_i];
    } else {
      r = (1.0 - r) * c_1[low_i] + c_1[low_i + 1] * r;
    }
  }

  k_phi = -(r * r) / L_xi;
  rtb_uDLookupTable_b = 15.0;
  x = -15.0;
  if (A380LateralNormalLaw_DWork.Delay1_DSTATE >= 60.0) {
    x = *rtu_In_pk_deg_s;
  } else if (A380LateralNormalLaw_DWork.Delay1_DSTATE <= -60.0) {
    rtb_uDLookupTable_b = *rtu_In_pk_deg_s;
  }

  rtb_uDLookupTable_b = std::fmin(rtb_uDLookupTable_b, std::fmax(x, rtb_Sum2 * rtb_Y_j)) *
    A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain_a * *rtu_In_time_dt;
  A380LateralNormalLaw_DWork.icLoad = (tmp || (*rtu_In_any_ap_engaged) || A380LateralNormalLaw_DWork.icLoad);
  if (A380LateralNormalLaw_DWork.icLoad) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_o = *rtu_In_Phi_deg - rtb_uDLookupTable_b;
  }

  A380LateralNormalLaw_DWork.Delay_DSTATE_o += rtb_uDLookupTable_b;
  if (A380LateralNormalLaw_DWork.Delay_DSTATE_o > A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_g)
  {
    A380LateralNormalLaw_DWork.Delay_DSTATE_o = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_g;
  } else if (A380LateralNormalLaw_DWork.Delay_DSTATE_o <
             A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_o) {
    A380LateralNormalLaw_DWork.Delay_DSTATE_o = A380LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_o;
  }

  if (*rtu_In_any_ap_engaged) {
    if (*rtu_In_tracking_mode_on) {
      rtb_uDLookupTable_b = *rtu_In_Phi_deg;
    } else {
      rtb_uDLookupTable_b = *rtu_In_ap_phi_c_deg;
    }
  } else {
    rtb_uDLookupTable_b = 1.0 / r * rtb_Sum2 + A380LateralNormalLaw_DWork.Delay_DSTATE_o;
  }

  if (*rtu_In_V_tas_kn > A380LateralNormalLaw_rtP.Saturation_UpperSat_ek) {
    rtb_Sum2 = A380LateralNormalLaw_rtP.Saturation_UpperSat_ek;
  } else if (*rtu_In_V_tas_kn < A380LateralNormalLaw_rtP.Saturation_LowerSat_jd) {
    rtb_Sum2 = A380LateralNormalLaw_rtP.Saturation_LowerSat_jd;
  } else {
    rtb_Sum2 = *rtu_In_V_tas_kn;
  }

  A380LateralNormalLaw_RateLimiter((rtb_Y_i + rtb_Sum1_j * ((h_beta * rtb_Gain1_c +
    (A380LateralNormalLaw_DWork.Delay_DSTATE + 1.0 / N_zeta * (((k_r_tmp * 0.3 + h_beta_tmp) - N_zeta_tmp * 0.366 /
    1.5E+8) - (N_r + k_r * N_zeta) * Y_beta) * *rtu_In_beta_deg)) + k_r * (*rtu_In_r_deg_s -
    A380LateralNormalLaw_rtP.Gain_Gain_i * (A380LateralNormalLaw_rtP.Constant2_Value * std::sin
    (A380LateralNormalLaw_rtP.Gain1_Gain_f * rtb_uDLookupTable_b) * std::cos(A380LateralNormalLaw_rtP.Gain1_Gain_l *
    *rtu_In_Theta_deg) / (A380LateralNormalLaw_rtP.Gain6_Gain * rtb_Sum2))))) * Vias +
    (A380LateralNormalLaw_rtP.Constant_Value_g - Vias) * (A380LateralNormalLaw_rtP.Gain1_Gain_i * *rtu_In_delta_zeta_pos),
    A380LateralNormalLaw_rtP.RateLimiterVariableTs3_up, A380LateralNormalLaw_rtP.RateLimiterVariableTs3_lo,
    rtu_In_time_dt, A380LateralNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition, rty_Out_zeta_deg,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_g);
  A380LateralNormalLaw_DWork.Delay1_DSTATE = ((-(dynamic_pressure / v_cas_ms * 845.0 * 1592.01 * -1.55 / 9.0E+7 + 2.0 *
    r) / L_xi * (A380LateralNormalLaw_rtP.Gain1_Gain_d * *rtu_In_pk_deg_s) + A380LateralNormalLaw_rtP.Gain1_Gain_h *
    *rtu_In_Phi_deg * k_phi) + A380LateralNormalLaw_rtP.Gain1_Gain_j * rtb_uDLookupTable_b * -k_phi) * look1_binlxpw
    (*rtu_In_time_dt, A380LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
     A380LateralNormalLaw_rtP.ScheduledGain_Table, 4U) * A380LateralNormalLaw_rtP.Gain_Gain_cw;
  if (rtb_Saturation_g1 > A380LateralNormalLaw_rtP.Saturation_UpperSat_h) {
    rtb_Saturation_g1 = A380LateralNormalLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_Saturation_g1 < A380LateralNormalLaw_rtP.Saturation_LowerSat_a) {
    rtb_Saturation_g1 = A380LateralNormalLaw_rtP.Saturation_LowerSat_a;
  }

  A380LateralNormalLaw_RateLimiter(A380LateralNormalLaw_DWork.Delay1_DSTATE * rtb_Saturation_g1 +
    (A380LateralNormalLaw_rtP.Constant_Value_j - rtb_Saturation_g1) * (A380LateralNormalLaw_rtP.Gain_Gain_c *
    *rtu_In_delta_xi_pos), A380LateralNormalLaw_rtP.RateLimiterVariableTs1_up_d,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_k, rtu_In_time_dt,
    A380LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_e, rty_Out_xi_deg,
    &A380LateralNormalLaw_DWork.sf_RateLimiter_i);
  A380LateralNormalLaw_DWork.icLoad = false;
}

A380LateralNormalLaw::A380LateralNormalLaw():
  A380LateralNormalLaw_DWork()
{
}

A380LateralNormalLaw::~A380LateralNormalLaw() = default;
