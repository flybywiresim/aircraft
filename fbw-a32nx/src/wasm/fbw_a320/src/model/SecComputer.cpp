#include "SecComputer.h"
#include "SecComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_binlxpw.h"
#include "LateralDirectLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

const uint8_T SecComputer_IN_InAir{ 1U };

const uint8_T SecComputer_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T SecComputer_IN_OnGround{ 2U };

const uint8_T SecComputer_IN_Flight{ 1U };

const uint8_T SecComputer_IN_FlightToGroundTransition{ 2U };

const uint8_T SecComputer_IN_Ground{ 3U };

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

void SecComputer::SecComputer_RateLimiter_Reset(rtDW_RateLimiter_SecComputer_T *localDW)
{
  localDW->pY_not_empty = false;
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

void SecComputer::SecComputer_RateLimiter_n_Reset(rtDW_RateLimiter_SecComputer_m_T *localDW)
{
  localDW->pY_not_empty = false;
}

void SecComputer::SecComputer_RateLimiter_b(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_SecComputer_m_T *localDW)
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

void SecComputer::SecComputer_MATLABFunction_g_Reset(rtDW_MATLABFunction_SecComputer_l_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void SecComputer::SecComputer_MATLABFunction_e(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_SecComputer_l_T *localDW)
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

void SecComputer::SecComputer_MATLABFunction_e_Reset(rtDW_MATLABFunction_SecComputer_o_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void SecComputer::SecComputer_MATLABFunction_n(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_SecComputer_o_T *localDW)
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

void SecComputer::SecComputer_MATLABFunction_l(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
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
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_dot_deg_s;
  real_T rtb_eta_trim_limit_lo;
  real_T rtb_eta_trim_limit_up;
  base_arinc_429 rtb_Switch8;
  real_T pair1RollCommand;
  real_T pair1SpdBrkCommand;
  real_T rollCommand;
  real_T rtb_BusAssignment_f_logic_ir_computation_data_n_z_g;
  real_T rtb_BusAssignment_f_logic_ir_computation_data_theta_dot_deg_s;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_mach;
  real_T rtb_Switch3;
  real_T rtb_Switch5;
  real_T rtb_Switch5_tmp_tmp;
  real_T rtb_Switch6_m;
  real_T rtb_eta_trim_limit_lo_d;
  real_T rtb_handleIndex;
  real_T rtb_zeta_deg;
  real_T u0;
  real_T u0_0;
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
  real32_T tmp;
  uint32_T rtb_DataTypeConversion1;
  uint32_T rtb_Switch7_c;
  uint32_T rtb_Switch9_c;
  uint32_T rtb_y;
  uint32_T rtb_y_im;
  uint32_T rtb_y_l;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T abnormalCondition;
  boolean_T canEngageInPitch;
  boolean_T hasPriorityInPitch;
  boolean_T leftElevatorAvail;
  boolean_T rightElevatorAvail;
  boolean_T rtb_AND11;
  boolean_T rtb_AND1_e_tmp;
  boolean_T rtb_AND1_h;
  boolean_T rtb_AND2_j;
  boolean_T rtb_AND4_a;
  boolean_T rtb_NOT2_b;
  boolean_T rtb_NOT_bl;
  boolean_T rtb_NOT_g;
  boolean_T rtb_NOT_m2;
  boolean_T rtb_OR;
  boolean_T rtb_OR1;
  boolean_T rtb_OR3;
  boolean_T rtb_OR6;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_doubleIrFault;
  boolean_T rtb_isEngagedInPitch;
  boolean_T rtb_isEngagedInRoll;
  boolean_T rtb_singleAdrFault;
  boolean_T rtb_singleIrFault;
  boolean_T rtb_thsAvail;
  boolean_T rtb_y_a;
  boolean_T rtb_y_az;
  boolean_T rtb_y_b5;
  boolean_T rtb_y_g;
  boolean_T rtb_y_ji;
  boolean_T spoilerPair1SupplyAvail;
  boolean_T spoiler_pair_2_avail;
  pitch_efcs_law rtb_activePitchLaw;
  pitch_efcs_law rtb_pitchLawCapability;
  if (SecComputer_U.in.sim_data.computer_running) {
    if (!SecComputer_DWork.Runtime_MODE) {
      SecComputer_DWork.Delay_DSTATE_c = SecComputer_P.Delay_InitialCondition_c;
      SecComputer_DWork.Delay1_DSTATE = SecComputer_P.Delay1_InitialCondition;
      SecComputer_DWork.Memory_PreviousInput = SecComputer_P.SRFlipFlop_initial_condition;
      SecComputer_DWork.Memory_PreviousInput_f = SecComputer_P.SRFlipFlop_initial_condition_c;
      SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.SRFlipFlop_initial_condition_k;
      SecComputer_DWork.Delay1_DSTATE_i = SecComputer_P.Delay1_InitialCondition_l;
      SecComputer_DWork.Delay_DSTATE_n = SecComputer_P.Delay_InitialCondition_j;
      SecComputer_DWork.Delay2_DSTATE = SecComputer_P.Delay2_InitialCondition;
      SecComputer_DWork.Delay_DSTATE = SecComputer_P.Delay_InitialCondition;
      SecComputer_DWork.icLoad = true;
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_jk);
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_dw);
      SecComputer_DWork.is_active_c8_SecComputer = 0U;
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_NO_ACTIVE_CHILD;
      SecComputer_B.in_flight = 0.0;
      SecComputer_DWork.on_ground_time = 0.0;
      SecComputer_DWork.is_active_c30_SecComputer = 0U;
      SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_NO_ACTIVE_CHILD;
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_ndv);
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_gf);
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_h);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_g4b);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_nu);
      SecComputer_DWork.pLeftStickDisabled = false;
      SecComputer_DWork.pRightStickDisabled = false;
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_j2);
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_g24);
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_k4);
      SecComputer_DWork.abnormalConditionWasActive = false;
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_b4);
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_fh);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_nd);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_n);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_a);
      SecComputer_MATLABFunction_g_Reset(&SecComputer_DWork.sf_MATLABFunction_e3);
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter_c);
      SecComputer_RateLimiter_Reset(&SecComputer_DWork.sf_RateLimiter);
      LawMDLOBJ1.reset();
      SecComputer_RateLimiter_n_Reset(&SecComputer_DWork.sf_RateLimiter_b);
      SecComputer_RateLimiter_n_Reset(&SecComputer_DWork.sf_RateLimiter_a);
      SecComputer_RateLimiter_n_Reset(&SecComputer_DWork.sf_RateLimiter_k);
      SecComputer_RateLimiter_n_Reset(&SecComputer_DWork.sf_RateLimiter_b4);
      LawMDLOBJ2.reset();
      LawMDLOBJ3.reset();
      SecComputer_MATLABFunction_e_Reset(&SecComputer_DWork.sf_MATLABFunction_i);
      SecComputer_DWork.Runtime_MODE = true;
    }

    rtb_OR1 = ((SecComputer_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::FailureWarning))
               || (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || SecComputer_P.Constant2_Value_c || SecComputer_P.Constant2_Value_c);
    rtb_OR3 = ((SecComputer_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::FailureWarning))
               || (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) || (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || SecComputer_P.Constant2_Value_c || SecComputer_P.Constant2_Value_c);
    rtb_singleAdrFault = (rtb_OR1 || rtb_OR3);
    rtb_doubleAdrFault = (rtb_OR1 && rtb_OR3);
    rtb_OR = ((SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) || SecComputer_P.Constant_Value_l);
    rtb_OR6 = ((SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM !=
                static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM !=
                static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || SecComputer_P.Constant_Value_l);
    rtb_singleIrFault = (rtb_OR || rtb_OR6);
    rtb_doubleIrFault = (rtb_OR && rtb_OR6);
    rtb_y_a = !rtb_OR1;
    rtb_AND11 = !rtb_OR3;
    if (rtb_y_a && rtb_AND11) {
      rtb_V_ias = (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   SecComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data + SecComputer_U.in.bus_inputs.adr_2_bus.mach.Data) /
        2.0F;
      rtb_alpha = (SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   SecComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
    } else if (rtb_y_a && rtb_OR3) {
      rtb_V_ias = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
      rtb_V_tas = SecComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
      rtb_mach = SecComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
      rtb_alpha = SecComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
    } else if (rtb_OR1 && rtb_AND11) {
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

    rtb_eta_trim_limit_lo_d = rtb_V_ias;
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn = rtb_V_tas;
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_mach = rtb_mach;
    rtb_y_a = !rtb_OR;
    rtb_AND11 = !rtb_OR6;
    if (rtb_y_a && rtb_AND11) {
      rtb_theta = (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                   SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
               SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
               SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                 SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                       SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                     SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else if (rtb_y_a && rtb_OR6) {
      rtb_theta = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
      rtb_phi = SecComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
      rtb_q = SecComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
      rtb_r = SecComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = SecComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
      rtb_n_y = SecComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
      rtb_n_z = SecComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
      rtb_theta_dot = SecComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = SecComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
    } else if (rtb_OR && rtb_AND11) {
      rtb_theta = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
      rtb_phi = SecComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
      rtb_q = SecComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
      rtb_r = SecComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = SecComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
      rtb_n_y = SecComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
      rtb_n_z = SecComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
      rtb_theta_dot = SecComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = SecComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
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

    rtb_Switch5_tmp_tmp = rtb_theta;
    rtb_Switch5 = rtb_theta;
    rtb_Switch6_m = rtb_phi;
    rtb_handleIndex = rtb_n_x;
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_y_g);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel13_bit, &rtb_Switch7_c);
    rtb_OR3 = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel12_bit, &rtb_Switch7_c);
    rtb_y_az = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel10_bit, &rtb_Switch7_c);
    rtb_OR3 = (rtb_OR3 || rtb_y_az || (rtb_Switch7_c != 0U));
    rtb_y_b5 = (rtb_y_g && rtb_OR3);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_NOT_bl);
    rtb_AND11 = (rtb_y_b5 && (!rtb_NOT_bl));
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_y_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel5_bit,
      &rtb_Switch7_c);
    rtb_y_az = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel4_bit,
      &rtb_Switch7_c);
    rtb_OR1 = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel2_bit,
      &rtb_Switch7_c);
    rtb_y_az = (rtb_y_az || rtb_OR1 || (rtb_Switch7_c != 0U));
    rtb_AND4_a = (rtb_y_a && rtb_y_az);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_NOT_bl);
    rtb_AND11 = (rtb_AND11 || (rtb_AND4_a && (!rtb_NOT_bl)) || (rtb_y_b5 && rtb_AND4_a));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel15_bit, &rtb_Switch7_c);
    rtb_OR1 = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_y_ji);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel14_bit, &rtb_Switch7_c);
    rtb_y_b5 = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3,
      SecComputer_P.BitfromLabel11_bit, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel8_bit,
      &rtb_Switch7_c);
    rtb_OR = ((!rtb_y_b5) && (!rtb_AND1_h) && (rtb_Switch7_c == 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3,
      SecComputer_P.BitfromLabel16_bit, &rtb_Switch7_c);
    rtb_NOT_bl = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_n(((rtb_Switch7_c != 0U) && rtb_y_g && rtb_OR3), SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode_isRisingEdge, SecComputer_P.ConfirmNode_timeDelay, &rtb_OR3,
      &SecComputer_DWork.sf_MATLABFunction_jk);
    rtb_OR3 = (rtb_OR1 && rtb_y_ji && rtb_OR && rtb_OR3);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, &rtb_AND1_h);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_NOT_bl);
    rtb_OR = ((!rtb_AND1_h) && (!rtb_NOT_bl));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, SecComputer_P.BitfromLabel7_bit,
      &rtb_Switch7_c);
    rtb_NOT_bl = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, &rtb_y_ji);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, SecComputer_P.BitfromLabel6_bit,
      &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, SecComputer_P.BitfromLabel3_bit,
      &rtb_Switch7_c);
    rtb_OR1 = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_3, SecComputer_P.BitfromLabel1_bit,
      &rtb_Switch7_c);
    rtb_OR1 = (rtb_NOT_bl && rtb_y_ji && ((!rtb_AND1_h) && (!rtb_OR1) && (rtb_Switch7_c == 0U)));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_3, SecComputer_P.BitfromLabel9_bit,
      &rtb_Switch7_c);
    rtb_NOT_bl = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_n(((rtb_Switch7_c != 0U) && rtb_y_a && rtb_y_az), SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode1_isRisingEdge, SecComputer_P.ConfirmNode1_timeDelay, &rtb_NOT_bl,
      &SecComputer_DWork.sf_MATLABFunction_dw);
    rtb_OR1 = (rtb_OR3 || rtb_OR || (rtb_OR1 && rtb_NOT_bl));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel4_bit_c, &rtb_Switch7_c);
    rtb_NOT_bl = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel6_bit_l, &rtb_Switch7_c);
    rtb_OR3 = (rtb_NOT_bl || (rtb_Switch7_c != 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel5_bit_a, &rtb_Switch7_c);
    rtb_NOT_bl = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel7_bit_m, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    rtb_OR = (rtb_NOT_bl || (rtb_Switch7_c != 0U));
    if (SecComputer_DWork.is_active_c8_SecComputer == 0) {
      SecComputer_DWork.is_active_c8_SecComputer = 1U;
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
      rtb_OR6 = true;
    } else if (SecComputer_DWork.is_c8_SecComputer == SecComputer_IN_InAir) {
      if ((static_cast<real_T>(rtb_OR3) > 0.1) || (static_cast<real_T>(rtb_OR) > 0.1)) {
        SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_OnGround;
        rtb_OR6 = true;
      } else {
        rtb_OR6 = false;
      }
    } else if ((!rtb_OR3) && (!rtb_OR)) {
      SecComputer_DWork.is_c8_SecComputer = SecComputer_IN_InAir;
      rtb_OR6 = false;
    } else {
      rtb_OR6 = true;
    }

    rtb_NOT_m2 = (SecComputer_U.in.sim_data.slew_on || SecComputer_U.in.sim_data.pause_on ||
                  SecComputer_U.in.sim_data.tracking_mode_on_override);
    if (SecComputer_DWork.is_active_c30_SecComputer == 0) {
      SecComputer_DWork.is_active_c30_SecComputer = 1U;
      SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Ground;
      SecComputer_B.in_flight = 0.0;
    } else {
      switch (SecComputer_DWork.is_c30_SecComputer) {
       case SecComputer_IN_Flight:
        if (rtb_OR6 && (rtb_theta < 2.5F)) {
          SecComputer_DWork.on_ground_time = SecComputer_U.in.time.simulation_time;
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_FlightToGroundTransition;
        } else {
          SecComputer_B.in_flight = 1.0;
        }
        break;

       case SecComputer_IN_FlightToGroundTransition:
        if (SecComputer_U.in.time.simulation_time - SecComputer_DWork.on_ground_time >= 5.0) {
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Ground;
          SecComputer_B.in_flight = 0.0;
        } else if ((!rtb_OR6) || (rtb_theta >= 2.5F)) {
          SecComputer_DWork.on_ground_time = 0.0;
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Flight;
          SecComputer_B.in_flight = 1.0;
        }
        break;

       default:
        if (((!rtb_OR6) && (rtb_theta > 8.0F)) || (SecComputer_P.Constant_Value_m > 400.0)) {
          SecComputer_DWork.on_ground_time = 0.0;
          SecComputer_DWork.is_c30_SecComputer = SecComputer_IN_Flight;
          SecComputer_B.in_flight = 1.0;
        } else {
          SecComputer_B.in_flight = 0.0;
        }
        break;
      }
    }

    rtb_NOT_bl = (SecComputer_B.in_flight != 0.0);
    SecComputer_MATLABFunction_n(!SecComputer_U.in.discrete_inputs.yellow_low_pressure, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode_isRisingEdge_a, SecComputer_P.ConfirmNode_timeDelay_c, &rtb_y_g,
      &SecComputer_DWork.sf_MATLABFunction_ndv);
    SecComputer_MATLABFunction_n(!SecComputer_U.in.discrete_inputs.blue_low_pressure, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode1_isRisingEdge_j, SecComputer_P.ConfirmNode1_timeDelay_k, &rtb_y_ji,
      &SecComputer_DWork.sf_MATLABFunction_gf);
    SecComputer_MATLABFunction_n(!SecComputer_U.in.discrete_inputs.green_low_pressure, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode2_isRisingEdge, SecComputer_P.ConfirmNode2_timeDelay, &rtb_y_a,
      &SecComputer_DWork.sf_MATLABFunction_h);
    rtb_BusAssignment_f_logic_ir_computation_data_n_z_g = rtb_n_z;
    rtb_BusAssignment_f_logic_ir_computation_data_theta_dot_deg_s = rtb_theta_dot;
    SecComputer_MATLABFunction_e(SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      SecComputer_P.PulseNode_isRisingEdge, &rtb_AND1_h, &SecComputer_DWork.sf_MATLABFunction_g4b);
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
        SecComputer_DWork.Delay_DSTATE_c);
    }

    SecComputer_MATLABFunction_n((SecComputer_DWork.pLeftStickDisabled &&
      (SecComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || SecComputer_DWork.Delay_DSTATE_c)),
      SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode1_isRisingEdge_k, SecComputer_P.ConfirmNode1_timeDelay_a,
      &rtb_OR3, &SecComputer_DWork.sf_MATLABFunction_j2);
    SecComputer_MATLABFunction_n((SecComputer_DWork.pRightStickDisabled &&
      (SecComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || SecComputer_DWork.Delay1_DSTATE)),
      SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_j, SecComputer_P.ConfirmNode_timeDelay_a, &rtb_OR,
      &SecComputer_DWork.sf_MATLABFunction_g24);
    if (SecComputer_DWork.pLeftStickDisabled) {
      rollCommand = SecComputer_P.Constant1_Value_p;
    } else {
      rollCommand = SecComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    if (!SecComputer_DWork.pRightStickDisabled) {
      rtb_zeta_deg = SecComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_zeta_deg = SecComputer_P.Constant1_Value_p;
    }

    pair1SpdBrkCommand = rtb_zeta_deg + rollCommand;
    if (pair1SpdBrkCommand > SecComputer_P.Saturation1_UpperSat) {
      pair1SpdBrkCommand = SecComputer_P.Saturation1_UpperSat;
    } else if (pair1SpdBrkCommand < SecComputer_P.Saturation1_LowerSat) {
      pair1SpdBrkCommand = SecComputer_P.Saturation1_LowerSat;
    }

    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      leftElevatorAvail = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_y_ji);
      rightElevatorAvail = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_y_ji);
    } else {
      leftElevatorAvail = ((!SecComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_y_a);
      rightElevatorAvail = ((!SecComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_y_g);
    }

    rtb_thsAvail = ((!SecComputer_U.in.discrete_inputs.ths_motor_fault) && (rtb_y_g || rtb_y_a));
    canEngageInPitch = ((leftElevatorAvail || rightElevatorAvail) && (!SecComputer_U.in.discrete_inputs.is_unit_3));
    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
                            SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2 &&
                            SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp &&
                            SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp);
      spoilerPair1SupplyAvail = rtb_y_ji;
      rtb_AND1_h = rtb_y_g;
    } else {
      hasPriorityInPitch = (SecComputer_U.in.discrete_inputs.is_unit_2 &&
                            (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
        SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2));
      if (SecComputer_U.in.discrete_inputs.is_unit_2) {
        spoilerPair1SupplyAvail = rtb_y_a;
        rtb_AND1_h = false;
      } else {
        spoilerPair1SupplyAvail = rtb_y_a;
        rtb_AND1_h = rtb_y_g;
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
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel_bit, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1, &rtb_AND4_a);
    rtb_y_b5 = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel1_bit_g, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1, &rtb_AND1_h);
    rtb_AND2_j = ((rtb_Switch7_c != 0U) && rtb_AND1_h);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel2_bit_k, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_AND4_a);
    rtb_AND4_a = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel3_bit_o, &rtb_Switch7_c);
    rtb_NOT_bl = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_AND1_h);
    SecComputer_MATLABFunction_n(SecComputer_U.in.sim_data.slew_on, SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode_isRisingEdge_g, SecComputer_P.ConfirmNode_timeDelay_e, &rtb_NOT_bl,
      &SecComputer_DWork.sf_MATLABFunction_k4);
    rtb_y_az = !rtb_OR6;
    abnormalCondition = ((!rtb_NOT_bl) && rtb_y_az && (((!rtb_doubleAdrFault) && ((rtb_mach > 0.91) || (rtb_alpha <
      -10.0F) || (rtb_alpha > 40.0F) || (rtb_V_ias > 440.0F) || (rtb_V_ias < 60.0F))) || ((!rtb_doubleIrFault) &&
      ((!rtb_singleIrFault) || (!SecComputer_P.Constant_Value_l)) && ((std::abs(static_cast<real_T>(rtb_phi)) > 125.0) ||
      ((rtb_theta > 50.0F) || (rtb_theta < -30.0F))))));
    SecComputer_DWork.abnormalConditionWasActive = (abnormalCondition || (rtb_y_az &&
      SecComputer_DWork.abnormalConditionWasActive));
    if (rtb_doubleIrFault || ((SecComputer_B.in_flight != 0.0) && ((rtb_AND11 && (!rtb_OR1)) || ((rtb_AND4_a ||
            ((rtb_Switch7_c != 0U) && rtb_AND1_h)) && rtb_OR1)))) {
      rtb_pitchLawCapability = pitch_efcs_law::DirectLaw;
    } else if ((rtb_singleAdrFault && SecComputer_P.Constant2_Value_c) || rtb_doubleAdrFault ||
               SecComputer_DWork.abnormalConditionWasActive || ((!rtb_y_b5) && (!rtb_AND2_j) && ((!leftElevatorAvail) ||
      (!rightElevatorAvail)))) {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw2;
    } else {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw1;
    }

    if (rtb_isEngagedInPitch) {
      rtb_activePitchLaw = rtb_pitchLawCapability;
    } else {
      rtb_activePitchLaw = pitch_efcs_law::None;
    }

    if (!SecComputer_DWork.pRightStickDisabled) {
      rtb_zeta_deg = SecComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_zeta_deg = SecComputer_P.Constant_Value_p;
    }

    if (SecComputer_DWork.pLeftStickDisabled) {
      u0_0 = SecComputer_P.Constant_Value_p;
    } else {
      u0_0 = SecComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    u0_0 += rtb_zeta_deg;
    if (u0_0 > SecComputer_P.Saturation_UpperSat_d) {
      u0_0 = SecComputer_P.Saturation_UpperSat_d;
    } else if (u0_0 < SecComputer_P.Saturation_LowerSat_h) {
      u0_0 = SecComputer_P.Saturation_LowerSat_h;
    }

    SecComputer_MATLABFunction_e((SecComputer_B.in_flight != 0.0), SecComputer_P.PulseNode_isRisingEdge_h, &rtb_y_b5,
      &SecComputer_DWork.sf_MATLABFunction_b4);
    rtb_AND1_e_tmp = (SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1 &&
                      SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2);
    rtb_AND1_h = (SecComputer_U.in.discrete_inputs.is_unit_1 && rtb_thsAvail && rtb_AND1_e_tmp);
    SecComputer_DWork.Memory_PreviousInput = SecComputer_P.Logic_table[((((!rtb_AND1_h) || (std::abs
      (SecComputer_U.in.analog_inputs.ths_pos_deg) <= SecComputer_P.CompareToConstant1_const) ||
      SecComputer_U.in.discrete_inputs.ths_override_active) + (static_cast<uint32_T>(rtb_y_b5) << 1)) << 1) +
      SecComputer_DWork.Memory_PreviousInput];
    rtb_NOT_bl = (rtb_AND1_h && SecComputer_DWork.Memory_PreviousInput);
    rtb_AND4_a = !abnormalCondition;
    rtb_y_b5 = ((rtb_isEngagedInPitch && (SecComputer_B.in_flight != 0.0) && ((rtb_activePitchLaw !=
      SecComputer_P.EnumeratedConstant_Value_f) && rtb_AND4_a)) || rtb_NOT_bl);
    rtb_AND2_j = rtb_NOT_bl;
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel7_bit_g, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2, &rtb_AND1_h);
    rtb_NOT_bl = ((rtb_Switch7_c != 0U) && rtb_AND1_h);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel6_bit_f, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2, &rtb_AND4_a);
    rtb_y_az = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel_bit_l, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_AND4_a);
    rtb_AND4_a = ((rtb_Switch7_c != 0U) && rtb_AND4_a);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      SecComputer_P.BitfromLabel1_bit_p, &rtb_Switch7_c);
    SecComputer_MATLABFunction_l(&SecComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_AND1_h);
    rtb_AND1_h = ((rtb_Switch7_c != 0U) && rtb_AND1_h);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel5_bit_p, &rtb_Switch7_c);
    rtb_NOT2_b = (rtb_Switch7_c == 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel4_bit_e, &rtb_Switch7_c);
    rtb_NOT2_b = (rtb_NOT2_b || (rtb_Switch7_c == 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel3_bit_oz, &rtb_Switch7_c);
    rtb_NOT_g = (rtb_Switch7_c == 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel2_bit_p, &rtb_Switch7_c);
    rtb_NOT_bl = (rtb_NOT_bl || rtb_y_az || (rtb_AND4_a || rtb_AND1_h) || (((!rtb_AND1_e_tmp) && rtb_NOT2_b &&
      (rtb_NOT_g || (rtb_Switch7_c == 0U))) || (rtb_AND1_e_tmp &&
      ((SecComputer_U.in.discrete_inputs.left_elev_not_avail_sec_opp && (!leftElevatorAvail)) ||
       (SecComputer_U.in.discrete_inputs.right_elev_not_avail_sec_opp && (!rightElevatorAvail))))) ||
                  ((SecComputer_U.in.analog_inputs.thr_lever_1_pos >= SecComputer_P.CompareToConstant3_const) ||
                   (SecComputer_U.in.analog_inputs.thr_lever_2_pos >= SecComputer_P.CompareToConstant4_const)));
    SecComputer_MATLABFunction_n((SecComputer_U.in.analog_inputs.spd_brk_lever_pos <
      SecComputer_P.CompareToConstant_const), SecComputer_U.in.time.dt, SecComputer_P.ConfirmNode_isRisingEdge_e,
      SecComputer_P.ConfirmNode_timeDelay_eq, &rtb_y_az, &SecComputer_DWork.sf_MATLABFunction_fh);
    SecComputer_DWork.Memory_PreviousInput_f = SecComputer_P.Logic_table_i[(((static_cast<uint32_T>(rtb_NOT_bl) << 1) +
      rtb_y_az) << 1) + SecComputer_DWork.Memory_PreviousInput_f];
    rtb_y_az = (rtb_NOT_bl || SecComputer_DWork.Memory_PreviousInput_f);
    rtb_NOT2_b = rtb_y_g;
    rtb_NOT_g = rtb_y_ji;
    rtb_AND1_e_tmp = rtb_y_a;
    SecComputer_MATLABFunction_e(rtb_OR6, SecComputer_P.PulseNode3_isRisingEdge, &rtb_y_a,
      &SecComputer_DWork.sf_MATLABFunction_nd);
    rtb_NOT_bl = (rtb_y_a || ((SecComputer_U.in.analog_inputs.wheel_speed_left < SecComputer_P.CompareToConstant11_const)
      && (SecComputer_U.in.analog_inputs.wheel_speed_right < SecComputer_P.CompareToConstant12_const)));
    SecComputer_MATLABFunction_e(rtb_OR6, SecComputer_P.PulseNode2_isRisingEdge, &rtb_y_a,
      &SecComputer_DWork.sf_MATLABFunction_n);
    SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.Logic_table_ii[(((static_cast<uint32_T>(rtb_NOT_bl) << 1) +
      rtb_y_a) << 1) + SecComputer_DWork.Memory_PreviousInput_n];
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel4_bit_a, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel6_bit_d, &rtb_Switch7_c);
    rtb_y_a = (rtb_AND1_h && (rtb_Switch7_c != 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel5_bit_i, &rtb_Switch7_c);
    rtb_AND1_h = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel7_bit_ms, &rtb_Switch7_c);
    SecComputer_MATLABFunction_e((rtb_y_a || (rtb_AND1_h && (rtb_Switch7_c != 0U))),
      SecComputer_P.PulseNode1_isRisingEdge_k, &rtb_y_ji, &SecComputer_DWork.sf_MATLABFunction_a);
    rtb_NOT_bl = (SecComputer_U.in.analog_inputs.spd_brk_lever_pos < SecComputer_P.CompareToConstant_const_m);
    rtb_AND1_h = ((((SecComputer_U.in.analog_inputs.spd_brk_lever_pos > SecComputer_P.CompareToConstant15_const) ||
                    rtb_NOT_bl) && ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <
      SecComputer_P.CompareToConstant1_const_l) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <
      SecComputer_P.CompareToConstant2_const))) || (((SecComputer_U.in.analog_inputs.thr_lever_1_pos <
      SecComputer_P.CompareToConstant3_const_a) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <=
      SecComputer_P.CompareToConstant4_const_j)) || ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
      SecComputer_P.CompareToConstant13_const) && (SecComputer_U.in.analog_inputs.thr_lever_2_pos <
      SecComputer_P.CompareToConstant14_const))));
    SecComputer_DWork.Delay1_DSTATE_i = (rtb_AND1_h && (rtb_y_ji || ((SecComputer_U.in.analog_inputs.wheel_speed_left >=
      SecComputer_P.CompareToConstant5_const) && (SecComputer_U.in.analog_inputs.wheel_speed_right >=
      SecComputer_P.CompareToConstant6_const) && SecComputer_DWork.Memory_PreviousInput_n) ||
      SecComputer_DWork.Delay1_DSTATE_i));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel_bit_g, &rtb_Switch7_c);
    rtb_AND4_a = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel2_bit_l, &rtb_Switch7_c);
    rtb_y_a = (rtb_AND4_a || (rtb_Switch7_c != 0U));
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_1_bus.discrete_word_2,
      SecComputer_P.BitfromLabel1_bit_a, &rtb_Switch7_c);
    rtb_AND4_a = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.lgciu_2_bus.discrete_word_2,
      SecComputer_P.BitfromLabel3_bit_m, &rtb_Switch7_c);
    SecComputer_Y.out.discrete_outputs.batt_power_supply = (rtb_Switch7_c != 0U);
    SecComputer_MATLABFunction_e((rtb_y_a || (rtb_AND4_a || (rtb_Switch7_c != 0U))),
      SecComputer_P.PulseNode_isRisingEdge_hj, &rtb_y_g, &SecComputer_DWork.sf_MATLABFunction_e3);
    SecComputer_DWork.Delay_DSTATE_n = (rtb_AND1_h && (rtb_y_g || SecComputer_DWork.Delay_DSTATE_n));
    rtb_AND4_a = (SecComputer_U.in.analog_inputs.thr_lever_2_pos <= SecComputer_P.CompareToConstant8_const);
    SecComputer_DWork.Delay2_DSTATE = (rtb_NOT_bl && ((SecComputer_U.in.analog_inputs.thr_lever_1_pos <=
      SecComputer_P.CompareToConstant7_const) && rtb_AND4_a) && (rtb_y_ji || SecComputer_DWork.Delay2_DSTATE));
    rtb_AND1_h = ((!SecComputer_DWork.Delay1_DSTATE_i) && (SecComputer_DWork.Delay_DSTATE_n ||
      SecComputer_DWork.Delay2_DSTATE));
    SecComputer_Y.out.logic.total_sidestick_roll_command = pair1SpdBrkCommand;
    rtb_y_ji = rtb_NOT_bl;
    if (SecComputer_DWork.Delay1_DSTATE_i) {
      rtb_zeta_deg = SecComputer_P.Constant_Value;
    } else if (rtb_AND1_h) {
      rtb_zeta_deg = SecComputer_P.Constant1_Value;
    } else {
      rtb_zeta_deg = SecComputer_P.Constant2_Value;
    }

    SecComputer_RateLimiter(rtb_zeta_deg, SecComputer_P.RateLimiterVariableTs6_up,
      SecComputer_P.RateLimiterVariableTs6_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs6_InitialCondition, &rtb_handleIndex, &SecComputer_DWork.sf_RateLimiter_c);
    rtb_NOT_bl = (SecComputer_DWork.Delay1_DSTATE_i || rtb_AND1_h);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel4_bit_m, &rtb_Switch7_c);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2,
      SecComputer_P.BitfromLabel5_bit_h, &rtb_y);
    if (rtb_y_az) {
      rtb_Switch3 = SecComputer_P.Constant3_Value;
    } else {
      if ((rtb_Switch7_c != 0U) || (rtb_y != 0U)) {
        rtb_Switch5 = SecComputer_P.Constant4_Value_k;
      } else {
        rtb_Switch5 = SecComputer_P.Constant5_Value;
      }

      if (SecComputer_U.in.analog_inputs.spd_brk_lever_pos <= rtb_Switch5) {
        rtb_Switch5 *= SecComputer_P.Gain_Gain;
        if (SecComputer_U.in.analog_inputs.spd_brk_lever_pos >= rtb_Switch5) {
          rtb_Switch5 = SecComputer_U.in.analog_inputs.spd_brk_lever_pos;
        }
      }

      rtb_Switch3 = look1_binlxpw(rtb_Switch5, SecComputer_P.uDLookupTable_bp01Data,
        SecComputer_P.uDLookupTable_tableData, 4U);
    }

    SecComputer_RateLimiter(rtb_Switch3, SecComputer_P.RateLimiterVariableTs1_up,
      SecComputer_P.RateLimiterVariableTs1_lo, SecComputer_U.in.time.dt,
      SecComputer_P.RateLimiterVariableTs1_InitialCondition, &rtb_Switch5, &SecComputer_DWork.sf_RateLimiter);
    LawMDLOBJ1.step(&SecComputer_U.in.time.dt, &pair1SpdBrkCommand, &rtb_Switch3, &rtb_zeta_deg);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel_bit_a, &rtb_Switch7_c);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel1_bit_c, &rtb_y);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel2_bit_o, &rtb_y_l);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      SecComputer_P.BitfromLabel3_bit_j, &rtb_y_im);
    if (SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
         NormalOperation)) {
      pair1SpdBrkCommand = SecComputer_U.in.bus_inputs.elac_1_bus.roll_spoiler_command_deg.Data;
      rtb_y_a = (rtb_Switch7_c != 0U);
      rtb_y_g = (rtb_y_l != 0U);
    } else if (SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.SSM == static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) {
      pair1SpdBrkCommand = SecComputer_U.in.bus_inputs.elac_2_bus.roll_spoiler_command_deg.Data;
      rtb_y_a = (rtb_y != 0U);
      rtb_y_g = (rtb_y_im != 0U);
    } else {
      pair1SpdBrkCommand = rtb_Switch3 * 35.0 / 25.0;
      rtb_y_a = true;
      rtb_y_g = true;
    }

    rollCommand = std::fmax(std::fmin(pair1SpdBrkCommand, 35.0), -35.0);
    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      if (rtb_y_a) {
        pair1RollCommand = rollCommand;
      } else {
        pair1RollCommand = 0.0;
      }

      rtb_Switch3 = rollCommand;
      pair1SpdBrkCommand = rtb_Switch5;
      rtb_zeta_deg = rtb_Switch5;
    } else if (SecComputer_U.in.discrete_inputs.is_unit_2) {
      pair1RollCommand = rollCommand;
      rtb_Switch3 = 0.0;
      pair1SpdBrkCommand = 0.0;
      rtb_zeta_deg = 0.0;
    } else {
      pair1RollCommand = 0.0;
      if (rtb_y_g) {
        rtb_Switch3 = rollCommand;
      } else {
        rtb_Switch3 = 0.0;
      }

      pair1SpdBrkCommand = 0.0;
      rtb_zeta_deg = rtb_Switch5 / 2.0;
    }

    if (rollCommand >= 0.0) {
      rollCommand = pair1SpdBrkCommand - pair1RollCommand;
      pair1RollCommand = rtb_zeta_deg - rtb_Switch3;
    } else {
      rollCommand = pair1SpdBrkCommand;
      pair1SpdBrkCommand += pair1RollCommand;
      pair1RollCommand = rtb_zeta_deg;
      rtb_zeta_deg += rtb_Switch3;
    }

    if (rtb_NOT_bl) {
      u0 = rtb_handleIndex;
    } else {
      u0 = std::fmax(rollCommand - (pair1SpdBrkCommand - std::fmax(pair1SpdBrkCommand, -50.0)), -50.0);
    }

    if (u0 > SecComputer_P.Saturation_UpperSat_n) {
      u0 = SecComputer_P.Saturation_UpperSat_n;
    } else if (u0 < SecComputer_P.Saturation_LowerSat_n) {
      u0 = SecComputer_P.Saturation_LowerSat_n;
    }

    rtb_y_a = !spoilerPair1SupplyAvail;
    SecComputer_RateLimiter_b(u0, SecComputer_P.RateLimiterGenericVariableTs_up,
      SecComputer_P.RateLimiterGenericVariableTs_lo, SecComputer_U.in.time.dt,
      SecComputer_U.in.analog_inputs.left_spoiler_1_pos_deg, rtb_y_a, &rtb_Switch3, &SecComputer_DWork.sf_RateLimiter_b);
    if (rtb_NOT_bl) {
      u0 = rtb_handleIndex;
    } else {
      u0 = std::fmax(pair1SpdBrkCommand - (rollCommand - std::fmax(rollCommand, -50.0)), -50.0);
    }

    if (u0 > SecComputer_P.Saturation1_UpperSat_e) {
      u0 = SecComputer_P.Saturation1_UpperSat_e;
    } else if (u0 < SecComputer_P.Saturation1_LowerSat_f) {
      u0 = SecComputer_P.Saturation1_LowerSat_f;
    }

    SecComputer_RateLimiter_b(u0, SecComputer_P.RateLimiterGenericVariableTs1_up,
      SecComputer_P.RateLimiterGenericVariableTs1_lo, SecComputer_U.in.time.dt,
      SecComputer_U.in.analog_inputs.right_spoiler_1_pos_deg, rtb_y_a, &rollCommand, &SecComputer_DWork.sf_RateLimiter_a);
    if (rtb_NOT_bl) {
      u0 = rtb_handleIndex;
    } else {
      u0 = std::fmax(pair1RollCommand - (rtb_zeta_deg - std::fmax(rtb_zeta_deg, -50.0)), -50.0);
    }

    if (u0 > SecComputer_P.Saturation2_UpperSat) {
      u0 = SecComputer_P.Saturation2_UpperSat;
    } else if (u0 < SecComputer_P.Saturation2_LowerSat) {
      u0 = SecComputer_P.Saturation2_LowerSat;
    }

    rtb_y_a = !spoiler_pair_2_avail;
    SecComputer_RateLimiter_b(u0, SecComputer_P.RateLimiterGenericVariableTs2_up,
      SecComputer_P.RateLimiterGenericVariableTs2_lo, SecComputer_U.in.time.dt,
      SecComputer_U.in.analog_inputs.left_spoiler_2_pos_deg, rtb_y_a, &pair1SpdBrkCommand,
      &SecComputer_DWork.sf_RateLimiter_k);
    if (!rtb_NOT_bl) {
      rtb_handleIndex = std::fmax(rtb_zeta_deg - (pair1RollCommand - std::fmax(pair1RollCommand, -50.0)), -50.0);
    }

    if (rtb_handleIndex > SecComputer_P.Saturation3_UpperSat) {
      rtb_zeta_deg = SecComputer_P.Saturation3_UpperSat;
    } else if (rtb_handleIndex < SecComputer_P.Saturation3_LowerSat) {
      rtb_zeta_deg = SecComputer_P.Saturation3_LowerSat;
    } else {
      rtb_zeta_deg = rtb_handleIndex;
    }

    SecComputer_RateLimiter_b(rtb_zeta_deg, SecComputer_P.RateLimiterGenericVariableTs3_up,
      SecComputer_P.RateLimiterGenericVariableTs3_lo, SecComputer_U.in.time.dt,
      SecComputer_U.in.analog_inputs.right_spoiler_2_pos_deg, rtb_y_a, &rtb_handleIndex,
      &SecComputer_DWork.sf_RateLimiter_b4);
    rtb_zeta_deg = rollCommand;
    pair1RollCommand = pair1SpdBrkCommand;
    u0 = rtb_handleIndex;
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel_bit_a1, &rtb_y_im);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel1_bit_gf, &rtb_y_l);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel2_bit_n, &rtb_y);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel3_bit_l, &rtb_Switch9_c);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel4_bit_n, &rtb_DataTypeConversion1);
    SecComputer_MATLABFunction(&SecComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      SecComputer_P.BitfromLabel5_bit_m, &rtb_Switch7_c);
    if (rtb_y_im != 0U) {
      rtb_handleIndex = 0.0;
    } else if ((rtb_y_l != 0U) && (rtb_Switch7_c != 0U)) {
      rtb_handleIndex = 1.0;
    } else if ((rtb_y_l != 0U) && (rtb_Switch7_c == 0U)) {
      rtb_handleIndex = 2.0;
    } else if (rtb_y != 0U) {
      rtb_handleIndex = 3.0;
    } else if (rtb_Switch9_c != 0U) {
      rtb_handleIndex = 4.0;
    } else if (rtb_DataTypeConversion1 != 0U) {
      rtb_handleIndex = 5.0;
    } else {
      rtb_handleIndex = 0.0;
    }

    pair1SpdBrkCommand = (SecComputer_B.in_flight != 0.0);
    rtb_y_a = (rtb_NOT_m2 || ((static_cast<real_T>(rtb_activePitchLaw) != SecComputer_P.CompareToConstant2_const_f) && (
      static_cast<real_T>(rtb_activePitchLaw) != SecComputer_P.CompareToConstant3_const_o)));
    rtb_y_g = (rtb_activePitchLaw != SecComputer_P.EnumeratedConstant_Value_i);
    LawMDLOBJ2.step(&SecComputer_U.in.time.dt, &rtb_BusAssignment_f_logic_ir_computation_data_n_z_g,
                    &rtb_Switch5_tmp_tmp, &rtb_Switch6_m, &rtb_BusAssignment_f_logic_ir_computation_data_theta_dot_deg_s,
                    (const_cast<real_T*>(&SecComputer_RGND)), &SecComputer_U.in.analog_inputs.ths_pos_deg,
                    &rtb_eta_trim_limit_lo_d, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_mach,
                    &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn, &rtb_handleIndex, (
      const_cast<real_T*>(&SecComputer_RGND)), (const_cast<real_T*>(&SecComputer_RGND)), &u0_0, &pair1SpdBrkCommand,
                    &rtb_y_a, &rtb_y_g, &rtb_eta_deg, &rtb_eta_trim_dot_deg_s, &rtb_eta_trim_limit_lo,
                    &rtb_eta_trim_limit_up);
    LawMDLOBJ3.step(&SecComputer_U.in.time.dt, &u0_0, &rtb_handleIndex, &rollCommand, &rtb_eta_trim_limit_lo_d,
                    &pair1SpdBrkCommand);
    switch (static_cast<int32_T>(rtb_activePitchLaw)) {
     case 1:
     case 2:
      rtb_handleIndex = rtb_eta_deg;
      break;

     case 3:
      break;

     default:
      rtb_handleIndex = SecComputer_P.Constant1_Value_px;
      break;
    }

    switch (static_cast<int32_T>(rtb_activePitchLaw)) {
     case 1:
     case 2:
      pair1SpdBrkCommand = rtb_eta_trim_limit_up;
      break;

     case 3:
      break;

     default:
      pair1SpdBrkCommand = SecComputer_P.Constant2_Value_g;
      break;
    }

    if (rtb_AND2_j) {
      rollCommand = SecComputer_P.Gain_Gain_m * SecComputer_DWork.Delay_DSTATE;
      if (rollCommand > SecComputer_P.Saturation_UpperSat) {
        rollCommand = SecComputer_P.Saturation_UpperSat;
      } else if (rollCommand < SecComputer_P.Saturation_LowerSat) {
        rollCommand = SecComputer_P.Saturation_LowerSat;
      }
    } else if (SecComputer_U.in.discrete_inputs.ths_override_active) {
      rollCommand = SecComputer_P.Constant_Value_a;
    } else {
      switch (static_cast<int32_T>(rtb_activePitchLaw)) {
       case 1:
       case 2:
        rollCommand = rtb_eta_trim_dot_deg_s;
        break;

       case 3:
        break;

       default:
        rollCommand = SecComputer_P.Constant1_Value_px;
        break;
      }
    }

    rollCommand = SecComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rollCommand * SecComputer_U.in.time.dt;
    SecComputer_DWork.icLoad = ((!rtb_y_b5) || SecComputer_DWork.icLoad);
    if (SecComputer_DWork.icLoad) {
      SecComputer_DWork.Delay_DSTATE_l = SecComputer_U.in.analog_inputs.ths_pos_deg - rollCommand;
    }

    SecComputer_DWork.Delay_DSTATE = rollCommand + SecComputer_DWork.Delay_DSTATE_l;
    if (SecComputer_DWork.Delay_DSTATE > pair1SpdBrkCommand) {
      SecComputer_DWork.Delay_DSTATE = pair1SpdBrkCommand;
    } else {
      switch (static_cast<int32_T>(rtb_activePitchLaw)) {
       case 1:
       case 2:
        rtb_eta_trim_limit_lo_d = rtb_eta_trim_limit_lo;
        break;

       case 3:
        break;

       default:
        rtb_eta_trim_limit_lo_d = SecComputer_P.Constant3_Value_i;
        break;
      }

      if (SecComputer_DWork.Delay_DSTATE < rtb_eta_trim_limit_lo_d) {
        SecComputer_DWork.Delay_DSTATE = rtb_eta_trim_limit_lo_d;
      }
    }

    SecComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_handleIndex;
    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch8 = SecComputer_U.in.bus_inputs.elac_2_bus.elevator_double_pressurization_command_deg;
    } else if (SecComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch8 = SecComputer_U.in.bus_inputs.elac_1_bus.elevator_double_pressurization_command_deg;
    } else {
      tmp = std::fmod(std::floor(SecComputer_P.Constant1_Value_m), 4.2949673E+9F);
      rtb_Switch8.SSM = tmp < 0.0F ? static_cast<uint32_T>(-static_cast<int32_T>(static_cast<uint32_T>(-tmp))) :
        static_cast<uint32_T>(tmp);
      rtb_Switch8.Data = SecComputer_P.Constant1_Value_m;
    }

    SecComputer_MATLABFunction_l(&rtb_Switch8, &rtb_AND4_a);
    if (SecComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_y_a = SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_1;
    } else {
      rtb_y_a = SecComputer_U.in.discrete_inputs.pitch_not_avail_elac_2;
    }

    rtb_NOT_bl = (rtb_y_a && (!rtb_isEngagedInPitch) && rtb_AND4_a);
    if (rtb_NOT_bl) {
      rtb_handleIndex = rtb_Switch8.Data;
    }

    SecComputer_MATLABFunction_n((rtb_NOT2_b || rtb_NOT_g || rtb_AND1_e_tmp), SecComputer_U.in.time.dt,
      SecComputer_P.ConfirmNode_isRisingEdge_c, SecComputer_P.ConfirmNode_timeDelay_m,
      &SecComputer_Y.out.discrete_outputs.batt_power_supply, &SecComputer_DWork.sf_MATLABFunction_i);
    SecComputer_Y.out.bus_outputs.discrete_status_word_2.Data = static_cast<real32_T>
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
    rtb_VectorConcatenate[15] = rtb_y_ji;
    rtb_VectorConcatenate[16] = SecComputer_P.Constant8_Value;
    rtb_VectorConcatenate[17] = SecComputer_P.Constant8_Value;
    rtb_VectorConcatenate[18] = SecComputer_P.Constant8_Value;
    SecComputer_MATLABFunction_c(rtb_VectorConcatenate, &SecComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
    rtb_VectorConcatenate[0] = SecComputer_P.Constant7_Value;
    rtb_VectorConcatenate[1] = SecComputer_P.Constant7_Value;
    rtb_VectorConcatenate[2] = SecComputer_DWork.pLeftStickDisabled;
    rtb_VectorConcatenate[3] = SecComputer_DWork.pRightStickDisabled;
    rtb_VectorConcatenate[4] = rtb_OR3;
    rtb_VectorConcatenate[5] = rtb_OR;
    rtb_VectorConcatenate[6] = rtb_OR1;
    rtb_VectorConcatenate[7] = rtb_AND11;
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
    SecComputer_MATLABFunction_c(rtb_VectorConcatenate, &SecComputer_Y.out.bus_outputs.discrete_status_word_2.Data);
    SecComputer_Y.out.data = SecComputer_U.in;
    SecComputer_Y.out.laws.lateral_law_outputs.left_spoiler_1_command_deg = rtb_Switch3;
    SecComputer_Y.out.laws.lateral_law_outputs.right_spoiler_1_command_deg = rtb_zeta_deg;
    SecComputer_Y.out.laws.lateral_law_outputs.left_spoiler_2_command_deg = pair1RollCommand;
    SecComputer_Y.out.laws.lateral_law_outputs.right_spoiler_2_command_deg = u0;
    SecComputer_Y.out.laws.lateral_law_outputs.speedbrake_command_deg = rtb_Switch5;
    SecComputer_Y.out.laws.pitch_law_outputs.ths_command_deg = SecComputer_DWork.Delay_DSTATE;
    SecComputer_Y.out.logic.on_ground = rtb_OR6;
    SecComputer_Y.out.logic.pitch_law_in_flight = (SecComputer_B.in_flight != 0.0);
    SecComputer_Y.out.logic.tracking_mode_on = rtb_NOT_m2;
    SecComputer_Y.out.logic.pitch_law_capability = rtb_pitchLawCapability;
    SecComputer_Y.out.logic.active_pitch_law = rtb_activePitchLaw;
    SecComputer_Y.out.logic.abnormal_condition_law_active = abnormalCondition;
    SecComputer_Y.out.logic.is_engaged_in_pitch = rtb_isEngagedInPitch;
    SecComputer_Y.out.logic.can_engage_in_pitch = canEngageInPitch;
    SecComputer_Y.out.logic.has_priority_in_pitch = hasPriorityInPitch;
    SecComputer_Y.out.logic.left_elevator_avail = leftElevatorAvail;
    SecComputer_Y.out.logic.right_elevator_avail = rightElevatorAvail;
    SecComputer_Y.out.logic.ths_avail = rtb_thsAvail;
    SecComputer_Y.out.logic.ths_active_commanded = rtb_y_b5;
    SecComputer_Y.out.logic.ths_ground_setting_active = rtb_AND2_j;
    SecComputer_Y.out.logic.is_engaged_in_roll = rtb_isEngagedInRoll;
    SecComputer_Y.out.logic.spoiler_pair_1_avail = spoilerPair1SupplyAvail;
    SecComputer_Y.out.logic.spoiler_pair_2_avail = spoiler_pair_2_avail;
    SecComputer_Y.out.logic.is_yellow_hydraulic_power_avail = rtb_NOT2_b;
    SecComputer_Y.out.logic.is_blue_hydraulic_power_avail = rtb_NOT_g;
    SecComputer_Y.out.logic.is_green_hydraulic_power_avail = rtb_AND1_e_tmp;
    SecComputer_Y.out.logic.left_sidestick_disabled = SecComputer_DWork.pLeftStickDisabled;
    SecComputer_Y.out.logic.right_sidestick_disabled = SecComputer_DWork.pRightStickDisabled;
    SecComputer_Y.out.logic.left_sidestick_priority_locked = rtb_OR3;
    SecComputer_Y.out.logic.right_sidestick_priority_locked = rtb_OR;
    SecComputer_Y.out.logic.total_sidestick_pitch_command = u0_0;
    SecComputer_Y.out.logic.ground_spoilers_armed = rtb_y_ji;
    SecComputer_Y.out.logic.ground_spoilers_out = SecComputer_DWork.Delay1_DSTATE_i;
    SecComputer_Y.out.logic.partial_lift_dumping_active = rtb_AND1_h;
    SecComputer_Y.out.logic.speed_brake_inhibited = rtb_y_az;
    SecComputer_Y.out.logic.single_adr_failure = rtb_singleAdrFault;
    SecComputer_Y.out.logic.double_adr_failure = rtb_doubleAdrFault;
    SecComputer_Y.out.logic.cas_or_mach_disagree = SecComputer_P.Constant2_Value_c;
    SecComputer_Y.out.logic.alpha_disagree = SecComputer_P.Constant2_Value_c;
    SecComputer_Y.out.logic.single_ir_failure = rtb_singleIrFault;
    SecComputer_Y.out.logic.double_ir_failure = rtb_doubleIrFault;
    SecComputer_Y.out.logic.ir_disagree = SecComputer_P.Constant_Value_l;
    SecComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    SecComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    SecComputer_Y.out.logic.adr_computation_data.mach = rtb_mach;
    SecComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_alpha;
    SecComputer_Y.out.logic.ir_computation_data.theta_deg = rtb_theta;
    SecComputer_Y.out.logic.ir_computation_data.phi_deg = rtb_phi;
    SecComputer_Y.out.logic.ir_computation_data.q_deg_s = rtb_q;
    SecComputer_Y.out.logic.ir_computation_data.r_deg_s = rtb_r;
    SecComputer_Y.out.logic.ir_computation_data.n_x_g = rtb_n_x;
    SecComputer_Y.out.logic.ir_computation_data.n_y_g = rtb_n_y;
    SecComputer_Y.out.logic.ir_computation_data.n_z_g = rtb_n_z;
    SecComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    SecComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    SecComputer_Y.out.logic.any_landing_gear_not_uplocked = rtb_AND11;
    SecComputer_Y.out.logic.lgciu_uplock_disagree_or_fault = rtb_OR1;
    SecComputer_Y.out.discrete_outputs.thr_reverse_selected = SecComputer_P.Constant1_Value_g;
    SecComputer_Y.out.discrete_outputs.left_elevator_ok = leftElevatorAvail;
    SecComputer_Y.out.discrete_outputs.right_elevator_ok = rightElevatorAvail;
    SecComputer_Y.out.discrete_outputs.ground_spoiler_out = SecComputer_DWork.Delay1_DSTATE_i;
    SecComputer_Y.out.discrete_outputs.sec_failed = SecComputer_P.Constant2_Value_n;
    SecComputer_Y.out.discrete_outputs.left_elevator_damping_mode = (rtb_isEngagedInPitch && leftElevatorAvail);
    SecComputer_Y.out.discrete_outputs.right_elevator_damping_mode = (rtb_isEngagedInPitch && rightElevatorAvail);
    rtb_y_a = (rtb_y_b5 && rtb_thsAvail);
    SecComputer_Y.out.discrete_outputs.ths_active = rtb_y_a;
    rtb_AND11 = (rtb_isEngagedInPitch || rtb_NOT_bl);
    if (rtb_AND11 && leftElevatorAvail) {
      SecComputer_Y.out.analog_outputs.left_elev_pos_order_deg = rtb_handleIndex;
    } else {
      SecComputer_Y.out.analog_outputs.left_elev_pos_order_deg = SecComputer_P.Constant_Value_h;
    }

    if (rtb_AND11 && rightElevatorAvail) {
      SecComputer_Y.out.analog_outputs.right_elev_pos_order_deg = rtb_handleIndex;
    } else {
      SecComputer_Y.out.analog_outputs.right_elev_pos_order_deg = SecComputer_P.Constant_Value_h;
    }

    if (rtb_y_a) {
      SecComputer_Y.out.analog_outputs.ths_pos_order_deg = SecComputer_DWork.Delay_DSTATE;
    } else {
      SecComputer_Y.out.analog_outputs.ths_pos_order_deg = SecComputer_P.Constant_Value_h;
    }

    if (spoilerPair1SupplyAvail) {
      SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg = rtb_Switch3;
      SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg = rtb_zeta_deg;
    } else {
      SecComputer_Y.out.analog_outputs.left_spoiler_1_pos_order_deg = SecComputer_P.Constant2_Value_f;
      SecComputer_Y.out.analog_outputs.right_spoiler_1_pos_order_deg = SecComputer_P.Constant2_Value_f;
    }

    if (spoiler_pair_2_avail) {
      SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg = pair1RollCommand;
      SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg = u0;
    } else {
      SecComputer_Y.out.analog_outputs.left_spoiler_2_pos_order_deg = SecComputer_P.Constant2_Value_f;
      SecComputer_Y.out.analog_outputs.right_spoiler_2_pos_order_deg = SecComputer_P.Constant2_Value_f;
    }

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
      SecComputer_Y.out.bus_outputs.left_spoiler_2_position_deg.Data = static_cast<real32_T>
        (SecComputer_P.Constant5_Value_m);
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

    SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = SecComputer_P.Gain_Gain_b *
      static_cast<real32_T>(SecComputer_U.in.analog_inputs.capt_pitch_stick_pos);
    SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = SecComputer_P.Gain1_Gain *
      static_cast<real32_T>(SecComputer_U.in.analog_inputs.fo_pitch_stick_pos);
    SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = SecComputer_P.Gain2_Gain * static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.capt_roll_stick_pos);
    SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = SecComputer_P.Gain3_Gain *
      static_cast<real32_T>(SecComputer_U.in.analog_inputs.fo_roll_stick_pos);
    SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.speed_brake_lever_command_deg.Data = SecComputer_P.Gain4_Gain * static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.spd_brk_lever_pos);
    SecComputer_Y.out.bus_outputs.speed_brake_command_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.speed_brake_command_deg.Data = static_cast<real32_T>(rtb_Switch5);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_1_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_1_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.thr_lever_1_pos);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_2_deg.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.thrust_lever_angle_2_deg.Data = static_cast<real32_T>
      (SecComputer_U.in.analog_inputs.thr_lever_2_pos);
    SecComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
      (SecComputer_P.EnumeratedConstant1_Value);
    SecComputer_DWork.Delay_DSTATE_c = rtb_OR3;
    SecComputer_DWork.Delay1_DSTATE = rtb_OR;
    SecComputer_DWork.icLoad = false;
    SecComputer_DWork.Delay_DSTATE_l = SecComputer_DWork.Delay_DSTATE;
  } else {
    SecComputer_DWork.Runtime_MODE = false;
  }
}

