#include "ElacComputer.h"
#include "rtwtypes.h"
#include "ElacComputer_types.h"
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

void ElacComputer::ElacComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void ElacComputer::ElacComputer_MATLABFunction_d(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_ElacComputer_f_T *localDW)
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

void ElacComputer::ElacComputer_Voter(real32_T rtu_u, real32_T rtu_u_k, real32_T rtu_u_d, real32_T *rty_y)
{
  int32_T rtu_u_0;
  real32_T rtb_TmpSignalConversionAtSFunctionInport1[3];
  rtb_TmpSignalConversionAtSFunctionInport1[0] = rtu_u;
  rtb_TmpSignalConversionAtSFunctionInport1[1] = rtu_u_k;
  rtb_TmpSignalConversionAtSFunctionInport1[2] = rtu_u_d;
  if (rtu_u < rtu_u_k) {
    if (rtu_u_k < rtu_u_d) {
      rtu_u_0 = 1;
    } else if (rtu_u < rtu_u_d) {
      rtu_u_0 = 2;
    } else {
      rtu_u_0 = 0;
    }
  } else if (rtu_u < rtu_u_d) {
    rtu_u_0 = 0;
  } else if (rtu_u_k < rtu_u_d) {
    rtu_u_0 = 2;
  } else {
    rtu_u_0 = 1;
  }

  *rty_y = rtb_TmpSignalConversionAtSFunctionInport1[rtu_u_0];
}

