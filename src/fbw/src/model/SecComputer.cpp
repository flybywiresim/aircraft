#include "SecComputer.h"
#include "SecComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"
#include "LateralDirectLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

const uint8_T SecComputer_IN_InAir{ 1U };

const uint8_T SecComputer_IN_OnGround{ 2U };

const real_T SecComputer_RGND{ 0.0 };

void SecComputer::SecComputer_MATLABFunction(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void SecComputer::SecComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
  real_T *rty_Y, rtDW_RateLimiter_SecComputer_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void SecComputer::SecComputer_MATLABFunction_l(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void SecComputer::SecComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_SecComputer_g_T *localDW)
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

void SecComputer::SecComputer_MATLABFunction_e(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_SecComputer_l_T *localDW)
{
  boolean_T rtu_isRisingEdge_0;
  if (!localDW->output_not_empty) {
    localDW->output = rtu_u;
    localDW->output_not_empty = true;
  }

  if (!localDW->previousInput_not_empty) {
    localDW->previousInput = rtu_isRisingEdge;
    localDW->previousInput_not_empty = true;
  }

  if (rtu_isRisingEdge) {
    rtu_isRisingEdge_0 = (rtu_u && (!localDW->previousInput));
  } else {
    rtu_isRisingEdge_0 = ((!rtu_u) && localDW->previousInput);
  }

  localDW->output = ((!localDW->output) && rtu_isRisingEdge_0);
  localDW->previousInput = rtu_u;
  *rty_y = localDW->output;
}

void SecComputer::SecComputer_MATLABFunction_cw(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void SecComputer::step()
{
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_deg;
  real_T pair1RollCommand;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn;
  real_T rtb_DataTypeConversion5_tmp_tmp;
  real_T rtb_Y;
  real_T rtb_Y_cb;
  real_T rtb_Y_d_tmp_tmp;
  real_T rtb_Y_e;
  real_T rtb_Y_o;
  real_T rtb_eta_deg_dv;
  real_T rtb_eta_trim_deg_a;
  real_T rtb_logic_crg14_ir_computation_data_n_z_g_tmp_tmp;
  real_T rtb_logic_crg14_ir_computation_data_theta_dot_deg_s_tmp_tmp;
  real_T rtb_logic_crg1_total_sidestick_pitch_command;
  real_T rtb_logic_crg1_total_sidestick_roll_command;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_mach;
  real32_T rtb_y_f;
  uint32_T rtb_DataTypeConversion1;
  uint32_T rtb_Switch7;
  uint32_T rtb_Switch9;
  uint32_T rtb_y;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T abnormalCondition;
  boolean_T canEngageInPitch;
  boolean_T hasPriorityInPitch;
  boolean_T leftElevatorAvail;
  boolean_T rightElevatorAvail;
  boolean_T rtb_AND1_h;
  boolean_T rtb_AND1_p;
  boolean_T rtb_AND4_a;
  boolean_T rtb_NOT_bl;
  boolean_T rtb_OR;
  boolean_T rtb_OR1;
  boolean_T rtb_OR14;
  boolean_T rtb_OR16;
  boolean_T rtb_OR3;
  boolean_T rtb_OR6;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_isEngagedInPitch;
  boolean_T rtb_isEngagedInRoll;
  boolean_T rtb_logic_crg14_is_green_hydraulic_power_avail;
  boolean_T rtb_logic_crg14_is_yellow_hydraulic_power_avail;
  boolean_T rtb_logic_crg_alpha_disagree;
  boolean_T rtb_singleIrFault;
  boolean_T rtb_y_b;
  boolean_T spoilerPair1SupplyAvail;
  boolean_T spoilerPair2Active;
  boolean_T spoiler_pair_2_avail;
  pitch_efcs_law rtb_activePitchLaw;
  pitch_efcs_law rtb_pitchLawCapability;
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel4_bit,
    &rtb_Switch7);
  rtb_AND4_a = (rtb_Switch7 != 0U);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel6_bit,
    &rtb_Switch7);
  rtb_OR16 = (rtb_AND4_a || (rtb_Switch7 != 0U));
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel5_bit,
    &rtb_Switch7);
  rtb_AND1_h = (rtb_Switch7 != 0U);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel7_bit,
    &rtb_Switch7);
  rtb_AND4_a = (rtb_Switch7 != 0U);
  rtb_OR14 = (rtb_AND1_h || (rtb_Switch7 != 0U));
  if (SecComputer_DWork.is_active_c8_SecComputer == 0U) {
    SecComputer_DWork.is_active_c8_SecComputer = 1U;
    SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
    rtb_OR16 = true;
  } else if (SecComputer_DWork.is_c8_SecComputer == SecComputer_IN_InAir) {
    if ((static_cast<real_T>(rtb_OR16) > 0.1) || (static_cast<real_T>(rtb_OR14) > 0.1)) {
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
      rtb_OR16 = true;
    } else {
      rtb_OR16 = false;
    }
  } else if ((!rtb_OR16) && (!rtb_OR14)) {
    SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_InAir;
    rtb_OR16 = false;
  } else {
    rtb_OR16 = true;
  }

  rtb_AND1_h = (SecComputer_U.in.sim_data.slew_on || SecComputer_U.in.sim_data.pause_on ||
                SecComputer_U.in.sim_data.tracking_mode_on_override);
  SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn, &rtb_NOT_bl);
  SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn, &rtb_y_b);
  SecComputer_MATLABFunction_c(rtb_NOT_bl && rtb_y_b && (std::abs
    (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data -
     SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) > SecComputer_P.CompareToConstant_const_n),
    SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge, SecComputer_P.ConfirmNode_timeDelay, &rtb_NOT_bl,
    &SecComputer_DWork.sf_MATLABFunction_gs);
  SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_1_bus.mach, &rtb_AND4_a);
  SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_2_bus.mach, &rtb_y_b);
  SecComputer_MATLABFunction_c(rtb_AND4_a && rtb_y_b && (std::abs(SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data -
    SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data) > SecComputer_P.CompareToConstant1_const_d),
    SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode1_isRisingEdge, SecComputer_P.ConfirmNode1_timeDelay, &rtb_y_b,
    &SecComputer_DWork.sf_MATLABFunction_eg);
  rtb_AND4_a = (rtb_NOT_bl || rtb_y_b);
  SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg, &rtb_NOT_bl);
  SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg, &rtb_y_b);
  SecComputer_MATLABFunction_c(rtb_NOT_bl && rtb_y_b && (std::abs
    (SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data -
     SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) > SecComputer_P.CompareToConstant_const_k),
    SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_f, SecComputer_P.ConfirmNode_timeDelay_l, &rtb_y_b,
    &SecComputer_DWork.sf_MATLABFunction_c);
  rtb_OR1 = ((SecComputer_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::FailureWarning))
             || (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || rtb_AND4_a || rtb_y_b);
  rtb_OR3 = ((SecComputer_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::FailureWarning))
             || (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || rtb_AND4_a || rtb_y_b);
  rtb_OR14 = (rtb_OR1 || rtb_OR3);
  rtb_doubleAdrFault = (rtb_OR1 && rtb_OR3);
  rtb_OR = ((SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
              FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM == static_cast<uint32_T>
             (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM ==
             static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
            (SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM == static_cast<uint32_T>(SignStatusMatrix::
              FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM == static_cast<uint32_T>
             (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM ==
             static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
            (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM == static_cast<uint32_T>(SignStatusMatrix::
              FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM == static_cast<uint32_T>
             (SignStatusMatrix::FailureWarning)) || SecComputer_P.Constant_Value_f);
  rtb_OR6 = ((SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM == static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM == static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM == static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning)) || SecComputer_P.Constant_Value_f);
  rtb_singleIrFault = (rtb_OR || rtb_OR6);
  rtb_OR = (rtb_OR && rtb_OR6);
  rtb_NOT_bl = !rtb_OR1;
  rtb_OR6 = !rtb_OR3;
  if (rtb_NOT_bl && rtb_OR6) {
    rtb_V_ias = (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                 SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
    rtb_V_tas = (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                 SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
    rtb_mach = (SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data + SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data) /
      2.0F;
    rtb_alpha = (SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                 SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
  } else if (rtb_NOT_bl && rtb_OR3) {
    rtb_V_ias = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
    rtb_V_tas = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
    rtb_mach = SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
    rtb_alpha = SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
  } else if (rtb_OR1 && rtb_OR6) {
    rtb_V_ias = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
    rtb_V_tas = SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
    rtb_mach = SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
    rtb_alpha = SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
  } else {
    rtb_V_ias = 0.0F;
    rtb_V_tas = 0.0F;
    rtb_mach = 0.0F;
    rtb_alpha = 0.0F;
  }

  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn = rtb_V_tas;
  rtb_Y_d_tmp_tmp = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  rtb_DataTypeConversion5_tmp_tmp = SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  rtb_OR1 = rtb_AND4_a;
  rtb_OR3 = rtb_AND1_h;
  SecComputer_MATLABFunction_c(!SecComputer_U.in.discrete_inputs.yellow_low_pressure, SecComputer_U.in.time.dt,
    SecComputer_P.ConfirmNode_isRisingEdge_a, SecComputer_P.ConfirmNode_timeDelay_c, &rtb_AND4_a,
    &SecComputer_DWork.sf_MATLABFunction_ndv);
  SecComputer_MATLABFunction_c(!SecComputer_U.in.discrete_inputs.blue_low_pressure, SecComputer_U.in.time.dt,
    SecComputer_P.ConfirmNode1_isRisingEdge_j, SecComputer_P.ConfirmNode1_timeDelay_k, &rtb_AND1_h,
    &SecComputer_DWork.sf_MATLABFunction_gf);
  SecComputer_MATLABFunction_c(!SecComputer_U.in.discrete_inputs.green_low_pressure, SecComputer_U.in.time.dt,
    SecComputer_P.ConfirmNode2_isRisingEdge, SecComputer_P.ConfirmNode2_timeDelay, &rtb_NOT_bl,
    &SecComputer_DWork.sf_MATLABFunction_h);
  rtb_OR6 = rtb_AND1_h;
  rtb_logic_crg14_is_green_hydraulic_power_avail = rtb_NOT_bl;
  SecComputer_MATLABFunction_e(SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
    SecComputer_P.PulseNode_isRisingEdge, &rtb_AND1_h, &SecComputer_DWork.sf_MATLABFunction_g4);
  SecComputer_MATLABFunction_e(SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
    SecComputer_P.PulseNode1_isRisingEdge, &rtb_NOT_bl, &SecComputer_DWork.sf_MATLABFunction_nu);
  if (rtb_AND1_h) {
    SecComputer_DWork.pRightStickDisabled = true;
    SecComputer_DWork.pLeftStickDisabled = false;
  } else if (rtb_NOT_bl) {
    SecComputer_DWork.pLeftStickDisabled = true;
    SecComputer_DWork.pRightStickDisabled = false;
  }

  if (SecComputer_DWork.pRightStickDisabled && ((!SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed) &&
       (!SecComputer_DWork.Delay1_DSTATE))) {
    SecComputer_DWork.pRightStickDisabled = false;
  } else if (SecComputer_DWork.pLeftStickDisabled) {
    SecComputer_DWork.pLeftStickDisabled = (SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed ||
      SecComputer_DWork.Delay_DSTATE);
  }

  SecComputer_MATLABFunction_c(SecComputer_DWork.pLeftStickDisabled &&
    (SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || SecComputer_DWork.Delay_DSTATE),
    SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode1_isRisingEdge_k, SecComputer_P.ConfirmNode1_timeDelay_a,
    &SecComputer_DWork.Delay_DSTATE, &SecComputer_DWork.sf_MATLABFunction_j2);
  SecComputer_MATLABFunction_c(SecComputer_DWork.pRightStickDisabled &&
    (SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || SecComputer_DWork.Delay1_DSTATE),
    SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_j, SecComputer_P.ConfirmNode_timeDelay_a,
    &SecComputer_DWork.Delay1_DSTATE, &SecComputer_DWork.sf_MATLABFunction_g2);
  if (!SecComputer_DWork.pRightStickDisabled) {
    rtb_Y_o = SecComputer_U.in.analog_inputs.fo_pitch_stick_pos;
  } else {
    rtb_Y_o = SecComputer_P.Constant_Value_p;
  }

  if (SecComputer_DWork.pLeftStickDisabled) {
    rtb_eta_deg_dv = SecComputer_P.Constant_Value_p;
  } else {
    rtb_eta_deg_dv = SecComputer_U.in.analog_inputs.capt_pitch_stick_pos;
  }

  rtb_eta_deg_dv += rtb_Y_o;
  if (rtb_eta_deg_dv > SecComputer_P.Saturation_UpperSat) {
    rtb_eta_deg_dv = SecComputer_P.Saturation_UpperSat;
  } else if (rtb_eta_deg_dv < SecComputer_P.Saturation_LowerSat) {
    rtb_eta_deg_dv = SecComputer_P.Saturation_LowerSat;
  }

  if (SecComputer_DWork.pLeftStickDisabled) {
    rtb_Y_cb = SecComputer_P.Constant1_Value_p;
  } else {
    rtb_Y_cb = SecComputer_U.in.analog_inputs.capt_roll_stick_pos;
  }

  if (!SecComputer_DWork.pRightStickDisabled) {
    rtb_Y_o = SecComputer_U.in.analog_inputs.fo_roll_stick_pos;
  } else {
    rtb_Y_o = SecComputer_P.Constant1_Value_p;
  }

  rtb_eta_trim_deg_a = rtb_Y_o + rtb_Y_cb;
  if (rtb_eta_trim_deg_a > SecComputer_P.Saturation1_UpperSat) {
    rtb_eta_trim_deg_a = SecComputer_P.Saturation1_UpperSat;
  } else if (rtb_eta_trim_deg_a < SecComputer_P.Saturation1_LowerSat) {
    rtb_eta_trim_deg_a = SecComputer_P.Saturation1_LowerSat;
  }

  if (SecComputer_U.in.discrete_inputs.is_unit_1) {
    leftElevatorAvail = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_OR6);
    rightElevatorAvail = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_OR6);
  } else {
    leftElevatorAvail = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) &&
                         rtb_logic_crg14_is_green_hydraulic_power_avail);
    rightElevatorAvail = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_AND4_a);
  }

  canEngageInPitch = ((leftElevatorAvail || rightElevatorAvail) && (!SecComputer_U.in.discrete_inputs.is_unit_3));
  if (SecComputer_U.in.discrete_inputs.is_unit_1) {
    hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
                          SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2 &&
                          SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp &&
                          SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp);
    spoilerPair1SupplyAvail = rtb_OR6;
    rtb_AND1_h = rtb_AND4_a;
  } else {
    hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.is_unit_2 &&
                          (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
      SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2));
    if (SecComputer_U.in.discrete_inputs.is_unit_2) {
      spoilerPair1SupplyAvail = rtb_logic_crg14_is_green_hydraulic_power_avail;
      rtb_AND1_h = false;
    } else {
      spoilerPair1SupplyAvail = rtb_logic_crg14_is_green_hydraulic_power_avail;
      rtb_AND1_h = rtb_AND4_a;
    }
  }

  rtb_isEngagedInPitch = (canEngageInPitch && hasPriorityInPitch);
  spoilerPair1SupplyAvail = ((!SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed) &&
    (!SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed) && spoilerPair1SupplyAvail);
  spoiler_pair_2_avail = ((!SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed) &&
    (!SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed) && rtb_AND1_h);
  rtb_isEngagedInRoll = ((spoilerPair1SupplyAvail || spoiler_pair_2_avail) &&
    SecComputer_U.in.discrete_inputs.digital_output_failed_elac_1 &&
    SecComputer_U.in.discrete_inputs.digital_output_failed_elac_2);
  rtb_AND1_h = !rtb_OR16;
  abnormalCondition = (rtb_AND1_h && (((!rtb_doubleAdrFault) && ((rtb_mach > 0.91) || (rtb_alpha < -10.0F) || (rtb_alpha
    > 40.0F) || (rtb_V_ias > 440.0F) || (rtb_V_ias < 60.0F))) || ((!rtb_OR) && ((!rtb_singleIrFault) ||
    (!SecComputer_P.Constant_Value_f)) && ((std::abs(static_cast<real_T>
    (SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data)) > 125.0) ||
    ((SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data > 50.0F) ||
     (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data < -30.0F))))));
  SecComputer_DWork.abnormalConditionWasActive = (abnormalCondition || (rtb_AND1_h &&
    SecComputer_DWork.abnormalConditionWasActive));
  if (rtb_OR) {
    rtb_pitchLawCapability = pitch_efcs_law::DirectLaw;
  } else if ((rtb_OR14 && rtb_OR1) || rtb_doubleAdrFault || SecComputer_DWork.abnormalConditionWasActive) {
    rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw2;
  } else {
    rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw1;
  }

  if (rtb_isEngagedInPitch) {
    rtb_activePitchLaw = rtb_pitchLawCapability;
  } else {
    rtb_activePitchLaw = pitch_efcs_law::None;
  }

  rtb_logic_crg14_is_yellow_hydraulic_power_avail = rtb_AND4_a;
  rtb_logic_crg14_ir_computation_data_n_z_g_tmp_tmp = SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  rtb_logic_crg14_ir_computation_data_theta_dot_deg_s_tmp_tmp =
    SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  rtb_AND1_h = (SecComputer_P.Constant_Value_c || (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
    SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2 &&
    ((SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp && (!leftElevatorAvail)) ||
     (SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp && (!rightElevatorAvail)))) ||
                ((SecComputer_U.in.analog_inputs.thr_lever_1_pos >= SecComputer_P.CompareToConstant3_const) ||
                 (SecComputer_U.in.analog_inputs.thr_lever_2_pos >= SecComputer_P.CompareToConstant4_const)));
  rtb_AND4_a = (SecComputer_U.in.analog_inputs.spd_brk_lever_pos < SecComputer_P.CompareToConstant_const);
  SecComputer_DWork.Memory_PreviousInput = SecComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_AND1_h) << 1) +
    rtb_AND4_a) << 1) + SecComputer_DWork.Memory_PreviousInput];
  rtb_AND1_p = (rtb_AND1_h || SecComputer_DWork.Memory_PreviousInput);
  rtb_logic_crg_alpha_disagree = rtb_y_b;
  SecComputer_MATLABFunction_e(rtb_OR16, SecComputer_P.PulseNode3_isRisingEdge, &rtb_AND4_a,
    &SecComputer_DWork.sf_MATLABFunction_nd);
  SecComputer_MATLABFunction_e(rtb_OR16, SecComputer_P.PulseNode2_isRisingEdge, &rtb_y_b,
    &SecComputer_DWork.sf_MATLABFunction_n);
  SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.Logic_table_i[(((static_cast<uint32_T>(rtb_AND4_a ||
    ((SecComputer_U.in.analog_inputs.wheel_speed_left < SecComputer_P.CompareToConstant11_const) &&
     (SecComputer_U.in.analog_inputs.wheel_speed_right < SecComputer_P.CompareToConstant12_const))) << 1) + rtb_y_b) <<
    1) + SecComputer_DWork.Memory_PreviousInput_n];
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel4_bit_a,
    &rtb_Switch7);
  rtb_AND1_h = (rtb_Switch7 != 0U);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel6_bit_d,
    &rtb_Switch7);
  rtb_AND4_a = (rtb_AND1_h && (rtb_Switch7 != 0U));
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel5_bit_i,
    &rtb_Switch7);
  rtb_AND1_h = (rtb_Switch7 != 0U);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel7_bit_m,
    &rtb_Switch7);
  SecComputer_MATLABFunction_e(rtb_AND4_a || (rtb_AND1_h && (rtb_Switch7 != 0U)),
    SecComputer_P.PulseNode1_isRisingEdge_k, &rtb_AND1_h, &SecComputer_DWork.sf_MATLABFunction_a);
  rtb_NOT_bl = (SecComputer_U.in.analog_inputs.spd_brk_lever_pos < SecComputer_P.CompareToConstant_const_m);
  SecComputer_DWork.Delay1_DSTATE_i = (((((SecComputer_U.in.analog_inputs.spd_brk_lever_pos >
    SecComputer_P.CompareToConstant15_const) || rtb_NOT_bl) && ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
    SecComputer_P.CompareToConstant1_const) || (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
    SecComputer_P.CompareToConstant2_const))) || (((SecComputer_U.in.analog_inputs.thr_lever_1_pos <
    SecComputer_P.CompareToConstant3_const_a) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
    SecComputer_P.CompareToConstant4_const_j)) || ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
    SecComputer_P.CompareToConstant13_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <
    SecComputer_P.CompareToConstant14_const)))) && (rtb_AND1_h || ((SecComputer_U.in.analog_inputs.wheel_speed_left >=
    SecComputer_P.CompareToConstant5_const) && (SecComputer_U.in.analog_inputs.wheel_speed_right >=
    SecComputer_P.CompareToConstant6_const) && SecComputer_DWork.Memory_PreviousInput_n) ||
    SecComputer_DWork.Delay1_DSTATE_i));
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel_bit,
    &rtb_Switch7);
  rtb_AND1_h = (rtb_Switch7 != 0U);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel2_bit,
    &rtb_Switch7);
  rtb_AND4_a = (rtb_AND1_h || (rtb_Switch7 != 0U));
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, SecComputer_P.BitfromLabel1_bit,
    &rtb_Switch7);
  rtb_AND1_h = (rtb_Switch7 != 0U);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, SecComputer_P.BitfromLabel3_bit,
    &rtb_Switch7);
  SecComputer_MATLABFunction_e(rtb_AND4_a || (rtb_AND1_h || (rtb_Switch7 != 0U)), SecComputer_P.PulseNode_isRisingEdge_h,
    &rtb_AND1_h, &SecComputer_DWork.sf_MATLABFunction_e3);
  SecComputer_DWork.Delay_DSTATE_n = (((((SecComputer_U.in.analog_inputs.spd_brk_lever_pos >
    SecComputer_P.CompareToConstant10_const) || rtb_NOT_bl) && ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
    SecComputer_P.CompareToConstant7_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
    SecComputer_P.CompareToConstant16_const))) || (((SecComputer_U.in.analog_inputs.thr_lever_1_pos <
    SecComputer_P.CompareToConstant17_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
    SecComputer_P.CompareToConstant18_const)) || ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
    SecComputer_P.CompareToConstant8_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <
    SecComputer_P.CompareToConstant9_const)))) && (rtb_AND1_h || SecComputer_DWork.Delay_DSTATE_n));
  rtb_AND1_h = ((!SecComputer_DWork.Delay1_DSTATE_i) && SecComputer_DWork.Delay_DSTATE_n);
  rtb_logic_crg1_total_sidestick_pitch_command = rtb_eta_deg_dv;
  rtb_logic_crg1_total_sidestick_roll_command = rtb_eta_trim_deg_a;
  rtb_AND4_a = rtb_NOT_bl;
  if (SecComputer_DWork.Delay1_DSTATE_i) {
    rtb_Y_o = SecComputer_P.Constant_Value;
  } else if (rtb_AND1_h) {
    rtb_Y_o = SecComputer_P.Constant1_Value;
  } else {
    rtb_Y_o = SecComputer_P.Constant2_Value;
  }

  SecComputer_RateLimiter(rtb_Y_o, SecComputer_P.RateLimiterVariableTs6_up, SecComputer_P.RateLimiterVariableTs6_lo,
    SecComputer_U.in.time.dt, SecComputer_P.RateLimiterVariableTs6_InitialCondition, &rtb_eta_trim_deg_a,
    &SecComputer_DWork.sf_RateLimiter_c);
  rtb_NOT_bl = (SecComputer_DWork.Delay1_DSTATE_i || rtb_AND1_h);
  if (rtb_AND1_p) {
    rtb_Y_o = SecComputer_P.Constant3_Value;
  } else {
    rtb_Y_o = look1_binlxpw(SecComputer_U.in.analog_inputs.spd_brk_lever_pos, SecComputer_P.uDLookupTable_bp01Data,
      SecComputer_P.uDLookupTable_tableData, 4U);
  }

  SecComputer_RateLimiter(rtb_Y_o, SecComputer_P.RateLimiterVariableTs1_up, SecComputer_P.RateLimiterVariableTs1_lo,
    SecComputer_U.in.time.dt, SecComputer_P.RateLimiterVariableTs1_InitialCondition, &rtb_eta_deg_dv,
    &SecComputer_DWork.sf_RateLimiter);
  LawMDLOBJ1.step(&SecComputer_U.in.time.dt, &rtb_logic_crg1_total_sidestick_roll_command, &rtb_Y_cb, &rtb_Y_o);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
    SecComputer_P.BitfromLabel_bit_a, &rtb_y);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
    SecComputer_P.BitfromLabel1_bit_c, &rtb_Switch9);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
    SecComputer_P.BitfromLabel2_bit_o, &rtb_DataTypeConversion1);
  SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
    SecComputer_P.BitfromLabel3_bit_j, &rtb_Switch7);
  if (SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
       NormalOperation)) {
    rtb_Y_cb = SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data;
    rtb_y_b = (rtb_y != 0U);
    spoilerPair2Active = (rtb_DataTypeConversion1 != 0U);
  } else if (SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM == static_cast<uint32_T>
             (SignStatusMatrix::NormalOperation)) {
    rtb_Y_cb = SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data;
    rtb_y_b = (rtb_Switch9 != 0U);
    spoilerPair2Active = (rtb_Switch7 != 0U);
  } else {
    rtb_y_b = true;
    spoilerPair2Active = true;
  }

  if (SecComputer_U.in.discrete_inputs.is_unit_1) {
    if (rtb_y_b) {
      pair1RollCommand = rtb_Y_cb;
    } else {
      pair1RollCommand = 0.0;
    }

    rtb_Y_o = rtb_Y_cb;
    rtb_Y = rtb_eta_deg_dv;
  } else if (SecComputer_U.in.discrete_inputs.is_unit_2) {
    pair1RollCommand = rtb_Y_cb;
    rtb_Y_o = 0.0;
    rtb_Y = 0.0;
    rtb_eta_deg_dv = 0.0;
  } else {
    pair1RollCommand = 0.0;
    if (spoilerPair2Active) {
      rtb_Y_o = rtb_Y_cb;
    } else {
      rtb_Y_o = 0.0;
    }

    rtb_Y = 0.0;
    rtb_eta_deg_dv /= 2.0;
  }

  if (rtb_Y_cb >= 0.0) {
    rtb_Y_e = rtb_Y - pair1RollCommand;
    rtb_Y_cb = rtb_eta_deg_dv - rtb_Y_o;
  } else {
    rtb_Y_e = rtb_Y;
    rtb_Y += pair1RollCommand;
    rtb_Y_cb = rtb_eta_deg_dv;
    rtb_eta_deg_dv += rtb_Y_o;
  }

  if (rtb_NOT_bl) {
    pair1RollCommand = rtb_eta_trim_deg_a;
  } else {
    pair1RollCommand = std::fmax(rtb_Y_e - (rtb_Y - std::fmax(rtb_Y, -50.0)), -50.0);
  }

  if (pair1RollCommand > SecComputer_P.Saturation_UpperSat_n) {
    pair1RollCommand = SecComputer_P.Saturation_UpperSat_n;
  } else if (pair1RollCommand < SecComputer_P.Saturation_LowerSat_n) {
    pair1RollCommand = SecComputer_P.Saturation_LowerSat_n;
  }

  SecComputer_RateLimiter(pair1RollCommand, SecComputer_P.RateLimiterVariableTs2_up,
    SecComputer_P.RateLimiterVariableTs2_lo, SecComputer_U.in.time.dt,
    SecComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_Y_o, &SecComputer_DWork.sf_RateLimiter_b);
  if (rtb_NOT_bl) {
    pair1RollCommand = rtb_eta_trim_deg_a;
  } else {
    pair1RollCommand = std::fmax(rtb_Y - (rtb_Y_e - std::fmax(rtb_Y_e, -50.0)), -50.0);
  }

  if (pair1RollCommand > SecComputer_P.Saturation1_UpperSat_e) {
    pair1RollCommand = SecComputer_P.Saturation1_UpperSat_e;
  } else if (pair1RollCommand < SecComputer_P.Saturation1_LowerSat_f) {
    pair1RollCommand = SecComputer_P.Saturation1_LowerSat_f;
  }

  SecComputer_RateLimiter(pair1RollCommand, SecComputer_P.RateLimiterVariableTs3_up,
    SecComputer_P.RateLimiterVariableTs3_lo, SecComputer_U.in.time.dt,
    SecComputer_P.RateLimiterVariableTs3_InitialCondition, &rtb_Y, &SecComputer_DWork.sf_RateLimiter_f);
  if (rtb_NOT_bl) {
    pair1RollCommand = rtb_eta_trim_deg_a;
  } else {
    pair1RollCommand = std::fmax(rtb_Y_cb - (rtb_eta_deg_dv - std::fmax(rtb_eta_deg_dv, -50.0)), -50.0);
  }

  if (pair1RollCommand > SecComputer_P.Saturation2_UpperSat) {
    pair1RollCommand = SecComputer_P.Saturation2_UpperSat;
  } else if (pair1RollCommand < SecComputer_P.Saturation2_LowerSat) {
    pair1RollCommand = SecComputer_P.Saturation2_LowerSat;
  }

  SecComputer_RateLimiter(pair1RollCommand, SecComputer_P.RateLimiterVariableTs4_up,
    SecComputer_P.RateLimiterVariableTs4_lo, SecComputer_U.in.time.dt,
    SecComputer_P.RateLimiterVariableTs4_InitialCondition, &rtb_Y_e, &SecComputer_DWork.sf_RateLimiter_j);
  if (!rtb_NOT_bl) {
    rtb_eta_trim_deg_a = std::fmax(rtb_eta_deg_dv - (rtb_Y_cb - std::fmax(rtb_Y_cb, -50.0)), -50.0);
  }

  if (rtb_eta_trim_deg_a > SecComputer_P.Saturation3_UpperSat) {
    rtb_eta_trim_deg_a = SecComputer_P.Saturation3_UpperSat;
  } else if (rtb_eta_trim_deg_a < SecComputer_P.Saturation3_LowerSat) {
    rtb_eta_trim_deg_a = SecComputer_P.Saturation3_LowerSat;
  }

  SecComputer_RateLimiter(rtb_eta_trim_deg_a, SecComputer_P.RateLimiterVariableTs5_up,
    SecComputer_P.RateLimiterVariableTs5_lo, SecComputer_U.in.time.dt,
    SecComputer_P.RateLimiterVariableTs5_InitialCondition, &rtb_Y_cb, &SecComputer_DWork.sf_RateLimiter_d);
  rtb_y_b = (rtb_OR3 || ((static_cast<real_T>(rtb_activePitchLaw) != SecComputer_P.CompareToConstant2_const_f) && (
    static_cast<real_T>(rtb_activePitchLaw) != SecComputer_P.CompareToConstant3_const_o)));
  LawMDLOBJ2.step(&SecComputer_U.in.time.dt, &rtb_logic_crg14_ir_computation_data_n_z_g_tmp_tmp, &rtb_Y_d_tmp_tmp,
                  &rtb_DataTypeConversion5_tmp_tmp, &rtb_logic_crg14_ir_computation_data_theta_dot_deg_s_tmp_tmp, (
    const_cast<real_T*>(&SecComputer_RGND)), &SecComputer_U.in.analog_inputs.ths_pos_deg,
                  &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn, (const_cast<real_T*>
    (&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)),
                  &rtb_logic_crg1_total_sidestick_pitch_command, &rtb_y_b, &rtb_eta_deg, &rtb_eta_trim_deg);
  LawMDLOBJ3.step(&SecComputer_U.in.time.dt, &rtb_logic_crg1_total_sidestick_pitch_command, &rtb_eta_deg_dv,
                  &rtb_eta_trim_deg_a);
  switch (static_cast<int32_T>(rtb_activePitchLaw)) {
   case 1:
   case 2:
    rtb_eta_deg_dv = rtb_eta_deg;
    break;

   case 3:
    break;

   default:
    rtb_eta_deg_dv = SecComputer_P.Constant_Value_a;
    break;
  }

  switch (static_cast<int32_T>(rtb_activePitchLaw)) {
   case 1:
   case 2:
    rtb_eta_trim_deg_a = rtb_eta_trim_deg;
    break;

   case 3:
    break;

   default:
    rtb_eta_trim_deg_a = SecComputer_P.Constant_Value_a;
    break;
  }

  SecComputer_Y.out.analog_outputs.left_elev_pos_order_deg = rtb_eta_deg_dv;
  SecComputer_Y.out.analog_outputs.right_elev_pos_order_deg = rtb_eta_deg_dv;
  SecComputer_Y.out.analog_outputs.ths_pos_order_deg = rtb_eta_trim_deg_a;
  SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg = rtb_Y_o;
  SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg = rtb_Y;
  SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg = rtb_Y_e;
  SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg = rtb_Y_cb;
  SecComputer_Y.out.data = SecComputer_U.in;
  SecComputer_Y.out.discrete_outputs.thr_reverse_selected = SecComputer_P.Constant1_Value_g;
  SecComputer_Y.out.discrete_outputs.left_elevator_ok = leftElevatorAvail;
  SecComputer_Y.out.discrete_outputs.right_elevator_ok = rightElevatorAvail;
  SecComputer_Y.out.discrete_outputs.ground_spoiler_out = SecComputer_DWork.Delay1_DSTATE_i;
  SecComputer_Y.out.discrete_outputs.sec_failed = SecComputer_P.Constant2_Value_n;
  rtb_NOT_bl = (rtb_isEngagedInPitch && leftElevatorAvail);
  SecComputer_Y.out.discrete_outputs.left_elevator_damping_mode = rtb_NOT_bl;
  SecComputer_Y.out.discrete_outputs.right_elevator_damping_mode = rtb_NOT_bl;
  SecComputer_Y.out.discrete_outputs.ths_active = (rtb_isEngagedInPitch &&
    (!SecComputer_U.in.discrete_inputs.ths_motor_fault));
  if (SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed) {
    SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.Data = static_cast<real32_T>
      (SecComputer_P.Constant_Value_j);
  } else {
    SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.left_spoiler_1_pos_deg);
  }

  if (SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed) {
    SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.Data = static_cast<real32_T>
      (SecComputer_P.Constant1_Value_d);
  } else {
    SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.right_spoiler_1_pos_deg);
  }

  if (SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed) {
    SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.Data = static_cast<real32_T>(SecComputer_P.Constant5_Value);
  } else {
    SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.left_spoiler_2_pos_deg);
  }

  if (SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed) {
    SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.Data = static_cast<real32_T>
      (SecComputer_P.Constant6_Value);
  } else {
    SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.right_spoiler_2_pos_deg);
  }

  if (SecComputer_U.in.discrete_inputs.l_elev_servo_failed) {
    SecComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
      (SecComputer_P.Constant2_Value_b);
  } else {
    SecComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.left_elevator_pos_deg);
  }

  if (SecComputer_U.in.discrete_inputs.r_elev_servo_failed) {
    SecComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
      (SecComputer_P.Constant3_Value_f);
  } else {
    SecComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.right_elevator_pos_deg);
  }

  if (SecComputer_U.in.discrete_inputs.ths_motor_fault) {
    SecComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>(SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>(SecComputer_P.Constant4_Value_i);
  } else {
    SecComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>(SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.ths_pos_deg);
  }

  SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = SecComputer_P.Gain_Gain * static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.capt_pitch_stick_pos);
  SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = SecComputer_P.Gain1_Gain * static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.fo_pitch_stick_pos);
  SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = SecComputer_P.Gain2_Gain * static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.capt_roll_stick_pos);
  SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = SecComputer_P.Gain3_Gain * static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.fo_roll_stick_pos);
  SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.Data = SecComputer_P.Gain4_Gain * static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.spd_brk_lever_pos);
  SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.thrust_lever_angle_1_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.thrust_lever_angle_1_deg.Data = static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.thr_lever_1_pos);
  rtb_y_f = static_cast<real32_T>(SecComputer_U.in.analog_inputs.thr_lever_2_pos);
  SecComputer_Y.out.bus_outputs.thrust_lever_angle_2_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.thrust_lever_angle_2_deg.Data = static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.thr_lever_2_pos);
  rtb_VectorConcatenate[0] = (SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed ||
    SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed);
  rtb_VectorConcatenate[1] = (SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed ||
    SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed);
  rtb_VectorConcatenate[2] = SecComputer_U.in.discrete_inputs.l_elev_servo_failed;
  rtb_VectorConcatenate[3] = SecComputer_U.in.discrete_inputs.r_elev_servo_failed;
  rtb_VectorConcatenate[4] = spoilerPair1SupplyAvail;
  rtb_VectorConcatenate[5] = spoiler_pair_2_avail;
  rtb_VectorConcatenate[6] = leftElevatorAvail;
  rtb_VectorConcatenate[7] = rightElevatorAvail;
  rtb_VectorConcatenate[8] = (rtb_activePitchLaw == pitch_efcs_law::AlternateLaw2);
  rtb_VectorConcatenate[9] = ((rtb_activePitchLaw == pitch_efcs_law::AlternateLaw1) || (rtb_activePitchLaw ==
    pitch_efcs_law::AlternateLaw2));
  rtb_VectorConcatenate[10] = (rtb_activePitchLaw == pitch_efcs_law::DirectLaw);
  rtb_VectorConcatenate[11] = rtb_isEngagedInRoll;
  rtb_VectorConcatenate[12] = rtb_isEngagedInPitch;
  rtb_VectorConcatenate[13] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[14] = SecComputer_DWork.Delay1_DSTATE_i;
  rtb_VectorConcatenate[15] = rtb_AND4_a;
  rtb_VectorConcatenate[16] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[17] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[18] = SecComputer_P.Constant8_Value;
  SecComputer_MATLABFunction_cw(rtb_VectorConcatenate, &SecComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
  SecComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  rtb_VectorConcatenate[0] = SecComputer_P.Constant7_Value;
  rtb_VectorConcatenate[1] = SecComputer_P.Constant7_Value;
  rtb_VectorConcatenate[2] = SecComputer_DWork.pLeftStickDisabled;
  rtb_VectorConcatenate[3] = SecComputer_DWork.pRightStickDisabled;
  rtb_VectorConcatenate[4] = SecComputer_DWork.Delay_DSTATE;
  rtb_VectorConcatenate[5] = SecComputer_DWork.Delay1_DSTATE;
  rtb_VectorConcatenate[6] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[7] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[8] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[9] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[10] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[11] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[12] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[13] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[14] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[15] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[16] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[17] = SecComputer_P.Constant10_Value;
  rtb_VectorConcatenate[18] = SecComputer_P.Constant10_Value;
  SecComputer_MATLABFunction_cw(rtb_VectorConcatenate, &rtb_y_f);
  SecComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.discrete_status_word_2.Data = rtb_y_f;
  SecComputer_Y.out.laws.lateral_law_outputs.left_spoiler_1_command_deg = rtb_Y_o;
  SecComputer_Y.out.laws.lateral_law_outputs.right_spoiler_1_command_deg = rtb_Y;
  SecComputer_Y.out.laws.lateral_law_outputs.left_spoiler_2_command_deg = rtb_Y_e;
  SecComputer_Y.out.laws.lateral_law_outputs.right_spoiler_2_command_deg = rtb_Y_cb;
  SecComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_eta_deg_dv;
  SecComputer_Y.out.laws.pitch_law_outputs.ths_command_deg = rtb_eta_trim_deg_a;
  SecComputer_Y.out.logic.on_ground = rtb_OR16;
  SecComputer_Y.out.logic.tracking_mode_on = rtb_OR3;
  SecComputer_Y.out.logic.pitch_law_capability = rtb_pitchLawCapability;
  SecComputer_Y.out.logic.active_pitch_law = rtb_activePitchLaw;
  SecComputer_Y.out.logic.abnormal_condition_law_active = abnormalCondition;
  SecComputer_Y.out.logic.is_engaged_in_pitch = rtb_isEngagedInPitch;
  SecComputer_Y.out.logic.can_engage_in_pitch = canEngageInPitch;
  SecComputer_Y.out.logic.has_priority_in_pitch = hasPriorityInPitch;
  SecComputer_Y.out.logic.left_elevator_avail = leftElevatorAvail;
  SecComputer_Y.out.logic.right_elevator_avail = rightElevatorAvail;
  SecComputer_Y.out.logic.is_engaged_in_roll = rtb_isEngagedInRoll;
  SecComputer_Y.out.logic.spoiler_pair_1_avail = spoilerPair1SupplyAvail;
  SecComputer_Y.out.logic.spoiler_pair_2_avail = spoiler_pair_2_avail;
  SecComputer_Y.out.logic.is_yellow_hydraulic_power_avail = rtb_logic_crg14_is_yellow_hydraulic_power_avail;
  SecComputer_Y.out.logic.is_blue_hydraulic_power_avail = rtb_OR6;
  SecComputer_Y.out.logic.is_green_hydraulic_power_avail = rtb_logic_crg14_is_green_hydraulic_power_avail;
  SecComputer_Y.out.logic.left_sidestick_disabled = SecComputer_DWork.pLeftStickDisabled;
  SecComputer_Y.out.logic.right_sidestick_disabled = SecComputer_DWork.pRightStickDisabled;
  SecComputer_Y.out.logic.left_sidestick_priority_locked = SecComputer_DWork.Delay_DSTATE;
  SecComputer_Y.out.logic.right_sidestick_priority_locked = SecComputer_DWork.Delay1_DSTATE;
  SecComputer_Y.out.logic.total_sidestick_pitch_command = rtb_logic_crg1_total_sidestick_pitch_command;
  SecComputer_Y.out.logic.total_sidestick_roll_command = rtb_logic_crg1_total_sidestick_roll_command;
  SecComputer_Y.out.logic.ground_spoilers_armed = rtb_AND4_a;
  SecComputer_Y.out.logic.ground_spoilers_out = SecComputer_DWork.Delay1_DSTATE_i;
  SecComputer_Y.out.logic.partial_lift_dumping_active = rtb_AND1_h;
  SecComputer_Y.out.logic.speed_brake_inhibited = rtb_AND1_p;
  SecComputer_Y.out.logic.single_adr_failure = rtb_OR14;
  SecComputer_Y.out.logic.double_adr_failure = rtb_doubleAdrFault;
  SecComputer_Y.out.logic.cas_or_mach_disagree = rtb_OR1;
  SecComputer_Y.out.logic.alpha_disagree = rtb_logic_crg_alpha_disagree;
  SecComputer_Y.out.logic.single_ir_failure = rtb_singleIrFault;
  SecComputer_Y.out.logic.double_ir_failure = rtb_OR;
  SecComputer_Y.out.logic.ir_disagree = SecComputer_P.Constant_Value_f;
  SecComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
  SecComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
  SecComputer_Y.out.logic.adr_computation_data.mach = rtb_mach;
  SecComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_alpha;
  SecComputer_Y.out.logic.ir_computation_data.theta_deg = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  SecComputer_Y.out.logic.ir_computation_data.phi_deg = SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  SecComputer_Y.out.logic.ir_computation_data.q_deg_s = SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
  SecComputer_Y.out.logic.ir_computation_data.r_deg_s = SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  SecComputer_Y.out.logic.ir_computation_data.n_x_g = SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
  SecComputer_Y.out.logic.ir_computation_data.n_y_g = SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
  SecComputer_Y.out.logic.ir_computation_data.n_z_g = SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  SecComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s =
    SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  SecComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s =
    SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
}

void SecComputer::initialize()
{
  SecComputer_DWork.Delay_DSTATE = SecComputer_P.Delay_InitialCondition;
  SecComputer_DWork.Delay1_DSTATE = SecComputer_P.Delay1_InitialCondition;
  SecComputer_DWork.Memory_PreviousInput = SecComputer_P.SRFlipFlop_initial_condition;
  SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.SRFlipFlop_initial_condition_k;
  SecComputer_DWork.Delay1_DSTATE_i = SecComputer_P.Delay1_InitialCondition_l;
  SecComputer_DWork.Delay_DSTATE_n = SecComputer_P.Delay_InitialCondition_j;
  LawMDLOBJ2.init();
}

void SecComputer::terminate()
{
}

SecComputer::SecComputer():
  SecComputer_U(),
  SecComputer_Y(),
  SecComputer_DWork()
{
}

SecComputer::~SecComputer()
{
}
