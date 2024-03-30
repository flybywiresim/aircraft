#include "LateralDirectLaw.h"
#include "rtwtypes.h"
#include <cmath>

LateralDirectLaw::Parameters_LateralDirectLaw_T LateralDirectLaw::LateralDirectLaw_rtP{

  0.0,

  -50.0,

  50.0,

  0.0,

  -25.0
};

void LateralDirectLaw::reset(void)
{
  LateralDirectLaw_DWork.pY_not_empty = false;
}

void LateralDirectLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_xi_pos, real_T *rty_Out_xi_deg,
  real_T *rty_Out_zeta_deg)
{
  real_T rtb_Gain1;
  *rty_Out_zeta_deg = LateralDirectLaw_rtP.Constant1_Value;
  rtb_Gain1 = LateralDirectLaw_rtP.Gain1_Gain * *rtu_In_delta_xi_pos;
  if (!LateralDirectLaw_DWork.pY_not_empty) {
    LateralDirectLaw_DWork.pY = LateralDirectLaw_rtP.RateLimiterVariableTs_InitialCondition;
    LateralDirectLaw_DWork.pY_not_empty = true;
  }

  LateralDirectLaw_DWork.pY += std::fmax(std::fmin(rtb_Gain1 - LateralDirectLaw_DWork.pY, std::abs
    (LateralDirectLaw_rtP.RateLimiterVariableTs_up) * *rtu_In_time_dt), -std::abs
    (LateralDirectLaw_rtP.RateLimiterVariableTs_lo) * *rtu_In_time_dt);
  *rty_Out_xi_deg = LateralDirectLaw_DWork.pY;
}

LateralDirectLaw::LateralDirectLaw():
  LateralDirectLaw_DWork()
{
}

LateralDirectLaw::~LateralDirectLaw() = default;
