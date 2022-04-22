#ifndef RTW_HEADER_LateralDirectLaw_h_
#define RTW_HEADER_LateralDirectLaw_h_
#include "rtwtypes.h"
#include "LateralDirectLaw_types.h"
#include <cstring>

extern lateral_normal_output rtP_lateral_normal_law_output_MATLABStruct;
class LateralDirectLaw final
{
 public:
  struct rtDW_RateLimiter_LateralDirectLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_LateralDirectLaw_T {
    uint8_T is_active_c5_LateralDirectLaw;
    uint8_T is_c5_LateralDirectLaw;
    rtDW_RateLimiter_LateralDirectLaw_T sf_RateLimiter_j;
    rtDW_RateLimiter_LateralDirectLaw_T sf_RateLimiter;
  };

  struct Parameters_LateralDirectLaw_T {
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs_InitialCondition_k;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs_lo_b;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs_up_d;
    real_T Gain_Gain;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain1_Gain;
    real_T Constant_Value;
    real_T Constant1_Value;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Saturation_UpperSat_l;
    real_T Saturation_LowerSat_o;
    real_T Constant_Value_l;
  };

  LateralDirectLaw(LateralDirectLaw const&) = delete;
  LateralDirectLaw& operator= (LateralDirectLaw const&) & = delete;
  LateralDirectLaw(LateralDirectLaw &&) = delete;
  LateralDirectLaw& operator= (LateralDirectLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_H_radio_ft, const real_T *
            rtu_In_delta_xi_pos, const boolean_T *rtu_In_on_ground, real_T *rty_Out_xi_deg, real_T *rty_Out_zeta_deg);
  LateralDirectLaw();
  ~LateralDirectLaw();
 private:
  D_Work_LateralDirectLaw_T LateralDirectLaw_DWork;
  static Parameters_LateralDirectLaw_T LateralDirectLaw_rtP;
  static void LateralDirectLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    real_T *rty_Y, rtDW_RateLimiter_LateralDirectLaw_T *localDW);
};

extern LateralDirectLaw::Parameters_LateralDirectLaw_T LateralDirectLaw_rtP;

#endif

