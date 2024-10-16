#include "Autothrust.h"
#include "rtwtypes.h"
#include "Autothrust_types.h"
#include <cmath>
#include "maximum_Abpa9SzA.h"
#include "look1_binlxpw.h"

const uint8_T Autothrust_IN_InAir{ 1U };

const uint8_T Autothrust_IN_OnGround{ 2U };

void Autothrust::Autothrust_TimeSinceCondition(real_T rtu_time, boolean_T rtu_condition, real_T *rty_y,
  rtDW_TimeSinceCondition_Autothrust_T *localDW)
{
  if (!localDW->eventTime_not_empty) {
    localDW->eventTime = rtu_time;
    localDW->eventTime_not_empty = true;
  }

  if ((!rtu_condition) || (localDW->eventTime == 0.0)) {
    localDW->eventTime = rtu_time;
  }

  *rty_y = rtu_time - localDW->eventTime;
}

void Autothrust::Autothrust_LeadLagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_C2, real_T rtu_C3, real_T rtu_C4,
  real_T rtu_dt, real_T *rty_Y, rtDW_LeadLagFilter_Autothrust_T *localDW)
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

void Autothrust::Autothrust_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_Autothrust_T *localDW)
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
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void Autothrust::Autothrust_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_Autothrust_T *localDW)
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

void Autothrust::Autothrust_MATLABFunction(real_T rtu_u, real_T *rty_y, boolean_T *rty_r)
{
  boolean_T r;
  r = (std::abs(rtu_u) > 0.8);
  if (r) {
    *rty_y = 0.0;
  } else {
    *rty_y = rtu_u;
  }

  *rty_r = r;
}

void Autothrust::Autothrust_ThrustMode1(real_T rtu_u, real_T *rty_y)
{
  if (rtu_u < 0.0) {
    *rty_y = 1.0;
  } else if (rtu_u == 0.0) {
    *rty_y = 2.0;
  } else if ((rtu_u > 0.0) && (rtu_u < 25.0)) {
    *rty_y = 3.0;
  } else if ((rtu_u >= 25.0) && (rtu_u < 35.0)) {
    *rty_y = 4.0;
  } else if ((rtu_u >= 35.0) && (rtu_u < 45.0)) {
    *rty_y = 5.0;
  } else if (rtu_u == 45.0) {
    *rty_y = 6.0;
  } else {
    *rty_y = 0.0;
  }
}

void Autothrust::Autothrust_TLAComputation1(const athr_out *rtu_in, real_T rtu_TLA, real_T *rty_N1c, boolean_T
  *rty_inReverse)
{
  real_T N1_begin;
  real_T N1_end;
  real_T TLA;
  int32_T TLA_begin;
  int32_T TLA_end;
  TLA = rtu_TLA;
  if (!rtu_in->data.on_ground) {
    TLA = std::fmax(0.0, rtu_TLA);
  }

  *rty_inReverse = (TLA < 0.0);
  if (TLA >= 0.0) {
    if (TLA <= 25.0) {
      TLA_begin = 0;
      N1_begin = rtu_in->input.thrust_limit_IDLE_percent;
      TLA_end = 25;
      N1_end = rtu_in->input.thrust_limit_CLB_percent;
    } else if (TLA <= 35.0) {
      TLA_begin = 25;
      N1_begin = rtu_in->input.thrust_limit_CLB_percent;
      TLA_end = 35;
      if (rtu_in->data_computed.is_FLX_active) {
        N1_end = rtu_in->input.thrust_limit_FLEX_percent;
      } else {
        N1_end = rtu_in->input.thrust_limit_MCT_percent;
      }
    } else {
      TLA_begin = 35;
      if (rtu_in->data_computed.is_FLX_active) {
        N1_begin = rtu_in->input.thrust_limit_FLEX_percent;
      } else {
        N1_begin = rtu_in->input.thrust_limit_MCT_percent;
      }

      TLA_end = 45;
      N1_end = rtu_in->input.thrust_limit_TOGA_percent;
    }
  } else {
    TLA = std::fmax(std::abs(TLA), 6.0);
    TLA_begin = 6;
    N1_begin = std::abs(rtu_in->input.thrust_limit_IDLE_percent + 1.0);
    TLA_end = 20;
    N1_end = std::abs(rtu_in->input.thrust_limit_REV_percent);
  }

  *rty_N1c = (N1_end - N1_begin) / static_cast<real_T>(TLA_end - TLA_begin) * (TLA - static_cast<real_T>(TLA_begin)) +
    N1_begin;
}

real_T Autothrust::Autothrust_timeSinceConditionArmedActive(real_T in_time_simulation_time, athr_status status)
{
  if (!Autothrust_DWork.eventTime_not_empty_a) {
    Autothrust_DWork.eventTime_f = in_time_simulation_time;
    Autothrust_DWork.eventTime_not_empty_a = true;
  }

  if ((status == athr_status::DISENGAGED) || (Autothrust_DWork.eventTime_f == 0.0)) {
    Autothrust_DWork.eventTime_f = in_time_simulation_time;
  }

  return in_time_simulation_time - Autothrust_DWork.eventTime_f;
}

