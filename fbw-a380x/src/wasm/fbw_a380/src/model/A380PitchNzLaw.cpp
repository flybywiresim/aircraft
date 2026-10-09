#include "A380PitchNzLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"
#include "look1_binlcpw.h"

const uint8_T A380PitchNzLaw_IN_Flight{ 1U };

const uint8_T A380PitchNzLaw_IN_FlightToGroundTransition{ 2U };

const uint8_T A380PitchNzLaw_IN_Ground{ 3U };

const uint8_T A380PitchNzLaw_IN_GroundToFlightTransition{ 4U };

const uint8_T A380PitchNzLaw_IN_NO_ACTIVE_CHILD{ 0U };

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

  6.666666666666667,

  0.5,

  0.5,

  2.0,

  2.0,

  2.0,

  2.0,

  2.0,

  0.52083333333333337,

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

  -30.0,

  -12.0,


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.1, 0.1, 0.15, 0.2, 0.3, 0.5, 0.5 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },


  { 1.0, 1.0, 1.0, 1.0, 1.0, 0.25 },

  20.0,

  20.0,

  100.0,

  100.0,

  1.5,

  1.0,

  1.0,

  33.0,

  1.25,

  0.5,

  0.0,

  1.0,

  100.0,

  -0.5,

  -10.0,

  -0.2,

  -0.5,

  -0.5,

  -1.0,

  -1.0,

  -1.0,

  -0.25,

  -2.0,

  -4.0,

  -0.5,

  -0.33333333333333331,

  -2.0,

  -2.0,

  -1.0,

  -4.0,

  -45.0,

  1.0,

  0.5,

  1.0,

  2.5,

  0.25,

  0.5,

  0.2,

  0.25,

  0.5,

  0.5,

  1.0,

  1.0,

  1.0,

  4.0,

  2.0,

  4.0,

  0.5,

  4.0,

  2.0,

  2.0,

  1.0,

  4.0,

  45.0,

  true,

  false,

  true,

  true,

  false,

  false,

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

  2.0,

  2.0,

  100.0,

  12.0,

  0.0,

  -2.5,

  -2.0,

  10.0,

  0.0,

  0.0,

  0.0,

  -8.46,

  -3.9009000000000005,

  3.2808,

  0.0,

  -3.0,

  2.0,

  2.0,

  100.0,

  12.0,

  0.0,

  -3.5,

  -2.0,

  10.0,

  0.0,

  0.0,

  1.0,

  0.0,

  -16.0,

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

  30.0,

  10.0,

  -100.0,

  0.017453292519943295,

  3.9009000000000005,

  13.062799999999996,

  0.017453292519943295,

  4.25,

  23.95,

  8.3,

  -2.9801827384337889,

  3.2808,

  2.0,

  0.0,

  -999.0,

  -1.0,

  0.017453292519943295,

  16.5,

  73.0,

  8.3,

  3.0,

  10.0,

  -2.0,


  { 3.5, 3.5, 2.4, 0.0, -1.0 },


  { -16.0, -11.0, -8.0, 0.0, 8.0 },

  1.0,

  0.0,

  1.0,

  1.0,

  0.0,

  1.0,

  15.0,

  20.0,

  0.1,


  { 1.0, 0.0 },


  { 0.8, 1.0 },


  { 0.0, 1.0 },


  { 0.0, 2.0 },

  3.0,


  { 27.0, 23.5, 20.0, 10.0, 20.0 },


  { -16.0, -12.0, -8.0, 0.0, 16.0 },


  { -14.0, -14.0, -10.0 },


  { -16.0, 0.0, 16.0 },


  { 1.0, 0.0, 0.0, 1.0 },


  { -15.0, -12.0, 12.0, 15.0 },

  -1.0,

  1.0,

  0.5,


  { -30.0, 0.0, 10.0, 20.0 },


  { -16.0, 0.0, 6.0, 16.0 },

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

  false,


  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  1U
};

