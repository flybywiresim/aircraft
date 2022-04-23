#include "PitchAlternateLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T PitchAlternateLaw_IN_Flare_Reduce_Theta_c{ 1U };

const uint8_T PitchAlternateLaw_IN_Flare_Set_Rate{ 2U };

const uint8_T PitchAlternateLaw_IN_Flare_Store_Theta_c_deg{ 3U };

const uint8_T PitchAlternateLaw_IN_Flight_High{ 4U };

const uint8_T PitchAlternateLaw_IN_Flight_Low{ 5U };

const uint8_T PitchAlternateLaw_IN_Ground{ 6U };

const uint8_T PitchAlternateLaw_IN_frozen{ 1U };

const uint8_T PitchAlternateLaw_IN_running{ 2U };

const uint8_T PitchAlternateLaw_IN_Flight{ 1U };

const uint8_T PitchAlternateLaw_IN_FlightToGroundTransition{ 2U };

const uint8_T PitchAlternateLaw_IN_Ground_c{ 3U };

const uint8_T PitchAlternateLaw_IN_automatic{ 1U };

const uint8_T PitchAlternateLaw_IN_manual{ 2U };

const uint8_T PitchAlternateLaw_IN_reset{ 3U };

const uint8_T PitchAlternateLaw_IN_tracking{ 4U };

const uint8_T PitchAlternateLaw_IN_flight_clean{ 1U };

const uint8_T PitchAlternateLaw_IN_flight_flaps{ 2U };

const uint8_T PitchAlternateLaw_IN_ground{ 3U };

const uint8_T PitchAlternateLaw_IN_OFF{ 1U };

const uint8_T PitchAlternateLaw_IN_ON{ 2U };

PitchAlternateLaw::Parameters_PitchAlternateLaw_T PitchAlternateLaw::PitchAlternateLaw_rtP{

  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  0.05,

  0.3,

  5.0,

  1.6,

  1.0,

  2.0,

  2.0,

  2.0,

  2.0,

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

  1.0,

  1.0,

  1.0,

  1.0,

  0.0,

  0.0,

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

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -30.0,


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },

  30.0,

  -0.2,

  -0.5,

  -0.5,

  -1.0,

  -1.0,

  -0.5,

  -0.5,

  -45.0,

  0.2,

  0.5,

  0.5,

  1.0,

  1.0,

  0.5,

  0.5,

  45.0,

  true,

  3.5,

  -11.0,

  0.0,

  1.0,

  1.0,

  -0.8,

  -1.2,

  -1.0,

  4.0,

  -4.0,

  0.0,

  -0.4,

  -0.4,

  1.4,

  -0.1,

  -0.6,

  0.2,

  0.75,

  -0.75,

  0.0,

  -30.0,

  1.0,

  0.0,

  1.0,

  0.0,

  1.0,

  0.0,

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

  2.0,

  0.0,

  0.0,

  2.0,

  0.0,

  0.0,

  0.0,

  2.0,

  0.0,

  0.0,

  2.0,

  0.0,

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

  30.0,

  -30.0,

  0.0,

  0.076923076923076927,

  1U,

  1U
};

