#ifndef RTW_HEADER_Autothrust_h_
#define RTW_HEADER_Autothrust_h_
#include <cmath>
#include "rtwtypes.h"
#include "Autothrust_types.h"

class AutothrustModelClass
{
 public:
  struct rtDW_TimeSinceCondition_Autothrust_T {
    real_T eventTime;
    boolean_T eventTime_not_empty;
  };

  struct rtDW_RateLimiterwithThreshold_Autothrust_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_Autothrust_T {
    real_T Delay_DSTATE;
    real_T Delay_DSTATE_k;
    real_T Delay_DSTATE_j;
    real_T Delay_DSTATE_n;
    real_T Delay_DSTATE_l;
    real_T Delay_DSTATE_lz;
    real_T Delay_DSTATE_h;
    real_T eventTime;
    real_T eventTime_h;
    real_T prev_TLA_1;
    real_T prev_TLA_2;
    real_T eventTime_b;
    real_T eventTime_o;
    real_T pY;
    real_T pU;
    real_T eventTime_j;
    real_T eventTime_g;
    real_T eventTime_p;
    athr_mode pMode;
    athr_status pStatus;
    boolean_T Delay_DSTATE_a;
    uint8_T is_active_c5_Autothrust;
    uint8_T is_c5_Autothrust;
    boolean_T Memory_PreviousInput;
    boolean_T Memory_PreviousInput_m;
    boolean_T icLoad;
    boolean_T icLoad_c;
    boolean_T eventTime_not_empty;
    boolean_T eventTime_not_empty_n;
    boolean_T ATHR_ENGAGED;
    boolean_T prev_TLA_1_not_empty;
    boolean_T prev_TLA_2_not_empty;
    boolean_T prev_condition_AlphaFloor;
    boolean_T prev_condition_TCAS;
    boolean_T prev_SRS_TO_GA_mode_active;
    boolean_T condition_TOGA_latch;
    boolean_T eventTime_not_empty_m;
    boolean_T pConditionAlphaFloor;
    boolean_T was_SRS_TO_active;
    boolean_T was_SRS_GA_active;
    boolean_T inhibitAboveThrustReductionAltitude;
    boolean_T condition_THR_LK;
    boolean_T eventTime_not_empty_mr;
    boolean_T pThrustMemoActive;
    boolean_T pUseAutoThrustControl;
    boolean_T pY_not_empty;
    boolean_T pU_not_empty;
    boolean_T eventTime_not_empty_e;
    boolean_T latch;
    boolean_T sInhibit;
    boolean_T prev_TCAS_active;
    boolean_T eventTime_not_empty_i;
    boolean_T eventTime_not_empty_mc;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold_n;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold_k;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold_ma;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold_o;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold_d;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold_m;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold_h;
    rtDW_RateLimiterwithThreshold_Autothrust_T sf_RateLimiterwithThreshold;
    rtDW_TimeSinceCondition_Autothrust_T sf_TimeSinceCondition1;
    rtDW_TimeSinceCondition_Autothrust_T sf_TimeSinceCondition_o;
  };

  struct ExternalInputs_Autothrust_T {
    athr_in in;
  };

  struct ExternalOutputs_Autothrust_T {
    athr_out out;
  };

