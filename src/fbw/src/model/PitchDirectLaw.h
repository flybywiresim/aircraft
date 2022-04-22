#ifndef RTW_HEADER_PitchDirectLaw_h_
#define RTW_HEADER_PitchDirectLaw_h_
#include "rtwtypes.h"
#include "PitchDirectLaw_types.h"
#include <cstring>

extern pitch_normal_output rtP_pitch_normal_law_output_MATLABStruct;
class PitchDirectLaw final
{
 public:
  struct rtDW_RateLimiter_PitchDirectLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_eta_trim_limit_lofreeze_PitchDirectLaw_T {
    real_T frozen_eta_trim;
    boolean_T frozen_eta_trim_not_empty;
  };

  struct BlockIO_PitchDirectLaw_T {
    real_T in_flight;
    real_T flare_Theta_c_deg;
    real_T flare_Theta_c_rate_deg_s;
  };

  struct D_Work_PitchDirectLaw_T {
    real_T Delay_DSTATE;
    real_T pY;
    real_T pU;
    real_T on_ground_time;
    uint8_T is_active_c6_PitchDirectLaw;
    uint8_T is_c6_PitchDirectLaw;
    uint8_T is_active_c7_PitchDirectLaw;
    uint8_T is_c7_PitchDirectLaw;
    uint8_T is_active_c8_PitchDirectLaw;
    uint8_T is_c8_PitchDirectLaw;
    uint8_T is_active_c3_PitchDirectLaw;
    uint8_T is_c3_PitchDirectLaw;
    uint8_T is_active_c9_PitchDirectLaw;
    uint8_T is_c9_PitchDirectLaw;
    uint8_T is_active_c2_PitchDirectLaw;
    uint8_T is_c2_PitchDirectLaw;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
    rtDW_RateLimiter_PitchDirectLaw_T sf_RateLimiter_b;
    rtDW_eta_trim_limit_lofreeze_PitchDirectLaw_T sf_eta_trim_limit_upfreeze;
    rtDW_eta_trim_limit_lofreeze_PitchDirectLaw_T sf_eta_trim_limit_lofreeze;
    rtDW_RateLimiter_PitchDirectLaw_T sf_RateLimiter_n;
    rtDW_RateLimiter_PitchDirectLaw_T sf_RateLimiter_c;
    rtDW_RateLimiter_PitchDirectLaw_T sf_RateLimiter_p;
    rtDW_RateLimiter_PitchDirectLaw_T sf_RateLimiter;
  };

  struct Parameters_PitchDirectLaw_T {
    real_T ScheduledGain_BreakpointsForDimension1[5];
    real_T LagFilter_C1;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T RateLimiterDynamicVariableTs_InitialCondition;
    real_T RateLimitereta_InitialCondition;
    real_T ScheduledGain_Table[5];
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimitereta_lo;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs1_up;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimitereta_up;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T Gain_Gain;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Constant1_Value;
    real_T Constant_Value;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Gain_Gain_b;
    real_T Constant_Value_f;
    real_T Constant_Value_j;
    real_T Constant_Value_d;
    uint8_T ManualSwitch_CurrentSetting;
    uint8_T ManualSwitch1_CurrentSetting;
  };

  void init();
  PitchDirectLaw(PitchDirectLaw const&) = delete;
  PitchDirectLaw& operator= (PitchDirectLaw const&) & = delete;
  PitchDirectLaw(PitchDirectLaw &&) = delete;
  PitchDirectLaw& operator= (PitchDirectLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_time_simulation_time, const real_T *rtu_In_nz_g, const
            real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_eta_trim_deg, const real_T
            *rtu_In_V_tas_kn, const real_T *rtu_In_H_radio_ft, const real_T *rtu_In_flaps_handle_index, const real_T
            *rtu_In_thrust_lever_1_pos, const real_T *rtu_In_thrust_lever_2_pos, const real_T *rtu_In_delta_eta_pos,
            const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
            *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, real_T *rty_Out_eta_deg,
            real_T *rty_Out_eta_trim_deg);
  PitchDirectLaw();
  ~PitchDirectLaw();
 private:
  BlockIO_PitchDirectLaw_T PitchDirectLaw_B;
  D_Work_PitchDirectLaw_T PitchDirectLaw_DWork;
  static Parameters_PitchDirectLaw_T PitchDirectLaw_rtP;
  static void PitchDirectLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    real_T *rty_Y, rtDW_RateLimiter_PitchDirectLaw_T *localDW);
  static void PitchDirectLaw_eta_trim_limit_lofreeze(real_T rtu_eta_trim, boolean_T rtu_trigger, real_T *rty_y,
    rtDW_eta_trim_limit_lofreeze_PitchDirectLaw_T *localDW);
};

extern PitchDirectLaw::Parameters_PitchDirectLaw_T PitchDirectLaw_rtP;

#endif