void PitchAlternateLaw::PitchAlternateLaw_LagFilter(const real_T *rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T
  *rty_Y, rtDW_LagFilter_PitchAlternateLaw_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = *rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = *rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = *rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (*rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = *rtu_U;
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

void PitchAlternateLaw::PitchAlternateLaw_eta_trim_limit_lofreeze(const real_T *rtu_eta_trim, const boolean_T
  *rtu_trigger, real_T *rty_y, rtDW_eta_trim_limit_lofreeze_PitchAlternateLaw_T *localDW)
{
  if ((!*rtu_trigger) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = *rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void PitchAlternateLaw::PitchAlternateLaw_LagFilter_i(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_PitchAlternateLaw_o_T *localDW)
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

void PitchAlternateLaw::PitchAlternateLaw_RateLimiter_c(const real_T *rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *
  rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchAlternateLaw_o_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(*rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void PitchAlternateLaw::init(void)
{
  PitchAlternateLaw_DWork.Delay_DSTATE = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_k = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_d = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_kd = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  PitchAlternateLaw_DWork.Delay_DSTATE_f = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  PitchAlternateLaw_DWork.Delay_DSTATE_g = PitchAlternateLaw_rtP.Delay_InitialCondition;
  PitchAlternateLaw_DWork.Delay1_DSTATE = PitchAlternateLaw_rtP.Delay1_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_j = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  PitchAlternateLaw_DWork.Delay_DSTATE_c = PitchAlternateLaw_rtP.Delay_InitialCondition_e;
  PitchAlternateLaw_DWork.Delay1_DSTATE_i = PitchAlternateLaw_rtP.Delay1_InitialCondition_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_b = PitchAlternateLaw_rtP.RateLimiterVariableTs3_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_ku = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_gl = PitchAlternateLaw_rtP.Delay_InitialCondition_c;
  PitchAlternateLaw_DWork.Delay1_DSTATE_l = PitchAlternateLaw_rtP.Delay1_InitialCondition_gf;
  PitchAlternateLaw_DWork.Delay_DSTATE_m = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  PitchAlternateLaw_DWork.Delay_DSTATE_k2 = PitchAlternateLaw_rtP.Delay_InitialCondition_h;
  PitchAlternateLaw_DWork.Delay1_DSTATE_n = PitchAlternateLaw_rtP.Delay1_InitialCondition_e;
  PitchAlternateLaw_DWork.Delay_DSTATE_jh = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  PitchAlternateLaw_DWork.Delay_DSTATE_dy = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchAlternateLaw_DWork.Delay_DSTATE_e = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_gz = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_l = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchAlternateLaw_DWork.icLoad = true;
  PitchAlternateLaw_DWork.icLoad_p = true;
  PitchAlternateLaw_DWork.Delay_DSTATE_aa = PitchAlternateLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition;
}

void PitchAlternateLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_time_simulation_time, const real_T
  *rtu_In_nz_g, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const
  real_T *rtu_In_qk_dot_deg_s2, const real_T *rtu_In_eta_deg, const real_T *rtu_In_eta_trim_deg, const real_T
  *rtu_In_alpha_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft,
  const real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const real_T
  *rtu_In_spoilers_right_pos, const real_T *rtu_In_thrust_lever_1_pos, const real_T *rtu_In_thrust_lever_2_pos, const
  real_T *rtu_In_delta_eta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const
  boolean_T *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T
  *rtu_In_alpha_prot, const real_T *rtu_In_alpha_max, const real_T *rtu_In_high_speed_prot_high_kn, const real_T
  *rtu_In_high_speed_prot_low_kn, real_T *rty_Out_eta_deg, real_T *rty_Out_eta_trim_deg)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T rtb_TmpSignalConversionAtSFunctionInport1[3];
  real_T minV_tmp;
  real_T rtb_Bias_o;
  real_T rtb_Cos;
  real_T rtb_Delay_c;
  real_T rtb_Divide;
  real_T rtb_Divide_bt;
  real_T rtb_Divide_c;
  real_T rtb_Divide_f;
  real_T rtb_Divide_l;
  real_T rtb_Divide_ox;
  real_T rtb_Divide_p;
  real_T rtb_Gain1_mr;
  real_T rtb_Gain_et;
  real_T rtb_Gain_mp;
  real_T rtb_ManualSwitch;
  real_T rtb_Minup;
  real_T rtb_Product1_f;
  real_T rtb_Product_k;
  real_T rtb_Sum10;
  real_T rtb_Sum11;
  real_T rtb_Sum_g;
  real_T rtb_Tsxlo;
  real_T rtb_Y_a;
  real_T rtb_Y_e;
  real_T rtb_Y_i;
  real_T rtb_Y_j;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T rtb_qk_dot_gain;
  real_T rtb_qk_gain;
  real_T rtb_v_target;
  real_T rtb_y;
  real_T rtb_y_d;
  real_T rtb_y_g;
  real_T y;
  int32_T rtb_in_flare;
  boolean_T rtb_OR;
  boolean_T rtb_eta_trim_deg_reset;
  boolean_T rtb_eta_trim_deg_should_freeze;
  if (PitchAlternateLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = PitchAlternateLaw_rtP.Constant1_Value_k;
  } else {
    rtb_ManualSwitch = PitchAlternateLaw_rtP.Constant_Value_p;
  }

  PitchAlternateLaw_LagFilter(rtu_In_Theta_deg, PitchAlternateLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_LagFilter);
  if (PitchAlternateLaw_DWork.is_active_c3_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c3_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Ground_c;
    PitchAlternateLaw_B.in_flight = 0.0;
  } else {
    switch (PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_Flight:
      if ((*rtu_In_on_ground) && (*rtu_In_Theta_deg < 2.5)) {
        PitchAlternateLaw_DWork.on_ground_time = *rtu_In_time_simulation_time;
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_FlightToGroundTransition;
      } else {
        PitchAlternateLaw_B.in_flight = 1.0;
      }
      break;

     case PitchAlternateLaw_IN_FlightToGroundTransition:
      if (*rtu_In_time_simulation_time - PitchAlternateLaw_DWork.on_ground_time >= 5.0) {
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Ground_c;
        PitchAlternateLaw_B.in_flight = 0.0;
      } else if ((!*rtu_In_on_ground) || (*rtu_In_Theta_deg >= 2.5)) {
        PitchAlternateLaw_DWork.on_ground_time = 0.0;
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Flight;
        PitchAlternateLaw_B.in_flight = 1.0;
      }
      break;

     default:
      if (((!*rtu_In_on_ground) && (*rtu_In_Theta_deg > 8.0)) || (*rtu_In_H_radio_ft > 400.0)) {
        PitchAlternateLaw_DWork.on_ground_time = 0.0;
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Flight;
        PitchAlternateLaw_B.in_flight = 1.0;
      } else {
        PitchAlternateLaw_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (PitchAlternateLaw_DWork.is_active_c2_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c2_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Ground;
    rtb_in_flare = 0;
  } else {
    switch (PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_Flare_Reduce_Theta_c:
      if (PitchAlternateLaw_B.in_flight == 0.0) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Ground;
        rtb_in_flare = 0;
      } else if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case PitchAlternateLaw_IN_Flare_Set_Rate:
      if (PitchAlternateLaw_rtP.ManualSwitch1_CurrentSetting == 1) {
        rtb_Divide = PitchAlternateLaw_rtP.Constant1_Value_k;
      } else {
        rtb_Divide = PitchAlternateLaw_rtP.Constant_Value_p;
      }

      if ((*rtu_In_H_radio_ft <= 30.0) || (rtb_Divide == 1.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flare_Reduce_Theta_c;
        rtb_in_flare = 1;
      } else if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case PitchAlternateLaw_IN_Flare_Store_Theta_c_deg:
      if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flare_Set_Rate;
        rtb_in_flare = 1;
      }
      break;

     case PitchAlternateLaw_IN_Flight_High:
      if ((*rtu_In_H_radio_ft <= 50.0) || (rtb_ManualSwitch == 1.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flare_Store_Theta_c_deg;
        rtb_in_flare = 1;
      } else {
        rtb_in_flare = 0;
      }
      break;

     case PitchAlternateLaw_IN_Flight_Low:
      if (*rtu_In_H_radio_ft > 50.0) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_High;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
      }
      break;

     default:
      if (PitchAlternateLaw_B.in_flight == 1.0) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
      }
      break;
    }
  }

  if (PitchAlternateLaw_DWork.is_active_c9_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c9_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw == PitchAlternateLaw_IN_frozen) {
    if ((rtb_in_flare == 0) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs(*rtu_In_Phi_deg) <= 30.0)) {
      PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if ((rtb_in_flare != 0) || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs(*rtu_In_Phi_deg) > 30.0))
  {
    PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  if (PitchAlternateLaw_DWork.is_active_c8_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c8_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_manual;
    rtb_eta_trim_deg_reset = true;
    rtb_ManualSwitch = *rtu_In_eta_trim_deg;
  } else {
    switch (PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_automatic:
      if (PitchAlternateLaw_B.in_flight == 0.0) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_reset;
        rtb_eta_trim_deg_reset = true;
        rtb_ManualSwitch = 0.0;
      } else if (*rtu_In_tracking_mode_on) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_tracking;
        rtb_eta_trim_deg_reset = true;
        rtb_ManualSwitch = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = false;
        rtb_ManualSwitch = *rtu_In_eta_trim_deg;
      }
      break;

     case PitchAlternateLaw_IN_manual:
      if (PitchAlternateLaw_B.in_flight != 0.0) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_ManualSwitch = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_ManualSwitch = *rtu_In_eta_trim_deg;
      }
      break;

     case PitchAlternateLaw_IN_reset:
      if ((PitchAlternateLaw_B.in_flight == 0.0) && (*rtu_In_eta_trim_deg == 0.0)) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_manual;
        rtb_eta_trim_deg_reset = true;
        rtb_ManualSwitch = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_ManualSwitch = 0.0;
      }
      break;

     default:
      if (!*rtu_In_tracking_mode_on) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_ManualSwitch = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_ManualSwitch = *rtu_In_eta_trim_deg;
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
      } else if (PitchAlternateLaw_B.in_flight == 0.0) {
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
      } else if (PitchAlternateLaw_B.in_flight == 0.0) {
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
      if ((PitchAlternateLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index == 0.0)) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((PitchAlternateLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index != 0.0)) {
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

  if (PitchAlternateLaw_B.in_flight > PitchAlternateLaw_rtP.Saturation_UpperSat) {
    rtb_Divide = PitchAlternateLaw_rtP.Saturation_UpperSat;
  } else if (PitchAlternateLaw_B.in_flight < PitchAlternateLaw_rtP.Saturation_LowerSat) {
    rtb_Divide = PitchAlternateLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Divide = PitchAlternateLaw_B.in_flight;
  }

  PitchAlternateLaw_RateLimiter(rtb_Divide, PitchAlternateLaw_rtP.RateLimiterVariableTs_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i, &PitchAlternateLaw_DWork.sf_RateLimiter);
  if (PitchAlternateLaw_DWork.is_active_c6_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c6_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw = PitchAlternateLaw_IN_OFF;
    rtb_in_flare = 0;
  } else if (PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw == PitchAlternateLaw_IN_OFF) {
    if ((rtb_Y_i < 1.0) && (*rtu_In_V_tas_kn > 70.0) && ((*rtu_In_thrust_lever_1_pos >= 35.0) ||
         (*rtu_In_thrust_lever_2_pos >= 35.0))) {
      PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw = PitchAlternateLaw_IN_ON;
      rtb_in_flare = 1;
    } else {
      rtb_in_flare = 0;
    }
  } else if ((rtb_Y_i == 1.0) || (*rtu_In_H_radio_ft > 400.0) || ((*rtu_In_V_tas_kn < 70.0) &&
              ((*rtu_In_thrust_lever_1_pos < 35.0) || (*rtu_In_thrust_lever_2_pos < 35.0)))) {
    PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw = PitchAlternateLaw_IN_OFF;
    rtb_in_flare = 0;
  } else {
    rtb_in_flare = 1;
  }

  if (rtb_in_flare > PitchAlternateLaw_rtP.Saturation1_UpperSat) {
    rtb_Divide = PitchAlternateLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_in_flare < PitchAlternateLaw_rtP.Saturation1_LowerSat) {
    rtb_Divide = PitchAlternateLaw_rtP.Saturation1_LowerSat;
  } else {
    rtb_Divide = rtb_in_flare;
  }

  PitchAlternateLaw_RateLimiter(rtb_Divide, PitchAlternateLaw_rtP.RateLimiterVariableTs1_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_a, &PitchAlternateLaw_DWork.sf_RateLimiter_p);
  rtb_OR = ((rtb_Y_i == 0.0) || (*rtu_In_tracking_mode_on));
  rtb_Y_i = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Divide = (rtb_Y_i - PitchAlternateLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt;
  rtb_Y_a = PitchAlternateLaw_rtP.Gain1_Gain * *rtu_In_Theta_deg;
  rtb_Cos = std::cos(rtb_Y_a);
  rtb_Y_a = PitchAlternateLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg;
  rtb_y_d = rtb_Cos / std::cos(rtb_Y_a);
  rtb_Y_a = PitchAlternateLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s;
  rtb_Gain_et = *rtu_In_nz_g - rtb_y_d;
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.uDLookupTable_bp01Data,
    PitchAlternateLaw_rtP.uDLookupTable_tableData, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  PitchAlternateLaw_RateLimiter(rtb_nz_limit_up_g, PitchAlternateLaw_rtP.RateLimiterVariableTs2_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y_e, &PitchAlternateLaw_DWork.sf_RateLimiter_c);
  if (rtb_v_target > PitchAlternateLaw_rtP.Saturation3_UpperSat_a) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation3_UpperSat_a;
  } else if (rtb_v_target < PitchAlternateLaw_rtP.Saturation3_LowerSat_l) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation3_LowerSat_l;
  }

  rtb_Minup = (PitchAlternateLaw_rtP.Gain_Gain_a * PitchAlternateLaw_rtP.Vm_currentms_Value * rtb_Y_a + rtb_Gain_et) -
    (rtb_Tsxlo / (PitchAlternateLaw_rtP.Gain5_Gain * rtb_v_target) + PitchAlternateLaw_rtP.Bias_Bias) * (rtb_Y_e -
    rtb_y_d);
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.PLUT_bp01Data, PitchAlternateLaw_rtP.PLUT_tableData,
    1U);
  rtb_Product1_f = rtb_Minup * rtb_Tsxlo;
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.DLUT_bp01Data, PitchAlternateLaw_rtP.DLUT_tableData,
    1U);
  rtb_Y_a = rtb_Minup * rtb_Tsxlo * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Divide_c = (rtb_Y_a - PitchAlternateLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt;
  rtb_Y_e = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  rtb_Divide_bt = (rtb_Y_e - PitchAlternateLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt;
  PitchAlternateLaw_LagFilter_i(rtb_Divide_bt, PitchAlternateLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_LagFilter_g3);
  if (rtb_Y_j > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat) {
    y = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Y_j < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat) {
    y = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat;
  } else {
    y = rtb_Y_j;
  }

  minV_tmp = std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos);
  PitchAlternateLaw_WashoutFilter(minV_tmp, PitchAlternateLaw_rtP.WashoutFilter_C1, rtu_In_time_dt, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_WashoutFilter_c);
  rtb_Tsxlo = look1_binlxpw(*rtu_In_H_radio_ft, PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    PitchAlternateLaw_rtP.ScheduledGain_Table, 3U);
  if (rtb_Y_j > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat) {
    rtb_Y_j = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Y_j < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat) {
    rtb_Y_j = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat;
  }

  rtb_Product_k = rtb_Y_j * rtb_Tsxlo;
  rtb_Divide_bt = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  rtb_Divide_f = (rtb_Divide_bt - PitchAlternateLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt;
  rtb_Gain1_mr = PitchAlternateLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.uDLookupTable_bp01Data_b,
    PitchAlternateLaw_rtP.uDLookupTable_tableData_h, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > PitchAlternateLaw_rtP.Saturation3_UpperSat_b) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation3_UpperSat_b;
  } else if (rtb_v_target < PitchAlternateLaw_rtP.Saturation3_LowerSat_e) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation3_LowerSat_e;
  }

  rtb_Bias_o = rtb_Minup / (PitchAlternateLaw_rtP.Gain5_Gain_e * rtb_v_target) + PitchAlternateLaw_rtP.Bias_Bias_f;
  PitchAlternateLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchAlternateLaw_rtP.RateLimiterVariableTs_up_n,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_lo_c, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_j, &PitchAlternateLaw_DWork.sf_RateLimiter_c2);
  rtb_Minup = look1_binlxpw(rtb_Y_j, PitchAlternateLaw_rtP.Loaddemand_bp01Data,
    PitchAlternateLaw_rtP.Loaddemand_tableData, 2U);
  PitchAlternateLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchAlternateLaw_rtP.RateLimiterVariableTs2_up_m,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_lo_k, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_RateLimiter_nx);
  rtb_y_g = (*rtu_In_alpha_max - *rtu_In_alpha_prot) * rtb_Y_j;
  PitchAlternateLaw_LagFilter(rtu_In_alpha_deg, PitchAlternateLaw_rtP.LagFilter1_C1, rtu_In_time_dt, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_LagFilter_m);
  rtb_Sum10 = rtb_Y_j - *rtu_In_alpha_prot;
  rtb_y = std::fmax(std::fmax(0.0, *rtu_In_Theta_deg - 22.5), std::fmax(0.0, (std::abs(*rtu_In_Phi_deg) - 3.0) / 6.0));
  PitchAlternateLaw_WashoutFilter(rtb_y, PitchAlternateLaw_rtP.WashoutFilter_C1_b, rtu_In_time_dt, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_WashoutFilter_h);
  rtb_Sum11 = (rtb_y_g - rtb_Sum10) - rtb_Y_j;
  rtb_Y_j = PitchAlternateLaw_rtP.Subsystem1_Gain * rtb_Sum11;
  rtb_y_g = (rtb_Y_j - PitchAlternateLaw_DWork.Delay_DSTATE_f) / *rtu_In_time_dt;
  rtb_Tsxlo = *rtu_In_time_dt * PitchAlternateLaw_rtP.Subsystem1_C1;
  rtb_Delay_c = rtb_Tsxlo + PitchAlternateLaw_rtP.Constant_Value_f;
  PitchAlternateLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Delay_c * (PitchAlternateLaw_rtP.Constant_Value_f - rtb_Tsxlo) *
    PitchAlternateLaw_DWork.Delay1_DSTATE + (rtb_y_g + PitchAlternateLaw_DWork.Delay_DSTATE_g) * (rtb_Tsxlo /
    rtb_Delay_c);
  rtb_Sum10 = PitchAlternateLaw_rtP.Subsystem3_Gain * *rtu_In_V_ias_kn;
  rtb_y = (rtb_Sum10 - PitchAlternateLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Delay_c = *rtu_In_time_dt * PitchAlternateLaw_rtP.Subsystem3_C1;
  rtb_Tsxlo = rtb_Delay_c + PitchAlternateLaw_rtP.Constant_Value_b;
  PitchAlternateLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_Tsxlo * (PitchAlternateLaw_rtP.Constant_Value_b - rtb_Delay_c) *
    PitchAlternateLaw_DWork.Delay1_DSTATE_i + (rtb_y + PitchAlternateLaw_DWork.Delay_DSTATE_c) * (rtb_Delay_c /
    rtb_Tsxlo);
  rtb_Delay_c = *rtu_In_high_aoa_prot_active;
  if (rtb_Delay_c > PitchAlternateLaw_rtP.Switch1_Threshold) {
    rtb_qk_dot_gain = PitchAlternateLaw_rtP.qk_dot_gain_Gain * *rtu_In_qk_dot_deg_s2;
    rtb_qk_gain = PitchAlternateLaw_rtP.qk_gain_Gain * *rtu_In_qk_deg_s;
    rtb_Delay_c = (((PitchAlternateLaw_rtP.precontrol_gain_Gain * PitchAlternateLaw_DWork.Delay1_DSTATE +
                     PitchAlternateLaw_rtP.alpha_err_gain_Gain * rtb_Sum11) + PitchAlternateLaw_rtP.v_dot_gain_Gain *
                    PitchAlternateLaw_DWork.Delay1_DSTATE_i) + rtb_qk_gain) + rtb_qk_dot_gain;
    if (rtb_Delay_c > PitchAlternateLaw_rtP.Saturation3_UpperSat) {
      rtb_Delay_c = PitchAlternateLaw_rtP.Saturation3_UpperSat;
    } else if (rtb_Delay_c < PitchAlternateLaw_rtP.Saturation3_LowerSat) {
      rtb_Delay_c = PitchAlternateLaw_rtP.Saturation3_LowerSat;
    }
  } else {
    rtb_Delay_c = PitchAlternateLaw_rtP.Constant2_Value_c;
  }

  rtb_Sum_g = rtb_Minup + rtb_Delay_c;
  rtb_Minup = *rtu_In_delta_eta_pos - PitchAlternateLaw_DWork.Delay_DSTATE_b;
  rtb_Tsxlo = PitchAlternateLaw_rtP.RateLimiterVariableTs3_up * *rtu_In_time_dt;
  rtb_Minup = std::fmin(rtb_Minup, rtb_Tsxlo);
  rtb_Tsxlo = *rtu_In_time_dt * PitchAlternateLaw_rtP.RateLimiterVariableTs3_lo;
  PitchAlternateLaw_DWork.Delay_DSTATE_b += std::fmax(rtb_Minup, rtb_Tsxlo);
  rtb_v_target = std::fmax((*rtu_In_high_speed_prot_low_kn - *rtu_In_high_speed_prot_high_kn) *
    PitchAlternateLaw_DWork.Delay_DSTATE_b, 0.0) + *rtu_In_high_speed_prot_low_kn;
  rtb_Sum11 = PitchAlternateLaw_rtP.Subsystem2_Gain * rtb_v_target;
  rtb_qk_dot_gain = (rtb_Sum11 - PitchAlternateLaw_DWork.Delay_DSTATE_ku) / *rtu_In_time_dt;
  rtb_Delay_c = *rtu_In_time_dt * PitchAlternateLaw_rtP.Subsystem2_C1;
  rtb_Minup = rtb_Delay_c + PitchAlternateLaw_rtP.Constant_Value_j;
  PitchAlternateLaw_DWork.Delay1_DSTATE_l = 1.0 / rtb_Minup * (PitchAlternateLaw_rtP.Constant_Value_j - rtb_Delay_c) *
    PitchAlternateLaw_DWork.Delay1_DSTATE_l + (rtb_qk_dot_gain + PitchAlternateLaw_DWork.Delay_DSTATE_gl) * (rtb_Delay_c
    / rtb_Minup);
  rtb_qk_gain = PitchAlternateLaw_rtP.Subsystem_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_ox = (rtb_qk_gain - PitchAlternateLaw_DWork.Delay_DSTATE_m) / *rtu_In_time_dt;
  rtb_Delay_c = *rtu_In_time_dt * PitchAlternateLaw_rtP.Subsystem_C1;
  rtb_Minup = rtb_Delay_c + PitchAlternateLaw_rtP.Constant_Value_jj;
  PitchAlternateLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Minup * (PitchAlternateLaw_rtP.Constant_Value_jj - rtb_Delay_c) *
    PitchAlternateLaw_DWork.Delay1_DSTATE_n + (rtb_Divide_ox + PitchAlternateLaw_DWork.Delay_DSTATE_k2) * (rtb_Delay_c /
    rtb_Minup);
  rtb_Delay_c = *rtu_In_high_speed_prot_active;
  if (rtb_Delay_c > PitchAlternateLaw_rtP.Switch2_Threshold) {
    rtb_Minup = PitchAlternateLaw_rtP.qk_dot_gain1_Gain * *rtu_In_qk_dot_deg_s2;
    rtb_Delay_c = PitchAlternateLaw_rtP.qk_gain_HSP_Gain * *rtu_In_qk_deg_s;
    rtb_v_target -= *rtu_In_V_ias_kn;
    rtb_Delay_c = ((((PitchAlternateLaw_rtP.precontrol_gain_HSP_Gain * PitchAlternateLaw_DWork.Delay1_DSTATE_l +
                      PitchAlternateLaw_rtP.Gain6_Gain * rtb_v_target) + PitchAlternateLaw_rtP.v_dot_gain_HSP_Gain *
                     PitchAlternateLaw_DWork.Delay1_DSTATE_n) + rtb_Delay_c) + rtb_Minup) *
      PitchAlternateLaw_rtP.HSP_gain_Gain;
    if (rtb_Delay_c > PitchAlternateLaw_rtP.Saturation4_UpperSat) {
      rtb_Delay_c = PitchAlternateLaw_rtP.Saturation4_UpperSat;
    } else if (rtb_Delay_c < PitchAlternateLaw_rtP.Saturation4_LowerSat) {
      rtb_Delay_c = PitchAlternateLaw_rtP.Saturation4_LowerSat;
    }
  } else {
    rtb_Delay_c = PitchAlternateLaw_rtP.Constant1_Value;
  }

  rtb_v_target = *rtu_In_Phi_deg;
  if (rtb_v_target > PitchAlternateLaw_rtP.Saturation_UpperSat_f) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation_UpperSat_f;
  } else if (rtb_v_target < PitchAlternateLaw_rtP.Saturation_LowerSat_o) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation_LowerSat_o;
  }

  rtb_Delay_c = (PitchAlternateLaw_rtP.Gain_Gain_b * PitchAlternateLaw_rtP.Vm_currentms_Value_h * rtb_Gain1_mr +
                 rtb_Gain_et) - ((rtb_Cos / std::cos(PitchAlternateLaw_rtP.Gain1_Gain_lm * rtb_v_target) + (rtb_Sum_g +
    rtb_Delay_c)) - rtb_y_d) * rtb_Bias_o;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.PLUT_bp01Data_f,
    PitchAlternateLaw_rtP.PLUT_tableData_k, 1U);
  rtb_v_target = rtb_Delay_c * rtb_Minup;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.DLUT_bp01Data_m,
    PitchAlternateLaw_rtP.DLUT_tableData_a, 1U);
  rtb_Cos = rtb_Delay_c * rtb_Minup * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_Minup = (rtb_Cos - PitchAlternateLaw_DWork.Delay_DSTATE_jh) / *rtu_In_time_dt;
  rtb_Gain1_mr = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  rtb_Delay_c = PitchAlternateLaw_DWork.Delay_DSTATE_dy;
  rtb_Bias_o = (rtb_Gain1_mr - PitchAlternateLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt;
  PitchAlternateLaw_LagFilter_i(rtb_Bias_o, PitchAlternateLaw_rtP.LagFilter_C1_pt, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_LagFilter_i);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_b) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_m) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_m;
  }

  rtb_Tsxlo = ((PitchAlternateLaw_rtP.Gain3_Gain_c * rtb_Divide_f + rtb_v_target) + rtb_Minup) +
    PitchAlternateLaw_rtP.Gain_Gain_f * rtb_Delay_c;
  PitchAlternateLaw_WashoutFilter(minV_tmp, PitchAlternateLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_WashoutFilter);
  rtb_Minup = look1_binlxpw(*rtu_In_H_radio_ft, PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1_c,
    PitchAlternateLaw_rtP.ScheduledGain_Table_g, 3U);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_o) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j;
  }

  rtb_Sum_g = rtb_Delay_c * rtb_Minup;
  rtb_Divide_f = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  rtb_Divide_p = (rtb_Divide_f - PitchAlternateLaw_DWork.Delay_DSTATE_e) / *rtu_In_time_dt;
  rtb_Minup = PitchAlternateLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s;
  rtb_Delay_c = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.uDLookupTable_bp01Data_a,
    PitchAlternateLaw_rtP.uDLookupTable_tableData_p, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  PitchAlternateLaw_RateLimiter(rtb_nz_limit_lo_g, PitchAlternateLaw_rtP.RateLimiterVariableTs3_up_j,
    PitchAlternateLaw_rtP.RateLimiterVariableTs3_lo_a, rtu_In_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs3_InitialCondition_j, &rtb_Bias_o,
    &PitchAlternateLaw_DWork.sf_RateLimiter_n);
  if (rtb_v_target > PitchAlternateLaw_rtP.Saturation3_UpperSat_n) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_v_target < PitchAlternateLaw_rtP.Saturation3_LowerSat_a) {
    rtb_v_target = PitchAlternateLaw_rtP.Saturation3_LowerSat_a;
  }

  rtb_Delay_c = (PitchAlternateLaw_rtP.Gain_Gain_p * PitchAlternateLaw_rtP.Vm_currentms_Value_p * rtb_Minup +
                 rtb_Gain_et) - (rtb_Delay_c / (PitchAlternateLaw_rtP.Gain5_Gain_n * rtb_v_target) +
    PitchAlternateLaw_rtP.Bias_Bias_a) * (rtb_Bias_o - rtb_y_d);
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.PLUT_bp01Data_a,
    PitchAlternateLaw_rtP.PLUT_tableData_o, 1U);
  rtb_y_d = rtb_Delay_c * rtb_Minup;
  rtb_Minup = look1_binlxpw(*rtu_In_V_tas_kn, PitchAlternateLaw_rtP.DLUT_bp01Data_k,
    PitchAlternateLaw_rtP.DLUT_tableData_e, 1U);
  rtb_Gain_et = rtb_Delay_c * rtb_Minup * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Divide_l = (rtb_Gain_et - PitchAlternateLaw_DWork.Delay_DSTATE_gz) / *rtu_In_time_dt;
  rtb_Bias_o = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  rtb_Delay_c = PitchAlternateLaw_DWork.Delay_DSTATE_l;
  rtb_Minup = (rtb_Bias_o - PitchAlternateLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt;
  PitchAlternateLaw_LagFilter_i(rtb_Minup, PitchAlternateLaw_rtP.LagFilter_C1_l, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_LagFilter_g);
  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e;
  }

  rtb_Gain_mp = PitchAlternateLaw_rtP.Gain_Gain_k * rtb_Delay_c;
  PitchAlternateLaw_WashoutFilter(minV_tmp, PitchAlternateLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_WashoutFilter_d);
  rtb_Minup = look1_binlxpw(*rtu_In_H_radio_ft, PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1_f,
    PitchAlternateLaw_rtP.ScheduledGain_Table_h, 3U);
  rtb_v_target = (((PitchAlternateLaw_rtP.Gain3_Gain * rtb_Divide + rtb_Product1_f) + rtb_Divide_c) +
                  PitchAlternateLaw_rtP.Gain_Gain_j * y) + rtb_Product_k;
  if (rtb_v_target > PitchAlternateLaw_rtP.Saturation_UpperSat_h) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = PitchAlternateLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_v_target < PitchAlternateLaw_rtP.Saturation_LowerSat_a) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = PitchAlternateLaw_rtP.Saturation_LowerSat_a;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = rtb_v_target;
  }

  rtb_v_target = rtb_Tsxlo + rtb_Sum_g;
  if (rtb_v_target > PitchAlternateLaw_rtP.Saturation_UpperSat_k) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = PitchAlternateLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_v_target < PitchAlternateLaw_rtP.Saturation_LowerSat_p) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = PitchAlternateLaw_rtP.Saturation_LowerSat_p;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = rtb_v_target;
  }

  if (rtb_Delay_c > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Delay_c < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Delay_c = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_v_target = (((PitchAlternateLaw_rtP.Gain3_Gain_b * rtb_Divide_p + rtb_y_d) + rtb_Divide_l) + rtb_Gain_mp) +
    rtb_Delay_c * rtb_Minup;
  if (rtb_v_target > PitchAlternateLaw_rtP.Saturation_UpperSat_j) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = PitchAlternateLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_v_target < PitchAlternateLaw_rtP.Saturation_LowerSat_d) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = PitchAlternateLaw_rtP.Saturation_LowerSat_d;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = rtb_v_target;
  }

  rtb_Delay_c = look1_binlxpw(*rtu_In_time_dt, PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1_d,
    PitchAlternateLaw_rtP.ScheduledGain_Table_hh, 4U);
  if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[1]) {
    if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      rtb_in_flare = 1;
    } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      rtb_in_flare = 2;
    } else {
      rtb_in_flare = 0;
    }
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    rtb_in_flare = 0;
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    rtb_in_flare = 2;
  } else {
    rtb_in_flare = 1;
  }

  rtb_Delay_c = rtb_TmpSignalConversionAtSFunctionInport1[rtb_in_flare] * rtb_Delay_c *
    PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  if (PitchAlternateLaw_B.in_flight > PitchAlternateLaw_rtP.Switch_Threshold) {
    rtb_Minup = *rtu_In_eta_deg;
  } else {
    rtb_Minup = PitchAlternateLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  }

  PitchAlternateLaw_DWork.icLoad = (rtb_OR || PitchAlternateLaw_DWork.icLoad);
  if (PitchAlternateLaw_DWork.icLoad) {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = rtb_Minup - rtb_Delay_c;
  }

  PitchAlternateLaw_DWork.Delay_DSTATE_o += rtb_Delay_c;
  if (PitchAlternateLaw_DWork.Delay_DSTATE_o > PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (PitchAlternateLaw_DWork.Delay_DSTATE_o < PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit)
  {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_eta_trim_deg_should_freeze == PitchAlternateLaw_rtP.CompareToConstant_const) {
    rtb_Divide = PitchAlternateLaw_rtP.Constant_Value;
  } else {
    rtb_Divide = PitchAlternateLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Delay_c = PitchAlternateLaw_rtP.Gain_Gain_c * rtb_Divide *
    PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTsLimit_Gain * *rtu_In_time_dt;
  PitchAlternateLaw_DWork.icLoad_p = (rtb_eta_trim_deg_reset || PitchAlternateLaw_DWork.icLoad_p);
  if (PitchAlternateLaw_DWork.icLoad_p) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = rtb_ManualSwitch - rtb_Delay_c;
  }

  PitchAlternateLaw_DWork.Delay_DSTATE_a += rtb_Delay_c;
  PitchAlternateLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_speed_prot_active, &rtb_Delay_c,
    &PitchAlternateLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (!*rtu_In_high_speed_prot_active) {
    rtb_Delay_c = PitchAlternateLaw_rtP.Constant2_Value;
  }

  PitchAlternateLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_aoa_prot_active, &rtb_y_d,
    &PitchAlternateLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (PitchAlternateLaw_DWork.Delay_DSTATE_a > rtb_Delay_c) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = rtb_Delay_c;
  } else {
    if (!*rtu_In_high_aoa_prot_active) {
      rtb_y_d = PitchAlternateLaw_rtP.Constant3_Value;
    }

    if (PitchAlternateLaw_DWork.Delay_DSTATE_a < rtb_y_d) {
      PitchAlternateLaw_DWork.Delay_DSTATE_a = rtb_y_d;
    }
  }

  rtb_Tsxlo = rtb_eta_trim_deg_rate_limit_up_deg_s * *rtu_In_time_dt;
  rtb_Minup = std::fmin(PitchAlternateLaw_DWork.Delay_DSTATE_a - PitchAlternateLaw_DWork.Delay_DSTATE_aa, rtb_Tsxlo);
  rtb_Tsxlo = *rtu_In_time_dt * rtb_eta_trim_deg_rate_limit_lo_deg_s;
  *rty_Out_eta_trim_deg = PitchAlternateLaw_DWork.Delay_DSTATE_aa + std::fmax(rtb_Minup, rtb_Tsxlo);
  PitchAlternateLaw_RateLimiter(PitchAlternateLaw_DWork.Delay_DSTATE_o, PitchAlternateLaw_rtP.RateLimitereta_up,
    PitchAlternateLaw_rtP.RateLimitereta_lo, rtu_In_time_dt, PitchAlternateLaw_rtP.RateLimitereta_InitialCondition,
    rty_Out_eta_deg, &PitchAlternateLaw_DWork.sf_RateLimiter_b);
  PitchAlternateLaw_DWork.Delay_DSTATE = rtb_Y_i;
  PitchAlternateLaw_DWork.Delay_DSTATE_k = rtb_Y_a;
  PitchAlternateLaw_DWork.Delay_DSTATE_d = rtb_Y_e;
  PitchAlternateLaw_DWork.Delay_DSTATE_kd = rtb_Divide_bt;
  PitchAlternateLaw_DWork.Delay_DSTATE_f = rtb_Y_j;
  PitchAlternateLaw_DWork.Delay_DSTATE_g = rtb_y_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_j = rtb_Sum10;
  PitchAlternateLaw_DWork.Delay_DSTATE_c = rtb_y;
  PitchAlternateLaw_DWork.Delay_DSTATE_ku = rtb_Sum11;
  PitchAlternateLaw_DWork.Delay_DSTATE_gl = rtb_qk_dot_gain;
  PitchAlternateLaw_DWork.Delay_DSTATE_m = rtb_qk_gain;
  PitchAlternateLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_ox;
  PitchAlternateLaw_DWork.Delay_DSTATE_jh = rtb_Cos;
  PitchAlternateLaw_DWork.Delay_DSTATE_dy = rtb_Gain1_mr;
  PitchAlternateLaw_DWork.Delay_DSTATE_e = rtb_Divide_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_gz = rtb_Gain_et;
  PitchAlternateLaw_DWork.Delay_DSTATE_l = rtb_Bias_o;
  PitchAlternateLaw_DWork.icLoad = false;
  PitchAlternateLaw_DWork.icLoad_p = false;
  PitchAlternateLaw_DWork.Delay_DSTATE_aa = *rty_Out_eta_trim_deg;
}

PitchAlternateLaw::PitchAlternateLaw():
  PitchAlternateLaw_B(),
  PitchAlternateLaw_DWork()
{
}

PitchAlternateLaw::~PitchAlternateLaw()
{
}
