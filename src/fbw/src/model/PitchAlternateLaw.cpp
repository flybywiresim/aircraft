#include "PitchAlternateLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T PitchAlternateLaw_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T PitchAlternateLaw_IN_frozen{ 1U };

const uint8_T PitchAlternateLaw_IN_running{ 2U };

const uint8_T PitchAlternateLaw_IN_automatic{ 1U };

const uint8_T PitchAlternateLaw_IN_manual{ 2U };

const uint8_T PitchAlternateLaw_IN_reset{ 3U };

const uint8_T PitchAlternateLaw_IN_tracking{ 4U };

const uint8_T PitchAlternateLaw_IN_flight_clean{ 1U };

const uint8_T PitchAlternateLaw_IN_flight_flaps{ 2U };

const uint8_T PitchAlternateLaw_IN_ground{ 3U };

PitchAlternateLaw::Parameters_PitchAlternateLaw_T PitchAlternateLaw::PitchAlternateLaw_rtP{

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

  1.0,

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

  0.0,

  0.0,

  -30.0,


  { 1.0, 1.0, 0.5, 0.3, 0.3 },

  30.0,

  -0.5,

  -1.0,

  -0.5,

  -45.0,

  0.5,

  1.0,

  0.5,

  45.0,

  true,

  -11.0,

  0.0,

  350.0,

  -0.1,

  0.0,


  { 180.0, 145.0, 130.0, 120.0, 120.0, 115.0 },


  { 0.0, 1.0, 2.0, 3.0, 4.0, 5.0 },

  -0.04,

  0.0,

  0.017453292519943295,

  0.017453292519943295,


  { 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 350.0, 400.0 },

  2000.0,

  100.0,

  0.51444444444444448,

  1.0,

  0.017453292519943295,

  100.0,

  0.1019367991845056,


  { 13.5, 13.5 },


  { 0.0, 350.0 },

  1.0,


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

  0.076923076923076927,

  3.5,

  false,

  true
};

void PitchAlternateLaw::PitchAlternateLaw_RateLimiter_Reset(rtDW_RateLimiter_PitchAlternateLaw_T *localDW)
{
  localDW->pY_not_empty = false;
}

void PitchAlternateLaw::PitchAlternateLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchAlternateLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void PitchAlternateLaw::PitchAlternateLaw_LagFilter_Reset(rtDW_LagFilter_PitchAlternateLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void PitchAlternateLaw::PitchAlternateLaw_LagFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_PitchAlternateLaw_T *localDW)
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

void PitchAlternateLaw::PitchAlternateLaw_WashoutFilter_Reset(rtDW_WashoutFilter_PitchAlternateLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void PitchAlternateLaw::PitchAlternateLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_PitchAlternateLaw_T *localDW)
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

void PitchAlternateLaw::init(void)
{
  PitchAlternateLaw_DWork.Delay_DSTATE = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_k = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_d = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_kd = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  PitchAlternateLaw_DWork.Delay_DSTATE_j = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  PitchAlternateLaw_DWork.Delay_DSTATE_dy = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchAlternateLaw_DWork.Delay_DSTATE_e = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_g = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_l = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchAlternateLaw_DWork.icLoad = true;
  PitchAlternateLaw_DWork.icLoad_p = true;
  PitchAlternateLaw_DWork.Delay_DSTATE_aa = PitchAlternateLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition;
}