  struct Parameters_Autothrust_T {
    athr_out athr_out_MATLABStruct;
    real_T ScheduledGain_BreakpointsForDimension1[3];
    real_T ScheduledGain2_BreakpointsForDimension1[2];
    real_T ScheduledGain1_BreakpointsForDimension1[2];
    real_T ScheduledGain_BreakpointsForDimension1_p[2];
    real_T ScheduledGain4_BreakpointsForDimension1[2];
    real_T LagFilter_C1;
    real_T DiscreteDerivativeVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTsLimit_Gain;
    real_T DiscreteTimeIntegratorVariableTs_Gain;
    real_T DiscreteTimeIntegratorVariableTs1_Gain;
    real_T DiscreteTimeIntegratorVariableTs_Gain_k;
    real_T DiscreteTimeIntegratorVariableTs1_Gain_l;
    real_T RateLimiterThresholdVariableTs_InitialCondition;
    real_T RateLimiterThresholdVariableTs2_InitialCondition;
    real_T RateLimiterThresholdVariableTs1_InitialCondition;
    real_T RateLimiterThresholdVariableTs_InitialCondition_p;
    real_T RateLimiterThresholdVariableTs2_InitialCondition_e;
    real_T RateLimiterThresholdVariableTs1_InitialCondition_c;
    real_T RateLimiterThresholdVariableTs2_InitialCondition_b;
    real_T RateLimiterThresholdVariableTs1_InitialCondition_m;
    real_T DiscreteDerivativeVariableTs_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs1_InitialCondition;
    real_T DiscreteTimeIntegratorVariableTs_InitialCondition_n;
    real_T DiscreteTimeIntegratorVariableTs1_InitialCondition_e;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
    real_T DiscreteTimeIntegratorVariableTs1_LowerLimit;
    real_T DiscreteTimeIntegratorVariableTs_LowerLimit_e;
    real_T DiscreteTimeIntegratorVariableTs1_LowerLimit_h;
    real_T ScheduledGain_Table[3];
    real_T ScheduledGain2_Table[2];
    real_T ScheduledGain1_Table[2];
    real_T ScheduledGain_Table_b[2];
    real_T ScheduledGain4_Table[2];
    real_T RateLimiterThresholdVariableTs_Threshold;
    real_T RateLimiterThresholdVariableTs2_Threshold;
    real_T RateLimiterThresholdVariableTs1_Threshold;
    real_T RateLimiterThresholdVariableTs_Threshold_b;
    real_T RateLimiterThresholdVariableTs2_Threshold_m;
    real_T RateLimiterThresholdVariableTs1_Threshold_e;
    real_T RateLimiterThresholdVariableTs2_Threshold_i;
    real_T RateLimiterThresholdVariableTs1_Threshold_n;
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
    real_T DiscreteTimeIntegratorVariableTs1_UpperLimit;
    real_T DiscreteTimeIntegratorVariableTs_UpperLimit_p;
    real_T DiscreteTimeIntegratorVariableTs1_UpperLimit_o;
    real_T CompareToConstant_const;
    real_T CompareToConstant_const_k;
    real_T CompareToConstant2_const;
    real_T RateLimiterThresholdVariableTs_lo;
    real_T RateLimiterThresholdVariableTs2_lo;
    real_T RateLimiterThresholdVariableTs1_lo;
    real_T RateLimiterThresholdVariableTs_lo_k;
    real_T RateLimiterThresholdVariableTs2_lo_b;
    real_T RateLimiterThresholdVariableTs1_lo_d;
    real_T RateLimiterThresholdVariableTs2_lo_e;
    real_T RateLimiterThresholdVariableTs1_lo_a;
    real_T RateLimiterThresholdVariableTs_up;
    real_T RateLimiterThresholdVariableTs2_up;
    real_T RateLimiterThresholdVariableTs1_up;
    real_T RateLimiterThresholdVariableTs_up_d;
    real_T RateLimiterThresholdVariableTs2_up_j;
    real_T RateLimiterThresholdVariableTs1_up_j;
    real_T RateLimiterThresholdVariableTs2_up_g;
    real_T RateLimiterThresholdVariableTs1_up_m;
    athr_mode CompareToConstant2_const_h;
    athr_mode CompareToConstant3_const;
    athr_mode CompareToConstant2_const_c;
    athr_mode CompareToConstant3_const_k;
    athr_status CompareToConstant_const_d;
    boolean_T CompareToConstant1_const;
    boolean_T CompareToConstant_const_j;
    boolean_T SRFlipFlop_initial_condition;
    boolean_T SRFlipFlop_initial_condition_g;
    real_T Constant1_Value;
    real_T Gain_Gain;
    real_T Gain_Gain_m;
    real_T AntiIceWing8000_tableData[4];
    real_T AntiIceWing8000_bp01Data[2];
    real_T AntiIceWing8000_bp02Data[2];
    real_T AntiIceWing8000_tableData_k[4];
    real_T AntiIceWing8000_bp01Data_d[2];
    real_T AntiIceWing8000_bp02Data_e[2];
    real_T AirConditioning8000_tableData[4];
    real_T AirConditioning8000_bp01Data[2];
    real_T AirConditioning8000_bp02Data[2];
    real_T AirConditioning8000_tableData_f[4];
    real_T AirConditioning8000_bp01Data_p[2];
    real_T AirConditioning8000_bp02Data_l[2];
    real_T AntiIceEngine8000_tableData[4];
    real_T AntiIceEngine8000_bp01Data[2];
    real_T AntiIceEngine8000_bp02Data[2];
    real_T AntiIceEngine8000_tableData_d[4];
    real_T AntiIceEngine8000_bp01Data_m[2];
    real_T AntiIceEngine8000_bp02Data_i[2];
    real_T Gain2_Gain;
    real_T Gain3_Gain;
    real_T Gain_Gain_p;
    real_T Constant1_Value_d;
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T Gain1_Gain;
    real_T Saturation1_UpperSat;
    real_T Saturation1_LowerSat;
    real_T uDLookupTable_tableData[4];
    real_T uDLookupTable_bp01Data[2];
    real_T uDLookupTable_bp02Data[2];
    real_T MaximumClimb_tableData[338];
    real_T MaximumClimb_bp01Data[26];
    real_T MaximumClimb_bp02Data[13];
    real_T OATCornerPoint_tableData[338];
    real_T OATCornerPoint_bp01Data[26];
    real_T OATCornerPoint_bp02Data[13];
    real_T AntiIceEngine_tableData[4];
    real_T AntiIceEngine_bp01Data[2];
    real_T AntiIceEngine_bp02Data[2];
    real_T AntiIceWing_tableData[4];
    real_T AntiIceWing_bp01Data[2];
    real_T AntiIceWing_bp02Data[2];
    real_T AirConditioning_tableData[4];
    real_T AirConditioning_bp01Data[2];
    real_T AirConditioning_bp02Data[2];
    real_T Right_tableData[70];
    real_T Right_bp01Data[10];
    real_T Right_bp02Data[7];
    real_T Left_tableData[4];
    real_T Left_bp01Data[2];
    real_T Left_bp02Data[2];
    real_T AntiIceEngine_tableData_l[2];
    real_T AntiIceEngine_bp01Data_d[2];
    real_T AntiIceWing_tableData_g[2];
    real_T AntiIceWing_bp01Data_n[2];
    real_T AirConditioning_tableData_p[2];
    real_T AirConditioning_bp01Data_d[2];
    real_T MaximumContinuous_tableData[338];
    real_T MaximumContinuous_bp01Data[26];
    real_T MaximumContinuous_bp02Data[13];
    real_T OATCornerPoint_tableData_n[338];
    real_T OATCornerPoint_bp01Data_a[26];
    real_T OATCornerPoint_bp02Data_i[13];
    real_T AntiIceEngine_tableData_d[4];
    real_T AntiIceEngine_bp01Data_l[2];
    real_T AntiIceEngine_bp02Data_e[2];
    real_T AntiIceWing_tableData_a[4];
    real_T AntiIceWing_bp01Data_b[2];
    real_T AntiIceWing_bp02Data_n[2];
    real_T AirConditioning_tableData_l[4];
    real_T AirConditioning_bp01Data_l[2];
    real_T AirConditioning_bp02Data_c[2];
    real_T MaximumTakeOff_tableData[756];
    real_T MaximumTakeOff_bp01Data[36];
    real_T MaximumTakeOff_bp02Data[21];
    real_T OATCornerPoint_tableData_f[1044];
    real_T OATCornerPoint_bp01Data_j[36];
    real_T OATCornerPoint_bp02Data_g[29];
    real_T Saturation_UpperSat_l;
    real_T Saturation_LowerSat_i;
    real_T Gain1_Gain_c;
    real_T Gain_Gain_h;
    real_T Gain_Gain_b;
    real_T Constant2_Value;
    real_T Constant3_Value;
    real_T Gain_Gain_d;
    real_T Gain1_Gain_h;
    real_T Gain_Gain_bf;
    real_T Gain1_Gain_g;
    uint32_T AntiIceWing8000_maxIndex[2];
    uint32_T AntiIceWing8000_maxIndex_c[2];
    uint32_T AirConditioning8000_maxIndex[2];
    uint32_T AirConditioning8000_maxIndex_o[2];
    uint32_T AntiIceEngine8000_maxIndex[2];
    uint32_T AntiIceEngine8000_maxIndex_a[2];
    uint32_T uDLookupTable_maxIndex[2];
    uint32_T MaximumClimb_maxIndex[2];
    uint32_T OATCornerPoint_maxIndex[2];
    uint32_T AntiIceEngine_maxIndex[2];
    uint32_T AntiIceWing_maxIndex[2];
    uint32_T AirConditioning_maxIndex[2];
    uint32_T Right_maxIndex[2];
    uint32_T Left_maxIndex[2];
    uint32_T MaximumContinuous_maxIndex[2];
    uint32_T OATCornerPoint_maxIndex_i[2];
    uint32_T AntiIceEngine_maxIndex_e[2];
    uint32_T AntiIceWing_maxIndex_d[2];
    uint32_T AirConditioning_maxIndex_g[2];
    uint32_T MaximumTakeOff_maxIndex[2];
    uint32_T OATCornerPoint_maxIndex_m[2];
    boolean_T Logic_table[16];
    boolean_T Delay_InitialCondition;
    boolean_T Logic_table_m[16];
  };

