#include "FmgcComputer.h"
#include "FmgcComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look1_iflf_binlxpw.h"
#include "look1_binlxpw.h"
#include "FmgcOuterLoops.h"

void FmgcComputer::FmgcComputer_MATLABFunction(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void FmgcComputer::FmgcComputer_MATLABFunction_j_Reset(rtDW_MATLABFunction_FmgcComputer_k_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void FmgcComputer::FmgcComputer_MATLABFunction_a(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge, real_T
  rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_FmgcComputer_k_T *localDW)
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

void FmgcComputer::FmgcComputer_MATLABFunction_p_Reset(rtDW_MATLABFunction_FmgcComputer_c_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void FmgcComputer::FmgcComputer_MATLABFunction_g(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_FmgcComputer_c_T *localDW)
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

void FmgcComputer::FmgcComputer_MATLABFunction_i(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void FmgcComputer::FmgcComputer_MATLABFunction_ie(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void FmgcComputer::FmgcComputer_MATLABFunction_c(const base_arinc_429 *rtu_u, real32_T *rty_y)
{
  *rty_y = rtu_u->Data;
}

void FmgcComputer::FmgcComputer_LeadLagFilter_Reset(rtDW_LeadLagFilter_FmgcComputer_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FmgcComputer::FmgcComputer_LeadLagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_C2, real_T rtu_C3, real_T rtu_C4,
  real_T rtu_dt, real_T *rty_Y, rtDW_LeadLagFilter_FmgcComputer_T *localDW)
{
  real_T denom;
  real_T denom_tmp;
  real_T tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C4;
  denom = 2.0 * rtu_C3 + denom_tmp;
  tmp = rtu_dt * rtu_C2;
  *rty_Y = ((2.0 * rtu_C1 + tmp) / denom * rtu_U + (tmp - 2.0 * rtu_C1) / denom * localDW->pU) + (2.0 * rtu_C3 -
    denom_tmp) / denom * localDW->pY;
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void FmgcComputer::FmgcComputer_LagFilter_Reset(rtDW_LagFilter_FmgcComputer_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FmgcComputer::FmgcComputer_LagFilter(real32_T rtu_U, real_T rtu_C1, real_T rtu_dt, real32_T *rty_Y,
  rtDW_LagFilter_FmgcComputer_T *localDW)
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

void FmgcComputer::FmgcComputer_MATLABFunction_m(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void FmgcComputer::FmgcComputer_MATLABFunction_d_Reset(rtDW_MATLABFunction_FmgcComputer_f_T *localDW)
{
  localDW->previousInput = false;
  localDW->remainingTriggerTime = 0.0;
}

void FmgcComputer::FmgcComputer_MATLABFunction_m3(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T
  rtp_isRisingEdge, real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_FmgcComputer_f_T *localDW)
{
  if (localDW->remainingTriggerTime > 0.0) {
    localDW->remainingTriggerTime -= rtu_Ts;
  } else if (localDW->remainingTriggerTime < 0.0) {
    localDW->remainingTriggerTime = 0.0;
  }

  if (((rtp_retriggerable != 0.0) || (localDW->remainingTriggerTime == 0.0)) && (((rtp_isRisingEdge != 0.0) && rtu_u &&
        (!localDW->previousInput)) || ((rtp_isRisingEdge == 0.0) && (!rtu_u) && localDW->previousInput))) {
    localDW->remainingTriggerTime = rtp_triggerDuration;
  }

  localDW->previousInput = rtu_u;
  *rty_y = (localDW->remainingTriggerTime > 0.0);
}

void FmgcComputer::FmgcComputer_MATLABFunction_gy(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void FmgcComputer::step()
{
  real_T rtb_Phi_loc_c;
  real_T rtb_Theta_c_deg;
  real_T rtb_Beta_c_deg;
  real_T rtb_Beta_c_deg_e;
  real_T rtb_H_dot_radio_fpm;
  real_T rtb_H_dot_c_fpm;
  real_T rtb_delta_Theta_H_dot_deg;
  real_T rtb_delta_Theta_bz_deg;
  real_T rtb_delta_Theta_bx_deg;
  real_T rtb_delta_Theta_beta_c_deg;
  base_arinc_429 rtb_BusAssignment_b0_logic_ils_computation_data_glideslope_deviation_deg;
  base_arinc_429 rtb_BusAssignment_b_logic_ir_computation_data_heading_true_deg;
  base_arinc_429 rtb_BusAssignment_be_logic_ra_computation_data_radio_height_ft;
  base_arinc_429 rtb_BusAssignment_cp_logic_ra_computation_data_radio_height_ft;
  base_arinc_429 rtb_BusAssignment_dc_logic_adr_computation_data_airspeed_computed_kn;
  base_arinc_429 rtb_BusAssignment_dc_logic_adr_computation_data_corrected_average_static_pressure;
  base_arinc_429 rtb_BusAssignment_dc_logic_chosen_fac_bus_v_3_kn;
  base_arinc_429 rtb_BusAssignment_dc_logic_chosen_fac_bus_v_4_kn;
  base_arinc_429 rtb_BusAssignment_dc_logic_chosen_fac_bus_v_ls_kn;
  base_arinc_429 rtb_BusAssignment_dc_logic_chosen_fac_bus_v_man_kn;
  base_arinc_429 rtb_BusAssignment_dc_logic_chosen_fac_bus_v_max_kn;
  base_arinc_429 rtb_BusAssignment_ds_logic_ir_computation_data_flight_path_angle_deg;
  base_arinc_429 rtb_BusAssignment_ds_logic_ir_computation_data_inertial_vertical_speed_ft_s;
  base_arinc_429 rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg;
  base_arinc_429 rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg;
  base_arinc_429 rtb_BusAssignment_f4_logic_ir_computation_data_heading_magnetic_deg;
  base_arinc_429 rtb_BusAssignment_f_logic_ils_computation_data_runway_heading_deg;
  base_arinc_429 rtb_BusAssignment_fo_logic_chosen_fac_bus_discrete_word_5;
  base_arinc_429 rtb_BusAssignment_gk_logic_adr_computation_data_airspeed_computed_kn;
  base_arinc_429 rtb_BusAssignment_gk_logic_chosen_fac_bus_v_ls_kn;
  base_arinc_429 rtb_BusAssignment_gk_logic_chosen_fac_bus_v_max_kn;
  base_arinc_429 rtb_BusAssignment_gk_logic_ir_computation_data_pitch_angle_deg;
  base_arinc_429 rtb_BusAssignment_gk_logic_ir_computation_data_roll_angle_deg;
  base_arinc_429 rtb_BusAssignment_gt_logic_ir_computation_data_inertial_vertical_speed_ft_s;
  base_arinc_429 rtb_BusAssignment_gt_logic_ra_computation_data_radio_height_ft;
  base_arinc_429 rtb_BusAssignment_hz_logic_ra_computation_data_radio_height_ft;
  base_arinc_429 rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn;
  base_arinc_429 rtb_BusAssignment_i2_logic_chosen_fac_bus_discrete_word_5;
  base_arinc_429 rtb_BusAssignment_i2_logic_chosen_fac_bus_v_max_kn;
  base_arinc_429 rtb_BusAssignment_i_logic_chosen_fac_bus_discrete_word_5;
  base_arinc_429 rtb_BusAssignment_ic_logic_altitude_indicated_ft;
  base_arinc_429 rtb_BusAssignment_j_logic_altitude_indicated_ft;
  base_arinc_429 rtb_BusAssignment_jc_logic_chosen_fac_bus_v_ls_kn;
  base_arinc_429 rtb_BusAssignment_jc_logic_ir_computation_data_body_normal_accel_g;
  base_arinc_429 rtb_BusAssignment_jc_logic_ir_computation_data_ground_speed_kn;
  base_arinc_429 rtb_BusAssignment_jc_logic_ir_computation_data_heading_magnetic_deg;
  base_arinc_429 rtb_BusAssignment_jc_logic_ir_computation_data_inertial_vertical_speed_ft_s;
  base_arinc_429 rtb_BusAssignment_jc_logic_ir_computation_data_pitch_angle_deg;
  base_arinc_429 rtb_BusAssignment_jc_logic_ir_computation_data_roll_angle_deg;
  base_arinc_429 rtb_BusAssignment_jc_logic_ir_computation_data_track_angle_magnetic_deg;
  base_arinc_429 rtb_BusAssignment_jm_logic_chosen_fac_bus_estimated_sideslip_deg;
  base_arinc_429 rtb_BusAssignment_jm_logic_chosen_fac_bus_v_ls_kn;
  base_arinc_429 rtb_BusAssignment_jm_logic_chosen_fac_bus_v_max_kn;
  base_arinc_429 rtb_BusAssignment_jm_logic_ils_computation_data_glideslope_deviation_deg;
  base_arinc_429 rtb_BusAssignment_jm_logic_ir_computation_data_track_angle_magnetic_deg;
  base_arinc_429 rtb_BusAssignment_jm_logic_ra_computation_data_radio_height_ft;
  base_arinc_429 rtb_BusAssignment_kc_logic_adr_computation_data_airspeed_computed_kn;
  base_arinc_429 rtb_BusAssignment_kc_logic_chosen_fac_bus_v_ls_kn;
  base_arinc_429 rtb_BusAssignment_kc_logic_chosen_fac_bus_v_max_kn;
  base_arinc_429 rtb_BusAssignment_ks_logic_altitude_indicated_ft;
  base_arinc_429 rtb_BusAssignment_kv_logic_ils_computation_data_localizer_deviation_deg;
  base_arinc_429 rtb_BusAssignment_kv_logic_ir_computation_data_heading_magnetic_deg;
  base_arinc_429 rtb_BusAssignment_kv_logic_ir_computation_data_roll_angle_deg;
  base_arinc_429 rtb_BusAssignment_lz_logic_chosen_fac_bus_center_of_gravity_pos_percent;
  base_arinc_429 rtb_BusAssignment_lz_logic_chosen_fac_bus_total_weight_lbs;
  base_arinc_429 rtb_BusAssignment_lz_logic_chosen_fac_bus_v_ls_kn;
  base_arinc_429 rtb_BusAssignment_lz_logic_chosen_fac_bus_v_man_kn;
  base_arinc_429 rtb_BusAssignment_lz_logic_chosen_fac_bus_v_max_kn;
  base_arinc_429 rtb_BusAssignment_m_logic_adr_computation_data_vertical_speed_ft_min;
  base_arinc_429 rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5;
  base_arinc_429 rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft;
  base_arinc_429 rtb_BusAssignment_o3_logic_adr_computation_data_airspeed_computed_kn;
  base_arinc_429 rtb_BusAssignment_o3_logic_chosen_fac_bus_v_ls_kn;
  base_arinc_429 rtb_BusAssignment_o3_logic_chosen_fac_bus_v_max_kn;
  base_arinc_429 rtb_BusAssignment_o_logic_ra_computation_data_radio_height_ft;
  base_arinc_429 rtb_BusAssignment_pw_logic_ils_computation_data_runway_heading_deg;
  real_T rtb_Switch_of[2];
  real_T rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target;
  real_T rtb_DataTypeConversion10;
  real_T rtb_DataTypeConversion11;
  real_T rtb_DataTypeConversion12;
  real_T rtb_DataTypeConversion13;
  real_T rtb_DataTypeConversion14;
  real_T rtb_DataTypeConversion15;
  real_T rtb_DataTypeConversion16;
  real_T rtb_DataTypeConversion1_d;
  real_T rtb_DataTypeConversion20;
  real_T rtb_DataTypeConversion21;
  real_T rtb_DataTypeConversion22;
  real_T rtb_DataTypeConversion23;
  real_T rtb_DataTypeConversion24;
  real_T rtb_DataTypeConversion25;
  real_T rtb_DataTypeConversion26;
  real_T rtb_DataTypeConversion27;
  real_T rtb_DataTypeConversion2_i;
  real_T rtb_DataTypeConversion3;
  real_T rtb_DataTypeConversion32;
  real_T rtb_DataTypeConversion39;
  real_T rtb_DataTypeConversion4;
  real_T rtb_DataTypeConversion5;
  real_T rtb_DataTypeConversion6;
  real_T rtb_DataTypeConversion7;
  real_T rtb_DataTypeConversion8;
  real_T rtb_DataTypeConversion9;
  real_T rtb_DataTypeConversion_cm;
  real_T rtb_Gain;
  real_T rtb_Gain1;
  real_T rtb_Gain2;
  real_T rtb_Gain3;
  real_T rtb_Nosewheel_c;
  real_T rtb_Phi_c_deg;
  real_T rtb_Product_p2;
  real_T rtb_Switch1;
  real_T rtb_Switch1_a;
  real_T rtb_Switch3;
  real_T rtb_altCstrOrFcu;
  int32_T absVsTarget;
  int32_T high_i;
  int32_T low_ip1;
  int32_T mid_i;
  real32_T v[3];
  real32_T rtb_Cos_h;
  real32_T rtb_DataTypeConversion2_bh;
  real32_T rtb_DataTypeConversion2_kb;
  real32_T rtb_Gain2_f;
  real32_T rtb_Max_a;
  real32_T rtb_Switch_center_of_gravity_pos_percent_Data;
  real32_T rtb_Switch_discrete_word_5_Data;
  real32_T rtb_Switch_estimated_sideslip_deg_Data;
  real32_T rtb_Switch_i_glideslope_deviation_deg_Data;
  real32_T rtb_Switch_i_runway_heading_deg_Data;
  real32_T rtb_Switch_total_weight_lbs_Data;
  real32_T rtb_Switch_v_3_kn_Data;
  real32_T rtb_Switch_v_4_kn_Data;
  real32_T rtb_Switch_v_ls_kn_Data;
  real32_T rtb_Switch_v_man_kn_Data;
  real32_T rtb_Switch_v_max_kn_Data;
  real32_T rtb_adrComputationBus_airspeed_computed_kn_Data;
  real32_T rtb_adrComputationBus_airspeed_true_kn_Data;
  real32_T rtb_adrComputationBus_altitude_corrected_1_ft_Data;
  real32_T rtb_adrComputationBus_altitude_corrected_2_ft_Data;
  real32_T rtb_adrComputationBus_altitude_standard_ft_Data;
  real32_T rtb_adrComputationBus_aoa_corrected_deg_Data;
  real32_T rtb_adrComputationBus_corrected_average_static_pressure_Data;
  real32_T rtb_adrComputationBus_mach_Data;
  real32_T rtb_adrComputationBus_vertical_speed_ft_min_Data;
  real32_T rtb_irComputationBus_body_lat_accel_g_Data;
  real32_T rtb_irComputationBus_body_long_accel_g_Data;
  real32_T rtb_irComputationBus_body_normal_accel_g_Data;
  real32_T rtb_irComputationBus_body_roll_rate_deg_s_Data;
  real32_T rtb_irComputationBus_body_yaw_rate_deg_s_Data;
  real32_T rtb_irComputationBus_flight_path_angle_deg_Data;
  real32_T rtb_irComputationBus_heading_magnetic_deg_Data;
  real32_T rtb_irComputationBus_heading_true_deg_Data;
  real32_T rtb_irComputationBus_inertial_vertical_speed_ft_s_Data;
  real32_T rtb_irComputationBus_pitch_angle_deg_Data;
  real32_T rtb_irComputationBus_pitch_att_rate_deg_s_Data;
  real32_T rtb_irComputationBus_roll_angle_deg_Data;
  real32_T rtb_irComputationBus_track_angle_true_deg_Data;
  real32_T rtb_raComputationData_radio_height_ft_Data;
  real32_T rtb_y_bf;
  real32_T rtb_y_gtq;
  real32_T rtb_y_ia;
  real32_T rtb_y_o;
  real32_T rtb_y_p3;
  real32_T rtb_y_pv;
  uint32_T rtb_DataTypeConversion1_e;
  uint32_T rtb_DataTypeConversion1_j;
  uint32_T rtb_Switch9;
  uint32_T rtb_Switch_center_of_gravity_pos_percent_SSM;
  uint32_T rtb_Switch_discrete_word_5_SSM;
  uint32_T rtb_Switch_estimated_sideslip_deg_SSM;
  uint32_T rtb_Switch_i_glideslope_deviation_deg_SSM;
  uint32_T rtb_Switch_total_weight_lbs_SSM;
  uint32_T rtb_Switch_v_3_kn_SSM;
  uint32_T rtb_Switch_v_4_kn_SSM;
  uint32_T rtb_Switch_v_ls_kn_SSM;
  uint32_T rtb_Switch_v_man_kn_SSM;
  uint32_T rtb_Switch_v_max_kn_SSM;
  uint32_T rtb_adrComputationBus_airspeed_computed_kn_SSM;
  uint32_T rtb_adrComputationBus_altitude_corrected_1_ft_SSM;
  uint32_T rtb_adrComputationBus_altitude_corrected_2_ft_SSM;
  uint32_T rtb_adrComputationBus_altitude_standard_ft_SSM;
  uint32_T rtb_adrComputationBus_corrected_average_static_pressure_SSM;
  uint32_T rtb_adrComputationBus_mach_SSM;
  uint32_T rtb_adrComputationBus_vertical_speed_ft_min_SSM;
  uint32_T rtb_fm_weight_lbs_SSM;
  uint32_T rtb_irComputationBus_flight_path_angle_deg_SSM;
  uint32_T rtb_irComputationBus_heading_magnetic_deg_SSM;
  uint32_T rtb_irComputationBus_heading_true_deg_SSM;
  uint32_T rtb_irComputationBus_inertial_vertical_speed_ft_s_SSM;
  uint32_T rtb_irComputationBus_pitch_angle_deg_SSM;
  uint32_T rtb_irComputationBus_roll_angle_deg_SSM;
  uint32_T rtb_irComputationBus_track_angle_magnetic_deg_SSM;
  uint32_T rtb_raComputationData_radio_height_ft_SSM;
  uint32_T rtb_y;
  uint32_T rtb_y_jm;
  int8_T rtb_handleIndex;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_bw[19];
  boolean_T rtb_VectorConcatenate_f[19];
  boolean_T rtb_Logic_a2[2];
  boolean_T rtb_Logic_ac[2];
  boolean_T rtb_Logic_b[2];
  boolean_T rtb_Logic_hq[2];
  boolean_T apCondition;
  boolean_T fdOppOff;
  boolean_T fdOwnOff;
  boolean_T raOppInvalid;
  boolean_T raOwnInvalid;
  boolean_T rtb_AND10_b;
  boolean_T rtb_AND10_k;
  boolean_T rtb_AND12;
  boolean_T rtb_AND1_c0;
  boolean_T rtb_AND8;
  boolean_T rtb_AND_j;
  boolean_T rtb_BusAssignment_b_logic_ils_tune_inhibit;
  boolean_T rtb_BusAssignment_gk_logic_ap_fd_common_condition;
  boolean_T rtb_BusAssignment_h_logic_engine_running;
  boolean_T rtb_BusAssignment_h_logic_fcu_failure;
  boolean_T rtb_BusAssignment_h_logic_one_engine_out;
  boolean_T rtb_BusAssignment_hk_ap_fd_logic_longi_large_box_tcas;
  boolean_T rtb_BusAssignment_hk_ap_fd_logic_trk_fpa_deselected;
  boolean_T rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset;
  boolean_T rtb_BusAssignment_n_logic_fac_speeds_failure;
  boolean_T rtb_BusAssignment_n_logic_fac_weights_failure;
  boolean_T rtb_BusAssignment_o_logic_both_ils_valid;
  boolean_T rtb_BusAssignment_o_logic_ils_failure;
  boolean_T rtb_Compare_bb;
  boolean_T rtb_Compare_bj;
  boolean_T rtb_Compare_d0;
  boolean_T rtb_Compare_gc;
  boolean_T rtb_Compare_kg;
  boolean_T rtb_Compare_ov;
  boolean_T rtb_GreaterThan3;
  boolean_T rtb_GreaterThan3_e;
  boolean_T rtb_NOT1_i;
  boolean_T rtb_NOT3;
  boolean_T rtb_NOT_b;
  boolean_T rtb_NOT_oj;
  boolean_T rtb_OR1_j;
  boolean_T rtb_OR2_l;
  boolean_T rtb_OR_i;
  boolean_T rtb_OR_iw;
  boolean_T rtb_TmpSignalConversionAtSFunctionInport3_idx_0;
  boolean_T rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
  boolean_T rtb_TmpSignalConversionAtSFunctionInport3_idx_2;
  boolean_T rtb_adr3Invalid;
  boolean_T rtb_adrOppInvalid;
  boolean_T rtb_adrOwnInvalid;
  boolean_T rtb_ap_inop_tmp;
  boolean_T rtb_ap_inop_tmp_tmp;
  boolean_T rtb_appCapability_idx_2;
  boolean_T rtb_appInop_idx_1;
  boolean_T rtb_appInop_idx_2;
  boolean_T rtb_doubleAdrFault;
  boolean_T rtb_ir3Invalid;
  boolean_T rtb_irOwnInvalid;
  boolean_T rtb_y_c1;
  boolean_T rtb_y_eu;
  boolean_T rtb_y_ft;
  boolean_T rtb_y_g;
  boolean_T rtb_y_g3;
  boolean_T rtb_y_gb;
  boolean_T rtb_y_if;
  boolean_T rtb_y_ja;
  boolean_T rtb_y_jt;
  boolean_T rtb_y_ju;
  boolean_T rtb_y_kr;
  boolean_T rtb_y_l1;
  boolean_T rtb_y_lh_0;
  boolean_T rtb_y_mi;
  boolean_T rtb_y_n;
  boolean_T rtb_y_nn;
  boolean_T rtb_y_ov;
  boolean_T rtb_y_pf;
  athr_fma_message rtb_y_ip;
  athr_fma_mode rtb_y_fn;
  lateral_law rtb_active_lateral_law;
  tcas_submode rtb_mode;
  vertical_law rtb_active_longitudinal_law;
  static const int16_T b[7]{ 0, 1000, 3333, 4000, 6000, 8000, 10000 };

  static const real_T c[24]{ -3.7631613045100394E-12, -3.7631613045100418E-12, 6.2076488130688133E-12,
    2.3375903616618146E-12, -2.9675180723323623E-12, -2.9675180723323619E-12, 2.2735910872868498E-8,
    1.1446426959338374E-8, -1.4891939010927404E-8, -2.4704337359767112E-9, 1.1555108433994175E-8, -6.25E-9,
    -1.897274956835846E-5, 1.520958826384842E-5, 7.1712086474912069E-6, -4.4094939746938354E-6, 1.3759855421341094E-5,
    2.4370072289329445E-5, 0.05, 0.05, 0.1, 0.1, 0.1, 0.15 };

  const base_arinc_429 *rtb_Switch2_o_0;
  boolean_T Memory_PreviousInput_d_tmp;
  boolean_T Memory_PreviousInput_d_tmp_tmp;
  boolean_T Memory_PreviousInput_k_tmp_tmp;
  boolean_T Memory_PreviousInput_k_tmp_tmp_tmp;
  boolean_T Memory_PreviousInput_l_tmp;
  boolean_T Memory_PreviousInput_l_tmp_0;
  boolean_T absVsTarget_tmp;
  boolean_T absVsTarget_tmp_tmp;
  boolean_T guard1;
  boolean_T rtb_AND1_c_tmp;
  boolean_T rtb_GreaterThan3_tmp;
  boolean_T rtb_NOT3_tmp;
  boolean_T rtb_NOT3_tmp_0;
  boolean_T rtb_NOT_g_tmp;
  boolean_T rtb_OR2_l_tmp;
  boolean_T rtb_OR2_l_tmp_0;
  boolean_T rtb_OR2_l_tmp_1;
  boolean_T rtb_y_eg_tmp;
  if (FmgcComputer_U.in.sim_data.computer_running) {
    if (!FmgcComputer_DWork.Runtime_MODE) {
      FmgcComputer_DWork.Delay_DSTATE = FmgcComputer_P.Delay_InitialCondition;
      FmgcComputer_DWork.Delay_DSTATE_p = FmgcComputer_P.Delay_InitialCondition_g;
      FmgcComputer_DWork.Memory_PreviousInput = FmgcComputer_P.SRFlipFlop1_initial_condition;
      FmgcComputer_DWork.Memory_PreviousInput_g = FmgcComputer_P.SRFlipFlop_initial_condition;
      FmgcComputer_DWork.Memory_PreviousInput_g1 = FmgcComputer_P.SRFlipFlop1_initial_condition_n;
      FmgcComputer_DWork.Delay_DSTATE_k = FmgcComputer_P.Delay_InitialCondition_gu;
      FmgcComputer_DWork.Memory_PreviousInput_p = FmgcComputer_P.SRFlipFlop_initial_condition_b;
      FmgcComputer_DWork.Delay_DSTATE_o = FmgcComputer_P.Delay_InitialCondition_n;
      FmgcComputer_DWork.Memory_PreviousInput_e = FmgcComputer_P.SRFlipFlop_initial_condition_a;
      FmgcComputer_DWork.Memory_PreviousInput_k = FmgcComputer_P.SRFlipFlop_initial_condition_h;
      FmgcComputer_DWork.Memory_PreviousInput_c = FmgcComputer_P.SRFlipFlop_initial_condition_i;
      FmgcComputer_DWork.Memory_PreviousInput_b = FmgcComputer_P.SRFlipFlop_initial_condition_c;
      FmgcComputer_DWork.Memory_PreviousInput_l = FmgcComputer_P.SRFlipFlop_initial_condition_d;
      FmgcComputer_DWork.Memory_PreviousInput_d = FmgcComputer_P.SRFlipFlop_initial_condition_iz;
      FmgcComputer_DWork.Memory_PreviousInput_m = FmgcComputer_P.SRFlipFlop_initial_condition_m;
      FmgcComputer_DWork.Delay2_DSTATE = FmgcComputer_P.Delay2_InitialCondition;
      FmgcComputer_DWork.Memory_PreviousInput_bc = FmgcComputer_P.SRFlipFlop_initial_condition_p;
      FmgcComputer_DWork.Memory_PreviousInput_dv = FmgcComputer_P.SRFlipFlop_initial_condition_l;
      FmgcComputer_DWork.Memory_PreviousInput_f = FmgcComputer_P.SRFlipFlop_initial_condition_j;
      FmgcComputer_DWork.Memory_PreviousInput_i = FmgcComputer_P.SRFlipFlop_initial_condition_h5;
      FmgcComputer_DWork.Memory_PreviousInput_el = FmgcComputer_P.SRFlipFlop_initial_condition_e;
      FmgcComputer_DWork.Memory_PreviousInput_f2 = FmgcComputer_P.SRFlipFlop_initial_condition_cs;
      FmgcComputer_DWork.Memory_PreviousInput_i1 = FmgcComputer_P.SRFlipFlop_initial_condition_o;
      FmgcComputer_DWork.Memory_PreviousInput_ip = FmgcComputer_P.SRFlipFlop_initial_condition_g;
      FmgcComputer_DWork.Memory_PreviousInput_a = FmgcComputer_P.SRFlipFlop_initial_condition_n;
      FmgcComputer_DWork.Memory_PreviousInput_cv = FmgcComputer_P.SRFlipFlop_initial_condition_of;
      FmgcComputer_DWork.Memory_PreviousInput_lq = FmgcComputer_P.SRFlipFlop_initial_condition_on;
      FmgcComputer_DWork.Memory_PreviousInput_n = FmgcComputer_P.SRFlipFlop1_initial_condition_b;
      FmgcComputer_DWork.Memory_PreviousInput_ne = FmgcComputer_P.SRFlipFlop_initial_condition_ja;
      FmgcComputer_DWork.Memory_PreviousInput_cb = FmgcComputer_P.SRFlipFlop_initial_condition_li;
      FmgcComputer_DWork.Memory_PreviousInput_no = FmgcComputer_P.SRFlipFlop1_initial_condition_l;
      FmgcComputer_DWork.Memory_PreviousInput_fg = FmgcComputer_P.SRFlipFlop1_initial_condition_i;
      FmgcComputer_DWork.Memory_PreviousInput_ma = FmgcComputer_P.SRFlipFlop_initial_condition_be;
      FmgcComputer_DWork.DelayInput1_DSTATE = FmgcComputer_P.DetectChange_vinit;
      FmgcComputer_DWork.Memory_PreviousInput_ec = FmgcComputer_P.SRFlipFlop_initial_condition_jv;
      FmgcComputer_DWork.Memory_PreviousInput_nt = FmgcComputer_P.SRFlipFlop_initial_condition_p4;
      FmgcComputer_DWork.DelayInput1_DSTATE_n = FmgcComputer_P.DetectChange_vinit_p;
      FmgcComputer_DWork.Memory_PreviousInput_b3 = FmgcComputer_P.SRFlipFlop_initial_condition_lz;
      FmgcComputer_DWork.Memory_PreviousInput_ae = FmgcComputer_P.SRFlipFlop_initial_condition_oz;
      FmgcComputer_DWork.Memory_PreviousInput_ev = FmgcComputer_P.SRFlipFlop_initial_condition_pr;
      FmgcComputer_DWork.Memory_PreviousInput_mx = FmgcComputer_P.SRFlipFlop_initial_condition_eb;
      FmgcComputer_DWork.Memory_PreviousInput_o = FmgcComputer_P.SRFlipFlop_initial_condition_jw;
      FmgcComputer_DWork.Memory_PreviousInput_fm = FmgcComputer_P.SRFlipFlop_initial_condition_ce;
      FmgcComputer_DWork.DelayInput1_DSTATE_b = FmgcComputer_P.DetectDecrease_vinit;
      FmgcComputer_DWork.Memory_PreviousInput_nu = FmgcComputer_P.SRFlipFlop_initial_condition_hs;
      FmgcComputer_DWork.Memory_PreviousInput_as = FmgcComputer_P.SRFlipFlop_initial_condition_dp;
      FmgcComputer_DWork.Memory_PreviousInput_n0 = FmgcComputer_P.SRFlipFlop1_initial_condition_c;
      FmgcComputer_DWork.Memory_PreviousInput_i5 = FmgcComputer_P.SRFlipFlop_initial_condition_ia;
      FmgcComputer_DWork.Memory_PreviousInput_h = FmgcComputer_P.SRFlipFlop1_initial_condition_o;
      FmgcComputer_DWork.Memory_PreviousInput_cp = FmgcComputer_P.SRFlipFlop2_initial_condition;
      FmgcComputer_DWork.Memory_PreviousInput_bw = FmgcComputer_P.SRFlipFlop_initial_condition_at;
      FmgcComputer_DWork.Delay_DSTATE_fe = FmgcComputer_P.Delay_InitialCondition_d;
      FmgcComputer_DWork.Memory_PreviousInput_cu = FmgcComputer_P.SRFlipFlop1_initial_condition_on;
      FmgcComputer_DWork.Memory_PreviousInput_hk = FmgcComputer_P.SRFlipFlop_initial_condition_n1;
      FmgcComputer_DWork.Delay_DSTATE_c = FmgcComputer_P.Delay_InitialCondition_a;
      FmgcComputer_DWork.Memory_PreviousInput_bo = FmgcComputer_P.SRFlipFlop_initial_condition_e5;
      FmgcComputer_DWork.Memory_PreviousInput_ak = FmgcComputer_P.SRFlipFlop_initial_condition_er;
      FmgcComputer_DWork.Memory_PreviousInput_j = FmgcComputer_P.SRFlipFlop1_initial_condition_d;
      FmgcComputer_DWork.Memory_PreviousInput_hu = FmgcComputer_P.SRFlipFlop_initial_condition_nm;
      FmgcComputer_DWork.Delay1_DSTATE = FmgcComputer_P.Delay1_InitialCondition;
      FmgcComputer_DWork.Memory_PreviousInput_bh = FmgcComputer_P.SRFlipFlop1_initial_condition_lo;
      FmgcComputer_DWork.Memory_PreviousInput_cm = FmgcComputer_P.SRFlipFlop1_initial_condition_m;
      FmgcComputer_DWork.Memory_PreviousInput_ol = FmgcComputer_P.SRFlipFlop1_initial_condition_by;
      FmgcComputer_DWork.Memory_PreviousInput_kr = FmgcComputer_P.SRFlipFlop_initial_condition_as;
      FmgcComputer_DWork.Memory_PreviousInput_km = FmgcComputer_P.SRFlipFlop1_initial_condition_l0;
      FmgcComputer_DWork.Delay_DSTATE_i = FmgcComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
      FmgcComputer_DWork.Delay_DSTATE_l = FmgcComputer_P.Delay_InitialCondition_p;
      FmgcComputer_DWork.icLoad = true;
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fw);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kv);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_m3);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bv);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_il);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jp);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_cb);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hp);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_it);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kz);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_o1);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mn);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jt);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_d4);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ga);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_e5);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ag);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dx);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_p2o);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_an);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bz);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_g0);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_pl4);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hz);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_gk);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fx);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ngt);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fm);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jl);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fh);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mnt);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kz1);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hh);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ha);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kb);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_eb2);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_es);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mq);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_cr);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_op);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fa);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fo0);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mb);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_j2);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_pu);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_d3);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bbv);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bk);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mm);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hvs);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fn5);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_lml);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_e3);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mtz);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_gb);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_aw);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_aj);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_at);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_o3);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_di2);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_a5);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hdw);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_m1w);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hy);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hu);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_idz);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fi);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_h0);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jle);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jd);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ew);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_prl);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ge4);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ma);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_k4c);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ah);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ol);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mne);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_p4);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_is);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_pr);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bq);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hw);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ee);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dt);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fed);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bbb);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jc);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_nd);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dsw);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_cz);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_gbq);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_p3z);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dfk);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dd);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ir);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mrk);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kd);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_n5);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_f0h);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_moh);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_lva);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_go);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ms);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hj);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_khd);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_fl);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dn1);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_a3);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_epf);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_pe);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_iv);
      FmgcComputer_LagFilter_Reset(&FmgcComputer_DWork.sf_LagFilter_k);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_bs);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_muf);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dba);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_owv);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jrd);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hdx);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_h0f);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ppo);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hd1);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dln);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_k4v);
      FmgcComputer_MATLABFunction_d_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ppu);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_k0);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hjm);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_od);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_d5);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_aag);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_itu);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_jcu);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_abn);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kzm);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ab);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hkc);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ft);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mrn);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ih);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_lr);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_j3h);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_dq);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hpe);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_mw);
      FmgcComputer_DWork.vMemoEo_not_empty = false;
      FmgcComputer_DWork.vMemoGa_not_empty = false;
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_hi);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_oep);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_nj);
      FmgcComputer_DWork.pLand3FailOp = false;
      FmgcComputer_DWork.pLand3FailPass = false;
      LawMDLOBJ1.reset();
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_a);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_g);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_k);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_j);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ay);
      FmgcComputer_MATLABFunction_p_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ge);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_ig);
      FmgcComputer_MATLABFunction_j_Reset(&FmgcComputer_DWork.sf_MATLABFunction_kh);
      FmgcComputer_DWork.pY_not_empty_b = false;
      FmgcComputer_DWork.pU_not_empty_i = false;
      FmgcComputer_LeadLagFilter_Reset(&FmgcComputer_DWork.sf_LeadLagFilter);
      FmgcComputer_LeadLagFilter_Reset(&FmgcComputer_DWork.sf_LeadLagFilter_b);
      FmgcComputer_DWork.pY_not_empty_m = false;
      FmgcComputer_DWork.pU_not_empty_l = false;
      FmgcComputer_LagFilter_Reset(&FmgcComputer_DWork.sf_LagFilter_g);
      FmgcComputer_DWork.pY_not_empty = false;
      FmgcComputer_DWork.pU_not_empty = false;
      FmgcComputer_DWork.pY_not_empty_e = false;
      FmgcComputer_DWork.Runtime_MODE = true;
    }

    rtb_adrOwnInvalid = ((FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) ||
                         (FmgcComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) || (FmgcComputer_U.in.bus_inputs.adr_own_bus.mach.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                         (FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_standard_ft.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)));
    rtb_adrOppInvalid = ((FmgcComputer_U.in.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) ||
                         (FmgcComputer_U.in.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)) || (FmgcComputer_U.in.bus_inputs.adr_opp_bus.mach.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                         (FmgcComputer_U.in.bus_inputs.adr_opp_bus.altitude_standard_ft.SSM == static_cast<uint32_T>
                          (SignStatusMatrix::FailureWarning)));
    rtb_adr3Invalid = ((FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::FailureWarning)) ||
                       (FmgcComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::FailureWarning)) || (FmgcComputer_U.in.bus_inputs.adr_3_bus.mach.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
                       (FmgcComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.SSM == static_cast<uint32_T>
                        (SignStatusMatrix::FailureWarning)));
    rtb_doubleAdrFault = ((rtb_adrOwnInvalid && rtb_adrOppInvalid) || (rtb_adrOwnInvalid && rtb_adr3Invalid) ||
                          (rtb_adrOppInvalid && rtb_adr3Invalid));
    raOwnInvalid = !rtb_adrOwnInvalid;
    raOppInvalid = !rtb_adr3Invalid;
    rtb_adrOppInvalid = (raOwnInvalid && (!rtb_adrOppInvalid) && raOppInvalid);
    rtb_irOwnInvalid = ((FmgcComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.heading_true_deg.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.track_angle_true_deg.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.SSM !=
                         static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                        (FmgcComputer_U.in.bus_inputs.ir_own_bus.latitude_deg.SSM != static_cast<uint32_T>
                         (SignStatusMatrix::NormalOperation)));
    rtb_adrOwnInvalid = ((FmgcComputer_U.in.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                          (SignStatusMatrix::NormalOperation)) ||
                         (FmgcComputer_U.in.bus_inputs.ir_opp_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                          (SignStatusMatrix::NormalOperation)) ||
                         (FmgcComputer_U.in.bus_inputs.ir_opp_bus.pitch_angle_deg.SSM != static_cast<uint32_T>
                          (SignStatusMatrix::NormalOperation)) ||
                         (FmgcComputer_U.in.bus_inputs.ir_opp_bus.roll_angle_deg.SSM != static_cast<uint32_T>
                          (SignStatusMatrix::NormalOperation)) ||
                         (FmgcComputer_U.in.bus_inputs.ir_opp_bus.heading_true_deg.SSM != static_cast<uint32_T>
                          (SignStatusMatrix::NormalOperation)) ||
                         (FmgcComputer_U.in.bus_inputs.ir_opp_bus.track_angle_true_deg.SSM != static_cast<uint32_T>
                          (SignStatusMatrix::NormalOperation)) ||
                         (FmgcComputer_U.in.bus_inputs.ir_opp_bus.inertial_vertical_speed_ft_s.SSM !=
                          static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                         (FmgcComputer_U.in.bus_inputs.ir_opp_bus.latitude_deg.SSM != static_cast<uint32_T>
                          (SignStatusMatrix::NormalOperation)));
    rtb_ir3Invalid = ((FmgcComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) ||
                      (FmgcComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) ||
                      (FmgcComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) || (FmgcComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM
      != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
                      (FmgcComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) ||
                      (FmgcComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) ||
                      (FmgcComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM != static_cast<uint32_T>
                       (SignStatusMatrix::NormalOperation)) || (FmgcComputer_U.in.bus_inputs.ir_3_bus.latitude_deg.SSM
      != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)));
    rtb_adr3Invalid = ((rtb_irOwnInvalid && rtb_adrOwnInvalid) || (rtb_irOwnInvalid && rtb_ir3Invalid) ||
                       (rtb_adrOwnInvalid && rtb_ir3Invalid));
    rtb_irOwnInvalid = !rtb_irOwnInvalid;
    rtb_ir3Invalid = !rtb_ir3Invalid;
    rtb_adrOwnInvalid = (rtb_irOwnInvalid && (!rtb_adrOwnInvalid) && rtb_ir3Invalid);
    if (raOwnInvalid) {
      rtb_adrComputationBus_altitude_standard_ft_SSM = FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_standard_ft.SSM;
      rtb_adrComputationBus_altitude_standard_ft_Data =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_standard_ft.Data;
      rtb_adrComputationBus_altitude_corrected_1_ft_SSM =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_1_ft.SSM;
      rtb_adrComputationBus_altitude_corrected_1_ft_Data =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_1_ft.Data;
      rtb_adrComputationBus_altitude_corrected_2_ft_SSM =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_2_ft.SSM;
      rtb_adrComputationBus_altitude_corrected_2_ft_Data =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_2_ft.Data;
      rtb_adrComputationBus_mach_SSM = FmgcComputer_U.in.bus_inputs.adr_own_bus.mach.SSM;
      rtb_adrComputationBus_mach_Data = FmgcComputer_U.in.bus_inputs.adr_own_bus.mach.Data;
      rtb_adrComputationBus_airspeed_computed_kn_SSM = FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM;
      rtb_adrComputationBus_airspeed_computed_kn_Data =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.Data;
      FmgcComputer_Y.out.logic.adr_computation_data.airspeed_true_kn.SSM =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.SSM;
      rtb_adrComputationBus_airspeed_true_kn_Data = FmgcComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.Data;
      rtb_adrComputationBus_vertical_speed_ft_min_SSM =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.vertical_speed_ft_min.SSM;
      rtb_adrComputationBus_vertical_speed_ft_min_Data =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.vertical_speed_ft_min.Data;
      FmgcComputer_Y.out.logic.adr_computation_data.aoa_corrected_deg.SSM =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM;
      rtb_adrComputationBus_aoa_corrected_deg_Data = FmgcComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.Data;
      rtb_adrComputationBus_corrected_average_static_pressure_SSM =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.corrected_average_static_pressure.SSM;
      rtb_adrComputationBus_corrected_average_static_pressure_Data =
        FmgcComputer_U.in.bus_inputs.adr_own_bus.corrected_average_static_pressure.Data;
    } else if (raOppInvalid) {
      rtb_adrComputationBus_altitude_standard_ft_SSM = FmgcComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.SSM;
      rtb_adrComputationBus_altitude_standard_ft_Data = FmgcComputer_U.in.bus_inputs.adr_3_bus.altitude_standard_ft.Data;
      rtb_adrComputationBus_altitude_corrected_1_ft_SSM =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_1_ft.SSM;
      rtb_adrComputationBus_altitude_corrected_1_ft_Data =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_1_ft.Data;
      rtb_adrComputationBus_altitude_corrected_2_ft_SSM =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_2_ft.SSM;
      rtb_adrComputationBus_altitude_corrected_2_ft_Data =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.altitude_corrected_2_ft.Data;
      rtb_adrComputationBus_mach_SSM = FmgcComputer_U.in.bus_inputs.adr_3_bus.mach.SSM;
      rtb_adrComputationBus_mach_Data = FmgcComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_adrComputationBus_airspeed_computed_kn_SSM = FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM;
      rtb_adrComputationBus_airspeed_computed_kn_Data = FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      FmgcComputer_Y.out.logic.adr_computation_data.airspeed_true_kn.SSM =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.SSM;
      rtb_adrComputationBus_airspeed_true_kn_Data = FmgcComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_adrComputationBus_vertical_speed_ft_min_SSM = FmgcComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.SSM;
      rtb_adrComputationBus_vertical_speed_ft_min_Data =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.vertical_speed_ft_min.Data;
      FmgcComputer_Y.out.logic.adr_computation_data.aoa_corrected_deg.SSM =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM;
      rtb_adrComputationBus_aoa_corrected_deg_Data = FmgcComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
      rtb_adrComputationBus_corrected_average_static_pressure_SSM =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.SSM;
      rtb_adrComputationBus_corrected_average_static_pressure_Data =
        FmgcComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
    } else {
      rtb_adrComputationBus_altitude_standard_ft_SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.altitude_standard_ft.SSM;
      rtb_adrComputationBus_altitude_standard_ft_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.altitude_standard_ft.Data;
      rtb_adrComputationBus_altitude_corrected_1_ft_SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.altitude_corrected_1_ft.SSM;
      rtb_adrComputationBus_altitude_corrected_1_ft_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.altitude_corrected_1_ft.Data;
      rtb_adrComputationBus_altitude_corrected_2_ft_SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.altitude_corrected_2_ft.SSM;
      rtb_adrComputationBus_altitude_corrected_2_ft_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.altitude_corrected_2_ft.Data;
      rtb_adrComputationBus_mach_SSM = FmgcComputer_P.Constant1_Value.adr_computation_data.mach.SSM;
      rtb_adrComputationBus_mach_Data = FmgcComputer_P.Constant1_Value.adr_computation_data.mach.Data;
      rtb_adrComputationBus_airspeed_computed_kn_SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.airspeed_computed_kn.SSM;
      rtb_adrComputationBus_airspeed_computed_kn_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.airspeed_computed_kn.Data;
      FmgcComputer_Y.out.logic.adr_computation_data.airspeed_true_kn.SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.airspeed_true_kn.SSM;
      rtb_adrComputationBus_airspeed_true_kn_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.airspeed_true_kn.Data;
      rtb_adrComputationBus_vertical_speed_ft_min_SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.vertical_speed_ft_min.SSM;
      rtb_adrComputationBus_vertical_speed_ft_min_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.vertical_speed_ft_min.Data;
      FmgcComputer_Y.out.logic.adr_computation_data.aoa_corrected_deg.SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.aoa_corrected_deg.SSM;
      rtb_adrComputationBus_aoa_corrected_deg_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.aoa_corrected_deg.Data;
      rtb_adrComputationBus_corrected_average_static_pressure_SSM =
        FmgcComputer_P.Constant1_Value.adr_computation_data.corrected_average_static_pressure.SSM;
      rtb_adrComputationBus_corrected_average_static_pressure_Data =
        FmgcComputer_P.Constant1_Value.adr_computation_data.corrected_average_static_pressure.Data;
    }

    if (FmgcComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_Switch2_o_0 = &FmgcComputer_U.in.bus_inputs.fcu_bus.eis_discrete_word_2_left;
    } else {
      rtb_Switch2_o_0 = &FmgcComputer_U.in.bus_inputs.fcu_bus.eis_discrete_word_2_right;
    }

    FmgcComputer_MATLABFunction_i(rtb_Switch2_o_0, FmgcComputer_P.BitfromLabel1_bit, &rtb_y_jm);
    FmgcComputer_MATLABFunction_m(rtb_Switch2_o_0, &rtb_y_if);
    if ((rtb_y_jm != 0U) || (!rtb_y_if)) {
      rtb_fm_weight_lbs_SSM = rtb_adrComputationBus_altitude_standard_ft_SSM;
      rtb_Max_a = rtb_adrComputationBus_altitude_standard_ft_Data;
    } else if (FmgcComputer_U.in.discrete_inputs.is_unit_1) {
      rtb_fm_weight_lbs_SSM = rtb_adrComputationBus_altitude_corrected_1_ft_SSM;
      rtb_Max_a = rtb_adrComputationBus_altitude_corrected_1_ft_Data;
    } else {
      rtb_fm_weight_lbs_SSM = rtb_adrComputationBus_altitude_corrected_2_ft_SSM;
      rtb_Max_a = rtb_adrComputationBus_altitude_corrected_2_ft_Data;
    }

    if (rtb_irOwnInvalid) {
      FmgcComputer_Y.out.logic.ir_computation_data.discrete_word_1 =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.discrete_word_1;
      FmgcComputer_Y.out.logic.ir_computation_data.latitude_deg = FmgcComputer_U.in.bus_inputs.ir_own_bus.latitude_deg;
      FmgcComputer_Y.out.logic.ir_computation_data.longitude_deg = FmgcComputer_U.in.bus_inputs.ir_own_bus.longitude_deg;
      rtb_BusAssignment_jc_logic_ir_computation_data_ground_speed_kn.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.ground_speed_kn.SSM;
      rtb_Cos_h = FmgcComputer_U.in.bus_inputs.ir_own_bus.ground_speed_kn.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.track_angle_true_deg.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.track_angle_true_deg.SSM;
      rtb_irComputationBus_track_angle_true_deg_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.track_angle_true_deg.Data;
      rtb_irComputationBus_heading_true_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_own_bus.heading_true_deg.SSM;
      rtb_irComputationBus_heading_true_deg_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.heading_true_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.wind_speed_kn = FmgcComputer_U.in.bus_inputs.ir_own_bus.wind_speed_kn;
      FmgcComputer_Y.out.logic.ir_computation_data.wind_direction_true_deg =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.wind_direction_true_deg;
      rtb_irComputationBus_track_angle_magnetic_deg_SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.track_angle_magnetic_deg.SSM;
      rtb_Gain2_f = FmgcComputer_U.in.bus_inputs.ir_own_bus.track_angle_magnetic_deg.Data;
      rtb_irComputationBus_heading_magnetic_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_own_bus.heading_magnetic_deg.SSM;
      rtb_irComputationBus_heading_magnetic_deg_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.heading_magnetic_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.drift_angle_deg =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.drift_angle_deg;
      rtb_irComputationBus_flight_path_angle_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_own_bus.flight_path_angle_deg.SSM;
      rtb_irComputationBus_flight_path_angle_deg_Data =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.flight_path_angle_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.flight_path_accel_g =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.flight_path_accel_g;
      rtb_irComputationBus_pitch_angle_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.SSM;
      rtb_irComputationBus_pitch_angle_deg_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.Data;
      rtb_irComputationBus_roll_angle_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.SSM;
      rtb_irComputationBus_roll_angle_deg_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_pitch_rate_deg_s =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.body_pitch_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.body_roll_rate_deg_s.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.body_roll_rate_deg_s.SSM;
      rtb_irComputationBus_body_roll_rate_deg_s_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_roll_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_yaw_rate_deg_s.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM;
      rtb_irComputationBus_body_yaw_rate_deg_s_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_long_accel_g.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.body_long_accel_g.SSM;
      rtb_irComputationBus_body_long_accel_g_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_long_accel_g.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_lat_accel_g.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.SSM;
      rtb_irComputationBus_body_lat_accel_g_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.Data;
      rtb_BusAssignment_jc_logic_ir_computation_data_body_normal_accel_g.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.body_normal_accel_g.SSM;
      rtb_irComputationBus_body_normal_accel_g_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.body_normal_accel_g.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.track_angle_rate_deg_s =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.track_angle_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.pitch_att_rate_deg_s.SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.SSM;
      rtb_irComputationBus_pitch_att_rate_deg_s_Data = FmgcComputer_U.in.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.roll_att_rate_deg_s =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.roll_att_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.inertial_alt_ft =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.inertial_alt_ft;
      FmgcComputer_Y.out.logic.ir_computation_data.along_track_horiz_acc_g =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.along_track_horiz_acc_g;
      FmgcComputer_Y.out.logic.ir_computation_data.cross_track_horiz_acc_g =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.cross_track_horiz_acc_g;
      FmgcComputer_Y.out.logic.ir_computation_data.vertical_accel_g =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.vertical_accel_g;
      rtb_irComputationBus_inertial_vertical_speed_ft_s_SSM =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.SSM;
      rtb_irComputationBus_inertial_vertical_speed_ft_s_Data =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.inertial_vertical_speed_ft_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.north_south_velocity_kn =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.north_south_velocity_kn;
      FmgcComputer_Y.out.logic.ir_computation_data.east_west_velocity_kn =
        FmgcComputer_U.in.bus_inputs.ir_own_bus.east_west_velocity_kn;
    } else if (rtb_ir3Invalid) {
      FmgcComputer_Y.out.logic.ir_computation_data.discrete_word_1 =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.discrete_word_1;
      FmgcComputer_Y.out.logic.ir_computation_data.latitude_deg = FmgcComputer_U.in.bus_inputs.ir_3_bus.latitude_deg;
      FmgcComputer_Y.out.logic.ir_computation_data.longitude_deg = FmgcComputer_U.in.bus_inputs.ir_3_bus.longitude_deg;
      rtb_BusAssignment_jc_logic_ir_computation_data_ground_speed_kn.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.SSM;
      rtb_Cos_h = FmgcComputer_U.in.bus_inputs.ir_3_bus.ground_speed_kn.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.track_angle_true_deg.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.SSM;
      rtb_irComputationBus_track_angle_true_deg_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.track_angle_true_deg.Data;
      rtb_irComputationBus_heading_true_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.SSM;
      rtb_irComputationBus_heading_true_deg_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.heading_true_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.wind_speed_kn = FmgcComputer_U.in.bus_inputs.ir_3_bus.wind_speed_kn;
      FmgcComputer_Y.out.logic.ir_computation_data.wind_direction_true_deg =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.wind_direction_true_deg;
      rtb_irComputationBus_track_angle_magnetic_deg_SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.SSM;
      rtb_Gain2_f = FmgcComputer_U.in.bus_inputs.ir_3_bus.track_angle_magnetic_deg.Data;
      rtb_irComputationBus_heading_magnetic_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.SSM;
      rtb_irComputationBus_heading_magnetic_deg_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.heading_magnetic_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.drift_angle_deg =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.drift_angle_deg;
      rtb_irComputationBus_flight_path_angle_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.SSM;
      rtb_irComputationBus_flight_path_angle_deg_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.flight_path_angle_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.flight_path_accel_g =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.flight_path_accel_g;
      rtb_irComputationBus_pitch_angle_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.SSM;
      rtb_irComputationBus_pitch_angle_deg_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      rtb_irComputationBus_roll_angle_deg_SSM = FmgcComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.SSM;
      rtb_irComputationBus_roll_angle_deg_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_pitch_rate_deg_s =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.body_roll_rate_deg_s.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.SSM;
      rtb_irComputationBus_body_roll_rate_deg_s_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_roll_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_yaw_rate_deg_s.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM;
      rtb_irComputationBus_body_yaw_rate_deg_s_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_long_accel_g.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.SSM;
      rtb_irComputationBus_body_long_accel_g_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_lat_accel_g.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM;
      rtb_irComputationBus_body_lat_accel_g_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      rtb_BusAssignment_jc_logic_ir_computation_data_body_normal_accel_g.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.SSM;
      rtb_irComputationBus_body_normal_accel_g_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.track_angle_rate_deg_s =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.track_angle_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.pitch_att_rate_deg_s.SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.SSM;
      rtb_irComputationBus_pitch_att_rate_deg_s_Data = FmgcComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.roll_att_rate_deg_s =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.inertial_alt_ft =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.inertial_alt_ft;
      FmgcComputer_Y.out.logic.ir_computation_data.along_track_horiz_acc_g =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.along_track_horiz_acc_g;
      FmgcComputer_Y.out.logic.ir_computation_data.cross_track_horiz_acc_g =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.cross_track_horiz_acc_g;
      FmgcComputer_Y.out.logic.ir_computation_data.vertical_accel_g =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.vertical_accel_g;
      rtb_irComputationBus_inertial_vertical_speed_ft_s_SSM =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.SSM;
      rtb_irComputationBus_inertial_vertical_speed_ft_s_Data =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.inertial_vertical_speed_ft_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.north_south_velocity_kn =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.north_south_velocity_kn;
      FmgcComputer_Y.out.logic.ir_computation_data.east_west_velocity_kn =
        FmgcComputer_U.in.bus_inputs.ir_3_bus.east_west_velocity_kn;
    } else {
      FmgcComputer_Y.out.logic.ir_computation_data.discrete_word_1 =
        FmgcComputer_P.Constant1_Value.ir_computation_data.discrete_word_1;
      FmgcComputer_Y.out.logic.ir_computation_data.latitude_deg =
        FmgcComputer_P.Constant1_Value.ir_computation_data.latitude_deg;
      FmgcComputer_Y.out.logic.ir_computation_data.longitude_deg =
        FmgcComputer_P.Constant1_Value.ir_computation_data.longitude_deg;
      rtb_BusAssignment_jc_logic_ir_computation_data_ground_speed_kn.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.ground_speed_kn.SSM;
      rtb_Cos_h = FmgcComputer_P.Constant1_Value.ir_computation_data.ground_speed_kn.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.track_angle_true_deg.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.track_angle_true_deg.SSM;
      rtb_irComputationBus_track_angle_true_deg_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.track_angle_true_deg.Data;
      rtb_irComputationBus_heading_true_deg_SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.heading_true_deg.SSM;
      rtb_irComputationBus_heading_true_deg_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.heading_true_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.wind_speed_kn =
        FmgcComputer_P.Constant1_Value.ir_computation_data.wind_speed_kn;
      FmgcComputer_Y.out.logic.ir_computation_data.wind_direction_true_deg =
        FmgcComputer_P.Constant1_Value.ir_computation_data.wind_direction_true_deg;
      rtb_irComputationBus_track_angle_magnetic_deg_SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.track_angle_magnetic_deg.SSM;
      rtb_Gain2_f = FmgcComputer_P.Constant1_Value.ir_computation_data.track_angle_magnetic_deg.Data;
      rtb_irComputationBus_heading_magnetic_deg_SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.heading_magnetic_deg.SSM;
      rtb_irComputationBus_heading_magnetic_deg_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.heading_magnetic_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.drift_angle_deg =
        FmgcComputer_P.Constant1_Value.ir_computation_data.drift_angle_deg;
      rtb_irComputationBus_flight_path_angle_deg_SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.flight_path_angle_deg.SSM;
      rtb_irComputationBus_flight_path_angle_deg_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.flight_path_angle_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.flight_path_accel_g =
        FmgcComputer_P.Constant1_Value.ir_computation_data.flight_path_accel_g;
      rtb_irComputationBus_pitch_angle_deg_SSM = FmgcComputer_P.Constant1_Value.ir_computation_data.pitch_angle_deg.SSM;
      rtb_irComputationBus_pitch_angle_deg_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.pitch_angle_deg.Data;
      rtb_irComputationBus_roll_angle_deg_SSM = FmgcComputer_P.Constant1_Value.ir_computation_data.roll_angle_deg.SSM;
      rtb_irComputationBus_roll_angle_deg_Data = FmgcComputer_P.Constant1_Value.ir_computation_data.roll_angle_deg.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_pitch_rate_deg_s =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_pitch_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.body_roll_rate_deg_s.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_roll_rate_deg_s.SSM;
      rtb_irComputationBus_body_roll_rate_deg_s_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_roll_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_yaw_rate_deg_s.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_yaw_rate_deg_s.SSM;
      rtb_irComputationBus_body_yaw_rate_deg_s_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_yaw_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_long_accel_g.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_long_accel_g.SSM;
      rtb_irComputationBus_body_long_accel_g_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_long_accel_g.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.body_lat_accel_g.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_lat_accel_g.SSM;
      rtb_irComputationBus_body_lat_accel_g_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_lat_accel_g.Data;
      rtb_BusAssignment_jc_logic_ir_computation_data_body_normal_accel_g.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_normal_accel_g.SSM;
      rtb_irComputationBus_body_normal_accel_g_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.body_normal_accel_g.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.track_angle_rate_deg_s =
        FmgcComputer_P.Constant1_Value.ir_computation_data.track_angle_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.pitch_att_rate_deg_s.SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.pitch_att_rate_deg_s.SSM;
      rtb_irComputationBus_pitch_att_rate_deg_s_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.pitch_att_rate_deg_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.roll_att_rate_deg_s =
        FmgcComputer_P.Constant1_Value.ir_computation_data.roll_att_rate_deg_s;
      FmgcComputer_Y.out.logic.ir_computation_data.inertial_alt_ft =
        FmgcComputer_P.Constant1_Value.ir_computation_data.inertial_alt_ft;
      FmgcComputer_Y.out.logic.ir_computation_data.along_track_horiz_acc_g =
        FmgcComputer_P.Constant1_Value.ir_computation_data.along_track_horiz_acc_g;
      FmgcComputer_Y.out.logic.ir_computation_data.cross_track_horiz_acc_g =
        FmgcComputer_P.Constant1_Value.ir_computation_data.cross_track_horiz_acc_g;
      FmgcComputer_Y.out.logic.ir_computation_data.vertical_accel_g =
        FmgcComputer_P.Constant1_Value.ir_computation_data.vertical_accel_g;
      rtb_irComputationBus_inertial_vertical_speed_ft_s_SSM =
        FmgcComputer_P.Constant1_Value.ir_computation_data.inertial_vertical_speed_ft_s.SSM;
      rtb_irComputationBus_inertial_vertical_speed_ft_s_Data =
        FmgcComputer_P.Constant1_Value.ir_computation_data.inertial_vertical_speed_ft_s.Data;
      FmgcComputer_Y.out.logic.ir_computation_data.north_south_velocity_kn =
        FmgcComputer_P.Constant1_Value.ir_computation_data.north_south_velocity_kn;
      FmgcComputer_Y.out.logic.ir_computation_data.east_west_velocity_kn =
        FmgcComputer_P.Constant1_Value.ir_computation_data.east_west_velocity_kn;
    }

    raOwnInvalid = (FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.SSM == static_cast<uint32_T>
                    (SignStatusMatrix::FailureWarning));
    raOppInvalid = (FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.SSM == static_cast<uint32_T>
                    (SignStatusMatrix::FailureWarning));
    rtb_y_n = !raOppInvalid;
    rtb_OR1_j = !raOwnInvalid;
    if (rtb_OR1_j && rtb_y_n) {
      rtb_raComputationData_radio_height_ft_SSM = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.SSM;
      rtb_raComputationData_radio_height_ft_Data = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else if (raOwnInvalid && rtb_y_n) {
      rtb_raComputationData_radio_height_ft_SSM = FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.SSM;
      rtb_raComputationData_radio_height_ft_Data = FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.Data;
    } else if (rtb_OR1_j && raOppInvalid) {
      rtb_raComputationData_radio_height_ft_SSM = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.SSM;
      rtb_raComputationData_radio_height_ft_Data = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.Data;
    } else {
      rtb_raComputationData_radio_height_ft_SSM = FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.SSM;
      rtb_raComputationData_radio_height_ft_Data = 2500.0F;
    }

    raOwnInvalid = (raOwnInvalid && raOppInvalid);
    raOppInvalid = ((FmgcComputer_U.in.bus_inputs.ra_own_bus.radio_height_ft.SSM == static_cast<uint32_T>
                     (SignStatusMatrix::NormalOperation)) &&
                    (FmgcComputer_U.in.bus_inputs.ra_opp_bus.radio_height_ft.SSM == static_cast<uint32_T>
                     (SignStatusMatrix::NormalOperation)));
    if (FmgcComputer_U.in.discrete_inputs.fac_own_healthy) {
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_1 = FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_1;
      FmgcComputer_Y.out.logic.chosen_fac_bus.gamma_a_deg = FmgcComputer_U.in.bus_inputs.fac_own_bus.gamma_a_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.gamma_t_deg = FmgcComputer_U.in.bus_inputs.fac_own_bus.gamma_t_deg;
      rtb_Switch_total_weight_lbs_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.total_weight_lbs.SSM;
      rtb_Switch_total_weight_lbs_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.total_weight_lbs.Data;
      rtb_Switch_center_of_gravity_pos_percent_SSM =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.center_of_gravity_pos_percent.SSM;
      rtb_Switch_center_of_gravity_pos_percent_Data =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.center_of_gravity_pos_percent.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.sideslip_target_deg =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.sideslip_target_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.fac_slat_angle_deg =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.fac_slat_angle_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.fac_flap_angle_deg =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.fac_flap_angle_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_2 = FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_2;
      FmgcComputer_Y.out.logic.chosen_fac_bus.rudder_travel_limit_command_deg =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.rudder_travel_limit_command_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.delta_r_yaw_damper_deg =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.delta_r_yaw_damper_deg;
      rtb_Switch_estimated_sideslip_deg_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.estimated_sideslip_deg.SSM;
      rtb_Switch_estimated_sideslip_deg_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.estimated_sideslip_deg.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_alpha_lim_kn = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_alpha_lim_kn;
      rtb_Switch_v_ls_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_ls_kn.SSM;
      rtb_Switch_v_ls_kn_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_ls_kn.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_stall_kn = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_stall_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_alpha_prot_kn = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_alpha_prot_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_stall_warn_kn = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_stall_warn_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.speed_trend_kn = FmgcComputer_U.in.bus_inputs.fac_own_bus.speed_trend_kn;
      rtb_Switch_v_3_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_3_kn.SSM;
      rtb_Switch_v_3_kn_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_3_kn.Data;
      rtb_Switch_v_4_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_4_kn.SSM;
      rtb_Switch_v_4_kn_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_4_kn.Data;
      rtb_Switch_v_man_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_man_kn.SSM;
      rtb_Switch_v_man_kn_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_man_kn.Data;
      rtb_Switch_v_max_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_max_kn.SSM;
      rtb_Switch_v_max_kn_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_max_kn.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_fe_next_kn = FmgcComputer_U.in.bus_inputs.fac_own_bus.v_fe_next_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_3 = FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_3;
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_4 = FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_4;
      rtb_Switch_discrete_word_5_SSM = FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_5.SSM;
      rtb_Switch_discrete_word_5_Data = FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_5.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.delta_r_rudder_trim_deg =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.delta_r_rudder_trim_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.rudder_trim_pos_deg =
        FmgcComputer_U.in.bus_inputs.fac_own_bus.rudder_trim_pos_deg;
    } else {
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_1 = FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_1;
      FmgcComputer_Y.out.logic.chosen_fac_bus.gamma_a_deg = FmgcComputer_U.in.bus_inputs.fac_opp_bus.gamma_a_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.gamma_t_deg = FmgcComputer_U.in.bus_inputs.fac_opp_bus.gamma_t_deg;
      rtb_Switch_total_weight_lbs_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.total_weight_lbs.SSM;
      rtb_Switch_total_weight_lbs_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.total_weight_lbs.Data;
      rtb_Switch_center_of_gravity_pos_percent_SSM =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.SSM;
      rtb_Switch_center_of_gravity_pos_percent_Data =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.center_of_gravity_pos_percent.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.sideslip_target_deg =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.sideslip_target_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.fac_slat_angle_deg =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.fac_slat_angle_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.fac_flap_angle_deg =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.fac_flap_angle_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_2 = FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_2;
      FmgcComputer_Y.out.logic.chosen_fac_bus.rudder_travel_limit_command_deg =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.rudder_travel_limit_command_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.delta_r_yaw_damper_deg =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.delta_r_yaw_damper_deg;
      rtb_Switch_estimated_sideslip_deg_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.estimated_sideslip_deg.SSM;
      rtb_Switch_estimated_sideslip_deg_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.estimated_sideslip_deg.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_alpha_lim_kn = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_alpha_lim_kn;
      rtb_Switch_v_ls_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_ls_kn.SSM;
      rtb_Switch_v_ls_kn_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_ls_kn.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_stall_kn = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_stall_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_alpha_prot_kn = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_alpha_prot_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_stall_warn_kn = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_stall_warn_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.speed_trend_kn = FmgcComputer_U.in.bus_inputs.fac_opp_bus.speed_trend_kn;
      rtb_Switch_v_3_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_3_kn.SSM;
      rtb_Switch_v_3_kn_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_3_kn.Data;
      rtb_Switch_v_4_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_4_kn.SSM;
      rtb_Switch_v_4_kn_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_4_kn.Data;
      rtb_Switch_v_man_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_man_kn.SSM;
      rtb_Switch_v_man_kn_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_man_kn.Data;
      rtb_Switch_v_max_kn_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_max_kn.SSM;
      rtb_Switch_v_max_kn_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_max_kn.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.v_fe_next_kn = FmgcComputer_U.in.bus_inputs.fac_opp_bus.v_fe_next_kn;
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_3 = FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_3;
      FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_4 = FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_4;
      rtb_Switch_discrete_word_5_SSM = FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5.SSM;
      rtb_Switch_discrete_word_5_Data = FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5.Data;
      FmgcComputer_Y.out.logic.chosen_fac_bus.delta_r_rudder_trim_deg =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.delta_r_rudder_trim_deg;
      FmgcComputer_Y.out.logic.chosen_fac_bus.rudder_trim_pos_deg =
        FmgcComputer_U.in.bus_inputs.fac_opp_bus.rudder_trim_pos_deg;
    }

    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit, &rtb_y_jm);
    rtb_y_jt = (rtb_y_jm != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit, &rtb_y_jm);
    rtb_irOwnInvalid = (rtb_y_jt || (rtb_y_jm != 0U));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_p, &rtb_y_jm);
    rtb_AND10_b = (rtb_y_jm != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel3_bit, &rtb_y_jm);
    rtb_irOwnInvalid = ((!rtb_irOwnInvalid) || ((!rtb_AND10_b) && (rtb_y_jm == 0U)) || (!FmgcComputer_P.Constant_Value_a)
                        || ((!FmgcComputer_U.in.discrete_inputs.fac_own_healthy) &&
      (!FmgcComputer_U.in.discrete_inputs.fac_opp_healthy)));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel4_bit, &rtb_y_jm);
    rtb_y_jt = (rtb_y_jm != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel6_bit, &rtb_y_jm);
    rtb_y_jt = (rtb_y_jt || (rtb_y_jm != 0U));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_own_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel5_bit, &rtb_y_jm);
    rtb_y_gb = (rtb_y_jm != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel7_bit, &rtb_y_jm);
    rtb_ir3Invalid = (FmgcComputer_U.in.discrete_inputs.fac_opp_healthy &&
                      FmgcComputer_U.in.discrete_inputs.fac_own_healthy && rtb_y_jt && (rtb_y_gb || (rtb_y_jm != 0U)));
    rtb_BusAssignment_lz_logic_chosen_fac_bus_total_weight_lbs.SSM = rtb_Switch_total_weight_lbs_SSM;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_total_weight_lbs.Data = rtb_Switch_total_weight_lbs_Data;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_center_of_gravity_pos_percent.SSM =
      rtb_Switch_center_of_gravity_pos_percent_SSM;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_center_of_gravity_pos_percent.Data =
      rtb_Switch_center_of_gravity_pos_percent_Data;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_v_ls_kn.SSM = rtb_Switch_v_ls_kn_SSM;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_v_ls_kn.Data = rtb_Switch_v_ls_kn_Data;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_v_man_kn.SSM = rtb_Switch_v_man_kn_SSM;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_v_man_kn.Data = rtb_Switch_v_man_kn_Data;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_v_max_kn.SSM = rtb_Switch_v_max_kn_SSM;
    rtb_BusAssignment_lz_logic_chosen_fac_bus_v_max_kn.Data = rtb_Switch_v_max_kn_Data;
    FmgcComputer_MATLABFunction_m(&rtb_BusAssignment_lz_logic_chosen_fac_bus_v_max_kn, &rtb_y_nn);
    FmgcComputer_MATLABFunction_m(&rtb_BusAssignment_lz_logic_chosen_fac_bus_v_ls_kn, &rtb_y_eu);
    rtb_BusAssignment_n_logic_fac_speeds_failure = ((!rtb_y_nn) || (!rtb_y_eu));
    FmgcComputer_MATLABFunction_m(&rtb_BusAssignment_lz_logic_chosen_fac_bus_v_man_kn, &rtb_y_kr);
    FmgcComputer_MATLABFunction_m(&rtb_BusAssignment_lz_logic_chosen_fac_bus_center_of_gravity_pos_percent, &rtb_y_nn);
    FmgcComputer_MATLABFunction_m(&rtb_BusAssignment_lz_logic_chosen_fac_bus_total_weight_lbs, &rtb_y_eu);
    rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5.SSM = rtb_Switch_discrete_word_5_SSM;
    rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5.Data = rtb_Switch_discrete_word_5_Data;
    rtb_BusAssignment_n_logic_fac_weights_failure = ((!rtb_y_kr) || (!rtb_y_nn) || (!rtb_y_eu));
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel_bit_p, &rtb_y_jm);
    rtb_y_c1 = (rtb_y_jm != 0U);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel1_bit_a, &rtb_y_jm);
    rtb_y_gb = (rtb_y_jm != 0U);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel2_bit_p, &rtb_y_jm);
    rtb_AND10_b = (rtb_y_jm == 0U);
    FmgcComputer_MATLABFunction_m(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5, &rtb_y_eu);
    rtb_y_ft = (rtb_y_c1 && rtb_y_gb && rtb_AND10_b && rtb_y_eu);
    rtb_AND10_k = ((!rtb_y_eu) || (!rtb_AND10_b));
    rtb_OR_i = !rtb_y_ft;
    FmgcComputer_MATLABFunction_a(rtb_OR_i, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge,
      FmgcComputer_P.ConfirmNode1_timeDelay, &rtb_y_eu, &FmgcComputer_DWork.sf_MATLABFunction_fw);
    rtb_y_pf = ((FmgcComputer_U.in.discrete_inputs.eng_opp_stop && FmgcComputer_U.in.discrete_inputs.eng_own_stop &&
                 rtb_y_ft) || rtb_y_eu);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel8_bit, &rtb_DataTypeConversion1_j);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel9_bit, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel10_bit, &rtb_y_jm);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel11_bit, &rtb_y);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel12_bit, &rtb_Switch9);
    if (rtb_DataTypeConversion1_j != 0U) {
      rtb_handleIndex = 1;
    } else if (rtb_DataTypeConversion1_e != 0U) {
      rtb_handleIndex = 2;
    } else if (rtb_y_jm != 0U) {
      rtb_handleIndex = 3;
    } else if (rtb_y != 0U) {
      rtb_handleIndex = 4;
    } else if (rtb_Switch9 != 0U) {
      rtb_handleIndex = 5;
    } else {
      rtb_handleIndex = 0;
    }

    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel2_bit_l, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_m(&rtb_BusAssignment_n_logic_chosen_fac_bus_discrete_word_5, &rtb_y_eu);
    FmgcComputer_Y.out.logic.fac_flap_slat_data_failure = ((rtb_DataTypeConversion1_e != 0U) || (!rtb_y_eu));
    rtb_BusAssignment_h_logic_one_engine_out = FmgcComputer_U.in.discrete_inputs.eng_opp_stop ^
      FmgcComputer_U.in.discrete_inputs.eng_own_stop;
    rtb_BusAssignment_h_logic_engine_running = ((!FmgcComputer_U.in.discrete_inputs.eng_opp_stop) ||
      (!FmgcComputer_U.in.discrete_inputs.eng_own_stop));
    rtb_BusAssignment_h_logic_fcu_failure = ((!FmgcComputer_U.in.discrete_inputs.fcu_opp_healthy) &&
      (!FmgcComputer_U.in.discrete_inputs.fcu_own_healthy));
    FmgcComputer_MATLABFunction_m(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.glideslope_deviation_deg, &rtb_y_nn);
    FmgcComputer_MATLABFunction_m(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.localizer_deviation_deg, &rtb_y_eu);
    rtb_y_c1 = (rtb_y_nn && rtb_y_eu);
    FmgcComputer_MATLABFunction_m(&FmgcComputer_U.in.bus_inputs.ils_own_bus.glideslope_deviation_deg, &rtb_y_nn);
    FmgcComputer_MATLABFunction_m(&FmgcComputer_U.in.bus_inputs.ils_own_bus.localizer_deviation_deg, &rtb_y_eu);
    rtb_y_gb = (rtb_y_nn && rtb_y_eu);
    rtb_BusAssignment_o_logic_ils_failure = ((!rtb_y_c1) && (!rtb_y_gb));
    rtb_BusAssignment_o_logic_both_ils_valid = (rtb_y_c1 && rtb_y_gb);
    if (rtb_y_gb) {
      rtb_Switch9 = FmgcComputer_U.in.bus_inputs.ils_own_bus.runway_heading_deg.SSM;
      rtb_Switch_i_runway_heading_deg_Data = FmgcComputer_U.in.bus_inputs.ils_own_bus.runway_heading_deg.Data;
      FmgcComputer_Y.out.logic.ils_computation_data.ils_frequency_mhz =
        FmgcComputer_U.in.bus_inputs.ils_own_bus.ils_frequency_mhz;
      rtb_y = FmgcComputer_U.in.bus_inputs.ils_own_bus.localizer_deviation_deg.SSM;
      rtb_DataTypeConversion2_bh = FmgcComputer_U.in.bus_inputs.ils_own_bus.localizer_deviation_deg.Data;
      rtb_Switch_i_glideslope_deviation_deg_SSM = FmgcComputer_U.in.bus_inputs.ils_own_bus.glideslope_deviation_deg.SSM;
      rtb_Switch_i_glideslope_deviation_deg_Data =
        FmgcComputer_U.in.bus_inputs.ils_own_bus.glideslope_deviation_deg.Data;
    } else {
      rtb_Switch9 = FmgcComputer_U.in.bus_inputs.ils_opp_bus.runway_heading_deg.SSM;
      rtb_Switch_i_runway_heading_deg_Data = FmgcComputer_U.in.bus_inputs.ils_opp_bus.runway_heading_deg.Data;
      FmgcComputer_Y.out.logic.ils_computation_data.ils_frequency_mhz =
        FmgcComputer_U.in.bus_inputs.ils_opp_bus.ils_frequency_mhz;
      rtb_y = FmgcComputer_U.in.bus_inputs.ils_opp_bus.localizer_deviation_deg.SSM;
      rtb_DataTypeConversion2_bh = FmgcComputer_U.in.bus_inputs.ils_opp_bus.localizer_deviation_deg.Data;
      rtb_Switch_i_glideslope_deviation_deg_SSM = FmgcComputer_U.in.bus_inputs.ils_opp_bus.glideslope_deviation_deg.SSM;
      rtb_Switch_i_glideslope_deviation_deg_Data =
        FmgcComputer_U.in.bus_inputs.ils_opp_bus.glideslope_deviation_deg.Data;
    }

    if (FmgcComputer_U.in.fms_inputs.backbeam_selected) {
      rtb_DataTypeConversion2_bh *= FmgcComputer_P.Gain_Gain_f;
    }

    rtb_BusAssignment_o_logic_ra_computation_data_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    rtb_BusAssignment_o_logic_ra_computation_data_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    FmgcComputer_MATLABFunction_m(&FmgcComputer_U.in.bus_inputs.tcas_bus.sensitivity_level, &rtb_y_eu);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_o_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.sensitivity_level,
      FmgcComputer_P.BitfromLabel8_bit_c, &rtb_DataTypeConversion1_e);
    rtb_NOT1_i = (rtb_DataTypeConversion1_e == 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.sensitivity_level,
      FmgcComputer_P.BitfromLabel1_bit_aq, &rtb_DataTypeConversion1_e);
    rtb_y_gb = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.sensitivity_level,
      FmgcComputer_P.BitfromLabel2_bit_f, &rtb_DataTypeConversion1_e);
    rtb_NOT1_i = (rtb_y_eu && (rtb_y_gtq > FmgcComputer_P.CompareToConstant_const_n) && rtb_NOT1_i && rtb_y_gb &&
                  (rtb_DataTypeConversion1_e != 0U));
    rtb_BusAssignment_f_logic_ils_computation_data_runway_heading_deg.SSM = rtb_Switch9;
    rtb_BusAssignment_f_logic_ils_computation_data_runway_heading_deg.Data = rtb_Switch_i_runway_heading_deg_Data;
    FmgcComputer_Y.out.logic.tcas_failure = !rtb_y_eu;
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_o_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_y_c1 = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active ||
                FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active ||
                (FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed && (rtb_y_gtq <=
      FmgcComputer_P.CompareToConstant_const_o2)));
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_f_logic_ils_computation_data_runway_heading_deg,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue, &rtb_y_gtq);
    rtb_y_n = !rtb_y_c1;
    if (rtb_y_n) {
      FmgcComputer_B.u_lyjj = rtb_y_gtq;
    }

    rtb_BusAssignment_b_logic_ir_computation_data_heading_true_deg.SSM = rtb_irComputationBus_heading_true_deg_SSM;
    rtb_BusAssignment_b_logic_ir_computation_data_heading_true_deg.Data = rtb_irComputationBus_heading_true_deg_Data;
    rtb_BusAssignment_b_logic_ils_tune_inhibit = rtb_y_c1;
    rtb_y_g3 = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active);
    FmgcComputer_MATLABFunction_a(((!rtb_doubleAdrFault) && (!rtb_adr3Invalid) && ((!rtb_AND10_k) || rtb_y_g3) &&
      (FmgcComputer_U.in.fms_inputs.fm_valid || rtb_y_g3 ||
       (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active && (rtb_raComputationData_radio_height_ft_Data <
      700.0F)))), FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge_b,
      FmgcComputer_P.ConfirmNode1_timeDelay_e, &rtb_y_eu, &FmgcComputer_DWork.sf_MATLABFunction_kv);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_b_logic_ir_computation_data_heading_true_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_m3((FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rollout_submode_active && (std::abs
      (FmgcComputer_B.u_lyjj - rtb_y_gtq) > FmgcComputer_P.CompareToConstant_const)), FmgcComputer_U.in.time.dt,
      &rtb_y_if, FmgcComputer_P.MTrigNode_isRisingEdge, FmgcComputer_P.MTrigNode_retriggerable,
      FmgcComputer_P.MTrigNode_triggerDuration, &FmgcComputer_DWork.sf_MATLABFunction_m3);
    rtb_OR1_j = !rtb_BusAssignment_h_logic_fcu_failure;
    rtb_GreaterThan3 = !rtb_BusAssignment_n_logic_fac_speeds_failure;
    rtb_Compare_ov = !raOwnInvalid;
    FmgcComputer_MATLABFunction_a((((!rtb_BusAssignment_n_logic_fac_weights_failure) ||
      (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active)) && (rtb_GreaterThan3 ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (rtb_Compare_ov ||
      ((!FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed) &&
       (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active) &&
       (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active) &&
       (!FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active))) && (rtb_OR1_j ||
      (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active)) && (!rtb_y_if)),
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge, FmgcComputer_P.ConfirmNode_timeDelay,
      &rtb_y_if, &FmgcComputer_DWork.sf_MATLABFunction_bv);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_n, &rtb_DataTypeConversion1_j);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_i, &rtb_DataTypeConversion1_e);
    if (FmgcComputer_U.in.discrete_inputs.is_unit_1) {
      fdOwnOff = (rtb_DataTypeConversion1_j != 0U);
      fdOppOff = (rtb_DataTypeConversion1_e != 0U);
    } else {
      fdOwnOff = (rtb_DataTypeConversion1_e != 0U);
      fdOppOff = (rtb_DataTypeConversion1_j != 0U);
    }

    fdOwnOff = (rtb_y_eu && rtb_y_if && ((!fdOwnOff) || ((!fdOppOff) &&
      (!FmgcComputer_U.in.discrete_inputs.fd_opp_engaged))));
    fdOppOff = rtb_y_eu;
    rtb_BusAssignment_gk_logic_ap_fd_common_condition = rtb_y_if;
    rtb_BusAssignment_gk_logic_adr_computation_data_airspeed_computed_kn.SSM =
      rtb_adrComputationBus_airspeed_computed_kn_SSM;
    rtb_BusAssignment_gk_logic_adr_computation_data_airspeed_computed_kn.Data =
      rtb_adrComputationBus_airspeed_computed_kn_Data;
    rtb_BusAssignment_gk_logic_ir_computation_data_pitch_angle_deg.SSM = rtb_irComputationBus_pitch_angle_deg_SSM;
    rtb_BusAssignment_gk_logic_ir_computation_data_pitch_angle_deg.Data = rtb_irComputationBus_pitch_angle_deg_Data;
    rtb_BusAssignment_gk_logic_ir_computation_data_roll_angle_deg.SSM = rtb_irComputationBus_roll_angle_deg_SSM;
    rtb_BusAssignment_gk_logic_ir_computation_data_roll_angle_deg.Data = rtb_irComputationBus_roll_angle_deg_Data;
    rtb_BusAssignment_gk_logic_chosen_fac_bus_v_ls_kn.SSM = rtb_Switch_v_ls_kn_SSM;
    rtb_BusAssignment_gk_logic_chosen_fac_bus_v_ls_kn.Data = rtb_Switch_v_ls_kn_Data;
    rtb_BusAssignment_gk_logic_chosen_fac_bus_v_max_kn.SSM = rtb_Switch_v_max_kn_SSM;
    rtb_BusAssignment_gk_logic_chosen_fac_bus_v_max_kn.Data = rtb_Switch_v_max_kn_Data;
    FmgcComputer_MATLABFunction_g(FmgcComputer_U.in.discrete_inputs.fcu_ap_button, FmgcComputer_P.PulseNode_isRisingEdge,
      &rtb_y_kr, &FmgcComputer_DWork.sf_MATLABFunction_il);
    FmgcComputer_MATLABFunction_g(rtb_BusAssignment_h_logic_engine_running, FmgcComputer_P.PulseNode3_isRisingEdge,
      &rtb_y_if, &FmgcComputer_DWork.sf_MATLABFunction_jp);
    FmgcComputer_MATLABFunction_g(FmgcComputer_U.in.discrete_inputs.ap_opp_engaged,
      FmgcComputer_P.PulseNode2_isRisingEdge, &rtb_y_eu, &FmgcComputer_DWork.sf_MATLABFunction_cb);
    rtb_OR2_l_tmp = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active;
    rtb_appInop_idx_1 = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active;
    rtb_OR2_l_tmp_0 = !FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed;
    rtb_OR2_l_tmp_1 = (rtb_OR2_l_tmp_0 && rtb_appInop_idx_1);
    rtb_OR2_l = (rtb_OR2_l_tmp_1 && rtb_OR2_l_tmp);
    FmgcComputer_MATLABFunction_g(rtb_OR2_l, FmgcComputer_P.PulseNode1_isRisingEdge, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_hp);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_l, &rtb_y_gtq);
    rtb_y_c1 = (rtb_y_gtq >= FmgcComputer_P.CompareToConstant3_const);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue, &rtb_y_gtq);
    rtb_Phi_c_deg = rtb_y_gtq;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_gk_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_p, &rtb_y_pv);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_gk_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue, &rtb_y_ia);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_gk_logic_chosen_fac_bus_v_ls_kn,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue, &rtb_y_o);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_gk_logic_ir_computation_data_pitch_angle_deg,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_gk_logic_ir_computation_data_roll_angle_deg,
      FmgcComputer_P.A429ValueOrDefault6_defaultValue, &rtb_y_gtq);
    rtb_GreaterThan3_e = !rtb_irOwnInvalid;
    rtb_appInop_idx_2 = !FmgcComputer_U.in.discrete_inputs.elac_own_ap_disc;
    rtb_TmpSignalConversionAtSFunctionInport3_idx_0 = !FmgcComputer_U.in.discrete_inputs.elac_opp_ap_disc;
    apCondition = ((!FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc) && (rtb_appInop_idx_2 ||
      rtb_TmpSignalConversionAtSFunctionInport3_idx_0) && rtb_GreaterThan3_e);
    rtb_ap_inop_tmp_tmp = !fdOppOff;
    rtb_ap_inop_tmp = (rtb_ap_inop_tmp_tmp || (!rtb_BusAssignment_gk_logic_ap_fd_common_condition) || (!apCondition));
    rtb_appCapability_idx_2 = !FmgcComputer_U.in.discrete_inputs.is_unit_1;
    FmgcComputer_DWork.Memory_PreviousInput = FmgcComputer_P.Logic_table[(((static_cast<uint32_T>(rtb_y_kr &&
      (!FmgcComputer_DWork.Delay_DSTATE_p) && rtb_y_pf && rtb_BusAssignment_gk_logic_ap_fd_common_condition && fdOppOff &&
      apCondition && ((rtb_y_pv >= rtb_y_ia) && (rtb_y_ia >= rtb_y_o) && (rtb_y_p3 >=
      FmgcComputer_P.CompareToConstant_const_hu) && (rtb_y_p3 <= FmgcComputer_P.CompareToConstant1_const_bt) && (std::
      abs(rtb_y_gtq) <= FmgcComputer_P.CompareToConstant2_const_c))) << 1) + (rtb_ap_inop_tmp || (rtb_y_kr &&
      FmgcComputer_DWork.Delay_DSTATE_p) || FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc || ((rtb_y_eu &&
      rtb_OR2_l) || (FmgcComputer_U.in.discrete_inputs.ap_opp_engaged && rtb_y_nn && rtb_appCapability_idx_2)) ||
      (rtb_y_ft && (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active || rtb_y_c1 ||
                    (rtb_Phi_c_deg >= FmgcComputer_P.CompareToConstant5_const))) || (rtb_y_if && rtb_y_ft))) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput];
    FmgcComputer_MATLABFunction_a(FmgcComputer_DWork.Memory_PreviousInput, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_k, FmgcComputer_P.ConfirmNode_timeDelay_b, &rtb_y_if,
      &FmgcComputer_DWork.sf_MATLABFunction_it);
    absVsTarget = static_cast<int32_T>((((static_cast<uint32_T>(rtb_y_kr && FmgcComputer_DWork.Memory_PreviousInput) <<
      1) + ((!rtb_y_if) || FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_g);
    rtb_Logic_a2[0U] = FmgcComputer_P.Logic_table_h[static_cast<uint32_T>(absVsTarget)];
    rtb_Logic_a2[1U] = FmgcComputer_P.Logic_table_h[static_cast<uint32_T>(absVsTarget) + 8U];
    rtb_BusAssignment_i_logic_chosen_fac_bus_discrete_word_5.SSM = rtb_Switch_discrete_word_5_SSM;
    rtb_BusAssignment_i_logic_chosen_fac_bus_discrete_word_5.Data = rtb_Switch_discrete_word_5_Data;
    FmgcComputer_MATLABFunction_a(FmgcComputer_U.in.discrete_inputs.athr_instinctive_disc, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode1_isRisingEdge_n, FmgcComputer_P.ConfirmNode1_timeDelay_l, &rtb_y_if,
      &FmgcComputer_DWork.sf_MATLABFunction_kz);
    FmgcComputer_DWork.Memory_PreviousInput_g1 = FmgcComputer_P.Logic_table_f[(((static_cast<uint32_T>(rtb_y_if) << 1) +
      FmgcComputer_P.Constant_Value_e) << 1) + FmgcComputer_DWork.Memory_PreviousInput_g1];
    FmgcComputer_MATLABFunction_g(FmgcComputer_U.in.discrete_inputs.fcu_athr_button,
      FmgcComputer_P.PulseNode_isRisingEdge_k, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_o1);
    FmgcComputer_MATLABFunction_a((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active), FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode2_isRisingEdge, FmgcComputer_P.ConfirmNode2_timeDelay, &rtb_y_eu,
      &FmgcComputer_DWork.sf_MATLABFunction_mn);
    FmgcComputer_MATLABFunction_g(rtb_y_eu, FmgcComputer_P.PulseNode1_isRisingEdge_h, &rtb_Compare_bj,
      &FmgcComputer_DWork.sf_MATLABFunction_jt);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_n, &rtb_y_gtq);
    rtb_y_if = (rtb_y_gtq < FmgcComputer_P.CompareToConstant_const_o);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_p, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_g((rtb_y_if && (rtb_y_gtq < FmgcComputer_P.CompareToConstant1_const)),
      FmgcComputer_P.PulseNode2_isRisingEdge_n, &rtb_y_mi, &FmgcComputer_DWork.sf_MATLABFunction_d4);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_i_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel_bit_g, &rtb_y_jm);
    FmgcComputer_MATLABFunction_g((rtb_y_jm != 0U), FmgcComputer_P.PulseNode3_isRisingEdge_a, &rtb_y_kr,
      &FmgcComputer_DWork.sf_MATLABFunction_ga);
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.fmgc_opp_mode_sync &&
      (!FmgcComputer_U.in.discrete_inputs.athr_opp_engaged)), FmgcComputer_P.PulseNode4_isRisingEdge, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_e5);
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active,
      FmgcComputer_P.PulseNode5_isRisingEdge, &rtb_y_eu, &FmgcComputer_DWork.sf_MATLABFunction_ag);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.ecu_status_word_3,
      FmgcComputer_P.BitfromLabel1_bit_iq, &rtb_y_jm);
    rtb_y_c1 = (rtb_y_jm != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.ecu_status_word_3,
      FmgcComputer_P.BitfromLabel2_bit_b, &rtb_y_jm);
    FmgcComputer_MATLABFunction_a((((!rtb_y_c1) || (rtb_y_jm == 0U)) && FmgcComputer_DWork.Delay_DSTATE_k),
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode3_isRisingEdge, FmgcComputer_P.ConfirmNode3_timeDelay,
      &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_dx);
    rtb_y_if = ((FmgcComputer_DWork.Delay_DSTATE.manual_spd_control_active ||
                 FmgcComputer_DWork.Delay_DSTATE.auto_spd_control_active) &&
                (!FmgcComputer_DWork.Memory_PreviousInput_g1) && rtb_OR1_j && rtb_GreaterThan3);
    rtb_ap_inop_tmp_tmp = (rtb_ap_inop_tmp_tmp || (!rtb_y_if));
    FmgcComputer_DWork.Delay_DSTATE_k = FmgcComputer_P.Logic_table_n[(((static_cast<uint32_T>(fdOppOff && rtb_y_if &&
      ((rtb_y_jt && ((rtb_raComputationData_radio_height_ft_Data > 100.0F) || raOwnInvalid)) || rtb_Compare_bj ||
       rtb_y_kr || rtb_y_eu)) << 1) + (rtb_ap_inop_tmp_tmp || rtb_y_nn || (FmgcComputer_DWork.Delay_DSTATE_k && rtb_y_jt
      && (!rtP_fmgc_ap_fd_logic_output_MATLABStruct.lateral_modes.land_active)) ||
      FmgcComputer_U.in.discrete_inputs.athr_instinctive_disc || rtb_y_mi || rtb_NOT_b)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_p];
    rtb_Compare_gc = !rtb_Logic_a2[0];
    rtb_y_if = !fdOwnOff;
    rtb_y_ju = !FmgcComputer_DWork.Delay_DSTATE_k;
    rtb_y_jt = (FmgcComputer_U.in.discrete_inputs.ap_opp_engaged || FmgcComputer_U.in.discrete_inputs.fd_opp_engaged);
    rtb_y_eu = (rtb_y_jt || FmgcComputer_U.in.discrete_inputs.athr_opp_engaged);
    rtb_y_if = ((rtb_appCapability_idx_2 || (rtb_Compare_gc && (FmgcComputer_U.in.discrete_inputs.ap_opp_engaged ||
      rtb_y_if) && (rtb_y_jt || rtb_y_ju) && rtb_y_eu)) && (FmgcComputer_U.in.discrete_inputs.is_unit_1 ||
      ((rtb_Compare_gc || FmgcComputer_U.in.discrete_inputs.ap_opp_engaged) && (rtb_y_jt || rtb_y_if) && (rtb_y_eu ||
      rtb_y_ju) && (rtb_Logic_a2[0] || fdOwnOff || FmgcComputer_DWork.Delay_DSTATE_k ||
                    (!FmgcComputer_U.in.discrete_inputs.fmgc_opp_healthy)))));
    rtb_y_nn = !FmgcComputer_U.in.discrete_inputs.ap_opp_engaged;
    rtb_OR2_l = (rtb_y_if && (rtb_Compare_gc || rtb_y_nn));
    rtb_y_gb = (rtb_Logic_a2[0] || FmgcComputer_U.in.discrete_inputs.ap_opp_engaged || fdOwnOff ||
                FmgcComputer_U.in.discrete_inputs.fd_opp_engaged);
    FmgcComputer_MATLABFunction_g(rtb_BusAssignment_h_logic_engine_running, FmgcComputer_P.PulseNode3_isRisingEdge_f,
      &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_p2o);
    rtb_appCapability_idx_2 = !rtb_y_gb;
    rtb_AND10_b = (rtb_appCapability_idx_2 || (rtb_Compare_bj && rtb_y_ft));
    rtb_BusAssignment_m_logic_adr_computation_data_vertical_speed_ft_min.SSM =
      rtb_adrComputationBus_vertical_speed_ft_min_SSM;
    rtb_BusAssignment_m_logic_adr_computation_data_vertical_speed_ft_min.Data =
      rtb_adrComputationBus_vertical_speed_ft_min_Data;
    apCondition = rtb_y_gb;
    rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset = rtb_AND10_b;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel1_bit_c, &rtb_DataTypeConversion1_e);
    rtb_NOT_oj = (rtb_DataTypeConversion1_e == 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel3_bit_m, &rtb_DataTypeConversion1_e);
    rtb_y_c1 = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel4_bit_p, &rtb_DataTypeConversion1_e);
    rtb_y_c1 = ((!rtb_NOT_oj) || (!rtb_y_c1) || (rtb_DataTypeConversion1_e == 0U));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel2_bit_a, &rtb_DataTypeConversion1_e);
    rtb_NOT_oj = (rtb_DataTypeConversion1_e != 0U);
    rtb_DataTypeConversion2_kb = std::round(FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory.Data);
    if (rtb_DataTypeConversion2_kb < 4.2949673E+9F) {
      if (rtb_DataTypeConversion2_kb >= 0.0F) {
        rtb_y_jm = static_cast<uint32_T>(rtb_DataTypeConversion2_kb);
      } else {
        rtb_y_jm = 0U;
      }
    } else {
      rtb_y_jm = MAX_uint32_T;
    }

    absVsTarget = static_cast<int32_T>(((rtb_y_jm & 64512U) >> 10) * 100U);
    if (absVsTarget != 0) {
      absVsTarget += 200;
    } else {
      absVsTarget = 0;
    }

    FmgcComputer_MATLABFunction(&rtb_BusAssignment_m_logic_adr_computation_data_vertical_speed_ft_min,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_c, &rtb_y_pv);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel5_bit_b, &rtb_DataTypeConversion1_e);
    rtb_OR1_j = !rtb_y_c1;
    if (rtb_OR1_j || (rtb_DataTypeConversion1_e == 0U)) {
      FmgcComputer_B.u_lyjjlj = rtb_y_pv;
    }

    if (rtb_y_c1) {
      if (rtb_NOT_oj) {
        rtb_Phi_c_deg = -static_cast<real_T>(absVsTarget);
      } else {
        rtb_Phi_c_deg = absVsTarget;
      }
    } else {
      rtb_Phi_c_deg = FmgcComputer_B.u_lyjjlj;
    }

    rtb_y_lh_0 = !rtb_NOT1_i;
    FmgcComputer_MATLABFunction_m3((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active && rtb_y_lh_0),
      FmgcComputer_U.in.time.dt, &rtb_NOT_b, FmgcComputer_P.MTrigNode_isRisingEdge_j,
      FmgcComputer_P.MTrigNode_retriggerable_o, FmgcComputer_P.MTrigNode_triggerDuration_b,
      &FmgcComputer_DWork.sf_MATLABFunction_an);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_i, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_l,
      &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_bz);
    FmgcComputer_DWork.Memory_PreviousInput_e = FmgcComputer_P.Logic_table_l[(((static_cast<uint32_T>
      (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active && rtb_Compare_bj) << 1) +
      FmgcComputer_DWork.Delay_DSTATE_o) << 1) + FmgcComputer_DWork.Memory_PreviousInput_e];
    rtb_Compare_bb = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active;
    FmgcComputer_DWork.Delay_DSTATE_o = (FmgcComputer_DWork.Memory_PreviousInput_e && rtb_Compare_bb);
    FmgcComputer_MATLABFunction_m3(FmgcComputer_DWork.Delay_DSTATE_o, FmgcComputer_U.in.time.dt, &rtb_y_jt,
      FmgcComputer_P.MTrigNode1_isRisingEdge, FmgcComputer_P.MTrigNode1_retriggerable,
      FmgcComputer_P.MTrigNode1_triggerDuration, &FmgcComputer_DWork.sf_MATLABFunction_g0);
    FmgcComputer_MATLABFunction_m3((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active &&
      (FmgcComputer_DWork.Delay_DSTATE.armed_modes.clb_armed || FmgcComputer_DWork.Delay_DSTATE.armed_modes.des_armed ||
       FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed ||
       FmgcComputer_DWork.Delay_DSTATE.armed_modes.glide_armed ||
       FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_armed)), FmgcComputer_U.in.time.dt, &rtb_Compare_bj,
      FmgcComputer_P.MTrigNode2_isRisingEdge, FmgcComputer_P.MTrigNode2_retriggerable,
      FmgcComputer_P.MTrigNode2_triggerDuration, &FmgcComputer_DWork.sf_MATLABFunction_pl4);
    rtb_BusAssignment_j_logic_altitude_indicated_ft.SSM = rtb_fm_weight_lbs_SSM;
    rtb_BusAssignment_j_logic_altitude_indicated_ft.Data = rtb_Max_a;
    rtb_NOT_oj = rtb_y_c1;
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_m, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_j_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_c, &rtb_y_gtq);
    rtb_y_c1 = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active);
    rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    rtb_AND_j = (rtb_y_c1 && FmgcComputer_DWork.Delay_DSTATE.alt_cstr_applicable &&
                 rtb_TmpSignalConversionAtSFunctionInport3_idx_1 &&
                 FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid);
    if (rtb_y_p3 > rtb_y_gtq) {
      rtb_GreaterThan3 = ((FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft < rtb_y_p3) &&
                          ((FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft + 250.0 > rtb_y_gtq) || rtb_AND_j));
    } else {
      rtb_GreaterThan3 = ((FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft > rtb_y_p3) &&
                          ((FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft - 250.0 < rtb_y_gtq) || rtb_AND_j));
    }

    rtb_AND_j = ((FmgcComputer_DWork.Delay_DSTATE.armed_modes.clb_armed ||
                  FmgcComputer_DWork.Delay_DSTATE.armed_modes.des_armed ||
                  FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
                  FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active || rtb_AND_j) &&
                 (FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft != 0.0) && rtb_GreaterThan3);
    if (rtb_AND_j) {
      rtb_altCstrOrFcu = FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft;
    } else {
      rtb_altCstrOrFcu = rtb_y_p3;
    }

    rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target = rtb_Phi_c_deg;
    rtb_BusAssignment_hk_ap_fd_logic_trk_fpa_deselected = rtb_y_jt;
    rtb_BusAssignment_hk_ap_fd_logic_longi_large_box_tcas = rtb_Compare_bj;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel_bit_c, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_a(rtb_y_ft, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_h,
      FmgcComputer_P.ConfirmNode_timeDelay_i, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_hz);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_l2, &rtb_y_gtq);
    rtb_y_ov = (rtb_y_gtq < FmgcComputer_P.CompareToConstant3_const_n);
    rtb_NOT3 = !rtb_y_ov;
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_flex_temp_deg, &rtb_y_l1);
    rtb_y_l1 = (rtb_y_ov && (rtb_y_gtq > FmgcComputer_P.CompareToConstant4_const) && rtb_y_l1);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_b, &rtb_y_gtq);
    rtb_y_ov = (rtb_y_gtq < FmgcComputer_P.CompareToConstant5_const_a);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_flex_temp_deg, &rtb_y_g);
    FmgcComputer_MATLABFunction_g((rtb_NOT3 || rtb_y_l1 || (!rtb_y_ov) || (rtb_y_ov && (rtb_y_gtq >
      FmgcComputer_P.CompareToConstant6_const) && rtb_y_g)), FmgcComputer_P.PulseNode_isRisingEdge_p, &rtb_Compare_bj,
      &FmgcComputer_DWork.sf_MATLABFunction_gk);
    rtb_y_g = !rtb_OR2_l;
    rtb_TmpSignalConversionAtSFunctionInport3_idx_2 =
      !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active;
    rtb_NOT3_tmp = (rtb_y_g && rtb_TmpSignalConversionAtSFunctionInport3_idx_2);
    rtb_NOT3 = (((FmgcComputer_U.in.fms_inputs.v_2_kts > FmgcComputer_P.CompareToConstant1_const_k) &&
                 (rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_NOT3_tmp && rtb_OR2_l_tmp && rtb_y_jt &&
      (FmgcComputer_U.in.fms_inputs.v_2_kts > FmgcComputer_P.CompareToConstant2_const) && (rtb_handleIndex >=
      FmgcComputer_P.CompareToConstant_const_b) && rtb_Compare_bj));
    FmgcComputer_MATLABFunction_a(rtb_NOT3, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_c,
      FmgcComputer_P.ConfirmNode_timeDelay_h, &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_fx);
    rtb_Compare_kg = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
                      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active);
    Memory_PreviousInput_k_tmp_tmp_tmp = (rtb_Compare_kg ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active);
    Memory_PreviousInput_k_tmp_tmp = (Memory_PreviousInput_k_tmp_tmp_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active);
    rtb_Compare_d0 = (Memory_PreviousInput_k_tmp_tmp ||
                      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active);
    FmgcComputer_DWork.Memory_PreviousInput_k = FmgcComputer_P.Logic_table_b[(((rtb_AND10_b || ((rtb_Compare_d0 ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_Compare_bj))) + (static_cast<uint32_T>
      (rtb_NOT3) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_k];
    rtb_BusAssignment_f4_logic_ir_computation_data_heading_magnetic_deg.SSM =
      rtb_irComputationBus_heading_magnetic_deg_SSM;
    rtb_BusAssignment_f4_logic_ir_computation_data_heading_magnetic_deg.Data =
      rtb_irComputationBus_heading_magnetic_deg_Data;
    rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg.SSM = rtb_Switch9;
    rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg.Data = rtb_Switch_i_runway_heading_deg_Data;
    rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg.SSM = rtb_y;
    rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg.Data = rtb_DataTypeConversion2_bh;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_m, &rtb_DataTypeConversion1_e);
    rtb_y_ov = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_g, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_a(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active,
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge_f, FmgcComputer_P.ConfirmNode1_timeDelay_ex,
      &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_ngt);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_f4_logic_ils_computation_data_runway_heading_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_m, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_f4_logic_ir_computation_data_heading_magnetic_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_o, &rtb_y_gtq);
    rtb_DataTypeConversion2_kb = std::abs(rtb_y_p3 - rtb_y_gtq);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_e, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_ie(&rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg, &rtb_NOT3);
    FmgcComputer_MATLABFunction_a(rtb_y_ft, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_p,
      FmgcComputer_P.ConfirmNode_timeDelay_o, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_fm);
    if (rtb_y_gtq < 0.0F) {
      rtb_DataTypeConversion8 = -rtb_y_gtq;
    } else {
      rtb_DataTypeConversion8 = rtb_y_gtq;
    }

    rtb_NOT3 = ((rtb_y_ov && (rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g &&
      (!FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active) && ((rtb_handleIndex >=
      FmgcComputer_P.CompareToConstant_const_cq) && rtb_Compare_bj && (rtb_DataTypeConversion2_kb <=
      FmgcComputer_P.CompareToConstant2_const_b) && (rtb_DataTypeConversion8 < FmgcComputer_P.CompareToConstant1_const_i)
      && FmgcComputer_P.Constant_Value_j && rtb_NOT3 && rtb_y_jt)));
    FmgcComputer_MATLABFunction_a(rtb_NOT3, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_l,
      FmgcComputer_P.ConfirmNode_timeDelay_f, &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_jl);
    FmgcComputer_MATLABFunction_ie(&rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg, &rtb_y_l1);
    FmgcComputer_DWork.Memory_PreviousInput_c = FmgcComputer_P.Logic_table_hz[(((((!rtb_Compare_bj) &&
      (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_trk_submode_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_AND10_b || (!rtb_y_l1)) +
      (static_cast<uint32_T>(rtb_NOT3) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_c];
    rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_f, &rtb_DataTypeConversion1_e);
    rtb_y_ov = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_n, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_g((rtb_y_gtq >= FmgcComputer_P.CompareToConstant_const_l0),
      FmgcComputer_P.PulseNode_isRisingEdge_b, &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_fh);
    FmgcComputer_MATLABFunction_m3(rtb_Compare_bj, FmgcComputer_U.in.time.dt, &rtb_y_jt,
      FmgcComputer_P.MTrigNode_isRisingEdge_jv, FmgcComputer_P.MTrigNode_retriggerable_p,
      FmgcComputer_P.MTrigNode_triggerDuration_n, &FmgcComputer_DWork.sf_MATLABFunction_mnt);
    rtb_NOT3_tmp_0 = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active;
    rtb_NOT3 = ((rtb_y_ov && (rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g && (rtb_NOT3_tmp_0 &&
      (!FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed)) && rtb_y_jt));
    FmgcComputer_MATLABFunction_a(rtb_NOT3, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_hu,
      FmgcComputer_P.ConfirmNode_timeDelay_j, &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_kz1);
    FmgcComputer_DWork.Memory_PreviousInput_b = FmgcComputer_P.Logic_table_d[(((((!rtb_Compare_bj) &&
      (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_AND10_b) + (static_cast<uint32_T>(rtb_NOT3) <<
      1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_b];
    rtb_NOT3 = rtb_NOT_b;
    rtb_y_l1 = (FmgcComputer_DWork.Memory_PreviousInput_c || FmgcComputer_DWork.Memory_PreviousInput_b);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_k, &rtb_DataTypeConversion1_e);
    rtb_y_eu = ((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_br, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_l, &rtb_NOT_b,
      &FmgcComputer_DWork.sf_MATLABFunction_hh);
    FmgcComputer_MATLABFunction_a(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_f, FmgcComputer_P.ConfirmNode_timeDelay_d, &rtb_Compare_bj,
      &FmgcComputer_DWork.sf_MATLABFunction_ha);
    rtb_OR_iw = !rtb_BusAssignment_h_logic_engine_running;
    rtb_AND1_c0 = !rtb_BusAssignment_o_logic_ils_failure;
    rtb_y_ja = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active;
    rtb_y_mi = ((FmgcComputer_U.in.fms_inputs.selected_approach_type == FmgcComputer_P.EnumeratedConstant_Value_a) &&
                rtb_AND1_c0 && (rtb_OR_iw || (rtb_y_gtq >= FmgcComputer_P.CompareToConstant_const_gv)) && rtb_Compare_ov
                && rtb_NOT_b && (!rtb_Compare_bj) && (rtb_y_ja &&
      (!FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed)));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.ils_frequency_mhz,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_ek, &rtb_y_pv);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.ils_own_bus.ils_frequency_mhz,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_f, &rtb_y_o);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.ils_opp_bus.runway_heading_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_c, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.ils_own_bus.runway_heading_deg,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_o, &rtb_y_gtq);
    rtb_GreaterThan3 = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
                        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active);
    rtb_y_eg_tmp = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active), FmgcComputer_P.PulseNode2_isRisingEdge_e,
      &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_kb);
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active), FmgcComputer_P.PulseNode3_isRisingEdge_j,
      &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_eb2);
    rtb_AND8 = (rtb_y_eg_tmp && rtb_Compare_bj);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_l, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_c,
      &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_es);
    rtb_y_ov = !FmgcComputer_P.Constant2_Value_p;
    Memory_PreviousInput_l_tmp = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active;
    Memory_PreviousInput_l_tmp_0 = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active;
    FmgcComputer_DWork.Memory_PreviousInput_l = FmgcComputer_P.Logic_table_k[(((static_cast<uint32_T>(rtb_appInop_idx_1 &&
      (rtb_y_eu || (rtb_y_g && rtb_y_mi && rtb_TmpSignalConversionAtSFunctionInport3_idx_2 && rtb_OR2_l_tmp &&
                    Memory_PreviousInput_l_tmp && Memory_PreviousInput_l_tmp_0 && rtb_y_ov && rtb_y_ov && (((rtb_y_pv ==
      rtb_y_o) && (rtb_y_p3 == rtb_y_gtq)) || (!rtb_BusAssignment_o_logic_both_ils_valid))))) << 1) + (rtb_y_g3 ||
      ((!rtb_GreaterThan3) && (!rtb_y_eg_tmp) && FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed) ||
      ((rtb_GreaterThan3 && rtb_y_jt) || rtb_AND8) || (rtb_NOT_b &&
      FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed) || rtb_Compare_bj || rtb_AND10_b ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_l];
    FmgcComputer_MATLABFunction_a(!FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_e, FmgcComputer_P.ConfirmNode_timeDelay_l, &rtb_y_jt,
      &FmgcComputer_DWork.sf_MATLABFunction_mq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel_bit_ff, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_a((rtb_y_gtq < FmgcComputer_P.CompareToConstant_const_dt), FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode1_isRisingEdge_g, FmgcComputer_P.ConfirmNode1_timeDelay_d, &rtb_Compare_bj,
      &FmgcComputer_DWork.sf_MATLABFunction_cr);
    rtb_y_eu = (rtb_y_jt && (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g &&
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active &&
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active && rtb_Compare_bj)));
    FmgcComputer_MATLABFunction_a(rtb_y_eu, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_d,
      FmgcComputer_P.ConfirmNode_timeDelay_a, &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_op);
    rtb_y_mi = !rtb_Compare_bj;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_ft, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_a,
      &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_fa);
    FmgcComputer_MATLABFunction_a(rtb_y_ft, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode2_isRisingEdge_l,
      FmgcComputer_P.ConfirmNode2_timeDelay_b, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_fo0);
    Memory_PreviousInput_d_tmp_tmp = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active);
    rtb_AND8 = (Memory_PreviousInput_d_tmp_tmp || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active);
    Memory_PreviousInput_d_tmp = (rtb_AND8 || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active);
    FmgcComputer_DWork.Memory_PreviousInput_d = FmgcComputer_P.Logic_table_p[(((((rtb_Compare_d0 ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active || (Memory_PreviousInput_d_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active)) && rtb_y_mi) ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active || (rtb_Compare_gc && rtb_y_nn &&
      rtb_Compare_bj && rtb_y_jt) || rtb_AND10_b) + (static_cast<uint32_T>(rtb_y_eu) << 1)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_d];
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_y_nn = (FmgcComputer_U.in.discrete_inputs.bscu_opp_valid || FmgcComputer_U.in.discrete_inputs.bscu_own_valid);
    FmgcComputer_MATLABFunction_a((FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active && (rtb_y_gtq <=
      FmgcComputer_P.CompareToConstant2_const_i0) && (((FmgcComputer_U.in.discrete_inputs.left_wheel_spd_abv_70_kts ||
      FmgcComputer_U.in.discrete_inputs.right_wheel_spd_abv_70_kts) && rtb_y_nn) || ((!rtb_y_nn) && rtb_y_ft))),
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge_bk, FmgcComputer_P.ConfirmNode1_timeDelay_ef,
      &rtb_y_eu, &FmgcComputer_DWork.sf_MATLABFunction_mb);
    FmgcComputer_DWork.Memory_PreviousInput_m = FmgcComputer_P.Logic_table_m[(((static_cast<uint32_T>(rtb_y_eu) << 1) +
      rtb_appInop_idx_1) << 1) + FmgcComputer_DWork.Memory_PreviousInput_m];
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_GreaterThan3_e = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active && (rtb_y_gtq <=
      FmgcComputer_P.CompareToConstant1_const_ht) && rtb_GreaterThan3_e);
    rtb_y_eu = (rtb_Compare_ov && FmgcComputer_DWork.Delay2_DSTATE.flare_law.condition_Flare &&
                FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active);
    FmgcComputer_MATLABFunction_a(rtb_y_eu, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge_d,
      FmgcComputer_P.ConfirmNode1_timeDelay_dj, &rtb_y_mi, &FmgcComputer_DWork.sf_MATLABFunction_j2);
    FmgcComputer_DWork.Memory_PreviousInput_bc = FmgcComputer_P.Logic_table_bp[(((static_cast<uint32_T>(rtb_y_mi) << 1)
      + rtb_appInop_idx_1) << 1) + FmgcComputer_DWork.Memory_PreviousInput_bc];
    rtb_y_eu = (rtb_y_eu || FmgcComputer_DWork.Memory_PreviousInput_bc);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_l, &rtb_DataTypeConversion1_e);
    rtb_y_ov = ((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l);
    rtb_y_g3 = (FmgcComputer_U.in.fms_inputs.selected_approach_type == FmgcComputer_P.EnumeratedConstant_Value_f);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_na_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_NOT_b = rtb_OR2_l_tmp;
    FmgcComputer_MATLABFunction_a(FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_le, FmgcComputer_P.ConfirmNode_timeDelay_n, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_pu);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_e, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_h, &rtb_y_kr,
      &FmgcComputer_DWork.sf_MATLABFunction_d3);
    rtb_AND12 = (rtb_y_g && FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid);
    rtb_y_nn = (rtb_AND12 && FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid && rtb_y_g3 && (rtb_OR_iw ||
      (rtb_y_gtq >= FmgcComputer_P.CompareToConstant_const_lj) || raOwnInvalid) && rtb_OR2_l_tmp_0 &&
                (rtb_TmpSignalConversionAtSFunctionInport3_idx_2 && Memory_PreviousInput_l_tmp && rtb_OR2_l_tmp &&
                 Memory_PreviousInput_l_tmp_0 && rtb_y_ja && (!rtb_y_nn) && rtb_y_kr));
    rtb_GreaterThan3 = (rtb_appInop_idx_1 && (rtb_y_ov || rtb_y_nn));
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active), FmgcComputer_P.PulseNode3_isRisingEdge_k, &rtb_NOT_b,
      &FmgcComputer_DWork.sf_MATLABFunction_bbv);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_o, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_li,
      &rtb_y_ov, &FmgcComputer_DWork.sf_MATLABFunction_bk);
    rtb_Compare_d0 = !FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid;
    FmgcComputer_DWork.Memory_PreviousInput_dv = FmgcComputer_P.Logic_table_c
      [(((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
          FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active || rtb_Compare_d0 || rtb_NOT_b ||
          (rtb_y_kr && FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed) || rtb_y_ov || rtb_AND10_b ||
          FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active) + (static_cast<uint32_T>(rtb_GreaterThan3) <<
          1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_dv];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel_bit_a, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g &&
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active &&
      FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed && FmgcComputer_U.in.fms_inputs.final_app_can_engage &&
      (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant_Value_i)));
    FmgcComputer_MATLABFunction_a(rtb_y_jt, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ha,
      FmgcComputer_P.ConfirmNode_timeDelay_on, &rtb_y_nn, &FmgcComputer_DWork.sf_MATLABFunction_mm);
    absVsTarget_tmp = (rtb_Compare_kg || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active);
    absVsTarget_tmp_tmp = (absVsTarget_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active);
    rtb_y_kr = (absVsTarget_tmp_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active);
    absVsTarget = static_cast<int32_T>((((rtb_AND10_b || ((rtb_y_kr ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_nn))) + (static_cast<uint32_T>(rtb_y_jt) <<
      1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_f);
    rtb_Logic_b[0U] = FmgcComputer_P.Logic_table_pl[static_cast<uint32_T>(absVsTarget)];
    rtb_Logic_b[1U] = FmgcComputer_P.Logic_table_pl[static_cast<uint32_T>(absVsTarget) + 8U];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel_bit_cs, &rtb_DataTypeConversion1_e);
    rtb_GreaterThan3 = rtb_OR2_l_tmp;
    FmgcComputer_MATLABFunction_a(rtb_y_ft, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_m,
      FmgcComputer_P.ConfirmNode_timeDelay_j5, &rtb_y_g3, &FmgcComputer_DWork.sf_MATLABFunction_hvs);
    rtb_y_ov = (rtb_handleIndex >= FmgcComputer_P.CompareToConstant_const_ja);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_p, &rtb_y_gtq);
    rtb_y_jt = (rtb_y_gtq >= FmgcComputer_P.CompareToConstant3_const_i);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_d, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_g((rtb_y_jt || (rtb_y_gtq >= FmgcComputer_P.CompareToConstant5_const_k)),
      FmgcComputer_P.PulseNode_isRisingEdge_c, &rtb_y_nn, &FmgcComputer_DWork.sf_MATLABFunction_fn5);
    rtb_OR_iw = (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_NOT3_tmp && rtb_OR2_l_tmp && (!rtb_y_g3) &&
      rtb_y_ov && rtb_y_nn));
    FmgcComputer_MATLABFunction_a(rtb_OR_iw, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_hj,
      FmgcComputer_P.ConfirmNode_timeDelay_a3, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_lml);
    FmgcComputer_DWork.Memory_PreviousInput_i = FmgcComputer_P.Logic_table_o[((((rtb_AND10_b ||
      (Memory_PreviousInput_k_tmp_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
       FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) && (!rtb_y_jt)) + (static_cast<uint32_T>(rtb_OR_iw) <<
      1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_i];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_e, &rtb_DataTypeConversion1_e);
    rtb_y_jt = rtb_y_g;
    FmgcComputer_MATLABFunction_m3(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active,
      FmgcComputer_U.in.time.dt, &rtb_GreaterThan3, FmgcComputer_P.MTrigNode_isRisingEdge_d,
      FmgcComputer_P.MTrigNode_retriggerable_h, FmgcComputer_P.MTrigNode_triggerDuration_a,
      &FmgcComputer_DWork.sf_MATLABFunction_e3);
    rtb_OR_iw = (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g && (Memory_PreviousInput_l_tmp_0 &&
      rtb_NOT3_tmp_0 && (!FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active) &&
      (!FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active) && rtb_GreaterThan3)));
    FmgcComputer_MATLABFunction_a(rtb_OR_iw, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_mf,
      FmgcComputer_P.ConfirmNode_timeDelay_dw, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_mtz);
    FmgcComputer_DWork.Memory_PreviousInput_el = FmgcComputer_P.Logic_table_c2[(((rtb_AND10_b ||
      ((FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
        FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>(rtb_OR_iw) <<
      1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_el];
    rtb_BusAssignment_cp_logic_ra_computation_data_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    rtb_BusAssignment_cp_logic_ra_computation_data_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active), FmgcComputer_P.PulseNode3_isRisingEdge_l, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_gb);
    rtb_NOT_g_tmp = (Memory_PreviousInput_l_tmp && Memory_PreviousInput_l_tmp_0);
    rtb_NOT_b = (rtb_NOT_g_tmp && rtb_NOT3_tmp_0 && rtb_appInop_idx_1);
    rtb_GreaterThan3_tmp = ((!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active) &&
      (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active));
    Memory_PreviousInput_k_tmp_tmp = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active;
    rtb_GreaterThan3 = (rtb_GreaterThan3_tmp && (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active) &&
                        (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active) &&
                        (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active) &&
                        (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active) &&
                        Memory_PreviousInput_k_tmp_tmp &&
                        (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel4_bit_k, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_m3((rtb_DataTypeConversion1_e != 0U), FmgcComputer_U.in.time.dt, &rtb_y_nn,
      FmgcComputer_P.MTrigNode_isRisingEdge_g, FmgcComputer_P.MTrigNode_retriggerable_f,
      FmgcComputer_P.MTrigNode_triggerDuration_bm, &FmgcComputer_DWork.sf_MATLABFunction_aw);
    rtb_OR_iw = (rtb_y_eg_tmp && rtb_y_ov && rtb_NOT_b && rtb_GreaterThan3 && (!rtb_y_nn));
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active), FmgcComputer_P.PulseNode5_isRisingEdge_h,
      &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_aj);
    rtb_y_jt = rtb_y_eg_tmp;
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode2_isRisingEdge_b, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_at);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel5_bit_f, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_j, &rtb_y_jt,
      &FmgcComputer_DWork.sf_MATLABFunction_o3);
    rtb_OR2_l_tmp_0 = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active;
    rtb_AND10_b = !FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active;
    rtb_NOT3_tmp = !FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid;
    rtb_Compare_bj = ((FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active && rtb_NOT3_tmp && rtb_y_ja) ||
                      rtb_OR_iw || (rtb_GreaterThan3 && rtb_NOT_b &&
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active && (rtb_NOT_g_tmp && rtb_OR2_l_tmp_0 && rtb_AND10_b &&
      rtb_appInop_idx_1)) || (rtb_y_eg_tmp && rtb_OR2_l_tmp_1 && rtb_y_nn) ||
                      (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active &&
                       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active && rtb_y_jt));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_pg, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_ok, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (rtb_y_jt || (rtb_DataTypeConversion1_e != 0U));
    rtb_NOT_b = rtb_y_g;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit_i, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_i, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_di2);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_cp_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_GreaterThan3 = (rtb_y_pf && rtb_y_nn && rtb_appInop_idx_1 && (Memory_PreviousInput_l_tmp_0 || (rtb_y_gtq >=
      FmgcComputer_P.CompareToConstant_const_a)));
    rtb_y_ov = rtb_OR_i;
    FmgcComputer_MATLABFunction_g(rtb_y_gb, FmgcComputer_P.PulseNode4_isRisingEdge_e, &rtb_y_g3,
      &FmgcComputer_DWork.sf_MATLABFunction_a5);
    rtb_y_gb = !FmgcComputer_DWork.Delay_DSTATE.any_lateral_mode_engaged;
    rtb_y_nn = (rtb_y_gb && rtb_OR2_l_tmp);
    rtb_y_jt = ((rtb_y_jt && rtb_OR2_l) || (rtb_y_g && (rtb_GreaterThan3 || (rtb_OR_i && rtb_y_g3 && rtb_y_nn) ||
      rtb_Compare_bj)));
    FmgcComputer_MATLABFunction_a(rtb_y_jt, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_a,
      FmgcComputer_P.ConfirmNode_timeDelay_a2, &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_hdw);
    FmgcComputer_DWork.Memory_PreviousInput_f2 = FmgcComputer_P.Logic_table_i[(((((!rtb_NOT_b) && (rtb_AND8 ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset)
      + (static_cast<uint32_T>(rtb_y_jt) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_f2];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_k, &rtb_DataTypeConversion1_e);
    rtb_OR_iw = ((rtb_DataTypeConversion1_e != 0U) && FmgcComputer_DWork.Memory_PreviousInput_f2);
    rtb_y_mi = (FmgcComputer_DWork.Memory_PreviousInput_f2 && (rtb_DataTypeConversion1_e == 0U));
    rtb_AND8 = rtb_Compare_bj;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_fu, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit_m, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_j, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_m1w);
    FmgcComputer_MATLABFunction_g(FmgcComputer_U.in.fms_inputs.direct_to_nav_engage,
      FmgcComputer_P.PulseNode7_isRisingEdge, &rtb_y_ov, &FmgcComputer_DWork.sf_MATLABFunction_hy);
    rtb_GreaterThan3 = !FmgcComputer_U.in.fms_inputs.nav_capture_condition;
    Memory_PreviousInput_l_tmp = (rtb_OR2_l_tmp_0 && rtb_AND10_b && rtb_appInop_idx_1);
    rtb_y_jt = (Memory_PreviousInput_l_tmp && (rtb_y_nn || (rtb_y_ov && rtb_GreaterThan3)));
    FmgcComputer_MATLABFunction_g(FmgcComputer_U.in.fms_inputs.lateral_flight_plan_valid,
      FmgcComputer_P.PulseNode3_isRisingEdge_e, &rtb_GreaterThan3, &FmgcComputer_DWork.sf_MATLABFunction_hu);
    rtb_NOT_g_tmp = !FmgcComputer_DWork.Delay_DSTATE.hdg_trk_preset_available;
    rtb_NOT_b = (rtb_NOT_g_tmp || rtb_GreaterThan3);
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed,
      FmgcComputer_P.PulseNode4_isRisingEdge_b, &rtb_y_ov, &FmgcComputer_DWork.sf_MATLABFunction_idz);
    FmgcComputer_MATLABFunction_m3(FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active,
      FmgcComputer_U.in.time.dt, &rtb_y_nn, FmgcComputer_P.MTrigNode_isRisingEdge_i,
      FmgcComputer_P.MTrigNode_retriggerable_a, FmgcComputer_P.MTrigNode_triggerDuration_l,
      &FmgcComputer_DWork.sf_MATLABFunction_fi);
    rtb_GreaterThan3 = rtb_NOT_g_tmp;
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || (rtb_AND12 && (rtb_y_jt || (rtb_y_ft && rtb_NOT_b && (rtb_y_gb ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active)) || rtb_y_ov || (rtb_y_nn && rtb_NOT_g_tmp))));
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Delay_DSTATE.hdg_trk_preset_available,
      FmgcComputer_P.PulseNode2_isRisingEdge_i, &rtb_y_nn, &FmgcComputer_DWork.sf_MATLABFunction_h0);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_pn, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_k, &rtb_y_g3,
      &FmgcComputer_DWork.sf_MATLABFunction_jle);
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.armed_modes.loc_armed || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active),
      FmgcComputer_P.PulseNode6_isRisingEdge, &rtb_GreaterThan3, &FmgcComputer_DWork.sf_MATLABFunction_jd);
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Memory_PreviousInput_dv, FmgcComputer_P.PulseNode5_isRisingEdge_a,
      &rtb_y_ov, &FmgcComputer_DWork.sf_MATLABFunction_ew);
    FmgcComputer_DWork.Memory_PreviousInput_i1 = FmgcComputer_P.Logic_table_g[(((rtb_y_nn || rtb_y_g3 ||
      rtb_GreaterThan3 || rtb_NOT3_tmp || rtb_y_ov || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
      rtb_appCapability_idx_2) + (static_cast<uint32_T>(rtb_Compare_bj) << 1)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_i1];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_nk, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_m3(FmgcComputer_U.in.fms_inputs.direct_to_nav_engage, FmgcComputer_U.in.time.dt,
      &rtb_GreaterThan3, FmgcComputer_P.MTrigNode_isRisingEdge_h, FmgcComputer_P.MTrigNode_retriggerable_g,
      FmgcComputer_P.MTrigNode_triggerDuration_e, &FmgcComputer_DWork.sf_MATLABFunction_prl);
    rtb_NOT_b = (FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed || (rtb_GreaterThan3 &&
      Memory_PreviousInput_l_tmp));
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_cp_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_y_jt = (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g &&
      FmgcComputer_U.in.fms_inputs.nav_capture_condition && rtb_NOT_b && ((rtb_y_gtq >=
      FmgcComputer_P.CompareToConstant_const_oh) || raOwnInvalid) && (Memory_PreviousInput_l_tmp_0 || (rtb_y_gtq >=
      FmgcComputer_P.CompareToConstant1_const_bh))));
    FmgcComputer_MATLABFunction_a(rtb_y_jt, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_co,
      FmgcComputer_P.ConfirmNode_timeDelay_d1, &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_ge4);
    FmgcComputer_DWork.Memory_PreviousInput_ip = FmgcComputer_P.Logic_table_a[(((rtb_NOT3_tmp ||
      rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((Memory_PreviousInput_d_tmp ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_NOT_b))) + (static_cast<uint32_T>(rtb_y_jt) <<
      1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ip];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_o, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    rtb_y_jt = rtb_y_g;
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active), FmgcComputer_P.PulseNode1_isRisingEdge_cs, &rtb_y_g3,
      &FmgcComputer_DWork.sf_MATLABFunction_ma);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_ls, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode2_isRisingEdge_o, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_k4c);
    rtb_NOT_b = rtb_AND1_c0;
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_cp_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_GreaterThan3 = (FmgcComputer_P.EnumeratedConstant_Value_ah == FmgcComputer_U.in.fms_inputs.fms_flight_phase);
    rtb_AND1_c0 = (rtb_y_nn && rtb_AND1_c0 && (rtb_y_gtq >= FmgcComputer_P.CompareToConstant_const_m) &&
                   ((!rtb_GreaterThan3) && (FmgcComputer_U.in.fms_inputs.fms_flight_phase !=
      FmgcComputer_P.EnumeratedConstant1_Value_dg)));
    FmgcComputer_MATLABFunction_a(rtb_AND1_c0, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_n,
      FmgcComputer_P.ConfirmNode_timeDelay_g, &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_ah);
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed,
      FmgcComputer_P.PulseNode_isRisingEdge_g, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_ol);
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed,
      FmgcComputer_P.PulseNode3_isRisingEdge_d, &rtb_GreaterThan3, &FmgcComputer_DWork.sf_MATLABFunction_mne);
    rtb_y_jt = (((!rtb_NOT_b) && rtb_y_jt) || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
                FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active || (rtb_OR2_l_tmp_1 && rtb_y_nn
      && FmgcComputer_DWork.Delay_DSTATE.armed_modes.loc_armed) || rtb_GreaterThan3);
    rtb_NOT_b = FmgcComputer_DWork.Memory_PreviousInput_a;
    FmgcComputer_DWork.Memory_PreviousInput_a = FmgcComputer_P.Logic_table_ku[(((static_cast<uint32_T>((rtb_Compare_bj &&
      rtb_OR2_l) || (rtb_y_g && (rtb_y_g3 || rtb_AND1_c0))) << 1) + rtb_y_jt) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_a];
    rtb_BusAssignment_kv_logic_ir_computation_data_heading_magnetic_deg.SSM =
      rtb_irComputationBus_heading_magnetic_deg_SSM;
    rtb_BusAssignment_kv_logic_ir_computation_data_heading_magnetic_deg.Data =
      rtb_irComputationBus_heading_magnetic_deg_Data;
    rtb_BusAssignment_kv_logic_ir_computation_data_roll_angle_deg.SSM = rtb_irComputationBus_roll_angle_deg_SSM;
    rtb_BusAssignment_kv_logic_ir_computation_data_roll_angle_deg.Data = rtb_irComputationBus_roll_angle_deg_Data;
    rtb_BusAssignment_kv_logic_ils_computation_data_localizer_deviation_deg.SSM = rtb_y;
    rtb_BusAssignment_kv_logic_ils_computation_data_localizer_deviation_deg.Data = rtb_DataTypeConversion2_bh;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_j, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kv_logic_ir_computation_data_heading_magnetic_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_j, &rtb_y_gtq);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kv_logic_ils_computation_data_localizer_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_o, &rtb_y_o);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kv_logic_ir_computation_data_roll_angle_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_o, &rtb_y_p3);
    rtb_DataTypeConversion2_kb = (rtb_y_gtq - static_cast<real32_T>(FmgcComputer_B.u_lyjj + 360.0)) + 360.0F;
    if (rtb_DataTypeConversion2_kb == 0.0F) {
      rtb_DataTypeConversion2_kb = 0.0F;
    } else {
      rtb_DataTypeConversion2_kb = std::fmod(rtb_DataTypeConversion2_kb, 360.0F);
      if (rtb_DataTypeConversion2_kb == 0.0F) {
        rtb_DataTypeConversion2_kb = 0.0F;
      } else if (rtb_DataTypeConversion2_kb < 0.0F) {
        rtb_DataTypeConversion2_kb += 360.0F;
      }
    }

    if (360.0F - rtb_DataTypeConversion2_kb == 0.0F) {
      rtb_y_gtq = 0.0F;
    } else {
      rtb_y_gtq = std::fmod(360.0F - rtb_DataTypeConversion2_kb, 360.0F);
    }

    if (rtb_DataTypeConversion2_kb < rtb_y_gtq) {
      rtb_y_gtq = -rtb_DataTypeConversion2_kb;
    }

    if (rtb_y_gtq < 0.0F) {
      high_i = -1;
    } else {
      high_i = (rtb_y_gtq > 0.0F);
    }

    if (FmgcComputer_DWork.Delay2_DSTATE.Phi_loc_c < 0.0) {
      low_ip1 = -1;
    } else {
      low_ip1 = (FmgcComputer_DWork.Delay2_DSTATE.Phi_loc_c > 0.0);
    }

    if (high_i == low_ip1) {
      rtb_DataTypeConversion8 = std::abs(FmgcComputer_DWork.Delay2_DSTATE.Phi_loc_c);
      guard1 = false;
      if (rtb_DataTypeConversion8 > 5.0) {
        if (std::abs(rtb_y_p3) <= 5.0F) {
          rtb_y_jt = true;
        } else {
          if (rtb_y_p3 < 0.0F) {
            absVsTarget = -1;
          } else {
            absVsTarget = (rtb_y_p3 > 0.0F);
          }

          if (low_ip1 != absVsTarget) {
            rtb_y_jt = true;
          } else {
            guard1 = true;
          }
        }
      } else {
        guard1 = true;
      }

      if (guard1) {
        if (rtb_y_p3 < 0.0F) {
          absVsTarget = -1;
        } else {
          absVsTarget = (rtb_y_p3 > 0.0F);
        }

        rtb_y_jt = ((rtb_DataTypeConversion8 >= std::abs(rtb_y_p3)) && (low_ip1 == absVsTarget));
      }
    } else {
      rtb_y_jt = false;
    }

    rtb_DataTypeConversion2_kb = std::abs(rtb_y_gtq);
    if (rtb_DataTypeConversion2_kb < 115.0F) {
      rtb_y_p3 = std::abs(rtb_y_o);
      if (rtb_y_o < 0.0F) {
        low_ip1 = -1;
      } else {
        low_ip1 = (rtb_y_o > 0.0F);
      }

      if (((rtb_DataTypeConversion2_kb > 25.0F) && ((rtb_y_p3 < 10.0F) && ((high_i != low_ip1) && rtb_y_jt))) ||
          (rtb_y_p3 < 1.92)) {
        rtb_y_jt = (rtb_y_jt || ((rtb_DataTypeConversion2_kb < 15.0F) && (rtb_y_p3 < 1.1)));
      } else {
        rtb_y_jt = false;
      }
    } else {
      rtb_y_jt = false;
    }

    FmgcComputer_MATLABFunction_ie(&rtb_BusAssignment_kv_logic_ils_computation_data_localizer_deviation_deg,
      &rtb_Compare_bj);
    rtb_y_jt = (rtb_y_g && FmgcComputer_DWork.Delay_DSTATE.armed_modes.loc_armed && rtb_y_jt && rtb_Compare_bj);
    rtb_Compare_bj = (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_at,
      FmgcComputer_P.ConfirmNode_timeDelay_h4, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_p4);
    rtb_y_gb = (Memory_PreviousInput_d_tmp_tmp || FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active);
    FmgcComputer_DWork.Memory_PreviousInput_cv = FmgcComputer_P.Logic_table_g4[(((((!rtb_y_jt) && (rtb_y_gb ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset)
      + (static_cast<uint32_T>(rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_cv];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_2,
      FmgcComputer_P.BitfromLabel_bit_es, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kv_logic_ils_computation_data_localizer_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_b, &rtb_y_gtq);
    if (rtb_y_gtq < 0.0F) {
      rtb_DataTypeConversion8 = -rtb_y_gtq;
    } else {
      rtb_DataTypeConversion8 = rtb_y_gtq;
    }

    FmgcComputer_MATLABFunction_a((rtb_DataTypeConversion8 < FmgcComputer_P.CompareToConstant1_const_n),
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_nd, FmgcComputer_P.ConfirmNode_timeDelay_e,
      &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_is);
    rtb_y_jt = (rtb_y_g && FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active && rtb_NOT_b);
    rtb_Compare_bj = (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ea,
      FmgcComputer_P.ConfirmNode_timeDelay_es, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_pr);
    FmgcComputer_DWork.Memory_PreviousInput_lq = FmgcComputer_P.Logic_table_j[(((((!rtb_y_jt) && (rtb_y_gb ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset)
      + (static_cast<uint32_T>(rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_lq];
    rtb_BusAssignment_ic_logic_altitude_indicated_ft.SSM = rtb_fm_weight_lbs_SSM;
    rtb_BusAssignment_ic_logic_altitude_indicated_ft.Data = rtb_Max_a;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_m, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_c5, &rtb_y_gtq);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_pm, &rtb_y_pv);
    rtb_DataTypeConversion2_kb = rtb_y_gtq - rtb_y_pv;
    rtb_DataTypeConversion2_bh = std::abs(rtb_DataTypeConversion2_kb);
    FmgcComputer_DWork.Memory_PreviousInput_n = FmgcComputer_P.Logic_table_pk[(((static_cast<uint32_T>
      ((rtb_DataTypeConversion1_e != 0U) || (rtb_DataTypeConversion2_bh > FmgcComputer_P.CompareToConstant1_const_hi)) <<
      1) + (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active && (rtb_DataTypeConversion2_bh <=
      FmgcComputer_P.CompareToConstant_const_mh))) << 1) + FmgcComputer_DWork.Memory_PreviousInput_n];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_et, &rtb_DataTypeConversion1_e);
    rtb_NOT_b = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active;
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_vz_ft_min,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_j, &rtb_y_o);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_fpa_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_jm, &rtb_y_p3);
    if (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active) {
      rtb_y_p3 = rtb_y_o;
    } else if (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active) {
      if (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active && rtb_OR1_j) {
        rtb_y_p3 = static_cast<real32_T>(rtb_Phi_c_deg);
      } else {
        rtb_y_p3 = 0.0F;
      }
    }

    rtb_y_gb = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active);
    rtb_BusAssignment_gt_logic_ir_computation_data_inertial_vertical_speed_ft_s.SSM =
      rtb_irComputationBus_inertial_vertical_speed_ft_s_SSM;
    rtb_BusAssignment_gt_logic_ir_computation_data_inertial_vertical_speed_ft_s.Data =
      rtb_irComputationBus_inertial_vertical_speed_ft_s_Data;
    rtb_BusAssignment_gt_logic_ra_computation_data_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    rtb_BusAssignment_gt_logic_ra_computation_data_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    if (rtb_DataTypeConversion2_kb < 0.0F) {
      rtb_OR1_j = (rtb_y_p3 <= 0.0F);
    } else {
      rtb_OR1_j = ((rtb_DataTypeConversion2_kb > 0.0F) && (rtb_y_p3 >= 0.0F));
    }

    rtb_GreaterThan3 = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active;
    Memory_PreviousInput_d_tmp = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active;
    rtb_AND1_c_tmp = !FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active;
    rtb_AND1_c0 = (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g && rtb_NOT_b && rtb_GreaterThan3 &&
      rtb_AND1_c_tmp && Memory_PreviousInput_d_tmp && rtb_y_ja && rtb_appInop_idx_1 && ((!rtb_OR1_j) ||
      (rtb_GreaterThan3_tmp && rtb_Compare_bb)) && ((!rtb_y_gb) || (rtb_DataTypeConversion2_kb <=
      FmgcComputer_P.CompareToConstant2_const_jy)) && apCondition && FmgcComputer_DWork.Memory_PreviousInput_n));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_ng, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_n, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U));
    rtb_y_jt = rtb_y_g;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_f, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_m3((rtb_DataTypeConversion1_e != 0U), FmgcComputer_U.in.time.dt, &rtb_NOT_b,
      FmgcComputer_P.MTrigNode_isRisingEdge_k, FmgcComputer_P.MTrigNode_retriggerable_pd,
      FmgcComputer_P.MTrigNode_triggerDuration_bh, &FmgcComputer_DWork.sf_MATLABFunction_bq);
    rtb_NOT_b = !rtb_NOT_b;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_gt_logic_ir_computation_data_inertial_vertical_speed_ft_s,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_h, &rtb_y_p3);
    rtb_DataTypeConversion2_kb = std::abs(rtb_y_p3);
    high_i = 7;
    absVsTarget = 0;
    low_ip1 = 2;
    while (high_i > low_ip1) {
      mid_i = ((absVsTarget + high_i) + 1) >> 1;
      if (static_cast<real_T>(rtb_DataTypeConversion2_kb) >= b[mid_i - 1]) {
        absVsTarget = mid_i - 1;
        low_ip1 = mid_i + 1;
      } else {
        high_i = mid_i;
      }
    }

    rtb_DataTypeConversion2_kb -= static_cast<real32_T>(b[absVsTarget]);
    rtb_y_o = rtb_y_p3 * 0.00508F;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_d, &rtb_y_gtq);
    rtb_Phi_c_deg = rtb_altCstrOrFcu - rtb_y_gtq;
    if (rtb_Phi_c_deg < 0.0) {
      high_i = -1;
    } else {
      high_i = (rtb_Phi_c_deg > 0.0);
    }

    if (rtb_y_p3 < 0.0F) {
      low_ip1 = -1;
    } else {
      low_ip1 = (rtb_y_p3 > 0.0F);
    }

    rtb_NOT_b = (FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_armed && rtb_NOT_b && ((std::fmin(3000.0F, std::
      fmax(80.0F, rtb_y_o * rtb_y_o / ((((rtb_DataTypeConversion2_kb * static_cast<real32_T>(c[absVsTarget]) +
      static_cast<real32_T>(c[absVsTarget + 6])) * rtb_DataTypeConversion2_kb + static_cast<real32_T>(c[absVsTarget + 12]))
      * rtb_DataTypeConversion2_kb + static_cast<real32_T>(c[absVsTarget + 18])) * 9.81F) * 3.28084F)) > std::abs
      (rtb_Phi_c_deg)) && (high_i == low_ip1)));
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_gt_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel7_bit_j, &rtb_DataTypeConversion1_e);
    rtb_y_nn = rtb_y_lh_0;
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || (rtb_y_g && rtb_NOT_b && ((rtb_y_gtq >=
      FmgcComputer_P.CompareToConstant_const_l5) || (rtb_OR2_l_tmp && rtb_TmpSignalConversionAtSFunctionInport3_idx_2)) &&
      (rtb_Compare_bb || ((rtb_DataTypeConversion1_e == 0U) && (FmgcComputer_DWork.Delay_DSTATE.active_tcas_submode ==
      FmgcComputer_P.EnumeratedConstant3_Value_l) && (!rtb_y_lh_0)))));
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_hux,
      FmgcComputer_P.ConfirmNode_timeDelay_lk, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_hw);
    FmgcComputer_DWork.Memory_PreviousInput_ne = FmgcComputer_P.Logic_table_nz
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((absVsTarget_tmp ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ne];
    rtb_OR2_l_tmp_1 = rtb_NOT_b;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_p2, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_fr, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U));
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_g, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_a((std::abs(rtb_altCstrOrFcu - rtb_y_gtq) < FmgcComputer_P.CompareToConstant_const_f),
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_nf, FmgcComputer_P.ConfirmNode_timeDelay_at,
      &rtb_y_nn, &FmgcComputer_DWork.sf_MATLABFunction_ee);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel7_bit_k, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (rtb_y_g && FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active && rtb_y_nn &&
                (rtb_Compare_bb || ((rtb_DataTypeConversion1_e == 0U) &&
      (FmgcComputer_DWork.Delay_DSTATE.active_tcas_submode == FmgcComputer_P.EnumeratedConstant3_Value_p) && rtb_NOT1_i)));
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_lj,
      FmgcComputer_P.ConfirmNode_timeDelay_bd, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_dt);
    FmgcComputer_DWork.Memory_PreviousInput_cb = FmgcComputer_P.Logic_table_ob
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((Memory_PreviousInput_k_tmp_tmp_tmp ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_cb];
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_m, &rtb_y_gtq);
    rtb_y_jt = rtb_GreaterThan3;
    FmgcComputer_DWork.Memory_PreviousInput_no = FmgcComputer_P.Logic_table_ay[(((static_cast<uint32_T>(std::abs
      (FmgcComputer_U.in.fms_inputs.cruise_alt_ft - rtb_y_gtq) < FmgcComputer_P.CompareToConstant1_const_a) << 1) +
      rtb_GreaterThan3) << 1) + FmgcComputer_DWork.Memory_PreviousInput_no];
    rtb_NOT3_tmp = !rtb_AND_j;
    rtb_Compare_bb = (FmgcComputer_DWork.Memory_PreviousInput_cb && rtb_NOT3_tmp &&
                      FmgcComputer_DWork.Memory_PreviousInput_no);
    rtb_BusAssignment_o3_logic_adr_computation_data_airspeed_computed_kn.SSM =
      rtb_adrComputationBus_airspeed_computed_kn_SSM;
    rtb_BusAssignment_o3_logic_adr_computation_data_airspeed_computed_kn.Data =
      rtb_adrComputationBus_airspeed_computed_kn_Data;
    rtb_BusAssignment_o3_logic_chosen_fac_bus_v_ls_kn.SSM = rtb_Switch_v_ls_kn_SSM;
    rtb_BusAssignment_o3_logic_chosen_fac_bus_v_ls_kn.Data = rtb_Switch_v_ls_kn_Data;
    rtb_BusAssignment_o3_logic_chosen_fac_bus_v_max_kn.SSM = rtb_Switch_v_max_kn_SSM;
    rtb_BusAssignment_o3_logic_chosen_fac_bus_v_max_kn.Data = rtb_Switch_v_max_kn_Data;
    Memory_PreviousInput_k_tmp_tmp_tmp = rtb_y_nn;
    rtb_Compare_bj = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
                      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active);
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active), FmgcComputer_P.PulseNode3_isRisingEdge_n, &rtb_y_gb,
      &FmgcComputer_DWork.sf_MATLABFunction_fed);
    rtb_AND12 = (rtb_Compare_bj && rtb_y_gb);
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active,
      FmgcComputer_P.PulseNode4_isRisingEdge_f, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_bbb);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel6_bit_d, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode5_isRisingEdge_p,
      &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_jc);
    if (!FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active) {
      FmgcComputer_B.u_ly = rtb_altCstrOrFcu;
    }

    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_mr, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_oi, &rtb_y_gtq);
    rtb_DataTypeConversion2_bh = rtb_y_p3 - rtb_y_gtq;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_o3_logic_chosen_fac_bus_v_ls_kn,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_o, &rtb_y_gtq);
    rtb_DataTypeConversion2_kb = rtb_y_gtq + FmgcComputer_P.Bias_Bias_e;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_o3_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault6_defaultValue_c, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_o3_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault7_defaultValue, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel7_bit_o, &rtb_DataTypeConversion1_e);
    rtb_y_g3 = (rtb_y_lh_0 || (FmgcComputer_DWork.Delay_DSTATE.active_tcas_submode ==
      FmgcComputer_P.EnumeratedConstant3_Value_ls));
    rtb_y_gb = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active);
    rtb_GreaterThan3 = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
                        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
                        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active);
    rtb_OR2_l_tmp_0 = (rtb_NOT3_tmp_0 && rtb_OR2_l_tmp_0 && rtb_AND10_b);
    rtb_Compare_bj = (rtb_AND12 || (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active && (rtb_y_jt ||
      rtb_Compare_bj)) || (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active &&
      ((FmgcComputer_P.EnumeratedConstant_Value_p == FmgcComputer_U.in.fms_inputs.fms_flight_phase) ||
       (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant1_Value_m) ||
       (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant2_Value) || rtb_OR2_l_tmp_0 ||
       rtb_Compare_d0)) || (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active && (std::abs
      (FmgcComputer_B.u_ly - rtb_altCstrOrFcu) >= FmgcComputer_P.CompareToConstant_const_om)) || (rtb_y_gb &&
      (rtb_DataTypeConversion2_bh > FmgcComputer_P.CompareToConstant1_const_o)) || (rtb_GreaterThan3 &&
      (rtb_DataTypeConversion2_bh < FmgcComputer_P.CompareToConstant2_const_g)) || ((rtb_y_gb ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active) && (rtb_DataTypeConversion2_kb > rtb_y_p3) &&
      rtb_Compare_gc && FmgcComputer_DWork.Delay_DSTATE_k && FmgcComputer_P.Constant_Value_m) || (rtb_GreaterThan3 &&
      (rtb_y_p3 > rtb_y_gtq + FmgcComputer_P.Bias1_Bias) && rtb_Compare_gc && FmgcComputer_DWork.Delay_DSTATE_k &&
      FmgcComputer_P.Constant_Value_m) || (((rtb_DataTypeConversion1_e == 0U) || rtb_y_lh_0) &&
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active && rtb_y_g3));
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_ax, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_k, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (rtb_y_jt || (rtb_DataTypeConversion1_e != 0U));
    rtb_NOT_b = rtb_y_g;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_g, &rtb_DataTypeConversion1_e);
    rtb_GreaterThan3 = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel5_bit_n, &rtb_DataTypeConversion1_e);
    rtb_y_ov = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_g((rtb_GreaterThan3 || (rtb_DataTypeConversion1_e != 0U)),
      FmgcComputer_P.PulseNode_isRisingEdge_d, &rtb_y_ov, &FmgcComputer_DWork.sf_MATLABFunction_nd);
    FmgcComputer_MATLABFunction_g(apCondition, FmgcComputer_P.PulseNode1_isRisingEdge_ky, &rtb_y_g3,
      &FmgcComputer_DWork.sf_MATLABFunction_dsw);
    rtb_AND12 = !FmgcComputer_DWork.Delay_DSTATE.any_longitudinal_mode_engaged;
    rtb_y_nn = rtb_AND12;
    FmgcComputer_MATLABFunction_a(rtb_OR_i, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ld,
      FmgcComputer_P.ConfirmNode_timeDelay_op, &rtb_y_nn, &FmgcComputer_DWork.sf_MATLABFunction_cz);
    rtb_y_jt = ((rtb_y_jt && rtb_OR2_l) || (rtb_y_g && ((rtb_y_pf && rtb_y_ov && rtb_appInop_idx_1) || (rtb_OR_i &&
      rtb_y_g3 && rtb_AND12) || (rtb_y_nn && rtb_AND12) || rtb_Compare_bj)));
    FmgcComputer_MATLABFunction_a(rtb_y_jt, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_lu,
      FmgcComputer_P.ConfirmNode_timeDelay_ll, &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_gbq);
    FmgcComputer_DWork.Memory_PreviousInput_fg = FmgcComputer_P.Logic_table_ny
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((rtb_y_c1 ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_NOT_b))) + (static_cast<uint32_T>
          (rtb_y_jt) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_fg];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_e, &rtb_DataTypeConversion1_e);
    rtb_AND12 = ((rtb_DataTypeConversion1_e != 0U) && FmgcComputer_DWork.Memory_PreviousInput_fg);
    Memory_PreviousInput_l_tmp_0 = (FmgcComputer_DWork.Memory_PreviousInput_fg && (rtb_DataTypeConversion1_e == 0U));
    Memory_PreviousInput_d_tmp_tmp = rtb_Compare_bj;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_jh, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_et, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_oj, &rtb_y_gtq);
    rtb_y_ov = (rtb_y_p3 > rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_px, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_bb, &rtb_y_gb,
      &FmgcComputer_DWork.sf_MATLABFunction_p3z);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_c, &rtb_y_gtq);
    rtb_NOT_g_tmp = (rtb_y_c1 && rtb_AND_j);
    rtb_NOT_b = (rtb_OR_i && ((FmgcComputer_U.in.fms_inputs.fms_flight_phase !=
      FmgcComputer_P.EnumeratedConstant1_Value_f) && (FmgcComputer_U.in.fms_inputs.fms_flight_phase !=
      FmgcComputer_P.EnumeratedConstant2_Value_p)) && FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active &&
                 rtb_y_ov && FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid && (rtb_NOT_g_tmp || (rtb_y_gb &&
      rtb_y_c1 && (rtb_AND_j && (std::abs(rtb_altCstrOrFcu - rtb_y_gtq) <= FmgcComputer_P.CompareToConstant2_const_d)))));
    rtb_GreaterThan3 = (rtb_y_ft || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                        FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_k, &rtb_y_gtq);
    rtb_y_g3 = (FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active ||
                FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed);
    rtb_y_ov = ((FmgcComputer_U.in.fms_inputs.acceleration_alt_ft != FmgcComputer_P.CompareToConstant_const_l) &&
                (FmgcComputer_U.in.fms_inputs.acceleration_alt_ft < rtb_y_gtq) &&
                ((FmgcComputer_U.in.fms_inputs.acceleration_alt_ft < FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft) ||
                 (FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft == FmgcComputer_P.CompareToConstant1_const_p)) &&
                rtb_y_g3 && ((!rtP_fmgc_ap_fd_logic_output_MATLABStruct.any_lateral_mode_engaged) ||
      FmgcComputer_DWork.Memory_PreviousInput_c));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_jt, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_os, &rtb_y_gtq);
    rtb_OR1_j = (rtb_Compare_kg || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active);
    FmgcComputer_DWork.Memory_PreviousInput_ma = FmgcComputer_P.Logic_table_ns[((((rtb_GreaterThan3 && (!rtb_y_ov)) ||
      (rtb_OR1_j || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
       ((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active ||
         FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active) && rtb_NOT3_tmp) ||
       FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active) || (rtb_y_p3 < rtb_y_gtq) || (rtb_y_c1 &&
      (rtb_NOT3_tmp || rtb_NOT3_tmp_0 || rtb_Compare_d0)) || ((FmgcComputer_U.in.fms_inputs.fms_flight_phase ==
      FmgcComputer_P.EnumeratedConstant3_Value) || (FmgcComputer_U.in.fms_inputs.fms_flight_phase ==
      FmgcComputer_P.EnumeratedConstant4_Value)) || rtb_appCapability_idx_2) + (static_cast<uint32_T>((rtb_Compare_bj &&
      rtb_OR2_l) || (rtb_y_g && (rtb_NOT_b || (rtb_GreaterThan3 && rtb_y_ov)))) << 1)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_ma];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_g3, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_is, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (rtb_DataTypeConversion1_e == 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_b, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && rtb_y_jt && (rtb_DataTypeConversion1_e == 0U));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_h, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_n, &rtb_y_gtq);
    rtb_GreaterThan3 = (rtb_y_p3 > rtb_y_gtq);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_j4, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_g((rtb_y_gtq > FmgcComputer_U.in.fms_inputs.acceleration_alt_ft),
      FmgcComputer_P.PulseNode_isRisingEdge_bg, &rtb_y_g3, &FmgcComputer_DWork.sf_MATLABFunction_dfk);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_p, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_j4,
      &rtb_AND10_b, &FmgcComputer_DWork.sf_MATLABFunction_dd);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_d, &rtb_y_gtq);
    rtb_y_gb = (rtb_NOT3_tmp || (std::abs(rtb_altCstrOrFcu - rtb_y_gtq) > FmgcComputer_P.CompareToConstant2_const_a));
    Memory_PreviousInput_l_tmp = (rtb_y_g && FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible &&
      rtb_y_pf);
    rtb_y_jt = (Memory_PreviousInput_l_tmp && (rtb_appInop_idx_1 && Memory_PreviousInput_d_tmp) &&
                FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active &&
                FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid && rtb_GreaterThan3 &&
                ((FmgcComputer_P.EnumeratedConstant_Value_pq != FmgcComputer_U.in.fms_inputs.fms_flight_phase) &&
                 (FmgcComputer_U.in.fms_inputs.fms_flight_phase != FmgcComputer_P.EnumeratedConstant1_Value_iv)) &&
                ((FmgcComputer_DWork.Delay_DSTATE.armed_modes.clb_armed && (rtb_y_g3 ||
      (FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft != FmgcComputer_DWork.DelayInput1_DSTATE))) || (rtb_AND10_b &&
      ((!rtb_y_c1) || (rtb_y_c1 && (!FmgcComputer_DWork.Delay_DSTATE.armed_modes.clb_armed) && rtb_y_gb)))));
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_fc,
      FmgcComputer_P.ConfirmNode_timeDelay_nn, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_ir);
    rtb_NOT_b = (rtb_y_kr || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active);
    FmgcComputer_DWork.Memory_PreviousInput_ec = FmgcComputer_P.Logic_table_kw
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((rtb_NOT_b ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ec];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_cq, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_nh, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_mc, &rtb_y_gtq);
    rtb_GreaterThan3 = (rtb_y_p3 < rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_nq, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_f, &rtb_y_gb,
      &FmgcComputer_DWork.sf_MATLABFunction_mrk);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_k, &rtb_y_gtq);
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || (rtb_y_g && ((FmgcComputer_U.in.fms_inputs.fms_flight_phase !=
      FmgcComputer_P.EnumeratedConstant1_Value_c) && (FmgcComputer_U.in.fms_inputs.fms_flight_phase !=
      FmgcComputer_P.EnumeratedConstant2_Value_pi) && rtb_GreaterThan3 &&
      rtb_TmpSignalConversionAtSFunctionInport3_idx_1 && FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid &&
      (rtb_NOT_g_tmp || (rtb_y_gb && rtb_y_c1 && (rtb_AND_j && (std::abs(rtb_altCstrOrFcu - rtb_y_gtq) <=
      FmgcComputer_P.CompareToConstant2_const_e)))))));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_cj, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_b, &rtb_y_gtq);
    FmgcComputer_DWork.Memory_PreviousInput_nt = FmgcComputer_P.Logic_table_he[(((rtb_OR1_j ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active || (rtb_y_p3 > rtb_y_gtq) || rtb_OR2_l_tmp_0 ||
      ((FmgcComputer_P.EnumeratedConstant_Value_b == FmgcComputer_U.in.fms_inputs.fms_flight_phase) ||
       (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant5_Value) ||
       (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant6_Value)) || rtb_Compare_d0 ||
      (rtb_y_c1 && rtb_NOT3_tmp) || rtb_appCapability_idx_2) + (static_cast<uint32_T>(rtb_Compare_bj) << 1)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_nt];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_mi, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_j, &rtb_DataTypeConversion1_e);
    rtb_y_jt = (rtb_DataTypeConversion1_e == 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_f, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && rtb_y_jt && (rtb_DataTypeConversion1_e == 0U));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_mo, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_b5, &rtb_y_gtq);
    rtb_y_ov = (rtb_y_p3 < rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_a, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_fq,
      &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_kd);
    rtb_y_gb = !FmgcComputer_DWork.Delay_DSTATE.armed_modes.des_armed;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_m, &rtb_y_gtq);
    rtb_y_jt = (Memory_PreviousInput_l_tmp && (Memory_PreviousInput_d_tmp && rtb_appInop_idx_1 &&
      Memory_PreviousInput_k_tmp_tmp && rtb_y_ja && rtb_OR2_l_tmp && rtb_TmpSignalConversionAtSFunctionInport3_idx_2) &&
                rtb_TmpSignalConversionAtSFunctionInport3_idx_1 &&
                FmgcComputer_U.in.fms_inputs.vertical_flight_plan_valid && rtb_y_ov &&
                ((FmgcComputer_P.EnumeratedConstant_Value_m != FmgcComputer_U.in.fms_inputs.fms_flight_phase) &&
                 (FmgcComputer_U.in.fms_inputs.fms_flight_phase != FmgcComputer_P.EnumeratedConstant1_Value_k) &&
                 (FmgcComputer_U.in.fms_inputs.fms_flight_phase != FmgcComputer_P.EnumeratedConstant2_Value_pw)) &&
                ((FmgcComputer_DWork.Delay_DSTATE.armed_modes.des_armed &&
                  (FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft != FmgcComputer_DWork.DelayInput1_DSTATE_n)) ||
                 (rtb_y_jt && ((!rtb_y_c1) || (rtb_y_c1 && rtb_y_gb && (rtb_NOT3_tmp || (std::abs(rtb_altCstrOrFcu -
      rtb_y_gtq) > FmgcComputer_P.CompareToConstant2_const_l)))))));
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_j,
      FmgcComputer_P.ConfirmNode_timeDelay_dy, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_n5);
    rtb_AND10_b = (absVsTarget_tmp_tmp || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
                   FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active);
    rtb_OR1_j = (rtb_AND10_b || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
                 FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active);
    rtb_OR2_l_tmp = (rtb_OR1_j || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
                     FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
                     FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active);
    FmgcComputer_DWork.Memory_PreviousInput_b3 = FmgcComputer_P.Logic_table_cv
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((rtb_OR2_l_tmp ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_b3];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_nv, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_i1, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_ht, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_d2, &rtb_y_gtq);
    rtb_GreaterThan3 = (rtb_y_p3 > rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_d, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_n, &rtb_y_gb,
      &FmgcComputer_DWork.sf_MATLABFunction_f0h);
    rtb_y_c1 = rtb_Compare_d0;
    rtb_y_nn = (FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
                FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active);
    FmgcComputer_MATLABFunction_a((FmgcComputer_DWork.Delay_DSTATE.manual_spd_control_active && rtb_y_nn),
      FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_jo, FmgcComputer_P.ConfirmNode_timeDelay_jo,
      &rtb_y_nn, &FmgcComputer_DWork.sf_MATLABFunction_moh);
    rtb_y_ov = ((FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active &&
                 ((FmgcComputer_P.EnumeratedConstant_Value_c == FmgcComputer_U.in.fms_inputs.fms_flight_phase) ||
                  (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant1_Value_c5) ||
                  rtb_NOT3_tmp_0 || rtb_Compare_d0)) || rtb_y_nn);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_e, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_g((rtb_y_gtq > FmgcComputer_U.in.fms_inputs.acceleration_alt_ft),
      FmgcComputer_P.PulseNode1_isRisingEdge_g, &rtb_y_c1, &FmgcComputer_DWork.sf_MATLABFunction_lva);
    rtb_y_g3 = (rtb_NOT3_tmp_0 || rtb_Compare_d0);
    rtb_y_nn = (rtb_y_gb || rtb_y_ov || (rtb_y_c1 && (FmgcComputer_U.in.fms_inputs.acceleration_alt_ft !=
      FmgcComputer_P.CompareToConstant_const_od) && rtb_y_g3));
    Memory_PreviousInput_l_tmp = (Memory_PreviousInput_l_tmp && rtb_appInop_idx_1);
    rtb_y_jt = (Memory_PreviousInput_l_tmp && rtb_GreaterThan3 && rtb_y_nn);
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ca,
      FmgcComputer_P.ConfirmNode_timeDelay_ib, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_go);
    FmgcComputer_DWork.Memory_PreviousInput_ae = FmgcComputer_P.Logic_table_jq
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((rtb_NOT_b ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ae];
    rtb_y_gb = (FmgcComputer_DWork.Memory_PreviousInput_ae && rtb_y_ov);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_b, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_kr, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_i, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_dp, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_i, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_f, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_ms);
    FmgcComputer_MATLABFunction_a((FmgcComputer_DWork.Delay_DSTATE.manual_spd_control_active &&
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active), FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_fq, FmgcComputer_P.ConfirmNode_timeDelay_lp, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_hj);
    rtb_y_ov = (rtb_y_ov || rtb_y_nn);
    rtb_y_jt = (Memory_PreviousInput_l_tmp && (rtb_y_p3 < rtb_y_gtq) && rtb_y_ov);
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ep,
      FmgcComputer_P.ConfirmNode_timeDelay_ob, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_khd);
    FmgcComputer_DWork.Memory_PreviousInput_ev = FmgcComputer_P.Logic_table_lw
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((rtb_OR2_l_tmp ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ev];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_nh, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_fro, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_a, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_hb, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_e, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_az, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_fl);
    rtb_y_jt = (Memory_PreviousInput_l_tmp && (rtb_y_p3 > rtb_y_gtq) && rtb_y_ov);
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_b,
      FmgcComputer_P.ConfirmNode_timeDelay_io, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_dn1);
    FmgcComputer_DWork.Memory_PreviousInput_mx = FmgcComputer_P.Logic_table_ao
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((rtb_y_kr ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_mx];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel1_bit_mz, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_b3, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_aa, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ic_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_a, &rtb_y_gtq);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel4_bit_kh, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_m, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_a3);
    rtb_y_jt = (Memory_PreviousInput_l_tmp && (rtb_y_p3 < rtb_y_gtq) && rtb_y_ov);
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ef,
      FmgcComputer_P.ConfirmNode_timeDelay_p, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_epf);
    FmgcComputer_DWork.Memory_PreviousInput_o = FmgcComputer_P.Logic_table_om
      [(((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || ((rtb_AND10_b ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
            FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
            FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active) && (!rtb_y_jt))) + (static_cast<uint32_T>
          (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_o];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_b, &rtb_DataTypeConversion1_e);
    rtb_y_jt = rtb_y_g;
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active), FmgcComputer_P.PulseNode1_isRisingEdge_b, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_pe);
    FmgcComputer_MATLABFunction_g(FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed,
      FmgcComputer_P.PulseNode_isRisingEdge_lz, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_iv);
    FmgcComputer_DWork.Memory_PreviousInput_fm = FmgcComputer_P.Logic_table_dr[(((static_cast<uint32_T>
      (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g && (rtb_y_ov && rtb_AND1_c_tmp &&
      Memory_PreviousInput_d_tmp))) << 1) + (rtb_y_jt ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_fm];
    rtb_BusAssignment_b0_logic_ils_computation_data_glideslope_deviation_deg.SSM =
      rtb_Switch_i_glideslope_deviation_deg_SSM;
    rtb_BusAssignment_b0_logic_ils_computation_data_glideslope_deviation_deg.Data =
      rtb_Switch_i_glideslope_deviation_deg_Data;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_n0, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_d, &rtb_DataTypeConversion1_e);
    rtb_NOT_b = rtb_y_eg_tmp;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_b0_logic_ils_computation_data_glideslope_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_g, &rtb_y_gtq);
    FmgcComputer_LagFilter(rtb_y_gtq, FmgcComputer_P.LagFilter_C1, FmgcComputer_U.in.time.dt,
      &rtb_DataTypeConversion2_kb, &FmgcComputer_DWork.sf_LagFilter_k);
    if (rtb_y_gtq < 0.0F) {
      rtb_Nosewheel_c = -rtb_y_gtq;
    } else {
      rtb_Nosewheel_c = rtb_y_gtq;
    }

    FmgcComputer_MATLABFunction_ie(&rtb_BusAssignment_b0_logic_ils_computation_data_glideslope_deviation_deg, &rtb_y_jt);
    rtb_y_jt = (rtb_y_g && FmgcComputer_DWork.Delay_DSTATE.armed_modes.glide_armed && rtb_y_eg_tmp &&
                (((rtb_DataTypeConversion2_kb < FmgcComputer_DWork.DelayInput1_DSTATE_b) && (rtb_Nosewheel_c <
      FmgcComputer_P.CompareToConstant1_const_n2)) || (rtb_Nosewheel_c < FmgcComputer_P.CompareToConstant2_const_i)) &&
                rtb_y_jt);
    rtb_Compare_bj = ((rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_g,
      FmgcComputer_P.ConfirmNode_timeDelay_a3g, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_bs);
    rtb_GreaterThan3 = (rtb_OR1_j || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active);
    FmgcComputer_DWork.Memory_PreviousInput_nu = FmgcComputer_P.Logic_table_d3[(((((!rtb_y_jt) && (rtb_GreaterThan3 ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset)
      + (static_cast<uint32_T>(rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_nu];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_nl, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_g, &rtb_DataTypeConversion1_e);
    rtb_y_jt = rtb_y_g;
    FmgcComputer_MATLABFunction_a(FmgcComputer_DWork.Memory_PreviousInput_nu, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_gr, FmgcComputer_P.ConfirmNode_timeDelay_m, &rtb_NOT_b,
      &FmgcComputer_DWork.sf_MATLABFunction_muf);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_b0_logic_ils_computation_data_glideslope_deviation_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_k, &rtb_y_gtq);
    if (rtb_y_gtq < 0.0F) {
      rtb_DataTypeConversion8 = -rtb_y_gtq;
    } else {
      rtb_DataTypeConversion8 = rtb_y_gtq;
    }

    rtb_Compare_bj = ((rtb_Compare_bj && (rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_g && rtb_NOT_b &&
      (rtb_DataTypeConversion8 < FmgcComputer_P.CompareToConstant2_const_h)));
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_o,
      FmgcComputer_P.ConfirmNode_timeDelay_mu, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_dba);
    rtb_GreaterThan3 = (rtb_GreaterThan3 || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active);
    FmgcComputer_DWork.Memory_PreviousInput_as = FmgcComputer_P.Logic_table_fi[(((((!rtb_y_jt) && (rtb_GreaterThan3 ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) || rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset)
      + (static_cast<uint32_T>(rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_as];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_7,
      FmgcComputer_P.BitfromLabel_bit_h, &rtb_DataTypeConversion1_e);
    rtb_NOT_b = FmgcComputer_DWork.Memory_PreviousInput_n0;
    rtb_y_jt = (rtb_y_g && rtb_NOT1_i);
    FmgcComputer_DWork.Memory_PreviousInput_n0 = FmgcComputer_P.Logic_table_id[(((static_cast<uint32_T>
      (((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l) || (rtb_y_jt &&
      FmgcComputer_U.in.discrete_inputs.tcas_ta_display)) << 1) + ((!FmgcComputer_U.in.discrete_inputs.tcas_ta_display) ||
      rtb_y_lh_0 || FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active)) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_n0];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_7,
      FmgcComputer_P.BitfromLabel2_bit_g, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e != 0U);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel1_bit_n4, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode1_isRisingEdge_i,
      &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_owv);
    rtb_y_jt = (rtb_y_jt && rtb_NOT_b);
    rtb_Compare_bj = ((rtb_Compare_bj && rtb_OR2_l) || rtb_y_jt);
    FmgcComputer_MATLABFunction_a(rtb_Compare_bj, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_jj,
      FmgcComputer_P.ConfirmNode_timeDelay_ae, &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_jrd);
    absVsTarget = static_cast<int32_T>(((((rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset || (rtb_GreaterThan3 ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active ||
      FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active ||
      FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active)) && (!rtb_y_jt)) + (static_cast<uint32_T>
      (rtb_Compare_bj) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_i5);
    rtb_Logic_ac[0U] = FmgcComputer_P.Logic_table_fn[static_cast<uint32_T>(absVsTarget)];
    rtb_Logic_ac[1U] = FmgcComputer_P.Logic_table_fn[static_cast<uint32_T>(absVsTarget) + 8U];
    if (FmgcComputer_P.EnumeratedConstant_Value_g != FmgcComputer_DWork.Delay_DSTATE.active_tcas_submode) {
      FmgcComputer_B.u_lyj = rtb_altCstrOrFcu;
    }

    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.tcas_bus.vertical_resolution_advisory,
      FmgcComputer_P.BitfromLabel3_bit_h, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = (rtb_DataTypeConversion1_e == 0U);
    rtb_y_jt = !FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_armed;
    rtb_GreaterThan3 = FmgcComputer_DWork.Memory_PreviousInput_h;
    FmgcComputer_DWork.Memory_PreviousInput_h = FmgcComputer_P.Logic_table_oq[((((std::abs(FmgcComputer_B.u_lyj -
      rtb_altCstrOrFcu) >= FmgcComputer_P.CompareToConstant_const_g) || rtb_Compare_bj || rtb_y_jt) +
      (static_cast<uint32_T>(rtb_OR2_l_tmp_1) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_h];
    rtb_NOT_b = ((FmgcComputer_P.EnumeratedConstant1_Value_eq == FmgcComputer_DWork.Delay_DSTATE.active_tcas_submode) &&
                 Memory_PreviousInput_k_tmp_tmp_tmp);
    FmgcComputer_DWork.Memory_PreviousInput_cp = FmgcComputer_P.Logic_table_dj[(((static_cast<uint32_T>(rtb_NOT_b) << 1)
      + (rtb_y_jt || rtb_Compare_bj)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_cp];
    if (FmgcComputer_DWork.Memory_PreviousInput_h) {
      rtb_mode = tcas_submode::ALT_ACQ;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_cp) {
      rtb_mode = tcas_submode::ALT_HOLD;
    } else {
      rtb_mode = tcas_submode::VS;
    }

    rtb_BusAssignment_kc_logic_adr_computation_data_airspeed_computed_kn.SSM =
      rtb_adrComputationBus_airspeed_computed_kn_SSM;
    rtb_BusAssignment_kc_logic_adr_computation_data_airspeed_computed_kn.Data =
      rtb_adrComputationBus_airspeed_computed_kn_Data;
    rtb_BusAssignment_kc_logic_chosen_fac_bus_v_ls_kn.SSM = rtb_Switch_v_ls_kn_SSM;
    rtb_BusAssignment_kc_logic_chosen_fac_bus_v_ls_kn.Data = rtb_Switch_v_ls_kn_Data;
    rtb_BusAssignment_kc_logic_chosen_fac_bus_v_max_kn.SSM = rtb_Switch_v_max_kn_SSM;
    rtb_BusAssignment_kc_logic_chosen_fac_bus_v_max_kn.Data = rtb_Switch_v_max_kn_Data;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kc_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_bw, &rtb_y_gtq);
    rtb_y_o = rtb_y_gtq + FmgcComputer_P.Bias_Bias_m;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kc_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_jb, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kc_logic_chosen_fac_bus_v_ls_kn,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_e, &rtb_y_gtq);
    rtb_NOT3_tmp = (FmgcComputer_DWork.Memory_PreviousInput_b3 || FmgcComputer_DWork.Memory_PreviousInput_ev ||
                    FmgcComputer_DWork.Memory_PreviousInput_o);
    rtb_y_lh_0 = (FmgcComputer_DWork.Memory_PreviousInput_ec || FmgcComputer_DWork.Memory_PreviousInput_ae ||
                  FmgcComputer_DWork.Memory_PreviousInput_mx);
    rtb_Compare_gc = (((rtb_y_lh_0 && (rtb_y_o < rtb_y_p3)) || ((rtb_y_p3 < rtb_y_gtq + FmgcComputer_P.Bias1_Bias_c) &&
      rtb_NOT3_tmp)) && rtb_Compare_gc && FmgcComputer_DWork.Delay_DSTATE_k && fdOwnOff);
    rtb_BusAssignment_ds_logic_ir_computation_data_flight_path_angle_deg.SSM =
      rtb_irComputationBus_flight_path_angle_deg_SSM;
    rtb_BusAssignment_ds_logic_ir_computation_data_flight_path_angle_deg.Data =
      rtb_irComputationBus_flight_path_angle_deg_Data;
    rtb_BusAssignment_ds_logic_ir_computation_data_inertial_vertical_speed_ft_s.SSM =
      rtb_irComputationBus_inertial_vertical_speed_ft_s_SSM;
    rtb_BusAssignment_ds_logic_ir_computation_data_inertial_vertical_speed_ft_s.Data =
      rtb_irComputationBus_inertial_vertical_speed_ft_s_Data;
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_fpa_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_hd, &rtb_DataTypeConversion2_bh);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ds_logic_ir_computation_data_flight_path_angle_deg,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_i, &rtb_y_pv);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_vz_ft_min,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_pc, &rtb_y_bf);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ds_logic_ir_computation_data_inertial_vertical_speed_ft_s,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_g, &rtb_y_ia);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kc_logic_chosen_fac_bus_v_ls_kn,
      FmgcComputer_P.A429ValueOrDefault6_defaultValue_d, &rtb_y_gtq);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kc_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_b, &rtb_y_o);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_kc_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_f, &rtb_y_p3);
    rtb_appInop_idx_1 = (rtb_AND12 || Memory_PreviousInput_l_tmp_0);
    if (rtb_AND12) {
      rtb_DataTypeConversion2_bh = rtb_y_ia - rtb_y_bf;
      rtb_Phi_c_deg = 50.0;
    } else {
      rtb_DataTypeConversion2_bh = rtb_y_pv - rtb_DataTypeConversion2_bh;
      rtb_Phi_c_deg = 0.1;
    }

    rtb_y_jt = (rtb_Logic_a2[0] && rtb_appInop_idx_1);
    rtb_AND10_b = ((rtb_y_jt && (rtb_y_p3 < rtb_y_gtq + 3.0F) && (rtb_DataTypeConversion2_bh < -rtb_Phi_c_deg)) ||
                   (rtb_y_jt && (rtb_y_p3 > rtb_y_o - 3.0F) && (rtb_DataTypeConversion2_bh > rtb_Phi_c_deg)));
    FmgcComputer_MATLABFunction_m3((apCondition && (rtb_AND10_b || rtb_Compare_gc || rtb_y_gb ||
      Memory_PreviousInput_d_tmp_tmp || rtb_AND8)), FmgcComputer_U.in.time.dt, &rtb_NOT_b,
      FmgcComputer_P.MTrigNode2_isRisingEdge_p, FmgcComputer_P.MTrigNode2_retriggerable_i,
      FmgcComputer_P.MTrigNode2_triggerDuration_f, &FmgcComputer_DWork.sf_MATLABFunction_hdx);
    FmgcComputer_MATLABFunction_g(apCondition, FmgcComputer_P.PulseNode_isRisingEdge_fo, &rtb_y_jt,
      &FmgcComputer_DWork.sf_MATLABFunction_h0f);
    rtb_OR2_l_tmp_0 = !rtb_Logic_ac[0];
    rtb_Compare_bj = (rtb_y_jt && rtb_OR2_l_tmp_0);
    FmgcComputer_MATLABFunction_m3((Memory_PreviousInput_d_tmp_tmp || rtb_Compare_bj), FmgcComputer_U.in.time.dt,
      &rtb_y_jt, FmgcComputer_P.MTrigNode_isRisingEdge_jn, FmgcComputer_P.MTrigNode_retriggerable_n,
      FmgcComputer_P.MTrigNode_triggerDuration_c, &FmgcComputer_DWork.sf_MATLABFunction_ppo);
    FmgcComputer_MATLABFunction_m3((rtb_AND8 || rtb_Compare_bj), FmgcComputer_U.in.time.dt, &rtb_Compare_bj,
      FmgcComputer_P.MTrigNode1_isRisingEdge_g, FmgcComputer_P.MTrigNode1_retriggerable_h,
      FmgcComputer_P.MTrigNode1_triggerDuration_m, &FmgcComputer_DWork.sf_MATLABFunction_hd1);
    rtb_BusAssignment_hz_logic_ra_computation_data_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    rtb_BusAssignment_hz_logic_ra_computation_data_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    rtb_OR2_l_tmp = rtb_NOT_b;
    rtb_NOT3_tmp_0 = rtb_y_jt;
    rtb_y_eg_tmp = rtb_Compare_bj;
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_hdg_deg, &rtb_y_jt);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_trk_deg, &rtb_Compare_bj);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel2_bit_gy, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_m3((rtb_y_jt || rtb_Compare_bj || (rtb_DataTypeConversion1_e != 0U)),
      FmgcComputer_U.in.time.dt, &rtb_NOT_b, FmgcComputer_P.MTrigNode1_isRisingEdge_p,
      FmgcComputer_P.MTrigNode1_retriggerable_o, FmgcComputer_P.MTrigNode1_triggerDuration_g,
      &FmgcComputer_DWork.sf_MATLABFunction_dln);
    FmgcComputer_MATLABFunction_a(FmgcComputer_DWork.Memory_PreviousInput_i1, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode1_isRisingEdge_a, FmgcComputer_P.ConfirmNode1_timeDelay_b, &rtb_y_jt,
      &FmgcComputer_DWork.sf_MATLABFunction_k4v);
    rtb_Compare_bj = (FmgcComputer_DWork.Memory_PreviousInput_cv || FmgcComputer_DWork.Memory_PreviousInput_lq ||
                      FmgcComputer_DWork.Memory_PreviousInput_d || rtb_Logic_b[0] ||
                      FmgcComputer_DWork.Memory_PreviousInput_el || FmgcComputer_DWork.Memory_PreviousInput_b);
    rtb_y_jt = (rtb_y_jt || rtb_Compare_bj);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_hz_logic_ra_computation_data_radio_height_ft, &rtb_y_gtq);
    rtb_Compare_bj = (rtb_Compare_bj || rtb_y_ft || ((rtb_y_gtq < FmgcComputer_P.CompareToConstant_const_cn) &&
      rtb_Compare_ov));
    rtb_y_jt = (rtb_NOT_b && rtb_y_jt && rtb_Compare_bj);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_2,
      FmgcComputer_P.BitfromLabel1_bit_pq, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_m3((rtb_DataTypeConversion1_e != 0U), FmgcComputer_U.in.time.dt, &rtb_NOT_b,
      FmgcComputer_P.MTrigNode_isRisingEdge_l, FmgcComputer_P.MTrigNode_retriggerable_e,
      FmgcComputer_P.MTrigNode_triggerDuration_c0, &FmgcComputer_DWork.sf_MATLABFunction_ppu);
    FmgcComputer_MATLABFunction_a(rtb_appCapability_idx_2, FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_nz, FmgcComputer_P.ConfirmNode_timeDelay_a5, &rtb_GreaterThan3,
      &FmgcComputer_DWork.sf_MATLABFunction_k0);
    FmgcComputer_DWork.Memory_PreviousInput_bw = FmgcComputer_P.Logic_table_bs[((((!rtb_Compare_bj) || rtb_OR_iw ||
      rtb_y_mi || FmgcComputer_DWork.Memory_PreviousInput_ip || rtb_NOT_b || rtb_GreaterThan3) + (static_cast<uint32_T>
      (rtb_y_jt) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_bw];
    rtb_BusAssignment_ks_logic_altitude_indicated_ft.SSM = rtb_fm_weight_lbs_SSM;
    rtb_BusAssignment_ks_logic_altitude_indicated_ft.Data = rtb_Max_a;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_5,
      FmgcComputer_P.BitfromLabel1_bit_aw, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = ((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l);
    rtb_y_jt = rtb_y_g;
    FmgcComputer_MATLABFunction_a(rtb_OR_i, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge_b4,
      FmgcComputer_P.ConfirmNode1_timeDelay_h, &rtb_GreaterThan3, &FmgcComputer_DWork.sf_MATLABFunction_hjm);
    FmgcComputer_MATLABFunction_g(rtb_GreaterThan3, FmgcComputer_P.PulseNode3_isRisingEdge_ko, &rtb_y_c1,
      &FmgcComputer_DWork.sf_MATLABFunction_od);
    rtb_NOT_b = rtb_appCapability_idx_2;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_gv, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode2_isRisingEdge_f,
      &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_d5);
    rtb_NOT_b = (rtb_NOT_b && rtb_y_pf);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_ks_logic_altitude_indicated_ft,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_a, &rtb_y_gtq);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_alt_ft,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_mh, &rtb_y_p3);
    rtb_Compare_ov = !FmgcComputer_DWork.Memory_PreviousInput_k;
    rtb_GreaterThan3 = (FmgcComputer_U.in.fms_inputs.preset_spd_mach_activate && (rtb_Compare_ov || (rtb_y_gtq <=
      rtb_y_p3)));
    FmgcComputer_MATLABFunction_g((FmgcComputer_U.in.fms_inputs.v_managed_kts ==
      FmgcComputer_P.CompareToConstant1_const_e), FmgcComputer_P.PulseNode4_isRisingEdge_a, &rtb_y_g3,
      &FmgcComputer_DWork.sf_MATLABFunction_aag);
    rtb_y_ov = rtb_OR_i;
    rtb_y_kr = !FmgcComputer_DWork.Memory_PreviousInput_i;
    rtb_y_nn = (rtb_Compare_ov && rtb_y_kr && (!FmgcComputer_DWork.Memory_PreviousInput_nu) &&
                (!FmgcComputer_DWork.Memory_PreviousInput_as) && (!FmgcComputer_DWork.Memory_PreviousInput_d));
    FmgcComputer_MATLABFunction_g(rtb_Logic_ac[0], FmgcComputer_P.PulseNode7_isRisingEdge_h, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_itu);
    rtb_OR1_j = (rtb_Compare_bj || (rtb_y_g && ((FmgcComputer_DWork.Delay_DSTATE_fe && rtb_OR_i) ||
      ((FmgcComputer_U.in.fms_inputs.v_managed_kts == FmgcComputer_P.CompareToConstant_const_d) && rtb_y_c1 && rtb_y_nn)
      || (rtb_appCapability_idx_2 && (FmgcComputer_U.in.fms_inputs.fms_flight_phase !=
      FmgcComputer_P.EnumeratedConstant_Value_ad)) || rtb_NOT_b || rtb_GreaterThan3 || (rtb_y_g3 && rtb_OR_i && rtb_y_nn)
      || rtb_y_ov)));
    FmgcComputer_MATLABFunction_a(rtb_OR1_j, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ch,
      FmgcComputer_P.ConfirmNode_timeDelay_ht, &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_jcu);
    FmgcComputer_MATLABFunction_g(rtb_BusAssignment_h_logic_engine_running, FmgcComputer_P.PulseNode6_isRisingEdge_j,
      &rtb_y_jt, &FmgcComputer_DWork.sf_MATLABFunction_abn);
    FmgcComputer_MATLABFunction_g(apCondition, FmgcComputer_P.PulseNode5_isRisingEdge_i, &rtb_NOT_b,
      &FmgcComputer_DWork.sf_MATLABFunction_kzm);
    FmgcComputer_DWork.Memory_PreviousInput_cu = FmgcComputer_P.Logic_table_kg
      [((((FmgcComputer_DWork.Delay_DSTATE.auto_spd_control_active && (!rtb_Compare_bj)) || (rtb_y_ft && (rtb_y_jt ||
            rtb_NOT_b))) + (static_cast<uint32_T>(rtb_OR1_j) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_cu];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_5,
      FmgcComputer_P.BitfromLabel_bit_kq, &rtb_DataTypeConversion1_e);
    rtb_Compare_bj = ((rtb_DataTypeConversion1_e != 0U) && rtb_OR2_l);
    FmgcComputer_MATLABFunction_g(apCondition, FmgcComputer_P.PulseNode1_isRisingEdge_n, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_ab);
    rtb_y_jt = (FmgcComputer_U.in.fms_inputs.v_2_kts != FmgcComputer_P.CompareToConstant_const_e);
    FmgcComputer_MATLABFunction_g(rtb_BusAssignment_h_logic_engine_running, FmgcComputer_P.PulseNode5_isRisingEdge_b,
      &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_hkc);
    FmgcComputer_MATLABFunction_g(rtb_y_jt, FmgcComputer_P.PulseNode2_isRisingEdge_iu, &rtb_GreaterThan3,
      &FmgcComputer_DWork.sf_MATLABFunction_ft);
    rtb_GreaterThan3 = (apCondition && rtb_GreaterThan3);
    rtb_NOT_b = ((rtb_y_ov && rtb_y_jt) || (rtb_NOT_b && rtb_y_jt && apCondition) || rtb_GreaterThan3);
    rtb_OR1_j = (FmgcComputer_DWork.Memory_PreviousInput_i || FmgcComputer_DWork.Memory_PreviousInput_k);
    FmgcComputer_MATLABFunction_g(rtb_OR1_j, FmgcComputer_P.PulseNode3_isRisingEdge_i, &rtb_y_ov,
      &FmgcComputer_DWork.sf_MATLABFunction_mrn);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel2_bit_ie, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_jp, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_ih);
    FmgcComputer_MATLABFunction_g((FmgcComputer_DWork.Memory_PreviousInput_mx ||
      FmgcComputer_DWork.Memory_PreviousInput_o), FmgcComputer_P.PulseNode4_isRisingEdge_n, &rtb_GreaterThan3,
      &FmgcComputer_DWork.sf_MATLABFunction_lr);
    rtb_y_jt = ((rtb_y_ft && rtb_NOT_b) || (rtb_y_ov || rtb_y_nn || rtb_GreaterThan3));
    rtb_NOT_b = (FmgcComputer_U.in.fms_inputs.v_managed_kts != FmgcComputer_P.CompareToConstant2_const_m);
    rtb_GreaterThan3 = (FmgcComputer_U.in.fms_inputs.v_2_kts != FmgcComputer_P.CompareToConstant3_const_j);
    rtb_y_jt = (rtb_Compare_bj || (rtb_y_g && rtb_y_jt && (rtb_NOT_b || rtb_GreaterThan3)));
    FmgcComputer_MATLABFunction_a(rtb_y_jt, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_h2,
      FmgcComputer_P.ConfirmNode_timeDelay_gz, &rtb_Compare_bj, &FmgcComputer_DWork.sf_MATLABFunction_j3h);
    FmgcComputer_MATLABFunction_g((FmgcComputer_U.in.fms_inputs.v_managed_kts ==
      FmgcComputer_P.CompareToConstant4_const_n), FmgcComputer_P.PulseNode6_isRisingEdge_k, &rtb_GreaterThan3,
      &FmgcComputer_DWork.sf_MATLABFunction_dq);
    FmgcComputer_MATLABFunction_g((FmgcComputer_U.in.fms_inputs.v_2_kts == FmgcComputer_P.CompareToConstant5_const_h),
      FmgcComputer_P.PulseNode7_isRisingEdge_c, &rtb_NOT_b, &FmgcComputer_DWork.sf_MATLABFunction_hpe);
    FmgcComputer_DWork.Memory_PreviousInput_hk = FmgcComputer_P.Logic_table_ds
      [((((FmgcComputer_DWork.Delay_DSTATE.manual_spd_control_active && (!rtb_Compare_bj)) || (rtb_y_ft && (rtb_y_kr &&
            rtb_Compare_ov && rtb_y_n) && (rtb_GreaterThan3 || rtb_NOT_b))) + (static_cast<uint32_T>(rtb_y_jt) << 1)) <<
        1) + FmgcComputer_DWork.Memory_PreviousInput_hk];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel_bit_as, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_g((rtb_DataTypeConversion1_e != 0U), FmgcComputer_P.PulseNode_isRisingEdge_c2,
      &rtb_GreaterThan3, &FmgcComputer_DWork.sf_MATLABFunction_mw);
    FmgcComputer_DWork.Delay_DSTATE_c = FmgcComputer_P.Logic_table_ap[(((static_cast<uint32_T>
      (((!FmgcComputer_DWork.Delay_DSTATE_c) && rtb_GreaterThan3) || FmgcComputer_U.in.fms_inputs.fms_mach_mode_activate
       || (FmgcComputer_U.in.fms_inputs.preset_spd_mach_activate && (FmgcComputer_U.in.fms_inputs.preset_mach >
      FmgcComputer_P.CompareToConstant1_const_b))) << 1) + ((rtb_GreaterThan3 && FmgcComputer_DWork.Delay_DSTATE_c) ||
      FmgcComputer_U.in.fms_inputs.fms_spd_mode_activate || (FmgcComputer_U.in.fms_inputs.preset_spd_mach_activate &&
      (FmgcComputer_U.in.fms_inputs.preset_spd_kts > FmgcComputer_P.CompareToConstant_const_l3)))) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_bo];
    rtb_BusAssignment_dc_logic_adr_computation_data_airspeed_computed_kn.SSM =
      rtb_adrComputationBus_airspeed_computed_kn_SSM;
    rtb_BusAssignment_dc_logic_adr_computation_data_airspeed_computed_kn.Data =
      rtb_adrComputationBus_airspeed_computed_kn_Data;
    rtb_BusAssignment_dc_logic_adr_computation_data_corrected_average_static_pressure.SSM =
      rtb_adrComputationBus_corrected_average_static_pressure_SSM;
    rtb_BusAssignment_dc_logic_adr_computation_data_corrected_average_static_pressure.Data =
      rtb_adrComputationBus_corrected_average_static_pressure_Data;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_ls_kn.SSM = rtb_Switch_v_ls_kn_SSM;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_ls_kn.Data = rtb_Switch_v_ls_kn_Data;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_3_kn.SSM = rtb_Switch_v_3_kn_SSM;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_3_kn.Data = rtb_Switch_v_3_kn_Data;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_4_kn.SSM = rtb_Switch_v_4_kn_SSM;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_4_kn.Data = rtb_Switch_v_4_kn_Data;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_man_kn.SSM = rtb_Switch_v_man_kn_SSM;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_man_kn.Data = rtb_Switch_v_man_kn_Data;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_max_kn.SSM = rtb_Switch_v_max_kn_SSM;
    rtb_BusAssignment_dc_logic_chosen_fac_bus_v_max_kn.Data = rtb_Switch_v_max_kn_Data;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_adr_computation_data_corrected_average_static_pressure,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_b, &rtb_y_gtq);
    rtb_y_bf = std::pow((std::pow(FmgcComputer_U.in.bus_inputs.fcu_bus.selected_mach.Data *
      FmgcComputer_U.in.bus_inputs.fcu_bus.selected_mach.Data * 0.2F + 1.0F, 3.5F) - 1.0F) * (rtb_y_gtq / 1013.25F) +
                        1.0F, 0.285714298F);
    if (rtb_y_n) {
      FmgcComputer_B.u_l = FmgcComputer_U.in.fms_inputs.v_managed_kts;
    }

    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_chosen_fac_bus_v_man_kn,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_h, &rtb_y_gtq);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_chosen_fac_bus_v_4_kn,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_c, &rtb_y_p3);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_chosen_fac_bus_v_3_kn,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_j, &rtb_y_o);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_m, &rtb_y_ia);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_chosen_fac_bus_v_ls_kn,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_i, &rtb_DataTypeConversion2_bh);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_cz, &rtb_y_pv);
    if (!FmgcComputer_DWork.vMemoEo_not_empty) {
      FmgcComputer_DWork.vMemoEo = rtb_y_ia;
      FmgcComputer_DWork.vMemoEo_not_empty = true;
    }

    if (!FmgcComputer_DWork.vMemoGa_not_empty) {
      FmgcComputer_DWork.vMemoGa = rtb_y_ia;
      FmgcComputer_DWork.vMemoGa_not_empty = true;
    }

    if (rtb_y_kr) {
      FmgcComputer_DWork.vMemoGa = rtb_y_ia;
    }

    rtb_GreaterThan3 = !rtb_BusAssignment_h_logic_one_engine_out;
    if (rtb_GreaterThan3) {
      FmgcComputer_DWork.vMemoEo = rtb_y_ia;
    }

    if (FmgcComputer_DWork.Memory_PreviousInput_i) {
      if (rtb_BusAssignment_h_logic_one_engine_out) {
        high_i = 15;
      } else {
        high_i = 25;
      }

      rtb_Phi_c_deg = rtb_DataTypeConversion2_bh + static_cast<real_T>(high_i);
      rtb_Nosewheel_c = rtb_y_pv - 5.0;
      if (rtb_y_pv - 5.0 > rtb_Phi_c_deg) {
        rtb_Nosewheel_c = rtb_Phi_c_deg;
      }

      if (rtb_Nosewheel_c > FmgcComputer_DWork.vMemoGa) {
        rtb_Nosewheel_c = FmgcComputer_DWork.vMemoGa;
      }

      rtb_Phi_c_deg = std::fmax(FmgcComputer_B.u_l, rtb_Nosewheel_c);
      rtb_Nosewheel_c = rtb_Phi_c_deg;
    } else if (rtb_BusAssignment_h_logic_one_engine_out) {
      rtb_Phi_c_deg = std::fmax(FmgcComputer_U.in.fms_inputs.v_2_kts, std::fmin(FmgcComputer_U.in.fms_inputs.v_2_kts +
        15.0, FmgcComputer_DWork.vMemoEo));
      rtb_Nosewheel_c = rtb_Phi_c_deg;
    } else {
      rtb_Phi_c_deg = FmgcComputer_U.in.fms_inputs.v_2_kts + 10.0;
      rtb_Nosewheel_c = FmgcComputer_U.in.fms_inputs.v_2_kts;
    }

    if (FmgcComputer_DWork.Memory_PreviousInput_hk) {
      if (FmgcComputer_DWork.Memory_PreviousInput_d || FmgcComputer_DWork.Memory_PreviousInput_l ||
          (FmgcComputer_U.in.fms_inputs.fms_flight_phase == FmgcComputer_P.EnumeratedConstant_Value_n)) {
        rtb_Switch_of[0] = std::fmax(std::fmax(std::fmax(static_cast<real_T>(rtb_y_gtq), static_cast<real_T>(rtb_y_p3)),
          static_cast<real_T>(rtb_y_o)), FmgcComputer_B.u_l);
        rtb_Switch_of[1] = FmgcComputer_B.u_l;
      } else if (rtb_OR1_j) {
        rtb_Switch_of[0] = rtb_Phi_c_deg;
        rtb_Switch_of[1] = rtb_Nosewheel_c;
      } else {
        if ((FmgcComputer_U.in.fms_inputs.requested_des_submode == FmgcComputer_P.EnumeratedConstant1_Value_i) &&
            FmgcComputer_DWork.Memory_PreviousInput_b3 && FmgcComputer_U.in.fms_inputs.show_speed_margins) {
          rtb_Switch_of[0] = FmgcComputer_U.in.fms_inputs.v_upper_margin_kts;
        } else {
          rtb_Switch_of[0] = FmgcComputer_U.in.fms_inputs.v_managed_kts;
        }

        rtb_Switch_of[1] = FmgcComputer_U.in.fms_inputs.v_managed_kts;
      }
    } else {
      if (FmgcComputer_DWork.Delay_DSTATE_c) {
        rtb_y_p3 = std::sqrt(rtb_y_bf - 1.0F) * 1479.1F;
      } else {
        rtb_y_p3 = FmgcComputer_U.in.bus_inputs.fcu_bus.selected_spd_kts.Data;
      }

      rtb_Switch_of[0] = rtb_y_p3;
      rtb_Switch_of[1] = rtb_y_p3;
    }

    rtb_Compare_bj = (FmgcComputer_DWork.Memory_PreviousInput_cb && (FmgcComputer_U.in.fms_inputs.fms_flight_phase ==
      FmgcComputer_P.EnumeratedConstant_Value_a4) && FmgcComputer_DWork.Delay_DSTATE_c &&
                      FmgcComputer_DWork.Delay_DSTATE_k);
    rtb_Phi_c_deg = std::abs(rtb_Switch_of[0] - rtb_adrComputationBus_airspeed_computed_kn_Data);
    rtb_Compare_ov = (rtb_Phi_c_deg > FmgcComputer_P.CompareToConstant_const_h);
    FmgcComputer_MATLABFunction_a(rtb_Compare_ov, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode1_isRisingEdge_i,
      FmgcComputer_P.ConfirmNode1_timeDelay_df, &rtb_y_kr, &FmgcComputer_DWork.sf_MATLABFunction_hi);
    FmgcComputer_MATLABFunction_a((rtb_Phi_c_deg > FmgcComputer_P.CompareToConstant1_const_c), FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode2_isRisingEdge_i, FmgcComputer_P.ConfirmNode2_timeDelay_i, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_oep);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_dc_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault6_defaultValue_g, &rtb_y_pv);
    rtb_Phi_c_deg = rtb_y_pv;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fcu_bus.fcu_discrete_word_1,
      FmgcComputer_P.BitfromLabel3_bit_mz, &rtb_DataTypeConversion1_e);
    rtb_y_jt = ((!rtb_Compare_bj) || rtb_y_kr || rtb_y_nn || (rtb_adrComputationBus_airspeed_computed_kn_Data > rtb_y_pv
      + FmgcComputer_P.Bias_Bias) || (rtb_DataTypeConversion1_e != 0U));
    FmgcComputer_MATLABFunction_a((rtb_Compare_bj && (!rtb_Compare_ov) && (!rtb_y_jt)), FmgcComputer_U.in.time.dt,
      FmgcComputer_P.ConfirmNode_isRisingEdge_dh, FmgcComputer_P.ConfirmNode_timeDelay_mf, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_nj);
    absVsTarget = static_cast<int32_T>((((static_cast<uint32_T>(rtb_y_nn) << 1) + rtb_y_jt) << 1) +
      FmgcComputer_DWork.Memory_PreviousInput_ak);
    rtb_Logic_hq[0U] = FmgcComputer_P.Logic_table_am[static_cast<uint32_T>(absVsTarget)];
    rtb_Logic_hq[1U] = FmgcComputer_P.Logic_table_am[static_cast<uint32_T>(absVsTarget) + 8U];
    rtb_y_jt = (rtb_appInop_idx_1 || FmgcComputer_DWork.Memory_PreviousInput_cb ||
                FmgcComputer_DWork.Memory_PreviousInput_ne || FmgcComputer_DWork.Memory_PreviousInput_ec ||
                FmgcComputer_DWork.Memory_PreviousInput_b3 || FmgcComputer_DWork.Memory_PreviousInput_mx ||
                FmgcComputer_DWork.Memory_PreviousInput_o || rtb_Logic_b[0] ||
                FmgcComputer_DWork.Memory_PreviousInput_nu || FmgcComputer_DWork.Memory_PreviousInput_as ||
                FmgcComputer_DWork.Memory_PreviousInput_ae || FmgcComputer_DWork.Memory_PreviousInput_ev ||
                FmgcComputer_DWork.Memory_PreviousInput_i || FmgcComputer_DWork.Memory_PreviousInput_k || rtb_Logic_ac[0]
                || FmgcComputer_DWork.Memory_PreviousInput_d);
    rtb_active_lateral_law = lateral_law::NONE;
    rtb_active_longitudinal_law = vertical_law::NONE;
    if (FmgcComputer_DWork.Memory_PreviousInput_m || FmgcComputer_DWork.Memory_PreviousInput_c) {
      rtb_active_lateral_law = lateral_law::ROLL_OUT;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_lq || FmgcComputer_DWork.Memory_PreviousInput_d) {
      rtb_active_lateral_law = lateral_law::LOC_TRACK;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_cv) {
      rtb_active_lateral_law = lateral_law::LOC_CPT;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_ip) {
      rtb_active_lateral_law = lateral_law::HPATH;
    } else if (rtb_y_mi || FmgcComputer_DWork.Memory_PreviousInput_b || FmgcComputer_DWork.Memory_PreviousInput_el) {
      rtb_active_lateral_law = lateral_law::TRACK;
    } else if (rtb_OR_iw) {
      rtb_active_lateral_law = lateral_law::HDG;
    }

    if (rtb_y_eu) {
      rtb_active_longitudinal_law = vertical_law::FLARE;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_nu || FmgcComputer_DWork.Memory_PreviousInput_as ||
               FmgcComputer_DWork.Memory_PreviousInput_d) {
      rtb_active_longitudinal_law = vertical_law::GS;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_k || FmgcComputer_DWork.Memory_PreviousInput_i) {
      rtb_active_longitudinal_law = vertical_law::SRS;
    } else if (Memory_PreviousInput_l_tmp_0) {
      rtb_active_longitudinal_law = vertical_law::FPA;
    } else if (rtb_AND12 || (rtb_Logic_ac[0] && (rtb_mode == tcas_submode::VS))) {
      rtb_active_longitudinal_law = vertical_law::VS;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_ec || FmgcComputer_DWork.Memory_PreviousInput_ev ||
               FmgcComputer_DWork.Memory_PreviousInput_ae || FmgcComputer_DWork.Memory_PreviousInput_mx ||
               FmgcComputer_DWork.Memory_PreviousInput_o) {
      rtb_active_longitudinal_law = vertical_law::SPD_MACH;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_ne || (rtb_Logic_ac[0] && (rtb_mode == tcas_submode::ALT_ACQ))) {
      rtb_active_longitudinal_law = vertical_law::ALT_ACQ;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_cb || (rtb_Logic_ac[0] && (rtb_mode == tcas_submode::ALT_HOLD)))
    {
      rtb_active_longitudinal_law = vertical_law::ALT_HOLD;
    } else if (rtb_Logic_b[0]) {
      rtb_active_longitudinal_law = vertical_law::VPATH;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_b3) {
      if (FmgcComputer_U.in.fms_inputs.requested_des_submode == fmgc_des_submode::SPEED_THRUST) {
        rtb_active_longitudinal_law = vertical_law::SPD_MACH;
      } else if ((FmgcComputer_U.in.fms_inputs.requested_des_submode == fmgc_des_submode::VPATH_THRUST) ||
                 (FmgcComputer_U.in.fms_inputs.requested_des_submode == fmgc_des_submode::VPATH_SPEED)) {
        rtb_active_longitudinal_law = vertical_law::VPATH;
      } else {
        switch (FmgcComputer_U.in.fms_inputs.requested_des_submode) {
         case fmgc_des_submode::FPA_SPEED:
          rtb_active_longitudinal_law = vertical_law::FPA;
          break;

         case fmgc_des_submode::VS_SPEED:
          rtb_active_longitudinal_law = vertical_law::VS;
          break;
        }
      }
    }

    rtb_Compare_ov = (rtb_y_l1 || FmgcComputer_DWork.Memory_PreviousInput_el ||
                      FmgcComputer_DWork.Memory_PreviousInput_cv || FmgcComputer_DWork.Memory_PreviousInput_lq ||
                      rtb_OR_iw || rtb_y_mi || FmgcComputer_DWork.Memory_PreviousInput_ip ||
                      FmgcComputer_DWork.Memory_PreviousInput_d);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3,
      FmgcComputer_P.BitfromLabel_bit_i, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_3, &rtb_Compare_bj);
    rtb_Compare_bj = ((rtb_DataTypeConversion1_e != 0U) && rtb_Compare_bj);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel1_bit_i5, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4, &rtb_OR1_j);
    rtb_Compare_bj = ((rtb_Compare_bj || ((rtb_DataTypeConversion1_e != 0U) && rtb_OR1_j)) &&
                      FmgcComputer_U.in.discrete_inputs.ap_opp_engaged);
    rtb_OR1_j = (rtb_Logic_a2[0] && (FmgcComputer_DWork.Memory_PreviousInput_l ||
      FmgcComputer_DWork.Memory_PreviousInput_d));
    rtb_y_nn = ((!rtb_ap_inop_tmp) && (FmgcComputer_U.in.discrete_inputs.fwc_own_valid ||
      FmgcComputer_U.in.discrete_inputs.fwc_opp_valid) && FmgcComputer_U.in.discrete_inputs.pfd_own_valid &&
                FmgcComputer_U.in.discrete_inputs.pfd_opp_valid && rtb_BusAssignment_o_logic_both_ils_valid &&
                (rtb_raComputationData_radio_height_ft_SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)));
    rtb_y_ov = (rtb_y_nn && (!rtb_ap_inop_tmp_tmp) && raOppInvalid);
    rtb_y_kr = (FmgcComputer_U.in.discrete_inputs.fwc_own_valid && FmgcComputer_U.in.discrete_inputs.fwc_opp_valid &&
                FmgcComputer_U.in.discrete_inputs.powersupply_split && FmgcComputer_U.in.discrete_inputs.pfd_own_valid &&
                FmgcComputer_U.in.discrete_inputs.pfd_opp_valid && rtb_appInop_idx_2 &&
                rtb_TmpSignalConversionAtSFunctionInport3_idx_0 && raOppInvalid &&
                rtb_BusAssignment_o_logic_both_ils_valid && rtb_adrOppInvalid && rtb_adrOwnInvalid &&
                FmgcComputer_U.in.discrete_inputs.bscu_own_valid && FmgcComputer_U.in.discrete_inputs.bscu_opp_valid &&
                rtb_ir3Invalid);
    rtb_appCapability_idx_2 = (FmgcComputer_DWork.pLand3FailOp || (rtb_y_kr && rtb_OR1_j && rtb_Compare_bj &&
      FmgcComputer_DWork.Delay_DSTATE_k));
    rtb_y_c1 = !rtb_appCapability_idx_2;
    rtb_NOT_b = (FmgcComputer_DWork.pLand3FailPass || (rtb_y_ov && rtb_OR1_j && FmgcComputer_DWork.Delay_DSTATE_k &&
      rtb_y_c1));
    rtb_y_c1 = (rtb_y_nn && rtb_OR1_j && (!rtb_NOT_b) && rtb_y_c1);
    rtb_y_g3 = !rtb_y_nn;
    rtb_appInop_idx_1 = !rtb_y_ov;
    rtb_appInop_idx_2 = !rtb_y_kr;
    if ((rtb_raComputationData_radio_height_ft_Data < 100.0F) && (rtb_OR1_j || rtb_Compare_bj)) {
      FmgcComputer_DWork.pLand3FailOp = rtb_appCapability_idx_2;
      FmgcComputer_DWork.pLand3FailPass = rtb_NOT_b;
    } else {
      FmgcComputer_DWork.pLand3FailOp = false;
      FmgcComputer_DWork.pLand3FailPass = false;
    }

    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel2_bit_o, &rtb_DataTypeConversion1_e);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4, &rtb_Compare_bj);
    rtb_TmpSignalConversionAtSFunctionInport3_idx_0 = ((rtb_DataTypeConversion1_e != 0U) && rtb_Compare_bj);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel3_bit_l, &rtb_DataTypeConversion1_e);
    rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = ((rtb_DataTypeConversion1_e != 0U) && rtb_Compare_bj);
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.discrete_word_4,
      FmgcComputer_P.BitfromLabel4_bit_fw, &rtb_DataTypeConversion1_e);
    rtb_TmpSignalConversionAtSFunctionInport3_idx_2 = ((rtb_DataTypeConversion1_e != 0U) && rtb_Compare_bj);
    if (rtb_Logic_a2[0] && FmgcComputer_U.in.discrete_inputs.ap_opp_engaged) {
      if (FmgcComputer_U.in.discrete_inputs.is_unit_1) {
        rtb_TmpSignalConversionAtSFunctionInport3_idx_0 = rtb_y_c1;
        rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = rtb_NOT_b;
        rtb_TmpSignalConversionAtSFunctionInport3_idx_2 = rtb_appCapability_idx_2;
      }
    } else if (!rtb_y_if) {
      rtb_TmpSignalConversionAtSFunctionInport3_idx_0 = rtb_y_c1;
      rtb_TmpSignalConversionAtSFunctionInport3_idx_1 = rtb_NOT_b;
      rtb_TmpSignalConversionAtSFunctionInport3_idx_2 = rtb_appCapability_idx_2;
    }

    rtb_BusAssignment_jm_logic_ir_computation_data_track_angle_magnetic_deg.SSM =
      rtb_irComputationBus_track_angle_magnetic_deg_SSM;
    rtb_BusAssignment_jm_logic_ir_computation_data_track_angle_magnetic_deg.Data = rtb_Gain2_f;
    rtb_BusAssignment_jm_logic_ra_computation_data_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    rtb_BusAssignment_jm_logic_ra_computation_data_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    rtb_BusAssignment_jm_logic_chosen_fac_bus_estimated_sideslip_deg.SSM = rtb_Switch_estimated_sideslip_deg_SSM;
    rtb_BusAssignment_jm_logic_chosen_fac_bus_estimated_sideslip_deg.Data = rtb_Switch_estimated_sideslip_deg_Data;
    rtb_BusAssignment_jm_logic_chosen_fac_bus_v_ls_kn.SSM = rtb_Switch_v_ls_kn_SSM;
    rtb_BusAssignment_jm_logic_chosen_fac_bus_v_ls_kn.Data = rtb_Switch_v_ls_kn_Data;
    rtb_BusAssignment_jm_logic_chosen_fac_bus_v_max_kn.SSM = rtb_Switch_v_max_kn_SSM;
    rtb_BusAssignment_jm_logic_chosen_fac_bus_v_max_kn.Data = rtb_Switch_v_max_kn_Data;
    rtb_BusAssignment_jm_logic_ils_computation_data_glideslope_deviation_deg.SSM =
      rtb_Switch_i_glideslope_deviation_deg_SSM;
    rtb_BusAssignment_jm_logic_ils_computation_data_glideslope_deviation_deg.Data =
      rtb_Switch_i_glideslope_deviation_deg_Data;
    FmgcComputer_DWork.Delay_DSTATE.any_longitudinal_mode_engaged = rtb_y_jt;
    rtb_DataTypeConversion_cm = rtb_irComputationBus_pitch_angle_deg_Data;
    rtb_DataTypeConversion1_d = rtb_irComputationBus_roll_angle_deg_Data;
    rtb_DataTypeConversion8 = rtb_irComputationBus_pitch_att_rate_deg_s_Data;
    rtb_DataTypeConversion2_i = rtb_irComputationBus_body_yaw_rate_deg_s_Data;
    rtb_DataTypeConversion3 = rtb_irComputationBus_body_roll_rate_deg_s_Data;
    rtb_DataTypeConversion4 = rtb_adrComputationBus_airspeed_computed_kn_Data;
    rtb_DataTypeConversion5 = rtb_adrComputationBus_airspeed_true_kn_Data;
    rtb_DataTypeConversion6 = rtb_adrComputationBus_mach_Data;
    rtb_DataTypeConversion7 = rtb_Cos_h;
    rtb_DataTypeConversion9 = rtb_adrComputationBus_aoa_corrected_deg_Data;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jm_logic_chosen_fac_bus_estimated_sideslip_deg,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_h, &rtb_y_p3);
    rtb_DataTypeConversion27 = rtb_y_p3;
    rtb_DataTypeConversion11 = rtb_adrComputationBus_altitude_standard_ft_Data;
    rtb_DataTypeConversion12 = rtb_Max_a;
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_jm_logic_ra_computation_data_radio_height_ft, &rtb_y_o);
    rtb_DataTypeConversion24 = rtb_y_o;
    rtb_DataTypeConversion13 = rtb_irComputationBus_inertial_vertical_speed_ft_s_Data;
    rtb_DataTypeConversion14 = rtb_irComputationBus_heading_magnetic_deg_Data;
    rtb_DataTypeConversion15 = rtb_Gain2_f;
    rtb_DataTypeConversion16 = rtb_irComputationBus_heading_true_deg_Data;
    rtb_DataTypeConversion20 = rtb_irComputationBus_track_angle_true_deg_Data;
    rtb_Gain = FmgcComputer_P.Gain_Gain_h * rtb_irComputationBus_body_long_accel_g_Data;
    rtb_Gain1 = FmgcComputer_P.Gain1_Gain * rtb_irComputationBus_body_lat_accel_g_Data;
    rtb_Nosewheel_c = rtb_irComputationBus_body_normal_accel_g_Data;
    rtb_Gain2 = (rtb_irComputationBus_body_normal_accel_g_Data + FmgcComputer_P.Bias_Bias_p) * FmgcComputer_P.Gain2_Gain;
    if (rtb_y_n) {
      FmgcComputer_B.u = FmgcComputer_U.in.fms_inputs.fms_loc_distance;
    }

    rtb_DataTypeConversion25 = rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg.Data;
    FmgcComputer_MATLABFunction_ie(&rtb_BusAssignment_jm_logic_ils_computation_data_glideslope_deviation_deg, &rtb_y_n);
    rtb_DataTypeConversion23 = rtb_Switch_i_glideslope_deviation_deg_Data;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jm_logic_chosen_fac_bus_v_ls_kn,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_p, &rtb_y_gtq);
    rtb_DataTypeConversion32 = rtb_y_gtq;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jm_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault6_defaultValue_i, &rtb_y_bf);
    rtb_DataTypeConversion26 = rtb_y_bf;
    rtb_Gain3 = FmgcComputer_P.Gain3_Gain * FmgcComputer_U.in.fms_inputs.fms_weight_lbs;
    rtb_DataTypeConversion21 = static_cast<real_T>(rtb_active_lateral_law);
    rtb_DataTypeConversion22 = static_cast<real_T>(rtb_active_longitudinal_law);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_hdg_deg,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_j, &rtb_y_pv);
    rtb_DataTypeConversion39 = rtb_y_pv;
    rtb_Compare_bj = (FmgcComputer_DWork.Memory_PreviousInput_el || FmgcComputer_DWork.Memory_PreviousInput_b);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jm_logic_ir_computation_data_track_angle_magnetic_deg,
      FmgcComputer_P.A429ValueOrDefault8_defaultValue, &rtb_DataTypeConversion2_bh);
    if (!rtb_Compare_bj) {
      FmgcComputer_B.u_lyjjl = rtb_DataTypeConversion2_bh;
    }

    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_trk_deg,
      FmgcComputer_P.A429ValueOrDefault7_defaultValue_a, &rtb_DataTypeConversion2_bh);
    if (rtb_Compare_bj) {
      rtb_DataTypeConversion10 = FmgcComputer_B.u_lyjjl;
    } else {
      rtb_DataTypeConversion10 = rtb_DataTypeConversion2_bh;
    }

    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_vz_ft_min,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_fc, &rtb_y_pv);
    if (rtb_Logic_ac[0]) {
      rtb_Switch1 = rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_b3) {
      rtb_Switch1 = FmgcComputer_U.in.fms_inputs.vs_target_ft_min;
    } else {
      rtb_Switch1 = rtb_y_pv;
    }

    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_fpa_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_f, &rtb_y_ia);
    if (FmgcComputer_DWork.Memory_PreviousInput_b3) {
      rtb_Switch3 = FmgcComputer_U.in.fms_inputs.vs_target_ft_min;
    } else {
      rtb_Switch3 = rtb_y_ia;
    }

    rtb_OR1_j = (FmgcComputer_DWork.Memory_PreviousInput_as || FmgcComputer_DWork.Memory_PreviousInput_d);
    LawMDLOBJ1.step(&FmgcComputer_U.in.time.dt, &FmgcComputer_U.in.time.simulation_time, &rtb_DataTypeConversion_cm,
                    &rtb_DataTypeConversion1_d, &rtb_DataTypeConversion8, &rtb_DataTypeConversion2_i,
                    &rtb_DataTypeConversion3, &rtb_DataTypeConversion4, &rtb_DataTypeConversion5,
                    &rtb_DataTypeConversion6, &rtb_DataTypeConversion7, &rtb_DataTypeConversion9,
                    &rtb_DataTypeConversion27, &rtb_DataTypeConversion11, &rtb_DataTypeConversion12,
                    &rtb_DataTypeConversion24, &rtb_DataTypeConversion13, &rtb_DataTypeConversion14,
                    &rtb_DataTypeConversion15, &rtb_DataTypeConversion16, &rtb_DataTypeConversion20, &rtb_Gain,
                    &rtb_Gain1, &rtb_Gain2, &FmgcComputer_B.u_lyjj,
                    &FmgcComputer_U.in.fms_inputs.fms_unrealistic_gs_angle_deg, &FmgcComputer_B.u,
                    &FmgcComputer_P.Constant_Value_i, &rtb_DataTypeConversion25, &rtb_y_n, &rtb_DataTypeConversion23,
                    &FmgcComputer_U.in.fms_inputs.xtk_nmi, &FmgcComputer_U.in.fms_inputs.tke_deg,
                    &FmgcComputer_U.in.fms_inputs.phi_c_deg, &FmgcComputer_U.in.fms_inputs.phi_limit_deg,
                    &FmgcComputer_U.in.fms_inputs.alt_profile_tgt_ft, &FmgcComputer_U.in.fms_inputs.vs_target_ft_min,
                    &rtb_DataTypeConversion32, &rtb_DataTypeConversion26, &rtb_y_ft, &FmgcComputer_P.Constant1_Value_io,
                    &rtb_Gain3, &(&rtb_Logic_a2[0])[0], &rtb_DataTypeConversion21, &rtb_DataTypeConversion22,
                    &rtb_DataTypeConversion39, &rtb_DataTypeConversion10, &rtb_altCstrOrFcu, &rtb_Switch1, &rtb_Switch3,
                    &(&rtb_Switch_of[0])[0], &(&rtb_Logic_hq[0])[0], &(&rtb_Logic_ac[0])[0], &(&rtb_Logic_b[0])[0],
                    &rtb_OR1_j, &rtb_Phi_loc_c, &rtb_Nosewheel_c, &rtb_Theta_c_deg, &rtb_Phi_c_deg, &rtb_Beta_c_deg,
                    &rtb_Product_p2, &rtb_Switch1_a, &rtb_Beta_c_deg_e, &rtb_Compare_bj, &rtb_H_dot_radio_fpm,
                    &rtb_H_dot_c_fpm, &rtb_delta_Theta_H_dot_deg, &rtb_delta_Theta_bz_deg, &rtb_delta_Theta_bx_deg,
                    &rtb_delta_Theta_beta_c_deg);
    rtb_BusAssignment_fo_logic_chosen_fac_bus_discrete_word_5.SSM = rtb_Switch_discrete_word_5_SSM;
    rtb_BusAssignment_fo_logic_chosen_fac_bus_discrete_word_5.Data = rtb_Switch_discrete_word_5_Data;
    FmgcComputer_DWork.Delay2_DSTATE.autopilot.Theta_c_deg = rtb_Product_p2;
    FmgcComputer_DWork.Delay2_DSTATE.autopilot.Phi_c_deg = rtb_Switch1_a;
    FmgcComputer_MATLABFunction_a(rtb_Logic_ac[0], FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_oa,
      FmgcComputer_P.ConfirmNode_timeDelay_a0, &rtb_y_kr, &FmgcComputer_DWork.sf_MATLABFunction_a);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_p, &rtb_DataTypeConversion2_bh);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_k, &rtb_y_p3);
    FmgcComputer_MATLABFunction_g(rtb_Logic_ac[0], FmgcComputer_P.PulseNode3_isRisingEdge_l4, &rtb_y_nn,
      &FmgcComputer_DWork.sf_MATLABFunction_g);
    absVsTarget = static_cast<int32_T>((((rtb_OR2_l_tmp_0 || (rtb_y_kr && ((rtb_DataTypeConversion2_bh <
      FmgcComputer_P.CompareToConstant_const_j) || (rtb_y_p3 < FmgcComputer_P.CompareToConstant1_const_d)))) + (
      static_cast<uint32_T>(rtb_y_nn) << 1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_j);
    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_fo_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel_bit_cb, &rtb_y_jm);
    FmgcComputer_MATLABFunction_g((FmgcComputer_P.Logic_table_lwo[static_cast<uint32_T>(absVsTarget) + 8U] && (rtb_y_jm
      != 0U)), FmgcComputer_P.PulseNode3_isRisingEdge_ng, &rtb_y_ov, &FmgcComputer_DWork.sf_MATLABFunction_k);
    FmgcComputer_DWork.Memory_PreviousInput_hu = FmgcComputer_P.Logic_table_lm[(((static_cast<uint32_T>(rtb_y_ov) << 1)
      + rtb_y_ju) << 1) + FmgcComputer_DWork.Memory_PreviousInput_hu];
    rtb_DataTypeConversion_cm = rtb_Switch1_a;
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_hw, &rtb_y_p3);
    rtb_y_n = (rtb_y_p3 >= FmgcComputer_P.CompareToConstant_const_hq);
    rtb_OR1_j = (rtb_y_p3 <= FmgcComputer_P.CompareToConstant2_const_di);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_o2, &rtb_y_p3);
    rtb_y_kr = (rtb_y_p3 >= FmgcComputer_P.CompareToConstant1_const_h);
    rtb_y_ov = (rtb_y_p3 <= FmgcComputer_P.CompareToConstant3_const_d);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_flex_temp_deg, &rtb_y_nn);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_flex_temp_deg, &rtb_y_ja);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_k, &rtb_y_p3);
    rtb_Compare_d0 = (rtb_y_p3 > FmgcComputer_P.CompareToConstant4_const_p);
    rtb_Compare_kg = (rtb_y_p3 <= FmgcComputer_P.CompareToConstant6_const_h);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_l, &rtb_y_p3);
    rtb_DataTypeConversion1_d = rtb_Product_p2;
    rtb_y_ov = (FmgcComputer_DWork.Delay_DSTATE_k && (FmgcComputer_DWork.Memory_PreviousInput_hu || (rtb_y_n &&
      rtb_OR1_j && rtb_y_kr && rtb_y_ov) || ((!rtb_y_nn) && (!rtb_y_ja) && rtb_BusAssignment_h_logic_one_engine_out &&
      (rtb_Compare_d0 && rtb_Compare_kg && (rtb_y_p3 > FmgcComputer_P.CompareToConstant5_const_av) && (rtb_y_p3 <=
      FmgcComputer_P.CompareToConstant7_const)))));
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_m, &rtb_y_p3);
    rtb_Switch1_a = rtb_y_p3;
    rtb_y_n = (rtb_y_p3 < FmgcComputer_P.CompareToConstant8_const);
    FmgcComputer_MATLABFunction(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_fk, &rtb_y_p3);
    rtb_y_nn = (rtb_y_ov && ((rtb_Switch1_a < FmgcComputer_P.CompareToConstant10_const) || (rtb_y_p3 <
      FmgcComputer_P.CompareToConstant11_const) || (rtb_BusAssignment_h_logic_one_engine_out && (rtb_y_n || (rtb_y_p3 <
      FmgcComputer_P.CompareToConstant9_const)))));
    rtb_BusAssignment_be_logic_ra_computation_data_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    rtb_BusAssignment_be_logic_ra_computation_data_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.ats_discrete_word,
      FmgcComputer_P.BitfromLabel_bit_b2, &rtb_y_jm);
    FmgcComputer_MATLABFunction_g((((rtb_active_longitudinal_law == vertical_law::SPD_MACH) ||
      (rtb_active_longitudinal_law == vertical_law::SRS) || ((rtb_active_longitudinal_law == vertical_law::VPATH) &&
      (FmgcComputer_U.in.fms_inputs.requested_des_submode == fmgc_des_submode::VPATH_THRUST))) &&
      FmgcComputer_DWork.Delay_DSTATE_k), FmgcComputer_P.PulseNode_isRisingEdge_o, &rtb_y_kr,
      &FmgcComputer_DWork.sf_MATLABFunction_j);
    rtb_y_n = !FmgcComputer_DWork.Memory_PreviousInput_hu;
    rtb_OR1_j = (((rtb_y_jm != 0U) && rtb_OR2_l) || (rtb_y_g && rtb_y_kr && rtb_y_n));
    FmgcComputer_MATLABFunction_a(rtb_OR1_j, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_ba,
      FmgcComputer_P.ConfirmNode_timeDelay_gu, &rtb_y_kr, &FmgcComputer_DWork.sf_MATLABFunction_ay);
    rtb_y_ja = (FmgcComputer_DWork.Delay1_DSTATE.alpha_floor_mode_active ||
                FmgcComputer_DWork.Delay1_DSTATE.retard_mode_active);
    FmgcComputer_DWork.Memory_PreviousInput_bh = FmgcComputer_P.Logic_table_ac[(((rtb_y_ju || ((rtb_y_ja ||
      FmgcComputer_DWork.Delay1_DSTATE.speed_mach_mode_active) && (!rtb_y_kr))) + (static_cast<uint32_T>(rtb_OR1_j) << 1))
      << 1) + FmgcComputer_DWork.Memory_PreviousInput_bh];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.ats_discrete_word,
      FmgcComputer_P.BitfromLabel_bit_al, &rtb_y_jm);
    FmgcComputer_MATLABFunction_g(((((rtb_active_longitudinal_law == vertical_law::NONE) &&
      ((!FmgcComputer_DWork.Delay1_DSTATE.retard_mode_active) || rtb_OR_i)) || (rtb_active_longitudinal_law ==
      vertical_law::ALT_HOLD) || (rtb_active_longitudinal_law == vertical_law::ALT_ACQ) || (rtb_active_longitudinal_law ==
      vertical_law::VS) || (rtb_active_longitudinal_law == vertical_law::FPA) || (rtb_active_longitudinal_law ==
      vertical_law::GS) || (rtb_active_longitudinal_law == vertical_law::FLARE) || ((rtb_active_longitudinal_law ==
      vertical_law::VPATH) && ((FmgcComputer_U.in.fms_inputs.requested_des_submode == fmgc_des_submode::VPATH_SPEED) ||
      rtb_Logic_b[0]))) && FmgcComputer_DWork.Delay_DSTATE_k), FmgcComputer_P.PulseNode_isRisingEdge_fz, &rtb_y_kr,
      &FmgcComputer_DWork.sf_MATLABFunction_ge);
    rtb_OR_i = (((rtb_y_jm != 0U) && rtb_OR2_l) || (rtb_y_g && rtb_y_kr && rtb_y_n));
    FmgcComputer_MATLABFunction_a(rtb_OR_i, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_k3,
      FmgcComputer_P.ConfirmNode_timeDelay_ez, &rtb_y_kr, &FmgcComputer_DWork.sf_MATLABFunction_ig);
    FmgcComputer_DWork.Memory_PreviousInput_cm = FmgcComputer_P.Logic_table_ma[(((rtb_y_ju || ((rtb_y_ja ||
      FmgcComputer_DWork.Delay1_DSTATE.thrust_mode_active) && (!rtb_y_kr))) + (static_cast<uint32_T>(rtb_OR_i) << 1)) <<
      1) + FmgcComputer_DWork.Memory_PreviousInput_cm];
    FmgcComputer_MATLABFunction_i(&FmgcComputer_U.in.bus_inputs.fmgc_opp_bus.ats_discrete_word,
      FmgcComputer_P.BitfromLabel_bit_hy, &rtb_y_jm);
    FmgcComputer_MATLABFunction_c(&rtb_BusAssignment_be_logic_ra_computation_data_radio_height_ft, &rtb_y_p3);
    rtb_OR_i = (((rtb_y_jm != 0U) && rtb_OR2_l) || (rtb_y_g && FmgcComputer_DWork.Memory_PreviousInput_d &&
      rtb_Logic_a2[0] && (rtb_y_p3 <= FmgcComputer_P.CompareToConstant_const_e3) && rtb_y_n));
    FmgcComputer_MATLABFunction_a(rtb_OR_i, FmgcComputer_U.in.time.dt, FmgcComputer_P.ConfirmNode_isRisingEdge_cs,
      FmgcComputer_P.ConfirmNode_timeDelay_br, &rtb_y_kr, &FmgcComputer_DWork.sf_MATLABFunction_kh);
    FmgcComputer_DWork.Memory_PreviousInput_ol = FmgcComputer_P.Logic_table_acc[(((rtb_y_ju ||
      ((FmgcComputer_DWork.Delay1_DSTATE.alpha_floor_mode_active || FmgcComputer_DWork.Delay1_DSTATE.thrust_mode_active ||
        FmgcComputer_DWork.Delay1_DSTATE.speed_mach_mode_active) && (!rtb_y_kr))) + (static_cast<uint32_T>(rtb_OR_i) <<
      1)) << 1) + FmgcComputer_DWork.Memory_PreviousInput_ol];
    rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn.SSM =
      rtb_adrComputationBus_airspeed_computed_kn_SSM;
    rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn.Data =
      rtb_adrComputationBus_airspeed_computed_kn_Data;
    rtb_BusAssignment_i2_logic_chosen_fac_bus_v_max_kn.SSM = rtb_Switch_v_max_kn_SSM;
    rtb_BusAssignment_i2_logic_chosen_fac_bus_v_max_kn.Data = rtb_Switch_v_max_kn_Data;
    rtb_BusAssignment_i2_logic_chosen_fac_bus_discrete_word_5.SSM = rtb_Switch_discrete_word_5_SSM;
    rtb_BusAssignment_i2_logic_chosen_fac_bus_discrete_word_5.Data = rtb_Switch_discrete_word_5_Data;
    rtb_OR_i = (rtb_NOT3_tmp || rtb_Logic_b[0]);
    FmgcComputer_DWork.Memory_PreviousInput_kr = FmgcComputer_P.Logic_table_b3[(((static_cast<uint32_T>(((rtb_Max_a >=
      FmgcComputer_U.in.fms_inputs.thrust_reduction_alt_ft) || FmgcComputer_DWork.Memory_PreviousInput_ne ||
      FmgcComputer_DWork.Memory_PreviousInput_cb || rtb_AND12 || Memory_PreviousInput_l_tmp_0) && rtb_GreaterThan3) << 1)
      + (rtb_BusAssignment_h_logic_one_engine_out || rtb_y_ft || ((FmgcComputer_P.EnumeratedConstant_Value_by ==
      FmgcComputer_U.in.fms_inputs.fms_flight_phase) && (rtb_Max_a <
      FmgcComputer_U.in.fms_inputs.thrust_reduction_alt_ft)))) << 1) + FmgcComputer_DWork.Memory_PreviousInput_kr];
    FmgcComputer_DWork.Memory_PreviousInput_km = FmgcComputer_P.Logic_table_mj[(((static_cast<uint32_T>(((rtb_Max_a >=
      FmgcComputer_U.in.fms_inputs.thrust_reduction_alt_ft) || FmgcComputer_DWork.Memory_PreviousInput_ne ||
      FmgcComputer_DWork.Memory_PreviousInput_cb || rtb_AND12 || Memory_PreviousInput_l_tmp_0) &&
      rtb_BusAssignment_h_logic_one_engine_out) << 1) + (rtb_GreaterThan3 || rtb_y_ft ||
      ((FmgcComputer_P.EnumeratedConstant1_Value_e == FmgcComputer_U.in.fms_inputs.fms_flight_phase) && (rtb_Max_a <
      FmgcComputer_U.in.fms_inputs.thrust_reduction_alt_ft)))) << 1) + FmgcComputer_DWork.Memory_PreviousInput_km];
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_e, &rtb_DataTypeConversion2_bh);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_i2_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_l, &rtb_y_p3);
    rtb_y_g = !rtb_y_ov;
    rtb_y_ip = athr_fma_message::NONE;
    rtb_y_n = (FmgcComputer_DWork.Delay_DSTATE_k && rtb_y_n);
    if (rtb_y_n && ((FmgcComputer_DWork.Memory_PreviousInput_kr && ((rtb_DataTypeConversion2_bh > rtb_y_p3 +
            FmgcComputer_P.Bias_Bias_d) || (rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target <=
            FmgcComputer_P.CompareToConstant_const_eq) || rtb_OR2_l_tmp_0 || (!rtb_y_g))) || (rtb_Logic_ac[0] && rtb_y_g
          && (rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target <= FmgcComputer_P.CompareToConstant1_const_ik))) &&
        (((FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data < 24.0F) &&
          (FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data < 24.0F)) ||
         (FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data > 26.0F) ||
         (FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data > 26.0F))) {
      rtb_y_ip = athr_fma_message::LVR_CLB;
    } else if (rtb_y_n && FmgcComputer_DWork.Memory_PreviousInput_km &&
               (FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data < 34.0F) &&
               (FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data < 34.0F)) {
      rtb_y_ip = athr_fma_message::LVR_MCT;
    } else if (rtb_y_n && rtb_GreaterThan3 && (((FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data >
                  24.0F) && (FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data < 26.0F) &&
                 ((FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data < 24.0F) ||
                  (FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data > 26.0F))) ||
                ((FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data > 24.0F) &&
                 (FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data < 26.0F) &&
                 ((FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data < 24.0F) ||
                  (FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data > 26.0F))))) {
      rtb_y_ip = athr_fma_message::LVR_ASYM;
    }

    FmgcComputer_MATLABFunction_i(&rtb_BusAssignment_i2_logic_chosen_fac_bus_discrete_word_5,
      FmgcComputer_P.BitfromLabel_bit_am, &rtb_y_jm);
    rtb_Max_a = std::fmax(FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_tla_deg.Data,
                          FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_tla_deg.Data);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_flex_temp_deg, &rtb_y_n);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_flex_temp_deg, &rtb_OR1_j);
    rtb_GreaterThan3 = (rtb_y_n || rtb_OR1_j);
    rtb_y_fn = athr_fma_mode::NONE;
    rtb_y_n = (FmgcComputer_DWork.Delay_DSTATE_k && rtb_y_g);
    if (rtb_y_n && (rtb_Max_a > 44.0F)) {
      rtb_y_fn = athr_fma_mode::MAN_TOGA;
    } else {
      rtb_OR1_j = (rtb_y_n && (rtb_Max_a > 34.0F) && (rtb_Max_a < 36.0F));
      if (rtb_OR1_j && rtb_GreaterThan3) {
        rtb_y_fn = athr_fma_mode::MAN_FLEX;
      } else if (rtb_OR1_j && (!rtb_GreaterThan3)) {
        rtb_y_fn = athr_fma_mode::MAN_MCT;
      } else if (rtb_y_n && (rtb_Max_a > 24.0F)) {
        rtb_y_fn = athr_fma_mode::MAN_THR;
      } else {
        rtb_y_n = (FmgcComputer_DWork.Delay_DSTATE_k && rtb_y_ov);
        rtb_OR1_j = (rtb_y_n && FmgcComputer_DWork.Memory_PreviousInput_cm);
        if (rtb_OR1_j && (!FmgcComputer_DWork.Delay_DSTATE_c)) {
          rtb_y_fn = athr_fma_mode::SPEED;
        } else if (rtb_OR1_j && FmgcComputer_DWork.Delay_DSTATE_c) {
          rtb_y_fn = athr_fma_mode::MACH;
        } else {
          rtb_OR1_j = (rtb_y_n && FmgcComputer_DWork.Memory_PreviousInput_bh);
          rtb_GreaterThan3 = !rtb_OR_i;
          if (rtb_OR1_j && (rtb_Max_a > 34.0F) && rtb_GreaterThan3) {
            rtb_y_fn = athr_fma_mode::THR_MCT;
          } else if (rtb_OR1_j && (rtb_Max_a > 24.0F) && rtb_GreaterThan3) {
            rtb_y_fn = athr_fma_mode::THR_CLB;
          } else if (rtb_OR1_j && (rtb_Max_a < 25.0F) && rtb_GreaterThan3) {
            rtb_y_fn = athr_fma_mode::THR_LVR;
          } else if (rtb_y_n && ((FmgcComputer_DWork.Memory_PreviousInput_bh && rtb_OR_i) ||
                                 FmgcComputer_DWork.Memory_PreviousInput_ol)) {
            rtb_y_fn = athr_fma_mode::THR_IDLE;
          } else {
            rtb_y_n = (rtb_y_n && FmgcComputer_DWork.Memory_PreviousInput_hu);
            if (rtb_y_n && (rtb_y_jm != 0U)) {
              rtb_y_fn = athr_fma_mode::A_FLOOR;
            } else if (rtb_y_n && (rtb_y_jm == 0U)) {
              rtb_y_fn = athr_fma_mode::TOGA_LK;
            }
          }
        }
      }
    }

    rtb_BusAssignment_jc_logic_ir_computation_data_ground_speed_kn.Data = rtb_Cos_h;
    rtb_BusAssignment_jc_logic_ir_computation_data_track_angle_magnetic_deg.SSM =
      rtb_irComputationBus_track_angle_magnetic_deg_SSM;
    rtb_BusAssignment_jc_logic_ir_computation_data_track_angle_magnetic_deg.Data = rtb_Gain2_f;
    rtb_BusAssignment_jc_logic_ir_computation_data_heading_magnetic_deg.SSM =
      rtb_irComputationBus_heading_magnetic_deg_SSM;
    rtb_BusAssignment_jc_logic_ir_computation_data_heading_magnetic_deg.Data =
      rtb_irComputationBus_heading_magnetic_deg_Data;
    rtb_BusAssignment_jc_logic_ir_computation_data_pitch_angle_deg.SSM = rtb_irComputationBus_pitch_angle_deg_SSM;
    rtb_BusAssignment_jc_logic_ir_computation_data_pitch_angle_deg.Data = rtb_irComputationBus_pitch_angle_deg_Data;
    rtb_BusAssignment_jc_logic_ir_computation_data_roll_angle_deg.SSM = rtb_irComputationBus_roll_angle_deg_SSM;
    rtb_BusAssignment_jc_logic_ir_computation_data_roll_angle_deg.Data = rtb_irComputationBus_roll_angle_deg_Data;
    rtb_BusAssignment_jc_logic_ir_computation_data_body_normal_accel_g.Data =
      rtb_irComputationBus_body_normal_accel_g_Data;
    rtb_BusAssignment_jc_logic_ir_computation_data_inertial_vertical_speed_ft_s.SSM =
      rtb_irComputationBus_inertial_vertical_speed_ft_s_SSM;
    rtb_BusAssignment_jc_logic_ir_computation_data_inertial_vertical_speed_ft_s.Data =
      rtb_irComputationBus_inertial_vertical_speed_ft_s_Data;
    rtb_BusAssignment_jc_logic_chosen_fac_bus_v_ls_kn.SSM = rtb_Switch_v_ls_kn_SSM;
    rtb_BusAssignment_jc_logic_chosen_fac_bus_v_ls_kn.Data = rtb_Switch_v_ls_kn_Data;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault_defaultValue_km, &rtb_y_bf);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_chosen_fac_bus_v_ls_kn,
      FmgcComputer_P.A429ValueOrDefault4_defaultValue_hv, &rtb_DataTypeConversion2_bh);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_i2_logic_chosen_fac_bus_v_max_kn,
      FmgcComputer_P.A429ValueOrDefault5_defaultValue_i, &rtb_y_p3);
    v[0] = rtb_DataTypeConversion2_bh;
    v[1] = static_cast<real32_T>(rtb_Switch_of[0]);
    v[2] = rtb_y_p3;
    if (rtb_DataTypeConversion2_bh < static_cast<real32_T>(rtb_Switch_of[0])) {
      if (static_cast<real32_T>(rtb_Switch_of[0]) < rtb_y_p3) {
        high_i = 1;
      } else if (rtb_DataTypeConversion2_bh < rtb_y_p3) {
        high_i = 2;
      } else {
        high_i = 0;
      }
    } else if (rtb_DataTypeConversion2_bh < rtb_y_p3) {
      high_i = 0;
    } else if (static_cast<real32_T>(rtb_Switch_of[0]) < rtb_y_p3) {
      high_i = 2;
    } else {
      high_i = 1;
    }

    rtb_DataTypeConversion2_bh = v[high_i] - rtb_y_bf;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_pitch_angle_deg,
      FmgcComputer_P.A429ValueOrDefault11_defaultValue, &rtb_y_p3);
    rtb_DataTypeConversion8 = FmgcComputer_P.Gain1_Gain_a * rtb_y_p3;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_inertial_vertical_speed_ft_s,
      FmgcComputer_P.A429ValueOrDefault10_defaultValue, &rtb_y_p3);
    rtb_DataTypeConversion2_i = FmgcComputer_P.fpmtoms_Gain * rtb_y_p3;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_ground_speed_kn,
      FmgcComputer_P.A429ValueOrDefault8_defaultValue_i, &rtb_y_p3);
    rtb_Switch1_a = rtb_y_p3;
    rtb_DataTypeConversion3 = FmgcComputer_P.kntoms_Gain * rtb_y_p3;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_roll_angle_deg,
      FmgcComputer_P.A429ValueOrDefault12_defaultValue, &rtb_y_p3);
    rtb_Product_p2 = FmgcComputer_P.Gain1_Gain_h * rtb_y_p3;
    rtb_DataTypeConversion4 = std::cos(rtb_Product_p2);
    rtb_DataTypeConversion5 = std::sin(rtb_Product_p2);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_heading_magnetic_deg,
      FmgcComputer_P.A429ValueOrDefault13_defaultValue, &rtb_y_p3);
    rtb_DataTypeConversion6 = FmgcComputer_P.Gain1_Gain_f * rtb_y_p3;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_track_angle_magnetic_deg,
      FmgcComputer_P.A429ValueOrDefault14_defaultValue, &rtb_y_p3);
    if (rtb_Switch1_a > FmgcComputer_P.Saturation_UpperSat_jq) {
      rtb_Switch1_a = FmgcComputer_P.Saturation_UpperSat_jq;
    } else if (rtb_Switch1_a < FmgcComputer_P.Saturation_LowerSat_b) {
      rtb_Switch1_a = FmgcComputer_P.Saturation_LowerSat_b;
    }

    rtb_DataTypeConversion7 = FmgcComputer_P.ktstomps_Gain * rtb_Switch1_a * FmgcComputer_P._Gain;
    if ((!FmgcComputer_DWork.pY_not_empty_b) || (!FmgcComputer_DWork.pU_not_empty_i)) {
      FmgcComputer_DWork.pU_i = rtb_DataTypeConversion7;
      FmgcComputer_DWork.pU_not_empty_i = true;
      FmgcComputer_DWork.pY_l = rtb_DataTypeConversion7;
      FmgcComputer_DWork.pY_not_empty_b = true;
    }

    rtb_DataTypeConversion9 = FmgcComputer_U.in.time.dt * FmgcComputer_P.WashoutFilter_C1;
    rtb_Product_p2 = rtb_DataTypeConversion9 + 2.0;
    rtb_Switch1_a = 2.0 / (rtb_DataTypeConversion9 + 2.0);
    FmgcComputer_DWork.pY_l = (2.0 - rtb_DataTypeConversion9) / (rtb_DataTypeConversion9 + 2.0) *
      FmgcComputer_DWork.pY_l + (rtb_DataTypeConversion7 * rtb_Switch1_a - FmgcComputer_DWork.pU_i * rtb_Switch1_a);
    FmgcComputer_DWork.pU_i = rtb_DataTypeConversion7;
    if (rtb_DataTypeConversion3 > FmgcComputer_P.Saturation_UpperSat_j) {
      rtb_DataTypeConversion3 = FmgcComputer_P.Saturation_UpperSat_j;
    } else if (rtb_DataTypeConversion3 < FmgcComputer_P.Saturation_LowerSat_o) {
      rtb_DataTypeConversion3 = FmgcComputer_P.Saturation_LowerSat_o;
    }

    FmgcComputer_LeadLagFilter(FmgcComputer_DWork.pY_l - FmgcComputer_P.g_Gain * (FmgcComputer_P.Gain1_Gain_d *
      (FmgcComputer_P.Gain_Gain_j * ((rtb_DataTypeConversion8 - FmgcComputer_P.Gain1_Gain_ak *
      (FmgcComputer_P.Gain_Gain_b * std::atan(rtb_DataTypeConversion2_i / rtb_DataTypeConversion3))) *
      (FmgcComputer_P.Constant_Value_hx - rtb_DataTypeConversion4) + rtb_DataTypeConversion5 * std::sin
      (FmgcComputer_P.Gain1_Gain_p * rtb_y_p3 - rtb_DataTypeConversion6)))), FmgcComputer_P.HighPassFilter_C1,
      FmgcComputer_P.HighPassFilter_C2, FmgcComputer_P.HighPassFilter_C3, FmgcComputer_P.HighPassFilter_C4,
      FmgcComputer_U.in.time.dt, &rtb_Product_p2, &FmgcComputer_DWork.sf_LeadLagFilter);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn,
      FmgcComputer_P.A429ValueOrDefault9_defaultValue, &rtb_y_p3);
    if (rtb_y_p3 > FmgcComputer_P.Saturation1_UpperSat_l) {
      rtb_Switch1_a = FmgcComputer_P.Saturation1_UpperSat_l;
    } else if (rtb_y_p3 < FmgcComputer_P.Saturation1_LowerSat_i) {
      rtb_Switch1_a = FmgcComputer_P.Saturation1_LowerSat_i;
    } else {
      rtb_Switch1_a = rtb_y_p3;
    }

    FmgcComputer_LeadLagFilter(FmgcComputer_P.ktstomps_Gain_m * rtb_Switch1_a, FmgcComputer_P.LowPassFilter_C1,
      FmgcComputer_P.LowPassFilter_C2, FmgcComputer_P.LowPassFilter_C3, FmgcComputer_P.LowPassFilter_C4,
      FmgcComputer_U.in.time.dt, &rtb_Switch1_a, &FmgcComputer_DWork.sf_LeadLagFilter_b);
    rtb_DataTypeConversion8 = (rtb_Product_p2 + rtb_Switch1_a) * FmgcComputer_P.mpstokts_Gain *
      FmgcComputer_P.Gain4_Gain * look1_iflf_binlxpw(rtb_DataTypeConversion2_bh,
      FmgcComputer_P.ScheduledGain1_BreakpointsForDimension1, FmgcComputer_P.ScheduledGain1_Table, 4U) +
      rtb_DataTypeConversion2_bh;
    rtb_Product_p2 = FmgcComputer_DWork.Delay_DSTATE_i;
    FmgcComputer_DWork.Delay_DSTATE_i = FmgcComputer_P.DiscreteDerivativeVariableTs_Gain * rtb_DataTypeConversion8;
    rtb_DataTypeConversion2_i = (FmgcComputer_DWork.Delay_DSTATE_i - rtb_Product_p2) / FmgcComputer_U.in.time.dt;
    if ((!FmgcComputer_DWork.pY_not_empty_m) || (!FmgcComputer_DWork.pU_not_empty_l)) {
      FmgcComputer_DWork.pU = rtb_DataTypeConversion2_i;
      FmgcComputer_DWork.pU_not_empty_l = true;
      FmgcComputer_DWork.pY_n = rtb_DataTypeConversion2_i;
      FmgcComputer_DWork.pY_not_empty_m = true;
    }

    rtb_DataTypeConversion9 = FmgcComputer_U.in.time.dt * FmgcComputer_P.LagFilter_C1_d;
    rtb_Switch1_a = rtb_DataTypeConversion9 / (rtb_DataTypeConversion9 + 2.0);
    FmgcComputer_DWork.pY_n = (2.0 - rtb_DataTypeConversion9) / (rtb_DataTypeConversion9 + 2.0) *
      FmgcComputer_DWork.pY_n + (rtb_DataTypeConversion2_i * rtb_Switch1_a + FmgcComputer_DWork.pU * rtb_Switch1_a);
    FmgcComputer_DWork.pU = rtb_DataTypeConversion2_i;
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_body_normal_accel_g,
      FmgcComputer_P.A429ValueOrDefault3_defaultValue_bv, &rtb_DataTypeConversion2_bh);
    FmgcComputer_LagFilter(rtb_DataTypeConversion2_bh, FmgcComputer_P.LagFilter1_C1, FmgcComputer_U.in.time.dt,
      &rtb_y_p3, &FmgcComputer_DWork.sf_LagFilter_g);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_pitch_angle_deg,
      FmgcComputer_P.A429ValueOrDefault1_defaultValue_fg, &rtb_DataTypeConversion2_bh);
    rtb_Cos_h = std::cos(FmgcComputer_P.Gain1_Gain_hk * rtb_DataTypeConversion2_bh);
    FmgcComputer_MATLABFunction(&rtb_BusAssignment_jc_logic_ir_computation_data_roll_angle_deg,
      FmgcComputer_P.A429ValueOrDefault2_defaultValue_mp, &rtb_DataTypeConversion2_bh);
    rtb_Cos_h = rtb_y_p3 - rtb_Cos_h / std::cos(FmgcComputer_P.Gain1_Gain_go * rtb_DataTypeConversion2_bh);
    rtb_Gain2_f = FmgcComputer_P.Gain2_Gain_o * rtb_Cos_h;
    if ((!FmgcComputer_DWork.pY_not_empty) || (!FmgcComputer_DWork.pU_not_empty)) {
      FmgcComputer_DWork.pU_e = rtb_Gain2_f;
      FmgcComputer_DWork.pU_not_empty = true;
      FmgcComputer_DWork.pY_e = rtb_Gain2_f;
      FmgcComputer_DWork.pY_not_empty = true;
    }

    rtb_DataTypeConversion9 = FmgcComputer_U.in.time.dt * FmgcComputer_P.WashoutFilter_C1_e;
    rtb_Switch1_a = 2.0 / (rtb_DataTypeConversion9 + 2.0);
    FmgcComputer_DWork.pY_e = static_cast<real32_T>((2.0 - rtb_DataTypeConversion9) / (rtb_DataTypeConversion9 + 2.0)) *
      FmgcComputer_DWork.pY_e + (rtb_Gain2_f * static_cast<real32_T>(rtb_Switch1_a) - FmgcComputer_DWork.pU_e *
      static_cast<real32_T>(rtb_Switch1_a));
    FmgcComputer_DWork.pU_e = rtb_Gain2_f;
    if (!FmgcComputer_DWork.pY_not_empty_e) {
      FmgcComputer_DWork.pY = FmgcComputer_P.RateLimiterVariableTs_InitialCondition;
      FmgcComputer_DWork.pY_not_empty_e = true;
    }

    FmgcComputer_DWork.pY += std::fmax(std::fmin(static_cast<real_T>(rtb_Logic_hq[0]) - FmgcComputer_DWork.pY, std::abs
      (FmgcComputer_P.RateLimiterVariableTs_up) * FmgcComputer_U.in.time.dt), -std::abs
      (FmgcComputer_P.RateLimiterVariableTs_lo) * FmgcComputer_U.in.time.dt);
    if (FmgcComputer_U.in.sim_data.tracking_mode_on_override) {
      rtb_Switch1_a = FmgcComputer_P.Constant2_Value;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_ol) {
      rtb_Switch1_a = FmgcComputer_P.RETARD_Value;
    } else if (FmgcComputer_DWork.Memory_PreviousInput_cm) {
      rtb_Switch1_a = ((FmgcComputer_P.Gain_Gain * rtb_DataTypeConversion8 + FmgcComputer_DWork.pY_n) +
                       (FmgcComputer_P.Gain1_Gain_g * rtb_Cos_h + FmgcComputer_P.Gain3_Gain_k * FmgcComputer_DWork.pY_e))
        * look1_binlxpw(FmgcComputer_DWork.Delay_DSTATE_l, FmgcComputer_P.ScheduledGain2_BreakpointsForDimension1,
                        FmgcComputer_P.ScheduledGain2_Table, 3U) * look1_binlxpw(FmgcComputer_DWork.pY,
        FmgcComputer_P.ScheduledGain4_BreakpointsForDimension1, FmgcComputer_P.ScheduledGain4_Table, 1U);
      if (rtb_Switch1_a > FmgcComputer_P.Saturation1_UpperSat) {
        rtb_Switch1_a = FmgcComputer_P.Saturation1_UpperSat;
      } else if (rtb_Switch1_a < FmgcComputer_P.Saturation1_LowerSat) {
        rtb_Switch1_a = FmgcComputer_P.Saturation1_LowerSat;
      }
    } else if (FmgcComputer_DWork.Memory_PreviousInput_bh) {
      if (rtb_OR_i) {
        rtb_DataTypeConversion8 = FmgcComputer_P.Constant_Value;
      } else {
        rtb_DataTypeConversion8 = FmgcComputer_P.Constant1_Value_i;
      }

      rtb_Switch1_a = rtb_DataTypeConversion8 * look1_iflf_binlxpw(std::fmin
        (FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_n1_actual_percent.Data,
         FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_n1_actual_percent.Data),
        FmgcComputer_P.uDLookupTable_bp01Data, FmgcComputer_P.uDLookupTable_tableData, 6U);
      if (rtb_Switch1_a > FmgcComputer_P.Saturation_UpperSat) {
        rtb_Switch1_a = FmgcComputer_P.Saturation_UpperSat;
      } else if (rtb_Switch1_a < FmgcComputer_P.Saturation_LowerSat) {
        rtb_Switch1_a = FmgcComputer_P.Saturation_LowerSat;
      }
    } else {
      rtb_Switch1_a = FmgcComputer_P.Constant1_Value_l;
    }

    rtb_Switch1_a = FmgcComputer_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_Switch1_a *
      FmgcComputer_U.in.time.dt;
    FmgcComputer_DWork.icLoad = (rtb_y_ju || rtb_y_g || FmgcComputer_DWork.Memory_PreviousInput_hu ||
      FmgcComputer_DWork.icLoad);
    if (FmgcComputer_DWork.icLoad) {
      FmgcComputer_DWork.Delay_DSTATE_f = std::fmax
        (FmgcComputer_U.in.bus_inputs.fadec_opp_bus.selected_n1_actual_percent.Data,
         FmgcComputer_U.in.bus_inputs.fadec_own_bus.selected_n1_actual_percent.Data) - rtb_Switch1_a;
    }

    FmgcComputer_DWork.Delay_DSTATE_l = rtb_Switch1_a + FmgcComputer_DWork.Delay_DSTATE_f;
    rtb_Cos_h = std::fmax(FmgcComputer_U.in.bus_inputs.fadec_opp_bus.n1_ref_percent.Data,
                          FmgcComputer_U.in.bus_inputs.fadec_own_bus.n1_ref_percent.Data);
    if (FmgcComputer_DWork.Delay_DSTATE_l > rtb_Cos_h) {
      FmgcComputer_DWork.Delay_DSTATE_l = rtb_Cos_h;
    } else if (FmgcComputer_DWork.Delay_DSTATE_l < FmgcComputer_P.Constant_Value_h) {
      FmgcComputer_DWork.Delay_DSTATE_l = FmgcComputer_P.Constant_Value_h;
    }

    if (FmgcComputer_DWork.Memory_PreviousInput_hu) {
      rtb_Switch1_a = std::fmax(FmgcComputer_U.in.bus_inputs.fadec_own_bus.n1_maximum_percent.Data,
        FmgcComputer_U.in.bus_inputs.fadec_opp_bus.n1_maximum_percent.Data);
    } else {
      rtb_Switch1_a = FmgcComputer_DWork.Delay_DSTATE_l;
    }

    rtb_BusAssignment_pw_logic_ils_computation_data_runway_heading_deg.SSM = rtb_Switch9;
    rtb_BusAssignment_pw_logic_ils_computation_data_runway_heading_deg.Data = rtb_Switch_i_runway_heading_deg_Data;
    rtb_Switch9 = static_cast<uint32_T>(FmgcComputer_P.EnumeratedConstant_Value);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_mach, &rtb_y_ju);
    FmgcComputer_MATLABFunction_ie(&FmgcComputer_U.in.bus_inputs.fcu_bus.selected_spd_kts, &rtb_y_n);
    FmgcComputer_MATLABFunction_ie(&rtb_BusAssignment_pw_logic_ils_computation_data_runway_heading_deg, &rtb_y_g);
    rtb_VectorConcatenate[0] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[1] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[2] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[3] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[5] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[6] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[7] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[8] = FmgcComputer_DWork.Memory_PreviousInput_hk;
    rtb_VectorConcatenate[9] = FmgcComputer_DWork.Memory_PreviousInput_cu;
    rtb_VectorConcatenate[10] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[11] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[12] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[13] = rtb_NOT3_tmp_0;
    rtb_VectorConcatenate[14] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[15] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[16] = FmgcComputer_P.Constant10_Value;
    rtb_VectorConcatenate[17] = FmgcComputer_U.in.fms_inputs.preset_spd_mach_activate;
    rtb_VectorConcatenate[18] = FmgcComputer_P.Constant10_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_DataTypeConversion2_bh);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_5.Data = rtb_DataTypeConversion2_bh;
    rtb_VectorConcatenate[0] = FmgcComputer_U.in.discrete_inputs.ap_instinctive_disc;
    rtb_VectorConcatenate[1] = rtb_Logic_a2[0];
    rtb_VectorConcatenate[2] = fdOwnOff;
    rtb_VectorConcatenate[3] = FmgcComputer_DWork.Memory_PreviousInput_d;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant3_Value;
    rtb_VectorConcatenate[5] = rtb_y_c1;
    rtb_VectorConcatenate[6] = rtb_NOT_b;
    rtb_VectorConcatenate[7] = rtb_appCapability_idx_2;
    rtb_VectorConcatenate[8] = rtb_ap_inop_tmp;
    rtb_VectorConcatenate[9] = rtb_y_g3;
    rtb_VectorConcatenate[10] = rtb_appInop_idx_1;
    rtb_VectorConcatenate[11] = rtb_appInop_idx_2;
    rtb_VectorConcatenate[12] = rtb_TmpSignalConversionAtSFunctionInport3_idx_0;
    rtb_VectorConcatenate[13] = rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    rtb_VectorConcatenate[14] = rtb_TmpSignalConversionAtSFunctionInport3_idx_2;
    rtb_VectorConcatenate[15] = rtb_BusAssignment_b_logic_ils_tune_inhibit;
    rtb_VectorConcatenate[16] = rtb_Compare_gc;
    rtb_VectorConcatenate[17] = rtb_OR2_l_tmp;
    rtb_VectorConcatenate[18] = rtb_AND10_b;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_DataTypeConversion2_bh);
    rtb_VectorConcatenate[0] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[1] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[2] = FmgcComputer_DWork.Delay_DSTATE_k;
    rtb_VectorConcatenate[3] = rtb_y_ov;
    rtb_VectorConcatenate[4] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[5] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[6] = FmgcComputer_U.in.discrete_inputs.athr_instinctive_disc;
    rtb_VectorConcatenate[7] = FmgcComputer_DWork.Memory_PreviousInput_cm;
    rtb_VectorConcatenate[8] = FmgcComputer_DWork.Delay_DSTATE_c;
    rtb_VectorConcatenate[9] = FmgcComputer_DWork.Memory_PreviousInput_ol;
    rtb_VectorConcatenate[10] = FmgcComputer_DWork.Memory_PreviousInput_bh;
    rtb_VectorConcatenate[11] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[12] = FmgcComputer_DWork.Memory_PreviousInput_hu;
    rtb_VectorConcatenate[13] = rtb_ap_inop_tmp_tmp;
    rtb_VectorConcatenate[14] = rtb_y_nn;
    rtb_VectorConcatenate[15] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[16] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[17] = FmgcComputer_P.Constant4_Value_g;
    rtb_VectorConcatenate[18] = FmgcComputer_P.Constant4_Value_g;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate, &rtb_y_bf);
    rtb_VectorConcatenate_bw[0] = (rtb_y_fn == athr_fma_mode::MAN_TOGA);
    rtb_VectorConcatenate_bw[1] = ((rtb_y_fn == athr_fma_mode::MAN_MCT) || (rtb_y_fn == athr_fma_mode::THR_MCT));
    rtb_VectorConcatenate_bw[2] = (rtb_y_fn == athr_fma_mode::MAN_FLEX);
    rtb_VectorConcatenate_bw[3] = (rtb_y_fn == athr_fma_mode::THR_CLB);
    rtb_VectorConcatenate_bw[4] = ((rtb_y_fn == athr_fma_mode::MAN_THR) || (rtb_y_fn == athr_fma_mode::THR_LVR));
    rtb_VectorConcatenate_bw[5] = (rtb_y_fn == athr_fma_mode::THR_IDLE);
    rtb_VectorConcatenate_bw[6] = (rtb_y_fn == athr_fma_mode::A_FLOOR);
    rtb_VectorConcatenate_bw[7] = (rtb_y_fn == athr_fma_mode::TOGA_LK);
    rtb_VectorConcatenate_bw[8] = (rtb_y_fn == athr_fma_mode::SPEED);
    rtb_VectorConcatenate_bw[9] = (rtb_y_fn == athr_fma_mode::MACH);
    rtb_VectorConcatenate_bw[10] = (rtb_y_ip == athr_fma_message::LVR_ASYM);
    rtb_VectorConcatenate_bw[11] = (rtb_y_ip == athr_fma_message::LVR_CLB);
    rtb_VectorConcatenate_bw[12] = (rtb_y_ip == athr_fma_message::LVR_MCT);
    rtb_VectorConcatenate_bw[13] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate_bw[14] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate_bw[15] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate_bw[16] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate_bw[17] = FmgcComputer_P.Constant5_Value;
    rtb_VectorConcatenate_bw[18] = FmgcComputer_P.Constant5_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_bw, &rtb_y_gtq);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_fma_discrete_word.Data = rtb_y_gtq;
    rtb_VectorConcatenate_bw[0] = FmgcComputer_DWork.Memory_PreviousInput_bw;
    rtb_VectorConcatenate_bw[1] = rtb_AND1_c0;
    rtb_VectorConcatenate_bw[2] = FmgcComputer_DWork.Memory_PreviousInput_n;
    rtb_VectorConcatenate_bw[3] = FmgcComputer_DWork.Memory_PreviousInput_i1;
    rtb_VectorConcatenate_bw[4] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate_bw[5] = FmgcComputer_DWork.Memory_PreviousInput_a;
    rtb_VectorConcatenate_bw[6] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate_bw[7] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate_bw[8] = FmgcComputer_U.in.fms_inputs.backbeam_selected;
    rtb_VectorConcatenate_bw[9] = FmgcComputer_DWork.Memory_PreviousInput_l;
    rtb_VectorConcatenate_bw[10] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate_bw[11] = FmgcComputer_DWork.Memory_PreviousInput_fm;
    rtb_VectorConcatenate_bw[12] = FmgcComputer_DWork.Memory_PreviousInput_dv;
    rtb_VectorConcatenate_bw[13] = FmgcComputer_DWork.Memory_PreviousInput_ma;
    rtb_VectorConcatenate_bw[14] = FmgcComputer_DWork.Memory_PreviousInput_nt;
    rtb_VectorConcatenate_bw[15] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate_bw[16] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate_bw[17] = FmgcComputer_P.Constant6_Value;
    rtb_VectorConcatenate_bw[18] = FmgcComputer_P.Constant6_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_bw, &rtb_y_gtq);
    rtb_VectorConcatenate_f[0] = rtb_y_lh_0;
    rtb_VectorConcatenate_f[1] = rtb_NOT3_tmp;
    rtb_VectorConcatenate_f[2] = FmgcComputer_P.Constant7_Value;
    rtb_VectorConcatenate_f[3] = (FmgcComputer_DWork.Memory_PreviousInput_ae ||
      FmgcComputer_DWork.Memory_PreviousInput_ev);
    rtb_VectorConcatenate_f[4] = FmgcComputer_DWork.Memory_PreviousInput_k;
    rtb_VectorConcatenate_f[5] = FmgcComputer_DWork.Memory_PreviousInput_i;
    rtb_VectorConcatenate_f[6] = rtb_AND12;
    rtb_VectorConcatenate_f[7] = Memory_PreviousInput_l_tmp_0;
    rtb_VectorConcatenate_f[8] = (FmgcComputer_DWork.Memory_PreviousInput_ne ||
      FmgcComputer_DWork.Memory_PreviousInput_cb);
    rtb_VectorConcatenate_f[9] = (FmgcComputer_DWork.Memory_PreviousInput_cb ||
      FmgcComputer_DWork.Memory_PreviousInput_as);
    rtb_VectorConcatenate_f[10] = (FmgcComputer_DWork.Memory_PreviousInput_ne ||
      FmgcComputer_DWork.Memory_PreviousInput_nu);
    rtb_VectorConcatenate_f[11] = (FmgcComputer_DWork.Memory_PreviousInput_nu ||
      FmgcComputer_DWork.Memory_PreviousInput_as);
    rtb_VectorConcatenate_f[12] = rtb_Logic_b[0];
    rtb_VectorConcatenate_f[13] = (FmgcComputer_DWork.Memory_PreviousInput_o ||
      FmgcComputer_DWork.Memory_PreviousInput_mx);
    rtb_VectorConcatenate_f[14] = rtb_y_eu;
    rtb_VectorConcatenate_f[15] = rtb_Compare_bb;
    rtb_VectorConcatenate_f[16] = ((FmgcComputer_U.in.fms_inputs.preset_mach > FmgcComputer_P.CompareToConstant3_const_p)
      || (FmgcComputer_U.in.fms_inputs.preset_spd_kts > FmgcComputer_P.CompareToConstant4_const_ny));
    rtb_VectorConcatenate_f[17] = FmgcComputer_P.Constant7_Value;
    rtb_VectorConcatenate_f[18] = FmgcComputer_P.Constant7_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_f, &rtb_y_p3);
    rtb_VectorConcatenate_f[0] = rtb_y_l1;
    rtb_VectorConcatenate_f[1] = FmgcComputer_DWork.Memory_PreviousInput_ip;
    rtb_VectorConcatenate_f[2] = FmgcComputer_DWork.Memory_PreviousInput_cv;
    rtb_VectorConcatenate_f[3] = FmgcComputer_DWork.Memory_PreviousInput_lq;
    rtb_VectorConcatenate_f[4] = FmgcComputer_DWork.Memory_PreviousInput_el;
    rtb_VectorConcatenate_f[5] = rtb_OR_iw;
    rtb_VectorConcatenate_f[6] = rtb_y_mi;
    rtb_VectorConcatenate_f[7] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_f[8] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_f[9] = FmgcComputer_DWork.Memory_PreviousInput_c;
    rtb_VectorConcatenate_f[10] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_f[11] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_f[12] = FmgcComputer_DWork.Memory_PreviousInput_b;
    rtb_VectorConcatenate_f[13] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_f[14] = rtb_GreaterThan3_e;
    rtb_VectorConcatenate_f[15] = FmgcComputer_DWork.Memory_PreviousInput_m;
    rtb_VectorConcatenate_f[16] = FmgcComputer_P.Constant8_Value;
    rtb_VectorConcatenate_f[17] = rtb_y_eg_tmp;
    rtb_VectorConcatenate_f[18] = FmgcComputer_P.Constant8_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_f, &rtb_y_pv);
    rtb_VectorConcatenate_f[0] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[1] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[2] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[3] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[4] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[5] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[6] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[7] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[8] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[9] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[10] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[11] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[12] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[13] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[14] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[15] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[16] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[17] = FmgcComputer_P.Constant9_Value;
    rtb_VectorConcatenate_f[18] = FmgcComputer_P.Constant9_Value;
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_f, &rtb_y_o);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_6.Data = rtb_y_o;
    if (FmgcComputer_U.in.fms_inputs.show_speed_margins) {
      rtb_Switch9 = static_cast<uint32_T>(FmgcComputer_P.EnumeratedConstant1_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_7.Data = static_cast<real32_T>(rtb_Switch1_a);
    rtb_VectorConcatenate_f[0] = FmgcComputer_P.Constant_Value_jf;
    rtb_VectorConcatenate_f[1] = FmgcComputer_DWork.Memory_PreviousInput_n0;
    rtb_VectorConcatenate_f[2] = rtb_Logic_ac[0];
    rtb_VectorConcatenate_f[3] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[4] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[5] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[6] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[7] = rtb_BusAssignment_hk_ap_fd_logic_longi_large_box_tcas;
    rtb_VectorConcatenate_f[8] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[9] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[10] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[11] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[12] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[13] = rtb_NOT3;
    rtb_VectorConcatenate_f[14] = rtb_BusAssignment_hk_ap_fd_logic_trk_fpa_deselected;
    rtb_VectorConcatenate_f[15] = FmgcComputer_P.Constant1_Value_a;
    rtb_VectorConcatenate_f[16] = rtb_NOT_oj;
    rtb_VectorConcatenate_f[17] = (rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target >
      FmgcComputer_P.CompareToConstant5_const_hr);
    rtb_VectorConcatenate_f[18] = (rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target <
      FmgcComputer_P.CompareToConstant6_const_b);
    FmgcComputer_MATLABFunction_gy(rtb_VectorConcatenate_f,
      &FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_7.Data);
    FmgcComputer_Y.out.data = FmgcComputer_U.in;
    FmgcComputer_Y.out.logic.on_ground = rtb_y_ft;
    FmgcComputer_Y.out.logic.gnd_eng_stop_flt_5s = rtb_y_pf;
    FmgcComputer_Y.out.logic.one_engine_out = rtb_BusAssignment_h_logic_one_engine_out;
    FmgcComputer_Y.out.logic.engine_running = rtb_BusAssignment_h_logic_engine_running;
    FmgcComputer_Y.out.logic.ap_fd_athr_common_condition = fdOppOff;
    FmgcComputer_Y.out.logic.ap_fd_common_condition = rtb_BusAssignment_gk_logic_ap_fd_common_condition;
    FmgcComputer_Y.out.logic.fd_own_engaged = fdOwnOff;
    FmgcComputer_Y.out.logic.ap_own_engaged = rtb_Logic_a2[0];
    FmgcComputer_Y.out.logic.athr_own_engaged = FmgcComputer_DWork.Delay_DSTATE_k;
    FmgcComputer_Y.out.logic.ap_inop = rtb_ap_inop_tmp;
    FmgcComputer_Y.out.logic.athr_inop = rtb_ap_inop_tmp_tmp;
    FmgcComputer_Y.out.logic.fmgc_opp_priority = rtb_y_if;
    FmgcComputer_Y.out.logic.double_adr_failure = rtb_doubleAdrFault;
    FmgcComputer_Y.out.logic.double_ir_failure = rtb_adr3Invalid;
    FmgcComputer_Y.out.logic.all_adr_valid = rtb_adrOppInvalid;
    FmgcComputer_Y.out.logic.all_ir_valid = rtb_adrOwnInvalid;
    FmgcComputer_Y.out.logic.adr_computation_data.altitude_standard_ft.SSM =
      rtb_adrComputationBus_altitude_standard_ft_SSM;
    FmgcComputer_Y.out.logic.adr_computation_data.altitude_standard_ft.Data =
      rtb_adrComputationBus_altitude_standard_ft_Data;
    FmgcComputer_Y.out.logic.adr_computation_data.altitude_corrected_1_ft.SSM =
      rtb_adrComputationBus_altitude_corrected_1_ft_SSM;
    FmgcComputer_Y.out.logic.adr_computation_data.altitude_corrected_1_ft.Data =
      rtb_adrComputationBus_altitude_corrected_1_ft_Data;
    FmgcComputer_Y.out.logic.adr_computation_data.altitude_corrected_2_ft.SSM =
      rtb_adrComputationBus_altitude_corrected_2_ft_SSM;
    FmgcComputer_Y.out.logic.adr_computation_data.altitude_corrected_2_ft.Data =
      rtb_adrComputationBus_altitude_corrected_2_ft_Data;
    FmgcComputer_Y.out.logic.adr_computation_data.mach.SSM = rtb_adrComputationBus_mach_SSM;
    FmgcComputer_Y.out.logic.adr_computation_data.mach.Data = rtb_adrComputationBus_mach_Data;
    FmgcComputer_Y.out.logic.adr_computation_data.airspeed_computed_kn =
      rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn;
    FmgcComputer_Y.out.logic.adr_computation_data.airspeed_true_kn.Data = rtb_adrComputationBus_airspeed_true_kn_Data;
    FmgcComputer_Y.out.logic.adr_computation_data.vertical_speed_ft_min.SSM =
      rtb_adrComputationBus_vertical_speed_ft_min_SSM;
    FmgcComputer_Y.out.logic.adr_computation_data.vertical_speed_ft_min.Data =
      rtb_adrComputationBus_vertical_speed_ft_min_Data;
    FmgcComputer_Y.out.logic.adr_computation_data.aoa_corrected_deg.Data = rtb_adrComputationBus_aoa_corrected_deg_Data;
    FmgcComputer_Y.out.logic.adr_computation_data.corrected_average_static_pressure.SSM =
      rtb_adrComputationBus_corrected_average_static_pressure_SSM;
    FmgcComputer_Y.out.logic.adr_computation_data.corrected_average_static_pressure.Data =
      rtb_adrComputationBus_corrected_average_static_pressure_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.ground_speed_kn =
      rtb_BusAssignment_jc_logic_ir_computation_data_ground_speed_kn;
    FmgcComputer_Y.out.logic.ir_computation_data.track_angle_true_deg.Data =
      rtb_irComputationBus_track_angle_true_deg_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.heading_true_deg.SSM = rtb_irComputationBus_heading_true_deg_SSM;
    FmgcComputer_Y.out.logic.ir_computation_data.heading_true_deg.Data = rtb_irComputationBus_heading_true_deg_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.track_angle_magnetic_deg =
      rtb_BusAssignment_jc_logic_ir_computation_data_track_angle_magnetic_deg;
    FmgcComputer_Y.out.logic.ir_computation_data.heading_magnetic_deg =
      rtb_BusAssignment_jc_logic_ir_computation_data_heading_magnetic_deg;
    FmgcComputer_Y.out.logic.ir_computation_data.flight_path_angle_deg.SSM =
      rtb_irComputationBus_flight_path_angle_deg_SSM;
    FmgcComputer_Y.out.logic.ir_computation_data.flight_path_angle_deg.Data =
      rtb_irComputationBus_flight_path_angle_deg_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.pitch_angle_deg =
      rtb_BusAssignment_jc_logic_ir_computation_data_pitch_angle_deg;
    FmgcComputer_Y.out.logic.ir_computation_data.roll_angle_deg =
      rtb_BusAssignment_jc_logic_ir_computation_data_roll_angle_deg;
    FmgcComputer_Y.out.logic.ir_computation_data.body_roll_rate_deg_s.Data =
      rtb_irComputationBus_body_roll_rate_deg_s_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.body_yaw_rate_deg_s.Data =
      rtb_irComputationBus_body_yaw_rate_deg_s_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.body_long_accel_g.Data = rtb_irComputationBus_body_long_accel_g_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.body_lat_accel_g.Data = rtb_irComputationBus_body_lat_accel_g_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.body_normal_accel_g =
      rtb_BusAssignment_jc_logic_ir_computation_data_body_normal_accel_g;
    FmgcComputer_Y.out.logic.ir_computation_data.pitch_att_rate_deg_s.Data =
      rtb_irComputationBus_pitch_att_rate_deg_s_Data;
    FmgcComputer_Y.out.logic.ir_computation_data.inertial_vertical_speed_ft_s =
      rtb_BusAssignment_jc_logic_ir_computation_data_inertial_vertical_speed_ft_s;
    FmgcComputer_Y.out.logic.altitude_indicated_ft = rtb_BusAssignment_ic_logic_altitude_indicated_ft;
    FmgcComputer_Y.out.logic.ra_computation_data.radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    FmgcComputer_Y.out.logic.ra_computation_data.radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    FmgcComputer_Y.out.logic.dual_ra_failure = raOwnInvalid;
    FmgcComputer_Y.out.logic.both_ra_valid = raOppInvalid;
    FmgcComputer_Y.out.logic.fac_lg_data_failure = rtb_AND10_k;
    FmgcComputer_Y.out.logic.flap_slat_lever_position = rtb_handleIndex;
    FmgcComputer_Y.out.logic.fac_speeds_failure = rtb_BusAssignment_n_logic_fac_speeds_failure;
    FmgcComputer_Y.out.logic.fac_weights_failure = rtb_BusAssignment_n_logic_fac_weights_failure;
    FmgcComputer_Y.out.logic.fac_rudder_control_failure = rtb_irOwnInvalid;
    FmgcComputer_Y.out.logic.both_fac_rudder_valid = rtb_ir3Invalid;
    FmgcComputer_Y.out.logic.chosen_fac_bus.total_weight_lbs.SSM = rtb_Switch_total_weight_lbs_SSM;
    FmgcComputer_Y.out.logic.chosen_fac_bus.total_weight_lbs.Data = rtb_Switch_total_weight_lbs_Data;
    FmgcComputer_Y.out.logic.chosen_fac_bus.center_of_gravity_pos_percent.SSM =
      rtb_Switch_center_of_gravity_pos_percent_SSM;
    FmgcComputer_Y.out.logic.chosen_fac_bus.center_of_gravity_pos_percent.Data =
      rtb_Switch_center_of_gravity_pos_percent_Data;
    FmgcComputer_Y.out.logic.chosen_fac_bus.estimated_sideslip_deg.SSM = rtb_Switch_estimated_sideslip_deg_SSM;
    FmgcComputer_Y.out.logic.chosen_fac_bus.estimated_sideslip_deg.Data = rtb_Switch_estimated_sideslip_deg_Data;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_ls_kn = rtb_BusAssignment_jc_logic_chosen_fac_bus_v_ls_kn;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_3_kn.SSM = rtb_Switch_v_3_kn_SSM;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_3_kn.Data = rtb_Switch_v_3_kn_Data;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_4_kn.SSM = rtb_Switch_v_4_kn_SSM;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_4_kn.Data = rtb_Switch_v_4_kn_Data;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_man_kn.SSM = rtb_Switch_v_man_kn_SSM;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_man_kn.Data = rtb_Switch_v_man_kn_Data;
    FmgcComputer_Y.out.logic.chosen_fac_bus.v_max_kn = rtb_BusAssignment_i2_logic_chosen_fac_bus_v_max_kn;
    FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_5.SSM = rtb_Switch_discrete_word_5_SSM;
    FmgcComputer_Y.out.logic.chosen_fac_bus.discrete_word_5.Data = rtb_Switch_discrete_word_5_Data;
    FmgcComputer_Y.out.logic.fcu_failure = rtb_BusAssignment_h_logic_fcu_failure;
    FmgcComputer_Y.out.logic.ils_failure = rtb_BusAssignment_o_logic_ils_failure;
    FmgcComputer_Y.out.logic.both_ils_valid = rtb_BusAssignment_o_logic_both_ils_valid;
    FmgcComputer_Y.out.logic.ils_computation_data.runway_heading_deg =
      rtb_BusAssignment_pw_logic_ils_computation_data_runway_heading_deg;
    FmgcComputer_Y.out.logic.ils_computation_data.localizer_deviation_deg.SSM = rtb_y;
    FmgcComputer_Y.out.logic.ils_computation_data.localizer_deviation_deg.Data =
      rtb_BusAssignment_f4_logic_ils_computation_data_localizer_deviation_deg.Data;
    FmgcComputer_Y.out.logic.ils_computation_data.glideslope_deviation_deg.SSM =
      rtb_Switch_i_glideslope_deviation_deg_SSM;
    FmgcComputer_Y.out.logic.ils_computation_data.glideslope_deviation_deg.Data =
      rtb_Switch_i_glideslope_deviation_deg_Data;
    FmgcComputer_Y.out.logic.ils_tune_inhibit = rtb_BusAssignment_b_logic_ils_tune_inhibit;
    FmgcComputer_Y.out.logic.rwy_hdg_memo = FmgcComputer_B.u_lyjj;
    FmgcComputer_Y.out.logic.tcas_mode_available = rtb_NOT1_i;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rwy_active = rtb_y_l1;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.nav_active = FmgcComputer_DWork.Memory_PreviousInput_ip;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.loc_cpt_active = FmgcComputer_DWork.Memory_PreviousInput_cv;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.loc_trk_active = FmgcComputer_DWork.Memory_PreviousInput_lq;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.roll_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_el;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.hdg_active = rtb_OR_iw;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.trk_active = rtb_y_mi;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rwy_loc_submode_active = FmgcComputer_DWork.Memory_PreviousInput_c;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rwy_trk_submode_active = FmgcComputer_DWork.Memory_PreviousInput_b;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.land_active = FmgcComputer_DWork.Memory_PreviousInput_d;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.align_submode_active = rtb_GreaterThan3_e;
    FmgcComputer_Y.out.ap_fd_logic.lateral_modes.rollout_submode_active = FmgcComputer_DWork.Memory_PreviousInput_m;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.clb_active = FmgcComputer_DWork.Memory_PreviousInput_ec;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.des_active = FmgcComputer_DWork.Memory_PreviousInput_b3;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.op_clb_active = FmgcComputer_DWork.Memory_PreviousInput_ae;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.op_des_active = FmgcComputer_DWork.Memory_PreviousInput_ev;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.exp_clb_active = FmgcComputer_DWork.Memory_PreviousInput_mx;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.exp_des_active = FmgcComputer_DWork.Memory_PreviousInput_o;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.pitch_takeoff_active = FmgcComputer_DWork.Memory_PreviousInput_k;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.pitch_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_i;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.vs_active = rtb_AND12;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.fpa_active = Memory_PreviousInput_l_tmp_0;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.alt_acq_active = FmgcComputer_DWork.Memory_PreviousInput_ne;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.alt_hold_active = FmgcComputer_DWork.Memory_PreviousInput_cb;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.fma_dash_display = rtb_Compare_bb;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.gs_capt_active = FmgcComputer_DWork.Memory_PreviousInput_nu;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.gs_trk_active = FmgcComputer_DWork.Memory_PreviousInput_as;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.final_des_active = rtb_Logic_b[0];
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.flare_active = rtb_y_eu;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.cruise_active =
      rtP_fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.cruise_active;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_modes.tcas_active = rtb_Logic_ac[0];
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.alt_acq_armed = rtb_AND1_c0;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.alt_acq_arm_possible = FmgcComputer_DWork.Memory_PreviousInput_n;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.nav_armed = FmgcComputer_DWork.Memory_PreviousInput_i1;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.loc_armed = FmgcComputer_DWork.Memory_PreviousInput_a;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.land_armed = FmgcComputer_DWork.Memory_PreviousInput_l;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.glide_armed = FmgcComputer_DWork.Memory_PreviousInput_fm;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.final_des_armed = FmgcComputer_DWork.Memory_PreviousInput_dv;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.clb_armed = FmgcComputer_DWork.Memory_PreviousInput_ma;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.des_armed = FmgcComputer_DWork.Memory_PreviousInput_nt;
    FmgcComputer_Y.out.ap_fd_logic.armed_modes.tcas_armed = FmgcComputer_DWork.Memory_PreviousInput_n0;
    FmgcComputer_Y.out.ap_fd_logic.active_lateral_law = rtb_active_lateral_law;
    FmgcComputer_Y.out.ap_fd_logic.active_longitudinal_law = rtb_active_longitudinal_law;
    FmgcComputer_Y.out.ap_fd_logic.auto_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_hk;
    FmgcComputer_Y.out.ap_fd_logic.manual_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_cu;
    FmgcComputer_Y.out.ap_fd_logic.mach_control_active = FmgcComputer_DWork.Delay_DSTATE_c;
    FmgcComputer_Y.out.ap_fd_logic.spd_target_kts = rtb_Switch_of[0];
    FmgcComputer_Y.out.ap_fd_logic.pfd_spd_target_kts = rtb_Switch_of[1];
    FmgcComputer_Y.out.ap_fd_logic.alt_cstr_applicable = rtb_AND_j;
    FmgcComputer_Y.out.ap_fd_logic.alt_sel_or_cstr = rtb_altCstrOrFcu;
    FmgcComputer_Y.out.ap_fd_logic.fmgc_opp_mode_sync = rtb_OR2_l;
    FmgcComputer_Y.out.ap_fd_logic.any_ap_fd_engaged = apCondition;
    FmgcComputer_Y.out.ap_fd_logic.any_lateral_mode_engaged = rtb_Compare_ov;
    FmgcComputer_Y.out.ap_fd_logic.any_longitudinal_mode_engaged = rtb_y_jt;
    FmgcComputer_Y.out.ap_fd_logic.lateral_mode_reset = rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_mode_reset = rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset;
    FmgcComputer_Y.out.ap_fd_logic.hdg_trk_preset_available = FmgcComputer_DWork.Memory_PreviousInput_bw;
    FmgcComputer_Y.out.ap_fd_logic.alt_soft_mode_active = rtb_Logic_hq[0];
    FmgcComputer_Y.out.ap_fd_logic.fd_auto_disengage = rtb_Compare_gc;
    FmgcComputer_Y.out.ap_fd_logic.ap_fd_mode_reversion = rtb_OR2_l_tmp;
    FmgcComputer_Y.out.ap_fd_logic.lateral_mode_reversion = rtb_AND8;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_mode_reversion_vs = Memory_PreviousInput_d_tmp_tmp;
    FmgcComputer_Y.out.ap_fd_logic.longitudinal_mode_reversion_op_clb = rtb_y_gb;
    FmgcComputer_Y.out.ap_fd_logic.pitch_fd_bars_flashing = rtb_NOT3_tmp_0;
    FmgcComputer_Y.out.ap_fd_logic.roll_fd_bars_flashing = rtb_y_eg_tmp;
    FmgcComputer_Y.out.ap_fd_logic.loc_bc_selection = rtP_fmgc_ap_fd_logic_output_MATLABStruct.loc_bc_selection;
    FmgcComputer_Y.out.ap_fd_logic.vs_target_not_held = rtb_AND10_b;
    FmgcComputer_Y.out.ap_fd_logic.tcas_vs_target = rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target;
    FmgcComputer_Y.out.ap_fd_logic.tcas_ra_corrective = rtb_NOT_oj;
    FmgcComputer_Y.out.ap_fd_logic.active_tcas_submode = rtb_mode;
    FmgcComputer_Y.out.ap_fd_logic.tcas_alt_acq_cond = rtb_OR2_l_tmp_1;
    FmgcComputer_Y.out.ap_fd_logic.tcas_alt_hold_cond = Memory_PreviousInput_k_tmp_tmp_tmp;
    FmgcComputer_Y.out.ap_fd_logic.tcas_ra_inhibited = rtb_NOT3;
    FmgcComputer_Y.out.ap_fd_logic.trk_fpa_deselected = rtb_BusAssignment_hk_ap_fd_logic_trk_fpa_deselected;
    FmgcComputer_Y.out.ap_fd_logic.longi_large_box_tcas = rtb_BusAssignment_hk_ap_fd_logic_longi_large_box_tcas;
    FmgcComputer_Y.out.ap_fd_logic.land_2_capability = rtb_y_c1;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_passive_capability = rtb_NOT_b;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_op_capability = rtb_appCapability_idx_2;
    FmgcComputer_Y.out.ap_fd_logic.land_2_inop = rtb_y_g3;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_passive_inop = rtb_appInop_idx_1;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_op_inop = rtb_appInop_idx_2;
    FmgcComputer_Y.out.ap_fd_logic.land_2_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_0;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_passive_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    FmgcComputer_Y.out.ap_fd_logic.land_3_fail_op_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_2;
    FmgcComputer_Y.out.ap_fd_outer_loops.Phi_loc_c = rtb_Phi_loc_c;
    FmgcComputer_Y.out.ap_fd_outer_loops.Nosewheel_c = rtb_Nosewheel_c;
    FmgcComputer_Y.out.ap_fd_outer_loops.flight_director.Theta_c_deg = rtb_Theta_c_deg;
    FmgcComputer_Y.out.ap_fd_outer_loops.flight_director.Phi_c_deg = rtb_Phi_c_deg;
    FmgcComputer_Y.out.ap_fd_outer_loops.flight_director.Beta_c_deg = rtb_Beta_c_deg;
    FmgcComputer_Y.out.ap_fd_outer_loops.autopilot.Theta_c_deg = rtb_DataTypeConversion1_d;
    FmgcComputer_Y.out.ap_fd_outer_loops.autopilot.Phi_c_deg = rtb_DataTypeConversion_cm;
    FmgcComputer_Y.out.ap_fd_outer_loops.autopilot.Beta_c_deg = rtb_Beta_c_deg_e;
    FmgcComputer_Y.out.ap_fd_outer_loops.flare_law.condition_Flare = rtb_Compare_bj;
    FmgcComputer_Y.out.ap_fd_outer_loops.flare_law.H_dot_radio_fpm = rtb_H_dot_radio_fpm;
    FmgcComputer_Y.out.ap_fd_outer_loops.flare_law.H_dot_c_fpm = rtb_H_dot_c_fpm;
    FmgcComputer_Y.out.ap_fd_outer_loops.flare_law.delta_Theta_H_dot_deg = rtb_delta_Theta_H_dot_deg;
    FmgcComputer_Y.out.ap_fd_outer_loops.flare_law.delta_Theta_bz_deg = rtb_delta_Theta_bz_deg;
    FmgcComputer_Y.out.ap_fd_outer_loops.flare_law.delta_Theta_bx_deg = rtb_delta_Theta_bx_deg;
    FmgcComputer_Y.out.ap_fd_outer_loops.flare_law.delta_Theta_beta_c_deg = rtb_delta_Theta_beta_c_deg;
    FmgcComputer_Y.out.athr.athr_active = rtb_y_ov;
    FmgcComputer_Y.out.athr.athr_limited = rtb_y_nn;
    FmgcComputer_Y.out.athr.alpha_floor_mode_active = FmgcComputer_DWork.Memory_PreviousInput_hu;
    FmgcComputer_Y.out.athr.thrust_mode_active = FmgcComputer_DWork.Memory_PreviousInput_bh;
    FmgcComputer_Y.out.athr.thrust_target_idle = rtb_OR_i;
    FmgcComputer_Y.out.athr.speed_mach_mode_active = FmgcComputer_DWork.Memory_PreviousInput_cm;
    FmgcComputer_Y.out.athr.retard_mode_active = FmgcComputer_DWork.Memory_PreviousInput_ol;
    FmgcComputer_Y.out.athr.fma_mode = rtb_y_fn;
    FmgcComputer_Y.out.athr.fma_message = rtb_y_ip;
    FmgcComputer_Y.out.athr.n1_c_percent = rtb_Switch1_a;
    FmgcComputer_Y.out.discrete_outputs.athr_own_engaged = FmgcComputer_DWork.Delay_DSTATE_k;
    FmgcComputer_Y.out.discrete_outputs.fd_own_engaged = fdOwnOff;
    FmgcComputer_Y.out.discrete_outputs.ap_own_engaged = rtb_Logic_a2[0];
    FmgcComputer_Y.out.discrete_outputs.fcu_own_fail = FmgcComputer_P.Constant_Value_m5;
    FmgcComputer_Y.out.discrete_outputs.fmgc_healthy = FmgcComputer_P.Constant1_Value_i5;
    FmgcComputer_Y.out.discrete_outputs.ils_test_inhibit = rtb_BusAssignment_b_logic_ils_tune_inhibit;
    if ((!rtb_y_ju) && (!rtb_y_n) && (!FmgcComputer_DWork.Memory_PreviousInput_hk)) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pfd_sel_spd_kts.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pfd_sel_spd_kts.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pfd_sel_spd_kts.Data = static_cast<real32_T>(rtb_Switch_of[1]);
    if (rtb_y_g || rtb_BusAssignment_b_logic_ils_tune_inhibit) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.runway_hdg_memorized_deg.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.runway_hdg_memorized_deg.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.runway_hdg_memorized_deg.Data = static_cast<real32_T>
      (FmgcComputer_B.u_lyjj);
    if (FmgcComputer_U.in.fms_inputs.preset_mach > FmgcComputer_P.CompareToConstant1_const_f) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_mach_from_mcdu.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_mach_from_mcdu.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_mach_from_mcdu.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.preset_mach);
    if (FmgcComputer_U.in.fms_inputs.preset_spd_kts > FmgcComputer_P.CompareToConstant2_const_j) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_speed_from_mcdu_kts.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_speed_from_mcdu_kts.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.preset_speed_from_mcdu_kts.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.preset_spd_kts);
    rtb_y_n = !FmgcComputer_DWork.Memory_PreviousInput_m;
    if (rtb_Compare_ov && (!FmgcComputer_DWork.Memory_PreviousInput_c) && rtb_y_n) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.roll_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.roll_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.roll_fd_command.Data = static_cast<real32_T>(rtb_Phi_c_deg);
    if (rtb_y_jt && rtb_y_n) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pitch_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pitch_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.pitch_fd_command.Data = static_cast<real32_T>(rtb_Theta_c_deg);
    if (FmgcComputer_DWork.Memory_PreviousInput_c || rtb_GreaterThan3_e || FmgcComputer_DWork.Memory_PreviousInput_m) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.yaw_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.yaw_fd_command.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.yaw_fd_command.Data = static_cast<real32_T>(rtb_Beta_c_deg);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_5.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_4.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_4.Data = rtb_DataTypeConversion2_bh;
    if (rtb_AND_j) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fm_alt_constraint_ft.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fm_alt_constraint_ft.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fm_alt_constraint_ft.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.altitude_ft = rtb_BusAssignment_ic_logic_altitude_indicated_ft;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.mach.SSM = rtb_adrComputationBus_mach_SSM;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.mach.Data = rtb_adrComputationBus_mach_Data;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.cas_kts =
      rtb_BusAssignment_i2_logic_adr_computation_data_airspeed_computed_kn;
    if (FmgcComputer_U.in.fms_inputs.flex_temp_deg_c != FmgcComputer_P.CompareToConstant_const_c) {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.flx_to_temp_deg_c.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant1_Value);
    } else {
      FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.flx_to_temp_deg_c.SSM = static_cast<uint32_T>
        (FmgcComputer_P.EnumeratedConstant_Value);
    }

    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.flx_to_temp_deg_c.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.flex_temp_deg_c);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_discrete_word.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_discrete_word.Data = rtb_y_bf;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.ats_fma_discrete_word.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_3.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_3.Data = rtb_y_gtq;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_1.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_1.Data = rtb_y_p3;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_2.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_2.Data = rtb_y_pv;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_6.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.synchro_spd_mach_value.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.synchro_spd_mach_value.Data = FmgcComputer_P.Constant26_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.low_target_speed_margin_kts.SSM = rtb_Switch9;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.low_target_speed_margin_kts.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.v_lower_margin_kts);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.high_target_speed_margin_kts.SSM = rtb_Switch9;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.high_target_speed_margin_kts.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.v_upper_margin_kts);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_ail_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_ail_voted_cmd_deg.Data = static_cast<real32_T>
      (rtb_DataTypeConversion_cm);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_splr_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_p_splr_voted_cmd_deg.Data = static_cast<real32_T>
      (rtb_DataTypeConversion_cm);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_r_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_r_voted_cmd_deg.Data = static_cast<real32_T>(rtb_Beta_c_deg_e);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_nosewheel_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_nosewheel_voted_cmd_deg.Data = static_cast<real32_T>(rtb_Nosewheel_c);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_q_voted_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.delta_q_voted_cmd_deg.Data = static_cast<real32_T>
      (rtb_DataTypeConversion1_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.track_deg =
      rtb_BusAssignment_jc_logic_ir_computation_data_track_angle_magnetic_deg;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.heading_deg =
      rtb_BusAssignment_jc_logic_ir_computation_data_heading_magnetic_deg;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fpa_deg.SSM = rtb_irComputationBus_flight_path_angle_deg_SSM;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.fpa_deg.Data = rtb_irComputationBus_flight_path_angle_deg_Data;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.n1_command_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.n1_command_percent.Data = static_cast<real32_T>(rtb_Switch1_a);
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.vertical_speed_ft_min =
      rtb_BusAssignment_jc_logic_ir_computation_data_inertial_vertical_speed_ft_s;
    FmgcComputer_Y.out.bus_outputs.fmgc_a_bus.discrete_word_7.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_weight_lbs.SSM = rtb_Switch_total_weight_lbs_SSM;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_weight_lbs.Data = rtb_Switch_total_weight_lbs_Data;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_weight_lbs.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_weight_lbs.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.fms_weight_lbs);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_cg_percent.SSM = rtb_Switch_center_of_gravity_pos_percent_SSM;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fac_cg_percent.Data = rtb_Switch_center_of_gravity_pos_percent_Data;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_cg_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fm_cg_percent.Data = static_cast<real32_T>
      (FmgcComputer_U.in.fms_inputs.fms_cg_percent);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fg_radio_height_ft.SSM = rtb_raComputationData_radio_height_ft_SSM;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.fg_radio_height_ft.Data = rtb_raComputationData_radio_height_ft_Data;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_4.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_4.Data = rtb_DataTypeConversion2_bh;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.ats_discrete_word.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.ats_discrete_word.Data = rtb_y_bf;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_3.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_3.Data = rtb_y_gtq;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_1.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_1.Data = rtb_y_p3;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_2.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.discrete_word_2.Data = rtb_y_pv;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.approach_spd_target_kn.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.approach_spd_target_kn.Data = FmgcComputer_P.Constant11_Value;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_ail_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_ail_cmd_deg.Data = static_cast<real32_T>(rtb_DataTypeConversion_cm);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_splr_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_p_splr_cmd_deg.Data = static_cast<real32_T>
      (rtb_DataTypeConversion_cm);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_r_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_r_cmd_deg.Data = static_cast<real32_T>(rtb_Beta_c_deg_e);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_nose_wheel_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_nose_wheel_cmd_deg.Data = static_cast<real32_T>(rtb_Nosewheel_c);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_q_cmd_deg.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.delta_q_cmd_deg.Data = static_cast<real32_T>(rtb_DataTypeConversion1_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_left_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_left_percent.Data = FmgcComputer_P.Constant2_Value_n;
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_right_percent.SSM = static_cast<uint32_T>
      (FmgcComputer_P.EnumeratedConstant1_Value_d);
    FmgcComputer_Y.out.bus_outputs.fmgc_b_bus.n1_right_percent.Data = FmgcComputer_P.Constant2_Value_n;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_active = rtb_y_l1;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.nav_active = FmgcComputer_DWork.Memory_PreviousInput_ip;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_cpt_active = FmgcComputer_DWork.Memory_PreviousInput_cv;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.loc_trk_active = FmgcComputer_DWork.Memory_PreviousInput_lq;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.roll_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_el;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.hdg_active = rtb_OR_iw;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.trk_active = rtb_y_mi;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_loc_submode_active = FmgcComputer_DWork.Memory_PreviousInput_c;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rwy_trk_submode_active = FmgcComputer_DWork.Memory_PreviousInput_b;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.land_active = FmgcComputer_DWork.Memory_PreviousInput_d;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.align_submode_active = rtb_GreaterThan3_e;
    FmgcComputer_DWork.Delay_DSTATE.lateral_modes.rollout_submode_active = FmgcComputer_DWork.Memory_PreviousInput_m;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.clb_active = FmgcComputer_DWork.Memory_PreviousInput_ec;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.des_active = FmgcComputer_DWork.Memory_PreviousInput_b3;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_clb_active = FmgcComputer_DWork.Memory_PreviousInput_ae;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.op_des_active = FmgcComputer_DWork.Memory_PreviousInput_ev;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_clb_active = FmgcComputer_DWork.Memory_PreviousInput_mx;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.exp_des_active = FmgcComputer_DWork.Memory_PreviousInput_o;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_takeoff_active = FmgcComputer_DWork.Memory_PreviousInput_k;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.pitch_goaround_active = FmgcComputer_DWork.Memory_PreviousInput_i;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.vs_active = rtb_AND12;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fpa_active = Memory_PreviousInput_l_tmp_0;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_acq_active = FmgcComputer_DWork.Memory_PreviousInput_ne;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.alt_hold_active = FmgcComputer_DWork.Memory_PreviousInput_cb;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.fma_dash_display = rtb_Compare_bb;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_capt_active = FmgcComputer_DWork.Memory_PreviousInput_nu;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.gs_trk_active = FmgcComputer_DWork.Memory_PreviousInput_as;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.final_des_active = rtb_Logic_b[0];
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.flare_active = rtb_y_eu;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.cruise_active =
      rtP_fmgc_ap_fd_logic_output_MATLABStruct.longitudinal_modes.cruise_active;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_modes.tcas_active = rtb_Logic_ac[0];
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_armed = rtb_AND1_c0;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.alt_acq_arm_possible = FmgcComputer_DWork.Memory_PreviousInput_n;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.nav_armed = FmgcComputer_DWork.Memory_PreviousInput_i1;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.loc_armed = FmgcComputer_DWork.Memory_PreviousInput_a;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.land_armed = FmgcComputer_DWork.Memory_PreviousInput_l;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.glide_armed = FmgcComputer_DWork.Memory_PreviousInput_fm;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.final_des_armed = FmgcComputer_DWork.Memory_PreviousInput_dv;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.clb_armed = FmgcComputer_DWork.Memory_PreviousInput_ma;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.des_armed = FmgcComputer_DWork.Memory_PreviousInput_nt;
    FmgcComputer_DWork.Delay_DSTATE.armed_modes.tcas_armed = FmgcComputer_DWork.Memory_PreviousInput_n0;
    FmgcComputer_DWork.Delay_DSTATE.active_lateral_law = rtb_active_lateral_law;
    FmgcComputer_DWork.Delay_DSTATE.active_longitudinal_law = rtb_active_longitudinal_law;
    FmgcComputer_DWork.Delay_DSTATE.auto_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_hk;
    FmgcComputer_DWork.Delay_DSTATE.manual_spd_control_active = FmgcComputer_DWork.Memory_PreviousInput_cu;
    FmgcComputer_DWork.Delay_DSTATE.mach_control_active = FmgcComputer_DWork.Delay_DSTATE_c;
    FmgcComputer_DWork.Delay_DSTATE.spd_target_kts = rtb_Switch_of[0];
    FmgcComputer_DWork.Delay_DSTATE.pfd_spd_target_kts = rtb_Switch_of[1];
    FmgcComputer_DWork.Delay_DSTATE.alt_cstr_applicable = rtb_AND_j;
    FmgcComputer_DWork.Delay_DSTATE.alt_sel_or_cstr = rtb_altCstrOrFcu;
    FmgcComputer_DWork.Delay_DSTATE.fmgc_opp_mode_sync = rtb_OR2_l;
    FmgcComputer_DWork.Delay_DSTATE.any_ap_fd_engaged = apCondition;
    FmgcComputer_DWork.Delay_DSTATE.any_lateral_mode_engaged = rtb_Compare_ov;
    FmgcComputer_DWork.Delay_DSTATE.lateral_mode_reset = rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_mode_reset = rtb_BusAssignment_m_ap_fd_logic_lateral_mode_reset;
    FmgcComputer_DWork.Delay_DSTATE.hdg_trk_preset_available = FmgcComputer_DWork.Memory_PreviousInput_bw;
    FmgcComputer_DWork.Delay_DSTATE.alt_soft_mode_active = rtb_Logic_hq[0];
    FmgcComputer_DWork.Delay_DSTATE.fd_auto_disengage = rtb_Compare_gc;
    FmgcComputer_DWork.Delay_DSTATE.ap_fd_mode_reversion = rtb_OR2_l_tmp;
    FmgcComputer_DWork.Delay_DSTATE.lateral_mode_reversion = rtb_AND8;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_mode_reversion_vs = Memory_PreviousInput_d_tmp_tmp;
    FmgcComputer_DWork.Delay_DSTATE.longitudinal_mode_reversion_op_clb = rtb_y_gb;
    FmgcComputer_DWork.Delay_DSTATE.pitch_fd_bars_flashing = rtb_NOT3_tmp_0;
    FmgcComputer_DWork.Delay_DSTATE.roll_fd_bars_flashing = rtb_y_eg_tmp;
    FmgcComputer_DWork.Delay_DSTATE.loc_bc_selection = rtP_fmgc_ap_fd_logic_output_MATLABStruct.loc_bc_selection;
    FmgcComputer_DWork.Delay_DSTATE.vs_target_not_held = rtb_AND10_b;
    FmgcComputer_DWork.Delay_DSTATE.tcas_vs_target = rtb_BusAssignment_hk_ap_fd_logic_tcas_vs_target;
    FmgcComputer_DWork.Delay_DSTATE.tcas_ra_corrective = rtb_NOT_oj;
    FmgcComputer_DWork.Delay_DSTATE.active_tcas_submode = rtb_mode;
    FmgcComputer_DWork.Delay_DSTATE.tcas_alt_acq_cond = rtb_OR2_l_tmp_1;
    FmgcComputer_DWork.Delay_DSTATE.tcas_alt_hold_cond = Memory_PreviousInput_k_tmp_tmp_tmp;
    FmgcComputer_DWork.Delay_DSTATE.tcas_ra_inhibited = rtb_NOT3;
    FmgcComputer_DWork.Delay_DSTATE.trk_fpa_deselected = rtb_BusAssignment_hk_ap_fd_logic_trk_fpa_deselected;
    FmgcComputer_DWork.Delay_DSTATE.longi_large_box_tcas = rtb_BusAssignment_hk_ap_fd_logic_longi_large_box_tcas;
    FmgcComputer_DWork.Delay_DSTATE.land_2_capability = rtb_y_c1;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_passive_capability = rtb_NOT_b;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_op_capability = rtb_appCapability_idx_2;
    FmgcComputer_DWork.Delay_DSTATE.land_2_inop = rtb_y_g3;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_passive_inop = rtb_appInop_idx_1;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_op_inop = rtb_appInop_idx_2;
    FmgcComputer_DWork.Delay_DSTATE.land_2_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_0;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_passive_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_1;
    FmgcComputer_DWork.Delay_DSTATE.land_3_fail_op_capacity = rtb_TmpSignalConversionAtSFunctionInport3_idx_2;
    FmgcComputer_DWork.Delay_DSTATE_p = rtb_Logic_a2[0];
    FmgcComputer_DWork.Memory_PreviousInput_g = rtb_Logic_a2[0];
    FmgcComputer_DWork.Memory_PreviousInput_p = FmgcComputer_DWork.Delay_DSTATE_k;
    FmgcComputer_DWork.Delay2_DSTATE.Phi_loc_c = rtb_Phi_loc_c;
    FmgcComputer_DWork.Delay2_DSTATE.Nosewheel_c = rtb_Nosewheel_c;
    FmgcComputer_DWork.Delay2_DSTATE.flight_director.Theta_c_deg = rtb_Theta_c_deg;
    FmgcComputer_DWork.Delay2_DSTATE.flight_director.Phi_c_deg = rtb_Phi_c_deg;
    FmgcComputer_DWork.Delay2_DSTATE.flight_director.Beta_c_deg = rtb_Beta_c_deg;
    FmgcComputer_DWork.Delay2_DSTATE.autopilot.Beta_c_deg = rtb_Beta_c_deg_e;
    FmgcComputer_DWork.Delay2_DSTATE.flare_law.condition_Flare = rtb_Compare_bj;
    FmgcComputer_DWork.Delay2_DSTATE.flare_law.H_dot_radio_fpm = rtb_H_dot_radio_fpm;
    FmgcComputer_DWork.Delay2_DSTATE.flare_law.H_dot_c_fpm = rtb_H_dot_c_fpm;
    FmgcComputer_DWork.Delay2_DSTATE.flare_law.delta_Theta_H_dot_deg = rtb_delta_Theta_H_dot_deg;
    FmgcComputer_DWork.Delay2_DSTATE.flare_law.delta_Theta_bz_deg = rtb_delta_Theta_bz_deg;
    FmgcComputer_DWork.Delay2_DSTATE.flare_law.delta_Theta_bx_deg = rtb_delta_Theta_bx_deg;
    FmgcComputer_DWork.Delay2_DSTATE.flare_law.delta_Theta_beta_c_deg = rtb_delta_Theta_beta_c_deg;
    FmgcComputer_DWork.Memory_PreviousInput_f = rtb_Logic_b[0];
    FmgcComputer_DWork.DelayInput1_DSTATE = FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft;
    FmgcComputer_DWork.DelayInput1_DSTATE_n = FmgcComputer_U.in.fms_inputs.next_alt_cstr_ft;
    FmgcComputer_DWork.DelayInput1_DSTATE_b = rtb_DataTypeConversion2_kb;
    FmgcComputer_DWork.Memory_PreviousInput_i5 = rtb_Logic_ac[0];
    FmgcComputer_DWork.Delay_DSTATE_fe = FmgcComputer_P.Constant_Value_k;
    FmgcComputer_DWork.Memory_PreviousInput_bo = FmgcComputer_DWork.Delay_DSTATE_c;
    FmgcComputer_DWork.Memory_PreviousInput_ak = rtb_Logic_hq[0];
    FmgcComputer_DWork.Memory_PreviousInput_j = FmgcComputer_P.Logic_table_lwo[static_cast<uint32_T>(absVsTarget)];
    FmgcComputer_DWork.Delay1_DSTATE.athr_active = rtb_y_ov;
    FmgcComputer_DWork.Delay1_DSTATE.athr_limited = rtb_y_nn;
    FmgcComputer_DWork.Delay1_DSTATE.alpha_floor_mode_active = FmgcComputer_DWork.Memory_PreviousInput_hu;
    FmgcComputer_DWork.Delay1_DSTATE.thrust_mode_active = FmgcComputer_DWork.Memory_PreviousInput_bh;
    FmgcComputer_DWork.Delay1_DSTATE.thrust_target_idle = rtb_OR_i;
    FmgcComputer_DWork.Delay1_DSTATE.speed_mach_mode_active = FmgcComputer_DWork.Memory_PreviousInput_cm;
    FmgcComputer_DWork.Delay1_DSTATE.retard_mode_active = FmgcComputer_DWork.Memory_PreviousInput_ol;
    FmgcComputer_DWork.Delay1_DSTATE.fma_mode = rtb_y_fn;
    FmgcComputer_DWork.Delay1_DSTATE.fma_message = rtb_y_ip;
    FmgcComputer_DWork.Delay1_DSTATE.n1_c_percent = rtb_Switch1_a;
    FmgcComputer_DWork.icLoad = false;
    FmgcComputer_DWork.Delay_DSTATE_f = FmgcComputer_DWork.Delay_DSTATE_l;
  } else {
    FmgcComputer_DWork.Runtime_MODE = false;
  }
}

void FmgcComputer::initialize()
{
  FmgcComputer_DWork.Delay_DSTATE = FmgcComputer_P.Delay_InitialCondition;
  FmgcComputer_DWork.Delay_DSTATE_p = FmgcComputer_P.Delay_InitialCondition_g;
  FmgcComputer_DWork.Memory_PreviousInput = FmgcComputer_P.SRFlipFlop1_initial_condition;
  FmgcComputer_DWork.Memory_PreviousInput_g = FmgcComputer_P.SRFlipFlop_initial_condition;
  FmgcComputer_DWork.Memory_PreviousInput_g1 = FmgcComputer_P.SRFlipFlop1_initial_condition_n;
  FmgcComputer_DWork.Delay_DSTATE_k = FmgcComputer_P.Delay_InitialCondition_gu;
  FmgcComputer_DWork.Memory_PreviousInput_p = FmgcComputer_P.SRFlipFlop_initial_condition_b;
  FmgcComputer_DWork.Delay_DSTATE_o = FmgcComputer_P.Delay_InitialCondition_n;
  FmgcComputer_DWork.Memory_PreviousInput_e = FmgcComputer_P.SRFlipFlop_initial_condition_a;
  FmgcComputer_DWork.Memory_PreviousInput_k = FmgcComputer_P.SRFlipFlop_initial_condition_h;
  FmgcComputer_DWork.Memory_PreviousInput_c = FmgcComputer_P.SRFlipFlop_initial_condition_i;
  FmgcComputer_DWork.Memory_PreviousInput_b = FmgcComputer_P.SRFlipFlop_initial_condition_c;
  FmgcComputer_DWork.Memory_PreviousInput_l = FmgcComputer_P.SRFlipFlop_initial_condition_d;
  FmgcComputer_DWork.Memory_PreviousInput_d = FmgcComputer_P.SRFlipFlop_initial_condition_iz;
  FmgcComputer_DWork.Memory_PreviousInput_m = FmgcComputer_P.SRFlipFlop_initial_condition_m;
  FmgcComputer_DWork.Delay2_DSTATE = FmgcComputer_P.Delay2_InitialCondition;
  FmgcComputer_DWork.Memory_PreviousInput_bc = FmgcComputer_P.SRFlipFlop_initial_condition_p;
  FmgcComputer_DWork.Memory_PreviousInput_dv = FmgcComputer_P.SRFlipFlop_initial_condition_l;
  FmgcComputer_DWork.Memory_PreviousInput_f = FmgcComputer_P.SRFlipFlop_initial_condition_j;
  FmgcComputer_DWork.Memory_PreviousInput_i = FmgcComputer_P.SRFlipFlop_initial_condition_h5;
  FmgcComputer_DWork.Memory_PreviousInput_el = FmgcComputer_P.SRFlipFlop_initial_condition_e;
  FmgcComputer_DWork.Memory_PreviousInput_f2 = FmgcComputer_P.SRFlipFlop_initial_condition_cs;
  FmgcComputer_DWork.Memory_PreviousInput_i1 = FmgcComputer_P.SRFlipFlop_initial_condition_o;
  FmgcComputer_DWork.Memory_PreviousInput_ip = FmgcComputer_P.SRFlipFlop_initial_condition_g;
  FmgcComputer_DWork.Memory_PreviousInput_a = FmgcComputer_P.SRFlipFlop_initial_condition_n;
  FmgcComputer_DWork.Memory_PreviousInput_cv = FmgcComputer_P.SRFlipFlop_initial_condition_of;
  FmgcComputer_DWork.Memory_PreviousInput_lq = FmgcComputer_P.SRFlipFlop_initial_condition_on;
  FmgcComputer_DWork.Memory_PreviousInput_n = FmgcComputer_P.SRFlipFlop1_initial_condition_b;
  FmgcComputer_DWork.Memory_PreviousInput_ne = FmgcComputer_P.SRFlipFlop_initial_condition_ja;
  FmgcComputer_DWork.Memory_PreviousInput_cb = FmgcComputer_P.SRFlipFlop_initial_condition_li;
  FmgcComputer_DWork.Memory_PreviousInput_no = FmgcComputer_P.SRFlipFlop1_initial_condition_l;
  FmgcComputer_DWork.Memory_PreviousInput_fg = FmgcComputer_P.SRFlipFlop1_initial_condition_i;
  FmgcComputer_DWork.Memory_PreviousInput_ma = FmgcComputer_P.SRFlipFlop_initial_condition_be;
  FmgcComputer_DWork.DelayInput1_DSTATE = FmgcComputer_P.DetectChange_vinit;
  FmgcComputer_DWork.Memory_PreviousInput_ec = FmgcComputer_P.SRFlipFlop_initial_condition_jv;
  FmgcComputer_DWork.Memory_PreviousInput_nt = FmgcComputer_P.SRFlipFlop_initial_condition_p4;
  FmgcComputer_DWork.DelayInput1_DSTATE_n = FmgcComputer_P.DetectChange_vinit_p;
  FmgcComputer_DWork.Memory_PreviousInput_b3 = FmgcComputer_P.SRFlipFlop_initial_condition_lz;
  FmgcComputer_DWork.Memory_PreviousInput_ae = FmgcComputer_P.SRFlipFlop_initial_condition_oz;
  FmgcComputer_DWork.Memory_PreviousInput_ev = FmgcComputer_P.SRFlipFlop_initial_condition_pr;
  FmgcComputer_DWork.Memory_PreviousInput_mx = FmgcComputer_P.SRFlipFlop_initial_condition_eb;
  FmgcComputer_DWork.Memory_PreviousInput_o = FmgcComputer_P.SRFlipFlop_initial_condition_jw;
  FmgcComputer_DWork.Memory_PreviousInput_fm = FmgcComputer_P.SRFlipFlop_initial_condition_ce;
  FmgcComputer_DWork.DelayInput1_DSTATE_b = FmgcComputer_P.DetectDecrease_vinit;
  FmgcComputer_DWork.Memory_PreviousInput_nu = FmgcComputer_P.SRFlipFlop_initial_condition_hs;
  FmgcComputer_DWork.Memory_PreviousInput_as = FmgcComputer_P.SRFlipFlop_initial_condition_dp;
  FmgcComputer_DWork.Memory_PreviousInput_n0 = FmgcComputer_P.SRFlipFlop1_initial_condition_c;
  FmgcComputer_DWork.Memory_PreviousInput_i5 = FmgcComputer_P.SRFlipFlop_initial_condition_ia;
  FmgcComputer_DWork.Memory_PreviousInput_h = FmgcComputer_P.SRFlipFlop1_initial_condition_o;
  FmgcComputer_DWork.Memory_PreviousInput_cp = FmgcComputer_P.SRFlipFlop2_initial_condition;
  FmgcComputer_DWork.Memory_PreviousInput_bw = FmgcComputer_P.SRFlipFlop_initial_condition_at;
  FmgcComputer_DWork.Delay_DSTATE_fe = FmgcComputer_P.Delay_InitialCondition_d;
  FmgcComputer_DWork.Memory_PreviousInput_cu = FmgcComputer_P.SRFlipFlop1_initial_condition_on;
  FmgcComputer_DWork.Memory_PreviousInput_hk = FmgcComputer_P.SRFlipFlop_initial_condition_n1;
  FmgcComputer_DWork.Delay_DSTATE_c = FmgcComputer_P.Delay_InitialCondition_a;
  FmgcComputer_DWork.Memory_PreviousInput_bo = FmgcComputer_P.SRFlipFlop_initial_condition_e5;
  FmgcComputer_DWork.Memory_PreviousInput_ak = FmgcComputer_P.SRFlipFlop_initial_condition_er;
  FmgcComputer_DWork.Memory_PreviousInput_j = FmgcComputer_P.SRFlipFlop1_initial_condition_d;
  FmgcComputer_DWork.Memory_PreviousInput_hu = FmgcComputer_P.SRFlipFlop_initial_condition_nm;
  FmgcComputer_DWork.Delay1_DSTATE = FmgcComputer_P.Delay1_InitialCondition;
  FmgcComputer_DWork.Memory_PreviousInput_bh = FmgcComputer_P.SRFlipFlop1_initial_condition_lo;
  FmgcComputer_DWork.Memory_PreviousInput_cm = FmgcComputer_P.SRFlipFlop1_initial_condition_m;
  FmgcComputer_DWork.Memory_PreviousInput_ol = FmgcComputer_P.SRFlipFlop1_initial_condition_by;
  FmgcComputer_DWork.Memory_PreviousInput_kr = FmgcComputer_P.SRFlipFlop_initial_condition_as;
  FmgcComputer_DWork.Memory_PreviousInput_km = FmgcComputer_P.SRFlipFlop1_initial_condition_l0;
  FmgcComputer_DWork.Delay_DSTATE_i = FmgcComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
  FmgcComputer_DWork.Delay_DSTATE_l = FmgcComputer_P.Delay_InitialCondition_p;
  FmgcComputer_DWork.icLoad = true;
  FmgcComputer_B.u_lyjj = FmgcComputer_P.Y_Y0;
  FmgcComputer_B.u_lyjjlj = FmgcComputer_P.Y_Y0_j;
  FmgcComputer_B.u_ly = FmgcComputer_P.Y_Y0_h;
  FmgcComputer_B.u_lyj = FmgcComputer_P.Y_Y0_i;
  FmgcComputer_B.u_l = FmgcComputer_P.Y_Y0_g;
  FmgcComputer_B.u = FmgcComputer_P.Y_Y0_c;
  FmgcComputer_B.u_lyjjl = FmgcComputer_P.Y_Y0_d;
  LawMDLOBJ1.init();
  FmgcComputer_Y.out = FmgcComputer_P.out_Y0;
}

void FmgcComputer::terminate()
{
}

FmgcComputer::FmgcComputer():
  FmgcComputer_U(),
  FmgcComputer_Y(),
  FmgcComputer_B(),
  FmgcComputer_DWork()
{
}

FmgcComputer::~FmgcComputer() = default;
