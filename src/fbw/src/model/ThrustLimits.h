#ifndef RTW_HEADER_ThrustLimits_h_
#define RTW_HEADER_ThrustLimits_h_
#include <cmath>
#include "rtwtypes.h"
#include "ThrustLimits_types.h"

class ThrustLimitsModelClass
{
 public:
  struct rtDW_RateLimiterwithThreshold_ThrustLimits_T {
    real_T pY;
    boolean_T pY_not_empty;
  };

  struct D_Work_ThrustLimits_T {
    real_T prevFlexTemperature;
    real_T prevThrustLimitType;
    real_T transitionStartTime;
    real_T transitionFactor;
    boolean_T prevThrustLimitType_not_empty;
    boolean_T isFlexActive;
    boolean_T isTransitionActive;
    rtDW_RateLimiterwithThreshold_ThrustLimits_T sf_RateLimiterwithThreshold_ms;
    rtDW_RateLimiterwithThreshold_ThrustLimits_T sf_RateLimiterwithThreshold_p;
    rtDW_RateLimiterwithThreshold_ThrustLimits_T sf_RateLimiterwithThreshold_m;
    rtDW_RateLimiterwithThreshold_ThrustLimits_T sf_RateLimiterwithThreshold_n;
    rtDW_RateLimiterwithThreshold_ThrustLimits_T sf_RateLimiterwithThreshold_g;
    rtDW_RateLimiterwithThreshold_ThrustLimits_T sf_RateLimiterwithThreshold;
  };

  struct ExternalInputs_ThrustLimits_T {
    thrust_limits_in in;
  };

  struct ExternalOutputs_ThrustLimits_T {
    thrust_limits_out out;
  };

