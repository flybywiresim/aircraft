#ifndef RTW_HEADER_PitchAlternateLaw_h_
#define RTW_HEADER_PitchAlternateLaw_h_
#include "rtwtypes.h"
#include "PitchAlternateLaw_types.h"
#include <cstring>

class PitchAlternateLaw final
{
 public:
  struct rtDW_LagFilter_PitchAlternateLaw_T {
    real_T pY;
    real_T pU;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
  };

  struct rtDW_RateLimiter_PitchAlternateLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_eta_trim_limit_lofreeze_PitchAlternateLaw_T {
    real_T frozen_eta_trim;
    boolean_T frozen_eta_trim_not_empty;
  };

  struct rtDW_LagFilter_PitchAlternateLaw_o_T {
    real_T pY;
    real_T pU;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
  };

  struct rtDW_WashoutFilter_PitchAlternateLaw_T {
    real_T pY;
    real_T pU;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
  };

  struct rtDW_RateLimiter_PitchAlternateLaw_o_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct BlockIO_PitchAlternateLaw_T {
    real_T in_flight;
  };

  struct D_Work_PitchAlternateLaw_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_k;
    real_T Delay_DSTATE_d;
    real_T Delay_DSTATE_kd;
    real_T Delay_DSTATE_f;
    real_T Delay_DSTATE_g;
    real_T Delay1_DSTATE;
    real_T Delay_DSTATE_j;
    real_T Delay_DSTATE_c;
    real_T Delay1_DSTATE_i;
    real_T Delay_DSTATE_b;
    real_T Delay_DSTATE_ku;
    real_T Delay_DSTATE_gl;
    real_T Delay1_DSTATE_l;
    real_T Delay_DSTATE_m;
    real_T Delay_DSTATE_k2;
    real_T Delay1_DSTATE_n;
    real_T Delay_DSTATE_jh;
    real_T Delay_DSTATE_dy;
    real_T Delay_DSTATE_e;
    real_T Delay_DSTATE_gz;
    real_T Delay_DSTATE_l;
    real_T Delay_DSTATE_o;
    real_T Delay_DSTATE_a;
    real_T Delay_DSTATE_aa;
    real_T on_ground_time;
    uint8_T is_active_c6_PitchAlternateLaw;
    uint8_T is_c6_PitchAlternateLaw;
    uint8_T is_active_c7_PitchAlternateLaw;
    uint8_T is_c7_PitchAlternateLaw;
    uint8_T is_active_c8_PitchAlternateLaw;
    uint8_T is_c8_PitchAlternateLaw;
    uint8_T is_active_c3_PitchAlternateLaw;
    uint8_T is_c3_PitchAlternateLaw;
    uint8_T is_active_c9_PitchAlternateLaw;
    uint8_T is_c9_PitchAlternateLaw;
    uint8_T is_active_c2_PitchAlternateLaw;
    uint8_T is_c2_PitchAlternateLaw;
    boolean_T icLoad;
    boolean_T icLoad_p;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter_b;
    rtDW_WashoutFilter_PitchAlternateLaw_T sf_WashoutFilter_h;
    rtDW_RateLimiter_PitchAlternateLaw_o_T sf_RateLimiter_nx;
    rtDW_RateLimiter_PitchAlternateLaw_o_T sf_RateLimiter_c2;
    rtDW_LagFilter_PitchAlternateLaw_T sf_LagFilter_m;
    rtDW_WashoutFilter_PitchAlternateLaw_T sf_WashoutFilter_c;
    rtDW_LagFilter_PitchAlternateLaw_o_T sf_LagFilter_g3;
    rtDW_WashoutFilter_PitchAlternateLaw_T sf_WashoutFilter_d;
    rtDW_LagFilter_PitchAlternateLaw_o_T sf_LagFilter_g;
    rtDW_WashoutFilter_PitchAlternateLaw_T sf_WashoutFilter;
    rtDW_LagFilter_PitchAlternateLaw_o_T sf_LagFilter_i;
    rtDW_eta_trim_limit_lofreeze_PitchAlternateLaw_T sf_eta_trim_limit_upfreeze;
    rtDW_eta_trim_limit_lofreeze_PitchAlternateLaw_T sf_eta_trim_limit_lofreeze;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter_n;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter_c;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter_p;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter;
    rtDW_LagFilter_PitchAlternateLaw_T sf_LagFilter;
  };

  struct Parameters_PitchAlternateLaw_T {
    real_T ScheduledGain_BreakpointsForDimension1[4];
    real_T ScheduledGain_BreakpointsForDimension1_c[4];
    real_T ScheduledGain_BreakpointsForDimension1_f[4];
    real_T ScheduledGain_BreakpointsForDimension1_d[5];
    real_T LagFilter_C1;
    real_T LagFilter_C1_p;
    real_T WashoutFilter_C1;
    real_T LagFilter1_C1;
    real_T WashoutFilter_C1_b;
    real_T Subsystem1_C1;
    real_T Subsystem3_C1;
    real_T Subsystem2_C1;
    real_T Subsystem_C1;
    real_T LagFilter_C1_pt;
    real_T WashoutFilter_C1_l;
    real_T LagFilter_C1_l;
    real_T WashoutFilter_C1_h;
    real_T DiscreteDerivativeVariableTs1_Gain;
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T DiscreteDerivativeVariableTs2_Gain;
    real_T DiscreteDerivativeVariableTs1_Gain_m;
    real_T Subsystem1_Gain;
    real_T Subsystem3_Gain;
    real_T Subsystem2_Gain;
    real_T Subsystem_Gain;
    real_T DiscreteDerivativeVariableTs_Gain_b;
    real_T DiscreteDerivativeVariableTs2_Gain_c;
    real_T DiscreteDerivativeVariableTs1_Gain_c;
    real_T DiscreteDerivativeVariableTs_Gain_p;
    real_T DiscreteDerivativeVariableTs2_Gain_a;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTsLimit_Gain;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T RateLimiterVariableTs1_InitialCondition;
    real_T DiscreteDerivativeVariableTs1_InitialCondition;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T DiscreteDerivativeVariableTs2_InitialCondition;
    real_T DiscreteDerivativeVariableTs1_InitialCondition_j;
    real_T RateLimiterVariableTs_InitialCondition_o;
    real_T RateLimiterVariableTs2_InitialCondition_f;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_h;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_m;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_f;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_e;
    real_T DiscreteDerivativeVariableTs_InitialCondition_a;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_d;
    real_T DiscreteDerivativeVariableTs1_InitialCondition_f;
    real_T RateLimiterVariableTs3_InitialCondition_j;
    real_T DiscreteDerivativeVariableTs_InitialCondition_g;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_c;
    real_T RateLimiterDynamicVariableTs_InitialCondition;
    real_T RateLimitereta_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T ScheduledGain_Table[4];
    real_T ScheduledGain_Table_g[4];
    real_T ScheduledGain_Table_h[4];
    real_T ScheduledGain_Table_hh[5];
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs1_lo;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs_lo_c;
    real_T RateLimiterVariableTs2_lo_k;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimiterVariableTs3_lo_a;
    real_T RateLimitereta_lo;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs1_up;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs_up_n;
    real_T RateLimiterVariableTs2_up_m;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimiterVariableTs3_up_j;
    real_T RateLimitereta_up;
    boolean_T CompareToConstant_const;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T Constant_Value;
    real_T qk_dot_gain_Gain;
    real_T qk_gain_Gain;
    real_T v_dot_gain_Gain;
    real_T alpha_err_gain_Gain;
    real_T precontrol_gain_Gain;
    real_T Saturation3_UpperSat;
    real_T Saturation3_LowerSat;
    real_T Constant2_Value_c;
    real_T qk_dot_gain1_Gain;
    real_T qk_gain_HSP_Gain;
    real_T v_dot_gain_HSP_Gain;
    real_T Gain6_Gain;
    real_T precontrol_gain_HSP_Gain;
    real_T HSP_gain_Gain;
    real_T Saturation4_UpperSat;
    real_T Saturation4_LowerSat;
    real_T Constant1_Value;
    real_T Gain_Gain;
    real_T Constant_Value_p;
    real_T Constant1_Value_k;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Gain3_Gain;
    real_T Gain1_Gain;
    real_T Gain1_Gain_l;
    real_T Gain1_Gain_o;
    real_T Vm_currentms_Value;
    real_T Gain_Gain_a;
    real_T uDLookupTable_tableData[7];
    real_T uDLookupTable_bp01Data[7];
    real_T Saturation3_UpperSat_a;
    real_T Saturation3_LowerSat_l;
    real_T Gain5_Gain;
    real_T Bias_Bias;
    real_T PLUT_tableData[2];
    real_T PLUT_bp01Data[2];
    real_T DLUT_tableData[2];
    real_T DLUT_bp01Data[2];
    real_T SaturationV_dot_UpperSat;
    real_T SaturationV_dot_LowerSat;
    real_T Gain_Gain_j;
    real_T SaturationSpoilers_UpperSat;
    real_T SaturationSpoilers_LowerSat;
    real_T Saturation_UpperSat_h;
    real_T Saturation_LowerSat_a;
    real_T Gain3_Gain_c;
    real_T Gain1_Gain_e;
    real_T Vm_currentms_Value_h;
    real_T Gain_Gain_b;
    real_T uDLookupTable_tableData_h[7];
    real_T uDLookupTable_bp01Data_b[7];
    real_T Saturation3_UpperSat_b;
    real_T Saturation3_LowerSat_e;
    real_T Gain5_Gain_e;
    real_T Bias_Bias_f;
    real_T Loaddemand_tableData[3];
    real_T Loaddemand_bp01Data[3];
    real_T Delay_InitialCondition;
    real_T Constant_Value_f;
    real_T Delay1_InitialCondition;
    real_T Delay_InitialCondition_e;
    real_T Constant_Value_b;
    real_T Delay1_InitialCondition_g;
    real_T Switch1_Threshold;
    real_T Delay_InitialCondition_c;
    real_T Constant_Value_j;
    real_T Delay1_InitialCondition_gf;
    real_T Delay_InitialCondition_h;
    real_T Constant_Value_jj;
    real_T Delay1_InitialCondition_e;
    real_T Switch2_Threshold;
    real_T Saturation_UpperSat_f;
    real_T Saturation_LowerSat_o;
    real_T Gain1_Gain_lm;
    real_T PLUT_tableData_k[2];
    real_T PLUT_bp01Data_f[2];
    real_T DLUT_tableData_a[2];
    real_T DLUT_bp01Data_m[2];
    real_T SaturationV_dot_UpperSat_b;
    real_T SaturationV_dot_LowerSat_m;
    real_T Gain_Gain_f;
    real_T SaturationSpoilers_UpperSat_o;
    real_T SaturationSpoilers_LowerSat_j;
    real_T Saturation_UpperSat_k;
    real_T Saturation_LowerSat_p;
    real_T Gain3_Gain_b;
    real_T Gain1_Gain_b;
    real_T Vm_currentms_Value_p;
    real_T Gain_Gain_p;
    real_T uDLookupTable_tableData_p[7];
    real_T uDLookupTable_bp01Data_a[7];
    real_T Saturation3_UpperSat_n;
    real_T Saturation3_LowerSat_a;
    real_T Gain5_Gain_n;
    real_T Bias_Bias_a;
    real_T PLUT_tableData_o[2];
    real_T PLUT_bp01Data_a[2];
    real_T DLUT_tableData_e[2];
    real_T DLUT_bp01Data_k[2];
    real_T SaturationV_dot_UpperSat_m;
    real_T SaturationV_dot_LowerSat_e;
    real_T Gain_Gain_k;
    real_T SaturationSpoilers_UpperSat_h;
    real_T SaturationSpoilers_LowerSat_l;
    real_T Saturation_UpperSat_j;
    real_T Saturation_LowerSat_d;
    real_T Switch_Threshold;
    real_T Gain_Gain_c;
    uint8_T ManualSwitch_CurrentSetting;
    uint8_T ManualSwitch1_CurrentSetting;
  };

  void init();
  PitchAlternateLaw(PitchAlternateLaw const&) = delete;
  PitchAlternateLaw& operator= (PitchAlternateLaw const&) & = delete;
  PitchAlternateLaw(PitchAlternateLaw &&) = delete;
  PitchAlternateLaw& operator= (PitchAlternateLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_time_simulation_time, const real_T *rtu_In_nz_g, const
            real_T *rtu_In_Theta_deg, const real_T *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const real_T
            *rtu_In_qk_dot_deg_s2, const real_T *rtu_In_eta_deg, const real_T *rtu_In_eta_trim_deg, const real_T
            *rtu_In_alpha_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_V_tas_kn, const real_T
            *rtu_In_H_radio_ft, const real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const
            real_T *rtu_In_spoilers_right_pos, const real_T *rtu_In_thrust_lever_1_pos, const real_T
            *rtu_In_thrust_lever_2_pos, const real_T *rtu_In_delta_eta_pos, const boolean_T *rtu_In_on_ground, const
            boolean_T *rtu_In_tracking_mode_on, const boolean_T *rtu_In_high_aoa_prot_active, const boolean_T
            *rtu_In_high_speed_prot_active, const real_T *rtu_In_alpha_prot, const real_T *rtu_In_alpha_max, const
            real_T *rtu_In_high_speed_prot_high_kn, const real_T *rtu_In_high_speed_prot_low_kn, real_T *rty_Out_eta_deg,
            real_T *rty_Out_eta_trim_deg);
  PitchAlternateLaw();
  ~PitchAlternateLaw();
 private:
  BlockIO_PitchAlternateLaw_T PitchAlternateLaw_B;
  D_Work_PitchAlternateLaw_T PitchAlternateLaw_DWork;
  static Parameters_PitchAlternateLaw_T PitchAlternateLaw_rtP;
  static void PitchAlternateLaw_LagFilter(const real_T *rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
    rtDW_LagFilter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
    rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_eta_trim_limit_lofreeze(const real_T *rtu_eta_trim, const boolean_T *rtu_trigger, real_T
    *rty_y, rtDW_eta_trim_limit_lofreeze_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_LagFilter_i(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
    rtDW_LagFilter_PitchAlternateLaw_o_T *localDW);
  static void PitchAlternateLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
    rtDW_WashoutFilter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_RateLimiter_c(const real_T *rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
    real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchAlternateLaw_o_T *localDW);
};

extern PitchAlternateLaw::Parameters_PitchAlternateLaw_T PitchAlternateLaw_rtP;

#endif

