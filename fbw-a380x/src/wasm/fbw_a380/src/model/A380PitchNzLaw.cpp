#include "A380PitchNzLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"

const uint8_T A380PitchNzLaw_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PitchNzLaw_IN_frozen{ 1U };

const uint8_T A380PitchNzLaw_IN_running{ 2U };

const uint8_T A380PitchNzLaw_IN_Flight{ 1U };

const uint8_T A380PitchNzLaw_IN_FlightToGroundTransition{ 2U };

const uint8_T A380PitchNzLaw_IN_Ground{ 3U };

const uint8_T A380PitchNzLaw_IN_GroundToFlightTransition{ 4U };

const uint8_T A380PitchNzLaw_IN_automatic{ 1U };

const uint8_T A380PitchNzLaw_IN_manual{ 2U };

const uint8_T A380PitchNzLaw_IN_reset{ 3U };

const uint8_T A380PitchNzLaw_IN_tracking{ 4U };

const uint8_T A380PitchNzLaw_IN_flight_clean{ 1U };

const uint8_T A380PitchNzLaw_IN_flight_flaps{ 2U };

const uint8_T A380PitchNzLaw_IN_ground{ 3U };

A380PitchNzLaw::Parameters_A380PitchNzLaw_T A380PitchNzLaw::A380PitchNzLaw_rtP{

  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 163.0, 243.0, 344.0, 400.0 },


  { 0.0, 0.06, 0.1, 0.13, 0.26, 1.0 },

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

  -30.0,


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.1, 0.1, 0.15, 0.2, 0.3, 0.5, 0.5 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },


  { 1.0, 1.0, 1.0, 1.0, 1.0, 0.25 },

  20.0,

  100.0,

  1.0,

  -10.0,

  -0.5,

  -0.5,

  -0.5,

  -1.0,

  -1.0,

  -0.25,

  -2.0,

  -4.0,

  -0.5,

  -0.33333333333333331,

  -4.0,

  -45.0,

  0.2,

  0.5,

  0.5,

  0.5,

  1.0,

  1.0,

  4.0,

  2.0,

  4.0,

  0.5,

  4.0,

  4.0,

  45.0,

  true,

  0.0,

  1.0,

  2.0,

  -10.0,

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

  0.0,

  340.0,

  -0.1,

  0.5,

  0.0,


  { 180.0, 145.0, 130.0, 120.0, 120.0, 115.0 },


  { 0.0, 1.0, 2.0, 3.0, 4.0, 5.0 },

  -0.04,

  0.0,

  -0.5,


  { -2.0, 0.0, 1.5 },


  { -1.0, 0.0, 1.0 },

  1.0,

  1.0,

  0.0,

  0.0,

  1.0,

  0.0,

  0.0,

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

  0.6,

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


  { 11.5, 11.5 },


  { 0.0, 350.0 },


  { 0.3, 0.3 },


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

  0.076923076923076927,

  1.0,

  0.0,

  5.0,


  { 10.5, 10.5, 12.5, 90.0, 90.0 },


  { -1.0, 0.0, 5.0, 10.0, 20.0 },

  5.0,

  20.0,

  0.0,

  1.0,

  1.0,

  0.0,

  1.0,

  -0.2,

  10.0,

  0.0,

  -15.0,

  0.0,

  -1.0,

  0.0,

  2.0,

  -2.0,

  20.0,

  -30.0,

  1U
};

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter_Reset(rtDW_RateLimiter_A380PitchNzLaw_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PitchNzLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380PitchNzLaw::A380PitchNzLaw_eta_trim_limit_lofreeze_Reset(rtDW_eta_trim_limit_lofreeze_A380PitchNzLaw_T *localDW)
{
  localDW->frozen_eta_trim_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_eta_trim_limit_lofreeze(const real_T *rtu_eta_trim, const boolean_T *rtu_trigger,
  real_T *rty_y, rtDW_eta_trim_limit_lofreeze_A380PitchNzLaw_T *localDW)
{
  if ((!*rtu_trigger) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = *rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter_l_Reset(rtDW_RateLimiter_A380PitchNzLaw_k_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter_h(const real_T *rtu_u, real_T rtu_up, real_T rtu_lo, const real_T
  *rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PitchNzLaw_k_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(*rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380PitchNzLaw::A380PitchNzLaw_LagFilter_Reset(rtDW_LagFilter_A380PitchNzLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_LagFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PitchNzLaw_T *localDW)
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

void A380PitchNzLaw::A380PitchNzLaw_WashoutFilter_Reset(rtDW_WashoutFilter_A380PitchNzLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_A380PitchNzLaw_T *localDW)
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

void A380PitchNzLaw::A380PitchNzLaw_VoterAttitudeProtection(real_T rtu_input, real_T rtu_input_l, real_T rtu_input_o,
  real_T *rty_vote)
{
  real_T rtb_TmpSignalConversionAtSFunctionInport1[3];
  int32_T tmp;
  rtb_TmpSignalConversionAtSFunctionInport1[0] = rtu_input;
  rtb_TmpSignalConversionAtSFunctionInport1[1] = rtu_input_l;
  rtb_TmpSignalConversionAtSFunctionInport1[2] = rtu_input_o;
  if (rtu_input < rtu_input_l) {
    if (rtu_input_l < rtu_input_o) {
      tmp = 1;
    } else if (rtu_input < rtu_input_o) {
      tmp = 2;
    } else {
      tmp = 0;
    }
  } else if (rtu_input < rtu_input_o) {
    tmp = 0;
  } else if (rtu_input_l < rtu_input_o) {
    tmp = 2;
  } else {
    tmp = 1;
  }

  *rty_vote = rtb_TmpSignalConversionAtSFunctionInport1[tmp];
}

void A380PitchNzLaw::init(void)
{
  A380PitchNzLaw_DWork.Delay_DSTATE = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_n = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_c = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_l = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  A380PitchNzLaw_DWork.Delay_DSTATE_k = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  A380PitchNzLaw_DWork.Delay_DSTATE_d = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  A380PitchNzLaw_DWork.Delay_DSTATE_f = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  A380PitchNzLaw_DWork.Delay_DSTATE_g = A380PitchNzLaw_rtP.Delay_InitialCondition;
  A380PitchNzLaw_DWork.Delay1_DSTATE = A380PitchNzLaw_rtP.Delay1_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_j = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  A380PitchNzLaw_DWork.Delay_DSTATE_ca = A380PitchNzLaw_rtP.Delay_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay1_DSTATE_i = A380PitchNzLaw_rtP.Delay1_InitialCondition_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_e = A380PitchNzLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_kd = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  A380PitchNzLaw_DWork.Delay_DSTATE_b = A380PitchNzLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_ku = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  A380PitchNzLaw_DWork.Delay_DSTATE_gl = A380PitchNzLaw_rtP.Delay_InitialCondition_c;
  A380PitchNzLaw_DWork.Delay1_DSTATE_l = A380PitchNzLaw_rtP.Delay1_InitialCondition_gf;
  A380PitchNzLaw_DWork.Delay_DSTATE_m = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_k2 = A380PitchNzLaw_rtP.Delay_InitialCondition_h;
  A380PitchNzLaw_DWork.Delay1_DSTATE_n = A380PitchNzLaw_rtP.Delay1_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_mz = A380PitchNzLaw_rtP.RateLimiterVariableTs4_InitialCondition_f;
  A380PitchNzLaw_DWork.Delay_DSTATE_jh = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  A380PitchNzLaw_DWork.Delay_DSTATE_dy = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_di;
  A380PitchNzLaw_DWork.Delay_DSTATE_e5 = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  A380PitchNzLaw_DWork.Delay_DSTATE_gz = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_lf = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  A380PitchNzLaw_DWork.Delay_DSTATE_h = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_ds = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  A380PitchNzLaw_DWork.Delay_DSTATE_jt = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  A380PitchNzLaw_DWork.icLoad = true;
}

void A380PitchNzLaw::reset(void)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  A380PitchNzLaw_DWork.Delay_DSTATE = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_n = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_c = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_l = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  A380PitchNzLaw_DWork.Delay_DSTATE_k = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  A380PitchNzLaw_DWork.Delay_DSTATE_d = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  A380PitchNzLaw_DWork.Delay_DSTATE_f = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  A380PitchNzLaw_DWork.Delay_DSTATE_g = A380PitchNzLaw_rtP.Delay_InitialCondition;
  A380PitchNzLaw_DWork.Delay1_DSTATE = A380PitchNzLaw_rtP.Delay1_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_j = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  A380PitchNzLaw_DWork.Delay_DSTATE_ca = A380PitchNzLaw_rtP.Delay_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay1_DSTATE_i = A380PitchNzLaw_rtP.Delay1_InitialCondition_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_e = A380PitchNzLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  A380PitchNzLaw_DWork.Delay_DSTATE_kd = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  A380PitchNzLaw_DWork.Delay_DSTATE_b = A380PitchNzLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_ku = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  A380PitchNzLaw_DWork.Delay_DSTATE_gl = A380PitchNzLaw_rtP.Delay_InitialCondition_c;
  A380PitchNzLaw_DWork.Delay1_DSTATE_l = A380PitchNzLaw_rtP.Delay1_InitialCondition_gf;
  A380PitchNzLaw_DWork.Delay_DSTATE_m = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_k2 = A380PitchNzLaw_rtP.Delay_InitialCondition_h;
  A380PitchNzLaw_DWork.Delay1_DSTATE_n = A380PitchNzLaw_rtP.Delay1_InitialCondition_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_mz = A380PitchNzLaw_rtP.RateLimiterVariableTs4_InitialCondition_f;
  A380PitchNzLaw_DWork.Delay_DSTATE_jh = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  A380PitchNzLaw_DWork.Delay_DSTATE_dy = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_di;
  A380PitchNzLaw_DWork.Delay_DSTATE_e5 = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  A380PitchNzLaw_DWork.Delay_DSTATE_gz = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_lf = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  A380PitchNzLaw_DWork.Delay_DSTATE_h = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_ds = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  A380PitchNzLaw_DWork.Delay_DSTATE_jt = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  A380PitchNzLaw_DWork.icLoad = true;
  A380PitchNzLaw_B.in_flight = 0.0;
  A380PitchNzLaw_DWork.on_ground_time = 0.0;
  A380PitchNzLaw_DWork.in_flight_time = 0.0;
  A380PitchNzLaw_DWork.is_active_c3_A380PitchNzLaw = 0U;
  A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNzLaw_DWork.is_active_c8_A380PitchNzLaw = 0U;
  A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNzLaw_DWork.is_active_c9_A380PitchNzLaw = 0U;
  A380PitchNzLaw_DWork.is_c9_A380PitchNzLaw = A380PitchNzLaw_IN_NO_ACTIVE_CHILD;
  rtb_nz_limit_up_g = 0.0;
  rtb_nz_limit_lo_g = 0.0;
  A380PitchNzLaw_DWork.is_active_c7_A380PitchNzLaw = 0U;
  A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_c);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_n);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_l);
  A380PitchNzLaw_eta_trim_limit_lofreeze_Reset(&A380PitchNzLaw_DWork.sf_eta_trim_limit_lofreeze);
  A380PitchNzLaw_eta_trim_limit_lofreeze_Reset(&A380PitchNzLaw_DWork.sf_eta_trim_limit_upfreeze);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_o);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_k);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_k);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_g3);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_c);
  A380PitchNzLaw_RateLimiter_l_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_nx);
  A380PitchNzLaw_DWork.pY_not_empty = false;
  A380PitchNzLaw_DWork.pU_not_empty = false;
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_h);
  A380PitchNzLaw_RateLimiter_l_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_d);
  A380PitchNzLaw_RateLimiter_l_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_c2);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_i);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_l);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_g);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_d);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter);
  A380PitchNzLaw_RateLimiter_l_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_h);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_b);
}

