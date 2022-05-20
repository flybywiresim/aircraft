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


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },

  0.05,

  0.3,

  5.0,

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

  -30.0,

  -30.0,


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.1, 0.1, 0.15, 0.2, 0.3, 0.5, 0.5 },


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

  -1.0,

  -0.25,

  -2.0,

  -1.0,

  -0.5,

  -0.33333333333333331,

  -4.0,

  -0.5,

  -45.0,

  0.2,

  0.5,

  0.5,

  0.5,

  1.0,

  1.0,

  4.0,

  2.0,

  1.0,

  0.5,

  4.0,

  2.0,

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


  { -2.0, 0.0, 1.5 },


  { -1.0, 0.0, 1.0 },

  0.0,

  1.0,

  1.0,

  0.0,

  0.06,

  0.0,

  -0.8,

  1.0,

  1.0,

  0.0,

  0.0,

  30.0,

  0.0,

  0.0,

  0.0,

  0.0,

  1.0,

  1.0,

  0.0,

  1.0,

  0.0,

  -30.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.2,

  0.2,

  1.0,

  -0.25,


  { -2.0, 0.0, 1.5 },


  { -1.0, 0.0, 1.0 },

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

  0.0,

  1.0,

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

  0.0,

  2.0,

  0.0,

  0.0,

  2.0,

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

  0.0,

  0.076923076923076927,

  1.0,

  0.0,

  1.0,

  1.0,


  { 0.0, 0.0, 0.0, -0.75, -0.75, 0.0, 0.0, 0.0, -0.75, -0.75, 0.0, 0.0, 0.0, 0.0, -0.75, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 0.0 },


  { -1.0, 0.0, 6.0, 11.0, 15.0 },


  { -1.0, 8.0, 18.0, 28.0, 40.0 },

  1.0,

  0.0,


  { -9.0, 0.0, 9.0 },


  { -1.0, 0.0, 1.0 },

  -2.0,

  4.0,

  0.2,

  1.0,

  2.5,

  -1.5,

  2.0,

  0.0,

  1.0,

  0.0,

  1.0,


  { 4U, 4U },

  1U,

  1U
};

void PitchNormalLaw::PitchNormalLaw_LagFilter(const real_T *rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_PitchNormalLaw_T *localDW)
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

