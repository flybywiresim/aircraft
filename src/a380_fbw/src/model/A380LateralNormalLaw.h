#ifndef RTW_HEADER_A380LateralNormalLaw_h_
#define RTW_HEADER_A380LateralNormalLaw_h_
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
    real_T Delay_DSTATE_d;
    real_T pY;
    real_T pU;
    real_T pY_k;
    real_T pY_p;
    real_T pY_b;
    boolean_T icLoad;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
    boolean_T pY_not_empty_n;
    boolean_T pY_not_empty_i;
    boolean_T pY_not_empty_a;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_j;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_n;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter;
  };

  struct Parameters_A380LateralNormalLaw_T {
    real_T ScheduledGain_BreakpointsForDimension1[5];
    real_T ScheduledGain3_BreakpointsForDimension1[4];
    real_T ScheduledGain1_BreakpointsForDimension1[5];
    real_T LagFilter_C1;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs_InitialCondition_m;
    real_T RateLimiterVariableTs_InitialCondition_k;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition_m;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T ScheduledGain_Table[5];
    real_T ScheduledGain3_Table[4];
    real_T ScheduledGain1_Table[5];
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs_lo_k;
    real_T RateLimiterVariableTs_lo_b;
    real_T RateLimiterVariableTs1_lo;
    real_T RateLimiterVariableTs1_lo_n;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs_up_m;
    real_T RateLimiterVariableTs_up_d;
    real_T RateLimiterVariableTs1_up;
    real_T RateLimiterVariableTs1_up_j;
    real_T RateLimiterVariableTs2_up;
    real_T BankAngleProtection2_tableData[5];
    real_T BankAngleProtection2_bp01Data[5];
    real_T BankAngleProtection_tableData[9];
    real_T BankAngleProtection_bp01Data[9];
    real_T BankAngleProtection1_tableData[9];
    real_T BankAngleProtection1_bp01Data[9];
    real_T Constant_Value;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Delay_InitialCondition;
    real_T Gain1_Gain;
    real_T Saturation_UpperSat_a;
    real_T Saturation_LowerSat_o;
    real_T Saturation_UpperSat_g;
    real_T Saturation_LowerSat_e;
    real_T Gain1_Gain_n;
    real_T Gain1_Gain_b;
    real_T Gain1_Gain_c;
    real_T Gain_Gain;
    real_T Limiterxi_UpperSat;
    real_T Limiterxi_LowerSat;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Saturation_UpperSat_l;
    real_T Saturation_LowerSat_og;
    real_T Gain_Gain_c;
    real_T Constant_Value_l;
    real_T Constant_Value_m;
    real_T Constant1_Value;
  };

  void init(real_T *rty_Out_xi_inboard_deg, real_T *rty_Out_xi_midboard_deg, real_T *rty_Out_xi_outboard_deg, real_T
            *rty_Out_zeta_upper_deg, real_T *rty_Out_zeta_lower_deg);
  A380LateralNormalLaw(A380LateralNormalLaw const&) = delete;
  A380LateralNormalLaw& operator= (A380LateralNormalLaw const&) & = delete;
  A380LateralNormalLaw(A380LateralNormalLaw &&) = delete;
  A380LateralNormalLaw& operator= (A380LateralNormalLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_pk_deg_s, const real_T
            *rtu_In_V_ias_kn, const real_T *rtu_In_delta_xi_pos, const real_T *rtu_In_delta_zeta_pos, const boolean_T
            *rtu_In_on_ground, const boolean_T *rtu_In_tracking_mode_on, const boolean_T *rtu_In_high_aoa_prot_active,
            const boolean_T *rtu_In_high_speed_prot_active, const real_T *rtu_In_ap_phi_c_deg, const real_T
            *rtu_In_ap_beta_c_deg, const boolean_T *rtu_In_any_ap_engaged, real_T *rty_Out_xi_inboard_deg, real_T
            *rty_Out_xi_midboard_deg, real_T *rty_Out_xi_outboard_deg, real_T *rty_Out_zeta_upper_deg, real_T
            *rty_Out_zeta_lower_deg);
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

