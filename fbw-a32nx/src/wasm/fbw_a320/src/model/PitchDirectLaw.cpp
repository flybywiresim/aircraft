#include "PitchDirectLaw.h"
#include "rtwtypes.h"
#include <cmath>

PitchDirectLaw::Parameters_PitchDirectLaw_T PitchDirectLaw::PitchDirectLaw_rtP{

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

void PitchDirectLaw::reset(void)
{
  PitchDirectLaw_DWork.pY_not_empty = false;
}

void PitchDirectLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_eta_pos, real_T *rty_Out_eta_deg,
  real_T *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up)
{
  real_T rtb_Gain;
  *rty_Out_eta_trim_dot_deg_s = PitchDirectLaw_rtP.Constant_Value;
  *rty_Out_eta_trim_limit_up = PitchDirectLaw_rtP.Constant2_Value;
  *rty_Out_eta_trim_limit_lo = PitchDirectLaw_rtP.Constant3_Value;
  rtb_Gain = PitchDirectLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  if (!PitchDirectLaw_DWork.pY_not_empty) {
    PitchDirectLaw_DWork.pY = PitchDirectLaw_rtP.RateLimitereta_InitialCondition;
    PitchDirectLaw_DWork.pY_not_empty = true;
  }

  if (rtb_Gain > PitchDirectLaw_rtP.Saturation_UpperSat) {
    rtb_Gain = PitchDirectLaw_rtP.Saturation_UpperSat;
  } else if (rtb_Gain < PitchDirectLaw_rtP.Saturation_LowerSat) {
    rtb_Gain = PitchDirectLaw_rtP.Saturation_LowerSat;
  }

  PitchDirectLaw_DWork.pY += std::fmax(std::fmin(rtb_Gain - PitchDirectLaw_DWork.pY, std::abs
    (PitchDirectLaw_rtP.RateLimitereta_up) * *rtu_In_time_dt), -std::abs(PitchDirectLaw_rtP.RateLimitereta_lo) *
    *rtu_In_time_dt);
  *rty_Out_eta_deg = PitchDirectLaw_DWork.pY;
}

PitchDirectLaw::PitchDirectLaw():
  PitchDirectLaw_DWork()
{
}

PitchDirectLaw::~PitchDirectLaw() = default;
