#include "A380PitchAlternateLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T A380PitchAlternateLaw_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PitchAlternateLaw_IN_frozen{ 1U };

const uint8_T A380PitchAlternateLaw_IN_running{ 2U };

const uint8_T A380PitchAlternateLaw_IN_automatic{ 1U };

const uint8_T A380PitchAlternateLaw_IN_manual{ 2U };

const uint8_T A380PitchAlternateLaw_IN_reset{ 3U };

const uint8_T A380PitchAlternateLaw_IN_flight_clean{ 1U };

const uint8_T A380PitchAlternateLaw_IN_flight_flaps{ 2U };

const uint8_T A380PitchAlternateLaw_IN_ground{ 3U };

A380PitchAlternateLaw::Parameters_A380PitchAlternateLaw_T A380PitchAlternateLaw::A380PitchAlternateLaw_rtP{

  { 0.0, 1.0, 2.0, 3.0, 4.0, 5.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  0.3,

  5.0,

  0.3,

  5.0,

  0.3,

  5.0,

  1.0,

  1.0,

  1.0,

  1.0,

  1.0,

  1.0,

  1.0,

  1.0,

  1.0,

  1.0,

  0.0,

  2.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -30.0,


  { 0.3, 0.5, 0.8, 1.0, 1.0, 1.0 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },

  17.0,

  -0.5,

  -1.0,

  -0.5,

  -45.0,

  0.5,

  1.0,

  0.5,

  45.0,

  true,

  0.0,

  350.0,

  -0.1,

  0.0,


  { 180.0, 145.0, 130.0, 120.0, 120.0, 115.0 },


  { 0.0, 1.0, 2.0, 3.0, 4.0, 5.0 },

  -0.04,

  0.0,

  -30.0,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  100.0,

  0.1019367991845056,


  { 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0 },

  2000.0,

  100.0,

  0.51444444444444448,

  1.0,


  { 13.5, 13.5 },


  { 0.0, 350.0 },


  { 0.5, 0.5 },


  { 0.0, 350.0 },

  1.0,

  -1.0,

  0.06,

  1.0,

  -1.0,

  -30.0,

  30.0,

  -30.0,

  1.0,

  0.017453292519943295,

  100.0,

  0.1019367991845056,


  { 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0 },

  2000.0,

  100.0,

  0.51444444444444448,

  1.0,


  { -2.0, 0.0, 1.5 },


  { -1.0, 0.0, 1.0 },

  0.0,

  -0.5,

  0.82,

  0.5,

  0.0,

  33.0,

  -33.0,

  0.017453292519943295,


  { 13.5, 13.5 },


  { 0.0, 350.0 },


  { 0.5, 0.5 },


  { 0.0, 350.0 },

  1.0,

  -1.0,

  0.06,

  1.0,

  -1.0,

  -30.0,

  30.0,

  -30.0,

  1.0,

  0.017453292519943295,

  100.0,

  0.1019367991845056,


  { 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0 },

  2000.0,

  100.0,

  0.51444444444444448,

  1.0,


  { 13.5, 13.5 },


  { 0.0, 350.0 },


  { 0.5, 0.5 },


  { 0.0, 350.0 },

  1.0,

  -1.0,

  0.06,

  1.0,

  -1.0,

  -30.0,

  30.0,

  -30.0,

  0.0,

  0.076923076923076927,

  3.5,

  -11.0,

  false
};

void A380PitchAlternateLaw::A380PitchAlternateLaw_RateLimiter_Reset(rtDW_RateLimiter_A380PitchAlternateLaw_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PitchAlternateLaw::A380PitchAlternateLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T
  *rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PitchAlternateLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380PitchAlternateLaw::A380PitchAlternateLaw_LagFilter_Reset(rtDW_LagFilter_A380PitchAlternateLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PitchAlternateLaw::A380PitchAlternateLaw_LagFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T
  *rty_Y, rtDW_LagFilter_A380PitchAlternateLaw_T *localDW)
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

void A380PitchAlternateLaw::A380PitchAlternateLaw_WashoutFilter_Reset(rtDW_WashoutFilter_A380PitchAlternateLaw_T
  *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PitchAlternateLaw::A380PitchAlternateLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt,
  real_T *rty_Y, rtDW_WashoutFilter_A380PitchAlternateLaw_T *localDW)
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
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380PitchAlternateLaw::init(void)
{
  A380PitchAlternateLaw_DWork.Delay_DSTATE = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_k = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_d = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_kd =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_j = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_dy =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_e =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_g = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_l =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  A380PitchAlternateLaw_DWork.icLoad = true;
}

void A380PitchAlternateLaw::reset(void)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  A380PitchAlternateLaw_DWork.Delay_DSTATE = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_k = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_d = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_kd =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_j = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_dy =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_e =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_g = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_l =
    A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  A380PitchAlternateLaw_DWork.icLoad = true;
  A380PitchAlternateLaw_DWork.is_active_c9_A380PitchAlternateLaw = 0U;
  A380PitchAlternateLaw_DWork.is_c9_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_NO_ACTIVE_CHILD;
  rtb_nz_limit_up_g = 0.0;
  rtb_nz_limit_lo_g = 0.0;
  A380PitchAlternateLaw_DWork.is_active_c1_A380PitchAlternateLaw = 0U;
  A380PitchAlternateLaw_DWork.is_c1_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_NO_ACTIVE_CHILD;
  A380PitchAlternateLaw_RateLimiter_Reset(&A380PitchAlternateLaw_DWork.sf_RateLimiter);
  A380PitchAlternateLaw_LagFilter_Reset(&A380PitchAlternateLaw_DWork.sf_LagFilter_g3);
  A380PitchAlternateLaw_WashoutFilter_Reset(&A380PitchAlternateLaw_DWork.sf_WashoutFilter_c);
  A380PitchAlternateLaw_DWork.pY_not_empty = false;
  A380PitchAlternateLaw_LagFilter_Reset(&A380PitchAlternateLaw_DWork.sf_LagFilter);
  A380PitchAlternateLaw_WashoutFilter_Reset(&A380PitchAlternateLaw_DWork.sf_WashoutFilter);
  A380PitchAlternateLaw_RateLimiter_Reset(&A380PitchAlternateLaw_DWork.sf_RateLimiter_n);
  A380PitchAlternateLaw_LagFilter_Reset(&A380PitchAlternateLaw_DWork.sf_LagFilter_g);
  A380PitchAlternateLaw_WashoutFilter_Reset(&A380PitchAlternateLaw_DWork.sf_WashoutFilter_d);
  A380PitchAlternateLaw_RateLimiter_Reset(&A380PitchAlternateLaw_DWork.sf_RateLimiter_b);
  A380PitchAlternateLaw_DWork.is_active_c8_A380PitchAlternateLaw = 0U;
  A380PitchAlternateLaw_DWork.is_c8_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_NO_ACTIVE_CHILD;
}

void A380PitchAlternateLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_nz_g, const real_T *rtu_In_Theta_deg,
  const real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const real_T *rtu_In_eta_deg, const real_T
  *rtu_In_eta_trim_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_mach, const real_T *rtu_In_V_tas_kn, const
  real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const real_T *rtu_In_spoilers_right_pos,
  const real_T *rtu_In_delta_eta_pos, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_stabilities_available, real_T *rty_Out_eta_deg, real_T *rty_Out_eta_trim_dot_deg_s, real_T
  *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T rtb_TmpSignalConversionAtSFunctionInport1[3];
  real_T rtb_Bias_o;
  real_T rtb_Cos;
  real_T rtb_Divide;
  real_T rtb_Divide1_e;
  real_T rtb_Divide_c;
  real_T rtb_Divide_d;
  real_T rtb_Divide_i;
  real_T rtb_Divide_n;
  real_T rtb_Gain;
  real_T rtb_Gain1;
  real_T rtb_Gain5;
  real_T rtb_Gain_b;
  real_T rtb_Gain_m;
  real_T rtb_Product1_b;
  real_T rtb_Product1_d;
  real_T rtb_Product1_f;
  real_T rtb_Switch_c;
  real_T rtb_Switch_i;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T y;
  real_T y_0;
  int32_T tmp;
  boolean_T rtb_eta_trim_deg_should_freeze;
  if (A380PitchAlternateLaw_DWork.is_active_c9_A380PitchAlternateLaw == 0) {
    A380PitchAlternateLaw_DWork.is_active_c9_A380PitchAlternateLaw = 1U;
    A380PitchAlternateLaw_DWork.is_c9_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (A380PitchAlternateLaw_DWork.is_c9_A380PitchAlternateLaw == A380PitchAlternateLaw_IN_frozen) {
    if ((!A380PitchAlternateLaw_rtP.Constant_Value_m) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs
         (*rtu_In_Phi_deg) <= 30.0)) {
      A380PitchAlternateLaw_DWork.is_c9_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if (A380PitchAlternateLaw_rtP.Constant_Value_m || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs(*
               rtu_In_Phi_deg) > 30.0)) {
    A380PitchAlternateLaw_DWork.is_c9_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  rtb_Gain = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Divide = (rtb_Gain - A380PitchAlternateLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt;
  rtb_Gain1 = A380PitchAlternateLaw_rtP.Gain1_Gain_c * *rtu_In_Theta_deg;
  rtb_Cos = std::cos(rtb_Gain1);
  rtb_Gain1 = A380PitchAlternateLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg;
  rtb_Divide1_e = rtb_Cos / std::cos(rtb_Gain1);
  rtb_Gain1 = A380PitchAlternateLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s;
  rtb_Gain_m = *rtu_In_nz_g - rtb_Divide1_e;
  rtb_Switch_i = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.uDLookupTable_bp01Data_o,
    A380PitchAlternateLaw_rtP.uDLookupTable_tableData_e, 6U);
  rtb_Switch_c = *rtu_In_V_tas_kn;
  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.Saturation3_UpperSat) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.Saturation3_UpperSat;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.Saturation3_LowerSat) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.Saturation3_LowerSat;
  }

  rtb_Gain5 = A380PitchAlternateLaw_rtP.Gain5_Gain * rtb_Switch_c;
  if (A380PitchAlternateLaw_DWork.is_active_c1_A380PitchAlternateLaw == 0) {
    A380PitchAlternateLaw_DWork.is_active_c1_A380PitchAlternateLaw = 1U;
    A380PitchAlternateLaw_DWork.is_c1_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_ground;
    rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
    rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (A380PitchAlternateLaw_DWork.is_c1_A380PitchAlternateLaw) {
     case A380PitchAlternateLaw_IN_flight_clean:
      if (*rtu_In_flaps_handle_index != 0.0) {
        A380PitchAlternateLaw_DWork.is_c1_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_flight_flaps;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        A380PitchAlternateLaw_DWork.is_c1_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_ground;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;

     case A380PitchAlternateLaw_IN_flight_flaps:
      if (*rtu_In_flaps_handle_index == 0.0) {
        A380PitchAlternateLaw_DWork.is_c1_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.15;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.15;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else {
        A380PitchAlternateLaw_DWork.is_c1_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_ground;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;

     default:
      rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
      rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
      rtb_nz_limit_up_g = 2.0;
      rtb_nz_limit_lo_g = 0.0;
      break;
    }
  }

  A380PitchAlternateLaw_RateLimiter(rtb_nz_limit_up_g, A380PitchAlternateLaw_rtP.RateLimiterVariableTs2_up,
    A380PitchAlternateLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    A380PitchAlternateLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Switch_c,
    &A380PitchAlternateLaw_DWork.sf_RateLimiter);
  rtb_Switch_c = (A380PitchAlternateLaw_rtP.Gain_Gain_a * A380PitchAlternateLaw_rtP.Vm_currentms_Value * rtb_Gain1 +
                  rtb_Gain_m) - (rtb_Switch_i / rtb_Gain5 + A380PitchAlternateLaw_rtP.Bias_Bias) * (rtb_Switch_c -
    rtb_Divide1_e);
  rtb_Switch_i = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.PLUT_bp01Data,
    A380PitchAlternateLaw_rtP.PLUT_tableData, 1U);
  rtb_Product1_f = rtb_Switch_c * rtb_Switch_i;
  rtb_Switch_i = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.DLUT_bp01Data,
    A380PitchAlternateLaw_rtP.DLUT_tableData, 1U);
  rtb_Gain1 = rtb_Switch_c * rtb_Switch_i * A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Divide_c = (rtb_Gain1 - A380PitchAlternateLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt;
  rtb_Gain5 = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  rtb_Switch_c = A380PitchAlternateLaw_DWork.Delay_DSTATE_d;
  rtb_Divide_d = (rtb_Gain5 - A380PitchAlternateLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt;
  A380PitchAlternateLaw_LagFilter(rtb_Divide_d, A380PitchAlternateLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Switch_c,
    &A380PitchAlternateLaw_DWork.sf_LagFilter_g3);
  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationV_dot_LowerSat;
  }

  rtb_Divide_c = ((A380PitchAlternateLaw_rtP.Gain3_Gain * rtb_Divide + rtb_Product1_f) + rtb_Divide_c) +
    A380PitchAlternateLaw_rtP.Gain_Gain_j * rtb_Switch_c;
  rtb_Divide_d = std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos);
  A380PitchAlternateLaw_WashoutFilter(rtb_Divide_d, A380PitchAlternateLaw_rtP.WashoutFilter_C1, rtu_In_time_dt,
    &rtb_Switch_c, &A380PitchAlternateLaw_DWork.sf_WashoutFilter_c);
  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat) {
    y = A380PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat) {
    y = A380PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat;
  } else {
    y = rtb_Switch_c;
  }

  rtb_Divide = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  rtb_Divide_n = (rtb_Divide - A380PitchAlternateLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt;
  rtb_Product1_f = A380PitchAlternateLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s;
  rtb_Switch_c = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.uDLookupTable_bp01Data_b,
    A380PitchAlternateLaw_rtP.uDLookupTable_tableData_h, 6U);
  rtb_Product1_d = *rtu_In_V_tas_kn;
  if (rtb_Product1_d > A380PitchAlternateLaw_rtP.Saturation3_UpperSat_b) {
    rtb_Product1_d = A380PitchAlternateLaw_rtP.Saturation3_UpperSat_b;
  } else if (rtb_Product1_d < A380PitchAlternateLaw_rtP.Saturation3_LowerSat_e) {
    rtb_Product1_d = A380PitchAlternateLaw_rtP.Saturation3_LowerSat_e;
  }

  rtb_Bias_o = rtb_Switch_c / (A380PitchAlternateLaw_rtP.Gain5_Gain_e * rtb_Product1_d) +
    A380PitchAlternateLaw_rtP.Bias_Bias_f;
  if (!A380PitchAlternateLaw_DWork.pY_not_empty) {
    A380PitchAlternateLaw_DWork.pY = A380PitchAlternateLaw_rtP.RateLimiterVariableTs_InitialCondition;
    A380PitchAlternateLaw_DWork.pY_not_empty = true;
  }

  A380PitchAlternateLaw_DWork.pY += std::fmax(std::fmin(*rtu_In_delta_eta_pos - A380PitchAlternateLaw_DWork.pY, std::abs
    (A380PitchAlternateLaw_rtP.RateLimiterVariableTs_up) * *rtu_In_time_dt), -std::abs
    (A380PitchAlternateLaw_rtP.RateLimiterVariableTs_lo) * *rtu_In_time_dt);
  if (*rtu_In_stabilities_available) {
    rtb_Switch_c = look1_binlxpw(*rtu_In_flaps_handle_index, A380PitchAlternateLaw_rtP.uDLookupTable_bp01Data,
      A380PitchAlternateLaw_rtP.uDLookupTable_tableData, 5U);
    rtb_Switch_c -= *rtu_In_V_ias_kn;
    rtb_Switch_i = A380PitchAlternateLaw_rtP.Gain1_Gain * rtb_Switch_c;
  } else {
    rtb_Switch_i = A380PitchAlternateLaw_rtP.Constant_Value_n;
  }

  rtb_Switch_c = *rtu_In_V_ias_kn * A380PitchAlternateLaw_rtP.Constant6_Value / *rtu_In_mach;
  if (*rtu_In_stabilities_available) {
    rtb_Switch_c = std::fmin(A380PitchAlternateLaw_rtP.Constant5_Value, rtb_Switch_c) - *rtu_In_V_ias_kn;
    rtb_Switch_c *= A380PitchAlternateLaw_rtP.Gain2_Gain;
  } else {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.Constant3_Value;
  }

  rtb_Product1_d = *rtu_In_Phi_deg;
  if (rtb_Switch_i > A380PitchAlternateLaw_rtP.Saturation_UpperSat_m) {
    rtb_Switch_i = A380PitchAlternateLaw_rtP.Saturation_UpperSat_m;
  } else if (rtb_Switch_i < A380PitchAlternateLaw_rtP.Saturation_LowerSat_e) {
    rtb_Switch_i = A380PitchAlternateLaw_rtP.Saturation_LowerSat_e;
  }

  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.Saturation1_UpperSat) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.Saturation1_LowerSat) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.Saturation1_LowerSat;
  }

  if (rtb_Product1_d > A380PitchAlternateLaw_rtP.Saturation_UpperSat_f) {
    rtb_Product1_d = A380PitchAlternateLaw_rtP.Saturation_UpperSat_f;
  } else if (rtb_Product1_d < A380PitchAlternateLaw_rtP.Saturation_LowerSat_o) {
    rtb_Product1_d = A380PitchAlternateLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Switch_c = (A380PitchAlternateLaw_rtP.Gain_Gain_b * A380PitchAlternateLaw_rtP.Vm_currentms_Value_h *
                  rtb_Product1_f + rtb_Gain_m) - ((((look1_binlxpw(A380PitchAlternateLaw_DWork.pY,
    A380PitchAlternateLaw_rtP.Loaddemand_bp01Data, A380PitchAlternateLaw_rtP.Loaddemand_tableData, 2U) + rtb_Switch_i) +
    rtb_Switch_c) + rtb_Cos / std::cos(A380PitchAlternateLaw_rtP.Gain1_Gain_lm * rtb_Product1_d)) - rtb_Divide1_e) *
    rtb_Bias_o;
  rtb_Switch_i = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.PLUT_bp01Data_f,
    A380PitchAlternateLaw_rtP.PLUT_tableData_k, 1U);
  rtb_Product1_d = rtb_Switch_c * rtb_Switch_i;
  rtb_Switch_i = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.DLUT_bp01Data_m,
    A380PitchAlternateLaw_rtP.DLUT_tableData_a, 1U);
  rtb_Cos = rtb_Switch_c * rtb_Switch_i * A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_Switch_i = (rtb_Cos - A380PitchAlternateLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Product1_f = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  rtb_Switch_c = A380PitchAlternateLaw_DWork.Delay_DSTATE_dy;
  rtb_Bias_o = (rtb_Product1_f - A380PitchAlternateLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt;
  A380PitchAlternateLaw_LagFilter(rtb_Bias_o, A380PitchAlternateLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Switch_c,
    &A380PitchAlternateLaw_DWork.sf_LagFilter);
  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_b) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_m) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_m;
  }

  rtb_Bias_o = ((A380PitchAlternateLaw_rtP.Gain3_Gain_c * rtb_Divide_n + rtb_Product1_d) + rtb_Switch_i) +
    A380PitchAlternateLaw_rtP.Gain_Gain_f * rtb_Switch_c;
  A380PitchAlternateLaw_WashoutFilter(rtb_Divide_d, A380PitchAlternateLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt,
    &rtb_Switch_c, &A380PitchAlternateLaw_DWork.sf_WashoutFilter);
  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_o) {
    y_0 = A380PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j) {
    y_0 = A380PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j;
  } else {
    y_0 = rtb_Switch_c;
  }

  rtb_Divide_n = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  rtb_Divide_i = (rtb_Divide_n - A380PitchAlternateLaw_DWork.Delay_DSTATE_e) / *rtu_In_time_dt;
  rtb_Switch_i = A380PitchAlternateLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s;
  rtb_Switch_c = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.uDLookupTable_bp01Data_a,
    A380PitchAlternateLaw_rtP.uDLookupTable_tableData_p, 6U);
  rtb_Product1_d = *rtu_In_V_tas_kn;
  if (rtb_Product1_d > A380PitchAlternateLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Product1_d = A380PitchAlternateLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_Product1_d < A380PitchAlternateLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Product1_d = A380PitchAlternateLaw_rtP.Saturation3_LowerSat_a;
  }

  rtb_Product1_d = rtb_Switch_c / (A380PitchAlternateLaw_rtP.Gain5_Gain_n * rtb_Product1_d) +
    A380PitchAlternateLaw_rtP.Bias_Bias_a;
  A380PitchAlternateLaw_RateLimiter(rtb_nz_limit_lo_g, A380PitchAlternateLaw_rtP.RateLimiterVariableTs3_up,
    A380PitchAlternateLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    A380PitchAlternateLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Switch_c,
    &A380PitchAlternateLaw_DWork.sf_RateLimiter_n);
  rtb_Switch_c = (A380PitchAlternateLaw_rtP.Gain_Gain_p * A380PitchAlternateLaw_rtP.Vm_currentms_Value_p * rtb_Switch_i
                  + rtb_Gain_m) - (rtb_Switch_c - rtb_Divide1_e) * rtb_Product1_d;
  rtb_Switch_i = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.PLUT_bp01Data_a,
    A380PitchAlternateLaw_rtP.PLUT_tableData_o, 1U);
  rtb_Product1_b = rtb_Switch_c * rtb_Switch_i;
  rtb_Switch_i = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchAlternateLaw_rtP.DLUT_bp01Data_k,
    A380PitchAlternateLaw_rtP.DLUT_tableData_e, 1U);
  rtb_Divide1_e = rtb_Switch_c * rtb_Switch_i * A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Switch_i = (rtb_Divide1_e - A380PitchAlternateLaw_DWork.Delay_DSTATE_g) / *rtu_In_time_dt;
  rtb_Gain_m = A380PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  rtb_Switch_c = A380PitchAlternateLaw_DWork.Delay_DSTATE_l;
  rtb_Product1_d = (rtb_Gain_m - A380PitchAlternateLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt;
  A380PitchAlternateLaw_LagFilter(rtb_Product1_d, A380PitchAlternateLaw_rtP.LagFilter_C1_l, rtu_In_time_dt,
    &rtb_Switch_c, &A380PitchAlternateLaw_DWork.sf_LagFilter_g);
  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e;
  }

  rtb_Gain_b = A380PitchAlternateLaw_rtP.Gain_Gain_k * rtb_Switch_c;
  A380PitchAlternateLaw_WashoutFilter(rtb_Divide_d, A380PitchAlternateLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt,
    &rtb_Switch_c, &A380PitchAlternateLaw_DWork.sf_WashoutFilter_d);
  rtb_Product1_d = A380PitchAlternateLaw_rtP.Gain1_Gain_p * y + rtb_Divide_c;
  if (rtb_Product1_d > A380PitchAlternateLaw_rtP.Saturation_UpperSat) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = A380PitchAlternateLaw_rtP.Saturation_UpperSat;
  } else if (rtb_Product1_d < A380PitchAlternateLaw_rtP.Saturation_LowerSat) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = A380PitchAlternateLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = rtb_Product1_d;
  }

  rtb_Product1_d = A380PitchAlternateLaw_rtP.Gain1_Gain_h * y_0 + rtb_Bias_o;
  if (rtb_Product1_d > A380PitchAlternateLaw_rtP.Saturation_UpperSat_k) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = A380PitchAlternateLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_Product1_d < A380PitchAlternateLaw_rtP.Saturation_LowerSat_p) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = A380PitchAlternateLaw_rtP.Saturation_LowerSat_p;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = rtb_Product1_d;
  }

  if (rtb_Switch_c > A380PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Switch_c < A380PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Product1_d = (((A380PitchAlternateLaw_rtP.Gain3_Gain_b * rtb_Divide_i + rtb_Product1_b) + rtb_Switch_i) +
                    rtb_Gain_b) + A380PitchAlternateLaw_rtP.Gain1_Gain_ov * rtb_Switch_c;
  if (rtb_Product1_d > A380PitchAlternateLaw_rtP.Saturation_UpperSat_j) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = A380PitchAlternateLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Product1_d < A380PitchAlternateLaw_rtP.Saturation_LowerSat_d) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = A380PitchAlternateLaw_rtP.Saturation_LowerSat_d;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = rtb_Product1_d;
  }

  rtb_Switch_c = look1_binlxpw(*rtu_In_flaps_handle_index,
    A380PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1, A380PitchAlternateLaw_rtP.ScheduledGain_Table, 5U);
  if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[1]) {
    if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      tmp = 1;
    } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      tmp = 2;
    } else {
      tmp = 0;
    }
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    tmp = 0;
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    tmp = 2;
  } else {
    tmp = 1;
  }

  rtb_Divide_c = rtb_TmpSignalConversionAtSFunctionInport1[tmp] * rtb_Switch_c;
  rtb_Switch_c = look1_binlxpw(*rtu_In_time_dt, A380PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1_d,
    A380PitchAlternateLaw_rtP.ScheduledGain_Table_h, 4U);
  rtb_Switch_c = rtb_Divide_c * rtb_Switch_c * A380PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain *
    *rtu_In_time_dt;
  if (A380PitchAlternateLaw_rtP.Switch_Threshold < 0.0) {
    rtb_Switch_i = *rtu_In_eta_deg;
  } else {
    rtb_Switch_i = A380PitchAlternateLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  }

  A380PitchAlternateLaw_DWork.Delay_DSTATE_o = rtb_Switch_i - rtb_Switch_c;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_o += rtb_Switch_c;
  if (A380PitchAlternateLaw_DWork.Delay_DSTATE_o > A380PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit)
  {
    A380PitchAlternateLaw_DWork.Delay_DSTATE_o = A380PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380PitchAlternateLaw_DWork.Delay_DSTATE_o <
             A380PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380PitchAlternateLaw_DWork.Delay_DSTATE_o = A380PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_eta_trim_deg_should_freeze == A380PitchAlternateLaw_rtP.CompareToConstant_const) {
    rtb_Switch_c = A380PitchAlternateLaw_rtP.Constant_Value;
  } else {
    rtb_Switch_c = A380PitchAlternateLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Switch_c *= A380PitchAlternateLaw_rtP.Gain_Gain_c;
  if (rtb_Switch_c > rtb_eta_trim_deg_rate_limit_up_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_up_deg_s;
  } else if (rtb_Switch_c < rtb_eta_trim_deg_rate_limit_lo_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_lo_deg_s;
  } else {
    *rty_Out_eta_trim_dot_deg_s = rtb_Switch_c;
  }

  A380PitchAlternateLaw_RateLimiter(A380PitchAlternateLaw_DWork.Delay_DSTATE_o,
    A380PitchAlternateLaw_rtP.RateLimitereta_up, A380PitchAlternateLaw_rtP.RateLimitereta_lo, rtu_In_time_dt,
    A380PitchAlternateLaw_rtP.RateLimitereta_InitialCondition, rty_Out_eta_deg,
    &A380PitchAlternateLaw_DWork.sf_RateLimiter_b);
  *rty_Out_eta_trim_limit_up = A380PitchAlternateLaw_rtP.Constant2_Value;
  *rty_Out_eta_trim_limit_lo = A380PitchAlternateLaw_rtP.Constant3_Value_j;
  if (A380PitchAlternateLaw_DWork.is_active_c8_A380PitchAlternateLaw == 0) {
    A380PitchAlternateLaw_DWork.is_active_c8_A380PitchAlternateLaw = 1U;
    A380PitchAlternateLaw_DWork.is_c8_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_manual;
  } else {
    switch (A380PitchAlternateLaw_DWork.is_c8_A380PitchAlternateLaw) {
     case A380PitchAlternateLaw_IN_automatic:
      A380PitchAlternateLaw_DWork.is_c8_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_reset;
      break;

     case A380PitchAlternateLaw_IN_manual:
      break;

     case A380PitchAlternateLaw_IN_reset:
      if (*rtu_In_eta_trim_deg == 0.0) {
        A380PitchAlternateLaw_DWork.is_c8_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_manual;
      }
      break;

     default:
      if (!*rtu_In_tracking_mode_on) {
        A380PitchAlternateLaw_DWork.is_c8_A380PitchAlternateLaw = A380PitchAlternateLaw_IN_automatic;
      }
      break;
    }
  }

  A380PitchAlternateLaw_DWork.Delay_DSTATE = rtb_Gain;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_k = rtb_Gain1;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_d = rtb_Gain5;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_kd = rtb_Divide;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_j = rtb_Cos;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_dy = rtb_Product1_f;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_e = rtb_Divide_n;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_g = rtb_Divide1_e;
  A380PitchAlternateLaw_DWork.Delay_DSTATE_l = rtb_Gain_m;
  A380PitchAlternateLaw_DWork.icLoad = false;
}

A380PitchAlternateLaw::A380PitchAlternateLaw():
  A380PitchAlternateLaw_DWork()
{
}

A380PitchAlternateLaw::~A380PitchAlternateLaw() = default;
