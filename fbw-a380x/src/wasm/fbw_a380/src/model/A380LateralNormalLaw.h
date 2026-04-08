#ifndef A380LateralNormalLaw_h_
#define A380LateralNormalLaw_h_
#include "rtwtypes.h"
#include "A380LateralNormalLaw_types.h"
#include <cstring>

class A380LateralNormalLaw final
{
 public:
  struct rtDW_RateLimiter_A380LateralNormalLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_A380LateralNormalLaw_T {
    real_T Delay_DSTATE;
    real_T Delay1_DSTATE;
    real_T Delay_DSTATE_o;
    real_T pY;
    boolean_T icLoad;
    boolean_T pY_not_empty;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_g;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_i;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_k;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter;
  };

  struct Parameters_A380LateralNormalLaw_T {
    real_T ScheduledGain_BreakpointsForDimension1[5];
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTs_Gain_a;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_InitialCondition;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition_e;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit_o;
    real_T ScheduledGain_Table[5];
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit_g;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimiterVariableTs1_lo_k;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs1_up;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimiterVariableTs1_up_d;
    real_T BankAngleProtection2_tableData[5];
    real_T BankAngleProtection2_bp01Data[5];
    real_T BankAngleProtection_tableData[9];
    real_T BankAngleProtection_bp01Data[9];
    real_T BankAngleProtection1_tableData[9];
    real_T BankAngleProtection1_bp01Data[9];
    real_T Gain_Gain;
    real_T uDLookupTable_tableData[4];
    real_T uDLookupTable_bp01Data[4];
    real_T Gain1_Gain;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain_Gain_c;
    real_T Gain1_Gain_i;
    real_T Constant_Value;
    real_T Constant_Value_m;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Saturation_UpperSat_e;
    real_T Saturation_LowerSat_k;
    real_T Constant_Value_g;
    real_T Saturation_UpperSat_l;
    real_T Saturation_LowerSat_j;
    real_T Constant_Value_o;
    real_T Constant2_Value;
    real_T Gain1_Gain_o;
    real_T Saturation3_UpperSat;
    real_T Saturation3_LowerSat;
    real_T Delay1_InitialCondition;
    real_T Gain1_Gain_f;
    real_T Gain1_Gain_l;
    real_T Saturation_UpperSat_ek;
    real_T Saturation_LowerSat_jd;
    real_T Gain6_Gain;
    real_T Gain_Gain_i;
    real_T Gain1_Gain_j;
    real_T Gain1_Gain_d;
    real_T Gain1_Gain_h;
    real_T Gain_Gain_cw;
    real_T Saturation_UpperSat_h;
    real_T Saturation_LowerSat_a;
    real_T Constant_Value_j;
  };

  void init();
  A380LateralNormalLaw(A380LateralNormalLaw const&) = delete;
  A380LateralNormalLaw& operator= (A380LateralNormalLaw const&) & = delete;
  A380LateralNormalLaw(A380LateralNormalLaw &&) = delete;
  A380LateralNormalLaw& operator= (A380LateralNormalLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T
            *rtu_In_r_deg_s, const real_T *rtu_In_pk_deg_s, const real_T *rtu_In_beta_deg, const real_T *rtu_In_V_ias_kn,
            const real_T *rtu_In_V_tas_kn, const real_T *rtu_In_delta_xi_pos, const real_T *rtu_In_delta_zeta_pos, const
            boolean_T *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T
            *rtu_In_high_aoa_prot_active, const boolean_T *rtu_In_high_speed_prot_active, const real_T
            *rtu_In_ap_phi_c_deg, const real_T *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T
            *rty_Out_xi_deg, real_T *rty_Out_zeta_deg);
  void reset();
  A380LateralNormalLaw();
  ~A380LateralNormalLaw();
 private:
  D_Work_A380LateralNormalLaw_T A380LateralNormalLaw_DWork;
  static Parameters_A380LateralNormalLaw_T A380LateralNormalLaw_rtP;
  static void A380LateralNormalLaw_RateLimiter_Reset(rtDW_RateLimiter_A380LateralNormalLaw_T *localDW);
  static void A380LateralNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
    rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380LateralNormalLaw_T *localDW);
};

extern A380LateralNormalLaw::Parameters_A380LateralNormalLaw_T A380LateralNormalLaw_rtP;

#endif

