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

  -0.5,

  -1.0,

  -1.0,

  -0.5,

  -45.0,

  0.2,

  0.5,

  0.5,

  0.5,

  1.0,

  1.0,

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

  0.0,

  1.0,

  1.0,

  0.0,

  0.017453292519943295,

  33.0,

  -33.0,

  0.017453292519943295,


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

  0.0,

  0.076923076923076927,

  1U,

  1U
};

void PitchAlternateLaw::PitchAlternateLaw_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
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

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void PitchAlternateLaw::PitchAlternateLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchAlternateLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void PitchAlternateLaw::PitchAlternateLaw_eta_trim_limit_lofreeze(real_T rtu_eta_trim, boolean_T rtu_trigger, real_T
  *rty_y, rtDW_eta_trim_limit_lofreeze_PitchAlternateLaw_T *localDW)
{
  if ((!rtu_trigger) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void PitchAlternateLaw::PitchAlternateLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
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

  denom_tmp = rtu_dt * rtu_C1;
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void PitchAlternateLaw::init(void)
{
  PitchAlternateLaw_DWork.Delay_DSTATE = PitchAlternateLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_f = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_g = PitchAlternateLaw_rtP.Delay_InitialCondition;
  PitchAlternateLaw_DWork.Delay1_DSTATE = PitchAlternateLaw_rtP.Delay1_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_j = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  PitchAlternateLaw_DWork.Delay_DSTATE_c = PitchAlternateLaw_rtP.Delay_InitialCondition_e;
  PitchAlternateLaw_DWork.Delay1_DSTATE_i = PitchAlternateLaw_rtP.Delay1_InitialCondition_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_b = PitchAlternateLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  PitchAlternateLaw_DWork.Delay_DSTATE_k = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_gl = PitchAlternateLaw_rtP.Delay_InitialCondition_c;
  PitchAlternateLaw_DWork.Delay1_DSTATE_l = PitchAlternateLaw_rtP.Delay1_InitialCondition_gf;
  PitchAlternateLaw_DWork.Delay_DSTATE_m = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  PitchAlternateLaw_DWork.Delay_DSTATE_k2 = PitchAlternateLaw_rtP.Delay_InitialCondition_h;
  PitchAlternateLaw_DWork.Delay1_DSTATE_n = PitchAlternateLaw_rtP.Delay1_InitialCondition_e;
  PitchAlternateLaw_DWork.Delay_DSTATE_kd = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_jh = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchAlternateLaw_DWork.Delay_DSTATE_d = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchAlternateLaw_DWork.Delay_DSTATE_l = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  PitchAlternateLaw_DWork.Delay_DSTATE_kw = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  PitchAlternateLaw_DWork.Delay_DSTATE_df = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_dn;
  PitchAlternateLaw_DWork.Delay_DSTATE_e = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_gz = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_lf = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchAlternateLaw_DWork.icLoad = true;
  PitchAlternateLaw_DWork.icLoad_p = true;
  PitchAlternateLaw_DWork.Delay_DSTATE_aa = PitchAlternateLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition_m;
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
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_eta_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos;
  real_T rtb_Divide;
  real_T rtb_Divide_dr;
  real_T rtb_Divide_ew;
  real_T rtb_Divide_ox;
  real_T rtb_Gain;
  real_T rtb_Gain_a;
  real_T rtb_Gain_b;
  real_T rtb_Gain_c;
  real_T rtb_Gain_f;
  real_T rtb_Gain_hr;
  real_T rtb_Gain_hu;
  real_T rtb_Gain_o;
  real_T rtb_ManualSwitch;
  real_T rtb_Minup;
  real_T rtb_Product1_l;
  real_T rtb_Saturation3_g;
  real_T rtb_Sum1_d;
  real_T rtb_Sum_g;
  real_T rtb_Tsxlo;
  real_T rtb_Y;
  real_T rtb_Y_f;
  real_T rtb_Y_j;
  real_T rtb_Y_m;
  real_T rtb_Y_nv;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T rtb_eta_trim_deg_reset_deg;
  real_T rtb_time_dt;
  real_T rtb_uDLookupTable;
  real_T rtb_y_g;
  real_T y;
  real_T y_0;
  int32_T rtb_in_flare;
  int32_T rtb_in_rotation;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on;
  boolean_T rtb_eta_trim_deg_reset;
  boolean_T rtb_eta_trim_deg_should_freeze;
  rtb_time_dt = *rtu_In_time_dt;
  rtb_Y_f = *rtu_In_time_simulation_time;
  rtb_Gain_f = *rtu_In_nz_g;
  rtb_Gain = *rtu_In_Theta_deg;
  rtb_Gain_a = *rtu_In_Phi_deg;
  rtb_Gain_hu = *rtu_In_qk_deg_s;
  rtb_Gain_hr = *rtu_In_qk_dot_deg_s2;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_eta_deg = *rtu_In_eta_deg;
  rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
  rtb_Divide_dr = *rtu_In_alpha_deg;
  rtb_Product1_l = *rtu_In_V_ias_kn;
  rtb_Gain_o = *rtu_In_V_tas_kn;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft = *rtu_In_H_radio_ft;
  rtb_eta_trim_deg_rate_limit_up_deg_s = *rtu_In_flaps_handle_index;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos = *rtu_In_spoilers_left_pos;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos = *rtu_In_spoilers_right_pos;
  rtb_Y_nv = *rtu_In_thrust_lever_1_pos;
  rtb_ManualSwitch = *rtu_In_thrust_lever_2_pos;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos = *rtu_In_delta_eta_pos;
  rtb_eta_trim_deg_should_freeze = *rtu_In_on_ground;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on = *rtu_In_tracking_mode_on;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active =
    *rtu_In_high_aoa_prot_active;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active =
    *rtu_In_high_speed_prot_active;
  rtb_Gain_c = *rtu_In_alpha_prot;
  rtb_y_g = *rtu_In_alpha_max;
  rtb_Gain_b = *rtu_In_high_speed_prot_high_kn;
  rtb_Divide_ew = *rtu_In_high_speed_prot_low_kn;
  PitchAlternateLaw_eta_trim_limit_lofreeze(rtb_eta_trim_deg_reset_deg,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active) {
    rtb_Saturation3_g = rtb_Y_j;
  } else {
    rtb_Saturation3_g = PitchAlternateLaw_rtP.Constant3_Value;
  }

  PitchAlternateLaw_eta_trim_limit_lofreeze(rtb_eta_trim_deg_reset_deg,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active) {
    rtb_uDLookupTable = rtb_Y_j;
  } else {
    rtb_uDLookupTable = PitchAlternateLaw_rtP.Constant2_Value;
  }

  if (PitchAlternateLaw_DWork.is_active_c3_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c3_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Ground_c;
    PitchAlternateLaw_B.in_flight = 0.0;
  } else {
    switch (PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_Flight:
      if (rtb_eta_trim_deg_should_freeze && (rtb_Gain < 2.5)) {
        PitchAlternateLaw_DWork.on_ground_time = rtb_Y_f;
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_FlightToGroundTransition;
      } else {
        PitchAlternateLaw_B.in_flight = 1.0;
      }
      break;

     case PitchAlternateLaw_IN_FlightToGroundTransition:
      if (rtb_Y_f - PitchAlternateLaw_DWork.on_ground_time >= 5.0) {
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Ground_c;
        PitchAlternateLaw_B.in_flight = 0.0;
      } else if ((!rtb_eta_trim_deg_should_freeze) || (rtb_Gain >= 2.5)) {
        PitchAlternateLaw_DWork.on_ground_time = 0.0;
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Flight;
        PitchAlternateLaw_B.in_flight = 1.0;
      }
      break;

     default:
      if (((!rtb_eta_trim_deg_should_freeze) && (rtb_Gain > 8.0)) ||
          (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft > 400.0)) {
        PitchAlternateLaw_DWork.on_ground_time = 0.0;
        PitchAlternateLaw_DWork.is_c3_PitchAlternateLaw = PitchAlternateLaw_IN_Flight;
        PitchAlternateLaw_B.in_flight = 1.0;
      } else {
        PitchAlternateLaw_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (PitchAlternateLaw_B.in_flight > PitchAlternateLaw_rtP.Saturation_UpperSat) {
    rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchAlternateLaw_rtP.Saturation_UpperSat;
  } else if (PitchAlternateLaw_B.in_flight < PitchAlternateLaw_rtP.Saturation_LowerSat) {
    rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchAlternateLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchAlternateLaw_B.in_flight;
  }

  PitchAlternateLaw_RateLimiter(rtb_eta_trim_deg_rate_limit_lo_deg_s, PitchAlternateLaw_rtP.RateLimiterVariableTs_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_lo, rtb_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_f, &PitchAlternateLaw_DWork.sf_RateLimiter);
  if (PitchAlternateLaw_DWork.is_active_c6_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c6_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw = PitchAlternateLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else if (PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw == PitchAlternateLaw_IN_OFF) {
    if ((rtb_Y_f < 1.0) && (rtb_Gain_o > 70.0) && ((rtb_Y_nv >= 35.0) || (rtb_ManualSwitch >= 35.0))) {
      PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw = PitchAlternateLaw_IN_ON;
      rtb_in_rotation = 1;
    } else {
      rtb_in_rotation = 0;
    }
  } else if ((rtb_Y_f == 1.0) || (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft > 400.0)
             || ((rtb_Gain_o < 70.0) && ((rtb_Y_nv < 35.0) || (rtb_ManualSwitch < 35.0)))) {
    PitchAlternateLaw_DWork.is_c6_PitchAlternateLaw = PitchAlternateLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else {
    rtb_in_rotation = 1;
  }

  PitchAlternateLaw_LagFilter(rtb_Gain, PitchAlternateLaw_rtP.LagFilter_C1, rtb_time_dt, &rtb_Y_nv,
    &PitchAlternateLaw_DWork.sf_LagFilter);
  if (PitchAlternateLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = PitchAlternateLaw_rtP.Constant1_Value_k;
  } else {
    rtb_ManualSwitch = PitchAlternateLaw_rtP.Constant_Value_p;
  }

  if (PitchAlternateLaw_DWork.is_active_c2_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c2_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Ground;
    rtb_in_flare = 0;
    PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
    PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
  } else {
    switch (PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_Flare_Reduce_Theta_c:
      if (PitchAlternateLaw_B.in_flight == 0.0) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Ground;
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else if ((rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft > 50.0) &&
                 (rtb_ManualSwitch == 0.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1;
        PitchAlternateLaw_B.flare_Theta_c_deg = -2.0;
      }
      break;

     case PitchAlternateLaw_IN_Flare_Set_Rate:
      if (PitchAlternateLaw_rtP.ManualSwitch1_CurrentSetting == 1) {
        rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchAlternateLaw_rtP.Constant1_Value_k;
      } else {
        rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchAlternateLaw_rtP.Constant_Value_p;
      }

      if ((rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft <= 30.0) ||
          (rtb_eta_trim_deg_rate_limit_lo_deg_s == 1.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flare_Reduce_Theta_c;
        rtb_in_flare = 1;
        PitchAlternateLaw_B.flare_Theta_c_deg = -2.0;
      } else if ((rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft > 50.0) &&
                 (rtb_ManualSwitch == 0.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case PitchAlternateLaw_IN_Flare_Store_Theta_c_deg:
      if ((rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft > 50.0) && (rtb_ManualSwitch ==
           0.0)) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -(rtb_Y_nv + 2.0) / 8.0;
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flare_Set_Rate;
        rtb_in_flare = 1;
      }
      break;

     case PitchAlternateLaw_IN_Flight_High:
      if ((rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft <= 50.0) || (rtb_ManualSwitch ==
           1.0)) {
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flare_Store_Theta_c_deg;
        rtb_in_flare = 1;
      } else {
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     case PitchAlternateLaw_IN_Flight_Low:
      if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft > 50.0) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_High;
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     default:
      if (PitchAlternateLaw_B.in_flight == 1.0) {
        PitchAlternateLaw_DWork.is_c2_PitchAlternateLaw = PitchAlternateLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0;
        PitchAlternateLaw_B.flare_Theta_c_deg = rtb_Y_nv;
        PitchAlternateLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;
    }
  }

  if (rtb_in_rotation > PitchAlternateLaw_rtP.Saturation1_UpperSat) {
    rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchAlternateLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_in_rotation < PitchAlternateLaw_rtP.Saturation1_LowerSat) {
    rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchAlternateLaw_rtP.Saturation1_LowerSat;
  } else {
    rtb_eta_trim_deg_rate_limit_lo_deg_s = rtb_in_rotation;
  }

  PitchAlternateLaw_RateLimiter(rtb_eta_trim_deg_rate_limit_lo_deg_s, PitchAlternateLaw_rtP.RateLimiterVariableTs1_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs1_lo, rtb_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_nv, &PitchAlternateLaw_DWork.sf_RateLimiter_p);
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
      if (rtb_eta_trim_deg_rate_limit_up_deg_s != 0.0) {
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
      if (rtb_eta_trim_deg_rate_limit_up_deg_s == 0.0) {
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
      if ((PitchAlternateLaw_B.in_flight != 0.0) && (rtb_eta_trim_deg_rate_limit_up_deg_s == 0.0)) {
        PitchAlternateLaw_DWork.is_c7_PitchAlternateLaw = PitchAlternateLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((PitchAlternateLaw_B.in_flight != 0.0) && (rtb_eta_trim_deg_rate_limit_up_deg_s != 0.0)) {
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
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_lo, rtb_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y, &PitchAlternateLaw_DWork.sf_RateLimiter_c);
  PitchAlternateLaw_RateLimiter(rtb_nz_limit_lo_g, PitchAlternateLaw_rtP.RateLimiterVariableTs3_up,
    PitchAlternateLaw_rtP.RateLimiterVariableTs3_lo, rtb_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_j, &PitchAlternateLaw_DWork.sf_RateLimiter_n);
  if (PitchAlternateLaw_DWork.is_active_c9_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c9_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw == PitchAlternateLaw_IN_frozen) {
    if ((rtb_in_flare == 0) && (rtb_Gain_f < 1.25) && (rtb_Gain_f > 0.5) && (std::abs(rtb_Gain_a) <= 30.0)) {
      PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if ((rtb_in_flare != 0) || (rtb_Gain_f >= 1.25) || (rtb_Gain_f <= 0.5) || (std::abs(rtb_Gain_a) > 30.0)) {
    PitchAlternateLaw_DWork.is_c9_PitchAlternateLaw = PitchAlternateLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  if (PitchAlternateLaw_DWork.is_active_c8_PitchAlternateLaw == 0U) {
    PitchAlternateLaw_DWork.is_active_c8_PitchAlternateLaw = 1U;
    PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_manual;
    rtb_eta_trim_deg_reset = true;
  } else {
    switch (PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw) {
     case PitchAlternateLaw_IN_automatic:
      if (PitchAlternateLaw_B.in_flight == 0.0) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_reset;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      } else if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_tracking;
        rtb_eta_trim_deg_reset = true;
      } else {
        rtb_eta_trim_deg_reset = false;
      }
      break;

     case PitchAlternateLaw_IN_manual:
      if (PitchAlternateLaw_B.in_flight != 0.0) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
      } else {
        rtb_eta_trim_deg_reset = true;
      }
      break;

     case PitchAlternateLaw_IN_reset:
      if ((PitchAlternateLaw_B.in_flight == 0.0) && (rtb_eta_trim_deg_reset_deg == 0.0)) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_manual;
        rtb_eta_trim_deg_reset = true;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      }
      break;

     default:
      if (!rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on) {
        PitchAlternateLaw_DWork.is_c8_PitchAlternateLaw = PitchAlternateLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
      } else {
        rtb_eta_trim_deg_reset = true;
      }
      break;
    }
  }

  PitchAlternateLaw_DWork.Delay_DSTATE += std::fmax(std::fmin(PitchAlternateLaw_B.flare_Theta_c_deg -
    PitchAlternateLaw_DWork.Delay_DSTATE, std::abs(PitchAlternateLaw_B.flare_Theta_c_rate_deg_s) * rtb_time_dt),
    rtb_time_dt * PitchAlternateLaw_B.flare_Theta_c_rate_deg_s);
  rtb_ManualSwitch = rtb_Y_j;
  rtb_Y_nv = std::cos(PitchAlternateLaw_rtP.Gain1_Gain * rtb_Gain);
  if (rtb_Gain_a > PitchAlternateLaw_rtP.Saturation_UpperSat_f) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation_UpperSat_f;
  } else if (rtb_Gain_a < PitchAlternateLaw_rtP.Saturation_LowerSat_o) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation_LowerSat_o;
  } else {
    rtb_Y_m = rtb_Gain_a;
  }

  rtb_Divide = rtb_Y_nv / std::cos(PitchAlternateLaw_rtP.Gain1_Gain_l * rtb_Y_m);
  PitchAlternateLaw_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_up_n, PitchAlternateLaw_rtP.RateLimiterVariableTs_lo_c, rtb_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_j, &PitchAlternateLaw_DWork.sf_RateLimiter_c2);
  rtb_Minup = look1_binlxpw(rtb_Y_j, PitchAlternateLaw_rtP.Loaddemand_bp01Data,
    PitchAlternateLaw_rtP.Loaddemand_tableData, 2U);
  PitchAlternateLaw_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_up_m, PitchAlternateLaw_rtP.RateLimiterVariableTs2_lo_k, rtb_time_dt,
    PitchAlternateLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_RateLimiter_nx);
  rtb_y_g = (rtb_y_g - rtb_Gain_c) * rtb_Y_j;
  PitchAlternateLaw_LagFilter(rtb_Divide_dr, PitchAlternateLaw_rtP.LagFilter1_C1, rtb_time_dt, &rtb_Y_j,
    &PitchAlternateLaw_DWork.sf_LagFilter_m);
  rtb_Tsxlo = rtb_Y_j - rtb_Gain_c;
  PitchAlternateLaw_WashoutFilter(std::fmax(std::fmax(0.0, rtb_Gain - 22.5), std::fmax(0.0, (std::abs(rtb_Gain_a) - 3.0)
    / 6.0)), PitchAlternateLaw_rtP.WashoutFilter_C1, rtb_time_dt, &rtb_Y_j, &PitchAlternateLaw_DWork.sf_WashoutFilter_h);
  rtb_Y_j = (rtb_y_g - rtb_Tsxlo) - rtb_Y_j;
  rtb_Gain = PitchAlternateLaw_rtP.Subsystem1_Gain * rtb_Y_j;
  rtb_Divide_dr = (rtb_Gain - PitchAlternateLaw_DWork.Delay_DSTATE_f) / rtb_time_dt;
  rtb_Tsxlo = rtb_time_dt * PitchAlternateLaw_rtP.Subsystem1_C1;
  rtb_Y_m = rtb_Tsxlo + PitchAlternateLaw_rtP.Constant_Value_f;
  PitchAlternateLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Y_m * (PitchAlternateLaw_rtP.Constant_Value_f - rtb_Tsxlo) *
    PitchAlternateLaw_DWork.Delay1_DSTATE + (rtb_Divide_dr + PitchAlternateLaw_DWork.Delay_DSTATE_g) * (rtb_Tsxlo /
    rtb_Y_m);
  rtb_Gain_c = PitchAlternateLaw_rtP.Subsystem3_Gain * rtb_Product1_l;
  rtb_y_g = (rtb_Gain_c - PitchAlternateLaw_DWork.Delay_DSTATE_j) / rtb_time_dt;
  rtb_Tsxlo = rtb_time_dt * PitchAlternateLaw_rtP.Subsystem3_C1;
  rtb_Y_m = rtb_Tsxlo + PitchAlternateLaw_rtP.Constant_Value_b;
  PitchAlternateLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_Y_m * (PitchAlternateLaw_rtP.Constant_Value_b - rtb_Tsxlo) *
    PitchAlternateLaw_DWork.Delay1_DSTATE_i + (rtb_y_g + PitchAlternateLaw_DWork.Delay_DSTATE_c) * (rtb_Tsxlo / rtb_Y_m);
  if (static_cast<real_T>(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active) >
      PitchAlternateLaw_rtP.Switch1_Threshold) {
    rtb_Tsxlo = (((PitchAlternateLaw_rtP.precontrol_gain_Gain * PitchAlternateLaw_DWork.Delay1_DSTATE +
                   PitchAlternateLaw_rtP.alpha_err_gain_Gain * rtb_Y_j) + PitchAlternateLaw_rtP.v_dot_gain_Gain *
                  PitchAlternateLaw_DWork.Delay1_DSTATE_i) + PitchAlternateLaw_rtP.qk_gain_Gain * rtb_Gain_hu) +
      PitchAlternateLaw_rtP.qk_dot_gain_Gain * rtb_Gain_hr;
    if (rtb_Tsxlo > PitchAlternateLaw_rtP.Saturation3_UpperSat) {
      rtb_Tsxlo = PitchAlternateLaw_rtP.Saturation3_UpperSat;
    } else if (rtb_Tsxlo < PitchAlternateLaw_rtP.Saturation3_LowerSat) {
      rtb_Tsxlo = PitchAlternateLaw_rtP.Saturation3_LowerSat;
    }
  } else {
    rtb_Tsxlo = PitchAlternateLaw_rtP.Constant2_Value_c;
  }

  rtb_Sum_g = rtb_Minup + rtb_Tsxlo;
  PitchAlternateLaw_DWork.Delay_DSTATE_b += std::fmax(std::fmin
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos -
     PitchAlternateLaw_DWork.Delay_DSTATE_b, PitchAlternateLaw_rtP.RateLimiterVariableTs3_up_i * rtb_time_dt),
    rtb_time_dt * PitchAlternateLaw_rtP.RateLimiterVariableTs3_lo_b);
  rtb_Y_m = std::fmax((rtb_Divide_ew - rtb_Gain_b) * PitchAlternateLaw_DWork.Delay_DSTATE_b, 0.0) + rtb_Divide_ew;
  rtb_Gain_b = PitchAlternateLaw_rtP.Subsystem2_Gain * rtb_Y_m;
  rtb_Divide_ew = (rtb_Gain_b - PitchAlternateLaw_DWork.Delay_DSTATE_k) / rtb_time_dt;
  rtb_Minup = rtb_time_dt * PitchAlternateLaw_rtP.Subsystem2_C1;
  rtb_Tsxlo = rtb_Minup + PitchAlternateLaw_rtP.Constant_Value_j;
  PitchAlternateLaw_DWork.Delay1_DSTATE_l = 1.0 / rtb_Tsxlo * (PitchAlternateLaw_rtP.Constant_Value_j - rtb_Minup) *
    PitchAlternateLaw_DWork.Delay1_DSTATE_l + (rtb_Divide_ew + PitchAlternateLaw_DWork.Delay_DSTATE_gl) * (rtb_Minup /
    rtb_Tsxlo);
  rtb_Y_j = PitchAlternateLaw_rtP.Subsystem_Gain * rtb_Product1_l;
  rtb_Divide_ox = (rtb_Y_j - PitchAlternateLaw_DWork.Delay_DSTATE_m) / rtb_time_dt;
  rtb_Minup = rtb_time_dt * PitchAlternateLaw_rtP.Subsystem_C1;
  rtb_Tsxlo = rtb_Minup + PitchAlternateLaw_rtP.Constant_Value_jj;
  PitchAlternateLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Tsxlo * (PitchAlternateLaw_rtP.Constant_Value_jj - rtb_Minup) *
    PitchAlternateLaw_DWork.Delay1_DSTATE_n + (rtb_Divide_ox + PitchAlternateLaw_DWork.Delay_DSTATE_k2) * (rtb_Minup /
    rtb_Tsxlo);
  if (static_cast<real_T>(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active) >
      PitchAlternateLaw_rtP.Switch2_Threshold) {
    rtb_Minup = (((((rtb_Y_m - rtb_Product1_l) * PitchAlternateLaw_rtP.Gain6_Gain +
                    PitchAlternateLaw_rtP.precontrol_gain_HSP_Gain * PitchAlternateLaw_DWork.Delay1_DSTATE_l) +
                   PitchAlternateLaw_rtP.v_dot_gain_HSP_Gain * PitchAlternateLaw_DWork.Delay1_DSTATE_n) +
                  PitchAlternateLaw_rtP.qk_gain_HSP_Gain * rtb_Gain_hu) + PitchAlternateLaw_rtP.qk_dot_gain1_Gain *
                 rtb_Gain_hr) * PitchAlternateLaw_rtP.HSP_gain_Gain;
    if (rtb_Minup > PitchAlternateLaw_rtP.Saturation4_UpperSat) {
      rtb_Minup = PitchAlternateLaw_rtP.Saturation4_UpperSat;
    } else if (rtb_Minup < PitchAlternateLaw_rtP.Saturation4_LowerSat) {
      rtb_Minup = PitchAlternateLaw_rtP.Saturation4_LowerSat;
    }
  } else {
    rtb_Minup = PitchAlternateLaw_rtP.Constant1_Value;
  }

  rtb_Y_nv /= std::cos(PitchAlternateLaw_rtP.Gain1_Gain_l4 * rtb_Gain_a);
  if (rtb_Gain_o > PitchAlternateLaw_rtP.Saturation3_UpperSat_b) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation3_UpperSat_b;
  } else if (rtb_Gain_o < PitchAlternateLaw_rtP.Saturation3_LowerSat_e) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation3_LowerSat_e;
  } else {
    rtb_Y_m = rtb_Gain_o;
  }

  rtb_Tsxlo = rtb_Gain_f - rtb_Y_nv;
  rtb_Y_m = (PitchAlternateLaw_rtP.Gain1_Gain_e * rtb_Gain_hu * (PitchAlternateLaw_rtP.Gain_Gain_b *
              PitchAlternateLaw_rtP.Vm_currentms_Value) + rtb_Tsxlo) - (look1_binlxpw(rtb_Gain_o,
    PitchAlternateLaw_rtP.uDLookupTable_bp01Data, PitchAlternateLaw_rtP.uDLookupTable_tableData, 6U) /
    (PitchAlternateLaw_rtP.Gain5_Gain * rtb_Y_m) + PitchAlternateLaw_rtP.Bias_Bias) * (((rtb_Sum_g + rtb_Minup) +
    rtb_Divide) - rtb_Y_nv);
  rtb_Product1_l = rtb_Y_m * look1_binlxpw(rtb_Gain_o, PitchAlternateLaw_rtP.PLUT_bp01Data,
    PitchAlternateLaw_rtP.PLUT_tableData, 1U);
  rtb_Gain_f = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain * rtb_Gain_hu;
  rtb_Gain_a = rtb_Y_m * look1_binlxpw(rtb_Gain_o, PitchAlternateLaw_rtP.DLUT_bp01Data,
    PitchAlternateLaw_rtP.DLUT_tableData, 1U) * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Gain_hr = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain * rtb_Gain_o;
  rtb_Y_m = rtb_Gain_hr - PitchAlternateLaw_DWork.Delay_DSTATE_d;
  PitchAlternateLaw_LagFilter(rtb_Y_m / rtb_time_dt, PitchAlternateLaw_rtP.LagFilter_C1_p, rtb_time_dt, &rtb_Y_m,
    &PitchAlternateLaw_DWork.sf_LagFilter_i);
  if (rtb_Y_m > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Y_m = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Y_m < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Y_m = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat;
  }

  rtb_Sum_g = (((rtb_Gain_f - PitchAlternateLaw_DWork.Delay_DSTATE_kd) / rtb_time_dt * PitchAlternateLaw_rtP.Gain3_Gain
                + rtb_Product1_l) + (rtb_Gain_a - PitchAlternateLaw_DWork.Delay_DSTATE_jh) / rtb_time_dt) +
    PitchAlternateLaw_rtP.Gain_Gain_f * rtb_Y_m;
  PitchAlternateLaw_WashoutFilter(std::fmin
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos,
     rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchAlternateLaw_rtP.WashoutFilter_C1_l, rtb_time_dt, &rtb_Y_m, &PitchAlternateLaw_DWork.sf_WashoutFilter);
  if (rtb_Y_m > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat) {
    y = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Y_m < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat) {
    y = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat;
  } else {
    y = rtb_Y_m;
  }

  rtb_Product1_l = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_i * rtb_Gain_hu;
  if (rtb_Gain_o > PitchAlternateLaw_rtP.Saturation3_UpperSat_a) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation3_UpperSat_a;
  } else if (rtb_Gain_o < PitchAlternateLaw_rtP.Saturation3_LowerSat_l) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation3_LowerSat_l;
  } else {
    rtb_Y_m = rtb_Gain_o;
  }

  rtb_Y_m = (PitchAlternateLaw_rtP.Gain1_Gain_o * rtb_Gain_hu * (PitchAlternateLaw_rtP.Gain_Gain_a *
              PitchAlternateLaw_rtP.Vm_currentms_Value_e) + rtb_Tsxlo) - (look1_binlxpw(rtb_Gain_o,
    PitchAlternateLaw_rtP.uDLookupTable_bp01Data_o, PitchAlternateLaw_rtP.uDLookupTable_tableData_e, 6U) /
    (PitchAlternateLaw_rtP.Gain5_Gain_d * rtb_Y_m) + PitchAlternateLaw_rtP.Bias_Bias_a) * (rtb_Y - rtb_Y_nv);
  rtb_Minup = rtb_Y_m * look1_binlxpw(rtb_Gain_o, PitchAlternateLaw_rtP.PLUT_bp01Data_b,
    PitchAlternateLaw_rtP.PLUT_tableData_b, 1U);
  rtb_Y = rtb_Y_m * look1_binlxpw(rtb_Gain_o, PitchAlternateLaw_rtP.DLUT_bp01Data_h,
    PitchAlternateLaw_rtP.DLUT_tableData_p, 1U) * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_j;
  rtb_Divide = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_e * rtb_Gain_o;
  rtb_Y_m = rtb_Divide - PitchAlternateLaw_DWork.Delay_DSTATE_df;
  PitchAlternateLaw_LagFilter(rtb_Y_m / rtb_time_dt, PitchAlternateLaw_rtP.LagFilter_C1_pw, rtb_time_dt, &rtb_Y_m,
    &PitchAlternateLaw_DWork.sf_LagFilter_g3);
  if (rtb_Y_m > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_j) {
    rtb_Y_m = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_j;
  } else if (rtb_Y_m < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Y_m = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_e;
  }

  rtb_Sum1_d = (((rtb_Product1_l - PitchAlternateLaw_DWork.Delay_DSTATE_l) / rtb_time_dt *
                 PitchAlternateLaw_rtP.Gain3_Gain_m + rtb_Minup) + (rtb_Y - PitchAlternateLaw_DWork.Delay_DSTATE_kw) /
                rtb_time_dt) + PitchAlternateLaw_rtP.Gain_Gain_j * rtb_Y_m;
  PitchAlternateLaw_WashoutFilter(std::fmin
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos,
     rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchAlternateLaw_rtP.WashoutFilter_C1_n, rtb_time_dt, &rtb_Y_m, &PitchAlternateLaw_DWork.sf_WashoutFilter_c);
  if (rtb_Y_m > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_g) {
    y_0 = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_g;
  } else if (rtb_Y_m < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j) {
    y_0 = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_j;
  } else {
    y_0 = rtb_Y_m;
  }

  rtb_Minup = PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * rtb_Gain_hu;
  if (rtb_Gain_o > PitchAlternateLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_Gain_o < PitchAlternateLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Y_m = PitchAlternateLaw_rtP.Saturation3_LowerSat_a;
  } else {
    rtb_Y_m = rtb_Gain_o;
  }

  rtb_Y_m = (PitchAlternateLaw_rtP.Gain1_Gain_b * rtb_Gain_hu * (PitchAlternateLaw_rtP.Gain_Gain_p *
              PitchAlternateLaw_rtP.Vm_currentms_Value_p) + rtb_Tsxlo) - (look1_binlxpw(rtb_Gain_o,
    PitchAlternateLaw_rtP.uDLookupTable_bp01Data_a, PitchAlternateLaw_rtP.uDLookupTable_tableData_p, 6U) /
    (PitchAlternateLaw_rtP.Gain5_Gain_n * rtb_Y_m) + PitchAlternateLaw_rtP.Bias_Bias_ai) * (rtb_ManualSwitch - rtb_Y_nv);
  rtb_Gain_hu = rtb_Y_m * look1_binlxpw(rtb_Gain_o, PitchAlternateLaw_rtP.DLUT_bp01Data_k,
    PitchAlternateLaw_rtP.DLUT_tableData_e, 1U) * PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_ManualSwitch = ((rtb_Minup - PitchAlternateLaw_DWork.Delay_DSTATE_e) / rtb_time_dt *
                      PitchAlternateLaw_rtP.Gain3_Gain_b + rtb_Y_m * look1_binlxpw(rtb_Gain_o,
    PitchAlternateLaw_rtP.PLUT_bp01Data_a, PitchAlternateLaw_rtP.PLUT_tableData_o, 1U)) + (rtb_Gain_hu -
    PitchAlternateLaw_DWork.Delay_DSTATE_gz) / rtb_time_dt;
  rtb_Gain_o *= PitchAlternateLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a;
  rtb_Y_nv = rtb_Gain_o - PitchAlternateLaw_DWork.Delay_DSTATE_lf;
  PitchAlternateLaw_LagFilter(rtb_Y_nv / rtb_time_dt, PitchAlternateLaw_rtP.LagFilter_C1_l, rtb_time_dt, &rtb_Y_nv,
    &PitchAlternateLaw_DWork.sf_LagFilter_g);
  if (rtb_Y_nv > PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Y_nv = PitchAlternateLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Y_nv < PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_ek) {
    rtb_Y_nv = PitchAlternateLaw_rtP.SaturationV_dot_LowerSat_ek;
  }

  rtb_Tsxlo = PitchAlternateLaw_rtP.Gain_Gain_k * rtb_Y_nv;
  PitchAlternateLaw_WashoutFilter(std::fmin
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos,
     rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchAlternateLaw_rtP.WashoutFilter_C1_h, rtb_time_dt, &rtb_Y_nv, &PitchAlternateLaw_DWork.sf_WashoutFilter_d);
  rtb_Y_m = look1_binlxpw(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft,
    PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1_f, PitchAlternateLaw_rtP.ScheduledGain_Table_h, 3U);
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos = y_0 * look1_binlxpw
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft,
     PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1_n, PitchAlternateLaw_rtP.ScheduledGain_Table_b, 3U) +
    rtb_Sum1_d;
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos >
      PitchAlternateLaw_rtP.Saturation_UpperSat_h) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = PitchAlternateLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos <
             PitchAlternateLaw_rtP.Saturation_LowerSat_a) {
    rtb_TmpSignalConversionAtSFunctionInport1[0] = PitchAlternateLaw_rtP.Saturation_LowerSat_a;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[0] =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos;
  }

  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos = y * look1_binlxpw
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_H_radio_ft,
     PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1, PitchAlternateLaw_rtP.ScheduledGain_Table, 3U) +
    rtb_Sum_g;
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos >
      PitchAlternateLaw_rtP.Saturation_UpperSat_k) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = PitchAlternateLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos <
             PitchAlternateLaw_rtP.Saturation_LowerSat_p) {
    rtb_TmpSignalConversionAtSFunctionInport1[1] = PitchAlternateLaw_rtP.Saturation_LowerSat_p;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[1] =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos;
  }

  if (rtb_Y_nv > PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Y_nv = PitchAlternateLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Y_nv < PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Y_nv = PitchAlternateLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos = (rtb_ManualSwitch + rtb_Tsxlo)
    + rtb_Y_nv * rtb_Y_m;
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos >
      PitchAlternateLaw_rtP.Saturation_UpperSat_j) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = PitchAlternateLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos <
             PitchAlternateLaw_rtP.Saturation_LowerSat_d) {
    rtb_TmpSignalConversionAtSFunctionInport1[2] = PitchAlternateLaw_rtP.Saturation_LowerSat_d;
  } else {
    rtb_TmpSignalConversionAtSFunctionInport1[2] =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_left_pos;
  }

  if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[1]) {
    if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      rtb_in_rotation = 1;
    } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
      rtb_in_rotation = 2;
    } else {
      rtb_in_rotation = 0;
    }
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[0] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    rtb_in_rotation = 0;
  } else if (rtb_TmpSignalConversionAtSFunctionInport1[1] < rtb_TmpSignalConversionAtSFunctionInport1[2]) {
    rtb_in_rotation = 2;
  } else {
    rtb_in_rotation = 1;
  }

  rtb_Y_nv = rtb_TmpSignalConversionAtSFunctionInport1[rtb_in_rotation] * look1_binlxpw(rtb_time_dt,
    PitchAlternateLaw_rtP.ScheduledGain_BreakpointsForDimension1_d, PitchAlternateLaw_rtP.ScheduledGain_Table_hh, 4U) *
    PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * rtb_time_dt;
  PitchAlternateLaw_DWork.icLoad = ((rtb_Y_f == 0.0) ||
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on ||
    PitchAlternateLaw_DWork.icLoad);
  if (PitchAlternateLaw_DWork.icLoad) {
    if (PitchAlternateLaw_B.in_flight <= PitchAlternateLaw_rtP.Switch_Threshold) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_eta_deg = PitchAlternateLaw_rtP.Gain_Gain *
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos;
    }

    PitchAlternateLaw_DWork.Delay_DSTATE_o = rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_eta_deg
      - rtb_Y_nv;
  }

  PitchAlternateLaw_DWork.Delay_DSTATE_o += rtb_Y_nv;
  if (PitchAlternateLaw_DWork.Delay_DSTATE_o > PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (PitchAlternateLaw_DWork.Delay_DSTATE_o < PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit)
  {
    PitchAlternateLaw_DWork.Delay_DSTATE_o = PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  PitchAlternateLaw_RateLimiter(PitchAlternateLaw_DWork.Delay_DSTATE_o, PitchAlternateLaw_rtP.RateLimitereta_up,
    PitchAlternateLaw_rtP.RateLimitereta_lo, rtb_time_dt, PitchAlternateLaw_rtP.RateLimitereta_InitialCondition,
    &rtb_Y_m, &PitchAlternateLaw_DWork.sf_RateLimiter_b);
  if (rtb_eta_trim_deg_should_freeze == PitchAlternateLaw_rtP.CompareToConstant_const) {
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_eta_deg = PitchAlternateLaw_rtP.Constant_Value;
  } else {
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_eta_deg = PitchAlternateLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Y_nv = PitchAlternateLaw_rtP.Gain_Gain_c *
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_eta_deg *
    PitchAlternateLaw_rtP.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_time_dt;
  PitchAlternateLaw_DWork.icLoad_p = (rtb_eta_trim_deg_reset || PitchAlternateLaw_DWork.icLoad_p);
  if (PitchAlternateLaw_DWork.icLoad_p) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = rtb_eta_trim_deg_reset_deg - rtb_Y_nv;
  }

  PitchAlternateLaw_DWork.Delay_DSTATE_a += rtb_Y_nv;
  if (PitchAlternateLaw_DWork.Delay_DSTATE_a > rtb_uDLookupTable) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = rtb_uDLookupTable;
  } else if (PitchAlternateLaw_DWork.Delay_DSTATE_a < rtb_Saturation3_g) {
    PitchAlternateLaw_DWork.Delay_DSTATE_a = rtb_Saturation3_g;
  }

  PitchAlternateLaw_DWork.Delay_DSTATE_aa += std::fmax(std::fmin(PitchAlternateLaw_DWork.Delay_DSTATE_a -
    PitchAlternateLaw_DWork.Delay_DSTATE_aa, rtb_eta_trim_deg_rate_limit_up_deg_s * rtb_time_dt), rtb_time_dt *
    rtb_eta_trim_deg_rate_limit_lo_deg_s);
  *rty_Out_eta_deg = rtb_Y_m;
  *rty_Out_eta_trim_deg = PitchAlternateLaw_DWork.Delay_DSTATE_aa;
  PitchAlternateLaw_DWork.Delay_DSTATE_f = rtb_Gain;
  PitchAlternateLaw_DWork.Delay_DSTATE_g = rtb_Divide_dr;
  PitchAlternateLaw_DWork.Delay_DSTATE_j = rtb_Gain_c;
  PitchAlternateLaw_DWork.Delay_DSTATE_c = rtb_y_g;
  PitchAlternateLaw_DWork.Delay_DSTATE_k = rtb_Gain_b;
  PitchAlternateLaw_DWork.Delay_DSTATE_gl = rtb_Divide_ew;
  PitchAlternateLaw_DWork.Delay_DSTATE_m = rtb_Y_j;
  PitchAlternateLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_ox;
  PitchAlternateLaw_DWork.Delay_DSTATE_kd = rtb_Gain_f;
  PitchAlternateLaw_DWork.Delay_DSTATE_jh = rtb_Gain_a;
  PitchAlternateLaw_DWork.Delay_DSTATE_d = rtb_Gain_hr;
  PitchAlternateLaw_DWork.Delay_DSTATE_l = rtb_Product1_l;
  PitchAlternateLaw_DWork.Delay_DSTATE_kw = rtb_Y;
  PitchAlternateLaw_DWork.Delay_DSTATE_df = rtb_Divide;
  PitchAlternateLaw_DWork.Delay_DSTATE_e = rtb_Minup;
  PitchAlternateLaw_DWork.Delay_DSTATE_gz = rtb_Gain_hu;
  PitchAlternateLaw_DWork.Delay_DSTATE_lf = rtb_Gain_o;
  PitchAlternateLaw_DWork.icLoad = false;
  PitchAlternateLaw_DWork.icLoad_p = false;
}

PitchAlternateLaw::PitchAlternateLaw():
  PitchAlternateLaw_B(),
  PitchAlternateLaw_DWork()
{
}

PitchAlternateLaw::~PitchAlternateLaw()
{
}
