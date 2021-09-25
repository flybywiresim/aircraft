#include "FlyByWire.h"
#include "FlyByWire_private.h"
#include "look1_binlxpw.h"
#include "look2_binlxpw.h"

const uint8_T FlyByWire_IN_InAir = 1U;
const uint8_T FlyByWire_IN_OnGround = 2U;
const uint8_T FlyByWire_IN_Flying = 1U;
const uint8_T FlyByWire_IN_Landed = 2U;
const uint8_T FlyByWire_IN_Landing100ft = 3U;
const uint8_T FlyByWire_IN_Takeoff100ft = 4U;
const uint8_T FlyByWire_IN_Flare_Reduce_Theta_c = 1U;
const uint8_T FlyByWire_IN_Flare_Set_Rate = 2U;
const uint8_T FlyByWire_IN_Flare_Store_Theta_c_deg = 3U;
const uint8_T FlyByWire_IN_Flight_High = 4U;
const uint8_T FlyByWire_IN_Flight_Low = 5U;
const uint8_T FlyByWire_IN_Ground = 6U;
const uint8_T FlyByWire_IN_frozen = 1U;
const uint8_T FlyByWire_IN_running = 2U;
const uint8_T FlyByWire_IN_Flight = 1U;
const uint8_T FlyByWire_IN_FlightToGroundTransition = 2U;
const uint8_T FlyByWire_IN_Ground_d = 3U;
const uint8_T FlyByWire_IN_automatic = 1U;
const uint8_T FlyByWire_IN_manual = 2U;
const uint8_T FlyByWire_IN_reset = 3U;
const uint8_T FlyByWire_IN_tracking = 4U;
const uint8_T FlyByWire_IN_flight_clean = 1U;
const uint8_T FlyByWire_IN_flight_flaps = 2U;
const uint8_T FlyByWire_IN_ground = 3U;
const uint8_T FlyByWire_IN_OFF = 1U;
const uint8_T FlyByWire_IN_ON = 2U;
const uint8_T FlyByWire_IN_FlightMode = 1U;
const uint8_T FlyByWire_IN_GroundMode = 2U;
void FlyByWireModelClass::FlyByWire_GetIASforMach4(real_T rtu_m, real_T rtu_m_t, real_T rtu_v, real_T *rty_v_t)
{
  *rty_v_t = rtu_v * rtu_m_t / rtu_m;
}

void FlyByWireModelClass::FlyByWire_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_FlyByWire_T *localDW)
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

void FlyByWireModelClass::FlyByWire_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_FlyByWire_T *localDW)
{
  real_T u0;
  real_T u1;
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  u0 = rtu_u - localDW->pY;
  u1 = std::abs(rtu_up) * rtu_Ts;
  if (u0 < u1) {
    u1 = u0;
  }

  u0 = -std::abs(rtu_lo) * rtu_Ts;
  if (u1 > u0) {
    u0 = u1;
  }

  localDW->pY += u0;
  *rty_Y = localDW->pY;
}

void FlyByWireModelClass::FlyByWire_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_FlyByWire_T *localDW)
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

void FlyByWireModelClass::FlyByWire_eta_trim_limit_lofreeze(real_T rtu_eta_trim, real_T rtu_trigger, real_T *rty_y,
  rtDW_eta_trim_limit_lofreeze_FlyByWire_T *localDW)
{
  if ((rtu_trigger == 0.0) || (!localDW->frozen_eta_trim_not_empty)) {
    localDW->frozen_eta_trim = rtu_eta_trim;
    localDW->frozen_eta_trim_not_empty = true;
  }

  *rty_y = localDW->frozen_eta_trim;
}

void FlyByWireModelClass::FlyByWire_ConvertToEuler(real_T rtu_Theta, real_T rtu_Phi, real_T rtu_q, real_T rtu_r, real_T
  rtu_p, real_T *rty_qk, real_T *rty_rk, real_T *rty_pk)
{
  real_T tmp[9];
  real_T result[3];
  real_T Phi;
  real_T Theta;
  real_T result_tmp;
  real_T result_tmp_0;
  int32_T i;
  Theta = 0.017453292519943295 * rtu_Theta;
  Phi = 0.017453292519943295 * rtu_Phi;
  result_tmp = std::tan(Theta);
  result_tmp_0 = std::sin(Phi);
  Phi = std::cos(Phi);
  tmp[0] = 1.0;
  tmp[3] = result_tmp_0 * result_tmp;
  tmp[6] = Phi * result_tmp;
  tmp[1] = 0.0;
  tmp[4] = Phi;
  tmp[7] = -result_tmp_0;
  tmp[2] = 0.0;
  Theta = 1.0 / std::cos(Theta);
  tmp[5] = Theta * result_tmp_0;
  tmp[8] = Theta * Phi;
  for (i = 0; i < 3; i++) {
    result[i] = tmp[i + 6] * rtu_r + (tmp[i + 3] * rtu_q + tmp[i] * rtu_p);
  }

  *rty_qk = result[1];
  *rty_rk = result[2];
  *rty_pk = result[0];
}

void FlyByWireModelClass::FlyByWire_CalculateV_alpha_max(real_T rtu_v_ias, real_T rtu_alpha, real_T rtu_alpha_0, real_T
  rtu_alpha_target, real_T *rty_V_alpha_target)
{
  *rty_V_alpha_target = std::sqrt(std::abs(rtu_alpha - rtu_alpha_0) / (rtu_alpha_target - rtu_alpha_0)) * rtu_v_ias;
}