void SecComputer::initialize()
{
  SecComputer_DWork.Delay_DSTATE_c = SecComputer_P.Delay_InitialCondition_c;
  SecComputer_DWork.Delay1_DSTATE = SecComputer_P.Delay1_InitialCondition;
  SecComputer_DWork.Memory_PreviousInput = SecComputer_P.SRFlipFlop_initial_condition;
  SecComputer_DWork.Memory_PreviousInput_f = SecComputer_P.SRFlipFlop_initial_condition_c;
  SecComputer_DWork.Memory_PreviousInput_n = SecComputer_P.SRFlipFlop_initial_condition_k;
  SecComputer_DWork.Delay1_DSTATE_i = SecComputer_P.Delay1_InitialCondition_l;
  SecComputer_DWork.Delay_DSTATE_n = SecComputer_P.Delay_InitialCondition_j;
  SecComputer_DWork.Delay2_DSTATE = SecComputer_P.Delay2_InitialCondition;
  SecComputer_DWork.Delay_DSTATE = SecComputer_P.Delay_InitialCondition;
  SecComputer_DWork.icLoad = true;
  LawMDLOBJ2.init();
  SecComputer_Y.out = SecComputer_P.out_Y0;
}

void SecComputer::terminate()
{
}

SecComputer::SecComputer():
  SecComputer_U(),
  SecComputer_Y(),
  SecComputer_B(),
  SecComputer_DWork()
{
}

SecComputer::~SecComputer() = default;
