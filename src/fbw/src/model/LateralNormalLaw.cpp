#include "LateralNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T LateralNormalLaw_IN_FlightMode{ 1U };

const uint8_T LateralNormalLaw_IN_GroundMode{ 2U };

LateralNormalLaw::Parameters_LateralNormalLaw_T LateralNormalLaw::LateralNormalLaw_rtP{

  { 0.0, 0.06, 0.1, 0.2, 1.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },

  1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -67.0,


  { 1.1, 1.0, 0.6, 0.3, 0.1 },


  { 4.5, 4.5, 4.5, 3.5, 2.0, 1.5, 1.5 },


  { 1.4, 1.4, 1.4, 1.2, 1.0, 0.8, 0.8 },

  67.0,

  -2.0,

  -15.0,

  -50.0,

  -2.0,

  -5.0,

  2.0,

  15.0,

  50.0,

  2.0,

  5.0,


  { 20.0, 15.0, 0.0, -15.0, -20.0 },


  { -50.0, -40.0, 0.0, 40.0, 50.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -66.0, -45.0, -33.0, 0.0, 33.0, 45.0, 66.0, 90.0 },


  { 20.0, 20.0, 15.0, 0.0, 0.0, 0.0, -15.0, -20.0, -20.0 },


  { -90.0, -71.0, -66.0, -33.0, 0.0, 33.0, 66.0, 71.0, 90.0 },

  -25.0,

  1.0,

  0.0,

  15.0,

  15.0,

  -15.0,

  0.0,

  67.0,

  -67.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  25.0,

  -25.0,

  9.81,

  0.017453292519943295,

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

  0.0,

  1.0
};

void LateralNormalLaw::LateralNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_LateralNormalLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void LateralNormalLaw::init(void)
{
  LateralNormalLaw_DWork.Delay_DSTATE = LateralNormalLaw_rtP.Delay_InitialCondition;
  LateralNormalLaw_DWork.icLoad = true;
}

void LateralNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg,
  const real_T *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_V_ias_kn, const real_T
  *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft, const real_T *rtu_In_delta_xi_pos, const real_T
  *rtu_In_delta_zeta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, real_T *rty_Out_xi_deg, real_T
  *rty_Out_zeta_deg)
{
  static const int16_T b[4]{ 0, 120, 320, 400 };

  static const int16_T b_0[4]{ 0, 120, 150, 380 };

  static const int8_T c[4]{ 1, 2, 3, 3 };

  static const int8_T c_0[4]{ -15, -15, -15, -2 };

  real_T L_xi;
  real_T Vias;
  real_T dynamic_pressure;
  real_T k_phi;
  real_T omega_0;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_tas_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_zeta_pos;
  real_T rtb_Product1_a;
  real_T rtb_Product1_k;
  real_T rtb_Product_l;
  real_T rtb_Sum;
  real_T rtb_Y_h;
  real_T rtb_Y_i;
  real_T rtb_time_dt;
  real_T v_cas_ms;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int32_T rtb_in_flight;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on;
  rtb_time_dt = *rtu_In_time_dt;
  rtb_Product_l = *rtu_In_Theta_deg;
  rtb_Y_h = *rtu_In_Phi_deg;
  rtb_Product1_k = *rtu_In_r_deg_s;
  rtb_Product1_a = *rtu_In_pk_deg_s;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn = *rtu_In_V_ias_kn;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_tas_kn = *rtu_In_V_tas_kn;
  rtb_Y_i = *rtu_In_H_radio_ft;
  Vias = *rtu_In_delta_xi_pos;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_zeta_pos = *rtu_In_delta_zeta_pos;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground = *rtu_In_on_ground;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on = *rtu_In_tracking_mode_on;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active =
    *rtu_In_high_aoa_prot_active;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active =
    *rtu_In_high_speed_prot_active;
  if (LateralNormalLaw_DWork.is_active_c5_LateralNormalLaw == 0U) {
    LateralNormalLaw_DWork.is_active_c5_LateralNormalLaw = 1U;
    LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_GroundMode;
    rtb_in_flight = 0;
  } else if (LateralNormalLaw_DWork.is_c5_LateralNormalLaw == LateralNormalLaw_IN_FlightMode) {
    if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground) {
      LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_GroundMode;
      rtb_in_flight = 0;
    } else {
      rtb_in_flight = 1;
    }
  } else if (((!rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground) && (rtb_Product_l > 8.0))
             || (rtb_Y_i > 400.0)) {
    LateralNormalLaw_DWork.is_c5_LateralNormalLaw = LateralNormalLaw_IN_FlightMode;
    rtb_in_flight = 1;
  } else {
    rtb_in_flight = 0;
  }

  if (rtb_in_flight > LateralNormalLaw_rtP.Saturation_UpperSat) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation_UpperSat;
  } else if (rtb_in_flight < LateralNormalLaw_rtP.Saturation_LowerSat) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Sum = rtb_in_flight;
  }

  LateralNormalLaw_RateLimiter(rtb_Sum, LateralNormalLaw_rtP.RateLimiterVariableTs_up,
    LateralNormalLaw_rtP.RateLimiterVariableTs_lo, rtb_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i, &LateralNormalLaw_DWork.sf_RateLimiter);
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active) {
    rtb_Sum = look1_binlxpw(rtb_Y_h, LateralNormalLaw_rtP.BankAngleProtection2_bp01Data,
      LateralNormalLaw_rtP.BankAngleProtection2_tableData, 4U);
  } else if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active) {
    rtb_Sum = look1_binlxpw(rtb_Y_h, LateralNormalLaw_rtP.BankAngleProtection_bp01Data,
      LateralNormalLaw_rtP.BankAngleProtection_tableData, 8U);
  } else {
    rtb_Sum = look1_binlxpw(rtb_Y_h, LateralNormalLaw_rtP.BankAngleProtection1_bp01Data,
      LateralNormalLaw_rtP.BankAngleProtection1_tableData, 8U);
  }

  omega_0 = 15.0;
  v_cas_ms = -15.0;
  if (LateralNormalLaw_DWork.Delay_DSTATE >= 25.0) {
    v_cas_ms = rtb_Product1_a;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE <= -25.0) {
    omega_0 = rtb_Product1_a;
  }

  rtb_Sum += LateralNormalLaw_rtP.Gain1_Gain * Vias;
  if (rtb_Sum > LateralNormalLaw_rtP.Saturation_UpperSat_a) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Sum < LateralNormalLaw_rtP.Saturation_LowerSat_o) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Sum = std::fmin(omega_0, std::fmax(v_cas_ms, rtb_Sum * rtb_Y_i)) *
    LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * rtb_time_dt;
  LateralNormalLaw_DWork.icLoad = ((rtb_Y_i == 0.0) ||
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on ||
    LateralNormalLaw_DWork.icLoad);
  if (LateralNormalLaw_DWork.icLoad) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = rtb_Y_h - rtb_Sum;
  }

  LateralNormalLaw_DWork.Delay_DSTATE_d += rtb_Sum;
  if (LateralNormalLaw_DWork.Delay_DSTATE_d > LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_d < LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    LateralNormalLaw_DWork.Delay_DSTATE_d = LateralNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (LateralNormalLaw_DWork.Delay_DSTATE_d > LateralNormalLaw_rtP.Saturation_UpperSat_g) {
    omega_0 = LateralNormalLaw_rtP.Saturation_UpperSat_g;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE_d < LateralNormalLaw_rtP.Saturation_LowerSat_e) {
    omega_0 = LateralNormalLaw_rtP.Saturation_LowerSat_e;
  } else {
    omega_0 = LateralNormalLaw_DWork.Delay_DSTATE_d;
  }

  LateralNormalLaw_RateLimiter(omega_0, LateralNormalLaw_rtP.RateLimiterVariableTs_up_m,
    LateralNormalLaw_rtP.RateLimiterVariableTs_lo_k, rtb_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Sum, &LateralNormalLaw_DWork.sf_RateLimiter_n);
  v_cas_ms = std::fmax(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn, 80.0) * 0.5144;
  dynamic_pressure = v_cas_ms * v_cas_ms * 0.6125;
  L_xi = dynamic_pressure * 122.0 * 17.9 * -0.090320788790706555 / 1.0E+6;
  omega_0 = 0.0;
  if ((rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn <= 400.0) &&
      (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn >= 0.0)) {
    rtb_in_flight = 4;
    low_i = 0;
    low_ip1 = 2;
    while (rtb_in_flight > low_ip1) {
      mid_i = ((low_i + rtb_in_flight) + 1) >> 1;
      if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn >= b[mid_i - 1]) {
        low_i = mid_i - 1;
        low_ip1 = mid_i + 1;
      } else {
        rtb_in_flight = mid_i;
      }
    }

    omega_0 = (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn - static_cast<real_T>
               (b[low_i])) / static_cast<real_T>(b[low_i + 1] - b[low_i]);
    if (omega_0 == 0.0) {
      omega_0 = c[low_i];
    } else if (omega_0 == 1.0) {
      omega_0 = c[low_i + 1];
    } else if (c[low_i + 1] == c[low_i]) {
      omega_0 = c[low_i];
    } else {
      omega_0 = (1.0 - omega_0) * static_cast<real_T>(c[low_i]) + static_cast<real_T>(c[low_i + 1]) * omega_0;
    }
  }

  k_phi = -(omega_0 * omega_0) / L_xi;
  LateralNormalLaw_DWork.Delay_DSTATE = ((-(dynamic_pressure / v_cas_ms * 122.0 * 320.40999999999997 * -0.487 / 1.0E+6 +
    1.414 * omega_0) / L_xi * (LateralNormalLaw_rtP.Gain1_Gain_c * rtb_Product1_a) + LateralNormalLaw_rtP.Gain1_Gain_b *
    rtb_Y_h * k_phi) + LateralNormalLaw_rtP.Gain1_Gain_n * rtb_Sum * -k_phi) * look1_binlxpw(rtb_time_dt,
    LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1, LateralNormalLaw_rtP.ScheduledGain_Table, 4U) *
    LateralNormalLaw_rtP.Gain_Gain_p;
  if (LateralNormalLaw_DWork.Delay_DSTATE > LateralNormalLaw_rtP.Limiterxi_UpperSat) {
    rtb_Product1_a = LateralNormalLaw_rtP.Limiterxi_UpperSat;
  } else if (LateralNormalLaw_DWork.Delay_DSTATE < LateralNormalLaw_rtP.Limiterxi_LowerSat) {
    rtb_Product1_a = LateralNormalLaw_rtP.Limiterxi_LowerSat;
  } else {
    rtb_Product1_a = LateralNormalLaw_DWork.Delay_DSTATE;
  }

  LateralNormalLaw_RateLimiter(rtb_Product1_a, LateralNormalLaw_rtP.RateLimiterVariableTs_up_d,
    LateralNormalLaw_rtP.RateLimiterVariableTs_lo_b, rtb_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_k, &rtb_Y_h, &LateralNormalLaw_DWork.sf_RateLimiter_j);
  if (!LateralNormalLaw_DWork.pY_not_empty) {
    LateralNormalLaw_DWork.pY = LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition;
    LateralNormalLaw_DWork.pY_not_empty = true;
  }

  LateralNormalLaw_DWork.pY += std::fmax(std::fmin(static_cast<real_T>
    (!rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground) - LateralNormalLaw_DWork.pY, std::
    abs(LateralNormalLaw_rtP.RateLimiterVariableTs1_up) * rtb_time_dt), -std::abs
    (LateralNormalLaw_rtP.RateLimiterVariableTs1_lo) * rtb_time_dt);
  if (LateralNormalLaw_DWork.pY > LateralNormalLaw_rtP.Saturation_UpperSat_n) {
    rtb_Product1_a = LateralNormalLaw_rtP.Saturation_UpperSat_n;
  } else if (LateralNormalLaw_DWork.pY < LateralNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Product1_a = LateralNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Product1_a = LateralNormalLaw_DWork.pY;
  }

  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_tas_kn >
      LateralNormalLaw_rtP.Saturation_UpperSat_e) {
    omega_0 = LateralNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_tas_kn <
             LateralNormalLaw_rtP.Saturation_LowerSat_j) {
    omega_0 = LateralNormalLaw_rtP.Saturation_LowerSat_j;
  } else {
    omega_0 = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_tas_kn;
  }

  rtb_Sum = (rtb_Product1_k - std::sin(LateralNormalLaw_rtP.Gain1_Gain_f * rtb_Sum) *
             LateralNormalLaw_rtP.Constant2_Value * std::cos(LateralNormalLaw_rtP.Gain1_Gain_l * rtb_Product_l) /
             (LateralNormalLaw_rtP.Gain6_Gain * omega_0) * LateralNormalLaw_rtP.Gain_Gain_i) * look1_binlxpw
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_tas_kn,
     LateralNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_a, LateralNormalLaw_rtP.ScheduledGain_Table_e, 6U);
  if (rtb_Sum > LateralNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Sum < LateralNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation1_LowerSat;
  }

  rtb_Product_l = rtb_Sum * rtb_Product1_a;
  rtb_Sum = rtb_Product1_k * look1_binlxpw(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_tas_kn,
    LateralNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1, LateralNormalLaw_rtP.ScheduledGain1_Table, 6U);
  if (rtb_Sum > LateralNormalLaw_rtP.Saturation2_UpperSat) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Sum < LateralNormalLaw_rtP.Saturation2_LowerSat) {
    rtb_Sum = LateralNormalLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Product1_k = (LateralNormalLaw_rtP.Constant_Value - rtb_Product1_a) * rtb_Sum;
  if (rtb_Y_i > LateralNormalLaw_rtP.Saturation1_UpperSat_e) {
    rtb_Y_i = LateralNormalLaw_rtP.Saturation1_UpperSat_e;
  } else if (rtb_Y_i < LateralNormalLaw_rtP.Saturation1_LowerSat_l) {
    rtb_Y_i = LateralNormalLaw_rtP.Saturation1_LowerSat_l;
  }

  if (rtb_Y_i > LateralNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Product1_a = LateralNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (rtb_Y_i < LateralNormalLaw_rtP.Saturation_LowerSat_og) {
    rtb_Product1_a = LateralNormalLaw_rtP.Saturation_LowerSat_og;
  } else {
    rtb_Product1_a = rtb_Y_i;
  }

  *rty_Out_xi_deg = (LateralNormalLaw_rtP.Constant_Value_l - rtb_Product1_a) * (LateralNormalLaw_rtP.Gain_Gain * Vias) +
    rtb_Y_h * rtb_Product1_a;
  *rty_Out_zeta_deg = rtb_Product_l + rtb_Product1_k;
  Vias = std::fmax(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn, 60.0);
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn = 0.0;
  if (Vias <= 380.0) {
    rtb_in_flight = 4;
    low_i = 1;
    low_ip1 = 2;
    while (rtb_in_flight > low_ip1) {
      mid_i = (low_i + rtb_in_flight) >> 1;
      if (Vias >= b_0[mid_i - 1]) {
        low_i = mid_i;
        low_ip1 = mid_i + 1;
      } else {
        rtb_in_flight = mid_i;
      }
    }

    omega_0 = (Vias - static_cast<real_T>(b_0[low_i - 1])) / static_cast<real_T>(b_0[low_i] - b_0[low_i - 1]);
    if (omega_0 == 0.0) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn = -15.0;
    } else if (omega_0 == 1.0) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn = c_0[low_i];
    } else if (c_0[low_i] == -15) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn = -15.0;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn = (1.0 - omega_0) * -15.0 + omega_0 *
        static_cast<real_T>(c_0[low_i]);
    }
  }

  Vias *= 0.5144;
  LateralNormalLaw_RateLimiter(0.814 / std::sqrt(1.3734E+6 / (149.45000000000002 * (Vias * Vias))) *
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_V_ias_kn *
     rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_zeta_pos),
    LateralNormalLaw_rtP.RateLimiterVariableTs1_up_p, LateralNormalLaw_rtP.RateLimiterVariableTs1_lo_c, rtb_time_dt,
    LateralNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_o, &rtb_Y_i, &LateralNormalLaw_DWork.sf_RateLimiter_d);
  LateralNormalLaw_DWork.icLoad = false;
}

LateralNormalLaw::LateralNormalLaw():
  LateralNormalLaw_DWork()
{
}

LateralNormalLaw::~LateralNormalLaw()
{
}
