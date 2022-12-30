#include "FacComputer.h"
#include "FacComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"

const uint8_T FacComputer_IN_Flying{ 1U };

const uint8_T FacComputer_IN_Landed{ 2U };

const uint8_T FacComputer_IN_Landing100ft{ 3U };

const uint8_T FacComputer_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T FacComputer_IN_Takeoff100ft{ 4U };

void FacComputer::FacComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void FacComputer::FacComputer_MATLABFunction_f(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
{
  real32_T tmp;
  uint32_T a;
  tmp = std::round(rtu_u->Data);
  if (tmp < 4.2949673E+9F) {
    if (tmp >= 0.0F) {
      a = static_cast<uint32_T>(tmp);
    } else {
      a = 0U;
    }
  } else {
    a = MAX_uint32_T;
  }

  if (-(rtu_bit - 1.0) >= 0.0) {
    if (-(rtu_bit - 1.0) <= 31.0) {
      a <<= static_cast<uint8_T>(-(rtu_bit - 1.0));
    } else {
      a = 0U;
    }
  } else if (-(rtu_bit - 1.0) >= -31.0) {
    a >>= static_cast<uint8_T>(rtu_bit - 1.0);
  } else {
    a = 0U;
  }

  *rty_y = a & 1U;
}

void FacComputer::FacComputer_LagFilter_Reset(rtDW_LagFilter_FacComputer_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FacComputer::FacComputer_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_FacComputer_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void FacComputer::FacComputer_MATLABFunction_d(boolean_T rtu_bit1, boolean_T rtu_bit2, boolean_T rtu_bit3, boolean_T
  rtu_bit4, boolean_T rtu_bit5, boolean_T rtu_bit6, real_T *rty_handleIndex)
{
  if (rtu_bit1) {
    *rty_handleIndex = 0.0;
  } else if (rtu_bit2 && rtu_bit6) {
    *rty_handleIndex = 1.0;
  } else if (rtu_bit2 && (!rtu_bit6)) {
    *rty_handleIndex = 2.0;
  } else if (rtu_bit3) {
    *rty_handleIndex = 3.0;
  } else if (rtu_bit4) {
    *rty_handleIndex = 4.0;
  } else if (rtu_bit5) {
    *rty_handleIndex = 5.0;
  } else {
    *rty_handleIndex = 0.0;
  }
}

void FacComputer::FacComputer_RateLimiter_Reset(rtDW_RateLimiter_FacComputer_T *localDW)
{
  localDW->pY_not_empty = false;
}

void FacComputer::FacComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, boolean_T rtu_reset,
  real_T *rty_Y, rtDW_RateLimiter_FacComputer_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_u;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_u;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void FacComputer::FacComputer_CalculateV_alpha_max(real_T rtu_v_ias, real_T rtu_alpha, real_T rtu_alpha_0, real_T
  rtu_alpha_target, real_T *rty_V_alpha_target)
{
  *rty_V_alpha_target = std::sqrt(std::abs(rtu_alpha - rtu_alpha_0) / (rtu_alpha_target - rtu_alpha_0)) * rtu_v_ias;
}

void FacComputer::FacComputer_LagFilter_n_Reset(rtDW_LagFilter_FacComputer_g_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FacComputer::FacComputer_LagFilter_k(real32_T rtu_U, real_T rtu_C1, real_T rtu_dt, real32_T *rty_Y,
  rtDW_LagFilter_FacComputer_g_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = static_cast<real32_T>((2.0 - denom_tmp) / (denom_tmp + 2.0)) * localDW->pY + (rtu_U * static_cast<real32_T>
    (ca) + localDW->pU * static_cast<real32_T>(ca));
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void FacComputer::FacComputer_MATLABFunction_i_Reset(rtDW_MATLABFunction_FacComputer_f_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void FacComputer::FacComputer_MATLABFunction_p(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_FacComputer_f_T *localDW)
{
  if (rtu_u == rtu_isRisingEdge) {
    localDW->timeSinceCondition += rtu_Ts;
    if (localDW->timeSinceCondition >= rtu_timeDelay) {
      localDW->output = rtu_u;
    }
  } else {
    localDW->timeSinceCondition = 0.0;
    localDW->output = rtu_u;
  }

  *rty_y = localDW->output;
}

void FacComputer::FacComputer_MATLABFunction_g(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void FacComputer::step()
{
  real_T rtb_Switch1_a;
  real_T rtb_Switch4_f;
  real_T rtb_Switch_b;
  real_T rtb_V_alpha_target;
  real_T rtb_V_alpha_target_l;
  real32_T rtb_y_bp;
  real32_T rtb_y_dr;
  real32_T rtb_y_e;
  real32_T rtb_y_i3;
  real32_T rtb_y_iu;
  uint32_T rtb_y;
  uint32_T rtb_y_bm;
  uint32_T rtb_y_c;
  uint32_T rtb_y_k;
  uint32_T rtb_y_la;
  uint32_T rtb_y_p;
  uint32_T rtb_y_pj;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_Memory;
  boolean_T rtb_OR_k;
  boolean_T rtb_y_b;
  boolean_T rtb_y_j;
  if (FacComputer_U.in.sim_data.computer_running) {
    real_T rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg;
    real_T rtb_Gain_f;
    real_T rtb_OR_d;
    real_T rtb_beDot;
    int32_T rtb_Switch2;
    int32_T rtb_Switch4_a;
    int32_T rtb_alpha_floor_inhib;
    real32_T rtb_V_ias;
    real32_T rtb_V_tas;
    real32_T rtb_alpha;
    real32_T rtb_mach;
    real32_T rtb_n_x;
    real32_T rtb_n_y;
    real32_T rtb_n_z;
    real32_T rtb_phi;
    real32_T rtb_phi_dot;
    real32_T rtb_q;
    real32_T rtb_r;
    real32_T rtb_theta;
    real32_T rtb_theta_dot;
    boolean_T guard1{ false };

    boolean_T rtb_AND1;
    boolean_T rtb_BusAssignment_c_logic_lgciu_own_valid;
    boolean_T rtb_BusAssignment_h_logic_on_ground;
    boolean_T rtb_BusAssignment_h_logic_speed_scale_visible;
    boolean_T rtb_DataTypeConversion_c;
    boolean_T rtb_DataTypeConversion_e;
    boolean_T rtb_DataTypeConversion_hw;
    boolean_T rtb_Switch_i_idx_1;
    boolean_T rtb_Switch_i_idx_2;
    boolean_T rtb_adr3Invalid;
    boolean_T rtb_adrOppInvalid;
    boolean_T rtb_adrOwnInvalid;
    boolean_T rtb_ir3Invalid;
    boolean_T rtb_irOppInvalid;
    boolean_T rtb_irOwnInvalid;
    boolean_T rtb_rudderTravelLimEngaged;
    boolean_T rtb_rudderTrimEngaged;
    boolean_T rtb_yawDamperEngaged;
    boolean_T rudderTravelLimCanEngage;
    boolean_T rudderTrimCanEngage;
    boolean_T rudderTrimHasPriority;
    boolean_T yawDamperCanEngage;
    boolean_T yawDamperHasPriority;
    boolean_T yawDamperHasPriority_tmp;
    if (!FacComputer_DWork.Runtime_MODE) {
      FacComputer_DWork.Delay_DSTATE = FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
      FacComputer_DWork.Delay1_DSTATE = FacComputer_P.Delay1_InitialCondition;
      FacComputer_DWork.Memory_PreviousInput = FacComputer_P.SRFlipFlop_initial_condition;
      FacComputer_DWork.Delay2_DSTATE = FacComputer_P.Delay2_InitialCondition;
      FacComputer_DWork.Delay_DSTATE_d = FacComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
      FacComputer_DWork.Delay_DSTATE_m = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition;
      FacComputer_DWork.Delay_DSTATE_k = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition_a;
      FacComputer_MATLABFunction_i_Reset(&FacComputer_DWork.sf_MATLABFunction_ax);
      FacComputer_MATLABFunction_i_Reset(&FacComputer_DWork.sf_MATLABFunction_p);
      FacComputer_LagFilter_Reset(&FacComputer_DWork.sf_LagFilter_b);
      FacComputer_LagFilter_n_Reset(&FacComputer_DWork.sf_LagFilter_k);
      FacComputer_LagFilter_Reset(&FacComputer_DWork.sf_LagFilter_f);
      FacComputer_LagFilter_n_Reset(&FacComputer_DWork.sf_LagFilter_d);
      FacComputer_LagFilter_Reset(&FacComputer_DWork.sf_LagFilter_c);
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter);
      FacComputer_LagFilter_Reset(&FacComputer_DWork.sf_LagFilter);
      FacComputer_DWork.is_active_c15_FacComputer = 0U;
      FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_NO_ACTIVE_CHILD;
      FacComputer_DWork.sAlphaFloor = 0.0;
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_c);
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_a);
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_n);
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_j);
      FacComputer_DWork.previousInput_not_empty = false;
      FacComputer_DWork.pY_not_empty = false;
      FacComputer_DWork.pU_not_empty = false;
      FacComputer_DWork.pY_not_empty_l = false;
      FacComputer_DWork.Runtime_MODE = true;
    }

    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel1_bit, &rtb_y_c);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5, &rtb_y_j);
    rtb_AND1 = ((rtb_y_c != 0U) && rtb_y_j);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel4_bit, &rtb_y_bm);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel3_bit, &rtb_y_la);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel2_bit, &rtb_y_c);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_1, &rtb_Memory);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      FacComputer_P.BitfromLabel_bit, &rtb_y_pj);
    FacComputer_MATLABFunction_p(FacComputer_U.in.discrete_inputs.nose_gear_pressed == (rtb_y_pj != 0U),
      FacComputer_U.in.time.dt, FacComputer_P.ConfirmNode_isRisingEdge, FacComputer_P.ConfirmNode_timeDelay, &rtb_OR_k,
      &FacComputer_DWork.sf_MATLABFunction_ax);
    rtb_Memory = (rtb_Memory && rtb_OR_k);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      FacComputer_P.BitfromLabel5_bit, &rtb_y_pj);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      FacComputer_P.BitfromLabel6_bit, &rtb_y_k);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_3,
      FacComputer_P.BitfromLabel7_bit, &rtb_y_p);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_3,
      FacComputer_P.BitfromLabel8_bit, &rtb_y);
    if (rtb_Memory) {
      rtb_y_j = (rtb_y_pj != 0U);
      rtb_Switch_i_idx_1 = (rtb_y_k != 0U);
      rtb_Switch_i_idx_2 = ((rtb_y_p != 0U) || (rtb_y != 0U));
    } else if (rtb_AND1) {
      rtb_y_j = (rtb_y_bm != 0U);
      rtb_Switch_i_idx_1 = (rtb_y_la != 0U);
      rtb_Switch_i_idx_2 = (rtb_y_c != 0U);
    } else {
      rtb_y_j = FacComputer_P.Constant_Value_c;
      rtb_Switch_i_idx_1 = FacComputer_P.Constant_Value_c;
      rtb_Switch_i_idx_2 = FacComputer_P.Constant_Value_c;
    }

    rtb_adrOwnInvalid = ((FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) ||
                         (FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)));
    rtb_adrOppInvalid = ((FacComputer_U.in.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) ||
                         (FacComputer_U.in.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)));
    rtb_adr3Invalid = ((FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::FailureWarning)) ||
                       (FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::FailureWarning)));
    rtb_irOwnInvalid = ((FacComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FacComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)));
    rtb_irOppInvalid = ((FacComputer_U.in.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FacComputer_U.in.bus_inputs.ir_opp_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)));
    rtb_ir3Invalid = ((FacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) ||
                      (FacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)));
    if (!rtb_adrOwnInvalid) {
      rtb_V_ias = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.Data;
      rtb_V_tas = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.Data;
      rtb_mach = FacComputer_U.in.bus_inputs.adr_own_bus.mach.Data;
      rtb_alpha = FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.Data;
    } else if (!rtb_adr3Invalid) {
      rtb_V_ias = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_V_tas = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_mach = FacComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_alpha = FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach = 0.0F;
      rtb_alpha = 0.0F;
    }

    if (!rtb_irOwnInvalid) {
      rtb_theta = FacComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.Data;
      rtb_phi = FacComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.Data;
      rtb_q = FacComputer_U.in.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.Data;
      rtb_r = FacComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = FacComputer_U.in.bus_inputs.ir_own_bus.body_long_accel_g.Data;
      rtb_n_y = FacComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.Data;
      rtb_n_z = FacComputer_U.in.bus_inputs.ir_own_bus.body_normal_accel_g.Data;
      rtb_theta_dot = FacComputer_U.in.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = FacComputer_U.in.bus_inputs.ir_own_bus.roll_att_rate_deg_s.Data;
    } else if (!rtb_ir3Invalid) {
      rtb_theta = FacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      rtb_phi = FacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      rtb_q = FacComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
      rtb_r = FacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = FacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      rtb_n_y = FacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      rtb_n_z = FacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      rtb_theta_dot = FacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = FacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    } else {
      rtb_theta = 0.0F;
      rtb_phi = 0.0F;
      rtb_q = 0.0F;
      rtb_r = 0.0F;
      rtb_n_x = 0.0F;
      rtb_n_y = 0.0F;
      rtb_n_z = 0.0F;
      rtb_theta_dot = 0.0F;
      rtb_phi_dot = 0.0F;
    }

    rtb_V_alpha_target_l = rtb_n_y;
    rtb_Switch1_a = rtb_theta_dot;
    rtb_BusAssignment_c_logic_lgciu_own_valid = rtb_Memory;
    rtb_AND1 = ((!rtb_Memory) && (!rtb_AND1));
    rtb_Memory = (rtb_y_j || rtb_Switch_i_idx_1);
    yawDamperCanEngage = (FacComputer_U.in.discrete_inputs.yaw_damper_has_hyd_press &&
                          FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    yawDamperHasPriority_tmp = !FacComputer_U.in.discrete_inputs.is_unit_1;
    yawDamperHasPriority = (FacComputer_U.in.discrete_inputs.is_unit_1 || (yawDamperHasPriority_tmp &&
      (!FacComputer_U.in.discrete_inputs.yaw_damper_opp_engaged)));
    rtb_yawDamperEngaged = (yawDamperCanEngage && yawDamperHasPriority);
    rudderTrimCanEngage = (FacComputer_U.in.discrete_inputs.rudder_trim_actuator_healthy &&
      FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    rudderTrimHasPriority = (FacComputer_U.in.discrete_inputs.is_unit_1 || (yawDamperHasPriority_tmp &&
      (!FacComputer_U.in.discrete_inputs.rudder_trim_opp_engaged)));
    rtb_rudderTrimEngaged = (rudderTrimCanEngage && rudderTrimHasPriority);
    rudderTravelLimCanEngage = (FacComputer_U.in.discrete_inputs.rudder_travel_lim_actuator_healthy &&
      FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    yawDamperHasPriority_tmp = (FacComputer_U.in.discrete_inputs.is_unit_1 || (yawDamperHasPriority_tmp &&
      (!FacComputer_U.in.discrete_inputs.rudder_travel_lim_opp_engaged)));
    rtb_rudderTravelLimEngaged = (rudderTravelLimCanEngage && yawDamperHasPriority_tmp);
    FacComputer_MATLABFunction_p(!rtb_Memory, FacComputer_U.in.time.dt, FacComputer_P.ConfirmNode_isRisingEdge_o,
      FacComputer_P.ConfirmNode_timeDelay_l, &rtb_OR_k, &FacComputer_DWork.sf_MATLABFunction_p);
    rtb_BusAssignment_h_logic_on_ground = rtb_Memory;
    rtb_BusAssignment_h_logic_speed_scale_visible = rtb_OR_k;
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg, &rtb_OR_k);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg, &rtb_y_b);
    rtb_Switch4_f = std::fmax(rtb_V_tas * 0.5144, 60.0);
    rtb_beDot = rtb_V_ias * 0.5144;
    if (rtb_V_ias >= 60.0F) {
      if (rtb_OR_k) {
        rtb_OR_d = FacComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data;
      } else if (rtb_y_b) {
        rtb_OR_d = FacComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data;
      } else {
        rtb_OR_d = FacComputer_P.Constant_Value_n;
      }

      rtb_beDot = (rtb_beDot * rtb_beDot * 0.6125 * 122.0 / (70000.0 * rtb_Switch4_f) * 3.172 *
                   (FacComputer_P.Gain_Gain_h * rtb_OR_d) * 3.1415926535897931 / 180.0 + (rtb_phi * 3.1415926535897931 /
        180.0 * (9.81 / rtb_Switch4_f) + -(rtb_r * 3.1415926535897931 / 180.0))) * 180.0 / 3.1415926535897931;
    } else {
      rtb_beDot = 0.0;
    }

    FacComputer_LagFilter(rtb_beDot, FacComputer_P.LagFilter_C1, FacComputer_U.in.time.dt, &rtb_Switch4_f,
                          &FacComputer_DWork.sf_LagFilter_b);
    FacComputer_LagFilter_k(FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data -
      FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data, FacComputer_P.LagFilter1_C1,
      FacComputer_U.in.time.dt, &rtb_y_i3, &FacComputer_DWork.sf_LagFilter_k);
    if (rtb_alpha > FacComputer_P.Saturation_UpperSat_a) {
      rtb_beDot = FacComputer_P.Saturation_UpperSat_a;
    } else if (rtb_alpha < FacComputer_P.Saturation_LowerSat_l) {
      rtb_beDot = FacComputer_P.Saturation_LowerSat_l;
    } else {
      rtb_beDot = rtb_alpha;
    }

    FacComputer_LagFilter(rtb_beDot, FacComputer_P.LagFilter2_C1, FacComputer_U.in.time.dt, &rtb_Switch1_a,
                          &FacComputer_DWork.sf_LagFilter_f);
    FacComputer_LagFilter_k(FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data -
      FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data, FacComputer_P.LagFilter3_C1,
      FacComputer_U.in.time.dt, &rtb_y_e, &FacComputer_DWork.sf_LagFilter_d);
    if (rtb_V_ias > FacComputer_P.Saturation1_UpperSat_o) {
      rtb_Switch_b = FacComputer_P.Saturation1_UpperSat_o;
    } else if (rtb_V_ias < FacComputer_P.Saturation1_LowerSat_n) {
      rtb_Switch_b = FacComputer_P.Saturation1_LowerSat_n;
    } else {
      rtb_Switch_b = rtb_V_ias;
    }

    rtb_Switch_b = (rtb_Switch1_a * rtb_y_e * FacComputer_P.Gain5_Gain + FacComputer_P.Gain4_Gain * rtb_y_i3) /
      rtb_Switch_b / rtb_Switch_b * FacComputer_P.Gain_Gain_k;
    rtb_beDot = rtb_Switch_b;
    FacComputer_LagFilter(static_cast<real_T>(rtb_alpha), FacComputer_P.LagFilter_C1_f, FacComputer_U.in.time.dt,
                          &rtb_Switch_b, &FacComputer_DWork.sf_LagFilter_c);
    rtb_OR_d = rtb_Switch4_f;
    rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg = rtb_Switch_b;
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2,
      FacComputer_P.BitfromLabel6_bit_m, &rtb_y_c);
    rtb_OR_k = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2,
      FacComputer_P.BitfromLabel7_bit_i, &rtb_y_c);
    rtb_y_b = (rtb_OR_k || (rtb_y_c != 0U));
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel_bit_i, &rtb_y_c);
    rtb_Memory = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel1_bit_b, &rtb_y_c);
    rtb_OR_k = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel2_bit_d, &rtb_y_c);
    rtb_DataTypeConversion_c = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel3_bit_n, &rtb_y_c);
    rtb_DataTypeConversion_hw = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel4_bit_c, &rtb_y_c);
    rtb_DataTypeConversion_e = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel5_bit_g, &rtb_y_c);
    FacComputer_MATLABFunction_d(rtb_Memory, rtb_OR_k, rtb_DataTypeConversion_c, rtb_DataTypeConversion_hw,
      rtb_DataTypeConversion_e, rtb_y_c != 0U, &rtb_Switch4_f);
    FacComputer_RateLimiter(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_Switch4_f,
      FacComputer_P.alphafloor_bp01Data, FacComputer_P.alphafloor_bp02Data, FacComputer_P.alphafloor_tableData,
      FacComputer_P.alphafloor_maxIndex, 4U), FacComputer_P.RateLimiterGenericVariableTs1_up,
      FacComputer_P.RateLimiterGenericVariableTs1_lo, FacComputer_U.in.time.dt, FacComputer_P.reset_Value,
      &rtb_Switch1_a, &FacComputer_DWork.sf_RateLimiter);
    rtb_Gain_f = FacComputer_P.DiscreteDerivativeVariableTs_Gain * rtb_V_ias;
    rtb_Switch_b = rtb_Gain_f - FacComputer_DWork.Delay_DSTATE;
    FacComputer_LagFilter(rtb_Switch_b / FacComputer_U.in.time.dt, FacComputer_P.LagFilter_C1_k,
                          FacComputer_U.in.time.dt, &rtb_Switch_b, &FacComputer_DWork.sf_LagFilter);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft, &rtb_OR_k);
    if (rtb_OR_k) {
      rtb_V_alpha_target = FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft.Data;
    } else {
      rtb_V_alpha_target = FacComputer_P.Constant_Value;
    }

    if (FacComputer_DWork.is_active_c15_FacComputer == 0U) {
      FacComputer_DWork.is_active_c15_FacComputer = 1U;
      FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
      rtb_alpha_floor_inhib = 1;
    } else {
      switch (FacComputer_DWork.is_c15_FacComputer) {
       case FacComputer_IN_Flying:
        if (rtb_V_alpha_target < 100.0) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landing100ft;
          rtb_alpha_floor_inhib = 1;
        } else if (rtb_BusAssignment_h_logic_on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;

       case FacComputer_IN_Landed:
        if (!rtb_BusAssignment_h_logic_on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Takeoff100ft;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       case FacComputer_IN_Landing100ft:
        if (rtb_V_alpha_target > 100.0) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else if (rtb_BusAssignment_h_logic_on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       default:
        if (rtb_BusAssignment_h_logic_on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else if (rtb_V_alpha_target > 100.0) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;
      }
    }

    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1, &rtb_Memory);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel9_bit, &rtb_y_c);
    rtb_OR_k = ((rtb_y_c != 0U) && rtb_Memory);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1, &rtb_Memory);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel8_bit_i, &rtb_y_c);
    rtb_Memory = (rtb_OR_k || ((rtb_y_c != 0U) && rtb_Memory));
    guard1 = false;
    if ((rtb_alpha_floor_inhib == 0) && (rtb_mach < 0.6)) {
      if (rtb_Switch4_f >= 4.0) {
        rtb_Switch4_a = -3;
      } else {
        rtb_Switch4_a = 0;
      }

      if ((rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg > rtb_Switch1_a + std::fmin(std::fmax(rtb_Switch_b,
             static_cast<real_T>(rtb_Switch4_a)), 0.0)) && rtb_Memory) {
        FacComputer_DWork.sAlphaFloor = 1.0;
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }

    if (guard1) {
      if ((rtb_alpha_floor_inhib != 0) || (!rtb_y_b) || (!rtb_Memory)) {
        FacComputer_DWork.sAlphaFloor = 0.0;
      }
    }

    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel_bit_a, &rtb_y_c);
    rtb_y_b = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel1_bit_i, &rtb_y_c);
    rtb_Memory = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel2_bit_di, &rtb_y_c);
    rtb_OR_k = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel3_bit_g, &rtb_y_c);
    rtb_DataTypeConversion_c = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel4_bit_f, &rtb_y_c);
    rtb_DataTypeConversion_hw = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel5_bit_g3, &rtb_y_c);
    FacComputer_MATLABFunction_d(rtb_y_b, rtb_Memory, rtb_OR_k, rtb_DataTypeConversion_c, rtb_DataTypeConversion_hw,
      rtb_y_c != 0U, &rtb_Switch4_f);
    FacComputer_RateLimiter(look1_binlxpw(rtb_Switch4_f, FacComputer_P.alpha0_bp01Data, FacComputer_P.alpha0_tableData,
      5U), FacComputer_P.RateLimiterGenericVariableTs1_up_g, FacComputer_P.RateLimiterGenericVariableTs1_lo_n,
      FacComputer_U.in.time.dt, FacComputer_P.reset_Value_k, &rtb_Switch1_a, &FacComputer_DWork.sf_RateLimiter_c);
    FacComputer_RateLimiter(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_Switch4_f, FacComputer_P.alphamax_bp01Data,
      FacComputer_P.alphamax_bp02Data, FacComputer_P.alphamax_tableData, FacComputer_P.alphamax_maxIndex, 4U),
      FacComputer_P.RateLimiterGenericVariableTs4_up, FacComputer_P.RateLimiterGenericVariableTs4_lo,
      FacComputer_U.in.time.dt, FacComputer_P.reset_Value_o, &rtb_Switch_b, &FacComputer_DWork.sf_RateLimiter_a);
    FacComputer_CalculateV_alpha_max(static_cast<real_T>(rtb_V_ias),
      rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg, rtb_Switch1_a, rtb_Switch_b, &rtb_V_alpha_target);
    FacComputer_RateLimiter(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_Switch4_f,
      FacComputer_P.alphaprotection_bp01Data, FacComputer_P.alphaprotection_bp02Data,
      FacComputer_P.alphaprotection_tableData, FacComputer_P.alphaprotection_maxIndex, 4U),
      FacComputer_P.RateLimiterGenericVariableTs3_up, FacComputer_P.RateLimiterGenericVariableTs3_lo,
      FacComputer_U.in.time.dt, FacComputer_P.reset_Value_a, &rtb_Switch_b, &FacComputer_DWork.sf_RateLimiter_n);
    FacComputer_CalculateV_alpha_max(static_cast<real_T>(rtb_V_ias),
      rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg, rtb_Switch1_a, rtb_Switch_b, &rtb_V_alpha_target_l);
    FacComputer_RateLimiter(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_Switch4_f,
      FacComputer_P.alphastallwarn_bp01Data, FacComputer_P.alphastallwarn_bp02Data,
      FacComputer_P.alphastallwarn_tableData, FacComputer_P.alphastallwarn_maxIndex, 4U),
      FacComputer_P.RateLimiterGenericVariableTs2_up, FacComputer_P.RateLimiterGenericVariableTs2_lo,
      FacComputer_U.in.time.dt, FacComputer_P.reset_Value_i, &rtb_Switch_b, &FacComputer_DWork.sf_RateLimiter_j);
    FacComputer_CalculateV_alpha_max(static_cast<real_T>(rtb_V_ias),
      rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg, rtb_Switch1_a, rtb_Switch_b, &rtb_Switch4_f);
    rtb_y_b = (FacComputer_U.in.discrete_inputs.ap_own_engaged || FacComputer_U.in.discrete_inputs.ap_opp_engaged);
    rtb_Memory = (FacComputer_U.in.discrete_inputs.rudder_trim_reset_button && (!rtb_y_b));
    if (!FacComputer_DWork.previousInput_not_empty) {
      FacComputer_DWork.previousInput = FacComputer_P.PulseNode_isRisingEdge;
      FacComputer_DWork.previousInput_not_empty = true;
    }

    if (FacComputer_P.PulseNode_isRisingEdge) {
      rtb_OR_k = (rtb_Memory && (!FacComputer_DWork.previousInput));
    } else {
      rtb_OR_k = ((!rtb_Memory) && FacComputer_DWork.previousInput);
    }

    FacComputer_DWork.previousInput = rtb_Memory;
    rtb_Switch_b = FacComputer_P.Gain1_Gain * FacComputer_DWork.Delay1_DSTATE;
    if (rtb_Switch_b > FacComputer_P.Saturation_UpperSat_e) {
      rtb_Switch_b = FacComputer_P.Saturation_UpperSat_e;
    } else if (rtb_Switch_b < FacComputer_P.Saturation_LowerSat_i) {
      rtb_Switch_b = FacComputer_P.Saturation_LowerSat_i;
    }

    FacComputer_DWork.Memory_PreviousInput = FacComputer_P.Logic_table
      [(((FacComputer_U.in.discrete_inputs.rudder_trim_switch_left ||
          FacComputer_U.in.discrete_inputs.rudder_trim_switch_right || rtb_y_b || (std::abs(rtb_Switch_b) <=
           FacComputer_P.CompareToConstant_const)) + (static_cast<uint32_T>(rtb_OR_k) << 1)) << 1) +
      FacComputer_DWork.Memory_PreviousInput];
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel_bit_j, &rtb_y_c);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel1_bit_e, &rtb_y_bm);
    if (!FacComputer_DWork.Memory_PreviousInput) {
      if (rtb_rudderTrimEngaged) {
        if (rtb_y_b) {
          if ((rtb_y_c != 0U) && FacComputer_U.in.discrete_inputs.elac_1_healthy) {
            rtb_Switch1_a = FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
          } else if ((rtb_y_bm != 0U) && FacComputer_U.in.discrete_inputs.elac_2_healthy) {
            rtb_Switch1_a = FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
          } else {
            rtb_Switch1_a = FacComputer_P.Constant1_Value;
          }

          rtb_Switch_b = FacComputer_P.Gain2_Gain * rtb_Switch1_a;
        } else if (FacComputer_U.in.discrete_inputs.rudder_trim_switch_left) {
          rtb_Switch_b = 1.0;
        } else if (FacComputer_U.in.discrete_inputs.rudder_trim_switch_right) {
          rtb_Switch_b = -1.0;
        } else {
          rtb_Switch_b = 0.0;
        }
      } else {
        rtb_Switch_b = (FacComputer_U.in.analog_inputs.rudder_trim_position_deg - FacComputer_DWork.Delay2_DSTATE) *
          FacComputer_P.Gain_Gain;
      }
    }

    FacComputer_DWork.Delay_DSTATE_d += FacComputer_P.DiscreteTimeIntegratorVariableTs_Gain * rtb_Switch_b *
      FacComputer_U.in.time.dt;
    if (FacComputer_DWork.Delay_DSTATE_d > FacComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
      FacComputer_DWork.Delay_DSTATE_d = FacComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
    } else if (FacComputer_DWork.Delay_DSTATE_d < FacComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
      FacComputer_DWork.Delay_DSTATE_d = FacComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
    }

    rtb_Switch1_a = std::abs(FacComputer_P.Constant_Value_b);
    FacComputer_DWork.Delay_DSTATE_m += std::fmax(std::fmin(FacComputer_DWork.Delay_DSTATE_d -
      FacComputer_DWork.Delay_DSTATE_m, rtb_Switch1_a * FacComputer_U.in.time.dt), FacComputer_P.Gain_Gain_b *
      rtb_Switch1_a * FacComputer_U.in.time.dt);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel_bit_c, &rtb_y_c);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel1_bit_n, &rtb_y_bm);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel3_bit_k, &rtb_y_la);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel4_bit_k, &rtb_y_pj);
    if ((!FacComputer_DWork.pY_not_empty) || (!FacComputer_DWork.pU_not_empty)) {
      FacComputer_DWork.pU = rtb_r;
      FacComputer_DWork.pU_not_empty = true;
      FacComputer_DWork.pY = rtb_r;
      FacComputer_DWork.pY_not_empty = true;
    }

    rtb_Switch1_a = FacComputer_U.in.time.dt * FacComputer_P.WashoutFilter_C1;
    rtb_Switch_b = 2.0 / (rtb_Switch1_a + 2.0);
    FacComputer_DWork.pY = (2.0 - rtb_Switch1_a) / (rtb_Switch1_a + 2.0) * FacComputer_DWork.pY + (rtb_r * rtb_Switch_b
      - FacComputer_DWork.pU * rtb_Switch_b);
    FacComputer_DWork.pU = rtb_r;
    if (rtb_yawDamperEngaged) {
      rtb_y_b = ((rtb_y_c != 0U) && FacComputer_U.in.discrete_inputs.elac_1_healthy && (rtb_y_bm != 0U));
      if (rtb_y_b || ((rtb_y_la != 0U) && FacComputer_U.in.discrete_inputs.elac_2_healthy && (rtb_y_pj != 0U))) {
        if (rtb_y_b) {
          rtb_Switch_b = FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
        } else {
          rtb_Switch_b = FacComputer_U.in.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data;
        }
      } else {
        rtb_Switch_b = FacComputer_P.Gain_Gain_p * FacComputer_DWork.pY;
        if (rtb_Switch_b > FacComputer_P.Saturation1_UpperSat) {
          rtb_Switch_b = FacComputer_P.Saturation1_UpperSat;
        } else if (rtb_Switch_b < FacComputer_P.Saturation1_LowerSat) {
          rtb_Switch_b = FacComputer_P.Saturation1_LowerSat;
        }
      }
    } else {
      rtb_Switch_b = FacComputer_U.in.analog_inputs.yaw_damper_position_deg;
    }

    rtb_Switch1_a = std::abs(FacComputer_P.Constant_Value_k);
    if (rtb_Switch_b > FacComputer_P.Saturation_UpperSat_ew) {
      rtb_Switch_b = FacComputer_P.Saturation_UpperSat_ew;
    } else if (rtb_Switch_b < FacComputer_P.Saturation_LowerSat_o) {
      rtb_Switch_b = FacComputer_P.Saturation_LowerSat_o;
    }

    FacComputer_DWork.Delay_DSTATE_k += std::fmax(std::fmin(rtb_Switch_b - FacComputer_DWork.Delay_DSTATE_k,
      rtb_Switch1_a * FacComputer_U.in.time.dt), FacComputer_P.Gain_Gain_m * rtb_Switch1_a * FacComputer_U.in.time.dt);
    if (rtb_rudderTravelLimEngaged) {
      rtb_Switch1_a = look1_binlxpw(static_cast<real_T>(rtb_V_ias), FacComputer_P.uDLookupTable_bp01Data,
        FacComputer_P.uDLookupTable_tableData, 6U);
      if (rtb_Switch1_a > FacComputer_P.Saturation_UpperSat) {
        rtb_Switch1_a = FacComputer_P.Saturation_UpperSat;
      } else if (rtb_Switch1_a < FacComputer_P.Saturation_LowerSat) {
        rtb_Switch1_a = FacComputer_P.Saturation_LowerSat;
      }
    } else {
      rtb_Switch1_a = FacComputer_U.in.analog_inputs.rudder_travel_lim_position_deg;
    }

    if (!FacComputer_DWork.pY_not_empty_l) {
      FacComputer_DWork.pY_n = FacComputer_P.RateLimiterVariableTs_InitialCondition;
      FacComputer_DWork.pY_not_empty_l = true;
    }

    FacComputer_DWork.pY_n += std::fmax(std::fmin(rtb_Switch1_a - FacComputer_DWork.pY_n, std::abs
      (FacComputer_P.RateLimiterVariableTs_up) * FacComputer_U.in.time.dt), -std::abs
      (FacComputer_P.RateLimiterVariableTs_lo) * FacComputer_U.in.time.dt);
    rtb_VectorConcatenate[0] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[1] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[5] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[9] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[10] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[11] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[12] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[13] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[14] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[15] = FacComputer_U.in.discrete_inputs.nose_gear_pressed;
    rtb_VectorConcatenate[16] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[17] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[18] = FacComputer_P.Constant20_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &rtb_y_dr);
    rtb_alpha_floor_inhib = static_cast<int32_T>(FacComputer_P.EnumeratedConstant2_Value);
    rtb_VectorConcatenate[0] = rtb_yawDamperEngaged;
    rtb_VectorConcatenate[1] = FacComputer_U.in.discrete_inputs.yaw_damper_opp_engaged;
    rtb_VectorConcatenate[2] = rtb_rudderTrimEngaged;
    rtb_VectorConcatenate[3] = FacComputer_U.in.discrete_inputs.rudder_trim_opp_engaged;
    rtb_VectorConcatenate[4] = rtb_rudderTravelLimEngaged;
    rtb_VectorConcatenate[5] = FacComputer_U.in.discrete_inputs.rudder_travel_lim_opp_engaged;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[9] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[10] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[11] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[12] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[13] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[14] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[15] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[16] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[17] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[18] = FacComputer_P.Constant10_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &rtb_y_e);
    if (FacComputer_P.Constant_Value_b5) {
      rtb_Switch4_a = static_cast<int32_T>(FacComputer_P.EnumeratedConstant2_Value);
      rtb_Switch2 = static_cast<int32_T>(FacComputer_P.EnumeratedConstant2_Value);
    } else if (rtb_BusAssignment_h_logic_speed_scale_visible) {
      rtb_Switch4_a = static_cast<int32_T>(FacComputer_P.EnumeratedConstant1_Value);
      rtb_Switch2 = static_cast<int32_T>(FacComputer_P.EnumeratedConstant1_Value);
      rtb_alpha_floor_inhib = static_cast<int32_T>(FacComputer_P.EnumeratedConstant1_Value);
    } else {
      rtb_Switch4_a = static_cast<int32_T>(FacComputer_P.EnumeratedConstant_Value);
      rtb_Switch2 = static_cast<int32_T>(FacComputer_P.EnumeratedConstant_Value);
      rtb_alpha_floor_inhib = static_cast<int32_T>(FacComputer_P.EnumeratedConstant_Value);
    }

    rtb_VectorConcatenate[0] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[1] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[5] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[9] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[10] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[11] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[12] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[13] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[14] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[15] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[16] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[17] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[18] = FacComputer_P.Constant18_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &rtb_y_i3);
    rtb_VectorConcatenate[0] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[1] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[5] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[9] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[10] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[11] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[12] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[13] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[14] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[15] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[16] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[17] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[18] = FacComputer_P.Constant9_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &rtb_y_iu);
    rtb_VectorConcatenate[0] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[1] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = rtb_BusAssignment_c_logic_lgciu_own_valid;
    rtb_VectorConcatenate[6] = rtb_AND1;
    rtb_VectorConcatenate[7] = rtb_y_j;
    rtb_VectorConcatenate[8] = rtb_Switch_i_idx_1;
    rtb_VectorConcatenate[9] = rtb_Switch_i_idx_2;
    rtb_VectorConcatenate[10] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[11] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[16] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[17] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[18] = (FacComputer_DWork.sAlphaFloor != 0.0);
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &rtb_y_bp);
    FacComputer_Y.out.data = FacComputer_U.in;
    FacComputer_Y.out.laws.yaw_damper_command_deg = FacComputer_DWork.Delay_DSTATE_k;
    FacComputer_Y.out.laws.rudder_trim_command_deg = FacComputer_DWork.Delay_DSTATE_m;
    FacComputer_Y.out.laws.rudder_travel_lim_command_deg = FacComputer_DWork.pY_n;
    FacComputer_Y.out.logic.lgciu_own_valid = rtb_BusAssignment_c_logic_lgciu_own_valid;
    FacComputer_Y.out.logic.all_lgciu_lost = rtb_AND1;
    FacComputer_Y.out.logic.left_main_gear_pressed = rtb_y_j;
    FacComputer_Y.out.logic.right_main_gear_pressed = rtb_Switch_i_idx_1;
    FacComputer_Y.out.logic.main_gear_out = rtb_Switch_i_idx_2;
    FacComputer_Y.out.logic.on_ground = rtb_BusAssignment_h_logic_on_ground;
    FacComputer_Y.out.logic.tracking_mode_on = (FacComputer_U.in.sim_data.slew_on || FacComputer_U.in.sim_data.pause_on ||
      FacComputer_U.in.sim_data.tracking_mode_on_override);
    FacComputer_Y.out.logic.double_self_detected_adr_failure = ((rtb_adrOwnInvalid && rtb_adrOppInvalid) ||
      (rtb_adrOwnInvalid && rtb_adr3Invalid) || (rtb_adrOppInvalid && rtb_adr3Invalid));
    FacComputer_Y.out.logic.double_self_detected_ir_failure = ((rtb_irOwnInvalid && rtb_irOppInvalid) ||
      (rtb_irOwnInvalid && rtb_ir3Invalid) || (rtb_irOppInvalid && rtb_ir3Invalid));
    FacComputer_Y.out.logic.double_not_self_detected_adr_failure = FacComputer_P.Constant_Value_h;
    FacComputer_Y.out.logic.double_not_self_detected_ir_failure = FacComputer_P.Constant_Value_h;
    FacComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    FacComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    FacComputer_Y.out.logic.adr_computation_data.mach = rtb_mach;
    FacComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_alpha;
    FacComputer_Y.out.logic.ir_computation_data.theta_deg = rtb_theta;
    FacComputer_Y.out.logic.ir_computation_data.phi_deg = rtb_phi;
    FacComputer_Y.out.logic.ir_computation_data.q_deg_s = rtb_q;
    FacComputer_Y.out.logic.ir_computation_data.r_deg_s = rtb_r;
    FacComputer_Y.out.logic.ir_computation_data.n_x_g = rtb_n_x;
    FacComputer_Y.out.logic.ir_computation_data.n_y_g = rtb_n_y;
    FacComputer_Y.out.logic.ir_computation_data.n_z_g = rtb_n_z;
    FacComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    FacComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    FacComputer_Y.out.logic.yaw_damper_engaged = rtb_yawDamperEngaged;
    FacComputer_Y.out.logic.yaw_damper_can_engage = yawDamperCanEngage;
    FacComputer_Y.out.logic.yaw_damper_has_priority = yawDamperHasPriority;
    FacComputer_Y.out.logic.rudder_trim_engaged = rtb_rudderTrimEngaged;
    FacComputer_Y.out.logic.rudder_trim_can_engage = rudderTrimCanEngage;
    FacComputer_Y.out.logic.rudder_trim_has_priority = rudderTrimHasPriority;
    FacComputer_Y.out.logic.rudder_travel_lim_engaged = rtb_rudderTravelLimEngaged;
    FacComputer_Y.out.logic.rudder_travel_lim_can_engage = rudderTravelLimCanEngage;
    FacComputer_Y.out.logic.rudder_travel_lim_has_priority = yawDamperHasPriority_tmp;
    FacComputer_Y.out.logic.speed_scale_lost = FacComputer_P.Constant_Value_b5;
    FacComputer_Y.out.logic.speed_scale_visible = rtb_BusAssignment_h_logic_speed_scale_visible;
    FacComputer_Y.out.flight_envelope.estimated_beta_deg = rtb_OR_d;
    FacComputer_Y.out.flight_envelope.beta_target_deg = rtb_beDot;
    FacComputer_Y.out.flight_envelope.beta_target_visible = false;
    FacComputer_Y.out.flight_envelope.alpha_floor_condition = (FacComputer_DWork.sAlphaFloor != 0.0);
    FacComputer_Y.out.flight_envelope.alpha_filtered_deg = rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg;
    FacComputer_Y.out.flight_envelope.computed_weight_lbs = 0.0;
    FacComputer_Y.out.flight_envelope.computed_cg_percent = 0.0;
    FacComputer_Y.out.flight_envelope.v_alpha_max_kn = rtb_V_alpha_target;
    FacComputer_Y.out.flight_envelope.v_alpha_prot_kn = rtb_V_alpha_target_l;
    FacComputer_Y.out.flight_envelope.v_stall_warn_kn = rtb_Switch4_f;
    FacComputer_Y.out.flight_envelope.v_ls_kn = 0.0;
    FacComputer_Y.out.flight_envelope.v_stall_kn = 0.0;
    FacComputer_Y.out.flight_envelope.v_3_kn = 0.0;
    FacComputer_Y.out.flight_envelope.v_4_kn = 0.0;
    FacComputer_Y.out.flight_envelope.v_man_kn = 0.0;
    FacComputer_Y.out.flight_envelope.v_max_kn = 0.0;
    FacComputer_Y.out.flight_envelope.v_c_trend_kn = 0.0;
    FacComputer_Y.out.discrete_outputs.fac_healthy = FacComputer_P.Constant2_Value_o;
    FacComputer_Y.out.discrete_outputs.yaw_damper_engaged = rtb_yawDamperEngaged;
    FacComputer_Y.out.discrete_outputs.rudder_trim_engaged = rtb_rudderTrimEngaged;
    FacComputer_Y.out.discrete_outputs.rudder_travel_lim_engaged = rtb_rudderTravelLimEngaged;
    FacComputer_Y.out.discrete_outputs.rudder_travel_lim_emergency_reset = FacComputer_P.Constant1_Value_d;
    FacComputer_Y.out.discrete_outputs.yaw_damper_avail_for_norm_law = yawDamperCanEngage;
    if (rtb_yawDamperEngaged) {
      FacComputer_Y.out.analog_outputs.yaw_damper_order_deg = FacComputer_DWork.Delay_DSTATE_k;
    } else {
      FacComputer_Y.out.analog_outputs.yaw_damper_order_deg = FacComputer_P.Constant_Value_bu;
    }

    if (rtb_rudderTrimEngaged) {
      FacComputer_Y.out.analog_outputs.rudder_trim_order_deg = FacComputer_DWork.Delay_DSTATE_m;
    } else {
      FacComputer_Y.out.analog_outputs.rudder_trim_order_deg = FacComputer_P.Constant_Value_bu;
    }

    if (rtb_rudderTravelLimEngaged) {
      FacComputer_Y.out.analog_outputs.rudder_travel_limit_order_deg = FacComputer_DWork.pY_n;
    } else {
      FacComputer_Y.out.analog_outputs.rudder_travel_limit_order_deg = FacComputer_P.Constant_Value_bu;
    }

    FacComputer_Y.out.bus_outputs.discrete_word_1.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.discrete_word_1.Data = rtb_y_dr;
    FacComputer_Y.out.bus_outputs.gamma_a_deg.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.gamma_a_deg.Data = FacComputer_P.Constant28_Value;
    FacComputer_Y.out.bus_outputs.gamma_t_deg.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.gamma_t_deg.Data = FacComputer_P.Constant22_Value;
    FacComputer_Y.out.bus_outputs.total_weight_lbs.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.total_weight_lbs.Data = FacComputer_P.Constant21_Value;
    FacComputer_Y.out.bus_outputs.center_of_gravity_pos_percent.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.center_of_gravity_pos_percent.Data = FacComputer_P.Constant4_Value_b;
    if (FacComputer_P.Switch7_Threshold < 0.0) {
      FacComputer_Y.out.bus_outputs.sideslip_target_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant2_Value);
    } else {
      FacComputer_Y.out.bus_outputs.sideslip_target_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant_Value);
    }

    FacComputer_Y.out.bus_outputs.sideslip_target_deg.Data = static_cast<real32_T>(rtb_beDot);
    FacComputer_Y.out.bus_outputs.fac_slat_angle_deg.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.fac_slat_angle_deg.Data = FacComputer_P.Constant2_Value;
    FacComputer_Y.out.bus_outputs.fac_flap_angle.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.fac_flap_angle.Data = FacComputer_P.Constant1_Value_k;
    FacComputer_Y.out.bus_outputs.discrete_word_2.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.discrete_word_2.Data = rtb_y_e;
    FacComputer_Y.out.bus_outputs.rudder_travel_limit_command_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.rudder_travel_limit_command_deg.Data = static_cast<real32_T>
      (FacComputer_U.in.analog_inputs.rudder_travel_lim_position_deg);
    FacComputer_Y.out.bus_outputs.delta_r_yaw_damper_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.delta_r_yaw_damper_deg.Data = FacComputer_P.Constant26_Value;
    if (FacComputer_P.Switch6_Threshold < 0.0) {
      FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant2_Value);
    } else {
      FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant1_Value);
    }

    FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.Data = static_cast<real32_T>(rtb_OR_d);
    FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.SSM = static_cast<uint32_T>(rtb_Switch4_a);
    FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.Data = static_cast<real32_T>(rtb_V_alpha_target);
    FacComputer_Y.out.bus_outputs.v_ls_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_ls_kn.Data = FacComputer_P.Constant15_Value;
    FacComputer_Y.out.bus_outputs.v_stall_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_stall_kn.Data = FacComputer_P.Constant14_Value;
    FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.SSM = static_cast<uint32_T>(rtb_Switch2);
    FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.Data = static_cast<real32_T>(rtb_V_alpha_target_l);
    FacComputer_Y.out.bus_outputs.v_stall_warn_kn.SSM = static_cast<uint32_T>(rtb_alpha_floor_inhib);
    FacComputer_Y.out.bus_outputs.v_stall_warn_kn.Data = static_cast<real32_T>(rtb_Switch4_f);
    FacComputer_Y.out.bus_outputs.speed_trend_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.speed_trend_kn.Data = FacComputer_P.Constant11_Value;
    FacComputer_Y.out.bus_outputs.v_3_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_3_kn.Data = FacComputer_P.Constant8_Value;
    FacComputer_Y.out.bus_outputs.v_4_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_4_kn.Data = FacComputer_P.Constant7_Value;
    FacComputer_Y.out.bus_outputs.v_man_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_man_kn.Data = FacComputer_P.Constant6_Value;
    FacComputer_Y.out.bus_outputs.v_max_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_max_kn.Data = FacComputer_P.Constant5_Value;
    FacComputer_Y.out.bus_outputs.v_fe_next_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_fe_next_kn.Data = FacComputer_P.Constant17_Value;
    FacComputer_Y.out.bus_outputs.discrete_word_3.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.discrete_word_3.Data = rtb_y_i3;
    FacComputer_Y.out.bus_outputs.discrete_word_4.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.discrete_word_4.Data = rtb_y_iu;
    FacComputer_Y.out.bus_outputs.discrete_word_5.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.discrete_word_5.Data = rtb_y_bp;
    FacComputer_Y.out.bus_outputs.delta_r_rudder_trim_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.delta_r_rudder_trim_deg.Data = static_cast<real32_T>(FacComputer_DWork.Delay_DSTATE_m);
    FacComputer_Y.out.bus_outputs.rudder_trim_pos_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.rudder_trim_pos_deg.Data = static_cast<real32_T>
      (FacComputer_U.in.analog_inputs.rudder_trim_position_deg);
    FacComputer_DWork.Delay_DSTATE = rtb_Gain_f;
    FacComputer_DWork.Delay1_DSTATE = FacComputer_DWork.Delay_DSTATE_d;
    FacComputer_DWork.Delay2_DSTATE = FacComputer_DWork.Delay_DSTATE_m;
  } else {
    FacComputer_DWork.Runtime_MODE = false;
  }
}

void FacComputer::initialize()
{
  FacComputer_DWork.Delay_DSTATE = FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
  FacComputer_DWork.Delay1_DSTATE = FacComputer_P.Delay1_InitialCondition;
  FacComputer_DWork.Memory_PreviousInput = FacComputer_P.SRFlipFlop_initial_condition;
  FacComputer_DWork.Delay2_DSTATE = FacComputer_P.Delay2_InitialCondition;
  FacComputer_DWork.Delay_DSTATE_d = FacComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  FacComputer_DWork.Delay_DSTATE_m = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition;
  FacComputer_DWork.Delay_DSTATE_k = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition_a;
  FacComputer_Y.out = FacComputer_P.out_Y0;
}

void FacComputer::terminate()
{
}

FacComputer::FacComputer():
  FacComputer_U(),
  FacComputer_Y(),
  FacComputer_DWork()
{
}

FacComputer::~FacComputer()
{
}
