#include "ThrustLimits.h"
#include "ThrustLimits_private.h"
#include "look1_binlxpw.h"
#include "look2_binlcpw.h"
#include "look2_binlxpw.h"

void ThrustLimitsModelClass::ThrustLimits_RateLimiterwithThreshold(real_T rtu_U, real_T rtu_up, real_T rtu_lo, real_T
  rtu_Ts, real_T rtu_init, real_T rtu_threshold, real_T *rty_Y, rtDW_RateLimiterwithThreshold_ThrustLimits_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  *rty_Y = std::fmax(std::fmin(rtu_U - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
    localDW->pY;
  if (std::abs(rtu_U - *rty_Y) > rtu_threshold) {
    *rty_Y = rtu_U;
  }

  localDW->pY = *rty_Y;
}

void ThrustLimitsModelClass::step()
{
  real_T deltaThrust;
  real_T rtb_GoAround;
  real_T rtb_ISA_degC;
  real_T rtb_Switch1;
  real_T rtb_Switch5;
  real_T rtb_Y_b;
  real_T rtb_Y_gg;
  real_T rtb_Y_id;
  boolean_T rtb_Compare;
  boolean_T rtb_OR6;
  boolean_T rtb_OR7;
  ThrustLimits_RateLimiterwithThreshold(ThrustLimits_U.in.thrust_limit_IDLE_percent + look2_binlxpw(static_cast<real_T>
    (ThrustLimits_U.in.is_anti_ice_engine_1_active || ThrustLimits_U.in.is_anti_ice_engine_2_active), static_cast<real_T>
    (ThrustLimits_U.in.is_anti_ice_wing_active), ThrustLimits_P.uDLookupTable_bp01Data,
    ThrustLimits_P.uDLookupTable_bp02Data, ThrustLimits_P.uDLookupTable_tableData, ThrustLimits_P.uDLookupTable_maxIndex,
    2U), ThrustLimits_P.RateLimiterThresholdVariableTs_up, ThrustLimits_P.RateLimiterThresholdVariableTs_lo,
    ThrustLimits_U.in.dt, ThrustLimits_P.RateLimiterThresholdVariableTs_InitialCondition,
    ThrustLimits_P.RateLimiterThresholdVariableTs_Threshold, &ThrustLimits_Y.out.thrust_limit_IDLE_percent,
    &ThrustLimits_DWork.sf_RateLimiterwithThreshold_n);
  rtb_ISA_degC = std::fmax(15.0 - 0.0019812 * ThrustLimits_U.in.H_ft, -56.5);
  ThrustLimits_RateLimiterwithThreshold((look1_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_anti_ice_engine_1_active
    || ThrustLimits_U.in.is_anti_ice_engine_2_active), ThrustLimits_P.AntiIceEngine_bp01Data,
    ThrustLimits_P.AntiIceEngine_tableData, 1U) + look1_binlxpw(static_cast<real_T>
    (ThrustLimits_U.in.is_anti_ice_wing_active), ThrustLimits_P.AntiIceWing_bp01Data,
    ThrustLimits_P.AntiIceWing_tableData, 1U)) + look1_binlxpw(static_cast<real_T>
    (ThrustLimits_U.in.is_air_conditioning_1_active || ThrustLimits_U.in.is_air_conditioning_2_active),
    ThrustLimits_P.AirConditioning_bp01Data, ThrustLimits_P.AirConditioning_tableData, 1U),
    ThrustLimits_P.RateLimiterThresholdVariableTs_up_p, ThrustLimits_P.RateLimiterThresholdVariableTs_lo_b,
    ThrustLimits_U.in.dt, ThrustLimits_P.RateLimiterThresholdVariableTs_InitialCondition_l,
    ThrustLimits_P.RateLimiterThresholdVariableTs_Threshold_e, &rtb_Y_b,
    &ThrustLimits_DWork.sf_RateLimiterwithThreshold_g);
  rtb_ISA_degC = look2_binlxpw(look2_binlxpw(ThrustLimits_U.in.H_ft, std::fmax(std::fmax(std::fmin
    (ThrustLimits_U.in.flex_temperature_degC, rtb_ISA_degC + 55.0), rtb_ISA_degC + 29.0), ThrustLimits_U.in.OAT_degC),
    ThrustLimits_P.Right_bp01Data, ThrustLimits_P.Right_bp02Data, ThrustLimits_P.Right_tableData,
    ThrustLimits_P.Right_maxIndex, 10U), ThrustLimits_U.in.TAT_degC, ThrustLimits_P.Left_bp01Data,
    ThrustLimits_P.Left_bp02Data, ThrustLimits_P.Left_tableData, ThrustLimits_P.Left_maxIndex, 2U) + rtb_Y_b;
  rtb_Switch5 = look2_binlcpw(ThrustLimits_U.in.TAT_degC, ThrustLimits_U.in.H_ft, ThrustLimits_P.OATCornerPoint_bp01Data,
    ThrustLimits_P.OATCornerPoint_bp02Data, ThrustLimits_P.OATCornerPoint_tableData,
    ThrustLimits_P.OATCornerPoint_maxIndex, 30U);
  ThrustLimits_RateLimiterwithThreshold((look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_anti_ice_engine_1_active
    || ThrustLimits_U.in.is_anti_ice_engine_2_active), rtb_Switch5, ThrustLimits_P.AntiIceEngine_bp01Data_i,
    ThrustLimits_P.AntiIceEngine_bp02Data, ThrustLimits_P.AntiIceEngine_tableData_o,
    ThrustLimits_P.AntiIceEngine_maxIndex, 2U) + look2_binlxpw(static_cast<real_T>
    (ThrustLimits_U.in.is_anti_ice_wing_active), rtb_Switch5, ThrustLimits_P.AntiIceWing_bp01Data_o,
    ThrustLimits_P.AntiIceWing_bp02Data, ThrustLimits_P.AntiIceWing_tableData_k, ThrustLimits_P.AntiIceWing_maxIndex, 2U))
    + look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_air_conditioning_1_active ||
    ThrustLimits_U.in.is_air_conditioning_2_active), rtb_Switch5, ThrustLimits_P.AirConditioning_bp01Data_e,
                    ThrustLimits_P.AirConditioning_bp02Data, ThrustLimits_P.AirConditioning_tableData_g,
                    ThrustLimits_P.AirConditioning_maxIndex, 2U), ThrustLimits_P.RateLimiterThresholdVariableTs_up_m,
    ThrustLimits_P.RateLimiterThresholdVariableTs_lo_d, ThrustLimits_U.in.dt,
    ThrustLimits_P.RateLimiterThresholdVariableTs_InitialCondition_l0,
    ThrustLimits_P.RateLimiterThresholdVariableTs_Threshold_o, &rtb_Y_b, &ThrustLimits_DWork.sf_RateLimiterwithThreshold);
  if (ThrustLimits_U.in.use_external_CLB_limit) {
    rtb_Switch5 = ThrustLimits_U.in.thrust_limit_CLB_percent;
  } else {
    rtb_Switch5 = look2_binlxpw(ThrustLimits_U.in.TAT_degC, ThrustLimits_U.in.H_ft, ThrustLimits_P.MaximumClimb_bp01Data,
      ThrustLimits_P.MaximumClimb_bp02Data, ThrustLimits_P.MaximumClimb_tableData, ThrustLimits_P.MaximumClimb_maxIndex,
      30U) + rtb_Y_b;
  }

  if (!ThrustLimits_DWork.prevThrustLimitType_not_empty) {
    ThrustLimits_DWork.prevThrustLimitType = ThrustLimits_U.in.thrust_limit_type;
    ThrustLimits_DWork.prevThrustLimitType_not_empty = true;
  }

  ThrustLimits_DWork.isFlexActive = ((ThrustLimits_U.in.thrust_limit_type == 3.0) ||
    ((ThrustLimits_DWork.prevFlexTemperature == 0.0) && (ThrustLimits_U.in.flex_temperature_degC != 0.0)) ||
    ((ThrustLimits_U.in.flex_temperature_degC != 0.0) && (ThrustLimits_U.in.thrust_limit_type != 2.0) &&
     (ThrustLimits_U.in.thrust_limit_type != 4.0) && ThrustLimits_DWork.isFlexActive));
  if (ThrustLimits_DWork.isFlexActive && (ThrustLimits_DWork.prevThrustLimitType == 3.0) &&
      (ThrustLimits_U.in.thrust_limit_type == 1.0)) {
    ThrustLimits_DWork.isTransitionActive = true;
    ThrustLimits_DWork.transitionStartTime = ThrustLimits_U.in.simulation_time_s;
    ThrustLimits_DWork.transitionFactor = (rtb_Switch5 - rtb_ISA_degC) / 30.0;
  } else if (!ThrustLimits_DWork.isFlexActive) {
    ThrustLimits_DWork.isTransitionActive = false;
    ThrustLimits_DWork.transitionStartTime = 0.0;
    ThrustLimits_DWork.transitionFactor = 0.0;
  }

  if (ThrustLimits_DWork.isTransitionActive) {
    rtb_Y_b = std::fmax(0.0, (ThrustLimits_U.in.simulation_time_s - ThrustLimits_DWork.transitionStartTime) - 10.0);
    if ((rtb_Y_b > 0.0) && (rtb_Switch5 > rtb_ISA_degC)) {
      deltaThrust = std::fmin(rtb_Switch5 - rtb_ISA_degC, rtb_Y_b * ThrustLimits_DWork.transitionFactor);
    } else {
      deltaThrust = 0.0;
    }

    if (rtb_ISA_degC + deltaThrust >= rtb_Switch5) {
      ThrustLimits_DWork.isFlexActive = false;
      ThrustLimits_DWork.isTransitionActive = false;
    }
  } else {
    deltaThrust = 0.0;
  }

  ThrustLimits_DWork.prevThrustLimitType = ThrustLimits_U.in.thrust_limit_type;
  ThrustLimits_DWork.prevFlexTemperature = ThrustLimits_U.in.flex_temperature_degC;
  rtb_Y_gg = look2_binlcpw(ThrustLimits_U.in.TAT_degC, ThrustLimits_U.in.H_ft, ThrustLimits_P.OATCornerPoint_bp01Data_k,
    ThrustLimits_P.OATCornerPoint_bp02Data_b, ThrustLimits_P.OATCornerPoint_tableData_f,
    ThrustLimits_P.OATCornerPoint_maxIndex_l, 30U);
  ThrustLimits_RateLimiterwithThreshold((look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_anti_ice_engine_1_active
    || ThrustLimits_U.in.is_anti_ice_engine_2_active), rtb_Y_gg, ThrustLimits_P.AntiIceEngine_bp01Data_b,
    ThrustLimits_P.AntiIceEngine_bp02Data_k, ThrustLimits_P.AntiIceEngine_tableData_f,
    ThrustLimits_P.AntiIceEngine_maxIndex_a, 2U) + look2_binlxpw(static_cast<real_T>
    (ThrustLimits_U.in.is_anti_ice_wing_active), rtb_Y_gg, ThrustLimits_P.AntiIceWing_bp01Data_c,
    ThrustLimits_P.AntiIceWing_bp02Data_i, ThrustLimits_P.AntiIceWing_tableData_n, ThrustLimits_P.AntiIceWing_maxIndex_l,
    2U)) + look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_air_conditioning_1_active ||
    ThrustLimits_U.in.is_air_conditioning_2_active), rtb_Y_gg, ThrustLimits_P.AirConditioning_bp01Data_p,
    ThrustLimits_P.AirConditioning_bp02Data_n, ThrustLimits_P.AirConditioning_tableData_f,
    ThrustLimits_P.AirConditioning_maxIndex_g, 2U), ThrustLimits_P.RateLimiterThresholdVariableTs_up_i,
    ThrustLimits_P.RateLimiterThresholdVariableTs_lo_n, ThrustLimits_U.in.dt,
    ThrustLimits_P.RateLimiterThresholdVariableTs_InitialCondition_a,
    ThrustLimits_P.RateLimiterThresholdVariableTs_Threshold_c, &rtb_GoAround,
    &ThrustLimits_DWork.sf_RateLimiterwithThreshold_m);
  rtb_Y_b = look2_binlxpw(ThrustLimits_U.in.TAT_degC, ThrustLimits_U.in.H_ft, ThrustLimits_P.MaximumContinuous_bp01Data,
    ThrustLimits_P.MaximumContinuous_bp02Data, ThrustLimits_P.MaximumContinuous_tableData,
    ThrustLimits_P.MaximumContinuous_maxIndex, 30U) + rtb_GoAround;
  if (ThrustLimits_U.in.H_ft > ThrustLimits_P.Saturation_UpperSat) {
    rtb_Y_id = ThrustLimits_P.Saturation_UpperSat;
  } else if (ThrustLimits_U.in.H_ft < ThrustLimits_P.Saturation_LowerSat) {
    rtb_Y_id = ThrustLimits_P.Saturation_LowerSat;
  } else {
    rtb_Y_id = ThrustLimits_U.in.H_ft;
  }

  rtb_OR6 = (ThrustLimits_U.in.is_anti_ice_engine_1_active || ThrustLimits_U.in.is_anti_ice_engine_2_active);
  rtb_GoAround = look2_binlcpw(ThrustLimits_U.in.TAT_degC, rtb_Y_id, ThrustLimits_P.OATCornerPoint_bp01Data_j,
    ThrustLimits_P.OATCornerPoint_bp02Data_d, ThrustLimits_P.OATCornerPoint_tableData_fa,
    ThrustLimits_P.OATCornerPoint_maxIndex_d, 36U);
  rtb_Compare = (rtb_Y_id <= ThrustLimits_P.CompareToConstant_const);
  if (rtb_Compare) {
    rtb_Y_gg = look2_binlxpw(static_cast<real_T>(rtb_OR6), rtb_GoAround, ThrustLimits_P.AntiIceEngine8000_bp01Data,
      ThrustLimits_P.AntiIceEngine8000_bp02Data, ThrustLimits_P.AntiIceEngine8000_tableData,
      ThrustLimits_P.AntiIceEngine8000_maxIndex, 2U);
    rtb_Switch1 = look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_anti_ice_wing_active), rtb_GoAround,
      ThrustLimits_P.AntiIceWing8000_bp01Data, ThrustLimits_P.AntiIceWing8000_bp02Data,
      ThrustLimits_P.AntiIceWing8000_tableData, ThrustLimits_P.AntiIceWing8000_maxIndex, 2U);
  } else {
    rtb_Y_gg = look2_binlxpw(static_cast<real_T>(rtb_OR6), rtb_GoAround, ThrustLimits_P.AntiIceEngine8000_bp01Data_a,
      ThrustLimits_P.AntiIceEngine8000_bp02Data_g, ThrustLimits_P.AntiIceEngine8000_tableData_n,
      ThrustLimits_P.AntiIceEngine8000_maxIndex_g, 2U);
    rtb_Switch1 = look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_anti_ice_wing_active), rtb_GoAround,
      ThrustLimits_P.AntiIceWing8000_bp01Data_p, ThrustLimits_P.AntiIceWing8000_bp02Data_o,
      ThrustLimits_P.AntiIceWing8000_tableData_n, ThrustLimits_P.AntiIceWing8000_maxIndex_m, 2U);
  }

  rtb_OR7 = (ThrustLimits_U.in.is_air_conditioning_1_active || ThrustLimits_U.in.is_air_conditioning_2_active);
  if (rtb_Compare) {
    rtb_GoAround = look2_binlxpw(static_cast<real_T>(rtb_OR7), rtb_GoAround, ThrustLimits_P.AirConditioning8000_bp01Data,
      ThrustLimits_P.AirConditioning8000_bp02Data, ThrustLimits_P.AirConditioning8000_tableData,
      ThrustLimits_P.AirConditioning8000_maxIndex, 2U);
  } else {
    rtb_GoAround = look2_binlxpw(static_cast<real_T>(rtb_OR7), rtb_GoAround,
      ThrustLimits_P.AirConditioning8000_bp01Data_l, ThrustLimits_P.AirConditioning8000_bp02Data_h,
      ThrustLimits_P.AirConditioning8000_tableData_g, ThrustLimits_P.AirConditioning8000_maxIndex_n, 2U);
  }

  ThrustLimits_RateLimiterwithThreshold((rtb_Y_gg + rtb_Switch1) + rtb_GoAround,
    ThrustLimits_P.RateLimiterThresholdVariableTs_up_k, ThrustLimits_P.RateLimiterThresholdVariableTs_lo_h,
    ThrustLimits_U.in.dt, ThrustLimits_P.RateLimiterThresholdVariableTs_InitialCondition_lb,
    ThrustLimits_P.RateLimiterThresholdVariableTs_Threshold_g, &rtb_Y_gg,
    &ThrustLimits_DWork.sf_RateLimiterwithThreshold_p);
  if (ThrustLimits_DWork.isFlexActive) {
    ThrustLimits_Y.out.thrust_limit_CLB_percent = std::fmin(rtb_Switch5, rtb_ISA_degC) + deltaThrust;
  } else {
    ThrustLimits_Y.out.thrust_limit_CLB_percent = rtb_Switch5;
  }

  ThrustLimits_Y.out.thrust_limit_FLEX_percent = rtb_ISA_degC;
  ThrustLimits_Y.out.thrust_limit_MCT_percent = rtb_Y_b;
  ThrustLimits_Y.out.thrust_limit_TOGA_percent = std::fmax(rtb_Y_b, look2_binlxpw(ThrustLimits_U.in.TAT_degC, rtb_Y_id,
    ThrustLimits_P.MaximumTakeOff_bp01Data, ThrustLimits_P.MaximumTakeOff_bp02Data,
    ThrustLimits_P.MaximumTakeOff_tableData, ThrustLimits_P.MaximumTakeOff_maxIndex, 36U) + rtb_Y_gg);
  rtb_ISA_degC = look2_binlcpw(ThrustLimits_U.in.TAT_degC, rtb_Y_id, ThrustLimits_P.OATCornerPoint1_bp01Data,
    ThrustLimits_P.OATCornerPoint1_bp02Data, ThrustLimits_P.OATCornerPoint1_tableData,
    ThrustLimits_P.OATCornerPoint1_maxIndex, 36U);
  if (rtb_Y_id <= ThrustLimits_P.CompareToConstant1_const) {
    rtb_Y_id = look2_binlxpw(static_cast<real_T>(rtb_OR6), rtb_ISA_degC, ThrustLimits_P.GAAIE8000_bp01Data,
      ThrustLimits_P.GAAIE8000_bp02Data, ThrustLimits_P.GAAIE8000_tableData, ThrustLimits_P.GAAIE8000_maxIndex, 2U);
    rtb_Y_b = look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_anti_ice_wing_active), rtb_ISA_degC,
      ThrustLimits_P.GAAIW8000_bp01Data, ThrustLimits_P.GAAIW8000_bp02Data, ThrustLimits_P.GAAIW8000_tableData,
      ThrustLimits_P.GAAIW8000_maxIndex, 2U);
    rtb_Switch5 = look2_binlxpw(static_cast<real_T>(rtb_OR7), rtb_ISA_degC, ThrustLimits_P.GAAC8000_bp01Data,
      ThrustLimits_P.GAAC8000_bp02Data, ThrustLimits_P.GAAC8000_tableData, ThrustLimits_P.GAAC8000_maxIndex, 2U);
  } else {
    rtb_Y_id = look2_binlxpw(static_cast<real_T>(rtb_OR6), rtb_ISA_degC, ThrustLimits_P.GAAIE8000_bp01Data_i,
      ThrustLimits_P.GAAIE8000_bp02Data_b, ThrustLimits_P.GAAIE8000_tableData_n, ThrustLimits_P.GAAIE8000_maxIndex_m, 2U);
    rtb_Y_b = look2_binlxpw(static_cast<real_T>(ThrustLimits_U.in.is_anti_ice_wing_active), rtb_ISA_degC,
      ThrustLimits_P.GAAIW8000_bp01Data_i, ThrustLimits_P.GAAIW8000_bp02Data_p, ThrustLimits_P.GAAIW8000_tableData_e,
      ThrustLimits_P.GAAIW8000_maxIndex_f, 2U);
    rtb_Switch5 = look2_binlxpw(static_cast<real_T>(rtb_OR7), rtb_ISA_degC, ThrustLimits_P.GAAC8000_bp01Data_p,
      ThrustLimits_P.GAAC8000_bp02Data_e, ThrustLimits_P.GAAC8000_tableData_c, ThrustLimits_P.GAAC8000_maxIndex_h, 2U);
  }

  ThrustLimits_RateLimiterwithThreshold((rtb_Y_id + rtb_Y_b) + rtb_Switch5,
    ThrustLimits_P.RateLimiterThresholdVariableTs1_up, ThrustLimits_P.RateLimiterThresholdVariableTs1_lo,
    ThrustLimits_U.in.dt, ThrustLimits_P.RateLimiterThresholdVariableTs1_InitialCondition,
    ThrustLimits_P.RateLimiterThresholdVariableTs1_Threshold, &rtb_Y_id,
    &ThrustLimits_DWork.sf_RateLimiterwithThreshold_ms);
}

void ThrustLimitsModelClass::initialize()
{
}

void ThrustLimitsModelClass::terminate()
{
}

ThrustLimitsModelClass::ThrustLimitsModelClass():
  ThrustLimits_U(),
  ThrustLimits_Y(),
  ThrustLimits_DWork()
{
}

ThrustLimitsModelClass::~ThrustLimitsModelClass()
{
}
