#include "LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T LateralNormalLaw_IN_FlightMode{ 1U };

const uint8_T LateralNormalLaw_IN_GroundMode{ 2U };

const uint8_T LateralNormalLaw_IN_NO_ACTIVE_CHILD{ 0U };

LateralNormalLaw::Parameters_LateralNormalLaw_T LateralNormalLaw::LateralNormalLaw_rtP{

  { 0.0, 120.0, 150.0, 380.0 },


  { 0.0, 130.0, 200.0, 250.0, 300.0 },


  { 0.0, 140.0, 180.0, 220.0, 250.0, 270.0, 300.0, 320.0, 400.0 },


  { 0.0, 40.0, 100.0, 180.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  0.2,

  2.0,

  1.0,

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


  { 0.0, 0.0, 1.4, 1.4 },


  { 1.1, 1.0, 0.6, 0.3, 0.1 },

  67.0,

  -2.0,

  -5.0,

  -1000.0,

  -2.0,

  -50.0,

  2.0,

  5.0,

  0.33333333333333331,

  2.0,

  50.0,


  { 20.0, 15.0, 0.0, -15.0, -20.0 },


  { -50.0, -40.0, 0.0, 40.0, 50.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -66.0, -45.0, -33.0, 0.0, 33.0, 45.0, 66.0, 90.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -71.0, -66.0, -33.0, 0.0, 33.0, 66.0, 71.0, 90.0 },

  1.0,

  0.0,

  1.0,

  25.0,

  -25.0,

  0.0,

  1.0,

  0.0,

  -25.0,

  0.0,

  0.0,

  15.0,

  15.0,

  -15.0,

  0.0,

  9.81,

  0.017453292519943295,

  0.017453292519943295,

  1000.0,

  100.0,

  0.51444444444444448,

  57.295779513082323,

  0.017453292519943295,

  57.295779513082323,

  25.0,

  -25.0,

  1.0,

  0.0,

  25.0,

  -25.0,

  1.0,

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

  1.0
};

void LateralNormalLaw::LateralNormalLaw_RateLimiter_Reset(rtDW_RateLimiter_LateralNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
}

void LateralNormalLaw::LateralNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_LateralNormalLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void LateralNormalLaw::LateralNormalLaw_LagFilter_Reset(rtDW_LagFilter_LateralNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void LateralNormalLaw::LateralNormalLaw_LagFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_LateralNormalLaw_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = *rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void LateralNormalLaw::init(void)
{
  LateralNormalLaw_DWork.Delay_DSTATE = LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  LateralNormalLaw_DWork.Delay_DSTATE_e = LateralNormalLaw_rtP.Delay_InitialCondition;
  LateralNormalLaw_DWork.icLoad = true;
}

void LateralNormalLaw::reset(void)
{
  LateralNormalLaw_DWork.Delay_DSTATE = LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  LateralNormalLaw_DWork.Delay_DSTATE_e = LateralNormalLaw_rtP.Delay_InitialCondition;
  LateralNormalLaw_DWork.icLoad = true;
  LateralNormalLaw_DWork.is_active_c5_LateralNormalLaw = 0U;
  LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_NO_ACTIVE_CHILD;
  LateralNormalLaw_RateLimiter_Reset(&LateralNormalLaw_DWork.sf_RateLimiter);
  LateralNormalLaw_RateLimiter_Reset(&LateralNormalLaw_DWork.sf_RateLimiter_d);
  LateralNormalLaw_LagFilter_Reset(&LateralNormalLaw_DWork.sf_LagFilter);
  LateralNormalLaw_LagFilter_Reset(&LateralNormalLaw_DWork.sf_LagFilter_m);
  LateralNormalLaw_DWork.pY_not_empty_h = false;
  LateralNormalLaw_DWork.pY_not_empty = false;
  LateralNormalLaw_RateLimiter_Reset(&LateralNormalLaw_DWork.sf_RateLimiter_j);
}

void LateralNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg,
  const real_T *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_V_ias_kn, const real_T
  *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft, const real_T *rtu_In_delta_xi_pos, const real_T
  *rtu_In_delta_zeta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_ap_phi_c_deg, const
  real_T *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_xi_deg, real_T *rty_Out_zeta_deg)
{
  static const real_T c_0[5]{ 1.0, 1.0, 1.2, 2.0, 2.0 };

  static const int16_T b_0[5]{ -1, 0, 120, 320, 400 };

  static const int16_T b[4]{ 0, 120, 150, 380 };

  static const int8_T c[4]{ -15, -15, -15, -2 };

  real_T L_xi;
  real_T Vias;
  real_T Vias_tmp;
  real_T b_x;
  real_T k_phi;
  real_T r;
  real_T rtb_Divide;
  real_T rtb_Gain;
  real_T rtb_Gain_b;
  real_T rtb_Saturation2;
  real_T rtb_Saturation_f;
  real_T rtb_Y_i;
  real_T rtb_beDot;
  real_T rtb_input_V_ias_kn;
  real_T rtb_input_p_V_tas_kn;
  real_T rtb_uDLookupTable_n;
  real_T u0;
  real_T x;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int32_T rtb_in_flight;
  boolean_T rtb_OR;
  if (LateralNormalLaw_DWork.is_active_c5_LateralNormalLaw == 0U) {
    LateralNormalLaw_DWork.is_active_c5_LateralNormalLaw = 1U;
    LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_GroundMode;
    rtb_in_flight = 0;
  } else if (LateralNormalLaw_DWork.is_c5_LateralNormalLaw == LateralNormalLaw_IN_FlightMode) {
    if (*rtu_In_on_ground) {
      LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_GroundMode;
      rtb_in_flight = 0;
    } else {
      rtb_in_flight = 1;
    }
  } else if (((!*rtu_In_on_ground) && (*rtu_In_Theta_deg > 8.0)) || (*rtu_In_H_radio_ft > 400.0)) {
    LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_FlightMode;
    rtb_in_flight = 1;
  } else {
    rtb_in_flight = 0;
  }

  if (rtb_in_flight > LateralNormalLaw_rtP.Saturation_UpperSat_p) {
    rtb_Gain_b = LateralNormalLaw_rtP.Saturation_UpperSat_p;
  } else if (rtb_in_flight < LateralNormalLaw_rtP.Saturation_LowerSat_h) {
    rtb_Gain_b = LateralNormalLaw_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Gain_b = rtb_in_flight;
  }

  LateralNormalLaw_RateLimiter(rtb_Gain_b, LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i, &LateralNormalLaw_DWork.sf_RateLimiter);
  rtb_Gain_b = LateralNormalLaw_rtP.Gain_Gain * *rtu_In_delta_xi_pos;
  rtb_input_V_ias_kn = *rtu_In_V_ias_kn;
  rtb_Gain = *rtu_In_delta_zeta_pos;
  Vias = std::fmax(rtb_input_V_ias_kn, 60.0);
  rtb_input_V_ias_kn = 0.0;
  if (Vias <= 380.0) {
    rtb_in_flight = 4;
    low_i = 1;
    low_ip1 = 2;
    while (rtb_in_flight > low_ip1) {
      mid_i = (low_i + rtb_in_flight) >> 1;
      if (Vias >= b[mid_i - 1]) {
        low_i = mid_i;
        low_ip1 = mid_i + 1;
      } else {
        rtb_in_flight = mid_i;
      }
    }

    r = (Vias - static_cast<real_T>(b[low_i - 1])) / static_cast<real_T>(b[low_i] - b[low_i - 1]);
    if (r == 0.0) {
      rtb_input_V_ias_kn = -15.0;
    } else if (r == 1.0) {
      rtb_input_V_ias_kn = c[low_i];
    } else if (c[low_i] == -15) {
      rtb_input_V_ias_kn = -15.0;
    } else {
      rtb_input_V_ias_kn = (1.0 - r) * -15.0 + r * static_cast<real_T>(c[low_i]);
    }
  }

  rtb_Saturation_f = Vias * 0.5144;
  LateralNormalLaw_RateLimiter(0.814 / std::sqrt(1.3734E+6 / (149.45000000000002 * (rtb_Saturation_f * rtb_Saturation_f)))
    * (rtb_input_V_ias_kn * rtb_Gain), LateralNormalLaw_rtP.RateLimiterVariableTs1_up,
    LateralNormalLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &Vias, &LateralNormalLaw_DWork.sf_RateLimiter_d);
  Vias = *rtu_In_r_deg_s;
  rtb_beDot = *rtu_In_V_ias_kn;
  rtb_input_p_V_tas_kn = *rtu_In_V_tas_kn;
  rtb_uDLookupTable_n = *rtu_In_delta_zeta_pos;
  rtb_Saturation2 = LateralNormalLaw_rtP.Gain1_Gain * *rtu_In_delta_xi_pos;
  rtb_Gain = LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain * rtb_Saturation2;
  rtb_Divide = (rtb_Gain - LateralNormalLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt;
  rtb_input_V_ias_kn = std::fmax(*rtu_In_V_ias_kn, 80.0) * 0.5144;
  Vias_tmp = rtb_input_V_ias_kn * rtb_input_V_ias_kn * 0.6125;
  L_xi = Vias_tmp * 122.0 * 17.9 * -0.090320788790706555 / 1.0E+6;
  if (*rtu_In_V_ias_kn > 400.0) {
    r = 2.0;
  } else if (*rtu_In_V_ias_kn < -1.0) {
    r = 1.0;
  } else {
    rtb_in_flight = 5;
    low_i = 0;
    low_ip1 = 2;
    while (rtb_in_flight > low_ip1) {
      mid_i = ((low_i + rtb_in_flight) + 1) >> 1;
      if (*rtu_In_V_ias_kn >= b_0[mid_i - 1]) {
        low_i = mid_i - 1;
        low_ip1 = mid_i + 1;
      } else {
        rtb_in_flight = mid_i;
      }
    }

    r = (*rtu_In_V_ias_kn - static_cast<real_T>(b_0[low_i])) / static_cast<real_T>(b_0[low_i + 1] - b_0[low_i]);
    if (r == 0.0) {
      r = c_0[low_i];
    } else if (r == 1.0) {
      r = c_0[low_i + 1];
    } else {
      k_phi = c_0[low_i + 1];
      if (k_phi == c_0[low_i]) {
        r = c_0[low_i];
      } else {
        r = (1.0 - r) * c_0[low_i] + k_phi * r;
      }
    }
  }

  k_phi = -(r * r) / L_xi;
  if (*rtu_In_high_speed_prot_active) {
    rtb_Saturation_f = look1_binlxpw(*rtu_In_Phi_deg, LateralNormalLaw_rtP.BankAngleProtection2_bp01Data,
      LateralNormalLaw_rtP.BankAngleProtection2_tableData, 4U);
  } else if (*rtu_In_high_aoa_prot_active) {
    rtb_Saturation_f = look1_binlxpw(*rtu_In_Phi_deg, LateralNormalLaw_rtP.BankAngleProtection_bp01Data,
      LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    rtb_Saturation_f = look1_binlxpw(*rtu_In_Phi_deg, LateralNormalLaw_rtP.BankAngleProtection1_bp01Data,
      LateralNormalLaw_rtP.BankAngleProtection1_tableData, 8U);
  }

  b_x = 15.0;
  x = -15.0;
  if (LateralNormalLaw_DWork.Delay_DSTATE_e >= 25.0) {
    x = *rtu_In_pk_deg_s;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_e <= -25.0) {
    b_x = *rtu_In_pk_deg_s;
  }

  u0 = (1.0 / r * rtb_Divide + rtb_Saturation2) + rtb_Saturation_f;
  if (u0 > LateralNormalLaw_rtP.Saturation_UpperSat_a) {
    u0 = LateralNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (u0 < LateralNormalLaw_rtP.Saturation_LowerSat_o) {
    u0 = LateralNormalLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Saturation_f = std::fmin(b_x, std::fmax(x, u0 * rtb_Y_i)) *
    LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  rtb_OR = ((rtb_Y_i == 0.0) || (*rtu_In_tracking_mode_on) || (*rtu_In_any_ap_engaged));
  rtb_Divide = *rtu_In_Phi_deg - rtb_Saturation_f;
  LateralNormalLaw_DWork.icLoad = (rtb_OR || LateralNormalLaw_DWork.icLoad);
  if (LateralNormalLaw_DWork.icLoad) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = rtb_Divide;
  }

  LateralNormalLaw_DWork.Delay_DSTATE_d += rtb_Saturation_f;
  if (LateralNormalLaw_DWork.Delay_DSTATE_d > LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_d < LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (*rtu_In_any_ap_engaged) {
    if (*rtu_In_tracking_mode_on) {
      rtb_Divide = *rtu_In_Phi_deg;
    } else {
      rtb_Divide = *rtu_In_ap_phi_c_deg;
    }
  } else {
    rtb_Divide = LateralNormalLaw_DWork.Delay_DSTATE_d;
  }

  rtb_Saturation2 = std::fmax(rtb_input_p_V_tas_kn * 0.5144, 60.0);
  rtb_Saturation_f = rtb_beDot * 0.5144;
  if (rtb_beDot >= 60.0) {
    rtb_beDot = (rtb_Saturation_f * rtb_Saturation_f * 0.6125 * 122.0 / (70000.0 * rtb_Saturation2) * 3.172 *
                 -rtb_uDLookupTable_n * 3.1415926535897931 / 180.0 + (rtb_Divide * 3.1415926535897931 / 180.0 * (9.81 /
      rtb_Saturation2) + -(Vias * 3.1415926535897931 / 180.0))) * 180.0 / 3.1415926535897931;
  } else {
    rtb_beDot = 0.0;
  }

  LateralNormalLaw_LagFilter(rtb_beDot, LateralNormalLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Saturation2,
    &LateralNormalLaw_DWork.sf_LagFilter);
  rtb_Saturation_f = look1_binlxpw(*rtu_In_V_ias_kn, LateralNormalLaw_rtP.ScheduledGain2_BreakpointsForDimension1,
    LateralNormalLaw_rtP.ScheduledGain2_Table, 3U);
  if (*rtu_In_any_ap_engaged) {
    Vias = *rtu_In_ap_beta_c_deg;
  } else {
    Vias = *rtu_In_delta_zeta_pos * rtb_Saturation_f;
  }

  rtb_Saturation_f = look1_binlxpw(*rtu_In_V_ias_kn, LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1,
    LateralNormalLaw_rtP.ScheduledGain1_Table, 4U);
  LateralNormalLaw_LagFilter((Vias - rtb_Saturation2) * rtb_Saturation_f - rtb_beDot,
    LateralNormalLaw_rtP.LagFilter_C1_d, rtu_In_time_dt, &rtb_Saturation2, &LateralNormalLaw_DWork.sf_LagFilter_m);
  rtb_uDLookupTable_n = look1_binlxpw(*rtu_In_V_ias_kn, LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    LateralNormalLaw_rtP.ScheduledGain_Table, 8U);
  if (!LateralNormalLaw_DWork.pY_not_empty_h) {
    LateralNormalLaw_DWork.pY_p = LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_d;
    LateralNormalLaw_DWork.pY_not_empty_h = true;
  }

  LateralNormalLaw_DWork.pY_p += std::fmax(std::fmin(static_cast<real_T>(*rtu_In_on_ground) -
    LateralNormalLaw_DWork.pY_p, std::abs(LateralNormalLaw_rtP.RateLimiterVariableTs_up_o) * *rtu_In_time_dt), -std::abs
    (LateralNormalLaw_rtP.RateLimiterVariableTs_lo_l) * *rtu_In_time_dt);
  if (*rtu_In_any_ap_engaged) {
    if (LateralNormalLaw_DWork.pY_p > LateralNormalLaw_rtP.Saturation_UpperSat) {
      rtb_Saturation_f = LateralNormalLaw_rtP.Saturation_UpperSat;
    } else if (LateralNormalLaw_DWork.pY_p < LateralNormalLaw_rtP.Saturation_LowerSat) {
      rtb_Saturation_f = LateralNormalLaw_rtP.Saturation_LowerSat;
    } else {
      rtb_Saturation_f = LateralNormalLaw_DWork.pY_p;
    }

    rtb_beDot = *rtu_In_ap_beta_c_deg * rtb_Saturation_f;
    u0 = Vias * rtb_uDLookupTable_n + rtb_Saturation2;
    if (u0 > LateralNormalLaw_rtP.Saturation_UpperSat_f) {
      u0 = LateralNormalLaw_rtP.Saturation_UpperSat_f;
    } else if (u0 < LateralNormalLaw_rtP.Saturation_LowerSat_j) {
      u0 = LateralNormalLaw_rtP.Saturation_LowerSat_j;
    }

    rtb_Saturation_f = (LateralNormalLaw_rtP.Constant_Value - rtb_Saturation_f) * u0 + rtb_beDot;
  } else {
    rtb_Saturation_f = LateralNormalLaw_rtP.Constant_Value_b;
  }

  rtb_Saturation2 = LateralNormalLaw_rtP.Gain1_Gain_p * *rtu_In_Theta_deg;
  u0 = *rtu_In_V_tas_kn;
  if (u0 > LateralNormalLaw_rtP.Saturation_UpperSat_c) {
    u0 = LateralNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (u0 < LateralNormalLaw_rtP.Saturation_LowerSat_i) {
    u0 = LateralNormalLaw_rtP.Saturation_LowerSat_i;
  }

  rtb_uDLookupTable_n = *rtu_In_r_deg_s - std::sin(LateralNormalLaw_rtP.Gain1_Gain_j * rtb_Divide) *
    LateralNormalLaw_rtP.Constant2_Value * std::cos(rtb_Saturation2) / (LateralNormalLaw_rtP.Gain6_Gain * u0) *
    LateralNormalLaw_rtP.Gain_Gain_g;
  rtb_OR = !*rtu_In_on_ground;
  if (!LateralNormalLaw_DWork.pY_not_empty) {
    LateralNormalLaw_DWork.pY = LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_m;
    LateralNormalLaw_DWork.pY_not_empty = true;
  }

  LateralNormalLaw_DWork.pY += std::fmax(std::fmin(static_cast<real_T>(rtb_OR) - LateralNormalLaw_DWork.pY, std::abs
    (LateralNormalLaw_rtP.RateLimiterVariableTs1_up_o) * *rtu_In_time_dt), -std::abs
    (LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_m) * *rtu_In_time_dt);
  if (LateralNormalLaw_DWork.pY > LateralNormalLaw_rtP.Saturation_UpperSat_j) {
    Vias = LateralNormalLaw_rtP.Saturation_UpperSat_j;
  } else if (LateralNormalLaw_DWork.pY < LateralNormalLaw_rtP.Saturation_LowerSat_n) {
    Vias = LateralNormalLaw_rtP.Saturation_LowerSat_n;
  } else {
    Vias = LateralNormalLaw_DWork.pY;
  }

  rtb_Saturation2 = look1_binlxpw(*rtu_In_V_ias_kn, LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1_i,
    LateralNormalLaw_rtP.ScheduledGain1_Table_d, 3U);
  rtb_Saturation2 *= *rtu_In_r_deg_s;
  rtb_input_p_V_tas_kn = Vias_tmp * 122.0 * 17.9;
  u0 = -(Vias_tmp / rtb_input_V_ias_kn * 122.0 * 320.40999999999997 * -0.10100220381291185 / 4.47E+6 + std::sqrt
         (rtb_input_p_V_tas_kn * 0.0035255650890285459 / 4.47E+6) * 1.414) / (rtb_input_p_V_tas_kn *
    -0.018936822384138473 / 4.47E+6) * (LateralNormalLaw_rtP.Gain1_Gain_k * rtb_uDLookupTable_n) *
    LateralNormalLaw_rtP.Gain_Gain_b;
  if (u0 > LateralNormalLaw_rtP.Saturation1_UpperSat) {
    u0 = LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (u0 < LateralNormalLaw_rtP.Saturation1_LowerSat) {
    u0 = LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  if (rtb_Saturation2 > LateralNormalLaw_rtP.Saturation2_UpperSat) {
    rtb_Saturation2 = LateralNormalLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Saturation2 < LateralNormalLaw_rtP.Saturation2_LowerSat) {
    rtb_Saturation2 = LateralNormalLaw_rtP.Saturation2_LowerSat;
  }

  *rty_Out_zeta_deg = ((LateralNormalLaw_rtP.Constant_Value_b2 - Vias) * rtb_Saturation2 + u0 * Vias) + rtb_Saturation_f;
  rtb_Saturation_f = LateralNormalLaw_rtP.Gain1_Gain_b * *rtu_In_Phi_deg;
  rtb_Saturation2 = LateralNormalLaw_rtP.Gain1_Gain_c * *rtu_In_pk_deg_s;
  Vias = look1_binlxpw(*rtu_In_time_dt, LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_j,
                       LateralNormalLaw_rtP.ScheduledGain_Table_i, 4U);
  LateralNormalLaw_DWork.Delay_DSTATE_e = ((-(Vias_tmp / rtb_input_V_ias_kn * 122.0 * 320.40999999999997 * -0.487 /
    1.0E+6 + 1.414 * r) / L_xi * rtb_Saturation2 + k_phi * rtb_Saturation_f) + LateralNormalLaw_rtP.Gain1_Gain_n *
    rtb_Divide * -k_phi) * Vias * LateralNormalLaw_rtP.Gain_Gain_p;
  if (rtb_Y_i > LateralNormalLaw_rtP.Saturation1_UpperSat_e) {
    rtb_Y_i = LateralNormalLaw_rtP.Saturation1_UpperSat_e;
  } else if (rtb_Y_i < LateralNormalLaw_rtP.Saturation1_LowerSat_l) {
    rtb_Y_i = LateralNormalLaw_rtP.Saturation1_LowerSat_l;
  }

  if (rtb_Y_i > LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Saturation_f = LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (rtb_Y_i < LateralNormalLaw_rtP.Saturation_LowerSat_og) {
    rtb_Saturation_f = LateralNormalLaw_rtP.Saturation_LowerSat_og;
  } else {
    rtb_Saturation_f = rtb_Y_i;
  }

  if (LateralNormalLaw_DWork.Delay_DSTATE_e > LateralNormalLaw_rtP.Limiterxi_UpperSat) {
    k_phi = LateralNormalLaw_rtP.Limiterxi_UpperSat;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_e < LateralNormalLaw_rtP.Limiterxi_LowerSat) {
    k_phi = LateralNormalLaw_rtP.Limiterxi_LowerSat;
  } else {
    k_phi = LateralNormalLaw_DWork.Delay_DSTATE_e;
  }

  LateralNormalLaw_RateLimiter(k_phi * rtb_Saturation_f + (LateralNormalLaw_rtP.Constant_Value_l1 - rtb_Saturation_f) *
    rtb_Gain_b, LateralNormalLaw_rtP.RateLimiterVariableTs_up_d, LateralNormalLaw_rtP.RateLimiterVariableTs_lo_b,
    rtu_In_time_dt, LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_k, rty_Out_xi_deg,
    &LateralNormalLaw_DWork.sf_RateLimiter_j);
  LateralNormalLaw_DWork.Delay_DSTATE = rtb_Gain;
  LateralNormalLaw_DWork.icLoad = false;
}

LateralNormalLaw::LateralNormalLaw():
  LateralNormalLaw_DWork()
{
}

LateralNormalLaw::~LateralNormalLaw()
{
}