void Autothrust::step()
{
  athr_out rtb_BusAssignment_n;
  real_T result_tmp_0[9];
  real_T tmp[4];
  real_T result[3];
  real_T Phi_rad;
  real_T Theta_rad;
  real_T result_tmp;
  real_T rtb_Gain2;
  real_T rtb_Gain3;
  real_T rtb_Gain_m;
  real_T rtb_Saturation;
  real_T rtb_Switch_d;
  real_T rtb_Switch_dx;
  real_T rtb_Switch_ej;
  real_T rtb_Switch_f_idx_2;
  real_T rtb_Switch_f_idx_3;
  real_T rtb_y_a;
  real_T rtb_y_p;
  int32_T i;
  int32_T rtb_on_ground;
  boolean_T ATHR_ENGAGED_tmp;
  boolean_T ATHR_ENGAGED_tmp_0;
  boolean_T condition_AP_FD_ATHR_Specific;
  boolean_T condition_AP_FD_ATHR_Specific_tmp;
  boolean_T condition_AP_FD_ATHR_Specific_tmp_0;
  boolean_T condition_AP_FD_ATHR_Specific_tmp_1;
  boolean_T condition_THR_LK_tmp;
  boolean_T condition_TOGA;
  boolean_T condition_TOGA_latch_tmp;
  boolean_T rtb_Compare;
  boolean_T rtb_NOT1_c;
  boolean_T rtb_out;
  boolean_T rtb_r_a;
  boolean_T rtb_r_g_tmp;
  boolean_T rtb_r_h;
  boolean_T rtb_r_he;
  boolean_T rtb_y_f;
  boolean_T tmp_0;
  athr_mode mode;
  athr_status status;
  rtb_BusAssignment_n = Autothrust_P.athr_out_MATLABStruct;
  rtb_Gain2 = Autothrust_P.Gain2_Gain * Autothrust_U.in.data.Theta_deg;
  rtb_Gain3 = Autothrust_P.Gain3_Gain_c * Autothrust_U.in.data.Phi_deg;
  Theta_rad = 0.017453292519943295 * rtb_Gain2;
  Phi_rad = 0.017453292519943295 * rtb_Gain3;
  rtb_Saturation = std::sin(Theta_rad);
  Theta_rad = std::cos(Theta_rad);
  result_tmp = std::sin(Phi_rad);
  Phi_rad = std::cos(Phi_rad);
  result_tmp_0[0] = Theta_rad;
  result_tmp_0[3] = 0.0;
  result_tmp_0[6] = -rtb_Saturation;
  result_tmp_0[1] = result_tmp * rtb_Saturation;
  result_tmp_0[4] = Phi_rad;
  result_tmp_0[7] = Theta_rad * result_tmp;
  result_tmp_0[2] = Phi_rad * rtb_Saturation;
  result_tmp_0[5] = 0.0 - result_tmp;
  result_tmp_0[8] = Phi_rad * Theta_rad;
  for (i = 0; i < 3; i++) {
    result[i] = (result_tmp_0[i + 3] * Autothrust_U.in.data.by_m_s2 + result_tmp_0[i] * Autothrust_U.in.data.bx_m_s2) +
      result_tmp_0[i + 6] * Autothrust_U.in.data.bz_m_s2;
  }

  rtb_Saturation = Autothrust_P.Gain_Gain_d * Autothrust_U.in.data.gear_strut_compression_1 -
    Autothrust_P.Constant1_Value_l;
  if (rtb_Saturation > Autothrust_P.Saturation_UpperSat_p) {
    rtb_Saturation = Autothrust_P.Saturation_UpperSat_p;
  } else if (rtb_Saturation < Autothrust_P.Saturation_LowerSat_h) {
    rtb_Saturation = Autothrust_P.Saturation_LowerSat_h;
  }

  Phi_rad = Autothrust_P.Gain1_Gain_n * Autothrust_U.in.data.gear_strut_compression_2 - Autothrust_P.Constant1_Value_l;
  if (Phi_rad > Autothrust_P.Saturation1_UpperSat_g) {
    Phi_rad = Autothrust_P.Saturation1_UpperSat_g;
  } else if (Phi_rad < Autothrust_P.Saturation1_LowerSat_o) {
    Phi_rad = Autothrust_P.Saturation1_LowerSat_o;
  }

  if (Autothrust_DWork.is_active_c9_Autothrust == 0) {
    Autothrust_DWork.is_active_c9_Autothrust = 1U;
    Autothrust_DWork.is_c9_Autothrust = Autothrust_IN_OnGround;
    rtb_on_ground = 1;
  } else if (Autothrust_DWork.is_c9_Autothrust == Autothrust_IN_InAir) {
    if ((rtb_Saturation > 0.05) || (Phi_rad > 0.05)) {
      Autothrust_DWork.is_c9_Autothrust = Autothrust_IN_OnGround;
      rtb_on_ground = 1;
    } else {
      rtb_on_ground = 0;
    }
  } else if ((rtb_Saturation == 0.0) && (Phi_rad == 0.0)) {
    Autothrust_DWork.is_c9_Autothrust = Autothrust_IN_InAir;
    rtb_on_ground = 0;
  } else {
    rtb_on_ground = 1;
  }

  rtb_BusAssignment_n.data.commanded_engine_N1_2_percent = (Autothrust_U.in.data.engine_N1_2_percent +
    Autothrust_U.in.data.commanded_engine_N1_2_percent) - Autothrust_U.in.data.corrected_engine_N1_2_percent;
  rtb_BusAssignment_n.data.commanded_engine_N1_3_percent = (Autothrust_U.in.data.engine_N1_3_percent +
    Autothrust_U.in.data.commanded_engine_N1_3_percent) - Autothrust_U.in.data.corrected_engine_N1_3_percent;
  rtb_BusAssignment_n.data.commanded_engine_N1_4_percent = (Autothrust_U.in.data.engine_N1_4_percent +
    Autothrust_U.in.data.commanded_engine_N1_4_percent) - Autothrust_U.in.data.corrected_engine_N1_4_percent;
  rtb_BusAssignment_n.time = Autothrust_U.in.time;
  rtb_BusAssignment_n.data.nz_g = Autothrust_U.in.data.nz_g;
  rtb_BusAssignment_n.data.Theta_deg = rtb_Gain2;
  rtb_BusAssignment_n.data.Phi_deg = rtb_Gain3;
  rtb_BusAssignment_n.data.V_ias_kn = Autothrust_U.in.data.V_ias_kn;
  rtb_BusAssignment_n.data.V_tas_kn = Autothrust_U.in.data.V_tas_kn;
  rtb_BusAssignment_n.data.V_mach = Autothrust_U.in.data.V_mach;
  rtb_BusAssignment_n.data.V_gnd_kn = Autothrust_U.in.data.V_gnd_kn;
  rtb_BusAssignment_n.data.alpha_deg = Autothrust_U.in.data.alpha_deg;
  rtb_BusAssignment_n.data.H_ft = Autothrust_U.in.data.H_ft;
  rtb_BusAssignment_n.data.H_ind_ft = Autothrust_U.in.data.H_ind_ft;
  rtb_BusAssignment_n.data.H_radio_ft = Autothrust_U.in.data.H_radio_ft;
  rtb_BusAssignment_n.data.H_dot_fpm = Autothrust_U.in.data.H_dot_fpm;
  rtb_BusAssignment_n.data.ax_m_s2 = result[0];
  rtb_BusAssignment_n.data.ay_m_s2 = result[1];
  rtb_BusAssignment_n.data.az_m_s2 = result[2];
  rtb_BusAssignment_n.data.bx_m_s2 = Autothrust_U.in.data.bx_m_s2;
  rtb_BusAssignment_n.data.by_m_s2 = Autothrust_U.in.data.by_m_s2;
  rtb_BusAssignment_n.data.bz_m_s2 = Autothrust_U.in.data.bz_m_s2;
  rtb_BusAssignment_n.data.Psi_magnetic_deg = Autothrust_U.in.data.Psi_magnetic_deg;
  rtb_BusAssignment_n.data.Psi_magnetic_track_deg = Autothrust_U.in.data.Psi_magnetic_track_deg;
  rtb_BusAssignment_n.data.on_ground = (rtb_on_ground != 0);
  rtb_BusAssignment_n.data.flap_handle_index = Autothrust_U.in.data.flap_handle_index;
  rtb_BusAssignment_n.data.is_engine_operative_1 = Autothrust_U.in.data.is_engine_operative_1;
  rtb_BusAssignment_n.data.is_engine_operative_2 = Autothrust_U.in.data.is_engine_operative_2;
  rtb_BusAssignment_n.data.is_engine_operative_3 = Autothrust_U.in.data.is_engine_operative_4;
  rtb_BusAssignment_n.data.is_engine_operative_4 = Autothrust_U.in.data.is_engine_operative_3;
  rtb_BusAssignment_n.data.commanded_engine_N1_1_percent = (Autothrust_U.in.data.engine_N1_1_percent +
    Autothrust_U.in.data.commanded_engine_N1_1_percent) - Autothrust_U.in.data.corrected_engine_N1_1_percent;
  rtb_BusAssignment_n.data.engine_N1_1_percent = Autothrust_U.in.data.engine_N1_1_percent;
  rtb_BusAssignment_n.data.engine_N1_2_percent = Autothrust_U.in.data.engine_N1_2_percent;
  rtb_BusAssignment_n.data.engine_N1_3_percent = Autothrust_U.in.data.engine_N1_3_percent;
  rtb_BusAssignment_n.data.engine_N1_4_percent = Autothrust_U.in.data.engine_N1_4_percent;
  rtb_BusAssignment_n.data.TAT_degC = Autothrust_U.in.data.TAT_degC;
  rtb_BusAssignment_n.data.OAT_degC = Autothrust_U.in.data.OAT_degC;
  rtb_BusAssignment_n.data.ISA_degC = std::fmax(15.0 - 0.0019812 * Autothrust_U.in.data.H_ft, -56.5);
  rtb_BusAssignment_n.data.ambient_density_kg_per_m3 = Autothrust_U.in.data.ambient_density_kg_per_m3;
  rtb_BusAssignment_n.input = Autothrust_U.in.input;
  Autothrust_TimeSinceCondition(Autothrust_U.in.time.simulation_time, Autothrust_U.in.input.ATHR_disconnect, &rtb_y_a,
    &Autothrust_DWork.sf_TimeSinceCondition_o);
  Autothrust_DWork.Memory_PreviousInput = Autothrust_P.Logic_table[(((static_cast<uint32_T>(rtb_y_a >=
    Autothrust_P.CompareToConstant_const) << 1) + Autothrust_U.in.input.ATHR_reset_disable) << 1) +
    Autothrust_DWork.Memory_PreviousInput];
  condition_THR_LK_tmp = (Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2 &&
    Autothrust_U.in.data.is_engine_operative_4);
  if (condition_THR_LK_tmp && Autothrust_U.in.data.is_engine_operative_3) {
    rtb_out = ((Autothrust_U.in.input.TLA_1_deg >= 0.0) && (Autothrust_U.in.input.TLA_1_deg <= 25.0) &&
               (Autothrust_U.in.input.TLA_2_deg >= 0.0) && (Autothrust_U.in.input.TLA_2_deg <= 25.0) &&
               (Autothrust_U.in.input.TLA_3_deg >= 0.0) && (Autothrust_U.in.input.TLA_3_deg <= 25.0) &&
               (Autothrust_U.in.input.TLA_4_deg >= 0.0) && (Autothrust_U.in.input.TLA_4_deg <= 25.0));
  } else {
    rtb_out = ((Autothrust_U.in.data.is_engine_operative_1 && (Autothrust_U.in.input.TLA_1_deg >= 0.0) &&
                (Autothrust_U.in.input.TLA_1_deg <= 35.0)) || (Autothrust_U.in.data.is_engine_operative_2 &&
                (Autothrust_U.in.input.TLA_2_deg >= 0.0) && (Autothrust_U.in.input.TLA_2_deg <= 35.0)) ||
               (Autothrust_U.in.data.is_engine_operative_4 && (Autothrust_U.in.input.TLA_3_deg >= 0.0) &&
                (Autothrust_U.in.input.TLA_3_deg <= 35.0)) || (Autothrust_U.in.data.is_engine_operative_3 &&
                (Autothrust_U.in.input.TLA_4_deg >= 0.0) && (Autothrust_U.in.input.TLA_4_deg <= 35.0)));
  }

  rtb_NOT1_c = ((Autothrust_U.in.input.flex_temperature_degC > Autothrust_U.in.data.TAT_degC) &&
                (Autothrust_U.in.input.flex_temperature_degC != 0.0) && (Autothrust_U.in.input.flight_phase < 3.0) &&
                (rtb_on_ground != 0));
  Autothrust_DWork.latch = ((rtb_NOT1_c && (Autothrust_U.in.input.TLA_1_deg == 35.0) && (Autothrust_U.in.input.TLA_2_deg
    == 35.0) && (Autothrust_U.in.input.TLA_3_deg == 35.0) && (Autothrust_U.in.input.TLA_4_deg == 35.0)) ||
    Autothrust_DWork.latch);
  Autothrust_DWork.latch = (((!Autothrust_DWork.latch) || (((Autothrust_U.in.input.TLA_1_deg != 25.0) ||
    (Autothrust_U.in.input.TLA_2_deg != 25.0) || (Autothrust_U.in.input.TLA_3_deg != 25.0) ||
    (Autothrust_U.in.input.TLA_4_deg != 25.0)) && ((Autothrust_U.in.input.TLA_1_deg != 45.0) ||
    (Autothrust_U.in.input.TLA_2_deg != 45.0) || (Autothrust_U.in.input.TLA_3_deg != 45.0) ||
    (Autothrust_U.in.input.TLA_4_deg != 45.0)))) && Autothrust_DWork.latch);
  rtb_y_f = (rtb_NOT1_c || ((rtb_on_ground == 0) && Autothrust_DWork.latch));
  rtb_Compare = (static_cast<int32_T>(Autothrust_U.in.input.ATHR_push) > static_cast<int32_T>
                 (Autothrust_P.CompareToConstant_const_j));
  if (!Autothrust_DWork.eventTime_not_empty_d) {
    Autothrust_DWork.eventTime_l = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_d = true;
  }

  if ((Autothrust_U.in.input.ATHR_push != Autothrust_P.CompareToConstant1_const) || (Autothrust_DWork.eventTime_l == 0.0))
  {
    Autothrust_DWork.eventTime_l = Autothrust_U.in.time.simulation_time;
  }

  rtb_r_he = (Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime_l >=
              Autothrust_P.CompareToConstant2_const);
  Autothrust_DWork.Memory_PreviousInput_m = Autothrust_P.Logic_table_m[(((static_cast<uint32_T>
    (Autothrust_DWork.Delay_DSTATE_as) << 1) + rtb_r_he) << 1) + Autothrust_DWork.Memory_PreviousInput_m];
  rtb_BusAssignment_n.data_computed.ATHR_push = (rtb_Compare && (!Autothrust_DWork.Memory_PreviousInput_m));
  Autothrust_TimeSinceCondition(Autothrust_U.in.time.simulation_time, (rtb_on_ground != 0), &rtb_y_a,
    &Autothrust_DWork.sf_TimeSinceCondition1);
  if (!Autothrust_DWork.eventTime_not_empty_o) {
    Autothrust_DWork.eventTime_b = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_o = true;
  }

  tmp_0 = !Autothrust_U.in.input.is_TCAS_active;
  if (tmp_0 || (Autothrust_DWork.eventTime_b == 0.0)) {
    Autothrust_DWork.eventTime_b = Autothrust_U.in.time.simulation_time;
  }

  Autothrust_DWork.sInhibit = (((!Autothrust_DWork.prev_TCAS_active) && Autothrust_U.in.input.is_TCAS_active &&
    (Autothrust_U.in.input.TLA_1_deg <= 25.0) && (Autothrust_U.in.input.TLA_2_deg <= 25.0) &&
    (Autothrust_U.in.input.TLA_3_deg <= 25.0) && (Autothrust_U.in.input.TLA_4_deg <= 25.0)) || Autothrust_DWork.sInhibit);
  Autothrust_DWork.sInhibit = (((!Autothrust_DWork.sInhibit) || (Autothrust_U.in.time.simulation_time -
    Autothrust_DWork.eventTime_b <= 5.0) || ((Autothrust_U.in.input.TLA_1_deg >= 25.0) &&
    (Autothrust_U.in.input.TLA_2_deg >= 25.0) && (Autothrust_U.in.input.TLA_3_deg >= 25.0) &&
    (Autothrust_U.in.input.TLA_4_deg >= 25.0))) && Autothrust_DWork.sInhibit);
  Autothrust_DWork.sInhibit = (Autothrust_U.in.input.is_TCAS_active && Autothrust_DWork.sInhibit);
  Autothrust_DWork.prev_TCAS_active = Autothrust_U.in.input.is_TCAS_active;
  if (condition_THR_LK_tmp && Autothrust_U.in.data.is_engine_operative_3) {
    rtb_BusAssignment_n.data_computed.TLA_in_active_range = ((Autothrust_U.in.input.TLA_1_deg >= 0.0) &&
      (Autothrust_U.in.input.TLA_1_deg <= 25.0) && (Autothrust_U.in.input.TLA_2_deg >= 0.0) &&
      (Autothrust_U.in.input.TLA_2_deg <= 25.0) && (Autothrust_U.in.input.TLA_3_deg >= 0.0) &&
      (Autothrust_U.in.input.TLA_3_deg <= 25.0) && (Autothrust_U.in.input.TLA_4_deg >= 0.0) &&
      (Autothrust_U.in.input.TLA_4_deg <= 25.0));
  } else {
    rtb_BusAssignment_n.data_computed.TLA_in_active_range = ((Autothrust_U.in.data.is_engine_operative_1 &&
      (Autothrust_U.in.input.TLA_1_deg >= 0.0) && (Autothrust_U.in.input.TLA_1_deg <= 35.0)) ||
      (Autothrust_U.in.data.is_engine_operative_2 && (Autothrust_U.in.input.TLA_2_deg >= 0.0) &&
       (Autothrust_U.in.input.TLA_2_deg <= 35.0)) || (Autothrust_U.in.data.is_engine_operative_4 &&
      (Autothrust_U.in.input.TLA_3_deg >= 0.0) && (Autothrust_U.in.input.TLA_3_deg <= 35.0)) ||
      (Autothrust_U.in.data.is_engine_operative_3 && (Autothrust_U.in.input.TLA_4_deg >= 0.0) &&
       (Autothrust_U.in.input.TLA_4_deg <= 35.0)));
  }

  rtb_BusAssignment_n.data_computed.is_FLX_active = (rtb_NOT1_c || ((rtb_on_ground == 0) && Autothrust_DWork.latch));
  rtb_BusAssignment_n.data_computed.ATHR_disabled = Autothrust_DWork.Memory_PreviousInput;
  rtb_BusAssignment_n.data_computed.time_since_touchdown = rtb_y_a;
  rtb_BusAssignment_n.data_computed.alpha_floor_inhibited = Autothrust_DWork.sInhibit;
  Autothrust_TLAComputation1(&rtb_BusAssignment_n, Autothrust_U.in.input.TLA_1_deg, &rtb_Saturation, &rtb_r_h);
  Autothrust_TLAComputation1(&rtb_BusAssignment_n, Autothrust_U.in.input.TLA_2_deg, &Phi_rad, &rtb_r_he);
  Autothrust_TLAComputation1(&rtb_BusAssignment_n, Autothrust_U.in.input.TLA_3_deg, &Theta_rad,
    &Autothrust_DWork.Delay_DSTATE_as);
  Autothrust_TLAComputation1(&rtb_BusAssignment_n, Autothrust_U.in.input.TLA_4_deg, &result_tmp, &rtb_NOT1_c);
  condition_AP_FD_ATHR_Specific = !Autothrust_DWork.Memory_PreviousInput;
  condition_TOGA_latch_tmp = (Autothrust_U.in.input.is_SRS_TO_mode_active || Autothrust_U.in.input.is_SRS_GA_mode_active);
  Autothrust_DWork.condition_TOGA_latch = (((!Autothrust_DWork.prev_SRS_TO_GA_mode_active) && condition_TOGA_latch_tmp) ||
    Autothrust_DWork.condition_TOGA_latch);
  if (!Autothrust_DWork.eventTime_not_empty_l) {
    Autothrust_DWork.eventTime_c = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_l = true;
  }

  if ((!Autothrust_DWork.condition_TOGA_latch) || (Autothrust_DWork.eventTime_c == 0.0)) {
    Autothrust_DWork.eventTime_c = Autothrust_U.in.time.simulation_time;
  }

  if (Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime_c >= 0.3) {
    condition_TOGA = true;
    Autothrust_DWork.condition_TOGA_latch = false;
  } else {
    condition_TOGA = false;
  }

  rtb_r_g_tmp = !Autothrust_DWork.sInhibit;
  rtb_r_a = (rtb_r_g_tmp && Autothrust_U.in.input.alpha_floor_condition && (!Autothrust_DWork.prev_condition_AlphaFloor));
  if (!Autothrust_DWork.eventTime_not_empty_f) {
    Autothrust_DWork.eventTime_p = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_f = true;
  }

  if ((Autothrust_U.in.input.TLA_1_deg != 0.0) || (Autothrust_U.in.input.TLA_2_deg != 0.0) ||
      (Autothrust_U.in.input.TLA_3_deg != 0.0) || (Autothrust_U.in.input.TLA_4_deg != 0.0) ||
      (Autothrust_DWork.eventTime_p == 0.0)) {
    Autothrust_DWork.eventTime_p = Autothrust_U.in.time.simulation_time;
  }

  rtb_y_a = Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime_p;
  ATHR_ENGAGED_tmp = !Autothrust_DWork.ATHR_ENGAGED;
  ATHR_ENGAGED_tmp_0 = !Autothrust_U.in.input.ATHR_disconnect;
  Autothrust_DWork.ATHR_ENGAGED = ((condition_AP_FD_ATHR_Specific && (((rtb_on_ground == 0) && ATHR_ENGAGED_tmp &&
    rtb_BusAssignment_n.data_computed.ATHR_push) || condition_TOGA || rtb_r_a || (Autothrust_U.in.input.is_TCAS_active &&
    (!Autothrust_DWork.prev_condition_TCAS)))) || (condition_AP_FD_ATHR_Specific &&
    ((!rtb_BusAssignment_n.data_computed.ATHR_push) || ATHR_ENGAGED_tmp || Autothrust_U.in.input.is_LAND_mode_active) &&
    ATHR_ENGAGED_tmp_0 && ((rtb_y_a < 0.3) || (rtb_y_a >= 0.5)) && Autothrust_DWork.ATHR_ENGAGED));
  condition_AP_FD_ATHR_Specific = (Autothrust_DWork.ATHR_ENGAGED && (rtb_out || rtb_r_a));
  if (Autothrust_DWork.ATHR_ENGAGED && condition_AP_FD_ATHR_Specific) {
    status = athr_status::ENGAGED_ACTIVE;
  } else if (Autothrust_DWork.ATHR_ENGAGED && (!condition_AP_FD_ATHR_Specific)) {
    status = athr_status::ENGAGED_ARMED;
  } else {
    status = athr_status::DISENGAGED;
  }

  Autothrust_DWork.prev_condition_AlphaFloor = (Autothrust_U.in.input.alpha_floor_condition && rtb_r_g_tmp);
  Autothrust_DWork.prev_condition_TCAS = Autothrust_U.in.input.is_TCAS_active;
  Autothrust_DWork.prev_SRS_TO_GA_mode_active = condition_TOGA_latch_tmp;
  tmp[0] = Autothrust_U.in.input.TLA_1_deg;
  tmp[1] = Autothrust_U.in.input.TLA_2_deg;
  tmp[2] = Autothrust_U.in.input.TLA_3_deg;
  tmp[3] = Autothrust_U.in.input.TLA_4_deg;
  rtb_y_a = maximum_Abpa9SzA(tmp);
  ATHR_ENGAGED_tmp = !Autothrust_U.in.data.is_engine_operative_1;
  condition_AP_FD_ATHR_Specific_tmp = !Autothrust_U.in.data.is_engine_operative_2;
  condition_AP_FD_ATHR_Specific_tmp_0 = !Autothrust_U.in.data.is_engine_operative_4;
  condition_AP_FD_ATHR_Specific_tmp_1 = !Autothrust_U.in.data.is_engine_operative_3;
  rtb_r_g_tmp = (ATHR_ENGAGED_tmp || condition_AP_FD_ATHR_Specific_tmp || condition_AP_FD_ATHR_Specific_tmp_0 ||
                 condition_AP_FD_ATHR_Specific_tmp_1);
  condition_TOGA = (((Autothrust_U.in.data.is_engine_operative_1 && (Autothrust_U.in.input.TLA_1_deg == 35.0)) ||
                     (ATHR_ENGAGED_tmp && (Autothrust_U.in.input.TLA_1_deg <= 35.0))) &&
                    ((Autothrust_U.in.data.is_engine_operative_2 && (Autothrust_U.in.input.TLA_2_deg == 35.0)) ||
                     (condition_AP_FD_ATHR_Specific_tmp && (Autothrust_U.in.input.TLA_2_deg <= 35.0))) &&
                    ((Autothrust_U.in.data.is_engine_operative_4 && (Autothrust_U.in.input.TLA_3_deg == 35.0)) ||
                     (condition_AP_FD_ATHR_Specific_tmp_0 && (Autothrust_U.in.input.TLA_3_deg <= 35.0))) &&
                    ((Autothrust_U.in.data.is_engine_operative_3 && (Autothrust_U.in.input.TLA_4_deg == 35.0)) ||
                     (condition_AP_FD_ATHR_Specific_tmp_1 && (Autothrust_U.in.input.TLA_4_deg <= 35.0))));
  Autothrust_DWork.pConditionAlphaFloor = (Autothrust_DWork.prev_condition_AlphaFloor || ((status != athr_status::
    DISENGAGED) && Autothrust_DWork.pConditionAlphaFloor));
  if (status == athr_status::DISENGAGED) {
    Autothrust_DWork.pMode = athr_mode::NONE;
  } else if (Autothrust_DWork.prev_condition_AlphaFloor) {
    Autothrust_DWork.pMode = athr_mode::A_FLOOR;
  } else if (Autothrust_DWork.pConditionAlphaFloor) {
    Autothrust_DWork.pMode = athr_mode::TOGA_LK;
  } else if ((status == athr_status::ENGAGED_ARMED) && ((Autothrust_U.in.input.TLA_1_deg == 45.0) ||
              (Autothrust_U.in.input.TLA_2_deg == 45.0) || (Autothrust_U.in.input.TLA_3_deg == 45.0) ||
              (Autothrust_U.in.input.TLA_4_deg == 45.0))) {
    Autothrust_DWork.pMode = athr_mode::MAN_TOGA;
  } else if ((status == athr_status::ENGAGED_ARMED) && rtb_y_f && (rtb_y_a == 35.0)) {
    Autothrust_DWork.pMode = athr_mode::MAN_FLEX;
  } else if ((status == athr_status::ENGAGED_ARMED) && ((Autothrust_U.in.input.TLA_1_deg == 35.0) ||
              (Autothrust_U.in.input.TLA_2_deg == 35.0) || (Autothrust_U.in.input.TLA_3_deg == 35.0) ||
              (Autothrust_U.in.input.TLA_4_deg == 35.0))) {
    Autothrust_DWork.pMode = athr_mode::MAN_MCT;
  } else if ((status == athr_status::ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 3.0) && rtb_r_g_tmp &&
             condition_TOGA) {
    Autothrust_DWork.pMode = athr_mode::THR_MCT;
  } else if ((status == athr_status::ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 3.0) &&
             Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2 &&
             Autothrust_U.in.data.is_engine_operative_4 && Autothrust_U.in.data.is_engine_operative_3 && (rtb_y_a ==
              25.0)) {
    Autothrust_DWork.pMode = athr_mode::THR_CLB;
  } else {
    condition_AP_FD_ATHR_Specific = (Autothrust_U.in.data.is_engine_operative_1 &&
      Autothrust_U.in.data.is_engine_operative_2 && Autothrust_U.in.data.is_engine_operative_4 &&
      Autothrust_U.in.data.is_engine_operative_3);
    if ((status == athr_status::ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 3.0) &&
        ((condition_AP_FD_ATHR_Specific && (Autothrust_U.in.input.TLA_1_deg < 25.0) && (Autothrust_U.in.input.TLA_2_deg <
           25.0) && (Autothrust_U.in.input.TLA_3_deg < 25.0) && (Autothrust_U.in.input.TLA_4_deg < 25.0)) ||
         (rtb_r_g_tmp && (Autothrust_U.in.data.is_engine_operative_1 && (Autothrust_U.in.input.TLA_1_deg < 35.0) &&
                          Autothrust_U.in.data.is_engine_operative_2 && (Autothrust_U.in.input.TLA_2_deg < 35.0) &&
                          Autothrust_U.in.data.is_engine_operative_4 && (Autothrust_U.in.input.TLA_3_deg < 35.0) &&
                          Autothrust_U.in.data.is_engine_operative_3 && (Autothrust_U.in.input.TLA_4_deg < 35.0))))) {
      Autothrust_DWork.pMode = athr_mode::THR_LVR;
    } else if ((status == athr_status::ENGAGED_ARMED) && ((condition_AP_FD_ATHR_Specific && (rtb_y_a > 25.0) && (rtb_y_a
      < 35.0)) || ((rtb_y_a > 35.0) && (rtb_y_a < 45.0)))) {
      Autothrust_DWork.pMode = athr_mode::MAN_THR;
    } else if ((status == athr_status::ENGAGED_ACTIVE) && ((Autothrust_U.in.input.mode_requested == 2.0) ||
                (Autothrust_U.in.input.mode_requested == 4.0))) {
      Autothrust_DWork.pMode = athr_mode::THR_IDLE;
    } else if ((status == athr_status::ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 1.0) &&
               (!Autothrust_U.in.input.is_mach_mode_active)) {
      Autothrust_DWork.pMode = athr_mode::SPEED;
    } else if ((status == athr_status::ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 1.0) &&
               Autothrust_U.in.input.is_mach_mode_active) {
      Autothrust_DWork.pMode = athr_mode::MACH;
    }
  }

  if (Autothrust_timeSinceConditionArmedActive(Autothrust_U.in.time.simulation_time, status) >= 0.1) {
    mode = Autothrust_DWork.pMode;
  } else {
    mode = athr_mode::NONE;
  }

  Autothrust_DWork.inhibitAboveThrustReductionAltitude = ((Autothrust_U.in.input.is_SRS_TO_mode_active &&
    (!Autothrust_DWork.was_SRS_TO_active) && (Autothrust_U.in.data.H_ind_ft >
    Autothrust_U.in.input.thrust_reduction_altitude)) || (Autothrust_U.in.input.is_SRS_GA_mode_active &&
    (!Autothrust_DWork.was_SRS_GA_active) && (Autothrust_U.in.data.H_ind_ft >
    Autothrust_U.in.input.thrust_reduction_altitude_go_around)) || (condition_TOGA_latch_tmp &&
    Autothrust_DWork.inhibitAboveThrustReductionAltitude));
  condition_THR_LK_tmp = (condition_THR_LK_tmp && Autothrust_U.in.data.is_engine_operative_3);
  Autothrust_DWork.condition_THR_LK = (((status == athr_status::DISENGAGED) && (Autothrust_DWork.pStatus != athr_status::
    DISENGAGED) && ATHR_ENGAGED_tmp_0 && ((condition_THR_LK_tmp && (Autothrust_U.in.input.TLA_1_deg == 25.0) &&
    (Autothrust_U.in.input.TLA_2_deg == 25.0) && (Autothrust_U.in.input.TLA_3_deg == 25.0) &&
    (Autothrust_U.in.input.TLA_4_deg == 25.0)) || (rtb_r_g_tmp && condition_TOGA))) ||
    (((!Autothrust_DWork.condition_THR_LK) || ((status == athr_status::DISENGAGED) && ((Autothrust_U.in.input.TLA_1_deg ==
    25.0) || (Autothrust_U.in.input.TLA_2_deg == 25.0) || (Autothrust_U.in.input.TLA_3_deg == 25.0) ||
    (Autothrust_U.in.input.TLA_4_deg == 25.0) || (Autothrust_U.in.input.TLA_1_deg == 35.0) ||
    (Autothrust_U.in.input.TLA_2_deg == 35.0) || (Autothrust_U.in.input.TLA_3_deg == 35.0) ||
    (Autothrust_U.in.input.TLA_4_deg == 35.0)))) && Autothrust_DWork.condition_THR_LK));
  Autothrust_DWork.pStatus = status;
  Autothrust_DWork.was_SRS_TO_active = Autothrust_U.in.input.is_SRS_TO_mode_active;
  Autothrust_DWork.was_SRS_GA_active = Autothrust_U.in.input.is_SRS_GA_mode_active;
  rtb_y_a = Autothrust_U.in.input.TLA_1_deg;
  if (Autothrust_U.in.input.TLA_1_deg < Autothrust_U.in.input.TLA_2_deg) {
    rtb_y_a = Autothrust_U.in.input.TLA_2_deg;
  }

  if (rtb_y_a < Autothrust_U.in.input.TLA_3_deg) {
    rtb_y_a = Autothrust_U.in.input.TLA_3_deg;
  }

  if (rtb_y_a < Autothrust_U.in.input.TLA_4_deg) {
    rtb_y_a = Autothrust_U.in.input.TLA_4_deg;
  }

  if (rtb_on_ground == 0) {
    rtb_y_a = std::fmax(0.0, rtb_y_a);
  }

  if ((rtb_on_ground == 0) || (ATHR_ENGAGED_tmp && condition_AP_FD_ATHR_Specific_tmp &&
       condition_AP_FD_ATHR_Specific_tmp_0 && condition_AP_FD_ATHR_Specific_tmp_1)) {
    if ((mode == athr_mode::A_FLOOR) || (mode == athr_mode::TOGA_LK)) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::TOGA;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_TOGA_percent;
    } else if (rtb_y_a > 35.0) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::TOGA;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_TOGA_percent;
    } else if (rtb_y_a > 25.0) {
      if (!rtb_y_f) {
        Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::MCT;
        Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_MCT_percent;
      } else {
        Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::FLEX;
        Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_FLEX_percent;
      }
    } else if (rtb_y_a >= 0.0) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::CLB;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_CLB_percent;
    } else if (rtb_y_a < 0.0) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::REVERSE;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_REV_percent;
    } else {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::NONE;
      Autothrust_Y.out.output.thrust_limit_percent = 0.0;
    }
  } else if (rtb_y_a >= 0.0) {
    if ((!rtb_y_f) || (rtb_y_a > 35.0)) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::TOGA;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_TOGA_percent;
    } else {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::FLEX;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_FLEX_percent;
    }
  } else if (rtb_y_a < 0.0) {
    Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::REVERSE;
    Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_REV_percent;
  } else {
    Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type::NONE;
    Autothrust_Y.out.output.thrust_limit_percent = 0.0;
  }

  if (!Autothrust_DWork.eventTime_not_empty) {
    Autothrust_DWork.eventTime = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty = true;
  }

  if (((Autothrust_U.in.input.TLA_1_deg != 35.0) && (Autothrust_U.in.input.TLA_2_deg != 35.0) &&
       (Autothrust_U.in.input.TLA_3_deg != 35.0) && (Autothrust_U.in.input.TLA_4_deg != 35.0)) ||
      (Autothrust_DWork.eventTime == 0.0)) {
    Autothrust_DWork.eventTime = Autothrust_U.in.time.simulation_time;
  }

  if (!Autothrust_DWork.eventTime_not_empty_g) {
    Autothrust_DWork.eventTime_j = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_g = true;
  }

  if ((((Autothrust_U.in.input.TLA_1_deg < 25.0) || (Autothrust_U.in.input.TLA_1_deg >= 35.0)) &&
       ((Autothrust_U.in.input.TLA_2_deg < 25.0) || (Autothrust_U.in.input.TLA_2_deg >= 35.0)) &&
       ((Autothrust_U.in.input.TLA_3_deg < 25.0) || (Autothrust_U.in.input.TLA_3_deg >= 35.0)) &&
       ((Autothrust_U.in.input.TLA_4_deg < 25.0) || (Autothrust_U.in.input.TLA_4_deg >= 35.0))) ||
      (Autothrust_DWork.eventTime_j == 0.0)) {
    Autothrust_DWork.eventTime_j = Autothrust_U.in.time.simulation_time;
  }

  condition_AP_FD_ATHR_Specific = (Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime_j >= 4.0);
  Autothrust_Y.out.output.N1_TLA_1_percent = rtb_Saturation;
  condition_TOGA = rtb_r_he;
  rtb_r_he = ((status == athr_status::ENGAGED_ACTIVE) && (((Autothrust_U.in.input.TLA_1_deg <= 35.0) &&
    (Autothrust_U.in.input.TLA_2_deg <= 35.0) && (Autothrust_U.in.input.TLA_3_deg <= 35.0) &&
    (Autothrust_U.in.input.TLA_4_deg <= 35.0)) || Autothrust_U.in.input.alpha_floor_condition));
  rtb_r_a = !rtb_r_he;
  Autothrust_DWork.pThrustMemoActive = ((((Autothrust_U.in.input.ATHR_push && (status != athr_status::DISENGAGED)) ||
    (rtb_r_a && Autothrust_DWork.pUseAutoThrustControl && ATHR_ENGAGED_tmp_0)) && ((condition_THR_LK_tmp &&
    (Autothrust_U.in.input.TLA_1_deg == 25.0) && (Autothrust_U.in.input.TLA_2_deg == 25.0) &&
    (Autothrust_U.in.input.TLA_3_deg == 25.0) && (Autothrust_U.in.input.TLA_4_deg == 25.0)) || (rtb_r_g_tmp &&
    (((Autothrust_U.in.data.is_engine_operative_1 && (Autothrust_U.in.input.TLA_1_deg == 35.0)) || (ATHR_ENGAGED_tmp &&
    (Autothrust_U.in.input.TLA_1_deg <= 35.0))) && ((Autothrust_U.in.data.is_engine_operative_2 &&
    (Autothrust_U.in.input.TLA_2_deg == 35.0)) || (condition_AP_FD_ATHR_Specific_tmp && (Autothrust_U.in.input.TLA_2_deg
    <= 35.0))) && ((Autothrust_U.in.data.is_engine_operative_4 && (Autothrust_U.in.input.TLA_3_deg == 35.0)) ||
                   (condition_AP_FD_ATHR_Specific_tmp_0 && (Autothrust_U.in.input.TLA_3_deg <= 35.0))) &&
     ((Autothrust_U.in.data.is_engine_operative_3 && (Autothrust_U.in.input.TLA_4_deg == 35.0)) ||
      (condition_AP_FD_ATHR_Specific_tmp_1 && (Autothrust_U.in.input.TLA_4_deg <= 35.0))))))) || (rtb_r_a &&
    ((Autothrust_U.in.input.TLA_1_deg == 25.0) || (Autothrust_U.in.input.TLA_1_deg == 35.0) ||
     (Autothrust_U.in.input.TLA_2_deg == 25.0) || (Autothrust_U.in.input.TLA_2_deg == 35.0) ||
     (Autothrust_U.in.input.TLA_3_deg == 25.0) || (Autothrust_U.in.input.TLA_3_deg == 35.0) ||
     (Autothrust_U.in.input.TLA_4_deg == 25.0) || (Autothrust_U.in.input.TLA_4_deg == 35.0)) &&
    Autothrust_DWork.pThrustMemoActive));
  Autothrust_DWork.pUseAutoThrustControl = rtb_r_he;
  if (Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2 &&
      Autothrust_U.in.data.is_engine_operative_4 && Autothrust_U.in.data.is_engine_operative_3) {
    rtb_Switch_dx = Autothrust_U.in.input.thrust_limit_CLB_percent;
  } else {
    rtb_Switch_dx = Autothrust_U.in.input.thrust_limit_MCT_percent;
  }

  result[0] = Autothrust_U.in.input.V_LS_kn;
  result[1] = Autothrust_U.in.input.V_c_kn;
  result[2] = Autothrust_U.in.input.V_MAX_kn;
  if (Autothrust_U.in.input.V_LS_kn < Autothrust_U.in.input.V_c_kn) {
    if (Autothrust_U.in.input.V_c_kn < Autothrust_U.in.input.V_MAX_kn) {
      i = 1;
    } else if (Autothrust_U.in.input.V_LS_kn < Autothrust_U.in.input.V_MAX_kn) {
      i = 2;
    } else {
      i = 0;
    }
  } else if (Autothrust_U.in.input.V_LS_kn < Autothrust_U.in.input.V_MAX_kn) {
    i = 0;
  } else if (Autothrust_U.in.input.V_c_kn < Autothrust_U.in.input.V_MAX_kn) {
    i = 2;
  } else {
    i = 1;
  }

  rtb_Switch_d = result[i] - Autothrust_U.in.data.V_ias_kn;
  rtb_Switch_ej = Autothrust_P.Gain1_Gain_ot * rtb_Gain3;
  if (Autothrust_U.in.data.ambient_density_kg_per_m3 > Autothrust_P.Saturation2_UpperSat) {
    rtb_Switch_f_idx_2 = Autothrust_P.Saturation2_UpperSat;
  } else if (Autothrust_U.in.data.ambient_density_kg_per_m3 < Autothrust_P.Saturation2_LowerSat) {
    rtb_Switch_f_idx_2 = Autothrust_P.Saturation2_LowerSat;
  } else {
    rtb_Switch_f_idx_2 = Autothrust_U.in.data.ambient_density_kg_per_m3;
  }

  if (Autothrust_U.in.data.V_gnd_kn > Autothrust_P.Saturation_UpperSat_f) {
    rtb_y_p = Autothrust_P.Saturation_UpperSat_f;
  } else if (Autothrust_U.in.data.V_gnd_kn < Autothrust_P.Saturation_LowerSat_ev) {
    rtb_y_p = Autothrust_P.Saturation_LowerSat_ev;
  } else {
    rtb_y_p = Autothrust_U.in.data.V_gnd_kn;
  }

  Autothrust_WashoutFilter(Autothrust_P._Gain * (1.0 / std::sqrt(rtb_Switch_f_idx_2) * (Autothrust_P.GStoGS_CAS_Gain *
    (Autothrust_P.ktstomps_Gain * rtb_y_p))), Autothrust_P.WashoutFilter_C1, Autothrust_U.in.time.dt, &rtb_y_a,
    &Autothrust_DWork.sf_WashoutFilter);
  rtb_Gain_m = Autothrust_P.kntoms_Gain * Autothrust_U.in.data.V_gnd_kn;
  if (rtb_Gain_m > Autothrust_P.Saturation_UpperSat_d) {
    rtb_Gain_m = Autothrust_P.Saturation_UpperSat_d;
  } else if (rtb_Gain_m < Autothrust_P.Saturation_LowerSat_e) {
    rtb_Gain_m = Autothrust_P.Saturation_LowerSat_e;
  }

  Autothrust_LeadLagFilter(rtb_y_a - Autothrust_P.g_Gain * (Autothrust_P.Gain1_Gain_c * (Autothrust_P.Gain_Gain_j *
    ((Autothrust_P.Gain1_Gain_n0 * rtb_Gain2 - Autothrust_P.Gain1_Gain_j * (Autothrust_P.Gain_Gain_c * std::atan
    (Autothrust_P.fpmtoms_Gain * Autothrust_U.in.data.H_dot_fpm / rtb_Gain_m))) * (Autothrust_P.Constant_Value - std::
    cos(rtb_Switch_ej)) + std::sin(rtb_Switch_ej) * std::sin(Autothrust_P.Gain1_Gain_d *
    Autothrust_U.in.data.Psi_magnetic_track_deg - Autothrust_P.Gain1_Gain_f * Autothrust_U.in.data.Psi_magnetic_deg)))),
    Autothrust_P.HighPassFilter_C1, Autothrust_P.HighPassFilter_C2, Autothrust_P.HighPassFilter_C3,
    Autothrust_P.HighPassFilter_C4, Autothrust_U.in.time.dt, &rtb_y_p, &Autothrust_DWork.sf_LeadLagFilter);
  if (Autothrust_U.in.data.V_ias_kn > Autothrust_P.Saturation1_UpperSat_c) {
    rtb_Switch_f_idx_2 = Autothrust_P.Saturation1_UpperSat_c;
  } else if (Autothrust_U.in.data.V_ias_kn < Autothrust_P.Saturation1_LowerSat_g) {
    rtb_Switch_f_idx_2 = Autothrust_P.Saturation1_LowerSat_g;
  } else {
    rtb_Switch_f_idx_2 = Autothrust_U.in.data.V_ias_kn;
  }

  Autothrust_LeadLagFilter(Autothrust_P.ktstomps_Gain_h * rtb_Switch_f_idx_2, Autothrust_P.LowPassFilter_C1,
    Autothrust_P.LowPassFilter_C2, Autothrust_P.LowPassFilter_C3, Autothrust_P.LowPassFilter_C4, Autothrust_U.in.time.dt,
    &rtb_y_a, &Autothrust_DWork.sf_LeadLagFilter_h);
  rtb_Switch_ej = (rtb_y_p + rtb_y_a) * Autothrust_P.mpstokts_Gain * Autothrust_P.Gain4_Gain * look1_binlxpw
    (rtb_Switch_d, Autothrust_P.ScheduledGain1_BreakpointsForDimension1, Autothrust_P.ScheduledGain1_Table, 4U) +
    rtb_Switch_d;
  rtb_Gain_m = Autothrust_P.DiscreteDerivativeVariableTs_Gain * rtb_Switch_ej;
  Autothrust_LagFilter(Autothrust_P.Gain5_Gain * ((rtb_Gain_m - Autothrust_DWork.Delay_DSTATE) / Autothrust_U.in.time.dt),
                       Autothrust_P.LagFilter_C1, Autothrust_U.in.time.dt, &rtb_Switch_d, &Autothrust_DWork.sf_LagFilter);
  Autothrust_LagFilter(Autothrust_U.in.data.nz_g, Autothrust_P.LagFilter1_C1, Autothrust_U.in.time.dt, &rtb_y_p,
                       &Autothrust_DWork.sf_LagFilter_a);
  rtb_Gain2 = rtb_y_p - std::cos(Autothrust_P.Gain1_Gain_p1 * rtb_Gain2) / std::cos(Autothrust_P.Gain1_Gain_di *
    rtb_Gain3);
  Autothrust_WashoutFilter(Autothrust_P.Gain2_Gain_c * rtb_Gain2, Autothrust_P.WashoutFilter_C1_c,
    Autothrust_U.in.time.dt, &rtb_y_a, &Autothrust_DWork.sf_WashoutFilter_h);
  if (!Autothrust_DWork.pY_not_empty) {
    Autothrust_DWork.pY = Autothrust_P.RateLimiterVariableTs_InitialCondition;
    Autothrust_DWork.pY_not_empty = true;
  }

  Autothrust_DWork.pY += std::fmax(std::fmin(static_cast<real_T>(Autothrust_U.in.input.is_alt_soft_mode_active) -
    Autothrust_DWork.pY, std::abs(Autothrust_P.RateLimiterVariableTs_up) * Autothrust_U.in.time.dt), -std::abs
    (Autothrust_P.RateLimiterVariableTs_lo) * Autothrust_U.in.time.dt);
  if (Autothrust_U.in.input.mode_requested > Autothrust_P.Saturation_UpperSat_l) {
    rtb_Switch_f_idx_2 = Autothrust_P.Saturation_UpperSat_l;
  } else if (Autothrust_U.in.input.mode_requested < Autothrust_P.Saturation_LowerSat_i) {
    rtb_Switch_f_idx_2 = Autothrust_P.Saturation_LowerSat_i;
  } else {
    rtb_Switch_f_idx_2 = Autothrust_U.in.input.mode_requested;
  }

  switch (static_cast<int32_T>(rtb_Switch_f_idx_2)) {
   case 0:
    rtb_Switch_ej = Autothrust_P.Constant1_Value;
    break;

   case 1:
    rtb_Switch_ej = ((Autothrust_P.Gain_Gain * rtb_Switch_ej + rtb_Switch_d) + (Autothrust_P.Gain1_Gain * rtb_Gain2 +
      Autothrust_P.Gain3_Gain * rtb_y_a)) * look1_binlxpw(std::fmin(std::fmin(std::fmin
      (rtb_BusAssignment_n.data.commanded_engine_N1_1_percent, rtb_BusAssignment_n.data.commanded_engine_N1_2_percent),
      rtb_BusAssignment_n.data.commanded_engine_N1_3_percent), rtb_BusAssignment_n.data.commanded_engine_N1_4_percent),
      Autothrust_P.ScheduledGain2_BreakpointsForDimension1, Autothrust_P.ScheduledGain2_Table, 3U) * look1_binlxpw
      (Autothrust_DWork.pY, Autothrust_P.ScheduledGain4_BreakpointsForDimension1, Autothrust_P.ScheduledGain4_Table, 1U);
    if (rtb_Switch_ej > Autothrust_P.Saturation1_UpperSat) {
      rtb_Switch_ej = Autothrust_P.Saturation1_UpperSat;
    } else if (rtb_Switch_ej < Autothrust_P.Saturation1_LowerSat) {
      rtb_Switch_ej = Autothrust_P.Saturation1_LowerSat;
    }
    break;

   case 2:
    rtb_Switch_ej = Autothrust_P.Gain1_Gain_p * look1_binlxpw(std::fmin(std::fmin(std::fmin
      (rtb_BusAssignment_n.data.commanded_engine_N1_1_percent, rtb_BusAssignment_n.data.commanded_engine_N1_2_percent),
      rtb_BusAssignment_n.data.commanded_engine_N1_3_percent), rtb_BusAssignment_n.data.commanded_engine_N1_4_percent),
      Autothrust_P.uDLookupTable_bp01Data, Autothrust_P.uDLookupTable_tableData, 6U);
    if (rtb_Switch_ej > Autothrust_P.Saturation_UpperSat) {
      rtb_Switch_ej = Autothrust_P.Saturation_UpperSat;
    } else if (rtb_Switch_ej < Autothrust_P.Saturation_LowerSat) {
      rtb_Switch_ej = Autothrust_P.Saturation_LowerSat;
    }
    break;

   case 3:
    rtb_Switch_ej = Autothrust_P.Gain1_Gain_o * look1_binlxpw(std::fmin(std::fmin(std::fmin
      (rtb_BusAssignment_n.data.commanded_engine_N1_1_percent, rtb_BusAssignment_n.data.commanded_engine_N1_2_percent),
      rtb_BusAssignment_n.data.commanded_engine_N1_3_percent), rtb_BusAssignment_n.data.commanded_engine_N1_4_percent),
      Autothrust_P.uDLookupTable_bp01Data_b, Autothrust_P.uDLookupTable_tableData_o, 6U);
    if (rtb_Switch_ej > Autothrust_P.Saturation_UpperSat_a) {
      rtb_Switch_ej = Autothrust_P.Saturation_UpperSat_a;
    } else if (rtb_Switch_ej < Autothrust_P.Saturation_LowerSat_a) {
      rtb_Switch_ej = Autothrust_P.Saturation_LowerSat_a;
    }
    break;

   default:
    rtb_Switch_ej = Autothrust_P.RETARD_Value;
    break;
  }

  rtb_Switch_ej = Autothrust_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_Switch_ej * Autothrust_U.in.time.dt;
  rtb_r_a = (mode == Autothrust_P.CompareToConstant2_const_c);
  rtb_r_he = (mode == Autothrust_P.CompareToConstant3_const_k);
  Autothrust_DWork.icLoad = ((status != Autothrust_P.CompareToConstant_const_d) || (rtb_r_a || rtb_r_he) ||
    Autothrust_DWork.icLoad);
  if (Autothrust_DWork.icLoad) {
    Autothrust_DWork.Delay_DSTATE_k = std::fmax(std::fmax(std::fmax
      (rtb_BusAssignment_n.data.commanded_engine_N1_1_percent, rtb_BusAssignment_n.data.commanded_engine_N1_2_percent),
      rtb_BusAssignment_n.data.commanded_engine_N1_3_percent), rtb_BusAssignment_n.data.commanded_engine_N1_4_percent) -
      rtb_Switch_ej;
  }

  Autothrust_DWork.Delay_DSTATE_k += rtb_Switch_ej;
  if (Autothrust_DWork.Delay_DSTATE_k > rtb_Switch_dx) {
    Autothrust_DWork.Delay_DSTATE_k = rtb_Switch_dx;
  } else if (Autothrust_DWork.Delay_DSTATE_k < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
    Autothrust_DWork.Delay_DSTATE_k = Autothrust_U.in.input.thrust_limit_IDLE_percent;
  }

  if (Autothrust_DWork.pUseAutoThrustControl) {
    if ((mode == Autothrust_P.CompareToConstant2_const_h) || (mode == Autothrust_P.CompareToConstant3_const)) {
      if (Autothrust_U.in.input.thrust_limit_TOGA_percent < rtb_Saturation) {
        rtb_Gain2 = rtb_Saturation;
      } else {
        rtb_Gain2 = Autothrust_U.in.input.thrust_limit_TOGA_percent;
      }

      if (Autothrust_U.in.input.thrust_limit_TOGA_percent < Phi_rad) {
        rtb_Gain3 = Phi_rad;
      } else {
        rtb_Gain3 = Autothrust_U.in.input.thrust_limit_TOGA_percent;
      }

      if (Autothrust_U.in.input.thrust_limit_TOGA_percent < Theta_rad) {
        rtb_Switch_f_idx_2 = Theta_rad;
      } else {
        rtb_Switch_f_idx_2 = Autothrust_U.in.input.thrust_limit_TOGA_percent;
      }

      if (Autothrust_U.in.input.thrust_limit_TOGA_percent < result_tmp) {
        rtb_Switch_f_idx_3 = result_tmp;
      } else {
        rtb_Switch_f_idx_3 = Autothrust_U.in.input.thrust_limit_TOGA_percent;
      }
    } else {
      if (Autothrust_DWork.Delay_DSTATE_k > rtb_Saturation) {
        rtb_Gain2 = rtb_Saturation;
      } else if (Autothrust_DWork.Delay_DSTATE_k < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
        rtb_Gain2 = Autothrust_U.in.input.thrust_limit_IDLE_percent;
      } else {
        rtb_Gain2 = Autothrust_DWork.Delay_DSTATE_k;
      }

      if (Autothrust_DWork.Delay_DSTATE_k > Phi_rad) {
        rtb_Gain3 = Phi_rad;
      } else if (Autothrust_DWork.Delay_DSTATE_k < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
        rtb_Gain3 = Autothrust_U.in.input.thrust_limit_IDLE_percent;
      } else {
        rtb_Gain3 = Autothrust_DWork.Delay_DSTATE_k;
      }

      if (Autothrust_DWork.Delay_DSTATE_k > Theta_rad) {
        rtb_Switch_f_idx_2 = Theta_rad;
      } else if (Autothrust_DWork.Delay_DSTATE_k < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
        rtb_Switch_f_idx_2 = Autothrust_U.in.input.thrust_limit_IDLE_percent;
      } else {
        rtb_Switch_f_idx_2 = Autothrust_DWork.Delay_DSTATE_k;
      }

      if (Autothrust_DWork.Delay_DSTATE_k > result_tmp) {
        rtb_Switch_f_idx_3 = result_tmp;
      } else if (Autothrust_DWork.Delay_DSTATE_k < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
        rtb_Switch_f_idx_3 = Autothrust_U.in.input.thrust_limit_IDLE_percent;
      } else {
        rtb_Switch_f_idx_3 = Autothrust_DWork.Delay_DSTATE_k;
      }
    }
  } else if (Autothrust_DWork.pThrustMemoActive) {
    rtb_Gain2 = rtb_BusAssignment_n.data.commanded_engine_N1_1_percent;
    rtb_Gain3 = rtb_BusAssignment_n.data.commanded_engine_N1_2_percent;
    rtb_Switch_f_idx_2 = rtb_BusAssignment_n.data.commanded_engine_N1_3_percent;
    rtb_Switch_f_idx_3 = rtb_BusAssignment_n.data.commanded_engine_N1_4_percent;
  } else {
    rtb_Gain2 = rtb_Saturation;
    rtb_Gain3 = Phi_rad;
    rtb_Switch_f_idx_2 = Theta_rad;
    rtb_Switch_f_idx_3 = result_tmp;
  }

  Autothrust_Y.out.output.is_in_reverse_1 = rtb_r_h;
  Autothrust_MATLABFunction(rtb_Gain2 - Autothrust_U.in.data.engine_N1_1_percent, &rtb_y_a, &rtb_r_he);
  if (rtb_r_he) {
    Autothrust_DWork.Delay_DSTATE_e = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  Autothrust_DWork.Delay_DSTATE_e += Autothrust_P.Gain_Gain_l * rtb_y_a *
    Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_e > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    Autothrust_DWork.Delay_DSTATE_e = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (Autothrust_DWork.Delay_DSTATE_e < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    Autothrust_DWork.Delay_DSTATE_e = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  rtb_Switch_ej = (rtb_Gain2 + Autothrust_DWork.Delay_DSTATE_e) - rtb_BusAssignment_n.data.commanded_engine_N1_1_percent;
  if (rtb_r_h) {
    Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  }

  Autothrust_DWork.Delay_DSTATE_n += Autothrust_P.Gain_Gain_d3 * rtb_Switch_ej *
    Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_l * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_n > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l) {
    Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_l;
  } else if (Autothrust_DWork.Delay_DSTATE_n < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d) {
    Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_d;
  }

  rtb_r_he = !rtb_r_h;
  if (rtb_r_he) {
    Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
  }

  Autothrust_DWork.Delay_DSTATE_l += Autothrust_P.Gain1_Gain_h * rtb_Switch_ej *
    Autothrust_P.DiscreteTimeIntegratorVariableTs1_Gain * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_l > Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit) {
    Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit;
  } else if (Autothrust_DWork.Delay_DSTATE_l < Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit) {
    Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit;
  }

  if (rtb_r_he) {
    Autothrust_Y.out.output.sim_throttle_lever_1_pos = Autothrust_DWork.Delay_DSTATE_n;
  } else {
    Autothrust_Y.out.output.sim_throttle_lever_1_pos = Autothrust_DWork.Delay_DSTATE_l;
  }

  Autothrust_ThrustMode1(Autothrust_U.in.input.TLA_1_deg, &rtb_y_a);
  Autothrust_MATLABFunction(rtb_Gain3 - Autothrust_U.in.data.engine_N1_2_percent, &rtb_y_p, &rtb_r_he);
  if (rtb_r_he) {
    Autothrust_DWork.Delay_DSTATE_a = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_f;
  }

  Autothrust_DWork.Delay_DSTATE_a += Autothrust_P.Gain_Gain_f * rtb_y_p *
    Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_b * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_a > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_m) {
    Autothrust_DWork.Delay_DSTATE_a = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_m;
  } else if (Autothrust_DWork.Delay_DSTATE_a < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_i) {
    Autothrust_DWork.Delay_DSTATE_a = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_i;
  }

  rtb_Switch_dx = (rtb_Gain3 + Autothrust_DWork.Delay_DSTATE_a) - rtb_BusAssignment_n.data.commanded_engine_N1_2_percent;
  if (condition_TOGA) {
    Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_n;
  }

  Autothrust_DWork.Delay_DSTATE_lz += Autothrust_P.Gain_Gain_b * rtb_Switch_dx *
    Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_k * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_lz > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_p) {
    Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_p;
  } else if (Autothrust_DWork.Delay_DSTATE_lz < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_e) {
    Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_e;
  }

  rtb_r_he = !condition_TOGA;
  if (rtb_r_he) {
    Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_e;
  }

  Autothrust_DWork.Delay_DSTATE_h += Autothrust_P.Gain1_Gain_g * rtb_Switch_dx *
    Autothrust_P.DiscreteTimeIntegratorVariableTs1_Gain_l * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_h > Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_o) {
    Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_o;
  } else if (Autothrust_DWork.Delay_DSTATE_h < Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_h) {
    Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_h;
  }

  Autothrust_ThrustMode1(Autothrust_U.in.input.TLA_2_deg, &rtb_y_p);
  Autothrust_MATLABFunction(rtb_Switch_f_idx_2 - Autothrust_U.in.data.engine_N1_3_percent, &rtb_Switch_d, &rtb_r_a);
  if (rtb_r_a) {
    Autothrust_DWork.Delay_DSTATE_au = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_i;
  }

  Autothrust_DWork.Delay_DSTATE_au += Autothrust_P.Gain_Gain_i * rtb_Switch_d *
    Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_bg * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_au > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_k) {
    Autothrust_DWork.Delay_DSTATE_au = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_k;
  } else if (Autothrust_DWork.Delay_DSTATE_au < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_a) {
    Autothrust_DWork.Delay_DSTATE_au = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_a;
  }

  rtb_Switch_d = (rtb_Switch_f_idx_2 + Autothrust_DWork.Delay_DSTATE_au) -
    rtb_BusAssignment_n.data.commanded_engine_N1_3_percent;
  if (Autothrust_DWork.Delay_DSTATE_as) {
    Autothrust_DWork.Delay_DSTATE_j = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_a;
  }

  rtb_Saturation = Autothrust_P.Gain_Gain_n * rtb_Switch_d * Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_e *
    Autothrust_U.in.time.dt + Autothrust_DWork.Delay_DSTATE_j;
  if (rtb_Saturation > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_e) {
    Autothrust_DWork.Delay_DSTATE_j = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_e;
  } else if (rtb_Saturation < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_n) {
    Autothrust_DWork.Delay_DSTATE_j = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_n;
  } else {
    Autothrust_DWork.Delay_DSTATE_j = rtb_Saturation;
  }

  rtb_r_a = !Autothrust_DWork.Delay_DSTATE_as;
  if (rtb_r_a) {
    Autothrust_DWork.Delay_DSTATE_o = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_g;
  }

  Autothrust_DWork.Delay_DSTATE_o += Autothrust_P.Gain1_Gain_a * rtb_Switch_d *
    Autothrust_P.DiscreteTimeIntegratorVariableTs1_Gain_p * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_o > Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_d) {
    Autothrust_DWork.Delay_DSTATE_o = Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_d;
  } else if (Autothrust_DWork.Delay_DSTATE_o < Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_o) {
    Autothrust_DWork.Delay_DSTATE_o = Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_o;
  }

  Autothrust_ThrustMode1(Autothrust_U.in.input.TLA_3_deg, &rtb_Switch_d);
  Autothrust_MATLABFunction(rtb_Switch_f_idx_3 - Autothrust_U.in.data.engine_N1_4_percent, &rtb_Saturation, &rtb_r_h);
  if (rtb_r_h) {
    Autothrust_DWork.Delay_DSTATE_e1 = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_fg;
  }

  Autothrust_DWork.Delay_DSTATE_e1 += Autothrust_P.Gain_Gain_a * rtb_Saturation *
    Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_d * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_e1 > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_pn) {
    Autothrust_DWork.Delay_DSTATE_e1 = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_pn;
  } else if (Autothrust_DWork.Delay_DSTATE_e1 < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_c) {
    Autothrust_DWork.Delay_DSTATE_e1 = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_c;
  }

  rtb_Saturation = (rtb_Switch_f_idx_3 + Autothrust_DWork.Delay_DSTATE_e1) -
    rtb_BusAssignment_n.data.commanded_engine_N1_4_percent;
  if (rtb_NOT1_c) {
    Autothrust_DWork.Delay_DSTATE_lr = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_o;
  }

  rtb_Switch_dx = Autothrust_P.Gain_Gain_p * rtb_Saturation * Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_n *
    Autothrust_U.in.time.dt + Autothrust_DWork.Delay_DSTATE_lr;
  if (rtb_Switch_dx > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_g) {
    Autothrust_DWork.Delay_DSTATE_lr = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_g;
  } else if (rtb_Switch_dx < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_p) {
    Autothrust_DWork.Delay_DSTATE_lr = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_p;
  } else {
    Autothrust_DWork.Delay_DSTATE_lr = rtb_Switch_dx;
  }

  rtb_r_h = !rtb_NOT1_c;
  if (rtb_r_h) {
    Autothrust_DWork.Delay_DSTATE_p = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_d;
  }

  Autothrust_DWork.Delay_DSTATE_p += Autothrust_P.Gain1_Gain_pv * rtb_Saturation *
    Autothrust_P.DiscreteTimeIntegratorVariableTs1_Gain_m * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_p > Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_h) {
    Autothrust_DWork.Delay_DSTATE_p = Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_h;
  } else if (Autothrust_DWork.Delay_DSTATE_p < Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_m) {
    Autothrust_DWork.Delay_DSTATE_p = Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_m;
  }

  Autothrust_ThrustMode1(Autothrust_U.in.input.TLA_4_deg, &rtb_Switch_dx);
  Autothrust_Y.out.time = Autothrust_U.in.time;
  Autothrust_Y.out.data = rtb_BusAssignment_n.data;
  Autothrust_Y.out.data_computed.TLA_in_active_range = rtb_out;
  Autothrust_Y.out.data_computed.is_FLX_active = rtb_y_f;
  Autothrust_Y.out.data_computed.ATHR_push = rtb_BusAssignment_n.data_computed.ATHR_push;
  Autothrust_Y.out.data_computed.ATHR_disabled = Autothrust_DWork.Memory_PreviousInput;
  Autothrust_Y.out.data_computed.time_since_touchdown = rtb_BusAssignment_n.data_computed.time_since_touchdown;
  Autothrust_Y.out.data_computed.alpha_floor_inhibited = Autothrust_DWork.sInhibit;
  Autothrust_Y.out.input = Autothrust_U.in.input;
  if (rtb_r_he) {
    Autothrust_Y.out.output.sim_throttle_lever_2_pos = Autothrust_DWork.Delay_DSTATE_lz;
  } else {
    Autothrust_Y.out.output.sim_throttle_lever_2_pos = Autothrust_DWork.Delay_DSTATE_h;
  }

  if (rtb_r_a) {
    Autothrust_Y.out.output.sim_throttle_lever_3_pos = Autothrust_DWork.Delay_DSTATE_j;
  } else {
    Autothrust_Y.out.output.sim_throttle_lever_3_pos = Autothrust_DWork.Delay_DSTATE_o;
  }

  if (rtb_r_h) {
    Autothrust_Y.out.output.sim_throttle_lever_4_pos = Autothrust_DWork.Delay_DSTATE_lr;
  } else {
    Autothrust_Y.out.output.sim_throttle_lever_4_pos = Autothrust_DWork.Delay_DSTATE_p;
  }

  Autothrust_Y.out.output.sim_thrust_mode_1 = rtb_y_a;
  Autothrust_Y.out.output.sim_thrust_mode_2 = rtb_y_p;
  Autothrust_Y.out.output.sim_thrust_mode_3 = rtb_Switch_d;
  Autothrust_Y.out.output.sim_thrust_mode_4 = rtb_Switch_dx;
  Autothrust_Y.out.output.N1_TLA_2_percent = Phi_rad;
  Autothrust_Y.out.output.N1_TLA_3_percent = Theta_rad;
  Autothrust_Y.out.output.N1_TLA_4_percent = result_tmp;
  Autothrust_Y.out.output.is_in_reverse_2 = condition_TOGA;
  Autothrust_Y.out.output.is_in_reverse_3 = Autothrust_DWork.Delay_DSTATE_as;
  Autothrust_Y.out.output.is_in_reverse_4 = rtb_NOT1_c;
  Autothrust_Y.out.output.N1_c_1_percent = rtb_Gain2;
  Autothrust_Y.out.output.N1_c_2_percent = rtb_Gain3;
  Autothrust_Y.out.output.N1_c_3_percent = rtb_Switch_f_idx_2;
  Autothrust_Y.out.output.N1_c_4_percent = rtb_Switch_f_idx_3;
  Autothrust_Y.out.output.status = status;
  Autothrust_Y.out.output.mode = mode;
  rtb_out = !Autothrust_DWork.inhibitAboveThrustReductionAltitude;
  rtb_r_he = (((!Autothrust_U.in.input.is_SRS_TO_mode_active) || ((Autothrust_U.in.data.H_ind_ft >=
    Autothrust_U.in.input.thrust_reduction_altitude) && rtb_out)) && ((!Autothrust_U.in.input.is_SRS_GA_mode_active) ||
    ((Autothrust_U.in.data.H_ind_ft >= Autothrust_U.in.input.thrust_reduction_altitude_go_around) && rtb_out)) &&
              ((Autothrust_U.in.data.H_radio_ft > 400.0) || (Autothrust_U.in.input.flight_phase > 2.0)) && (tmp_0 ||
    (Autothrust_U.in.input.target_TCAS_RA_rate_fpm <= 500.0) || (Autothrust_U.in.input.TLA_1_deg <= 25.0) ||
    (Autothrust_U.in.input.TLA_2_deg <= 25.0)));
  if ((status != athr_status::DISENGAGED) && (Autothrust_DWork.pMode != athr_mode::A_FLOOR) && (Autothrust_DWork.pMode
       != athr_mode::TOGA_LK) && (rtb_on_ground == 0) && (rtb_r_he || (Autothrust_U.in.input.is_TCAS_active &&
        (Autothrust_U.in.data.H_ind_ft < Autothrust_U.in.input.thrust_reduction_altitude) &&
        ((Autothrust_U.in.data.V_ias_kn > Autothrust_U.in.input.V_MAX_kn - 20.0) ||
         (Autothrust_U.in.input.target_TCAS_RA_rate_fpm <= 500.0)))) && Autothrust_U.in.data.is_engine_operative_1 &&
      Autothrust_U.in.data.is_engine_operative_2 && Autothrust_U.in.data.is_engine_operative_4 &&
      Autothrust_U.in.data.is_engine_operative_3 && (((Autothrust_U.in.input.TLA_1_deg < 25.0) &&
        (Autothrust_U.in.input.TLA_2_deg < 25.0) && (Autothrust_U.in.input.TLA_3_deg < 25.0) &&
        (Autothrust_U.in.input.TLA_4_deg < 25.0)) || (Autothrust_U.in.input.TLA_1_deg > 25.0) ||
       (Autothrust_U.in.input.TLA_2_deg > 25.0) || (Autothrust_U.in.input.TLA_4_deg > 25.0) ||
       (Autothrust_U.in.input.TLA_4_deg > 25.0))) {
    Autothrust_Y.out.output.mode_message = athr_mode_message::LVR_CLB;
  } else if ((status != athr_status::DISENGAGED) && (Autothrust_DWork.pMode != athr_mode::A_FLOOR) &&
             (Autothrust_DWork.pMode != athr_mode::TOGA_LK) && (rtb_on_ground == 0) && rtb_r_he && rtb_r_g_tmp &&
             (Autothrust_U.in.input.TLA_1_deg != 35.0) && (Autothrust_U.in.input.TLA_2_deg != 35.0) &&
             (Autothrust_U.in.input.TLA_3_deg != 35.0) && (Autothrust_U.in.input.TLA_4_deg != 35.0)) {
    Autothrust_Y.out.output.mode_message = athr_mode_message::LVR_MCT;
  } else if ((status == athr_status::ENGAGED_ACTIVE) && Autothrust_U.in.data.is_engine_operative_1 &&
             Autothrust_U.in.data.is_engine_operative_2 && Autothrust_U.in.data.is_engine_operative_4 &&
             Autothrust_U.in.data.is_engine_operative_3 && (((Autothrust_U.in.input.TLA_1_deg == 25.0) &&
               (Autothrust_U.in.input.TLA_2_deg != 25.0) && (Autothrust_U.in.input.TLA_3_deg != 25.0) &&
               (Autothrust_U.in.input.TLA_4_deg != 25.0)) || ((Autothrust_U.in.input.TLA_2_deg == 25.0) &&
               (Autothrust_U.in.input.TLA_1_deg != 25.0) && (Autothrust_U.in.input.TLA_3_deg != 25.0) &&
               (Autothrust_U.in.input.TLA_4_deg != 25.0)))) {
    Autothrust_Y.out.output.mode_message = athr_mode_message::LVR_ASYM;
  } else if (Autothrust_DWork.condition_THR_LK) {
    Autothrust_Y.out.output.mode_message = athr_mode_message::THR_LK;
  } else {
    Autothrust_Y.out.output.mode_message = athr_mode_message::NONE;
  }

  Autothrust_Y.out.output.thrust_lever_warning_flex = (rtb_BusAssignment_n.data_computed.is_FLX_active &&
    condition_AP_FD_ATHR_Specific);
  Autothrust_Y.out.output.thrust_lever_warning_toga = ((!rtb_BusAssignment_n.data_computed.is_FLX_active) &&
    ((Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime >= 3.0) || condition_AP_FD_ATHR_Specific));
  Autothrust_DWork.Delay_DSTATE_as = rtb_Compare;
  Autothrust_DWork.Delay_DSTATE = rtb_Gain_m;
  Autothrust_DWork.icLoad = false;
}

