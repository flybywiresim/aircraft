#ifndef LateralDirectLaw_h_
#define LateralDirectLaw_h_
#include "rtwtypes.h"
#include "LateralDirectLaw_types.h"
#include <cstring>

class LateralDirectLaw final
{
 public:
  struct D_Work_LateralDirectLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct Parameters_LateralDirectLaw_T {
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs_up;
    real_T Constant1_Value;
    real_T Gain1_Gain;
  };

  LateralDirectLaw(LateralDirectLaw const&) = delete;
  LateralDirectLaw& operator= (LateralDirectLaw const&) & = delete;
  LateralDirectLaw(LateralDirectLaw &&) = delete;
  LateralDirectLaw& operator= (LateralDirectLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_xi_pos, real_T *rty_Out_xi_deg, real_T
            *rty_Out_zeta_deg);
  void reset();
  LateralDirectLaw();
  ~LateralDirectLaw();
 private:
  D_Work_LateralDirectLaw_T LateralDirectLaw_DWork;
  static Parameters_LateralDirectLaw_T LateralDirectLaw_rtP;
};

extern LateralDirectLaw::Parameters_LateralDirectLaw_T LateralDirectLaw_rtP;

#endif

