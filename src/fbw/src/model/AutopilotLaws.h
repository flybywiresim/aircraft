#ifndef RTW_HEADER_AutopilotLaws_h_
#define RTW_HEADER_AutopilotLaws_h_
#include <cmath>
#include "rtwtypes.h"
#include "AutopilotLaws_types.h"

class AutopilotLawsModelClass {
 public:
  struct rtDW_Chart_AutopilotLaws_T {
    uint8_T is_active_c8_srSgcGQg2zvTgc1tMselx4F_ap_library;
    uint8_T is_c8_srSgcGQg2zvTgc1tMselx4F_ap_library;
  };

  struct rtDW_LagFilter_AutopilotLaws_T {
    real_T pY;
    real_T pU;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
  };

  struct rtDW_Chart_AutopilotLaws_c_T {
    uint8_T is_active_c8_s7y0WEx1xKopCu1ds66dilB_ap_library;
    uint8_T is_c8_s7y0WEx1xKopCu1ds66dilB_ap_library;
  };

  struct rtDW_storevalue_AutopilotLaws_T {
    real_T storage;
    boolean_T storage_not_empty;
  };

  struct rtDW_RateLimiter_AutopilotLaws_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct rtDW_WashoutFilter_AutopilotLaws_T {
    real_T pY;
    real_T pU;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
  };

  struct BlockIO_AutopilotLaws_T {
    real_T u;
  };

