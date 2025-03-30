#ifndef PitchDirectLaw_h_
#define PitchDirectLaw_h_
#include "rtwtypes.h"
#include "PitchDirectLaw_types.h"
#include <cstring>

class PitchDirectLaw final
{
 public:
  struct D_Work_PitchDirectLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct Parameters_PitchDirectLaw_T {
    real_T RateLimitereta_InitialCondition;
    real_T RateLimitereta_lo;
    real_T RateLimitereta_up;
    real_T Constant_Value;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T Gain_Gain;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
  };

  PitchDirectLaw(PitchDirectLaw const&) = delete;
  PitchDirectLaw& operator= (PitchDirectLaw const&) & = delete;
  PitchDirectLaw(PitchDirectLaw &&) = delete;
  PitchDirectLaw& operator= (PitchDirectLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_eta_pos, real_T *rty_Out_eta_deg, real_T
            *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up);
  void reset();
  PitchDirectLaw();
  ~PitchDirectLaw();
 private:
  D_Work_PitchDirectLaw_T PitchDirectLaw_DWork;
  static Parameters_PitchDirectLaw_T PitchDirectLaw_rtP;
};

extern PitchDirectLaw::Parameters_PitchDirectLaw_T PitchDirectLaw_rtP;

#endif

