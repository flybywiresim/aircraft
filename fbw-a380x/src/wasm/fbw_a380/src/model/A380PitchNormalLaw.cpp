#include "A380PitchNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"
#include "look2_binlxpw.h"

const uint8_T A380PitchNormalLaw_IN_Flare_Active_Reduce{ 1U };

const uint8_T A380PitchNormalLaw_IN_Flight{ 2U };

const uint8_T A380PitchNormalLaw_IN_Ground{ 3U };

const uint8_T A380PitchNormalLaw_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380PitchNormalLaw_IN_frozen{ 1U };

const uint8_T A380PitchNormalLaw_IN_running{ 2U };

const uint8_T A380PitchNormalLaw_IN_FlightToGroundTransition{ 2U };

const uint8_T A380PitchNormalLaw_IN_Flight_b{ 1U };

const uint8_T A380PitchNormalLaw_IN_GroundToFlightTransition{ 4U };

const uint8_T A380PitchNormalLaw_IN_automatic{ 1U };

const uint8_T A380PitchNormalLaw_IN_manual{ 2U };

const uint8_T A380PitchNormalLaw_IN_reset{ 3U };

const uint8_T A380PitchNormalLaw_IN_tracking{ 4U };

const uint8_T A380PitchNormalLaw_IN_flight_clean{ 1U };

const uint8_T A380PitchNormalLaw_IN_flight_flaps{ 2U };

const uint8_T A380PitchNormalLaw_IN_ground{ 3U };

const uint8_T A380PitchNormalLaw_IN_OFF{ 1U };

const uint8_T A380PitchNormalLaw_IN_ON{ 2U };

A380PitchNormalLaw::Parameters_A380PitchNormalLaw_T A380PitchNormalLaw::A380PitchNormalLaw_rtP{

  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 163.0, 243.0, 344.0, 400.0 },


  { 0.0, 0.06, 0.1, 0.13, 0.26, 1.0 },


  { 0.0, 163.0, 243.0, 344.0, 400.0 },

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

  -30.0,

  -30.0,


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.1, 0.1, 0.15, 0.2, 0.3, 0.5, 0.5 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },


  { 1.0, 1.0, 1.0, 1.0, 1.0, 0.25 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },

  20.0,

  17.0,

  1.0,

  -10.0,

  -0.5,

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

  -0.5,

  -4.0,

  -45.0,

  0.2,

  0.5,

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

  0.5,

  4.0,

  45.0,

  true,

  0.0,

  1.0,

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

  1.0,

  1.0,

  0.0,

  0.0,

  30.0,

  0.0,

  0.0,

  0.0,

  -30.0,

  1.0,

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

  1.0,

  0.0,

  1.0,

  -15.0,

  0.0,

  -1.0,

  0.0,

  2.0,

  -2.0,

  20.0,

  -30.0,


  { 4U, 4U },

  1U
};

void A380PitchNormalLaw::A380PitchNormalLaw_RateLimiter_Reset(rtDW_RateLimiter_A380PitchNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PitchNormalLaw::A380PitchNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PitchNormalLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380PitchNormalLaw::A380PitchNormalLaw_eta_trim_limit_lofreeze_Reset
  (rtDW_eta_trim_limit_lofreeze_A380PitchNormalLaw_T *localDW)
{
  localDW->frozen_eta_trim_not_empty = false;
}

void A380PitchNormalLaw::A380PitchNormalLaw_eta_trim_limit_lofreeze(const real_T *rtu_eta_trim, const boolean_T
  *rtu_trigger, real_T *rty_y, rtDW_eta_trim_limit_lofreeze_A380PitchNormalLaw_T *localDW)
{
  if ((!*rtu_trigger) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = *rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void A380PitchNormalLaw::A380PitchNormalLaw_RateLimiter_d_Reset(rtDW_RateLimiter_A380PitchNormalLaw_k_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PitchNormalLaw::A380PitchNormalLaw_RateLimiter_h(const real_T *rtu_u, real_T rtu_up, real_T rtu_lo, const
  real_T *rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PitchNormalLaw_k_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(*rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380PitchNormalLaw::A380PitchNormalLaw_LagFilter_Reset(rtDW_LagFilter_A380PitchNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PitchNormalLaw::A380PitchNormalLaw_LagFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PitchNormalLaw_T *localDW)
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

void A380PitchNormalLaw::A380PitchNormalLaw_WashoutFilter_Reset(rtDW_WashoutFilter_A380PitchNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PitchNormalLaw::A380PitchNormalLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T
  *rty_Y, rtDW_WashoutFilter_A380PitchNormalLaw_T *localDW)
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

void A380PitchNormalLaw::A380PitchNormalLaw_VoterAttitudeProtection(real_T rtu_input, real_T rtu_input_l, real_T
  rtu_input_o, real_T *rty_vote)
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

void A380PitchNormalLaw::init(void)
{
  A380PitchNormalLaw_DWork.Delay_DSTATE = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_n = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_c = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_l = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  A380PitchNormalLaw_DWork.Delay_DSTATE_k = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  A380PitchNormalLaw_DWork.Delay_DSTATE_d = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  A380PitchNormalLaw_DWork.Delay_DSTATE_f = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  A380PitchNormalLaw_DWork.Delay_DSTATE_g = A380PitchNormalLaw_rtP.Delay_InitialCondition;
  A380PitchNormalLaw_DWork.Delay1_DSTATE = A380PitchNormalLaw_rtP.Delay1_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_j = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ca = A380PitchNormalLaw_rtP.Delay_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_i = A380PitchNormalLaw_rtP.Delay1_InitialCondition_g;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e = A380PitchNormalLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_kd = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  A380PitchNormalLaw_DWork.Delay_DSTATE_b = A380PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ku = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  A380PitchNormalLaw_DWork.Delay_DSTATE_gl = A380PitchNormalLaw_rtP.Delay_InitialCondition_c;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_l = A380PitchNormalLaw_rtP.Delay1_InitialCondition_gf;
  A380PitchNormalLaw_DWork.Delay_DSTATE_m = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay_DSTATE_k2 = A380PitchNormalLaw_rtP.Delay_InitialCondition_h;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_n = A380PitchNormalLaw_rtP.Delay1_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay_DSTATE_mz = A380PitchNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition_f;
  A380PitchNormalLaw_DWork.Delay_DSTATE_jh = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  A380PitchNormalLaw_DWork.Delay_DSTATE_dy = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_di;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e5 = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  A380PitchNormalLaw_DWork.Delay_DSTATE_gz = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  A380PitchNormalLaw_DWork.Delay_DSTATE_lf = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  A380PitchNormalLaw_DWork.Delay_DSTATE_h = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ds = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  A380PitchNormalLaw_DWork.Delay_DSTATE_jt = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  A380PitchNormalLaw_DWork.icLoad = true;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ej = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_b;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e4 = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_p;
  A380PitchNormalLaw_DWork.icLoad_p = true;
}

void A380PitchNormalLaw::reset(void)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  A380PitchNormalLaw_DWork.Delay_DSTATE = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_n = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_c = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_l = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  A380PitchNormalLaw_DWork.Delay_DSTATE_k = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  A380PitchNormalLaw_DWork.Delay_DSTATE_d = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  A380PitchNormalLaw_DWork.Delay_DSTATE_f = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  A380PitchNormalLaw_DWork.Delay_DSTATE_g = A380PitchNormalLaw_rtP.Delay_InitialCondition;
  A380PitchNormalLaw_DWork.Delay1_DSTATE = A380PitchNormalLaw_rtP.Delay1_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_j = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ca = A380PitchNormalLaw_rtP.Delay_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_i = A380PitchNormalLaw_rtP.Delay1_InitialCondition_g;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e = A380PitchNormalLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  A380PitchNormalLaw_DWork.Delay_DSTATE_kd = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  A380PitchNormalLaw_DWork.Delay_DSTATE_b = A380PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ku = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  A380PitchNormalLaw_DWork.Delay_DSTATE_gl = A380PitchNormalLaw_rtP.Delay_InitialCondition_c;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_l = A380PitchNormalLaw_rtP.Delay1_InitialCondition_gf;
  A380PitchNormalLaw_DWork.Delay_DSTATE_m = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay_DSTATE_k2 = A380PitchNormalLaw_rtP.Delay_InitialCondition_h;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_n = A380PitchNormalLaw_rtP.Delay1_InitialCondition_e;
  A380PitchNormalLaw_DWork.Delay_DSTATE_mz = A380PitchNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition_f;
  A380PitchNormalLaw_DWork.Delay_DSTATE_jh = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  A380PitchNormalLaw_DWork.Delay_DSTATE_dy = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_di;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e5 = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  A380PitchNormalLaw_DWork.Delay_DSTATE_gz = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  A380PitchNormalLaw_DWork.Delay_DSTATE_lf = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  A380PitchNormalLaw_DWork.Delay_DSTATE_h = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ds = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  A380PitchNormalLaw_DWork.Delay_DSTATE_jt = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  A380PitchNormalLaw_DWork.icLoad = true;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ej = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_b;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e4 = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_p;
  A380PitchNormalLaw_DWork.icLoad_p = true;
  A380PitchNormalLaw_B.in_flight = 0.0;
  A380PitchNormalLaw_DWork.on_ground_time = 0.0;
  A380PitchNormalLaw_DWork.in_flight_time = 0.0;
  A380PitchNormalLaw_DWork.is_active_c3_A380PitchNormalLaw = 0U;
  A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNormalLaw_DWork.is_active_c8_A380PitchNormalLaw = 0U;
  A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw = A380PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNormalLaw_DWork.is_active_c2_A380PitchNormalLaw = 0U;
  A380PitchNormalLaw_DWork.is_c2_A380PitchNormalLaw = A380PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNormalLaw_DWork.is_active_c9_A380PitchNormalLaw = 0U;
  A380PitchNormalLaw_DWork.is_c9_A380PitchNormalLaw = A380PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  rtb_nz_limit_up_g = 0.0;
  rtb_nz_limit_lo_g = 0.0;
  A380PitchNormalLaw_DWork.is_active_c7_A380PitchNormalLaw = 0U;
  A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNormalLaw_RateLimiter_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter);
  A380PitchNormalLaw_DWork.is_active_c6_A380PitchNormalLaw = 0U;
  A380PitchNormalLaw_DWork.is_c6_A380PitchNormalLaw = A380PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNormalLaw_RateLimiter_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_p);
  A380PitchNormalLaw_RateLimiter_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_c);
  A380PitchNormalLaw_RateLimiter_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_n);
  A380PitchNormalLaw_RateLimiter_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_l);
  A380PitchNormalLaw_eta_trim_limit_lofreeze_Reset(&A380PitchNormalLaw_DWork.sf_eta_trim_limit_lofreeze);
  A380PitchNormalLaw_eta_trim_limit_lofreeze_Reset(&A380PitchNormalLaw_DWork.sf_eta_trim_limit_upfreeze);
  A380PitchNormalLaw_RateLimiter_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_o);
  A380PitchNormalLaw_LagFilter_Reset(&A380PitchNormalLaw_DWork.sf_LagFilter_k);
  A380PitchNormalLaw_WashoutFilter_Reset(&A380PitchNormalLaw_DWork.sf_WashoutFilter_k);
  A380PitchNormalLaw_LagFilter_Reset(&A380PitchNormalLaw_DWork.sf_LagFilter_g3);
  A380PitchNormalLaw_WashoutFilter_Reset(&A380PitchNormalLaw_DWork.sf_WashoutFilter_c);
  A380PitchNormalLaw_RateLimiter_d_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_nx);
  A380PitchNormalLaw_DWork.pY_not_empty = false;
  A380PitchNormalLaw_DWork.pU_not_empty = false;
  A380PitchNormalLaw_WashoutFilter_Reset(&A380PitchNormalLaw_DWork.sf_WashoutFilter_h);
  A380PitchNormalLaw_RateLimiter_d_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_d);
  A380PitchNormalLaw_RateLimiter_d_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_c2);
  A380PitchNormalLaw_LagFilter_Reset(&A380PitchNormalLaw_DWork.sf_LagFilter_i);
  A380PitchNormalLaw_WashoutFilter_Reset(&A380PitchNormalLaw_DWork.sf_WashoutFilter_l);
  A380PitchNormalLaw_LagFilter_Reset(&A380PitchNormalLaw_DWork.sf_LagFilter_g);
  A380PitchNormalLaw_WashoutFilter_Reset(&A380PitchNormalLaw_DWork.sf_WashoutFilter_d);
  A380PitchNormalLaw_LagFilter_Reset(&A380PitchNormalLaw_DWork.sf_LagFilter);
  A380PitchNormalLaw_WashoutFilter_Reset(&A380PitchNormalLaw_DWork.sf_WashoutFilter);
  A380PitchNormalLaw_RateLimiter_d_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_ct);
  A380PitchNormalLaw_LagFilter_Reset(&A380PitchNormalLaw_DWork.sf_LagFilter_f);
  A380PitchNormalLaw_RateLimiter_d_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_h);
  A380PitchNormalLaw_RateLimiter_Reset(&A380PitchNormalLaw_DWork.sf_RateLimiter_b);
}

