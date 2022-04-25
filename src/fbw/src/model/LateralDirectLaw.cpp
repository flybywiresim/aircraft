#include "LateralDirectLaw.h"
#include "rtwtypes.h"
#include <cmath>

const uint8_T LateralDirectLaw_IN_FlightMode{ 1U };

const uint8_T LateralDirectLaw_IN_GroundMode{ 2U };

LateralDirectLaw::Parameters_LateralDirectLaw_T LateralDirectLaw::LateralDirectLaw_rtP{

  0.0,

  0.0,

  -2.0,

  -50.0,

  2.0,

  50.0,

  1.0,

  0.0,

  0.0,

  25.0
};

void LateralDirectLaw::LateralDirectLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_LateralDirectLaw_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs(rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void LateralDirectLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T
  *rtu_In_H_radio_ft, const real_T *rtu_In_delta_xi_pos, const boolean_T *rtu_In_on_ground, real_T *rty_Out_xi_deg,
  real_T *rty_Out_zeta_deg)
{
  real_T rtb_Gain1;
  real_T rtb_Y_i;
  int32_T rtb_in_flight;
  if (LateralDirectLaw_DWork.is_active_c5_LateralDirectLaw == 0U) {
    LateralDirectLaw_DWork.is_active_c5_LateralDirectLaw = 1U;
    LateralDirectLaw_DWork.is_c5_LateralDirectLaw = LateralDirectLaw_IN_GroundMode;
    rtb_in_flight = 0;
  } else if (LateralDirectLaw_DWork.is_c5_LateralDirectLaw == LateralDirectLaw_IN_FlightMode) {
    if (*rtu_In_on_ground) {
      LateralDirectLaw_DWork.is_c5_LateralDirectLaw = LateralDirectLaw_IN_GroundMode;
      rtb_in_flight = 0;
    } else {
      rtb_in_flight = 1;
    }
  } else if (((!*rtu_In_on_ground) && (*rtu_In_Theta_deg > 8.0)) || (*rtu_In_H_radio_ft > 400.0)) {
    LateralDirectLaw_DWork.is_c5_LateralDirectLaw = LateralDirectLaw_IN_FlightMode;
    rtb_in_flight = 1;
  } else {
    rtb_in_flight = 0;
  }

  if (rtb_in_flight > LateralDirectLaw_rtP.Saturation_UpperSat) {
    rtb_Gain1 = LateralDirectLaw_rtP.Saturation_UpperSat;
  } else if (rtb_in_flight < LateralDirectLaw_rtP.Saturation_LowerSat) {
    rtb_Gain1 = LateralDirectLaw_rtP.Saturation_LowerSat;
  } else {
    rtb_Gain1 = rtb_in_flight;
  }

  LateralDirectLaw_RateLimiter(rtb_Gain1, LateralDirectLaw_rtP.RateLimiterVariableTs_up,
    LateralDirectLaw_rtP.RateLimiterVariableTs_lo, rtu_In_time_dt,
    LateralDirectLaw_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_i, &LateralDirectLaw_DWork.sf_RateLimiter);
  *rty_Out_zeta_deg = LateralDirectLaw_rtP.Constant1_Value;
  rtb_Gain1 = LateralDirectLaw_rtP.Gain1_Gain * *rtu_In_delta_xi_pos;
  LateralDirectLaw_RateLimiter(rtb_Gain1, LateralDirectLaw_rtP.RateLimiterVariableTs_up_d,
    LateralDirectLaw_rtP.RateLimiterVariableTs_lo_b, rtu_In_time_dt,
    LateralDirectLaw_rtP.RateLimiterVariableTs_InitialCondition_k, rty_Out_xi_deg,
    &LateralDirectLaw_DWork.sf_RateLimiter_j);
}

LateralDirectLaw::LateralDirectLaw():
  LateralDirectLaw_DWork()
{
}

LateralDirectLaw::~LateralDirectLaw()
{
}
