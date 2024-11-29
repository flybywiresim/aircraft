#ifndef PitchAlternateLaw_h_
#define PitchAlternateLaw_h_
#include "rtwtypes.h"
#include "PitchAlternateLaw_types.h"
#include <cstring>

class PitchAlternateLaw final
{
 public:
  struct rtDW_RateLimiter_PitchAlternateLaw_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_LagFilter_PitchAlternateLaw_T {
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

  struct D_Work_PitchAlternateLaw_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_k;
    real_T Delay_DSTATE_d;
    real_T Delay_DSTATE_kd;
    real_T Delay_DSTATE_j;
    real_T Delay_DSTATE_dy;
    real_T Delay_DSTATE_e;
    real_T Delay_DSTATE_g;
    real_T Delay_DSTATE_l;
    real_T Delay_DSTATE_o;
    real_T pY;
    uint8_T is_active_c7_PitchAlternateLaw;
    uint8_T is_c7_PitchAlternateLaw;
    uint8_T is_active_c8_PitchAlternateLaw;
    uint8_T is_c8_PitchAlternateLaw;
    uint8_T is_active_c9_PitchAlternateLaw;
    uint8_T is_c9_PitchAlternateLaw;
    boolean_T icLoad;
    boolean_T pY_not_empty;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter_b;
    rtDW_WashoutFilter_PitchAlternateLaw_T sf_WashoutFilter_c;
    rtDW_LagFilter_PitchAlternateLaw_T sf_LagFilter_g3;
    rtDW_WashoutFilter_PitchAlternateLaw_T sf_WashoutFilter_d;
    rtDW_LagFilter_PitchAlternateLaw_T sf_LagFilter_g;
    rtDW_WashoutFilter_PitchAlternateLaw_T sf_WashoutFilter;
    rtDW_LagFilter_PitchAlternateLaw_T sf_LagFilter;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter_n;
    rtDW_RateLimiter_PitchAlternateLaw_T sf_RateLimiter;
  };

  struct Parameters_PitchAlternateLaw_T {
    real_T ScheduledGain_BreakpointsForDimension1[6];
    real_T ScheduledGain_BreakpointsForDimension1_d[5];
    real_T LagFilter_C1;
    real_T WashoutFilter_C1;
    real_T LagFilter_C1_p;
    real_T WashoutFilter_C1_l;
    real_T LagFilter_C1_l;
    real_T WashoutFilter_C1_h;
    real_T DiscreteDerivativeVariableTs1_Gain;
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T DiscreteDerivativeVariableTs2_Gain;
    real_T DiscreteDerivativeVariableTs1_Gain_m;
    real_T DiscreteDerivativeVariableTs_Gain_b;
    real_T DiscreteDerivativeVariableTs2_Gain_c;
    real_T DiscreteDerivativeVariableTs1_Gain_c;
    real_T DiscreteDerivativeVariableTs_Gain_p;
    real_T DiscreteDerivativeVariableTs2_Gain_a;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T DiscreteDerivativeVariableTs1_InitialCondition;
    real_T RateLimiterVariableTs2_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T DiscreteDerivativeVariableTs2_InitialCondition;
    real_T DiscreteDerivativeVariableTs1_InitialCondition_j;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition_a;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_d;
    real_T DiscreteDerivativeVariableTs1_InitialCondition_f;
    real_T RateLimiterVariableTs3_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition_g;
    real_T DiscreteDerivativeVariableTs2_InitialCondition_c;
    real_T RateLimitereta_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T ScheduledGain_Table[6];
    real_T ScheduledGain_Table_h[5];
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T RateLimiterVariableTs2_lo;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs3_lo;
    real_T RateLimitereta_lo;
    real_T RateLimiterVariableTs2_up;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs3_up;
    real_T RateLimitereta_up;
    boolean_T CompareToConstant_const;
    real_T Constant_Value;
    real_T Constant5_Value;
    real_T Gain2_Gain;
    real_T Constant3_Value;
    real_T uDLookupTable_tableData[6];
    real_T uDLookupTable_bp01Data[6];
    real_T Gain1_Gain;
    real_T Constant_Value_n;
    real_T Gain_Gain;
    real_T Gain3_Gain;
    real_T Gain1_Gain_c;
    real_T Gain1_Gain_l;
    real_T Gain1_Gain_o;
    real_T Vm_currentms_Value;
    real_T Gain_Gain_a;
    real_T uDLookupTable_tableData_e[7];
    real_T uDLookupTable_bp01Data_o[7];
    real_T Saturation3_UpperSat;
    real_T Saturation3_LowerSat;
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
    real_T Gain1_Gain_p;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
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
    real_T Saturation_UpperSat_m;
    real_T Saturation_LowerSat_e;
    real_T Constant6_Value;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
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
    real_T Gain1_Gain_h;
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
    real_T Gain1_Gain_ov;
    real_T Saturation_UpperSat_j;
    real_T Saturation_LowerSat_d;
    real_T Switch_Threshold;
    real_T Gain_Gain_c;
    real_T Constant2_Value;
    real_T Constant3_Value_j;
    boolean_T Constant_Value_m;
  };

  void init();
  PitchAlternateLaw(PitchAlternateLaw const&) = delete;
  PitchAlternateLaw& operator= (PitchAlternateLaw const&) & = delete;
  PitchAlternateLaw(PitchAlternateLaw &&) = delete;
  PitchAlternateLaw& operator= (PitchAlternateLaw &&) = delete;
  void step(const real_T *rtu_In_time_dt, const real_T *rtu_In_nz_g, const real_T *rtu_In_Theta_deg, const real_T
            *rtu_In_Phi_deg, const real_T *rtu_In_qk_deg_s, const real_T *rtu_In_eta_deg, const real_T
            *rtu_In_eta_trim_deg, const real_T *rtu_In_V_ias_kn, const real_T *rtu_In_mach, const real_T
            *rtu_In_V_tas_kn, const real_T *rtu_In_flaps_handle_index, const real_T *rtu_In_spoilers_left_pos, const
            real_T *rtu_In_spoilers_right_pos, const real_T *rtu_In_delta_eta_pos, const real_T *rtu_In_in_flight, const
            boolean_T *rtu_In_tracking_mode_on, const boolean_T *rtu_In_stabilities_available, real_T *rty_Out_eta_deg,
            real_T *rty_Out_eta_trim_dot_deg_s, real_T *rty_Out_eta_trim_limit_lo, real_T *rty_Out_eta_trim_limit_up);
  void reset();
  PitchAlternateLaw();
  ~PitchAlternateLaw();
 private:
  D_Work_PitchAlternateLaw_T PitchAlternateLaw_DWork;
  static Parameters_PitchAlternateLaw_T PitchAlternateLaw_rtP;
  static void PitchAlternateLaw_RateLimiter_Reset(rtDW_RateLimiter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts, real_T
    rtu_init, real_T *rty_Y, rtDW_RateLimiter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_LagFilter_Reset(rtDW_LagFilter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_LagFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
    rtDW_LagFilter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_WashoutFilter_Reset(rtDW_WashoutFilter_PitchAlternateLaw_T *localDW);
  static void PitchAlternateLaw_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
    rtDW_WashoutFilter_PitchAlternateLaw_T *localDW);
};

extern PitchAlternateLaw::Parameters_PitchAlternateLaw_T PitchAlternateLaw_rtP;

#endif