void FlyByWireModelClass::step()
{
  real_T rtb_BusAssignment_a_sim_data_pk_deg_s;
  real_T rtb_BusAssignment_a_sim_data_qk_dot_deg_s2;
  real_T rtb_BusAssignment_c_sim_data_speeds_aoa_alpha_max_deg;
  real_T rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg;
  real_T rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_lo;
  real_T rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_up;
  real_T rtb_BusAssignment_cs_pitch_data_computed_in_flight_gain;
  real_T rtb_BusAssignment_cs_pitch_data_computed_in_rotation_gain;
  real_T rtb_BusAssignment_cs_pitch_data_computed_nz_limit_lo_g;
  real_T rtb_BusAssignment_p_roll_data_computed_delta_xi_deg;
  real_T rtb_BusAssignment_p_roll_data_computed_in_flight_gain;
  real_T rtb_BusAssignment_sim_data_zeta_trim_deg;
  real_T rtb_BusAssignment_sim_input_delta_eta_pos;
  real_T rtb_BusAssignment_sim_input_delta_xi_pos;
  real_T rtb_BusAssignment_sim_input_delta_zeta_pos;
  real_T rtb_Divide1;
  real_T rtb_Divide_e;
  real_T rtb_Divide_m;
  real_T rtb_Gain;
  real_T rtb_Gain1_b;
  real_T rtb_Gain1_o;
  real_T rtb_GainPhi;
  real_T rtb_GainTheta;
  real_T rtb_Gain_g;
  real_T rtb_Gain_i;
  real_T rtb_Gain_iw;
  real_T rtb_Gain_kh;
  real_T rtb_Gain_oj;
  real_T rtb_Gainpk;
  real_T rtb_Gainpk2;
  real_T rtb_Gainpk4;
  real_T rtb_Gainqk;
  real_T rtb_Limitereta;
  real_T rtb_Limitereta_d;
  real_T rtb_LimiteriH;
  real_T rtb_LimiteriH_n;
  real_T rtb_Limiterxi;
  real_T rtb_Limiterxi1;
  real_T rtb_Limiterxi2;
  real_T rtb_Limiterxi_o;
  real_T rtb_Loaddemand;
  real_T rtb_ManualSwitch;
  real_T rtb_Min3;
  real_T rtb_Min5;
  real_T rtb_Product_e;
  real_T rtb_Sum1_c;
  real_T rtb_Sum1_d5;
  real_T rtb_Switch;
  real_T rtb_Switch_c;
  real_T rtb_Y;
  real_T rtb_Y_c;
  real_T rtb_Y_i;
  real_T rtb_Y_k;
  real_T rtb_Y_o;
  real_T rtb_eta_trim_deg_rate_limit_lo_deg_s;
  real_T rtb_nz_limit_up_g;
  real_T rtb_qk;
  real_T rtb_v_target;
  real_T u0;
  real_T u0_0;
  int32_T rtb_alpha_floor_inhib;
  int32_T rtb_ap_special_disc;
  int32_T rtb_in_flare;
  int32_T rtb_nz_limit_lo_g;
  int32_T rtb_on_ground;
  boolean_T guard1 = false;
  boolean_T rtb_AND;
  boolean_T rtb_NOT2;
  boolean_T rtb_eta_trim_deg_reset;
  boolean_T rtb_eta_trim_deg_should_freeze;
  boolean_T rtb_eta_trim_deg_should_write;
  FlyByWire_DWork.Delay_DSTATE += FlyByWire_U.in.time.dt;
  rtb_GainTheta = FlyByWire_P.GainTheta_Gain * FlyByWire_U.in.data.Theta_deg;
  rtb_GainPhi = FlyByWire_P.GainPhi_Gain * FlyByWire_U.in.data.Phi_deg;
  rtb_Gainqk = FlyByWire_P.Gain_Gain_n * FlyByWire_U.in.data.q_rad_s * FlyByWire_P.Gainqk_Gain;
  rtb_Gain = FlyByWire_P.Gain_Gain_l * FlyByWire_U.in.data.r_rad_s;
  rtb_Gainpk = FlyByWire_P.Gain_Gain_a * FlyByWire_U.in.data.p_rad_s * FlyByWire_P.Gainpk_Gain;
  FlyByWire_ConvertToEuler(rtb_GainTheta, rtb_GainPhi, rtb_Gainqk, rtb_Gain, rtb_Gainpk, &rtb_qk, &rtb_Y, &rtb_Y_o);
  FlyByWire_ConvertToEuler(rtb_GainTheta, rtb_GainPhi, FlyByWire_P.Gainqk1_Gain * (FlyByWire_P.Gain_Gain_e *
    FlyByWire_U.in.data.q_dot_rad_s2), FlyByWire_P.Gain_Gain_aw * FlyByWire_U.in.data.r_dot_rad_s2,
    FlyByWire_P.Gainpk1_Gain * (FlyByWire_P.Gain_Gain_nm * FlyByWire_U.in.data.p_dot_rad_s2), &rtb_Y_c, &rtb_Y_i,
    &rtb_Y_k);
  rtb_Gainpk4 = FlyByWire_P.Gainpk4_Gain * FlyByWire_U.in.data.eta_pos;
  rtb_Gainpk2 = FlyByWire_P.Gainpk2_Gain * FlyByWire_U.in.data.eta_trim_deg;
  rtb_Limiterxi2 = FlyByWire_P.Gainpk6_Gain * FlyByWire_U.in.data.zeta_pos;
  rtb_Limiterxi1 = FlyByWire_P.Gainpk3_Gain * FlyByWire_U.in.data.zeta_trim_pos;
  u0 = FlyByWire_P.Gain1_Gain_h * FlyByWire_U.in.data.gear_animation_pos_1 - FlyByWire_P.Constant_Value_g;
  if (u0 > FlyByWire_P.Saturation1_UpperSat_g) {
    u0 = FlyByWire_P.Saturation1_UpperSat_g;
  } else if (u0 < FlyByWire_P.Saturation1_LowerSat_j) {
    u0 = FlyByWire_P.Saturation1_LowerSat_j;
  }

  u0_0 = FlyByWire_P.Gain2_Gain_a * FlyByWire_U.in.data.gear_animation_pos_2 - FlyByWire_P.Constant_Value_g;
  if (u0_0 > FlyByWire_P.Saturation2_UpperSat_b) {
    u0_0 = FlyByWire_P.Saturation2_UpperSat_b;
  } else if (u0_0 < FlyByWire_P.Saturation2_LowerSat_g) {
    u0_0 = FlyByWire_P.Saturation2_LowerSat_g;
  }

  rtb_Gain1_b = FlyByWire_P.Gaineta_Gain * FlyByWire_U.in.input.delta_eta_pos;
  rtb_LimiteriH = FlyByWire_P.Gainxi_Gain * FlyByWire_U.in.input.delta_xi_pos;
  rtb_Limiterxi = FlyByWire_P.Gainxi1_Gain * FlyByWire_U.in.input.delta_zeta_pos;
  FlyByWire_Y.out.sim.data.zeta_deg = rtb_Limiterxi2;
  rtb_BusAssignment_sim_data_zeta_trim_deg = rtb_Limiterxi1;
  rtb_BusAssignment_sim_input_delta_eta_pos = rtb_Gain1_b;
  rtb_BusAssignment_sim_input_delta_xi_pos = rtb_LimiteriH;
  rtb_BusAssignment_sim_input_delta_zeta_pos = rtb_Limiterxi;
  FlyByWire_LagFilter(FlyByWire_U.in.data.alpha_deg, FlyByWire_P.LagFilter_C1, FlyByWire_U.in.time.dt, &rtb_Limiterxi1,
                      &FlyByWire_DWork.sf_LagFilter_n);
  FlyByWire_RateLimiter(look2_binlxpw(FlyByWire_U.in.data.V_mach, FlyByWire_U.in.data.flaps_handle_index,
    FlyByWire_P.alphamax_bp01Data, FlyByWire_P.alphamax_bp02Data, FlyByWire_P.alphamax_tableData,
    FlyByWire_P.alphamax_maxIndex, 4U), FlyByWire_P.RateLimiterVariableTs2_up, FlyByWire_P.RateLimiterVariableTs2_lo,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimiterVariableTs2_InitialCondition, &rtb_LimiteriH,
                        &FlyByWire_DWork.sf_RateLimiter_pr);
  FlyByWire_RateLimiter(look1_binlxpw(FlyByWire_U.in.data.flaps_handle_index, FlyByWire_P.alpha0_bp01Data,
    FlyByWire_P.alpha0_tableData, 5U), FlyByWire_P.RateLimiterVariableTs3_up, FlyByWire_P.RateLimiterVariableTs3_lo,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimiterVariableTs3_InitialCondition, &rtb_Gain1_b,
                        &FlyByWire_DWork.sf_RateLimiter_b5);
  FlyByWire_CalculateV_alpha_max(FlyByWire_U.in.data.V_ias_kn, rtb_Limiterxi1, rtb_Gain1_b, rtb_LimiteriH,
    &rtb_Limiterxi2);
  if (!FlyByWire_DWork.eventTime_not_empty) {
    FlyByWire_DWork.eventTime = FlyByWire_U.in.time.simulation_time;
    FlyByWire_DWork.eventTime_not_empty = true;
  }

  if ((FlyByWire_P.fbw_output_MATLABStruct.sim.data_computed.on_ground != 0.0) || (FlyByWire_DWork.eventTime == 0.0)) {
    FlyByWire_DWork.eventTime = FlyByWire_U.in.time.simulation_time;
  }

  FlyByWire_RateLimiter(look2_binlxpw(FlyByWire_U.in.data.V_mach, FlyByWire_U.in.data.flaps_handle_index,
    FlyByWire_P.alphaprotection_bp01Data, FlyByWire_P.alphaprotection_bp02Data, FlyByWire_P.alphaprotection_tableData,
    FlyByWire_P.alphaprotection_maxIndex, 4U), FlyByWire_P.RateLimiterVariableTs_up,
                        FlyByWire_P.RateLimiterVariableTs_lo, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs_InitialCondition, &rtb_Limiterxi,
                        &FlyByWire_DWork.sf_RateLimiter_e);
  if (FlyByWire_U.in.time.simulation_time - FlyByWire_DWork.eventTime <= FlyByWire_P.CompareToConstant_const) {
    rtb_Switch = rtb_LimiteriH;
  } else {
    rtb_Switch = rtb_Limiterxi;
  }

  FlyByWire_CalculateV_alpha_max(FlyByWire_U.in.data.V_ias_kn, rtb_Limiterxi1, rtb_Gain1_b, rtb_Switch, &rtb_Limiterxi);
  FlyByWire_RateLimiter(look2_binlxpw(FlyByWire_U.in.data.V_mach, FlyByWire_U.in.data.flaps_handle_index,
    FlyByWire_P.alphafloor_bp01Data, FlyByWire_P.alphafloor_bp02Data, FlyByWire_P.alphafloor_tableData,
    FlyByWire_P.alphafloor_maxIndex, 4U), FlyByWire_P.RateLimiterVariableTs1_up, FlyByWire_P.RateLimiterVariableTs1_lo,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimiterVariableTs1_InitialCondition, &rtb_Gain1_b,
                        &FlyByWire_DWork.sf_RateLimiter_bu);
  FlyByWire_Y.out.sim.data.rk_dot_deg_s2 = rtb_Y_i;
  FlyByWire_Y.out.sim.data.pk_dot_deg_s2 = rtb_Y_k;
  rtb_BusAssignment_c_sim_data_speeds_aoa_alpha_max_deg = rtb_LimiteriH;
  FlyByWire_Y.out.sim.data_speeds_aoa.alpha_floor_deg = rtb_Gain1_b;
  if (FlyByWire_DWork.is_active_c1_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c1_FlyByWire = 1U;
    FlyByWire_DWork.is_c1_FlyByWire = FlyByWire_IN_OnGround;
    rtb_on_ground = 1;
  } else if (FlyByWire_DWork.is_c1_FlyByWire == 1) {
    if ((u0 > 0.1) || (u0_0 > 0.1)) {
      FlyByWire_DWork.is_c1_FlyByWire = FlyByWire_IN_OnGround;
      rtb_on_ground = 1;
    } else {
      rtb_on_ground = 0;
    }
  } else if ((u0 == 0.0) && (u0_0 == 0.0)) {
    FlyByWire_DWork.is_c1_FlyByWire = FlyByWire_IN_InAir;
    rtb_on_ground = 0;
  } else {
    rtb_on_ground = 1;
  }

  if (!FlyByWire_DWork.resetEventTime_not_empty) {
    FlyByWire_DWork.resetEventTime = FlyByWire_U.in.time.simulation_time;
    FlyByWire_DWork.resetEventTime_not_empty = true;
  }

  if ((rtb_BusAssignment_sim_input_delta_eta_pos >= -0.03125) || (rtb_Limiterxi1 >= rtb_LimiteriH) ||
      (FlyByWire_DWork.resetEventTime == 0.0)) {
    FlyByWire_DWork.resetEventTime = FlyByWire_U.in.time.simulation_time;
  }

  if ((rtb_on_ground == 0) && (FlyByWire_U.in.data.autopilot_custom_on == 0.0) && (rtb_Limiterxi1 > rtb_Switch) &&
      (FlyByWire_DWork.Delay_DSTATE > 10.0)) {
    FlyByWire_DWork.sProtActive_k = 1.0;
  }

  if ((FlyByWire_U.in.time.simulation_time - FlyByWire_DWork.resetEventTime > 0.5) ||
      (rtb_BusAssignment_sim_input_delta_eta_pos < -0.5) || ((FlyByWire_U.in.data.H_radio_ft < 200.0) &&
       (rtb_BusAssignment_sim_input_delta_eta_pos < 0.5) && (rtb_Limiterxi1 < rtb_Switch - 2.0)) || (rtb_on_ground != 0))
  {
    FlyByWire_DWork.sProtActive_k = 0.0;
  }

  rtb_Gain_kh = FlyByWire_P.DiscreteDerivativeVariableTs_Gain * FlyByWire_U.in.data.V_ias_kn;
  FlyByWire_LagFilter((rtb_Gain_kh - FlyByWire_DWork.Delay_DSTATE_d) / FlyByWire_U.in.time.dt,
                      FlyByWire_P.LagFilter_C1_a, FlyByWire_U.in.time.dt, &rtb_Y_k, &FlyByWire_DWork.sf_LagFilter);
  if (FlyByWire_DWork.is_active_c15_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c15_FlyByWire = 1U;
    FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Landed;
    rtb_alpha_floor_inhib = 1;
    rtb_ap_special_disc = 0;
  } else {
    switch (FlyByWire_DWork.is_c15_FlyByWire) {
     case FlyByWire_IN_Flying:
      if (FlyByWire_U.in.data.H_radio_ft < 100.0) {
        FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Landing100ft;
        rtb_alpha_floor_inhib = 1;
        rtb_ap_special_disc = 1;
      } else if (rtb_on_ground != 0) {
        FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Landed;
        rtb_alpha_floor_inhib = 1;
        rtb_ap_special_disc = 0;
      } else {
        rtb_alpha_floor_inhib = 0;
        rtb_ap_special_disc = 0;
      }
      break;

     case FlyByWire_IN_Landed:
      if (rtb_on_ground == 0) {
        FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Takeoff100ft;
        rtb_alpha_floor_inhib = 0;
        rtb_ap_special_disc = 0;
      } else {
        rtb_alpha_floor_inhib = 1;
        rtb_ap_special_disc = 0;
      }
      break;

     case FlyByWire_IN_Landing100ft:
      if (FlyByWire_U.in.data.H_radio_ft > 100.0) {
        FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Flying;
        rtb_alpha_floor_inhib = 0;
        rtb_ap_special_disc = 0;
      } else if (rtb_on_ground != 0) {
        FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Landed;
        rtb_alpha_floor_inhib = 1;
        rtb_ap_special_disc = 0;
      } else {
        rtb_alpha_floor_inhib = 1;
        rtb_ap_special_disc = 1;
      }
      break;

     default:
      if (rtb_on_ground != 0) {
        FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Landed;
        rtb_alpha_floor_inhib = 1;
        rtb_ap_special_disc = 0;
      } else if (FlyByWire_U.in.data.H_radio_ft > 100.0) {
        FlyByWire_DWork.is_c15_FlyByWire = FlyByWire_IN_Flying;
        rtb_alpha_floor_inhib = 0;
        rtb_ap_special_disc = 0;
      } else {
        rtb_alpha_floor_inhib = 0;
        rtb_ap_special_disc = 0;
      }
      break;
    }
  }

  guard1 = false;
  if ((rtb_alpha_floor_inhib == 0) && (FlyByWire_U.in.data.V_mach < 0.6)) {
    if (FlyByWire_U.in.data.flaps_handle_index >= 4.0) {
      rtb_nz_limit_lo_g = -3;
    } else {
      rtb_nz_limit_lo_g = 0;
    }

    if (rtb_Y_k <= rtb_nz_limit_lo_g) {
      rtb_Y_k = rtb_nz_limit_lo_g;
    }

    if (rtb_Y_k >= 0.0) {
      rtb_Y_k = 0.0;
    }

    if ((rtb_Limiterxi1 > rtb_Gain1_b + rtb_Y_k) && (FlyByWire_DWork.Delay_DSTATE > 10.0)) {
      FlyByWire_DWork.sAlphaFloor = 1.0;
    } else {
      guard1 = true;
    }
  } else {
    guard1 = true;
  }

  if (guard1) {
    if ((rtb_alpha_floor_inhib != 0) || (FlyByWire_DWork.sProtActive_k == 0.0)) {
      FlyByWire_DWork.sAlphaFloor = 0.0;
    }
  }

  FlyByWire_GetIASforMach4(FlyByWire_U.in.data.V_mach, FlyByWire_P.Constant6_Value, FlyByWire_U.in.data.V_ias_kn,
    &rtb_Y_i);
  if (FlyByWire_P.Constant5_Value < rtb_Y_i) {
    rtb_Min3 = FlyByWire_P.Constant5_Value;
  } else {
    rtb_Min3 = rtb_Y_i;
  }

  rtb_LimiteriH = rtb_GainTheta - std::cos(FlyByWire_P.Gain1_Gain_c * rtb_GainPhi) * FlyByWire_U.in.data.alpha_deg;
  if (FlyByWire_U.in.data.autopilot_custom_on == 0.0) {
    rtb_Sum1_d5 = look1_binlxpw(rtb_LimiteriH, FlyByWire_P.uDLookupTable1_bp01Data, FlyByWire_P.uDLookupTable1_tableData,
      3U);
    rtb_Sum1_c = FlyByWire_U.in.data.V_ias_kn / FlyByWire_U.in.data.V_mach * look1_binlxpw(rtb_LimiteriH,
      FlyByWire_P.uDLookupTable2_bp01Data, FlyByWire_P.uDLookupTable2_tableData, 3U);
    if (rtb_Sum1_d5 < rtb_Sum1_c) {
      rtb_Sum1_c = rtb_Sum1_d5;
    }

    if (FlyByWire_U.in.data.V_ias_kn > rtb_Sum1_c) {
      FlyByWire_DWork.sProtActive = 1.0;
    }
  }

  if ((FlyByWire_U.in.data.V_ias_kn < rtb_Min3) || (FlyByWire_U.in.data.autopilot_custom_on != 0.0)) {
    FlyByWire_DWork.sProtActive = 0.0;
  }

  if (!FlyByWire_DWork.eventTime_not_empty_l) {
    FlyByWire_DWork.eventTime_o = FlyByWire_U.in.time.simulation_time;
    FlyByWire_DWork.eventTime_not_empty_l = true;
  }

  rtb_Sum1_c = FlyByWire_U.in.data.V_ias_kn / FlyByWire_U.in.data.V_mach * (look1_binlxpw(rtb_LimiteriH,
    FlyByWire_P.uDLookupTable_bp01Data, FlyByWire_P.uDLookupTable_tableData, 3U) + 0.01);
  if (365.0 < rtb_Sum1_c) {
    rtb_Sum1_c = 365.0;
  }

  if (FlyByWire_U.in.data.V_ias_kn <= rtb_Sum1_c) {
    FlyByWire_DWork.eventTime_o = FlyByWire_U.in.time.simulation_time;
  } else if (FlyByWire_DWork.eventTime_o == 0.0) {
    FlyByWire_DWork.eventTime_o = FlyByWire_U.in.time.simulation_time;
  }

  FlyByWire_GetIASforMach4(FlyByWire_U.in.data.V_mach, FlyByWire_P.Constant8_Value, FlyByWire_U.in.data.V_ias_kn,
    &rtb_Y_k);
  if (FlyByWire_P.Constant7_Value < rtb_Y_k) {
    rtb_Min5 = FlyByWire_P.Constant7_Value;
  } else {
    rtb_Min5 = rtb_Y_k;
  }

  FlyByWire_Y.out.sim.data.rk_deg_s = rtb_Y;
  rtb_BusAssignment_a_sim_data_pk_deg_s = rtb_Y_o;
  rtb_BusAssignment_a_sim_data_qk_dot_deg_s2 = rtb_Y_c;
  FlyByWire_Y.out.sim.data_speeds_aoa.v_alpha_max_kn = rtb_Limiterxi2;
  FlyByWire_Y.out.sim.data_speeds_aoa.v_alpha_prot_kn = rtb_Limiterxi;
  FlyByWire_Y.out.sim.data_speeds_aoa.alpha_filtered_deg = rtb_Limiterxi1;
  rtb_alpha_floor_inhib = ((FlyByWire_U.in.data.autopilot_master_on != 0.0) || (FlyByWire_U.in.data.slew_on != 0.0) ||
    (FlyByWire_U.in.data.pause_on != 0.0) || (FlyByWire_U.in.data.tracking_mode_on_override != 0.0));
  FlyByWire_Y.out.sim.data_computed.protection_ap_disc = (((rtb_on_ground == 0) && (((rtb_ap_special_disc != 0) &&
    (rtb_Limiterxi1 > rtb_BusAssignment_c_sim_data_speeds_aoa_alpha_max_deg)) || (rtb_Limiterxi1 > rtb_Switch + 0.25))) ||
    (FlyByWire_U.in.time.simulation_time - FlyByWire_DWork.eventTime_o > 3.0) || (FlyByWire_DWork.sProtActive != 0.0) ||
    (FlyByWire_DWork.sProtActive_k != 0.0));
  FlyByWire_eta_trim_limit_lofreeze(rtb_Gainpk2, FlyByWire_DWork.sProtActive_k, &rtb_Y_k,
    &FlyByWire_DWork.sf_eta_trim_limit_lofreeze);
  if (FlyByWire_DWork.sProtActive_k > FlyByWire_P.Switch_Threshold_h) {
    rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_lo = rtb_Y_k;
  } else {
    rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_lo = FlyByWire_P.Constant3_Value;
  }

  FlyByWire_eta_trim_limit_lofreeze(rtb_Gainpk2, FlyByWire_DWork.sProtActive, &rtb_Y_k,
    &FlyByWire_DWork.sf_eta_trim_limit_upfreeze);
  if (FlyByWire_DWork.sProtActive > FlyByWire_P.Switch1_Threshold_k) {
    rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_up = rtb_Y_k;
  } else {
    rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_up = FlyByWire_P.Constant2_Value;
  }

  if (FlyByWire_DWork.is_active_c3_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c3_FlyByWire = 1U;
    FlyByWire_DWork.is_c3_FlyByWire = FlyByWire_IN_Ground_d;
    FlyByWire_B.in_flight = 0.0;
  } else {
    switch (FlyByWire_DWork.is_c3_FlyByWire) {
     case FlyByWire_IN_Flight:
      if ((rtb_on_ground == 1) && (rtb_GainTheta < 2.5)) {
        FlyByWire_DWork.on_ground_time = FlyByWire_U.in.time.simulation_time;
        FlyByWire_DWork.is_c3_FlyByWire = FlyByWire_IN_FlightToGroundTransition;
      } else {
        FlyByWire_B.in_flight = 1.0;
      }
      break;

     case FlyByWire_IN_FlightToGroundTransition:
      if (FlyByWire_U.in.time.simulation_time - FlyByWire_DWork.on_ground_time >= 5.0) {
        FlyByWire_DWork.is_c3_FlyByWire = FlyByWire_IN_Ground_d;
        FlyByWire_B.in_flight = 0.0;
      } else if ((rtb_on_ground == 0) || (rtb_GainTheta >= 2.5)) {
        FlyByWire_DWork.on_ground_time = 0.0;
        FlyByWire_DWork.is_c3_FlyByWire = FlyByWire_IN_Flight;
        FlyByWire_B.in_flight = 1.0;
      }
      break;

     default:
      if (((rtb_on_ground == 0) && (rtb_GainTheta > 8.0)) || (FlyByWire_U.in.data.H_radio_ft > 400.0)) {
        FlyByWire_DWork.on_ground_time = 0.0;
        FlyByWire_DWork.is_c3_FlyByWire = FlyByWire_IN_Flight;
        FlyByWire_B.in_flight = 1.0;
      } else {
        FlyByWire_B.in_flight = 0.0;
      }
      break;
    }
  }

  if (FlyByWire_B.in_flight > FlyByWire_P.Saturation_UpperSat_er) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_UpperSat_er;
  } else if (FlyByWire_B.in_flight < FlyByWire_P.Saturation_LowerSat_a) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_LowerSat_a;
  } else {
    rtb_Sum1_d5 = FlyByWire_B.in_flight;
  }

  FlyByWire_RateLimiter(rtb_Sum1_d5, FlyByWire_P.RateLimiterVariableTs_up_d, FlyByWire_P.RateLimiterVariableTs_lo_c,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimiterVariableTs_InitialCondition_d, &rtb_Y_o,
                        &FlyByWire_DWork.sf_RateLimiter_b);
  if (FlyByWire_DWork.is_active_c6_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c6_FlyByWire = 1U;
    FlyByWire_DWork.is_c6_FlyByWire = FlyByWire_IN_OFF;
    rtb_ap_special_disc = 0;
  } else if (FlyByWire_DWork.is_c6_FlyByWire == 1) {
    if ((rtb_Y_o < 1.0) && (FlyByWire_U.in.data.V_tas_kn > 70.0) && ((FlyByWire_U.in.data.thrust_lever_1_pos >= 35.0) ||
         (FlyByWire_U.in.data.thrust_lever_2_pos >= 35.0))) {
      FlyByWire_DWork.is_c6_FlyByWire = FlyByWire_IN_ON;
      rtb_ap_special_disc = 1;
    } else {
      rtb_ap_special_disc = 0;
    }
  } else if ((rtb_Y_o == 1.0) || (FlyByWire_U.in.data.H_radio_ft > 400.0) || ((FlyByWire_U.in.data.V_tas_kn < 70.0) &&
              ((FlyByWire_U.in.data.thrust_lever_1_pos < 35.0) || (FlyByWire_U.in.data.thrust_lever_2_pos < 35.0)))) {
    FlyByWire_DWork.is_c6_FlyByWire = FlyByWire_IN_OFF;
    rtb_ap_special_disc = 0;
  } else {
    rtb_ap_special_disc = 1;
  }

  FlyByWire_LagFilter(rtb_GainTheta, FlyByWire_P.LagFilter_C1_n, FlyByWire_U.in.time.dt, &rtb_Y,
                      &FlyByWire_DWork.sf_LagFilter_l);
  if (FlyByWire_P.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = FlyByWire_P.Constant1_Value_f;
  } else {
    rtb_ManualSwitch = FlyByWire_P.Constant_Value_jz;
  }

  if (FlyByWire_DWork.is_active_c2_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c2_FlyByWire = 1U;
    FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Ground;
    rtb_in_flare = 0;
    FlyByWire_B.flare_Theta_c_deg = rtb_Y;
    FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
  } else {
    switch (FlyByWire_DWork.is_c2_FlyByWire) {
     case FlyByWire_IN_Flare_Reduce_Theta_c:
      if (FlyByWire_B.in_flight == 0.0) {
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Ground;
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      } else if ((FlyByWire_U.in.data.H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flight_Low;
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1;
        FlyByWire_B.flare_Theta_c_deg = -2.0;
      }
      break;

     case FlyByWire_IN_Flare_Set_Rate:
      if (FlyByWire_P.ManualSwitch1_CurrentSetting == 1) {
        rtb_Sum1_d5 = FlyByWire_P.Constant1_Value_f;
      } else {
        rtb_Sum1_d5 = FlyByWire_P.Constant_Value_jz;
      }

      if ((FlyByWire_U.in.data.H_radio_ft <= 30.0) || (rtb_Sum1_d5 == 1.0)) {
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flare_Reduce_Theta_c;
        rtb_in_flare = 1;
        FlyByWire_B.flare_Theta_c_deg = -2.0;
      } else if ((FlyByWire_U.in.data.H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flight_Low;
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 1;
      }
      break;

     case FlyByWire_IN_Flare_Store_Theta_c_deg:
      if ((FlyByWire_U.in.data.H_radio_ft > 50.0) && (rtb_ManualSwitch == 0.0)) {
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flight_Low;
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        FlyByWire_B.flare_Theta_c_rate_deg_s = -(rtb_Y + 2.0) / 8.0;
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flare_Set_Rate;
        rtb_in_flare = 1;
      }
      break;

     case FlyByWire_IN_Flight_High:
      if ((FlyByWire_U.in.data.H_radio_ft <= 50.0) || (rtb_ManualSwitch == 1.0)) {
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flare_Store_Theta_c_deg;
        rtb_in_flare = 1;
      } else {
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     case FlyByWire_IN_Flight_Low:
      if (FlyByWire_U.in.data.H_radio_ft > 50.0) {
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flight_High;
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;

     default:
      if (FlyByWire_B.in_flight == 1.0) {
        FlyByWire_DWork.is_c2_FlyByWire = FlyByWire_IN_Flight_Low;
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      } else {
        rtb_in_flare = 0;
        FlyByWire_B.flare_Theta_c_deg = rtb_Y;
        FlyByWire_B.flare_Theta_c_rate_deg_s = -3.0;
      }
      break;
    }
  }

  if (rtb_ap_special_disc > FlyByWire_P.Saturation1_UpperSat_f) {
    rtb_ManualSwitch = FlyByWire_P.Saturation1_UpperSat_f;
  } else if (rtb_ap_special_disc < FlyByWire_P.Saturation1_LowerSat_p) {
    rtb_ManualSwitch = FlyByWire_P.Saturation1_LowerSat_p;
  } else {
    rtb_ManualSwitch = rtb_ap_special_disc;
  }

  FlyByWire_RateLimiter(rtb_ManualSwitch, FlyByWire_P.RateLimiterVariableTs1_up_n,
                        FlyByWire_P.RateLimiterVariableTs1_lo_c, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs1_InitialCondition_h, &rtb_Y_c,
                        &FlyByWire_DWork.sf_RateLimiter_g);
  if (FlyByWire_DWork.is_active_c7_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c7_FlyByWire = 1U;
    FlyByWire_DWork.is_c7_FlyByWire = FlyByWire_IN_ground;
    rtb_ManualSwitch = 0.7;
    rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
    rtb_nz_limit_up_g = 2.0;
    rtb_nz_limit_lo_g = 0;
  } else {
    switch (FlyByWire_DWork.is_c7_FlyByWire) {
     case FlyByWire_IN_flight_clean:
      if (FlyByWire_U.in.data.flaps_handle_index != 0.0) {
        FlyByWire_DWork.is_c7_FlyByWire = FlyByWire_IN_flight_flaps;
        rtb_ManualSwitch = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0;
      } else if ((FlyByWire_B.in_flight == 0.0) && (FlyByWire_U.in.data.flaps_handle_index == 0.0)) {
        FlyByWire_DWork.is_c7_FlyByWire = FlyByWire_IN_ground;
        rtb_ManualSwitch = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0;
      } else {
        rtb_ManualSwitch = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1;
      }
      break;

     case FlyByWire_IN_flight_flaps:
      if (FlyByWire_U.in.data.flaps_handle_index == 0.0) {
        FlyByWire_DWork.is_c7_FlyByWire = FlyByWire_IN_flight_clean;
        rtb_ManualSwitch = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1;
      } else if (FlyByWire_B.in_flight == 0.0) {
        FlyByWire_DWork.is_c7_FlyByWire = FlyByWire_IN_ground;
        rtb_ManualSwitch = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0;
      } else {
        rtb_ManualSwitch = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0;
      }
      break;

     default:
      if ((FlyByWire_B.in_flight != 0.0) && (FlyByWire_U.in.data.flaps_handle_index == 0.0)) {
        FlyByWire_DWork.is_c7_FlyByWire = FlyByWire_IN_flight_clean;
        rtb_ManualSwitch = 0.3;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.3;
        rtb_nz_limit_up_g = 2.5;
        rtb_nz_limit_lo_g = -1;
      } else if ((FlyByWire_B.in_flight != 0.0) && (FlyByWire_U.in.data.flaps_handle_index != 0.0)) {
        FlyByWire_DWork.is_c7_FlyByWire = FlyByWire_IN_flight_flaps;
        rtb_ManualSwitch = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0;
      } else {
        rtb_ManualSwitch = 0.7;
        rtb_eta_trim_deg_rate_limit_lo_deg_s = -0.7;
        rtb_nz_limit_up_g = 2.0;
        rtb_nz_limit_lo_g = 0;
      }
      break;
    }
  }

  FlyByWire_RateLimiter(rtb_nz_limit_up_g, FlyByWire_P.RateLimiterVariableTs2_up_f,
                        FlyByWire_P.RateLimiterVariableTs2_lo_m, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs2_InitialCondition_b, &rtb_Y_i,
                        &FlyByWire_DWork.sf_RateLimiter_m);
  FlyByWire_RateLimiter(static_cast<real_T>(rtb_nz_limit_lo_g), FlyByWire_P.RateLimiterVariableTs3_up_c,
                        FlyByWire_P.RateLimiterVariableTs3_lo_l, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs3_InitialCondition_b, &rtb_Y_k,
                        &FlyByWire_DWork.sf_RateLimiter_a);
  if (FlyByWire_DWork.is_active_c9_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c9_FlyByWire = 1U;
    FlyByWire_DWork.is_c9_FlyByWire = FlyByWire_IN_running;
    rtb_eta_trim_deg_should_freeze = false;
  } else if (FlyByWire_DWork.is_c9_FlyByWire == 1) {
    if ((rtb_in_flare == 0) && (FlyByWire_U.in.data.nz_g < 1.25) && (FlyByWire_U.in.data.nz_g > 0.5) && (std::abs
         (rtb_GainPhi) <= 30.0)) {
      FlyByWire_DWork.is_c9_FlyByWire = FlyByWire_IN_running;
      rtb_eta_trim_deg_should_freeze = false;
    } else {
      rtb_eta_trim_deg_should_freeze = true;
    }
  } else if ((rtb_in_flare != 0) || (FlyByWire_U.in.data.nz_g >= 1.25) || (FlyByWire_U.in.data.nz_g <= 0.5) || (std::abs
              (rtb_GainPhi) > 30.0)) {
    FlyByWire_DWork.is_c9_FlyByWire = FlyByWire_IN_frozen;
    rtb_eta_trim_deg_should_freeze = true;
  } else {
    rtb_eta_trim_deg_should_freeze = false;
  }

  if (FlyByWire_DWork.is_active_c8_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c8_FlyByWire = 1U;
    FlyByWire_DWork.is_c8_FlyByWire = FlyByWire_IN_manual;
    rtb_eta_trim_deg_reset = true;
    rtb_nz_limit_up_g = rtb_Gainpk2;
    rtb_eta_trim_deg_should_write = false;
  } else {
    switch (FlyByWire_DWork.is_c8_FlyByWire) {
     case FlyByWire_IN_automatic:
      if (FlyByWire_B.in_flight == 0.0) {
        FlyByWire_DWork.is_c8_FlyByWire = FlyByWire_IN_reset;
        rtb_eta_trim_deg_reset = true;
        rtb_nz_limit_up_g = 0.0;
        rtb_eta_trim_deg_should_write = true;
      } else if (rtb_alpha_floor_inhib != 0) {
        FlyByWire_DWork.is_c8_FlyByWire = FlyByWire_IN_tracking;
        rtb_eta_trim_deg_reset = true;
        rtb_nz_limit_up_g = rtb_Gainpk2;
        rtb_eta_trim_deg_should_write = false;
      } else {
        rtb_eta_trim_deg_reset = false;
        rtb_nz_limit_up_g = rtb_Gainpk2;
        rtb_eta_trim_deg_should_write = true;
      }
      break;

     case FlyByWire_IN_manual:
      if (FlyByWire_B.in_flight != 0.0) {
        FlyByWire_DWork.is_c8_FlyByWire = FlyByWire_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_nz_limit_up_g = rtb_Gainpk2;
        rtb_eta_trim_deg_should_write = true;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_nz_limit_up_g = rtb_Gainpk2;
        rtb_eta_trim_deg_should_write = false;
      }
      break;

     case FlyByWire_IN_reset:
      if ((FlyByWire_B.in_flight == 0.0) && (rtb_Gainpk2 == 0.0)) {
        FlyByWire_DWork.is_c8_FlyByWire = FlyByWire_IN_manual;
        rtb_eta_trim_deg_reset = true;
        rtb_nz_limit_up_g = rtb_Gainpk2;
        rtb_eta_trim_deg_should_write = false;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_nz_limit_up_g = 0.0;
        rtb_eta_trim_deg_should_write = true;
      }
      break;

     default:
      if (rtb_alpha_floor_inhib == 0) {
        FlyByWire_DWork.is_c8_FlyByWire = FlyByWire_IN_automatic;
        rtb_eta_trim_deg_reset = false;
        rtb_nz_limit_up_g = rtb_Gainpk2;
        rtb_eta_trim_deg_should_write = true;
      } else {
        rtb_eta_trim_deg_reset = true;
        rtb_nz_limit_up_g = rtb_Gainpk2;
        rtb_eta_trim_deg_should_write = false;
      }
      break;
    }
  }

  rtb_Sum1_d5 = FlyByWire_B.flare_Theta_c_deg - FlyByWire_DWork.Delay_DSTATE_dq;
  rtb_Sum1_c = std::abs(FlyByWire_B.flare_Theta_c_rate_deg_s) * FlyByWire_U.in.time.dt;
  if (rtb_Sum1_d5 < rtb_Sum1_c) {
    rtb_Sum1_c = rtb_Sum1_d5;
  }

  rtb_Sum1_d5 = FlyByWire_U.in.time.dt * FlyByWire_B.flare_Theta_c_rate_deg_s;
  if (rtb_Sum1_c > rtb_Sum1_d5) {
    rtb_Sum1_d5 = rtb_Sum1_c;
  }

  FlyByWire_DWork.Delay_DSTATE_dq += rtb_Sum1_d5;
  rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg = FlyByWire_P.Gain_Gain_d *
    rtb_BusAssignment_sim_input_delta_eta_pos;
  rtb_BusAssignment_cs_pitch_data_computed_in_flight_gain = rtb_Y_o;
  rtb_BusAssignment_cs_pitch_data_computed_in_rotation_gain = rtb_Y_c;
  rtb_BusAssignment_cs_pitch_data_computed_nz_limit_lo_g = rtb_Y_k;
  FlyByWire_Y.out.pitch.data_computed.flare_Theta_deg = rtb_Y;
  FlyByWire_RateLimiter(rtb_BusAssignment_sim_input_delta_eta_pos, FlyByWire_P.RateLimiterVariableTs_up_dl,
                        FlyByWire_P.RateLimiterVariableTs_lo_d, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs_InitialCondition_n, &rtb_Y_k,
                        &FlyByWire_DWork.sf_RateLimiter_l);
  if (rtb_Y_k > FlyByWire_P.Saturation3_UpperSat) {
    rtb_Gain_i = FlyByWire_P.Saturation3_UpperSat;
  } else if (rtb_Y_k < FlyByWire_P.Saturation3_LowerSat) {
    rtb_Gain_i = FlyByWire_P.Saturation3_LowerSat;
  } else {
    rtb_Gain_i = rtb_Y_k;
  }

  rtb_LimiteriH = look1_binlxpw(static_cast<real_T>(FlyByWire_U.in.data.tailstrike_protection_on) * look2_binlxpw
    (rtb_GainTheta, FlyByWire_U.in.data.H_radio_ft, FlyByWire_P.uDLookupTable_bp01Data_l,
     FlyByWire_P.uDLookupTable_bp02Data, FlyByWire_P.uDLookupTable_tableData_d, FlyByWire_P.uDLookupTable_maxIndex, 5U) *
    rtb_Gain_i + rtb_Y_k, FlyByWire_P.PitchRateDemand_bp01Data, FlyByWire_P.PitchRateDemand_tableData, 2U);
  rtb_Gain_i = FlyByWire_P.DiscreteDerivativeVariableTs_Gain_c * rtb_LimiteriH;
  rtb_Limiterxi = rtb_qk - rtb_LimiteriH;
  rtb_Gain_g = FlyByWire_P.Gain1_Gain_i * rtb_Limiterxi * FlyByWire_P.DiscreteDerivativeVariableTs_Gain_b;
  FlyByWire_LagFilter(rtb_qk + FlyByWire_P.Gain5_Gain * rtb_BusAssignment_a_sim_data_qk_dot_deg_s2,
                      FlyByWire_P.LagFilter_C1_i, FlyByWire_U.in.time.dt, &rtb_Y_k, &FlyByWire_DWork.sf_LagFilter_p);
  rtb_Gain1_b = (((((rtb_Gain_g - FlyByWire_DWork.Delay_DSTATE_dd) / FlyByWire_U.in.time.dt + FlyByWire_P.Gain_Gain_h *
                    rtb_Limiterxi) * FlyByWire_P.Gain1_Gain_a + (rtb_Gain_i - FlyByWire_DWork.Delay_DSTATE_f) /
                   FlyByWire_U.in.time.dt * FlyByWire_P.Gain3_Gain_p) + (rtb_Y_k - rtb_LimiteriH) *
                  FlyByWire_P.Gain4_Gain_g) + FlyByWire_P.Gain6_Gain_f * rtb_BusAssignment_a_sim_data_qk_dot_deg_s2) *
    (FlyByWire_P.Constant2_Value_l - rtb_Y_o) * FlyByWire_P.DiscreteTimeIntegratorVariableTs_Gain *
    FlyByWire_U.in.time.dt;
  FlyByWire_DWork.icLoad = (((rtb_BusAssignment_sim_input_delta_eta_pos <= FlyByWire_P.Constant_Value_j) &&
    (rtb_on_ground != 0)) || (rtb_Y_c == 0.0) || (rtb_alpha_floor_inhib != 0) || FlyByWire_DWork.icLoad);
  if (FlyByWire_DWork.icLoad) {
    FlyByWire_DWork.Delay_DSTATE_e = FlyByWire_P.Constant_Value_h - rtb_Gain1_b;
  }

  FlyByWire_DWork.Delay_DSTATE_e += rtb_Gain1_b;
  if (FlyByWire_DWork.Delay_DSTATE_e > FlyByWire_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    FlyByWire_DWork.Delay_DSTATE_e = FlyByWire_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (FlyByWire_DWork.Delay_DSTATE_e < FlyByWire_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    FlyByWire_DWork.Delay_DSTATE_e = FlyByWire_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  FlyByWire_Y.out.pitch.law_rotation.qk_c_deg_s = rtb_LimiteriH;
  if (rtb_on_ground > FlyByWire_P.Switch_Threshold_he) {
    if (rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg > FlyByWire_P.Saturation_UpperSat_g) {
      rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_g;
    } else if (rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg < FlyByWire_P.Saturation_LowerSat_p) {
      rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_p;
    } else {
      rtb_Gain1_b = rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg;
    }
  } else {
    rtb_Gain1_b = FlyByWire_P.Constant1_Value_i;
  }

  rtb_Limitereta = FlyByWire_DWork.Delay_DSTATE_e + rtb_Gain1_b;
  rtb_Gain1_b = std::cos(FlyByWire_P.Gain1_Gain_p * rtb_GainTheta);
  rtb_Divide1 = rtb_Gain1_b / std::cos(FlyByWire_P.Gain1_Gain_pa * rtb_GainPhi);
  rtb_LimiteriH = FlyByWire_P.Gain1_Gain_j * rtb_qk * (FlyByWire_P.Gain_Gain_dc * FlyByWire_P.Vm_currentms_Value) +
    (FlyByWire_U.in.data.nz_g - rtb_Divide1);
  rtb_Sum1_d5 = rtb_BusAssignment_sim_input_delta_eta_pos - FlyByWire_DWork.Delay_DSTATE_i;
  rtb_Sum1_c = FlyByWire_P.RateLimiterVariableTs3_up_m * FlyByWire_U.in.time.dt;
  if (rtb_Sum1_d5 < rtb_Sum1_c) {
    rtb_Sum1_c = rtb_Sum1_d5;
  }

  rtb_Sum1_d5 = FlyByWire_U.in.time.dt * FlyByWire_P.RateLimiterVariableTs3_lo_e;
  if (rtb_Sum1_c > rtb_Sum1_d5) {
    rtb_Sum1_d5 = rtb_Sum1_c;
  }

  FlyByWire_DWork.Delay_DSTATE_i += rtb_Sum1_d5;
  rtb_Sum1_d5 = (rtb_Min3 - rtb_Min5) * FlyByWire_DWork.Delay_DSTATE_i;
  if (rtb_Sum1_d5 <= 0.0) {
    rtb_Sum1_d5 = 0.0;
  }

  rtb_v_target = rtb_Min3 + rtb_Sum1_d5;
  if (rtb_GainPhi > FlyByWire_P.Saturation_UpperSat_d) {
    rtb_Gain_iw = FlyByWire_P.Saturation_UpperSat_d;
  } else if (rtb_GainPhi < FlyByWire_P.Saturation_LowerSat_pr) {
    rtb_Gain_iw = FlyByWire_P.Saturation_LowerSat_pr;
  } else {
    rtb_Gain_iw = rtb_GainPhi;
  }

  rtb_Limiterxi2 = rtb_Gain1_b / std::cos(FlyByWire_P.Gain1_Gain_b * rtb_Gain_iw);
  FlyByWire_RateLimiter(FlyByWire_U.in.data.autopilot_custom_Theta_c_deg, FlyByWire_P.RateLimiterVariableTs1_up_k,
                        FlyByWire_P.RateLimiterVariableTs1_lo_h, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs1_InitialCondition_hb, &rtb_Y_c,
                        &FlyByWire_DWork.sf_RateLimiter_n);
  rtb_Sum1_c = 5.0 - (FlyByWire_U.in.data.V_ias_kn - (FlyByWire_U.in.data.VLS_kn + 5.0)) * 0.25;
  if (0.0 > rtb_Sum1_c) {
    rtb_Sum1_c = 0.0;
  }

  if (FlyByWire_U.in.data.flaps_handle_index == 5.0) {
    rtb_nz_limit_lo_g = 25;
  } else {
    rtb_nz_limit_lo_g = 30;
  }

  if (5.0 < rtb_Sum1_c) {
    rtb_Sum1_c = 5.0;
  }

  FlyByWire_RateLimiter(static_cast<real_T>(rtb_nz_limit_lo_g) - rtb_Sum1_c, FlyByWire_P.RateLimiterVariableTs6_up,
                        FlyByWire_P.RateLimiterVariableTs6_lo, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs6_InitialCondition, &rtb_Y, &FlyByWire_DWork.sf_RateLimiter);
  FlyByWire_RateLimiter(rtb_BusAssignment_sim_input_delta_eta_pos, FlyByWire_P.RateLimiterVariableTs_up_f,
                        FlyByWire_P.RateLimiterVariableTs_lo_f, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs_InitialCondition_c, &rtb_Y_o,
                        &FlyByWire_DWork.sf_RateLimiter_k);
  rtb_Gain_iw = FlyByWire_P.Subsystem2_Gain * rtb_v_target;
  rtb_Divide_m = (rtb_Gain_iw - FlyByWire_DWork.Delay_DSTATE_j) / FlyByWire_U.in.time.dt;
  rtb_Gain1_b = FlyByWire_U.in.time.dt * FlyByWire_P.Subsystem2_C1;
  rtb_Limiterxi = rtb_Gain1_b + FlyByWire_P.Constant_Value_m3;
  FlyByWire_DWork.Delay1_DSTATE = 1.0 / rtb_Limiterxi * (FlyByWire_P.Constant_Value_m3 - rtb_Gain1_b) *
    FlyByWire_DWork.Delay1_DSTATE + (rtb_Divide_m + FlyByWire_DWork.Delay_DSTATE_c) * (rtb_Gain1_b / rtb_Limiterxi);
  rtb_Gain_oj = FlyByWire_P.Subsystem_Gain * FlyByWire_U.in.data.V_ias_kn;
  rtb_Divide_e = (rtb_Gain_oj - FlyByWire_DWork.Delay_DSTATE_p) / FlyByWire_U.in.time.dt;
  rtb_Gain1_b = FlyByWire_U.in.time.dt * FlyByWire_P.Subsystem_C1;
  rtb_Limiterxi = rtb_Gain1_b + FlyByWire_P.Constant_Value_hz;
  FlyByWire_DWork.Delay1_DSTATE_i = 1.0 / rtb_Limiterxi * (FlyByWire_P.Constant_Value_hz - rtb_Gain1_b) *
    FlyByWire_DWork.Delay1_DSTATE_i + (rtb_Divide_e + FlyByWire_DWork.Delay_DSTATE_m) * (rtb_Gain1_b / rtb_Limiterxi);
  rtb_Sum1_d5 = FlyByWire_DWork.sProtActive - FlyByWire_DWork.Delay_DSTATE_g;
  rtb_Sum1_c = FlyByWire_P.RateLimiterVariableTs4_up * FlyByWire_U.in.time.dt;
  if (rtb_Sum1_d5 < rtb_Sum1_c) {
    rtb_Sum1_c = rtb_Sum1_d5;
  }

  rtb_Sum1_d5 = FlyByWire_U.in.time.dt * FlyByWire_P.RateLimiterVariableTs4_lo;
  if (rtb_Sum1_c > rtb_Sum1_d5) {
    rtb_Sum1_d5 = rtb_Sum1_c;
  }

  FlyByWire_DWork.Delay_DSTATE_g += rtb_Sum1_d5;
  if (FlyByWire_U.in.data.autopilot_custom_on > FlyByWire_P.Switch1_Threshold_ke) {
    rtb_Gain1_b = (rtb_Y_c - rtb_GainTheta) * FlyByWire_P.Gain4_Gain;
  } else {
    rtb_Gain1_b = FlyByWire_P.Gain1_Gain * rtb_GainTheta;
    rtb_Y_c = rtb_Divide1 - rtb_Limiterxi2;
    rtb_Loaddemand = look1_binlxpw(rtb_Y_o, FlyByWire_P.Loaddemand_bp01Data, FlyByWire_P.Loaddemand_tableData, 2U);
    if (FlyByWire_DWork.Delay_DSTATE_g > FlyByWire_P.Saturation_UpperSat_o) {
      rtb_Y_o = FlyByWire_P.Saturation_UpperSat_o;
    } else if (FlyByWire_DWork.Delay_DSTATE_g < FlyByWire_P.Saturation_LowerSat_k) {
      rtb_Y_o = FlyByWire_P.Saturation_LowerSat_k;
    } else {
      rtb_Y_o = FlyByWire_DWork.Delay_DSTATE_g;
    }

    if (FlyByWire_DWork.sProtActive > FlyByWire_P.Switch2_Threshold) {
      rtb_Sum1_d5 = (((((rtb_v_target - FlyByWire_U.in.data.V_ias_kn) * FlyByWire_P.Gain6_Gain +
                        FlyByWire_P.precontrol_gain_HSP_Gain * FlyByWire_DWork.Delay1_DSTATE) +
                       FlyByWire_P.v_dot_gain_HSP_Gain * FlyByWire_DWork.Delay1_DSTATE_i) + FlyByWire_P.qk_gain_HSP_Gain
                      * rtb_qk) + FlyByWire_P.qk_dot_gain1_Gain * rtb_BusAssignment_a_sim_data_qk_dot_deg_s2) *
        FlyByWire_P.HSP_gain_Gain;
      if (rtb_Loaddemand > FlyByWire_P.Saturation8_UpperSat) {
        rtb_Switch_c = FlyByWire_P.Saturation8_UpperSat;
      } else if (rtb_Loaddemand < FlyByWire_P.Saturation8_LowerSat) {
        rtb_Switch_c = FlyByWire_P.Saturation8_LowerSat;
      } else {
        rtb_Switch_c = rtb_Loaddemand;
      }

      if (rtb_Sum1_d5 > FlyByWire_P.Saturation4_UpperSat) {
        rtb_Sum1_d5 = FlyByWire_P.Saturation4_UpperSat;
      } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation4_LowerSat) {
        rtb_Sum1_d5 = FlyByWire_P.Saturation4_LowerSat;
      }

      rtb_Switch_c += rtb_Sum1_d5;
    } else {
      rtb_Switch_c = FlyByWire_P.Constant1_Value;
    }

    rtb_Loaddemand = (FlyByWire_P.Constant_Value_k - rtb_Y_o) * rtb_Loaddemand + rtb_Switch_c * rtb_Y_o;
    if (rtb_in_flare > FlyByWire_P.Switch_Threshold) {
      rtb_Switch_c = (FlyByWire_DWork.Delay_DSTATE_dq - rtb_GainTheta) * FlyByWire_P.Gain_Gain;
      if (rtb_Switch_c > FlyByWire_P.Saturation_UpperSat) {
        rtb_Switch_c = FlyByWire_P.Saturation_UpperSat;
      } else if (rtb_Switch_c < FlyByWire_P.Saturation_LowerSat) {
        rtb_Switch_c = FlyByWire_P.Saturation_LowerSat;
      }
    } else {
      rtb_Switch_c = FlyByWire_P.Constant_Value_m;
    }

    rtb_Sum1_d5 = FlyByWire_P.Gain2_Gain * rtb_Y - rtb_Gain1_b;
    if (rtb_Sum1_d5 > FlyByWire_P.Saturation1_UpperSat) {
      rtb_Sum1_d5 = FlyByWire_P.Saturation1_UpperSat;
    } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation1_LowerSat) {
      rtb_Sum1_d5 = FlyByWire_P.Saturation1_LowerSat;
    }

    rtb_Y_o = look1_binlxpw(rtb_Sum1_d5, FlyByWire_P.Loaddemand1_bp01Data, FlyByWire_P.Loaddemand1_tableData, 2U) +
      rtb_Y_c;
    if (rtb_Loaddemand <= rtb_Y_o) {
      rtb_Sum1_d5 = FlyByWire_P.Gain3_Gain * FlyByWire_P.Theta_max3_Value - rtb_Gain1_b;
      if (rtb_Sum1_d5 > FlyByWire_P.Saturation2_UpperSat) {
        rtb_Sum1_d5 = FlyByWire_P.Saturation2_UpperSat;
      } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation2_LowerSat) {
        rtb_Sum1_d5 = FlyByWire_P.Saturation2_LowerSat;
      }

      rtb_Y_o = look1_binlxpw(rtb_Sum1_d5, FlyByWire_P.Loaddemand2_bp01Data, FlyByWire_P.Loaddemand2_tableData, 2U) +
        rtb_Y_c;
      if (rtb_Loaddemand >= rtb_Y_o) {
        rtb_Y_o = rtb_Loaddemand;
      }
    }

    rtb_Gain1_b = rtb_Y_o + rtb_Switch_c;
  }

  rtb_Gain1_b += rtb_Limiterxi2;
  if (rtb_Gain1_b > rtb_Y_i) {
    rtb_Gain1_b = rtb_Y_i;
  } else if (rtb_Gain1_b < rtb_BusAssignment_cs_pitch_data_computed_nz_limit_lo_g) {
    rtb_Gain1_b = rtb_BusAssignment_cs_pitch_data_computed_nz_limit_lo_g;
  }

  FlyByWire_RateLimiter(rtb_BusAssignment_sim_input_delta_eta_pos, FlyByWire_P.RateLimiterVariableTs2_up_b,
                        FlyByWire_P.RateLimiterVariableTs2_lo_n, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs2_InitialCondition_j, &rtb_Y_k,
                        &FlyByWire_DWork.sf_RateLimiter_p);
  rtb_Switch_c = (rtb_BusAssignment_c_sim_data_speeds_aoa_alpha_max_deg - rtb_Switch) * rtb_Y_k;
  FlyByWire_LagFilter(FlyByWire_U.in.data.alpha_deg, FlyByWire_P.LagFilter1_C1, FlyByWire_U.in.time.dt, &rtb_Y_k,
                      &FlyByWire_DWork.sf_LagFilter_h);
  rtb_Limiterxi = rtb_Y_k - rtb_Switch;
  if (0.0 > rtb_GainTheta - 22.5) {
    rtb_Y = 0.0;
  } else {
    rtb_Y = rtb_GainTheta - 22.5;
  }

  rtb_Sum1_c = (std::abs(rtb_GainPhi) - 3.0) / 6.0;
  if (0.0 > rtb_Sum1_c) {
    rtb_Sum1_c = 0.0;
  }

  if (rtb_Y > rtb_Sum1_c) {
    rtb_Sum1_c = rtb_Y;
  }

  FlyByWire_WashoutFilter(rtb_Sum1_c, FlyByWire_P.WashoutFilter_C1, FlyByWire_U.in.time.dt, &rtb_Y_k,
    &FlyByWire_DWork.sf_WashoutFilter);
  rtb_Limiterxi = (rtb_Switch_c - rtb_Limiterxi) - rtb_Y_k;
  rtb_Y = FlyByWire_P.Subsystem1_Gain * rtb_Limiterxi;
  rtb_Y_o = (rtb_Y - FlyByWire_DWork.Delay_DSTATE_ps) / FlyByWire_U.in.time.dt;
  rtb_Limiterxi1 = FlyByWire_U.in.time.dt * FlyByWire_P.Subsystem1_C1;
  rtb_Limiterxi2 = rtb_Limiterxi1 + FlyByWire_P.Constant_Value_kr;
  FlyByWire_DWork.Delay1_DSTATE_o = 1.0 / rtb_Limiterxi2 * (FlyByWire_P.Constant_Value_kr - rtb_Limiterxi1) *
    FlyByWire_DWork.Delay1_DSTATE_o + (rtb_Y_o + FlyByWire_DWork.Delay_DSTATE_c1) * (rtb_Limiterxi1 / rtb_Limiterxi2);
  rtb_Y_k = FlyByWire_P.alpha_err_gain_Gain * rtb_Limiterxi;
  rtb_Y_c = FlyByWire_P.Subsystem3_Gain * FlyByWire_U.in.data.V_ias_kn;
  rtb_Limiterxi2 = (rtb_Y_c - FlyByWire_DWork.Delay_DSTATE_l) / FlyByWire_U.in.time.dt;
  rtb_Limiterxi = FlyByWire_U.in.time.dt * FlyByWire_P.Subsystem3_C1;
  rtb_Limiterxi1 = rtb_Limiterxi + FlyByWire_P.Constant_Value_c;
  FlyByWire_DWork.Delay1_DSTATE_n = 1.0 / rtb_Limiterxi1 * (FlyByWire_P.Constant_Value_c - rtb_Limiterxi) *
    FlyByWire_DWork.Delay1_DSTATE_n + (rtb_Limiterxi2 + FlyByWire_DWork.Delay_DSTATE_n) * (rtb_Limiterxi /
    rtb_Limiterxi1);
  rtb_Sum1_d5 = FlyByWire_DWork.sProtActive_k - FlyByWire_DWork.Delay_DSTATE_k;
  rtb_Sum1_c = FlyByWire_P.RateLimiterVariableTs5_up * FlyByWire_U.in.time.dt;
  if (rtb_Sum1_d5 < rtb_Sum1_c) {
    rtb_Sum1_c = rtb_Sum1_d5;
  }

  rtb_Sum1_d5 = FlyByWire_U.in.time.dt * FlyByWire_P.RateLimiterVariableTs5_lo;
  if (rtb_Sum1_c > rtb_Sum1_d5) {
    rtb_Sum1_d5 = rtb_Sum1_c;
  }

  FlyByWire_DWork.Delay_DSTATE_k += rtb_Sum1_d5;
  if (FlyByWire_DWork.Delay_DSTATE_k > FlyByWire_P.Saturation_UpperSat_a) {
    rtb_Limiterxi1 = FlyByWire_P.Saturation_UpperSat_a;
  } else if (FlyByWire_DWork.Delay_DSTATE_k < FlyByWire_P.Saturation_LowerSat_ps) {
    rtb_Limiterxi1 = FlyByWire_P.Saturation_LowerSat_ps;
  } else {
    rtb_Limiterxi1 = FlyByWire_DWork.Delay_DSTATE_k;
  }

  rtb_Loaddemand = FlyByWire_P.DiscreteDerivativeVariableTs1_Gain * rtb_qk;
  if (FlyByWire_U.in.data.V_tas_kn > FlyByWire_P.Saturation3_UpperSat_p) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation3_UpperSat_p;
  } else if (FlyByWire_U.in.data.V_tas_kn < FlyByWire_P.Saturation3_LowerSat_i) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation3_LowerSat_i;
  } else {
    rtb_Sum1_d5 = FlyByWire_U.in.data.V_tas_kn;
  }

  rtb_Limiterxi = rtb_LimiteriH - (look1_binlxpw(FlyByWire_U.in.data.V_tas_kn, FlyByWire_P.uDLookupTable_bp01Data_j,
    FlyByWire_P.uDLookupTable_tableData_l, 6U) / (FlyByWire_P.Gain5_Gain_g * rtb_Sum1_d5) + FlyByWire_P.Bias_Bias) *
    (rtb_Gain1_b - rtb_Divide1);
  rtb_Divide1 = rtb_Limiterxi * look1_binlxpw(FlyByWire_U.in.data.V_tas_kn, FlyByWire_P.DLUT_bp01Data,
    FlyByWire_P.DLUT_tableData, 1U) * FlyByWire_P.DiscreteDerivativeVariableTs_Gain_e;
  rtb_Sum1_d5 = (((FlyByWire_P.precontrol_gain_Gain * FlyByWire_DWork.Delay1_DSTATE_o + rtb_Y_k) +
                  FlyByWire_P.v_dot_gain_Gain * FlyByWire_DWork.Delay1_DSTATE_n) + FlyByWire_P.qk_gain_Gain * rtb_qk) +
    FlyByWire_P.qk_dot_gain_Gain * rtb_BusAssignment_a_sim_data_qk_dot_deg_s2;
  rtb_Limiterxi = ((rtb_Loaddemand - FlyByWire_DWork.Delay_DSTATE_ca) / FlyByWire_U.in.time.dt *
                   FlyByWire_P.Gain3_Gain_l + rtb_Limiterxi * look1_binlxpw(FlyByWire_U.in.data.V_tas_kn,
    FlyByWire_P.PLUT_bp01Data, FlyByWire_P.PLUT_tableData, 1U)) + (rtb_Divide1 - FlyByWire_DWork.Delay_DSTATE_jv) /
    FlyByWire_U.in.time.dt;
  if (rtb_Sum1_d5 > FlyByWire_P.Saturation3_UpperSat_c) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation3_UpperSat_c;
  } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation3_LowerSat_h) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation3_LowerSat_h;
  }

  if (rtb_Limiterxi > FlyByWire_P.Saturation_UpperSat_j) {
    rtb_Limiterxi = FlyByWire_P.Saturation_UpperSat_j;
  } else if (rtb_Limiterxi < FlyByWire_P.Saturation_LowerSat_c) {
    rtb_Limiterxi = FlyByWire_P.Saturation_LowerSat_c;
  }

  rtb_Limiterxi = (FlyByWire_P.Constant_Value_p - rtb_Limiterxi1) * rtb_Limiterxi + rtb_Sum1_d5 * rtb_Limiterxi1;
  FlyByWire_Y.out.pitch.law_normal.nz_c_g = rtb_Gain1_b;
  rtb_Limitereta_d = rtb_Limiterxi * look1_binlxpw(FlyByWire_U.in.time.dt,
    FlyByWire_P.ScheduledGain_BreakpointsForDimension1, FlyByWire_P.ScheduledGain_Table, 4U);
  FlyByWire_Y.out.pitch.law_normal.Cstar_g = rtb_LimiteriH;
  rtb_Gain1_b = FlyByWire_P.DiscreteTimeIntegratorVariableTs_Gain_k * rtb_Limitereta_d * FlyByWire_U.in.time.dt;
  FlyByWire_DWork.icLoad_e = ((rtb_BusAssignment_cs_pitch_data_computed_in_flight_gain == 0.0) || (rtb_alpha_floor_inhib
    != 0) || FlyByWire_DWork.icLoad_e);
  if (FlyByWire_DWork.icLoad_e) {
    if (FlyByWire_B.in_flight > FlyByWire_P.Switch_Threshold_d) {
      rtb_Sum1_d5 = rtb_Gainpk4;
    } else {
      rtb_Sum1_d5 = rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg;
    }

    FlyByWire_DWork.Delay_DSTATE_f1 = rtb_Sum1_d5 - rtb_Gain1_b;
  }

  FlyByWire_DWork.Delay_DSTATE_f1 += rtb_Gain1_b;
  if (FlyByWire_DWork.Delay_DSTATE_f1 > FlyByWire_P.DiscreteTimeIntegratorVariableTs_UpperLimit_c) {
    FlyByWire_DWork.Delay_DSTATE_f1 = FlyByWire_P.DiscreteTimeIntegratorVariableTs_UpperLimit_c;
  } else if (FlyByWire_DWork.Delay_DSTATE_f1 < FlyByWire_P.DiscreteTimeIntegratorVariableTs_LowerLimit_b) {
    FlyByWire_DWork.Delay_DSTATE_f1 = FlyByWire_P.DiscreteTimeIntegratorVariableTs_LowerLimit_b;
  }

  if (rtb_BusAssignment_cs_pitch_data_computed_in_flight_gain > FlyByWire_P.Saturation_UpperSat_g4) {
    rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_g4;
  } else if (rtb_BusAssignment_cs_pitch_data_computed_in_flight_gain < FlyByWire_P.Saturation_LowerSat_l) {
    rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_l;
  } else {
    rtb_Gain1_b = rtb_BusAssignment_cs_pitch_data_computed_in_flight_gain;
  }

  rtb_LimiteriH = FlyByWire_DWork.Delay_DSTATE_f1 * rtb_Gain1_b;
  rtb_Sum1_d5 = FlyByWire_P.Constant_Value_o - rtb_Gain1_b;
  if (rtb_BusAssignment_cs_pitch_data_computed_in_rotation_gain > FlyByWire_P.Saturation_UpperSat_c) {
    rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_c;
  } else if (rtb_BusAssignment_cs_pitch_data_computed_in_rotation_gain < FlyByWire_P.Saturation_LowerSat_m) {
    rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_m;
  } else {
    rtb_Gain1_b = rtb_BusAssignment_cs_pitch_data_computed_in_rotation_gain;
  }

  rtb_LimiteriH_n = ((FlyByWire_P.Constant_Value_ju - rtb_Gain1_b) *
                     rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg + rtb_Limitereta * rtb_Gain1_b) *
    rtb_Sum1_d5 + rtb_LimiteriH;
  if (rtb_eta_trim_deg_should_freeze == FlyByWire_P.CompareToConstant_const_h) {
    rtb_LimiteriH = FlyByWire_P.Constant_Value;
  } else {
    rtb_LimiteriH = FlyByWire_DWork.Delay_DSTATE_f1;
  }

  rtb_Gain1_b = FlyByWire_P.Gain_Gain_ip * rtb_LimiteriH * FlyByWire_P.DiscreteTimeIntegratorVariableTsLimit_Gain *
    FlyByWire_U.in.time.dt;
  FlyByWire_DWork.icLoad_i = (rtb_eta_trim_deg_reset || FlyByWire_DWork.icLoad_i);
  if (FlyByWire_DWork.icLoad_i) {
    FlyByWire_DWork.Delay_DSTATE_h = rtb_nz_limit_up_g - rtb_Gain1_b;
  }

  FlyByWire_DWork.Delay_DSTATE_h += rtb_Gain1_b;
  if (FlyByWire_DWork.Delay_DSTATE_h > rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_up) {
    FlyByWire_DWork.Delay_DSTATE_h = rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_up;
  } else if (FlyByWire_DWork.Delay_DSTATE_h < rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_lo) {
    FlyByWire_DWork.Delay_DSTATE_h = rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_lo;
  }

  rtb_Sum1_d5 = FlyByWire_DWork.Delay_DSTATE_h - FlyByWire_DWork.Delay_DSTATE_ea;
  rtb_Sum1_c = rtb_ManualSwitch * FlyByWire_U.in.time.dt;
  if (rtb_Sum1_d5 < rtb_Sum1_c) {
    rtb_Sum1_c = rtb_Sum1_d5;
  }

  rtb_Sum1_d5 = FlyByWire_U.in.time.dt * rtb_eta_trim_deg_rate_limit_lo_deg_s;
  if (rtb_Sum1_c > rtb_Sum1_d5) {
    rtb_Sum1_d5 = rtb_Sum1_c;
  }

  FlyByWire_DWork.Delay_DSTATE_ea += rtb_Sum1_d5;
  FlyByWire_Y.out.pitch.data_computed.nz_limit_up_g = rtb_Y_i;
  FlyByWire_Y.out.pitch.law_normal.eta_dot_deg_s = rtb_Limiterxi;
  rtb_LimiteriH = look1_binlxpw(FlyByWire_U.in.data.V_tas_kn, FlyByWire_P.uDLookupTable_bp01Data_f,
    FlyByWire_P.uDLookupTable_tableData_f, 3U);
  rtb_Gain1_o = FlyByWire_P.Gain1_Gain_jh * rtb_BusAssignment_sim_input_delta_zeta_pos;
  if (rtb_Gain1_o > rtb_LimiteriH) {
    rtb_Gain1_o = rtb_LimiteriH;
  } else {
    rtb_LimiteriH *= FlyByWire_P.Gain2_Gain_n;
    if (rtb_Gain1_o < rtb_LimiteriH) {
      rtb_Gain1_o = rtb_LimiteriH;
    }
  }

  if (FlyByWire_DWork.is_active_c5_FlyByWire == 0U) {
    FlyByWire_DWork.is_active_c5_FlyByWire = 1U;
    FlyByWire_DWork.is_c5_FlyByWire = FlyByWire_IN_GroundMode;
    rtb_nz_limit_lo_g = 0;
  } else if (FlyByWire_DWork.is_c5_FlyByWire == 1) {
    if (rtb_on_ground == 1) {
      FlyByWire_DWork.is_c5_FlyByWire = FlyByWire_IN_GroundMode;
      rtb_nz_limit_lo_g = 0;
    } else {
      rtb_nz_limit_lo_g = 1;
    }
  } else if (((rtb_on_ground == 0) && (rtb_GainTheta > 8.0)) || (FlyByWire_U.in.data.H_radio_ft > 400.0)) {
    FlyByWire_DWork.is_c5_FlyByWire = FlyByWire_IN_FlightMode;
    rtb_nz_limit_lo_g = 1;
  } else {
    rtb_nz_limit_lo_g = 0;
  }

  if (rtb_nz_limit_lo_g > FlyByWire_P.Saturation_UpperSat_p) {
    rtb_LimiteriH = FlyByWire_P.Saturation_UpperSat_p;
  } else if (rtb_nz_limit_lo_g < FlyByWire_P.Saturation_LowerSat_h) {
    rtb_LimiteriH = FlyByWire_P.Saturation_LowerSat_h;
  } else {
    rtb_LimiteriH = rtb_nz_limit_lo_g;
  }

  FlyByWire_RateLimiter(rtb_LimiteriH, FlyByWire_P.RateLimiterVariableTs_up_k, FlyByWire_P.RateLimiterVariableTs_lo_fs,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimiterVariableTs_InitialCondition_f, &rtb_Y_k,
                        &FlyByWire_DWork.sf_RateLimiter_gp);
  FlyByWire_LagFilter(FlyByWire_U.in.data.engine_1_thrust_lbf - FlyByWire_U.in.data.engine_2_thrust_lbf,
                      FlyByWire_P.LagFilter_C1_l, FlyByWire_U.in.time.dt, &rtb_Y_i, &FlyByWire_DWork.sf_LagFilter_pl);
  rtb_Product_e = rtb_Y_i * look1_binlxpw(FlyByWire_U.in.data.V_tas_kn,
    FlyByWire_P.ScheduledGain_BreakpointsForDimension1_b, FlyByWire_P.ScheduledGain_Table_g, 3U);
  rtb_BusAssignment_p_roll_data_computed_delta_xi_deg = FlyByWire_P.Gain_Gain_c *
    rtb_BusAssignment_sim_input_delta_xi_pos;
  rtb_BusAssignment_p_roll_data_computed_in_flight_gain = rtb_Y_k;
  if (FlyByWire_DWork.sProtActive > FlyByWire_P.Switch3_Threshold) {
    rtb_Sum1_d5 = look1_binlxpw(rtb_GainPhi, FlyByWire_P.BankAngleProtection2_bp01Data,
      FlyByWire_P.BankAngleProtection2_tableData, 4U);
  } else if (FlyByWire_DWork.sProtActive_k > FlyByWire_P.Switch2_Threshold_f) {
    rtb_Sum1_d5 = look1_binlxpw(rtb_GainPhi, FlyByWire_P.BankAngleProtection_bp01Data,
      FlyByWire_P.BankAngleProtection_tableData, 8U);
  } else {
    rtb_Sum1_d5 = look1_binlxpw(rtb_GainPhi, FlyByWire_P.BankAngleProtection1_bp01Data,
      FlyByWire_P.BankAngleProtection1_tableData, 8U);
  }

  rtb_Gain1_b = FlyByWire_P.Gain1_Gain_m * rtb_BusAssignment_sim_input_delta_xi_pos + rtb_Sum1_d5;
  if (rtb_Gain1_b > FlyByWire_P.Saturation_UpperSat_n) {
    rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_n;
  } else if (rtb_Gain1_b < FlyByWire_P.Saturation_LowerSat_o) {
    rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_o;
  }

  FlyByWire_RateLimiter(rtb_Gain1_o, FlyByWire_P.RateLimiterVariableTs_up_m, FlyByWire_P.RateLimiterVariableTs_lo_p,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimiterVariableTs_InitialCondition_fc, &rtb_Y_i,
                        &FlyByWire_DWork.sf_RateLimiter_lp);
  FlyByWire_LagFilter(rtb_Gain1_b * rtb_Y_k, FlyByWire_P.LagFilter2_C1, FlyByWire_U.in.time.dt, &rtb_Y_k,
                      &FlyByWire_DWork.sf_LagFilter_lj);
  rtb_LimiteriH = FlyByWire_P.DiscreteTimeIntegratorVariableTs_Gain_d * rtb_Y_k * FlyByWire_U.in.time.dt;
  FlyByWire_DWork.icLoad_m = ((rtb_BusAssignment_p_roll_data_computed_in_flight_gain == 0.0) || (rtb_alpha_floor_inhib
    != 0) || (FlyByWire_U.in.data.autopilot_custom_on != 0.0) || FlyByWire_DWork.icLoad_m);
  if (FlyByWire_DWork.icLoad_m) {
    FlyByWire_DWork.Delay_DSTATE_ho = rtb_GainPhi - rtb_LimiteriH;
  }

  FlyByWire_DWork.Delay_DSTATE_ho += rtb_LimiteriH;
  if (FlyByWire_DWork.Delay_DSTATE_ho > FlyByWire_P.DiscreteTimeIntegratorVariableTs_UpperLimit_d) {
    FlyByWire_DWork.Delay_DSTATE_ho = FlyByWire_P.DiscreteTimeIntegratorVariableTs_UpperLimit_d;
  } else if (FlyByWire_DWork.Delay_DSTATE_ho < FlyByWire_P.DiscreteTimeIntegratorVariableTs_LowerLimit_k) {
    FlyByWire_DWork.Delay_DSTATE_ho = FlyByWire_P.DiscreteTimeIntegratorVariableTs_LowerLimit_k;
  }

  rtb_Sum1_d5 = FlyByWire_P.Gain_Gain_a1 * rtb_Y_i + FlyByWire_DWork.Delay_DSTATE_ho;
  if (rtb_Sum1_d5 > FlyByWire_P.Saturation_UpperSat_f) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_UpperSat_f;
  } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation_LowerSat_f) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_LowerSat_f;
  }

  FlyByWire_RateLimiter(rtb_Sum1_d5, FlyByWire_P.RateLimiterVariableTs_up_ms, FlyByWire_P.RateLimiterVariableTs_lo_g,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimiterVariableTs_InitialCondition_j, &rtb_Y_k,
                        &FlyByWire_DWork.sf_RateLimiter_a0);
  if (FlyByWire_U.in.data.autopilot_custom_on > FlyByWire_P.Switch_Threshold_p) {
    if (rtb_alpha_floor_inhib > FlyByWire_P.Switch1_Threshold) {
      rtb_LimiteriH = rtb_GainPhi;
    } else {
      rtb_LimiteriH = FlyByWire_U.in.data.autopilot_custom_Phi_c_deg;
    }
  } else {
    rtb_LimiteriH = rtb_Y_k;
  }

  if (FlyByWire_U.in.data.V_ias_kn > 80.0) {
    rtb_Sum1_d5 = FlyByWire_U.in.data.V_ias_kn;
  } else {
    rtb_Sum1_d5 = 80.0;
  }

  rtb_Sum1_d5 *= 0.5144;
  rtb_Limiterxi1 = rtb_Sum1_d5 * rtb_Sum1_d5 * 0.6125;
  rtb_Sum1_d5 = rtb_Limiterxi1 / rtb_Sum1_d5 * 122.0 * 320.40999999999997 * -2.078 / 1.376155E+6;
  rtb_Limiterxi1 = rtb_Limiterxi1 * 122.0 * 17.9 * -0.291 / 1.376155E+6;
  rtb_Limiterxi = -(-rtb_Sum1_d5 * -rtb_Sum1_d5) / rtb_Limiterxi1;
  rtb_Limiterxi_o = ((-(2.0 * -rtb_Sum1_d5 + rtb_Sum1_d5) / rtb_Limiterxi1 * rtb_BusAssignment_a_sim_data_pk_deg_s +
                      rtb_Limiterxi * rtb_GainPhi) + -rtb_Limiterxi * rtb_LimiteriH) * look1_binlxpw
    (FlyByWire_U.in.time.dt, FlyByWire_P.ScheduledGain_BreakpointsForDimension1_k, FlyByWire_P.ScheduledGain_Table_i, 4U);
  FlyByWire_LagFilter(rtb_Gain, FlyByWire_P.LagFilter_C1_d, FlyByWire_U.in.time.dt, &rtb_Y_k,
                      &FlyByWire_DWork.sf_LagFilter_c);
  if (FlyByWire_U.in.data.V_tas_kn > FlyByWire_P.Saturation_UpperSat_l) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_UpperSat_l;
  } else if (FlyByWire_U.in.data.V_tas_kn < FlyByWire_P.Saturation_LowerSat_lu) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_LowerSat_lu;
  } else {
    rtb_Sum1_d5 = FlyByWire_U.in.data.V_tas_kn;
  }

  rtb_Sum1_d5 = (rtb_Y_k - std::sin(FlyByWire_P.Gain1_Gain_br * rtb_LimiteriH) * FlyByWire_P.Constant2_Value_li * std::
                 cos(FlyByWire_P.Gain1_Gain_cq * rtb_GainTheta) / (FlyByWire_P.Gain6_Gain_j * rtb_Sum1_d5) *
                 FlyByWire_P.Gain_Gain_cd) * look1_binlxpw(FlyByWire_U.in.data.V_tas_kn,
    FlyByWire_P.ScheduledGain_BreakpointsForDimension1_k0, FlyByWire_P.ScheduledGain_Table_k, 6U);
  FlyByWire_WashoutFilter(rtb_Gain, FlyByWire_P.WashoutFilter_C1_i, FlyByWire_U.in.time.dt, &rtb_Y_k,
    &FlyByWire_DWork.sf_WashoutFilter_i);
  rtb_Limiterxi = rtb_Y_k * look1_binlxpw(FlyByWire_U.in.data.V_tas_kn,
    FlyByWire_P.ScheduledGain1_BreakpointsForDimension1, FlyByWire_P.ScheduledGain1_Table, 6U);
  if (rtb_Sum1_d5 > FlyByWire_P.Saturation1_UpperSat_h) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation1_UpperSat_h;
  } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation1_LowerSat_g) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation1_LowerSat_g;
  }

  if (rtb_Limiterxi > FlyByWire_P.Saturation2_UpperSat_e) {
    rtb_Limiterxi = FlyByWire_P.Saturation2_UpperSat_e;
  } else if (rtb_Limiterxi < FlyByWire_P.Saturation2_LowerSat_gp) {
    rtb_Limiterxi = FlyByWire_P.Saturation2_LowerSat_gp;
  }

  rtb_Limiterxi1 = rtb_BusAssignment_p_roll_data_computed_in_flight_gain * rtb_Sum1_d5 + rtb_Limiterxi;
  FlyByWire_Y.out.roll.law_normal.pk_c_deg_s = rtb_Gain1_b;
  FlyByWire_Y.out.roll.law_normal.Phi_c_deg = rtb_LimiteriH;
  rtb_Limiterxi = rtb_Y_i;
  FlyByWire_RateLimiter(static_cast<real_T>(rtb_on_ground), FlyByWire_P.RateLimiterVariableTs_up_dlj,
                        FlyByWire_P.RateLimiterVariableTs_lo_fw, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs_InitialCondition_p, &rtb_Y_k,
                        &FlyByWire_DWork.sf_RateLimiter_d);
  if (rtb_Y_k > FlyByWire_P.Saturation_UpperSat_d1) {
    rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_d1;
  } else if (rtb_Y_k < FlyByWire_P.Saturation_LowerSat_j) {
    rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_j;
  } else {
    rtb_Gain1_b = rtb_Y_k;
  }

  rtb_LimiteriH = FlyByWire_U.in.data.autopilot_custom_Beta_c_deg * rtb_Gain1_b;
  rtb_Sum1_c = FlyByWire_P.Constant_Value_i - rtb_Gain1_b;
  if (FlyByWire_U.in.data.V_ias_kn >= 60.0) {
    rtb_Sum1_d5 = FlyByWire_U.in.data.beta_deg;
  } else {
    rtb_Sum1_d5 = 0.0;
  }

  FlyByWire_LagFilter(rtb_Sum1_d5, FlyByWire_P.LagFilter_C1_c, FlyByWire_U.in.time.dt, &rtb_Y_i,
                      &FlyByWire_DWork.sf_LagFilter_d);
  if (FlyByWire_U.in.data.autopilot_custom_on > FlyByWire_P.Switch2_Threshold_p) {
    rtb_Sum1_d5 = FlyByWire_U.in.data.autopilot_custom_Beta_c_deg + rtb_Product_e;
  } else {
    rtb_Sum1_d5 = FlyByWire_P.Constant3_Value_p;
  }

  FlyByWire_LagFilter(rtb_Sum1_d5, FlyByWire_P.LagFilter1_C1_f, FlyByWire_U.in.time.dt, &rtb_Y_k,
                      &FlyByWire_DWork.sf_LagFilter_k);
  rtb_NOT2 = ((FlyByWire_U.in.data.autopilot_custom_on != 0.0) || ((std::abs(rtb_Limiterxi) <=
    FlyByWire_P.CompareToConstant1_const) && (rtb_on_ground == 0)));
  rtb_AND = ((rtb_alpha_floor_inhib == 0) && rtb_NOT2);
  if (!rtb_AND) {
    rtb_Y_k = rtb_Y_i;
  }

  rtb_Gain1_b = rtb_Y_k - rtb_Y_i;
  rtb_Y_i = FlyByWire_P.Gain4_Gain_o * rtb_Gain1_b;
  rtb_Gain1_b = FlyByWire_P.Gain7_Gain * rtb_Gain1_b * FlyByWire_P.DiscreteTimeIntegratorVariableTs1_Gain *
    FlyByWire_U.in.time.dt;
  FlyByWire_DWork.icLoad_id = ((!rtb_AND) || FlyByWire_DWork.icLoad_id);
  if (FlyByWire_DWork.icLoad_id) {
    FlyByWire_DWork.Delay_DSTATE_gt = FlyByWire_P.fbw_output_MATLABStruct.roll.output.zeta_deg - rtb_Gain1_b;
  }

  FlyByWire_DWork.Delay_DSTATE_gt += rtb_Gain1_b;
  if (FlyByWire_DWork.Delay_DSTATE_gt > FlyByWire_P.DiscreteTimeIntegratorVariableTs1_UpperLimit) {
    FlyByWire_DWork.Delay_DSTATE_gt = FlyByWire_P.DiscreteTimeIntegratorVariableTs1_UpperLimit;
  } else if (FlyByWire_DWork.Delay_DSTATE_gt < FlyByWire_P.DiscreteTimeIntegratorVariableTs1_LowerLimit) {
    FlyByWire_DWork.Delay_DSTATE_gt = FlyByWire_P.DiscreteTimeIntegratorVariableTs1_LowerLimit;
  }

  FlyByWire_RateLimiter(rtb_Y_i + FlyByWire_DWork.Delay_DSTATE_gt, FlyByWire_P.RateLimiterVariableTs1_up_p,
                        FlyByWire_P.RateLimiterVariableTs1_lo_hd, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterVariableTs1_InitialCondition_f, &rtb_Y_k,
                        &FlyByWire_DWork.sf_RateLimiter_bo);
  if (static_cast<real_T>(rtb_NOT2) > FlyByWire_P.Saturation_UpperSat_k) {
    rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_k;
  } else if (static_cast<real_T>(rtb_NOT2) < FlyByWire_P.Saturation_LowerSat_ae) {
    rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_ae;
  } else {
    rtb_Gain1_b = rtb_NOT2;
  }

  rtb_Gain1_b = ((rtb_Sum1_c * rtb_Y_k + rtb_LimiteriH) * rtb_Gain1_b + (FlyByWire_P.Constant_Value_l - rtb_Gain1_b) *
                 FlyByWire_P.Constant3_Value_l) + rtb_Limiterxi1;
  rtb_LimiteriH = rtb_Limiterxi + rtb_Gain1_b;
  if (FlyByWire_U.in.data.H_radio_ft <= FlyByWire_P.CompareToConstant_const_g) {
    rtb_Gain1_b = FlyByWire_P.Constant2_Value_c;
  }

  rtb_Gain1_b = FlyByWire_P.Gain4_Gain_h * rtb_Gain1_b * FlyByWire_P.DiscreteTimeIntegratorVariableTs1_Gain_e *
    FlyByWire_U.in.time.dt;
  FlyByWire_DWork.icLoad_c = ((FlyByWire_U.in.data.autopilot_custom_on == 0.0) || (rtb_alpha_floor_inhib != 0) ||
    FlyByWire_DWork.icLoad_c);
  if (FlyByWire_DWork.icLoad_c) {
    FlyByWire_DWork.Delay_DSTATE_fz = rtb_BusAssignment_sim_data_zeta_trim_deg - rtb_Gain1_b;
  }

  FlyByWire_DWork.Delay_DSTATE_fz += rtb_Gain1_b;
  if (FlyByWire_DWork.Delay_DSTATE_fz > FlyByWire_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_e) {
    FlyByWire_DWork.Delay_DSTATE_fz = FlyByWire_P.DiscreteTimeIntegratorVariableTs1_UpperLimit_e;
  } else if (FlyByWire_DWork.Delay_DSTATE_fz < FlyByWire_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_o) {
    FlyByWire_DWork.Delay_DSTATE_fz = FlyByWire_P.DiscreteTimeIntegratorVariableTs1_LowerLimit_o;
  }

  rtb_Sum1_d5 = FlyByWire_DWork.Delay_DSTATE_fz - FlyByWire_DWork.Delay_DSTATE_j5;
  rtb_Sum1_c = FlyByWire_P.Constant_Value_b * FlyByWire_U.in.time.dt;
  if (rtb_Sum1_d5 < rtb_Sum1_c) {
    rtb_Sum1_c = rtb_Sum1_d5;
  }

  rtb_Sum1_d5 = FlyByWire_U.in.time.dt * FlyByWire_P.Constant1_Value_a;
  if (rtb_Sum1_c > rtb_Sum1_d5) {
    rtb_Sum1_d5 = rtb_Sum1_c;
  }

  FlyByWire_DWork.Delay_DSTATE_j5 += rtb_Sum1_d5;
  rtb_Sum1_d5 = rtb_BusAssignment_p_roll_data_computed_in_flight_gain + FlyByWire_U.in.data.autopilot_custom_on;
  if (rtb_Sum1_d5 > FlyByWire_P.Saturation1_UpperSat_e) {
    rtb_Gain1_b = FlyByWire_P.Saturation1_UpperSat_e;
  } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation1_LowerSat_l) {
    rtb_Gain1_b = FlyByWire_P.Saturation1_LowerSat_l;
  } else {
    rtb_Gain1_b = rtb_Sum1_d5;
  }

  if (rtb_Gain1_b > FlyByWire_P.Saturation_UpperSat_ll) {
    rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_ll;
  } else if (rtb_Gain1_b < FlyByWire_P.Saturation_LowerSat_og) {
    rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_og;
  }

  rtb_Y_i = (FlyByWire_P.Constant_Value_l1 - rtb_Gain1_b) * rtb_BusAssignment_p_roll_data_computed_delta_xi_deg +
    rtb_Limiterxi_o * rtb_Gain1_b;
  if (rtb_Sum1_d5 > FlyByWire_P.Saturation_UpperSat_eq) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_UpperSat_eq;
  } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation_LowerSat_n) {
    rtb_Sum1_d5 = FlyByWire_P.Saturation_LowerSat_n;
  }

  if (rtb_Sum1_d5 > FlyByWire_P.Saturation_UpperSat_i) {
    rtb_Gain1_b = FlyByWire_P.Saturation_UpperSat_i;
  } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation_LowerSat_fr) {
    rtb_Gain1_b = FlyByWire_P.Saturation_LowerSat_fr;
  } else {
    rtb_Gain1_b = rtb_Sum1_d5;
  }

  rtb_Limiterxi = rtb_LimiteriH * rtb_Gain1_b;
  rtb_Gain1_b = (FlyByWire_P.Constant_Value_f - rtb_Gain1_b) * rtb_Gain1_o;
  rtb_Limiterxi += rtb_Gain1_b;
  FlyByWire_Y.out.roll.law_normal.zeta_tc_yd_deg = rtb_Limiterxi1;
  rtb_Y_k = rtb_Limiterxi;
  FlyByWire_RateLimiter(rtb_LimiteriH_n, FlyByWire_P.RateLimitereta_up, FlyByWire_P.RateLimitereta_lo,
                        FlyByWire_U.in.time.dt, FlyByWire_P.RateLimitereta_InitialCondition, &rtb_Gain1_b,
                        &FlyByWire_DWork.sf_RateLimiter_mi);
  FlyByWire_RateLimiter(rtb_Y_i, FlyByWire_P.RateLimiterxi_up, FlyByWire_P.RateLimiterxi_lo, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterxi_InitialCondition, &rtb_Limiterxi, &FlyByWire_DWork.sf_RateLimiter_h);
  FlyByWire_RateLimiter(rtb_Y_k, FlyByWire_P.RateLimiterzeta_up, FlyByWire_P.RateLimiterzeta_lo, FlyByWire_U.in.time.dt,
                        FlyByWire_P.RateLimiterzeta_InitialCondition, &rtb_Limiterxi1,
                        &FlyByWire_DWork.sf_RateLimiter_d0);
  FlyByWire_Y.out.sim.time.dt = FlyByWire_U.in.time.dt;
  FlyByWire_Y.out.sim.time.simulation_time = FlyByWire_U.in.time.simulation_time;
  FlyByWire_Y.out.sim.time.monotonic_time = FlyByWire_DWork.Delay_DSTATE;
  FlyByWire_Y.out.sim.data.nz_g = FlyByWire_U.in.data.nz_g;
  FlyByWire_Y.out.sim.data.Theta_deg = rtb_GainTheta;
  FlyByWire_Y.out.sim.data.Phi_deg = rtb_GainPhi;
  FlyByWire_Y.out.sim.data.q_deg_s = rtb_Gainqk;
  FlyByWire_Y.out.sim.data.r_deg_s = rtb_Gain;
  FlyByWire_Y.out.sim.data.p_deg_s = rtb_Gainpk;
  FlyByWire_Y.out.sim.data.qk_deg_s = rtb_qk;
  FlyByWire_Y.out.sim.data.pk_deg_s = rtb_BusAssignment_a_sim_data_pk_deg_s;
  FlyByWire_Y.out.sim.data.qk_dot_deg_s2 = rtb_BusAssignment_a_sim_data_qk_dot_deg_s2;
  FlyByWire_Y.out.sim.data.psi_magnetic_deg = FlyByWire_U.in.data.psi_magnetic_deg;
  FlyByWire_Y.out.sim.data.psi_true_deg = FlyByWire_U.in.data.psi_true_deg;
  FlyByWire_Y.out.sim.data.eta_deg = rtb_Gainpk4;
  FlyByWire_Y.out.sim.data.eta_trim_deg = rtb_Gainpk2;
  FlyByWire_Y.out.sim.data.xi_deg = FlyByWire_P.Gainpk5_Gain * FlyByWire_U.in.data.xi_pos;
  FlyByWire_Y.out.sim.data.zeta_trim_deg = rtb_BusAssignment_sim_data_zeta_trim_deg;
  FlyByWire_Y.out.sim.data.alpha_deg = FlyByWire_U.in.data.alpha_deg;
  FlyByWire_Y.out.sim.data.beta_deg = FlyByWire_U.in.data.beta_deg;
  FlyByWire_Y.out.sim.data.beta_dot_deg_s = FlyByWire_U.in.data.beta_dot_deg_s;
  FlyByWire_Y.out.sim.data.V_ias_kn = FlyByWire_U.in.data.V_ias_kn;
  FlyByWire_Y.out.sim.data.V_tas_kn = FlyByWire_U.in.data.V_tas_kn;
  FlyByWire_Y.out.sim.data.V_mach = FlyByWire_U.in.data.V_mach;
  FlyByWire_Y.out.sim.data.H_ft = FlyByWire_U.in.data.H_ft;
  FlyByWire_Y.out.sim.data.H_ind_ft = FlyByWire_U.in.data.H_ind_ft;
  FlyByWire_Y.out.sim.data.H_radio_ft = FlyByWire_U.in.data.H_radio_ft;
  FlyByWire_Y.out.sim.data.CG_percent_MAC = FlyByWire_U.in.data.CG_percent_MAC;
  FlyByWire_Y.out.sim.data.total_weight_kg = FlyByWire_U.in.data.total_weight_kg;
  rtb_Sum1_d5 = FlyByWire_P.Gain_Gain_i * FlyByWire_U.in.data.gear_animation_pos_0 - FlyByWire_P.Constant_Value_g;
  if (rtb_Sum1_d5 > FlyByWire_P.Saturation_UpperSat_e) {
    FlyByWire_Y.out.sim.data.gear_strut_compression_0 = FlyByWire_P.Saturation_UpperSat_e;
  } else if (rtb_Sum1_d5 < FlyByWire_P.Saturation_LowerSat_e) {
    FlyByWire_Y.out.sim.data.gear_strut_compression_0 = FlyByWire_P.Saturation_LowerSat_e;
  } else {
    FlyByWire_Y.out.sim.data.gear_strut_compression_0 = rtb_Sum1_d5;
  }

  FlyByWire_Y.out.sim.data.gear_strut_compression_1 = u0;
  FlyByWire_Y.out.sim.data.gear_strut_compression_2 = u0_0;
  FlyByWire_Y.out.sim.data.flaps_handle_index = FlyByWire_U.in.data.flaps_handle_index;
  FlyByWire_Y.out.sim.data.spoilers_left_pos = FlyByWire_U.in.data.spoilers_left_pos;
  FlyByWire_Y.out.sim.data.spoilers_right_pos = FlyByWire_U.in.data.spoilers_right_pos;
  FlyByWire_Y.out.sim.data.autopilot_master_on = FlyByWire_U.in.data.autopilot_master_on;
  FlyByWire_Y.out.sim.data.slew_on = FlyByWire_U.in.data.slew_on;
  FlyByWire_Y.out.sim.data.pause_on = FlyByWire_U.in.data.pause_on;
  FlyByWire_Y.out.sim.data.tracking_mode_on_override = FlyByWire_U.in.data.tracking_mode_on_override;
  FlyByWire_Y.out.sim.data.autopilot_custom_on = FlyByWire_U.in.data.autopilot_custom_on;
  FlyByWire_Y.out.sim.data.autopilot_custom_Theta_c_deg = FlyByWire_U.in.data.autopilot_custom_Theta_c_deg;
  FlyByWire_Y.out.sim.data.autopilot_custom_Phi_c_deg = FlyByWire_U.in.data.autopilot_custom_Phi_c_deg;
  FlyByWire_Y.out.sim.data.autopilot_custom_Beta_c_deg = FlyByWire_U.in.data.autopilot_custom_Beta_c_deg;
  FlyByWire_Y.out.sim.data.simulation_rate = FlyByWire_U.in.data.simulation_rate;
  FlyByWire_Y.out.sim.data.ice_structure_percent = FlyByWire_U.in.data.ice_structure_percent;
  FlyByWire_Y.out.sim.data.linear_cl_alpha_per_deg = FlyByWire_U.in.data.linear_cl_alpha_per_deg;
  FlyByWire_Y.out.sim.data.alpha_stall_deg = FlyByWire_U.in.data.alpha_stall_deg;
  FlyByWire_Y.out.sim.data.alpha_zero_lift_deg = FlyByWire_U.in.data.alpha_zero_lift_deg;
  FlyByWire_Y.out.sim.data.ambient_density_kg_per_m3 = FlyByWire_U.in.data.ambient_density_kg_per_m3;
  FlyByWire_Y.out.sim.data.ambient_pressure_mbar = FlyByWire_U.in.data.ambient_pressure_mbar;
  FlyByWire_Y.out.sim.data.ambient_temperature_celsius = FlyByWire_U.in.data.ambient_temperature_celsius;
  FlyByWire_Y.out.sim.data.ambient_wind_x_kn = FlyByWire_U.in.data.ambient_wind_x_kn;
  FlyByWire_Y.out.sim.data.ambient_wind_y_kn = FlyByWire_U.in.data.ambient_wind_y_kn;
  FlyByWire_Y.out.sim.data.ambient_wind_z_kn = FlyByWire_U.in.data.ambient_wind_z_kn;
  FlyByWire_Y.out.sim.data.ambient_wind_velocity_kn = FlyByWire_U.in.data.ambient_wind_velocity_kn;
  FlyByWire_Y.out.sim.data.ambient_wind_direction_deg = FlyByWire_U.in.data.ambient_wind_direction_deg;
  FlyByWire_Y.out.sim.data.total_air_temperature_celsius = FlyByWire_U.in.data.total_air_temperature_celsius;
  FlyByWire_Y.out.sim.data.latitude_deg = FlyByWire_U.in.data.latitude_deg;
  FlyByWire_Y.out.sim.data.longitude_deg = FlyByWire_U.in.data.longitude_deg;
  FlyByWire_Y.out.sim.data.engine_1_thrust_lbf = FlyByWire_U.in.data.engine_1_thrust_lbf;
  FlyByWire_Y.out.sim.data.engine_2_thrust_lbf = FlyByWire_U.in.data.engine_2_thrust_lbf;
  FlyByWire_Y.out.sim.data.thrust_lever_1_pos = FlyByWire_U.in.data.thrust_lever_1_pos;
  FlyByWire_Y.out.sim.data.thrust_lever_2_pos = FlyByWire_U.in.data.thrust_lever_2_pos;
  FlyByWire_Y.out.sim.data.tailstrike_protection_on = FlyByWire_U.in.data.tailstrike_protection_on;
  FlyByWire_Y.out.sim.data.VLS_kn = FlyByWire_U.in.data.VLS_kn;
  FlyByWire_Y.out.sim.data_computed.on_ground = rtb_on_ground;
  FlyByWire_Y.out.sim.data_computed.tracking_mode_on = rtb_alpha_floor_inhib;
  FlyByWire_Y.out.sim.data_computed.high_aoa_prot_active = FlyByWire_DWork.sProtActive_k;
  FlyByWire_Y.out.sim.data_computed.alpha_floor_command = FlyByWire_DWork.sAlphaFloor;
  FlyByWire_Y.out.sim.data_computed.high_speed_prot_active = FlyByWire_DWork.sProtActive;
  FlyByWire_Y.out.sim.data_computed.high_speed_prot_low_kn = rtb_Min3;
  FlyByWire_Y.out.sim.data_computed.high_speed_prot_high_kn = rtb_Min5;
  FlyByWire_Y.out.sim.data_speeds_aoa.alpha_max_deg = rtb_BusAssignment_c_sim_data_speeds_aoa_alpha_max_deg;
  FlyByWire_Y.out.sim.data_speeds_aoa.alpha_prot_deg = rtb_Switch;
  FlyByWire_Y.out.sim.input.delta_eta_pos = rtb_BusAssignment_sim_input_delta_eta_pos;
  FlyByWire_Y.out.sim.input.delta_xi_pos = rtb_BusAssignment_sim_input_delta_xi_pos;
  FlyByWire_Y.out.sim.input.delta_zeta_pos = rtb_BusAssignment_sim_input_delta_zeta_pos;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_limit_lo =
    rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_lo;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_limit_up =
    rtb_BusAssignment_cs_pitch_data_computed_eta_trim_deg_limit_up;
  FlyByWire_Y.out.pitch.data_computed.delta_eta_deg = rtb_BusAssignment_cs_pitch_data_computed_delta_eta_deg;
  FlyByWire_Y.out.pitch.data_computed.in_flight = FlyByWire_B.in_flight;
  FlyByWire_Y.out.pitch.data_computed.in_rotation = rtb_ap_special_disc;
  FlyByWire_Y.out.pitch.data_computed.in_flare = rtb_in_flare;
  FlyByWire_Y.out.pitch.data_computed.in_flight_gain = rtb_BusAssignment_cs_pitch_data_computed_in_flight_gain;
  FlyByWire_Y.out.pitch.data_computed.in_rotation_gain = rtb_BusAssignment_cs_pitch_data_computed_in_rotation_gain;
  FlyByWire_Y.out.pitch.data_computed.nz_limit_lo_g = rtb_BusAssignment_cs_pitch_data_computed_nz_limit_lo_g;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_should_freeze = rtb_eta_trim_deg_should_freeze;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_reset = rtb_eta_trim_deg_reset;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_reset_deg = rtb_nz_limit_up_g;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_should_write = rtb_eta_trim_deg_should_write;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_rate_limit_up_deg_s = rtb_ManualSwitch;
  FlyByWire_Y.out.pitch.data_computed.eta_trim_deg_rate_limit_lo_deg_s = rtb_eta_trim_deg_rate_limit_lo_deg_s;
  FlyByWire_Y.out.pitch.data_computed.flare_Theta_c_deg = FlyByWire_DWork.Delay_DSTATE_dq;
  FlyByWire_Y.out.pitch.data_computed.flare_Theta_c_rate_deg_s = FlyByWire_B.flare_Theta_c_rate_deg_s;
  FlyByWire_Y.out.pitch.law_rotation.eta_deg = rtb_Limitereta;
  FlyByWire_Y.out.pitch.law_normal.protection_alpha_c_deg = rtb_Switch + rtb_Switch_c;
  FlyByWire_Y.out.pitch.law_normal.protection_V_c_kn = rtb_v_target;
  FlyByWire_Y.out.pitch.vote.eta_dot_deg_s = rtb_Limitereta_d;
  FlyByWire_Y.out.pitch.integrated.eta_deg = FlyByWire_DWork.Delay_DSTATE_f1;
  FlyByWire_Y.out.pitch.output.eta_deg = rtb_LimiteriH_n;
  FlyByWire_Y.out.pitch.output.eta_trim_deg = FlyByWire_DWork.Delay_DSTATE_ea;
  FlyByWire_Y.out.roll.data_computed.delta_xi_deg = rtb_BusAssignment_p_roll_data_computed_delta_xi_deg;
  FlyByWire_Y.out.roll.data_computed.delta_zeta_deg = rtb_Gain1_o;
  FlyByWire_Y.out.roll.data_computed.in_flight = rtb_nz_limit_lo_g;
  FlyByWire_Y.out.roll.data_computed.in_flight_gain = rtb_BusAssignment_p_roll_data_computed_in_flight_gain;
  FlyByWire_Y.out.roll.data_computed.zeta_trim_deg_should_write = (FlyByWire_U.in.data.autopilot_custom_on != 0.0);
  FlyByWire_Y.out.roll.data_computed.beta_target_deg = rtb_Product_e;
  FlyByWire_Y.out.roll.law_normal.xi_deg = rtb_Limiterxi_o;
  FlyByWire_Y.out.roll.law_normal.zeta_deg = rtb_LimiteriH;
  FlyByWire_Y.out.roll.output.xi_deg = rtb_Y_i;
  FlyByWire_Y.out.roll.output.zeta_deg = rtb_Y_k;
  FlyByWire_Y.out.roll.output.zeta_trim_deg = FlyByWire_DWork.Delay_DSTATE_j5;
  u0 = FlyByWire_P.Gaineta_Gain_d * rtb_Gain1_b;
  if (u0 > FlyByWire_P.Limitereta_UpperSat) {
    FlyByWire_Y.out.output.eta_pos = FlyByWire_P.Limitereta_UpperSat;
  } else if (u0 < FlyByWire_P.Limitereta_LowerSat) {
    FlyByWire_Y.out.output.eta_pos = FlyByWire_P.Limitereta_LowerSat;
  } else {
    FlyByWire_Y.out.output.eta_pos = u0;
  }

  u0 = FlyByWire_P.GainiH_Gain * FlyByWire_DWork.Delay_DSTATE_ea;
  if (u0 > FlyByWire_P.LimiteriH_UpperSat) {
    FlyByWire_Y.out.output.eta_trim_deg = FlyByWire_P.LimiteriH_UpperSat;
  } else if (u0 < FlyByWire_P.LimiteriH_LowerSat) {
    FlyByWire_Y.out.output.eta_trim_deg = FlyByWire_P.LimiteriH_LowerSat;
  } else {
    FlyByWire_Y.out.output.eta_trim_deg = u0;
  }

  FlyByWire_Y.out.output.eta_trim_deg_should_write = rtb_eta_trim_deg_should_write;
  u0 = FlyByWire_P.Gainxi_Gain_n * rtb_Limiterxi;
  if (u0 > FlyByWire_P.Limiterxi_UpperSat) {
    FlyByWire_Y.out.output.xi_pos = FlyByWire_P.Limiterxi_UpperSat;
  } else if (u0 < FlyByWire_P.Limiterxi_LowerSat) {
    FlyByWire_Y.out.output.xi_pos = FlyByWire_P.Limiterxi_LowerSat;
  } else {
    FlyByWire_Y.out.output.xi_pos = u0;
  }

  u0 = FlyByWire_P.Gainxi1_Gain_e * rtb_Limiterxi1;
  if (u0 > FlyByWire_P.Limiterxi1_UpperSat) {
    FlyByWire_Y.out.output.zeta_pos = FlyByWire_P.Limiterxi1_UpperSat;
  } else if (u0 < FlyByWire_P.Limiterxi1_LowerSat) {
    FlyByWire_Y.out.output.zeta_pos = FlyByWire_P.Limiterxi1_LowerSat;
  } else {
    FlyByWire_Y.out.output.zeta_pos = u0;
  }

  u0 = FlyByWire_P.Gainxi2_Gain * FlyByWire_DWork.Delay_DSTATE_j5;
  if (u0 > FlyByWire_P.Limiterxi2_UpperSat) {
    FlyByWire_Y.out.output.zeta_trim_pos = FlyByWire_P.Limiterxi2_UpperSat;
  } else if (u0 < FlyByWire_P.Limiterxi2_LowerSat) {
    FlyByWire_Y.out.output.zeta_trim_pos = FlyByWire_P.Limiterxi2_LowerSat;
  } else {
    FlyByWire_Y.out.output.zeta_trim_pos = u0;
  }

  FlyByWire_Y.out.output.zeta_trim_pos_should_write = (FlyByWire_U.in.data.autopilot_custom_on != 0.0);
  FlyByWire_DWork.Delay_DSTATE_d = rtb_Gain_kh;
  FlyByWire_DWork.Delay_DSTATE_f = rtb_Gain_i;
  FlyByWire_DWork.Delay_DSTATE_dd = rtb_Gain_g;
  FlyByWire_DWork.icLoad = false;
  FlyByWire_DWork.Delay_DSTATE_j = rtb_Gain_iw;
  FlyByWire_DWork.Delay_DSTATE_c = rtb_Divide_m;
  FlyByWire_DWork.Delay_DSTATE_p = rtb_Gain_oj;
  FlyByWire_DWork.Delay_DSTATE_m = rtb_Divide_e;
  FlyByWire_DWork.Delay_DSTATE_ps = rtb_Y;
  FlyByWire_DWork.Delay_DSTATE_c1 = rtb_Y_o;
  FlyByWire_DWork.Delay_DSTATE_l = rtb_Y_c;
  FlyByWire_DWork.Delay_DSTATE_n = rtb_Limiterxi2;
  FlyByWire_DWork.Delay_DSTATE_ca = rtb_Loaddemand;
  FlyByWire_DWork.Delay_DSTATE_jv = rtb_Divide1;
  FlyByWire_DWork.icLoad_e = false;
  FlyByWire_DWork.icLoad_i = false;
  FlyByWire_DWork.icLoad_m = false;
  FlyByWire_DWork.icLoad_id = false;
  FlyByWire_DWork.icLoad_c = false;
}

