#include "PitchNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"
#include "look2_binlxpw.h"

const uint8_T PitchNormalLaw_IN_Flare_Reduce_Theta_c{ 1U };

const uint8_T PitchNormalLaw_IN_Flare_Set_Rate{ 2U };

const uint8_T PitchNormalLaw_IN_Flare_Store_Theta_c_deg{ 3U };

const uint8_T PitchNormalLaw_IN_Flight_High{ 4U };

const uint8_T PitchNormalLaw_IN_Flight_Low{ 5U };

const uint8_T PitchNormalLaw_IN_Ground{ 6U };

const uint8_T PitchNormalLaw_IN_frozen{ 1U };

const uint8_T PitchNormalLaw_IN_running{ 2U };

const uint8_T PitchNormalLaw_IN_Flight{ 1U };

const uint8_T PitchNormalLaw_IN_FlightToGroundTransition{ 2U };

const uint8_T PitchNormalLaw_IN_Ground_c{ 3U };

const uint8_T PitchNormalLaw_IN_automatic{ 1U };

const uint8_T PitchNormalLaw_IN_manual{ 2U };

const uint8_T PitchNormalLaw_IN_reset{ 3U };

const uint8_T PitchNormalLaw_IN_tracking{ 4U };

const uint8_T PitchNormalLaw_IN_flight_clean{ 1U };

const uint8_T PitchNormalLaw_IN_flight_flaps{ 2U };

const uint8_T PitchNormalLaw_IN_ground{ 3U };

const uint8_T PitchNormalLaw_IN_OFF{ 1U };

const uint8_T PitchNormalLaw_IN_ON{ 2U };

PitchNormalLaw::Parameters_PitchNormalLaw_T PitchNormalLaw::PitchNormalLaw_rtP{

  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  0.05,

  2.0,

  2.0,

  0.3,

  5.0,

  1.6,

  1.0,

  2.0,

  2.0,

  0.3,

  5.0,

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

  0.0,

  0.0,

  30.0,

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

  -30.0,


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },

  30.0,

  30.0,

  -0.2,

  -0.5,

  -0.5,

  -0.5,

  -1.0,

  -0.5,

  -0.33333333333333331,

  -4.0,

  -0.25,

  -1.0,

  -1.0,

  -0.5,

  -45.0,

  0.2,

  0.5,

  0.5,

  0.5,

  1.0,

  0.5,

  4.0,

  2.0,

  4.0,

  1.0,

  1.0,

  0.5,

  45.0,

  true,

  3.5,

  -11.0,

  0.0,

  -0.4,

  -0.4,

  1.4,

  -0.1,

  -0.6,

  0.2,

  0.75,

  -0.75,

  1.5,

  0.0,

  0.0,

  30.0,

  0.0,

  0.0,

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

  1.0,

  0.0,

  1.0,

  0.06,

  0.0,

  -0.8,

  1.0,

  0.0,

  1.0,

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

  0.0,

  1.0,

  0.0,

  2.0,

  0.0,

  -1.0,

  -1.2,

  0.0,

  2.0,

  0.0,

  -0.8,

  1.0,

  1.0,

  4.0,

  -4.0,

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

  0.2,

  0.2,

  1.0,

  -0.25,


  { -2.0, 0.0, 1.5 },


  { -1.0, 0.0, 1.0 },


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

  -15.0,

  0.2,

  0.25,

  -1.0,


  { -2.0, 0.0, 1.5 },


  { -1.0, 0.0, 1.0 },


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


  { 0.0, 0.0, 0.0, -0.75, -0.75, 0.0, 0.0, 0.0, -0.75, -0.75, 0.0, 0.0, 0.0, 0.0, -0.75, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0 },


  { -1.0, 0.0, 6.0, 11.0, 15.0 },


  { -1.0, 8.0, 18.0, 28.0, 40.0 },

  1.0,

  0.0,


  { -9.0, 0.0, 9.0 },


  { -1.0, 0.0, 1.0 },

  1.0,

  -2.0,

  4.0,

  0.2,

  1.0,

  2.5,

  -1.5,

  2.0,

  0.0,

  0.0,

  1.0,

  0.0,

  1.0,

  1.0,

  0.0,

  1.0,

  0.076923076923076927,


  { 4U, 4U },

  1U,

  1U
};

void PitchNormalLaw::PitchNormalLaw_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_PitchNormalLaw_T *localDW)
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