  struct D_Work_AutopilotLaws_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_i;
    real_T Delay_DSTATE_h;
    real_T Delay_DSTATE_g;
    real_T Delay_DSTATE_k;
    real_T Delay_DSTATE_h2;
    real_T eventTime;
    real_T Tau;
    real_T H_bias;
    real_T dH_offset;
    real_T k;
    real_T limit;
    boolean_T Delay_DSTATE_l[100];
    boolean_T Delay_DSTATE_h5[100];
    uint8_T is_active_c5_AutopilotLaws;
    uint8_T is_c5_AutopilotLaws;
    boolean_T icLoad;
    boolean_T icLoad_f;
    boolean_T eventTime_not_empty;
    boolean_T wasActive;
    boolean_T wasActive_not_empty;
    boolean_T wasActive_i;
    boolean_T wasActive_not_empty_m;
    boolean_T limit_not_empty;
    rtDW_RateLimiter_AutopilotLaws_T sf_RateLimiter_g;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_n;
    rtDW_storevalue_AutopilotLaws_T sf_storevalue_m;
    rtDW_WashoutFilter_AutopilotLaws_T sf_WashoutFilter_c;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_h;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_d2;
    rtDW_WashoutFilter_AutopilotLaws_T sf_WashoutFilter_l;
    rtDW_WashoutFilter_AutopilotLaws_T sf_WashoutFilter_h;
    rtDW_WashoutFilter_AutopilotLaws_T sf_WashoutFilter;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_e;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_g;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_k;
    rtDW_Chart_AutopilotLaws_T sf_Chart_b;
    rtDW_RateLimiter_AutopilotLaws_T sf_RateLimiter;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_d;
    rtDW_storevalue_AutopilotLaws_T sf_storevalue;
    rtDW_Chart_AutopilotLaws_c_T sf_Chart_o;
    rtDW_Chart_AutopilotLaws_c_T sf_Chart_j;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter_j;
    rtDW_LagFilter_AutopilotLaws_T sf_LagFilter;
    rtDW_Chart_AutopilotLaws_T sf_Chart;
  };

  struct ExternalInputs_AutopilotLaws_T {
    ap_laws_input in;
  };

  struct ExternalOutputs_AutopilotLaws_T {
    ap_laws_output out;
  };

  struct Parameters_AutopilotLaws_T {
    ap_laws_output ap_laws_output_MATLABStruct;
    real_T ScheduledGain_BreakpointsForDimension1[5];
    real_T ScheduledGain3_BreakpointsForDimension1[4];
    real_T ScheduledGain1_BreakpointsForDimension1[4];
    real_T ScheduledGain2_BreakpointsForDimension1[7];
    real_T ScheduledGain_BreakpointsForDimension1_j[3];
    real_T ScheduledGain_BreakpointsForDimension1_a[7];
    real_T ScheduledGain_BreakpointsForDimension1_d[7];
    real_T ScheduledGain_BreakpointsForDimension1_e[5];
    real_T ScheduledGain2_BreakpointsForDimension1_j[7];
    real_T ScheduledGain_BreakpointsForDimension1_h[6];
    real_T LagFilter_C1;
    real_T LagFilter_C1_l;
    real_T LagFilter1_C1;
    real_T LagFilter_C1_a;
    real_T WashoutFilter_C1;
    real_T LagFilter1_C1_a;
    real_T LagFilter_C1_n;
    real_T WashoutFilter_C1_m;
    real_T WashoutFilter_C1_h;
    real_T LagFilter_C1_h;
    real_T LagFilter3_C1;
    real_T WashoutFilter1_C1;
    real_T LagFilter_C1_i;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T VS_Gain;
    real_T VS_Gain_h;
    real_T DiscreteDerivativeVariableTs_Gain_l;
    real_T VS_Gain_a;
    real_T VS_Gain_j;
    real_T DiscreteDerivativeVariableTs2_Gain;
    real_T VS_Gain_e;
    real_T VS_Gain_c;
    real_T DiscreteTimeIntegratorVariableTs_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T RateLimiterVariableTs_InitialCondition;
    real_T DiscreteDerivativeVariableTs_InitialCondition_h;
    real_T DiscreteDerivativeVariableTs2_InitialCondition;
    real_T RateLimiterVariableTs_InitialCondition_p;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T ScheduledGain_Table[5];
    real_T ScheduledGain3_Table[4];
    real_T ScheduledGain1_Table[4];
    real_T ScheduledGain2_Table[7];
    real_T ScheduledGain_Table_p[3];
    real_T ScheduledGain_Table_i[7];
    real_T ScheduledGain_Table_h[7];
    real_T ScheduledGain_Table_pf[5];
    real_T ScheduledGain2_Table_h[7];
    real_T ScheduledGain_Table_ir[6];
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T Subsystem_Value;
    real_T Subsystem_Value_n;
    real_T CompareToConstant2_const;
    real_T CompareToConstant_const;
    real_T CompareToConstant5_const;
    real_T CompareToConstant4_const;
    real_T CompareToConstant_const_d;
    real_T CompareToConstant5_const_e;
    real_T CompareToConstant_const_n;
    real_T CompareToConstant6_const;
    real_T CompareToConstant1_const;
    real_T CompareToConstant2_const_e;
    real_T CompareToConstant7_const;
    real_T GammaTCorrection_gain;
    real_T RateLimiterVariableTs_lo;
    real_T RateLimiterVariableTs_lo_o;
    real_T GammaTCorrection_time;
    real_T RateLimiterVariableTs_up;
    real_T RateLimiterVariableTs_up_i;
    boolean_T CompareToConstant_const_h;
    boolean_T CompareToConstant_const_e;
    real_T Gain1_Gain;
    real_T Gain_Gain;
    real_T Gain1_Gain_p;
    real_T Gain_Gain_p;
    real_T Gain_Gain_a;
    real_T Constant1_Value;
    real_T Gain2_Gain;
    real_T Gain_Gain_c;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Constant3_Value;
    real_T beta_Value;
    real_T beta_Value_e;
    real_T beta_Value_b;
    real_T beta_Value_i;
    real_T beta_Value_d;
    real_T Gain_Gain_b;
    real_T Gain5_Gain;
    real_T Gain1_Gain_n;
    real_T Gain_Gain_k;
    real_T Gain1_Gain_l;
    real_T Constant_Value;
    real_T Y_Y0;
    real_T Gain1_Gain_b;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T Constant1_Value_h;
    real_T Gain_Gain_h;
    real_T Gain2_Gain_j;
    real_T Switch_Threshold;
    real_T Gain1_Gain_h;
    real_T Gain2_Gain_h;
    real_T Gain1_Gain_i;
    real_T Switch1_Threshold;
    real_T Switch_Threshold_n;
    real_T Gain3_Gain;
    real_T Switch_Threshold_c;
    real_T Gain1_Gain_m;
    real_T Gain1_Gain_nu;
    real_T Constant_Value_m;
    real_T GainTheta_Gain;
    real_T GainTheta1_Gain;
    real_T Gain_Gain_d;
    real_T Gainqk_Gain;
    real_T Gain_Gain_m;
    real_T Gain_Gain_de;
    real_T Gainpk_Gain;
    real_T Gain3_Gain_a;
    real_T Gain_Gain_n;
    real_T Constant1_Value_b;
    real_T Saturation_UpperSat_p;
    real_T Saturation_LowerSat_g;
    real_T Gain1_Gain_ll;
    real_T Saturation1_UpperSat_j;
    real_T Saturation1_LowerSat_d;
    real_T Gain2_Gain_b;
    real_T Constant3_Value_e;
    real_T Gain1_Gain_g;
    real_T Saturation_UpperSat_c;
    real_T Saturation_LowerSat_d;
    real_T Constant3_Value_a;
    real_T Constant3_Value_m;
    real_T Constant3_Value_j;
    real_T Gain_Gain_nj;
    real_T Constant2_Value;
    real_T Constant3_Value_h;
    real_T Constant3_Value_c;
    real_T Gain1_Gain_h5;
    real_T Saturation_UpperSat_o;
    real_T Saturation_LowerSat_o;
    real_T Gain2_Gain_g;
    real_T Saturation1_UpperSat_g;
    real_T Saturation1_LowerSat_k;
    real_T Gain6_Gain;
    real_T Constant3_Value_eg;
    real_T Constant3_Value_m0;
    real_T Gain1_Gain_f;
    real_T Gain_Gain_py;
    real_T Constant1_Value_e;
    real_T Constant3_Value_d;
    real_T Gain_Gain_ac;
    real_T Constant3_Value_n;
    real_T Gain_Gain_e;
    real_T tau_Value;
    real_T zeta_Value;
    real_T Gain3_Gain_i;
    real_T ROLLLIM1_tableData[5];
    real_T ROLLLIM1_bp01Data[5];
    real_T Constant2_Value_h;
    real_T Gain1_Gain_k;
    real_T Saturation_UpperSat_j;
    real_T Saturation_LowerSat_p;
    real_T Constant_Value_n;
    real_T Gain_Gain_f;
    real_T Saturation_UpperSat_n;
    real_T Saturation_LowerSat_d4;
    real_T ftmintoms_Gain;
    real_T kntoms_Gain;
    real_T Saturation_UpperSat_n3;
    real_T Saturation_LowerSat_m;
    real_T Gain_Gain_kr;
    real_T ftmintoms_Gain_h;
    real_T kntoms_Gain_a;
    real_T Saturation_UpperSat_d;
    real_T Saturation_LowerSat_b;
    real_T Gain_Gain_df;
    real_T Gain1_Gain_fu;
    real_T Gain_Gain_pb;
    real_T Gain_Gain_o;
    real_T Gain1_Gain_j;
    real_T Saturation_UpperSat_e;
    real_T Saturation_LowerSat_mk;
    real_T Gain_Gain_of;
    real_T Gain1_Gain_nv;
    real_T Gain_Gain_e1;
    real_T Gain_Gain_eq;
    real_T Gain1_Gain_ji;
    real_T Saturation_UpperSat_jm;
    real_T Saturation_LowerSat_on;
    real_T Gain_Gain_mw;
    real_T fpmtoms_Gain;
    real_T kntoms_Gain_p;
    real_T Saturation_UpperSat_k;
    real_T Saturation_LowerSat_l;
    real_T Gain_Gain_l;
    real_T Gain_Gain_c3;
    real_T Gain1_Gain_b2;
    real_T Gain_Gain_p2;
    real_T Gain_Gain_n1;
    real_T Gain1_Gain_fq;
    real_T Saturation_UpperSat_h;
    real_T Saturation_LowerSat_a;
    real_T Gain_Gain_i;
    real_T Gain1_Gain_ib;
    real_T Gain_Gain_he;
    real_T Gain_Gain_p4;
    real_T Gain1_Gain_gs;
    real_T Saturation_UpperSat_l;
    real_T Saturation_LowerSat_i;
    real_T Gain_Gain_e5;
    real_T Gain3_Gain_o;
    real_T Saturation_UpperSat_f;
    real_T Saturation_LowerSat_om;
    real_T fpmtoms_Gain_e;
    real_T kntoms_Gain_i;
    real_T Saturation_UpperSat_g;
    real_T Saturation_LowerSat_c;
    real_T Gain_Gain_nu;
    real_T Bias_Bias;
    real_T Gain1_Gain_nq;
    real_T Bias1_Bias;
    real_T Gain_Gain_p2b;
    real_T ftmintoms_Gain_g;
    real_T kntoms_Gain_e;
    real_T Saturation_UpperSat_dn;
    real_T Saturation_LowerSat_bx;
    real_T Gain_Gain_da;
    real_T Gain1_Gain_kw;
    real_T Gain_Gain_bi;
    real_T Gain_Gain_ei;
    real_T Gain1_Gain_hn;
    real_T Saturation_UpperSat_j4;
    real_T Saturation_LowerSat_bb;
    real_T Gain_Gain_kg;
    real_T Constant_Value_k;
    real_T ftmintoms_Gain_p;
    real_T kntoms_Gain_iw;
    real_T Saturation_UpperSat_kg;
    real_T Saturation_LowerSat_ce;
    real_T Gain_Gain_md;
    real_T Constant2_Value_f;
    real_T Gain4_Gain;
    real_T Gain5_Gain_c;
    real_T Saturation_UpperSat_e0;
    real_T Saturation_LowerSat_mg;
    real_T Gain2_Gain_c;
    real_T ftmintoms_Gain_i;
    real_T kntoms_Gain_av;
    real_T Saturation_UpperSat_m;
    real_T Saturation_LowerSat_d1;
    real_T Gain_Gain_fz;
    real_T Constant1_Value_d;
    real_T Gain1_Gain_fy;
    real_T Gain_Gain_nub;
    real_T Gain_Gain_ao;
    real_T Gain1_Gain_fr;
    real_T Saturation_UpperSat_e3;
    real_T Saturation_LowerSat_py;
    real_T Gain_Gain_b2;
    real_T Constant_Value_i;
    real_T ftmintoms_Gain_j;
    real_T kntoms_Gain_f;
    real_T Saturation_UpperSat_b;
    real_T Saturation_LowerSat_ow;
    real_T Gain_Gain_bd;
    real_T Constant1_Value_i;
    real_T Constant2_Value_h1;
    real_T Gain1_Gain_i0;
    real_T Saturation_UpperSat_ju;
    real_T Saturation_LowerSat_n;
    real_T Constant_Value_f;
    boolean_T Delay_InitialCondition;
    boolean_T Delay_InitialCondition_b;
    uint8_T ManualSwitch_CurrentSetting;
    uint8_T ManualSwitch_CurrentSetting_b;
  };

  void initialize();
  void step();
  void terminate();
  AutopilotLawsModelClass();
  ~AutopilotLawsModelClass();
  void setExternalInputs(const ExternalInputs_AutopilotLaws_T* pExternalInputs_AutopilotLaws_T)
  {
    AutopilotLaws_U = *pExternalInputs_AutopilotLaws_T;
  }

  const AutopilotLawsModelClass::ExternalOutputs_AutopilotLaws_T & getExternalOutputs() const
  {
    return AutopilotLaws_Y;
  }

 private:
  static Parameters_AutopilotLaws_T AutopilotLaws_P;
  BlockIO_AutopilotLaws_T AutopilotLaws_B;
  D_Work_AutopilotLaws_T AutopilotLaws_DWork;
  ExternalInputs_AutopilotLaws_T AutopilotLaws_U;
  ExternalOutputs_AutopilotLaws_T AutopilotLaws_Y;
  static void AutopilotLaws_Chart_Init(real_T *rty_out);
  static void AutopilotLaws_Chart(real_T rtu_right, real_T rtu_left, boolean_T rtu_use_short_path, real_T *rty_out,
    rtDW_Chart_AutopilotLaws_T *localDW);
  static void AutopilotLaws_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
    rtDW_LagFilter_AutopilotLaws_T *localDW);
  static void AutopilotLaws_Chart_p_Init(real_T *rty_out);
  static void AutopilotLaws_Chart_j(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T *rty_out,
    rtDW_Chart_AutopilotLaws_c_T *localDW);
  static void AutopilotLaws_storevalue(boolean_T rtu_active, real_T rtu_u, real_T *rty_y,
    rtDW_storevalue_AutopilotLaws_T *localDW);
  static void AutopilotLaws_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
    real_T *rty_Y, rtDW_RateLimiter_AutopilotLaws_T *localDW);
  static void AutopilotLaws_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
    rtDW_WashoutFilter_AutopilotLaws_T *localDW);
  static void AutopilotLaws_SpeedProtectionMode(const ap_laws_output *rtu_in, real_T rtu_VS_FD, real_T rtu_VS_AP, real_T
    rtu_VLS_FD, real_T rtu_VLS_AP, real_T rtu_VMAX_FD, real_T rtu_VMAX_AP, real_T *rty_FD, real_T *rty_AP);
  static void AutopilotLaws_VSLimiter(real_T rtu_u, real_T rtu_V_tas_kn, real_T *rty_y);
  static void AutopilotLaws_V_LSSpeedSelection(const ap_laws_output *rtu_in, real_T *rty_y);
  static void AutopilotLaws_Voter1(real_T rtu_u1, real_T rtu_u2, real_T rtu_u3, real_T *rty_Y);
};

#endif

