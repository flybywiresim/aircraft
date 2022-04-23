#include "ElacComputer.h"
#include "ElacComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "LateralNormalLaw.h"
#include "LateralDirectLaw.h"
#include "PitchNormalLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

const uint8_T ElacComputer_IN_InAir{ 1U };

const uint8_T ElacComputer_IN_OnGround{ 2U };

const real_T ElacComputer_RGND{ 0.0 };

const boolean_T ElacComputer_BGND{ false };

void ElacComputer::ElacComputer_MATLABFunction(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void ElacComputer::ElacComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_ElacComputer_k_T *localDW)
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

void ElacComputer::ElacComputer_MATLABFunction_m(real_T rtu_u, real_T rtu_highTrigger, real_T rtu_lowTrigger, boolean_T *
  rty_y, rtDW_MATLABFunction_ElacComputer_o_T *localDW)
{
  boolean_T output_tmp;
  output_tmp = !localDW->output;
  localDW->output = ((output_tmp && (rtu_u >= rtu_highTrigger)) || ((output_tmp || (rtu_u > rtu_lowTrigger)) &&
    localDW->output));
  *rty_y = localDW->output;
}

void ElacComputer::ElacComputer_MATLABFunction_g(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_ElacComputer_b_T *localDW)
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

void ElacComputer::ElacComputer_MATLABFunction_cw(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void ElacComputer::ElacComputer_LateralLawCaptoBits(lateral_efcs_law rtu_law, boolean_T *rty_bit1, boolean_T *rty_bit2)
{
  *rty_bit1 = (rtu_law == lateral_efcs_law::NormalLaw);
  *rty_bit2 = (rtu_law == lateral_efcs_law::DirectLaw);
}

void ElacComputer::step()
{
  real_T rtb_xi_deg;
  real_T rtb_zeta_deg;
  real_T rtb_xi_deg_n;
  real_T rtb_zeta_deg_l;
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_deg;
  real_T rtb_eta_deg_o;
  real_T rtb_eta_trim_deg_b;
  real_T rtb_eta_deg_od;
  real_T rtb_eta_trim_deg_j;
  real_T rtb_DataTypeConversion4_tmp;
  real_T rtb_DataTypeConversion5_a;
  real_T rtb_DataTypeConversion5_tmp;
  real_T rtb_DataTypeConversion6_tmp;
  real_T rtb_Gain;
  real_T rtb_Gain1;
  real_T rtb_Gain1_m;
  real_T rtb_Gain2;
  real_T rtb_Gain3;
  real_T rtb_Gain_m;
  real_T rtb_Saturation;
  real_T rtb_eta_trim_deg_i;
  real_T rtb_logic_crg_total_sidestick_roll_command;
  real32_T rtb_y_l;
  uint32_T rtb_DataTypeConversion1;
  uint32_T rtb_Switch13;
  uint32_T rtb_Switch15;
  uint32_T rtb_y;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_a[19];
  boolean_T canEngageInPitch;
  boolean_T canEngageInPitch_tmp;
  boolean_T canEngageInRoll;
  boolean_T hasPriorityInPitch;
  boolean_T hasPriorityInRoll;
  boolean_T leftAileronAvail;
  boolean_T rightAileronAvail;
  boolean_T rtb_NOT;
  boolean_T rtb_NOT_k;
  boolean_T rtb_OR;
  boolean_T rtb_OR2;
  boolean_T rtb_OR3;
  boolean_T rtb_isEngagedInPitch;
  boolean_T rtb_isEngagedInRoll;
  boolean_T rtb_leftAileronCrossCommandActive;
  boolean_T rtb_logic_crg1_is_blue_hydraulic_power_avail;
  boolean_T rtb_logic_crg1_is_green_hydraulic_power_avail;
  boolean_T rtb_logic_crg1_tracking_mode_on;
  boolean_T rtb_rightAileronCrossCommandActive;
  lateral_efcs_law priorityPitchLateralLawCap;
  lateral_efcs_law rtb_activeLateralLaw;
  lateral_efcs_law rtb_lateralLawCapability;
  lateral_efcs_law rtb_oppElacRollCapability;
  pitch_efcs_law priorityPitchPitchLawCap;
  ElacComputer_Y.out.data = ElacComputer_U.in;
  rtb_OR2 = (ElacComputer_U.in.discrete_inputs.lgciu_1_left_main_gear_pressed ||
             ElacComputer_U.in.discrete_inputs.lgciu_2_left_main_gear_pressed);
  rtb_OR3 = (ElacComputer_U.in.discrete_inputs.lgciu_1_right_main_gear_pressed ||
             ElacComputer_U.in.discrete_inputs.lgciu_2_right_main_gear_pressed);
  if (ElacComputer_DWork.is_active_c8_ElacComputer == 0U) {
    ElacComputer_DWork.is_active_c8_ElacComputer = 1U;
    ElacComputer_DWork.is_c8_ElacComputer = ElacComputer_IN_OnGround;
    rtb_OR2 = true;
  } else if (ElacComputer_DWork.is_c8_ElacComputer == ElacComputer_IN_InAir) {
    if ((static_cast<real_T>(rtb_OR2) > 0.1) || (static_cast<real_T>(rtb_OR3) > 0.1)) {
      ElacComputer_DWork.is_c8_ElacComputer = ElacComputer_IN_OnGround;
      rtb_OR2 = true;
    } else {
      rtb_OR2 = false;
    }
  } else if ((!rtb_OR2) && (!rtb_OR3)) {
    ElacComputer_DWork.is_c8_ElacComputer = ElacComputer_IN_InAir;
    rtb_OR2 = false;
  } else {
    rtb_OR2 = true;
  }

  ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.yellow_hyd_pressure_psi,
    ElacComputer_P.HysteresisNode2_highTrigger, ElacComputer_P.HysteresisNode2_lowTrigger, &rtb_NOT_k,
    &ElacComputer_DWork.sf_MATLABFunction_jg);
  ElacComputer_MATLABFunction_c((!ElacComputer_U.in.discrete_inputs.yellow_low_pressure) && rtb_NOT_k,
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge, ElacComputer_P.ConfirmNode_timeDelay, &rtb_OR3,
    &ElacComputer_DWork.sf_MATLABFunction_c);
  ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.blue_hyd_pressure_psi,
    ElacComputer_P.HysteresisNode1_highTrigger, ElacComputer_P.HysteresisNode1_lowTrigger, &rtb_NOT_k,
    &ElacComputer_DWork.sf_MATLABFunction_m);
  ElacComputer_MATLABFunction_c((!ElacComputer_U.in.discrete_inputs.blue_low_pressure) && rtb_NOT_k,
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode1_isRisingEdge, ElacComputer_P.ConfirmNode1_timeDelay, &rtb_NOT,
    &ElacComputer_DWork.sf_MATLABFunction_g);
  ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.green_hyd_pressure_psi,
    ElacComputer_P.HysteresisNode3_highTrigger, ElacComputer_P.HysteresisNode3_lowTrigger, &rtb_NOT_k,
    &ElacComputer_DWork.sf_MATLABFunction_br);
  ElacComputer_MATLABFunction_c((!ElacComputer_U.in.discrete_inputs.green_low_pressure) && rtb_NOT_k,
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode2_isRisingEdge, ElacComputer_P.ConfirmNode2_timeDelay,
    &rtb_NOT_k, &ElacComputer_DWork.sf_MATLABFunction_gf);
  rtb_logic_crg1_is_blue_hydraulic_power_avail = rtb_NOT;
  rtb_logic_crg1_is_green_hydraulic_power_avail = rtb_NOT_k;
  ElacComputer_MATLABFunction_g(ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
    ElacComputer_P.PulseNode_isRisingEdge, &rtb_NOT, &ElacComputer_DWork.sf_MATLABFunction_g4);
  ElacComputer_MATLABFunction_g(ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
    ElacComputer_P.PulseNode1_isRisingEdge, &rtb_NOT_k, &ElacComputer_DWork.sf_MATLABFunction_nu);
  if (rtb_NOT) {
    ElacComputer_DWork.pRightStickDisabled = true;
    ElacComputer_DWork.pLeftStickDisabled = false;
  } else if (rtb_NOT_k) {
    ElacComputer_DWork.pLeftStickDisabled = true;
    ElacComputer_DWork.pRightStickDisabled = false;
  }

  if (ElacComputer_DWork.pRightStickDisabled && ((!ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed) &&
       (!ElacComputer_DWork.Delay1_DSTATE))) {
    ElacComputer_DWork.pRightStickDisabled = false;
  } else if (ElacComputer_DWork.pLeftStickDisabled) {
    ElacComputer_DWork.pLeftStickDisabled = (ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed ||
      ElacComputer_DWork.Delay_DSTATE);
  }

  ElacComputer_MATLABFunction_c(ElacComputer_DWork.pLeftStickDisabled &&
    (ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || ElacComputer_DWork.Delay_DSTATE),
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode1_isRisingEdge_k, ElacComputer_P.ConfirmNode1_timeDelay_a,
    &ElacComputer_DWork.Delay_DSTATE, &ElacComputer_DWork.sf_MATLABFunction_j2);
  ElacComputer_MATLABFunction_c(ElacComputer_DWork.pRightStickDisabled &&
    (ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || ElacComputer_DWork.Delay1_DSTATE),
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge_j, ElacComputer_P.ConfirmNode_timeDelay_a,
    &ElacComputer_DWork.Delay1_DSTATE, &ElacComputer_DWork.sf_MATLABFunction_g2);
  if (!ElacComputer_DWork.pRightStickDisabled) {
    rtb_logic_crg_total_sidestick_roll_command = ElacComputer_U.in.analog_inputs.fo_pitch_stick_pos;
  } else {
    rtb_logic_crg_total_sidestick_roll_command = ElacComputer_P.Constant_Value_p;
  }

  if (ElacComputer_DWork.pLeftStickDisabled) {
    rtb_DataTypeConversion4_tmp = ElacComputer_P.Constant_Value_p;
  } else {
    rtb_DataTypeConversion4_tmp = ElacComputer_U.in.analog_inputs.capt_pitch_stick_pos;
  }

  rtb_Saturation = rtb_logic_crg_total_sidestick_roll_command + rtb_DataTypeConversion4_tmp;
  if (rtb_Saturation > ElacComputer_P.Saturation_UpperSat) {
    rtb_Saturation = ElacComputer_P.Saturation_UpperSat;
  } else if (rtb_Saturation < ElacComputer_P.Saturation_LowerSat) {
    rtb_Saturation = ElacComputer_P.Saturation_LowerSat;
  }

  if (!ElacComputer_DWork.pRightStickDisabled) {
    rtb_logic_crg_total_sidestick_roll_command = ElacComputer_U.in.analog_inputs.fo_roll_stick_pos;
  } else {
    rtb_logic_crg_total_sidestick_roll_command = ElacComputer_P.Constant1_Value_p;
  }

  if (ElacComputer_DWork.pLeftStickDisabled) {
    rtb_DataTypeConversion4_tmp = ElacComputer_P.Constant1_Value_p;
  } else {
    rtb_DataTypeConversion4_tmp = ElacComputer_U.in.analog_inputs.capt_roll_stick_pos;
  }

  rtb_eta_trim_deg_i = rtb_logic_crg_total_sidestick_roll_command + rtb_DataTypeConversion4_tmp;
  if (rtb_eta_trim_deg_i > ElacComputer_P.Saturation1_UpperSat) {
    rtb_eta_trim_deg_i = ElacComputer_P.Saturation1_UpperSat;
  } else if (rtb_eta_trim_deg_i < ElacComputer_P.Saturation1_LowerSat) {
    rtb_eta_trim_deg_i = ElacComputer_P.Saturation1_LowerSat;
  }

  if (ElacComputer_U.in.discrete_inputs.is_unit_1) {
    rtb_NOT_k = ((!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) &&
                 rtb_logic_crg1_is_blue_hydraulic_power_avail);
    rtb_NOT = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_logic_crg1_is_blue_hydraulic_power_avail);
    rtb_OR = rtb_logic_crg1_is_blue_hydraulic_power_avail;
  } else {
    rtb_NOT_k = ((!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) &&
                 rtb_logic_crg1_is_green_hydraulic_power_avail);
    rtb_NOT = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_OR3);
    rtb_OR = ((rtb_OR3 && rtb_logic_crg1_is_green_hydraulic_power_avail) ||
              ((!rtb_logic_crg1_is_blue_hydraulic_power_avail) && (rtb_logic_crg1_is_green_hydraulic_power_avail ||
                rtb_OR3)));
  }

  canEngageInPitch_tmp = !ElacComputer_U.in.discrete_inputs.ths_motor_fault;
  canEngageInPitch = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) &&
                      (!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) && canEngageInPitch_tmp && rtb_OR);
  rtb_leftAileronCrossCommandActive = !ElacComputer_U.in.discrete_inputs.is_unit_1;
  hasPriorityInPitch = (rtb_leftAileronCrossCommandActive || ElacComputer_U.in.discrete_inputs.opp_axis_pitch_failure);
  rtb_isEngagedInPitch = (canEngageInPitch && hasPriorityInPitch);
  if (ElacComputer_U.in.discrete_inputs.is_unit_1) {
    leftAileronAvail = ((!ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) &&
                        rtb_logic_crg1_is_blue_hydraulic_power_avail);
    rightAileronAvail = ((!ElacComputer_U.in.discrete_inputs.r_ail_servo_failed) &&
                         rtb_logic_crg1_is_green_hydraulic_power_avail);
  } else {
    leftAileronAvail = ((!ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) &&
                        rtb_logic_crg1_is_green_hydraulic_power_avail);
    rightAileronAvail = ((!ElacComputer_U.in.discrete_inputs.r_ail_servo_failed) &&
                         rtb_logic_crg1_is_blue_hydraulic_power_avail);
  }

  canEngageInRoll = (leftAileronAvail || rightAileronAvail);
  hasPriorityInRoll = (ElacComputer_U.in.discrete_inputs.is_unit_1 ||
                       (ElacComputer_U.in.discrete_inputs.opp_left_aileron_lost &&
                        ElacComputer_U.in.discrete_inputs.opp_right_aileron_lost));
  rtb_OR = !hasPriorityInRoll;
  if (rtb_leftAileronCrossCommandActive && rtb_OR && (ElacComputer_U.in.bus_inputs.elac_opp_bus.aileron_command_deg.SSM ==
       static_cast<uint32_T>(SignStatusMatrix::NormalOperation))) {
    rtb_leftAileronCrossCommandActive = (ElacComputer_U.in.discrete_inputs.opp_left_aileron_lost && leftAileronAvail);
    rtb_rightAileronCrossCommandActive = (ElacComputer_U.in.discrete_inputs.opp_right_aileron_lost && rightAileronAvail);
  } else {
    rtb_leftAileronCrossCommandActive = false;
    rtb_rightAileronCrossCommandActive = false;
  }

  rtb_isEngagedInRoll = (canEngageInRoll && hasPriorityInRoll);
  rtb_logic_crg1_tracking_mode_on = ((!ElacComputer_U.in.discrete_inputs.ap_1_disengaged) ||
    (!ElacComputer_U.in.discrete_inputs.ap_2_disengaged) || ElacComputer_U.in.sim_data.slew_on ||
    ElacComputer_U.in.sim_data.pause_on || ElacComputer_U.in.sim_data.tracking_mode_on_override);
  rtb_lateralLawCapability = lateral_efcs_law::NormalLaw;
  if (ElacComputer_U.in.discrete_inputs.fac_1_yaw_control_lost &&
      ElacComputer_U.in.discrete_inputs.fac_2_yaw_control_lost) {
    rtb_lateralLawCapability = lateral_efcs_law::DirectLaw;
  }

  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel_bit, &rtb_y);
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel1_bit, &rtb_Switch15);
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel2_bit, &rtb_DataTypeConversion1);
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel3_bit, &rtb_Switch13);
  if ((rtb_DataTypeConversion1 != 0U) && (rtb_Switch13 == 0U)) {
    rtb_oppElacRollCapability = lateral_efcs_law::NormalLaw;
  } else if ((rtb_DataTypeConversion1 == 0U) && (rtb_Switch13 != 0U)) {
    rtb_oppElacRollCapability = lateral_efcs_law::DirectLaw;
  } else {
    rtb_oppElacRollCapability = lateral_efcs_law::None;
  }

  if (hasPriorityInPitch && rtb_isEngagedInPitch) {
    priorityPitchPitchLawCap = pitch_efcs_law::NormalLaw;
    priorityPitchLateralLawCap = rtb_lateralLawCapability;
  } else if ((!hasPriorityInPitch) || (!rtb_isEngagedInPitch)) {
    if ((rtb_y != 0U) && (rtb_Switch15 == 0U)) {
      priorityPitchPitchLawCap = pitch_efcs_law::NormalLaw;
    } else if ((rtb_y == 0U) && (rtb_Switch15 != 0U)) {
      priorityPitchPitchLawCap = pitch_efcs_law::AlternateLaw1;
    } else if ((rtb_y != 0U) && (rtb_Switch15 != 0U)) {
      priorityPitchPitchLawCap = pitch_efcs_law::DirectLaw;
    } else {
      priorityPitchPitchLawCap = pitch_efcs_law::None;
    }

    priorityPitchLateralLawCap = rtb_oppElacRollCapability;
  } else {
    priorityPitchPitchLawCap = pitch_efcs_law::None;
    priorityPitchLateralLawCap = lateral_efcs_law::None;
  }

  if (hasPriorityInRoll && rtb_isEngagedInRoll) {
    rtb_oppElacRollCapability = rtb_lateralLawCapability;
  } else if ((!rtb_OR) && rtb_isEngagedInRoll) {
    rtb_oppElacRollCapability = lateral_efcs_law::None;
  }

  if (rtb_isEngagedInRoll && (rtb_oppElacRollCapability == lateral_efcs_law::NormalLaw) && (priorityPitchPitchLawCap ==
       pitch_efcs_law::NormalLaw) && (priorityPitchLateralLawCap == lateral_efcs_law::NormalLaw)) {
    rtb_activeLateralLaw = lateral_efcs_law::NormalLaw;
  } else if (rtb_isEngagedInRoll && ((rtb_oppElacRollCapability != lateral_efcs_law::NormalLaw) ||
              (priorityPitchPitchLawCap != pitch_efcs_law::NormalLaw) || (priorityPitchLateralLawCap != lateral_efcs_law::
               NormalLaw))) {
    rtb_activeLateralLaw = lateral_efcs_law::DirectLaw;
  } else {
    rtb_activeLateralLaw = lateral_efcs_law::None;
  }

  if (rtb_isEngagedInPitch && (rtb_oppElacRollCapability == lateral_efcs_law::NormalLaw) && (priorityPitchPitchLawCap ==
       pitch_efcs_law::NormalLaw) && (priorityPitchLateralLawCap == lateral_efcs_law::NormalLaw)) {
    priorityPitchPitchLawCap = pitch_efcs_law::NormalLaw;
  } else if (rtb_isEngagedInPitch && (rtb_oppElacRollCapability != lateral_efcs_law::NormalLaw)) {
    priorityPitchPitchLawCap = pitch_efcs_law::AlternateLaw1;
  } else {
    priorityPitchPitchLawCap = pitch_efcs_law::None;
  }

  rtb_logic_crg_total_sidestick_roll_command = rtb_eta_trim_deg_i;
  rtb_Gain_m = ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  rtb_Gain = ElacComputer_P.Gain_Gain * ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  rtb_Gain2 = ElacComputer_P.Gain2_Gain * ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  rtb_Gain1 = ElacComputer_P.Gain1_Gain * ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  rtb_DataTypeConversion4_tmp = ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
  rtb_DataTypeConversion5_tmp = ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
  rtb_DataTypeConversion6_tmp = ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
  rtb_OR = (rtb_logic_crg1_tracking_mode_on || (static_cast<real_T>(rtb_activeLateralLaw) !=
             ElacComputer_P.CompareToConstant_const));
  LawMDLOBJ2.step(&ElacComputer_U.in.time.dt, &rtb_Gain_m, &rtb_Gain, &rtb_Gain2, &rtb_Gain1,
                  &rtb_DataTypeConversion4_tmp, &rtb_DataTypeConversion5_tmp, &rtb_DataTypeConversion6_tmp,
                  &rtb_eta_trim_deg_i, &ElacComputer_U.in.analog_inputs.rudder_pedal_pos, &rtb_OR2, &rtb_OR, (
    const_cast<boolean_T*>(&ElacComputer_BGND)), (const_cast<boolean_T*>(&ElacComputer_BGND)), &rtb_xi_deg,
                  &rtb_zeta_deg);
  LawMDLOBJ1.step(&ElacComputer_U.in.time.dt, (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), &rtb_eta_trim_deg_i, &rtb_OR2, &rtb_xi_deg_n, &rtb_zeta_deg_l);
  switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
   case 0:
    rtb_Gain1 = rtb_xi_deg;
    break;

   case 1:
    rtb_Gain1 = rtb_xi_deg_n;
    break;

   default:
    rtb_Gain1 = ElacComputer_P.Constant_Value_c;
    break;
  }

  rtb_Gain_m = ElacComputer_P.Gain_Gain_m * rtb_Gain1;
  switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
   case 0:
    rtb_Gain = rtb_zeta_deg;
    break;

   case 1:
    rtb_Gain = rtb_zeta_deg_l;
    break;

   default:
    rtb_Gain = ElacComputer_P.Constant_Value_c;
    break;
  }

  rtb_Gain2 = rtb_Gain1;
  rtb_eta_trim_deg_i = ElacComputer_P.Gain4_Gain * ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  rtb_Gain1 = ElacComputer_P.Gain_Gain_a * ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  rtb_Gain1_m = ElacComputer_P.Gain1_Gain_p * ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  rtb_Gain3 = ElacComputer_P.Gain3_Gain * ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  rtb_DataTypeConversion5_a = ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
  rtb_OR = (rtb_logic_crg1_tracking_mode_on || (static_cast<real_T>(priorityPitchPitchLawCap) !=
             ElacComputer_P.CompareToConstant_const_f));
  LawMDLOBJ5.step(&ElacComputer_U.in.time.dt, &ElacComputer_U.in.time.simulation_time, &rtb_eta_trim_deg_i, &rtb_Gain1,
                  &rtb_Gain1_m, &rtb_Gain3, (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), &rtb_DataTypeConversion5_a,
                  &rtb_DataTypeConversion4_tmp, &rtb_DataTypeConversion5_tmp, &rtb_DataTypeConversion6_tmp, (const_cast<
    real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)),
                  (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)),
                  (const_cast<boolean_T*>(&ElacComputer_BGND)), (const_cast<real_T*>(&ElacComputer_RGND)),
                  &rtb_Saturation, &rtb_OR2, &rtb_OR, (const_cast<boolean_T*>(&ElacComputer_BGND)),
                  (const_cast<boolean_T*>(&ElacComputer_BGND)), (const_cast<real_T*>(&ElacComputer_RGND)),
                  (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)),
                  (const_cast<real_T*>(&ElacComputer_RGND)), &rtb_eta_deg, &rtb_eta_trim_deg);
  rtb_OR = (rtb_logic_crg1_tracking_mode_on || ((static_cast<real_T>(priorityPitchPitchLawCap) !=
              ElacComputer_P.CompareToConstant2_const) && (static_cast<real_T>(priorityPitchPitchLawCap) !=
              ElacComputer_P.CompareToConstant3_const)));
  LawMDLOBJ3.step(&ElacComputer_U.in.time.dt, &ElacComputer_U.in.time.simulation_time, (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (
    const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (
    const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (
    const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), &rtb_Saturation, &rtb_OR2, &rtb_OR, (const_cast<boolean_T*>(&ElacComputer_BGND)), (
    const_cast<boolean_T*>(&ElacComputer_BGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)),
                  &rtb_eta_deg_o, &rtb_eta_trim_deg_b);
  rtb_OR = (rtb_logic_crg1_tracking_mode_on || (static_cast<real_T>(priorityPitchPitchLawCap) !=
             ElacComputer_P.CompareToConstant1_const));
  LawMDLOBJ4.step(&ElacComputer_U.in.time.dt, &ElacComputer_U.in.time.simulation_time, (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (
    const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (
    const_cast<real_T*>(&ElacComputer_RGND)), &rtb_Saturation, &rtb_OR2, &rtb_OR, (const_cast<boolean_T*>
    (&ElacComputer_BGND)), (const_cast<boolean_T*>(&ElacComputer_BGND)), &rtb_eta_deg_od, &rtb_eta_trim_deg_j);
  switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
   case 0:
    rtb_Gain1 = rtb_eta_deg;
    break;

   case 1:
   case 2:
    rtb_Gain1 = rtb_eta_deg_o;
    break;

   case 3:
    rtb_Gain1 = rtb_eta_deg_od;
    break;

   default:
    rtb_Gain1 = ElacComputer_P.Constant_Value_a;
    break;
  }

  switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
   case 0:
    rtb_eta_trim_deg_i = rtb_eta_trim_deg;
    break;

   case 1:
   case 2:
    rtb_eta_trim_deg_i = rtb_eta_trim_deg_b;
    break;

   case 3:
    rtb_eta_trim_deg_i = rtb_eta_trim_deg_j;
    break;

   default:
    rtb_eta_trim_deg_i = ElacComputer_P.Constant_Value_a;
    break;
  }

  ElacComputer_Y.out.discrete_outputs.pitch_axis_ok = canEngageInPitch;
  ElacComputer_Y.out.discrete_outputs.left_aileron_ok = leftAileronAvail;
  ElacComputer_Y.out.discrete_outputs.right_aileron_ok = rightAileronAvail;
  ElacComputer_Y.out.discrete_outputs.digital_output_validated = ElacComputer_P.Constant1_Value_e;
  ElacComputer_Y.out.discrete_outputs.ap_1_authorised = ElacComputer_P.Constant_Value_h;
  ElacComputer_Y.out.discrete_outputs.ap_2_authorised = ElacComputer_P.Constant_Value_h;
  ElacComputer_Y.out.discrete_outputs.left_aileron_active_mode = ((rtb_isEngagedInRoll ||
    rtb_leftAileronCrossCommandActive) && leftAileronAvail);
  ElacComputer_Y.out.discrete_outputs.right_aileron_active_mode = ((rtb_isEngagedInRoll ||
    rtb_rightAileronCrossCommandActive) && rightAileronAvail);
  rtb_OR = (rtb_isEngagedInPitch && rtb_NOT_k);
  ElacComputer_Y.out.discrete_outputs.left_elevator_damping_mode = rtb_OR;
  ElacComputer_Y.out.discrete_outputs.right_elevator_damping_mode = rtb_OR;
  ElacComputer_Y.out.discrete_outputs.ths_active = (rtb_isEngagedInPitch && canEngageInPitch_tmp);
  ElacComputer_Y.out.analog_outputs.left_elev_pos_order_deg = rtb_Gain1;
  ElacComputer_Y.out.analog_outputs.right_elev_pos_order_deg = rtb_Gain1;
  ElacComputer_Y.out.analog_outputs.ths_pos_order = rtb_eta_trim_deg_i;
  ElacComputer_Y.out.analog_outputs.left_aileron_pos_order = rtb_Gain_m;
  ElacComputer_Y.out.analog_outputs.right_aileron_pos_order = rtb_Gain2;
  if (ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) {
    ElacComputer_Y.out.bus_outputs.left_aileron_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    ElacComputer_Y.out.bus_outputs.left_aileron_position_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant_Value);
  } else {
    ElacComputer_Y.out.bus_outputs.left_aileron_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.left_aileron_position_deg.Data = static_cast<real32_T>
      (ElacComputer_U.in.analog_inputs.left_aileron_pos_deg);
  }

  if (ElacComputer_U.in.discrete_inputs.r_ail_servo_failed) {
    ElacComputer_Y.out.bus_outputs.right_aileron_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    ElacComputer_Y.out.bus_outputs.right_aileron_position_deg.Data = static_cast<real32_T>
      (ElacComputer_P.Constant1_Value_d);
  } else {
    ElacComputer_Y.out.bus_outputs.right_aileron_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.right_aileron_position_deg.Data = static_cast<real32_T>
      (ElacComputer_U.in.analog_inputs.right_aileron_pos_deg);
  }

  if (ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) {
    ElacComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    ElacComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
      (ElacComputer_P.Constant2_Value);
  } else {
    ElacComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
      (ElacComputer_U.in.analog_inputs.right_elevator_pos_deg);
  }

  if (ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) {
    ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
      (ElacComputer_P.Constant3_Value);
  } else {
    ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
      (ElacComputer_U.in.analog_inputs.right_elevator_pos_deg);
  }

  if (ElacComputer_U.in.discrete_inputs.ths_motor_fault) {
    ElacComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>(ElacComputer_P.EnumeratedConstant_Value);
    ElacComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant4_Value_i);
  } else {
    ElacComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>(ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
      (ElacComputer_U.in.analog_inputs.ths_pos_deg);
  }

  ElacComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = ElacComputer_P.Gain_Gain_b *
    static_cast<real32_T>(ElacComputer_U.in.analog_inputs.capt_pitch_stick_pos);
  ElacComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = ElacComputer_P.Gain1_Gain_f *
    static_cast<real32_T>(ElacComputer_U.in.analog_inputs.fo_pitch_stick_pos);
  ElacComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = ElacComputer_P.Gain2_Gain_cb *
    static_cast<real32_T>(ElacComputer_U.in.analog_inputs.capt_roll_stick_pos);
  ElacComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = ElacComputer_P.Gain3_Gain_g *
    static_cast<real32_T>(ElacComputer_U.in.analog_inputs.fo_roll_stick_pos);
  ElacComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = ElacComputer_P.Gain4_Gain_l * static_cast<real32_T>
    (ElacComputer_U.in.analog_inputs.rudder_pedal_pos);
  ElacComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  if (((!leftAileronAvail) || (!rightAileronAvail)) && rtb_isEngagedInRoll) {
    ElacComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = 0.0F;
  } else {
    ElacComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant5_Value);
  }

  if (rtb_isEngagedInRoll) {
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = 0.0F;
  } else {
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant6_Value);
  }

  if (ElacComputer_P.EnumeratedConstant2_Value == rtb_activeLateralLaw) {
    ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    rtb_y_l = static_cast<real32_T>(rtb_Gain);
  } else {
    ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    rtb_y_l = static_cast<real32_T>(ElacComputer_P.Constant7_Value);
  }

  ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.Data = rtb_y_l;
  rtb_VectorConcatenate[0] = ElacComputer_U.in.discrete_inputs.l_ail_servo_failed;
  rtb_VectorConcatenate[1] = ElacComputer_U.in.discrete_inputs.r_ail_servo_failed;
  rtb_VectorConcatenate[2] = ElacComputer_U.in.discrete_inputs.l_elev_servo_failed;
  rtb_VectorConcatenate[3] = ElacComputer_U.in.discrete_inputs.r_elev_servo_failed;
  rtb_VectorConcatenate[4] = leftAileronAvail;
  rtb_VectorConcatenate[5] = rightAileronAvail;
  rtb_VectorConcatenate[6] = rtb_NOT_k;
  rtb_VectorConcatenate[7] = rtb_NOT;
  rtb_VectorConcatenate[8] = rtb_isEngagedInPitch;
  rtb_VectorConcatenate[9] = rtb_isEngagedInRoll;
  rtb_VectorConcatenate[10] = !canEngageInPitch;
  rtb_VectorConcatenate[11] = !canEngageInRoll;
  rtb_VectorConcatenate[12] = ((priorityPitchPitchLawCap == pitch_efcs_law::NormalLaw) || (priorityPitchPitchLawCap ==
    pitch_efcs_law::AlternateLaw2));
  rtb_VectorConcatenate[13] = ((priorityPitchPitchLawCap == pitch_efcs_law::AlternateLaw1) || (priorityPitchPitchLawCap ==
    pitch_efcs_law::AlternateLaw2));
  rtb_VectorConcatenate[14] = (priorityPitchPitchLawCap == pitch_efcs_law::DirectLaw);
  ElacComputer_LateralLawCaptoBits(rtb_activeLateralLaw, &rtb_VectorConcatenate[15], &rtb_VectorConcatenate[16]);
  rtb_VectorConcatenate[17] = ElacComputer_P.Constant8_Value;
  rtb_VectorConcatenate[18] = ElacComputer_P.Constant8_Value;
  ElacComputer_MATLABFunction_cw(rtb_VectorConcatenate, &ElacComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
  ElacComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  rtb_VectorConcatenate_a[0] = true;
  rtb_VectorConcatenate_a[1] = false;
  ElacComputer_LateralLawCaptoBits(rtb_lateralLawCapability, &rtb_VectorConcatenate_a[2], &rtb_VectorConcatenate_a[3]);
  rtb_VectorConcatenate_a[4] = ElacComputer_P.Constant9_Value;
  rtb_VectorConcatenate_a[5] = ElacComputer_P.Constant9_Value;
  rtb_VectorConcatenate_a[6] = ElacComputer_DWork.pLeftStickDisabled;
  rtb_VectorConcatenate_a[7] = ElacComputer_DWork.pRightStickDisabled;
  rtb_VectorConcatenate_a[8] = ElacComputer_DWork.Delay_DSTATE;
  rtb_VectorConcatenate_a[9] = ElacComputer_DWork.Delay1_DSTATE;
  rtb_VectorConcatenate_a[10] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[11] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[12] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[13] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[14] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[15] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[16] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[17] = ElacComputer_P.Constant10_Value;
  rtb_VectorConcatenate_a[18] = ElacComputer_P.Constant10_Value;
  ElacComputer_MATLABFunction_cw(rtb_VectorConcatenate_a, &rtb_y_l);
  ElacComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.discrete_status_word_2.Data = rtb_y_l;
  ElacComputer_Y.out.laws.lateral_law_outputs.left_aileron_command_deg = rtb_Gain_m;
  ElacComputer_Y.out.laws.lateral_law_outputs.right_aileron_command_deg = rtb_Gain2;
  ElacComputer_Y.out.laws.lateral_law_outputs.yaw_damper_command_deg = rtb_Gain;
  ElacComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_Gain1;
  ElacComputer_Y.out.laws.pitch_law_outputs.ths_command_deg = rtb_eta_trim_deg_i;
  ElacComputer_Y.out.logic.on_ground = rtb_OR2;
  ElacComputer_Y.out.logic.tracking_mode_on = rtb_logic_crg1_tracking_mode_on;
  ElacComputer_Y.out.logic.lateral_law_capability = rtb_lateralLawCapability;
  ElacComputer_Y.out.logic.active_lateral_law = rtb_activeLateralLaw;
  ElacComputer_Y.out.logic.pitch_law_capability = pitch_efcs_law::NormalLaw;
  ElacComputer_Y.out.logic.active_pitch_law = priorityPitchPitchLawCap;
  ElacComputer_Y.out.logic.is_engaged_in_pitch = rtb_isEngagedInPitch;
  ElacComputer_Y.out.logic.can_engage_in_pitch = canEngageInPitch;
  ElacComputer_Y.out.logic.has_priority_in_pitch = hasPriorityInPitch;
  ElacComputer_Y.out.logic.left_elevator_avail = rtb_NOT_k;
  ElacComputer_Y.out.logic.right_elevator_avail = rtb_NOT;
  ElacComputer_Y.out.logic.is_engaged_in_roll = rtb_isEngagedInRoll;
  ElacComputer_Y.out.logic.can_engage_in_roll = canEngageInRoll;
  ElacComputer_Y.out.logic.has_priority_in_roll = hasPriorityInRoll;
  ElacComputer_Y.out.logic.left_aileron_crosscommand_active = rtb_leftAileronCrossCommandActive;
  ElacComputer_Y.out.logic.right_aileron_crosscommand_active = rtb_rightAileronCrossCommandActive;
  ElacComputer_Y.out.logic.left_aileron_avail = leftAileronAvail;
  ElacComputer_Y.out.logic.right_aileron_avail = rightAileronAvail;
  ElacComputer_Y.out.logic.is_yellow_hydraulic_power_avail = rtb_OR3;
  ElacComputer_Y.out.logic.is_blue_hydraulic_power_avail = rtb_logic_crg1_is_blue_hydraulic_power_avail;
  ElacComputer_Y.out.logic.is_green_hydraulic_power_avail = rtb_logic_crg1_is_green_hydraulic_power_avail;
  ElacComputer_Y.out.logic.left_sidestick_disabled = ElacComputer_DWork.pLeftStickDisabled;
  ElacComputer_Y.out.logic.right_sidestick_disabled = ElacComputer_DWork.pRightStickDisabled;
  ElacComputer_Y.out.logic.left_sidestick_priority_locked = ElacComputer_DWork.Delay_DSTATE;
  ElacComputer_Y.out.logic.right_sidestick_priority_locked = ElacComputer_DWork.Delay1_DSTATE;
  ElacComputer_Y.out.logic.total_sidestick_pitch_command = rtb_Saturation;
  ElacComputer_Y.out.logic.total_sidestick_roll_command = rtb_logic_crg_total_sidestick_roll_command;
  ElacComputer_Y.out.logic.adr_computation_data = ElacComputer_U.in.bus_inputs.adr_1_bus;
  ElacComputer_Y.out.logic.ir_computation_data = ElacComputer_U.in.bus_inputs.ir_1_bus;
}

void ElacComputer::initialize()
{
  ElacComputer_DWork.Delay_DSTATE = ElacComputer_P.Delay_InitialCondition;
  ElacComputer_DWork.Delay1_DSTATE = ElacComputer_P.Delay1_InitialCondition;
  LawMDLOBJ2.init();
  LawMDLOBJ5.init();
  LawMDLOBJ3.init();
}

void ElacComputer::terminate()
{
}

ElacComputer::ElacComputer():
  ElacComputer_U(),
  ElacComputer_Y(),
  ElacComputer_DWork()
{
}

ElacComputer::~ElacComputer()
{
}
