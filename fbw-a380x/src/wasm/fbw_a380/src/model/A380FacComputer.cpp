#include "A380FacComputer.h"
#include "A380FacComputer_types.h"
#include "rtwtypes.h"
#include <cmath>
#include "look2_binlxpw.h"
#include "look1_binlxpw.h"
#include "plook_binx.h"
#include "intrp3d_l_pw.h"

const uint8_T A380FacComputer_IN_Flying{ 1U };

const uint8_T A380FacComputer_IN_Landed{ 2U };

const uint8_T A380FacComputer_IN_Landing100ft{ 3U };

const uint8_T A380FacComputer_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380FacComputer_IN_Takeoff100ft{ 4U };

void A380FacComputer::A380FacComputer_MATLABFunction(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM != static_cast<uint32_T>(SignStatusMatrix::FailureWarning));
}

void A380FacComputer::A380FacComputer_MATLABFunction_g(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
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

void A380FacComputer::A380FacComputer_LagFilter_Reset(rtDW_LagFilter_A380FacComputer_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380FacComputer::A380FacComputer_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380FacComputer_T *localDW)
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

void A380FacComputer::A380FacComputer_RateLimiter_Reset(rtDW_RateLimiter_A380FacComputer_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380FacComputer::A380FacComputer_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, boolean_T
  rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380FacComputer_T *localDW)
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

void A380FacComputer::A380FacComputer_CalculateV_alpha_max(real_T rtu_v_ias, real_T rtu_alpha, real_T rtu_alpha_0,
  real_T rtu_alpha_target, real_T *rty_V_alpha_target)
{
  *rty_V_alpha_target = std::sqrt(std::abs(rtu_alpha - rtu_alpha_0) / (rtu_alpha_target - rtu_alpha_0)) * rtu_v_ias;
}

void A380FacComputer::A380FacComputer_LagFilter_c_Reset(rtDW_LagFilter_A380FacComputer_g_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380FacComputer::A380FacComputer_LagFilter_k(real32_T rtu_U, real_T rtu_C1, real_T rtu_dt, real32_T *rty_Y,
  rtDW_LagFilter_A380FacComputer_g_T *localDW)
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

void A380FacComputer::A380FacComputer_VS1GfromVLS(real_T rtu_vls_conf_0, real_T rtu_vls_conf_other, real_T
  rtu_flap_handle_index, real_T *rty_vs1g)
{
  if (rtu_flap_handle_index == 0.0) {
    *rty_vs1g = rtu_vls_conf_0 / 1.23;
  } else {
    *rty_vs1g = rtu_vls_conf_other / 1.23;
  }
}

void A380FacComputer::A380FacComputer_RateLimiter_o_Reset(rtDW_RateLimiter_A380FacComputer_b_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380FacComputer::A380FacComputer_RateLimiter_f(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380FacComputer_b_T *localDW)
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

void A380FacComputer::A380FacComputer_RateLimiter_h_Reset(rtDW_RateLimiter_A380FacComputer_d_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380FacComputer::A380FacComputer_RateLimiter_p(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, boolean_T rtu_reset, real_T *rty_Y, rtDW_RateLimiter_A380FacComputer_d_T *localDW)
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

void A380FacComputer::A380FacComputer_MATLABFunction_pm_Reset(rtDW_MATLABFunction_A380FacComputer_f_T *localDW)
{
  localDW->output = false;
  localDW->timeSinceCondition = 0.0;
}

void A380FacComputer::A380FacComputer_MATLABFunction_p(boolean_T rtu_u, real_T rtu_Ts, boolean_T rtu_isRisingEdge,
  real_T rtu_timeDelay, boolean_T *rty_y, rtDW_MATLABFunction_A380FacComputer_f_T *localDW)
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

void A380FacComputer::A380FacComputer_MATLABFunction_g3(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380FacComputer::step()
{
  real_T fractions[3];
  real_T fractions_0[3];
  real_T fractions_1[3];
  real_T fractions_2[3];
  real_T Vcas;
  real_T rtb_BusAssignment_c_flight_envelope_v_ls_kn;
  real_T rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg;
  real_T rtb_BusAssignment_f_flight_envelope_v_alpha_max_kn;
  real_T rtb_BusAssignment_f_flight_envelope_v_fe_next_kn;
  real_T rtb_BusAssignment_f_flight_envelope_v_stall_kn;
  real_T rtb_BusAssignment_kv_flight_envelope_v_alpha_prot_kn;
  real_T rtb_Gain;
  real_T rtb_Switch;
  real_T rtb_Switch1;
  real_T rtb_Switch4_f;
  real_T rtb_Switch6;
  real_T rtb_Switch_b;
  real_T rtb_Y_br;
  real_T rtb_Y_g4;
  real_T rtb_Y_l;
  real_T rtb_beta;
  real_T rtb_conf;
  real_T rtb_vs1g;
  real_T rtb_vs1g_h;
  int32_T rtb_alpha_floor_inhib;
  int32_T rtb_speed_trend_kn_SSM;
  int32_T rtb_v_3_kn_SSM;
  int32_T rtb_v_4_kn_SSM;
  int32_T rtb_v_alpha_prot_kn_SSM;
  int32_T rtb_v_ls_kn_SSM;
  int32_T rtb_v_man_kn_SSM;
  int32_T rtb_v_stall_kn_SSM;
  int32_T rtb_v_stall_warn_kn_SSM;
  real32_T rtb_DataTypeConversion2;
  real32_T rtb_Switch_i_idx_0;
  real32_T rtb_Switch_i_idx_1;
  real32_T rtb_Switch_i_idx_2;
  real32_T rtb_Switch_i_idx_3;
  real32_T rtb_V_ias;
  real32_T rtb_V_tas;
  real32_T rtb_alpha;
  real32_T rtb_alt;
  real32_T rtb_mach;
  real32_T rtb_n_x;
  real32_T rtb_n_y;
  real32_T rtb_n_z;
  real32_T rtb_p_s_c;
  real32_T rtb_phi;
  real32_T rtb_phi_dot;
  real32_T rtb_q;
  real32_T rtb_r;
  real32_T rtb_theta;
  real32_T rtb_theta_dot;
  real32_T rtb_y_a;
  real32_T rtb_y_oi;
  uint32_T bpIndices[3];
  uint32_T bpIndices_0[3];
  uint32_T bpIndices_1[3];
  uint32_T bpIndices_2[3];
  uint32_T rtb_y_ep;
  uint32_T rtb_y_ig;
  uint32_T rtb_y_l2;
  uint32_T rtb_y_m;
  uint32_T rtb_y_os;
  uint32_T rtb_y_p;
  uint32_T rtb_y_ph;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_VectorConcatenate_i[19];
  boolean_T guard1;
  boolean_T rtb_AND;
  boolean_T rtb_AND1;
  boolean_T rtb_AND1_d;
  boolean_T rtb_BusAssignment_d_flight_envelope_beta_target_visible;
  boolean_T rtb_BusAssignment_d_logic_speed_scale_visible;
  boolean_T rtb_BusAssignment_f_flight_envelope_v_3_visible;
  boolean_T rtb_BusAssignment_h_logic_on_ground;
  boolean_T rtb_BusAssignment_logic_lgciu_own_valid;
  boolean_T rtb_BusAssignment_m_logic_sfcc_own_valid;
  boolean_T rtb_DataTypeConversion_f5;
  boolean_T rtb_DataTypeConversion_gi;
  boolean_T rtb_DataTypeConversion_kr;
  boolean_T rtb_DataTypeConversion_l3;
  boolean_T rtb_DataTypeConversion_l5;
  boolean_T rtb_DataTypeConversion_o;
  boolean_T rtb_Memory;
  boolean_T rtb_OR1;
  boolean_T rtb_Switch_io_idx_1;
  boolean_T rtb_Switch_io_idx_2;
  boolean_T rtb_rudderTravelLimEngaged;
  boolean_T rtb_rudderTrimEngaged;
  boolean_T rtb_y_b4;
  boolean_T rtb_y_h;
  boolean_T rtb_y_ool;
  boolean_T rtb_yawDamperEngaged;
  boolean_T rudderTravelLimCanEngage;
  boolean_T rudderTravelLimHasPriority;
  boolean_T rudderTrimCanEngage;
  boolean_T rudderTrimHasPriority;
  boolean_T yawDamperCanEngage;
  boolean_T yawDamperHasPriority;
  if (A380FacComputer_U.in.sim_data.computer_running) {
    if (!A380FacComputer_DWork.Runtime_MODE) {
      A380FacComputer_DWork.Delay_DSTATE = A380FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
      A380FacComputer_DWork.Delay_DSTATE_d = A380FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition_l;
      A380FacComputer_DWork.Memory_PreviousInput = A380FacComputer_P.SRFlipFlop_initial_condition;
      A380FacComputer_DWork.icLoad = true;
      A380FacComputer_MATLABFunction_pm_Reset(&A380FacComputer_DWork.sf_MATLABFunction_a);
      A380FacComputer_MATLABFunction_pm_Reset(&A380FacComputer_DWork.sf_MATLABFunction_jf);
      A380FacComputer_MATLABFunction_pm_Reset(&A380FacComputer_DWork.sf_MATLABFunction_p);
      A380FacComputer_LagFilter_Reset(&A380FacComputer_DWork.sf_LagFilter_d);
      A380FacComputer_LagFilter_c_Reset(&A380FacComputer_DWork.sf_LagFilter_k);
      A380FacComputer_LagFilter_Reset(&A380FacComputer_DWork.sf_LagFilter_f);
      A380FacComputer_LagFilter_c_Reset(&A380FacComputer_DWork.sf_LagFilter_d5);
      A380FacComputer_LagFilter_Reset(&A380FacComputer_DWork.sf_LagFilter_c);
      A380FacComputer_RateLimiter_Reset(&A380FacComputer_DWork.sf_RateLimiter);
      A380FacComputer_LagFilter_Reset(&A380FacComputer_DWork.sf_LagFilter);
      A380FacComputer_DWork.is_active_c15_A380FacComputer = 0U;
      A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_NO_ACTIVE_CHILD;
      A380FacComputer_DWork.sAlphaFloor = 0.0;
      A380FacComputer_RateLimiter_Reset(&A380FacComputer_DWork.sf_RateLimiter_c);
      A380FacComputer_RateLimiter_Reset(&A380FacComputer_DWork.sf_RateLimiter_a);
      A380FacComputer_RateLimiter_Reset(&A380FacComputer_DWork.sf_RateLimiter_n);
      A380FacComputer_RateLimiter_Reset(&A380FacComputer_DWork.sf_RateLimiter_j);
      A380FacComputer_RateLimiter_o_Reset(&A380FacComputer_DWork.sf_RateLimiter_g0);
      A380FacComputer_DWork.takeoff_config = 0.0;
      A380FacComputer_RateLimiter_o_Reset(&A380FacComputer_DWork.sf_RateLimiter_g);
      A380FacComputer_DWork.takeoff_config_c = 0.0;
      A380FacComputer_DWork.takeoff_config_g = 0.0;
      A380FacComputer_LagFilter_Reset(&A380FacComputer_DWork.sf_LagFilter_i);
      A380FacComputer_RateLimiter_o_Reset(&A380FacComputer_DWork.sf_RateLimiter_f);
      A380FacComputer_DWork.previousInput_not_empty = false;
      A380FacComputer_RateLimiter_h_Reset(&A380FacComputer_DWork.sf_RateLimiter_l);
      A380FacComputer_DWork.pY_not_empty = false;
      A380FacComputer_DWork.pU_not_empty = false;
      A380FacComputer_RateLimiter_h_Reset(&A380FacComputer_DWork.sf_RateLimiter_fu);
      A380FacComputer_RateLimiter_h_Reset(&A380FacComputer_DWork.sf_RateLimiter_p);
      A380FacComputer_DWork.Runtime_MODE = true;
    }

    A380FacComputer_MATLABFunction(&A380FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_1, &rtb_y_b4);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      A380FacComputer_P.BitfromLabel_bit, &rtb_y_ep);
    A380FacComputer_MATLABFunction_p((A380FacComputer_U.in.discrete_inputs.nose_gear_pressed == (rtb_y_ep != 0U)),
      A380FacComputer_U.in.time.dt, A380FacComputer_P.ConfirmNode_isRisingEdge, A380FacComputer_P.ConfirmNode_timeDelay,
      &rtb_y_ool, &A380FacComputer_DWork.sf_MATLABFunction_a);
    rtb_Memory = (rtb_y_b4 && rtb_y_ool);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      A380FacComputer_P.BitfromLabel5_bit, &rtb_y_p);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_2,
      A380FacComputer_P.BitfromLabel6_bit, &rtb_y_l2);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_3,
      A380FacComputer_P.BitfromLabel7_bit, &rtb_y_ph);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.lgciu_own_bus.discrete_word_3,
      A380FacComputer_P.BitfromLabel8_bit, &rtb_y_ig);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel1_bit, &rtb_y_ep);
    A380FacComputer_MATLABFunction(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5, &rtb_y_b4);
    rtb_AND1 = ((rtb_y_ep != 0U) && rtb_y_b4);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel4_bit, &rtb_y_m);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel3_bit, &rtb_y_os);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel2_bit, &rtb_y_ep);
    if (rtb_Memory) {
      rtb_y_b4 = (rtb_y_p != 0U);
      rtb_Switch_io_idx_1 = (rtb_y_l2 != 0U);
      rtb_Switch_io_idx_2 = ((rtb_y_ph != 0U) || (rtb_y_ig != 0U));
    } else if (rtb_AND1) {
      rtb_y_b4 = (rtb_y_m != 0U);
      rtb_Switch_io_idx_1 = (rtb_y_os != 0U);
      rtb_Switch_io_idx_2 = (rtb_y_ep != 0U);
    } else {
      rtb_y_b4 = A380FacComputer_P.Constant_Value_c;
      rtb_Switch_io_idx_1 = A380FacComputer_P.Constant_Value_c;
      rtb_Switch_io_idx_2 = A380FacComputer_P.Constant_Value_c;
    }

    rtb_BusAssignment_logic_lgciu_own_valid = rtb_Memory;
    rtb_AND1 = ((!rtb_Memory) && (!rtb_AND1));
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel1_bit_d, &rtb_y_ep);
    A380FacComputer_MATLABFunction(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5, &rtb_y_ool);
    rtb_AND1_d = ((rtb_y_ep != 0U) && rtb_y_ool);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel8_bit_i, &rtb_y_p);
    rtb_DataTypeConversion_gi = (rtb_y_p != 0U);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel9_bit, &rtb_y_l2);
    rtb_DataTypeConversion_l5 = (rtb_y_l2 != 0U);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel10_bit, &rtb_y_ph);
    rtb_DataTypeConversion_o = (rtb_y_ph != 0U);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel11_bit, &rtb_y_ig);
    rtb_DataTypeConversion_f5 = (rtb_y_ig != 0U);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_5,
      A380FacComputer_P.BitfromLabel12_bit, &rtb_y_ep);
    rtb_DataTypeConversion_l3 = (rtb_y_ep != 0U);
    A380FacComputer_MATLABFunction(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      &rtb_Memory);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word,
      A380FacComputer_P.BitfromLabel_bit_m, &rtb_y_ep);
    A380FacComputer_MATLABFunction_p((A380FacComputer_U.in.discrete_inputs.slats_extended != (rtb_y_ep != 0U)),
      A380FacComputer_U.in.time.dt, A380FacComputer_P.ConfirmNode_isRisingEdge_a,
      A380FacComputer_P.ConfirmNode_timeDelay_m, &rtb_y_ool, &A380FacComputer_DWork.sf_MATLABFunction_jf);
    rtb_DataTypeConversion_kr = (rtb_Memory && rtb_y_ool);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      A380FacComputer_P.BitfromLabel2_bit_n, &rtb_y_ep);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      A380FacComputer_P.BitfromLabel3_bit_i, &rtb_y_ig);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      A380FacComputer_P.BitfromLabel4_bit_p, &rtb_y_ph);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      A380FacComputer_P.BitfromLabel5_bit_g, &rtb_y_m);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      A380FacComputer_P.BitfromLabel6_bit_n, &rtb_y_p);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_system_status_word,
      A380FacComputer_P.BitfromLabel7_bit_p, &rtb_y_l2);
    if (rtb_DataTypeConversion_kr) {
      if (rtb_y_ep != 0U) {
        rtb_Switch_i_idx_0 = 0.0F;
      } else if ((rtb_y_ig != 0U) && (rtb_y_l2 != 0U)) {
        rtb_Switch_i_idx_0 = 1.0F;
      } else if ((rtb_y_ig != 0U) && (rtb_y_l2 == 0U)) {
        rtb_Switch_i_idx_0 = 2.0F;
      } else if (rtb_y_ph != 0U) {
        rtb_Switch_i_idx_0 = 3.0F;
      } else if (rtb_y_m != 0U) {
        rtb_Switch_i_idx_0 = 4.0F;
      } else if (rtb_y_p != 0U) {
        rtb_Switch_i_idx_0 = 5.0F;
      } else {
        rtb_Switch_i_idx_0 = 0.0F;
      }

      rtb_Switch_i_idx_1 = A380FacComputer_U.in.bus_inputs.sfcc_own_bus.flap_actual_position_deg.Data;
      rtb_Switch_i_idx_2 = A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_actual_position_deg.Data;
      rtb_Switch_i_idx_3 = A380FacComputer_U.in.bus_inputs.sfcc_own_bus.slat_flap_actual_position_word.Data;
    } else if (rtb_AND1_d) {
      if (rtb_DataTypeConversion_gi) {
        rtb_Switch_i_idx_0 = 1.0F;
      } else if (rtb_DataTypeConversion_l5) {
        rtb_Switch_i_idx_0 = 2.0F;
      } else if (rtb_DataTypeConversion_o) {
        rtb_Switch_i_idx_0 = 3.0F;
      } else if (rtb_DataTypeConversion_f5) {
        rtb_Switch_i_idx_0 = 4.0F;
      } else if (rtb_DataTypeConversion_l3) {
        rtb_Switch_i_idx_0 = 5.0F;
      } else {
        rtb_Switch_i_idx_0 = 0.0F;
      }

      rtb_Switch_i_idx_1 = A380FacComputer_U.in.bus_inputs.fac_opp_bus.fac_flap_angle_deg.Data;
      rtb_Switch_i_idx_2 = A380FacComputer_U.in.bus_inputs.fac_opp_bus.fac_slat_angle_deg.Data;
      rtb_Switch_i_idx_3 = A380FacComputer_U.in.bus_inputs.fac_opp_bus.discrete_word_1.Data;
    } else if (rtb_Switch_io_idx_2) {
      rtb_Switch_i_idx_0 = A380FacComputer_P.Constant2_Value_k;
      rtb_Switch_i_idx_1 = A380FacComputer_P.Constant3_Value_d;
      rtb_Switch_i_idx_2 = A380FacComputer_P.Constant6_Value;
      rtb_Switch_i_idx_3 = A380FacComputer_P.Constant4_Value_j;
    } else {
      rtb_Switch_i_idx_0 = A380FacComputer_P.Constant1_Value_c;
      rtb_Switch_i_idx_1 = A380FacComputer_P.Constant1_Value_c;
      rtb_Switch_i_idx_2 = A380FacComputer_P.Constant1_Value_c;
      rtb_Switch_i_idx_3 = A380FacComputer_P.Constant1_Value_c;
    }

    rtb_Memory = ((A380FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)) ||
                  (A380FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>
                   (SignStatusMatrix::FailureWarning)));
    rtb_DataTypeConversion_gi = ((A380FacComputer_U.in.bus_inputs.adr_opp_bus.airspeed_computed_kn.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
      (A380FacComputer_U.in.bus_inputs.adr_opp_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)));
    rtb_DataTypeConversion_l5 = ((A380FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.SSM ==
      static_cast<uint32_T>(SignStatusMatrix::FailureWarning)) ||
      (A380FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.SSM == static_cast<uint32_T>(SignStatusMatrix::
      FailureWarning)));
    rtb_DataTypeConversion_o = ((A380FacComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.SSM != static_cast<
      uint32_T>(SignStatusMatrix::NormalOperation)) || (A380FacComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.SSM
      != static_cast<uint32_T>(SignStatusMatrix::NormalOperation)));
    rtb_DataTypeConversion_f5 = ((A380FacComputer_U.in.bus_inputs.ir_opp_bus.body_yaw_rate_deg_s.SSM !=
      static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
      (A380FacComputer_U.in.bus_inputs.ir_opp_bus.body_lat_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)));
    rtb_DataTypeConversion_l3 = ((A380FacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.SSM !=
      static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) ||
      (A380FacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.SSM != static_cast<uint32_T>(SignStatusMatrix::
      NormalOperation)));
    if (!rtb_Memory) {
      rtb_V_ias = A380FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380FacComputer_U.in.bus_inputs.adr_own_bus.airspeed_true_kn.Data;
      rtb_mach = A380FacComputer_U.in.bus_inputs.adr_own_bus.mach.Data;
      rtb_alpha = A380FacComputer_U.in.bus_inputs.adr_own_bus.aoa_corrected_deg.Data;
      rtb_p_s_c = A380FacComputer_U.in.bus_inputs.adr_own_bus.corrected_average_static_pressure.Data;
      rtb_alt = A380FacComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_ft.Data;
    } else if (!rtb_DataTypeConversion_l5) {
      rtb_V_ias = A380FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_computed_kn.Data;
      rtb_V_tas = A380FacComputer_U.in.bus_inputs.adr_3_bus.airspeed_true_kn.Data;
      rtb_mach = A380FacComputer_U.in.bus_inputs.adr_3_bus.mach.Data;
      rtb_alpha = A380FacComputer_U.in.bus_inputs.adr_3_bus.aoa_corrected_deg.Data;
      rtb_p_s_c = A380FacComputer_U.in.bus_inputs.adr_3_bus.corrected_average_static_pressure.Data;
      rtb_alt = A380FacComputer_U.in.bus_inputs.adr_own_bus.altitude_corrected_ft.Data;
    } else {
      rtb_V_ias = 0.0F;
      rtb_V_tas = 0.0F;
      rtb_mach = 0.0F;
      rtb_alpha = 0.0F;
      rtb_p_s_c = 0.0F;
      rtb_alt = 0.0F;
    }

    if (!rtb_DataTypeConversion_o) {
      rtb_theta = A380FacComputer_U.in.bus_inputs.ir_own_bus.pitch_angle_deg.Data;
      rtb_phi = A380FacComputer_U.in.bus_inputs.ir_own_bus.roll_angle_deg.Data;
      rtb_q = A380FacComputer_U.in.bus_inputs.ir_own_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380FacComputer_U.in.bus_inputs.ir_own_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380FacComputer_U.in.bus_inputs.ir_own_bus.body_long_accel_g.Data;
      rtb_n_y = A380FacComputer_U.in.bus_inputs.ir_own_bus.body_lat_accel_g.Data;
      rtb_n_z = A380FacComputer_U.in.bus_inputs.ir_own_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380FacComputer_U.in.bus_inputs.ir_own_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380FacComputer_U.in.bus_inputs.ir_own_bus.roll_att_rate_deg_s.Data;
    } else if (!rtb_DataTypeConversion_l3) {
      rtb_theta = A380FacComputer_U.in.bus_inputs.ir_3_bus.pitch_angle_deg.Data;
      rtb_phi = A380FacComputer_U.in.bus_inputs.ir_3_bus.roll_angle_deg.Data;
      rtb_q = A380FacComputer_U.in.bus_inputs.ir_3_bus.body_pitch_rate_deg_s.Data;
      rtb_r = A380FacComputer_U.in.bus_inputs.ir_3_bus.body_yaw_rate_deg_s.Data;
      rtb_n_x = A380FacComputer_U.in.bus_inputs.ir_3_bus.body_long_accel_g.Data;
      rtb_n_y = A380FacComputer_U.in.bus_inputs.ir_3_bus.body_lat_accel_g.Data;
      rtb_n_z = A380FacComputer_U.in.bus_inputs.ir_3_bus.body_normal_accel_g.Data;
      rtb_theta_dot = A380FacComputer_U.in.bus_inputs.ir_3_bus.pitch_att_rate_deg_s.Data;
      rtb_phi_dot = A380FacComputer_U.in.bus_inputs.ir_3_bus.roll_att_rate_deg_s.Data;
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

    rtb_BusAssignment_kv_flight_envelope_v_alpha_prot_kn = rtb_phi;
    rtb_BusAssignment_f_flight_envelope_v_alpha_max_kn = rtb_q;
    rtb_vs1g_h = rtb_r;
    rtb_vs1g = rtb_n_x;
    rtb_Switch1 = rtb_theta_dot;
    rtb_BusAssignment_m_logic_sfcc_own_valid = rtb_DataTypeConversion_kr;
    rtb_AND1_d = ((!rtb_DataTypeConversion_kr) && (!rtb_AND1_d));
    rtb_DataTypeConversion_kr = (rtb_y_b4 || rtb_Switch_io_idx_1);
    yawDamperCanEngage = (A380FacComputer_U.in.discrete_inputs.yaw_damper_has_hyd_press &&
                          A380FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    rtb_y_ool = !A380FacComputer_U.in.discrete_inputs.is_unit_1;
    yawDamperHasPriority = (A380FacComputer_U.in.discrete_inputs.is_unit_1 || (rtb_y_ool &&
      (!A380FacComputer_U.in.discrete_inputs.yaw_damper_opp_engaged)));
    rtb_yawDamperEngaged = (yawDamperCanEngage && yawDamperHasPriority);
    rudderTrimCanEngage = (A380FacComputer_U.in.discrete_inputs.rudder_trim_actuator_healthy &&
      A380FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    rudderTrimHasPriority = (A380FacComputer_U.in.discrete_inputs.is_unit_1 || (rtb_y_ool &&
      (!A380FacComputer_U.in.discrete_inputs.rudder_trim_opp_engaged)));
    rtb_rudderTrimEngaged = (rudderTrimCanEngage && rudderTrimHasPriority);
    rudderTravelLimCanEngage = (A380FacComputer_U.in.discrete_inputs.rudder_travel_lim_actuator_healthy &&
      A380FacComputer_U.in.discrete_inputs.fac_engaged_from_switch);
    rudderTravelLimHasPriority = (A380FacComputer_U.in.discrete_inputs.is_unit_1 || (rtb_y_ool &&
      (!A380FacComputer_U.in.discrete_inputs.rudder_travel_lim_opp_engaged)));
    rtb_rudderTravelLimEngaged = (rudderTravelLimCanEngage && rudderTravelLimHasPriority);
    rtb_OR1 = !rtb_DataTypeConversion_kr;
    A380FacComputer_MATLABFunction_p(rtb_OR1, A380FacComputer_U.in.time.dt, A380FacComputer_P.ConfirmNode_isRisingEdge_o,
      A380FacComputer_P.ConfirmNode_timeDelay_l, &rtb_y_ool, &A380FacComputer_DWork.sf_MATLABFunction_p);
    rtb_BusAssignment_h_logic_on_ground = rtb_DataTypeConversion_kr;
    Vcas = rtb_V_ias * 0.5144;
    if (rtb_V_ias >= 30.0F) {
      rtb_beta = rtb_n_y * 9.81 / (Vcas * Vcas * 0.6125 * 122.0 / (70000.0 * Vcas) * -0.62 * Vcas) * 180.0 /
        3.1415926535897931;
    } else {
      rtb_beta = 0.0;
    }

    A380FacComputer_LagFilter(rtb_beta, A380FacComputer_P.LagFilter1_C1, A380FacComputer_U.in.time.dt, &Vcas,
      &A380FacComputer_DWork.sf_LagFilter_d);
    A380FacComputer_LagFilter_k(A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data -
      A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data, A380FacComputer_P.LagFilter1_C1_d,
      A380FacComputer_U.in.time.dt, &rtb_y_oi, &A380FacComputer_DWork.sf_LagFilter_k);
    if (rtb_alpha > A380FacComputer_P.Saturation_UpperSat_a) {
      rtb_Y_br = A380FacComputer_P.Saturation_UpperSat_a;
    } else if (rtb_alpha < A380FacComputer_P.Saturation_LowerSat_l) {
      rtb_Y_br = A380FacComputer_P.Saturation_LowerSat_l;
    } else {
      rtb_Y_br = rtb_alpha;
    }

    A380FacComputer_LagFilter(rtb_Y_br, A380FacComputer_P.LagFilter2_C1, A380FacComputer_U.in.time.dt, &rtb_Switch1,
      &A380FacComputer_DWork.sf_LagFilter_f);
    A380FacComputer_LagFilter_k(A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data -
      A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data, A380FacComputer_P.LagFilter3_C1,
      A380FacComputer_U.in.time.dt, &rtb_y_a, &A380FacComputer_DWork.sf_LagFilter_d5);
    if (rtb_V_ias > A380FacComputer_P.Saturation1_UpperSat_o) {
      rtb_Switch6 = A380FacComputer_P.Saturation1_UpperSat_o;
    } else if (rtb_V_ias < A380FacComputer_P.Saturation1_LowerSat_n) {
      rtb_Switch6 = A380FacComputer_P.Saturation1_LowerSat_n;
    } else {
      rtb_Switch6 = rtb_V_ias;
    }

    rtb_beta = (rtb_Switch1 * rtb_y_a * A380FacComputer_P.Gain5_Gain + A380FacComputer_P.Gain4_Gain_o * rtb_y_oi) /
      rtb_Switch6 / rtb_Switch6 * A380FacComputer_P.Gain_Gain_k;
    A380FacComputer_LagFilter(static_cast<real_T>(rtb_alpha), A380FacComputer_P.LagFilter_C1,
      A380FacComputer_U.in.time.dt, &rtb_Switch6, &A380FacComputer_DWork.sf_LagFilter_c);
    rtb_BusAssignment_d_logic_speed_scale_visible = rtb_y_ool;
    rtb_BusAssignment_d_flight_envelope_beta_target_visible = ((std::abs
      (A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data -
       A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data) >=
      A380FacComputer_P.CompareToConstant_const_f) &&
      ((A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_left_percent.Data > A380FacComputer_P.CompareToConstant1_const_l)
       || (A380FacComputer_U.in.bus_inputs.fmgc_own_bus.n1_right_percent.Data >
           A380FacComputer_P.CompareToConstant2_const_i)));
    rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg = rtb_Switch6;
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_2,
      A380FacComputer_P.BitfromLabel6_bit_m, &rtb_y_ep);
    rtb_DataTypeConversion_kr = (rtb_y_ep != 0U);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_2,
      A380FacComputer_P.BitfromLabel7_bit_i, &rtb_y_ep);
    rtb_Switch1 = look2_binlxpw(static_cast<real_T>(rtb_mach), static_cast<real_T>(rtb_Switch_i_idx_0),
      A380FacComputer_P.alphamax_bp01Data, A380FacComputer_P.alphamax_bp02Data, A380FacComputer_P.alphamax_tableData,
      A380FacComputer_P.alphamax_maxIndex, 4U);
    A380FacComputer_RateLimiter(A380FacComputer_P.Gain3_Gain * (rtb_Switch1 + look2_binlxpw(static_cast<real_T>(rtb_mach),
      static_cast<real_T>(rtb_Switch_i_idx_0), A380FacComputer_P.alphaprotection_bp01Data,
      A380FacComputer_P.alphaprotection_bp02Data, A380FacComputer_P.alphaprotection_tableData,
      A380FacComputer_P.alphaprotection_maxIndex, 4U)), A380FacComputer_P.RateLimiterGenericVariableTs1_up,
      A380FacComputer_P.RateLimiterGenericVariableTs1_lo, A380FacComputer_U.in.time.dt, A380FacComputer_P.reset_Value,
      &rtb_Switch1, &A380FacComputer_DWork.sf_RateLimiter);
    rtb_Gain = A380FacComputer_P.DiscreteDerivativeVariableTs_Gain * rtb_V_ias;
    rtb_Switch6 = rtb_Gain - A380FacComputer_DWork.Delay_DSTATE;
    A380FacComputer_LagFilter(rtb_Switch6 / A380FacComputer_U.in.time.dt, A380FacComputer_P.LagFilter_C1_k,
      A380FacComputer_U.in.time.dt, &rtb_Switch6, &A380FacComputer_DWork.sf_LagFilter);
    A380FacComputer_MATLABFunction(&A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft, &rtb_y_ool);
    if (rtb_y_ool) {
      rtb_Switch = A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft.Data;
    } else {
      rtb_Switch = A380FacComputer_P.Constant_Value;
    }

    if (A380FacComputer_DWork.is_active_c15_A380FacComputer == 0) {
      A380FacComputer_DWork.is_active_c15_A380FacComputer = 1U;
      A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Landed;
      rtb_alpha_floor_inhib = 1;
    } else {
      switch (A380FacComputer_DWork.is_c15_A380FacComputer) {
       case A380FacComputer_IN_Flying:
        if (rtb_Switch < 100.0) {
          A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Landing100ft;
          rtb_alpha_floor_inhib = 1;
        } else if (rtb_BusAssignment_h_logic_on_ground) {
          A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;

       case A380FacComputer_IN_Landed:
        if (rtb_OR1) {
          A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Takeoff100ft;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       case A380FacComputer_IN_Landing100ft:
        if (rtb_Switch > 100.0) {
          A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else if (rtb_BusAssignment_h_logic_on_ground) {
          A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else {
          rtb_alpha_floor_inhib = 1;
        }
        break;

       default:
        if (rtb_BusAssignment_h_logic_on_ground) {
          A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Landed;
          rtb_alpha_floor_inhib = 1;
        } else if (rtb_Switch > 100.0) {
          A380FacComputer_DWork.is_c15_A380FacComputer = A380FacComputer_IN_Flying;
          rtb_alpha_floor_inhib = 0;
        } else {
          rtb_alpha_floor_inhib = 0;
        }
        break;
      }
    }

    guard1 = false;
    if ((rtb_alpha_floor_inhib == 0) && (rtb_mach < 0.6)) {
      if (rtb_Switch_i_idx_0 >= 4.0F) {
        rtb_v_ls_kn_SSM = -3;
      } else {
        rtb_v_ls_kn_SSM = 0;
      }

      if ((rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg > rtb_Switch1 + std::fmin(std::fmax(rtb_Switch6,
             static_cast<real_T>(rtb_v_ls_kn_SSM)), 0.0)) && A380FacComputer_P.Constant1_Value_mf) {
        A380FacComputer_DWork.sAlphaFloor = 1.0;
      } else {
        guard1 = true;
      }
    } else {
      guard1 = true;
    }

    if (guard1) {
      if ((rtb_alpha_floor_inhib != 0) || ((!rtb_DataTypeConversion_kr) && (rtb_y_ep == 0U)) ||
          (!A380FacComputer_P.Constant1_Value_mf)) {
        A380FacComputer_DWork.sAlphaFloor = 0.0;
      }
    }

    rtb_Switch6 = rtb_Switch_i_idx_0;
    A380FacComputer_RateLimiter(look1_binlxpw(static_cast<real_T>(rtb_Switch_i_idx_0), A380FacComputer_P.alpha0_bp01Data,
      A380FacComputer_P.alpha0_tableData, 5U), A380FacComputer_P.RateLimiterGenericVariableTs1_up_g,
      A380FacComputer_P.RateLimiterGenericVariableTs1_lo_n, A380FacComputer_U.in.time.dt,
      A380FacComputer_P.reset_Value_k, &rtb_vs1g_h, &A380FacComputer_DWork.sf_RateLimiter_c);
    A380FacComputer_RateLimiter(look2_binlxpw(static_cast<real_T>(rtb_mach), static_cast<real_T>(rtb_Switch_i_idx_0),
      A380FacComputer_P.alphamax_bp01Data_m, A380FacComputer_P.alphamax_bp02Data_a,
      A380FacComputer_P.alphamax_tableData_b, A380FacComputer_P.alphamax_maxIndex_g, 4U),
      A380FacComputer_P.RateLimiterGenericVariableTs4_up, A380FacComputer_P.RateLimiterGenericVariableTs4_lo,
      A380FacComputer_U.in.time.dt, A380FacComputer_P.reset_Value_o, &rtb_Switch1,
      &A380FacComputer_DWork.sf_RateLimiter_a);
    A380FacComputer_CalculateV_alpha_max(static_cast<real_T>(rtb_V_ias),
      rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg, rtb_vs1g_h, rtb_Switch1,
      &rtb_BusAssignment_f_flight_envelope_v_alpha_max_kn);
    A380FacComputer_RateLimiter(look2_binlxpw(static_cast<real_T>(rtb_mach), static_cast<real_T>(rtb_Switch_i_idx_0),
      A380FacComputer_P.alphaprotection_bp01Data_b, A380FacComputer_P.alphaprotection_bp02Data_m,
      A380FacComputer_P.alphaprotection_tableData_p, A380FacComputer_P.alphaprotection_maxIndex_m, 4U),
      A380FacComputer_P.RateLimiterGenericVariableTs3_up, A380FacComputer_P.RateLimiterGenericVariableTs3_lo,
      A380FacComputer_U.in.time.dt, A380FacComputer_P.reset_Value_a, &rtb_Switch1,
      &A380FacComputer_DWork.sf_RateLimiter_n);
    A380FacComputer_CalculateV_alpha_max(static_cast<real_T>(rtb_V_ias),
      rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg, rtb_vs1g_h, rtb_Switch1,
      &rtb_BusAssignment_kv_flight_envelope_v_alpha_prot_kn);
    A380FacComputer_RateLimiter(look2_binlxpw(static_cast<real_T>(rtb_mach), static_cast<real_T>(rtb_Switch_i_idx_0),
      A380FacComputer_P.alphastallwarnmax_bp01Data, A380FacComputer_P.alphastallwarnmax_bp02Data,
      A380FacComputer_P.alphastallwarnmax_tableData, A380FacComputer_P.alphastallwarnmax_maxIndex, 4U),
      A380FacComputer_P.RateLimiterGenericVariableTs2_up, A380FacComputer_P.RateLimiterGenericVariableTs2_lo,
      A380FacComputer_U.in.time.dt, A380FacComputer_P.reset_Value_i, &rtb_Switch6,
      &A380FacComputer_DWork.sf_RateLimiter_j);
    A380FacComputer_CalculateV_alpha_max(static_cast<real_T>(rtb_V_ias),
      rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg, rtb_vs1g_h, rtb_Switch6, &rtb_Switch);
    if (A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_weight_lbs.SSM == static_cast<uint32_T>(SignStatusMatrix::
         NormalOperation)) {
      rtb_DataTypeConversion2 = A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_weight_lbs.Data;
    } else {
      rtb_DataTypeConversion2 = A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fac_weight_lbs.Data;
    }

    rtb_Switch6 = A380FacComputer_P.Gain2_Gain_d * rtb_DataTypeConversion2;
    bpIndices[0U] = plook_binx(rtb_Switch6, A380FacComputer_P.nDLookupTable_bp01Data, 7U, &rtb_vs1g);
    fractions[0U] = rtb_vs1g;
    bpIndices[1U] = plook_binx(A380FacComputer_P.Gain3_Gain_h *
      A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_cg_percent.Data, A380FacComputer_P.nDLookupTable_bp02Data, 1U,
      &rtb_vs1g);
    fractions[1U] = rtb_vs1g;
    bpIndices[2U] = plook_binx(static_cast<real_T>(rtb_Switch_i_idx_0), A380FacComputer_P.nDLookupTable_bp03Data, 5U,
      &rtb_vs1g);
    fractions[2U] = rtb_vs1g;
    A380FacComputer_VS1GfromVLS(look2_binlxpw(rtb_Switch6, static_cast<real_T>(rtb_alt),
      A380FacComputer_P.uDLookupTable1_bp01Data, A380FacComputer_P.uDLookupTable1_bp02Data,
      A380FacComputer_P.uDLookupTable1_tableData, A380FacComputer_P.uDLookupTable1_maxIndex, 8U), intrp3d_l_pw(bpIndices,
      fractions, A380FacComputer_P.nDLookupTable_tableData, A380FacComputer_P.nDLookupTable_dimSizes),
      static_cast<real_T>(rtb_Switch_i_idx_0), &rtb_Switch6);
    A380FacComputer_RateLimiter_f(rtb_Switch6, A380FacComputer_P.RateLimiterGenericVariableTs1_up_d,
      A380FacComputer_P.RateLimiterGenericVariableTs1_lo_f, A380FacComputer_U.in.time.dt,
      A380FacComputer_P.RateLimiterGenericVariableTs1_InitialCondition, A380FacComputer_P.reset_Value_k5, &rtb_Y_l,
      &A380FacComputer_DWork.sf_RateLimiter_g0);
    rtb_Switch6 = std::fmax(A380FacComputer_U.in.analog_inputs.left_spoiler_pos_deg,
      A380FacComputer_U.in.analog_inputs.right_spoiler_pos_deg);
    rtb_Switch1 = rtb_Switch6 / look1_binlxpw(static_cast<real_T>(rtb_Switch_i_idx_0),
      A380FacComputer_P.spoilermaxdeflection_bp01Data, A380FacComputer_P.spoilermaxdeflection_tableData, 5U) *
      look1_binlxpw(static_cast<real_T>(rtb_Switch_i_idx_0), A380FacComputer_P.VLSincreasemaxdeflection_bp01Data,
                    A380FacComputer_P.VLSincreasemaxdeflection_tableData, 5U);
    rtb_OR1 = ((!rtb_AND1) && rtb_y_b4 && rtb_Switch_io_idx_1);
    if (rtb_OR1) {
      A380FacComputer_DWork.takeoff_config = rtb_Switch_i_idx_0;
    } else if (A380FacComputer_DWork.takeoff_config != rtb_Switch_i_idx_0) {
      A380FacComputer_DWork.takeoff_config = -1.0;
    }

    if (rtb_Switch_i_idx_0 == 0.0F) {
      rtb_Y_br = 1.23;
    } else if (rtb_Switch_i_idx_0 == 1.0F) {
      rtb_Y_br = 1.18;
    } else if (A380FacComputer_DWork.takeoff_config != -1.0) {
      rtb_Y_br = 1.15;
    } else {
      rtb_Y_br = 1.23;
    }

    A380FacComputer_RateLimiter_f(rtb_Y_br, A380FacComputer_P.RateLimiterGenericVariableTs_up,
      A380FacComputer_P.RateLimiterGenericVariableTs_lo, A380FacComputer_U.in.time.dt,
      A380FacComputer_P.RateLimiterGenericVariableTs_InitialCondition, A380FacComputer_P.reset_Value_m, &rtb_Switch6,
      &A380FacComputer_DWork.sf_RateLimiter_g);
    rtb_BusAssignment_c_flight_envelope_v_ls_kn = std::fmax(A380FacComputer_P.Vmcl_Value, rtb_Switch6 * rtb_Y_l) +
      rtb_Switch1;
    rtb_Switch1 = A380FacComputer_P.Gain2_Gain_j * rtb_DataTypeConversion2;
    bpIndices_0[0U] = plook_binx(rtb_Switch1, A380FacComputer_P.nDLookupTable_bp01Data_p, 7U, &rtb_vs1g);
    fractions_0[0U] = rtb_vs1g;
    bpIndices_0[1U] = plook_binx(A380FacComputer_P.Gain3_Gain_d *
      A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_cg_percent.Data, A380FacComputer_P.nDLookupTable_bp02Data_b, 1U,
      &rtb_vs1g);
    fractions_0[1U] = rtb_vs1g;
    bpIndices_0[2U] = plook_binx(A380FacComputer_P._Value, A380FacComputer_P.nDLookupTable_bp03Data_h, 5U, &rtb_vs1g);
    fractions_0[2U] = rtb_vs1g;
    A380FacComputer_VS1GfromVLS(look2_binlxpw(rtb_Switch1, static_cast<real_T>(rtb_alt),
      A380FacComputer_P.uDLookupTable1_bp01Data_p, A380FacComputer_P.uDLookupTable1_bp02Data_n,
      A380FacComputer_P.uDLookupTable1_tableData_j, A380FacComputer_P.uDLookupTable1_maxIndex_k, 8U), intrp3d_l_pw
      (bpIndices_0, fractions_0, A380FacComputer_P.nDLookupTable_tableData_e, A380FacComputer_P.nDLookupTable_dimSizes_l),
      A380FacComputer_P._Value, &rtb_vs1g_h);
    if (rtb_OR1) {
      A380FacComputer_DWork.takeoff_config_c = rtb_Switch_i_idx_0;
      A380FacComputer_DWork.takeoff_config_g = rtb_Switch_i_idx_0;
    } else {
      if (A380FacComputer_DWork.takeoff_config_c != rtb_Switch_i_idx_0) {
        A380FacComputer_DWork.takeoff_config_c = -1.0;
      }

      if (A380FacComputer_DWork.takeoff_config_g != rtb_Switch_i_idx_0) {
        A380FacComputer_DWork.takeoff_config_g = -1.0;
      }
    }

    rtb_Switch1 = A380FacComputer_P.Gain2_Gain_o * rtb_DataTypeConversion2;
    if (A380FacComputer_DWork.takeoff_config_g != -1.0) {
      rtb_conf = 2.0;
    } else {
      rtb_conf = rtb_Switch_i_idx_0;
    }

    bpIndices_1[0U] = plook_binx(rtb_Switch1, A380FacComputer_P.nDLookupTable_bp01Data_a, 7U, &rtb_vs1g);
    fractions_1[0U] = rtb_vs1g;
    bpIndices_1[1U] = plook_binx(A380FacComputer_P.Gain3_Gain_n *
      A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_cg_percent.Data, A380FacComputer_P.nDLookupTable_bp02Data_f, 1U,
      &rtb_vs1g);
    fractions_1[1U] = rtb_vs1g;
    bpIndices_1[2U] = plook_binx(rtb_conf, A380FacComputer_P.nDLookupTable_bp03Data_m, 5U, &rtb_vs1g);
    fractions_1[2U] = rtb_vs1g;
    A380FacComputer_VS1GfromVLS(look2_binlxpw(rtb_Switch1, static_cast<real_T>(rtb_alt),
      A380FacComputer_P.uDLookupTable1_bp01Data_a, A380FacComputer_P.uDLookupTable1_bp02Data_l,
      A380FacComputer_P.uDLookupTable1_tableData_o, A380FacComputer_P.uDLookupTable1_maxIndex_b, 8U), intrp3d_l_pw
      (bpIndices_1, fractions_1, A380FacComputer_P.nDLookupTable_tableData_p, A380FacComputer_P.nDLookupTable_dimSizes_p),
      rtb_conf, &rtb_vs1g);
    if (static_cast<real_T>(A380FacComputer_DWork.takeoff_config_c != -1.0) > A380FacComputer_P.Switch_Threshold) {
      rtb_Switch1 = std::fmax(A380FacComputer_P.Vmcl5_Value, A380FacComputer_P.Gain4_Gain * rtb_vs1g_h);
    } else {
      rtb_Switch1 = std::fmin(A380FacComputer_P.Vfe_35_Value, std::fmax(rtb_vs1g * look1_binlxpw(static_cast<real_T>
        (rtb_Switch_i_idx_0), A380FacComputer_P.uDLookupTable_bp01Data, A380FacComputer_P.uDLookupTable_tableData, 1U),
        A380FacComputer_P.Vmcl10_Value));
    }

    rtb_vs1g_h = A380FacComputer_P.Gain2_Gain_c * rtb_DataTypeConversion2;
    bpIndices_2[0U] = plook_binx(rtb_vs1g_h, A380FacComputer_P.nDLookupTable_bp01Data_o, 7U, &rtb_vs1g);
    fractions_2[0U] = rtb_vs1g;
    bpIndices_2[1U] = plook_binx(A380FacComputer_P.Gain3_Gain_a *
      A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_cg_percent.Data, A380FacComputer_P.nDLookupTable_bp02Data_m, 1U,
      &rtb_vs1g);
    fractions_2[1U] = rtb_vs1g;
    bpIndices_2[2U] = plook_binx(A380FacComputer_P.Constant2_Value_c, A380FacComputer_P.nDLookupTable_bp03Data_md, 5U,
      &rtb_vs1g);
    fractions_2[2U] = rtb_vs1g;
    A380FacComputer_VS1GfromVLS(look2_binlxpw(rtb_vs1g_h, static_cast<real_T>(rtb_alt),
      A380FacComputer_P.uDLookupTable1_bp01Data_l, A380FacComputer_P.uDLookupTable1_bp02Data_p,
      A380FacComputer_P.uDLookupTable1_tableData_i, A380FacComputer_P.uDLookupTable1_maxIndex_g, 8U), intrp3d_l_pw
      (bpIndices_2, fractions_2, A380FacComputer_P.nDLookupTable_tableData_k, A380FacComputer_P.nDLookupTable_dimSizes_i),
      A380FacComputer_P.Constant2_Value_c, &rtb_vs1g_h);
    rtb_vs1g_h = std::fmin(std::fmax(A380FacComputer_P.Gain2_Gain_e * rtb_vs1g_h, A380FacComputer_P.Vmcl20_Value),
      A380FacComputer_P.Vfe_25_Value);
    rtb_conf = look2_binlxpw(A380FacComputer_P.Gain3_Gain_b * rtb_DataTypeConversion2, static_cast<real_T>(rtb_alt),
      A380FacComputer_P.uDLookupTable_bp01Data_n, A380FacComputer_P.uDLookupTable_bp02Data,
      A380FacComputer_P.uDLookupTable_tableData_m, A380FacComputer_P.uDLookupTable_maxIndex, 8U);
    rtb_DataTypeConversion_kr = (rtb_Switch_i_idx_0 == A380FacComputer_P.CompareToConstant_const);
    rtb_OR1 = ((rtb_Switch_i_idx_0 < A380FacComputer_P.CompareToConstant_const_i) && (rtb_alt <=
                A380FacComputer_P.CompareToConstant1_const_i));
    if (rtb_Switch_io_idx_2) {
      rtb_Y_br = A380FacComputer_P.Constant2_Value;
    } else {
      rtb_Y_br = A380FacComputer_P.Constant3_Value;
    }

    rtb_Switch4_f = std::fmin(std::fmin(rtb_Y_br, std::sqrt(std::pow((std::pow(A380FacComputer_P.Constant1_Value_p *
      A380FacComputer_P.Constant1_Value_p * 0.2 + 1.0, 3.5) - 1.0) * (rtb_p_s_c / 1013.25) + 1.0, 0.2857142857142857) -
      1.0) * 1479.1), look1_binlxpw(static_cast<real_T>(rtb_Switch_i_idx_0), A380FacComputer_P.uDLookupTable_bp01Data_a,
      A380FacComputer_P.uDLookupTable_tableData_a, 5U));
    if (rtb_V_ias > A380FacComputer_P.Saturation_UpperSat_j) {
      rtb_Y_br = A380FacComputer_P.Saturation_UpperSat_j;
    } else if (rtb_V_ias < A380FacComputer_P.Saturation_LowerSat_c) {
      rtb_Y_br = A380FacComputer_P.Saturation_LowerSat_c;
    } else {
      rtb_Y_br = rtb_V_ias;
    }

    rtb_vs1g = A380FacComputer_P.DiscreteDerivativeVariableTs_Gain_l * rtb_Y_br;
    rtb_Switch6 = rtb_vs1g - A380FacComputer_DWork.Delay_DSTATE_d;
    A380FacComputer_LagFilter(rtb_Switch6 / A380FacComputer_U.in.time.dt, A380FacComputer_P.LagFilter_C1_f,
      A380FacComputer_U.in.time.dt, &rtb_Y_br, &A380FacComputer_DWork.sf_LagFilter_i);
    A380FacComputer_RateLimiter_f(rtb_Y_br, A380FacComputer_P.RateLimiterGenericVariableTs_up_g,
      A380FacComputer_P.RateLimiterGenericVariableTs_lo_e, A380FacComputer_U.in.time.dt,
      A380FacComputer_P.RateLimiterGenericVariableTs_InitialCondition_o, A380FacComputer_P.reset_Value_i3, &rtb_Switch6,
      &A380FacComputer_DWork.sf_RateLimiter_f);
    rtb_Switch_b = A380FacComputer_P.Gain_Gain_j * rtb_Switch6;
    rtb_BusAssignment_f_flight_envelope_v_stall_kn = rtb_Y_l;
    rtb_BusAssignment_f_flight_envelope_v_3_visible = ((rtb_Switch_i_idx_0 == A380FacComputer_P.CompareToConstant4_const)
      || (rtb_Switch_i_idx_0 == A380FacComputer_P.CompareToConstant2_const));
    rtb_BusAssignment_f_flight_envelope_v_fe_next_kn = look1_binlxpw(static_cast<real_T>(rtb_Switch_i_idx_0),
      A380FacComputer_P.uDLookupTable1_bp01Data_pi, A380FacComputer_P.uDLookupTable1_tableData_ow, 5U);
    rtb_y_ool = (A380FacComputer_U.in.discrete_inputs.ap_own_engaged ||
                 A380FacComputer_U.in.discrete_inputs.ap_opp_engaged);
    rtb_AND = (A380FacComputer_U.in.discrete_inputs.rudder_trim_reset_button && (!rtb_y_ool));
    if (!A380FacComputer_DWork.previousInput_not_empty) {
      A380FacComputer_DWork.previousInput = A380FacComputer_P.PulseNode_isRisingEdge;
      A380FacComputer_DWork.previousInput_not_empty = true;
    }

    if (A380FacComputer_P.PulseNode_isRisingEdge) {
      rtb_y_h = (rtb_AND && (!A380FacComputer_DWork.previousInput));
    } else {
      rtb_y_h = ((!rtb_AND) && A380FacComputer_DWork.previousInput);
    }

    A380FacComputer_DWork.previousInput = rtb_AND;
    A380FacComputer_DWork.Memory_PreviousInput = A380FacComputer_P.Logic_table
      [(((A380FacComputer_U.in.discrete_inputs.rudder_trim_switch_left ||
          A380FacComputer_U.in.discrete_inputs.rudder_trim_switch_right || rtb_y_ool) + (static_cast<uint32_T>(rtb_y_h) <<
          1)) << 1) + A380FacComputer_DWork.Memory_PreviousInput];
    rtb_AND = !rtb_rudderTrimEngaged;
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      A380FacComputer_P.BitfromLabel_bit_j, &rtb_y_ph);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      A380FacComputer_P.BitfromLabel1_bit_e, &rtb_y_ig);
    if (rtb_y_ool) {
      if (A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fg_radio_height_ft.Data >= A380FacComputer_P.Switch6_Threshold_n)
      {
        if ((rtb_y_ph != 0U) && A380FacComputer_U.in.discrete_inputs.elac_1_healthy) {
          rtb_Y_br = A380FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
        } else if ((rtb_y_ig != 0U) && A380FacComputer_U.in.discrete_inputs.elac_2_healthy) {
          rtb_Y_br = A380FacComputer_U.in.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data;
        } else {
          rtb_Y_br = A380FacComputer_P.Constant1_Value_m;
        }

        rtb_Switch6 = A380FacComputer_P.Gain2_Gain * rtb_Y_br;
      } else {
        rtb_Switch6 = A380FacComputer_P.Constant2_Value_m;
      }

      if (rtb_Switch6 > A380FacComputer_P.Saturation_UpperSat) {
        rtb_Switch6 = A380FacComputer_P.Saturation_UpperSat;
      } else if (rtb_Switch6 < A380FacComputer_P.Saturation_LowerSat) {
        rtb_Switch6 = A380FacComputer_P.Saturation_LowerSat;
      }
    } else if (A380FacComputer_U.in.discrete_inputs.rudder_trim_switch_left) {
      rtb_Switch6 = 1.0;
    } else if (A380FacComputer_U.in.discrete_inputs.rudder_trim_switch_right) {
      rtb_Switch6 = -1.0;
    } else {
      rtb_Switch6 = 0.0;
    }

    rtb_Switch6 = A380FacComputer_P.DiscreteTimeIntegratorVariableTs_Gain * rtb_Switch6 * A380FacComputer_U.in.time.dt;
    A380FacComputer_DWork.icLoad = (A380FacComputer_DWork.Memory_PreviousInput || rtb_AND ||
      A380FacComputer_DWork.icLoad);
    if (A380FacComputer_DWork.icLoad) {
      if (rtb_AND) {
        rtb_Y_br = A380FacComputer_U.in.analog_inputs.rudder_trim_position_deg;
      } else {
        rtb_Y_br = A380FacComputer_P.Constant_Value_g;
      }

      A380FacComputer_DWork.Delay_DSTATE_dc = rtb_Y_br - rtb_Switch6;
    }

    A380FacComputer_DWork.Delay_DSTATE_dc += rtb_Switch6;
    if (A380FacComputer_DWork.Delay_DSTATE_dc > A380FacComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit) {
      A380FacComputer_DWork.Delay_DSTATE_dc = A380FacComputer_P.DiscreteTimeIntegratorVariableTs_UpperLimit;
    } else if (A380FacComputer_DWork.Delay_DSTATE_dc < A380FacComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit) {
      A380FacComputer_DWork.Delay_DSTATE_dc = A380FacComputer_P.DiscreteTimeIntegratorVariableTs_LowerLimit;
    }

    A380FacComputer_RateLimiter_p(A380FacComputer_DWork.Delay_DSTATE_dc,
      A380FacComputer_P.RateLimiterGenericVariableTs_up_l, A380FacComputer_P.RateLimiterGenericVariableTs_lo_d,
      A380FacComputer_U.in.time.dt, A380FacComputer_U.in.analog_inputs.rudder_trim_position_deg, rtb_AND, &rtb_Y_l,
      &A380FacComputer_DWork.sf_RateLimiter_l);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      A380FacComputer_P.BitfromLabel_bit_c, &rtb_y_ep);
    rtb_y_ool = (rtb_y_ep != 0U);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_1_bus.discrete_status_word_1,
      A380FacComputer_P.BitfromLabel1_bit_n, &rtb_y_ep);
    rtb_AND = (rtb_y_ool && A380FacComputer_U.in.discrete_inputs.elac_1_healthy && (rtb_y_ep != 0U));
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      A380FacComputer_P.BitfromLabel3_bit_k, &rtb_y_ep);
    rtb_y_ool = (rtb_y_ep != 0U);
    A380FacComputer_MATLABFunction_g(&A380FacComputer_U.in.bus_inputs.elac_2_bus.discrete_status_word_1,
      A380FacComputer_P.BitfromLabel4_bit_k, &rtb_y_ep);
    if ((!A380FacComputer_DWork.pY_not_empty) || (!A380FacComputer_DWork.pU_not_empty)) {
      A380FacComputer_DWork.pU = rtb_r;
      A380FacComputer_DWork.pU_not_empty = true;
      A380FacComputer_DWork.pY = rtb_r;
      A380FacComputer_DWork.pY_not_empty = true;
    }

    rtb_Switch6 = A380FacComputer_U.in.time.dt * A380FacComputer_P.WashoutFilter_C1;
    rtb_Y_br = 2.0 / (rtb_Switch6 + 2.0);
    A380FacComputer_DWork.pY = (2.0 - rtb_Switch6) / (rtb_Switch6 + 2.0) * A380FacComputer_DWork.pY + (rtb_r * rtb_Y_br
      - A380FacComputer_DWork.pU * rtb_Y_br);
    A380FacComputer_DWork.pU = rtb_r;
    if (rtb_AND || (rtb_y_ool && A380FacComputer_U.in.discrete_inputs.elac_2_healthy && (rtb_y_ep != 0U))) {
      if (rtb_AND) {
        rtb_Switch6 = A380FacComputer_U.in.bus_inputs.elac_1_bus.yaw_damper_command_deg.Data;
      } else {
        rtb_Switch6 = A380FacComputer_U.in.bus_inputs.elac_2_bus.yaw_damper_command_deg.Data;
      }
    } else {
      rtb_Switch6 = A380FacComputer_P.Gain_Gain * A380FacComputer_DWork.pY;
      if (rtb_Switch6 > A380FacComputer_P.Saturation1_UpperSat) {
        rtb_Switch6 = A380FacComputer_P.Saturation1_UpperSat;
      } else if (rtb_Switch6 < A380FacComputer_P.Saturation1_LowerSat) {
        rtb_Switch6 = A380FacComputer_P.Saturation1_LowerSat;
      }
    }

    if (rtb_Switch6 > A380FacComputer_P.Saturation_UpperSat_e) {
      rtb_Switch6 = A380FacComputer_P.Saturation_UpperSat_e;
    } else if (rtb_Switch6 < A380FacComputer_P.Saturation_LowerSat_o) {
      rtb_Switch6 = A380FacComputer_P.Saturation_LowerSat_o;
    }

    A380FacComputer_RateLimiter_p(rtb_Switch6, A380FacComputer_P.RateLimiterGenericVariableTs_up_a,
      A380FacComputer_P.RateLimiterGenericVariableTs_lo_f, A380FacComputer_U.in.time.dt,
      A380FacComputer_U.in.analog_inputs.yaw_damper_position_deg, !rtb_yawDamperEngaged, &rtb_Y_br,
      &A380FacComputer_DWork.sf_RateLimiter_fu);
    rtb_Switch6 = look1_binlxpw(static_cast<real_T>(rtb_V_ias), A380FacComputer_P.uDLookupTable_bp01Data_i,
      A380FacComputer_P.uDLookupTable_tableData_j, 6U);
    if (rtb_Switch6 > A380FacComputer_P.Saturation_UpperSat_g) {
      rtb_Switch6 = A380FacComputer_P.Saturation_UpperSat_g;
    } else if (rtb_Switch6 < A380FacComputer_P.Saturation_LowerSat_f) {
      rtb_Switch6 = A380FacComputer_P.Saturation_LowerSat_f;
    }

    A380FacComputer_RateLimiter_p(rtb_Switch6, A380FacComputer_P.RateLimiterGenericVariableTs_up_c,
      A380FacComputer_P.RateLimiterGenericVariableTs_lo_p, A380FacComputer_U.in.time.dt,
      A380FacComputer_U.in.analog_inputs.rudder_travel_lim_position_deg, !rtb_rudderTravelLimEngaged, &rtb_Y_g4,
      &A380FacComputer_DWork.sf_RateLimiter_p);
    A380FacComputer_Y.out.bus_outputs.v_fe_next_kn.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant2_Value);
    rtb_VectorConcatenate[0] = rtb_yawDamperEngaged;
    rtb_VectorConcatenate[1] = A380FacComputer_U.in.discrete_inputs.yaw_damper_opp_engaged;
    rtb_VectorConcatenate[2] = rtb_rudderTrimEngaged;
    rtb_VectorConcatenate[3] = A380FacComputer_U.in.discrete_inputs.rudder_trim_opp_engaged;
    rtb_VectorConcatenate[4] = rtb_rudderTravelLimEngaged;
    rtb_VectorConcatenate[5] = A380FacComputer_U.in.discrete_inputs.rudder_travel_lim_opp_engaged;
    rtb_VectorConcatenate[6] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[7] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[8] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[9] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[10] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[11] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[12] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[13] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[14] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[15] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[16] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[17] = A380FacComputer_P.Constant10_Value;
    rtb_VectorConcatenate[18] = A380FacComputer_P.Constant10_Value;
    A380FacComputer_MATLABFunction_g3(rtb_VectorConcatenate, &rtb_y_a);
    if (A380FacComputer_P.Constant_Value_b5) {
      rtb_alpha_floor_inhib = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_v_ls_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_v_stall_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_v_alpha_prot_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_v_stall_warn_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_speed_trend_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_v_3_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_v_4_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      rtb_v_man_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
      A380FacComputer_Y.out.bus_outputs.v_max_kn.SSM = static_cast<uint32_T>(A380FacComputer_P.EnumeratedConstant2_Value);
    } else {
      if (rtb_BusAssignment_d_logic_speed_scale_visible) {
        rtb_alpha_floor_inhib = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
        rtb_v_ls_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      } else {
        rtb_alpha_floor_inhib = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant_Value);
        rtb_v_ls_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant_Value);
      }

      rtb_v_stall_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      if (rtb_BusAssignment_d_logic_speed_scale_visible) {
        rtb_v_alpha_prot_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
        rtb_v_stall_warn_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      } else {
        rtb_v_alpha_prot_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant_Value);
        rtb_v_stall_warn_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant_Value);
      }

      rtb_speed_trend_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      if (rtb_BusAssignment_d_logic_speed_scale_visible && rtb_BusAssignment_f_flight_envelope_v_3_visible) {
        rtb_v_3_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      } else {
        rtb_v_3_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant_Value);
      }

      if (rtb_BusAssignment_d_logic_speed_scale_visible && ((rtb_Switch_i_idx_0 ==
            A380FacComputer_P.CompareToConstant3_const) || (rtb_Switch_i_idx_0 ==
            A380FacComputer_P.CompareToConstant1_const))) {
        rtb_v_4_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      } else {
        rtb_v_4_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant_Value);
      }

      if (rtb_BusAssignment_d_logic_speed_scale_visible && rtb_DataTypeConversion_kr) {
        rtb_v_man_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      } else {
        rtb_v_man_kn_SSM = static_cast<int32_T>(A380FacComputer_P.EnumeratedConstant_Value);
      }

      A380FacComputer_Y.out.bus_outputs.v_max_kn.SSM = static_cast<uint32_T>(A380FacComputer_P.EnumeratedConstant1_Value);
      if (rtb_BusAssignment_d_logic_speed_scale_visible && rtb_OR1) {
        A380FacComputer_Y.out.bus_outputs.v_fe_next_kn.SSM = static_cast<uint32_T>
          (A380FacComputer_P.EnumeratedConstant1_Value);
      } else {
        A380FacComputer_Y.out.bus_outputs.v_fe_next_kn.SSM = static_cast<uint32_T>
          (A380FacComputer_P.EnumeratedConstant_Value);
      }
    }

    rtb_VectorConcatenate[0] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[1] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[2] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[3] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[4] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[5] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[6] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[7] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[8] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[9] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[10] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[11] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[12] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[13] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[14] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[15] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[16] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[17] = A380FacComputer_P.Constant18_Value;
    rtb_VectorConcatenate[18] = A380FacComputer_P.Constant18_Value;
    A380FacComputer_MATLABFunction_g3(rtb_VectorConcatenate, &rtb_y_oi);
    rtb_VectorConcatenate[0] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[1] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[2] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[3] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[4] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[5] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[6] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[7] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[8] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[9] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[10] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[11] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[12] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[13] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[14] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[15] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[16] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[17] = A380FacComputer_P.Constant9_Value;
    rtb_VectorConcatenate[18] = A380FacComputer_P.Constant9_Value;
    A380FacComputer_MATLABFunction_g3(rtb_VectorConcatenate, &A380FacComputer_Y.out.bus_outputs.discrete_word_4.Data);
    rtb_VectorConcatenate_i[0] = (rtb_Switch_i_idx_0 == 1.0F);
    rtb_VectorConcatenate_i[1] = (rtb_Switch_i_idx_0 == 2.0F);
    rtb_VectorConcatenate_i[2] = (rtb_Switch_i_idx_0 == 3.0F);
    rtb_VectorConcatenate_i[3] = (rtb_Switch_i_idx_0 == 4.0F);
    rtb_VectorConcatenate_i[4] = (rtb_Switch_i_idx_0 == 5.0F);
    rtb_VectorConcatenate_i[5] = rtb_BusAssignment_logic_lgciu_own_valid;
    rtb_VectorConcatenate_i[6] = rtb_AND1;
    rtb_VectorConcatenate_i[7] = rtb_y_b4;
    rtb_VectorConcatenate_i[8] = rtb_Switch_io_idx_1;
    rtb_VectorConcatenate_i[9] = rtb_Switch_io_idx_2;
    rtb_VectorConcatenate_i[10] = rtb_BusAssignment_m_logic_sfcc_own_valid;
    rtb_VectorConcatenate_i[11] = rtb_AND1_d;
    rtb_VectorConcatenate_i[12] = A380FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate_i[13] = A380FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate_i[14] = A380FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate_i[15] = A380FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate_i[16] = A380FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate_i[17] = A380FacComputer_P.Constant19_Value;
    rtb_VectorConcatenate_i[18] = (A380FacComputer_DWork.sAlphaFloor != 0.0);
    A380FacComputer_MATLABFunction_g3(rtb_VectorConcatenate_i, &A380FacComputer_Y.out.bus_outputs.discrete_word_5.Data);
    A380FacComputer_Y.out.data = A380FacComputer_U.in;
    A380FacComputer_Y.out.laws.yaw_damper_command_deg = rtb_Y_br;
    A380FacComputer_Y.out.laws.rudder_trim_command_deg = rtb_Y_l;
    A380FacComputer_Y.out.laws.rudder_travel_lim_command_deg = rtb_Y_g4;
    A380FacComputer_Y.out.logic.lgciu_own_valid = rtb_BusAssignment_logic_lgciu_own_valid;
    A380FacComputer_Y.out.logic.all_lgciu_lost = rtb_AND1;
    A380FacComputer_Y.out.logic.left_main_gear_pressed = rtb_y_b4;
    A380FacComputer_Y.out.logic.right_main_gear_pressed = rtb_Switch_io_idx_1;
    A380FacComputer_Y.out.logic.main_gear_out = rtb_Switch_io_idx_2;
    A380FacComputer_Y.out.logic.sfcc_own_valid = rtb_BusAssignment_m_logic_sfcc_own_valid;
    A380FacComputer_Y.out.logic.all_sfcc_lost = rtb_AND1_d;
    A380FacComputer_Y.out.logic.flap_handle_index = rtb_Switch_i_idx_0;
    A380FacComputer_Y.out.logic.flap_angle_deg = rtb_Switch_i_idx_1;
    A380FacComputer_Y.out.logic.slat_angle_deg = rtb_Switch_i_idx_2;
    A380FacComputer_Y.out.logic.slat_flap_actual_pos = rtb_Switch_i_idx_3;
    A380FacComputer_Y.out.logic.on_ground = rtb_BusAssignment_h_logic_on_ground;
    A380FacComputer_Y.out.logic.tracking_mode_on = (A380FacComputer_U.in.sim_data.slew_on ||
      A380FacComputer_U.in.sim_data.pause_on || A380FacComputer_U.in.sim_data.tracking_mode_on_override);
    A380FacComputer_Y.out.logic.double_self_detected_adr_failure = ((rtb_Memory && rtb_DataTypeConversion_gi) ||
      (rtb_Memory && rtb_DataTypeConversion_l5) || (rtb_DataTypeConversion_gi && rtb_DataTypeConversion_l5));
    A380FacComputer_Y.out.logic.double_self_detected_ir_failure = ((rtb_DataTypeConversion_o &&
      rtb_DataTypeConversion_f5) || (rtb_DataTypeConversion_o && rtb_DataTypeConversion_l3) ||
      (rtb_DataTypeConversion_f5 && rtb_DataTypeConversion_l3));
    A380FacComputer_Y.out.logic.double_not_self_detected_adr_failure = A380FacComputer_P.Constant_Value_h;
    A380FacComputer_Y.out.logic.double_not_self_detected_ir_failure = A380FacComputer_P.Constant_Value_h;
    A380FacComputer_Y.out.logic.adr_computation_data.V_ias_kn = rtb_V_ias;
    A380FacComputer_Y.out.logic.adr_computation_data.V_tas_kn = rtb_V_tas;
    A380FacComputer_Y.out.logic.adr_computation_data.mach = rtb_mach;
    A380FacComputer_Y.out.logic.adr_computation_data.alpha_deg = rtb_alpha;
    A380FacComputer_Y.out.logic.adr_computation_data.p_s_c_hpa = rtb_p_s_c;
    A380FacComputer_Y.out.logic.adr_computation_data.altitude_corrected_ft = rtb_alt;
    A380FacComputer_Y.out.logic.ir_computation_data.theta_deg = rtb_theta;
    A380FacComputer_Y.out.logic.ir_computation_data.phi_deg = rtb_phi;
    A380FacComputer_Y.out.logic.ir_computation_data.q_deg_s = rtb_q;
    A380FacComputer_Y.out.logic.ir_computation_data.r_deg_s = rtb_r;
    A380FacComputer_Y.out.logic.ir_computation_data.n_x_g = rtb_n_x;
    A380FacComputer_Y.out.logic.ir_computation_data.n_y_g = rtb_n_y;
    A380FacComputer_Y.out.logic.ir_computation_data.n_z_g = rtb_n_z;
    A380FacComputer_Y.out.logic.ir_computation_data.theta_dot_deg_s = rtb_theta_dot;
    A380FacComputer_Y.out.logic.ir_computation_data.phi_dot_deg_s = rtb_phi_dot;
    A380FacComputer_Y.out.logic.yaw_damper_engaged = rtb_yawDamperEngaged;
    A380FacComputer_Y.out.logic.yaw_damper_can_engage = yawDamperCanEngage;
    A380FacComputer_Y.out.logic.yaw_damper_has_priority = yawDamperHasPriority;
    A380FacComputer_Y.out.logic.rudder_trim_engaged = rtb_rudderTrimEngaged;
    A380FacComputer_Y.out.logic.rudder_trim_can_engage = rudderTrimCanEngage;
    A380FacComputer_Y.out.logic.rudder_trim_has_priority = rudderTrimHasPriority;
    A380FacComputer_Y.out.logic.rudder_travel_lim_engaged = rtb_rudderTravelLimEngaged;
    A380FacComputer_Y.out.logic.rudder_travel_lim_can_engage = rudderTravelLimCanEngage;
    A380FacComputer_Y.out.logic.rudder_travel_lim_has_priority = rudderTravelLimHasPriority;
    A380FacComputer_Y.out.logic.speed_scale_lost = A380FacComputer_P.Constant_Value_b5;
    A380FacComputer_Y.out.logic.speed_scale_visible = rtb_BusAssignment_d_logic_speed_scale_visible;
    A380FacComputer_Y.out.flight_envelope.estimated_beta_deg = Vcas;
    A380FacComputer_Y.out.flight_envelope.beta_target_deg = rtb_beta;
    A380FacComputer_Y.out.flight_envelope.beta_target_visible = rtb_BusAssignment_d_flight_envelope_beta_target_visible;
    A380FacComputer_Y.out.flight_envelope.alpha_floor_condition = (A380FacComputer_DWork.sAlphaFloor != 0.0);
    A380FacComputer_Y.out.flight_envelope.alpha_filtered_deg = rtb_BusAssignment_d_flight_envelope_alpha_filtered_deg;
    A380FacComputer_Y.out.flight_envelope.computed_weight_lbs = rtb_DataTypeConversion2;
    A380FacComputer_Y.out.flight_envelope.computed_cg_percent =
      A380FacComputer_U.in.bus_inputs.fmgc_own_bus.fm_cg_percent.Data;
    A380FacComputer_Y.out.flight_envelope.v_alpha_max_kn = rtb_BusAssignment_f_flight_envelope_v_alpha_max_kn;
    A380FacComputer_Y.out.flight_envelope.v_alpha_prot_kn = rtb_BusAssignment_kv_flight_envelope_v_alpha_prot_kn;
    A380FacComputer_Y.out.flight_envelope.v_stall_warn_kn = rtb_Switch;
    A380FacComputer_Y.out.flight_envelope.v_ls_kn = rtb_BusAssignment_c_flight_envelope_v_ls_kn;
    A380FacComputer_Y.out.flight_envelope.v_stall_kn = rtb_BusAssignment_f_flight_envelope_v_stall_kn;
    A380FacComputer_Y.out.flight_envelope.v_3_kn = rtb_Switch1;
    A380FacComputer_Y.out.flight_envelope.v_3_visible = rtb_BusAssignment_f_flight_envelope_v_3_visible;
    A380FacComputer_Y.out.flight_envelope.v_4_kn = rtb_vs1g_h;
    A380FacComputer_Y.out.flight_envelope.v_4_visible = ((rtb_Switch_i_idx_0 ==
      A380FacComputer_P.CompareToConstant3_const) || (rtb_Switch_i_idx_0 == A380FacComputer_P.CompareToConstant1_const));
    A380FacComputer_Y.out.flight_envelope.v_man_kn = rtb_conf;
    A380FacComputer_Y.out.flight_envelope.v_man_visible = rtb_DataTypeConversion_kr;
    A380FacComputer_Y.out.flight_envelope.v_max_kn = rtb_Switch4_f;
    A380FacComputer_Y.out.flight_envelope.v_fe_next_kn = rtb_BusAssignment_f_flight_envelope_v_fe_next_kn;
    A380FacComputer_Y.out.flight_envelope.v_fe_next_visible = rtb_OR1;
    A380FacComputer_Y.out.flight_envelope.v_c_trend_kn = rtb_Switch_b;
    A380FacComputer_Y.out.discrete_outputs.fac_healthy = A380FacComputer_P.Constant2_Value_o;
    A380FacComputer_Y.out.discrete_outputs.yaw_damper_engaged = rtb_yawDamperEngaged;
    A380FacComputer_Y.out.discrete_outputs.rudder_trim_engaged = rtb_rudderTrimEngaged;
    A380FacComputer_Y.out.discrete_outputs.rudder_travel_lim_engaged = rtb_rudderTravelLimEngaged;
    A380FacComputer_Y.out.discrete_outputs.rudder_travel_lim_emergency_reset = A380FacComputer_P.Constant1_Value_d;
    A380FacComputer_Y.out.discrete_outputs.yaw_damper_avail_for_norm_law = yawDamperCanEngage;
    if (rtb_yawDamperEngaged) {
      A380FacComputer_Y.out.analog_outputs.yaw_damper_order_deg = rtb_Y_br;
    } else {
      A380FacComputer_Y.out.analog_outputs.yaw_damper_order_deg = A380FacComputer_P.Constant_Value_b;
    }

    if (rtb_rudderTrimEngaged) {
      A380FacComputer_Y.out.analog_outputs.rudder_trim_order_deg = rtb_Y_l;
    } else {
      A380FacComputer_Y.out.analog_outputs.rudder_trim_order_deg = A380FacComputer_P.Constant_Value_b;
    }

    if (rtb_rudderTravelLimEngaged) {
      A380FacComputer_Y.out.analog_outputs.rudder_travel_limit_order_deg = rtb_Y_g4;
    } else {
      A380FacComputer_Y.out.analog_outputs.rudder_travel_limit_order_deg = A380FacComputer_P.Constant_Value_b;
    }

    if (rtb_BusAssignment_m_logic_sfcc_own_valid) {
      A380FacComputer_Y.out.bus_outputs.discrete_word_1.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant1_Value);
    } else {
      A380FacComputer_Y.out.bus_outputs.discrete_word_1.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant_Value);
    }

    A380FacComputer_Y.out.bus_outputs.discrete_word_1.Data = rtb_Switch_i_idx_3;
    A380FacComputer_Y.out.bus_outputs.gamma_a_deg.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.gamma_a_deg.Data = A380FacComputer_P.Constant28_Value;
    A380FacComputer_Y.out.bus_outputs.gamma_t_deg.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.gamma_t_deg.Data = A380FacComputer_P.Constant22_Value;
    A380FacComputer_Y.out.bus_outputs.total_weight_lbs.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.total_weight_lbs.Data = A380FacComputer_P.Constant21_Value;
    A380FacComputer_Y.out.bus_outputs.center_of_gravity_pos_percent.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.center_of_gravity_pos_percent.Data = A380FacComputer_P.Constant4_Value_b;
    if (A380FacComputer_P.Constant_Value_d > A380FacComputer_P.Switch7_Threshold) {
      A380FacComputer_Y.out.bus_outputs.sideslip_target_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant2_Value);
    } else if (rtb_BusAssignment_d_flight_envelope_beta_target_visible) {
      A380FacComputer_Y.out.bus_outputs.sideslip_target_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant1_Value);
    } else {
      A380FacComputer_Y.out.bus_outputs.sideslip_target_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant_Value);
    }

    A380FacComputer_Y.out.bus_outputs.sideslip_target_deg.Data = static_cast<real32_T>(rtb_beta);
    if (rtb_BusAssignment_m_logic_sfcc_own_valid) {
      A380FacComputer_Y.out.bus_outputs.fac_slat_angle_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant1_Value);
    } else {
      A380FacComputer_Y.out.bus_outputs.fac_slat_angle_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant_Value);
    }

    A380FacComputer_Y.out.bus_outputs.fac_slat_angle_deg.Data = rtb_Switch_i_idx_2;
    if (rtb_BusAssignment_m_logic_sfcc_own_valid) {
      A380FacComputer_Y.out.bus_outputs.fac_flap_angle_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant1_Value);
    } else {
      A380FacComputer_Y.out.bus_outputs.fac_flap_angle_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant_Value);
    }

    A380FacComputer_Y.out.bus_outputs.fac_flap_angle_deg.Data = rtb_Switch_i_idx_1;
    A380FacComputer_Y.out.bus_outputs.discrete_word_2.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.discrete_word_2.Data = rtb_y_a;
    A380FacComputer_Y.out.bus_outputs.rudder_travel_limit_command_deg.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.rudder_travel_limit_command_deg.Data = static_cast<real32_T>
      (A380FacComputer_U.in.analog_inputs.rudder_travel_lim_position_deg);
    A380FacComputer_Y.out.bus_outputs.delta_r_yaw_damper_deg.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.delta_r_yaw_damper_deg.Data = A380FacComputer_P.Constant26_Value;
    if (A380FacComputer_P.Constant1_Value_l > A380FacComputer_P.Switch6_Threshold) {
      A380FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant2_Value);
    } else {
      A380FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.SSM = static_cast<uint32_T>
        (A380FacComputer_P.EnumeratedConstant1_Value);
    }

    A380FacComputer_Y.out.bus_outputs.estimated_sideslip_deg.Data = static_cast<real32_T>(Vcas);
    A380FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.SSM = static_cast<uint32_T>(rtb_alpha_floor_inhib);
    A380FacComputer_Y.out.bus_outputs.v_alpha_lim_kn.Data = static_cast<real32_T>
      (rtb_BusAssignment_f_flight_envelope_v_alpha_max_kn);
    A380FacComputer_Y.out.bus_outputs.v_ls_kn.SSM = static_cast<uint32_T>(rtb_v_ls_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.v_ls_kn.Data = static_cast<real32_T>(rtb_BusAssignment_c_flight_envelope_v_ls_kn);
    A380FacComputer_Y.out.bus_outputs.v_stall_kn.SSM = static_cast<uint32_T>(rtb_v_stall_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.v_stall_kn.Data = static_cast<real32_T>
      (rtb_BusAssignment_f_flight_envelope_v_stall_kn);
    A380FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.SSM = static_cast<uint32_T>(rtb_v_alpha_prot_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.v_alpha_prot_kn.Data = static_cast<real32_T>
      (rtb_BusAssignment_kv_flight_envelope_v_alpha_prot_kn);
    A380FacComputer_Y.out.bus_outputs.v_stall_warn_kn.SSM = static_cast<uint32_T>(rtb_v_stall_warn_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.v_stall_warn_kn.Data = static_cast<real32_T>(rtb_Switch);
    A380FacComputer_Y.out.bus_outputs.speed_trend_kn.SSM = static_cast<uint32_T>(rtb_speed_trend_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.speed_trend_kn.Data = static_cast<real32_T>(rtb_Switch_b);
    A380FacComputer_Y.out.bus_outputs.v_3_kn.SSM = static_cast<uint32_T>(rtb_v_3_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.v_3_kn.Data = static_cast<real32_T>(rtb_Switch1);
    A380FacComputer_Y.out.bus_outputs.v_4_kn.SSM = static_cast<uint32_T>(rtb_v_4_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.v_4_kn.Data = static_cast<real32_T>(rtb_vs1g_h);
    A380FacComputer_Y.out.bus_outputs.v_man_kn.SSM = static_cast<uint32_T>(rtb_v_man_kn_SSM);
    A380FacComputer_Y.out.bus_outputs.v_man_kn.Data = static_cast<real32_T>(rtb_conf);
    A380FacComputer_Y.out.bus_outputs.v_max_kn.Data = static_cast<real32_T>(rtb_Switch4_f);
    A380FacComputer_Y.out.bus_outputs.v_fe_next_kn.Data = static_cast<real32_T>
      (rtb_BusAssignment_f_flight_envelope_v_fe_next_kn);
    A380FacComputer_Y.out.bus_outputs.discrete_word_3.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.discrete_word_3.Data = rtb_y_oi;
    A380FacComputer_Y.out.bus_outputs.discrete_word_4.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.discrete_word_5.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.delta_r_rudder_trim_deg.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.delta_r_rudder_trim_deg.Data = static_cast<real32_T>(rtb_Y_l);
    A380FacComputer_Y.out.bus_outputs.rudder_trim_pos_deg.SSM = static_cast<uint32_T>
      (A380FacComputer_P.EnumeratedConstant1_Value);
    A380FacComputer_Y.out.bus_outputs.rudder_trim_pos_deg.Data = static_cast<real32_T>
      (A380FacComputer_U.in.analog_inputs.rudder_trim_position_deg);
    A380FacComputer_DWork.Delay_DSTATE = rtb_Gain;
    A380FacComputer_DWork.Delay_DSTATE_d = rtb_vs1g;
    A380FacComputer_DWork.icLoad = false;
  } else {
    A380FacComputer_DWork.Runtime_MODE = false;
  }
}

void A380FacComputer::initialize()
{
  A380FacComputer_DWork.Delay_DSTATE = A380FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition;
  A380FacComputer_DWork.Delay_DSTATE_d = A380FacComputer_P.DiscreteDerivativeVariableTs_InitialCondition_l;
  A380FacComputer_DWork.Memory_PreviousInput = A380FacComputer_P.SRFlipFlop_initial_condition;
  A380FacComputer_DWork.icLoad = true;
  A380FacComputer_Y.out = A380FacComputer_P.out_Y0;
}

void A380FacComputer::terminate()
{
}

A380FacComputer::A380FacComputer():
  A380FacComputer_U(),
  A380FacComputer_Y(),
  A380FacComputer_DWork()
{
}

A380FacComputer::~A380FacComputer() = default;
