#include "SecComputer.h"
#include "rtwtypes.h"
#include "SecComputer_types.h"
#include "LateralDirectLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

const uint8_T SecComputer_IN_InAir{ 1U };

const uint8_T SecComputer_IN_OnGround{ 2U };

const real_T SecComputer_RGND{ 0.0 };

const boolean_T SecComputer_BGND{ false };

void SecComputer::SecComputer_MATLABFunction(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_SecComputer_T *localDW)
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

void SecComputer::SecComputer_MATLABFunction_g(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_SecComputer_b_T *localDW)
{
  boolean_T rtu_isRisingEdge_0;
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

void SecComputer::SecComputer_MATLABFunction_c(const boolean_T rtu_u[19], real32_T *rty_y)
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
  real_T rtb_xi_deg;
  real_T rtb_zeta_deg;
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_deg;
  real_T rtb_eta_deg_o;
  real_T rtb_eta_trim_deg_j;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_right_aileron_command_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_yaw_damper_command_deg;
  real_T rtb_Gain;
  real_T rtb_Saturation;
  real_T rtb_eta_deg_a;
  real_T rtb_eta_trim_deg_i;
  real_T rtb_logic_crg_total_sidestick_roll_command;
  real32_T rtb_y_l;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T canEngageInPitch;
  boolean_T hasPriorityInPitch;
  boolean_T rtb_AND1;
  boolean_T rtb_AND3;
  boolean_T rtb_NOT_k;
  boolean_T rtb_OR_p;
  boolean_T rtb_isEngagedInPitch;
  boolean_T rtb_isEngagedInRoll;
  boolean_T rtb_logic_crg1_is_blue_hydraulic_power_avail;
  boolean_T rtb_logic_crg1_is_green_hydraulic_power_avail;
  boolean_T rtb_logic_crg1_tracking_mode_on;
  boolean_T rtb_on_ground;
  boolean_T spoilerPair1SupplyAvail;
  boolean_T spoilerPair2SupplyAvail;
  pitch_efcs_law rtb_activePitchLaw;
  SecComputer_Y.out.data = SecComputer_U.in;
  if (SecComputer_DWork.is_active_c8_SecComputer == 0U) {
    SecComputer_DWork.is_active_c8_SecComputer = 1U;
    SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
    rtb_on_ground = true;
  } else if (SecComputer_DWork.is_c8_SecComputer == SecComputer_IN_InAir) {
    if (static_cast<real_T>(SecComputer_P.Constant_Value_l) > 0.1) {
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
      rtb_on_ground = true;
    } else {
      rtb_on_ground = false;
    }
  } else if (!SecComputer_P.Constant_Value_l) {
    SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_InAir;
    rtb_on_ground = false;
  } else {
    rtb_on_ground = true;
  }

  rtb_AND3 = (SecComputer_U.in.sim_data.slew_on || SecComputer_U.in.sim_data.pause_on ||
              SecComputer_U.in.sim_data.tracking_mode_on_override);
  rtb_logic_crg1_tracking_mode_on = rtb_AND3;
  SecComputer_MATLABFunction(!SecComputer_U.in.discrete_inputs.yellow_low_pressure, SecComputer_U.in.time.dt,
    SecComputer_P.ConfirmNode_isRisingEdge, SecComputer_P.ConfirmNode_timeDelay, &rtb_AND3,
    &SecComputer_DWork.sf_MATLABFunction);
  SecComputer_MATLABFunction(!SecComputer_U.in.discrete_inputs.blue_low_pressure, SecComputer_U.in.time.dt,
    SecComputer_P.ConfirmNode1_isRisingEdge, SecComputer_P.ConfirmNode1_timeDelay, &rtb_AND1,
    &SecComputer_DWork.sf_MATLABFunction_g);
  SecComputer_MATLABFunction(!SecComputer_U.in.discrete_inputs.green_low_pressure, SecComputer_U.in.time.dt,
    SecComputer_P.ConfirmNode2_isRisingEdge, SecComputer_P.ConfirmNode2_timeDelay, &rtb_NOT_k,
    &SecComputer_DWork.sf_MATLABFunction_h);
  rtb_logic_crg1_is_blue_hydraulic_power_avail = rtb_AND1;
  rtb_logic_crg1_is_green_hydraulic_power_avail = rtb_NOT_k;
  SecComputer_MATLABFunction_g(SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
    SecComputer_P.PulseNode_isRisingEdge, &rtb_AND1, &SecComputer_DWork.sf_MATLABFunction_g4);
  SecComputer_MATLABFunction_g(SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
    SecComputer_P.PulseNode1_isRisingEdge, &rtb_NOT_k, &SecComputer_DWork.sf_MATLABFunction_n);
  if (rtb_AND1) {
    SecComputer_DWork.pRightStickDisabled = true;
    SecComputer_DWork.pLeftStickDisabled = false;
  } else if (rtb_NOT_k) {
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

  SecComputer_MATLABFunction(SecComputer_DWork.pLeftStickDisabled &&
    (SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || SecComputer_DWork.Delay_DSTATE),
    SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode1_isRisingEdge_k, SecComputer_P.ConfirmNode1_timeDelay_a,
    &SecComputer_DWork.Delay_DSTATE, &SecComputer_DWork.sf_MATLABFunction_j);
  SecComputer_MATLABFunction(SecComputer_DWork.pRightStickDisabled &&
    (SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || SecComputer_DWork.Delay1_DSTATE),
    SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_j, SecComputer_P.ConfirmNode_timeDelay_a,
    &SecComputer_DWork.Delay1_DSTATE, &SecComputer_DWork.sf_MATLABFunction_g2);
  if (!SecComputer_DWork.pRightStickDisabled) {
    rtb_eta_trim_deg_i = SecComputer_U.in.analog_inputs.fo_pitch_stick_pos;
  } else {
    rtb_eta_trim_deg_i = SecComputer_P.Constant_Value_p;
  }

  if (SecComputer_DWork.pLeftStickDisabled) {
    rtb_logic_crg_total_sidestick_roll_command = SecComputer_P.Constant_Value_p;
  } else {
    rtb_logic_crg_total_sidestick_roll_command = SecComputer_U.in.analog_inputs.capt_pitch_stick_pos;
  }

  rtb_Saturation = rtb_eta_trim_deg_i + rtb_logic_crg_total_sidestick_roll_command;
  if (rtb_Saturation > SecComputer_P.Saturation_UpperSat) {
    rtb_Saturation = SecComputer_P.Saturation_UpperSat;
  } else if (rtb_Saturation < SecComputer_P.Saturation_LowerSat) {
    rtb_Saturation = SecComputer_P.Saturation_LowerSat;
  }

  if (!SecComputer_DWork.pRightStickDisabled) {
    rtb_eta_trim_deg_i = SecComputer_U.in.analog_inputs.fo_roll_stick_pos;
  } else {
    rtb_eta_trim_deg_i = SecComputer_P.Constant1_Value_p;
  }

  if (SecComputer_DWork.pLeftStickDisabled) {
    rtb_logic_crg_total_sidestick_roll_command = SecComputer_P.Constant1_Value_p;
  } else {
    rtb_logic_crg_total_sidestick_roll_command = SecComputer_U.in.analog_inputs.capt_roll_stick_pos;
  }

  rtb_eta_trim_deg_i += rtb_logic_crg_total_sidestick_roll_command;
  if (rtb_eta_trim_deg_i > SecComputer_P.Saturation1_UpperSat) {
    rtb_eta_trim_deg_i = SecComputer_P.Saturation1_UpperSat;
  } else if (rtb_eta_trim_deg_i < SecComputer_P.Saturation1_LowerSat) {
    rtb_eta_trim_deg_i = SecComputer_P.Saturation1_LowerSat;
  }

  if (SecComputer_U.in.discrete_inputs.is_unit_1) {
    rtb_AND1 = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_logic_crg1_is_blue_hydraulic_power_avail);
    rtb_NOT_k = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_logic_crg1_is_blue_hydraulic_power_avail);
  } else {
    rtb_AND1 = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_logic_crg1_is_green_hydraulic_power_avail);
    rtb_NOT_k = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_AND3);
  }

  canEngageInPitch = ((rtb_AND1 || rtb_NOT_k) && (!SecComputer_U.in.discrete_inputs.is_unit_3));
  if (SecComputer_U.in.discrete_inputs.is_unit_1) {
    hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
                          SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2 &&
                          SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp &&
                          SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp);
    spoilerPair1SupplyAvail = rtb_logic_crg1_is_blue_hydraulic_power_avail;
    spoilerPair2SupplyAvail = rtb_AND3;
  } else {
    hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.is_unit_2 &&
                          (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
      SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2));
    if (SecComputer_U.in.discrete_inputs.is_unit_2) {
      spoilerPair1SupplyAvail = rtb_logic_crg1_is_green_hydraulic_power_avail;
      spoilerPair2SupplyAvail = false;
    } else {
      spoilerPair1SupplyAvail = rtb_logic_crg1_is_green_hydraulic_power_avail;
      spoilerPair2SupplyAvail = rtb_AND3;
    }
  }

  rtb_isEngagedInPitch = (canEngageInPitch && hasPriorityInPitch);
  spoilerPair1SupplyAvail = ((!SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed) &&
    (!SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed) && spoilerPair1SupplyAvail);
  spoilerPair2SupplyAvail = ((!SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed) &&
    (!SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed) && spoilerPair2SupplyAvail);
  rtb_isEngagedInRoll = ((spoilerPair1SupplyAvail || spoilerPair2SupplyAvail) &&
    SecComputer_U.in.discrete_inputs.digital_output_failed_elac_1 &&
    SecComputer_U.in.discrete_inputs.digital_output_failed_elac_2);
  if (rtb_isEngagedInPitch) {
    rtb_activePitchLaw = pitch_efcs_law::AlternateLaw1;
  } else {
    rtb_activePitchLaw = pitch_efcs_law::None;
  }

  rtb_logic_crg_total_sidestick_roll_command = rtb_eta_trim_deg_i;
  LawMDLOBJ1.step(&SecComputer_U.in.time.dt, (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>
    (&SecComputer_RGND)), &rtb_eta_trim_deg_i, &rtb_on_ground, &rtb_xi_deg, &rtb_zeta_deg);
  switch (static_cast<int32_T>(SecComputer_P.Constant1_Value_a)) {
   case 0:
    rtb_eta_deg_a = 0.0;
    break;

   case 1:
    rtb_eta_deg_a = rtb_xi_deg;
    break;

   default:
    rtb_eta_deg_a = SecComputer_P.Constant_Value_c;
    break;
  }

  rtb_Gain = SecComputer_P.Gain_Gain * rtb_eta_deg_a;
  switch (static_cast<int32_T>(SecComputer_P.Constant1_Value_a)) {
   case 0:
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_yaw_damper_command_deg = 0.0;
    break;

   case 1:
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_yaw_damper_command_deg = rtb_zeta_deg;
    break;

   default:
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_yaw_damper_command_deg =
      SecComputer_P.Constant_Value_c;
    break;
  }

  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_right_aileron_command_deg = rtb_eta_deg_a;
  rtb_OR_p = (rtb_logic_crg1_tracking_mode_on || ((static_cast<real_T>(rtb_activePitchLaw) !=
    SecComputer_P.CompareToConstant2_const) && (static_cast<real_T>(rtb_activePitchLaw) !=
    SecComputer_P.CompareToConstant3_const)));
  LawMDLOBJ2.step(&SecComputer_U.in.time.dt, &SecComputer_U.in.time.simulation_time, (const_cast<real_T*>
    (&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (
    const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>
    (&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (
    const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>
    (&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (
    const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>
    (&SecComputer_RGND)), &rtb_Saturation, &rtb_on_ground, &rtb_OR_p, (const_cast<boolean_T*>(&SecComputer_BGND)), (
    const_cast<boolean_T*>(&SecComputer_BGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>
    (&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)),
                  &rtb_eta_deg, &rtb_eta_trim_deg);
  rtb_OR_p = (rtb_logic_crg1_tracking_mode_on || (static_cast<real_T>(rtb_activePitchLaw) !=
    SecComputer_P.CompareToConstant1_const));
  LawMDLOBJ3.step(&SecComputer_U.in.time.dt, &SecComputer_U.in.time.simulation_time, (const_cast<real_T*>
    (&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (
    const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>
    (&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), (
    const_cast<real_T*>(&SecComputer_RGND)), &rtb_Saturation, &rtb_on_ground, &rtb_OR_p, (const_cast<boolean_T*>
    (&SecComputer_BGND)), (const_cast<boolean_T*>(&SecComputer_BGND)), &rtb_eta_deg_o, &rtb_eta_trim_deg_j);
  switch (static_cast<int32_T>(rtb_activePitchLaw)) {
   case 1:
   case 2:
    rtb_eta_deg_a = rtb_eta_deg;
    break;

   case 3:
    rtb_eta_deg_a = rtb_eta_deg_o;
    break;

   default:
    rtb_eta_deg_a = SecComputer_P.Constant_Value_a;
    break;
  }

  switch (static_cast<int32_T>(rtb_activePitchLaw)) {
   case 1:
   case 2:
    rtb_eta_trim_deg_i = rtb_eta_trim_deg;
    break;

   case 3:
    rtb_eta_trim_deg_i = rtb_eta_trim_deg_j;
    break;

   default:
    rtb_eta_trim_deg_i = SecComputer_P.Constant_Value_a;
    break;
  }

  SecComputer_Y.out.discrete_outputs.thr_reverse_selected = SecComputer_P.Constant1_Value_g;
  SecComputer_Y.out.discrete_outputs.left_elevator_ok = rtb_AND1;
  SecComputer_Y.out.discrete_outputs.right_elevator_ok = rtb_NOT_k;
  SecComputer_Y.out.discrete_outputs.ground_spoiler_out = SecComputer_P.Constant_Value_i;
  SecComputer_Y.out.discrete_outputs.sec_failed = SecComputer_P.Constant2_Value_n;
  rtb_OR_p = (rtb_isEngagedInPitch && rtb_AND1);
  SecComputer_Y.out.discrete_outputs.left_elevator_damping_mode = rtb_OR_p;
  SecComputer_Y.out.discrete_outputs.right_elevator_damping_mode = rtb_OR_p;
  SecComputer_Y.out.discrete_outputs.ths_active = (rtb_isEngagedInPitch &&
    (!SecComputer_U.in.discrete_inputs.ths_motor_fault));
  SecComputer_Y.out.analog_outputs.left_elev_pos_order_deg = rtb_eta_deg_a;
  SecComputer_Y.out.analog_outputs.right_elev_pos_order_deg = rtb_eta_deg_a;
  SecComputer_Y.out.analog_outputs.ths_pos_order_deg = rtb_eta_trim_deg_i;
  SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg = SecComputer_P.Constant_Value_o;
  SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg = SecComputer_P.Constant_Value_o;
  SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg = SecComputer_P.Constant_Value_o;
  SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg = SecComputer_P.Constant_Value_o;
  if (SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed) {
    SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.Data = static_cast<real32_T>(SecComputer_P.Constant_Value);
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
    SecComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>(SecComputer_P.Constant2_Value);
  } else {
    SecComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.right_elevator_pos_deg);
  }

  if (SecComputer_U.in.discrete_inputs.r_elev_servo_failed) {
    SecComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant_Value);
    SecComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>(SecComputer_P.Constant3_Value);
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

  SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = SecComputer_P.Gain_Gain_b * static_cast<real32_T>
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
  rtb_y_l = static_cast<real32_T>(SecComputer_U.in.analog_inputs.spd_brk_lever_pos);
  SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.Data = SecComputer_P.Gain4_Gain * static_cast<real32_T>
    (SecComputer_U.in.analog_inputs.spd_brk_lever_pos);
  SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  rtb_VectorConcatenate[0] = (SecComputer_U.in.discrete_inputs.l_spoiler_1_servo_failed ||
    SecComputer_U.in.discrete_inputs.r_spoiler_1_servo_failed);
  rtb_VectorConcatenate[1] = (SecComputer_U.in.discrete_inputs.l_spoiler_2_servo_failed ||
    SecComputer_U.in.discrete_inputs.r_spoiler_2_servo_failed);
  rtb_VectorConcatenate[2] = SecComputer_U.in.discrete_inputs.l_elev_servo_failed;
  rtb_VectorConcatenate[3] = SecComputer_U.in.discrete_inputs.r_elev_servo_failed;
  rtb_VectorConcatenate[4] = spoilerPair1SupplyAvail;
  rtb_VectorConcatenate[5] = spoilerPair2SupplyAvail;
  rtb_VectorConcatenate[6] = rtb_AND1;
  rtb_VectorConcatenate[7] = rtb_NOT_k;
  rtb_VectorConcatenate[8] = (rtb_activePitchLaw == pitch_efcs_law::AlternateLaw2);
  rtb_VectorConcatenate[9] = ((rtb_activePitchLaw == pitch_efcs_law::AlternateLaw1) || (rtb_activePitchLaw ==
    pitch_efcs_law::AlternateLaw2));
  rtb_VectorConcatenate[10] = (rtb_activePitchLaw == pitch_efcs_law::DirectLaw);
  rtb_VectorConcatenate[11] = rtb_isEngagedInRoll;
  rtb_VectorConcatenate[12] = rtb_isEngagedInPitch;
  rtb_VectorConcatenate[13] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[14] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[15] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[16] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[17] = SecComputer_P.Constant8_Value;
  rtb_VectorConcatenate[18] = SecComputer_P.Constant8_Value;
  SecComputer_MATLABFunction_c(rtb_VectorConcatenate, &SecComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
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
  SecComputer_MATLABFunction_c(rtb_VectorConcatenate, &rtb_y_l);
  SecComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
    (SecComputer_P.EnumeratedConstant1_Value);
  SecComputer_Y.out.bus_outputs.discrete_status_word_2.Data = rtb_y_l;
  SecComputer_Y.out.laws.lateral_law_outputs.left_aileron_command_deg = rtb_Gain;
  SecComputer_Y.out.laws.lateral_law_outputs.right_aileron_command_deg =
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_right_aileron_command_deg;
  SecComputer_Y.out.laws.lateral_law_outputs.yaw_damper_command_deg =
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_yaw_damper_command_deg;
  SecComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_eta_deg_a;
  SecComputer_Y.out.laws.pitch_law_outputs.ths_command_deg = rtb_eta_trim_deg_i;
  SecComputer_Y.out.logic.on_ground = rtb_on_ground;
  SecComputer_Y.out.logic.tracking_mode_on = rtb_logic_crg1_tracking_mode_on;
  SecComputer_Y.out.logic.pitch_law_capability = pitch_efcs_law::AlternateLaw1;
  SecComputer_Y.out.logic.active_pitch_law = rtb_activePitchLaw;
  SecComputer_Y.out.logic.is_engaged_in_pitch = rtb_isEngagedInPitch;
  SecComputer_Y.out.logic.can_engage_in_pitch = canEngageInPitch;
  SecComputer_Y.out.logic.has_priority_in_pitch = hasPriorityInPitch;
  SecComputer_Y.out.logic.left_elevator_avail = rtb_AND1;
  SecComputer_Y.out.logic.right_elevator_avail = rtb_NOT_k;
  SecComputer_Y.out.logic.is_engaged_in_roll = rtb_isEngagedInRoll;
  SecComputer_Y.out.logic.spoiler_pair_1_avail = spoilerPair1SupplyAvail;
  SecComputer_Y.out.logic.spoiler_pair_2_avail = spoilerPair2SupplyAvail;
  SecComputer_Y.out.logic.is_yellow_hydraulic_power_avail = rtb_AND3;
  SecComputer_Y.out.logic.is_blue_hydraulic_power_avail = rtb_logic_crg1_is_blue_hydraulic_power_avail;
  SecComputer_Y.out.logic.is_green_hydraulic_power_avail = rtb_logic_crg1_is_green_hydraulic_power_avail;
  SecComputer_Y.out.logic.left_sidestick_disabled = SecComputer_DWork.pLeftStickDisabled;
  SecComputer_Y.out.logic.right_sidestick_disabled = SecComputer_DWork.pRightStickDisabled;
  SecComputer_Y.out.logic.left_sidestick_priority_locked = SecComputer_DWork.Delay_DSTATE;
  SecComputer_Y.out.logic.right_sidestick_priority_locked = SecComputer_DWork.Delay1_DSTATE;
  SecComputer_Y.out.logic.total_sidestick_pitch_command = rtb_Saturation;
  SecComputer_Y.out.logic.total_sidestick_roll_command = rtb_logic_crg_total_sidestick_roll_command;
  SecComputer_Y.out.logic.adr_computation_data = SecComputer_U.in.bus_inputs.adr_1_bus;
  SecComputer_Y.out.logic.ir_computation_data = SecComputer_U.in.bus_inputs.ir_1_bus;
}

void SecComputer::initialize()
{
  SecComputer_DWork.Delay_DSTATE = SecComputer_P.Delay_InitialCondition;
  SecComputer_DWork.Delay1_DSTATE = SecComputer_P.Delay1_InitialCondition;
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
