#include "Autothrust.h"
#include "Autothrust_private.h"
#include "look1_binlxpw.h"

const uint8_T Autothrust_IN_InAir{ 1U };

const uint8_T Autothrust_IN_OnGround{ 2U };

void AutothrustModelClass::Autothrust_TimeSinceCondition(real_T rtu_time, boolean_T rtu_condition, real_T *rty_y,
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

void AutothrustModelClass::Autothrust_LeadLagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_C2, real_T rtu_C3, real_T
  rtu_C4, real_T rtu_dt, real_T *rty_Y, rtDW_LeadLagFilter_Autothrust_T *localDW)
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

void AutothrustModelClass::Autothrust_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
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

void AutothrustModelClass::Autothrust_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
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

void AutothrustModelClass::Autothrust_ThrustMode1(real_T rtu_u, real_T *rty_y)
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

void AutothrustModelClass::Autothrust_TLAComputation1(const athr_out *rtu_in, real_T rtu_TLA, real_T *rty_N1c, boolean_T
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

real_T AutothrustModelClass::Autothrust_timeSinceConditionArmedActive(real_T in_time_simulation_time, athr_status status)
{
  if (!Autothrust_DWork.eventTime_not_empty_mr) {
    Autothrust_DWork.eventTime_o = in_time_simulation_time;
    Autothrust_DWork.eventTime_not_empty_mr = true;
  }

  if ((!(status != athr_status_DISENGAGED)) || (Autothrust_DWork.eventTime_o == 0.0)) {
    Autothrust_DWork.eventTime_o = in_time_simulation_time;
  }

  return in_time_simulation_time - Autothrust_DWork.eventTime_o;
}

void AutothrustModelClass::step()
{
  athr_out rtb_BusAssignment_n;
  real_T result_tmp[9];
  real_T result[3];
  real_T Phi_rad;
  real_T Theta_rad;
  real_T rtb_Cos;
  real_T rtb_Cos1;
  real_T rtb_Gain2;
  real_T rtb_Gain3;
  real_T rtb_Saturation;
  real_T rtb_Switch_dx;
  real_T rtb_Switch_m;
  real_T rtb_Y_f;
  real_T rtb_y_o;
  real_T u0;
  int32_T i;
  int32_T rtb_on_ground;
  boolean_T ATHR_ENGAGED_tmp;
  boolean_T ATHR_ENGAGED_tmp_0;
  boolean_T ATHR_ENGAGED_tmp_1;
  boolean_T condition02;
  boolean_T condition_AP_FD_ATHR_Specific;
  boolean_T condition_AlphaFloor;
  boolean_T condition_AlphaFloor_tmp;
  boolean_T condition_TOGA;
  boolean_T rtb_Compare_e;
  boolean_T rtb_NOT;
  boolean_T rtb_NOT1_m;
  boolean_T rtb_out;
  boolean_T rtb_y_e;
  boolean_T tmp;
  athr_mode mode;
  athr_status status;
  rtb_Gain2 = Autothrust_P.Gain2_Gain * Autothrust_U.in.data.Theta_deg;
  rtb_Gain3 = Autothrust_P.Gain3_Gain_c * Autothrust_U.in.data.Phi_deg;
  Theta_rad = 0.017453292519943295 * rtb_Gain2;
  Phi_rad = 0.017453292519943295 * rtb_Gain3;
  rtb_Saturation = std::cos(Theta_rad);
  Theta_rad = std::sin(Theta_rad);
  rtb_Switch_dx = std::sin(Phi_rad);
  Phi_rad = std::cos(Phi_rad);
  result_tmp[0] = rtb_Saturation;
  result_tmp[3] = 0.0;
  result_tmp[6] = -Theta_rad;
  result_tmp[1] = rtb_Switch_dx * Theta_rad;
  result_tmp[4] = Phi_rad;
  result_tmp[7] = rtb_Saturation * rtb_Switch_dx;
  result_tmp[2] = Phi_rad * Theta_rad;
  result_tmp[5] = 0.0 - rtb_Switch_dx;
  result_tmp[8] = Phi_rad * rtb_Saturation;
  for (i = 0; i < 3; i++) {
    result[i] = (result_tmp[i + 3] * Autothrust_U.in.data.by_m_s2 + result_tmp[i] * Autothrust_U.in.data.bx_m_s2) +
      result_tmp[i + 6] * Autothrust_U.in.data.bz_m_s2;
  }

  rtb_Saturation = Autothrust_P.Gain_Gain_d * Autothrust_U.in.data.gear_strut_compression_1 -
    Autothrust_P.Constant1_Value_l;
  if (rtb_Saturation > Autothrust_P.Saturation_UpperSat) {
    rtb_Saturation = Autothrust_P.Saturation_UpperSat;
  } else if (rtb_Saturation < Autothrust_P.Saturation_LowerSat) {
    rtb_Saturation = Autothrust_P.Saturation_LowerSat;
  }

  Phi_rad = Autothrust_P.Gain1_Gain_n * Autothrust_U.in.data.gear_strut_compression_2 - Autothrust_P.Constant1_Value_l;
  if (Phi_rad > Autothrust_P.Saturation1_UpperSat) {
    Phi_rad = Autothrust_P.Saturation1_UpperSat;
  } else if (Phi_rad < Autothrust_P.Saturation1_LowerSat) {
    Phi_rad = Autothrust_P.Saturation1_LowerSat;
  }

  if (Autothrust_DWork.is_active_c9_Autothrust == 0U) {
    Autothrust_DWork.is_active_c9_Autothrust = 1U;
    Autothrust_DWork.is_c9_Autothrust = Autothrust_IN_OnGround;
    rtb_on_ground = 1;
  } else if (Autothrust_DWork.is_c9_Autothrust == 1) {
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

  rtb_BusAssignment_n = Autothrust_P.athr_out_MATLABStruct;
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
  rtb_BusAssignment_n.data.commanded_engine_N1_1_percent = (Autothrust_U.in.data.engine_N1_1_percent +
    Autothrust_U.in.data.commanded_engine_N1_1_percent) - Autothrust_U.in.data.corrected_engine_N1_1_percent;
  rtb_BusAssignment_n.data.commanded_engine_N1_2_percent = (Autothrust_U.in.data.engine_N1_2_percent +
    Autothrust_U.in.data.commanded_engine_N1_2_percent) - Autothrust_U.in.data.corrected_engine_N1_2_percent;
  rtb_BusAssignment_n.data.engine_N1_1_percent = Autothrust_U.in.data.engine_N1_1_percent;
  rtb_BusAssignment_n.data.engine_N1_2_percent = Autothrust_U.in.data.engine_N1_2_percent;
  rtb_BusAssignment_n.data.TAT_degC = Autothrust_U.in.data.TAT_degC;
  rtb_BusAssignment_n.data.OAT_degC = Autothrust_U.in.data.OAT_degC;
  rtb_BusAssignment_n.data.ISA_degC = std::fmax(15.0 - 0.0019812 * Autothrust_U.in.data.H_ft, -56.5);
  rtb_BusAssignment_n.data.ambient_density_kg_per_m3 = Autothrust_U.in.data.ambient_density_kg_per_m3;
  rtb_BusAssignment_n.input = Autothrust_U.in.input;
  Autothrust_TimeSinceCondition(Autothrust_U.in.time.simulation_time, Autothrust_U.in.input.ATHR_disconnect,
    &rtb_Switch_m, &Autothrust_DWork.sf_TimeSinceCondition_o);
  Autothrust_DWork.Memory_PreviousInput = Autothrust_P.Logic_table[(((static_cast<uint32_T>(rtb_Switch_m >=
    Autothrust_P.CompareToConstant_const) << 1) + Autothrust_U.in.input.ATHR_reset_disable) << 1) +
    Autothrust_DWork.Memory_PreviousInput];
  if (!Autothrust_DWork.eventTime_not_empty_mc) {
    Autothrust_DWork.eventTime_p = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_mc = true;
  }

  if ((Autothrust_U.in.input.ATHR_push != Autothrust_P.CompareToConstant1_const) || (Autothrust_DWork.eventTime_p == 0.0))
  {
    Autothrust_DWork.eventTime_p = Autothrust_U.in.time.simulation_time;
  }

  Autothrust_DWork.Memory_PreviousInput_m = Autothrust_P.Logic_table_m[(((Autothrust_U.in.time.simulation_time -
    Autothrust_DWork.eventTime_p >= Autothrust_P.CompareToConstant2_const) + (static_cast<uint32_T>
    (Autothrust_DWork.Delay_DSTATE_a) << 1)) << 1) + Autothrust_DWork.Memory_PreviousInput_m];
  if (Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2) {
    rtb_out = ((Autothrust_U.in.input.TLA_1_deg >= 0.0) && (Autothrust_U.in.input.TLA_1_deg <= 25.0) &&
               (Autothrust_U.in.input.TLA_2_deg >= 0.0) && (Autothrust_U.in.input.TLA_2_deg <= 25.0));
  } else {
    rtb_out = ((Autothrust_U.in.data.is_engine_operative_1 && (Autothrust_U.in.input.TLA_1_deg >= 0.0) &&
                (Autothrust_U.in.input.TLA_1_deg <= 35.0)) || (Autothrust_U.in.data.is_engine_operative_2 &&
                (Autothrust_U.in.input.TLA_2_deg >= 0.0) && (Autothrust_U.in.input.TLA_2_deg <= 35.0)));
  }

  rtb_Compare_e = ((Autothrust_U.in.input.flex_temperature_degC > Autothrust_U.in.data.TAT_degC) &&
                   (Autothrust_U.in.input.flex_temperature_degC != 0.0) && (Autothrust_U.in.input.flight_phase < 3.0));
  Autothrust_DWork.latch = ((rtb_Compare_e && (rtb_on_ground != 0) && (Autothrust_U.in.input.TLA_1_deg == 35.0) &&
    (Autothrust_U.in.input.TLA_2_deg == 35.0)) || Autothrust_DWork.latch);
  Autothrust_DWork.latch = (((!Autothrust_DWork.latch) || (((Autothrust_U.in.input.TLA_1_deg != 25.0) ||
    (Autothrust_U.in.input.TLA_2_deg != 25.0)) && ((Autothrust_U.in.input.TLA_1_deg != 45.0) ||
    (Autothrust_U.in.input.TLA_2_deg != 45.0)))) && Autothrust_DWork.latch);
  rtb_y_e = ((rtb_Compare_e && (rtb_on_ground != 0)) || ((rtb_on_ground == 0) && Autothrust_DWork.latch));
  Autothrust_DWork.Delay_DSTATE_a = (static_cast<int32_T>(Autothrust_U.in.input.ATHR_push) > static_cast<int32_T>
    (Autothrust_P.CompareToConstant_const_j));
  rtb_NOT1_m = (Autothrust_DWork.Delay_DSTATE_a && (!Autothrust_DWork.Memory_PreviousInput_m));
  Autothrust_TimeSinceCondition(Autothrust_U.in.time.simulation_time, rtb_on_ground != 0, &rtb_Switch_m,
    &Autothrust_DWork.sf_TimeSinceCondition1);
  if (!Autothrust_DWork.eventTime_not_empty_i) {
    Autothrust_DWork.eventTime_g = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_i = true;
  }

  tmp = !Autothrust_U.in.input.is_TCAS_active;
  if (tmp || (Autothrust_DWork.eventTime_g == 0.0)) {
    Autothrust_DWork.eventTime_g = Autothrust_U.in.time.simulation_time;
  }

  Autothrust_DWork.sInhibit = (((!Autothrust_DWork.prev_TCAS_active) && Autothrust_U.in.input.is_TCAS_active &&
    (Autothrust_U.in.input.TLA_1_deg <= 25.0) && (Autothrust_U.in.input.TLA_2_deg <= 25.0)) || Autothrust_DWork.sInhibit);
  Autothrust_DWork.sInhibit = (((!Autothrust_DWork.sInhibit) || (Autothrust_U.in.time.simulation_time -
    Autothrust_DWork.eventTime_g <= 5.0) || ((Autothrust_U.in.input.TLA_1_deg >= 25.0) &&
    (Autothrust_U.in.input.TLA_2_deg >= 25.0))) && Autothrust_DWork.sInhibit);
  Autothrust_DWork.sInhibit = (Autothrust_U.in.input.is_TCAS_active && Autothrust_DWork.sInhibit);
  Autothrust_DWork.prev_TCAS_active = Autothrust_U.in.input.is_TCAS_active;
  if (Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2) {
    rtb_BusAssignment_n.data_computed.TLA_in_active_range = ((Autothrust_U.in.input.TLA_1_deg >= 0.0) &&
      (Autothrust_U.in.input.TLA_1_deg <= 25.0) && (Autothrust_U.in.input.TLA_2_deg >= 0.0) &&
      (Autothrust_U.in.input.TLA_2_deg <= 25.0));
  } else {
    rtb_BusAssignment_n.data_computed.TLA_in_active_range = ((Autothrust_U.in.data.is_engine_operative_1 &&
      (Autothrust_U.in.input.TLA_1_deg >= 0.0) && (Autothrust_U.in.input.TLA_1_deg <= 35.0)) ||
      (Autothrust_U.in.data.is_engine_operative_2 && (Autothrust_U.in.input.TLA_2_deg >= 0.0) &&
       (Autothrust_U.in.input.TLA_2_deg <= 35.0)));
  }

  rtb_BusAssignment_n.data_computed.is_FLX_active = ((rtb_Compare_e && (rtb_on_ground != 0)) || ((rtb_on_ground == 0) &&
    Autothrust_DWork.latch));
  rtb_BusAssignment_n.data_computed.ATHR_push = rtb_NOT1_m;
  rtb_BusAssignment_n.data_computed.ATHR_disabled = Autothrust_DWork.Memory_PreviousInput;
  rtb_BusAssignment_n.data_computed.time_since_touchdown = rtb_Switch_m;
  rtb_BusAssignment_n.data_computed.alpha_floor_inhibited = Autothrust_DWork.sInhibit;
  Autothrust_TLAComputation1(&rtb_BusAssignment_n, Autothrust_U.in.input.TLA_1_deg, &rtb_Saturation, &rtb_Compare_e);
  Autothrust_TLAComputation1(&rtb_BusAssignment_n, Autothrust_U.in.input.TLA_2_deg, &rtb_Switch_m, &rtb_NOT1_m);
  if (!Autothrust_DWork.prev_TLA_1_not_empty) {
    Autothrust_DWork.prev_TLA_1 = Autothrust_U.in.input.TLA_1_deg;
    Autothrust_DWork.prev_TLA_1_not_empty = true;
  }

  if (!Autothrust_DWork.prev_TLA_2_not_empty) {
    Autothrust_DWork.prev_TLA_2 = Autothrust_U.in.input.TLA_2_deg;
    Autothrust_DWork.prev_TLA_2_not_empty = true;
  }

  condition_AP_FD_ATHR_Specific = !Autothrust_DWork.Memory_PreviousInput;
  condition02 = (Autothrust_U.in.input.is_SRS_TO_mode_active || Autothrust_U.in.input.is_SRS_GA_mode_active);
  Autothrust_DWork.condition_TOGA_latch = (((!Autothrust_DWork.prev_SRS_TO_GA_mode_active) && condition02) ||
    Autothrust_DWork.condition_TOGA_latch);
  if (!Autothrust_DWork.eventTime_not_empty_m) {
    Autothrust_DWork.eventTime_b = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_m = true;
  }

  if ((!Autothrust_DWork.condition_TOGA_latch) || (Autothrust_DWork.eventTime_b == 0.0)) {
    Autothrust_DWork.eventTime_b = Autothrust_U.in.time.simulation_time;
  }

  if (Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime_b >= 0.3) {
    condition_TOGA = true;
    Autothrust_DWork.condition_TOGA_latch = false;
  } else {
    condition_TOGA = false;
  }

  condition_AlphaFloor_tmp = !Autothrust_DWork.sInhibit;
  condition_AlphaFloor = (condition_AlphaFloor_tmp && Autothrust_U.in.input.alpha_floor_condition &&
    (!Autothrust_DWork.prev_condition_AlphaFloor));
  ATHR_ENGAGED_tmp = !Autothrust_DWork.ATHR_ENGAGED;
  ATHR_ENGAGED_tmp_0 = ((Autothrust_DWork.prev_TLA_1 <= 0.0) || (Autothrust_U.in.input.TLA_1_deg != 0.0));
  ATHR_ENGAGED_tmp_1 = ((Autothrust_DWork.prev_TLA_2 <= 0.0) || (Autothrust_U.in.input.TLA_2_deg != 0.0));
  rtb_NOT = !Autothrust_U.in.input.ATHR_disconnect;
  Autothrust_DWork.ATHR_ENGAGED = ((condition_AP_FD_ATHR_Specific && (((rtb_on_ground == 0) && ATHR_ENGAGED_tmp &&
    rtb_BusAssignment_n.data_computed.ATHR_push) || condition_TOGA || condition_AlphaFloor ||
    (Autothrust_U.in.input.is_TCAS_active && (!Autothrust_DWork.prev_condition_TCAS)))) ||
    (condition_AP_FD_ATHR_Specific && ((!rtb_BusAssignment_n.data_computed.ATHR_push) || ATHR_ENGAGED_tmp ||
    Autothrust_U.in.input.is_LAND_mode_active) && rtb_NOT && ((ATHR_ENGAGED_tmp_0 || ATHR_ENGAGED_tmp_1) &&
    (ATHR_ENGAGED_tmp_0 || (Autothrust_U.in.input.TLA_2_deg != 0.0)) && (ATHR_ENGAGED_tmp_1 ||
    (Autothrust_U.in.input.TLA_1_deg != 0.0))) && Autothrust_DWork.ATHR_ENGAGED));
  condition_AP_FD_ATHR_Specific = (Autothrust_DWork.ATHR_ENGAGED && (rtb_out || condition_AlphaFloor));
  if (Autothrust_DWork.ATHR_ENGAGED && condition_AP_FD_ATHR_Specific) {
    status = athr_status_ENGAGED_ACTIVE;
  } else if (Autothrust_DWork.ATHR_ENGAGED && (!condition_AP_FD_ATHR_Specific)) {
    status = athr_status_ENGAGED_ARMED;
  } else {
    status = athr_status_DISENGAGED;
  }

  Autothrust_DWork.prev_TLA_1 = Autothrust_U.in.input.TLA_1_deg;
  Autothrust_DWork.prev_TLA_2 = Autothrust_U.in.input.TLA_2_deg;
  Autothrust_DWork.prev_condition_AlphaFloor = (Autothrust_U.in.input.alpha_floor_condition && condition_AlphaFloor_tmp);
  Autothrust_DWork.prev_condition_TCAS = Autothrust_U.in.input.is_TCAS_active;
  Autothrust_DWork.prev_SRS_TO_GA_mode_active = condition02;
  Phi_rad = std::fmax(Autothrust_U.in.input.TLA_1_deg, Autothrust_U.in.input.TLA_2_deg);
  Autothrust_DWork.pConditionAlphaFloor = (Autothrust_DWork.prev_condition_AlphaFloor || ((!(status ==
    athr_status_DISENGAGED)) && Autothrust_DWork.pConditionAlphaFloor));
  if (status == athr_status_DISENGAGED) {
    Autothrust_DWork.pMode = athr_mode_NONE;
  } else if (Autothrust_DWork.prev_condition_AlphaFloor) {
    Autothrust_DWork.pMode = athr_mode_A_FLOOR;
  } else if (Autothrust_DWork.pConditionAlphaFloor) {
    Autothrust_DWork.pMode = athr_mode_TOGA_LK;
  } else if ((status == athr_status_ENGAGED_ARMED) && ((Autothrust_U.in.input.TLA_1_deg == 45.0) ||
              (Autothrust_U.in.input.TLA_2_deg == 45.0))) {
    Autothrust_DWork.pMode = athr_mode_MAN_TOGA;
  } else if ((status == athr_status_ENGAGED_ARMED) && rtb_y_e && (Phi_rad == 35.0)) {
    Autothrust_DWork.pMode = athr_mode_MAN_FLEX;
  } else if ((status == athr_status_ENGAGED_ARMED) && ((Autothrust_U.in.input.TLA_1_deg == 35.0) ||
              (Autothrust_U.in.input.TLA_2_deg == 35.0))) {
    Autothrust_DWork.pMode = athr_mode_MAN_MCT;
  } else {
    condition_AP_FD_ATHR_Specific = (Autothrust_U.in.data.is_engine_operative_1 &&
      (!Autothrust_U.in.data.is_engine_operative_2));
    condition_AlphaFloor_tmp = (Autothrust_U.in.data.is_engine_operative_2 &&
      (!Autothrust_U.in.data.is_engine_operative_1));
    if ((status == athr_status_ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 3.0) &&
        ((condition_AP_FD_ATHR_Specific && (Autothrust_U.in.input.TLA_1_deg == 35.0) && (Autothrust_U.in.input.TLA_2_deg
           <= 35.0)) || (condition_AlphaFloor_tmp && (Autothrust_U.in.input.TLA_2_deg == 35.0) &&
                         (Autothrust_U.in.input.TLA_1_deg <= 35.0)))) {
      Autothrust_DWork.pMode = athr_mode_THR_MCT;
    } else if ((status == athr_status_ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 3.0) &&
               Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2 && (Phi_rad ==
                25.0)) {
      Autothrust_DWork.pMode = athr_mode_THR_CLB;
    } else {
      condition_TOGA = (Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2);
      if ((status == athr_status_ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 3.0) && ((condition_TOGA &&
            (Autothrust_U.in.input.TLA_1_deg < 25.0) && (Autothrust_U.in.input.TLA_2_deg < 25.0)) ||
           (condition_AP_FD_ATHR_Specific && (Autothrust_U.in.input.TLA_1_deg < 35.0)) || (condition_AlphaFloor_tmp &&
            (Autothrust_U.in.input.TLA_2_deg < 35.0)))) {
        Autothrust_DWork.pMode = athr_mode_THR_LVR;
      } else if ((status == athr_status_ENGAGED_ARMED) && ((condition_TOGA && (Phi_rad > 25.0) && (Phi_rad < 35.0)) ||
                  ((Phi_rad > 35.0) && (Phi_rad < 45.0)))) {
        Autothrust_DWork.pMode = athr_mode_MAN_THR;
      } else if ((status == athr_status_ENGAGED_ACTIVE) && ((Autothrust_U.in.input.mode_requested == 2.0) ||
                  (Autothrust_U.in.input.mode_requested == 4.0))) {
        Autothrust_DWork.pMode = athr_mode_THR_IDLE;
      } else if ((status == athr_status_ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 1.0) &&
                 (!Autothrust_U.in.input.is_mach_mode_active)) {
        Autothrust_DWork.pMode = athr_mode_SPEED;
      } else if ((status == athr_status_ENGAGED_ACTIVE) && (Autothrust_U.in.input.mode_requested == 1.0) &&
                 Autothrust_U.in.input.is_mach_mode_active) {
        Autothrust_DWork.pMode = athr_mode_MACH;
      }
    }
  }

  if (Autothrust_timeSinceConditionArmedActive(Autothrust_U.in.time.simulation_time, status) >= 0.1) {
    mode = Autothrust_DWork.pMode;
  } else {
    mode = athr_mode_NONE;
  }

  Autothrust_DWork.inhibitAboveThrustReductionAltitude = ((Autothrust_U.in.input.is_SRS_TO_mode_active &&
    (!Autothrust_DWork.was_SRS_TO_active) && (Autothrust_U.in.data.H_ind_ft >
    Autothrust_U.in.input.thrust_reduction_altitude)) || (Autothrust_U.in.input.is_SRS_GA_mode_active &&
    (!Autothrust_DWork.was_SRS_GA_active) && (Autothrust_U.in.data.H_ind_ft >
    Autothrust_U.in.input.thrust_reduction_altitude_go_around)) || (condition02 &&
    Autothrust_DWork.inhibitAboveThrustReductionAltitude));
  condition_TOGA = (Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2);
  condition_AlphaFloor = (Autothrust_U.in.data.is_engine_operative_1 && (!Autothrust_U.in.data.is_engine_operative_2));
  ATHR_ENGAGED_tmp = (Autothrust_U.in.data.is_engine_operative_2 && (!Autothrust_U.in.data.is_engine_operative_1));
  Autothrust_DWork.condition_THR_LK = (((status == athr_status_DISENGAGED) && (Autothrust_DWork.pStatus !=
    athr_status_DISENGAGED) && rtb_NOT && ((condition_TOGA && (Autothrust_U.in.input.TLA_1_deg == 25.0) &&
    (Autothrust_U.in.input.TLA_2_deg == 25.0)) || (condition_AlphaFloor && (Autothrust_U.in.input.TLA_1_deg == 35.0) &&
    (Autothrust_U.in.input.TLA_2_deg <= 35.0)) || (ATHR_ENGAGED_tmp && (Autothrust_U.in.input.TLA_2_deg == 35.0) &&
    (Autothrust_U.in.input.TLA_1_deg <= 35.0)))) || (((!Autothrust_DWork.condition_THR_LK) || ((!(status !=
    athr_status_DISENGAGED)) && ((Autothrust_U.in.input.TLA_1_deg == 25.0) || (Autothrust_U.in.input.TLA_2_deg == 25.0) ||
    (Autothrust_U.in.input.TLA_1_deg == 35.0) || (Autothrust_U.in.input.TLA_2_deg == 35.0)))) &&
    Autothrust_DWork.condition_THR_LK));
  Autothrust_DWork.pStatus = status;
  Autothrust_DWork.was_SRS_TO_active = Autothrust_U.in.input.is_SRS_TO_mode_active;
  Autothrust_DWork.was_SRS_GA_active = Autothrust_U.in.input.is_SRS_GA_mode_active;
  if (rtb_on_ground == 0) {
    Phi_rad = std::fmax(0.0, Phi_rad);
  }

  condition_AP_FD_ATHR_Specific = !Autothrust_U.in.data.is_engine_operative_1;
  condition_AlphaFloor_tmp = !Autothrust_U.in.data.is_engine_operative_2;
  if ((rtb_on_ground == 0) || (condition_AP_FD_ATHR_Specific && condition_AlphaFloor_tmp)) {
    if ((mode == athr_mode_A_FLOOR) || (mode == athr_mode_TOGA_LK)) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_TOGA;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_TOGA_percent;
    } else if (Phi_rad > 35.0) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_TOGA;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_TOGA_percent;
    } else if (Phi_rad > 25.0) {
      if (!rtb_y_e) {
        Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_MCT;
        Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_MCT_percent;
      } else {
        Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_FLEX;
        Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_FLEX_percent;
      }
    } else if (Phi_rad >= 0.0) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_CLB;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_CLB_percent;
    } else if (Phi_rad < 0.0) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_REVERSE;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_REV_percent;
    } else {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_NONE;
      Autothrust_Y.out.output.thrust_limit_percent = 0.0;
    }
  } else if (Phi_rad >= 0.0) {
    if ((!rtb_y_e) || (Phi_rad > 35.0)) {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_TOGA;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_TOGA_percent;
    } else {
      Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_FLEX;
      Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_FLEX_percent;
    }
  } else if (Phi_rad < 0.0) {
    Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_REVERSE;
    Autothrust_Y.out.output.thrust_limit_percent = Autothrust_U.in.input.thrust_limit_REV_percent;
  } else {
    Autothrust_Y.out.output.thrust_limit_type = athr_thrust_limit_type_NONE;
    Autothrust_Y.out.output.thrust_limit_percent = 0.0;
  }

  if (!Autothrust_DWork.eventTime_not_empty) {
    Autothrust_DWork.eventTime = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty = true;
  }

  if (((Autothrust_U.in.input.TLA_1_deg != 35.0) && (Autothrust_U.in.input.TLA_2_deg != 35.0)) ||
      (Autothrust_DWork.eventTime == 0.0)) {
    Autothrust_DWork.eventTime = Autothrust_U.in.time.simulation_time;
  }

  if (!Autothrust_DWork.eventTime_not_empty_n) {
    Autothrust_DWork.eventTime_h = Autothrust_U.in.time.simulation_time;
    Autothrust_DWork.eventTime_not_empty_n = true;
  }

  if ((((Autothrust_U.in.input.TLA_1_deg < 25.0) || (Autothrust_U.in.input.TLA_1_deg >= 35.0)) &&
       ((Autothrust_U.in.input.TLA_2_deg < 25.0) || (Autothrust_U.in.input.TLA_2_deg >= 35.0))) ||
      (Autothrust_DWork.eventTime_h == 0.0)) {
    Autothrust_DWork.eventTime_h = Autothrust_U.in.time.simulation_time;
  }

  condition02 = (Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime_h >= 4.0);
  Phi_rad = rtb_Switch_m;
  ATHR_ENGAGED_tmp_0 = ((status == athr_status_ENGAGED_ACTIVE) && (((Autothrust_U.in.input.TLA_1_deg <= 35.0) &&
    (Autothrust_U.in.input.TLA_2_deg <= 35.0)) || Autothrust_U.in.input.alpha_floor_condition));
  ATHR_ENGAGED_tmp_1 = !ATHR_ENGAGED_tmp_0;
  Autothrust_DWork.pThrustMemoActive = ((((Autothrust_U.in.input.ATHR_push && (status != athr_status_DISENGAGED)) ||
    (ATHR_ENGAGED_tmp_1 && Autothrust_DWork.pUseAutoThrustControl && rtb_NOT)) && ((condition_TOGA &&
    (Autothrust_U.in.input.TLA_1_deg == 25.0) && (Autothrust_U.in.input.TLA_2_deg == 25.0)) || (condition_AlphaFloor &&
    (Autothrust_U.in.input.TLA_1_deg == 35.0) && (Autothrust_U.in.input.TLA_2_deg <= 35.0)) || (ATHR_ENGAGED_tmp &&
    (Autothrust_U.in.input.TLA_2_deg == 35.0) && (Autothrust_U.in.input.TLA_1_deg <= 35.0)))) || (ATHR_ENGAGED_tmp_1 &&
    ((Autothrust_U.in.input.TLA_1_deg == 25.0) || (Autothrust_U.in.input.TLA_1_deg == 35.0) ||
     (Autothrust_U.in.input.TLA_2_deg == 25.0) || (Autothrust_U.in.input.TLA_2_deg == 35.0)) &&
    Autothrust_DWork.pThrustMemoActive));
  Autothrust_DWork.pUseAutoThrustControl = ATHR_ENGAGED_tmp_0;
  rtb_NOT = ((!(status == Autothrust_P.CompareToConstant_const_d)) || ((mode == Autothrust_P.CompareToConstant2_const_c)
              || (mode == Autothrust_P.CompareToConstant3_const_k)));
  if (Autothrust_U.in.data.is_engine_operative_1 && Autothrust_U.in.data.is_engine_operative_2) {
    Theta_rad = Autothrust_U.in.input.thrust_limit_CLB_percent;
  } else {
    Theta_rad = Autothrust_U.in.input.thrust_limit_MCT_percent;
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

  rtb_Y_f = result[i] - Autothrust_U.in.data.V_ias_kn;
  rtb_y_o = Autothrust_P.Gain1_Gain_n0 * rtb_Gain2;
  rtb_Switch_m = Autothrust_P.Gain1_Gain_o * rtb_Gain3;
  rtb_Cos = std::cos(rtb_Switch_m);
  rtb_Cos1 = std::sin(rtb_Switch_m);
  if (Autothrust_U.in.data.ambient_density_kg_per_m3 > Autothrust_P.Saturation2_UpperSat) {
    rtb_Switch_m = Autothrust_P.Saturation2_UpperSat;
  } else if (Autothrust_U.in.data.ambient_density_kg_per_m3 < Autothrust_P.Saturation2_LowerSat) {
    rtb_Switch_m = Autothrust_P.Saturation2_LowerSat;
  } else {
    rtb_Switch_m = Autothrust_U.in.data.ambient_density_kg_per_m3;
  }

  rtb_Switch_m = std::sqrt(rtb_Switch_m);
  if (Autothrust_U.in.data.V_gnd_kn > Autothrust_P.Saturation_UpperSat_f) {
    rtb_Switch_dx = Autothrust_P.Saturation_UpperSat_f;
  } else if (Autothrust_U.in.data.V_gnd_kn < Autothrust_P.Saturation_LowerSat_ev) {
    rtb_Switch_dx = Autothrust_P.Saturation_LowerSat_ev;
  } else {
    rtb_Switch_dx = Autothrust_U.in.data.V_gnd_kn;
  }

  Autothrust_WashoutFilter(Autothrust_P._Gain * (1.0 / rtb_Switch_m * (Autothrust_P.GStoGS_CAS_Gain *
    (Autothrust_P.ktstomps_Gain * rtb_Switch_dx))), Autothrust_P.WashoutFilter_C1, Autothrust_U.in.time.dt,
    &rtb_Switch_m, &Autothrust_DWork.sf_WashoutFilter);
  u0 = Autothrust_P.kntoms_Gain * Autothrust_U.in.data.V_gnd_kn;
  if (u0 > Autothrust_P.Saturation_UpperSat_d) {
    u0 = Autothrust_P.Saturation_UpperSat_d;
  } else if (u0 < Autothrust_P.Saturation_LowerSat_e) {
    u0 = Autothrust_P.Saturation_LowerSat_e;
  }

  Autothrust_LeadLagFilter(rtb_Switch_m - Autothrust_P.g_Gain * (Autothrust_P.Gain1_Gain_c * (Autothrust_P.Gain_Gain_j *
    ((rtb_y_o - Autothrust_P.Gain1_Gain_j * (Autothrust_P.Gain_Gain_c * std::atan(Autothrust_P.fpmtoms_Gain *
    Autothrust_U.in.data.H_dot_fpm / u0))) * (Autothrust_P.Constant_Value - rtb_Cos) + rtb_Cos1 * std::sin
     (Autothrust_P.Gain1_Gain_d * Autothrust_U.in.data.Psi_magnetic_track_deg - Autothrust_P.Gain1_Gain_f *
      Autothrust_U.in.data.Psi_magnetic_deg)))), Autothrust_P.HighPassFilter_C1, Autothrust_P.HighPassFilter_C2,
    Autothrust_P.HighPassFilter_C3, Autothrust_P.HighPassFilter_C4, Autothrust_U.in.time.dt, &rtb_Switch_dx,
    &Autothrust_DWork.sf_LeadLagFilter);
  if (Autothrust_U.in.data.V_ias_kn > Autothrust_P.Saturation1_UpperSat_c) {
    rtb_Switch_m = Autothrust_P.Saturation1_UpperSat_c;
  } else if (Autothrust_U.in.data.V_ias_kn < Autothrust_P.Saturation1_LowerSat_g) {
    rtb_Switch_m = Autothrust_P.Saturation1_LowerSat_g;
  } else {
    rtb_Switch_m = Autothrust_U.in.data.V_ias_kn;
  }

  Autothrust_LeadLagFilter(Autothrust_P.ktstomps_Gain_h * rtb_Switch_m, Autothrust_P.LowPassFilter_C1,
    Autothrust_P.LowPassFilter_C2, Autothrust_P.LowPassFilter_C3, Autothrust_P.LowPassFilter_C4, Autothrust_U.in.time.dt,
    &rtb_Switch_m, &Autothrust_DWork.sf_LeadLagFilter_h);
  rtb_Cos1 = (rtb_Switch_dx + rtb_Switch_m) * Autothrust_P.ktstomps1_Gain * Autothrust_P.Gain4_Gain * look1_binlxpw
    (rtb_Y_f, Autothrust_P.ScheduledGain1_BreakpointsForDimension1, Autothrust_P.ScheduledGain1_Table, 4U) + rtb_Y_f;
  rtb_Cos = Autothrust_P.DiscreteDerivativeVariableTs_Gain * rtb_Cos1;
  Autothrust_LagFilter((rtb_Cos - Autothrust_DWork.Delay_DSTATE) / Autothrust_U.in.time.dt, Autothrust_P.LagFilter_C1,
                       Autothrust_U.in.time.dt, &rtb_Y_f, &Autothrust_DWork.sf_LagFilter);
  Autothrust_LagFilter(Autothrust_U.in.data.nz_g, Autothrust_P.LagFilter1_C1, Autothrust_U.in.time.dt, &rtb_y_o,
                       &Autothrust_DWork.sf_LagFilter_k);
  rtb_Gain2 = rtb_y_o - std::cos(Autothrust_P.Gain1_Gain_p * rtb_Gain2) / std::cos(Autothrust_P.Gain1_Gain_di *
    rtb_Gain3);
  Autothrust_WashoutFilter(Autothrust_P.Gain2_Gain_c * rtb_Gain2, Autothrust_P.WashoutFilter_C1_c,
    Autothrust_U.in.time.dt, &rtb_Switch_dx, &Autothrust_DWork.sf_WashoutFilter_h);
  if (Autothrust_U.in.input.mode_requested > Autothrust_P.Saturation_UpperSat_l) {
    rtb_Switch_m = Autothrust_P.Saturation_UpperSat_l;
  } else if (Autothrust_U.in.input.mode_requested < Autothrust_P.Saturation_LowerSat_i) {
    rtb_Switch_m = Autothrust_P.Saturation_LowerSat_i;
  } else {
    rtb_Switch_m = Autothrust_U.in.input.mode_requested;
  }

  switch (static_cast<int32_T>(rtb_Switch_m)) {
   case 0:
    rtb_Switch_m = Autothrust_P.Constant1_Value;
    break;

   case 1:
    rtb_Switch_m = ((Autothrust_P.Gain_Gain * rtb_Cos1 + rtb_Y_f) + (Autothrust_P.Gain1_Gain * rtb_Gain2 +
      Autothrust_P.Gain3_Gain * rtb_Switch_dx)) * look1_binlxpw(std::fmin
      (rtb_BusAssignment_n.data.commanded_engine_N1_1_percent, rtb_BusAssignment_n.data.commanded_engine_N1_1_percent),
      Autothrust_P.ScheduledGain2_BreakpointsForDimension1, Autothrust_P.ScheduledGain2_Table, 3U) * look1_binlxpw(
      static_cast<real_T>(Autothrust_U.in.input.is_alt_soft_mode_active),
      Autothrust_P.ScheduledGain5_BreakpointsForDimension1, Autothrust_P.ScheduledGain5_Table, 1U);
    break;

   case 2:
    rtb_Switch_m = Autothrust_P.THRIDLE_Value;
    break;

   case 3:
    rtb_Switch_m = Autothrust_P.THRCLBMCT_Value;
    break;

   default:
    rtb_Switch_m = Autothrust_P.RETARD_Value;
    break;
  }

  rtb_Switch_m = Autothrust_P.DiscreteTimeIntegratorVariableTsLimit_Gain * rtb_Switch_m * Autothrust_U.in.time.dt;
  Autothrust_DWork.icLoad = (rtb_NOT || Autothrust_DWork.icLoad);
  if (Autothrust_DWork.icLoad) {
    Autothrust_DWork.Delay_DSTATE_k = std::fmax(rtb_BusAssignment_n.data.commanded_engine_N1_1_percent,
      rtb_BusAssignment_n.data.commanded_engine_N1_2_percent) - rtb_Switch_m;
  }

  Autothrust_DWork.Delay_DSTATE_k += rtb_Switch_m;
  if (Autothrust_DWork.Delay_DSTATE_k > Theta_rad) {
    Autothrust_DWork.Delay_DSTATE_k = Theta_rad;
  } else if (Autothrust_DWork.Delay_DSTATE_k < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
    Autothrust_DWork.Delay_DSTATE_k = Autothrust_U.in.input.thrust_limit_IDLE_percent;
  }

  Autothrust_DWork.icLoad_c = (rtb_NOT || Autothrust_DWork.icLoad_c);
  if (Autothrust_DWork.icLoad_c) {
    Autothrust_DWork.Delay_DSTATE_j = Autothrust_DWork.Delay_DSTATE_k;
  }

  if (Autothrust_U.in.input.mode_requested == 4.0) {
    i = -10;
  } else {
    i = -3;
  }

  Autothrust_DWork.Delay_DSTATE_j += std::fmax(std::fmin(Autothrust_DWork.Delay_DSTATE_k -
    Autothrust_DWork.Delay_DSTATE_j, 3.0 * Autothrust_U.in.time.dt), Autothrust_U.in.time.dt * static_cast<real_T>(i));
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
    } else {
      if (Autothrust_DWork.Delay_DSTATE_j > rtb_Saturation) {
        rtb_Gain2 = rtb_Saturation;
      } else if (Autothrust_DWork.Delay_DSTATE_j < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
        rtb_Gain2 = Autothrust_U.in.input.thrust_limit_IDLE_percent;
      } else {
        rtb_Gain2 = Autothrust_DWork.Delay_DSTATE_j;
      }

      if (Autothrust_DWork.Delay_DSTATE_j > Phi_rad) {
        rtb_Gain3 = Phi_rad;
      } else if (Autothrust_DWork.Delay_DSTATE_j < Autothrust_U.in.input.thrust_limit_IDLE_percent) {
        rtb_Gain3 = Autothrust_U.in.input.thrust_limit_IDLE_percent;
      } else {
        rtb_Gain3 = Autothrust_DWork.Delay_DSTATE_j;
      }
    }
  } else if (Autothrust_DWork.pThrustMemoActive) {
    rtb_Gain2 = rtb_BusAssignment_n.data.commanded_engine_N1_1_percent;
    rtb_Gain3 = rtb_BusAssignment_n.data.commanded_engine_N1_2_percent;
  } else {
    rtb_Gain2 = rtb_Saturation;
    rtb_Gain3 = Phi_rad;
  }

  rtb_Switch_m = rtb_Gain2 - rtb_BusAssignment_n.data.commanded_engine_N1_1_percent;
  if (rtb_Compare_e) {
    Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  Autothrust_DWork.Delay_DSTATE_n += Autothrust_P.Gain_Gain_d3 * rtb_Switch_m *
    Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_n > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (Autothrust_DWork.Delay_DSTATE_n < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  if (!rtb_Compare_e) {
    Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
  }

  Autothrust_DWork.Delay_DSTATE_l += Autothrust_P.Gain1_Gain_h * rtb_Switch_m *
    Autothrust_P.DiscreteTimeIntegratorVariableTs1_Gain * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_l > Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit) {
    Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit;
  } else if (Autothrust_DWork.Delay_DSTATE_l < Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit) {
    Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit;
  }

  Autothrust_ThrustMode1(Autothrust_U.in.input.TLA_1_deg, &Theta_rad);
  rtb_Switch_dx = rtb_Gain3 - rtb_BusAssignment_n.data.commanded_engine_N1_2_percent;
  if (rtb_NOT1_m) {
    Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_n;
  }

  rtb_y_o = Autothrust_P.Gain_Gain_b * rtb_Switch_dx * Autothrust_P.DiscreteTimeIntegratorVariableTs_Gain_k *
    Autothrust_U.in.time.dt + Autothrust_DWork.Delay_DSTATE_lz;
  if (rtb_y_o > Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_p) {
    Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_UpperLimit_p;
  } else if (rtb_y_o < Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_e) {
    Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_LowerLimit_e;
  } else {
    Autothrust_DWork.Delay_DSTATE_lz = rtb_y_o;
  }

  if (!rtb_NOT1_m) {
    Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_e;
  }

  Autothrust_DWork.Delay_DSTATE_h += Autothrust_P.Gain1_Gain_g * rtb_Switch_dx *
    Autothrust_P.DiscreteTimeIntegratorVariableTs1_Gain_l * Autothrust_U.in.time.dt;
  if (Autothrust_DWork.Delay_DSTATE_h > Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_o) {
    Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_o;
  } else if (Autothrust_DWork.Delay_DSTATE_h < Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_h) {
    Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_h;
  }

  Autothrust_ThrustMode1(Autothrust_U.in.input.TLA_2_deg, &rtb_y_o);
  Autothrust_Y.out.time = Autothrust_U.in.time;
  Autothrust_Y.out.data = rtb_BusAssignment_n.data;
  Autothrust_Y.out.data_computed.TLA_in_active_range = rtb_out;
  Autothrust_Y.out.data_computed.is_FLX_active = rtb_y_e;
  Autothrust_Y.out.data_computed.ATHR_push = rtb_BusAssignment_n.data_computed.ATHR_push;
  Autothrust_Y.out.data_computed.ATHR_disabled = Autothrust_DWork.Memory_PreviousInput;
  Autothrust_Y.out.data_computed.time_since_touchdown = rtb_BusAssignment_n.data_computed.time_since_touchdown;
  Autothrust_Y.out.data_computed.alpha_floor_inhibited = Autothrust_DWork.sInhibit;
  Autothrust_Y.out.input = Autothrust_U.in.input;
  if (!rtb_Compare_e) {
    Autothrust_Y.out.output.sim_throttle_lever_1_pos = Autothrust_DWork.Delay_DSTATE_n;
  } else {
    Autothrust_Y.out.output.sim_throttle_lever_1_pos = Autothrust_DWork.Delay_DSTATE_l;
  }

  if (!rtb_NOT1_m) {
    Autothrust_Y.out.output.sim_throttle_lever_2_pos = Autothrust_DWork.Delay_DSTATE_lz;
  } else {
    Autothrust_Y.out.output.sim_throttle_lever_2_pos = Autothrust_DWork.Delay_DSTATE_h;
  }

  Autothrust_Y.out.output.sim_thrust_mode_1 = Theta_rad;
  Autothrust_Y.out.output.sim_thrust_mode_2 = rtb_y_o;
  Autothrust_Y.out.output.N1_TLA_1_percent = rtb_Saturation;
  Autothrust_Y.out.output.N1_TLA_2_percent = Phi_rad;
  Autothrust_Y.out.output.is_in_reverse_1 = rtb_Compare_e;
  Autothrust_Y.out.output.is_in_reverse_2 = rtb_NOT1_m;
  Autothrust_Y.out.output.N1_c_1_percent = rtb_Gain2;
  Autothrust_Y.out.output.N1_c_2_percent = rtb_Gain3;
  Autothrust_Y.out.output.status = status;
  Autothrust_Y.out.output.mode = mode;
  rtb_out = !Autothrust_DWork.inhibitAboveThrustReductionAltitude;
  condition_TOGA = (((!Autothrust_U.in.input.is_SRS_TO_mode_active) || ((Autothrust_U.in.data.H_ind_ft >=
    Autothrust_U.in.input.thrust_reduction_altitude) && rtb_out)) && ((!Autothrust_U.in.input.is_SRS_GA_mode_active) ||
    ((Autothrust_U.in.data.H_ind_ft >= Autothrust_U.in.input.thrust_reduction_altitude_go_around) && rtb_out)) &&
                    ((Autothrust_U.in.data.H_radio_ft > 400.0) || (Autothrust_U.in.input.flight_phase > 2.0)) && (tmp ||
    (Autothrust_U.in.input.target_TCAS_RA_rate_fpm <= 500.0) || (Autothrust_U.in.input.TLA_1_deg <= 25.0) ||
    (Autothrust_U.in.input.TLA_2_deg <= 25.0)));
  if ((status != athr_status_DISENGAGED) && (Autothrust_DWork.pMode != athr_mode_A_FLOOR) && (Autothrust_DWork.pMode !=
       athr_mode_TOGA_LK) && (rtb_on_ground == 0) && (condition_TOGA || (Autothrust_U.in.input.is_TCAS_active &&
        (Autothrust_U.in.data.H_ind_ft < Autothrust_U.in.input.thrust_reduction_altitude) &&
        ((Autothrust_U.in.data.V_ias_kn > Autothrust_U.in.input.V_MAX_kn - 20.0) ||
         (Autothrust_U.in.input.target_TCAS_RA_rate_fpm <= 500.0)))) && Autothrust_U.in.data.is_engine_operative_1 &&
      Autothrust_U.in.data.is_engine_operative_2 && (((Autothrust_U.in.input.TLA_1_deg < 25.0) &&
        (Autothrust_U.in.input.TLA_2_deg < 25.0)) || (Autothrust_U.in.input.TLA_1_deg > 25.0) ||
       (Autothrust_U.in.input.TLA_2_deg > 25.0))) {
    Autothrust_Y.out.output.mode_message = athr_mode_message_LVR_CLB;
  } else if ((status != athr_status_DISENGAGED) && (Autothrust_DWork.pMode != athr_mode_A_FLOOR) &&
             (Autothrust_DWork.pMode != athr_mode_TOGA_LK) && (rtb_on_ground == 0) && condition_TOGA &&
             (condition_AP_FD_ATHR_Specific || condition_AlphaFloor_tmp) && (Autothrust_U.in.input.TLA_1_deg != 35.0) &&
             (Autothrust_U.in.input.TLA_2_deg != 35.0)) {
    Autothrust_Y.out.output.mode_message = athr_mode_message_LVR_MCT;
  } else if ((status == athr_status_ENGAGED_ACTIVE) && Autothrust_U.in.data.is_engine_operative_1 &&
             Autothrust_U.in.data.is_engine_operative_2 && (((Autothrust_U.in.input.TLA_1_deg == 25.0) &&
               (Autothrust_U.in.input.TLA_2_deg != 25.0)) || ((Autothrust_U.in.input.TLA_2_deg == 25.0) &&
               (Autothrust_U.in.input.TLA_1_deg != 25.0)))) {
    Autothrust_Y.out.output.mode_message = athr_mode_message_LVR_ASYM;
  } else if (Autothrust_DWork.condition_THR_LK) {
    Autothrust_Y.out.output.mode_message = athr_mode_message_THR_LK;
  } else {
    Autothrust_Y.out.output.mode_message = athr_mode_message_NONE;
  }

  Autothrust_Y.out.output.thrust_lever_warning_flex = (rtb_BusAssignment_n.data_computed.is_FLX_active && condition02);
  Autothrust_Y.out.output.thrust_lever_warning_toga = ((!rtb_BusAssignment_n.data_computed.is_FLX_active) &&
    ((Autothrust_U.in.time.simulation_time - Autothrust_DWork.eventTime >= 3.0) || condition02));
  Autothrust_DWork.Delay_DSTATE = rtb_Cos;
  Autothrust_DWork.icLoad = false;
  Autothrust_DWork.icLoad_c = false;
}

