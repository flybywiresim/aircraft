#ifndef A380LateralDirectLaw_h_
#define A380LateralDirectLaw_h_
#include "rtwtypes.h"
#include "A380LateralDirectLaw_types.h"
#include <cstring>

class A380LateralDirectLaw final
{
 public:
  struct rtDW_RateLimiter_A380LateralDirectLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_A380LateralDirectLaw_T {
    rtDW_RateLimiter_A380LateralDirectLaw_T sf_RateLimiter_n;
    rtDW_RateLimiter_A380LateralDirectLaw_T sf_RateLimiter;
  };

  struct Parameters_A380LateralDirectLaw_T {
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs1_up;
    real_T Constant_Value;
    real_T Gain1_Gain;
    real_T Gain2_Gain;
  };

  A380LateralDirectLaw(A380LateralDirectLaw const&) = delete;
  A380LateralDirectLaw& operator= (A380LateralDirectLaw const&) & = delete;
  A380LateralDirectLaw(A380LateralDirectLaw &&) = delete;
  A380LateralDirectLaw& operator= (A380LateralDirectLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_delta_xi_pos, const real_T *rtu_In_delta_zeta_pos, real_T
            *rty_Out_xi_inboard_deg, real_T *rty_Out_xi_midboard_deg, real_T *rty_Out_xi_outboard_deg, real_T
            *rty_Out_xi_spoiler_deg, real_T *rty_Out_zeta_upper_deg, real_T *rty_Out_zeta_lower_deg);
  void reset();
  A380LateralDirectLaw();
  ~A380LateralDirectLaw();
 private:
  D_Work_A380LateralDirectLaw_T A380LateralDirectLaw_DWork;
  static Parameters_A380LateralDirectLaw_T A380LateralDirectLaw_rtP;
  static void A380LateralDirectLaw_RateLimiter_Reset(rtDW_RateLimiter_A380LateralDirectLaw_T *localDW);
  static void A380LateralDirectLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
    rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380LateralDirectLaw_T *localDW);
};

extern A380LateralDirectLaw::Parameters_A380LateralDirectLaw_T A380LateralDirectLaw_rtP;

#endif

