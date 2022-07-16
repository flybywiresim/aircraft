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

void FacComputer::FacComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
  real_T *rty_Y, rtDW_RateLimiter_FacComputer_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
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
  real_T rtb_V_alpha_target_l;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  uint32_T rtb_y;
  uint32_T rtb_y_c;
  uint32_T rtb_y_f;
  uint32_T rtb_y_l2;
  uint32_T rtb_y_l3;
  uint32_T rtb_y_lp;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_AND;
  boolean_T rtb_AND1;
  boolean_T rtb_DataTypeConversion_dl;
  boolean_T rtb_y_d2;
  if (FacComputer_U.in.sim_data.computer_running) {
    real_T Vtas;
    real_T rtb_Sum_l;
    real_T rtb_Switch;
    int32_T rtb_alpha_floor_inhib;
    real32_T rtb_alpha;
    real32_T rtb_mach_a;
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

    boolean_T rtb_ir3Invalid;
    boolean_T rtb_irOppInvalid;
    boolean_T rtb_irOwnInvalid;
    if (!FacComputer_DWork.Runtime_MODE) {
      FacComputer_DWork.Delay1_DSTATE = FacComputer_P.Delay1_InitialCondition;
      FacComputer_DWork.Memory_PreviousInput = FacComputer_P.SRFlipFlop_initial_condition;
      FacComputer_DWork.Delay_DSTATE = FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
      FacComputer_DWork.Delay2_DSTATE = FacComputer_P.Delay2_InitialCondition;
      FacComputer_DWork.Delay_DSTATE_d = FacComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
      FacComputer_DWork.Delay_DSTATE_m = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition;
      FacComputer_DWork.Delay_DSTATE_k = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition_a;
      FacComputer_DWork.output_not_empty = false;
      FacComputer_DWork.previousInput_not_empty = false;
      FacComputer_DWork.output = false;
      FacComputer_DWork.timeSinceCondition = 0.0;
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
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_l);
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_o);
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_d);
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_do);
      FacComputer_DWork.pY_not_empty = false;
      FacComputer_DWork.pU_not_empty = false;
      FacComputer_RateLimiter_Reset(&FacComputer_DWork.sf_RateLimiter_e);
      FacComputer_DWork.Runtime_MODE = true;
    }

    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel1_bit, &rtb_y_c);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5, &rtb_y_d2);
    rtb_AND1 = ((rtb_y_c != 0U) && rtb_y_d2);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel4_bit, &rtb_y_l2);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel3_bit, &rtb_y_lp);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      FacComputer_P.BitfromLabel2_bit, &rtb_y_c);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_1, &rtb_DataTypeConversion_dl);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      FacComputer_P.BitfromLabel_bit, &rtb_y_l3);
    rtb_DataTypeConversion_dl = (rtb_DataTypeConversion_dl && ((rtb_y_l3 != 0U) ==
      FacComputer_U.in.discrete_inputs.nose_gear_pressed));
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      FacComputer_P.BitfromLabel5_bit, &rtb_y_l3);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      FacComputer_P.BitfromLabel6_bit, &rtb_y_f);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      FacComputer_P.BitfromLabel7_bit, &rtb_y);
    if (rtb_DataTypeConversion_dl) {
      FacComputer_B.logic.left_main_gear_pressed = (rtb_y_l3 != 0U);
      FacComputer_B.logic.right_main_gear_pressed = (rtb_y_f != 0U);
      FacComputer_B.logic.main_gear_out = (rtb_y != 0U);
    } else if (rtb_AND1) {
      FacComputer_B.logic.left_main_gear_pressed = (rtb_y_l2 != 0U);
      FacComputer_B.logic.right_main_gear_pressed = (rtb_y_lp != 0U);
      FacComputer_B.logic.main_gear_out = (rtb_y_c != 0U);
    } else {
      FacComputer_B.logic.left_main_gear_pressed = FacComputer_P.Constant_Value_c;
      FacComputer_B.logic.right_main_gear_pressed = FacComputer_P.Constant_Value_c;
      FacComputer_B.logic.main_gear_out = FacComputer_P.Constant_Value_c;
    }

    rtb_y_d2 = (FacComputer_U.in.discrete_inputs.ap_own_engaged || FacComputer_U.in.discrete_inputs.ap_opp_engaged);
    rtb_AND = (FacComputer_U.in.discrete_inputs.rudder_trim_reset_button && (!rtb_y_d2));
    if (!FacComputer_DWork.output_not_empty) {
      FacComputer_DWork.output_b = rtb_AND;
      FacComputer_DWork.output_not_empty = true;
    }

    if (!FacComputer_DWork.previousInput_not_empty) {
      FacComputer_DWork.previousInput = FacComputer_P.PulseNode_isRisingEdge;
      FacComputer_DWork.previousInput_not_empty = true;
    }

    if (FacComputer_P.PulseNode_isRisingEdge) {
      rtb_irOwnInvalid = (rtb_AND && (!FacComputer_DWork.previousInput));
    } else {
      rtb_irOwnInvalid = ((!rtb_AND) && FacComputer_DWork.previousInput);
    }

    FacComputer_DWork.output_b = ((!FacComputer_DWork.output_b) && rtb_irOwnInvalid);
    FacComputer_DWork.previousInput = rtb_AND;
    rtb_Sum_l = FacComputer_P.Gain1_Gain * FacComputer_DWork.Delay1_DSTATE;
    if (rtb_Sum_l > FacComputer_P.Saturation_UpperSat_e) {
      rtb_Sum_l = FacComputer_P.Saturation_UpperSat_e;
    } else if (rtb_Sum_l < FacComputer_P.Saturation_LowerSat_i) {
      rtb_Sum_l = FacComputer_P.Saturation_LowerSat_i;
    }

    FacComputer_DWork.Memory_PreviousInput = FacComputer_P.Logic_table
      [(((FacComputer_U.in.discrete_inputs.rudder_trim_switch_left ||
          FacComputer_U.in.discrete_inputs.rudder_trim_switch_right || rtb_y_d2 || (std::abs(rtb_Sum_l) <=
           FacComputer_P.CompareToConstant_const)) + (static_cast<uint32_T>(FacComputer_DWork.output_b) << 1)) << 1) +
      FacComputer_DWork.Memory_PreviousInput];
    FacComputer_B.logic.lgciu_own_valid = rtb_DataTypeConversion_dl;
    FacComputer_B.logic.all_lgciu_lost = ((!rtb_DataTypeConversion_dl) && (!rtb_AND1));
    rtb_AND1 = ((FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || (FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)));
    rtb_DataTypeConversion_dl = ((FacComputer_U.in.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
      (FacComputer_U.in.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)));
    rtb_AND = ((FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
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
    if (!rtb_AND1) {
      rtb_V_ias = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.Data;
      rtb_V_tas = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.Data;
      rtb_mach_a = FacComputer_U.in.bus_inputs.adr_own_bus.mach.Data;
      rtb_alpha = FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.Data;
    } else if (!rtb_AND) {
      rtb_V_ias = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_V_tas = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_mach_a = FacComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_alpha = FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach_a = 0.0F;
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

    FacComputer_B.flight_envelope.v_alpha_max_kn = rtb_n_x;
    rtb_V_alpha_target_l = rtb_n_y;
    rtb_Switch1_a = rtb_theta_dot;
    FacComputer_B.logic.double_self_detected_adr_failure = ((rtb_AND1 && rtb_DataTypeConversion_dl) || (rtb_AND1 &&
      rtb_AND) || (rtb_DataTypeConversion_dl && rtb_AND));
    FacComputer_B.logic.double_self_detected_ir_failure = ((rtb_irOwnInvalid && rtb_irOppInvalid) || (rtb_irOwnInvalid &&
      rtb_ir3Invalid) || (rtb_irOppInvalid && rtb_ir3Invalid));
    FacComputer_B.logic.double_not_self_detected_adr_failure = FacComputer_P.Constant_Value_h;
    FacComputer_B.logic.double_not_self_detected_ir_failure = FacComputer_P.Constant_Value_h;
    FacComputer_B.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    FacComputer_B.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    FacComputer_B.logic.adr_computation_data.mach = rtb_mach_a;
    FacComputer_B.logic.adr_computation_data.alpha_deg = rtb_alpha;
    FacComputer_B.logic.ir_computation_data.theta_deg = rtb_theta;
    FacComputer_B.logic.ir_computation_data.phi_deg = rtb_phi;
    FacComputer_B.logic.ir_computation_data.q_deg_s = rtb_q;
    FacComputer_B.logic.ir_computation_data.r_deg_s = rtb_r;
    FacComputer_B.logic.ir_computation_data.n_x_g = rtb_n_x;
    FacComputer_B.logic.ir_computation_data.n_y_g = rtb_n_y;
    FacComputer_B.logic.ir_computation_data.n_z_g = rtb_n_z;
    FacComputer_B.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    FacComputer_B.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    FacComputer_B.logic.on_ground = (FacComputer_B.logic.left_main_gear_pressed ||
      FacComputer_B.logic.right_main_gear_pressed);
    FacComputer_B.logic.tracking_mode_on = (FacComputer_U.in.sim_data.slew_on || FacComputer_U.in.sim_data.pause_on ||
      FacComputer_U.in.sim_data.tracking_mode_on_override);
    rtb_DataTypeConversion_dl = (FacComputer_U.in.discrete_inputs.yaw_damper_has_hyd_press &&
      FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    rtb_AND1 = !FacComputer_U.in.discrete_inputs.is_unit_1;
    rtb_AND = (FacComputer_U.in.discrete_inputs.is_unit_1 || (rtb_AND1 &&
                (!FacComputer_U.in.discrete_inputs.yaw_damper_opp_engaged)));
    FacComputer_B.logic.yaw_damper_engaged = (rtb_DataTypeConversion_dl && rtb_AND);
    FacComputer_B.logic.yaw_damper_can_engage = rtb_DataTypeConversion_dl;
    FacComputer_B.logic.yaw_damper_has_priority = rtb_AND;
    rtb_DataTypeConversion_dl = (FacComputer_U.in.discrete_inputs.rudder_trim_actuator_healthy &&
      FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    rtb_AND = (FacComputer_U.in.discrete_inputs.is_unit_1 || (rtb_AND1 &&
                (!FacComputer_U.in.discrete_inputs.rudder_trim_opp_engaged)));
    FacComputer_B.logic.rudder_trim_engaged = (rtb_DataTypeConversion_dl && rtb_AND);
    FacComputer_B.logic.rudder_trim_can_engage = rtb_DataTypeConversion_dl;
    FacComputer_B.logic.rudder_trim_has_priority = rtb_AND;
    rtb_DataTypeConversion_dl = (FacComputer_U.in.discrete_inputs.rudder_travel_lim_actuator_healthy &&
      FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    rtb_AND1 = (FacComputer_U.in.discrete_inputs.is_unit_1 || (rtb_AND1 &&
      (!FacComputer_U.in.discrete_inputs.rudder_travel_lim_opp_engaged)));
    FacComputer_B.logic.rudder_travel_lim_engaged = (rtb_DataTypeConversion_dl && rtb_AND1);
    FacComputer_B.logic.rudder_travel_lim_can_engage = rtb_DataTypeConversion_dl;
    FacComputer_B.logic.rudder_travel_lim_has_priority = rtb_AND1;
    rtb_AND1 = !FacComputer_B.logic.on_ground;
    if (rtb_AND1 == FacComputer_P.ConfirmNode_isRisingEdge) {
      FacComputer_DWork.timeSinceCondition += FacComputer_U.in.time.dt;
      if (FacComputer_DWork.timeSinceCondition >= FacComputer_P.ConfirmNode_timeDelay) {
        FacComputer_DWork.output = rtb_AND1;
      }
    } else {
      FacComputer_DWork.timeSinceCondition = 0.0;
      FacComputer_DWork.output = rtb_AND1;
    }

    FacComputer_B.logic.speed_scale_lost = FacComputer_P.Constant_Value_b5;
    FacComputer_B.logic.speed_scale_visible = FacComputer_DWork.output;
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel_bit_j, &rtb_y_l2);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel1_bit_e, &rtb_y_lp);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg,
      &rtb_DataTypeConversion_dl);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg, &rtb_AND1);
    Vtas = std::fmax(FacComputer_B.logic.adr_computation_data.V_tas_kn * 0.5144, 60.0);
    rtb_Switch4_f = FacComputer_B.logic.adr_computation_data.V_ias_kn * 0.5144;
    if (FacComputer_B.logic.adr_computation_data.V_ias_kn >= 60.0) {
      if (rtb_DataTypeConversion_dl) {
        rtb_Switch1_a = FacComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data;
      } else if (rtb_AND1) {
        rtb_Switch1_a = FacComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data;
      } else {
        rtb_Switch1_a = FacComputer_P.Constant_Value_n;
      }

      Vtas = (rtb_Switch4_f * rtb_Switch4_f * 0.6125 * 122.0 / (70000.0 * Vtas) * 3.172 * (FacComputer_P.Gain_Gain_h *
               rtb_Switch1_a) * 3.1415926535897931 / 180.0 + (FacComputer_B.logic.ir_computation_data.phi_deg *
               3.1415926535897931 / 180.0 * (9.81 / Vtas) + -(FacComputer_B.logic.ir_computation_data.r_deg_s *
                3.1415926535897931 / 180.0))) * 180.0 / 3.1415926535897931;
    } else {
      Vtas = 0.0;
    }

    FacComputer_LagFilter(Vtas, FacComputer_P.LagFilter_C1, FacComputer_U.in.time.dt, &rtb_Switch4_f,
                          &FacComputer_DWork.sf_LagFilter_b);
    FacComputer_LagFilter_k(FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data -
      FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data, FacComputer_P.LagFilter1_C1,
      FacComputer_U.in.time.dt, &rtb_V_ias, &FacComputer_DWork.sf_LagFilter_k);
    if (FacComputer_B.logic.adr_computation_data.alpha_deg > FacComputer_P.Saturation_UpperSat_a) {
      Vtas = FacComputer_P.Saturation_UpperSat_a;
    } else if (FacComputer_B.logic.adr_computation_data.alpha_deg < FacComputer_P.Saturation_LowerSat_l) {
      Vtas = FacComputer_P.Saturation_LowerSat_l;
    } else {
      Vtas = FacComputer_B.logic.adr_computation_data.alpha_deg;
    }

    FacComputer_LagFilter(Vtas, FacComputer_P.LagFilter2_C1, FacComputer_U.in.time.dt, &rtb_Switch1_a,
                          &FacComputer_DWork.sf_LagFilter_f);
    FacComputer_LagFilter_k(FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data -
      FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data, FacComputer_P.LagFilter3_C1,
      FacComputer_U.in.time.dt, &rtb_V_tas, &FacComputer_DWork.sf_LagFilter_d);
    if (FacComputer_B.logic.adr_computation_data.V_ias_kn > FacComputer_P.Saturation1_UpperSat_o) {
      rtb_Switch_b = FacComputer_P.Saturation1_UpperSat_o;
    } else if (FacComputer_B.logic.adr_computation_data.V_ias_kn < FacComputer_P.Saturation1_LowerSat_n) {
      rtb_Switch_b = FacComputer_P.Saturation1_LowerSat_n;
    } else {
      rtb_Switch_b = FacComputer_B.logic.adr_computation_data.V_ias_kn;
    }

    FacComputer_B.flight_envelope.beta_target_deg = (rtb_Switch1_a * rtb_V_tas * FacComputer_P.Gain5_Gain +
      FacComputer_P.Gain4_Gain * rtb_V_ias) / rtb_Switch_b / rtb_Switch_b * FacComputer_P.Gain_Gain_k;
    FacComputer_B.flight_envelope.beta_target_visible = false;
    FacComputer_LagFilter(FacComputer_B.logic.adr_computation_data.alpha_deg, FacComputer_P.LagFilter_C1_f,
                          FacComputer_U.in.time.dt, &rtb_Switch1_a, &FacComputer_DWork.sf_LagFilter_c);
    FacComputer_B.flight_envelope.estimated_beta_deg = rtb_Switch4_f;
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2,
      FacComputer_P.BitfromLabel6_bit_m, &rtb_y_c);
    rtb_DataTypeConversion_dl = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2,
      FacComputer_P.BitfromLabel7_bit_i, &rtb_y_c);
    rtb_AND1 = (rtb_DataTypeConversion_dl || (rtb_y_c != 0U));
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel_bit_i, &rtb_y_c);
    rtb_DataTypeConversion_dl = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel1_bit_b, &rtb_y_c);
    rtb_AND = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel2_bit_d, &rtb_y_c);
    rtb_irOwnInvalid = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel3_bit_n, &rtb_y_c);
    rtb_irOppInvalid = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel4_bit_c, &rtb_y_c);
    rtb_ir3Invalid = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel5_bit_g, &rtb_y_c);
    FacComputer_MATLABFunction_d(rtb_DataTypeConversion_dl, rtb_AND, rtb_irOwnInvalid, rtb_irOppInvalid, rtb_ir3Invalid,
      rtb_y_c != 0U, &rtb_V_alpha_target_l);
    FacComputer_RateLimiter(look2_binlxpw(FacComputer_B.logic.adr_computation_data.mach, rtb_V_alpha_target_l,
      FacComputer_P.alphafloor_bp01Data, FacComputer_P.alphafloor_bp02Data, FacComputer_P.alphafloor_tableData,
      FacComputer_P.alphafloor_maxIndex, 4U), FacComputer_P.RateLimiterVariableTs1_up,
      FacComputer_P.RateLimiterVariableTs1_lo, FacComputer_U.in.time.dt,
      FacComputer_P.RateLimiterVariableTs1_InitialCondition, &rtb_Switch4_f, &FacComputer_DWork.sf_RateLimiter);
    Vtas = FacComputer_P.DiscreteDerivativeVariableTs_Gain * FacComputer_B.logic.adr_computation_data.V_ias_kn;
    rtb_Switch_b = Vtas - FacComputer_DWork.Delay_DSTATE;
    FacComputer_LagFilter(rtb_Switch_b / FacComputer_U.in.time.dt, FacComputer_P.LagFilter_C1_k,
                          FacComputer_U.in.time.dt, &rtb_Switch_b, &FacComputer_DWork.sf_LagFilter);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft, &rtb_DataTypeConversion_dl);
    if (rtb_DataTypeConversion_dl) {
      rtb_Switch = FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft.Data;
    } else {
      rtb_Switch = FacComputer_P.Constant_Value;
    }

    if (FacComputer_DWork.is_active_c15_FacComputer == 0U) {
      FacComputer_DWork.is_active_c15_FacComputer = 1U;
      FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
      rtb_alpha_floor_inhib = 1;
    } else {
      switch (FacComputer_DWork.is_c15_FacComputer) {
       case FacComputer_IN_Flying:
        if (rtb_Switch < 100.0) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landing100ft;
          rtb_alpha_floor_inhib = 1;
        } else if (FacComputer_B.logic.on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;

       case FacComputer_IN_Landed:
        if (!FacComputer_B.logic.on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Takeoff100ft;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       case FacComputer_IN_Landing100ft:
        if (rtb_Switch > 100.0) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else if (FacComputer_B.logic.on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       default:
        if (FacComputer_B.logic.on_ground) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else if (rtb_Switch > 100.0) {
          FacComputer_DWork.is_c15_FacComputer = FacComputer_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;
      }
    }

    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      &rtb_DataTypeConversion_dl);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel9_bit, &rtb_y_c);
    rtb_DataTypeConversion_dl = ((rtb_y_c != 0U) && rtb_DataTypeConversion_dl);
    FacComputer_MATLABFunction(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1, &rtb_AND);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel8_bit, &rtb_y_c);
    rtb_DataTypeConversion_dl = (rtb_DataTypeConversion_dl || ((rtb_y_c != 0U) && rtb_AND));
    guard1 = false;
    if ((rtb_alpha_floor_inhib == 0) && (FacComputer_B.logic.adr_computation_data.mach < 0.6)) {
      int32_T rtb_V_alpha_target_h;
      if (rtb_V_alpha_target_l >= 4.0) {
        rtb_V_alpha_target_h = -3;
      } else {
        rtb_V_alpha_target_h = 0;
      }

      if ((rtb_Switch1_a > rtb_Switch4_f + std::fmin(std::fmax(rtb_Switch_b, static_cast<real_T>(rtb_V_alpha_target_h)),
            0.0)) && rtb_DataTypeConversion_dl) {
        FacComputer_DWork.sAlphaFloor = 1.0;
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }

    if (guard1) {
      if ((rtb_alpha_floor_inhib != 0) || (!rtb_AND1) || (!rtb_DataTypeConversion_dl)) {
        FacComputer_DWork.sAlphaFloor = 0.0;
      }
    }

    rtb_Switch = rtb_Switch1_a;
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel_bit_a, &rtb_y_c);
    rtb_AND1 = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel1_bit_i, &rtb_y_c);
    rtb_DataTypeConversion_dl = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel2_bit_di, &rtb_y_c);
    rtb_AND = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel3_bit_g, &rtb_y_c);
    rtb_irOwnInvalid = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel4_bit_f, &rtb_y_c);
    rtb_irOppInvalid = (rtb_y_c != 0U);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      FacComputer_P.BitfromLabel5_bit_g3, &rtb_y_c);
    FacComputer_MATLABFunction_d(rtb_AND1, rtb_DataTypeConversion_dl, rtb_AND, rtb_irOwnInvalid, rtb_irOppInvalid,
      rtb_y_c != 0U, &rtb_Switch4_f);
    FacComputer_RateLimiter(look1_binlxpw(rtb_Switch4_f, FacComputer_P.alpha0_bp01Data, FacComputer_P.alpha0_tableData,
      5U), FacComputer_P.RateLimiterVariableTs3_up, FacComputer_P.RateLimiterVariableTs3_lo, FacComputer_U.in.time.dt,
      FacComputer_P.RateLimiterVariableTs3_InitialCondition, &rtb_Switch_b, &FacComputer_DWork.sf_RateLimiter_l);
    FacComputer_RateLimiter(look2_binlxpw(FacComputer_B.logic.adr_computation_data.mach, rtb_Switch4_f,
      FacComputer_P.alphamax_bp01Data, FacComputer_P.alphamax_bp02Data, FacComputer_P.alphamax_tableData,
      FacComputer_P.alphamax_maxIndex, 4U), FacComputer_P.RateLimiterVariableTs2_up,
      FacComputer_P.RateLimiterVariableTs2_lo, FacComputer_U.in.time.dt,
      FacComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_Switch1_a, &FacComputer_DWork.sf_RateLimiter_o);
    FacComputer_CalculateV_alpha_max(FacComputer_B.logic.adr_computation_data.V_ias_kn, rtb_Switch, rtb_Switch_b,
      rtb_Switch1_a, &FacComputer_B.flight_envelope.v_alpha_max_kn);
    FacComputer_RateLimiter(look2_binlxpw(FacComputer_B.logic.adr_computation_data.mach, rtb_Switch4_f,
      FacComputer_P.alphaprotection_bp01Data, FacComputer_P.alphaprotection_bp02Data,
      FacComputer_P.alphaprotection_tableData, FacComputer_P.alphaprotection_maxIndex, 4U),
      FacComputer_P.RateLimiterVariableTs_up, FacComputer_P.RateLimiterVariableTs_lo, FacComputer_U.in.time.dt,
      FacComputer_P.RateLimiterVariableTs_InitialCondition, &rtb_Switch1_a, &FacComputer_DWork.sf_RateLimiter_d);
    FacComputer_CalculateV_alpha_max(FacComputer_B.logic.adr_computation_data.V_ias_kn, rtb_Switch, rtb_Switch_b,
      rtb_Switch1_a, &rtb_V_alpha_target_l);
    FacComputer_RateLimiter(look2_binlxpw(FacComputer_B.logic.adr_computation_data.mach, rtb_Switch4_f,
      FacComputer_P.alphastallwarn_bp01Data, FacComputer_P.alphastallwarn_bp02Data,
      FacComputer_P.alphastallwarn_tableData, FacComputer_P.alphastallwarn_maxIndex, 4U),
      FacComputer_P.RateLimiterVariableTs1_up_m, FacComputer_P.RateLimiterVariableTs1_lo_l, FacComputer_U.in.time.dt,
      FacComputer_P.RateLimiterVariableTs1_InitialCondition_p, &rtb_Switch1_a, &FacComputer_DWork.sf_RateLimiter_do);
    FacComputer_CalculateV_alpha_max(FacComputer_B.logic.adr_computation_data.V_ias_kn, rtb_Switch, rtb_Switch_b,
      rtb_Switch1_a, &rtb_Switch4_f);
    FacComputer_B.flight_envelope.alpha_floor_condition = (FacComputer_DWork.sAlphaFloor != 0.0);
    FacComputer_B.flight_envelope.alpha_filtered_deg = rtb_Switch;
    FacComputer_B.flight_envelope.computed_weight_lbs = 0.0;
    FacComputer_B.flight_envelope.computed_cg_percent = 0.0;
    FacComputer_B.flight_envelope.v_alpha_prot_kn = rtb_V_alpha_target_l;
    FacComputer_B.flight_envelope.v_stall_warn_kn = rtb_Switch4_f;
    FacComputer_B.flight_envelope.v_ls_kn = 0.0;
    FacComputer_B.flight_envelope.v_stall_kn = 0.0;
    FacComputer_B.flight_envelope.v_3_kn = 0.0;
    FacComputer_B.flight_envelope.v_4_kn = 0.0;
    FacComputer_B.flight_envelope.v_man_kn = 0.0;
    FacComputer_B.flight_envelope.v_max_kn = 0.0;
    FacComputer_B.flight_envelope.v_c_trend_kn = 0.0;
    if (!FacComputer_DWork.Memory_PreviousInput) {
      if (FacComputer_B.logic.rudder_trim_engaged) {
        if (rtb_y_d2) {
          if ((rtb_y_l2 != 0U) && FacComputer_U.in.discrete_inputs.elac_1_healthy) {
            rtb_Sum_l = FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
          } else if ((rtb_y_lp != 0U) && FacComputer_U.in.discrete_inputs.elac_2_healthy) {
            rtb_Sum_l = FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
          } else {
            rtb_Sum_l = FacComputer_P.Constant1_Value;
          }

          rtb_Sum_l *= FacComputer_P.Gain2_Gain;
        } else if (FacComputer_U.in.discrete_inputs.rudder_trim_switch_left) {
          rtb_Sum_l = 1.0;
        } else if (FacComputer_U.in.discrete_inputs.rudder_trim_switch_right) {
          rtb_Sum_l = -1.0;
        } else {
          rtb_Sum_l = 0.0;
        }
      } else {
        rtb_Sum_l = (FacComputer_U.in.analog_inputs.rudder_trim_position_deg - FacComputer_DWork.Delay2_DSTATE) *
          FacComputer_P.Gain_Gain;
      }
    }

    FacComputer_DWork.Delay_DSTATE_d += FacComputer_P.DiscreteTimeIntegratorVariableTs_Gain * rtb_Sum_l *
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
      FacComputer_P.BitfromLabel1_bit_n, &rtb_y_l2);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel3_bit_k, &rtb_y_lp);
    FacComputer_MATLABFunction_f(&FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      FacComputer_P.BitfromLabel4_bit_k, &rtb_y_l3);
    if ((!FacComputer_DWork.pY_not_empty) || (!FacComputer_DWork.pU_not_empty)) {
      FacComputer_DWork.pU = FacComputer_B.logic.ir_computation_data.r_deg_s;
      FacComputer_DWork.pU_not_empty = true;
      FacComputer_DWork.pY = FacComputer_B.logic.ir_computation_data.r_deg_s;
      FacComputer_DWork.pY_not_empty = true;
    }

    rtb_Sum_l = FacComputer_U.in.time.dt * FacComputer_P.WashoutFilter_C1;
    rtb_Switch4_f = 2.0 / (rtb_Sum_l + 2.0);
    FacComputer_DWork.pY = (2.0 - rtb_Sum_l) / (rtb_Sum_l + 2.0) * FacComputer_DWork.pY +
      (FacComputer_B.logic.ir_computation_data.r_deg_s * rtb_Switch4_f - FacComputer_DWork.pU * rtb_Switch4_f);
    FacComputer_DWork.pU = FacComputer_B.logic.ir_computation_data.r_deg_s;
    if (FacComputer_B.logic.yaw_damper_engaged) {
      rtb_y_d2 = ((rtb_y_c != 0U) && FacComputer_U.in.discrete_inputs.elac_1_healthy && (rtb_y_l2 != 0U));
      if (rtb_y_d2 || ((rtb_y_lp != 0U) && FacComputer_U.in.discrete_inputs.elac_2_healthy && (rtb_y_l3 != 0U))) {
        if (rtb_y_d2) {
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

    rtb_Switch_b = std::fmin(rtb_Switch_b - FacComputer_DWork.Delay_DSTATE_k, rtb_Switch1_a * FacComputer_U.in.time.dt);
    FacComputer_DWork.Delay_DSTATE_k += std::fmax(rtb_Switch_b, FacComputer_P.Gain_Gain_m * rtb_Switch1_a *
      FacComputer_U.in.time.dt);
    if (FacComputer_B.logic.rudder_travel_lim_engaged) {
      rtb_Sum_l = look1_binlxpw(FacComputer_B.logic.adr_computation_data.V_ias_kn, FacComputer_P.uDLookupTable_bp01Data,
        FacComputer_P.uDLookupTable_tableData, 6U);
      if (rtb_Sum_l > FacComputer_P.Saturation_UpperSat) {
        rtb_Sum_l = FacComputer_P.Saturation_UpperSat;
      } else if (rtb_Sum_l < FacComputer_P.Saturation_LowerSat) {
        rtb_Sum_l = FacComputer_P.Saturation_LowerSat;
      }
    } else {
      rtb_Sum_l = FacComputer_U.in.analog_inputs.rudder_travel_lim_position_deg;
    }

    FacComputer_RateLimiter(rtb_Sum_l, FacComputer_P.RateLimiterVariableTs_up_k,
      FacComputer_P.RateLimiterVariableTs_lo_b, FacComputer_U.in.time.dt,
      FacComputer_P.RateLimiterVariableTs_InitialCondition_h, &rtb_Switch_b, &FacComputer_DWork.sf_RateLimiter_e);
    FacComputer_B.laws.yaw_damper_command_deg = FacComputer_DWork.Delay_DSTATE_k;
    FacComputer_B.laws.rudder_trim_command_deg = FacComputer_DWork.Delay_DSTATE_m;
    FacComputer_B.laws.rudder_travel_lim_command_deg = rtb_Switch_b;
    if (FacComputer_B.logic.yaw_damper_engaged) {
      FacComputer_Y.out.analog_outputs.yaw_damper_order_deg = FacComputer_B.laws.yaw_damper_command_deg;
    } else {
      FacComputer_Y.out.analog_outputs.yaw_damper_order_deg = FacComputer_P.Constant_Value_bu;
    }

    if (FacComputer_B.logic.rudder_trim_engaged) {
      FacComputer_Y.out.analog_outputs.rudder_trim_order_deg = FacComputer_B.laws.rudder_trim_command_deg;
    } else {
      FacComputer_Y.out.analog_outputs.rudder_trim_order_deg = FacComputer_P.Constant_Value_bu;
    }

    if (FacComputer_B.logic.rudder_travel_lim_engaged) {
      FacComputer_Y.out.analog_outputs.rudder_travel_limit_order_deg = FacComputer_B.laws.rudder_travel_lim_command_deg;
    } else {
      FacComputer_Y.out.analog_outputs.rudder_travel_limit_order_deg = FacComputer_P.Constant_Value_bu;
    }

    rtb_VectorConcatenate[0] = FacComputer_P.Constant20_Value;
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
    rtb_VectorConcatenate[1] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[5] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant20_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant20_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &FacComputer_Y.out.bus_outputs.discrete_word_1.Data);
    rtb_alpha_floor_inhib = static_cast<int32_T>(FacComputer_P.EnumeratedConstant2_Value);
    rtb_VectorConcatenate[0] = FacComputer_B.logic.yaw_damper_engaged;
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
    rtb_VectorConcatenate[1] = FacComputer_U.in.discrete_inputs.yaw_damper_opp_engaged;
    rtb_VectorConcatenate[2] = FacComputer_B.logic.rudder_trim_engaged;
    rtb_VectorConcatenate[3] = FacComputer_U.in.discrete_inputs.rudder_trim_opp_engaged;
    rtb_VectorConcatenate[4] = FacComputer_B.logic.rudder_travel_lim_engaged;
    rtb_VectorConcatenate[5] = FacComputer_U.in.discrete_inputs.rudder_travel_lim_opp_engaged;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant10_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &rtb_V_tas);
    if (FacComputer_P.Switch6_Threshold < 0.0) {
      FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant2_Value);
    } else {
      FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant1_Value);
    }

    if (FacComputer_B.logic.speed_scale_lost) {
      FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant2_Value);
    } else if (FacComputer_B.logic.speed_scale_visible) {
      FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    } else {
      FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant_Value);
    }

    if (!FacComputer_B.logic.speed_scale_lost) {
      if (FacComputer_B.logic.speed_scale_visible) {
        rtb_alpha_floor_inhib = static_cast<int32_T>(FacComputer_P.EnumeratedConstant1_Value);
      } else {
        rtb_alpha_floor_inhib = static_cast<int32_T>(FacComputer_P.EnumeratedConstant_Value);
      }
    }

    rtb_VectorConcatenate[0] = FacComputer_P.Constant18_Value;
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
    rtb_VectorConcatenate[1] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[5] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant18_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &rtb_V_ias);
    rtb_VectorConcatenate[0] = FacComputer_P.Constant9_Value;
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
    rtb_VectorConcatenate[1] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[5] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[6] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[7] = FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[8] = FacComputer_P.Constant9_Value;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &FacComputer_Y.out.bus_outputs.discrete_word_4.Data);
    rtb_VectorConcatenate[0] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[9] = FacComputer_B.logic.main_gear_out;
    rtb_VectorConcatenate[10] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[11] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[16] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[17] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[18] = FacComputer_B.flight_envelope.alpha_floor_condition;
    rtb_VectorConcatenate[1] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[2] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[3] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[4] = FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = FacComputer_B.logic.lgciu_own_valid;
    rtb_VectorConcatenate[6] = FacComputer_B.logic.all_lgciu_lost;
    rtb_VectorConcatenate[7] = FacComputer_B.logic.left_main_gear_pressed;
    rtb_VectorConcatenate[8] = FacComputer_B.logic.right_main_gear_pressed;
    FacComputer_MATLABFunction_g(rtb_VectorConcatenate, &FacComputer_Y.out.bus_outputs.discrete_word_5.Data);
    FacComputer_Y.out.bus_outputs.discrete_word_1.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
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
    } else if (FacComputer_B.flight_envelope.beta_target_visible) {
      FacComputer_Y.out.bus_outputs.sideslip_target_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant1_Value);
    } else {
      FacComputer_Y.out.bus_outputs.sideslip_target_deg.SSM = static_cast<uint32_T>
        (FacComputer_P.EnumeratedConstant_Value);
    }

    FacComputer_Y.out.bus_outputs.sideslip_target_deg.Data = static_cast<real32_T>
      (FacComputer_B.flight_envelope.beta_target_deg);
    FacComputer_Y.out.bus_outputs.fac_slat_angle_deg.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.fac_slat_angle_deg.Data = FacComputer_P.Constant2_Value;
    FacComputer_Y.out.bus_outputs.fac_flap_angle.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.fac_flap_angle.Data = FacComputer_P.Constant1_Value_k;
    FacComputer_Y.out.bus_outputs.discrete_word_2.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.discrete_word_2.Data = rtb_V_tas;
    FacComputer_Y.out.bus_outputs.rudder_travel_limit_command_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.rudder_travel_limit_command_deg.Data = static_cast<real32_T>
      (FacComputer_U.in.analog_inputs.rudder_travel_lim_position_deg);
    FacComputer_Y.out.bus_outputs.delta_r_yaw_damper_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.delta_r_yaw_damper_deg.Data = FacComputer_P.Constant26_Value;
    FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.Data = static_cast<real32_T>
      (FacComputer_B.flight_envelope.estimated_beta_deg);
    if (FacComputer_B.logic.speed_scale_lost) {
      FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant2_Value);
    } else if (FacComputer_B.logic.speed_scale_visible) {
      FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    } else {
      FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant_Value);
    }

    FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.Data = static_cast<real32_T>
      (FacComputer_B.flight_envelope.v_alpha_max_kn);
    FacComputer_Y.out.bus_outputs.v_ls_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_ls_kn.Data = FacComputer_P.Constant15_Value;
    FacComputer_Y.out.bus_outputs.v_stall_kn.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.v_stall_kn.Data = FacComputer_P.Constant14_Value;
    FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.Data = static_cast<real32_T>
      (FacComputer_B.flight_envelope.v_alpha_prot_kn);
    FacComputer_Y.out.bus_outputs.v_stall_warn_kn.SSM = static_cast<uint32_T>(rtb_alpha_floor_inhib);
    FacComputer_Y.out.bus_outputs.v_stall_warn_kn.Data = static_cast<real32_T>
      (FacComputer_B.flight_envelope.v_stall_warn_kn);
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
    FacComputer_Y.out.bus_outputs.discrete_word_3.Data = rtb_V_ias;
    FacComputer_Y.out.bus_outputs.discrete_word_4.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.discrete_word_5.SSM = static_cast<uint32_T>(FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.delta_r_rudder_trim_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.delta_r_rudder_trim_deg.Data = static_cast<real32_T>
      (FacComputer_B.laws.rudder_trim_command_deg);
    FacComputer_Y.out.bus_outputs.rudder_trim_pos_deg.SSM = static_cast<uint32_T>
      (FacComputer_P.EnumeratedConstant1_Value);
    FacComputer_Y.out.bus_outputs.rudder_trim_pos_deg.Data = static_cast<real32_T>
      (FacComputer_U.in.analog_inputs.rudder_trim_position_deg);
    FacComputer_Y.out.discrete_outputs.fac_healthy = FacComputer_P.Constant2_Value_o;
    FacComputer_Y.out.discrete_outputs.yaw_damper_engaged = FacComputer_B.logic.yaw_damper_engaged;
    FacComputer_Y.out.discrete_outputs.rudder_trim_engaged = FacComputer_B.logic.rudder_trim_engaged;
    FacComputer_Y.out.discrete_outputs.rudder_travel_lim_engaged = FacComputer_B.logic.rudder_travel_lim_engaged;
    FacComputer_Y.out.discrete_outputs.rudder_travel_lim_emergency_reset = FacComputer_P.Constant1_Value_d;
    FacComputer_Y.out.discrete_outputs.yaw_damper_avail_for_norm_law = FacComputer_B.logic.yaw_damper_can_engage;
    FacComputer_B.dt = FacComputer_U.in.time.dt;
    FacComputer_B.ap_opp_engaged = FacComputer_U.in.discrete_inputs.ap_opp_engaged;
    FacComputer_B.SSM = FacComputer_U.in.bus_inputs.adr_own_bus.vertical_speed_ft_min.SSM;
    FacComputer_B.Data = FacComputer_U.in.bus_inputs.adr_own_bus.vertical_speed_ft_min.Data;
    FacComputer_B.SSM_k = FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM;
    FacComputer_B.Data_f = FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.Data;
    FacComputer_B.SSM_kx = FacComputer_U.in.bus_inputs.adr_opp_bus.altitude_standard_ft.SSM;
    FacComputer_B.Data_fw = FacComputer_U.in.bus_inputs.adr_opp_bus.altitude_standard_ft.Data;
    FacComputer_B.SSM_kxx = FacComputer_U.in.bus_inputs.adr_opp_bus.altitude_corrected_ft.SSM;
    FacComputer_B.Data_fwx = FacComputer_U.in.bus_inputs.adr_opp_bus.altitude_corrected_ft.Data;
    FacComputer_B.SSM_kxxt = FacComputer_U.in.bus_inputs.adr_opp_bus.mach.SSM;
    FacComputer_B.Data_fwxk = FacComputer_U.in.bus_inputs.adr_opp_bus.mach.Data;
    FacComputer_B.yaw_damper_opp_engaged = FacComputer_U.in.discrete_inputs.yaw_damper_opp_engaged;
    FacComputer_B.SSM_kxxta = FacComputer_U.in.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM;
    FacComputer_B.Data_fwxkf = FacComputer_U.in.bus_inputs.adr_opp_bus.airspeed_computed_kn.Data;
    FacComputer_B.SSM_kxxtac = FacComputer_U.in.bus_inputs.adr_opp_bus.airspeed_true_kn.SSM;
    FacComputer_B.Data_fwxkft = FacComputer_U.in.bus_inputs.adr_opp_bus.airspeed_true_kn.Data;
    FacComputer_B.SSM_kxxtac0 = FacComputer_U.in.bus_inputs.adr_opp_bus.vertical_speed_ft_min.SSM;
    FacComputer_B.Data_fwxkftc = FacComputer_U.in.bus_inputs.adr_opp_bus.vertical_speed_ft_min.Data;
    FacComputer_B.SSM_kxxtac0z = FacComputer_U.in.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM;
    FacComputer_B.Data_fwxkftc3 = FacComputer_U.in.bus_inputs.adr_opp_bus.aoa_corrected_deg.Data;
    FacComputer_B.SSM_kxxtac0zt = FacComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
    FacComputer_B.Data_fwxkftc3e = FacComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
    FacComputer_B.rudder_trim_opp_engaged = FacComputer_U.in.discrete_inputs.rudder_trim_opp_engaged;
    FacComputer_B.SSM_kxxtac0ztg = FacComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
    FacComputer_B.Data_fwxkftc3ep = FacComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
    FacComputer_B.SSM_kxxtac0ztgf = FacComputer_U.in.bus_inputs.adr_3_bus.mach.SSM;
    FacComputer_B.Data_fwxkftc3epg = FacComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
    FacComputer_B.SSM_kxxtac0ztgf2 = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
    FacComputer_B.Data_fwxkftc3epgt = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
    FacComputer_B.SSM_kxxtac0ztgf2u = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
    FacComputer_B.Data_fwxkftc3epgtd = FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
    FacComputer_B.SSM_kxxtac0ztgf2ux = FacComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
    FacComputer_B.Data_fwxkftc3epgtdx = FacComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
    FacComputer_B.rudder_travel_lim_opp_engaged = FacComputer_U.in.discrete_inputs.rudder_travel_lim_opp_engaged;
    FacComputer_B.SSM_kxxtac0ztgf2uxn = FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
    FacComputer_B.Data_fwxkftc3epgtdxc = FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
    FacComputer_B.SSM_ky = FacComputer_U.in.bus_inputs.ir_own_bus.discrete_word_1.SSM;
    FacComputer_B.Data_h = FacComputer_U.in.bus_inputs.ir_own_bus.discrete_word_1.Data;
    FacComputer_B.SSM_d = FacComputer_U.in.bus_inputs.ir_own_bus.latitude_deg.SSM;
    FacComputer_B.Data_e = FacComputer_U.in.bus_inputs.ir_own_bus.latitude_deg.Data;
    FacComputer_B.SSM_h = FacComputer_U.in.bus_inputs.ir_own_bus.longitude_deg.SSM;
    FacComputer_B.Data_j = FacComputer_U.in.bus_inputs.ir_own_bus.longitude_deg.Data;
    FacComputer_B.SSM_kb = FacComputer_U.in.bus_inputs.ir_own_bus.ground_speed_kn.SSM;
    FacComputer_B.Data_d = FacComputer_U.in.bus_inputs.ir_own_bus.ground_speed_kn.Data;
    FacComputer_B.elac_1_healthy = FacComputer_U.in.discrete_inputs.elac_1_healthy;
    FacComputer_B.SSM_p = FacComputer_U.in.bus_inputs.ir_own_bus.track_angle_true_deg.SSM;
    FacComputer_B.Data_p = FacComputer_U.in.bus_inputs.ir_own_bus.track_angle_true_deg.Data;
    FacComputer_B.SSM_di = FacComputer_U.in.bus_inputs.ir_own_bus.heading_true_deg.SSM;
    FacComputer_B.Data_i = FacComputer_U.in.bus_inputs.ir_own_bus.heading_true_deg.Data;
    FacComputer_B.SSM_j = FacComputer_U.in.bus_inputs.ir_own_bus.wind_speed_kn.SSM;
    FacComputer_B.Data_g = FacComputer_U.in.bus_inputs.ir_own_bus.wind_speed_kn.Data;
    FacComputer_B.SSM_i = FacComputer_U.in.bus_inputs.ir_own_bus.wind_direction_true_deg.SSM;
    FacComputer_B.Data_a = FacComputer_U.in.bus_inputs.ir_own_bus.wind_direction_true_deg.Data;
    FacComputer_B.SSM_g = FacComputer_U.in.bus_inputs.ir_own_bus.track_angle_magnetic_deg.SSM;
    FacComputer_B.Data_eb = FacComputer_U.in.bus_inputs.ir_own_bus.track_angle_magnetic_deg.Data;
    FacComputer_B.elac_2_healthy = FacComputer_U.in.discrete_inputs.elac_2_healthy;
    FacComputer_B.SSM_db = FacComputer_U.in.bus_inputs.ir_own_bus.heading_magnetic_deg.SSM;
    FacComputer_B.Data_jo = FacComputer_U.in.bus_inputs.ir_own_bus.heading_magnetic_deg.Data;
    FacComputer_B.SSM_n = FacComputer_U.in.bus_inputs.ir_own_bus.drift_angle_deg.SSM;
    FacComputer_B.Data_ex = FacComputer_U.in.bus_inputs.ir_own_bus.drift_angle_deg.Data;
    FacComputer_B.SSM_a = FacComputer_U.in.bus_inputs.ir_own_bus.flight_path_angle_deg.SSM;
    FacComputer_B.Data_fd = FacComputer_U.in.bus_inputs.ir_own_bus.flight_path_angle_deg.Data;
    FacComputer_B.SSM_ir = FacComputer_U.in.bus_inputs.ir_own_bus.flight_path_accel_g.SSM;
    FacComputer_B.Data_ja = FacComputer_U.in.bus_inputs.ir_own_bus.flight_path_accel_g.Data;
    FacComputer_B.SSM_hu = FacComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.SSM;
    FacComputer_B.Data_k = FacComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.Data;
    FacComputer_B.engine_1_stopped = FacComputer_U.in.discrete_inputs.engine_1_stopped;
    FacComputer_B.SSM_e = FacComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.SSM;
    FacComputer_B.Data_joy = FacComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.Data;
    FacComputer_B.SSM_gr = FacComputer_U.in.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.SSM;
    FacComputer_B.Data_h3 = FacComputer_U.in.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.Data;
    FacComputer_B.SSM_ev = FacComputer_U.in.bus_inputs.ir_own_bus.body_roll_rate_deg_s.SSM;
    FacComputer_B.Data_a0 = FacComputer_U.in.bus_inputs.ir_own_bus.body_roll_rate_deg_s.Data;
    FacComputer_B.SSM_l = FacComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM;
    FacComputer_B.Data_b = FacComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.Data;
    FacComputer_B.SSM_ei = FacComputer_U.in.bus_inputs.ir_own_bus.body_long_accel_g.SSM;
    FacComputer_B.Data_eq = FacComputer_U.in.bus_inputs.ir_own_bus.body_long_accel_g.Data;
    FacComputer_B.engine_2_stopped = FacComputer_U.in.discrete_inputs.engine_2_stopped;
    FacComputer_B.SSM_an = FacComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.SSM;
    FacComputer_B.Data_iz = FacComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.Data;
    FacComputer_B.SSM_c = FacComputer_U.in.bus_inputs.ir_own_bus.body_normal_accel_g.SSM;
    FacComputer_B.Data_j2 = FacComputer_U.in.bus_inputs.ir_own_bus.body_normal_accel_g.Data;
    FacComputer_B.SSM_cb = FacComputer_U.in.bus_inputs.ir_own_bus.track_angle_rate_deg_s.SSM;
    FacComputer_B.Data_o = FacComputer_U.in.bus_inputs.ir_own_bus.track_angle_rate_deg_s.Data;
    FacComputer_B.SSM_lb = FacComputer_U.in.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.SSM;
    FacComputer_B.Data_m = FacComputer_U.in.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.Data;
    FacComputer_B.SSM_ia = FacComputer_U.in.bus_inputs.ir_own_bus.roll_att_rate_deg_s.SSM;
    FacComputer_B.Data_oq = FacComputer_U.in.bus_inputs.ir_own_bus.roll_att_rate_deg_s.Data;
    FacComputer_B.rudder_trim_switch_left = FacComputer_U.in.discrete_inputs.rudder_trim_switch_left;
    FacComputer_B.SSM_kyz = FacComputer_U.in.bus_inputs.ir_own_bus.inertial_alt_ft.SSM;
    FacComputer_B.Data_fo = FacComputer_U.in.bus_inputs.ir_own_bus.inertial_alt_ft.Data;
    FacComputer_B.SSM_as = FacComputer_U.in.bus_inputs.ir_own_bus.along_track_horiz_acc_g.SSM;
    FacComputer_B.Data_p1 = FacComputer_U.in.bus_inputs.ir_own_bus.along_track_horiz_acc_g.Data;
    FacComputer_B.SSM_is = FacComputer_U.in.bus_inputs.ir_own_bus.cross_track_horiz_acc_g.SSM;
    FacComputer_B.Data_p1y = FacComputer_U.in.bus_inputs.ir_own_bus.cross_track_horiz_acc_g.Data;
    FacComputer_B.SSM_ca = FacComputer_U.in.bus_inputs.ir_own_bus.vertical_accel_g.SSM;
    FacComputer_B.Data_l = FacComputer_U.in.bus_inputs.ir_own_bus.vertical_accel_g.Data;
    FacComputer_B.SSM_o = FacComputer_U.in.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.SSM;
    FacComputer_B.Data_kp = FacComputer_U.in.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.Data;
    FacComputer_B.rudder_trim_switch_right = FacComputer_U.in.discrete_inputs.rudder_trim_switch_right;
    FacComputer_B.SSM_ak = FacComputer_U.in.bus_inputs.ir_own_bus.north_south_velocity_kn.SSM;
    FacComputer_B.Data_k0 = FacComputer_U.in.bus_inputs.ir_own_bus.north_south_velocity_kn.Data;
    FacComputer_B.SSM_cbj = FacComputer_U.in.bus_inputs.ir_own_bus.east_west_velocity_kn.SSM;
    FacComputer_B.Data_pi = FacComputer_U.in.bus_inputs.ir_own_bus.east_west_velocity_kn.Data;
    FacComputer_B.SSM_cu = FacComputer_U.in.bus_inputs.ir_opp_bus.discrete_word_1.SSM;
    FacComputer_B.Data_dm = FacComputer_U.in.bus_inputs.ir_opp_bus.discrete_word_1.Data;
    FacComputer_B.SSM_nn = FacComputer_U.in.bus_inputs.ir_opp_bus.latitude_deg.SSM;
    FacComputer_B.Data_f5 = FacComputer_U.in.bus_inputs.ir_opp_bus.latitude_deg.Data;
    FacComputer_B.SSM_b = FacComputer_U.in.bus_inputs.ir_opp_bus.longitude_deg.SSM;
    FacComputer_B.Data_js = FacComputer_U.in.bus_inputs.ir_opp_bus.longitude_deg.Data;
    FacComputer_B.simulation_time = FacComputer_U.in.time.simulation_time;
    FacComputer_B.rudder_trim_reset_button = FacComputer_U.in.discrete_inputs.rudder_trim_reset_button;
    FacComputer_B.SSM_m = FacComputer_U.in.bus_inputs.ir_opp_bus.ground_speed_kn.SSM;
    FacComputer_B.Data_ee = FacComputer_U.in.bus_inputs.ir_opp_bus.ground_speed_kn.Data;
    FacComputer_B.SSM_f = FacComputer_U.in.bus_inputs.ir_opp_bus.track_angle_true_deg.SSM;
    FacComputer_B.Data_ig = FacComputer_U.in.bus_inputs.ir_opp_bus.track_angle_true_deg.Data;
    FacComputer_B.SSM_bp = FacComputer_U.in.bus_inputs.ir_opp_bus.heading_true_deg.SSM;
    FacComputer_B.Data_mk = FacComputer_U.in.bus_inputs.ir_opp_bus.heading_true_deg.Data;
    FacComputer_B.SSM_hb = FacComputer_U.in.bus_inputs.ir_opp_bus.wind_speed_kn.SSM;
    FacComputer_B.Data_pu = FacComputer_U.in.bus_inputs.ir_opp_bus.wind_speed_kn.Data;
    FacComputer_B.SSM_gz = FacComputer_U.in.bus_inputs.ir_opp_bus.wind_direction_true_deg.SSM;
    FacComputer_B.Data_ly = FacComputer_U.in.bus_inputs.ir_opp_bus.wind_direction_true_deg.Data;
    FacComputer_B.fac_engaged_from_switch = FacComputer_U.in.discrete_inputs.fac_engaged_from_switch;
    FacComputer_B.SSM_pv = FacComputer_U.in.bus_inputs.ir_opp_bus.track_angle_magnetic_deg.SSM;
    FacComputer_B.Data_jq = FacComputer_U.in.bus_inputs.ir_opp_bus.track_angle_magnetic_deg.Data;
    FacComputer_B.SSM_mf = FacComputer_U.in.bus_inputs.ir_opp_bus.heading_magnetic_deg.SSM;
    FacComputer_B.Data_o5 = FacComputer_U.in.bus_inputs.ir_opp_bus.heading_magnetic_deg.Data;
    FacComputer_B.SSM_m0 = FacComputer_U.in.bus_inputs.ir_opp_bus.drift_angle_deg.SSM;
    FacComputer_B.Data_lyw = FacComputer_U.in.bus_inputs.ir_opp_bus.drift_angle_deg.Data;
    FacComputer_B.SSM_kd = FacComputer_U.in.bus_inputs.ir_opp_bus.flight_path_angle_deg.SSM;
    FacComputer_B.Data_gq = FacComputer_U.in.bus_inputs.ir_opp_bus.flight_path_angle_deg.Data;
    FacComputer_B.SSM_pu = FacComputer_U.in.bus_inputs.ir_opp_bus.flight_path_accel_g.SSM;
    FacComputer_B.Data_n = FacComputer_U.in.bus_inputs.ir_opp_bus.flight_path_accel_g.Data;
    FacComputer_B.fac_opp_healthy = FacComputer_U.in.discrete_inputs.fac_opp_healthy;
    FacComputer_B.SSM_nv = FacComputer_U.in.bus_inputs.ir_opp_bus.pitch_angle_deg.SSM;
    FacComputer_B.Data_bq = FacComputer_U.in.bus_inputs.ir_opp_bus.pitch_angle_deg.Data;
    FacComputer_B.SSM_d5 = FacComputer_U.in.bus_inputs.ir_opp_bus.roll_angle_deg.SSM;
    FacComputer_B.Data_dmn = FacComputer_U.in.bus_inputs.ir_opp_bus.roll_angle_deg.Data;
    FacComputer_B.SSM_eo = FacComputer_U.in.bus_inputs.ir_opp_bus.body_pitch_rate_deg_s.SSM;
    FacComputer_B.Data_jn = FacComputer_U.in.bus_inputs.ir_opp_bus.body_pitch_rate_deg_s.Data;
    FacComputer_B.SSM_nd = FacComputer_U.in.bus_inputs.ir_opp_bus.body_roll_rate_deg_s.SSM;
    FacComputer_B.Data_c = FacComputer_U.in.bus_inputs.ir_opp_bus.body_roll_rate_deg_s.Data;
    FacComputer_B.SSM_bq = FacComputer_U.in.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.SSM;
    FacComputer_B.Data_lx = FacComputer_U.in.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.Data;
    FacComputer_B.is_unit_1 = FacComputer_U.in.discrete_inputs.is_unit_1;
    FacComputer_B.SSM_hi = FacComputer_U.in.bus_inputs.ir_opp_bus.body_long_accel_g.SSM;
    FacComputer_B.Data_jb = FacComputer_U.in.bus_inputs.ir_opp_bus.body_long_accel_g.Data;
    FacComputer_B.SSM_mm = FacComputer_U.in.bus_inputs.ir_opp_bus.body_lat_accel_g.SSM;
    FacComputer_B.Data_fn = FacComputer_U.in.bus_inputs.ir_opp_bus.body_lat_accel_g.Data;
    FacComputer_B.SSM_kz = FacComputer_U.in.bus_inputs.ir_opp_bus.body_normal_accel_g.SSM;
    FacComputer_B.Data_od = FacComputer_U.in.bus_inputs.ir_opp_bus.body_normal_accel_g.Data;
    FacComputer_B.SSM_il = FacComputer_U.in.bus_inputs.ir_opp_bus.track_angle_rate_deg_s.SSM;
    FacComputer_B.Data_ez = FacComputer_U.in.bus_inputs.ir_opp_bus.track_angle_rate_deg_s.Data;
    FacComputer_B.SSM_i2 = FacComputer_U.in.bus_inputs.ir_opp_bus.pitch_att_rate_deg_s.SSM;
    FacComputer_B.Data_pw = FacComputer_U.in.bus_inputs.ir_opp_bus.pitch_att_rate_deg_s.Data;
    FacComputer_B.rudder_trim_actuator_healthy = FacComputer_U.in.discrete_inputs.rudder_trim_actuator_healthy;
    FacComputer_B.SSM_ah = FacComputer_U.in.bus_inputs.ir_opp_bus.roll_att_rate_deg_s.SSM;
    FacComputer_B.Data_m2 = FacComputer_U.in.bus_inputs.ir_opp_bus.roll_att_rate_deg_s.Data;
    FacComputer_B.SSM_en = FacComputer_U.in.bus_inputs.ir_opp_bus.inertial_alt_ft.SSM;
    FacComputer_B.Data_ek = FacComputer_U.in.bus_inputs.ir_opp_bus.inertial_alt_ft.Data;
    FacComputer_B.SSM_dq = FacComputer_U.in.bus_inputs.ir_opp_bus.along_track_horiz_acc_g.SSM;
    FacComputer_B.Data_iy = FacComputer_U.in.bus_inputs.ir_opp_bus.along_track_horiz_acc_g.Data;
    FacComputer_B.SSM_px = FacComputer_U.in.bus_inputs.ir_opp_bus.cross_track_horiz_acc_g.SSM;
    FacComputer_B.Data_lk = FacComputer_U.in.bus_inputs.ir_opp_bus.cross_track_horiz_acc_g.Data;
    FacComputer_B.SSM_lbo = FacComputer_U.in.bus_inputs.ir_opp_bus.vertical_accel_g.SSM;
    FacComputer_B.Data_ca = FacComputer_U.in.bus_inputs.ir_opp_bus.vertical_accel_g.Data;
    FacComputer_B.rudder_travel_lim_actuator_healthy =
      FacComputer_U.in.discrete_inputs.rudder_travel_lim_actuator_healthy;
    FacComputer_B.SSM_p5 = FacComputer_U.in.bus_inputs.ir_opp_bus.inertial_vertical_speed_ft_s.SSM;
    FacComputer_B.Data_pix = FacComputer_U.in.bus_inputs.ir_opp_bus.inertial_vertical_speed_ft_s.Data;
    FacComputer_B.SSM_mk = FacComputer_U.in.bus_inputs.ir_opp_bus.north_south_velocity_kn.SSM;
    FacComputer_B.Data_di = FacComputer_U.in.bus_inputs.ir_opp_bus.north_south_velocity_kn.Data;
    FacComputer_B.SSM_mu = FacComputer_U.in.bus_inputs.ir_opp_bus.east_west_velocity_kn.SSM;
    FacComputer_B.Data_lz = FacComputer_U.in.bus_inputs.ir_opp_bus.east_west_velocity_kn.Data;
    FacComputer_B.SSM_cbl = FacComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.SSM;
    FacComputer_B.Data_lu = FacComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1.Data;
    FacComputer_B.SSM_gzd = FacComputer_U.in.bus_inputs.ir_3_bus.latitude_deg.SSM;
    FacComputer_B.Data_dc = FacComputer_U.in.bus_inputs.ir_3_bus.latitude_deg.Data;
    FacComputer_B.slats_extended = FacComputer_U.in.discrete_inputs.slats_extended;
    FacComputer_B.SSM_mo = FacComputer_U.in.bus_inputs.ir_3_bus.longitude_deg.SSM;
    FacComputer_B.Data_gc = FacComputer_U.in.bus_inputs.ir_3_bus.longitude_deg.Data;
    FacComputer_B.SSM_me = FacComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
    FacComputer_B.Data_am = FacComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.Data;
    FacComputer_B.SSM_mj = FacComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
    FacComputer_B.Data_mo = FacComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
    FacComputer_B.SSM_a5 = FacComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.SSM;
    FacComputer_B.Data_dg = FacComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.Data;
    FacComputer_B.SSM_bt = FacComputer_U.in.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
    FacComputer_B.Data_e1 = FacComputer_U.in.bus_inputs.ir_3_bus.wind_speed_kn.Data;
    FacComputer_B.nose_gear_pressed = FacComputer_U.in.discrete_inputs.nose_gear_pressed;
    FacComputer_B.SSM_om = FacComputer_U.in.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
    FacComputer_B.Data_fp = FacComputer_U.in.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
    FacComputer_B.SSM_ar = FacComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
    FacComputer_B.Data_ns = FacComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
    FacComputer_B.SSM_ce = FacComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
    FacComputer_B.Data_m3 = FacComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
    FacComputer_B.SSM_ed = FacComputer_U.in.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
    FacComputer_B.Data_oj = FacComputer_U.in.bus_inputs.ir_3_bus.drift_angle_deg.Data;
    FacComputer_B.SSM_jh = FacComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
    FacComputer_B.Data_jy = FacComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
    FacComputer_B.ir_3_switch = FacComputer_U.in.discrete_inputs.ir_3_switch;
    FacComputer_B.SSM_je = FacComputer_U.in.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
    FacComputer_B.Data_j1 = FacComputer_U.in.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
    FacComputer_B.SSM_jt = FacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
    FacComputer_B.Data_fc = FacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
    FacComputer_B.SSM_cui = FacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
    FacComputer_B.Data_of = FacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
    FacComputer_B.SSM_mq = FacComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
    FacComputer_B.Data_lg = FacComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
    FacComputer_B.SSM_ni = FacComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
    FacComputer_B.Data_n4 = FacComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
    FacComputer_B.adr_3_switch = FacComputer_U.in.discrete_inputs.adr_3_switch;
    FacComputer_B.SSM_df = FacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
    FacComputer_B.Data_ot = FacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
    FacComputer_B.SSM_oe = FacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
    FacComputer_B.Data_gv = FacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
    FacComputer_B.SSM_ha = FacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
    FacComputer_B.Data_ou = FacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
    FacComputer_B.SSM_op = FacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
    FacComputer_B.Data_dh = FacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
    FacComputer_B.SSM_a50 = FacComputer_U.in.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
    FacComputer_B.Data_ph = FacComputer_U.in.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
    FacComputer_B.monotonic_time = FacComputer_U.in.time.monotonic_time;
    FacComputer_B.yaw_damper_has_hyd_press = FacComputer_U.in.discrete_inputs.yaw_damper_has_hyd_press;
    FacComputer_B.SSM_og = FacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
    FacComputer_B.Data_gs = FacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
    FacComputer_B.SSM_a4 = FacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
    FacComputer_B.Data_fd4 = FacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
    FacComputer_B.SSM_bv = FacComputer_U.in.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
    FacComputer_B.Data_hm = FacComputer_U.in.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
    FacComputer_B.SSM_bo = FacComputer_U.in.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
    FacComputer_B.Data_i2 = FacComputer_U.in.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
    FacComputer_B.SSM_d1 = FacComputer_U.in.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
    FacComputer_B.Data_og = FacComputer_U.in.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
    FacComputer_B.yaw_damper_position_deg = FacComputer_U.in.analog_inputs.yaw_damper_position_deg;
    FacComputer_B.SSM_hy = FacComputer_U.in.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
    FacComputer_B.Data_fv = FacComputer_U.in.bus_inputs.ir_3_bus.vertical_accel_g.Data;
    FacComputer_B.SSM_gi = FacComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
    FacComputer_B.Data_oc = FacComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
    FacComputer_B.SSM_pp = FacComputer_U.in.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
    FacComputer_B.Data_kq = FacComputer_U.in.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
    FacComputer_B.SSM_iab = FacComputer_U.in.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
    FacComputer_B.Data_ne = FacComputer_U.in.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
    FacComputer_B.SSM_jtv = FacComputer_U.in.bus_inputs.fmgc_own_bus.fac_weight_lbs.SSM;
    FacComputer_B.Data_it = FacComputer_U.in.bus_inputs.fmgc_own_bus.fac_weight_lbs.Data;
    FacComputer_B.rudder_trim_position_deg = FacComputer_U.in.analog_inputs.rudder_trim_position_deg;
    FacComputer_B.SSM_fy = FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_weight_lbs.SSM;
    FacComputer_B.Data_ch = FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_weight_lbs.Data;
    FacComputer_B.SSM_d4 = FacComputer_U.in.bus_inputs.fmgc_own_bus.fac_cg_percent.SSM;
    FacComputer_B.Data_bb = FacComputer_U.in.bus_inputs.fmgc_own_bus.fac_cg_percent.Data;
    FacComputer_B.SSM_ars = FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_cg_percent.SSM;
    FacComputer_B.Data_ol = FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_cg_percent.Data;
    FacComputer_B.SSM_din = FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft.SSM;
    FacComputer_B.Data_hw = FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft.Data;
    FacComputer_B.SSM_m3 = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_4.SSM;
    FacComputer_B.Data_hs = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_4.Data;
    FacComputer_B.rudder_travel_lim_position_deg = FacComputer_U.in.analog_inputs.rudder_travel_lim_position_deg;
    FacComputer_B.SSM_np = FacComputer_U.in.bus_inputs.fmgc_own_bus.ats_discrete_word.SSM;
    FacComputer_B.Data_fj = FacComputer_U.in.bus_inputs.fmgc_own_bus.ats_discrete_word.Data;
    FacComputer_B.SSM_ax = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_3.SSM;
    FacComputer_B.Data_ky = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_3.Data;
    FacComputer_B.SSM_cl = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_1.SSM;
    FacComputer_B.Data_h5 = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_1.Data;
    FacComputer_B.SSM_es = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_2.SSM;
    FacComputer_B.Data_ku = FacComputer_U.in.bus_inputs.fmgc_own_bus.discrete_word_2.Data;
    FacComputer_B.SSM_gi1 = FacComputer_U.in.bus_inputs.fmgc_own_bus.approach_spd_target_kn.SSM;
    FacComputer_B.Data_jp = FacComputer_U.in.bus_inputs.fmgc_own_bus.approach_spd_target_kn.Data;
    FacComputer_B.SSM_jz = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_1.SSM;
    FacComputer_B.SSM_kt = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_p_ail_cmd_deg.SSM;
    FacComputer_B.Data_nu = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_p_ail_cmd_deg.Data;
    FacComputer_B.SSM_ds = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_p_splr_cmd_deg.SSM;
    FacComputer_B.Data_br = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_p_splr_cmd_deg.Data;
    FacComputer_B.SSM_eg = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_r_cmd_deg.SSM;
    FacComputer_B.Data_ae = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_r_cmd_deg.Data;
    FacComputer_B.SSM_a0 = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_nose_wheel_cmd_deg.SSM;
    FacComputer_B.Data_pe = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_nose_wheel_cmd_deg.Data;
    FacComputer_B.SSM_cv = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_q_cmd_deg.SSM;
    FacComputer_B.Data_fy = FacComputer_U.in.bus_inputs.fmgc_own_bus.delta_q_cmd_deg.Data;
    FacComputer_B.Data_na = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_1.Data;
    FacComputer_B.SSM_ea = FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.SSM;
    FacComputer_B.Data_my = FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data;
    FacComputer_B.SSM_p4 = FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.SSM;
    FacComputer_B.Data_i4 = FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data;
    FacComputer_B.SSM_m2 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fac_weight_lbs.SSM;
    FacComputer_B.Data_cx = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fac_weight_lbs.Data;
    FacComputer_B.SSM_bt0 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fm_weight_lbs.SSM;
    FacComputer_B.Data_nz = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fm_weight_lbs.Data;
    FacComputer_B.SSM_nr = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fac_cg_percent.SSM;
    FacComputer_B.Data_id = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fac_cg_percent.Data;
    FacComputer_B.SSM_fr = FacComputer_U.in.bus_inputs.fac_opp_bus.gamma_a_deg.SSM;
    FacComputer_B.SSM_cc = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fm_cg_percent.SSM;
    FacComputer_B.Data_o2 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fm_cg_percent.Data;
    FacComputer_B.SSM_lm = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fg_radio_height_ft.SSM;
    FacComputer_B.Data_gqq = FacComputer_U.in.bus_inputs.fmgc_opp_bus.fg_radio_height_ft.Data;
    FacComputer_B.SSM_mkm = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4.SSM;
    FacComputer_B.Data_md = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4.Data;
    FacComputer_B.SSM_jhd = FacComputer_U.in.bus_inputs.fmgc_opp_bus.ats_discrete_word.SSM;
    FacComputer_B.Data_cz = FacComputer_U.in.bus_inputs.fmgc_opp_bus.ats_discrete_word.Data;
    FacComputer_B.SSM_av = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3.SSM;
    FacComputer_B.Data_pm = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3.Data;
    FacComputer_B.Data_bj = FacComputer_U.in.bus_inputs.fac_opp_bus.gamma_a_deg.Data;
    FacComputer_B.SSM_ira = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1.SSM;
    FacComputer_B.Data_ox = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1.Data;
    FacComputer_B.SSM_ge = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2.SSM;
    FacComputer_B.Data_pe5 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2.Data;
    FacComputer_B.SSM_lv = FacComputer_U.in.bus_inputs.fmgc_opp_bus.approach_spd_target_kn.SSM;
    FacComputer_B.Data_jj = FacComputer_U.in.bus_inputs.fmgc_opp_bus.approach_spd_target_kn.Data;
    FacComputer_B.SSM_cg = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_p_ail_cmd_deg.SSM;
    FacComputer_B.Data_p5 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_p_ail_cmd_deg.Data;
    FacComputer_B.SSM_be = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_p_splr_cmd_deg.SSM;
    FacComputer_B.Data_ekl = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_p_splr_cmd_deg.Data;
    FacComputer_B.SSM_axb = FacComputer_U.in.bus_inputs.fac_opp_bus.gamma_t_deg.SSM;
    FacComputer_B.SSM_nz = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_r_cmd_deg.SSM;
    FacComputer_B.Data_nd = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_r_cmd_deg.Data;
    FacComputer_B.SSM_cx = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_nose_wheel_cmd_deg.SSM;
    FacComputer_B.Data_n2 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_nose_wheel_cmd_deg.Data;
    FacComputer_B.SSM_gh = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_q_cmd_deg.SSM;
    FacComputer_B.Data_dl = FacComputer_U.in.bus_inputs.fmgc_opp_bus.delta_q_cmd_deg.Data;
    FacComputer_B.SSM_ks = FacComputer_U.in.bus_inputs.fmgc_opp_bus.n1_left_percent.SSM;
    FacComputer_B.Data_gs2 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.n1_left_percent.Data;
    FacComputer_B.SSM_pw = FacComputer_U.in.bus_inputs.fmgc_opp_bus.n1_right_percent.SSM;
    FacComputer_B.Data_h4 = FacComputer_U.in.bus_inputs.fmgc_opp_bus.n1_right_percent.Data;
    FacComputer_B.Data_e3 = FacComputer_U.in.bus_inputs.fac_opp_bus.gamma_t_deg.Data;
    FacComputer_B.SSM_fh = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_component_status_word.SSM;
    FacComputer_B.Data_f5h = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_component_status_word.Data;
    FacComputer_B.SSM_gzn = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word.SSM;
    FacComputer_B.Data_an = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word.Data;
    FacComputer_B.SSM_oo = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word.SSM;
    FacComputer_B.Data_i4o = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word.Data;
    FacComputer_B.SSM_evh = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_actual_position_deg.SSM;
    FacComputer_B.Data_af = FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_actual_position_deg.Data;
    FacComputer_B.SSM_cn = FacComputer_U.in.bus_inputs.sfcc_own_bus.flap_actual_position_deg.SSM;
    FacComputer_B.Data_bm = FacComputer_U.in.bus_inputs.sfcc_own_bus.flap_actual_position_deg.Data;
    FacComputer_B.slew_on = FacComputer_U.in.sim_data.slew_on;
    FacComputer_B.SSM_co = FacComputer_U.in.bus_inputs.fac_opp_bus.total_weight_lbs.SSM;
    FacComputer_B.SSM_pe = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_1.SSM;
    FacComputer_B.Data_dk = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_1.Data;
    FacComputer_B.SSM_cgz = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2.SSM;
    FacComputer_B.Data_nv = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2.Data;
    FacComputer_B.SSM_fw = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_3.SSM;
    FacComputer_B.Data_jpf = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_3.Data;
    FacComputer_B.SSM_h4 = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_4.SSM;
    FacComputer_B.Data_i5 = FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_4.Data;
    FacComputer_B.SSM_cb3 = FacComputer_U.in.bus_inputs.elac_1_bus.left_aileron_position_deg.SSM;
    FacComputer_B.Data_k2 = FacComputer_U.in.bus_inputs.elac_1_bus.left_aileron_position_deg.Data;
    FacComputer_B.Data_as = FacComputer_U.in.bus_inputs.fac_opp_bus.total_weight_lbs.Data;
    FacComputer_B.SSM_pj = FacComputer_U.in.bus_inputs.elac_1_bus.right_aileron_position_deg.SSM;
    FacComputer_B.Data_gk = FacComputer_U.in.bus_inputs.elac_1_bus.right_aileron_position_deg.Data;
    FacComputer_B.SSM_dv = FacComputer_U.in.bus_inputs.elac_1_bus.left_elevator_position_deg.SSM;
    FacComputer_B.Data_jl = FacComputer_U.in.bus_inputs.elac_1_bus.left_elevator_position_deg.Data;
    FacComputer_B.SSM_i4 = FacComputer_U.in.bus_inputs.elac_1_bus.right_elevator_position_deg.SSM;
    FacComputer_B.Data_e32 = FacComputer_U.in.bus_inputs.elac_1_bus.right_elevator_position_deg.Data;
    FacComputer_B.SSM_fm = FacComputer_U.in.bus_inputs.elac_1_bus.ths_position_deg.SSM;
    FacComputer_B.Data_ih = FacComputer_U.in.bus_inputs.elac_1_bus.ths_position_deg.Data;
    FacComputer_B.SSM_e5 = FacComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.SSM;
    FacComputer_B.Data_du = FacComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.Data;
    FacComputer_B.SSM_bf = FacComputer_U.in.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.SSM;
    FacComputer_B.SSM_fd = FacComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.SSM;
    FacComputer_B.Data_nx = FacComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.Data;
    FacComputer_B.SSM_fv = FacComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.SSM;
    FacComputer_B.Data_n0 = FacComputer_U.in.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.Data;
    FacComputer_B.SSM_dt = FacComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.SSM;
    FacComputer_B.Data_eqi = FacComputer_U.in.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.Data;
    FacComputer_B.SSM_j5 = FacComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg.SSM;
    FacComputer_B.Data_om = FacComputer_U.in.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data;
    FacComputer_B.SSM_ng = FacComputer_U.in.bus_inputs.elac_1_bus.aileron_command_deg.SSM;
    FacComputer_B.Data_nr = FacComputer_U.in.bus_inputs.elac_1_bus.aileron_command_deg.Data;
    FacComputer_B.Data_p3 = FacComputer_U.in.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.Data;
    FacComputer_B.SSM_cs = FacComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM;
    FacComputer_B.Data_nb = FacComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data;
    FacComputer_B.SSM_ls = FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.SSM;
    FacComputer_B.Data_hd = FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
    FacComputer_B.SSM_dg = FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1.SSM;
    FacComputer_B.Data_al = FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1.Data;
    FacComputer_B.SSM_d3 = FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2.SSM;
    FacComputer_B.Data_gu = FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2.Data;
    FacComputer_B.SSM_p2 = FacComputer_U.in.bus_inputs.elac_2_bus.left_aileron_position_deg.SSM;
    FacComputer_B.Data_ix = FacComputer_U.in.bus_inputs.elac_2_bus.left_aileron_position_deg.Data;
    FacComputer_B.SSM_bo0 = FacComputer_U.in.bus_inputs.fac_opp_bus.sideslip_target_deg.SSM;
    FacComputer_B.SSM_bc = FacComputer_U.in.bus_inputs.elac_2_bus.right_aileron_position_deg.SSM;
    FacComputer_B.Data_do = FacComputer_U.in.bus_inputs.elac_2_bus.right_aileron_position_deg.Data;
    FacComputer_B.SSM_h0 = FacComputer_U.in.bus_inputs.elac_2_bus.left_elevator_position_deg.SSM;
    FacComputer_B.Data_hu = FacComputer_U.in.bus_inputs.elac_2_bus.left_elevator_position_deg.Data;
    FacComputer_B.SSM_giz = FacComputer_U.in.bus_inputs.elac_2_bus.right_elevator_position_deg.SSM;
    FacComputer_B.Data_pm1 = FacComputer_U.in.bus_inputs.elac_2_bus.right_elevator_position_deg.Data;
    FacComputer_B.SSM_mqp = FacComputer_U.in.bus_inputs.elac_2_bus.ths_position_deg.SSM;
    FacComputer_B.Data_i2y = FacComputer_U.in.bus_inputs.elac_2_bus.ths_position_deg.Data;
    FacComputer_B.SSM_ba = FacComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.SSM;
    FacComputer_B.Data_pg = FacComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.Data;
    FacComputer_B.Data_ni = FacComputer_U.in.bus_inputs.fac_opp_bus.sideslip_target_deg.Data;
    FacComputer_B.SSM_in = FacComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.SSM;
    FacComputer_B.Data_fr = FacComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.Data;
    FacComputer_B.SSM_ff = FacComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.SSM;
    FacComputer_B.Data_cn = FacComputer_U.in.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.Data;
    FacComputer_B.SSM_ic = FacComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.SSM;
    FacComputer_B.Data_nxl = FacComputer_U.in.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.Data;
    FacComputer_B.SSM_fs = FacComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg.SSM;
    FacComputer_B.Data_jh = FacComputer_U.in.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data;
    FacComputer_B.SSM_ja = FacComputer_U.in.bus_inputs.elac_2_bus.aileron_command_deg.SSM;
    FacComputer_B.Data_gl = FacComputer_U.in.bus_inputs.elac_2_bus.aileron_command_deg.Data;
    FacComputer_B.SSM_js = FacComputer_U.in.bus_inputs.fac_opp_bus.fac_slat_angle_deg.SSM;
    FacComputer_B.SSM_is3 = FacComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM;
    FacComputer_B.Data_gn = FacComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data;
    FacComputer_B.SSM_ag = FacComputer_U.in.bus_inputs.elac_2_bus.yaw_damper_command_deg.SSM;
    FacComputer_B.Data_myb = FacComputer_U.in.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data;
    FacComputer_B.SSM_f5 = FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1.SSM;
    FacComputer_B.Data_l2 = FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1.Data;
    FacComputer_B.SSM_ph = FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2.SSM;
    FacComputer_B.Data_o5o = FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2.Data;
    FacComputer_B.Data_l5 = FacComputer_U.in.bus_inputs.fac_opp_bus.fac_slat_angle_deg.Data;
    FacComputer_B.SSM_jw = FacComputer_U.in.bus_inputs.fac_opp_bus.fac_flap_angle.SSM;
    FacComputer_B.Data_dc2 = FacComputer_U.in.bus_inputs.fac_opp_bus.fac_flap_angle.Data;
    FacComputer_B.pause_on = FacComputer_U.in.sim_data.pause_on;
    FacComputer_B.SSM_jy = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_2.SSM;
    FacComputer_B.Data_gr = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_2.Data;
    FacComputer_B.SSM_j1 = FacComputer_U.in.bus_inputs.fac_opp_bus.rudder_travel_limit_command_deg.SSM;
    FacComputer_B.Data_gp = FacComputer_U.in.bus_inputs.fac_opp_bus.rudder_travel_limit_command_deg.Data;
    FacComputer_B.SSM_ov = FacComputer_U.in.bus_inputs.fac_opp_bus.delta_r_yaw_damper_deg.SSM;
    FacComputer_B.Data_i3 = FacComputer_U.in.bus_inputs.fac_opp_bus.delta_r_yaw_damper_deg.Data;
    FacComputer_B.SSM_mx = FacComputer_U.in.bus_inputs.fac_opp_bus.estimated_sideslip_deg.SSM;
    FacComputer_B.Data_et = FacComputer_U.in.bus_inputs.fac_opp_bus.estimated_sideslip_deg.Data;
    FacComputer_B.SSM_b4 = FacComputer_U.in.bus_inputs.fac_opp_bus.v_alpha_lim_kn.SSM;
    FacComputer_B.Data_mc = FacComputer_U.in.bus_inputs.fac_opp_bus.v_alpha_lim_kn.Data;
    FacComputer_B.tracking_mode_on_override = FacComputer_U.in.sim_data.tracking_mode_on_override;
    FacComputer_B.SSM_gb = FacComputer_U.in.bus_inputs.fac_opp_bus.v_ls_kn.SSM;
    FacComputer_B.Data_k3 = FacComputer_U.in.bus_inputs.fac_opp_bus.v_ls_kn.Data;
    FacComputer_B.SSM_oh = FacComputer_U.in.bus_inputs.fac_opp_bus.v_stall_kn.SSM;
    FacComputer_B.Data_f2 = FacComputer_U.in.bus_inputs.fac_opp_bus.v_stall_kn.Data;
    FacComputer_B.SSM_mm5 = FacComputer_U.in.bus_inputs.fac_opp_bus.v_alpha_prot_kn.SSM;
    FacComputer_B.Data_gh = FacComputer_U.in.bus_inputs.fac_opp_bus.v_alpha_prot_kn.Data;
    FacComputer_B.SSM_br = FacComputer_U.in.bus_inputs.fac_opp_bus.v_stall_warn_kn.SSM;
    FacComputer_B.Data_ed = FacComputer_U.in.bus_inputs.fac_opp_bus.v_stall_warn_kn.Data;
    FacComputer_B.SSM_c2 = FacComputer_U.in.bus_inputs.fac_opp_bus.speed_trend_kn.SSM;
    FacComputer_B.Data_o2j = FacComputer_U.in.bus_inputs.fac_opp_bus.speed_trend_kn.Data;
    FacComputer_B.tailstrike_protection_on = FacComputer_U.in.sim_data.tailstrike_protection_on;
    FacComputer_B.SSM_hc = FacComputer_U.in.bus_inputs.fac_opp_bus.v_3_kn.SSM;
    FacComputer_B.Data_i43 = FacComputer_U.in.bus_inputs.fac_opp_bus.v_3_kn.Data;
    FacComputer_B.SSM_ktr = FacComputer_U.in.bus_inputs.fac_opp_bus.v_4_kn.SSM;
    FacComputer_B.Data_ic = FacComputer_U.in.bus_inputs.fac_opp_bus.v_4_kn.Data;
    FacComputer_B.SSM_gl = FacComputer_U.in.bus_inputs.fac_opp_bus.v_man_kn.SSM;
    FacComputer_B.Data_ak = FacComputer_U.in.bus_inputs.fac_opp_bus.v_man_kn.Data;
    FacComputer_B.SSM_my = FacComputer_U.in.bus_inputs.fac_opp_bus.v_max_kn.SSM;
    FacComputer_B.Data_jg = FacComputer_U.in.bus_inputs.fac_opp_bus.v_max_kn.Data;
    FacComputer_B.SSM_j3 = FacComputer_U.in.bus_inputs.fac_opp_bus.v_fe_next_kn.SSM;
    FacComputer_B.Data_cu = FacComputer_U.in.bus_inputs.fac_opp_bus.v_fe_next_kn.Data;
    FacComputer_B.computer_running = FacComputer_U.in.sim_data.computer_running;
    FacComputer_B.SSM_go = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_3.SSM;
    FacComputer_B.Data_ep = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_3.Data;
    FacComputer_B.SSM_e5c = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_4.SSM;
    FacComputer_B.Data_d3 = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_4.Data;
    FacComputer_B.SSM_dk = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5.SSM;
    FacComputer_B.Data_bt = FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5.Data;
    FacComputer_B.SSM_evc = FacComputer_U.in.bus_inputs.fac_opp_bus.delta_r_rudder_trim_deg.SSM;
    FacComputer_B.Data_e0 = FacComputer_U.in.bus_inputs.fac_opp_bus.delta_r_rudder_trim_deg.Data;
    FacComputer_B.SSM_kk = FacComputer_U.in.bus_inputs.fac_opp_bus.rudder_trim_pos_deg.SSM;
    FacComputer_B.Data_jl3 = FacComputer_U.in.bus_inputs.fac_opp_bus.rudder_trim_pos_deg.Data;
    FacComputer_B.ap_own_engaged = FacComputer_U.in.discrete_inputs.ap_own_engaged;
    FacComputer_B.SSM_af = FacComputer_U.in.bus_inputs.adr_own_bus.altitude_standard_ft.SSM;
    FacComputer_B.Data_nm = FacComputer_U.in.bus_inputs.adr_own_bus.altitude_standard_ft.Data;
    FacComputer_B.SSM_npr = FacComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_ft.SSM;
    FacComputer_B.Data_ia = FacComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_ft.Data;
    FacComputer_B.SSM_ew = FacComputer_U.in.bus_inputs.adr_own_bus.mach.SSM;
    FacComputer_B.Data_j0 = FacComputer_U.in.bus_inputs.adr_own_bus.mach.Data;
    FacComputer_B.SSM_lt = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM;
    FacComputer_B.Data_bs = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.Data;
    FacComputer_B.SSM_ger = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.SSM;
    FacComputer_B.Data_hp = FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.Data;
    FacComputer_DWork.Delay1_DSTATE = FacComputer_DWork.Delay_DSTATE_d;
    FacComputer_DWork.Delay_DSTATE = Vtas;
    FacComputer_DWork.Delay2_DSTATE = FacComputer_DWork.Delay_DSTATE_m;
  } else {
    FacComputer_DWork.Runtime_MODE = false;
  }

  FacComputer_Y.out.data.time.dt = FacComputer_B.dt;
  FacComputer_Y.out.data.time.simulation_time = FacComputer_B.simulation_time;
  FacComputer_Y.out.data.time.monotonic_time = FacComputer_B.monotonic_time;
  FacComputer_Y.out.data.sim_data.slew_on = FacComputer_B.slew_on;
  FacComputer_Y.out.data.sim_data.pause_on = FacComputer_B.pause_on;
  FacComputer_Y.out.data.sim_data.tracking_mode_on_override = FacComputer_B.tracking_mode_on_override;
  FacComputer_Y.out.data.sim_data.tailstrike_protection_on = FacComputer_B.tailstrike_protection_on;
  FacComputer_Y.out.data.sim_data.computer_running = FacComputer_B.computer_running;
  FacComputer_Y.out.data.discrete_inputs.ap_own_engaged = FacComputer_B.ap_own_engaged;
  FacComputer_Y.out.data.discrete_inputs.ap_opp_engaged = FacComputer_B.ap_opp_engaged;
  FacComputer_Y.out.data.discrete_inputs.yaw_damper_opp_engaged = FacComputer_B.yaw_damper_opp_engaged;
  FacComputer_Y.out.data.discrete_inputs.rudder_trim_opp_engaged = FacComputer_B.rudder_trim_opp_engaged;
  FacComputer_Y.out.data.discrete_inputs.rudder_travel_lim_opp_engaged = FacComputer_B.rudder_travel_lim_opp_engaged;
  FacComputer_Y.out.data.discrete_inputs.elac_1_healthy = FacComputer_B.elac_1_healthy;
  FacComputer_Y.out.data.discrete_inputs.elac_2_healthy = FacComputer_B.elac_2_healthy;
  FacComputer_Y.out.data.discrete_inputs.engine_1_stopped = FacComputer_B.engine_1_stopped;
  FacComputer_Y.out.data.discrete_inputs.engine_2_stopped = FacComputer_B.engine_2_stopped;
  FacComputer_Y.out.data.discrete_inputs.rudder_trim_switch_left = FacComputer_B.rudder_trim_switch_left;
  FacComputer_Y.out.data.discrete_inputs.rudder_trim_switch_right = FacComputer_B.rudder_trim_switch_right;
  FacComputer_Y.out.data.discrete_inputs.rudder_trim_reset_button = FacComputer_B.rudder_trim_reset_button;
  FacComputer_Y.out.data.discrete_inputs.fac_engaged_from_switch = FacComputer_B.fac_engaged_from_switch;
  FacComputer_Y.out.data.discrete_inputs.fac_opp_healthy = FacComputer_B.fac_opp_healthy;
  FacComputer_Y.out.data.discrete_inputs.is_unit_1 = FacComputer_B.is_unit_1;
  FacComputer_Y.out.data.discrete_inputs.rudder_trim_actuator_healthy = FacComputer_B.rudder_trim_actuator_healthy;
  FacComputer_Y.out.data.discrete_inputs.rudder_travel_lim_actuator_healthy =
    FacComputer_B.rudder_travel_lim_actuator_healthy;
  FacComputer_Y.out.data.discrete_inputs.slats_extended = FacComputer_B.slats_extended;
  FacComputer_Y.out.data.discrete_inputs.nose_gear_pressed = FacComputer_B.nose_gear_pressed;
  FacComputer_Y.out.data.discrete_inputs.ir_3_switch = FacComputer_B.ir_3_switch;
  FacComputer_Y.out.data.discrete_inputs.adr_3_switch = FacComputer_B.adr_3_switch;
  FacComputer_Y.out.data.discrete_inputs.yaw_damper_has_hyd_press = FacComputer_B.yaw_damper_has_hyd_press;
  FacComputer_Y.out.data.analog_inputs.yaw_damper_position_deg = FacComputer_B.yaw_damper_position_deg;
  FacComputer_Y.out.data.analog_inputs.rudder_trim_position_deg = FacComputer_B.rudder_trim_position_deg;
  FacComputer_Y.out.data.analog_inputs.rudder_travel_lim_position_deg = FacComputer_B.rudder_travel_lim_position_deg;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_1.SSM = FacComputer_B.SSM_jz;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_1.Data = FacComputer_B.Data_na;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.gamma_a_deg.SSM = FacComputer_B.SSM_fr;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.gamma_a_deg.Data = FacComputer_B.Data_bj;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.gamma_t_deg.SSM = FacComputer_B.SSM_axb;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.gamma_t_deg.Data = FacComputer_B.Data_e3;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.total_weight_lbs.SSM = FacComputer_B.SSM_co;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.total_weight_lbs.Data = FacComputer_B.Data_as;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.SSM = FacComputer_B.SSM_bf;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.Data = FacComputer_B.Data_p3;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.sideslip_target_deg.SSM = FacComputer_B.SSM_bo0;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.sideslip_target_deg.Data = FacComputer_B.Data_ni;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.fac_slat_angle_deg.SSM = FacComputer_B.SSM_js;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.fac_slat_angle_deg.Data = FacComputer_B.Data_l5;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.fac_flap_angle.SSM = FacComputer_B.SSM_jw;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.fac_flap_angle.Data = FacComputer_B.Data_dc2;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_2.SSM = FacComputer_B.SSM_jy;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_2.Data = FacComputer_B.Data_gr;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.rudder_travel_limit_command_deg.SSM = FacComputer_B.SSM_j1;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.rudder_travel_limit_command_deg.Data = FacComputer_B.Data_gp;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.delta_r_yaw_damper_deg.SSM = FacComputer_B.SSM_ov;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.delta_r_yaw_damper_deg.Data = FacComputer_B.Data_i3;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.estimated_sideslip_deg.SSM = FacComputer_B.SSM_mx;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.estimated_sideslip_deg.Data = FacComputer_B.Data_et;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_alpha_lim_kn.SSM = FacComputer_B.SSM_b4;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_alpha_lim_kn.Data = FacComputer_B.Data_mc;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_ls_kn.SSM = FacComputer_B.SSM_gb;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_ls_kn.Data = FacComputer_B.Data_k3;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_stall_kn.SSM = FacComputer_B.SSM_oh;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_stall_kn.Data = FacComputer_B.Data_f2;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_alpha_prot_kn.SSM = FacComputer_B.SSM_mm5;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_alpha_prot_kn.Data = FacComputer_B.Data_gh;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_stall_warn_kn.SSM = FacComputer_B.SSM_br;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_stall_warn_kn.Data = FacComputer_B.Data_ed;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.speed_trend_kn.SSM = FacComputer_B.SSM_c2;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.speed_trend_kn.Data = FacComputer_B.Data_o2j;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_3_kn.SSM = FacComputer_B.SSM_hc;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_3_kn.Data = FacComputer_B.Data_i43;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_4_kn.SSM = FacComputer_B.SSM_ktr;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_4_kn.Data = FacComputer_B.Data_ic;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_man_kn.SSM = FacComputer_B.SSM_gl;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_man_kn.Data = FacComputer_B.Data_ak;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_max_kn.SSM = FacComputer_B.SSM_my;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_max_kn.Data = FacComputer_B.Data_jg;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_fe_next_kn.SSM = FacComputer_B.SSM_j3;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.v_fe_next_kn.Data = FacComputer_B.Data_cu;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_3.SSM = FacComputer_B.SSM_go;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_3.Data = FacComputer_B.Data_ep;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_4.SSM = FacComputer_B.SSM_e5c;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_4.Data = FacComputer_B.Data_d3;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_5.SSM = FacComputer_B.SSM_dk;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.discrete_word_5.Data = FacComputer_B.Data_bt;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.delta_r_rudder_trim_deg.SSM = FacComputer_B.SSM_evc;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.delta_r_rudder_trim_deg.Data = FacComputer_B.Data_e0;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.rudder_trim_pos_deg.SSM = FacComputer_B.SSM_kk;
  FacComputer_Y.out.data.bus_inputs.fac_opp_bus.rudder_trim_pos_deg.Data = FacComputer_B.Data_jl3;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.altitude_standard_ft.SSM = FacComputer_B.SSM_af;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.altitude_standard_ft.Data = FacComputer_B.Data_nm;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.altitude_corrected_ft.SSM = FacComputer_B.SSM_npr;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.altitude_corrected_ft.Data = FacComputer_B.Data_ia;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.mach.SSM = FacComputer_B.SSM_ew;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.mach.Data = FacComputer_B.Data_j0;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM = FacComputer_B.SSM_lt;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.airspeed_computed_kn.Data = FacComputer_B.Data_bs;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.airspeed_true_kn.SSM = FacComputer_B.SSM_ger;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.airspeed_true_kn.Data = FacComputer_B.Data_hp;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.vertical_speed_ft_min.SSM = FacComputer_B.SSM;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.vertical_speed_ft_min.Data = FacComputer_B.Data;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM = FacComputer_B.SSM_k;
  FacComputer_Y.out.data.bus_inputs.adr_own_bus.aoa_corrected_deg.Data = FacComputer_B.Data_f;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.altitude_standard_ft.SSM = FacComputer_B.SSM_kx;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.altitude_standard_ft.Data = FacComputer_B.Data_fw;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.altitude_corrected_ft.SSM = FacComputer_B.SSM_kxx;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.altitude_corrected_ft.Data = FacComputer_B.Data_fwx;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.mach.SSM = FacComputer_B.SSM_kxxt;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.mach.Data = FacComputer_B.Data_fwxk;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM = FacComputer_B.SSM_kxxta;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.airspeed_computed_kn.Data = FacComputer_B.Data_fwxkf;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.airspeed_true_kn.SSM = FacComputer_B.SSM_kxxtac;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.airspeed_true_kn.Data = FacComputer_B.Data_fwxkft;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.vertical_speed_ft_min.SSM = FacComputer_B.SSM_kxxtac0;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.vertical_speed_ft_min.Data = FacComputer_B.Data_fwxkftc;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM = FacComputer_B.SSM_kxxtac0z;
  FacComputer_Y.out.data.bus_inputs.adr_opp_bus.aoa_corrected_deg.Data = FacComputer_B.Data_fwxkftc3;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM = FacComputer_B.SSM_kxxtac0zt;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data = FacComputer_B.Data_fwxkftc3e;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM = FacComputer_B.SSM_kxxtac0ztg;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data = FacComputer_B.Data_fwxkftc3ep;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.mach.SSM = FacComputer_B.SSM_kxxtac0ztgf;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.mach.Data = FacComputer_B.Data_fwxkftc3epg;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM = FacComputer_B.SSM_kxxtac0ztgf2;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data = FacComputer_B.Data_fwxkftc3epgt;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM = FacComputer_B.SSM_kxxtac0ztgf2u;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data = FacComputer_B.Data_fwxkftc3epgtd;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM = FacComputer_B.SSM_kxxtac0ztgf2ux;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data = FacComputer_B.Data_fwxkftc3epgtdx;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM = FacComputer_B.SSM_kxxtac0ztgf2uxn;
  FacComputer_Y.out.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data = FacComputer_B.Data_fwxkftc3epgtdxc;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.discrete_word_1.SSM = FacComputer_B.SSM_ky;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.discrete_word_1.Data = FacComputer_B.Data_h;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.latitude_deg.SSM = FacComputer_B.SSM_d;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.latitude_deg.Data = FacComputer_B.Data_e;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.longitude_deg.SSM = FacComputer_B.SSM_h;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.longitude_deg.Data = FacComputer_B.Data_j;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.ground_speed_kn.SSM = FacComputer_B.SSM_kb;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.ground_speed_kn.Data = FacComputer_B.Data_d;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.track_angle_true_deg.SSM = FacComputer_B.SSM_p;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.track_angle_true_deg.Data = FacComputer_B.Data_p;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.heading_true_deg.SSM = FacComputer_B.SSM_di;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.heading_true_deg.Data = FacComputer_B.Data_i;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.wind_speed_kn.SSM = FacComputer_B.SSM_j;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.wind_speed_kn.Data = FacComputer_B.Data_g;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.wind_direction_true_deg.SSM = FacComputer_B.SSM_i;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.wind_direction_true_deg.Data = FacComputer_B.Data_a;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.track_angle_magnetic_deg.SSM = FacComputer_B.SSM_g;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.track_angle_magnetic_deg.Data = FacComputer_B.Data_eb;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.heading_magnetic_deg.SSM = FacComputer_B.SSM_db;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.heading_magnetic_deg.Data = FacComputer_B.Data_jo;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.drift_angle_deg.SSM = FacComputer_B.SSM_n;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.drift_angle_deg.Data = FacComputer_B.Data_ex;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.flight_path_angle_deg.SSM = FacComputer_B.SSM_a;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.flight_path_angle_deg.Data = FacComputer_B.Data_fd;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.flight_path_accel_g.SSM = FacComputer_B.SSM_ir;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.flight_path_accel_g.Data = FacComputer_B.Data_ja;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.pitch_angle_deg.SSM = FacComputer_B.SSM_hu;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.pitch_angle_deg.Data = FacComputer_B.Data_k;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.roll_angle_deg.SSM = FacComputer_B.SSM_e;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.roll_angle_deg.Data = FacComputer_B.Data_joy;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.SSM = FacComputer_B.SSM_gr;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.Data = FacComputer_B.Data_h3;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_roll_rate_deg_s.SSM = FacComputer_B.SSM_ev;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_roll_rate_deg_s.Data = FacComputer_B.Data_a0;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM = FacComputer_B.SSM_l;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.Data = FacComputer_B.Data_b;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_long_accel_g.SSM = FacComputer_B.SSM_ei;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_long_accel_g.Data = FacComputer_B.Data_eq;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_lat_accel_g.SSM = FacComputer_B.SSM_an;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_lat_accel_g.Data = FacComputer_B.Data_iz;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_normal_accel_g.SSM = FacComputer_B.SSM_c;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.body_normal_accel_g.Data = FacComputer_B.Data_j2;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.track_angle_rate_deg_s.SSM = FacComputer_B.SSM_cb;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.track_angle_rate_deg_s.Data = FacComputer_B.Data_o;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.SSM = FacComputer_B.SSM_lb;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.Data = FacComputer_B.Data_m;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.roll_att_rate_deg_s.SSM = FacComputer_B.SSM_ia;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.roll_att_rate_deg_s.Data = FacComputer_B.Data_oq;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.inertial_alt_ft.SSM = FacComputer_B.SSM_kyz;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.inertial_alt_ft.Data = FacComputer_B.Data_fo;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.along_track_horiz_acc_g.SSM = FacComputer_B.SSM_as;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.along_track_horiz_acc_g.Data = FacComputer_B.Data_p1;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.cross_track_horiz_acc_g.SSM = FacComputer_B.SSM_is;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.cross_track_horiz_acc_g.Data = FacComputer_B.Data_p1y;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.vertical_accel_g.SSM = FacComputer_B.SSM_ca;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.vertical_accel_g.Data = FacComputer_B.Data_l;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.SSM = FacComputer_B.SSM_o;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.Data = FacComputer_B.Data_kp;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.north_south_velocity_kn.SSM = FacComputer_B.SSM_ak;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.north_south_velocity_kn.Data = FacComputer_B.Data_k0;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.east_west_velocity_kn.SSM = FacComputer_B.SSM_cbj;
  FacComputer_Y.out.data.bus_inputs.ir_own_bus.east_west_velocity_kn.Data = FacComputer_B.Data_pi;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.discrete_word_1.SSM = FacComputer_B.SSM_cu;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.discrete_word_1.Data = FacComputer_B.Data_dm;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.latitude_deg.SSM = FacComputer_B.SSM_nn;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.latitude_deg.Data = FacComputer_B.Data_f5;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.longitude_deg.SSM = FacComputer_B.SSM_b;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.longitude_deg.Data = FacComputer_B.Data_js;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.ground_speed_kn.SSM = FacComputer_B.SSM_m;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.ground_speed_kn.Data = FacComputer_B.Data_ee;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.track_angle_true_deg.SSM = FacComputer_B.SSM_f;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.track_angle_true_deg.Data = FacComputer_B.Data_ig;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.heading_true_deg.SSM = FacComputer_B.SSM_bp;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.heading_true_deg.Data = FacComputer_B.Data_mk;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.wind_speed_kn.SSM = FacComputer_B.SSM_hb;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.wind_speed_kn.Data = FacComputer_B.Data_pu;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.wind_direction_true_deg.SSM = FacComputer_B.SSM_gz;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.wind_direction_true_deg.Data = FacComputer_B.Data_ly;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.track_angle_magnetic_deg.SSM = FacComputer_B.SSM_pv;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.track_angle_magnetic_deg.Data = FacComputer_B.Data_jq;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.heading_magnetic_deg.SSM = FacComputer_B.SSM_mf;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.heading_magnetic_deg.Data = FacComputer_B.Data_o5;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.drift_angle_deg.SSM = FacComputer_B.SSM_m0;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.drift_angle_deg.Data = FacComputer_B.Data_lyw;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.flight_path_angle_deg.SSM = FacComputer_B.SSM_kd;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.flight_path_angle_deg.Data = FacComputer_B.Data_gq;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.flight_path_accel_g.SSM = FacComputer_B.SSM_pu;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.flight_path_accel_g.Data = FacComputer_B.Data_n;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.pitch_angle_deg.SSM = FacComputer_B.SSM_nv;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.pitch_angle_deg.Data = FacComputer_B.Data_bq;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.roll_angle_deg.SSM = FacComputer_B.SSM_d5;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.roll_angle_deg.Data = FacComputer_B.Data_dmn;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_pitch_rate_deg_s.SSM = FacComputer_B.SSM_eo;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_pitch_rate_deg_s.Data = FacComputer_B.Data_jn;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_roll_rate_deg_s.SSM = FacComputer_B.SSM_nd;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_roll_rate_deg_s.Data = FacComputer_B.Data_c;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.SSM = FacComputer_B.SSM_bq;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.Data = FacComputer_B.Data_lx;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_long_accel_g.SSM = FacComputer_B.SSM_hi;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_long_accel_g.Data = FacComputer_B.Data_jb;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_lat_accel_g.SSM = FacComputer_B.SSM_mm;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_lat_accel_g.Data = FacComputer_B.Data_fn;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_normal_accel_g.SSM = FacComputer_B.SSM_kz;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.body_normal_accel_g.Data = FacComputer_B.Data_od;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.track_angle_rate_deg_s.SSM = FacComputer_B.SSM_il;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.track_angle_rate_deg_s.Data = FacComputer_B.Data_ez;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.pitch_att_rate_deg_s.SSM = FacComputer_B.SSM_i2;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.pitch_att_rate_deg_s.Data = FacComputer_B.Data_pw;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.roll_att_rate_deg_s.SSM = FacComputer_B.SSM_ah;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.roll_att_rate_deg_s.Data = FacComputer_B.Data_m2;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.inertial_alt_ft.SSM = FacComputer_B.SSM_en;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.inertial_alt_ft.Data = FacComputer_B.Data_ek;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.along_track_horiz_acc_g.SSM = FacComputer_B.SSM_dq;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.along_track_horiz_acc_g.Data = FacComputer_B.Data_iy;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.cross_track_horiz_acc_g.SSM = FacComputer_B.SSM_px;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.cross_track_horiz_acc_g.Data = FacComputer_B.Data_lk;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.vertical_accel_g.SSM = FacComputer_B.SSM_lbo;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.vertical_accel_g.Data = FacComputer_B.Data_ca;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.inertial_vertical_speed_ft_s.SSM = FacComputer_B.SSM_p5;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.inertial_vertical_speed_ft_s.Data = FacComputer_B.Data_pix;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.north_south_velocity_kn.SSM = FacComputer_B.SSM_mk;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.north_south_velocity_kn.Data = FacComputer_B.Data_di;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.east_west_velocity_kn.SSM = FacComputer_B.SSM_mu;
  FacComputer_Y.out.data.bus_inputs.ir_opp_bus.east_west_velocity_kn.Data = FacComputer_B.Data_lz;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.SSM = FacComputer_B.SSM_cbl;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.discrete_word_1.Data = FacComputer_B.Data_lu;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.SSM = FacComputer_B.SSM_gzd;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.latitude_deg.Data = FacComputer_B.Data_dc;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.SSM = FacComputer_B.SSM_mo;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.longitude_deg.Data = FacComputer_B.Data_gc;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM = FacComputer_B.SSM_me;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.ground_speed_kn.Data = FacComputer_B.Data_am;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM = FacComputer_B.SSM_mj;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data = FacComputer_B.Data_mo;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.SSM = FacComputer_B.SSM_a5;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.heading_true_deg.Data = FacComputer_B.Data_dg;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM = FacComputer_B.SSM_bt;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.wind_speed_kn.Data = FacComputer_B.Data_e1;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM = FacComputer_B.SSM_om;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data = FacComputer_B.Data_fp;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM = FacComputer_B.SSM_ar;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data = FacComputer_B.Data_ns;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM = FacComputer_B.SSM_ce;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data = FacComputer_B.Data_m3;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM = FacComputer_B.SSM_ed;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.drift_angle_deg.Data = FacComputer_B.Data_oj;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM = FacComputer_B.SSM_jh;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data = FacComputer_B.Data_jy;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM = FacComputer_B.SSM_je;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data = FacComputer_B.Data_j1;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM = FacComputer_B.SSM_jt;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data = FacComputer_B.Data_fc;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM = FacComputer_B.SSM_cui;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.roll_angle_deg.Data = FacComputer_B.Data_of;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM = FacComputer_B.SSM_mq;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data = FacComputer_B.Data_lg;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM = FacComputer_B.SSM_ni;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data = FacComputer_B.Data_n4;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM = FacComputer_B.SSM_df;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data = FacComputer_B.Data_ot;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM = FacComputer_B.SSM_oe;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_long_accel_g.Data = FacComputer_B.Data_gv;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM = FacComputer_B.SSM_ha;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data = FacComputer_B.Data_ou;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM = FacComputer_B.SSM_op;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data = FacComputer_B.Data_dh;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM = FacComputer_B.SSM_a50;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data = FacComputer_B.Data_ph;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM = FacComputer_B.SSM_og;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data = FacComputer_B.Data_gs;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM = FacComputer_B.SSM_a4;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data = FacComputer_B.Data_fd4;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM = FacComputer_B.SSM_bv;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data = FacComputer_B.Data_hm;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM = FacComputer_B.SSM_bo;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data = FacComputer_B.Data_i2;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM = FacComputer_B.SSM_d1;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data = FacComputer_B.Data_og;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM = FacComputer_B.SSM_hy;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.vertical_accel_g.Data = FacComputer_B.Data_fv;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM = FacComputer_B.SSM_gi;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data = FacComputer_B.Data_oc;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM = FacComputer_B.SSM_pp;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data = FacComputer_B.Data_kq;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM = FacComputer_B.SSM_iab;
  FacComputer_Y.out.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data = FacComputer_B.Data_ne;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fac_weight_lbs.SSM = FacComputer_B.SSM_jtv;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fac_weight_lbs.Data = FacComputer_B.Data_it;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fm_weight_lbs.SSM = FacComputer_B.SSM_fy;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fm_weight_lbs.Data = FacComputer_B.Data_ch;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fac_cg_percent.SSM = FacComputer_B.SSM_d4;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fac_cg_percent.Data = FacComputer_B.Data_bb;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fm_cg_percent.SSM = FacComputer_B.SSM_ars;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fm_cg_percent.Data = FacComputer_B.Data_ol;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fg_radio_height_ft.SSM = FacComputer_B.SSM_din;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.fg_radio_height_ft.Data = FacComputer_B.Data_hw;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_4.SSM = FacComputer_B.SSM_m3;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_4.Data = FacComputer_B.Data_hs;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.ats_discrete_word.SSM = FacComputer_B.SSM_np;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.ats_discrete_word.Data = FacComputer_B.Data_fj;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_3.SSM = FacComputer_B.SSM_ax;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_3.Data = FacComputer_B.Data_ky;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_1.SSM = FacComputer_B.SSM_cl;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_1.Data = FacComputer_B.Data_h5;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_2.SSM = FacComputer_B.SSM_es;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.discrete_word_2.Data = FacComputer_B.Data_ku;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.approach_spd_target_kn.SSM = FacComputer_B.SSM_gi1;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.approach_spd_target_kn.Data = FacComputer_B.Data_jp;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_p_ail_cmd_deg.SSM = FacComputer_B.SSM_kt;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_p_ail_cmd_deg.Data = FacComputer_B.Data_nu;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_p_splr_cmd_deg.SSM = FacComputer_B.SSM_ds;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_p_splr_cmd_deg.Data = FacComputer_B.Data_br;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_r_cmd_deg.SSM = FacComputer_B.SSM_eg;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_r_cmd_deg.Data = FacComputer_B.Data_ae;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_nose_wheel_cmd_deg.SSM = FacComputer_B.SSM_a0;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_nose_wheel_cmd_deg.Data = FacComputer_B.Data_pe;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_q_cmd_deg.SSM = FacComputer_B.SSM_cv;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.delta_q_cmd_deg.Data = FacComputer_B.Data_fy;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.n1_left_percent.SSM = FacComputer_B.SSM_ea;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.n1_left_percent.Data = FacComputer_B.Data_my;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.n1_right_percent.SSM = FacComputer_B.SSM_p4;
  FacComputer_Y.out.data.bus_inputs.fmgc_own_bus.n1_right_percent.Data = FacComputer_B.Data_i4;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fac_weight_lbs.SSM = FacComputer_B.SSM_m2;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fac_weight_lbs.Data = FacComputer_B.Data_cx;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fm_weight_lbs.SSM = FacComputer_B.SSM_bt0;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fm_weight_lbs.Data = FacComputer_B.Data_nz;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fac_cg_percent.SSM = FacComputer_B.SSM_nr;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fac_cg_percent.Data = FacComputer_B.Data_id;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fm_cg_percent.SSM = FacComputer_B.SSM_cc;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fm_cg_percent.Data = FacComputer_B.Data_o2;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fg_radio_height_ft.SSM = FacComputer_B.SSM_lm;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.fg_radio_height_ft.Data = FacComputer_B.Data_gqq;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_4.SSM = FacComputer_B.SSM_mkm;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_4.Data = FacComputer_B.Data_md;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.ats_discrete_word.SSM = FacComputer_B.SSM_jhd;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.ats_discrete_word.Data = FacComputer_B.Data_cz;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_3.SSM = FacComputer_B.SSM_av;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_3.Data = FacComputer_B.Data_pm;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_1.SSM = FacComputer_B.SSM_ira;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_1.Data = FacComputer_B.Data_ox;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_2.SSM = FacComputer_B.SSM_ge;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.discrete_word_2.Data = FacComputer_B.Data_pe5;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.approach_spd_target_kn.SSM = FacComputer_B.SSM_lv;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.approach_spd_target_kn.Data = FacComputer_B.Data_jj;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_p_ail_cmd_deg.SSM = FacComputer_B.SSM_cg;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_p_ail_cmd_deg.Data = FacComputer_B.Data_p5;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_p_splr_cmd_deg.SSM = FacComputer_B.SSM_be;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_p_splr_cmd_deg.Data = FacComputer_B.Data_ekl;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_r_cmd_deg.SSM = FacComputer_B.SSM_nz;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_r_cmd_deg.Data = FacComputer_B.Data_nd;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_nose_wheel_cmd_deg.SSM = FacComputer_B.SSM_cx;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_nose_wheel_cmd_deg.Data = FacComputer_B.Data_n2;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_q_cmd_deg.SSM = FacComputer_B.SSM_gh;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.delta_q_cmd_deg.Data = FacComputer_B.Data_dl;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.n1_left_percent.SSM = FacComputer_B.SSM_ks;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.n1_left_percent.Data = FacComputer_B.Data_gs2;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.n1_right_percent.SSM = FacComputer_B.SSM_pw;
  FacComputer_Y.out.data.bus_inputs.fmgc_opp_bus.n1_right_percent.Data = FacComputer_B.Data_h4;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_flap_component_status_word.SSM = FacComputer_B.SSM_fh;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_flap_component_status_word.Data = FacComputer_B.Data_f5h;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_flap_system_status_word.SSM = FacComputer_B.SSM_gzn;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_flap_system_status_word.Data = FacComputer_B.Data_an;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word.SSM = FacComputer_B.SSM_oo;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word.Data = FacComputer_B.Data_i4o;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_actual_position_deg.SSM = FacComputer_B.SSM_evh;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.slat_actual_position_deg.Data = FacComputer_B.Data_af;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.flap_actual_position_deg.SSM = FacComputer_B.SSM_cn;
  FacComputer_Y.out.data.bus_inputs.sfcc_own_bus.flap_actual_position_deg.Data = FacComputer_B.Data_bm;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_1.SSM = FacComputer_B.SSM_pe;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_1.Data = FacComputer_B.Data_dk;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_2.SSM = FacComputer_B.SSM_cgz;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_2.Data = FacComputer_B.Data_nv;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_3.SSM = FacComputer_B.SSM_fw;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_3.Data = FacComputer_B.Data_jpf;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_4.SSM = FacComputer_B.SSM_h4;
  FacComputer_Y.out.data.bus_inputs.lgciu_own_bus.discrete_word_4.Data = FacComputer_B.Data_i5;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_aileron_position_deg.SSM = FacComputer_B.SSM_cb3;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_aileron_position_deg.Data = FacComputer_B.Data_k2;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_aileron_position_deg.SSM = FacComputer_B.SSM_pj;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_aileron_position_deg.Data = FacComputer_B.Data_gk;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_elevator_position_deg.SSM = FacComputer_B.SSM_dv;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_elevator_position_deg.Data = FacComputer_B.Data_jl;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_elevator_position_deg.SSM = FacComputer_B.SSM_i4;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_elevator_position_deg.Data = FacComputer_B.Data_e32;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.ths_position_deg.SSM = FacComputer_B.SSM_fm;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.ths_position_deg.Data = FacComputer_B.Data_ih;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.SSM = FacComputer_B.SSM_e5;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.Data = FacComputer_B.Data_du;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.SSM = FacComputer_B.SSM_fd;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.Data = FacComputer_B.Data_nx;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.SSM = FacComputer_B.SSM_fv;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.Data = FacComputer_B.Data_n0;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.SSM = FacComputer_B.SSM_dt;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.Data = FacComputer_B.Data_eqi;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.SSM = FacComputer_B.SSM_j5;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data = FacComputer_B.Data_om;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.aileron_command_deg.SSM = FacComputer_B.SSM_ng;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.aileron_command_deg.Data = FacComputer_B.Data_nr;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM = FacComputer_B.SSM_cs;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data = FacComputer_B.Data_nb;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.SSM = FacComputer_B.SSM_ls;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data = FacComputer_B.Data_hd;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_1.SSM = FacComputer_B.SSM_dg;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_1.Data = FacComputer_B.Data_al;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_2.SSM = FacComputer_B.SSM_d3;
  FacComputer_Y.out.data.bus_inputs.elac_1_bus.discrete_status_word_2.Data = FacComputer_B.Data_gu;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_aileron_position_deg.SSM = FacComputer_B.SSM_p2;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_aileron_position_deg.Data = FacComputer_B.Data_ix;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_aileron_position_deg.SSM = FacComputer_B.SSM_bc;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_aileron_position_deg.Data = FacComputer_B.Data_do;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_elevator_position_deg.SSM = FacComputer_B.SSM_h0;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_elevator_position_deg.Data = FacComputer_B.Data_hu;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_elevator_position_deg.SSM = FacComputer_B.SSM_giz;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_elevator_position_deg.Data = FacComputer_B.Data_pm1;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.ths_position_deg.SSM = FacComputer_B.SSM_mqp;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.ths_position_deg.Data = FacComputer_B.Data_i2y;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.SSM = FacComputer_B.SSM_ba;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.Data = FacComputer_B.Data_pg;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.SSM = FacComputer_B.SSM_in;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.Data = FacComputer_B.Data_fr;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.SSM = FacComputer_B.SSM_ff;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.Data = FacComputer_B.Data_cn;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.SSM = FacComputer_B.SSM_ic;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.Data = FacComputer_B.Data_nxl;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.SSM = FacComputer_B.SSM_fs;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data = FacComputer_B.Data_jh;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.aileron_command_deg.SSM = FacComputer_B.SSM_ja;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.aileron_command_deg.Data = FacComputer_B.Data_gl;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM = FacComputer_B.SSM_is3;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data = FacComputer_B.Data_gn;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.SSM = FacComputer_B.SSM_ag;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data = FacComputer_B.Data_myb;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_1.SSM = FacComputer_B.SSM_f5;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_1.Data = FacComputer_B.Data_l2;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_2.SSM = FacComputer_B.SSM_ph;
  FacComputer_Y.out.data.bus_inputs.elac_2_bus.discrete_status_word_2.Data = FacComputer_B.Data_o5o;
  FacComputer_Y.out.laws = FacComputer_B.laws;
  FacComputer_Y.out.logic = FacComputer_B.logic;
  FacComputer_Y.out.flight_envelope = FacComputer_B.flight_envelope;
}