void PitchAlternateLaw::reset(void)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  PitchAlternateLaw_DWork.Delay_DSTATE = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_k = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_d = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_kd = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  PitchAlternateLaw_DWork.Delay_DSTATE_j = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  PitchAlternateLaw_DWork.Delay_DSTATE_dy = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchAlternateLaw_DWork.Delay_DSTATE_e = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_g = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_l = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchAlternateLaw_DWork.icLoad = true;
  PitchAlternateLaw_DWork.icLoad_p = true;
  PitchAlternateLaw_DWork.Delay_DSTATE_aa = PitchAlternateLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition;
  PitchAlternateLaw_DWork.is_active_c9_PitchAlternateLaw = 0U;
  PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_NO_ACTIVE_CHILD;
  PitchAlternateLaw_DWork.is_active_c8_PitchAlternateLaw = 0U;
  PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_NO_ACTIVE_CHILD;
  PitchAlternateLaw_DWork.is_active_c7_PitchAlternateLaw = 0U;
  PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_NO_ACTIVE_CHILD;
  rtb_nz_limit_up_g = 0.0;
  rtb_nz_limit_lo_g = 0.0;
  PitchAlternateLaw_RateLimiter_Reset(&PitchAlternateLaw_DWork.sf_RateLimiter);
  PitchAlternateLaw_LagFilter_Reset(&PitchAlternateLaw_DWork.sf_LagFilter_g3);
  PitchAlternateLaw_WashoutFilter_Reset(&PitchAlternateLaw_DWork.sf_WashoutFilter_c);
  PitchAlternateLaw_DWork.pY_not_empty = false;
  PitchAlternateLaw_LagFilter_Reset(&PitchAlternateLaw_DWork.sf_LagFilter);
  PitchAlternateLaw_WashoutFilter_Reset(&PitchAlternateLaw_DWork.sf_WashoutFilter);
  PitchAlternateLaw_RateLimiter_Reset(&PitchAlternateLaw_DWork.sf_RateLimiter_n);
  PitchAlternateLaw_LagFilter_Reset(&PitchAlternateLaw_DWork.sf_LagFilter_g);
  PitchAlternateLaw_WashoutFilter_Reset(&PitchAlternateLaw_DWork.sf_WashoutFilter_d);
  PitchAlternateLaw_RateLimiter_Reset(&PitchAlternateLaw_DWork.sf_RateLimiter_b);
}

void PitchAlternateLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_nz_g, const real_T *rtu_In_Theta_deg,
  const real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const real_T *rtu_In_eta_deg, const real_T
  *rtu_In_eta_trim_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_mach, const real_T *rtu_In_V_tas_kn, const
  real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const real_T *rtu_In_spoilers_right_pos,
  const real_T *rtu_In_delta_eta_pos, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_stabilities_available, real_T *rty_Out_eta_deg, real_T *rty_Out_eta_trim_deg)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T rtb_TmpSignalConversionAtSFunctionInport1[3];
  real_T rtb_Bias_o;
  real_T rtb_Cos;
  real_T rtb_Delay_c;
  real_T rtb_Divide;
  real_T rtb_Divide_c;
  real_T rtb_Divide_d;
  real_T rtb_Divide_i;
  real_T rtb_Divide_n;
  real_T rtb_Gain1;
  real_T rtb_Gain1_mr;
  real_T rtb_Gain_j;
  real_T rtb_Gain_m;
  real_T rtb_Gain_ny;
  real_T rtb_Minup;
  real_T rtb_Product1_d;
  real_T rtb_Product1_f;
  real_T rtb_Sum1_h;
  real_T rtb_Tsxlo;
  real_T rtb_Y_g;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T rtb_eta_trim_deg_reset_deg;
  real_T y;
  int32_T rtb_TmpSignalConversionAtSFunct;
  boolean_T rtb_eta_trim_deg_reset;
  boolean_T rtb_eta_trim_deg_should_freeze;
  if (PitchAlternateLaw_DWork.is_active_c9_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c9_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw == PitchAlternateLaw_IN_frozen) {
    if ((!PitchAlternateLaw_rtP.Constant_Value_m) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs
         (*rtu_In_Phi_deg) <= 30.0)) {
      PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if (PitchAlternateLaw_rtP.Constant_Value_m || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs
              (*rtu_In_Phi_deg) > 30.0)) {
    PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  if (PitchAlternateLaw_DWork.is_active_c8_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c8_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_manual;
    rtb_eta_trim_deg_reset = true;
    rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
  } else {
    switch (PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_automatic:
      if (!PitchAlternateLaw_rtP.Constant1_Value) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_reset;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      } else if (*rtu_In_tracking_mode_on) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_tracking;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = false;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      }
      break;

     case PitchAlternateLaw_IN_manual:
      if (PitchAlternateLaw_rtP.Constant1_Value) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      }
      break;

     case PitchAlternateLaw_IN_reset:
      if ((!PitchAlternateLaw_rtP.Constant1_Value) && (*rtu_In_eta_trim_deg == 0.0)) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_manual;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      }
      break;

     default:
      if (!*rtu_In_tracking_mode_on) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      }
      break;
    }
  }

  if (PitchAlternateLaw_DWork.is_active_c7_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c7_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_ground;
    rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
    rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_flight_clean:
      if (*rtu_In_flaps_handle_index != 0.0) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_flight_flaps;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else if (!PitchAlternateLaw_rtP.Constant1_Value) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_ground;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      }
      break;

     case PitchAlternateLaw_IN_flight_flaps:
      if (*rtu_In_flaps_handle_index == 0.0) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (!PitchAlternateLaw_rtP.Constant1_Value) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_ground;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;

     default:
      if (PitchAlternateLaw_rtP.Constant1_Value && (*rtu_In_flaps_handle_index == 0.0)) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (PitchAlternateLaw_rtP.Constant1_Value && (*rtu_In_flaps_handle_index != 0.0)) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_flight_flaps;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;
    }
  }

  PitchAlternateLaw_RateLimiter(rtb_nz_limit_up_g, PitchAlternateLaw_rtP.RateLimiterVariableTs2_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y_g, &PitchAlternateLaw_DWork.sf_RateLimiter);
  rtb_Gain1 = PitchAlternateLaw_rtP.Gain1_Gain_c * *rtu_In_Theta_deg;
  rtb_Cos = std::cos(rtb_Gain1);
  rtb_Gain1 = PitchAlternateLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg;
  rtb_Tsxlo = rtb_Cos / std::cos(rtb_Gain1);
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.uDLookupTable_bp01Data_o,
    PitchAlternateLaw_rtP.uDLookupTable_tableData_e, 6U);
  rtb_Product1_d = *rtu_In_V_tas_kn;
  rtb_Gain1 = PitchAlternateLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s;
  rtb_Gain_ny = *rtu_In_nz_g - rtb_Tsxlo;
  if (rtb_Product1_d > PitchAlternateLaw_rtP.Saturation3_UpperSat) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation3_UpperSat;
  } else if (rtb_Product1_d < PitchAlternateLaw_rtP.Saturation3_LowerSat) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation3_LowerSat;
  }

  rtb_Delay_c = (PitchAlternateLaw_rtP.Gain_Gain * PitchAlternateLaw_rtP.Vm_currentms_Value * rtb_Gain1 + rtb_Gain_ny) -
    (rtb_Minup / (PitchAlternateLaw_rtP.Gain5_Gain * rtb_Product1_d) + PitchAlternateLaw_rtP.Bias_Bias) * (rtb_Y_g -
    rtb_Tsxlo);
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.PLUT_bp01Data, PitchAlternateLaw_rtP.PLUT_tableData,
    1U);
  rtb_Product1_f = rtb_Delay_c * rtb_Minup;
  rtb_Y_g = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Divide = (rtb_Y_g - PitchAlternateLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.DLUT_bp01Data, PitchAlternateLaw_rtP.DLUT_tableData,
    1U);
  rtb_Gain1 = rtb_Delay_c * rtb_Minup * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Divide_c = (rtb_Gain1 - PitchAlternateLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt;
  rtb_Gain_j = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  rtb_Delay_c = PitchAlternateLaw_DWork.Delay_DSTATE_d;
  rtb_Divide_d = (rtb_Gain_j - PitchAlternateLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt;
  PitchAlternateLaw_LagFilter(rtb_Divide_d, PitchAlternateLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_LagFilter_g3);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat;
  }

  rtb_Divide = ((PitchAlternateLaw_rtP.Gain3_Gain * rtb_Divide + rtb_Product1_f) + rtb_Divide_c) +
    PitchAlternateLaw_rtP.Gain_Gain_j * rtb_Delay_c;
  rtb_Divide_c = std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos);
  PitchAlternateLaw_WashoutFilter(rtb_Divide_c, PitchAlternateLaw_rtP.WashoutFilter_C1, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_WashoutFilter_c);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat) {
    rtb_Divide_d = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat) {
    rtb_Divide_d = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat;
  } else {
    rtb_Divide_d = rtb_Delay_c;
  }

  rtb_Product1_f = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  rtb_Divide_n = (rtb_Product1_f - PitchAlternateLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt;
  rtb_Gain1_mr = PitchAlternateLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s;
  rtb_Delay_c = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.uDLookupTable_bp01Data_b,
    PitchAlternateLaw_rtP.uDLookupTable_tableData_h, 6U);
  rtb_Product1_d = *rtu_In_V_tas_kn;
  if (rtb_Product1_d > PitchAlternateLaw_rtP.Saturation3_UpperSat_b) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation3_UpperSat_b;
  } else if (rtb_Product1_d < PitchAlternateLaw_rtP.Saturation3_LowerSat_e) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation3_LowerSat_e;
  }

  rtb_Bias_o = rtb_Delay_c / (PitchAlternateLaw_rtP.Gain5_Gain_e * rtb_Product1_d) + PitchAlternateLaw_rtP.Bias_Bias_f;
  if (!PitchAlternateLaw_DWork.pY_not_empty) {
    PitchAlternateLaw_DWork.pY = PitchAlternateLaw_rtP.RateLimiterVariableTs_InitialCondition;
    PitchAlternateLaw_DWork.pY_not_empty = true;
  }

  PitchAlternateLaw_DWork.pY += std::fmax(std::fmin(*rtu_In_delta_eta_pos - PitchAlternateLaw_DWork.pY, std::abs
    (PitchAlternateLaw_rtP.RateLimiterVariableTs_up) * *rtu_In_time_dt), -std::abs
    (PitchAlternateLaw_rtP.RateLimiterVariableTs_lo) * *rtu_In_time_dt);
  if (*rtu_In_stabilities_available) {
    rtb_Delay_c = look1_binlxpw(*rtu_In_flaps_handle_index, PitchAlternateLaw_rtP.uDLookupTable_bp01Data,
      PitchAlternateLaw_rtP.uDLookupTable_tableData, 5U);
    rtb_Delay_c -= *rtu_In_V_ias_kn;
    rtb_Minup = PitchAlternateLaw_rtP.Gain1_Gain * rtb_Delay_c;
  } else {
    rtb_Minup = PitchAlternateLaw_rtP.Constant_Value_n;
  }

  rtb_Delay_c = *rtu_In_V_ias_kn * PitchAlternateLaw_rtP.Constant6_Value / *rtu_In_mach;
  if (*rtu_In_stabilities_available) {
    rtb_Delay_c = std::fmin(PitchAlternateLaw_rtP.Constant5_Value, rtb_Delay_c) - *rtu_In_V_ias_kn;
    rtb_Delay_c *= PitchAlternateLaw_rtP.Gain2_Gain;
  } else {
    rtb_Delay_c = PitchAlternateLaw_rtP.Constant3_Value_i;
  }

  rtb_Product1_d = *rtu_In_Phi_deg;
  if (rtb_Minup > PitchAlternateLaw_rtP.Saturation_UpperSat_m) {
    rtb_Minup = PitchAlternateLaw_rtP.Saturation_UpperSat_m;
  } else if (rtb_Minup < PitchAlternateLaw_rtP.Saturation_LowerSat_e) {
    rtb_Minup = PitchAlternateLaw_rtP.Saturation_LowerSat_e;
  }

  if (rtb_Delay_c > PitchAlternateLaw_rtP.Saturation1_UpperSat) {
    rtb_Delay_c = PitchAlternateLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.Saturation1_LowerSat) {
    rtb_Delay_c = PitchAlternateLaw_rtP.Saturation1_LowerSat;
  }

  if (rtb_Product1_d > PitchAlternateLaw_rtP.Saturation_UpperSat_f) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation_UpperSat_f;
  } else if (rtb_Product1_d < PitchAlternateLaw_rtP.Saturation_LowerSat_o) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Delay_c = (PitchAlternateLaw_rtP.Gain_Gain_b * PitchAlternateLaw_rtP.Vm_currentms_Value_h * rtb_Gain1_mr +
                 rtb_Gain_ny) - ((((look1_binlxpw(PitchAlternateLaw_DWork.pY, PitchAlternateLaw_rtP.Loaddemand_bp01Data,
    PitchAlternateLaw_rtP.Loaddemand_tableData, 2U) + rtb_Minup) + rtb_Delay_c) + rtb_Cos / std::cos
    (PitchAlternateLaw_rtP.Gain1_Gain_lm * rtb_Product1_d)) - rtb_Tsxlo) * rtb_Bias_o;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.PLUT_bp01Data_f,
    PitchAlternateLaw_rtP.PLUT_tableData_k, 1U);
  rtb_Product1_d = rtb_Delay_c * rtb_Minup;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.DLUT_bp01Data_m,
    PitchAlternateLaw_rtP.DLUT_tableData_a, 1U);
  rtb_Cos = rtb_Delay_c * rtb_Minup * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_Minup = (rtb_Cos - PitchAlternateLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Gain1_mr = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  rtb_Delay_c = PitchAlternateLaw_DWork.Delay_DSTATE_dy;
  rtb_Bias_o = (rtb_Gain1_mr - PitchAlternateLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt;
  PitchAlternateLaw_LagFilter(rtb_Bias_o, PitchAlternateLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_LagFilter);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_b) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_m) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_m;
  }

  rtb_Sum1_h = ((PitchAlternateLaw_rtP.Gain3_Gain_c * rtb_Divide_n + rtb_Product1_d) + rtb_Minup) +
    PitchAlternateLaw_rtP.Gain_Gain_f * rtb_Delay_c;
  PitchAlternateLaw_WashoutFilter(rtb_Divide_c, PitchAlternateLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_WashoutFilter);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_o) {
    y = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j) {
    y = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j;
  } else {
    y = rtb_Delay_c;
  }

  rtb_Divide_n = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  rtb_Divide_i = (rtb_Divide_n - PitchAlternateLaw_DWork.Delay_DSTATE_e) / *rtu_In_time_dt;
  rtb_Minup = PitchAlternateLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s;
  rtb_Delay_c = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.uDLookupTable_bp01Data_a,
    PitchAlternateLaw_rtP.uDLookupTable_tableData_p, 6U);
  rtb_Product1_d = *rtu_In_V_tas_kn;
  if (rtb_Product1_d > PitchAlternateLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_Product1_d < PitchAlternateLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Product1_d = PitchAlternateLaw_rtP.Saturation3_LowerSat_a;
  }

  rtb_Product1_d = rtb_Delay_c / (PitchAlternateLaw_rtP.Gain5_Gain_n * rtb_Product1_d) +
    PitchAlternateLaw_rtP.Bias_Bias_a;
  PitchAlternateLaw_RateLimiter(rtb_nz_limit_lo_g, PitchAlternateLaw_rtP.RateLimiterVariableTs3_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_RateLimiter_n);
  rtb_Delay_c = (PitchAlternateLaw_rtP.Gain_Gain_p * PitchAlternateLaw_rtP.Vm_currentms_Value_p * rtb_Minup +
                 rtb_Gain_ny) - (rtb_Delay_c - rtb_Tsxlo) * rtb_Product1_d;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.PLUT_bp01Data_a,
    PitchAlternateLaw_rtP.PLUT_tableData_o, 1U);
  rtb_Tsxlo = rtb_Delay_c * rtb_Minup;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.DLUT_bp01Data_k,
    PitchAlternateLaw_rtP.DLUT_tableData_e, 1U);
  rtb_Gain_ny = rtb_Delay_c * rtb_Minup * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Minup = (rtb_Gain_ny - PitchAlternateLaw_DWork.Delay_DSTATE_g) / *rtu_In_time_dt;
  rtb_Bias_o = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  rtb_Delay_c = PitchAlternateLaw_DWork.Delay_DSTATE_l;
  rtb_Product1_d = (rtb_Bias_o - PitchAlternateLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt;
  PitchAlternateLaw_LagFilter(rtb_Product1_d, PitchAlternateLaw_rtP.LagFilter_C1_l, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_LagFilter_g);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e;
  }

  rtb_Gain_m = PitchAlternateLaw_rtP.Gain_Gain_k * rtb_Delay_c;
  PitchAlternateLaw_WashoutFilter(rtb_Divide_c, PitchAlternateLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_WashoutFilter_d);
  rtb_Product1_d = PitchAlternateLaw_rtP.Gain1_Gain_p * rtb_Divide_d + rtb_Divide;
  if (rtb_Product1_d > PitchAlternateLaw_rtP.Saturation_UpperSat) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = PitchAlternateLaw_rtP.Saturation_UpperSat;
  } else if (rtb_Product1_d < PitchAlternateLaw_rtP.Saturation_LowerSat) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = PitchAlternateLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = rtb_Product1_d;
  }

  rtb_Product1_d = PitchAlternateLaw_rtP.Gain1_Gain_h * y + rtb_Sum1_h;
  if (rtb_Product1_d > PitchAlternateLaw_rtP.Saturation_UpperSat_k) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = PitchAlternateLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_Product1_d < PitchAlternateLaw_rtP.Saturation_LowerSat_p) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = PitchAlternateLaw_rtP.Saturation_LowerSat_p;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = rtb_Product1_d;
  }

  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Product1_d = (((PitchAlternateLaw_rtP.Gain3_Gain_b * rtb_Divide_i + rtb_Tsxlo) + rtb_Minup) + rtb_Gain_m) +
    PitchAlternateLaw_rtP.Gain1_Gain_ov * rtb_Delay_c;
  if (rtb_Product1_d > PitchAlternateLaw_rtP.Saturation_UpperSat_j) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = PitchAlternateLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Product1_d < PitchAlternateLaw_rtP.Saturation_LowerSat_d) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = PitchAlternateLaw_rtP.Saturation_LowerSat_d;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = rtb_Product1_d;
  }

  rtb_Delay_c = look1_binlxpw(*rtu_In_time_dt, PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    PitchAlternateLaw_rtP.ScheduledGain_Table, 4U);
  if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[1]) {
    if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      rtb_TmpSignalConversionAtSFunct = 1;
    } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      rtb_TmpSignalConversionAtSFunct = 2;
    } else {
      rtb_TmpSignalConversionAtSFunct = 0;
    }
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    rtb_TmpSignalConversionAtSFunct = 0;
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    rtb_TmpSignalConversionAtSFunct = 2;
  } else {
    rtb_TmpSignalConversionAtSFunct = 1;
  }

  rtb_Delay_c = rtb_TmpSignalConversionAtSFunctionInport1[rtb_TmpSignalConversionAtSFunct] * rtb_Delay_c *
    PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  rtb_Tsxlo = *rtu_In_eta_deg - rtb_Delay_c;
  PitchAlternateLaw_DWork.icLoad = ((*rtu_In_tracking_mode_on) || PitchAlternateLaw_DWork.icLoad);
  if (PitchAlternateLaw_DWork.icLoad) {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = rtb_Tsxlo;
  }

  PitchAlternateLaw_DWork.Delay_DSTATE_o += rtb_Delay_c;
  if (PitchAlternateLaw_DWork.Delay_DSTATE_o > PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (PitchAlternateLaw_DWork.Delay_DSTATE_o < PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit)
  {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_eta_trim_deg_should_freeze == PitchAlternateLaw_rtP.CompareToConstant_const) {
    rtb_Tsxlo = PitchAlternateLaw_rtP.Constant_Value;
  } else {
    rtb_Tsxlo = PitchAlternateLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Delay_c = PitchAlternateLaw_rtP.Gain_Gain_c * rtb_Tsxlo *
    PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTsLimit_Gain * *rtu_In_time_dt;
  PitchAlternateLaw_DWork.icLoad_p = (rtb_eta_trim_deg_reset || PitchAlternateLaw_DWork.icLoad_p);
  if (PitchAlternateLaw_DWork.icLoad_p) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = rtb_eta_trim_deg_reset_deg - rtb_Delay_c;
  }

  PitchAlternateLaw_DWork.Delay_DSTATE_a += rtb_Delay_c;
  if (PitchAlternateLaw_DWork.Delay_DSTATE_a > PitchAlternateLaw_rtP.Constant2_Value) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = PitchAlternateLaw_rtP.Constant2_Value;
  } else if (PitchAlternateLaw_DWork.Delay_DSTATE_a < PitchAlternateLaw_rtP.Constant3_Value) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = PitchAlternateLaw_rtP.Constant3_Value;
  }

  rtb_Tsxlo = rtb_eta_trim_deg_rate_limit_up_deg_s * *rtu_In_time_dt;
  rtb_Minup = std::fmin(PitchAlternateLaw_DWork.Delay_DSTATE_a - PitchAlternateLaw_DWork.Delay_DSTATE_aa, rtb_Tsxlo);
  rtb_Tsxlo = *rtu_In_time_dt * rtb_eta_trim_deg_rate_limit_lo_deg_s;
  *rty_Out_eta_trim_deg = PitchAlternateLaw_DWork.Delay_DSTATE_aa + std::fmax(rtb_Minup, rtb_Tsxlo);
  PitchAlternateLaw_RateLimiter(PitchAlternateLaw_DWork.Delay_DSTATE_o, PitchAlternateLaw_rtP.RateLimitereta_up,
    PitchAlternateLaw_rtP.RateLimitereta_lo, rtu_In_time_dt, PitchAlternateLaw_rtP.RateLimitereta_InitialCondition,
    rty_Out_eta_deg, &PitchAlternateLaw_DWork.sf_RateLimiter_b);
  PitchAlternateLaw_DWork.Delay_DSTATE = rtb_Y_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_k = rtb_Gain1;
  PitchAlternateLaw_DWork.Delay_DSTATE_d = rtb_Gain_j;
  PitchAlternateLaw_DWork.Delay_DSTATE_kd = rtb_Product1_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_j = rtb_Cos;
  PitchAlternateLaw_DWork.Delay_DSTATE_dy = rtb_Gain1_mr;
  PitchAlternateLaw_DWork.Delay_DSTATE_e = rtb_Divide_n;
  PitchAlternateLaw_DWork.Delay_DSTATE_g = rtb_Gain_ny;
  PitchAlternateLaw_DWork.Delay_DSTATE_l = rtb_Bias_o;
  PitchAlternateLaw_DWork.icLoad = false;
  PitchAlternateLaw_DWork.icLoad_p = false;
  PitchAlternateLaw_DWork.Delay_DSTATE_aa = *rty_Out_eta_trim_deg;
}

PitchAlternateLaw::PitchAlternateLaw():
  PitchAlternateLaw_DWork()
{
}

PitchAlternateLaw::~PitchAlternateLaw()
{
}