void AutothrustModelClass::initialize()
{
  Autothrust_DWork.Memory_PreviousInput = Autothrust_P.SRFlipFlop_initial_condition;
  Autothrust_DWork.Delay_DSTATE_a = Autothrust_P.Delay_InitialCondition;
  Autothrust_DWork.Memory_PreviousInput_m = Autothrust_P.SRFlipFlop_initial_condition_g;
  Autothrust_DWork.Delay_DSTATE = Autothrust_P.DiscreteDerivativeVariableTs_InitialCondition;
  Autothrust_DWork.icLoad = true;
  Autothrust_DWork.icLoad_c = true;
  Autothrust_DWork.Delay_DSTATE_n = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition;
  Autothrust_DWork.Delay_DSTATE_l = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition;
  Autothrust_DWork.Delay_DSTATE_lz = Autothrust_P.DiscreteTimeIntegratorVariableTs_InitialCondition_n;
  Autothrust_DWork.Delay_DSTATE_h = Autothrust_P.DiscreteTimeIntegratorVariableTs1_InitialCondition_e;
}

void AutothrustModelClass::terminate()
{
}

AutothrustModelClass::AutothrustModelClass():
  Autothrust_U(),
  Autothrust_Y(),
  Autothrust_DWork()
{
}

AutothrustModelClass::~AutothrustModelClass()
{
}
