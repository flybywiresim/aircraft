#include "ElacComputer.h"
#include "ElacComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"
#include "LateralNormalLaw.h"
#include "LateralDirectLaw.h"
#include "PitchNormalLaw.h"
#include "PitchAlternateLaw.h"
#include "PitchDirectLaw.h"

const uint8_T ElacComputer_IN_Flight{ 1U };

const uint8_T ElacComputer_IN_FlightToGroundTransition{ 2U };

const uint8_T ElacComputer_IN_Ground{ 3U };

const uint8_T ElacComputer_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T ElacComputer_IN_Flying{ 1U };

const uint8_T ElacComputer_IN_Landed{ 2U };

const uint8_T ElacComputer_IN_Landing100ft{ 3U };

const uint8_T ElacComputer_IN_Takeoff100ft{ 4U };

const real_T ElacComputer_RGND{ 0.0 };

void ElacComputer::ElacComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void ElacComputer::ElacComputer_MATLABFunction_j(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void ElacComputer::ElacComputer_RateLimiter_Reset(rtDW_RateLimiter_ElacComputer_T *localDW)
{
  localDW->pY_not_empty = false;
}

void ElacComputer::ElacComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
  real_T *rty_Y, rtDW_RateLimiter_ElacComputer_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void ElacComputer::ElacComputer_RateLimiter_o_Reset(rtDW_RateLimiter_ElacComputer_g_T *localDW)
{
  localDW->pY_not_empty = false;
}

void ElacComputer::ElacComputer_RateLimiter_a(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T rtu_init,
  boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_ElacComputer_g_T *localDW)
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

void ElacComputer::ElacComputer_MATLABFunction_o(boolean_T rtu_bit1, boolean_T rtu_bit2, boolean_T rtu_bit3, boolean_T
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

void ElacComputer::ElacComputer_LagFilter_Reset(rtDW_LagFilter_ElacComputer_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void ElacComputer::ElacComputer_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_ElacComputer_T *localDW)
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

void ElacComputer::ElacComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void ElacComputer::ElacComputer_MATLABFunction_g5_Reset(rtDW_MATLABFunction_ElacComputer_kz_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void ElacComputer::ElacComputer_MATLABFunction_c(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_ElacComputer_kz_T *localDW)
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

void ElacComputer::ElacComputer_MATLABFunction_k_Reset(rtDW_MATLABFunction_ElacComputer_o_T *localDW)
{
  localDW->output = false;
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

void ElacComputer::ElacComputer_GetIASforMach4(real_T rtu_m, real_T rtu_m_t, real_T rtu_v, real_T *rty_v_t)
{
  *rty_v_t = rtu_v * rtu_m_t / rtu_m;
}

void ElacComputer::ElacComputer_RateLimiter_d_Reset(rtDW_RateLimiter_ElacComputer_b_T *localDW)
{
  localDW->pY_not_empty = false;
}

void ElacComputer::ElacComputer_RateLimiter_n(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, boolean_T
  rtu_reset, real_T *rty_Y, rtDW_RateLimiter_ElacComputer_b_T *localDW)
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

void ElacComputer::ElacComputer_MATLABFunction_h_Reset(rtDW_MATLABFunction_ElacComputer_b_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void ElacComputer::ElacComputer_MATLABFunction_g4(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_ElacComputer_b_T *localDW)
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
  real_T rtb_eta_deg;
  real_T rtb_eta_trim_dot_deg_s;
  real_T rtb_eta_trim_limit_lo;
  real_T rtb_eta_trim_limit_up;
  real_T rtb_eta_deg_o;
  real_T rtb_eta_trim_dot_deg_s_a;
  real_T rtb_eta_trim_limit_lo_h;
  real_T rtb_eta_trim_limit_up_d;
  const base_arinc_429 *rtb_Switch1_g_0;
  real_T abnormalCondition_tmp;
  real_T rtb_BusAssignment_f_logic_ir_computation_data_n_z_g;
  real_T rtb_BusAssignment_f_logic_ir_computation_data_theta_dot_deg_s;
  real_T rtb_BusAssignment_p_logic_high_speed_prot_hi_thresh_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_mach;
  real_T rtb_DataTypeConversion3_m;
  real_T rtb_DataTypeConversion5;
  real_T rtb_DataTypeConversion6;
  real_T rtb_DataTypeConversion6_g;
  real_T rtb_DataTypeConversion7;
  real_T rtb_DataTypeConversion8;
  real_T rtb_DataTypeConversion_au;
  real_T rtb_Switch3_p;
  real_T rtb_Y;
  real_T rtb_Y_b;
  real_T rtb_Y_f1;
  real_T rtb_Y_n_tmp_tmp;
  real_T rtb_Y_o;
  real_T rtb_eta_trim_limit_lo_d;
  real_T rtb_handleIndex;
  real_T rtb_handleIndex_c;
  real_T rtb_handleIndex_e;
  real_T rtb_zeta_deg_f;
  real_T u0;
  real_T u0_0;
  int32_T rtb_ap_special_disc;
  real32_T rtb_Switch_a_idx_0;
  real32_T rtb_Switch_a_idx_1;
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
  real32_T rtb_raComputationValue;
  real32_T rtb_theta_dot;
  uint32_T rtb_DataTypeConversion1_j;
  uint32_T rtb_Switch18;
  uint32_T rtb_y_aw;
  uint32_T rtb_y_e;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_a[19];
  boolean_T canEngageInPitch;
  boolean_T canEngageInRoll;
  boolean_T casValid;
  boolean_T casValid_tmp;
  boolean_T casValid_tmp_tmp;
  boolean_T hasPriorityInPitch;
  boolean_T hasPriorityInRoll;
  boolean_T leftAileronAvail;
  boolean_T rightAileronAvail;
  boolean_T rtb_AND1_h;
  boolean_T rtb_AND2;
  boolean_T rtb_AND2_e_tmp;
  boolean_T rtb_AND2_j;
  boolean_T rtb_AND3_b;
  boolean_T rtb_AND3_j;
  boolean_T rtb_AND4;
  boolean_T rtb_BusAssignment_n_logic_is_yellow_hydraulic_power_avail;
  boolean_T rtb_DataTypeConversion_e;
  boolean_T rtb_NOT_ac;
  boolean_T rtb_NOT_k;
  boolean_T rtb_NOT_kl;
  boolean_T rtb_OR;
  boolean_T rtb_OR1;
  boolean_T rtb_OR1_i;
  boolean_T rtb_OR1_me;
  boolean_T rtb_OR3;
  boolean_T rtb_OR4;
  boolean_T rtb_OR6;
  boolean_T rtb_OR7;
  boolean_T rtb_OR_e1;
  boolean_T rtb_OR_eo;
  boolean_T rtb_ap_authorised;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_doubleIrFault;
  boolean_T rtb_isEngagedInPitch;
  boolean_T rtb_isEngagedInRoll;
  boolean_T rtb_leftAileronCrossCommandActive;
  boolean_T rtb_ra1Invalid;
  boolean_T rtb_rightAileronCrossCommandActive;
  boolean_T rtb_thsAvail;
  boolean_T rtb_tripleAdrFault;
  boolean_T rtb_tripleIrFault;
  boolean_T rtb_y_f;
  boolean_T rtb_y_p;
  lateral_efcs_law priorityPitchLateralLawCap;
  lateral_efcs_law rtb_activeLateralLaw;
  lateral_efcs_law rtb_lateralLawCapability;
  lateral_efcs_law rtb_oppElacRollCapability;
  pitch_efcs_law priorityPitchPitchLawCap;
  pitch_efcs_law rtb_pitchLawCapability;
  if (ElacComputer_U.in.sim_data.computer_running) {
    if (!ElacComputer_DWork.Runtime_MODE) {
      ElacComputer_DWork.Delay_DSTATE_cc = ElacComputer_P.Delay_InitialCondition_c;
      ElacComputer_DWork.Delay1_DSTATE = ElacComputer_P.Delay1_InitialCondition;
      ElacComputer_DWork.Memory_PreviousInput = ElacComputer_P.SRFlipFlop_initial_condition;
      ElacComputer_DWork.Delay_DSTATE = ElacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
      ElacComputer_DWork.Delay_DSTATE_b = ElacComputer_P.Delay_InitialCondition;
      ElacComputer_DWork.icLoad = true;
      ElacComputer_LagFilter_Reset(&ElacComputer_DWork.sf_LagFilter_a);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_jz);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_lf);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_jl);
      ElacComputer_DWork.ra1CoherenceRejected = false;
      ElacComputer_DWork.ra2CoherenceRejected = false;
      ElacComputer_DWork.configFullEventTime_not_empty = false;
      ElacComputer_B.in_flight = 0.0;
      ElacComputer_DWork.on_ground_time = 0.0;
      ElacComputer_DWork.is_active_c30_ElacComputer = 0U;
      ElacComputer_DWork.is_c30_ElacComputer = ElacComputer_IN_NO_ACTIVE_CHILD;
      ElacComputer_MATLABFunction_k_Reset(&ElacComputer_DWork.sf_MATLABFunction_jg);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_cj);
      ElacComputer_MATLABFunction_k_Reset(&ElacComputer_DWork.sf_MATLABFunction_mi);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_g2);
      ElacComputer_MATLABFunction_k_Reset(&ElacComputer_DWork.sf_MATLABFunction_br);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_gfx);
      ElacComputer_MATLABFunction_h_Reset(&ElacComputer_DWork.sf_MATLABFunction_g4);
      ElacComputer_MATLABFunction_h_Reset(&ElacComputer_DWork.sf_MATLABFunction_nu);
      ElacComputer_DWork.pLeftStickDisabled = false;
      ElacComputer_DWork.pRightStickDisabled = false;
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_j2);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_g24);
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_nb);
      ElacComputer_DWork.abnormalConditionWasActive = false;
      ElacComputer_MATLABFunction_h_Reset(&ElacComputer_DWork.sf_MATLABFunction_l0);
      ElacComputer_RateLimiter_d_Reset(&ElacComputer_DWork.sf_RateLimiter_n);
      ElacComputer_DWork.eventTime_not_empty_i = false;
      ElacComputer_RateLimiter_d_Reset(&ElacComputer_DWork.sf_RateLimiter_m);
      ElacComputer_DWork.sProtActive = false;
      ElacComputer_DWork.resetEventTime_not_empty = false;
      ElacComputer_DWork.sProtActive_f = false;
      ElacComputer_DWork.is_active_c28_ElacComputer = 0U;
      ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_NO_ACTIVE_CHILD;
      ElacComputer_DWork.eventTime_not_empty = false;
      LawMDLOBJ2.reset();
      LawMDLOBJ1.reset();
      ElacComputer_RateLimiter_Reset(&ElacComputer_DWork.sf_RateLimiter);
      ElacComputer_RateLimiter_Reset(&ElacComputer_DWork.sf_RateLimiter_b);
      ElacComputer_RateLimiter_o_Reset(&ElacComputer_DWork.sf_RateLimiter_p);
      ElacComputer_RateLimiter_o_Reset(&ElacComputer_DWork.sf_RateLimiter_a);
      ElacComputer_LagFilter_Reset(&ElacComputer_DWork.sf_LagFilter);
      LawMDLOBJ5.reset();
      LawMDLOBJ3.reset();
      LawMDLOBJ4.reset();
      ElacComputer_MATLABFunction_g5_Reset(&ElacComputer_DWork.sf_MATLABFunction_fb);
      ElacComputer_DWork.Runtime_MODE = true;
    }

    rtb_OR1 = ((ElacComputer_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || ElacComputer_P.Constant1_Value_b || ElacComputer_P.Constant1_Value_b);
    rtb_OR3 = ((ElacComputer_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || ElacComputer_P.Constant1_Value_b || ElacComputer_P.Constant1_Value_b);
    rtb_OR4 = ((ElacComputer_U.in.bus_inputs.adr_3_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM ==
                static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
               (ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)) || ElacComputer_P.Constant1_Value_b || ElacComputer_P.Constant1_Value_b);
    rtb_AND2 = (rtb_OR1 && rtb_OR3);
    rtb_doubleAdrFault = (rtb_AND2 || (rtb_OR1 && rtb_OR4) || (rtb_OR3 && rtb_OR4));
    rtb_tripleAdrFault = (rtb_AND2 && rtb_OR4);
    rtb_OR = ((ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (ElacComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
               (SignStatusMatrix::NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
              (ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>(SignStatusMatrix::
                NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM !=
               static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) || ElacComputer_P.Constant_Value_ad);
    rtb_OR6 = ((ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM
                != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (ElacComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM
                != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || ElacComputer_P.Constant_Value_ad);
    rtb_OR7 = ((ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM
                != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (ElacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM
                != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
               (ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM != static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) || ElacComputer_P.Constant_Value_ad);
    rtb_tripleIrFault = (rtb_OR && rtb_OR6);
    rtb_isEngagedInRoll = (rtb_OR && rtb_OR7);
    rtb_doubleIrFault = (rtb_tripleIrFault || rtb_isEngagedInRoll || (rtb_OR6 && rtb_OR7));
    rtb_tripleIrFault = (rtb_tripleIrFault && rtb_OR7);
    rtb_NOT_ac = !rtb_OR4;
    casValid = !rtb_OR3;
    rtb_ra1Invalid = (rtb_OR1 && casValid);
    if (rtb_ra1Invalid && rtb_NOT_ac) {
      rtb_V_ias = (ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data +
                   ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
      rtb_V_tas = (ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data +
                   ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
      rtb_mach = (ElacComputer_U.in.bus_inputs.adr_2_bus.mach.Data + ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data) /
        2.0F;
      rtb_alpha = (ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data +
                   ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
    } else {
      rtb_OR1 = !rtb_OR1;
      rtb_OR3 = (rtb_OR1 && rtb_OR3);
      if (rtb_OR3 && rtb_NOT_ac) {
        rtb_V_ias = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                     ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
        rtb_V_tas = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                     ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
        rtb_mach = (ElacComputer_U.in.bus_inputs.adr_1_bus.mach.Data + ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data)
          / 2.0F;
        rtb_alpha = (ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                     ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
      } else {
        casValid = (rtb_OR1 && casValid);
        if ((casValid && rtb_NOT_ac) || (casValid && rtb_OR4)) {
          rtb_V_ias = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                       ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data) / 2.0F;
          rtb_V_tas = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                       ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data) / 2.0F;
          rtb_mach = (ElacComputer_U.in.bus_inputs.adr_1_bus.mach.Data +
                      ElacComputer_U.in.bus_inputs.adr_2_bus.mach.Data) / 2.0F;
          rtb_alpha = (ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                       ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data) / 2.0F;
        } else if (rtb_OR3 && rtb_OR4) {
          rtb_V_ias = ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data;
          rtb_V_tas = ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data;
          rtb_mach = ElacComputer_U.in.bus_inputs.adr_1_bus.mach.Data;
          rtb_alpha = ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data;
        } else if (rtb_ra1Invalid && rtb_OR4) {
          rtb_V_ias = ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data;
          rtb_V_tas = ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.Data;
          rtb_mach = ElacComputer_U.in.bus_inputs.adr_2_bus.mach.Data;
          rtb_alpha = ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data;
        } else if (rtb_AND2 && rtb_NOT_ac) {
          rtb_V_ias = ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
          rtb_V_tas = ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
          rtb_mach = ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
          rtb_alpha = ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
        } else {
          rtb_V_ias = 0.0F;
          rtb_V_tas = 0.0F;
          rtb_mach = 0.0F;
          rtb_alpha = 0.0F;
        }
      }
    }

    ElacComputer_LagFilter(static_cast<real_T>(rtb_alpha), ElacComputer_P.LagFilter_C1, ElacComputer_U.in.time.dt,
      &rtb_Y, &ElacComputer_DWork.sf_LagFilter_a);
    rtb_eta_trim_limit_lo_d = rtb_V_ias;
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn = rtb_V_tas;
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_mach = rtb_mach;
    rtb_NOT_ac = !rtb_OR6;
    casValid = !rtb_OR7;
    rtb_ra1Invalid = (rtb_OR && casValid);
    if (rtb_ra1Invalid && rtb_NOT_ac) {
      rtb_alpha = (ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data +
                   ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) / 2.0F;
      rtb_phi = (ElacComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data +
                 ElacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) / 2.0F;
      rtb_q = (ElacComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data +
               ElacComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) / 2.0F;
      rtb_r = (ElacComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data +
               ElacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) / 2.0F;
      rtb_n_x = (ElacComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data +
                 ElacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) / 2.0F;
      rtb_n_y = (ElacComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data +
                 ElacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) / 2.0F;
      rtb_n_z = (ElacComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data +
                 ElacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) / 2.0F;
      rtb_theta_dot = (ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data +
                       ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) / 2.0F;
      rtb_phi_dot = (ElacComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data +
                     ElacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) / 2.0F;
    } else {
      rtb_OR1 = !rtb_OR;
      rtb_OR3 = (rtb_OR1 && rtb_OR7);
      if (rtb_OR3 && rtb_NOT_ac) {
        rtb_alpha = (ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                     ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data) / 2.0F;
        rtb_phi = (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                   ElacComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data) / 2.0F;
        rtb_q = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
                 ElacComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data) / 2.0F;
        rtb_r = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
                 ElacComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data) / 2.0F;
        rtb_n_x = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                   ElacComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data) / 2.0F;
        rtb_n_y = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                   ElacComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data) / 2.0F;
        rtb_n_z = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                   ElacComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data) / 2.0F;
        rtb_theta_dot = (ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                         ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data) / 2.0F;
        rtb_phi_dot = (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                       ElacComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data) / 2.0F;
      } else {
        casValid = (rtb_OR1 && casValid);
        if ((casValid && rtb_NOT_ac) || (casValid && rtb_OR6)) {
          rtb_alpha = (ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data +
                       ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data) / 2.0F;
          rtb_phi = (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data +
                     ElacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data) / 2.0F;
          rtb_q = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data +
                   ElacComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data) / 2.0F;
          rtb_r = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data +
                   ElacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data) / 2.0F;
          rtb_n_x = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data +
                     ElacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data) / 2.0F;
          rtb_n_y = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data +
                     ElacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data) / 2.0F;
          rtb_n_z = (ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data +
                     ElacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data) / 2.0F;
          rtb_theta_dot = (ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data +
                           ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data) / 2.0F;
          rtb_phi_dot = (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data +
                         ElacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data) / 2.0F;
        } else if (rtb_OR3 && rtb_OR6) {
          rtb_alpha = ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
          rtb_phi = ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
          rtb_q = ElacComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
          rtb_r = ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = ElacComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
          rtb_n_y = ElacComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
          rtb_n_z = ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
          rtb_theta_dot = ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
        } else if (rtb_ra1Invalid && rtb_OR6) {
          rtb_alpha = ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
          rtb_phi = ElacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
          rtb_q = ElacComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
          rtb_r = ElacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = ElacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
          rtb_n_y = ElacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
          rtb_n_z = ElacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
          rtb_theta_dot = ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = ElacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
        } else if (rtb_isEngagedInRoll && rtb_NOT_ac) {
          rtb_alpha = ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.Data;
          rtb_phi = ElacComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.Data;
          rtb_q = ElacComputer_U.in.bus_inputs.ir_2_bus.body_pitch_rate_deg_s.Data;
          rtb_r = ElacComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.Data;
          rtb_n_x = ElacComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.Data;
          rtb_n_y = ElacComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.Data;
          rtb_n_z = ElacComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.Data;
          rtb_theta_dot = ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.Data;
          rtb_phi_dot = ElacComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.Data;
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
      }
    }

    rtb_Y_n_tmp_tmp = rtb_alpha;
    rtb_Y_f1 = rtb_alpha;
    rtb_DataTypeConversion5 = rtb_phi;
    rtb_Y_b = rtb_r;
    rtb_zeta_deg_f = rtb_phi_dot;
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel_bit, &rtb_y_aw);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_y_f);
    rtb_OR4 = ((rtb_y_aw != 0U) && rtb_y_f);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel1_bit, &rtb_y_aw);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_y_p);
    rtb_AND2 = ((rtb_y_aw != 0U) && rtb_y_p);
    ElacComputer_MATLABFunction_c((std::abs(ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data -
      ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) > ElacComputer_P.CompareToConstant_const_ll),
      ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge, ElacComputer_P.ConfirmNode_timeDelay,
      &rtb_NOT_k, &ElacComputer_DWork.sf_MATLABFunction_jz);
    casValid_tmp_tmp = (rtb_doubleAdrFault && ElacComputer_P.Constant1_Value_b);
    casValid_tmp = (rtb_tripleAdrFault || casValid_tmp_tmp);
    ElacComputer_MATLABFunction_c(((ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
      (ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && casValid_tmp), ElacComputer_U.in.time.dt,
      ElacComputer_P.ConfirmNode2_isRisingEdge, ElacComputer_P.ConfirmNode2_timeDelay, &rtb_y_p,
      &ElacComputer_DWork.sf_MATLABFunction_lf);
    ElacComputer_MATLABFunction_c(((ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
      (ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)) && (rtb_V_ias > 200.0F) && casValid_tmp), ElacComputer_U.in.time.dt,
      ElacComputer_P.ConfirmNode1_isRisingEdge, ElacComputer_P.ConfirmNode1_timeDelay, &rtb_y_f,
      &ElacComputer_DWork.sf_MATLABFunction_jl);
    ElacComputer_DWork.ra1CoherenceRejected = (rtb_y_p || ElacComputer_DWork.ra1CoherenceRejected);
    ElacComputer_DWork.ra2CoherenceRejected = (rtb_y_f || ElacComputer_DWork.ra2CoherenceRejected);
    rtb_ra1Invalid = ((ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>
                       (SignStatusMatrix::FailureWarning)) || ElacComputer_DWork.ra1CoherenceRejected);
    rtb_OR = ((ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
                FailureWarning)) || ElacComputer_DWork.ra2CoherenceRejected);
    if (!ElacComputer_DWork.configFullEventTime_not_empty) {
      ElacComputer_DWork.configFullEventTime = ElacComputer_U.in.time.simulation_time;
      ElacComputer_DWork.configFullEventTime_not_empty = true;
    }

    if ((!rtb_OR4) && (!rtb_AND2)) {
      ElacComputer_DWork.configFullEventTime = ElacComputer_U.in.time.simulation_time;
    }

    rtb_NOT_ac = !rtb_OR;
    casValid = !rtb_ra1Invalid;
    if (casValid && rtb_NOT_ac) {
      if (rtb_NOT_k) {
        if (ElacComputer_U.in.time.simulation_time > ElacComputer_DWork.configFullEventTime + 10.0) {
          rtb_raComputationValue = std::fmin(ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data,
            ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data);
        } else {
          rtb_raComputationValue = 250.0F;
        }
      } else {
        rtb_raComputationValue = (ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
          ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) / 2.0F;
      }
    } else if ((rtb_ra1Invalid && rtb_NOT_ac) || (casValid && rtb_OR)) {
      if ((rtb_V_ias > 180.0F) && casValid_tmp) {
        rtb_raComputationValue = 250.0F;
      } else if (rtb_OR) {
        rtb_raComputationValue = ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
      } else {
        rtb_raComputationValue = ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
      }
    } else {
      rtb_raComputationValue = 250.0F;
    }

    casValid = (rtb_ra1Invalid && rtb_OR);
    rtb_AND1_h = ((rtb_raComputationValue < ElacComputer_P.CompareToConstant_const) && (!casValid));
    rtb_OR4 = (ElacComputer_U.in.discrete_inputs.lgciu_1_left_main_gear_pressed &&
               ElacComputer_U.in.discrete_inputs.lgciu_1_right_main_gear_pressed);
    casValid_tmp = (ElacComputer_U.in.discrete_inputs.ground_spoilers_active_1 &&
                    ElacComputer_U.in.discrete_inputs.ground_spoilers_active_2);
    rtb_ra1Invalid = ((rtb_OR4 && ElacComputer_U.in.discrete_inputs.lgciu_2_left_main_gear_pressed &&
                       ElacComputer_U.in.discrete_inputs.lgciu_2_right_main_gear_pressed) || ((rtb_OR4 ||
      (ElacComputer_U.in.discrete_inputs.lgciu_2_left_main_gear_pressed &&
       ElacComputer_U.in.discrete_inputs.lgciu_2_right_main_gear_pressed)) && rtb_AND1_h) || (rtb_AND1_h && casValid_tmp));
    rtb_OR = (ElacComputer_U.in.sim_data.slew_on || ElacComputer_U.in.sim_data.pause_on ||
              ElacComputer_U.in.sim_data.tracking_mode_on_override);
    if (ElacComputer_DWork.is_active_c30_ElacComputer == 0) {
      ElacComputer_DWork.is_active_c30_ElacComputer = 1U;
      ElacComputer_DWork.is_c30_ElacComputer = ElacComputer_IN_Ground;
      ElacComputer_B.in_flight = 0.0;
    } else {
      switch (ElacComputer_DWork.is_c30_ElacComputer) {
       case ElacComputer_IN_Flight:
        if (rtb_ra1Invalid && (rtb_alpha < 2.5F)) {
          ElacComputer_DWork.on_ground_time = ElacComputer_U.in.time.simulation_time;
          ElacComputer_DWork.is_c30_ElacComputer = ElacComputer_IN_FlightToGroundTransition;
        } else {
          ElacComputer_B.in_flight = 1.0;
        }
        break;

       case ElacComputer_IN_FlightToGroundTransition:
        if (ElacComputer_U.in.time.simulation_time - ElacComputer_DWork.on_ground_time >= 5.0) {
          ElacComputer_DWork.is_c30_ElacComputer = ElacComputer_IN_Ground;
          ElacComputer_B.in_flight = 0.0;
        } else if ((!rtb_ra1Invalid) || (rtb_alpha >= 2.5F)) {
          ElacComputer_DWork.on_ground_time = 0.0;
          ElacComputer_DWork.is_c30_ElacComputer = ElacComputer_IN_Flight;
          ElacComputer_B.in_flight = 1.0;
        }
        break;

       default:
        if (((!rtb_ra1Invalid) && (rtb_alpha > 8.0F)) || (rtb_raComputationValue > 400.0F)) {
          ElacComputer_DWork.on_ground_time = 0.0;
          ElacComputer_DWork.is_c30_ElacComputer = ElacComputer_IN_Flight;
          ElacComputer_B.in_flight = 1.0;
        } else {
          ElacComputer_B.in_flight = 0.0;
        }
        break;
      }
    }

    ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.yellow_hyd_pressure_psi,
      ElacComputer_P.HysteresisNode2_highTrigger, ElacComputer_P.HysteresisNode2_lowTrigger, &rtb_y_p,
      &ElacComputer_DWork.sf_MATLABFunction_jg);
    ElacComputer_MATLABFunction_c(((!ElacComputer_U.in.discrete_inputs.yellow_low_pressure) && rtb_y_p),
      ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge_k, ElacComputer_P.ConfirmNode_timeDelay_n,
      &rtb_NOT_k, &ElacComputer_DWork.sf_MATLABFunction_cj);
    ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.blue_hyd_pressure_psi,
      ElacComputer_P.HysteresisNode1_highTrigger, ElacComputer_P.HysteresisNode1_lowTrigger, &rtb_y_p,
      &ElacComputer_DWork.sf_MATLABFunction_mi);
    ElacComputer_MATLABFunction_c(((!ElacComputer_U.in.discrete_inputs.blue_low_pressure) && rtb_y_p),
      ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode1_isRisingEdge_i, ElacComputer_P.ConfirmNode1_timeDelay_h,
      &rtb_y_f, &ElacComputer_DWork.sf_MATLABFunction_g2);
    ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.green_hyd_pressure_psi,
      ElacComputer_P.HysteresisNode3_highTrigger, ElacComputer_P.HysteresisNode3_lowTrigger, &rtb_y_p,
      &ElacComputer_DWork.sf_MATLABFunction_br);
    ElacComputer_MATLABFunction_c(((!ElacComputer_U.in.discrete_inputs.green_low_pressure) && rtb_y_p),
      ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode2_isRisingEdge_j, ElacComputer_P.ConfirmNode2_timeDelay_k,
      &rtb_y_p, &ElacComputer_DWork.sf_MATLABFunction_gfx);
    rtb_BusAssignment_f_logic_ir_computation_data_n_z_g = rtb_n_z;
    rtb_BusAssignment_f_logic_ir_computation_data_theta_dot_deg_s = rtb_theta_dot;
    rtb_handleIndex_e = rtb_raComputationValue;
    rtb_OR6 = rtb_y_f;
    rtb_OR7 = rtb_y_p;
    ElacComputer_MATLABFunction_g4(ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
      ElacComputer_P.PulseNode_isRisingEdge, &rtb_y_f, &ElacComputer_DWork.sf_MATLABFunction_g4);
    ElacComputer_MATLABFunction_g4(ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
      ElacComputer_P.PulseNode1_isRisingEdge, &rtb_y_p, &ElacComputer_DWork.sf_MATLABFunction_nu);
    if (rtb_y_f) {
      ElacComputer_DWork.pRightStickDisabled = true;
      ElacComputer_DWork.pLeftStickDisabled = false;
    } else if (rtb_y_p) {
      ElacComputer_DWork.pLeftStickDisabled = true;
      ElacComputer_DWork.pRightStickDisabled = false;
    }

    if (ElacComputer_DWork.pRightStickDisabled && ((!ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed) &&
         (!ElacComputer_DWork.Delay1_DSTATE))) {
      ElacComputer_DWork.pRightStickDisabled = false;
    } else if (ElacComputer_DWork.pLeftStickDisabled) {
      ElacComputer_DWork.pLeftStickDisabled = (ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed ||
        ElacComputer_DWork.Delay_DSTATE_cc);
    }

    ElacComputer_MATLABFunction_c((ElacComputer_DWork.pLeftStickDisabled &&
      (ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || ElacComputer_DWork.Delay_DSTATE_cc)),
      ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode1_isRisingEdge_k, ElacComputer_P.ConfirmNode1_timeDelay_a,
      &rtb_OR4, &ElacComputer_DWork.sf_MATLABFunction_j2);
    ElacComputer_MATLABFunction_c((ElacComputer_DWork.pRightStickDisabled &&
      (ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || ElacComputer_DWork.Delay1_DSTATE)),
      ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge_j, ElacComputer_P.ConfirmNode_timeDelay_a,
      &rtb_AND2, &ElacComputer_DWork.sf_MATLABFunction_g24);
    if (ElacComputer_DWork.pLeftStickDisabled) {
      rtb_handleIndex_c = ElacComputer_P.Constant1_Value_p;
    } else {
      rtb_handleIndex_c = ElacComputer_U.in.analog_inputs.capt_roll_stick_pos;
    }

    if (!ElacComputer_DWork.pRightStickDisabled) {
      rtb_DataTypeConversion7 = ElacComputer_U.in.analog_inputs.fo_roll_stick_pos;
    } else {
      rtb_DataTypeConversion7 = ElacComputer_P.Constant1_Value_p;
    }

    u0 = rtb_DataTypeConversion7 + rtb_handleIndex_c;
    if (u0 > ElacComputer_P.Saturation1_UpperSat) {
      u0 = ElacComputer_P.Saturation1_UpperSat;
    } else if (u0 < ElacComputer_P.Saturation1_LowerSat) {
      u0 = ElacComputer_P.Saturation1_LowerSat;
    }

    if (ElacComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_OR3 = ((!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_OR6);
      rtb_OR1 = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_OR6);
    } else {
      rtb_OR3 = ((!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_OR7);
      rtb_OR1 = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_NOT_k);
    }

    rtb_y_p = !ElacComputer_U.in.discrete_inputs.ths_motor_fault;
    rtb_thsAvail = (rtb_y_p && (rtb_NOT_k || rtb_OR7));
    if (ElacComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_NOT_ac = rtb_OR6;
    } else {
      rtb_NOT_ac = ((rtb_NOT_k && rtb_OR7) || ((!rtb_OR6) && (rtb_OR7 || rtb_NOT_k)));
    }

    canEngageInPitch = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) &&
                        (!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_y_p && rtb_NOT_ac);
    rtb_y_p = !ElacComputer_U.in.discrete_inputs.is_unit_1;
    hasPriorityInPitch = (rtb_y_p || ElacComputer_U.in.discrete_inputs.opp_axis_pitch_failure);
    rtb_isEngagedInPitch = (canEngageInPitch && hasPriorityInPitch);
    if (ElacComputer_U.in.discrete_inputs.is_unit_1) {
      leftAileronAvail = ((!ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) && rtb_OR6);
      rightAileronAvail = ((!ElacComputer_U.in.discrete_inputs.r_ail_servo_failed) && rtb_OR7);
    } else {
      leftAileronAvail = ((!ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) && rtb_OR7);
      rightAileronAvail = ((!ElacComputer_U.in.discrete_inputs.r_ail_servo_failed) && rtb_OR6);
    }

    canEngageInRoll = (leftAileronAvail || rightAileronAvail);
    hasPriorityInRoll = (ElacComputer_U.in.discrete_inputs.is_unit_1 ||
                         (ElacComputer_U.in.discrete_inputs.opp_left_aileron_lost &&
                          ElacComputer_U.in.discrete_inputs.opp_right_aileron_lost));
    rtb_NOT_ac = !hasPriorityInRoll;
    if (rtb_y_p && rtb_NOT_ac && (ElacComputer_U.in.bus_inputs.elac_opp_bus.aileron_command_deg.SSM ==
         static_cast<uint32_T>(SignStatusMatrix::NormalOperation))) {
      rtb_leftAileronCrossCommandActive = (ElacComputer_U.in.discrete_inputs.opp_left_aileron_lost && leftAileronAvail);
      rtb_rightAileronCrossCommandActive = (ElacComputer_U.in.discrete_inputs.opp_right_aileron_lost &&
        rightAileronAvail);
    } else {
      rtb_leftAileronCrossCommandActive = false;
      rtb_rightAileronCrossCommandActive = false;
    }

    rtb_isEngagedInRoll = (canEngageInRoll && hasPriorityInRoll);
    rtb_BusAssignment_n_logic_is_yellow_hydraulic_power_avail = rtb_NOT_k;
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_1,
      ElacComputer_P.BitfromLabel_bit_c, &rtb_y_aw);
    rtb_AND3_b = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_1,
      ElacComputer_P.BitfromLabel1_bit_j, &rtb_y_aw);
    rtb_AND1_h = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_2_bus.discrete_status_word_1,
      ElacComputer_P.BitfromLabel2_bit, &rtb_y_aw);
    rtb_AND4 = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_3,
      ElacComputer_P.BitfromLabel3_bit, &rtb_y_aw);
    rtb_NOT_kl = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_3,
      ElacComputer_P.BitfromLabel5_bit, &rtb_y_aw);
    rtb_OR_e1 = (rtb_NOT_kl || (rtb_y_aw != 0U));
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_3,
      ElacComputer_P.BitfromLabel4_bit, &rtb_y_aw);
    rtb_NOT_k = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_3,
      ElacComputer_P.BitfromLabel6_bit, &rtb_y_aw);
    rtb_OR1_me = (rtb_NOT_k || (rtb_y_aw != 0U));
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.fcdc_1_bus.efcs_status_word_1,
      ElacComputer_P.BitfromLabel7_bit, &rtb_y_aw);
    rtb_y_p = (rtb_y_aw == 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.fcdc_2_bus.efcs_status_word_1,
      ElacComputer_P.BitfromLabel8_bit, &rtb_y_aw);
    if ((ElacComputer_U.in.discrete_inputs.fac_1_yaw_control_lost &&
         ElacComputer_U.in.discrete_inputs.fac_2_yaw_control_lost) ||
        ((ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_1.SSM != static_cast<uint32_T>(SignStatusMatrix::
           NormalOperation)) && (ElacComputer_U.in.bus_inputs.sec_2_bus.discrete_status_word_1.SSM !=
          static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) && ((!rtb_y_p) && (rtb_y_aw != 0U))) ||
        ((!rtb_AND3_b) && (!rtb_AND1_h) && (!rtb_AND4) && (!rtb_OR_e1) && (!rtb_OR1_me))) {
      rtb_lateralLawCapability = lateral_efcs_law::DirectLaw;
    } else {
      rtb_lateralLawCapability = lateral_efcs_law::NormalLaw;
    }

    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_2, &rtb_y_f);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sec_2_bus.discrete_status_word_2, &rtb_y_p);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel4_bit_d, &rtb_y_aw);
    rtb_NOT_k = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_2_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel5_bit_e, &rtb_y_aw);
    rtb_OR1_i = (((!rtb_y_f) && (!rtb_y_p)) || (rtb_NOT_k && (rtb_y_aw != 0U)));
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel6_bit_k, &rtb_y_aw);
    rtb_NOT_k = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_2_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel7_bit_h, &rtb_y_aw);
    rtb_OR_eo = (rtb_NOT_k || (rtb_y_aw != 0U));
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel_bit_a, &rtb_y_aw);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_y_f);
    rtb_AND2_j = ((rtb_y_aw != 0U) && rtb_y_f);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel1_bit_jr, &rtb_y_aw);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_y_p);
    rtb_AND3_j = ((rtb_y_aw != 0U) && rtb_y_p);
    ElacComputer_MATLABFunction_c(ElacComputer_U.in.sim_data.slew_on, ElacComputer_U.in.time.dt,
      ElacComputer_P.ConfirmNode_isRisingEdge_o, ElacComputer_P.ConfirmNode_timeDelay_d, &rtb_y_p,
      &ElacComputer_DWork.sf_MATLABFunction_nb);
    abnormalCondition_tmp = std::abs(static_cast<real_T>(rtb_phi));
    rtb_ap_authorised = !rtb_ra1Invalid;
    rtb_y_f = !ElacComputer_P.Constant_Value_ad;
    rtb_OR1_me = ((!rtb_y_p) && rtb_ap_authorised && (((!rtb_tripleAdrFault) && ((rtb_mach > 0.91) || (rtb_Y < -10.0) ||
      (rtb_Y > 40.0) || (rtb_V_ias > 440.0F) || (rtb_V_ias < 60.0F))) || ((!rtb_tripleIrFault) && ((!rtb_doubleIrFault) ||
      rtb_y_f) && ((abnormalCondition_tmp > 125.0) || ((rtb_alpha > 50.0F) || (rtb_alpha < -30.0F))))));
    ElacComputer_DWork.abnormalConditionWasActive = (rtb_OR1_me || (rtb_ap_authorised &&
      ElacComputer_DWork.abnormalConditionWasActive));
    rtb_NOT_k = ((!rtb_OR3) || (!rtb_OR1));
    rtb_AND4 = !leftAileronAvail;
    rtb_OR_e1 = !rightAileronAvail;
    rtb_y_p = (casValid_tmp_tmp || rtb_tripleAdrFault || ElacComputer_DWork.abnormalConditionWasActive || (rtb_AND4 &&
                rtb_OR_e1 && rtb_NOT_k));
    rtb_AND1_h = !ElacComputer_P.Constant1_Value_b;
    rtb_NOT_k = ((rtb_doubleIrFault && rtb_y_f) || (casValid_tmp_tmp && rtb_AND1_h) || (rtb_doubleAdrFault && rtb_AND1_h
      && rtb_AND1_h) || rtb_NOT_k);
    if (rtb_tripleIrFault || ((rtb_y_p || rtb_NOT_k || casValid || (rtb_lateralLawCapability == lateral_efcs_law::
           DirectLaw)) && ((ElacComputer_B.in_flight != 0.0) && ((rtb_OR_eo && (!rtb_OR1_i)) || ((rtb_AND2_j ||
             rtb_AND3_j) && rtb_OR1_i))))) {
      rtb_pitchLawCapability = pitch_efcs_law::DirectLaw;
    } else if (rtb_y_p) {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw2;
    } else if (rtb_NOT_k) {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw1;
    } else {
      rtb_pitchLawCapability = pitch_efcs_law::NormalLaw;
    }

    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel_bit_h, &rtb_y_e);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel1_bit_e, &rtb_Switch18);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel2_bit_k, &rtb_DataTypeConversion1_j);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
      ElacComputer_P.BitfromLabel3_bit_m, &rtb_y_aw);
    if ((rtb_DataTypeConversion1_j != 0U) && (rtb_y_aw == 0U)) {
      rtb_oppElacRollCapability = lateral_efcs_law::NormalLaw;
    } else if ((rtb_DataTypeConversion1_j == 0U) && (rtb_y_aw != 0U)) {
      rtb_oppElacRollCapability = lateral_efcs_law::DirectLaw;
    } else {
      rtb_oppElacRollCapability = lateral_efcs_law::None;
    }

    if (hasPriorityInPitch && rtb_isEngagedInPitch) {
      priorityPitchPitchLawCap = rtb_pitchLawCapability;
      priorityPitchLateralLawCap = rtb_lateralLawCapability;
    } else if ((!hasPriorityInPitch) || (!rtb_isEngagedInPitch)) {
      if ((rtb_y_e != 0U) && (rtb_Switch18 == 0U)) {
        priorityPitchPitchLawCap = pitch_efcs_law::NormalLaw;
      } else if ((rtb_y_e == 0U) && (rtb_Switch18 != 0U)) {
        priorityPitchPitchLawCap = pitch_efcs_law::AlternateLaw1;
      } else if ((rtb_y_e != 0U) && (rtb_Switch18 != 0U)) {
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
    } else if ((!rtb_NOT_ac) && rtb_isEngagedInRoll) {
      rtb_oppElacRollCapability = lateral_efcs_law::None;
    }

    if (rtb_isEngagedInRoll) {
      if ((rtb_oppElacRollCapability == lateral_efcs_law::NormalLaw) && (priorityPitchPitchLawCap == pitch_efcs_law::
           NormalLaw) && (priorityPitchLateralLawCap == lateral_efcs_law::NormalLaw)) {
        rtb_activeLateralLaw = lateral_efcs_law::NormalLaw;
      } else {
        rtb_activeLateralLaw = lateral_efcs_law::DirectLaw;
      }
    } else {
      rtb_activeLateralLaw = lateral_efcs_law::None;
    }

    if (rtb_isEngagedInPitch) {
      if ((rtb_oppElacRollCapability == lateral_efcs_law::NormalLaw) && (priorityPitchPitchLawCap == pitch_efcs_law::
           NormalLaw) && (priorityPitchLateralLawCap == lateral_efcs_law::NormalLaw)) {
        priorityPitchPitchLawCap = pitch_efcs_law::NormalLaw;
      } else if ((rtb_oppElacRollCapability != lateral_efcs_law::NormalLaw) && (priorityPitchPitchLawCap ==
                  pitch_efcs_law::NormalLaw)) {
        priorityPitchPitchLawCap = pitch_efcs_law::AlternateLaw1;
      } else if (priorityPitchPitchLawCap != pitch_efcs_law::NormalLaw) {
        priorityPitchPitchLawCap = rtb_pitchLawCapability;
      } else {
        priorityPitchPitchLawCap = pitch_efcs_law::DirectLaw;
      }
    } else {
      priorityPitchPitchLawCap = pitch_efcs_law::None;
    }

    if (!ElacComputer_DWork.pRightStickDisabled) {
      rtb_DataTypeConversion7 = ElacComputer_U.in.analog_inputs.fo_pitch_stick_pos;
    } else {
      rtb_DataTypeConversion7 = ElacComputer_P.Constant_Value_p;
    }

    if (ElacComputer_DWork.pLeftStickDisabled) {
      rtb_Switch3_p = ElacComputer_P.Constant_Value_p;
    } else {
      rtb_Switch3_p = ElacComputer_U.in.analog_inputs.capt_pitch_stick_pos;
    }

    u0_0 = rtb_DataTypeConversion7 + rtb_Switch3_p;
    if (u0_0 > ElacComputer_P.Saturation_UpperSat_d) {
      u0_0 = ElacComputer_P.Saturation_UpperSat_d;
    } else if (u0_0 < ElacComputer_P.Saturation_LowerSat_h) {
      u0_0 = ElacComputer_P.Saturation_LowerSat_h;
    }

    ElacComputer_MATLABFunction_g4((ElacComputer_B.in_flight != 0.0), ElacComputer_P.PulseNode_isRisingEdge_g, &rtb_y_p,
      &ElacComputer_DWork.sf_MATLABFunction_l0);
    rtb_OR1_i = ((ElacComputer_U.in.discrete_inputs.is_unit_1 && rtb_thsAvail && canEngageInPitch) ||
                 (ElacComputer_U.in.discrete_inputs.is_unit_2 && rtb_thsAvail && canEngageInPitch &&
                  ElacComputer_U.in.discrete_inputs.opp_axis_pitch_failure));
    rtb_Y_o = std::abs(ElacComputer_U.in.analog_inputs.ths_pos_deg);
    ElacComputer_DWork.Memory_PreviousInput = ElacComputer_P.Logic_table[((((!rtb_OR1_i) || (rtb_Y_o <=
      ElacComputer_P.CompareToConstant_const_m) || ElacComputer_U.in.discrete_inputs.ths_override_active) + (
      static_cast<uint32_T>(rtb_y_p) << 1)) << 1) + ElacComputer_DWork.Memory_PreviousInput];
    rtb_NOT_k = (rtb_OR1_i && ElacComputer_DWork.Memory_PreviousInput);
    rtb_AND3_b = !rtb_OR1_me;
    rtb_y_p = ((rtb_isEngagedInPitch && (ElacComputer_B.in_flight != 0.0) && ((priorityPitchPitchLawCap !=
      ElacComputer_P.EnumeratedConstant_Value_i) && rtb_AND3_b)) || rtb_NOT_k);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel_bit_h2, &rtb_y_aw);
    rtb_OR1_i = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel1_bit_g, &rtb_y_aw);
    rtb_OR_eo = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel2_bit_n, &rtb_y_aw);
    rtb_AND2_j = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel3_bit_g, &rtb_y_aw);
    rtb_AND3_j = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel4_bit_e, &rtb_y_aw);
    rtb_DataTypeConversion_e = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel5_bit_a, &rtb_y_aw);
    ElacComputer_MATLABFunction_o(rtb_OR1_i, rtb_OR_eo, rtb_AND2_j, rtb_AND3_j, rtb_DataTypeConversion_e, (rtb_y_aw !=
      0U), &rtb_handleIndex);
    ElacComputer_RateLimiter_n(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_handleIndex,
      ElacComputer_P.alphamax_bp01Data, ElacComputer_P.alphamax_bp02Data, ElacComputer_P.alphamax_tableData,
      ElacComputer_P.alphamax_maxIndex, 4U), ElacComputer_P.RateLimiterGenericVariableTs_up,
      ElacComputer_P.RateLimiterGenericVariableTs_lo, ElacComputer_U.in.time.dt, ElacComputer_P.reset_Value,
      &rtb_Switch3_p, &ElacComputer_DWork.sf_RateLimiter_n);
    if (!ElacComputer_DWork.eventTime_not_empty_i) {
      ElacComputer_DWork.eventTime_p = ElacComputer_U.in.time.simulation_time;
      ElacComputer_DWork.eventTime_not_empty_i = true;
    }

    if (rtb_ra1Invalid || (ElacComputer_DWork.eventTime_p == 0.0)) {
      ElacComputer_DWork.eventTime_p = ElacComputer_U.in.time.simulation_time;
    }

    ElacComputer_RateLimiter_n(look2_binlxpw(static_cast<real_T>(rtb_mach), rtb_handleIndex,
      ElacComputer_P.alphaprotection_bp01Data, ElacComputer_P.alphaprotection_bp02Data,
      ElacComputer_P.alphaprotection_tableData, ElacComputer_P.alphaprotection_maxIndex, 4U),
      ElacComputer_P.RateLimiterGenericVariableTs1_up, ElacComputer_P.RateLimiterGenericVariableTs1_lo,
      ElacComputer_U.in.time.dt, ElacComputer_P.reset_Value_j, &rtb_Y_o, &ElacComputer_DWork.sf_RateLimiter_m);
    if (ElacComputer_U.in.time.simulation_time - ElacComputer_DWork.eventTime_p <=
        ElacComputer_P.CompareToConstant_const_l) {
      rtb_handleIndex = rtb_Switch3_p;
    } else {
      rtb_handleIndex = rtb_Y_o;
    }

    ElacComputer_GetIASforMach4(static_cast<real_T>(rtb_mach), ElacComputer_P.Constant6_Value_b, static_cast<real_T>
      (rtb_V_ias), &rtb_DataTypeConversion3_m);
    rtb_DataTypeConversion3_m = std::fmin(ElacComputer_P.Constant5_Value_k, rtb_DataTypeConversion3_m);
    ElacComputer_GetIASforMach4(static_cast<real_T>(rtb_mach), ElacComputer_P.Constant8_Value_h, static_cast<real_T>
      (rtb_V_ias), &rtb_handleIndex_c);
    rtb_BusAssignment_p_logic_high_speed_prot_hi_thresh_kn = std::fmin(ElacComputer_P.Constant7_Value_g,
      rtb_handleIndex_c);
    rtb_OR1_i = rtb_NOT_k;
    rtb_Y_o = rtb_alpha - std::cos(ElacComputer_P.Gain1_Gain * rtb_phi) * rtb_Y;
    rtb_OR_eo = ((priorityPitchPitchLawCap == pitch_efcs_law::NormalLaw) || (rtb_activeLateralLaw == lateral_efcs_law::
      NormalLaw));
    if (ElacComputer_U.in.discrete_inputs.ap_1_disengaged && ElacComputer_U.in.discrete_inputs.ap_2_disengaged &&
        (rtb_V_ias > std::fmin(look1_binlxpw(rtb_Y_o, ElacComputer_P.uDLookupTable1_bp01Data,
           ElacComputer_P.uDLookupTable1_tableData, 3U), static_cast<real_T>(rtb_V_ias) / rtb_mach * look1_binlxpw
          (rtb_Y_o, ElacComputer_P.uDLookupTable2_bp01Data, ElacComputer_P.uDLookupTable2_tableData, 3U)))) {
      ElacComputer_DWork.sProtActive = (rtb_OR_eo || ElacComputer_DWork.sProtActive);
    }

    rtb_AND1_h = (ElacComputer_U.in.discrete_inputs.ap_1_disengaged && ElacComputer_U.in.discrete_inputs.ap_2_disengaged);
    ElacComputer_DWork.sProtActive = ((rtb_V_ias >= rtb_DataTypeConversion3_m) && (rtb_AND1_h && rtb_OR_eo &&
      ElacComputer_DWork.sProtActive));
    if (!ElacComputer_DWork.resetEventTime_not_empty) {
      ElacComputer_DWork.resetEventTime = ElacComputer_U.in.time.simulation_time;
      ElacComputer_DWork.resetEventTime_not_empty = true;
    }

    if ((u0_0 >= -0.03125) || (rtb_Y >= rtb_Switch3_p) || (ElacComputer_DWork.resetEventTime == 0.0)) {
      ElacComputer_DWork.resetEventTime = ElacComputer_U.in.time.simulation_time;
    }

    ElacComputer_DWork.sProtActive_f = ((rtb_ap_authorised && rtb_OR_eo && rtb_AND1_h && (rtb_Y > rtb_handleIndex) &&
      (ElacComputer_U.in.time.monotonic_time > 10.0)) || ElacComputer_DWork.sProtActive_f);
    ElacComputer_DWork.sProtActive_f = ((ElacComputer_U.in.time.simulation_time - ElacComputer_DWork.resetEventTime <=
      0.5) && (u0_0 >= -0.5) && ((rtb_raComputationValue >= 200.0F) || (u0_0 >= 0.5) || (rtb_Y >= rtb_handleIndex - 2.0))
      && rtb_ap_authorised && rtb_OR_eo && ElacComputer_DWork.sProtActive_f);
    if (ElacComputer_DWork.is_active_c28_ElacComputer == 0) {
      ElacComputer_DWork.is_active_c28_ElacComputer = 1U;
      ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Landed;
      rtb_ap_special_disc = 0;
    } else {
      switch (ElacComputer_DWork.is_c28_ElacComputer) {
       case ElacComputer_IN_Flying:
        if (rtb_raComputationValue < 100.0F) {
          ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Landing100ft;
          rtb_ap_special_disc = 1;
        } else if (rtb_ra1Invalid) {
          ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Landed;
          rtb_ap_special_disc = 0;
        } else {
          rtb_ap_special_disc = 0;
        }
        break;

       case ElacComputer_IN_Landed:
        if (rtb_ap_authorised) {
          ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Takeoff100ft;
          rtb_ap_special_disc = 0;
        } else {
          rtb_ap_special_disc = 0;
        }
        break;

       case ElacComputer_IN_Landing100ft:
        if (rtb_raComputationValue > 100.0F) {
          ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Flying;
          rtb_ap_special_disc = 0;
        } else if (rtb_ra1Invalid) {
          ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Landed;
          rtb_ap_special_disc = 0;
        } else {
          rtb_ap_special_disc = 1;
        }
        break;

       default:
        if (rtb_ra1Invalid) {
          ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Landed;
          rtb_ap_special_disc = 0;
        } else if (rtb_raComputationValue > 100.0F) {
          ElacComputer_DWork.is_c28_ElacComputer = ElacComputer_IN_Flying;
          rtb_ap_special_disc = 0;
        } else {
          rtb_ap_special_disc = 0;
        }
        break;
      }
    }

    if (!ElacComputer_DWork.eventTime_not_empty) {
      ElacComputer_DWork.eventTime = ElacComputer_U.in.time.simulation_time;
      ElacComputer_DWork.eventTime_not_empty = true;
    }

    if ((rtb_V_ias <= std::fmin(365.0, static_cast<real_T>(rtb_V_ias) / rtb_mach * (look1_binlxpw(rtb_Y_o,
            ElacComputer_P.uDLookupTable_bp01Data, ElacComputer_P.uDLookupTable_tableData, 3U) + 0.01))) ||
        ((priorityPitchPitchLawCap != pitch_efcs_law::NormalLaw) && (rtb_activeLateralLaw != lateral_efcs_law::NormalLaw))
        || (ElacComputer_DWork.eventTime == 0.0)) {
      ElacComputer_DWork.eventTime = ElacComputer_U.in.time.simulation_time;
    }

    rtb_NOT_k = ((rtb_ap_authorised && (((rtb_ap_special_disc != 0) && (rtb_Y > rtb_Switch3_p)) || (rtb_Y >
      rtb_handleIndex + 0.25)) && rtb_OR_eo) || (ElacComputer_U.in.time.simulation_time - ElacComputer_DWork.eventTime >
      3.0) || ElacComputer_DWork.sProtActive || ElacComputer_DWork.sProtActive_f);
    ElacComputer_Y.out.logic.protection_ap_disconnect = rtb_NOT_k;
    rtb_ap_authorised = ((std::abs(u0_0) <= 0.5) && (std::abs(u0) <= 0.5) && ((std::abs
      (ElacComputer_U.in.analog_inputs.rudder_pedal_pos) <= 0.4) && ((rtb_alpha <= 25.0F) && (rtb_alpha >= -13.0F) &&
      (abnormalCondition_tmp <= 45.0) && ((!hasPriorityInPitch) || canEngageInPitch) && (rtb_NOT_ac || canEngageInRoll) &&
      (!rtb_NOT_k))));
    ElacComputer_MATLABFunction_g(&ElacComputer_U.in.bus_inputs.fmgc_1_bus.delta_p_ail_cmd_deg, &rtb_NOT_kl);
    ElacComputer_MATLABFunction_g(&ElacComputer_U.in.bus_inputs.fmgc_1_bus.delta_q_cmd_deg, &rtb_y_f);
    casValid_tmp_tmp = !ElacComputer_U.in.discrete_inputs.ap_1_disengaged;
    rtb_OR_eo = (casValid_tmp_tmp && rtb_NOT_kl && rtb_y_f);
    ElacComputer_MATLABFunction_g(&ElacComputer_U.in.bus_inputs.fmgc_2_bus.delta_p_ail_cmd_deg, &rtb_AND3_b);
    ElacComputer_MATLABFunction_g(&ElacComputer_U.in.bus_inputs.fmgc_2_bus.delta_q_cmd_deg, &rtb_y_f);
    rtb_AND2_e_tmp = !ElacComputer_U.in.discrete_inputs.ap_2_disengaged;
    rtb_AND2_j = (rtb_AND2_e_tmp && rtb_AND3_b && rtb_y_f);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel_bit_e, &rtb_y_aw);
    rtb_NOT_ac = (rtb_y_aw == 0U);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_NOT_kl);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel1_bit_d, &rtb_y_aw);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_y_f);
    rtb_NOT_ac = ((rtb_NOT_ac && rtb_NOT_kl) || ((rtb_y_aw == 0U) && rtb_y_f));
    rtb_AND3_j = (rtb_NOT_ac && ((leftAileronAvail && rightAileronAvail) ||
      ((!ElacComputer_U.in.discrete_inputs.opp_left_aileron_lost) && rightAileronAvail) || (leftAileronAvail &&
      (!ElacComputer_U.in.discrete_inputs.opp_right_aileron_lost))));
    rtb_DataTypeConversion_e = (casValid_tmp && rtb_NOT_ac && (rtb_alpha < 2.5F) && rtb_AND1_h && (rtb_activeLateralLaw ==
      lateral_efcs_law::NormalLaw));
    abnormalCondition_tmp = rtb_DataTypeConversion3_m;
    if (rtb_OR_eo) {
      rtb_Switch_a_idx_0 = ElacComputer_U.in.bus_inputs.fmgc_1_bus.delta_p_ail_cmd_deg.Data;
      rtb_Switch_a_idx_1 = ElacComputer_U.in.bus_inputs.fmgc_1_bus.delta_r_cmd_deg.Data;
    } else {
      rtb_Switch_a_idx_0 = ElacComputer_U.in.bus_inputs.fmgc_2_bus.delta_p_ail_cmd_deg.Data;
      rtb_Switch_a_idx_1 = ElacComputer_U.in.bus_inputs.fmgc_2_bus.delta_r_cmd_deg.Data;
    }

    rtb_DataTypeConversion6 = rtb_Switch_a_idx_0;
    rtb_NOT_ac = (rtb_OR || (static_cast<real_T>(rtb_activeLateralLaw) != ElacComputer_P.CompareToConstant_const_m4));
    rtb_DataTypeConversion7 = rtb_Switch_a_idx_1;
    rtb_NOT_k = (rtb_OR_eo || rtb_AND2_j);
    LawMDLOBJ2.step(&ElacComputer_U.in.time.dt, &rtb_Y_n_tmp_tmp, &rtb_DataTypeConversion5, &rtb_Y_b, &rtb_zeta_deg_f,
                    &rtb_eta_trim_limit_lo_d,
                    &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn, &rtb_handleIndex_e,
                    &u0, &ElacComputer_U.in.analog_inputs.rudder_pedal_pos, &rtb_ra1Invalid, &rtb_NOT_ac,
                    &ElacComputer_DWork.sProtActive_f, &ElacComputer_DWork.sProtActive, &rtb_DataTypeConversion6,
                    &rtb_DataTypeConversion7, &rtb_NOT_k, &rtb_xi_deg, &rtb_zeta_deg);
    LawMDLOBJ1.step(&ElacComputer_U.in.time.dt, &u0, &rtb_DataTypeConversion6, &rtb_zeta_deg_f);
    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_DataTypeConversion6 = rtb_xi_deg;
      break;

     case 1:
      break;

     default:
      rtb_DataTypeConversion6 = ElacComputer_P.Constant_Value_c;
      break;
    }

    if (rtb_AND3_j) {
      rtb_DataTypeConversion7 = ElacComputer_P.Constant2_Value;
    } else {
      rtb_DataTypeConversion7 = ElacComputer_P.Constant1_Value;
    }

    ElacComputer_RateLimiter(rtb_DataTypeConversion7, ElacComputer_P.RateLimiterVariableTs2_up,
      ElacComputer_P.RateLimiterVariableTs2_lo, ElacComputer_U.in.time.dt,
      ElacComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_Y_f1, &ElacComputer_DWork.sf_RateLimiter);
    if (rtb_DataTypeConversion_e) {
      rtb_DataTypeConversion7 = ElacComputer_P.Constant4_Value_a;
    } else {
      rtb_DataTypeConversion7 = ElacComputer_P.Constant3_Value;
    }

    ElacComputer_RateLimiter(rtb_DataTypeConversion7, ElacComputer_P.RateLimiterVariableTs3_up,
      ElacComputer_P.RateLimiterVariableTs3_lo, ElacComputer_U.in.time.dt,
      ElacComputer_P.RateLimiterVariableTs3_InitialCondition, &rtb_Y_b, &ElacComputer_DWork.sf_RateLimiter_b);
    rtb_Y_b += rtb_Y_f1;
    if (rtb_leftAileronCrossCommandActive) {
      rtb_Y_o = ElacComputer_U.in.bus_inputs.elac_opp_bus.aileron_command_deg.Data;
    } else {
      rtb_Y_o = ElacComputer_P.Gain_Gain * rtb_DataTypeConversion6 + rtb_Y_b;
    }

    if (rtb_Y_o > ElacComputer_P.Saturation1_UpperSat_g) {
      rtb_Y_o = ElacComputer_P.Saturation1_UpperSat_g;
    } else if (rtb_Y_o < ElacComputer_P.Saturation1_LowerSat_n) {
      rtb_Y_o = ElacComputer_P.Saturation1_LowerSat_n;
    }

    rtb_NOT_ac = !rtb_isEngagedInRoll;
    ElacComputer_RateLimiter_a(rtb_Y_o, ElacComputer_P.RateLimiterGenericVariableTs1_up_g,
      ElacComputer_P.RateLimiterGenericVariableTs1_lo_c, ElacComputer_U.in.time.dt,
      ElacComputer_U.in.analog_inputs.left_aileron_pos_deg, ((!rtb_leftAileronCrossCommandActive) && rtb_NOT_ac),
      &rtb_DataTypeConversion3_m, &ElacComputer_DWork.sf_RateLimiter_p);
    if (rtb_rightAileronCrossCommandActive) {
      rtb_Y_o = ElacComputer_U.in.bus_inputs.elac_opp_bus.aileron_command_deg.Data;
    } else {
      rtb_Y_o = rtb_DataTypeConversion6 + rtb_Y_b;
    }

    if (rtb_Y_o > ElacComputer_P.Saturation2_UpperSat) {
      rtb_Y_o = ElacComputer_P.Saturation2_UpperSat;
    } else if (rtb_Y_o < ElacComputer_P.Saturation2_LowerSat) {
      rtb_Y_o = ElacComputer_P.Saturation2_LowerSat;
    }

    ElacComputer_RateLimiter_a(rtb_Y_o, ElacComputer_P.RateLimiterGenericVariableTs_up_b,
      ElacComputer_P.RateLimiterGenericVariableTs_lo_k, ElacComputer_U.in.time.dt,
      ElacComputer_U.in.analog_inputs.right_aileron_pos_deg, ((!rtb_rightAileronCrossCommandActive) && rtb_NOT_ac),
      &rtb_handleIndex_c, &ElacComputer_DWork.sf_RateLimiter_a);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel_bit_a2, &rtb_y_e);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_actual_position_word, &rtb_NOT_kl);
    rtb_NOT_ac = ((rtb_y_e != 0U) && rtb_NOT_kl);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word,
      ElacComputer_P.BitfromLabel1_bit_p, &rtb_y_e);
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.sfcc_2_bus.slat_flap_actual_position_word, &rtb_y_f);
    if (rtb_NOT_ac || ((rtb_y_e != 0U) && rtb_y_f)) {
      rtb_Y_o = rtb_DataTypeConversion6;
    } else {
      rtb_Y_b = std::abs(rtb_DataTypeConversion6) + ElacComputer_P.Bias_Bias;
      if (rtb_Y_b > ElacComputer_P.Saturation_UpperSat) {
        rtb_Y_b = ElacComputer_P.Saturation_UpperSat;
      } else if (rtb_Y_b < ElacComputer_P.Saturation_LowerSat) {
        rtb_Y_b = ElacComputer_P.Saturation_LowerSat;
      }

      if (rtb_DataTypeConversion6 < 0.0) {
        rtb_ap_special_disc = -1;
      } else {
        rtb_ap_special_disc = (rtb_DataTypeConversion6 > 0.0);
      }

      rtb_Y_o = rtb_Y_b * static_cast<real_T>(rtb_ap_special_disc) * ElacComputer_P.Gain2_Gain;
    }

    rtb_Y_b = ElacComputer_P.Gain1_Gain_b * rtb_Y_o;
    switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
     case 0:
      rtb_zeta_deg_f = rtb_zeta_deg;
      break;

     case 1:
      break;

     default:
      rtb_zeta_deg_f = ElacComputer_P.Constant_Value_c;
      break;
    }

    rtb_DataTypeConversion6 = rtb_DataTypeConversion3_m;
    rtb_DataTypeConversion7 = rtb_handleIndex_c;
    rtb_Y_f1 = ElacComputer_P.DiscreteDerivativeVariableTs_Gain * rtb_theta_dot;
    ElacComputer_LagFilter((rtb_Y_f1 - ElacComputer_DWork.Delay_DSTATE) / ElacComputer_U.in.time.dt,
      ElacComputer_P.LagFilter_C1_e, ElacComputer_U.in.time.dt, &rtb_Y_o, &ElacComputer_DWork.sf_LagFilter);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel_bit_p, &rtb_y_e);
    rtb_NOT_ac = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel1_bit_h, &rtb_y_e);
    rtb_y_f = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel2_bit_f, &rtb_y_e);
    rtb_AND1_h = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel3_bit_c, &rtb_y_e);
    rtb_AND3_b = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel4_bit_n, &rtb_y_e);
    rtb_NOT_kl = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel5_bit_p, &rtb_y_e);
    ElacComputer_MATLABFunction_o(rtb_NOT_ac, rtb_y_f, rtb_AND1_h, rtb_AND3_b, rtb_NOT_kl, (rtb_y_e != 0U),
      &rtb_handleIndex_c);
    if ((ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_1_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
          NormalOperation)) && (ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_2_deg.SSM ==
         static_cast<uint32_T>(SignStatusMatrix::NormalOperation))) {
      rtb_Switch_a_idx_0 = ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_1_deg.Data;
      rtb_Switch_a_idx_1 = ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_2_deg.Data;
    } else if ((ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_1_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation)) &&
               (ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_2_deg.SSM == static_cast<uint32_T>
                (SignStatusMatrix::NormalOperation))) {
      rtb_Switch_a_idx_0 = ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_1_deg.Data;
      rtb_Switch_a_idx_1 = ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_2_deg.Data;
    } else {
      rtb_Switch_a_idx_0 = 0.0F;
      rtb_Switch_a_idx_1 = 0.0F;
    }

    rtb_DataTypeConversion3_m = rtb_Switch_a_idx_0;
    rtb_DataTypeConversion8 = rtb_Switch_a_idx_1;
    rtb_DataTypeConversion_au = (ElacComputer_B.in_flight != 0.0);
    rtb_NOT_ac = (rtb_OR || (static_cast<real_T>(priorityPitchPitchLawCap) != ElacComputer_P.CompareToConstant_const_f));
    if (rtb_OR_eo) {
      rtb_DataTypeConversion6_g = ElacComputer_U.in.bus_inputs.fmgc_1_bus.delta_q_cmd_deg.Data;
    } else {
      rtb_DataTypeConversion6_g = ElacComputer_U.in.bus_inputs.fmgc_2_bus.delta_q_cmd_deg.Data;
    }

    LawMDLOBJ5.step(&ElacComputer_U.in.time.dt, &rtb_BusAssignment_f_logic_ir_computation_data_n_z_g, &rtb_Y_n_tmp_tmp,
                    &rtb_DataTypeConversion5, &rtb_BusAssignment_f_logic_ir_computation_data_theta_dot_deg_s, &rtb_Y_o,
                    &ElacComputer_U.in.analog_inputs.left_elevator_pos_deg, &ElacComputer_U.in.analog_inputs.ths_pos_deg,
                    &rtb_Y, &rtb_eta_trim_limit_lo_d,
                    &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn, &rtb_handleIndex_e,
                    &rtb_handleIndex_c, (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
      (&ElacComputer_RGND)), &rtb_DataTypeConversion3_m, &rtb_DataTypeConversion8,
                    &ElacComputer_U.in.sim_data.tailstrike_protection_on, (const_cast<real_T*>(&ElacComputer_RGND)),
                    &u0_0, &rtb_ra1Invalid, &rtb_DataTypeConversion_au, &rtb_NOT_ac, &ElacComputer_DWork.sProtActive_f,
                    &ElacComputer_DWork.sProtActive, &rtb_handleIndex, &rtb_Switch3_p,
                    &rtb_BusAssignment_p_logic_high_speed_prot_hi_thresh_kn, &abnormalCondition_tmp,
                    &rtb_DataTypeConversion6_g, &rtb_NOT_k, &rtb_eta_deg, &rtb_eta_trim_dot_deg_s,
                    &rtb_eta_trim_limit_lo, &rtb_eta_trim_limit_up);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel_bit_n, &rtb_y_e);
    rtb_NOT_ac = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel1_bit_h1, &rtb_y_e);
    rtb_NOT_k = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel2_bit_g, &rtb_y_e);
    rtb_y_f = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel3_bit_b, &rtb_y_e);
    rtb_AND1_h = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel4_bit_i, &rtb_y_e);
    rtb_AND3_b = (rtb_y_e != 0U);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sfcc_1_bus.slat_flap_system_status_word,
      ElacComputer_P.BitfromLabel5_bit_l, &rtb_y_e);
    ElacComputer_MATLABFunction_o(rtb_NOT_ac, rtb_NOT_k, rtb_y_f, rtb_AND1_h, rtb_AND3_b, (rtb_y_e != 0U),
      &rtb_handleIndex_e);
    rtb_Y_o = (ElacComputer_B.in_flight != 0.0);
    rtb_NOT_ac = (rtb_OR || ((static_cast<real_T>(priorityPitchPitchLawCap) != ElacComputer_P.CompareToConstant2_const) &&
      (static_cast<real_T>(priorityPitchPitchLawCap) != ElacComputer_P.CompareToConstant3_const)));
    rtb_NOT_k = (priorityPitchPitchLawCap != ElacComputer_P.EnumeratedConstant_Value_b);
    LawMDLOBJ3.step(&ElacComputer_U.in.time.dt, &rtb_BusAssignment_f_logic_ir_computation_data_n_z_g, &rtb_Y_n_tmp_tmp,
                    &rtb_DataTypeConversion5, &rtb_BusAssignment_f_logic_ir_computation_data_theta_dot_deg_s, (
      const_cast<real_T*>(&ElacComputer_RGND)), &ElacComputer_U.in.analog_inputs.ths_pos_deg, &rtb_eta_trim_limit_lo_d,
                    &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_mach,
                    &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn, &rtb_handleIndex_e, (
      const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), &u0_0, &rtb_Y_o, &rtb_NOT_ac,
                    &rtb_NOT_k, &rtb_eta_deg_o, &rtb_eta_trim_dot_deg_s_a, &rtb_eta_trim_limit_lo_h,
                    &rtb_eta_trim_limit_up_d);
    LawMDLOBJ4.step(&ElacComputer_U.in.time.dt, &u0_0, &rtb_Y_o, &rtb_handleIndex_c, &rtb_eta_trim_limit_lo_d,
                    &rtb_DataTypeConversion3_m);
    switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
     case 0:
      rtb_Y_o = rtb_eta_deg;
      break;

     case 1:
     case 2:
      rtb_Y_o = rtb_eta_deg_o;
      break;

     case 3:
      break;

     default:
      rtb_Y_o = ElacComputer_P.Constant_Value_a;
      break;
    }

    switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
     case 0:
      rtb_DataTypeConversion3_m = rtb_eta_trim_limit_up;
      break;

     case 1:
     case 2:
      rtb_DataTypeConversion3_m = rtb_eta_trim_limit_up_d;
      break;

     case 3:
      break;

     default:
      rtb_DataTypeConversion3_m = ElacComputer_P.Constant2_Value_l;
      break;
    }

    if (rtb_OR1_i) {
      rtb_handleIndex_c = ElacComputer_P.Gain_Gain_l * ElacComputer_DWork.Delay_DSTATE_b;
      if (rtb_handleIndex_c > ElacComputer_P.Saturation_UpperSat_g) {
        rtb_handleIndex_c = ElacComputer_P.Saturation_UpperSat_g;
      } else if (rtb_handleIndex_c < ElacComputer_P.Saturation_LowerSat_o) {
        rtb_handleIndex_c = ElacComputer_P.Saturation_LowerSat_o;
      }
    } else if (ElacComputer_U.in.discrete_inputs.ths_override_active) {
      rtb_handleIndex_c = ElacComputer_P.Constant_Value_n;
    } else {
      switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
       case 0:
        rtb_handleIndex_c = rtb_eta_trim_dot_deg_s;
        break;

       case 1:
       case 2:
        rtb_handleIndex_c = rtb_eta_trim_dot_deg_s_a;
        break;

       case 3:
        break;

       default:
        rtb_handleIndex_c = ElacComputer_P.Constant_Value_a;
        break;
      }
    }

    rtb_handleIndex_c = ElacComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_handleIndex_c *
      ElacComputer_U.in.time.dt;
    ElacComputer_DWork.icLoad = ((!rtb_y_p) || ElacComputer_DWork.icLoad);
    if (ElacComputer_DWork.icLoad) {
      ElacComputer_DWork.Delay_DSTATE_c = ElacComputer_U.in.analog_inputs.ths_pos_deg - rtb_handleIndex_c;
    }

    ElacComputer_DWork.Delay_DSTATE_b = rtb_handleIndex_c + ElacComputer_DWork.Delay_DSTATE_c;
    if (ElacComputer_DWork.Delay_DSTATE_b > rtb_DataTypeConversion3_m) {
      ElacComputer_DWork.Delay_DSTATE_b = rtb_DataTypeConversion3_m;
    } else {
      switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
       case 0:
        rtb_eta_trim_limit_lo_d = rtb_eta_trim_limit_lo;
        break;

       case 1:
       case 2:
        rtb_eta_trim_limit_lo_d = rtb_eta_trim_limit_lo_h;
        break;

       case 3:
        break;

       default:
        rtb_eta_trim_limit_lo_d = ElacComputer_P.Constant3_Value_h;
        break;
      }

      if (ElacComputer_DWork.Delay_DSTATE_b < rtb_eta_trim_limit_lo_d) {
        ElacComputer_DWork.Delay_DSTATE_b = rtb_eta_trim_limit_lo_d;
      }
    }

    rtb_NOT_ac = ((look1_binlxpw(static_cast<real_T>(rtb_V_ias), ElacComputer_P.uDLookupTable_bp01Data_h,
      ElacComputer_P.uDLookupTable_tableData_j, 6U) < std::abs(rtb_Y_o)) && rtb_isEngagedInPitch);
    rtb_eta_trim_limit_lo_d = rtb_Y_o;
    ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.elac_opp_bus.elevator_double_pressurization_command_deg,
      &rtb_y_f);
    rtb_NOT_k = ((!rtb_isEngagedInPitch) && rtb_y_f);
    if (rtb_NOT_k) {
      rtb_Y_o = ElacComputer_U.in.bus_inputs.elac_opp_bus.elevator_double_pressurization_command_deg.Data;
    }

    if ((rtb_NOT_k || rtb_isEngagedInPitch) && rtb_OR1) {
      ElacComputer_Y.out.analog_outputs.right_elev_pos_order_deg = rtb_Y_o;
    } else {
      ElacComputer_Y.out.analog_outputs.right_elev_pos_order_deg = ElacComputer_P.Constant_Value_b;
    }

    if ((rtb_isEngagedInPitch || rtb_NOT_k) && rtb_OR3) {
      ElacComputer_Y.out.analog_outputs.left_elev_pos_order_deg = rtb_Y_o;
    } else {
      ElacComputer_Y.out.analog_outputs.left_elev_pos_order_deg = ElacComputer_P.Constant_Value_b;
    }

    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_1,
      ElacComputer_P.BitfromLabel_bit_p3, &rtb_y_aw);
    rtb_AND3_b = (rtb_y_aw != 0U);
    if (ElacComputer_U.in.discrete_inputs.is_unit_2) {
      rtb_Switch1_g_0 = &ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_1;
    } else {
      rtb_Switch1_g_0 = &ElacComputer_U.in.bus_inputs.sec_2_bus.discrete_status_word_1;
    }

    ElacComputer_MATLABFunction_j(rtb_Switch1_g_0, ElacComputer_P.BitfromLabel2_bit_j, &rtb_y_aw);
    rtb_AND3_b = (rtb_NOT_ac && (rtb_AND3_b || (rtb_y_aw != 0U)));
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_1,
      ElacComputer_P.BitfromLabel1_bit_i, &rtb_y_aw);
    rtb_AND1_h = (rtb_y_aw != 0U);
    ElacComputer_MATLABFunction_j(rtb_Switch1_g_0, ElacComputer_P.BitfromLabel3_bit_mo, &rtb_y_aw);
    rtb_AND1_h = ((rtb_AND1_h || (rtb_y_aw != 0U)) && rtb_NOT_ac);
    ElacComputer_MATLABFunction_c((rtb_BusAssignment_n_logic_is_yellow_hydraulic_power_avail || rtb_OR6 || rtb_OR7),
      ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge_f, ElacComputer_P.ConfirmNode_timeDelay_p,
      &rtb_y_f, &ElacComputer_DWork.sf_MATLABFunction_fb);
    ElacComputer_Y.out.bus_outputs.elevator_double_pressurization_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    if (ElacComputer_P.EnumeratedConstant2_Value == rtb_activeLateralLaw) {
      rtb_ap_special_disc = static_cast<int32_T>(ElacComputer_P.EnumeratedConstant1_Value);
      ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.Data = static_cast<real32_T>(rtb_zeta_deg_f);
    } else {
      rtb_ap_special_disc = static_cast<int32_T>(ElacComputer_P.EnumeratedConstant_Value);
      ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant7_Value);
    }

    if (rtb_NOT_ac) {
      ElacComputer_Y.out.bus_outputs.elevator_double_pressurization_command_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant1_Value);
      ElacComputer_Y.out.bus_outputs.elevator_double_pressurization_command_deg.Data = static_cast<real32_T>
        (rtb_eta_trim_limit_lo_d);
    } else {
      ElacComputer_Y.out.bus_outputs.elevator_double_pressurization_command_deg.Data = static_cast<real32_T>
        (ElacComputer_P.Constant8_Value);
    }

    rtb_VectorConcatenate[0] = ElacComputer_U.in.discrete_inputs.l_ail_servo_failed;
    rtb_VectorConcatenate[1] = ElacComputer_U.in.discrete_inputs.r_ail_servo_failed;
    rtb_VectorConcatenate[2] = ElacComputer_U.in.discrete_inputs.l_elev_servo_failed;
    rtb_VectorConcatenate[3] = ElacComputer_U.in.discrete_inputs.r_elev_servo_failed;
    rtb_VectorConcatenate[4] = leftAileronAvail;
    rtb_VectorConcatenate[5] = rightAileronAvail;
    rtb_VectorConcatenate[6] = rtb_OR3;
    rtb_VectorConcatenate[7] = rtb_OR1;
    rtb_VectorConcatenate[8] = rtb_isEngagedInPitch;
    rtb_VectorConcatenate[9] = rtb_isEngagedInRoll;
    rtb_VectorConcatenate[10] = !canEngageInPitch;
    rtb_VectorConcatenate[11] = !canEngageInRoll;
    rtb_VectorConcatenate[12] = ((priorityPitchPitchLawCap == pitch_efcs_law::NormalLaw) || (priorityPitchPitchLawCap ==
      pitch_efcs_law::AlternateLaw2));
    rtb_VectorConcatenate[13] = ((priorityPitchPitchLawCap == pitch_efcs_law::AlternateLaw1) ||
      (priorityPitchPitchLawCap == pitch_efcs_law::AlternateLaw2));
    rtb_VectorConcatenate[14] = (priorityPitchPitchLawCap == pitch_efcs_law::DirectLaw);
    ElacComputer_LateralLawCaptoBits(rtb_activeLateralLaw, &rtb_VectorConcatenate[15], &rtb_VectorConcatenate[16]);
    ElacComputer_MATLABFunction_j(&ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_1,
      ElacComputer_P.BitfromLabel_bit_es, &rtb_y_aw);
    rtb_NOT_k = ((rtb_activeLateralLaw == lateral_efcs_law::NormalLaw) || rtb_OR1_me);
    rtb_VectorConcatenate[17] = (rtb_NOT_k || ((rtb_y_aw == 0U) &&
      (ElacComputer_U.in.bus_inputs.sec_1_bus.discrete_status_word_1.SSM == static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation))));
    rtb_VectorConcatenate[18] = rtb_NOT_k;
    ElacComputer_MATLABFunction_cw(rtb_VectorConcatenate, &ElacComputer_Y.out.bus_outputs.discrete_status_word_1.Data);
    rtb_VectorConcatenate_a[0] = ((rtb_pitchLawCapability == pitch_efcs_law::NormalLaw) || (rtb_pitchLawCapability ==
      pitch_efcs_law::DirectLaw));
    rtb_VectorConcatenate_a[1] = ((rtb_pitchLawCapability == pitch_efcs_law::AlternateLaw1) || (rtb_pitchLawCapability ==
      pitch_efcs_law::AlternateLaw2) || (rtb_pitchLawCapability == pitch_efcs_law::DirectLaw));
    ElacComputer_LateralLawCaptoBits(rtb_lateralLawCapability, &rtb_VectorConcatenate_a[2], &rtb_VectorConcatenate_a[3]);
    rtb_VectorConcatenate_a[4] = ElacComputer_P.Constant9_Value;
    rtb_VectorConcatenate_a[5] = ElacComputer_P.Constant9_Value;
    rtb_VectorConcatenate_a[6] = ElacComputer_DWork.pLeftStickDisabled;
    rtb_VectorConcatenate_a[7] = ElacComputer_DWork.pRightStickDisabled;
    rtb_VectorConcatenate_a[8] = rtb_OR4;
    rtb_VectorConcatenate_a[9] = rtb_AND2;
    rtb_VectorConcatenate_a[10] = rtb_AND3_j;
    rtb_VectorConcatenate_a[11] = (casValid_tmp_tmp || rtb_AND2_e_tmp);
    rtb_VectorConcatenate_a[12] = ElacComputer_DWork.sProtActive_f;
    rtb_VectorConcatenate_a[13] = ElacComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[14] = ElacComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[15] = ElacComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[16] = ElacComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[17] = ElacComputer_P.Constant10_Value;
    rtb_VectorConcatenate_a[18] = ElacComputer_P.Constant10_Value;
    ElacComputer_MATLABFunction_cw(rtb_VectorConcatenate_a, &ElacComputer_Y.out.bus_outputs.discrete_status_word_2.Data);
    ElacComputer_Y.out.data = ElacComputer_U.in;
    ElacComputer_Y.out.laws.lateral_law_outputs.left_aileron_command_deg = rtb_DataTypeConversion6;
    ElacComputer_Y.out.laws.lateral_law_outputs.right_aileron_command_deg = rtb_DataTypeConversion7;
    ElacComputer_Y.out.laws.lateral_law_outputs.roll_spoiler_command_deg = rtb_Y_b;
    ElacComputer_Y.out.laws.lateral_law_outputs.yaw_damper_command_deg = rtb_zeta_deg_f;
    ElacComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_eta_trim_limit_lo_d;
    ElacComputer_Y.out.laws.pitch_law_outputs.ths_command_deg = ElacComputer_DWork.Delay_DSTATE_b;
    ElacComputer_Y.out.laws.pitch_law_outputs.elevator_double_pressurization_active = rtb_NOT_ac;
    ElacComputer_Y.out.logic.on_ground = rtb_ra1Invalid;
    ElacComputer_Y.out.logic.pitch_law_in_flight = (ElacComputer_B.in_flight != 0.0);
    ElacComputer_Y.out.logic.tracking_mode_on = rtb_OR;
    ElacComputer_Y.out.logic.lateral_law_capability = rtb_lateralLawCapability;
    ElacComputer_Y.out.logic.active_lateral_law = rtb_activeLateralLaw;
    ElacComputer_Y.out.logic.pitch_law_capability = rtb_pitchLawCapability;
    ElacComputer_Y.out.logic.active_pitch_law = priorityPitchPitchLawCap;
    ElacComputer_Y.out.logic.abnormal_condition_law_active = rtb_OR1_me;
    ElacComputer_Y.out.logic.is_engaged_in_pitch = rtb_isEngagedInPitch;
    ElacComputer_Y.out.logic.can_engage_in_pitch = canEngageInPitch;
    ElacComputer_Y.out.logic.has_priority_in_pitch = hasPriorityInPitch;
    ElacComputer_Y.out.logic.left_elevator_avail = rtb_OR3;
    ElacComputer_Y.out.logic.right_elevator_avail = rtb_OR1;
    ElacComputer_Y.out.logic.ths_avail = rtb_thsAvail;
    ElacComputer_Y.out.logic.ths_active_commanded = rtb_y_p;
    ElacComputer_Y.out.logic.ths_ground_setting_active = rtb_OR1_i;
    ElacComputer_Y.out.logic.is_engaged_in_roll = rtb_isEngagedInRoll;
    ElacComputer_Y.out.logic.can_engage_in_roll = canEngageInRoll;
    ElacComputer_Y.out.logic.has_priority_in_roll = hasPriorityInRoll;
    ElacComputer_Y.out.logic.left_aileron_crosscommand_active = rtb_leftAileronCrossCommandActive;
    ElacComputer_Y.out.logic.right_aileron_crosscommand_active = rtb_rightAileronCrossCommandActive;
    ElacComputer_Y.out.logic.left_aileron_avail = leftAileronAvail;
    ElacComputer_Y.out.logic.right_aileron_avail = rightAileronAvail;
    ElacComputer_Y.out.logic.aileron_droop_active = rtb_AND3_j;
    ElacComputer_Y.out.logic.aileron_antidroop_active = rtb_DataTypeConversion_e;
    ElacComputer_Y.out.logic.is_yellow_hydraulic_power_avail = rtb_BusAssignment_n_logic_is_yellow_hydraulic_power_avail;
    ElacComputer_Y.out.logic.is_blue_hydraulic_power_avail = rtb_OR6;
    ElacComputer_Y.out.logic.is_green_hydraulic_power_avail = rtb_OR7;
    ElacComputer_Y.out.logic.left_sidestick_disabled = ElacComputer_DWork.pLeftStickDisabled;
    ElacComputer_Y.out.logic.right_sidestick_disabled = ElacComputer_DWork.pRightStickDisabled;
    ElacComputer_Y.out.logic.left_sidestick_priority_locked = rtb_OR4;
    ElacComputer_Y.out.logic.right_sidestick_priority_locked = rtb_AND2;
    ElacComputer_Y.out.logic.total_sidestick_pitch_command = u0_0;
    ElacComputer_Y.out.logic.total_sidestick_roll_command = u0;
    ElacComputer_Y.out.logic.ap_authorised = rtb_ap_authorised;
    ElacComputer_Y.out.logic.ap_1_control = rtb_OR_eo;
    ElacComputer_Y.out.logic.ap_2_control = rtb_AND2_j;
    ElacComputer_Y.out.logic.high_alpha_prot_active = ElacComputer_DWork.sProtActive_f;
    ElacComputer_Y.out.logic.alpha_prot_deg = rtb_handleIndex;
    ElacComputer_Y.out.logic.alpha_max_deg = rtb_Switch3_p;
    ElacComputer_Y.out.logic.high_speed_prot_active = ElacComputer_DWork.sProtActive;
    ElacComputer_Y.out.logic.high_speed_prot_lo_thresh_kn = abnormalCondition_tmp;
    ElacComputer_Y.out.logic.high_speed_prot_hi_thresh_kn = rtb_BusAssignment_p_logic_high_speed_prot_hi_thresh_kn;
    ElacComputer_Y.out.logic.double_adr_failure = rtb_doubleAdrFault;
    ElacComputer_Y.out.logic.triple_adr_failure = rtb_tripleAdrFault;
    ElacComputer_Y.out.logic.cas_or_mach_disagree = ElacComputer_P.Constant1_Value_b;
    ElacComputer_Y.out.logic.alpha_disagree = ElacComputer_P.Constant1_Value_b;
    ElacComputer_Y.out.logic.double_ir_failure = rtb_doubleIrFault;
    ElacComputer_Y.out.logic.triple_ir_failure = rtb_tripleIrFault;
    ElacComputer_Y.out.logic.ir_failure_not_self_detected = ElacComputer_P.Constant_Value_ad;
    ElacComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    ElacComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    ElacComputer_Y.out.logic.adr_computation_data.mach = rtb_mach;
    ElacComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_Y;
    ElacComputer_Y.out.logic.ir_computation_data.theta_deg = rtb_alpha;
    ElacComputer_Y.out.logic.ir_computation_data.phi_deg = rtb_phi;
    ElacComputer_Y.out.logic.ir_computation_data.q_deg_s = rtb_q;
    ElacComputer_Y.out.logic.ir_computation_data.r_deg_s = rtb_r;
    ElacComputer_Y.out.logic.ir_computation_data.n_x_g = rtb_n_x;
    ElacComputer_Y.out.logic.ir_computation_data.n_y_g = rtb_n_y;
    ElacComputer_Y.out.logic.ir_computation_data.n_z_g = rtb_n_z;
    ElacComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    ElacComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    ElacComputer_Y.out.logic.ra_computation_data_ft = rtb_raComputationValue;
    ElacComputer_Y.out.logic.dual_ra_failure = casValid;
    ElacComputer_Y.out.discrete_outputs.pitch_axis_ok = canEngageInPitch;
    ElacComputer_Y.out.discrete_outputs.left_aileron_ok = leftAileronAvail;
    ElacComputer_Y.out.discrete_outputs.right_aileron_ok = rightAileronAvail;
    ElacComputer_Y.out.discrete_outputs.digital_output_validated = ElacComputer_P.Constant1_Value_e;
    ElacComputer_Y.out.discrete_outputs.ap_1_authorised = rtb_ap_authorised;
    ElacComputer_Y.out.discrete_outputs.ap_2_authorised = rtb_ap_authorised;
    rtb_NOT_ac = ((rtb_isEngagedInRoll || rtb_leftAileronCrossCommandActive) && leftAileronAvail);
    ElacComputer_Y.out.discrete_outputs.left_aileron_active_mode = rtb_NOT_ac;
    casValid = ((rtb_isEngagedInRoll || rtb_rightAileronCrossCommandActive) && rightAileronAvail);
    ElacComputer_Y.out.discrete_outputs.right_aileron_active_mode = casValid;
    ElacComputer_Y.out.discrete_outputs.left_elevator_damping_mode = (rtb_isEngagedInPitch && rtb_OR3 && (!rtb_AND3_b));
    ElacComputer_Y.out.discrete_outputs.right_elevator_damping_mode = (rtb_isEngagedInPitch && rtb_OR1 && (!rtb_AND1_h));
    rtb_ra1Invalid = (rtb_y_p && rtb_thsAvail);
    ElacComputer_Y.out.discrete_outputs.ths_active = rtb_ra1Invalid;
    ElacComputer_Y.out.discrete_outputs.batt_power_supply = rtb_y_f;
    if (rtb_ra1Invalid) {
      ElacComputer_Y.out.analog_outputs.ths_pos_order = ElacComputer_DWork.Delay_DSTATE_b;
    } else {
      ElacComputer_Y.out.analog_outputs.ths_pos_order = ElacComputer_P.Constant_Value_b;
    }

    if (rtb_NOT_ac) {
      ElacComputer_Y.out.analog_outputs.left_aileron_pos_order = rtb_DataTypeConversion6;
    } else {
      ElacComputer_Y.out.analog_outputs.left_aileron_pos_order = ElacComputer_P.Constant_Value_b;
    }

    if (casValid) {
      ElacComputer_Y.out.analog_outputs.right_aileron_pos_order = rtb_DataTypeConversion7;
    } else {
      ElacComputer_Y.out.analog_outputs.right_aileron_pos_order = ElacComputer_P.Constant_Value_b;
    }

    if (ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) {
      ElacComputer_Y.out.bus_outputs.left_aileron_position_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant_Value);
      ElacComputer_Y.out.bus_outputs.left_aileron_position_deg.Data = static_cast<real32_T>
        (ElacComputer_P.Constant_Value_j);
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
        (ElacComputer_P.Constant2_Value_b);
    } else {
      ElacComputer_Y.out.bus_outputs.left_elevator_position_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant1_Value);
      ElacComputer_Y.out.bus_outputs.left_elevator_position_deg.Data = static_cast<real32_T>
        (ElacComputer_U.in.analog_inputs.left_elevator_pos_deg);
    }

    if (ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) {
      ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant_Value);
      ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
        (ElacComputer_P.Constant3_Value_f);
    } else {
      ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant1_Value);
      ElacComputer_Y.out.bus_outputs.right_elevator_position_deg.Data = static_cast<real32_T>
        (ElacComputer_U.in.analog_inputs.right_elevator_pos_deg);
    }

    if (ElacComputer_U.in.discrete_inputs.ths_motor_fault) {
      ElacComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant_Value);
      ElacComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant4_Value_i);
    } else {
      ElacComputer_Y.out.bus_outputs.ths_position_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant1_Value);
      ElacComputer_Y.out.bus_outputs.ths_position_deg.Data = static_cast<real32_T>
        (ElacComputer_U.in.analog_inputs.ths_pos_deg);
    }

    ElacComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.left_sidestick_pitch_command_deg.Data = ElacComputer_P.Gain_Gain_b *
      static_cast<real32_T>(ElacComputer_U.in.analog_inputs.capt_pitch_stick_pos);
    ElacComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.right_sidestick_pitch_command_deg.Data = ElacComputer_P.Gain1_Gain_f * static_cast<
      real32_T>(ElacComputer_U.in.analog_inputs.fo_pitch_stick_pos);
    ElacComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = ElacComputer_P.Gain2_Gain_c *
      static_cast<real32_T>(ElacComputer_U.in.analog_inputs.capt_roll_stick_pos);
    ElacComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = ElacComputer_P.Gain3_Gain *
      static_cast<real32_T>(ElacComputer_U.in.analog_inputs.fo_roll_stick_pos);
    ElacComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = ElacComputer_P.Gain4_Gain * static_cast<real32_T>
      (ElacComputer_U.in.analog_inputs.rudder_pedal_pos);
    if ((rtb_AND4 || rtb_OR_e1) && rtb_isEngagedInRoll) {
      ElacComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant1_Value);
      if (rtb_AND4) {
        ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>(rtb_DataTypeConversion6);
      } else {
        ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>(rtb_DataTypeConversion7);
      }
    } else {
      ElacComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant_Value);
      ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant5_Value);
    }

    if (static_cast<real_T>(rtb_isEngagedInRoll) > ElacComputer_P.Switch13_Threshold) {
      ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant1_Value);
    } else {
      ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
        (ElacComputer_P.EnumeratedConstant_Value);
    }

    if (static_cast<real_T>(rtb_isEngagedInRoll) > ElacComputer_P.Switch12_Threshold) {
      ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = static_cast<real32_T>(rtb_Y_b);
    } else {
      ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = static_cast<real32_T>
        (ElacComputer_P.Constant6_Value);
    }

    ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.SSM = static_cast<uint32_T>(rtb_ap_special_disc);
    ElacComputer_Y.out.bus_outputs.speedbrake_extension_deg =
      ElacComputer_U.in.bus_inputs.sec_1_bus.speed_brake_command_deg;
    ElacComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    ElacComputer_DWork.Delay_DSTATE_cc = rtb_OR4;
    ElacComputer_DWork.Delay1_DSTATE = rtb_AND2;
    ElacComputer_DWork.Delay_DSTATE = rtb_Y_f1;
    ElacComputer_DWork.icLoad = false;
    ElacComputer_DWork.Delay_DSTATE_c = ElacComputer_DWork.Delay_DSTATE_b;
  } else {
    ElacComputer_DWork.Runtime_MODE = false;
  }
}

void ElacComputer::initialize()
{
  ElacComputer_DWork.Delay_DSTATE_cc = ElacComputer_P.Delay_InitialCondition_c;
  ElacComputer_DWork.Delay1_DSTATE = ElacComputer_P.Delay1_InitialCondition;
  ElacComputer_DWork.Memory_PreviousInput = ElacComputer_P.SRFlipFlop_initial_condition;
  ElacComputer_DWork.Delay_DSTATE = ElacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
  ElacComputer_DWork.Delay_DSTATE_b = ElacComputer_P.Delay_InitialCondition;
  ElacComputer_DWork.icLoad = true;
  LawMDLOBJ2.init();
  LawMDLOBJ5.init();
  LawMDLOBJ3.init();
  ElacComputer_Y.out = ElacComputer_P.out_Y0;
}

void ElacComputer::terminate()
{
}

ElacComputer::ElacComputer():
  ElacComputer_U(),
  ElacComputer_Y(),
  ElacComputer_B(),
  ElacComputer_DWork()
{
}

ElacComputer::~ElacComputer() = default;
