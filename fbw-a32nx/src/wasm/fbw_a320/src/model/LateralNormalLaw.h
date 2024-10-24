#ifndef LateralNormalLaw_h_
#define LateralNormalLaw_h_
#include "rtwtypes.h"
#include "LateralNormalLaw_types.h"
#include <cstring>

class LateralNormalLaw final
{
 public:
  struct rtDW_RateLimiter_LateralNormalLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_LateralNormalLaw_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_o;
    real_T Delay_DSTATE_d;
    real_T pY;
    real_T pY_b;
    uint8_T is_active_c5_LateralNormalLaw;
    uint8_T is_c5_LateralNormalLaw;
    boolean_T icLoad;
    boolean_T pY_not_empty;
    boolean_T pY_not_empty_j;
    rtDW_RateLimiter_LateralNormalLaw_T sf_RateLimiter_j;
    rtDW_RateLimiter_LateralNormalLaw_T sf_RateLimiter_d;
    rtDW_RateLimiter_LateralNormalLaw_T sf_RateLimiter;
  };

  struct Parameters_LateralNormalLaw_T {
    real_T ScheduledGain_BreakpointsForDimension1[5];
    real_T ScheduledGain1_BreakpointsForDimension1[4];
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T APEngagedRateLimiter_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T RateLimiterVariableTs_InitialCondition_k;
    real_T RateLimiterVariableTs1_InitialCondition_m;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T ScheduledGain_Table[5];
    real_T ScheduledGain1_Table[4];
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T APEngagedRateLimiter_lo;
    real_T RateLimiterVariableTs_lo_b;
    real_T RateLimiterVariableTs1_lo_m;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs1_up;
    real_T APEngagedRateLimiter_up;
    real_T RateLimiterVariableTs_up_d;
    real_T RateLimiterVariableTs1_up_o;
    real_T BankAngleProtection2_tableData[5];
    real_T BankAngleProtection2_bp01Data[5];
    real_T BankAngleProtection_tableData[9];
    real_T BankAngleProtection_bp01Data[9];
    real_T BankAngleProtection1_tableData[9];
    real_T BankAngleProtection1_bp01Data[9];
    real_T Constant_Value;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain_Gain;
    real_T Constant_Value_l;
    real_T Constant_Value_m;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Saturation_UpperSat_l;
    real_T Saturation_LowerSat_o;
    real_T Constant_Value_l1;
    real_T Delay_InitialCondition;
    real_T Gain1_Gain;
    real_T Saturation_UpperSat_a;
    real_T Saturation_LowerSat_ov;
    real_T Gain1_Gain_n;
    real_T Gain1_Gain_b;
    real_T Gain1_Gain_c;
    real_T Gain_Gain_p;
    real_T Limiterxi_UpperSat;
    real_T Limiterxi_LowerSat;
    real_T Gain1_Gain_j;
    real_T Constant2_Value;
    real_T Gain1_Gain_p;
    real_T Saturation_UpperSat_c;
    real_T Saturation_LowerSat_i;
    real_T Gain6_Gain;
    real_T Gain_Gain_g;
    real_T Gain1_Gain_k;
    real_T Gain_Gain_b;
    real_T Saturation1_UpperSat_c;
    real_T Saturation1_LowerSat_p;
    real_T Saturation_UpperSat_j;
    real_T Saturation_LowerSat_n;
    real_T Saturation2_UpperSat;
    real_T Saturation2_LowerSat;
    real_T Constant_Value_b;
  };

  void init();
  LateralNormalLaw(LateralNormalLaw const&) = delete;
  LateralNormalLaw& operator= (LateralNormalLaw const&) & = delete;
  LateralNormalLaw(LateralNormalLaw &&) = delete;
  LateralNormalLaw& operator= (LateralNormalLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T
            *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn,
            const real_T *rtu_In_H_radio_ft, const real_T *rtu_In_delta_xi_pos, const real_T *rtu_In_delta_zeta_pos,
            const boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
            *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T
            *rtu_In_ap_phi_c_deg, const real_T *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T
            *rty_Out_xi_deg, real_T *rty_Out_zeta_deg);
  void reset();
  LateralNormalLaw();
  ~LateralNormalLaw();
 private:
  D_Work_LateralNormalLaw_T LateralNormalLaw_DWork;
  static Parameters_LateralNormalLaw_T LateralNormalLaw_rtP;
  static void LateralNormalLaw_RateLimiter_Reset(rtDW_RateLimiter_LateralNormalLaw_T *localDW);
  static void LateralNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
    rtu_init, real_T *rty_Y, rtDW_RateLimiter_LateralNormalLaw_T *localDW);
};

extern LateralNormalLaw::Parameters_LateralNormalLaw_T LateralNormalLaw_rtP;

#endif