void A380PitchNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_time_simulation_time, const real_T
  *rtu_In_nz_g, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const
  real_T *rtu_In_qk_dot_deg_s2, const real_T *rtu_In_eta_deg, const real_T *rtu_In_eta_trim_deg, const real_T
  *rtu_In_alpha_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft,
  const real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const real_T
  *rtu_In_spoilers_right_pos, const real_T *rtu_In_thrust_lever_1_pos, const real_T *rtu_In_thrust_lever_2_pos, const
  boolean_T *rtu_In_tailstrike_protection_on, const real_T *rtu_In_VLS_kn, const real_T *rtu_In_delta_eta_pos, const
  boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T *rtu_In_high_aoa_prot_active,
  const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_alpha_prot, const real_T *rtu_In_alpha_max, const
  real_T *rtu_In_high_speed_prot_high_kn, const real_T *rtu_In_high_speed_prot_low_kn, const real_T
  *rtu_In_ap_theta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_eta_deg, real_T
  *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T ca;
  real_T rtb_Bias_o;
  real_T rtb_Cos;
  real_T rtb_Divide;
  real_T rtb_Divide_an;
  real_T rtb_Divide_bq;
  real_T rtb_Divide_c;
  real_T rtb_Divide_cq;
  real_T rtb_Divide_ho;
  real_T rtb_Divide_k;
  real_T rtb_Divide_l;
  real_T rtb_Divide_o;
  real_T rtb_Gain;
  real_T rtb_Gain1;
  real_T rtb_Gain1_e;
  real_T rtb_Gain1_ft;
  real_T rtb_Gain5_gq;
  real_T rtb_Gain_av;
  real_T rtb_Gain_bs;
  real_T rtb_Gain_f;
  real_T rtb_Gain_ll;
  real_T rtb_Gain_nu;
  real_T rtb_Gain_ot;
  real_T rtb_Gain_px;
  real_T rtb_Loaddemand2;
  real_T rtb_ManualSwitch;
  real_T rtb_Product1_ck;
  real_T rtb_Product1_dm;
  real_T rtb_Product_k;
  real_T rtb_Product_kz;
  real_T rtb_Product_n3;
  real_T rtb_Saturation_ix;
  real_T rtb_Sum1_n;
  real_T rtb_Sum_ma;
  real_T rtb_Y_a;
  real_T rtb_Y_dd;
  real_T rtb_Y_j;
  real_T rtb_Y_k2;
  real_T rtb_Y_lv;
  real_T rtb_Y_m;
  real_T rtb_Y_pa;
  real_T rtb_alpha_err_gain;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T rtb_qk_dot_gain;
  real_T rtb_qk_gain;
  real_T rtb_uDLookupTable;
  real_T rtb_v_target;
  real_T rtb_y;
  real_T rtb_y_c;
  int32_T rtb_in_flare;
  boolean_T rtb_AND;
  boolean_T rtb_NOT;
  if (A380PitchNormalLaw_DWork.is_active_c3_A380PitchNormalLaw == 0) {
    A380PitchNormalLaw_DWork.is_active_c3_A380PitchNormalLaw = 1U;
    A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_Ground;
    A380PitchNormalLaw_B.in_flight = 0.0;
  } else {
    switch (A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw) {
     case A380PitchNormalLaw_IN_Flight_b:
      if ((*rtu_In_on_ground) && (*rtu_In_Theta_deg < 0.5)) {
        A380PitchNormalLaw_DWork.on_ground_time = *rtu_In_time_simulation_time;
        A380PitchNormalLaw_DWork.in_flight_time = 0.0;
        A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_FlightToGroundTransition;
      } else {
        A380PitchNormalLaw_B.in_flight = 1.0;
      }
      break;

     case A380PitchNormalLaw_IN_FlightToGroundTransition:
      if (*rtu_In_time_simulation_time - A380PitchNormalLaw_DWork.on_ground_time >= 5.0) {
        A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_Ground;
        A380PitchNormalLaw_B.in_flight = 0.0;
      } else if ((!*rtu_In_on_ground) || (*rtu_In_Theta_deg >= 0.5)) {
        A380PitchNormalLaw_DWork.on_ground_time = 0.0;
        A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_Flight_b;
        A380PitchNormalLaw_B.in_flight = 1.0;
      }
      break;

     case A380PitchNormalLaw_IN_Ground:
      if (!*rtu_In_on_ground) {
        A380PitchNormalLaw_DWork.on_ground_time = 0.0;
        A380PitchNormalLaw_DWork.in_flight_time = *rtu_In_time_simulation_time;
        A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_GroundToFlightTransition;
      } else {
        A380PitchNormalLaw_B.in_flight = 0.0;
      }
      break;

     default:
      if (*rtu_In_time_simulation_time - A380PitchNormalLaw_DWork.in_flight_time >= 5.0) {
        A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_Flight_b;
        A380PitchNormalLaw_B.in_flight = 1.0;
      } else if (*rtu_In_on_ground) {
        A380PitchNormalLaw_DWork.in_flight_time = 0.0;
        A380PitchNormalLaw_DWork.is_c3_A380PitchNormalLaw = A380PitchNormalLaw_IN_Ground;
        A380PitchNormalLaw_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (A380PitchNormalLaw_DWork.is_active_c8_A380PitchNormalLaw == 0) {
    A380PitchNormalLaw_DWork.is_active_c8_A380PitchNormalLaw = 1U;
    A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw = A380PitchNormalLaw_IN_manual;
  } else {
    switch (A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw) {
     case A380PitchNormalLaw_IN_automatic:
      if (A380PitchNormalLaw_B.in_flight == 0.0) {
        A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw = A380PitchNormalLaw_IN_reset;
      } else if (*rtu_In_tracking_mode_on) {
        A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw = A380PitchNormalLaw_IN_tracking;
      }
      break;

     case A380PitchNormalLaw_IN_manual:
      if (A380PitchNormalLaw_B.in_flight != 0.0) {
        A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw = A380PitchNormalLaw_IN_automatic;
      }
      break;

     case A380PitchNormalLaw_IN_reset:
      if ((A380PitchNormalLaw_B.in_flight == 0.0) && (*rtu_In_eta_trim_deg == 0.0)) {
        A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw = A380PitchNormalLaw_IN_manual;
      }
      break;

     default:
      if (!*rtu_In_tracking_mode_on) {
        A380PitchNormalLaw_DWork.is_c8_A380PitchNormalLaw = A380PitchNormalLaw_IN_automatic;
      }
      break;
    }
  }

  if (A380PitchNormalLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = A380PitchNormalLaw_rtP.Constant1_Value;
  } else {
    rtb_ManualSwitch = A380PitchNormalLaw_rtP.Constant_Value;
  }

  if (A380PitchNormalLaw_DWork.is_active_c2_A380PitchNormalLaw == 0) {
    A380PitchNormalLaw_DWork.is_active_c2_A380PitchNormalLaw = 1U;
    A380PitchNormalLaw_DWork.is_c2_A380PitchNormalLaw = A380PitchNormalLaw_IN_Ground;
    rtb_in_flare = 0;
  } else {
    switch (A380PitchNormalLaw_DWork.is_c2_A380PitchNormalLaw) {
     case A380PitchNormalLaw_IN_Flare_Active_Reduce:
      if (A380PitchNormalLaw_B.in_flight == 0.0) {
        A380PitchNormalLaw_DWork.is_c2_A380PitchNormalLaw = A380PitchNormalLaw_IN_Ground;
        rtb_in_flare = 0;
      } else if ((A380PitchNormalLaw_B.in_flight == 1.0) && (*rtu_In_H_radio_ft > 100.0) && (rtb_ManualSwitch == 0.0)) {
        A380PitchNormalLaw_DWork.is_c2_A380PitchNormalLaw = A380PitchNormalLaw_IN_Flight;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case A380PitchNormalLaw_IN_Flight:
      if ((*rtu_In_H_radio_ft <= 100.0) || (rtb_ManualSwitch == 1.0)) {
        A380PitchNormalLaw_DWork.is_c2_A380PitchNormalLaw = A380PitchNormalLaw_IN_Flare_Active_Reduce;
        rtb_in_flare = 1;
      } else {
        rtb_in_flare = 0;
      }
      break;

     default:
      if ((A380PitchNormalLaw_B.in_flight == 1.0) && (*rtu_In_H_radio_ft > 100.0) && (rtb_ManualSwitch == 0.0)) {
        A380PitchNormalLaw_DWork.is_c2_A380PitchNormalLaw = A380PitchNormalLaw_IN_Flight;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
      }
      break;
    }
  }

  rtb_NOT = !*rtu_In_any_ap_engaged;
  rtb_AND = ((rtb_in_flare != 0) && rtb_NOT);
  if (A380PitchNormalLaw_DWork.is_active_c9_A380PitchNormalLaw == 0) {
    A380PitchNormalLaw_DWork.is_active_c9_A380PitchNormalLaw = 1U;
    A380PitchNormalLaw_DWork.is_c9_A380PitchNormalLaw = A380PitchNormalLaw_IN_running;
    rtb_NOT = false;
  } else if (A380PitchNormalLaw_DWork.is_c9_A380PitchNormalLaw == A380PitchNormalLaw_IN_frozen) {
    if ((!rtb_AND) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs(*rtu_In_Phi_deg) <= 30.0)) {
      A380PitchNormalLaw_DWork.is_c9_A380PitchNormalLaw = A380PitchNormalLaw_IN_running;
      rtb_NOT = false;
    } else {
      rtb_NOT = true;
    }
  } else if (rtb_AND || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs(*rtu_In_Phi_deg) > 30.0)) {
    A380PitchNormalLaw_DWork.is_c9_A380PitchNormalLaw = A380PitchNormalLaw_IN_frozen;
    rtb_NOT = true;
  } else {
    rtb_NOT = false;
  }

  rtb_Gain = A380PitchNormalLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  if (A380PitchNormalLaw_DWork.is_active_c7_A380PitchNormalLaw == 0) {
    A380PitchNormalLaw_DWork.is_active_c7_A380PitchNormalLaw = 1U;
    A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_ground;
    rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
    rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw) {
     case A380PitchNormalLaw_IN_flight_clean:
      if (*rtu_In_flaps_handle_index != 0.0) {
        A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_flight_flaps;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.25;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.25;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else if (A380PitchNormalLaw_B.in_flight == 0.0) {
        A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_ground;
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

     case A380PitchNormalLaw_IN_flight_flaps:
      if (*rtu_In_flaps_handle_index == 0.0) {
        A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.15;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.15;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (A380PitchNormalLaw_B.in_flight == 0.0) {
        A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_ground;
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
      if ((A380PitchNormalLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index == 0.0)) {
        A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.15;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.15;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((A380PitchNormalLaw_B.in_flight != 0.0) && (*rtu_In_flaps_handle_index != 0.0)) {
        A380PitchNormalLaw_DWork.is_c7_A380PitchNormalLaw = A380PitchNormalLaw_IN_flight_flaps;
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

  if (A380PitchNormalLaw_B.in_flight > A380PitchNormalLaw_rtP.Saturation_UpperSat_c) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (A380PitchNormalLaw_B.in_flight < A380PitchNormalLaw_rtP.Saturation_LowerSat_n) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_LowerSat_n;
  } else {
    rtb_Sum_ma = A380PitchNormalLaw_B.in_flight;
  }

  A380PitchNormalLaw_RateLimiter(rtb_Sum_ma, A380PitchNormalLaw_rtP.RateLimiterVariableTs_up,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_pa, &A380PitchNormalLaw_DWork.sf_RateLimiter);
  if (A380PitchNormalLaw_DWork.is_active_c6_A380PitchNormalLaw == 0) {
    A380PitchNormalLaw_DWork.is_active_c6_A380PitchNormalLaw = 1U;
    A380PitchNormalLaw_DWork.is_c6_A380PitchNormalLaw = A380PitchNormalLaw_IN_OFF;
    rtb_in_flare = 0;
  } else if (A380PitchNormalLaw_DWork.is_c6_A380PitchNormalLaw == A380PitchNormalLaw_IN_OFF) {
    if ((rtb_Y_pa < 1.0) && (*rtu_In_V_tas_kn > 70.0) && ((*rtu_In_thrust_lever_1_pos >= 35.0) ||
         (*rtu_In_thrust_lever_2_pos >= 35.0))) {
      A380PitchNormalLaw_DWork.is_c6_A380PitchNormalLaw = A380PitchNormalLaw_IN_ON;
      rtb_in_flare = 1;
    } else {
      rtb_in_flare = 0;
    }
  } else if ((rtb_Y_pa == 1.0) || (*rtu_In_H_radio_ft > 400.0) || ((*rtu_In_V_tas_kn < 70.0) &&
              ((*rtu_In_thrust_lever_1_pos < 35.0) || (*rtu_In_thrust_lever_2_pos < 35.0)))) {
    A380PitchNormalLaw_DWork.is_c6_A380PitchNormalLaw = A380PitchNormalLaw_IN_OFF;
    rtb_in_flare = 0;
  } else {
    rtb_in_flare = 1;
  }

  if (rtb_in_flare > A380PitchNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_in_flare < A380PitchNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation1_LowerSat;
  } else {
    rtb_Sum_ma = rtb_in_flare;
  }

  A380PitchNormalLaw_RateLimiter(rtb_Sum_ma, A380PitchNormalLaw_rtP.RateLimiterVariableTs1_up,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_lv,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_p);
  A380PitchNormalLaw_RateLimiter(rtb_nz_limit_up_g, A380PitchNormalLaw_rtP.RateLimiterVariableTs2_up,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_c);
  A380PitchNormalLaw_RateLimiter(rtb_nz_limit_lo_g, A380PitchNormalLaw_rtP.RateLimiterVariableTs3_up,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_dd,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_n);
  A380PitchNormalLaw_RateLimiter(static_cast<real_T>(rtb_AND), A380PitchNormalLaw_rtP.RateLimiterVariableTs4_up,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs4_lo, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition, &rtb_ManualSwitch,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_l);
  A380PitchNormalLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_aoa_prot_active, &rtb_Y_m,
    &A380PitchNormalLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (*rtu_In_high_aoa_prot_active) {
    *rty_Out_eta_trim_limit_lo = rtb_Y_m;
  } else {
    *rty_Out_eta_trim_limit_lo = A380PitchNormalLaw_rtP.Constant3_Value;
  }

  A380PitchNormalLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_speed_prot_active, &rtb_Y_m,
    &A380PitchNormalLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (*rtu_In_high_speed_prot_active) {
    *rty_Out_eta_trim_limit_up = rtb_Y_m;
  } else {
    *rty_Out_eta_trim_limit_up = A380PitchNormalLaw_rtP.Constant2_Value;
  }

  rtb_Gain1 = *rtu_In_V_ias_kn;
  rtb_Gain_ot = *rtu_In_flaps_handle_index;
  rtb_Gain_px = *rtu_In_VLS_kn;
  if (rtb_Gain_ot == 5.0) {
    rtb_in_flare = 25;
  } else {
    rtb_in_flare = 30;
  }

  A380PitchNormalLaw_RateLimiter(static_cast<real_T>(rtb_in_flare) - std::fmin(5.0, std::fmax(0.0, 5.0 - (rtb_Gain1 -
    (rtb_Gain_px + 5.0)) * 0.25)), A380PitchNormalLaw_rtP.RateLimiterVariableTs6_up,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs6_lo, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs6_InitialCondition, &rtb_Y_m, &A380PitchNormalLaw_DWork.sf_RateLimiter_o);
  rtb_Loaddemand2 = A380PitchNormalLaw_rtP.Gain1_Gain * *rtu_In_Theta_deg;
  rtb_Gain1 = A380PitchNormalLaw_rtP.Gain1_Gain_c * *rtu_In_Theta_deg;
  rtb_Cos = std::cos(rtb_Gain1);
  rtb_Gain1 = A380PitchNormalLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg;
  rtb_Y_a = rtb_Cos / std::cos(rtb_Gain1);
  rtb_Y_j = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.uDLookupTable_bp01Data,
    A380PitchNormalLaw_rtP.uDLookupTable_tableData, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  rtb_Gain1 = A380PitchNormalLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s;
  rtb_Gain_av = *rtu_In_nz_g - rtb_Y_a;
  rtb_Gain1_e = A380PitchNormalLaw_rtP.Gain2_Gain * rtb_Y_m - rtb_Loaddemand2;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation3_UpperSat) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_UpperSat;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation3_LowerSat) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_LowerSat;
  }

  if (rtb_Gain1_e > A380PitchNormalLaw_rtP.Saturation1_UpperSat_i) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation1_UpperSat_i;
  } else if (rtb_Gain1_e < A380PitchNormalLaw_rtP.Saturation1_LowerSat_h) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation1_LowerSat_h;
  }

  rtb_Y_k2 = (A380PitchNormalLaw_rtP.Gain_Gain_c * A380PitchNormalLaw_rtP.Vm_currentms_Value * rtb_Gain1 + rtb_Gain_av)
    - (rtb_Y_j / (A380PitchNormalLaw_rtP.Gain5_Gain * rtb_v_target) + A380PitchNormalLaw_rtP.Bias_Bias) * ((rtb_Y_a +
    look1_binlxpw(rtb_Gain1_e, A380PitchNormalLaw_rtP.Loaddemand1_bp01Data, A380PitchNormalLaw_rtP.Loaddemand1_tableData,
                  2U)) - rtb_Y_a);
  rtb_Y_j = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.PLUT_bp01Data, A380PitchNormalLaw_rtP.PLUT_tableData,
    1U);
  rtb_Product1_dm = rtb_Y_k2 * rtb_Y_j;
  rtb_Gain1 = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Divide = (rtb_Gain1 - A380PitchNormalLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt;
  rtb_Y_j = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.DLUT_bp01Data, A380PitchNormalLaw_rtP.DLUT_tableData,
    1U);
  rtb_Gain_px = rtb_Y_k2 * rtb_Y_j * A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Divide_o = (rtb_Gain_px - A380PitchNormalLaw_DWork.Delay_DSTATE_n) / *rtu_In_time_dt;
  rtb_Gain_ot = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  rtb_Divide_an = (rtb_Gain_ot - A380PitchNormalLaw_DWork.Delay_DSTATE_c) / *rtu_In_time_dt;
  A380PitchNormalLaw_LagFilter(rtb_Divide_an, A380PitchNormalLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Y_m,
    &A380PitchNormalLaw_DWork.sf_LagFilter_k);
  if (rtb_Y_m > A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Divide_bq = A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Y_m < A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Divide_bq = A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat;
  } else {
    rtb_Divide_bq = rtb_Y_m;
  }

  rtb_Gain5_gq = std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos);
  A380PitchNormalLaw_WashoutFilter(rtb_Gain5_gq, A380PitchNormalLaw_rtP.WashoutFilter_C1, rtu_In_time_dt, &rtb_Y_m,
    &A380PitchNormalLaw_DWork.sf_WashoutFilter_k);
  rtb_Y_j = look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    A380PitchNormalLaw_rtP.ScheduledGain_Table, 3U);
  if (rtb_Y_m > A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat) {
    rtb_Y_m = A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Y_m < A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat) {
    rtb_Y_m = A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat;
  }

  rtb_Product_kz = rtb_Y_m * rtb_Y_j;
  rtb_Divide_an = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_i * *rtu_In_qk_deg_s;
  rtb_Divide_cq = (rtb_Divide_an - A380PitchNormalLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt;
  rtb_Gain1_ft = A380PitchNormalLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s;
  rtb_Y_k2 = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.uDLookupTable_bp01Data_o,
    A380PitchNormalLaw_rtP.uDLookupTable_tableData_e, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation3_UpperSat_a) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_UpperSat_a;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation3_LowerSat_l) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_LowerSat_l;
  }

  rtb_Y_k2 = (A380PitchNormalLaw_rtP.Gain_Gain_a * A380PitchNormalLaw_rtP.Vm_currentms_Value_e * rtb_Gain1_ft +
              rtb_Gain_av) - (rtb_Y_k2 / (A380PitchNormalLaw_rtP.Gain5_Gain_d * rtb_v_target) +
    A380PitchNormalLaw_rtP.Bias_Bias_a) * (rtb_Sum_ma - rtb_Y_a);
  rtb_Y_j = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.PLUT_bp01Data_b,
    A380PitchNormalLaw_rtP.PLUT_tableData_b, 1U);
  rtb_Product1_ck = rtb_Y_k2 * rtb_Y_j;
  rtb_Y_j = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.DLUT_bp01Data_h,
    A380PitchNormalLaw_rtP.DLUT_tableData_p, 1U);
  rtb_Gain1_ft = rtb_Y_k2 * rtb_Y_j * A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j;
  rtb_Divide_l = (rtb_Gain1_ft - A380PitchNormalLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt;
  rtb_Gain_bs = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_e * *rtu_In_V_tas_kn;
  rtb_Sum_ma = (rtb_Gain_bs - A380PitchNormalLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt;
  A380PitchNormalLaw_LagFilter(rtb_Sum_ma, A380PitchNormalLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Y_m,
    &A380PitchNormalLaw_DWork.sf_LagFilter_g3);
  if (rtb_Y_m > A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j) {
    rtb_Gain_f = A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j;
  } else if (rtb_Y_m < A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Gain_f = A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e;
  } else {
    rtb_Gain_f = rtb_Y_m;
  }

  A380PitchNormalLaw_WashoutFilter(rtb_Gain5_gq, A380PitchNormalLaw_rtP.WashoutFilter_C1_n, rtu_In_time_dt, &rtb_Y_m,
    &A380PitchNormalLaw_DWork.sf_WashoutFilter_c);
  rtb_Y_j = look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_n,
    A380PitchNormalLaw_rtP.ScheduledGain_Table_b, 3U);
  if (rtb_Y_m > A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g) {
    rtb_Y_m = A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g;
  } else if (rtb_Y_m < A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j) {
    rtb_Y_m = A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j;
  }

  rtb_Product_n3 = rtb_Y_m * rtb_Y_j;
  A380PitchNormalLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNormalLaw_rtP.RateLimiterVariableTs2_up_m,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs2_lo_k, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_nx);
  rtb_y_c = (*rtu_In_alpha_max - *rtu_In_alpha_prot) * rtb_Sum_ma;
  if ((!A380PitchNormalLaw_DWork.pY_not_empty) || (!A380PitchNormalLaw_DWork.pU_not_empty)) {
    A380PitchNormalLaw_DWork.pU = *rtu_In_alpha_deg;
    A380PitchNormalLaw_DWork.pU_not_empty = true;
    A380PitchNormalLaw_DWork.pY = *rtu_In_alpha_deg;
    A380PitchNormalLaw_DWork.pY_not_empty = true;
  }

  rtb_Y_m = *rtu_In_time_dt * A380PitchNormalLaw_rtP.LagFilter1_C1;
  rtb_Sum_ma = rtb_Y_m + 2.0;
  ca = rtb_Y_m / (rtb_Y_m + 2.0);
  A380PitchNormalLaw_DWork.pY = (2.0 - rtb_Y_m) / (rtb_Y_m + 2.0) * A380PitchNormalLaw_DWork.pY + (*rtu_In_alpha_deg *
    ca + A380PitchNormalLaw_DWork.pU * ca);
  A380PitchNormalLaw_DWork.pU = *rtu_In_alpha_deg;
  ca = A380PitchNormalLaw_DWork.pY - *rtu_In_alpha_prot;
  rtb_y = std::fmax(std::fmax(0.0, *rtu_In_Theta_deg - 22.5), std::fmax(0.0, (std::abs(*rtu_In_Phi_deg) - 3.0) / 6.0));
  A380PitchNormalLaw_WashoutFilter(rtb_y, A380PitchNormalLaw_rtP.WashoutFilter_C1_b, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_WashoutFilter_h);
  rtb_Y_k2 = (rtb_y_c - ca) - rtb_Sum_ma;
  rtb_y_c = A380PitchNormalLaw_rtP.Subsystem1_Gain * rtb_Y_k2;
  ca = (rtb_y_c - A380PitchNormalLaw_DWork.Delay_DSTATE_f) / *rtu_In_time_dt;
  rtb_Y_j = *rtu_In_time_dt * A380PitchNormalLaw_rtP.Subsystem1_C1;
  rtb_Saturation_ix = rtb_Y_j + A380PitchNormalLaw_rtP.Constant_Value_f;
  A380PitchNormalLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Saturation_ix * (A380PitchNormalLaw_rtP.Constant_Value_f - rtb_Y_j)
    * A380PitchNormalLaw_DWork.Delay1_DSTATE + (ca + A380PitchNormalLaw_DWork.Delay_DSTATE_g) * (rtb_Y_j /
    rtb_Saturation_ix);
  rtb_alpha_err_gain = A380PitchNormalLaw_rtP.alpha_err_gain_Gain * rtb_Y_k2;
  rtb_y = A380PitchNormalLaw_rtP.Subsystem3_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_c = (rtb_y - A380PitchNormalLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Saturation_ix = *rtu_In_time_dt * A380PitchNormalLaw_rtP.Subsystem3_C1;
  rtb_Y_k2 = rtb_Saturation_ix + A380PitchNormalLaw_rtP.Constant_Value_bb;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_Y_k2 * (A380PitchNormalLaw_rtP.Constant_Value_bb -
    rtb_Saturation_ix) * A380PitchNormalLaw_DWork.Delay1_DSTATE_i + (rtb_Divide_c +
    A380PitchNormalLaw_DWork.Delay_DSTATE_ca) * (rtb_Saturation_ix / rtb_Y_k2);
  rtb_qk_gain = A380PitchNormalLaw_rtP.qk_gain_Gain * *rtu_In_qk_deg_s;
  rtb_qk_dot_gain = A380PitchNormalLaw_rtP.qk_dot_gain_Gain * *rtu_In_qk_dot_deg_s2;
  rtb_Y_j = *rtu_In_high_aoa_prot_active;
  rtb_Sum_ma = A380PitchNormalLaw_rtP.RateLimiterVariableTs5_up * *rtu_In_time_dt;
  rtb_Y_j = std::fmin(rtb_Y_j - A380PitchNormalLaw_DWork.Delay_DSTATE_e, rtb_Sum_ma);
  rtb_Sum_ma = *rtu_In_time_dt * A380PitchNormalLaw_rtP.RateLimiterVariableTs5_lo;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e += std::fmax(rtb_Y_j, rtb_Sum_ma);
  if (A380PitchNormalLaw_DWork.Delay_DSTATE_e > A380PitchNormalLaw_rtP.Saturation_UpperSat_e) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (A380PitchNormalLaw_DWork.Delay_DSTATE_e < A380PitchNormalLaw_rtP.Saturation_LowerSat_h) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Sum_ma = A380PitchNormalLaw_DWork.Delay_DSTATE_e;
  }

  rtb_v_target = (((A380PitchNormalLaw_rtP.precontrol_gain_Gain * A380PitchNormalLaw_DWork.Delay1_DSTATE +
                    rtb_alpha_err_gain) + A380PitchNormalLaw_rtP.v_dot_gain_Gain *
                   A380PitchNormalLaw_DWork.Delay1_DSTATE_i) + rtb_qk_gain) + rtb_qk_dot_gain;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation3_UpperSat_f) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_UpperSat_f;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation3_LowerSat_c) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_LowerSat_c;
  }

  rtb_Product_k = rtb_v_target * rtb_Sum_ma;
  rtb_Sum1_n = A380PitchNormalLaw_rtP.Constant_Value_fe - rtb_Sum_ma;
  rtb_alpha_err_gain = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  rtb_Divide_ho = (rtb_alpha_err_gain - A380PitchNormalLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt;
  rtb_Gain1_e = A380PitchNormalLaw_rtP.Gain1_Gain_en * *rtu_In_qk_deg_s;
  rtb_Sum_ma = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.uDLookupTable_bp01Data_b,
    A380PitchNormalLaw_rtP.uDLookupTable_tableData_h, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation3_UpperSat_b) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_UpperSat_b;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation3_LowerSat_e) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_LowerSat_e;
  }

  rtb_Bias_o = rtb_Sum_ma / (A380PitchNormalLaw_rtP.Gain5_Gain_e * rtb_v_target) + A380PitchNormalLaw_rtP.Bias_Bias_f;
  A380PitchNormalLaw_RateLimiter_h(rtu_In_ap_theta_c_deg, A380PitchNormalLaw_rtP.RateLimiterVariableTs1_up_d,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs1_lo_g, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_l, &rtb_Y_j,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_d);
  rtb_uDLookupTable = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_h,
    A380PitchNormalLaw_rtP.ScheduledGain_Table_j, 6U);
  A380PitchNormalLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNormalLaw_rtP.RateLimiterVariableTs_up_n,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_lo_c, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_m,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_c2);
  rtb_Saturation_ix = *rtu_In_delta_eta_pos - A380PitchNormalLaw_DWork.Delay_DSTATE_b;
  rtb_Y_k2 = A380PitchNormalLaw_rtP.RateLimiterVariableTs3_up_i * *rtu_In_time_dt;
  rtb_Saturation_ix = std::fmin(rtb_Saturation_ix, rtb_Y_k2);
  rtb_Y_k2 = *rtu_In_time_dt * A380PitchNormalLaw_rtP.RateLimiterVariableTs3_lo_b;
  A380PitchNormalLaw_DWork.Delay_DSTATE_b += std::fmax(rtb_Saturation_ix, rtb_Y_k2);
  rtb_v_target = std::fmax((*rtu_In_high_speed_prot_low_kn - *rtu_In_high_speed_prot_high_kn) *
    A380PitchNormalLaw_DWork.Delay_DSTATE_b, 0.0) + *rtu_In_high_speed_prot_low_kn;
  rtb_qk_gain = A380PitchNormalLaw_rtP.Subsystem2_Gain * rtb_v_target;
  rtb_qk_dot_gain = (rtb_qk_gain - A380PitchNormalLaw_DWork.Delay_DSTATE_ku) / *rtu_In_time_dt;
  rtb_Sum_ma = *rtu_In_time_dt * A380PitchNormalLaw_rtP.Subsystem2_C1;
  rtb_Saturation_ix = rtb_Sum_ma + A380PitchNormalLaw_rtP.Constant_Value_ja;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_l = 1.0 / rtb_Saturation_ix * (A380PitchNormalLaw_rtP.Constant_Value_ja -
    rtb_Sum_ma) * A380PitchNormalLaw_DWork.Delay1_DSTATE_l + (rtb_qk_dot_gain + A380PitchNormalLaw_DWork.Delay_DSTATE_gl)
    * (rtb_Sum_ma / rtb_Saturation_ix);
  rtb_Gain_ll = A380PitchNormalLaw_rtP.Subsystem_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_k = (rtb_Gain_ll - A380PitchNormalLaw_DWork.Delay_DSTATE_m) / *rtu_In_time_dt;
  rtb_Sum_ma = *rtu_In_time_dt * A380PitchNormalLaw_rtP.Subsystem_C1;
  rtb_Saturation_ix = rtb_Sum_ma + A380PitchNormalLaw_rtP.Constant_Value_jj;
  A380PitchNormalLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Saturation_ix * (A380PitchNormalLaw_rtP.Constant_Value_jj -
    rtb_Sum_ma) * A380PitchNormalLaw_DWork.Delay1_DSTATE_n + (rtb_Divide_k + A380PitchNormalLaw_DWork.Delay_DSTATE_k2) *
    (rtb_Sum_ma / rtb_Saturation_ix);
  rtb_in_flare = *rtu_In_high_speed_prot_active;
  rtb_Y_k2 = A380PitchNormalLaw_rtP.RateLimiterVariableTs4_up_b * *rtu_In_time_dt;
  rtb_Saturation_ix = std::fmin(static_cast<real_T>(rtb_in_flare) - A380PitchNormalLaw_DWork.Delay_DSTATE_mz, rtb_Y_k2);
  rtb_Y_k2 = *rtu_In_time_dt * A380PitchNormalLaw_rtP.RateLimiterVariableTs4_lo_o;
  A380PitchNormalLaw_DWork.Delay_DSTATE_mz += std::fmax(rtb_Saturation_ix, rtb_Y_k2);
  if (*rtu_In_any_ap_engaged) {
    rtb_Sum_ma = rtb_Y_j - *rtu_In_Theta_deg;
    rtb_Sum_ma *= rtb_uDLookupTable;
  } else {
    rtb_Y_m = look1_binlxpw(rtb_Y_m, A380PitchNormalLaw_rtP.Loaddemand_bp01Data,
      A380PitchNormalLaw_rtP.Loaddemand_tableData, 2U);
    if (A380PitchNormalLaw_DWork.Delay_DSTATE_mz > A380PitchNormalLaw_rtP.Saturation_UpperSat) {
      rtb_Y_j = A380PitchNormalLaw_rtP.Saturation_UpperSat;
    } else if (A380PitchNormalLaw_DWork.Delay_DSTATE_mz < A380PitchNormalLaw_rtP.Saturation_LowerSat) {
      rtb_Y_j = A380PitchNormalLaw_rtP.Saturation_LowerSat;
    } else {
      rtb_Y_j = A380PitchNormalLaw_DWork.Delay_DSTATE_mz;
    }

    if (rtb_in_flare > A380PitchNormalLaw_rtP.Switch2_Threshold) {
      rtb_Sum_ma = A380PitchNormalLaw_rtP.qk_dot_gain1_Gain * *rtu_In_qk_dot_deg_s2;
      rtb_Y_k2 = A380PitchNormalLaw_rtP.qk_gain_HSP_Gain * *rtu_In_qk_deg_s;
      rtb_v_target -= *rtu_In_V_ias_kn;
      rtb_v_target = ((((A380PitchNormalLaw_rtP.precontrol_gain_HSP_Gain * A380PitchNormalLaw_DWork.Delay1_DSTATE_l +
                         A380PitchNormalLaw_rtP.Gain6_Gain * rtb_v_target) + A380PitchNormalLaw_rtP.v_dot_gain_HSP_Gain *
                        A380PitchNormalLaw_DWork.Delay1_DSTATE_n) + rtb_Y_k2) + rtb_Sum_ma) *
        A380PitchNormalLaw_rtP.HSP_gain_Gain;
      if (rtb_Y_m > A380PitchNormalLaw_rtP.Saturation8_UpperSat) {
        rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation8_UpperSat;
      } else if (rtb_Y_m < A380PitchNormalLaw_rtP.Saturation8_LowerSat) {
        rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation8_LowerSat;
      } else {
        rtb_Sum_ma = rtb_Y_m;
      }

      if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation4_UpperSat) {
        rtb_v_target = A380PitchNormalLaw_rtP.Saturation4_UpperSat;
      } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation4_LowerSat) {
        rtb_v_target = A380PitchNormalLaw_rtP.Saturation4_LowerSat;
      }

      rtb_Sum_ma += rtb_v_target;
    } else {
      rtb_Sum_ma = A380PitchNormalLaw_rtP.Constant1_Value_g;
    }

    rtb_Sum_ma = (A380PitchNormalLaw_rtP.Constant_Value_m - rtb_Y_j) * rtb_Y_m + rtb_Sum_ma * rtb_Y_j;
  }

  rtb_v_target = *rtu_In_Phi_deg;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation_UpperSat_f1) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_UpperSat_f1;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation_LowerSat_o1) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_LowerSat_o1;
  }

  rtb_Sum_ma = (A380PitchNormalLaw_rtP.Gain_Gain_b * A380PitchNormalLaw_rtP.Vm_currentms_Value_h * rtb_Gain1_e +
                rtb_Gain_av) - ((rtb_Cos / std::cos(A380PitchNormalLaw_rtP.Gain1_Gain_lm * rtb_v_target) + rtb_Sum_ma) -
    rtb_Y_a) * rtb_Bias_o;
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.PLUT_bp01Data_f,
    A380PitchNormalLaw_rtP.PLUT_tableData_k, 1U);
  rtb_Y_j = rtb_Sum_ma * rtb_Saturation_ix;
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.DLUT_bp01Data_m,
    A380PitchNormalLaw_rtP.DLUT_tableData_a, 1U);
  rtb_Cos = rtb_Sum_ma * rtb_Saturation_ix * A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_v_target = (rtb_Cos - A380PitchNormalLaw_DWork.Delay_DSTATE_jh) / *rtu_In_time_dt;
  rtb_Y_m = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  rtb_Sum_ma = A380PitchNormalLaw_DWork.Delay_DSTATE_dy;
  rtb_Y_k2 = (rtb_Y_m - A380PitchNormalLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt;
  A380PitchNormalLaw_LagFilter(rtb_Y_k2, A380PitchNormalLaw_rtP.LagFilter_C1_pt, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_LagFilter_i);
  if (rtb_Sum_ma > A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_b) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Sum_ma < A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_m) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_m;
  }

  rtb_Y_k2 = A380PitchNormalLaw_rtP.Gain_Gain_f * rtb_Sum_ma;
  A380PitchNormalLaw_WashoutFilter(rtb_Gain5_gq, A380PitchNormalLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_WashoutFilter_l);
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_c,
    A380PitchNormalLaw_rtP.ScheduledGain_Table_g, 3U);
  if (rtb_Sum_ma > A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_o) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Sum_ma < A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_jl) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_jl;
  }

  rtb_v_target = (((A380PitchNormalLaw_rtP.Gain3_Gain_c * rtb_Divide_ho + rtb_Y_j) + rtb_v_target) + rtb_Y_k2) +
    rtb_Sum_ma * rtb_Saturation_ix;
  rtb_Y_j = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  rtb_Y_k2 = (rtb_Y_j - A380PitchNormalLaw_DWork.Delay_DSTATE_e5) / *rtu_In_time_dt;
  rtb_Divide_ho = A380PitchNormalLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s;
  rtb_Sum_ma = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.uDLookupTable_bp01Data_a,
    A380PitchNormalLaw_rtP.uDLookupTable_tableData_p, 6U);
  rtb_Gain1_e = *rtu_In_V_tas_kn;
  if (rtb_Gain1_e > A380PitchNormalLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_Gain1_e < A380PitchNormalLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation3_LowerSat_a;
  }

  rtb_Sum_ma = (A380PitchNormalLaw_rtP.Gain_Gain_p * A380PitchNormalLaw_rtP.Vm_currentms_Value_p * rtb_Divide_ho +
                rtb_Gain_av) - (rtb_Sum_ma / (A380PitchNormalLaw_rtP.Gain5_Gain_n * rtb_Gain1_e) +
    A380PitchNormalLaw_rtP.Bias_Bias_ai) * (rtb_Y_dd - rtb_Y_a);
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.PLUT_bp01Data_a,
    A380PitchNormalLaw_rtP.PLUT_tableData_o, 1U);
  rtb_Bias_o = rtb_Sum_ma * rtb_Saturation_ix;
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.DLUT_bp01Data_k,
    A380PitchNormalLaw_rtP.DLUT_tableData_e, 1U);
  rtb_Y_dd = rtb_Sum_ma * rtb_Saturation_ix * A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_uDLookupTable = (rtb_Y_dd - A380PitchNormalLaw_DWork.Delay_DSTATE_gz) / *rtu_In_time_dt;
  rtb_Divide_ho = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  rtb_Sum_ma = A380PitchNormalLaw_DWork.Delay_DSTATE_lf;
  rtb_Saturation_ix = (rtb_Divide_ho - A380PitchNormalLaw_DWork.Delay_DSTATE_lf) / *rtu_In_time_dt;
  A380PitchNormalLaw_LagFilter(rtb_Saturation_ix, A380PitchNormalLaw_rtP.LagFilter_C1_l, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_LagFilter_g);
  if (rtb_Sum_ma > A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Sum_ma < A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek;
  }

  rtb_Gain_nu = A380PitchNormalLaw_rtP.Gain_Gain_k * rtb_Sum_ma;
  A380PitchNormalLaw_WashoutFilter(rtb_Gain5_gq, A380PitchNormalLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_WashoutFilter_d);
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_f,
    A380PitchNormalLaw_rtP.ScheduledGain_Table_h, 3U);
  rtb_Gain1_e = (((A380PitchNormalLaw_rtP.Gain3_Gain_m * rtb_Divide_cq + rtb_Product1_ck) + rtb_Divide_l) +
                 A380PitchNormalLaw_rtP.Gain_Gain_j * rtb_Gain_f) + rtb_Product_n3;
  if (rtb_Sum_ma > A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Sum_ma < A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Sum_ma = (((A380PitchNormalLaw_rtP.Gain3_Gain_b * rtb_Y_k2 + rtb_Bias_o) + rtb_uDLookupTable) + rtb_Gain_nu) +
    rtb_Sum_ma * rtb_Saturation_ix;
  if (rtb_Gain1_e > A380PitchNormalLaw_rtP.Saturation_UpperSat_hc) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation_UpperSat_hc;
  } else if (rtb_Gain1_e < A380PitchNormalLaw_rtP.Saturation_LowerSat_a) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation_LowerSat_a;
  }

  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation_UpperSat_k) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation_LowerSat_p1) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_LowerSat_p1;
  }

  if (rtb_Sum_ma > A380PitchNormalLaw_rtP.Saturation_UpperSat_j) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Sum_ma < A380PitchNormalLaw_rtP.Saturation_LowerSat_d) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_LowerSat_d;
  }

  A380PitchNormalLaw_VoterAttitudeProtection(rtb_Gain1_e, rtb_Product_k + rtb_Sum1_n * rtb_v_target, rtb_Sum_ma,
    &rtb_Y_k2);
  rtb_Divide_cq = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_k * *rtu_In_qk_deg_s;
  rtb_Product1_ck = (rtb_Divide_cq - A380PitchNormalLaw_DWork.Delay_DSTATE_h) / *rtu_In_time_dt;
  rtb_Divide_l = A380PitchNormalLaw_rtP.Gain1_Gain_lk * *rtu_In_qk_deg_s;
  rtb_Sum_ma = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.uDLookupTable_bp01Data_m,
    A380PitchNormalLaw_rtP.uDLookupTable_tableData_a, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  rtb_Gain1_e = A380PitchNormalLaw_rtP.Gain3_Gain_g * A380PitchNormalLaw_rtP.Theta_max3_Value - rtb_Loaddemand2;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation3_UpperSat_e) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_UpperSat_e;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation3_LowerSat_k) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation3_LowerSat_k;
  }

  if (rtb_Gain1_e > A380PitchNormalLaw_rtP.Saturation2_UpperSat) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Gain1_e < A380PitchNormalLaw_rtP.Saturation2_LowerSat) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Sum_ma = (A380PitchNormalLaw_rtP.Gain_Gain_jq * A380PitchNormalLaw_rtP.Vm_currentms_Value_b * rtb_Divide_l +
                rtb_Gain_av) - (rtb_Sum_ma / (A380PitchNormalLaw_rtP.Gain5_Gain_m * rtb_v_target) +
    A380PitchNormalLaw_rtP.Bias_Bias_m) * ((rtb_Y_a + look1_binlxpw(rtb_Gain1_e,
    A380PitchNormalLaw_rtP.Loaddemand2_bp01Data, A380PitchNormalLaw_rtP.Loaddemand2_tableData, 2U)) - rtb_Y_a);
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.PLUT_bp01Data_e,
    A380PitchNormalLaw_rtP.PLUT_tableData_g, 1U);
  rtb_Y_a = rtb_Sum_ma * rtb_Saturation_ix;
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNormalLaw_rtP.DLUT_bp01Data_hw,
    A380PitchNormalLaw_rtP.DLUT_tableData_l, 1U);
  rtb_Loaddemand2 = rtb_Sum_ma * rtb_Saturation_ix * A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_c;
  rtb_Divide_l = (rtb_Loaddemand2 - A380PitchNormalLaw_DWork.Delay_DSTATE_ds) / *rtu_In_time_dt;
  rtb_Gain_av = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_p * *rtu_In_V_tas_kn;
  rtb_Sum_ma = A380PitchNormalLaw_DWork.Delay_DSTATE_jt;
  rtb_v_target = (rtb_Gain_av - A380PitchNormalLaw_DWork.Delay_DSTATE_jt) / *rtu_In_time_dt;
  A380PitchNormalLaw_LagFilter(rtb_v_target, A380PitchNormalLaw_rtP.LagFilter_C1_f, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_LagFilter);
  if (rtb_Sum_ma > A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2;
  } else if (rtb_Sum_ma < A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n;
  }

  rtb_Gain_f = A380PitchNormalLaw_rtP.Gain_Gain_l0 * rtb_Sum_ma;
  A380PitchNormalLaw_WashoutFilter(rtb_Gain5_gq, A380PitchNormalLaw_rtP.WashoutFilter_C1_j, rtu_In_time_dt, &rtb_Sum_ma,
    &A380PitchNormalLaw_DWork.sf_WashoutFilter);
  rtb_Saturation_ix = look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_b,
    A380PitchNormalLaw_rtP.ScheduledGain_Table_e, 3U);
  rtb_v_target = (((A380PitchNormalLaw_rtP.Gain3_Gain * rtb_Divide + rtb_Product1_dm) + rtb_Divide_o) +
                  A380PitchNormalLaw_rtP.Gain_Gain_l * rtb_Divide_bq) + rtb_Product_kz;
  if (rtb_Sum_ma > A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m;
  } else if (rtb_Sum_ma < A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d;
  }

  rtb_Gain1_e = (((A380PitchNormalLaw_rtP.Gain3_Gain_n * rtb_Product1_ck + rtb_Y_a) + rtb_Divide_l) + rtb_Gain_f) +
    rtb_Sum_ma * rtb_Saturation_ix;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation_UpperSat_h) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation_LowerSat_o) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_LowerSat_o;
  }

  if (rtb_Gain1_e > A380PitchNormalLaw_rtP.Saturation_UpperSat_a) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Gain1_e < A380PitchNormalLaw_rtP.Saturation_LowerSat_k) {
    rtb_Gain1_e = A380PitchNormalLaw_rtP.Saturation_LowerSat_k;
  }

  A380PitchNormalLaw_VoterAttitudeProtection(rtb_v_target, rtb_Y_k2, rtb_Gain1_e, &rtb_Saturation_ix);
  rtb_Sum_ma = look1_binlxpw(*rtu_In_V_ias_kn, A380PitchNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1,
    A380PitchNormalLaw_rtP.ScheduledGain1_Table, 4U);
  rtb_Y_a = rtb_Saturation_ix * rtb_Sum_ma;
  rtb_Sum_ma = look1_binlxpw(*rtu_In_time_dt, A380PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_d,
    A380PitchNormalLaw_rtP.ScheduledGain_Table_hh, 5U);
  rtb_Sum_ma = rtb_Y_a * rtb_Sum_ma * A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  rtb_Y_a = *rtu_In_eta_deg - rtb_Sum_ma;
  rtb_AND = ((rtb_Y_pa == 0.0) || (rtb_ManualSwitch == A380PitchNormalLaw_rtP.CompareToConstant_const) ||
             (*rtu_In_tracking_mode_on));
  A380PitchNormalLaw_DWork.icLoad = (rtb_AND || A380PitchNormalLaw_DWork.icLoad);
  if (A380PitchNormalLaw_DWork.icLoad) {
    A380PitchNormalLaw_DWork.Delay_DSTATE_o = rtb_Y_a;
  }

  A380PitchNormalLaw_DWork.Delay_DSTATE_o += rtb_Sum_ma;
  if (A380PitchNormalLaw_DWork.Delay_DSTATE_o > A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380PitchNormalLaw_DWork.Delay_DSTATE_o = A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380PitchNormalLaw_DWork.Delay_DSTATE_o <
             A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380PitchNormalLaw_DWork.Delay_DSTATE_o = A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_NOT == A380PitchNormalLaw_rtP.CompareToConstant_const_d) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Constant_Value_b;
  } else {
    rtb_Sum_ma = A380PitchNormalLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Sum_ma *= A380PitchNormalLaw_rtP.Gain_Gain_cy;
  if (rtb_Sum_ma > rtb_eta_trim_deg_rate_limit_up_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_up_deg_s;
  } else if (rtb_Sum_ma < rtb_eta_trim_deg_rate_limit_lo_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_lo_deg_s;
  } else {
    *rty_Out_eta_trim_dot_deg_s = rtb_Sum_ma;
  }

  if (rtb_Y_pa > A380PitchNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (rtb_Y_pa < A380PitchNormalLaw_rtP.Saturation_LowerSat_kp) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_LowerSat_kp;
  } else {
    rtb_Sum_ma = rtb_Y_pa;
  }

  rtb_Product1_dm = A380PitchNormalLaw_DWork.Delay_DSTATE_o * rtb_Sum_ma;
  rtb_Divide = A380PitchNormalLaw_rtP.Constant_Value_o1 - rtb_Sum_ma;
  A380PitchNormalLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNormalLaw_rtP.RateLimiterVariableTs_up_na,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_lo_i, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Y_a,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_ct);
  rtb_Sum_ma = look2_binlxpw(*rtu_In_Theta_deg, *rtu_In_H_radio_ft, A380PitchNormalLaw_rtP.uDLookupTable_bp01Data_l,
    A380PitchNormalLaw_rtP.uDLookupTable_bp02Data, A380PitchNormalLaw_rtP.uDLookupTable_tableData_e5,
    A380PitchNormalLaw_rtP.uDLookupTable_maxIndex, 5U);
  rtb_Saturation_ix = *rtu_In_tailstrike_protection_on;
  if (rtb_Y_a > A380PitchNormalLaw_rtP.Saturation3_UpperSat_l) {
    rtb_Y_k2 = A380PitchNormalLaw_rtP.Saturation3_UpperSat_l;
  } else if (rtb_Y_a < A380PitchNormalLaw_rtP.Saturation3_LowerSat_h) {
    rtb_Y_k2 = A380PitchNormalLaw_rtP.Saturation3_LowerSat_h;
  } else {
    rtb_Y_k2 = rtb_Y_a;
  }

  rtb_Sum_ma = look1_binlxpw(rtb_Saturation_ix * rtb_Sum_ma * rtb_Y_k2 + rtb_Y_a,
    A380PitchNormalLaw_rtP.PitchRateDemand_bp01Data, A380PitchNormalLaw_rtP.PitchRateDemand_tableData, 2U);
  rtb_eta_trim_deg_rate_limit_up_deg_s = A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j3 * rtb_Sum_ma;
  rtb_Y_a = (rtb_eta_trim_deg_rate_limit_up_deg_s - A380PitchNormalLaw_DWork.Delay_DSTATE_ej) / *rtu_In_time_dt;
  rtb_Saturation_ix = *rtu_In_qk_deg_s - rtb_Sum_ma;
  rtb_Divide_o = A380PitchNormalLaw_rtP.Gain_Gain_pt * rtb_Saturation_ix;
  rtb_eta_trim_deg_rate_limit_lo_deg_s = A380PitchNormalLaw_rtP.Gain1_Gain_d * rtb_Saturation_ix *
    A380PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_g;
  rtb_Saturation_ix = A380PitchNormalLaw_DWork.Delay_DSTATE_e4;
  rtb_Divide_bq = (rtb_eta_trim_deg_rate_limit_lo_deg_s - A380PitchNormalLaw_DWork.Delay_DSTATE_e4) / *rtu_In_time_dt;
  rtb_Gain5_gq = A380PitchNormalLaw_rtP.Gain5_Gain_h * *rtu_In_qk_dot_deg_s2;
  rtb_Gain5_gq += *rtu_In_qk_deg_s;
  A380PitchNormalLaw_LagFilter(rtb_Gain5_gq, A380PitchNormalLaw_rtP.LagFilter_C1_k, rtu_In_time_dt, &rtb_Saturation_ix,
    &A380PitchNormalLaw_DWork.sf_LagFilter_f);
  rtb_Gain5_gq = A380PitchNormalLaw_rtP.Gain6_Gain_g * *rtu_In_qk_dot_deg_s2;
  rtb_Y_a = (((rtb_Divide_o + rtb_Divide_bq) * A380PitchNormalLaw_rtP.Gain1_Gain_a + A380PitchNormalLaw_rtP.Gain3_Gain_e
              * rtb_Y_a) + (rtb_Saturation_ix - rtb_Sum_ma) * A380PitchNormalLaw_rtP.Gain4_Gain) + rtb_Gain5_gq;
  rtb_Sum_ma = look1_binlxpw(*rtu_In_V_ias_kn, A380PitchNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1_h,
    A380PitchNormalLaw_rtP.ScheduledGain1_Table_c, 4U);
  rtb_Sum_ma = (A380PitchNormalLaw_rtP.Constant2_Value_k - rtb_Y_pa) * (rtb_Y_a * rtb_Sum_ma) *
    A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain_j * *rtu_In_time_dt;
  rtb_NOT = (*rtu_In_delta_eta_pos <= A380PitchNormalLaw_rtP.Constant_Value_o);
  rtb_NOT = (rtb_NOT && (*rtu_In_on_ground));
  rtb_NOT = (rtb_NOT || (rtb_Y_lv == 0.0) || (*rtu_In_tracking_mode_on));
  A380PitchNormalLaw_DWork.icLoad_p = (rtb_NOT || A380PitchNormalLaw_DWork.icLoad_p);
  if (A380PitchNormalLaw_DWork.icLoad_p) {
    A380PitchNormalLaw_DWork.Delay_DSTATE_cl = A380PitchNormalLaw_rtP.Constant_Value_jk - rtb_Sum_ma;
  }

  A380PitchNormalLaw_DWork.Delay_DSTATE_cl += rtb_Sum_ma;
  if (A380PitchNormalLaw_DWork.Delay_DSTATE_cl > A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p) {
    A380PitchNormalLaw_DWork.Delay_DSTATE_cl = A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p;
  } else if (A380PitchNormalLaw_DWork.Delay_DSTATE_cl <
             A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_h) {
    A380PitchNormalLaw_DWork.Delay_DSTATE_cl = A380PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_h;
  }

  if (*rtu_In_on_ground) {
    if (rtb_Gain > A380PitchNormalLaw_rtP.Saturation_UpperSat_f) {
      rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_UpperSat_f;
    } else if (rtb_Gain < A380PitchNormalLaw_rtP.Saturation_LowerSat_p) {
      rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_LowerSat_p;
    } else {
      rtb_Sum_ma = rtb_Gain;
    }
  } else {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Constant1_Value_h;
  }

  rtb_Y_pa = A380PitchNormalLaw_DWork.Delay_DSTATE_cl + rtb_Sum_ma;
  if (rtb_Y_lv > A380PitchNormalLaw_rtP.Saturation_UpperSat_m) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_UpperSat_m;
  } else if (rtb_Y_lv < A380PitchNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Sum_ma = rtb_Y_lv;
  }

  rtb_Gain = (A380PitchNormalLaw_rtP.Constant_Value_h - rtb_Sum_ma) * rtb_Gain + rtb_Y_pa * rtb_Sum_ma;
  if (rtb_ManualSwitch > A380PitchNormalLaw_rtP.Saturation_UpperSat_p) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_UpperSat_p;
  } else if (rtb_ManualSwitch < A380PitchNormalLaw_rtP.Saturation_LowerSat_hs) {
    rtb_Sum_ma = A380PitchNormalLaw_rtP.Saturation_LowerSat_hs;
  } else {
    rtb_Sum_ma = rtb_ManualSwitch;
  }

  A380PitchNormalLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNormalLaw_rtP.RateLimiterVariableTs_up_i,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_lo_f, rtu_In_time_dt,
    A380PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_c, &rtb_Y_k2,
    &A380PitchNormalLaw_DWork.sf_RateLimiter_h);
  rtb_ManualSwitch = A380PitchNormalLaw_rtP.Gain1_Gain_h * *rtu_In_qk_deg_s;
  rtb_Y_lv = *rtu_In_nz_g + A380PitchNormalLaw_rtP.Bias_Bias_d;
  rtb_v_target = A380PitchNormalLaw_rtP.Gain2_Gain_n * rtb_Y_lv + rtb_ManualSwitch;
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation_UpperSat_g) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_UpperSat_g;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation_LowerSat_kf) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_LowerSat_kf;
  }

  rtb_v_target = (A380PitchNormalLaw_rtP.Gain_Gain_m * rtb_Y_k2 + rtb_v_target) * rtb_Sum_ma + (rtb_Divide * rtb_Gain +
    rtb_Product1_dm) * (A380PitchNormalLaw_rtP.Constant_Value_fw - rtb_Sum_ma);
  if (rtb_v_target > A380PitchNormalLaw_rtP.Saturation_UpperSat_kp) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_UpperSat_kp;
  } else if (rtb_v_target < A380PitchNormalLaw_rtP.Saturation_LowerSat_a4) {
    rtb_v_target = A380PitchNormalLaw_rtP.Saturation_LowerSat_a4;
  }

  A380PitchNormalLaw_RateLimiter(rtb_v_target, A380PitchNormalLaw_rtP.RateLimitereta_up,
    A380PitchNormalLaw_rtP.RateLimitereta_lo, rtu_In_time_dt, A380PitchNormalLaw_rtP.RateLimitereta_InitialCondition,
    rty_Out_eta_deg, &A380PitchNormalLaw_DWork.sf_RateLimiter_b);
  A380PitchNormalLaw_DWork.Delay_DSTATE = rtb_Gain1;
  A380PitchNormalLaw_DWork.Delay_DSTATE_n = rtb_Gain_px;
  A380PitchNormalLaw_DWork.Delay_DSTATE_c = rtb_Gain_ot;
  A380PitchNormalLaw_DWork.Delay_DSTATE_l = rtb_Divide_an;
  A380PitchNormalLaw_DWork.Delay_DSTATE_k = rtb_Gain1_ft;
  A380PitchNormalLaw_DWork.Delay_DSTATE_d = rtb_Gain_bs;
  A380PitchNormalLaw_DWork.Delay_DSTATE_f = rtb_y_c;
  A380PitchNormalLaw_DWork.Delay_DSTATE_g = ca;
  A380PitchNormalLaw_DWork.Delay_DSTATE_j = rtb_y;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ca = rtb_Divide_c;
  A380PitchNormalLaw_DWork.Delay_DSTATE_kd = rtb_alpha_err_gain;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ku = rtb_qk_gain;
  A380PitchNormalLaw_DWork.Delay_DSTATE_gl = rtb_qk_dot_gain;
  A380PitchNormalLaw_DWork.Delay_DSTATE_m = rtb_Gain_ll;
  A380PitchNormalLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_k;
  A380PitchNormalLaw_DWork.Delay_DSTATE_jh = rtb_Cos;
  A380PitchNormalLaw_DWork.Delay_DSTATE_dy = rtb_Y_m;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e5 = rtb_Y_j;
  A380PitchNormalLaw_DWork.Delay_DSTATE_gz = rtb_Y_dd;
  A380PitchNormalLaw_DWork.Delay_DSTATE_lf = rtb_Divide_ho;
  A380PitchNormalLaw_DWork.Delay_DSTATE_h = rtb_Divide_cq;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ds = rtb_Loaddemand2;
  A380PitchNormalLaw_DWork.Delay_DSTATE_jt = rtb_Gain_av;
  A380PitchNormalLaw_DWork.icLoad = false;
  A380PitchNormalLaw_DWork.Delay_DSTATE_ej = rtb_eta_trim_deg_rate_limit_up_deg_s;
  A380PitchNormalLaw_DWork.Delay_DSTATE_e4 = rtb_eta_trim_deg_rate_limit_lo_deg_s;
  A380PitchNormalLaw_DWork.icLoad_p = false;
}

A380PitchNormalLaw::A380PitchNormalLaw():
  A380PitchNormalLaw_B(),
  A380PitchNormalLaw_DWork()
{
}

A380PitchNormalLaw::~A380PitchNormalLaw() = default;