  AutothrustModelClass(AutothrustModelClass const&) =delete;
  AutothrustModelClass& operator= (AutothrustModelClass const&) & = delete;
  void setExternalInputs(const ExternalInputs_Autothrust_T *pExternalInputs_Autothrust_T)
  {
    Autothrust_U = *pExternalInputs_Autothrust_T;
  }

  const ExternalOutputs_Autothrust_T &getExternalOutputs() const
  {
    return Autothrust_Y;
  }

  void initialize();
  void step();
  static void terminate();
  AutothrustModelClass();
  ~AutothrustModelClass();
 private:
  ExternalInputs_Autothrust_T Autothrust_U;
  ExternalOutputs_Autothrust_T Autothrust_Y;
  D_Work_Autothrust_T Autothrust_DWork;
  static Parameters_Autothrust_T Autothrust_P;
  static void Autothrust_TimeSinceCondition(real_T rtu_time, boolean_T rtu_condition, real_T *rty_y,
    rtDW_TimeSinceCondition_Autothrust_T *localDW);
  static void Autothrust_ThrustMode1(real_T rtu_u, real_T *rty_y);
  static void Autothrust_TLAComputation1(const athr_out *rtu_in, real_T rtu_TLA, real_T *rty_N1c, boolean_T
    *rty_inReverse);
  static void Autothrust_RateLimiterwithThreshold(real_T rtu_U, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
    rtu_init, real_T rtu_threshold, real_T *rty_Y, rtDW_RateLimiterwithThreshold_Autothrust_T *localDW);
  real_T Autothrust_timeSinceConditionArmedActive(real_T in_time_simulation_time, athr_status status);
};

#endif