void PitchNormalLaw::PitchNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchNormalLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void PitchNormalLaw::PitchNormalLaw_eta_trim_limit_lofreeze(real_T rtu_eta_trim, boolean_T rtu_trigger, real_T *rty_y,
  rtDW_eta_trim_limit_lofreeze_PitchNormalLaw_T *localDW)
{
  if ((!rtu_trigger) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void PitchNormalLaw::PitchNormalLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_PitchNormalLaw_T *localDW)
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

void PitchNormalLaw::PitchNormalLaw_VoterAttitudeProtection(real_T rtu_input, real_T rtu_input_l, real_T rtu_input_o,
  real_T *rty_vote)
{
  real_T rtb_TmpSignalConversionAtSFunctionInport1[3];
  int32_T rtu_input_0;
  rtb_TmpSignalConversionAtSFunctionInport1[0] = rtu_input;
  rtb_TmpSignalConversionAtSFunctionInport1[1] = rtu_input_l;
  rtb_TmpSignalConversionAtSFunctionInport1[2] = rtu_input_o;
  if (rtu_input < rtu_input_l) {
    if (rtu_input_l < rtu_input_o) {
      rtu_input_0 = 1;
    } else if (rtu_input < rtu_input_o) {
      rtu_input_0 = 2;
    } else {
      rtu_input_0 = 0;
    }
  } else if (rtu_input < rtu_input_o) {
    rtu_input_0 = 0;
  } else if (rtu_input_l < rtu_input_o) {
    rtu_input_0 = 2;
  } else {
    rtu_input_0 = 1;
  }

  *rty_vote = rtb_TmpSignalConversionAtSFunctionInport1[rtu_input_0];
}

void PitchNormalLaw::init(void)
{
  PitchNormalLaw_DWork.Delay_DSTATE = PitchNormalLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_b = PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_k = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_g = PitchNormalLaw_rtP.Delay_InitialCondition;
  PitchNormalLaw_DWork.Delay1_DSTATE = PitchNormalLaw_rtP.Delay1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_m = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_k2 = PitchNormalLaw_rtP.Delay_InitialCondition_h;
  PitchNormalLaw_DWork.Delay1_DSTATE_n = PitchNormalLaw_rtP.Delay1_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_mz = PitchNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_kd = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_j = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_d = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchNormalLaw_DWork.Delay_DSTATE_e = PitchNormalLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_f = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_g5 = PitchNormalLaw_rtP.Delay_InitialCondition_o;
  PitchNormalLaw_DWork.Delay1_DSTATE_f = PitchNormalLaw_rtP.Delay1_InitialCondition_b;
  PitchNormalLaw_DWork.Delay_DSTATE_jh = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  PitchNormalLaw_DWork.Delay_DSTATE_c = PitchNormalLaw_rtP.Delay_InitialCondition_e;
  PitchNormalLaw_DWork.Delay1_DSTATE_i = PitchNormalLaw_rtP.Delay1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_l = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  PitchNormalLaw_DWork.Delay_DSTATE_kw = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  PitchNormalLaw_DWork.Delay_DSTATE_df = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_dn;
  PitchNormalLaw_DWork.Delay_DSTATE_e5 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchNormalLaw_DWork.Delay_DSTATE_gz = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_lf = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchNormalLaw_DWork.Delay_DSTATE_h = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l3;
  PitchNormalLaw_DWork.Delay_DSTATE_n = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  PitchNormalLaw_DWork.Delay_DSTATE_cr = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_b;
  PitchNormalLaw_DWork.Delay_DSTATE_ho = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_ds = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_jt = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  PitchNormalLaw_DWork.Delay_DSTATE_ej = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_b;
  PitchNormalLaw_DWork.Delay_DSTATE_e4 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_p;
  PitchNormalLaw_DWork.icLoad = true;
  PitchNormalLaw_DWork.icLoad_o = true;
  PitchNormalLaw_DWork.icLoad_p = true;
  PitchNormalLaw_DWork.Delay_DSTATE_aa = PitchNormalLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition_m;
}

void PitchNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_time_simulation_time, const real_T
  *rtu_In_nz_g, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const
  real_T *rtu_In_qk_dot_deg_s2, const real_T *rtu_In_eta_deg, const real_T *rtu_In_eta_trim_deg, const real_T
  *rtu_In_alpha_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft,
  const real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const real_T
  *rtu_In_spoilers_right_pos, const real_T *rtu_In_thrust_lever_1_pos, const real_T *rtu_In_thrust_lever_2_pos, const
  boolean_T *rtu_In_tailstrike_protection_on, const real_T *rtu_In_VLS_kn, const real_T *rtu_In_delta_eta_pos, const
  boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T *rtu_In_high_aoa_prot_active,
  const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_alpha_prot, const real_T *rtu_In_alpha_max, const
  real_T *rtu_In_high_speed_prot_high_kn, const real_T *rtu_In_high_speed_prot_low_kn, real_T *rty_Out_eta_deg, real_T
  *rty_Out_eta_trim_deg)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T rtb_BusAssignment_k_data_computed_delta_eta_deg;
  real_T rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_lo;
  real_T rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_up;
  real_T rtb_BusAssignment_k_data_computed_in_rotation_gain;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_qk_dot_deg_s2;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos;
  real_T rtb_Delay_ad;
  real_T rtb_Delay_c;
  real_T rtb_Divide;
  real_T rtb_Divide_d;
  real_T rtb_Divide_kb;
  real_T rtb_Divide_kz;
  real_T rtb_Gain;
  real_T rtb_Gain_bi;
  real_T rtb_Gain_bk;
  real_T rtb_Gain_bws;
  real_T rtb_Gain_fb;
  real_T rtb_Gain_g;
  real_T rtb_Gain_gm;
  real_T rtb_Gain_h;
  real_T rtb_Gain_hn;
  real_T rtb_Gain_ht;
  real_T rtb_Gain_k2;
  real_T rtb_Gain_l;
  real_T rtb_Gain_lm;
  real_T rtb_Gain_o;
  real_T rtb_Gain_o2;
  real_T rtb_Gain_pj;
  real_T rtb_Loaddemand;
  real_T rtb_ManualSwitch;
  real_T rtb_Minup;
  real_T rtb_Product;
  real_T rtb_Product1_bl;
  real_T rtb_Product1_eq;
  real_T rtb_Sum1_bz;
  real_T rtb_Sum1_h3;
  real_T rtb_Tsxlo;
  real_T rtb_Y;
  real_T rtb_Y_a;
  real_T rtb_Y_m;
  real_T rtb_Y_p;
  real_T rtb_eta_trim_deg_reset_deg;
  real_T rtb_time_dt;
  real_T rtb_uDLookupTable;
  real_T rtb_vote_n;
  real_T rtb_y_g;
  int32_T rtb_in_flare;
  int32_T rtb_in_rotation;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tailstrike_protection_on;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on;
  boolean_T rtb_eta_trim_deg_reset;
  boolean_T rtb_eta_trim_deg_should_freeze;
  rtb_time_dt = *rtu_In_time_dt;
  rtb_Y = *rtu_In_time_simulation_time;
  rtb_Gain_bi = *rtu_In_nz_g;
  rtb_Gain_bws = *rtu_In_Theta_deg;
  rtb_Gain_k2 = *rtu_In_Phi_deg;
  rtb_Delay_ad = *rtu_In_qk_deg_s;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_qk_dot_deg_s2 = *rtu_In_qk_dot_deg_s2;
  rtb_Sum1_h3 = *rtu_In_eta_deg;
  rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
  rtb_Divide_kb = *rtu_In_alpha_deg;
  rtb_Gain_hn = *rtu_In_V_ias_kn;
  rtb_Gain_ht = *rtu_In_V_tas_kn;
  rtb_Gain_lm = *rtu_In_H_radio_ft;
  rtb_Gain_o2 = *rtu_In_flaps_handle_index;
  rtb_Gain_o = *rtu_In_spoilers_left_pos;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos = *rtu_In_spoilers_right_pos;
  rtb_Y_a = *rtu_In_thrust_lever_1_pos;
  rtb_ManualSwitch = *rtu_In_thrust_lever_2_pos;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tailstrike_protection_on =
    *rtu_In_tailstrike_protection_on;
  rtb_Product1_bl = *rtu_In_VLS_kn;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos = *rtu_In_delta_eta_pos;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground = *rtu_In_on_ground;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on = *rtu_In_tracking_mode_on;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active =
    *rtu_In_high_aoa_prot_active;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active =
    *rtu_In_high_speed_prot_active;
  rtb_Gain_fb = *rtu_In_alpha_prot;
  rtb_y_g = *rtu_In_alpha_max;
  rtb_Gain = *rtu_In_high_speed_prot_high_kn;
  rtb_Divide_d = *rtu_In_high_speed_prot_low_kn;
  PitchNormalLaw_eta_trim_limit_lofreeze(rtb_eta_trim_deg_reset_deg,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active, &rtb_Y_p,
    &PitchNormalLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active) {
    rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_lo = rtb_Y_p;
  } else {
    rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_lo = PitchNormalLaw_rtP.Constant3_Value;
  }

  PitchNormalLaw_eta_trim_limit_lofreeze(rtb_eta_trim_deg_reset_deg,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active, &rtb_Y_p,
    &PitchNormalLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active) {
    rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_up = rtb_Y_p;
  } else {
    rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_up = PitchNormalLaw_rtP.Constant2_Value;
  }

  if (PitchNormalLaw_DWork.is_active_c3_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c3_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Ground_c;
    PitchNormalLaw_B.in_flight = 0.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c3_PitchNormalLaw) {
     case PitchNormalLaw_IN_Flight:
      if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground && (rtb_Gain_bws < 2.5)) {
        PitchNormalLaw_DWork.on_ground_time = rtb_Y;
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_FlightToGroundTransition;
      } else {
        PitchNormalLaw_B.in_flight = 1.0;
      }
      break;

     case PitchNormalLaw_IN_FlightToGroundTransition:
      if (rtb_Y - PitchNormalLaw_DWork.on_ground_time >= 5.0) {
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Ground_c;
        PitchNormalLaw_B.in_flight = 0.0;
      } else if ((!rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground) || (rtb_Gain_bws >=
                  2.5)) {
        PitchNormalLaw_DWork.on_ground_time = 0.0;
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        PitchNormalLaw_B.in_flight = 1.0;
      }
      break;

     default:
      if (((!rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground) && (rtb_Gain_bws > 8.0)) ||
          (rtb_Gain_lm > 400.0)) {
        PitchNormalLaw_DWork.on_ground_time = 0.0;
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        PitchNormalLaw_B.in_flight = 1.0;
      } else {
        PitchNormalLaw_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (PitchNormalLaw_B.in_flight > PitchNormalLaw_rtP.Saturation_UpperSat_c) {
    rtb_BusAssignment_k_data_computed_in_rotation_gain = PitchNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (PitchNormalLaw_B.in_flight < PitchNormalLaw_rtP.Saturation_LowerSat_n) {
    rtb_BusAssignment_k_data_computed_in_rotation_gain = PitchNormalLaw_rtP.Saturation_LowerSat_n;
  } else {
    rtb_BusAssignment_k_data_computed_in_rotation_gain = PitchNormalLaw_B.in_flight;
  }

  PitchNormalLaw_RateLimiter(rtb_BusAssignment_k_data_computed_in_rotation_gain,
    PitchNormalLaw_rtP.RateLimiterVariableTs_up, PitchNormalLaw_rtP.RateLimiterVariableTs_lo, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y, &PitchNormalLaw_DWork.sf_RateLimiter);
  if (PitchNormalLaw_DWork.is_active_c6_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c6_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else if (PitchNormalLaw_DWork.is_c6_PitchNormalLaw == PitchNormalLaw_IN_OFF) {
    if ((rtb_Y < 1.0) && (rtb_Gain_ht > 70.0) && ((rtb_Y_a >= 35.0) || (rtb_ManualSwitch >= 35.0))) {
      PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_ON;
      rtb_in_rotation = 1;
    } else {
      rtb_in_rotation = 0;
    }
  } else if ((rtb_Y == 1.0) || (rtb_Gain_lm > 400.0) || ((rtb_Gain_ht < 70.0) && ((rtb_Y_a < 35.0) || (rtb_ManualSwitch <
    35.0)))) {
    PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else {
    rtb_in_rotation = 1;
  }

  PitchNormalLaw_LagFilter(rtb_Gain_bws, PitchNormalLaw_rtP.LagFilter_C1, rtb_time_dt, &rtb_Y_a,
    &PitchNormalLaw_DWork.sf_LagFilter);
  if (PitchNormalLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = PitchNormalLaw_rtP.Constant1_Value_k;
  } else {
    rtb_ManualSwitch = PitchNormalLaw_rtP.Constant_Value_p;
  }

  if (PitchNormalLaw_DWork.is_active_c2_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c2_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Ground;
    rtb_in_flare = 0;
    PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
    PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c2_PitchNormalLaw) {
     case PitchNormalLaw_IN_Flare_Reduce_Theta_c:
      if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Ground;
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else if ((rtb_Gain_lm > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
      }
      break;

     case PitchNormalLaw_IN_Flare_Set_Rate:
      if (PitchNormalLaw_rtP.ManualSwitch1_CurrentSetting == 1) {
        rtb_BusAssignment_k_data_computed_in_rotation_gain = PitchNormalLaw_rtP.Constant1_Value_k;
      } else {
        rtb_BusAssignment_k_data_computed_in_rotation_gain = PitchNormalLaw_rtP.Constant_Value_p;
      }

      if ((rtb_Gain_lm <= 30.0) || (rtb_BusAssignment_k_data_computed_in_rotation_gain == 1.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Reduce_Theta_c;
        rtb_in_flare = 1;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
      } else if ((rtb_Gain_lm > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case PitchNormalLaw_IN_Flare_Store_Theta_c_deg:
      if ((rtb_Gain_lm > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -(rtb_Y_a + 2.0) / 8.0;
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Set_Rate;
        rtb_in_flare = 1;
      }
      break;

     case PitchNormalLaw_IN_Flight_High:
      if ((rtb_Gain_lm <= 50.0) || (rtb_ManualSwitch == 1.0)) {
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Store_Theta_c_deg;
        rtb_in_flare = 1;
      } else {
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     case PitchNormalLaw_IN_Flight_Low:
      if (rtb_Gain_lm > 50.0) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_High;
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     default:
      if (PitchNormalLaw_B.in_flight == 1.0) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_a;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;
    }
  }

  if (rtb_in_rotation > PitchNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Y_a = PitchNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_in_rotation < PitchNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Y_a = PitchNormalLaw_rtP.Saturation1_LowerSat;
  } else {
    rtb_Y_a = rtb_in_rotation;
  }

  PitchNormalLaw_RateLimiter(rtb_Y_a, PitchNormalLaw_rtP.RateLimiterVariableTs1_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_lo, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_BusAssignment_k_data_computed_in_rotation_gain,
    &PitchNormalLaw_DWork.sf_RateLimiter_p);
  if (PitchNormalLaw_DWork.is_active_c7_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c7_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
    rtb_Y_a = 0.7;
    rtb_ManualSwitch = -0.7;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c7_PitchNormalLaw) {
     case PitchNormalLaw_IN_flight_clean:
      if (rtb_Gain_o2 != 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_flaps;
        rtb_Y_a = 0.7;
        rtb_ManualSwitch = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
        rtb_Y_a = 0.7;
        rtb_ManualSwitch = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_Y_a = 0.3;
        rtb_ManualSwitch = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      }
      break;

     case PitchNormalLaw_IN_flight_flaps:
      if (rtb_Gain_o2 == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_clean;
        rtb_Y_a = 0.3;
        rtb_ManualSwitch = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
        rtb_Y_a = 0.7;
        rtb_ManualSwitch = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_Y_a = 0.7;
        rtb_ManualSwitch = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;

     default:
      if ((PitchNormalLaw_B.in_flight != 0.0) && (rtb_Gain_o2 == 0.0)) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_clean;
        rtb_Y_a = 0.3;
        rtb_ManualSwitch = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((PitchNormalLaw_B.in_flight != 0.0) && (rtb_Gain_o2 != 0.0)) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_flaps;
        rtb_Y_a = 0.7;
        rtb_ManualSwitch = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_Y_a = 0.7;
        rtb_ManualSwitch = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;
    }
  }

  PitchNormalLaw_RateLimiter(rtb_nz_limit_up_g, PitchNormalLaw_rtP.RateLimiterVariableTs2_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_lo, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_vote_n, &PitchNormalLaw_DWork.sf_RateLimiter_c);
  PitchNormalLaw_RateLimiter(rtb_nz_limit_lo_g, PitchNormalLaw_rtP.RateLimiterVariableTs3_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs3_lo, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_p, &PitchNormalLaw_DWork.sf_RateLimiter_n);
  if (PitchNormalLaw_DWork.is_active_c9_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c9_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (PitchNormalLaw_DWork.is_c9_PitchNormalLaw == PitchNormalLaw_IN_frozen) {
    if ((rtb_in_flare == 0) && (rtb_Gain_bi < 1.25) && (rtb_Gain_bi > 0.5) && (std::abs(rtb_Gain_k2) <= 30.0)) {
      PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if ((rtb_in_flare != 0) || (rtb_Gain_bi >= 1.25) || (rtb_Gain_bi <= 0.5) || (std::abs(rtb_Gain_k2) > 30.0)) {
    PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  if (PitchNormalLaw_DWork.is_active_c8_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c8_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_manual;
    rtb_eta_trim_deg_reset = true;
  } else {
    switch (PitchNormalLaw_DWork.is_c8_PitchNormalLaw) {
     case PitchNormalLaw_IN_automatic:
      if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_reset;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      } else if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_tracking;
        rtb_eta_trim_deg_reset = true;
      } else {
        rtb_eta_trim_deg_reset = false;
      }
      break;

     case PitchNormalLaw_IN_manual:
      if (PitchNormalLaw_B.in_flight != 0.0) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
      } else {
        rtb_eta_trim_deg_reset = true;
      }
      break;

     case PitchNormalLaw_IN_reset:
      if ((PitchNormalLaw_B.in_flight == 0.0) && (rtb_eta_trim_deg_reset_deg == 0.0)) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_manual;
        rtb_eta_trim_deg_reset = true;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      }
      break;

     default:
      if (!rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
      } else {
        rtb_eta_trim_deg_reset = true;
      }
      break;
    }
  }

  PitchNormalLaw_DWork.Delay_DSTATE += std::fmax(std::fmin(PitchNormalLaw_B.flare_Theta_c_deg -
    PitchNormalLaw_DWork.Delay_DSTATE, std::abs(PitchNormalLaw_B.flare_Theta_c_rate_deg_s) * rtb_time_dt), rtb_time_dt *
    PitchNormalLaw_B.flare_Theta_c_rate_deg_s);
  rtb_BusAssignment_k_data_computed_delta_eta_deg = PitchNormalLaw_rtP.Gain_Gain *
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos;
  rtb_Gain_bk = rtb_vote_n;
  rtb_Gain_pj = rtb_Y_p;
  rtb_Minup = std::cos(PitchNormalLaw_rtP.Gain1_Gain * rtb_Gain_bws);
  if (rtb_Gain_k2 > PitchNormalLaw_rtP.Saturation_UpperSat_f) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_UpperSat_f;
  } else if (rtb_Gain_k2 < PitchNormalLaw_rtP.Saturation_LowerSat_o) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_LowerSat_o;
  } else {
    rtb_Delay_c = rtb_Gain_k2;
  }

  rtb_Divide = rtb_Minup / std::cos(PitchNormalLaw_rtP.Gain1_Gain_l * rtb_Delay_c);
  PitchNormalLaw_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos,
    PitchNormalLaw_rtP.RateLimiterVariableTs_up_n, PitchNormalLaw_rtP.RateLimiterVariableTs_lo_c, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_p, &PitchNormalLaw_DWork.sf_RateLimiter_c2);
  rtb_Loaddemand = look1_binlxpw(rtb_Y_p, PitchNormalLaw_rtP.Loaddemand_bp01Data,
    PitchNormalLaw_rtP.Loaddemand_tableData, 2U);
  PitchNormalLaw_DWork.Delay_DSTATE_b += std::fmax(std::fmin
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos -
     PitchNormalLaw_DWork.Delay_DSTATE_b, PitchNormalLaw_rtP.RateLimiterVariableTs3_up_i * rtb_time_dt), rtb_time_dt *
    PitchNormalLaw_rtP.RateLimiterVariableTs3_lo_b);
  rtb_vote_n = std::fmax((rtb_Divide_d - rtb_Gain) * PitchNormalLaw_DWork.Delay_DSTATE_b, 0.0) + rtb_Divide_d;
  rtb_Gain = PitchNormalLaw_rtP.Subsystem2_Gain * rtb_vote_n;
  rtb_Divide_d = (rtb_Gain - PitchNormalLaw_DWork.Delay_DSTATE_k) / rtb_time_dt;
  rtb_Tsxlo = rtb_time_dt * PitchNormalLaw_rtP.Subsystem2_C1;
  rtb_Y_m = rtb_Tsxlo + PitchNormalLaw_rtP.Constant_Value_j;
  PitchNormalLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Y_m * (PitchNormalLaw_rtP.Constant_Value_j - rtb_Tsxlo) *
    PitchNormalLaw_DWork.Delay1_DSTATE + (rtb_Divide_d + PitchNormalLaw_DWork.Delay_DSTATE_g) * (rtb_Tsxlo / rtb_Y_m);
  rtb_Y_p = PitchNormalLaw_rtP.Subsystem_Gain * rtb_Gain_hn;
  rtb_Divide_kz = (rtb_Y_p - PitchNormalLaw_DWork.Delay_DSTATE_m) / rtb_time_dt;
  rtb_Tsxlo = rtb_time_dt * PitchNormalLaw_rtP.Subsystem_C1;
  rtb_Y_m = rtb_Tsxlo + PitchNormalLaw_rtP.Constant_Value_jj;
  PitchNormalLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Y_m * (PitchNormalLaw_rtP.Constant_Value_jj - rtb_Tsxlo) *
    PitchNormalLaw_DWork.Delay1_DSTATE_n + (rtb_Divide_kz + PitchNormalLaw_DWork.Delay_DSTATE_k2) * (rtb_Tsxlo / rtb_Y_m);
  if (static_cast<real_T>(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active) >
      PitchNormalLaw_rtP.Switch2_Threshold) {
    rtb_uDLookupTable = (((((rtb_vote_n - rtb_Gain_hn) * PitchNormalLaw_rtP.Gain6_Gain +
      PitchNormalLaw_rtP.precontrol_gain_HSP_Gain * PitchNormalLaw_DWork.Delay1_DSTATE) +
      PitchNormalLaw_rtP.v_dot_gain_HSP_Gain * PitchNormalLaw_DWork.Delay1_DSTATE_n) +
                          PitchNormalLaw_rtP.qk_gain_HSP_Gain * rtb_Delay_ad) + PitchNormalLaw_rtP.qk_dot_gain1_Gain *
                         rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_qk_dot_deg_s2) *
      PitchNormalLaw_rtP.HSP_gain_Gain;
    if (rtb_Loaddemand > PitchNormalLaw_rtP.Saturation8_UpperSat) {
      rtb_vote_n = PitchNormalLaw_rtP.Saturation8_UpperSat;
    } else if (rtb_Loaddemand < PitchNormalLaw_rtP.Saturation8_LowerSat) {
      rtb_vote_n = PitchNormalLaw_rtP.Saturation8_LowerSat;
    } else {
      rtb_vote_n = rtb_Loaddemand;
    }

    if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation4_UpperSat) {
      rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation4_UpperSat;
    } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation4_LowerSat) {
      rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation4_LowerSat;
    }

    rtb_Y_m = rtb_vote_n + rtb_uDLookupTable;
  } else {
    rtb_Y_m = PitchNormalLaw_rtP.Constant1_Value;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_mz += std::fmax(std::fmin(static_cast<real_T>
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_speed_prot_active) -
    PitchNormalLaw_DWork.Delay_DSTATE_mz, PitchNormalLaw_rtP.RateLimiterVariableTs4_up * rtb_time_dt), rtb_time_dt *
    PitchNormalLaw_rtP.RateLimiterVariableTs4_lo);
  if (PitchNormalLaw_DWork.Delay_DSTATE_mz > PitchNormalLaw_rtP.Saturation_UpperSat_e) {
    rtb_Tsxlo = PitchNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_mz < PitchNormalLaw_rtP.Saturation_LowerSat_m) {
    rtb_Tsxlo = PitchNormalLaw_rtP.Saturation_LowerSat_m;
  } else {
    rtb_Tsxlo = PitchNormalLaw_DWork.Delay_DSTATE_mz;
  }

  rtb_Product = rtb_Y_m * rtb_Tsxlo;
  PitchNormalLaw_RateLimiter(static_cast<real_T>(rtb_in_flare), PitchNormalLaw_rtP.RateLimiterVariableTs6_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_lo, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_InitialCondition, &rtb_vote_n, &PitchNormalLaw_DWork.sf_RateLimiter_l);
  if (rtb_vote_n > PitchNormalLaw_rtP.Saturation_UpperSat_h) {
    rtb_Y_m = PitchNormalLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_vote_n < PitchNormalLaw_rtP.Saturation_LowerSat_e) {
    rtb_Y_m = PitchNormalLaw_rtP.Saturation_LowerSat_e;
  } else {
    rtb_Y_m = rtb_vote_n;
  }

  rtb_uDLookupTable = (PitchNormalLaw_DWork.Delay_DSTATE - rtb_Gain_bws) * PitchNormalLaw_rtP.Gain_Gain_k;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_g) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_g;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_d) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_d;
  }

  rtb_Tsxlo = ((PitchNormalLaw_rtP.Constant_Value_m - rtb_Tsxlo) * rtb_Loaddemand + rtb_Product) +
    ((PitchNormalLaw_rtP.Constant_Value_g - rtb_Y_m) * PitchNormalLaw_rtP.Constant_Value_l + rtb_uDLookupTable * rtb_Y_m);
  rtb_Minup /= std::cos(PitchNormalLaw_rtP.Gain1_Gain_l4 * rtb_Gain_k2);
  rtb_Gain_l = rtb_Gain_bi - rtb_Minup;
  if (rtb_Gain_ht > PitchNormalLaw_rtP.Saturation3_UpperSat) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_UpperSat;
  } else if (rtb_Gain_ht < PitchNormalLaw_rtP.Saturation3_LowerSat) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_LowerSat;
  } else {
    rtb_Delay_c = rtb_Gain_ht;
  }

  rtb_Y_m = (PitchNormalLaw_rtP.Gain1_Gain_e * rtb_Delay_ad * (PitchNormalLaw_rtP.Gain_Gain_b *
              PitchNormalLaw_rtP.Vm_currentms_Value) + rtb_Gain_l) - (look1_binlxpw(rtb_Gain_ht,
    PitchNormalLaw_rtP.uDLookupTable_bp01Data, PitchNormalLaw_rtP.uDLookupTable_tableData, 6U) /
    (PitchNormalLaw_rtP.Gain5_Gain * rtb_Delay_c) + PitchNormalLaw_rtP.Bias_Bias) * ((rtb_Tsxlo + rtb_Divide) -
    rtb_Minup);
  rtb_Gain_bi = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain * rtb_Delay_ad;
  rtb_Divide = rtb_Y_m * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.DLUT_bp01Data, PitchNormalLaw_rtP.DLUT_tableData,
    1U) * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Loaddemand = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain * rtb_Gain_ht;
  PitchNormalLaw_LagFilter((rtb_Loaddemand - PitchNormalLaw_DWork.Delay_DSTATE_d) / rtb_time_dt,
    PitchNormalLaw_rtP.LagFilter_C1_p, rtb_time_dt, &rtb_vote_n, &PitchNormalLaw_DWork.sf_LagFilter_i);
  if (rtb_vote_n > PitchNormalLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Tsxlo = PitchNormalLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_vote_n < PitchNormalLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Tsxlo = PitchNormalLaw_rtP.SaturationV_dot_LowerSat;
  } else {
    rtb_Tsxlo = rtb_vote_n;
  }

  PitchNormalLaw_WashoutFilter(std::fmin(rtb_Gain_o,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchNormalLaw_rtP.WashoutFilter_C1, rtb_time_dt, &rtb_vote_n, &PitchNormalLaw_DWork.sf_WashoutFilter_l);
  PitchNormalLaw_DWork.Delay_DSTATE_e += std::fmax(std::fmin(static_cast<real_T>
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_high_aoa_prot_active) -
    PitchNormalLaw_DWork.Delay_DSTATE_e, PitchNormalLaw_rtP.RateLimiterVariableTs5_up * rtb_time_dt), rtb_time_dt *
    PitchNormalLaw_rtP.RateLimiterVariableTs5_lo);
  if (PitchNormalLaw_DWork.Delay_DSTATE_e > PitchNormalLaw_rtP.Saturation_UpperSat_eo) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_UpperSat_eo;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_e < PitchNormalLaw_rtP.Saturation_LowerSat_h) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Delay_c = PitchNormalLaw_DWork.Delay_DSTATE_e;
  }

  if (rtb_vote_n > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat) {
    rtb_vote_n = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_vote_n < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat) {
    rtb_vote_n = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat;
  }

  rtb_uDLookupTable = ((((rtb_Gain_bi - PitchNormalLaw_DWork.Delay_DSTATE_kd) / rtb_time_dt *
    PitchNormalLaw_rtP.Gain3_Gain + rtb_Y_m * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.PLUT_bp01Data,
    PitchNormalLaw_rtP.PLUT_tableData, 1U)) + (rtb_Divide - PitchNormalLaw_DWork.Delay_DSTATE_j) / rtb_time_dt) +
                       PitchNormalLaw_rtP.Gain_Gain_f * rtb_Tsxlo) + rtb_vote_n * look1_binlxpw(rtb_Gain_lm,
    PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1, PitchNormalLaw_rtP.ScheduledGain_Table, 3U);
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_k) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_p) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_p;
  }

  rtb_Product1_eq = (PitchNormalLaw_rtP.Constant_Value_f - rtb_Delay_c) * rtb_uDLookupTable;
  PitchNormalLaw_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_up_m, PitchNormalLaw_rtP.RateLimiterVariableTs2_lo_k, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_vote_n, &PitchNormalLaw_DWork.sf_RateLimiter_nx);
  rtb_y_g = (rtb_y_g - rtb_Gain_fb) * rtb_vote_n;
  PitchNormalLaw_LagFilter(rtb_Divide_kb, PitchNormalLaw_rtP.LagFilter1_C1, rtb_time_dt, &rtb_vote_n,
    &PitchNormalLaw_DWork.sf_LagFilter_m);
  rtb_Y_m = rtb_vote_n - rtb_Gain_fb;
  rtb_vote_n = rtb_y_g - rtb_Y_m;
  PitchNormalLaw_WashoutFilter(std::fmax(std::fmax(0.0, rtb_Gain_bws - 22.5), std::fmax(0.0, (std::abs(rtb_Gain_k2) -
    3.0) / 6.0)), PitchNormalLaw_rtP.WashoutFilter_C1_b, rtb_time_dt, &rtb_Y_m, &PitchNormalLaw_DWork.sf_WashoutFilter_h);
  rtb_Y_m = rtb_vote_n - rtb_Y_m;
  rtb_Gain_k2 = PitchNormalLaw_rtP.Subsystem1_Gain * rtb_Y_m;
  rtb_Divide_kb = (rtb_Gain_k2 - PitchNormalLaw_DWork.Delay_DSTATE_f) / rtb_time_dt;
  rtb_uDLookupTable = rtb_time_dt * PitchNormalLaw_rtP.Subsystem1_C1;
  rtb_vote_n = rtb_uDLookupTable + PitchNormalLaw_rtP.Constant_Value_ft;
  PitchNormalLaw_DWork.Delay1_DSTATE_f = 1.0 / rtb_vote_n * (PitchNormalLaw_rtP.Constant_Value_ft - rtb_uDLookupTable) *
    PitchNormalLaw_DWork.Delay1_DSTATE_f + (rtb_Divide_kb + PitchNormalLaw_DWork.Delay_DSTATE_g5) * (rtb_uDLookupTable /
    rtb_vote_n);
  rtb_vote_n = PitchNormalLaw_rtP.alpha_err_gain_Gain * rtb_Y_m;
  rtb_Gain_fb = PitchNormalLaw_rtP.Subsystem3_Gain * rtb_Gain_hn;
  rtb_y_g = (rtb_Gain_fb - PitchNormalLaw_DWork.Delay_DSTATE_jh) / rtb_time_dt;
  rtb_Y_m = rtb_time_dt * PitchNormalLaw_rtP.Subsystem3_C1;
  rtb_uDLookupTable = rtb_Y_m + PitchNormalLaw_rtP.Constant_Value_b;
  PitchNormalLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_uDLookupTable * (PitchNormalLaw_rtP.Constant_Value_b - rtb_Y_m) *
    PitchNormalLaw_DWork.Delay1_DSTATE_i + (rtb_y_g + PitchNormalLaw_DWork.Delay_DSTATE_c) * (rtb_Y_m /
    rtb_uDLookupTable);
  rtb_uDLookupTable = (((PitchNormalLaw_rtP.precontrol_gain_Gain * PitchNormalLaw_DWork.Delay1_DSTATE_f + rtb_vote_n) +
                        PitchNormalLaw_rtP.v_dot_gain_Gain * PitchNormalLaw_DWork.Delay1_DSTATE_i) +
                       PitchNormalLaw_rtP.qk_gain_Gain * rtb_Delay_ad) + PitchNormalLaw_rtP.qk_dot_gain_Gain *
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_qk_dot_deg_s2;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation3_UpperSat_f) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_UpperSat_f;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation3_LowerSat_c) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_LowerSat_c;
  }

  rtb_Y_m = rtb_uDLookupTable * rtb_Delay_c;
  rtb_Product = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_i * rtb_Delay_ad;
  if (rtb_Gain_ht > PitchNormalLaw_rtP.Saturation3_UpperSat_a) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_UpperSat_a;
  } else if (rtb_Gain_ht < PitchNormalLaw_rtP.Saturation3_LowerSat_l) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_LowerSat_l;
  } else {
    rtb_Delay_c = rtb_Gain_ht;
  }

  rtb_Delay_c = (PitchNormalLaw_rtP.Gain1_Gain_o * rtb_Delay_ad * (PitchNormalLaw_rtP.Gain_Gain_a *
    PitchNormalLaw_rtP.Vm_currentms_Value_e) + rtb_Gain_l) - (look1_binlxpw(rtb_Gain_ht,
    PitchNormalLaw_rtP.uDLookupTable_bp01Data_o, PitchNormalLaw_rtP.uDLookupTable_tableData_e, 6U) /
    (PitchNormalLaw_rtP.Gain5_Gain_d * rtb_Delay_c) + PitchNormalLaw_rtP.Bias_Bias_a) * (rtb_Gain_bk - rtb_Minup);
  rtb_Gain_bk = rtb_Delay_c * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.DLUT_bp01Data_h,
    PitchNormalLaw_rtP.DLUT_tableData_p, 1U) * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j;
  rtb_Gain_gm = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_e * rtb_Gain_ht;
  PitchNormalLaw_LagFilter((rtb_Gain_gm - PitchNormalLaw_DWork.Delay_DSTATE_df) / rtb_time_dt,
    PitchNormalLaw_rtP.LagFilter_C1_pw, rtb_time_dt, &rtb_vote_n, &PitchNormalLaw_DWork.sf_LagFilter_g3);
  if (rtb_vote_n > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j) {
    rtb_vote_n = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j;
  } else if (rtb_vote_n < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_vote_n = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e;
  }

  rtb_uDLookupTable = (((rtb_Product - PitchNormalLaw_DWork.Delay_DSTATE_l) / rtb_time_dt *
                        PitchNormalLaw_rtP.Gain3_Gain_m + rtb_Delay_c * look1_binlxpw(rtb_Gain_ht,
    PitchNormalLaw_rtP.PLUT_bp01Data_b, PitchNormalLaw_rtP.PLUT_tableData_b, 1U)) + (rtb_Gain_bk -
    PitchNormalLaw_DWork.Delay_DSTATE_kw) / rtb_time_dt) + PitchNormalLaw_rtP.Gain_Gain_j * rtb_vote_n;
  PitchNormalLaw_WashoutFilter(std::fmin(rtb_Gain_o,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchNormalLaw_rtP.WashoutFilter_C1_n, rtb_time_dt, &rtb_vote_n, &PitchNormalLaw_DWork.sf_WashoutFilter_c);
  if (rtb_vote_n > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g) {
    rtb_Tsxlo = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g;
  } else if (rtb_vote_n < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j) {
    rtb_Tsxlo = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j;
  } else {
    rtb_Tsxlo = rtb_vote_n;
  }

  rtb_Gain_g = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * rtb_Delay_ad;
  if (rtb_Gain_ht > PitchNormalLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_Gain_ht < PitchNormalLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_LowerSat_a;
  } else {
    rtb_Delay_c = rtb_Gain_ht;
  }

  rtb_Delay_c = (PitchNormalLaw_rtP.Gain1_Gain_b * rtb_Delay_ad * (PitchNormalLaw_rtP.Gain_Gain_p *
    PitchNormalLaw_rtP.Vm_currentms_Value_p) + rtb_Gain_l) - (look1_binlxpw(rtb_Gain_ht,
    PitchNormalLaw_rtP.uDLookupTable_bp01Data_a, PitchNormalLaw_rtP.uDLookupTable_tableData_p, 6U) /
    (PitchNormalLaw_rtP.Gain5_Gain_n * rtb_Delay_c) + PitchNormalLaw_rtP.Bias_Bias_ai) * (rtb_Gain_pj - rtb_Minup);
  rtb_Gain_pj = rtb_Delay_c * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.DLUT_bp01Data_k,
    PitchNormalLaw_rtP.DLUT_tableData_e, 1U) * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Gain_h = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * rtb_Gain_ht;
  PitchNormalLaw_LagFilter((rtb_Gain_h - PitchNormalLaw_DWork.Delay_DSTATE_lf) / rtb_time_dt,
    PitchNormalLaw_rtP.LagFilter_C1_l, rtb_time_dt, &rtb_vote_n, &PitchNormalLaw_DWork.sf_LagFilter_g);
  if (rtb_vote_n > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Sum1_bz = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_vote_n < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek) {
    rtb_Sum1_bz = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek;
  } else {
    rtb_Sum1_bz = rtb_vote_n;
  }

  PitchNormalLaw_WashoutFilter(std::fmin(rtb_Gain_o,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchNormalLaw_rtP.WashoutFilter_C1_h, rtb_time_dt, &rtb_vote_n, &PitchNormalLaw_DWork.sf_WashoutFilter_d);
  rtb_uDLookupTable += rtb_Tsxlo * look1_binlxpw(rtb_Gain_lm,
    PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_n, PitchNormalLaw_rtP.ScheduledGain_Table_b, 3U);
  if (rtb_vote_n > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_vote_n = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_vote_n < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_vote_n = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Delay_c = ((((rtb_Gain_g - PitchNormalLaw_DWork.Delay_DSTATE_e5) / rtb_time_dt * PitchNormalLaw_rtP.Gain3_Gain_b +
                   rtb_Delay_c * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.PLUT_bp01Data_a,
    PitchNormalLaw_rtP.PLUT_tableData_o, 1U)) + (rtb_Gain_pj - PitchNormalLaw_DWork.Delay_DSTATE_gz) / rtb_time_dt) +
                 PitchNormalLaw_rtP.Gain_Gain_kg * rtb_Sum1_bz) + rtb_vote_n * look1_binlxpw(rtb_Gain_lm,
    PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_f, PitchNormalLaw_rtP.ScheduledGain_Table_h, 3U);
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_hc) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_hc;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_a) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_a;
  }

  if (rtb_Delay_c > PitchNormalLaw_rtP.Saturation_UpperSat_j) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Delay_c < PitchNormalLaw_rtP.Saturation_LowerSat_dw) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_LowerSat_dw;
  }

  PitchNormalLaw_VoterAttitudeProtection(rtb_uDLookupTable, rtb_Y_m + rtb_Product1_eq, rtb_Delay_c, &rtb_vote_n);
  rtb_Product1_eq = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_g * rtb_Delay_ad;
  if (rtb_Gain_ht > PitchNormalLaw_rtP.Saturation3_UpperSat_ng) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_UpperSat_ng;
  } else if (rtb_Gain_ht < PitchNormalLaw_rtP.Saturation3_LowerSat_h) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_LowerSat_h;
  } else {
    rtb_uDLookupTable = rtb_Gain_ht;
  }

  rtb_Delay_c = look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.uDLookupTable_bp01Data_l,
    PitchNormalLaw_rtP.uDLookupTable_tableData_a, 6U) / (PitchNormalLaw_rtP.Gain5_Gain_o * rtb_uDLookupTable) +
    PitchNormalLaw_rtP.Bias_Bias_i;
  if (rtb_Gain_o2 == 5.0) {
    rtb_in_rotation = 25;
  } else {
    rtb_in_rotation = 30;
  }

  PitchNormalLaw_RateLimiter(static_cast<real_T>(rtb_in_rotation) - std::fmin(5.0, std::fmax(0.0, 5.0 - (rtb_Gain_hn -
    (rtb_Product1_bl + 5.0)) * 0.25)), PitchNormalLaw_rtP.RateLimiterVariableTs6_up_j,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_lo_i, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_InitialCondition_d, &rtb_uDLookupTable,
    &PitchNormalLaw_DWork.sf_RateLimiter_o);
  rtb_Y_m = PitchNormalLaw_rtP.Gain1_Gain_m * rtb_Gain_bws;
  rtb_uDLookupTable = PitchNormalLaw_rtP.Gain2_Gain * rtb_uDLookupTable - rtb_Y_m;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation1_UpperSat_i) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation1_UpperSat_i;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation1_LowerSat_h) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation1_LowerSat_h;
  }

  rtb_Delay_c = (PitchNormalLaw_rtP.Gain1_Gain_ea * rtb_Delay_ad * (PitchNormalLaw_rtP.Gain_Gain_c *
    PitchNormalLaw_rtP.Vm_currentms_Value_m) + rtb_Gain_l) - ((rtb_Minup + look1_binlxpw(rtb_uDLookupTable,
    PitchNormalLaw_rtP.Loaddemand1_bp01Data, PitchNormalLaw_rtP.Loaddemand1_tableData, 2U)) - rtb_Minup) * rtb_Delay_c;
  rtb_Product1_bl = rtb_Delay_c * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.PLUT_bp01Data_f,
    PitchNormalLaw_rtP.PLUT_tableData_c, 1U);
  rtb_Gain_hn = rtb_Delay_c * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.DLUT_bp01Data_c,
    PitchNormalLaw_rtP.DLUT_tableData_l, 1U) * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_g;
  rtb_Gain_o2 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_h * rtb_Gain_ht;
  rtb_Delay_c = rtb_Gain_o2 - PitchNormalLaw_DWork.Delay_DSTATE_cr;
  PitchNormalLaw_LagFilter(rtb_Delay_c / rtb_time_dt, PitchNormalLaw_rtP.LagFilter_C1_i, rtb_time_dt, &rtb_Delay_c,
    &PitchNormalLaw_DWork.sf_LagFilter_k);
  if (rtb_Delay_c > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_c) {
    rtb_Delay_c = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_c;
  } else if (rtb_Delay_c < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_b) {
    rtb_Delay_c = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_b;
  }

  rtb_Sum1_bz = (((rtb_Product1_eq - PitchNormalLaw_DWork.Delay_DSTATE_h) / rtb_time_dt *
                  PitchNormalLaw_rtP.Gain3_Gain_l + rtb_Product1_bl) + (rtb_Gain_hn -
    PitchNormalLaw_DWork.Delay_DSTATE_n) / rtb_time_dt) + PitchNormalLaw_rtP.Gain_Gain_l * rtb_Delay_c;
  PitchNormalLaw_WashoutFilter(std::fmin(rtb_Gain_o,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchNormalLaw_rtP.WashoutFilter_C1_g, rtb_time_dt, &rtb_Delay_c, &PitchNormalLaw_DWork.sf_WashoutFilter_k);
  if (rtb_Delay_c > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_f) {
    rtb_Tsxlo = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_f;
  } else if (rtb_Delay_c < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_m) {
    rtb_Tsxlo = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_m;
  } else {
    rtb_Tsxlo = rtb_Delay_c;
  }

  rtb_Product1_bl = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_k * rtb_Delay_ad;
  rtb_uDLookupTable = PitchNormalLaw_rtP.Gain3_Gain_g * PitchNormalLaw_rtP.Theta_max3_Value - rtb_Y_m;
  if (rtb_Gain_ht > PitchNormalLaw_rtP.Saturation3_UpperSat_e) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_UpperSat_e;
  } else if (rtb_Gain_ht < PitchNormalLaw_rtP.Saturation3_LowerSat_k) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation3_LowerSat_k;
  } else {
    rtb_Delay_c = rtb_Gain_ht;
  }

  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation2_UpperSat) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation2_LowerSat) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Delay_c = (PitchNormalLaw_rtP.Gain1_Gain_lk * rtb_Delay_ad * (PitchNormalLaw_rtP.Gain_Gain_jq *
    PitchNormalLaw_rtP.Vm_currentms_Value_b) + rtb_Gain_l) - (look1_binlxpw(rtb_Gain_ht,
    PitchNormalLaw_rtP.uDLookupTable_bp01Data_m, PitchNormalLaw_rtP.uDLookupTable_tableData_ax, 6U) /
    (PitchNormalLaw_rtP.Gain5_Gain_m * rtb_Delay_c) + PitchNormalLaw_rtP.Bias_Bias_m) * ((rtb_Minup + look1_binlxpw
    (rtb_uDLookupTable, PitchNormalLaw_rtP.Loaddemand2_bp01Data, PitchNormalLaw_rtP.Loaddemand2_tableData, 2U)) -
    rtb_Minup);
  rtb_Gain_l = rtb_Delay_c * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.DLUT_bp01Data_hw,
    PitchNormalLaw_rtP.DLUT_tableData_l5, 1U) * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_c;
  rtb_Minup = ((rtb_Product1_bl - PitchNormalLaw_DWork.Delay_DSTATE_ho) / rtb_time_dt * PitchNormalLaw_rtP.Gain3_Gain_n
               + rtb_Delay_c * look1_binlxpw(rtb_Gain_ht, PitchNormalLaw_rtP.PLUT_bp01Data_e,
    PitchNormalLaw_rtP.PLUT_tableData_g, 1U)) + (rtb_Gain_l - PitchNormalLaw_DWork.Delay_DSTATE_ds) / rtb_time_dt;
  rtb_Gain_ht *= PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_p;
  rtb_Delay_c = rtb_Gain_ht - PitchNormalLaw_DWork.Delay_DSTATE_jt;
  PitchNormalLaw_LagFilter(rtb_Delay_c / rtb_time_dt, PitchNormalLaw_rtP.LagFilter_C1_f, rtb_time_dt, &rtb_Delay_c,
    &PitchNormalLaw_DWork.sf_LagFilter_n);
  if (rtb_Delay_c > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2) {
    rtb_Delay_c = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2;
  } else if (rtb_Delay_c < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n) {
    rtb_Delay_c = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n;
  }

  rtb_Y_m = PitchNormalLaw_rtP.Gain_Gain_l0 * rtb_Delay_c;
  PitchNormalLaw_WashoutFilter(std::fmin(rtb_Gain_o,
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_spoilers_right_pos),
    PitchNormalLaw_rtP.WashoutFilter_C1_j, rtb_time_dt, &rtb_Delay_c, &PitchNormalLaw_DWork.sf_WashoutFilter);
  rtb_uDLookupTable = rtb_Tsxlo * look1_binlxpw(rtb_Gain_lm,
    PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_fn, PitchNormalLaw_rtP.ScheduledGain_Table_c, 3U) +
    rtb_Sum1_bz;
  if (rtb_Delay_c > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m) {
    rtb_Delay_c = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m;
  } else if (rtb_Delay_c < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d) {
    rtb_Delay_c = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d;
  }

  rtb_Delay_c = (rtb_Minup + rtb_Y_m) + rtb_Delay_c * look1_binlxpw(rtb_Gain_lm,
    PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_b, PitchNormalLaw_rtP.ScheduledGain_Table_e, 3U);
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_hx) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_hx;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_oq) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_oq;
  }

  if (rtb_Delay_c > PitchNormalLaw_rtP.Saturation_UpperSat_a) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Delay_c < PitchNormalLaw_rtP.Saturation_LowerSat_k) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_LowerSat_k;
  }

  PitchNormalLaw_VoterAttitudeProtection(rtb_uDLookupTable, rtb_vote_n, rtb_Delay_c, &rtb_vote_n);
  PitchNormalLaw_RateLimiter(rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos,
    PitchNormalLaw_rtP.RateLimiterVariableTs_up_na, PitchNormalLaw_rtP.RateLimiterVariableTs_lo_i, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Y_m, &PitchNormalLaw_DWork.sf_RateLimiter_ct);
  if (rtb_Y_m > PitchNormalLaw_rtP.Saturation3_UpperSat_l) {
    rtb_Gain_o = PitchNormalLaw_rtP.Saturation3_UpperSat_l;
  } else if (rtb_Y_m < PitchNormalLaw_rtP.Saturation3_LowerSat_hp) {
    rtb_Gain_o = PitchNormalLaw_rtP.Saturation3_LowerSat_hp;
  } else {
    rtb_Gain_o = rtb_Y_m;
  }

  rtb_Delay_c = look1_binlxpw(static_cast<real_T>
    (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tailstrike_protection_on) * look2_binlxpw
    (rtb_Gain_bws, rtb_Gain_lm, PitchNormalLaw_rtP.uDLookupTable_bp01Data_l0, PitchNormalLaw_rtP.uDLookupTable_bp02Data,
     PitchNormalLaw_rtP.uDLookupTable_tableData_e5, PitchNormalLaw_rtP.uDLookupTable_maxIndex, 5U) * rtb_Gain_o +
    rtb_Y_m, PitchNormalLaw_rtP.PitchRateDemand_bp01Data, PitchNormalLaw_rtP.PitchRateDemand_tableData, 2U);
  rtb_Gain_bws = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j3 * rtb_Delay_c;
  rtb_Tsxlo = rtb_Delay_ad - rtb_Delay_c;
  rtb_Gain_o = PitchNormalLaw_rtP.Gain_Gain_pt * rtb_Tsxlo;
  rtb_Gain_lm = PitchNormalLaw_rtP.Gain1_Gain_d * rtb_Tsxlo * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_g4;
  rtb_Tsxlo = PitchNormalLaw_rtP.Gain5_Gain_h *
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_qk_dot_deg_s2;
  PitchNormalLaw_LagFilter(rtb_Delay_ad + rtb_Tsxlo, PitchNormalLaw_rtP.LagFilter_C1_k, rtb_time_dt, &rtb_Tsxlo,
    &PitchNormalLaw_DWork.sf_LagFilter_f);
  rtb_Delay_c = (((((rtb_Gain_lm - PitchNormalLaw_DWork.Delay_DSTATE_e4) / rtb_time_dt + rtb_Gain_o) *
                   PitchNormalLaw_rtP.Gain1_Gain_a + (rtb_Gain_bws - PitchNormalLaw_DWork.Delay_DSTATE_ej) / rtb_time_dt
                   * PitchNormalLaw_rtP.Gain3_Gain_e) + (rtb_Tsxlo - rtb_Delay_c) * PitchNormalLaw_rtP.Gain4_Gain) +
                 PitchNormalLaw_rtP.Gain6_Gain_g *
                 rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_qk_dot_deg_s2) *
    (PitchNormalLaw_rtP.Constant2_Value_k - rtb_Y) * PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain *
    rtb_time_dt;
  PitchNormalLaw_DWork.icLoad = (((rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_delta_eta_pos <=
    PitchNormalLaw_rtP.Constant_Value_o) &&
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground) ||
    (rtb_BusAssignment_k_data_computed_in_rotation_gain == 0.0) ||
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on || PitchNormalLaw_DWork.icLoad);
  if (PitchNormalLaw_DWork.icLoad) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.Constant_Value_jk - rtb_Delay_c;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_cl += rtb_Delay_c;
  if (PitchNormalLaw_DWork.Delay_DSTATE_cl > PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_cl < PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_on_ground) {
    if (rtb_BusAssignment_k_data_computed_delta_eta_deg > PitchNormalLaw_rtP.Saturation_UpperSat) {
      rtb_Delay_c = PitchNormalLaw_rtP.Saturation_UpperSat;
    } else if (rtb_BusAssignment_k_data_computed_delta_eta_deg < PitchNormalLaw_rtP.Saturation_LowerSat) {
      rtb_Delay_c = PitchNormalLaw_rtP.Saturation_LowerSat;
    } else {
      rtb_Delay_c = rtb_BusAssignment_k_data_computed_delta_eta_deg;
    }
  } else {
    rtb_Delay_c = PitchNormalLaw_rtP.Constant1_Value_h;
  }

  rtb_Delay_ad = PitchNormalLaw_DWork.Delay_DSTATE_cl + rtb_Delay_c;
  rtb_Delay_c = rtb_vote_n * look1_binlxpw(rtb_time_dt, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_d,
    PitchNormalLaw_rtP.ScheduledGain_Table_hh, 4U) * PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain_j *
    rtb_time_dt;
  PitchNormalLaw_DWork.icLoad_o = ((rtb_Y == 0.0) ||
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_tracking_mode_on ||
    PitchNormalLaw_DWork.icLoad_o);
  if (PitchNormalLaw_DWork.icLoad_o) {
    if (PitchNormalLaw_B.in_flight <= PitchNormalLaw_rtP.Switch_Threshold) {
      rtb_Sum1_h3 = rtb_BusAssignment_k_data_computed_delta_eta_deg;
    }

    PitchNormalLaw_DWork.Delay_DSTATE_o = rtb_Sum1_h3 - rtb_Delay_c;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_o += rtb_Delay_c;
  if (PitchNormalLaw_DWork.Delay_DSTATE_o > PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_n) {
    PitchNormalLaw_DWork.Delay_DSTATE_o = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_n;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_o < PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_j) {
    PitchNormalLaw_DWork.Delay_DSTATE_o = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_j;
  }

  if (rtb_Y > PitchNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (rtb_Y < PitchNormalLaw_rtP.Saturation_LowerSat_kp) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_LowerSat_kp;
  } else {
    rtb_Delay_c = rtb_Y;
  }

  rtb_Minup = PitchNormalLaw_DWork.Delay_DSTATE_o * rtb_Delay_c;
  rtb_Sum1_h3 = PitchNormalLaw_rtP.Constant_Value_o1 - rtb_Delay_c;
  if (rtb_BusAssignment_k_data_computed_in_rotation_gain > PitchNormalLaw_rtP.Saturation_UpperSat_m) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_UpperSat_m;
  } else if (rtb_BusAssignment_k_data_computed_in_rotation_gain < PitchNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Delay_c = PitchNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Delay_c = rtb_BusAssignment_k_data_computed_in_rotation_gain;
  }

  PitchNormalLaw_RateLimiter(rtb_Minup + rtb_Sum1_h3 * (rtb_Delay_ad * rtb_Delay_c +
    (PitchNormalLaw_rtP.Constant_Value_h - rtb_Delay_c) * rtb_BusAssignment_k_data_computed_delta_eta_deg),
    PitchNormalLaw_rtP.RateLimitereta_up, PitchNormalLaw_rtP.RateLimitereta_lo, rtb_time_dt,
    PitchNormalLaw_rtP.RateLimitereta_InitialCondition, &rtb_Y_m, &PitchNormalLaw_DWork.sf_RateLimiter_b);
  if (rtb_eta_trim_deg_should_freeze == PitchNormalLaw_rtP.CompareToConstant_const) {
    rtb_Sum1_h3 = PitchNormalLaw_rtP.Constant_Value;
  } else {
    rtb_Sum1_h3 = PitchNormalLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Delay_c = PitchNormalLaw_rtP.Gain_Gain_cy * rtb_Sum1_h3 *
    PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_time_dt;
  PitchNormalLaw_DWork.icLoad_p = (rtb_eta_trim_deg_reset || PitchNormalLaw_DWork.icLoad_p);
  if (PitchNormalLaw_DWork.icLoad_p) {
    PitchNormalLaw_DWork.Delay_DSTATE_a = rtb_eta_trim_deg_reset_deg - rtb_Delay_c;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_a += rtb_Delay_c;
  if (PitchNormalLaw_DWork.Delay_DSTATE_a > rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_up) {
    PitchNormalLaw_DWork.Delay_DSTATE_a = rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_up;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_a < rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_lo) {
    PitchNormalLaw_DWork.Delay_DSTATE_a = rtb_BusAssignment_k_data_computed_eta_trim_deg_limit_lo;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_aa += std::fmax(std::fmin(PitchNormalLaw_DWork.Delay_DSTATE_a -
    PitchNormalLaw_DWork.Delay_DSTATE_aa, rtb_Y_a * rtb_time_dt), rtb_time_dt * rtb_ManualSwitch);
  *rty_Out_eta_deg = rtb_Y_m;
  *rty_Out_eta_trim_deg = PitchNormalLaw_DWork.Delay_DSTATE_aa;
  PitchNormalLaw_DWork.Delay_DSTATE_k = rtb_Gain;
  PitchNormalLaw_DWork.Delay_DSTATE_g = rtb_Divide_d;
  PitchNormalLaw_DWork.Delay_DSTATE_m = rtb_Y_p;
  PitchNormalLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_kz;
  PitchNormalLaw_DWork.Delay_DSTATE_kd = rtb_Gain_bi;
  PitchNormalLaw_DWork.Delay_DSTATE_j = rtb_Divide;
  PitchNormalLaw_DWork.Delay_DSTATE_d = rtb_Loaddemand;
  PitchNormalLaw_DWork.Delay_DSTATE_f = rtb_Gain_k2;
  PitchNormalLaw_DWork.Delay_DSTATE_g5 = rtb_Divide_kb;
  PitchNormalLaw_DWork.Delay_DSTATE_jh = rtb_Gain_fb;
  PitchNormalLaw_DWork.Delay_DSTATE_c = rtb_y_g;
  PitchNormalLaw_DWork.Delay_DSTATE_l = rtb_Product;
  PitchNormalLaw_DWork.Delay_DSTATE_kw = rtb_Gain_bk;
  PitchNormalLaw_DWork.Delay_DSTATE_df = rtb_Gain_gm;
  PitchNormalLaw_DWork.Delay_DSTATE_e5 = rtb_Gain_g;
  PitchNormalLaw_DWork.Delay_DSTATE_gz = rtb_Gain_pj;
  PitchNormalLaw_DWork.Delay_DSTATE_lf = rtb_Gain_h;
  PitchNormalLaw_DWork.Delay_DSTATE_h = rtb_Product1_eq;
  PitchNormalLaw_DWork.Delay_DSTATE_n = rtb_Gain_hn;
  PitchNormalLaw_DWork.Delay_DSTATE_cr = rtb_Gain_o2;
  PitchNormalLaw_DWork.Delay_DSTATE_ho = rtb_Product1_bl;
  PitchNormalLaw_DWork.Delay_DSTATE_ds = rtb_Gain_l;
  PitchNormalLaw_DWork.Delay_DSTATE_jt = rtb_Gain_ht;
  PitchNormalLaw_DWork.Delay_DSTATE_ej = rtb_Gain_bws;
  PitchNormalLaw_DWork.Delay_DSTATE_e4 = rtb_Gain_lm;
  PitchNormalLaw_DWork.icLoad = false;
  PitchNormalLaw_DWork.icLoad_o = false;
  PitchNormalLaw_DWork.icLoad_p = false;
}

PitchNormalLaw::PitchNormalLaw():
  PitchNormalLaw_B(),
  PitchNormalLaw_DWork()
{
}

PitchNormalLaw::~PitchNormalLaw()
{
}