void Autothrust::initialize()
{
  Autothrust_DWork.Memory_PreviousInput = Autothrust_P.SRFlipFlop_initial_condition;
  Autothrust_DWork.Delay_DSTATE_as = Autothrust_P.Delay_InitialCondition;
  Autothrust_DWork.Memory_PreviousInput_m = Autothrust_P.SRFlipFlop_initial_condition_g;
  Autothrust_DWork.Delay_DSTATE = Autothrust_P.DiscreteDerivativeVariableTs_InitialCondition;
  Autothrust_DWork.icLoad = true;
  Autothrust_DWork.Delay_DSTATE_e = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_p;
  Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
  Autothrust_DWork.Delay_DSTATE_a = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_f;
  Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_n;
  Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_e;
  Autothrust_DWork.Delay_DSTATE_au = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_i;
  Autothrust_DWork.Delay_DSTATE_j = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_a;
  Autothrust_DWork.Delay_DSTATE_o = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_g;
  Autothrust_DWork.Delay_DSTATE_e1 = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_fg;
  Autothrust_DWork.Delay_DSTATE_lr = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_o;
  Autothrust_DWork.Delay_DSTATE_p = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_d;
}

void Autothrust::terminate()
{
}

Autothrust::Autothrust():
  Autothrust_U(),
  Autothrust_Y(),
  Autothrust_DWork()
{
}

Autothrust::~Autothrust() = default;
