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

  struct rtDW_TransportDelay_A380LateralNormalLaw_T {
    real_T stack[70];
    real_T pointer;
    real_T timeSinceLastSample;
  };

  struct D_Work_A380LateralNormalLaw_T {
    real_T Delay_DSTATE;
    real_T Delay1_DSTATE;
    real_T Delay_DSTATE_o;
    real_T pY;
    real_T pU;
    real_T pY_m;
    real_T pY_a;
    boolean_T icLoad;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
    boolean_T pY_not_empty_j;
    boolean_T pY_not_empty_a;
    rtDW_TransportDelay_A380LateralNormalLaw_T sf_TransportDelay_p;
    rtDW_TransportDelay_A380LateralNormalLaw_T sf_TransportDelay;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_go;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_g;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_l;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_i;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter_k;
    rtDW_RateLimiter_A380LateralNormalLaw_T sf_RateLimiter;
  };

  struct Parameters_A380LateralNormalLaw_T {
    real_T ScheduledGain3_BreakpointsForDimension1[4];
    real_T ScheduledGain1_BreakpointsForDimension1[5];
    real_T ScheduledGain_BreakpointsForDimension1[9];
    real_T ScheduledGain_BreakpointsForDimension1_a[7];
    real_T ScheduledGain1_BreakpointsForDimension1_j[7];
    real_T ScheduledGain_BreakpointsForDimension1_b[5];
    real_T LagFilter_C1;
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition_m;
    real_T RateLimiterVariableTs4_InitialCondition;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T RateLimiterVariableTs2_InitialCondition_c;
    real_T RateLimiterVariableTs1_InitialCondition_e;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T ScheduledGain3_Table[4];
    real_T ScheduledGain1_Table[5];
    real_T ScheduledGain_Table[9];
    real_T ScheduledGain_Table_e[7];
    real_T ScheduledGain1_Table_m[7];
    real_T ScheduledGain_Table_h[5];
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs1_lo_n;
    real_T RateLimiterVariableTs4_lo;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimiterVariableTs2_lo_o;
    real_T RateLimiterVariableTs1_lo_k;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs1_up;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs1_up_j;
    real_T RateLimiterVariableTs4_up;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimiterVariableTs2_up_g;
    real_T RateLimiterVariableTs1_up_d;
    real_T BankAngleProtection2_tableData[5];
    real_T BankAngleProtection2_bp01Data[5];
    real_T BankAngleProtection_tableData[9];
    real_T BankAngleProtection_bp01Data[9];
    real_T BankAngleProtection1_tableData[9];
    real_T BankAngleProtection1_bp01Data[9];
    real_T Constant_Value;
    real_T Gain3_Gain;
    real_T Bias_Bias;
    real_T Saturation4_UpperSat;
    real_T Saturation4_LowerSat;
    real_T Gain2_Gain;
    real_T Gain_Gain;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain_Gain_c;
    real_T Gain1_Gain;
    real_T Constant_Value_l;
    real_T Constant_Value_m;
    real_T Gain1_Gain_o;
    real_T Saturation3_UpperSat;
    real_T Saturation3_LowerSat;
    real_T Delay1_InitialCondition;
    real_T Saturation_UpperSat_c;
    real_T Saturation_LowerSat_l;
    real_T Constant_Value_o;
    real_T Saturation_UpperSat_l;
    real_T Saturation_LowerSat_j;
    real_T Constant2_Value;
    real_T Gain1_Gain_f;
    real_T Gain1_Gain_l;
    real_T Saturation_UpperSat_e;
    real_T Saturation_LowerSat_jd;
    real_T Gain6_Gain;
    real_T Gain_Gain_i;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Saturation_UpperSat_n;
    real_T Saturation_LowerSat_b;
    real_T Saturation2_UpperSat;
    real_T Saturation2_LowerSat;
    real_T Constant_Value_k;
    real_T Gain6_Gain_j;
    real_T Saturation1_UpperSat_e;
    real_T Saturation1_LowerSat_l;
    real_T Saturation_UpperSat_es;
    real_T Saturation_LowerSat_k;
    real_T Constant_Value_g;
    real_T Switch1_Threshold;
    real_T Saturation6_UpperSat;
    real_T Saturation6_LowerSat;
    real_T Saturation5_UpperSat;
    real_T Saturation5_LowerSat;
    real_T Saturation_UpperSat_h;
    real_T Saturation_LowerSat_a;
    real_T Constant_Value_j;
    real_T Gain1_Gain_j;
    real_T Gain1_Gain_h;
    real_T Gain1_Gain_d;
    real_T Gain_Gain_cw;
    real_T Limiterxi_UpperSat;
    real_T Limiterxi_LowerSat;
    real_T Gain5_Gain;
    real_T Switch_Threshold;
    real_T Saturation3_UpperSat_o;
    real_T Saturation3_LowerSat_o;
    real_T Saturation_UpperSat_a;
    real_T Saturation_LowerSat_m;
    real_T Gain1_Gain_m;
    real_T Saturation2_UpperSat_n;
    real_T Saturation2_LowerSat_p;
    boolean_T Constant_Value_li;
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
            *rty_Out_xi_inboard_deg, real_T *rty_Out_xi_midboard_deg, real_T *rty_Out_xi_outboard_deg, real_T
            *rty_Out_xi_spoiler_deg, real_T *rty_Out_zeta_upper_deg, real_T *rty_Out_zeta_lower_deg);
  void reset();
  A380LateralNormalLaw();
  ~A380LateralNormalLaw();
 private:
  D_Work_A380LateralNormalLaw_T A380LateralNormalLaw_DWork;
  static Parameters_A380LateralNormalLaw_T A380LateralNormalLaw_rtP;
  static void A380LateralNormalLaw_RateLimiter_Reset(rtDW_RateLimiter_A380LateralNormalLaw_T *localDW);
  static void A380LateralNormalLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
    rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380LateralNormalLaw_T *localDW);
  static void A380LateralNormalLaw_TransportDelay_Init(rtDW_TransportDelay_A380LateralNormalLaw_T *localDW);
  static void A380LateralNormalLaw_TransportDelay_Reset(rtDW_TransportDelay_A380LateralNormalLaw_T *localDW);
  static void A380LateralNormalLaw_TransportDelay(real_T rtu_u, const real_T *rtu_dt, boolean_T rtu_reset, real_T *rty_y,
    rtDW_TransportDelay_A380LateralNormalLaw_T *localDW);
};

extern A380LateralNormalLaw::Parameters_A380LateralNormalLaw_T A380LateralNormalLaw_rtP;

#endif

