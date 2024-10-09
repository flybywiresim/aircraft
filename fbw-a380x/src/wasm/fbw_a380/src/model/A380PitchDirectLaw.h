#ifndef A380PitchDirectLaw_h_
#define A380PitchDirectLaw_h_
#include "rtwtypes.h"
#include "A380PitchDirectLaw_types.h"
#include <cstring>

class A380PitchDirectLaw final
{
 public:
  struct D_Work_A380PitchDirectLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct Parameters_A380PitchDirectLaw_T {
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

  A380PitchDirectLaw(A380PitchDirectLaw const&) = delete;
  A380PitchDirectLaw& operator= (A380PitchDirectLaw const&) & = delete;
  A380PitchDirectLaw(A380PitchDirectLaw &&) = delete;
  A380PitchDirectLaw& operator= (A380PitchDirectLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_eta_pos, real_T *rty_Out_eta_deg, real_T
            *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up);
  void reset();
  A380PitchDirectLaw();
  ~A380PitchDirectLaw();
 private:
  D_Work_A380PitchDirectLaw_T A380PitchDirectLaw_DWork;
  static Parameters_A380PitchDirectLaw_T A380PitchDirectLaw_rtP;
};

extern A380PitchDirectLaw::Parameters_A380PitchDirectLaw_T A380PitchDirectLaw_rtP;

#endif

