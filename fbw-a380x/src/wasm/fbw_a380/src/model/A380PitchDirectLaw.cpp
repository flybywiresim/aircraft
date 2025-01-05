#include "A380PitchDirectLaw.h"
#include "rtwtypes.h"
#include <cmath>

A380PitchDirectLaw::Parameters_A380PitchDirectLaw_T A380PitchDirectLaw::A380PitchDirectLaw_rtP{

  0.0,

  -45.0,

  45.0,

  0.0,

  3.5,

  -11.0,

  -30.0,

  17.0,

  -30.0
};

void A380PitchDirectLaw::reset(void)
{
  A380PitchDirectLaw_DWork.pY_not_empty = false;
}

void A380PitchDirectLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_eta_pos, real_T *rty_Out_eta_deg,
  real_T *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up)
{
  real_T rtb_Gain;
  *rty_Out_eta_trim_dot_deg_s = A380PitchDirectLaw_rtP.Constant_Value;
  *rty_Out_eta_trim_limit_up = A380PitchDirectLaw_rtP.Constant2_Value;
  *rty_Out_eta_trim_limit_lo = A380PitchDirectLaw_rtP.Constant3_Value;
  rtb_Gain = A380PitchDirectLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  if (!A380PitchDirectLaw_DWork.pY_not_empty) {
    A380PitchDirectLaw_DWork.pY = A380PitchDirectLaw_rtP.RateLimitereta_InitialCondition;
    A380PitchDirectLaw_DWork.pY_not_empty = true;
  }

  if (rtb_Gain > A380PitchDirectLaw_rtP.Saturation_UpperSat) {
    rtb_Gain = A380PitchDirectLaw_rtP.Saturation_UpperSat;
  } else if (rtb_Gain < A380PitchDirectLaw_rtP.Saturation_LowerSat) {
    rtb_Gain = A380PitchDirectLaw_rtP.Saturation_LowerSat;
  }

  A380PitchDirectLaw_DWork.pY += std::fmax(std::fmin(rtb_Gain - A380PitchDirectLaw_DWork.pY, std::abs
    (A380PitchDirectLaw_rtP.RateLimitereta_up) * *rtu_In_time_dt), -std::abs(A380PitchDirectLaw_rtP.RateLimitereta_lo) *
    *rtu_In_time_dt);
  *rty_Out_eta_deg = A380PitchDirectLaw_DWork.pY;
}

A380PitchDirectLaw::A380PitchDirectLaw():
  A380PitchDirectLaw_DWork()
{
}

A380PitchDirectLaw::~A380PitchDirectLaw() = default;