void FacComputer::initialize()
{
  FacComputer_DWork.Delay1_DSTATE = FacComputer_P.Delay1_InitialCondition;
  FacComputer_DWork.Memory_PreviousInput = FacComputer_P.SRFlipFlop_initial_condition;
  FacComputer_DWork.Delay_DSTATE = FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
  FacComputer_DWork.Delay2_DSTATE = FacComputer_P.Delay2_InitialCondition;
  FacComputer_DWork.Delay_DSTATE_d = FacComputer_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  FacComputer_DWork.Delay_DSTATE_m = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition;
  FacComputer_DWork.Delay_DSTATE_k = FacComputer_P.RateLimiterDynamicEqualVariableTs_InitialCondition_a;
  FacComputer_B.dt = FacComputer_P.out_Y0.data.time.dt;
  FacComputer_B.simulation_time = FacComputer_P.out_Y0.data.time.simulation_time;
  FacComputer_B.monotonic_time = FacComputer_P.out_Y0.data.time.monotonic_time;
  FacComputer_B.slew_on = FacComputer_P.out_Y0.data.sim_data.slew_on;
  FacComputer_B.pause_on = FacComputer_P.out_Y0.data.sim_data.pause_on;
  FacComputer_B.tracking_mode_on_override = FacComputer_P.out_Y0.data.sim_data.tracking_mode_on_override;
  FacComputer_B.tailstrike_protection_on = FacComputer_P.out_Y0.data.sim_data.tailstrike_protection_on;
  FacComputer_B.computer_running = FacComputer_P.out_Y0.data.sim_data.computer_running;
  FacComputer_B.ap_own_engaged = FacComputer_P.out_Y0.data.discrete_inputs.ap_own_engaged;
  FacComputer_B.ap_opp_engaged = FacComputer_P.out_Y0.data.discrete_inputs.ap_opp_engaged;
  FacComputer_B.yaw_damper_opp_engaged = FacComputer_P.out_Y0.data.discrete_inputs.yaw_damper_opp_engaged;
  FacComputer_B.rudder_trim_opp_engaged = FacComputer_P.out_Y0.data.discrete_inputs.rudder_trim_opp_engaged;
  FacComputer_B.rudder_travel_lim_opp_engaged = FacComputer_P.out_Y0.data.discrete_inputs.rudder_travel_lim_opp_engaged;
  FacComputer_B.elac_1_healthy = FacComputer_P.out_Y0.data.discrete_inputs.elac_1_healthy;
  FacComputer_B.elac_2_healthy = FacComputer_P.out_Y0.data.discrete_inputs.elac_2_healthy;
  FacComputer_B.engine_1_stopped = FacComputer_P.out_Y0.data.discrete_inputs.engine_1_stopped;
  FacComputer_B.engine_2_stopped = FacComputer_P.out_Y0.data.discrete_inputs.engine_2_stopped;
  FacComputer_B.rudder_trim_switch_left = FacComputer_P.out_Y0.data.discrete_inputs.rudder_trim_switch_left;
  FacComputer_B.rudder_trim_switch_right = FacComputer_P.out_Y0.data.discrete_inputs.rudder_trim_switch_right;
  FacComputer_B.rudder_trim_reset_button = FacComputer_P.out_Y0.data.discrete_inputs.rudder_trim_reset_button;
  FacComputer_B.fac_engaged_from_switch = FacComputer_P.out_Y0.data.discrete_inputs.fac_engaged_from_switch;
  FacComputer_B.fac_opp_healthy = FacComputer_P.out_Y0.data.discrete_inputs.fac_opp_healthy;
  FacComputer_B.is_unit_1 = FacComputer_P.out_Y0.data.discrete_inputs.is_unit_1;
  FacComputer_B.rudder_trim_actuator_healthy = FacComputer_P.out_Y0.data.discrete_inputs.rudder_trim_actuator_healthy;
  FacComputer_B.rudder_travel_lim_actuator_healthy =
    FacComputer_P.out_Y0.data.discrete_inputs.rudder_travel_lim_actuator_healthy;
  FacComputer_B.slats_extended = FacComputer_P.out_Y0.data.discrete_inputs.slats_extended;
  FacComputer_B.nose_gear_pressed = FacComputer_P.out_Y0.data.discrete_inputs.nose_gear_pressed;
  FacComputer_B.ir_3_switch = FacComputer_P.out_Y0.data.discrete_inputs.ir_3_switch;
  FacComputer_B.adr_3_switch = FacComputer_P.out_Y0.data.discrete_inputs.adr_3_switch;
  FacComputer_B.yaw_damper_has_hyd_press = FacComputer_P.out_Y0.data.discrete_inputs.yaw_damper_has_hyd_press;
  FacComputer_B.yaw_damper_position_deg = FacComputer_P.out_Y0.data.analog_inputs.yaw_damper_position_deg;
  FacComputer_B.rudder_trim_position_deg = FacComputer_P.out_Y0.data.analog_inputs.rudder_trim_position_deg;
  FacComputer_B.rudder_travel_lim_position_deg = FacComputer_P.out_Y0.data.analog_inputs.rudder_travel_lim_position_deg;
  FacComputer_B.SSM_jz = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_1.SSM;
  FacComputer_B.Data_na = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_1.Data;
  FacComputer_B.SSM_fr = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.gamma_a_deg.SSM;
  FacComputer_B.Data_bj = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.gamma_a_deg.Data;
  FacComputer_B.SSM_axb = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.gamma_t_deg.SSM;
  FacComputer_B.Data_e3 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.gamma_t_deg.Data;
  FacComputer_B.SSM_co = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.total_weight_lbs.SSM;
  FacComputer_B.Data_as = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.total_weight_lbs.Data;
  FacComputer_B.SSM_bf = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.SSM;
  FacComputer_B.Data_p3 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.Data;
  FacComputer_B.SSM_bo0 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.sideslip_target_deg.SSM;
  FacComputer_B.Data_ni = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.sideslip_target_deg.Data;
  FacComputer_B.SSM_js = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.fac_slat_angle_deg.SSM;
  FacComputer_B.Data_l5 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.fac_slat_angle_deg.Data;
  FacComputer_B.SSM_jw = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.fac_flap_angle.SSM;
  FacComputer_B.Data_dc2 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.fac_flap_angle.Data;
  FacComputer_B.SSM_jy = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_2.SSM;
  FacComputer_B.Data_gr = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_2.Data;
  FacComputer_B.SSM_j1 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.rudder_travel_limit_command_deg.SSM;
  FacComputer_B.Data_gp = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.rudder_travel_limit_command_deg.Data;
  FacComputer_B.SSM_ov = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.delta_r_yaw_damper_deg.SSM;
  FacComputer_B.Data_i3 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.delta_r_yaw_damper_deg.Data;
  FacComputer_B.SSM_mx = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.estimated_sideslip_deg.SSM;
  FacComputer_B.Data_et = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.estimated_sideslip_deg.Data;
  FacComputer_B.SSM_b4 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_alpha_lim_kn.SSM;
  FacComputer_B.Data_mc = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_alpha_lim_kn.Data;
  FacComputer_B.SSM_gb = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_ls_kn.SSM;
  FacComputer_B.Data_k3 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_ls_kn.Data;
  FacComputer_B.SSM_oh = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_stall_kn.SSM;
  FacComputer_B.Data_f2 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_stall_kn.Data;
  FacComputer_B.SSM_mm5 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_alpha_prot_kn.SSM;
  FacComputer_B.Data_gh = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_alpha_prot_kn.Data;
  FacComputer_B.SSM_br = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_stall_warn_kn.SSM;
  FacComputer_B.Data_ed = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_stall_warn_kn.Data;
  FacComputer_B.SSM_c2 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.speed_trend_kn.SSM;
  FacComputer_B.Data_o2j = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.speed_trend_kn.Data;
  FacComputer_B.SSM_hc = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_3_kn.SSM;
  FacComputer_B.Data_i43 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_3_kn.Data;
  FacComputer_B.SSM_ktr = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_4_kn.SSM;
  FacComputer_B.Data_ic = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_4_kn.Data;
  FacComputer_B.SSM_gl = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_man_kn.SSM;
  FacComputer_B.Data_ak = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_man_kn.Data;
  FacComputer_B.SSM_my = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_max_kn.SSM;
  FacComputer_B.Data_jg = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_max_kn.Data;
  FacComputer_B.SSM_j3 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_fe_next_kn.SSM;
  FacComputer_B.Data_cu = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.v_fe_next_kn.Data;
  FacComputer_B.SSM_go = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_3.SSM;
  FacComputer_B.Data_ep = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_3.Data;
  FacComputer_B.SSM_e5c = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_4.SSM;
  FacComputer_B.Data_d3 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_4.Data;
  FacComputer_B.SSM_dk = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_5.SSM;
  FacComputer_B.Data_bt = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.discrete_word_5.Data;
  FacComputer_B.SSM_evc = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.delta_r_rudder_trim_deg.SSM;
  FacComputer_B.Data_e0 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.delta_r_rudder_trim_deg.Data;
  FacComputer_B.SSM_kk = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.rudder_trim_pos_deg.SSM;
  FacComputer_B.Data_jl3 = FacComputer_P.out_Y0.data.bus_inputs.fac_opp_bus.rudder_trim_pos_deg.Data;
  FacComputer_B.SSM_af = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.altitude_standard_ft.SSM;
  FacComputer_B.Data_nm = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.altitude_standard_ft.Data;
  FacComputer_B.SSM_npr = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.altitude_corrected_ft.SSM;
  FacComputer_B.Data_ia = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.altitude_corrected_ft.Data;
  FacComputer_B.SSM_ew = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.mach.SSM;
  FacComputer_B.Data_j0 = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.mach.Data;
  FacComputer_B.SSM_lt = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM;
  FacComputer_B.Data_bs = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.airspeed_computed_kn.Data;
  FacComputer_B.SSM_ger = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.airspeed_true_kn.SSM;
  FacComputer_B.Data_hp = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.airspeed_true_kn.Data;
  FacComputer_B.SSM = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.vertical_speed_ft_min.SSM;
  FacComputer_B.Data = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.vertical_speed_ft_min.Data;
  FacComputer_B.SSM_k = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM;
  FacComputer_B.Data_f = FacComputer_P.out_Y0.data.bus_inputs.adr_own_bus.aoa_corrected_deg.Data;
  FacComputer_B.SSM_kx = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.altitude_standard_ft.SSM;
  FacComputer_B.Data_fw = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.altitude_standard_ft.Data;
  FacComputer_B.SSM_kxx = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.altitude_corrected_ft.SSM;
  FacComputer_B.Data_fwx = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.altitude_corrected_ft.Data;
  FacComputer_B.SSM_kxxt = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.mach.SSM;
  FacComputer_B.Data_fwxk = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.mach.Data;
  FacComputer_B.SSM_kxxta = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM;
  FacComputer_B.Data_fwxkf = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.airspeed_computed_kn.Data;
  FacComputer_B.SSM_kxxtac = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.airspeed_true_kn.SSM;
  FacComputer_B.Data_fwxkft = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.airspeed_true_kn.Data;
  FacComputer_B.SSM_kxxtac0 = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.vertical_speed_ft_min.SSM;
  FacComputer_B.Data_fwxkftc = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.vertical_speed_ft_min.Data;
  FacComputer_B.SSM_kxxtac0z = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM;
  FacComputer_B.Data_fwxkftc3 = FacComputer_P.out_Y0.data.bus_inputs.adr_opp_bus.aoa_corrected_deg.Data;
  FacComputer_B.SSM_kxxtac0zt = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
  FacComputer_B.Data_fwxkftc3e = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
  FacComputer_B.SSM_kxxtac0ztg = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.SSM;
  FacComputer_B.Data_fwxkftc3ep = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.altitude_corrected_ft.Data;
  FacComputer_B.SSM_kxxtac0ztgf = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.mach.SSM;
  FacComputer_B.Data_fwxkftc3epg = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.mach.Data;
  FacComputer_B.SSM_kxxtac0ztgf2 = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
  FacComputer_B.Data_fwxkftc3epgt = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
  FacComputer_B.SSM_kxxtac0ztgf2u = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
  FacComputer_B.Data_fwxkftc3epgtd = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
  FacComputer_B.SSM_kxxtac0ztgf2ux = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
  FacComputer_B.Data_fwxkftc3epgtdx = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
  FacComputer_B.SSM_kxxtac0ztgf2uxn = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
  FacComputer_B.Data_fwxkftc3epgtdxc = FacComputer_P.out_Y0.data.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
  FacComputer_B.SSM_ky = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.discrete_word_1.SSM;
  FacComputer_B.Data_h = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.discrete_word_1.Data;
  FacComputer_B.SSM_d = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.latitude_deg.SSM;
  FacComputer_B.Data_e = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.latitude_deg.Data;
  FacComputer_B.SSM_h = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.longitude_deg.SSM;
  FacComputer_B.Data_j = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.longitude_deg.Data;
  FacComputer_B.SSM_kb = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.ground_speed_kn.SSM;
  FacComputer_B.Data_d = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.ground_speed_kn.Data;
  FacComputer_B.SSM_p = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.track_angle_true_deg.SSM;
  FacComputer_B.Data_p = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.track_angle_true_deg.Data;
  FacComputer_B.SSM_di = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.heading_true_deg.SSM;
  FacComputer_B.Data_i = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.heading_true_deg.Data;
  FacComputer_B.SSM_j = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.wind_speed_kn.SSM;
  FacComputer_B.Data_g = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.wind_speed_kn.Data;
  FacComputer_B.SSM_i = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.wind_direction_true_deg.SSM;
  FacComputer_B.Data_a = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.wind_direction_true_deg.Data;
  FacComputer_B.SSM_g = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.track_angle_magnetic_deg.SSM;
  FacComputer_B.Data_eb = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.track_angle_magnetic_deg.Data;
  FacComputer_B.SSM_db = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.heading_magnetic_deg.SSM;
  FacComputer_B.Data_jo = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.heading_magnetic_deg.Data;
  FacComputer_B.SSM_n = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.drift_angle_deg.SSM;
  FacComputer_B.Data_ex = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.drift_angle_deg.Data;
  FacComputer_B.SSM_a = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.flight_path_angle_deg.SSM;
  FacComputer_B.Data_fd = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.flight_path_angle_deg.Data;
  FacComputer_B.SSM_ir = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.flight_path_accel_g.SSM;
  FacComputer_B.Data_ja = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.flight_path_accel_g.Data;
  FacComputer_B.SSM_hu = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.pitch_angle_deg.SSM;
  FacComputer_B.Data_k = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.pitch_angle_deg.Data;
  FacComputer_B.SSM_e = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.roll_angle_deg.SSM;
  FacComputer_B.Data_joy = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.roll_angle_deg.Data;
  FacComputer_B.SSM_gr = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.SSM;
  FacComputer_B.Data_h3 = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.Data;
  FacComputer_B.SSM_ev = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_roll_rate_deg_s.SSM;
  FacComputer_B.Data_a0 = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_roll_rate_deg_s.Data;
  FacComputer_B.SSM_l = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM;
  FacComputer_B.Data_b = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.Data;
  FacComputer_B.SSM_ei = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_long_accel_g.SSM;
  FacComputer_B.Data_eq = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_long_accel_g.Data;
  FacComputer_B.SSM_an = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_lat_accel_g.SSM;
  FacComputer_B.Data_iz = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_lat_accel_g.Data;
  FacComputer_B.SSM_c = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_normal_accel_g.SSM;
  FacComputer_B.Data_j2 = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.body_normal_accel_g.Data;
  FacComputer_B.SSM_cb = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.track_angle_rate_deg_s.SSM;
  FacComputer_B.Data_o = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.track_angle_rate_deg_s.Data;
  FacComputer_B.SSM_lb = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.SSM;
  FacComputer_B.Data_m = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.Data;
  FacComputer_B.SSM_ia = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.roll_att_rate_deg_s.SSM;
  FacComputer_B.Data_oq = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.roll_att_rate_deg_s.Data;
  FacComputer_B.SSM_kyz = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.inertial_alt_ft.SSM;
  FacComputer_B.Data_fo = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.inertial_alt_ft.Data;
  FacComputer_B.SSM_as = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.along_track_horiz_acc_g.SSM;
  FacComputer_B.Data_p1 = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.along_track_horiz_acc_g.Data;
  FacComputer_B.SSM_is = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.cross_track_horiz_acc_g.SSM;
  FacComputer_B.Data_p1y = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.cross_track_horiz_acc_g.Data;
  FacComputer_B.SSM_ca = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.vertical_accel_g.SSM;
  FacComputer_B.Data_l = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.vertical_accel_g.Data;
  FacComputer_B.SSM_o = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.SSM;
  FacComputer_B.Data_kp = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.Data;
  FacComputer_B.SSM_ak = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.north_south_velocity_kn.SSM;
  FacComputer_B.Data_k0 = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.north_south_velocity_kn.Data;
  FacComputer_B.SSM_cbj = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.east_west_velocity_kn.SSM;
  FacComputer_B.Data_pi = FacComputer_P.out_Y0.data.bus_inputs.ir_own_bus.east_west_velocity_kn.Data;
  FacComputer_B.SSM_cu = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.discrete_word_1.SSM;
  FacComputer_B.Data_dm = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.discrete_word_1.Data;
  FacComputer_B.SSM_nn = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.latitude_deg.SSM;
  FacComputer_B.Data_f5 = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.latitude_deg.Data;
  FacComputer_B.SSM_b = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.longitude_deg.SSM;
  FacComputer_B.Data_js = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.longitude_deg.Data;
  FacComputer_B.SSM_m = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.ground_speed_kn.SSM;
  FacComputer_B.Data_ee = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.ground_speed_kn.Data;
  FacComputer_B.SSM_f = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.track_angle_true_deg.SSM;
  FacComputer_B.Data_ig = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.track_angle_true_deg.Data;
  FacComputer_B.SSM_bp = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.heading_true_deg.SSM;
  FacComputer_B.Data_mk = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.heading_true_deg.Data;
  FacComputer_B.SSM_hb = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.wind_speed_kn.SSM;
  FacComputer_B.Data_pu = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.wind_speed_kn.Data;
  FacComputer_B.SSM_gz = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.wind_direction_true_deg.SSM;
  FacComputer_B.Data_ly = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.wind_direction_true_deg.Data;
  FacComputer_B.SSM_pv = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.track_angle_magnetic_deg.SSM;
  FacComputer_B.Data_jq = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.track_angle_magnetic_deg.Data;
  FacComputer_B.SSM_mf = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.heading_magnetic_deg.SSM;
  FacComputer_B.Data_o5 = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.heading_magnetic_deg.Data;
  FacComputer_B.SSM_m0 = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.drift_angle_deg.SSM;
  FacComputer_B.Data_lyw = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.drift_angle_deg.Data;
  FacComputer_B.SSM_kd = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.flight_path_angle_deg.SSM;
  FacComputer_B.Data_gq = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.flight_path_angle_deg.Data;
  FacComputer_B.SSM_pu = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.flight_path_accel_g.SSM;
  FacComputer_B.Data_n = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.flight_path_accel_g.Data;
  FacComputer_B.SSM_nv = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.pitch_angle_deg.SSM;
  FacComputer_B.Data_bq = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.pitch_angle_deg.Data;
  FacComputer_B.SSM_d5 = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.roll_angle_deg.SSM;
  FacComputer_B.Data_dmn = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.roll_angle_deg.Data;
  FacComputer_B.SSM_eo = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_pitch_rate_deg_s.SSM;
  FacComputer_B.Data_jn = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_pitch_rate_deg_s.Data;
  FacComputer_B.SSM_nd = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_roll_rate_deg_s.SSM;
  FacComputer_B.Data_c = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_roll_rate_deg_s.Data;
  FacComputer_B.SSM_bq = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.SSM;
  FacComputer_B.Data_lx = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.Data;
  FacComputer_B.SSM_hi = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_long_accel_g.SSM;
  FacComputer_B.Data_jb = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_long_accel_g.Data;
  FacComputer_B.SSM_mm = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_lat_accel_g.SSM;
  FacComputer_B.Data_fn = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_lat_accel_g.Data;
  FacComputer_B.SSM_kz = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_normal_accel_g.SSM;
  FacComputer_B.Data_od = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.body_normal_accel_g.Data;
  FacComputer_B.SSM_il = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.track_angle_rate_deg_s.SSM;
  FacComputer_B.Data_ez = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.track_angle_rate_deg_s.Data;
  FacComputer_B.SSM_i2 = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.pitch_att_rate_deg_s.SSM;
  FacComputer_B.Data_pw = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.pitch_att_rate_deg_s.Data;
  FacComputer_B.SSM_ah = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.roll_att_rate_deg_s.SSM;
  FacComputer_B.Data_m2 = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.roll_att_rate_deg_s.Data;
  FacComputer_B.SSM_en = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.inertial_alt_ft.SSM;
  FacComputer_B.Data_ek = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.inertial_alt_ft.Data;
  FacComputer_B.SSM_dq = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.along_track_horiz_acc_g.SSM;
  FacComputer_B.Data_iy = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.along_track_horiz_acc_g.Data;
  FacComputer_B.SSM_px = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.cross_track_horiz_acc_g.SSM;
  FacComputer_B.Data_lk = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.cross_track_horiz_acc_g.Data;
  FacComputer_B.SSM_lbo = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.vertical_accel_g.SSM;
  FacComputer_B.Data_ca = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.vertical_accel_g.Data;
  FacComputer_B.SSM_p5 = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.inertial_vertical_speed_ft_s.SSM;
  FacComputer_B.Data_pix = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.inertial_vertical_speed_ft_s.Data;
  FacComputer_B.SSM_mk = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.north_south_velocity_kn.SSM;
  FacComputer_B.Data_di = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.north_south_velocity_kn.Data;
  FacComputer_B.SSM_mu = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.east_west_velocity_kn.SSM;
  FacComputer_B.Data_lz = FacComputer_P.out_Y0.data.bus_inputs.ir_opp_bus.east_west_velocity_kn.Data;
  FacComputer_B.SSM_cbl = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.SSM;
  FacComputer_B.Data_lu = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.discrete_word_1.Data;
  FacComputer_B.SSM_gzd = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.SSM;
  FacComputer_B.Data_dc = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.latitude_deg.Data;
  FacComputer_B.SSM_mo = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.SSM;
  FacComputer_B.Data_gc = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.longitude_deg.Data;
  FacComputer_B.SSM_me = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
  FacComputer_B.Data_am = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.ground_speed_kn.Data;
  FacComputer_B.SSM_mj = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
  FacComputer_B.Data_mo = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
  FacComputer_B.SSM_a5 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.SSM;
  FacComputer_B.Data_dg = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_true_deg.Data;
  FacComputer_B.SSM_bt = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.SSM;
  FacComputer_B.Data_e1 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_speed_kn.Data;
  FacComputer_B.SSM_om = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.SSM;
  FacComputer_B.Data_fp = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.wind_direction_true_deg.Data;
  FacComputer_B.SSM_ar = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
  FacComputer_B.Data_ns = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
  FacComputer_B.SSM_ce = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
  FacComputer_B.Data_m3 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
  FacComputer_B.SSM_ed = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.SSM;
  FacComputer_B.Data_oj = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.drift_angle_deg.Data;
  FacComputer_B.SSM_jh = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
  FacComputer_B.Data_jy = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
  FacComputer_B.SSM_je = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.SSM;
  FacComputer_B.Data_j1 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.flight_path_accel_g.Data;
  FacComputer_B.SSM_jt = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
  FacComputer_B.Data_fc = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
  FacComputer_B.SSM_cui = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
  FacComputer_B.Data_of = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_angle_deg.Data;
  FacComputer_B.SSM_mq = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.SSM;
  FacComputer_B.Data_lg = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
  FacComputer_B.SSM_ni = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
  FacComputer_B.Data_n4 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
  FacComputer_B.SSM_df = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
  FacComputer_B.Data_ot = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
  FacComputer_B.SSM_oe = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
  FacComputer_B.Data_gv = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_long_accel_g.Data;
  FacComputer_B.SSM_ha = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
  FacComputer_B.Data_ou = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
  FacComputer_B.SSM_op = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
  FacComputer_B.Data_dh = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
  FacComputer_B.SSM_a50 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.SSM;
  FacComputer_B.Data_ph = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.track_angle_rate_deg_s.Data;
  FacComputer_B.SSM_og = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
  FacComputer_B.Data_gs = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
  FacComputer_B.SSM_a4 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM;
  FacComputer_B.Data_fd4 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
  FacComputer_B.SSM_bv = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.SSM;
  FacComputer_B.Data_hm = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_alt_ft.Data;
  FacComputer_B.SSM_bo = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.SSM;
  FacComputer_B.Data_i2 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.along_track_horiz_acc_g.Data;
  FacComputer_B.SSM_d1 = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.SSM;
  FacComputer_B.Data_og = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.cross_track_horiz_acc_g.Data;
  FacComputer_B.SSM_hy = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.SSM;
  FacComputer_B.Data_fv = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.vertical_accel_g.Data;
  FacComputer_B.SSM_gi = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
  FacComputer_B.Data_oc = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
  FacComputer_B.SSM_pp = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.SSM;
  FacComputer_B.Data_kq = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.north_south_velocity_kn.Data;
  FacComputer_B.SSM_iab = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.SSM;
  FacComputer_B.Data_ne = FacComputer_P.out_Y0.data.bus_inputs.ir_3_bus.east_west_velocity_kn.Data;
  FacComputer_B.SSM_jtv = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fac_weight_lbs.SSM;
  FacComputer_B.Data_it = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fac_weight_lbs.Data;
  FacComputer_B.SSM_fy = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fm_weight_lbs.SSM;
  FacComputer_B.Data_ch = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fm_weight_lbs.Data;
  FacComputer_B.SSM_d4 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fac_cg_percent.SSM;
  FacComputer_B.Data_bb = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fac_cg_percent.Data;
  FacComputer_B.SSM_ars = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fm_cg_percent.SSM;
  FacComputer_B.Data_ol = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fm_cg_percent.Data;
  FacComputer_B.SSM_din = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fg_radio_height_ft.SSM;
  FacComputer_B.Data_hw = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.fg_radio_height_ft.Data;
  FacComputer_B.SSM_m3 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_4.SSM;
  FacComputer_B.Data_hs = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_4.Data;
  FacComputer_B.SSM_np = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.ats_discrete_word.SSM;
  FacComputer_B.Data_fj = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.ats_discrete_word.Data;
  FacComputer_B.SSM_ax = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_3.SSM;
  FacComputer_B.Data_ky = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_3.Data;
  FacComputer_B.SSM_cl = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_1.SSM;
  FacComputer_B.Data_h5 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_1.Data;
  FacComputer_B.SSM_es = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_2.SSM;
  FacComputer_B.Data_ku = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.discrete_word_2.Data;
  FacComputer_B.SSM_gi1 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.approach_spd_target_kn.SSM;
  FacComputer_B.Data_jp = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.approach_spd_target_kn.Data;
  FacComputer_B.SSM_kt = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_p_ail_cmd_deg.SSM;
  FacComputer_B.Data_nu = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_p_ail_cmd_deg.Data;
  FacComputer_B.SSM_ds = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_p_splr_cmd_deg.SSM;
  FacComputer_B.Data_br = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_p_splr_cmd_deg.Data;
  FacComputer_B.SSM_eg = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_r_cmd_deg.SSM;
  FacComputer_B.Data_ae = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_r_cmd_deg.Data;
  FacComputer_B.SSM_a0 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_nose_wheel_cmd_deg.SSM;
  FacComputer_B.Data_pe = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_nose_wheel_cmd_deg.Data;
  FacComputer_B.SSM_cv = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_q_cmd_deg.SSM;
  FacComputer_B.Data_fy = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.delta_q_cmd_deg.Data;
  FacComputer_B.SSM_ea = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.n1_left_percent.SSM;
  FacComputer_B.Data_my = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.n1_left_percent.Data;
  FacComputer_B.SSM_p4 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.n1_right_percent.SSM;
  FacComputer_B.Data_i4 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_own_bus.n1_right_percent.Data;
  FacComputer_B.SSM_m2 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fac_weight_lbs.SSM;
  FacComputer_B.Data_cx = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fac_weight_lbs.Data;
  FacComputer_B.SSM_bt0 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fm_weight_lbs.SSM;
  FacComputer_B.Data_nz = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fm_weight_lbs.Data;
  FacComputer_B.SSM_nr = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fac_cg_percent.SSM;
  FacComputer_B.Data_id = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fac_cg_percent.Data;
  FacComputer_B.SSM_cc = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fm_cg_percent.SSM;
  FacComputer_B.Data_o2 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fm_cg_percent.Data;
  FacComputer_B.SSM_lm = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fg_radio_height_ft.SSM;
  FacComputer_B.Data_gqq = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.fg_radio_height_ft.Data;
  FacComputer_B.SSM_mkm = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_4.SSM;
  FacComputer_B.Data_md = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_4.Data;
  FacComputer_B.SSM_jhd = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.ats_discrete_word.SSM;
  FacComputer_B.Data_cz = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.ats_discrete_word.Data;
  FacComputer_B.SSM_av = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_3.SSM;
  FacComputer_B.Data_pm = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_3.Data;
  FacComputer_B.SSM_ira = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_1.SSM;
  FacComputer_B.Data_ox = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_1.Data;
  FacComputer_B.SSM_ge = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_2.SSM;
  FacComputer_B.Data_pe5 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.discrete_word_2.Data;
  FacComputer_B.SSM_lv = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.approach_spd_target_kn.SSM;
  FacComputer_B.Data_jj = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.approach_spd_target_kn.Data;
  FacComputer_B.SSM_cg = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_p_ail_cmd_deg.SSM;
  FacComputer_B.Data_p5 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_p_ail_cmd_deg.Data;
  FacComputer_B.SSM_be = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_p_splr_cmd_deg.SSM;
  FacComputer_B.Data_ekl = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_p_splr_cmd_deg.Data;
  FacComputer_B.SSM_nz = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_r_cmd_deg.SSM;
  FacComputer_B.Data_nd = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_r_cmd_deg.Data;
  FacComputer_B.SSM_cx = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_nose_wheel_cmd_deg.SSM;
  FacComputer_B.Data_n2 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_nose_wheel_cmd_deg.Data;
  FacComputer_B.SSM_gh = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_q_cmd_deg.SSM;
  FacComputer_B.Data_dl = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.delta_q_cmd_deg.Data;
  FacComputer_B.SSM_ks = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.n1_left_percent.SSM;
  FacComputer_B.Data_gs2 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.n1_left_percent.Data;
  FacComputer_B.SSM_pw = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.n1_right_percent.SSM;
  FacComputer_B.Data_h4 = FacComputer_P.out_Y0.data.bus_inputs.fmgc_opp_bus.n1_right_percent.Data;
  FacComputer_B.SSM_fh = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_flap_component_status_word.SSM;
  FacComputer_B.Data_f5h = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_flap_component_status_word.Data;
  FacComputer_B.SSM_gzn = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_flap_system_status_word.SSM;
  FacComputer_B.Data_an = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_flap_system_status_word.Data;
  FacComputer_B.SSM_oo = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word.SSM;
  FacComputer_B.Data_i4o = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word.Data;
  FacComputer_B.SSM_evh = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_actual_position_deg.SSM;
  FacComputer_B.Data_af = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.slat_actual_position_deg.Data;
  FacComputer_B.SSM_cn = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.flap_actual_position_deg.SSM;
  FacComputer_B.Data_bm = FacComputer_P.out_Y0.data.bus_inputs.sfcc_own_bus.flap_actual_position_deg.Data;
  FacComputer_B.SSM_pe = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_1.SSM;
  FacComputer_B.Data_dk = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_1.Data;
  FacComputer_B.SSM_cgz = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_2.SSM;
  FacComputer_B.Data_nv = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_2.Data;
  FacComputer_B.SSM_fw = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_3.SSM;
  FacComputer_B.Data_jpf = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_3.Data;
  FacComputer_B.SSM_h4 = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_4.SSM;
  FacComputer_B.Data_i5 = FacComputer_P.out_Y0.data.bus_inputs.lgciu_own_bus.discrete_word_4.Data;
  FacComputer_B.SSM_cb3 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_aileron_position_deg.SSM;
  FacComputer_B.Data_k2 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_aileron_position_deg.Data;
  FacComputer_B.SSM_pj = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_aileron_position_deg.SSM;
  FacComputer_B.Data_gk = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_aileron_position_deg.Data;
  FacComputer_B.SSM_dv = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_elevator_position_deg.SSM;
  FacComputer_B.Data_jl = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_elevator_position_deg.Data;
  FacComputer_B.SSM_i4 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_elevator_position_deg.SSM;
  FacComputer_B.Data_e32 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_elevator_position_deg.Data;
  FacComputer_B.SSM_fm = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.ths_position_deg.SSM;
  FacComputer_B.Data_ih = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.ths_position_deg.Data;
  FacComputer_B.SSM_e5 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.SSM;
  FacComputer_B.Data_du = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_pitch_command_deg.Data;
  FacComputer_B.SSM_fd = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.SSM;
  FacComputer_B.Data_nx = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_pitch_command_deg.Data;
  FacComputer_B.SSM_fv = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.SSM;
  FacComputer_B.Data_n0 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.left_sidestick_roll_command_deg.Data;
  FacComputer_B.SSM_dt = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.SSM;
  FacComputer_B.Data_eqi = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.right_sidestick_roll_command_deg.Data;
  FacComputer_B.SSM_j5 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.SSM;
  FacComputer_B.Data_om = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.rudder_pedal_position_deg.Data;
  FacComputer_B.SSM_ng = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.aileron_command_deg.SSM;
  FacComputer_B.Data_nr = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.aileron_command_deg.Data;
  FacComputer_B.SSM_cs = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM;
  FacComputer_B.Data_nb = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data;
  FacComputer_B.SSM_ls = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.SSM;
  FacComputer_B.Data_hd = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
  FacComputer_B.SSM_dg = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_1.SSM;
  FacComputer_B.Data_al = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_1.Data;
  FacComputer_B.SSM_d3 = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_2.SSM;
  FacComputer_B.Data_gu = FacComputer_P.out_Y0.data.bus_inputs.elac_1_bus.discrete_status_word_2.Data;
  FacComputer_B.SSM_p2 = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_aileron_position_deg.SSM;
  FacComputer_B.Data_ix = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_aileron_position_deg.Data;
  FacComputer_B.SSM_bc = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_aileron_position_deg.SSM;
  FacComputer_B.Data_do = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_aileron_position_deg.Data;
  FacComputer_B.SSM_h0 = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_elevator_position_deg.SSM;
  FacComputer_B.Data_hu = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_elevator_position_deg.Data;
  FacComputer_B.SSM_giz = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_elevator_position_deg.SSM;
  FacComputer_B.Data_pm1 = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_elevator_position_deg.Data;
  FacComputer_B.SSM_mqp = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.ths_position_deg.SSM;
  FacComputer_B.Data_i2y = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.ths_position_deg.Data;
  FacComputer_B.SSM_ba = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.SSM;
  FacComputer_B.Data_pg = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_pitch_command_deg.Data;
  FacComputer_B.SSM_in = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.SSM;
  FacComputer_B.Data_fr = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_pitch_command_deg.Data;
  FacComputer_B.SSM_ff = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.SSM;
  FacComputer_B.Data_cn = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.left_sidestick_roll_command_deg.Data;
  FacComputer_B.SSM_ic = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.SSM;
  FacComputer_B.Data_nxl = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.right_sidestick_roll_command_deg.Data;
  FacComputer_B.SSM_fs = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.SSM;
  FacComputer_B.Data_jh = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.rudder_pedal_position_deg.Data;
  FacComputer_B.SSM_ja = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.aileron_command_deg.SSM;
  FacComputer_B.Data_gl = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.aileron_command_deg.Data;
  FacComputer_B.SSM_is3 = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM;
  FacComputer_B.Data_gn = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data;
  FacComputer_B.SSM_ag = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.SSM;
  FacComputer_B.Data_myb = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data;
  FacComputer_B.SSM_f5 = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_1.SSM;
  FacComputer_B.Data_l2 = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_1.Data;
  FacComputer_B.SSM_ph = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_2.SSM;
  FacComputer_B.Data_o5o = FacComputer_P.out_Y0.data.bus_inputs.elac_2_bus.discrete_status_word_2.Data;
  FacComputer_B.laws = FacComputer_P.out_Y0.laws;
  FacComputer_B.logic = FacComputer_P.out_Y0.logic;
  FacComputer_B.flight_envelope = FacComputer_P.out_Y0.flight_envelope;
  FacComputer_Y.out.discrete_outputs = FacComputer_P.out_Y0.discrete_outputs;
  FacComputer_Y.out.analog_outputs = FacComputer_P.out_Y0.analog_outputs;
  FacComputer_Y.out.bus_outputs = FacComputer_P.out_Y0.bus_outputs;
}

void FacComputer::terminate()
{
}

FacComputer::FacComputer():
  FacComputer_U(),
  FacComputer_Y(),
  FacComputer_B(),
  FacComputer_DWork()
{
}

FacComputer::~FacComputer()
{
}