void PitchNormalLaw::PitchNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchNormalLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void PitchNormalLaw::PitchNormalLaw_eta_trim_limit_lofreeze(const real_T *rtu_eta_trim, const boolean_T *rtu_trigger,
  real_T *rty_y, rtDW_eta_trim_limit_lofreeze_PitchNormalLaw_T *localDW)
{
  if ((!*rtu_trigger) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = *rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void PitchNormalLaw::PitchNormalLaw_LagFilter_n(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_PitchNormalLaw_d_T *localDW)
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

void PitchNormalLaw::PitchNormalLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
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

  denom_tmp = *rtu_dt * rtu_C1;
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void PitchNormalLaw::PitchNormalLaw_RateLimiter_c(const real_T *rtu_u, real_T rtu_up, real_T rtu_lo, const real_T
  *rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchNormalLaw_o_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(*rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
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
  PitchNormalLaw_DWork.Delay_DSTATE_h = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_n = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_c = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_l = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  PitchNormalLaw_DWork.Delay_DSTATE_k = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  PitchNormalLaw_DWork.Delay_DSTATE_d = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchNormalLaw_DWork.Delay_DSTATE_f = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_g = PitchNormalLaw_rtP.Delay_InitialCondition;
  PitchNormalLaw_DWork.Delay1_DSTATE = PitchNormalLaw_rtP.Delay1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_j = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  PitchNormalLaw_DWork.Delay_DSTATE_ca = PitchNormalLaw_rtP.Delay_InitialCondition_e;
  PitchNormalLaw_DWork.Delay1_DSTATE_i = PitchNormalLaw_rtP.Delay1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_e = PitchNormalLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_kd = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  PitchNormalLaw_DWork.Delay_DSTATE_b = PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_ku = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  PitchNormalLaw_DWork.Delay_DSTATE_gl = PitchNormalLaw_rtP.Delay_InitialCondition_c;
  PitchNormalLaw_DWork.Delay1_DSTATE_l = PitchNormalLaw_rtP.Delay1_InitialCondition_gf;
  PitchNormalLaw_DWork.Delay_DSTATE_m = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_k2 = PitchNormalLaw_rtP.Delay_InitialCondition_h;
  PitchNormalLaw_DWork.Delay1_DSTATE_n = PitchNormalLaw_rtP.Delay1_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_mz = PitchNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_jh = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  PitchNormalLaw_DWork.Delay_DSTATE_dy = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_di;
  PitchNormalLaw_DWork.Delay_DSTATE_e5 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchNormalLaw_DWork.Delay_DSTATE_gz = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_lf = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchNormalLaw_DWork.Delay_DSTATE_ho = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_ds = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_jt = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  PitchNormalLaw_DWork.icLoad = true;
  PitchNormalLaw_DWork.icLoad_p = true;
  PitchNormalLaw_DWork.Delay_DSTATE_aa = PitchNormalLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition_m;
  PitchNormalLaw_DWork.Delay_DSTATE_ej = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_b;
  PitchNormalLaw_DWork.Delay_DSTATE_e4 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_p;
  PitchNormalLaw_DWork.icLoad_pu = true;
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
  real_T *rtu_In_high_speed_prot_high_kn, const real_T *rtu_In_high_speed_prot_low_kn, const real_T
  *rtu_In_ap_theta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_eta_deg, real_T *rty_Out_eta_trim_deg)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T rtb_in_flare;
  real_T minV_tmp;
  real_T rtb_Bias_o;
  real_T rtb_Cos;
  real_T rtb_Divide;
  real_T rtb_Divide_a;
  real_T rtb_Divide_an;
  real_T rtb_Divide_b4;
  real_T rtb_Divide_cq;
  real_T rtb_Divide_kq;
  real_T rtb_Divide_l;
  real_T rtb_Divide_m;
  real_T rtb_Divide_o;
  real_T rtb_Divide_o2;
  real_T rtb_Gain;
  real_T rtb_Gain1_e;
  real_T rtb_Gain1_ft;
  real_T rtb_Gain_bs;
  real_T rtb_Gain_g;
  real_T rtb_Gain_ll;
  real_T rtb_Gain_ot;
  real_T rtb_Gain_px;
  real_T rtb_Loaddemand2;
  real_T rtb_ManualSwitch;
  real_T rtb_Product1_ck;
  real_T rtb_Product1_dm;
  real_T rtb_Product_k;
  real_T rtb_Product_kz;
  real_T rtb_Product_n3;
  real_T rtb_Saturation3;
  real_T rtb_Saturation_as;
  real_T rtb_Sum10;
  real_T rtb_Sum1_d4;
  real_T rtb_Switch1;
  real_T rtb_Switch1_a;
  real_T rtb_Y_a;
  real_T rtb_Y_gw;
  real_T rtb_Y_h;
  real_T rtb_Y_j;
  real_T rtb_Y_n;
  real_T rtb_Y_o2;
  real_T rtb_Y_p;
  real_T rtb_alpha_err_gain;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T rtb_eta_trim_deg_reset_deg;
  real_T rtb_qk_dot_gain;
  real_T rtb_qk_gain;
  real_T rtb_uDLookupTable;
  real_T rtb_v_target;
  real_T rtb_y;
  real_T rtb_y_d;
  real_T y;
  int32_T rtb_in_rotation;
  boolean_T rtb_OR;
  boolean_T rtb_eta_trim_deg_reset;
  boolean_T rtb_eta_trim_deg_should_freeze;
  PitchNormalLaw_LagFilter(rtu_In_Theta_deg, PitchNormalLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_LagFilter);
  if (PitchNormalLaw_DWork.is_active_c3_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c3_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Ground_c;
    PitchNormalLaw_B.in_flight = 0.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c3_PitchNormalLaw) {
     case PitchNormalLaw_IN_Flight:
      if ((*rtu_In_on_ground) && (*rtu_In_Theta_deg < 2.5)) {
        PitchNormalLaw_DWork.on_ground_time = *rtu_In_time_simulation_time;
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_FlightToGroundTransition;
      } else {
        PitchNormalLaw_B.in_flight = 1.0;
      }
      break;

     case PitchNormalLaw_IN_FlightToGroundTransition:
      if (*rtu_In_time_simulation_time - PitchNormalLaw_DWork.on_ground_time >= 5.0) {
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Ground_c;
        PitchNormalLaw_B.in_flight = 0.0;
      } else if ((!*rtu_In_on_ground) || (*rtu_In_Theta_deg >= 2.5)) {
        PitchNormalLaw_DWork.on_ground_time = 0.0;
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        PitchNormalLaw_B.in_flight = 1.0;
      }
      break;

     default:
      if (((!*rtu_In_on_ground) && (*rtu_In_Theta_deg > 8.0)) || (*rtu_In_H_radio_ft > 400.0)) {
        PitchNormalLaw_DWork.on_ground_time = 0.0;
        PitchNormalLaw_DWork.is_c3_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        PitchNormalLaw_B.in_flight = 1.0;
      } else {
        PitchNormalLaw_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (PitchNormalLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = PitchNormalLaw_rtP.Constant1_Value_k;
  } else {
    rtb_ManualSwitch = PitchNormalLaw_rtP.Constant_Value_p;
  }

  if (PitchNormalLaw_DWork.is_active_c2_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c2_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Ground;
    rtb_in_flare = 0.0;
    PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
    PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c2_PitchNormalLaw) {
     case PitchNormalLaw_IN_Flare_Reduce_Theta_c:
      if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Ground;
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1.0;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
      }
      break;

     case PitchNormalLaw_IN_Flare_Set_Rate:
      if (PitchNormalLaw_rtP.ManualSwitch1_CurrentSetting == 1) {
        rtb_Y_j = PitchNormalLaw_rtP.Constant1_Value_k;
      } else {
        rtb_Y_j = PitchNormalLaw_rtP.Constant_Value_p;
      }

      if ((*rtu_In_H_radio_ft <= 30.0) || (rtb_Y_j == 1.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Reduce_Theta_c;
        rtb_in_flare = 1.0;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
      } else if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1.0;
      }
      break;

     case PitchNormalLaw_IN_Flare_Store_Theta_c_deg:
      if ((*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -(rtb_Saturation_as + 2.0) / 8.0;
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Set_Rate;
        rtb_in_flare = 1.0;
      }
      break;

     case PitchNormalLaw_IN_Flight_High:
      if ((*rtu_In_H_radio_ft <= 50.0) || (rtb_ManualSwitch == 1.0)) {
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Store_Theta_c_deg;
        rtb_in_flare = 1.0;
      } else {
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     case PitchNormalLaw_IN_Flight_Low:
      if (*rtu_In_H_radio_ft > 50.0) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_High;
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     default:
      if (PitchNormalLaw_B.in_flight == 1.0) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight_Low;
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Saturation_as;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;
    }
  }

  if (PitchNormalLaw_DWork.is_active_c9_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c9_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (PitchNormalLaw_DWork.is_c9_PitchNormalLaw == PitchNormalLaw_IN_frozen) {
    if ((rtb_in_flare == 0.0) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs(*rtu_In_Phi_deg) <= 30.0)) {
      PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if ((rtb_in_flare != 0.0) || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs(*rtu_In_Phi_deg) >
              30.0)) {
    PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  if (PitchNormalLaw_DWork.is_active_c8_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c8_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_manual;
    rtb_eta_trim_deg_reset = true;
    rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
  } else {
    switch (PitchNormalLaw_DWork.is_c8_PitchNormalLaw) {
     case PitchNormalLaw_IN_automatic:
      if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_reset;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      } else if (*rtu_In_tracking_mode_on) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_tracking;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = false;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      }
      break;

     case PitchNormalLaw_IN_manual:
      if (PitchNormalLaw_B.in_flight != 0.0) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      }
      break;

     case PitchNormalLaw_IN_reset:
      if ((PitchNormalLaw_B.in_flight == 0.0) && (*rtu_In_eta_trim_deg == 0.0)) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_manual;
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = 0.0;
      }
      break;

     default:
      if (!*rtu_In_tracking_mode_on) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_eta_trim_deg_reset_deg = *rtu_In_eta_trim_deg;
      }
      break;
    }
  }

  if (PitchNormalLaw_DWork.is_active_c7_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c7_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
    rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
    rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c7_PitchNormalLaw) {
     case PitchNormalLaw_IN_flight_clean:
      if (*rtu_In_flaps_handle_index != 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_flaps;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
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

     case PitchNormalLaw_IN_flight_flaps:
      if (*rtu_In_flaps_handle_index == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (PitchNormalLaw_B.in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
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
      if ((PitchNormalLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index == 0.0)) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((PitchNormalLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index != 0.0)) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_flaps;
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

  if (PitchNormalLaw_B.in_flight > PitchNormalLaw_rtP.Saturation_UpperSat_c) {
    rtb_Y_j = PitchNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (PitchNormalLaw_B.in_flight < PitchNormalLaw_rtP.Saturation_LowerSat_n) {
    rtb_Y_j = PitchNormalLaw_rtP.Saturation_LowerSat_n;
  } else {
    rtb_Y_j = PitchNormalLaw_B.in_flight;
  }

  PitchNormalLaw_RateLimiter(rtb_Y_j, PitchNormalLaw_rtP.RateLimiterVariableTs_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_ManualSwitch, &PitchNormalLaw_DWork.sf_RateLimiter);
  if (PitchNormalLaw_DWork.is_active_c6_PitchNormalLaw == 0U) {
    PitchNormalLaw_DWork.is_active_c6_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else if (PitchNormalLaw_DWork.is_c6_PitchNormalLaw == PitchNormalLaw_IN_OFF) {
    if ((rtb_ManualSwitch < 1.0) && (*rtu_In_V_tas_kn > 70.0) && ((*rtu_In_thrust_lever_1_pos >= 35.0) ||
         (*rtu_In_thrust_lever_2_pos >= 35.0))) {
      PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_ON;
      rtb_in_rotation = 1;
    } else {
      rtb_in_rotation = 0;
    }
  } else if ((rtb_ManualSwitch == 1.0) || (*rtu_In_H_radio_ft > 400.0) || ((*rtu_In_V_tas_kn < 70.0) &&
              ((*rtu_In_thrust_lever_1_pos < 35.0) || (*rtu_In_thrust_lever_2_pos < 35.0)))) {
    PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else {
    rtb_in_rotation = 1;
  }

  if (rtb_in_rotation > PitchNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Gain = PitchNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_in_rotation < PitchNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Gain = PitchNormalLaw_rtP.Saturation1_LowerSat;
  } else {
    rtb_Gain = rtb_in_rotation;
  }

  PitchNormalLaw_RateLimiter(rtb_Gain, PitchNormalLaw_rtP.RateLimiterVariableTs1_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_j, &PitchNormalLaw_DWork.sf_RateLimiter_p);
  rtb_Gain = PitchNormalLaw_rtP.Gain_Gain_a * *rtu_In_delta_eta_pos;
  PitchNormalLaw_RateLimiter(rtb_nz_limit_up_g, PitchNormalLaw_rtP.RateLimiterVariableTs2_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y_p, &PitchNormalLaw_DWork.sf_RateLimiter_c);
  PitchNormalLaw_RateLimiter(rtb_nz_limit_lo_g, PitchNormalLaw_rtP.RateLimiterVariableTs3_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_h, &PitchNormalLaw_DWork.sf_RateLimiter_n);
  rtb_Switch1_a = std::abs(PitchNormalLaw_B.flare_Theta_c_rate_deg_s) * *rtu_In_time_dt;
  rtb_Switch1 = *rtu_In_time_dt * PitchNormalLaw_B.flare_Theta_c_rate_deg_s;
  PitchNormalLaw_DWork.Delay_DSTATE += std::fmax(std::fmin(PitchNormalLaw_B.flare_Theta_c_deg -
    PitchNormalLaw_DWork.Delay_DSTATE, rtb_Switch1_a), rtb_Switch1);
  PitchNormalLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_aoa_prot_active, &rtb_y_d,
    &PitchNormalLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (!*rtu_In_high_aoa_prot_active) {
    rtb_y_d = PitchNormalLaw_rtP.Constant3_Value;
  }

  PitchNormalLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_speed_prot_active, &rtb_Y_gw,
    &PitchNormalLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (*rtu_In_high_speed_prot_active) {
    rtb_Switch1 = rtb_Y_gw;
  } else {
    rtb_Switch1 = PitchNormalLaw_rtP.Constant2_Value;
  }

  rtb_Switch1_a = *rtu_In_V_ias_kn;
  rtb_Gain_ot = *rtu_In_flaps_handle_index;
  rtb_Gain_px = *rtu_In_VLS_kn;
  if (rtb_Gain_ot == 5.0) {
    rtb_in_rotation = 25;
  } else {
    rtb_in_rotation = 30;
  }

  PitchNormalLaw_RateLimiter(static_cast<real_T>(rtb_in_rotation) - std::fmin(5.0, std::fmax(0.0, 5.0 - (rtb_Switch1_a -
    (rtb_Gain_px + 5.0)) * 0.25)), PitchNormalLaw_rtP.RateLimiterVariableTs6_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_InitialCondition, &rtb_Y_gw, &PitchNormalLaw_DWork.sf_RateLimiter_o);
  rtb_Loaddemand2 = PitchNormalLaw_rtP.Gain1_Gain * *rtu_In_Theta_deg;
  rtb_Switch1_a = PitchNormalLaw_rtP.Gain1_Gain_c * *rtu_In_Theta_deg;
  rtb_Cos = std::cos(rtb_Switch1_a);
  rtb_Switch1_a = PitchNormalLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg;
  rtb_Y_o2 = rtb_Cos / std::cos(rtb_Switch1_a);
  rtb_Y_a = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data,
    PitchNormalLaw_rtP.uDLookupTable_tableData, 6U);
  rtb_uDLookupTable = *rtu_In_V_tas_kn;
  rtb_Switch1_a = PitchNormalLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s;
  rtb_Gain_g = *rtu_In_nz_g - rtb_Y_o2;
  rtb_Divide_kq = PitchNormalLaw_rtP.Gain2_Gain * rtb_Y_gw - rtb_Loaddemand2;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation3_UpperSat) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_UpperSat;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation3_LowerSat) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_LowerSat;
  }

  if (rtb_Divide_kq > PitchNormalLaw_rtP.Saturation1_UpperSat_i) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation1_UpperSat_i;
  } else if (rtb_Divide_kq < PitchNormalLaw_rtP.Saturation1_LowerSat_h) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation1_LowerSat_h;
  }

  rtb_Saturation3 = (PitchNormalLaw_rtP.Gain_Gain_c * PitchNormalLaw_rtP.Vm_currentms_Value * rtb_Switch1_a + rtb_Gain_g)
    - (rtb_Y_a / (PitchNormalLaw_rtP.Gain5_Gain * rtb_uDLookupTable) + PitchNormalLaw_rtP.Bias_Bias) * ((rtb_Y_o2 +
    look1_binlxpw(rtb_Divide_kq, PitchNormalLaw_rtP.Loaddemand1_bp01Data, PitchNormalLaw_rtP.Loaddemand1_tableData, 2U))
    - rtb_Y_o2);
  rtb_Y_a = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data, PitchNormalLaw_rtP.PLUT_tableData, 1U);
  rtb_Product1_dm = rtb_Saturation3 * rtb_Y_a;
  rtb_Switch1_a = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Divide = (rtb_Switch1_a - PitchNormalLaw_DWork.Delay_DSTATE_h) / *rtu_In_time_dt;
  rtb_Y_a = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data, PitchNormalLaw_rtP.DLUT_tableData, 1U);
  rtb_Gain_px = rtb_Saturation3 * rtb_Y_a * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Divide_o = (rtb_Gain_px - PitchNormalLaw_DWork.Delay_DSTATE_n) / *rtu_In_time_dt;
  rtb_Gain_ot = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  rtb_Divide_an = (rtb_Gain_ot - PitchNormalLaw_DWork.Delay_DSTATE_c) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Divide_an, PitchNormalLaw_rtP.LagFilter_C1_i, rtu_In_time_dt, &rtb_Y_gw,
    &PitchNormalLaw_DWork.sf_LagFilter_k);
  if (rtb_Y_gw > PitchNormalLaw_rtP.SaturationV_dot_UpperSat) {
    y = PitchNormalLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Y_gw < PitchNormalLaw_rtP.SaturationV_dot_LowerSat) {
    y = PitchNormalLaw_rtP.SaturationV_dot_LowerSat;
  } else {
    y = rtb_Y_gw;
  }

  minV_tmp = std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos);
  PitchNormalLaw_WashoutFilter(minV_tmp, PitchNormalLaw_rtP.WashoutFilter_C1, rtu_In_time_dt, &rtb_Y_gw,
    &PitchNormalLaw_DWork.sf_WashoutFilter_k);
  rtb_Y_a = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    PitchNormalLaw_rtP.ScheduledGain_Table, 3U);
  if (rtb_Y_gw > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat) {
    rtb_Y_gw = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Y_gw < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat) {
    rtb_Y_gw = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat;
  }

  rtb_Product_kz = rtb_Y_gw * rtb_Y_a;
  rtb_Divide_an = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_i * *rtu_In_qk_deg_s;
  rtb_Divide_cq = (rtb_Divide_an - PitchNormalLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt;
  rtb_Gain1_ft = PitchNormalLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s;
  rtb_Saturation3 = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_o,
    PitchNormalLaw_rtP.uDLookupTable_tableData_e, 6U);
  rtb_uDLookupTable = *rtu_In_V_tas_kn;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation3_UpperSat_a) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_UpperSat_a;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation3_LowerSat_l) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_LowerSat_l;
  }

  rtb_Saturation3 = (PitchNormalLaw_rtP.Gain_Gain_al * PitchNormalLaw_rtP.Vm_currentms_Value_e * rtb_Gain1_ft +
                     rtb_Gain_g) - (rtb_Saturation3 / (PitchNormalLaw_rtP.Gain5_Gain_d * rtb_uDLookupTable) +
    PitchNormalLaw_rtP.Bias_Bias_a) * (rtb_Y_p - rtb_Y_o2);
  rtb_Y_a = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_b, PitchNormalLaw_rtP.PLUT_tableData_b, 1U);
  rtb_Product1_ck = rtb_Saturation3 * rtb_Y_a;
  rtb_Y_a = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_h, PitchNormalLaw_rtP.DLUT_tableData_p, 1U);
  rtb_Gain1_ft = rtb_Saturation3 * rtb_Y_a * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j;
  rtb_Divide_l = (rtb_Gain1_ft - PitchNormalLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt;
  rtb_Gain_bs = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_e * *rtu_In_V_tas_kn;
  rtb_Divide_m = (rtb_Gain_bs - PitchNormalLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Divide_m, PitchNormalLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Y_gw,
    &PitchNormalLaw_DWork.sf_LagFilter_g3);
  if (rtb_Y_gw > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j) {
    rtb_Divide_a = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j;
  } else if (rtb_Y_gw < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Divide_a = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e;
  } else {
    rtb_Divide_a = rtb_Y_gw;
  }

  PitchNormalLaw_WashoutFilter(minV_tmp, PitchNormalLaw_rtP.WashoutFilter_C1_n, rtu_In_time_dt, &rtb_Y_gw,
    &PitchNormalLaw_DWork.sf_WashoutFilter_c);
  rtb_Y_a = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_n,
    PitchNormalLaw_rtP.ScheduledGain_Table_b, 3U);
  if (rtb_Y_gw > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g) {
    rtb_Y_gw = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g;
  } else if (rtb_Y_gw < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j) {
    rtb_Y_gw = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j;
  }

  rtb_Product_n3 = rtb_Y_gw * rtb_Y_a;
  PitchNormalLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchNormalLaw_rtP.RateLimiterVariableTs2_up_m,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_lo_k, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_RateLimiter_nx);
  rtb_Divide_m = (*rtu_In_alpha_max - *rtu_In_alpha_prot) * rtb_Saturation_as;
  PitchNormalLaw_LagFilter(rtu_In_alpha_deg, PitchNormalLaw_rtP.LagFilter1_C1, rtu_In_time_dt, &rtb_Y_gw,
    &PitchNormalLaw_DWork.sf_LagFilter_m);
  rtb_Sum10 = rtb_Y_gw - *rtu_In_alpha_prot;
  rtb_y = std::fmax(std::fmax(0.0, *rtu_In_Theta_deg - 22.5), std::fmax(0.0, (std::abs(*rtu_In_Phi_deg) - 3.0) / 6.0));
  PitchNormalLaw_WashoutFilter(rtb_y, PitchNormalLaw_rtP.WashoutFilter_C1_b, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_WashoutFilter_h);
  rtb_Saturation3 = (rtb_Divide_m - rtb_Sum10) - rtb_Saturation_as;
  rtb_Divide_m = PitchNormalLaw_rtP.Subsystem1_Gain * rtb_Saturation3;
  rtb_Sum10 = (rtb_Divide_m - PitchNormalLaw_DWork.Delay_DSTATE_f) / *rtu_In_time_dt;
  rtb_Y_a = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem1_C1;
  rtb_Y_n = rtb_Y_a + PitchNormalLaw_rtP.Constant_Value_f;
  PitchNormalLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Y_n * (PitchNormalLaw_rtP.Constant_Value_f - rtb_Y_a) *
    PitchNormalLaw_DWork.Delay1_DSTATE + (rtb_Sum10 + PitchNormalLaw_DWork.Delay_DSTATE_g) * (rtb_Y_a / rtb_Y_n);
  rtb_alpha_err_gain = PitchNormalLaw_rtP.alpha_err_gain_Gain * rtb_Saturation3;
  rtb_y = PitchNormalLaw_rtP.Subsystem3_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_o2 = (rtb_y - PitchNormalLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Y_n = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem3_C1;
  rtb_Saturation3 = rtb_Y_n + PitchNormalLaw_rtP.Constant_Value_b;
  PitchNormalLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_Saturation3 * (PitchNormalLaw_rtP.Constant_Value_b - rtb_Y_n) *
    PitchNormalLaw_DWork.Delay1_DSTATE_i + (rtb_Divide_o2 + PitchNormalLaw_DWork.Delay_DSTATE_ca) * (rtb_Y_n /
    rtb_Saturation3);
  rtb_qk_gain = PitchNormalLaw_rtP.qk_gain_Gain * *rtu_In_qk_deg_s;
  rtb_qk_dot_gain = PitchNormalLaw_rtP.qk_dot_gain_Gain * *rtu_In_qk_dot_deg_s2;
  rtb_Y_a = *rtu_In_high_aoa_prot_active;
  rtb_Saturation_as = PitchNormalLaw_rtP.RateLimiterVariableTs5_up * *rtu_In_time_dt;
  rtb_Y_a = std::fmin(rtb_Y_a - PitchNormalLaw_DWork.Delay_DSTATE_e, rtb_Saturation_as);
  rtb_Saturation_as = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs5_lo;
  PitchNormalLaw_DWork.Delay_DSTATE_e += std::fmax(rtb_Y_a, rtb_Saturation_as);
  if (PitchNormalLaw_DWork.Delay_DSTATE_e > PitchNormalLaw_rtP.Saturation_UpperSat_eo) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_UpperSat_eo;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_e < PitchNormalLaw_rtP.Saturation_LowerSat_h) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Saturation_as = PitchNormalLaw_DWork.Delay_DSTATE_e;
  }

  rtb_uDLookupTable = (((PitchNormalLaw_rtP.precontrol_gain_Gain * PitchNormalLaw_DWork.Delay1_DSTATE +
    rtb_alpha_err_gain) + PitchNormalLaw_rtP.v_dot_gain_Gain * PitchNormalLaw_DWork.Delay1_DSTATE_i) + rtb_qk_gain) +
    rtb_qk_dot_gain;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation3_UpperSat_f) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_UpperSat_f;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation3_LowerSat_c) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_LowerSat_c;
  }

  rtb_Product_k = rtb_uDLookupTable * rtb_Saturation_as;
  rtb_Sum1_d4 = PitchNormalLaw_rtP.Constant_Value_fe - rtb_Saturation_as;
  rtb_alpha_err_gain = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  rtb_Divide_kq = (rtb_alpha_err_gain - PitchNormalLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt;
  rtb_Gain1_e = PitchNormalLaw_rtP.Gain1_Gain_en * *rtu_In_qk_deg_s;
  rtb_Saturation_as = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_b,
    PitchNormalLaw_rtP.uDLookupTable_tableData_h, 6U);
  rtb_uDLookupTable = *rtu_In_V_tas_kn;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation3_UpperSat_b) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_UpperSat_b;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation3_LowerSat_e) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_LowerSat_e;
  }

  rtb_Bias_o = rtb_Saturation_as / (PitchNormalLaw_rtP.Gain5_Gain_e * rtb_uDLookupTable) +
    PitchNormalLaw_rtP.Bias_Bias_f;
  PitchNormalLaw_RateLimiter_c(rtu_In_ap_theta_c_deg, PitchNormalLaw_rtP.RateLimiterVariableTs1_up_d,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_lo_g, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_l, &rtb_Y_p, &PitchNormalLaw_DWork.sf_RateLimiter_d);
  rtb_uDLookupTable = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_h,
    PitchNormalLaw_rtP.ScheduledGain_Table_j, 6U);
  PitchNormalLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchNormalLaw_rtP.RateLimiterVariableTs_up_n,
    PitchNormalLaw_rtP.RateLimiterVariableTs_lo_c, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_gw, &PitchNormalLaw_DWork.sf_RateLimiter_c2);
  rtb_Y_n = *rtu_In_delta_eta_pos - PitchNormalLaw_DWork.Delay_DSTATE_b;
  rtb_Saturation3 = PitchNormalLaw_rtP.RateLimiterVariableTs3_up_i * *rtu_In_time_dt;
  rtb_Y_n = std::fmin(rtb_Y_n, rtb_Saturation3);
  rtb_Saturation3 = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs3_lo_b;
  PitchNormalLaw_DWork.Delay_DSTATE_b += std::fmax(rtb_Y_n, rtb_Saturation3);
  rtb_v_target = std::fmax((*rtu_In_high_speed_prot_low_kn - *rtu_In_high_speed_prot_high_kn) *
    PitchNormalLaw_DWork.Delay_DSTATE_b, 0.0) + *rtu_In_high_speed_prot_low_kn;
  rtb_qk_gain = PitchNormalLaw_rtP.Subsystem2_Gain * rtb_v_target;
  rtb_qk_dot_gain = (rtb_qk_gain - PitchNormalLaw_DWork.Delay_DSTATE_ku) / *rtu_In_time_dt;
  rtb_Saturation_as = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem2_C1;
  rtb_Y_n = rtb_Saturation_as + PitchNormalLaw_rtP.Constant_Value_ja;
  PitchNormalLaw_DWork.Delay1_DSTATE_l = 1.0 / rtb_Y_n * (PitchNormalLaw_rtP.Constant_Value_ja - rtb_Saturation_as) *
    PitchNormalLaw_DWork.Delay1_DSTATE_l + (rtb_qk_dot_gain + PitchNormalLaw_DWork.Delay_DSTATE_gl) * (rtb_Saturation_as
    / rtb_Y_n);
  rtb_Gain_ll = PitchNormalLaw_rtP.Subsystem_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_b4 = (rtb_Gain_ll - PitchNormalLaw_DWork.Delay_DSTATE_m) / *rtu_In_time_dt;
  rtb_Saturation_as = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem_C1;
  rtb_Y_n = rtb_Saturation_as + PitchNormalLaw_rtP.Constant_Value_jj;
  PitchNormalLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Y_n * (PitchNormalLaw_rtP.Constant_Value_jj - rtb_Saturation_as) *
    PitchNormalLaw_DWork.Delay1_DSTATE_n + (rtb_Divide_b4 + PitchNormalLaw_DWork.Delay_DSTATE_k2) * (rtb_Saturation_as /
    rtb_Y_n);
  rtb_in_rotation = *rtu_In_high_speed_prot_active;
  rtb_Saturation3 = PitchNormalLaw_rtP.RateLimiterVariableTs4_up * *rtu_In_time_dt;
  rtb_Y_n = std::fmin(static_cast<real_T>(rtb_in_rotation) - PitchNormalLaw_DWork.Delay_DSTATE_mz, rtb_Saturation3);
  rtb_Saturation3 = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs4_lo;
  PitchNormalLaw_DWork.Delay_DSTATE_mz += std::fmax(rtb_Y_n, rtb_Saturation3);
  PitchNormalLaw_RateLimiter(rtb_in_flare, PitchNormalLaw_rtP.RateLimiterVariableTs6_up_n,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_lo_p, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_InitialCondition_f, &rtb_Y_a, &PitchNormalLaw_DWork.sf_RateLimiter_l);
  if (*rtu_In_any_ap_engaged) {
    rtb_Saturation_as = rtb_Y_p - *rtu_In_Theta_deg;
    rtb_Saturation_as *= rtb_uDLookupTable;
  } else {
    rtb_Saturation_as = look1_binlxpw(rtb_Y_gw, PitchNormalLaw_rtP.Loaddemand_bp01Data,
      PitchNormalLaw_rtP.Loaddemand_tableData, 2U);
    if (rtb_Y_a > PitchNormalLaw_rtP.Saturation_UpperSat) {
      rtb_Y_a = PitchNormalLaw_rtP.Saturation_UpperSat;
    } else if (rtb_Y_a < PitchNormalLaw_rtP.Saturation_LowerSat) {
      rtb_Y_a = PitchNormalLaw_rtP.Saturation_LowerSat;
    }

    rtb_Y_p = PitchNormalLaw_DWork.Delay_DSTATE - *rtu_In_Theta_deg;
    rtb_uDLookupTable = PitchNormalLaw_rtP.Gain_Gain * rtb_Y_p;
    if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_g) {
      rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_g;
    } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_d) {
      rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_d;
    }

    rtb_Y_p = (PitchNormalLaw_rtP.Constant_Value_g - rtb_Y_a) * PitchNormalLaw_rtP.Constant_Value_l + rtb_uDLookupTable *
      rtb_Y_a;
    if (PitchNormalLaw_DWork.Delay_DSTATE_mz > PitchNormalLaw_rtP.Saturation_UpperSat_e) {
      rtb_Y_gw = PitchNormalLaw_rtP.Saturation_UpperSat_e;
    } else if (PitchNormalLaw_DWork.Delay_DSTATE_mz < PitchNormalLaw_rtP.Saturation_LowerSat_m) {
      rtb_Y_gw = PitchNormalLaw_rtP.Saturation_LowerSat_m;
    } else {
      rtb_Y_gw = PitchNormalLaw_DWork.Delay_DSTATE_mz;
    }

    if (rtb_in_rotation > PitchNormalLaw_rtP.Switch2_Threshold) {
      rtb_Y_a = PitchNormalLaw_rtP.qk_dot_gain1_Gain * *rtu_In_qk_dot_deg_s2;
      rtb_Y_n = PitchNormalLaw_rtP.qk_gain_HSP_Gain * *rtu_In_qk_deg_s;
      rtb_uDLookupTable = rtb_v_target - *rtu_In_V_ias_kn;
      rtb_uDLookupTable = ((((PitchNormalLaw_rtP.precontrol_gain_HSP_Gain * PitchNormalLaw_DWork.Delay1_DSTATE_l +
        PitchNormalLaw_rtP.Gain6_Gain * rtb_uDLookupTable) + PitchNormalLaw_rtP.v_dot_gain_HSP_Gain *
        PitchNormalLaw_DWork.Delay1_DSTATE_n) + rtb_Y_n) + rtb_Y_a) * PitchNormalLaw_rtP.HSP_gain_Gain;
      if (rtb_Saturation_as > PitchNormalLaw_rtP.Saturation8_UpperSat) {
        rtb_Y_a = PitchNormalLaw_rtP.Saturation8_UpperSat;
      } else if (rtb_Saturation_as < PitchNormalLaw_rtP.Saturation8_LowerSat) {
        rtb_Y_a = PitchNormalLaw_rtP.Saturation8_LowerSat;
      } else {
        rtb_Y_a = rtb_Saturation_as;
      }

      if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation4_UpperSat) {
        rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation4_UpperSat;
      } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation4_LowerSat) {
        rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation4_LowerSat;
      }

      rtb_Y_a += rtb_uDLookupTable;
    } else {
      rtb_Y_a = PitchNormalLaw_rtP.Constant1_Value;
    }

    rtb_Saturation_as = ((PitchNormalLaw_rtP.Constant_Value_m - rtb_Y_gw) * rtb_Saturation_as + rtb_Y_a * rtb_Y_gw) +
      rtb_Y_p;
  }

  rtb_uDLookupTable = *rtu_In_Phi_deg;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_f1) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_f1;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_o1) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_o1;
  }

  rtb_Saturation_as = (PitchNormalLaw_rtP.Gain_Gain_b * PitchNormalLaw_rtP.Vm_currentms_Value_h * rtb_Gain1_e +
                       rtb_Gain_g) - ((rtb_Cos / std::cos(PitchNormalLaw_rtP.Gain1_Gain_lm * rtb_uDLookupTable) +
    rtb_Saturation_as) - rtb_Y_o2) * rtb_Bias_o;
  rtb_Y_n = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_f, PitchNormalLaw_rtP.PLUT_tableData_k, 1U);
  rtb_Y_a = rtb_Saturation_as * rtb_Y_n;
  rtb_Y_n = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_m, PitchNormalLaw_rtP.DLUT_tableData_a, 1U);
  rtb_Cos = rtb_Saturation_as * rtb_Y_n * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_Y_gw = (rtb_Cos - PitchNormalLaw_DWork.Delay_DSTATE_jh) / *rtu_In_time_dt;
  rtb_Y_p = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  rtb_Saturation_as = PitchNormalLaw_DWork.Delay_DSTATE_dy;
  rtb_Y_n = (rtb_Y_p - PitchNormalLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Y_n, PitchNormalLaw_rtP.LagFilter_C1_pt, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_LagFilter_i);
  if (rtb_Saturation_as > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_b) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_m) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_m;
  }

  rtb_uDLookupTable = PitchNormalLaw_rtP.Gain_Gain_f * rtb_Saturation_as;
  PitchNormalLaw_WashoutFilter(minV_tmp, PitchNormalLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_WashoutFilter_l);
  rtb_Y_n = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_c,
    PitchNormalLaw_rtP.ScheduledGain_Table_g, 3U);
  if (rtb_Saturation_as > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_o) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_jl) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_jl;
  }

  rtb_uDLookupTable = (((PitchNormalLaw_rtP.Gain3_Gain_c * rtb_Divide_kq + rtb_Y_a) + rtb_Y_gw) + rtb_uDLookupTable) +
    rtb_Saturation_as * rtb_Y_n;
  rtb_Y_a = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  rtb_Saturation3 = (rtb_Y_a - PitchNormalLaw_DWork.Delay_DSTATE_e5) / *rtu_In_time_dt;
  rtb_Y_gw = PitchNormalLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s;
  rtb_Saturation_as = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_a,
    PitchNormalLaw_rtP.uDLookupTable_tableData_p, 6U);
  rtb_Divide_kq = *rtu_In_V_tas_kn;
  if (rtb_Divide_kq > PitchNormalLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_Divide_kq < PitchNormalLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation3_LowerSat_a;
  }

  rtb_Saturation_as = (PitchNormalLaw_rtP.Gain_Gain_p * PitchNormalLaw_rtP.Vm_currentms_Value_p * rtb_Y_gw + rtb_Gain_g)
    - (rtb_Saturation_as / (PitchNormalLaw_rtP.Gain5_Gain_n * rtb_Divide_kq) + PitchNormalLaw_rtP.Bias_Bias_ai) *
    (rtb_Y_h - rtb_Y_o2);
  rtb_Y_n = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_a, PitchNormalLaw_rtP.PLUT_tableData_o, 1U);
  rtb_Gain1_e = rtb_Saturation_as * rtb_Y_n;
  rtb_Y_n = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_k, PitchNormalLaw_rtP.DLUT_tableData_e, 1U);
  rtb_Y_h = rtb_Saturation_as * rtb_Y_n * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Bias_o = (rtb_Y_h - PitchNormalLaw_DWork.Delay_DSTATE_gz) / *rtu_In_time_dt;
  rtb_Y_gw = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  rtb_Saturation_as = PitchNormalLaw_DWork.Delay_DSTATE_lf;
  rtb_Y_n = (rtb_Y_gw - PitchNormalLaw_DWork.Delay_DSTATE_lf) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Y_n, PitchNormalLaw_rtP.LagFilter_C1_l, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_LagFilter_g);
  if (rtb_Saturation_as > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek;
  }

  rtb_v_target = PitchNormalLaw_rtP.Gain_Gain_k * rtb_Saturation_as;
  PitchNormalLaw_WashoutFilter(minV_tmp, PitchNormalLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_WashoutFilter_d);
  rtb_Y_n = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_f,
    PitchNormalLaw_rtP.ScheduledGain_Table_h, 3U);
  rtb_Divide_kq = (((PitchNormalLaw_rtP.Gain3_Gain_m * rtb_Divide_cq + rtb_Product1_ck) + rtb_Divide_l) +
                   PitchNormalLaw_rtP.Gain_Gain_j * rtb_Divide_a) + rtb_Product_n3;
  if (rtb_Saturation_as > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Saturation_as = (((PitchNormalLaw_rtP.Gain3_Gain_b * rtb_Saturation3 + rtb_Gain1_e) + rtb_Bias_o) + rtb_v_target)
    + rtb_Saturation_as * rtb_Y_n;
  if (rtb_Divide_kq > PitchNormalLaw_rtP.Saturation_UpperSat_hc) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation_UpperSat_hc;
  } else if (rtb_Divide_kq < PitchNormalLaw_rtP.Saturation_LowerSat_a) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation_LowerSat_a;
  }

  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_k) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_p1) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_p1;
  }

  if (rtb_Saturation_as > PitchNormalLaw_rtP.Saturation_UpperSat_j) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.Saturation_LowerSat_dw) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_LowerSat_dw;
  }

  PitchNormalLaw_VoterAttitudeProtection(rtb_Divide_kq, rtb_Product_k + rtb_Sum1_d4 * rtb_uDLookupTable,
    rtb_Saturation_as, &rtb_Saturation3);
  rtb_Divide_cq = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_k * *rtu_In_qk_deg_s;
  rtb_Product1_ck = (rtb_Divide_cq - PitchNormalLaw_DWork.Delay_DSTATE_ho) / *rtu_In_time_dt;
  rtb_Divide_l = PitchNormalLaw_rtP.Gain1_Gain_lk * *rtu_In_qk_deg_s;
  rtb_Saturation_as = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_m,
    PitchNormalLaw_rtP.uDLookupTable_tableData_a, 6U);
  rtb_uDLookupTable = *rtu_In_V_tas_kn;
  rtb_Divide_kq = PitchNormalLaw_rtP.Gain3_Gain_g * PitchNormalLaw_rtP.Theta_max3_Value - rtb_Loaddemand2;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation3_UpperSat_e) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_UpperSat_e;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation3_LowerSat_k) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation3_LowerSat_k;
  }

  if (rtb_Divide_kq > PitchNormalLaw_rtP.Saturation2_UpperSat) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Divide_kq < PitchNormalLaw_rtP.Saturation2_LowerSat) {
    rtb_Divide_kq = PitchNormalLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Saturation_as = (PitchNormalLaw_rtP.Gain_Gain_jq * PitchNormalLaw_rtP.Vm_currentms_Value_b * rtb_Divide_l +
                       rtb_Gain_g) - (rtb_Saturation_as / (PitchNormalLaw_rtP.Gain5_Gain_m * rtb_uDLookupTable) +
    PitchNormalLaw_rtP.Bias_Bias_m) * ((rtb_Y_o2 + look1_binlxpw(rtb_Divide_kq, PitchNormalLaw_rtP.Loaddemand2_bp01Data,
    PitchNormalLaw_rtP.Loaddemand2_tableData, 2U)) - rtb_Y_o2);
  rtb_Y_n = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_e, PitchNormalLaw_rtP.PLUT_tableData_g, 1U);
  rtb_Y_o2 = rtb_Saturation_as * rtb_Y_n;
  rtb_Y_n = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_hw, PitchNormalLaw_rtP.DLUT_tableData_l, 1U);
  rtb_Loaddemand2 = rtb_Saturation_as * rtb_Y_n * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_c;
  rtb_Divide_l = (rtb_Loaddemand2 - PitchNormalLaw_DWork.Delay_DSTATE_ds) / *rtu_In_time_dt;
  rtb_Gain_g = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_p * *rtu_In_V_tas_kn;
  rtb_Saturation_as = PitchNormalLaw_DWork.Delay_DSTATE_jt;
  rtb_Divide_a = (rtb_Gain_g - PitchNormalLaw_DWork.Delay_DSTATE_jt) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Divide_a, PitchNormalLaw_rtP.LagFilter_C1_f, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_LagFilter_n);
  if (rtb_Saturation_as > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n;
  }

  rtb_Divide_a = PitchNormalLaw_rtP.Gain_Gain_l0 * rtb_Saturation_as;
  PitchNormalLaw_WashoutFilter(minV_tmp, PitchNormalLaw_rtP.WashoutFilter_C1_j, rtu_In_time_dt, &rtb_Saturation_as,
    &PitchNormalLaw_DWork.sf_WashoutFilter);
  rtb_Y_n = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_b,
    PitchNormalLaw_rtP.ScheduledGain_Table_e, 3U);
  if (rtb_Saturation_as > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d) {
    rtb_Saturation_as = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d;
  }

  rtb_Saturation_as = (((PitchNormalLaw_rtP.Gain3_Gain_n * rtb_Product1_ck + rtb_Y_o2) + rtb_Divide_l) + rtb_Divide_a) +
    rtb_Saturation_as * rtb_Y_n;
  rtb_uDLookupTable = (((PitchNormalLaw_rtP.Gain3_Gain * rtb_Divide + rtb_Product1_dm) + rtb_Divide_o) +
                       PitchNormalLaw_rtP.Gain_Gain_l * y) + rtb_Product_kz;
  if (rtb_uDLookupTable > PitchNormalLaw_rtP.Saturation_UpperSat_h) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_uDLookupTable < PitchNormalLaw_rtP.Saturation_LowerSat_o) {
    rtb_uDLookupTable = PitchNormalLaw_rtP.Saturation_LowerSat_o;
  }

  if (rtb_Saturation_as > PitchNormalLaw_rtP.Saturation_UpperSat_a) {
    rtb_Y_o2 = PitchNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Saturation_as < PitchNormalLaw_rtP.Saturation_LowerSat_k) {
    rtb_Y_o2 = PitchNormalLaw_rtP.Saturation_LowerSat_k;
  } else {
    rtb_Y_o2 = rtb_Saturation_as;
  }

  PitchNormalLaw_VoterAttitudeProtection(rtb_uDLookupTable, rtb_Saturation3, rtb_Y_o2, &rtb_Saturation_as);
  rtb_Y_o2 = rtb_Saturation_as;
  rtb_Saturation_as = look1_binlxpw(*rtu_In_time_dt, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_d,
    PitchNormalLaw_rtP.ScheduledGain_Table_hh, 4U);
  rtb_Saturation_as = rtb_Y_o2 * rtb_Saturation_as * PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain *
    *rtu_In_time_dt;
  if (PitchNormalLaw_B.in_flight > PitchNormalLaw_rtP.Switch_Threshold) {
    rtb_Y_n = *rtu_In_eta_deg;
  } else {
    rtb_Y_n = rtb_Gain;
  }

  rtb_OR = ((rtb_ManualSwitch == 0.0) || (*rtu_In_tracking_mode_on));
  PitchNormalLaw_DWork.icLoad = (rtb_OR || PitchNormalLaw_DWork.icLoad);
  if (PitchNormalLaw_DWork.icLoad) {
    PitchNormalLaw_DWork.Delay_DSTATE_o = rtb_Y_n - rtb_Saturation_as;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_o += rtb_Saturation_as;
  if (PitchNormalLaw_DWork.Delay_DSTATE_o > PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    PitchNormalLaw_DWork.Delay_DSTATE_o = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_o < PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    PitchNormalLaw_DWork.Delay_DSTATE_o = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_eta_trim_deg_should_freeze == PitchNormalLaw_rtP.CompareToConstant_const) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Constant_Value;
  } else {
    rtb_Saturation_as = PitchNormalLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Saturation_as = PitchNormalLaw_rtP.Gain_Gain_cy * rtb_Saturation_as *
    PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTsLimit_Gain * *rtu_In_time_dt;
  PitchNormalLaw_DWork.icLoad_p = (rtb_eta_trim_deg_reset || PitchNormalLaw_DWork.icLoad_p);
  if (PitchNormalLaw_DWork.icLoad_p) {
    PitchNormalLaw_DWork.Delay_DSTATE_a = rtb_eta_trim_deg_reset_deg - rtb_Saturation_as;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_a += rtb_Saturation_as;
  if (PitchNormalLaw_DWork.Delay_DSTATE_a > rtb_Switch1) {
    PitchNormalLaw_DWork.Delay_DSTATE_a = rtb_Switch1;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_a < rtb_y_d) {
    PitchNormalLaw_DWork.Delay_DSTATE_a = rtb_y_d;
  }

  rtb_Saturation3 = rtb_eta_trim_deg_rate_limit_up_deg_s * *rtu_In_time_dt;
  rtb_Y_n = std::fmin(PitchNormalLaw_DWork.Delay_DSTATE_a - PitchNormalLaw_DWork.Delay_DSTATE_aa, rtb_Saturation3);
  rtb_Saturation3 = *rtu_In_time_dt * rtb_eta_trim_deg_rate_limit_lo_deg_s;
  *rty_Out_eta_trim_deg = PitchNormalLaw_DWork.Delay_DSTATE_aa + std::fmax(rtb_Y_n, rtb_Saturation3);
  if (rtb_ManualSwitch > PitchNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (rtb_ManualSwitch < PitchNormalLaw_rtP.Saturation_LowerSat_kp) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_LowerSat_kp;
  } else {
    rtb_Saturation_as = rtb_ManualSwitch;
  }

  rtb_eta_trim_deg_rate_limit_lo_deg_s = PitchNormalLaw_DWork.Delay_DSTATE_o * rtb_Saturation_as;
  rtb_Switch1 = PitchNormalLaw_rtP.Constant_Value_o1 - rtb_Saturation_as;
  PitchNormalLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchNormalLaw_rtP.RateLimiterVariableTs_up_na,
    PitchNormalLaw_rtP.RateLimiterVariableTs_lo_i, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Y_o2, &PitchNormalLaw_DWork.sf_RateLimiter_ct);
  rtb_Saturation_as = look2_binlxpw(*rtu_In_Theta_deg, *rtu_In_H_radio_ft, PitchNormalLaw_rtP.uDLookupTable_bp01Data_l,
    PitchNormalLaw_rtP.uDLookupTable_bp02Data, PitchNormalLaw_rtP.uDLookupTable_tableData_e5,
    PitchNormalLaw_rtP.uDLookupTable_maxIndex, 5U);
  rtb_Y_n = *rtu_In_tailstrike_protection_on;
  if (rtb_Y_o2 > PitchNormalLaw_rtP.Saturation3_UpperSat_l) {
    rtb_eta_trim_deg_reset_deg = PitchNormalLaw_rtP.Saturation3_UpperSat_l;
  } else if (rtb_Y_o2 < PitchNormalLaw_rtP.Saturation3_LowerSat_h) {
    rtb_eta_trim_deg_reset_deg = PitchNormalLaw_rtP.Saturation3_LowerSat_h;
  } else {
    rtb_eta_trim_deg_reset_deg = rtb_Y_o2;
  }

  rtb_Saturation_as = look1_binlxpw(rtb_Y_n * rtb_Saturation_as * rtb_eta_trim_deg_reset_deg + rtb_Y_o2,
    PitchNormalLaw_rtP.PitchRateDemand_bp01Data, PitchNormalLaw_rtP.PitchRateDemand_tableData, 2U);
  rtb_eta_trim_deg_reset_deg = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j3 * rtb_Saturation_as;
  rtb_y_d = (rtb_eta_trim_deg_reset_deg - PitchNormalLaw_DWork.Delay_DSTATE_ej) / *rtu_In_time_dt;
  rtb_Y_n = *rtu_In_qk_deg_s - rtb_Saturation_as;
  rtb_Y_o2 = PitchNormalLaw_rtP.Gain_Gain_pt * rtb_Y_n;
  rtb_eta_trim_deg_rate_limit_up_deg_s = PitchNormalLaw_rtP.Gain1_Gain_d * rtb_Y_n *
    PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_g;
  rtb_Y_n = PitchNormalLaw_DWork.Delay_DSTATE_e4;
  rtb_Product1_dm = (rtb_eta_trim_deg_rate_limit_up_deg_s - PitchNormalLaw_DWork.Delay_DSTATE_e4) / *rtu_In_time_dt;
  rtb_Divide = PitchNormalLaw_rtP.Gain5_Gain_h * *rtu_In_qk_dot_deg_s2;
  rtb_Divide += *rtu_In_qk_deg_s;
  PitchNormalLaw_LagFilter_n(rtb_Divide, PitchNormalLaw_rtP.LagFilter_C1_k, rtu_In_time_dt, &rtb_Y_n,
    &PitchNormalLaw_DWork.sf_LagFilter_f);
  rtb_Divide = PitchNormalLaw_rtP.Gain6_Gain_g * *rtu_In_qk_dot_deg_s2;
  rtb_Saturation_as = ((((rtb_Y_o2 + rtb_Product1_dm) * PitchNormalLaw_rtP.Gain1_Gain_a +
    PitchNormalLaw_rtP.Gain3_Gain_e * rtb_y_d) + (rtb_Y_n - rtb_Saturation_as) * PitchNormalLaw_rtP.Gain4_Gain) +
                       rtb_Divide) * (PitchNormalLaw_rtP.Constant2_Value_k - rtb_ManualSwitch) *
    PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain_j * *rtu_In_time_dt;
  rtb_eta_trim_deg_should_freeze = (*rtu_In_delta_eta_pos <= PitchNormalLaw_rtP.Constant_Value_o);
  rtb_eta_trim_deg_should_freeze = (rtb_eta_trim_deg_should_freeze && (*rtu_In_on_ground));
  rtb_eta_trim_deg_should_freeze = (rtb_eta_trim_deg_should_freeze || (rtb_Y_j == 0.0) || (*rtu_In_tracking_mode_on));
  PitchNormalLaw_DWork.icLoad_pu = (rtb_eta_trim_deg_should_freeze || PitchNormalLaw_DWork.icLoad_pu);
  if (PitchNormalLaw_DWork.icLoad_pu) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.Constant_Value_jk - rtb_Saturation_as;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_cl += rtb_Saturation_as;
  if (PitchNormalLaw_DWork.Delay_DSTATE_cl > PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_cl < PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_h) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_h;
  }

  if (*rtu_In_on_ground) {
    if (rtb_Gain > PitchNormalLaw_rtP.Saturation_UpperSat_f) {
      rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_UpperSat_f;
    } else if (rtb_Gain < PitchNormalLaw_rtP.Saturation_LowerSat_p) {
      rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_LowerSat_p;
    } else {
      rtb_Saturation_as = rtb_Gain;
    }
  } else {
    rtb_Saturation_as = PitchNormalLaw_rtP.Constant1_Value_h;
  }

  rtb_ManualSwitch = PitchNormalLaw_DWork.Delay_DSTATE_cl + rtb_Saturation_as;
  if (rtb_Y_j > PitchNormalLaw_rtP.Saturation_UpperSat_m) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_UpperSat_m;
  } else if (rtb_Y_j < PitchNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Saturation_as = PitchNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Saturation_as = rtb_Y_j;
  }

  PitchNormalLaw_RateLimiter(rtb_eta_trim_deg_rate_limit_lo_deg_s + rtb_Switch1 * (rtb_ManualSwitch * rtb_Saturation_as
    + (PitchNormalLaw_rtP.Constant_Value_hz - rtb_Saturation_as) * rtb_Gain), PitchNormalLaw_rtP.RateLimitereta_up,
    PitchNormalLaw_rtP.RateLimitereta_lo, rtu_In_time_dt, PitchNormalLaw_rtP.RateLimitereta_InitialCondition,
    rty_Out_eta_deg, &PitchNormalLaw_DWork.sf_RateLimiter_b);
  PitchNormalLaw_DWork.Delay_DSTATE_h = rtb_Switch1_a;
  PitchNormalLaw_DWork.Delay_DSTATE_n = rtb_Gain_px;
  PitchNormalLaw_DWork.Delay_DSTATE_c = rtb_Gain_ot;
  PitchNormalLaw_DWork.Delay_DSTATE_l = rtb_Divide_an;
  PitchNormalLaw_DWork.Delay_DSTATE_k = rtb_Gain1_ft;
  PitchNormalLaw_DWork.Delay_DSTATE_d = rtb_Gain_bs;
  PitchNormalLaw_DWork.Delay_DSTATE_f = rtb_Divide_m;
  PitchNormalLaw_DWork.Delay_DSTATE_g = rtb_Sum10;
  PitchNormalLaw_DWork.Delay_DSTATE_j = rtb_y;
  PitchNormalLaw_DWork.Delay_DSTATE_ca = rtb_Divide_o2;
  PitchNormalLaw_DWork.Delay_DSTATE_kd = rtb_alpha_err_gain;
  PitchNormalLaw_DWork.Delay_DSTATE_ku = rtb_qk_gain;
  PitchNormalLaw_DWork.Delay_DSTATE_gl = rtb_qk_dot_gain;
  PitchNormalLaw_DWork.Delay_DSTATE_m = rtb_Gain_ll;
  PitchNormalLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_b4;
  PitchNormalLaw_DWork.Delay_DSTATE_jh = rtb_Cos;
  PitchNormalLaw_DWork.Delay_DSTATE_dy = rtb_Y_p;
  PitchNormalLaw_DWork.Delay_DSTATE_e5 = rtb_Y_a;
  PitchNormalLaw_DWork.Delay_DSTATE_gz = rtb_Y_h;
  PitchNormalLaw_DWork.Delay_DSTATE_lf = rtb_Y_gw;
  PitchNormalLaw_DWork.Delay_DSTATE_ho = rtb_Divide_cq;
  PitchNormalLaw_DWork.Delay_DSTATE_ds = rtb_Loaddemand2;
  PitchNormalLaw_DWork.Delay_DSTATE_jt = rtb_Gain_g;
  PitchNormalLaw_DWork.icLoad = false;
  PitchNormalLaw_DWork.icLoad_p = false;
  PitchNormalLaw_DWork.Delay_DSTATE_aa = *rty_Out_eta_trim_deg;
  PitchNormalLaw_DWork.Delay_DSTATE_ej = rtb_eta_trim_deg_reset_deg;
  PitchNormalLaw_DWork.Delay_DSTATE_e4 = rtb_eta_trim_deg_rate_limit_up_deg_s;
  PitchNormalLaw_DWork.icLoad_pu = false;
}

PitchNormalLaw::PitchNormalLaw():
  PitchNormalLaw_B(),
  PitchNormalLaw_DWork()
{
}

PitchNormalLaw::~PitchNormalLaw()
{
}