void A380PitchNzLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_time_simulation_time, const real_T
  *rtu_In_nz_g, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const
  real_T *rtu_In_qk_dot_deg_s2, const real_T *rtu_In_eta_deg, const real_T *rtu_In_eta_trim_deg, const real_T
  *rtu_In_alpha_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft,
  const real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const real_T
  *rtu_In_spoilers_right_pos, const real_T *rtu_In_gnd_splr_cmd_deg, const real_T *rtu_In_VLS_kn, const real_T
  *rtu_In_delta_eta_pos, const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
  *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_alpha_prot, const
  real_T *rtu_In_alpha_max, const real_T *rtu_In_high_speed_prot_high_kn, const real_T *rtu_In_high_speed_prot_low_kn,
  const real_T *rtu_In_ap_theta_c_deg, const boolean_T *rtu_In_any_ap_engaged, const boolean_T
  *rtu_In_protections_available, const boolean_T *rtu_In_flare_override, real_T *rty_Out_eta_deg, real_T
  *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T ca;
  real_T denom;
  real_T rtb_Cos;
  real_T rtb_Divide_ew;
  real_T rtb_Divide_nq;
  real_T rtb_Divide_ox;
  real_T rtb_Gain_b;
  real_T rtb_Gain_c;
  real_T rtb_Gain_c2;
  real_T rtb_Gain_dj;
  real_T rtb_Gain_dv;
  real_T rtb_Gain_e;
  real_T rtb_Gain_g;
  real_T rtb_Gain_gm;
  real_T rtb_Gain_ha;
  real_T rtb_Gain_i4;
  real_T rtb_Loaddemand2;
  real_T rtb_Product_fu;
  real_T rtb_Saturation1;
  real_T rtb_Saturation_an;
  real_T rtb_Saturation_ix;
  real_T rtb_Sum1;
  real_T rtb_Sum1_c;
  real_T rtb_Sum1_mw;
  real_T rtb_Sum_ma;
  real_T rtb_Y_ca;
  real_T rtb_Y_cl;
  real_T rtb_Y_e;
  real_T rtb_Y_h;
  real_T rtb_Y_m;
  real_T rtb_Y_pa;
  real_T rtb_alpha_err_gain;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T rtb_v_target;
  real_T rtb_y_o4;
  real_T stick_deg;
  real_T u0;
  real_T y;
  int32_T tmp;
  boolean_T rtb_AND;
  boolean_T rtb_eta_trim_deg_should_freeze;
  if (A380PitchNzLaw_DWork.is_active_c3_A380PitchNzLaw == 0) {
    A380PitchNzLaw_DWork.is_active_c3_A380PitchNzLaw = 1U;
    A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Ground;
    A380PitchNzLaw_B.in_flight = 0.0;
  } else {
    switch (A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw) {
     case A380PitchNzLaw_IN_Flight:
      if ((*rtu_In_on_ground) && (*rtu_In_Theta_deg < 0.5)) {
        A380PitchNzLaw_DWork.on_ground_time = *rtu_In_time_simulation_time;
        A380PitchNzLaw_DWork.in_flight_time = 0.0;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_FlightToGroundTransition;
      } else {
        A380PitchNzLaw_B.in_flight = 1.0;
      }
      break;

     case A380PitchNzLaw_IN_FlightToGroundTransition:
      if (*rtu_In_time_simulation_time - A380PitchNzLaw_DWork.on_ground_time >= 5.0) {
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Ground;
        A380PitchNzLaw_B.in_flight = 0.0;
      } else if ((!*rtu_In_on_ground) || (*rtu_In_Theta_deg >= 0.5)) {
        A380PitchNzLaw_DWork.on_ground_time = 0.0;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Flight;
        A380PitchNzLaw_B.in_flight = 1.0;
      }
      break;

     case A380PitchNzLaw_IN_Ground:
      if (!*rtu_In_on_ground) {
        A380PitchNzLaw_DWork.on_ground_time = 0.0;
        A380PitchNzLaw_DWork.in_flight_time = *rtu_In_time_simulation_time;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_GroundToFlightTransition;
      } else {
        A380PitchNzLaw_B.in_flight = 0.0;
      }
      break;

     default:
      if (*rtu_In_time_simulation_time - A380PitchNzLaw_DWork.in_flight_time >= 5.0) {
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Flight;
        A380PitchNzLaw_B.in_flight = 1.0;
      } else if (*rtu_In_on_ground) {
        A380PitchNzLaw_DWork.in_flight_time = 0.0;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Ground;
        A380PitchNzLaw_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (A380PitchNzLaw_DWork.is_active_c8_A380PitchNzLaw == 0) {
    A380PitchNzLaw_DWork.is_active_c8_A380PitchNzLaw = 1U;
    A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_manual;
  } else {
    switch (A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw) {
     case A380PitchNzLaw_IN_automatic:
      if (A380PitchNzLaw_B.in_flight == 0.0) {
        A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_reset;
      } else if (*rtu_In_tracking_mode_on) {
        A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_tracking;
      }
      break;

     case A380PitchNzLaw_IN_manual:
      if (A380PitchNzLaw_B.in_flight != 0.0) {
        A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_automatic;
      }
      break;

     case A380PitchNzLaw_IN_reset:
      if ((A380PitchNzLaw_B.in_flight == 0.0) && (*rtu_In_eta_trim_deg == 0.0)) {
        A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_manual;
      }
      break;

     default:
      rtb_AND = !*rtu_In_tracking_mode_on;
      if (rtb_AND) {
        A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_automatic;
      } else if (rtb_AND && (A380PitchNzLaw_B.in_flight == 0.0)) {
        A380PitchNzLaw_DWork.is_c8_A380PitchNzLaw = A380PitchNzLaw_IN_manual;
      }
      break;
    }
  }

  if (A380PitchNzLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Constant1_Value;
  } else {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Constant_Value;
  }

  rtb_AND = ((A380PitchNzLaw_B.in_flight != 0.0) && (!*rtu_In_any_ap_engaged) && ((rtb_Saturation1 != 0.0) ||
              (*rtu_In_flare_override) || (*rtu_In_H_radio_ft <= A380PitchNzLaw_rtP.CompareToConstant_const)));
  if (A380PitchNzLaw_DWork.is_active_c9_A380PitchNzLaw == 0) {
    A380PitchNzLaw_DWork.is_active_c9_A380PitchNzLaw = 1U;
    A380PitchNzLaw_DWork.is_c9_A380PitchNzLaw = A380PitchNzLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (A380PitchNzLaw_DWork.is_c9_A380PitchNzLaw == A380PitchNzLaw_IN_frozen) {
    if ((!rtb_AND) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs(*rtu_In_Phi_deg) <= 30.0)) {
      A380PitchNzLaw_DWork.is_c9_A380PitchNzLaw = A380PitchNzLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if (rtb_AND || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs(*rtu_In_Phi_deg) > 30.0)) {
    A380PitchNzLaw_DWork.is_c9_A380PitchNzLaw = A380PitchNzLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  stick_deg = *rtu_In_delta_eta_pos * -16.0;
  if (A380PitchNzLaw_DWork.is_active_c7_A380PitchNzLaw == 0) {
    A380PitchNzLaw_DWork.is_active_c7_A380PitchNzLaw = 1U;
    A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_ground;
    rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
    rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw) {
     case A380PitchNzLaw_IN_flight_clean:
      if (*rtu_In_flaps_handle_index != 0.0) {
        A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_flight_flaps;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else if ((A380PitchNzLaw_B.in_flight == 0.0) && (*rtu_In_flaps_handle_index == 0.0)) {
        A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_ground;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.15;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.15;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      }
      break;

     case A380PitchNzLaw_IN_flight_flaps:
      if (*rtu_In_flaps_handle_index == 0.0) {
        A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.15;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.15;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (A380PitchNzLaw_B.in_flight == 0.0) {
        A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_ground;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;

     default:
      if ((A380PitchNzLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index == 0.0)) {
        A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.15;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.15;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((A380PitchNzLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index != 0.0)) {
        A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_flight_flaps;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;
    }
  }

  if (A380PitchNzLaw_B.in_flight > A380PitchNzLaw_rtP.Saturation_UpperSat_c) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation_UpperSat_c;
  } else if (A380PitchNzLaw_B.in_flight < A380PitchNzLaw_rtP.Saturation_LowerSat_n) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation_LowerSat_n;
  } else {
    rtb_Saturation1 = A380PitchNzLaw_B.in_flight;
  }

  A380PitchNzLaw_RateLimiter(rtb_Saturation1, A380PitchNzLaw_rtP.RateLimiterVariableTs_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_pa, &A380PitchNzLaw_DWork.sf_RateLimiter);
  A380PitchNzLaw_RateLimiter(rtb_nz_limit_up_g, A380PitchNzLaw_rtP.RateLimiterVariableTs2_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_RateLimiter_c);
  A380PitchNzLaw_RateLimiter(rtb_nz_limit_lo_g, A380PitchNzLaw_rtP.RateLimiterVariableTs3_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_cl, &A380PitchNzLaw_DWork.sf_RateLimiter_n);
  A380PitchNzLaw_RateLimiter(static_cast<real_T>(rtb_AND), A380PitchNzLaw_rtP.RateLimiterVariableTs4_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs4_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs4_InitialCondition, &rtb_Y_e, &A380PitchNzLaw_DWork.sf_RateLimiter_l);
  A380PitchNzLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_aoa_prot_active, &rtb_Y_m,
    &A380PitchNzLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (*rtu_In_high_aoa_prot_active) {
    *rty_Out_eta_trim_limit_lo = rtb_Y_m;
  } else {
    *rty_Out_eta_trim_limit_lo = A380PitchNzLaw_rtP.Constant3_Value;
  }

  A380PitchNzLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_speed_prot_active, &rtb_Y_m,
    &A380PitchNzLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (*rtu_In_high_speed_prot_active) {
    *rty_Out_eta_trim_limit_up = rtb_Y_m;
  } else {
    *rty_Out_eta_trim_limit_up = A380PitchNzLaw_rtP.Constant2_Value;
  }

  if (*rtu_In_flaps_handle_index == 5.0) {
    tmp = 25;
  } else {
    tmp = 30;
  }

  A380PitchNzLaw_RateLimiter(static_cast<real_T>(tmp) - std::fmin(5.0, std::fmax(0.0, 5.0 - (*rtu_In_V_ias_kn -
    (*rtu_In_VLS_kn + 5.0)) * 0.25)), A380PitchNzLaw_rtP.RateLimiterVariableTs6_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs6_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs6_InitialCondition, &rtb_Y_m, &A380PitchNzLaw_DWork.sf_RateLimiter_o);
  rtb_Loaddemand2 = A380PitchNzLaw_rtP.Gain1_Gain * *rtu_In_Theta_deg;
  rtb_Cos = std::cos(A380PitchNzLaw_rtP.Gain1_Gain_c * *rtu_In_Theta_deg);
  rtb_Y_ca = rtb_Cos / std::cos(A380PitchNzLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg);
  rtb_Y_m = A380PitchNzLaw_rtP.Gain2_Gain * rtb_Y_m - rtb_Loaddemand2;
  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_UpperSat;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_LowerSat;
  } else {
    rtb_Saturation1 = *rtu_In_V_tas_kn;
  }

  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation1_UpperSat) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation1_LowerSat) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation1_LowerSat;
  }

  rtb_Gain_c2 = *rtu_In_nz_g - rtb_Y_ca;
  rtb_Saturation_ix = (A380PitchNzLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain *
    A380PitchNzLaw_rtP.Vm_currentms_Value) + rtb_Gain_c2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_l, A380PitchNzLaw_rtP.uDLookupTable_tableData_a, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_o * rtb_Saturation1) + A380PitchNzLaw_rtP.Bias_Bias) * ((rtb_Y_ca + look1_binlxpw
    (rtb_Y_m, A380PitchNzLaw_rtP.Loaddemand1_bp01Data, A380PitchNzLaw_rtP.Loaddemand1_tableData, 2U)) - rtb_Y_ca);
  rtb_Gain_dj = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Gain_c = rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data,
    A380PitchNzLaw_rtP.DLUT_tableData, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Gain_ha = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Gain_ha - A380PitchNzLaw_DWork.Delay_DSTATE_c) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Y_m, &A380PitchNzLaw_DWork.sf_LagFilter_k);
  if (rtb_Y_m > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Y_m = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Y_m = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat;
  }

  rtb_Sum1 = (((rtb_Gain_dj - A380PitchNzLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt * A380PitchNzLaw_rtP.Gain3_Gain +
               rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.PLUT_bp01Data,
    A380PitchNzLaw_rtP.PLUT_tableData, 1U)) + (rtb_Gain_c - A380PitchNzLaw_DWork.Delay_DSTATE_n) / *rtu_In_time_dt) +
    A380PitchNzLaw_rtP.Gain_Gain_l * rtb_Y_m;
  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1, rtu_In_time_dt, &rtb_Y_m, &A380PitchNzLaw_DWork.sf_WashoutFilter_k);
  if (rtb_Y_m > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat) {
    y = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat) {
    y = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat;
  } else {
    y = rtb_Y_m;
  }

  rtb_Gain_dv = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_i * *rtu_In_qk_deg_s;
  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_a) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_UpperSat_a;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_l) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_LowerSat_l;
  } else {
    rtb_Saturation1 = *rtu_In_V_tas_kn;
  }

  rtb_Saturation_ix = (A380PitchNzLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_a *
    A380PitchNzLaw_rtP.Vm_currentms_Value_e) + rtb_Gain_c2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_o, A380PitchNzLaw_rtP.uDLookupTable_tableData_e, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_d * rtb_Saturation1) + A380PitchNzLaw_rtP.Bias_Bias_a) * (rtb_Sum_ma - rtb_Y_ca);
  rtb_Gain_g = rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_h,
    A380PitchNzLaw_rtP.DLUT_tableData_p, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_j;
  rtb_Gain_gm = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_e * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Gain_gm - A380PitchNzLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Y_m, &A380PitchNzLaw_DWork.sf_LagFilter_g3);
  if (rtb_Y_m > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j) {
    rtb_Y_m = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Y_m = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_e;
  }

  rtb_Sum1_mw = (((rtb_Gain_dv - A380PitchNzLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt *
                  A380PitchNzLaw_rtP.Gain3_Gain_m + rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.PLUT_bp01Data_b, A380PitchNzLaw_rtP.PLUT_tableData_b, 1U)) + (rtb_Gain_g -
    A380PitchNzLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt) + A380PitchNzLaw_rtP.Gain_Gain_j * rtb_Y_m;
  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_n, rtu_In_time_dt, &rtb_Y_m, &A380PitchNzLaw_DWork.sf_WashoutFilter_c);
  if (rtb_Y_m > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_g) {
    rtb_Gain_b = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_g;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_j) {
    rtb_Gain_b = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_j;
  } else {
    rtb_Gain_b = rtb_Y_m;
  }

  A380PitchNzLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNzLaw_rtP.RateLimiterVariableTs2_up_m,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_lo_k, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_RateLimiter_nx);
  rtb_y_o4 = (*rtu_In_alpha_max - *rtu_In_alpha_prot) * rtb_Sum_ma;
  if ((!A380PitchNzLaw_DWork.pY_not_empty) || (!A380PitchNzLaw_DWork.pU_not_empty)) {
    A380PitchNzLaw_DWork.pU = *rtu_In_alpha_deg;
    A380PitchNzLaw_DWork.pU_not_empty = true;
    A380PitchNzLaw_DWork.pY = *rtu_In_alpha_deg;
    A380PitchNzLaw_DWork.pY_not_empty = true;
  }

  denom = *rtu_In_time_dt * A380PitchNzLaw_rtP.LagFilter1_C1 + 2.0;
  ca = *rtu_In_time_dt * A380PitchNzLaw_rtP.LagFilter1_C1 / denom;
  A380PitchNzLaw_DWork.pY = (2.0 - *rtu_In_time_dt * A380PitchNzLaw_rtP.LagFilter1_C1) / denom * A380PitchNzLaw_DWork.pY
    + (*rtu_In_alpha_deg * ca + A380PitchNzLaw_DWork.pU * ca);
  A380PitchNzLaw_DWork.pU = *rtu_In_alpha_deg;
  A380PitchNzLaw_WashoutFilter(std::fmax(std::fmax(0.0, *rtu_In_Theta_deg - 22.5), std::fmax(0.0, (std::abs
    (*rtu_In_Phi_deg) - 3.0) / 6.0)), A380PitchNzLaw_rtP.WashoutFilter_C1_b, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNzLaw_DWork.sf_WashoutFilter_h);
  rtb_Saturation_ix = (rtb_y_o4 - (A380PitchNzLaw_DWork.pY - *rtu_In_alpha_prot)) - rtb_Sum_ma;
  rtb_y_o4 = A380PitchNzLaw_rtP.Subsystem1_Gain * rtb_Saturation_ix;
  denom = (rtb_y_o4 - A380PitchNzLaw_DWork.Delay_DSTATE_f) / *rtu_In_time_dt;
  rtb_Y_h = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem1_C1;
  rtb_Saturation1 = rtb_Y_h + A380PitchNzLaw_rtP.Constant_Value_f;
  A380PitchNzLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Saturation1 * (A380PitchNzLaw_rtP.Constant_Value_f - rtb_Y_h) *
    A380PitchNzLaw_DWork.Delay1_DSTATE + (denom + A380PitchNzLaw_DWork.Delay_DSTATE_g) * (rtb_Y_h / rtb_Saturation1);
  rtb_alpha_err_gain = A380PitchNzLaw_rtP.alpha_err_gain_Gain * rtb_Saturation_ix;
  ca = A380PitchNzLaw_rtP.Subsystem3_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_nq = (ca - A380PitchNzLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Saturation1 = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem3_C1;
  rtb_Saturation_ix = rtb_Saturation1 + A380PitchNzLaw_rtP.Constant_Value_bb;
  A380PitchNzLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_Saturation_ix * (A380PitchNzLaw_rtP.Constant_Value_bb -
    rtb_Saturation1) * A380PitchNzLaw_DWork.Delay1_DSTATE_i + (rtb_Divide_nq + A380PitchNzLaw_DWork.Delay_DSTATE_ca) *
    (rtb_Saturation1 / rtb_Saturation_ix);
  rtb_Y_h = std::fmin(static_cast<real_T>((*rtu_In_high_aoa_prot_active) && (*rtu_In_protections_available)) -
                      A380PitchNzLaw_DWork.Delay_DSTATE_e, A380PitchNzLaw_rtP.RateLimiterVariableTs5_up *
                      *rtu_In_time_dt);
  A380PitchNzLaw_DWork.Delay_DSTATE_e += std::fmax(rtb_Y_h, *rtu_In_time_dt *
    A380PitchNzLaw_rtP.RateLimiterVariableTs5_lo);
  if (A380PitchNzLaw_DWork.Delay_DSTATE_e > A380PitchNzLaw_rtP.Saturation_UpperSat_eo) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_UpperSat_eo;
  } else if (A380PitchNzLaw_DWork.Delay_DSTATE_e < A380PitchNzLaw_rtP.Saturation_LowerSat_h) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Sum_ma = A380PitchNzLaw_DWork.Delay_DSTATE_e;
  }

  rtb_Y_m = (((A380PitchNzLaw_rtP.precontrol_gain_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE + rtb_alpha_err_gain) +
              A380PitchNzLaw_rtP.v_dot_gain_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE_i) +
             A380PitchNzLaw_rtP.qk_gain_Gain * *rtu_In_qk_deg_s) + A380PitchNzLaw_rtP.qk_dot_gain_Gain *
    *rtu_In_qk_dot_deg_s2;
  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation3_UpperSat_f) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation3_UpperSat_f;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation3_LowerSat_c) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation3_LowerSat_c;
  }

  rtb_Product_fu = rtb_Y_m * rtb_Sum_ma;
  rtb_Sum1_c = A380PitchNzLaw_rtP.Constant_Value_fe - rtb_Sum_ma;
  rtb_alpha_err_gain = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  A380PitchNzLaw_RateLimiter_h(rtu_In_ap_theta_c_deg, A380PitchNzLaw_rtP.RateLimiterVariableTs1_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_h, &A380PitchNzLaw_DWork.sf_RateLimiter_d);
  A380PitchNzLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNzLaw_rtP.RateLimiterVariableTs_up_n,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_lo_c, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_m, &A380PitchNzLaw_DWork.sf_RateLimiter_c2);
  A380PitchNzLaw_DWork.Delay_DSTATE_b += std::fmax(std::fmin(*rtu_In_delta_eta_pos - A380PitchNzLaw_DWork.Delay_DSTATE_b,
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_up_i * *rtu_In_time_dt), *rtu_In_time_dt *
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_lo_b);
  rtb_v_target = std::fmax((*rtu_In_high_speed_prot_low_kn - *rtu_In_high_speed_prot_high_kn) *
    A380PitchNzLaw_DWork.Delay_DSTATE_b, 0.0) + *rtu_In_high_speed_prot_low_kn;
  rtb_Gain_e = A380PitchNzLaw_rtP.Subsystem2_Gain * rtb_v_target;
  rtb_Divide_ew = (rtb_Gain_e - A380PitchNzLaw_DWork.Delay_DSTATE_ku) / *rtu_In_time_dt;
  rtb_Sum_ma = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem2_C1;
  rtb_Saturation1 = rtb_Sum_ma + A380PitchNzLaw_rtP.Constant_Value_ja;
  A380PitchNzLaw_DWork.Delay1_DSTATE_l = 1.0 / rtb_Saturation1 * (A380PitchNzLaw_rtP.Constant_Value_ja - rtb_Sum_ma) *
    A380PitchNzLaw_DWork.Delay1_DSTATE_l + (rtb_Divide_ew + A380PitchNzLaw_DWork.Delay_DSTATE_gl) * (rtb_Sum_ma /
    rtb_Saturation1);
  rtb_Gain_i4 = A380PitchNzLaw_rtP.Subsystem_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_ox = (rtb_Gain_i4 - A380PitchNzLaw_DWork.Delay_DSTATE_m) / *rtu_In_time_dt;
  rtb_Sum_ma = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem_C1;
  rtb_Saturation1 = rtb_Sum_ma + A380PitchNzLaw_rtP.Constant_Value_jj;
  A380PitchNzLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Saturation1 * (A380PitchNzLaw_rtP.Constant_Value_jj - rtb_Sum_ma) *
    A380PitchNzLaw_DWork.Delay1_DSTATE_n + (rtb_Divide_ox + A380PitchNzLaw_DWork.Delay_DSTATE_k2) * (rtb_Sum_ma /
    rtb_Saturation1);
  rtb_Sum_ma = ((*rtu_In_high_speed_prot_active) && (*rtu_In_protections_available));
  A380PitchNzLaw_DWork.Delay_DSTATE_mz += std::fmax(std::fmin(rtb_Sum_ma - A380PitchNzLaw_DWork.Delay_DSTATE_mz,
    A380PitchNzLaw_rtP.RateLimiterVariableTs4_up_b * *rtu_In_time_dt), *rtu_In_time_dt *
    A380PitchNzLaw_rtP.RateLimiterVariableTs4_lo_o);
  if (*rtu_In_any_ap_engaged) {
    rtb_Sum_ma = (rtb_Y_h - *rtu_In_Theta_deg) * look1_binlxpw(*rtu_In_V_tas_kn,
      A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_h, A380PitchNzLaw_rtP.ScheduledGain_Table_j, 6U);
  } else {
    rtb_Saturation_ix = look1_binlxpw(rtb_Y_m, A380PitchNzLaw_rtP.Loaddemand_bp01Data,
      A380PitchNzLaw_rtP.Loaddemand_tableData, 2U);
    if (*rtu_In_protections_available) {
      rtb_Y_h = A380PitchNzLaw_rtP.Constant3_Value_m;
    } else {
      rtb_Y_m = (look1_binlxpw(*rtu_In_flaps_handle_index, A380PitchNzLaw_rtP.uDLookupTable_bp01Data,
                  A380PitchNzLaw_rtP.uDLookupTable_tableData, 5U) - *rtu_In_V_ias_kn) * A380PitchNzLaw_rtP.Gain4_Gain;
      u0 = (A380PitchNzLaw_rtP.Constant5_Value - *rtu_In_V_ias_kn) * A380PitchNzLaw_rtP.Gain5_Gain;
      if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation_UpperSat) {
        rtb_Y_m = A380PitchNzLaw_rtP.Saturation_UpperSat;
      } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation_LowerSat) {
        rtb_Y_m = A380PitchNzLaw_rtP.Saturation_LowerSat;
      }

      if (u0 > A380PitchNzLaw_rtP.Saturation5_UpperSat) {
        u0 = A380PitchNzLaw_rtP.Saturation5_UpperSat;
      } else if (u0 < A380PitchNzLaw_rtP.Saturation5_LowerSat) {
        u0 = A380PitchNzLaw_rtP.Saturation5_LowerSat;
      }

      rtb_Y_h = rtb_Y_m + u0;
    }

    if (A380PitchNzLaw_DWork.Delay_DSTATE_mz > A380PitchNzLaw_rtP.Saturation_UpperSat_e) {
      rtb_Saturation_an = A380PitchNzLaw_rtP.Saturation_UpperSat_e;
    } else if (A380PitchNzLaw_DWork.Delay_DSTATE_mz < A380PitchNzLaw_rtP.Saturation_LowerSat_m) {
      rtb_Saturation_an = A380PitchNzLaw_rtP.Saturation_LowerSat_m;
    } else {
      rtb_Saturation_an = A380PitchNzLaw_DWork.Delay_DSTATE_mz;
    }

    if (rtb_Sum_ma > A380PitchNzLaw_rtP.Switch2_Threshold) {
      rtb_Y_m = (((((rtb_v_target - *rtu_In_V_ias_kn) * A380PitchNzLaw_rtP.Gain6_Gain +
                    A380PitchNzLaw_rtP.precontrol_gain_HSP_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE_l) +
                   A380PitchNzLaw_rtP.v_dot_gain_HSP_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE_n) +
                  A380PitchNzLaw_rtP.qk_gain_HSP_Gain * *rtu_In_qk_deg_s) + A380PitchNzLaw_rtP.qk_dot_gain1_Gain *
                 *rtu_In_qk_dot_deg_s2) * A380PitchNzLaw_rtP.HSP_gain_Gain;
      if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation8_UpperSat) {
        rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation8_UpperSat;
      } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation8_LowerSat) {
        rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation8_LowerSat;
      } else {
        rtb_Saturation1 = rtb_Saturation_ix;
      }

      if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation4_UpperSat) {
        rtb_Y_m = A380PitchNzLaw_rtP.Saturation4_UpperSat;
      } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation4_LowerSat) {
        rtb_Y_m = A380PitchNzLaw_rtP.Saturation4_LowerSat;
      }

      rtb_Sum_ma = rtb_Saturation1 + rtb_Y_m;
    } else {
      rtb_Sum_ma = A380PitchNzLaw_rtP.Constant1_Value_g;
    }

    rtb_Sum_ma = ((A380PitchNzLaw_rtP.Constant_Value_m - rtb_Saturation_an) * rtb_Saturation_ix + rtb_Sum_ma *
                  rtb_Saturation_an) + rtb_Y_h;
  }

  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_b) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_UpperSat_b;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_e) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_LowerSat_e;
  } else {
    rtb_Saturation1 = *rtu_In_V_tas_kn;
  }

  if (*rtu_In_Phi_deg > A380PitchNzLaw_rtP.Saturation_UpperSat_f) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_UpperSat_f;
  } else if (*rtu_In_Phi_deg < A380PitchNzLaw_rtP.Saturation_LowerSat_o1) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_LowerSat_o1;
  } else {
    rtb_Y_m = *rtu_In_Phi_deg;
  }

  rtb_Sum_ma = (A380PitchNzLaw_rtP.Gain1_Gain_en * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_b *
    A380PitchNzLaw_rtP.Vm_currentms_Value_h) + rtb_Gain_c2) - ((rtb_Cos / std::cos(A380PitchNzLaw_rtP.Gain1_Gain_lm *
    rtb_Y_m) + rtb_Sum_ma) - rtb_Y_ca) * (look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.uDLookupTable_bp01Data_b,
    A380PitchNzLaw_rtP.uDLookupTable_tableData_h, 6U) / (A380PitchNzLaw_rtP.Gain5_Gain_e * rtb_Saturation1) +
    A380PitchNzLaw_rtP.Bias_Bias_f);
  rtb_Cos = rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_m,
    A380PitchNzLaw_rtP.DLUT_tableData_a, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_Y_m = ((rtb_alpha_err_gain - A380PitchNzLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt *
             A380PitchNzLaw_rtP.Gain3_Gain_c + rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn,
              A380PitchNzLaw_rtP.PLUT_bp01Data_f, A380PitchNzLaw_rtP.PLUT_tableData_k, 1U)) + (rtb_Cos -
    A380PitchNzLaw_DWork.Delay_DSTATE_jh) / *rtu_In_time_dt;
  rtb_v_target = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_v_target - A380PitchNzLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_pt, rtu_In_time_dt, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_LagFilter_i);
  if (rtb_Sum_ma > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_b) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Sum_ma < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_m) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_m;
  }

  rtb_Saturation_ix = A380PitchNzLaw_rtP.Gain_Gain_f * rtb_Sum_ma;
  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_WashoutFilter_l);
  if (rtb_Sum_ma > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_o) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Sum_ma < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_jl) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_jl;
  }

  rtb_Y_m = (rtb_Y_m + rtb_Saturation_ix) + rtb_Sum_ma * look1_binlxpw(*rtu_In_H_radio_ft,
    A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_c, A380PitchNzLaw_rtP.ScheduledGain_Table_g, 3U);
  rtb_Y_h = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_UpperSat_n;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_LowerSat_a;
  } else {
    rtb_Saturation1 = *rtu_In_V_tas_kn;
  }

  rtb_Sum_ma = (A380PitchNzLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_p *
    A380PitchNzLaw_rtP.Vm_currentms_Value_p) + rtb_Gain_c2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_a, A380PitchNzLaw_rtP.uDLookupTable_tableData_p, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_n * rtb_Saturation1) + A380PitchNzLaw_rtP.Bias_Bias_ai) * (rtb_Y_cl - rtb_Y_ca);
  rtb_Y_cl = rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_k,
    A380PitchNzLaw_rtP.DLUT_tableData_e, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Saturation_ix = ((rtb_Y_h - A380PitchNzLaw_DWork.Delay_DSTATE_e5) / *rtu_In_time_dt *
                       A380PitchNzLaw_rtP.Gain3_Gain_b + rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.PLUT_bp01Data_a, A380PitchNzLaw_rtP.PLUT_tableData_o, 1U)) + (rtb_Y_cl -
    A380PitchNzLaw_DWork.Delay_DSTATE_gz) / *rtu_In_time_dt;
  rtb_Saturation_an = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Saturation_an - A380PitchNzLaw_DWork.Delay_DSTATE_lf) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_l, rtu_In_time_dt, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_LagFilter_g);
  if (rtb_Sum_ma > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Sum_ma < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_ek) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_ek;
  }

  rtb_Saturation1 = A380PitchNzLaw_rtP.Gain_Gain_k * rtb_Sum_ma;
  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_WashoutFilter_d);
  u0 = rtb_Gain_b * look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_n,
    A380PitchNzLaw_rtP.ScheduledGain_Table_b, 3U) + rtb_Sum1_mw;
  if (rtb_Sum_ma > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Sum_ma < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Sum_ma = (rtb_Saturation_ix + rtb_Saturation1) + rtb_Sum_ma * look1_binlxpw(*rtu_In_H_radio_ft,
    A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_f, A380PitchNzLaw_rtP.ScheduledGain_Table_h, 3U);
  if (u0 > A380PitchNzLaw_rtP.Saturation_UpperSat_hc) {
    u0 = A380PitchNzLaw_rtP.Saturation_UpperSat_hc;
  } else if (u0 < A380PitchNzLaw_rtP.Saturation_LowerSat_a) {
    u0 = A380PitchNzLaw_rtP.Saturation_LowerSat_a;
  }

  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation_UpperSat_k) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation_LowerSat_p) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_LowerSat_p;
  }

  if (rtb_Sum_ma > A380PitchNzLaw_rtP.Saturation_UpperSat_j) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Sum_ma < A380PitchNzLaw_rtP.Saturation_LowerSat_d) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_LowerSat_d;
  }

  A380PitchNzLaw_VoterAttitudeProtection(u0, rtb_Product_fu + rtb_Sum1_c * rtb_Y_m, rtb_Sum_ma, &rtb_Saturation_ix);
  rtb_Sum1_mw = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_k * *rtu_In_qk_deg_s;
  rtb_Y_m = A380PitchNzLaw_rtP.Gain3_Gain_g * A380PitchNzLaw_rtP.Theta_max3_Value - rtb_Loaddemand2;
  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_e) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_UpperSat_e;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_k) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Saturation3_LowerSat_k;
  } else {
    rtb_Saturation1 = *rtu_In_V_tas_kn;
  }

  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation2_UpperSat) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation2_LowerSat) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Sum_ma = (A380PitchNzLaw_rtP.Gain1_Gain_lk * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_jq *
    A380PitchNzLaw_rtP.Vm_currentms_Value_b) + rtb_Gain_c2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_m, A380PitchNzLaw_rtP.uDLookupTable_tableData_ax, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_m * rtb_Saturation1) + A380PitchNzLaw_rtP.Bias_Bias_m) * ((rtb_Y_ca + look1_binlxpw
    (rtb_Y_m, A380PitchNzLaw_rtP.Loaddemand2_bp01Data, A380PitchNzLaw_rtP.Loaddemand2_tableData, 2U)) - rtb_Y_ca);
  rtb_Loaddemand2 = rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_hw,
    A380PitchNzLaw_rtP.DLUT_tableData_l, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_c;
  rtb_Y_ca = ((rtb_Sum1_mw - A380PitchNzLaw_DWork.Delay_DSTATE_h) / *rtu_In_time_dt * A380PitchNzLaw_rtP.Gain3_Gain_n +
              rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.PLUT_bp01Data_e,
    A380PitchNzLaw_rtP.PLUT_tableData_g, 1U)) + (rtb_Loaddemand2 - A380PitchNzLaw_DWork.Delay_DSTATE_ds) /
    *rtu_In_time_dt;
  rtb_Gain_c2 = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_p * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Gain_c2 - A380PitchNzLaw_DWork.Delay_DSTATE_jt) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_f, rtu_In_time_dt, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_LagFilter);
  if (rtb_Sum_ma > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j2) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j2;
  } else if (rtb_Sum_ma < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_n) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_n;
  }

  rtb_Gain_b = A380PitchNzLaw_rtP.Gain_Gain_l0 * rtb_Sum_ma;
  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_j, rtu_In_time_dt, &rtb_Sum_ma, &A380PitchNzLaw_DWork.sf_WashoutFilter);
  rtb_Saturation1 = look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_b,
    A380PitchNzLaw_rtP.ScheduledGain_Table_e, 3U);
  rtb_Y_m = y * look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    A380PitchNzLaw_rtP.ScheduledGain_Table, 3U) + rtb_Sum1;
  if (rtb_Sum_ma > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_m) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_m;
  } else if (rtb_Sum_ma < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_d) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_d;
  }

  u0 = (rtb_Y_ca + rtb_Gain_b) + rtb_Sum_ma * rtb_Saturation1;
  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation_UpperSat_h) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation_LowerSat_o) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_LowerSat_o;
  }

  if (u0 > A380PitchNzLaw_rtP.Saturation_UpperSat_a) {
    u0 = A380PitchNzLaw_rtP.Saturation_UpperSat_a;
  } else if (u0 < A380PitchNzLaw_rtP.Saturation_LowerSat_k) {
    u0 = A380PitchNzLaw_rtP.Saturation_LowerSat_k;
  }

  A380PitchNzLaw_VoterAttitudeProtection(rtb_Y_m, rtb_Saturation_ix, u0, &rtb_Saturation1);
  rtb_Sum_ma = rtb_Saturation1 * look1_binlxpw(*rtu_In_V_ias_kn,
    A380PitchNzLaw_rtP.ScheduledGain1_BreakpointsForDimension1, A380PitchNzLaw_rtP.ScheduledGain1_Table, 4U) *
    look1_binlxpw(*rtu_In_time_dt, A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_d,
                  A380PitchNzLaw_rtP.ScheduledGain_Table_hh, 5U) *
    A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  A380PitchNzLaw_DWork.icLoad = ((rtb_Y_pa == 0.0) || (rtb_Y_e == A380PitchNzLaw_rtP.CompareToConstant_const_b) ||
    (*rtu_In_tracking_mode_on) || A380PitchNzLaw_DWork.icLoad);
  if (A380PitchNzLaw_DWork.icLoad) {
    A380PitchNzLaw_DWork.Delay_DSTATE_o = *rtu_In_eta_deg - rtb_Sum_ma;
  }

  A380PitchNzLaw_DWork.Delay_DSTATE_o += rtb_Sum_ma;
  if (A380PitchNzLaw_DWork.Delay_DSTATE_o > A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380PitchNzLaw_DWork.Delay_DSTATE_o = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380PitchNzLaw_DWork.Delay_DSTATE_o < A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380PitchNzLaw_DWork.Delay_DSTATE_o = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_eta_trim_deg_should_freeze == A380PitchNzLaw_rtP.CompareToConstant_const_d) {
    rtb_Saturation1 = A380PitchNzLaw_rtP.Constant_Value_b;
  } else {
    rtb_Saturation1 = A380PitchNzLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Y_ca = A380PitchNzLaw_rtP.Gain_Gain_c * rtb_Saturation1;
  if (rtb_Y_ca > rtb_eta_trim_deg_rate_limit_up_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_up_deg_s;
  } else if (rtb_Y_ca < rtb_eta_trim_deg_rate_limit_lo_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_lo_deg_s;
  } else {
    *rty_Out_eta_trim_dot_deg_s = rtb_Y_ca;
  }

  if (rtb_Y_pa > A380PitchNzLaw_rtP.Saturation_UpperSat_l) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_UpperSat_l;
  } else if (rtb_Y_pa < A380PitchNzLaw_rtP.Saturation_LowerSat_kp) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_LowerSat_kp;
  } else {
    rtb_Sum_ma = rtb_Y_pa;
  }

  rtb_Y_m = (*rtu_In_Theta_deg - look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNzLaw_rtP.uDLookupTable_bp01Data_me,
              A380PitchNzLaw_rtP.uDLookupTable_tableData_pq, 4U)) * A380PitchNzLaw_rtP.Gain2_Gain_g;
  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation_UpperSat_g) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_UpperSat_g;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation_LowerSat_nc) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_LowerSat_nc;
  }

  if (stick_deg < 6.0) {
    rtb_Saturation1 = 1.875 * stick_deg;
  } else {
    rtb_Saturation1 = 0.875 * stick_deg + 6.0;
  }

  stick_deg = ((rtb_Y_m + rtb_Saturation1) + A380PitchNzLaw_rtP.Gain1_Gain_b5 * *rtu_In_qk_deg_s) *
    (A380PitchNzLaw_rtP.Constant_Value_o - rtb_Sum_ma) + A380PitchNzLaw_DWork.Delay_DSTATE_o * rtb_Sum_ma;
  if (rtb_Y_e > A380PitchNzLaw_rtP.Saturation_UpperSat_p) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_UpperSat_p;
  } else if (rtb_Y_e < A380PitchNzLaw_rtP.Saturation_LowerSat_hs) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_LowerSat_hs;
  } else {
    rtb_Sum_ma = rtb_Y_e;
  }

  A380PitchNzLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNzLaw_rtP.RateLimiterVariableTs_up_i,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_lo_f, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_InitialCondition_c, &rtb_Y_ca, &A380PitchNzLaw_DWork.sf_RateLimiter_h);
  rtb_Y_m = A380PitchNzLaw_rtP.Gain3_Gain_f * *rtu_In_gnd_splr_cmd_deg;
  u0 = (*rtu_In_nz_g + A380PitchNzLaw_rtP.Bias_Bias_d) * A380PitchNzLaw_rtP.Gain2_Gain_n +
    A380PitchNzLaw_rtP.Gain1_Gain_h * *rtu_In_qk_deg_s;
  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation1_UpperSat_n) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation1_UpperSat_n;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation1_LowerSat_p) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation1_LowerSat_p;
  }

  if (u0 > A380PitchNzLaw_rtP.Saturation_UpperSat_ga) {
    u0 = A380PitchNzLaw_rtP.Saturation_UpperSat_ga;
  } else if (u0 < A380PitchNzLaw_rtP.Saturation_LowerSat_kf) {
    u0 = A380PitchNzLaw_rtP.Saturation_LowerSat_kf;
  }

  rtb_Y_m = ((A380PitchNzLaw_rtP.Gain_Gain_m * rtb_Y_ca + u0) + rtb_Y_m) * rtb_Sum_ma +
    (A380PitchNzLaw_rtP.Constant_Value_fw - rtb_Sum_ma) * stick_deg;
  if (rtb_Y_m > A380PitchNzLaw_rtP.Saturation_UpperSat_kp) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_UpperSat_kp;
  } else if (rtb_Y_m < A380PitchNzLaw_rtP.Saturation_LowerSat_a4) {
    rtb_Y_m = A380PitchNzLaw_rtP.Saturation_LowerSat_a4;
  }

  A380PitchNzLaw_RateLimiter(rtb_Y_m, A380PitchNzLaw_rtP.RateLimitereta_up, A380PitchNzLaw_rtP.RateLimitereta_lo,
    rtu_In_time_dt, A380PitchNzLaw_rtP.RateLimitereta_InitialCondition, rty_Out_eta_deg,
    &A380PitchNzLaw_DWork.sf_RateLimiter_b);
  A380PitchNzLaw_DWork.Delay_DSTATE = rtb_Gain_dj;
  A380PitchNzLaw_DWork.Delay_DSTATE_n = rtb_Gain_c;
  A380PitchNzLaw_DWork.Delay_DSTATE_c = rtb_Gain_ha;
  A380PitchNzLaw_DWork.Delay_DSTATE_l = rtb_Gain_dv;
  A380PitchNzLaw_DWork.Delay_DSTATE_k = rtb_Gain_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_d = rtb_Gain_gm;
  A380PitchNzLaw_DWork.Delay_DSTATE_f = rtb_y_o4;
  A380PitchNzLaw_DWork.Delay_DSTATE_g = denom;
  A380PitchNzLaw_DWork.Delay_DSTATE_j = ca;
  A380PitchNzLaw_DWork.Delay_DSTATE_ca = rtb_Divide_nq;
  A380PitchNzLaw_DWork.Delay_DSTATE_kd = rtb_alpha_err_gain;
  A380PitchNzLaw_DWork.Delay_DSTATE_ku = rtb_Gain_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_gl = rtb_Divide_ew;
  A380PitchNzLaw_DWork.Delay_DSTATE_m = rtb_Gain_i4;
  A380PitchNzLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_ox;
  A380PitchNzLaw_DWork.Delay_DSTATE_jh = rtb_Cos;
  A380PitchNzLaw_DWork.Delay_DSTATE_dy = rtb_v_target;
  A380PitchNzLaw_DWork.Delay_DSTATE_e5 = rtb_Y_h;
  A380PitchNzLaw_DWork.Delay_DSTATE_gz = rtb_Y_cl;
  A380PitchNzLaw_DWork.Delay_DSTATE_lf = rtb_Saturation_an;
  A380PitchNzLaw_DWork.Delay_DSTATE_h = rtb_Sum1_mw;
  A380PitchNzLaw_DWork.Delay_DSTATE_ds = rtb_Loaddemand2;
  A380PitchNzLaw_DWork.Delay_DSTATE_jt = rtb_Gain_c2;
  A380PitchNzLaw_DWork.icLoad = false;
}

A380PitchNzLaw::A380PitchNzLaw():
  A380PitchNzLaw_B(),
  A380PitchNzLaw_DWork()
{
}

A380PitchNzLaw::~A380PitchNzLaw() = default;