void A380PitchNzLaw::A380PitchNzLaw_MATLABFunction_Reset(rtDW_MATLABFunction_A380PitchNzLaw_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PitchNzLaw::A380PitchNzLaw_MATLABFunction(boolean_T rtu_u, const real_T *rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PitchNzLaw_T *localDW)
{
  if (rtu_u == rtu_isRisingEdge) {
    localDW->timeSinceCondition += *rtu_Ts;
    if (localDW->timeSinceCondition >= rtu_timeDelay) {
      localDW->output = rtu_u;
    }
  } else {
    localDW->timeSinceCondition = 0.0;
    localDW->output = rtu_u;
  }

  *rty_y = localDW->output;
}

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

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter_p_Reset(rtDW_RateLimiter_A380PitchNzLaw_f_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter_p(boolean_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380PitchNzLaw_f_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(static_cast<real_T>(rtu_u) - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs
    (rtu_lo) * *rtu_Ts);
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

void A380PitchNzLaw::A380PitchNzLaw_LagFilter_c_Reset(rtDW_LagFilter_A380PitchNzLaw_n_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_LagFilter_m(const real_T *rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380PitchNzLaw_n_T *localDW)
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

void A380PitchNzLaw::A380PitchNzLaw_MATLABFunction_e_Reset(rtDW_MATLABFunction_A380PitchNzLaw_b_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380PitchNzLaw::A380PitchNzLaw_MATLABFunction_c(const boolean_T *rtu_u, const real_T *rtu_Ts, boolean_T
  rtu_isRisingEdge, real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380PitchNzLaw_b_T *localDW)
{
  if (*rtu_u == rtu_isRisingEdge) {
    localDW->timeSinceCondition += *rtu_Ts;
    if (localDW->timeSinceCondition >= rtu_timeDelay) {
      localDW->output = *rtu_u;
    }
  } else {
    localDW->timeSinceCondition = 0.0;
    localDW->output = *rtu_u;
  }

  *rty_y = localDW->output;
}

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter_k_Reset(rtDW_RateLimiter_A380PitchNzLaw_d_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380PitchNzLaw::A380PitchNzLaw_RateLimiter_n(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380PitchNzLaw_d_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_u;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_u;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void A380PitchNzLaw::init(void)
{
  A380PitchNzLaw_DWork.DelayOneStep_DSTATE = A380PitchNzLaw_rtP.DelayOneStep_InitialCondition;
  A380PitchNzLaw_DWork.Memory_PreviousInput = A380PitchNzLaw_rtP.SRFlipFlop_initial_condition;
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
  A380PitchNzLaw_DWork.Delay_DSTATE_e = A380PitchNzLaw_rtP.RateLimiterVariableTs5_InitialCondition_c;
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
  A380PitchNzLaw_DWork.Delay_DSTATE_j5 = A380PitchNzLaw_rtP.RateLimiterVariableTs5_InitialCondition_d;
  A380PitchNzLaw_DWork.Delay_DSTATE_kp = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380PitchNzLaw_B.u = A380PitchNzLaw_rtP.Y_Y0;
}

void A380PitchNzLaw::reset(void)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  A380PitchNzLaw_DWork.DelayOneStep_DSTATE = A380PitchNzLaw_rtP.DelayOneStep_InitialCondition;
  A380PitchNzLaw_DWork.Memory_PreviousInput = A380PitchNzLaw_rtP.SRFlipFlop_initial_condition;
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
  A380PitchNzLaw_DWork.Delay_DSTATE_e = A380PitchNzLaw_rtP.RateLimiterVariableTs5_InitialCondition_c;
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
  A380PitchNzLaw_DWork.Delay_DSTATE_j5 = A380PitchNzLaw_rtP.RateLimiterVariableTs5_InitialCondition_d;
  A380PitchNzLaw_DWork.Delay_DSTATE_kp = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380PitchNzLaw_B.in_flight = false;
  A380PitchNzLaw_DWork.on_ground_time = 0.0;
  A380PitchNzLaw_DWork.in_flight_time = 0.0;
  A380PitchNzLaw_DWork.is_active_c3_A380PitchNzLaw = 0U;
  A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_l);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter);
  A380PitchNzLaw_MATLABFunction_Reset(&A380PitchNzLaw_DWork.sf_MATLABFunction);
  A380PitchNzLaw_MATLABFunction_Reset(&A380PitchNzLaw_DWork.sf_MATLABFunction_j);
  rtb_nz_limit_up_g = 0.0;
  rtb_nz_limit_lo_g = 0.0;
  A380PitchNzLaw_DWork.is_active_c7_A380PitchNzLaw = 0U;
  A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_NO_ACTIVE_CHILD;
  A380PitchNzLaw_RateLimiter_p_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_p);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_c);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_n);
  A380PitchNzLaw_RateLimiter_p_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_j);
  A380PitchNzLaw_eta_trim_limit_lofreeze_Reset(&A380PitchNzLaw_DWork.sf_eta_trim_limit_lofreeze);
  A380PitchNzLaw_eta_trim_limit_lofreeze_Reset(&A380PitchNzLaw_DWork.sf_eta_trim_limit_upfreeze);
  A380PitchNzLaw_RateLimiter_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_o);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_k);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_k);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_g3);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_c);
  A380PitchNzLaw_RateLimiter_l_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_nx);
  A380PitchNzLaw_LagFilter_c_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_m);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_h);
  A380PitchNzLaw_RateLimiter_l_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_d);
  A380PitchNzLaw_RateLimiter_l_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_c2);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_i);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_l);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_g);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_d);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter);
  A380PitchNzLaw_MATLABFunction_e_Reset(&A380PitchNzLaw_DWork.sf_MATLABFunction_h);
  A380PitchNzLaw_LagFilter_c_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_l);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_b);
  A380PitchNzLaw_LagFilter_c_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_g5);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_ow);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_o);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_m);
  A380PitchNzLaw_RateLimiter_k_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_m);
  A380PitchNzLaw_MATLABFunction_e_Reset(&A380PitchNzLaw_DWork.sf_MATLABFunction_c);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_f);
  A380PitchNzLaw_WashoutFilter_Reset(&A380PitchNzLaw_DWork.sf_WashoutFilter_i);
  A380PitchNzLaw_RateLimiter_k_Reset(&A380PitchNzLaw_DWork.sf_RateLimiter_n5);
  A380PitchNzLaw_MATLABFunction_Reset(&A380PitchNzLaw_DWork.sf_MATLABFunction_e);
  A380PitchNzLaw_LagFilter_Reset(&A380PitchNzLaw_DWork.sf_LagFilter_h);
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
  real_T rtb_Divide_bu;
  real_T rtb_Divide_c;
  real_T rtb_Divide_dr;
  real_T rtb_Divide_n0;
  real_T rtb_Gain;
  real_T rtb_Gain_c;
  real_T rtb_Gain_dj;
  real_T rtb_Gain_dv;
  real_T rtb_Gain_e;
  real_T rtb_Gain_g;
  real_T rtb_Gain_gm;
  real_T rtb_Gain_ha;
  real_T rtb_Gain_i4;
  real_T rtb_Gain_m2;
  real_T rtb_Max_d;
  real_T rtb_Minup;
  real_T rtb_Objectiveattenuation;
  real_T rtb_Product_fu;
  real_T rtb_Saturation_an;
  real_T rtb_Saturation_ix;
  real_T rtb_Sum1;
  real_T rtb_Sum1_c;
  real_T rtb_Sum1_mw;
  real_T rtb_Sum_ma;
  real_T rtb_Tsxlo;
  real_T rtb_Y_a;
  real_T rtb_Y_a0;
  real_T rtb_Y_g;
  real_T rtb_Y_h;
  real_T rtb_Y_ht;
  real_T rtb_Y_kl;
  real_T rtb_Y_l;
  real_T rtb_Y_n;
  real_T rtb_Y_of;
  real_T rtb_alpha_err_gain;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_eta_trim_deg_rate_limit_up_deg_s;
  real_T rtb_v_target;
  real_T rtb_y_dm;
  real_T y;
  real_T y_0;
  real_T y_1;
  int32_T tmp;
  boolean_T rtb_Compare_j;
  boolean_T rtb_Logic_idx_0_tmp;
  boolean_T rtb_NAND;
  boolean_T rtb_OR1;
  boolean_T rtb_OR3;
  boolean_T rtb_OR4;
  boolean_T rtb_y_k;
  boolean_T rtb_y_o;
  if (A380PitchNzLaw_DWork.is_active_c3_A380PitchNzLaw == 0) {
    A380PitchNzLaw_DWork.is_active_c3_A380PitchNzLaw = 1U;
    A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Ground;
    A380PitchNzLaw_B.in_flight = false;
  } else {
    switch (A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw) {
     case A380PitchNzLaw_IN_Flight:
      if ((*rtu_In_on_ground) && (*rtu_In_Theta_deg < 0.5)) {
        A380PitchNzLaw_DWork.on_ground_time = *rtu_In_time_simulation_time;
        A380PitchNzLaw_DWork.in_flight_time = 0.0;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_FlightToGroundTransition;
      } else {
        A380PitchNzLaw_B.in_flight = true;
      }
      break;

     case A380PitchNzLaw_IN_FlightToGroundTransition:
      if (*rtu_In_time_simulation_time - A380PitchNzLaw_DWork.on_ground_time >= 5.0) {
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Ground;
        A380PitchNzLaw_B.in_flight = false;
      } else if ((!*rtu_In_on_ground) || (*rtu_In_Theta_deg >= 0.5)) {
        A380PitchNzLaw_DWork.on_ground_time = 0.0;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Flight;
        A380PitchNzLaw_B.in_flight = true;
      }
      break;

     case A380PitchNzLaw_IN_Ground:
      if (!*rtu_In_on_ground) {
        A380PitchNzLaw_DWork.on_ground_time = 0.0;
        A380PitchNzLaw_DWork.in_flight_time = *rtu_In_time_simulation_time;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_GroundToFlightTransition;
      } else {
        A380PitchNzLaw_B.in_flight = false;
      }
      break;

     default:
      if (*rtu_In_time_simulation_time - A380PitchNzLaw_DWork.in_flight_time >= 5.0) {
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Flight;
        A380PitchNzLaw_B.in_flight = true;
      } else if (*rtu_In_on_ground) {
        A380PitchNzLaw_DWork.in_flight_time = 0.0;
        A380PitchNzLaw_DWork.is_c3_A380PitchNzLaw = A380PitchNzLaw_IN_Ground;
        A380PitchNzLaw_B.in_flight = false;
      }
      break;
    }
  }

  rtb_OR4 = (A380PitchNzLaw_B.in_flight || (*rtu_In_any_ap_engaged));
  rtb_OR3 = ((!A380PitchNzLaw_DWork.DelayOneStep_DSTATE) && rtb_OR4 && (*rtu_In_H_radio_ft >
              A380PitchNzLaw_rtP.CompareToConstant7_const));
  rtb_Logic_idx_0_tmp = !rtb_OR4;
  A380PitchNzLaw_DWork.DelayOneStep_DSTATE = A380PitchNzLaw_rtP.Logic_table[(((static_cast<uint32_T>(rtb_OR3) << 1) +
    rtb_Logic_idx_0_tmp) << 1) + A380PitchNzLaw_DWork.Memory_PreviousInput];
  if (A380PitchNzLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_Max_d = A380PitchNzLaw_rtP.Constant1_Value;
  } else {
    rtb_Max_d = A380PitchNzLaw_rtP.Constant_Value;
  }

  rtb_y_k = (A380PitchNzLaw_DWork.DelayOneStep_DSTATE && ((rtb_Max_d != 0.0) || (*rtu_In_flare_override) ||
              (*rtu_In_H_radio_ft <= A380PitchNzLaw_rtP.CompareToConstant_const)) && (!*rtu_In_any_ap_engaged));
  A380PitchNzLaw_RateLimiter(static_cast<real_T>(rtb_y_k), A380PitchNzLaw_rtP.RateLimiterVariableTs4_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs4_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs4_InitialCondition, &rtb_Y_h, &A380PitchNzLaw_DWork.sf_RateLimiter_l);
  if (static_cast<real_T>(rtb_OR4) > A380PitchNzLaw_rtP.Saturation_UpperSat_c) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_UpperSat_c;
  } else if (static_cast<real_T>(rtb_OR4) < A380PitchNzLaw_rtP.Saturation_LowerSat_n) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_LowerSat_n;
  } else {
    rtb_Max_d = rtb_OR4;
  }

  A380PitchNzLaw_RateLimiter(rtb_Max_d, A380PitchNzLaw_rtP.RateLimiterVariableTs_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_n, &A380PitchNzLaw_DWork.sf_RateLimiter);
  rtb_Gain = A380PitchNzLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  rtb_Compare_j = (*rtu_In_Theta_deg < A380PitchNzLaw_rtP.CompareToConstant5_const);
  rtb_OR1 = (*rtu_In_gnd_splr_cmd_deg > A380PitchNzLaw_rtP.CompareToConstant6_const);
  rtb_NAND = ((!*rtu_In_on_ground) || (!rtb_Compare_j) || (!rtb_OR1));
  A380PitchNzLaw_MATLABFunction((rtb_OR4 || rtb_OR1), rtu_In_time_dt, A380PitchNzLaw_rtP.ConfirmNode1_isRisingEdge,
    A380PitchNzLaw_rtP.ConfirmNode1_timeDelay, &rtb_y_o, &A380PitchNzLaw_DWork.sf_MATLABFunction);
  rtb_OR1 = (rtb_y_k || (rtb_Y_n < A380PitchNzLaw_rtP.CompareToConstant1_const) || (*rtu_In_nz_g >=
              A380PitchNzLaw_rtP.CompareToConstant3_const) || (*rtu_In_nz_g <=
              A380PitchNzLaw_rtP.CompareToConstant4_const) || (std::abs(*rtu_In_Phi_deg) >
              A380PitchNzLaw_rtP.CompareToConstant2_const));
  A380PitchNzLaw_MATLABFunction(rtb_Compare_j, rtu_In_time_dt, A380PitchNzLaw_rtP.ConfirmNode2_isRisingEdge,
    A380PitchNzLaw_rtP.ConfirmNode2_timeDelay, &rtb_OR3, &A380PitchNzLaw_DWork.sf_MATLABFunction_j);
  rtb_OR3 = (rtb_y_o || rtb_y_k || rtb_OR3);
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
      } else if (rtb_Logic_idx_0_tmp && (*rtu_In_flaps_handle_index == 0.0)) {
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
      } else if (rtb_Logic_idx_0_tmp) {
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
      if (rtb_OR4 && (*rtu_In_flaps_handle_index == 0.0)) {
        A380PitchNzLaw_DWork.is_c7_A380PitchNzLaw = A380PitchNzLaw_IN_flight_clean;
        rtb_eta_trim_deg_rate_limit_up_deg_s = 0.15;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.15;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (rtb_OR4 && (*rtu_In_flaps_handle_index != 0.0)) {
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

  A380PitchNzLaw_RateLimiter_p(!rtb_y_o, A380PitchNzLaw_rtP.RateLimiterVariableTs1_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_a0, &A380PitchNzLaw_DWork.sf_RateLimiter_p);
  A380PitchNzLaw_RateLimiter(rtb_nz_limit_up_g, A380PitchNzLaw_rtP.RateLimiterVariableTs2_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y_ht, &A380PitchNzLaw_DWork.sf_RateLimiter_c);
  A380PitchNzLaw_RateLimiter(rtb_nz_limit_lo_g, A380PitchNzLaw_rtP.RateLimiterVariableTs3_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_a, &A380PitchNzLaw_DWork.sf_RateLimiter_n);
  A380PitchNzLaw_RateLimiter_p(rtb_NAND, A380PitchNzLaw_rtP.RateLimiterVariableTs5_up,
    A380PitchNzLaw_rtP.RateLimiterVariableTs5_lo, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs5_InitialCondition, &rtb_Y_of, &A380PitchNzLaw_DWork.sf_RateLimiter_j);
  A380PitchNzLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_aoa_prot_active, &rtb_Y_g,
    &A380PitchNzLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (*rtu_In_high_aoa_prot_active) {
    *rty_Out_eta_trim_limit_lo = rtb_Y_g;
  } else {
    *rty_Out_eta_trim_limit_lo = A380PitchNzLaw_rtP.Constant3_Value;
  }

  A380PitchNzLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_speed_prot_active, &rtb_Y_g,
    &A380PitchNzLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (*rtu_In_high_speed_prot_active) {
    *rty_Out_eta_trim_limit_up = rtb_Y_g;
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
    A380PitchNzLaw_rtP.RateLimiterVariableTs6_InitialCondition, &rtb_Y_g, &A380PitchNzLaw_DWork.sf_RateLimiter_o);
  rtb_Y_kl = A380PitchNzLaw_rtP.Gain1_Gain * *rtu_In_Theta_deg;
  rtb_Minup = std::cos(A380PitchNzLaw_rtP.Gain1_Gain_c * *rtu_In_Theta_deg);
  rtb_Objectiveattenuation = rtb_Minup / std::cos(A380PitchNzLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg);
  rtb_Saturation_ix = A380PitchNzLaw_rtP.Gain2_Gain_p * rtb_Y_g - rtb_Y_kl;
  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_UpperSat;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_LowerSat;
  } else {
    rtb_Max_d = *rtu_In_V_tas_kn;
  }

  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation1_UpperSat_i) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation1_UpperSat_i;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation1_LowerSat_h) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation1_LowerSat_h;
  }

  rtb_Gain_m2 = *rtu_In_nz_g - rtb_Objectiveattenuation;
  rtb_Saturation_ix = (A380PitchNzLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_c *
    A380PitchNzLaw_rtP.Vm_currentms_Value) + rtb_Gain_m2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_l, A380PitchNzLaw_rtP.uDLookupTable_tableData_a, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_o * rtb_Max_d) + A380PitchNzLaw_rtP.Bias_Bias_i) * ((rtb_Objectiveattenuation +
    look1_binlxpw(rtb_Saturation_ix, A380PitchNzLaw_rtP.Loaddemand1_bp01Data, A380PitchNzLaw_rtP.Loaddemand1_tableData,
                  2U)) - rtb_Objectiveattenuation);
  rtb_Gain_dj = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Gain_c = rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data,
    A380PitchNzLaw_rtP.DLUT_tableData, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Gain_ha = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Gain_ha - A380PitchNzLaw_DWork.Delay_DSTATE_c) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Y_g, &A380PitchNzLaw_DWork.sf_LagFilter_k);
  if (rtb_Y_g > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Y_g = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Y_g < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Y_g = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat;
  }

  rtb_Sum1 = (((rtb_Gain_dj - A380PitchNzLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt * A380PitchNzLaw_rtP.Gain3_Gain_l +
               rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.PLUT_bp01Data,
    A380PitchNzLaw_rtP.PLUT_tableData, 1U)) + (rtb_Gain_c - A380PitchNzLaw_DWork.Delay_DSTATE_n) / *rtu_In_time_dt) +
    A380PitchNzLaw_rtP.Gain_Gain_l * rtb_Y_g;
  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1, rtu_In_time_dt, &rtb_Y_g, &A380PitchNzLaw_DWork.sf_WashoutFilter_k);
  if (rtb_Y_g > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat) {
    y = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Y_g < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat) {
    y = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat;
  } else {
    y = rtb_Y_g;
  }

  rtb_Gain_dv = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_i * *rtu_In_qk_deg_s;
  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_a) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_UpperSat_a;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_l) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_LowerSat_l;
  } else {
    rtb_Max_d = *rtu_In_V_tas_kn;
  }

  rtb_Saturation_ix = (A380PitchNzLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_a *
    A380PitchNzLaw_rtP.Vm_currentms_Value_e) + rtb_Gain_m2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_o, A380PitchNzLaw_rtP.uDLookupTable_tableData_e, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_d * rtb_Max_d) + A380PitchNzLaw_rtP.Bias_Bias_a) * (rtb_Y_ht -
    rtb_Objectiveattenuation);
  rtb_Gain_g = rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_h,
    A380PitchNzLaw_rtP.DLUT_tableData_p, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_j;
  rtb_Gain_gm = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_e * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Gain_gm - A380PitchNzLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Y_g, &A380PitchNzLaw_DWork.sf_LagFilter_g3);
  if (rtb_Y_g > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j) {
    rtb_Y_g = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j;
  } else if (rtb_Y_g < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Y_g = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_e;
  }

  rtb_Sum1_mw = (((rtb_Gain_dv - A380PitchNzLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt *
                  A380PitchNzLaw_rtP.Gain3_Gain_m + rtb_Saturation_ix * look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.PLUT_bp01Data_b, A380PitchNzLaw_rtP.PLUT_tableData_b, 1U)) + (rtb_Gain_g -
    A380PitchNzLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt) + A380PitchNzLaw_rtP.Gain_Gain_j * rtb_Y_g;
  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_n, rtu_In_time_dt, &rtb_Y_g, &A380PitchNzLaw_DWork.sf_WashoutFilter_c);
  if (rtb_Y_g > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_g) {
    y_0 = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_g;
  } else if (rtb_Y_g < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_j) {
    y_0 = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_j;
  } else {
    y_0 = rtb_Y_g;
  }

  A380PitchNzLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNzLaw_rtP.RateLimiterVariableTs2_up_m,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_lo_k, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_Y_l, &A380PitchNzLaw_DWork.sf_RateLimiter_nx);
  rtb_y_dm = (*rtu_In_alpha_max - *rtu_In_alpha_prot) * rtb_Y_l;
  A380PitchNzLaw_LagFilter_m(rtu_In_alpha_deg, A380PitchNzLaw_rtP.LagFilter1_C1, rtu_In_time_dt, &rtb_Y_g,
    &A380PitchNzLaw_DWork.sf_LagFilter_m);
  A380PitchNzLaw_WashoutFilter(std::fmax(std::fmax(0.0, *rtu_In_Theta_deg - 22.5), std::fmax(0.0, (std::abs
    (*rtu_In_Phi_deg) - 3.0) / 6.0)), A380PitchNzLaw_rtP.WashoutFilter_C1_b, rtu_In_time_dt, &rtb_Y_l,
    &A380PitchNzLaw_DWork.sf_WashoutFilter_h);
  rtb_Saturation_ix = (rtb_y_dm - (rtb_Y_g - *rtu_In_alpha_prot)) - rtb_Y_l;
  rtb_y_dm = A380PitchNzLaw_rtP.Subsystem1_Gain * rtb_Saturation_ix;
  rtb_Divide_dr = (rtb_y_dm - A380PitchNzLaw_DWork.Delay_DSTATE_f) / *rtu_In_time_dt;
  rtb_Tsxlo = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem1_C1;
  rtb_Max_d = rtb_Tsxlo + A380PitchNzLaw_rtP.Constant_Value_f;
  A380PitchNzLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Max_d * (A380PitchNzLaw_rtP.Constant_Value_f - rtb_Tsxlo) *
    A380PitchNzLaw_DWork.Delay1_DSTATE + (rtb_Divide_dr + A380PitchNzLaw_DWork.Delay_DSTATE_g) * (rtb_Tsxlo / rtb_Max_d);
  rtb_alpha_err_gain = A380PitchNzLaw_rtP.alpha_err_gain_Gain * rtb_Saturation_ix;
  rtb_Tsxlo = A380PitchNzLaw_rtP.Subsystem3_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_c = (rtb_Tsxlo - A380PitchNzLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Max_d = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem3_C1;
  rtb_Saturation_ix = rtb_Max_d + A380PitchNzLaw_rtP.Constant_Value_bb;
  A380PitchNzLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_Saturation_ix * (A380PitchNzLaw_rtP.Constant_Value_bb - rtb_Max_d) *
    A380PitchNzLaw_DWork.Delay1_DSTATE_i + (rtb_Divide_c + A380PitchNzLaw_DWork.Delay_DSTATE_ca) * (rtb_Max_d /
    rtb_Saturation_ix);
  A380PitchNzLaw_DWork.Delay_DSTATE_e += std::fmax(std::fmin(static_cast<real_T>((*rtu_In_high_aoa_prot_active) &&
    (*rtu_In_protections_available)) - A380PitchNzLaw_DWork.Delay_DSTATE_e,
    A380PitchNzLaw_rtP.RateLimiterVariableTs5_up_c * *rtu_In_time_dt), *rtu_In_time_dt *
    A380PitchNzLaw_rtP.RateLimiterVariableTs5_lo_p);
  if (A380PitchNzLaw_DWork.Delay_DSTATE_e > A380PitchNzLaw_rtP.Saturation_UpperSat_eo) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_UpperSat_eo;
  } else if (A380PitchNzLaw_DWork.Delay_DSTATE_e < A380PitchNzLaw_rtP.Saturation_LowerSat_h) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Sum_ma = A380PitchNzLaw_DWork.Delay_DSTATE_e;
  }

  rtb_Saturation_ix = (((A380PitchNzLaw_rtP.precontrol_gain_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE +
    rtb_alpha_err_gain) + A380PitchNzLaw_rtP.v_dot_gain_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE_i) +
                       A380PitchNzLaw_rtP.qk_gain_Gain * *rtu_In_qk_deg_s) + A380PitchNzLaw_rtP.qk_dot_gain_Gain *
    *rtu_In_qk_dot_deg_s2;
  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation3_UpperSat_f) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation3_UpperSat_f;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation3_LowerSat_c) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation3_LowerSat_c;
  }

  rtb_Product_fu = rtb_Saturation_ix * rtb_Sum_ma;
  rtb_Sum1_c = A380PitchNzLaw_rtP.Constant_Value_fe - rtb_Sum_ma;
  rtb_alpha_err_gain = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  A380PitchNzLaw_RateLimiter_h(rtu_In_ap_theta_c_deg, A380PitchNzLaw_rtP.RateLimiterVariableTs1_up_d,
    A380PitchNzLaw_rtP.RateLimiterVariableTs1_lo_g, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs1_InitialCondition_l, &rtb_Y_ht, &A380PitchNzLaw_DWork.sf_RateLimiter_d);
  A380PitchNzLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNzLaw_rtP.RateLimiterVariableTs_up_n,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_lo_c, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_g, &A380PitchNzLaw_DWork.sf_RateLimiter_c2);
  A380PitchNzLaw_DWork.Delay_DSTATE_b += std::fmax(std::fmin(*rtu_In_delta_eta_pos - A380PitchNzLaw_DWork.Delay_DSTATE_b,
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_up_i * *rtu_In_time_dt), *rtu_In_time_dt *
    A380PitchNzLaw_rtP.RateLimiterVariableTs3_lo_b);
  rtb_v_target = std::fmax((*rtu_In_high_speed_prot_low_kn - *rtu_In_high_speed_prot_high_kn) *
    A380PitchNzLaw_DWork.Delay_DSTATE_b, 0.0) + *rtu_In_high_speed_prot_low_kn;
  rtb_Gain_e = A380PitchNzLaw_rtP.Subsystem2_Gain * rtb_v_target;
  rtb_Divide_bu = (rtb_Gain_e - A380PitchNzLaw_DWork.Delay_DSTATE_ku) / *rtu_In_time_dt;
  rtb_Sum_ma = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem2_C1;
  rtb_Max_d = rtb_Sum_ma + A380PitchNzLaw_rtP.Constant_Value_ja;
  A380PitchNzLaw_DWork.Delay1_DSTATE_l = 1.0 / rtb_Max_d * (A380PitchNzLaw_rtP.Constant_Value_ja - rtb_Sum_ma) *
    A380PitchNzLaw_DWork.Delay1_DSTATE_l + (rtb_Divide_bu + A380PitchNzLaw_DWork.Delay_DSTATE_gl) * (rtb_Sum_ma /
    rtb_Max_d);
  rtb_Gain_i4 = A380PitchNzLaw_rtP.Subsystem_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_n0 = (rtb_Gain_i4 - A380PitchNzLaw_DWork.Delay_DSTATE_m) / *rtu_In_time_dt;
  rtb_Sum_ma = *rtu_In_time_dt * A380PitchNzLaw_rtP.Subsystem_C1;
  rtb_Max_d = rtb_Sum_ma + A380PitchNzLaw_rtP.Constant_Value_jj;
  A380PitchNzLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Max_d * (A380PitchNzLaw_rtP.Constant_Value_jj - rtb_Sum_ma) *
    A380PitchNzLaw_DWork.Delay1_DSTATE_n + (rtb_Divide_n0 + A380PitchNzLaw_DWork.Delay_DSTATE_k2) * (rtb_Sum_ma /
    rtb_Max_d);
  rtb_y_k = ((*rtu_In_high_speed_prot_active) && (*rtu_In_protections_available));
  A380PitchNzLaw_DWork.Delay_DSTATE_mz += std::fmax(std::fmin(static_cast<real_T>(rtb_y_k) -
    A380PitchNzLaw_DWork.Delay_DSTATE_mz, A380PitchNzLaw_rtP.RateLimiterVariableTs4_up_b * *rtu_In_time_dt),
    *rtu_In_time_dt * A380PitchNzLaw_rtP.RateLimiterVariableTs4_lo_o);
  if (*rtu_In_any_ap_engaged) {
    rtb_Sum_ma = (rtb_Y_ht - *rtu_In_Theta_deg) * look1_binlxpw(*rtu_In_V_tas_kn,
      A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_h, A380PitchNzLaw_rtP.ScheduledGain_Table_j, 6U);
  } else {
    rtb_Y_ht = look1_binlxpw(rtb_Y_g, A380PitchNzLaw_rtP.Loaddemand_bp01Data, A380PitchNzLaw_rtP.Loaddemand_tableData,
      2U);
    if (*rtu_In_protections_available) {
      rtb_Y_g = A380PitchNzLaw_rtP.Constant3_Value_m;
    } else {
      rtb_Saturation_ix = (look1_binlxpw(*rtu_In_flaps_handle_index, A380PitchNzLaw_rtP.uDLookupTable_bp01Data,
        A380PitchNzLaw_rtP.uDLookupTable_tableData, 5U) - *rtu_In_V_ias_kn) * A380PitchNzLaw_rtP.Gain4_Gain;
      rtb_Max_d = (A380PitchNzLaw_rtP.Constant5_Value - *rtu_In_V_ias_kn) * A380PitchNzLaw_rtP.Gain5_Gain;
      if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation_UpperSat) {
        rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_UpperSat;
      } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation_LowerSat) {
        rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_LowerSat;
      }

      if (rtb_Max_d > A380PitchNzLaw_rtP.Saturation5_UpperSat) {
        rtb_Max_d = A380PitchNzLaw_rtP.Saturation5_UpperSat;
      } else if (rtb_Max_d < A380PitchNzLaw_rtP.Saturation5_LowerSat) {
        rtb_Max_d = A380PitchNzLaw_rtP.Saturation5_LowerSat;
      }

      rtb_Y_g = rtb_Saturation_ix + rtb_Max_d;
    }

    if (A380PitchNzLaw_DWork.Delay_DSTATE_mz > A380PitchNzLaw_rtP.Saturation_UpperSat_e) {
      rtb_Saturation_an = A380PitchNzLaw_rtP.Saturation_UpperSat_e;
    } else if (A380PitchNzLaw_DWork.Delay_DSTATE_mz < A380PitchNzLaw_rtP.Saturation_LowerSat_m) {
      rtb_Saturation_an = A380PitchNzLaw_rtP.Saturation_LowerSat_m;
    } else {
      rtb_Saturation_an = A380PitchNzLaw_DWork.Delay_DSTATE_mz;
    }

    if (static_cast<real_T>(rtb_y_k) > A380PitchNzLaw_rtP.Switch2_Threshold) {
      rtb_Saturation_ix = (((((rtb_v_target - *rtu_In_V_ias_kn) * A380PitchNzLaw_rtP.Gain6_Gain +
        A380PitchNzLaw_rtP.precontrol_gain_HSP_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE_l) +
        A380PitchNzLaw_rtP.v_dot_gain_HSP_Gain * A380PitchNzLaw_DWork.Delay1_DSTATE_n) +
                            A380PitchNzLaw_rtP.qk_gain_HSP_Gain * *rtu_In_qk_deg_s) +
                           A380PitchNzLaw_rtP.qk_dot_gain1_Gain * *rtu_In_qk_dot_deg_s2) *
        A380PitchNzLaw_rtP.HSP_gain_Gain;
      if (rtb_Y_ht > A380PitchNzLaw_rtP.Saturation8_UpperSat) {
        rtb_Max_d = A380PitchNzLaw_rtP.Saturation8_UpperSat;
      } else if (rtb_Y_ht < A380PitchNzLaw_rtP.Saturation8_LowerSat) {
        rtb_Max_d = A380PitchNzLaw_rtP.Saturation8_LowerSat;
      } else {
        rtb_Max_d = rtb_Y_ht;
      }

      if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation4_UpperSat) {
        rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation4_UpperSat;
      } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation4_LowerSat) {
        rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation4_LowerSat;
      }

      rtb_v_target = rtb_Max_d + rtb_Saturation_ix;
    } else {
      rtb_v_target = A380PitchNzLaw_rtP.Constant1_Value_g;
    }

    rtb_Sum_ma = ((A380PitchNzLaw_rtP.Constant_Value_m - rtb_Saturation_an) * rtb_Y_ht + rtb_v_target *
                  rtb_Saturation_an) + rtb_Y_g;
  }

  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_b) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_UpperSat_b;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_e) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_LowerSat_e;
  } else {
    rtb_Max_d = *rtu_In_V_tas_kn;
  }

  if (*rtu_In_Phi_deg > A380PitchNzLaw_rtP.Saturation_UpperSat_f) {
    rtb_Y_ht = A380PitchNzLaw_rtP.Saturation_UpperSat_f;
  } else if (*rtu_In_Phi_deg < A380PitchNzLaw_rtP.Saturation_LowerSat_o1) {
    rtb_Y_ht = A380PitchNzLaw_rtP.Saturation_LowerSat_o1;
  } else {
    rtb_Y_ht = *rtu_In_Phi_deg;
  }

  rtb_Sum_ma = (A380PitchNzLaw_rtP.Gain1_Gain_en * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_b *
    A380PitchNzLaw_rtP.Vm_currentms_Value_h) + rtb_Gain_m2) - ((rtb_Minup / std::cos(A380PitchNzLaw_rtP.Gain1_Gain_lm *
    rtb_Y_ht) + rtb_Sum_ma) - rtb_Objectiveattenuation) * (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_b, A380PitchNzLaw_rtP.uDLookupTable_tableData_h, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_e * rtb_Max_d) + A380PitchNzLaw_rtP.Bias_Bias_f);
  rtb_Minup = rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_m,
    A380PitchNzLaw_rtP.DLUT_tableData_a, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_Y_ht = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Y_ht - A380PitchNzLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_pt, rtu_In_time_dt, &rtb_Y_l, &A380PitchNzLaw_DWork.sf_LagFilter_i);
  if (rtb_Y_l > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_b) {
    y_1 = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Y_l < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_m) {
    y_1 = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_m;
  } else {
    y_1 = rtb_Y_l;
  }

  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt, &rtb_Y_l, &A380PitchNzLaw_DWork.sf_WashoutFilter_l);
  if (rtb_Y_l > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_o) {
    rtb_Y_l = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Y_l < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_jl) {
    rtb_Y_l = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_jl;
  }

  rtb_Saturation_ix = ((((rtb_alpha_err_gain - A380PitchNzLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt *
    A380PitchNzLaw_rtP.Gain3_Gain_c + rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.PLUT_bp01Data_f,
    A380PitchNzLaw_rtP.PLUT_tableData_k, 1U)) + (rtb_Minup - A380PitchNzLaw_DWork.Delay_DSTATE_jh) / *rtu_In_time_dt) +
                       A380PitchNzLaw_rtP.Gain_Gain_f * y_1) + rtb_Y_l * look1_binlxpw(*rtu_In_H_radio_ft,
    A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_c, A380PitchNzLaw_rtP.ScheduledGain_Table_g, 3U);
  rtb_Y_g = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_n) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_UpperSat_n;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_a) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_LowerSat_a;
  } else {
    rtb_Max_d = *rtu_In_V_tas_kn;
  }

  rtb_Sum_ma = (A380PitchNzLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_p *
    A380PitchNzLaw_rtP.Vm_currentms_Value_p) + rtb_Gain_m2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_a, A380PitchNzLaw_rtP.uDLookupTable_tableData_p, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_n * rtb_Max_d) + A380PitchNzLaw_rtP.Bias_Bias_ai) * (rtb_Y_a -
    rtb_Objectiveattenuation);
  rtb_v_target = rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_k,
    A380PitchNzLaw_rtP.DLUT_tableData_e, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Saturation_an = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Saturation_an - A380PitchNzLaw_DWork.Delay_DSTATE_lf) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_l, rtu_In_time_dt, &rtb_Y_l, &A380PitchNzLaw_DWork.sf_LagFilter_g);
  if (rtb_Y_l > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_m) {
    y_1 = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Y_l < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_ek) {
    y_1 = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_ek;
  } else {
    y_1 = rtb_Y_l;
  }

  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt, &rtb_Y_l, &A380PitchNzLaw_DWork.sf_WashoutFilter_d);
  rtb_Max_d = y_0 * look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_n,
    A380PitchNzLaw_rtP.ScheduledGain_Table_b, 3U) + rtb_Sum1_mw;
  if (rtb_Y_l > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Y_l = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Y_l < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Y_l = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Sum1_mw = ((((rtb_Y_g - A380PitchNzLaw_DWork.Delay_DSTATE_e5) / *rtu_In_time_dt * A380PitchNzLaw_rtP.Gain3_Gain_b
                   + rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.PLUT_bp01Data_a,
    A380PitchNzLaw_rtP.PLUT_tableData_o, 1U)) + (rtb_v_target - A380PitchNzLaw_DWork.Delay_DSTATE_gz) / *rtu_In_time_dt)
                 + A380PitchNzLaw_rtP.Gain_Gain_k * y_1) + rtb_Y_l * look1_binlxpw(*rtu_In_H_radio_ft,
    A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_f, A380PitchNzLaw_rtP.ScheduledGain_Table_h, 3U);
  if (rtb_Max_d > A380PitchNzLaw_rtP.Saturation_UpperSat_hc) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_UpperSat_hc;
  } else if (rtb_Max_d < A380PitchNzLaw_rtP.Saturation_LowerSat_a) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_LowerSat_a;
  }

  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation_UpperSat_k) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation_LowerSat_p) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_LowerSat_p;
  }

  if (rtb_Sum1_mw > A380PitchNzLaw_rtP.Saturation_UpperSat_j) {
    rtb_Sum1_mw = A380PitchNzLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Sum1_mw < A380PitchNzLaw_rtP.Saturation_LowerSat_d) {
    rtb_Sum1_mw = A380PitchNzLaw_rtP.Saturation_LowerSat_d;
  }

  A380PitchNzLaw_VoterAttitudeProtection(rtb_Max_d, rtb_Product_fu + rtb_Sum1_c * rtb_Saturation_ix, rtb_Sum1_mw,
    &rtb_Y_l);
  rtb_Sum1_mw = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs1_Gain_k * *rtu_In_qk_deg_s;
  rtb_Saturation_ix = A380PitchNzLaw_rtP.Gain3_Gain_g * A380PitchNzLaw_rtP.Theta_max3_Value - rtb_Y_kl;
  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation2_UpperSat) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation2_LowerSat) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation2_LowerSat;
  }

  if (*rtu_In_V_tas_kn > A380PitchNzLaw_rtP.Saturation3_UpperSat_e) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_UpperSat_e;
  } else if (*rtu_In_V_tas_kn < A380PitchNzLaw_rtP.Saturation3_LowerSat_k) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation3_LowerSat_k;
  } else {
    rtb_Max_d = *rtu_In_V_tas_kn;
  }

  rtb_Sum_ma = (A380PitchNzLaw_rtP.Gain1_Gain_lk * *rtu_In_qk_deg_s * (A380PitchNzLaw_rtP.Gain_Gain_jq *
    A380PitchNzLaw_rtP.Vm_currentms_Value_b) + rtb_Gain_m2) - (look1_binlxpw(*rtu_In_V_tas_kn,
    A380PitchNzLaw_rtP.uDLookupTable_bp01Data_m, A380PitchNzLaw_rtP.uDLookupTable_tableData_ax, 6U) /
    (A380PitchNzLaw_rtP.Gain5_Gain_m * rtb_Max_d) + A380PitchNzLaw_rtP.Bias_Bias_m) * ((rtb_Objectiveattenuation +
    look1_binlxpw(rtb_Saturation_ix, A380PitchNzLaw_rtP.Loaddemand2_bp01Data, A380PitchNzLaw_rtP.Loaddemand2_tableData,
                  2U)) - rtb_Objectiveattenuation);
  rtb_Gain_m2 = rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.DLUT_bp01Data_hw,
    A380PitchNzLaw_rtP.DLUT_tableData_l, 1U) * A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs_Gain_c;
  rtb_Product_fu = A380PitchNzLaw_rtP.DiscreteDerivativeVariableTs2_Gain_p * *rtu_In_V_tas_kn;
  A380PitchNzLaw_LagFilter((rtb_Product_fu - A380PitchNzLaw_DWork.Delay_DSTATE_jt) / *rtu_In_time_dt,
    A380PitchNzLaw_rtP.LagFilter_C1_f, rtu_In_time_dt, &rtb_Y_a, &A380PitchNzLaw_DWork.sf_LagFilter);
  if (rtb_Y_a > A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j2) {
    y_0 = A380PitchNzLaw_rtP.SaturationV_dot_UpperSat_j2;
  } else if (rtb_Y_a < A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_n) {
    y_0 = A380PitchNzLaw_rtP.SaturationV_dot_LowerSat_n;
  } else {
    y_0 = rtb_Y_a;
  }

  A380PitchNzLaw_WashoutFilter(std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos),
    A380PitchNzLaw_rtP.WashoutFilter_C1_j, rtu_In_time_dt, &rtb_Y_a, &A380PitchNzLaw_DWork.sf_WashoutFilter);
  rtb_Saturation_ix = y * look1_binlxpw(*rtu_In_H_radio_ft, A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    A380PitchNzLaw_rtP.ScheduledGain_Table, 3U) + rtb_Sum1;
  if (rtb_Y_a > A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_m) {
    rtb_Y_a = A380PitchNzLaw_rtP.SaturationSpoilers_UpperSat_m;
  } else if (rtb_Y_a < A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_d) {
    rtb_Y_a = A380PitchNzLaw_rtP.SaturationSpoilers_LowerSat_d;
  }

  rtb_Max_d = ((((rtb_Sum1_mw - A380PitchNzLaw_DWork.Delay_DSTATE_h) / *rtu_In_time_dt * A380PitchNzLaw_rtP.Gain3_Gain_n
                 + rtb_Sum_ma * look1_binlxpw(*rtu_In_V_tas_kn, A380PitchNzLaw_rtP.PLUT_bp01Data_e,
    A380PitchNzLaw_rtP.PLUT_tableData_g, 1U)) + (rtb_Gain_m2 - A380PitchNzLaw_DWork.Delay_DSTATE_ds) / *rtu_In_time_dt)
               + A380PitchNzLaw_rtP.Gain_Gain_l0 * y_0) + rtb_Y_a * look1_binlxpw(*rtu_In_H_radio_ft,
    A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_b, A380PitchNzLaw_rtP.ScheduledGain_Table_e, 3U);
  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation_UpperSat_h) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation_LowerSat_o) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_LowerSat_o;
  }

  if (rtb_Max_d > A380PitchNzLaw_rtP.Saturation_UpperSat_a) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Max_d < A380PitchNzLaw_rtP.Saturation_LowerSat_k) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_LowerSat_k;
  }

  A380PitchNzLaw_VoterAttitudeProtection(rtb_Saturation_ix, rtb_Y_l, rtb_Max_d, &rtb_Y_a);
  if (*rtu_In_protections_available) {
    rtb_Y_l = rtb_Y_a;
  }

  rtb_Sum_ma = rtb_Y_l * look1_binlxpw(*rtu_In_V_ias_kn, A380PitchNzLaw_rtP.ScheduledGain1_BreakpointsForDimension1,
    A380PitchNzLaw_rtP.ScheduledGain1_Table, 4U) * look1_binlxpw(*rtu_In_time_dt,
    A380PitchNzLaw_rtP.ScheduledGain_BreakpointsForDimension1_d, A380PitchNzLaw_rtP.ScheduledGain_Table_hh, 5U) *
    A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  A380PitchNzLaw_DWork.icLoad = ((rtb_Y_n == A380PitchNzLaw_rtP.CompareToConstant1_const_m) || (rtb_Y_h ==
    A380PitchNzLaw_rtP.CompareToConstant_const_b) || (*rtu_In_tracking_mode_on) || A380PitchNzLaw_DWork.icLoad);
  if (A380PitchNzLaw_DWork.icLoad) {
    A380PitchNzLaw_DWork.Delay_DSTATE_o = *rtu_In_eta_deg - rtb_Sum_ma;
  }

  A380PitchNzLaw_DWork.Delay_DSTATE_o += rtb_Sum_ma;
  if (A380PitchNzLaw_DWork.Delay_DSTATE_o > A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380PitchNzLaw_DWork.Delay_DSTATE_o = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380PitchNzLaw_DWork.Delay_DSTATE_o < A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380PitchNzLaw_DWork.Delay_DSTATE_o = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_OR1 == A380PitchNzLaw_rtP.CompareToConstant_const_d) {
    rtb_Max_d = A380PitchNzLaw_rtP.Constant_Value_b;
  } else {
    rtb_Max_d = A380PitchNzLaw_DWork.Delay_DSTATE_o;
  }

  rtb_Y_kl = A380PitchNzLaw_rtP.Gain_Gain_cy * rtb_Max_d;
  if (rtb_Y_kl > rtb_eta_trim_deg_rate_limit_up_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_up_deg_s;
  } else if (rtb_Y_kl < rtb_eta_trim_deg_rate_limit_lo_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_lo_deg_s;
  } else {
    *rty_Out_eta_trim_dot_deg_s = rtb_Y_kl;
  }

  if (rtb_Y_n > A380PitchNzLaw_rtP.Saturation_UpperSat_la) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_UpperSat_la;
  } else if (rtb_Y_n < A380PitchNzLaw_rtP.Saturation_LowerSat_kp) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_LowerSat_kp;
  } else {
    rtb_Sum_ma = rtb_Y_n;
  }

  A380PitchNzLaw_MATLABFunction_c(rtu_In_on_ground, rtu_In_time_dt, A380PitchNzLaw_rtP.ConfirmNode2_isRisingEdge_m,
    A380PitchNzLaw_rtP.ConfirmNode2_timeDelay_i, &rtb_y_k, &A380PitchNzLaw_DWork.sf_MATLABFunction_h);
  A380PitchNzLaw_LagFilter_m(rtu_In_H_radio_ft, A380PitchNzLaw_rtP.LagFilter2_C1, rtu_In_time_dt, &rtb_Y_n,
    &A380PitchNzLaw_DWork.sf_LagFilter_l);
  if (*rtu_In_H_radio_ft > A380PitchNzLaw_rtP.Saturation1_UpperSat_p) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation1_UpperSat_p;
  } else if (*rtu_In_H_radio_ft < A380PitchNzLaw_rtP.Saturation1_LowerSat_d) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation1_LowerSat_d;
  } else {
    rtb_Max_d = *rtu_In_H_radio_ft;
  }

  A380PitchNzLaw_LagFilter(rtb_Max_d, A380PitchNzLaw_rtP.LagFilter1_C1_d, rtu_In_time_dt, &rtb_Y_kl,
    &A380PitchNzLaw_DWork.sf_LagFilter_b);
  A380PitchNzLaw_LagFilter_m(rtu_In_V_ias_kn, A380PitchNzLaw_rtP.LagFilter_C1_n, rtu_In_time_dt, &rtb_Y_a,
    &A380PitchNzLaw_DWork.sf_LagFilter_g5);
  if (rtb_Y_a <= A380PitchNzLaw_rtP.CompareToConstant_const_a) {
    A380PitchNzLaw_B.u = rtb_Y_kl;
  }

  rtb_Max_d = A380PitchNzLaw_rtP.Gain1_Gain_a * *rtu_In_Theta_deg;
  rtb_Y_a = A380PitchNzLaw_rtP.Gain_Gain_i * std::cos(rtb_Max_d) - A380PitchNzLaw_rtP.Gain1_Gain_g * std::sin(rtb_Max_d);
  if (rtb_Y_n > A380PitchNzLaw_rtP.Constant2_Value_a) {
    rtb_Max_d = A380PitchNzLaw_rtP.Constant2_Value_a;
  } else {
    if (A380PitchNzLaw_B.u > A380PitchNzLaw_rtP.Saturation_UpperSat_lg) {
      rtb_Max_d = A380PitchNzLaw_rtP.Saturation_UpperSat_lg;
    } else if (A380PitchNzLaw_B.u < A380PitchNzLaw_rtP.Saturation_LowerSat_m0) {
      rtb_Max_d = A380PitchNzLaw_rtP.Saturation_LowerSat_m0;
    } else {
      rtb_Max_d = A380PitchNzLaw_B.u;
    }

    rtb_Max_d = std::fmax((rtb_Y_a + A380PitchNzLaw_rtP.Bias_Bias) * A380PitchNzLaw_rtP.Gain2_Gain_g + rtb_Max_d,
                          A380PitchNzLaw_rtP.Constant1_Value_b);
    if (rtb_Y_n >= rtb_Max_d) {
      rtb_Max_d = rtb_Y_n;
    }
  }

  rtb_Saturation_ix = A380PitchNzLaw_rtP.Gain1_Gain_d * *rtu_In_Theta_deg;
  rtb_eta_trim_deg_rate_limit_up_deg_s = (A380PitchNzLaw_rtP.Gain_Gain_i4 * std::cos(rtb_Saturation_ix) -
    A380PitchNzLaw_rtP.Gain1_Gain_k * std::sin(rtb_Saturation_ix)) + A380PitchNzLaw_rtP.Bias_Bias_am;
  rtb_Y_n = rtb_Max_d + rtb_eta_trim_deg_rate_limit_up_deg_s;
  A380PitchNzLaw_WashoutFilter(rtb_Y_n, A380PitchNzLaw_rtP.WashoutFilter_C1_nt, rtu_In_time_dt,
    &rtb_eta_trim_deg_rate_limit_lo_deg_s, &A380PitchNzLaw_DWork.sf_WashoutFilter_ow);
  A380PitchNzLaw_WashoutFilter(A380PitchNzLaw_rtP.Gain3_Gain_o * (rtb_Y_a + A380PitchNzLaw_rtP.Bias1_Bias_d),
    A380PitchNzLaw_rtP.WashoutFilter_C1_j5, rtu_In_time_dt, &rtb_Y_kl, &A380PitchNzLaw_DWork.sf_WashoutFilter_o);
  rtb_Saturation_ix = A380PitchNzLaw_rtP.Gain4_Gain_k * rtb_Y_kl;
  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation2_UpperSat_k) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation2_UpperSat_k;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation2_LowerSat_b) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation2_LowerSat_b;
  }

  rtb_Objectiveattenuation = rtb_Saturation_ix + A380PitchNzLaw_rtP.Bias2_Bias;
  A380PitchNzLaw_WashoutFilter(rtb_eta_trim_deg_rate_limit_up_deg_s, A380PitchNzLaw_rtP.WashoutFilter1_C1,
    rtu_In_time_dt, &rtb_Y_kl, &A380PitchNzLaw_DWork.sf_WashoutFilter_m);
  if (rtb_y_k) {
    rtb_Y_a = A380PitchNzLaw_rtP.Gain4_Gain_h * rtb_eta_trim_deg_rate_limit_lo_deg_s;
    if (rtb_Y_a > A380PitchNzLaw_rtP.Constant_Value_o) {
      rtb_Y_a = A380PitchNzLaw_rtP.Constant_Value_o;
    } else {
      rtb_Y_kl = A380PitchNzLaw_rtP.Gain2_Gain_f * rtb_Y_kl + rtb_Objectiveattenuation;
      if (rtb_Y_a < rtb_Y_kl) {
        rtb_Y_a = rtb_Y_kl;
      }
    }

    if (rtb_Y_n > A380PitchNzLaw_rtP.Saturation_UpperSat_n) {
      rtb_Y_n = A380PitchNzLaw_rtP.Saturation_UpperSat_n;
    } else if (rtb_Y_n < A380PitchNzLaw_rtP.Saturation_LowerSat_f) {
      rtb_Y_n = A380PitchNzLaw_rtP.Saturation_LowerSat_f;
    }

    rtb_Y_n = ((rtb_Y_n + rtb_Y_a) + A380PitchNzLaw_rtP.Bias1_Bias_n) * A380PitchNzLaw_rtP.Gain5_Gain_c;
    if (rtb_Y_n > A380PitchNzLaw_rtP.Saturation1_UpperSat_f) {
      rtb_Y_n = A380PitchNzLaw_rtP.Saturation1_UpperSat_f;
    } else if (rtb_Y_n < A380PitchNzLaw_rtP.Saturation1_LowerSat_b) {
      rtb_Y_n = A380PitchNzLaw_rtP.Saturation1_LowerSat_b;
    }
  } else {
    rtb_Y_n = A380PitchNzLaw_rtP.Constant2_Value_gc;
  }

  A380PitchNzLaw_RateLimiter_n(rtb_Y_n, A380PitchNzLaw_rtP.RateLimiterGenericVariableTs_up,
    A380PitchNzLaw_rtP.RateLimiterGenericVariableTs_lo, rtu_In_time_dt, rtb_y_k, &rtb_Y_kl,
    &A380PitchNzLaw_DWork.sf_RateLimiter_m);
  A380PitchNzLaw_MATLABFunction_c(rtu_In_on_ground, rtu_In_time_dt, A380PitchNzLaw_rtP.ConfirmNode2_isRisingEdge_e,
    A380PitchNzLaw_rtP.ConfirmNode2_timeDelay_h, &rtb_y_k, &A380PitchNzLaw_DWork.sf_MATLABFunction_c);
  rtb_Saturation_ix = A380PitchNzLaw_rtP.Gain1_Gain_a4 * *rtu_In_Theta_deg;
  rtb_eta_trim_deg_rate_limit_lo_deg_s = (A380PitchNzLaw_rtP.Gain_Gain_jr * std::cos(rtb_Saturation_ix) -
    A380PitchNzLaw_rtP.Gain1_Gain_kc * std::sin(rtb_Saturation_ix)) + A380PitchNzLaw_rtP.Bias_Bias_b;
  rtb_eta_trim_deg_rate_limit_up_deg_s = rtb_Max_d + rtb_eta_trim_deg_rate_limit_lo_deg_s;
  A380PitchNzLaw_WashoutFilter(rtb_eta_trim_deg_rate_limit_up_deg_s, A380PitchNzLaw_rtP.WashoutFilter_C1_hq,
    rtu_In_time_dt, &rtb_Y_a, &A380PitchNzLaw_DWork.sf_WashoutFilter_f);
  A380PitchNzLaw_WashoutFilter(rtb_eta_trim_deg_rate_limit_lo_deg_s, A380PitchNzLaw_rtP.WashoutFilter1_C1_n,
    rtu_In_time_dt, &rtb_Y_n, &A380PitchNzLaw_DWork.sf_WashoutFilter_i);
  if (rtb_y_k) {
    rtb_Y_a *= A380PitchNzLaw_rtP.Gain4_Gain_o;
    if (rtb_Y_a > A380PitchNzLaw_rtP.Constant_Value_a) {
      rtb_Y_a = A380PitchNzLaw_rtP.Constant_Value_a;
    } else {
      rtb_Y_n = A380PitchNzLaw_rtP.Gain2_Gain * rtb_Y_n + rtb_Objectiveattenuation;
      if (rtb_Y_a < rtb_Y_n) {
        rtb_Y_a = rtb_Y_n;
      }
    }

    if (rtb_eta_trim_deg_rate_limit_up_deg_s > A380PitchNzLaw_rtP.Saturation_UpperSat_l) {
      rtb_eta_trim_deg_rate_limit_up_deg_s = A380PitchNzLaw_rtP.Saturation_UpperSat_l;
    } else if (rtb_eta_trim_deg_rate_limit_up_deg_s < A380PitchNzLaw_rtP.Saturation_LowerSat_i) {
      rtb_eta_trim_deg_rate_limit_up_deg_s = A380PitchNzLaw_rtP.Saturation_LowerSat_i;
    }

    rtb_Y_n = ((rtb_eta_trim_deg_rate_limit_up_deg_s + rtb_Y_a) + A380PitchNzLaw_rtP.Bias1_Bias) *
      A380PitchNzLaw_rtP.Gain3_Gain;
    if (rtb_Y_n > A380PitchNzLaw_rtP.Saturation1_UpperSat) {
      rtb_Y_n = A380PitchNzLaw_rtP.Saturation1_UpperSat;
    } else if (rtb_Y_n < A380PitchNzLaw_rtP.Saturation1_LowerSat) {
      rtb_Y_n = A380PitchNzLaw_rtP.Saturation1_LowerSat;
    }
  } else {
    rtb_Y_n = A380PitchNzLaw_rtP.Constant2_Value_g;
  }

  A380PitchNzLaw_RateLimiter_n(rtb_Y_n, A380PitchNzLaw_rtP.RateLimiterGenericVariableTs_up_j,
    A380PitchNzLaw_rtP.RateLimiterGenericVariableTs_lo_j, rtu_In_time_dt, rtb_y_k, &rtb_Y_l,
    &A380PitchNzLaw_DWork.sf_RateLimiter_n5);
  rtb_Y_n = std::fmax(rtb_Y_kl, rtb_Y_l);
  A380PitchNzLaw_MATLABFunction(rtb_OR4, rtu_In_time_dt, A380PitchNzLaw_rtP.ConfirmNode1_isRisingEdge_c,
    A380PitchNzLaw_rtP.ConfirmNode1_timeDelay_p, &rtb_y_k, &A380PitchNzLaw_DWork.sf_MATLABFunction_e);
  A380PitchNzLaw_DWork.Delay_DSTATE_j5 += std::fmax(std::fmin(static_cast<real_T>(rtb_y_k) -
    A380PitchNzLaw_DWork.Delay_DSTATE_j5, A380PitchNzLaw_rtP.RateLimiterVariableTs5_up_d * *rtu_In_time_dt),
    *rtu_In_time_dt * A380PitchNzLaw_rtP.RateLimiterVariableTs5_lo_d);
  if (A380PitchNzLaw_DWork.Delay_DSTATE_j5 > A380PitchNzLaw_rtP.Saturation_UpperSat_i) {
    rtb_Objectiveattenuation = A380PitchNzLaw_rtP.Saturation_UpperSat_i;
  } else if (A380PitchNzLaw_DWork.Delay_DSTATE_j5 < A380PitchNzLaw_rtP.Saturation_LowerSat_pu) {
    rtb_Objectiveattenuation = A380PitchNzLaw_rtP.Saturation_LowerSat_pu;
  } else {
    rtb_Objectiveattenuation = A380PitchNzLaw_DWork.Delay_DSTATE_j5;
  }

  rtb_Y_kl = (A380PitchNzLaw_rtP.Constant_Value_by - rtb_Objectiveattenuation) * *rtu_In_Theta_deg + *rtu_In_alpha_deg *
    rtb_Objectiveattenuation;
  if (A380PitchNzLaw_DWork.Delay_DSTATE_j5 > A380PitchNzLaw_rtP.Saturation_UpperSat_kb) {
    rtb_Objectiveattenuation = A380PitchNzLaw_rtP.Saturation_UpperSat_kb;
  } else if (A380PitchNzLaw_DWork.Delay_DSTATE_j5 < A380PitchNzLaw_rtP.Saturation_LowerSat_e) {
    rtb_Objectiveattenuation = A380PitchNzLaw_rtP.Saturation_LowerSat_e;
  } else {
    rtb_Objectiveattenuation = A380PitchNzLaw_DWork.Delay_DSTATE_j5;
  }

  if (rtb_OR3 || (*rtu_In_tracking_mode_on)) {
    A380PitchNzLaw_DWork.Delay_DSTATE_kp = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  rtb_Saturation_ix = (A380PitchNzLaw_rtP.Constant_Value_p - rtb_Objectiveattenuation) *
    A380PitchNzLaw_rtP.Constant_Value_cq + *rtu_In_alpha_max * rtb_Objectiveattenuation;
  if (*rtu_In_qk_deg_s > A380PitchNzLaw_rtP.Measuredratebounds_UpperSat) {
    rtb_Max_d = A380PitchNzLaw_rtP.Measuredratebounds_UpperSat;
  } else if (*rtu_In_qk_deg_s < A380PitchNzLaw_rtP.Measuredratebounds_LowerSat) {
    rtb_Max_d = A380PitchNzLaw_rtP.Measuredratebounds_LowerSat;
  } else {
    rtb_Max_d = *rtu_In_qk_deg_s;
  }

  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation_UpperSat_n2) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_UpperSat_n2;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation_LowerSat_ae) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_LowerSat_ae;
  }

  A380PitchNzLaw_DWork.Delay_DSTATE_kp += (rtb_Max_d - look1_binlcpw(rtb_Y_kl / rtb_Saturation_ix,
    A380PitchNzLaw_rtP.Objectiveattenuation_bp01Data, A380PitchNzLaw_rtP.Objectiveattenuation_tableData, 1U) *
    look1_binlcpw(rtb_Gain, A380PitchNzLaw_rtP.Sticktopitchrate_bp01Data, A380PitchNzLaw_rtP.Sticktopitchrate_tableData,
                  4U)) * look1_binlcpw(*rtu_In_Theta_deg, A380PitchNzLaw_rtP.Pitchactivation_bp01Data,
    A380PitchNzLaw_rtP.Pitchactivation_tableData, 1U) * A380PitchNzLaw_rtP.Gain2_Gain_b *
    A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain_o * *rtu_In_time_dt;
  if (A380PitchNzLaw_DWork.Delay_DSTATE_kp > A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p) {
    A380PitchNzLaw_DWork.Delay_DSTATE_kp = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p;
  } else if (A380PitchNzLaw_DWork.Delay_DSTATE_kp < A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_c) {
    A380PitchNzLaw_DWork.Delay_DSTATE_kp = A380PitchNzLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_c;
  }

  rtb_Max_d = look1_binlcpw(rtb_Gain, A380PitchNzLaw_rtP.Largestickbypass_bp01Data,
    A380PitchNzLaw_rtP.Largestickbypass_tableData, 3U);
  A380PitchNzLaw_LagFilter(rtb_Gain, A380PitchNzLaw_rtP.LagFilter_C1_g, rtu_In_time_dt, &rtb_Y_kl,
    &A380PitchNzLaw_DWork.sf_LagFilter_h);
  rtb_Gain = (std::fmax(std::fmin((A380PitchNzLaw_rtP.Gain1_Gain_aq * *rtu_In_qk_deg_s * rtb_Y_of + rtb_Y_n) +
    A380PitchNzLaw_DWork.Delay_DSTATE_kp, look1_binlcpw(rtb_Gain, A380PitchNzLaw_rtP.Upperfeedbackbound_bp01Data,
    A380PitchNzLaw_rtP.Upperfeedbackbound_tableData, 4U)), look1_binlcpw(rtb_Gain,
    A380PitchNzLaw_rtP.Lowerfeedbackbound_bp01Data, A380PitchNzLaw_rtP.Lowerfeedbackbound_tableData, 2U)) * rtb_Y_a0 +
              look1_binlcpw((rtb_Y_kl + rtb_Gain) * A380PitchNzLaw_rtP.Gain_Gain_k0 * (A380PitchNzLaw_rtP.Gain1_Gain_i *
    rtb_Max_d + A380PitchNzLaw_rtP.Bias_Bias_j) + rtb_Max_d * rtb_Gain,
    A380PitchNzLaw_rtP.Sticktoelevatordegrees_bp01Data, A380PitchNzLaw_rtP.Sticktoelevatordegrees_tableData, 3U)) *
    (A380PitchNzLaw_rtP.Constant_Value_o1 - rtb_Sum_ma) + A380PitchNzLaw_DWork.Delay_DSTATE_o * rtb_Sum_ma;
  if (rtb_Y_h > A380PitchNzLaw_rtP.Saturation_UpperSat_p) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_UpperSat_p;
  } else if (rtb_Y_h < A380PitchNzLaw_rtP.Saturation_LowerSat_hs) {
    rtb_Sum_ma = A380PitchNzLaw_rtP.Saturation_LowerSat_hs;
  } else {
    rtb_Sum_ma = rtb_Y_h;
  }

  A380PitchNzLaw_RateLimiter_h(rtu_In_delta_eta_pos, A380PitchNzLaw_rtP.RateLimiterVariableTs_up_i,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_lo_f, rtu_In_time_dt,
    A380PitchNzLaw_rtP.RateLimiterVariableTs_InitialCondition_c, &rtb_Y_l, &A380PitchNzLaw_DWork.sf_RateLimiter_h);
  rtb_Saturation_ix = A380PitchNzLaw_rtP.Gain3_Gain_f * *rtu_In_gnd_splr_cmd_deg;
  rtb_Max_d = (*rtu_In_nz_g + A380PitchNzLaw_rtP.Bias_Bias_d) * A380PitchNzLaw_rtP.Gain2_Gain_n +
    A380PitchNzLaw_rtP.Gain1_Gain_h * *rtu_In_qk_deg_s;
  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation1_UpperSat_n) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation1_UpperSat_n;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation1_LowerSat_p) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation1_LowerSat_p;
  }

  if (rtb_Max_d > A380PitchNzLaw_rtP.Saturation_UpperSat_g) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_UpperSat_g;
  } else if (rtb_Max_d < A380PitchNzLaw_rtP.Saturation_LowerSat_kf) {
    rtb_Max_d = A380PitchNzLaw_rtP.Saturation_LowerSat_kf;
  }

  rtb_Saturation_ix = ((A380PitchNzLaw_rtP.Gain_Gain_m * rtb_Y_l + rtb_Max_d) + rtb_Saturation_ix) * rtb_Sum_ma +
    (A380PitchNzLaw_rtP.Constant_Value_fw - rtb_Sum_ma) * rtb_Gain;
  if (rtb_Saturation_ix > A380PitchNzLaw_rtP.Saturation_UpperSat_kp) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_UpperSat_kp;
  } else if (rtb_Saturation_ix < A380PitchNzLaw_rtP.Saturation_LowerSat_a4) {
    rtb_Saturation_ix = A380PitchNzLaw_rtP.Saturation_LowerSat_a4;
  }

  A380PitchNzLaw_RateLimiter(rtb_Saturation_ix, A380PitchNzLaw_rtP.RateLimitereta_up,
    A380PitchNzLaw_rtP.RateLimitereta_lo, rtu_In_time_dt, A380PitchNzLaw_rtP.RateLimitereta_InitialCondition,
    rty_Out_eta_deg, &A380PitchNzLaw_DWork.sf_RateLimiter_b);
  A380PitchNzLaw_DWork.Memory_PreviousInput = A380PitchNzLaw_DWork.DelayOneStep_DSTATE;
  A380PitchNzLaw_DWork.Delay_DSTATE = rtb_Gain_dj;
  A380PitchNzLaw_DWork.Delay_DSTATE_n = rtb_Gain_c;
  A380PitchNzLaw_DWork.Delay_DSTATE_c = rtb_Gain_ha;
  A380PitchNzLaw_DWork.Delay_DSTATE_l = rtb_Gain_dv;
  A380PitchNzLaw_DWork.Delay_DSTATE_k = rtb_Gain_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_d = rtb_Gain_gm;
  A380PitchNzLaw_DWork.Delay_DSTATE_f = rtb_y_dm;
  A380PitchNzLaw_DWork.Delay_DSTATE_g = rtb_Divide_dr;
  A380PitchNzLaw_DWork.Delay_DSTATE_j = rtb_Tsxlo;
  A380PitchNzLaw_DWork.Delay_DSTATE_ca = rtb_Divide_c;
  A380PitchNzLaw_DWork.Delay_DSTATE_kd = rtb_alpha_err_gain;
  A380PitchNzLaw_DWork.Delay_DSTATE_ku = rtb_Gain_e;
  A380PitchNzLaw_DWork.Delay_DSTATE_gl = rtb_Divide_bu;
  A380PitchNzLaw_DWork.Delay_DSTATE_m = rtb_Gain_i4;
  A380PitchNzLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_n0;
  A380PitchNzLaw_DWork.Delay_DSTATE_jh = rtb_Minup;
  A380PitchNzLaw_DWork.Delay_DSTATE_dy = rtb_Y_ht;
  A380PitchNzLaw_DWork.Delay_DSTATE_e5 = rtb_Y_g;
  A380PitchNzLaw_DWork.Delay_DSTATE_gz = rtb_v_target;
  A380PitchNzLaw_DWork.Delay_DSTATE_lf = rtb_Saturation_an;
  A380PitchNzLaw_DWork.Delay_DSTATE_h = rtb_Sum1_mw;
  A380PitchNzLaw_DWork.Delay_DSTATE_ds = rtb_Gain_m2;
  A380PitchNzLaw_DWork.Delay_DSTATE_jt = rtb_Product_fu;
  A380PitchNzLaw_DWork.icLoad = false;
}

A380PitchNzLaw::A380PitchNzLaw():
  A380PitchNzLaw_B(),
  A380PitchNzLaw_DWork()
{
}

A380PitchNzLaw::~A380PitchNzLaw() = default;
