#include "PitchNormalLaw.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"
#include "look2_binlxpw.h"

const uint8_T PitchNormalLaw_IN_Flare_Active_Armed{ 1U };

const uint8_T PitchNormalLaw_IN_Flare_Active_Reduce{ 2U };

const uint8_T PitchNormalLaw_IN_Flare_Prepare{ 3U };

const uint8_T PitchNormalLaw_IN_Flight{ 4U };

const uint8_T PitchNormalLaw_IN_Ground{ 5U };

const uint8_T PitchNormalLaw_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T PitchNormalLaw_IN_frozen{ 1U };

const uint8_T PitchNormalLaw_IN_running{ 2U };

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


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0 },


  { 0.0, 163.0, 243.0, 344.0, 400.0 },


  { 0.0, 0.06, 0.1, 0.2, 1.0 },


  { 0.0, 163.0, 243.0, 344.0, 400.0 },

  0.05,

  0.3,

  5.0,

  0.3,

  5.0,

  0.3,

  5.0,

  1.6,

  1.0,

  2.0,

  2.0,

  5.0,

  0.3,

  5.0,

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


  { 0.1, 0.1, 0.1, 0.15, 0.2, 0.3, 0.3 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 0.0, 0.0, -30.0, -30.0 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },


  { 1.0, 1.0, 0.5, 0.3, 0.3 },

  17.0,

  17.0,

  -0.2,

  -0.5,

  -0.5,

  -0.5,

  -1.0,

  -5.0,

  -2.0,

  -1.0,

  -0.25,

  -3.0,

  -12.0,

  -0.2,

  -4.0,

  -0.5,

  -0.33333333333333331,

  -0.5,

  -45.0,

  0.2,

  0.5,

  0.5,

  0.5,

  1.0,

  5.0,

  2.0,

  1.0,

  4.0,

  3.0,

  12.0,

  1.0,

  4.0,

  0.5,

  4.0,

  0.5,

  45.0,

  true,

  4.55,

  3.5,

  -11.0,

  0.0,

  0.0,


  { 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0 },


  { -10.0, -2.0, -0.1, 0.0, 0.1, 2.0, 10.0 },


  { -10.0, -3.0, 0.0, 3.0, 10.0 },


  { 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0,
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0 },


  { -10.0, -2.0, -0.1, 0.0, 0.1, 2.0, 10.0 },


  { -10.0, -3.0, 0.0, 3.0, 10.0 },

  0.0,

  0.0,

  -22.0,

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

  0.0,

  1.0,

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

  0.0,

  1.0,

  20.0,

  1.0,

  0.0,

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

  20.0,

  0.0,

  2.0,

  0.0,


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

  -1.0,

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

  17.0,

  -30.0,

  0.076923076923076927,


  { 6U, 4U },


  { 6U, 4U },


  { 4U, 4U },

  0U,

  1U,

  1U
};

void PitchNormalLaw::PitchNormalLaw_LagFilter_Reset(rtDW_LagFilter_PitchNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

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

void PitchNormalLaw::PitchNormalLaw_RateLimiter_Reset(rtDW_RateLimiter_PitchNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
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

void PitchNormalLaw::PitchNormalLaw_eta_trim_limit_lofreeze_Reset(rtDW_eta_trim_limit_lofreeze_PitchNormalLaw_T *localDW)
{
  localDW->frozen_eta_trim_not_empty = false;
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

void PitchNormalLaw::PitchNormalLaw_LagFilter_i_Reset(rtDW_LagFilter_PitchNormalLaw_d_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
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

void PitchNormalLaw::PitchNormalLaw_WashoutFilter_Reset(rtDW_WashoutFilter_PitchNormalLaw_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
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

void PitchNormalLaw::PitchNormalLaw_RateLimiter_l_Reset(rtDW_RateLimiter_PitchNormalLaw_o_T *localDW)
{
  localDW->pY_not_empty = false;
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

void PitchNormalLaw::init(void)
{
  PitchNormalLaw_DWork.Delay_DSTATE = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_e = PitchNormalLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_n = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_c = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_l = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  PitchNormalLaw_DWork.Delay_DSTATE_k = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  PitchNormalLaw_DWork.Delay_DSTATE_d = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchNormalLaw_DWork.Delay_DSTATE_b = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_en = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_b;
  PitchNormalLaw_DWork.Delay_DSTATE_i = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_j;
  PitchNormalLaw_DWork.Delay_DSTATE_g = PitchNormalLaw_rtP.RateLimiterVariableTs8_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_f = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_g5 = PitchNormalLaw_rtP.Delay_InitialCondition;
  PitchNormalLaw_DWork.Delay1_DSTATE = PitchNormalLaw_rtP.Delay1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_j = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  PitchNormalLaw_DWork.Delay_DSTATE_ca = PitchNormalLaw_rtP.Delay_InitialCondition_e;
  PitchNormalLaw_DWork.Delay1_DSTATE_i = PitchNormalLaw_rtP.Delay1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_e1 = PitchNormalLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_bg = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_n;
  PitchNormalLaw_DWork.Delay_DSTATE_o = PitchNormalLaw_rtP.Delay_InitialCondition_i;
  PitchNormalLaw_DWork.Delay1_DSTATE_n = PitchNormalLaw_rtP.Delay1_InitialCondition_d;
  PitchNormalLaw_DWork.Delay_DSTATE_jv = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_n;
  PitchNormalLaw_DWork.Delay_DSTATE_lf = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  PitchNormalLaw_DWork.Delay_DSTATE_dv = PitchNormalLaw_rtP.RateLimiterVariableTs9_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_kd = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  PitchNormalLaw_DWork.Delay_DSTATE_b5 = PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_ku = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  PitchNormalLaw_DWork.Delay_DSTATE_gl = PitchNormalLaw_rtP.Delay_InitialCondition_c;
  PitchNormalLaw_DWork.Delay1_DSTATE_l = PitchNormalLaw_rtP.Delay1_InitialCondition_gf;
  PitchNormalLaw_DWork.Delay_DSTATE_m = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_k2 = PitchNormalLaw_rtP.Delay_InitialCondition_h;
  PitchNormalLaw_DWork.Delay1_DSTATE_ns = PitchNormalLaw_rtP.Delay1_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_mz = PitchNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_jh = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  PitchNormalLaw_DWork.Delay_DSTATE_dy = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_di;
  PitchNormalLaw_DWork.Delay_DSTATE_e5 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchNormalLaw_DWork.Delay_DSTATE_gz = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_lf1 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchNormalLaw_DWork.Delay_DSTATE_h = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_ds = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_jt = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_an;
  PitchNormalLaw_DWork.icLoad = true;
  PitchNormalLaw_DWork.Delay_DSTATE_ej = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_bb;
  PitchNormalLaw_DWork.Delay_DSTATE_e4 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_p;
  PitchNormalLaw_DWork.icLoad_p = true;
}

void PitchNormalLaw::reset(void)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  PitchNormalLaw_DWork.Delay_DSTATE = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_e = PitchNormalLaw_rtP.RateLimiterDynamicVariableTs_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_n = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_c = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_l = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_l;
  PitchNormalLaw_DWork.Delay_DSTATE_k = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_o;
  PitchNormalLaw_DWork.Delay_DSTATE_d = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_d;
  PitchNormalLaw_DWork.Delay_DSTATE_b = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_en = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_b;
  PitchNormalLaw_DWork.Delay_DSTATE_i = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_j;
  PitchNormalLaw_DWork.Delay_DSTATE_g = PitchNormalLaw_rtP.RateLimiterVariableTs8_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_f = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_g5 = PitchNormalLaw_rtP.Delay_InitialCondition;
  PitchNormalLaw_DWork.Delay1_DSTATE = PitchNormalLaw_rtP.Delay1_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_j = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_m;
  PitchNormalLaw_DWork.Delay_DSTATE_ca = PitchNormalLaw_rtP.Delay_InitialCondition_e;
  PitchNormalLaw_DWork.Delay1_DSTATE_i = PitchNormalLaw_rtP.Delay1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_e1 = PitchNormalLaw_rtP.RateLimiterVariableTs5_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_bg = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_n;
  PitchNormalLaw_DWork.Delay_DSTATE_o = PitchNormalLaw_rtP.Delay_InitialCondition_i;
  PitchNormalLaw_DWork.Delay1_DSTATE_n = PitchNormalLaw_rtP.Delay1_InitialCondition_d;
  PitchNormalLaw_DWork.Delay_DSTATE_jv = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_n;
  PitchNormalLaw_DWork.Delay_DSTATE_lf = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_a;
  PitchNormalLaw_DWork.Delay_DSTATE_dv = PitchNormalLaw_rtP.RateLimiterVariableTs9_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_kd = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_j;
  PitchNormalLaw_DWork.Delay_DSTATE_b5 = PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_ku = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_f;
  PitchNormalLaw_DWork.Delay_DSTATE_gl = PitchNormalLaw_rtP.Delay_InitialCondition_c;
  PitchNormalLaw_DWork.Delay1_DSTATE_l = PitchNormalLaw_rtP.Delay1_InitialCondition_gf;
  PitchNormalLaw_DWork.Delay_DSTATE_m = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_k2 = PitchNormalLaw_rtP.Delay_InitialCondition_h;
  PitchNormalLaw_DWork.Delay1_DSTATE_ns = PitchNormalLaw_rtP.Delay1_InitialCondition_e;
  PitchNormalLaw_DWork.Delay_DSTATE_mz = PitchNormalLaw_rtP.RateLimiterVariableTs4_InitialCondition;
  PitchNormalLaw_DWork.Delay_DSTATE_jh = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_a;
  PitchNormalLaw_DWork.Delay_DSTATE_dy = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_di;
  PitchNormalLaw_DWork.Delay_DSTATE_e5 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_f;
  PitchNormalLaw_DWork.Delay_DSTATE_gz = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_lf1 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_c;
  PitchNormalLaw_DWork.Delay_DSTATE_h = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_InitialCondition_g;
  PitchNormalLaw_DWork.Delay_DSTATE_ds = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_h;
  PitchNormalLaw_DWork.Delay_DSTATE_jt = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_InitialCondition_an;
  PitchNormalLaw_DWork.icLoad = true;
  PitchNormalLaw_DWork.Delay_DSTATE_ej = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_bb;
  PitchNormalLaw_DWork.Delay_DSTATE_e4 = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_InitialCondition_p;
  PitchNormalLaw_DWork.icLoad_p = true;
  PitchNormalLaw_LagFilter_Reset(&PitchNormalLaw_DWork.sf_LagFilter);
  PitchNormalLaw_B.flare_Theta_c_deg = 0.0;
  PitchNormalLaw_B.flare_Theta_c_rate_deg_s = 0.0;
  PitchNormalLaw_DWork.is_active_c2_PitchNormalLaw = 0U;
  PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  PitchNormalLaw_DWork.is_active_c9_PitchNormalLaw = 0U;
  PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  PitchNormalLaw_DWork.is_active_c8_PitchNormalLaw = 0U;
  PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  rtb_nz_limit_up_g = 0.0;
  rtb_nz_limit_lo_g = 0.0;
  PitchNormalLaw_DWork.is_active_c7_PitchNormalLaw = 0U;
  PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter);
  PitchNormalLaw_DWork.is_active_c6_PitchNormalLaw = 0U;
  PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_NO_ACTIVE_CHILD;
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_p);
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_c);
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_n);
  PitchNormalLaw_eta_trim_limit_lofreeze_Reset(&PitchNormalLaw_DWork.sf_eta_trim_limit_lofreeze);
  PitchNormalLaw_eta_trim_limit_lofreeze_Reset(&PitchNormalLaw_DWork.sf_eta_trim_limit_upfreeze);
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_o);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_k);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter_k);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_g3);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter_c);
  PitchNormalLaw_RateLimiter_l_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_i);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_m);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter_k4);
  PitchNormalLaw_RateLimiter_l_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_nx);
  PitchNormalLaw_LagFilter_Reset(&PitchNormalLaw_DWork.sf_LagFilter_mf);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter_h);
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_ck);
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_e);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_gr);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter_ca);
  PitchNormalLaw_RateLimiter_l_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_c2);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_i);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter_l);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_g);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter_d);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_n);
  PitchNormalLaw_WashoutFilter_Reset(&PitchNormalLaw_DWork.sf_WashoutFilter);
  PitchNormalLaw_RateLimiter_l_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_ct);
  PitchNormalLaw_LagFilter_i_Reset(&PitchNormalLaw_DWork.sf_LagFilter_f);
  PitchNormalLaw_RateLimiter_Reset(&PitchNormalLaw_DWork.sf_RateLimiter_b);
}

void PitchNormalLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_nz_g, const real_T *rtu_In_Theta_deg, const
  real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const real_T *rtu_In_qk_dot_deg_s2, const real_T
  *rtu_In_eta_deg, const real_T *rtu_In_eta_trim_deg, const real_T *rtu_In_alpha_deg, const real_T *rtu_In_V_ias_kn,
  const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft, const real_T *rtu_In_flaps_handle_index, const real_T *
  rtu_In_spoilers_left_pos, const real_T *rtu_In_spoilers_right_pos, const real_T *rtu_In_thrust_lever_1_pos, const
  real_T *rtu_In_thrust_lever_2_pos, const boolean_T *rtu_In_tailstrike_protection_on, const real_T *rtu_In_VLS_kn,
  const real_T *rtu_In_delta_eta_pos, const boolean_T *rtu_In_on_ground, const real_T *rtu_In_in_flight, const boolean_T
  *rtu_In_tracking_mode_on, const boolean_T *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active,
  const real_T *rtu_In_alpha_prot, const real_T *rtu_In_alpha_max, const real_T *rtu_In_high_speed_prot_high_kn, const
  real_T *rtu_In_high_speed_prot_low_kn, const real_T *rtu_In_ap_theta_c_deg, const boolean_T *rtu_In_any_ap_engaged,
  real_T *rty_Out_eta_deg, real_T *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T
  *rty_Out_eta_trim_limit_up)
{
  real_T rtb_nz_limit_up_g;
  real_T rtb_nz_limit_lo_g;
  real_T rtb_Abs;
  real_T rtb_Bias_f;
  real_T rtb_Bias_fd;
  real_T rtb_Bias_p;
  real_T rtb_Divide;
  real_T rtb_Divide1_e;
  real_T rtb_Divide_a;
  real_T rtb_Divide_an;
  real_T rtb_Divide_c;
  real_T rtb_Divide_c4;
  real_T rtb_Divide_cq;
  real_T rtb_Divide_e;
  real_T rtb_Divide_g4;
  real_T rtb_Divide_l;
  real_T rtb_Divide_m;
  real_T rtb_Divide_n;
  real_T rtb_Divide_o;
  real_T rtb_Divide_o4;
  real_T rtb_Divide_py;
  real_T rtb_Gain1;
  real_T rtb_Gain1_b;
  real_T rtb_Gain1_e;
  real_T rtb_Gain1_g;
  real_T rtb_Gain1_h;
  real_T rtb_Gain1_n;
  real_T rtb_Gain1_nj;
  real_T rtb_Gain_bu;
  real_T rtb_Gain_cb;
  real_T rtb_Gain_mj;
  real_T rtb_Gain_ny;
  real_T rtb_Gain_ot;
  real_T rtb_Loaddemand;
  real_T rtb_ManualSwitch;
  real_T rtb_Product1_ck;
  real_T rtb_Product1_d;
  real_T rtb_Product1_dm;
  real_T rtb_Product_e;
  real_T rtb_Product_k;
  real_T rtb_Product_kz;
  real_T rtb_Product_n3;
  real_T rtb_Product_p;
  real_T rtb_Saturation3;
  real_T rtb_Saturation3_i;
  real_T rtb_Sum1_c;
  real_T rtb_Sum1_nd;
  real_T rtb_Sum1_nt;
  real_T rtb_Sum6;
  real_T rtb_Switch_f;
  real_T rtb_Tsxlo;
  real_T rtb_Y_b;
  real_T rtb_Y_g;
  real_T rtb_Y_i;
  real_T rtb_Y_i1;
  real_T rtb_Y_j;
  real_T rtb_Y_ku;
  real_T rtb_Y_l;
  real_T rtb_alpha_err_gain;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_qk_dot_gain;
  real_T rtb_v_target;
  int32_T rtb_in_flare;
  int32_T rtb_in_rotation;
  int32_T rtb_theta_lim;
  boolean_T rtb_OR;
  boolean_T rtb_eta_trim_deg_should_freeze;
  PitchNormalLaw_LagFilter(rtu_In_Theta_deg, PitchNormalLaw_rtP.LagFilter_C1, rtu_In_time_dt, &rtb_Y_j,
    &PitchNormalLaw_DWork.sf_LagFilter);
  if (PitchNormalLaw_rtP.SwitchTheta_cDebug_CurrentSetting == 1) {
    rtb_Y_j = PitchNormalLaw_rtP.FlareLawTheta_cDebug_Value;
  }

  if (PitchNormalLaw_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = PitchNormalLaw_rtP.Constant1_Value_k;
  } else {
    rtb_ManualSwitch = PitchNormalLaw_rtP.Constant_Value_p;
  }

  if (PitchNormalLaw_DWork.is_active_c2_PitchNormalLaw == 0) {
    PitchNormalLaw_DWork.is_active_c2_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Ground;
    rtb_in_flare = 0;
    PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
    PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -1000.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c2_PitchNormalLaw) {
     case PitchNormalLaw_IN_Flare_Active_Armed:
      if (PitchNormalLaw_rtP.ManualSwitch1_CurrentSetting == 1) {
        rtb_Switch_f = PitchNormalLaw_rtP.Constant1_Value_k;
      } else {
        rtb_Switch_f = PitchNormalLaw_rtP.Constant_Value_p;
      }

      if ((*rtu_In_H_radio_ft <= 30.0) || (rtb_Switch_f == 1.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Active_Reduce;
        rtb_in_flare = 1;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
      } else if ((*rtu_In_in_flight == 1.0) && (*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case PitchNormalLaw_IN_Flare_Active_Reduce:
      if (*rtu_In_in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Ground;
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -1000.0;
      } else if ((*rtu_In_in_flight == 1.0) && (*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 1;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
      }
      break;

     case PitchNormalLaw_IN_Flare_Prepare:
      if ((*rtu_In_H_radio_ft <= 50.0) || (rtb_ManualSwitch == 1.0)) {
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -(std::fmax(-2.0, rtb_Y_j) + 2.0) / 8.0;
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Active_Armed;
        rtb_in_flare = 1;
      } else if ((*rtu_In_in_flight == 1.0) && (*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
      }
      break;

     case PitchNormalLaw_IN_Flight:
      if ((*rtu_In_H_radio_ft <= 50.0) || (rtb_ManualSwitch == 1.0)) {
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -1000.0;
        PitchNormalLaw_B.flare_Theta_c_deg = rtb_Y_j;
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flare_Prepare;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
      }
      break;

     default:
      if ((*rtu_In_in_flight == 1.0) && (*rtu_In_H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        PitchNormalLaw_DWork.is_c2_PitchNormalLaw = PitchNormalLaw_IN_Flight;
        rtb_in_flare = 0;
      } else {
        rtb_in_flare = 0;
        PitchNormalLaw_B.flare_Theta_c_deg = -2.0;
        PitchNormalLaw_B.flare_Theta_c_rate_deg_s = -1000.0;
      }
      break;
    }
  }

  if (PitchNormalLaw_DWork.is_active_c9_PitchNormalLaw == 0) {
    PitchNormalLaw_DWork.is_active_c9_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (PitchNormalLaw_DWork.is_c9_PitchNormalLaw == PitchNormalLaw_IN_frozen) {
    if ((rtb_in_flare == 0) && (*rtu_In_nz_g < 1.25) && (*rtu_In_nz_g > 0.5) && (std::abs(*rtu_In_Phi_deg) <= 30.0)) {
      PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if ((rtb_in_flare != 0) || (*rtu_In_nz_g >= 1.25) || (*rtu_In_nz_g <= 0.5) || (std::abs(*rtu_In_Phi_deg) > 30.0))
  {
    PitchNormalLaw_DWork.is_c9_PitchNormalLaw = PitchNormalLaw_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  rtb_ManualSwitch = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain * *rtu_In_qk_deg_s;
  rtb_Divide = (rtb_ManualSwitch - PitchNormalLaw_DWork.Delay_DSTATE) / *rtu_In_time_dt;
  rtb_Gain1 = PitchNormalLaw_rtP.Gain1_Gain * *rtu_In_Theta_deg;
  rtb_Divide_g4 = std::cos(rtb_Gain1);
  rtb_Gain1 = PitchNormalLaw_rtP.Gain1_Gain_l * *rtu_In_Phi_deg;
  rtb_Divide1_e = rtb_Divide_g4 / std::cos(rtb_Gain1);
  rtb_Gain1_h = PitchNormalLaw_rtP.Gain1_Gain_e * *rtu_In_qk_deg_s;
  rtb_Gain_bu = *rtu_In_nz_g - rtb_Divide1_e;
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data,
    PitchNormalLaw_rtP.uDLookupTable_tableData, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  rtb_Gain_ot = *rtu_In_V_ias_kn;
  rtb_Gain1_g = *rtu_In_flaps_handle_index;
  rtb_Divide_an = *rtu_In_VLS_kn;
  rtb_Gain_cb = PitchNormalLaw_rtP.Gain_Gain_a * *rtu_In_delta_eta_pos;
  if (PitchNormalLaw_DWork.is_active_c8_PitchNormalLaw == 0) {
    PitchNormalLaw_DWork.is_active_c8_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_manual;
  } else {
    switch (PitchNormalLaw_DWork.is_c8_PitchNormalLaw) {
     case PitchNormalLaw_IN_automatic:
      if (*rtu_In_in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_reset;
      } else if (*rtu_In_tracking_mode_on) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_tracking;
      }
      break;

     case PitchNormalLaw_IN_manual:
      if (*rtu_In_in_flight != 0.0) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_automatic;
      }
      break;

     case PitchNormalLaw_IN_reset:
      if ((*rtu_In_in_flight == 0.0) && (*rtu_In_eta_trim_deg == 0.0)) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_manual;
      }
      break;

     default:
      if (!*rtu_In_tracking_mode_on) {
        PitchNormalLaw_DWork.is_c8_PitchNormalLaw = PitchNormalLaw_IN_automatic;
      }
      break;
    }
  }

  if (PitchNormalLaw_DWork.is_active_c7_PitchNormalLaw == 0) {
    PitchNormalLaw_DWork.is_active_c7_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
    rtb_Gain1 = 0.7;
    rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0.0;
  } else {
    switch (PitchNormalLaw_DWork.is_c7_PitchNormalLaw) {
     case PitchNormalLaw_IN_flight_clean:
      if (*rtu_In_flaps_handle_index != 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_flaps;
        rtb_Gain1 = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else if (*rtu_In_in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
        rtb_Gain1 = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_Gain1 = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      }
      break;

     case PitchNormalLaw_IN_flight_flaps:
      if (*rtu_In_flaps_handle_index == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_clean;
        rtb_Gain1 = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if (*rtu_In_in_flight == 0.0) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_ground;
        rtb_Gain1 = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_Gain1 = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;

     default:
      if ((*rtu_In_in_flight != 0.0) && (*rtu_In_flaps_handle_index == 0.0)) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_clean;
        rtb_Gain1 = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1.0;
      } else if ((*rtu_In_in_flight != 0.0) && (*rtu_In_flaps_handle_index != 0.0)) {
        PitchNormalLaw_DWork.is_c7_PitchNormalLaw = PitchNormalLaw_IN_flight_flaps;
        rtb_Gain1 = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      } else {
        rtb_Gain1 = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0.0;
      }
      break;
    }
  }

  rtb_Product1_ck = *rtu_In_in_flight;
  if (rtb_Product1_ck > PitchNormalLaw_rtP.Saturation_UpperSat_c) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation_UpperSat_c;
  } else if (rtb_Product1_ck < PitchNormalLaw_rtP.Saturation_LowerSat_n) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation_LowerSat_n;
  }

  PitchNormalLaw_RateLimiter(rtb_Product1_ck, PitchNormalLaw_rtP.RateLimiterVariableTs_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i1, &PitchNormalLaw_DWork.sf_RateLimiter);
  if (PitchNormalLaw_DWork.is_active_c6_PitchNormalLaw == 0) {
    PitchNormalLaw_DWork.is_active_c6_PitchNormalLaw = 1U;
    PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else if (PitchNormalLaw_DWork.is_c6_PitchNormalLaw == PitchNormalLaw_IN_OFF) {
    if ((rtb_Y_i1 < 1.0) && (*rtu_In_V_tas_kn > 70.0) && ((*rtu_In_thrust_lever_1_pos >= 35.0) ||
         (*rtu_In_thrust_lever_2_pos >= 35.0))) {
      PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_ON;
      rtb_in_rotation = 1;
    } else {
      rtb_in_rotation = 0;
    }
  } else if ((rtb_Y_i1 == 1.0) || (*rtu_In_H_radio_ft > 400.0) || ((*rtu_In_V_tas_kn < 70.0) &&
              ((*rtu_In_thrust_lever_1_pos < 35.0) || (*rtu_In_thrust_lever_2_pos < 35.0)))) {
    PitchNormalLaw_DWork.is_c6_PitchNormalLaw = PitchNormalLaw_IN_OFF;
    rtb_in_rotation = 0;
  } else {
    rtb_in_rotation = 1;
  }

  if (rtb_in_rotation > PitchNormalLaw_rtP.Saturation1_UpperSat) {
    rtb_Switch_f = PitchNormalLaw_rtP.Saturation1_UpperSat;
  } else if (rtb_in_rotation < PitchNormalLaw_rtP.Saturation1_LowerSat) {
    rtb_Switch_f = PitchNormalLaw_rtP.Saturation1_LowerSat;
  } else {
    rtb_Switch_f = rtb_in_rotation;
  }

  PitchNormalLaw_RateLimiter(rtb_Switch_f, PitchNormalLaw_rtP.RateLimiterVariableTs1_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Y_ku, &PitchNormalLaw_DWork.sf_RateLimiter_p);
  PitchNormalLaw_RateLimiter(rtb_nz_limit_up_g, PitchNormalLaw_rtP.RateLimiterVariableTs2_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Sum6, &PitchNormalLaw_DWork.sf_RateLimiter_c);
  PitchNormalLaw_RateLimiter(rtb_nz_limit_lo_g, PitchNormalLaw_rtP.RateLimiterVariableTs3_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs3_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs3_InitialCondition, &rtb_Y_b, &PitchNormalLaw_DWork.sf_RateLimiter_n);
  rtb_Saturation3_i = std::abs(PitchNormalLaw_B.flare_Theta_c_rate_deg_s) * *rtu_In_time_dt;
  rtb_Saturation3 = *rtu_In_time_dt * PitchNormalLaw_B.flare_Theta_c_rate_deg_s;
  PitchNormalLaw_DWork.Delay_DSTATE_e += std::fmax(std::fmin(PitchNormalLaw_B.flare_Theta_c_deg -
    PitchNormalLaw_DWork.Delay_DSTATE_e, rtb_Saturation3_i), rtb_Saturation3);
  PitchNormalLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_aoa_prot_active, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_eta_trim_limit_lofreeze);
  if (*rtu_In_high_aoa_prot_active) {
    *rty_Out_eta_trim_limit_lo = rtb_Y_g;
  } else {
    *rty_Out_eta_trim_limit_lo = PitchNormalLaw_rtP.Constant3_Value;
  }

  PitchNormalLaw_eta_trim_limit_lofreeze(rtu_In_eta_trim_deg, rtu_In_high_speed_prot_active, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_eta_trim_limit_upfreeze);
  if (*rtu_In_high_speed_prot_active) {
    *rty_Out_eta_trim_limit_up = rtb_Y_g;
  } else {
    *rty_Out_eta_trim_limit_up = PitchNormalLaw_rtP.Constant2_Value;
  }

  if (rtb_Gain1_g == 5.0) {
    rtb_in_rotation = 25;
  } else {
    rtb_in_rotation = 30;
  }

  PitchNormalLaw_RateLimiter(static_cast<real_T>(rtb_in_rotation) - std::fmin(5.0, std::fmax(0.0, 5.0 - (rtb_Gain_ot -
    (rtb_Divide_an + 5.0)) * 0.25)), PitchNormalLaw_rtP.RateLimiterVariableTs6_up,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_lo, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs6_InitialCondition, &rtb_Y_j, &PitchNormalLaw_DWork.sf_RateLimiter_o);
  rtb_Saturation3 = PitchNormalLaw_rtP.Gain1_Gain_m * *rtu_In_Theta_deg;
  rtb_Product1_ck = PitchNormalLaw_rtP.Gain2_Gain * rtb_Y_j - rtb_Saturation3;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat;
  }

  if (rtb_Product1_ck > PitchNormalLaw_rtP.Saturation1_UpperSat_i) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation1_UpperSat_i;
  } else if (rtb_Product1_ck < PitchNormalLaw_rtP.Saturation1_LowerSat_h) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation1_LowerSat_h;
  }

  rtb_Y_l = (PitchNormalLaw_rtP.Gain_Gain * PitchNormalLaw_rtP.Vm_currentms_Value * rtb_Gain1_h + rtb_Gain_bu) -
    (rtb_Tsxlo / (PitchNormalLaw_rtP.Gain5_Gain * rtb_v_target) + PitchNormalLaw_rtP.Bias_Bias) * ((rtb_Divide1_e +
    look1_binlxpw(rtb_Product1_ck, PitchNormalLaw_rtP.Loaddemand1_bp01Data, PitchNormalLaw_rtP.Loaddemand1_tableData, 2U))
    - rtb_Divide1_e);
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data, PitchNormalLaw_rtP.PLUT_tableData, 1U);
  rtb_Product1_dm = rtb_Y_l * rtb_Tsxlo;
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data, PitchNormalLaw_rtP.DLUT_tableData, 1U);
  rtb_Gain1_h = rtb_Y_l * rtb_Tsxlo * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain;
  rtb_Divide_o = (rtb_Gain1_h - PitchNormalLaw_DWork.Delay_DSTATE_n) / *rtu_In_time_dt;
  rtb_Gain_ot = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain * *rtu_In_V_tas_kn;
  rtb_Divide_an = (rtb_Gain_ot - PitchNormalLaw_DWork.Delay_DSTATE_c) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Divide_an, PitchNormalLaw_rtP.LagFilter_C1_i, rtu_In_time_dt, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_LagFilter_k);
  if (rtb_Y_g > PitchNormalLaw_rtP.SaturationV_dot_UpperSat) {
    rtb_Divide_c4 = PitchNormalLaw_rtP.SaturationV_dot_UpperSat;
  } else if (rtb_Y_g < PitchNormalLaw_rtP.SaturationV_dot_LowerSat) {
    rtb_Divide_c4 = PitchNormalLaw_rtP.SaturationV_dot_LowerSat;
  } else {
    rtb_Divide_c4 = rtb_Y_g;
  }

  rtb_Gain_mj = std::fmin(*rtu_In_spoilers_left_pos, *rtu_In_spoilers_right_pos);
  PitchNormalLaw_WashoutFilter(rtb_Gain_mj, PitchNormalLaw_rtP.WashoutFilter_C1, rtu_In_time_dt, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_WashoutFilter_k);
  rtb_Tsxlo = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1,
    PitchNormalLaw_rtP.ScheduledGain_Table, 3U);
  if (rtb_Y_g > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat) {
    rtb_Y_g = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat;
  } else if (rtb_Y_g < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat) {
    rtb_Y_g = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat;
  }

  rtb_Product_kz = rtb_Y_g * rtb_Tsxlo;
  rtb_Divide_an = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_i * *rtu_In_qk_deg_s;
  rtb_Divide_cq = (rtb_Divide_an - PitchNormalLaw_DWork.Delay_DSTATE_l) / *rtu_In_time_dt;
  rtb_Gain1_g = PitchNormalLaw_rtP.Gain1_Gain_o * *rtu_In_qk_deg_s;
  rtb_Y_l = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_o,
    PitchNormalLaw_rtP.uDLookupTable_tableData_e, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat_a) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat_a;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat_l) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat_l;
  }

  rtb_Y_l = (PitchNormalLaw_rtP.Gain_Gain_al * PitchNormalLaw_rtP.Vm_currentms_Value_e * rtb_Gain1_g + rtb_Gain_bu) -
    (rtb_Y_l / (PitchNormalLaw_rtP.Gain5_Gain_d * rtb_v_target) + PitchNormalLaw_rtP.Bias_Bias_a) * (rtb_Sum6 -
    rtb_Divide1_e);
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_b, PitchNormalLaw_rtP.PLUT_tableData_b,
    1U);
  rtb_Product1_ck = rtb_Y_l * rtb_Tsxlo;
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_h, PitchNormalLaw_rtP.DLUT_tableData_p,
    1U);
  rtb_Gain1_g = rtb_Y_l * rtb_Tsxlo * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j;
  rtb_Divide_l = (rtb_Gain1_g - PitchNormalLaw_DWork.Delay_DSTATE_k) / *rtu_In_time_dt;
  rtb_Saturation3_i = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_e * *rtu_In_V_tas_kn;
  rtb_Divide_m = (rtb_Saturation3_i - PitchNormalLaw_DWork.Delay_DSTATE_d) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Divide_m, PitchNormalLaw_rtP.LagFilter_C1_p, rtu_In_time_dt, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_LagFilter_g3);
  if (rtb_Y_g > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j) {
    rtb_Gain1_b = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j;
  } else if (rtb_Y_g < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e) {
    rtb_Gain1_b = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_e;
  } else {
    rtb_Gain1_b = rtb_Y_g;
  }

  PitchNormalLaw_WashoutFilter(rtb_Gain_mj, PitchNormalLaw_rtP.WashoutFilter_C1_n, rtu_In_time_dt, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_WashoutFilter_c);
  rtb_Tsxlo = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_n,
    PitchNormalLaw_rtP.ScheduledGain_Table_b, 3U);
  if (rtb_Y_g > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g) {
    rtb_Y_g = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_g;
  } else if (rtb_Y_g < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j) {
    rtb_Y_g = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_j;
  }

  rtb_Product_n3 = rtb_Y_g * rtb_Tsxlo;
  rtb_Divide_m = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_h * *rtu_In_qk_deg_s;
  rtb_Divide_c = (rtb_Divide_m - PitchNormalLaw_DWork.Delay_DSTATE_b) / *rtu_In_time_dt;
  rtb_Gain1_nj = PitchNormalLaw_rtP.Gain1_Gain_or * *rtu_In_qk_deg_s;
  rtb_Y_l = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_h,
    PitchNormalLaw_rtP.uDLookupTable_tableData_i, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat_e) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat_e;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat_f) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat_f;
  }

  rtb_Bias_f = rtb_Y_l / (PitchNormalLaw_rtP.Gain5_Gain_m * rtb_v_target) + PitchNormalLaw_rtP.Bias_Bias_e;
  PitchNormalLaw_RateLimiter_c(rtu_In_ap_theta_c_deg, PitchNormalLaw_rtP.RateLimiterVariableTs1_up_p,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_lo_e, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_b, &rtb_Sum6, &PitchNormalLaw_DWork.sf_RateLimiter_i);
  rtb_Sum6 -= *rtu_In_Theta_deg;
  rtb_Y_l = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.ScheduledGainAutopilotInput_BreakpointsForDimension1,
    PitchNormalLaw_rtP.ScheduledGainAutopilotInput_Table, 6U);
  rtb_v_target = *rtu_In_Phi_deg;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation_UpperSat_f) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_UpperSat_f;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation_LowerSat_o1) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_LowerSat_o1;
  }

  rtb_Divide_g4 /= std::cos(PitchNormalLaw_rtP.Gain1_Gain_lm * rtb_v_target);
  rtb_Y_l = (PitchNormalLaw_rtP.Gain_Gain_h * PitchNormalLaw_rtP.Vm_currentms_Value_p * rtb_Gain1_nj + rtb_Gain_bu) -
    ((rtb_Sum6 * rtb_Y_l + rtb_Divide_g4) - rtb_Divide1_e) * rtb_Bias_f;
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_d, PitchNormalLaw_rtP.PLUT_tableData_a,
    1U);
  rtb_Product1_d = rtb_Y_l * rtb_Tsxlo;
  rtb_Tsxlo = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_g, PitchNormalLaw_rtP.DLUT_tableData_b,
    1U);
  rtb_Gain1_nj = rtb_Y_l * rtb_Tsxlo * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_o;
  rtb_Divide_o4 = (rtb_Gain1_nj - PitchNormalLaw_DWork.Delay_DSTATE_en) / *rtu_In_time_dt;
  rtb_Bias_f = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_g * *rtu_In_V_tas_kn;
  rtb_Sum6 = (rtb_Bias_f - PitchNormalLaw_DWork.Delay_DSTATE_i) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Sum6, PitchNormalLaw_rtP.LagFilter_C1_d, rtu_In_time_dt, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_LagFilter_m);
  if (rtb_Y_g > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_b) {
    rtb_Divide_a = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_b;
  } else if (rtb_Y_g < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_l) {
    rtb_Divide_a = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_l;
  } else {
    rtb_Divide_a = rtb_Y_g;
  }

  PitchNormalLaw_WashoutFilter(rtb_Gain_mj, PitchNormalLaw_rtP.WashoutFilter_C1_e, rtu_In_time_dt, &rtb_Y_g,
    &PitchNormalLaw_DWork.sf_WashoutFilter_k4);
  rtb_Tsxlo = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_c,
    PitchNormalLaw_rtP.ScheduledGain_Table_h, 3U);
  rtb_Y_i = *rtu_In_any_ap_engaged;
  rtb_Sum6 = PitchNormalLaw_rtP.RateLimiterVariableTs8_up * *rtu_In_time_dt;
  rtb_Y_i = std::fmin(rtb_Y_i - PitchNormalLaw_DWork.Delay_DSTATE_g, rtb_Sum6);
  rtb_Sum6 = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs8_lo;
  PitchNormalLaw_DWork.Delay_DSTATE_g += std::fmax(rtb_Y_i, rtb_Sum6);
  if (PitchNormalLaw_DWork.Delay_DSTATE_g > PitchNormalLaw_rtP.Saturation_UpperSat_e) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_UpperSat_e;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_g < PitchNormalLaw_rtP.Saturation_LowerSat_e) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_LowerSat_e;
  } else {
    rtb_Sum6 = PitchNormalLaw_DWork.Delay_DSTATE_g;
  }

  if (rtb_Y_g > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_i) {
    rtb_Y_g = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_i;
  } else if (rtb_Y_g < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_h) {
    rtb_Y_g = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_h;
  }

  rtb_v_target = (((PitchNormalLaw_rtP.Gain3_Gain_g * rtb_Divide_c + rtb_Product1_d) + rtb_Divide_o4) +
                  PitchNormalLaw_rtP.Gain_Gain_ae * rtb_Divide_a) + rtb_Y_g * rtb_Tsxlo;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation_UpperSat_b) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_UpperSat_b;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation_LowerSat_c) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_LowerSat_c;
  }

  rtb_Product_e = rtb_v_target * rtb_Sum6;
  rtb_Sum1_nd = PitchNormalLaw_rtP.Constant_Value_i - rtb_Sum6;
  PitchNormalLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchNormalLaw_rtP.RateLimiterVariableTs2_up_m,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_lo_k, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs2_InitialCondition_f, &rtb_Sum6, &PitchNormalLaw_DWork.sf_RateLimiter_nx);
  rtb_Divide_c = (*rtu_In_alpha_max - *rtu_In_alpha_prot) * rtb_Sum6;
  PitchNormalLaw_LagFilter(rtu_In_alpha_deg, PitchNormalLaw_rtP.LagFilter1_C1, rtu_In_time_dt, &rtb_Y_j,
    &PitchNormalLaw_DWork.sf_LagFilter_mf);
  rtb_Product1_d = rtb_Y_j - *rtu_In_alpha_prot;
  rtb_Divide_o4 = std::fmax(std::fmax(0.0, *rtu_In_Theta_deg - 22.5), std::fmax(0.0, (std::abs(*rtu_In_Phi_deg) - 3.0) /
    6.0));
  PitchNormalLaw_WashoutFilter(rtb_Divide_o4, PitchNormalLaw_rtP.WashoutFilter_C1_b, rtu_In_time_dt, &rtb_Sum6,
    &PitchNormalLaw_DWork.sf_WashoutFilter_h);
  rtb_Sum6 = (rtb_Divide_c - rtb_Product1_d) - rtb_Sum6;
  rtb_Divide_c = PitchNormalLaw_rtP.Subsystem1_Gain * rtb_Sum6;
  rtb_Product1_d = (rtb_Divide_c - PitchNormalLaw_DWork.Delay_DSTATE_f) / *rtu_In_time_dt;
  rtb_Y_i = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem1_C1;
  rtb_Y_l = rtb_Y_i + PitchNormalLaw_rtP.Constant_Value_f;
  PitchNormalLaw_DWork.Delay1_DSTATE = 1.0 / rtb_Y_l * (PitchNormalLaw_rtP.Constant_Value_f - rtb_Y_i) *
    PitchNormalLaw_DWork.Delay1_DSTATE + (rtb_Product1_d + PitchNormalLaw_DWork.Delay_DSTATE_g5) * (rtb_Y_i / rtb_Y_l);
  rtb_alpha_err_gain = PitchNormalLaw_rtP.alpha_err_gain_Gain * rtb_Sum6;
  rtb_Divide_o4 = PitchNormalLaw_rtP.Subsystem3_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_a = (rtb_Divide_o4 - PitchNormalLaw_DWork.Delay_DSTATE_j) / *rtu_In_time_dt;
  rtb_Sum6 = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem3_C1;
  rtb_Y_i = rtb_Sum6 + PitchNormalLaw_rtP.Constant_Value_b;
  PitchNormalLaw_DWork.Delay1_DSTATE_i = 1.0 / rtb_Y_i * (PitchNormalLaw_rtP.Constant_Value_b - rtb_Sum6) *
    PitchNormalLaw_DWork.Delay1_DSTATE_i + (rtb_Divide_a + PitchNormalLaw_DWork.Delay_DSTATE_ca) * (rtb_Sum6 / rtb_Y_i);
  rtb_Sum6 = PitchNormalLaw_rtP.qk_gain_Gain * *rtu_In_qk_deg_s;
  rtb_qk_dot_gain = PitchNormalLaw_rtP.qk_dot_gain_Gain * *rtu_In_qk_dot_deg_s2;
  rtb_Y_l = *rtu_In_high_aoa_prot_active;
  rtb_Tsxlo = PitchNormalLaw_rtP.RateLimiterVariableTs5_up * *rtu_In_time_dt;
  rtb_Y_l = std::fmin(rtb_Y_l - PitchNormalLaw_DWork.Delay_DSTATE_e1, rtb_Tsxlo);
  rtb_Tsxlo = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs5_lo;
  PitchNormalLaw_DWork.Delay_DSTATE_e1 += std::fmax(rtb_Y_l, rtb_Tsxlo);
  if (PitchNormalLaw_DWork.Delay_DSTATE_e1 > PitchNormalLaw_rtP.Saturation_UpperSat_eo) {
    rtb_Y_i = PitchNormalLaw_rtP.Saturation_UpperSat_eo;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_e1 < PitchNormalLaw_rtP.Saturation_LowerSat_h) {
    rtb_Y_i = PitchNormalLaw_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Y_i = PitchNormalLaw_DWork.Delay_DSTATE_e1;
  }

  rtb_v_target = (((PitchNormalLaw_rtP.precontrol_gain_Gain * PitchNormalLaw_DWork.Delay1_DSTATE + rtb_alpha_err_gain) +
                   PitchNormalLaw_rtP.v_dot_gain_Gain * PitchNormalLaw_DWork.Delay1_DSTATE_i) + rtb_Sum6) +
    rtb_qk_dot_gain;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat_f) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat_f;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat_c) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat_c;
  }

  rtb_Product_k = rtb_v_target * rtb_Y_i;
  rtb_Sum1_c = PitchNormalLaw_rtP.Constant_Value_fe - rtb_Y_i;
  rtb_Abs = std::abs(PitchNormalLaw_rtP.Constant_Value_e);
  rtb_in_rotation = *rtu_In_on_ground;
  if (rtb_in_rotation > PitchNormalLaw_rtP.LimitSwitchUp_Threshold) {
    rtb_Sum6 = look2_binlxpw(*rtu_In_qk_deg_s, *rtu_In_eta_deg, PitchNormalLaw_rtP.LimitUp_bp01Data,
      PitchNormalLaw_rtP.LimitUp_bp02Data, PitchNormalLaw_rtP.LimitUp_tableData, PitchNormalLaw_rtP.LimitUp_maxIndex, 7U);
    rtb_Sum6 *= PitchNormalLaw_rtP.GainUp_Gain * rtb_Abs;
    if (rtb_Sum6 > rtb_Abs) {
      rtb_Sum6 = rtb_Abs;
    } else if (rtb_Sum6 < PitchNormalLaw_rtP.ConstantUp_Value) {
      rtb_Sum6 = PitchNormalLaw_rtP.ConstantUp_Value;
    }
  } else {
    rtb_Sum6 = PitchNormalLaw_rtP.GainUp_Gain * rtb_Abs;
  }

  rtb_alpha_err_gain = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_j * *rtu_In_qk_deg_s;
  rtb_Divide_n = (rtb_alpha_err_gain - PitchNormalLaw_DWork.Delay_DSTATE_bg) / *rtu_In_time_dt;
  rtb_Gain1_n = PitchNormalLaw_rtP.Gain1_Gain_i * *rtu_In_qk_deg_s;
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_c,
    PitchNormalLaw_rtP.uDLookupTable_tableData_a, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat_l) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat_l;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat_lu) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat_lu;
  }

  rtb_Bias_fd = rtb_Y_i / (PitchNormalLaw_rtP.Gain5_Gain_g * rtb_v_target) + PitchNormalLaw_rtP.Bias_Bias_g;
  if ((*rtu_In_on_ground) && (*rtu_In_qk_deg_s > 3.0)) {
    rtb_theta_lim = 6;
  } else if ((*rtu_In_on_ground) && (*rtu_In_qk_deg_s < 3.0)) {
    rtb_theta_lim = 9;
  } else {
    rtb_theta_lim = 18;
  }

  PitchNormalLaw_RateLimiter(static_cast<real_T>(rtb_theta_lim), PitchNormalLaw_rtP.RateLimiterVariableTs1_up_b,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_lo_j, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs1_InitialCondition_n, &rtb_Y_g, &PitchNormalLaw_DWork.sf_RateLimiter_ck);
  rtb_qk_dot_gain = PitchNormalLaw_rtP.Gain3_Gain_k * *rtu_In_delta_eta_pos;
  rtb_qk_dot_gain += PitchNormalLaw_DWork.Delay_DSTATE_e;
  if (rtb_qk_dot_gain > rtb_Y_g) {
    rtb_qk_dot_gain = rtb_Y_g;
  } else if (rtb_qk_dot_gain < PitchNormalLaw_rtP.Constant1_Value) {
    rtb_qk_dot_gain = PitchNormalLaw_rtP.Constant1_Value;
  }

  rtb_Y_i = *rtu_In_time_dt * PitchNormalLaw_rtP.LagFilter3_C1;
  rtb_Y_l = rtb_Y_i + PitchNormalLaw_rtP.Constant_Value_fu;
  PitchNormalLaw_DWork.Delay1_DSTATE_n = 1.0 / rtb_Y_l * (PitchNormalLaw_rtP.Constant_Value_fu - rtb_Y_i) *
    PitchNormalLaw_DWork.Delay1_DSTATE_n + (rtb_qk_dot_gain + PitchNormalLaw_DWork.Delay_DSTATE_o) * (rtb_Y_i / rtb_Y_l);
  PitchNormalLaw_RateLimiter(PitchNormalLaw_DWork.Delay1_DSTATE_n, PitchNormalLaw_rtP.RateLimiterVariableTs_up_n,
    PitchNormalLaw_rtP.RateLimiterVariableTs_lo_j, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_b, &rtb_Y_j, &PitchNormalLaw_DWork.sf_RateLimiter_e);
  rtb_Y_g = rtb_Y_j - *rtu_In_Theta_deg;
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.ScheduledGainFlareLawInput_BreakpointsForDimension1,
    PitchNormalLaw_rtP.ScheduledGainFlareLawInput_Table, 6U);
  rtb_Y_i = (PitchNormalLaw_rtP.Gain_Gain_i * PitchNormalLaw_rtP.Vm_currentms_Value_j * rtb_Gain1_n + rtb_Gain_bu) -
    ((rtb_Y_g * rtb_Y_i + rtb_Divide_g4) - rtb_Divide1_e) * rtb_Bias_fd;
  rtb_Y_l = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_k, PitchNormalLaw_rtP.PLUT_tableData_bb, 1U);
  rtb_Bias_fd = rtb_Y_i * rtb_Y_l;
  rtb_Y_l = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_f, PitchNormalLaw_rtP.DLUT_tableData_bf, 1U);
  rtb_Y_g = rtb_Y_i * rtb_Y_l * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_ol;
  rtb_Divide_py = (rtb_Y_g - PitchNormalLaw_DWork.Delay_DSTATE_jv) / *rtu_In_time_dt;
  rtb_Gain1_n = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_m * *rtu_In_V_tas_kn;
  rtb_Y_i = (rtb_Gain1_n - PitchNormalLaw_DWork.Delay_DSTATE_lf) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Y_i, PitchNormalLaw_rtP.LagFilter_C1_c, rtu_In_time_dt, &rtb_Y_j,
    &PitchNormalLaw_DWork.sf_LagFilter_gr);
  if (rtb_Y_j > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_d) {
    rtb_Y_i = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_d;
  } else if (rtb_Y_j < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_g) {
    rtb_Y_i = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_g;
  } else {
    rtb_Y_i = rtb_Y_j;
  }

  PitchNormalLaw_WashoutFilter(rtb_Gain_mj, PitchNormalLaw_rtP.WashoutFilter_C1_p, rtu_In_time_dt, &rtb_Y_j,
    &PitchNormalLaw_DWork.sf_WashoutFilter_ca);
  rtb_Y_l = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_p,
    PitchNormalLaw_rtP.ScheduledGain_Table_i, 3U);
  if (rtb_Y_j > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m) {
    rtb_Y_j = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_m;
  } else if (rtb_Y_j < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_b) {
    rtb_Y_j = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_b;
  }

  rtb_Y_j = (((PitchNormalLaw_rtP.Gain3_Gain_f * rtb_Divide_n + rtb_Bias_fd) + rtb_Divide_py) +
             PitchNormalLaw_rtP.Gain_Gain_m * rtb_Y_i) + rtb_Y_j * rtb_Y_l;
  if (rtb_Y_j > PitchNormalLaw_rtP.Saturation_UpperSat_cm) {
    rtb_Y_j = PitchNormalLaw_rtP.Saturation_UpperSat_cm;
  } else if (rtb_Y_j < PitchNormalLaw_rtP.Saturation_LowerSat_p) {
    rtb_Y_j = PitchNormalLaw_rtP.Saturation_LowerSat_p;
  }

  rtb_Abs *= PitchNormalLaw_rtP.GainLo_Gain;
  if (rtb_Y_j <= rtb_Sum6) {
    if (rtb_in_rotation > PitchNormalLaw_rtP.LimitSwitchLo_Threshold) {
      rtb_Sum6 = look2_binlxpw(*rtu_In_qk_deg_s, *rtu_In_eta_deg, PitchNormalLaw_rtP.LimitLo_bp01Data,
        PitchNormalLaw_rtP.LimitLo_bp02Data, PitchNormalLaw_rtP.LimitLo_tableData, PitchNormalLaw_rtP.LimitLo_maxIndex,
        7U);
      rtb_Sum6 *= rtb_Abs;
      if (rtb_Sum6 > PitchNormalLaw_rtP.ConstantLo_Value) {
        rtb_Abs = PitchNormalLaw_rtP.ConstantLo_Value;
      } else if (rtb_Sum6 >= rtb_Abs) {
        rtb_Abs = rtb_Sum6;
      }
    }

    if (rtb_Y_j < rtb_Abs) {
      rtb_Sum6 = rtb_Abs;
    } else {
      rtb_Sum6 = rtb_Y_j;
    }
  }

  rtb_Tsxlo = PitchNormalLaw_rtP.RateLimiterVariableTs9_up * *rtu_In_time_dt;
  rtb_Y_l = std::fmin(static_cast<real_T>(rtb_in_flare) - PitchNormalLaw_DWork.Delay_DSTATE_dv, rtb_Tsxlo);
  rtb_Tsxlo = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs9_lo;
  PitchNormalLaw_DWork.Delay_DSTATE_dv += std::fmax(rtb_Y_l, rtb_Tsxlo);
  if (PitchNormalLaw_DWork.Delay_DSTATE_dv > PitchNormalLaw_rtP.Saturation_UpperSat_l) {
    rtb_Y_i = PitchNormalLaw_rtP.Saturation_UpperSat_l;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_dv < PitchNormalLaw_rtP.Saturation_LowerSat_j) {
    rtb_Y_i = PitchNormalLaw_rtP.Saturation_LowerSat_j;
  } else {
    rtb_Y_i = PitchNormalLaw_DWork.Delay_DSTATE_dv;
  }

  rtb_Product_p = rtb_Sum6 * rtb_Y_i;
  rtb_Sum1_nt = PitchNormalLaw_rtP.Constant_Value_jg - rtb_Y_i;
  rtb_Abs = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_m * *rtu_In_qk_deg_s;
  rtb_Divide_e = (rtb_Abs - PitchNormalLaw_DWork.Delay_DSTATE_kd) / *rtu_In_time_dt;
  rtb_Gain1_e = PitchNormalLaw_rtP.Gain1_Gain_en * *rtu_In_qk_deg_s;
  rtb_Sum6 = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_b,
    PitchNormalLaw_rtP.uDLookupTable_tableData_h, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat_b) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat_b;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat_e) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat_e;
  }

  rtb_Bias_p = rtb_Sum6 / (PitchNormalLaw_rtP.Gain5_Gain_e * rtb_v_target) + PitchNormalLaw_rtP.Bias_Bias_f;
  PitchNormalLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchNormalLaw_rtP.RateLimiterVariableTs_up_n5,
    PitchNormalLaw_rtP.RateLimiterVariableTs_lo_c, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_o, &rtb_Y_j, &PitchNormalLaw_DWork.sf_RateLimiter_c2);
  rtb_Loaddemand = look1_binlxpw(rtb_Y_j, PitchNormalLaw_rtP.Loaddemand_bp01Data,
    PitchNormalLaw_rtP.Loaddemand_tableData, 2U);
  rtb_Y_i = *rtu_In_delta_eta_pos - PitchNormalLaw_DWork.Delay_DSTATE_b5;
  rtb_Y_l = PitchNormalLaw_rtP.RateLimiterVariableTs3_up_i * *rtu_In_time_dt;
  rtb_Y_i = std::fmin(rtb_Y_i, rtb_Y_l);
  rtb_Y_l = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs3_lo_b;
  PitchNormalLaw_DWork.Delay_DSTATE_b5 += std::fmax(rtb_Y_i, rtb_Y_l);
  rtb_v_target = std::fmax((*rtu_In_high_speed_prot_low_kn - *rtu_In_high_speed_prot_high_kn) *
    PitchNormalLaw_DWork.Delay_DSTATE_b5, 0.0) + *rtu_In_high_speed_prot_low_kn;
  rtb_Y_j = PitchNormalLaw_rtP.Subsystem2_Gain * rtb_v_target;
  rtb_Divide_n = (rtb_Y_j - PitchNormalLaw_DWork.Delay_DSTATE_ku) / *rtu_In_time_dt;
  rtb_Sum6 = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem2_C1;
  rtb_Y_i = rtb_Sum6 + PitchNormalLaw_rtP.Constant_Value_ja;
  PitchNormalLaw_DWork.Delay1_DSTATE_l = 1.0 / rtb_Y_i * (PitchNormalLaw_rtP.Constant_Value_ja - rtb_Sum6) *
    PitchNormalLaw_DWork.Delay1_DSTATE_l + (rtb_Divide_n + PitchNormalLaw_DWork.Delay_DSTATE_gl) * (rtb_Sum6 / rtb_Y_i);
  rtb_Bias_fd = PitchNormalLaw_rtP.Subsystem_Gain * *rtu_In_V_ias_kn;
  rtb_Divide_py = (rtb_Bias_fd - PitchNormalLaw_DWork.Delay_DSTATE_m) / *rtu_In_time_dt;
  rtb_Sum6 = *rtu_In_time_dt * PitchNormalLaw_rtP.Subsystem_C1;
  rtb_Y_i = rtb_Sum6 + PitchNormalLaw_rtP.Constant_Value_jj;
  PitchNormalLaw_DWork.Delay1_DSTATE_ns = 1.0 / rtb_Y_i * (PitchNormalLaw_rtP.Constant_Value_jj - rtb_Sum6) *
    PitchNormalLaw_DWork.Delay1_DSTATE_ns + (rtb_Divide_py + PitchNormalLaw_DWork.Delay_DSTATE_k2) * (rtb_Sum6 / rtb_Y_i);
  rtb_Sum6 = *rtu_In_high_speed_prot_active;
  if (rtb_Sum6 > PitchNormalLaw_rtP.Switch2_Threshold) {
    rtb_Y_i = PitchNormalLaw_rtP.qk_dot_gain1_Gain * *rtu_In_qk_dot_deg_s2;
    rtb_Tsxlo = PitchNormalLaw_rtP.qk_gain_HSP_Gain * *rtu_In_qk_deg_s;
    rtb_v_target -= *rtu_In_V_ias_kn;
    rtb_v_target = ((((PitchNormalLaw_rtP.precontrol_gain_HSP_Gain * PitchNormalLaw_DWork.Delay1_DSTATE_l +
                       PitchNormalLaw_rtP.Gain6_Gain * rtb_v_target) + PitchNormalLaw_rtP.v_dot_gain_HSP_Gain *
                      PitchNormalLaw_DWork.Delay1_DSTATE_ns) + rtb_Tsxlo) + rtb_Y_i) * PitchNormalLaw_rtP.HSP_gain_Gain;
    if (rtb_Loaddemand > PitchNormalLaw_rtP.Saturation8_UpperSat) {
      rtb_Switch_f = PitchNormalLaw_rtP.Saturation8_UpperSat;
    } else if (rtb_Loaddemand < PitchNormalLaw_rtP.Saturation8_LowerSat) {
      rtb_Switch_f = PitchNormalLaw_rtP.Saturation8_LowerSat;
    } else {
      rtb_Switch_f = rtb_Loaddemand;
    }

    if (rtb_v_target > PitchNormalLaw_rtP.Saturation4_UpperSat) {
      rtb_v_target = PitchNormalLaw_rtP.Saturation4_UpperSat;
    } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation4_LowerSat) {
      rtb_v_target = PitchNormalLaw_rtP.Saturation4_LowerSat;
    }

    rtb_Y_i = rtb_Switch_f + rtb_v_target;
  } else {
    rtb_Y_i = PitchNormalLaw_rtP.Constant1_Value_g;
  }

  rtb_Tsxlo = PitchNormalLaw_rtP.RateLimiterVariableTs4_up * *rtu_In_time_dt;
  rtb_Switch_f = std::fmin(rtb_Sum6 - PitchNormalLaw_DWork.Delay_DSTATE_mz, rtb_Tsxlo);
  rtb_Tsxlo = *rtu_In_time_dt * PitchNormalLaw_rtP.RateLimiterVariableTs4_lo;
  PitchNormalLaw_DWork.Delay_DSTATE_mz += std::fmax(rtb_Switch_f, rtb_Tsxlo);
  if (PitchNormalLaw_DWork.Delay_DSTATE_mz > PitchNormalLaw_rtP.Saturation_UpperSat_ey) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_UpperSat_ey;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_mz < PitchNormalLaw_rtP.Saturation_LowerSat_m) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_LowerSat_m;
  } else {
    rtb_Sum6 = PitchNormalLaw_DWork.Delay_DSTATE_mz;
  }

  rtb_Sum6 = (PitchNormalLaw_rtP.Gain_Gain_b * PitchNormalLaw_rtP.Vm_currentms_Value_h * rtb_Gain1_e + rtb_Gain_bu) -
    ((((PitchNormalLaw_rtP.Constant_Value_mr - rtb_Sum6) * rtb_Loaddemand + rtb_Y_i * rtb_Sum6) + rtb_Divide_g4) -
     rtb_Divide1_e) * rtb_Bias_p;
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_f, PitchNormalLaw_rtP.PLUT_tableData_k, 1U);
  rtb_v_target = rtb_Sum6 * rtb_Y_i;
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_m, PitchNormalLaw_rtP.DLUT_tableData_a, 1U);
  rtb_Divide_g4 = rtb_Sum6 * rtb_Y_i * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_b;
  rtb_Y_l = (rtb_Divide_g4 - PitchNormalLaw_DWork.Delay_DSTATE_jh) / *rtu_In_time_dt;
  rtb_Tsxlo = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_c * *rtu_In_V_tas_kn;
  rtb_Sum6 = PitchNormalLaw_DWork.Delay_DSTATE_dy;
  rtb_Y_i = (rtb_Tsxlo - PitchNormalLaw_DWork.Delay_DSTATE_dy) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Y_i, PitchNormalLaw_rtP.LagFilter_C1_pt, rtu_In_time_dt, &rtb_Sum6,
    &PitchNormalLaw_DWork.sf_LagFilter_i);
  if (rtb_Sum6 > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_bx) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_bx;
  } else if (rtb_Sum6 < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_m) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_m;
  }

  rtb_Gain1_e = PitchNormalLaw_rtP.Gain_Gain_f * rtb_Sum6;
  PitchNormalLaw_WashoutFilter(rtb_Gain_mj, PitchNormalLaw_rtP.WashoutFilter_C1_l, rtu_In_time_dt, &rtb_Sum6,
    &PitchNormalLaw_DWork.sf_WashoutFilter_l);
  rtb_Y_i = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_cx,
    PitchNormalLaw_rtP.ScheduledGain_Table_g, 3U);
  if (rtb_Sum6 > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_o) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_o;
  } else if (rtb_Sum6 < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_jl) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_jl;
  }

  rtb_Switch_f = (((PitchNormalLaw_rtP.Gain3_Gain_c * rtb_Divide_e + rtb_v_target) + rtb_Y_l) + rtb_Gain1_e) + rtb_Sum6 *
    rtb_Y_i;
  rtb_Divide_e = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_c * *rtu_In_qk_deg_s;
  rtb_Y_l = (rtb_Divide_e - PitchNormalLaw_DWork.Delay_DSTATE_e5) / *rtu_In_time_dt;
  rtb_Y_i = PitchNormalLaw_rtP.Gain1_Gain_b * *rtu_In_qk_deg_s;
  rtb_Sum6 = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_a,
    PitchNormalLaw_rtP.uDLookupTable_tableData_p, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat_n) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat_n;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat_a) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat_a;
  }

  rtb_Sum6 = (PitchNormalLaw_rtP.Gain_Gain_p * PitchNormalLaw_rtP.Vm_currentms_Value_pb * rtb_Y_i + rtb_Gain_bu) -
    (rtb_Sum6 / (PitchNormalLaw_rtP.Gain5_Gain_n * rtb_v_target) + PitchNormalLaw_rtP.Bias_Bias_ai) * (rtb_Y_b -
    rtb_Divide1_e);
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_a, PitchNormalLaw_rtP.PLUT_tableData_o, 1U);
  rtb_Bias_p = rtb_Sum6 * rtb_Y_i;
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_k, PitchNormalLaw_rtP.DLUT_tableData_e, 1U);
  rtb_Y_b = rtb_Sum6 * rtb_Y_i * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_p;
  rtb_Loaddemand = (rtb_Y_b - PitchNormalLaw_DWork.Delay_DSTATE_gz) / *rtu_In_time_dt;
  rtb_Gain1_e = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_a * *rtu_In_V_tas_kn;
  rtb_Sum6 = PitchNormalLaw_DWork.Delay_DSTATE_lf1;
  rtb_Y_i = (rtb_Gain1_e - PitchNormalLaw_DWork.Delay_DSTATE_lf1) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Y_i, PitchNormalLaw_rtP.LagFilter_C1_l, rtu_In_time_dt, &rtb_Sum6,
    &PitchNormalLaw_DWork.sf_LagFilter_g);
  if (rtb_Sum6 > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_m;
  } else if (rtb_Sum6 < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_ek;
  }

  rtb_Gain_ny = PitchNormalLaw_rtP.Gain_Gain_k * rtb_Sum6;
  PitchNormalLaw_WashoutFilter(rtb_Gain_mj, PitchNormalLaw_rtP.WashoutFilter_C1_h, rtu_In_time_dt, &rtb_Sum6,
    &PitchNormalLaw_DWork.sf_WashoutFilter_d);
  rtb_Y_i = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_f,
    PitchNormalLaw_rtP.ScheduledGain_Table_ha, 3U);
  rtb_v_target = (((PitchNormalLaw_rtP.Gain3_Gain_m * rtb_Divide_cq + rtb_Product1_ck) + rtb_Divide_l) +
                  PitchNormalLaw_rtP.Gain_Gain_j * rtb_Gain1_b) + rtb_Product_n3;
  if (rtb_Sum6 > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_h;
  } else if (rtb_Sum6 < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_l;
  }

  rtb_Product1_ck = (((PitchNormalLaw_rtP.Gain3_Gain_b * rtb_Y_l + rtb_Bias_p) + rtb_Loaddemand) + rtb_Gain_ny) +
    rtb_Sum6 * rtb_Y_i;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation_UpperSat_hc) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_UpperSat_hc;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation_LowerSat_a) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_LowerSat_a;
  }

  if (rtb_Switch_f > PitchNormalLaw_rtP.Saturation_UpperSat_k) {
    rtb_Switch_f = PitchNormalLaw_rtP.Saturation_UpperSat_k;
  } else if (rtb_Switch_f < PitchNormalLaw_rtP.Saturation_LowerSat_p1) {
    rtb_Switch_f = PitchNormalLaw_rtP.Saturation_LowerSat_p1;
  }

  if (rtb_Product1_ck > PitchNormalLaw_rtP.Saturation_UpperSat_j) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation_UpperSat_j;
  } else if (rtb_Product1_ck < PitchNormalLaw_rtP.Saturation_LowerSat_d) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation_LowerSat_d;
  }

  PitchNormalLaw_VoterAttitudeProtection(rtb_v_target, rtb_Product_e + rtb_Sum1_nd * (rtb_Product_k + rtb_Sum1_c *
    (rtb_Product_p + rtb_Sum1_nt * rtb_Switch_f)), rtb_Product1_ck, &rtb_Y_l);
  rtb_Divide_cq = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs1_Gain_k * *rtu_In_qk_deg_s;
  rtb_Divide_l = (rtb_Divide_cq - PitchNormalLaw_DWork.Delay_DSTATE_h) / *rtu_In_time_dt;
  rtb_Gain1_b = PitchNormalLaw_rtP.Gain1_Gain_lk * *rtu_In_qk_deg_s;
  rtb_Sum6 = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.uDLookupTable_bp01Data_m,
    PitchNormalLaw_rtP.uDLookupTable_tableData_ax, 6U);
  rtb_v_target = *rtu_In_V_tas_kn;
  rtb_Product1_ck = PitchNormalLaw_rtP.Gain3_Gain_g2 * PitchNormalLaw_rtP.Theta_max3_Value - rtb_Saturation3;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation3_UpperSat_ev) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_UpperSat_ev;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation3_LowerSat_k) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation3_LowerSat_k;
  }

  if (rtb_Product1_ck > PitchNormalLaw_rtP.Saturation2_UpperSat) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation2_UpperSat;
  } else if (rtb_Product1_ck < PitchNormalLaw_rtP.Saturation2_LowerSat) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation2_LowerSat;
  }

  rtb_Sum6 = (PitchNormalLaw_rtP.Gain_Gain_jq * PitchNormalLaw_rtP.Vm_currentms_Value_b * rtb_Gain1_b + rtb_Gain_bu) -
    (rtb_Sum6 / (PitchNormalLaw_rtP.Gain5_Gain_mu * rtb_v_target) + PitchNormalLaw_rtP.Bias_Bias_m) * ((rtb_Divide1_e +
    look1_binlxpw(rtb_Product1_ck, PitchNormalLaw_rtP.Loaddemand2_bp01Data, PitchNormalLaw_rtP.Loaddemand2_tableData, 2U))
    - rtb_Divide1_e);
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.PLUT_bp01Data_e, PitchNormalLaw_rtP.PLUT_tableData_g, 1U);
  rtb_Saturation3 = rtb_Sum6 * rtb_Y_i;
  rtb_Y_i = look1_binlxpw(*rtu_In_V_tas_kn, PitchNormalLaw_rtP.DLUT_bp01Data_hw, PitchNormalLaw_rtP.DLUT_tableData_l, 1U);
  rtb_Divide1_e = rtb_Sum6 * rtb_Y_i * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_c;
  rtb_Product1_ck = (rtb_Divide1_e - PitchNormalLaw_DWork.Delay_DSTATE_ds) / *rtu_In_time_dt;
  rtb_Gain_bu = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs2_Gain_p * *rtu_In_V_tas_kn;
  rtb_Sum6 = PitchNormalLaw_DWork.Delay_DSTATE_jt;
  rtb_Gain1_b = (rtb_Gain_bu - PitchNormalLaw_DWork.Delay_DSTATE_jt) / *rtu_In_time_dt;
  PitchNormalLaw_LagFilter_n(rtb_Gain1_b, PitchNormalLaw_rtP.LagFilter_C1_f, rtu_In_time_dt, &rtb_Sum6,
    &PitchNormalLaw_DWork.sf_LagFilter_n);
  if (rtb_Sum6 > PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationV_dot_UpperSat_j2;
  } else if (rtb_Sum6 < PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationV_dot_LowerSat_n;
  }

  rtb_Gain1_b = PitchNormalLaw_rtP.Gain_Gain_l0 * rtb_Sum6;
  PitchNormalLaw_WashoutFilter(rtb_Gain_mj, PitchNormalLaw_rtP.WashoutFilter_C1_j, rtu_In_time_dt, &rtb_Sum6,
    &PitchNormalLaw_DWork.sf_WashoutFilter);
  rtb_Y_i = look1_binlxpw(*rtu_In_H_radio_ft, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_b,
    PitchNormalLaw_rtP.ScheduledGain_Table_e, 3U);
  rtb_v_target = (((PitchNormalLaw_rtP.Gain3_Gain * rtb_Divide + rtb_Product1_dm) + rtb_Divide_o) +
                  PitchNormalLaw_rtP.Gain_Gain_l * rtb_Divide_c4) + rtb_Product_kz;
  if (rtb_Sum6 > PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_mf) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationSpoilers_UpperSat_mf;
  } else if (rtb_Sum6 < PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d) {
    rtb_Sum6 = PitchNormalLaw_rtP.SaturationSpoilers_LowerSat_d;
  }

  rtb_Product1_ck = (((PitchNormalLaw_rtP.Gain3_Gain_n * rtb_Divide_l + rtb_Saturation3) + rtb_Product1_ck) +
                     rtb_Gain1_b) + rtb_Sum6 * rtb_Y_i;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation_UpperSat_h) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_UpperSat_h;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation_LowerSat_o) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_LowerSat_o;
  }

  if (rtb_Product1_ck > PitchNormalLaw_rtP.Saturation_UpperSat_a) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation_UpperSat_a;
  } else if (rtb_Product1_ck < PitchNormalLaw_rtP.Saturation_LowerSat_k) {
    rtb_Product1_ck = PitchNormalLaw_rtP.Saturation_LowerSat_k;
  }

  PitchNormalLaw_VoterAttitudeProtection(rtb_v_target, rtb_Y_l, rtb_Product1_ck, &rtb_Y_i);
  rtb_Sum6 = look1_binlxpw(*rtu_In_V_ias_kn, PitchNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1,
    PitchNormalLaw_rtP.ScheduledGain1_Table, 4U);
  rtb_Divide = rtb_Y_i * rtb_Sum6;
  rtb_Sum6 = look1_binlxpw(*rtu_In_time_dt, PitchNormalLaw_rtP.ScheduledGain_BreakpointsForDimension1_d,
    PitchNormalLaw_rtP.ScheduledGain_Table_hh, 4U);
  rtb_Sum6 = rtb_Divide * rtb_Sum6 * PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_In_time_dt;
  rtb_OR = ((rtb_Y_i1 == 0.0) || (*rtu_In_tracking_mode_on));
  if (*rtu_In_in_flight > PitchNormalLaw_rtP.Switch_Threshold) {
    rtb_Y_i = *rtu_In_eta_deg;
  } else {
    rtb_Y_i = rtb_Gain_cb;
  }

  PitchNormalLaw_DWork.icLoad = (rtb_OR || PitchNormalLaw_DWork.icLoad);
  if (PitchNormalLaw_DWork.icLoad) {
    PitchNormalLaw_DWork.Delay_DSTATE_o3 = rtb_Y_i - rtb_Sum6;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_o3 += rtb_Sum6;
  if (PitchNormalLaw_DWork.Delay_DSTATE_o3 > PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    PitchNormalLaw_DWork.Delay_DSTATE_o3 = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_o3 < PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    PitchNormalLaw_DWork.Delay_DSTATE_o3 = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (rtb_Y_i1 > PitchNormalLaw_rtP.Saturation_UpperSat_la) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_UpperSat_la;
  } else if (rtb_Y_i1 < PitchNormalLaw_rtP.Saturation_LowerSat_kp) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_LowerSat_kp;
  } else {
    rtb_Sum6 = rtb_Y_i1;
  }

  rtb_Saturation3 = PitchNormalLaw_DWork.Delay_DSTATE_o3 * rtb_Sum6;
  rtb_Divide_o = PitchNormalLaw_rtP.Constant_Value_o1 - rtb_Sum6;
  PitchNormalLaw_RateLimiter_c(rtu_In_delta_eta_pos, PitchNormalLaw_rtP.RateLimiterVariableTs_up_na,
    PitchNormalLaw_rtP.RateLimiterVariableTs_lo_i, rtu_In_time_dt,
    PitchNormalLaw_rtP.RateLimiterVariableTs_InitialCondition_m, &rtb_Y_l, &PitchNormalLaw_DWork.sf_RateLimiter_ct);
  rtb_Sum6 = *rtu_In_tailstrike_protection_on;
  rtb_Y_i = look2_binlxpw(*rtu_In_Theta_deg, *rtu_In_H_radio_ft, PitchNormalLaw_rtP.uDLookupTable_bp01Data_l,
    PitchNormalLaw_rtP.uDLookupTable_bp02Data, PitchNormalLaw_rtP.uDLookupTable_tableData_e5,
    PitchNormalLaw_rtP.uDLookupTable_maxIndex, 5U);
  if (rtb_Y_l > PitchNormalLaw_rtP.Saturation3_UpperSat_lt) {
    rtb_Switch_f = PitchNormalLaw_rtP.Saturation3_UpperSat_lt;
  } else if (rtb_Y_l < PitchNormalLaw_rtP.Saturation3_LowerSat_h) {
    rtb_Switch_f = PitchNormalLaw_rtP.Saturation3_LowerSat_h;
  } else {
    rtb_Switch_f = rtb_Y_l;
  }

  rtb_Sum6 = look1_binlxpw(rtb_Sum6 * rtb_Y_i * rtb_Switch_f + rtb_Y_l, PitchNormalLaw_rtP.PitchRateDemand_bp01Data,
    PitchNormalLaw_rtP.PitchRateDemand_tableData, 2U);
  rtb_Divide = PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_j3 * rtb_Sum6;
  rtb_Divide_c4 = (rtb_Divide - PitchNormalLaw_DWork.Delay_DSTATE_ej) / *rtu_In_time_dt;
  rtb_Y_i = *rtu_In_qk_deg_s - rtb_Sum6;
  rtb_Gain_mj = PitchNormalLaw_rtP.Gain_Gain_pt * rtb_Y_i;
  rtb_Product1_dm = PitchNormalLaw_rtP.Gain1_Gain_d * rtb_Y_i * PitchNormalLaw_rtP.DiscreteDerivativeVariableTs_Gain_g;
  rtb_Y_i = PitchNormalLaw_DWork.Delay_DSTATE_e4;
  rtb_Product_kz = (rtb_Product1_dm - PitchNormalLaw_DWork.Delay_DSTATE_e4) / *rtu_In_time_dt;
  rtb_Product1_ck = PitchNormalLaw_rtP.Gain5_Gain_h * *rtu_In_qk_dot_deg_s2;
  rtb_Product1_ck += *rtu_In_qk_deg_s;
  PitchNormalLaw_LagFilter_n(rtb_Product1_ck, PitchNormalLaw_rtP.LagFilter_C1_k, rtu_In_time_dt, &rtb_Y_i,
    &PitchNormalLaw_DWork.sf_LagFilter_f);
  rtb_Product1_ck = PitchNormalLaw_rtP.Gain6_Gain_g * *rtu_In_qk_dot_deg_s2;
  rtb_Divide_c4 = (((rtb_Gain_mj + rtb_Product_kz) * PitchNormalLaw_rtP.Gain1_Gain_a + PitchNormalLaw_rtP.Gain3_Gain_e *
                    rtb_Divide_c4) + (rtb_Y_i - rtb_Sum6) * PitchNormalLaw_rtP.Gain4_Gain) + rtb_Product1_ck;
  rtb_Sum6 = look1_binlxpw(*rtu_In_V_ias_kn, PitchNormalLaw_rtP.ScheduledGain1_BreakpointsForDimension1_h,
    PitchNormalLaw_rtP.ScheduledGain1_Table_c, 4U);
  rtb_Sum6 = (PitchNormalLaw_rtP.Constant2_Value_k - rtb_Y_i1) * (rtb_Divide_c4 * rtb_Sum6) *
    PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_Gain_j * *rtu_In_time_dt;
  rtb_OR = (*rtu_In_delta_eta_pos <= PitchNormalLaw_rtP.Constant_Value_o);
  rtb_OR = (rtb_OR && (*rtu_In_on_ground));
  rtb_OR = (rtb_OR || (rtb_Y_ku == 0.0) || (*rtu_In_tracking_mode_on));
  PitchNormalLaw_DWork.icLoad_p = (rtb_OR || PitchNormalLaw_DWork.icLoad_p);
  if (PitchNormalLaw_DWork.icLoad_p) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.Constant_Value_jk - rtb_Sum6;
  }

  PitchNormalLaw_DWork.Delay_DSTATE_cl += rtb_Sum6;
  if (PitchNormalLaw_DWork.Delay_DSTATE_cl > PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit_p;
  } else if (PitchNormalLaw_DWork.Delay_DSTATE_cl < PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_h) {
    PitchNormalLaw_DWork.Delay_DSTATE_cl = PitchNormalLaw_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit_h;
  }

  if (*rtu_In_on_ground) {
    if (rtb_Gain_cb > PitchNormalLaw_rtP.Saturation_UpperSat) {
      rtb_Sum6 = PitchNormalLaw_rtP.Saturation_UpperSat;
    } else if (rtb_Gain_cb < PitchNormalLaw_rtP.Saturation_LowerSat) {
      rtb_Sum6 = PitchNormalLaw_rtP.Saturation_LowerSat;
    } else {
      rtb_Sum6 = rtb_Gain_cb;
    }
  } else {
    rtb_Sum6 = PitchNormalLaw_rtP.Constant1_Value_h;
  }

  rtb_Y_i1 = PitchNormalLaw_DWork.Delay_DSTATE_cl + rtb_Sum6;
  if (rtb_Y_ku > PitchNormalLaw_rtP.Saturation_UpperSat_m) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_UpperSat_m;
  } else if (rtb_Y_ku < PitchNormalLaw_rtP.Saturation_LowerSat_b) {
    rtb_Sum6 = PitchNormalLaw_rtP.Saturation_LowerSat_b;
  } else {
    rtb_Sum6 = rtb_Y_ku;
  }

  rtb_v_target = ((PitchNormalLaw_rtP.Constant_Value_h - rtb_Sum6) * rtb_Gain_cb + rtb_Y_i1 * rtb_Sum6) * rtb_Divide_o +
    rtb_Saturation3;
  if (rtb_v_target > PitchNormalLaw_rtP.Saturation_UpperSat_kp) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_UpperSat_kp;
  } else if (rtb_v_target < PitchNormalLaw_rtP.Saturation_LowerSat_a4) {
    rtb_v_target = PitchNormalLaw_rtP.Saturation_LowerSat_a4;
  }

  PitchNormalLaw_RateLimiter(rtb_v_target, PitchNormalLaw_rtP.RateLimitereta_up, PitchNormalLaw_rtP.RateLimitereta_lo,
    rtu_In_time_dt, PitchNormalLaw_rtP.RateLimitereta_InitialCondition, rty_Out_eta_deg,
    &PitchNormalLaw_DWork.sf_RateLimiter_b);
  if (rtb_eta_trim_deg_should_freeze == PitchNormalLaw_rtP.CompareToConstant_const) {
    rtb_Sum6 = PitchNormalLaw_rtP.Constant_Value;
  } else {
    rtb_Sum6 = *rty_Out_eta_deg;
  }

  rtb_Gain_cb = PitchNormalLaw_rtP.Gain_Gain_c * rtb_Sum6;
  if (rtb_Gain_cb > rtb_Gain1) {
    *rty_Out_eta_trim_dot_deg_s = rtb_Gain1;
  } else if (rtb_Gain_cb < rtb_eta_trim_deg_rate_limit_lo_deg_s) {
    *rty_Out_eta_trim_dot_deg_s = rtb_eta_trim_deg_rate_limit_lo_deg_s;
  } else {
    *rty_Out_eta_trim_dot_deg_s = rtb_Gain_cb;
  }

  PitchNormalLaw_DWork.Delay_DSTATE = rtb_ManualSwitch;
  PitchNormalLaw_DWork.Delay_DSTATE_n = rtb_Gain1_h;
  PitchNormalLaw_DWork.Delay_DSTATE_c = rtb_Gain_ot;
  PitchNormalLaw_DWork.Delay_DSTATE_l = rtb_Divide_an;
  PitchNormalLaw_DWork.Delay_DSTATE_k = rtb_Gain1_g;
  PitchNormalLaw_DWork.Delay_DSTATE_d = rtb_Saturation3_i;
  PitchNormalLaw_DWork.Delay_DSTATE_b = rtb_Divide_m;
  PitchNormalLaw_DWork.Delay_DSTATE_en = rtb_Gain1_nj;
  PitchNormalLaw_DWork.Delay_DSTATE_i = rtb_Bias_f;
  PitchNormalLaw_DWork.Delay_DSTATE_f = rtb_Divide_c;
  PitchNormalLaw_DWork.Delay_DSTATE_g5 = rtb_Product1_d;
  PitchNormalLaw_DWork.Delay_DSTATE_j = rtb_Divide_o4;
  PitchNormalLaw_DWork.Delay_DSTATE_ca = rtb_Divide_a;
  PitchNormalLaw_DWork.Delay_DSTATE_bg = rtb_alpha_err_gain;
  PitchNormalLaw_DWork.Delay_DSTATE_o = rtb_qk_dot_gain;
  PitchNormalLaw_DWork.Delay_DSTATE_jv = rtb_Y_g;
  PitchNormalLaw_DWork.Delay_DSTATE_lf = rtb_Gain1_n;
  PitchNormalLaw_DWork.Delay_DSTATE_kd = rtb_Abs;
  PitchNormalLaw_DWork.Delay_DSTATE_ku = rtb_Y_j;
  PitchNormalLaw_DWork.Delay_DSTATE_gl = rtb_Divide_n;
  PitchNormalLaw_DWork.Delay_DSTATE_m = rtb_Bias_fd;
  PitchNormalLaw_DWork.Delay_DSTATE_k2 = rtb_Divide_py;
  PitchNormalLaw_DWork.Delay_DSTATE_jh = rtb_Divide_g4;
  PitchNormalLaw_DWork.Delay_DSTATE_dy = rtb_Tsxlo;
  PitchNormalLaw_DWork.Delay_DSTATE_e5 = rtb_Divide_e;
  PitchNormalLaw_DWork.Delay_DSTATE_gz = rtb_Y_b;
  PitchNormalLaw_DWork.Delay_DSTATE_lf1 = rtb_Gain1_e;
  PitchNormalLaw_DWork.Delay_DSTATE_h = rtb_Divide_cq;
  PitchNormalLaw_DWork.Delay_DSTATE_ds = rtb_Divide1_e;
  PitchNormalLaw_DWork.Delay_DSTATE_jt = rtb_Gain_bu;
  PitchNormalLaw_DWork.icLoad = false;
  PitchNormalLaw_DWork.Delay_DSTATE_ej = rtb_Divide;
  PitchNormalLaw_DWork.Delay_DSTATE_e4 = rtb_Product1_dm;
  PitchNormalLaw_DWork.icLoad_p = false;
}

PitchNormalLaw::PitchNormalLaw():
  PitchNormalLaw_B(),
  PitchNormalLaw_DWork()
{
}

PitchNormalLaw::~PitchNormalLaw() = default;
