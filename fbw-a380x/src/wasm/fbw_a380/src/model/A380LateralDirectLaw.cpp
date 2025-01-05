#include "A380LateralDirectLaw.h"
#include "rtwtypes.h"
#include <cmath>

A380LateralDirectLaw::Parameters_A380LateralDirectLaw_T A380LateralDirectLaw::A380LateralDirectLaw_rtP{

  0.0,

  0.0,

  -50.0,

  -50.0,

  50.0,

  50.0,

  0.0,

  -30.0,

  -30.0
};

void A380LateralDirectLaw::A380LateralDirectLaw_RateLimiter_Reset(rtDW_RateLimiter_A380LateralDirectLaw_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380LateralDirectLaw::A380LateralDirectLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T
  *rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380LateralDirectLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380LateralDirectLaw::reset(void)
{
  A380LateralDirectLaw_RateLimiter_Reset(&A380LateralDirectLaw_DWork.sf_RateLimiter);
  A380LateralDirectLaw_RateLimiter_Reset(&A380LateralDirectLaw_DWork.sf_RateLimiter_n);
}

void A380LateralDirectLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_xi_pos, const real_T
  *rtu_In_delta_zeta_pos, real_T *rty_Out_xi_inboard_deg, real_T *rty_Out_xi_midboard_deg, real_T
  *rty_Out_xi_outboard_deg, real_T *rty_Out_xi_spoiler_deg, real_T *rty_Out_zeta_upper_deg, real_T
  *rty_Out_zeta_lower_deg)
{
  real_T rtb_Gain1;
  *rty_Out_xi_spoiler_deg = A380LateralDirectLaw_rtP.Constant_Value;
  rtb_Gain1 = A380LateralDirectLaw_rtP.Gain1_Gain * *rtu_In_delta_xi_pos;
  A380LateralDirectLaw_RateLimiter(rtb_Gain1, A380LateralDirectLaw_rtP.RateLimiterVariableTs_up,
    A380LateralDirectLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    A380LateralDirectLaw_rtP.RateLimiterVariableTs_InitialCondition, rty_Out_xi_outboard_deg,
    &A380LateralDirectLaw_DWork.sf_RateLimiter);
  *rty_Out_xi_inboard_deg = *rty_Out_xi_outboard_deg;
  *rty_Out_xi_midboard_deg = *rty_Out_xi_outboard_deg;
  rtb_Gain1 = A380LateralDirectLaw_rtP.Gain2_Gain * *rtu_In_delta_zeta_pos;
  A380LateralDirectLaw_RateLimiter(rtb_Gain1, A380LateralDirectLaw_rtP.RateLimiterVariableTs1_up,
    A380LateralDirectLaw_rtP.RateLimiterVariableTs1_lo, rtu_In_time_dt,
    A380LateralDirectLaw_rtP.RateLimiterVariableTs1_InitialCondition, rty_Out_zeta_lower_deg,
    &A380LateralDirectLaw_DWork.sf_RateLimiter_n);
  *rty_Out_zeta_upper_deg = *rty_Out_zeta_lower_deg;
}

A380LateralDirectLaw::A380LateralDirectLaw():
  A380LateralDirectLaw_DWork()
{
}

A380LateralDirectLaw::~A380LateralDirectLaw() = default;
