#include "LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T LateralNormalLaw_IN_FlightMode{ 1U };

const uint8_T LateralNormalLaw_IN_GroundMode{ 2U };

const uint8_T LateralNormalLaw_IN_NO_ACTIVE_CHILD{ 0U };

LateralNormalLaw::Parameters_LateralNormalLaw_T LateralNormalLaw::LateralNormalLaw_rtP{

  { 0.0, 0.06, 0.1, 0.2, 1.0 },


  { 0.0, 40.0, 100.0, 180.0 },

  1.0,

  1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -67.0,


  { 1.1, 1.0, 0.6, 0.3, 0.1 },


  { 0.0, 0.0, 1.4, 1.4 },

  67.0,

  -2.0,

  -5.0,

  -2.0,

  -50.0,

  -2.0,

  2.0,

  5.0,

  2.0,

  50.0,

  2.0,


  { 20.0, 15.0, 0.0, -15.0, -20.0 },


  { -50.0, -40.0, 0.0, 40.0, 50.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -66.0, -45.0, -33.0, 0.0, 33.0, 45.0, 66.0, 90.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -71.0, -66.0, -33.0, 0.0, 33.0, 66.0, 71.0, 90.0 },

  0.0,

  1.0,

  0.0,

  -25.0,

  0.0,

  0.0,

  1.0,

  0.0,

  1.0,

  0.0,

  1.0,

  0.0,

  15.0,

  15.0,

  -15.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  25.0,

  -25.0,

  0.017453292519943295,

  9.81,

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

void LateralNormalLaw::init(void)
{
  LateralNormalLaw_DWork.Delay_DSTATE = LateralNormalLaw_rtP.Delay_InitialCondition;
  LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  LateralNormalLaw_DWork.icLoad = true;
}

void LateralNormalLaw::reset(void)
{
  LateralNormalLaw_DWork.Delay_DSTATE = LateralNormalLaw_rtP.Delay_InitialCondition;
  LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  LateralNormalLaw_DWork.icLoad = true;
  LateralNormalLaw_DWork.is_active_c5_LateralNormalLaw = 0U;
  LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_NO_ACTIVE_CHILD;
  LateralNormalLaw_RateLimiter_Reset(&LateralNormalLaw_DWork.sf_RateLimiter);
  LateralNormalLaw_RateLimiter_Reset(&LateralNormalLaw_DWork.sf_RateLimiter_d);
  LateralNormalLaw_DWork.pY_not_empty = false;
  LateralNormalLaw_RateLimiter_Reset(&LateralNormalLaw_DWork.sf_RateLimiter_j);
  LateralNormalLaw_DWork.pY_not_empty_j = false;
}

void LateralNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg,
  const real_T *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_V_ias_kn, const real_T
  *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft, const real_T *rtu_In_delta_xi_pos, const real_T
  *rtu_In_delta_zeta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_ap_phi_c_deg, const
  real_T *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_xi_deg, real_T *rty_Out_zeta_deg)
{
  real_T L_xi;
  real_T Vias;
  real_T dynamic_pressure_tmp;
  real_T k_phi;
  real_T omega_0;
  real_T r;
  real_T rtb_Divide;
  real_T rtb_Gain1_f;
  real_T rtb_Limiterxi;
  real_T rtb_Product_f;
  real_T rtb_Y_du;
  real_T rtb_Y_i;
  real_T v_cas_ms_tmp;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int32_T rtb_in_flight;
  int16_T r_tmp;
  boolean_T rtb_OR;
  static const int16_T b[4]{ 0, 120, 150, 380 };

  static const int8_T c[4]{ -15, -15, -15, -2 };

  static const int16_T b_0[5]{ -1, 0, 120, 320, 400 };

  static const real_T c_0[5]{ 1.0, 1.0, 1.2, 2.0, 2.0 };

  if (LateralNormalLaw_DWork.is_active_c5_LateralNormalLaw == 0) {
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

  if (rtb_in_flight > LateralNormalLaw_rtP.Saturation_UpperSat) {
    rtb_Limiterxi = LateralNormalLaw_rtP.Saturation_UpperSat;
  } else if (rtb_in_flight < LateralNormalLaw_rtP.Saturation_LowerSat) {
    rtb_Limiterxi = LateralNormalLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Limiterxi = rtb_in_flight;
  }

  LateralNormalLaw_RateLimiter(rtb_Limiterxi, LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_du, &LateralNormalLaw_DWork.sf_RateLimiter);
  rtb_Limiterxi = LateralNormalLaw_rtP.Gain_Gain * *rtu_In_delta_xi_pos;
  r = *rtu_In_V_ias_kn;
  rtb_Product_f = *rtu_In_delta_zeta_pos;
  Vias = std::fmax(r, 60.0);
  r = 0.0;
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

  Vias *= 0.5144;
  LateralNormalLaw_RateLimiter(0.814 / std::sqrt(1.3734E+6 / (149.45000000000002 * (Vias * Vias))) * (r * rtb_Product_f),
    LateralNormalLaw_rtP.RateLimiterVariableTs1_up, LateralNormalLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_i, &LateralNormalLaw_DWork.sf_RateLimiter_d);
  if (!LateralNormalLaw_DWork.pY_not_empty) {
    LateralNormalLaw_DWork.pY = LateralNormalLaw_rtP.APEngagedRateLimiter_InitialCondition;
    LateralNormalLaw_DWork.pY_not_empty = true;
  }

  LateralNormalLaw_DWork.pY += std::fmax(std::fmin(static_cast<real_T>(*rtu_In_any_ap_engaged) -
    LateralNormalLaw_DWork.pY, std::abs(LateralNormalLaw_rtP.APEngagedRateLimiter_up) * *rtu_In_time_dt), -std::abs
    (LateralNormalLaw_rtP.APEngagedRateLimiter_lo) * *rtu_In_time_dt);
  Vias = rtb_Y_du + LateralNormalLaw_DWork.pY;
  if (Vias > LateralNormalLaw_rtP.Saturation1_UpperSat) {
    Vias = LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (Vias < LateralNormalLaw_rtP.Saturation1_LowerSat) {
    Vias = LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  if (Vias > LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    Vias = LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (Vias < LateralNormalLaw_rtP.Saturation_LowerSat_o) {
    Vias = LateralNormalLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Y_i = (LateralNormalLaw_rtP.Constant_Value_l1 - Vias) * rtb_Limiterxi;
  v_cas_ms_tmp = std::fmax(*rtu_In_V_ias_kn, 80.0);
  v_cas_ms_tmp *= 0.5144;
  dynamic_pressure_tmp = v_cas_ms_tmp * v_cas_ms_tmp * 0.6125;
  rtb_Product_f = dynamic_pressure_tmp * 122.0 * 17.9;
  L_xi = rtb_Product_f * -0.090320788790706555 / 1.0E+6;
  if (*rtu_In_V_ias_kn > 400.0) {
    omega_0 = 2.0;
  } else if (*rtu_In_V_ias_kn < -1.0) {
    omega_0 = 1.0;
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
      omega_0 = c_0[low_i];
    } else if (r == 1.0) {
      omega_0 = c_0[low_i + 1];
    } else {
      rtb_Limiterxi = c_0[low_i + 1];
      if (rtb_Limiterxi == c_0[low_i]) {
        omega_0 = c_0[low_i];
      } else {
        omega_0 = (1.0 - r) * c_0[low_i] + rtb_Limiterxi * r;
      }
    }
  }

  k_phi = -(omega_0 * omega_0) / L_xi;
  rtb_Limiterxi = LateralNormalLaw_rtP.Gain1_Gain * *rtu_In_delta_xi_pos;
  r = LateralNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain * rtb_Limiterxi;
  rtb_Divide = (r - LateralNormalLaw_DWork.Delay_DSTATE_o) / *rtu_In_time_dt;
  if (*rtu_In_high_speed_prot_active) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = look1_binlxpw(*rtu_In_Phi_deg,
      LateralNormalLaw_rtP.BankAngleProtection2_bp01Data, LateralNormalLaw_rtP.BankAngleProtection2_tableData, 4U);
  } else if (*rtu_In_high_aoa_prot_active) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = look1_binlxpw(*rtu_In_Phi_deg,
      LateralNormalLaw_rtP.BankAngleProtection_bp01Data, LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    LateralNormalLaw_DWork.Delay_DSTATE_o = look1_binlxpw(*rtu_In_Phi_deg,
      LateralNormalLaw_rtP.BankAngleProtection1_bp01Data, LateralNormalLaw_rtP.BankAngleProtection1_tableData, 8U);
  }

  LateralNormalLaw_DWork.Delay_DSTATE_o += 1.0 / omega_0 * rtb_Divide + rtb_Limiterxi;
  if (LateralNormalLaw_DWork.Delay_DSTATE_o > LateralNormalLaw_rtP.Saturation_UpperSat_a) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_o < LateralNormalLaw_rtP.Saturation_LowerSat_ov) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation_LowerSat_ov;
  }

  rtb_Limiterxi = 15.0;
  rtb_Divide = -15.0;
  if (LateralNormalLaw_DWork.Delay_DSTATE >= 25.0) {
    rtb_Divide = *rtu_In_pk_deg_s;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE <= -25.0) {
    rtb_Limiterxi = *rtu_In_pk_deg_s;
  }

  LateralNormalLaw_DWork.Delay_DSTATE_o = std::fmin(rtb_Limiterxi, std::fmax(rtb_Divide,
    LateralNormalLaw_DWork.Delay_DSTATE_o * rtb_Y_du)) * LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain *
    *rtu_In_time_dt;
  rtb_OR = ((rtb_Y_du == 0.0) || (*rtu_In_tracking_mode_on) || (*rtu_In_any_ap_engaged));
  rtb_Y_du = *rtu_In_Phi_deg - LateralNormalLaw_DWork.Delay_DSTATE_o;
  LateralNormalLaw_DWork.icLoad = (rtb_OR || LateralNormalLaw_DWork.icLoad);
  if (LateralNormalLaw_DWork.icLoad) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = rtb_Y_du;
  }

  LateralNormalLaw_DWork.Delay_DSTATE_o += LateralNormalLaw_DWork.Delay_DSTATE_d;
  if (LateralNormalLaw_DWork.Delay_DSTATE_o > LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_o < LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  } else {
    LateralNormalLaw_DWork.Delay_DSTATE_d = LateralNormalLaw_DWork.Delay_DSTATE_o;
  }

  if (*rtu_In_any_ap_engaged) {
    if (*rtu_In_tracking_mode_on) {
      LateralNormalLaw_DWork.Delay_DSTATE_o = *rtu_In_Phi_deg;
    } else {
      LateralNormalLaw_DWork.Delay_DSTATE_o = *rtu_In_ap_phi_c_deg;
    }
  } else {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_DWork.Delay_DSTATE_d;
  }

  rtb_Divide = LateralNormalLaw_rtP.Gain1_Gain_b * *rtu_In_Phi_deg;
  rtb_Gain1_f = LateralNormalLaw_rtP.Gain1_Gain_c * *rtu_In_pk_deg_s;
  rtb_Limiterxi = look1_binlxpw(*rtu_In_time_dt, LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    LateralNormalLaw_rtP.ScheduledGain_Table, 4U);
  rtb_Y_du = dynamic_pressure_tmp / v_cas_ms_tmp * 122.0 * 320.40999999999997;
  LateralNormalLaw_DWork.Delay_DSTATE = ((-(rtb_Y_du * -0.487 / 1.0E+6 + 1.414 * omega_0) / L_xi * rtb_Gain1_f + k_phi *
    rtb_Divide) + LateralNormalLaw_rtP.Gain1_Gain_n * LateralNormalLaw_DWork.Delay_DSTATE_o * -k_phi) * rtb_Limiterxi *
    LateralNormalLaw_rtP.Gain_Gain_p;
  if (LateralNormalLaw_DWork.Delay_DSTATE > LateralNormalLaw_rtP.Limiterxi_UpperSat) {
    rtb_Limiterxi = LateralNormalLaw_rtP.Limiterxi_UpperSat;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE < LateralNormalLaw_rtP.Limiterxi_LowerSat) {
    rtb_Limiterxi = LateralNormalLaw_rtP.Limiterxi_LowerSat;
  } else {
    rtb_Limiterxi = LateralNormalLaw_DWork.Delay_DSTATE;
  }

  LateralNormalLaw_RateLimiter(rtb_Limiterxi * Vias + rtb_Y_i, LateralNormalLaw_rtP.RateLimiterVariableTs_up_d,
    LateralNormalLaw_rtP.RateLimiterVariableTs_lo_b, rtu_In_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_k, rty_Out_xi_deg,
    &LateralNormalLaw_DWork.sf_RateLimiter_j);
  rtb_Limiterxi = std::sin(LateralNormalLaw_rtP.Gain1_Gain_j * LateralNormalLaw_DWork.Delay_DSTATE_o);
  Vias = LateralNormalLaw_rtP.Gain1_Gain_p * *rtu_In_Theta_deg;
  LateralNormalLaw_DWork.Delay_DSTATE_o = *rtu_In_V_tas_kn;
  if (LateralNormalLaw_DWork.Delay_DSTATE_o > LateralNormalLaw_rtP.Saturation_UpperSat_c) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_o < LateralNormalLaw_rtP.Saturation_LowerSat_i) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation_LowerSat_i;
  }

  rtb_Limiterxi = *rtu_In_r_deg_s - LateralNormalLaw_rtP.Constant2_Value * rtb_Limiterxi * std::cos(Vias) /
    (LateralNormalLaw_rtP.Gain6_Gain * LateralNormalLaw_DWork.Delay_DSTATE_o) * LateralNormalLaw_rtP.Gain_Gain_g;
  LateralNormalLaw_DWork.Delay_DSTATE_o = -(std::sqrt(rtb_Product_f * 0.0035255650890285459 / 4.47E+6) * 1.414 +
    rtb_Y_du * -0.10100220381291185 / 4.47E+6) / (rtb_Product_f * -0.018936822384138473 / 4.47E+6) *
    (LateralNormalLaw_rtP.Gain1_Gain_k * rtb_Limiterxi) * LateralNormalLaw_rtP.Gain_Gain_b;
  if (LateralNormalLaw_DWork.Delay_DSTATE_o > LateralNormalLaw_rtP.Saturation1_UpperSat_c) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation1_UpperSat_c;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_o < LateralNormalLaw_rtP.Saturation1_LowerSat_p) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation1_LowerSat_p;
  }

  rtb_OR = !*rtu_In_on_ground;
  if (!LateralNormalLaw_DWork.pY_not_empty_j) {
    LateralNormalLaw_DWork.pY_b = LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_m;
    LateralNormalLaw_DWork.pY_not_empty_j = true;
  }

  LateralNormalLaw_DWork.pY_b += std::fmax(std::fmin(static_cast<real_T>(rtb_OR) - LateralNormalLaw_DWork.pY_b, std::abs
    (LateralNormalLaw_rtP.RateLimiterVariableTs1_up_o) * *rtu_In_time_dt), -std::abs
    (LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_m) * *rtu_In_time_dt);
  if (LateralNormalLaw_DWork.pY_b > LateralNormalLaw_rtP.Saturation_UpperSat_j) {
    Vias = LateralNormalLaw_rtP.Saturation_UpperSat_j;
  } else if (LateralNormalLaw_DWork.pY_b < LateralNormalLaw_rtP.Saturation_LowerSat_n) {
    Vias = LateralNormalLaw_rtP.Saturation_LowerSat_n;
  } else {
    Vias = LateralNormalLaw_DWork.pY_b;
  }

  rtb_Product_f = LateralNormalLaw_DWork.Delay_DSTATE_o * Vias;
  LateralNormalLaw_DWork.Delay_DSTATE_o = look1_binlxpw(*rtu_In_V_ias_kn,
    LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1, LateralNormalLaw_rtP.ScheduledGain1_Table, 3U);
  LateralNormalLaw_DWork.Delay_DSTATE_o *= *rtu_In_r_deg_s;
  if (LateralNormalLaw_DWork.Delay_DSTATE_o > LateralNormalLaw_rtP.Saturation2_UpperSat) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation2_UpperSat;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_o < LateralNormalLaw_rtP.Saturation2_LowerSat) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Y_du = (LateralNormalLaw_rtP.Constant_Value_b - Vias) * LateralNormalLaw_DWork.Delay_DSTATE_o;
  if (*rtu_In_any_ap_engaged) {
    LateralNormalLaw_DWork.Delay_DSTATE_o = *rtu_In_ap_beta_c_deg;
  } else {
    LateralNormalLaw_DWork.Delay_DSTATE_o = LateralNormalLaw_rtP.Constant_Value;
  }

  *rty_Out_zeta_deg = (rtb_Product_f + rtb_Y_du) + LateralNormalLaw_DWork.Delay_DSTATE_o;
  LateralNormalLaw_DWork.Delay_DSTATE_o = r;
  LateralNormalLaw_DWork.icLoad = false;
}

LateralNormalLaw::LateralNormalLaw():
  LateralNormalLaw_DWork()
{
}

LateralNormalLaw::~LateralNormalLaw() = default;