  struct Parameters_ThrustLimits_T {
    thrust_limits_out thrust_limits_out_MATLABStruct;
    real_T RateLimiterThresholdVariableTs_InitialCondition;
    real_T RateLimiterThresholdVariableTs_InitialCondition_l;
    real_T RateLimiterThresholdVariableTs_InitialCondition_l0;
    real_T RateLimiterThresholdVariableTs_InitialCondition_a;
    real_T RateLimiterThresholdVariableTs_InitialCondition_lb;
    real_T RateLimiterThresholdVariableTs1_InitialCondition;
    real_T RateLimiterThresholdVariableTs_Threshold;
    real_T RateLimiterThresholdVariableTs_Threshold_e;
    real_T RateLimiterThresholdVariableTs_Threshold_o;
    real_T RateLimiterThresholdVariableTs_Threshold_c;
    real_T RateLimiterThresholdVariableTs_Threshold_g;
    real_T RateLimiterThresholdVariableTs1_Threshold;
    real_T CompareToConstant_const;
    real_T CompareToConstant1_const;
    real_T RateLimiterThresholdVariableTs_lo;
    real_T RateLimiterThresholdVariableTs_lo_b;
    real_T RateLimiterThresholdVariableTs_lo_d;
    real_T RateLimiterThresholdVariableTs_lo_n;
    real_T RateLimiterThresholdVariableTs_lo_h;
    real_T RateLimiterThresholdVariableTs1_lo;
    real_T RateLimiterThresholdVariableTs_up;
    real_T RateLimiterThresholdVariableTs_up_p;
    real_T RateLimiterThresholdVariableTs_up_m;
    real_T RateLimiterThresholdVariableTs_up_i;
    real_T RateLimiterThresholdVariableTs_up_k;
    real_T RateLimiterThresholdVariableTs1_up;
    real_T AntiIceWing8000_tableData[4];
    real_T AntiIceWing8000_bp01Data[2];
    real_T AntiIceWing8000_bp02Data[2];
    real_T AntiIceWing8000_tableData_n[4];
    real_T AntiIceWing8000_bp01Data_p[2];
    real_T AntiIceWing8000_bp02Data_o[2];
    real_T AirConditioning8000_tableData[4];
    real_T AirConditioning8000_bp01Data[2];
    real_T AirConditioning8000_bp02Data[2];
    real_T AirConditioning8000_tableData_g[4];
    real_T AirConditioning8000_bp01Data_l[2];
    real_T AirConditioning8000_bp02Data_h[2];
    real_T AntiIceEngine8000_tableData[4];
    real_T AntiIceEngine8000_bp01Data[2];
    real_T AntiIceEngine8000_bp02Data[2];
    real_T AntiIceEngine8000_tableData_n[4];
    real_T AntiIceEngine8000_bp01Data_a[2];
    real_T AntiIceEngine8000_bp02Data_g[2];
    real_T GAAIE8000_tableData[4];
    real_T GAAIE8000_bp01Data[2];
    real_T GAAIE8000_bp02Data[2];
    real_T GAAIE8000_tableData_n[4];
    real_T GAAIE8000_bp01Data_i[2];
    real_T GAAIE8000_bp02Data_b[2];
    real_T GAAIW8000_tableData[4];
    real_T GAAIW8000_bp01Data[2];
    real_T GAAIW8000_bp02Data[2];
    real_T GAAIW8000_tableData_e[4];
    real_T GAAIW8000_bp01Data_i[2];
    real_T GAAIW8000_bp02Data_p[2];
    real_T GAAC8000_tableData[4];
    real_T GAAC8000_bp01Data[2];
    real_T GAAC8000_bp02Data[2];
    real_T GAAC8000_tableData_c[4];
    real_T GAAC8000_bp01Data_p[2];
    real_T GAAC8000_bp02Data_e[2];
    real_T MaximumClimb_tableData[390];
    real_T MaximumClimb_bp01Data[30];
    real_T MaximumClimb_bp02Data[13];
    real_T uDLookupTable_tableData[4];
    real_T uDLookupTable_bp01Data[2];
    real_T uDLookupTable_bp02Data[2];
    real_T Right_tableData[70];
    real_T Right_bp01Data[10];
    real_T Right_bp02Data[7];
    real_T Left_tableData[4];
    real_T Left_bp01Data[2];
    real_T Left_bp02Data[2];
    real_T AntiIceEngine_tableData[2];
    real_T AntiIceEngine_bp01Data[2];
    real_T AntiIceWing_tableData[2];
    real_T AntiIceWing_bp01Data[2];
    real_T AirConditioning_tableData[2];
    real_T AirConditioning_bp01Data[2];
    real_T OATCornerPoint_tableData[390];
    real_T OATCornerPoint_bp01Data[30];
    real_T OATCornerPoint_bp02Data[13];
    real_T AntiIceEngine_tableData_o[4];
    real_T AntiIceEngine_bp01Data_i[2];
    real_T AntiIceEngine_bp02Data[2];
    real_T AntiIceWing_tableData_k[4];
    real_T AntiIceWing_bp01Data_o[2];
    real_T AntiIceWing_bp02Data[2];
    real_T AirConditioning_tableData_g[4];
    real_T AirConditioning_bp01Data_e[2];
    real_T AirConditioning_bp02Data[2];
    real_T MaximumContinuous_tableData[390];
    real_T MaximumContinuous_bp01Data[30];
    real_T MaximumContinuous_bp02Data[13];
    real_T OATCornerPoint_tableData_f[390];
    real_T OATCornerPoint_bp01Data_k[30];
    real_T OATCornerPoint_bp02Data_b[13];
    real_T AntiIceEngine_tableData_f[4];
    real_T AntiIceEngine_bp01Data_b[2];
    real_T AntiIceEngine_bp02Data_k[2];
    real_T AntiIceWing_tableData_n[4];
    real_T AntiIceWing_bp01Data_c[2];
    real_T AntiIceWing_bp02Data_i[2];
    real_T AirConditioning_tableData_f[4];
    real_T AirConditioning_bp01Data_p[2];
    real_T AirConditioning_bp02Data_n[2];
    real_T Saturation_UpperSat;
    real_T Saturation_LowerSat;
    real_T MaximumTakeOff_tableData[756];
    real_T MaximumTakeOff_bp01Data[36];
    real_T MaximumTakeOff_bp02Data[21];
    real_T OATCornerPoint_tableData_fa[1044];
    real_T OATCornerPoint_bp01Data_j[36];
    real_T OATCornerPoint_bp02Data_d[29];
    real_T GoAround_tableData[756];
    real_T GoAround_bp01Data[36];
    real_T GoAround_bp02Data[21];
    real_T OATCornerPoint1_tableData[756];
    real_T OATCornerPoint1_bp01Data[36];
    real_T OATCornerPoint1_bp02Data[21];
    uint32_T AntiIceWing8000_maxIndex[2];
    uint32_T AntiIceWing8000_maxIndex_m[2];
    uint32_T AirConditioning8000_maxIndex[2];
    uint32_T AirConditioning8000_maxIndex_n[2];
    uint32_T AntiIceEngine8000_maxIndex[2];
    uint32_T AntiIceEngine8000_maxIndex_g[2];
    uint32_T GAAIE8000_maxIndex[2];
    uint32_T GAAIE8000_maxIndex_m[2];
    uint32_T GAAIW8000_maxIndex[2];
    uint32_T GAAIW8000_maxIndex_f[2];
    uint32_T GAAC8000_maxIndex[2];
    uint32_T GAAC8000_maxIndex_h[2];
    uint32_T MaximumClimb_maxIndex[2];
    uint32_T uDLookupTable_maxIndex[2];
    uint32_T Right_maxIndex[2];
    uint32_T Left_maxIndex[2];
    uint32_T OATCornerPoint_maxIndex[2];
    uint32_T AntiIceEngine_maxIndex[2];
    uint32_T AntiIceWing_maxIndex[2];
    uint32_T AirConditioning_maxIndex[2];
    uint32_T MaximumContinuous_maxIndex[2];
    uint32_T OATCornerPoint_maxIndex_l[2];
    uint32_T AntiIceEngine_maxIndex_a[2];
    uint32_T AntiIceWing_maxIndex_l[2];
    uint32_T AirConditioning_maxIndex_g[2];
    uint32_T MaximumTakeOff_maxIndex[2];
    uint32_T OATCornerPoint_maxIndex_d[2];
    uint32_T GoAround_maxIndex[2];
    uint32_T OATCornerPoint1_maxIndex[2];
  };

  ThrustLimitsModelClass(ThrustLimitsModelClass const&) =delete;
  ThrustLimitsModelClass& operator= (ThrustLimitsModelClass const&) & = delete;
  void setExternalInputs(const ExternalInputs_ThrustLimits_T *pExternalInputs_ThrustLimits_T)
  {
    ThrustLimits_U = *pExternalInputs_ThrustLimits_T;
  }

  const ExternalOutputs_ThrustLimits_T &getExternalOutputs() const
  {
    return ThrustLimits_Y;
  }

  static void initialize();
  void step();
  static void terminate();
  ThrustLimitsModelClass();
  ~ThrustLimitsModelClass();
 private:
  ExternalInputs_ThrustLimits_T ThrustLimits_U;
  ExternalOutputs_ThrustLimits_T ThrustLimits_Y;
  D_Work_ThrustLimits_T ThrustLimits_DWork;
  static Parameters_ThrustLimits_T ThrustLimits_P;
  static void ThrustLimits_RateLimiterwithThreshold(real_T rtu_U, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
    rtu_init, real_T rtu_threshold, real_T *rty_Y, rtDW_RateLimiterwithThreshold_ThrustLimits_T *localDW);
};

#endif

