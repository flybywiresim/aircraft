#include "PitchDirectLaw.h"
#include "rtwtypes.h"
#include <cmath>

PitchDirectLaw::Parameters_PitchDirectLaw_T PitchDirectLaw::PitchDirectLaw_rtP{

  0.0,

  -45.0,

  45.0,

  0.0,

  -30.0
};

void PitchDirectLaw::step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_eta_pos, real_T *rty_Out_eta_deg,
  real_T *rty_Out_eta_trim_deg)
{
  real_T rtb_Gain;
  *rty_Out_eta_trim_deg = PitchDirectLaw_rtP.Constant_Value;
  rtb_Gain = PitchDirectLaw_rtP.Gain_Gain * *rtu_In_delta_eta_pos;
  if (!PitchDirectLaw_DWork.pY_not_empty) {
    PitchDirectLaw_DWork.pY = PitchDirectLaw_rtP.RateLimitereta_InitialCondition;
    PitchDirectLaw_DWork.pY_not_empty = true;
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

PitchDirectLaw::~PitchDirectLaw()
{
}
