#include "A380SecComputer.h"
#include "rtwtypes.h"
#include "A380SecComputer_types.h"
#include <cmath>
#include "A380LateralDirectLaw.h"
#include "A380PitchDirectLaw.h"

void A380SecComputer::A380SecComputer_RateLimiter_Reset(rtDW_RateLimiter_A380SecComputer_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380SecComputer::A380SecComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380SecComputer_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380SecComputer::A380SecComputer_RateLimiter_j_Reset(rtDW_RateLimiter_A380SecComputer_o_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380SecComputer::A380SecComputer_RateLimiter_e(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380SecComputer_o_T *localDW)
{
  if ((!localDW->pY_not_empty) || rtu_reset) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  if (rtu_reset) {
    *rty_Y = rtu_init;
  } else {
    *rty_Y = std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts) +
      localDW->pY;
  }

  localDW->pY = *rty_Y;
}

void A380SecComputer::A380SecComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380SecComputer::A380SecComputer_MATLABFunction_p(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void A380SecComputer::A380SecComputer_MATLABFunction_p_Reset(rtDW_MATLABFunction_A380SecComputer_e_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void A380SecComputer::A380SecComputer_MATLABFunction_f(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_A380SecComputer_e_T *localDW)
{
  if (!localDW->previousInput_not_empty) {
    localDW->previousInput = rtu_isRisingEdge;
    localDW->previousInput_not_empty = true;
  }

  if (rtu_isRisingEdge) {
    *rty_y = (rtu_u && (!localDW->previousInput));
  } else {
    *rty_y = ((!rtu_u) && localDW->previousInput);
  }

  localDW->previousInput = rtu_u;
}

void A380SecComputer::A380SecComputer_MATLABFunction_h(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380SecComputer::A380SecComputer_MATLABFunction_k_Reset(rtDW_MATLABFunction_A380SecComputer_c_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380SecComputer::A380SecComputer_MATLABFunction_m(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380SecComputer_c_T *localDW)
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

void A380SecComputer::A380SecComputer_MATLABFunction_e(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380SecComputer::step()
{
  real_T rtb_xi_deg;
  real_T rtb_zeta_deg;
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_dot_deg_s;
  real_T rtb_eta_trim_limit_lo;
  real_T rtb_eta_trim_limit_up;
  const base_arinc_429 *rtb_Switch2_i_0;
  base_arinc_429 rtb_Switch1_a;
  real_T ca;
  real_T denom;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_aileron_1_command_deg;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_rudder_2_command_deg;
  real_T rtb_Switch10;
  real_T rtb_Switch11;
  real_T rtb_Switch13;
  real_T rtb_Switch14;
  real_T rtb_Switch2_a;
  real_T rtb_Switch3_hq;
  real_T rtb_Switch4;
  real_T rtb_Switch8_o;
  real_T rtb_Switch9;
  real_T rtb_Switch_h;
  real_T rtb_rightCommand;
  real_T u0;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_leftSpoilerCommand;
  real32_T rtb_leftSpoilerCommand_h;
  real32_T rtb_mach;
  real32_T rtb_n_x;
  real32_T rtb_n_y;
  real32_T rtb_n_z;
  real32_T rtb_phi;
  real32_T rtb_phi_dot;
  real32_T rtb_q;
  real32_T rtb_r;
  real32_T rtb_rightSpoilerCommand;
  real32_T rtb_rightSpoilerCommand_o;
  real32_T rtb_rudder1Command;
  real32_T rtb_rudder2Command;
  real32_T rtb_theta_dot;
  uint32_T rtb_y_a;
  uint32_T rtb_y_js;
  uint32_T rtb_y_k;
  int8_T rtb_DataTypeConversion_i;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_c[19];
  boolean_T elevator1Avail;
  boolean_T elevator2Avail;
  boolean_T elevator3Avail;
  boolean_T leftAileron1Avail;
  boolean_T leftAileron2Avail;
  boolean_T leftSpoilerHydraulicModeAvail;
  boolean_T rightAileron1Avail;
  boolean_T rightAileron2Avail;
  boolean_T rightSpoilerHydraulicModeAvail;
  boolean_T rtb_AND;
  boolean_T rtb_AND1_al;
  boolean_T rtb_AND1_d;
  boolean_T rtb_AND1_i;
  boolean_T rtb_AND1_l;
  boolean_T rtb_AND1_o;
  boolean_T rtb_AND2_a;
  boolean_T rtb_AND2_i;
  boolean_T rtb_AND3_dt;
  boolean_T rtb_AND4_e;
  boolean_T rtb_AND4_m;
  boolean_T rtb_AND5;
  boolean_T rtb_AND5_e;
  boolean_T rtb_AND6;
  boolean_T rtb_AND6_e;
  boolean_T rtb_AND7;
  boolean_T rtb_AND7_g;
  boolean_T rtb_AND7_j;
  boolean_T rtb_AND8;
  boolean_T rtb_AND9_e;
  boolean_T rtb_AND_b;
  boolean_T rtb_AND_c;
  boolean_T rtb_AND_h;
  boolean_T rtb_AND_n;
  boolean_T rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
  boolean_T rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
  boolean_T rtb_Compare_l;
  boolean_T rtb_NOT_bl;
  boolean_T rtb_NOT_h;
  boolean_T rtb_OR;
  boolean_T rtb_OR3;
  boolean_T rtb_OR6;
  boolean_T rtb_OR_m;
  boolean_T rtb_OR_o;
  boolean_T rtb_y_fyf;
  boolean_T rtb_y_ka;
  boolean_T rtb_y_m;
  boolean_T rtb_y_mk;
  boolean_T rudder1ElectricModeAvail;
  boolean_T rudder1ElectricModeHasPriority;
  boolean_T rudder1HydraulicModeAvail;
  boolean_T rudder1HydraulicModeHasPriority_tmp;
  boolean_T rudder2ElectricModeHasPriority;
  boolean_T rudderTrimAvail;
  boolean_T thsAvail;
  if (A380SecComputer_U.in.sim_data.computer_running) {
    if (!A380SecComputer_DWork.Runtime_MODE) {
      A380SecComputer_DWork.Delay_DSTATE_cc = A380SecComputer_P.Delay_InitialCondition;
      A380SecComputer_DWork.Delay1_DSTATE = A380SecComputer_P.Delay1_InitialCondition;
      A380SecComputer_DWork.Delay_DSTATE_d = A380SecComputer_P.Delay_InitialCondition_d;
      A380SecComputer_DWork.Memory_PreviousInput = A380SecComputer_P.SRFlipFlop1_initial_condition;
      A380SecComputer_DWork.Memory_PreviousInput_n = A380SecComputer_P.SRFlipFlop_initial_condition;
      A380SecComputer_DWork.Memory_PreviousInput_b = A380SecComputer_P.SRFlipFlop_initial_condition_i;
      A380SecComputer_DWork.icLoad = true;
      A380SecComputer_DWork.icLoad_l = true;
      A380SecComputer_DWork.pY_not_empty = false;
      A380SecComputer_DWork.pU_not_empty = false;
      A380SecComputer_MATLABFunction_k_Reset(&A380SecComputer_DWork.sf_MATLABFunction_mg);
      A380SecComputer_MATLABFunction_k_Reset(&A380SecComputer_DWork.sf_MATLABFunction_bd);
      A380SecComputer_MATLABFunction_p_Reset(&A380SecComputer_DWork.sf_MATLABFunction_g4);
      A380SecComputer_MATLABFunction_p_Reset(&A380SecComputer_DWork.sf_MATLABFunction_nu);
      A380SecComputer_DWork.pLeftStickDisabled = false;
      A380SecComputer_DWork.pRightStickDisabled = false;
      A380SecComputer_MATLABFunction_k_Reset(&A380SecComputer_DWork.sf_MATLABFunction_j2y);
      A380SecComputer_MATLABFunction_k_Reset(&A380SecComputer_DWork.sf_MATLABFunction_g2);
      A380SecComputer_MATLABFunction_p_Reset(&A380SecComputer_DWork.sf_MATLABFunction_ek);
      A380SecComputer_MATLABFunction_p_Reset(&A380SecComputer_DWork.sf_MATLABFunction_mf);
      A380SecComputer_MATLABFunction_p_Reset(&A380SecComputer_DWork.sf_MATLABFunction_f);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_bh);
      LawMDLOBJ1.reset();
      A380SecComputer_RateLimiter_Reset(&A380SecComputer_DWork.sf_RateLimiter);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_e);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_o);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_a);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_p);
      A380SecComputer_RateLimiter_Reset(&A380SecComputer_DWork.sf_RateLimiter_b);
      A380SecComputer_DWork.pY_not_empty_k = false;
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_os);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_d);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_bv);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_g);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_j);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_gz);
      LawMDLOBJ2.reset();
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_c);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_p0);
      A380SecComputer_RateLimiter_j_Reset(&A380SecComputer_DWork.sf_RateLimiter_cd);
      A380SecComputer_DWork.Runtime_MODE = true;
    }

    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.adcn_inputs.eec_1.ecu_status_word_4,
      A380SecComputer_P.BitfromLabel3_bit, &rtb_y_a);
    rtb_y_fyf = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.adcn_inputs.eec_2.ecu_status_word_4,
      A380SecComputer_P.BitfromLabel2_bit, &rtb_y_a);
    rtb_y_mk = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.adcn_inputs.eec_3.ecu_status_word_4,
      A380SecComputer_P.BitfromLabel4_bit, &rtb_y_a);
    rtb_OR_o = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.adcn_inputs.eec_4.ecu_status_word_4,
      A380SecComputer_P.BitfromLabel1_bit, &rtb_y_a);
    rtb_NOT_bl = (rtb_y_fyf || rtb_y_mk || rtb_OR_o || (rtb_y_a != 0U));
    A380SecComputer_B.BusAssignment_d.logic.engine_out = (((!rtb_y_fyf) || (!rtb_y_mk) || (!rtb_OR_o) || (rtb_y_a == 0U))
      && rtb_NOT_bl);
    rtb_OR_o = rtb_NOT_bl;
    rtb_OR_m = ((A380SecComputer_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (A380SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
      (SignStatusMatrix::FailureWarning)) || (A380SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                (A380SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || A380SecComputer_P.Constant1_Value_b ||
                A380SecComputer_P.Constant1_Value_b);
    rtb_OR3 = ((A380SecComputer_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (A380SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (A380SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (A380SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || A380SecComputer_P.Constant1_Value_b ||
               A380SecComputer_P.Constant1_Value_b);
    rtb_OR = ((A380SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (A380SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM
               != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (A380SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || (A380SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM
               != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) || A380SecComputer_P.Constant_Value_ad);
    rtb_OR6 = ((A380SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (A380SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM
                != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (A380SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (A380SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) ||
               (A380SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || A380SecComputer_P.Constant_Value_ad);
    rtb_AND1_l = !rtb_OR_m;
    rtb_AND9_e = !rtb_OR3;
    if (rtb_AND1_l && rtb_AND9_e) {
      rtb_V_ias = (A380SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                   A380SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (A380SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                   A380SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (A380SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                  A380SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data) / 2.0F;
      rtb_alpha = (A380SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                   A380SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if (rtb_AND1_l && rtb_OR3) {
      rtb_V_ias = A380SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      rtb_mach = A380SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
      rtb_alpha = A380SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    } else if (rtb_OR_m && rtb_AND9_e) {
      rtb_V_ias = A380SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
      rtb_mach = A380SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
      rtb_alpha = A380SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach = 0.0F;
      rtb_alpha = 0.0F;
    }

    if ((!A380SecComputer_DWork.pY_not_empty) || (!A380SecComputer_DWork.pU_not_empty)) {
      A380SecComputer_DWork.pU = rtb_alpha;
      A380SecComputer_DWork.pU_not_empty = true;
      A380SecComputer_DWork.pY = rtb_alpha;
      A380SecComputer_DWork.pY_not_empty = true;
    }

    denom = A380SecComputer_U.in.time.dt * A380SecComputer_P.LagFilter_C1 + 2.0;
    ca = A380SecComputer_U.in.time.dt * A380SecComputer_P.LagFilter_C1 / denom;
    A380SecComputer_DWork.pY = (2.0 - A380SecComputer_U.in.time.dt * A380SecComputer_P.LagFilter_C1) / denom *
      A380SecComputer_DWork.pY + (rtb_alpha * ca + A380SecComputer_DWork.pU * ca);
    A380SecComputer_DWork.pU = rtb_alpha;
    rtb_AND1_l = !rtb_OR;
    rtb_AND9_e = !rtb_OR6;
    if (rtb_AND1_l && rtb_AND9_e) {
      rtb_alpha = (A380SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                   A380SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (A380SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                 A380SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
               A380SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
               A380SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                 A380SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                 A380SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (A380SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                 A380SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (A380SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                       A380SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (A380SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                     A380SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else if (rtb_AND1_l && rtb_OR6) {
      rtb_alpha = A380SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
      rtb_phi = A380SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      rtb_q = A380SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
      rtb_n_y = A380SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
      rtb_n_z = A380SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_OR && rtb_AND9_e) {
      rtb_alpha = A380SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
      rtb_phi = A380SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
      rtb_q = A380SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
      rtb_n_y = A380SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
      rtb_n_z = A380SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
    } else {
      rtb_alpha = 0.0F;
      rtb_phi = 0.0F;
      rtb_q = 0.0F;
      rtb_r = 0.0F;
      rtb_n_x = 0.0F;
      rtb_n_y = 0.0F;
      rtb_n_z = 0.0F;
      rtb_theta_dot = 0.0F;
      rtb_phi_dot = 0.0F;
    }

    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      A380SecComputer_P.BitfromLabel6_bit, &rtb_y_a);
    rtb_NOT_bl = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      A380SecComputer_P.BitfromLabel1_bit_d, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2, &rtb_y_fyf);
    rtb_AND = ((rtb_NOT_bl || (rtb_y_a != 0U)) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      A380SecComputer_P.BitfromLabel3_bit_j, &rtb_y_a);
    rtb_NOT_bl = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      A380SecComputer_P.BitfromLabel2_bit_f, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2, &rtb_y_mk);
    rtb_AND = (rtb_AND || ((rtb_NOT_bl || (rtb_y_a != 0U)) && rtb_y_mk));
    A380SecComputer_MATLABFunction_m(!A380SecComputer_U.in.discrete_inputs.yellow_low_pressure,
      A380SecComputer_U.in.time.dt, A380SecComputer_P.ConfirmNode_isRisingEdge, A380SecComputer_P.ConfirmNode_timeDelay,
      &rtb_y_fyf, &A380SecComputer_DWork.sf_MATLABFunction_mg);
    A380SecComputer_MATLABFunction_m(!A380SecComputer_U.in.discrete_inputs.green_low_pressure,
      A380SecComputer_U.in.time.dt, A380SecComputer_P.ConfirmNode2_isRisingEdge,
      A380SecComputer_P.ConfirmNode2_timeDelay, &rtb_y_mk, &A380SecComputer_DWork.sf_MATLABFunction_bd);
    rtb_Compare_l = (rtb_y_mk && rtb_y_fyf && rtb_OR_o);
    rudder1ElectricModeHasPriority = !rtb_y_fyf;
    rtb_NOT_bl = !rtb_y_mk;
    rtb_NOT_h = (rtb_AND && ((rtb_y_mk || rtb_y_fyf || (!A380SecComputer_U.in.discrete_inputs.rat_contactor_closed) || (
      !A380SecComputer_U.in.discrete_inputs.rat_deployed)) && ((rtb_NOT_bl && rudder1ElectricModeHasPriority) ||
      (!A380SecComputer_P.Constant_Value_bg)) && (!rtb_Compare_l)));
    rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail = rtb_y_fyf;
    rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail = rtb_y_mk;
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.fctl_law_status_word,
      A380SecComputer_P.BitfromLabel6_bit_k, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.fctl_law_status_word,
      &rtb_Compare_l);
    rtb_AND_n = ((rtb_y_a != 0U) && rtb_Compare_l);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.fctl_law_status_word,
      A380SecComputer_P.BitfromLabel7_bit, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.fctl_law_status_word, &rtb_y_fyf);
    rtb_AND1_d = ((rtb_y_a != 0U) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.fctl_law_status_word,
      A380SecComputer_P.BitfromLabel1_bit_p, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.fctl_law_status_word, &rtb_y_mk);
    if (rtb_AND_n) {
      rtb_DataTypeConversion_i = 1;
    } else if (rtb_AND1_d) {
      rtb_DataTypeConversion_i = 2;
    } else if ((rtb_y_a != 0U) && rtb_y_mk) {
      rtb_DataTypeConversion_i = 3;
    } else {
      rtb_DataTypeConversion_i = 0;
    }

    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.aileron_status_word;
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.aileron_status_word;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.aileron_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel1_bit_g, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_fyf);
    rtb_AND_n = ((rtb_y_a != 0U) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel2_bit_b, &rtb_y_a);
    rtb_AND1_l = (rtb_y_fyf && (rtb_y_a != 0U));
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.aileron_status_word;
    } else {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.aileron_status_word;
    }

    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel3_bit_l, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(rtb_Switch2_i_0, &rtb_y_mk);
    rtb_AND1_d = ((rtb_y_a != 0U) && rtb_y_mk);
    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel4_bit_f, &rtb_y_a);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      leftAileron1Avail = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
      rightAileron1Avail = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      leftAileron1Avail = false;
      rightAileron1Avail = false;
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
      leftAileron1Avail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
      rightAileron1Avail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
    } else {
      leftAileron1Avail = false;
      rightAileron1Avail = false;
    }

    A380SecComputer_B.BusAssignment_d.logic.right_aileron_1_engaged = (rightAileron1Avail && ((!rtb_AND1_l) &&
      ((!rtb_y_mk) || (rtb_y_a == 0U))));
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel5_bit, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_Compare_l);
    rtb_AND4_e = ((rtb_y_a != 0U) && rtb_Compare_l);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel6_bit_d, &rtb_y_a);
    rtb_AND5 = (rtb_Compare_l && (rtb_y_a != 0U));
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.aileron_status_word;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.aileron_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel7_bit_j, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_fyf);
    rtb_AND6 = ((rtb_y_a != 0U) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel8_bit, &rtb_y_a);
    rtb_AND7 = (rtb_y_fyf && (rtb_y_a != 0U));
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.sec_y_bus.aileron_status_word;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.sec_x_bus.aileron_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel9_bit, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_mk);
    rtb_AND8 = ((rtb_y_a != 0U) && rtb_y_mk);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel10_bit, &rtb_y_a);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      leftAileron2Avail = true;
      rightAileron2Avail = true;
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      leftAileron2Avail = true;
      rightAileron2Avail = true;
    } else {
      leftAileron2Avail = false;
      rightAileron2Avail = false;
    }

    rtb_AND1_l = !rtb_NOT_h;
    A380SecComputer_B.BusAssignment_d.logic.right_aileron_2_engaged = (rightAileron2Avail && ((!rtb_AND5) && (!rtb_AND7)
      && ((!rtb_y_mk) || (rtb_y_a == 0U)) && rtb_AND1_l));
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND5 = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
      rtb_AND7 = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
      leftSpoilerHydraulicModeAvail = false;
      rightSpoilerHydraulicModeAvail = false;
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.elevator_status_word;
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND5 = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
      rtb_AND7 = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
      leftSpoilerHydraulicModeAvail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
      rightSpoilerHydraulicModeAvail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.elevator_status_word;
    } else {
      if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
        rtb_AND5 = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
        rtb_AND7 = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
        leftSpoilerHydraulicModeAvail = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
        rightSpoilerHydraulicModeAvail = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
      } else {
        rtb_AND5 = false;
        rtb_AND7 = false;
        leftSpoilerHydraulicModeAvail = false;
        rightSpoilerHydraulicModeAvail = false;
      }

      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.elevator_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel1_bit_j, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_fyf);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.elevator_status_word;
    } else {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.elevator_status_word;
    }

    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel2_bit_i, &rtb_y_js);
    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel3_bit_i, &rtb_y_k);
    A380SecComputer_MATLABFunction_h(rtb_Switch2_i_0, &rtb_y_mk);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      elevator1Avail = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      elevator1Avail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
    } else {
      elevator1Avail = (A380SecComputer_U.in.discrete_inputs.is_unit_3 &&
                        rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail);
    }

    if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND9_e = (rtb_y_js != 0U);
    } else {
      rtb_AND9_e = (rtb_y_k != 0U);
    }

    A380SecComputer_B.BusAssignment_d.logic.elevator_1_engaged = (elevator1Avail && (((rtb_y_a == 0U) || (!rtb_y_fyf)) &&
      ((!rtb_AND9_e) || (!rtb_y_mk))));
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel4_bit_e, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_Compare_l);
    rtb_AND2_a = ((rtb_y_a != 0U) && rtb_Compare_l);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.elevator_status_word;
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.elevator_status_word;
    } else {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.elevator_status_word;
    }

    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel6_bit_l, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel7_bit_b, &rtb_y_js);
    A380SecComputer_MATLABFunction_h(rtb_Switch2_i_0, &rtb_y_fyf);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND9_e = (rtb_y_a != 0U);
    } else {
      rtb_AND9_e = (rtb_y_js != 0U);
    }

    rtb_AND4_m = (rtb_AND9_e && rtb_y_fyf);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.sec_x_bus.elevator_status_word;
    } else {
      rtb_Switch2_i_0 = &A380SecComputer_U.in.bus_inputs.sec_y_bus.elevator_status_word;
    }

    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel8_bit_d, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(rtb_Switch2_i_0, A380SecComputer_P.BitfromLabel9_bit_g, &rtb_y_js);
    A380SecComputer_MATLABFunction_h(rtb_Switch2_i_0, &rtb_y_mk);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND9_e = (rtb_y_a != 0U);
    } else {
      rtb_AND9_e = (rtb_y_js != 0U);
    }

    rtb_AND5_e = (rtb_AND9_e && rtb_y_mk);
    elevator2Avail = (A380SecComputer_U.in.discrete_inputs.is_unit_1 || (A380SecComputer_U.in.discrete_inputs.is_unit_2 ||
      (A380SecComputer_U.in.discrete_inputs.is_unit_3 && rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail)));
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel5_bit_e, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_Compare_l);
    rtb_AND3_dt = ((rtb_y_a != 0U) && rtb_Compare_l);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.elevator_status_word;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.elevator_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel10_bit_g, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel11_bit, &rtb_y_js);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_fyf);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND9_e = (rtb_y_a != 0U);
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.sec_x_bus.elevator_status_word;
    } else {
      rtb_AND9_e = (rtb_y_js != 0U);
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.sec_y_bus.elevator_status_word;
    }

    rtb_AND6_e = (rtb_AND9_e && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel12_bit, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel13_bit, &rtb_y_js);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_mk);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND9_e = (rtb_y_a != 0U);
    } else {
      rtb_AND9_e = (rtb_y_js != 0U);
    }

    rtb_AND7_j = (rtb_AND9_e && rtb_y_mk);
    elevator3Avail = (A380SecComputer_U.in.discrete_inputs.is_unit_1 || A380SecComputer_U.in.discrete_inputs.is_unit_2);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.elevator_status_word;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.elevator_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel1_bit_f, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_Compare_l);
    rtb_AND_b = ((rtb_y_a != 0U) && rtb_Compare_l);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.elevator_status_word;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.elevator_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel2_bit_a, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_fyf);
    rtb_AND1_i = ((rtb_y_a != 0U) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sec_y_bus.elevator_status_word,
      A380SecComputer_P.BitfromLabel3_bit_j0, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sec_y_bus.elevator_status_word, &rtb_y_mk);
    rtb_AND2_i = ((rtb_y_a != 0U) && rtb_y_mk);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      thsAvail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.rudder_status_word;
    } else {
      thsAvail = ((!A380SecComputer_U.in.discrete_inputs.is_unit_2) && (A380SecComputer_U.in.discrete_inputs.is_unit_3 &&
        rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail));
      if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
        rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.rudder_status_word;
      } else {
        rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.rudder_status_word;
      }
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel1_bit_o, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_Compare_l);
    rtb_AND_h = ((rtb_y_a != 0U) && rtb_Compare_l);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel2_bit_p, &rtb_y_js);
    rtb_AND1_al = (rtb_Compare_l && (rtb_y_js != 0U));
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.rudder_status_word;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.rudder_status_word;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel10_bit_i, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel8_bit_m, &rtb_y_js);
    A380SecComputer_MATLABFunction_h(&rtb_Switch1_a, &rtb_y_fyf);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND9_e = (rtb_y_a != 0U);
    } else {
      rtb_AND9_e = (rtb_y_js != 0U);
    }

    rtb_AND7_g = (rtb_AND9_e && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel11_bit_l, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel12_bit_b, &rtb_y_js);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND9_e = (rtb_y_a != 0U);
    } else {
      rtb_AND9_e = (rtb_y_js != 0U);
    }

    rtb_y_fyf = (rtb_y_fyf && rtb_AND9_e);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sec_x_bus.rudder_status_word,
      A380SecComputer_P.BitfromLabel9_bit_o, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sec_x_bus.rudder_status_word,
      A380SecComputer_P.BitfromLabel15_bit, &rtb_y_js);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sec_x_bus.rudder_status_word, &rtb_y_mk);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
      rtb_AND9_e = (rtb_y_a != 0U);
    } else {
      rtb_AND9_e = (rtb_y_js != 0U);
    }

    rtb_AND9_e = (rtb_AND9_e && rtb_y_mk);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sec_x_bus.rudder_status_word,
      A380SecComputer_P.BitfromLabel13_bit_o, &rtb_y_a);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sec_x_bus.rudder_status_word,
      A380SecComputer_P.BitfromLabel14_bit, &rtb_y_js);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rudder1HydraulicModeAvail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
      rudder1ElectricModeAvail = true;
      rudder1HydraulicModeHasPriority_tmp = !rtb_AND_h;
      rtb_AND7_g = !rtb_AND7_g;
      rtb_AND_h = (rudder1HydraulicModeHasPriority_tmp && rtb_AND7_g);
      rudder1ElectricModeHasPriority = (rudder1HydraulicModeHasPriority_tmp && (!rtb_AND1_al) && rtb_AND7_g &&
        (!rtb_y_fyf) && (!rtb_AND9_e) && rudder1ElectricModeHasPriority && rtb_AND1_l);
    } else {
      if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
        rudder1HydraulicModeAvail = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeAvail = rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
        rudder1ElectricModeAvail = true;
      } else {
        rudder1HydraulicModeAvail = false;
        rudder1ElectricModeAvail = false;
      }

      if (A380SecComputer_U.in.discrete_inputs.is_unit_2 || A380SecComputer_U.in.discrete_inputs.is_unit_3) {
        rudder1HydraulicModeHasPriority_tmp = !rtb_AND_h;
        rtb_AND7_g = !rtb_AND7_g;
        rudder1ElectricModeHasPriority = !rtb_AND9_e;
        rtb_AND_h = (rudder1HydraulicModeHasPriority_tmp && rtb_AND7_g && rudder1ElectricModeHasPriority);
        if (A380SecComputer_U.in.discrete_inputs.is_unit_3) {
          rtb_AND9_e = (rtb_y_a != 0U);
        } else {
          rtb_AND9_e = (rtb_y_js != 0U);
        }

        rudder1ElectricModeHasPriority = (rudder1HydraulicModeHasPriority_tmp && (!rtb_AND1_al) && rtb_AND7_g &&
          (!rtb_y_fyf) && rudder1ElectricModeHasPriority && ((!rtb_y_mk) || (!rtb_AND9_e)) &&
          (!rudder1HydraulicModeAvail) && rtb_AND1_l);
      } else {
        rtb_AND_h = false;
        rudder1ElectricModeHasPriority = false;
      }
    }

    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.rudder_status_word,
      A380SecComputer_P.BitfromLabel3_bit_o, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.rudder_status_word, &rtb_Compare_l);
    rtb_AND7_g = ((rtb_y_a != 0U) && rtb_Compare_l);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.rudder_status_word,
      A380SecComputer_P.BitfromLabel4_bit_a, &rtb_y_a);
    rtb_AND9_e = (rtb_Compare_l && (rtb_y_a != 0U));
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.rudder_status_word,
      A380SecComputer_P.BitfromLabel5_bit_c, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.rudder_status_word, &rtb_y_fyf);
    rtb_Compare_l = ((rtb_y_a != 0U) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.rudder_status_word,
      A380SecComputer_P.BitfromLabel6_bit_h, &rtb_y_a);
    rtb_y_fyf = (rtb_y_fyf && (rtb_y_a != 0U));
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sec_y_bus.rudder_status_word,
      A380SecComputer_P.BitfromLabel7_bit_i, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sec_y_bus.rudder_status_word, &rtb_y_mk);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND1_al = rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
      rudder1HydraulicModeHasPriority_tmp = true;
      rudder2ElectricModeHasPriority = !rtb_AND7_g;
      rtb_Compare_l = !rtb_Compare_l;
      rtb_AND7_g = (rudder2ElectricModeHasPriority && rtb_Compare_l);
      rudder2ElectricModeHasPriority = (rudder2ElectricModeHasPriority && (!rtb_AND9_e) && rtb_Compare_l && (!rtb_y_fyf)
        && ((rtb_y_a == 0U) || (!rtb_y_mk)) && rtb_NOT_bl && rtb_AND1_l);
    } else {
      rtb_AND1_al = false;
      rudder1HydraulicModeHasPriority_tmp = false;
      rtb_AND7_g = false;
      rudder2ElectricModeHasPriority = false;
    }

    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sec_x_bus.rudder_status_word,
      A380SecComputer_P.BitfromLabel9_bit_m, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sec_x_bus.rudder_status_word, &rtb_y_mk);
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rudderTrimAvail = A380SecComputer_U.in.discrete_inputs.sec_overhead_button_pressed;
    } else {
      rudderTrimAvail = ((!A380SecComputer_U.in.discrete_inputs.is_unit_2) &&
                         (A380SecComputer_U.in.discrete_inputs.is_unit_3 &&
                          A380SecComputer_U.in.discrete_inputs.sec_overhead_button_pressed));
    }

    A380SecComputer_B.BusAssignment_d.logic.rudder_trim_engaged = (rudderTrimAvail &&
      (A380SecComputer_U.in.discrete_inputs.is_unit_1 || ((!A380SecComputer_U.in.discrete_inputs.is_unit_2) &&
      (A380SecComputer_U.in.discrete_inputs.is_unit_3 && ((rtb_y_a == 0U) || (!rtb_y_mk))))));
    if (rtb_DataTypeConversion_i == 0) {
      A380SecComputer_B.BusAssignment_d.logic.active_pitch_law = a380_pitch_efcs_law::DirectLaw;
      A380SecComputer_B.BusAssignment_d.logic.active_lateral_law = a380_lateral_efcs_law::DirectLaw;
    } else {
      A380SecComputer_B.BusAssignment_d.logic.active_pitch_law = a380_pitch_efcs_law::None;
      A380SecComputer_B.BusAssignment_d.logic.active_lateral_law = a380_lateral_efcs_law::None;
    }

    A380SecComputer_MATLABFunction_f(A380SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      A380SecComputer_P.PulseNode_isRisingEdge, &rtb_y_fyf, &A380SecComputer_DWork.sf_MATLABFunction_g4);
    A380SecComputer_MATLABFunction_f(A380SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
      A380SecComputer_P.PulseNode1_isRisingEdge, &rtb_y_mk, &A380SecComputer_DWork.sf_MATLABFunction_nu);
    if (rtb_y_fyf) {
      A380SecComputer_DWork.pRightStickDisabled = true;
      A380SecComputer_DWork.pLeftStickDisabled = false;
    } else if (rtb_y_mk) {
      A380SecComputer_DWork.pLeftStickDisabled = true;
      A380SecComputer_DWork.pRightStickDisabled = false;
    }

    if (A380SecComputer_DWork.pRightStickDisabled &&
        ((!A380SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed) && (!A380SecComputer_DWork.Delay1_DSTATE)))
    {
      A380SecComputer_DWork.pRightStickDisabled = false;
    } else if (A380SecComputer_DWork.pLeftStickDisabled) {
      A380SecComputer_DWork.pLeftStickDisabled = (A380SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed ||
        A380SecComputer_DWork.Delay_DSTATE_cc);
    }

    A380SecComputer_MATLABFunction_m((A380SecComputer_DWork.pLeftStickDisabled &&
      (A380SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || A380SecComputer_DWork.Delay_DSTATE_cc)),
      A380SecComputer_U.in.time.dt, A380SecComputer_P.ConfirmNode1_isRisingEdge,
      A380SecComputer_P.ConfirmNode1_timeDelay, &rtb_y_ka, &A380SecComputer_DWork.sf_MATLABFunction_j2y);
    A380SecComputer_MATLABFunction_m((A380SecComputer_DWork.pRightStickDisabled &&
      (A380SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || A380SecComputer_DWork.Delay1_DSTATE)),
      A380SecComputer_U.in.time.dt, A380SecComputer_P.ConfirmNode_isRisingEdge_j,
      A380SecComputer_P.ConfirmNode_timeDelay_a, &rtb_y_m, &A380SecComputer_DWork.sf_MATLABFunction_g2);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380SecComputer_P.BitfromLabel_bit, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_fyf);
    rtb_AND_c = ((rtb_y_a == 0U) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      A380SecComputer_P.BitfromLabel1_bit_d0, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      &rtb_y_mk);
    rtb_AND1_o = ((rtb_y_a == 0U) && rtb_y_mk);
    A380SecComputer_MATLABFunction_f(rtb_AND, A380SecComputer_P.PulseNode1_isRisingEdge_m, &rtb_y_fyf,
      &A380SecComputer_DWork.sf_MATLABFunction_ek);
    A380SecComputer_MATLABFunction_f(rtb_AND, A380SecComputer_P.PulseNode2_isRisingEdge, &rtb_Compare_l,
      &A380SecComputer_DWork.sf_MATLABFunction_mf);
    A380SecComputer_DWork.Memory_PreviousInput = A380SecComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_y_fyf) << 1)
      + (rtb_Compare_l || A380SecComputer_DWork.Delay_DSTATE_d)) << 1) + A380SecComputer_DWork.Memory_PreviousInput];
    if (rtb_DataTypeConversion_i == A380SecComputer_P.CompareToConstant3_const) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_1_bus.fctl.discrete_status_word_1;
    } else if (rtb_DataTypeConversion_i == A380SecComputer_P.CompareToConstant4_const) {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_2_bus.fctl.discrete_status_word_1;
    } else {
      rtb_Switch1_a = A380SecComputer_U.in.bus_inputs.prim_3_bus.fctl.discrete_status_word_1;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel3_bit_id, &rtb_y_a);
    A380SecComputer_MATLABFunction(&rtb_Switch1_a, &rtb_y_mk);
    if (rtb_DataTypeConversion_i == A380SecComputer_P.CompareToConstant5_const) {
      rtb_Compare_l = ((!rtb_AND) && (rtb_DataTypeConversion_i != A380SecComputer_P.CompareToConstant2_const));
    } else {
      rtb_Compare_l = ((rtb_y_a != 0U) && rtb_y_mk);
    }

    A380SecComputer_DWork.Delay_DSTATE_d = A380SecComputer_P.Logic_table_i[(((rtb_Compare_l || (std::abs
      (A380SecComputer_U.in.analog_inputs.ths_pos_deg) <= A380SecComputer_P.CompareToConstant1_const) ||
      A380SecComputer_U.in.discrete_inputs.pitch_trim_up_pressed ||
      A380SecComputer_U.in.discrete_inputs.pitch_trim_down_pressed) + (static_cast<uint32_T>((rtb_V_ias <=
      A380SecComputer_P.CompareToConstant_const) && A380SecComputer_DWork.Memory_PreviousInput) << 1)) << 1) +
      A380SecComputer_DWork.Memory_PreviousInput_n];
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380SecComputer_P.BitfromLabel4_bit_m, &rtb_y_a);
    rtb_NOT_bl = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380SecComputer_P.BitfromLabel_bit_k, &rtb_y_a);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_fyf);
    rtb_y_fyf = (((!rtb_NOT_bl) || (rtb_y_a == 0U)) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_h(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      &rtb_y_mk);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380SecComputer_P.BitfromLabel6_bit_a, &rtb_y_a);
    rtb_NOT_bl = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&A380SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      A380SecComputer_P.BitfromLabel5_bit_j, &rtb_y_a);
    if (rtb_y_fyf || (rtb_y_mk && ((!rtb_NOT_bl) || (rtb_y_a == 0U)))) {
      denom = 0.25;
    } else {
      denom = 0.15;
    }

    if (A380SecComputer_DWork.Delay_DSTATE_d) {
      rtb_Switch13 = A380SecComputer_P.Gain_Gain * A380SecComputer_U.in.analog_inputs.ths_pos_deg;
      if (rtb_Switch13 > A380SecComputer_P.Saturation_UpperSat) {
        A380SecComputer_B.BusAssignment_d.logic.ths_manual_mode_c_deg_s = A380SecComputer_P.Saturation_UpperSat;
      } else if (rtb_Switch13 < A380SecComputer_P.Saturation_LowerSat) {
        A380SecComputer_B.BusAssignment_d.logic.ths_manual_mode_c_deg_s = A380SecComputer_P.Saturation_LowerSat;
      } else {
        A380SecComputer_B.BusAssignment_d.logic.ths_manual_mode_c_deg_s = rtb_Switch13;
      }
    } else if (A380SecComputer_U.in.discrete_inputs.pitch_trim_down_pressed) {
      A380SecComputer_B.BusAssignment_d.logic.ths_manual_mode_c_deg_s = denom;
    } else if (A380SecComputer_U.in.discrete_inputs.pitch_trim_up_pressed) {
      A380SecComputer_B.BusAssignment_d.logic.ths_manual_mode_c_deg_s = -denom;
    } else {
      A380SecComputer_B.BusAssignment_d.logic.ths_manual_mode_c_deg_s = 0.0;
    }

    A380SecComputer_B.BusAssignment_d.data = A380SecComputer_U.in;
    A380SecComputer_B.BusAssignment_d.laws = A380SecComputer_P.Constant_Value;
    A380SecComputer_B.BusAssignment_d.logic.on_ground = rtb_AND;
    A380SecComputer_B.BusAssignment_d.logic.tracking_mode_on = (A380SecComputer_U.in.sim_data.slew_on ||
      A380SecComputer_U.in.sim_data.pause_on || A380SecComputer_U.in.sim_data.tracking_mode_on_override);
    A380SecComputer_B.BusAssignment_d.logic.master_prim = rtb_DataTypeConversion_i;
    A380SecComputer_B.BusAssignment_d.logic.elevator_1_avail = elevator1Avail;
    A380SecComputer_B.BusAssignment_d.logic.elevator_2_avail = elevator2Avail;
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND9_e = ((!rtb_AND2_a) && (!rtb_AND4_m) && (!rtb_AND5_e) && rtb_AND1_l);
    } else if (A380SecComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_AND9_e = ((!rtb_AND2_a) && (!rtb_AND4_m) && (!rtb_AND5_e) && rtb_AND1_l);
    } else {
      rtb_AND9_e = (A380SecComputer_U.in.discrete_inputs.is_unit_3 && ((!rtb_AND2_a) && (!rtb_AND4_m)));
    }

    A380SecComputer_B.BusAssignment_d.logic.elevator_2_engaged = (elevator2Avail && rtb_AND9_e);
    A380SecComputer_B.BusAssignment_d.logic.elevator_3_avail = elevator3Avail;
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND9_e = ((!rtb_AND3_dt) && (!rtb_AND6_e) && (!rtb_AND7_j) && rtb_AND1_l);
    } else {
      rtb_AND9_e = (A380SecComputer_U.in.discrete_inputs.is_unit_2 && ((!rtb_AND3_dt) && (!rtb_AND6_e) && (!rtb_AND7_j) &&
        rtb_AND1_l));
    }

    A380SecComputer_B.BusAssignment_d.logic.elevator_3_engaged = (elevator3Avail && rtb_AND9_e);
    A380SecComputer_B.BusAssignment_d.logic.ths_avail = thsAvail;
    if (A380SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_AND9_e = ((!rtb_AND_b) && (!rtb_AND1_i) && (!rtb_AND2_i));
    } else {
      rtb_AND9_e = ((!A380SecComputer_U.in.discrete_inputs.is_unit_2) && (A380SecComputer_U.in.discrete_inputs.is_unit_3
        && ((!rtb_AND_b) && (!rtb_AND1_i))));
    }

    A380SecComputer_B.BusAssignment_d.logic.ths_engaged = (thsAvail && rtb_AND9_e);
    A380SecComputer_B.BusAssignment_d.logic.left_aileron_1_avail = leftAileron1Avail;
    A380SecComputer_B.BusAssignment_d.logic.left_aileron_1_engaged = (leftAileron1Avail && ((!rtb_AND_n) && (!rtb_AND1_d)));
    A380SecComputer_B.BusAssignment_d.logic.left_aileron_2_avail = leftAileron2Avail;
    A380SecComputer_B.BusAssignment_d.logic.left_aileron_2_engaged = (leftAileron2Avail && ((!rtb_AND4_e) && (!rtb_AND6)
      && (!rtb_AND8) && rtb_AND1_l));
    A380SecComputer_B.BusAssignment_d.logic.right_aileron_1_avail = rightAileron1Avail;
    A380SecComputer_B.BusAssignment_d.logic.right_aileron_2_avail = rightAileron2Avail;
    A380SecComputer_B.BusAssignment_d.logic.left_spoiler_1_hydraulic_mode_avail = rtb_AND5;
    rtb_AND1_l = (rtb_AND5 && rtb_AND7);
    A380SecComputer_B.BusAssignment_d.logic.left_spoiler_1_hydraulic_mode_engaged = rtb_AND1_l;
    A380SecComputer_B.BusAssignment_d.logic.right_spoiler_1_hydraulic_mode_avail = rtb_AND7;
    A380SecComputer_B.BusAssignment_d.logic.right_spoiler_1_hydraulic_mode_engaged = rtb_AND1_l;
    A380SecComputer_B.BusAssignment_d.logic.left_spoiler_2_hydraulic_mode_avail = leftSpoilerHydraulicModeAvail;
    rtb_AND1_l = (leftSpoilerHydraulicModeAvail && rightSpoilerHydraulicModeAvail);
    A380SecComputer_B.BusAssignment_d.logic.left_spoiler_2_hydraulic_mode_engaged = rtb_AND1_l;
    A380SecComputer_B.BusAssignment_d.logic.right_spoiler_2_hydraulic_mode_avail = rightSpoilerHydraulicModeAvail;
    A380SecComputer_B.BusAssignment_d.logic.right_spoiler_2_hydraulic_mode_engaged = rtb_AND1_l;
    A380SecComputer_B.BusAssignment_d.logic.rudder_1_hydraulic_mode_avail = rudder1HydraulicModeAvail;
    A380SecComputer_B.BusAssignment_d.logic.rudder_1_electric_mode_avail = rudder1ElectricModeAvail;
    A380SecComputer_B.BusAssignment_d.logic.rudder_1_hydraulic_mode_engaged = (rudder1HydraulicModeAvail && rtb_AND_h);
    A380SecComputer_B.BusAssignment_d.logic.rudder_1_electric_mode_engaged = (rudder1ElectricModeAvail &&
      rudder1ElectricModeHasPriority);
    A380SecComputer_B.BusAssignment_d.logic.rudder_2_hydraulic_mode_avail = rtb_AND1_al;
    A380SecComputer_B.BusAssignment_d.logic.rudder_2_electric_mode_avail = rudder1HydraulicModeHasPriority_tmp;
    A380SecComputer_B.BusAssignment_d.logic.rudder_2_hydraulic_mode_engaged = (rtb_AND1_al && rtb_AND7_g);
    A380SecComputer_B.BusAssignment_d.logic.rudder_2_electric_mode_engaged = (rudder1HydraulicModeHasPriority_tmp &&
      rudder2ElectricModeHasPriority);
    A380SecComputer_B.BusAssignment_d.logic.rudder_trim_avail = rudderTrimAvail;
    A380SecComputer_B.BusAssignment_d.logic.aileron_droop_active = (rtb_AND_c || rtb_AND1_o);
    A380SecComputer_B.BusAssignment_d.logic.engine_running = rtb_OR_o;
    A380SecComputer_B.BusAssignment_d.logic.is_yellow_hydraulic_power_avail =
      rtb_BusAssignment_l_logic_is_yellow_hydraulic_power_avail;
    A380SecComputer_B.BusAssignment_d.logic.is_green_hydraulic_power_avail =
      rtb_BusAssignment_l_logic_is_green_hydraulic_power_avail;
    A380SecComputer_B.BusAssignment_d.logic.eha_ebha_elec_mode_inhibited = rtb_NOT_h;
    A380SecComputer_B.BusAssignment_d.logic.left_sidestick_disabled = A380SecComputer_DWork.pLeftStickDisabled;
    A380SecComputer_B.BusAssignment_d.logic.right_sidestick_disabled = A380SecComputer_DWork.pRightStickDisabled;
    A380SecComputer_B.BusAssignment_d.logic.left_sidestick_priority_locked = rtb_y_ka;
    A380SecComputer_B.BusAssignment_d.logic.right_sidestick_priority_locked = rtb_y_m;
    if (!A380SecComputer_DWork.pRightStickDisabled) {
      rtb_rightCommand = A380SecComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_rightCommand = A380SecComputer_P.Constant_Value_p;
    }

    if (A380SecComputer_DWork.pLeftStickDisabled) {
      denom = A380SecComputer_P.Constant_Value_p;
    } else {
      denom = A380SecComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    rtb_Switch13 = rtb_rightCommand + denom;
    if (rtb_Switch13 > A380SecComputer_P.Saturation_UpperSat_d) {
      A380SecComputer_B.BusAssignment_d.logic.total_sidestick_pitch_command = A380SecComputer_P.Saturation_UpperSat_d;
    } else if (rtb_Switch13 < A380SecComputer_P.Saturation_LowerSat_h) {
      A380SecComputer_B.BusAssignment_d.logic.total_sidestick_pitch_command = A380SecComputer_P.Saturation_LowerSat_h;
    } else {
      A380SecComputer_B.BusAssignment_d.logic.total_sidestick_pitch_command = rtb_Switch13;
    }

    if (!A380SecComputer_DWork.pRightStickDisabled) {
      rtb_rightCommand = A380SecComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_rightCommand = A380SecComputer_P.Constant1_Value_p;
    }

    if (A380SecComputer_DWork.pLeftStickDisabled) {
      denom = A380SecComputer_P.Constant1_Value_p;
    } else {
      denom = A380SecComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    rtb_Switch13 = rtb_rightCommand + denom;
    if (rtb_Switch13 > A380SecComputer_P.Saturation1_UpperSat) {
      A380SecComputer_B.BusAssignment_d.logic.total_sidestick_roll_command = A380SecComputer_P.Saturation1_UpperSat;
    } else if (rtb_Switch13 < A380SecComputer_P.Saturation1_LowerSat) {
      A380SecComputer_B.BusAssignment_d.logic.total_sidestick_roll_command = A380SecComputer_P.Saturation1_LowerSat;
    } else {
      A380SecComputer_B.BusAssignment_d.logic.total_sidestick_roll_command = rtb_Switch13;
    }

    A380SecComputer_B.BusAssignment_d.logic.phased_lift_dumping_active = false;
    A380SecComputer_B.BusAssignment_d.logic.double_adr_failure = (rtb_OR_m && rtb_OR3);
    A380SecComputer_B.BusAssignment_d.logic.cas_or_mach_disagree = A380SecComputer_P.Constant1_Value_b;
    A380SecComputer_B.BusAssignment_d.logic.alpha_disagree = A380SecComputer_P.Constant1_Value_b;
    A380SecComputer_B.BusAssignment_d.logic.double_ir_failure = (rtb_OR && rtb_OR6);
    A380SecComputer_B.BusAssignment_d.logic.ir_failure_not_self_detected = A380SecComputer_P.Constant_Value_ad;
    A380SecComputer_B.BusAssignment_d.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    A380SecComputer_B.BusAssignment_d.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    A380SecComputer_B.BusAssignment_d.logic.adr_computation_data.mach = rtb_mach;
    A380SecComputer_B.BusAssignment_d.logic.adr_computation_data.alpha_deg = A380SecComputer_DWork.pY;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.theta_deg = rtb_alpha;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.phi_deg = rtb_phi;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.q_deg_s = rtb_q;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.r_deg_s = rtb_r;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.n_x_g = rtb_n_x;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.n_y_g = rtb_n_y;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.n_z_g = rtb_n_z;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    A380SecComputer_B.BusAssignment_d.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    A380SecComputer_B.BusAssignment_d.discrete_outputs = A380SecComputer_P.Constant2_Value;
    A380SecComputer_B.BusAssignment_d.analog_outputs = A380SecComputer_P.Constant3_Value;
    A380SecComputer_B.BusAssignment_d.bus_outputs = A380SecComputer_P.Constant4_Value;
    A380SecComputer_B.BusAssignment_d.logic.ths_automatic_mode_active = rtb_Compare_l;
    switch (A380SecComputer_B.BusAssignment_d.logic.master_prim) {
     case 1:
      rtb_Switch1_a = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fg.discrete_word_1;
      break;

     case 2:
      rtb_Switch1_a = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fg.discrete_word_1;
      break;

     case 3:
      rtb_Switch1_a = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fg.discrete_word_1;
      break;

     default:
      rtb_Switch1_a = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fg.discrete_word_1;
      break;
    }

    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel1_bit_b, &rtb_y_a);
    rtb_NOT_bl = (rtb_y_a != 0U);
    A380SecComputer_MATLABFunction_p(&rtb_Switch1_a, A380SecComputer_P.BitfromLabel3_bit_k, &rtb_y_a);
    A380SecComputer_MATLABFunction(&rtb_Switch1_a, &rtb_y_fyf);
    rtb_NOT_bl = ((rtb_NOT_bl || (rtb_y_a != 0U)) && rtb_y_fyf);
    A380SecComputer_MATLABFunction_f((A380SecComputer_B.BusAssignment_d.data.discrete_inputs.rudder_trim_reset_pressed &&
      A380SecComputer_B.BusAssignment_d.logic.rudder_trim_engaged && (!rtb_NOT_bl)),
      A380SecComputer_P.PulseNode_isRisingEdge_m, &rtb_y_fyf, &A380SecComputer_DWork.sf_MATLABFunction_f);
    A380SecComputer_DWork.Memory_PreviousInput_b = A380SecComputer_P.Logic_table_f
      [(((A380SecComputer_B.BusAssignment_d.data.discrete_inputs.rudder_trim_left_pressed ||
          A380SecComputer_B.BusAssignment_d.data.discrete_inputs.rudder_trim_right_pressed || rtb_NOT_bl) + (
          static_cast<uint32_T>(rtb_y_fyf) << 1)) << 1) + A380SecComputer_DWork.Memory_PreviousInput_b];
    rtb_Compare_l = !A380SecComputer_B.BusAssignment_d.logic.rudder_trim_engaged;
    if (rtb_NOT_bl) {
      rtb_rightCommand = A380SecComputer_P.Constant2_Value_m;
    } else if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.rudder_trim_left_pressed) {
      rtb_rightCommand = 1.0;
    } else if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.rudder_trim_right_pressed) {
      rtb_rightCommand = -1.0;
    } else {
      rtb_rightCommand = 0.0;
    }

    rtb_Switch_h = A380SecComputer_P.DiscreteTimeIntegratorVariableTs_Gain * rtb_rightCommand *
      A380SecComputer_B.BusAssignment_d.data.time.dt;
    A380SecComputer_DWork.icLoad = (A380SecComputer_DWork.Memory_PreviousInput_b || rtb_Compare_l ||
      A380SecComputer_DWork.icLoad);
    if (A380SecComputer_DWork.icLoad) {
      if (rtb_Compare_l) {
        rtb_rightCommand = A380SecComputer_B.BusAssignment_d.data.analog_inputs.rudder_trim_actual_pos_deg;
      } else {
        rtb_rightCommand = A380SecComputer_P.Constant_Value_l;
      }

      A380SecComputer_DWork.Delay_DSTATE = rtb_rightCommand - rtb_Switch_h;
    }

    A380SecComputer_DWork.Delay_DSTATE += rtb_Switch_h;
    if (A380SecComputer_DWork.Delay_DSTATE > A380SecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
      A380SecComputer_DWork.Delay_DSTATE = A380SecComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
    } else if (A380SecComputer_DWork.Delay_DSTATE < A380SecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
      A380SecComputer_DWork.Delay_DSTATE = A380SecComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
    }

    A380SecComputer_RateLimiter_e(A380SecComputer_DWork.Delay_DSTATE, A380SecComputer_P.RateLimiterGenericVariableTs_up,
      A380SecComputer_P.RateLimiterGenericVariableTs_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.rudder_trim_actual_pos_deg,
      !A380SecComputer_B.BusAssignment_d.logic.rudder_trim_engaged, &denom, &A380SecComputer_DWork.sf_RateLimiter_bh);
    rtb_NOT_bl = (A380SecComputer_B.BusAssignment_d.logic.master_prim == A380SecComputer_P.CompareToConstant_const_l);
    LawMDLOBJ1.step(&A380SecComputer_B.BusAssignment_d.data.time.dt,
                    &A380SecComputer_B.BusAssignment_d.logic.total_sidestick_roll_command,
                    &A380SecComputer_B.BusAssignment_d.data.analog_inputs.rudder_pedal_pos_deg, &rtb_xi_deg,
                    &rtb_zeta_deg);
    if (static_cast<int32_T>(A380SecComputer_B.BusAssignment_d.logic.active_lateral_law) == 1) {
      rtb_Switch_h = rtb_xi_deg;
    } else {
      rtb_Switch_h = A380SecComputer_P.Constant_Value_c;
    }

    if (A380SecComputer_B.BusAssignment_d.logic.aileron_droop_active) {
      rtb_rightCommand = A380SecComputer_P.Constant2_Value_n;
    } else {
      rtb_rightCommand = A380SecComputer_P.Constant1_Value_f;
    }

    A380SecComputer_RateLimiter(rtb_rightCommand, A380SecComputer_P.RateLimiterVariableTs2_up,
      A380SecComputer_P.RateLimiterVariableTs2_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_Switch8_o, &A380SecComputer_DWork.sf_RateLimiter);
    rtb_Switch13 = A380SecComputer_P.Gain_Gain_e * rtb_Switch_h + rtb_Switch8_o;
    if (rtb_Switch13 > A380SecComputer_P.Saturation2_UpperSat) {
      rtb_Switch13 = A380SecComputer_P.Saturation2_UpperSat;
    } else if (rtb_Switch13 < A380SecComputer_P.Saturation2_LowerSat) {
      rtb_Switch13 = A380SecComputer_P.Saturation2_LowerSat;
    }

    rtb_AND1_l = !rtb_NOT_bl;
    A380SecComputer_RateLimiter_e(rtb_Switch13, A380SecComputer_P.RateLimiterGenericVariableTs_up_l,
      A380SecComputer_P.RateLimiterGenericVariableTs_lo_o, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.left_aileron_1_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.left_aileron_1_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_e);
    if (A380SecComputer_B.BusAssignment_d.logic.master_prim == A380SecComputer_P.CompareToConstant_const_f) {
      rtb_theta_dot =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_inboard_aileron_command_deg.Data;
      rtb_phi_dot =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_inboard_aileron_command_deg.Data;
      rtb_V_ias =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_midboard_aileron_command_deg.Data;
      rtb_V_tas =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_midboard_aileron_command_deg.Data;
      rtb_leftSpoilerCommand_h =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_spoiler_1_command_deg.Data;
      rtb_rightSpoilerCommand_o =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_spoiler_1_command_deg.Data;
      rtb_mach = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_spoiler_2_command_deg.Data;
      rtb_alpha = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_spoiler_2_command_deg.Data;
      rtb_phi = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_spoiler_3_command_deg.Data;
      rtb_q = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_spoiler_3_command_deg.Data;
      rtb_r = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_spoiler_7_command_deg.Data;
      rtb_n_x = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_spoiler_7_command_deg.Data;
      rtb_leftSpoilerCommand =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_spoiler_8_command_deg.Data;
      rtb_rightSpoilerCommand =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_spoiler_8_command_deg.Data;
      rtb_rudder1Command =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.upper_rudder_command_deg.Data;
      rtb_rudder2Command =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.lower_rudder_command_deg.Data;
    } else if (A380SecComputer_B.BusAssignment_d.logic.master_prim == A380SecComputer_P.CompareToConstant1_const_p2) {
      rtb_theta_dot =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_inboard_aileron_command_deg.Data;
      rtb_phi_dot =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_inboard_aileron_command_deg.Data;
      rtb_V_ias =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_midboard_aileron_command_deg.Data;
      rtb_V_tas =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_midboard_aileron_command_deg.Data;
      rtb_leftSpoilerCommand_h =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_spoiler_1_command_deg.Data;
      rtb_rightSpoilerCommand_o =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_spoiler_1_command_deg.Data;
      rtb_mach = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_spoiler_2_command_deg.Data;
      rtb_alpha = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_spoiler_2_command_deg.Data;
      rtb_phi = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_spoiler_3_command_deg.Data;
      rtb_q = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_spoiler_3_command_deg.Data;
      rtb_r = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_spoiler_7_command_deg.Data;
      rtb_n_x = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_spoiler_7_command_deg.Data;
      rtb_leftSpoilerCommand =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_spoiler_8_command_deg.Data;
      rtb_rightSpoilerCommand =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_spoiler_8_command_deg.Data;
      rtb_rudder1Command =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.upper_rudder_command_deg.Data;
      rtb_rudder2Command =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.lower_rudder_command_deg.Data;
    } else {
      rtb_theta_dot =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_inboard_aileron_command_deg.Data;
      rtb_phi_dot =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_inboard_aileron_command_deg.Data;
      rtb_V_ias =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_midboard_aileron_command_deg.Data;
      rtb_V_tas =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_midboard_aileron_command_deg.Data;
      rtb_leftSpoilerCommand_h =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_spoiler_1_command_deg.Data;
      rtb_rightSpoilerCommand_o =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_spoiler_1_command_deg.Data;
      rtb_mach = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_spoiler_2_command_deg.Data;
      rtb_alpha = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_spoiler_2_command_deg.Data;
      rtb_phi = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_spoiler_3_command_deg.Data;
      rtb_q = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_spoiler_3_command_deg.Data;
      rtb_r = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_spoiler_7_command_deg.Data;
      rtb_n_x = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_spoiler_7_command_deg.Data;
      rtb_leftSpoilerCommand =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_spoiler_8_command_deg.Data;
      rtb_rightSpoilerCommand =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_spoiler_8_command_deg.Data;
      rtb_rudder1Command =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.upper_rudder_command_deg.Data;
      rtb_rudder2Command =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.lower_rudder_command_deg.Data;
    }

    if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_1) {
      rtb_n_y = rtb_theta_dot;
      rtb_n_z = rtb_phi_dot;
      rtb_theta_dot = rtb_V_ias;
      rtb_phi_dot = rtb_V_tas;
    } else if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_2) {
      rtb_n_y = 0.0F;
      rtb_n_z = 0.0F;
    } else {
      rtb_n_y = rtb_V_ias;
      rtb_n_z = rtb_V_tas;
      rtb_theta_dot = 0.0F;
      rtb_phi_dot = 0.0F;
    }

    if (rtb_NOT_bl) {
      ca = rtb_Switch9;
    } else {
      ca = rtb_n_y;
    }

    rtb_Switch13 = rtb_Switch8_o + rtb_Switch_h;
    if (rtb_Switch13 > A380SecComputer_P.Saturation1_UpperSat_o) {
      rtb_rightCommand = A380SecComputer_P.Saturation1_UpperSat_o;
    } else if (rtb_Switch13 < A380SecComputer_P.Saturation1_LowerSat_n) {
      rtb_rightCommand = A380SecComputer_P.Saturation1_LowerSat_n;
    } else {
      rtb_rightCommand = rtb_Switch13;
    }

    A380SecComputer_RateLimiter_e(rtb_rightCommand, A380SecComputer_P.RateLimiterGenericVariableTs1_up,
      A380SecComputer_P.RateLimiterGenericVariableTs1_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.right_aileron_1_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.right_aileron_1_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_o);
    if (rtb_NOT_bl) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_aileron_1_command_deg = rtb_Switch9;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_aileron_1_command_deg = rtb_n_z;
    }

    u0 = A380SecComputer_P.Gain3_Gain * rtb_Switch_h + rtb_Switch8_o;
    if (u0 > A380SecComputer_P.Saturation3_UpperSat) {
      u0 = A380SecComputer_P.Saturation3_UpperSat;
    } else if (u0 < A380SecComputer_P.Saturation3_LowerSat) {
      u0 = A380SecComputer_P.Saturation3_LowerSat;
    }

    A380SecComputer_RateLimiter_e(u0, A380SecComputer_P.RateLimiterGenericVariableTs2_up,
      A380SecComputer_P.RateLimiterGenericVariableTs2_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.left_aileron_2_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.left_aileron_2_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_a);
    if (rtb_NOT_bl) {
      u0 = rtb_Switch9;
    } else {
      u0 = rtb_theta_dot;
    }

    if (rtb_Switch13 > A380SecComputer_P.Saturation4_UpperSat) {
      rtb_Switch13 = A380SecComputer_P.Saturation4_UpperSat;
    } else if (rtb_Switch13 < A380SecComputer_P.Saturation4_LowerSat) {
      rtb_Switch13 = A380SecComputer_P.Saturation4_LowerSat;
    }

    A380SecComputer_RateLimiter_e(rtb_Switch13, A380SecComputer_P.RateLimiterGenericVariableTs3_up,
      A380SecComputer_P.RateLimiterGenericVariableTs3_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.right_aileron_2_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.right_aileron_2_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_p);
    if (rtb_NOT_bl) {
      rtb_Switch13 = rtb_Switch9;
    } else {
      rtb_Switch13 = rtb_phi_dot;
    }

    A380SecComputer_RateLimiter(A380SecComputer_P.Constant6_Value, A380SecComputer_P.RateLimiterVariableTs4_up,
      A380SecComputer_P.RateLimiterVariableTs4_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_P.RateLimiterVariableTs4_InitialCondition, &rtb_Switch8_o, &A380SecComputer_DWork.sf_RateLimiter_b);
    rtb_Switch_h *= A380SecComputer_P.Gain1_Gain;
    if ((!A380SecComputer_DWork.pY_not_empty_k) || A380SecComputer_P.reset_Value) {
      A380SecComputer_DWork.pY_e = A380SecComputer_P.RateLimiterGenericVariableTs25_InitialCondition;
      A380SecComputer_DWork.pY_not_empty_k = true;
    }

    if (A380SecComputer_P.reset_Value) {
      A380SecComputer_DWork.pY_e = A380SecComputer_P.RateLimiterGenericVariableTs25_InitialCondition;
    } else {
      if (A380SecComputer_P.Constant7_Value_h) {
        rtb_rightCommand = A380SecComputer_P.Constant9_Value;
      } else {
        rtb_rightCommand = A380SecComputer_P.Constant8_Value;
      }

      A380SecComputer_DWork.pY_e += std::fmax(std::fmin(rtb_rightCommand - A380SecComputer_DWork.pY_e, std::abs
        (A380SecComputer_P.RateLimiterGenericVariableTs25_up) * A380SecComputer_B.BusAssignment_d.data.time.dt), -std::
        abs(A380SecComputer_P.RateLimiterGenericVariableTs25_lo) * A380SecComputer_B.BusAssignment_d.data.time.dt);
    }

    if (rtb_Switch_h >= 0.0) {
      rtb_Switch9 = A380SecComputer_DWork.pY_e - rtb_Switch_h;
      rtb_Switch8_o = A380SecComputer_DWork.pY_e;
    } else {
      rtb_Switch9 = A380SecComputer_DWork.pY_e;
      rtb_Switch8_o = A380SecComputer_DWork.pY_e + rtb_Switch_h;
    }

    rtb_Switch_h = std::fmax(rtb_Switch9 - (rtb_Switch8_o - std::fmax(rtb_Switch8_o, -45.0)), -45.0);
    rtb_rightCommand = std::fmax(rtb_Switch8_o - (rtb_Switch9 - std::fmax(rtb_Switch9, -45.0)), -45.0);
    A380SecComputer_RateLimiter_e(rtb_Switch_h, A380SecComputer_P.RateLimiterGenericVariableTs8_up,
      A380SecComputer_P.RateLimiterGenericVariableTs8_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.left_spoiler_1_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.left_spoiler_1_hydraulic_mode_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_os);
    if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_1) {
      rtb_leftSpoilerCommand_h = rtb_phi;
      rtb_rightSpoilerCommand_o = rtb_q;
    } else if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_2) {
      rtb_leftSpoilerCommand_h = rtb_mach;
      rtb_rightSpoilerCommand_o = rtb_alpha;
    }

    if (rtb_NOT_bl) {
      rtb_Switch8_o = rtb_Switch9;
    } else {
      rtb_Switch8_o = rtb_leftSpoilerCommand_h;
    }

    A380SecComputer_RateLimiter_e(rtb_rightCommand, A380SecComputer_P.RateLimiterGenericVariableTs9_up,
      A380SecComputer_P.RateLimiterGenericVariableTs9_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.right_spoiler_1_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.right_spoiler_1_hydraulic_mode_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_d);
    if (rtb_NOT_bl) {
      rtb_Switch14 = rtb_Switch9;
    } else {
      rtb_Switch14 = rtb_rightSpoilerCommand_o;
    }

    A380SecComputer_RateLimiter_e(rtb_Switch_h, A380SecComputer_P.RateLimiterGenericVariableTs10_up,
      A380SecComputer_P.RateLimiterGenericVariableTs10_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.left_spoiler_2_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.left_spoiler_2_hydraulic_mode_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_bv);
    if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_1) {
      rtb_leftSpoilerCommand = 0.0F;
      rtb_rightSpoilerCommand = 0.0F;
    } else if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_2) {
      rtb_leftSpoilerCommand = rtb_r;
      rtb_rightSpoilerCommand = rtb_n_x;
    }

    if (rtb_NOT_bl) {
      rtb_Switch2_a = rtb_Switch9;
    } else {
      rtb_Switch2_a = rtb_leftSpoilerCommand;
    }

    A380SecComputer_RateLimiter_e(rtb_rightCommand, A380SecComputer_P.RateLimiterGenericVariableTs11_up,
      A380SecComputer_P.RateLimiterGenericVariableTs11_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.right_spoiler_2_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.right_spoiler_2_hydraulic_mode_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_g);
    if (rtb_NOT_bl) {
      rtb_Switch3_hq = rtb_Switch9;
    } else {
      rtb_Switch3_hq = rtb_rightSpoilerCommand;
    }

    if (static_cast<int32_T>(A380SecComputer_B.BusAssignment_d.logic.active_lateral_law) == 1) {
      rtb_Switch_h = rtb_zeta_deg;
    } else {
      rtb_Switch_h = A380SecComputer_P.Constant_Value_c;
    }

    A380SecComputer_RateLimiter_e(rtb_Switch_h, A380SecComputer_P.RateLimiterGenericVariableTs6_up,
      A380SecComputer_P.RateLimiterGenericVariableTs6_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.rudder_1_pos_deg,
      (((!A380SecComputer_B.BusAssignment_d.logic.rudder_1_electric_mode_engaged) &&
        (!A380SecComputer_B.BusAssignment_d.logic.rudder_1_hydraulic_mode_engaged)) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_j);
    if (!A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_1) {
      if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_2) {
        rtb_rudder2Command = 0.0F;
      } else {
        rtb_rudder1Command = rtb_rudder2Command;
        rtb_rudder2Command = 0.0F;
      }
    }

    if (rtb_NOT_bl) {
      rtb_Switch4 = rtb_Switch9;
    } else {
      rtb_Switch4 = rtb_rudder1Command;
    }

    A380SecComputer_RateLimiter_e(rtb_Switch_h, A380SecComputer_P.RateLimiterGenericVariableTs7_up,
      A380SecComputer_P.RateLimiterGenericVariableTs7_lo, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.rudder_2_pos_deg,
      (((!A380SecComputer_B.BusAssignment_d.logic.rudder_2_electric_mode_engaged) &&
        (!A380SecComputer_B.BusAssignment_d.logic.rudder_2_hydraulic_mode_engaged)) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_gz);
    if (rtb_NOT_bl) {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_rudder_2_command_deg = rtb_Switch9;
    } else {
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_rudder_2_command_deg = rtb_rudder2Command;
    }

    LawMDLOBJ2.step(&A380SecComputer_B.BusAssignment_d.data.time.dt,
                    &A380SecComputer_B.BusAssignment_d.logic.total_sidestick_pitch_command, &rtb_eta_deg,
                    &rtb_eta_trim_dot_deg_s, &rtb_eta_trim_limit_lo, &rtb_eta_trim_limit_up);
    if (static_cast<int32_T>(A380SecComputer_B.BusAssignment_d.logic.active_pitch_law) == 5) {
      rtb_rightCommand = rtb_eta_deg;
    } else {
      rtb_rightCommand = A380SecComputer_P.Constant_Value_a;
    }

    rtb_AND1_l = (A380SecComputer_B.BusAssignment_d.logic.master_prim != A380SecComputer_P.CompareToConstant_const_fl);
    A380SecComputer_RateLimiter_e(rtb_rightCommand, A380SecComputer_P.RateLimiterGenericVariableTs_up_a,
      A380SecComputer_P.RateLimiterGenericVariableTs_lo_f, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.elevator_1_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.elevator_1_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_c);
    rtb_NOT_bl = (A380SecComputer_B.BusAssignment_d.logic.master_prim == A380SecComputer_P.CompareToConstant2_const_f);
    if (A380SecComputer_B.BusAssignment_d.logic.master_prim == A380SecComputer_P.CompareToConstant_const_fs) {
      rtb_V_ias =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_inboard_elevator_command_deg.Data;
      rtb_q = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_inboard_elevator_command_deg.Data;
      rtb_phi =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.left_outboard_elevator_command_deg.Data;
      rtb_V_tas =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.right_outboard_elevator_command_deg.Data;
      rtb_mach = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_1_bus.fctl.ths_command_deg.Data;
    } else if (A380SecComputer_B.BusAssignment_d.logic.master_prim == A380SecComputer_P.CompareToConstant1_const_c) {
      rtb_V_ias =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_inboard_elevator_command_deg.Data;
      rtb_q = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_inboard_elevator_command_deg.Data;
      rtb_phi =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.left_outboard_elevator_command_deg.Data;
      rtb_V_tas =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.right_outboard_elevator_command_deg.Data;
      rtb_mach = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_2_bus.fctl.ths_command_deg.Data;
    } else {
      rtb_V_ias =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_inboard_elevator_command_deg.Data;
      rtb_q = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_inboard_elevator_command_deg.Data;
      rtb_phi =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.left_outboard_elevator_command_deg.Data;
      rtb_V_tas =
        A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.right_outboard_elevator_command_deg.Data;
      rtb_mach = A380SecComputer_B.BusAssignment_d.data.bus_inputs.prim_3_bus.fctl.ths_command_deg.Data;
    }

    if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_1) {
      rtb_alpha = rtb_phi;
      rtb_phi = rtb_V_ias;
      rtb_q = rtb_V_tas;
    } else if (A380SecComputer_B.BusAssignment_d.data.discrete_inputs.is_unit_2) {
      rtb_alpha = rtb_V_tas;
    } else {
      rtb_alpha = rtb_V_ias;
      rtb_phi = rtb_q;
      rtb_q = 0.0F;
    }

    if (rtb_NOT_bl) {
      rtb_Switch10 = rtb_Switch9;
    } else {
      rtb_Switch10 = rtb_alpha;
    }

    A380SecComputer_RateLimiter_e(rtb_rightCommand, A380SecComputer_P.RateLimiterGenericVariableTs1_up_a,
      A380SecComputer_P.RateLimiterGenericVariableTs1_lo_c, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.elevator_2_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.elevator_2_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_p0);
    if (rtb_NOT_bl) {
      rtb_Switch_h = rtb_Switch9;
    } else {
      rtb_Switch_h = rtb_phi;
    }

    A380SecComputer_RateLimiter_e(rtb_rightCommand, A380SecComputer_P.RateLimiterGenericVariableTs2_up_l,
      A380SecComputer_P.RateLimiterGenericVariableTs2_lo_k, A380SecComputer_B.BusAssignment_d.data.time.dt,
      A380SecComputer_B.BusAssignment_d.data.analog_inputs.elevator_3_pos_deg,
      ((!A380SecComputer_B.BusAssignment_d.logic.elevator_3_engaged) || rtb_AND1_l), &rtb_Switch9,
      &A380SecComputer_DWork.sf_RateLimiter_cd);
    if (!rtb_NOT_bl) {
      rtb_Switch9 = rtb_q;
    }

    if (static_cast<int32_T>(A380SecComputer_B.BusAssignment_d.logic.active_pitch_law) == 5) {
      rtb_Switch11 = rtb_eta_trim_limit_up;
    } else {
      rtb_Switch11 = A380SecComputer_P.Constant2_Value_l;
    }

    if (A380SecComputer_B.BusAssignment_d.logic.ths_automatic_mode_active) {
      if (static_cast<int32_T>(A380SecComputer_B.BusAssignment_d.logic.active_pitch_law) == 5) {
        rtb_rightCommand = rtb_eta_trim_dot_deg_s;
      } else {
        rtb_rightCommand = A380SecComputer_P.Constant_Value_a;
      }
    } else {
      rtb_rightCommand = A380SecComputer_B.BusAssignment_d.logic.ths_manual_mode_c_deg_s;
    }

    rtb_rightCommand = A380SecComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_rightCommand *
      A380SecComputer_B.BusAssignment_d.data.time.dt;
    if (A380SecComputer_B.BusAssignment_d.logic.ths_automatic_mode_active) {
      rtb_AND1_l = ((!A380SecComputer_B.BusAssignment_d.logic.ths_engaged) || rtb_AND1_l);
    } else {
      rtb_AND1_l = !A380SecComputer_B.BusAssignment_d.logic.ths_engaged;
    }

    A380SecComputer_DWork.icLoad_l = (rtb_AND1_l || A380SecComputer_DWork.icLoad_l);
    if (A380SecComputer_DWork.icLoad_l) {
      A380SecComputer_DWork.Delay_DSTATE_c = A380SecComputer_B.BusAssignment_d.data.analog_inputs.ths_pos_deg -
        rtb_rightCommand;
    }

    A380SecComputer_DWork.Delay_DSTATE_c += rtb_rightCommand;
    if (A380SecComputer_DWork.Delay_DSTATE_c > rtb_Switch11) {
      A380SecComputer_DWork.Delay_DSTATE_c = rtb_Switch11;
    } else {
      if (static_cast<int32_T>(A380SecComputer_B.BusAssignment_d.logic.active_pitch_law) == 5) {
        rtb_rightCommand = rtb_eta_trim_limit_lo;
      } else {
        rtb_rightCommand = A380SecComputer_P.Constant3_Value_h;
      }

      if (A380SecComputer_DWork.Delay_DSTATE_c < rtb_rightCommand) {
        A380SecComputer_DWork.Delay_DSTATE_c = rtb_rightCommand;
      }
    }

    if (rtb_NOT_bl) {
      rtb_Switch11 = A380SecComputer_DWork.Delay_DSTATE_c;
    } else if (A380SecComputer_B.BusAssignment_d.logic.ths_automatic_mode_active) {
      rtb_Switch11 = rtb_mach;
    } else {
      rtb_Switch11 = A380SecComputer_DWork.Delay_DSTATE_c;
    }

    A380SecComputer_B.BusAssignment_o = A380SecComputer_B.BusAssignment_d;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.left_aileron_1_command_deg = ca;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.right_aileron_1_command_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_aileron_1_command_deg;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.left_aileron_2_command_deg = u0;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.right_aileron_2_command_deg = rtb_Switch13;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.left_spoiler_1_command_deg = rtb_Switch8_o;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.right_spoiler_1_command_deg = rtb_Switch14;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.left_spoiler_2_command_deg = rtb_Switch2_a;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.right_spoiler_2_command_deg = rtb_Switch3_hq;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.rudder_1_command_deg = rtb_Switch4;
    A380SecComputer_B.BusAssignment_o.laws.lateral_law_outputs.rudder_2_command_deg =
      rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_rudder_2_command_deg;
    A380SecComputer_B.BusAssignment_o.laws.pitch_law_outputs.elevator_1_command_deg = rtb_Switch10;
    A380SecComputer_B.BusAssignment_o.laws.pitch_law_outputs.elevator_2_command_deg = rtb_Switch_h;
    A380SecComputer_B.BusAssignment_o.laws.pitch_law_outputs.elevator_3_command_deg = rtb_Switch9;
    A380SecComputer_B.BusAssignment_o.laws.pitch_law_outputs.ths_command_deg = rtb_Switch11;
    A380SecComputer_B.BusAssignment_o.laws.rudder_trim_command_deg = denom;
    rtb_VectorConcatenate[0] = A380SecComputer_B.BusAssignment_o.logic.left_aileron_1_avail;
    rtb_VectorConcatenate[1] = A380SecComputer_B.BusAssignment_o.logic.left_aileron_1_engaged;
    rtb_VectorConcatenate[2] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[3] = A380SecComputer_B.BusAssignment_o.logic.right_aileron_1_avail;
    rtb_VectorConcatenate[4] = A380SecComputer_B.BusAssignment_o.logic.right_aileron_1_engaged;
    rtb_VectorConcatenate[5] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[6] = A380SecComputer_B.BusAssignment_o.logic.left_aileron_2_avail;
    rtb_VectorConcatenate[7] = A380SecComputer_B.BusAssignment_o.logic.left_aileron_2_engaged;
    rtb_VectorConcatenate[8] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[9] = A380SecComputer_B.BusAssignment_o.logic.right_aileron_2_avail;
    rtb_VectorConcatenate[10] = A380SecComputer_B.BusAssignment_o.logic.right_aileron_2_engaged;
    rtb_VectorConcatenate[11] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[12] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[13] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[14] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[15] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[16] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[17] = A380SecComputer_P.Constant16_Value;
    rtb_VectorConcatenate[18] = A380SecComputer_P.Constant16_Value;
    A380SecComputer_MATLABFunction_e(rtb_VectorConcatenate, &rtb_V_ias);
    rtb_VectorConcatenate[0] = A380SecComputer_B.BusAssignment_o.logic.left_spoiler_1_hydraulic_mode_avail;
    rtb_VectorConcatenate[1] = A380SecComputer_B.BusAssignment_o.logic.left_spoiler_1_hydraulic_mode_engaged;
    rtb_VectorConcatenate[2] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[3] = A380SecComputer_B.BusAssignment_o.logic.right_spoiler_1_hydraulic_mode_avail;
    rtb_VectorConcatenate[4] = A380SecComputer_B.BusAssignment_o.logic.right_spoiler_1_hydraulic_mode_engaged;
    rtb_VectorConcatenate[5] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[6] = A380SecComputer_B.BusAssignment_o.logic.left_spoiler_2_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380SecComputer_B.BusAssignment_o.logic.left_spoiler_2_hydraulic_mode_engaged;
    rtb_VectorConcatenate[8] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[9] = A380SecComputer_B.BusAssignment_o.logic.right_spoiler_2_hydraulic_mode_avail;
    rtb_VectorConcatenate[10] = A380SecComputer_B.BusAssignment_o.logic.right_spoiler_2_hydraulic_mode_engaged;
    rtb_VectorConcatenate[11] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[12] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[13] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[14] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[15] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[16] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[17] = A380SecComputer_P.Constant17_Value;
    rtb_VectorConcatenate[18] = A380SecComputer_P.Constant17_Value;
    A380SecComputer_MATLABFunction_e(rtb_VectorConcatenate, &rtb_V_tas);
    rtb_VectorConcatenate[0] = A380SecComputer_B.BusAssignment_o.logic.elevator_1_avail;
    rtb_VectorConcatenate[1] = A380SecComputer_B.BusAssignment_o.logic.elevator_1_engaged;
    rtb_VectorConcatenate[2] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[3] = A380SecComputer_B.BusAssignment_o.logic.elevator_2_avail;
    rtb_VectorConcatenate[4] = A380SecComputer_B.BusAssignment_o.logic.elevator_2_engaged;
    rtb_VectorConcatenate[5] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[6] = A380SecComputer_B.BusAssignment_o.logic.elevator_3_avail;
    rtb_VectorConcatenate[7] = A380SecComputer_B.BusAssignment_o.logic.elevator_3_engaged;
    rtb_VectorConcatenate[8] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[9] = A380SecComputer_B.BusAssignment_o.logic.ths_avail;
    rtb_VectorConcatenate[10] = A380SecComputer_B.BusAssignment_o.logic.ths_engaged;
    rtb_VectorConcatenate[11] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[12] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[13] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[14] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[15] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[16] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[17] = A380SecComputer_P.Constant18_Value;
    rtb_VectorConcatenate[18] = A380SecComputer_P.Constant18_Value;
    A380SecComputer_MATLABFunction_e(rtb_VectorConcatenate, &rtb_mach);
    rtb_VectorConcatenate[0] = A380SecComputer_B.BusAssignment_o.logic.rudder_1_hydraulic_mode_avail;
    rtb_VectorConcatenate[1] = A380SecComputer_B.BusAssignment_o.logic.rudder_1_electric_mode_avail;
    rtb_VectorConcatenate[2] = A380SecComputer_B.BusAssignment_o.logic.rudder_1_hydraulic_mode_engaged;
    rtb_VectorConcatenate[3] = A380SecComputer_B.BusAssignment_o.logic.rudder_1_electric_mode_engaged;
    rtb_VectorConcatenate[4] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[5] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[6] = A380SecComputer_B.BusAssignment_o.logic.rudder_2_hydraulic_mode_avail;
    rtb_VectorConcatenate[7] = A380SecComputer_B.BusAssignment_o.logic.rudder_2_electric_mode_avail;
    rtb_VectorConcatenate[8] = A380SecComputer_B.BusAssignment_o.logic.rudder_2_hydraulic_mode_engaged;
    rtb_VectorConcatenate[9] = A380SecComputer_B.BusAssignment_o.logic.rudder_2_electric_mode_engaged;
    rtb_VectorConcatenate[10] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[11] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[12] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[13] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[14] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[15] = A380SecComputer_P.Constant19_Value;
    rtb_VectorConcatenate[16] = A380SecComputer_B.BusAssignment_o.logic.rudder_trim_avail;
    rtb_VectorConcatenate[17] = A380SecComputer_B.BusAssignment_o.logic.rudder_trim_engaged;
    rtb_VectorConcatenate[18] = A380SecComputer_P.Constant19_Value;
    A380SecComputer_MATLABFunction_e(rtb_VectorConcatenate, &rtb_alpha);
    rtb_VectorConcatenate_c[0] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[1] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[2] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[3] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[4] = A380SecComputer_P.Constant21_Value;
    if (A380SecComputer_B.BusAssignment_o.logic.active_pitch_law == a380_pitch_efcs_law::None) {
      rtb_VectorConcatenate_c[5] = false;
      rtb_VectorConcatenate_c[6] = false;
      rtb_VectorConcatenate_c[7] = false;
    } else {
      rtb_VectorConcatenate_c[5] = true;
      rtb_VectorConcatenate_c[6] = true;
      rtb_VectorConcatenate_c[7] = false;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.active_lateral_law == a380_lateral_efcs_law::None) {
      rtb_VectorConcatenate_c[8] = false;
      rtb_VectorConcatenate_c[9] = false;
    } else {
      rtb_VectorConcatenate_c[8] = false;
      rtb_VectorConcatenate_c[9] = true;
    }

    rtb_VectorConcatenate_c[10] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[11] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[12] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[13] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[14] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[15] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[16] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[17] = A380SecComputer_P.Constant21_Value;
    rtb_VectorConcatenate_c[18] = A380SecComputer_P.Constant21_Value;
    A380SecComputer_MATLABFunction_e(rtb_VectorConcatenate_c, &rtb_phi);
    rtb_VectorConcatenate_c[0] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[1] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[2] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[3] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[4] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[5] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[6] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[7] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[8] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[9] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[10] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[11] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[12] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[13] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[14] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[15] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[16] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[17] = A380SecComputer_P.Constant22_Value;
    rtb_VectorConcatenate_c[18] = A380SecComputer_P.Constant22_Value;
    A380SecComputer_MATLABFunction_e(rtb_VectorConcatenate_c, &rtb_q);
    A380SecComputer_Y.out = A380SecComputer_B.BusAssignment_o;
    A380SecComputer_Y.out.discrete_outputs.elevator_1_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.elevator_1_engaged;
    A380SecComputer_Y.out.discrete_outputs.elevator_2_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.elevator_2_engaged;
    A380SecComputer_Y.out.discrete_outputs.elevator_3_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.elevator_3_engaged;
    A380SecComputer_Y.out.discrete_outputs.ths_active_mode = A380SecComputer_B.BusAssignment_o.logic.ths_engaged;
    A380SecComputer_Y.out.discrete_outputs.left_aileron_1_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.left_aileron_1_engaged;
    A380SecComputer_Y.out.discrete_outputs.left_aileron_2_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.left_aileron_2_engaged;
    A380SecComputer_Y.out.discrete_outputs.right_aileron_1_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.right_aileron_1_engaged;
    A380SecComputer_Y.out.discrete_outputs.right_aileron_2_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.right_aileron_2_engaged;
    A380SecComputer_Y.out.discrete_outputs.rudder_1_hydraulic_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.rudder_1_hydraulic_mode_engaged;
    A380SecComputer_Y.out.discrete_outputs.rudder_1_electric_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.rudder_1_electric_mode_engaged;
    A380SecComputer_Y.out.discrete_outputs.rudder_2_hydraulic_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.rudder_2_hydraulic_mode_engaged;
    A380SecComputer_Y.out.discrete_outputs.rudder_2_electric_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.rudder_2_electric_mode_engaged;
    A380SecComputer_Y.out.discrete_outputs.rudder_trim_active_mode =
      A380SecComputer_B.BusAssignment_o.logic.rudder_trim_engaged;
    A380SecComputer_Y.out.discrete_outputs.sec_healthy = A380SecComputer_P.Constant1_Value_f3;
    if (A380SecComputer_B.BusAssignment_o.logic.elevator_1_engaged) {
      A380SecComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = rtb_Switch10;
    } else {
      A380SecComputer_Y.out.analog_outputs.elevator_1_pos_order_deg = A380SecComputer_P.Constant_Value_b;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.elevator_2_engaged) {
      A380SecComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = rtb_Switch_h;
    } else {
      A380SecComputer_Y.out.analog_outputs.elevator_2_pos_order_deg = A380SecComputer_P.Constant1_Value_n;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.elevator_3_engaged) {
      A380SecComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = rtb_Switch9;
    } else {
      A380SecComputer_Y.out.analog_outputs.elevator_3_pos_order_deg = A380SecComputer_P.Constant2_Value_k;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.ths_engaged) {
      A380SecComputer_Y.out.analog_outputs.ths_pos_order_deg = rtb_Switch11;
    } else {
      A380SecComputer_Y.out.analog_outputs.ths_pos_order_deg = A380SecComputer_P.Constant3_Value_g;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.left_aileron_1_engaged) {
      A380SecComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = ca;
    } else {
      A380SecComputer_Y.out.analog_outputs.left_aileron_1_pos_order_deg = A380SecComputer_P.Constant4_Value_i;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.left_aileron_2_engaged) {
      A380SecComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = u0;
    } else {
      A380SecComputer_Y.out.analog_outputs.left_aileron_2_pos_order_deg = A380SecComputer_P.Constant5_Value_n;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.right_aileron_1_engaged) {
      A380SecComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_right_aileron_1_command_deg;
    } else {
      A380SecComputer_Y.out.analog_outputs.right_aileron_1_pos_order_deg = A380SecComputer_P.Constant6_Value_f;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.right_aileron_2_engaged) {
      A380SecComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = rtb_Switch13;
    } else {
      A380SecComputer_Y.out.analog_outputs.right_aileron_2_pos_order_deg = A380SecComputer_P.Constant7_Value;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.left_spoiler_1_hydraulic_mode_engaged) {
      A380SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg = rtb_Switch8_o;
    } else {
      A380SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg = A380SecComputer_P.Constant8_Value_p;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.right_spoiler_1_hydraulic_mode_engaged) {
      A380SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg = rtb_Switch14;
    } else {
      A380SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg = A380SecComputer_P.Constant9_Value_n;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.left_spoiler_2_hydraulic_mode_engaged) {
      A380SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg = rtb_Switch2_a;
    } else {
      A380SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg = A380SecComputer_P.Constant12_Value;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.right_spoiler_2_hydraulic_mode_engaged) {
      A380SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg = rtb_Switch3_hq;
    } else {
      A380SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg = A380SecComputer_P.Constant13_Value;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.rudder_1_electric_mode_engaged ||
        A380SecComputer_B.BusAssignment_o.logic.rudder_1_hydraulic_mode_engaged) {
      A380SecComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = rtb_Switch4;
    } else {
      A380SecComputer_Y.out.analog_outputs.rudder_1_pos_order_deg = A380SecComputer_P.Constant10_Value;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.rudder_2_electric_mode_engaged ||
        A380SecComputer_B.BusAssignment_o.logic.rudder_2_hydraulic_mode_engaged) {
      A380SecComputer_Y.out.analog_outputs.rudder_2_pos_order_deg =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_rudder_2_command_deg;
    } else {
      A380SecComputer_Y.out.analog_outputs.rudder_2_pos_order_deg = A380SecComputer_P.Constant11_Value;
    }

    if (A380SecComputer_B.BusAssignment_o.logic.rudder_trim_engaged) {
      A380SecComputer_Y.out.analog_outputs.rudder_trim_command_deg = denom;
    } else {
      A380SecComputer_Y.out.analog_outputs.rudder_trim_command_deg = A380SecComputer_P.Constant15_Value;
    }

    A380SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = A380SecComputer_P.Gain_Gain_e0 *
      static_cast<real32_T>(A380SecComputer_B.BusAssignment_o.data.analog_inputs.capt_pitch_stick_pos);
    A380SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = A380SecComputer_P.Gain1_Gain_a *
      static_cast<real32_T>(A380SecComputer_B.BusAssignment_o.data.analog_inputs.fo_pitch_stick_pos);
    A380SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = A380SecComputer_P.Gain2_Gain *
      static_cast<real32_T>(A380SecComputer_B.BusAssignment_o.data.analog_inputs.capt_roll_stick_pos);
    A380SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = A380SecComputer_P.Gain3_Gain_o *
      static_cast<real32_T>(A380SecComputer_B.BusAssignment_o.data.analog_inputs.fo_roll_stick_pos);
    A380SecComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = A380SecComputer_P.Gain4_Gain *
      static_cast<real32_T>(A380SecComputer_B.BusAssignment_o.data.analog_inputs.rudder_pedal_pos_deg);
    A380SecComputer_Y.out.bus_outputs.aileron_status_word.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.aileron_status_word.Data = rtb_V_ias;
    A380SecComputer_Y.out.bus_outputs.left_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.left_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.left_aileron_1_pos_deg);
    A380SecComputer_Y.out.bus_outputs.left_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.left_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.left_aileron_2_pos_deg);
    A380SecComputer_Y.out.bus_outputs.right_aileron_1_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.right_aileron_1_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.right_aileron_1_pos_deg);
    A380SecComputer_Y.out.bus_outputs.right_aileron_2_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.right_aileron_2_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.right_aileron_2_pos_deg);
    A380SecComputer_Y.out.bus_outputs.spoiler_status_word.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.spoiler_status_word.Data = rtb_V_tas;
    A380SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.left_spoiler_1_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.left_spoiler_1_pos_deg);
    A380SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.right_spoiler_1_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.right_spoiler_1_pos_deg);
    A380SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.left_spoiler_2_pos_deg);
    A380SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.right_spoiler_2_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.right_spoiler_2_pos_deg);
    A380SecComputer_Y.out.bus_outputs.elevator_status_word.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.elevator_status_word.Data = rtb_mach;
    A380SecComputer_Y.out.bus_outputs.elevator_1_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.elevator_1_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.elevator_1_pos_deg);
    A380SecComputer_Y.out.bus_outputs.elevator_2_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.elevator_2_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.elevator_2_pos_deg);
    A380SecComputer_Y.out.bus_outputs.elevator_3_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.elevator_3_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.elevator_3_pos_deg);
    A380SecComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.ths_pos_deg);
    A380SecComputer_Y.out.bus_outputs.rudder_status_word.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.rudder_status_word.Data = rtb_alpha;
    A380SecComputer_Y.out.bus_outputs.rudder_1_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.rudder_1_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.rudder_1_pos_deg);
    A380SecComputer_Y.out.bus_outputs.rudder_2_position_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.rudder_2_position_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.rudder_2_pos_deg);
    A380SecComputer_Y.out.bus_outputs.rudder_trim_actual_pos_deg.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.rudder_trim_actual_pos_deg.Data = static_cast<real32_T>
      (A380SecComputer_B.BusAssignment_o.data.analog_inputs.rudder_trim_actual_pos_deg);
    A380SecComputer_Y.out.bus_outputs.fctl_law_status_word.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.fctl_law_status_word.Data = rtb_phi;
    A380SecComputer_Y.out.bus_outputs.misc_data_status_word.SSM = static_cast<uint32_T>
      (A380SecComputer_P.EnumeratedConstant1_Value);
    A380SecComputer_Y.out.bus_outputs.misc_data_status_word.Data = rtb_q;
    A380SecComputer_DWork.Delay_DSTATE_cc = rtb_y_ka;
    A380SecComputer_DWork.Delay1_DSTATE = rtb_y_m;
    A380SecComputer_DWork.Memory_PreviousInput_n = A380SecComputer_DWork.Delay_DSTATE_d;
    A380SecComputer_DWork.icLoad = false;
    A380SecComputer_DWork.icLoad_l = false;
  } else {
    A380SecComputer_DWork.Runtime_MODE = false;
  }
}

void A380SecComputer::initialize()
{
  A380SecComputer_DWork.Delay_DSTATE_cc = A380SecComputer_P.Delay_InitialCondition;
  A380SecComputer_DWork.Delay1_DSTATE = A380SecComputer_P.Delay1_InitialCondition;
  A380SecComputer_DWork.Delay_DSTATE_d = A380SecComputer_P.Delay_InitialCondition_d;
  A380SecComputer_DWork.Memory_PreviousInput = A380SecComputer_P.SRFlipFlop1_initial_condition;
  A380SecComputer_DWork.Memory_PreviousInput_n = A380SecComputer_P.SRFlipFlop_initial_condition;
  A380SecComputer_DWork.Memory_PreviousInput_b = A380SecComputer_P.SRFlipFlop_initial_condition_i;
  A380SecComputer_DWork.icLoad = true;
  A380SecComputer_DWork.icLoad_l = true;
  A380SecComputer_Y.out = A380SecComputer_P.out_Y0;
}

void A380SecComputer::terminate()
{
}

A380SecComputer::A380SecComputer():
  A380SecComputer_U(),
  A380SecComputer_Y(),
  A380SecComputer_B(),
  A380SecComputer_DWork()
{
}

A380SecComputer::~A380SecComputer() = default;