void ElacComputer::ElacComputer_MATLABFunction_o(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void ElacComputer::ElacComputer_MATLABFunction_c(const boolean_T rtu_u[19], real32_T *rty_y)
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
  real_T rtb_eta_trim_deg;
  real_T rtb_eta_deg_o;
  real_T rtb_eta_trim_deg_b;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_ias_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn;
  real_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_alpha_deg;
  real_T rtb_DataTypeConversion3;
  real_T rtb_DataTypeConversion5_tmp_tmp;
  real_T rtb_DataTypeConversion8;
  real_T rtb_Y;
  real_T rtb_Y_f;
  real_T rtb_Y_h_tmp_tmp;
  real_T rtb_logic_crg1_ir_computation_data_n_z_g_tmp_tmp;
  real_T rtb_logic_crg1_ir_computation_data_theta_dot_deg_s_tmp_tmp;
  real_T rtb_logic_crg1_ra_computation_data_ft;
  real_T rtb_xi_deg_m;
  real_T rtb_zeta_deg_f;
  real_T u0;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_mach;
  real32_T rtb_raComputationValue;
  real32_T rtb_tla2;
  real32_T rtb_y_li;
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
  boolean_T rtb_AND2_p;
  boolean_T rtb_AND3;
  boolean_T rtb_NOT;
  boolean_T rtb_NOT_h;
  boolean_T rtb_OR1;
  boolean_T rtb_OR3;
  boolean_T rtb_OR4;
  boolean_T rtb_OR7;
  boolean_T rtb_aileronAntidroopActive;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_doubleIrFault;
  boolean_T rtb_isEngagedInPitch;
  boolean_T rtb_isEngagedInRoll;
  boolean_T rtb_leftAileronCrossCommandActive;
  boolean_T rtb_logic_crg1_is_green_hydraulic_power_avail;
  boolean_T rtb_logic_crg1_tracking_mode_on;
  boolean_T rtb_on_ground;
  boolean_T rtb_rightAileronCrossCommandActive;
  boolean_T rtb_rightElevatorAvail;
  boolean_T rtb_tripleAdrFault;
  boolean_T rtb_y_j;
  lateral_efcs_law priorityPitchLateralLawCap;
  lateral_efcs_law rtb_activeLateralLaw;
  lateral_efcs_law rtb_lateralLawCapability;
  lateral_efcs_law rtb_oppElacRollCapability;
  pitch_efcs_law priorityPitchPitchLawCap;
  pitch_efcs_law rtb_pitchLawCapability;
  ElacComputer_Voter(ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data,
                     ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data,
                     ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data, &rtb_y_li);
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data - rtb_y_li) >
    ElacComputer_P.SourceMonitoringbyVote_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode_isRisingEdge, ElacComputer_P.SourceMonitoringbyVote_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_pu);
  ElacComputer_DWork.Memory_PreviousInput = ElacComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_d) << 1) + ElacComputer_DWork.Memory_PreviousInput];
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.Data - rtb_y_li) >
    ElacComputer_P.SourceMonitoringbyVote_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode1_isRisingEdge, ElacComputer_P.SourceMonitoringbyVote_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_k);
  ElacComputer_DWork.Memory_PreviousInput_n = ElacComputer_P.Logic_table_a[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_d) << 1) + ElacComputer_DWork.Memory_PreviousInput_n];
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data - rtb_y_li) >
    ElacComputer_P.SourceMonitoringbyVote_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode2_isRisingEdge, ElacComputer_P.SourceMonitoringbyVote_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_b);
  ElacComputer_DWork.Memory_PreviousInput_o = ElacComputer_P.Logic_table_n[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_d) << 1) + ElacComputer_DWork.Memory_PreviousInput_o];
  ElacComputer_Voter(ElacComputer_U.in.bus_inputs.adr_1_bus.mach.Data, ElacComputer_U.in.bus_inputs.adr_2_bus.mach.Data,
                     ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data, &rtb_y_li);
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_1_bus.mach, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_1_bus.mach.Data - rtb_y_li) >
    ElacComputer_P.SourceMonitoringbyVote1_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode_isRisingEdge_j, ElacComputer_P.SourceMonitoringbyVote1_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_h);
  ElacComputer_DWork.Memory_PreviousInput_a = ElacComputer_P.Logic_table_d[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_p) << 1) + ElacComputer_DWork.Memory_PreviousInput_a];
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_2_bus.mach, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_2_bus.mach.Data - rtb_y_li) >
    ElacComputer_P.SourceMonitoringbyVote1_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode1_isRisingEdge_h, ElacComputer_P.SourceMonitoringbyVote1_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_ei);
  ElacComputer_DWork.Memory_PreviousInput_p = ElacComputer_P.Logic_table_e[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_p) << 1) + ElacComputer_DWork.Memory_PreviousInput_p];
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_3_bus.mach, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data - rtb_y_li) >
    ElacComputer_P.SourceMonitoringbyVote1_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode2_isRisingEdge_f, ElacComputer_P.SourceMonitoringbyVote1_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_o);
  ElacComputer_DWork.Memory_PreviousInput_l = ElacComputer_P.Logic_table_g[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_p) << 1) + ElacComputer_DWork.Memory_PreviousInput_l];
  ElacComputer_Voter(ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data,
                     ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data,
                     ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data, &rtb_y_li);
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data - rtb_y_li) >
    ElacComputer_P.AlphaMonitoring_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode_isRisingEdge_n, ElacComputer_P.AlphaMonitoring_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_d);
  ElacComputer_DWork.Memory_PreviousInput_h = ElacComputer_P.Logic_table_g0[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_c) << 1) + ElacComputer_DWork.Memory_PreviousInput_h];
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.Data - rtb_y_li) >
    ElacComputer_P.AlphaMonitoring_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode1_isRisingEdge_g, ElacComputer_P.AlphaMonitoring_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_e);
  ElacComputer_DWork.Memory_PreviousInput_i = ElacComputer_P.Logic_table_e1[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_c) << 1) + ElacComputer_DWork.Memory_PreviousInput_i];
  ElacComputer_MATLABFunction(&ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg, &rtb_y_j);
  ElacComputer_MATLABFunction_d((std::abs(ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data - rtb_y_li) >
    ElacComputer_P.AlphaMonitoring_threshold) && rtb_y_j, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode2_isRisingEdge_j, ElacComputer_P.AlphaMonitoring_confirmTime, &rtb_y_j,
    &ElacComputer_DWork.sf_MATLABFunction_a);
  ElacComputer_DWork.Memory_PreviousInput_lo = ElacComputer_P.Logic_table_n4[(((static_cast<uint32_T>(rtb_y_j) << 1) +
    ElacComputer_P.Constant5_Value_c) << 1) + ElacComputer_DWork.Memory_PreviousInput_lo];
  rtb_y_j = (ElacComputer_DWork.Memory_PreviousInput_h || ElacComputer_DWork.Memory_PreviousInput_i ||
             ElacComputer_DWork.Memory_PreviousInput_lo);
  rtb_AND3 = (ElacComputer_DWork.Memory_PreviousInput || ElacComputer_DWork.Memory_PreviousInput_a);
  rtb_OR1 = ((ElacComputer_U.in.bus_inputs.adr_1_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::FailureWarning))
             || (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || rtb_AND3 || ElacComputer_DWork.Memory_PreviousInput_h);
  rtb_AND2_p = (ElacComputer_DWork.Memory_PreviousInput_n || ElacComputer_DWork.Memory_PreviousInput_p);
  rtb_OR3 = ((ElacComputer_U.in.bus_inputs.adr_2_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::FailureWarning))
             || (ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_2_bus.airspeed_true_kn.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (ElacComputer_U.in.bus_inputs.adr_2_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || rtb_AND2_p || ElacComputer_DWork.Memory_PreviousInput_i);
  rtb_NOT_h = (ElacComputer_DWork.Memory_PreviousInput_o || ElacComputer_DWork.Memory_PreviousInput_l);
  rtb_OR4 = ((ElacComputer_U.in.bus_inputs.adr_3_bus.mach.SSM == static_cast<uint32_T>(SignStatusMatrix::FailureWarning))
             || (ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || rtb_NOT_h || ElacComputer_DWork.Memory_PreviousInput_lo);
  rtb_doubleAdrFault = (rtb_OR3 && rtb_OR4);
  rtb_doubleAdrFault = ((rtb_OR1 && rtb_OR3) || rtb_doubleAdrFault || rtb_doubleAdrFault);
  rtb_tripleAdrFault = (rtb_OR1 && rtb_OR3 && rtb_OR4);
  rtb_AND3 = (rtb_AND3 || rtb_AND2_p || rtb_NOT_h);
  rtb_AND2_p = ((ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_angle_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.roll_angle_deg.SSM == static_cast<uint32_T>
    (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.body_yaw_rate_deg_s.SSM ==
    static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                (ElacComputer_U.in.bus_inputs.ir_2_bus.body_long_accel_g.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.body_lat_accel_g.SSM == static_cast<uint32_T>
    (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.body_normal_accel_g.SSM ==
    static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                (ElacComputer_U.in.bus_inputs.ir_2_bus.pitch_att_rate_deg_s.SSM == static_cast<uint32_T>
                 (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_2_bus.roll_att_rate_deg_s.SSM ==
    static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) || ElacComputer_P.Constant_Value_j);
  rtb_OR7 = ((ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM == static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (ElacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM == static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM ==
              static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
             (ElacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.SSM == static_cast<uint32_T>
              (SignStatusMatrix::FailureWarning)) || ElacComputer_P.Constant_Value_j);
  rtb_doubleIrFault = (rtb_AND2_p && rtb_OR7);
  rtb_AND2_p = (((ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.SSM == static_cast<uint32_T>
    (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.SSM ==
    static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                 (ElacComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.SSM == static_cast<uint32_T>
    (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.SSM ==
    static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                 (ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.SSM == static_cast<uint32_T>
                  (SignStatusMatrix::FailureWarning)) || (ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.SSM ==
    static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) || ElacComputer_P.Constant_Value_j) && rtb_AND2_p);
  rtb_doubleIrFault = (rtb_AND2_p || rtb_doubleIrFault || rtb_doubleIrFault);
  rtb_OR7 = (rtb_AND2_p && rtb_OR7);
  rtb_NOT_h = !rtb_OR4;
  rtb_logic_crg1_tracking_mode_on = !rtb_OR3;
  if (rtb_OR1 && rtb_logic_crg1_tracking_mode_on && rtb_NOT_h) {
    rtb_V_ias = (ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
    rtb_V_tas = (ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
    rtb_mach = (ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data + ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data) /
      2.0F;
    rtb_alpha = (ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
  } else if ((!rtb_OR1) && rtb_OR3 && rtb_NOT_h) {
    rtb_V_ias = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
    rtb_V_tas = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
    rtb_mach = (ElacComputer_U.in.bus_inputs.adr_1_bus.mach.Data + ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data) /
      2.0F;
    rtb_alpha = (ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
  } else if (((!rtb_OR1) && rtb_logic_crg1_tracking_mode_on && rtb_NOT_h) || ((!rtb_OR1) &&
              rtb_logic_crg1_tracking_mode_on && rtb_OR4)) {
    rtb_V_ias = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_computed_kn.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data) / 2.0F;
    rtb_V_tas = (ElacComputer_U.in.bus_inputs.adr_1_bus.airspeed_true_kn.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data) / 2.0F;
    rtb_mach = (ElacComputer_U.in.bus_inputs.adr_1_bus.mach.Data + ElacComputer_U.in.bus_inputs.adr_3_bus.mach.Data) /
      2.0F;
    rtb_alpha = (ElacComputer_U.in.bus_inputs.adr_1_bus.aoa_corrected_deg.Data +
                 ElacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data) / 2.0F;
  } else {
    rtb_V_ias = 0.0F;
    rtb_V_tas = 0.0F;
    rtb_mach = 0.0F;
    rtb_alpha = 0.0F;
  }

  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_ias_kn = rtb_V_tas;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn = rtb_mach;
  rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_alpha_deg = rtb_alpha;
  rtb_Y_h_tmp_tmp = ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  rtb_DataTypeConversion5_tmp_tmp = ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  rtb_xi_deg_m = ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  rtb_OR1 = rtb_AND3;
  ElacComputer_MATLABFunction_d(std::abs(ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data -
    ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) > ElacComputer_P.CompareToConstant_const_l,
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge_jm, ElacComputer_P.ConfirmNode_timeDelay,
    &rtb_AND2_p, &ElacComputer_DWork.sf_MATLABFunction_jz);
  rtb_AND3 = (rtb_tripleAdrFault || (rtb_doubleAdrFault && rtb_AND3));
  ElacComputer_MATLABFunction_d((ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data > 50.0F) &&
    (ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
    NormalOperation)) && (rtb_V_tas > 200.0F) && rtb_AND3, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode2_isRisingEdge_g, ElacComputer_P.ConfirmNode2_timeDelay, &rtb_NOT,
    &ElacComputer_DWork.sf_MATLABFunction_l);
  ElacComputer_MATLABFunction_d((ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data > 50.0F) &&
    (ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
    NormalOperation)) && (rtb_V_tas > 200.0F) && rtb_AND3, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode1_isRisingEdge_a, ElacComputer_P.ConfirmNode1_timeDelay, &rtb_NOT_h,
    &ElacComputer_DWork.sf_MATLABFunction_jl);
  ElacComputer_DWork.ra1CoherenceRejected = (rtb_NOT || ElacComputer_DWork.ra1CoherenceRejected);
  ElacComputer_DWork.ra2CoherenceRejected = (rtb_NOT_h || ElacComputer_DWork.ra2CoherenceRejected);
  rtb_OR3 = ((ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || ElacComputer_DWork.ra1CoherenceRejected);
  rtb_OR4 = ((ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.SSM == static_cast<uint32_T>(SignStatusMatrix::
    FailureWarning)) || ElacComputer_DWork.ra2CoherenceRejected);
  rtb_NOT_h = !rtb_OR4;
  rtb_logic_crg1_tracking_mode_on = !rtb_OR3;
  if (rtb_logic_crg1_tracking_mode_on && rtb_NOT_h) {
    if (rtb_AND2_p) {
      rtb_raComputationValue = std::fmin(ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data,
        ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data);
    } else {
      rtb_raComputationValue = (ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data +
        ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data) / 2.0F;
    }
  } else if ((rtb_OR3 && rtb_NOT_h) || (rtb_logic_crg1_tracking_mode_on && rtb_OR4)) {
    if ((rtb_V_tas > 180.0F) && rtb_AND3) {
      rtb_raComputationValue = 250.0F;
    } else if (rtb_OR4) {
      rtb_raComputationValue = ElacComputer_U.in.bus_inputs.ra_1_bus.radio_height_ft.Data;
    } else {
      rtb_raComputationValue = ElacComputer_U.in.bus_inputs.ra_2_bus.radio_height_ft.Data;
    }
  } else {
    rtb_raComputationValue = 250.0F;
  }

  rtb_AND3 = (ElacComputer_U.in.discrete_inputs.lgciu_1_left_main_gear_pressed ||
              ElacComputer_U.in.discrete_inputs.lgciu_2_left_main_gear_pressed);
  rtb_AND2_p = (ElacComputer_U.in.discrete_inputs.lgciu_1_right_main_gear_pressed ||
                ElacComputer_U.in.discrete_inputs.lgciu_2_right_main_gear_pressed);
  if (ElacComputer_DWork.is_active_c8_ElacComputer == 0U) {
    ElacComputer_DWork.is_active_c8_ElacComputer = 1U;
    ElacComputer_DWork.is_c8_ElacComputer = ElacComputer_IN_OnGround;
    rtb_on_ground = true;
  } else if (ElacComputer_DWork.is_c8_ElacComputer == ElacComputer_IN_InAir) {
    if ((static_cast<real_T>(rtb_AND3) > 0.1) || (static_cast<real_T>(rtb_AND2_p) > 0.1)) {
      ElacComputer_DWork.is_c8_ElacComputer = ElacComputer_IN_OnGround;
      rtb_on_ground = true;
    } else {
      rtb_on_ground = false;
    }
  } else if ((!rtb_AND3) && (!rtb_AND2_p)) {
    ElacComputer_DWork.is_c8_ElacComputer = ElacComputer_IN_InAir;
    rtb_on_ground = false;
  } else {
    rtb_on_ground = true;
  }

  ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.yellow_hyd_pressure_psi,
    ElacComputer_P.HysteresisNode2_highTrigger, ElacComputer_P.HysteresisNode2_lowTrigger, &rtb_NOT,
    &ElacComputer_DWork.sf_MATLABFunction_jg);
  ElacComputer_MATLABFunction_d((!ElacComputer_U.in.discrete_inputs.yellow_low_pressure) && rtb_NOT,
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge_k, ElacComputer_P.ConfirmNode_timeDelay_n,
    &rtb_AND3, &ElacComputer_DWork.sf_MATLABFunction_c);
  ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.blue_hyd_pressure_psi,
    ElacComputer_P.HysteresisNode1_highTrigger, ElacComputer_P.HysteresisNode1_lowTrigger, &rtb_NOT,
    &ElacComputer_DWork.sf_MATLABFunction_mi);
  ElacComputer_MATLABFunction_d((!ElacComputer_U.in.discrete_inputs.blue_low_pressure) && rtb_NOT,
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode1_isRisingEdge_i, ElacComputer_P.ConfirmNode1_timeDelay_h,
    &rtb_AND2_p, &ElacComputer_DWork.sf_MATLABFunction_g2);
  rtb_NOT_h = !ElacComputer_U.in.discrete_inputs.green_low_pressure;
  ElacComputer_MATLABFunction_m(ElacComputer_U.in.analog_inputs.green_hyd_pressure_psi,
    ElacComputer_P.HysteresisNode3_highTrigger, ElacComputer_P.HysteresisNode3_lowTrigger, &rtb_NOT,
    &ElacComputer_DWork.sf_MATLABFunction_br);
  ElacComputer_MATLABFunction_d(rtb_NOT_h && rtb_NOT, ElacComputer_U.in.time.dt,
    ElacComputer_P.ConfirmNode2_isRisingEdge_j3, ElacComputer_P.ConfirmNode2_timeDelay_k, &rtb_NOT,
    &ElacComputer_DWork.sf_MATLABFunction_gfx);
  rtb_logic_crg1_is_green_hydraulic_power_avail = rtb_NOT;
  ElacComputer_MATLABFunction_g(ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed,
    ElacComputer_P.PulseNode_isRisingEdge, &rtb_NOT_h, &ElacComputer_DWork.sf_MATLABFunction_g4b);
  ElacComputer_MATLABFunction_g(ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed,
    ElacComputer_P.PulseNode1_isRisingEdge, &rtb_NOT, &ElacComputer_DWork.sf_MATLABFunction_nu);
  if (rtb_NOT_h) {
    ElacComputer_DWork.pRightStickDisabled = true;
    ElacComputer_DWork.pLeftStickDisabled = false;
  } else if (rtb_NOT) {
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

  ElacComputer_MATLABFunction_d(ElacComputer_DWork.pLeftStickDisabled &&
    (ElacComputer_U.in.discrete_inputs.fo_priority_takeover_pressed || ElacComputer_DWork.Delay_DSTATE),
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode1_isRisingEdge_k, ElacComputer_P.ConfirmNode1_timeDelay_a,
    &ElacComputer_DWork.Delay_DSTATE, &ElacComputer_DWork.sf_MATLABFunction_j2);
  ElacComputer_MATLABFunction_d(ElacComputer_DWork.pRightStickDisabled &&
    (ElacComputer_U.in.discrete_inputs.capt_priority_takeover_pressed || ElacComputer_DWork.Delay1_DSTATE),
    ElacComputer_U.in.time.dt, ElacComputer_P.ConfirmNode_isRisingEdge_jw, ElacComputer_P.ConfirmNode_timeDelay_a,
    &ElacComputer_DWork.Delay1_DSTATE, &ElacComputer_DWork.sf_MATLABFunction_g24);
  if (ElacComputer_DWork.pLeftStickDisabled) {
    rtb_Y_f = ElacComputer_P.Constant1_Value_p;
  } else {
    rtb_Y_f = ElacComputer_U.in.analog_inputs.capt_roll_stick_pos;
  }

  if (!ElacComputer_DWork.pRightStickDisabled) {
    u0 = ElacComputer_U.in.analog_inputs.fo_roll_stick_pos;
  } else {
    u0 = ElacComputer_P.Constant1_Value_p;
  }

  rtb_DataTypeConversion3 = u0 + rtb_Y_f;
  if (rtb_DataTypeConversion3 > ElacComputer_P.Saturation1_UpperSat) {
    rtb_DataTypeConversion3 = ElacComputer_P.Saturation1_UpperSat;
  } else if (rtb_DataTypeConversion3 < ElacComputer_P.Saturation1_LowerSat) {
    rtb_DataTypeConversion3 = ElacComputer_P.Saturation1_LowerSat;
  }

  if (ElacComputer_U.in.discrete_inputs.is_unit_1) {
    rtb_NOT = ((!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_AND2_p);
    rtb_rightElevatorAvail = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_AND2_p);
    rtb_NOT_h = rtb_AND2_p;
  } else {
    rtb_NOT = ((!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) && rtb_logic_crg1_is_green_hydraulic_power_avail);
    rtb_rightElevatorAvail = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) && rtb_AND3);
    rtb_NOT_h = ((rtb_AND3 && rtb_logic_crg1_is_green_hydraulic_power_avail) || ((!rtb_AND2_p) &&
      (rtb_logic_crg1_is_green_hydraulic_power_avail || rtb_AND3)));
  }

  canEngageInPitch_tmp = !ElacComputer_U.in.discrete_inputs.ths_motor_fault;
  canEngageInPitch = ((!ElacComputer_U.in.discrete_inputs.r_elev_servo_failed) &&
                      (!ElacComputer_U.in.discrete_inputs.l_elev_servo_failed) && canEngageInPitch_tmp && rtb_NOT_h);
  rtb_leftAileronCrossCommandActive = !ElacComputer_U.in.discrete_inputs.is_unit_1;
  hasPriorityInPitch = (rtb_leftAileronCrossCommandActive || ElacComputer_U.in.discrete_inputs.opp_axis_pitch_failure);
  rtb_isEngagedInPitch = (canEngageInPitch && hasPriorityInPitch);
  if (ElacComputer_U.in.discrete_inputs.is_unit_1) {
    leftAileronAvail = ((!ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) && rtb_AND2_p);
    rightAileronAvail = ((!ElacComputer_U.in.discrete_inputs.r_ail_servo_failed) &&
                         rtb_logic_crg1_is_green_hydraulic_power_avail);
  } else {
    leftAileronAvail = ((!ElacComputer_U.in.discrete_inputs.l_ail_servo_failed) &&
                        rtb_logic_crg1_is_green_hydraulic_power_avail);
    rightAileronAvail = ((!ElacComputer_U.in.discrete_inputs.r_ail_servo_failed) && rtb_AND2_p);
  }

  canEngageInRoll = (leftAileronAvail || rightAileronAvail);
  hasPriorityInRoll = (ElacComputer_U.in.discrete_inputs.is_unit_1 ||
                       (ElacComputer_U.in.discrete_inputs.opp_left_aileron_lost &&
                        ElacComputer_U.in.discrete_inputs.opp_right_aileron_lost));
  rtb_NOT_h = !hasPriorityInRoll;
  if (rtb_leftAileronCrossCommandActive && rtb_NOT_h &&
      (ElacComputer_U.in.bus_inputs.elac_opp_bus.aileron_command_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
        NormalOperation))) {
    rtb_leftAileronCrossCommandActive = (ElacComputer_U.in.discrete_inputs.opp_left_aileron_lost && leftAileronAvail);
    rtb_rightAileronCrossCommandActive = (ElacComputer_U.in.discrete_inputs.opp_right_aileron_lost && rightAileronAvail);
  } else {
    rtb_leftAileronCrossCommandActive = false;
    rtb_rightAileronCrossCommandActive = false;
  }

  rtb_isEngagedInRoll = (canEngageInRoll && hasPriorityInRoll);
  rtb_lateralLawCapability = lateral_efcs_law::NormalLaw;
  if (ElacComputer_U.in.discrete_inputs.fac_1_yaw_control_lost &&
      ElacComputer_U.in.discrete_inputs.fac_2_yaw_control_lost) {
    rtb_lateralLawCapability = lateral_efcs_law::DirectLaw;
  }

  if (rtb_OR7) {
    rtb_pitchLawCapability = pitch_efcs_law::DirectLaw;
  } else {
    rtb_logic_crg1_tracking_mode_on = !rtb_OR1;
    if ((rtb_doubleIrFault && (!ElacComputer_P.Constant_Value_j)) || (rtb_doubleAdrFault && rtb_y_j &&
         rtb_logic_crg1_tracking_mode_on) || (rtb_doubleAdrFault && (!rtb_y_j) && rtb_logic_crg1_tracking_mode_on)) {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw1;
    } else if ((rtb_doubleAdrFault && rtb_OR1) || rtb_tripleAdrFault) {
      rtb_pitchLawCapability = pitch_efcs_law::AlternateLaw2;
    } else {
      rtb_pitchLawCapability = pitch_efcs_law::NormalLaw;
    }
  }

  ElacComputer_MATLABFunction_o(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel_bit, &rtb_y);
  ElacComputer_MATLABFunction_o(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel1_bit, &rtb_Switch15);
  ElacComputer_MATLABFunction_o(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel2_bit, &rtb_DataTypeConversion1);
  ElacComputer_MATLABFunction_o(&ElacComputer_U.in.bus_inputs.elac_opp_bus.discrete_status_word_2,
    ElacComputer_P.BitfromLabel3_bit, &rtb_Switch13);
  if ((rtb_DataTypeConversion1 != 0U) && (rtb_Switch13 == 0U)) {
    rtb_oppElacRollCapability = lateral_efcs_law::NormalLaw;
  } else if ((rtb_DataTypeConversion1 == 0U) && (rtb_Switch13 != 0U)) {
    rtb_oppElacRollCapability = lateral_efcs_law::DirectLaw;
  } else {
    rtb_oppElacRollCapability = lateral_efcs_law::None;
  }

  if (hasPriorityInPitch && rtb_isEngagedInPitch) {
    priorityPitchPitchLawCap = rtb_pitchLawCapability;
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
  } else if ((!rtb_NOT_h) && rtb_isEngagedInRoll) {
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
    } else if ((rtb_oppElacRollCapability != lateral_efcs_law::NormalLaw) && (priorityPitchPitchLawCap == pitch_efcs_law::
                NormalLaw)) {
      priorityPitchPitchLawCap = pitch_efcs_law::AlternateLaw1;
    } else if (priorityPitchPitchLawCap != pitch_efcs_law::NormalLaw) {
      priorityPitchPitchLawCap = rtb_pitchLawCapability;
    } else {
      priorityPitchPitchLawCap = pitch_efcs_law::DirectLaw;
    }
  } else {
    priorityPitchPitchLawCap = pitch_efcs_law::None;
  }

  rtb_logic_crg1_tracking_mode_on = ((!ElacComputer_U.in.discrete_inputs.ap_1_disengaged) ||
    (!ElacComputer_U.in.discrete_inputs.ap_2_disengaged) || ElacComputer_U.in.sim_data.slew_on ||
    ElacComputer_U.in.sim_data.pause_on || ElacComputer_U.in.sim_data.tracking_mode_on_override);
  rtb_logic_crg1_ir_computation_data_n_z_g_tmp_tmp = ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  rtb_logic_crg1_ir_computation_data_theta_dot_deg_s_tmp_tmp =
    ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  rtb_zeta_deg_f = ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  rtb_Y_f = ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  rtb_logic_crg1_ra_computation_data_ft = rtb_raComputationValue;
  rtb_aileronAntidroopActive = (ElacComputer_U.in.discrete_inputs.ground_spoilers_active_1 &&
    ElacComputer_U.in.discrete_inputs.ground_spoilers_active_2 &&
    (ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data < 2.5F) && (rtb_activeLateralLaw == lateral_efcs_law::
    NormalLaw));
  if (!ElacComputer_DWork.pRightStickDisabled) {
    u0 = ElacComputer_U.in.analog_inputs.fo_pitch_stick_pos;
  } else {
    u0 = ElacComputer_P.Constant_Value_p;
  }

  if (ElacComputer_DWork.pLeftStickDisabled) {
    rtb_Y = ElacComputer_P.Constant_Value_p;
  } else {
    rtb_Y = ElacComputer_U.in.analog_inputs.capt_pitch_stick_pos;
  }

  u0 += rtb_Y;
  if (u0 > ElacComputer_P.Saturation_UpperSat_d) {
    u0 = ElacComputer_P.Saturation_UpperSat_d;
  } else if (u0 < ElacComputer_P.Saturation_LowerSat_h) {
    u0 = ElacComputer_P.Saturation_LowerSat_h;
  }

  ElacComputer_Y.out.logic.total_sidestick_roll_command = rtb_DataTypeConversion3;
  rtb_NOT_h = (rtb_logic_crg1_tracking_mode_on || (static_cast<real_T>(rtb_activeLateralLaw) !=
    ElacComputer_P.CompareToConstant_const));
  LawMDLOBJ2.step(&ElacComputer_U.in.time.dt, &rtb_Y_h_tmp_tmp, &rtb_DataTypeConversion5_tmp_tmp, &rtb_xi_deg_m,
                  &rtb_zeta_deg_f, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_ias_kn,
                  &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn,
                  &rtb_logic_crg1_ra_computation_data_ft, &rtb_DataTypeConversion3,
                  &ElacComputer_U.in.analog_inputs.rudder_pedal_pos, &rtb_on_ground, &rtb_NOT_h, (const_cast<boolean_T*>
    (&ElacComputer_BGND)), (const_cast<boolean_T*>(&ElacComputer_BGND)), &rtb_xi_deg, &rtb_zeta_deg);
  LawMDLOBJ1.step(&ElacComputer_U.in.time.dt, &rtb_DataTypeConversion3, &rtb_xi_deg_m, &rtb_zeta_deg_f);
  switch (static_cast<int32_T>(rtb_activeLateralLaw)) {
   case 0:
    rtb_xi_deg_m = rtb_xi_deg;
    break;

   case 1:
    break;

   default:
    rtb_xi_deg_m = ElacComputer_P.Constant_Value_c;
    break;
  }

  ElacComputer_RateLimiter(ElacComputer_P.Constant1_Value, ElacComputer_P.RateLimiterVariableTs2_up,
    ElacComputer_P.RateLimiterVariableTs2_lo, ElacComputer_U.in.time.dt,
    ElacComputer_P.RateLimiterVariableTs2_InitialCondition, &rtb_Y, &ElacComputer_DWork.sf_RateLimiter_c);
  if (rtb_aileronAntidroopActive) {
    rtb_DataTypeConversion3 = ElacComputer_P.Constant4_Value_a;
  } else {
    rtb_DataTypeConversion3 = ElacComputer_P.Constant3_Value;
  }

  ElacComputer_RateLimiter(rtb_DataTypeConversion3, ElacComputer_P.RateLimiterVariableTs3_up,
    ElacComputer_P.RateLimiterVariableTs3_lo, ElacComputer_U.in.time.dt,
    ElacComputer_P.RateLimiterVariableTs3_InitialCondition, &rtb_Y_f, &ElacComputer_DWork.sf_RateLimiter_b);
  rtb_Y += rtb_Y_f;
  if (rtb_leftAileronCrossCommandActive) {
    rtb_DataTypeConversion8 = ElacComputer_U.in.bus_inputs.elac_opp_bus.aileron_command_deg.Data;
  } else {
    rtb_DataTypeConversion8 = ElacComputer_P.Gain_Gain * rtb_xi_deg_m + rtb_Y;
  }

  if (rtb_DataTypeConversion8 > ElacComputer_P.Saturation1_UpperSat_g) {
    rtb_DataTypeConversion8 = ElacComputer_P.Saturation1_UpperSat_g;
  } else if (rtb_DataTypeConversion8 < ElacComputer_P.Saturation1_LowerSat_n) {
    rtb_DataTypeConversion8 = ElacComputer_P.Saturation1_LowerSat_n;
  }

  ElacComputer_RateLimiter(rtb_DataTypeConversion8, ElacComputer_P.RateLimiterVariableTs_up,
    ElacComputer_P.RateLimiterVariableTs_lo, ElacComputer_U.in.time.dt,
    ElacComputer_P.RateLimiterVariableTs_InitialCondition, &rtb_Y_f, &ElacComputer_DWork.sf_RateLimiter);
  if (rtb_rightAileronCrossCommandActive) {
    rtb_DataTypeConversion8 = ElacComputer_U.in.bus_inputs.elac_opp_bus.aileron_command_deg.Data;
  } else {
    rtb_DataTypeConversion8 = rtb_xi_deg_m + rtb_Y;
  }

  if (rtb_DataTypeConversion8 > ElacComputer_P.Saturation2_UpperSat) {
    rtb_DataTypeConversion8 = ElacComputer_P.Saturation2_UpperSat;
  } else if (rtb_DataTypeConversion8 < ElacComputer_P.Saturation2_LowerSat) {
    rtb_DataTypeConversion8 = ElacComputer_P.Saturation2_LowerSat;
  }

  ElacComputer_RateLimiter(rtb_DataTypeConversion8, ElacComputer_P.RateLimiterVariableTs1_up,
    ElacComputer_P.RateLimiterVariableTs1_lo, ElacComputer_U.in.time.dt,
    ElacComputer_P.RateLimiterVariableTs1_InitialCondition, &rtb_Y, &ElacComputer_DWork.sf_RateLimiter_j);
  if (ElacComputer_P.Constant_Value_i) {
    rtb_DataTypeConversion8 = rtb_xi_deg_m;
  } else {
    rtb_DataTypeConversion3 = std::abs(rtb_xi_deg_m) + ElacComputer_P.Bias_Bias;
    if (rtb_DataTypeConversion3 > ElacComputer_P.Saturation_UpperSat) {
      rtb_DataTypeConversion3 = ElacComputer_P.Saturation_UpperSat;
    } else if (rtb_DataTypeConversion3 < ElacComputer_P.Saturation_LowerSat) {
      rtb_DataTypeConversion3 = ElacComputer_P.Saturation_LowerSat;
    }

    if (rtb_xi_deg_m < 0.0) {
      rtb_xi_deg_m = -1.0;
    } else {
      rtb_xi_deg_m = (rtb_xi_deg_m > 0.0);
    }

    rtb_DataTypeConversion8 = rtb_DataTypeConversion3 * rtb_xi_deg_m * ElacComputer_P.Gain2_Gain;
  }

  rtb_xi_deg_m = ElacComputer_P.Gain1_Gain * rtb_DataTypeConversion8;
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

  if ((ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_1_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
        NormalOperation)) && (ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_2_deg.SSM ==
       static_cast<uint32_T>(SignStatusMatrix::NormalOperation))) {
    rtb_y_li = ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_1_deg.Data;
    rtb_tla2 = ElacComputer_U.in.bus_inputs.sec_1_bus.thrust_lever_angle_2_deg.Data;
  } else if ((ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_1_deg.SSM == static_cast<uint32_T>
              (SignStatusMatrix::NormalOperation)) &&
             (ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_2_deg.SSM == static_cast<uint32_T>
              (SignStatusMatrix::NormalOperation))) {
    rtb_y_li = ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_1_deg.Data;
    rtb_tla2 = ElacComputer_U.in.bus_inputs.sec_2_bus.thrust_lever_angle_2_deg.Data;
  } else {
    rtb_y_li = 0.0F;
    rtb_tla2 = 0.0F;
  }

  rtb_DataTypeConversion3 = rtb_y_li;
  rtb_DataTypeConversion8 = rtb_tla2;
  rtb_NOT_h = (rtb_logic_crg1_tracking_mode_on || (static_cast<real_T>(priorityPitchPitchLawCap) !=
    ElacComputer_P.CompareToConstant_const_f));
  LawMDLOBJ5.step(&ElacComputer_U.in.time.dt, &ElacComputer_U.in.time.simulation_time,
                  &rtb_logic_crg1_ir_computation_data_n_z_g_tmp_tmp, &rtb_Y_h_tmp_tmp, &rtb_DataTypeConversion5_tmp_tmp,
                  &rtb_logic_crg1_ir_computation_data_theta_dot_deg_s_tmp_tmp, (const_cast<real_T*>(&ElacComputer_RGND)),
                  (const_cast<real_T*>(&ElacComputer_RGND)), &ElacComputer_U.in.analog_inputs.ths_pos_deg,
                  &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_alpha_deg,
                  &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_ias_kn,
                  &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn,
                  &rtb_logic_crg1_ra_computation_data_ft, (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), &rtb_DataTypeConversion3, &rtb_DataTypeConversion8,
                  &ElacComputer_U.in.sim_data.tailstrike_protection_on, (const_cast<real_T*>(&ElacComputer_RGND)), &u0,
                  &rtb_on_ground, &rtb_NOT_h, (const_cast<boolean_T*>(&ElacComputer_BGND)), (const_cast<boolean_T*>
    (&ElacComputer_BGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (
    const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), &rtb_eta_deg, &rtb_eta_trim_deg);
  rtb_NOT_h = (rtb_logic_crg1_tracking_mode_on || ((static_cast<real_T>(priorityPitchPitchLawCap) !=
    ElacComputer_P.CompareToConstant2_const) && (static_cast<real_T>(priorityPitchPitchLawCap) !=
    ElacComputer_P.CompareToConstant3_const)));
  LawMDLOBJ3.step(&ElacComputer_U.in.time.dt, &rtb_logic_crg1_ir_computation_data_n_z_g_tmp_tmp, &rtb_Y_h_tmp_tmp,
                  &rtb_DataTypeConversion5_tmp_tmp, &rtb_logic_crg1_ir_computation_data_theta_dot_deg_s_tmp_tmp, (
    const_cast<real_T*>(&ElacComputer_RGND)), &ElacComputer_U.in.analog_inputs.ths_pos_deg,
                  &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_8_BusCreator1_V_tas_kn, (const_cast<real_T*>
    (&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), (const_cast<real_T*>(&ElacComputer_RGND)), &u0,
                  &rtb_NOT_h, &rtb_eta_deg_o, &rtb_eta_trim_deg_b);
  LawMDLOBJ4.step(&ElacComputer_U.in.time.dt, &u0, &rtb_DataTypeConversion8, &rtb_DataTypeConversion3);
  switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
   case 0:
    rtb_DataTypeConversion8 = rtb_eta_deg;
    break;

   case 1:
   case 2:
    rtb_DataTypeConversion8 = rtb_eta_deg_o;
    break;

   case 3:
    break;

   default:
    rtb_DataTypeConversion8 = ElacComputer_P.Constant_Value_a;
    break;
  }

  switch (static_cast<int32_T>(priorityPitchPitchLawCap)) {
   case 0:
    rtb_DataTypeConversion3 = rtb_eta_trim_deg;
    break;

   case 1:
   case 2:
    rtb_DataTypeConversion3 = rtb_eta_trim_deg_b;
    break;

   case 3:
    break;

   default:
    rtb_DataTypeConversion3 = ElacComputer_P.Constant_Value_a;
    break;
  }

  ElacComputer_Y.out.analog_outputs.left_elev_pos_order_deg = rtb_DataTypeConversion8;
  ElacComputer_Y.out.analog_outputs.right_elev_pos_order_deg = rtb_DataTypeConversion8;
  ElacComputer_Y.out.analog_outputs.ths_pos_order = rtb_DataTypeConversion3;
  ElacComputer_Y.out.analog_outputs.left_aileron_pos_order = rtb_Y_f;
  ElacComputer_Y.out.analog_outputs.right_aileron_pos_order = rtb_Y;
  ElacComputer_Y.out.data = ElacComputer_U.in;
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
  rtb_NOT_h = (rtb_isEngagedInPitch && rtb_NOT);
  ElacComputer_Y.out.discrete_outputs.left_elevator_damping_mode = rtb_NOT_h;
  ElacComputer_Y.out.discrete_outputs.right_elevator_damping_mode = rtb_NOT_h;
  ElacComputer_Y.out.discrete_outputs.ths_active = (rtb_isEngagedInPitch && canEngageInPitch_tmp);
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
      (ElacComputer_P.Constant2_Value_b);
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
      (ElacComputer_P.Constant3_Value_f);
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
  ElacComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.Data = ElacComputer_P.Gain2_Gain_c *
    static_cast<real32_T>(ElacComputer_U.in.analog_inputs.capt_roll_stick_pos);
  ElacComputer_Y.out.bus_outputs.left_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.Data = ElacComputer_P.Gain3_Gain *
    static_cast<real32_T>(ElacComputer_U.in.analog_inputs.fo_roll_stick_pos);
  ElacComputer_Y.out.bus_outputs.right_sidestick_roll_command_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.rudder_pedal_position_deg.Data = ElacComputer_P.Gain4_Gain * static_cast<real32_T>
    (ElacComputer_U.in.analog_inputs.rudder_pedal_pos);
  ElacComputer_Y.out.bus_outputs.rudder_pedal_position_deg.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  if (((!leftAileronAvail) || (!rightAileronAvail)) && rtb_isEngagedInRoll) {
    if (!leftAileronAvail) {
      ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>(rtb_Y_f);
    } else {
      ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>(rtb_Y);
    }

    ElacComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
  } else {
    ElacComputer_Y.out.bus_outputs.aileron_command_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant5_Value);
    ElacComputer_Y.out.bus_outputs.aileron_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
  }

  if (static_cast<real_T>(rtb_isEngagedInRoll) > ElacComputer_P.Switch12_Threshold) {
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = static_cast<real32_T>(rtb_xi_deg_m);
  } else {
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.Data = static_cast<real32_T>(ElacComputer_P.Constant6_Value);
  }

  if (static_cast<real_T>(rtb_isEngagedInRoll) > ElacComputer_P.Switch13_Threshold) {
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
  } else {
    ElacComputer_Y.out.bus_outputs.roll_spoiler_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
  }

  if (ElacComputer_P.EnumeratedConstant2_Value == rtb_activeLateralLaw) {
    ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant1_Value);
    rtb_y_li = static_cast<real32_T>(rtb_zeta_deg_f);
  } else {
    ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.SSM = static_cast<uint32_T>
      (ElacComputer_P.EnumeratedConstant_Value);
    rtb_y_li = static_cast<real32_T>(ElacComputer_P.Constant7_Value);
  }

  ElacComputer_Y.out.bus_outputs.yaw_damper_command_deg.Data = rtb_y_li;
  rtb_VectorConcatenate[0] = ElacComputer_U.in.discrete_inputs.l_ail_servo_failed;
  rtb_VectorConcatenate[1] = ElacComputer_U.in.discrete_inputs.r_ail_servo_failed;
  rtb_VectorConcatenate[2] = ElacComputer_U.in.discrete_inputs.l_elev_servo_failed;
  rtb_VectorConcatenate[3] = ElacComputer_U.in.discrete_inputs.r_elev_servo_failed;
  rtb_VectorConcatenate[4] = leftAileronAvail;
  rtb_VectorConcatenate[5] = rightAileronAvail;
  rtb_VectorConcatenate[6] = rtb_NOT;
  rtb_VectorConcatenate[7] = rtb_rightElevatorAvail;
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
  ElacComputer_MATLABFunction_c(rtb_VectorConcatenate, &rtb_y_li);
  ElacComputer_Y.out.bus_outputs.discrete_status_word_1.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.discrete_status_word_1.Data = rtb_y_li;
  rtb_VectorConcatenate_a[0] = ((rtb_pitchLawCapability == pitch_efcs_law::NormalLaw) || (rtb_pitchLawCapability ==
    pitch_efcs_law::DirectLaw));
  rtb_VectorConcatenate_a[1] = ((rtb_pitchLawCapability == pitch_efcs_law::AlternateLaw1) || (rtb_pitchLawCapability ==
    pitch_efcs_law::AlternateLaw2) || (rtb_pitchLawCapability == pitch_efcs_law::DirectLaw));
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
  ElacComputer_MATLABFunction_c(rtb_VectorConcatenate_a, &rtb_y_li);
  ElacComputer_Y.out.bus_outputs.discrete_status_word_2.SSM = static_cast<uint32_T>
    (ElacComputer_P.EnumeratedConstant1_Value);
  ElacComputer_Y.out.bus_outputs.discrete_status_word_2.Data = rtb_y_li;
  ElacComputer_Y.out.laws.lateral_law_outputs.left_aileron_command_deg = rtb_Y_f;
  ElacComputer_Y.out.laws.lateral_law_outputs.right_aileron_command_deg = rtb_Y;
  ElacComputer_Y.out.laws.lateral_law_outputs.roll_spoiler_command_deg = rtb_xi_deg_m;
  ElacComputer_Y.out.laws.lateral_law_outputs.yaw_damper_command_deg = rtb_zeta_deg_f;
  ElacComputer_Y.out.laws.pitch_law_outputs.elevator_command_deg = rtb_DataTypeConversion8;
  ElacComputer_Y.out.laws.pitch_law_outputs.ths_command_deg = rtb_DataTypeConversion3;
  ElacComputer_Y.out.logic.on_ground = rtb_on_ground;
  ElacComputer_Y.out.logic.tracking_mode_on = rtb_logic_crg1_tracking_mode_on;
  ElacComputer_Y.out.logic.lateral_law_capability = rtb_lateralLawCapability;
  ElacComputer_Y.out.logic.active_lateral_law = rtb_activeLateralLaw;
  ElacComputer_Y.out.logic.pitch_law_capability = rtb_pitchLawCapability;
  ElacComputer_Y.out.logic.active_pitch_law = priorityPitchPitchLawCap;
  ElacComputer_Y.out.logic.is_engaged_in_pitch = rtb_isEngagedInPitch;
  ElacComputer_Y.out.logic.can_engage_in_pitch = canEngageInPitch;
  ElacComputer_Y.out.logic.has_priority_in_pitch = hasPriorityInPitch;
  ElacComputer_Y.out.logic.left_elevator_avail = rtb_NOT;
  ElacComputer_Y.out.logic.right_elevator_avail = rtb_rightElevatorAvail;
  ElacComputer_Y.out.logic.is_engaged_in_roll = rtb_isEngagedInRoll;
  ElacComputer_Y.out.logic.can_engage_in_roll = canEngageInRoll;
  ElacComputer_Y.out.logic.has_priority_in_roll = hasPriorityInRoll;
  ElacComputer_Y.out.logic.left_aileron_crosscommand_active = rtb_leftAileronCrossCommandActive;
  ElacComputer_Y.out.logic.right_aileron_crosscommand_active = rtb_rightAileronCrossCommandActive;
  ElacComputer_Y.out.logic.left_aileron_avail = leftAileronAvail;
  ElacComputer_Y.out.logic.right_aileron_avail = rightAileronAvail;
  ElacComputer_Y.out.logic.aileron_droop_active = false;
  ElacComputer_Y.out.logic.aileron_antidroop_active = rtb_aileronAntidroopActive;
  ElacComputer_Y.out.logic.is_yellow_hydraulic_power_avail = rtb_AND3;
  ElacComputer_Y.out.logic.is_blue_hydraulic_power_avail = rtb_AND2_p;
  ElacComputer_Y.out.logic.is_green_hydraulic_power_avail = rtb_logic_crg1_is_green_hydraulic_power_avail;
  ElacComputer_Y.out.logic.left_sidestick_disabled = ElacComputer_DWork.pLeftStickDisabled;
  ElacComputer_Y.out.logic.right_sidestick_disabled = ElacComputer_DWork.pRightStickDisabled;
  ElacComputer_Y.out.logic.left_sidestick_priority_locked = ElacComputer_DWork.Delay_DSTATE;
  ElacComputer_Y.out.logic.right_sidestick_priority_locked = ElacComputer_DWork.Delay1_DSTATE;
  ElacComputer_Y.out.logic.total_sidestick_pitch_command = u0;
  ElacComputer_Y.out.logic.double_adr_failure = rtb_doubleAdrFault;
  ElacComputer_Y.out.logic.triple_adr_failure = rtb_tripleAdrFault;
  ElacComputer_Y.out.logic.cas_or_mach_disagree = rtb_OR1;
  ElacComputer_Y.out.logic.alpha_disagree = rtb_y_j;
  ElacComputer_Y.out.logic.double_ir_failure = rtb_doubleIrFault;
  ElacComputer_Y.out.logic.triple_ir_failure = rtb_OR7;
  ElacComputer_Y.out.logic.ir_failure_not_self_detected = ElacComputer_P.Constant_Value_j;
  ElacComputer_Y.out.logic.adr_computation_data.mach = rtb_V_ias;
  ElacComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_tas;
  ElacComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_mach;
  ElacComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_alpha;
  ElacComputer_Y.out.logic.ir_computation_data.theta_deg = ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_angle_deg.Data;
  ElacComputer_Y.out.logic.ir_computation_data.phi_deg = ElacComputer_U.in.bus_inputs.ir_1_bus.roll_angle_deg.Data;
  ElacComputer_Y.out.logic.ir_computation_data.q_deg_s =
    ElacComputer_U.in.bus_inputs.ir_1_bus.body_pitch_rate_deg_s.Data;
  ElacComputer_Y.out.logic.ir_computation_data.r_deg_s = ElacComputer_U.in.bus_inputs.ir_1_bus.body_yaw_rate_deg_s.Data;
  ElacComputer_Y.out.logic.ir_computation_data.n_x_g = ElacComputer_U.in.bus_inputs.ir_1_bus.body_long_accel_g.Data;
  ElacComputer_Y.out.logic.ir_computation_data.n_y_g = ElacComputer_U.in.bus_inputs.ir_1_bus.body_lat_accel_g.Data;
  ElacComputer_Y.out.logic.ir_computation_data.n_z_g = ElacComputer_U.in.bus_inputs.ir_1_bus.body_normal_accel_g.Data;
  ElacComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s =
    ElacComputer_U.in.bus_inputs.ir_1_bus.pitch_att_rate_deg_s.Data;
  ElacComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s =
    ElacComputer_U.in.bus_inputs.ir_1_bus.roll_att_rate_deg_s.Data;
  ElacComputer_Y.out.logic.ra_computation_data_ft = rtb_raComputationValue;
  ElacComputer_Y.out.logic.dual_ra_failure = (rtb_OR3 && rtb_OR4);
}

void ElacComputer::initialize()
{
  ElacComputer_DWork.Memory_PreviousInput = ElacComputer_P.SRFlipFlop2_initial_condition;
  ElacComputer_DWork.Memory_PreviousInput_n = ElacComputer_P.SRFlipFlop1_initial_condition;
  ElacComputer_DWork.Memory_PreviousInput_o = ElacComputer_P.SRFlipFlop_initial_condition;
  ElacComputer_DWork.Memory_PreviousInput_a = ElacComputer_P.SRFlipFlop2_initial_condition_a;
  ElacComputer_DWork.Memory_PreviousInput_p = ElacComputer_P.SRFlipFlop1_initial_condition_j;
  ElacComputer_DWork.Memory_PreviousInput_l = ElacComputer_P.SRFlipFlop_initial_condition_j;
  ElacComputer_DWork.Memory_PreviousInput_h = ElacComputer_P.SRFlipFlop2_initial_condition_o;
  ElacComputer_DWork.Memory_PreviousInput_i = ElacComputer_P.SRFlipFlop1_initial_condition_p;
  ElacComputer_DWork.Memory_PreviousInput_lo = ElacComputer_P.SRFlipFlop_initial_condition_k;
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