void FlyByWireModelClass::initialize()
{
  FlyByWire_DWork.Delay_DSTATE = FlyByWire_P.Delay_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_d = FlyByWire_P.DiscreteDerivativeVariableTs_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_dq = FlyByWire_P.RateLimiterDynamicVariableTs_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_f = FlyByWire_P.DiscreteDerivativeVariableTs_InitialCondition_d;
  FlyByWire_DWork.Delay_DSTATE_dd = FlyByWire_P.DiscreteDerivativeVariableTs_InitialCondition_k;
  FlyByWire_DWork.icLoad = true;
  FlyByWire_DWork.Delay_DSTATE_i = FlyByWire_P.RateLimiterVariableTs3_InitialCondition_e;
  FlyByWire_DWork.Delay_DSTATE_j = FlyByWire_P.DiscreteDerivativeVariableTs2_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_c = FlyByWire_P.Delay_InitialCondition_j;
  FlyByWire_DWork.Delay1_DSTATE = FlyByWire_P.Delay1_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_p = FlyByWire_P.DiscreteDerivativeVariableTs2_InitialCondition_c;
  FlyByWire_DWork.Delay_DSTATE_m = FlyByWire_P.Delay_InitialCondition_l;
  FlyByWire_DWork.Delay1_DSTATE_i = FlyByWire_P.Delay1_InitialCondition_a;
  FlyByWire_DWork.Delay_DSTATE_g = FlyByWire_P.RateLimiterVariableTs4_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_ps = FlyByWire_P.DiscreteDerivativeVariableTs2_InitialCondition_cx;
  FlyByWire_DWork.Delay_DSTATE_c1 = FlyByWire_P.Delay_InitialCondition_k;
  FlyByWire_DWork.Delay1_DSTATE_o = FlyByWire_P.Delay1_InitialCondition_i;
  FlyByWire_DWork.Delay_DSTATE_l = FlyByWire_P.DiscreteDerivativeVariableTs2_InitialCondition_b;
  FlyByWire_DWork.Delay_DSTATE_n = FlyByWire_P.Delay_InitialCondition_p;
  FlyByWire_DWork.Delay1_DSTATE_n = FlyByWire_P.Delay1_InitialCondition_k;
  FlyByWire_DWork.Delay_DSTATE_k = FlyByWire_P.RateLimiterVariableTs5_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_ca = FlyByWire_P.DiscreteDerivativeVariableTs1_InitialCondition;
  FlyByWire_DWork.Delay_DSTATE_jv = FlyByWire_P.DiscreteDerivativeVariableTs_InitialCondition_c;
  FlyByWire_DWork.icLoad_e = true;
  FlyByWire_DWork.icLoad_i = true;
  FlyByWire_DWork.Delay_DSTATE_ea = FlyByWire_P.RateLimiterDynamicVariableTs_InitialCondition_i;
  FlyByWire_DWork.icLoad_m = true;
  FlyByWire_DWork.icLoad_id = true;
  FlyByWire_DWork.Delay_DSTATE_j5 = FlyByWire_P.RateLimiterDynamicVariableTs_InitialCondition_i4;
  FlyByWire_DWork.icLoad_c = true;
}

void FlyByWireModelClass::terminate()
{
}

FlyByWireModelClass::FlyByWireModelClass() :
  FlyByWire_B(),
  FlyByWire_DWork(),
  FlyByWire_U(),
  FlyByWire_Y()
{
}

FlyByWireModelClass::~FlyByWireModelClass()
{
}
